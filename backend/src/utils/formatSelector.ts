import type { DownloadRequest } from '../types';

export interface DownloadPlan {
  args: string[];
  extension: string;
}

/** Translates a download request into yt-dlp CLI arguments (format selector + postprocessors). */
export function buildDownloadPlan(request: DownloadRequest): DownloadPlan {
  if (request.kind === 'image') {
    // Handled by a direct HTTP fetch in queue.service — yt-dlp is not invoked for images.
    return { args: [], extension: 'jpg' };
  }

  if (request.kind === 'audio') {
    if (request.audioFormat === 'm4a') {
      return {
        args: ['-f', 'bestaudio[ext=m4a]/bestaudio', '-x', '--audio-format', 'm4a'],
        extension: 'm4a',
      };
    }
    const bitrate = request.audioBitrateKbps ?? 192;
    return {
      args: [
        '-f',
        'bestaudio/best',
        '-x',
        '--audio-format',
        'mp3',
        '--audio-quality',
        String(bitrate),
      ],
      extension: 'mp3',
    };
  }

  // Video downloads. When targeting a single carousel entry, restrict yt-dlp to that playlist item.
  const playlistArgs =
    request.carouselIndex != null ? ['--playlist-items', String(request.carouselIndex + 1)] : [];

  if (request.formatId === 'highest') {
    return {
      args: [...playlistArgs, '-f', 'bestvideo+bestaudio/best', '--merge-output-format', 'mp4'],
      extension: 'mp4',
    };
  }

  if (request.formatId === 'video-only') {
    return {
      args: [...playlistArgs, '-f', 'bestvideo', '--merge-output-format', 'mp4'],
      extension: 'mp4',
    };
  }

  if (request.carouselIndex != null) {
    // Carousel entries typically expose a single already-muxed format; don't force an audio pairing.
    return {
      args: [...playlistArgs, '-f', `${request.formatId}/best`, '--merge-output-format', 'mp4'],
      extension: 'mp4',
    };
  }

  return {
    args: [
      '-f',
      `${request.formatId}+bestaudio/${request.formatId}/best`,
      '--merge-output-format',
      'mp4',
    ],
    extension: 'mp4',
  };
}
