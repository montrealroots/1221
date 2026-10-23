/**
 * Work abroad, Sydney first (brief 25, `docs/verification/career-world-2026-10-23/criteria.md`, W1 to W12; the dossier's
 * T11, T12, T19, T21, T22 and T28): a feature shooting in Sydney found, auditioned for on tape and booked; the visa it
 * needs applied for and granted; the trip out, the work there, the pay, and the trip home, with each stage saved and
 * loaded; and the ways it doesn't go: no visa at the first flight, a country whose rules aren't in the game, the School's
 * classes and an audition at home while away.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole at Yale, born in New York, played by the clock
 * and the commands a player sends. TEST SETUP, said where it's done, as tests/pro-work.test.ts does it: the body tended
 * as the clock moves; a graduate made through the School's own Commencement handler; a skilled actor's levels set as
 * years of work would leave them; and the first of a list of seeds whose posting and casting go the way the journey
 * needs, the draw's own spread being tested in tests/pro-work.test.ts (J5).
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { answerStop } from '@/engine/world/clock';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { COMMENCEMENT_KIND, EVALUATION_KIND, evenCraft } from '@/engine/systems/school';
import { attributesOf } from '@/engine/systems/attributes';
import { genreState } from '@/engine/systems/engagement';
import { PROJECTS, projectById } from '@/engine/content/careerwork';
import { BRIEFS } from '@/engine/content/briefs';
import { JURISDICTIONS, jurisdictionOf } from '@/engine/content/jurisdictions';
import type { Opportunity } from '@/engine/systems/pro';
import { AUDITION_KIND, acceptRefusal, acceptWarning, awayAt, bookedClash, conditionsFor, datesOf, projectOf, roundToCome, spansOf, tapeRefusal } from '@/engine/systems/projobs';
import { TRIP, abroadRead, flightPath, legPhrase, needsTrip, planTrip, tripOf, visaFor, whereAt, windowOf } from '@/engine/systems/worktrip';
import { yearOf } from '@/engine/systems/earnings';
import { documentsOf, passportOf } from '@/engine/systems/documents';

// The Career screen's Work tab drawn over the journey's save, as tests/propay-screen.test.ts draws it: `useGame` standing
// in for the provider, the kept tab answered from `h.tab`.
const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/career' ? 'work' : initial) as T, () => undefined] as const };
});
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({ get sim() { return h.sim; }, version: 0, run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }), toast: noop } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
const { WorkspaceRouter } = await import('@/ui/workspaces/WorkspaceRouter');
const { WorkPane: PapersWork } = await import('@/ui/papers/Documents');
/** The Work tab's markup, and the words a player sees, every tooltip taken out before the tags. */
function workTab(sim: Simulation): { html: string; shown: string } {
  h.sim = sim;
  const html = renderToStaticMarkup(createElement(WorkspaceRouter, { route: '/workspace/career' })).replace(/<!-- -->/g, '');
  return { html, shown: html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ') };
}

const zone = 'America/New_York';
const SYD = 'Australia/Sydney';
const at = (year: number, month: number, day: number, hour = 9, minute = 0, z = zone) => instantFromZoned({ year, month, day, hour, minute }, z);
const student = (seed: string, more: Partial<ReturnType<typeof newLifeConfig>> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...more });
const tend = (sim: Simulation) => {
  Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
  sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
};
/** TEST SETUP: rested, fed and awake each time the clock moves, six hours at a time. */
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) { tend(sim); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); }
};
/** Played as a player plays it from the top bar: stopping at every commitment that wants the player, and Go pressed. TEST SETUP: tended as it moves. */
const played = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    tend(sim);
    const wanted = Math.min(until, sim.now + 6 * MS_HOUR);
    let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
    for (let n = 0; r.interruptedBy && n < 50; n += 1) { tend(sim); r = answerStop(sim, { item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, 'go').result!; }
  }
};
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const notices = (sim: Simulation, from = 0) => sim.universe.notifications.filter((n) => n.category === 'career' && n.at >= from).map((n) => `${n.title} | ${n.body}`);

