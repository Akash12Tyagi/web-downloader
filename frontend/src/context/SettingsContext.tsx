'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Settings } from '@/lib/types';
import { readStorage, STORAGE_KEYS, writeStorage } from '@/lib/storage';

const DEFAULT_SETTINGS: Settings = {
  defaultFormat: 'mp4',
  defaultQuality: '1080p',
  concurrentDownloads: 3,
  language: 'en',
};

interface SettingsValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(readStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeStorage(STORAGE_KEYS.settings, next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    writeStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
