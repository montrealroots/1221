/**
 * The family a new life comes from, chosen on creation's Genres & Background from 2026-10-14, and the paths it opens:
 * until then every new life's family was wealthy (`newLifeConfig`, `newLifeFrom`), so Yale's need assessment found
 * none for any player, and the living-expense scholarship, conversion to grant aid and the aid a leave returns were
 * reached only by tests that set `family` by hand. Here each is reached by a life made as the screen makes it: the
 * family picked on the select's own change (`withFamily`), and the config that gives handed to `createSave`.
 *
 * Every figure is worked here from the rule's own numbers and written as a literal, never asked of the helper the engine
 * computes it with:
 * - the families' money is the profile's euros at SLATE's 0.92 to the dollar, to the whole dollar (as
 *   tests/evidence-g29-ui.test.ts works the wealthy one): Nothing 40 € is $43 in checking and nothing else; Scraping
 *   1,240 € and 300 € are $1,348 and $326, with a 1,500 € card, $1,630, 840 € of it, $913, owed; Modest 4,800 € and
 *   6,500 € are $5,217 and $7,065, a 6,000 € card, $6,522, with 420 €, $457, owed; Comfortable 18,000 € and 42,000 € are
 *   $19,565 and $45,652, a 20,000 € card, $21,739; Wealthy $92,391, $413,043 and $65,217; Inherited 240,000 € and
 *   2,400,000 € are $260,870 and $2,608,696, a 150,000 € card, $163,043;
 * - the term's account is the Bulletin's 2026–27 cost of attendance (\`COST_2026_27\`): living expenses $28,028 less the
 *   $3,764 health plan plus $2,373 of books, and the plan, $30,401 a year, half of it a term: a living-expense
 *   scholarship of $15,200.50, the plan's half, $1,882, met from it, and $13,318.50 paid to the bank; the US taxes all
 *   but the books' half, $1,186.50, so $14,014.00 is the term's taxable scholarship;
 * - conversion is six hours at the work-study rate, $23.00, $138.00;
 * - a leave begun on 21 January 2027, past a tenth of the spring's classes and before a quarter, returns half the
 *   term's scholarship on the rebate schedule, $7,600.25 (the Bulletin's schedule, as tests/evidence-g25-school.test.ts
 *   reaches the same day);
 * - Connecticut's marketplace line is 175% of 2025's poverty line, $15,650, a twelfth of it a month, $2,282.29; and a
 *   Capital One 360 Performance Savings account earns 3.00% a year, a 365th a day on the day's balance, paid at the
 *   month's end: $2,608,696 for August's last seven days is $1,500.89, and that much more for September's thirty
 *   $6,436.10.
 *
 * The marketplace, and whether a life with need reaches it. Every played income a life with need has is under the
 * line: work-study is the only pay a student has in a term, at most 19 hours a week across Yale's jobs in the class
 * period (a six-hour Saturday and three four-hour evenings, eighteen, $414), paid each Friday, and electives are offered
 * only in the class period, so a month of five Fridays pays at most $2,070; the Summer Cabaret's $375 a week, five
 * Fridays at most in a month, $1,875; and savings interest, which for the richest family with need (Comfortable, all
 * of it moved to Capital One's 3.00%, with the first term's $13,318.50 beside it, about $78,500) is about $196 a month
 * in the first fall. $2,070 and $196 is $2,266, under 2026's $2,282.29, and from 2027 the line is $2,327.50 (2026's
 * $15,960). A third year's October, with five Fridays, every free evening worked and every scholarship saved at 3.00%,
 * might pass it by some fifty dollars; that wasn't played, and isn't claimed here. What does pass it is a family whose
 * means rule need out: Inherited, its savings at Capital One, earns $6,436.10 of interest in September, and the
 * marketplace is what Papers' Enroll gives on 1 October, where a Comfortable family's student at the same bank, with
 * $112.63, is given HUSKY D. That life's claim is denied (TEST SETUP: the draws forced) and appealed, and the appeal
 * overturned gives back what was paid over the plan's share.
 *
 * And the units (the owner's rule of 2026-10-14, `bodyUnits`): a body is said in the units of where the person lives,
 * on the person look and on creation's Your Body, and both say which and why. A student born in London and one born in
 * New York, both at Yale, are asked and shown feet, inches and pounds.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`, the family chosen on the screen), Ada Cole, born in New
 * York unless a test says London, an actor at Yale in New Haven from Monday 24 August 2026, played by the clock. The
 * seeds are arbitrary, none picked for what it draws: need-a, need-w, need-m1, need-m2.
 *
 * TEST SETUP, said again where it's done:
 * - the coursework prepared each midnight and the student rested, fed and awake each time the clock moves, as
 *   tests/evidence-g26-school.test.ts plays one;
 * - the flu on the day a Saturday shift is called in sick, as illness comes by the draw;
 * - the week's illness draw forced to a doctor's visit, the claim's draw to a denial and the appeal's to overturn it,
 *   as tests/evidence-g05-life.test.ts forces them.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, type Instant } from '@/engine/core/time';
import { FAMILIES, findsNeed, newLifeConfig, newLifeFrom, type NewSaveConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { PREP_DIMS } from '@/engine/content/coursework';
import { courseworkOf } from '@/engine/systems/coursework';
import { CONVERT_KIND, SHIFT_KIND, hasNeed } from '@/engine/systems/school';
import { accountOwed } from '@/engine/systems/leave';
import { APPEAL_KIND, HEALTH_WEEK_KIND, coverOn, healthOf } from '@/engine/systems/health';
import { appointmentsOf } from '@/engine/systems/appointments';
import { earningsOf } from '@/engine/systems/earnings';
import { payeeAccount } from '@/engine/systems/cash';
import { SCHOOL } from '@/engine/content/guide/school';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  /** What the screen asked its given states to become: each setter's argument, a value or an updater, in order. */
  sets: [] as unknown[],
  /** The controls drawn: each select and input, with its props, so its own handler can be pressed. */
  els: [] as { type: string; props: Record<string, unknown> }[],
  /** The Gated buttons drawn, each with its feature, words, state and onClick. */
  clicks: [] as { feature: string; label: string; title?: string; disabled: boolean; onClick?: () => void }[],
  toasts: [] as string[],
  tabs: {} as Record<string, string>,
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    if (h.states.length === 0) return [value, set];
    const v = h.states.shift();
    if (v === h.keep) return [value, set];
    return [v, (next: unknown) => { h.sets.push(next); }];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

