/**
 * SLATE — the shell.
 *
 * HOME for immediate life, WORLD for discovery, workspaces for deep work, and
 * Go Anywhere over the top of all of it. Context is preserved: breadcrumbs,
 * recent destinations and favourites all survive moving around.
 */

import { useState } from 'react';
import { useGame } from '@/app/game-context';
import { GoAnywhere } from './GoAnywhere';
import { HelpPanel } from './HelpPanel';
import { TimeControls } from './TimeControls';
import { Home } from '@/ui/screens/Home';
import { World } from '@/ui/screens/World';
import { WorkspaceRouter } from '@/ui/workspaces/WorkspaceRouter';
import { openDecisions, unreadNotifications } from '@/engine/world/world';
import { formatDate, formatTime, zoneAbbreviation } from '@/engine/core/time';
import { useWorld } from '@/app/game-context';

interface RailEntry {
  route: string;
  label: string;
  icon: string;
  badge?: number;
}

export function GameShell() {
  const game = useGame();
  const { sim, route, navigate, breadcrumbs, searchOpen, setSearchOpen, helpOpen, setHelpOpen, toasts } = game;
  const [railOpen, setRailOpen] = useState(false);

  const decisions = useWorld((s) => openDecisions(s).length);
  const unread = useWorld((s) => unreadNotifications(s).length);
  const player = useWorld((s) => s.player);

  const groups: { label: string; items: RailEntry[] }[] = [
    {
      label: 'Life',
      items: [
        { route: '/home', label: 'Home', icon: '⌂', badge: decisions },
        { route: '/world', label: 'World', icon: '◎' },
        { route: '/workspace/calendar', label: 'Calendar', icon: '▤' },
        { route: '/workspace/wellbeing', label: 'Wellbeing', icon: '◍' },
        { route: '/workspace/relationships', label: 'Relationships', icon: '⚭' },
        { route: '/workspace/history', label: 'History', icon: '❧' },
      ],
    },
    {
      label: 'Money And Things',
      items: [
        { route: '/workspace/bank', label: 'Bank', icon: '▦' },
        { route: '/workspace/property', label: 'Property', icon: '⌂' },
        { route: '/workspace/vehicles', label: 'Vehicles', icon: '⛁' },
        { route: '/workspace/shopping', label: 'Shopping', icon: '⛾' },
        { route: '/workspace/insurance', label: 'Insurance', icon: '⛨' },
      ],
    },
    {
      label: 'Work',
      items: [
        { route: '/workspace/jobs', label: 'Work', icon: '⛭' },
        { route: '/workspace/casting', label: 'Casting', icon: '★' },
        { route: '/workspace/projects', label: 'Projects', icon: '🎬' },
        { route: '/workspace/company', label: 'Company', icon: '⌗' },
        { route: '/workspace/industry', label: 'Industry', icon: '◆' },
        { route: '/workspace/awards', label: 'Awards', icon: '✦' },
        { route: '/workspace/social', label: 'Social', icon: '◈' },
      ],
    },
    {
      label: 'Care And Growth',
      items: [
        { route: '/workspace/health', label: 'Health', icon: '✚' },
        { route: '/workspace/education', label: 'Education', icon: '✎' },
        { route: '/workspace/city', label: 'The City', icon: '⌖' },
        { route: '/workspace/travel', label: 'Travel', icon: '✈' },
        { route: '/workspace/character', label: 'Character', icon: '☰' },
        { route: '/workspace/settings', label: 'Settings', icon: '⚙' },
      ],
    },
  ];

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="topbar">
        <button
          className="btn btn-ghost btn-sm rail-toggle"
          onClick={() => setRailOpen((open) => !open)}
          aria-expanded={railOpen}
          aria-label="Toggle Navigation"
        >
          ☰
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

        <button
          className="btn btn-sm"
          onClick={() => setSearchOpen(true)}
          aria-label="Go Anywhere. Search everything."
        >
          <span aria-hidden="true">⌕</span>
          <span className="hide-sm">Go Anywhere</span>
          <kbd className="hide-sm">/</kbd>
        </button>

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setHelpOpen(!helpOpen)}
          aria-label="Help For This Screen"
          aria-pressed={helpOpen}
        >
          ?
        </button>

        <SaveIndicator />

        <button className="btn btn-ghost btn-sm hide-sm" onClick={game.exitToMenu}>
          Save &amp; Exit
        </button>
      </header>

      <div className="shell-body">
        <nav className="rail" data-open={railOpen} aria-label="Main Navigation">
          {groups.map((group) => (
            <div key={group.label} className="rail-group">
              <div className="rail-group-label">{group.label}</div>
              {group.items.map((item) => (
                <button
                  key={item.route}
                  className="rail-item"
                  aria-current={route === item.route ? 'page' : undefined}
                  onClick={() => { navigate(item.route, item.label); setRailOpen(false); }}
                >
                  <span className="rail-icon" aria-hidden="true">{item.icon}</span>
                  <span className="grow truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="rail-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                  )}
                </button>
              ))}
            </div>
          ))}

          <div className="rail-group">
            <div className="rail-group-label">Player</div>
            <div style={{ padding: 'var(--s2) var(--s3)' }}>
              <div className="small strong truncate">{player.displayName}</div>
              <div className="xs dim truncate">
                {unread > 0 ? `${unread} unread` : 'Nothing unread'}
              </div>
            </div>
          </div>
        </nav>

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

      {searchOpen && <GoAnywhere />}
      {helpOpen && <HelpPanel />}

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
  if (route === '/world') return <World />;
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
