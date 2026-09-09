/**
 * SLATE — the shell.
 *
 * HOME for immediate life, and the calendar for what is coming. Context is
 * preserved: the breadcrumbs survive moving around.
 *
 * The rail down the left is every destination, always in reach, with Home at
 * the top wearing the count of what is waiting on you. It is words only: no
 * icons, and a locked room says Locked rather than showing a padlock. Below a
 * laptop it folds into a drawer behind the Menu button.
 *
 * The bar across the top keeps its two sides apart on purpose. Left is the
 * world: the mark, the clock, and the controls that move it. Right is you:
 * the tools you reach for, then the state of your save.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { DESTINATIONS } from './destinations';
import { openDecisions, unreadNotifications } from '@/engine/world/world';
import { TimeControls } from './TimeControls';
import { Home } from '@/ui/screens/Home';
import { WorkspaceRouter } from '@/ui/workspaces/WorkspaceRouter';
import { formatDate, formatTime, zoneAbbreviation } from '@/engine/core/time';
import { performerNoun } from '@/engine/core/performer';


export function GameShell() {
  const game = useGame();
  const { sim, route, navigate, breadcrumbs, toasts } = game;
  const [railOpen, setRailOpen] = useState(false);
  const waiting = useWorld((s) => openDecisions(s).length);
  const unread = useWorld((s) => unreadNotifications(s).length);

  const go = (to: string, label: string, locked?: boolean) => {
    if (locked) { game.toast(`${label} Is Under Construction.`, 'neutral'); return; }
    navigate(to, label);
    setRailOpen(false);
  };

  return (
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
          <SaveIndicator />

          <button className="btn btn-ghost btn-sm hide-sm" onClick={game.exitToMenu}>
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

          {DESTINATIONS.map((group) => (
            <div key={group.label} className="rail-group">
              <div className="rail-group-label">{group.label}</div>
              {group.items.map((item) => (
                <button
                  key={item.route}
                  className={`rail-item${item.locked ? ' is-locked' : ''}`}
                  aria-current={!item.locked && route === item.route ? 'page' : undefined}
                  aria-label={item.locked ? `${item.label}, Locked, Under Construction` : undefined}
                  title={item.detail}
                  onClick={() => go(item.route, item.label, item.locked)}
                >
                  <span className="grow truncate">{item.label}</span>
                  {item.locked && <span className="rail-lock">Locked</span>}
                </button>
              ))}
            </div>
          ))}

          <div className="rail-group rail-player">
            <div className="rail-group-label">You</div>
            <div className="rail-you">
              <div className="small strong truncate">{sim.player.displayName}</div>
              <div className="xs dim truncate">
                {performerNoun(sim.player)} · {unread > 0 ? `${unread} Unread` : 'Nothing Unread'}
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
            {breadcrumbs.length > 1 && (
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
