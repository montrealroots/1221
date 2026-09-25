/**
 * SLATE — the bridge between the simulation and React.
 *
 * The Simulation mutates a plain object in place, which React cannot observe.
 * Rather than making the engine reactive (and paying for that on every one of
 * the millions of writes a long save performs), the UI bumps a version counter
 * after any mutation and re-reads what it needs.
 */

import { createClockStepper } from '@/engine/core/realclock';
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import type { Simulation, CommandResult } from '@/engine';
import type { AdvanceResult } from '@/engine/core/simulation';
import type { ScheduledItem } from '@/engine/core/scheduler';
import { refreshMeta } from '@/engine';
import type { SaveAdapter } from '@/engine/persistence/adapter';

export interface Toast {
  id: number;
  message: string;
  tone: 'neutral' | 'positive' | 'negative';
}

export interface NavEntry {
  route: string;
  label: string;
}

export interface GameContextValue {
  sim: Simulation;
  /** Increments on every mutation. Components read it to stay current. */
  version: number;
  /** Runs a command and refreshes the UI. Failures surface as a toast. */
  run: <R = unknown>(kind: string, payload?: Record<string, unknown>, options?: { idempotencyKey?: string; silent?: boolean }) => CommandResult<R>;
  /** Advances world time through the one advancement path. */
  advance: (ms: number) => AdvanceResult | undefined;
  /** `resumes` carries on a jump a stop broke off: where that jump was sent from. */
  advanceTo: (instant: number, resumes?: number) => AdvanceResult | undefined;
  /** What the clock stopped at, waiting on the player to decide, and the jump it broke off. */
  standingAt: { item: ScheduledItem; wanted: number; sentFrom: number } | null;
  clearStandingAt: () => void;
  /** Forces a re-read without mutating. */
  refresh: () => void;

  route: string;
  navigate: (route: string, label?: string) => void;
  back: () => void;
  breadcrumbs: NavEntry[];
  recent: NavEntry[];
  favourites: NavEntry[];
  toggleFavourite: (entry: NavEntry) => void;

  toasts: Toast[];
  toast: (message: string, tone?: Toast['tone']) => void;

  saving: boolean;
  saveError?: string;
  saveNow: () => Promise<void>;

  exitToMenu: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame was called outside the game provider.');
  return value;
}

/** Re-reads a value from the simulation whenever the world changes. */
/**
 * Read something out of the world, recomputed when the world changes.
 *
 * `deps` is for anything the callback closes over that is not the world — a
 * month the screen is looking at, a subject it is about to open. Without it
 * the memo holds on `[sim, version]` alone, so a screen that changed its own
 * mind about what to read went on showing the old answer until the clock
 * happened to tick: the calendar paged March to June with the label
 * advancing and the grid frozen on March, and paused it never caught up at
 * all.
 */
export function useWorld<T>(read: (sim: Simulation) => T, deps: readonly unknown[] = []): T {
  const { sim, version } = useGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => read(sim), [sim, version, ...deps]);
}

const AUTOSAVE_INTERVAL_MS = 45_000;
/**
 * How much world time passes for a given amount of real time.
 *
 * Live is one to one — a minute of your evening is a minute of theirs, which
 * is the whole point of a life you live alongside rather than fast-forward
 * through. The faster settings were for waiting out a shoot or a pregnancy,
 * which went with the systems that had them; the time controls offer only
 * Play and Pause now, so nothing reaches them.
 */
const SPEED_MULTIPLIER: Record<string, number> = {
  paused: 0,
  live: 1,
  fast: 60,
  faster: 600,
};

/** How often the loop wakes. Often enough to feel continuous, cheap to ignore. */
const TICK_MS = 1_000;


