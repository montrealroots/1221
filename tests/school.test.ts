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
import { COST_2026_27, COURSES, LABS, SEAGULL_2027, SKILLS, SUMMER_CABARET, WORK_STUDY, YALE_CABARET, YALE_DRAMA } from '@/engine/content/school';
import {
  CABARET_KIND, CALL_KIND, ESTIMATE, cabaretRefusal, LAB_KIND, cabaretEvenings, labDays, rehearsalDays, repTerm, schoolProduction, SHIFT_KIND, STIPEND_KIND, SUMMER_KIND, cabaretSeason, cabaretWeek, summerOf, classPeriod, summerRuns, daysOffIn, nextClasses, evaluate, goesOn, isClassDay, isShiftDay, meanCraft, rankIn,
  sessionGain, termAccount, termStart, timetable, yearOfStudy,
} from '@/engine/systems/school';
import type { Simulation } from '@/engine/core/simulation';
import { careFor, healthOf } from '@/engine/systems/health';
import { figuresFor } from '@/engine/systems/taxreturn';
import { SHOWCASE_KIND, bookShowcase, careerOf } from '@/engine/systems/career';
import { TURNS } from '@/engine/systems/enjoyment';
import { CARE } from '@/engine/content/safetynet';

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

describe('one student, one calendar', () => {
  it('never calls a student to two places at once, Yale Rep and their own production, second year or third', () => {
    for (const term of [2, 4]) {
      const sim = life(`both-${term}`);
      sim.player.craft!.acting = 95;
      sim.schedule({ at: sim.now + 60_000, kind: 'school.term', label: 'A Term Begins', category: 'school', priority: 30, payload: { personId: sim.player.id, term } });
      sim.advanceTo(sim.now + 2 * 60_000);
      const calls = pending(sim, CALL_KIND).sort((a, b) => a.at - b.at);
      expect(calls.some((c) => c.payload.which === 'rep')).toBe(true);
      expect(calls.some((c) => c.payload.which !== 'rep')).toBe(true);
      let end = 0;
      for (const c of calls) {
        expect(c.at).toBeGreaterThanOrEqual(end);
        end = Math.max(end, c.at + c.durationMinutes! * 60_000);
      }
    }
  });

  it('calls off a night on call the understudy wasn’t needed for, and excuses a rehearsal on a day called in sick', () => {
    const sim = life('seagull-off');
    sim.advanceTo(at(2027, 1, 4, 9) + 60_000);
    const calls = pending(sim, CALL_KIND).filter((c) => c.payload.which === 'rep').sort((a, b) => a.at - b.at);
    const onCall = calls.filter((c) => c.payload.call === 'oncall');
    const rehearsal = calls.find((c) => c.payload.call === 'rehearsal')!;
    const school = sim.player.school!;
    const p = zonedParts(rehearsal.at, zone);
    school.sickDay = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
    const before = school.tally.calls;
    sim.advanceTo(rehearsal.at + 60_000);
    expect(rehearsal.status).toBe('missed');
    expect(school.tally.calls).toBe(before);
    // Every night on call, played to its end: one not needed is called off, and holds nothing after.
    for (const night of onCall) {
      sim.player.awakeSince = night.at - MS_HOUR;
      sim.player.currentLocationId = 'us-ct-newhaven';
      sim.advanceTo(night.at + 60_000);
    }
    const needed = onCall.filter((n) => n.status === 'done').length;
    expect(onCall.filter((n) => n.status === 'cancelled').length).toBe(onCall.length - needed);
    expect(onCall.length - needed).toBeGreaterThan(0);
    expect(school.rep!.performed).toBe(needed);
  }, 180_000);

  it('excuses a lab missed in hospital, and a call on a day called in sick', () => {
    const sim = life('lab-ward');
    sim.advanceTo(at(2026, 8, 24, 9) + 60_000);
    const labs = pending(sim, LAB_KIND).sort((a, b) => a.at - b.at);
    expect(labs.length).toBeGreaterThan(1);
    const school = sim.player.school!;
    healthOf(sim.player).inHospitalUntil = labs[0]!.at + MS_HOUR;
    sim.advanceTo(labs[0]!.at + 60_000);
    expect(school.tally.calls).toBe(0);
    healthOf(sim.player).inHospitalUntil = undefined;
    const p = zonedParts(labs[1]!.at, zone);
    school.sickDay = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
    sim.advanceTo(labs[1]!.at + 60_000);
    expect(school.tally.calls).toBe(0);
    expect(labs[1]!.status).toBe('missed');
  });

  it('lets a dismissed student’s showcases go with the school’s calendar', () => {
    const sim = life('show-gone');
    bookShowcase(sim, sim.player);
    expect(pending(sim, SHOWCASE_KIND).length).toBe(2);
    const p = sim.player;
    for (const term of [0, 1, 2]) { Object.assign(p.school!.tally, { classDays: 20, attended: 10, excused: 0 }); evaluate(sim, p, term); }
    expect(p.school!.standing).toBe('dismissed');
    expect(pending(sim, SHOWCASE_KIND)).toHaveLength(0);
  });

  it('won’t move a student away from New Haven in term', () => {
    const sim = life('stay-put');
    sim.advanceTo(at(2026, 8, 24, 9) + 60_000);
    const no = sim.execute({ kind: 'career.relocate', payload: { cityId: 'us-ny-newyork', kind: 'shared' } });
    expect(no.ok).toBe(false);
    expect(no.error).toMatch(/waits for the summer/);
  });

  it('offers no Cabaret show where no week can be, in a term’s last three weeks', () => {
    const sim = life('cab-late');
    play(sim, at(2026, 11, 25, 12));
    expect(cabaretRefusal(sim, sim.player)).toMatch(/No Cabaret week/);
    expect(sim.execute({ kind: 'school.cabaret', payload: {} }).ok).toBe(false);
  }, 180_000);
});

