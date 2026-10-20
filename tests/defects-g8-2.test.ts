/**
 * Five school defects found by the triage of 2026-10-12, each held here against the engine and the screen that shows it
 * (from 2026-10-12): Call Off The Request acted on its first press, so the command's warning never reached the player;
 * Terms And Award showed a term the aid office waived as billed to the Yale account; the notice of a term without tuition
 * support named the Yale Health fee as charged where the living scholarship met it; Affiliate cover's figure on the
 * screen, and both its texts, counted two terms whatever the leave's length; and Ask For An Aid Review was hidden in the
 * sixth term, when the command takes it, while the command took a returned leave that can never need it.
 *
 * The screens are rendered to markup (react-dom/server) over real saves, as tests/defects-g14-1.test.ts renders them:
 * `useGame` stands in for the provider, `run` is the save's own `execute`, and Gated is the real one with its onClick
 * kept so the test can press it. PLAYER JOURNEYS play through commands; FIXTURES set a state by hand to reach one rule,
 * and say so, among them a screen's two-step choice, which a static render can't press its way into.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { LEAVE_RULES } from '@/engine/content/school';
import { TERM_KIND, evaluate, termAccount } from '@/engine/systems/school';
import { accountOwed, aidReviewRefusal, cancelRepeatWarning, enrolledTerms, yaleAccount } from '@/engine/systems/leave';
import { healthOf } from '@/engine/systems/health';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; onClick?: () => void; children: unknown }[],
  /** FIXTURE: what the screen's useStates start at, in order, in place of their own initial values. */
  states: [] as unknown[],
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    return h.states.length ? [h.states.shift(), set] : [value, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

// The School screen's kept tab, at Terms And Award: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/school' ? 'terms' : initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  return { ...real, Gated: (props: Parameters<typeof real.Gated>[0]) => { h.clicks.push({ feature: props.feature, onClick: props.onClick as (() => void) | undefined, children: props.children }); return ce(real.Gated, props); } };
});

const { LeavePanel, RepeatPanel, YaleAccountPanel } = await import('@/ui/components/StudyPlanPanels');
const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string, extra: Record<string, unknown> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** With need found: a family of no means, as tests/school-paths.test.ts's aid review makes one. */
const onAid = { family: undefined, wealth: 'scraping' };
/** Played by somebody who looks after themselves, as tests/leave.test.ts plays one. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id);
/** FIXTURE: money in the bank, as savings would be. */
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const moneyIn = (sim: Simulation) => (c: number) => formatMoney(c, saveCurrency(sim.universe));

