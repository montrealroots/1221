/**
 * The craft's 21 skills (`content/school.ts`): listed in alphabetical order,
 * each trained by something and each read by an outcome: a part and its
 * genre, the audition itself, the showcase or the school's casting.
 */

import { describe, expect, it } from 'vitest';
import { createSave, loadSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { AGENCIES, GENRE_READS, READS } from '@/engine/content/career';
import { COURSES, SKILLS } from '@/engine/content/school';
import {
  AUDITION_KIND, CAREER_WEEK_KIND, ESTIMATE, OFFER_KIND, auditionLevel, auditionSkills, beginCareer, bookingChance, books, careerOf, growsFor, levelFor, roleById, showcaseScore, workDays,
  type Booking,
} from '@/engine/systems/career';
import { actingOf, evenCraft, meanCraft, rankIn, upgradeCraft, type Craft } from '@/engine/systems/school';

function pro(seed: string, level = 60): Simulation {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(level);
  beginCareer(sim, sim.player);
  return sim;
}

describe('the list', () => {
  it('is 21 skills in alphabetical order by name, with no name twice', () => {
    const labels = SKILLS.map((s) => s.label);
    expect(labels).toHaveLength(21);
    expect([...labels].sort((a, b) => a.localeCompare(b))).toEqual(labels);
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(21);
  });

  it('reads every skill somewhere: a part, a genre, the audition itself or a showcase scene', () => {
    const read = new Set<string>([
      ...Object.values(READS).flatMap((r) => Object.keys(r)),
      ...Object.values(GENRE_READS).flatMap((r) => Object.keys(r)),
      ...auditionSkills(roleById('costar'), 'room'), ...auditionSkills(roleById('costar'), 'tape'), ...auditionSkills(roleById('audiobook'), 'room'),
      ...ESTIMATE.showcaseSeen,
    ]);
    expect(SKILLS.map((s) => s.id).filter((id) => !read.has(id))).toEqual([]);
  });

  it('trains in Yale’s courses all but memorization, which rehearsals grow, and voice-over, which the school doesn’t teach', () => {
    const trained = new Set(COURSES.flatMap((c) => c.skills));
    expect(SKILLS.map((s) => s.id).filter((id) => !trained.has(id))).toEqual(['memorization', 'voiceover']);
  });
});

describe('a part reads what its work needs', () => {
  it('casts the screen on the camera and the booth on voice-over, and not the other way round', () => {
    const base = evenCraft(60);
    expect(levelFor({ ...base, screen: 90 }, roleById('costar'))).toBeGreaterThan(levelFor(base, roleById('costar')));
    expect(levelFor({ ...base, screen: 90 }, roleById('audiobook'))).toBe(levelFor(base, roleById('audiobook')));
    expect(levelFor({ ...base, voiceover: 90 }, roleById('audiobook'))).toBeGreaterThan(levelFor(base, roleById('audiobook')));
    expect(levelFor({ ...base, voiceover: 90 }, roleById('costar'))).toBe(levelFor(base, roleById('costar')));
  });

  it('reads the classics and a fight at a regional theater, not on Broadway', () => {
    const base = evenCraft(60);
    for (const strong of [{ ...base, classical: 90 }, { ...base, combat: 90 }]) {
      expect(levelFor(strong, roleById('lort-b'))).toBeGreaterThan(levelFor(base, roleById('lort-b')));
      expect(levelFor(strong, roleById('broadway'))).toBe(levelFor(base, roleById('broadway')));
    }
  });

  it('adds what a genre asks: singing and dance for a musical, comedy for a comedy, nothing for a thriller', () => {
    const base = evenCraft(60);
    const singer = { ...base, singing: 90, dance: 90 };
    const stage = roleById('broadway');
    expect(levelFor(singer, stage, 'musical')).toBeGreaterThan(levelFor(singer, stage, 'drama'));
    expect(levelFor(singer, stage, 'drama')).toBe(levelFor(base, stage, 'drama'));
    expect(levelFor({ ...base, comedy: 90 }, roleById('costar'), 'comedy')).toBeGreaterThan(levelFor(base, roleById('costar'), 'comedy'));
    expect(levelFor({ ...base, comedy: 90 }, roleById('costar'), 'thriller')).toBe(levelFor(base, roleById('costar')));
  });
});

describe('the audition reads its own', () => {
  it('reads cold reading in a room and not on tape, the lines learned in both, and a fifth of the read in all', () => {
    const base = evenCraft(60);
    const role = roleById('costar');
    expect(auditionLevel({ ...base, coldReading: 90 }, role, 'room')).toBeCloseTo(60 + 0.2 * 30 / 3, 10);
    expect(auditionLevel({ ...base, coldReading: 90 }, role, 'tape')).toBe(60);
    expect(auditionLevel({ ...base, memorization: 90 }, role, 'tape')).toBeCloseTo(60 + 0.2 * 30 / 2, 10);
    expect(auditionLevel({ ...base, audition: 90 }, roleById('commercial-vo'), 'room')).toBeCloseTo(60 + 0.2 * 30 / 2, 10);
    expect(auditionLevel({ ...base, memorization: 90 }, roleById('commercial-vo'), 'room')).toBe(60);
  });

  it('moves the booking roll by them, and by the genre the breakdown gives', () => {
    const base = evenCraft(60);
    const role = roleById('costar');
    expect(bookingChance({ ...base, coldReading: 90 }, role, 1, 'room')).toBeGreaterThan(bookingChance(base, role, 1, 'room'));
    expect(bookingChance({ ...base, comedy: 99 }, role, 1, 'room', true, false, 50, 'comedy')).toBeGreaterThan(bookingChance({ ...base, comedy: 99 }, role, 1, 'room', true, false, 50, 'drama'));
    // Drawn: a singer books a musical more than a drama, on the same draws.
    const sim = pro('skills-books');
    sim.player.craft = { ...evenCraft(74), singing: 99, dance: 99 };
    const count = (genre: string) => Array.from({ length: 300 }, (_, n) => books(sim, sim.player, { id: 'g' + n, roleId: 'broadway', at: 0, mode: 'room', cityId: 'us-ny-newyork', status: 'ahead', genre }, 1)).filter(Boolean).length;
    expect(count('musical')).toBeGreaterThan(count('drama'));
  });

  it('grows the audition’s own skills for having done one', () => {
    const sim = pro('skills-aud');
    const career = careerOf(sim.player);
    const before = { ...sim.player.craft! };
    career.auditions.push({ id: 'a-room', roleId: 'costar', at: sim.now + 60_000, mode: 'room', cityId: 'us-ny-newyork', status: 'ahead' });
    sim.schedule({ at: sim.now + 60_000, kind: AUDITION_KIND, label: 'Audition', category: 'career', priority: 30, requiresPlayer: true, durationMinutes: 60, payload: { personId: sim.player.id, auditionId: 'a-room' } });
    sim.advanceTo(sim.now + 2 * 60_000);
    const after = sim.player.craft!;
    for (const k of ['audition', 'coldReading', 'memorization'] as const) expect(after[k]).toBeGreaterThan(before[k]);
    expect(after.scene).toBe(before.scene);
  });

  it('knows a part’s genre from the breakdown, and the booking keeps it', () => {
    const sim = pro('skills-genre');
    const career = careerOf(sim.player);
    const agency = AGENCIES.find((a) => a.tier === 2)!;
    career.offers.push({ agencyId: agency.id, cityId: 'us-ny-newyork', until: sim.now + MS_DAY });
    expect(sim.execute({ kind: 'career.sign', payload: { agencyId: agency.id, cityId: 'us-ny-newyork' } }).ok).toBe(true);
    const week = sim.universe.scheduled.find((i) => i.kind === CAREER_WEEK_KIND && i.status === 'pending')!;
    for (let n = 0; n < 6 && career.auditions.length === 0; n += 1) sim.advanceTo(week.at + n * 7 * MS_DAY + 60_000);
    expect(career.auditions.length).toBeGreaterThan(0);
    for (const a of career.auditions) {
      const role = roleById(a.roleId);
      const hasGenres = role.medium === 'stage' || role.id === 'animation' || (role.medium === 'screen' && role.after?.kind !== 'commercial');
      expect(a.genre !== undefined, `${a.roleId}`).toBe(hasGenres);
    }
    career.auditions.push({ id: 'a-musical', roleId: 'broadway', at: sim.now, mode: 'room', cityId: 'us-ny-newyork', status: 'booked', genre: 'musical' });
    sim.schedule({ at: sim.now + 60_000, kind: OFFER_KIND, label: 'An Offer', category: 'system', priority: 20, payload: { personId: sim.player.id, auditionId: 'a-musical' } });
    sim.advanceTo(sim.now + 2 * 60_000);
    expect(career.bookings.at(-1)).toMatchObject({ roleId: 'broadway', genre: 'musical' });
  });
});

describe('work grows what it reads', () => {
  it('grows the part’s skills, the lines most for a play or a series, and none in the booth', () => {
    expect(growsFor(roleById('broadway')).memorization).toBe(0.6);
    expect(growsFor(roleById('series-hour')).memorization).toBe(0.6);
    expect(growsFor(roleById('costar')).memorization).toBe(0.3);
    expect(growsFor(roleById('audiobook')).memorization).toBeUndefined();
    expect(growsFor(roleById('costar')).scene).toBe(1);
    expect(growsFor(roleById('broadway'), 'musical').singing).toBe(1);
    expect(growsFor(roleById('broadway')).singing).toBeUndefined();
  });
});

describe('a day’s work grows its genre too', () => {
  it('grows comedy on a comedy’s set, and not on a drama’s', () => {
    const day = (genre: string) => {
      const sim = pro('skills-day-' + genre);
      const career = careerOf(sim.player);
      const b: Booking = { id: 'd1', roleId: 'costar', cityId: 'us-ny-newyork', starts: sim.now + 7 * MS_DAY, units: 1, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0, genre };
      career.bookings.push(b);
      expect(sim.execute({ kind: 'career.accept', payload: { bookingId: 'd1' } }).ok).toBe(true);
      const before = sim.player.craft!.comedy;
      const first = workDays(b)[0]!.at;
      sim.advanceTo(first - 60_000);
      sim.player.currentLocationId = 'us-ny-newyork';
      sim.advanceTo(first + 60_000);
      expect(b.worked).toBe(1);
      return sim.player.craft!.comedy - before;
    };
    expect(day('comedy')).toBeGreaterThan(0);
    expect(day('drama')).toBe(0);
  });
});

describe('a class day grows every skill its courses train', () => {
  it('grows scene study, character work and emotional access from Acting I, and improvisation from Play', () => {
    const sim = createSave(1, 'skills-class', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const before = { ...sim.player.craft! };
    while (sim.now < Date.UTC(2026, 8, 5)) sim.advanceTo(Math.min(Date.UTC(2026, 8, 5), sim.now + 6 * 3_600_000), { stopOnPlayerRequired: true });
    const after = sim.player.craft!;
    for (const k of ['scene', 'character', 'emotion', 'improv'] as const) expect(after[k], k).toBeGreaterThan(before[k]);
    expect(after.voiceover).toBe(before.voiceover);
  }, 120_000);
});

describe('acting at the heart of it', () => {
  it('is scene study twice, character work and emotional access, and the showcase reads it with what a scene shows', () => {
    const c: Craft = { ...evenCraft(50), scene: 80, character: 60, emotion: 70 };
    expect(actingOf(c)).toBe((80 * 2 + 60 + 70) / 4);
    // Voice-over and dance never show in a showcase scene; the voice does.
    expect(showcaseScore({ ...c, voiceover: 99, dance: 99 }, 1)).toBe(showcaseScore(c, 1));
    expect(showcaseScore({ ...c, voice: 99 }, 1)).toBeGreaterThan(showcaseScore(c, 1));
  });

  it('ranks a student in acting by it, apart from the craft overall', () => {
    const sim = createSave(1, 'skills-rank', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const p = sim.player;
    expect(rankIn(p, 'acting')).toBe(1);
    p.school!.classmates[0]!.craft.scene = 99;
    expect(rankIn(p, 'acting')).toBe(2);
    expect(rankIn(p)).toBe(meanCraft(p.school!.classmates[0]!.craft) > meanCraft(p.craft!) ? 2 : 1);
  });
});

describe('a save from before the 21', () => {
  it('takes each skill from the area it grew out of, for the actor, the class and the term’s start', () => {
    const sim = createSave(1, 'skills-old', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const old = { acting: 70, voice: 61, speech: 62, body: 63, text: 64, singing: 65, screen: 66 };
    const p = sim.player;
    (p as unknown as { craft: unknown }).craft = { ...old };
    (p.school!.classmates[0] as unknown as { craft: unknown }).craft = { ...old };
    (p.school!.tally as unknown as { craftAtStart: unknown }).craftAtStart = { ...old };
    const back = loadSave(JSON.parse(JSON.stringify(sim.universe))).player;
    for (const c of [back.craft!, back.school!.classmates[0]!.craft, back.school!.tally.craftAtStart]) {
      expect(c).toMatchObject({ scene: 70, emotion: 70, memorization: 70, voice: 61, voiceover: 61, speech: 62, accents: 62, movement: 63, combat: 63, script: 64, classical: 64, singing: 65, screen: 66 });
      expect(Object.keys(c).sort()).toEqual(SKILLS.map((s) => s.id).sort());
    }
    expect(upgradeCraft(back.craft!)).toBe(false);
  });
});
