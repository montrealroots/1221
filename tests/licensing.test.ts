/**
 * Earning a driving license where you live (docs/WORLD.md, stage 1): the
 * jurisdiction's path booked step by step onto the calendar, paid for, kept
 * or missed, passed at the published rate; and keeping it, renewed, with a
 * permit to drive on abroad.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { addYears, documentsOf, licenseOf, mayDrive, type PersonDocument } from '@/engine/systems/documents';
import { LICENSE_KIND, applies, attemptFee, idpYears, passesTest, stepRefusal } from '@/engine/systems/licensing';
import { LICENSE_PATHS, PASS_RATES, passRate, publishedMean } from '@/engine/content/licensepaths';
import { CITIES } from '@/engine/content/geography';

const YEAR = 365.25 * MS_DAY;
/** In a town, on its clock, as a move there leaves them. */
function there(sim: Simulation, town: string): void {
  sim.player.currentLocationId = town;
  sim.universe.currentZone = CITIES.require(town).timeZone;
}
/** A life begun in a town, living there, with no papers yet and money enough to learn. */
function life(seed: string, town = 'us-ny-newyork'): Simulation {
  const sim = quickSave({ startLocationId: town, homeRegionId: town, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.documents = [];
  return sim;
}
const bank = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && (a.kind === 'checking' || a.kind === 'savings')).reduce((x, a) => x + a.balance, 0);
/** Lives to a moment as a person does, asleep from eleven each night for eight hours. */
function liveTo(sim: Simulation, target: number): void {
  for (let guard = 0; sim.now < target && guard < 10_000; guard += 1) {
    const zone = sim.universe.currentZone;
    const p = zonedParts(sim.now, zone);
    let night = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 23 }, zone);
    if (night <= sim.now) night = instantFromZoned({ ...normalDate(p.year, p.month, p.day + 1), hour: 23 }, zone);
    if (night >= target) { sim.advanceBy(target - sim.now); return; }
    sim.advanceBy(night - sim.now);
    sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
  }
}
const book = (sim: Simulation, step: string) => sim.execute<{ at: number[]; fee: number }>({ kind: 'documents.license_step', payload: { step } });

/** Takes a step to done, retaking a failed test after its wait; the attempts it took. */
function take(sim: Simulation, step: string): number {
  for (let tries = 1; tries <= 20; tries += 1) {
    const a = book(sim, step);
    if (!a.ok) {
      if (/Again from/.test(a.error ?? '')) { liveTo(sim, sim.now + (16 * MS_DAY)); tries -= 1; continue; }
      throw new Error(`${step}: ${a.error}`);
    }
    liveTo(sim, sim.now + (a.value!.at.at(-1)! - sim.now + 3 * MS_HOUR));
    if (sim.player.licensing!.done[step] !== undefined) return tries;
    liveTo(sim, sim.now + (16 * MS_DAY));
  }
  throw new Error(`${step} never passed`);
}

