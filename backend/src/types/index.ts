export type Platform = 'youtube' | 'instagram';

export type JobStatus =
  'queued' | 'preparing' | 'downloading' | 'converting' | 'ready' | 'failed' | 'canceled';

export type DownloadKind = 'video' | 'audio' | 'image';

export interface QualityOption {
  formatId: string;
  label: string; // "1080p"
  height: number | null;
  container: string; // mp4, webm...
  codec: string; // vp9, avc1...
  hasAudio: boolean;
  fps: number | null;
  estimatedSizeBytes: number | null;
}

export interface AudioOption {
  formatId: string; // "mp3-128", "mp3-192", "source-m4a"
  label: string; // "MP3 · 192kbps"
  format: 'mp3' | 'm4a';
  bitrateKbps: number | null;
  estimatedSizeBytes: number | null;
}

export interface CarouselItem {
  index: number;
  type: 'video' | 'image';
  thumbnail: string | null;
  formatId: string | null;
  directUrl: string | null;
  durationSeconds: number | null;
}

export interface AnalyzeResult {
  sourceId: string; // hash of URL, used for re-download lookups
  url: string;
  platform: Platform;
  title: string;
  thumbnail: string | null;
  uploader: string | null;
  durationSeconds: number | null;
  durationLabel: string | null;
  caption: string | null;
  isCarousel: boolean;
  carousel: CarouselItem[];
  qualities: QualityOption[];
  audio: AudioOption[];
  fetchedAt: number;
}

export interface DownloadRequest {
  url: string;
  platform: Platform;
  kind: DownloadKind;
  formatId: string;
  audioFormat?: 'mp3' | 'm4a';
  audioBitrateKbps?: number;
  carouselIndex?: number;
  mediaUrl?: string;
  title?: string;
}

export interface DownloadJob {
  id: string;
  url: string;
  platform: Platform;
  kind: DownloadKind;
  formatId: string;
  title: string;
  status: JobStatus;
  progress: number;
  speed: string | null;
  eta: string | null;
  error: string | null;
  filePath: string | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  thumbnail: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface HistoryEntry {
  id: string;
  title: string;
  platform: Platform;
  kind: DownloadKind;
  quality: string;
  thumbnail: string | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  createdAt: number;
  status: JobStatus;
}

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}
