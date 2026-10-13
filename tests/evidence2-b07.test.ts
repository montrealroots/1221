/**
 * The second round of 2026-10-13's evidence for five school rows the first round left partial (batch b07). The first
 * round's files (tests/evidence-g18-school.test.ts, -g19-, -g20-) closed most of each row; this one closes what they and
 * the skeptic who checked them left open, and says plainly what no played life can reach. Every action is reached as a
 * player reaches it, through the command its screen sends (`sim.execute`, `sim.must`) or the clock (`sim.advanceTo`),
 * and each consequence is read where the row says it's read. The figures are the rules' own numbers worked here by hand
 * and written as literals (trust 12 and the bond 5 for a rehearsal slept through, 6 and 3 for an evening running lines,
 * the cast's 10 less a lead's 12, a rival's lead 1.5 of stress, $23.00 an hour, 0.12 of the lines and 0.25 of the blocking
 * left at a call), never asked of the constant or the helper the engine computes them with.
 *
 * - `school.make_amends`: what the first round left open was a reader of the bond amends give back. A partner let down
 *   four times before the first class (four rehearsals slept through, trust 50 − 48 = 2, the bond 0 − 20 = −20, a
 *   rival's line) is made right with on the Sunday before the spring term, or not; the next morning's cast list gives
 *   her a lead taken from the student (−2 to the bond, both twins), and the twin who didn't make amends, the partner at
 *   −22, is stung by it (castListRead, 1.5 of stress) and sees her called Rival on the Casting tab, where the twin who
 *   did, at −14, isn't and doesn't. A partner kept faith with nine evenings and stood up once (the bond −5 + 18 = 13) is
 *   made right with over the winter break, or not; the spring's shared cast adds 10 to each, 25 against 23, and on the
 *   Carlotta Festival's first night the twin who made amends has a friend in the cast, a point of mood (castCompany),
 *   and the other none. And an evening running lines slept through takes trust 6 and the bond 3, and amends
 *   give back the 6 and 2 of the 3: the figures the comment on `CLASS.amends` gave a rehearsal missed, which takes 12 and
 *   5, until it was corrected later on 2026-10-13 (the defect was reported here, not fixed).
 * - `school.respond`: 'That work is finished.', which the first round couldn't reach, is reached by a withdrawal the
 *   afternoon a classmate brings a different reading: every answer refused in those words, nothing moved, where a twin
 *   still at the School keeps hers. One test here failed on a defect found reaching it, until later on 2026-10-13: the
 *   withdrawal called off the moment's lapse with every other school item, so a moment left unanswered stayed open for
 *   good, its "Answer by" long past, its answers still offered on the Coursework tab.
 * - `school.take_shift`: the review named two ways a booked evening is called off, a leave and leaving the School; the
 *   first round tested the leave. Here an evening booked on the Work-Study tab is called off by a withdrawal: its four
 *   hours are no longer asked for (Elective Hours 8 to 4, the worked evening's kept), the tab says why it offers none,
 *   and the payday a minute after pays the four hours worked, $92, onto the year's return, where the twin who stayed is
 *   paid eight on the Friday.
 * - `practice.exercise`: the bad focus refused in its words with nothing moved; and the evidence for the two refusals
 *   no player meets: every one of the 27 exercises, practised as a variation through the command, carries over to
 *   something it doesn't train, so "This exercise has nothing it carries over to." is never said; and a student who has
 *   withdrawn keeps her fifteen classmates, so live and partnered work is taken, and "It takes a classmate, and you have
 *   no class to ask." is never said either.
 * - `school.term`: the numbering beside a Rep assignment, which the first round's casting test (no Rep, nothing dropped)
 *   couldn't see. The second fall, reached in order by the clock: an understudy's Wednesdays and Fridays at the Rep drop
 *   seven of Directors' Thesis Production I's twenty rehearsal days, and the thirteen kept are numbered 1 to 13, the
 *   read-through first, four blocking (two fifths, rounded), six work-throughs, the technical and the dress last; a twin
 *   out of good standing, with no Rep, keeps all twenty. Every call kept by the clock, the casting's process holds 13
 *   of 13, its lines 1 − 0.88¹³ and its blocking 1 − 0.75⁵, which is what every call kept makes: complete.
 *
 * PLAYER JOURNEYS: new lives (`createSave` with `newLifeConfig`), Ada Cole, born in New York, an actress at Yale in New
 * Haven from Monday 24 August 2026, played by the clock and the commands her screens send, never by calling a handler or
 * a reader in place of them. Seeds were chosen for what they deal, as a player's own save deals it: g18-c (Priya Reyes's
 * other reading at the first class) and g18-probe (Elena Haddad's invitation of 8 September), as the first round found
 * them; g18-g, whose Acting I partner, Hannah Castillo, is given a lead in the spring's Carlotta Festival where the
 * student has a supporting part (a probe of eleven seeds on 2026-10-13 found her the one partner of the eleven to lead
 * while the student didn't); b07-c4, whose partner Imani Patel and the student both have supporting parts in it (of
 * eight seeds probed, three put both out of the leads, b07-c4 among them); g19-shift (a free Tuesday and Thursday
 * evening); g20-focus; and g20-term (Ghosts in the second fall). A twin, the road not taken, is the engine's own load of
 * a copy of the save; a reload goes through the persistence adapter. The Coursework tab's moments and the School screen
 * are rendered with react-dom/server as the player has them, a Gated button kept with its own onClick to be pressed.
 *
 * TEST SETUP, said again where it's done: the seven dials set alike in twins before the moment they're compared at; the
 * body kept fed, rested and awake as the clock moves; the coursework prepared each midnight for the students played to
 * a spring night or a second fall, as tests/school.test.ts plays a student who does the work, so the evaluations keep
 * her in good standing and in the casting; a partner's reliability, drawn once for the life, set to 1 so nine evenings
 * are kept; and the twin out of good standing, set so before its term begins.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_HOUR, formatDateTime, instantFromZoned, zonedParts } from '@/engine/core/time';
import { PREP_DIMS } from '@/engine/content/coursework';
import { EXERCISES } from '@/engine/content/practice';
import { courseworkOf, mateRecord, partnerReadOf, questionsFor, trustOf, type Assignment } from '@/engine/systems/coursework';
import { momentsOf, personOf, type Moment } from '@/engine/systems/classmates';
import { CALL_KIND, SHIFT_KIND } from '@/engine/systems/school';
import { completeFor, processOf } from '@/engine/systems/production';
import { developmentOf } from '@/engine/systems/attributes';
import { yearOf } from '@/engine/systems/earnings';
import { figuresFor } from '@/engine/systems/taxreturn';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tab: 'standing',
  toasts: [] as string[],
  buttons: [] as { feature: string; label: string; title?: string; disabled: boolean; onClick?: () => void }[],
}));

// Without the original: it imports the looks, which import it back. `run` is the save's own execute; a toast is kept.
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
  const words = (c: unknown): string => (Array.isArray(c) ? c.map(words).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : '');
  return {
    ...real,
    Gated: (props: Parameters<typeof real.Gated>[0]) => {
      h.buttons.push({ feature: props.feature, label: words(props.children), title: props.title, disabled: Boolean(props.disabled), onClick: props.onClick as never });
      return real.Gated(props);
    },
  };
});

// The School screen's kept tab, at the one the test asks for: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/school' ? h.tab : initial) as T, () => undefined] as const };
});

const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');
const { ClassMoments } = await import('@/ui/components/ClassMoments');

// ---------------------------------------------------------------------------
// The lives, the clock, and the screens over them
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const ACTING_I = 'DRAM 103a/b';
const at = (year: number, month: number, day: number, hour = 12, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
const fmt = (t: number) => { const p = zonedParts(t, NY); return `${p.year}-${p.month}-${p.day} ${p.hour}:${String(p.minute).padStart(2, '0')}`; };
const life = (seed: string): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** A save written and read back as the adapter does it. */
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** The road not taken: the engine's own load of a copy, never written anywhere. */
const twinOf = (sim: Simulation): Simulation => loadSave(structuredClone(sim.universe) as never);
/** TEST SETUP: the seven dials alike, so twins compared at a moment come to it the same. */
const dials = (sim: Simulation) => {
  Object.assign(sim.player.wellbeing, { energy: 80, stress: 20, sleepDebt: 0, nourishment: 70, morale: 60, hygiene: 90, condition: 100 });
  sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
};
/** TEST SETUP: the body kept fed, rested and awake as the clock moves, six hours at a time, as a player keeps it. */
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};

