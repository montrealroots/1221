/**
 * Drama school, where a life begins (`systems/school.ts`, `content/school.ts`),
 * against the David Geffen School of Drama's 2026–2027 figures, on played
 * careers: the clock sent on six hours at a time, nights slept alone.
 */
import { describe, expect, it } from 'vitest';
import { createSave, quickSave } from '@/engine';
import { atSchool, defaultConfig, newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { rentAt } from '@/engine/content/rents';
import { COST_2026_27, COURSES, SEAGULL_2027, SKILLS, WORK_STUDY, YALE_DRAMA } from '@/engine/content/school';
import {
  CALL_KIND, ESTIMATE, SHIFT_KIND, classPeriod, daysOffIn, nextClasses, evaluate, goesOn, isClassDay, isShiftDay, meanCraft, rankIn,
  sessionGain, termAccount, termStart, timetable, yearOfStudy,
} from '@/engine/systems/school';
import type { Simulation } from '@/engine/core/simulation';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
const life = (seed = 'school', extra: Record<string, unknown> = {}) =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** A life whose family's means leave need, which Yale's aid meets. */
const inNeed = (seed: string) => life(seed, { family: undefined, wealth: 'scraping' });
/** Played to a moment, six hours at a time. */
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending');
const day = (key: string) => { const [year, month, d] = key.split('-').map(Number); return { year: year!, month: month!, day: d! }; };

describe('a new life', () => {
  it('begins as a first-year actor in New Haven on the first day of the fall term, 24 August 2026', () => {
    const sim = life();
    const p = sim.player;
    expect(p.currentLocationId).toBe('us-ct-newhaven');
    expect(zonedParts(sim.now, sim.zone)).toMatchObject({ year: 2026, month: 8, day: 24 });
    expect(p.school).toMatchObject({ schoolId: 'yale-drama', classOf: 2029, termsBegun: 0, standing: 'good', castable: true });
    expect(yearOfStudy(p)).toBe(1);
    expect(titled(sim, 'Welcome To The Class Of 2029')).toHaveLength(1);
    sim.advanceTo(at(2026, 8, 24, 9) + 60_000);
    expect(p.school!.casting).toBeUndefined();
    expect(sim.universe.accounts[p.primaryAccountId!]!.institution).toBe('Chase');
  });

  it('comes from a wealthy family, with its money in the bank, and has no birthplace chosen for it', () => {
    const config = newLifeConfig();
    expect(config).toMatchObject({ homeRegionId: '', wealth: 'wealthy', family: 'wealthy' });
    const p = life().player;
    expect(p.family).toBe('wealthy');
    expect(quickSave({}, 'no-family').player.family).toBeUndefined();
  });

  it('pays New Haven’s published rent, HUD’s $1,591 for a one-bedroom and 55% of it for a room', () => {
    expect(rentAt('us-ct-newhaven', 'USD')).toMatchObject({ oneBed: 1_591_00, room: 875_05, kind: 'published' });
  });

  it('is put at the school whatever town and day a draft had', () => {
    const moved = atSchool({ ...defaultConfig(), startLocationId: 'is-39-mosfellsbr', startYear: 2027, startMonth: 3, startDay: 1 });
    expect(moved).toMatchObject({ school: 'yale-drama', startLocationId: 'us-ct-newhaven', startYear: 2026, startMonth: 8, startDay: 24, livesWhereBorn: false });
    expect(atSchool({ ...defaultConfig(), homeRegionId: 'us-ct-newhaven' }).livesWhereBorn).toBe(true);
  });

  it('isn’t at school unless it begins there, in the school’s town', () => {
    expect(quickSave({}, 'no-school').player.school).toBeUndefined();
    expect(quickSave({ school: 'yale-drama', startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork' }, 'elsewhere').player.school).toBeUndefined();
  });
});

describe('the admitted class', () => {
  it('is fifteen classmates, and the player, the faculty’s first choice, is ahead of every one in every area', () => {
    for (const seed of ['a', 'b', 'c']) {
      const p = life(seed).player;
      const mates = p.school!.classmates;
      expect(mates).toHaveLength(YALE_DRAMA.classSize - 1);
      for (const { id } of SKILLS) {
        const best = Math.max(...mates.map((m) => m.craft[id]));
        expect(p.craft![id]).toBe(Math.min(95, best + 6));
        expect(rankIn(p, id)).toBe(1);
      }
      expect(rankIn(p)).toBe(1);
      for (const m of mates) expect(meanCraft(m.craft)).toBeGreaterThan(38);
    }
    expect(life('a').player.school!.classmates).toEqual(life('a').player.school!.classmates);
    expect(life('a').player.school!.classmates).not.toEqual(life('b').player.school!.classmates);
  });

  it('grows less from a session the better it already is, and more for coming ready', () => {
    expect(sessionGain(40, 1)).toBeCloseTo(0.55 * 0.6 ** 1.5, 10);
    expect(sessionGain(80, 1)).toBeLessThan(sessionGain(40, 1));
    expect(sessionGain(50, 1.2)).toBeGreaterThan(sessionGain(50, 0.3));
    expect(sessionGain(100, 1)).toBe(0);
  });
});

describe('money', () => {
  it('meets tuition for everyone, and living costs only where the family’s means leave need', () => {
    const need = termAccount('USD');
    expect(need).toEqual({ tuition: COST_2026_27.tuition / 2, healthPlan: 1_882_00, livingScholarship: 15_200_50, refund: 13_318_50 });
    const none = termAccount('USD', false);
    expect(none).toEqual({ tuition: COST_2026_27.tuition / 2, healthPlan: 1_882_00, livingScholarship: 0, refund: -1_882_00 });
  });

  it('takes a wealthy family’s student’s health plan from the bank at nine on the first day of term, and pays in no scholarship', () => {
    const sim = life('wealthy');
    sim.advanceTo(at(2026, 8, 24, 9) - 60_000);
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('Yale Health plan'))).toEqual([]);
    sim.advanceTo(at(2026, 8, 24, 9) + 60_000);
    const plan = sim.universe.transactions.filter((t) => t.memo.startsWith('Yale Health plan'));
    expect(plan).toHaveLength(1);
    expect(plan[0]!.at).toBe(at(2026, 8, 24, 9));
    expect(sim.universe.transactions.filter((t) => t.category === 'scholarship')).toEqual([]);
    expect(sim.player.school!.termsBegun).toBe(1);
  });

  it('pays a student in need the rest of the living scholarship each term, and takes nothing from the bank for the plan', () => {
    const sim = inNeed('need');
    const current = sim.universe.accounts[sim.player.primaryAccountId!]!;
    sim.advanceTo(at(2027, 1, 4, 9) + 60_000);
    const paid = sim.universe.transactions.filter((t) => t.category === 'scholarship');
    expect(paid.map((t) => t.at)).toEqual([at(2026, 8, 24, 9), at(2027, 1, 4, 9)]);
    expect(paid.map((t) => t.postings.find((q) => q.accountId === current.id)?.amount)).toEqual([13_318_50, 13_318_50]);
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('Yale Health plan'))).toEqual([]);
  });
});

