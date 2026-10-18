/**
 * Classmates who ask (`partnerAsks` in `systems/coursework.ts`, from
 * 2026-10-07): in class a partner may ask for an evening they're free; yes
 * books it as an asked rehearsal is booked, no costs nothing, no answer by
 * the time costs a little trust; the work waits for the answer, as it waits
 * for feedback read; and after a rehearsal kept, the partner says what held
 * the scene back, from the preparation as it stands.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { ASK_KIND, PARTNER_KIND, WORK, courseworkOf, mateRecord, peerNote, questionsFor, trustOf, type Assignment, type PartnerAsk } from '@/engine/systems/coursework';

const zone = 'America/New_York';
const at = (month: number, day: number, hour = 9) => instantFromZoned({ year: 2026, month, day, hour }, zone);
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const open = (sim: Simulation): { a: Assignment; k: PartnerAsk } | undefined => {
  for (const a of courseworkOf(sim, sim.player)!.assignments) { const k = a.asks?.find((x) => x.status === 'open'); if (k) return { a, k }; }
  return undefined;
};
/** Played a day at a time, from the first class, until a partner asks. */
const untilAsked = (sim: Simulation) => {
  for (let d = 31; !open(sim) && d < 31 + 30; d += 1) tended(sim, at(8, 1, 16) + (d - 1) * 24 * MS_HOUR);
  return open(sim)!;
};
const mateOf = (sim: Simulation, a: Assignment) => sim.player.school!.classmates[a.partner!]!;
const firstOf = (sim: Simulation, a: Assignment) => mateOf(sim, a).name.split(' ')[0]!;

