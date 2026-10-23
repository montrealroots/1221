/**
 * Five Papers and School defects found by the triage of 2026-10-12, each held here against the engine and the screen
 * that shows it (from 2026-10-12): a withdrawal by the fifteenth day of classes said Yale Health was canceled back to
 * the term's start, where it went back to the insurance term's (1 August) in a fall and only to the day of withdrawing
 * in a spring; HUSKY D's work test counted a benefit, interest or a pension as work, and never read the 80 hours it
 * named (the 80 hours stood until 2026-10-17, when brief 12 had them cut; from 2026-10-16 a month's income of any kind counts toward the $580 again, as CMS's rule of
 * 3 June 2026 reads it, and a renewal reads six months); Your Cover, Home (Papers' head from 2026-10-23) and the bills' subtitle called Covered Connecticut and HUSKY D the Essential Plan; Yale's
 * dental plan bought in August covered five weeks, and the degree ended a paid year with no refund; and Your Doctor's
 * and Your Pharmacy's empty options did nothing once a choice was made, beside a pharmacy price with no currency.
 *
 * The screens are rendered to markup (react-dom/server) over real saves, as tests/defects-g8-3.test.ts renders them:
 * `useGame` stands in for the provider and `run` is the save's own `execute`. React's `useState(false)` is answered
 * `true` while `h.asking` is set, which is the one press that opens the withdrawal's explanation (nothing else on the
 * Standing tab keeps a `false` state). PLAYER JOURNEYS play through commands; FIXTURES set a state by hand to reach one
 * rule, and say so.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { PUBLIC_COVER } from '@/engine/content/safetynet';
import { US_PHARMACIES } from '@/engine/content/carevisits';
import { recordBenefit, recordInterest } from '@/engine/systems/earnings';
import { coverLabel, coverOn, healthMonth, healthOf, teethAndEyesShareOf } from '@/engine/systems/health';
import { DOCTOR_KINDS, clinicsIn } from '@/engine/systems/clinics';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tabs: {} as Record<string, string>,
  asking: false,
}));

// The withdrawal's explanation shows after a press (`asking`): answered open while `h.asking` is set.
vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((init: unknown) => (h.asking && init === false ? [true, () => undefined] : real.useState(init))) as typeof real.useState;
  return { ...real, useState, default: { ...real, useState } };
});

// The screens' kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');
const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
const student = (seed: string, extra: Record<string, unknown> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** A life in New Haven with no school, as tests/safetynet.test.ts makes one: it starts on 5 January 2026. */
const newHaven = (seed: string) => quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', livesWhereBorn: true, wealth: 'comfortable' }, seed);
/** Played by somebody who looks after themselves, as tests/leave.test.ts plays one. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);

/** A screen as the player has it: its markup, and its text with the tags taken out. */
function drawn(sim: Simulation, screen: FunctionComponent, tabs: Record<string, string> = {}, asking = false): { html: string; text: string } {
  h.sim = sim;
  h.tabs = tabs;
  h.asking = asking;
  try {
    const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
    return { html, text: html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/\s+/g, ' ') };
  } finally {
    h.asking = false;
  }
}
const healthTab = { 'tab:/workspace/papers': 'health' };
/** A select's options as drawn: each one's value and its words. */
const optionsOf = (html: string, id: string) => [...(html.match(new RegExp(`<select id="${id}"[\\s\\S]*?</select>`))?.[0] ?? '').matchAll(/<option value="([^"]*)"[^>]*>([^<]*)<\/option>/g)].map((m) => ({ value: m[1]!, words: m[2]! }));
/** FIXTURE: a work posting as Yale's payroll makes one, its hours in its memo (`workedBetween`), on a day of our choosing. */
const worked = (sim: Simulation, when: number, hours: number, pay: number) => sim.post({ at: when, memo: `Work-study wages, ${hours} hours: Yale`, category: 'salary', postings: [{ accountId: sim.player.primaryAccountId!, amount: pay }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -pay }] });

