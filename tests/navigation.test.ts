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
    // The cut-down took twenty five workspaces out. This names them rather
    // than pinning the whole directory, so a workspace added on purpose is an
    // addition and a workspace that crept back is caught. Putting one of these
    // back is a decision, and editing this line is how the decision is made.
    const removed = [
      'AwardsWorkspace', 'BankWorkspace', 'CastingWorkspace', 'CharacterWorkspace',
      'CityWorkspace', 'CompanyWorkspace', 'EducationWorkspace', 'FilmWorkspace',
      'GoingOutWorkspace', 'HealthWorkspace', 'HistoryWorkspace', 'IndustryWorkspace',
      'InsuranceWorkspace', 'PhoneWorkspace', 'ProjectsWorkspace', 'PropertyWorkspace',
      'RelationshipsWorkspace', 'SettingsWorkspace', 'ShoppingWorkspace', 'SocialWorkspace',
      'TrackWorkspace', 'TravelWorkspace', 'VehiclesWorkspace', 'WellbeingWorkspace',
      'WorkWorkspace',
    ];
    const files = readdirSync(new URL('ui/workspaces/', ROOT));
    for (const gone of removed) {
      expect(files, `${gone} came back`).not.toContain(`${gone}.tsx`);
    }
    // Every workspace on disk is one the router will actually serve.
    const router = read('ui/workspaces/WorkspaceRouter.tsx');
    for (const file of files) {
      if (file === 'WorkspaceRouter.tsx') continue;
      const name = file.replace(/\.tsx$/, '');
      expect(router, `${name} is on disk but not routed`).toContain(name);
    }
  });

  it('keeps the founder premise out of character creation', () => {
    const creation = read('ui/creation/CharacterCreation.tsx');
    expect(creation, 'the strike is still in creation').not.toMatch(/STRIKE_IS_FICTION|OPENING_BRIEF/);
    expect(creation, 'the company step is still in creation').not.toMatch(/The Company|Your Company|company-name/);
    expect(creation, 'creation still calls the player a founder').not.toMatch(/And Founder/);
  });

  it('tells the player it is under construction rather than navigating', () => {
    const home = read('ui/screens/Home.tsx');
    // The click handler returns before navigate when the destination is shut.
    expect(home).toMatch(/if \(dest\.locked\) \{[^}]*toast\([^)]*Under Construction/);
    expect(home).toMatch(/return; \}/);
  });

  it('keeps the calendar on Home and off the rail, and loses nothing by it', () => {
    // The calendar describes the day you are standing in. It reads as part of
    // Home, not as another place to go, so the rail does not carry it — but it
    // is still one list, and Home still offers everything.
    const railRoutes = RAIL_DESTINATIONS.flatMap((g) => g.items).map((i) => i.route);
    const homeRoutes = ALL_DESTINATIONS.map((d) => d.route);
    expect(homeRoutes).toContain('/workspace/calendar');
    expect(railRoutes).not.toContain('/workspace/calendar');
    // Everything the rail does carry, Home carries too.
    for (const route of railRoutes) expect(homeRoutes).toContain(route);
    // And no group is left on the rail with nothing under it.
    for (const group of RAIL_DESTINATIONS) expect(group.items.length).toBeGreaterThan(0);
  });

  it('offers every destination it lists, and lists every screen there is', () => {
    // The rail and Home both render this list. If the two drift apart a
    // workspace becomes unreachable without anybody noticing.
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
