/**
 * Brief 19's D6, which is brief 18's U1 done for the career's sake (2026-10-20): an understudy at Yale Rep covers a part
 * the play names, the biggest written for them, and that part runs through everything the understudy meets. Until then a
 * play with no lead written for them (An Enemy Of The People for an actress, Mrs Warren's Profession for an actor) cast
 * them as “An Understudy In The Company”: the notices named no part, each night was judged as the play's lead, and the
 * credit the résumé reads (`school.credits`) carried no part.
 *
 * - The part: the biggest a Rep play writes for them or for either (`coveredPart`), which every Rep play has for an actor
 *   and for an actress; its size is the play's (`partSizeOf`), a lead's for The Seagull's Nina and Konstantin.
 * - PLAYER JOURNEY, on seed us-86, an actress played by `tools/policy.ts` as `tools/scenarios.ts`'s `understudy` plays
 *   her: cast as Petra Stockmann's understudy in the second-year fall, told why the part is a supporting one, her nights
 *   on call named for it on the calendar and the Casting tab saying its size; preparing it, A Night Now forecast as it;
 *   called on Saturday 2 October 2027 and going on as her, judged at the Rep's supporting difficulty and kept on stage a
 *   supporting part's hours; the run's record, the run-through, the director's note and the milestone hers; and the credit
 *   the next casting files, Petra Stockmann, gone on once.
 * - A save from before: one whose run hadn't been judged is given the part once on opening, told once, and plays on as
 *   it; one already judged, or closed, keeps the company's cover it was judged as.
 * - A night on call booked before 2026-09-28, at the curtain, costs the covered part's evening.
 *
 * TEST SETUP, said where it's done: a save from before made from the journey's, its casting and calls as a build before
 * this one wrote them; the night booked before 2026-09-28.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { CALL_KIND, NIGHT_DIFFICULTY, coveredPart, nameTheCover, nightEvaluation, partSizeOf, stageHours } from '@/engine/systems/school';
import { workPiece } from '@/engine/systems/workpieces';
import { energyOfNight } from '@/engine/systems/workload';
import { REP_PLAYS, type PartSize } from '@/engine/content/plays';
import { BODY } from '@/engine/content/body';
import { WORKLOAD } from '@/engine/content/workload';
import { attentiveHour, life } from '../tools/policy';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, tab: 'casting' }));
// The School screen's kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/school' ? h.tab : initial) as T, () => undefined] as const };
});
// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({ get sim() { return h.sim; }, version: 0, run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }), toast: noop } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');
/** A screen as the player has it, its tags taken out. */
const drawn = (sim: Simulation, screen: FunctionComponent, tab: string) => { h.sim = sim; h.tab = tab; return renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); };

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
/** Played as the policy plays a careful student, an hour at a time, through public commands only. */
const played = (sim: Simulation, until: number) => { while (sim.now < until) attentiveHour(sim); };
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const repCalls = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.which === 'rep' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const ENEMY = 'An Enemy Of The People';
const SLOT = 'Yale Rep’s October Production';
/** Saturday 2 October 2027, the curtain the night's check at five sends her on for (seed us-86). */
const CURTAIN = at(2027, 10, 2, 20);

/** The life, played once to the morning after the second-year fall's casting, and kept as a save each test opens. */
let kept: string | undefined;
const atCasting = (): Simulation => {
  if (!kept) {
    const sim = life('us-86', { homeRegionId: 'us-ny-newyork', pronouns: 'she/her' });
    played(sim, at(2027, 8, 24, 9));
    kept = serialise(sim.universe);
  }
  return loadSave(deserialise(kept) as never);
};

/** TEST SETUP: the casting and its calls as a build before 2026-10-20 wrote them, and the save not yet opened by this one. */
const asBefore = (sim: Simulation, more: Record<string, unknown> = {}) => {
  Object.assign(sim.player.school!.rep!, { role: 'An Understudy In The Company' }, more);
  for (const i of repCalls(sim)) if (i.payload.call === 'oncall') i.label = `${SLOT}: On Call`;
  sim.universe.opened = (sim.universe.opened ?? []).filter((x) => x !== 'nameTheCover');
  return reload(sim);
};

