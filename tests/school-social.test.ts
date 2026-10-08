/**
 * The class as people outside the work (from 2026-10-08): each classmate one
 * contact from the first week, asked out and asking by their own school day,
 * a coffee or a Cabaret show paid, studying together, another time offered,
 * plans called off and moved, coming late, a celebration after a closing, and
 * the same person still at the degree. Everything goes through the social
 * engine anybody known goes through.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { CLASS_SOCIAL, MEET_KIND, SOCIAL_LATE, classAtSchool, classBond, contactsOf, knowTheClass, levelOf, type Contact } from '@/engine/systems/people';
import { CLASS } from '@/engine/systems/classmates';
import { whatTheyAsk } from '@/engine/systems/reachingout';
import { BONDS, bondMove, CALL_KIND } from '@/engine/systems/school';
import { courseworkOf } from '@/engine/systems/coursework';

const zone = 'America/New_York';
const at = (month: number, day: number, hour = 9, minute = 0, year = 2026) => instantFromZoned({ year, month, day, hour, minute }, zone);
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const classmateOf = (sim: Simulation, i = 0): Contact => contactsOf(sim.player).find((c) => c.classmate === i)!;
const memo = (sim: Simulation, m: string) => sim.universe.transactions.filter((t) => t.memo === m).length;
/** A free evening at seven on or after a day: no classes the next morning matter, and no calls. */
const evening = (month: number, day: number) => at(month, day, 19);

describe('the class as people from the first week', () => {
  it('is known at orientation’s session on the class, one contact a classmate, through a save', () => {
    let sim = life('ss-known');
    tended(sim, at(8, 25, 14));
    sim = reload(sim);
    const linked = contactsOf(sim.player).filter((c) => c.classmate !== undefined);
    expect(linked).toHaveLength(sim.player.school!.classmates.length);
    expect(linked.every((c) => c.cityId === 'us-ct-newhaven' && c.met.how === 'school' && c.name === sim.player.school!.classmates[c.classmate!]!.name)).toBe(true);
    // Called again, nothing doubles.
    classAtSchool(sim, sim.player);
    expect(contactsOf(sim.player).filter((c) => c.classmate !== undefined)).toHaveLength(linked.length);
  });

  it('a classmate grown close at school reads as a friend there, by the bond as the degree reads it', () => {
    const sim = life('ss-near');
    tended(sim, at(9, 1, 12));
    expect(levelOf(classmateOf(sim, 0))).toBe('Acquaintance');
    sim.player.school!.classmates[0]!.bond = BONDS.friend;
    sim.player.school!.classmates[1]!.bond = BONDS.close;
    classAtSchool(sim, sim.player);
    expect(levelOf(classmateOf(sim, 0))).toBe('Friend');
    expect(levelOf(classmateOf(sim, 1))).toBe('Close Friend');
    expect(levelOf(classmateOf(sim, 2))).toBe('Acquaintance');
  });

  it('a save from before has them made on its next class day', () => {
    const sim = life('ss-old');
    tended(sim, at(8, 30, 20));
    sim.player.contacts = contactsOf(sim.player).filter((c) => c.classmate === undefined);
    tended(sim, at(8, 31, 18));
    expect(contactsOf(sim.player).filter((c) => c.classmate !== undefined)).toHaveLength(sim.player.school!.classmates.length);
  });
});