describe('the calendar', () => {
  it('runs six terms, the later ones on SLATE’s estimated dates', () => {
    expect([0, 1].map((t) => termStart(t))).toEqual([
      { date: { year: 2026, month: 8, day: 24 }, estimate: false, fall: true },
      { date: { year: 2027, month: 1, day: 4 }, estimate: false, fall: false },
    ]);
    expect([2, 3, 4, 5].map((t) => termStart(t).date)).toEqual([
      { year: 2027, month: 8, day: 23 }, { year: 2028, month: 1, day: 3 }, { year: 2028, month: 8, day: 28 }, { year: 2029, month: 1, day: 8 },
    ]);
  });

  it('has classes on the Bulletin’s class days, and none on its holidays, Community Days, work periods and recesses', () => {
    expect(classPeriod(0)).toMatchObject({ from: day('2026-08-31'), to: day('2026-12-11'), estimate: false });
    expect(isClassDay(0, day('2026-08-31'))).toBe(true);
    expect(isClassDay(0, day('2026-08-28'))).toBe(false);
    expect(isClassDay(0, day('2026-09-07'))).toBe(false);
    expect(isClassDay(0, day('2026-09-08'))).toBe(true);
    expect(isClassDay(0, day('2026-09-30'))).toBe(false);
    expect(isClassDay(0, day('2026-10-22'))).toBe(false);
    expect(isClassDay(0, day('2026-11-25'))).toBe(false);
    expect(isClassDay(0, day('2026-12-12'))).toBe(false);
    expect(isClassDay(1, day('2027-03-10'))).toBe(false);
    expect(isShiftDay(0, day('2026-09-05'))).toBe(true);
    expect(isShiftDay(0, day('2026-10-24'))).toBe(false);
    expect(isShiftDay(0, day('2026-09-06'))).toBe(false);
    expect(classPeriod(2)).toMatchObject({ from: day('2027-08-30'), to: day('2027-12-10'), estimate: true });
  });

  it('finds the next classes past the week the calendar holds, and counts only a term’s own breaks', () => {
    expect(nextClasses(at(2026, 8, 24, 7))).toBe(at(2026, 8, 31, 9));
    expect(nextClasses(at(2026, 8, 31, 9))).toBe(at(2026, 9, 1, 9));
    expect(nextClasses(at(2026, 9, 4, 12))).toBe(at(2026, 9, 8, 9));
    expect(nextClasses(at(2026, 12, 11, 12))).toBe(at(2027, 1, 11, 9));
    expect(daysOffIn(0)).toBe(6);
    expect(daysOffIn(1)).toBe(4);
  });

  it('fits each term’s required courses into three meetings a day, fifteen a week, none twice in a day where it can be helped', () => {
    for (const year of [1, 2, 3] as const) {
      for (const term of ['fall', 'spring'] as const) {
        const week = timetable(year, term);
        expect(week.map((d) => d.length)).toEqual([3, 3, 3, 3, 3]);
        const running = COURSES.filter((c) => c.year === year && c.terms.includes(term));
        for (const course of running) expect(week.flat().filter((c) => c === course)).toHaveLength(course.perWeek);
        for (const d of week) expect(new Set(d).size).toBe(d.length);
      }
    }
  });
});

