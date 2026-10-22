/**
 * Brief 20, the craft area's promises (docs/verification/audit-2026-10-21/effects/craft.json, `promises`): each
 * connection the guide's Coursework, Craft and Productions entries say one feature makes to another, read against the
 * code, and held here where no test the gate runs held it as the player reaches it. The rest are held where the area's
 * rows name their tests.
 *
 * Played as the player plays: creation's own config, the commands as the screens send them, and the clock
 * (`tests/fakes/craft-life.ts`). TEST SETUP, said where it's used: the day tended alike for twins (`tend`), the clock's
 * commitments cleared for a test at commands alone (`clearDay`), and an ability's level set where a test needs a take
 * strong enough to earn a callback (`setAbility`), which is the input and never the consequence.
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR } from '@/engine/core/time';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { CHAPTERS } from '@/engine/content/tutorial';
import { isOpen } from '@/engine/world/tutorial';
import { courseworkOf, PARTNER_KIND, questionsFor, type Assignment } from '@/engine/systems/coursework';
import { bandOfQuality, journeyOf } from '@/engine/systems/evaluation';
import { identityOf } from '@/engine/systems/artistry';
import { prepSpeed, recordOf } from '@/engine/systems/briefs';
import { optionsOf, problemsOf } from '@/engine/systems/workbook';
import { workPiece } from '@/engine/systems/workpieces';
import { BONDS, CALL_KIND, ESTIMATE, castCompany } from '@/engine/systems/school';
import { readiness } from '@/engine/systems/life';
import { at, clearDay, live, reload, run, sceneStudy, setAbility, student, tend, workScene } from './fakes/craft-life';
import { CONTEMPORARY_PLAYS } from '@/engine/content/contemporary';
import { FEATURE_LABEL } from '@/engine/systems/experience';

const SHOWN = at(2026, 9, 8, 12);
const FULL = ['read', 'learn', 'reader', 'rehearse'] as const;
const firstScene = (sim: Simulation): Assignment => courseworkOf(sim, sim.player)!.assignments.find((a) => a.course === 'DRAM 103a/b')!;
/** A partner's open asks, answered no by the command, as the Coursework tab answers them, so the piece's steps open. */
const declineAsks = (sim: Simulation) => { for (const a of courseworkOf(sim, sim.player)?.assignments ?? []) for (const k of a.asks ?? []) if (k.status === 'open') run(sim, 'school.answer_partner', { assignmentId: a.id, askId: k.id, yes: false }); };
const rest = (sim: Simulation) => { clearDay(sim); Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 }); };

describe('coursework.prepare', () => {
  it('readiness sets how far a step moves its part: the same Read The Scene, rested and after a day and a night up', () => {
    // promise.coursework.prepare>body.how
    const rested = student('b20c-step'), up = student('b20c-step');
    const when = at(2026, 8, 31, 19);
    live(rested, when);
    live(up, when, { upFrom: at(2026, 8, 30, 8) });
    const step = (sim: Simulation) => { clearDay(sim); declineAsks(sim); return run<{ moved: number }>(sim, 'school.prepare', { assignmentId: sceneStudy(sim)!.id, activity: 'read' }).moved; };
    const r = readiness(rested.player), u = readiness(up.player);
    const a = step(rested), b = step(up);
    console.log('FIGURES step by readiness', r.toFixed(1), u.toFixed(1), a, b);
    expect(u).toBeLessThan(r);
    expect(b).toBeLessThan(a);
  });

  it('each showing is kept on the record, counted for life, and read by Your Work So Far', () => {
    // promise.coursework.prepare>craft.identity, promise.craft.work>craft.profile
    const sim = student('b20c-show');
    live(sim, SHOWN, { evening: (s) => workScene(s, FULL) });
    const a = firstScene(sim);
    const rec = (sim.player.work ?? []).find((w) => w.at === a.shown!.at && w.what === 'Scene Study')!;
    expect(rec).toBeDefined();
    expect(rec.overall / 100).toBeCloseTo(a.shown!.score, 3);
    const j = journeyOf(sim.player);
    expect(Object.values(j.totals).reduce((t, x) => t + (x?.n ?? 0), 0)).toBe((sim.player.work ?? []).length);
    // What held it back is kept for life, by its kind and what (`countWork`), where What Keeps Holding It Back reads it.
    for (const l of rec.limits) expect(j.limits?.[`${l.kind}:${l.what}`]?.n ?? 0).toBeGreaterThan(0);
    expect(identityOf(sim.player).pieces).toBe((sim.player.work ?? []).length);
  });
});

