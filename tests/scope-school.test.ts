/**
 * The current scope's school rows, 2026-10-15: what `school.respond`, `school.request_repeat`,
 * `school.request_extra_term` and `school.request_conversion` still owed when the scope's acceptance began.
 *
 * - `school.respond` and an older save. Until 2026-10-15 the engine, the guide and the row said “That evening has
 *   passed.” was reached from a save made before 2026-10-12, whose moments waited until ten the next evening. No build
 *   wrote one: `CLASS.answerHours` has been 22 since the class came in (2026-10-07), and what changed on 2026-10-12 was
 *   its comment's words. The four real saves under tests/fixtures, written by `tools/scenarios.ts` at ff837dfa
 *   (2026-10-10) and 086d00ca (2026-10-11), are opened here as the game opens a slot (`openSlot`, `migrate`,
 *   `loadSave`): every moment in them lapses 22 hours after its nine o'clock class, every invitation's evening twelve
 *   hours or more after that. What an older save can hold is different: before 2026-10-13 a leave, a withdrawal or a
 *   dismissal called a moment's lapse off, and the moment stayed open for good, its answers live, a Say Yes after its
 *   evening refused “That evening has passed.”, and every moment after it stopped (`classMoment` draws none while one is
 *   open). No save under tests/fixtures holds one, so one is made here (FIXTURE): a life played by this build, the lapse
 *   called off at the leave's start as those builds called it off, and played on by this build's systems without the
 *   steps `loadSave` runs. Opened, it was left so until 2026-10-15; since then `loadSave` lapses it at its hour
 *   (`strandedMoments`, systems/classmates.ts). “That evening has passed.” is a guard now, tested as one.
 * - `school.request_repeat`: a last year's repeat asked, granted, and the repeated year played to Commencement 2030;
 *   and a first year repeated and its course failed again, whose notice offered the year's end to ask to repeat it
 *   until 2026-10-15, where the year can't be repeated twice (`tellFails`, systems/courserecord.ts; until 2026-10-15
 *   `settleCourses` told it, before the evaluation). A Fail at an evaluation that dismissed offered the year's end too
 *   until 2026-10-15: both dismissals are played, the faculty's review and the warning unmet, each beside earlier Fails
 *   still offered it, the Fail told after the dismissal. A Permanent Incomplete in a repeated year is played (a first
 *   year repeated, its fall's Acting I called in sick), whose notice offered the repeat until 2026-10-15. So is a Fail
 *   in a later year after a repeat (the second fall's Clown, the first year repeated and passed), at an evaluation
 *   that ends nothing: its notice offered the year's end until 2026-10-15, where “Repeating would make 10 semesters”
 *   refused it, and the year's end, played, has no Ask To Repeat The Year…. A first fall's Fail before a two-term
 *   medical leave begun at the spring is played back to the year's end and its repeat granted, which until 2026-10-15
 *   was refused, “Every course this year was passed”: the year's courses were picked by calendar term (`repeatCourses`,
 *   systems/leave.ts). The last year's repeat bills its two terms past six at a figure worked from the Bulletin's
 *   tuition and Yale Health plan, asserted until 2026-10-15 only as something owed. The decision's
 *   own refusals are reached by no valid state (the decision recounts the semesters as the asking did, and no
 *   evaluation falls between them, tests/evidence2-b09.test.ts says why); they stay, tested as guards.
 * - `school.request_extra_term`: an additional term attended and its retake failed again: the degree withheld at that
 *   evaluation, and nothing more to ask. Its Fail's notice told the student to ask to repeat the year at its end until
 *   2026-10-15, which the withholding then refused. The refusals past nine semesters and for a disqualification are
 *   guards, tested as guards.
 * - `school.request_conversion`: the refusal a first-year student with no hours meets moves nothing; and conversion
 *   across a repeated year: each year's hours paid once, kept apart by the year, through reloads and asking again. A
 *   processing that finds no hours (‘No Hours To Convert’) is a guard, tested as one.
 *
 * Every figure is worked here from the rules' own numbers and written as a literal, never asked of the engine's helper:
 * 22 hours from a nine o'clock class to its answer's lapse, an invitation's evening at seven a day or more after its
 * class, 1 of trust for an invitation left unanswered; five of Yale's working days to a decision, at six; a course
 * passed at three quarters of its meetings; the Bulletin's nine semesters; six hours at $23.00, $138.00; a term past six
 * in 2029–2030, $24,784.65.
 *
 * PLAYER JOURNEYS: new lives (`createSave` with `newLifeConfig`), Ada Cole, born in New York, at Yale in New Haven
 * from Monday 24 August 2026, played by the clock. A course is failed as a player fails one, by sleeping through its
 * meetings (`life.sleep` at one in the morning for ten hours), as tests/evidence-g26-school.test.ts fails one.
 * The seeds are arbitrary, none picked for what it draws: e3-r1 and g26-l3 (tests/evidence3-school.test.ts's and
 * tests/evidence-g26-school.test.ts's own, to compare), sc-x3, sc-c0, sc-cr, sc-cg, sc-dq, sc-lv.
 * g26-l3 stands where sc-l3 was tried first: that life's last spring was withheld for 23 of its 46 pieces unready,
 * which these rows aren't about, and wasn't looked into here.
 *
 * TEST SETUP, said again where it's done:
 * - the coursework prepared each midnight and the student rested, fed and awake each time the clock moves, as
 *   tests/evidence-g26-school.test.ts plays one, so nothing but a row's own steps falls short at an evaluation;
 * - the flu on a day called in sick, and before a medical leave for a physician's recommendation, as illness comes by
 *   the draw;
 * - for need-based aid, the family Scraping, as creation's select gives it (family unset, wealth 'scraping';
 *   tests/evidence3-school.test.ts shows the select's own change gives this config);
 * - a second Fail, nine enrolled terms, or the hours converted put on the record by hand, where only a guard is
 *   reached: said where it's done.
 * FIXTURE: an older build's save reshaped from one this build wrote, said where it's made, with what it stands for.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createSave, loadSave, openSlot, registerAllSystems, Simulation } from '@/engine';
import type { SaveUniverse } from '@/engine/domain/model';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts, type Instant } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { LOCAL_STORE, LocalSaveAdapter } from '@/engine/persistence/local';
import { PREP_DIMS } from '@/engine/content/coursework';
import { courseworkOf, trustOf } from '@/engine/systems/coursework';
import { MOMENT_KIND, STUDY_KIND, momentsOf } from '@/engine/systems/classmates';
import { CLASSES_KIND, CONFERRAL_KIND, SHIFT_KIND, TERM_KIND, classPeriod, coursesOn, isClassDay, keyOf, termStart } from '@/engine/systems/school';
import { EXTRA_DECIDE_KIND, REPEAT_DECIDE_KIND, accountOwed, enrolledTerms } from '@/engine/systems/leave';
import { healthOf } from '@/engine/systems/health';
import type { SchoolDate } from '@/engine/content/school';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; label: string; title?: string; disabled: boolean; onClick?: () => void }[],
  toasts: [] as string[],
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
    toast: (message: string) => { h.toasts.push(message); },
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

const { RepeatPanel, WorkLimitsBlock } = await import('@/ui/components/StudyPlanPanels');

// ---------------------------------------------------------------------------
// The lives, the clock, the screen, and a slot opened as the game opens one
// ---------------------------------------------------------------------------

const ZONE = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, ZONE);
const hourOf = (t: Instant) => zonedParts(t, ZONE).hour;

/** TEST SETUP: the work done each midnight, every open piece's every part prepared. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
const ADA = { homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' };
/** TEST SETUP: the Scraping family, as creation's select gives it. */
const SCRAPING = { family: undefined, wealth: 'scraping' };
const life = (seed: string, extra: Record<string, unknown> = {}) => working(createSave(1, seed, { ...newLifeConfig(), ...ADA, ...extra }));
const freeze = (sim: Simulation): string => JSON.stringify(sim.universe);
const thaw = (snap: string): Simulation => working(loadSave(JSON.parse(snap) as never));
const reload = (sim: Simulation) => working(loadSave(deserialise(serialise(sim.universe)) as never));
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

