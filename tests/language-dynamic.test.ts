/**
 * The game's sentences built from parts, read in every variant that matters (from 2026-10-17, the owner's brief 14,
 * "Complete Player-Facing Language And Tutorial Overhaul", sections 7 and 8; docs/verification/language-2026-10-17/dynamic/).
 * Eight areas rewrote the words, each its own; this is the one place that holds the brief's dynamic cases across the
 * whole game: one describe for each of section 7's bullets, and one for section 8.
 *
 * Each case runs a generator the game calls, or draws a screen with `renderToStaticMarkup`, on a state the game made,
 * and asks two things of what it printed:
 * - **the words are sound**: none of the faults `tools/text-render-check.mjs` reads a walk's screens for (its own rules,
 *   imported, never copied), every sentence whole, every date the game's own form, a count's noun agreeing with it;
 * - **the meaning holds**: the number, the name, the date, the sum or the standing the variant carries is there, in the
 *   form the game shows it. A fact is held, not a whole sentence, where other areas are still changing the words.
 *
 * TEST SETUP, said where it's done: the day kept rested where only the words are measured; a state no command reaches
 * quickly (a classmate's record, an injury, a sleep owed, a term's shown pieces) put on by hand. FIXTURE: the journey J01
 * (`tools/journeys.ts`, attentive, papers kept, seed j13-1) played through the game's commands alone, saved after its
 * first year and after its degree, at 8283f80c: tests/fixtures/journey-j01-*-8283f80c.json.gz.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeFrom, type NewSaveConfig } from '@/engine/world/bootstrap';
import { deserialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, formatDate, formatRelative, instantFromZoned, type Instant } from '@/engine/core/time';
import { mateRecord, setWork, termWarning, weightsOf } from '@/engine/systems/coursework';
import { personOf } from '@/engine/systems/classmates';
import { healthOf } from '@/engine/systems/health';
import { trainingRefusal } from '@/engine/systems/injury';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';
import '@/ui/looks/all';
import { faultsIn } from '../tools/text-render-check.mjs';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tabs: {} as Record<string, string>,
}));

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

const { Home } = await import('@/ui/screens/Home');
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');

// ---------------------------------------------------------------------------
// Reading what was printed
// ---------------------------------------------------------------------------

/**
 * What a screen says, as a player reads it: a block on a line of its own, and a Stat's label, figure and note each on its
 * own; a styled span beside the next with a space; the inline words (a link that opens something, bold, a plain span)
 * run into the sentence they sit in.
 */
const INLINE = /<\/?(?:strong|em|b|i|a|abbr|small|code)(?:\s[^>]*)?>/g;
const BLOCK = /<\/?(?:p|div|li|ul|ol|td|th|tr|table|thead|tbody|h[1-6]|button|label|summary|details|section|header|select|option|nav|output|figure|figcaption|input)(?:\s[^>]*)?>|<br\s*\/?>/g;
const words = (html: string) => html.replace(/<!-- -->/g, '').replace(/<button[^>]*class="link[^"]*"[^>]*>(.*?)<\/button>/g, '$1').replace(INLINE, '')
  .replace(/<span class="stat-[^"]*">/g, '\n').replace(/<\/?span>/g, '').replace(BLOCK, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n+/g, '\n').trim();
const markup = (node: ReactNode) => words(renderToStaticMarkup(createElement('div', null, node)));

/** A screen as the player has it, its tabs as given. */
function drawn(sim: Simulation, screen: FunctionComponent, tabs: Record<string, string> = {}): string {
  h.sim = sim;
  h.tabs = tabs;
  return words(renderToStaticMarkup(createElement(screen)));
}

/** A look as it opens: its name, kind, summary, body and ways, each line apart. */
function opened(sim: Simulation, kind: string, id: string): { look: Looked; text: string } {
  h.sim = sim;
  const look = resolveLook(sim, at(kind, id)) as Looked;
  expect(look && 'summary' in look, `${kind}/${id} opens`).toBe(true);
  const text = [look.name, look.kind, look.summary, look.body ? markup(look.body) : '', ...(look.ways ?? []).map((w) => `${w.label}\n${w.detail}`), look.provenance ?? ''].join('\n');
  return { look, text };
}

/**
 * What the render check allows here beyond its own list, each with why: a citation's "et al.," reads to its doubled-stop
 * rule as a stop and a comma; a source's whole web address (the check allows a domain) reads to its raw-id rule as an id
 * where its path has an underscore. Each is put in the line's place as the check would read a plain word.
 */
const ALSO_ALLOWED: readonly [RegExp, string, string][] = [
  [/\bet al\.,/g, 'et al', 'a citation’s abbreviation'],
  [/\bhttps?:\/\/[^\s;,()]+[^\s;,.()]/g, 'the address', 'a web address, its path as the source spells it'],
  [/\beVisitor\b/g, 'Visitor', 'Australia’s eVisitor, a real name spelled as its owner spells it'],
];

/** The render check's faults in each line of a text, said with the line, so a failure names what it read. */
function faults(text: string): string[] {
  return text.split('\n').flatMap((line) => {
    let read = line;
    for (const [re, as] of ALSO_ALLOWED) read = read.replace(re, as);
    return faultsIn(read).map((f) => `${f}: ${line}`);
  });
}
/** The words are sound: no fault the render check reads for, in any line. */
const sound = (text: string) => expect(faults(text), text.slice(0, 400)).toEqual([]);
/** A sentence a notice or a refusal says ends whole: a stop, a question or a closing quote or bracket, never a fragment. */
const whole = (text: string) => expect(/[.?!”’)]$/.test(text.trim()), `whole: ${text}`).toBe(true);
/**
 * Every date in it as the game writes one (`formatDate`): "August 24, 2026", never an ISO day, a slashed date, a year
 * run on without its comma, or a day before its month. A day and month alone stay a sentence's own ("August 24 to 28").
 */
const MONTH = '(?:January|February|March|April|May|June|July|August|September|October|November|December)';
const dated = (text: string) => {
  const odd = new RegExp(`\\b\\d{4}-\\d{2}-\\d{2}\\b|\\b\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}\\b|${MONTH} \\d{1,2},?\\d{4}\\b|${MONTH} \\d{1,2} \\d{4}\\b|\\b\\d{1,2} ${MONTH},? \\d{4}\\b`);
  expect(text.split('\n').filter((line) => odd.test(line.replace(/\bhttps?:\/\/\S+/g, ''))), 'a date as the game writes one').toEqual([]);
};
/** A count's noun agrees with it: "1 rehearsal", "of 1 class", never "1 rehearsals" or "of 1 classes". */
const agrees = (text: string, nouns: readonly string[]) => {
  for (const n of nouns) {
    expect(text, `1 ${n}s`).not.toMatch(new RegExp(`(?<![\\d.,])\\b1 (?:more |make-up )?${n}s\\b`));
    expect(text, `of 1 ${n}s`).not.toMatch(new RegExp(`\\bof (?:the |its )?1 (?:more |make-up )?${n}s\\b`));
  }
};

// ---------------------------------------------------------------------------
// Lives
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const on = (year: number, month: number, day: number, hour = 9): Instant => instantFromZoned({ year, month, day, hour }, NY);
/** A student as creation makes one: Ada Cole, born in New York, at Yale from Monday 24 August 2026. */
const student = (seed: string, extra: Partial<NewSaveConfig> = {}) => createSave(1, seed, newLifeFrom({ firstName: 'Ada', lastName: 'Cole', homeRegionId: 'us-ny-newyork', pronouns: 'she/her', wealth: 'comfortable', ...extra }));
/** TEST SETUP: rested, fed and awake each time the clock moves, six hours at a time, so only the words are measured. */
const tended = (sim: Simulation, until: Instant) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
/** FIXTURE: a save of journey J01, opened as the game opens one. */
const journey = (name: 'year-one' | 'degree'): Simulation => loadSave(deserialise(gunzipSync(readFileSync(`tests/fixtures/journey-j01-${name}-8283f80c.json.gz`)).toString('utf8')) as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);

// ---------------------------------------------------------------------------
// 1. Singular and plural; zero, one and many
// ---------------------------------------------------------------------------

