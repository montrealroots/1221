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
import { refreshMeta } from '@/engine';
import { loadImdbRatings, loadKnownTitles, loadBroadcastSeries } from '@/engine/content/filmography';
import { loadPeople, loadPeopleAwards, loadPeopleCredits } from '@/engine/content/people';
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
  advance: (ms: number) => void;
  advanceTo: (instant: number) => void;
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

  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;

  exitToMenu: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame was called outside the game provider.');
  return value;
}

/** Re-reads a value from the simulation whenever the world changes. */
export function useWorld<T>(read: (sim: Simulation) => T): T {
  const { sim, version } = useGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => read(sim), [sim, version]);
}

const AUTOSAVE_INTERVAL_MS = 45_000;
/** One real second is one world minute at standard speed. */
/**
 * How much world time passes for a given amount of real time.
 *
 * Live is one to one — a minute of your evening is a minute of theirs, which
 * is the whole point of a life you live alongside rather than fast-forward
 * through. The faster settings exist for waiting out a shoot or a pregnancy.
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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
    if (!result.ok && !options.silent) toast(result.error ?? 'That could not be done.', 'negative');
    if (result.ok) dirty.current = true;
    refresh();
    return result;
  }, [sim, toast, refresh]);

  const advance = useCallback((ms: number) => {
    if (ms <= 0) return;
    try {
      sim.advanceBy(ms);
      dirty.current = true;
    } catch (error) {
      toast((error as Error).message, 'negative');
    }
    refresh();
  }, [sim, toast, refresh]);

  const advanceTo = useCallback((instant: number) => {
    try {
      sim.advanceTo(instant);
      dirty.current = true;
    } catch (error) {
      toast((error as Error).message, 'negative');
    }
    refresh();
  }, [sim, toast, refresh]);

  const navigate = useCallback((next: string, label?: string) => {
    setRoute(next);
    const entry: NavEntry = { route: next, label: label ?? labelForRoute(next) };
    setBreadcrumbs((crumbs) => {
      const existing = crumbs.findIndex((c) => c.route === next);
      if (existing >= 0) return crumbs.slice(0, existing + 1);
      return [...crumbs, entry].slice(-6);
    });
    setRecent((list) => [entry, ...list.filter((r) => r.route !== next)].slice(0, 10));
    setSearchOpen(false);
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
  // The world moves while the player is in it. Standard speed is one world
  // minute per real second; pausing genuinely stops the clock.
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

      const step = stepper.feed(elapsed);
      if (step < 1) return;

      try {
        sim.advanceBy(step);
        sim.universe.meta.playtimeSeconds += elapsed / 1_000;
        dirty.current = true;
        setVersion((v) => v + 1);
      } catch {
        // A handler threw; stop ticking rather than looping on the error.
        window.clearInterval(handle);
      }
    }, TICK_MS);
    return () => window.clearInterval(handle);
  }, [sim, timeSpeed]);

  // --- The record -----------------------------------------------------------
  // Every real title, so nothing made here can share a name with one, and the
  // IMDb ratings the catalogue shows. Neither blocks play if it fails.
  useEffect(() => {
    void loadKnownTitles().catch(() => {});
    void loadImdbRatings().catch(() => {});
    // The television grids are built from the record's own schedules, so the
    // series have to be in hand before the first week of a save airs.
    void loadBroadcastSeries().catch(() => {});
    // And the people: who they are, everything they are on, and what they have
    // won. Fetched in that order because a profile is readable without the
    // last two and unreadable without the first.
    void loadPeople()
      .then(() => Promise.all([loadPeopleCredits(), loadPeopleAwards()]))
      .catch(() => {});
  }, []);

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

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
        return;
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setHelpOpen(false);
        return;
      }
      if (typing) return;
      if (event.key === '/') { event.preventDefault(); setSearchOpen(true); }
      if (event.key === '?') { event.preventDefault(); setHelpOpen((open) => !open); }
      if (event.key.toLowerCase() === 'h' && !event.metaKey && !event.ctrlKey) navigate('/home', 'Home');
      if (event.key.toLowerCase() === 'w' && !event.metaKey && !event.ctrlKey) navigate('/world', 'World');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  // Honour the reduced-motion preference at the document level.
  useEffect(() => {
    document.body.dataset['reducedMotion'] = String(reducedMotion);
  }, [reducedMotion]);

  const exitToMenu = useCallback(() => {
    void saveNow().then(onExit);
  }, [saveNow, onExit]);

  const value: GameContextValue = {
    sim, version, run, advance, advanceTo, refresh,
    route, navigate, back, breadcrumbs, recent, favourites, toggleFavourite,
    toasts, toast,
    saving, saveError, saveNow,
    searchOpen, setSearchOpen, helpOpen, setHelpOpen,
    exitToMenu,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ---------------------------------------------------------------------------

const ROUTE_LABELS: Record<string, string> = {
  '/home': 'Home',
  '/world': 'World',
  '/workspace/calendar': 'Calendar',
  '/workspace/bank': 'Bank',
  '/workspace/jobs': 'Work',
  '/workspace/wellbeing': 'Wellbeing',
  '/workspace/relationships': 'Relationships',
  '/workspace/property': 'Property',
  '/workspace/vehicles': 'Vehicles',
  '/workspace/shopping': 'Shopping',
  '/workspace/travel': 'Travel',
  '/workspace/city': 'The City',
  '/workspace/health': 'Health',
  '/workspace/insurance': 'Insurance',
  '/workspace/education': 'Education',
  '/workspace/social': 'Social',
  '/workspace/casting': 'Casting',
  '/workspace/projects': 'Projects',
  '/workspace/company': 'Company',
  '/workspace/awards': 'Awards',
  '/workspace/history': 'History',
  '/workspace/character': 'Character',
  '/workspace/settings': 'Settings',
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
    /* storage unavailable; favourites are a convenience, not state */
  }
}
