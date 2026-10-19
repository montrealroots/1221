/**
 * The school's remaining items of 2026-10-16 (docs/verification/integration-2026-10-16/prompts/school.md), each in
 * docs/verification/remaining/school-checklist.json before any code changed:
 *
 * - `repeatRoom`'s leave branch, played: Acting I called in sick through Fall Term 2026 leaves Incompletes, a medical
 *   leave begins with Spring Term 2027, each Incomplete extended once runs out on 9 February 2027 during it, and each
 *   Permanent Incomplete's notice offers the year's end, which `repeatRefusal` grants back in Spring Term 2028. The branch
 *   decides nothing a played leave reaches (a leave is granted only for two terms, and on one the count without the
 *   branch is a term more, still within the nine): a mutation removing it survives the journey, and a GUARD on a
 *   three-term leave (TEST SETUP: the length set by hand, which `leaveLengths` refuses today) kills it. The Bulletin lets
 *   a student on leave complete work in courses whose deadline was extended (2026–27 p.158, item 5): played, a twin makes
 *   one up on the leave.
 * - Every other refusal of the school system that no test reached (47 of 159 found by their words in no test on
 *   2026-10-16): each reachable one played, each that only a command sent by hand reaches tested as a GUARD. Two were
 *   wrong, and fixed: a dean's leave granted from the next term drew Call Off The Leave… and was called off, its appeal
 *   wasn't on the screen, and an appeal decided before it began was turned down “The term it began in is over.”, of a
 *   term that hadn't begun.
 * - Continuity: two lives played from creation twice, straight and reloaded at every boundary (each term's start and
 *   evaluation, the leave, the Permanent Incompletes, the repeat, the aid office, the conversion, Commencement; and a
 *   last year's Fail, its additional term, the retake failed and the degree withheld). At each boundary what earlier
 *   ones settled is unchanged but by its rule, and at the end the twins are the same life: the course record, the
 *   reviews, the credits, the work-study and its conversion, the aid, the ledger, every notice once.
 * - No dead end: a Fail or a Permanent Incomplete whose year can't be repeated (any after a repeat granted) now names the
 *   additional term the last year's end will offer, played to that offer and its button pressed; a dismissal and a
 *   withheld degree say what still stands, and the practice they name is pressed after.
 * - Yale's policy against SLATE's design: what the guide and the screen say of each rule, read against the 2026–2027
 *   Bulletin (read 2026-10-16), with the corrections asserted.
 * - From 2026-10-17 (brief 11's defect.yale-credit-hold): a credit that clears a held Yale account lifts the hold, played
 *   on sc-x3's third year with a medical leave's tuition rebate and, on a term begun under the hold, its fee refunded and
 *   its tuition rebated; a credit that leaves something owed keeps it; an older save's hold kept over nothing owed is
 *   lifted on opening.
 *
 * Every figure is worked here from the rules' own numbers and written as a literal, never asked of the engine's helper:
 * the Bulletin's nine semesters; a leave of two terms; five of Yale's working days to a decision; thirty days for an
 * Incomplete and thirty more extended. No band, take or overall is typed here: the judge was being changed in another
 * checkout on 2026-10-16, and nothing asserted reads one but through the record.
 *
 * PLAYER JOURNEYS: new lives (`createSave` with `newLifeConfig`), Ada Cole, born in New York, at Yale in New Haven from
 * Monday 24 August 2026, played by the clock through the commands the screens send, and through the School screen
 * rendered as the player has it (react-dom/server), its buttons pressed by their own handlers. A course is failed as a
 * player fails one, by sleeping through its meetings (`life.sleep` at one in the morning for ten hours), as
 * tests/scope-school.test.ts fails one. Seeds are arbitrary: rr-lv1 and ur-1 (Scraping), ap-late, and the scope tests'
 * own g26-l3, sc-x3 and sc-dq.
 *
 * TEST SETUP, said again where it's done: the coursework prepared each midnight and the student rested, fed and awake
 * each time the clock moves, as tests/scope-school.test.ts plays one; the flu on a day called in sick and before a
 * medical leave, as illness comes by the draw; two stays in hospital put on the care log, as admissions make them; the
 * hospital, an injury, the flu or a low condition at a moment a refusal reads it; the Scraping family, as creation's
 * select gives it; a three-term leave's length and a deadline's item called off, where only a guard is reached; and a
 * hold put back over nothing owed, as a build before 2026-10-17 left one.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, type Instant } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { PREP_DIMS, templateById } from '@/engine/content/coursework';
import { courseworkOf, persistentFor } from '@/engine/systems/coursework';
import { momentsOf } from '@/engine/systems/classmates';
import { healthOf } from '@/engine/systems/health';
import { CALL_KIND, CLASSES_KIND, SHIFT_KIND, TERM_KIND, cabaretWeek, classPeriod, coursesOn, isClassDay, keyOf, termStart } from '@/engine/systems/school';
import { APPEAL_KIND, LEAVE_NOTICE_KIND, accountOwed, enrolledTerms } from '@/engine/systems/leave';
import type { SchoolDate } from '@/engine/content/school';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; label: string; title?: string; disabled: boolean; onClick?: () => void }[],
  tab: 'standing' as string,
}));

// The School screen's kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/school' ? h.tab : initial) as T, () => undefined] as const };
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

const { RepeatPanel, LeavePanel } = await import('@/ui/components/StudyPlanPanels');
const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');

// ---------------------------------------------------------------------------
// The lives, the clock and the screen
// ---------------------------------------------------------------------------

const ZONE = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, ZONE);
const onDay = (d: SchoolDate, hour: number): Instant => instantFromZoned({ ...d, hour }, ZONE);
const plusDays = (d: SchoolDate, days: number): SchoolDate => { const t = new Date(Date.UTC(d.year, d.month - 1, d.day + days)); return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() }; };

/** TEST SETUP: the work done each midnight, every open piece's every part prepared. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
const ADA = { homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' };
/** TEST SETUP: the Scraping family, as creation's select gives it (family unset, wealth 'scraping'). */
const SCRAPING = { family: undefined, wealth: 'scraping' };
const life = (seed: string, extra: Record<string, unknown> = {}) => working(createSave(1, seed, { ...newLifeConfig(), ...ADA, ...extra }));
const freeze = (sim: Simulation): string => serialise(sim.universe);
const thaw = (snap: string): Simulation => working(loadSave(deserialise(snap)));
const reload = (sim: Simulation) => thaw(freeze(sim));
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
/** TEST SETUP: the flu, as illness comes by the draw. */
const flu = (sim: Simulation) => { healthOf(sim.player).fluUntil = sim.now + MS_DAY; };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);
const refused = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => sim.execute({ kind, payload }).error;

