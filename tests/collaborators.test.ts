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
import { RIVALS, classMonth, metInTheRoom, partTaken, signTheClass, workedWith } from '@/engine/systems/rivals';
import { COMPANY, PART, classmateTakesJob, productionOf, productionsOf, tableRead } from '@/engine/systems/companies';
import { attributesOf } from '@/engine/systems/attributes';
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

describe('a production and the parts in it', () => {
  /** A job offered and taken through the public command, for a booking id. */
  const offerAndTake = (sim: Simulation, id: string, roleId = 'lort-b', starts = first) => {
    const b: Booking = { id, roleId, cityId: 'us-ny-newyork', starts, units: roleId === 'costar' ? 5 : 1, rehearsalWeeks: roleId === 'costar' ? 0 : 1, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(b);
    const r = sim.execute({ kind: 'career.accept', payload: { bookingId: id } });
    expect(r.ok, r.error).toBe(true);
    return productionOf(sim.player, id)!;
  };
  /** Up before each call, tended between, to a time. */
  const workThrough = (sim: Simulation, id: string, until: number) => {
    const calls = sim.universe.scheduled.filter((x) => x.kind === 'career.work' && x.payload.bookingId === id).map((x) => x.at).sort((x, y) => x - y);
    for (const call of [...calls, until]) {
      while (sim.now < call - 60_000) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.advanceTo(Math.min(call - 60_000, sim.now + 6 * MS_HOUR)); }
      sim.player.awakeSince = sim.now;
      sim.advanceTo(Math.min(call + 60_000, until));
    }
  };

  it('has an identity and distinct parts: the player’s one, the others by medium, nobody in two', () => {
    const sim = graduate('pr-parts');
    const stage = offerAndTake(sim, 'stage-1');
    expect(stage.slots.map((x) => x.size)).toEqual(['principal', 'supporting', 'featured', 'understudy']);
    expect(stage.slots.filter((x) => x.performer.kind === 'player')).toHaveLength(1);
    expect(stage.title).toMatch(/, New York 20\d\d$/);
    const classmates = stage.slots.flatMap((x) => (x.performer.kind === 'classmate' ? [x.performer.i] : []));
    expect(new Set(classmates).size).toBe(classmates.length);
    expect(productionsOf(sim.player).filter((p) => p.bookingId === 'stage-1')).toHaveLength(1);
  });

  it('casts a former classmate in a part of their own now and then, where they fit it, are free and are signed or local; rivals as readily', () => {
    const sim = graduate('pr-cast');
    for (const m of sim.player.school!.classmates) m.bond = -60;
    let cast = 0;
    const credits0 = sim.player.school!.classmates.reduce((n, m) => n + (m.career?.credits.length ?? 0), 0);
    for (let n = 0; n < 40; n += 1) {
      const p = offerAndTake(sim, `j${n}`, 'lort-b', first + n * 40 * MS_DAY);
      cast += p.slots.filter((x) => x.performer.kind === 'classmate').length;
      // Each classmate cast holds one part, and their credit is theirs: none credited with the player's.
      for (const x of p.slots) if (x.performer.kind === 'classmate') expect(x.size).not.toBe('principal');
      careerOf(sim.player).bookings.find((b) => b.id === `j${n}`)!.status = 'released';
    }
    expect(cast).toBeGreaterThan(0);
    expect(sim.player.school!.classmates.reduce((n, m) => n + (m.career?.credits.length ?? 0), 0) - credits0).toBe(cast);
    // A craft that can't carry the part: never cast.
    const weak = graduate('pr-weak');
    for (const m of weak.player.school!.classmates) m.craft = evenCraft(20);
    for (let n = 0; n < 40; n += 1) expect(offerAndTake(weak, `w${n}`, 'lort-b', first + n * 40 * MS_DAY).slots.some((x) => x.performer.kind === 'classmate')).toBe(false);
  });

  it('a classmate offered a part may turn it down, a small part likelier than a large, and isn’t cast in it', () => {
    const sim = graduate('pr-decline');
    const turned: Record<string, number> = {};
    for (let n = 0; n < 300; n += 1) {
      const p = offerAndTake(sim, `d${n}`, 'lort-b', first + n * 40 * MS_DAY);
      for (const h of p.history) {
        const m = /^(.+) was offered (.+), and turned it down$/.exec(h.what);
        if (!m) continue;
        turned[m[2]!] = (turned[m[2]!] ?? 0) + 1;
        // Not cast in what they turned down.
        expect(p.slots.some((x) => x.performer.kind === 'classmate' && sim.player.school!.classmates[x.performer.i]!.name === m[1] && x.part.toLowerCase() === m[2])).toBe(false);
      }
      careerOf(sim.player).bookings.find((b) => b.id === `d${n}`)!.status = 'released';
    }
    expect(Object.values(turned).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    expect(turned['an understudy'] ?? 0).toBeGreaterThan(turned['a supporting part'] ?? 0);
  });

  it('a classmate cast who books a job before the run withdraws: a company actor plays it, the credit goes back; in a run they book nothing else', () => {
    const sim = graduate('pr-withdraw');
    let p: ReturnType<typeof offerAndTake> | undefined;
    for (let n = 0; n < 300 && !p; n += 1) {
      const q = offerAndTake(sim, `w${n}`, 'lort-b', first + (n + 1) * 40 * MS_DAY);
      if (q.slots.some((x) => x.performer.kind === 'classmate')) p = q;
      else careerOf(sim.player).bookings.find((b) => b.id === `w${n}`)!.status = 'released';
    }
    const slot = p!.slots.find((x) => x.performer.kind === 'classmate')!;
    const i = (slot.performer as { i: number }).i;
    const m = sim.player.school!.classmates[i]!;
    const credits = m.career!.credits.length;
    // During the run: committed, nothing else booked.
    expect(classmateTakesJob(sim, sim.player, i, slot.from + MS_DAY)).toBe('busy');
    // Before it: they withdraw.
    expect(classmateTakesJob(sim, sim.player, i, slot.from - 10 * MS_DAY)).toBe('withdrew');
    expect(slot.status).toBe('replaced');
    expect(p!.slots.filter((x) => x.status === 'cast' && x.part === slot.part).map((x) => x.performer.kind)).toEqual(['company']);
    expect(m.career!.credits.length).toBe(credits - 1);
    expect(p!.history.some((h) => h.what === `${m.name} withdrew from ${slot.part.toLowerCase()} for another job; a company actor plays it`)).toBe(true);
    expect(sim.universe.notifications.some((n) => n.title === `${m.name.split(' ')[0]} Withdrew`)).toBe(true);
    expect(classmateTakesJob(sim, sim.player, i, slot.from - 10 * MS_DAY)).toBe('free');
  });

  it('the class’s months book nobody across a run they’re in, while the rest of the class books', () => {
    const sim = graduate('pr-months');
    for (const m of sim.player.school!.classmates) m.career!.agencyId = 'caa';
    let runs = 0;
    let others = 0;
    for (let n = 0; n < 400; n += 1) {
      const p = offerAndTake(sim, `m${n}`, 'lort-b', first + n * 120 * MS_DAY);
      careerOf(sim.player).bookings.find((b) => b.id === `m${n}`)!.status = 'released';
      const slot = p.slots.find((x) => x.performer.kind === 'classmate');
      if (!slot) continue;
      runs += 1;
      const m = sim.player.school!.classmates[(slot.performer as { i: number }).i]!;
      const mine = m.career!.credits.length;
      const all = sim.player.school!.classmates.reduce((k, x) => k + x.career!.credits.length, 0);
      // Each month the run is in, from its first day.
      for (let t = slot.from + MS_DAY; t <= slot.until; t += 31 * MS_DAY) classMonth(sim, sim.player, t);
      expect(m.career!.credits.length).toBe(mine);
      expect(slot.status).toBe('cast');
      others += sim.player.school!.classmates.reduce((k, x) => k + x.career!.credits.length, 0) - all;
    }
    expect(runs).toBeGreaterThan(5);
    expect(others).toBeGreaterThan(0);
  });

  it('the first call of a stage or television job is its table read, and it teaches a share of the lines; a booth’s isn’t', () => {
    const sim = graduate('pr-table');
    offerAndTake(sim, 'T1', 'lort-b');
    offerAndTake(sim, 'T2', 'costar', first + 90 * MS_DAY);
    offerAndTake(sim, 'T3', 'commercial-vo', first + 120 * MS_DAY);
    const firstOf = (id: string) => sim.universe.scheduled.filter((x) => x.kind === 'career.work' && x.payload.bookingId === id).sort((a, b) => a.at - b.at);
    expect(firstOf('T1')[0]!.label).toBe('The Table Read: A Play, A LORT Theater (Category B)');
    expect(firstOf('T1')[0]!.payload.tableRead).toBe(true);
    expect(firstOf('T1').slice(1).every((x) => !x.payload.tableRead)).toBe(true);
    expect(firstOf('T2')[0]!.label).toBe('The Table Read, Then On Set: Co-Star, A Television Series');
    expect(firstOf('T3').some((x) => x.payload.tableRead)).toBe(false);
    expect(tableRead(sim, sim.player, 'T1')).toBe(true);
    expect(productionOf(sim.player, 'T1')!.lines).toBeCloseTo(COMPANY.tableRead, 9);
    expect(tableRead(sim, sim.player, 'T3')).toBe(false);
  });

  it('one classmate who fits is never cast twice in a production, nor said to be on another job when it’s this one', () => {
    const sim = graduate('pr-one');
    const fits = sim.player.school!.classmates.findIndex((m) => m.career);
    sim.player.school!.classmates.forEach((m, i) => { if (i !== fits) m.craft = evenCraft(20); else m.craft = evenCraft(95); });
    for (let n = 0; n < 400; n += 1) {
      const p = offerAndTake(sim, `o${n}`, 'lort-b', first + n * 40 * MS_DAY);
      const cast = p.slots.filter((x) => x.performer.kind === 'classmate').length;
      expect(cast).toBeLessThanOrEqual(1);
      expect(p.history.filter((h) => h.what.includes(sim.player.school!.classmates[fits]!.name) && h.what.includes('another job')).length * cast).toBe(0);
      careerOf(sim.player).bookings.find((b) => b.id === `o${n}`)!.status = 'released';
    }
  });

  it('a part learned an hour at a time: its lines, not the craft; the days earn more for it, and the first day says how you came in', () => {
    const base = graduate('pr-learn');
    offerAndTake(base, 'L1', 'costar');
    // Booked, not yet worked: the part can be learned; a booth's can't, nor a job not booked.
    expect(base.execute({ kind: 'career.learn_part', payload: { bookingId: 'nope' } }).error).toBe('That isn’t a job you’re booked for.');
    offerAndTake(base, 'V1', 'commercial-vo', first + 60 * MS_DAY);
    expect(base.execute({ kind: 'career.learn_part', payload: { bookingId: 'V1' } }).error).toBe('A booth’s copy is read there, not learned.');
    const learned = reload(base);
    const cold = reload(base);
    const craft0 = JSON.stringify(learned.player.craft);
    let lines = 0;
    for (let n = 0; n < 6; n += 1) {
      Object.assign(learned.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
      const r = learned.must<{ lines: number }>({ kind: 'career.learn_part', payload: { bookingId: 'L1' } });
      expect(r.lines).toBeGreaterThan(lines);
      expect(r.lines - lines).toBeLessThanOrEqual(PART.gain * 1.1 * (1 - lines) + 1e-9);
      lines = r.lines;
    }
    expect(lines).toBeGreaterThan(PART.offBook);
    // Knowing this part isn't growing as an actor.
    expect(JSON.stringify(learned.player.craft)).toBe(craft0);
    const rep0 = attributesOf(learned, learned.player).reputation;
    expect(attributesOf(cold, cold.player).reputation).toBe(rep0);
    workThrough(learned, 'L1', last + 2 * MS_DAY);
    workThrough(cold, 'L1', last + 2 * MS_DAY);
    expect(careerOf(learned.player).bookings.find((b) => b.id === 'L1')!.worked).toBe(5);
    expect(careerOf(cold.player).bookings.find((b) => b.id === 'L1')!.worked).toBe(5);
    expect(attributesOf(learned, learned.player).reputation).toBeGreaterThan(attributesOf(cold, cold.player).reputation);
    expect(productionOf(learned.player, 'L1')!.history.map((h) => h.what)).toContain('You came in off book');
    // Cold, all they know is the table read's share (`COMPANY.tableRead`).
    expect(productionOf(cold.player, 'L1')!.history.map((h) => h.what)).toEqual(expect.arrayContaining(['The table read', `You came in on book, ${Math.round(COMPANY.tableRead * 100)}% of your lines known`]));
    expect(learned.execute({ kind: 'career.learn_part', payload: { bookingId: 'L1' } }).error).toBe('That isn’t a job you’re booked for.');
    expect(breaches(learned.universe)).toEqual([]);
  });

  it('a classmate holding a part elsewhere then is asked and isn’t cast, and the production remembers it', () => {
    const sim = graduate('pr-busy');
    for (const m of sim.player.school!.classmates) m.career!.busyUntil = first + 400 * MS_DAY;
    let asked = 0;
    for (let n = 0; n < 40; n += 1) {
      const p = offerAndTake(sim, `b${n}`, 'lort-b', first + n * 5 * MS_DAY);
      expect(p.slots.some((x) => x.performer.kind === 'classmate')).toBe(false);
      asked += p.history.filter((h) => /was asked for .* and was on another job then/.test(h.what)).length;
      careerOf(sim.player).bookings.find((b) => b.id === `b${n}`)!.status = 'released';
    }
    expect(asked).toBeGreaterThan(0);
  });

  it('worked to its end through a save: days side by side counted as they happen, credit naming the part, no second contact, no pay for their work', () => {
    let sim = graduate('pr-job');
    // The booking whose production casts a classmate, found on copies of the save.
    let id = '';
    for (let n = 0; n < 300 && !id; n += 1) {
      const copy = reload(sim);
      const b: Booking = { id: `job${n}`, roleId: 'costar', cityId: 'us-ny-newyork', starts: first, units: 5, rehearsalWeeks: 0, status: 'offered', dueAt: copy.now + 2 * MS_DAY, offeredAt: copy.now, worked: 0, owed: 0 };
      careerOf(copy.player).bookings.push(b);
      copy.execute({ kind: 'career.accept', payload: { bookingId: b.id } });
      if (productionOf(copy.player, b.id)?.slots.some((x) => x.performer.kind === 'classmate')) id = b.id;
    }
    expect(id).not.toBe('');
    const contacts = contactsOf(sim.player).length;
    const p = offerAndTake(sim, id, 'costar');
    const slot = p.slots.find((x) => x.performer.kind === 'classmate')!;
    const i = (slot.performer as { i: number }).i;
    const hours0 = contactsOf(sim.player).find((c) => c.classmate === i)!.hours;
    sim = reload(sim);
    workThrough(sim, id, last + 2 * MS_DAY);
    const booking = careerOf(sim.player).bookings.find((x) => x.id === id)!;
    expect(booking.status).toBe('worked');
    const after = productionOf(sim.player, id)!.slots.find((x) => x.id === slot.id)!;
    const c = contactsOf(sim.player).find((x) => x.classmate === i)!;
    // Hours by days shared, not by the job.
    expect(c.hours - hours0).toBeCloseTo(after.shared * COMPANY.hoursPerDay, 5);
    if (after.shared > 0) {
      expect(c.memory.some((m) => m.what === `Worked together on ${p.title}, ${after.shared} ${after.shared === 1 ? 'day' : 'days'} side by side`)).toBe(true);
      expect(contactsOf(sim.player)).toHaveLength(contacts);
    }
    // The player's credit names the production and the player's part, once.
    const mine = careerOf(sim.player).credits.filter((x) => x.productionId === p.id);
    expect(mine).toHaveLength(1);
    expect(mine[0]!.part).toBe('Your Part');
    // Paid for the player's days only: the booking's days, nobody else's.
    expect(booking.worked).toBe(5);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('replaced for not turning up: the part goes to a company actor, the history keeps who played it, no second credit', () => {
    const sim = graduate('pr-fired');
    const p = offerAndTake(sim, 'f1', 'costar');
    // Away for the first call.
    sim.player.currentLocationId = 'us-ca-losangeles';
    const firstCall = sim.universe.scheduled.filter((x) => x.kind === 'career.work' && x.payload.bookingId === 'f1').map((x) => x.at).sort((x, y) => x - y)[0]!;
    while (sim.now < firstCall + MS_HOUR) sim.advanceTo(Math.min(firstCall + MS_HOUR, sim.now + 6 * MS_HOUR));
    const q = productionOf(sim.player, 'f1')!;
    expect(q.slots.find((x) => x.performer.kind === 'player')!.status).toBe('replaced');
    expect(q.slots.filter((x) => x.status === 'cast' && x.size === 'principal' && x.performer.kind === 'company')).toHaveLength(1);
    expect(q.history.some((h) => h.what.startsWith('Your part recast'))).toBe(true);
    expect(careerOf(sim.player).credits.filter((x) => x.productionId === p.id)).toHaveLength(0);
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

describe('the years at school, remembered (found by the third replay)', () => {
  it('outlast decades of what comes after: kept first when a contact’s memory is trimmed', () => {
    const sim = graduate('co-yale');
    const c = contactsOf(sim.player).find((x) => x.classmate === 0)!;
    c.memory = [{ at: sim.now - 1000, what: 'At Yale: Ran lines with you' }, { at: sim.now - 2000, what: 'At Yale: Showed Trifles together: strong' }];
    for (let i = 0; i < 200; i += 1) c.memory.unshift({ at: sim.now + i, what: `Asked you to a meal; you never answered ${i}` });
    reachOut(sim, sim.player);
    expect(c.memory.length).toBeLessThanOrEqual(MEMORY_KEPT);
    expect(c.memory.filter((m) => m.what.startsWith('At Yale'))).toHaveLength(2);
    expect(c.memory[0]!.what).toBe('Asked you to a meal; you never answered 199');
  });
});
