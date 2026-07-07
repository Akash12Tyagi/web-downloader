'use client';

import { motion } from 'framer-motion';
import { Camera, SquarePlay } from 'lucide-react';
import clsx from 'clsx';
import type { Platform } from '@/lib/types';

const TABS: { id: Platform; label: string; icon: typeof SquarePlay }[] = [
  { id: 'youtube', label: 'YouTube Downloader', icon: SquarePlay },
  { id: 'instagram', label: 'Instagram Downloader', icon: Camera },
];

export function PlatformTabs({
  active,
  onChange,
}: {
  active: Platform;
  onChange: (platform: Platform) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md gap-1 rounded-2xl border border-border-subtle bg-surface p-1">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'focus-ring relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'text-white' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="platform-tab-bg"
                className="absolute inset-0 rounded-xl bg-accent shadow-glow"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <tab.icon className="relative z-10 h-4 w-4" />
            <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            <span className="relative z-10 sm:hidden">
              {tab.id === 'youtube' ? 'YouTube' : 'Instagram'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