const keepControls = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (props && (type === 'select' || type === 'input')) h.els.push({ type: type as string, props });
    return make(type, props, ...rest);
  };
  return {
    ...real,
    ...(real.jsx ? { jsx: grab(real.jsx as never), jsxs: grab(real.jsxs as never) } : {}),
    ...(real.jsxDEV ? { jsxDEV: grab(real.jsxDEV as never) } : {}),
  };
};
vi.mock('react/jsx-runtime', async (orig) => keepControls(await orig<Record<string, unknown>>()));
vi.mock('react/jsx-dev-runtime', async (orig) => keepControls(await orig<Record<string, unknown>>()));

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
    toast: (message: string) => { h.toasts.push(message); },
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

// A Gated button drawn as it is, its feature, words, title, state and onClick kept so a test can press it as the player would.
vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  const words = (c: unknown): string => (Array.isArray(c) ? c.map(words).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : '');
  return {
    ...real,
    Gated: (props: Parameters<typeof real.Gated>[0]) => {
      h.clicks.push({ feature: props.feature, label: words(props.children), title: props.title, disabled: Boolean(props.disabled), onClick: props.onClick as never });
      return ce(real.Gated, props);
    },
  };
});

const { CharacterCreation } = await import('@/ui/creation/CharacterCreation');
const { YaleAccountPanel, WorkLimitsBlock } = await import('@/ui/components/StudyPlanPanels');
const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
const { at: lookAt } = await import('@/ui/looks');
const { resolveLook } = await import('@/ui/looks/registry');

// ---------------------------------------------------------------------------
// The screens, the lives and the clock
// ---------------------------------------------------------------------------

const ZONE = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, ZONE);
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

const STEP = { Background: 2, StartingPoint: 3, Review: 4 } as const;
/** Ada Cole's answers, as the screen sends them: a new life at Yale, born in New York unless a test says otherwise. */
const answers = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });

/**
 * A creation step as the player has it. TEST SETUP: CharacterCreation's states in render order, the step and the
 * config, and the two it keeps (whether a draft was restored, and the tick a country's arrival gives).
 */