/** TEST SETUP: a graduate of the class of 2029, by the School's own evaluation and Commencement, as tests/pro-work.test.ts makes one. */
function graduate(seed: string, more: Partial<ReturnType<typeof newLifeConfig>> = {}) {
  const sim = student(seed, more);
  tended(sim, at(2026, 9, 1, 18));
  const school = sim.player.school!;
  Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
  school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 20, excused: 0 } } as never;
  sim.schedule({ at: sim.now + 60_000, kind: EVALUATION_KIND, label: 'Spring Term 2029 Evaluation', category: 'school', priority: 32, requiresPlayer: false, payload: { personId: sim.player.id, term: 5 } });
  sim.advanceTo(sim.now + 2 * 60_000);
  const booked = sim.universe.scheduled.filter((i) => i.kind === COMMENCEMENT_KIND && i.status === 'pending');
  sim.timeline.cancel(booked[0]!.id, sim.now);
  sim.schedule({ at: at(2026, 9, 3, 10), kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 32, durationMinutes: 180, payload: booked[0]!.payload });
  tended(sim, at(2026, 9, 3, 13));
  expect(sim.player.school!.standing).toBe('graduated');
  return sim;
}

/** TEST SETUP: a skilled actor's levels, as years of work would leave them. */
function skilled(sim: Simulation): void {
  sim.player.craft = evenCraft(92);
  const attrs = attributesOf(sim, sim.player) as unknown as Record<string, number>;
  for (const k of Object.keys(attrs)) if (typeof attrs[k] === 'number') attrs[k] = 95;
  for (const t of PROJECTS) for (const g of t.genres) genreState(sim.player, g).familiarity = 95;
}

/**
 * A passport, by Papers' own command, where the life began without one (most of the game's American lives do, by the
 * share that hold one), and the clock on until it's issued.
 */
function passport(sim: Simulation): void {
  if (passportOf(sim.player, sim.now + 400 * MS_DAY)) return;
  const r = sim.execute({ kind: 'documents.apply_passport', payload: {} });
  expect(r.error).toBeUndefined();
  played(sim, (r.value as { readyAt: number }).readyAt + MS_HOUR);
  expect(passportOf(sim.player, sim.now)).toBeDefined();
}

/** Headshots, a résumé and a reel, by the Portfolio tab's and the Player Profile's commands, on a free morning. */
function portfolio(sim: Simulation): void {
  let ten = at(zonedParts(sim.now, zone).year, zonedParts(sim.now, zone).month, zonedParts(sim.now, zone).day, 10);
  if (ten <= sim.now) ten += MS_DAY;
  played(sim, ten);
  sim.must({ kind: 'pro.headshots', payload: {} });
  played(sim, sim.now + 15 * 60_000);
  sim.must({ kind: 'pro.update_resume', payload: {} });
  const brief = BRIEFS.find((b) => b.medium === 'camera')!;
  sim.must({ kind: 'brief.choose', payload: { brief: brief.id, reading: brief.readings[0]!.id } });
  sim.must({ kind: 'practice.self_tape', payload: { genre: brief.kinds[0], brief: brief.id } });
  sim.must({ kind: 'pro.cut_reel', payload: { pieces: [`tape:${brief.id}:${sim.player.briefs![brief.id]!.takes[0]!.at}`] } });
}

const sydney = (o: Pick<Opportunity, 'projectId'>) => o.projectId.startsWith('harbor-line');

/** The clock moved a week at a time until the Sydney part is posted to the actor. */
function waitForSydney(sim: Simulation, weeks = 60): Opportunity | undefined {
  for (let k = 0; k < weeks; k += 1) {
    const o = sim.player.pro!.opportunities.find((x) => x.status === 'open' && sim.now < x.submitBy && sydney(x));
    if (o) return o;
    played(sim, sim.now + 7 * MS_DAY);
  }
  return undefined;
}

/** The sides prepared, each step pressed until it can do no more, the time between tended. */
function prepareAll(sim: Simulation, target: { opportunityId: string } | { engagementId: string }): void {
  for (let n = 0; n < 24; n += 1) {
    let any = false;
    for (const step of ['read', 'lines', 'rehearse']) {
      if (sim.execute({ kind: 'pro.prepare', payload: { ...target, step } }).ok) any = true;
      played(sim, sim.now + 30 * 60_000);
    }
    if (!any) break;
  }
}

