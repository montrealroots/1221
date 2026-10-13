/**
 * A defect found by the third readings of 2026-10-12, fixed and held here: on a leave from the second spring or the
 * third, `yearOfStudy` (`systems/school.ts`) read a year below the school look's Terms Begun on the same save. Terms
 * Begun had been made to count a leave's terms (`programTermsBegun`, `ui/looks/school.tsx`) while the year still read
 * the calendar's terms less the offset, which `startLeave` moves by the whole leave as it begins: on a two-term leave
 * from the second spring the look read Terms Begun 3 of 6 and "your first year of three", and the Profile's Year and
 * the save's slot read Year 1. The Profile and Home read `yearOfStudy` as the slot does; Home says On Leave on a leave.
 * PLAYER JOURNEYS play through commands; FIXTURES set a state by hand and say so.
 */
import { describe, expect, it } from 'vitest';
import { isValidElement, type ReactNode } from 'react';
import { createSave, refreshMeta } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { defaultConfig } from '@/engine/world/bootstrap';
import { YALE_DRAMA } from '@/engine/content/school';
import { schoolEnded, yearOfStudy } from '@/engine/systems/school';
import { healthOf } from '@/engine/systems/health';
import { Stat } from '@/ui/components/primitives';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as subject } from '@/ui/looks/subject';
import { attentiveHour, life } from '../tools/policy';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

const look = (sim: Simulation): Looked => {
  const found = resolveLook(sim, subject('school', YALE_DRAMA.id));
  if (!found || 'gone' in found) throw new Error('the school didn’t resolve');
  return found;
};

function elements(node: ReactNode, out: { type: unknown; props: Record<string, unknown> }[] = []): { type: unknown; props: Record<string, unknown> }[] {
  if (Array.isArray(node)) { for (const n of node) elements(n as ReactNode, out); return out; }
  if (!isValidElement(node)) return out;
  const props = node.props as Record<string, unknown>;
  out.push({ type: node.type, props });
  elements(props.children as ReactNode, out);
  return out;
}

/** The look's Terms Begun, as the number of the program's terms it reads. */
const termsBegun = (sim: Simulation): number => {
  const value = (elements(look(sim).body).find((e) => e.type === Stat && e.props.label === 'Terms Begun')?.props as { value: string }).value;
  return Number(/^(\d+) of /.exec(value)![1]);
};

/** The year the look's sentence says, as a number. */
const lookYear = (sim: Simulation): number => ['first', 'second', 'third'].indexOf(/your (\w+) year of three/.exec(look(sim).summary)![1]!) + 1;

/** The save slot's line, which says the year at school beside the title (`refreshMeta`). */
const slot = (sim: Simulation): string => { refreshMeta(sim); return sim.universe.meta.careerLabel; };