describe('time together', () => {
  it('a coffee asked, kept and paid once: the hours, the bond at school and the memory move', () => {
    let sim = life('ss-coffee');
    tended(sim, at(9, 1, 12));
    const c = classmateOf(sim);
    const mate = sim.player.school!.classmates[0]!;
    const r = sim.must<{ accepted: boolean; reason?: string }>({ kind: 'social.invite', payload: { contactId: c.id, at: evening(9, 2), what: 'coffee' } });
    expect(r.accepted, r.reason).toBe(true);
    sim = reload(sim);
    const b0 = sim.player.school!.classmates[0]!.bond ?? 0;
    tended(sim, evening(9, 2) + 2 * MS_HOUR);
    const after = classmateOf(sim);
    expect(after.hours).toBeCloseTo(45 / 60, 5);
    expect(sim.player.school!.classmates[0]!.bond).toBeCloseTo(b0 + bondMove(sim.player, CLASS_SOCIAL.bondPerHour * 0.75), 5);
    expect(after.memory[0]!.what).toBe('A coffee at Atticus Market');
    expect(memo(sim, 'Atticus Market, a coffee')).toBe(1);
    void mate;
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('busy by their school day, a classmate says why and offers another evening, which can be taken', () => {
    const sim = life('ss-busy');
    sim.player.school!.classmates[0]!.craft.scene = 99;
    sim.advanceTo(at(1, 4, 9, 0, 2027) + 60_000);
    // A classmate cast this spring rehearses Tuesday to Friday from three; the player, understudying, isn't called on a Tuesday.
    const around = sim.player.school!.around!.list.map((x) => x.name);
    const i = sim.player.school!.classmates.findIndex((m) => around.includes(m.name));
    const c = classmateOf(sim, i);
    const r = sim.must<{ accepted: boolean; reason?: string; counter?: number }>({ kind: 'social.invite', payload: { contactId: c.id, at: at(1, 26, 17, 0, 2027), what: 'coffee' } });
    expect(r.accepted).toBe(false);
    expect(r.reason).toMatch(/has rehearsal calls from three/);
    expect(r.counter).toBeDefined();
    expect(zonedParts(r.counter!, zone).hour).toBe(19);
    // Asked the same again, the same no is remembered once, the latest (`rememberAnswer`), not a line a time.
    const words = `Said no to a coffee at Atticus Market: ${r.reason}`;
    expect(sim.must<{ accepted: boolean }>({ kind: 'social.invite', payload: { contactId: c.id, at: at(1, 26, 17, 0, 2027), what: 'coffee' } }).accepted).toBe(false);
    expect(classmateOf(sim, i).memory.filter((m) => m.what === words)).toHaveLength(1);
    expect(classmateOf(sim, i).memory[0]!.what).toBe(words);
    expect(sim.must<{ accepted: boolean }>({ kind: 'social.invite', payload: { contactId: c.id, at: r.counter!, what: 'coffee' } }).accepted).toBe(true);
    // A polite no isn't held against anybody: the no to the morning left nothing behind.
    expect(classmateOf(sim).stoodUp).toBeUndefined();
    expect(classmateOf(sim).cutShort).toBeUndefined();
  });

  it('called off with notice costs nothing; at short notice they wait a few days, and the bond dips a little', () => {
    const sim = life('ss-cancel');
    tended(sim, at(9, 1, 12));
    const c = classmateOf(sim);
    sim.must({ kind: 'social.invite', payload: { contactId: c.id, at: evening(9, 4), what: 'coffee' } });
    const far = sim.universe.scheduled.find((x) => x.kind === MEET_KIND && x.status === 'pending')!;
    expect(sim.must<{ late: boolean }>({ kind: 'social.cancel', payload: { itemId: far.id } }).late).toBe(false);
    expect(classmateOf(sim).cutShort).toBeUndefined();
    sim.must({ kind: 'social.invite', payload: { contactId: c.id, at: evening(9, 1) + 3 * MS_HOUR - 60 * 60_000, what: 'coffee' } });
    const near = sim.universe.scheduled.find((x) => x.kind === MEET_KIND && x.status === 'pending')!;
    const b0 = sim.player.school!.classmates[0]!.bond ?? 0;
    expect(sim.must<{ late: boolean }>({ kind: 'social.cancel', payload: { itemId: near.id } }).late).toBe(true);
    expect(sim.player.school!.classmates[0]!.bond).toBeCloseTo(b0 + bondMove(sim.player, CLASS_SOCIAL.cutShort), 5);
    const again = sim.must<{ accepted: boolean; reason?: string }>({ kind: 'social.invite', payload: { contactId: c.id, at: evening(9, 2), what: 'coffee' } });
    expect(again.accepted).toBe(false);
    expect(again.reason).toMatch(/you called off at short notice/);
    expect(sim.execute({ kind: 'social.cancel', payload: { itemId: near.id } }).error).toBe('There’s no such meeting on your calendar.');
    // Made right, the bond comes back by what the late call took, and no further: letting somebody down and apologizing isn't a way to get closer.
    tended(sim, at(9, 1, 16));
    sim.must({ kind: 'school.make_amends', payload: { mate: 0 } });
    expect(sim.player.school!.classmates[0]!.bond).toBeCloseTo(b0 + bondMove(sim.player, CLASS_SOCIAL.cutShort) + bondMove(sim.player, CLASS.amends.lateCancel.bond), 5);
    expect(-CLASS_SOCIAL.cutShort).toBeGreaterThanOrEqual(CLASS.amends.lateCancel.bond);
    expect(-CLASS.study.missed.bond).toBeGreaterThanOrEqual(CLASS.amends.missed.bond);
    expect(classmateOf(sim).cutShort).toBeUndefined();
  });

  it('moved to the next day, it’s there once; held by a call past its start, you come late, or not at all', () => {
    const sim = life('ss-late');
    tended(sim, at(9, 1, 12));
    const c = classmateOf(sim);
    sim.must({ kind: 'social.invite', payload: { contactId: c.id, at: evening(9, 2), what: 'coffee' } });
    const first = sim.universe.scheduled.find((x) => x.kind === MEET_KIND && x.status === 'pending')!;
    expect(sim.must<{ moved: boolean }>({ kind: 'social.reschedule', payload: { itemId: first.id, at: evening(9, 3) } }).moved).toBe(true);
    const moved = sim.universe.scheduled.filter((x) => x.kind === MEET_KIND && x.status === 'pending');
    expect(moved).toHaveLength(1);
    expect(moved[0]!.at).toBe(evening(9, 3));
    // Something booked over its start, ending twenty minutes in.
    sim.schedule({ at: evening(9, 3) - 40 * 60_000, durationMinutes: 60, kind: CALL_KIND, label: 'A Late Call', category: 'school', priority: 32, requiresPlayer: true, payload: { personId: sim.player.id, call: 'rehearsal' } });
    tended(sim, evening(9, 3) + 2 * MS_HOUR);
    const after = classmateOf(sim);
    expect(after.memory.some((m) => m.what === 'Late by 20 minutes, from A Late Call')).toBe(true);
    expect(after.hours).toBeCloseTo((45 - 20) / 60, 5);
    expect(after.stoodUp).toBeUndefined();
    // Held past the line: not there, and why.
    sim.must({ kind: 'social.invite', payload: { contactId: after.id, at: evening(9, 8), what: 'coffee' } });
    sim.schedule({ at: evening(9, 8) - 10 * 60_000, durationMinutes: SOCIAL_LATE.most + 30, kind: CALL_KIND, label: 'A Long Call', category: 'school', priority: 32, requiresPlayer: true, payload: { personId: sim.player.id, call: 'rehearsal' } });
    tended(sim, evening(9, 8) + 2 * MS_HOUR);
    expect(classmateOf(sim).stoodUp).toBe(evening(9, 8));
    expect(classmateOf(sim).memory.some((m) => m.what === 'Not there: held at A Long Call')).toBe(true);
  });

  it('studying together moves your least secure lines, and trains no skill; a Cabaret show is on its nights only, the ticket paid', () => {
    const sim = life('ss-study');
    tended(sim, at(9, 1, 12));
    const c = classmateOf(sim);
    const lines = () => Math.min(...courseworkOf(sim, sim.player)!.assignments.filter((a) => a.status === 'open' && a.sceneId).map((a) => a.prep.memorization));
    expect(sim.must<{ accepted: boolean }>({ kind: 'social.invite', payload: { contactId: c.id, at: evening(9, 2), what: 'study' } }).accepted).toBe(true);
    // Across the meeting itself (the day's classes grow craft, as they should).
    tended(sim, evening(9, 2) - 60_000);
    const before = lines();
    const craft = JSON.stringify(sim.player.craft);
    tended(sim, evening(9, 2) + 2 * MS_HOUR);
    expect(lines()).toBeGreaterThan(before);
    expect(JSON.stringify(sim.player.craft)).toBe(craft);
    // Monday 7 September: no show. Thursday 10 September at eight: a show, the student ticket and fee.
    expect(sim.execute({ kind: 'social.invite', payload: { contactId: c.id, at: at(9, 7, 20), what: 'show' } }).error).toMatch(/Thursday to Saturday/);
    const c2 = classmateOf(sim, 1);
    expect(sim.must<{ accepted: boolean; reason?: string }>({ kind: 'social.invite', payload: { contactId: c2.id, at: at(9, 10, 20), what: 'show' } })).toMatchObject({ accepted: true });
    tended(sim, at(9, 10, 23));
    expect(memo(sim, 'The Yale Cabaret, a student ticket')).toBe(1);
    expect(classmateOf(sim, 1).memory[0]!.what).toBe('Saw a show at the Yale Cabaret together');
  });
});

describe('asks and celebrations', () => {
  it('a friend asks for the time you’ve had least lately together, not the same thing twice running', () => {
    const sim = life('ss-asks');
    tended(sim, at(9, 1, 12));
    const c = classmateOf(sim);
    c.hours = 120;
    const day = '2026-09-02';
    const first = whatTheyAsk(sim, c, day)!;
    expect(first).toBeDefined();
    (c.kinds ??= {})[first.what ?? 'meal'] = sim.now;
    const second = whatTheyAsk(sim, c, day)!;
    expect(second.what).not.toBe(first.what);
  });

  it('after a closing, a classmate in the cast asks you out; yes puts it on the calendar after the show', () => {
    const sim = life('ss-closing');
    sim.player.school!.classmates[0]!.craft.scene = 99;
    sim.advanceTo(at(1, 4, 9, 0, 2027) + 60_000);
    const shows = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.call === 'performance' && i.payload.which !== 'rep').sort((a, b) => a.at - b.at);
    tended(sim, shows.at(-1)!.at + 160 * 60_000);
    const asker = contactsOf(sim.player).find((c) => c.ask?.about?.startsWith('after the closing'));
    expect(asker).toBeDefined();
    expect(asker!.classmate).toBeDefined();
    const r = sim.execute<{ at?: number }>({ kind: 'social.answer', payload: { contactId: asker!.id, yes: true } });
    expect(r.ok, r.error).toBe(true);
    expect(sim.universe.scheduled.filter((i) => i.kind === MEET_KIND && i.status === 'pending' && i.payload.contactId === asker!.id && i.payload.what === 'meal')).toHaveLength(1);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('after the degree', () => {
  it('is the same person, moved to New York, nearer by the years, the time at school remembered', () => {
    const sim = life('ss-degree');
    tended(sim, at(9, 1, 12));
    const c = classmateOf(sim);
    c.hours = 30;
    c.memory.unshift({ at: sim.now, what: 'A coffee at Atticus Market' });
    sim.player.school!.classmates[0]!.bond = 60;
    knowTheClass(sim, sim.player, sim.player.school!.classmates);
    const after = contactsOf(sim.player).filter((x) => x.classmate === 0);
    expect(after).toHaveLength(1);
    expect(after[0]!.id).toBe(c.id);
    expect(after[0]!.cityId).toBe('us-ny-newyork');
    expect(after[0]!.hours).toBeGreaterThanOrEqual(30);
    expect(after[0]!.memory.some((m) => m.what === 'A coffee at Atticus Market')).toBe(true);
    void MS_DAY;
  });

  it('an evening together after it still moves the bond, and a late call-off still costs it', () => {
    const sim = life('ss-after');
    tended(sim, at(9, 1, 12));
    const c = classmateOf(sim);
    sim.player.school!.standing = 'graduated';
    knowTheClass(sim, sim.player, sim.player.school!.classmates);
    const b0 = sim.player.school!.classmates[0]!.bond ?? 0;
    classBond(sim.player, c, CLASS_SOCIAL.bondPerHour * 2);
    expect(sim.player.school!.classmates[0]!.bond).toBeCloseTo(b0 + bondMove(sim.player, 2), 5);
    classBond(sim.player, c, CLASS_SOCIAL.cutShort);
    expect(sim.player.school!.classmates[0]!.bond).toBeCloseTo(b0 + bondMove(sim.player, 2) + bondMove(sim.player, CLASS_SOCIAL.cutShort), 5);
  });
});