describe('a license in New York', () => {
  it('is earned by the permit test, the five-hour course and the road test, each paid and kept on the calendar; a learner drives only with someone beside them', () => {
    const sim = life('ny-path');
    expect(mayDrive(sim.player, 'us-ny-newyork', sim.now).ok).toBe(false);
    // The road test waits on the course, and the course on the permit.
    expect(stepRefusal(sim, sim.player, 'road')).toMatch(/Pre-Licensing Course first/);
    expect(stepRefusal(sim, sim.player, 'course')).toMatch(/Permit Test first/);
    const before = bank(sim);
    const a = book(sim, 'permit');
    expect(a.ok).toBe(true);
    expect(a.value!.fee).toBe(64_25);
    expect(before - bank(sim)).toBe(64_25);
    // On the calendar as a commitment, on a weekday at ten.
    const item = sim.universe.scheduled.find((i) => i.kind === LICENSE_KIND && i.status === 'pending')!;
    expect(item.requiresPlayer).toBe(true);
    expect(item.durationMinutes).toBe(90);
    expect(book(sim, 'permit').error).toMatch(/booked/);
    liveTo(sim, sim.now + (item.at - sim.now + MS_HOUR));
    if (sim.player.licensing!.done.permit === undefined) take(sim, 'permit');
    const permit = licenseOf(sim.player, sim.now)!;
    expect(permit.stage).toBe('learner');
    expect(mayDrive(sim.player, 'us-ny-newyork', sim.now).why).toMatch(/beside you/);
    const course = book(sim, 'course');
    expect(course.value!.fee).toBe(51_00);
    liveTo(sim, sim.now + (course.value!.at[0]! - sim.now + 6 * MS_HOUR));
    expect(sim.player.licensing!.done.course).toBeDefined();
    take(sim, 'road');
    const license = licenseOf(sim.player, sim.now)!;
    expect(license.name).toBe('Class D Driver License');
    expect(license.stage).toBe('full');
    expect(permit.status).toBe('cancelled');
    expect(mayDrive(sim.player, 'us-ny-newyork', sim.now).ok).toBe(true);
    expect(Math.round((license.expiresAt! - license.issuedAt!) / YEAR)).toBe(5);
    expect(stepRefusal(sim, sim.player, 'permit')).toMatch(/already/);
  });

  it('takes the fee of a test the player isn’t there for, and books nothing more until it is booked again', () => {
    const sim = life('ny-missed');
    const a = book(sim, 'permit');
    there(sim, 'us-ca-losangeles');
    const spent = bank(sim);
    liveTo(sim, sim.now + (a.value!.at[0]! - sim.now + MS_HOUR));
    expect(sim.player.licensing!.done.permit).toBeUndefined();
    expect(sim.player.licensing!.booked).toBeUndefined();
    expect(bank(sim)).toBeLessThanOrEqual(spent);
    there(sim, 'us-ny-newyork');
    expect(stepRefusal(sim, sim.player, 'permit')).toBeUndefined();
  });

  it('refuses a step the bank can’t cover, and takes nothing', () => {
    const sim = life('ny-broke');
    for (const acct of Object.values(sim.universe.accounts)) if (acct.ownerId === sim.player.id && !acct.nominal) acct.balance = Math.min(acct.balance, 0);
    const before = bank(sim);
    const a = book(sim, 'permit');
    expect(a.ok).toBe(false);
    expect(a.error).toMatch(/more than the bank/);
    expect(bank(sim)).toBe(before);
    expect(sim.player.licensing?.booked).toBeUndefined();
  });

  it('books around the player’s other commitments', () => {
    const sim = life('ny-clash');
    // Every weekday morning for three weeks is taken.
    for (let d = 0; d < 21; d += 1) {
      sim.schedule({ at: sim.now + d * MS_DAY + 2 * MS_HOUR, kind: LICENSE_KIND, label: 'Held', category: 'personal', requiresPlayer: true, durationMinutes: 24 * 60 - 60, payload: { personId: sim.player.id } });
    }
    const a = book(sim, 'permit');
    const at = a.value!.at[0]!;
    const clash = sim.universe.scheduled.some((i) => i.label === 'Held' && i.at < at + 90 * 60_000 && i.at + (i.durationMinutes ?? 0) * 60_000 > at);
    expect(clash).toBe(false);
  });
});