describe('coursework.playing', () => {
  it('the showing counts the choice: the same scene prepared the same way, played expansive against left open', () => {
    // promise.coursework.playing>coursework.feedback
    const open = student('b20c-show'), chosen = student('b20c-show');
    live(open, SHOWN, { evening: (s) => workScene(s, FULL) });
    live(chosen, SHOWN, { evening: (s, day) => { if (day === at(2026, 8, 30)) run(s, 'school.choose_playing', { assignmentId: sceneStudy(s)!.id, scale: 'expansive' }); workScene(s, FULL); } });
    const A = firstScene(open), B = firstScene(chosen);
    const rec = (sim: Simulation, a: Assignment) => (sim.player.work ?? []).find((w) => w.at === a.shown!.at && w.what === 'Scene Study')!;
    console.log('FIGURES playing at the showing', A.shown!.score, B.shown!.score, B.playing?.prep, JSON.stringify(rec(open, A).dims), JSON.stringify(rec(chosen, B).dims));
    expect(B.playing?.scale).toBe('expansive');
    expect(B.playing!.prep).toBeGreaterThan(0);
    // How far it's rehearsed is a part of the showing's preparation, and what it favors moves the dimensions.
    expect(rec(chosen, B).inputs.prep.approach).toBe(B.playing!.prep);
    expect(rec(open, A).inputs.prep.approach).toBeUndefined();
    expect(rec(chosen, B).dims).not.toEqual(rec(open, A).dims);
  });
});

describe('coursework.partners', () => {
  it('a rehearsal agreed goes on the calendar and the clock stops at it; kept, it moves the partner part', () => {
    // promise.coursework.partners>day.calendar, promise.coursework.partners>coursework.prepare
    const sim = student('b20c-partner');
    live(sim, at(2026, 9, 1, 12));
    clearDay(sim); tend(sim);
    const a = sceneStudy(sim)!;
    const when = at(2026, 9, 3, 19);
    const asked = run<{ accepted: boolean; rehearsalId: string }>(sim, 'school.ask_partner', { assignmentId: a.id, at: when });
    expect(asked.accepted).toBe(true);
    const item = sim.universe.scheduled.find((i) => i.kind === PARTNER_KIND && i.payload.rehearsalId === asked.rehearsalId)!;
    expect(item.at).toBe(when);
    expect(item.requiresPlayer).toBe(true);
    tend(sim);
    const r = sim.advanceTo(when + MS_HOUR, { stopOnPlayerRequired: true });
    // The jump stops at the first thing that needs the player: the rehearsal, unless a class came first.
    const stops: string[] = [];
    let res = r;
    while (res.interruptedBy) { stops.push(res.interruptedBy.kind); if (res.interruptedBy.kind === PARTNER_KIND) break; tend(sim); sim.advanceTo(res.interruptedBy.at + 1); tend(sim); res = sim.advanceTo(when + MS_HOUR, { stopOnPlayerRequired: true }); }
    expect(stops).toContain(PARTNER_KIND);
    expect(sim.now).toBe(when);
    const before = a.prep.partner;
    tend(sim);
    sim.advanceTo(when + 2 * MS_HOUR);
    const kept = a.rehearsals.find((x) => x.id === asked.rehearsalId)!;
    console.log('FIGURES partner rehearsal', kept.status, before, a.prep.partner);
    if (kept.status === 'kept') expect(a.prep.partner).toBeGreaterThan(before);
    else expect(['missedByThem']).toContain(kept.status);
  });
});

