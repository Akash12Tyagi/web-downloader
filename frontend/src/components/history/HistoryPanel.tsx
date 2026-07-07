'use client';

import Image from 'next/image';
import { Camera, Music2, Search, SquarePlay, Trash2, Video } from 'lucide-react';
import clsx from 'clsx';
import { useHistory } from '@/hooks/useHistory';
import { formatBytes, timeAgo } from '@/lib/format';
import { fileDownloadUrl } from '@/lib/api';
import type { Platform } from '@/lib/types';

const FILTERS: { id: Platform | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
];

export function HistoryPanel() {
  const {
    entries,
    total,
    search,
    setSearch,
    platformFilter,
    setPlatformFilter,
    loading,
    clear,
    removeOne,
  } = useHistory();

  return (
    <div>
      <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border-subtle bg-bg-elevated/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history…"
              className="focus-ring h-8 w-full rounded-lg border border-border-subtle bg-surface pl-8 pr-3 text-sm text-text-primary placeholder:text-text-tertiary"
            />
          </div>
          {total > 0 && (
            <button
              onClick={clear}
              className="focus-ring flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs text-text-tertiary hover:bg-border-subtle hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear all
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setPlatformFilter(f.id)}
              className={clsx(
                'focus-ring rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                platformFilter === f.id
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-border-subtle text-text-tertiary hover:text-text-primary',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && entries.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-text-tertiary">Loading history…</div>
      ) : entries.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-text-tertiary">
          No downloads match your filters.
        </div>
      ) : (
        entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 border-b border-border-subtle px-4 py-3 last:border-b-0"
          >
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-border-subtle">
              {entry.thumbnail ? (
                <Image
                  src={entry.thumbnail}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="44px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-text-tertiary">
                  {entry.kind === 'audio' ? (
                    <Music2 className="h-4 w-4" />
                  ) : (
                    <Video className="h-4 w-4" />
                  )}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">{entry.title}</p>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-tertiary">
                {entry.platform === 'youtube' ? (
                  <SquarePlay className="h-3 w-3" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
                <span>{entry.quality}</span>
                <span>·</span>
                <span>{formatBytes(entry.fileSizeBytes)}</span>
                <span>·</span>
                <span>{timeAgo(entry.createdAt)}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <a
                href={fileDownloadUrl(entry.id)}
                download
                className="focus-ring rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft"
              >
                Download
              </a>
              <button
                onClick={() => removeOne(entry.id)}
                className="focus-ring flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary hover:bg-border-subtle hover:text-red-500"
                aria-label="Remove from history"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