describe('the part an understudy covers', () => {
  it('is the biggest part a Rep play writes for them: a lead where it has one, else a supporting part; every Rep play has one for an actor and an actress', () => {
    for (const play of REP_PLAYS) for (const title of ['actor', 'actress'] as const) {
      const part = coveredPart(play, title);
      expect(part, `${play.title} for an ${title}`).toBeDefined();
      expect(['either', title]).toContain(part!.for);
      // None bigger is written for them.
      const bigger: Record<PartSize, PartSize[]> = { lead: [], supporting: ['lead'], featured: ['lead', 'supporting'] };
      expect(play.parts.filter((p) => bigger[part!.size].includes(p.size) && (p.for === title || p.for === 'either'))).toEqual([]);
    }
    const enemy = REP_PLAYS.find((p) => p.title === ENEMY)!;
    const warren = REP_PLAYS.find((p) => p.title === 'Mrs Warren’s Profession')!;
    expect(coveredPart(enemy, 'actress')).toMatchObject({ name: 'Petra Stockmann', size: 'supporting' });
    expect(coveredPart(enemy, 'actor')).toMatchObject({ name: 'Doctor Thomas Stockmann', size: 'lead' });
    expect(coveredPart(warren, 'actor')).toMatchObject({ name: 'Frank Gardner', size: 'supporting' });
    expect(coveredPart(warren, 'actress')).toMatchObject({ name: 'Vivie Warren', size: 'lead' });
  });

  it('is judged at its size in the play: a covered supporting part as one, a lead and The Seagull’s Nina as leads, and a size kept on the casting first', () => {
    expect(partSizeOf({ kind: 'understudy', play: ENEMY, role: 'Petra Stockmann' })).toBe('supporting');
    expect(partSizeOf({ kind: 'understudy', play: 'Mrs Warren’s Profession', role: 'Frank Gardner' })).toBe('supporting');
    expect(partSizeOf({ kind: 'understudy', play: 'Tartuffe', role: 'Elmire' })).toBe('lead');
    expect(partSizeOf({ kind: 'understudy', role: 'Nina' })).toBe('lead');
    // The company's unnamed cover of a save from before, judged as a lead as it was.
    expect(partSizeOf({ kind: 'understudy', play: ENEMY, role: 'An Understudy In The Company' })).toBe('lead');
    expect(partSizeOf({ kind: 'role', play: ENEMY, role: 'Petra Stockmann', size: 'featured' })).toBe('featured');
    expect(partSizeOf({ kind: 'thesis', play: 'Woyzeck', role: 'Marie' })).toBe('lead');
  });
});

