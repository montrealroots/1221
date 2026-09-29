/**
 * Every door in the game opens onto something.
 *
 * A notification or a decision can carry a route, and the player clicks it
 * expecting the screen it names. If nothing is registered against that route
 * they land on "Nothing Here Yet", which is the worst thing an interface can
 * do: it tells them they did something wrong when the build did.
 *
 * This has gone wrong twice in this project — once when the film half was
 * deleted and its notifications kept pointing at removed screens, and once
 * when the company tab was locked while two overhead alerts still linked to
 * it. So it is held statically, by reading the sources rather than by walking
 * the app, which means it fails at the moment somebody writes the bad line.
 */

import { describe, expect, it } from 'vitest';
import { ALL_DESTINATIONS, RAIL_DESTINATIONS } from '@/ui/shell/destinations';
import { readFileSync, readdirSync } from 'node:fs';

const ROOT = new URL('../src/', import.meta.url);

function read(relative: string): string {
  return readFileSync(new URL(relative, ROOT), 'utf8');
}

/** The routes the interface actually has a screen for. */
function registeredRoutes(): Set<string> {
  const router = read('ui/workspaces/WorkspaceRouter.tsx');
  const routes = new Set<string>();
  for (const match of router.matchAll(/'(\/workspace\/[a-z-]+)'\s*:/g)) routes.add(match[1]!);
  // The one the shell serves itself, outside the workspace router.
  routes.add('/home');
  return routes;
}

/**
 * Destinations marked as locked. They deliberately open nothing.
 *
 * Read from the destination list rather than the shell: the left-hand rail is
 * gone and Home renders this list, so it is the one place that knows what
 * exists and what is shut.
 */
function lockedRoutes(): Set<string> {
  const source = read('ui/shell/destinations.ts');
  const locked = new Set<string>();
  for (const match of source.matchAll(/route:\s*'([^']+)'[^}]*locked:\s*true/g)) locked.add(match[1]!);
  return locked;
}

/** Every route string the engine hands to a notification or a decision. */
function enginesRoutes(): { file: string; route: string }[] {
  const dir = new URL('engine/systems/', ROOT);
  const out: { file: string; route: string }[] = [];
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.ts')) continue;
    const source = readFileSync(new URL(file, dir), 'utf8');
    for (const match of source.matchAll(/route:\s*'([^']+)'/g)) out.push({ file, route: match[1]! });
  }
  const world = read('engine/world/world.ts');
  for (const match of world.matchAll(/route:\s*'([^']+)'/g)) out.push({ file: 'world.ts', route: match[1]! });
  return out;
}

describe('the routes the engine points at', () => {
  it('finds the screens the interface registers', () => {
    const routes = registeredRoutes();
    expect(routes.size, 'no screens were found at all').toBeGreaterThan(1);
    expect(routes.has('/workspace/calendar')).toBe(true);
    expect(routes.has('/home')).toBe(true);
  });

  it('all open onto a screen that exists', () => {
    const registered = registeredRoutes();
    const dead = enginesRoutes().filter(({ route }) => !registered.has(route.split('?')[0]!));
    expect(dead.map((d) => `${d.file} -> ${d.route}`), 'these links open onto nothing').toEqual([]);
  });

  it('never point at a tab the shell has locked', () => {
    // There is nothing locked in this build. The check stays because the
    // moment something is shut again, a link into it must fail here.
    const locked = lockedRoutes();
    const offenders = enginesRoutes().filter(({ route }) => locked.has(route));
    expect(offenders.map((d) => `${d.file} -> ${d.route}`), 'these link to a locked tab').toEqual([]);
  });
});

