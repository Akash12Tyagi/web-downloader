'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import clsx from 'clsx';
import { useDownloadManager } from '@/context/DownloadManagerContext';
import { DownloadItem } from './DownloadItem';
import { HistoryPanel } from '@/components/history/HistoryPanel';

type Tab = 'active' | 'history';

export function DownloadDrawer() {
  const { downloads, isDrawerOpen, setDrawerOpen, cancel, retry, remove, clearFinished } =
    useDownloadManager();
  const [tab, setTab] = useState<Tab>('active');

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-90 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="glass fixed inset-x-0 bottom-0 z-90 mx-auto flex max-h-[75vh] w-full max-w-2xl flex-col rounded-t-3xl shadow-lg sm:bottom-4 sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <div className="flex gap-1 rounded-xl bg-border-subtle p-1">
                <TabButton active={tab === 'active'} onClick={() => setTab('active')}>
                  Downloads {downloads.length > 0 && `(${downloads.length})`}
                </TabButton>
                <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
                  History
                </TabButton>
              </div>
              <div className="flex items-center gap-1">
                {tab === 'active' &&
                  downloads.some(
                    (d) => d.status === 'ready' || d.status === 'failed' || d.status === 'canceled',
                  ) && (
                    <button
                      onClick={clearFinished}
                      className="focus-ring flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-text-tertiary hover:bg-border-subtle hover:text-text-primary"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Clear finished
                    </button>
                  )}
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-border-subtle hover:text-text-primary"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto">
              {tab === 'active' ? (
                downloads.length === 0 ? (
                  <EmptyState message="No downloads yet. Analyze a link and pick a quality to get started." />
                ) : (
                  <AnimatePresence initial={false}>
                    {downloads.map((item) => (
                      <DownloadItem
                        key={item.jobId}
                        item={item}
                        onCancel={() => cancel(item.jobId)}
                        onRetry={() => retry(item.jobId)}
                        onRemove={() => remove(item.jobId)}
                      />
                    ))}
                  </AnimatePresence>
                )
              ) : (
                <HistoryPanel />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'focus-ring rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-surface text-text-primary shadow-sm'
          : 'text-text-tertiary hover:text-text-primary',
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="px-5 py-12 text-center text-sm text-text-tertiary">{message}</div>;
}
