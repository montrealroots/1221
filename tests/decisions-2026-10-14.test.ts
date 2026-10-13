/**
 * The owner's four decisions of 2026-10-14, each through what a player does or the clock that carries them.
 *
 * - The 90-day rule for an undated decision went, with the keeping of a closed row to a date still to come: no raiser
 *   left a row undated or dated one past its 180 days. Every raiser dates its row, held here through each raiser's own
 *   play: a London-born student's first return, a US status a withdrawal ends, and an idle savings account's letter
 *   before it goes to the state. A row an older build left undated is dated as the save opens, ninety days from its
 *   raising, and closes on that date; one already closed is let go.
 * - A skipped shower costs nothing past its day: the morning's floor of 82 stood, so nothing here changed.
 * - Casting in the company's own shows (`companyPart`): an actress the play reads below the four leads gets a part the
 *   play writes for her below a lead, or the company's unnamed part where it writes none, never a lead. Held through a
 *   played Summer Cabaret whose actress the company reads eighth in two plays whose only part for a woman is a lead.
 * - The `receipts` knob went, with the return's line that read it and `recordJobCost`: a save from before holding
 *   Keeps Accounts and Chaotic opens with both traits, and neither declares the knob.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, an actress at Yale in New Haven from
 * Monday 24 August 2026 at 7:30 AM, born where each test says. TEST SETUP, said where it's done: the coursework
 * prepared each midnight (`working`), so a student stays in good standing through a played year; and a save rewritten
 * as an older build wrote it, a row with no date in it.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave, migrate } from '@/engine';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_MINUTE, addMonths, instantFromZoned } from '@/engine/core/time';
import { openDecisions } from '@/engine/world/world';
import { SUMMER_PLAYS } from '@/engine/content/plays';
import { PREP_DIMS } from '@/engine/content/coursework';
import { KNOB_READS, PERSONALITY_TRAIT_BY_ID } from '@/engine/content/personality-traits';
import { courseworkOf } from '@/engine/systems/coursework';
import { castFit, classmatePerformer } from '@/engine/systems/school';
import { performerOf } from '@/engine/systems/evaluation';
import { KNOB_LIMITS, personalityOf } from '@/engine/systems/personality';

const NY = 'America/New_York';
const on = (y: number, m: number, d: number, hour = 12, minute = 0) => instantFromZoned({ year: y, month: m, day: d, hour, minute }, NY);

/** TEST SETUP: the coursework prepared each midnight, so the student stays in good standing. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
const student = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation =>
  working(createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra }));
const rowsOf = (sim: Simulation, refType: string) => Object.values(sim.universe.decisions).filter((d) => d.refType === refType);

// ---------------------------------------------------------------------------------------------------------------------
// The undated decision
// ---------------------------------------------------------------------------------------------------------------------

describe('every decision has a date', () => {
  it('PLAYER JOURNEY: a London-born student’s 2026 return is dated 15 April, inside the 180 days a closed row is kept', () => {
    const sim = student('dec14-return', { homeRegionId: 'uk-eng-london' });
    sim.advanceTo(on(2027, 2, 2));
    const [row] = rowsOf(sim, 'return');
    expect(row).toMatchObject({ title: 'Your 2026 Tax Return', dueAt: on(2027, 4, 15, 23, 59) });
    expect(row!.dueAt - row!.createdAt).toBeLessThan(180 * MS_DAY);
  });

  it('PLAYER JOURNEY: a withdrawal’s status notice is dated the status’s end, fifteen days on', () => {
    const sim = student('dec14-status', { homeRegionId: 'uk-eng-london' });
    const t0 = sim.now;
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    sim.advanceTo(t0 + 2 * MS_MINUTE);
    const [row] = rowsOf(sim, 'us-status');
    expect(row).toMatchObject({ title: 'Your US Status Is Ending', dueAt: t0 + 15 * MS_DAY });
  });

  it('PLAYER JOURNEY: three years of an untouched savings account bring the bank’s letter, dated the day it goes to the state, ninety days on', () => {
    const sim = student('dec14-escheat');
    const savings = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'savings' && a.category !== 'term' && !a.closedAt)!;
    for (let m = 1; m <= 38 && rowsOf(sim, 'unclaimed-notice').length === 0; m += 1) sim.advanceTo(addMonths(savings.openedAt, m, sim.homeZone));
    const [row] = rowsOf(sim, 'unclaimed-notice');
    expect(row!.refId).toBe(savings.id);
    expect(row!.dueAt - row!.createdAt).toBeGreaterThan(0);
    expect(row!.dueAt - row!.createdAt).toBeLessThanOrEqual(90 * MS_DAY);
  }, 300_000);

  it('dates a row an older build left undated ninety days from its raising, and the tick after that date closes it as run out; one closed with no date is let go', () => {
    const sim = student('dec14-old-undated');
    const t0 = sim.now;
    // TEST SETUP: two rows as an older build left them, with no date: one open, one already answered.
    const u = JSON.parse(JSON.stringify(sim.universe));
    const row = (id: string, extra: Record<string, unknown> = {}) => ({ id, saveId: u.meta.id, urgency: 40, category: 'personal', title: `Old ${id}`, detail: 'From an older build.', actions: [], createdAt: t0, refType: 'old', refId: id, ...extra });
    u.decisions.decision_old_open = row('decision_old_open');
    u.decisions.decision_old_closed = row('decision_old_closed', { resolvedAt: t0 + MS_DAY });
    const report = migrate(u);
    expect(report.steps).toEqual(expect.arrayContaining([
      'Dated 1 question an older build left undated, ninety days from when each was raised.',
      'Let go 1 closed question with no date.',
    ]));
    expect(u.decisions.decision_old_open.dueAt).toBe(t0 + 90 * MS_DAY);
    expect(u.decisions.decision_old_closed).toBeUndefined();
    const opened = loadSave(u);
    expect(openDecisions(opened).map((d) => d.id)).toEqual(['decision_old_open']);
    opened.advanceTo(t0 + 89 * MS_DAY);
    expect(openDecisions(opened).map((d) => d.id)).toEqual(['decision_old_open']);
    opened.advanceTo(t0 + 92 * MS_DAY + MS_DAY / 24);
    const closed = opened.universe.decisions.decision_old_open!;
    expect(closed.resolvedAt! - closed.dueAt).toBeGreaterThan(0);
    expect(closed.resolvedAt! - closed.dueAt).toBeLessThanOrEqual(2 * MS_DAY + MS_DAY / 24);
    expect(closed.dismissedAt).toBeUndefined();
    // Opened again, nothing more to date.
    expect(migrate(JSON.parse(JSON.stringify(opened.universe))).steps.join(' ')).not.toMatch(/undated|no date/);
  }, 120_000);
});

// ---------------------------------------------------------------------------------------------------------------------
// The company's own casting
// ---------------------------------------------------------------------------------------------------------------------

describe('companyPart', () => {
  it('PLAYER JOURNEY: an actress the Summer Cabaret reads eighth takes Cathleen, and the company’s unnamed part in the two plays whose only woman is a lead, through the summer to her credits', () => {
    const sim = student('dec14-cab-7');
    sim.advanceTo(on(2027, 1, 4, 9, 1));
    // Joined the way the School tab joins it.
    expect(sim.execute({ kind: 'school.summer_cabaret', payload: {} }).ok).toBe(true);
    const shows = sim.player.school!.summer!.shows!;
    // Where the company reads her against her classmates, as `companyPart` reads it: below the four leads in each.
    const place = (title: string) => {
      const play = SUMMER_PLAYS.find((p) => p.title === title)!;
      const mine = castFit(sim, performerOf(sim, sim.player), play.reads, [], `company:${sim.player.id}`, play.title);
      return 1 + sim.player.school!.classmates.filter((_m, i) => castFit(sim, classmatePerformer(sim, sim.player, i), play.reads, [], `company:${i}`, play.title) > mine).length;
    };
    expect(shows.map((s) => [s.play, place(s.play!)])).toEqual([['Riders To The Sea', 6], ['A Marriage Proposal', 8], ['The Bear', 8]]);
    // Riders to the Sea writes three parts for a woman below its lead; the other two write her a lead and nothing else.
    // Until 2026-10-14 she was given Natalya Stepanovna and Yelena Popova, leads she hadn't earned.
    expect(shows.map((s) => [s.role, s.size])).toEqual([['Cathleen', 'supporting'], ['In The Company', 'featured'], ['In The Company', 'featured']]);
    for (const title of ['A Marriage Proposal', 'The Bear']) {
      const forHer = SUMMER_PLAYS.find((p) => p.title === title)!.parts.filter((p) => p.for !== 'actor');
      expect(forHer.map((p) => p.size), title).toEqual(['lead']);
    }
    // Played through the summer: each run's last night puts the part on her credits.
    sim.advanceTo(on(2027, 8, 31));
    const credits = (sim.player.school!.credits ?? []).filter((c) => c.kind === 'summer').map((c) => [c.production, c.role]);
    expect(credits).toEqual([
      ['Riders To The Sea, Yale Summer Cabaret 2027', 'Cathleen'],
      ['A Marriage Proposal, Yale Summer Cabaret 2027', 'In The Company'],
      ['The Bear, Yale Summer Cabaret 2027', 'In The Company'],
    ]);
  }, 300_000);
});

// ---------------------------------------------------------------------------------------------------------------------
// The receipts knob
// ---------------------------------------------------------------------------------------------------------------------

describe('the receipts knob', () => {
  it('is gone from the knobs and both traits, and a save from before holding Keeps Accounts and Chaotic opens with both, every knob still read', () => {
    expect(Object.keys(KNOB_READS)).not.toContain('receipts');
    expect(Object.keys(KNOB_LIMITS)).not.toContain('receipts');
    expect(Object.keys(PERSONALITY_TRAIT_BY_ID.keeps_accounts!.systemMods ?? {})).toEqual(['bondWound']);
    expect(Object.keys(PERSONALITY_TRAIT_BY_ID.chaotic!.systemMods ?? {})).not.toContain('receipts');
    const sim = student('dec14-receipts');
    // TEST SETUP: the traits as a save from before held them (Keeps Accounts and Chaotic aren't a conflicting pair).
    const u = JSON.parse(JSON.stringify(sim.universe));
    u.people[u.playerId].personalityTraits = ['keeps_accounts', 'chaotic'];
    migrate(u);
    const opened = loadSave(u);
    expect(opened.player.personalityTraits).toEqual(['keeps_accounts', 'chaotic']);
    expect(personalityOf(opened.player, 'bondWound')).toBeGreaterThan(1);
    for (const knob of Object.keys(KNOB_READS) as (keyof typeof KNOB_READS)[]) expect(Number.isFinite(personalityOf(opened.player, knob)), knob).toBe(true);
    opened.advanceTo(opened.now + 2 * MS_DAY);
    expect(opened.player.personalityTraits).toEqual(['keeps_accounts', 'chaotic']);
  });
});
