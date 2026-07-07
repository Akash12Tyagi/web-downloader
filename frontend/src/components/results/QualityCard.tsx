'use client';

import { motion } from 'framer-motion';
import { Download, Volume2, VolumeX } from 'lucide-react';
import type { QualityOption } from '@/lib/types';
import { formatBytes } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';

interface QualityCardProps {
  quality: QualityOption;
  onDownload: () => void;
  disabled?: boolean;
}

export function QualityCard({ quality, onDownload, disabled }: QualityCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="card-surface group flex flex-col gap-3 rounded-2xl p-4 hover:border-accent"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-semibold text-text-primary">{quality.label}</p>
          <p className="text-xs uppercase tracking-wide text-text-tertiary">{quality.container}</p>
        </div>
        {quality.hasAudio ? (
          <Volume2 className="h-4 w-4 text-text-tertiary" />
        ) : (
          <VolumeX className="h-4 w-4 text-text-tertiary" />
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge>{quality.codec}</Badge>
        {quality.fps && <Badge>{quality.fps}fps</Badge>}
        <Badge tone={quality.hasAudio ? 'success' : 'neutral'}>
          {quality.hasAudio ? 'Has audio' : 'Video only'}
        </Badge>
      </div>

      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-sm text-text-secondary">
          {formatBytes(quality.estimatedSizeBytes)}
        </span>
        <button
          onClick={onDownload}
          disabled={disabled}
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent transition-colors hover:bg-accent hover:text-white disabled:opacity-40"
          aria-label={`Download ${quality.label}`}
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
