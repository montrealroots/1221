/**
 * SLATE — the rail down the left: every place, by what the player wants to do
 * (from 2026-10-08, the owner's brief "a sidebar that makes them easy to
 * locate without crowding").
 *
 * Home and the search first; then what's pinned and what was lately opened;
 * then each group (`destinations.ts`), its picture and its name, folding
 * away. The group the current screen is in is open and marked, the screen
 * marked within it, and that screen's own sections (`sections.ts`) listed
 * under it, the one showing marked: choosing one opens the screen at it. Which
 * groups are folded is kept for this browser, a convenience only.
 *
 * Every row is a button at least 40 pixels tall, a name never cut short (a
 * long one wraps), the picture in a column of its own so the names line up
 * whether a row has one or not. Below a laptop the rail is a drawer over the
 * whole screen with its own Close button, and Escape closes it.
 */

import { useEffect, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { useFeature } from '@/ui/guide/Guide';
import { keep, useKept } from '@/ui/kept';
import { RAIL_DESTINATIONS, groupOf, type Destination, type GroupIcon } from './destinations';
import { SECTIONS, tabKey } from './sections';
import { openDecisions, unreadNotifications } from '@/engine/world/world';
import { PERFORMER_NOUN } from '@/engine/core/performer';

/** The feature a destination's screen is opened by in a guided life (`world/tutorial.ts`). */
const FEATURE: Record<string, string> = {
  '/workspace/calendar': 'ui.calendar', '/workspace/routines': 'ui.routines', '/workspace/food': 'ui.food', '/workspace/clothes': 'ui.clothes',
  '/workspace/people': 'ui.people', '/workspace/school': 'ui.school', '/workspace/career': 'ui.career', '/workspace/industry': 'ui.industry',
  '/workspace/travel': 'ui.travel', '/workspace/vehicles': 'ui.vehicles', '/workspace/belongings': 'ui.belongings', '/workspace/homes': 'ui.homes',
  '/workspace/land': 'ui.land', '/workspace/bank': 'ui.bank', '/workspace/papers': 'ui.papers',
};

/** The pictures, drawn on a 24-unit grid with a line, so they're the same on every platform. */
const PATHS: Record<GroupIcon | 'home' | 'find' | 'pin' | 'recent', string> = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  find: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM16 16l5 5',
  pin: 'M12 3v6l4 3v2H8v-2l4-3M12 14v7',
  recent: 'M12 3a9 9 0 1 1-9 9M12 7v5l3 3M3 4v5h5',
  day: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.5a3.3 3.3 0 0 1 0 6.3M18 14c2.3.6 3.5 2.8 3.5 6',
  work: 'M3 8h18v12H3zM9 8V5h6v3M3 13h18',
  travel: 'M2 16l20-8-3 9-6-2-3 5-1-6z',
  things: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
  money: 'M3 6h18v12H3zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6 9v.01M18 15v.01',
  affairs: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7',
};

export function RailIcon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg className="rail-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function readFolded(): string[] {
  try { return JSON.parse(localStorage.getItem('slate.rail.folded') ?? '[]') as string[]; } catch { return []; }
}
function writeFolded(labels: string[]): void {
  try { localStorage.setItem('slate.rail.folded', JSON.stringify(labels)); } catch { /* a convenience only */ }
}