describe('a withdrawal by the fifteenth day of classes says when Yale Health’s cover ends', () => {
  it('PLAYER JOURNEY: in a fall it goes back to 1 August, the insurance term’s start, three weeks before the term began', () => {
    const sim = student('g84-withdraw-fall');
    tended(sim, at(2026, 9, 8, 12));
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
    // What the cover did: care on 10 August, two weeks before the term began on 24 August, is no longer Yale's.
    expect(coverOn(sim.player, at(2026, 8, 10))).not.toBe('yale');
    const body = titled(sim, 'You Withdrew From The School')[0]!.body;
    expect(body).not.toMatch(/back to the term’s start/);
    expect(body).toMatch(/canceled back to August 1, 2026, the start of its insurance term/);
  });

  it('PLAYER JOURNEY: in a spring it ends that day, and care since 4 January stays covered by the fall’s insurance term', () => {
    const sim = student('g84-withdraw-spring');
    tended(sim, at(2027, 1, 13, 12));
    expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
    // The term began on 4 January; its insurance term on 1 February, after the withdrawal. Care before it was Yale's.
    expect(coverOn(sim.player, at(2027, 1, 6))).toBe('yale');
    expect(coverOn(sim.player, at(2027, 1, 14))).not.toBe('yale');
    const body = titled(sim, 'You Withdrew From The School')[0]!.body;
    expect(body).not.toMatch(/back to the term’s start|canceled back/);
    expect(body).toMatch(/Yale Health’s cover ends today/);
  });

  it('the Standing tab says it before the press that confirms it: the day you withdraw, or 1 August where that came first', () => {
    const sim = student('g84-withdraw-screen');
    const { text } = drawn(sim, SchoolWorkspace, { 'tab:/workspace/school': 'standing' }, true);
    expect(text).toMatch(/Withdrawing gives up your place today/);
    expect(text).not.toMatch(/back to the term’s start/);
    expect(text).toMatch(/ends the day you withdraw, or goes back to the start of its insurance term \(August 1, for a fall term\) where that came first/);
  });
});

