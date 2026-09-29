/**
 * What was built in on 2026-09-27 after the business's second portion:
 * commercials and voice work, location, a series' later seasons, public
 * cover and COBRA, illness and its bills, and part-year and nonresident
 * returns (`systems/career.ts`, `systems/health.ts`, `systems/taxreturn.ts`).
 */
import { documentsOf, passportOf } from '@/engine/systems/documents';
import { describe, expect, it } from 'vitest';
import { evenCraft } from '@/engine/systems/school';
import { quickSave } from '@/engine';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { computeAnnualTax } from '@/engine/content/tax';
import { COMMERCIAL_USE, LOCATION, RECURRING, SAG_AFTRA, SERIES, rateOn } from '@/engine/content/career';
import { CARE, COBRA, MEDICAL_DEBT, PLANS, PUBLIC_COVER, STATE_RETURN } from '@/engine/content/safetynet';
import {
  RENEWAL_KIND, TRAVEL_KIND, WORK_KIND, afterlife, sendHome, arcUplift, beginCareer, careerOf, levelFor, locationFor, paycheck, residualAmount, roleById, workDays,
  type Booking,
} from '@/engine/systems/career';
import { earningsOf, recordBenefit, recordWages, yearOf } from '@/engine/systems/earnings';
import { careFor, coverOn, grown, healthMonth, healthOf, illnessWeek, medicalDebtOf, programFor, shareOf } from '@/engine/systems/health';
import { figuresFor } from '@/engine/systems/taxreturn';
import type { Simulation } from '@/engine/core/simulation';
import type { Craft } from '@/engine/systems/school';
import { TURNS } from '@/engine/systems/enjoyment';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, zone = NY) => instantFromZoned({ year, month, day, hour }, zone);
const craft = (level: number): Craft => (evenCraft(level));
const pending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending').sort((a, b) => a.at - b.at);
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);

function pro(seed: string, city = 'us-ny-newyork', level = 75): Simulation {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = craft(level);
  beginCareer(sim, sim.player);
  // An actor sent abroad holds a passport, and nothing here is about papers (docs/WORLD.md, stage 1b).
  if (!passportOf(sim.player, sim.now)) documentsOf(sim.player).push({ id: 'pp', kind: 'passport', issuer: 'US', name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - 86_400_000, expiresAt: sim.now + 3650 * 86_400_000 });
  return sim;
}
function booking(sim: Simulation, roleId: string, units: number, starts = sim.now + 7 * MS_DAY, extra: Partial<Booking> = {}): Booking {
  const b: Booking = { id: `t${careerOf(sim.player).bookings.length}`, roleId, cityId: 'us-ny-newyork', starts, units, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0, ...extra };
  careerOf(sim.player).bookings.push(b);
  return b;
}
const month = (sim: Simulation, key: string, amount: number) => { earningsOf(sim.player).months[key] = amount; };

