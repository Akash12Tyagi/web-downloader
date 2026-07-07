import { createHash } from 'crypto';
import { AppError } from '../types';
import type { Platform } from '../types';

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'music.youtube.com',
]);

const INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com']);

export function detectPlatform(rawUrl: string): Platform {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new AppError('That link doesn’t look like a valid URL.', 400, 'INVALID_URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new AppError('Only http/https links are supported.', 400, 'INVALID_URL');
  }

  const host = parsed.hostname.toLowerCase();

  if (YOUTUBE_HOSTS.has(host)) return 'youtube';
  if (INSTAGRAM_HOSTS.has(host)) return 'instagram';

  throw new AppError(
    'This URL isn’t from a supported platform yet. We currently support YouTube and Instagram.',
    422,
    'UNSUPPORTED_PLATFORM',
  );
}

/** Strips tracking params and normalizes the URL for caching / hashing. */
export function sanitizeUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl.trim());
  const allowedParams = new Set(['v', 't', 'list']);
  const stripped = new URLSearchParams();
  for (const [key, value] of parsed.searchParams.entries()) {
    if (allowedParams.has(key)) stripped.set(key, value);
  }
  const query = stripped.toString();
  return `${parsed.origin}${parsed.pathname}${query ? `?${query}` : ''}`;
}

export function hashUrl(url: string): string {
  return createHash('sha1').update(url).digest('hex').slice(0, 16);
}

export function sanitizeFileName(name: string): string {
  return (
    name
      .replace(/[/\\?%*:|"<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'download'
  );
}