describe('what was taken out', () => {
  it('leaves no workspace file behind', () => {
    // The cut-downs took twenty seven workspaces out. This names them rather
    // than pinning the whole directory, so a workspace added on purpose is an
    // addition and a workspace that crept back is caught. Putting one of these
    // back is a decision, and editing this line is how the decision is made.
    // The bank came back on 2026-09-25, at the owner's word, as a real bank
    // where the character lives (`systems/banking.ts`), and the work screen
    // the same day, as a real employer there. The work screen went again on
    // 2026-09-26 with the job engine, when the owner kept SLATE to acting.
    // Travel came back on 2026-09-29, at the owner's word, as a journey by air
    // booked, kept on the calendar and taken (`systems/journey.ts`).
    const removed = [
      'AuditionsWorkspace', 'AwardsWorkspace', 'BusinessWorkspace', 'CastingWorkspace', 'CharacterWorkspace',
      'CityWorkspace', 'CompanyWorkspace', 'EducationWorkspace', 'FilmWorkspace',
      'GoingOutWorkspace', 'HealthWorkspace', 'HistoryWorkspace', 'IndustryWorkspace',
      'InsuranceWorkspace', 'PhoneWorkspace', 'ProjectsWorkspace', 'PropertyWorkspace',
      'RelationshipsWorkspace', 'SettingsWorkspace', 'ShoppingWorkspace', 'SocialWorkspace',
      'TrackWorkspace', 'VehiclesWorkspace', 'WellbeingWorkspace', 'WorkWorkspace',
    ];
    const files = readdirSync(new URL('ui/workspaces/', ROOT));
    for (const gone of removed) {
      expect(files, `${gone} came back`).not.toContain(`${gone}.tsx`);
    }
    // Every workspace on disk is one the router will actually serve. A
    // screen is a .tsx; a plain .ts beside it is the logic a screen leans on
    // — what fits in a calendar cell, say — and is not something to route.
    const router = read('ui/workspaces/WorkspaceRouter.tsx');
    for (const file of files) {
      if (file === 'WorkspaceRouter.tsx' || !file.endsWith('.tsx')) continue;
      const name = file.replace(/\.tsx$/, '');
      expect(router, `${name} is on disk but not routed`).toContain(name);
    }
  });

  it('keeps the founder premise out of character creation', () => {
    const creation = read('ui/creation/CharacterCreation.tsx');
    expect(creation, 'the strike is still in creation').not.toMatch(/STRIKE_IS_FICTION|OPENING_BRIEF/);
    // What must not come back is a step that asks the player to found a
    // company — its input, its own step, its name field.
    expect(creation, 'the company step is still in creation').not.toMatch(/Your Company|company-name|companyName/);
    expect(creation, 'creation still calls the player a founder').not.toMatch(/And Founder/);
  });

  it('lists no destination that doesn’t open', () => {
    // The rail refused a locked destination with Under Construction; none had
    // been locked for a long time, and the path went on 2026-09-27.
    const shell = read('ui/shell/GameShell.tsx');
    expect(shell).not.toMatch(/locked|Under Construction/);
    expect(read('ui/shell/destinations.ts')).not.toMatch(/locked\?:/);
  });

  it('gives the calendar a section of Home rather than a tile pointing at one', () => {
    // The calendar describes the day you are standing in, so it is a section
    // of the hub. The rail does not carry it and Home does not list it among
    // the places to go — Home *is* where it is.
    const railRoutes = RAIL_DESTINATIONS.flatMap((g) => g.items).map((i) => i.route);
    expect(railRoutes).not.toContain('/workspace/calendar');
    expect(ALL_DESTINATIONS.map((d) => d.route)).toContain('/workspace/calendar');
    for (const group of RAIL_DESTINATIONS) expect(group.items.length).toBeGreaterThan(0);

    const home = read('ui/screens/Home.tsx');
    expect(home, 'Home has no Calendar section').toMatch(/title="Calendar"/);
    expect(home, 'the Calendar section does not open the calendar')
      .toMatch(/navigate\('\/workspace\/calendar'/);
    // Home stopped rendering the destination tiles when the rail came back;
    // two lists of the same places on one screen is one too many.
    expect(home, 'Home is rendering destination tiles again').not.toMatch(/DESTINATIONS/);
    expect(home, 'the Where To card is back').not.toMatch(/Where To/);
  });

  it('offers every destination it lists, and lists every screen there is', () => {
    // Every screen is reachable: the rail carries the destinations, Home
    // carries the calendar as a section of itself. If the list and the
    // screens drift apart a workspace becomes unreachable unnoticed.
    const registered = registeredRoutes();
    const listed = new Set<string>();
    const source = read('ui/shell/destinations.ts');
    for (const match of source.matchAll(/route:\s*'([^']+)'/g)) listed.add(match[1]!);

    const unreachable = [...registered].filter((r) => !listed.has(r) && r !== '/home');
    expect(unreachable, 'these screens exist and Home does not offer them').toEqual([]);

    const lockedSet = lockedRoutes();
    const broken = [...listed].filter((r) => !registered.has(r) && !lockedSet.has(r));
    expect(broken, 'Home offers these and nothing is behind them').toEqual([]);
  });
});
