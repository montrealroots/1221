/**
 * health.request_hardship's renewal branch, played (brief 09 of 2026-10-16, section 5; the coverage area). Until that
 * day the hardship was played only on an application (tests/remaining-health-eligibility.test.ts): a member's renewal
 * notice answered by one, `grantPending`'s renewal branch, was reached by no test, and the row said partial for it.
 *
 * The rules, as SLATE keeps them (systems/health.ts, from 2026-10-16), and every figure below worked by hand from them:
 * - From 1 January 2027 HUSKY D's work rules are asked at a renewal of any one of the six months before it, in
 *   Connecticut (Pub. L. 119-21 §71119; the Connecticut Hospital Association's HUSKY D materials of 25 August 2026). A
 *   renewal of 1 October 2027 reads April to September 2027.
 * - Short of them, a notice of noncompliance (42 CFR 435.558): dated 1 October, received five days on (6 October),
 *   answered by the thirtieth day from then, 4 November; decided the next day at midnight, 5 November. A member is
 *   covered while she answers. Unanswered, cover ends at the month's end ten days or more after the decision (42 CFR
 *   431.211): 5 November and ten days is 15 November, so with November, its last day 30 November 2027.
 * - A stay in hospital in a month assessed meets that month, on her request (435.555(d)(1); Connecticut: "Were recently
 *   inpatient in a hospital"): Request A Hardship Exception on Papers. Granted, the renewal is renewed as it would have
 *   been at its date: HUSKY D renewed in 2027 runs six months, to 1 April 2028, and the notice says the month met and how.
 * - HUSKY D begins on the first of the month of application (Connecticut's UPM § 1560.10(B)), from 2026-10-16 (brief
 *   09's journeys, which worked every date here again): until then on the first of next month, so this life's cover ran
 *   from 1 November 2026, its renewal was 1 November 2027 reading May to October, its notice was answered by 5 December
 *   and decided on 6 December, and it was renewed to 1 May 2028 or ended with December.
 *
 * PLAYER JOURNEY: Ada Cole as the creation screen's draft makes her (`newLifeFrom`), born in New York, a citizen, the
 * Comfortable family at Capital One, at Yale in New Haven from Monday 24 August 2026; withdrawn on 25 August, by the
 * fifteenth day of classes, so Yale Health ends that day; enrolled in HUSKY D on Papers on 1 October 2026, from
 * 1 October, its renewal on 1 October 2027. Papers is rendered as the player has it and its buttons pressed by their
 * own handlers. The seed is arbitrary, not picked for what it draws.
 *
 * TEST SETUP, said again where it's done: the week's illness draw forced, every week's a "no" and the week of Monday
 * 13 September 2027's first draw a "yes", a stay in hospital, as tests/remaining-health-eligibility.test.ts forces
 * one. Any played week can draw a stay; forcing it puts one in the months the renewal reads, and keeps every other week
 * from drawing one that would.
 *
 * Change an input, the outcome changes: the twin who doesn't ask is ended with November; the twin with no stay is
 * refused the hardship in its words, and Papers draws no button for it.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { instantFromZoned, type Instant } from '@/engine/core/time';
import { newLifeFrom, type NewSaveConfig } from '@/engine/world/bootstrap';
import { HEALTH_WEEK_KIND, WORK_DECIDED_KIND, coverOn, healthOf } from '@/engine/systems/health';
import { earningsOf, workedBetween } from '@/engine/systems/earnings';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; label: string; onClick?: () => void }[],
  toasts: [] as string[],
  tabs: {} as Record<string, string>,
}));

vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
});
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  const words = (c: unknown): string => (Array.isArray(c) ? c.map(words).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : '');
  return {
    ...real,
    Gated: (props: Parameters<typeof real.Gated>[0]) => {
      h.clicks.push({ feature: props.feature, label: words(props.children), onClick: props.onClick as never });
      return ce(real.Gated, props);
    },
  };
});

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
const { Home } = await import('@/ui/screens/Home');

const ZONE = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, ZONE);
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const freeze = (sim: Simulation): string => JSON.stringify(sim.universe);
const thaw = (snap: string): Simulation => loadSave(JSON.parse(snap) as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const health = (sim: Simulation) => sim.universe.notifications.filter((n) => n.category === 'health').map((n) => [n.at, n.title, n.body]);

/** TEST SETUP: draws forced on one save, as tests/remaining-health-eligibility.test.ts forces them. A reloaded save draws its own. */
function forcing(sim: Simulation): (stream: string, key: (string | number)[] | null, values: number[]) => void {
  const forced = new Map<string, number[]>();
  const real = sim.rng.bind(sim);
  Object.assign(sim, {
    rng: (stream: string, ...keys: (string | number)[]) => {
      const values = forced.get([stream, ...keys].join('|')) ?? forced.get(stream);
      const d = real(stream, ...keys);
      if (!values) return d;
      let i = 0;
      return { ...d, next: () => values[i++] ?? 0.999 };
    },
  });
  return (stream, key, values) => { forced.set(key ? [stream, ...key].join('|') : stream, values); };
}