describe('commercials and voice', () => {
  it('pay the 2025 contract’s session fees, commissioned at scale with no 10% on top', () => {
    expect(rateOn(roleById('commercial').steps, '2026-05-01')).toBe(855_20);
    expect(rateOn(roleById('commercial-vo').steps, '2026-05-01')).toBe(643_00);
    const check = paycheck({ scale: 855_20, role: roleById('commercial'), rehearsal: false, represented: true, before: 0, cityId: 'us-ny-newyork', at: at(2026, 5, 1) });
    expect(check).toMatchObject({ gross: 855_20, agent: 85_52 });
    expect(paycheck({ scale: 1_283_00, role: roleById('costar'), rehearsal: false, represented: true, before: 0, cityId: 'us-ny-newyork', at: at(2026, 5, 1) }).gross).toBe(Math.round(1_283_00 * 1.1));
  });

  it('pay a commercial’s cycles by where it ran: a network’s airings to the cap, cable’s flat fee, and never under the holding fee', () => {
    const base = { id: 'c', bookingId: 'b', roleId: 'commercial', kind: 'commercial' as const, perEpisode: 855_20, episodes: 1, days: 1, airsAt: 0 };
    const [first, second, third, later] = COMMERCIAL_USE.classA.camera;
    expect(residualAmount({ ...base, plan: ['network'], uses: [13] }, 'cycle', 2, 0, NY, 'USD')).toBe(first + second + 11 * third);
    expect(residualAmount({ ...base, plan: ['network'], uses: [30] }, 'cycle', 2, 0, NY, 'USD')).toBe(first + second + 11 * third + 17 * later);
    expect(residualAmount({ ...base, plan: ['network'], uses: [1000] }, 'cycle', 2, 0, NY, 'USD')).toBe(COMMERCIAL_USE.cap.camera);
    expect(residualAmount({ ...base, plan: ['cable'] }, 'cycle', 2, 0, NY, 'USD')).toBe(COMMERCIAL_USE.cable.camera);
    expect(residualAmount({ ...base, roleId: 'commercial-vo', perEpisode: 643_00, plan: ['wild'] }, 'cycle', 2, 0, NY, 'USD')).toBe(COMMERCIAL_USE.wild.voice);
    expect(residualAmount({ ...base, perEpisode: 5_000_00, plan: ['wild'] }, 'cycle', 2, 0, NY, 'USD')).toBe(5_000_00);
  });

  it('schedule a commercial’s cycles after the first, and none past what it ran', () => {
    const sim = pro('ad');
    let longest = 0;
    for (let n = 0; n < 30; n += 1) {
      const r = afterlife(sim, sim.player, { ...booking(sim, 'commercial', 1), id: `ad${n}`, status: 'worked', worked: 1 }, sim.now)!;
      expect(r.kind).toBe('commercial');
      const cycles = pending(sim, 'career.residual').filter((i) => i.payload.residualId === r.id);
      expect(cycles).toHaveLength(r.plan!.length);
      longest = Math.max(longest, r.plan!.length);
    }
    expect(longest).toBeGreaterThan(0);
  });

  it('book voice work as booth sessions at ten, weighed on voice-over and the voice', () => {
    const sim = pro('voice');
    const b = booking(sim, 'animation', 2, at(2026, 10, 5, 8));
    expect(workDays(b).map((d) => zonedParts(d.at, 'America/New_York').hour)).toEqual([10, 10]);
    expect(levelFor({ ...craft(50), voiceover: 80, voice: 80 }, roleById('game'))).toBe(68);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    play(sim, at(2026, 10, 6, 18));
    expect(careerOf(sim.player).days.map((d) => d.hours)).toEqual([4, 4]);
  });
});

describe('location', () => {
  it('sends about half of traveling jobs away, at home or abroad, by where series shoot', () => {
    const sim = pro('loc');
    const draws = Array.from({ length: 2000 }, (_, n) => locationFor(sim, sim.player, `k${n}`));
    const away = draws.filter(Boolean).length / 2000;
    expect(away).toBeGreaterThan(0.45);
    expect(away).toBeLessThan(0.53);
    expect(new Set(draws.filter(Boolean))).toEqual(new Set(LOCATION.cities.map(([c]) => c)));
  });

  it('flies them out the day before and home the day after, pays the travel days and the meal allowance, and taxes the work where it was done', () => {
    const sim = pro('away');
    const b = booking(sim, 'costar', 2, at(2026, 10, 5, 8), { location: 'us-ga-atlanta' });
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    const travel = pending(sim, TRAVEL_KIND);
    expect(travel.map((t) => zonedParts(t.at, NY).day)).toEqual([4, 7]);
    play(sim, at(2026, 10, 4, 18));
    expect(sim.player.currentLocationId).toBe('us-ga-atlanta');
    play(sim, at(2026, 10, 8, 12));
    expect(b.status).toBe('worked');
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
    play(sim, at(2026, 10, 16, 12));
    const pay = sim.universe.transactions.filter((t) => t.memo.startsWith('Co-Star'));
    const perDiem = pay.flatMap((t) => t.postings).filter((q) => q.amount < 0 && sim.universe.accounts[q.accountId]?.name === 'Per Diem').reduce((s, q) => s - q.amount, 0);
    expect(perDiem).toBe(4 * rateOn(LOCATION.perDiem, '2026-10-05'));
    const y = yearOf(sim.player, 2026);
    expect(Object.keys(y.elsewhere)).toEqual(['us-ny>us-ga-atlanta']);
    // Two travel days are paid as days: four days' scale in all, plus 10% and overtime.
    expect(y.acting).toBeGreaterThan(Math.round(4 * 1_283_00 * 1.1) - 1);
  });
});

