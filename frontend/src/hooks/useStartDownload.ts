'use client';

import { useCallback } from 'react';
import { useDownloadManager } from '@/context/DownloadManagerContext';
import { useToast } from '@/context/ToastContext';
import type { AnalyzeResult, DownloadRequestPayload } from '@/lib/types';

export function useStartDownload(result: AnalyzeResult) {
  const { start } = useDownloadManager();
  const { show } = useToast();

  return useCallback(
    async (
      payload: Omit<DownloadRequestPayload, 'url' | 'platform'>,
      qualityLabel: string,
      thumbnail?: string | null,
    ) => {
      try {
        await start({
          payload: { ...payload, url: result.url, platform: result.platform },
          title: result.title,
          thumbnail: thumbnail ?? result.thumbnail,
          qualityLabel,
        });
        show(`${qualityLabel} download started`, 'success');
      } catch {
        show('Couldn’t start the download. Please try again.', 'error');
      }
    },
    [result, start, show],
  );
}
