/**
 * Whether a media query matches, kept up to date as it changes (from 2026-10-23, brief 23): where the shell draws a
 * control depends on whether its rail is a drawer, which CSS alone decided until then. Without `matchMedia` (a test's
 * page, a server render) nothing matches, so the desktop's layout is the one drawn.
 */
import { useEffect, useState } from 'react';

export function useMedia(query: string): boolean {
  const read = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  const [on, setOn] = useState(read);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const list = window.matchMedia(query);
    const again = () => setOn(list.matches);
    list.addEventListener?.('change', again);
    again();
    return () => list.removeEventListener?.('change', again);
  }, [query]);
  return on;
}