describe('coursework.workbook', () => {
  it('needs a scene\'s lines at 30% to try a way; a part of the preparation short is a problem with no way at it, fixed by its own step', () => {
    // promise.coursework.workbook>coursework.prepare, promise.coursework.table>coursework.workbook
    const sim = student('b20c-workbook');
    live(sim, at(2026, 8, 31, 18), { evening: (s) => workScene(s, ['read'], 2) });
    clearDay(sim); tend(sim);
    const a = sceneStudy(sim)!;
    const key = `assignment:${a.id}`;
    // Every answer changed, by the command, to one the text doesn't support: the table work short.
    for (const { q, options } of questionsFor(a)) { const against = options.find((o) => !o.supported); if (against) run(sim, 'school.choose', { assignmentId: a.id, question: q.id, option: against.id }); }
    tend(sim); clearDay(sim);
    const piece0 = workPiece(sim, sim.player, key)!;
    expect(piece0.refusal(30)).toBe('Learn some of the lines first: there’s nothing to rehearse without them.');
    declineAsks(sim);
    run(sim, 'school.prepare', { assignmentId: a.id, activity: 'learn' });
    tend(sim); clearDay(sim);
    expect(a.prep.memorization).toBeGreaterThanOrEqual(0.3);
    const piece = workPiece(sim, sim.player, key)!;
    expect(piece.refusal(30)).toBeUndefined();
    const prep = problemsOf(piece).find((p) => p.id === 'prep:interpretation');
    expect(prep).toBeDefined();
    expect(optionsOf(piece, prep!)).toEqual([]);
    run(sim, 'work.identify', { piece: key, problem: prep!.id });
    expect(sim.execute({ kind: 'work.try', payload: { piece: key, adjustment: 'work-beat' } }).error).toBe('That doesn’t answer the problem you’re working on.');
    // An answer the text supports, to each question, is what answers it.
    for (const { q, options } of questionsFor(a)) { tend(sim); clearDay(sim); run(sim, 'school.choose', { assignmentId: a.id, question: q.id, option: options.find((o) => o.supported)!.id }); }
    expect(problemsOf(workPiece(sim, sim.player, key)!).some((p) => p.id === 'prep:interpretation')).toBe(false);
  });

  it('working a limit trains what limits it, a little; running into a part trains adaptability', () => {
    // promise.coursework.workbook>craft.profile
    const b = BRIEF_BY_ID['brief-absurdist']!;
    const sim = student('b20c-workbook-train');
    setAbility(sim, 'emotionalDepth', 15);
    const go = (kind: string, payload: Record<string, unknown>) => { rest(sim); return run(sim, kind, payload); };
    go('brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    for (const step of ['read', 'lines', 'lines', 'rehearse']) go('brief.prepare', { brief: b.id, step });
    rest(sim);
    const key = `brief:${b.id}`;
    const limit = problemsOf(workPiece(sim, sim.player, key)!).find((p) => p.kind === 'limit')!;
    expect(limit).toBeDefined();
    go('work.identify', { piece: key, problem: limit.id });
    const what = limit.id.slice('limit:'.length);
    const grew = () => (sim.player.development?.history ?? []).filter((h) => h.source === `workbook:${key}`).map((h) => h.id);
    go('work.try', { piece: key, adjustment: 'work-beat' });
    expect(grew()).toContain(what === 'emotion' ? 'emotionalDepth' : what);
    const turn = problemsOf(workPiece(sim, sim.player, key)!).find((p) => p.kind === 'turn');
    if (turn) {
      go('work.identify', { piece: key, problem: turn.id });
      const n = grew().filter((x) => x === 'adaptability').length;
      go('work.try', { piece: key, adjustment: 'run-into' });
      expect(grew().filter((x) => x === 'adaptability').length).toBe(n + 1);
    }
  });
});

describe('Play This Part Another Way: on an aspect the whole leaves open', () => {
  it('on a class scene and on a brief, offers no side of an axis the whole is played on, and both sides of one left open', () => {
    // promise.coursework.playing>coursework.workbook, promise.coursework.workbook>coursework.playing,
    // promise.craft.brief-choose>coursework.workbook
    const sim = student('b20c-ways');
    live(sim, at(2026, 9, 1, 18), { evening: (s) => workScene(s, ['read', 'learn', 'rehearse']) });
    tend(sim);
    const a = sceneStudy(sim)!;
    run(sim, 'school.choose_playing', { assignmentId: a.id, pace: 'driven' });
    const b = BRIEF_BY_ID['brief-absurdist']!;
    rest(sim); run(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id, scale: 'restrained' });
    for (const step of ['read', 'lines', 'rehearse']) { rest(sim); run(sim, 'brief.prepare', { brief: b.id, step }); }
    for (const [key, chosen] of [[`assignment:${a.id}`, 'pace'], [`brief:${b.id}`, 'scale']] as const) {
      const piece = workPiece(sim, sim.player, key)!;
      const segment = problemsOf(piece).find((p) => p.segment !== undefined && ['segment', 'limit'].includes(p.kind));
      const ways = segment ? optionsOf(piece, segment).filter((o) => o.adjustment === 'beat-way').map((o) => o.option!) : [];
      console.log('FIGURES ways', key, segment?.id, ways.join(' '));
      expect(segment).toBeDefined();
      expect(ways.some((w) => w.startsWith(`${chosen}:`))).toBe(false);
      expect(ways.length).toBeGreaterThan(0);
    }
  });
});

