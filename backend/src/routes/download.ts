import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { asyncHandler } from '../middleware/errorHandler';
import { downloadLimiter } from '../middleware/rateLimiter';
import { downloadSchema, jobIdParamSchema } from '../middleware/validate';
import { detectPlatform, sanitizeUrl } from '../utils/url';
import { AppError } from '../types';
import { cancelJob, enqueueDownload, getJob } from '../services/queue.service';

export const downloadRouter = Router();

downloadRouter.post(
  '/',
  downloadLimiter,
  asyncHandler(async (req, res) => {
    const body = downloadSchema.parse(req.body);
    const platform = detectPlatform(body.url);
    if (platform !== body.platform) {
      throw new AppError(
        'URL platform does not match the requested platform.',
        400,
        'PLATFORM_MISMATCH',
      );
    }
    const url = sanitizeUrl(body.url);

    const job = enqueueDownload({ ...body, url, platform });
    res.status(202).json({ jobId: job.id, status: job.status });
  }),
);

downloadRouter.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const { id } = jobIdParamSchema.parse(req.params);
    const canceled = cancelJob(id);
    if (!canceled) {
      throw new AppError('Job not found or already finished.', 404, 'JOB_NOT_FOUND');
    }
    res.json({ status: 'canceled' });
  }),
);

downloadRouter.get(
  '/file/:id',
  asyncHandler(async (req, res) => {
    const { id } = jobIdParamSchema.parse(req.params);
    const job = getJob(id);
    if (!job || job.status !== 'ready' || !job.filePath) {
      throw new AppError('File is not ready for download.', 404, 'FILE_NOT_READY');
    }
    if (!fs.existsSync(job.filePath)) {
      throw new AppError('File is no longer available. It may have expired.', 410, 'FILE_EXPIRED');
    }
    res.download(job.filePath, job.fileName ?? path.basename(job.filePath));
  }),
);

export const progressRouter = Router();

progressRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = jobIdParamSchema.parse(req.params);
    const job = getJob(id);
    if (!job) {
      throw new AppError('Job not found.', 404, 'JOB_NOT_FOUND');
    }
    res.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      speed: job.speed,
      eta: job.eta,
      error: job.error,
      fileName: job.fileName,
      fileSizeBytes: job.fileSizeBytes,
      downloadUrl: job.status === 'ready' ? `/api/download/file/${job.id}` : null,
    });
  }),
);
