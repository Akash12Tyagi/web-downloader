import { config } from '../config';
import type { HistoryEntry } from '../types';

let history: HistoryEntry[] = [];

export function addHistoryEntry(entry: HistoryEntry): void {
  history.unshift(entry);
  if (history.length > config.historyLimit) {
    history = history.slice(0, config.historyLimit);
  }
}

export function getHistory(): HistoryEntry[] {
  return history;
}

export function clearHistory(): void {
  history = [];
}

export function removeHistoryEntry(id: string): void {
  history = history.filter((h) => h.id !== id);
}
