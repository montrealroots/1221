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
import { readFileSync, readdirSync } from 'node:fs';
import { quickSave } from '@/engine';

const ROOT = new URL('../src/', import.meta.url);

function read(relative: string): string {
  return readFileSync(new URL(relative, ROOT), 'utf8');
}

/** The routes the interface actually has a screen for. */
function registeredRoutes(): Set<string> {
  const router = read('ui/workspaces/WorkspaceRouter.tsx');
  const routes = new Set<string>();
  for (const match of router.matchAll(/'(\/workspace\/[a-z-]+)'\s*:/g)) routes.add(match[1]!);
  // The two the shell serves itself, outside the workspace router.
  routes.add('/home');
  routes.add('/world');
  return routes;
}

/** Rail entries the shell marks as locked. They deliberately open nothing. */
function lockedRoutes(): Set<string> {
  const shell = read('ui/shell/GameShell.tsx');
  const locked = new Set<string>();
  for (const match of shell.matchAll(/\{\s*route:\s*'([^']+)'[^}]*locked:\s*true[^}]*\}/g)) locked.add(match[1]!);
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
    expect(routes.size, 'no workspaces were found at all').toBeGreaterThan(10);
    expect(routes.has('/workspace/bank')).toBe(true);
    expect(routes.has('/home')).toBe(true);
  });

  it('all open onto a screen that exists', () => {
    const registered = registeredRoutes();
    const dead = enginesRoutes().filter(({ route }) => !registered.has(route.split('?')[0]!));
    expect(dead.map((d) => `${d.file} -> ${d.route}`), 'these links open onto nothing').toEqual([]);
  });

  it('never point at a tab the shell has locked', () => {
    const locked = lockedRoutes();
    expect(locked.size, 'no locked tab was found — has the company tab been unlocked?').toBeGreaterThan(0);
    const offenders = enginesRoutes().filter(({ route }) => locked.has(route));
    expect(offenders.map((d) => `${d.file} -> ${d.route}`), 'these link to a locked tab').toEqual([]);
  });
});

describe('the locked company tab', () => {
  it('is listed, is locked, and has no screen behind it', () => {
    const locked = lockedRoutes();
    expect(locked.has('/workspace/company'), 'the company tab is not marked locked').toBe(true);
    expect(registeredRoutes().has('/workspace/company'), 'something is registered against a locked route').toBe(false);
  });

  it('is not offered by Go Anywhere, which only lists doors that open', () => {
    const search = read('ui/shell/GoAnywhere.tsx');
    expect(search).not.toMatch(/\/workspace\/company/);
  });

  it('has no workspace file left behind', () => {
    const files = readdirSync(new URL('ui/workspaces/', ROOT));
    expect(files).not.toContain('CompanyWorkspace.tsx');
  });

  it('tells the player it is under construction rather than navigating', () => {
    const shell = read('ui/shell/GameShell.tsx');
    // The click handler returns before navigate when the entry is locked.
    expect(shell).toMatch(/if \(item\.locked\) \{[^}]*toast\([^)]*Under Construction/);
    expect(shell).toMatch(/return; \}/);
  });

  it('still runs a company underneath, with nowhere to look at it', () => {
    // The engine half is real even though the screen is not: this is what the
    // tab will show when it is built, and it must not have quietly broken.
    const sim = quickSave({}, 'nav-company');
    const company = sim.universe.companies[sim.universe.playerCompanyId!];
    expect(company).toBeDefined();
    expect(company!.overhead).toBeGreaterThan(0);
    expect(sim.universe.accounts[company!.cashAccountId]?.balance).toBeGreaterThan(0);
  });
});
