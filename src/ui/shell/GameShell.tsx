/**
 * SLATE — the shell.
 *
 * HOME for immediate life, and the calendar for what is coming. Context is
 * preserved: the breadcrumbs survive moving around.
 *
 * The rail down the left is every destination, always in reach, with Home at
 * the top wearing the count of what is waiting on you. It is words only: no
 * icons. Below a
 * laptop it folds into a drawer behind the Menu button.
 *
 * The bar across the top keeps its two sides apart on purpose. Left is the
 * world: the mark, the clock, and the controls that move it. Right is you:
 * the tools you reach for, then the state of your save.
 */

import { useEffect, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { LifeEnded } from './LifeEnded';
import { RAIL_DESTINATIONS } from './destinations';
import { openDecisions, unreadNotifications } from '@/engine/world/world';
import { TimeControls } from './TimeControls';
import { GuideButton, GuideProvider, GuideStrip } from '@/ui/guide/Guide';
import { Home } from '@/ui/screens/Home';
import { WorkspaceRouter } from '@/ui/workspaces/WorkspaceRouter';
import { formatDate, formatTime, zoneAbbreviation } from '@/engine/core/time';
import { PERFORMER_NOUN } from '@/engine/core/performer';


export function GameShell() {
  const game = useGame();
  const { sim, route, navigate, breadcrumbs, toasts, recent, favourites, toggleFavourite } = game;
  // Places kept from 2026-10-01: pinned ones, and the last few visited. Each was opened from its own gated button first.
  const here = breadcrumbs[breadcrumbs.length - 1];
  const pinned = favourites.some((f) => f.route === route);
  const [railOpen, setRailOpen] = useState(false);
  // A search over the rail: what it lists, and the places already visited or pinned, each opened before from its own gated button.
  const [find, setFind] = useState('');
  const query = find.trim().toLowerCase();
  const known: { route: string; label: string; detail?: string }[] = [...RAIL_DESTINATIONS.flatMap((g) => g.items), ...favourites, ...recent];
  const recentShown = recent.filter((r) => r.route !== route && r.route !== '/home' && !favourites.some((f) => f.route === r.route)).slice(0, 5);
  const found = query ? [...new Map(known.filter((d) => d.route !== '/home').map((d) => [d.route, d])).values()]
    .filter((d) => `${d.label} ${d.detail ?? ''}`.toLowerCase().includes(query)) : [];
  const waiting = useWorld((s) => openDecisions(s).length);
  const unread = useWorld((s) => unreadNotifications(s).length);

  // Escape closes the drawer, the way it closes the dialogs. Without it the
  // only ways out were the Menu button and a shade the drawer covers most of,
  // and a keyboard had neither.
  useEffect(() => {
    if (!railOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setRailOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [railOpen]);

  // "/" anywhere outside a field opens the rail at its search, to go back to a place by name (from 2026-10-02).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const t = event.target as HTMLElement | null;
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      event.preventDefault();
      setRailOpen(true);
      window.setTimeout(() => document.getElementById('rail-find')?.focus(), 0);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // A life that has ended opens onto how it ended, and nothing else.
  const ended = useWorld((s) => s.universe.meta.endedAt !== undefined);

  const go = (to: string, label: string) => {
    navigate(to, label);
    setRailOpen(false);
  };

  if (ended) return <LifeEnded />;

  return (
    <GuideProvider>
    <div className="shell">
      <a className="skip-link" href="#main">Skip To Content</a>

      <header className="topbar">
        <button
          className="btn btn-ghost btn-sm rail-toggle"
          onClick={() => setRailOpen((open) => !open)}
          aria-expanded={railOpen}
          aria-controls="rail"
          aria-label="Toggle Navigation"
        >
          Menu
        </button>

        <button
          className="topbar-brand btn btn-ghost"
          onClick={() => navigate('/home', 'Home')}
          aria-label="SLATE, Go To Home"
        >
          <span role="img" aria-hidden="true">🎬</span>
          <span className="hide-sm">SLATE</span>
        </button>

        <div className="topbar-clock" aria-live="polite">
          <strong>{formatTime(sim.now, sim.zone)}</strong>
          <span className="topbar-clock-sep" aria-hidden="true">·</span>
          <span className="topbar-clock-date">{formatDate(sim.now, sim.zone)}</span>
          <span className="topbar-clock-zone">{zoneAbbreviation(sim.now, sim.zone)}</span>
        </div>

        <TimeControls />

        <div className="grow" />

        <span className="topbar-divider" aria-hidden="true" />

        <div className="topbar-group" role="group" aria-label="Your Save">
          <GuideButton />
          <SaveIndicator />

          <button className="btn btn-ghost btn-sm" onClick={game.exitToMenu}>
            Save &amp; Exit
          </button>
        </div>
      </header>

      <div className="shell-body">
        <nav className="rail" id="rail" data-open={railOpen} aria-label="Main Navigation">
          <div className="rail-group">
            <button
              className="rail-item"
              aria-current={route === '/home' ? 'page' : undefined}
              onClick={() => go('/home', 'Home')}
            >
              <span className="grow truncate">Home</span>
              {waiting + unread > 0 && (
                <span className="rail-badge" aria-label={`${waiting + unread} Waiting On You`}>
                  {waiting + unread > 99 ? '99+' : waiting + unread}
                </span>
              )}
            </button>
          </div>

          <div className="rail-group">
            <label htmlFor="rail-find" className="sr-only">Find A Place</label>
            <input id="rail-find" className="rail-find" value={find} placeholder="Find A Place ( / )" onChange={(e) => setFind(e.target.value)} />
          </div>
          {query && (
            <div className="rail-group">
              <div className="rail-group-label">Found</div>
              {found.length === 0 ? <div className="rail-empty xs dim">None by that name yet</div> : found.map((item) => (
                <button key={item.route} className="rail-item" aria-current={route === item.route ? 'page' : undefined} onClick={() => { go(item.route, item.label); setFind(''); }}>
                  <span className="grow truncate">{item.label}</span>
                </button>
              ))}
            </div>
          )}
          {!query && favourites.length > 0 && (
            <div className="rail-group">
              <div className="rail-group-label">Pinned</div>
              {favourites.map((item) => (
                <button key={item.route} className="rail-item" aria-current={route === item.route ? 'page' : undefined} onClick={() => go(item.route, item.label)}>
                  <span className="grow truncate">{item.label}</span>
                </button>
              ))}
            </div>
          )}
          {!query && recentShown.length > 0 && (
            <div className="rail-group">
              <div className="rail-group-label">Recent</div>
              {recentShown.map((item) => (
                <button key={item.route} className="rail-item" onClick={() => go(item.route, item.label)}>
                  <span className="grow truncate">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {!query && RAIL_DESTINATIONS.map((group) => (
            <div key={group.label} className="rail-group">
              <div className="rail-group-label">{group.label}</div>
              {group.items.map((item) => (
                <button
                  key={item.route}
                  className="rail-item"
                  aria-current={route === item.route ? 'page' : undefined}
                  title={item.detail}
                  onClick={() => go(item.route, item.label)}
                >
                  <span className="grow truncate">{item.label}</span>
                </button>
              ))}
            </div>
          ))}

          <div className="rail-group rail-player">
            <div className="rail-group-label">You</div>
            <div className="rail-you">
              <div className="small strong truncate">{sim.player.displayName}</div>
              <div className="xs dim truncate">
                {PERFORMER_NOUN[sim.player.performerTitle]} · {unread > 0 ? `${unread} Unread` : 'All Read'}
              </div>
            </div>
          </div>
        </nav>

        {railOpen && (
          <button
            type="button"
            className="rail-shade"
            aria-label="Close Navigation"
            onClick={() => setRailOpen(false)}
          />
        )}

        <main className="main" id="main" tabIndex={-1}>
          <div className="main-inner">
            <GuideStrip />
            {breadcrumbs.length > 1 && (
              <div className="crumb-row">
              <nav className="breadcrumbs" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb.route + index} className="row gap-2">
                    {index > 0 && <span aria-hidden="true">›</span>}
                    {index === breadcrumbs.length - 1 ? (
                      <span className="muted">{crumb.label}</span>
                    ) : (
                      <button onClick={() => navigate(crumb.route, crumb.label)}>{crumb.label}</button>
                    )}
                  </span>
                ))}
              </nav>
              {route !== '/home' && here && <button type="button" className="btn btn-sm btn-ghost" aria-pressed={pinned} onClick={() => toggleFavourite(here)}>{pinned ? 'Unpin This Page' : 'Pin This Page'}</button>}
              </div>
            )}

            <Screen route={route} />
          </div>
        </main>
      </div>

      <div className="toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast" data-tone={toast.tone}>{toast.message}</div>
        ))}
      </div>
    </div>
    </GuideProvider>
  );
}

function Screen({ route }: { route: string }) {
  if (route === '/home') return <Home />;
  if (route.startsWith('/workspace/')) return <WorkspaceRouter route={route} />;
  return <Home />;
}

function SaveIndicator() {
  const { saving, saveError, saveNow } = useGame();
  if (saveError) {
    return (
      <button className="btn btn-sm btn-danger" onClick={() => void saveNow()} title={saveError}>
        Save Failed — Retry
      </button>
    );
  }
  return (
    <span className="xs dim hide-sm" aria-live="polite" style={{ minWidth: 52, textAlign: 'right' }}>
      {saving ? 'Saving…' : 'Saved'}
    </span>
  );
}
