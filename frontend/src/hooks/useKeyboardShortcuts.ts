'use client';

import { useEffect } from 'react';

interface ShortcutMap {
  onFocusInput?: () => void;
  onSubmit?: () => void;
  onToggleDrawer?: () => void;
  onOpenSettings?: () => void;
  onEscape?: () => void;
}

/** Global keyboard shortcuts: "/" focus input, "cmd+enter" analyze, "d" toggle drawer, "," settings, "esc" close. */
export function useKeyboardShortcuts(handlers: ShortcutMap) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        handlers.onEscape?.();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handlers.onSubmit?.();
        return;
      }

      if (isTyping) return;

      if (e.key === '/') {
        e.preventDefault();
        handlers.onFocusInput?.();
      } else if (e.key === 'd') {
        handlers.onToggleDrawer?.();
      } else if (e.key === ',') {
        handlers.onOpenSettings?.();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}
