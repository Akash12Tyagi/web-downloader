import { execFile, spawn } from 'child_process';
import { createInterface } from 'readline';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { config } from '../config';
import { AppError, type AnalyzeResult, type Platform } from '../types';
import { estimateSizeBytes, formatDuration, nearestStandardHeight } from '../utils/format';
import { hashUrl } from '../utils/url';
import { logger } from '../utils/logger';

interface RawFormat {
  format_id: string;
  ext: string;
  height?: number | null;
  width?: number | null;
  vcodec?: string;
  acodec?: string;
  fps?: number | null;
  filesize?: number | null;
  filesize_approx?: number | null;
  tbr?: number | null;
  abr?: number | null;
  protocol?: string;
  format_note?: string;
}

interface RawInfo {
  id: string;
  title?: string;
  thumbnail?: string;
  thumbnails?: { url: string }[];
  uploader?: string;
  channel?: string;
  duration?: number;
  description?: string;
  formats?: RawFormat[];
  entries?: RawInfo[];
  url?: string;
  ext?: string;
  webpage_url?: string;
  _type?: string;
}

function mapYtDlpError(stderr: string): AppError {
  const s = stderr.toLowerCase();
  if (
    s.includes('private video') ||
    s.includes('login required') ||
    s.includes('this account is private')
  ) {
    return new AppError('This content is private and can’t be accessed.', 403, 'PRIVATE_CONTENT');
  }
  if (s.includes('age') && s.includes('restrict')) {
    return new AppError(
      'This content is age-restricted and can’t be downloaded without authentication.',
      403,
      'AGE_RESTRICTED',
    );
  }
  if (
    s.includes('video unavailable') ||
    s.includes('has been removed') ||
    s.includes('not available')
  ) {
    return new AppError('This content is unavailable or has been removed.', 404, 'CONTENT_REMOVED');
  }
  if (
    s.includes('empty media response') ||
    s.includes('unable to extract data') ||
    (s.includes('instagram') && (s.includes('rate') || s.includes('checkpoint')))
  ) {
    return new AppError(
      'Instagram is blocking anonymous requests for this content. Ask the server admin to configure INSTAGRAM_COOKIES_PATH with a logged-in cookies.txt file.',
      403,
      'IG_AUTH_REQUIRED',
    );
  }
  if (s.includes('unsupported url')) {
    return new AppError('This URL isn’t supported.', 422, 'UNSUPPORTED_PLATFORM');
  }
  if (s.includes('timed out') || s.includes('timeout')) {
    return new AppError('The request timed out. Please try again.', 504, 'TIMEOUT');
  }
  if (s.includes('unable to download webpage') || s.includes('network')) {
    return new AppError(
      'A network error occurred while fetching this content.',
      502,
      'NETWORK_ERROR',
    );
  }
  return new AppError(
    'Couldn’t process this link. It may be invalid or unsupported.',
    422,
    'PROCESSING_ERROR',
  );
}

function runYtDlpJson(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      config.ytDlpPath,
      args,
      { maxBuffer: 1024 * 1024 * 64, timeout: 45_000 },
      (error, stdout, stderr) => {
        if (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            reject(new AppError('yt-dlp is not installed on the server.', 500, 'BINARY_MISSING'));
            return;
          }
          reject(mapYtDlpError(stderr || error.message));
          return;
        }
        resolve(stdout);
      },
    );
  });
}

/** Instagram now rejects most anonymous scraping; attach a cookies.txt file when configured. */
export function cookieArgsFor(platform: Platform): string[] {
  if (platform === 'instagram' && config.instagramCookiesPath) {
    return ['--cookies', config.instagramCookiesPath];
  }
  return [];
}

function pickThumbnail(info: RawInfo): string | null {
  if (info.thumbnail) return info.thumbnail;
  if (info.thumbnails?.length) return info.thumbnails[info.thumbnails.length - 1].url;
  return null;
}

