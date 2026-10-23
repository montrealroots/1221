/**
 * SLATE — landscape only on a phone (from 2026-10-23, the owner's brief 23: "do not build a portrait gameplay layout").
 *
 * A phone held upright sees Rotate Your Phone To Play over the game, and nothing behind it can be pressed, tabbed to or
 * read: the frame under it is `inert`, and a key pressed while it shows reaches nothing. Nothing under it is unmounted,
 * so the screen, its tab, an open look, an open dialog or menu and what was typed in a form are all as they were when the
 * phone turns back. The main column's scroll is put back too, since the narrow upright layout moved it. In the game the
 * clock is paused while it shows (`usePauseWhileUpright`).
 *
 * What a phone is, and when it's upright, is in `readDevice`, and `docs/verification/ui-2026-10-23/rotation.md` says why.
 */

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useGame } from '@/app/game-context';

/**
 * The short side of a phone's screen, in CSS pixels, at most: the largest phones are 430 to 480 (iPhone Pro Max 430,
 * Pixel 8 Pro 448), and the smallest tablet is 744 (iPad mini). A folding phone opened out is a tablet here.
 */
export const PHONE_SHORT_SIDE = 500;

/** What the page can be asked about the device: the window, or a stand-in for one in a test. */
export interface DeviceWindow {
  matchMedia?: (query: string) => { matches: boolean };
  screen?: { width: number; height: number; orientation?: { type?: string } };
  orientation?: number;
}

/**
 * Whether this is a phone and whether it's held upright, from what the device is, never from the window's size alone.
 *
 * A phone: a coarse pointer, as a touch screen is and a mouse or a trackpad isn't, and a screen whose short side is a
 * phone's. A desktop window of any width has a fine pointer, so it never counts, and a tablet's or a touch laptop's
 * screen is past a phone's. A check for no hover as well went the day it was written (2026-10-23): with the screen's size
 * it changed nothing, and it would have let a phone with a stylus that hovers play upright. Upright: the screen's own orientation, which an on-screen keyboard doesn't change, then the older
 * `window.orientation` (Safari before 16.4), and only where neither is known the window's shape. Where any of it can't be
 * read, it isn't a phone, and the game plays in the layout it has for a narrow window.
 */
export function readDevice(w: DeviceWindow | undefined = typeof window === 'undefined' ? undefined : window): { phone: boolean; upright: boolean } {
  if (!w?.matchMedia || !w.screen) return { phone: false, upright: false };
  const touch = w.matchMedia('(pointer: coarse)').matches;
  const short = Math.min(w.screen.width, w.screen.height);
  const phone = touch && short > 0 && short <= PHONE_SHORT_SIDE;
  const type = w.screen.orientation?.type;
  const upright = type ? type.startsWith('portrait')
    : typeof w.orientation === 'number' ? w.orientation === 0 || w.orientation === 180
      : w.matchMedia('(orientation: portrait)').matches;
  return { phone, upright };
}

/** Asked of the browser once a page: a lock to landscape, where there is one. Its refusal (most browsers refuse outside
 * fullscreen, and fullscreen is never asked for) changes nothing. */
type Lockable = { screen?: { orientation?: { lock?: (orientation: string) => Promise<void> } } };
let lockAsked = false;
export function askLandscapeOnce(w: Lockable | undefined = typeof window === 'undefined' ? undefined : (window as unknown as Lockable)): boolean {
  if (lockAsked) return false;
  lockAsked = true;
  try { void w?.screen?.orientation?.lock?.('landscape')?.catch(() => undefined); } catch { /* no lock here */ }
  return true;
}

/** Whether the game is behind Rotate Your Phone To Play now: what `TurnFrame` read from the device, or a test's own. */
export const UprightContext = createContext(false);
export const useUpright = () => useContext(UprightContext);

/** The phone upright, and asked again whenever it may have turned. */
function useDeviceUpright(): boolean {
  const read = () => { const d = readDevice(); return d.phone && d.upright; };
  const [upright, setUpright] = useState(read);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const again = () => setUpright(read());
    const queries = ['(orientation: portrait)', '(pointer: coarse)'].map((q) => window.matchMedia?.(q)).filter(Boolean);
    window.addEventListener('resize', again);
    window.addEventListener('orientationchange', again);
    window.screen?.orientation?.addEventListener?.('change', again);
    for (const q of queries) q!.addEventListener?.('change', again);
    if (readDevice().phone) askLandscapeOnce();
    again();
    return () => {
      window.removeEventListener('resize', again);
      window.removeEventListener('orientationchange', again);
      window.screen?.orientation?.removeEventListener?.('change', again);
      for (const q of queries) q!.removeEventListener?.('change', again);
    };
  }, []);
  return upright;
}

/** Where a scroll is kept across the turn: the page, the main column, an open dialog's body and the guide's page. */
const SCROLLERS = '#main, .modal-body, .guide-page';

