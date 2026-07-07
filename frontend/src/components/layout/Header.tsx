'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Moon, Settings, Sun, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useDownloadManager } from '@/context/DownloadManagerContext';

export function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { setDrawerOpen, activeCount } = useDownloadManager();

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle">
      <div className="glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent shadow-glow">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-text-primary">
              MediaHub<span className="text-text-tertiary"> Downloader</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setDrawerOpen(true)}
              className="focus-ring relative flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-border-subtle hover:text-text-primary"
              aria-label="Open download manager"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Downloads</span>
              {activeCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white"
                >
                  {activeCount}
                </motion.span>
              )}
            </button>

            <button
              onClick={onOpenSettings}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-border-subtle hover:text-text-primary"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-border-subtle hover:text-text-primary"
              aria-label="Toggle theme"
            >
              {mounted && theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
