/**
 * SLATE — the shell.
 *
 * HOME for immediate life, and the calendar for what is coming. Context is
 * preserved: the breadcrumbs survive moving around.
 *
 * The rail down the left is every destination, always in reach, with Home at
 * the top wearing the count of what is waiting on you. It is words only: no
 * icons. Below a
 * laptop it folds into a drawer behind the Menu button. A destination joins
 * the rail when the guide’s chapter that opens it is read; your name at the
 * foot opens the Player Profile.
 *
 * The bar across the top keeps its two sides apart on purpose. Left is the
 * world: the mark, the clock, and the controls that move it. Right is you:
 * the tools you reach for, then the state of your save.
 */

import { useEffect, useState } from 'react';
import { useGame, useWorld, labelForRoute } from '@/app/game-context';
import { LifeEnded } from './LifeEnded';
import { ALL_DESTINATIONS, RAIL_DESTINATIONS } from './destinations';
import { isOpen } from '@/engine/world/tutorial';
import { openDecisions } from '@/engine/world/world';
import { TimeControls } from './TimeControls';
import { GuideButton, GuideProvider, GuideStrip } from '@/ui/guide/Guide';
import { HelpProvider } from '@/ui/guide/Help';
import { Home } from '@/ui/screens/Home';
import { WorkspaceRouter } from '@/ui/workspaces/WorkspaceRouter';
import { formatDate, formatTime, zoneAbbreviation } from '@/engine/core/time';
import { PERFORMER_NOUN } from '@/engine/core/performer';
import { usePauseWhileUpright } from './turn';
import { useMedia } from '@/ui/components/media';

/**
 * When the rail is a drawer behind Menu: a window narrower than a laptop's, and any window too short for a column of
 * destinations beside the page, as a phone on its side is (from 2026-10-23, brief 23: until then a phone 932 wide on its
 * side kept the desktop's rail, a third of its width, beside a page 700 wide).
 */
export const DRAWER_QUERY = '(max-width: 900px), (max-height: 500px)';
/** The screens Home offers and the menu doesn't (`homeOnly`, from brief 24): on them the menu marks Home. */
const HOME_ONLY = new Set(ALL_DESTINATIONS.filter((d) => d.homeOnly).map((d) => d.route));


