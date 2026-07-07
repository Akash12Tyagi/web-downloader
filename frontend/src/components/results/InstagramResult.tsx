'use client';

import { useState } from 'react';
import { Download, Music2 } from 'lucide-react';
import type { AnalyzeResult } from '@/lib/types';
import { MetadataHeader } from './MetadataHeader';
import { QualityCard } from './QualityCard';
import { AudioCard } from './AudioCard';
import { CarouselGrid } from './CarouselGrid';
import { Button } from '@/components/ui/Button';
import { QrModal } from '@/components/ui/QrModal';
import { useStartDownload } from '@/hooks/useStartDownload';
import { useToast } from '@/context/ToastContext';
import { useLocalList } from '@/hooks/useLocalList';
import { STORAGE_KEYS } from '@/lib/storage';

export function InstagramResult({ result }: { result: AnalyzeResult }) {
  const startDownload = useStartDownload(result);
  const { show } = useToast();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const favorites = useLocalList<string>(STORAGE_KEYS.favorites, 50, (url) => url);
  const isFavorite = favorites.items.includes(result.url);

  const singleImage =
    !result.isCarousel && result.carousel.length === 1 && result.carousel[0].type === 'image';

  const sharedHeader = (
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
  );

  return (
    <div className="mx-auto mt-8 w-full max-w-4xl px-4 pb-16">
      {sharedHeader}

      {result.isCarousel && (
        <section className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-text-secondary">
            Carousel · {result.carousel.length} items
          </h3>
          <CarouselGrid result={result} />
        </section>
      )}

      {singleImage && (
        <section className="mt-8">
          <Button
            onClick={() =>
              startDownload(
                {
                  kind: 'image',
                  formatId: 'image-0',
                  mediaUrl: result.carousel[0].directUrl ?? undefined,
                },
                'Image',
              )
            }
            disabled={!result.carousel[0].directUrl}
          >
            <Download className="h-4 w-4" /> Download Image
          </Button>
        </section>
      )}

      {!result.isCarousel && !singleImage && result.qualities.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-text-secondary">Video quality</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {result.qualities.map((quality) => (
              <QualityCard
                key={quality.formatId}
                quality={quality}
                onDownload={() =>
                  startDownload({ kind: 'video', formatId: quality.formatId }, quality.label)
                }
              />
            ))}
          </div>
        </section>
      )}

      {!result.isCarousel && !singleImage && result.audio.length > 0 && (
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
