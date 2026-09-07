/**
 * SLATE — the shell.
 *
 * HOME for immediate life, WORLD for discovery, workspaces for deep work, and
 * Go Anywhere over the top of all of it. Context is preserved: breadcrumbs,
 * recent destinations and favorites all survive moving around.
 */

import { useGame } from '@/app/game-context';
import { GoAnywhere } from './GoAnywhere';
import { HelpPanel } from './HelpPanel';
import { TimeControls } from './TimeControls';
import { Home } from '@/ui/screens/Home';
import { World } from '@/ui/screens/World';
import { WorkspaceRouter } from '@/ui/workspaces/WorkspaceRouter';
import { ScenePanel } from '@/ui/components/ScenePanel';
import { formatDate, formatTime, zoneAbbreviation } from '@/engine/core/time';


export function GameShell() {
  const game = useGame();
  const { sim, route, navigate, breadcrumbs, searchOpen, setSearchOpen, helpOpen, setHelpOpen, toasts } = game;

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip To Content</a>

      <header className="topbar">

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

            <ScenePanel />
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