describe('craft.profile', () => {
  it('opens with the guide\'s chapter on it: locked in a guided life until that chapter is read', () => {
    // promise.craft.profile>start.guide
    const sim = student('b20c-guided', { tutorial: true } as never);
    expect(isOpen(sim, 'ui.profile')).toBe(false);
    for (const c of CHAPTERS) {
      run(sim, 'tutorial.read', { chapterId: c.id });
      if (c.opens.includes('ui.profile')) break;
      expect(isOpen(sim, 'ui.profile')).toBe(false);
    }
    expect(isOpen(sim, 'ui.profile')).toBe(true);
  });
});

describe('craft.brief-reader and craft.brief-tape', () => {
  const B = BRIEF_BY_ID['brief-absurdist']!;
  const go = (sim: Simulation, kind: string, payload: Record<string, unknown>) => { rest(sim); return run<Record<string, unknown>>(sim, kind, payload); };
  const prepared = (seed: string, mastered = false) => {
    const sim = student(seed);
    if (mastered) for (const id of ['emotionalDepth', 'presence', 'listening', 'imagination', 'focus', 'memory', 'adaptability', 'composure', 'discipline', 'vocal', 'physical', 'screen', 'scene']) setAbility(sim, id, 95);
    go(sim, 'brief.choose', { brief: B.id, reading: B.readings[0]!.id });
    for (const step of ['read', 'lines', 'lines', 'rehearse', 'rehearse']) go(sim, 'brief.prepare', { brief: B.id, step });
    return sim;
  };

  it('every take with a classmate reading counts toward Playing With Others, which Your Work So Far gives from the third', () => {
    // promise.craft.brief-reader>craft.identity
    const sim = prepared('b20c-reader');
    go(sim, 'brief.reader', { brief: B.id, mate: 0 });
    for (let d = 0; d < 3; d += 1) {
      rest(sim); sim.advanceTo(at(2026, 8, 29 + d, 14)); rest(sim);
      const before = journeyOf(sim.player).together?.n ?? 0;
      go(sim, 'practice.self_tape', { genre: B.kinds[0], brief: B.id });
      expect(journeyOf(sim.player).together!.n).toBe(before + 1);
      expect(recordOf(sim.player, B.id).takes.at(-1)!.together).toBeDefined();
    }
    const tog = journeyOf(sim.player).together!;
    expect(tog.n).toBe(3);
    // Named from the third piece with others: there at three, so the line below is never read off nothing.
    expect(identityOf(sim.player).collaboration).toBeDefined();
    expect(identityOf(sim.player).collaboration?.line).toBe(`Your 3 pieces with a partner, a reader or a company averaged ${Math.round((tog.sum / tog.n) * 10) / 10} out of 100.${tog.slips ? identityOf(sim.player).collaboration!.line.slice(identityOf(sim.player).collaboration!.line.indexOf(' Of ')) : ''}`);
  });

  it('a callback answered as its note asks counts toward Taking Direction; played against it, it doesn\'t', () => {
    // promise.craft.brief-tape>craft.identity
    const sim = prepared('b20c-callback', true);
    rest(sim); sim.advanceTo(at(2026, 8, 29, 14)); rest(sim);
    go(sim, 'practice.self_tape', { genre: B.kinds[0], brief: B.id });
    const cb = recordOf(sim.player, B.id).callback!;
    expect(cb).toBeDefined();
    const given = journeyOf(sim.player).direction!;
    expect(given.given).toBe(1);
    // Played against the note: not answered, the callback stays.
    const other = cb.side;
    go(sim, 'brief.choose', { brief: B.id, reading: B.readings[0]!.id, [cb.axis]: other === 'measured' ? 'driven' : other === 'driven' ? 'measured' : other === 'restrained' ? 'expansive' : other === 'expansive' ? 'restrained' : other === 'set' ? 'open' : 'set' });
    rest(sim); sim.advanceTo(at(2026, 8, 30, 14)); rest(sim);
    go(sim, 'practice.self_tape', { genre: B.kinds[0], brief: B.id });
    expect(journeyOf(sim.player).direction!.answered).toBe(0);
    expect(recordOf(sim.player, B.id).callback).toBeDefined();
    // Played as asked: answered, counted, and the callback cleared.
    go(sim, 'brief.choose', { brief: B.id, reading: B.readings[0]!.id, [cb.axis]: cb.side });
    for (const step of ['rehearse', 'rehearse']) go(sim, 'brief.prepare', { brief: B.id, step });
    rest(sim); sim.advanceTo(at(2026, 8, 31, 18)); rest(sim);
    go(sim, 'practice.self_tape', { genre: B.kinds[0], brief: B.id });
    expect(journeyOf(sim.player).direction!.answered).toBe(1);
    expect(journeyOf(sim.player).direction!.ways.callback).toBe(1);
    expect(recordOf(sim.player, B.id).callback).toBeUndefined();
  });

  it('takes and their readings are read for habits: five takes of readings leaning the same way are named one', () => {
    // promise.craft.brief-tape>craft.identity, promise.craft.brief-choose>craft.identity
    const sim = prepared('b20c-reading-habit');
    for (let d = 0; d < 5; d += 1) {
      expect(identityOf(sim.player).habits.some((h) => h.label.startsWith('Readings Toward'))).toBe(false);
      rest(sim); sim.advanceTo(at(2026, 8, 25 + d, 14)); rest(sim);
      go(sim, 'practice.self_tape', { genre: B.kinds[0], brief: B.id });
    }
    const habit = identityOf(sim.player).habits.find((h) => h.label.startsWith('Readings Toward'))!;
    expect(habit).toBeDefined();
    expect(habit.line).toContain('5 of 5 takes');
  });

  it('rested, at readiness 60 or more, tiredness costs a take nothing; under it, it costs', () => {
    // promise.craft.brief-tape>body.sleep
    const T = at(2026, 8, 29, 14);
    const taped = (w: Record<string, number>) => {
      const sim = prepared('b20c-rested');
      rest(sim); sim.advanceTo(T); clearDay(sim);
      Object.assign(sim.player.wellbeing, w);
      const r = readiness(sim.player);
      return { r, overall: run<{ overall: number }>(sim, 'practice.self_tape', { genre: B.kinds[0], brief: B.id }).overall };
    };
    const fresh = taped({ energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
    const tiredButSufficient = taped({ energy: 70, stress: 25, sleepDebt: 2, nourishment: 75, hygiene: 80, morale: 55 });
    const under = taped({ energy: 25, stress: 55, sleepDebt: 12, nourishment: 60, hygiene: 80, morale: 50 });
    console.log('FIGURES rested take', fresh.r.toFixed(1), fresh.overall, tiredButSufficient.r.toFixed(1), tiredButSufficient.overall, under.r.toFixed(1), under.overall);
    expect(tiredButSufficient.r).toBeGreaterThanOrEqual(60);
    expect(tiredButSufficient.r).toBeLessThan(fresh.r);
    expect(tiredButSufficient.overall).toBe(fresh.overall);
    expect(under.r).toBeLessThan(60);
    expect(under.overall).toBeLessThan(fresh.overall);
  });
});

describe('productions: the first spring\'s Carlotta Festival, played by the clock', () => {
  const sim = student('b20c-carlotta');
  live(sim, at(2027, 1, 26));
  const calls = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.status === 'pending').sort((a, b) => a.at - b.at);
  const firstCall = calls[0]!;

  it('casting puts every call and performance on the calendar, each rehearsal with its stage, and the clock stops at them', () => {
    // promise.productions.casting>productions.part, promise.productions.casting>day.calendar
    expect(sim.player.school!.casting).toBeDefined();
    const rehearsals = calls.filter((c) => c.payload.call === 'rehearsal');
    expect(rehearsals.length).toBeGreaterThan(0);
    expect(rehearsals[0]!.payload.stage).toBe('read');
    expect(rehearsals.at(-1)!.payload.stage).toBe('dress');
    expect(rehearsals.map((c) => c.payload.n)).toEqual(rehearsals.map((_, i) => i + 1));
    expect(calls.filter((c) => c.payload.call === 'performance').length).toBeGreaterThan(0);
    expect(calls.every((c) => c.requiresPlayer)).toBe(true);
    // The jump to the read-through's evening stops at it.
    live(sim, firstCall.at - 3 * MS_HOUR);
    tend(sim);
    let r = sim.advanceTo(firstCall.at + 6 * MS_HOUR, { stopOnPlayerRequired: true });
    while (r.interruptedBy && r.interruptedBy.kind !== CALL_KIND) { tend(sim); sim.advanceTo(r.interruptedBy.at + 1); r = sim.advanceTo(firstCall.at + 6 * MS_HOUR, { stopOnPlayerRequired: true }); }
    expect(r.interruptedBy?.id).toBe(firstCall.id);
    expect(sim.now).toBe(firstCall.at);
  });

  /** The festival's nights played by the clock, each read as it lands. TEST SETUP for two of the three: every ability and the play's techniques at a level, so the nights go Strong or Off. */
  function nights(seed: string, level?: number) {
    const life = student(seed);
    if (level !== undefined) for (const id of ['emotionalDepth', 'presence', 'listening', 'imagination', 'focus', 'memory', 'adaptability', 'composure', 'discipline', 'vocal', 'physical', 'scene', 'script', 'character', 'coldReading']) setAbility(life, id, level);
    live(life, at(2027, 1, 26));
    const curtains = life.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.call === 'performance').sort((a, b) => a.at - b.at);
    return { life, curtains };
  }

  it.each([['b20c-carlotta', undefined], ['b20c-carlotta-strong', 95], ['b20c-carlotta-weak', 5]] as const)('each night is kept in the work, judged in the play\'s movements, the night with the company worked out beside it and counted toward Playing With Others, and the morale it leaves by how it went together (%s)', (seed, level) => {
    // promise.productions.nights>craft.work, promise.productions.nights>craft.identity, promise.craft.work>productions.nights,
    // promise.productions.nights>body.how
    const { life: sim, curtains } = nights(seed, level);
    const seen: { before: number; after: number; together: number; own: number; expected: number }[] = [];
    const proc = () => (sim.player.school!.casting as unknown as { process: { together?: { sum: number; n: number } } }).process;
    for (const c of curtains) {
      live(sim, c.at - 1);
      tend(sim);
      const before = sim.player.wellbeing.morale;
      const n0 = journeyOf(sim.player).together?.n ?? 0;
      const sum0 = proc().together?.sum ?? 0;
      const school = sim.player.school!;
      const friends = (school.casting!.cast ?? []).filter((x) => (school.classmates.find((m) => m.name === x.name)?.bond ?? 0) >= BONDS.friend).length;
      sim.advanceTo(c.at + 1);
      const night = (sim.player.work ?? []).at(-1)!;
      expect(night.task).toBe('performance');
      expect(night.at).toBe(c.at);
      expect(night.inputs.piece?.segments.length ?? 0).toBeGreaterThanOrEqual(2);
      expect(journeyOf(sim.player).together!.n).toBe(n0 + 1);
      const together = Math.round((proc().together!.sum - sum0) * 10) / 10;
      const felt = bandOfQuality(together);
      const lift = felt === 'unready' ? -ESTIMATE.nights.sting : felt === 'working' ? 0 : ESTIMATE.nights.lift;
      const expected = Math.max(0, Math.min(100, before + castCompany(sim.player, friends) + lift));
      seen.push({ before, after: sim.player.wellbeing.morale, together, own: night.overall, expected });
    }
    console.log('FIGURES nights', seed, JSON.stringify(seen));
    expect(proc().together!.n).toBe(curtains.length);
    for (const x of seen) expect(x.after).toBeCloseTo(x.expected, 6);
    if (level === 95) expect(seen.some((x) => x.after > x.before)).toBe(true);
    if (level === 5) expect(seen.some((x) => x.after < x.before)).toBe(true);
  });
});

