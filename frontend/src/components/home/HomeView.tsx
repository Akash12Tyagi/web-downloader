'use client';

import { useCallback, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/hero/Hero';
import { PlatformTabs } from '@/components/analyze/PlatformTabs';
import { UrlInputCard } from '@/components/analyze/UrlInputCard';
import { ErrorState } from '@/components/analyze/ErrorState';
import { ResultSkeleton } from '@/components/results/ResultSkeleton';
import { YouTubeResult } from '@/components/results/YouTubeResult';
import { InstagramResult } from '@/components/results/InstagramResult';
import { DownloadDrawer } from '@/components/download-manager/DownloadDrawer';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { analyzeUrl, ApiRequestError } from '@/lib/api';
import { detectPlatformFromUrl } from '@/lib/platform';
import { useLocalList } from '@/hooks/useLocalList';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDownloadManager } from '@/context/DownloadManagerContext';
import { STORAGE_KEYS } from '@/lib/storage';
import type { AnalyzeResult, Platform } from '@/lib/types';

type Status = 'idle' | 'loading' | 'error';

export function HomeView() {
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setDrawerOpen, isDrawerOpen } = useDownloadManager();

  const recentSearches = useLocalList<string>(STORAGE_KEYS.recentSearches, 8, (u) => u);

  const runAnalyze = useCallback(
    async (targetUrl: string) => {
      const trimmed = targetUrl.trim();
      if (!trimmed) return;

      const detected = detectPlatformFromUrl(trimmed);
      if (detected) setPlatform(detected);

      setStatus('loading');
      setError(null);
      setResult(null);

      try {
        const data = await analyzeUrl(trimmed);
        setResult(data);
        setStatus('idle');
        recentSearches.add(trimmed);
      } catch (err) {
        setStatus('error');
        setError(
          err instanceof ApiRequestError ? err.message : 'Something went wrong. Please try again.',
        );
      }
    },
    [recentSearches],
  );

  useKeyboardShortcuts({
    onFocusInput: () => inputRef.current?.focus(),
    onSubmit: () => runAnalyze(url),
    onToggleDrawer: () => setDrawerOpen(!isDrawerOpen),
    onOpenSettings: () => setSettingsOpen(true),
    onEscape: () => {
      setDrawerOpen(false);
      setSettingsOpen(false);
    },
  });

  return (
    <div data-platform={platform} className="flex min-h-screen flex-col">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <main className="flex-1">
        <Hero />

        <PlatformTabs
          active={platform}
          onChange={(p) => {
            setPlatform(p);
            setResult(null);
            setError(null);
            setStatus('idle');
          }}
        />

        <UrlInputCard
          platform={platform}
          url={url}
          onUrlChange={setUrl}
          onAnalyze={() => runAnalyze(url)}
          isLoading={status === 'loading'}
          recentSearches={recentSearches.items}
          onSelectRecent={(u) => {
            setUrl(u);
            runAnalyze(u);
          }}
          inputRef={inputRef}
        />

        <AnimatePresence mode="wait">
          {status === 'loading' && <ResultSkeleton key="skeleton" />}
          {status === 'error' && error && <ErrorState key="error" message={error} />}
        </AnimatePresence>

        {result &&
          (platform === 'youtube' ? (
            <YouTubeResult result={result} />
          ) : (
            <InstagramResult result={result} />
          ))}
      </main>

      <footer className="border-t border-border-subtle px-4 py-6 text-center text-xs text-text-tertiary">
        MediaHub Downloader is not affiliated with YouTube or Instagram. Use responsibly and only
        download content you own or have permission to access.
      </footer>

      <DownloadDrawer />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