describe('a series’ later seasons', () => {
  it('holds an option after a season, and picks it up by mid-June at 4% more, or cancels', () => {
    let picked = 0;
    let cancelled = 0;
    for (const seed of ['s1', 's2', 's3', 's4', 's5', 's6']) {
      const sim = pro(seed, 'us-ca-losangeles', 90);
      const b = booking(sim, 'series-half', 13, at(2026, 10, 5, 8, 'America/Los_Angeles'), { cityId: 'us-ca-losangeles' });
      expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
      play(sim, workDays(b).at(-1)!.at + MS_HOUR);
      expect(b.status).toBe('worked');
      const option = careerOf(sim.player).option!;
      expect(zonedParts(option.decidedAt, NY)).toMatchObject({ year: 2027, month: SERIES.optionMonth, day: SERIES.optionDay });
      // Another series' part is refused while the option stands.
      const other = booking(sim, 'series-hour', 13, at(2027, 3, 1, 8), { cityId: 'us-ca-losangeles' });
      expect(sim.execute({ kind: 'career.accept', payload: { bookingId: other.id } }).ok).toBe(false);
      other.status = 'passed';
      play(sim, option.decidedAt + MS_HOUR);
      expect(careerOf(sim.player).option).toBeUndefined();
      const next = careerOf(sim.player).bookings.find((x) => x.season === 2);
      if (next) {
        picked += 1;
        expect(next).toMatchObject({ status: 'accepted', seriesId: b.id });
        expect(next.rate).toBe(Math.round(rateOn(roleById('series-half').steps, '2026-10-05') * (1 + SERIES.raise)));
        expect(next.starts - b.starts).toBeGreaterThan(350 * MS_DAY);
        // After its pickup, whenever the last season began.
        expect(next.starts).toBeGreaterThan(option.decidedAt);
      } else {
        cancelled += 1;
        expect(titled(sim, 'Your Series Was Canceled')).toHaveLength(1);
      }
    }
    expect(picked + cancelled).toBe(6);
    expect(picked).toBeGreaterThan(0);
  }, 180_000);

  it('starts a season picked up in June after the pickup, though the last began in the spring', () => {
    let picked = 0;
    for (const seed of ['sp1', 'sp2', 'sp3', 'sp4', 'sp5', 'sp6']) {
      const sim = pro(seed, 'us-ca-losangeles', 90);
      // A season begun in December 2024: a year on is December 2025, already gone at the pickup.
      const prior = booking(sim, 'series-half', 13, at(2024, 12, 2, 8, 'America/Los_Angeles'), { cityId: 'us-ca-losangeles', status: 'worked', worked: 65 });
      careerOf(sim.player).residuals.push({ id: 'r', bookingId: prior.id, roleId: prior.roleId, kind: 'network', perEpisode: 1, episodes: 13, days: 65, airsAt: 0 });
      sim.schedule({ at: sim.now + 60_000, kind: RENEWAL_KIND, label: 'x', category: 'system', priority: 1, payload: { personId: sim.player.id, bookingId: prior.id } });
      sim.advanceTo(sim.now + 2 * 60_000);
      const next = careerOf(sim.player).bookings.find((x) => x.season === 2);
      if (!next) continue;
      expect(next.starts).toBeGreaterThan(sim.now);
      expect(workDays(next)[0]!.at).toBeGreaterThan(sim.now);
      picked += 1;
    }
    expect(picked).toBeGreaterThan(0);
  });

  it('brings nobody home later than they’d come, and a journey already sooner stays', () => {
    const sim = pro('home-soon');
    const b = booking(sim, 'costar', 2, sim.now + 7 * MS_DAY);
    const soon = sim.schedule({ at: sim.now + 2 * MS_HOUR, kind: TRAVEL_KIND, label: 'x', category: 'career', priority: 30, payload: { personId: sim.player.id, bookingId: b.id, direction: 'back' } });
    const late = sim.schedule({ at: sim.now + 9 * MS_DAY, kind: TRAVEL_KIND, label: 'x', category: 'career', priority: 30, payload: { personId: sim.player.id, bookingId: b.id, direction: 'back' } });
    sendHome(sim, b);
    expect(soon.at).toBe(sim.now + 2 * MS_HOUR);
    expect(late.at).toBe(sim.now + MS_DAY);
  });

  it('releases a job that clashes with a picked-up season', () => {
    let released = 0;
    let canceled = 0;
    for (const seed of ['r1', 'r2', 'r3', 'r4', 'r5', 'r6']) {
      const sim = pro(seed, 'us-ca-losangeles', 90);
      const prior = booking(sim, 'series-half', 13, at(2026, 10, 5, 8, 'America/Los_Angeles'), { cityId: 'us-ca-losangeles', status: 'worked', worked: 65 });
      careerOf(sim.player).residuals.push({ id: 'r', bookingId: prior.id, roleId: prior.roleId, kind: 'network', perEpisode: 1, episodes: 13, days: 65, airsAt: 0 });
      const clash = booking(sim, 'guest-hour', 2, at(2027, 10, 5, 8, 'America/Los_Angeles'), { cityId: 'us-ca-losangeles', location: 'ca-bc-vancouver' });
      expect(sim.execute({ kind: 'career.accept', payload: { bookingId: clash.id } }).ok).toBe(true);
      sim.schedule({ at: sim.now + 60_000, kind: RENEWAL_KIND, label: 'x', category: 'system', priority: 1, payload: { personId: sim.player.id, bookingId: prior.id } });
      sim.player.wellbeing.morale = 50;
      sim.advanceTo(sim.now + 2 * 60_000);
      // Picked up or canceled, it's felt.
      if (!careerOf(sim.player).bookings.some((x) => x.season === 2)) { expect(sim.player.wellbeing.morale).toBeLessThan(50 + TURNS.canceled.morale / 2); canceled += 1; continue; }
      expect(sim.player.wellbeing.morale).toBeGreaterThan(50 + TURNS.pickedUp.morale / 2);
      expect(clash.status).toBe('released');
      expect(pending(sim, WORK_KIND).some((i) => i.payload.bookingId === clash.id)).toBe(false);
      // Its journey out is off the calendar, and a journey home comes by tomorrow.
      expect(pending(sim, TRAVEL_KIND).some((i) => i.payload.bookingId === clash.id && i.payload.direction === 'out')).toBe(false);
      const home = pending(sim, TRAVEL_KIND).find((i) => i.payload.bookingId === clash.id && i.payload.direction === 'back');
      expect(home?.at).toBeLessThanOrEqual(sim.now + MS_DAY);
      released += 1;
    }
    expect(released).toBeGreaterThan(0);
    expect(canceled).toBeGreaterThan(0);
  });
});