describe('the law’s waits, and what a fee covers', () => {
  it('holds a Connecticut road test ninety days after the permit', () => {
    const sim = life('ct-wait', 'us-ct-newhaven');
    take(sim, 'knowledge');
    take(sim, 'permit');
    take(sim, 'course');
    const no = stepRefusal(sim, sim.player, 'road');
    expect(no).toMatch(/Not before .*90 days after Learner Permit/);
    const since = sim.player.licensing!.done.permit!;
    liveTo(sim, since + 90 * MS_DAY + MS_HOUR);
    expect(stepRefusal(sim, sim.player, 'road')).toBeUndefined();
    // The license fee is paid on passing: $84 beside the road test.
    const before = bank(sim);
    take(sim, 'road');
    expect(licenseOf(sim.player, sim.now)!.name).toBe('Class D Operator’s License');
    expect(before - bank(sim)).toBeGreaterThanOrEqual(84_00);
  });

  it('lets California’s application cover three knowledge tests, then asks it again', () => {
    const sim = life('ca-covered', 'us-ca-losangeles');
    take(sim, 'application');
    sim.player.licensing!.used.application = 3;
    expect(stepRefusal(sim, sim.player, 'knowledge')).toMatch(/covers 3 attempts, all used: pay it again/);
    expect(stepRefusal(sim, sim.player, 'application')).toBeUndefined();
    const again = book(sim, 'application');
    expect(again.value!.fee).toBe(46_00);
    expect(sim.player.licensing!.used.application).toBe(0);
  });

  it('keeps a failed test from a retake for its days, and charges the retake’s fee', () => {
    const sim = life('bc-retake', 'ca-bc-vancouver');
    const path = LICENSE_PATHS['ca-bc']!;
    const step = path.steps.find((s) => s.id === 'knowledge')!;
    sim.player.licensing = { jurisdiction: 'ca-bc', done: {}, attempts: { knowledge: 1 }, failedAt: { knowledge: sim.now }, used: {} };
    expect(stepRefusal(sim, sim.player, 'knowledge')).toMatch(/Again from/);
    liveTo(sim, sim.now + ((step.retakeDays! + 1) * MS_DAY));
    expect(stepRefusal(sim, sim.player, 'knowledge')).toBeUndefined();
    // Connecticut's road test is in the $40 package the first time, and $30 each time after.
    const road = LICENSE_PATHS['us-ct']!.steps.find((s) => s.id === 'road')!;
    const fresh = { jurisdiction: 'us-ct', done: {}, attempts: {}, failedAt: {}, used: {} };
    expect(attemptFee(road, fresh)).toBe(0);
    expect(attemptFee(road, { ...fresh, attempts: { road: 1 } })).toBe(30);
    // New Zealand's learner fee covers two attempts at its theory test; the third is $54.60.
    const nz = LICENSE_PATHS.nz!.steps.find((s) => s.id === 'learner')!;
    const nzr = { jurisdiction: 'nz', done: {}, attempts: {}, failedAt: {}, used: {} };
    expect([0, 1, 2].map((used) => attemptFee(nz, { ...nzr, used: { learner: used } }))).toEqual([96.1, 0, 54.6]);
  });

  it('changes a rule on the day the law does: British Columbia’s road-test fee, and New Zealand’s full test', () => {
    const sim = life('dated');
    const bc = LICENSE_PATHS['ca-bc']!.steps;
    const on = (day: string) => Date.parse(`${day}T12:00:00Z`);
    expect(bc.filter((s) => applies(s, sim.player, on('2026-10-18')) && s.name === 'Class 7 Road Test').map((s) => s.fee)).toEqual([35]);
    expect(bc.filter((s) => applies(s, sim.player, on('2026-10-19')) && s.name === 'Class 7 Road Test').map((s) => s.fee)).toEqual([50]);
    const nz = LICENSE_PATHS.nz!.steps;
    const young = { ...sim.player, birthInstant: on('2002-01-01') };
    const older = { ...sim.player, birthInstant: on('1990-01-01') };
    expect(nz.filter((s) => applies(s, young, on('2026-12-01'))).map((s) => s.id)).toEqual(['learner', 'restricted', 'full']);
    expect(nz.filter((s) => applies(s, older, on('2026-12-01'))).map((s) => s.id)).toEqual(['learner', 'restricted', 'full25']);
    expect(nz.filter((s) => applies(s, young, on('2027-02-01'))).map((s) => s.id)).toEqual(['learner', 'restricted', 'full2027']);
  });
});

describe('a pass', () => {
  it('comes at the published rate, and at the mean of those published where nobody publishes one', () => {
    const sim = life('rates');
    const practical = LICENSE_PATHS.gb!.steps.find((s) => s.id === 'practical')!;
    const road = LICENSE_PATHS['us-ct']!.steps.find((s) => s.id === 'road')!;
    const n = 3000;
    let gb = 0;
    let ct = 0;
    for (let i = 1; i <= n; i += 1) {
      if (passesTest(sim, sim.player, 'gb', practical, i)) gb += 1;
      if (passesTest(sim, sim.player, 'us-ct', road, i)) ct += 1;
    }
    expect(gb / n).toBeGreaterThan(0.47);
    expect(gb / n).toBeLessThan(0.53);
    expect(passRate('us-ct-road').published).toBe(false);
    const mean = publishedMean('road');
    expect(ct / n).toBeGreaterThan(mean - 0.03);
    expect(ct / n).toBeLessThan(mean + 0.03);
    // Every test on every path has a rate to be taken at.
    for (const path of Object.values(LICENSE_PATHS)) for (const s of path.steps) if (s.kind === 'test') expect(PASS_RATES[s.pass ?? ''], s.id).toBeDefined();
  });
});