describe('singular and plural: zero, one and many of each thing the game counts', () => {
  it('rehearsals with a classmate: none yet, one, several, one more to lift a boundary, and missed by you', () => {
    const sim = student('dyn-rehearsals');
    const mate = sim.player.school!.classmates[0]!;
    // TEST SETUP: the classmate's record as rehearsals kept, stood up and missed leave it (`keptWith`, `noteIncident`).
    const r = mateRecord(mate);
    let seen = opened(sim, 'classmate', '0');
    expect(seen.look.summary).toMatch(/^You haven’t rehearsed together yet; their trust in you is \d+ of 100/);
    sound(seen.text);

    r.kept = 1;
    seen = opened(sim, 'classmate', '0');
    expect(seen.look.summary).toMatch(/^Came to 1 of 1 rehearsal with you;/);
    agrees(seen.text, ['rehearsal']);
    sound(seen.text);

    r.kept = 3; r.stoodUp = 1; r.missedByYou = 1;
    personOf(mate).boundary = { since: sim.now, keptSince: 1, accepted: true };
    seen = opened(sim, 'classmate', '0');
    expect(seen.look.summary).toMatch(/^Came to 3 of 4 rehearsals with you;/);
    // Accepted, a boundary lifts after two kept (`CLASS.boundary.liftAfterKept`): one kept, one to go.
    expect(seen.text).toContain('Wants a day’s notice: that lifts after 1 more rehearsal kept.');
    expect(seen.text).toContain('You missed 1 rehearsal with them.');
    agrees(seen.text, ['rehearsal']);
    sound(seen.text);
    expect(drawn(sim, SchoolWorkspace, { 'tab:/workspace/school': 'coursework' })).toContain('Wants A Day’s Notice (Until 1 More Rehearsal Is Kept)');

    r.missedByYou = 2;
    personOf(mate).boundary = { since: sim.now, keptSince: 0, accepted: false };
    seen = opened(sim, 'classmate', '0');
    // Pushed back on, four (`liftAfterKept.pushedBack`).
    expect(seen.text).toContain('Wants a day’s notice: that lifts after 4 more rehearsals kept.');
    expect(seen.text).toContain('You missed 2 rehearsals with them.');
    expect(seen.look.name).toBe(mate.name);
    sound(seen.text);
    expect(drawn(sim, SchoolWorkspace, { 'tab:/workspace/school': 'coursework' })).toContain('Wants A Day’s Notice (Until 4 More Rehearsals Are Kept)');
  });

  it('the term’s coursework warning: the pieces still set, none, one or several, and the Unready ones, one or several', () => {
    // Eight pieces of the first fall, set as each course sets one (`setWork`), then TEST SETUP: six of them due, their
    // showings' bands and statuses put on by hand as the review's tally reads them (`termTally`), and the warning given
    // as the game gives it after a piece is due.
    const warned = (seed: string, unready: number, missed: number, open: number, oneShort = false) => {
      const sim = student(seed);
      const courses = ['DRAM 113a/b', 'DRAM 103a/b', 'DRAM 123a/b', 'DRAM 133a/b', 'DRAM 143a/b', 'DRAM 873a/b', 'DRAM 403a/b', 'DRAM 153a'];
      const set = courses.map((c, i) => setWork(sim, sim.player, c, { year: 2026, month: 9, day: 1 + i })!);
      expect(set.every(Boolean)).toBe(true);
      // TEST SETUP: Voice I's sequence, the first Unready, prepared but for one part, where `oneShort` asks it.
      if (oneShort) { const a = set[0]!; for (const d of Object.keys(a.prep) as (keyof typeof a.prep)[]) a.prep[d] = 1; a.prep[Object.keys(weightsOf(a))[0] as keyof typeof a.prep] = 0; }
      set.forEach((a, i) => {
        if (i < unready) { a.shown = { band: 'unready', score: 0.3, at: sim.now, strengths: [] }; a.status = 'done'; }
        else if (i < unready + missed) a.status = 'missed';
        else if (i < 6) { a.shown = { band: 'working', score: 0.55, at: sim.now, strengths: [] }; a.status = 'done'; }
        else a.status = i >= 8 - open ? 'open' : 'excused';
      });
      termWarning(sim, sim.player, set[0]!);
      const notice = titled(sim, 'A Word On Your Coursework');
      expect(notice).toHaveLength(1);
      return { sim, body: notice[0]!.body };
    };
    const none = warned('dyn-warn-none', 3, 0, 0);
    expect(none.body).toMatch(/^So far this term, 3 of the 6 pieces you’ve shown were Unready\./);
    expect(none.body).toContain('Everything set so far has been shown.');
    const one = warned('dyn-warn-one', 1, 2, 1, true);
    expect(one.body).toMatch(/^So far this term, 3 of the 6 pieces due were Unready or not shown\./);
    // The one Unready piece shown, short on one part: that part, on the one you showed, and the steps that answer it.
    expect(one.body).toMatch(/ What held most of them back was “[^”]+”, unfinished on the one you showed\. To work on it, use [^.]+\./);
    expect(one.body).toContain('One piece is set and still to be shown.');
    const many = warned('dyn-warn-many', 3, 0, 2);
    expect(many.body).toContain('2 pieces are set and still to be shown.');
    for (const { sim, body } of [none, one, many]) {
      expect(body).toContain(`The faculty reviews the term on ${formatDate(on(2026, 12, 11, 17), NY)}.`);
      expect(body).toContain('the review would give you a notice of academic concern.');
      sound(body); whole(body); dated(body); agrees(body, ['piece']);
      expect(sim.player.school!.standing).toBe('good');
    }
  });

  it('a course’s meetings and the term’s class days on the first day of classes, and make-up sessions owed, one or several', () => {
    const sim = student('dyn-sessions');
    tended(sim, on(2026, 8, 31, 12));
    const standing = drawn(sim, SchoolWorkspace);
    // The first class day: one class day, and one meeting of each course that met.
    expect(standing).toMatch(/Attendance counts 1 of 1 class day\b/);
    expect(standing).toMatch(/: at 1 of 1 class\./);
    agrees(standing, ['class', 'class day', 'call', 'assigned shift']);
    sound(standing);
    // TEST SETUP: Acting I settled Incomplete as `settleCourses` leaves one at the term's end, one session owed or three.
    const courses = sim.player.school!.courses as Record<string, { result?: string; owed?: number; madeUp?: number; dueBy?: number; code: string }>;
    const key = Object.keys(courses).find((k) => courses[k]!.code === 'DRAM 103a/b')!;
    for (const owed of [1, 3]) {
      Object.assign(courses[key]!, { result: 'incomplete', owed, madeUp: 0, dueBy: sim.now + 30 * MS_DAY });
      const line = drawn(sim, SchoolWorkspace).split('\n').find((l) => l.includes(', Incomplete:'))!;
      expect(line).toBe(`Acting I, Incomplete: ${owed} of ${owed} make-up ${owed === 1 ? 'session' : 'sessions'} left, by ${formatDate(sim.now + 30 * MS_DAY, sim.zone)}.`);
      sound(line); dated(line);
    }
  });

  it('days and hours: an injury’s days to mend, the sleep owed, and how far off something is', () => {
    const sim = student('dyn-days');
    const hurt = (days: number) => { healthOf(sim.player).injury = { kind: 'sprain', at: sim.now, until: sim.now + days * MS_DAY - MS_HOUR }; };
    // TEST SETUP: a sprain put on as `mayHurt` puts one.
    hurt(1);
    expect(trainingRefusal(sim.player, sim.now)).toBe('Not with a sprained ankle; it has 1 day yet to mend.');
    hurt(6);
    expect(trainingRefusal(sim.player, sim.now)).toBe('Not with a sprained ankle; it has 6 days yet to mend.');
    // The person's sleep owed, none, one hour and several. TEST SETUP: the debt as nights leave it.
    for (const [debt, said] of [[0, '0 hours.'], [1, '1 hour.'], [5, '5 hours.']] as const) {
      sim.player.wellbeing.sleepDebt = debt;
      const way = opened(sim, 'person', sim.player.id).look.ways!.find((w) => w.label === 'Sleep Debt')!;
      expect(way.detail.startsWith(said)).toBe(true);
      sound(way.detail); whole(way.detail);
    }
    expect([formatRelative(sim.now + MS_DAY, sim.now), formatRelative(sim.now + 3 * MS_DAY, sim.now), formatRelative(sim.now - MS_DAY, sim.now), formatRelative(sim.now + MS_HOUR, sim.now)])
      .toEqual(['in 1 day', 'in 3 days', '1 day ago', 'in 1 hour']);
  });

  it('notices unread, one, several and more than Home shows, and commitments slept through, one or several', () => {
    const sim = student('dyn-notices');
    sim.must({ kind: 'world.mark_read', payload: {} });
    let home = drawn(sim, Home);
    expect(home).not.toMatch(/Mark \d+ Read/);
    sim.notify({ category: 'school', title: 'A First Notice', body: 'One thing happened.', importance: 60 });
    const first = sim.universe.notifications.at(-1)!;
    home = drawn(sim, Home);
    expect(home).toContain('Mark 1 Read');
    expect(opened(sim, 'notification', first.id).look.summary).toBe('It came in just now, and it’s your only unread notice.');
    for (let n = 2; n <= 8; n += 1) sim.notify({ category: 'school', title: `Notice Number ${n}`, body: 'Another thing happened.', importance: 50 });
    home = drawn(sim, Home);
    expect(home).toContain('Mark 8 Read');
    expect(home).toContain('2 more unread.');
    expect(opened(sim, 'notification', first.id).look.summary).toBe('It came in just now. It’s first of your eight unread notices.');
    sim.notify({ category: 'school', title: 'Notice Number 9', body: 'Another thing happened.', importance: 10 });
    expect(drawn(sim, Home)).toContain('3 more unread.');
    sound(home); agrees(home, ['notice']);
    sim.must({ kind: 'world.mark_read', payload: {} });
    expect(opened(sim, 'notification', first.id).look.summary).toBe('You’ve read this notice. It came in just now.');

    // Asleep across what wants you: one commitment, then several. Read from the timeline as `life.sleep` reads it.
    const slept = (hours: number) => {
      const crossed = sim.timeline.between(sim.now, sim.now + hours * MS_HOUR).filter((i) => i.requiresPlayer === true);
      expect(sim.execute({ kind: 'life.sleep', payload: { hours } }).ok).toBe(true);
      return crossed;
    };
    const one = slept(3);
    expect(one).toHaveLength(1);
    let notice = sim.universe.notifications.at(-1)!;
    expect(notice.title).toBe('You Slept Through 1 Commitment');
    expect(notice.body).toBe(`You were asleep for ${one[0]!.label}, so you missed it.`);
    // Tuesday 8 September from seven: the day's classes, then Drama 50's lab at three.
    tended(sim, on(2026, 9, 8, 7));
    const many = slept(10);
    expect(many.length).toBeGreaterThan(1);
    notice = sim.universe.notifications.at(-1)!;
    expect(notice.title).toBe(`You Slept Through ${many.length} Commitments`);
    expect(notice.body).toMatch(/^You were asleep for .+ and .+, so you missed them\.$/);
    for (const c of many) expect(notice.body).toContain(c.label);
    for (const b of [notice.body]) { sound(b); whole(b); }
  });

  it('payments missed in a row and a payment plan’s months, one and several; documents held, none, one and several', async () => {
    const { BankCard } = await import('@/ui/bank/BankCard');
    const { BankCardOffers } = await import('@/ui/bank/BankCardOffers');
    const { PassportPane } = await import('@/ui/papers/Documents');
    const { cardsOf, stateOf } = await import('@/engine/systems/credit');
    const { documentsOf } = await import('@/engine/systems/documents');
    const sim = student('dyn-payments');
    const card = cardsOf(sim, sim.player)[0]!;
    const state = stateOf(sim.player, card);
    const cardText = () => drawn(sim, (() => createElement(BankCard, { bankId: card.bankId! })) as FunctionComponent);
    // TEST SETUP: the card's record as missed due dates leave it (`SUSPEND_AFTER`, two in a row, suspends it).
    for (const missed of [2, 5]) {
      Object.assign(state, { suspended: 'late', missed });
      const line = cardText().split('\n').find((l) => l.startsWith('Suspended:'))!;
      expect(line).toBe(`Suspended: you’ve missed ${missed} payments in a row. It works again once you make a payment on time. Miss six in a row, and what’s owed is charged off to collections.`);
      sound(line);
    }
    delete state.suspended; state.missed = 0;
    // TEST SETUP: a payment plan made of a purchase (`card.plan`), one month to go and four.
    for (const [monthsLeft, said] of [[1, 'for one more month'], [4, 'for 4 more months']] as const) {
      state.plans = [{ left: 30000 * monthsLeft, monthly: 30000, fee: 0, monthsLeft }];
      const line = drawn(sim, (() => createElement(BankCardOffers, { bankId: card.bankId! })) as FunctionComponent).split('\n').find((l) => l.startsWith('A payment plan:'))!;
      expect(line).toBe(`A payment plan: $${(300 * monthsLeft).toLocaleString('en-US')} left, paid at $300 a month ${said}, with no fee and no interest.`);
      sound(line);
    }
    // The passports held, none at first for a New Yorker who never had one (`startingDocuments`), then one applied for.
    const papers = () => drawn(sim, PassportPane);
    const held = () => documentsOf(sim.player).filter((d) => ['passport', 'visa', 'authorization'].includes(d.kind));
    expect(held()).toHaveLength(0);
    expect(papers()).toContain('None held.');
    const applied = sim.must<{ readyAt: number; fee: number }>({ kind: 'documents.apply_passport', payload: {} });
    expect(held()).toHaveLength(1);
    const row = papers().split('\n');
    expect(row.slice(row.indexOf(held()[0]!.name), row.indexOf(held()[0]!.name) + 4)).toEqual([held()[0]!.name, held()[0]!.number, '—', `Ready ${formatDate(applied.readyAt, sim.zone)}`]);
    // Several: a student from London holds her British passport and her F-1 visa, each its own line.
    const abroad = student('dyn-documents-abroad', { homeRegionId: 'uk-eng-london' });
    const theirs = documentsOf(abroad.player).filter((d) => ['passport', 'visa', 'authorization'].includes(d.kind));
    expect(theirs.length).toBeGreaterThan(1);
    const listed = drawn(abroad, PassportPane);
    // Each on its own row: its name, then its number.
    for (const d of theirs) expect(listed).toContain(`${d.name}${d.destination ? '' : `\n${d.number}`}`);
    sound(listed);
    // The entry rules' day, as the game writes a date (`ENTRY_AS_OF`, the data's own ISO day).
    expect(papers()).toContain('. Researched September 29, 2026. Permission to live or work there is separate.');
    sound(papers()); dated(papers());
  });

  it('the advice’s counts: a cost of one point and several, and the pieces that call on an ability, one and several', async () => {
    const { recommendations } = await import('@/engine/systems/experience');
    const { matchedTier } = await import('@/engine/systems/practice');
    // TEST SETUP: one judged piece kept, its limits as a judgment records them (`whole`, what each cost the whole), the
    // advice made of it as `adviceFor` makes it where no forecast is kept.
    type Limit = { kind: string; what: string; label: string; by: number; whole: number };
    const why = (limit: Limit) => recommendations(() => 50, () => 100, [{ at: 1, limits: [limit], inputs: { abilities: { focus: 50 } } }], (id) => ({ id: `ex-${id}` }), matchedTier, 12).map((r) => r.why).join(' ');
    for (const [whole, said] of [[1, '1 point'], [2.5, '2.5 points']] as const) {
      expect(why({ kind: 'preparation', what: 'memorization', label: 'Lines', by: 4, whole })).toContain(`Coming to your work short on lines cost about ${said} off the whole a piece. That’s preparation, not training.`);
      expect(why({ kind: 'condition', what: 'injury', label: 'An Injury Still Mending', by: 4, whole })).toContain(`An Injury Still Mending cost about ${said} off the whole a piece. Come to the work rested and well`);
      expect(why({ kind: 'condition', what: 'stamina', label: 'Stamina, By Beat 2', by: 4, whole })).toContain(`Tiring through the later moments of a piece cost about ${said} off the whole a piece.`);
      expect(why({ kind: 'fit', what: 'tempo', label: 'Played Against The Scene', by: 4, whole })).toContain(`Playing it a way that didn’t fit cost about ${said} off the whole a piece.`);
      expect(why({ kind: 'ability', what: 'focus', label: 'Focus', by: 4, whole })).toContain(`It cost your recent work about ${said} off the whole a piece`);
    }
    // A forecast's count of the recent pieces that call on it: the verb agrees with the count that leads.
    const forecast = (pieces: number, of?: number) => recommendations(() => 50, () => 100, [], (id) => ({ id: `ex-${id}` }), matchedTier, 12, undefined, undefined, new Map([['focus', { points: 0.8, from: 50, to: 55, hours: 20, pieces, ...(of !== undefined ? { of } : {}) }]]))[0]!.why;
    expect(forecast(1, 12)).toContain('(1 of your last 12 pieces calls on it)');
    expect(forecast(5, 12)).toContain('(5 of your last 12 pieces call on it)');
    expect(forecast(1, 1)).toContain('(1 of your last 1 piece calls on it)');
    expect(forecast(1)).toContain('(1 of the pieces calls on it)');
    expect(forecast(3)).toContain('(3 of the pieces call on it)');
    for (const s of [forecast(1, 12), why({ kind: 'preparation', what: 'memorization', label: 'Lines', by: 4, whole: 1 })]) { sound(s); whole(s); agrees(s, ['point', 'piece']); }
  });

  it('nights with the company and the calls and notes of a run, as the run looks back on them: none, one and several', async () => {
    const { reflect } = await import('@/engine/systems/production');
    const sim = student('dyn-nights');
    // TEST SETUP: a run's process as its calls, notes and nights leave it (`processOf`), looked back on once it closes.
    const note = (taken: boolean) => ({ at: sim.now, text: 'Find the turn.', focus: { kind: 'lines' as const }, taken });
    const run = (calls: number, of: number, notes: ReturnType<typeof note>[], together?: { sum: number; n: number; slips: number; covered: number }) =>
      reflect(sim, sim.player, { process: { lines: 0, blocking: 0, calls, of, blockingMissed: 0, notes, trained: 0, ...(together ? { together } : {}) } }, 'The Seagull')!;
    expect(run(1, 1, [note(true)])).toBe('The Seagull: 1 call answered of 1; 1 of 1 note taken.');
    expect(run(0, 3, [])).toBe('The Seagull: 0 calls answered of 3; 0 of 0 notes taken.');
    const many = run(5, 6, [note(true), note(false)], { sum: 312, n: 4, slips: 1, covered: 1 });
    expect(many).toBe('The Seagull: 5 calls answered of 6; 1 of 2 notes taken. With the company the nights came to 78 on average, 1 with a slip in the company, 1 of them covered. What’s still open goes with you into class.');
    for (const s of [many]) { sound(s); whole(s); }
  });
});

