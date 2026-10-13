/**
 * Defects found by the second readings of 2026-10-12, each fixed and held here:
 * - the course record's header (`systems/courserecord.ts`) said a leave, like a repeated year or an additional term,
 *   could reach the Bulletin's nine semesters and was refused past them. The nine count the semesters enrolled
 *   (`enrolledTerms`), which a leave never adds to, and nothing on a leave's way reads `EXTENDED_STUDY`: a leave is held
 *   to three terms on its own (`LEAVE_RULES.maxTerms`). The header also read as putting `EXTENDED_STUDY` in
 *   `systems/leave.ts`; it's in `content/school.ts`;
 * - the school look's Terms Begun (`ui/looks/school.tsx`) read short for the whole of a leave: `startLeave` adds the
 *   leave's terms to the offset as it begins, while `termsBegun` runs only to the term the leave began in, so a
 *   two-term leave from the second fall read 1 of 6 with two terms passed, and still 1 once withdrawn;
 * - the school look's sentence put "standing" after a label that ends in it already: good standing was said with the
 *   word twice, and a warning as "in academic warning standing".
 * PLAYER JOURNEYS play through commands; FIXTURES set a state by hand and say so.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isValidElement, type ReactNode } from 'react';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { EXTENDED_STUDY, LEAVE_RULES, YALE_DRAMA } from '@/engine/content/school';
import { enrolledTerms, leaveLengths, leaveTermsUsed } from '@/engine/systems/leave';
import { termStart } from '@/engine/systems/school';
import { healthOf } from '@/engine/systems/health';
import { Stat } from '@/ui/components/primitives';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as subject } from '@/ui/looks/subject';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

/** A medical leave asked for and decided. FIXTURE: the flu, as `careFor` gives one, so a physician would recommend it. */
const medicalLeave = (sim: Simulation) => {
  healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
  const asked = sim.must<{ decideAt: number; firstTerm: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
  tended(sim, asked.decideAt + MS_HOUR);
  return asked;
};

const look = (sim: Simulation): Looked => {
  const found = resolveLook(sim, subject('school', YALE_DRAMA.id));
  if (!found || 'gone' in found) throw new Error('the school didn’t resolve');
  return found;
};

/** Every element under a node, depth first. */
function elements(node: ReactNode, out: { type: unknown; props: Record<string, unknown> }[] = []): { type: unknown; props: Record<string, unknown> }[] {
  if (Array.isArray(node)) { for (const n of node) elements(n as ReactNode, out); return out; }
  if (!isValidElement(node)) return out;
  const props = node.props as Record<string, unknown>;
  out.push({ type: node.type, props });
  elements(props.children as ReactNode, out);
  return out;
}

const termsBegun = (sim: Simulation) => elements(look(sim).body).find((e) => e.type === Stat && e.props.label === 'Terms Begun')?.props as { value: string; note: string } | undefined;

/** The module's leading comment, its ` * ` gutters taken off and its lines joined, as a reader reads it. */
const header = (...path: string[]): string => {
  const text = readFileSync(join(fileURLToPath(new URL('../src/', import.meta.url)), ...path), 'utf8');
  const block = /^\/\*\*([\s\S]*?)\*\//.exec(text)![1]!;
  return block.split('\n').map((l) => l.replace(/^\s*\*\s?/, '').trim()).join(' ').replace(/\s+/g, ' ');
};

describe('the course record’s header, against a leave', () => {
  it('says a leave doesn’t count toward the nine semesters and is held to three terms on its own, as a played leave is', () => {
    const sim = student('r3-nine');
    tended(sim, at(2026, 10, 5));
    const school = sim.player.school!;
    expect(enrolledTerms(school)).toEqual([0]);
    // The nine semesters changed to none: a leave's lengths don't change, as nothing on its way reads them.
    const lengths = leaveLengths(sim, school, 'medical');
    const nine = EXTENDED_STUDY.maxSemesters;
    try {
      (EXTENDED_STUDY as { maxSemesters: number }).maxSemesters = 0;
      expect(leaveLengths(sim, school, 'medical')).toEqual(lengths);
    } finally {
      (EXTENDED_STUDY as { maxSemesters: number }).maxSemesters = nine;
    }
    medicalLeave(sim);
    expect(school.leave!.status).toBe('on');
    // The leave puts them two terms behind, and takes the term it began in out of those enrolled: none added.
    expect(school.offset).toBe(2);
    expect(enrolledTerms(school)).toEqual([]);
    // Its own limit: two more terms would make four of the three the Bulletin allows, with no semester enrolled.
    expect(leaveTermsUsed(school)).toBe(2);
    expect(leaveLengths(sim, school, 'medical').find((x) => x.terms === 2)!.why).toMatch(new RegExp(`allows ${LEAVE_RULES.maxTerms} in all`));

    const h = header('engine', 'systems', 'courserecord.ts');
    expect(h).not.toMatch(/a leave, a repeated year or an additional term can reach/);
    expect(h).toMatch(/A leave doesn[’']t count toward them/);
    expect(h).toMatch(/`LEAVE_RULES\.maxTerms`/);
    expect(h).toMatch(/`enrolledTerms`/);
    // Where `EXTENDED_STUDY` is: the content, not the leave system that reads it.
    expect(h).toMatch(/`EXTENDED_STUDY` in `content\/school\.ts`/);
    expect(readFileSync(join(fileURLToPath(new URL('../src/', import.meta.url)), 'engine', 'content', 'school.ts'), 'utf8')).toMatch(/export const EXTENDED_STUDY = /);
  }, 60_000);
});

describe('PLAYER JOURNEY: Terms Begun through a leave', () => {
  it('a leave from the second fall reads the two terms passed for the whole of it, as many as the terms enrolled, and three back', () => {
    const sim = student('r3-second-fall');
    tended(sim, at(2027, 9, 20));
    const school = sim.player.school!;
    expect(termsBegun(sim)).toMatchObject({ value: `3 of ${YALE_DRAMA.terms}` });
    const asked = medicalLeave(sim);
    expect(asked.firstTerm).toBe(2);
    expect(school.leave!.status).toBe('on');
    // The fall left is taken again on return; the year before it is two terms passed, as Your Terms counts them enrolled.
    expect(termsBegun(sim)).toMatchObject({ value: `2 of ${YALE_DRAMA.terms}` });
    expect(termsBegun(sim)!.note).toMatch(/2 on leave or repeated/);
    expect(enrolledTerms(school)).toEqual([0, 1]);
    tended(sim, at(2028, 2, 1));
    expect(school.leave!.status).toBe('on');
    expect(termsBegun(sim)).toMatchObject({ value: `2 of ${YALE_DRAMA.terms}` });

    const back = school.leave!.returnTerm;
    expect(back).toBe(4);
    sim.must({ kind: 'school.return_notice', payload: {} });
    tended(sim, instantFromZoned({ ...termStart(back).date, hour: 12 }, zone));
    expect(school.leave).toBeUndefined();
    sim.must({ kind: 'school.reregister', payload: {} });
    tended(sim, sim.now + 7 * MS_DAY);
    // Back in the second fall: the third of the program's terms begun.
    expect(termsBegun(sim)).toMatchObject({ value: `3 of ${YALE_DRAMA.terms}` });
  }, 120_000);

  it('a leave begun with the spring, after the fall’s evaluation, reads the fall passed, and so does a withdrawal from it', () => {
    const sim = student('r3-spring');
    tended(sim, at(2026, 12, 28));
    const school = sim.player.school!;
    expect(school.history.map((h) => h.term)).toEqual([0]);
    const asked = medicalLeave(sim);
    expect(asked.firstTerm).toBe(1);
    tended(sim, at(2027, 1, 25));
    expect(school.leave!.status).toBe('on');
    expect(termsBegun(sim)).toMatchObject({ value: `1 of ${YALE_DRAMA.terms}` });
    expect(enrolledTerms(school)).toEqual([0]);

    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(school.standing).toBe('withdrawn');
    expect(school.leaves!.map((l) => l.status)).toEqual(['withdrawn']);
    expect(termsBegun(sim)).toMatchObject({ value: `1 of ${YALE_DRAMA.terms}` });
  }, 60_000);
});

describe('the school look’s sentence says a standing once', () => {
  it('in good standing, on academic warning, with a notice of academic concern', () => {
    const sim = student('r3-standing');
    expect(sim.player.school!.standing).toBe('good');
    expect(look(sim).summary).toMatch(/, in good standing, and /);
    // FIXTURE: the standings a term's evaluation can bring, set by hand.
    sim.player.school!.standing = 'warning';
    expect(look(sim).summary).toMatch(/, on academic warning, and /);
    sim.player.school!.standing = 'concern';
    expect(look(sim).summary).toMatch(/, with a notice of academic concern, and /);
    for (const s of ['good', 'warning', 'concern'] as const) {
      sim.player.school!.standing = s;
      expect(look(sim).summary.match(/standing/g)?.length ?? 0, s).toBeLessThanOrEqual(1);
      expect(look(sim).summary).not.toMatch(/(warning|concern) standing/);
    }
  });
});