/** A round on tape: the sides prepared, taped at the first free hour before it's due, then the clock on to casting's word. */
function playRound(sim: Simulation, o: Opportunity): void {
  prepareAll(sim, { opportunityId: o.id });
  const r = roundToCome(o)!;
  for (let n = 0; n < 48 && tapeRefusal(sim, sim.player, o) && sim.now < r.at - 2 * MS_HOUR; n += 1) played(sim, sim.now + MS_HOUR);
  expect(sim.execute({ kind: 'pro.tape_audition', payload: { opportunityId: o.id } }).error).toBeUndefined();
  const rounds = o.rounds!.length;
  for (let k = 0; k < 20 && (o.status === 'audition' || o.status === 'callback') && o.rounds!.length === rounds; k += 1) played(sim, sim.now + MS_DAY);
}

/** The first seed whose skilled graduate is offered the Sydney part. */
function offered(): { sim: Simulation; o: Opportunity; seed: string } {
  for (let n = 0; n < 40; n += 1) {
    const seed = `sydney-${n}`;
    const sim = graduate(seed);
    skilled(sim);
    passport(sim);
    portfolio(sim);
    const o = waitForSydney(sim);
    if (!o) continue;
    expect(sim.execute({ kind: 'pro.submit', payload: { opportunityId: o.id } }).error).toBeUndefined();
    played(sim, sim.now + 3 * MS_DAY);
    while (o.status === 'audition' || o.status === 'callback') playRound(sim, o);
    if (o.status === 'offered') return { sim, o, seed };
  }
  throw new Error('No seed reached an offer for the Sydney part.');
}

describe('W1, W2: the countries, as data', () => {
  it('T19: says how far each country is researched; an unsupported or partly researched one never gives permission, and says why', () => {
    expect(jurisdictionOf('au').research).toBe('verified');
    for (const c of ['uk', 'nz', 'ca', 'fr', 'jp', 'in']) expect(JURISDICTIONS[c]!.research).toBe('partial');
    expect(jurisdictionOf('br').research).toBe('unsupported');
    const sim = graduate('countries');
    const days = [{ from: at(2027, 3, 1, 7), to: at(2027, 3, 1, 18) }];
    const br = abroadRead(sim.player, 'br', days, undefined, sim.now);
    expect(br).toMatchObject({ authorized: false, basis: 'abroad-unsupported', country: 'br' });
    expect(br.words).toBe('The rules for working in Brazil aren’t in the game, so it can’t let you take work there.');
    const uk = abroadRead(sim.player, 'uk', days, undefined, sim.now);
    expect(uk).toMatchObject({ authorized: false, basis: 'abroad-unsupported' });
    expect(uk.words).toMatch(/^The rules for working in the United Kingdom aren’t in the game yet: their sources are found and not yet read/);
    // Australia, for an American with no visa: the route, said, and not permission.
    const au = abroadRead(sim.player, 'au', days, undefined, sim.now);
    expect(au).toMatchObject({ authorized: false, basis: 'abroad-needed' });
    expect(au.words).toContain('Temporary Activity visa (subclass 408), Entertainment Activities stream');
  });

  it('a New Zealand citizen works in Australia on the Special Category visa granted on arrival; an Australian citizen needs nothing', () => {
    const kiwi = graduate('kiwi', { homeRegionId: 'nz-auckland' } as never);
    const days = [{ from: at(2027, 3, 1, 7), to: at(2027, 3, 1, 18) }];
    if (kiwi.player.citizenshipId === 'nz') {
      const read = abroadRead(kiwi.player, 'au', days, undefined, kiwi.now);
      expect(read.basis).toBe(documentsOf(kiwi.player).some((d) => d.kind === 'passport' && d.issuer === 'NZ') ? 'abroad-route' : 'abroad-needed');
      if (read.authorized) expect(read.words).toBe('As a citizen of New Zealand with a passport in force, you’re granted the Special Category visa (subclass 444) when you arrive, and it lets you work in Australia.');
    }
    const aussie = graduate('aussie', { homeRegionId: 'au-nsw-sydney' } as never);
    if (aussie.player.citizenshipId === 'au') expect(abroadRead(aussie.player, 'au', days, undefined, aussie.now)).toMatchObject({ authorized: true, basis: 'abroad-citizen' });
  });
});