describe('PLAYER JOURNEY: the year of study through a leave from the second spring', () => {
  it('reads the second year, as Terms Begun’s three terms do, on the look, the slot and wherever the year is read', () => {
    // Played by the attentive policy (`tools/policy.ts`) to the second spring: an idle student is dismissed by then.
    const sim = life('r3c-second-spring', { homeRegionId: 'us-ny-newyork' });
    const play = (until: number) => { while (sim.now < until) attentiveHour(sim); };
    play(at(2028, 1, 20));
    const school = sim.player.school!;
    expect(schoolEnded(school.standing)).toBe(false);
    expect(school.termsBegun).toBe(4);
    expect(yearOfStudy(sim.player)).toBe(2);
    expect(termsBegun(sim)).toBe(4);
    expect(lookYear(sim)).toBe(2);
    expect(slot(sim)).toMatch(/, Yale Drama Year 2$/);

    // A medical leave from this spring. FIXTURE: the flu, as `careFor` gives one, so a physician would recommend it.
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    const asked = sim.must<{ decideAt: number; firstTerm: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness', terms: 2 } });
    expect(asked.firstTerm).toBe(3);
    play(asked.decideAt + MS_HOUR);
    expect(school.leave).toMatchObject({ status: 'on', terms: 2, returnTerm: 5 });
    expect(school.offset).toBe(2);

    // The spring left is taken again on return: three of the program's terms before it, the second year's fall the last.
    // Each reading said on its own, so a year read low shows on every one of them.
    expect(termsBegun(sim)).toBe(3);
    expect.soft(yearOfStudy(sim.player)).toBe(2);
    expect.soft(look(sim).summary).toMatch(/You’re in your second year of three/);
    expect.soft(slot(sim)).toMatch(/, Yale Drama Year 2$/);
    expect(lookYear(sim)).toBe(2);
    // And so through the leave, a term on. FIXTURE: kept well while away, faster than the policy's hours, with no
    // classes or work to play.
    tended(sim, at(2028, 9, 15));
    expect(school.leave!.status).toBe('on');
    expect(school.termsBegun).toBe(4);
    expect(termsBegun(sim)).toBe(3);
    expect(yearOfStudy(sim.player)).toBe(2);
    expect(slot(sim)).toMatch(/, Yale Drama Year 2$/);

    // Withdrawn from the leave, the year left in is the year Terms Begun reads.
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(school.standing).toBe('withdrawn');
    expect(school.leaves!.map((l) => l.status)).toEqual(['withdrawn']);
    expect(termsBegun(sim)).toBe(3);
    expect(yearOfStudy(sim.player)).toBe(2);
  }, 400_000);
});

describe('FIXTURE: the year of study agrees with Terms Begun on a leave from each term', () => {
  it('from each term, after a repeated year, and on a leave from before lengths were kept', () => {
    const sim = life('r3c-each-term', { homeRegionId: 'us-ny-newyork' });
    const school = sim.player.school!;
    // FIXTURE: a two-term leave under way from each calendar term, set as `startLeave` leaves it: the calendar's terms
    // begun to the leave's own, and the whole leave on the offset. The second spring and the third read a year up.
    const expected = [1, 1, 1, 2, 2, 3];
    for (let first = 0; first < YALE_DRAMA.terms; first += 1) {
      school.termsBegun = first + 1;
      school.offset = 2;
      school.leave = { id: 'leave-1', kind: 'medical', reason: 'illness', requestedAt: sim.now, status: 'on', terms: 2, firstTerm: first, returnTerm: first + 2, decideAt: sim.now };
      expect(yearOfStudy(sim.player), `a leave from term ${first}`).toBe(expected[first]);
      expect(lookYear(sim), `a leave from term ${first}`).toBe(expected[first]);
      expect(Math.max(1, Math.ceil(termsBegun(sim) / 2)), `a leave from term ${first}`).toBe(expected[first]);
      // A leave from before lengths were kept: none on it, its return term two on, as they were set.
      delete school.leave.terms;
      expect(yearOfStudy(sim.player), `an older leave from term ${first}`).toBe(expected[first]);
    }
    // FIXTURE: the first year repeated, then a leave from the calendar's sixth term, the program's second spring: the
    // offset before the leave is the repeated year's.
    school.termsBegun = 6;
    school.offset = 4;
    school.repeats = 1;
    school.leave = { id: 'leave-1', kind: 'medical', reason: 'illness', requestedAt: sim.now, status: 'on', terms: 2, firstTerm: 5, returnTerm: 7, decideAt: sim.now };
    expect(termsBegun(sim)).toBe(3);
    expect(yearOfStudy(sim.player)).toBe(2);
    expect(lookYear(sim)).toBe(2);
    // FIXTURE: a one-term leave from the third fall, a length the course sequence refuses today (`leaveLengths`) and the
    // Bulletin allows: its own length off the offset, not two terms'.
    school.termsBegun = 5;
    school.offset = 1;
    delete school.repeats;
    school.leave = { id: 'leave-1', kind: 'medical', reason: 'illness', requestedAt: sim.now, status: 'on', terms: 1, firstTerm: 4, returnTerm: 5, decideAt: sim.now };
    expect(termsBegun(sim)).toBe(4);
    expect(yearOfStudy(sim.player)).toBe(2);
    expect(lookYear(sim)).toBe(2);
    // FIXTURE: a leave from the second spring ended in dismissal, no notice given, as `closeLeave` leaves it: the year
    // it left them in, as Terms Begun reads it.
    school.termsBegun = 4;
    school.offset = 2;
    school.standing = 'dismissed';
    school.leaves = [{ ...school.leave!, terms: 2, firstTerm: 3, returnTerm: 5, status: 'dismissed' }];
    delete school.leave;
    expect(termsBegun(sim)).toBe(3);
    expect(yearOfStudy(sim.player)).toBe(2);
  });

  it('a leave granted and not yet begun leaves the year where the terms begun put it', () => {
    // FIXTURE: a leave from the third fall granted in the summer after the second year, before its term: the offset
    // isn't moved until it begins (`startLeave`), and there's none before it.
    const sim = life('r3c-granted', { homeRegionId: 'us-ny-newyork' });
    const school = sim.player.school!;
    school.termsBegun = 4;
    expect(school.offset).toBeUndefined();
    school.leave = { id: 'leave-1', kind: 'personal', reason: 'family', requestedAt: sim.now, status: 'granted', terms: 2, firstTerm: 4, returnTerm: 6, decideAt: sim.now };
    expect(termsBegun(sim)).toBe(4);
    expect(yearOfStudy(sim.player)).toBe(2);
    expect(lookYear(sim)).toBe(2);
  });

  it('a life that never went to the school is read as the first year, as before, with no record to read', () => {
    const sim = createSave(1, 'r3c-stranger', { ...defaultConfig() });
    expect(sim.player.school).toBeUndefined();
    expect(yearOfStudy(sim.player)).toBe(1);
  });
});
