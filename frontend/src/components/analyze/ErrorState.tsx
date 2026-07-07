'use client';

import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export function ErrorState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mt-6 flex max-w-2xl items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3.5 text-sm text-red-500"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </motion.div>
  );
}