/** A screen as the player has it: its markup, and its text with the tags taken out; the Gated buttons it drew are in `h.clicks`. */
function drawn(sim: Simulation, screen: FunctionComponent, states: unknown[] = []): { html: string; text: string } {
  h.sim = sim;
  h.clicks = [];
  h.states = [...states];
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  h.states = [];
  return { html, text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
}
const pressed = (feature: string) => h.clicks.filter((c) => c.feature === feature);

/**
 * The sixth term's evaluation, every course passed but one of its own: the last year left unpassed, as
 * tests/leave.test.ts's last year failed sets it. FIXTURE: the program's sixth term reached by hand, with a two-term
 * medical leave taken in the first spring and returned from where `medical` says so.
 */
function lastYearFailed(seed: string, extra: Record<string, unknown>, medical = false): Simulation {
  const sim = student(seed, extra);
  tended(sim, at(2026, 9, 2));
  const school = sim.player.school!;
  if (medical) {
    Object.assign(school, { termsBegun: 8, enrolled: [0, 3, 4, 5, 6, 7], offset: 2, classOf: 2030, standing: 'good' });
    school.leaves = [{ id: 'l1', kind: 'medical', reason: 'illness', requestedAt: 0, status: 'returned', firstTerm: 1, returnTerm: 3, terms: 2, decideAt: 0 }];
  } else Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
  const last = school.termsBegun - 1;
  school.courses = { [`${last}:DRAM 393b`]: { term: last, academic: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 6, excused: 0, result: 'fail', why: 'TEST SETUP' } };
  Object.assign(school.tally, { classDays: 40, attended: 40, excused: 0 });
  evaluate(sim, sim.player, last);
  expect(school.repeatBy).toBeGreaterThan(sim.now);
  return sim;
}

/**
 * PLAYER JOURNEY from `lastYearFailed`: an additional term asked for and granted, the aid office's review asked for and
 * decided, and then the term begun. FIXTURE: its first morning brought to within the hour, as tests/school-paths.test.ts's
 * additional term brings it, so the years between aren't played.
 */
function additionalTermBegun(seed: string, extra: Record<string, unknown>, medical = false) {
  const sim = lastYearFailed(seed, extra, medical);
  const school = sim.player.school!;
  const asked = sim.must<{ decideAt: number; term: number }>({ kind: 'school.request_extra_term', payload: {} });
  tended(sim, asked.decideAt + MS_HOUR);
  expect(school.extra?.term).toBe(asked.term);
  const review = sim.must<{ decideAt: number }>({ kind: 'school.request_aid_review', payload: {} });
  tended(sim, review.decideAt + MS_HOUR);
  expect(school.aidReview?.status).toBe('decided');
  sim.timeline.cancel(pendingOf(sim, TERM_KIND).find((i) => i.payload.term === asked.term)!.id, sim.now);
  sim.schedule({ at: sim.now + MS_HOUR, kind: TERM_KIND, label: 'Term', category: 'school', priority: 30, payload: { personId: sim.player.id, term: asked.term } });
  tended(sim, sim.now + 2 * MS_HOUR);
  expect(enrolledTerms(school)).toHaveLength(7);
  return { sim, term: asked.term, account: termAccount(saveCurrency(sim.universe), true, asked.term) };
}

/** Terms And Award's Each Term row of that name: what it says is billed, or undefined where it isn't drawn. */
const rowBilled = (html: string, row: string) => html.match(new RegExp(`<td>${row}</td><td class="num mono">([^<]*)</td>`))?.[1];
const rowCredited = (html: string, row: string) => html.match(new RegExp(`<td>${row}</td><td class="num mono">[^<]*</td><td class="num mono">([^<]*)</td>`))?.[1];

describe('PLAYER JOURNEY: Call Off The Request on a pending repeat', () => {
  it('asks first, with what calling it off leaves, and calls it off only on Call It Off', () => {
    const sim = lastYearFailed('g8-2-cancel', { wealth: 'comfortable' });
    sim.must({ kind: 'school.request_repeat', payload: {} });
    const school = sim.player.school!;
    // The first press asks; nothing on the screen calls it off yet.
    const first = drawn(sim, RepeatPanel);
    expect(pressed('school.cancel_repeat')).toHaveLength(0);
    expect(first.text).toContain('Call Off The Request…');
    expect(school.repeat!.status).toBe('pending');
    // Asked: the command's own warning, and the choice.
    const warning = cancelRepeatWarning(sim, school);
    expect(warning).toMatch(/If you call it off and don’t ask again by .+, the faculty won’t recommend the degree\./);
    expect(sim.execute({ kind: 'school.cancel_repeat', payload: {} }).error).toBe(`${warning} Confirm to go ahead.`);
    expect(first.text).not.toContain(warning);
    // FIXTURE: Call Off The Request… pressed, as the screen's choice would be.
    const asked = drawn(sim, RepeatPanel, ['cancel']);
    expect(asked.text).toContain(warning);
    expect(asked.text).toContain('Keep It');
    const callOff = pressed('school.cancel_repeat');
    expect(callOff.map((c) => [c.children].flat().join(''))).toEqual(['Call It Off']);
    expect(school.repeat!.status).toBe('pending');
    callOff[0]!.onClick!();
    expect(school.repeat!.status).toBe('canceled');
  }, 60_000);
});

describe('Terms And Award, for a term past six the aid office reviewed', () => {
  it('shows a term the aid office waived as the six were: no tuition on the Yale account, and its living aid paid to the bank', () => {
    const { sim, account } = additionalTermBegun('g8-2-waived', onAid, true);
    expect(sim.player.school!.aidReview).toMatchObject({ tuition: true, living: true });
    // The engine billed nothing for it.
    expect(accountOwed(sim, sim.player)).toBe(0);
    const money = moneyIn(sim);
    const { html, text } = drawn(sim, SchoolWorkspace);
    expect(rowBilled(html, 'On Your Yale Account')).toBeUndefined();
    expect(html).toContain('<td>Tuition Scholarship</td>');
    expect(html).toContain('<td>Living-Expense Scholarship</td>');
    expect(rowCredited(html, 'Paid To Your Bank')).toBe(money(account.refund));
    expect(text).not.toMatch(/so its tuition and health fee are billed to your Yale account/);
  }, 60_000);

  // Recast and renamed on 2026-10-16 (brief 09's journeys, journeys.d-aid-past-balance; inputs/renames.json): until then
  // “shows a term billed past six with the living aid the review kept: tuition alone on the Yale account, as the engine
  // charged it”, the whole tuition owed and the living aid's refund paid to the bank beside it. From then the aid pays
  // the account first, as Yale applies a credit to the charges before any refund (Yale Student Accounts, Refunds).
  it('shows a term billed past six with the living aid the review kept: Spring Term 2030’s $22,407.28 tuition on the Yale account, the aid’s $15,781.87 paid onto it, $6,625.41 owed and nothing paid to the bank, as the engine charged it', () => {
    const { sim, term } = additionalTermBegun('g8-2-living', onAid);
    expect(sim.player.school!.aidReview).toMatchObject({ tuition: false, living: true });
    // By hand: Spring Term 2030 is in 2029–30, three years of the Bulletins' growth on 2026–27's figures. Tuition, $40,750 at 3.22%,
    // $44,814.56 a year, $22,407.28 a term; the plan, $3,764 at 8.10%, $4,754.74, $2,377.37 a term; living expenses less
    // the plan, and books, $26,637 at 5.82%, $31,563.75, with the plan $36,318.49, a term's scholarship $18,159.24. Less
    // the plan it meets, $15,781.87 is paid onto the account, which owes $22,407.28 − $15,781.87 = $6,625.41.
    expect(term).toBe(7);
    expect(accountOwed(sim, sim.player)).toBe(6_625_41);
    const scholarship = sim.universe.transactions.filter((t) => t.memo.startsWith('Living-expense scholarship, the spring term of 2030:'));
    expect(scholarship.map((t) => t.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id).map((p) => [sim.universe.accounts[p.accountId]!.category, p.amount]))).toEqual([[['yale-account', 15_781_87]]]);
    const { html } = drawn(sim, SchoolWorkspace);
    expect(rowBilled(html, 'Tuition')).toBe('$22,407.28');
    expect(rowCredited(html, 'Applied To Your Yale Account')).toBe('$15,781.87');
    expect(rowBilled(html, 'On Your Yale Account')).toBe('$6,625.41');
    expect(html).not.toContain('<td>Tuition Scholarship</td>');
    expect(html).toContain('<td>Living-Expense Scholarship</td>');
    expect(rowCredited(html, 'Paid To Your Bank')).toBe('$0.00');
  }, 60_000);

  it('without need, shows tuition and the health fee on the Yale account, as the engine charged them', () => {
    const { sim } = additionalTermBegun('g8-2-noneed', { wealth: 'comfortable' });
    const money = moneyIn(sim);
    const a = termAccount(saveCurrency(sim.universe), false, sim.player.school!.termsBegun - 1);
    expect(accountOwed(sim, sim.player)).toBe(a.tuition + a.healthPlan);
    const { html } = drawn(sim, SchoolWorkspace);
    expect(rowBilled(html, 'On Your Yale Account')).toBe(money(accountOwed(sim, sim.player)));
    expect(html).not.toContain('<td>Living-Expense Scholarship</td>');
  }, 60_000);
});

