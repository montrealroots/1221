/**
 * Former classmates in the profession (from 2026-10-08; `systems/rivals.ts`):
 * in the room at an audition and remembered there; cast in a job beside you
 * now and then, where the part suits them and they're free, their own credit
 * once, busy until it ends; and at its end the castmate is the person you
 * already know, never a second contact. How you get on decides none of it.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { roleById } from '@/engine/systems/career';
import { beginCareer, careerOf, type Booking } from '@/engine/systems/career';
import { RIVALS, castClassmate, classMonth, metInTheRoom, partTaken, signTheClass, workedWith } from '@/engine/systems/rivals';
import { contactsOf, knowTheClass } from '@/engine/systems/people';
import { MEMORY_KEPT, reachOut } from '@/engine/systems/reachingout';
import { BONDS, bondMove, evenCraft } from '@/engine/systems/school';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
/** A graduate of the class, signed, working, the class signed beside them and known as people. */
function graduate(seed: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  const school = sim.player.school!;
  for (const m of school.classmates) m.craft = evenCraft(75);
  school.standing = 'graduated';
  knowTheClass(sim, sim.player, school.classmates);
  signTheClass(sim, sim.player, 80);
  beginCareer(sim, sim.player);
  // Graduated, they work in New York, where the job is.
  sim.player.currentLocationId = 'us-ny-newyork';
  return sim;
}
const role = roleById('costar');
const first = at(2026, 10, 5, 8);
const last = first + 4 * MS_DAY;

describe('cast beside you', () => {
  it('now and then, where the part suits them and they’re free; their credit once; how you get on decides nothing', () => {
    const sim = graduate('co-cast');
    const credits = () => sim.player.school!.classmates.reduce((n, m) => n + (m.career?.credits.length ?? 0), 0);
    // Rivals all, and still cast: friendship and rivalry aren't read.
    for (const m of sim.player.school!.classmates) m.bond = -60;
    let cast = 0;
    const before = credits();
    for (let n = 0; n < 60; n += 1) if (castClassmate(sim, sim.player, `b${n}`, role, 'us-ny-newyork', first + n * 10 * MS_DAY, last + n * 10 * MS_DAY) !== undefined) cast += 1;
    expect(cast).toBeGreaterThan(0);
    expect(cast).toBeLessThan(30);
    expect(credits() - before).toBe(cast);
    // Busy on one job, not cast on another at the same time.
    const twin = graduate('co-busy');
    for (const m of twin.player.school!.classmates) m.career!.busyUntil = last + MS_DAY;
    for (let n = 0; n < 60; n += 1) expect(castClassmate(twin, twin.player, `b${n}`, role, 'us-ny-newyork', first, last)).toBeUndefined();
    // A craft that can't carry the part: never cast.
    const weak = graduate('co-weak');
    for (const m of weak.player.school!.classmates) m.craft = evenCraft(20);
    for (let n = 0; n < 60; n += 1) expect(castClassmate(weak, weak.player, `b${n}`, role, 'us-ny-newyork', first, last)).toBeUndefined();
  });

  it('a job taken with one, worked to its end, through a save: the castmate is the classmate already known, no second contact', () => {
    let sim = graduate('co-job');
    // The booking id whose draw casts a classmate, found on copies of the save.
    let id = '';
    for (let n = 0; n < 200 && !id; n += 1) { const copy = reload(sim); if (castClassmate(copy, copy.player, `job${n}`, role, 'us-ny-newyork', first, last) !== undefined) id = `job${n}`; }
    expect(id).not.toBe('');
    const b: Booking = { id, roleId: 'costar', cityId: 'us-ny-newyork', starts: first, units: 5, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(b);
    const contacts = contactsOf(sim.player).length;
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: id } }).ok).toBe(true);
    const i = careerOf(sim.player).bookings.find((x) => x.id === id)!.castmate!;
    expect(i).toBeDefined();
    const mate = sim.player.school!.classmates[i]!;
    expect(mate.career!.busyUntil).toBeGreaterThan(first);
    const c0 = contactsOf(sim.player).find((c) => c.classmate === i)!;
    const hours0 = c0.hours;
    expect(c0.memory[0]!.what).toBe(`Cast in ${role.label} with you`);
    sim = reload(sim);
    // Up before each seven o'clock call, as a player sets an alarm for it; tended between.
    const calls = sim.universe.scheduled.filter((x) => x.kind === 'career.work' && x.payload.bookingId === id).map((x) => x.at).sort((x, y) => x - y);
    for (const call of [...calls, last + 2 * MS_DAY]) {
      while (sim.now < call - 60_000) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.advanceTo(Math.min(call - 60_000, sim.now + 6 * MS_HOUR)); }
      sim.player.awakeSince = sim.now;
      sim.advanceTo(Math.min(call + 60_000, last + 2 * MS_DAY));
    }
    expect(careerOf(sim.player).bookings.find((x) => x.id === id)!.status).toBe('worked');
    // No new contact for the job: the classmate known already, nearer for it.
    expect(contactsOf(sim.player)).toHaveLength(contacts);
    const c = contactsOf(sim.player).find((x) => x.classmate === i)!;
    expect(c.hours).toBeGreaterThan(hours0);
    expect(c.memory.some((m) => m.what === `Worked together on ${role.label}`)).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('in the room', () => {
  it('a classmate at the audition is remembered on the contact they are, and the player hears the last thing you shared', () => {
    const sim = graduate('co-room');
    const c = contactsOf(sim.player).find((x) => x.classmate === 2)!;
    c.memory.unshift({ at: sim.now, what: 'A coffee at Atticus Market' });
    metInTheRoom(sim, sim.player, [{ i: 2, name: sim.player.school!.classmates[2]!.name }], role.label);
    expect(c.memory[0]!.what).toBe(`At an audition for ${role.label}, both of you`);
    const note = sim.universe.notifications.find((n) => n.title.endsWith('Was At The Audition Too'))!;
    expect(note.body).toMatch(/The last thing you shared: a coffee at atticus market\./);
    // A part taken from them in the room: a rival on the contact only once the bond has come that far.
    const m = sim.player.school!.classmates[2]!;
    m.bond = 40;
    partTaken(sim.player, 2);
    expect(c.rival).toBeUndefined();
    m.bond = BONDS.rival + 5;
    partTaken(sim.player, 2);
    expect(c.rival).toBe(true);
    // A job worked with somebody not linked to a classmate is nothing here.
    expect(workedWith(sim, sim.player, 99, role.label, 5)).toBe(false);
  });
});

