/**
 * The entry look's remnants of the career, found by the readings of 2026-10-12 and fixed then (`ui/looks/day.tsx`):
 * - what missing a commitment costs still had cases for an audition, a job's day and a showcase, kinds nothing has
 *   booked since the career went on 2026-10-09; a save from before then keeps those it settled, and the look still
 *   printed an agency letting the player go;
 * - an entry in a city the player isn't in said "a job’s travel takes you there on its own", though there's no job,
 *   and nothing has moved the player since a life begins (nothing writes `currentLocationId` after `world/bootstrap.ts`).
 *
 * PLAYER JOURNEYS go through the command the Calendar uses (`calendar.schedule`); the one FIXTURE is a save from
 * before the career went, made by renaming a settled plan's kind in the saved file, and it says so.
 */
import { describe, expect, it } from 'vitest';
import { isValidElement, type ReactNode } from 'react';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';

/** Every string a body holds, in order, without rendering it. */
function wordsIn(node: ReactNode, out: string[] = []): string[] {
  if (node === null || node === undefined || typeof node === 'boolean') return out;
  if (typeof node === 'string' || typeof node === 'number') { out.push(String(node)); return out; }
  if (Array.isArray(node)) { for (const child of node) wordsIn(child, out); return out; }
  if (isValidElement(node)) wordsIn((node.props as { children?: ReactNode }).children, out);
  return out;
}

function entryText(sim: Simulation, id: string): string {
  const found = resolveLook(sim, at('entry', id));
  expect(found && !('gone' in found), id).toBe(true);
  return wordsIn((found as Looked).body).join('');
}

/** A plan put on the calendar through the command the Calendar uses. */
function plan(sim: Simulation, title: string, when: number, locationId?: string): string {
  const result = sim.execute<{ ok: boolean; id?: string; error?: string }>({ kind: 'calendar.schedule', payload: { title, at: when, durationMinutes: 60, ...(locationId ? { locationId } : {}) } });
  expect(result.ok && result.value?.ok, `${title}: ${result.error ?? result.value?.error}`).toBe(true);
  return result.value!.id!;
}

const THERE = 'us-ca-losangeles';

describe('an entry in a city the player isn’t in', () => {
  it('says nothing takes them there and it’ll be missed, and it is', () => {
    const sim = quickSave({}, 'g5-elsewhere');
    const here = sim.player.currentLocationId;
    expect(here).not.toBe(THERE);
    const when = sim.now + 2 * MS_DAY;
    const id = plan(sim, 'Lunch Downtown', when, THERE);

    const before = entryText(sim, id);
    expect(before).not.toMatch(/job/i);
    expect(before).toContain(`It’s in ${CITIES.require(THERE).name} and you’re in ${CITIES.require(here).name}, and nothing takes you there, so it’ll be missed.`);

    // The sentence is the rule's: the clock reaches it with the player where they were, and it's missed.
    sim.advanceTo(when + MS_HOUR);
    expect(sim.player.currentLocationId).toBe(here);
    expect(sim.timeline.get(id)?.status).toBe('missed');

    // Once it's settled, the look doesn't say it will be missed.
    const after = entryText(sim, id);
    expect(after).toContain(`It’s in ${CITIES.require(THERE).name} and you’re in ${CITIES.require(here).name}.`);
    expect(after).not.toContain('it’ll be missed');
  });
});

describe('a save that kept a settled audition, a job’s day and a showcase from before the career went', () => {
  it('prints what missing one costs without the agency, the job or the room', () => {
    const sim = quickSave({}, 'g5-career');
    const kinds = ['career.audition', 'career.work', 'career.showcase'];
    const ids = kinds.map((_, n) => plan(sim, `Plan ${n + 1}`, sim.now + (n + 1) * MS_DAY));

    // FIXTURE: the save as one from before 2026-10-09 would be after it was brought forward, which lets go what was
    // pending of the career and keeps what was settled (`migrate`, schema 90).
    const saved = deserialise(serialise(sim.universe));
    for (const [n, id] of ids.entries()) {
      const item = saved.scheduled.find((one) => one.id === id)!;
      Object.assign(item, { kind: kinds[n], status: 'missed', category: 'career' });
    }
    const old = loadSave(saved);

    for (const id of ids) {
      const text = entryText(old, id);
      expect(text, id).toContain('If you aren’t, it’s missed.');
      expect(text, id).not.toMatch(/agency|the job ends|the room never sees you/);
    }
  });
});
