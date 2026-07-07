import { config } from '../config';
import type { AnalyzeResult } from '../types';

interface CacheEntry {
  value: AnalyzeResult;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

export function getCached(key: string): AnalyzeResult | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(key: string, value: AnalyzeResult): void {
  store.set(key, { value, expiresAt: Date.now() + config.analyzeCacheTtlMs });
}

export function clearExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.expiresAt) store.delete(key);
  }
}