/** Everything the app draws, with Rotate Your Phone To Play over it while a phone is upright. */
export function TurnFrame({ children }: { children: ReactNode }) {
  const upright = useDeviceUpright();
  const frame = useRef<HTMLDivElement>(null);
  const kept = useRef<{ focus: Element | null; scrolls: [Element, number, number][] } | null>(null);
  // Each scroll as it last stood with the phone on its side, taken as it moves (from 2026-10-23, brief 24's walk). Turned
  // upright, the window narrows before anything here hears of it, and the browser clamps a scroll the narrower page is too
  // short for. Until then the turn read the scrolls when it heard, already clamped: a student's Career Work, 300 pixels
  // down, came back at 237.
  const sideways = useRef(new WeakMap<Element, [number, number]>());
  useEffect(() => {
    const keep = (event: Event) => {
      const el = event.target;
      const device = readDevice();
      if (!(el instanceof Element) || !el.matches(SCROLLERS) || (device.phone && device.upright)) return;
      sideways.current.set(el, [el.scrollTop, el.scrollLeft]);
    };
    document.addEventListener('scroll', keep, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', keep, { capture: true });
  }, []);

  useLayoutEffect(() => {
    const node = frame.current;
    if (!node) return;
    if (upright) {
      kept.current = {
        focus: document.activeElement,
        scrolls: [...node.querySelectorAll(SCROLLERS)].map((el) => {
          const was = sideways.current.get(el);
          return [el, was?.[0] ?? el.scrollTop, was?.[1] ?? el.scrollLeft] as [Element, number, number];
        }),
      };
      node.inert = true;
      // A key or a tap while it shows reaches nothing behind it: not a dialog's Escape, not the game's shortcuts, and not
      // the press outside an open menu that closes it (`useDropdown`), so the menu is open when the phone turns back.
      const swallow = (event: Event) => { event.stopImmediatePropagation(); };
      const kinds = ['keydown', 'keyup', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'click'];
      for (const kind of kinds) window.addEventListener(kind, swallow, true);
      return () => { for (const kind of kinds) window.removeEventListener(kind, swallow, true); };
    }
    node.inert = false;
    const was = kept.current;
    kept.current = null;
    if (!was) return;
    // Put back once the landscape layout has been drawn again.
    const put = () => {
      for (const [el, top, left] of was.scrolls) if (el.isConnected) { el.scrollTop = top; el.scrollLeft = left; }
      if (was.focus instanceof HTMLElement && was.focus.isConnected && was.focus !== document.body) was.focus.focus({ preventScroll: true });
    };
    const id = requestAnimationFrame(() => requestAnimationFrame(put));
    return () => cancelAnimationFrame(id);
  }, [upright]);

  return (
    <UprightContext.Provider value={upright}>
      <div className="turn-frame" ref={frame}>{children}</div>
      {upright && <RotateScreen />}
    </UprightContext.Provider>
  );
}

/** The screen itself. */
export function RotateScreen() {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.focus(); }, []);
  return (
    <div className="rotate-screen" data-rotate-screen role="dialog" aria-modal="true" aria-labelledby="rotate-title" tabIndex={-1} ref={box}>
      <svg className="rotate-glyph" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <rect x="22" y="8" width="20" height="36" rx="3" />
        <path d="M14 50c6 6 22 8 32 1" />
        <path d="M46 51l-1-6M46 51l-6 0" />
      </svg>
      <h1 id="rotate-title">Rotate Your Phone To Play</h1>
      <p>SLATE is designed for landscape play. Turn your phone on its side and everything is as you left it.</p>
    </div>
  );
}

/**
 * In the game, the clock paused while the phone is upright: a live clock is paused through the same
 * command as Pause (`world.set_preferences`), so it stays paused when the phone turns back, until the player presses
 * Play, and Play starts from that moment (the live clock's own effect starts again from the wall clock as it then reads,
 * `app/game-context.tsx`), so the minutes upright are never added on. A clock already paused is left alone and nothing
 * is said of it.
 */
export function usePauseWhileUpright(): void {
  const upright = useUpright();
  const { sim, run, toast } = useGame();
  const paused = useRef(false);
  // No hold on the clock beside the pause (`hold`, as the dialogs use): paused, the live clock's effect isn't running,
  // and a hold kept as well changed nothing a test could find (mutated out on 2026-10-23, every test still passing).
  useEffect(() => {
    if (upright && sim.universe.preferences.timeSpeed !== 'paused') {
      run('world.set_preferences', { timeSpeed: 'paused' }, { silent: true });
      paused.current = true;
    } else if (!upright && paused.current) {
      paused.current = false;
      toast(PAUSED_WHILE_UPRIGHT);
    }
  }, [upright, sim, run, toast]);
}

export const PAUSED_WHILE_UPRIGHT = 'Paused while your phone was upright. Press Play to carry on.';
