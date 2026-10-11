/**
 * PLAYER JOURNEY (acceptance pass, 2026-10-11): a second-year leave and the return into the later cohort, played. The
 * first year is played by the attentive policy (`tools/policy.ts`: classes, coursework, calls, sleep and meals through
 * their commands); the leave, the notice and the registration are the player's commands. Nothing is put on the save
 * by hand. Saved and opened again at each transition. Its graduation is played on by `tools/scenarios.ts`
 * (`leave-year2`), too long for the gate.
 */
import { describe, expect, it } from 'vitest';
import { loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { CLASSES_KIND, academicTerm, registered } from '@/engine/systems/school';
import { enrolledTerms, leaveRefusal } from '@/engine/systems/leave';
import { courseworkOf } from '@/engine/systems/coursework';
import { coverOn } from '@/engine/systems/health';
import { attentiveHour, life } from '../tools/policy';

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 9) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const between = (sim: Simulation, from: number, to: number, memo: RegExp) => sim.universe.transactions.filter((t) => t.at >= from && t.at < to && memo.test(t.memo));

describe('PLAYER JOURNEY: a second-year leave, and back with the class a year below', () => {
  it('asks in the summer after year one, is away the second year, gives notice, registers, and goes on with the class of 2030', () => {
    let sim = life('accept-y2', { homeRegionId: 'us-ny-newyork', pronouns: 'they/them' });
    const play = (until: number) => { while (sim.now < until) attentiveHour(sim); };
    const school = () => sim.player.school!;

    // Year one played: two terms, in good standing.
    play(at(2027, 7, 10));
    expect(school().history!.map((h) => [h.term, h.standing])).toEqual([[0, 'good'], [1, 'good']]);
    const firstClass = school().classmates.map((m) => m.name);
    const oldWork = courseworkOf(sim, sim.player)!.assignments.filter((a) => a.partner !== undefined).map((a) => ({ id: a.id, status: a.status, partner: firstClass[a.partner!] }));
    expect(oldWork.length).toBeGreaterThan(3);

    // Refusals before the right request: a professional reason, a medical leave with nothing to recommend it.
    expect(sim.execute({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'professional', terms: 2 } }).error).toMatch(/professional commitment/);
    expect(sim.execute({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness', terms: 2 } }).error).toMatch(/physician’s written recommendation/);
    const asked = sim.must<{ decideAt: number; firstTerm: number; startsNow: boolean }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family', terms: 2 } });
    expect(asked).toMatchObject({ firstTerm: 2, startsNow: false });
    expect(leaveRefusal(sim, sim.player, 'personal', 'family')).toMatch(/with the chair and the dean/);
    sim = reload(sim);
    play(asked.decideAt + 60 * 60_000);
    expect(school().leave).toMatchObject({ status: 'granted', firstTerm: 2, returnTerm: 4, terms: 2 });

    // The fall it begins: on leave, a year behind, no classes, no Yale Health student cover.
    play(at(2027, 9, 15));
    sim = reload(sim);
    expect(school().leave!.status).toBe('on');
    expect(school().offset).toBe(2);
    expect(school().classOf).toBe(2030);
    expect(sim.universe.scheduled.some((i) => i.kind === CLASSES_KIND && i.status === 'pending')).toBe(false);
    expect(coverOn(sim.player, sim.now)).not.toBe('yale');
    expect(sim.execute({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family', terms: 2 } }).error).toMatch(/on leave/);
    // Found by this journey (acceptance pass): the spring's Carlotta part, played, went on the résumé only at the next
    // casting, a year on, dated the year it came back. It's credited as the leave begins, in its own year.
    const carlotta = (school().credits ?? []).filter((c) => c.kind === 'carlotta');
    expect(carlotta.map((c) => c.year)).toEqual([2027]);
    expect(school().casting).toBeUndefined();
    expect(sim.execute({ kind: 'school.reregister', payload: {} }).error).toMatch(/registered/);

    // Notice of return, once; a second time refused.
    sim.must({ kind: 'school.return_notice', payload: {} });
    expect(sim.execute({ kind: 'school.return_notice', payload: {} }).error).toMatch(/gave notice/);

    // The year away, played: the first class goes on; the player is paid, billed, cast and credited for nothing.
    const away = sim.now;
    const creditsBefore = (school().credits ?? []).length;
    play(at(2028, 8, 30, 12));
    sim = reload(sim);
    const back = sim.now;
    expect(between(sim, away, back, /^Work-study wages/)).toHaveLength(0);
    expect(between(sim, away, back, /^Living-expense scholarship/)).toHaveLength(0);
    expect(enrolledTerms(school())).not.toContain(2);
    expect(enrolledTerms(school())).not.toContain(3);
    expect(Object.values(school().courses ?? {}).filter((r) => r.term === 2 || r.term === 3)).toHaveLength(0);
    expect(school().history!.map((h) => h.term)).toEqual([0, 1]);
    // No part while away: no credit added, no casting made for them.
    expect((school().credits ?? []).length).toBe(creditsBefore);
    // Cast again at the return term, not for the terms away.
    expect([undefined, 4]).toContain(school().casting?.term);
    const first = school().formerClasses![0]!;
    expect(first.classOf).toBe(2029);
    expect(first.classmates.map((m) => m.name)).toEqual(firstClass);
    expect(first.playedTo).toBe(3);
    expect(new Set(first.productions!.map((p) => p.term))).toEqual(new Set([2, 3]));
    for (const p of first.productions!) expect(p.cast.every((c) => firstClass.includes(c.name))).toBe(true);

    // Back: the class of 2030, at the same stage, with the production it had; registered by command, once.
    expect(school().leave).toBeUndefined();
    expect(school().leaves!.at(-1)!.status).toBe('returned');
    expect(academicTerm(school(), 4)).toBe(2);
    expect(school().classmates.some((m) => firstClass.includes(m.name))).toBe(false);
    expect(school().joinedHistory!.map((p) => p.term)).toEqual([3]);
    const joined = new Set(school().classmates.map((m) => m.name));
    expect(school().joinedHistory![0]!.cast.every((c) => joined.has(c.name))).toBe(true);
    expect(titled(sim, 'The Class Of 2030')).toHaveLength(1);
    expect(registered(school(), courseworkOf(sim, sim.player))).toBe(false);
    sim.must({ kind: 'school.reregister', payload: {} });
    expect(sim.execute({ kind: 'school.reregister', payload: {} }).error).toMatch(/registered/);
    expect(coverOn(sim.player, sim.now + 30 * MS_DAY)).toBe('yale');

    // The fall back, played: new work with the current class; old work keeps its partners and outcomes.
    play(at(2028, 10, 20));
    sim = reload(sim);
    const cw = courseworkOf(sim, sim.player)!;
    for (const w of oldWork) {
      const a = cw.assignments.find((x) => x.id === w.id)!;
      expect(a.status).toBe(w.status);
      expect(a.partnerName).toBe(w.partner);
    }
    const fresh = cw.assignments.filter((a) => a.setOn >= '2028-08-01' && a.partner !== undefined);
    expect(fresh.length).toBeGreaterThan(0);
    for (const a of fresh) { expect(a.partnerName).toBeUndefined(); expect(joined.has(school().classmates[a.partner!]!.name)).toBe(true); }
    // Classes count again: the fall's courses attended, at the year it's in.
    const fall = Object.values(school().courses ?? {}).filter((r) => r.term === 4);
    expect(fall.length).toBeGreaterThan(3);
    expect(fall.every((r) => (r.attended ?? 0) > 0)).toBe(true);
    expect(sim.ledger.audit()).toEqual([]);
  }, 300_000);

  it('plays the year away the same whether it passes a day at a time or at once', () => {
    const sim = life('accept-y2-steps', { homeRegionId: 'us-ny-newyork', pronouns: 'they/them' });
    while (sim.now < at(2027, 7, 10)) attentiveHour(sim);
    sim.must({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family', terms: 2 } });
    while (sim.now < at(2027, 9, 15)) attentiveHour(sim);
    sim.must({ kind: 'school.return_notice', payload: {} });
    const jumped = reload(sim);
    const until = at(2028, 2, 1, 12);
    while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + MS_DAY));
    jumped.advanceTo(until);
    const keep = (s: Simulation) => JSON.stringify({ leave: s.player.school!.leave, offset: s.player.school!.offset, classOf: s.player.school!.classOf, former: s.player.school!.formerClasses, history: s.player.school!.history });
    expect(keep(jumped)).toBe(keep(sim));
  }, 300_000);
});