describe('a season picked up with nothing in the bank', () => {
  it('joins them anyway, keeps the job it clashes with released and the season theirs, and takes the fee from the pay', () => {
    let picked = 0;
    for (const seed of ['u1', 'u2', 'u3', 'u4', 'u5', 'u6']) {
      const sim = pro(seed, 'us-ca-losangeles', 90);
      const prior = booking(sim, 'series-half', 13, at(2026, 10, 5, 8, 'America/Los_Angeles'), { cityId: 'us-ca-losangeles', status: 'worked', worked: 65 });
      careerOf(sim.player).residuals.push({ id: 'r', bookingId: prior.id, roleId: prior.roleId, kind: 'network', perEpisode: 1, episodes: 13, days: 65, airsAt: 0 });
      careerOf(sim.player).unions.sag = { eligibleAt: sim.now - 400 * MS_DAY };
      for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && a.kind !== 'escrow') a.balance = 0;
      sim.schedule({ at: sim.now + 60_000, kind: RENEWAL_KIND, label: 'x', category: 'system', priority: 1, payload: { personId: sim.player.id, bookingId: prior.id } });
      sim.advanceTo(sim.now + 2 * 60_000);
      const season = careerOf(sim.player).bookings.find((x) => x.season === 2);
      if (!season) continue;
      expect(season.status).toBe('accepted');
      expect(careerOf(sim.player).unions.sag!.joinedAt).toBe(sim.now - 60_000);
      expect(careerOf(sim.player).unions.owed).toBe(SAG_AFTRA.initiation + Math.round(SAG_AFTRA.basicDues / 2));
      picked += 1;
    }
    expect(picked).toBeGreaterThan(0);
    // Owed, it comes out of the next check, as dues.
    const sim = pro('u-pay');
    careerOf(sim.player).unions.owed = 500_00;
    const b = booking(sim, 'costar', 1, sim.now + 3 * MS_DAY);
    sim.must({ kind: 'career.accept', payload: { bookingId: b.id } });
    const until = sim.now + 30 * MS_DAY;
    while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true });
    expect(careerOf(sim.player).bookings.find((x) => x.id === b.id)!.status).toBe('worked');
    expect(careerOf(sim.player).unions.owed).toBe(0);
    // Paid from the check, it's dues on the year's return.
    expect(Object.values(sim.player.earnings!.years).reduce((a, y) => a + y.dues, 0)).toBeGreaterThanOrEqual(500_00);
    const paid = sim.universe.transactions.find((t) => t.category === 'salary' && t.memo.startsWith(roleById('costar').label))!;
    expect(paid.postings.filter((p) => p.accountId === sim.nominalAccount('expense', 'Union Dues').id).reduce((a, p) => a + p.amount, 0)).toBeGreaterThanOrEqual(500_00);
  }, 180_000);
});