function creation(step: number, config: NewSaveConfig) {
  h.states = [step, config, h.keep, h.keep];
  h.sets = [];
  h.els = [];
  const html = renderToStaticMarkup(createElement(CharacterCreation, { slot: 1 as never, onCancel: () => undefined, onStart: () => undefined }));
  expect(h.states, 'every state given was taken').toHaveLength(0);
  const els = [...h.els];
  const control = (id: string) => { const c = els.find((e) => e.props.id === id); expect(c, `#${id} on the step`).toBeDefined(); return c!; };
  return {
    html,
    text: onScreen(html),
    control,
    /** The select's own change, as the player makes it: the config the screen set from it. */
    choose: (id: string, value: string): NewSaveConfig => {
      h.sets = [];
      (control(id).props.onChange as (e: unknown) => void)({ target: { value } });
      expect(h.sets.length, 'the change set the config').toBeGreaterThan(0);
      return h.sets.reduce<NewSaveConfig>((c, s) => (typeof s === 'function' ? (s as (c: NewSaveConfig) => NewSaveConfig)(c) : s as NewSaveConfig), config);
    },
  };
}
/** The config a family chosen on Genres & Background gives, by the select's own change. */
const chosen = (family: StartingWealth, extra: Partial<NewSaveConfig> = {}): NewSaveConfig => creation(STEP.Background, answers(extra)).choose('family', family);

/** TEST SETUP: the work done each midnight, every open piece's every part prepared. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
const life = (seed: string, config: NewSaveConfig) => working(createSave(1, seed, config));
const freeze = (sim: Simulation): string => JSON.stringify(sim.universe);
const thaw = (snap: string): Simulation => working(loadSave(JSON.parse(snap) as never));
function once<T>(play: () => T): () => T {
  let done: { value: T } | undefined;
  return () => (done ??= { value: play() }).value;
}
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tend = (sim: Simulation, until: Instant) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);
const memos = (sim: Simulation, memo: RegExp) => sim.universe.transactions.filter((t) => memo.test(t.memo));
/** What a transaction moved into one account (negative out of it). */
const into = (t: { postings: { accountId: string; amount: number }[] }, accountId: string) => t.postings.filter((p) => p.accountId === accountId).reduce((s, p) => s + p.amount, 0);
const mine = (sim: Simulation, kind: string) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && a.kind === kind);
const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;

/** A screen as the player has it: its markup and words; the Gated buttons it drew are in `h.clicks`. */
function drawn(sim: Simulation, screen: FunctionComponent, tabs: Record<string, string> = {}): { html: string; text: string } {
  h.sim = sim;
  h.clicks = [];
  h.states = [];
  h.tabs = tabs;
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  return { html, text: onScreen(html) };
}
const drew = (feature: string) => h.clicks.filter((c) => c.feature === feature);
/** A Gated button pressed by its own onClick: what it toasted. */
function press(feature: string): string[] {
  const b = drew(feature)[0];
  expect(b, `a ${feature} button`).toBeDefined();
  h.toasts = [];
  b!.onClick!();
  return h.toasts;
}
/** A Stat tile's figure and its note, by its label. */
const stat = (html: string, label: string) => {
  const m = html.match(new RegExp(`<span class="stat-label">${label}</span><span class="stat-value[^"]*">([^<]*)</span>(?:<span class="stat-note">([^<]*)</span>)?`));
  return m ? { value: m[1], note: m[2] } : undefined;
};
/** A look as it opens: its body's words. */
function look(sim: Simulation, kind: string, id: string): string {
  h.sim = sim;
  h.states = [];
  const found = resolveLook(sim, lookAt(kind, id));
  if (!found || 'gone' in found) throw new Error(`${kind}:${id} didn’t resolve`);
  return onScreen(renderToStaticMarkup(createElement('div', null, found.body)));
}

// ---------------------------------------------------------------------------
// c-family and c-wealth: the choice, on the screen and in the bank
// ---------------------------------------------------------------------------

/** Each family's first morning, worked by hand above: checking, savings, and the card's limit and what's owed on it. */
const MONEY: Record<StartingWealth, { label: string; checking: string; savings: string; card?: string; need: boolean; cents: [number, number] }> = {
  nothing: { label: 'Nothing', checking: '$43', savings: '$0', need: true, cents: [43_00, 0] },
  scraping: { label: 'Scraping', checking: '$1,348', savings: '$326', card: '$913 owed of $1,630', need: true, cents: [1_348_00, 326_00] },
  modest: { label: 'Modest', checking: '$5,217', savings: '$7,065', card: '$457 owed of $6,522', need: true, cents: [5_217_00, 7_065_00] },
  comfortable: { label: 'Comfortable', checking: '$19,565', savings: '$45,652', card: '$0 owed of $21,739', need: true, cents: [19_565_00, 45_652_00] },
  wealthy: { label: 'Wealthy', checking: '$92,391', savings: '$413,043', card: '$0 owed of $65,217', need: false, cents: [92_391_00, 413_043_00] },
  inherited: { label: 'Inherited', checking: '$260,870', savings: '$2,608,696', card: '$0 owed of $163,043', need: false, cents: [260_870_00, 2_608_696_00] },
};