describe('a partner asks', () => {
  it('in class, for an evening they’re free before it’s due, told, and the work waits for the answer; yes books it once, through a save', () => {
    let sim = life('pa-yes');
    const { a, k } = untilAsked(sim);
    expect(k.at - k.until).toBe(WORK.rehearsal.aheadHours * MS_HOUR);
    expect(sim.universe.notifications.filter((n) => n.title === `${firstOf(sim, a)} Asks To Rehearse`)).toHaveLength(1);
    expect(sim.universe.scheduled.some((i) => i.kind === ASK_KIND && i.status === 'pending' && i.payload.askId === k.id)).toBe(true);
    // The work waits for the answer, by hand and in a routine.
    expect(sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'read' } }).error).toBe(`${firstOf(sim, a)} has asked to rehearse. Answer them first.`);
    sim = reload(sim);
    const trust = trustOf(mateOf(sim, a));
    const yes = sim.must<{ booked: boolean; rehearsalId: string }>({ kind: 'school.answer_partner', payload: { assignmentId: a.id, askId: k.id, yes: true } });
    expect(yes.booked).toBe(true);
    const booked = sim.universe.scheduled.filter((i) => i.kind === PARTNER_KIND && i.status === 'pending' && i.payload.rehearsalId === yes.rehearsalId);
    expect(booked).toHaveLength(1);
    expect(booked[0]!.at).toBe(k.at);
    expect(sim.universe.scheduled.some((i) => i.kind === ASK_KIND && i.status === 'pending')).toBe(false);
    expect(sim.execute({ kind: 'school.answer_partner', payload: { assignmentId: a.id, askId: k.id, yes: true } }).error).toBe('You’ve answered it.');
    expect(trustOf(mateOf(sim, a))).toBe(trust);
    // Kept: they say what held it back, from the preparation as it stands.
    tended(sim, k.at + 3 * MS_HOUR);
    const after = courseworkOf(sim, sim.player)!.assignments.find((x) => x.id === a.id)!;
    const r = after.rehearsals.find((x) => x.id === yes.rehearsalId)!;
    if (r.status === 'kept') expect(r.said).toBe(peerNote(after, firstOf(sim, a)));
    else expect(r.said).toBeUndefined();
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('no costs nothing, and is remembered; left unanswered, it lapses, and costs a little trust', () => {
    const sim = life('pa-no');
    const { a, k } = untilAsked(sim);
    const twin = reload(sim);
    const trust = trustOf(mateOf(sim, a));
    expect(sim.must<{ booked: boolean }>({ kind: 'school.answer_partner', payload: { assignmentId: a.id, askId: k.id, yes: false } }).booked).toBe(false);
    expect(trustOf(mateOf(sim, a))).toBe(trust);
    expect(mateOf(sim, a).bond ?? 0).toBe(mateOf(twin, a).bond ?? 0);
    expect(sim.universe.scheduled.some((i) => i.kind === PARTNER_KIND && i.status === 'pending')).toBe(false);
    // Unanswered.
    tended(twin, k.until + MS_HOUR);
    const lapsed = courseworkOf(twin, twin.player)!.assignments.find((x) => x.id === a.id)!.asks!.find((x) => x.id === k.id)!;
    expect(lapsed.status).toBe('lapsed');
    expect(trustOf(mateOf(twin, a))).toBe(trust + WORK.ask.unanswered);
    expect(twin.execute({ kind: 'school.answer_partner', payload: { assignmentId: a.id, askId: k.id, yes: true } }).error).toBe('You didn’t answer in time.');
    expect(twin.universe.notifications.filter((n) => n.title === `${firstOf(twin, a)} Didn’t Hear Back`)).toHaveLength(1);
    // And the work goes on.
    expect(twin.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'read' } }).error ?? '').not.toMatch(/answer first/);
    expect(breaches(twin.universe)).toEqual([]);
  });

  it('yes is refused where you’re already rehearsing then, and no is still open to you', () => {
    const sim = life('pa-clash');
    const { a, k } = untilAsked(sim);
    sim.must({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: k.at } });
    expect(sim.execute({ kind: 'school.answer_partner', payload: { assignmentId: a.id, askId: k.id, yes: true } }).error).toBe('You’re already rehearsing then.');
    expect(sim.execute({ kind: 'school.answer_partner', payload: { assignmentId: a.id, askId: k.id, yes: false } }).ok).toBe(true);
    expect(sim.execute({ kind: 'school.answer_partner', payload: { assignmentId: a.id, askId: 'no-such', yes: false } }).error).toBe('There’s no such request.');
  });

  it('a partner who’d rather work alone doesn’t ask', () => {
    const sim = life('pa-wary');
    tended(sim, at(8, 30, 20));
    for (const m of sim.player.school!.classmates) mateRecord(m).trust = WORK.trust.wary - 1;
    tended(sim, at(9, 30, 20));
    expect(courseworkOf(sim, sim.player)!.assignments.some((a) => a.asks?.length)).toBe(false);
    // The same life, trusted: asked.
    const trusted = life('pa-wary');
    expect(untilAsked(trusted)).toBeDefined();
  });
});

describe('what a partner says', () => {
  it('names what held the scene back, and changes when the preparation does', () => {
    const sim = life('pa-said');
    tended(sim, at(8, 30, 20));
    const a = courseworkOf(sim, sim.player)!.assignments.find((x) => x.template === 'scene-study')!;
    const first = firstOf(sim, a);
    // Scene Study's table work is the answers alone (`interpretationOf`). Until 2026-10-12 this test moved the choices
    // through `prep.interpretation` with no question answered, a figure the showing never reads here, because that's
    // what `peerNote` read; the choices move through the answers now, every one the text supports or every one it cuts
    // against (left unanswered where it cuts against none).
    const answer = (supported: boolean) => {
      for (const { q, options } of questionsFor(a)) {
        const o = options.find((x) => x.supported === supported);
        if (o) a.answers[q.id] = o.id;
        else delete a.answers[q.id];
      }
    };
    answer(true);
    Object.assign(a.prep, { familiarity: 0.9, memorization: 0.1, interpretation: 0, rehearsal: 0.8 });
    expect(peerNote(a, first)).toMatch(/on book/);
    a.prep.memorization = 0.9;
    answer(false);
    expect(peerNote(a, first)).toMatch(/what you’re playing for/);
    // The figure nothing reads here moves nothing.
    a.prep.interpretation = 0.9;
    expect(peerNote(a, first)).toMatch(/what you’re playing for/);
    answer(true);
    expect(peerNote(a, first)).toBe(`${first} says it’s coming together.`);
  });
});