describe('HUSKY D’s work test reads last month’s work: its hours and its pay until 2026-10-17, and since then its pay as income', () => {
  // FIXTURE: HUSKY D held since January 2027 and up for renewal on 1 July, after the work test began (2027).
  const huskyD = (seed: string) => {
    const sim = newHaven(seed);
    healthOf(sim.player).program = { kind: 'medicaid', state: 'ct', from: at(2027, 1, 1, 0), band: 'low', renewAt: at(2027, 7, 1, 0) };
    return sim;
  };
  const renewal = at(2027, 7, 1, 1);

  // Its title kept whole inside the new one, for what cites it. Until 2026-10-16 this held that a benefit and interest
  // didn't count, and ended her at the renewal's hour. CMS's rule of 3 June 2026 reads the month's income of any kind
  // toward the $580 ("The agency must determine the monthly income based on the individual's MAGI-based income", 42 CFR
  // 435.552(f)(2), read 2026-10-16), so $700 of benefit and $20 of interest renew her; $500 and $20 don't, and that twin
  // is sent a notice of noncompliance and kept covered while she answers (435.558).
  it('until 2026-10-16 it read: ends at renewal for somebody whose June was an unemployment benefit and interest and no work, however much; since then $720 of them renews her, and $520 brings a notice of noncompliance', () => {
    expect(PUBLIC_COVER.workFrom <= '2027-07-01').toBe(true);
    const sim = huskyD('g84-work-benefit');
    recordBenefit(sim.player, at(2027, 6, 10), NY, 700_00);
    recordInterest(sim.player, at(2027, 6, 30), NY, 20_00);
    healthMonth(sim, sim.player, renewal);
    expect(healthOf(sim.player).program!.until).toBeUndefined();
    expect(healthOf(sim.player).program!.renewAt).toBe(at(2028, 1, 1, 0));
    expect(titled(sim, 'Your Public Cover Is Renewed').map((n) => n.body)).toEqual(['HUSKY D is renewed. Its next renewal is on January 1, 2028. Last month’s income is within its limit, and you met its work rules in June 2027, with $580.00 or more of income.']);
    const short = huskyD('g84-work-benefit-short');
    recordBenefit(short.player, at(2027, 6, 10), NY, 500_00);
    recordInterest(short.player, at(2027, 6, 30), NY, 20_00);
    healthMonth(short, short.player, renewal);
    expect(short.player.health!.program!.until).toBeUndefined();
    expect(coverOn(short.player, renewal + MS_DAY)).toBe('medicaid');
    expect(short.player.health!.pending).toMatchObject({ kind: 'renewal', noticeAt: renewal, decideAt: at(2027, 8, 5, 0), months: ['2027-06', '2027-05', '2027-04', '2027-03', '2027-02', '2027-01'] });
    expect(titled(short, 'A Notice Of Noncompliance').map((n) => n.body)).toEqual(['HUSKY D couldn’t find $580.00 of income, time at the School or an exception in any month from January to June 2027. You stay covered while you answer, until August 4, 2027. You don’t need to send anything about your pay, income, time at the School, age or SNAP: those come from the records. A stay in hospital in those months also counts if you ask for it: press Request A Hardship Exception on Papers, under Health Cover. If you don’t answer, HUSKY D ends on August 31, 2027, and you’ll be told on August 5, 2027. After that, you won’t get the premium tax credit while HUSKY D would take you if not for its work rules. You can apply again in any month after one that meets them.']);
    expect(titled(short, 'Your Public Cover Ends')).toEqual([]);
  });

  it('renews on $580 of pay, worked in June, whatever the hours', () => {
    const sim = huskyD('g84-work-pay');
    worked(sim, at(2027, 6, 12), 20, 600_00);
    healthMonth(sim, sim.player, renewal);
    expect(healthOf(sim.player).program!.until).toBeUndefined();
    expect(healthOf(sim.player).program!.renewAt).toBe(at(2028, 1, 1, 0));
  });

  // Its title kept whole inside the new one, twice, for what cites it. Until 2026-10-16 a renewal read June alone, and May's work didn't count: Connecticut reads the six months before a renewal, any one of them (CHA's HUSKY D materials from
  // DSS's, 8/25/26, read 2026-10-16; `lookBack`), so May's month renews her; July's, the renewal's own month, still doesn't, and 79 hours in June with July's 80 bring a notice of noncompliance. Until 2026-10-17 80 hours renewed her
  // whatever they paid, by `monthEngagement`'s work branch, which brief 12 had cut as serving no necessary purpose (docs/verification/resolution-2026-10-17/health-criteria.md): no wage SLATE has paid, in play or in any save's
  // history, came to under $7.25 an hour where the rules are read, so 80 paid hours always met the $580 income test too.
  it('until 2026-10-17 it read: until 2026-10-16 it read: renews on 80 hours, whatever the pay, and not on 79; work paid in May or July isn’t June’s; since then any of the six months before the renewal counts, May among them, and July, its own month, still doesn’t; since then the hours aren’t read: 80 hours paid $400 in June bring a notice of noncompliance, and May’s 80 paid $1,840 renew her by their income', () => {
    // FIXTURE: 80 hours at $5 an hour, under the $580 the income test asks, which no save can hold. They're read as their pay, $400, and nothing else meets
    // the rules from January to June, so she's sent a notice and covered while she answers, where until 2026-10-17 she was renewed "by 80 hours’ work".
    const enough = huskyD('g84-work-hours');
    worked(enough, at(2027, 6, 12), 80, 400_00);
    healthMonth(enough, enough.player, renewal);
    expect([enough.player.health!.program!.until, coverOn(enough.player, renewal + MS_DAY)]).toEqual([undefined, 'medicaid']);
    expect(enough.player.health!.pending).toMatchObject({ kind: 'renewal', noticeAt: renewal, months: ['2027-06', '2027-05', '2027-04', '2027-03', '2027-02', '2027-01'] });
    expect([titled(enough, 'Your Public Cover Is Renewed').length, titled(enough, 'A Notice Of Noncompliance').length]).toEqual([0, 1]);
    const may = huskyD('g84-work-hours-may');
    worked(may, at(2027, 6, 12), 79, 400_00);
    worked(may, at(2027, 5, 31, 12), 80, 1_840_00);
    healthMonth(may, may.player, renewal);
    expect(may.player.health!.program!.until).toBeUndefined();
    expect(may.player.health!.pending).toBeUndefined();
    expect(titled(may, 'Your Public Cover Is Renewed')[0]!.body).toMatch(/you met its work rules in May 2027, with \$580\.00 or more of income\.$/);
    const short = huskyD('g84-work-hours-short');
    worked(short, at(2027, 6, 12), 79, 400_00);
    worked(short, at(2027, 7, 1, 0) + 30 * 60_000, 80, 1_840_00);
    healthMonth(short, short.player, renewal);
    expect(short.player.health!.program!.until).toBeUndefined();
    expect(short.player.health!.pending).toMatchObject({ kind: 'renewal', noticeAt: renewal });
    expect(titled(short, 'Your Public Cover Is Renewed')).toEqual([]);
  });
});

