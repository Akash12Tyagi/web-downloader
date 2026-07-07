'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, Copy, Heart, QrCode, Share2, User } from 'lucide-react';
import clsx from 'clsx';
import type { AnalyzeResult } from '@/lib/types';
import { truncate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';

interface MetadataHeaderProps {
  result: AnalyzeResult;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onCopyLink: () => void;
  onShare: () => void;
  onShowQr: () => void;
}

export function MetadataHeader({
  result,
  isFavorite,
  onToggleFavorite,
  onCopyLink,
  onShare,
  onShowQr,
}: MetadataHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="card-surface flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center"
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-border-subtle sm:w-56">
        {result.thumbnail ? (
          <Image
            src={result.thumbnail}
            alt={result.title}
            fill
            unoptimized
            className="object-cover"
            sizes="224px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-tertiary">
            No preview
          </div>
        )}
        {result.durationLabel && (
          <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {result.durationLabel}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-balance text-lg font-semibold leading-snug text-text-primary">
          {truncate(result.title, 140)}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {result.uploader && (
            <Badge>
              <User className="h-3 w-3" /> {result.uploader}
            </Badge>
          )}
          {result.durationSeconds != null && (
            <Badge>
              <Clock className="h-3 w-3" /> {result.durationLabel}
            </Badge>
          )}
          {result.isCarousel && <Badge tone="accent">{result.carousel.length} items</Badge>}
        </div>
        {result.caption && (
          <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{result.caption}</p>
        )}
      </div>

      <div className="flex shrink-0 gap-1.5 self-start sm:self-center">
        <ActionIcon label="Copy link" onClick={onCopyLink}>
          <Copy className="h-4 w-4" />
        </ActionIcon>
        <ActionIcon label="Share" onClick={onShare}>
          <Share2 className="h-4 w-4" />
        </ActionIcon>
        <ActionIcon label="QR code" onClick={onShowQr}>
          <QrCode className="h-4 w-4" />
        </ActionIcon>
        <ActionIcon label="Favorite" onClick={onToggleFavorite} active={isFavorite}>
          <Heart className={clsx('h-4 w-4', isFavorite && 'fill-current')} />
        </ActionIcon>
      </div>
    </motion.div>
  );
}

function ActionIcon({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={clsx(
        'focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle transition-colors',
        active
          ? 'border-accent bg-accent-soft text-accent'
          : 'text-text-secondary hover:bg-border-subtle hover:text-text-primary',
      )}
    >
      {children}
    </button>
  );
}