export function GameProvider({
  sim, adapter, onExit, children,
}: {
  sim: Simulation;
  adapter: SaveAdapter;
  onExit: () => void;
  children: ReactNode;
}) {
  const [version, setVersion] = useState(0);
  const [route, setRoute] = useState('/home');
  const [breadcrumbs, setBreadcrumbs] = useState<NavEntry[]>([{ route: '/home', label: 'Home' }]);
  const [recent, setRecent] = useState<NavEntry[]>([]);
  const [favourites, setFavourites] = useState<NavEntry[]>(() => readFavourites());
  const [toasts, setToasts] = useState<Toast[]>([]);
  /**
   * The thing the clock stopped at, where it was trying to get to, and where
   * that jump was sent from, so carrying on to it is the same jump.
   *
   * Held here rather than on the control that happened to move the clock,
   * because every way of moving it can be halted — the Advance menu, Skip To
   * Event, and the live tick that runs while nobody touches anything.
   */
  const [standingAt, setStandingAt] = useState<{ item: ScheduledItem; wanted: number; sentFrom: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();
  const toastId = useRef(0);
  const dirty = useRef(false);

  // Re-read on every render so the ticker restarts when the player changes it.
  const timeSpeed = sim.universe.preferences.timeSpeed;
  const reducedMotion = sim.universe.preferences.reducedMotion;

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const toast = useCallback((message: string, tone: Toast['tone'] = 'neutral') => {
    const id = ++toastId.current;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, tone === 'negative' ? 7000 : 4200);
  }, []);

  const run = useCallback(<R,>(
    kind: string,
    payload: Record<string, unknown> = {},
    options: { idempotencyKey?: string; silent?: boolean } = {},
  ): CommandResult<R> => {
    const result = sim.execute<R>({ kind, payload, idempotencyKey: options.idempotencyKey });
    if (!result.ok && !options.silent) toast(result.error ?? 'That couldn’t be done.', 'negative');
    if (result.ok) dirty.current = true;
    refresh();
    return result;
  }, [sim, toast, refresh]);

  /**
   * Moving the clock from a screen always stops at something that wants you.
   *
   * The world's own `advanceTo` does not, and neither did this: setting the
   * clock a month ahead ran straight over every commitment in the month and
   * marked each one attended, so the dialog that warned you were about to
   * miss something was telling you a thing that could not happen. You go to
   * what you stop for. This is the stop.
   *
   * Both return the advance, so a screen can say what it halted at.
   */
  /**
   * The world stopped at something that wants you, so the world waits.
   *
   * Pausing is the point rather than a nicety. The clock is at the thing but
   * has not resolved it, and the stop only triggers on the way to something —
   * once the clock is standing on it, the next tick of any kind runs it. So a
   * live clock left running behind the question answered it: the player
   * pressed Don't Go and the world said "that's already settled one way or
   * the other", because a tenth of a second earlier it had been.
   */
  const halt = useCallback((result: AdvanceResult, wanted: number) => {
    if (!result.interruptedBy) return;
    sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } });
    setStandingAt({ item: result.interruptedBy, wanted, sentFrom: result.sentFrom });
  }, [sim]);

  const advance = useCallback((ms: number): AdvanceResult | undefined => {
    if (ms <= 0) return undefined;
    try {
      const wanted = sim.now + ms;
      const result = sim.advanceBy(ms, { stopOnPlayerRequired: true });
      dirty.current = true;
      halt(result, wanted);
      refresh();
      return result;
    } catch (error) {
      toast((error as Error).message, 'negative');
      refresh();
      return undefined;
    }
  }, [sim, toast, refresh, halt]);

  const advanceTo = useCallback((instant: number, resumes?: number): AdvanceResult | undefined => {
    try {
      const result = sim.advanceTo(instant, { stopOnPlayerRequired: true, resumes });
      dirty.current = true;
      halt(result, instant);
      refresh();
      return result;
    } catch (error) {
      toast((error as Error).message, 'negative');
      refresh();
      return undefined;
    }
  }, [sim, toast, refresh, halt]);

  const navigate = useCallback((next: string, label?: string) => {
    setRoute(next);
    const entry: NavEntry = { route: next, label: label ?? labelForRoute(next) };
    setBreadcrumbs((crumbs) => {
      const existing = crumbs.findIndex((c) => c.route === next);
      if (existing >= 0) return crumbs.slice(0, existing + 1);
      return [...crumbs, entry].slice(-6);
    });
    setRecent((list) => [entry, ...list.filter((r) => r.route !== next)].slice(0, 10));
  }, []);

  const back = useCallback(() => {
    setBreadcrumbs((crumbs) => {
      if (crumbs.length <= 1) return crumbs;
      const next = crumbs.slice(0, -1);
      const target = next[next.length - 1];
      if (target) setRoute(target.route);
      return next;
    });
  }, []);

  const toggleFavourite = useCallback((entry: NavEntry) => {
    setFavourites((list) => {
      const next = list.some((f) => f.route === entry.route)
        ? list.filter((f) => f.route !== entry.route)
        : [...list, entry].slice(0, 12);
      writeFavourites(next);
      return next;
    });
  }, []);

  const saveNow = useCallback(async () => {
    setSaving(true);
    setSaveError(undefined);
    try {
      refreshMeta(sim);
      await adapter.save(sim.universe);
      dirty.current = false;
    } catch (error) {
      const message = (error as Error).message;
      setSaveError(message);
      toast(message, 'negative');
    } finally {
      setSaving(false);
    }
  }, [sim, adapter, toast]);

  // --- Real time ----------------------------------------------------------
  // The world moves while the player is in it. Live is a world second per
  // real second; pausing genuinely stops the clock.
  useEffect(() => {
    const multiplier = SPEED_MULTIPLIER[timeSpeed] ?? 1;
    if (multiplier === 0) return;

    // Measured against a monotonic clock rather than assumed from the interval.
    // A throttled or backgrounded tab does not fire on schedule, and a world
    // clock that quietly loses an hour is worse than one that runs behind.
    // The arithmetic — carrying fractions, paying a night away back in
    // bounded steps — is the stepper's, and is tested to the millisecond.
    let lastAt = performance.now();
    const stepper = createClockStepper(multiplier);

    const handle = window.setInterval(() => {
      const now = performance.now();
      const elapsed = Math.max(0, now - lastAt);
      lastAt = now;
      // A finished life has no more time in it, and none is counted as played.
      if (sim.universe.meta.endedAt !== undefined) return;

      const step = stepper.feed(elapsed);
      if (step < 1) return;

      try {
        // The live clock stops at something that wants you, the same as any
        // other way of moving it. Without this the world ran the commitment
        // while the player was standing in front of the choice about it, and
        // the answer came back "that's already settled one way or the other".
        const wanted = sim.now + step;
        const result = sim.advanceBy(step, { stopOnPlayerRequired: true });
        sim.universe.meta.playtimeSeconds += elapsed / 1_000;
        dirty.current = true;
        halt(result, wanted);
        setVersion((v) => v + 1);
      } catch {
        // A handler threw; stop ticking rather than looping on the error.
        window.clearInterval(handle);
      }
    }, TICK_MS);
    return () => window.clearInterval(handle);
  }, [sim, timeSpeed, halt]);


  // --- Autosave -----------------------------------------------------------
  useEffect(() => {
    const handle = window.setInterval(() => {
      if (dirty.current) void saveNow();
    }, AUTOSAVE_INTERVAL_MS);
    return () => window.clearInterval(handle);
  }, [saveNow]);

  // Save on the way out, so closing the tab does not cost progress.
  useEffect(() => {
    const onLeave = () => {
      if (!dirty.current) return;
      refreshMeta(sim);
      void adapter.save(sim.universe);
    };
    window.addEventListener('pagehide', onLeave);
    return () => {
      window.removeEventListener('pagehide', onLeave);
      onLeave();
    };
  }, [sim, adapter]);

  // --- Keyboard -----------------------------------------------------------
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if (typing) return;
      if (event.key.toLowerCase() === 'h' && !event.metaKey && !event.ctrlKey) navigate('/home', 'Home');
      if (event.key.toLowerCase() === 'c' && !event.metaKey && !event.ctrlKey) navigate('/workspace/calendar', 'Calendar');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  // Honor the reduced-motion preference at the document level.
  useEffect(() => {
    document.body.dataset['reducedMotion'] = String(reducedMotion);
  }, [reducedMotion]);

  const exitToMenu = useCallback(() => {
    void saveNow().then(onExit);
  }, [saveNow, onExit]);

  const value: GameContextValue = {
    sim, version, run, advance, advanceTo, refresh,
    standingAt, clearStandingAt: () => setStandingAt(null),
    route, navigate, back, breadcrumbs, recent, favourites, toggleFavourite,
    toasts, toast,
    saving, saveError, saveNow,
    exitToMenu,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ---------------------------------------------------------------------------

const ROUTE_LABELS: Record<string, string> = {
  '/home': 'Home',
  '/workspace/calendar': 'Calendar',
};

export function labelForRoute(route: string): string {
  if (ROUTE_LABELS[route]) return ROUTE_LABELS[route] as string;
  const tail = route.split('/').filter(Boolean).pop() ?? route;
  return tail.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function readFavourites(): NavEntry[] {
  try {
    const raw = localStorage.getItem('slate.favourites');
    return raw ? (JSON.parse(raw) as NavEntry[]) : [];
  } catch {
    return [];
  }
}

function writeFavourites(entries: NavEntry[]): void {
  try {
    localStorage.setItem('slate.favourites', JSON.stringify(entries));
  } catch {
    /* storage unavailable; favorites are a convenience, not state */
  }
}