/** TEST SETUP: the coursework prepared each midnight, as tests/school.test.ts plays a student who does the work. */
const doTheWork = (sim: Simulation) => sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
  for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
});

function go<T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T {
  const r = sim.execute<T>({ kind, payload });
  expect(r.ok, `${kind}: ${r.error}`).toBe(true);
  return r.value as T;
}
/** A command refused: its words. */
function no(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): string {
  const r = sim.execute({ kind, payload });
  expect(r.ok, `${kind} was let through`).toBe(false);
  return r.error!;
}
const cwOf = (sim: Simulation) => courseworkOf(sim, sim.player)!;
const work = (sim: Simulation, id: string): Assignment => cwOf(sim).assignments.find((a) => a.id === id)!;
const actingI = (sim: Simulation): Assignment => cwOf(sim).assignments.find((a) => a.course === ACTING_I && (a.status === 'open' || a.status === 'revising'))!;
const mateOf = (sim: Simulation, a: Assignment) => sim.player.school!.classmates[a.partner!]!;
const bond = (sim: Simulation, a: Assignment) => mateOf(sim, a).bond ?? 0;
const momentIn = (sim: Simulation, id: string): Moment => momentsOf(cwOf(sim)).find((m) => m.id === id)!;
const ask = (sim: Simulation, id: string, when: number) => go<{ accepted: boolean; reason?: string; rehearsalId?: string }>(sim, 'school.ask_partner', { assignmentId: id, at: when });