describe('A Term Without Tuition Support', () => {
  it('names the Yale Health fee as on the account only where it was charged', () => {
    const met = additionalTermBegun('g8-2-living', onAid);
    const money = moneyIn(met.sim);
    const said = titled(met.sim, 'A Term Without Tuition Support')[0]!.body;
    // The tuition less the living aid paid onto it, by hand $22,407.28 − $15,781.87 (the test above), from 2026-10-16 (brief
    // 09's journeys); until then the tuition whole, the aid paid to the bank beside it.
    expect(accountOwed(met.sim, met.sim.player)).toBe(6_625_41);
    expect(said).toContain('the term’s living scholarship pays its $2,377.37 Yale Health fee and $15,781.87 of what the account owes before any reaches your bank, so $6,625.41 is due by');
    expect(said).not.toMatch(/for Yale Health are on your Yale account/);
    expect(said).toContain(`${money(met.account.tuition)} tuition is on your Yale account`);
    expect(said).toContain(`the term’s living scholarship pays its ${money(met.account.healthPlan)} Yale Health fee`);
    // Without need it's charged, and said.
    const charged = additionalTermBegun('g8-2-noneed', { wealth: 'comfortable' });
    const a = termAccount(saveCurrency(charged.sim.universe), false, charged.term);
    expect(accountOwed(charged.sim, charged.sim.player)).toBe(a.tuition + a.healthPlan);
    expect(titled(charged.sim, 'A Term Without Tuition Support')[0]!.body).toContain(`${money(a.tuition)} tuition and ${money(a.healthPlan)} for Yale Health are on your Yale account`);
  }, 120_000);
});

