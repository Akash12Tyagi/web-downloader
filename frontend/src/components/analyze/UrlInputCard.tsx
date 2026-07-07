'use client';

import { useRef, useState, type DragEvent, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Camera, Clipboard, History, Loader2, Sparkles, SquarePlay } from 'lucide-react';
import clsx from 'clsx';
import type { Platform } from '@/lib/types';
import { PLATFORM_META } from '@/lib/platform';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

interface UrlInputCardProps {
  platform: Platform;
  url: string;
  onUrlChange: (url: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  recentSearches: string[];
  onSelectRecent: (url: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function UrlInputCard({
  platform,
  url,
  onUrlChange,
  onAnalyze,
  isLoading,
  recentSearches,
  onSelectRecent,
  inputRef,
}: UrlInputCardProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { show } = useToast();
  const meta = PLATFORM_META[platform];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onAnalyze();
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onUrlChange(text.trim());
    } catch {
      show('Clipboard access was denied by your browser.', 'warning');
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingOver(false);
    const text = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (text) onUrlChange(text.trim());
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-2xl px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={clsx(
          'card-surface relative rounded-3xl p-2 transition-shadow duration-300',
          isFocused && 'shadow-glow',
          isDraggingOver && 'ring-2 ring-accent',
        )}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                setShowRecent(true);
              }}
              onBlur={() => {
                setIsFocused(false);
                blurTimeout.current = setTimeout(() => setShowRecent(false), 150);
              }}
              placeholder={meta.placeholder}
              className="focus-ring h-14 w-full rounded-2xl bg-transparent px-5 pr-11 text-[15px] text-text-primary placeholder:text-text-tertiary"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={handlePaste}
              title="Paste from clipboard"
              className="focus-ring absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-text-tertiary transition-colors hover:bg-border-subtle hover:text-text-primary"
            >
              <Clipboard className="h-4 w-4" />
            </button>

            {showRecent && recentSearches.length > 0 && (
              <div className="glass absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl shadow-lg">
                <div className="flex items-center gap-1.5 border-b border-border-subtle px-4 py-2 text-xs font-medium text-text-tertiary">
                  <History className="h-3.5 w-3.5" /> Recent searches
                </div>
                {recentSearches.slice(0, 5).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      clearTimeout(blurTimeout.current);
                      onSelectRecent(item);
                      setShowRecent(false);
                    }}
                    className="block w-full truncate px-4 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-border-subtle hover:text-text-primary"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" size="lg" disabled={!url.trim() || isLoading} className="shrink-0">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze
              </>
            )}
          </Button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-5 flex flex-col items-center gap-3"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-text-tertiary">
          <span>Supported platforms:</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-border-subtle px-2.5 py-1 text-text-secondary">
            <SquarePlay className="h-3.5 w-3.5" /> YouTube
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-border-subtle px-2.5 py-1 text-text-secondary">
            <Camera className="h-3.5 w-3.5" /> Instagram
          </span>
        </div>
        <p className="max-w-md text-center text-xs text-text-tertiary">
          Only download content you own or have permission to access.
        </p>
      </motion.div>
    </div>
  );
}
