'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

export function QrModal({ url, onClose }: { url: string | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {url && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="card-surface relative flex flex-col items-center gap-4 rounded-2xl p-6"
          >
            <button
              onClick={onClose}
              className="focus-ring absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-border-subtle hover:text-text-primary"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium text-text-primary">Scan to open on another device</p>
            <div className="rounded-xl bg-white p-4">
              <QRCodeSVG value={url} size={200} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
