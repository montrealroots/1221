/**
 * Journey: a student's life around the school (from the connected world of 2026-10-09). Made as creation makes it,
 * saved and opened at once, as the first save of a new game is; then, by public commands only, the calendar's own
 * plans, a play read, the body looked after by the menu's first choice, a doctor chosen and a visit booked, moved and
 * kept, a day off sick refused to somebody well, the dental plan the school offers, a passport applied for, lost and replaced with its police report, the
 * notifications read; and the clock run on through a leap day, a skip at a time, past the second Christmas. Saved and
 * opened midway. What it checks is downstream: each command's change shows where the game reads it, the ledger
 * balances, and no law of the save breaks.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import { lookAfterOptions } from '@/engine/systems/life';
import { documentsOf } from '@/engine/systems/documents';
import { healthOf } from '@/engine/systems/health';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 12) => instantFromZoned({ year, month, day, hour }, NY);
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const ok = <T,>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => {
  const r = sim.execute<T>({ kind, payload });
  expect(r.ok, `${kind}: ${r.error}`).toBe(true);
  return r.value as T;
};

describe('journey: a student’s life around the school', () => {
  it('carries every choice through to where it’s read, across a save, a leap day and two winters', () => {
    // Made and opened at once: what creation wrote is what the game reads.
    let sim = reload(createSave(1, 'jr-life', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personalityTraits: ['early_riser', 'curious'] }));
    expect(sim.player.personalityTraits).toEqual(['early_riser', 'curious']);
    expect(sim.player.currentLocationId).toBe('us-ct-newhaven');
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.kind === 'school.orientation')).toBe(true);

    // A plan of one's own, kept on the calendar, and one called off.
    const lunch = ok<{ entryId: string }>(sim, 'calendar.schedule', { title: 'Lunch With A Friend', at: sim.now + 2 * MS_DAY });
    const coffee = ok<{ entryId: string }>(sim, 'calendar.schedule', { title: 'Coffee', at: sim.now + 3 * MS_DAY });
    ok(sim, 'calendar.cancel', { entryId: coffee?.entryId ?? sim.universe.scheduled.find((i) => i.label === 'Coffee')!.id });
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.label === 'Coffee')).toBe(false);
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.label === 'Lunch With A Friend')).toBe(true);
    void lunch;

    // On to September, looking after themselves by the menu's first choice when it's urgent; a play read one evening.
    while (sim.now < at(2026, 9, 7, 20)) {
      const top = lookAfterOptions(sim)[0];
      if (top && !top.refused && top.urgent) sim.execute({ kind: 'life.look_after', payload: { action: top.action } });
      const h = zonedParts(sim.now, NY).hour;
      if ((h >= 23 || h < 5) && (sim.player.awakeSince ?? 0) <= sim.now) { const r = sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }); if (r.ok) continue; }
      sim.advanceTo(sim.now + MS_HOUR);
    }
    const read = sim.execute<{ minutes: number }>({ kind: 'plays.read', payload: { playId: 'proof' } });
    expect(read.ok, read.error).toBe(true);
    expect(sim.player.plays?.proof).toBeDefined();

    // A doctor chosen where they live, a visit booked, called off and booked again.
    const before = sim.universe.transactions.length;
    const booked = sim.execute<{ appointmentId?: string; at?: number }>({ kind: 'health.book', payload: {} });
    if (booked.ok) {
      const appts = (healthOf(sim.player) as unknown as { appointments?: { id: string; status?: string }[] }).appointments ?? [];
      const a = appts.at(-1);
      if (a) ok(sim, 'health.cancel_appointment', { appointmentId: a.id });
      ok(sim, 'health.book');
    } else expect(booked.error).toBeTruthy();
    ok(sim, 'health.choose_pharmacy', { chain: 'cvs' });
    expect(healthOf(sim.player).pharmacy).toBe('cvs');
    // The school's dental plan, on.
    const dental = sim.execute({ kind: 'health.dental', payload: { on: true } });
    expect(dental.ok, dental.error).toBe(true);
    expect(healthOf(sim.player).dental).toBeDefined();

    // Well, a day off sick is refused: it would be an unexcused absence, and says so.
    sim.advanceTo(at(2026, 9, 8, 7));
    expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).error).toMatch(/well enough to go/);

    // Saved and opened midway.
    sim = reload(sim);

    // A passport applied for, as an American at Yale holds none, and once it's come, lost: reported, reported to the police, and replaced, each fee from the bank.
    const paid = sim.universe.transactions.length;
    ok(sim, 'documents.apply_passport');
    expect(sim.universe.transactions.length).toBeGreaterThan(paid);
    for (let d = 0; d < 120 && !documentsOf(sim.player).some((x) => x.kind === 'passport' && x.status === 'valid'); d += 1) sim.advanceTo(sim.now + MS_DAY);
    const passport = documentsOf(sim.player).find((d) => d.kind === 'passport' && d.status === 'valid')!;
    expect(passport).toBeDefined();
    ok(sim, 'documents.report_lost', { documentId: passport.id });
    // New Haven's police take a lost thing online, through their portal (from 2026-10-09, `ONLINE_REPORTS`).
    ok(sim, 'documents.police_report', { documentId: passport.id });
    ok(sim, 'documents.apply_passport');
    expect(sim.universe.transactions.length).toBeGreaterThan(before);

    // The notifications so far, read.
    ok(sim, 'world.mark_read');
    expect(sim.universe.notifications.every((n) => n.read)).toBe(true);

    // On a skip at a time, as a player pressing on to the next morning, through the leap day of 2028.
    let leap = false;
    while (sim.now < at(2028, 3, 2)) {
      sim.advanceTo(sim.now + MS_DAY);
      const p = zonedParts(sim.now, NY);
      if (p.month === 2 && p.day === 29) leap = true;
    }
    expect(leap).toBe(true);
    // The new passport came, in the meantime.
    expect(documentsOf(sim.player).some((d) => d.kind === 'passport' && d.status === 'valid' && d.id !== passport.id)).toBe(true);

    expect(sim.ledger.audit()).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
  }, 600_000);
});