describe('classes', () => {
  it('grow the craft of a student who’s there and awake, and tire them', () => {
    const sim = life('class');
    play(sim, at(2026, 8, 31, 8));
    const before = { ...sim.player.craft! };
    const energy = sim.player.wellbeing.energy;
    const classBefore = sim.player.school!.classmates.map((m) => meanCraft(m.craft));
    sim.advanceTo(at(2026, 8, 31, 9) + 60_000);
    const grew = sim.player.school!.classmates.filter((m, i) => meanCraft(m.craft) > classBefore[i]!).length;
    expect(grew).toBeGreaterThanOrEqual(12);
    const t = sim.player.school!.tally;
    expect(t).toMatchObject({ classDays: 1, attended: 1 });
    expect(meanCraft(sim.player.craft!)).toBeGreaterThan(meanCraft(before));
    expect(sim.player.wellbeing.energy).toBeLessThan(energy);
    expect(titled(sim, 'You Missed Classes')).toEqual([]);
  });

  it('grow a rested student more than an exhausted one, and take energy beyond the hours awake', () => {
    const rested = life('rest');
    const spent = life('rest');
    const away = life('rest');
    for (const sim of [rested, spent, away]) play(sim, at(2026, 8, 31, 8));
    spent.player.wellbeing.energy = 5;
    spent.player.wellbeing.sleepDebt = 20;
    away.player.currentLocationId = 'us-ny-newyork';
    const start = meanCraft(rested.player.craft!);
    expect(meanCraft(spent.player.craft!)).toBe(start);
    for (const sim of [rested, spent, away]) sim.advanceTo(at(2026, 8, 31, 9) + 60_000);
    expect(meanCraft(rested.player.craft!) - start).toBeGreaterThan(2 * (meanCraft(spent.player.craft!) - start));
    expect(away.player.wellbeing.energy - rested.player.wellbeing.energy).toBeCloseTo(ESTIMATE.energy.classes, 0);
  });

  it('count a student out of New Haven as absent, grow nothing, and say so; calling in sick excuses it only when unwell', () => {
    const sim = life('away');
    play(sim, at(2026, 8, 31, 8));
    sim.player.currentLocationId = 'us-ny-newyork';
    const before = { ...sim.player.craft! };
    sim.advanceTo(at(2026, 8, 31, 9) + 60_000);
    expect(sim.player.school!.tally).toMatchObject({ classDays: 1, attended: 0, excused: 0 });
    expect(sim.player.craft).toEqual(before);
    expect(titled(sim, 'You Missed Classes')).toHaveLength(1);

    play(sim, at(2026, 9, 1, 8));
    sim.player.wellbeing.condition = ESTIMATE.sickBelow;
    expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).ok).toBe(false);
    sim.player.wellbeing.condition = ESTIMATE.sickBelow - 1;
    expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).ok).toBe(true);
    sim.advanceTo(at(2026, 9, 1, 9) + 60_000);
    expect(sim.player.school!.tally).toMatchObject({ classDays: 2, attended: 0, excused: 1 });
    expect(titled(sim, 'You Missed Classes')).toHaveLength(1);
  });

  it('can’t be called in sick from on a day without them', () => {
    const sim = life('weekend');
    play(sim, at(2026, 9, 5, 8));
    sim.player.wellbeing.condition = 10;
    expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).ok).toBe(false);
  });
});

