/**
 * SLATE — what a screen keeps while the player is elsewhere: its tab, its
 * filters, its page, what was typed, and how far down it was scrolled
 * (from 2026-10-08). Kept for the session in memory, by a key a screen names,
 * so going to a person and coming back finds the list where it was. Until
 * then every screen opened at its first tab, at the top, its filters cleared.
 *
 * Not saved with the game: it's where the player was looking, not anything in
 * the world.
 */

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

const KEPT = new Map<string, unknown>();

/** A screen's state, kept by key across leaving it and coming back. */
export function useKept<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => (KEPT.has(key) ? (KEPT.get(key) as T) : initial));
  const put = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      KEPT.set(key, v);
      return v;
    });
  }, [key]);
  return [value, put];
}

/** The page's scroll kept by key: put back when the screen opens, remembered as it closes. */
export function useKeptScroll(key: string): void {
  useLayoutEffect(() => {
    const main = document.getElementById('main');
    const at = KEPT.get(`scroll:${key}`);
    // A screen not looked at before opens at its top, not wherever the last one was scrolled to.
    if (main) main.scrollTop = typeof at === 'number' ? at : 0;
  }, [key]);
  useEffect(() => {
    const main = document.getElementById('main');
    if (!main) return undefined;
    const save = () => { KEPT.set(`scroll:${key}`, main.scrollTop); };
    main.addEventListener('scroll', save, { passive: true });
    return () => { save(); main.removeEventListener('scroll', save); };
  }, [key]);
}
