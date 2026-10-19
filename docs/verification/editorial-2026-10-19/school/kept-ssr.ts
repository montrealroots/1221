/**
 * The kept-state hook for `school-tabs.mts`'s server render: the real store (`src/ui/kept.ts`), read without a
 * subscription, since a server render has no snapshot for useSyncExternalStore to take.
 */
import { keep, kept, useKeptScroll } from '../../../../src/ui/kept';

export { keep, kept, useKeptScroll };
export function useKept<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  return [kept<T>(key) ?? initial, () => undefined];
}
