/**
 * SLATE — the shell.
 *
 * HOME for immediate life, and the calendar for what is coming. Context is
 * preserved: the breadcrumbs survive moving around.
 *
 * The rail down the left is every destination, always in reach, with Home at
 * the top wearing the count of what is waiting on you (`Rail.tsx`). It was
 * words only until 2026-10-08, when its groups got drawn pictures beside their
 * names. Below a laptop it's a drawer over the screen behind the Menu button.
 *
 * The bar across the top keeps its two sides apart on purpose. Left is the
 * world: the mark, the clock, and the controls that move it. Right is you:
 * the tools you reach for, then the state of your save.
 */

import { useEffect, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { LifeEnded } from './LifeEnded';
import { Rail } from './Rail';
import { useKeptScroll } from '@/ui/kept';
import { TimeControls } from './TimeControls';
import { GuideButton, GuideProvider, GuideStrip } from '@/ui/guide/Guide';
import { AssistantButton } from '@/ui/assistant/Assistant';
import { Home } from '@/ui/screens/Home';
import { WorkspaceRouter } from '@/ui/workspaces/WorkspaceRouter';
import { formatDate, formatTime, zoneAbbreviation } from '@/engine/core/time';


export function GameShell() {
  const game = useGame();
  const { sim, route, navigate, breadcrumbs, toasts, favourites, toggleFavourite } = game;
  // Places kept from 2026-10-01: pinned ones, and the last few visited, now in the rail (`Rail.tsx`).
  const here = breadcrumbs[breadcrumbs.length - 1];
  const pinned = favourites.some((f) => f.route === route);
  const [railOpen, setRailOpen] = useState(false);

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
          <AssistantButton />
          <GuideButton />
          <SaveIndicator />

          <button className="btn btn-ghost btn-sm" onClick={game.exitToMenu}>
            Save &amp; Exit
          </button>
        </div>
      </header>

      <div className="shell-body">
        <Rail open={railOpen} onClose={() => setRailOpen(false)} />

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
  // Each screen opens where it was left, scrolled as it was (`ui/kept.ts`, from 2026-10-08); The Industry keeps its own pages'.
  useKeptScroll(route, !route.startsWith('/workspace/industry'));
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