describe('PLAYER JOURNEY: an actress understudying An Enemy Of The People, seed us-86', () => {
  it('is cast as Petra Stockmann’s understudy, prepares the part, is called and goes on as her, and is credited with her', () => {
    const sim = atCasting();
    const school = sim.player.school!;
    const r = school.rep!;
    // The casting record: the named part, from the play's cast, and its size there.
    expect(r).toMatchObject({ kind: 'understudy', production: SLOT, play: ENEMY, role: 'Petra Stockmann', term: 2, performed: 0 });
    expect(partSizeOf(r)).toBe('supporting');
    const cast = sim.universe.notifications.find((n) => n.title.startsWith('Cast: ') && n.body.includes(ENEMY))!;
    expect(cast.body).toContain('You’ll also understudy Petra Stockmann in Yale Rep’s An Enemy Of The People: be in New Haven and reachable at every performance. Its leads are written for actors, so the part you cover is a supporting one.');
    // The calls on the calendar: every night on call names the part (fourteen: the run's twenty performances less the six
    // evenings her own Hedda Gabler plays, 9 to 16 October).
    const onCall = repCalls(sim).filter((i) => i.payload.call === 'oncall');
    expect(onCall).toHaveLength(14);
    expect([...new Set(onCall.map((i) => i.label))]).toEqual([`${SLOT}: On Call For Petra Stockmann`]);
    // The Casting tab: the part, as an understudy's, and its size.
    const tab = drawn(sim, SchoolWorkspace, 'casting');
    expect(tab).toContain('Role Petra Stockmann (Understudy) A Supporting Part');

    // Preparing it: the policy learns the part, and A Night Now is the covered part's, at its size and difficulty.
    played(sim, at(2027, 9, 4, 9));
    const proc = (r as typeof r & { process: { calls: number; lines: number } }).process;
    expect(proc.calls).toBeGreaterThanOrEqual(3);
    expect(proc.lines).toBeGreaterThan(0.3);
    const piece = workPiece(sim, sim.player, 'part:rep')!;
    const forecast = piece.forecast();
    expect(forecast.inputs.difficulty).toBe(NIGHT_DIFFICULTY.rep.supporting);
    expect(forecast.inputs.piece?.night).toMatchObject({ size: 'supporting', share: WORKLOAD.share.supporting });
    // And the piece the workbook tries ways on is the same part's evening.
    expect(piece.spec().night).toMatchObject({ size: 'supporting', share: WORKLOAD.share.supporting });

    // Called: at five, the night's check sends her on, and the curtain goes on the calendar as Petra Stockmann.
    played(sim, CURTAIN - 3 * 60 * 60_000 + 60_000);
    const told = titled(sim, 'You’re On Tonight As Petra Stockmann');
    expect(told.map((n) => n.body)).toEqual(['Petra Stockmann’s actor is out, so you go on in Yale Rep’s An Enemy Of The People tonight at 8:00 PM.']);
    const curtain = repCalls(sim).find((i) => i.payload.wentOn === true)!;
    expect([curtain.at, curtain.label]).toEqual([CURTAIN, `${SLOT}: You’re On As Petra Stockmann`]);

    // Going on: judged as Petra Stockmann, a supporting part at the Rep, and on stage for a supporting part's hours.
    played(sim, CURTAIN - 60 * 60_000);
    sim.advanceTo(CURTAIN - 60_000);
    const extra = sim.player.body!.extra;
    const weight = sim.player.body!.weightKg;
    sim.advanceTo(CURTAIN + 60_000);
    expect(r.performed).toBe(1);
    const night = sim.player.work!.find((w) => w.inputs.key === `night:${sim.player.id}:${SLOT}-${CURTAIN}`)!;
    expect(night).toMatchObject({ what: ENEMY, task: 'performance' });
    expect(night.inputs.difficulty).toBe(NIGHT_DIFFICULTY.rep.supporting);
    expect(night.inputs.piece?.night).toMatchObject({ size: 'supporting', share: WORKLOAD.share.supporting });
    expect(sim.player.body!.extra - extra).toBeCloseTo((BODY.met.acting - BODY.sedentary) * weight * stageHours(r, 'supporting'), 6);
    expect(stageHours(r, 'supporting')).toBeLessThan(stageHours(r, 'lead'));
    expect(titled(sim, 'You Went On As Petra Stockmann').map((n) => n.body)).toEqual(['Petra Stockmann’s actor was out, and you played the part in Yale Rep’s An Enemy Of The People tonight.']);
    // The run's record is hers.
    expect(school.runs!.find((x) => x.source === 'rep' && x.production === SLOT)).toMatchObject({ role: 'Petra Stockmann', play: ENEMY, nights: 1 });

    // The run-through, the director's note and the milestone.
    played(sim, at(2027, 10, 12, 9));
    expect(titled(sim, 'Your Understudy Run-Through').at(-1)!.body).toMatch(/^You played Petra Stockmann through for the director today, and it was /);
    played(sim, at(2027, 10, 25, 9));
    expect(titled(sim, `The Director’s Note: ${ENEMY}`)).toHaveLength(1);
    expect(r.note).toBe(titled(sim, `The Director’s Note: ${ENEMY}`)[0]!.body);
    expect(sim.player.journey!.milestones.find((m) => m.kind === 'run' && m.what.endsWith(ENEMY))?.what).toBe(`Petra Stockmann, ${ENEMY}`);
    // No word of the company's unnamed cover anywhere she reads.
    expect(sim.universe.notifications.filter((n) => /At Yale Rep|An actor you cover|cover the company|understudies’ run-through|understudy in Yale Rep/.test(`${n.title} ${n.body}`))).toEqual([]);

    // The credit the next casting files: the part, gone on once.
    played(sim, at(2028, 1, 5, 9));
    expect(school.credits).toContainEqual({ production: SLOT, role: 'Petra Stockmann', kind: 'understudy', year: 2027, wentOn: 1 });
  }, 900_000);
});