describe('a program is called by its own name', () => {
  // FIXTURE: a program held since a day before, as Enroll on Papers makes one.
  const holding = (sim: Simulation, state: 'ny' | 'ca' | 'ct', kind: 'medicaid' | 'essential') => {
    healthOf(sim.player).program = { kind, state, from: sim.now - MS_DAY, band: 'low', renewAt: sim.now + 180 * MS_DAY };
    return sim;
  };

  it('in each state SLATE keeps: HUSKY D, Covered Connecticut, Medi-Cal, the Essential Plan and Medicaid', () => {
    const sim = newHaven('g84-label');
    const label = (state: 'ny' | 'ca' | 'ct', kind: 'medicaid' | 'essential') => coverLabel(holding(sim, state, kind).player, sim.now);
    expect(label('ct', 'medicaid')).toBe('HUSKY D');
    expect(label('ct', 'essential')).toBe('Covered Connecticut');
    expect(label('ca', 'medicaid')).toBe('Medi-Cal');
    expect(label('ny', 'essential')).toBe('Essential Plan');
    expect(label('ny', 'medicaid')).toBe('Medicaid');
    expect(coverLabel(student('g84-label-yale').player, at(2026, 8, 25))).toBe('Yale Health');
    delete healthOf(sim.player).program;
    expect(coverLabel(sim.player, sim.now)).toBeUndefined();
  });

  /** FIXTURE: the degree conferred in May 2026, so Yale Health ended on 1 August (until 2026-10-23 Home showed Papers' line to a student's life only). */
  const graduate = (seed: string) => {
    const sim = student(seed);
    Object.assign(sim.player.school!, { standing: 'graduated', endedAt: at(2026, 5, 18) });
    return sim;
  };

  // Renamed on 2026-10-23 (brief 23), when Home's Papers line went to the head of Papers: until then “… and on Home’s Papers line”.
  it('on Your Cover, on the bills’ subtitle and at the head of Papers', () => {
    const husky = holding(graduate('g84-label-husky'), 'ct', 'medicaid');
    const papers = drawn(husky, PapersWorkspace, healthTab).text;
    expect(papers).toMatch(/This Month HUSKY D/);
    expect(papers).toMatch(/Care And Its Bills HUSKY D: \$0\.00 paid this year /); expect(papers).not.toMatch(/of \$0\.00 paid this year/); // no most a year, said as none from 2026-10-17 (it read “HUSKY D: $20.00 of $0.00 paid this year”)
    expect(papers).not.toMatch(/Essential Plan:|This Month Medicaid/);
    expect(papers).toMatch(/^\s*Your Affairs Papers .*? Cover: HUSKY D\. /);
    const covered = holding(graduate('g84-label-covered'), 'ct', 'essential');
    const coveredPapers = drawn(covered, PapersWorkspace, healthTab).text;
    expect(coveredPapers).toMatch(/This Month Covered Connecticut .*Care And Its Bills Covered Connecticut: /); expect(coveredPapers).toMatch(/^\s*Your Affairs Papers .*? Cover: Covered Connecticut\. /);
  });
});