function buildQualities(
  formats: RawFormat[],
  durationSeconds: number | null,
): AnalyzeResult['qualities'] {
  const videoFormats = formats.filter((f) => f.vcodec && f.vcodec !== 'none' && f.height);
  const byHeight = new Map<number, RawFormat>();

  for (const f of videoFormats) {
    const bucket = nearestStandardHeight(f.height);
    if (!bucket) continue;
    const existing = byHeight.get(bucket);
    // Prefer: has audio already muxed, then higher bitrate/filesize
    const score = (fmt: RawFormat) =>
      (fmt.acodec && fmt.acodec !== 'none' ? 1000 : 0) + (fmt.tbr ?? 0);
    if (!existing || score(f) > score(existing)) {
      byHeight.set(bucket, f);
    }
  }

  return [...byHeight.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([height, f]) => ({
      formatId: f.format_id,
      label: `${height}p`,
      height,
      container: f.ext,
      codec: f.vcodec ?? 'unknown',
      hasAudio: !!(f.acodec && f.acodec !== 'none'),
      fps: f.fps ?? null,
      estimatedSizeBytes:
        f.filesize ?? f.filesize_approx ?? estimateSizeBytes(f.tbr, durationSeconds),
    }));
}

function buildAudioOptions(
  formats: RawFormat[],
  durationSeconds: number | null,
): AnalyzeResult['audio'] {
  const audioFormats = formats.filter(
    (f) => (!f.vcodec || f.vcodec === 'none') && f.acodec && f.acodec !== 'none',
  );
  const bestSourceAbr = audioFormats.reduce((max, f) => Math.max(max, f.abr ?? 0), 0);

  const options: AnalyzeResult['audio'] = [128, 192, 256, 320].map((bitrate) => ({
    formatId: `mp3-${bitrate}`,
    label: `MP3 · ${bitrate}kbps`,
    format: 'mp3' as const,
    bitrateKbps: bitrate,
    estimatedSizeBytes: estimateSizeBytes(bitrate, durationSeconds),
  }));

  options.push({
    formatId: 'source-m4a',
    label: `M4A (AAC)${bestSourceAbr ? ` · ~${Math.round(bestSourceAbr)}kbps` : ''}`,
    format: 'm4a',
    bitrateKbps: bestSourceAbr || null,
    estimatedSizeBytes: estimateSizeBytes(bestSourceAbr || 160, durationSeconds),
  });

  return options;
}

function mapSingleItem(info: RawInfo, platform: Platform, url: string): AnalyzeResult {
  const duration = info.duration ?? null;
  const formats = info.formats ?? [];
  const isImagePost =
    formats.length === 0 &&
    !!info.url &&
    (info.ext ? ['jpg', 'jpeg', 'png', 'webp'].includes(info.ext) : false);

  return {
    sourceId: hashUrl(url),
    url,
    platform,
    title: info.title ?? 'Untitled',
    thumbnail: pickThumbnail(info),
    uploader: info.uploader ?? info.channel ?? null,
    durationSeconds: duration,
    durationLabel: formatDuration(duration),
    caption: platform === 'instagram' ? (info.description ?? null) : null,
    isCarousel: false,
    carousel: isImagePost
      ? [
          {
            index: 0,
            type: 'image',
            thumbnail: pickThumbnail(info),
            formatId: null,
            directUrl: info.url ?? null,
            durationSeconds: null,
          },
        ]
      : [],
    qualities: isImagePost ? [] : buildQualities(formats, duration),
    audio:
      isImagePost || (platform === 'instagram' && formats.length === 0)
        ? []
        : buildAudioOptions(formats, duration),
    fetchedAt: Date.now(),
  };
}

function mapCarousel(info: RawInfo, platform: Platform, url: string): AnalyzeResult {
  const entries = info.entries ?? [];
  const first = entries[0];

  return {
    sourceId: hashUrl(url),
    url,
    platform,
    title: info.title ?? first?.title ?? 'Instagram post',
    thumbnail: pickThumbnail(info) ?? (first ? pickThumbnail(first) : null),
    uploader: info.uploader ?? first?.uploader ?? null,
    durationSeconds: null,
    durationLabel: null,
    caption: info.description ?? null,
    isCarousel: true,
    carousel: entries.map((entry, index) => {
      const formats = entry.formats ?? [];
      const bestVideo = formats
        .filter((f) => f.vcodec && f.vcodec !== 'none')
        .sort((a, b) => (b.tbr ?? 0) - (a.tbr ?? 0))[0];
      const isImage = !bestVideo && !!entry.url;
      return {
        index,
        type: isImage ? ('image' as const) : ('video' as const),
        thumbnail: pickThumbnail(entry),
        formatId: bestVideo?.format_id ?? null,
        directUrl: isImage ? (entry.url ?? null) : null,
        durationSeconds: entry.duration ?? null,
      };
    }),
    qualities: [],
    audio: [],
    fetchedAt: Date.now(),
  };
}