// ---------------------------------------------------------------------------
// 2. Different names and pronouns
// ---------------------------------------------------------------------------

describe('different names and pronouns: you, she, he, they, pronouns the game doesn’t know, and long names', () => {
  it('somebody else is spoken of in their own pronouns on their look and their wellbeing, and you as you', () => {
    const sim = student('dyn-pronouns');
    // TEST SETUP: other people as a save can hold them (an older build's family), each a copy of the player under their
    // own id, name and pronouns. The game's own creation offers she/her, he/him and they/them; ze/zir is one it doesn't know.
    const other = (id: string, firstName: string, pronouns: string) => {
      const p = structuredClone(sim.player);
      Object.assign(p, { id, firstName, lastName: 'Okafor', displayName: `${firstName} Okafor`, pronouns });
      sim.universe.people[id] = p;
      return p;
    };
    const cases = [
      { id: sim.player.id, pronouns: 'she/her', kind: 'Yourself', they: 'you', their: 'Your', theyre: 'You’re', lives: 'where you live' },
      { id: other('person_she', 'Maya', 'she/her').id, pronouns: 'she/her', kind: 'Somebody', they: 'she', their: 'Her', theyre: 'She’s', lives: 'where she lives' },
      { id: other('person_he', 'Marcus', 'he/him').id, pronouns: 'he/him', kind: 'Somebody', they: 'he', their: 'His', theyre: 'He’s', lives: 'where he lives' },
      { id: other('person_they', 'Jordan', 'they/them').id, pronouns: 'they/them', kind: 'Somebody', they: 'they', their: 'Their', theyre: 'They’re', lives: 'where they live' },
      { id: other('person_ze', 'Sam', 'ze/zir').id, pronouns: 'ze/zir', kind: 'Somebody', they: 'they', their: 'Their', theyre: 'They’re', lives: 'where they live' },
    ];
    for (const c of cases) {
      const { look, text } = opened(sim, 'person', c.id);
      expect(look.kind, c.pronouns).toBe(c.kind);
      expect(text, c.id).toContain(`${c.their} body.`);
      expect(text, c.id).toContain(`On ${c.their.toLowerCase()} papers. Pronouns ${c.pronouns}. A citizen of the United States.`);
      expect(text, c.id).toContain(c.lives);
      expect(text, c.id).toContain(`How ready ${c.they} ${c.they === 'you' || c.they === 'they' ? 'are' : 'is'} today`);
      sound(text);
      // Their wellbeing, in their words: the sleep they owe, and how clean they keep.
      sim.universe.people[c.id]!.wellbeing.sleepDebt = 0;
      const debt = opened(sim, 'dial', `${c.id}/sleepDebt`).look;
      expect(debt.kind).toBe(`${c.their} Wellbeing`);
      expect(debt.summary).toBe(`None to speak of. ${c.theyre} caught up on sleep.`);
      sim.universe.people[c.id]!.wellbeing.hygiene = 30;
      expect(opened(sim, 'dial', `${c.id}/hygiene`).look.summary).toBe(`30. Under 50, it wears on ${c.their.toLowerCase()} mood every hour. A shower puts it back. The morning shower brings it up to at least 82.`);
      // Nobody but the player is called "you" in a sentence about them.
      if (c.kind === 'Somebody') expect(`${look.summary} ${debt.summary}`).not.toMatch(/\byou(?:r|’re)?\b/i);
    }
  });

  it('a long name with an apostrophe and a hyphen, the player’s and a partner’s, reaches each sentence whole', async () => {
    const { mateBusy, noteText, askRefusal } = await import('@/engine/systems/coursework');
    const name = { firstName: 'Mary-Kate', lastName: 'O\'Sullivan-Featherstonehaugh' };
    const sim = student('dyn-names', name);
    const home = drawn(sim, Home);
    expect(home).toContain('Good Morning, Mary-Kate.');
    const profile = drawn(sim, ProfileWorkspace);
    expect(profile).toContain('Mary-Kate O\'Sullivan-Featherstonehaugh');
    expect(opened(sim, 'person', sim.player.id).look.name).toBe('Mary-Kate O\'Sullivan-Featherstonehaugh');
    sound(home); sound(profile);
    // TEST SETUP: the class renamed, each a long name with a hyphen and an apostrophe, before a partner is drawn.
    const given = ['Anne-Marie', 'Jean-Luc', 'Mary-Rose', 'Kwame-Ato', 'Li-Na', 'Rosa-Lynn', 'Jo-Ellen', 'Ana-Sofia', 'Ben-Ari', 'Lee-Ann', 'Dee-Dee', 'Ray-Ray', 'Bo-Young', 'Hye-Jin', 'Min-Jun'];
    sim.player.school!.classmates.forEach((m, i) => { m.name = `${given[i]} D'Arcy-Fitzwilliam`; });
    const a = setWork(sim, sim.player, 'DRAM 103a/b', { year: 2026, month: 9, day: 1 })!;
    expect(a.partner).toBeDefined();
    const mate = sim.player.school!.classmates[a.partner!]!;
    const first = given[a.partner!]!;
    const set = sim.universe.notifications.at(-1)!;
    expect(set.body).toContain(`, and ${mate.name} plays `);
    sound(set.body); whole(set.body); dated(set.body);
    expect(noteText(a, { kind: 'dim', dim: 'partner' }, 0.2, mate.name)).toContain(`You and ${first} hadn’t rehearsed together.`);
    // Busy at the hour asked: in class until three on a class day.
    const busy = mateBusy(sim.player, a.partner!, on(2026, 9, 2, 10), 60)!;
    expect(busy).toBe(`${first} is in class until three.`);
    // Asked before the class has met: not yet, and when they will.
    const unmet = askRefusal(sim, sim.player, a, sim.now + 30 * MS_HOUR).refused!;
    expect(unmet).toMatch(new RegExp(`^You haven’t met ${first} yet\\. `));
    // Met at Meeting Your Class, the 25th. A boundary set: asked at less than a day's notice. TEST SETUP: the boundary as
    // a moment answered leaves it.
    tended(sim, on(2026, 8, 26, 16));
    personOf(mate).boundary = { since: sim.now, keptSince: 0, accepted: true };
    const refused = askRefusal(sim, sim.player, a, sim.now + 2 * MS_HOUR).declines;
    expect(refused).toBe(`${first} wants a day’s notice after last time. Ask for an evening at least a day ahead.`);
    expect(opened(sim, 'classmate', String(a.partner)).look.name).toBe(mate.name);
    for (const s of [busy, unmet, refused!]) { sound(s); whole(s); }
  });

  it('a teacher and a cast member are named as the school names them, in the term’s notes and the cast', () => {
    const sim = journey('year-one');
    const standing = drawn(sim, SchoolWorkspace);
    const notes = sim.player.school!.history.at(-1)!.notes!;
    expect(notes.length).toBeGreaterThan(0);
    for (const n of notes) expect(standing).toContain(`${n.teacher}, ${n.course}: ${n.note}`);
    expect(standing).toContain('These notes are simulated. The words are the game’s, not the teachers’.');
    sound(standing);
    // The cast as the chair read it (`castRead`): each student by name, with the part, the player as You.
    const casting = drawn(sim, SchoolWorkspace, { 'tab:/workspace/school': 'casting' }).split('\n');
    const rows = sim.player.school!.castRead!.rows;
    expect(rows.length).toBeGreaterThan(5);
    for (const r of rows) {
      const at = casting.indexOf(r.you ? 'You' : r.name);
      expect(at, r.name).toBeGreaterThan(0);
      expect(casting.slice(at, at + 6).at(-1), r.name).toBe(r.part);
    }
    sound(casting.join('\n'));
  });
});