describe('public cover and COBRA', () => {
  it('takes a low month into Medicaid, a New Yorker to 200% into the Essential Plan, and neither above', () => {
    const sim = pro('medicaid');
    month(sim, '2026-05', 1_500_00);
    expect(programFor(sim.player, at(2026, 6, 2))).toEqual({ kind: 'medicaid', band: 'low' });
    month(sim, '2026-05', 2_200_00);
    expect(programFor(sim.player, at(2026, 6, 2))).toEqual({ kind: 'essential', band: 'high' });
    month(sim, '2026-05', 3_000_00);
    expect(programFor(sim.player, at(2026, 6, 2))).toBeUndefined();
    const la = pro('medical', 'us-ca-losangeles');
    earningsOf(la.player).months['2026-05'] = 2_200_00;
    expect(programFor(la.player, at(2026, 6, 2))).toBeUndefined();
  });

  it('enrolls them at any time, with nothing to pay for care, and ends Medicaid at renewal from 2027 without the work', () => {
    const sim = pro('enroll-medicaid');
    month(sim, zonedParts(sim.now - 20 * MS_DAY, NY).year + '-' + String(zonedParts(sim.now - 20 * MS_DAY, NY).month).padStart(2, '0'), 0);
    const a = sim.execute<{ kind: string }>({ kind: 'health.enroll', payload: {} });
    expect(a.ok && a.value!.kind).toBe('medicaid');
    const h = healthOf(sim.player);
    expect(coverOn(sim.player, h.program!.from + MS_HOUR)).toBe('medicaid');
    expect(shareOf(sim.player, 'stay', h.program!.from + MS_HOUR)).toBe(0);
    // A renewal in 2027 with no work last month ends it.
    h.program!.renewAt = at(2027, 4, 1, 0);
    healthMonth(sim, sim.player, at(2027, 4, 1, 1));
    expect(h.program!.until).toBe(at(2027, 4, 1, 1));
    expect(PUBLIC_COVER.workHours).toBe(80);
  });

  it('offers COBRA when a union plan ends, back to the day, for 18 months, with New York’s 75% for a low income', () => {
    const sim = pro('cobra');
    const h = healthOf(sim.player);
    h.sag = { from: at(2026, 1, 1, 0), until: at(2026, 4, 1, 0) };
    healthMonth(sim, sim.player, at(2026, 3, 1, 1));
    healthMonth(sim, sim.player, at(2026, 4, 1, 1));
    expect(h.cobraOffer).toMatchObject({ plan: 'sag', lostAt: at(2026, 4, 1, 1) });
    sim.advanceTo(at(2026, 5, 10, 12));
    month(sim, '2026-04', 1_000_00);
    const before = sim.universe.transactions.length;
    expect(sim.execute({ kind: 'health.elect_cobra', payload: {} }).ok).toBe(true);
    const paid = sim.universe.transactions.slice(before).find((t) => t.memo.startsWith('COBRA premiums'))!;
    expect(paid.memo).toContain('2 months');
    expect(paid.postings.filter((q) => q.amount > 0).reduce((s, q) => s + q.amount, 0)).toBe(Math.round(COBRA.premium.sag * 0.25 * 2));
    expect(coverOn(sim.player, at(2026, 4, 15))).toBe('cobra');
    expect(h.cobra!.until).toBe(at(2027, 10, 1, 0));
    expect(sim.execute({ kind: 'health.elect_cobra', payload: {} }).ok).toBe(false);
  });
});

