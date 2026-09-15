/**
 * Sugar Land, and what stands between the road and the front door.
 *
 * The land had no name — "The Land" was a description standing in for one —
 * and the house it carried was built in 1974 and worn to eighty-eight, which
 * was a placeholder nobody had replaced. Both are decided now: the house went
 * up in 2024, the family moved onto the land on the first day of 2025, and
 * nothing in a house that new has had time to go wrong.
 *
 * The security is the other half. It is the premise rather than a system —
 * SLATE runs no intrusions and nothing here has ever had to work — so what is
 * tested is that it says so, that every layer opens onto the thing it stands
 * around, and that the one real-world claim in it is the one that is actually
 * true: Iceland has topped the Global Peace Index every year since 2008.
 */

import { describe, expect, it } from 'vitest';
import { isValidElement, type ReactNode } from 'react';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import {
  ESTATE_NAME, HOUSE, LOT_NAME, MOVED_IN, PEACE_RANKED_SINCE,
  SAFEGUARDS, SAFEGUARD_BY_ID, movedInAt,
} from '@/engine/content/estate';
import { MS_DAY, zonedParts } from '@/engine/core/time';
import { estateCity } from '@/engine/content/estate';
import { resolveLook, seedsFor } from '@/ui/looks/registry';
import type { Looked } from '@/ui/looks/registry';
import '@/ui/looks/all';

const world = (seed = 'estate-look'): Simulation => quickSave({}, seed);

function open(sim: Simulation, kind: string, id = ''): Looked {
  const found = resolveLook(sim, { kind, id });
  expect(found, `${kind}:${id} would not open`).toBeDefined();
  expect(found, `${kind}:${id} is gone`).not.toHaveProperty('gone');
  return found as Looked;
}

/** Every string in a look, body included, so the copy can be read as copy. */
function textIn(node: ReactNode, out: string[] = []): string[] {
  if (typeof node === 'string' || typeof node === 'number') { out.push(String(node)); return out; }
  if (node === null || node === undefined || typeof node === 'boolean') return out;
  if (Array.isArray(node)) { for (const child of node) textIn(child, out); return out; }
  if (isValidElement(node)) {
    const props = node.props as Record<string, unknown>;
    for (const [key, value] of Object.entries(props)) {
      if (key === 'children') textIn(value as ReactNode, out);
      else if (typeof value === 'string') out.push(value);
      else if (isValidElement(value) || Array.isArray(value)) textIn(value as ReactNode, out);
    }
  }
  return out;
}

function wordsIn(look: Looked): string {
  const parts = [look.name, look.kind, look.summary, look.provenance ?? ''];
  for (const way of look.ways ?? []) parts.push(way.label, way.detail);
  return parts.join(' ');
}

describe('the land has a name', () => {
  it('calls itself Sugar Land rather than describing itself', () => {
    expect(ESTATE_NAME).toBe('Sugar Land');
    expect(open(world(), 'estate').name).toBe(ESTATE_NAME);
  });

  it('names the house and the lot too', () => {
    expect(HOUSE.name).toBe('The Big House');
    expect(LOT_NAME).toBe('Sugar Land Studios');
    expect(open(world(), 'lot').name).toBe(LOT_NAME);
  });

  it('reads those names out of content rather than typing them on a screen', () => {
    // A name typed on a screen is a name that drifts. Every one of them comes
    // from the same three constants, so renaming is one edit.
    const sim = world();
    const land = open(sim, 'estate');
    const house = open(sim, 'house', Object.keys(sim.universe.properties)[0]!);
    expect(land.name).toBe(ESTATE_NAME);
    expect(house.name).toBe(HOUSE.name);
    expect(wordsIn(land)).toContain(LOT_NAME);
  });
});

describe('the house is new', () => {
  it('went up in 2024 and was moved into on the first day of 2025', () => {
    expect(HOUSE.yearBuilt).toBe(2024);
    expect(MOVED_IN).toEqual({ year: 2025, month: 1, day: 1 });

    const parts = zonedParts(movedInAt(), estateCity().timeZone);
    expect([parts.year, parts.month, parts.day]).toEqual([2025, 1, 1]);
  });

  it('starts at full condition, because nothing has had time to wear', () => {
    expect(HOUSE.condition).toBe(100);
    const sim = world();
    const house = Object.values(sim.universe.properties)[0]!;
    expect(house.condition).toBe(100);
    expect(house.yearBuilt).toBe(2024);
  });

  it('says so rather than calling itself well kept for its age', () => {
    const sim = world();
    const look = open(sim, 'house', Object.keys(sim.universe.properties)[0]!);
    expect(look.summary).toContain('100/100');
    expect(look.summary).toContain('had time to go wrong');
  });

  it('still wears once the clock runs', () => {
    const sim = world('estate-wear');
    const id = Object.keys(sim.universe.properties)[0]!;
    sim.advanceTo(sim.now + 200 * 86_400_000);
    expect(sim.universe.properties[id]!.condition).toBeLessThan(100);
  });
});