describe('Yale’s dental plan runs Yale’s plan year', () => {
  it('PLAYER JOURNEY: bought on the first day, 24 August, it runs to 30 September a year on, at the year’s price', () => {
    const sim = student('g84-dental');
    expect(sim.execute({ kind: 'health.dental', payload: { on: true } })).toMatchObject({ ok: true, value: { plan: 'yale' } });
    expect(zonedParts(healthOf(sim.player).dental!.until!, NY)).toMatchObject({ year: 2027, month: 10, day: 1 });
  });

  it('bought in October or in July, it runs to the next 30 September', () => {
    const fall = student('g84-dental-oct');
    tended(fall, at(2026, 10, 2));
    fall.must({ kind: 'health.dental', payload: { on: true } });
    expect(zonedParts(healthOf(fall.player).dental!.until!, NY)).toMatchObject({ year: 2027, month: 10, day: 1 });
  });

  it('a paid year isn’t ended by the degree: it covers a cleaning in September after Yale Health ended on 1 August', () => {
    const sim = student('g84-dental-degree');
    sim.must({ kind: 'health.dental', payload: { on: true } });
    // FIXTURE: the degree conferred in May 2027, as Commencement confers it, so Yale Health covers to 31 July.
    Object.assign(sim.player.school!, { standing: 'graduated', endedAt: at(2027, 5, 24) });
    expect(coverOn(sim.player, at(2027, 8, 2))).not.toBe('yale');
    healthMonth(sim, sim.player, at(2027, 8, 1, 1));
    healthMonth(sim, sim.player, at(2027, 9, 1, 1));
    expect(zonedParts(healthOf(sim.player).dental!.until!, NY)).toMatchObject({ year: 2027, month: 10, day: 1 });
    expect(teethAndEyesShareOf(sim.player, 'cleaning', at(2027, 9, 15))).toBe(0);
  });

  it('a monthly plan still ends with the health cover it’s bought beside', () => {
    // FIXTURE: New York's own dental plan, held by somebody who has moved to New Haven, where SLATE sells none.
    const sim = newHaven('g84-dental-monthly');
    healthOf(sim.player).dental = { plan: 'ny', from: sim.now, deductible: {}, paid: {} };
    healthMonth(sim, sim.player, at(2026, 2, 1, 1));
    expect(healthOf(sim.player).dental!.until).toBe(at(2026, 2, 1, 1));
  });
});

describe('Your Doctor and Your Pharmacy offer only what can be chosen', () => {
  it('shows the empty choice only while nothing is chosen, and the chain’s price in the save’s money', () => {
    const sim = newHaven('g84-doctor');
    let { html } = drawn(sim, PapersWorkspace, healthTab);
    // New Haven keeps one practice, so it has no Your Doctor box (from 2026-10-13); until then this test chose the
    // practice here, beside The Town’s First Practice, the same place. The doctor’s half is London’s, below.
    expect(optionsOf(html, 'own-doctor')).toEqual([]);
    expect(optionsOf(html, 'own-pharmacy')[0]).toEqual({ value: '', words: 'Any Pharmacy, At The Typical Price' });
    expect(optionsOf(html, 'own-pharmacy').map((o) => o.words)).toContain('Walmart Pharmacy, A Generic $4.00 Uninsured');
    sim.must({ kind: 'health.choose_pharmacy', payload: { chain: US_PHARMACIES[0]!.id } });
    ({ html } = drawn(sim, PapersWorkspace, healthTab));
    expect(optionsOf(html, 'own-pharmacy').map((o) => o.value)).not.toContain('');
    expect(optionsOf(html, 'own-pharmacy').length).toBeGreaterThan(0);

    // A town of three practices, London: the empty choice shows until one is picked.
    const london = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'comfortable' }, 'g84-doctor-london');
    const practices = clinicsIn(london.player.currentLocationId).filter((c) => DOCTOR_KINDS.includes(c.kind));
    expect(practices.length).toBe(3);
    ({ html } = drawn(london, PapersWorkspace, healthTab));
    expect(optionsOf(html, 'own-doctor')[0]).toEqual({ value: '', words: 'The First Practice In Town' });
    london.must({ kind: 'health.choose_clinic', payload: { clinicId: practices.at(-1)!.id } });
    ({ html } = drawn(london, PapersWorkspace, healthTab));
    expect(optionsOf(html, 'own-doctor').map((o) => o.value)).not.toContain('');
    expect(optionsOf(html, 'own-doctor').map((o) => o.value)).toEqual(practices.map((c) => c.id));
    // The empty choice was refused by the engine anyway: there was nothing it could do once a choice was made.
    expect(london.execute({ kind: 'health.choose_clinic', payload: { clinicId: '' } }).ok).toBe(false);
    expect(sim.execute({ kind: 'health.choose_pharmacy', payload: { chain: '' } }).ok).toBe(false);
  });
});