describe('the family a new life comes from (c-family, c-wealth)', () => {
  it('Genres & Background offers the six families, Wealthy chosen as creation chose before; each, chosen on the select, is what Review says and what the save opens', () => {
    const step = creation(STEP.Background, answers());
    expect(step.text).toContain('Your Family The family you come from: the money in your name on the first morning, and what Yale’s need assessment reads.');
    const select = step.control('family');
    expect(select.props.value).toBe('wealthy');
    expect(step.html).toContain('<option value="nothing">Nothing</option><option value="scraping">Scraping</option><option value="modest">Modest</option><option value="comfortable">Comfortable</option><option value="wealthy" selected="">Wealthy</option><option value="inherited">Inherited</option>');
    for (const family of FAMILIES) {
      const m = MONEY[family];
      const config = step.choose('family', family);
      expect(config.wealth).toBe(family);
      // The callout under the select, for the family chosen.
      const callout = creation(STEP.Background, config).text;
      expect(callout).toContain(`${m.checking} in checking and ${m.savings} in savings`);
      expect(callout).toContain(m.need
        ? 'Yale finds need: its living-expense scholarship, $15,200.50 a term, meets the term’s Yale Health plan, $1,882.00, and pays the rest, $13,318.50, into your bank each fall and spring.'
        : 'Yale finds no need: the family’s means rule it out, so there’s no aid for living costs, and the term’s Yale Health plan, $1,882.00, comes from your bank each fall and spring.');
      const review = creation(STEP.Review, config).text;
      expect(review).toContain(`Family ${m.label}, ${m.need ? 'Need Found' : 'No Need Found'}`);
      expect(review).toContain(`Checking ${m.checking}`);
      expect(review).toContain(`Savings ${m.savings}`);
      if (m.card) expect(review).toContain(`Card ${m.card}`);
      else expect(review).not.toMatch(/ Card \$/);
      // Begin's save: the family the need assessment reads, and the money opened, both as Review said them.
      const sim = createSave(1, `need-family-${family}`, config);
      expect(hasNeed(sim.player)).toBe(m.need);
      expect(findsNeed(config)).toBe(hasNeed(sim.player));
      expect(checking(sim).balance).toBe(m.cents[0]);
      expect(mine(sim, 'savings').reduce((n, a) => n + a.balance, 0)).toBe(m.cents[1]);
    }
  });

  it('the Nothing family’s life begins with no card, and its Profile says Risk Tolerance set no autopay, where the Wealthy one’s card started on the whole statement', () => {
    const none = createSave(1, 'need-family-nothing', chosen('nothing'));
    expect(mine(none, 'credit_card')).toHaveLength(0);
    expect(drawn(none, ProfileWorkspace).text).toContain('Risk Tolerance 50, 65 or under, which sets where a card’s autopay starts; you hold no card, so it set none ;');
    expect(drawn(createSave(1, 'need-family-wealthy', chosen('wealthy')), ProfileWorkspace).text).toContain('Risk Tolerance 50, 65 or under, so the card’s autopay started on the whole statement ;');
  });

  it('a draft carried back keeps the family it chose, and its means with it; a draft naming none the game knows comes back wealthy', () => {
    expect(newLifeFrom({ ...answers(), wealth: 'scraping', family: 'wealthy' })).toMatchObject({ wealth: 'scraping', family: undefined });
    expect(newLifeFrom({ ...answers(), wealth: 'inherited', family: undefined })).toMatchObject({ wealth: 'inherited', family: 'wealthy' });
    expect(newLifeFrom({ ...answers(), wealth: 'lottery' as never })).toMatchObject({ wealth: 'wealthy', family: 'wealthy' });
    expect(newLifeConfig()).toMatchObject({ wealth: 'wealthy', family: 'wealthy' });
  });

  it('the guide says what each family means: the money on the first morning and whether need is found, in the figures the term pays', () => {
    const money = SCHOOL.find((e) => e.id === 'school.money')!;
    expect(money.reads.find((r) => r.label === 'Need')!.value).toBe('Yale’s assessment of your family’s means, the family you chose at creation beside your background. Nothing, Scraping, Modest or Comfortable: need is found, and the living-expense scholarship, $15,200.50 a term in 2026–27, meets the term’s Yale Health plan, $1,882, and pays the rest, $13,318.50, into your bank each fall and spring; hours missed ill can be converted, and a leave begun mid-term returns part of the scholarship. Wealthy or Inherited: the means rule need out, so there’s no living aid, no hours to convert, and the plan comes from your bank');
    expect(money.reads.find((r) => r.label === 'Your Family’s Money')!.value).toBe('What each family puts in your name on the first morning: Nothing, $43 in checking and $0 in savings; Scraping, $1,348 in checking and $326 in savings; Modest, $5,217 in checking and $7,065 in savings; Comfortable, $19,565 in checking and $45,652 in savings; Wealthy, $92,391 in checking and $413,043 in savings; Inherited, $260,870 in checking and $2,608,696 in savings');
  });
});

