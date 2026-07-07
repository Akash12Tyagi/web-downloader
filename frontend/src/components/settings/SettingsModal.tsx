'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Laptop, Moon, RotateCcw, Sun, X } from 'lucide-react';
import clsx from 'clsx';
import { useSettings } from '@/context/SettingsContext';
import type { Settings } from '@/lib/types';
import { Button } from '@/components/ui/Button';

const FORMATS: Settings['defaultFormat'][] = ['mp4', 'mp3', 'm4a'];
const QUALITIES: Settings['defaultQuality'][] = ['highest', '1080p', '720p', '480p'];
const LANGUAGES: { id: Settings['language']; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'fr', label: 'Français' },
  { id: 'de', label: 'Deutsch' },
  { id: 'hi', label: 'हिन्दी' },
];

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const { settings, update, reset } = useSettings();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="card-surface w-full max-w-md rounded-2xl p-5"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">Settings</h2>
              <button
                onClick={onClose}
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-border-subtle hover:text-text-primary"
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              <Field label="Theme">
                <div className="flex gap-1.5">
                  {[
                    { id: 'light', icon: Sun },
                    { id: 'dark', icon: Moon },
                    { id: 'system', icon: Laptop },
                  ].map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setTheme(id)}
                      className={clsx(
                        'focus-ring flex flex-1 flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium capitalize transition-colors',
                        theme === id
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-border-subtle text-text-secondary hover:border-border-strong',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {id}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Default format">
                <SegmentedControl
                  options={FORMATS.map((f) => ({ id: f, label: f.toUpperCase() }))}
                  value={settings.defaultFormat}
                  onChange={(v) => update({ defaultFormat: v })}
                />
              </Field>

              <Field label="Default quality">
                <SegmentedControl
                  options={QUALITIES.map((q) => ({ id: q, label: q === 'highest' ? 'Best' : q }))}
                  value={settings.defaultQuality}
                  onChange={(v) => update({ defaultQuality: v })}
                />
              </Field>

              <Field label={`Concurrent downloads · ${settings.concurrentDownloads}`}>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={settings.concurrentDownloads}
                  onChange={(e) => update({ concurrentDownloads: Number(e.target.value) })}
                  className="w-full accent-[var(--accent)]"
                />
              </Field>

              <Field label="Language">
                <select
                  value={settings.language}
                  onChange={(e) => update({ language: e.target.value as Settings['language'] })}
                  className="focus-ring h-9 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm text-text-primary"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-text-secondary">{label}</label>
      {children}
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={clsx(
            'focus-ring flex-1 rounded-xl border py-2 text-xs font-medium uppercase transition-colors',
            value === opt.id
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-border-subtle text-text-secondary hover:border-border-strong',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