/** A device's store kept in memory, as the browser's local storage is. */
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(key: string) { return this.map.get(key) ?? null; }
  key(index: number) { return [...this.map.keys()][index] ?? null; }
  removeItem(key: string) { this.map.delete(key); }
  setItem(key: string, value: string) { this.map.set(key, value); }
}
/**
 * PLAYER JOURNEY: a save written to a slot, and the slot opened as the game opens one (SaveSlots.tsx, SlateApp.tsx):
 * `openSlot`, which migrates it, and `loadSave` of what it hands back.
 */
async function opened(text: string): Promise<Simulation> {
  const adapter = new LocalSaveAdapter(LOCAL_STORE);
  const u = deserialise(text);
  await adapter.save(u);
  const got = await openSlot(adapter, u.meta.slot);
  if ('error' in got) throw new Error(got.error);
  return working(loadSave(got.universe));
}

/** A screen as the player has it: its markup; the Gated buttons it drew are in `h.clicks`. */
function drawn(sim: Simulation, screen: FunctionComponent): { html: string; text: string } {
  h.sim = sim;
  h.clicks = [];
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  return { html, text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
}
const drew = (feature: string) => h.clicks.filter((c) => c.feature === feature);
/** A Stat tile's figure and its note, by its label. */
const stat = (html: string, label: string) => {
  const m = html.match(new RegExp(`<span class="stat-label">${label}</span><span class="stat-value[^"]*">([^<]*)</span>(?:<span class="stat-note">([^<]*)</span>)?`));
  return m ? { value: m[1], note: m[2] } : undefined;
};

// ---------------------------------------------------------------------------
// school.respond
// ---------------------------------------------------------------------------

const FIXTURES = ['old-tax-plan-ff837dfa', 'old-leave-ff837dfa', 'old-nonfiler-086d00ca', 'old-state-plan-086d00ca'] as const;
const fixture = (name: string) => gunzipSync(readFileSync(`tests/fixtures/${name}.json.gz`)).toString('utf8');
const momentsNow = (sim: Simulation) => momentsOf(courseworkOf(sim, sim.player)!);
const momentOf = (sim: Simulation, id: string) => momentsNow(sim).find((m) => m.id === id)!;
const respond = (sim: Simulation, momentId: string, choice: string) => sim.execute({ kind: 'school.respond', payload: { momentId, choice } });

/** e3-r1, its family the one a new life is given (Wealthy, so a leave returns no aid), on Tuesday 12 January 2027 at ten. */
const jan12 = once(() => { const sim = life('e3-r1'); tend(sim, at(2027, 1, 12, 10)); return freeze(sim); });
/**
 * The personal leave asked at ten on the 12th begins when it's decided, at ten on Wednesday 20 January 2027 (five of
 * Yale's working days, Martin Luther King Day closed), with the nine o'clock class's invitation open: the save at 10:01.
 */
const leaveBegun = once(() => {
  const sim = thaw(jan12());
  sim.must({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
  tend(sim, at(2027, 1, 20, 10, 1));
  return freeze(sim);
});
/**
 * FIXTURE: the save as a build before 2026-10-13 wrote it at the same minute. Those builds' leave called off every
 * pending school item of the student's, the moment's lapse with it (leave.ts `kept()` at ff837dfa had no MOMENT_KIND),
 * at the leave's start, ten o'clock; everything else is as this build wrote it.
 */
const asOlderBuild = (text: string): string => {
  const u = JSON.parse(text) as SaveUniverse;
  const lapse = u.scheduled.filter((i) => i.kind === MOMENT_KIND && i.status === 'pending');
  expect(lapse, 'one moment open, its lapse pending').toHaveLength(1);
  Object.assign(lapse[0]!, { status: 'cancelled', resolvedAt: at(2027, 1, 20, 10) });
  return JSON.stringify(u);
};
/** FIXTURE: an older build's save played on by this build's systems alone, without what `loadSave` does to a save. */
const playedAsOlderBuild = (text: string, until: Instant): string => {
  const sim = working(new Simulation(JSON.parse(text) as SaveUniverse));
  registerAllSystems(sim);
  tend(sim, until);
  return freeze(sim);
};

describe('school.respond', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true, writable: true });
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage');
  });

  it('PLAYER JOURNEY: the four real saves from before 2026-10-12, opened as the game opens a slot, hold no moment that waits past its evening: each lapses 22 hours after its nine o’clock class, every invitation’s evening twelve hours or more after that', async () => {
    let all = 0;
    let invitations = 0;
    for (const name of FIXTURES) {
      const sim = await opened(fixture(name));
      const ms = momentsNow(sim).filter((m) => m.status !== 'said');
      all += ms.length;
      for (const m of ms) {
        expect([name, m.id, hourOf(m.at), m.until - m.at]).toEqual([name, m.id, 9, 22 * MS_HOUR]);
        if (m.kind !== 'study') continue;
        invitations += 1;
        expect(hourOf(m.when!)).toBe(19);
        expect(m.when! - m.until, `${name} ${m.id}`).toBeGreaterThanOrEqual(12 * MS_HOUR);
      }
    }
    // 169 moments that wanted an answer across the four, 53 of them invitations to run lines.
    expect([all, invitations]).toEqual([169, 53]);
  }, 120_000);

  it('PLAYER JOURNEY: the one moment open in them, a request for help in the save of 22 February 2028, is answered before its hour and lapses at seven the next morning, its answers refused then, through a save', async () => {
    const text = fixture('old-state-plan-086d00ca');
    const open = await opened(text);
    const [m] = momentsNow(open).filter((x) => x.status === 'open');
    expect([m!.kind, m!.at, m!.until, open.now]).toEqual(['help', at(2028, 2, 22, 9), at(2028, 2, 23, 7), at(2028, 2, 22, 19, 15)]);
    expect(pendingOf(open, MOMENT_KIND).map((i) => [i.at, i.payload.momentId])).toEqual([[at(2028, 2, 23, 7), m!.id]]);
    // Said no that evening: taken, its lapse off the calendar, and nothing of it left to lapse through a save.
    const no = await opened(text);
    expect(respond(no, m!.id, 'no').ok).toBe(true);
    const saved = reload(no);
    expect(momentOf(saved, m!.id)).toMatchObject({ status: 'answered', choice: 'no' });
    expect(pendingOf(saved, MOMENT_KIND)).toHaveLength(0);
    // Left: open at 6:59, lapsed at 7:01, a request for help costing nothing for it; both answers refused.
    const trust = trustOf(open.player.school!.classmates[m!.mate]!);
    tend(open, at(2028, 2, 23, 6, 59));
    expect(momentOf(open, m!.id).status).toBe('open');
    tend(open, at(2028, 2, 23, 7, 1));
    expect(momentOf(open, m!.id).status).toBe('lapsed');
    expect(trustOf(open.player.school!.classmates[m!.mate]!)).toBe(trust);
    for (const choice of ['help', 'no']) expect(respond(open, m!.id, choice).error).toBe('It’s too late to answer: the moment passed.');
    expect(momentOf(reload(open), m!.id).status).toBe('lapsed');
  }, 120_000);

  it('DEFECT: a save from before 2026-10-13 with an invitation stranded open by a leave (FIXTURE), opened as the game opens a slot, has its lapse back on the clock once, and it lapses at seven as the same save this build made does', async () => {
    const made = leaveBegun();
    const now = thaw(made);
    const [m] = momentsNow(now).filter((x) => x.status === 'open');
    // The class at nine brought an invitation for Saturday the 23rd at seven in the evening, its answer due at seven the next morning.
    expect([m!.kind, m!.at, m!.until, m!.when, now.player.school!.leave!.status]).toEqual(['study', at(2027, 1, 20, 9), at(2027, 1, 21, 7), at(2027, 1, 23, 19), 'on']);
    const sim = await opened(asOlderBuild(made));
    expect(pendingOf(sim, MOMENT_KIND).map((i) => [i.at, i.payload.momentId])).toEqual([[at(2027, 1, 21, 7), m!.id]]);
    // Opened again: one lapse, not two.
    const again = await opened(serialise(sim.universe));
    expect(pendingOf(again, MOMENT_KIND)).toHaveLength(1);
    const trust = trustOf(now.player.school!.classmates[m!.mate]!);
    for (const s of [sim, now]) tend(s, at(2027, 1, 21, 7, 1));
    for (const s of [sim, now]) {
      expect(momentOf(s, m!.id).status).toBe('lapsed');
      // An invitation left unanswered costs the trust 1 (`CLASS.study.unanswered`).
      expect(trustOf(s.player.school!.classmates[m!.mate]!)).toBe(trust - 1);
    }
    // At half past seven on the 23rd, its evening past: refused as the moment passed, not as the evening has.
    tend(sim, at(2027, 1, 23, 19, 30));
    for (const choice of ['yes', 'no']) expect(respond(sim, m!.id, choice).error).toBe('It’s too late to answer: the moment passed.');
    expect(pendingOf(sim, STUDY_KIND)).toHaveLength(0);
  }, 120_000);

  it('DEFECT: the same older save played on past the evening and saved on leave, opened, has the invitation lapsed at once, the trust charged once through a save, and back from the leave the class brings moments again', async () => {
    // FIXTURE: the older build's save at 10:01 played on by this build's systems alone to Monday 1 February 2027 at
    // noon: the moment open, its hour and its evening past, as those builds left it.
    const made = leaveBegun();
    const text = playedAsOlderBuild(asOlderBuild(made), at(2027, 2, 1, 12));
    const older = working(new Simulation(JSON.parse(text) as SaveUniverse));
    registerAllSystems(older);
    const [m] = momentsNow(older).filter((x) => x.status === 'open');
    expect([m!.kind, m!.until, m!.when]).toEqual(['study', at(2027, 1, 21, 7), at(2027, 1, 23, 19)]);
    const trust = trustOf(older.player.school!.classmates[m!.mate]!);
    const sim = await opened(text);
    expect(momentOf(sim, m!.id).status).toBe('lapsed');
    expect(trustOf(sim.player.school!.classmates[m!.mate]!)).toBe(trust - 1);
    for (const choice of ['yes', 'no']) expect(respond(sim, m!.id, choice).error).toBe('It’s too late to answer: the moment passed.');
    const back = await opened(serialise(sim.universe));
    expect(trustOf(back.player.school!.classmates[m!.mate]!)).toBe(trust - 1);
    expect(pendingOf(back, MOMENT_KIND)).toHaveLength(0);
    expect(back.player.school!.leave).toMatchObject({ status: 'on' });

    // Back from the leave, notice given and registered as the Standing tab asks: four weeks of the term it returns to.
    const returned = (s: Simulation) => {
      const l = s.player.school!.leave!;
      s.must({ kind: 'school.return_notice', payload: {} });
      const term = pendingOf(s, TERM_KIND).find((i) => i.payload.term === l.returnTerm)!;
      tend(s, term.at + MS_HOUR);
      expect(s.player.school!.leave, 'back').toBeUndefined();
      s.must({ kind: 'school.reregister', payload: {} });
      tend(s, term.at + 28 * MS_DAY);
      return momentsNow(s).filter((x) => x.at > term.at);
    };
    // Opened by this build, the class brings moments again.
    expect(returned(back).length).toBeGreaterThan(0);
    // The older build's save, played on by its systems alone: the invitation still open, and nothing brought since.
    expect(returned(older)).toHaveLength(0);
    expect(momentOf(older, m!.id).status).toBe('open');
  }, 120_000);

  it('GUARD: “That evening has passed.”, reached by no save this build opens: an invitation held open past its evening in memory, its lapse called off by hand, refuses Say Yes in those words and takes Say No', () => {
    const sim = thaw(leaveBegun());
    const [m] = momentsNow(sim).filter((x) => x.status === 'open');
    // TEST SETUP: the lapse called off in memory, as an older build left it, with no opening between to put it back.
    for (const i of pendingOf(sim, MOMENT_KIND)) sim.timeline.cancel(i.id, sim.now);
    tend(sim, at(2027, 1, 23, 19, 30));
    expect(momentOf(sim, m!.id).status).toBe('open');
    expect(respond(sim, m!.id, 'yes').error).toBe('That evening has passed.');
    expect(pendingOf(sim, STUDY_KIND)).toHaveLength(0);
    expect(respond(sim, m!.id, 'no').ok).toBe(true);
    expect(momentOf(sim, m!.id)).toMatchObject({ status: 'answered', choice: 'no' });
  }, 120_000);
});