/** Papers, Health Cover, as the player has it: its words, and the Gated buttons it drew. */
function papers(sim: Simulation): string {
  h.sim = sim;
  h.clicks = [];
  h.tabs = { 'tab:/workspace/papers': 'health' };
  return onScreen(renderToStaticMarkup(createElement(PapersWorkspace as FunctionComponent)));
}
const drawnFor = (feature: string) => h.clicks.filter((c) => c.feature === feature);
/** Home as the player has it: What Needs You draws the six unread notices, the most important and latest first. */
function home(sim: Simulation): string {
  h.sim = sim;
  h.clicks = [];
  return onScreen(renderToStaticMarkup(createElement(Home as FunctionComponent)));
}
/** A Gated button pressed by its own onClick: what it toasted. */
function press(feature: string, label?: string): string[] {
  const b = drawnFor(feature).filter((c) => label === undefined || c.label === label);
  expect(b.map((c) => c.label), `one ${feature}`).toHaveLength(1);
  h.toasts = [];
  b[0]!.onClick!();
  return h.toasts;
}

// The notice of 1 October 2027, worked from the rules above: April to September read, answered by 4 November, decided on
// 5 November, ended with November where unanswered (each a month earlier from 2026-10-16, brief 09's journeys). Until
// 2026-10-17 it began “80 hours’ work” and said “school at least half-time” (brief 12).
const NOTICE = 'HUSKY D couldn’t find $580.00 of income, time at the School or an exception in any month from April to September 2027. You stay covered while you answer, until November 4, 2027. Your pay, income, time at the School, age and SNAP are checked from the records. A stay in hospital in those months counts too if you ask: press Request A Hardship Exception on Papers, under Health Cover. If you don’t answer, HUSKY D ends on November 30, 2027, and you’ll be told on November 5, 2027. After that, you won’t get the premium tax credit while HUSKY D would take you if not for its work rules. You can apply again in any month after one that meets them.';
const PENDING_LINE = 'A notice of noncompliance dated October 1, 2027: HUSKY D couldn’t find that you met the work rules in April to September 2027. Answer by November 4, 2027. You’re covered until it’s decided on November 5, 2027.';
const RENEWED = 'HUSKY D is renewed. Its next renewal is on April 1, 2028. Last month’s income is within its limit, and September 2027 met its work rules through a stay in hospital you asked to count.';
const NO_STAY = 'None of the months it checked, April to September 2027, had a stay in hospital, the one hardship the game counts.';

/**
 * The Comfortable family's student withdrawn on 25 August 2026 and enrolled in HUSKY D on Papers on 1 October, played by
 * the clock to Wednesday 1 September 2027 with every week's illness a "no" (TEST SETUP): the save there.
 */