describe('work-study', () => {
  it('works six hours each class-week Saturday and pays them on the Friday, as wages a bank counts', () => {
    const sim = life('work');
    play(sim, at(2026, 9, 5, 17));
    expect(sim.player.school!.workStudy).toMatchObject({ yearHours: 6, owedHours: 6 });
    play(sim, at(2026, 9, 11, 17) + 60_000);
    const pay = sim.universe.transactions.filter((t) => t.memo.startsWith('Work-study wages'));
    expect(pay).toHaveLength(1);
    expect(pay[0]!.category).toBe('salary');
    expect(pay[0]!.postings.find((q) => q.accountId === sim.player.primaryAccountId)?.amount).toBe(6 * WORK_STUDY.hourly);
    expect(sim.player.school!.workStudy.owedHours).toBe(0);
  });

  it('doesn’t pay a shift a student isn’t there for, and counts the miss', () => {
    const sim = life('skip');
    play(sim, at(2026, 9, 5, 9));
    sim.player.currentLocationId = 'us-ny-newyork';
    sim.advanceTo(at(2026, 9, 5, 11));
    expect(sim.player.school!.workStudy.owedHours).toBe(0);
    expect(sim.player.school!.tally).toMatchObject({ shifts: 1, worked: 0 });
  });

  it('takes elective evenings of four hours on request, up to fifty hours a year', () => {
    const sim = life('elective');
    const first = sim.execute<{ at: number }>({ kind: 'school.take_shift', payload: {} });
    expect(first.ok).toBe(true);
    expect(zonedParts(first.value!.at, zone)).toMatchObject({ hour: 19 });
    expect(sim.player.school!.workStudy.electiveHours).toBe(4);
    sim.player.school!.workStudy.electiveHours = WORK_STUDY.electiveHours - 2;
    expect(sim.execute({ kind: 'school.take_shift', payload: {} }).ok).toBe(false);
    sim.player.school!.workStudy.electiveHours = WORK_STUDY.electiveHours - 4;
    expect(sim.execute({ kind: 'school.take_shift', payload: {} }).ok).toBe(true);
    const evenings = pending(sim, SHIFT_KIND).filter((i) => i.payload.elective === true).map((i) => i.at);
    expect(evenings).toHaveLength(2);
    expect(evenings[1]! - evenings[0]!).toBeGreaterThanOrEqual(MS_DAY);
    // Worked, the first is paid hours and isn't an assigned shift; missed, the second's hours can be asked for again.
    sim.player.school!.workStudy.electiveHours = 8;
    sim.advanceTo(evenings[0]! + 60_000);
    expect(sim.player.school!.workStudy).toMatchObject({ owedHours: 4, electiveHours: 8 });
    expect(sim.player.school!.tally).toMatchObject({ shifts: 0, worked: 0 });
    sim.player.currentLocationId = 'us-ny-newyork';
    sim.advanceTo(evenings[1]! + 60_000);
    expect(sim.player.school!.workStudy).toMatchObject({ owedHours: 4, electiveHours: 4 });
  });
});

