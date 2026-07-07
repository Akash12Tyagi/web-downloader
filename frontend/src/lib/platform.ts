import type { Platform } from './types';

const YOUTUBE_HOSTS = ['youtube.com', 'youtu.be', 'm.youtube.com', 'music.youtube.com'];
const INSTAGRAM_HOSTS = ['instagram.com'];

export function detectPlatformFromUrl(rawUrl: string): Platform | null {
  try {
    const { hostname } = new URL(rawUrl.trim());
    const host = hostname.toLowerCase().replace(/^www\./, '');
    if (YOUTUBE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return 'youtube';
    if (INSTAGRAM_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return 'instagram';
    return null;
  } catch {
    return null;
  }
}

export const PLATFORM_META: Record<
  Platform,
  { label: string; accent: string; placeholder: string }
> = {
  youtube: {
    label: 'YouTube',
    accent: '#ff3b3b',
    placeholder: 'Paste a YouTube video URL…',
  },
  instagram: {
    label: 'Instagram',
    accent: '#a34dff',
    placeholder: 'Paste an Instagram post, reel, or IGTV URL…',
  },
};
