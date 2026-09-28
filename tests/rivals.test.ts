/**
 * The class after Yale, and the trades (`systems/rivals.ts`): signed at the
 * showcase by the agencies' own rule, working a month at a time, in the room
 * at the player's auditions, and in Deadline and Playbill.
 */

import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { AGENCIES, ROLES } from '@/engine/content/career';
import { AUDITION_KIND, auditionLevel, beginCareer, careerOf, roleById, showcaseScore, type Booking } from '@/engine/systems/career';
import { RIVALS, classMonth, inTheRoom, report, signTheClass } from '@/engine/systems/rivals';
import { evenCraft } from '@/engine/systems/school';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** Out of school, in the business, with the class out too. */
function graduated(seed: string): Simulation {
  const sim = life(seed);
  sim.player.school!.standing = 'graduated';
  sim.player.craft = evenCraft(75);
  beginCareer(sim, sim.player);
  return sim;
}

describe('the class at the showcase', () => {
  it('is signed by the rule the player is: an agency takes the two best it wants whose showing clears its bar, the biggest first', () => {
    const sim = life('rivals-sign');
    const mates = sim.player.school!.classmates;
    mates.forEach((m, i) => { m.craft = evenCraft(60 + i * 2); });
    signTheClass(sim, sim.player, 50);
    for (const agency of AGENCIES) {
      const signed = mates.filter((m) => m.career?.agencyId === agency.id);
      expect(signed.length).toBeLessThanOrEqual(2);
      for (const m of signed) expect(showcaseScore(m.craft, 1)).toBeGreaterThanOrEqual(agency.bar);
    }
    // The strongest two go to the biggest that takes first, and it's in the trades.
    const best = [...mates].sort((a, b) => showcaseScore(b.craft, 1) - showcaseScore(a.craft, 1)).slice(0, 2);
    for (const m of best) expect(m.career!.agencyId).toBe(AGENCIES[0]!.id);
    expect(careerOf(sim.player).news!.some((n) => n.source === 'Deadline' && n.headline.startsWith(AGENCIES[0]!.name) && n.about === 'class')).toBe(true);
    for (const m of mates) expect(m.career).toBeDefined();
    // Once: a second showing doesn't sign them again.
    const before = JSON.stringify(mates.map((m) => m.career));
    signTheClass(sim, sim.player, 99);
    expect(JSON.stringify(mates.map((m) => m.career))).toBe(before);
  });
});

describe('the class at work', () => {
  it('books parts month by month, only parts its agency sends clients to and its craft can carry', () => {
    const sim = graduated('rivals-month');
    const mates = sim.player.school!.classmates;
    mates.forEach((m) => { m.career = { agencyId: 'gersh', credits: [] }; m.craft = evenCraft(75); });
    for (let n = 0; n < 24; n += 1) classMonth(sim, sim.player, sim.now + n * 31 * MS_DAY);
    const credits = mates.flatMap((m) => m.career!.credits.map((c) => ({ m, role: roleById(c.roleId) })));
    expect(credits.length).toBeGreaterThan(24 * mates.length * RIVALS.monthly[2] * 0.4);
    for (const { m, role } of credits) {
      expect(role.tiers).toContain(2);
      expect(auditionLevel(m.craft, role, 'room')).toBeGreaterThanOrEqual(role.bar - 5);
    }
    // Not in school yet, nobody works.
    const student = life('rivals-student');
    student.player.school!.classmates.forEach((m) => { m.career = { credits: [] }; });
    classMonth(student, student.player, student.now);
    expect(student.player.school!.classmates.every((m) => m.career!.credits.length === 0)).toBe(true);
  });

  it('are in the room now and then, and one who reads better takes the part and the player hears who', () => {
    const sim = graduated('rivals-room');
    const mates = sim.player.school!.classmates;
    mates.forEach((m) => { m.career = { credits: [] }; m.craft = evenCraft(99); });
    const career = careerOf(sim.player);
    // Across many auditions, about a tenth of the class each time.
    let seen = 0;
    for (let n = 0; n < 200; n += 1) seen += inTheRoom(sim, sim.player, { id: `r${n}`, roleId: 'costar', at: sim.now, mode: 'room', cityId: 'us-ny-newyork', status: 'ahead' }).length;
    expect(seen / (200 * mates.length)).toBeGreaterThan(0.07);
    expect(seen / (200 * mates.length)).toBeLessThan(0.13);
    // Played: some go to a classmate who read better, and the player's told.
    for (let n = 0; n < 60; n += 1) {
      const id = `x${n}`;
      career.auditions.push({ id, roleId: 'costar', at: sim.now + 60_000, mode: 'tape', cityId: 'us-ny-newyork', status: 'ahead' });
      sim.schedule({ at: sim.now + 60_000, kind: AUDITION_KIND, label: 'x', category: 'career', priority: 30, requiresPlayer: true, payload: { personId: sim.player.id, auditionId: id } });
      sim.player.awakeSince = sim.now - MS_HOUR;
      sim.advanceTo(sim.now + 2 * 60_000);
    }
    const lost = sim.universe.notifications.filter((x) => x.title.startsWith('The Part Went To'));
    expect(lost.length).toBeGreaterThan(0);
    const name = lost[0]!.title.replace('The Part Went To ', '');
    expect(mates.find((m) => m.name === name)!.career!.credits.some((c) => c.roleId === 'costar')).toBe(true);
  });
});

describe('the trades', () => {
  it('print the player’s signing and a notable booking, a little recognition each, and keep the latest forty', () => {
    const sim = graduated('rivals-trades');
    const a = sim.player.attrs!;
    const before = a.recognition;
    report(sim, sim.player, 'Deadline', 'Test', 'you');
    expect(a.recognition).toBeCloseTo(before + RIVALS.press, 10);
    report(sim, sim.player, 'Deadline', 'About The Class', 'class');
    expect(a.recognition).toBeCloseTo(before + RIVALS.press, 10);
    for (let n = 0; n < 50; n += 1) report(sim, sim.player, 'Playbill', `Line ${n}`, 'class');
    expect(careerOf(sim.player).news).toHaveLength(RIVALS.kept);
    expect(careerOf(sim.player).news![0]!.headline).toBe('Line 49');
    // A series regular's booking makes Deadline.
    const career = careerOf(sim.player);
    const b: Booking = { id: 'sr', roleId: 'series-hour', cityId: 'us-ny-newyork', starts: sim.now + 60 * MS_DAY, units: 13, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    career.bookings.push(b);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: 'sr' } }).ok).toBe(true);
    expect(career.news![0]).toMatchObject({ source: 'Deadline', headline: 'Ada Cole Joins A New Hour Drama As A Series Regular', about: 'you' });
    expect(ROLES.find((r) => r.id === 'series-hour')).toBeDefined();
  });
});
