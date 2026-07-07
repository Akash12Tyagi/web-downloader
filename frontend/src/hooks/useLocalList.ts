'use client';

import { useCallback, useEffect, useState } from 'react';
import { readStorage, writeStorage } from '@/lib/storage';

/** Generic localStorage-backed list with a max length, newest first, de-duped by key. */
export function useLocalList<T>(storageKey: string, maxItems: number, keyOf: (item: T) => string) {
  const [items, setItems] = useState<T[]>(() => readStorage<T[]>(storageKey, []));

  useEffect(() => {
    writeStorage(storageKey, items);
  }, [storageKey, items]);

  const add = useCallback(
    (item: T) => {
      setItems((prev) => {
        const withoutDupe = prev.filter((existing) => keyOf(existing) !== keyOf(item));
        return [item, ...withoutDupe].slice(0, maxItems);
      });
    },
    [keyOf, maxItems],
  );

  const remove = useCallback(
    (key: string) => {
      setItems((prev) => prev.filter((item) => keyOf(item) !== key));
    },
    [keyOf],
  );

  const clear = useCallback(() => setItems([]), []);

  return { items, add, remove, clear };
}