describe('casting', () => {
  it('casts the class’s best actor in good standing to understudy at Yale Rep in the first spring, on call at every performance', () => {
    const sim = life('seagull');
    sim.advanceTo(at(2027, 1, 4, 9) + 60_000);
    const casting = sim.player.school!.casting!;
    expect(casting).toMatchObject({ production: SEAGULL_2027.name, kind: 'understudy', term: 1 });
    expect(['Nina', 'Konstantin']).toContain(casting.role);
    const calls = pending(sim, CALL_KIND);
    const rehearsals = calls.filter((c) => c.payload.call === 'rehearsal');
    const onCall = calls.filter((c) => c.payload.call === 'oncall');
    expect(rehearsals.length).toBe(11);
    expect(rehearsals.every((c) => c.requiresPlayer)).toBe(true);
    expect(onCall.length).toBe(20);
    expect(onCall.every((c) => !c.requiresPlayer)).toBe(true);
  });

  it('doesn’t send a student out of good standing to Yale Rep, however good', () => {
    const sim = life('concern');
    play(sim, at(2027, 1, 4, 8));
    sim.player.school!.standing = 'concern';
    sim.advanceTo(at(2027, 1, 4, 9) + 60_000);
    expect(sim.player.school!.casting).toMatchObject({ kind: 'project' });
  });

  it('casts anybody else in a School project, with rehearsals and three performances before the classes end', () => {
    const sim = life('project');
    sim.player.school!.classmates[0]!.craft.acting = 99;
    sim.advanceTo(at(2027, 1, 4, 9) + 60_000);
    expect(sim.player.school!.casting).toMatchObject({ production: 'Spring Project', kind: 'project' });
    const shows = pending(sim, CALL_KIND).filter((c) => c.payload.call === 'performance');
    expect(shows.map((c) => zonedParts(c.at, zone))).toMatchObject([{ month: 4, day: 20, hour: 19 }, { month: 4, day: 21 }, { month: 4, day: 22 }]);
  });

  it('takes an actor out of the pool after missed rehearsal calls, and a missed performance is a grave breach', () => {
    const sim = life('breach');
    sim.player.school!.classmates[0]!.craft.acting = 99;
    sim.advanceTo(at(2027, 1, 4, 9) + 60_000);
    const rehearsals = pending(sim, CALL_KIND).filter((c) => c.payload.call === 'rehearsal');
    sim.player.currentLocationId = 'us-ny-newyork';
    sim.advanceTo(rehearsals[1]!.at + 60_000);
    expect(sim.player.school!.castable).toBe(false);
    expect(titled(sim, 'Out Of The Casting Pool')).toHaveLength(1);
    const show = pending(sim, CALL_KIND).find((c) => c.payload.call === 'performance')!;
    sim.advanceTo(show.at - 60_000);
    sim.advanceTo(show.at + 60_000);
    expect(sim.player.school!.standing).toBe('warning');
    expect(sim.player.school!.tally.breaches).toBe(1);
  });

  it('sends an understudy on when the night calls for it, and grows them; away that night, it’s a grave breach', () => {
    const cast = (seed: string) => {
      const sim = life(seed);
      sim.advanceTo(at(2027, 1, 4, 9) + 60_000);
      const night = pending(sim, CALL_KIND).find((c) => c.payload.call === 'oncall' && goesOn(sim, sim.player, c.at));
      return night ? { sim, night } : undefined;
    };
    const found = ['on-1', 'on-2', 'on-3', 'on-4', 'on-5', 'on-6', 'on-7', 'on-8', 'on-9'].map(cast).filter(Boolean);
    expect(found.length).toBeGreaterThanOrEqual(2);
    const { sim, night } = found[0]!;
    sim.advanceTo(night.at - 60_000);
    const acting = sim.player.craft!.acting;
    sim.advanceTo(night.at + 60_000);
    expect(sim.player.school!.casting!.performed).toBe(1);
    expect(sim.player.craft!.acting).toBeGreaterThan(acting);
    expect(titled(sim, `You Went On As ${sim.player.school!.casting!.role}`)).toHaveLength(1);
    const away = found[1]!;
    away.sim.advanceTo(away.night.at - 60_000);
    away.sim.player.school!.standing = 'warning';
    away.sim.player.currentLocationId = 'us-ny-newyork';
    away.sim.advanceTo(away.night.at + 60_000);
    expect(away.sim.player.school!.standing).toBe('dismissed');
    expect(away.sim.player.school!.casting!.performed).toBe(0);
  }, 60_000);

  it('sends an understudy on about one performance in fifty', () => {
    const sim = life('odds');
    let on = 0;
    for (let n = 0; n < 20_000; n += 1) if (goesOn(sim, sim.player, sim.now + n * MS_DAY)) on += 1;
    expect(on / 20_000).toBeGreaterThan(0.015);
    expect(on / 20_000).toBeLessThan(0.025);
  });
});

