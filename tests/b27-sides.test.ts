/**
 * Brief 27, offers and auditions (2026-10-25): how the sides are played, casting's direction and a self-tape's takes, the
 * owner's Part 9 ("Selecting an approach ... Responding to direction ... Alternate takes") and the supplement's loops 13
 * ("records a take → reviews or retries within available time and rules → selects and submits the take ... More attempts
 * must not create unlimited free progression or guaranteed improvement") and 14 ("→ response to direction where
 * applicable"). Held here: a take recorded is judged on its own and kept; three a day; the one sent is what casting reads,
 * and only it goes on the work record; a save keeps the takes and sends the same figure. The way the sides are played is
 * read by the round, and with the part's genre or against it can win or lose a callback; at an audition in person casting
 * gives a direction from what the part asks, the clock stops for the answer, and following it or keeping your choice can
 * win or lose it too. No choice made, no direction, as before.
 *
 * PLAYER JOURNEYS: a graduate played by the clock and the commands a player sends (tests/fakes/career-world.ts); TEST
 * SETUP, said where it's done: the actor's levels (`setSkill`, the input a twin changes), and the round on the record as
 * casting's answer would set it, its item on the clock. Every draw is the game's own, read, never forced.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR, addDays, instantFromZoned, zonedParts } from '@/engine/core/time';
import type { ProjectTemplate } from '@/engine/content/careerwork';
import { AXES, APPROACH_EFFECT } from '@/engine/content/approaches';
import type { Axis, AxisValue } from '@/engine/content/material';
import { keepProject, productionsOf } from '@/engine/systems/slate';
import type { Opportunity } from '@/engine/systems/pro';
import { bandOfQuality } from '@/engine/systems/evaluation';
import { AUDITION_KIND, TAPE_DUE_KIND, chanceOf, fitOf, travels, tripMinutes, writtenFor } from '@/engine/systems/projobs';
import { NOTE_KIND, TAKES, noteFor, sceneOfPart } from '@/engine/systems/offers';
import { axisSuitability } from '@/engine/systems/interpretation';
import { answerStop, stopChoices, type Stop } from '@/engine/world/clock';
import { graduate, played, prepareAll, reload, tend } from './fakes/career-world';
import { setSkill } from './fakes/b20-career';

const WEEK = 7 * MS_DAY;
const NY = 'America/New_York';
type Sim = ReturnType<typeof graduate>;

/** A weekday at an hour, from some days on. */
function weekdayAt(sim: Sim, days: number, hour: number): number {
  let d = addDays(sim.now, days, NY);
  while ([0, 6].includes(zonedParts(d, NY).weekday)) d = addDays(d, 1, NY);
  const p = zonedParts(d, NY);
  return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour, minute: 0 }, NY);
}

/** TEST SETUP: the audition on the record as casting's answer sets one (`setRound`), its item on the clock. */
function atRound(sim: Sim, t: ProjectTemplate, week: number): Opportunity {
  keepProject(sim.player, t);
  const form = t.stages.audition;
  const at = form === 'self-tape' ? weekdayAt(sim, 3, 18) : weekdayAt(sim, 2, 11);
  const o: Opportunity = { id: `test-${t.id}`, projectId: t.id, via: 'open', status: 'audition', postedAt: week, submitBy: week + WEEK, history: [], counts: {}, rounds: [{ round: 'audition', form, at, status: 'set' }] };
  sim.player.pro!.opportunities.push(o);
  if (form === 'in-person') {
    sim.schedule({ at, kind: AUDITION_KIND, label: `Audition: ${t.role.part}, ${t.project}`, category: 'career', priority: 40, requiresPlayer: true, durationMinutes: 30, travelMinutes: tripMinutes(sim.player.currentLocationId, t.place.cityId), locationId: t.place.cityId, refType: 'pro.opportunity', refId: o.id, payload: { personId: sim.player.id, opportunityId: o.id, round: 0 } });
  } else {
    sim.schedule({ at, kind: TAPE_DUE_KIND, label: `Self-Tape Due: ${t.role.part}, ${t.project}`, category: 'career', priority: 40, refType: 'pro.opportunity', refId: o.id, payload: { personId: sim.player.id, opportunityId: o.id, round: 0 } });
  }
  return o;
}

/** Slate parts near New Haven written for the actor, of an audition's form, with a callback and a genre that leans some way. */
function* parts(sim: Sim, form: 'self-tape' | 'in-person'): Generator<{ t: ProjectTemplate; week: number }> {
  for (let w = 1; w < 120; w += 1) {
    const week = sim.now + w * WEEK;
    for (const p of productionsOf(sim, week)) for (const t of p.parts) {
      if (t.stages.audition !== form || !t.stages.callback || travels(sim.player, t) || !writtenFor(t, sim.player) || !sceneOfPart(t).concerns) continue;
      yield { t, week };
    }
  }
}