describe('a new life', () => {
  it('begins as a first-year actor in New Haven on the first day of the fall term, 24 August 2026', () => {
    const sim = life();
    const p = sim.player;
    expect(p.currentLocationId).toBe('us-ct-newhaven');
    expect(zonedParts(sim.now, sim.zone)).toMatchObject({ year: 2026, month: 8, day: 24 });
    expect(p.school).toMatchObject({ classOf: 2029, termsBegun: 0, standing: 'good', castable: true });
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
    // The US taxes all of it but the books, half a year's a term.
    expect(need).toEqual({ tuition: COST_2026_27.tuition / 2, healthPlan: 1_882_00, livingScholarship: 15_200_50, refund: 13_318_50, taxable: 15_200_50 - COST_2026_27.books / 2 });
    const none = termAccount('USD', false);
    expect(none).toEqual({ tuition: COST_2026_27.tuition / 2, healthPlan: 1_882_00, livingScholarship: 0, refund: -1_882_00, taxable: 0 });
  });

  it('counts a student in need’s living-expense scholarship, but for the books, as income the year’s return taxes', () => {
    const sim = inNeed('taxed');
    expect(sim.universe.scheduled.some((i) => i.kind === 'tax.season' && i.status === 'pending')).toBe(true);
    sim.advanceTo(at(2026, 8, 24, 9) + 60_000);
    const y = sim.player.earnings!.years[2026]!;
    expect(y.scholarship).toBe(termAccount('USD', true, 0).taxable);
    expect(figuresFor(sim.player, 2026).income).toBeGreaterThanOrEqual(y.scholarship!);
    expect(figuresFor(sim.player, 2026).scholarship).toBe(y.scholarship);
    // No need, no scholarship, nothing counted.
    const rich = life('untaxed');
    rich.advanceTo(at(2026, 8, 24, 9) + 60_000);
    expect(rich.player.earnings?.years[2026]?.scholarship ?? 0).toBe(0);
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

  it('excuse a day in hospital, as a sick day called in', () => {
    const sim = life('ward');
    play(sim, at(2026, 8, 31, 8));
    healthOf(sim.player).inHospitalUntil = at(2026, 8, 31, 18);
    sim.advanceTo(at(2026, 8, 31, 9) + 60_000);
    expect(sim.player.school!.tally).toMatchObject({ classDays: 1, attended: 0, excused: 1 });
    expect(titled(sim, 'You Missed Classes')).toHaveLength(0);
  });

  it('excuse a student down with the flu, whatever the condition reads', () => {
    const sim = life('flu');
    play(sim, at(2026, 9, 1, 8));
    sim.player.wellbeing.condition = ESTIMATE.sickBelow + 20;
    expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).ok).toBe(false);
    careFor(sim, sim.player, { care: 'visit', what: 'The flu', flu: true }, sim.now);
    expect(healthOf(sim.player).fluUntil).toBe(sim.now + CARE.fluDays * MS_DAY);
    sim.player.wellbeing.condition = ESTIMATE.sickBelow + 20;
    expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).ok).toBe(true);
  });

  it('can’t be called in sick once the day’s classes have run', () => {
    const sim = life('sick-late');
    play(sim, at(2026, 9, 1, 8));
    sim.player.wellbeing.condition = ESTIMATE.sickBelow - 10;
    sim.advanceTo(at(2026, 9, 1, 12));
    const late = sim.execute({ kind: 'school.call_in_sick', payload: {} });
    expect(late.ok).toBe(false);
    expect(late.error).toMatch(/been and gone/);
  });

  it('can’t be called in sick from on a day without them', () => {
    const sim = life('weekend');
    play(sim, at(2026, 9, 5, 8));
    sim.player.wellbeing.condition = 10;
    expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).ok).toBe(false);
  });
});