// ---------------------------------------------------------------------------
// 3. Missing optional information
// ---------------------------------------------------------------------------

describe('missing optional information: each part absent, and the sentence still whole', () => {
  it('a partner and a reader: work set with one and without, a partner note with a reader’s evenings and none', async () => {
    const { noteText } = await import('@/engine/systems/coursework');
    const sim = student('dyn-partner');
    const solo = setWork(sim, sim.player, 'DRAM 113a/b', { year: 2026, month: 9, day: 1 })!;
    const soloNotice = sim.universe.notifications.at(-1)!;
    const paired = setWork(sim, sim.player, 'DRAM 103a/b', { year: 2026, month: 9, day: 1 })!;
    const pairedNotice = sim.universe.notifications.at(-1)!;
    expect(solo.partner).toBeUndefined();
    expect(paired.partner).toBeDefined();
    expect(soloNotice.body).not.toMatch(/ plays /);
    expect(pairedNotice.body).toContain(`, and ${sim.player.school!.classmates[paired.partner!]!.name} plays `);
    for (const n of [soloNotice, pairedNotice]) {
      expect(n.body).toMatch(/It’s due in class on [A-Z][a-z]+ \d{1,2}, \d{4}\.$/);
      sound(n.body); whole(n.body); dated(n.body);
    }
    const partner = sim.player.school!.classmates[paired.partner!]!.name;
    const firstName = partner.split(' ')[0]!;
    // The partner part's note: no partner named, a partner and no reader, then a reader's evenings, one and three.
    expect(noteText(paired, { kind: 'dim', dim: 'partner' }, 0.2)).not.toMatch(/rehears|reader/i);
    expect(noteText(paired, { kind: 'dim', dim: 'partner' }, 0.2, partner)).toContain(`You and ${firstName} hadn’t rehearsed together. Run It With A Reader lets you work on your side of it without them.`);
    // TEST SETUP: a reader's evenings, as the step counts them.
    paired.steps.reader = 1;
    expect(noteText(paired, { kind: 'dim', dim: 'partner' }, 0.2, partner)).toContain('You ran it with a reader once.');
    paired.steps.reader = 3;
    const three = noteText(paired, { kind: 'dim', dim: 'partner' }, 0.2, partner);
    expect(three).toContain('You ran it with a reader 3 times.');
    expect(three).toMatch(/\(.+: 20% prepared\.\)/);
    sound(three); whole(three);
    // A piece with no scene names no role: the note ends on its measure.
    expect(noteText(solo, { kind: 'dim', dim: Object.keys(solo.prep)[0] as never }, 0.5)).not.toContain('You played');
  });

  it('a date not yet known: a passport applied for, with its ready day and without one, then issued on its day', async () => {
    const sim = student('dyn-dates');
    const applied = sim.must<{ readyAt: number }>({ kind: 'documents.apply_passport', payload: {} });
    const { documentsOf } = await import('@/engine/systems/documents');
    const doc = documentsOf(sim.player).find((d) => d.status === 'pending')!;
    let seen = opened(sim, 'document', doc.id);
    expect(seen.look.summary).toBe(`You’ve applied, and it’s being decided. It should be ready by ${formatDate(applied.readyAt, sim.zone)}.`);
    expect(seen.text).toContain('Issued\nNot Yet');
    expect(seen.text).toMatch(/issued it\. You don’t hold it yet/);
    sound(seen.text); dated(seen.text);
    // TEST SETUP: a pending application whose day the office hasn't said.
    delete doc.readyAt;
    seen = opened(sim, 'document', doc.id);
    expect(seen.look.summary).toBe('You’ve applied, and it’s being decided. It should be ready soon.');
    doc.readyAt = applied.readyAt;
    tended(sim, applied.readyAt + MS_HOUR);
    seen = opened(sim, 'document', doc.id);
    expect(seen.look.summary).toMatch(new RegExp(`^It’s in force until ${MONTH} \\d{1,2}, \\d{4}, and its number ends \\w{4}\\.$`));
    expect(seen.text).toMatch(new RegExp(`issued it on ${MONTH} \\d{1,2}, \\d{4}\\.`));
    sound(seen.text); dated(seen.text);
  });

  it('a bank’s unpublished figure: a savings account whose rate the bank doesn’t publish, and one it does', async () => {
    const { BankWorkspace } = await import('@/ui/workspaces/BankWorkspace');
    const sim = student('dyn-unpublished');
    // A second bank, opened as a player opens one (`bank.open_current`): Citi publishes no rate for its savings.
    sim.must({ kind: 'bank.open_current', payload: { bankId: 'us-citi' } });
    const text = drawn(sim, BankWorkspace);
    const panel = text.slice(text.indexOf('Citi Savings'));
    expect(panel).toContain('At Citi, not open yet');
    expect(panel).toContain('No published rate was found for it, so it earns no interest in the game.');
    expect(panel).toContain('It costs $4.50 a month');
    // Chase's own savings, open, says its rate.
    expect(text).toMatch(/Pays \d+(?:\.\d+)?% a year/);
    sound(text);
  });

  it('a document’s missing number: a student on an F-1 with no Social Security number, its status in the number’s place and why it can’t be applied for yet', async () => {
    const { WorkPane } = await import('@/ui/papers/Documents');
    const sim = student('dyn-ssn', { homeRegionId: 'uk-eng-london' });
    const pane = drawn(sim, WorkPane).split('\n');
    // No number is kept (`systems/taxid.ts`): its status stands in its place, and the button says why it can't be pressed yet.
    const at = pane.indexOf('Social Security Number');
    expect(pane[at + 1]).toBe('Not yet');
    const why = 'On an F-1, the number needs on-campus work that has begun or starts within 30 days. Register at the School first, and the School’s work-study is yours.';
    expect(pane).toContain(why);
    expect(sim.execute({ kind: 'documents.apply_ssn', payload: {} })).toMatchObject({ ok: false, error: why });
    expect(pane.find((l) => l.startsWith('Source: SSA POMS'))).toContain('read October 10, 2026.');
    sound(pane.join('\n')); dated(pane.join('\n'));
  });
});

// ---------------------------------------------------------------------------
// 4. Each academic standing
// ---------------------------------------------------------------------------