describe('illness and its bills', () => {
  it('comes at the rates of an adult 25 to 44', () => {
    const sim = pro('rates');
    const counts = { visit: 0, emergency: 0, stay: 0, flu: 0 };
    const weeks = 52 * 60;
    for (let w = 0; w < weeks; w += 1) {
      for (const e of illnessWeek(sim, sim.player, sim.now + w * 7 * MS_DAY)) {
        if (e.flu) counts.flu += 1;
        else counts[e.care as 'visit' | 'emergency' | 'stay'] += 1;
      }
    }
    expect(counts.visit / 60).toBeCloseTo(CARE.perYear.visit, 0);
    expect(counts.emergency / 60).toBeGreaterThan(0.3);
    expect(counts.emergency / 60).toBeLessThan(0.6);
    expect(counts.flu / 60).toBeGreaterThan(0.06);
    expect(counts.flu / 60).toBeLessThan(0.12);
  });

  it('leaves the patient their plan’s share, to the year’s most, and the uninsured the price less a hospital’s charity', () => {
    const sim = pro('share');
    const h = healthOf(sim.player);
    h.sag = { from: at(2026, 1, 1, 0), until: at(2027, 1, 1, 0) };
    const when = at(2026, 6, 1);
    expect(shareOf(sim.player, 'visit', when)).toBe(PLANS.sag!.visit);
    expect(shareOf(sim.player, 'stay', when)).toBe(500_00 + Math.round((grown(CARE.price.stay, 'stay', when) - 500_00) * 0.1));
    expect(shareOf(sim.player, 'stay', when)).toBe(Math.round(grown(CARE.price.stay, 'stay', when) * 0.1));
    h.spent[2026] = PLANS.sag!.outOfPocket - 10_00;
    expect(shareOf(sim.player, 'emergency', when)).toBe(10_00);
    const bare = pro('bare');
    expect(shareOf(bare.player, 'visit', when)).toBe(Math.round(grown(CARE.price.visit, 'visit', when) * CARE.uninsuredMarkup));
    // New York's hospitals charge nothing under 200% of the poverty line.
    expect(shareOf(bare.player, 'emergency', when)).toBe(0);
    earningsOf(bare.player).months['2026-03'] = 80_000_00;
    expect(shareOf(bare.player, 'emergency', when)).toBe(Math.round(grown(CARE.price.emergency, 'emergency', when) * CARE.uninsuredMarkup));
    const la = pro('bare-la', 'us-ca-losangeles');
    earningsOf(la.player).months['2026-03'] = 40_000_00;
    expect(shareOf(la.player, 'emergency', when)).toBe(grown(CARE.price.emergency, 'emergency', when));
  });

  it('puts a stay in hospital between them and their work, and a bill due in 30 days that, unpaid, is a debt', () => {
    const sim = pro('hospital');
    // Uninsured, and over the income New York's hospitals give charity to.
    earningsOf(sim.player).months['2025-12'] = 100_000_00;
    const bill = careFor(sim, sim.player, { care: 'stay', what: 'A stay in hospital' }, sim.now)!;
    expect(healthOf(sim.player).inHospitalUntil).toBe(sim.now + CARE.stayDays * MS_DAY);
    expect(bill.dueAt - bill.at).toBe(MEDICAL_DEBT.dueDays * MS_DAY);
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0) a.balance = 0;
    play(sim, bill.dueAt + MS_HOUR);
    const debt = medicalDebtOf(sim, sim.player)!;
    expect(-debt.balance).toBe(bill.amount);
    expect(sim.execute({ kind: 'health.pay_bill', payload: { amount: 100_00 } }).ok).toBe(false);
  });

  it('keeps them from an audition while they’re in hospital, even on tape', () => {
    const sim = pro('ward');
    careerOf(sim.player).agencyId = 'gersh';
    careerOf(sim.player).agencyCity = 'us-ny-newyork';
    careFor(sim, sim.player, { care: 'stay', what: 'A stay in hospital' }, sim.now);
    const career = careerOf(sim.player);
    // Mid-afternoon the next day: awake, and in hospital.
    const a = { id: 'ward-a', roleId: 'costar', at: at(2026, 1, 6, 15), mode: 'tape' as const, cityId: 'us-ny-newyork' as const, status: 'ahead' as const };
    career.auditions.push(a);
    sim.schedule({ at: a.at, kind: 'career.audition', label: 'x', category: 'career', priority: 30, requiresPlayer: true, payload: { personId: sim.player.id, auditionId: a.id } });
    play(sim, a.at + 60_000);
    expect(career.auditions.find((x) => x.id === 'ward-a')!.status).toBe('missed');
    expect(sim.player.awakeSince! < a.at).toBe(true);
  });

  it('reports a medical debt only at $500, a year past due, and outside New York and California', () => {
    const sim = pro('debt', 'us-il-chicago');
    sim.player.credit!.score = 700;
    careFor(sim, sim.player, { care: 'emergency', what: 'The emergency room' }, sim.now);
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0) a.balance = 0;
    play(sim, sim.now + 31 * MS_DAY);
    const h = healthOf(sim.player);
    healthMonth(sim, sim.player, sim.now + 100 * MS_DAY);
    expect(sim.player.credit!.score).toBe(700);
    healthMonth(sim, sim.player, h.debtSince! + 366 * MS_DAY);
    expect(sim.player.credit!.score).toBe(700 - MEDICAL_DEBT.recordHit);
    const ny = pro('debt-ny');
    ny.player.credit!.score = 700;
    careFor(ny, ny.player, { care: 'visit', what: 'A doctor’s visit' }, ny.now);
    earningsOf(ny.player).months['2025-12'] = 100_000_00;
    careFor(ny, ny.player, { care: 'emergency', what: 'The emergency room' }, ny.now);
    for (const a of Object.values(ny.universe.accounts)) if (a.ownerId === ny.player.id && a.balance > 0) a.balance = 0;
    play(ny, ny.now + 31 * MS_DAY);
    healthMonth(ny, ny.player, healthOf(ny.player).debtSince! + 366 * MS_DAY);
    expect(ny.player.credit!.score).toBe(700);
  });
});