describe('keeping a license', () => {
  const holdFull = (sim: Simulation, expiresIn: number): PersonDocument => {
    const d: PersonDocument = { id: 'lic', kind: 'license', issuer: 'us-ny', name: 'Class D Driver License', number: 'D1', status: 'valid', issuedAt: sim.now - 7 * YEAR, expiresAt: sim.now + expiresIn };
    documentsOf(sim.player).push(d);
    return d;
  };

  it('renews in its last months at the authority’s fee, for its term from the day it would have run out', () => {
    const sim = life('renew');
    const old = holdFull(sim, 400 * MS_DAY);
    expect(sim.execute({ kind: 'documents.renew_license', payload: {} }).error).toMatch(/within 6 months/);
    old.expiresAt = sim.now + 60 * MS_DAY;
    const was = old.expiresAt;
    const before = bank(sim);
    const a = sim.execute<{ expiresAt: number; fee: number }>({ kind: 'documents.renew_license', payload: {} });
    expect(a.ok).toBe(true);
    expect(before - bank(sim)).toBe(64_50);
    expect(a.value!.expiresAt).toBe(addYears(was, 8));
    expect(old.status).toBe('cancelled');
    expect(licenseOf(sim.player, sim.now)!.expiresAt).toBe(a.value!.expiresAt);
  });

  it('issues an International Driving Permit at home, for a year and no longer than the license, and Tokyo lets it drive', () => {
    const sim = life('idp');
    holdFull(sim, 5 * YEAR);
    there(sim, 'jp-13-tokyo');
    expect(sim.execute({ kind: 'documents.apply_idp', payload: {} }).error).toMatch(/issued at home/);
    there(sim, 'us-ny-newyork');
    const a = sim.execute<{ expiresAt: number; fee: number }>({ kind: 'documents.apply_idp', payload: {} });
    expect(a.value!.fee).toBe(20_00);
    expect(Math.round((a.value!.expiresAt - sim.now) / MS_DAY)).toBe(365);
    expect(mayDrive(sim.player, 'jp-13-tokyo', sim.now).ok).toBe(true);
    // No longer than the license it goes beside.
    const soon = life('idp-soon');
    holdFull(soon, 100 * MS_DAY);
    const b = soon.execute<{ expiresAt: number; fee: number }>({ kind: 'documents.apply_idp', payload: {} });
    expect(Math.round((b.value!.expiresAt - soon.now) / MS_DAY)).toBe(100);
    expect(idpYears('1926/1949: 12 months; 1968: 3 years')).toBe(1);
    expect(idpYears(null)).toBe(1);
    expect(idpYears('Up to 3 years, never beyond the CNH')).toBe(3);
  });
});

describe('a pass that lapses', () => {
  it('keeps a British theory pass two years, and after it the practical test asks it again', () => {
    const sim = life('gb-lapse', 'uk-eng-london');
    sim.player.licensing = { jurisdiction: 'gb', done: { provisional: sim.now - 800 * MS_DAY, theory: sim.now - 700 * MS_DAY }, attempts: {}, failedAt: {}, used: {} };
    expect(stepRefusal(sim, sim.player, 'practical')).toBeUndefined();
    sim.player.licensing.done.theory = sim.now - 731 * MS_DAY;
    expect(stepRefusal(sim, sim.player, 'practical')).toMatch(/Theory Test first/);
    expect(stepRefusal(sim, sim.player, 'theory')).toBeUndefined();
  });

  it('books a visit on a business day: never a weekend', () => {
    const sim = life('weekend');
    // To a Monday: a written test is booked five days on, a Saturday.
    while (zonedParts(sim.now, sim.zone).weekday !== 1) liveTo(sim, sim.now + MS_DAY);
    const a = book(sim, 'permit');
    const day = zonedParts(a.value!.at[0]!, sim.zone).weekday;
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(5);
  });
});

describe('two licenses', () => {
  it('drives on a full license from another state while a learner’s permit is held here', () => {
    const sim = life('two', 'us-ct-newhaven');
    documentsOf(sim.player).push({ id: 'ct', kind: 'license', issuer: 'us-ct', name: 'Adult Learner’s Permit', number: 'D2', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + YEAR, stage: 'learner', alone: false });
    documentsOf(sim.player).push({ id: 'ny', kind: 'license', issuer: 'us-ny', name: 'Class D Driver License', number: 'D1', status: 'valid', issuedAt: sim.now - YEAR, expiresAt: sim.now + 4 * YEAR });
    expect(licenseOf(sim.player, sim.now)!.id).toBe('ny');
    expect(mayDrive(sim.player, 'us-ct-newhaven', sim.now).ok).toBe(true);
  });
});

describe('a path across a save', () => {
  it('carries its progress and its booking through saving and opening, and the booking is kept after', () => {
    const sim = life('saved');
    const a = book(sim, 'permit');
    const opened = loadSave(deserialise(serialise(sim.universe)));
    expect(opened.player.licensing!.booked!.step).toBe('permit');
    liveTo(opened, opened.now + (a.value!.at[0]! - opened.now + MS_HOUR));
    const r = opened.player.licensing!;
    expect(r.booked).toBeUndefined();
    expect(r.attempts.permit).toBe(1);
    expect(r.done.permit !== undefined || r.failedAt.permit !== undefined).toBe(true);
  });
});