/** A screen as the player has it: its markup and its words, every tooltip taken out first; the Gated buttons it drew are in `h.clicks`. */
function drawn(sim: Simulation, screen: FunctionComponent, tab = 'standing'): { html: string; text: string } {
  h.sim = sim;
  h.tab = tab;
  h.clicks = [];
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  return { html, text: html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
}
const drew = (feature: string) => h.clicks.filter((c) => c.feature === feature);

function classDays(term: number): SchoolDate[] {
  const p = classPeriod(term);
  const out: SchoolDate[] = [];
  for (let d = p.from; keyOf(d) <= keyOf(p.to); d = plusDays(d, 1)) if (isClassDay(term, d)) out.push(d);
  return out;
}
const workDue = (sim: Simulation, d: SchoolDate, except: string) => (courseworkOf(sim, sim.player)?.assignments ?? [])
  .some((a) => a.course !== except && ((a.status === 'open' && a.dueOn === keyOf(d)) || (a.status === 'revising' && a.revision?.dueOn === keyOf(d))));
const expectedAt = (sim: Simulation, from: Instant, to: Instant) => sim.universe.scheduled
  .some((i) => i.status === 'pending' && i.requiresPlayer && i.kind !== CLASSES_KIND && i.at < to && i.at + (i.durationMinutes ?? 0) * 60_000 > from);
/**
 * Asleep from one in the morning to eleven, by the command a player uses, on as many of a course's meetings in a term as
 * asked, as tests/scope-school.test.ts sleeps through them: days with other work due, or anything else to be at, passed over.
 */
function sleepThrough(sim: Simulation, term: number, code: string, times: number, offset = 0): string[] {
  const missed: string[] = [];
  for (const d of classDays(term)) {
    if (missed.length >= times || onDay(d, 1) < sim.now || !coursesOn(d, offset).some((x) => x.code === code)) continue;
    tend(sim, onDay(d, 1));
    if (workDue(sim, d, code) || expectedAt(sim, onDay(d, 1), onDay(d, 11))) continue;
    sim.must({ kind: 'life.sleep', payload: { hours: 10 } });
    missed.push(keyOf(d));
  }
  return missed;
}
/** Every other one of a course's meetings in a term, from the first, called in sick (TEST SETUP: the flu), as many as asked. */
function callInSick(sim: Simulation, term: number, code: string, times: number, offset = 0): number {
  let called = 0;
  for (const [i, d] of classDays(term).filter((x) => coursesOn(x, offset).some((c) => c.code === code)).entries()) {
    if (i % 2 === 1 || called >= times) continue;
    tend(sim, onDay(d, 8));
    flu(sim);
    sim.must({ kind: 'school.call_in_sick', payload: {} });
    called += 1;
  }
  return called;
}

// ---------------------------------------------------------------------------
// A journey played as a list of steps, straight or reloaded at its boundaries, and what each boundary leaves settled
// ---------------------------------------------------------------------------

interface Step { label: string; at: Instant; boundary?: boolean; act?: (sim: Simulation) => void }

/** What a boundary leaves settled: the courses with a result, the reviews, the credits, the conversions, the leaves, the repeat. */
function settled(sim: Simulation) {
  const s = sim.player.school!;
  return {
    courses: Object.fromEntries(Object.entries(s.courses ?? {}).filter(([, r]) => r.result !== undefined).map(([k, r]) => [k, { ...r }])),
    history: s.history.map((r) => ({ ...r })),
    credits: (s.credits ?? []).map((c) => ({ ...c })),
    converted: { ...(s.convertedHours ?? {}) },
    excused: { ...(s.excusedHours ?? {}) },
    enrolled: [...enrolledTerms(s)],
    leaves: (s.leaves ?? []).map((l) => `${l.id}:${l.status}`),
    repeatedYears: [...(s.repeatedYears ?? [])],
  };
}
type Settled = ReturnType<typeof settled>;
/** Every notice told, by its id, as it was first told (the log brings an unread one said again in the same words up to now). */
interface Told { log: Map<string, { at: Instant; category: string; title: string; body: string }> }
interface Journey { sim: Simulation; marks: Record<string, string>; settled: { label: string; was: Settled }[]; told: Told }

/**
 * Read at every step: the save keeps its latest 500 notices (`settleNotices`), which a life of five years passes, so
 * whether each comes once is read as it comes, not from the save at the end.
 */
function hear(sim: Simulation, told: Told): void {
  for (const n of sim.universe.notifications) {
    const was = told.log.get(n.id);
    if (!was) told.log.set(n.id, { at: n.at, category: n.category, title: n.title, body: n.body });
  }
}

function journey(seed: string, extra: Record<string, unknown>, steps: readonly Step[], reloads: boolean): Journey {
  let sim = life(seed, extra);
  const marks: Record<string, string> = {};
  const kept: { label: string; was: Settled }[] = [];
  const told: Told = { log: new Map() };
  for (const step of [...steps].sort((a, b) => a.at - b.at)) {
    tend(sim, step.at);
    step.act?.(sim);
    hear(sim, told);
    if (!step.boundary) continue;
    kept.push({ label: step.label, was: settled(sim) });
    marks[step.label] = freeze(sim);
    if (reloads) sim = reload(sim);
  }
  return { sim, marks, settled: kept, told };
}
/**
 * The notices of a journey as heard, in order. Until later on 2026-10-16 the tax system's were left out: these journeys
 * found that a save opened from May to December 2027 on journey A had the IRS's substitute return for 2026 put on its
 * calendar by `armCollection` (systems/taxreturn.ts), which read the return's whole balance, Connecticut's part with it,
 * where the deadline itself (`TAX_SFR_KIND`'s scheduling at the due date) reads the IRS's part alone, $0 here; so the
 * reloaded twin alone was told on 14 April 2028 “The IRS Figured Your 2026 Return … $0.00”, and assessed $0.00 in August.
 * Fixed that day outside the school's area (tests/integration-tax-reload.test.ts), and the tax system's notices compared
 * here since.
 */
const heard = (j: Journey) => [...j.told.log.values()].map((n) => `${n.at} ${n.category} ${n.title}: ${n.body}`);
const heardTitled = (j: Journey, title: string) => [...j.told.log.values()].filter((n) => n.title === title);

/**
 * What a later boundary may have done to what an earlier one settled, by rule: an Incomplete made up (a pass, `make_up`)
 * or run out (a Permanent Incomplete, `INCOMPLETE_DUE_KIND`), its sessions and its deadline with it; a record's
 * `academic` and every other field as it was. Reviews and credits are only added to; conversions only grow.
 */
function expectKept(before: Settled, after: Settled, where: string): void {
  for (const [key, r] of Object.entries(before.courses)) {
    const now = after.courses[key];
    expect(now, `${where}: ${key} kept`).toBeDefined();
    if (r.result === 'incomplete' && now!.result !== 'incomplete') {
      expect(['pass', 'permanent'], `${where}: ${key}`).toContain(now!.result);
      const { result: _a, why: _b, madeUp: _c, dueBy: _d, extended: _e, ...rest } = now!;
      const { result: _f, why: _g, madeUp: _h, dueBy: _i, extended: _j, ...was } = r;
      expect(rest, `${where}: ${key}`).toEqual(was);
    } else if (r.result === 'incomplete') {
      const { madeUp: _c, dueBy: _d, extended: _e, ...rest } = now!;
      const { madeUp: _h, dueBy: _i, extended: _j, ...was } = r;
      expect(rest, `${where}: ${key}`).toEqual(was);
    } else expect(now, `${where}: ${key}`).toEqual(r);
  }
  expect(after.history.slice(0, before.history.length), `${where}: the reviews`).toEqual(before.history);
  expect(after.credits.slice(0, before.credits.length), `${where}: the credits`).toEqual(before.credits);
  for (const [year, hours] of Object.entries(before.converted)) expect(after.converted[year], `${where}: converted ${year}`).toBeGreaterThanOrEqual(hours);
  for (const [year, hours] of Object.entries(before.excused)) expect(after.excused[year], `${where}: excused ${year}`).toBeGreaterThanOrEqual(hours);
  expect(after.leaves.slice(0, before.leaves.length), `${where}: the leaves`).toEqual(before.leaves);
  expect(after.repeatedYears.slice(0, before.repeatedYears.length), `${where}: the repeats`).toEqual(before.repeatedYears);
}

/** The whole life, for twins: the school's record, the ledger and every notice. */
function lifeOf(sim: Simulation) {
  const s = sim.player.school!;
  return {
    standing: s.standing, endedAt: s.endedAt, classOf: s.classOf, offset: s.offset, courses: s.courses, history: s.history, credits: s.credits,
    workStudy: s.workStudy, converted: s.convertedHours, excused: s.excusedHours, enrolled: enrolledTerms(s), leaves: s.leaves, repeat: s.repeat,
    extra: s.extra, aidReview: s.aidReview, hold: s.hold, lateFees: s.lateFees,
    // The coursework (its pieces, the classmates' moments, the notes, the term's warnings) and the class as the student
    // has them, trust and bond: what a reload could touch beside the record.
    coursework: (s as typeof s & { coursework?: unknown }).coursework, classmates: s.classmates,
    ledger: sim.universe.transactions.map((t) => `${t.at} ${t.memo} ${t.postings.map((p) => `${p.accountId}:${p.amount}`).join(',')}`),
    // Every notice, the tax system's with them since `armCollection` was fixed later on 2026-10-16 (`heard`).
    notices: sim.universe.notifications.map((n) => `${n.at} ${n.category} ${n.title}: ${n.body}`),
  };
}

// ---------------------------------------------------------------------------
// Journey A: Incompletes, a medical leave they run out in, the year repeated, the aid office, a conversion, the degree
// ---------------------------------------------------------------------------

const ACTING_I = 'DRAM 103a/b';
/** A term's start, at noon, and its evaluation, an hour after five on its classes' last day: each a boundary, with what's done there. */
const termSteps = (term: number, begins?: (sim: Simulation) => void, evaluated?: (sim: Simulation) => void): Step[] => [
  { label: `term ${term} begins`, at: onDay(termStart(term).date, 12), boundary: true, ...(begins ? { act: begins } : {}) },
  { label: `term ${term} evaluated`, at: onDay(classPeriod(term).to, 18), boundary: true, ...(evaluated ? { act: evaluated } : {}) },
];
const payOwed = (sim: Simulation) => { if (accountOwed(sim, sim.player) > 0) sim.must({ kind: 'school.pay_balance', payload: {} }); };
const incompletes = (sim: Simulation) => Object.entries(sim.player.school!.courses ?? {}).filter(([, r]) => r.result === 'incomplete');

/**
 * rr-lv1, Scraping: Acting I's Monday-to-Wednesday meetings of Fall Term 2026 called in sick every other one, eleven
 * (TEST SETUP: the flu each time), so the fall's evaluation of Friday 11 December leaves Incompletes; a medical leave asked
 * on Monday 14 December (TEST SETUP: the flu, for the physician's recommendation), of two terms from the spring, the only
 * length a spring's leave is granted; each Incomplete extended once that day, to Tuesday 9 February 2027 at five, inside
 * the leave; notice of return on 1 March 2027; back for Spring Term 2028 and registered; the year asked to be repeated at
 * its end and the aid office asked once the repeat is granted; the repeated fall's first assigned Saturday called in sick
 * and its hours asked to be converted; then on to Commencement 2031.
 */
const A_STEPS: readonly Step[] = [
  ...[0, 1, 2].flatMap((t) => termSteps(t)),
  { label: 'fall 2026 called in sick', at: at(2026, 8, 30, 0), act: (sim) => { expect(callInSick(sim, 0, ACTING_I, 11)).toBe(11); } },
  {
    label: 'leave asked', at: at(2026, 12, 14, 10), boundary: true,
    act: (sim) => {
      flu(sim);
      sim.must({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness', terms: 2 } });
      for (const [key] of incompletes(sim)) sim.must({ kind: 'school.extend_incomplete', payload: { key } });
    },
  },
  { label: 'leave decided', at: at(2026, 12, 22, 12), boundary: true },
  { label: 'permanent', at: at(2027, 2, 9, 18), boundary: true },
  { label: 'notice given', at: at(2027, 3, 1, 10), boundary: true, act: (sim) => { sim.must({ kind: 'school.return_notice', payload: {} }); } },
  ...termSteps(3, (sim) => { sim.must({ kind: 'school.reregister', payload: {} }); }, (sim) => { sim.must({ kind: 'school.request_repeat', payload: {} }); }),
  { label: 'repeat decided', at: at(2028, 5, 8, 12), boundary: true, act: (sim) => { sim.must({ kind: 'school.request_aid_review', payload: {} }); } },
  { label: 'aid decided', at: at(2028, 5, 20, 12), boundary: true },
  ...termSteps(4, payOwed),
  {
    label: 'a Saturday called in sick', at: at(2028, 9, 4, 12),
    act: (sim) => {
      const sat = pendingOf(sim, SHIFT_KIND).filter((i) => i.payload.elective === false)[0]!;
      tend(sim, sat.at - 2 * MS_HOUR);
      flu(sim);
      sim.must({ kind: 'school.call_in_sick', payload: {} });
    },
  },
  { label: 'conversion asked', at: at(2028, 12, 14, 12), boundary: true, act: (sim) => { sim.must({ kind: 'school.request_conversion', payload: {} }); } },
  { label: 'conversion processed', at: at(2029, 1, 16, 12), boundary: true },
  ...[5, 6, 7, 8, 9].flatMap((t) => termSteps(t, payOwed)),
  { label: 'before commencement', at: at(2031, 5, 1, 12), boundary: true },
  { label: 'commencement', at: at(2031, 5, 19, 14), boundary: true },
  { label: 'after', at: at(2031, 6, 2, 12), boundary: true },
];
const journeyA = once(() => journey('rr-lv1', SCRAPING, A_STEPS, false));
const journeyAReloaded = once(() => journey('rr-lv1', SCRAPING, A_STEPS, true));

// ---------------------------------------------------------------------------
// Journey B: a last year's Fail, its additional term, the retake failed, the degree withheld
// ---------------------------------------------------------------------------

const MOVEMENT_III = 'DRAM 373a';
/**
 * g26-l3 (tests/evidence-g26-school.test.ts's seed, the scope tests' too), its family the one a new life is given:
 * Movement Invention III (Wednesdays) slept through four times in Fall Term 2028, failed at its evaluation; the last
 * spring's evaluation offers thirty days; an additional term asked for on the Monday after; its tuition paid; the retake
 * slept through four times again; withheld at its evaluation.
 */
const B_STEPS: readonly Step[] = [
  ...[0, 1, 2, 3, 4, 5].flatMap((t) => termSteps(t)),
  { label: 'movement slept through', at: at(2028, 9, 1, 0), act: (sim) => { expect(sleepThrough(sim, 4, MOVEMENT_III, 4)).toHaveLength(4); } },
  { label: 'extra asked', at: at(2029, 4, 30, 10), boundary: true, act: (sim) => { sim.must({ kind: 'school.request_extra_term', payload: {} }); } },
  { label: 'extra decided', at: at(2029, 5, 8, 12), boundary: true },
  ...termSteps(6, payOwed),
  { label: 'the retake slept through', at: at(2029, 9, 1, 0), act: (sim) => { expect(sleepThrough(sim, 6, MOVEMENT_III, 4, 2)).toHaveLength(4); } },
  { label: 'after', at: at(2030, 1, 31, 12), boundary: true },
];
const journeyB = once(() => journey('g26-l3', {}, B_STEPS, false));
const journeyBReloaded = once(() => journey('g26-l3', {}, B_STEPS, true));

const OFFERED = ' At the year’s end, you can ask to repeat the year on the Standing tab.';
const permanentBody = (name: string, tail: string) => `The time to make it up ran out, so ${name} carries no credit, and the degree can’t be completed without it.${tail}`;

// ---------------------------------------------------------------------------
// school.repeat-room-leave
// ---------------------------------------------------------------------------

describe('school.repeat-room-leave: `repeatRoom`’s leave branch', () => {
  it('PLAYER JOURNEY: Incompletes extended past a medical leave’s start run out on 9 February 2027 during it, each Permanent Incomplete’s notice offers the year’s end, once through a reload, and back in Spring Term 2028 the year’s end grants the repeat for them', () => {
    const a = journeyA();
    // The fall's evaluation, Friday 11 December at five: Incompletes, each due thirty days on, Sunday 10 January 2027 at five.
    const fall = thaw(a.marks['term 0 evaluated']!);
    const owed = incompletes(fall);
    expect(owed.length).toBeGreaterThan(0);
    expect(owed.map(([k]) => k)).toContain(`0:${ACTING_I}`);
    for (const [, r] of owed) expect(r.dueBy).toBe(at(2027, 1, 10, 17));
    // Asked on Monday 14 December: two terms from the spring; each Incomplete extended once by thirty days, to Tuesday 9
    // February 2027 at five.
    const asked = thaw(a.marks['leave asked']!);
    expect(asked.player.school!.leave).toMatchObject({ kind: 'medical', status: 'pending', firstTerm: 1, returnTerm: 3, terms: 2 });
    for (const [, r] of incompletes(asked)) expect(r).toMatchObject({ extended: true, dueBy: at(2027, 2, 9, 17) });
    // The leave begins with Spring Term 2027, Monday 4 January: the Incompletes still running, their deadlines kept.
    const begun = thaw(a.marks['term 1 begins']!);
    expect(begun.player.school!.leave).toMatchObject({ status: 'on', firstTerm: 1, returnTerm: 3 });
    expect(begun.player.school!.offset).toBe(2);
    expect(incompletes(begun).map(([k]) => k).sort()).toEqual(owed.map(([k]) => k).sort());
    // On the leave, at five on 9 February 2027: each Permanent, its notice offering the year's end. Counted by hand as
    // the year's end will count it: one term enrolled (Fall Term 2026), the year's two again, the program's four after
    // its spring, and its spring still to take on return: 8, within the Bulletin's nine.
    const perm = thaw(a.marks.permanent!);
    expect(perm.player.school!.leave!.status).toBe('on');
    const names = owed.map(([, r]) => r.name).sort();
    const told = (sim: Simulation) => sim.universe.notifications.filter((n) => n.title.startsWith('Permanent Incomplete: ')).map((n) => [n.at, n.title, n.body]).sort();
    expect(told(perm)).toEqual(names.map((name) => [at(2027, 2, 9, 17), `Permanent Incomplete: ${name}`, permanentBody(name, OFFERED)]).sort());
    const again = reload(perm);
    tend(again, at(2027, 2, 12, 12));
    expect(told(again)).toEqual(told(perm));
    // Back for Spring Term 2028, registered, played to its evaluation of Friday 28 April 2028: the Standing tab offers the
    // repeat the notices told of, and it's granted for those courses.
    const back = thaw(a.marks['term 3 begins']!);
    expect(back.player.school!.leaves!.map((l) => l.status)).toEqual(['returned']);
    tend(back, at(2028, 4, 28, 18));
    expect(enrolledTerms(back.player.school!)).toEqual([0, 3]);
    expect(drawn(back, RepeatPanel).text).toContain('Ask To Repeat The Year…');
    // Five of Yale's working days from Friday 28 April at six: Friday 5 May at six.
    expect(back.must<{ decideAt: Instant }>({ kind: 'school.request_repeat', payload: {} }).decideAt).toBe(at(2028, 5, 5, 18));
    const decided = thaw(a.marks['repeat decided']!);
    expect(decided.player.school!.repeat).toMatchObject({ status: 'granted', year: 1, terms: [0, 3], decidedAt: at(2028, 5, 5, 18) });
    expect([...decided.player.school!.repeat!.courses].sort()).toEqual(names);
    expect(decided.player.school).toMatchObject({ offset: 4, repeatedYears: [1] });
  }, 600_000);

  it('PLAYER JOURNEY: the Bulletin lets a student on leave complete work whose deadline was extended (2026–27 p.158): a twin makes Acting I’s session up on the leave, and it passes, with no Permanent Incomplete for it and nothing left on the calendar', () => {
    const sim = thaw(journeyA().marks['term 1 begins']!);
    const key = `0:${ACTING_I}`;
    expect(sim.player.school!.leave!.status).toBe('on');
    tend(sim, at(2027, 1, 20, 10));
    const r = sim.must<{ madeUp: number; owed: number; passed: boolean }>({ kind: 'school.make_up', payload: { key } });
    expect(r.passed).toBe(true);
    expect(sim.player.school!.courses![key]).toMatchObject({ result: 'pass', why: 'made up after an Incomplete' });
    expect(sim.universe.scheduled.filter((i) => i.kind === 'school.incomplete_due' && i.status === 'pending' && i.payload.key === key)).toHaveLength(0);
    tend(sim, at(2027, 2, 12, 12));
    expect(titled(sim, 'Permanent Incomplete: Acting I')).toHaveLength(0);
    expect(sim.player.school!.courses![key]!.result).toBe('pass');
  }, 600_000);

  it('GUARD: on a three-term leave, which the Bulletin allows (2026–27 p.158) and `leaveLengths` refuses while every year has year-long courses (TEST SETUP: the granted leave’s length set to three before it begins), the Permanent Incomplete offers the year’s end, counted 8 as the year’s end will count it; without the leave branch the count is 10', () => {
    const sim = thaw(journeyA().marks['leave decided']!);
    const l = sim.player.school!.leave!;
    expect(l).toMatchObject({ status: 'granted', firstTerm: 1, terms: 2 });
    l.terms = 3;
    l.returnTerm = l.firstTerm + 3;
    tend(sim, at(2027, 2, 10, 12));
    expect(sim.player.school!.leave).toMatchObject({ status: 'on', returnTerm: 4 });
    expect(sim.player.school!.offset).toBe(3);
    // One enrolled, the year's two again, the program's four after its spring, its spring still to take: 8.
    expect(titled(sim, 'Permanent Incomplete: Acting I').map((n) => n.body)).toEqual([permanentBody('Acting I', OFFERED)]);
  }, 600_000);
});

// ---------------------------------------------------------------------------
// school.d-appeal-before-begun
// ---------------------------------------------------------------------------

/**
 * ap-late: two stays in hospital in the fall's last weeks (TEST SETUP: put on the care log, 22 November and 5 December,
 * as admissions make them), a sick day called on Wednesday 9 December (TEST SETUP: the flu) brings Yale Health's
 * assessment on Friday 11 December at nine, which the student sleeps through, a ground of its own; the dean decides on
 * Monday 14 December at nine, after the fall's evaluation, so the leave runs from Spring Term 2027.
 */
const deanLate = once(() => {
  const sim = life('ap-late');
  tend(sim, at(2026, 12, 9, 8));
  (healthOf(sim.player).careLog ??= []).push({ at: at(2026, 11, 22, 12), care: 'stay' } as never, { at: at(2026, 12, 5, 12), care: 'stay' } as never);
  flu(sim);
  sim.must({ kind: 'school.call_in_sick', payload: {} });
  tend(sim, at(2026, 12, 9, 12));
  expect(sim.player.school!.welfare).toMatchObject({ status: 'scheduled', assessAt: at(2026, 12, 11, 9), trigger: '2 stays in hospital in 28 days' });
  tend(sim, at(2026, 12, 11, 8, 59));
  sim.must({ kind: 'life.sleep', payload: { hours: 3 } });
  tend(sim, at(2026, 12, 14, 12));
  return freeze(sim);
});

describe('school.d-appeal-before-begun: a dean’s leave granted from the next term', () => {
  it('DEFECT: its panel draws Appeal To The Dean and no Call Off The Leave…, the cancel is refused in words that name the appeal, and the appeal, the student cleared, overturns it before it begins: Spring Term 2027 begins and enrolls her, once through a reload (until 2026-10-16 the cancel was taken and the appeal turned down “The term it began in is over.”)', () => {
    let sim = thaw(deanLate());
    const l = sim.player.school!.leave!;
    expect(l).toMatchObject({ status: 'granted', kind: 'medical', firstTerm: 1, returnTerm: 3, decidedAt: at(2026, 12, 14, 9) });
    expect(l.mandatory).toMatchObject({ why: 'You didn’t come to the assessment, which the Bulletin names as a ground of its own.', appealBy: at(2026, 12, 21, 9) });
    expect(titled(sim, 'A Medical Leave, By The Dean’s Decision').map((n) => n.at)).toEqual([at(2026, 12, 14, 9)]);
    const panel = drawn(sim, LeavePanel);
    expect(panel.text).toContain('Imposed by the dean on Yale Health’s recommendation, from Spring Term 2027');
    expect(panel.text).not.toContain('Call Off The Leave…');
    expect(refused(sim, 'school.cancel_leave', { confirm: true })).toBe('The dean imposed this leave, so it isn’t yours to call off: appeal it in writing to the dean by December 21, 2026.');
    expect(sim.player.school!.leave!.status).toBe('granted');
    const appeal = drew('school.appeal_leave');
    expect(appeal).toHaveLength(1);
    appeal[0]!.onClick!();
    // Five of Yale's working days from Monday 14 December at noon: Monday 21 December at noon.
    expect(pendingOf(sim, APPEAL_KIND).map((i) => i.at)).toEqual([at(2026, 12, 21, 12)]);
    sim = reload(sim);
    tend(sim, at(2026, 12, 21, 13));
    const school = sim.player.school!;
    expect(school.leave).toBeUndefined();
    expect(school.leaves!.at(-1)).toMatchObject({ status: 'rescinded', mandatory: { appeal: { outcome: 'rescinded', why: 'You’re cleared, and the leave hadn’t begun.' } } });
    expect(titled(sim, 'Your Appeal Is Turned Down')).toHaveLength(0);
    expect(titled(sim, 'Your Leave Is Overturned').map((n) => n.body)).toEqual(['The dean has overturned the leave: You’re cleared, and the leave hadn’t begun. It won’t begin: Spring Term 2027 is yours as before, from January 4, 2027.']);
    sim = reload(sim);
    tend(sim, at(2027, 1, 12, 12));
    expect(sim.player.school!.termsBegun).toBe(2);
    expect(enrolledTerms(sim.player.school!)).toEqual([0, 1]);
    expect(sim.player.school!.offset ?? 0).toBe(0);
    expect(titled(sim, 'Your Leave Has Begun')).toHaveLength(0);
    expect(titled(sim, 'Your Leave Is Overturned')).toHaveLength(1);
  }, 300_000);

  it('PLAYER JOURNEY: appealed and down with the flu at its decision (TEST SETUP), the appeal is turned down in the clearance’s words, and the leave begins with Spring Term 2027', () => {
    const sim = thaw(deanLate());
    sim.must({ kind: 'school.appeal_leave', payload: {} });
    tend(sim, at(2026, 12, 21, 10));
    flu(sim);
    tend(sim, at(2026, 12, 21, 13));
    expect(titled(sim, 'Your Appeal Is Turned Down').map((n) => n.body)).toEqual(['The dean upholds the leave. You weren’t cleared: You’re down with the flu: a Yale Health physician can’t clear you until it’s past.']);
    tend(sim, at(2027, 1, 5, 12));
    expect(sim.player.school!.leave).toMatchObject({ status: 'on', firstTerm: 1 });
  }, 300_000);
});

// ---------------------------------------------------------------------------
// school.continuity
// ---------------------------------------------------------------------------

describe('school.continuity: earned results across leave, return, a repeat, an additional term, the degree and reloads', () => {
  it('PLAYER JOURNEY (A): from creation through Incompletes, a medical leave, the year repeated, the aid office and a conversion to the degree at Commencement 2031, what each boundary settled stands at every later one, and reloaded at every boundary the life is its twin’s played straight, every notice once', () => {
    const a = journeyA();
    const b = journeyAReloaded();
    for (const j of [a, b]) for (let i = 1; i < j.settled.length; i += 1) expectKept(j.settled[i - 1]!.was, j.settled[i]!.was, `${j.settled[i - 1]!.label} → ${j.settled[i]!.label}`);
    expect(b.settled.map((x) => x.label)).toEqual(a.settled.map((x) => x.label));
    for (const [i, x] of a.settled.entries()) expect(b.settled[i]!.was, x.label).toEqual(x.was);
    expect(lifeOf(b.sim)).toEqual(lifeOf(a.sim));
    const school = a.sim.player.school!;
    expect(school.standing).toBe('graduated');
    // Eight terms enrolled: Fall Term 2026, Spring Term 2028, the repeated year, the second and the third.
    expect(enrolledTerms(school)).toEqual([0, 3, 4, 5, 6, 7, 8, 9]);
    expect(school.history.map((r) => r.term)).toEqual([0, 3, 4, 5, 6, 7, 8, 9]);
    // Every attempt kept: each of the fall's Incompletes Permanent beside its pass in the repeated year.
    const owed = Object.values(a.settled.find((x) => x.label === 'term 0 evaluated')!.was.courses).filter((r) => r.result === 'incomplete');
    expect(owed.length).toBeGreaterThan(0);
    expect(Object.values(school.courses!).filter((x) => x.term === 0 && x.result === 'permanent').map((r) => r.code).sort()).toEqual(owed.map((r) => r.code).sort());
    for (const r of Object.values(school.courses!).filter((x) => x.term === 0 && x.result === 'permanent')) {
      expect(Object.values(school.courses!).find((x) => x.code === r.code && x.term === 4)).toMatchObject({ result: 'pass', academic: 0 });
    }
    // The living scholarship once a term enrolled, eight; none in the leave's terms.
    expect(a.sim.universe.transactions.filter((t) => t.memo.startsWith('Living-expense scholarship, ')).length).toBe(8);
    // The repeated fall's Saturday, six hours at $23.00, converted once in January 2029: $138.00.
    const grants = a.sim.universe.transactions.filter((t) => t.memo.startsWith('Grant-in-aid: '));
    expect(grants.map((t) => [t.memo, Math.max(...t.postings.map((p) => p.amount))])).toEqual([['Grant-in-aid: 6 work-study hours converted, David Geffen School of Drama at Yale University', 138_00]]);
    expect(school.convertedHours).toEqual({ 4: 6 });
    // The aid office's exception, the medical leave having made the extra terms: nothing billed past six, nothing owed.
    expect(school.aidReview).toMatchObject({ status: 'decided', tuition: true, living: true });
    expect(accountOwed(a.sim, a.sim.player)).toBe(0);
    // Every notice once, heard as the life went, the twins alike; the leave's, the repeat's and the degree's each once, and
    // each term's beginning once for each term enrolled.
    expect(heard(b)).toEqual(heard(a));
    expect(new Set(heard(a)).size).toBe(heard(a).length);
    for (const title of ['Your Leave Has Begun', 'Back From Your Leave', 'You’ll Repeat The Year', 'Hours Converted To Grant Aid', 'Your MFA Is Conferred']) expect(heardTitled(a, title), title).toHaveLength(1);
    expect([0, 3, 4, 5, 6, 7, 8, 9].map((t) => heardTitled(a, `${['Fall', 'Spring'][t % 2]} Term ${2026 + Math.ceil(t / 2)} Begins`).length)).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(heardTitled(a, 'Spring Term 2027 Begins')).toHaveLength(0);
    expect(heardTitled(a, 'Fall Term 2027 Begins')).toHaveLength(0);
  }, 900_000);

  it('PLAYER JOURNEY (B): from creation through a third year’s Fail, the last spring’s thirty days, an additional term and its retake failed, to the degree withheld, what each boundary settled stands, and reloaded at every boundary the life is its twin’s, every notice once', () => {
    const a = journeyB();
    const b = journeyBReloaded();
    for (const j of [a, b]) for (let i = 1; i < j.settled.length; i += 1) expectKept(j.settled[i - 1]!.was, j.settled[i]!.was, `${j.settled[i - 1]!.label} → ${j.settled[i]!.label}`);
    for (const [i, x] of a.settled.entries()) expect(b.settled[i]!.was, x.label).toEqual(x.was);
    expect(lifeOf(b.sim)).toEqual(lifeOf(a.sim));
    const school = a.sim.player.school!;
    expect(school.standing).toBe('withheld');
    expect(school.extra).toMatchObject({ term: 6, courses: [{ code: MOVEMENT_III, academic: 4 }] });
    expect(Object.values(school.courses!).filter((r) => r.code === MOVEMENT_III).map((r) => [r.term, r.academic, r.result])).toEqual([[4, 4, 'fail'], [6, 4, 'fail']]);
    expect(heard(b)).toEqual(heard(a));
    expect(new Set(heard(a)).size).toBe(heard(a).length);
    expect(heardTitled(a, 'The Degree Isn’t Recommended')).toHaveLength(1);
    expect(heardTitled(a, 'An Additional Term Granted')).toHaveLength(1);
    expect(heardTitled(a, 'Your MFA Is Conferred')).toHaveLength(0);
    expect(pendingOf(a.sim, TERM_KIND)).toHaveLength(0);
  }, 900_000);
});

// ---------------------------------------------------------------------------
// school.s6.dead-ends
// ---------------------------------------------------------------------------

const STANDS = 'What you did here stands: every course and its result stay on your record, the productions you played stay on your Profile, and hours you worked are still paid. Practice, and the practice briefs on your Profile, go on outside the School.';
const EXTRA_LATER = ' You can’t repeat its year: that would go past the nine semesters the Bulletin allows. Instead, after your last year’s term review, you can ask on the Standing tab for an additional term to retake it, unless that review puts you on academic warning.';

/**
 * sc-x3 (the scope tests' seed): Text Analysis I (Thursdays) slept through four times in Spring Term 2027, failed, the
 * year repeated and passed; then Clown (DRAM 263a/b, Mondays) slept through four times in Fall Term 2028.
 */
const clownFailed = once(() => {
  const sim = life('sc-x3');
  tend(sim, at(2027, 1, 11, 0));
  expect(sleepThrough(sim, 1, 'DRAM 163b', 4)).toHaveLength(4);
  tend(sim, at(2027, 4, 23, 18));
  sim.must({ kind: 'school.request_repeat', payload: {} });
  tend(sim, at(2028, 8, 28, 0));
  expect(sleepThrough(sim, 4, 'DRAM 263a/b', 4, 2)).toHaveLength(4);
  tend(sim, at(2028, 12, 31, 12));
  return freeze(sim);
});

describe('school.s6.dead-ends: no notice leaves the student without what remains', () => {
  it('PLAYER JOURNEY: a second fall’s Fail after the first year’s repeat can’t be repeated for, and its notice names the additional term instead; at the last spring’s end the Standing tab offers it, Ask For An Additional Term is pressed, and it’s granted, counted nine semesters (until 2026-10-16 the notice said only that the degree needs every course passed)', () => {
    let sim = thaw(clownFailed());
    const school = () => sim.player.school!;
    expect(school().courses!['4:DRAM 263a/b']).toMatchObject({ result: 'fail', academic: 2 });
    expect([school().standing, school().endedAt]).toEqual(['concern', undefined]);
    expect(titled(sim, 'Not Passed: Clown').map((n) => [n.at, n.body])).toEqual([[at(2028, 12, 8, 17), `You didn’t pass Clown: you came to 7 of the 11 classes you weren’t excused from. The degree needs every course passed.${EXTRA_LATER}`]]);
    sim = reload(sim);
    // The third year, its terms past the six the scholarship supports billed and paid as each begins (unpaid, a hold
    // stops its registration: the next test); the last spring, Spring Term 2030, to its evaluation of Friday 26 April at five.
    for (const t of [6, 7]) { tend(sim, onDay(termStart(t).date, 12)); payOwed(sim); }
    tend(sim, onDay(classPeriod(7).to, 18));
    expect(enrolledTerms(school())).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(school().repeatBy).toBeDefined();
    expect(titled(sim, 'Your Degree Isn’t Complete').map((n) => n.body)[0]).toContain('you can ask for an additional term, Fall Term 2030, to retake it, on the Standing tab');
    const panel = drawn(sim, RepeatPanel);
    expect(panel.text).not.toContain('Ask To Repeat The Year…');
    expect(panel.text).toContain('Or an additional term, Fall Term 2030, to retake Clown alone');
    const ask = drew('school.request_extra_term');
    expect(ask.map((c) => [c.label, c.disabled])).toEqual([['Ask For An Additional Term', false]]);
    ask[0]!.onClick!();
    expect(school().extraRequest).toMatchObject({ status: 'pending', term: 8 });
    sim = reload(sim);
    tend(sim, onDay(classPeriod(7).to, 18) + 8 * MS_DAY);
    // Eight enrolled and the term itself: nine, the Bulletin's most.
    expect(school().extra).toMatchObject({ term: 8, courses: [{ code: 'DRAM 263a/b', academic: 2 }] });
    expect(titled(sim, 'An Additional Term Granted')).toHaveLength(1);
  }, 600_000);

  it('PLAYER JOURNEY: the degree withheld says so and what still stands, each clause true of the record: the passes kept, the productions on the Profile, nothing of the hours left unpaid; and the practice it names is taken', () => {
    const { sim } = journeyB();
    const school = sim.player.school!;
    const withheld = titled(sim, 'The Degree Isn’t Recommended');
    expect(withheld).toHaveLength(1);
    expect(withheld[0]!.body.startsWith('The degree needs every course passed, and Movement Invention III wasn’t.')).toBe(true);
    expect(withheld[0]!.body.endsWith(`The faculty didn’t recommend the degree, and your terms at the School are over. ${STANDS}`)).toBe(true);
    expect(Object.values(school.courses!).filter((r) => r.result === 'pass').length).toBeGreaterThan(40);
    expect((school.credits ?? []).length).toBeGreaterThan(0);
    expect(school.workStudy.owedHours).toBe(0);
    const r = sim.execute({ kind: 'practice.exercise', payload: { exercise: 'given-circumstances' } });
    expect(r.error).toBeUndefined();
  }, 900_000);

  it('PLAYER JOURNEY: a dismissal says so and what still stands, and the practice it names is taken: sc-dq, three courses failed in Fall Term 2026 and kept on warning, Text Analysis I failed in the spring', () => {
    const sim = life('sc-dq');
    tend(sim, at(2026, 8, 30, 0));
    for (let k = 0; k < 4; k += 1) for (const code of ['DRAM 153a', 'DRAM 403a/b']) expect(sleepThrough(sim, 0, code, 1)).toHaveLength(1);
    tend(sim, at(2027, 1, 11, 0));
    expect(sleepThrough(sim, 1, 'DRAM 163b', 4)).toHaveLength(4);
    tend(sim, at(2027, 4, 24, 12));
    expect(sim.player.school!.standing).toBe('dismissed');
    const dismissed = titled(sim, 'Dismissed From The School');
    expect(dismissed).toHaveLength(1);
    expect(dismissed[0]!.body.endsWith(`A dismissed student can’t return to the School. ${STANDS}`)).toBe(true);
    expect(Object.values(sim.player.school!.courses!).filter((r) => r.result === 'pass').length).toBeGreaterThan(0);
    tend(sim, at(2027, 4, 26, 12));
    expect(sim.player.school!.workStudy.owedHours).toBe(0);
    expect(sim.execute({ kind: 'practice.exercise', payload: { exercise: 'given-circumstances' } }).error).toBeUndefined();
  }, 600_000);
});

describe('school.d-not-registered-hold: a term begun under a financial hold', () => {
  it('DEFECT: the Not Registered notice names the hold, the sum owed and where to pay it, and once it’s paid and registered the classes count her again (until 2026-10-16 it said “Register on the School screen”, which the hold refused, every class day)', () => {
    const sim = thaw(clownFailed());
    // Nothing paid: Fall Term 2029, the seventh term enrolled, is billed at its start and comes due thirty days on; the
    // eighth, Spring Term 2030, begins under the hold that brought, and is billed too.
    const spring = termStart(7).date;
    const first = classDays(7)[0]!;
    tend(sim, onDay(first, 10));
    expect(sim.player.school).toMatchObject({ mustRegister: true });
    expect(sim.player.school!.hold).toBeDefined();
    // Each term past six billed at 2029–2030's figures, worked in tests/scope-school.test.ts from the Bulletin's
    // $40,750 tuition and $3,764 Yale Health plan grown three years: $22,407.28 and $2,377.37 a term, $24,784.65; twice,
    // with the late fee's cap for the first, $375: $49,944.30.
    expect(accountOwed(sim, sim.player)).toBe(49_944_30);
    expect(onDay(spring, 9) < sim.now).toBe(true);
    expect(titled(sim, 'Not Registered').map((n) => n.body)).toEqual(['You haven’t registered, so today’s classes didn’t count your attendance. A financial hold stops registration: $49,944.30 is owed on your Yale account. Pay it on the Terms And Award tab, then register on the Standing tab.']);
    expect(refused(sim, 'school.reregister')).toBe('A financial hold stops registration: $49,944.30 is owed on your Yale account. Pay it on the Terms And Award tab.');
    sim.must({ kind: 'school.pay_balance', payload: {} });
    sim.must({ kind: 'school.reregister', payload: {} });
    const before = sim.player.school!.tally.attended;
    tend(sim, onDay(classDays(7)[1]!, 12));
    expect(sim.player.school!.tally.attended).toBe(before + 1);
  }, 600_000);
});

// ---------------------------------------------------------------------------
// defect.yale-credit-hold (brief 11, section 5)
// ---------------------------------------------------------------------------

/**
 * A credit that clears a held Yale account (from 2026-10-17, brief 11): every credit on the account is a leave's, at its
 * start (`startLeave`: Yale Health's fee refunded where the cover goes back to the insurance term's start, the tuition of a
 * billed term rebated on the schedule) or on an appeal that overturns a mandatory leave (`rescind`: the living-expense
 * scholarship it returned, restored). The first two reach a hold in play, and are played here on sc-x3's third year,
 * billed and unpaid as `clownFailed` leaves it. The third doesn't: the scholarship is returned only on a term the
 * scholarship aids, an appeal is decided within twelve days of the leave (seven to appeal, five working days to decide),
 * before the thirty days that returned scholarship is due in, and the only hold an aided term can begin under is cleared
 * by its own scholarship first (journeys.d-aid-past-balance). Nor does any credit reach a degree held for the account:
 * a leave is refused once the terms are done (“Your terms are done. All that’s left is the degree.”), so the degree's
 * conferral on the hold's lift is the payment's (tests/leave.test.ts).
 *
 * Figures worked from the rules, as this file's others are: Fall Term 2029's $22,407.28 tuition and $2,377.37 Yale Health
 * plan (school.d-not-registered-hold) billed on Monday 27 August, due thirty days on, Wednesday 26 September, when
 * unpaid the hold comes with the month's $125.00 late fee, to the term's $375.00; a leave's tuition rebate the Bulletin's
 * schedule, all of it within a tenth of the classes, half within a quarter, a quarter within half (p.183): classes from
 * Monday 3 September to Friday 14 December, so a medical leave decided at noon on Thursday 4 October (five of Yale's
 * working days from Thursday 27 September) begins 31.5 days into 102.96, 31%, and rebates a quarter, $5,601.82.
 */
describe('defect.yale-credit-hold: a credit that clears a held Yale account lifts the hold, and only that', () => {
  /** sc-x3 under Fall Term 2029's hold, the day after it came: $24,909.65 owed. */
  const heldInTheFall = once(() => {
    const sim = thaw(clownFailed());
    tend(sim, onDay(termStart(6).date, 12) + 31 * MS_DAY);
    expect(sim.player.school!.hold).toBe(at(2029, 9, 26));
    expect(accountOwed(sim, sim.player)).toBe(24_909_65);
    return freeze(sim);
  });
  const refunded = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo === 'Yale account credit balance refunded').map((t) => Math.max(...t.postings.map((p) => p.amount)));

  it('DEFECT: owing $24,909.65 under the hold, she pays $20,000.00 and takes a medical leave (TEST SETUP: the flu); its quarter of the tuition rebated, $5,601.82, clears the $4,909.65 left and refunds $692.17: the hold lifts at noon on 4 October, said once, across a reload; Pay is refused with nothing owed, no late fee comes, and back for Fall Term 2030 she registers (until 2026-10-17 the hold stayed over nothing owed, and refused that registration)', () => {
    let sim = thaw(heldInTheFall());
    const school = () => sim.player.school!;
    sim.must({ kind: 'school.pay_balance', payload: { amount: 20_000_00 } });
    expect(accountOwed(sim, sim.player)).toBe(4_909_65);
    expect(school().hold).toBe(at(2029, 9, 26));
    flu(sim);
    const asked = sim.must<{ decideAt: Instant; firstTerm: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    expect(asked).toMatchObject({ decideAt: at(2029, 10, 4, 12), firstTerm: 6 });
    sim = reload(sim);
    tend(sim, asked.decideAt + MS_HOUR);
    expect(school().leave!.status).toBe('on');
    expect(sim.universe.transactions.filter((t) => t.memo === 'Tuition rebated (25%), Fall Term 2029: leave of absence')).toHaveLength(1);
    expect(accountOwed(sim, sim.player)).toBe(0);
    expect(refunded(sim)).toEqual([692_17]);
    // The hold's own condition met, it lifts, said once in what cleared it.
    expect(school().hold).toBeUndefined();
    expect(titled(sim, 'The Financial Hold Is Lifted').map((n) => [n.at, n.body])).toEqual([[at(2029, 10, 4, 12), 'The tuition rebated on your leave (25%), $5,601.82, clears your Yale account, and the $692.17 over what it owed is refunded to your bank. Registration and the diploma are open to you again.']]);
    expect(refused(sim, 'school.pay_balance')).toBe('Your Yale account owes no balance.');
    sim = reload(sim);
    expect(school().hold).toBeUndefined();
    // The month's due date finds nothing owed: no fee, no hold said again.
    tend(sim, at(2029, 10, 27, 12));
    expect([accountOwed(sim, sim.player), school().lateFees]).toEqual([0, { 6: 125_00 }]);
    expect(titled(sim, 'A Financial Hold')).toHaveLength(1);
    // Back from the leave: notice given, Fall Term 2030 begins, registration is asked and taken.
    sim.must({ kind: 'school.return_notice', payload: {} });
    tend(sim, onDay(termStart(8).date, 12));
    expect(school().leave).toBeUndefined();
    expect(school().mustRegister).toBe(true);
    expect(school().hold).toBeUndefined();
    sim.must({ kind: 'school.reregister', payload: {} });
    expect(school().mustRegister).toBeUndefined();
    expect(titled(sim, 'The Financial Hold Is Lifted')).toHaveLength(1);
  }, 600_000);

  it('PLAYER JOURNEY: her twin pays $15,000.00: the same $5,601.82 rebate leaves $4,307.83 owed, and the hold stands, nothing said; the month’s fees go on to the term’s $375.00, $4,557.83, and back for Fall Term 2030 the hold refuses registration until it’s paid, when it lifts, once, and she registers', () => {
    let sim = thaw(heldInTheFall());
    const school = () => sim.player.school!;
    sim.must({ kind: 'school.pay_balance', payload: { amount: 15_000_00 } });
    flu(sim);
    const asked = sim.must<{ decideAt: Instant }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    tend(sim, asked.decideAt + MS_HOUR);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Tuition rebated (25%), Fall Term 2029: leave of absence')).toHaveLength(1);
    expect(accountOwed(sim, sim.player)).toBe(4_307_83);
    expect(refunded(sim)).toEqual([]);
    expect(school().hold).toBe(at(2029, 9, 26));
    expect(titled(sim, 'The Financial Hold Is Lifted')).toHaveLength(0);
    sim = reload(sim);
    tend(sim, at(2029, 12, 1, 12));
    expect(accountOwed(sim, sim.player)).toBe(4_557_83);
    expect(school().lateFees).toEqual({ 6: 375_00 });
    sim.must({ kind: 'school.return_notice', payload: {} });
    tend(sim, onDay(termStart(8).date, 12));
    expect(school().hold).toBe(at(2029, 9, 26));
    expect(refused(sim, 'school.reregister')).toMatch(/^A financial hold stops registration: \$30,256\.57 is owed on your Yale account\. Pay it on the Terms And Award tab\.$/);
    sim.must({ kind: 'school.pay_balance', payload: {} });
    expect(school().hold).toBeUndefined();
    expect(titled(sim, 'The Financial Hold Is Lifted').map((n) => n.body)).toEqual(['Your Yale account is paid. Registration and the diploma are open to you again.']);
    sim.must({ kind: 'school.reregister', payload: {} });
  }, 600_000);

  it('PLAYER JOURNEY: Spring Term 2030 begun under the fall’s hold, $49,944.30 owed and registration asked; she pays the fall’s $25,159.65 and takes a medical leave before classes (TEST SETUP: the flu): its Yale Health fee refunded, $2,377.37, leaves the tuition owed and the hold stands; its tuition rebated in full, $22,407.28, clears it, and the hold lifts, said once in the rebate’s words, the registration the term asked for still asked, kept for her return: on the leave Standing draws no Register and the command is refused', () => {
    const sim = thaw(clownFailed());
    const school = () => sim.player.school!;
    tend(sim, onDay(termStart(7).date, 12));
    expect([accountOwed(sim, sim.player), school().hold, school().mustRegister]).toEqual([49_944_30, at(2029, 9, 26), true]);
    sim.must({ kind: 'school.pay_balance', payload: { amount: 25_159_65 } });
    expect([accountOwed(sim, sim.player), school().hold]).toEqual([24_784_65, at(2029, 9, 26)]);
    flu(sim);
    const asked = sim.must<{ decideAt: Instant }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    // Decided at noon on Monday 14 January, the classes' first day: before they're over, so the cover goes back.
    expect(asked.decideAt).toBe(at(2030, 1, 14, 12));
    tend(sim, asked.decideAt + MS_HOUR);
    expect(school().leave).toMatchObject({ status: 'on', retro: true, feeRefund: 2_377_37 });
    const credits = sim.universe.transactions.filter((t) => t.at === asked.decideAt && t.category === 'school').map((t) => t.memo);
    expect(credits).toEqual(['Yale Health fee refunded, Spring Term 2030: cover canceled back to the insurance term’s start', 'Tuition rebated (100%), Spring Term 2030: leave of absence']);
    expect(accountOwed(sim, sim.player)).toBe(0);
    // Lifted by the second credit, not the first, which left the tuition owed.
    expect(titled(sim, 'The Financial Hold Is Lifted').map((n) => n.body)).toEqual(['The tuition rebated on your leave (100%), $22,407.28, clears your Yale account. Registration and the diploma are open to you again.']);
    expect(school().hold).toBeUndefined();
    expect(school().mustRegister).toBe(true);
    // On leave, the term she left isn't one to register for: Standing draws no Register, and the command is refused in
    // its words, the registration kept for the return (until 2026-10-17 both registered her for the term she'd left).
    expect(drawn(sim, LeavePanel).text).not.toContain('Register for');
    expect(drew('school.reregister')).toEqual([]);
    expect(refused(sim, 'school.reregister')).toBe('You’re on leave: you register for the term you come back to, when it begins.');
    expect(school().mustRegister).toBe(true);
  }, 600_000);

  it('FIXTURE: a save from before 2026-10-17 that kept the hold over nothing owed (TEST SETUP: the hold put back after the rebate cleared the account, as that build left it) has it lifted on opening, said once, and later openings say nothing; one over something owed keeps it', () => {
    let sim = thaw(heldInTheFall());
    sim.must({ kind: 'school.pay_balance', payload: { amount: 20_000_00 } });
    flu(sim);
    const asked = sim.must<{ decideAt: Instant }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    tend(sim, asked.decideAt + MS_HOUR);
    expect(accountOwed(sim, sim.player)).toBe(0);
    // TEST SETUP: the hold as the build before 2026-10-17 left it, with nothing said of a lift.
    sim.player.school!.hold = at(2029, 9, 26);
    sim.universe.notifications = sim.universe.notifications.filter((n) => n.title !== 'The Financial Hold Is Lifted');
    sim = reload(sim);
    expect(sim.player.school!.hold).toBeUndefined();
    expect(titled(sim, 'The Financial Hold Is Lifted').map((n) => n.body)).toEqual(['Your Yale account owes nothing: a credit on it cleared it. Registration and the diploma are open to you again.']);
    sim = reload(sim);
    expect(titled(sim, 'The Financial Hold Is Lifted')).toHaveLength(1);
    // A hold over something owed is kept as the save has it.
    const owing = thaw(heldInTheFall());
    expect(owing.player.school!.hold).toBe(at(2029, 9, 26));
    expect(titled(owing, 'The Financial Hold Is Lifted')).toHaveLength(0);
  }, 600_000);
});

// ---------------------------------------------------------------------------
// school.unreached-refusals
// ---------------------------------------------------------------------------

/**
 * ur-1, Scraping: a student who keeps up, played from creation to the degree at Commencement 2029, with the moments a
 * refusal is tried at kept as saves: early May of the second year, the third spring's evaluation, and after the degree.
 */
const UR_STEPS: readonly Step[] = [
  ...[0, 1, 2, 3, 4, 5].flatMap((t) => termSteps(t)),
  { label: 'may 2028', at: at(2028, 5, 3, 12), boundary: true },
  { label: 'before commencement', at: at(2029, 5, 1, 12), boundary: true },
  { label: 'after', at: at(2029, 6, 1, 12), boundary: true },
];
const graduate = once(() => journey('ur-1', SCRAPING, UR_STEPS, false));
/** Nothing a refusal moves: the clock, the ledger, the calendar's length, the school's record. */
const still = (sim: Simulation) => JSON.stringify([sim.now, sim.universe.transactions.length, sim.universe.scheduled.length, sim.player.school]);
function refusedLeaving(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): string | undefined {
  const before = still(sim);
  const no = refused(sim, kind, payload);
  expect(still(sim), `${kind} moved nothing`).toBe(before);
  return no;
}

describe('school.unreached-refusals: each refusal no test reached, reached', () => {
  it('PLAYER JOURNEY: at 7:30 on 24 August 2026, before the fall term begins at nine, a leave and a Cabaret show are refused in their words, and nothing moves', () => {
    const sim = life('ur-1', SCRAPING);
    expect(sim.player.school!.termsBegun).toBe(0);
    expect(refusedLeaving(sim, 'school.request_leave', { kind: 'personal', reason: 'family', terms: 2 })).toBe('You can’t take a leave before your first term has begun.');
    expect(refusedLeaving(sim, 'school.cabaret')).toBe('The Cabaret’s season starts with the term. Ask again once it’s begun.');
    // Said on the Cabaret's panel where its button would be.
    expect(drawn(sim, SchoolWorkspace, 'casting').text).toContain('The Cabaret’s season starts with the term. Ask again once it’s begun.');
  }, 120_000);

  it('PLAYER JOURNEY: in the first fall, a leave is refused in each of the Bulletin’s words (a personal one before a term is completed, one for a professional commitment, a medical one with nothing to recommend it), on the Leave form and by the command alike', () => {
    const sim = thaw(graduate().marks['term 0 begins']!);
    tend(sim, at(2026, 9, 8, 12));
    expect(refusedLeaving(sim, 'school.request_leave', { kind: 'personal', reason: 'family', terms: 2 })).toBe('You can take a personal leave only after you’ve completed one term.');
    expect(refusedLeaving(sim, 'school.request_leave', { kind: 'personal', reason: 'professional', terms: 2 })).toBe('The School doesn’t normally grant a leave to take on a professional commitment.');
    const medical = 'A medical leave needs a Yale Health physician’s written recommendation, and nothing in the last 30 days would lead to one: no illness, injury or stay in hospital.';
    expect(refusedLeaving(sim, 'school.request_leave', { kind: 'medical', reason: 'illness', terms: 2 })).toBe(medical);
    // The form opens on Medical, Illness: its refusal said under it, Ask For A Leave… grayed.
    expect(drawn(sim, LeavePanel).text).toContain(medical);
    expect(drawn(sim, LeavePanel).html).toMatch(/<button[^>]*disabled=""[^>]*>Ask For A Leave…<\/button>/);
  }, 600_000);

  it('GUARD: a leave asked by a command the form never sends (a reason of the other kind, four terms, no reason) is refused in its words', () => {
    const sim = thaw(graduate().marks['term 0 begins']!);
    tend(sim, at(2026, 9, 8, 12));
    expect(refusedLeaving(sim, 'school.request_leave', { kind: 'medical', reason: 'family', terms: 2 })).toBe('Family is a reason for a personal leave.');
    expect(refusedLeaving(sim, 'school.request_leave', { kind: 'medical', reason: 'nonsense', terms: 2 })).toBe('Choose a reason for the leave.');
    // TEST SETUP: the flu, so the request reaches its length.
    flu(sim);
    expect(refusedLeaving(sim, 'school.request_leave', { kind: 'medical', reason: 'illness', terms: 4 })).toBe('A leave is one, two or three terms.');
  }, 600_000);

  it('PLAYER JOURNEY: the fall’s last weeks have no Cabaret week three weeks off, said on its panel and by the command', () => {
    const sim = thaw(graduate().marks['term 0 begins']!);
    tend(sim, at(2026, 12, 1, 12));
    const no = 'There’s no Cabaret week left this term that’s at least three weeks away and clear of your recesses and calls.';
    expect(refusedLeaving(sim, 'school.cabaret')).toBe(no);
    expect(drawn(sim, SchoolWorkspace, 'casting').text).toContain(no);
  }, 600_000);

  it('GUARD: Call In Sick on a Sunday, which the screen doesn’t offer (nothing at school that day), refused by the command in its words', () => {
    const sim = thaw(graduate().marks['term 0 begins']!);
    tend(sim, at(2026, 9, 6, 12));
    expect(refusedLeaving(sim, 'school.call_in_sick')).toBe('There’s nothing at school today to miss.');
    drawn(sim, SchoolWorkspace, 'classes');
    expect(drew('school.call_in_sick')).toEqual([]);
  }, 600_000);

  it('PLAYER JOURNEY: in May of the second year, every assigned hour booked and none missed ill, a conversion is refused in May’s words, and nothing is booked (2027–28 has 25 assigned Saturdays, six hours each to the 150; 2026–27’s 24 leave six never assigned, which May converts)', () => {
    const sim = thaw(graduate().marks['may 2028']!);
    const ws = sim.player.school!;
    expect(ws.excusedHours?.['2'] ?? 0).toBe(0);
    expect(ws.workStudy.assignedBooked).toBe(150);
    expect(refusedLeaving(sim, 'school.request_conversion')).toBe('There are no hours to convert. Only assigned hours you missed while ill or hurt, or hours never assigned, can be converted.');
  }, 600_000);

  it('PLAYER JOURNEY: between the last spring’s evaluation, every course passed, and Commencement, a leave and a repeat are refused as done; after the degree, the Cabaret says so on its panel, and the protective equipment, which the screen no longer offers, is refused by the command', () => {
    const before = thaw(graduate().marks['before commencement']!);
    expect(before.player.school!.standing).toBe('good');
    expect(refusedLeaving(before, 'school.request_leave', { kind: 'personal', reason: 'family', terms: 2 })).toBe('Your terms in the program are done.');
    expect(refusedLeaving(before, 'school.request_repeat')).toBe('Your last year’s term review is past.');
    expect(drawn(before, RepeatPanel).text).not.toContain('Ask To Repeat The Year…');
    const after = thaw(graduate().marks.after!);
    expect(after.player.school!.standing).toBe('graduated');
    expect(refusedLeaving(after, 'school.cabaret')).toBe('The Cabaret is for students.');
    expect(drawn(after, SchoolWorkspace, 'casting').text).toContain('The Cabaret is for students.');
    expect(refusedLeaving(after, 'school.buy_ppe')).toBe('Only students on work-study need it.');
  }, 600_000);

  it('PLAYER JOURNEY: on journey A’s leave, granted and not begun it can’t be asked again; on it, Give Notice Of Return is refused while she’s ill in each of the clearance’s words (TEST SETUP: in hospital, laid up, the flu, unwell), grayed with them on the panel; given, it’s refused a second time; and back, another leave is refused at the Bulletin’s three terms', () => {
    const a = journeyA();
    const granted = thaw(a.marks['leave decided']!);
    flu(granted);
    expect(refusedLeaving(granted, 'school.request_leave', { kind: 'medical', reason: 'illness', terms: 2 })).toBe('Your leave is granted, from Spring Term 2027.');
    const on = () => thaw(a.marks['term 1 begins']!);
    let sim = on();
    healthOf(sim.player).inHospitalUntil = sim.now + 3 * MS_DAY;
    expect(refusedLeaving(sim, 'school.return_notice')).toBe('You’re in hospital: a Yale Health physician can’t clear you to come back yet.');
    sim = on();
    healthOf(sim.player).injury = { kind: 'fracture', at: sim.now - MS_DAY, until: sim.now + 40 * MS_DAY, offWorkUntil: at(2027, 1, 18, 9) };
    expect(refusedLeaving(sim, 'school.return_notice')).toBe('You’re laid up until January 18, 2027: a Yale Health physician can’t clear you yet.');
    sim = on();
    flu(sim);
    const fluNo = 'You’re down with the flu: a Yale Health physician can’t clear you until it’s past.';
    expect(refusedLeaving(sim, 'school.return_notice')).toBe(fluNo);
    const panel = drawn(sim, LeavePanel);
    expect(panel.text).toContain(fluNo);
    expect(drew('school.return_notice').map((c) => c.disabled)).toEqual([true]);
    sim = on();
    sim.player.wellbeing.condition = 10;
    expect(refusedLeaving(sim, 'school.return_notice')).toBe('You’re not well enough yet for a Yale Health physician to clear you to come back.');
    sim = on();
    sim.must({ kind: 'school.return_notice', payload: {} });
    expect(refusedLeaving(sim, 'school.return_notice')).toBe('You already gave notice on January 4, 2027.');
    drawn(sim, LeavePanel);
    expect(drew('school.return_notice')).toEqual([]);
    const back = thaw(a.marks['term 3 begins']!);
    flu(back);
    expect(refusedLeaving(back, 'school.request_leave', { kind: 'medical', reason: 'illness', terms: 2 })).toBe('You’ve had 2 terms of leave; the Bulletin allows 3 in all.');
    expect(drawn(back, LeavePanel).text).toContain('Two terms: You’ve had 2 terms of leave; the Bulletin allows 3 in all.');
  }, 900_000);

  it('GUARD: a notice of return after its deadline, which no save reaches (the deadline’s own item dismisses at its hour; TEST SETUP: that item called off by hand), is refused “Its deadline has passed.”', () => {
    const sim = thaw(journeyA().marks['term 1 begins']!);
    for (const i of pendingOf(sim, LEAVE_NOTICE_KIND)) sim.timeline.cancel(i.id, sim.now);
    const by = sim.player.school!.leave!.noticeBy!;
    tend(sim, by + MS_HOUR);
    expect(sim.player.school!.leave!.status).toBe('on');
    expect(refusedLeaving(sim, 'school.return_notice')).toBe('Its deadline has passed.');
  }, 900_000);

  it('PLAYER JOURNEY: the aid office’s review asked twice is refused while it’s with the office and once it has decided', () => {
    const a = journeyA();
    const asked = thaw(a.marks['repeat decided']!);
    expect(asked.player.school!.aidReview!.status).toBe('pending');
    // Five of Yale's working days from Monday 8 May 2028 at noon: Monday 15 May.
    expect(refusedLeaving(asked, 'school.request_aid_review')).toBe('It’s with the aid office, decided by May 15, 2028.');
    expect(refusedLeaving(thaw(a.marks['aid decided']!), 'school.request_aid_review')).toBe('The aid office has reviewed your support.');
  }, 900_000);

  it('PLAYER JOURNEY: in a last year’s thirty days, a leave is refused: what’s left is the degree', () => {
    const sim = thaw(journeyB().marks['term 5 evaluated']!);
    expect(sim.player.school!.repeatBy).toBeDefined();
    expect(refusedLeaving(sim, 'school.request_leave', { kind: 'personal', reason: 'family', terms: 2 })).toBe('Your terms are done. All that’s left is the degree.');
  }, 900_000);

  it('GUARD: commands the coursework screen never sends (an id no piece has, a step the work hasn’t, the partner’s own step, a solo piece’s partner, a shown piece’s or a scene-less piece’s way of playing, a done session, feedback not given, a conversation that isn’t, an answer that isn’t, a scene not shared) are refused in their words', () => {
    const sim = thaw(graduate().marks['term 0 begins']!);
    tend(sim, at(2026, 10, 21, 12));
    const cw = courseworkOf(sim, sim.player)!;
    const open = cw.assignments.filter((x) => x.status === 'open');
    const paired = open.find((x) => x.partner !== undefined)!;
    const solo = open.find((x) => x.partner === undefined)!;
    const shown = cw.assignments.find((x) => x.status === 'done')!;
    expect([paired, solo, shown].every(Boolean)).toBe(true);
    expect(refusedLeaving(sim, 'school.prepare', { assignmentId: 'nope', activity: 'x' })).toBe('There’s no such assignment.');
    expect(refusedLeaving(sim, 'school.approach', { assignmentId: 'nope', kind: 'drill' })).toBe('There’s no such assignment.');
    expect(refusedLeaving(sim, 'school.ask_partner', { assignmentId: 'nope', at: sim.now + 3 * MS_DAY })).toBe('There’s no such assignment.');
    expect(refusedLeaving(sim, 'school.choose_playing', { assignmentId: 'nope', pace: 'driven' })).toBe('There’s no such piece.');
    expect(refusedLeaving(sim, 'school.prepare', { assignmentId: solo.id, activity: 'nonsense' })).toBe('That isn’t a step of this piece.');
    const partnerStep = (templateById(paired.template)!.activities.find((x) => x.needs?.includes('partner')))!;
    expect(partnerStep).toBeDefined();
    if (paired.feedback && !paired.feedback.seen) paired.feedback.seen = true;
    expect(refusedLeaving(sim, 'school.prepare', { assignmentId: paired.id, activity: partnerStep.id })).toBe('Work with your partner happens at a rehearsal you both agree to. Ask them for an evening under Rehearsing With on this piece.');
    expect(refusedLeaving(sim, 'school.ask_partner', { assignmentId: solo.id, at: sim.now + 3 * MS_DAY })).toBe('This piece has no partner.');
    expect(refusedLeaving(sim, 'school.choose_playing', { assignmentId: shown.id, pace: 'driven' })).toBe('It’s already been shown.');
    const sceneless = open.find((x) => templateById(x.template)!.material === 'none');
    if (sceneless) expect(refusedLeaving(sim, 'school.choose_playing', { assignmentId: sceneless.id, pace: 'driven' })).toBe('There’s no scene in this piece, so there’s no way of playing it to choose.');
    expect(refusedLeaving(sim, 'school.orientation', { task: 'register' })).toBe('Done on August 24, 2026.');
    const unread = open.find((x) => !x.feedback)!;
    expect(refusedLeaving(sim, 'school.read_feedback', { assignmentId: unread.id })).toBe('There’s no feedback on that.');
    expect(refusedLeaving(sim, 'school.respond', { momentId: 'nope', choice: 'yes' })).toBe('There’s no such conversation.');
  }, 900_000);

  it('GUARD: a classmate’s invitation answered with an answer it doesn’t have, or with a scene she doesn’t share, by commands the moment’s buttons never send, is refused in its words', () => {
    const sim = thaw(graduate().marks['term 0 begins']!);
    tend(sim, at(2026, 9, 1, 10));
    const m = momentsOf(courseworkOf(sim, sim.player)!).find((x) => x.status === 'open' && x.kind === 'study')!;
    expect(m).toBeDefined();
    const first = sim.player.school!.classmates[m.mate]!.name.split(' ')[0];
    expect(refusedLeaving(sim, 'school.respond', { momentId: m.id, choice: 'banana' })).toBe('That isn’t an answer to it.');
    expect(refusedLeaving(sim, 'school.respond', { momentId: m.id, choice: 'yes', assignmentId: 'nope' })).toBe(`That isn’t a scene you share with ${first}.`);
  }, 600_000);

  it('PLAYER JOURNEY: a persistent note on a solo piece, its partner way asked by a command the screen doesn’t offer for it, is refused: the work has no partner; and asking a partner for an evening that clashes with something on the calendar is refused naming it', () => {
    const sim = thaw(graduate().marks['term 0 begins']!);
    tend(sim, at(2026, 10, 5, 10));
    const cw = courseworkOf(sim, sim.player)!;
    const solo = cw.assignments.find((a) => a.status === 'open' && a.partner === undefined && persistentFor(cw, a).length > 0)!;
    expect(solo).toBeDefined();
    if (solo.feedback && !solo.feedback.seen) solo.feedback.seen = true;
    expect(refusedLeaving(sim, 'school.approach', { assignmentId: solo.id, kind: 'partner' })).toBe('This piece has no partner.');
    // An evening that clashes: the first thing on the calendar she's expected at, held for a while, before a paired piece is due.
    const paired = cw.assignments.filter((a) => a.status === 'open' && a.partner !== undefined);
    const clash = paired.flatMap((a) => sim.universe.scheduled
      .filter((i) => i.status === 'pending' && i.requiresPlayer && (i.durationMinutes ?? 0) >= 120 && i.at > sim.now + 2 * MS_DAY && i.at + 2 * MS_HOUR < onDay({ year: Number(a.dueOn.slice(0, 4)), month: Number(a.dueOn.slice(5, 7)), day: Number(a.dueOn.slice(8)) }, 9))
      .map((i) => ({ a, i })))[0]!;
    expect(clash).toBeDefined();
    expect(refusedLeaving(sim, 'school.ask_partner', { assignmentId: clash.a.id, at: clash.i.at })).toBe(`You have ${clash.i.label} then.`);
  }, 600_000);

  it('GUARD: the partner way chosen where the note that keeps coming back is the partner part itself (TEST SETUP: such a note put on the ledger, which no played term here gave three times), refused: that’s the work with your partner already', () => {
    const sim = thaw(graduate().marks['term 0 begins']!);
    tend(sim, at(2026, 10, 5, 10));
    const cw = courseworkOf(sim, sim.player)!;
    const paired = cw.assignments.find((a) => a.status === 'open' && a.partner !== undefined && templateById(a.template)!.dims.partner)!;
    expect(paired).toBeDefined();
    if (paired.feedback && !paired.feedback.seen) paired.feedback.seen = true;
    (cw.notes ??= []).unshift({ key: 'dim:partner', status: 'open', first: '2026-09-08', last: '2026-10-01', given: 9, history: [] });
    expect(persistentFor(cw, paired)[0]!.dim).toBe('partner');
    expect(refusedLeaving(sim, 'school.approach', { assignmentId: paired.id, kind: 'partner' })).toBe('That note is already about working with your partner, so this wouldn’t add anything.');
  }, 600_000);

  it('PLAYER JOURNEY with TEST SETUP: cast at the Rep and in a School production with calls in the weeks a Cabaret show would rehearse and play, the show is refused in the Bulletin’s words, on its panel and by the command (no played life was double-cast there in the second years of eight seeds searched on 2026-10-16, dc-1 to dc-8, so the two castings’ calls are put on the calendar by hand)', () => {
    const sim = thaw(graduate().marks['term 2 begins']!);
    tend(sim, at(2027, 9, 6, 12));
    const term = sim.player.school!.termsBegun - 1;
    const week = cabaretWeek(sim, sim.player, term)!;
    expect(week).toBeDefined();
    const inWindow = at(week.year, week.month, week.day, 15) - 14 * MS_DAY;
    for (const which of ['school', 'rep']) sim.schedule({ at: inWindow, kind: CALL_KIND, label: `TEST SETUP ${which} call`, category: 'school', priority: 30, payload: { personId: sim.player.id, call: 'rehearsal', ...(which === 'rep' ? { which: 'rep' } : {}) } });
    const no = 'You’re cast in two productions at once, and the Bulletin doesn’t allow a double-cast actor to take a Cabaret show.';
    expect(refusedLeaving(sim, 'school.cabaret')).toBe(no);
    expect(drawn(sim, SchoolWorkspace, 'casting').text).toContain(no);
  }, 600_000);
});

// ---------------------------------------------------------------------------
// school.s6.policy
// ---------------------------------------------------------------------------

/**
 * Read against the Yale Bulletin, David Geffen School of Drama 2026–2027 (bulletin.yale.edu, the PDF created 11 August
 * 2026, read 2026-10-16). Published there: the nine semesters and a leave of no more than three (p.194); the counts of
 * Failures that may disqualify (p.194); Pass/Fail (p.151); an Incomplete asked of the instructor and finished within a
 * month, or a Permanent Incomplete (p.152); concern, warning and dismissal (pp.154, 157); the leaves (pp.157–160);
 * tuition support for six terms (pp.182, 190); the late fee and the financial hold (p.184). Not published, SLATE's: the
 * repeated year and the additional term, one review a term with its floors and marks, a course's three-quarters line, an
 * Incomplete given for meetings missed ill, its one extension of a month, the warning's mark. Each is said so where it's read.
 */
describe('school.s6.policy: SLATE’s design not presented as Yale’s policy, nor its simulated staff as real', () => {
  it('the guide says whose each rule is: a course failed and a grave breach stepping the standing are SLATE’s rules, the Incomplete given for illness and its one extension SLATE’s, the repeat and the additional term SLATE’s faculty model, the review of a disqualification SLATE’s, the standings the Bulletin’s', async () => {
    const { GUIDE_BY_ID } = await import('@/engine/content/guide');
    const standing = GUIDE_BY_ID['school.standing']!;
    const fact = (label: string) => standing.reads!.find((f) => f.label === label)!.value;
    expect(fact('A Course Failed')).toContain('This is the game’s rule');
    expect(fact('A Grave Breach')).toContain('which the Bulletin calls a grave breach that may be grounds for dismissal');
    expect(fact('A Grave Breach')).toContain('This is the game’s rule');
    expect(standing.interpret!.join(' ')).toContain('One review a term at the end of its classes, what it asks, and a standing that moves one step at a time are the game’s reading');
    expect(standing.interpret!.join(' ')).toContain('The notices that tell you your standing are the game’s words for the faculty’s decision, not the School’s or its staff’s.');
    const repeat = GUIDE_BY_ID['school.repeat']!;
    expect(repeat.short).toContain('An Incomplete comes from classes you missed while excused; this is the game’s rule (the Bulletin has the student ask the instructor for one)');
    expect(repeat.short).toContain('that limit on the extension the Bulletin lets the instructor grant is the game’s');
    expect(repeat.short).toContain('Repeating and the additional term are the game’s model of the faculty: the Bulletin has no rule for either.');
    expect(repeat.reads!.find((f) => f.label === 'An Incomplete')).toMatchObject({ estimate: true });
    expect(repeat.later!.join(' ')).toContain('the review and its outcomes are the game’s model of the faculty');
    const { CHAPTER_BY_ID } = await import('@/engine/content/tutorial');
    // From 2026-10-17 (brief 14) the review's rules are behind the chapter's details, and "SLATE's reading" is the
    // glossary's "estimated", kept apart from the standings the Bulletin gives.
    const school = [...CHAPTER_BY_ID.school!.body, ...(CHAPTER_BY_ID.school!.more ?? [])].join(' ');
    expect(school).toContain('The standings come from the Yale Bulletin. The Bulletin has the faculty evaluate students regularly; one review a term, and its floors and its steps, are estimated.');
    expect(school).toContain('The note is the game’s, written as your course’s teachers would say it.');
  });

  it('PLAYER JOURNEY: the notices of a standing and of a casting are SLATE’s words for the decision and name nobody as having said them; the Standing tab keeps the chair and the dean by name, as the Bulletin gives them', () => {
    const { sim } = journeyB();
    const chair = 'Tamilla Woodard';
    const decided = [...journeyB().told.log.values()].filter((n) => ['In Good Standing', 'A Notice Of Academic Concern', 'Academic Warning'].includes(n.title) || n.title.startsWith('Cast: '));
    expect(decided.length).toBeGreaterThan(5);
    for (const n of decided) expect(n.body, n.title).not.toContain(chair);
    expect(decided.filter((n) => n.title === 'In Good Standing').every((n) => n.body.startsWith('The acting faculty find you in good standing.'))).toBe(true);
    expect(decided.filter((n) => n.title.startsWith('Cast: ')).every((n) => n.body.startsWith('The chair of Acting has cast you '))).toBe(true);
    const tab = drawn(sim, SchoolWorkspace, 'standing').text;
    expect(tab).toContain(`${chair}: Chair Of Acting`);
    expect(tab).toContain('The game also gives an Incomplete for classes missed ill, where the Bulletin has the student ask the instructor for one and petition for any extension.');
  }, 900_000);
});