export async function analyzeUrl(url: string, platform: Platform): Promise<AnalyzeResult> {
  const args = ['-J', '--no-warnings', '--socket-timeout', '20', ...cookieArgsFor(platform)];
  if (platform === 'youtube') args.push('--no-playlist');
  args.push(url);

  const stdout = await runYtDlpJson(args);
  let info: RawInfo;
  try {
    info = JSON.parse(stdout);
  } catch (err) {
    logger.error('Failed to parse yt-dlp output', { err: String(err) });
    throw new AppError('Couldn’t read metadata for this link.', 502, 'PARSE_ERROR');
  }

  if (info._type === 'playlist' && info.entries && info.entries.length > 1) {
    return mapCarousel(info, platform, url);
  }

  const single = info.entries?.[0] ?? info;
  return mapSingleItem(single, platform, url);
}

export async function downloadDirectFile(
  url: string,
  destPath: string,
  signal: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (err) {
    if (signal.aborted) throw new AppError('Download was canceled.', 499, 'CANCELED');
    throw new AppError('A network error occurred while fetching this media.', 502, 'NETWORK_ERROR');
  }

  if (!response.ok || !response.body) {
    throw new AppError('The media file could not be fetched.', 502, 'NETWORK_ERROR');
  }

  await pipeline(
    Readable.fromWeb(response.body as import('stream/web').ReadableStream),
    fs.createWriteStream(destPath),
  );
}

export interface ProgressUpdate {
  status: 'downloading' | 'converting';
  progress: number;
  speed: string | null;
  eta: string | null;
}

const DOWNLOAD_LINE = /\[download]\s+(\d{1,3}(?:\.\d)?)%/;
const DEST_LINE = /Destination:\s+(.+)$/;
const MERGE_LINE = /\[Merger]\s+Merging formats into\s+"(.+)"/;
const SPEED_ETA = /at\s+([\d.]+\w+\/s|Unknown speed)\s+ETA\s+(\S+)/;

export function downloadWithArgs(
  url: string,
  extraArgs: string[],
  outputTemplate: string,
  onProgress: (update: ProgressUpdate) => void,
  signal: AbortSignal,
): Promise<{ filePath: string }> {
  return new Promise((resolve, reject) => {
    const args = [
      '--no-warnings',
      '--newline',
      '--no-part',
      '-o',
      outputTemplate,
      ...extraArgs,
      url,
    ];

    const child = spawn(config.ytDlpPath, args, { signal });
    let finalPath: string | null = null;
    let stderrBuf = '';
    let converting = false;

    const rl = createInterface({ input: child.stdout });
    rl.on('line', (line) => {
      const destMatch = line.match(DEST_LINE);
      if (destMatch) finalPath = destMatch[1].trim();

      const mergeMatch = line.match(MERGE_LINE);
      if (mergeMatch) finalPath = mergeMatch[1].trim();

      if (/\[Merger]|\[ExtractAudio]|\[ffmpeg]|\[VideoConvertor]/.test(line)) {
        converting = true;
        onProgress({ status: 'converting', progress: 95, speed: null, eta: null });
        return;
      }

      const dlMatch = line.match(DOWNLOAD_LINE);
      if (dlMatch && !converting) {
        const percent = Math.min(99, Math.round(parseFloat(dlMatch[1])));
        const speedEta = line.match(SPEED_ETA);
        onProgress({
          status: 'downloading',
          progress: percent,
          speed: speedEta?.[1] ?? null,
          eta: speedEta?.[2] ?? null,
        });
      }
    });

    child.stderr.on('data', (chunk) => {
      stderrBuf += chunk.toString();
    });

    child.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new AppError('yt-dlp is not installed on the server.', 500, 'BINARY_MISSING'));
        return;
      }
      reject(err);
    });

    child.on('close', (code) => {
      if (signal.aborted) {
        reject(new AppError('Download was canceled.', 499, 'CANCELED'));
        return;
      }
      if (code !== 0) {
        reject(mapYtDlpError(stderrBuf));
        return;
      }
      if (!finalPath) {
        reject(
          new AppError(
            'Download finished but the output file could not be located.',
            500,
            'FILE_NOT_FOUND',
          ),
        );
        return;
      }
      resolve({ filePath: finalPath });
    });
  });
}