describe('PLAYER JOURNEY: Buy Affiliate Cover… on a personal leave of three terms', () => {
  it('shows and charges the leave’s own three terms, the same figure', () => {
    const sim = student('g8-2-affiliate', onAid);
    tended(sim, at(2027, 1, 13, 12));
    const asked = sim.must<{ firstTerm: number; startsNow: boolean; decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
    expect(asked.startsNow).toBe(true);
    // FIXTURE: the leave asked for as three terms, set on the pending request so its start reads it. Today the course
    // sequence refuses a one- or three-term leave in every year (`leaveLengths`), so this is the length a change to the
    // courses would let through.
    sim.player.school!.leave!.terms = 3;
    tended(sim, asked.decideAt + MS_HOUR);
    const l = sim.player.school!.leave!;
    expect(l).toMatchObject({ status: 'on', terms: 3, returnTerm: asked.firstTerm + 3 });
    expect(l.feeCredit).toBeGreaterThan(0);
    const money = moneyIn(sim);
    const due = 3 * LEAVE_RULES.affiliatePerTerm - l.feeCredit!;
    // FIXTURE: Buy Affiliate Cover… pressed (LeavePanel's kind, reason, length and choice, in order).
    const { text } = drawn(sim, LeavePanel, ['personal', 'family', 2, 'affiliate']);
    expect(text).toContain(`Yale Health for the leave’s three terms, ${money(due)}`);
    expect(sim.execute({ kind: 'school.buy_affiliate', payload: {} }).error).toContain(`Affiliate cover for the leave’s three terms is ${money(due)}`);
    fund(sim, 30_000_00);
    const bought = sim.must<{ cost: number }>({ kind: 'school.buy_affiliate', payload: { confirm: true } });
    expect(bought.cost).toBe(due);
  }, 60_000);
});

describe('Ask For An Aid Review', () => {
  it('shows in the sixth term with no Yale account open, as the command takes it, and asks', () => {
    const sim = student('g8-2-sixth', onAid);
    tended(sim, at(2026, 9, 2));
    const school = sim.player.school!;
    // FIXTURE: the sixth term, reached by hand, with need found: its aid paid to the bank, so no account is open.
    Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
    expect(yaleAccount(sim, sim.player, false)).toBeUndefined();
    const { text } = drawn(sim, YaleAccountPanel);
    const ask = pressed('school.request_aid_review');
    expect(ask).toHaveLength(1);
    expect(text).toContain('Support past six terms: the aid office can review it.');
    expect(aidReviewRefusal(sim, sim.player)).toBeUndefined();
    ask[0]!.onClick!();
    expect(school.aidReview?.status).toBe('pending');
    // Asked: no button, and where it stands.
    const after = drawn(sim, YaleAccountPanel);
    expect(pressed('school.request_aid_review')).toHaveLength(0);
    expect(after.text).toContain('The aid office is reviewing your support past six terms');
  }, 60_000);

  it('PLAYER JOURNEY: is refused to a student back from a leave and within the six, with why, and isn’t offered', () => {
    const sim = student('g8-2-returned');
    tended(sim, at(2026, 10, 5));
    // FIXTURE: the flu, as `careFor` gives one.
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    tended(sim, asked.decideAt + MS_HOUR);
    tended(sim, at(2027, 5, 1));
    sim.must({ kind: 'school.return_notice', payload: {} });
    tended(sim, at(2027, 8, 24, 12));
    const school = sim.player.school!;
    expect(school.leaves!.at(-1)!.status).toBe('returned');
    // A leave takes its terms out of those enrolled: back, the student is in their program's first year again.
    expect(enrolledTerms(school).length).toBeLessThan(6);
    const why = 'Support past six terms is reviewed once a seventh is coming: you’re within the six.';
    expect(sim.execute({ kind: 'school.request_aid_review', payload: {} }).error).toBe(why);
    expect(aidReviewRefusal(sim, sim.player)).toBe(why);
    drawn(sim, YaleAccountPanel);
    expect(pressed('school.request_aid_review')).toHaveLength(0);
    expect(school.aidReview).toBeUndefined();
  }, 120_000);
});