describe('a recurring role', () => {
  it('works an episode a week at the weekly performer’s rate, and past 60% of a 2027 season at 120%', () => {
    expect(arcUplift({ ...booking(pro('arc0'), 'recurring', 8, at(2027, 2, 1, 8)) }, 7)).toBe(RECURRING.uplift);
    const sim = pro('arc');
    const b = booking(sim, 'recurring', 8, at(2027, 2, 1, 8));
    expect(workDays(b)).toHaveLength(40);
    expect([0, 6, 7].map((e) => arcUplift(b, e))).toEqual([1, 1, RECURRING.uplift]);
    // Under 60% of the season, or a season begun before 2027, none.
    expect(arcUplift(booking(sim, 'recurring', 7, at(2027, 2, 1, 8)), 6)).toBe(1);
    expect(arcUplift(booking(sim, 'recurring', 9, at(2026, 10, 5, 8)), 8)).toBe(1);
    expect(rateOn(roleById('recurring').steps, '2026-07-01') * 5).toBe(4_456_00);
  });
});

describe('the premium tax credit where a program would take them', () => {
  it('gives a New Yorker at 200% of the poverty line none, where the Essential Plan takes them, and a Californian some', () => {
    const ny = pro('ep');
    recordWages(ny.player, at(2026, 5, 1), NY, { gross: 30_000_00 });
    healthOf(ny.player).premiums[2026] = [940_00];
    expect(figuresFor(ny.player, 2026).credit).toBe(0);
    const la = pro('ep-la', 'us-ca-losangeles');
    recordWages(la.player, at(2026, 5, 1), 'America/Los_Angeles', { gross: 30_000_00 });
    healthOf(la.player).premiums[2026] = [378_00];
    expect(figuresFor(la.player, 2026).credit).toBeGreaterThan(0);
  });
});