describe('W6: the trip, as the production books it', () => {
  it('T21, T22: New Haven to Sydney by car and two flights through Los Angeles, landing a day and a half before the first call; across the date line two calendar days on; home the day after the last', () => {
    const days = [0, 1, 2, 3, 4].map((k) => ({ from: at(2027, 3, 8 + k, 7, 0, SYD), to: at(2027, 3, 8 + k, 18, 0, SYD) }));
    expect(needsTrip('us-ct-newhaven', 'au-nsw-sydney')).toBe(true);
    expect(needsTrip('us-ct-newhaven', 'us-ny-newyork')).toBe(false);
    expect(flightPath('us-ny-newyork', 'au-nsw-sydney')).toEqual(['us-ny-newyork', 'us-ca-losangeles', 'au-nsw-sydney']);
    const plan = planTrip('us-ct-newhaven', 'au-nsw-sydney', days)!;
    expect(plan.legs.map((l) => `${l.way} ${l.mode} ${l.from}>${l.to}`)).toEqual([
      'out car us-ct-newhaven>us-ny-newyork', 'out flight us-ny-newyork>us-ca-losangeles', 'out flight us-ca-losangeles>au-nsw-sydney', 'out car au-nsw-sydney>au-nsw-sydney',
      'back car au-nsw-sydney>au-nsw-sydney', 'back flight au-nsw-sydney>us-ca-losangeles', 'back flight us-ca-losangeles>us-ny-newyork', 'back car us-ny-newyork>us-ct-newhaven',
    ]);
    for (const l of plan.legs) expect(l.arrives).toBeGreaterThan(l.departs);
    for (let i = 1; i < plan.legs.length; i += 1) expect(plan.legs[i]!.departs).toBeGreaterThanOrEqual(plan.legs[i - 1]!.arrives);
    const pacific = plan.legs[2]!;
    // Leaving Los Angeles in the evening, landing in Sydney two calendar days later, about fourteen and a half hours on.
    const left = zonedParts(pacific.departs, 'America/Los_Angeles');
    const landed = zonedParts(pacific.arrives, SYD);
    expect(pacific.arrives - pacific.departs).toBeLessThan(16 * MS_HOUR);
    expect(Date.UTC(landed.year, landed.month - 1, landed.day) - Date.UTC(left.year, left.month - 1, left.day)).toBe(2 * MS_DAY);
    expect(plan.legs[3]!.arrives).toBeLessThanOrEqual(days[0]!.from - TRIP.arriveBeforeHours * MS_HOUR);
    const home = plan.legs[4]!;
    expect(zonedParts(home.departs + TRIP.checkInMinutes * 60_000 + TRIP.hotelMinutes * 60_000, SYD)).toMatchObject({ day: 13, hour: 11 });
    expect(plan.stay).toMatchObject({ cityId: 'au-nsw-sydney', from: plan.legs[3]!.arrives, to: home.departs, payer: 'production' });
  });

  it('keeps 7 AM a Sydney call at 7 AM on either side of the first Sunday in October, when Sydney’s clocks go forward', () => {
    const days = [4, 5, 8, 9].map((d) => ({ from: at(2029, 10, d, 7, 0, SYD), to: at(2029, 10, d, 18, 0, SYD) }));
    for (const d of days) expect(zonedParts(d.from, SYD).hour).toBe(7);
    // Twenty-four hours apart in Sydney's days, but the clocks went forward between the 5th and the 8th.
    expect(days[2]!.from - days[1]!.from).toBe(3 * MS_DAY - MS_HOUR);
    const plan = planTrip('us-ct-newhaven', 'au-nsw-sydney', days)!;
    for (const l of plan.legs) expect(l.arrives).toBeGreaterThan(l.departs);
  });
});