describe('what it takes to get onto the land', () => {
  it('opens from the land, and lays out every layer', () => {
    const sim = world();
    const ways = (open(sim, 'estate').ways ?? []).map((way) => way.to.kind);
    expect(ways).toContain('security');

    const security = open(sim, 'security');
    const layers = (security.ways ?? []).filter((way) => way.to.kind === 'safeguard');
    expect(layers).toHaveLength(SAFEGUARDS.length);
  });

  it('opens each layer onto the thing it stands around', () => {
    const sim = world();
    const goesTo = (id: string): string[] =>
      (open(sim, 'safeguard', id).ways ?? []).map((way) => way.to.kind);

    expect(goesTo('perimeter')).toEqual(['estate']);
    expect(goesTo('gate')).toEqual(['estate']);
    expect(goesTo('house')).toEqual(['house']);
    expect(goesTo('lot')).toEqual(['lot']);
  });

  it('refuses a layer that is not one of them', () => {
    expect(resolveLook(world(), { kind: 'safeguard', id: 'moat' })).toHaveProperty('gone');
  });

  it('gives every layer figures rather than adjectives', () => {
    for (const guard of SAFEGUARDS) {
      expect(guard.figures.length, guard.id).toBeGreaterThanOrEqual(3);
      expect(guard.detail.length, guard.id).toBeGreaterThanOrEqual(2);
      for (const figure of guard.figures) {
        expect(figure.value, `${guard.id} ${figure.label}`).toBeTruthy();
        expect(figure.note, `${guard.id} ${figure.label}`).toBeTruthy();
      }
    }
  });

  it('says the security is the premise rather than something the game runs', () => {
    const said = wordsIn(open(world(), 'security'));
    expect(said).toContain('SLATE runs no');
  });
});

describe('the one claim about the real world', () => {
  it('is the peace ranking, and it is the year the index has run from', () => {
    // Iceland has been first on the Global Peace Index every year since 2008.
    // Nothing else on this land makes a claim about anywhere outside it.
    expect(PEACE_RANKED_SINCE).toBe(2008);
    expect(wordsIn(open(world(), 'security'))).toContain(String(PEACE_RANKED_SINCE));
  });

  it('opens onto the country it is about', () => {
    const ways = open(world(), 'security').ways ?? [];
    const country = ways.find((way) => way.to.kind === 'country');
    expect(country, 'the ranking does not open onto Iceland').toBeDefined();
    expect(country!.to.id).toBe('is');
  });

  it('never claims the place is dangerous, because it is the opposite', () => {
    const sim = world();
    for (const guard of SAFEGUARDS) {
      const said = wordsIn(open(sim, 'safeguard', guard.id)).toLowerCase();
      expect(said, guard.id).not.toMatch(/\bthreat\b|\bdanger|\battack/);
    }
  });
});

describe('the graph is walkable', () => {
  it('seeds the security and every layer of it', () => {
    const sim = world();
    expect(seedsFor('security', sim)).toEqual(['']);
    expect(seedsFor('safeguard', sim)).toEqual(SAFEGUARDS.map((one) => one.id));
  });

  it('keys every layer by its own id', () => {
    for (const guard of SAFEGUARDS) {
      expect(SAFEGUARD_BY_ID[guard.id], guard.id).toBe(guard);
    }
  });
});

describe('the house falls and nobody can stop it', () => {
  // The screen said condition "slips a little each day nobody tends to it",
  // which reads as a choice the player keeps failing to make. There is no such
  // choice, and `content/estate.ts` made it worse by commenting the starting
  // value "because the family keeps it that way" — three sources, three
  // different accounts of whose fault a falling number is.

  it('only ever falls, and offers nothing anybody can do about it', () => {
    const sim = world('no-repair');
    const id = Object.keys(sim.universe.properties)[0]!;
    const at = (): number => sim.universe.properties[id]!.condition;
    const start = at();

    // Nothing in the whole command surface touches it. This is the half that
    // makes the old sentence false rather than merely unkind.
    expect(sim.commandKinds().filter((kind) => /repair|maintain|renovate|upkeep|fix/i.test(kind)))
      .toEqual([]);

    let last = start;
    for (let step = 0; step < 40; step += 1) {
      sim.advanceTo(sim.now + 90 * MS_DAY);
      expect(at(), `condition went up at step ${step}`).toBeLessThanOrEqual(last);
      last = at();
    }
    expect(last, 'ten years and the house is exactly as new').toBeLessThan(start);
  });

  it('does not tell the player somebody was supposed to be tending to it', () => {
    const sim = world('house-copy');
    const id = Object.keys(sim.universe.properties)[0]!;
    const said = textIn(open(sim, 'house', id).body).join(' ');
    expect(said.length, 'the body came back empty, so this test proves nothing')
      .toBeGreaterThan(200);
    expect(said).not.toMatch(/nobody tends to it|keeps it that way|well looked after/i);
    // And it says the true thing in place of the false one.
    expect(said).toMatch(/only moves one way/);
  });
});