const enrolled = (() => {
  let snap: string | undefined;
  return () => {
    if (!snap) {
      const sim = createSave(1, 'r09-hardship', newLifeFrom({ homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', wealth: 'comfortable', bankId: 'us-capital-one' } as Partial<NewSaveConfig>));
      sim.advanceTo(at(2026, 8, 25, 12));
      expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
      forcing(sim)('health.illness', null, []); // TEST SETUP: every week's illness a "no"
      sim.advanceTo(at(2026, 10, 1, 9));
      papers(sim);
      expect(press('health.enroll')).toEqual(['Enrolled in HUSKY D, from October 1, 2026.']);
      expect(healthOf(sim.player).program).toMatchObject({ kind: 'medicaid', state: 'ct', from: at(2026, 10, 1, 0), renewAt: at(2027, 10, 1, 0) });
      sim.advanceTo(at(2027, 9, 1, 12));
      snap = freeze(sim);
    }
    return thaw(snap);
  };
})();

/** From the enrolled save, every week's illness a "no", and the week of Monday 13 September 2027 a stay where `stay` (TEST SETUP); played to Thursday 30 September at noon (until 2026-10-16, Sunday 31 October). */
function toTheRenewal(stay: boolean): Simulation {
  const sim = enrolled();
  const force = forcing(sim);
  force('health.illness', null, []); // TEST SETUP: every week's illness a "no"
  // Past Labor Day's week, so the next one is booked: the week of Monday 13 September.
  sim.advanceTo(at(2027, 9, 6, 12));
  const week = sim.universe.scheduled.filter((i) => i.kind === HEALTH_WEEK_KIND && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at)[0]!;
  expect(week.at).toBe(at(2027, 9, 13, 9));
  if (stay) force('health.illness', [sim.player.id, String(week.at)], [0]); // TEST SETUP: that week's first draw, a stay, a "yes"
  sim.advanceTo(at(2027, 9, 30, 12));
  expect((healthOf(sim.player).careLog ?? []).filter((e) => e.care === 'stay').map((e) => e.at)).toEqual(stay ? [at(2027, 9, 13, 9)] : []);
  // No work and under $580 of income in every month the renewal reads: the rules short but for the stay.
  for (const m of ['2027-04', '2027-05', '2027-06', '2027-07', '2027-08', '2027-09']) expect(earningsOf(sim.player).months[m] ?? 0).toBeLessThan(580_00);
  expect(workedBetween(sim, sim.player, at(2027, 4, 1, 0), at(2027, 10, 1, 0))).toEqual({ pay: 0, hours: 0 });
  return sim;
}

describe('health.request_hardship: a member’s renewal notice answered by a stay in hospital', () => {
  // Renamed on 2026-10-16 (brief 09's journeys, inputs/renames.json; until then “PLAYER JOURNEY: a stay in hospital in September 2027; the renewal of 1 November sends its notice, Request A Hardship Exception pressed on Papers on 10 November renews HUSKY D to 1 May 2028, said once; the decision of 6 December passes it by and she’s covered into January; once each across a reload, the same in one jump as day by day; the twin who doesn’t ask is ended with December”): HUSKY D from the first of
  // the month of application moves the renewal a month earlier, and every date after it with it.
  it('PLAYER JOURNEY: a stay in hospital in September 2027; the renewal of 1 October sends its notice, Request A Hardship Exception pressed on Papers on 10 October renews HUSKY D to 1 April 2028, said once; the decision of 5 November passes it by and she’s covered into December; once each across a reload, the same in one jump as day by day; the twin who doesn’t ask is ended with November', () => {
    const snap = freeze(toTheRenewal(true));

    // The notice, by the clock: April to September read, covered while she answers.
    const jump = thaw(snap);
    // What Needs You read and cleared with Mark … Read the evening before, as the player does.
    jump.must({ kind: 'world.mark_read', payload: {} });
    jump.advanceTo(at(2027, 10, 1, 9));
    expect(titled(jump, 'A Notice Of Noncompliance').map((n) => [n.at, n.body])).toEqual([[at(2027, 10, 1, 0, 30), NOTICE]]);
    // Home draws it in the words she can act on (brief 12, 2026-10-17): income, the School or an exception, no hours.
    expect(home(jump)).toContain(`A Notice Of Noncompliance ${NOTICE}`);
    expect(home(jump)).not.toMatch(/hours’ work|half-time/);
    expect(healthOf(jump.player).pending).toMatchObject({ kind: 'renewal', months: ['2027-09', '2027-08', '2027-07', '2027-06', '2027-05', '2027-04'], renewAt: at(2028, 4, 1, 0) });
    expect(coverOn(jump.player, jump.now)).toBe('medicaid');
    expect(jump.universe.scheduled.filter((i) => i.kind === WORK_DECIDED_KIND && i.status === 'pending').map((i) => i.at)).toEqual([at(2027, 11, 5, 0)]);

    // Papers says it, and draws the hardship: a stay in a month it assessed counts if she asks.
    jump.advanceTo(at(2027, 10, 10, 9));
    const before = papers(jump);
    expect(before).toContain(PENDING_LINE);
    expect(before).toContain('If you were in hospital in one of those months, you can ask for it to count.');
    expect(drawnFor('health.apply')).toEqual([]);
    expect(press('health.request_hardship', 'Request A Hardship Exception')).toEqual(['Hardship exception granted. The work rules count as met.']);

    // Renewed as it would have been at its date: six months on from the renewal of 1 October, no gap, said once.
    expect(titled(jump, 'Your Public Cover Is Renewed').map((n) => [n.at, n.body])).toEqual([[at(2027, 10, 10, 9), RENEWED]]);
    expect(home(jump)).toContain(`Your Public Cover Is Renewed ${RENEWED}`);
    expect(healthOf(jump.player).program).toEqual({ kind: 'medicaid', state: 'ct', from: at(2026, 10, 1, 0), band: 'low', renewAt: at(2028, 4, 1, 0) });
    expect(healthOf(jump.player).pending).toBeUndefined();
    // Asked again: nothing waits; Papers draws neither the notice's line nor the button.
    expect(jump.execute({ kind: 'health.request_hardship', payload: {} }).error).toBe('There’s no notice of noncompliance waiting for an answer.');
    const after = papers(jump);
    expect(after).not.toContain('A notice of noncompliance dated');
    expect(drawnFor('health.request_hardship')).toEqual([]);

    // Saved and loaded, and on past the decision's day: the decision finds nothing waiting, and she's covered into December.
    const back = thaw(freeze(jump));
    back.advanceTo(at(2027, 12, 2, 9));
    expect(coverOn(back.player, at(2027, 11, 30, 23))).toBe('medicaid');
    expect(coverOn(back.player, at(2027, 12, 1, 9))).toBe('medicaid');
    expect(healthOf(back.player).program!.until).toBeUndefined();
    expect(titled(back, 'Your Public Cover Ends')).toEqual([]);
    expect(titled(back, 'Your Health Cover Ended').filter((n) => n.at >= at(2027, 10, 1, 0))).toEqual([]);
    expect(titled(back, 'A Notice Of Noncompliance')).toHaveLength(1);
    expect(titled(back, 'Your Public Cover Is Renewed')).toHaveLength(1);
    expect(back.universe.scheduled.filter((i) => i.kind === WORK_DECIDED_KIND && i.status === 'pending')).toEqual([]);
    // No premium for HUSKY D: nothing health took from her bank was a premium.
    expect(back.universe.transactions.filter((t) => /premium/i.test(t.memo))).toEqual([]);

    // The same span a day at a time, reloaded twice on the way, the hardship pressed at the same hour: the same record.
    // Each day at 9 AM by the calendar: the clocks go back on 7 November, so a day isn't always 24 hours.
    let steps = thaw(snap);
    const reloadAt = [at(2027, 10, 5, 0), at(2027, 11, 5, 12)];
    for (let day = 0, t = at(2027, 10, 1, 9); t <= at(2027, 12, 2, 9); day += 1, t = at(2027, 10, 1 + day, 9)) {
      steps.advanceTo(t);
      if (reloadAt.length && t >= reloadAt[0]!) { steps = thaw(freeze(steps)); reloadAt.shift(); }
      if (t === at(2027, 10, 10, 9)) { papers(steps); expect(press('health.request_hardship', 'Request A Hardship Exception')).toEqual(['Hardship exception granted. The work rules count as met.']); }
      // Covered every day of it.
      expect(coverOn(steps.player, t)).toBe('medicaid');
    }
    expect(health(steps)).toEqual(health(back));
    expect(healthOf(steps.player)).toEqual(healthOf(back.player));

    // The twin who doesn't ask: decided on 5 November, ended with November, said ten days ahead.
    const unasked = thaw(snap);
    unasked.advanceTo(at(2027, 12, 2, 9));
    expect(titled(unasked, 'Your Public Cover Is Renewed')).toEqual([]);
    expect(titled(unasked, 'Your Public Cover Ends').map((n) => n.at)).toEqual([at(2027, 11, 5, 0)]);
    expect(home(unasked)).toContain('Your Public Cover Ends No month from April to September 2027 showed $580.00 of income, time at the School or an exception, and none was shown by November 4, 2027, so HUSKY D ends on November 30, 2027.');
    expect(healthOf(unasked.player).program!.until).toBe(at(2027, 12, 1, 0));
    expect(coverOn(unasked.player, at(2027, 12, 1, 9))).toBeUndefined();
  }, 900_000);

  // Renamed on 2026-10-16 (brief 09's journeys, inputs/renames.json; until then “PLAYER JOURNEY: with no stay in hospital from May to October 2027, the renewal’s notice offers no hardship: Papers says why in the engine’s words and draws no button, and the command is refused in them with nothing changed”): the renewal of 1 October reads April to September.
  it('PLAYER JOURNEY: with no stay in hospital from April to September 2027, the renewal’s notice offers no hardship: Papers says why in the engine’s words and draws no button, and the command is refused in them with nothing changed', () => {
    const sim = toTheRenewal(false);
    sim.advanceTo(at(2027, 10, 10, 9));
    expect(healthOf(sim.player).pending).toMatchObject({ kind: 'renewal' });
    const text = papers(sim);
    expect(text).toContain(PENDING_LINE);
    expect(text).toContain(NO_STAY);
    expect(drawnFor('health.request_hardship')).toEqual([]);
    const was = freeze(sim);
    expect(sim.execute({ kind: 'health.request_hardship', payload: {} }).error).toBe(NO_STAY);
    expect(freeze(sim)).toBe(was);
    expect(titled(sim, 'Your Public Cover Is Renewed')).toEqual([]);
  }, 600_000);
});
