'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cancelDownload, fileDownloadUrl, getProgress, startDownload } from '@/lib/api';
import type { DownloadRequestPayload, TrackedDownload } from '@/lib/types';
import { readStorage, writeStorage } from '@/lib/storage';

interface StartDownloadArgs {
  payload: DownloadRequestPayload;
  title: string;
  thumbnail: string | null;
  qualityLabel: string;
}

interface DownloadManagerValue {
  downloads: TrackedDownload[];
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  start: (args: StartDownloadArgs) => Promise<void>;
  cancel: (jobId: string) => Promise<void>;
  retry: (jobId: string) => Promise<void>;
  remove: (jobId: string) => void;
  clearFinished: () => void;
  activeCount: number;
}

const DownloadManagerContext = createContext<DownloadManagerValue | null>(null);

const TERMINAL_STATUSES = new Set(['ready', 'failed', 'canceled']);
const HISTORY_CACHE_KEY = 'mediahub.downloads.session';

export function DownloadManagerProvider({ children }: { children: ReactNode }) {
  const [downloads, setDownloads] = useState<TrackedDownload[]>(() =>
    readStorage<TrackedDownload[]>(HISTORY_CACHE_KEY, []).filter(
      (d) => d.status === 'ready' || d.status === 'failed' || d.status === 'canceled',
    ),
  );
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const pollersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  useEffect(() => {
    writeStorage(HISTORY_CACHE_KEY, downloads.slice(0, 30));
  }, [downloads]);

  const updateDownload = useCallback((jobId: string, patch: Partial<TrackedDownload>) => {
    setDownloads((prev) => prev.map((d) => (d.jobId === jobId ? { ...d, ...patch } : d)));
  }, []);

  const stopPolling = useCallback((jobId: string) => {
    const interval = pollersRef.current.get(jobId);
    if (interval) {
      clearInterval(interval);
      pollersRef.current.delete(jobId);
    }
  }, []);

  const beginPolling = useCallback(
    (jobId: string) => {
      stopPolling(jobId);
      const interval = setInterval(async () => {
        try {
          const progress = await getProgress(jobId);
          updateDownload(jobId, {
            status: progress.status,
            progress: progress.progress,
            speed: progress.speed,
            eta: progress.eta,
            error: progress.error,
            downloadUrl: progress.downloadUrl,
            fileSizeBytes: progress.fileSizeBytes,
          });

          if (TERMINAL_STATUSES.has(progress.status)) {
            stopPolling(jobId);
            if (progress.status === 'ready' && progress.downloadUrl) {
              setDownloads((prev) => {
                const target = prev.find((d) => d.jobId === jobId);
                if (target && !target.autoDownloadTriggered) {
                  const link = document.createElement('a');
                  link.href = fileDownloadUrl(jobId);
                  link.download = progress.fileName ?? '';
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }
                return prev.map((d) =>
                  d.jobId === jobId ? { ...d, autoDownloadTriggered: true } : d,
                );
              });
            }
          }
        } catch {
          stopPolling(jobId);
          updateDownload(jobId, {
            status: 'failed',
            error: 'Lost connection while tracking progress.',
          });
        }
      }, 1000);
      pollersRef.current.set(jobId, interval);
    },
    [stopPolling, updateDownload],
  );

  useEffect(() => {
    const pollers = pollersRef.current;
    return () => {
      pollers.forEach((interval) => clearInterval(interval));
      pollers.clear();
    };
  }, []);

  const start = useCallback(
    async ({ payload, title, thumbnail, qualityLabel }: StartDownloadArgs) => {
      setDrawerOpen(true);
      const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimistic: TrackedDownload = {
        jobId: tempId,
        title,
        platform: payload.platform,
        kind: payload.kind,
        qualityLabel,
        thumbnail,
        status: 'queued',
        progress: 0,
        speed: null,
        eta: null,
        error: null,
        downloadUrl: null,
        fileSizeBytes: null,
        createdAt: Date.now(),
        payload,
      };
      setDownloads((prev) => [optimistic, ...prev]);

      try {
        const { jobId } = await startDownload(payload);
        setDownloads((prev) => prev.map((d) => (d.jobId === tempId ? { ...d, jobId } : d)));
        beginPolling(jobId);
      } catch (err) {
        updateDownload(tempId, {
          status: 'failed',
          error: err instanceof Error ? err.message : 'Failed to start download.',
        });
      }
    },
    [beginPolling, updateDownload],
  );

  const cancel = useCallback(
    async (jobId: string) => {
      stopPolling(jobId);
      updateDownload(jobId, { status: 'canceled' });
      try {
        await cancelDownload(jobId);
      } catch {
        // job may have already finished server-side; local state already reflects cancellation
      }
    },
    [stopPolling, updateDownload],
  );

  const remove = useCallback(
    (jobId: string) => {
      stopPolling(jobId);
      setDownloads((prev) => prev.filter((d) => d.jobId !== jobId));
    },
    [stopPolling],
  );

  const retry = useCallback(
    async (jobId: string) => {
      const target = downloads.find((d) => d.jobId === jobId);
      if (!target) return;
      remove(jobId);
      await start({
        payload: target.payload,
        title: target.title,
        thumbnail: target.thumbnail,
        qualityLabel: target.qualityLabel,
      });
    },
    [downloads, start, remove],
  );

  const clearFinished = useCallback(() => {
    setDownloads((prev) => prev.filter((d) => !TERMINAL_STATUSES.has(d.status)));
  }, []);

  const activeCount = downloads.filter((d) => !TERMINAL_STATUSES.has(d.status)).length;

  return (
    <DownloadManagerContext.Provider
      value={{
        downloads,
        isDrawerOpen,
        setDrawerOpen,
        start,
        cancel,
        retry,
        remove,
        clearFinished,
        activeCount,
      }}
    >
      {children}
    </DownloadManagerContext.Provider>
  );
}

export function useDownloadManager() {
  const ctx = useContext(DownloadManagerContext);
  if (!ctx) throw new Error('useDownloadManager must be used within DownloadManagerProvider');
  return ctx;
}
