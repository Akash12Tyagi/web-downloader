'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { HistoryEntry, Platform } from '@/lib/types';
import { readStorage, STORAGE_KEYS, writeStorage } from '@/lib/storage';

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() =>
    readStorage<HistoryEntry[]>(STORAGE_KEYS.history, []),
  );
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ history: HistoryEntry[] }>('/api/history');
      setEntries(data.history);
      writeStorage(STORAGE_KEYS.history, data.history);
    } catch {
      // Backend unreachable — fall back to the last cached snapshot already in state.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const clear = useCallback(async () => {
    setEntries([]);
    writeStorage(STORAGE_KEYS.history, []);
    try {
      await api.delete('/api/history');
    } catch {
      // best-effort; local state already cleared
    }
  }, []);

  const removeOne = useCallback(async (id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      writeStorage(STORAGE_KEYS.history, next);
      return next;
    });
    try {
      await api.delete(`/api/history/${id}`);
    } catch {
      // best-effort
    }
  }, []);

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const matchesPlatform = platformFilter === 'all' || entry.platform === platformFilter;
      const matchesSearch = entry.title.toLowerCase().includes(search.trim().toLowerCase());
      return matchesPlatform && matchesSearch;
    });
  }, [entries, search, platformFilter]);

  return {
    entries: filtered,
    total: entries.length,
    search,
    setSearch,
    platformFilter,
    setPlatformFilter,
    loading,
    refresh,
    clear,
    removeOne,
  };
}
