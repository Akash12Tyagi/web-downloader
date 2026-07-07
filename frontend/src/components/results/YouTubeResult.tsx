'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Music2, Zap } from 'lucide-react';
import type { AnalyzeResult } from '@/lib/types';
import { QualityCard } from './QualityCard';
import { AudioCard } from './AudioCard';
import { MetadataHeader } from './MetadataHeader';
import { Button } from '@/components/ui/Button';
import { QrModal } from '@/components/ui/QrModal';
import { useStartDownload } from '@/hooks/useStartDownload';
import { useToast } from '@/context/ToastContext';
import { useLocalList } from '@/hooks/useLocalList';
import { STORAGE_KEYS } from '@/lib/storage';

export function YouTubeResult({ result }: { result: AnalyzeResult }) {
  const startDownload = useStartDownload(result);
  const { show } = useToast();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const favorites = useLocalList<string>(STORAGE_KEYS.favorites, 50, (url) => url);
  const isFavorite = favorites.items.includes(result.url);

  return (
    <div className="mx-auto mt-8 w-full max-w-4xl px-4 pb-16">
      <MetadataHeader
        result={result}
        isFavorite={isFavorite}
        onToggleFavorite={() => {
          if (isFavorite) favorites.remove(result.url);
          else {
            favorites.add(result.url);
            show('Added to favorites', 'success');
          }
        }}
        onCopyLink={async () => {
          await navigator.clipboard.writeText(result.url);
          show('Link copied to clipboard', 'success');
        }}
        onShare={async () => {
          if (navigator.share) {
            await navigator.share({ title: result.title, url: result.url }).catch(() => undefined);
          } else {
            await navigator.clipboard.writeText(result.url);
            show('Sharing isn’t supported here — link copied instead', 'info');
          }
        }}
        onShowQr={() => setQrUrl(result.url)}
      />

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => startDownload({ kind: 'video', formatId: 'highest' }, 'Highest available')}
        >
          <Zap className="h-4 w-4" /> Highest Available
        </Button>
        <Button
          variant="secondary"
          onClick={() => startDownload({ kind: 'video', formatId: 'video-only' }, 'Video only')}
        >
          <Film className="h-4 w-4" /> Video Only
        </Button>
      </div>

      {result.qualities.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-text-secondary">Video quality</h3>
          <motion.div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
          >
            {result.qualities.map((quality) => (
              <motion.div
                key={quality.formatId}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              >
                <QualityCard
                  quality={quality}
                  onDownload={() =>
                    startDownload({ kind: 'video', formatId: quality.formatId }, quality.label)
                  }
                />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {result.audio.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
            <Music2 className="h-4 w-4" /> Audio only
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {result.audio.map((audio) => (
              <AudioCard
                key={audio.formatId}
                audio={audio}
                onDownload={() =>
                  startDownload(
                    {
                      kind: 'audio',
                      formatId: audio.formatId,
                      audioFormat: audio.format,
                      audioBitrateKbps: audio.bitrateKbps ?? undefined,
                    },
                    audio.label,
                  )
                }
              />
            ))}
          </div>
        </section>
      )}

      <QrModal url={qrUrl} onClose={() => setQrUrl(null)} />
    </div>
  );
}