describe('every path', () => {
  const TOWNS: Record<string, string> = {
    'us-ny': 'us-ny-newyork', 'us-ct': 'us-ct-newhaven', 'us-ca': 'us-ca-losangeles', gb: 'uk-eng-london', 'ca-on': 'ca-on-toronto', 'ca-bc': 'ca-bc-vancouver',
    ie: 'ie-lei-dublin', is: 'is-39-reykjavik', de: 'de-be-berlin', fr: 'fr-idf-paris', es: 'es-md-madrid', jp: 'jp-13-tokyo', kr: 'kr-11-seoul',
    'mx-cmx': 'mx-cmx-mexicocity', 'au-nsw': 'au-nsw-sydney', br: 'br-27-saopaulo', nz: 'nz-wgn-wellington', lv: 'lv-25-riga',
  };

  it('is walked to a full license in every jurisdiction a town reaches, through its waits, retakes and fees', () => {
    for (const [j, town] of Object.entries(TOWNS)) {
      const sim = life(`walk-${j}`, town);
      let guard = 0;
      while (!(licenseOf(sim.player, sim.now)?.stage === 'full' && licenseOf(sim.player, sim.now)?.issuer === j)) {
        if (guard++ > 200) throw new Error(`${j} never finished: ${JSON.stringify(sim.player.licensing)}`);
        const path = LICENSE_PATHS[j]!;
        const open = path.steps.filter((s) => applies(s, sim.player, sim.now)).find((s) => !stepRefusal(sim, sim.player, s.id));
        if (!open) {
          // Nothing open: a wait or a retake's days, or a license in the post.
          liveTo(sim, sim.now + (7 * MS_DAY));
          continue;
        }
        const a = book(sim, open.id);
        expect(a.ok, `${j} ${open.id}: ${a.error}`).toBe(true);
        liveTo(sim, sim.now + (a.value!.at.at(-1)! - sim.now + 3 * MS_HOUR));
      }
      expect(mayDrive(sim.player, town, sim.now).ok, j).toBe(true);
      expect(sim.player.licensing!.booked, j).toBeUndefined();
    }
  }, 120_000);
});

describe('a license from elsewhere', () => {
  const held = (sim: Simulation, issuer: string): PersonDocument => {
    const d: PersonDocument = { id: `lic-${issuer}`, kind: 'license', issuer, name: 'License', number: 'D1', status: 'valid', issuedAt: sim.now - 2 * YEAR, expiresAt: sim.now + 3 * YEAR };
    documentsOf(sim.player).push(d);
    return d;
  };

  it('is exchanged in New York for its fee, without the tests, and the old one surrendered', () => {
    const sim = life('exchange-ny');
    const ct = held(sim, 'us-ct');
    expect(stepRefusal(sim, sim.player, 'permit')).toMatch(/exchanges here without the tests/);
    const before = bank(sim);
    const a = sim.execute<{ expiresAt: number; fee: number }>({ kind: 'documents.exchange_license', payload: {} });
    expect(a.ok).toBe(true);
    expect(before - bank(sim)).toBe(64_25);
    expect(ct.status).toBe('cancelled');
    const ny = licenseOf(sim.player, sim.now)!;
    expect(ny.issuer).toBe('us-ny');
    expect(ny.name).toBe('Class D Driver License');
    expect(ny.expiresAt).toBe(addYears(ny.issuedAt!, 8));
    expect(sim.execute({ kind: 'documents.exchange_license', payload: {} }).error).toMatch(/already/);
  });

  it('is exchanged in British Columbia from Britain for a first two-year license, and not in California, whose exchange wasn’t confirmed', () => {
    const bc = life('exchange-bc', 'ca-bc-vancouver');
    held(bc, 'gb');
    const a = bc.execute<{ expiresAt: number; fee: number }>({ kind: 'documents.exchange_license', payload: {} });
    expect(a.ok).toBe(true);
    const lic = licenseOf(bc.player, bc.now)!;
    expect(lic.issuer).toBe('ca-bc');
    expect(lic.expiresAt).toBe(addYears(lic.issuedAt!, 2));
    const ca = life('exchange-ca', 'us-ca-losangeles');
    held(ca, 'us-ny');
    expect(ca.execute({ kind: 'documents.exchange_license', payload: {} }).error).toMatch(/couldn’t confirm/);
    // A license from a country Ontario doesn't list isn't exchanged there.
    const on = life('exchange-on', 'ca-on-toronto');
    held(on, 'br');
    expect(on.execute({ kind: 'documents.exchange_license', payload: {} }).error).toMatch(/doesn’t exchange/);
  });
});