describe('each academic standing: good standing, academic concern, academic warning, dismissed, and leave', () => {
  it('the term review’s notice and the screens at good standing, then a concern, a warning and a dismissal', async () => {
    const { evaluate, termLabel, STANDING_LABEL } = await import('@/engine/systems/school');
    const sim = student('dyn-standing');
    tended(sim, on(2026, 9, 14, 12));
    const school = sim.player.school!;
    const head = () => drawn(sim, SchoolWorkspace).split('\n').find((l) => l.startsWith('MFA in Acting, class of 2029.'))!;
    const affairs = () => drawn(sim, Home).split('\n').find((l) => l.startsWith('School '))!;
    expect(head()).toBe('MFA in Acting, class of 2029. Year 1 of three, good standing.');
    expect(affairs()).toMatch(new RegExp(`^School Year 1, good standing, \\d+ of 16 in the class\\. Next: .+, ${MONTH} \\d{1,2}, \\d{4} at \\d{1,2}:\\d{2} [AP]M\\.`));
    // TEST SETUP: each term's attendance short of the floor (90%), the term's tally as staying away leaves it, then the
    // faculty's review as the term's end runs it (`evaluate`). The next term begun by hand where the clock would begin it.
    const shortTerm = (term: number) => {
      school.termsBegun = term + 1;
      Object.assign(school.tally, { classDays: 40, excused: 0, attended: 20, calls: 0, answered: 0, shifts: 0, worked: 0, breaches: 0 });
      evaluate(sim, sim.player, term);
      return sim.universe.notifications.at(-1)!;
    };
    const expected = [
      { standing: 'concern', title: 'A Notice Of Academic Concern', next: 'If your next term review finds you short again, the faculty would put you on academic warning. A term that meets what’s asked puts you back in good standing.' },
      { standing: 'warning', title: 'Academic Warning', next: 'If your next term review finds you short, you’ll be dismissed from the School. While you’re on warning, you can’t take part in the Yale Cabaret.' },
      { standing: 'dismissed', title: 'Dismissed From The School', next: 'A dismissed student can’t return to the School. What you did here stands: every course and its result stay on your record, the productions you played stay on your Profile, and hours you worked are still paid.' },
    ] as const;
    for (const [term, e] of expected.entries()) {
      const notice = shortTerm(term);
      expect(school.standing).toBe(e.standing);
      expect(notice.title).toBe(e.title);
      expect(notice.body).toContain('You came to 50% of the classes, calls and shifts asked of you.');
      expect(notice.body).toContain(e.next);
      sound(notice.body); whole(notice.body); dated(notice.body);
      const tab = drawn(sim, SchoolWorkspace);
      const label = STANDING_LABEL[e.standing];
      expect(tab.split('\n')).toContain(label);
      // The review's row: the term, the standing it gave and the attendance.
      expect(tab).toContain(`${termLabel(term)}\n${label}\n50%`);
      if (e.standing === 'dismissed') {
        expect(head()).toBe('MFA in Acting, class of 2029. Left the School.');
        expect(affairs()).toMatch(/^School Left the school, dismissed, \d+ of 16 in the class\. Your standing is dismissed\. The School screen says why\./);
      } else {
        expect(head()).toBe(`MFA in Acting, class of 2029. Year ${term < 2 ? 1 : 2} of three, ${label.toLowerCase()}.`);
        expect(affairs()).toContain(`, ${label.toLowerCase()}, `);
        expect(affairs()).toContain(`Your standing is ${label.toLowerCase()}. The School screen says why.`);
      }
      sound(tab); sound(affairs());
    }
  });

  it('on leave: asked, decided and begun, the screens say until when, and the refusal before it says why', () => {
    const sim = student('dyn-leave');
    tended(sim, on(2026, 10, 5));
    // Nothing yet would lead a physician to recommend it: refused, saying why.
    const refused = sim.execute({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/^A medical leave needs a Yale Health physician’s written recommendation, and nothing in the last \d+ days would lead to one: no illness, injury or stay in hospital\.$/);
    // FIXTURE: the flu, as `careFor` gives one, so a medical leave can be asked for (tests/defects-g10-1.test.ts's own).
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    const pending = sim.execute({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    expect(pending.error).toBe(`Your request is with the chair and the dean, decided by ${formatDate(asked.decideAt, sim.zone)}.`);
    tended(sim, asked.decideAt + MS_HOUR);
    const school = sim.player.school!;
    expect(school.leave!.status).toBe('on');
    // Back with the class a year behind, the class of 2030 (`joinCohort`).
    const head = drawn(sim, SchoolWorkspace).split('\n').find((l) => l.startsWith('MFA in Acting, class of'))!;
    expect(head).toBe(`MFA in Acting, class of ${school.classOf}. On leave until Fall Term 2027.`);
    const affairs = drawn(sim, Home).split('\n').find((l) => l.startsWith('School '))!;
    expect(affairs).toMatch(/^School On Leave, good standing, \d+ of 16 in the class\./);
    for (const s of [refused.error!, pending.error!, head, affairs]) { sound(s); whole(s); dated(s); }
  });
});

// ---------------------------------------------------------------------------
// 5. Success, partial progress, failure and recovery
// ---------------------------------------------------------------------------

describe('success, partial progress, failure and recovery', () => {
  /** Acting I's first scene, set as the course sets it, and the day it's due as a school date. */
  const scene = async (seed: string) => {
    const { questionsFor } = await import('@/engine/systems/coursework');
    const sim = student(seed);
    const a = setWork(sim, sim.player, 'DRAM 103a/b', { year: 2026, month: 9, day: 1 })!;
    const [year, month, day] = a.dueOn.split('-').map(Number) as [number, number, number];
    return { sim, a, questionsFor, due: { year, month, day }, when: on(year, month, day, 10) };
  };
  /** TEST SETUP: every part of the piece prepared to a level, the table work's answers the ones the text supports, as its steps leave it. */
  const prepare = (a: Awaited<ReturnType<typeof scene>>['a'], level: number, questionsFor: Awaited<ReturnType<typeof scene>>['questionsFor']) => {
    for (const d of Object.keys(a.prep) as (keyof typeof a.prep)[]) a.prep[d] = level;
    a.reader = level;
    if (level > 0) for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id;
  };
  const RANK = { Unready: 0, Working: 1, Strong: 2, Exceptional: 3 } as const;

  it('a piece shown Unready, Working and better: the notice says the band, what was ready, and the teacher’s note', async () => {
    const { meetingWeight } = await import('@/engine/systems/coursework');
    const bands: number[] = [];
    for (const [seed, level] of [['dyn-shown-0', 0], ['dyn-shown-5', 0.5], ['dyn-shown-1', 1]] as const) {
      const { sim, a, questionsFor, due, when } = await scene(seed);
      prepare(a, level, questionsFor);
      meetingWeight(sim, sim.player, 'DRAM 103a/b', due, when, true, false);
      const notice = sim.universe.notifications.at(-1)!;
      const m = /^Shown: Scene Study, (Unready|Working|Strong|Exceptional)$/.exec(notice.title)!;
      expect(m, notice.title).not.toBeNull();
      expect(m[1]).toBe({ unready: 'Unready', working: 'Working', strong: 'Strong', exceptional: 'Exceptional' }[a.shown!.band]);
      bands.push(RANK[m[1] as keyof typeof RANK]);
      expect(notice.body).toContain(`Simulated note from Acting I: ${a.feedback!.text}`);
      // What was well prepared, listed as a list is said, where any part was; nothing of it where none was.
      if (level === 1) expect(notice.body).toMatch(/^Well prepared: (?:[A-Z][\w’ ]+, )*[A-Z][\w’ ]+ and [A-Z][\w’ ]+\./);
      if (level === 0) expect(notice.body).not.toContain('Well prepared');
      // The Coursework tab's card for it, to be shown again, with the same band and words.
      const pane = drawn(sim, SchoolWorkspace, { 'tab:/workspace/school': 'coursework' });
      expect(pane).toContain(`Feedback: ${m[1]}, ${Math.round(a.shown!.score * 100)} Of 100`);
      expect(pane).toContain(a.feedback!.text);
      sound(notice.body); whole(notice.body); sound(pane);
    }
    // Unready unprepared; prepared, better.
    expect(bands[0]).toBe(0);
    expect(bands[2]).toBeGreaterThan(bands[0]!);
    expect(bands[1]).toBeGreaterThanOrEqual(bands[0]!);
  });

  it('a note worked and the piece shown again: taken, the part’s figure before and after, and not taken, still open', async () => {
    const { meetingWeight, preparedParts } = await import('@/engine/systems/coursework');
    for (const [seed, worked] of [['dyn-again-taken', true], ['dyn-again-open', false]] as const) {
      const { sim, a, questionsFor, due, when } = await scene(seed);
      prepare(a, 0.3, questionsFor);
      meetingWeight(sim, sim.player, 'DRAM 103a/b', due, when, true, false);
      expect(a.status).toBe('revising');
      const f = a.feedback!.focus;
      expect(f.kind).toBe('dim');
      const dim = (f as { dim: keyof typeof a.prep }).dim;
      const before = Math.round(a.revision!.before * 100);
      // TEST SETUP: the note's part and the revision step worked as their steps would work them, or left.
      if (worked) { a.prep[dim] = 1; if (dim === 'partner') a.reader = 1; a.prep.revision = 1; }
      const [year, month, day] = a.revision!.dueOn.split('-').map(Number) as [number, number, number];
      meetingWeight(sim, sim.player, 'DRAM 103a/b', { year, month, day }, on(year, month, day, 10), true, false);
      const notice = sim.universe.notifications.find((n) => /^Note (Taken|Not Taken Yet): Scene Study$/.test(n.title))!;
      expect(notice).toBeDefined();
      const label = { familiarity: 'Knows The Scene', memorization: 'Lines', interpretation: 'Table Work', rehearsal: 'Rehearsal', partner: 'With Your Partner', revision: 'Revision' }[dim];
      const after = Math.round((preparedParts(sim.player, a, a.revision!.dueOn)[dim] ?? 0) * 100);
      const shownOn = formatDate(on(year, month, day, 12), NY);
      const band = { unready: 'Unready', working: 'Working', strong: 'Strong', exceptional: 'Exceptional' }[a.revision!.band!];
      if (worked) {
        expect(notice.title).toBe('Note Taken: Scene Study');
        expect(notice.body).toBe(`You showed Scene Study again on ${shownOn}, and took the note on ${label.toLowerCase()}. ${label} went from ${before}% to ${after}%. Shown again: ${band}.`);
      } else {
        expect(notice.title).toBe('Note Not Taken Yet: Scene Study');
        expect(notice.body).toBe(`You showed Scene Study again on ${shownOn}, but the note on ${label.toLowerCase()} wasn’t taken yet. ${label} stayed at ${after}%. Shown again: ${band}. It stays open under Your Notes.`);
      }
      const shown = drawn(sim, SchoolWorkspace, { 'tab:/workspace/school': 'coursework' });
      expect(shown).toContain(`${worked ? 'Note Taken' : 'Note Not Taken'}, Shown Again ${band}`);
      sound(notice.body); whole(notice.body); dated(notice.body); sound(shown);
    }
  });

  it('an application refused for want of money, nothing charged, then made again once the money is there', () => {
    const sim = student('dyn-refused');
    const checking = sim.ledger.tryAccount(sim.player.primaryAccountId!)!;
    const spend = sim.nominalAccount('expense', 'Groceries');
    // TEST SETUP: every account's money spent, as a long month's spending leaves it.
    const accounts = sim.ledger.accountsOf(sim.player.id).filter((x) => !x.nominal && (x.kind === 'checking' || x.kind === 'savings') && x.balance > 0);
    for (const x of accounts) sim.post({ memo: 'Spent', category: 'food', postings: [{ accountId: x.id, amount: -x.balance }, { accountId: spend.id, amount: x.balance }] });
    const before = checking.balance;
    const refused = sim.execute({ kind: 'documents.apply_passport', payload: {} });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/^Your bank can’t cover \$\d+\.\d{2}, so nothing was charged\.$/);
    expect(checking.balance).toBe(before);
    // TEST SETUP: money from family, as a transfer in.
    sim.post({ memo: 'From family', category: 'transfer', postings: [{ accountId: checking.id, amount: 500_00 }, { accountId: sim.nominalAccount('income', 'Family').id, amount: -500_00 }] });
    const fee = Number(/\$(\d+\.\d{2})/.exec(refused.error!)![1]) * 100;
    const made = sim.must<{ readyAt: number; fee: number }>({ kind: 'documents.apply_passport', payload: {} });
    expect(made.fee).toBe(fee);
    expect(checking.balance).toBe(500_00 - fee);
    // Asked again while it's being decided: why, and that nothing more is needed.
    const again = sim.execute({ kind: 'documents.apply_passport', payload: {} });
    expect(again.error).toBe('You’ve already applied, and it’s being decided.');
    for (const s of [refused.error!, again.error!]) { sound(s); whole(s); }
  });
});

// ---------------------------------------------------------------------------
// 6. Deadlines upcoming, due and missed
// ---------------------------------------------------------------------------

describe('deadlines upcoming, due and missed: coursework, a document’s renewal, a tax return and a payment', () => {
  /** TEST SETUP: every account's money spent, as a long month's spending leaves it. */
  const spendAll = (sim: Simulation) => {
    const spend = sim.nominalAccount('expense', 'Groceries');
    for (const x of sim.ledger.accountsOf(sim.player.id).filter((y) => !y.nominal && (y.kind === 'checking' || y.kind === 'savings') && y.balance > 0)) {
      sim.post({ memo: 'Spent', category: 'food', postings: [{ accountId: x.id, amount: -x.balance }, { accountId: spend.id, amount: x.balance }] });
    }
  };

  it('coursework: due soonest with its date, shown on its day, and not shown when you weren’t there', async () => {
    const { meetingWeight } = await import('@/engine/systems/coursework');
    const sim = student('dyn-due');
    const a = setWork(sim, sim.player, 'DRAM 103a/b', { year: 2026, month: 9, day: 1 })!;
    const [year, month, day] = a.dueOn.split('-').map(Number) as [number, number, number];
    const dueOn = formatDate(on(year, month, day, 12), NY);
    const soonest = drawn(sim, SchoolWorkspace, { 'tab:/workspace/school': 'coursework' }).split('\n').find((l) => l.startsWith('Acting I: Scene Study, due '))!;
    expect(soonest).toMatch(new RegExp(`^Acting I: Scene Study, due ${dueOn}\\. Shown today, it would come to about \\d+\\.\\d \\((Unready|Working|Strong|Exceptional)\\)\\. Still to finish: .+\\.$`));
    sound(soonest); whole(soonest); dated(soonest);
    // Its day, and not there: not shown, counted, and what that means for the course.
    meetingWeight(sim, sim.player, 'DRAM 103a/b', { year, month, day }, on(year, month, day, 10), false, false);
    const missed = titled(sim, 'Not Shown: Acting I')[0]!;
    expect(missed.body).toBe('You weren’t in class when it was due, and it can’t be shown later. The term review counts it as Unready. A course isn’t passed if half or more of the pieces due in the term weren’t shown: in Acting I, that’s 1 of 1 so far.');
    expect(a.status).toBe('missed');
    const shown = drawn(sim, SchoolWorkspace, { 'tab:/workspace/school': 'coursework' });
    expect(shown).toContain('Acting I: Scene Study, ');
    expect(shown).toMatch(/Acting I: Scene Study, .+ · Not Shown\n/);
    sound(missed.body); whole(missed.body); sound(shown);
  });

  it('a passport’s renewal: in force until its day, then run out, with what replaces it said where it’s listed', async () => {
    const { PassportPane } = await import('@/ui/papers/Documents');
    const { documentsOf } = await import('@/engine/systems/documents');
    const sim = student('dyn-renewal', { homeRegionId: 'uk-eng-london' });
    const passport = documentsOf(sim.player).find((d) => d.kind === 'passport' && d.status === 'valid')!;
    // TEST SETUP: its last day brought near, as journey F1's was (`tools/journeys.ts`, focused 'passport').
    passport.expiresAt = on(2026, 9, 1, 12);
    const last = passport.number.replace(/\W/g, '').slice(-4);
    expect(opened(sim, 'document', passport.id).look.summary).toBe(`It’s in force until September 1, 2026, and its number ends ${last}.`);
    let pane = drawn(sim, PassportPane);
    expect(pane).toContain(`Passport\nIn Force\n${passport.number}, runs out September 1, 2026`);
    // The pane's own words read whole; its fine print's dates are the passport office's, as its source wrote them
    // ("from 8 April 2026"), and recorded, not held here (docs/verification/language-2026-10-17/dynamic/defects.md).
    sound(pane);
    tended(sim, on(2026, 9, 2, 12));
    expect(opened(sim, 'document', passport.id).look.summary).toBe('It ran out on September 1, 2026 and no longer counts for anything.');
    pane = drawn(sim, PassportPane);
    expect(pane).toContain('Passport\nNone In Force');
    expect(pane).toMatch(/\nRun Out\nApply for a new one under Your Passport, above\.\n/);
    sound(pane);
  });

  it('a tax return: its date ahead, its last day, and passed unfiled, with what being late means', async () => {
    const sim = student('dyn-return', { homeRegionId: 'uk-eng-london' });
    tended(sim, on(2027, 2, 3, 12));
    const decision = Object.values(sim.universe.decisions).find((d) => d.refType === 'return' && d.refId === '2026')!;
    expect(decision.title).toBe('Your 2026 Tax Return');
    expect(decision.detail).toMatch(/File it by April 15, 2027\.$/);
    expect(opened(sim, 'decision', decision.id).look.summary).toBe('Answer it by April 15, 2027. That’s in 2 months.');
    const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
    const returns = drawn(sim, PapersWorkspace, { 'tab:/workspace/papers': 'returns' });
    expect(returns).toContain('2026 Return\nDue April 15, 2027\nFile It');
    sound(returns);
    tended(sim, on(2027, 4, 15, 8));
    expect(opened(sim, 'decision', decision.id).look.summary).toMatch(/^Answer it by April 15, 2027\. That’s in \d+h \d+m\.$/);
    tended(sim, on(2027, 4, 20, 12));
    expect(opened(sim, 'decision', decision.id).look.summary).toBe('It closed after its date had passed, so it isn’t asking you for anything now.');
    const late = titled(sim, 'Your 2026 Return Is Late')[0]!;
    expect(late.body).toMatch(/File it on Papers, under Tax Returns\.$/);
    for (const s of [decision.detail, late.body]) { sound(s); whole(s); dated(s); }
  });

  it('a card payment: its due date ahead, a warning the account is short before it, and the payment missed', async () => {
    const { BankCard } = await import('@/ui/bank/BankCard');
    const { cardsOf, stateOf } = await import('@/engine/systems/credit');
    const sim = student('dyn-card-due');
    // The day's spending on the card, as Payments And Cash sets it.
    sim.must({ kind: 'bank.set_payments', payload: { everyday: 'credit' } });
    const card = cardsOf(sim, sim.player)[0]!;
    tended(sim, on(2026, 9, 21, 12));
    const state = stateOf(sim.player, card);
    expect(state.statementBalance).toBeGreaterThan(0);
    const cardText = () => drawn(sim, (() => createElement(BankCard, { bankId: card.bankId! })) as FunctionComponent);
    expect(cardText()).toContain('Statements come on the 20th, and payment is due 21 days after each one. The next payment is due October 11, 2026.');
    expect(cardText()).toMatch(/On this statement it’s \$\d+\./);
    // TEST SETUP: the money spent before the autopay day; the warning comes the day before.
    spendAll(sim);
    tended(sim, on(2026, 10, 10, 12));
    const short = sim.universe.notifications.find((n) => n.title === 'Short For A Payment: Chase Total Checking')!;
    expect(short.body).toMatch(/^The Chase Freedom Unlimited’s autopay, \$\d+\.\d{2}, comes from Chase Total Checking at Chase on October 11, 2026, and it holds \$\d+\.\d{2}\. Move money into it, pay the card by hand, or have autopay pay from another account\.$/);
    expect(drawn(sim, Home)).toContain('Card Payment Due in ');
    spendAll(sim);
    tended(sim, on(2026, 10, 12, 12));
    const late = titled(sim, 'A Late Card Payment')[0]!;
    expect(late.body).toMatch(/^The minimum payment was \$\d+\.\d{2}, and only \$\d+\.\d{2} was paid\. That costs a \$\d+\.\d{2} late fee, and it goes on your credit record if it’s still short at the next due date, thirty days late\.$/);
    for (const s of [short.body, late.body]) { sound(s); whole(s); dated(s); }
  });
});

// ---------------------------------------------------------------------------
// 7. Positive, zero and negative balances
// ---------------------------------------------------------------------------

describe('positive, zero and negative balances: an account, a card, a payment plan, and what’s owed', () => {
  /** TEST SETUP: an account brought to a balance by a posting against groceries, as spending leaves it. */
  const bring = (sim: Simulation, id: string, to: number) => {
    const a = sim.ledger.tryAccount(id)!;
    const by = to - a.balance;
    if (by) sim.post({ memo: 'Spent', category: 'food', postings: [{ accountId: id, amount: by }, { accountId: sim.nominalAccount('expense', 'Groceries').id, amount: -by }] });
  };

  it('an account: money in it, nothing, and overdrawn, on its look and on Home, written as money is written', () => {
    const sim = student('dyn-balance');
    const checking = sim.player.primaryAccountId!;
    const line = () => drawn(sim, Home).split('\n').find((l) => l.startsWith('Money '))!;
    bring(sim, checking, 1234_56);
    expect(opened(sim, 'account', checking).look.summary).toBe('You have $1,234.56 in it at Chase. It’s your primary account, so the day’s spending comes out of it.');
    expect(line()).toMatch(/^Money Chase Total Checking: \$1,234\.56\. Worth \$[\d,]+\./);
    bring(sim, checking, 0);
    expect(opened(sim, 'account', checking).look.summary).toBe('There’s nothing in it at Chase. It’s your primary account, so the day’s spending comes out of it.');
    expect(line()).toMatch(/^Money Chase Total Checking: \$0\.00\. Worth \$[\d,]+\./);
    bring(sim, checking, -41_10);
    expect(opened(sim, 'account', checking).look.summary).toBe('It’s $41.10 overdrawn at Chase, and every day it stays overdrawn can cost you.');
    expect(line()).toMatch(/^Money Chase Total Checking: −\$41\.10\. Worth \$[\d,]+\. Your account is overdrawn\./);
    // Worth below nothing too: every account brought down. TEST SETUP.
    for (const a of sim.ledger.accountsOf(sim.player.id).filter((x) => !x.nominal && x.kind === 'savings')) bring(sim, a.id, 0);
    expect(line()).toMatch(/^Money Chase Total Checking: −\$41\.10\. Worth −\$41\. Your account is overdrawn\./);
    for (const s of [opened(sim, 'account', checking).text, line()]) sound(s);
  });

  it('a card: owing on it, owing nothing, and holding your money after paying more than was owed', async () => {
    const { cardsOf } = await import('@/engine/systems/credit');
    const sim = student('dyn-card-balance');
    const card = cardsOf(sim, sim.player)[0]!;
    const limit = '$21,739.00';
    expect(card.creditLimit).toBe(21_739_00);
    expect(opened(sim, 'account', card.id).look.summary).toBe(`You owe nothing on it at Chase, and the whole ${limit} limit is free to use.`);
    // Spent on the card, as the day's spending on it does. TEST SETUP.
    bring(sim, card.id, -250_00);
    expect(opened(sim, 'account', card.id).look.summary).toBe(`You owe $250.00 on it at Chase, which leaves $21,489.00 of its ${limit} limit free to use.`);
    // Paid by hand, $50 more than was owed (`finance.pay_card`).
    sim.must({ kind: 'finance.pay_card', payload: { amount: 300_00, accountId: card.id } });
    expect(card.balance).toBe(50_00);
    const held = opened(sim, 'account', card.id);
    expect(held.look.summary).toBe(`You owe nothing on it at Chase, and it holds $50.00 of your money on top of the whole ${limit} limit.`);
    expect(held.text).toContain('Left To Spend\n$21,789.00');
    for (const s of [held.look.summary]) { sound(s); whole(s); }
  });

  it('a payment plan with some left, and paid off; and what’s owed, one debt or two, and nothing', async () => {
    const { BankCardOffers } = await import('@/ui/bank/BankCardOffers');
    const { cardsOf, stateOf } = await import('@/engine/systems/credit');
    const sim = student('dyn-owed');
    const card = cardsOf(sim, sim.player)[0]!;
    const offers = () => drawn(sim, (() => createElement(BankCardOffers, { bankId: card.bankId! })) as FunctionComponent);
    // Nothing owed: there's no debt to open, and the look says why.
    expect(resolveLook(sim, at('debt', sim.player.id))).toEqual({ gone: 'You don’t owe anyone anything, so there’s nothing to show here.' });
    // TEST SETUP: a purchase put into a plan (`card.plan`), $600 left, and the card owing it.
    bring(sim, card.id, -600_00);
    stateOf(sim.player, card).plans = [{ left: 600_00, monthly: 100_00, fee: 0, monthsLeft: 6 }];
    expect(offers()).toContain('A payment plan: $600 left, paid at $100 a month for 6 more months, with no fee and no interest.');
    const one = opened(sim, 'debt', sim.player.id);
    expect(one.look.summary).toBe(`You owe $600.00, all of it on the ${card.name}.`);
    sound(one.text);
    // Paid off: the plan's line goes, and nothing is owed.
    stateOf(sim.player, card).plans = [];
    bring(sim, card.id, 0);
    expect(offers()).not.toContain('A payment plan:');
    expect(resolveLook(sim, at('debt', sim.player.id))).toEqual({ gone: 'You don’t owe anyone anything, so there’s nothing to show here.' });
    // Two debts: a second card applied for at Citi (`card.apply`), arrived a week later, and each owing. TEST SETUP.
    expect(sim.must<{ approved: boolean }>({ kind: 'card.apply', payload: { bankId: 'us-citi' } }).approved).toBe(true);
    tended(sim, sim.now + 8 * MS_DAY);
    const second = cardsOf(sim, sim.player).find((c) => c.id !== card.id)!;
    bring(sim, card.id, -120_00);
    bring(sim, second.id, -30_00);
    const two = opened(sim, 'debt', sim.player.id);
    expect(two.look.summary).toBe(`You owe $150.00, spread across ${[card.name, second.name].sort((x, y) => (x === card.name ? -1 : 1) - (y === card.name ? -1 : 1)).join(' and ')}.`);
    sound(two.text);
  });

  it('a tax return’s balance: a refund due, and nothing owed or due back, as the return and its question say it', async () => {
    const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
    const { returnsOf } = await import('@/engine/systems/taxreturn');
    const sim = student('dyn-return-balance', { homeRegionId: 'uk-eng-london' });
    tended(sim, on(2027, 2, 3, 12));
    const r = returnsOf(sim.player)['2026']!;
    const decision = Object.values(sim.universe.decisions).find((d) => d.refType === 'return')!;
    expect(r.figures.balance).toBeLessThan(0);
    const refund = `$${(-r.figures.balance / 100).toFixed(2)}`;
    expect(decision.detail).toContain(`You’re due a refund of ${refund}, on `);
    const returns = () => drawn(sim, PapersWorkspace, { 'tab:/workspace/papers': 'returns' });
    expect(returns()).toContain(`Your Refund\n${refund}`);
    // What was withheld takes away, and is written with a minus sign.
    expect(returns()).toMatch(/Withheld From Your Pay And Pension\n−\$[\d,]+\.\d{2}\n/);
    sound(returns());
    // TEST SETUP: the year's figures where nothing is owed or due back, as a year with no income files its Form 8843.
    r.figures = { ...r.figures, balance: 0 };
    expect(returns()).toContain('Nothing Owed Or Due Back\n$0.00');
    expect(returns()).not.toContain('Your Refund\n$0.00');
  });
});

// ---------------------------------------------------------------------------
// 8. A new player, an advanced one and a finished school journey
// ---------------------------------------------------------------------------

describe('a new player, an advanced one and a finished school journey: the Profile, the advice, Home and School', () => {
  /** Journey J01's life at its start, as part 1 of `tools/journeys.ts` makes it, and its two saves (FIXTURE). */
  const stages = () => [
    ['new', createSave(1, 'j13-1', newLifeFrom({ firstName: 'Ada', lastName: 'Cole', homeRegionId: 'us-ny-newyork', pronouns: 'she/her', wealth: 'wealthy' }))],
    ['a year played', journey('year-one')],
    ['the degree', journey('degree')],
  ] as const;

  it('each screen at each stage says where the life stands, and every word of it is sound', () => {
    for (const [stage, sim] of stages()) {
      const screens = {
        home: drawn(sim, Home),
        profile: drawn(sim, ProfileWorkspace),
        school: drawn(sim, SchoolWorkspace),
        coursework: drawn(sim, SchoolWorkspace, { 'tab:/workspace/school': 'coursework' }),
      };
      for (const [name, text] of Object.entries(screens)) {
        expect(faults(text), `${stage}: ${name}`).toEqual([]);
        dated(text);
      }
      const lines = (t: string) => t.split('\n');
      const affairs = lines(screens.home).find((l) => l.startsWith('School '))!;
      const head = lines(screens.school).find((l) => l.startsWith('MFA in Acting, class of 2029.'))!;
      const profileSchool = lines(screens.profile).slice(lines(screens.profile).indexOf('School'), lines(screens.profile).indexOf('School') + 3);
      if (stage === 'new') {
        expect(affairs).toMatch(/^School Arriving, good standing, \d+ of 16 in the class\. Next: Registration And Your Account, August 24, 2026 at 10:00 AM\.$/);
        expect(profileSchool).toEqual(['School', 'Year 1', 'Class of 2029, good standing']);
        expect(screens.profile).toContain('None of your work has been judged yet. What to work on comes from what holds judged work back, so it starts after your first showing, night on stage or self-tape.');
        expect(head).toBe('MFA in Acting, class of 2029. Arriving for the fall term.');
        expect(screens.school).toContain('Attendance This Term\nNone Yet');
        expect(screens.school).toContain('Coursework This Term\nNone Yet');
        expect(screens.coursework).toContain('Nothing is set yet. Each course sets its work in class, and in your first week the orientation session The Courses And What They Ask sets the first pieces.');
      } else if (stage === 'a year played') {
        expect(affairs).toMatch(/^School Year 1, good standing, \d+ of 16 in the class\. Next: Classes, August 30, 2027 at 9:00 AM\.$/);
        expect(profileSchool).toEqual(['School', 'Year 1', 'Class of 2029, good standing']);
        expect(screens.profile).toContain('What To Work On Next');
        expect(head).toBe('MFA in Acting, class of 2029. Year 1 of three, good standing.');
        // Both of the year's reviews, in good standing, and the spring's teachers' notes.
        expect(screens.school).toMatch(/\nFall Term 2026\nGood Standing\n\d+%/);
        expect(screens.school).toMatch(/\nSpring Term 2027\nGood Standing\n\d+%/);
        expect(screens.school).toContain('From Your Teachers\nOn Spring Term 2027');
        expect(screens.school).toContain('Attendance This Term');
      } else {
        expect(affairs).toMatch(/^School Graduated, \d+ of 16 in the class\.$/);
        expect(profileSchool).toEqual(['School', 'Graduated', 'Class of 2029, graduated']);
        expect(head).toBe('MFA in Acting, class of 2029. Graduated.');
        expect(screens.school).toContain('Attendance Last Term');
        expect(screens.school).toContain('Every course the degree needs was passed, and it was conferred on May 21, 2029.');
        expect(screens.coursework).toContain('Your degree is conferred, so no course sets work now.');
        expect(screens.school).not.toMatch(/This Term\b/);
      }
    }
  });

  it('the advice: none before any work is judged, then what to work on, with the pieces it reads counted and agreeing', async () => {
    const { adviceFor } = await import('@/engine/systems/next-steps');
    for (const [stage, sim] of stages()) {
      const recs = adviceFor(sim, sim.player);
      if (stage === 'new') { expect(recs).toEqual([]); continue; }
      expect(recs.length, stage).toBeGreaterThan(0);
      for (const r of recs) {
        for (const s of [r.why, r.standing, r.next, r.attention].filter((x): x is string => typeof x === 'string')) {
          expect(faults(s), `${stage}: ${r.label}`).toEqual([]);
          whole(s);
          agrees(s, ['piece', 'point', 'hour']);
          // "N of your last M pieces call on it": a count of the work it read, never more than the work.
          for (const m of s.matchAll(/(\d+) of your last (\d+) (piece|pieces) call/g)) {
            expect(Number(m[1])).toBeLessThanOrEqual(Number(m[2]));
            expect(m[3]).toBe(Number(m[2]) === 1 ? 'piece' : 'pieces');
          }
        }
      }
      // The Profile shows the same advice it was given, the first of it by its own label.
      expect(drawn(sim, ProfileWorkspace)).toContain(recs[0]!.label);
    }
  });
});

// ---------------------------------------------------------------------------
// Section 8. Repetition said through what changed
// ---------------------------------------------------------------------------

describe('repetition: a note said before says so, a warning repeated says what changed and what’s open, a refusal met twice still says why', () => {
  it('a teacher’s note on an unchanged weakness says it was said before, how often, and when; never as a new discovery', async () => {
    const { courseworkOf, feedbackWords, persistentFor } = await import('@/engine/systems/coursework');
    const { noteSubject } = await import('@/engine/systems/learning');
    // A first fall left unprepared (TEST SETUP: rested, so only the preparation is short), the notes as the showings give them.
    const sim = student('dyn-repeat');
    tended(sim, on(2026, 10, 10, 12));
    const cw = courseworkOf(sim, sim.player)!;
    const given = cw.assignments.filter((a) => a.feedback && a.feedback.focus.kind !== 'advanced');
    const recurring = given.filter((a) => a.feedback!.kind === 'recurring');
    expect(recurring.length).toBeGreaterThan(3);
    for (const a of given) {
      const t = a.feedback!.text;
      const said = /^(?:You had the same note in .+ on (\w+ \d{1,2}, \d{4}), and it’s still there\.|This is the (\d+)(st|nd|rd|th) time you’ve had this note \(last in .+ on (\w+ \d{1,2}, \d{4})\), and it’s still there\.|You’d put this right on .+, but it has slipped back\.)/.exec(t);
      if (a.feedback!.kind === 'recurring') {
        expect(said, t).not.toBeNull();
        // Said before: on this piece's day or one before it.
        expect(Date.parse(`${said![1] ?? said![4]} 00:00 EDT`)).toBeLessThanOrEqual(a.shown!.at);
        if (said![2]) {
          const n = Number(said![2]);
          expect(n).toBeGreaterThanOrEqual(3);
          expect(said![3]).toBe(n % 100 >= 11 && n % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'));
        }
      } else expect(said, t).toBeNull();
      sound(t); whole(t); dated(t);
    }
    // A weakness that keeps coming back: a notice a week at most, its count, and the open piece's way at it.
    const still = sim.universe.notifications.filter((n) => n.title.startsWith('Still There: '));
    expect(still.length).toBeGreaterThan(0);
    const bySubject = new Map<string, number[]>();
    for (const n of still) {
      const m = /, and the same note came back: (\d+) times now\. It stays open under Your Notes\./.exec(n.body)!;
      expect(m, n.body).not.toBeNull();
      expect(Number(m[1])).toBeGreaterThan(3);
      (bySubject.get(n.title) ?? bySubject.set(n.title, []).get(n.title)!).push(n.at);
      sound(n.body); whole(n.body);
    }
    for (const [title, ats] of bySubject) for (let i = 1; i < ats.length; i += 1) expect(ats[i]! - ats[i - 1]!, title).toBeGreaterThanOrEqual(7 * MS_DAY);
    const open = cw.assignments.find((a) => (a.status === 'open' || a.status === 'revising') && persistentFor(cw, a).length > 0)!;
    expect(open).toBeDefined();
    const weak = persistentFor(cw, open)[0]!;
    expect(drawn(sim, SchoolWorkspace, { 'tab:/workspace/school': 'coursework' })).toContain(`A Note That Keeps Coming Back: ${noteSubject(weak.key)}, given ${weak.given} times.`);
    // Better but not there, and back after it was taken: each says so, with the day and the figures.
    expect(feedbackWords('partial', 'Lines weren’t secure.', { on: '2026-09-08', course: 'Acting I', level: 0.2 }, 0.5)).toBe('This has improved since September 8, 2026 (20% then, 50% now), but it isn’t there yet. Lines weren’t secure.');
    expect(feedbackWords('recurring', 'Lines weren’t secure.', { on: '2026-09-08', course: 'Acting I', given: 1, taken: '2026-09-15' })).toBe('You’d put this right on September 15, 2026, but it has slipped back. Lines weren’t secure.');
    expect(feedbackWords('recurring', 'Lines weren’t secure.', { on: '2026-09-08', course: 'Acting I', given: 10 })).toBe('This is the 11th time you’ve had this note (last in Acting I on September 8, 2026), and it’s still there. Lines weren’t secure.');
  });

  it('a warning repeated says what changed and what’s still open: an Incomplete, then a week before its deadline, after a session made up', async () => {
    const { settleCourses } = await import('@/engine/systems/courserecord');
    for (const [made, left] of [[1, '2 make-up sessions'], [2, 'One make-up session']] as const) {
      const sim = student(`dyn-week-left-${made}`);
      tended(sim, on(2026, 9, 14, 17));
      const courses = sim.player.school!.courses as Record<string, { code: string; term: number; meetings: number; excused: number; attended: number; name: string; dueBy?: number }>;
      const key = Object.keys(courses).find((k) => courses[k]!.code === 'DRAM 103a/b')!;
      // TEST SETUP: Acting I's term as an illness leaves it, 28 meetings, 10 excused, 18 attended: under three quarters of
      // its meetings, and none of the rest missed, settled as the term's end settles it.
      Object.assign(courses[key]!, { meetings: 28, excused: 10, attended: 18 });
      settleCourses(sim, sim.player, courses[key]!.term, () => ({ due: 0, notShown: 0 }));
      const due = formatDate(courses[key]!.dueBy!, sim.zone);
      const first = titled(sim, 'Incomplete: Acting I')[0]!;
      expect(first.body).toBe(`You were ill for 10 of its 28 classes. To complete it, make up 3 sessions of work with its teachers by ${due}, each covering a week of the course: press Make Up A Session on the Standing tab. You can ask for a month more once. If it isn’t made up in time, it becomes a Permanent Incomplete, with no credit, and the degree can’t be completed without it.`);
      // Made up, one evening at a time, as the Standing tab's Make Up A Session does it.
      for (let i = 1; i <= made; i += 1) {
        tended(sim, on(2026, 9, 14 + i, 18));
        expect(sim.must<{ madeUp: number; owed: number }>({ kind: 'school.make_up', payload: { key } })).toMatchObject({ madeUp: i, owed: 3 });
      }
      tended(sim, courses[key]!.dueBy! - 7 * MS_DAY + MS_HOUR);
      const week = titled(sim, 'A Week Left: Acting I');
      expect(week).toHaveLength(1);
      expect(week[0]!.body).toBe(`${left} still to do, by ${due}. Press Make Up A Session on the Standing tab.`);
      for (const s of [first.body, week[0]!.body]) { sound(s); whole(s); dated(s); }
    }
  });

  it('a refusal met twice says the same why and the same next step, and changes nothing', () => {
    const sim = student('dyn-twice', { homeRegionId: 'uk-eng-london' });
    const ask = () => sim.execute({ kind: 'documents.apply_ssn', payload: {} });
    const balance = () => sim.ledger.accountsOf(sim.player.id).filter((a) => !a.nominal).reduce((n, a) => n + a.balance, 0);
    const before = balance();
    // Before registration, an hour apart: nothing between them has changed what the office asks.
    const once = ask();
    tended(sim, sim.now + MS_HOUR);
    const twice = ask();
    expect(once.ok).toBe(false);
    expect(twice.error).toBe(once.error);
    // Why (the number needs on-campus work) and the next step (register, and the School's work-study is yours).
    expect(once.error).toMatch(/^On an F-1, the number needs on-campus work that has begun or starts within 30 days\. Register at the School first, and the School’s work-study is yours\.$/);
    expect(sim.player.ssn).toBeUndefined();
    expect(balance()).toBeLessThanOrEqual(before);
    // And a medical leave asked twice with nothing to recommend it: the same reason each time, with its lookback.
    const leave = () => sim.execute({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } }).error;
    tended(sim, on(2026, 9, 7, 12));
    const l1 = leave();
    tended(sim, sim.now + 2 * MS_DAY);
    expect(leave()).toBe(l1);
    expect(sim.player.school!.leave).toBeUndefined();
    for (const s of [once.error!, l1!]) { sound(s); whole(s); }
  });
});