export function GameShell() {
  const game = useGame();
  const { sim, route, navigate, breadcrumbs, toasts } = game;
  const [railOpen, setRailOpen] = useState(false);
  const waiting = useWorld((s) => openDecisions(s).length);
  // The destinations the guide has opened, by group, none left empty.
  const railGroups = useWorld((s) => RAIL_DESTINATIONS.map((g) => ({ ...g, items: g.items.filter((i) => isOpen(s, i.feature)) })).filter((g) => g.items.length > 0));
  const profileOpen = useWorld((s) => isOpen(s, 'ui.profile'));
  const running = useWorld((s) => s.universe.preferences.timeSpeed !== 'paused');
  const drawer = useMedia(DRAWER_QUERY);
  // A phone held upright covers the game and pauses it (`ui/shell/turn.tsx`).
  usePauseWhileUpright();

  // Escape closes the drawer, the way it closes the dialogs. Without it the
  // only ways out were the Menu button and a shade the drawer covers most of,
  // and a keyboard had neither.
  useEffect(() => {
    if (!railOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setRailOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [railOpen]);

  // A life that has ended opens onto how it ended, and nothing else.
  const ended = useWorld((s) => s.universe.meta.endedAt !== undefined);

  const go = (to: string, label: string) => {
    navigate(to, label);
    setRailOpen(false);
  };

  if (ended) return <LifeEnded />;

  return (
    <GuideProvider>
    <HelpProvider>
    <div className="shell">
      {/* To the content without a history entry or an address that names no screen (from 2026-10-13: until then the link
          changed the address to #main, which the game read as Home). */}
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip To Content</a>

      <header className="topbar">
        <button
          className="btn btn-ghost btn-sm rail-toggle"
          onClick={() => setRailOpen((open) => !open)}
          aria-expanded={railOpen}
          aria-controls="rail"
        >
          {/* Named by its word, Menu, as it's seen (from 2026-10-17, brief 14): until then its accessible name was
              "Toggle Navigation", which a player using speech to press "Menu" couldn't reach. */}
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

        {/* Where you are, in the bar, while the rail that marks it is folded away (from 2026-10-23, brief 23). */}
        {drawer && <span className="topbar-here">{labelForRoute(route)}</span>}

        <div className="topbar-clock" aria-live="polite">
          <strong>{formatTime(sim.now, sim.zone)}</strong>
          <span className="topbar-clock-sep" aria-hidden="true">·</span>
          <span className="topbar-clock-date">{formatDate(sim.now, sim.zone)}</span>
          <span className="topbar-clock-zone">{zoneAbbreviation(sim.now, sim.zone)}</span>
          {/* Whether the clock is moving, in a word beside it (from 2026-10-23, brief 23): until then only Play or Pause
              said it, by naming what a press would do. */}
          <span className="clock-state" data-running={running}>{running ? 'Running' : 'Paused'}</span>
        </div>

        <TimeControls />

        <div className="grow" />

        {/* The guide and the save, the bar's secondary side; in the drawer's foot while the rail is a drawer, so a phone
            on its side keeps one row of bar (from 2026-10-23, brief 23: until then a phone's bar was two or three rows). */}
        {!drawer && (
          <>
            <span className="topbar-divider" aria-hidden="true" />
            <SaveGroup />
          </>
        )}
      </header>

      <div className="shell-body">
        <nav className="rail" id="rail" data-open={railOpen} aria-label="Main Navigation">
          <div className="rail-group">
            {/* On Calendar or Updates, Home's own screens from brief 24 (2026-10-23), Home is marked as where you are,
                the screen you came by: until then each was on the menu and marked itself. */}
            <button
              className="rail-item"
              aria-current={route === '/home' ? 'page' : HOME_ONLY.has(route) ? 'true' : undefined}
              onClick={() => go('/home', 'Home')}
            >
              <span className="grow truncate">Home</span>
              {/* The questions waiting, from 2026-10-23 (brief 23). Until then Home counted the unread notices too, and a
                  graduate's read 99+ for 500 notices and no question; they were counted beside Updates until brief 24
                  took Updates from the menu the same day, and Recent Updates on Home says how many. */}
              {waiting > 0 && (
                <span className="rail-badge" aria-label={`${waiting} Waiting On You`}>
                  {waiting > 99 ? '99+' : waiting}
                </span>
              )}
            </button>
          </div>

          {railGroups.map((group) => (
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
            <button
              type="button"
              className="rail-you rail-item"
              aria-current={route === '/workspace/profile' ? 'page' : undefined}
              aria-label={`${sim.player.displayName}, Open Your Player Profile`}
              title={profileOpen ? 'Your Player Profile' : 'Locked until you read its chapter in the guide'}
              onClick={() => go('/workspace/profile', 'Player Profile')}
            >
              <span className="col">
                <span className="small strong truncate">{sim.player.displayName}</span>
                {/* The unread count went to Updates on 2026-10-23 (brief 23): here it was said a third time. */}
                <span className="xs dim truncate">{PERFORMER_NOUN[sim.player.performerTitle]}</span>
              </span>
            </button>
          </div>

          {drawer && (
            <div className="rail-group rail-foot">
              <SaveGroup />
            </div>
          )}
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
            {/* The trail, but not "Home › Calendar" or "Home › Updates" alone, whose way back is the page's own Back To
                Home (from 2026-10-23, brief 24): it said Home twice there. A longer trail still shows. */}
            {breadcrumbs.length > 1 && !(breadcrumbs.length === 2 && breadcrumbs[0]!.route === '/home' && HOME_ONLY.has(route)) && (
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
    </HelpProvider>
    </GuideProvider>
  );
}

function Screen({ route }: { route: string }) {
  if (route === '/home') return <Home />;
  if (route.startsWith('/workspace/')) return <WorkspaceRouter route={route} />;
  return <Home />;
}

/** The guide, where the save stands, and Save & Exit: the bar's right side, or the drawer's foot. */
function SaveGroup() {
  const game = useGame();
  return (
    <div className="topbar-group" role="group" aria-label="Your Save">
      <GuideButton />
      <SaveIndicator />
      <button className="btn btn-ghost btn-sm" onClick={game.exitToMenu}>
        Save &amp; Exit
      </button>
    </div>
  );
}

/**
 * Where the save stands (from 2026-10-12: until then it said Saved whenever no save was under way, through up to the
 * 45 seconds of play before the next autosave, and phones never showed it).
 */
function SaveIndicator() {
  const { saving, saveError, saveNow, unsaved } = useGame();
  if (saveError) {
    return (
      <button className="btn btn-sm btn-danger" onClick={() => void saveNow()} title={saveError}>
        Save Failed: Try Again
      </button>
    );
  }
  return (
    <span className="xs dim" aria-live="polite" style={{ minWidth: 52, textAlign: 'right' }}>
      {saving ? 'Saving…' : unsaved() ? 'Not Saved Yet' : 'Saved'}
    </span>
  );
}
