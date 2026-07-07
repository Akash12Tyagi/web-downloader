'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Download, ImageIcon, PlayCircle } from 'lucide-react';
import type { AnalyzeResult } from '@/lib/types';
import { useStartDownload } from '@/hooks/useStartDownload';
import { formatDuration } from '@/lib/format';

export function CarouselGrid({ result }: { result: AnalyzeResult }) {
  const startDownload = useStartDownload(result);

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
    >
      {result.carousel.map((item) => (
        <motion.div
          key={item.index}
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          whileHover={{ y: -3 }}
          className="card-surface group overflow-hidden rounded-2xl"
        >
          <div className="relative aspect-square bg-border-subtle">
            {item.thumbnail ? (
              <Image
                src={item.thumbnail}
                alt={`Item ${item.index + 1}`}
                fill
                unoptimized
                className="object-cover"
                sizes="200px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-text-tertiary">
                {item.type === 'video' ? (
                  <PlayCircle className="h-6 w-6" />
                ) : (
                  <ImageIcon className="h-6 w-6" />
                )}
              </div>
            )}
            <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
              #{item.index + 1}
            </span>
            {item.type === 'video' && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                <PlayCircle className="h-8 w-8 text-white" />
              </span>
            )}
            {item.durationSeconds != null && (
              <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
                {formatDuration(item.durationSeconds)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between p-2.5">
            <span className="text-xs font-medium capitalize text-text-secondary">{item.type}</span>
            <button
              onClick={() =>
                item.type === 'video'
                  ? startDownload(
                      {
                        kind: 'video',
                        formatId: item.formatId ?? 'highest',
                        carouselIndex: item.index,
                      },
                      `Item ${item.index + 1}`,
                      item.thumbnail,
                    )
                  : startDownload(
                      {
                        kind: 'image',
                        formatId: `image-${item.index}`,
                        mediaUrl: item.directUrl ?? undefined,
                        carouselIndex: item.index,
                      },
                      `Item ${item.index + 1}`,
                      item.thumbnail,
                    )
              }
              disabled={item.type === 'image' && !item.directUrl}
              className="focus-ring flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent transition-colors hover:bg-accent hover:text-white disabled:opacity-40"
              aria-label={`Download item ${item.index + 1}`}
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