describe('productions.plays: script analysis, which every read trains, is part of the craft a scene\'s table work uses', () => {
  it('a winter of plays read trains script analysis past a twin who spent the hours otherwise; and script analysis is read by the first spring\'s Table Work, shown at its meeting', () => {
    // promise.productions.plays>craft.profile, promise.productions.plays>coursework.prepare
    const base = student('b20c-plays');
    live(base, at(2027, 1, 4, 12));
    const reader = reload(base), idle = reload(base);
    const PLAYS_TO_READ = CONTEMPORARY_PLAYS.map((p) => p.id);
    let read = 0;
    for (let d = 0; d < 6; d += 1) {
      for (const s of [reader, idle]) { live(s, at(2027, 1, 5 + d, 13)); tend(s); }
      const r = reader.execute({ kind: 'plays.read', payload: { playId: PLAYS_TO_READ[d % PLAYS_TO_READ.length]! } });
      if (r.ok) read += 1;
      idle.advanceTo(reader.now);
    }
    expect(read).toBe(6);
    const script = (s: Simulation) => s.player.craft!.script;
    const grown = (s: Simulation) => (s.player.development?.history ?? []).filter((h) => h.id === 'script' && h.source.startsWith('read')).length;
    console.log('FIGURES plays read', script(reader), script(idle), grown(reader), grown(idle));
    expect(script(reader)).toBeGreaterThan(script(idle));
    expect(grown(reader)).toBe(6);
    expect(grown(idle)).toBe(0);
    // The Table Work (Text Analysis I, DRAM 163b) reads script analysis at its showing: twins at 30 and 80 (TEST SETUP: the
    // level, set on the day the twins part, the input; six reads moved it about a tenth of a point, under what a showing's
    // figure shows), prepared each evening the same way and shown at its meeting.
    const lo = reload(idle), hi = reload(idle);
    setAbility(lo, 'script', 30); setAbility(hi, 'script', 80);
    const work = (s: Simulation) => workScene(s, ['read', 'write'], 2, true, 'DRAM 163b');
    for (const s of [lo, hi]) live(s, at(2027, 3, 1, 12), { evening: work });
    const shown = (s: Simulation) => courseworkOf(s, s.player)!.assignments.find((a) => a.course === 'DRAM 163b' && a.shown)!;
    const L = shown(lo), H = shown(hi);
    console.log('FIGURES table work by script', L.shown!.score, H.shown!.score);
    expect(H.prep).toEqual(L.prep);
    expect(H.shown!.score).toBeGreaterThan(L.shown!.score);
  });
});

