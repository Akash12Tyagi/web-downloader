export type Platform = 'youtube' | 'instagram';

export type JobStatus =
  'queued' | 'preparing' | 'downloading' | 'converting' | 'ready' | 'failed' | 'canceled';

export type DownloadKind = 'video' | 'audio' | 'image';

export interface QualityOption {
  formatId: string;
  label: string;
  height: number | null;
  container: string;
  codec: string;
  hasAudio: boolean;
  fps: number | null;
  estimatedSizeBytes: number | null;
}

export interface AudioOption {
  formatId: string;
  label: string;
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
  sourceId: string;
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
  cached?: boolean;
}

export interface DownloadRequestPayload {
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

export interface ProgressResponse {
  id: string;
  status: JobStatus;
  progress: number;
  speed: string | null;
  eta: string | null;
  error: string | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  downloadUrl: string | null;
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

export interface ApiErrorShape {
  error: string;
  code: string;
}

/** Client-side tracked download, merges the server job with UI metadata. */
export interface TrackedDownload {
  jobId: string;
  title: string;
  platform: Platform;
  kind: DownloadKind;
  qualityLabel: string;
  thumbnail: string | null;
  status: JobStatus;
  progress: number;
  speed: string | null;
  eta: string | null;
  error: string | null;
  downloadUrl: string | null;
  fileSizeBytes: number | null;
  createdAt: number;
  payload: DownloadRequestPayload;
  autoDownloadTriggered?: boolean;
}

export interface Settings {
  defaultFormat: 'mp4' | 'mp3' | 'm4a';
  defaultQuality: 'highest' | '1080p' | '720p' | '480p';
  concurrentDownloads: number;
  language: 'en' | 'es' | 'fr' | 'de' | 'hi';
}