/** A destination's row: opens it, or, locked in a guided life, asks the guide. */
function RailItem({ item, current, go }: { item: Destination; current: string; go: (route: string, label: string) => void }) {
  const { open, ask } = useFeature(FEATURE[item.route] ?? 'ui.home');
  const here = current === item.route || current.startsWith(`${item.route}/`);
  const sections = here ? SECTIONS[item.route] : undefined;
  const [tab] = useKept<string | undefined>(tabKey(item.route), undefined);
  const showing = tab ?? sections?.[0]?.id;
  return (
    <li>
      <button type="button" className="rail-item" aria-current={current === item.route ? 'page' : here ? 'location' : undefined} title={item.detail}
        onClick={() => (open ? go(item.route, item.label) : ask())}>
        <span className="rail-label">{item.label}</span>
        {!open && <span className="chip rail-chip">Locked</span>}
      </button>
      {open && sections && (
        <ul className="rail-sections" aria-label={`${item.label}: Sections`}>
          {sections.map((s) => (
            <li key={s.id}>
              <button type="button" className="rail-item rail-section" aria-current={s.id === showing ? 'true' : undefined}
                onClick={() => { keep(tabKey(item.route), s.id); go(item.route, item.label); }}>
                <span className="rail-label">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function Rail({ open, onClose }: { open: boolean; onClose: () => void }) {
  const game = useGame();
  const { sim, route, navigate, recent, favourites } = game;
  const [folded, setFolded] = useState<string[]>(readFolded);
  const [find, setFind] = useState('');
  const query = find.trim().toLowerCase();
  const waiting = useWorld((s) => openDecisions(s).length);
  const unread = useWorld((s) => unreadNotifications(s).length);
  const currentGroup = groupOf(route)?.label;
  const all = RAIL_DESTINATIONS.flatMap((g) => g.items);
  const known: { route: string; label: string; detail?: string }[] = [...all, ...favourites, ...recent];
  const found = query ? [...new Map(known.filter((d) => d.route !== '/home').map((d) => [d.route, d])).values()]
    .filter((d) => `${d.label} ${d.detail ?? ''}`.toLowerCase().includes(query)) : [];
  const recentShown = recent.filter((r) => r.route !== route && r.route !== '/home' && !favourites.some((f) => f.route === r.route)).slice(0, 5);

  const go = (to: string, label: string) => { navigate(to, label); onClose(); };
  const toggle = (label: string) => setFolded((list) => { const next = list.includes(label) ? list.filter((x) => x !== label) : [...list, label]; writeFolded(next); return next; });

  // "/" anywhere outside a field opens the rail at its search, to go to a place by name (from 2026-10-02).
  useEffect(() => {
    if (!open) return undefined;
    window.setTimeout(() => (document.querySelector('#rail .rail-item, #rail-find') as HTMLElement | null)?.focus(), 0);
    return undefined;
  }, [open]);

  return (
    <nav className="rail" id="rail" data-open={open} aria-label="Main Navigation">
      <div className="rail-head">
        <span className="rail-title">Go To</span>
        <button type="button" className="btn btn-sm rail-close" onClick={onClose}>Close Menu</button>
      </div>
      <ul className="rail-list">
        <li>
          <button type="button" className="rail-item rail-home" aria-current={route === '/home' ? 'page' : undefined} onClick={() => go('/home', 'Home')}>
            <RailIcon name="home" />
            <span className="rail-label">Home</span>
            {waiting + unread > 0 && <span className="rail-badge" aria-label={`${waiting + unread} Waiting On You`}>{waiting + unread > 99 ? '99+' : waiting + unread}</span>}
          </button>
        </li>
      </ul>
      <div className="rail-search">
        <label htmlFor="rail-find" className="sr-only">Find A Place</label>
        <RailIcon name="find" />
        <input id="rail-find" className="rail-find" value={find} placeholder="Find A Place ( / )" onChange={(e) => setFind(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && found[0]) { go(found[0].route, found[0].label); setFind(''); } }} />
      </div>
      {query ? (
        <section className="rail-group" aria-label="Found">
          <div className="rail-group-label">Found</div>
          {found.length === 0 ? <div className="rail-empty xs dim">No place by that name</div> : (
            <ul className="rail-list">{found.map((item) => <li key={item.route}><button type="button" className="rail-item" aria-current={route === item.route ? 'page' : undefined} onClick={() => { go(item.route, item.label); setFind(''); }}><span className="rail-label">{item.label}</span></button></li>)}</ul>
          )}
        </section>
      ) : (
        <>
          {RAIL_DESTINATIONS.map((group) => {
            const shut = folded.includes(group.label) && group.label !== currentGroup;
            const id = `rail-group-${group.icon}`;
            return (
              <section key={group.label} className="rail-group" data-current={group.label === currentGroup}>
                <button type="button" className="rail-group-head" aria-expanded={!shut} aria-controls={id} onClick={() => toggle(group.label)}>
                  <RailIcon name={group.icon} />
                  <span className="rail-label">{group.label}</span>
                  <svg className="rail-chevron" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path d="M8 10l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                {!shut && <ul className="rail-list rail-items" id={id}>{group.items.map((item) => <RailItem key={item.route} item={item} current={route} go={go} />)}</ul>}
              </section>
            );
          })}
          {favourites.length > 0 && (
            <section className="rail-group" aria-label="Pinned">
              <div className="rail-group-label"><RailIcon name="pin" />Pinned</div>
              <ul className="rail-list rail-items">{favourites.map((item) => <li key={item.route}><button type="button" className="rail-item" aria-current={route === item.route ? 'page' : undefined} onClick={() => go(item.route, item.label)}><span className="rail-label">{item.label}</span></button></li>)}</ul>
            </section>
          )}
          {recentShown.length > 0 && (
            <section className="rail-group" aria-label="Recent">
              <div className="rail-group-label"><RailIcon name="recent" />Recent</div>
              <ul className="rail-list rail-items">{recentShown.map((item) => <li key={item.route}><button type="button" className="rail-item" onClick={() => go(item.route, item.label)}><span className="rail-label">{item.label}</span></button></li>)}</ul>
            </section>
          )}
        </>
      )}
      <div className="rail-player">
        <div className="rail-group-label">You</div>
        <div className="rail-you">
          <div className="small strong">{sim.player.displayName}</div>
          <div className="xs dim">{PERFORMER_NOUN[sim.player.performerTitle]} · {unread > 0 ? `${unread} Unread` : 'All Read'}</div>
        </div>
      </div>
    </nav>
  );
}