describe('illness at school', () => {
  it('comes at school too, with Yale Health leaving $200 an admission, and a stay in hospital keeps them from class', () => {
    const sim = life('ill');
    expect(sim.universe.scheduled.some((i) => i.kind === 'health.week' && i.status === 'pending')).toBe(true);
    play(sim, at(2026, 8, 31, 8));
    const bill = careFor(sim, sim.player, { care: 'stay', what: 'A stay in hospital' }, sim.now);
    expect(bill!.amount).toBe(200_00);
    sim.advanceTo(at(2026, 8, 31, 9) + 60_000);
    expect(sim.player.school!.tally).toMatchObject({ classDays: 1, attended: 0 });
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

  it('doesn’t count a shift missed in hospital against the student, and frees an elective evening’s hours', () => {
    const sim = life('ward-shift');
    play(sim, at(2026, 9, 5, 9));
    healthOf(sim.player).inHospitalUntil = at(2026, 9, 5, 18);
    sim.advanceTo(at(2026, 9, 5, 11));
    expect(sim.player.school!.tally).toMatchObject({ shifts: 0, worked: 0 });
    expect(titled(sim, 'You Missed A Work-Study Shift')).toHaveLength(0);
    const evening = sim.execute<{ at: number }>({ kind: 'school.take_shift', payload: {} }).value!.at;
    healthOf(sim.player).inHospitalUntil = evening + MS_HOUR;
    sim.advanceTo(evening + 60_000);
    expect(sim.player.school!.workStudy.electiveHours).toBe(0);
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
  it('casts a first-year in good standing to understudy at Yale Rep in the first spring, beside the Carlotta Festival, on call at every performance', () => {
    const sim = life('seagull');
    sim.advanceTo(at(2027, 1, 4, 9) + 60_000);
    const casting = sim.player.school!.rep!;
    expect(casting).toMatchObject({ production: SEAGULL_2027.name, kind: 'understudy', term: 1 });
    expect(['Nina', 'Konstantin']).toContain(casting.role);
    expect(sim.player.school!.casting).toMatchObject({ production: 'Carlotta Festival Of New Plays', kind: 'carlotta' });
    const calls = pending(sim, CALL_KIND).filter((c) => c.payload.which === 'rep');
    const rehearsals = calls.filter((c) => c.payload.call === 'rehearsal');
    const onCall = calls.filter((c) => c.payload.call === 'oncall');
    expect(rehearsals.length).toBe(11);
    expect(rehearsals.every((c) => c.requiresPlayer)).toBe(true);
    expect(onCall.length).toBe(20);
    // A night on call is held for the Rep: the calendar flags a clash with it.
    expect(onCall.every((c) => c.requiresPlayer)).toBe(true);
  });

  it('doesn’t send a student out of good standing to Yale Rep, however good', () => {
    const sim = life('concern');
    play(sim, at(2027, 1, 4, 8));
    sim.player.school!.standing = 'concern';
    sim.advanceTo(at(2027, 1, 4, 9) + 60_000);
    expect(sim.player.school!.rep).toBeUndefined();
    expect(sim.player.school!.casting).toMatchObject({ kind: 'carlotta' });
  });

  it('clears last term’s Yale Rep assignment in a term without one, so nothing goes on the résumé twice', () => {
    const sim = life('rep-cleared');
    play(sim, at(2027, 9, 1, 12));
    expect(sim.player.school!.rep).toBeDefined();
    play(sim, at(2028, 1, 10, 12));
    expect(sim.player.school!.rep).toBeUndefined();
    const credits = sim.player.school!.credits ?? [];
    expect(new Set(credits.map((c) => c.production)).size).toBe(credits.length);
  }, 300_000);

  it('casts a first-year’s spring in the Carlotta Festival: rehearsals Tuesday to Friday from mid-April, four performances in early May', () => {
    const sim = life('project');
    sim.player.school!.classmates[0]!.craft.acting = 99;
    sim.advanceTo(at(2027, 1, 4, 9) + 60_000);
    const mine = pending(sim, CALL_KIND).filter((c) => c.payload.which !== 'rep');
    const shows = mine.filter((c) => c.payload.call === 'performance');
    expect(shows.map((c) => zonedParts(c.at, zone))).toMatchObject([{ month: 5, day: 4, hour: 19 }, { month: 5, day: 6 }, { month: 5, day: 9 }, { month: 5, day: 12 }]);
    const rehearsals = mine.filter((c) => c.payload.call === 'rehearsal');
    expect(rehearsals.length).toBe(12);
    expect(rehearsals.every((c) => { const wd = new Date(c.at).getUTCDay(); return wd >= 2 && wd <= 5; })).toBe(true);
  });

  it('gives each later term a production by year and standing: a thesis or the Hughes Festival, the January thesis or Carlotta, and a Shakespeare project', () => {
    expect(schoolProduction(0, 1)).toBeUndefined();
    expect(schoolProduction(2, 1)).toMatchObject({ kind: 'thesis', name: 'Directors’ Thesis Production I', runs: expect.arrayContaining([{ year: 2027, month: 10, day: 9 }]) });
    expect(schoolProduction(2, 9)).toMatchObject({ kind: 'hughes', runs: [{ year: 2027, month: 11, day: 5 }, { year: 2027, month: 11, day: 6 }, { year: 2027, month: 11, day: 7 }] });
    expect(schoolProduction(3, 8)).toMatchObject({ kind: 'thesis', runs: expect.arrayContaining([{ year: 2028, month: 1, day: 23 }]) });
    expect(schoolProduction(3, 9)).toMatchObject({ kind: 'carlotta' });
    expect(schoolProduction(4, 3)).toMatchObject({ kind: 'thesis', runs: expect.arrayContaining([{ year: 2028, month: 11, day: 14 }]) });
    expect(schoolProduction(4, 16)).toMatchObject({ kind: 'hughes' });
    expect(schoolProduction(5, 5)!.name).toBe('Shakespeare Repertory Project I');
    expect(schoolProduction(5, 6)!.name).toBe('Shakespeare Repertory Project II');
    expect(schoolProduction(5, 11)).toMatchObject({ name: 'Shakespeare Repertory Project III', runs: [{ year: 2029, month: 4, day: 2 }, { year: 2029, month: 4, day: 3 }] });
    expect(schoolProduction(6, 1)).toBeUndefined();
    const key = (d: { year: number; month: number; day: number }) => `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
    // The January thesis rehearses from the spring term's start, not over the winter break.
    const jan = schoolProduction(3, 1)!;
    expect(rehearsalDays(3, jan.runs[0]!, jan.weeks).every((d) => key(d) >= key(termStart(3).date))).toBe(true);
    // The last Shakespeare project's weeks skip the spring recess.
    const april = schoolProduction(5, 11)!;
    const off = classPeriod(5).off;
    const days = rehearsalDays(5, april.runs[0]!, april.weeks);
    expect(days.some((d) => off.some(([a, b]) => key(d) >= a && key(d) <= b))).toBe(false);
    expect(days.length).toBeLessThan(4 * april.weeks);
    // Yale Rep once a year.
    expect([0, 1, 2, 3, 4, 5].map(repTerm)).toEqual([false, true, true, false, true, false]);
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
    sim.player.wellbeing.morale = 50;
    sim.advanceTo(show.at + 60_000);
    expect(sim.player.school!.standing).toBe('warning');
    // And felt.
    expect(sim.player.wellbeing.morale).toBeLessThan(50 + TURNS.warning.morale / 2);
    expect(sim.player.school!.tally.breaches).toBe(1);
  });

  it('covers a performance and a rehearsal missed in hospital, with no breach and no call counted', () => {
    const sim = life('ward-show');
    sim.player.school!.classmates[0]!.craft.acting = 99;
    sim.advanceTo(at(2027, 1, 4, 9) + 60_000);
    const rehearsal = pending(sim, CALL_KIND).find((c) => c.payload.call === 'rehearsal')!;
    const calls = sim.player.school!.tally.calls;
    healthOf(sim.player).inHospitalUntil = rehearsal.at + 60 * 60_000;
    sim.advanceTo(rehearsal.at + 60_000);
    expect(sim.player.school!.tally.calls).toBe(calls);
    const show = pending(sim, CALL_KIND).find((c) => c.payload.call === 'performance')!;
    sim.advanceTo(show.at - 60_000);
    healthOf(sim.player).inHospitalUntil = show.at + 60 * 60_000;
    sim.advanceTo(show.at + 60_000);
    expect(sim.player.school!.standing).toBe('good');
    expect(sim.player.school!.tally.breaches).toBe(0);
    expect(titled(sim, 'You Missed A Rehearsal Call')).toHaveLength(0);
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
    expect(sim.player.school!.rep!.performed).toBe(1);
    expect(sim.player.craft!.acting).toBeGreaterThan(acting);
    expect(titled(sim, `You Went On As ${sim.player.school!.rep!.role}`)).toHaveLength(1);
    // On the résumé, once the term's casting is done with: the next term's.
    const role = sim.player.school!.rep!.role;
    play(sim, at(2027, 9, 20, 12));
    expect(sim.player.school!.credits).toContainEqual({ production: SEAGULL_2027.name, role, kind: 'understudy', year: 2027, wentOn: expect.any(Number) });
    expect(sim.player.school!.credits!.find((c) => c.kind === 'understudy')!.wentOn).toBeGreaterThanOrEqual(1);
    const away = found[1]!;
    away.sim.advanceTo(away.night.at - 60_000);
    away.sim.player.school!.standing = 'warning';
    away.sim.player.currentLocationId = 'us-ny-newyork';
    away.sim.advanceTo(away.night.at + 60_000);
    expect(away.sim.player.school!.standing).toBe('dismissed');
    expect(away.sim.player.school!.rep!.performed).toBe(0);
  }, 60_000);

  it('puts nothing on the résumé for a production never gone on in, and keeps what was played on dismissal', () => {
    const never = life('never-on');
    never.advanceTo(at(2027, 1, 4, 9) + 60_000);
    for (const c of pending(never, CALL_KIND)) if (c.payload.call === 'oncall') never.timeline.cancel(c.id, never.now);
    play(never, at(2027, 9, 20, 12));
    expect((never.player.school!.credits ?? []).filter((c) => c.kind === 'understudy')).toEqual([]);
    // A project played once, then a grave breach at the next show while on warning: out, with the credit kept.
    const sim = life('project');
    sim.player.school!.classmates[0]!.craft.acting = 99;
    sim.advanceTo(at(2027, 1, 4, 9) + 60_000);
    const shows = pending(sim, CALL_KIND).filter((c) => c.payload.call === 'performance' && c.payload.which !== 'rep');
    play(sim, shows[0]!.at + 60_000);
    expect(sim.player.school!.casting!.performed).toBe(1);
    sim.player.school!.standing = 'warning';
    sim.advanceTo(shows[1]!.at - 60_000);
    sim.player.currentLocationId = 'us-ny-newyork';
    sim.advanceTo(shows[1]!.at + 60_000);
    expect(sim.player.school!.standing).toBe('dismissed');
    expect(sim.player.school!.credits).toEqual([{ production: 'Carlotta Festival Of New Plays', role: 'A Role', kind: 'carlotta', year: 2027, wentOn: 1 }]);
  }, 120_000);

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
    // The tally runs on to the next term, and starts again with it.
    expect(sim.player.school!.tally.classDays).toBeGreaterThan(0);
    const next = pending(sim, 'school.term')[0]!;
    sim.advanceTo(next.at);
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
    // The second year's assigned shifts, all booked by June, come to its 150 hours at most: every class-week Saturday was 156.
    play(sim, at(2028, 6, 1, 12));
    expect(sim.player.school!.workStudy.assignedBooked).toBeLessThanOrEqual(WORK_STUDY.assignedHours);
    expect(sim.player.school!.workStudy.assignedBooked).toBeGreaterThan(WORK_STUDY.assignedHours - 12);
    play(sim, at(2029, 5, 29, 12));
    const school = sim.player.school!;
    expect(school.history.map((r) => r.standing)).toEqual(['good', 'good', 'good', 'good', 'good', 'good']);
    expect(school.standing).toBe('graduated');
    expect(school.termsBegun).toBe(6);
    // The filmed monologues, posted at the end of the final term.
    expect(school.filmed).toBe(true);
    expect(yearOfStudy(sim.player)).toBe(3);
    expect(school.workStudy.yearHours).toBeGreaterThan(100);
    expect(school.workStudy.yearHours).toBeLessThanOrEqual(WORK_STUDY.assignedHours + WORK_STUDY.electiveHours);
    // The year's assigned shifts come to its 150 hours at most.
    expect(school.workStudy.assignedBooked).toBeLessThanOrEqual(WORK_STUDY.assignedHours);
    expect(school.workStudy.assignedBooked).toBeGreaterThan(90);
    expect(titled(sim, 'Your MFA Is Conferred')).toHaveLength(1);
    expect(sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind.startsWith('school.')).map((i) => i.kind + ' ' + i.label)).toEqual([]);
  }, 120_000);
});

describe('the Yale Cabaret', () => {
  it('puts a student in a show this term, three weeks off and clear of recesses, and grows them for it', () => {
    const sim = life('cabaret');
    const control = life('cabaret');
    for (const one of [sim, control]) play(one, at(2026, 9, 7, 18));
    const answer = sim.execute({ kind: 'school.cabaret', payload: {} });
    expect(answer.ok).toBe(true);
    const week = (answer.value as { week: string }).week;
    const thursday = day(week);
    expect(new Date(Date.UTC(thursday.year, thursday.month - 1, thursday.day)).getUTCDay()).toBe(4);
    expect(at(thursday.year, thursday.month, thursday.day, 0) - sim.now).toBeGreaterThanOrEqual(YALE_CABARET.leadDays * MS_DAY - MS_DAY);
    const calls = pending(sim, CABARET_KIND);
    expect(calls.filter((c) => c.payload.call === 'rehearsal')).toHaveLength(YALE_CABARET.rehearsalEvenings);
    expect(calls.filter((c) => c.payload.call === 'performance')).toHaveLength(YALE_CABARET.shows.length);
    const period = classPeriod(0);
    for (const c of calls) {
      const d = zonedParts(c.at, zone);
      const key = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
      expect(period.off.some(([a, b]) => key >= a && key <= b), `${key} is in a recess`).toBe(false);
    }
    expect(sim.execute({ kind: 'school.cabaret', payload: {} })).toMatchObject({ ok: false, error: 'You’re in a Cabaret show this term already.' });
    const last = calls.at(-1)!.at;
    for (const one of [sim, control]) play(one, last + 60_000);
    expect(sim.player.school!.cabaret!.performed).toBeGreaterThan(0);
    expect(sim.player.craft!.acting).toBeGreaterThan(control.player.craft!.acting);
    expect(sim.player.school!.credits).toEqual([{ production: cabaretSeason(0), role: 'In The Company', kind: 'cabaret', year: 2026, wentOn: sim.player.school!.cabaret!.performed }]);
  }, 120_000);

  it('turns away a student on academic warning, and finds a week clear of the term’s casting calls', () => {
    const warned = life('cabaret-warning');
    play(warned, at(2026, 9, 7, 18));
    warned.player.school!.standing = 'warning';
    expect(warned.execute({ kind: 'school.cabaret', payload: {} })).toMatchObject({ ok: false, error: 'Nobody on academic warning may take part in the Cabaret.' });
    const cast = life('cabaret-cast');
    cast.player.school!.classmates[0]!.craft.acting = 99;
    cast.advanceTo(at(2027, 1, 4, 9) + 60_000);
    // A first-year understudying at Yale Rep this spring: afternoon calls leave the evenings free.
    const casting = pending(cast, CALL_KIND).map((c) => [c.at, c.at + (c.durationMinutes ?? 0) * 60_000] as const);
    expect(casting.length).toBeGreaterThan(0);
    expect(cast.execute({ kind: 'school.cabaret', payload: {} }).ok).toBe(true);
    for (const c of pending(cast, CABARET_KIND)) {
      const end = c.at + (c.durationMinutes ?? 0) * 60_000;
      expect(casting.some(([a, b]) => a < end && c.at < b), `${c.label} at ${new Date(c.at).toISOString()} clashes`).toBe(false);
    }
  }, 60_000);
});

describe('the Yale Cabaret, clear of casting', () => {
  it('moves the show past a week a casting call falls in, and keeps no credit for a show never played', () => {
    const sim = life('cabaret-clear');
    play(sim, at(2026, 9, 7, 18));
    const first = cabaretWeek(sim, sim.player, 0)!;
    // An afternoon call leaves the week be; an evening one against its opening night moves it.
    sim.schedule({ at: at(first.year, first.month, first.day, 15) - MS_DAY, durationMinutes: 180, kind: CALL_KIND, label: 'An Afternoon Call', category: 'school', priority: 32, payload: { personId: sim.player.id, call: 'rehearsal' } });
    expect(cabaretWeek(sim, sim.player, 0)).toEqual(first);
    sim.schedule({ at: at(first.year, first.month, first.day, 20), durationMinutes: 180, kind: CALL_KIND, label: 'An Evening Call', category: 'school', priority: 32, payload: { personId: sim.player.id, call: 'oncall' } });
    const moved = cabaretWeek(sim, sim.player, 0)!;
    expect(at(moved.year, moved.month, moved.day, 0)).toBeGreaterThan(at(first.year, first.month, first.day, 0));
    // An elective shift on its opening night moves it too.
    const shift = life('cabaret-shift');
    play(shift, at(2026, 9, 7, 18));
    const was = cabaretWeek(shift, shift.player, 0)!;
    shift.schedule({ at: at(was.year, was.month, was.day, 19), durationMinutes: 240, kind: SHIFT_KIND, label: 'Elective Shift', category: 'school', priority: 32, payload: { personId: shift.player.id, hours: 4, elective: true } });
    expect(cabaretWeek(shift, shift.player, 0)).not.toEqual(was);
    // A Thursday in the Thanksgiving recess isn't a production week.
    const late = life('cabaret-recess');
    play(late, at(2026, 11, 4, 18));
    const week = cabaretWeek(late, late.player, 0)!;
    expect(week).toEqual({ year: 2026, month: 12, day: 3 });
    // A lab's evening against one of its rehearsal evenings moves it too.
    const lab = life('cabaret-lab');
    play(lab, at(2026, 9, 7, 18));
    const before = cabaretWeek(lab, lab.player, 0)!;
    const evening = cabaretEvenings(before, classPeriod(0).off)[0]!;
    lab.schedule({ at: at(evening.year, evening.month, evening.day, 19), durationMinutes: 120, kind: LAB_KIND, label: 'A Lab', category: 'school', priority: 32, payload: { personId: lab.player.id } });
    const after = cabaretWeek(lab, lab.player, 0)!;
    expect(at(after.year, after.month, after.day, 0)).toBeGreaterThan(at(before.year, before.month, before.day, 0));
    // Joined, then away for all of it: nothing on the résumé.
    const away = life('cabaret-away');
    play(away, at(2026, 9, 7, 18));
    away.must({ kind: 'school.cabaret', payload: {} });
    const calls = pending(away, CABARET_KIND);
    play(away, calls[0]!.at - 60_000);
    away.player.currentLocationId = 'us-ny-newyork';
    away.advanceTo(calls.at(-1)!.at + 60_000);
    expect(away.player.school!.cabaret!.performed).toBe(0);
    expect(away.player.school!.credits ?? []).toEqual([]);
  }, 120_000);
});

describe('the Yale Summer Cabaret', () => {
  it('takes a first-year in good standing into the summer’s company: three shows, afternoon rehearsals, a weekly stipend', () => {
    const sim = life('summer');
    play(sim, at(2027, 3, 20, 12));
    expect(sim.execute({ kind: 'school.summer_cabaret', payload: {} }).ok).toBe(true);
    const runs = summerRuns(2027);
    const shows = pending(sim, SUMMER_KIND).filter((c) => c.payload.call === 'performance');
    expect(shows.every((c) => zonedParts(c.at, zone).month >= 6)).toBe(true);
    expect(shows.filter((c) => c.payload.last === true)).toHaveLength(runs.length);
    const stipends = pending(sim, STIPEND_KIND);
    expect(stipends.length).toBeGreaterThanOrEqual(10);
    expect(sim.execute({ kind: 'school.summer_cabaret', payload: {} })).toMatchObject({ ok: false, error: 'You’re in this summer’s company.' });
    // The first show, and the stipend through it.
    const firstClose = shows.find((c) => c.payload.last === true)!;
    play(sim, firstClose.at + 60_000);
    expect(sim.player.school!.summer!.played[0]).toBeGreaterThan(0);
    expect(sim.player.school!.credits?.find((c) => c.kind === 'summer')).toMatchObject({ production: 'Yale Summer Cabaret 2027, Show 1', year: 2027 });
    const paid = sim.universe.transactions.filter((t) => t.memo.startsWith('Yale Summer Cabaret stipend'));
    expect(paid.length).toBeGreaterThan(0);
    expect(paid.every((t) => t.postings.some((p) => p.amount === -SUMMER_CABARET.stipendWeekly))).toBe(true);
    expect(sim.player.earnings!.years[2027]!.employers['yale-summer-cabaret']).toBe(paid.length * SUMMER_CABARET.stipendWeekly);
    // With tax withheld as a paycheck's, payroll tax among it.
    const withheld = paid.flatMap((t) => t.postings).filter((p) => p.accountId === sim.nominalAccount('expense', 'Tax Withheld').id).reduce((a, p) => a + p.amount, 0);
    expect(withheld).toBeGreaterThanOrEqual(Math.floor(paid.length * SUMMER_CABARET.stipendWeekly * 0.0765));
  }, 180_000);

  it('lets a student go who misses a performance, and stops the stipend after the days of the week worked', () => {
    const sim = life('summer-miss');
    play(sim, at(2027, 3, 20, 12));
    sim.must({ kind: 'school.summer_cabaret', payload: {} });
    const show = pending(sim, SUMMER_KIND).find((c) => c.payload.call === 'performance')!;
    play(sim, show.at - 60_000);
    sim.player.currentLocationId = 'us-ny-newyork';
    sim.advanceTo(show.at + 60_000);
    expect(sim.player.school!.summer!.out).toBe(true);
    expect(pending(sim, SUMMER_KIND)).toHaveLength(0);
    const last = pending(sim, STIPEND_KIND);
    expect(last).toHaveLength(1);
    const share = last[0]!.payload.share as number;
    expect(share).toBeGreaterThan(0);
    expect(share).toBeLessThan(1);
    const wages = () => sim.nominalAccount('income', 'Wages').balance;
    const before = wages();
    sim.advanceTo(last[0]!.at + 60_000);
    expect(before - wages()).toBe(Math.round(SUMMER_CABARET.stipendWeekly * share));
    expect(titled(sim, 'Out Of The Summer Cabaret')).toHaveLength(1);
  }, 180_000);

  it('keeps a student in the company who misses a performance in hospital', () => {
    const sim = life('summer-ward');
    play(sim, at(2027, 3, 20, 12));
    sim.must({ kind: 'school.summer_cabaret', payload: {} });
    const show = pending(sim, SUMMER_KIND).find((c) => c.payload.call === 'performance')!;
    play(sim, show.at - 60_000);
    healthOf(sim.player).inHospitalUntil = show.at + MS_HOUR;
    sim.advanceTo(show.at + 60_000);
    expect(sim.player.school!.summer!.out).toBeFalsy();
    expect(pending(sim, SUMMER_KIND).length).toBeGreaterThan(0);
  }, 180_000);

  it('forms in the spring of the first and second years, for a student in good standing, by the end of April', () => {
    const fall = life('summer-fall');
    play(fall, at(2026, 10, 1, 12));
    expect(fall.execute({ kind: 'school.summer_cabaret', payload: {} })).toMatchObject({ ok: false, error: 'The company forms in the spring, for students with a year still to come.' });
    const late = life('summer-late');
    play(late, at(2027, 5, 2, 12));
    expect(late.execute({ kind: 'school.summer_cabaret', payload: {} })).toMatchObject({ ok: false, error: 'This summer’s company has formed.' });
    const concern = life('summer-concern');
    play(concern, at(2027, 3, 20, 12));
    concern.player.school!.standing = 'concern';
    expect(concern.execute({ kind: 'school.summer_cabaret', payload: {} }).ok).toBe(false);
  }, 180_000);
});

describe('the summers, for work', () => {
  it('opens after the first spring’s work period, to the fall term, and not in the third year', () => {
    const sim = life('summer-bounds');
    play(sim, at(2027, 5, 12, 12));
    expect(summerOf(sim.player, sim.now)).toBeUndefined();
    expect(sim.execute({ kind: 'career.self_submit', payload: {} }).ok).toBe(false);
    play(sim, at(2027, 5, 14, 12));
    const summer = summerOf(sim.player, sim.now)!;
    expect(summer.until).toBe(at(2027, 8, 23, 0));
    // The recess opened the business's week, and submissions.
    expect(pending(sim, 'career.week').length).toBe(1);
    expect(sim.execute({ kind: 'career.self_submit', payload: {} }).ok).toBe(true);
    expect(summerOf(sim.player, at(2027, 8, 23, 1))).toBeUndefined();
    // The Bulletin's day for 2027.
    expect(summer.from).toBe(at(2027, 5, 13, 0));
    // A third year's spring leads to the degree, not a summer.
    const third = { ...sim.player, school: { ...sim.player.school!, termsBegun: 6 } };
    expect(summerOf(third, at(2029, 5, 20, 12))).toBeUndefined();
    // The fall term ends the week's run.
    play(sim, at(2027, 9, 7, 12));
    expect(pending(sim, 'career.week')).toHaveLength(0);
    expect(sim.execute({ kind: 'career.self_submit', payload: {} }).ok).toBe(false);
  }, 180_000);

  it('goes to stay for a job on a friend’s sofa when neither the bank nor the card can pay for a room', () => {
    const sim = life('summer-sofa');
    play(sim, at(2027, 5, 20, 12));
    const job = { id: 'june', roleId: 'costar', cityId: 'us-ny-newyork' as const, starts: at(2027, 6, 7, 7), units: 2, rehearsalWeeks: 0, status: 'offered' as const, dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(job);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: 'june' } }).ok).toBe(true);
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && a.kind !== 'escrow') a.balance = 0;
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance = -100_000_00;
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.kind === 'credit_card') a.balance = -(a.creditLimit ?? 0);
    const stay = pending(sim, 'career.stay')[0]!;
    sim.advanceTo(stay.at + 60_000);
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
    expect(sim.universe.transactions.some((t) => t.memo.startsWith('A sublet in New York'))).toBe(false);
    expect(sim.player.earnings?.years[2027]?.jobCosts ?? 0).toBe(0);
    expect(sim.universe.notifications.some((n) => /friend’s sofa/.test(n.body))).toBe(true);
  }, 180_000);

  it('takes a job that ends before the term, and goes to stay in its city for it, paying for a room', () => {
    const sim = life('summer-job');
    play(sim, at(2027, 5, 20, 12));
    const career = careerOf(sim.player);
    const into = { id: 'late', roleId: 'costar', cityId: 'us-ny-newyork' as const, starts: at(2027, 8, 20, 7), units: 5, rehearsalWeeks: 0, status: 'offered' as const, dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    career.bookings.push(into);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: 'late' } })).toMatchObject({ ok: false, error: 'It runs into the fall term, and the school’s work comes first while classes are in session.' });
    const job = { ...into, id: 'june', starts: at(2027, 6, 7, 7), units: 2 };
    career.bookings.push(job);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: 'june' } }).ok).toBe(true);
    const stays = pending(sim, 'career.stay');
    expect(stays).toHaveLength(2);
    sim.advanceTo(stays[0]!.at + 60_000);
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
    const sublet = sim.universe.transactions.find((t) => t.memo.startsWith('A sublet in New York'))!;
    // A cost of the work, for the return.
    expect(sim.player.earnings!.years[2027]!.jobCosts).toBe(sublet.postings.find((q) => q.amount > 0)!.amount);
    sim.advanceTo(stays[1]!.at + 60_000);
    expect(sim.player.currentLocationId).toBe(YALE_DRAMA.cityId);
    // Gone somewhere else by the job's end, they aren't brought back from it.
    const other = { ...job, id: 'july', starts: at(2027, 7, 12, 7), status: 'offered' as const };
    career.bookings.push(other);
    sim.must({ kind: 'career.accept', payload: { bookingId: 'july' } });
    const next = pending(sim, 'career.stay');
    sim.advanceTo(next[0]!.at + 60_000);
    sim.player.currentLocationId = 'us-ca-losangeles';
    sim.advanceTo(next[1]!.at + 60_000);
    expect(sim.player.currentLocationId).toBe('us-ca-losangeles');
  }, 180_000);

  it('keeps them in the city while another job there has calls ahead, and brings them home from the last', () => {
    const sim = life('two-jobs');
    play(sim, at(2027, 5, 20, 12));
    const career = careerOf(sim.player);
    const first = { id: 'one', roleId: 'costar', cityId: 'us-ny-newyork' as const, starts: at(2027, 6, 7, 7), units: 1, rehearsalWeeks: 0, status: 'offered' as const, dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    const second = { ...first, id: 'two', starts: at(2027, 6, 8, 7), units: 3 };
    career.bookings.push(first, second);
    sim.must({ kind: 'career.accept', payload: { bookingId: 'one' } });
    sim.must({ kind: 'career.accept', payload: { bookingId: 'two' } });
    const home = (id: string) => sim.universe.scheduled.find((i) => i.kind === 'career.stay' && i.payload.bookingId === id && i.payload.direction === 'back')!;
    // The first job's journey home falls inside the second's days.
    expect(home('one').at).toBeLessThan(home('two').at);
    const planned = { one: home('one').at, two: home('two').at };
    play(sim, home('one').at + 60_000);
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
    play(sim, home('two').at + 60_000);
    expect(sim.player.currentLocationId).toBe(YALE_DRAMA.cityId);
    // One room kept on: the second job pays only the nights past the first’s.
    const sublets = sim.universe.transactions.filter((t) => t.memo.startsWith('A sublet in New York'));
    expect(sublets).toHaveLength(2);
    expect(sublets[1]!.memo).toBe(`A sublet in New York, ${Math.round((planned.two - planned.one) / MS_DAY)} nights`);
  }, 180_000);
});

describe('the curriculum’s labs', () => {
  it('runs Drama 50 in the first fall, the New Play Lab after the first spring recess, and the third year’s solo showing', () => {
    const d50 = labDays(0)!;
    expect(d50.name).toBe(LABS.drama50.name);
    expect(d50.days[0]).toEqual({ year: 2026, month: 9, day: 8 });
    // Labor Day is off.
    expect(d50.days.some((d) => d.month === 9 && d.day === 7)).toBe(false);
    expect(d50.days.length).toBe(14);
    const npl = labDays(1)!;
    expect(npl.days[0]).toEqual({ year: 2027, month: 3, day: 16 });
    expect(npl.days.every((d) => { const wd = new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay(); return wd >= 2 && wd <= 5; })).toBe(true);
    // Three weeks of Tuesday to Friday, less the work period of 30 March to 1 April.
    expect(npl.days.length).toBe(9);
    const solo = labDays(5)!;
    expect(solo).toMatchObject({ name: LABS.creator.name, showing: true });
    expect(solo.days).toHaveLength(1);
    expect(new Date(Date.UTC(solo.days[0]!.year, solo.days[0]!.month - 1, solo.days[0]!.day)).getUTCDay()).toBe(5);
    expect(labDays(2)).toBeUndefined();
    expect(labDays(3)).toBeUndefined();
  });

  it('calls a first-year to Drama 50, grows them there, and counts a missed afternoon', () => {
    const sim = life('drama50');
    const control = life('drama50');
    play(sim, at(2026, 9, 1, 12));
    play(control, at(2026, 9, 1, 12));
    const labs = pending(sim, LAB_KIND);
    expect(labs).toHaveLength(14);
    // The control skips every lab afternoon in New York.
    for (const lab of pending(control, LAB_KIND)) {
      play(control, lab.at - 60_000);
      control.player.currentLocationId = 'us-ny-newyork';
      control.advanceTo(lab.at + 60_000);
      control.player.currentLocationId = YALE_DRAMA.cityId;
    }
    play(sim, labs.at(-1)!.at + 60_000);
    play(control, labs.at(-1)!.at + 60_000);
    expect(sim.player.school!.tally.calls - sim.player.school!.tally.answered).toBe(0);
    expect(control.player.school!.tally.calls - control.player.school!.tally.answered).toBe(14);
    expect(sim.player.craft!.text).toBeGreaterThan(control.player.craft!.text);
  }, 180_000);
});
