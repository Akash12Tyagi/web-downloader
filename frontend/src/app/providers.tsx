'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { SettingsProvider } from '@/context/SettingsContext';
import { ToastProvider } from '@/context/ToastContext';
import { DownloadManagerProvider } from '@/context/DownloadManagerContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ToastProvider>
          <DownloadManagerProvider>{children}</DownloadManagerProvider>
        </ToastProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