describe('craft.practice: an exercise counts as experience of its material', () => {
  it('six hours of Verse Speaking, one a day, against six of Circles Of Attention: verse met in practice six times, Material You Know names it, and a verse brief\'s breakdown goes further', () => {
    // promise.craft.practice>craft.brief-prepare, promise.craft.practice>craft.identity
    const verse = student('b20c-material'), other = student('b20c-material');
    for (let d = 0; d < 6; d += 1) {
      for (const s of [verse, other]) { rest(s); s.advanceTo(at(2026, 8, 25 + d, 13)); rest(s); }
      run(verse, 'practice.exercise', { exercise: 'verse-speaking' });
      run(other, 'practice.exercise', { exercise: 'concentration' });
    }
    expect(verse.player.experience!.features['language:verse']!.practiced).toBe(6);
    expect(other.player.experience?.features?.['language:verse']?.practiced ?? 0).toBe(0);
    expect(identityOf(verse.player).familiar.map((l) => l.label)).toContain(FEATURE_LABEL['language:verse']);
    expect(identityOf(other.player).familiar.map((l) => l.label)).not.toContain(FEATURE_LABEL['language:verse']);
    // A brief built on verse: its breakdown, the same step at the same instant, goes further for the one who practised it.
    const b = BRIEF_BY_ID['brief-anthology-2']!;
    const step = (s: Simulation) => { rest(s); s.advanceTo(at(2026, 8, 31, 19)); rest(s); run(s, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id }); rest(s); return run<{ moved: number }>(s, 'brief.prepare', { brief: b.id, step: 'read' }).moved; };
    // Verse Speaking also grows what it carries over to (vocal, imagination), which a breakdown reads too: the speed the
    // material gives is held apart, so the step's lead isn't the abilities' alone.
    expect(prepSpeed(verse.player, b)).toBeGreaterThan(prepSpeed(other.player, b));
    const a = step(verse), c = step(other);
    console.log('FIGURES material practised', a, c, prepSpeed(verse.player, b), prepSpeed(other.player, b));
    expect(a).toBeGreaterThan(c);
  });
});

