'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { AlertCircle, Check, Download, Music2, RotateCw, Video, X } from 'lucide-react';
import clsx from 'clsx';
import type { TrackedDownload } from '@/lib/types';
import { formatBytes } from '@/lib/format';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { fileDownloadUrl } from '@/lib/api';

const STATUS_LABEL: Record<TrackedDownload['status'], string> = {
  queued: 'Queued',
  preparing: 'Preparing…',
  downloading: 'Downloading…',
  converting: 'Converting…',
  ready: 'Ready',
  failed: 'Failed',
  canceled: 'Canceled',
};

export function DownloadItem({
  item,
  onCancel,
  onRetry,
  onRemove,
}: {
  item: TrackedDownload;
  onCancel: () => void;
  onRetry: () => void;
  onRemove: () => void;
}) {
  const isActive =
    item.status === 'queued' ||
    item.status === 'preparing' ||
    item.status === 'downloading' ||
    item.status === 'converting';
  const isIndeterminate = item.status === 'preparing' || item.status === 'converting';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-3 border-b border-border-subtle px-4 py-3 last:border-b-0"
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-border-subtle">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="44px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-tertiary">
            {item.kind === 'audio' ? <Music2 className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-tertiary">
          <span>{item.qualityLabel}</span>
          {item.fileSizeBytes && (
            <>
              <span>·</span>
              <span>{formatBytes(item.fileSizeBytes)}</span>
            </>
          )}
        </div>

        {isActive && (
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar value={item.progress} indeterminate={isIndeterminate} className="flex-1" />
            <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-text-tertiary">
              {isIndeterminate ? '' : `${item.progress}%`}
            </span>
          </div>
        )}
        {item.status === 'failed' && item.error && (
          <p className="mt-1 truncate text-xs text-red-500">{item.error}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <StatusBadge status={item.status} />

        {isActive && (
          <IconButton onClick={onCancel} label="Cancel">
            <X className="h-3.5 w-3.5" />
          </IconButton>
        )}
        {item.status === 'failed' && (
          <IconButton onClick={onRetry} label="Retry">
            <RotateCw className="h-3.5 w-3.5" />
          </IconButton>
        )}
        {item.status === 'ready' && item.downloadUrl && (
          <a
            href={fileDownloadUrl(item.jobId)}
            download
            className="focus-ring flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-border-subtle hover:text-text-primary"
            aria-label="Download again"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        )}
        {!isActive && (
          <IconButton onClick={onRemove} label="Remove">
            <X className="h-3.5 w-3.5" />
          </IconButton>
        )}
      </div>
    </motion.div>
  );
}

function IconButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="focus-ring flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-border-subtle hover:text-text-primary"
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: TrackedDownload['status'] }) {
  if (status === 'ready') {
    return (
      <Badge tone="success">
        <Check className="h-3 w-3" /> Ready
      </Badge>
    );
  }
  if (status === 'failed') {
    return (
      <Badge tone="danger">
        <AlertCircle className="h-3 w-3" /> Failed
      </Badge>
    );
  }
  return (
    <Badge
      tone={status === 'canceled' ? 'neutral' : 'accent'}
      className={clsx(status !== 'canceled' && 'hidden sm:inline-flex')}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}