describe('evaluation', () => {
  it('holds a student who was there and grew in good standing at the end of the fall term’s classes', () => {
    const sim = life('fall');
    play(sim, at(2026, 12, 11, 17) + 60_000);
    const review = sim.player.school!.history[0]!;
    expect(review).toMatchObject({ term: 0, standing: 'good', attendance: 1 });
    expect(review.growth).toBeGreaterThan(ESTIMATE.growthFloor * review.classGrowth);
    expect(titled(sim, 'In Good Standing')).toHaveLength(1);
    expect(sim.player.school!.tally.classDays).toBe(0);
  });

  it('steps standing down for short attendance, concern to warning to dismissal, and dismissal lets the calendar go', () => {
    const sim = life('fall-down');
    const p = sim.player;
    const short = () => { Object.assign(p.school!.tally, { classDays: 20, attended: 10, excused: 0 }); };
    short();
    expect(evaluate(sim, p, 0)!.standing).toBe('concern');
    short();
    expect(evaluate(sim, p, 1)!.standing).toBe('warning');
    short();
    expect(evaluate(sim, p, 2)!.standing).toBe('dismissed');
    expect(sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind.startsWith('school.') && i.kind !== 'school.payday')).toEqual([]);
    expect(evaluate(sim, p, 3)).toBeUndefined();
  });

  it('holds no Commencement for a student dismissed at the last evaluation', () => {
    const sim = life('last');
    const p = sim.player;
    p.school!.standing = 'warning';
    Object.assign(p.school!.tally, { classDays: 20, attended: 10, excused: 0 });
    expect(evaluate(sim, p, 5)!.standing).toBe('dismissed');
    expect(pending(sim, 'school.commencement')).toEqual([]);
  });

  it('counts a student who grew under half the class’s median as short, and a good term restores standing and the pool', () => {
    const sim = life('stall');
    const p = sim.player;
    p.school!.classmates.forEach((m) => { m.craft.acting += 7; });
    expect(evaluate(sim, p, 0)!.standing).toBe('concern');
    p.school!.castable = false;
    p.craft!.acting += 7;
    p.school!.classmates.forEach((m) => { m.craft.acting += 7; });
    expect(evaluate(sim, p, 1)!.standing).toBe('good');
    expect(p.school!.castable).toBe(true);
  });

  it('confers the MFA at Commencement after six terms in standing', () => {
    const sim = life('degree');
    play(sim, at(2029, 5, 29, 12));
    const school = sim.player.school!;
    expect(school.history.map((r) => r.standing)).toEqual(['good', 'good', 'good', 'good', 'good', 'good']);
    expect(school.standing).toBe('graduated');
    expect(school.termsBegun).toBe(6);
    expect(yearOfStudy(sim.player)).toBe(3);
    expect(school.workStudy.yearHours).toBeGreaterThan(100);
    expect(school.workStudy.yearHours).toBeLessThanOrEqual(WORK_STUDY.assignedHours + WORK_STUDY.electiveHours);
    expect(titled(sim, 'Your MFA Is Conferred')).toHaveLength(1);
    expect(sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind.startsWith('school.')).map((i) => i.kind + ' ' + i.label)).toEqual([]);
  }, 120_000);
});