// ---------------------------------------------------------------------------
// A course failed as a player fails one, and the lives played once and copied for each test
// ---------------------------------------------------------------------------

const onDay = (d: SchoolDate, hour: number): Instant => instantFromZoned({ ...d, hour }, ZONE);
const plusDays = (d: SchoolDate, days: number): SchoolDate => { const t = new Date(Date.UTC(d.year, d.month - 1, d.day + days)); return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() }; };
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
 * asked, from the day it's called: the day's classes at nine slept through. Days with other work due, or anything else
 * to be at, are passed over.
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
const recordsOf = (sim: Simulation, term: number) => Object.entries(sim.player.school!.courses ?? {}).filter(([, r]) => r.term === term);
/** TEST SETUP: a second course of a term, passed at its evaluation, put on the record as failed, which no play does after the evaluation. */
function secondFail(sim: Simulation, term: number, except: string): void {
  const [, r] = recordsOf(sim, term).find(([, x]) => x.result === 'pass' && x.code !== except)!;
  r.result = 'fail';
  r.why = 'TEST SETUP';
}

const MOVEMENT_III = 'DRAM 373a';
/**
 * g26-l3 (tests/evidence-g26-school.test.ts's seed, born here in New York): the third year's fall with Movement Invention III (DRAM 373a, Wednesdays, thirteen meetings) slept through four
 * times, failed at its evaluation; the last spring passed, and its evaluation at five on Friday 27 April 2029 offers
 * thirty days, to 27 May, to ask for a repeat or an additional term.
 */
const l3 = once(() => {
  const sim = life('g26-l3');
  tend(sim, at(2028, 9, 1, 0));
  const missed = sleepThrough(sim, 4, MOVEMENT_III, 4);
  tend(sim, at(2029, 4, 27, 18));
  return { missed, lastEval: freeze(sim) };
});
const TABLE_WORK = 'DRAM 163b';
/** sc-x3: the first spring with Text Analysis I (DRAM 163b, Thursdays) slept through four times, failed at the evaluation of Friday 23 April 2027. */
const firstSpring = once(() => {
  const sim = life('sc-x3');
  tend(sim, at(2027, 1, 11, 0));
  const missed = sleepThrough(sim, 1, TABLE_WORK, 4);
  tend(sim, at(2027, 4, 23, 18));
  return { missed, afterSpring1: freeze(sim) };
});

// ---------------------------------------------------------------------------
// school.request_repeat
// ---------------------------------------------------------------------------