const textOf = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
/** The School screen at a tab, or the class's moments, as the player has them: markup and words; the Gated buttons drawn are in `h.buttons`. */
function drawn(sim: Simulation, what: string): { html: string; text: string } {
  h.sim = sim;
  h.tab = what;
  h.buttons = [];
  const html = renderToStaticMarkup(createElement(what === 'moments' ? ClassMoments : SchoolWorkspace)).replace(/<!-- -->/g, '');
  return { html, text: textOf(html.replace(/\stitle="[^"]*"/g, '')) };
}
const buttons = (feature: string, label: string) => h.buttons.filter((b) => b.feature === feature && b.label === label);
/** A Gated button pressed, as the player presses it: what it toasted. */
function press(b: { onClick?: () => void } | undefined): string[] {
  expect(b?.onClick, 'a button to press').toBeDefined();
  h.toasts = [];
  b!.onClick!();
  return [...h.toasts];
}

// ---------------------------------------------------------------------------
// school.make_amends
// ---------------------------------------------------------------------------

describe('school.make_amends', () => {
  /** g18-g's Acting I partner, whom the spring's casting gives a lead where the student has a supporting part (measured 2026-10-13). */
  const AMENDS_SEED = 'g18-g';
  const AMENDS_PARTNER = 'Hannah Castillo';

  it('PLAYER JOURNEY: made right on the eve of the spring term, a partner let down four times is back over a rival’s line when the cast list goes up: the twin who didn’t make amends is stung by her lead, 1.5 of stress, and the Casting tab calls her Rival; the twin who did isn’t, and it doesn’t', () => {
    const base = life(AMENDS_SEED);
    base.advanceTo(at(2026, 8, 28, 14));
    const a = actingI(base);
    expect(mateOf(base, a).name).toBe(AMENDS_PARTNER);
    // Four evenings asked for at once, while her trust is whole, and each slept through from six for three hours.
    for (const day of [28, 29, 30, 31]) expect(ask(base, a.id, at(2026, 8, day, 19)).accepted).toBe(true);
    for (const day of [28, 29, 30, 31]) { base.advanceTo(at(2026, 8, day, 18)); go(base, 'life.sleep', { hours: 3 }); }
    base.advanceTo(at(2026, 8, 31, 22));
    expect(work(base, a.id).rehearsals.map((r) => r.status)).toEqual(['missedByYou', 'missedByYou', 'missedByYou', 'missedByYou']);
    // Trust 12 and the bond 5 each time: 50 − 48 = 2, and 0 − 20 = −20, a rival's line (−20 or under).
    expect([trustOf(mateOf(base, a)), bond(base, a)]).toEqual([2, -20]);
    // The fall played by the clock to the Sunday before the spring term: nothing made right, nothing moved since.
    base.advanceTo(at(2027, 1, 3, 12));
    expect(bond(base, a)).toBe(-20);
    expect((personOf(mateOf(base, a)).incidents ?? []).filter((x) => !x.repaired).map((x) => x.kind)).toEqual(['missed', 'missed', 'missed', 'missed']);
    const owed = twinOf(base);
    const amended = twinOf(base);
    expect(go<{ repaired: number }>(amended, 'school.make_amends', { mate: a.partner })).toEqual({ repaired: 4 });
    // Trust 6 and the bond 2 for each: 2 + 24 = 26, and −20 + 8 = −12.
    expect([trustOf(mateOf(amended, a)), bond(amended, a)]).toEqual([26, -12]);
    // The spring term begins at nine on Monday 4 January, the cast list with it; the dials alike a minute before.
    for (const s of [owed, amended]) { s.advanceTo(at(2027, 1, 4, 8, 59)); dials(s); s.advanceTo(at(2027, 1, 4, 9)); }
    // The same cast in both: she leads, the student doesn't.
    expect(owed.player.school!.around).toEqual(amended.player.school!.around);
    const list = owed.player.school!.around!.list;
    expect(list.find((x) => x.name === AMENDS_PARTNER)?.size).toBe('lead');
    expect(list.find((x) => x.name === 'You')?.size).not.toBe('lead');
    // A lead written for either, taken from the student: the shared cast's 10 less the lead's 12, −2 in each.
    expect([bond(owed, a), bond(amended, a)]).toEqual([-22, -14]);
    // castListRead: a rival's lead stings, 1.5 of stress at a default personality's gain of 1; the twin made right isn't stung.
    expect(owed.player.wellbeing.stress - amended.player.wellbeing.stress).toBeCloseTo(1.5, 9);
    // And the Casting tab's Around The Class says what she is to the student.
    const toYou = (s: Simulation) => {
      const { html } = drawn(s, 'casting');
      const from = html.indexOf('Around The Class');
      expect(from, 'the panel Around The Class').toBeGreaterThan(-1);
      const row = html.slice(from).match(new RegExp(`<tr><td>${AMENDS_PARTNER}</td>(.*?)</tr>`))?.[1];
      expect(row, 'her row in Around The Class').toBeDefined();
      return textOf(row!.match(/<td>([^<]*)<\/td>$/)?.[1] ?? 'none');
    };
    expect(toYou(owed)).toBe('Rival');
    expect(toYou(amended)).toBe('');
  });

  it('PLAYER JOURNEY: made right over the winter break, a partner kept faith with nine evenings and stood up once is a friend in the Carlotta Festival’s cast: on its first night castCompany lifts the mood a point for the twin who made amends, and none for the twin who didn’t', () => {
    const base = life('b07-c4');
    doTheWork(base);
    base.advanceTo(at(2026, 8, 28, 14));
    const a = actingI(base);
    expect(mateOf(base, a).name).toBe('Imani Patel');
    mateRecord(mateOf(base, a)).reliability = 1; // TEST SETUP: Imani comes when she says she will.
    // Ten evenings asked for at once, from Friday 28 August to Sunday 6 September, before the scene's due on the 8th.
    const evenings = [[8, 28], [8, 29], [8, 30], [8, 31], [9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6]] as const;
    for (const [month, day] of evenings) expect(ask(base, a.id, at(2026, month, day, 19)).accepted).toBe(true);
    // The first slept through from six for three hours; the other nine kept.
    base.advanceTo(at(2026, 8, 28, 18));
    go(base, 'life.sleep', { hours: 3 });
    base.advanceTo(at(2026, 8, 28, 22));
    tended(base, at(2026, 9, 7, 12));
    expect(work(base, a.id).rehearsals.map((r) => r.status)).toEqual(['missedByYou', ...Array(9).fill('kept')]);
    // Trust 50 − 12 + 9 × 4 = 74; the bond 0 − 5 + 9 × 2 = 13.
    expect([trustOf(mateOf(base, a)), bond(base, a)]).toEqual([74, 13]);
    tended(base, at(2027, 1, 3, 12));
    expect(bond(base, a)).toBe(13);
    expect((personOf(mateOf(base, a)).incidents ?? []).filter((x) => !x.repaired).map((x) => x.kind)).toEqual(['missed']);
    const owed = twinOf(base);
    const amended = twinOf(base);
    for (const s of [owed, amended]) doTheWork(s); // A twin is a load of the save: the work each midnight goes on being done.
    expect(go<{ repaired: number }>(amended, 'school.make_amends', { mate: a.partner })).toEqual({ repaired: 1 });
    expect(bond(amended, a)).toBe(15);
    for (const s of [owed, amended]) tended(s, at(2027, 1, 4, 10));
    // The spring's casting: the Carlotta Festival, the class in it together, neither the student nor Imani leading, so
    // the shared cast's 10 and nothing taken: 23 against 25, a friend from 25.
    for (const s of [owed, amended]) {
      expect(s.player.school!.casting).toMatchObject({ production: 'Carlotta Festival Of New Plays', size: 'supporting' });
      expect(s.player.school!.casting!.cast?.find((c) => c.name === 'Imani Patel')?.part).toBe('A Supporting Part In A New Play');
    }
    expect([bond(owed, a), bond(amended, a)]).toEqual([23, 25]);
    // The first night, Tuesday 4 May at eight; the dials alike a minute before.
    for (const s of [owed, amended]) { tended(s, at(2027, 5, 4, 19, 59)); dials(s); s.advanceTo(at(2027, 5, 4, 20)); }
    expect([owed.player.school!.casting!.performed, amended.player.school!.casting!.performed]).toEqual([1, 1]);
    // A friend in the cast is a point of mood to a person of ordinary need for company (1); none weighs nothing on her.
    expect(amended.player.wellbeing.morale - owed.player.wellbeing.morale).toBeCloseTo(1, 9);
    expect(amended.player.wellbeing.stress).toBe(owed.player.wellbeing.stress);
  });

  it('PLAYER JOURNEY: for an evening running lines slept through, gives back the 6 trust it took and 2 of the bond’s 3, in twenty minutes: the figures the CLASS.amends comment gives a rehearsal missed, which takes 12 and 5', () => {
    const sim = life('g18-probe');
    sim.advanceTo(at(2026, 9, 8, 15, 30));
    const m = momentsOf(cwOf(sim)).find((x) => x.status === 'open' && x.kind === 'study')!;
    expect(m).toMatchObject({ when: at(2026, 9, 9, 19) });
    const elena = () => sim.player.school!.classmates[m.mate]!;
    expect(elena().name).toBe('Elena Haddad');
    const trust0 = trustOf(elena());
    const bond0 = elena().bond ?? 0;
    expect(trust0).toBe(50);
    go(sim, 'school.respond', { momentId: m.id, choice: 'yes' });
    // Asleep from six on Wednesday for three hours, across the seven o'clock agreed.
    sim.advanceTo(at(2026, 9, 9, 18));
    go(sim, 'life.sleep', { hours: 3 });
    sim.advanceTo(at(2026, 9, 9, 21, 30));
    expect(sim.universe.scheduled.find((i) => i.kind === 'school.study_session' && i.payload.momentId === m.id)?.status).toBe('missed');
    expect([trustOf(elena()), (elena().bond ?? 0) - bond0]).toEqual([44, -3]);
    const t0 = sim.now;
    expect(go<{ repaired: number }>(sim, 'school.make_amends', { mate: m.mate })).toEqual({ repaired: 1 });
    expect(sim.now - t0).toBe(20 * 60_000);
    expect([trustOf(elena()), (elena().bond ?? 0) - bond0]).toEqual([50, -1]);
  });
});

// ---------------------------------------------------------------------------
// school.respond
// ---------------------------------------------------------------------------

describe('school.respond', () => {
  /** g18-c to the first class: the scene read, every answer at the table against the text, and Priya's other reading open. */
  function disagreed(): { sim: Simulation; id: string; m: Moment } {
    const sim = life('g18-c');
    sim.advanceTo(at(2026, 8, 28, 14));
    const a = actingI(sim);
    dials(sim);
    go(sim, 'school.prepare', { assignmentId: a.id, activity: 'read' });
    for (const { q, options } of questionsFor(a)) go(sim, 'school.choose', { assignmentId: a.id, question: q.id, option: options.find((o) => !o.supported)!.id });
    sim.advanceTo(at(2026, 8, 31, 15, 30));
    const m = momentsOf(cwOf(sim)).find((x) => x.status === 'open' && x.kind === 'disagreement')!;
    expect(m).toMatchObject({ mate: a.partner, question: 'obstacle', assignmentId: a.id });
    expect(mateOf(sim, a).name).toBe('Priya Reyes');
    return { sim, id: a.id, m };
  }

  it('PLAYER JOURNEY: a different reading brought the afternoon she withdraws is refused every answer as work that’s finished, and moves nothing, through a reload; a twin still at the School keeps hers, and the scene together is read apart', () => {
    const { sim, id, m } = disagreed();
    const stays = twinOf(sim);
    const mate = () => mateOf(sim, work(sim, id));
    const was = { trust: trustOf(mate()), bond: mate().bond ?? 0, answers: { ...work(sim, id).answers } };
    go(sim, 'school.withdraw', { confirm: true });
    expect(sim.player.school!.standing).toBe('withdrawn');
    // Her work lapses with the School; the moment, brought at nine, is still open until seven tomorrow.
    expect(work(sim, id).status).toBe('lapsed');
    expect(momentIn(sim, m.id)).toMatchObject({ status: 'open', until: at(2026, 9, 1, 7) });
    for (const choice of ['hold', 'theirs', 'both']) expect(no(sim, 'school.respond', { momentId: m.id, choice }), choice).toBe('That work is finished.');
    expect({ trust: trustOf(mate()), bond: mate().bond ?? 0, answers: work(sim, id).answers }).toEqual(was);
    expect(work(sim, id).readsApart).toBeUndefined();
    expect(work(sim, id).tryBoth).toBeUndefined();
    expect(no(reload(sim), 'school.respond', { momentId: m.id, choice: 'hold' })).toBe('That work is finished.');
    // The twin who stayed keeps her reading against the text: a point of trust, and the scene together read apart.
    expect(go<{ done: string }>(stays, 'school.respond', { momentId: m.id, choice: 'hold' }).done).toBe('You kept yours. Priya isn’t persuaded, and the text is on their side.');
    expect(trustOf(mateOf(stays, work(stays, id)))).toBe(was.trust - 1);
    expect(work(stays, id).readsApart).toBe('obstacle');
    expect(partnerReadOf(stays, stays.player, work(stays, id), '2026-09-08')!.agree).toBe(0.9);
  });

  it('DEFECT: a moment left unanswered when she withdraws lapses at its hour, as one does at the School, and the Coursework tab lists it as Not Answered rather than offering its answers', () => {
    const { sim, m } = disagreed();
    go(sim, 'school.withdraw', { confirm: true });
    // Past seven on Tuesday 1 September, the hour it was to be answered by.
    sim.advanceTo(at(2026, 9, 1, 8));
    expect(momentIn(sim, m.id).status).toBe('lapsed');
    expect(no(sim, 'school.respond', { momentId: m.id, choice: 'hold' })).toBe('It’s too late to answer: the moment passed.');
    const { text } = drawn(sim, 'moments');
    expect(buttons('school.respond', 'Keep Your Reading')).toEqual([]);
    expect(text).toContain('Priya Reyes: A Different Reading · Not Answered');
  });
});

// ---------------------------------------------------------------------------
// school.take_shift
// ---------------------------------------------------------------------------

describe('school.take_shift', () => {
  /** Yale's work-study rate for 2026–27, $23.00 an hour (the Bulletin's). */
  const HOURLY = 23_00;
  /** The second evening asked for, on Wednesday: Thursday 3 September, seven to eleven, the first free one after. */
  const SECOND_EVENING = at(2026, 9, 3, 19);
  const wages = (sim: Simulation) => Object.values(sim.universe.transactions).filter((t) => t.memo.startsWith('Work-study wages'));

  it('PLAYER JOURNEY: an evening booked on the Work-Study tab and called off by her withdrawal gives its four hours back, the tab says why it offers no more, and the payday pays only the evening worked, $92, onto the year’s return, where a twin who stayed is paid both', () => {
    const sim = life('g19-shift');
    tended(sim, at(2026, 8, 31, 12));
    expect(drawn(sim, 'work').text).toContain('Elective Hours Asked For 0');
    expect(press(buttons('school.take_shift', 'Take An Elective Shift')[0])).toEqual([`Front of house, ${formatDateTime(at(2026, 9, 1, 19), NY)}.`]);
    // Worked on Tuesday evening, four hours owed.
    tended(sim, at(2026, 9, 1, 23, 30));
    expect(sim.player.school!.workStudy).toMatchObject({ electiveHours: 4, owedHours: 4 });
    tended(sim, at(2026, 9, 2, 12));
    drawn(sim, 'work');
    expect(press(buttons('school.take_shift', 'Take An Elective Shift')[0])).toEqual([`Front of house, ${formatDateTime(SECOND_EVENING, NY)}.`]);
    expect(drawn(sim, 'work').text).toContain('Elective Hours Asked For 8');
    const stayed = twinOf(sim);
    // Withdrawn at noon on Thursday 3 September, the evening still ahead.
    tended(sim, at(2026, 9, 3, 12));
    go(sim, 'school.withdraw', { confirm: true });
    const electives = (s: Simulation) => s.universe.scheduled.filter((i) => i.kind === SHIFT_KIND && i.payload.personId === s.player.id && i.payload.elective === true).map((i) => [fmt(i.at), i.status]);
    expect(electives(sim)).toEqual([['2026-9-1 19:00', 'done'], [fmt(SECOND_EVENING), 'cancelled']]);
    // The evening never worked and never to be isn't asked for; the one worked is.
    expect(sim.player.school!.workStudy.electiveHours).toBe(4);
    const tab = drawn(sim, 'work');
    expect(tab.text).toContain('Elective Hours Asked For 4');
    expect(tab.text).toContain('You’re not at school.');
    expect(buttons('school.take_shift', 'Take An Elective Shift')).toEqual([]);
    expect(no(sim, 'school.take_shift')).toBe('You’re not at school.');
    // What was worked is still paid, a minute after: four hours, and nothing more by the next Friday.
    tended(sim, at(2026, 9, 12, 18));
    expect(wages(sim).map((t) => [t.memo.split(':')[0], t.postings.find((p) => p.accountId === sim.player.primaryAccountId)?.amount])).toEqual([['Work-study wages, 4 hours', 4 * HOURLY]]);
    expect(yearOf(sim.player, 2026).workStudy).toBe(4 * HOURLY);
    expect(figuresFor(sim.player, 2026).workStudy).toBe(4 * HOURLY);
    // The twin who stayed works the second evening and is paid both on Friday 4 September.
    tended(stayed, at(2026, 9, 4, 18));
    expect(wages(stayed).map((t) => t.memo.split(':')[0])).toEqual(['Work-study wages, 8 hours']);
    expect(yearOf(stayed.player, 2026).workStudy).toBe(8 * HOURLY);
  });
});

// ---------------------------------------------------------------------------
// practice.exercise
// ---------------------------------------------------------------------------

describe('practice.exercise', () => {
  /** g20-focus at ten on Sunday 6 September, as the first round found it: nothing wants her for the day. */
  const sunday = () => { const sim = life('g20-focus'); tended(sim, at(2026, 9, 6, 10)); return sim; };
  const still = (sim: Simulation) => [sim.now, developmentOf(sim.player).history.length, JSON.stringify(sim.player.experience?.exercises ?? {}), sim.player.wellbeing.energy];

  it('refuses a way of practicing there isn’t in its own words, and moves nothing: not the clock, the record, the experience or the energy', () => {
    const sim = sunday();
    dials(sim);
    const was = still(sim);
    expect(no(sim, 'practice.exercise', { exercise: 'sense-memory', focus: 'nonsense' })).toBe('There’s no such way to practice.');
    expect(still(sim)).toEqual(was);
    // The same hour, a way there is: taken.
    expect(go<{ gained: number }>(sim, 'practice.exercise', { exercise: 'sense-memory', focus: 'steady' }).gained).toBeGreaterThan(0);
  });

  it('takes every one of the 27 exercises as a variation through the command, each carrying over to something it doesn’t train: “nothing it carries over to” is never said', () => {
    const sim = sunday();
    expect(EXERCISES).toHaveLength(27);
    const nothing: string[] = [];
    for (const e of EXERCISES) {
      const one = twinOf(sim);
      dials(one); // TEST SETUP: rested, so an exercise on the feet isn't refused as tired.
      const r = one.execute<{ carried: { target: string; gained: number }[] }>({ kind: 'practice.exercise', payload: { exercise: e.id, focus: 'variation' } });
      expect(r.ok, `${e.id}: ${r.error}`).toBe(true);
      const carried = r.value!.carried;
      if (!carried.length || carried.some((c) => c.target === e.trains)) nothing.push(e.id);
      // What carried over is on the record under the exercise's own transfer.
      expect(developmentOf(one.player).history.filter((x) => x.source === `transfer:${e.id}`).map((x) => x.id), e.id).toEqual(carried.map((c) => c.target));
    }
    expect(nothing).toEqual([]);
  });

  it('PLAYER JOURNEY: withdrawn from the School, she keeps her fifteen classmates, so live and partnered work is still taken: “It takes a classmate, and you have no class to ask.” is never said', () => {
    const sim = sunday();
    go(sim, 'school.withdraw', { confirm: true });
    expect(sim.player.school!.standing).toBe('withdrawn');
    expect(sim.player.school!.classmates).toHaveLength(15);
    dials(sim);
    expect(go<{ carried: { target: string }[] }>(sim, 'practice.exercise', { exercise: 'sense-memory', focus: 'live' }).carried.map((c) => c.target)).toEqual(['listening', 'adaptability']);
    dials(sim);
    expect(go<{ gained: number }>(sim, 'practice.exercise', { exercise: 'repetition' }).gained).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// school.term
// ---------------------------------------------------------------------------

describe('school.term', () => {
  it('PLAYER JOURNEY: the second fall’s casting beside a Rep understudy, reached in order by the clock, numbers the thirteen rehearsals it keeps 1 to 13, read-through first and the technical and dress last, where a twin with no Rep keeps all twenty; every call kept, the process is complete at 13 of 13', () => {
    const sim = life('g20-term');
    doTheWork(sim);
    tended(sim, at(2027, 8, 23, 8));
    expect(sim.player.school!).toMatchObject({ standing: 'good', termsBegun: 2 });
    const noRep = twinOf(sim);
    noRep.player.school!.standing = 'concern'; // TEST SETUP: out of good standing before the term, so the Rep doesn't cast her.
    for (const s of [sim, noRep]) tended(s, at(2027, 8, 23, 10));
    const school = sim.player.school!;
    expect(school.termsBegun).toBe(3);
    expect(school.casting).toMatchObject({ production: 'Directors’ Thesis Production I', play: 'Ghosts', term: 2 });
    expect(school.rep).toMatchObject({ kind: 'understudy', term: 2 });
    expect(noRep.player.school!.rep).toBeUndefined();
    expect(noRep.player.school!.casting).toMatchObject({ production: 'Directors’ Thesis Production I', play: 'Ghosts' });
    const calls = (s: Simulation, which: 'school' | 'rep') => s.universe.scheduled
      .filter((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.personId === s.player.id && i.payload.call === 'rehearsal' && (which === 'rep') === (i.payload.which === 'rep'))
      .sort((x, y) => x.at - y.at);
    // Thesis I opens on Saturday 9 October 2027: five weeks of Tuesdays to Fridays before it, from 7 September, twenty days.
    const twenty = [7, 8, 9, 10, 14, 15, 16, 17, 21, 22, 23, 24, 28, 29, 30].map((d) => `2027-9-${d} 15:00`).concat([1, 5, 6, 7, 8].map((d) => `2027-10-${d} 15:00`));
    expect(calls(noRep, 'school').map((c) => fmt(c.at))).toEqual(twenty);
    expect(calls(noRep, 'school').map((c) => [c.payload.n, c.payload.of])).toEqual(twenty.map((_, i) => [i + 1, 20]));
    // The Rep's October production opens on the first Friday, 1 October: an understudy rehearses Wednesdays and Fridays at
    // three until the day before, from the term's first week. Those seven of Thesis I's days give way to it.
    const rep = calls(sim, 'rep').map((c) => fmt(c.at));
    expect(rep).toEqual(['2027-8-25 15:00', '2027-8-27 15:00', '2027-9-1 15:00', '2027-9-3 15:00', '2027-9-8 15:00', '2027-9-10 15:00', '2027-9-15 15:00', '2027-9-17 15:00', '2027-9-22 15:00', '2027-9-24 15:00', '2027-9-29 15:00']);
    const ours = calls(sim, 'school');
    const kept = twenty.filter((d) => !rep.includes(d));
    expect(kept).toHaveLength(13);
    expect(ours.map((c) => fmt(c.at))).toEqual(kept);
    // Numbered on the calls kept, 1 to 13 of 13: the read-through, two fifths of 13 rounded (5) less it blocking, the rest
    // work-throughs, and the last two the technical and the dress.
    expect(ours.map((c) => [c.payload.n, c.payload.of])).toEqual(kept.map((_, i) => [i + 1, 13]));
    expect(ours.map((c) => c.payload.stage)).toEqual(['read', 'blocking', 'blocking', 'blocking', 'blocking', 'work', 'work', 'work', 'work', 'work', 'work', 'tech', 'dress']);
    // From 1 October the Rep's nights on call begin at five for an eight o'clock curtain: those rehearsals end at eight.
    expect(ours.map((c) => c.durationMinutes)).toEqual([...Array(8).fill(360), ...Array(5).fill(300)]);
    // Every call kept by the clock to the dress: thirteen of thirteen, and what thirteen calls make is complete.
    tended(sim, at(2027, 10, 8, 23));
    const p = processOf(school.casting!);
    expect([p.calls, p.of]).toEqual([13, 13]);
    expect(p.lines).toBeCloseTo(1 - 0.88 ** 13, 12);
    // Blocking set at the four blocking calls and the technical.
    expect(p.blocking).toBeCloseTo(1 - 0.75 ** 5, 12);
    expect(completeFor(school.casting!)).toMatchObject({ lines: expect.closeTo(1 - 0.88 ** 13, 12), blocking: expect.closeTo(1 - 0.75 ** 5, 12) });
  });
});