describe('craft.identity: Reliability', () => {
  it('counts the rehearsals with a partner kept, and those missed by you, beside the calls answered', () => {
    // promise.craft.identity>coursework.partners
    const sim = student('b20c-reliability');
    live(sim, at(2026, 9, 1, 12));
    const a = sceneStudy(sim)!;
    const mate = sim.player.school!.classmates[a.partner!]!;
    // TEST SETUP: the partner comes, so the evenings kept are kept by both.
    (mate as unknown as { reliability: number }).reliability = 1;
    for (const [day, sleep] of [[2, false], [3, true], [4, false]] as const) {
      live(sim, at(2026, 9, day, 12));
      tend(sim);
      run(sim, 'school.ask_partner', { assignmentId: a.id, at: at(2026, 9, day, 19) });
      live(sim, at(2026, 9, day, 18, 30));
      // Asleep at seven: the evening missed, by them.
      if (sleep) { tend(sim); run(sim, 'life.sleep', { hours: 2 }); }
      live(sim, at(2026, 9, day, 21));
    }
    const m = mate as unknown as { kept?: number; missedByYou?: number };
    expect([m.kept, m.missedByYou]).toEqual([2, 1]);
    live(sim, at(2026, 12, 20, 12));
    const school = sim.player.school!;
    const line = identityOf(sim.player).reliability!.line;
    const kept = school.classmates.reduce((t, x) => t + ((x as unknown as { kept?: number }).kept ?? 0), 0);
    const missed = school.classmates.reduce((t, x) => t + ((x as unknown as { missedByYou?: number }).missedByYou ?? 0), 0);
    expect(missed).toBeGreaterThanOrEqual(1);
    expect(line).toContain(`; ${kept} rehearsals with a partner kept, ${missed} missed by you.`);
  });
});
