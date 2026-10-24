/**
 * SLATE — a phone turned (from 2026-10-24, the owner's brief 27: "REMOVE the “Rotate Your Phone To Play” overlay and
 * mandatory orientation gate").
 *
 * The game is laid out for a phone on its side, and it stays playable upright: the same interface, the one a narrow
 * window has always had (the drawer, one column, the stylesheet's `max-width: 56.25em` rules), nothing covered, nothing
 * inert, and the clock left as the player set it. What a turn still does is put back what the new layout moved: each
 * scroll the player left, as a share of its length when the layout under it changed and to the pixel when the phone
 * comes back to a layout the player didn't scroll away from, and the focus where it was.
 *
 * From 2026-10-23 (brief 23: "do not build a portrait gameplay layout") to 2026-10-24 a phone held upright saw Rotate
 * Your Phone To Play over the game; the frame under it was `inert`, every key and tap was swallowed, and in the game the
 * clock was paused while it showed and said so when the phone turned back (`usePauseWhileUpright`). Brief 27 took all of
 * it out. `docs/verification/ui-2026-10-23/rotation.md` keeps brief 23's reasons, and the device reading below is still
 * where a phone is told from a window.
 */

import { useEffect, type ReactNode } from 'react';

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
 * screen is past a phone's. Upright: the screen's own orientation, which an on-screen keyboard doesn't change, then the
 * older `window.orientation` (Safari before 16.4), and only where neither is known the window's shape. Where any of it
 * can't be read, it isn't a phone. Until 2026-10-24 this decided whether Rotate Your Phone To Play covered the game; it
 * decides now only whether the landscape lock is asked for (`askLandscapeOnce`).
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
 * fullscreen, and fullscreen is never asked for) changes nothing, and the game plays upright either way. */
type Lockable = { screen?: { orientation?: { lock?: (orientation: string) => Promise<void> } } };
let lockAsked = false;
export function askLandscapeOnce(w: Lockable | undefined = typeof window === 'undefined' ? undefined : (window as unknown as Lockable)): boolean {
  if (lockAsked) return false;
  lockAsked = true;
  try { void w?.screen?.orientation?.lock?.('landscape')?.catch(() => undefined); } catch { /* no lock here */ }
  return true;
}

/** Where a scroll is kept across a turn: the main column, an open dialog's body and the guide's page. */
export const SCROLLERS = '#main, .modal-body, .guide-page';

/** A scroll as the player left it: where, and how far along its length, in the layout it was left in. */
export interface KeptScroll { layout: string; top: number; left: number; along: number }

/** How far along its length a scroll is, 0 to 1, or 0 for one too short to scroll. */
export function alongOf(top: number, scrollHeight: number, clientHeight: number): number {
  const room = scrollHeight - clientHeight;
  return room > 0 ? Math.min(1, Math.max(0, top / room)) : 0;
}

/**
 * Where a kept scroll goes in the layout now drawn: to the pixel where the player left it in this same layout, and
 * otherwise the same share of the new length. Read by `TurnFrame`, and by `tests/b23-turn.test.ts` on its own.
 */
export function restoredTop(kept: KeptScroll, layout: string, scrollHeight: number, clientHeight: number): number {
  if (kept.layout === layout) return kept.top;
  return Math.round(kept.along * Math.max(0, scrollHeight - clientHeight));
}

/** The layout a turn moves between: upright or on its side, as the window's own shape says. */
const layoutNow = () => (typeof window !== 'undefined' && window.matchMedia?.('(orientation: portrait)').matches ? 'upright' : 'sideways');

/** Everything the app draws, with what a turn moved put back. */
export function TurnFrame({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // The scroll each scroller was last left at by the player, and in which layout, for each layout it was scrolled in.
    const kept = new WeakMap<Element, Record<string, KeptScroll>>();
    const latest = new WeakMap<Element, string>();
    // While a turn is being drawn, the browser clamps scrolls the new layout is too short for, and its scroll events
    // aren't the player's; nor are the scrolls put back. Until 2026-10-23 (brief 24's walk) the turn read the scrolls when
    // it heard of it, already clamped: a student's Career Work, 300 pixels down, came back at 237.
    let turning = false;
    const keep = (event: Event) => {
      const el = event.target;
      if (turning || !(el instanceof Element) || !el.matches(SCROLLERS)) return;
      const layout = layoutNow();
      kept.set(el, { ...(kept.get(el) ?? {}), [layout]: { layout, top: el.scrollTop, left: el.scrollLeft, along: alongOf(el.scrollTop, el.scrollHeight, el.clientHeight) } });
      latest.set(el, layout);
    };
    const query = window.matchMedia?.('(orientation: portrait)');
    let frame = 0;
    const turned = () => {
      turning = true;
      const focus = document.activeElement;
      cancelAnimationFrame(frame);
      // Put back once the new layout has been drawn: two frames, the first being the one the turn is drawn in.
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => {
        const layout = layoutNow();
        for (const el of document.querySelectorAll(SCROLLERS)) {
          const mine = kept.get(el);
          const last = latest.get(el);
          if (!mine || !last) continue;
          // The player's last scroll was in this layout: back to the pixel; else the share of it from the other layout.
          const from = last === layout ? mine[layout] : mine[last];
          if (!from) continue;
          el.scrollTop = restoredTop(from, layout, el.scrollHeight, el.clientHeight);
          el.scrollLeft = from.layout === layout ? from.left : 0;
        }
        if (focus instanceof HTMLElement && focus.isConnected && focus !== document.body && document.activeElement !== focus) focus.focus({ preventScroll: true });
        // The scroll events the restore fires arrive after this frame; the player's next scroll is kept from then.
        setTimeout(() => { turning = false; }, 120);
      }); });
    };
    document.addEventListener('scroll', keep, { capture: true, passive: true });
    query?.addEventListener?.('change', turned);
    if (readDevice().phone) askLandscapeOnce();
    return () => {
      document.removeEventListener('scroll', keep, { capture: true });
      query?.removeEventListener?.('change', turned);
      cancelAnimationFrame(frame);
    };
  }, []);
  return <div className="turn-frame">{children}</div>;
}
