import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { config } from '../config';
import { AppError, type DownloadJob, type DownloadRequest, type HistoryEntry } from '../types';
import { downloadDirectFile, downloadWithArgs } from './ytdlp.service';
import { buildDownloadPlan } from '../utils/formatSelector';
import { sanitizeFileName } from '../utils/url';
import { addHistoryEntry } from './history.service';
import { logger } from '../utils/logger';

const jobs = new Map<string, DownloadJob>();
const controllers = new Map<string, AbortController>();
const pendingQueue: string[] = [];
let activeCount = 0;

function touch(job: DownloadJob) {
  job.updatedAt = Date.now();
}

export function getJob(id: string): DownloadJob | undefined {
  return jobs.get(id);
}

export function listJobs(): DownloadJob[] {
  return [...jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function cancelJob(id: string): boolean {
  const job = jobs.get(id);
  if (!job) return false;
  if (job.status === 'ready' || job.status === 'failed' || job.status === 'canceled') return false;

  const controller = controllers.get(id);
  if (controller) controller.abort();

  const queuedIndex = pendingQueue.indexOf(id);
  if (queuedIndex !== -1) pendingQueue.splice(queuedIndex, 1);

  job.status = 'canceled';
  job.error = 'Canceled by user';
  touch(job);
  return true;
}

export function enqueueDownload(request: DownloadRequest): DownloadJob {
  const id = nanoid(10);
  const job: DownloadJob = {
    id,
    url: request.url,
    platform: request.platform,
    kind: request.kind,
    formatId: request.formatId,
    title: request.title ?? 'Untitled',
    status: 'queued',
    progress: 0,
    speed: null,
    eta: null,
    error: null,
    filePath: null,
    fileName: null,
    fileSizeBytes: null,
    thumbnail: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  jobs.set(id, job);
  pendingQueue.push(id);
  void processQueue(request);
  return job;
}

async function processQueue(request: DownloadRequest) {
  if (activeCount >= config.maxConcurrentDownloads) return;
  const nextId = pendingQueue.shift();
  if (!nextId) return;
  const job = jobs.get(nextId);
  if (!job || job.status === 'canceled') {
    void processQueue(request);
    return;
  }

  activeCount += 1;
  job.status = 'preparing';
  touch(job);

  const controller = new AbortController();
  controllers.set(job.id, controller);

  try {
    fs.mkdirSync(config.tmpDir, { recursive: true });
    const plan = buildDownloadPlan(request);
    const safeTitle = sanitizeFileName(job.title);

    let resolvedPath: string;

    if (request.kind === 'image') {
      if (!request.mediaUrl) {
        throw new AppError('Missing media URL for image download.', 400, 'BAD_REQUEST');
      }
      job.status = 'downloading';
      touch(job);
      resolvedPath = path.join(config.tmpDir, `${job.id}-${safeTitle}.${plan.extension}`);
      await downloadDirectFile(request.mediaUrl, resolvedPath, controller.signal);
    } else {
      const outputTemplate = path.join(config.tmpDir, `${job.id}-${safeTitle}.%(ext)s`);
      const { filePath } = await downloadWithArgs(
        request.url,
        plan.args,
        outputTemplate,
        (update) => {
          job.status = update.status;
          job.progress = update.progress;
          job.speed = update.speed;
          job.eta = update.eta;
          touch(job);
        },
        controller.signal,
      );
      resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(config.tmpDir, filePath);
    }

    const stat = fs.existsSync(resolvedPath) ? fs.statSync(resolvedPath) : null;

    job.status = 'ready';
    job.progress = 100;
    job.filePath = resolvedPath;
    job.fileName = path.basename(resolvedPath);
    job.fileSizeBytes = stat?.size ?? null;
    touch(job);

    const historyEntry: HistoryEntry = {
      id: job.id,
      title: job.title,
      platform: job.platform,
      kind: job.kind,
      quality: job.formatId,
      thumbnail: job.thumbnail,
      fileName: job.fileName,
      fileSizeBytes: job.fileSizeBytes,
      createdAt: job.createdAt,
      status: 'ready',
    };
    addHistoryEntry(historyEntry);
  } catch (err) {
    if ((job.status as string) !== 'canceled') {
      job.status = 'failed';
      job.error = err instanceof AppError ? err.message : 'Download failed unexpectedly.';
      touch(job);
      logger.error('Download job failed', { jobId: job.id, error: job.error });
    }
  } finally {
    activeCount -= 1;
    controllers.delete(job.id);
    void processQueue(request);
  }
}

export function scheduleJobCleanup() {
  const now = Date.now();
  for (const job of jobs.values()) {
    const age = now - job.updatedAt;
    const shouldDeleteFile = job.filePath && job.status === 'ready' && age > config.fileTtlMs;
    const shouldDeleteJob = age > config.jobTtlMs;

    if (shouldDeleteFile && job.filePath && fs.existsSync(job.filePath)) {
      fs.unlink(job.filePath, () => undefined);
      job.filePath = null;
    }
    if (shouldDeleteJob) {
      jobs.delete(job.id);
    }
  }
}