// ---------------------------------------------------------------------------
// The term's account: Yale's living-expense scholarship
// ---------------------------------------------------------------------------

/**
 * Two lives from the same answers, one Scraping, the other Wealthy as the screen leaves it; the scraping one calls in
 * sick on its first assigned Saturday and asks on the drawn button for the six hours to be converted; both played to
 * Wednesday 13 January 2027, the spring's third day of classes.
 */
const played = once(() => {
  const need = life('need-a', chosen('scraping'));
  const rich = life('need-w', chosen('wealthy'));
  const fall = { need: { before: checking(need).balance }, rich: { before: checking(rich).balance } };
  tend(need, at(2026, 8, 24, 12));
  tend(rich, at(2026, 8, 24, 12));
  const afterFall = { need: freeze(need), rich: freeze(rich) };
  // The first assigned Saturday, 5 September at ten, six hours: called in sick (TEST SETUP: the flu) two hours before.
  tend(need, at(2026, 9, 1, 8));
  const sat = pendingOf(need, SHIFT_KIND).filter((i) => i.payload.elective === false)[0]!;
  expect([sat.at, Number(sat.payload.hours)]).toEqual([at(2026, 9, 5, 10), 6]);
  tend(need, sat.at - 2 * MS_HOUR);
  healthOf(need.player).fluUntil = need.now + MS_DAY;
  need.must({ kind: 'school.call_in_sick', payload: {} });
  tend(need, sat.at + MS_HOUR);
  const sick = freeze(need);
  tend(need, at(2027, 1, 13, 12));
  tend(rich, at(2027, 1, 13, 12));
  return { fall, afterFall, sick, jan13: { need: freeze(need), rich: freeze(rich) } };
});

