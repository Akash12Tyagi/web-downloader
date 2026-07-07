'use client';

import { motion } from 'framer-motion';

export function Hero() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-16 text-center sm:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 py-1 text-xs font-medium text-text-secondary"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        YouTube &amp; Instagram supported
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="text-balance text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl md:text-6xl"
      >
        Download Videos in{' '}
        <span className="bg-gradient-to-r from-accent to-accent bg-clip-text text-transparent">
          Seconds
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mt-4 max-w-lg text-balance text-base text-text-secondary sm:text-lg"
      >
        Download supported public media in multiple qualities and formats.
      </motion.p>
    </div>
  );
}