describe('part-year and nonresident returns', () => {
  it('taxes wages for work in Georgia there, credited by New York, and leaves small ones alone', () => {
    const sim = pro('ga');
    recordWages(sim.player, at(2026, 3, 1), NY, { gross: 40_000_00 });
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 20_000_00, where: 'us-ga-atlanta' });
    const f = figuresFor(sim.player, 2026);
    const ga = f.states.find((s) => s.state === 'us-ga')!;
    const end = at(2026, 12, 31, 12);
    expect(ga.tax).toBe(Math.round(computeAnnualTax(60_000_00, 'us-ga-atlanta', end).regional * (20_000_00 / 60_000_00)));
    const ny = f.states.find((s) => s.state === 'us-ny')!;
    expect(ny.tax).toBe(computeAnnualTax(60_000_00, 'us-ny-newyork', end).regional);
    expect(ny.credit).toBe(Math.min(ga.tax, Math.round(computeAnnualTax(60_000_00, 'us-ny-newyork', end).regional * (20_000_00 / 60_000_00))));
    const small = pro('ga-small');
    recordWages(small.player, at(2026, 3, 1), NY, { gross: 90_000_00 });
    recordWages(small.player, at(2026, 5, 1), NY, { gross: 2_000_00, where: 'us-ga-atlanta' });
    expect(figuresFor(small.player, 2026).states.find((s) => s.state === 'us-ga')!.tax).toBe(0);
    expect(STATE_RETURN.georgiaExempt).toBe(5_000_00);
  });

  it('taxes a part-year New Yorker by the share of the year’s income that came while living there, and the city only for its months', () => {
    const sim = pro('move-west');
    recordWages(sim.player, at(2026, 3, 1), NY, { gross: 30_000_00 });
    sim.player.home = { ...sim.player.home!, cityId: 'us-ca-losangeles' };
    sim.player.currentLocationId = 'us-ca-losangeles';
    recordWages(sim.player, at(2026, 9, 1), 'America/Los_Angeles', { gross: 50_000_00 });
    recordBenefit(sim.player, at(2026, 11, 1), 'America/Los_Angeles', 4_000_00);
    const f = figuresFor(sim.player, 2026);
    const end = at(2026, 12, 31, 12);
    const ny = f.states.find((s) => s.state === 'us-ny')!;
    expect(ny.tax).toBe(Math.round(computeAnnualTax(84_000_00, 'us-ny-newyork', end).regional * (30_000_00 / 84_000_00)));
    // California leaves the unemployment out of both sides.
    const ca = f.states.find((s) => s.state === 'us-ca')!;
    expect(ca.tax).toBe(Math.round(computeAnnualTax(80_000_00, 'us-ca-losangeles', end).regional * (50_000_00 / 80_000_00)));
    expect(f.local).toBe(Math.round(computeAnnualTax(84_000_00, 'us-ny-newyork', end).local * (30_000_00 / 84_000_00)));
    // New York City taxes its residents, and not those who've gone.
    expect(f.local).toBeGreaterThan(0);
    expect(f.local).toBeLessThan(computeAnnualTax(84_000_00, 'us-ny-newyork', end).local);
  });
});
