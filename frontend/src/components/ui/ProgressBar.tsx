'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  indeterminate?: boolean;
  className?: string;
}

export function ProgressBar({ value, indeterminate, className }: ProgressBarProps) {
  return (
    <div className={clsx('h-1.5 w-full overflow-hidden rounded-full bg-border-subtle', className)}>
      {indeterminate ? (
        <motion.div
          className="h-full w-1/3 rounded-full bg-accent"
          animate={{ x: ['-100%', '300%'] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        />
      ) : (
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      )}
    </div>
  );
}
