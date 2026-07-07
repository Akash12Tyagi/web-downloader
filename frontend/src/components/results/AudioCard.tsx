'use client';

import { motion } from 'framer-motion';
import { Download, Music2 } from 'lucide-react';
import type { AudioOption } from '@/lib/types';
import { formatBytes } from '@/lib/format';

export function AudioCard({ audio, onDownload }: { audio: AudioOption; onDownload: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="card-surface flex items-center gap-3 rounded-2xl p-4 hover:border-accent"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Music2 className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{audio.label}</p>
        <p className="text-xs text-text-tertiary">{formatBytes(audio.estimatedSizeBytes)}</p>
      </div>
      <button
        onClick={onDownload}
        className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent transition-colors hover:bg-accent hover:text-white"
        aria-label={`Download ${audio.label}`}
      >
        <Download className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
