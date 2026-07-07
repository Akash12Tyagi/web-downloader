import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  ytDlpPath: process.env.YT_DLP_PATH ?? 'yt-dlp',
  ffmpegPath: process.env.FFMPEG_PATH ?? 'ffmpeg',
  instagramCookiesPath: process.env.INSTAGRAM_COOKIES_PATH || null,
  tmpDir: process.env.TMP_DIR ?? path.join(__dirname, '..', '..', 'tmp'),
  maxConcurrentDownloads: Number(process.env.MAX_CONCURRENT_DOWNLOADS ?? 3),
  jobTtlMs: Number(process.env.JOB_TTL_MS ?? 30 * 60 * 1000), // 30 min
  fileTtlMs: Number(process.env.FILE_TTL_MS ?? 15 * 60 * 1000), // 15 min after ready
  analyzeCacheTtlMs: Number(process.env.ANALYZE_CACHE_TTL_MS ?? 5 * 60 * 1000),
  historyLimit: Number(process.env.HISTORY_LIMIT ?? 20),
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60 * 1000),
    analyzeMax: Number(process.env.RATE_LIMIT_ANALYZE_MAX ?? 15),
    downloadMax: Number(process.env.RATE_LIMIT_DOWNLOAD_MAX ?? 10),
    generalMax: Number(process.env.RATE_LIMIT_GENERAL_MAX ?? 120),
  },
};