describe('proportion over a long career (found by the lives replay of 07d52b84)', () => {
  it('a part taken counts against the bond once a year a classmate, not every room shared', () => {
    const sim = graduate('co-slight');
    const m = sim.player.school!.classmates[1]!;
    m.bond = 30;
    partTaken(sim.player, 1, first);
    const once = m.bond;
    expect(once).toBeLessThan(30);
    partTaken(sim.player, 1, first + 30 * MS_DAY);
    partTaken(sim.player, 1, first + 200 * MS_DAY);
    expect(m.bond).toBe(once);
    partTaken(sim.player, 1, first + 400 * MS_DAY);
    expect(m.bond).toBeLessThan(once);
  });

  it('a room shared is remembered and told once a season a classmate', () => {
    const sim = graduate('co-season');
    const c = contactsOf(sim.player).find((x) => x.classmate === 3)!;
    const name = sim.player.school!.classmates[3]!.name;
    metInTheRoom(sim, sim.player, [{ i: 3, name }], role.label);
    sim.advanceTo(sim.now + 10 * MS_DAY);
    metInTheRoom(sim, sim.player, [{ i: 3, name }], role.label);
    expect(c.memory.filter((x) => x.what.startsWith('At an audition'))).toHaveLength(1);
    expect(sim.universe.notifications.filter((n) => n.title.endsWith('Was At The Audition Too'))).toHaveLength(1);
  });

  it('a contact keeps the latest sixty things that happened', () => {
    const sim = graduate('co-memory');
    const c = contactsOf(sim.player)[0]!;
    for (let i = 0; i < 100; i += 1) c.memory.unshift({ at: sim.now + i, what: `Thing ${i}` });
    reachOut(sim, sim.player);
    expect(c.memory.length).toBeLessThanOrEqual(MEMORY_KEPT);
    expect(c.memory[0]!.what).toBe('Thing 99');
  });
});

describe('a bond after school (found by the second replay)', () => {
  it('drifts back toward even a month at a time, and a rival is one no longer once it has', () => {
    const sim = graduate('co-fade');
    const m = sim.player.school!.classmates[4]!;
    const c = contactsOf(sim.player).find((x) => x.classmate === 4)!;
    m.bond = BONDS.rival - 5;
    classMonth(sim, sim.player, sim.now);
    expect(m.bond).toBe(BONDS.rival - 5 + RIVALS.fadePerMonth);
    expect(c.rival).toBe(true);
    for (let k = 0; k < 20; k += 1) classMonth(sim, sim.player, sim.now + (k + 1) * 31 * MS_DAY);
    expect(m.bond).toBeGreaterThan(BONDS.rival + 10);
    expect(c.rival).toBeUndefined();
    m.bond = 3;
    for (let k = 0; k < 6; k += 1) classMonth(sim, sim.player, sim.now + (k + 30) * 31 * MS_DAY);
    expect(m.bond).toBe(0);
  });

  it('a job worked side by side draws two closer; a contact keeps its latest three rooms', () => {
    const sim = graduate('co-warm');
    const m = sim.player.school!.classmates[5]!;
    m.bond = 0;
    workedWith(sim, sim.player, 5, role.label, 5);
    expect(m.bond).toBeCloseTo(bondMove(sim.player, BONDS.shared), 10);
    const c = contactsOf(sim.player).find((x) => x.classmate === 5)!;
    const name = m.name;
    for (let k = 0; k < 6; k += 1) { metInTheRoom(sim, sim.player, [{ i: 5, name }], role.label); sim.advanceTo(sim.now + 100 * MS_DAY); }
    expect(c.memory.filter((x) => x.what.startsWith('At an audition'))).toHaveLength(RIVALS.roomsKept);
    expect(c.memory.some((x) => x.what.startsWith('Worked together'))).toBe(true);
  });
});