describe('Yale’s living-expense scholarship, the term’s account (c-family)', () => {
  it('PLAYER JOURNEY: a Scraping family’s student is paid $13,318.50 at the fall term’s start, the scholarship meeting the plan; the Wealthy one pays the $1,882 plan from the bank; each notice says which', () => {
    const { fall, afterFall } = played();
    const need = thaw(afterFall.need);
    const rich = thaw(afterFall.rich);
    const paid = memos(need, /^Living-expense scholarship, the fall term of 2026: /);
    expect(paid).toHaveLength(1);
    expect(into(paid[0]!, checking(need).id)).toBe(13_318_50);
    expect(checking(need).balance - fall.need.before).toBe(13_318_50);
    expect(earningsOf(need.player).years[2026]!.scholarship).toBe(14_014_00);
    expect(titled(need, 'Fall Term 2026 Begins').map((n) => n.body)).toEqual(['Your living-expense scholarship of $15,200.50 met this term’s Yale Health plan, $1,882.00, and $13,318.50 is in your Chase Total Checking. Tuition, $20,375.00 a term, is covered by the tuition scholarship.']);
    expect(memos(rich, /^Living-expense scholarship/)).toHaveLength(0);
    expect(checking(rich).balance - fall.rich.before).toBe(-1_882_00);
    expect(earningsOf(rich.player).years[2026]?.scholarship ?? 0).toBe(0);
    expect(titled(rich, 'Fall Term 2026 Begins').map((n) => n.body)).toEqual(['Tuition, $20,375.00 a term, is covered by the tuition scholarship. Yale’s aid for living costs goes by need, and none was found, so this term’s Yale Health plan, $1,882.00, was paid from your bank, and living costs are yours.']);
    // Terms And Award, as each has it.
    const terms = { 'tab:/workspace/school': 'terms' };
    expect(drawn(need, SchoolWorkspace, terms).text).toContain('Each Term Billed Credited Tuition $20,375.00 Tuition Scholarship $20,375.00 Yale Health Plan $1,882.00 Living-Expense Scholarship $15,200.50 Paid To Your Bank $13,318.50');
    expect(drawn(need, SchoolWorkspace, terms).text).toContain('Yours found need, and the scholarship meets it.');
    expect(drawn(rich, SchoolWorkspace, terms).text).toContain('Each Term Billed Credited Tuition $20,375.00 Tuition Scholarship $20,375.00 Yale Health Plan $1,882.00 Paid From Your Bank $1,882.00');
    expect(drawn(rich, SchoolWorkspace, terms).text).toContain('Yours found none, so the health plan and living costs come from your bank.');
  }, 120_000);

  it('PLAYER JOURNEY: the spring term pays the Scraping student $13,318.50 again on 4 January 2027, and the year’s taxable scholarship is $14,014.00 each year', () => {
    const { jan13 } = played();
    const need = thaw(jan13.need);
    expect(memos(need, /^Living-expense scholarship, the spring term of 2027: /).map((t) => [t.at, into(t, checking(need).id)])).toEqual([[at(2027, 1, 4, 9), 13_318_50]]);
    expect(earningsOf(need.player).years[2027]!.scholarship).toBe(14_014_00);
    expect(memos(thaw(jan13.rich), /^Living-expense scholarship/)).toHaveLength(0);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// school.request_conversion
// ---------------------------------------------------------------------------

describe('school.request_conversion, for a life the screen made with need', () => {
  it('PLAYER JOURNEY: the Saturday called in sick, asked for on the drawn button, is paid at January’s processing, $138.00 into the bank, where the Wealthy family’s student is refused in the button’s words', () => {
    const need = thaw(played().sick);
    const panel = drawn(need, WorkLimitsBlock);
    expect(stat(panel.html, 'Convertible To Grant Aid')).toEqual({ value: '6 hours', note: '$138.00 at the rate; 0 converted' });
    const ask = drew('school.request_conversion');
    expect(ask.map((c) => [c.label, c.disabled])).toEqual([['Ask For Conversion To Grant Aid', false]]);
    ask[0]!.onClick!();
    expect(h.toasts.at(-1)).toBe('Asked: processed January 15, 2027.');
    expect(pendingOf(need, CONVERT_KIND).map((i) => i.at)).toEqual([at(2027, 1, 15, 12)]);
    tend(need, at(2027, 1, 15, 11));
    const before = checking(need).balance;
    const scholarship = earningsOf(need.player).years[2027]!.scholarship!;
    tend(need, at(2027, 1, 15, 13));
    const grants = memos(need, /^Grant-in-aid: 6 work-study hours converted/);
    expect(grants.map((t) => [t.at, into(t, checking(need).id)])).toEqual([[at(2027, 1, 15, 12), 138_00]]);
    expect(checking(need).balance - before).toBe(138_00);
    expect(earningsOf(need.player).years[2027]!.scholarship! - scholarship).toBe(138_00);
    expect(need.player.school!.convertedHours).toEqual({ 0: 6 });
    expect(titled(need, 'Hours Converted To Grant Aid').map((n) => n.body)).toEqual(['6 work-study hours you couldn’t work became $138.00 of grant aid, paid into your Chase Total Checking. It’s a scholarship for living costs, which the US taxes.']);
    // The Wealthy family's student, on the same screen: Not On Aid, the button grayed in the refusal's words.
    const rich = thaw(played().afterFall.rich);
    expect(stat(drawn(rich, WorkLimitsBlock).html, 'Convertible To Grant Aid')).toEqual({ value: 'Not On Aid', note: undefined });
    expect(rich.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe('Conversion to grant aid is for students on financial aid, and no need was found for you.');
  }, 120_000);
});

// ---------------------------------------------------------------------------
// school.request_leave, and the balance it leaves (school.pay_balance)
// ---------------------------------------------------------------------------

describe('a leave taken with need: the aid returned, the balance, and paying it', () => {
  it('PLAYER JOURNEY: a personal leave asked on the spring’s third day, begun on 21 January, returns half the spring’s scholarship, $7,600.25, to the Yale account; Pay From Your Bank, drawn and pressed, settles it from the bank to the cent', () => {
    const sim = thaw(played().jan13.need);
    expect(sim.execute({ kind: 'school.pay_balance', payload: {} }).error).toBe('Your Yale account owes no balance.');
    const asked = sim.must<{ decideAt: Instant }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
    expect(asked.decideAt).toBe(at(2027, 1, 21, 12));
    tend(sim, asked.decideAt + MS_HOUR);
    const leave = sim.player.school!.leave!;
    expect(leave.status).toBe('on');
    expect(leave.aidReturned).toBe(7_600_25);
    expect(accountOwed(sim, sim.player)).toBe(7_600_25);
    expect(memos(sim, /^Living-expense scholarship returned on the rebate schedule \(50%\), Spring Term 2027: leave of absence/)).toHaveLength(1);
    const panel = drawn(sim, YaleAccountPanel);
    expect(stat(panel.html, 'Owed On Your Yale Account')?.value).toBe('$7,600.25');
    expect(drew('school.pay_balance').map((c) => c.label)).toEqual(['Pay From Your Bank']);
    const bank = checking(sim).balance;
    drew('school.pay_balance')[0]!.onClick!();
    expect(h.toasts.at(-1)).toBe('Paid in full.');
    expect(accountOwed(sim, sim.player)).toBe(0);
    expect(checking(sim).balance).toBe(bank - 7_600_25);
    expect(sim.execute({ kind: 'school.pay_balance', payload: {} }).error).toBe('Your Yale account owes no balance.');
  }, 120_000);

  it('the Wealthy family’s student, on the same leave on the same day, has no aid to return and owes nothing', () => {
    const sim = thaw(played().jan13.rich);
    const asked = sim.must<{ decideAt: Instant }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
    tend(sim, asked.decideAt + MS_HOUR);
    expect(sim.player.school!.leave!.status).toBe('on');
    expect(sim.player.school!.leave!.aidReturned).toBeUndefined();
    expect(accountOwed(sim, sim.player)).toBe(0);
    expect(sim.execute({ kind: 'school.pay_balance', payload: {} }).error).toBe('Your Yale account owes no balance.');
  }, 120_000);
});

// ---------------------------------------------------------------------------
// The marketplace, on interest the clock pays, a denial and its appeal (health.appeal_decided)
// ---------------------------------------------------------------------------

/** The visit's figures, as tests/evidence-g05-life.test.ts works them: Access Health CT's Standard Silver copay, and the uninsured price. */
const SHARE = 45_00;
const UNINSURED = 183_98;

/**
 * TEST SETUP: draws forced on one save, as the deciders' sweep forces one: a stream's numbers for one key, or for every
 * key, given in order, and then 0.999, a "no" to every chance after them.
 */
function forcing(sim: Simulation): (stream: string, key: (string | number)[] | null, values: number[]) => void {
  const forced = new Map<string, number[]>();
  const real = sim.rng.bind(sim);
  const rng = (stream: string, ...keys: (string | number)[]) => {
    const values = forced.get([stream, ...keys].join('|')) ?? forced.get(stream);
    const d = real(stream, ...keys);
    if (!values) return d;
    let i = 0;
    return { ...d, next: () => values[i++] ?? 0.999 };
  };
  Object.assign(sim, { rng });
  return (stream, key, values) => { forced.set(key ? [stream, ...key].join('|') : stream, values); };
}
/** The week's draw in `illnessWeek`'s order, forced to a doctor's visit. */
const VISIT = [0.999, 0.999, 0];

/** A life at Capital One, withdrawn on 25 August 2026 in the first fifteen days, so Yale Health ends; played to 1 October. */
function withdrawnAtCapitalOne(seed: string, family: StartingWealth): Simulation {
  const sim = life(seed, { ...chosen(family), bankId: 'us-capital-one' });
  sim.advanceTo(at(2026, 8, 25, 12));
  expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
  sim.advanceTo(at(2026, 10, 1, 9));
  return sim;
}

describe('the marketplace, offered on income the clock paid (health.enroll, health.appeal_decided)', () => {
  it('PLAYER JOURNEY: an Inherited family’s savings at Capital One earn $6,436.10 in September, over Connecticut’s line, and Enroll on Papers gives the marketplace; a Comfortable family’s student at the same bank, with $112.63, is given HUSKY D', () => {
    const sim = withdrawnAtCapitalOne('need-m1', 'inherited');
    const interest = memos(sim, /^Interest: 360 Performance Savings$/);
    expect(interest.map((t) => [t.at, into(t, mine(sim, 'savings')[0]!.id)])).toEqual([[at(2026, 8, 31, 23), 1_500_89], [at(2026, 9, 30, 23), 6_436_10]]);
    expect(earningsOf(sim.player).months['2026-09']).toBe(6_436_10);
    drawn(sim, PapersWorkspace, { 'tab:/workspace/papers': 'health' });
    expect(press('health.enroll')).toEqual(['Enrolled in the marketplace, from November 1, 2026.']);
    sim.advanceTo(at(2026, 11, 1, 8));
    expect(coverOn(sim.player, sim.now)).toBe('marketplace');
    const twin = withdrawnAtCapitalOne('need-m2', 'comfortable');
    expect(earningsOf(twin.player).months['2026-09']).toBe(112_63);
    drawn(twin, PapersWorkspace, { 'tab:/workspace/papers': 'health' });
    expect(press('health.enroll')).toEqual(['Enrolled in HUSKY D, from November 1, 2026.']);
  }, 120_000);

  it('PLAYER JOURNEY: that marketplace’s claim denied and appealed on Papers; paid when due, then overturned, gives back the $138.98 paid over the $45 share', () => {
    const sim = withdrawnAtCapitalOne('need-m1', 'inherited');
    const force = forcing(sim);
    drawn(sim, PapersWorkspace, { 'tab:/workspace/papers': 'health' });
    press('health.enroll');
    sim.advanceTo(at(2026, 11, 1, 8));
    const week = pendingOf(sim, HEALTH_WEEK_KIND)[0]!;
    force('health.illness', [sim.player.id, String(week.at)], VISIT); // TEST SETUP: the week's draw forced to a visit
    force('health.denial', null, [0]); // TEST SETUP: the claim's draw forced to a denial
    sim.advanceTo(week.at + MS_HOUR);
    const visit = appointmentsOf(sim.player)[0]!;
    sim.advanceTo(visit.at + MS_HOUR);
    const bill = healthOf(sim.player).bills.find((b) => b.at === visit.at)!;
    expect(bill).toMatchObject({ amount: UNINSURED, denied: { share: SHARE } });
    expect(titled(sim, 'A Claim Denied')[0]!.body).toContain(': $183.98 is yours to pay unless an appeal overturns it.');
    drawn(sim, PapersWorkspace, { 'tab:/workspace/papers': 'health' });
    expect(press('health.appeal')).toEqual(['Appealed: decided in 60 days.']);
    const decision = pendingOf(sim, APPEAL_KIND)[0]!;
    expect(decision.at).toBe(sim.now + 60 * MS_DAY);
    sim.advanceTo(bill.dueAt! + MS_HOUR);
    expect(bill.paid).toBe(true);
    force('health.appeal', null, [0.99]); // TEST SETUP: the decision's draw forced to overturn
    sim.advanceTo(decision.at + MS_HOUR);
    expect(bill.denied!.outcome).toBe('overturned');
    expect(bill.amount).toBe(SHARE);
    const won = memos(sim, /^Appeal won: /);
    expect(won.map((t) => into(t, payeeAccount(sim, sim.player).id))).toEqual([138_98]);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// Units: where the person lives, on the look and on creation
// ---------------------------------------------------------------------------

describe('a body’s units, by where the person lives', () => {
  const US = 'In feet, inches and pounds, the units of the United States, where you live.';
  for (const [born, homeRegionId] of [['London', 'uk-eng-london'], ['New York', 'us-ny-newyork']] as const) {
    it(`PLAYER JOURNEY: a ${born}-born student at Yale is asked for her body in feet, inches and pounds on Your Body, and her own page says it in them, each saying why`, () => {
      // 177.8 cm is 70 inches, 5 feet 10; 72.6 kg is 160 pounds at 0.45359237 kg the pound; 72.6 ÷ 1.778² = 22.97.
      const config = answers({ homeRegionId, heightCm: 177.8, weightKg: 72.6 });
      const step = creation(STEP.StartingPoint, config);
      expect(step.text).toContain(`Your Body Your height and weight on the first morning. ${US}`);
      expect(['height-ft', 'height-in', 'weight-lb'].map((id) => step.control(id).props.value)).toEqual([5, 10, 160]);
      expect(step.text).not.toContain('Centimeters');
      const sim = createSave(1, `need-units-${born}`, config);
      expect(look(sim, 'person', sim.player.id)).toContain(`Your body. 5 ft 10 in and 160 lb, a body mass index of 23.0: healthy weight. ${US}`);
    });
  }

  it('a life in London, which no new life at Yale is, reads and is asked centimeters and kilograms, saying why', () => {
    const config = { ...answers({ homeRegionId: 'uk-eng-london', heightCm: 177.8, weightKg: 72.6 }), school: undefined, startLocationId: 'uk-eng-london', livesWhereBorn: true };
    const step = creation(STEP.StartingPoint, config);
    expect(step.text).toContain('Your height and weight on the first morning. In centimeters and kilograms, the units of the United Kingdom, where you live.');
    expect(['height-cm', 'weight-kg'].map((id) => step.control(id).props.value)).toEqual([177.8, 72.6]);
    const sim = createSave(1, 'need-units-londoner', config);
    expect(look(sim, 'person', sim.player.id)).toContain('Your body. 178 cm and 72.6 kg, a body mass index of 23.0: healthy weight. In centimeters and kilograms, the units of the United Kingdom, where you live.');
  });
});
