/**
 * Brief 20's School area, B3: most of a term's class days missed ill bring Yale Health's assessment, which can end in a
 * medical leave (the guide's promise school.sick>school.leave), reached through the clock (2026-10-21). Two first-years
 * from one seed (`b20-school-welfare`, a New York student of modest means), each laid up from the first morning of
 * classes (TEST SETUP: a concussion that keeps them off work, set by hand as tests/guide-examples-school.test.ts sets one,
 * since injuries come by the draw; the consequences under test are the School's, not the injury's), and the clock moved
 * a week at a time, as the Advance menu moves it:
 *
 * - A is laid up for six weeks: every class day excused, and on the twelfth the share of the term's class days missed
 *   ill (`MANDATORY_LEAVE.excusedShare`) asks for Yale Health's assessment; laid up past two weeks more, it recommends a
 *   medical leave, and the dean imposes it.
 * - B is laid up for one week: those days excused, and nothing asked.
 *
 * No leak: the days excused are left out of the attendance either way; B's term goes on in good standing.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { healthOf } from '@/engine/systems/health';
import { MANDATORY_LEAVE } from '@/engine/content/school';
import { at, student, tallyOf, titled } from './setup/b20-school';

const weeks = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 7 * MS_DAY)); return sim; };
/** TEST SETUP: laid up until a moment by an injury that keeps them off work, as a concussion does. */
const layUp = (sim: Simulation, until: number) => { healthOf(sim.player).injury = { kind: 'concussion', at: sim.now, until, offWorkUntil: until } as never; };

describe('B3: most of a term’s class days missed ill, through the clock (seed b20-school-welfare)', () => {
  const S = {} as { a: Simulation; b: Simulation };
  beforeAll(() => {
    S.a = student('b20-school-welfare', { wealth: 'modest' });
    S.a.advanceTo(at(2026, 8, 31, 7));
    layUp(S.a, at(2026, 10, 12, 7));
    weeks(S.a, at(2026, 10, 2));
    S.b = student('b20-school-welfare', { wealth: 'modest' });
    S.b.advanceTo(at(2026, 8, 31, 7));
    layUp(S.b, at(2026, 9, 7, 7));
    weeks(S.b, at(2026, 10, 2));
  }, 60_000);

  it('laid up most of the term: the twelfth class day ill asks for the assessment, which recommends a leave, and the dean imposes it', () => {
    const asked = titled(S.a, 'Yale Health Asks To See You');
    expect(asked).toHaveLength(1);
    expect(asked[0]!.body).toMatch(/^After 1[2-9] of the term’s 1[2-9] class days missed ill, Yale Health has asked to see you on /);
    expect(titled(S.a, 'Yale Health Recommends A Medical Leave')).toHaveLength(1);
    expect(titled(S.a, 'A Medical Leave, By The Dean’s Decision')).toHaveLength(1);
    const school = S.a.player.school!;
    const leave = school.leave!;
    expect(leave.mandatory).toBeDefined();
    expect(leave.status).toBe('on');
    expect(Object.values(school.courses!).filter((r) => r.term === 0).every((r) => r.result === 'withdrawn')).toBe(true);
    expect(MANDATORY_LEAVE.excusedShare).toBeGreaterThan(0.5);
  });

  it('laid up a week: those days excused, nothing asked, the term going on in good standing', () => {
    expect(titled(S.b, 'Yale Health Asks To See You')).toHaveLength(0);
    expect(S.b.player.school!.leave).toBeUndefined();
    expect(S.b.player.school!.standing).toBe('good');
    const t = tallyOf(S.b);
    expect(t.excused).toBe(5);
    expect(t.attended + t.excused).toBe(t.classDays);
  });
});