describe('a save from before, with a Rep understudy covering no named part', () => {
  it('is given the part once on opening where none of the run was judged, told so once, and plays on as it', () => {
    const before = atCasting();
    const sim = asBefore(before);
    const r = sim.player.school!.rep!;
    expect(r.role).toBe('Petra Stockmann');
    expect(sim.universe.opened).toContain('nameTheCover');
    const told = titled(sim, 'Your Understudy Part: Petra Stockmann');
    expect(told.map((n) => n.body)).toEqual(['You understudy Petra Stockmann in Yale Rep’s An Enemy Of The People. Its leads are written for actors, so the part you cover is a supporting one. Your calls are on your calendar as before.']);
    expect([...new Set(repCalls(sim).filter((i) => i.payload.call === 'oncall').map((i) => i.label))]).toEqual([`${SLOT}: On Call For Petra Stockmann`]);
    // The mark itself, as the opening calls it: one casting given a part, and none the second time.
    const direct = atCasting();
    Object.assign(direct.player.school!.rep!, { role: 'An Understudy In The Company' });
    expect(nameTheCover(direct)).toBe(1);
    expect(nameTheCover(direct)).toBe(0);
    // Opened again: nothing more.
    const again = reload(sim);
    expect(titled(again, 'Your Understudy Part: Petra Stockmann')).toHaveLength(1);
    expect(nameTheCover(again)).toBe(0);
    // And it plays on as the part: sent on as her, judged as her.
    played(again, CURTAIN + 60_000);
    expect(titled(again, 'You’re On Tonight As Petra Stockmann')).toHaveLength(1);
    const night = again.player.work!.find((w) => w.inputs.key === `night:${again.player.id}:${SLOT}-${CURTAIN}`)!;
    expect(night.inputs.difficulty).toBe(NIGHT_DIFFICULTY.rep.supporting);
  }, 900_000);

  it('keeps the company’s cover where a night of the run was already judged, or the run has closed, as its nights were judged', () => {
    for (const judged of [{ performed: 1, nights: { solid: 1 } }, { nights: { off: 1 } }, { closed: at(2027, 10, 23, 22) }]) {
      const sim = asBefore(atCasting(), judged);
      const r = sim.player.school!.rep!;
      expect(r.role, JSON.stringify(judged)).toBe('An Understudy In The Company');
      expect(sim.universe.notifications.filter((n) => n.title.startsWith('Your Understudy Part'))).toEqual([]);
      expect(partSizeOf(r)).toBe('lead');
      expect([...new Set(repCalls(sim).filter((i) => i.payload.call === 'oncall').map((i) => i.label))]).toEqual([`${SLOT}: On Call`]);
      expect(sim.universe.opened).toContain('nameTheCover');
    }
  }, 900_000);
});

describe('a night on call booked before 2026-09-28, at the curtain itself', () => {
  it('costs the evening of the part it covers when sent on', () => {
    const sim = atCasting();
    const r = sim.player.school!.rep!;
    // TEST SETUP: the night's check at five called off, and the night booked as a build before 2026-09-28 booked it.
    for (const i of repCalls(sim)) if (i.payload.call === 'oncall' && i.payload.perfAt === CURTAIN) i.status = 'cancelled';
    sim.schedule({ at: CURTAIN, kind: CALL_KIND, label: `${SLOT}: On Call`, category: 'school', priority: 32, requiresPlayer: false, payload: { personId: sim.player.id, call: 'oncall', which: 'rep' } });
    played(sim, CURTAIN - 60 * 60_000);
    sim.advanceTo(CURTAIN - 60_000);
    const covered = energyOfNight(nightEvaluation(sim, sim.player, `oncall-${CURTAIN}`, r, CURTAIN, 'supporting', 'rep', true));
    const lead = energyOfNight(nightEvaluation(sim, sim.player, `oncall-${CURTAIN}`, r, CURTAIN, 'lead', 'rep', true));
    expect(lead - covered).toBeGreaterThan(2);
    const energy = sim.player.wellbeing.energy;
    sim.advanceTo(CURTAIN + 60_000);
    expect(r.performed).toBe(1);
    expect(energy - sim.player.wellbeing.energy).toBeCloseTo(covered, 0);
  }, 900_000);
});