describe('W3 to W12: a part in Sydney from posting to home', () => {
  it('T11, T21, T22, PLAYER JOURNEY: posted, taped, offered; accepted as a contract that says it needs the 408; the visa applied for and granted; the flight out, the work in Sydney, the pay as wages earned in Australia with no commission, the flight home; saved and loaded at each stage', () => {
    const { sim, o } = offered();
    const t = projectOf(o);
    expect(t.trip).toBeDefined();
    // W3: open to self-tapes, outside an agent's agreement.
    expect(t.access).toEqual({ agent: false, open: 'anyone' });
    // W4: the warning before Accept: away from when to when, the production's arrangements, the 408, and that accepting isn't permission.
    const warning = acceptWarning(sim, sim.player, o)!;
    expect(warning).toMatch(/^This work is in Sydney\. You’d be away from \w+ \d+, \d{4} to \w+ \d+, \d{4}\. Larkspur Pictures books and pays for your flights, the cars and the hotel, as the game assumes for a studio feature shooting abroad\. Work in Australia needs a 408 visa \(Temporary Activity visa \(subclass 408\), Entertainment Activities stream\), which the production supports\. Apply for it on the Career screen’s Work tab once you’ve accepted\. Accepting is the contract, not permission to work: without the visa in force at your first flight, you can’t go, and the production releases you\.$/);
    expect(acceptRefusal(sim, sim.player, o)).toBeUndefined();
    // The guide's promise (career.work-abroad > career.offers): the visa is applied for once the work is accepted.
    expect(sim.execute({ kind: 'pro.apply_work_visa', payload: { engagementId: o.id } }).error).toBe('No work abroad is booked, so there’s no visa to apply for.');
    const accepted = sim.execute({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    expect(accepted.error).toBeUndefined();
    const e = sim.player.pro!.engagements.find((x) => x.opportunityId === o.id)!;
    const trip = tripOf(sim.player, e)!;
    expect(trip.legs).toHaveLength(8);
    expect(trip.stay).toMatchObject({ cityId: 'au-nsw-sydney', payer: 'production', status: 'booked' });
    expect(e.eligibility).toMatchObject({ authorized: false, basis: 'abroad-needed', country: 'au' });
    // Booked days are Sydney's: 7 AM there.
    for (const d of e.days) expect(zonedParts(d.from, SYD).hour).toBe(7);
    // The Work tab: the trip, the permission it needs, Apply For The Visa pressable, each leg, the hotel, and the caveat.
    let tab = workTab(sim);
    expect(tab.shown).toContain('The Trip To Sydney');
    expect(tab.shown).toContain('Permission, Flights And Hotel');
    expect(tab.shown).toContain(e.eligibility!.words);
    expect([...tab.html.matchAll(/<button([^>]*)>Apply For The Visa/g)].map((m) => m[1]!.includes('disabled=""'))).toEqual([false]);
    for (const l of trip.legs) expect(tab.shown).toContain(l.label);
    expect(tab.shown).toMatch(/The production’s hotel near Circular Quay, \w+ \d+, \d{4} to \w+ \d+, \d{4}, paid by the production\./);
    expect(tab.shown).toContain('These are the game’s times for the trip, estimated from the distances, not a real airline’s schedule.');
    // What the 408 asks, each condition as the game says it, where it was read, and what isn't in the game for Australia.
    expect(tab.shown).toContain('What The 408 Visa Asks');
    for (const c of JURISDICTIONS.au!.routes[0]!.conditions) expect(tab.shown).toContain(c.words);
    expect(tab.shown).toContain('From the department’s page as the game read it on October 23, 2026, last updated September 24, 2026.');
    expect(tab.shown).toContain('Not in the game yet: Australian tax on pay for work there;');

    // W5: the 408 applied for from the engagement: a pending permit in Papers, tied to it; nothing charged.
    const before = sim.universe.transactions.length;
    const applied = sim.execute({ kind: 'pro.apply_work_visa', payload: { engagementId: e.id } });
    expect(applied.error).toBeUndefined();
    expect(sim.universe.transactions.length).toBe(before);
    const visa = visaFor(sim.player, e.id)!;
    expect(visa).toMatchObject({ kind: 'permit', issuer: 'AU', destination: 'AU', status: 'pending', bookingId: e.id, name: 'Temporary Activity visa (subclass 408), Entertainment Activities stream' });
    expect(sim.execute({ kind: 'pro.apply_work_visa', payload: { engagementId: e.id } }).error).toMatch(/^You’ve applied already\. Your 408 visa is with the department, which decides on /);
    tab = workTab(sim);
    expect(tab.shown).toMatch(/Applied \w+ \d+, \d{4}\. The department decides on \w+ \d+, \d{4}\./);
    // The guide's promise (career.work-abroad > documents.work): the visa is in Papers, under Permission To Work.
    h.sim = sim;
    const papers = renderToStaticMarkup(createElement(PapersWork)).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    expect(papers).toContain('Permission To Work');
    expect(papers).toContain('Temporary Activity visa (subclass 408), Entertainment Activities stream');
    // Your Work And Your Permission reads Australia's rule for it, not the US's.
    expect(papers).toMatch(/Dana Kell, Harbor Line \w+ \d+, \d{4} to \w+ \d+, \d{4} Booked\. Your 408 visa is with the department, which decides on /);
    expect(papers).not.toContain('Booked. You’re a US citizen');
    expect(tab.html).not.toContain('Apply For The Visa');
    const twin1 = reload(sim);
    played(sim, visa.readyAt! + MS_HOUR);
    played(twin1, visa.readyAt! + MS_HOUR);
    expect(visa.status).toBe('valid');
    expect(visa.expiresAt).toBe(e.days[e.days.length - 1]!.to + 28 * MS_DAY);
    expect(workTab(sim).shown).toMatch(/Granted \w+ \d+, \d{4}, in force to \w+ \d+, \d{4}\./);
    expect(notices(sim).some((n) => /^Your 408 Visa Was Granted \| The department granted your Temporary Activity visa \(subclass 408\), Entertainment Activities stream for Harbor Line\./.test(n))).toBe(true);

    // W7: home until the car leaves; in transit on a flight; in Sydney only once the car to the hotel has arrived.
    const legs = trip.legs;
    played(sim, legs[0]!.departs - MS_HOUR);
    expect(whereAt(sim.player, sim.now)).toMatchObject({ kind: 'home', cityId: 'us-ct-newhaven' });
    const twin2 = reload(sim);
    played(sim, legs[2]!.departs + 2 * MS_HOUR);
    expect(whereAt(sim.player, sim.now)).toMatchObject({ kind: 'transit', cityId: 'us-ca-losangeles' });
    expect(awayAt(sim.player, sim.now)?.label).toBe('Harbor Line: Away In Sydney');
    played(sim, legs[3]!.arrives + MS_HOUR);
    expect(whereAt(sim.player, sim.now)).toMatchObject({ kind: 'away', cityId: 'au-nsw-sydney' });
    expect(trip.stay.status).toBe('in');
    expect(sim.player.currentLocationId).toBe('us-ct-newhaven');
    const arrived = notices(sim).find((n) => n.startsWith('You’ve Arrived In Sydney'))!;
    expect(arrived).toMatch(/^You’ve Arrived In Sydney \| You’ve arrived in Sydney, and the production’s car took you to the production’s hotel near Circular Quay\. Your first call is \w+, \w+ \d+, \d{4} at 7:00 AM in Sydney \(\d+:\d\d [AP]M on \w+ in New Haven\)\.$/);

    // W10: the work, judged; the credit; the pay as wages earned in Australia, without commission; W11: home.
    played(sim, legs[legs.length - 1]!.arrives + 2 * MS_HOUR);
    played(twin2, legs[legs.length - 1]!.arrives + 2 * MS_HOUR);
    expect(e.log!.filter((l) => l.status === 'worked')).toHaveLength(8);
    expect(e.status).toBe('finished');
    expect(trip.status).toBe('home');
    expect(whereAt(sim.player, sim.now)).toMatchObject({ kind: 'home', cityId: 'us-ct-newhaven' });
    expect(notices(sim).some((n) => n.startsWith('You’re Home From Sydney | You’re back in New Haven after Harbor Line.'))).toBe(true);
    expect(trip.history.map((h) => h.kind)).toEqual(['departed', 'arrived', 'checked-in', 'checked-out', 'departed', 'home']);
    played(sim, Math.max(...e.pay.map((p) => p.due)) + 2 * MS_DAY);
    played(twin2, Math.max(...e.pay.map((p) => p.due)) + 2 * MS_DAY);
    expect(e.pay.length).toBeGreaterThan(0);
    for (const p of e.pay) {
      expect(p.received).toBeDefined();
      expect(p.received!.commission).toBe(0);
      expect(p.received!.via).toBe('direct');
    }
    // The Work tab says where the pay counts as earned, and that Australian tax on it isn't in the game.
    const after = workTab(sim).shown;
    expect(after).toContain('Your tax return counts this pay as earned in Australia. Tax in Australia on it isn’t part of the game yet.');
    // W11: each step of the trip in the engagement's What Happened, once, among the work's own.
    for (const w of ['You left for Sydney.', 'You arrived in Sydney.', 'You checked in to the production’s hotel near Circular Quay.', 'You checked out of the production’s hotel near Circular Quay.', 'You left Sydney for home.', 'You were home in New Haven.']) expect(after.split(w).length - 1, w).toBe(1);
    const year = zonedParts(e.days[0]!.from, zone).year;
    const au = yearOf(sim.player, year).foreign['au'];
    expect(au?.gross).toBe(e.pay.reduce((n, p) => n + p.received!.gross, 0));
    // W12: the twins, loaded at the visa and before the flight, end as the life played straight through.
    const e2 = twin2.player.pro!.engagements.find((x) => x.id === e.id)!;
    expect(e2.pay.map((p) => p.received?.net)).toEqual(e.pay.map((p) => p.received?.net));
    expect(tripOf(twin2.player, e2)!.history.map((h) => h.kind)).toEqual(trip.history.map((h) => h.kind));
    expect(twin2.universe.transactions.filter((x) => /Larkspur|Harbor Line/.test(x.memo)).length).toBe(sim.universe.transactions.filter((x) => /Larkspur|Harbor Line/.test(x.memo)).length);
    expect(visaFor(twin1.player, e.id)!.status).toBe('valid');
  });

  it('T12: with no visa at the first flight, the player doesn’t fly and the production releases them: nothing worked, nothing owed, said with the reason', () => {
    const { sim, o } = offered();
    sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    const e = sim.player.pro!.engagements.find((x) => x.opportunityId === o.id)!;
    const trip = tripOf(sim.player, e)!;
    played(sim, trip.legs[0]!.departs + 6 * MS_HOUR);
    expect(e.status).toBe('canceled');
    expect(trip.status).toBe('canceled');
    expect(trip.legs.every((l) => l.status === 'canceled')).toBe(true);
    expect(whereAt(sim.player, sim.now).kind).toBe('home');
    expect(e.pay).toEqual([]);
    expect(e.log ?? []).toEqual([]);
    const released = notices(sim).find((n) => n.startsWith(`Released As ${t(o)}`))!;
    expect(released).toBe(`Released As ${t(o)} | You didn’t apply for the 408 visa the work in Australia needs, and you can’t work there without it. So Larkspur Pictures can’t start you as ${t(o)} in Harbor Line, and has released you. You hadn’t worked a day of it, so nothing is owed, and its days are off your calendar. There’s no credit for it.`);
    expect(sim.universe.scheduled.filter((i) => i.status === 'pending' && i.refId === trip.id)).toEqual([]);
  });

  it('asleep when the car to the airport comes, the player misses the flights out: the legs called off, said with the place names as written, and the work days missed', () => {
    const { sim, o } = offered();
    sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    const e = sim.player.pro!.engagements.find((x) => x.opportunityId === o.id)!;
    const trip = tripOf(sim.player, e)!;
    sim.must({ kind: 'pro.apply_work_visa', payload: { engagementId: e.id } });
    played(sim, trip.legs[0]!.departs - MS_HOUR);
    expect(visaFor(sim.player, e.id)!.status).toBe('valid');
    // TEST SETUP: asleep through the car's hour, as a player who slept in would be.
    sim.player.awakeSince = trip.legs[0]!.departs + 2 * MS_HOUR;
    sim.advanceTo(trip.legs[0]!.departs + MS_HOUR);
    expect(trip.legs.filter((l) => l.way === 'out').map((l) => l.status)).toEqual(['missed', 'canceled', 'canceled', 'canceled']);
    expect(trip.history.find((x) => x.kind === 'missed-flight')!.words).toMatch(/^You weren’t there for the car to JFK in New York on \w+ \d+, \d{4}\.$/);
    expect(notices(sim).find((n) => n.startsWith('You Missed Your Flight To Sydney'))).toBe('You Missed Your Flight To Sydney | You weren’t there for the car to the airport, so the flights to Sydney left without you, and you won’t be there for Harbor Line’s first call. A shoot can’t wait for an actor.');
    played(sim, e.days[e.days.length - 1]!.to + 2 * MS_DAY);
    expect(whereAt(sim.player, sim.now).kind).toBe('home');
    expect(e.log!.filter((l) => l.status === 'worked')).toEqual([]);
    // Never there, so never on the way home: the trip called off whole, and nothing said of a return. Until 2026-10-23
    // (this test) the legs home still ran, and told a player who hadn't left that they were back in New Haven.
    expect(trip.status).toBe('canceled');
    expect(trip.legs.filter((l) => l.way === 'back').map((l) => l.status)).toEqual(['canceled', 'canceled', 'canceled', 'canceled']);
    expect(trip.history.map((x) => x.kind)).toEqual(['missed-flight']);
    // Replaced on the first day missed, a job never begun: no SAG-AFTRA eligibility from it (`systems/propay.ts`).
    expect(e.status).toBe('canceled');
    expect(sim.player.pro!.sag).toBeUndefined();
    expect(notices(sim, trip.legs[0]!.departs).map((n) => n.split(' | ')[0])).toEqual([`You Missed Your Flight To Sydney`, `Replaced As ${t(o)}`]);
  });
});

describe('legPhrase', () => {
  it('lowercases a leg’s own words and keeps its place names', () => {
    expect(['Car To JFK in New York', 'Car To The Airport', 'Flight To Los Angeles', 'Car To The Hotel', 'Car Home'].map((label) => legPhrase({ label }))).toEqual(['car to JFK in New York', 'car to the airport', 'flight to Los Angeles', 'car to the hotel', 'car home']);
  });
});

const t = (o: Opportunity) => projectById(o.projectId)!.role.part;

describe('W8: away, nothing in person at home', () => {
  it('T28: a booking whose days fall in the trip is refused, the School counts every day of the trip, and an audition in New York while in Sydney is missed with where the player was', () => {
    const sim = graduate('away');
    passport(sim);
    const h = PROJECTS.find((x) => x.id === 'harbor-line')!;
    // TEST SETUP: an offer for the Sydney part, as casting makes one after a callback.
    const o: Opportunity = { id: sim.nextId('pro'), projectId: h.id, via: 'open', status: 'offered', postedAt: sim.now, submitBy: sim.now + 7 * MS_DAY, offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: 'sag-tv-week', amount: 4_456_00, per: 'week', units: 2 }, history: [], counts: {} };
    sim.player.pro!.opportunities.push(o);
    sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    const e = sim.player.pro!.engagements.find((x) => x.opportunityId === o.id)!;
    sim.must({ kind: 'pro.apply_work_visa', payload: { engagementId: e.id } });
    const trip = tripOf(sim.player, e)!;
    const span = windowOf(trip.legs)!;
    // A day in the middle of the trip, not one of its work days: still held.
    const mid = span.from + 2 * MS_DAY;
    expect(bookedClash(sim.player, [{ from: mid, to: mid + 8 * MS_HOUR }])).toMatchObject({ label: 'Your Trip To Sydney' });
    // The trip's days, whole, are what the School counts, from its first leg to its last.
    const days = spansOf(sim.player, h, datesOf(o));
    expect(days[0]!.from).toBe(span.from);
    expect(days[days.length - 1]!.to).toBe(span.to);
    // TEST SETUP: an audition in person in New York, set for the trip's first full day in Sydney, as casting sets one.
    const when = trip.legs[3]!.arrives + 20 * MS_HOUR;
    const other: Opportunity = { id: sim.nextId('pro'), projectId: 'calder-street', via: 'open', status: 'audition', postedAt: sim.now, submitBy: sim.now + 7 * MS_DAY, rounds: [{ round: 'audition', form: 'in-person', at: when, status: 'set' }], history: [], counts: {} };
    sim.player.pro!.opportunities.push(other);
    sim.schedule({ at: when, kind: AUDITION_KIND, label: 'Audition', category: 'career', priority: 40, requiresPlayer: true, durationMinutes: 30, travelMinutes: 120, locationId: 'us-ny-newyork', refType: 'pro.opportunity', refId: other.id, payload: { personId: sim.player.id, opportunityId: other.id, round: 0 } });
    played(sim, when + MS_HOUR);
    expect(whereAt(sim.player, when)).toMatchObject({ kind: 'away', cityId: 'au-nsw-sydney' });
    expect(other.status).toBe('lapsed');
    expect(other.outcome).toMatch(/^You were in Sydney, so you missed the audition for Nell on \w+ \d+, \d{4} at \d+:\d\d [AP]M, and Pennick Casting moved on without you\.$/);
  });

  it('counts a student’s class days over the whole trip, so work in Sydney in term is more class days than the dean allows', () => {
    const sim = student('term');
    tended(sim, at(2026, 9, 1, 18));
    const h = PROJECTS.find((x) => x.id === 'harbor-line')!;
    // TEST SETUP: the Sydney part posted in the fall term, so its work falls in October.
    const o: Opportunity = { id: sim.nextId('pro'), projectId: h.id, via: 'open', status: 'open', postedAt: at(2026, 9, 7, 9), submitBy: at(2026, 9, 14, 9), history: [], counts: {} };
    const classes = conditionsFor(sim, sim.player, o, sim.now).find((c) => c.id === 'classes')!;
    expect(classes.holds).toBe(false);
    // Eight shoot days, and every class day from the car to the airport to the car home.
    const n = Number(/^It takes (\d+) class days/.exec(classes.words)?.[1]);
    expect(n).toBeGreaterThan(8);
  });
});