describe('school.request_repeat', () => {
  it('PLAYER JOURNEY: a last year’s repeat asked, granted, and the year played again: the third year’s courses meet in Fall Term 2029 and Spring Term 2030, Movement Invention III passed on the retake beside its Fail, both terms billed past six and paid, and the degree conferred at Commencement 2030, once, through a save', () => {
    let sim = thaw(l3().lastEval);
    const school = () => sim.player.school!;
    expect(l3().missed).toHaveLength(4);
    expect(school().courses![`4:${MOVEMENT_III}`]).toMatchObject({ result: 'fail', academic: 4 });
    expect(school().repeatBy).toBe(at(2029, 5, 27, 17));
    // Five of Yale's working days from Friday 27 April at six: Friday 4 May at six.
    expect(sim.must<{ decideAt: Instant }>({ kind: 'school.request_repeat', payload: {} }).decideAt).toBe(at(2029, 5, 4, 18));
    sim = reload(sim);
    tend(sim, at(2029, 5, 4, 19));
    expect(school().repeat).toMatchObject({ status: 'granted', decidedAt: at(2029, 5, 4, 18) });
    expect(school()).toMatchObject({ offset: 2, classOf: 2030, repeatedYears: [3] });
    // The third year's courses, as Fall Term 2028 and Spring Term 2029 had them, each again against its program term.
    const fall28 = recordsOf(sim, 4).map(([, r]) => r.code).sort();
    const spring29 = recordsOf(sim, 5).map(([, r]) => r.code).sort();
    expect([fall28.length, spring29.length]).toEqual([10, 10]);
    // Fall Term 2029, Monday 27 August at nine: the seventh term enrolled, billed past the six the scholarship supports.
    tend(sim, at(2029, 8, 27, 10));
    expect(enrolledTerms(school())).toHaveLength(7);
    // Billed, as no family need is found for her (the living scholarship isn't paid past six, and the health fee with
    // it): the Bulletin's 2026–2027 tuition, $40,750 a year, and Yale Health plan, $3,764, carried on three years at
    // 3.22% and 8.10% a year (content/school.ts, COST_2026_27 and YALE_COST_GROWTH), halved for a term and rounded to
    // the cent: $40,750 × 1.0322³ = $44,814.56 a year, $22,407.28 a term; $3,764 × 1.081³ = $4,754.74, $2,377.37 a
    // term; $24,784.65 owed. Until 2026-10-15 it was asserted only as something owed.
    expect(accountOwed(sim, sim.player)).toBe(24_784_65);
    sim.must({ kind: 'school.pay_balance', payload: {} });
    expect(accountOwed(sim, sim.player)).toBe(0);
    sim = reload(sim);
    tend(sim, at(2030, 1, 7, 10));
    expect(enrolledTerms(school())).toHaveLength(8);
    // Spring Term 2030 is the same academic year, 2029–2030, three years on: the same $24,784.65.
    expect(accountOwed(sim, sim.player)).toBe(24_784_65);
    sim.must({ kind: 'school.pay_balance', payload: {} });
    // The spring's evaluation, Friday 26 April 2030 at five.
    tend(sim, at(2030, 4, 26, 18));
    const fall29 = recordsOf(sim, 6);
    const spring30 = recordsOf(sim, 7);
    expect(fall29.map(([, r]) => r.code).sort()).toEqual(fall28);
    expect(spring30.map(([, r]) => r.code).sort()).toEqual(spring29);
    expect(fall29.every(([, r]) => r.academic === 4 && r.result === 'pass')).toBe(true);
    expect(spring30.every(([, r]) => r.academic === 5 && r.result === 'pass')).toBe(true);
    // The attempts kept: the Fail of Fall Term 2028 beside the pass of Fall Term 2029.
    expect(school().courses![`4:${MOVEMENT_III}`]).toMatchObject({ result: 'fail', academic: 4 });
    expect(school().courses![`6:${MOVEMENT_III}`]).toMatchObject({ result: 'pass', academic: 4 });
    expect(school().standing).toBe('good');
    // Commencement, Monday 20 May 2030 at ten: the degree, once, through a save.
    tend(sim, at(2030, 5, 20, 14));
    expect(school().standing).toBe('graduated');
    expect(titled(sim, 'Your MFA Is Conferred')).toHaveLength(1);
    sim = reload(sim);
    tend(sim, at(2030, 6, 1, 12));
    expect(titled(sim, 'Your MFA Is Conferred')).toHaveLength(1);
    expect(school().standing).toBe('graduated');
    expect(sim.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('You’re not at school.');
  }, 300_000);

  it('PLAYER JOURNEY: a first year repeated and Text Analysis I slept through again in the repeated spring: its Fail’s notice offers no second repeat, both attempts are kept, and the student, dismissed at that evaluation, has nothing left to ask', () => {
    let sim = thaw(firstSpring().afterSpring1);
    const school = () => sim.player.school!;
    expect(sim.must<{ decideAt: Instant }>({ kind: 'school.request_repeat', payload: {} }).decideAt).toBe(at(2027, 4, 30, 18));
    tend(sim, at(2027, 4, 30, 19));
    expect(school()).toMatchObject({ offset: 2, classOf: 2030, repeatedYears: [1] });
    // Left at the first spring's evaluation in academic concern, with no faculty review: one Fail is short of the Bulletin's two.
    expect([school().standing, (school().reviews ?? []).length]).toEqual(['concern', 0]);
    sim = reload(sim);
    tend(sim, at(2028, 1, 10, 0));
    // Spring Term 2028 is calendar term 3, program term 1 again: its Thursdays slept through four times.
    expect(sleepThrough(sim, 3, TABLE_WORK, 4, 2)).toHaveLength(4);
    tend(sim, at(2028, 4, 28, 18));
    expect(school().courses![`1:${TABLE_WORK}`]).toMatchObject({ result: 'fail', academic: 1 });
    expect(school().courses![`3:${TABLE_WORK}`]).toMatchObject({ result: 'fail', academic: 1 });
    // The first time, the year's end was offered; the second, not, as it isn't to be had. Until 2026-10-15 both offered it.
    const name = 'Text Analysis I: The Actor’s Table Work';
    expect(titled(sim, `Not Passed: ${name}`).map((n) => n.body)).toEqual([
      `${name} wasn’t passed: you were at 9 of its 13 meetings you weren’t excused from. The degree needs every course passed: at the year’s end you can ask to repeat the year, on the Standing tab.`,
      `${name} wasn’t passed: you were at 11 of its 15 meetings you weren’t excused from. The degree needs every course passed.`,
    ]);
    // Dismissed at the same evaluation, in the faculty’s words, with nothing left to ask.
    expect(school().standing).toBe('dismissed');
    expect(titled(sim, 'Dismissed From The School').map((n) => n.body.split('. ')[0])).toEqual(['The warning wasn’t met']);
    expect(sim.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('You’re not at school.');
  }, 300_000);

  it('PLAYER JOURNEY: a first fall with three courses slept through, kept on warning by the faculty’s review, its Fails offered the year’s end; the first spring’s Fail, at which the review dismisses, offered nothing, told after the dismissal', () => {
    let sim = life('sc-dq');
    const school = () => sim.player.school!;
    tend(sim, at(2026, 8, 30, 0));
    // Four Thursdays and four Fridays of Fall Term 2026 slept through, by turns: Thursdays-only DRAM 153a and
    // Fridays-only DRAM 403a/b at 9 of 13, and DRAM 113a/b, which meets on both, at 18 of 26, each under three quarters.
    for (let k = 0; k < 4; k += 1) for (const code of ['DRAM 153a', 'DRAM 403a/b']) expect(sleepThrough(sim, 0, code, 1)).toHaveLength(1);
    tend(sim, at(2026, 12, 11, 18));
    const fall = recordsOf(sim, 0).filter(([, r]) => r.result === 'fail').map(([k, r]) => [k, r.attended, r.meetings - r.excused]);
    expect(fall.sort()).toEqual([['0:DRAM 113a/b', 18, 26], ['0:DRAM 153a', 9, 13], ['0:DRAM 403a/b', 9, 13]]);
    // Three Fails in a term, past the Bulletin’s two: the first review keeps them on warning, the year to be repeated.
    expect([school().standing, school().reviews!.map((r) => r.outcome)]).toEqual(['warning', ['warning']]);
    const offered = /: at the year’s end you can ask to repeat the year, on the Standing tab\.$/;
    const fallFails = sim.universe.notifications.filter((n) => n.title.startsWith('Not Passed: '));
    expect(fallFails).toHaveLength(3);
    for (const n of fallFails) expect(n.body).toMatch(offered);
    sim = reload(sim);
    tend(sim, at(2027, 1, 11, 0));
    // Four Thursdays of Spring Term 2027: Text Analysis I, Thursdays only, at 9 of 13.
    expect(sleepThrough(sim, 1, TABLE_WORK, 4)).toHaveLength(4);
    tend(sim, at(2027, 4, 23, 18));
    expect(school().courses![`1:${TABLE_WORK}`]).toMatchObject({ result: 'fail', attended: 9, meetings: 13, excused: 0 });
    // Already on warning: the review dismisses. The Fail's notice, from 2026-10-15, offers no year's end the dismissal
    // took away, and is told after the dismissal it led to, at the same instant.
    expect([school().standing, school().reviews!.map((r) => r.outcome)]).toEqual(['dismissed', ['warning', 'dismissed']]);
    const name = 'Text Analysis I: The Actor’s Table Work';
    const evaluated = at(2027, 4, 23, 17);
    expect(sim.universe.notifications.filter((n) => n.at === evaluated && n.category === 'school').map((n) => n.title)).toEqual(['Dismissed From The School', `Not Passed: ${name}`]);
    expect(titled(sim, `Not Passed: ${name}`).map((n) => n.body)).toEqual([`${name} wasn’t passed: you were at 9 of its 13 meetings you weren’t excused from. The degree needs every course passed.`]);
    expect(sim.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('You’re not at school.');
  }, 300_000);

  it('PLAYER JOURNEY: a first fall’s Fail, then a two-term medical leave begun at the spring: back in Spring Term 2028, the year’s end offers the repeat the Fail’s notice told of, asked and granted for that course, which until 2026-10-15 was refused as every course passed', () => {
    let sim = life('sc-lv');
    const school = () => sim.player.school!;
    tend(sim, at(2026, 8, 30, 0));
    // Four Thursdays of Fall Term 2026: Play (DRAM 153a, Thursdays only) at 9 of 13, one Fail, short of the Bulletin's two.
    expect(sleepThrough(sim, 0, 'DRAM 153a', 4)).toHaveLength(4);
    tend(sim, at(2026, 12, 11, 18));
    expect(school().courses!['0:DRAM 153a']).toMatchObject({ result: 'fail', academic: 0, attended: 9, meetings: 13, excused: 0 });
    expect(titled(sim, 'Not Passed: Play').map((n) => [n.at, n.body])).toEqual([[at(2026, 12, 11, 17), 'Play wasn’t passed: you were at 9 of its 13 meetings you weren’t excused from. The degree needs every course passed: at the year’s end you can ask to repeat the year, on the Standing tab.']]);
    expect(school().standing).toBe('concern');
    // Monday 14 December, the fall evaluated: a leave begins at the spring. Not a personal one, with Play unpassed.
    tend(sim, at(2026, 12, 14, 10));
    expect(sim.execute({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family', terms: 2 } }).error).toBe('A personal leave asks you to be current with your requirements, and Play isn’t passed.');
    // TEST SETUP: the flu, as illness comes by the draw, for a physician's recommendation. From a spring a leave is two
    // terms: one, or three, would bring them back in a fall to the second halves of year-long courses (`leaveLengths`).
    flu(sim);
    expect(sim.execute({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness', terms: 1 } }).error).toMatch(/^You’d come back in the fall to the second halves of year-long courses/);
    expect(sim.execute({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness', terms: 3 } }).error).toMatch(/^You’d come back in the fall to the second halves of year-long courses/);
    expect(sim.must<{ firstTerm: number; startsNow: boolean }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness', terms: 2 } })).toMatchObject({ firstTerm: 1, startsNow: false });
    tend(sim, at(2027, 1, 15, 12));
    expect(school().leave).toMatchObject({ status: 'on', firstTerm: 1, returnTerm: 3, terms: 2 });
    expect(school().offset).toBe(2);
    sim.must({ kind: 'school.return_notice', payload: {} });
    sim = reload(sim);
    // Back for Spring Term 2028, calendar term 3, program term 1 again, registered before its classes.
    const back = termStart(3).date;
    tend(sim, at(back.year, back.month, back.day, 12));
    expect(school().leaves!.map((l) => l.status)).toEqual(['returned']);
    sim.must({ kind: 'school.reregister', payload: {} });
    // The year's end: the spring's evaluation, Friday 28 April 2028 at five.
    tend(sim, at(2028, 4, 28, 18));
    expect(enrolledTerms(school())).toEqual([0, 3]);
    expect(recordsOf(sim, 3).every(([, r]) => r.academic === 1 && r.result === 'pass')).toBe(true);
    expect(school().endedAt).toBeUndefined();
    // Two enrolled, the year's two again and the program's four after it: eight, inside the Bulletin's nine.
    const panel = drawn(sim, RepeatPanel);
    expect(panel.text).toContain('Ask To Repeat The Year…');
    // Five of Yale's working days from Friday 28 April at six: Friday 5 May at six.
    expect(sim.must<{ decideAt: Instant }>({ kind: 'school.request_repeat', payload: {} }).decideAt).toBe(at(2028, 5, 5, 18));
    expect(school().repeat).toMatchObject({ status: 'pending', year: 1, terms: [0, 3], courses: ['Play'] });
    sim = reload(sim);
    tend(sim, at(2028, 5, 5, 19));
    expect(school().repeat).toMatchObject({ status: 'granted', decidedAt: at(2028, 5, 5, 18), courses: ['Play'] });
    expect(school()).toMatchObject({ offset: 4, classOf: 2031, repeatedYears: [1] });
    expect(titled(sim, 'You’ll Repeat The Year')).toHaveLength(1);
  }, 300_000);

  it('PLAYER JOURNEY: the warning unmet:a first spring’s Fail to concern and a second fall’s to warning, each offered the year’s end; the second spring’s Fail, at which the evaluation dismisses, offered nothing, told after the dismissal', () => {
    let sim = thaw(firstSpring().afterSpring1);
    const school = () => sim.player.school!;
    expect(school().standing).toBe('concern');
    const offered = /: at the year’s end you can ask to repeat the year, on the Standing tab\.$/;
    expect(titled(sim, 'Not Passed: Text Analysis I: The Actor’s Table Work').map((n) => n.body)).toEqual([expect.stringMatching(offered)]);
    tend(sim, at(2027, 8, 30, 0));
    // Four Mondays of Fall Term 2027 slept through: Mondays-only DRAM 263a/b at 9 of 13.
    expect(sleepThrough(sim, 2, 'DRAM 263a/b', 4)).toHaveLength(4);
    tend(sim, at(2027, 12, 31, 12));
    const fall = recordsOf(sim, 2).filter(([, r]) => r.result === 'fail');
    expect(fall.map(([k]) => k)).toEqual(['2:DRAM 263a/b']);
    // Two Fails by the end of the third term, short of the Bulletin's four: no review, and concern steps to warning.
    expect([school().standing, school().reviews ?? []]).toEqual(['warning', []]);
    expect(titled(sim, `Not Passed: ${fall[0]![1].name}`).map((n) => n.body)).toEqual([expect.stringMatching(offered)]);
    sim = reload(sim);
    tend(sim, at(2028, 1, 10, 0));
    // Four Mondays of Spring Term 2028: Mondays-only DRAM 233a/b.
    expect(sleepThrough(sim, 3, 'DRAM 233a/b', 4)).toHaveLength(4);
    tend(sim, at(2028, 5, 1, 12));
    const spring = recordsOf(sim, 3).filter(([, r]) => r.result === 'fail');
    expect(spring.map(([k]) => k)).toEqual(['3:DRAM 233a/b']);
    expect([school().standing, school().reviews ?? []]).toEqual(['dismissed', []]);
    const dismissed = titled(sim, 'Dismissed From The School');
    expect(dismissed.map((n) => n.body.split('. ')[0])).toEqual(['The warning wasn’t met']);
    // The Fail at the evaluation that dismissed: nothing offered, said after the dismissal at the same instant.
    const name = spring[0]![1].name;
    expect(sim.universe.notifications.filter((n) => n.at === dismissed[0]!.at && n.category === 'school').map((n) => n.title)).toEqual(['Dismissed From The School', `Not Passed: ${name}`]);
    expect(titled(sim, `Not Passed: ${name}`).map((n) => n.body)).toEqual([expect.stringMatching(/\. The degree needs every course passed\.$/)]);
    expect(sim.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('You’re not at school.');
  }, 300_000);

  it('PLAYER JOURNEY: a first year repeated, and in the repeated fall Acting I’s meetings called in sick: its Incomplete, not made up, becomes Permanent and offers no repeat at the year’s end, the year being repeated once already', () => {
    let sim = thaw(firstSpring().afterSpring1);
    const school = () => sim.player.school!;
    sim.must({ kind: 'school.request_repeat', payload: {} });
    tend(sim, at(2027, 4, 30, 19));
    expect(school()).toMatchObject({ offset: 2, repeatedYears: [1] });
    sim = reload(sim);
    tend(sim, at(2027, 8, 30, 0));
    // Fall Term 2027 is calendar term 2, program term 0 again: every other one of Acting I's meetings (Monday to
    // Wednesday) called in sick (TEST SETUP: the flu) from the first, eleven of them.
    const acting = classDays(2).filter((d) => coursesOn(d, 2).some((c) => c.code === 'DRAM 103a/b'));
    let called = 0;
    for (const [i, d] of acting.entries()) {
      if (i % 2 === 1 || called >= 11) continue;
      tend(sim, onDay(d, 8));
      flu(sim);
      sim.must({ kind: 'school.call_in_sick', payload: {} });
      called += 1;
    }
    expect(called).toBe(11);
    tend(sim, at(2027, 12, 31, 12));
    const key = '2:DRAM 103a/b';
    // Acting I met 41 times. Twelve were excused: the eleven called in, and Monday 15 November, the morning of an
    // emergency room visit the draw brought. 29 attended, every one of those counted, so no Fail; three quarters of 41
    // is 30.75, so 31 pass it, two short, a week's three meetings to a session: one session owed, thirty days from the
    // evaluation at five on Friday 10 December: Sunday 9 January 2028 at five.
    expect(school().courses![key]).toMatchObject({ result: 'incomplete', academic: 0, meetings: 41, excused: 12, attended: 29, owed: 1, dueBy: at(2028, 1, 9, 17) });
    tend(sim, at(2028, 1, 31, 12));
    expect(school().courses![key]!.result).toBe('permanent');
    // Still at the School: the repeated fall's evaluation stepped concern to warning for its Carlotta work, which this row
    // isn't about; nothing ended it, so only the count keeps the repeat from being offered: on Sunday 9 January 2028 the
    // repeated spring (from Monday 3 January) is the fourth term enrolled, and with the year's two again and the program's
    // four after it that makes ten, past the Bulletin's nine. Until earlier on 2026-10-15 this was said to be the year's
    // having been repeated, a clause `repeatOpen` read then; the count settled it already, and the clause was removed.
    expect([school().standing, school().endedAt]).toEqual(['warning', undefined]);
    // From 2026-10-15: no repeat offered, which `repeatRefusal` would refuse at the year's end. From 2026-10-16 the additional
    // term the last year's end will offer is named in its place (tests/remaining-school.test.ts, “no dead-end warning”).
    expect(titled(sim, 'Permanent Incomplete: Acting I').map((n) => [n.at, n.body])).toEqual([[at(2028, 1, 9, 17), 'Its month ran out, so Acting I carries no credit, and the degree can’t be completed without it. Its year can’t be repeated within the nine semesters the Bulletin allows; after your last year’s evaluation, unless it leaves you on academic warning, you can ask for an additional term to retake it, on the Standing tab.']]);
  }, 300_000);

  it('PLAYER JOURNEY: a first year repeated and passed, then the second fall’s Clown slept through: its Fail, at an evaluation that steps good to concern, offers no repeat, and at the second spring’s end the Standing tab has no Ask To Repeat The Year…, the command refused past the nine semesters', () => {
    let sim = thaw(firstSpring().afterSpring1);
    const school = () => sim.player.school!;
    sim.must({ kind: 'school.request_repeat', payload: {} });
    tend(sim, at(2027, 4, 30, 19));
    expect(school()).toMatchObject({ offset: 2, classOf: 2030, repeatedYears: [1] });
    sim = reload(sim);
    // The repeated year, Fall Term 2027 and Spring Term 2028, played through and passed: good standing again.
    tend(sim, at(2028, 5, 1, 12));
    expect(recordsOf(sim, 3).every(([, r]) => r.result === 'pass')).toBe(true);
    expect([school().standing, enrolledTerms(school())]).toEqual(['good', [0, 1, 2, 3]]);
    sim = reload(sim);
    tend(sim, at(2028, 8, 28, 0));
    // Fall Term 2028 is calendar term 4, program term 2: Mondays-only Clown (DRAM 263a/b) slept through four times.
    expect(sleepThrough(sim, 4, 'DRAM 263a/b', 4, 2)).toHaveLength(4);
    tend(sim, at(2028, 12, 31, 12));
    expect(school().courses!['4:DRAM 263a/b']).toMatchObject({ result: 'fail', academic: 2, attended: 7, meetings: 11, excused: 0 });
    // 7 of 11 is under three quarters. The evaluation of Friday 8 December at five steps good to concern, which ends
    // nothing, so only the count keeps the year's end from being offered: five terms enrolled, the spring to come, the
    // year's two again and the program's two after it make ten, past the Bulletin's nine. Until 2026-10-15 it was offered.
    expect([school().standing, school().endedAt]).toEqual(['concern', undefined]);
    // From 2026-10-16 the additional term the last year's end will offer is named in its place (tests/remaining-school.test.ts).
    expect(titled(sim, 'Not Passed: Clown').map((n) => [n.at, n.body])).toEqual([[at(2028, 12, 8, 17), 'Clown wasn’t passed: you were at 7 of its 11 meetings you weren’t excused from. The degree needs every course passed. Its year can’t be repeated within the nine semesters the Bulletin allows; after your last year’s evaluation, unless it leaves you on academic warning, you can ask for an additional term to retake it, on the Standing tab.']]);
    sim = reload(sim);
    // The year's end: the second spring, Spring Term 2029, played through to its evaluation of Friday 27 April at five.
    tend(sim, at(2029, 4, 27, 18));
    expect(school().endedAt).toBeUndefined();
    expect(enrolledTerms(school())).toEqual([0, 1, 2, 3, 4, 5]);
    // The Standing tab shows the year's Fail but offers no repeat: six enrolled, two again, two after, ten.
    const panel = drawn(sim, RepeatPanel);
    expect(panel.text).toContain('Finishing The Degree');
    expect(panel.text).not.toContain('Ask To Repeat The Year…');
    expect(drew('school.request_repeat')).toEqual([]);
    expect(sim.execute({ kind: 'school.request_repeat', payload: {} }).error).toBe('Repeating would make 10 semesters, past the nine the Bulletin allows for the degree.');
    expect(school().repeat).toMatchObject({ status: 'granted', year: 1 });
  }, 300_000);

  it('GUARD: the decision’s refusal of a first year, which no valid state reaches (a second Fail put on the record between the asking and the deciding): ‘Your Repeat Is Refused’ in its words, the class of 2029 kept', () => {
    const sim = thaw(firstSpring().afterSpring1);
    const school = sim.player.school!;
    expect(firstSpring().missed).toHaveLength(4);
    expect(school.courses![`1:${TABLE_WORK}`]).toMatchObject({ result: 'fail' });
    // Five working days from Friday 23 April at six: Friday 30 April at six.
    expect(sim.must<{ decideAt: Instant }>({ kind: 'school.request_repeat', payload: {} }).decideAt).toBe(at(2027, 4, 30, 18));
    // TEST SETUP: no play fails a course between the asking and the deciding: only an evaluation fails one, where the
    // faculty's review judges the disqualification at once, and none falls between (tests/evidence2-b09.test.ts).
    secondFail(sim, 1, TABLE_WORK);
    tend(sim, at(2027, 4, 30, 19));
    const why = '2 courses failed in Spring Term 2027: the Bulletin disqualifies a student with 2 Failures in a term.';
    expect(school.repeat).toMatchObject({ status: 'refused', why });
    expect(titled(sim, 'Your Repeat Is Refused').map((n) => n.body)).toEqual([`The chair and the dean refused it. ${why}`]);
    expect([school.offset ?? 0, school.classOf, school.repeatedYears]).toEqual([0, 2029, undefined]);
    expect(pendingOf(sim, REPEAT_DECIDE_KIND)).toHaveLength(0);
  }, 300_000);

  it('GUARD: the decision’s refusal of a last year, which no valid state reaches (the same fixture): the degree withheld in its words', () => {
    const sim = thaw(l3().lastEval);
    const school = sim.player.school!;
    sim.must({ kind: 'school.request_repeat', payload: {} });
    // TEST SETUP: a second Fail in Fall Term 2028 put on the record after the last year's evaluation, which no play does.
    secondFail(sim, 4, MOVEMENT_III);
    tend(sim, at(2029, 5, 4, 19));
    const why = '2 courses failed in Fall Term 2028: the Bulletin disqualifies a student with 2 Failures in a term.';
    expect(school.repeat).toMatchObject({ status: 'refused', why });
    expect([school.standing, school.endedAt]).toEqual(['withheld', at(2029, 5, 4, 18)]);
    // What still stands is said with the end, from 2026-10-16 (the owner’s brief’s “no dead-end warning”; tests/remaining-school.test.ts).
    expect(titled(sim, 'The Degree Isn’t Recommended').map((n) => n.body)).toEqual([`The chair and the dean refused your request to repeat the year. ${why} The faculty didn’t recommend the degree, and your terms at the School are over. What you did here stands: every course and its result stay on your record, the productions you played stay on your Profile, and hours you worked are still paid. Practice, and the practice briefs on your Profile, go on outside the School.`]);
    expect(pendingOf(sim, TERM_KIND)).toHaveLength(0);
  }, 300_000);
});

// ---------------------------------------------------------------------------
// school.request_extra_term
// ---------------------------------------------------------------------------

describe('school.request_extra_term', () => {
  it('PLAYER JOURNEY: an additional term granted and attended, Movement Invention III slept through again in it: failed at its evaluation, and what the degree then does, once, through a save', () => {
    let sim = thaw(l3().lastEval);
    const school = () => sim.player.school!;
    expect(sim.must<{ decideAt: Instant; term: number }>({ kind: 'school.request_extra_term', payload: {} })).toEqual({ decideAt: at(2029, 5, 4, 18), term: 6 });
    tend(sim, at(2029, 5, 4, 19));
    expect(school().extraRequest!.status).toBe('granted');
    tend(sim, at(2029, 8, 27, 10));
    sim.must({ kind: 'school.pay_balance', payload: {} });
    sim = reload(sim);
    // The retake meets on Wednesdays, as program term 4 has it: slept through four times in the fourteen.
    const missed = sleepThrough(sim, 6, MOVEMENT_III, 4, 2);
    expect(missed).toHaveLength(4);
    tend(sim, at(2029, 12, 31, 12));
    expect(recordsOf(sim, 6).map(([k, r]) => [k, r.academic, r.result])).toEqual([[`6:${MOVEMENT_III}`, 4, 'fail']]);
    expect([school().standing, school().endedAt]).toEqual(['withheld', at(2029, 12, 14, 17)]);
    // The Fail's notice promises nothing the withholding at the same evaluation takes away: until 2026-10-15 it told
    // them to ask to repeat the year at its end, which `You’re not at school.` then refused.
    expect(titled(sim, 'Not Passed: Movement Invention III').map((n) => n.body)).toEqual([
      'Movement Invention III wasn’t passed: you were at 9 of its 13 meetings you weren’t excused from. The degree needs every course passed: at the year’s end you can ask to repeat the year, on the Standing tab.',
      'Movement Invention III wasn’t passed: you were at 10 of its 14 meetings you weren’t excused from. The degree needs every course passed.',
    ]);
    // What still stands is said with the end, from 2026-10-16 (the owner’s brief’s “no dead-end warning”; tests/remaining-school.test.ts).
    expect(titled(sim, 'The Degree Isn’t Recommended').map((n) => n.body)).toEqual(['The degree needs every course passed, and Movement Invention III wasn’t. You were at 85% of what was asked of you, and your craft grew 0.1 against the class’s 0.1: for the room each of you had to grow, in line with the class. The faculty noted your coursework: 3 of 3 pieces strong or better. Not passed: Movement Invention III. The faculty didn’t recommend the degree, and your terms at the School are over. What you did here stands: every course and its result stay on your record, the productions you played stay on your Profile, and hours you worked are still paid. Practice, and the practice briefs on your Profile, go on outside the School.']);
    expect(titled(sim, 'Your MFA Is Conferred')).toHaveLength(0);
    expect(sim.universe.scheduled.filter((i) => i.kind === CONFERRAL_KIND && i.payload.personId === sim.player.id && i.status === 'pending')).toHaveLength(0);
    // Nothing is left to ask: the School is over.
    for (const kind of ['school.request_repeat', 'school.request_extra_term']) expect(sim.execute({ kind, payload: {} }).error).toBe('You’re not at school.');
    sim = reload(sim);
    tend(sim, at(2030, 1, 31, 12));
    expect([school().standing, titled(sim, 'The Degree Isn’t Recommended').length, pendingOf(sim, TERM_KIND).length]).toEqual(['withheld', 1, 0]);
  }, 300_000);

  /**
   * TEST SETUP: nine terms on the enrolled record at a last year's evaluation. No play puts them there: one repeat is
   * the most the nine allow, which makes eight; a leave's terms aren't enrolled; and no term begins between the asking
   * and the deciding (tests/evidence2-b09.test.ts).
   */
  const nineEnrolled = (sim: Simulation) => { const school = sim.player.school!; school.enrolled = [0, 1, 2, 3, 4, 5, 6, 7, 8]; };

  it('GUARD: past the Bulletin’s nine, which no valid state reaches: refused at the asking in its words, nothing asked; and at the decision, the degree withheld in its words', () => {
    const asking = thaw(l3().lastEval);
    expect(enrolledTerms(asking.player.school!)).toEqual([0, 1, 2, 3, 4, 5]);
    nineEnrolled(asking);
    expect(asking.execute({ kind: 'school.request_extra_term', payload: {} }).error).toBe('It would make 10 semesters, past the nine the Bulletin allows.');
    expect([asking.player.school!.extraRequest, pendingOf(asking, EXTRA_DECIDE_KIND).length]).toEqual([undefined, 0]);
    const sim = thaw(l3().lastEval);
    sim.must({ kind: 'school.request_extra_term', payload: {} });
    nineEnrolled(sim);
    tend(sim, at(2029, 5, 4, 19));
    const why = 'It would make 10 semesters, past the nine the Bulletin allows.';
    expect(sim.player.school!.extraRequest).toMatchObject({ status: 'refused', why });
    expect([sim.player.school!.standing, sim.player.school!.extra, pendingOf(sim, TERM_KIND).length]).toEqual(['withheld', undefined, 0]);
    // What still stands is said with the end, from 2026-10-16 (the owner’s brief’s “no dead-end warning”; tests/remaining-school.test.ts).
    expect(titled(sim, 'The Degree Isn’t Recommended').map((n) => n.body)).toEqual([`The chair and the dean refused an additional term. ${why} The faculty didn’t recommend the degree, and your terms at the School are over. What you did here stands: every course and its result stay on your record, the productions you played stay on your Profile, and hours you worked are still paid. Practice, and the practice briefs on your Profile, go on outside the School.`]);
  }, 300_000);

  it('GUARD: a disqualification the faculty never judged, which no valid state reaches (a second Fail put on the record after the evaluation): refused at the asking in its words; and at the decision, the degree withheld in its words', () => {
    const asking = thaw(l3().lastEval);
    secondFail(asking, 4, MOVEMENT_III);
    expect(asking.execute({ kind: 'school.request_extra_term', payload: {} }).error).toBe('The faculty’s disqualification stands against it.');
    expect(asking.player.school!.extraRequest).toBeUndefined();
    const sim = thaw(l3().lastEval);
    sim.must({ kind: 'school.request_extra_term', payload: {} });
    secondFail(sim, 4, MOVEMENT_III);
    tend(sim, at(2029, 5, 4, 19));
    const why = '2 courses failed in Fall Term 2028: the Bulletin disqualifies a student with 2 Failures in a term.';
    expect(sim.player.school!.extraRequest).toMatchObject({ status: 'refused', why });
    expect(sim.player.school!.standing).toBe('withheld');
    // What still stands is said with the end, from 2026-10-16 (the owner’s brief’s “no dead-end warning”; tests/remaining-school.test.ts).
    expect(titled(sim, 'The Degree Isn’t Recommended').map((n) => n.body)).toEqual([`The chair and the dean refused an additional term. ${why} The faculty didn’t recommend the degree, and your terms at the School are over. What you did here stands: every course and its result stay on your record, the productions you played stay on your Profile, and hours you worked are still paid. Practice, and the practice briefs on your Profile, go on outside the School.`]);
  }, 300_000);
});


// ---------------------------------------------------------------------------
// school.request_conversion
// ---------------------------------------------------------------------------

const RATE = 23_00;
const grantsOf = (sim: Simulation) => sim.universe.transactions.filter((t) => /^Grant-in-aid: \d+ work-study hours converted/.test(t.memo));
/** TEST SETUP: down with the flu until the day's out, which is what lets Call In Sick through. */
const flu = (sim: Simulation) => { healthOf(sim.player).fluUntil = sim.now + MS_DAY; };
/** The first assigned Saturday on or after a day, six hours, called in sick (TEST SETUP: the flu) two hours before. */
function sickSaturday(sim: Simulation, from: Instant, expected: Instant): void {
  tend(sim, from);
  const sat = pendingOf(sim, SHIFT_KIND).filter((i) => i.payload.elective === false)[0]!;
  expect([sat.at, Number(sat.payload.hours)]).toEqual([expected, 6]);
  tend(sim, sat.at - 2 * MS_HOUR);
  flu(sim);
  sim.must({ kind: 'school.call_in_sick', payload: {} });
  tend(sim, sat.at + MS_HOUR);
  expect(sim.universe.scheduled.find((i) => i.id === sat.id)!.status).toBe('missed');
}
/** What a request leaves as it was: the clock, the ledger, the calendar's length, and the bank. */
/**
 * The bank across a processing: the minute before it and the processing itself, the balance's move and what was posted
 * in between, so the account is seen to move by the grant and nothing else.
 */
function acrossProcessing(sim: Simulation, when: Instant): { moved: number; posted: string[] } {
  tend(sim, when - 60_000);
  const bank = () => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
  const [before, count] = [bank(), sim.universe.transactions.length];
  sim.advanceTo(when);
  return { moved: bank() - before, posted: sim.universe.transactions.slice(count).map((t) => t.memo) };
}
const untouched = (sim: Simulation) => JSON.stringify([sim.now, sim.universe.transactions.length, sim.universe.scheduled.length, sim.universe.accounts[sim.player.primaryAccountId!]!.balance]);

describe('school.request_conversion', () => {
  it('PLAYER JOURNEY: in the first fall with no hours excused, the drawn button is grayed and the command refused in January’s words, and neither moves the clock, the ledger, the calendar or the bank, through a save', () => {
    let sim = life('sc-c0', SCRAPING);
    tend(sim, at(2026, 9, 14, 12));
    const words = 'No hours to convert at January’s processing: only assigned hours missed ill or hurt count then.';
    const panel = drawn(sim, WorkLimitsBlock);
    expect(stat(panel.html, 'Convertible To Grant Aid')).toEqual({ value: '0 hours', note: '$0.00 at the rate; 0 converted' });
    expect(drew('school.request_conversion').map((c) => [c.label, c.disabled, c.title])).toEqual([['Ask For Conversion To Grant Aid', true, words]]);
    const before = untouched(sim);
    expect(sim.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe(words);
    expect(untouched(sim)).toBe(before);
    expect(pendingOf(sim, 'school.convert')).toHaveLength(0);
    sim = reload(sim);
    expect(sim.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe(words);
    expect(pendingOf(sim, 'school.convert')).toHaveLength(0);
  }, 120_000);

  it('PLAYER JOURNEY: across a repeated year, a Saturday called in sick in each first fall is converted once each, at January 2027’s and January 2028’s processing, kept apart by the year; asking again is refused, the asking costs no time and posts nothing, and saves between pay nothing twice', () => {
    let sim = life('sc-cr', SCRAPING);
    const school = () => sim.player.school!;
    sickSaturday(sim, at(2026, 9, 1, 8), at(2026, 9, 5, 10));
    expect(school().excusedHours).toEqual({ 0: 6 });
    drawn(sim, WorkLimitsBlock);
    const before = untouched(sim);
    h.toasts = [];
    drew('school.request_conversion')[0]!.onClick!();
    expect(h.toasts).toEqual(['Asked: processed January 15, 2027.']);
    // The asking: no time taken, nothing posted, the bank as it was; one more item on the calendar, the processing.
    const [now, txs, items, bank] = JSON.parse(before) as number[];
    expect(JSON.parse(untouched(sim))).toEqual([now, txs, items! + 1, bank]);
    expect(pendingOf(sim, 'school.convert').map((i) => [i.at, i.payload.year])).toEqual([[at(2027, 1, 15, 12), '0']]);
    expect(sim.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe('Your request is in, for the next processing.');
    sim = reload(sim);
    expect(sim.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe('Your request is in, for the next processing.');
    // The bank across the processing: up by the six hours' $138.00 and nothing else, one posting made.
    const first = acrossProcessing(sim, at(2027, 1, 15, 12));
    expect(first.moved).toBe(138_00);
    expect(first.posted).toEqual([expect.stringMatching(/^Grant-in-aid: 6 work-study hours converted/)]);
    tend(sim, at(2027, 1, 15, 13));
    // Six hours at $23.00, $138.00, all of it into the bank for a resident, and the Scholarship's.
    expect(grantsOf(sim).map((t) => [t.at, t.postings.map((p) => p.amount).sort((a, b) => a - b)])).toEqual([[at(2027, 1, 15, 12), [-6 * RATE, 6 * RATE]]]);
    expect(school().convertedHours).toEqual({ 0: 6 });
    // Asked again: the six are converted, and nothing else is to be had before May.
    expect(sim.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe('No hours to convert yet: hours missed ill or hurt count now, and hours never assigned from May, once the spring’s shifts are done.');

    // The first spring failed, Text Analysis I slept through from the 15th on, and the year repeated.
    expect(sleepThrough(sim, 1, TABLE_WORK, 4)).toHaveLength(4);
    tend(sim, at(2027, 4, 23, 18));
    sim.must({ kind: 'school.request_repeat', payload: {} });
    tend(sim, at(2027, 4, 30, 19));
    expect(school()).toMatchObject({ offset: 2, repeatedYears: [1] });
    sim = reload(sim);
    // The repeated fall, calendar term 2: its first assigned Saturday called in sick, its six hours its own year's.
    sickSaturday(sim, at(2027, 8, 30, 8), at(2027, 9, 4, 10));
    expect(school().excusedHours).toEqual({ 0: 6, 2: 6 });
    expect(sim.must<{ at: Instant; hours: number }>({ kind: 'school.request_conversion', payload: {} })).toEqual({ at: at(2028, 1, 15, 12), hours: 6 });
    sim = reload(sim);
    const second = acrossProcessing(sim, at(2028, 1, 15, 12));
    expect(second.moved).toBe(138_00);
    expect(second.posted).toEqual([expect.stringMatching(/^Grant-in-aid: 6 work-study hours converted/)]);
    tend(sim, at(2028, 1, 15, 13));
    expect(grantsOf(sim).map((t) => [t.at, t.postings.map((p) => p.amount).sort((a, b) => a - b)])).toEqual([
      [at(2027, 1, 15, 12), [-6 * RATE, 6 * RATE]],
      [at(2028, 1, 15, 12), [-6 * RATE, 6 * RATE]],
    ]);
    expect(school().convertedHours).toEqual({ 0: 6, 2: 6 });
    // The notice, one, brought up to the second grant (as a notice of the same title is), its words the six hours'.
    expect(titled(sim, 'Hours Converted To Grant Aid').map((n) => [n.at, n.body.split(',')[0]])).toEqual([[at(2028, 1, 15, 12), '6 work-study hours you couldn’t work became $138.00 of grant aid']]);
    sim = reload(sim);
    tend(sim, at(2028, 2, 1, 12));
    expect(grantsOf(sim)).toHaveLength(2);
    expect(titled(sim, 'Hours Converted To Grant Aid').map((n) => n.at)).toEqual([at(2028, 1, 15, 12)]);
  }, 300_000);

  it('GUARD: a processing that finds no hours, which no valid state reaches (the hours converted put on the record by hand between the asking and the processing): ‘No Hours To Convert’ in its words, nothing paid', () => {
    const sim = life('sc-cg', SCRAPING);
    sickSaturday(sim, at(2026, 9, 1, 8), at(2026, 9, 5, 10));
    sim.must({ kind: 'school.request_conversion', payload: {} });
    // TEST SETUP: nothing lowers the hours between the asking and the processing in play: excused hours only grow, one
    // request is in at a time, and a leave or the School's end calls the request off (tests/evidence2-b09.test.ts).
    sim.player.school!.convertedHours = { 0: 6 };
    tend(sim, at(2027, 1, 15, 13));
    expect(grantsOf(sim)).toHaveLength(0);
    expect(titled(sim, 'No Hours To Convert').map((n) => n.body)).toEqual(['The aid office processed your request and found no work-study hours to convert: none missed ill or hurt, and none never assigned.']);
    expect(titled(sim, 'Hours Converted To Grant Aid')).toHaveLength(0);
    expect(pendingOf(sim, 'school.convert')).toHaveLength(0);
  }, 120_000);
});