/** The aspect a part's genre leans on most, and the side it favors there. */
function leaning(t: ProjectTemplate): { axis: Axis; side: AxisValue; other: AxisValue } {
  const best = (Object.keys(AXES) as Axis[]).map((axis) => { const [a, b] = axisSuitability(axis, undefined, sceneOfPart(t)); return { axis, a, b, gap: Math.abs(a.s - b.s) }; }).sort((x, y) => y.gap - x.gap)[0]!;
  const side = best.a.s >= best.b.s ? best.a.side : best.b.side;
  return { axis: best.axis, side, other: AXES[best.axis].values.find((v) => v !== side)! };
}

const opp = (sim: Sim, id: string): Opportunity => sim.player.pro!.opportunities.find((o) => o.id === id)!;
const record = (sim: Sim, o: Opportunity) => sim.must<{ take: number; band: string; overall: number }>({ kind: 'pro.record_take', payload: { opportunityId: o.id } });

/** Played to the stop at casting's direction, every other stop answered with Go. TEST SETUP: tended as it moves. */
function toDirection(sim: Sim, until: number): Stop | undefined {
  while (sim.now < until) {
    tend(sim);
    const wanted = Math.min(until, sim.now + 6 * MS_HOUR);
    let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
    for (let n = 0; r.interruptedBy && n < 50; n += 1) {
      if (r.interruptedBy.kind === NOTE_KIND) return { item: r.interruptedBy, wanted, sentFrom: r.sentFrom };
      tend(sim);
      r = answerStop(sim, { item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, 'go').result!;
    }
  }
  return undefined;
}

describe('a self-tape’s takes', () => {
  it('PLAYER JOURNEY: takes recorded and kept, three a day; the take sent is what casting reads and the only one on the work record; the twin who sends another take is read at its figure; a save sends the same', () => {
    const sim = graduate('b27-takes');
    const { t, week } = parts(sim, 'self-tape').next().value!;
    played(sim, week);
    const o = atRound(sim, t, week);
    prepareAll(sim, { opportunityId: o.id });
    const takes = [record(sim, o), record(sim, o), record(sim, o)];
    expect(takes.map((x) => x.take)).toEqual([0, 1, 2]);
    // Each is judged on its own draw, the first's the round's own as Tape It's always was: not all the same figure.
    expect(new Set(takes.map((x) => x.overall)).size).toBeGreaterThan(1);
    expect(o.rounds![0]!.takes!.map((x) => x.key)).toEqual([`pro:${sim.player.id}:${o.id}:0`, `pro:${sim.player.id}:${o.id}:0:take2`, `pro:${sim.player.id}:${o.id}:0:take3`]);
    // Three a day.
    expect(sim.execute({ kind: 'pro.record_take', payload: { opportunityId: o.id } }).error).toBe(`You’ve recorded three takes today, as many as a day allows. Record more tomorrow, or send one.`);
    expect(TAKES.perDay).toBe(3);
    expect(sim.execute({ kind: 'pro.send_take', payload: { opportunityId: o.id, take: 7 } }).error).toBe('There’s no such take.');
    // Nothing goes to casting, or on the work record, until one is sent.
    const what = `${t.role.part}, ${t.project}: Audition, Taped`;
    expect((sim.player.work ?? []).filter((w) => w.what === what)).toEqual([]);
    const best = takes.reduce((b, x) => (x.overall > b.overall ? x : b));
    const worst = takes.reduce((b, x) => (x.overall < b.overall ? x : b));
    const twin = reload(sim);
    const again = reload(sim);
    const sent = sim.must<{ band: string; overall: number }>({ kind: 'pro.send_take', payload: { opportunityId: o.id, take: best.take } });
    const r = o.rounds![0]!;
    expect([sent.overall, r.overall, r.band, r.sent, r.status]).toEqual([best.overall, best.overall, bandOfQuality(best.overall), best.take, 'done']);
    expect((sim.player.work ?? []).filter((w) => w.what === what).map((w) => w.overall)).toEqual([best.overall]);
    // What each take was judged from goes once one is sent.
    expect(r.takes!.every((x) => x.kept === undefined)).toBe(true);
    // The falsifiability twin: the same save sending its worst take is read at that take's figure, not the best's.
    twin.must({ kind: 'pro.send_take', payload: { opportunityId: o.id, take: worst.take } });
    expect(opp(twin, o.id).rounds![0]!.overall).toBe(worst.overall);
    expect(worst.overall).toBeLessThan(best.overall);
    // Saved with its takes, the same take sends the same figure, though the actor sending it is worn out by then: a take is
    // judged as it was recorded, not again as they are now. TEST SETUP: exhausted, short of sleep, at the moment of sending.
    Object.assign(again.player.wellbeing, { energy: 3, sleepDebt: 30, stress: 90 });
    again.must({ kind: 'pro.send_take', payload: { opportunityId: o.id, take: best.take } });
    expect(opp(again, o.id).rounds![0]!.overall).toBe(best.overall);
    // Casting reads the take sent: its chance from that band.
    played(sim, r.at + 2 * MS_DAY);
    played(twin, r.at + 2 * MS_DAY);
    const fit = fitOf(sim.player, t).fit;
    expect(r.casting!.chance).toBe(chanceOf(r.band!, fit, t.kind, 'callback'));
    expect(opp(twin, o.id).rounds![0]!.casting!.chance).toBe(chanceOf(bandOfQuality(worst.overall), fit, t.kind, 'callback'));
  }, 240_000);

  it('PLAYER JOURNEY: takes recorded on one day and the next, and none sent by the due time: casting moves on, and the history says why', () => {
    const sim = graduate('b27-takes-unsent');
    const { t, week } = parts(sim, 'self-tape').next().value!;
    played(sim, week);
    const o = atRound(sim, t, week);
    record(sim, o);
    played(sim, sim.now + MS_DAY);
    record(sim, o);
    played(sim, o.rounds![0]!.at + MS_HOUR);
    expect([o.status, o.rounds![0]!.status]).toEqual(['lapsed', 'missed']);
    expect(o.history.some((h) => h.words === `You recorded two takes for ${t.role.part} and sent none of them.`)).toBe(true);
    expect((sim.player.work ?? []).filter((w) => w.what.startsWith(`${t.role.part}, ${t.project}`))).toEqual([]);
  }, 240_000);
});

describe('how you play the sides', () => {
  it('PLAYER JOURNEY: played with the part’s genre or against it, the same take comes to a different figure, and that can win or lose the callback', () => {
    const base = graduate('b27-approach');
    let shown: { win: Opportunity; lose: Opportunity } | undefined;
    let moved = 0;
    let tried = 0;
    for (const { t, week } of parts(base, 'self-tape')) {
      if (tried++ > 8 || shown) break;
      const lean = leaning(t);
      const at = reload(base);
      played(at, week);
      const u = at.rng('pro.casting', t.id, week, 'callback').next();
      const fit = fitOf(at.player, t).fit;
      for (let level = 40; level <= 84 && !shown; level += 1) {
        const run = (side: AxisValue) => {
          const sim = reload(at);
          // TEST SETUP: the actor's levels, the input; the sides prepared and the way of playing them rehearsed in full, as
          // Prepare's steps would leave them, the way chosen through its own command.
          setSkill(sim, level);
          const o = atRound(sim, t, week);
          sim.must({ kind: 'pro.choose_approach', payload: { opportunityId: o.id, [lean.axis]: side } });
          o.prep = { interpretation: 1, memorization: 1, rehearsal: 1 };
          o.playing!.prep = 1;
          return { sim, o, take: record(sim, o) };
        };
        const withIt = run(lean.side);
        const against = run(lean.other);
        if (withIt.take.overall > against.take.overall) moved += 1;
        const bandHi = bandOfQuality(withIt.take.overall);
        const bandLo = bandOfQuality(against.take.overall);
        if (bandHi === bandLo || !(u < chanceOf(bandHi, fit, t.kind, 'callback') && u >= chanceOf(bandLo, fit, t.kind, 'callback'))) continue;
        for (const x of [withIt, against]) {
          x.sim.must({ kind: 'pro.send_take', payload: { opportunityId: x.o.id, take: 0 } });
          played(x.sim, x.o.rounds![0]!.at + 2 * MS_DAY);
        }
        shown = { win: withIt.o, lose: against.o };
      }
    }
    // Played with what the part's genre favors, the take comes out higher than played against it, level for level.
    expect(moved).toBeGreaterThan(0);
    // And with the draw where it falls, it wins the callback for one actor and loses it for the twin.
    expect(shown).toBeDefined();
    expect([shown!.win.status, shown!.win.rounds!.length, shown!.win.rounds![0]!.casting!.yes]).toEqual(['callback', 2, true]);
    expect([shown!.lose.status, shown!.lose.rounds![0]!.casting!.yes]).toEqual(['passed', false]);
  }, 300_000);
});

describe('casting’s direction in the room', () => {
  it('PLAYER JOURNEY: played against what the part asks, casting gives a direction ten minutes in; the clock stops with Follow The Direction and Keep Your Choice; each answer judges the rest, and can win or lose the callback', () => {
    const base = graduate('b27-direction');
    let shown: { follow: Opportunity; hold: Opportunity } | undefined;
    let seen: { stop: Stop; o: Opportunity; t: ProjectTemplate; sim: Sim } | undefined;
    let tried = 0;
    for (const { t, week } of parts(base, 'in-person')) {
      if (tried > 8 || shown) break;
      const lean = leaning(t);
      if (!noteFor(t, { [lean.axis]: lean.other, chosenAt: 0, prep: 0 })) continue;
      tried += 1;
      const at = reload(base);
      played(at, week);
      const u = at.rng('pro.casting', t.id, week, 'callback').next();
      const fit = fitOf(at.player, t).fit;
      for (let level = 40; level <= 84 && !shown; level += 1) {
        const run = (follow: boolean) => {
          const sim = reload(at);
          // TEST SETUP: the actor's levels, the input; the sides prepared and the way of playing them rehearsed in full, as
          // Prepare's steps would leave them, the way chosen through its own command: against what the part asks.
          setSkill(sim, level);
          const o = atRound(sim, t, week);
          sim.must({ kind: 'pro.choose_approach', payload: { opportunityId: o.id, [lean.axis]: lean.other } });
          o.prep = { interpretation: 1, memorization: 1, rehearsal: 1 };
          o.playing!.prep = 1;
          const stop = toDirection(sim, o.rounds![0]!.at + MS_HOUR)!;
          seen ??= { stop, o, t, sim };
          const choice = stopChoices(NOTE_KIND).find((c) => c.label === (follow ? 'Follow The Direction' : 'Keep Your Choice'))!;
          expect(answerStop(sim, stop, choice).refused).toBeUndefined();
          return { sim, o };
        };
        const f = run(true);
        const h = run(false);
        const rf = f.o.rounds![0]!;
        const rh = h.o.rounds![0]!;
        expect([rf.status, rh.status, rf.note!.answer, rh.note!.answer]).toEqual(['done', 'done', 'follow', 'hold']);
        // Followed, the side asked for is how it's played from then, its rehearsal halved; kept, the read is held back where
        // the side asked for leans (the round's judgment, as the work record keeps it).
        expect([f.o.playing![lean.axis], f.o.playing!.prep, h.o.playing![lean.axis], h.o.playing!.prep]).toEqual([lean.side, 0.5, lean.other, 1]);
        const judged = (x: { sim: Sim }) => (x.sim.player.work ?? []).find((w) => w.what === `${t.role.part}, ${t.project}: Audition`)!;
        expect(Object.values(judged(h).inputs.fit ?? {}).some((x) => x.label.includes('casting asked for it'))).toBe(true);
        expect(Object.values(judged(f).inputs.fit ?? {}).some((x) => x.label.includes('casting asked for it'))).toBe(false);
        expect(judged(f).inputs.inputs?.responsiveness?.some((x) => x.ability === 'adaptability')).toBe(true);
        if (rf.band === rh.band) continue;
        const [win, lose] = rf.overall! > rh.overall! ? [f, h] : [h, f];
        if (!(u < chanceOf(win.o.rounds![0]!.band!, fit, t.kind, 'callback') && u >= chanceOf(lose.o.rounds![0]!.band!, fit, t.kind, 'callback'))) continue;
        played(win.sim, win.o.rounds![0]!.at + 2 * MS_DAY);
        played(lose.sim, lose.o.rounds![0]!.at + 2 * MS_DAY);
        shown = { follow: f.o, hold: h.o };
      }
    }
    // The stop: its item is the direction's, ten minutes into the audition, with the two answers beside Go.
    expect(seen).toBeDefined();
    const { stop, o, t } = seen!;
    expect(stop.item.at).toBe(o.rounds![0]!.at + 10 * 60_000);
    expect(stopChoices(NOTE_KIND).map((c) => c.label)).toEqual(['Follow The Direction', 'Keep Your Choice']);
    expect(o.history.find((h) => h.key === 'audition:note')!.words).toMatch(new RegExp(`^Partway through your audition for ${t.role.part}, .* asked you to play it (${Object.values(APPROACH_EFFECT).map((e) => e.label.toLowerCase()).join('|')}): `));
    // Its decision in What Needs You, with the two answers, settled once answered.
    const q = Object.values(seen!.sim.universe.decisions).find((d) => d.refType === 'pro.note' && d.refId === o.id)!;
    expect([q.actions.map((a) => a.label), q.resolvedAt !== undefined]).toEqual([['Follow The Direction', 'Keep Your Choice'], true]);
    // Either answer can win the callback where the other loses it, by what the actor is and what was asked.
    expect(shown).toBeDefined();
    const statuses = [shown!.follow.status, shown!.hold.status].sort();
    expect(statuses).toEqual(['callback', 'passed']);
  }, 300_000);

  it('PLAYER JOURNEY: no direction without a way of playing chosen, or where the choice is already what the part asks: judged at the audition itself, as before', () => {
    const sim = graduate('b27-direction-none');
    let found: { t: ProjectTemplate; week: number } | undefined;
    for (const x of parts(sim, 'in-person')) if (noteFor(x.t, { [leaning(x.t).axis]: leaning(x.t).other, chosenAt: 0, prep: 0 })) { found = x; break; }
    const { t, week } = found!;
    played(sim, week);
    const twin = reload(sim);
    const plain = atRound(sim, t, week);
    played(sim, plain.rounds![0]!.at + MS_HOUR);
    expect([plain.rounds![0]!.status, plain.rounds![0]!.note]).toEqual(['done', undefined]);
    // Played every way the part leans already: no direction.
    const lean = leaning(t);
    const sides: Record<string, string> = {};
    for (const axis of Object.keys(AXES) as Axis[]) {
      const [a, b] = axisSuitability(axis, undefined, sceneOfPart(t));
      sides[axis] = a.s >= b.s ? a.side : b.side;
    }
    expect(sides[lean.axis]).toBe(lean.side);
    const o = atRound(twin, t, week);
    twin.must({ kind: 'pro.choose_approach', payload: { opportunityId: o.id, ...sides } });
    expect(noteFor(t, { ...sides, chosenAt: 0, prep: 0 })).toBeUndefined();
    played(twin, o.rounds![0]!.at + MS_HOUR);
    expect([o.rounds![0]!.status, o.rounds![0]!.note]).toEqual(['done', undefined]);
  }, 240_000);

  it('refuses each control where it can’t be used, in its own words', () => {
    const sim = graduate('b27-sides-refusals');
    const { t, week } = parts(sim, 'self-tape').next().value!;
    played(sim, week);
    keepProject(sim.player, t);
    const o: Opportunity = { id: 'test-open', projectId: t.id, via: 'open', status: 'submitted', postedAt: week, submitBy: week + WEEK, history: [], counts: {} };
    sim.player.pro!.opportunities.push(o);
    expect(sim.execute({ kind: 'pro.choose_approach', payload: { opportunityId: o.id, pace: 'driven' } }).error).toBe('There are no sides yet: casting sends them with an audition.');
    expect(sim.execute({ kind: 'pro.answer_note', payload: { opportunityId: o.id, follow: true } }).error).toBe('Casting has no direction waiting for you.');
    expect(sim.execute({ kind: 'pro.record_take', payload: { opportunityId: o.id } }).error).toBe('There’s no self-tape asked for.');
    expect(sim.execute({ kind: 'pro.send_take', payload: { opportunityId: o.id, take: 0 } }).error).toBe('There’s no self-tape asked for.');
    const a = atRound(sim, t, week);
    expect(sim.execute({ kind: 'pro.send_take', payload: { opportunityId: a.id, take: 0 } }).error).toBe('You haven’t recorded a take yet: press Record A Take first.');
    // Chosen, the way of playing is kept through a save.
    sim.must({ kind: 'pro.choose_approach', payload: { opportunityId: a.id, pace: 'driven' } });
    expect(opp(reload(sim), a.id).playing).toMatchObject({ pace: 'driven', prep: 0 });
    // Rehearsal on your feet rehearses it, and still can once the sides' own rehearsal is complete. TEST SETUP: the sides'
    // lines learned and their rehearsal complete, as Prepare's steps would leave them.
    a.prep = { interpretation: 0.5, memorization: 0.9, rehearsal: 1 };
    sim.must({ kind: 'pro.prepare', payload: { opportunityId: a.id, step: 'rehearse' } });
    expect(a.playing!.prep).toBeGreaterThan(0);
    // TEST SETUP: the way of playing rehearsed in full too: then there's nothing left for the step to do.
    a.playing!.prep = 0.98;
    played(sim, sim.now + 2 * MS_HOUR);
    expect(sim.execute({ kind: 'pro.prepare', payload: { opportunityId: a.id, step: 'rehearse' } }).error).toBe('You’ve done all this step can do.');
  }, 240_000);
});
