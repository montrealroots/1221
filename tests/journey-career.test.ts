/**
 * The professional career played whole, the way a player meets it (brief 19, `docs/verification/career-2026-10-20/
 * criteria.md` V1, A1 and L1; the record is `docs/verification/career-2026-10-20/playthroughs/`). Each part of the
 * career was tested apart, with what it couldn't reach written in by hand; here nothing is: the School's showcase, its
 * follow-up, the agent's office, his breakdowns, the casting offices, the pay and the unions meet only through the
 * commands a player sends and the clock.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole at Yale in New Haven, born in New York,
 * played from the first morning of her last term, Monday 8 January 2029 at seven, by `tools/career-player.ts`: the
 * attentive player's hours through public commands, every commitment stopped at and answered as the top bar answers it
 * (`answerStop`), and the career business a graduating actor does, through its commands. Each transition is saved and
 * opened again before the play goes on (`cross`).
 *
 * TEST SETUP, said where it's done: the life up to that morning, played by the clock six hours at a time with the body
 * kept fed and rested and the coursework prepared each midnight, as tests/pro-showcase.test.ts makes its `finalTerm`
 * (two and a half years can't be played by the hour here). From that morning on nothing is set by hand.
 *
 * The seeds, found by playing (the record's `seeds.txt` lists every seed played and how it went), on a43b4f8f, with
 * the fictional agent of 59da1351, the parts written for an actor, an actress or either (9c3b7ee8), and two commitments
 * whose trips meet no longer both gone to (a43b4f8f):
 * - **v1-21** is the first of v1-0 on whose played life the School's follow-up brings a request to meet from his office,
 *   the meeting an offer, and his breakdowns a SAG-AFTRA role booked and paid before the year is out. Why: its showcase
 *   and the filmed monologues its reel was cut from came out Working, as nearly every seed's did, so the work stood near
 *   the bar; but five of the seven factors stood at it or beyond (four are needed), and his list's assumed room was beyond
 *   the bar, which lifts the follow-up's chance a quarter, to 0.1875. Its draw, 0.058, fell under that, and at the
 *   decision (0.4375) the offer's, 0.276, did too. His breakdowns brought Desk Clerk in The Calloway Files three times:
 *   the June and August self-tapes came out Working and Kettering Casting cast another actor; the third, posted on
 *   12 November, came out Strong and was offered, so the shoot fell on 17 and 18 December and the pay came on the 26th.
 *   Earlier seeds' follow-ups brought no request, their draws over their chances (v1-0, v1-2 to v1-6, v1-9 to v1-13,
 *   v1-15 to v1-20); v1-8's meeting ended in a pass; v1-7 and v1-14 were represented and booked no SAG-AFTRA principal
 *   role through him that year (v1-7 Nell in A House On Calder Street, an Equity part; v1-14 nothing); and v1-1 was
 *   dismissed before its last term.
 * - **SEED_B** (below), v1-7, is the first of v1-0 on whose played life, with the reel cut only after the follow-up,
 *   the follow-up brings no request to meet, and an approach after the degree brings a request for more, a meeting and
 *   an offer, which that player declines. v1-3's send went unanswered, v1-0, v1-2 and v1-4 to v1-6's were passed on at
 *   the reply, and v1-1 was dismissed before its last term.
 *
 * Until 2026-10-21 the seeds were v1-12 and v1-5, found the same way with the real agent: his draws are keyed by his
 * id, so the fictional one's fell otherwise (59da1351), and an actress is no longer posted the parts written for an
 * actor (9c3b7ee8); the trips that meet (a43b4f8f) changed neither search. v1-12's life met Desk Clerk once, in June,
 * shot it on 30 and 31 July 2029 and came to its first billing as a SAG-AFTRA member on 1 November; v1-21's comes to it
 * on 1 May 2030.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { ScheduledItem } from '@/engine/core/scheduler';
import { MS_DAY, MS_HOUR, addDays, formatDate, instantFromZoned, zonedParts } from '@/engine/core/time';
import { formatMoney } from '@/engine/core/money';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { stopChoices } from '@/engine/world/clock';
import { PREP_DIMS } from '@/engine/content/coursework';
import { AGENTS, agencyOf } from '@/engine/content/agents';
import { AGREEMENT_TERMS, UNIONS, projectById } from '@/engine/content/careerwork';
import { ENGAGEMENT } from '@/engine/content/engagement';
import { courseworkOf } from '@/engine/systems/coursework';
import { SHOWCASE_COURSE } from '@/engine/systems/proshowcase';
import { activeAgreement, currentOf } from '@/engine/systems/pro';
import { DECISION_KIND, FOLLOW_UP_KIND, MEETING_KIND, REPLY_KIND as AGENT_REPLY_KIND, drawOf, endRefusal, relationOf, stillOwed } from '@/engine/systems/proagent';
import { AUDITION_KIND, CASTING_KIND, REPLY_KIND, TAPE_DUE_KIND, WORK_DAY_KIND, postingsAt, reachOf } from '@/engine/systems/projobs';
import { DUES_KIND, PAY_KIND, RELEASE_KIND, SAG_ELIGIBLE_KIND, joinSagRefusal } from '@/engine/systems/propay';
import { go, graduatingActor, playTo, readNotices, titleShape, transcriptFrom, type Player, type Transcript } from '../tools/career-player';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as subject } from '@/ui/looks/subject';

// TEST SETUP: the looks' links read the game's context, which a page's provider holds; here it's the save a test opens
// (as tests/evidence2-b08.test.ts does it, without the original, which imports the looks back).
const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({ get sim() { return h.sim; }, version: 0, run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }), toast: noop, navigate: noop } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
const AGENT = AGENTS[0]!;
const SEED_A = 'v1-21';
const SEED_B = 'v1-7';
/**
 * Desk Clerk in The Calloway Files as his breakdowns brought it the third time, on Monday 12 November 2029: the one
 * booked, where until 2026-10-21 v1-12's first, posted in June, was.
 */
const deskClerk = (sim: Simulation) => sim.player.pro!.opportunities.find((o) => o.projectId === 'calloway-files' && o.via === 'agent' && o.postedAt >= at(2029, 11, 12, 0));

/**
 * TEST SETUP: the life to the first morning of its last term, Monday 8 January 2029 at seven, before the School's term
 * handler at nine begins it: played by the clock six hours at a time, the body kept fed and rested and every part of
 * every open piece of coursework prepared each midnight, as tests/pro-showcase.test.ts makes its `finalTerm`.
 */
function lastTermMorning(seed: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) {
      if ((a.status !== 'open' && a.status !== 'revising') || a.course === SHOWCASE_COURSE) continue;
      for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
    }
  });
  const until = at(2029, 1, 8, 7);
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
  expect(sim.player.school!.standing).toBe('good');
  // A save opened again, as a player's is: the TEST SETUP's midnight work goes with the session that set it.
  return loadSave(deserialise(serialise(sim.universe)) as never);
}

/** Saved and opened again, as a player does between sessions. */
const cross = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

// ---------------------------------------------------------------------------------------------------------------------
// L1: what a career mustn't reset, part by part, and what each career step may write
// ---------------------------------------------------------------------------------------------------------------------

const J = (x: unknown) => JSON.stringify(x ?? null);
const CAREER_KIND = (kind: string) => kind.startsWith('pro.');
/**
 * The player's life outside the professional record, part by part, as tests/pro-core.test.ts's `carried` reads it, and
 * the rest of the person besides, so nothing goes unread: who they are; their abilities and techniques with how they
 * grow; their genres and the material they've met; the School's record; the practice briefs; the work and the
 * journey; their papers and earnings; their health; the body and its day; their money, every account and transaction;
 * where they are; their alerts; the calendar's commitments outside the career's; and the notices and questions of
 * other systems.
 */
function outside(sim: Simulation): Record<string, string> {
  const p = sim.player;
  const named = ['id', 'saveId', 'isPlayer', 'firstName', 'lastName', 'displayName', 'pronouns', 'performerTitle', 'birthInstant', 'raceEthnicity', 'homeRegionId', 'citizenshipId', 'family', 'personality', 'personalityTraits', 'genres', 'background', 'createdAt'];
  const parts: Record<string, string[]> = {
    abilities: ['attrs', 'craft', 'craftCeiling', 'development'], genres: ['engagement', 'experience'], school: ['school'], briefs: ['briefs'],
    work: ['work', 'journey'], papers: ['documents', 'earnings'], health: ['health'], body: ['wellbeing', 'awakeSince', 'lastSleptAt', 'wokeWithDebt', 'body', 'fedOn'],
    money: ['primaryAccountId', 'payments', 'credit'], place: ['currentLocationId'], alerts: ['alerts'],
  };
  const record = p as unknown as Record<string, unknown>;
  const pick = (keys: readonly string[]) => J(Object.fromEntries(keys.map((k) => [k, record[k]])));
  const known = new Set([...named, ...Object.values(parts).flat(), 'pro']);
  return {
    identity: pick(named),
    ...Object.fromEntries(Object.entries(parts).map(([k, keys]) => [k, pick(keys)])),
    rest: J(Object.fromEntries(Object.entries(record).filter(([k]) => !known.has(k)))),
    ledger: J({ accounts: Object.values(sim.universe.accounts).map((a) => [a.id, a.balance, a.held ?? null]), transactions: sim.universe.transactions.map((t) => t.id) }),
    calendar: J(sim.universe.scheduled.filter((i) => i.status === 'pending' && !CAREER_KIND(i.kind)).map((i) => [i.id, i.kind, i.at])),
    notices: J(sim.universe.notifications.filter((n) => n.category !== 'career').map((n) => [n.id, `${n.title}|${n.body}`])),
    questions: J(Object.values(sim.universe.decisions).filter((d) => d.category !== 'career').map((d) => [d.id, d.resolvedAt ?? null])),
  };
}
/**
 * The parts that differ between two states. The other systems' notices count as changed only where one was added or
 * reworded: the log keeps its latest 500 (`settleNotices`), so a career notice can push the oldest out.
 */
function changedParts(a: Record<string, string>, b: Record<string, string>): string[] {
  return Object.keys(a).filter((k) => {
    if (a[k] === b[k]) return false;
    if (k !== 'notices') return true;
    const before = new Map((JSON.parse(a[k]!) as [string, string][]));
    return (JSON.parse(b[k]!) as [string, string][]).some(([id, words]) => before.get(id) !== words);
  });
}

/** One career step watched: a command the player sent, or one of the career's items on the clock, and what it changed outside the record. */
interface Watched { what: string; at: number; changed: string[] }

/**
 * What each career step may write outside the professional record: the career's own notices, questions and calendar
 * items are inside it. A step that takes time moves the body's day beside an hour only waited (exertion, hunger);
 * preparation trains the abilities its steps train (`ordinary`); judged work goes on the work record and the journey,
 * and a night or a shoot day is work in its genres (J6); money moves through the ledger, and wages onto the year's
 * earnings. From 2026-10-21 (brief 20): a union's fee or dues paid from the bank counts in the year's dues too, as the
 * working dues taken from pay always did, so Join SAG-AFTRA and a union bill write the papers; and a night on stage takes
 * its nerves, which grow composure and presence, so a work day may write the abilities.
 */
const MAY: Readonly<Record<string, readonly string[]>> = {
  'school.choose_showcase': ['school'],
  'pro.headshots': ['body', 'ledger'], 'pro.update_resume': ['body'], 'pro.cut_reel': ['body', 'ledger'],
  'pro.agent_check': [], 'pro.send_materials': [], 'pro.supply_material': [], 'pro.accept_agreement': [], 'pro.decline_agreement': [], 'pro.end_agreement': [],
  'pro.ask_to_move': [], 'pro.join_sag': ['ledger', 'papers'],
  'pro.prepare': ['body', 'abilities'], 'pro.tape_audition': ['body', 'work'], 'world.take_decision_action': [],
  [FOLLOW_UP_KIND]: [], [AGENT_REPLY_KIND]: [], [MEETING_KIND]: [], [DECISION_KIND]: [],
  [REPLY_KIND]: [], [TAPE_DUE_KIND]: [], [CASTING_KIND]: [], [AUDITION_KIND]: ['work'],
  [WORK_DAY_KIND]: ['work', 'genres', 'body', 'abilities'], [SAG_ELIGIBLE_KIND]: [],
  [PAY_KIND]: ['ledger', 'papers'], [RELEASE_KIND]: ['ledger'], [DUES_KIND]: ['ledger', 'papers'],
};
/** How many of each kind are watched: enough to see what the kind writes, few enough to play in time. */
const WATCH_EACH = 2;

/**
 * The career's commands, the first few of each kind as the player sends them: a twin of the save, opened just before,
 * is moved to the same moment without the command, so what differs is what the command wrote and not what the clock
 * did meanwhile.
 */
function watchCommands(sim: Simulation, seen: Watched[], counted: Map<string, number>): void {
  const real = sim.execute.bind(sim);
  let depth = 0;
  sim.execute = ((cmd: Parameters<Simulation['execute']>[0]) => {
    if (depth > 0 || !(cmd.kind in MAY) || (counted.get(cmd.kind) ?? 0) >= WATCH_EACH) return real(cmd);
    depth += 1;
    try {
      const twin = cross(sim);
      const at0 = sim.now;
      const r = real(cmd);
      if (r.ok) {
        counted.set(cmd.kind, (counted.get(cmd.kind) ?? 0) + 1);
        if (sim.now > twin.now) twin.advanceTo(sim.now);
        seen.push({ what: cmd.kind, at: at0, changed: changedParts(outside(twin), outside(sim)) });
      }
      return r;
    } finally { depth -= 1; }
  }) as Simulation['execute'];
}

/**
 * Each kind of the career's items on the clock, the first few times one comes due: two twins of the save played to the
 * moment it runs, one with it and one with it called off, so what differs is what it wrote.
 */
function watchItems(sim: Simulation, seen: Watched[], counted: Map<string, number>): void {
  const due = sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind in MAY && CAREER_KIND(i.kind) && (counted.get(i.kind) ?? 0) < WATCH_EACH && i.at <= sim.now + 10 * MS_HOUR && i.at > sim.now && !seen.some((w) => w.what.startsWith(i.kind) && w.at === i.at));
  for (const item of due) {
    counted.set(item.kind, (counted.get(item.kind) ?? 0) + 1);
    const withIt = cross(sim);
    const without = cross(sim);
    without.timeline.cancel(item.id, without.now);
    // Both moved in the same steps, so the clock's own reckoning of the hours falls the same way in each.
    for (const twin of [withIt, without]) for (const to of [item.at - 1, item.at, item.at + 1]) twin.advanceTo(to);
    const ran = withIt.universe.scheduled.find((i: ScheduledItem) => i.id === item.id);
    seen.push({ what: `${item.kind}${ran?.status === 'missed' ? ' (missed)' : ''}`, at: item.at, changed: changedParts(outside(without), outside(withIt)) });
  }
}

/** What a career mustn't reset, kept whole at a moment for the comparison at the end. */
function kept(sim: Simulation) {
  const p = sim.player;
  return structuredClone({
    identity: outside(sim).identity, school: p.school!, briefs: p.briefs ?? null, work: p.work ?? [], journey: p.journey!, attrs: p.attrs!, craft: p.craft!,
    engagement: p.engagement!, documents: p.documents ?? null, earnings: p.earnings!, accounts: Object.keys(sim.universe.accounts), transactions: sim.universe.transactions,
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// Life A: the graduating student, played from the last term's first morning
// ---------------------------------------------------------------------------------------------------------------------

/** What life A left at each transition, for the tests below: each save, the transcript, and every career step watched. */
const A = { saves: new Map<string, string>(), order: [] as string[], lines: [] as string[], watched: [] as Watched[], start: undefined as ReturnType<typeof kept> | undefined, end: '' };
const opened = (name: string): Simulation => {
  const save = A.saves.get(name);
  expect(save, `life A was saved at ${name}`).toBeDefined();
  return loadSave(deserialise(save!) as never);
};

beforeAll(() => {
  let sim = lastTermMorning(SEED_A);
  A.start = kept(sim);
  const t: Transcript = transcriptFrom(sim);
  let moved = false;
  const items = new Map<string, number>();
  const commands = new Map<string, number>();
  const player: Player = {
    career: graduatingActor({ joinSag: true }),
    transcript: t,
    // At the meeting's stop, the first time: Ask To Move, the choice the meeting declares (`defineStop`, proagent.ts).
    stop: (_s, item) => {
      if (item.kind !== MEETING_KIND || moved) return 'go';
      moved = true;
      return stopChoices(MEETING_KIND)[0]!;
    },
    beforeHour: (s) => watchItems(s, A.watched, items),
  };
  watchCommands(sim, A.watched, commands);
  const keep = (name: string) => {
    A.saves.set(name, serialise(sim.universe));
    A.order.push(name);
    sim = cross(sim);
    watchCommands(sim, A.watched, commands);
  };
  /** Played until the moment comes, by a date it must come by. */
  const until = (name: string, by: number, reached: (s: Simulation) => boolean) => {
    playTo(sim, by, player, reached);
    expect(reached(sim), `${name} by ${formatDate(by, zone)}`).toBe(true);
    keep(name);
  };
  const pro = () => sim.player.pro!;
  const rel = () => relationOf(sim.player, AGENT.id);
  const calloway = () => deskClerk(sim);
  const booked = () => pro().engagements.find((e) => e.projectId === 'calloway-files');

  keep('term');
  until('chosen', at(2029, 1, 9), () => (pro().showcase?.scenes.length ?? 0) === 2);
  until('portfolio', at(2029, 5, 1), () => currentOf(pro(), 'reel') !== undefined);
  until('showcase', at(2029, 5, 10), () => pro().showcase!.performed.some((p) => p.city === 'us-ca-losangeles'));
  until('follow-up', at(2029, 5, 12), () => pro().showcase!.followUp !== undefined);
  until('sent', at(2029, 5, 12), () => rel()?.stage === 'sent');
  until('meeting-set', at(2029, 5, 26), () => rel()?.meeting !== undefined);
  until('degree', at(2029, 5, 22), () => sim.player.school!.standing === 'graduated');
  until('moved', at(2029, 5, 26), () => (rel()?.meeting?.moved ?? 0) === 1);
  until('met', at(2029, 6, 2), () => rel()?.meeting?.status === 'kept');
  until('offered', at(2029, 6, 8), () => pro().agreements.length > 0);
  until('signed', at(2029, 6, 8), () => pro().agreements[0]!.status === 'accepted');
  until('audition', at(2029, 11, 15), () => calloway()?.rounds?.[0]?.status === 'set');
  until('offer', at(2029, 11, 30), () => calloway()?.status === 'offered' || calloway()?.status === 'passed');
  until('booked', at(2029, 11, 30), () => booked() !== undefined);
  until('sag-joined', at(2029, 12, 31), () => pro().sag?.memberSince !== undefined);
  until('wrapped', at(2029, 12, 31), () => booked()!.status === 'finished');
  until('in-trust', at(2029, 12, 31), () => booked()!.pay.every((p) => p.inTrust !== undefined));
  until('paid-on', at(2029, 12, 31), () => booked()!.pay.every((p) => p.received !== undefined));
  until('resume', at(2029, 12, 31), () => (currentOf(pro(), 'resume')?.keys ?? []).includes(`pro:${booked()!.creditId}`));
  // The first billing after she joined SAG-AFTRA: May's, 2030 (until 2026-10-21 v1-12's was 1 November 2029, the
  // transition named for it).
  until('may', at(2030, 5, 2), () => (pro().unionBills ?? []).some((b) => b.key === 'sag-aftra:dues:2030-05' && b.settled));
  // Representation ended by agreement, with the command its panel sends: End It By Agreement.
  expect(sim.execute({ kind: 'pro.end_agreement', payload: { how: 'agreement' } }).ok).toBe(true);
  readNotices(sim, t);
  keep('ended');
  A.lines = t.lines;
  A.end = serialise(sim.universe);
}, 900_000);

/** A title by its shape: his office, however the build names it (`titleShape`). */
const shape = (title: string) => titleShape(title, { name: AGENT.name, agency: agencyOf(AGENT).name });
/**
 * The transcript's lines whose step and title match: what the player met, in the order they met it, with its moment.
 * Titles are compared by their shape.
 */
const met = (lines: readonly string[], pick: RegExp) => lines.map((l) => l.split(' | ')).map((x) => [x[0], x[1], shape(x[2] ?? ''), ...x.slice(3)]).filter((x) => pick.test(`${x[1]} | ${x[2]}`)).map((x) => `${x[0]} | ${x[1]}: ${x[2]}${x[1] === 'STOP' ? ` | ${x[3]}` : ''}`);
/** The first notice in a transcript whose title has this shape, as the player read it. */
const notice = (lines: readonly string[], title: string) => lines.find((l) => { const x = l.split(' | '); return x[1] === 'NOTICE' && shape(x[2] ?? '') === title; });
const NY_OFFICE = 'us-ny-newyork';
const money = (cents: number) => formatMoney(cents, 'USD');
const BAND_RANK = { unready: 0, working: 1, strong: 2, exceptional: 3 } as const;

describe('V1 and A1: a graduating student carried into the career, played whole (life A, seed v1-21)', () => {
  it('saves and opens the life at each of its 22 transitions, in the order a player meets them, every law of the world holding at each', () => {
    expect(A.order).toEqual(['term', 'chosen', 'portfolio', 'showcase', 'follow-up', 'sent', 'meeting-set', 'degree', 'moved', 'met', 'offered', 'signed', 'audition', 'offer', 'booked', 'sag-joined', 'wrapped', 'in-trust', 'paid-on', 'resume', 'may', 'ended']);
    for (const name of A.order) { const s = opened(name); expect(breaches(s.universe, s.now), name).toEqual([]); }
  });

  it('A1, the School’s side played: the faculty’s two scenes chosen on the first morning; headshots, a résumé and a reel cut from the filmed monologues once the School posts them; the showcase in New York and Los Angeles; the degree at Commencement, and Equity with it', () => {
    const sc = opened('chosen').player.pro!.showcase!;
    // The two the faculty would choose: their first two scenes, each in the part listed first (`showcaseOptions`' Faculty).
    const firsts = sc.options!.filter((o, i, all) => all.findIndex((y) => y.scene === o.scene) === i).slice(0, 2);
    expect(sc.scenes.map((x) => [x.id, x.role, x.by])).toEqual(firsts.map((o) => [o.scene, o.role, 'you']));
    // The portfolio, the Saturday after the term review: each its own command, at its own cost (the design's estimates).
    const pf = opened('portfolio');
    expect(pf.player.pro!.materials.map((m) => [m.kind, formatDate(m.made, zone), m.cost ?? 0])).toEqual([['headshot', 'April 28, 2029', 700_00], ['resume', 'April 28, 2029', 0], ['reel', 'April 28, 2029', 250_00]]);
    // The reel holds only what was recorded: the DRAM 473b monologues the School films and posts at the term's end.
    expect(currentOf(pf.player.pro, 'reel')!.pieces!.map((x) => [x.from, formatDate(x.at, zone)])).toEqual([['monologues', 'April 27, 2029']]);
    expect(opened('showcase').player.pro!.showcase!.performed.map((x) => [x.city, formatDate(x.at, zone)])).toEqual([
      [NY_OFFICE, 'April 30, 2029'], [NY_OFFICE, 'April 30, 2029'], [NY_OFFICE, 'May 1, 2029'], [NY_OFFICE, 'May 1, 2029'],
      ['us-ca-losangeles', 'May 8, 2029'], ['us-ca-losangeles', 'May 8, 2029'],
    ]);
    const deg = opened('degree');
    expect(deg.player.school!.standing).toBe('graduated');
    expect(formatDate(deg.player.school!.endedAt!, zone)).toBe('May 21, 2029');
    expect(deg.player.pro!.equity).toEqual({ since: deg.player.school!.endedAt, how: 'degree' });
    expect(met(A.lines, /^(NOTICE \| (Spring Term|The Actor Showcase|In Good Standing|Your MFA|Your Equity|Actors’ Equity Association: \$600)|PRESS \| (Choose|Book A Headshot|Make Your|Cut A Reel)|STOP \| (The Actor Showcase|Commencement))/)).toEqual([
      'January 8, 2029 at 9:00 AM | NOTICE: Spring Term 2029 Begins', 'January 8, 2029 at 9:00 AM | NOTICE: The Actor Showcase',
      'January 8, 2029 at 9:00 AM | PRESS: Choose These Scenes (the faculty’s two)', 'April 27, 2029 at 5:00 PM | NOTICE: In Good Standing',
      'April 28, 2029 at 9:00 AM | PRESS: Book A Headshot Session', 'April 28, 2029 at 1:00 PM | PRESS: Make Your Résumé', 'April 28, 2029 at 2:00 PM | PRESS: Cut A Reel (one piece)',
      'April 30, 2029 at 1:00 PM | STOP: The Actor Showcase In New York | Go', 'April 30, 2029 at 1:00 PM | NOTICE: The Actor Showcase In New York',
      'May 1, 2029 at 9:00 AM | STOP: The Actor Showcase In New York | Go', 'May 1, 2029 at 9:00 AM | NOTICE: The Actor Showcase In New York',
      'May 8, 2029 at 9:00 AM | STOP: The Actor Showcase In Los Angeles | Go', 'May 8, 2029 at 9:00 AM | NOTICE: The Actor Showcase In Los Angeles',
      'May 21, 2029 at 10:00 AM | STOP: Commencement | Go', 'May 21, 2029 at 10:00 AM | NOTICE: Your Equity Initiation Fee',
      'May 21, 2029 at 10:00 AM | NOTICE: Actors’ Equity Association: $600.00 Paid', 'May 21, 2029 at 10:00 AM | NOTICE: Your MFA Is Conferred',
    ]);
  });

  it('the School’s follow-up passes on his office’s request to meet; Check Your Materials and Send Your Materials; the meeting set, its calendar entry saying the trip goes with it and what missing it costs, moved a week with Ask To Move at its stop, and kept; the agreement offered with every term, and accepted with Accept The Agreement', () => {
    const fu = opened('follow-up');
    const rel = relationOf(fu.player, AGENT.id)!;
    expect(fu.player.pro!.showcase!.followUp).toEqual({ at: at(2029, 5, 11, 10), agents: [AGENT.id] });
    expect(rel.via).toEqual({ route: 'showcase', at: at(2029, 5, 11, 10), by: 'the School' });
    // Why: five of the seven factors at the bar or beyond (four needed), the work Working at best (the showcase and the
    // reel alike), and his list's assumed room for two leads her age: 0.15 times 1.25. The approach's draw fell under it
    // (0.058 on v1-21, as 0.053 had on v1-12 with the real agent, whose reading here was the same).
    expect(rel.why!.factors.map((f) => [f.id, f.level])).toEqual([['work', 'near'], ['relevance', 'at'], ['training', 'near'], ['fit', 'at'], ['availability', 'at'], ['roster', 'beyond'], ['reliability', 'at']]);
    expect([rel.why!.step, rel.why!.outcome, rel.why!.atOrBeyond, rel.why!.needed, rel.why!.chance]).toEqual(['follow-up', 'asked', 5, 4, 0.15 * 1.25]);
    expect(drawOf(fu, fu.player, AGENT, 1, 'interest')).toBeLessThan(rel.why!.chance!);
    // Checked and sent the same morning; asked to meet, the answer comes in a week.
    const sent = relationOf(opened('sent').player, AGENT.id)!;
    expect(sent.history.map((e) => e.kind)).toEqual(['discovered', 'introduced', 'checked', 'sent']);
    const ms = opened('meeting-set');
    const m = relationOf(ms.player, AGENT.id)!.meeting!;
    expect([formatDate(m.at, zone), zonedParts(m.at, zone).hour, m.where, m.moved, m.status]).toEqual(['May 25, 2029', 11, 'office', 0, 'set']);
    const item = ms.universe.scheduled.find((i) => i.kind === MEETING_KIND && i.status === 'pending')!;
    expect([item.requiresPlayer, item.travelMinutes, item.locationId, item.durationMinutes]).toEqual([true, 120, NY_OFFICE, 60]);
    // Opened from the calendar (J6): the trip goes with it, and missing it closes the approach, as its handler has it.
    h.sim = ms;
    const words = renderToStaticMarkup(createElement('div', null, (resolveLook(ms, subject('entry', item.id)) as Looked).body)).replace(/<[^>]+>/g, '');
    expect(words).toContain('You need to be there, awake, when the clock reaches it. If you aren’t, it’s missed: his office closes your approach, and looks again only after a year, at something new.');
    expect(words).toContain('It’s in New York, two hours each way from New Haven, and the trip is part of it.');
    // Moved with Ask To Move at the stop, the choice the meeting declares; the clock carried on, and the moved one kept.
    const mv = relationOf(opened('moved').player, AGENT.id)!;
    expect([formatDate(mv.meeting!.at, zone), mv.meeting!.moved]).toEqual(['June 1, 2029', 1]);
    expect(mv.history.find((e) => e.kind === 'meeting-moved')!.words).toBe('You asked to move the meeting from May 25, 2029 at 11:00 AM, and his office moved it to June 1, 2029 at 11:00 AM.');
    expect(relationOf(opened('met').player, AGENT.id)!.meeting!.status).toBe('kept');
    // The decision, five days on: the offer's draw under its chance, 0.35 times 1.25.
    const of = opened('offered');
    const ofRel = relationOf(of.player, AGENT.id)!;
    expect([ofRel.why!.step, ofRel.why!.outcome, ofRel.why!.chance]).toEqual(['decision', 'offer', 0.35 * 1.25]);
    expect(drawOf(of, of.player, AGENT, 1, 'offer')).toBeLessThan(ofRel.why!.chance!);
    const a = of.player.pro!.agreements[0]!;
    expect(a.terms).toEqual(AGREEMENT_TERMS);
    expect([a.status, formatDate(a.offeredAt, zone), formatDate(a.standsUntil, zone)]).toEqual(['offered', 'June 6, 2029', 'June 20, 2029']);
    const sg = opened('signed');
    const signed = sg.player.pro!.agreements[0]!;
    expect([signed.status, formatDate(signed.signedAt!, zone), formatDate(signed.endsAt!, zone)]).toEqual(['accepted', 'June 6, 2029', 'June 6, 2030']);
    expect(relationOf(sg.player, AGENT.id)!.stage).toBe('represented');
    // Checked and sent at 10:20 from 2026-10-21, when brief 20's life area had a sleep after the night stop costing
    // condition and mood as a short night does, and her morning went otherwise by twenty minutes; at 10:00 until then.
    expect(met(A.lines, /^(NOTICE \| (The School’s Follow-Up|A Meeting|You Met|He Offered)|PRESS \| (Check|Send Your|Accept The Agreement)|STOP \| Meeting)/)).toEqual([
      'May 11, 2029 at 10:00 AM | NOTICE: The School’s Follow-Up After The Showcase', 'May 11, 2029 at 10:20 AM | PRESS: Check Your Materials', 'May 11, 2029 at 10:20 AM | PRESS: Send Your Materials',
      'May 18, 2029 at 10:00 AM | NOTICE: A Meeting Is Set', 'May 25, 2029 at 11:00 AM | STOP: Meeting At Halberd Talent | Ask To Move',
      'June 1, 2029 at 11:00 AM | STOP: Meeting At Halberd Talent | Go', 'June 1, 2029 at 11:00 AM | NOTICE: You Met His Office',
      'June 6, 2029 at 10:00 AM | NOTICE: He Offered You Representation', 'June 6, 2029 at 10:00 AM | PRESS: Accept The Agreement',
    ]);
    // None came before her own send, and none carries the line a real agent's did until 2026-10-21.
    const his = A.lines.filter((l) => { const x = l.split(' | '); return x[1] === 'NOTICE' && /^(A Meeting Is Set|You Met His Office|He Offered You Representation|Submitted For|Not Cast As|An Audition For|A Self-Tape For|A Callback For)/.test(shape(x[2] ?? '')); });
    expect(his.length).toBeGreaterThan(5);
    for (const l of his) expect(l).not.toMatch(/Fictional:/);
  });

  it('through him: his breakdowns and his submissions with her portfolio, the network co-star’s self-tape taped, its offer at scale plus ten accepted from What Needs You, the two shoot days played, the pay into Halberd Talent’s client trust account and on to her less $280.40 commission, and the credit on her résumé', () => {
    const au = opened('audition');
    const o = deskClerk(au)!;
    const agreementId = au.player.pro!.agreements[0]!.id;
    expect([o.via, o.agentId, o.agreementId, o.status, o.rounds![0]!.form]).toEqual(['agent', AGENT.id, agreementId, 'audition', 'self-tape']);
    expect(o.sent!.map((x) => x.kind)).toEqual(['headshot', 'resume', 'reel']);
    // The third time his breakdowns brought the part: the first self-tape judged Working and the second Strong, and casting
    // passed both. Both were Working until brief 21 (2026-10-22): from then the drama she'd worked in at the School counts
    // half toward a police procedural, a kind of drama (`relatedness`), so each tape's genre part read 0.23 of 0.9 where it
    // had read nothing, and the August tape came to 66.5, not 64.5.
    expect(au.player.pro!.opportunities.filter((x) => x.projectId === 'calloway-files' && x.via === 'agent').map((x) => [formatDate(x.postedAt, zone), x.status, x.rounds?.[0]?.band ?? null])).toEqual([
      ['June 11, 2029', 'passed', 'working'], ['August 27, 2029', 'passed', 'strong'], ['November 12, 2029', 'audition', null],
    ]);
    // The offer: SAG-AFTRA's Day Performer minimum for work from July 1, 2029, $1,402.00 (work.md S30), plus ten percent.
    const of = opened('offer');
    const offered = of.player.pro!.opportunities.find((x) => x.id === o.id)!;
    expect(offered.offer).toMatchObject({ amount: 1_542_20, per: 'day', units: 2, rate: 'sag-tv-day' });
    expect(Math.round(1_402_00 * 1.1)).toBe(1_542_20);
    const q = Object.values(of.universe.decisions).find((d) => d.refId === o.id)!;
    expect(q.detail).toContain('It pays $1,542.20 a day for two days, above the SAG-AFTRA Day Performer minimum of $1,402.00.');
    expect(q.actions.map((x) => x.label)).toEqual(['Accept The Offer', 'Decline The Offer']);
    // Booked under the agreement: two shoot days on the calendar with the trip, the pay promised and nothing posted.
    const bk = opened('booked');
    const e = bk.player.pro!.engagements.find((x) => x.opportunityId === o.id)!;
    expect([e.agreementId, e.agentId, e.status]).toEqual([agreementId, AGENT.id, 'booked']);
    expect(e.days.map((d) => formatDate(d.from, zone))).toEqual(['December 17, 2029', 'December 18, 2029']);
    expect(e.pay.map((x) => [x.promised, formatDate(x.due, zone), x.received ?? null, x.inTrust ?? null])).toEqual([[2 * 1_542_20, 'December 20, 2029', null, null]]);
    expect(bk.universe.scheduled.filter((i) => i.kind === WORK_DAY_KIND && i.refId === e.id).map((i) => [i.requiresPlayer, i.travelMinutes])).toEqual([[true, 120], [true, 120]]);
    // Worked and judged, the credit shot; and, the J6 rule, each day is work in the project's genres (content/engagement.ts).
    // Until brief 21 (2026-10-22) a day's practice was shared between police procedural and crime, 100 x 0.1 x a half of
    // what's left, twice; from then crime, listed beside its own kind, is one requirement with it, the police procedural,
    // so the whole day's practice is the procedural's, 100 x 0.1 of what's left, twice: 10, then 9 more. Crime itself
    // is read through its kind (`relatedness`), and isn't practised apart.
    const wr = opened('wrapped');
    const done = wr.player.pro!.engagements.find((x) => x.id === e.id)!;
    expect(done.log!.map((l) => [l.status, l.band !== undefined])).toEqual([['worked', true], ['worked', true]]);
    expect(wr.player.pro!.credits.find((c) => c.engagementId === e.id)).toMatchObject({ kind: 'screen', project: 'The Calloway Files', role: 'Desk Clerk', company: 'Bright Harbor Television', year: 2029, status: 'shot', union: 'sag-aftra' });
    const day1 = 100 * ENGAGEMENT.genre.practice;
    for (const g of ['police_procedural', 'crime']) expect(bk.player.engagement?.byGenre[g]?.practice ?? 0).toBe(0);
    expect(wr.player.engagement!.byGenre.police_procedural!.practice).toBeCloseTo(day1 + 100 * ENGAGEMENT.genre.practice * (1 - day1 / 100), 2);
    expect(wr.player.engagement!.byGenre.police_procedural!.practice).toBeCloseTo(19, 2);
    expect(wr.player.engagement?.byGenre.crime?.practice ?? 0).toBe(0);
    // The payday: into the trust account. Commission is only what's over scale, ($1,542.20 - $1,402.00) x 2 = $280.40
    // (representation.md S3), and, a member by then, SAG-AFTRA's working dues of 1.575% (work.md S20): $48.58.
    const tr = opened('in-trust').player.pro!.engagements.find((x) => x.id === e.id)!.pay[0]!;
    expect(tr.inTrust).toMatchObject({ agency: 'Halberd Talent', gross: 3_084_40, commission: 280_40, dues: 48_58 });
    expect((1_542_20 - 1_402_00) * 2).toBe(280_40);
    expect(Math.round(3_084_40 * UNIONS.sagAftra.workingDues)).toBe(48_58);
    expect(tr.inTrust!.held).toBe(3_084_40 - tr.inTrust!.withheld - 48_58);
    expect(formatDate(tr.inTrust!.releaseAt, zone)).toBe('December 26, 2029');
    // Passed on three business days later (Christmas Day not among them), less the commission, into her checking: what
    // was held, less $280.40.
    const po = opened('paid-on');
    const r = po.player.pro!.engagements.find((x) => x.id === e.id)!.pay[0]!.received!;
    expect(r).toMatchObject({ via: 'trust', gross: 3_084_40, commission: 280_40, dues: 48_58, net: tr.inTrust!.held - 280_40 });
    const passed = po.universe.transactions.find((x) => x.id === r.txnId)!;
    expect(passed.postings.some((x) => x.amount === r.net && po.universe.accounts[x.accountId]?.ownerId === po.player.id)).toBe(true);
    expect(met(A.lines, /^(NOTICE \| (Pay Held|Paid On))/).slice(0, 2)).toEqual(['December 20, 2029 at 12:00 PM | NOTICE: Pay Held For You At Halberd Talent', 'December 26, 2029 at 12:00 PM | NOTICE: Paid On From Halberd Talent']);
    const paidOn = notice(A.lines, 'Paid On From Halberd Talent')!;
    expect(paidOn).toContain('$280.40');
    expect(paidOn).toContain(`${money(r.net)} went into your`);
    // The credit on the résumé, made from the record by Update Your Résumé.
    expect(currentOf(opened('resume').player.pro, 'resume')!.contains).toContain('Desk Clerk, The Calloway Files, Bright Harbor Television, 2029 (not yet released)');
  });

  // Until 2026-10-21 this said "at the November billing": v1-12's first billing as a member was 1 November 2029, and
  // v1-21's, who joined in December, is 1 May 2030.
  it('Join SAG-AFTRA after her first SAG-AFTRA principal job began: refused before it with its reason, $3,244.07 taken once, SAG-AFTRA’s working dues taken from that job’s pay, and half a year’s base dues taken at the May billing beside Equity’s', () => {
    const bk = opened('booked');
    expect(joinSagRefusal(bk, bk.player)).toBe('You can join SAG-AFTRA once you’ve worked a SAG-AFTRA principal role: a TV, theatrical or Low Budget film part. Ultra Low Budget and student films don’t count toward it.');
    const sj = opened('sag-joined');
    expect(formatDate(sj.player.pro!.sag!.eligibleSince!, zone)).toBe('December 17, 2029');
    expect(sj.player.pro!.sag!.memberSince).toBeGreaterThanOrEqual(sj.player.pro!.sag!.eligibleSince!);
    // SAG-AFTRA's initiation fee and half a year's base dues, from its pages as a search engine copied them (work.md S20).
    const fee = sj.universe.transactions.filter((x) => x.memo === 'SAG-AFTRA: initiation fee and half a year’s base dues');
    expect(fee).toHaveLength(1);
    expect(3_121_00 + Math.round(246_14 / 2)).toBe(3_244_07);
    const own = Object.values(sj.universe.accounts).filter((x) => x.ownerId === sj.player.id).map((x) => x.id);
    expect(fee[0]!.postings.filter((x) => own.includes(x.accountId)).map((x) => x.amount)).toEqual([-3_244_07]);
    expect(sj.player.pro!.unionBills!.find((b) => b.key === 'sag-aftra:dues:2030-05')).toMatchObject({ amount: 123_07, due: at(2030, 5, 1) });
    expect(opened('in-trust').player.pro!.engagements[0]!.pay[0]!.inTrust!.dues).toBe(48_58);
    const may = opened('may');
    expect(may.player.pro!.unionBills!.filter((b) => b.due === at(2030, 5, 1)).map((b) => [b.key, b.amount, b.settled?.how])).toEqual([['equity:dues:2030-05', 88_00, 'paid'], ['sag-aftra:dues:2030-05', 123_07, 'paid']]);
    expect(may.universe.transactions.filter((x) => x.memo === 'SAG-AFTRA: initiation fee and half a year’s base dues')).toHaveLength(1);
    // A member's résumé says so, made by Update Your Résumé after she joined (from 2026-10-21, the audit's second reading:
    // with the line taken out of `resumeNow`, every test still passed).
    const made = currentOf(opened('resume').player.pro, 'resume')!.contains;
    expect(made).toContain('SAG-AFTRA');
    expect(made).not.toContain('SAG-AFTRA Eligible');
    // Equity's November dues came before the job, billed alone; May's were both unions'.
    expect(met(A.lines, /^(NOTICE \| (You Can Join|SAG-AFTRA:|Actors’ Equity Association: \$88)|PRESS \| Join)/)).toEqual([
      'November 1, 2029 at 9:00 AM | NOTICE: Actors’ Equity Association: $88.00 Paid',
      'December 17, 2029 at 7:00 AM | NOTICE: You Can Join SAG-AFTRA', 'December 17, 2029 at 6:00 PM | PRESS: Join SAG-AFTRA',
      'May 1, 2030 at 9:00 AM | NOTICE: Actors’ Equity Association: $88.00 Paid', 'May 1, 2030 at 9:00 AM | NOTICE: SAG-AFTRA: $123.07 Paid',
    ]);
  });

  it('End It By Agreement ends the agreement that day, says what it leaves owed, and his breakdowns stop coming', () => {
    const before = opened('may');
    expect(endRefusal(before, before.player, AGENT, 'agreement')).toBeUndefined();
    const sim = opened('ended');
    const a = sim.player.pro!.agreements[0]!;
    expect([a.status, a.endedHow, formatDate(a.endedAt!, zone)]).toEqual(['ended', 'agreement', 'May 1, 2030']);
    expect(relationOf(sim.player, AGENT.id)!.stage).toBe('ended');
    expect(activeAgreement(sim.player, sim.now)).toBeUndefined();
    const ended = sim.universe.notifications.filter((n) => shape(n.title) === 'Your Agreement Ended');
    expect(ended).toHaveLength(1);
    expect(ended[0]!.body).toBe(`Your agreement with ${AGENT.name} at Halberd Talent ended on May 1, 2030, by agreement. ${stillOwed(sim.player, a)}`);
    // His breakdowns no longer reach her: each project comes openly where it takes actors' own submissions, or not at all.
    const monday = at(2030, 5, 6);
    expect(postingsAt(sim, sim.player, monday).some((x) => x.via === 'agent')).toBe(false);
    expect(reachOf(projectById('calloway-files')!, activeAgreement(sim.player, monday))).toBeUndefined();
    expect(reachOf(projectById('calloway-files')!, before.player.pro!.agreements[0])).toBe('agent');
  });

  it('Equity’s ending with no offer is refused while she’s employed on covered work through him, between its work days as on them, and not once it’s finished', () => {
    // From the audit's third reading (2026-10-21): with this refusal taken out every test still passed, and it read only
    // a work day's own hours, which the clock passes whole. Life A's save from the evening she joined SAG-AFTRA, between
    // her two shoot days.
    const sim = opened('sag-joined');
    const job = sim.player.pro!.engagements.find((e) => e.projectId === 'calloway-files')!;
    expect(job.days.some((d) => d.from <= sim.now && sim.now <= d.to)).toBe(false);
    expect(job.days[0]!.from).toBeLessThan(sim.now);
    const words = 'You’re doing covered work now, and Equity’s rule doesn’t let you end it while you are.';
    expect(endRefusal(sim, sim.player, AGENT, 'no-offer')).toBe(words);
    expect(sim.execute({ kind: 'pro.end_agreement', payload: { how: 'no-offer' } }).error).toBe(words);
    expect(sim.player.pro!.agreements[0]!.status).toBe('accepted');
    // Finished, the rule's own days are what's read: the offer for this job was too recent.
    const wrapped = opened('wrapped');
    expect(endRefusal(wrapped, wrapped.player, AGENT, 'no-offer')).toMatch(/^Equity’s rule lets you end it once 90 days go by with no real offer of covered work through him\. His last came on /);
  });

  it('End It By Agreement before a job’s pay comes leaves his commission owed on it: said when it ends, and taken from that pay when it comes', () => {
    // From the audit's second reading (2026-10-21): the commission still owed after an ending was read only on agreements
    // ended by hand, and life A's played ending left nothing to pay. A twin of life A from its save the day the shoot
    // wrapped, before the pay: the same command, then played on to the pay.
    let sim = opened('wrapped');
    const job = sim.player.pro!.engagements.find((e) => e.projectId === 'calloway-files')!;
    expect(job.pay.every((x) => x.received === undefined)).toBe(true);
    expect(sim.execute({ kind: 'pro.end_agreement', payload: { how: 'agreement' } }).ok).toBe(true);
    const a = sim.player.pro!.agreements[0]!;
    expect([a.status, a.endedHow]).toEqual(['ended', 'agreement']);
    const owed = 'Commission stays owed on the pay still to come from contracts you made while it ran: Desk Clerk in The Calloway Files. It comes out of that pay when it’s paid.';
    expect(stillOwed(sim.player, a)).toContain(owed);
    expect(sim.universe.notifications.filter((n) => shape(n.title) === 'Your Agreement Ended').at(-1)!.body).toContain(owed);
    sim = cross(sim);
    const t = transcriptFrom(sim);
    const paidAll = (s: Simulation) => s.player.pro!.engagements.find((e) => e.id === job.id)!.pay.every((x) => x.received !== undefined);
    playTo(sim, at(2029, 12, 31), { career: graduatingActor({ joinSag: true }), transcript: t }, paidAll);
    expect(paidAll(sim)).toBe(true);
    // The same figures as the life that kept him: the agreement's end didn't take the commission off what it was owed on.
    const twin = opened('paid-on').player.pro!.engagements.find((e) => e.id === job.id)!;
    const here = sim.player.pro!.engagements.find((e) => e.id === job.id)!;
    expect(here.pay.map((x) => [x.received!.commission, x.received!.via])).toEqual(twin.pay.map((x) => [x.received!.commission, x.received!.via]));
    expect(here.pay.reduce((n, x) => n + x.received!.commission, 0)).toBe(280_40);
  });

  it('L1: each career command and each of the career’s steps on the clock wrote nothing outside the professional record but its own, and from the last term’s first morning to the end nothing was reset: who she is, the School’s record, the work and its journey, her abilities and genres, her papers and her money', () => {
    // Every step watched, against what it may write (`MAY`): a twin of the save without it shows what it changed.
    expect(A.watched.map((w) => [w.what, w.changed.filter((c) => !MAY[w.what.replace(' (missed)', '')]!.includes(c))]).filter(([, extra]) => extra!.length)).toEqual([]);
    const watched = new Set(A.watched.map((w) => w.what));
    for (const kind of ['school.choose_showcase', 'pro.headshots', 'pro.update_resume', 'pro.cut_reel', 'pro.agent_check', 'pro.send_materials', 'pro.ask_to_move', 'pro.accept_agreement', 'pro.prepare', 'pro.tape_audition', 'world.take_decision_action', 'pro.join_sag', 'pro.end_agreement',
      FOLLOW_UP_KIND, AGENT_REPLY_KIND, MEETING_KIND, DECISION_KIND, REPLY_KIND, CASTING_KIND, WORK_DAY_KIND, SAG_ELIGIBLE_KIND, PAY_KIND, RELEASE_KIND, DUES_KIND]) expect(watched, kind).toContain(kind);
    // From the first morning to the end: nothing reset. Who she is, to the byte.
    const start = A.start!;
    const end = opened('ended');
    const now = kept(end);
    expect(now.identity).toBe(start.identity);
    // The School's record carried on: every credit, term review and earlier term's course as it was.
    expect(now.school.credits!.slice(0, start.school.credits!.length)).toEqual(start.school.credits);
    expect(now.school.history.slice(0, start.school.history.length)).toEqual(start.school.history);
    for (const [key, course] of Object.entries(start.school.courses ?? {})) if (course.term < 5) expect(now.school.courses![key], key).toEqual(course);
    expect(now.school.classmates.map((c) => c.name)).toEqual(start.school.classmates.map((c) => c.name));
    expect(now.briefs).toEqual(start.briefs);
    // The work record keeps its last 160: what's left of the morning's is as it was, and the journey only grew.
    const kept160 = start.work.filter((w) => now.work.some((x) => x.at === w.at && x.what === w.what));
    for (const w of kept160) expect(now.work.find((x) => x.at === w.at && x.what === w.what)).toEqual(w);
    // Only the oldest went, by the cap: what's left of the morning's is its newest, in order.
    expect(start.work.slice(start.work.length - kept160.length)).toEqual(kept160);
    for (const [task, total] of Object.entries(start.journey.totals)) expect(now.journey.totals[task]!.n, task).toBeGreaterThanOrEqual(total!.n);
    expect(now.journey.milestones.slice(0, start.journey.milestones.length)).toEqual(start.journey.milestones);
    // Abilities, techniques and genres grow or hold; none went back to an earlier level.
    for (const [k, v] of Object.entries(start.craft)) expect(now.craft[k as keyof typeof now.craft], k).toBeGreaterThanOrEqual(v as number);
    for (const [g, v] of Object.entries(start.engagement.byGenre)) {
      expect(now.engagement.byGenre[g]!.familiarity, g).toBeGreaterThanOrEqual(v.familiarity);
      expect(now.engagement.byGenre[g]!.practice, g).toBeGreaterThanOrEqual(v.practice);
    }
    // Papers and money: earlier years' earnings as they were, every account kept, every transaction as it was posted.
    for (const [year, y] of Object.entries(start.earnings.years ?? {})) if (Number(year) < 2029) expect(now.earnings.years![Number(year)], year).toEqual(y);
    expect(now.documents).toEqual(start.documents);
    for (const id of start.accounts) expect(now.accounts).toContain(id);
    const byId = new Map(now.transactions.map((x) => [x.id, x]));
    for (const x of start.transactions) expect(byId.get(x.id), x.id).toEqual(x);
  });
});

describe('preparation, played as twins from the same moment of life A (the falsifiability test: change the preparation, and the band moves)', () => {
  it('the same SAG-AFTRA self-tape: its sides prepared to ready with Break It Down, Learn The Lines and Rehearse It On Your Feet, against taped cold, comes out higher, and a band higher', () => {
    const tape = (sides: boolean) => {
      const sim = opened('audition');
      const o = () => deskClerk(sim)!;
      playTo(sim, sim.now + 6 * MS_DAY, { career: graduatingActor({ joinSag: true, sides }) }, () => o().rounds![0]!.status !== 'set');
      return { prep: o().prep, round: o().rounds![0]! };
    };
    const prepared = tape(true);
    const cold = tape(false);
    expect(cold.prep).toBeUndefined();
    expect(prepared.prep!.interpretation).toBeGreaterThanOrEqual(0.8);
    expect([prepared.round.status, cold.round.status]).toEqual(['done', 'done']);
    expect(prepared.round.overall!).toBeGreaterThan(cold.round.overall! + 10);
    expect(BAND_RANK[prepared.round.band!]).toBeGreaterThan(BAND_RANK[cold.round.band!]);
  });

  it('J6, health and readiness: the same self-tape, its sides prepared alike, taped at ten in the morning after a night’s sleep against after a night awake, comes out lower tired, and says the day’s condition held it back', () => {
    const tape = (sleeps: boolean) => {
      const sim = opened('audition');
      const o = () => deskClerk(sim)!;
      const player: Player = { career: graduatingActor({ joinSag: true, tape: false }) };
      // The tape is due on Sunday 18 November at six; taped the morning before (until 2026-10-21, v1-12's on 30 June).
      playTo(sim, at(2029, 11, 16, 22), player);
      // The night before: slept as the Sleep dialog suggests, or stayed up, the clock moved through it by the hour.
      if (sleeps) playTo(sim, at(2029, 11, 17, 10), player);
      else for (let h = sim.now; h < at(2029, 11, 17, 10); h += MS_HOUR) go(sim, Math.min(at(2029, 11, 17, 10), h + MS_HOUR));
      expect(sim.execute({ kind: 'pro.tape_audition', payload: { opportunityId: o().id } }).ok).toBe(true);
      const work = sim.player.work!.at(-1)!;
      expect(work.what).toBe('Desk Clerk, The Calloway Files: Audition, Taped');
      return { prep: o().prep!, round: o().rounds![0]!, energy: sim.player.wellbeing.energy, limits: work.limits };
    };
    const rested = tape(true);
    const tired = tape(false);
    expect(tired.prep).toEqual(rested.prep);
    expect(tired.energy).toBeLessThan(rested.energy);
    expect(rested.round.overall!).toBeGreaterThan(tired.round.overall! + 3);
    // The drill-down says how: the tape's work record, which the Player Profile's work look opens, names the tiredness.
    expect(tired.limits.some((l) => l.what === 'fatigue')).toBe(true);
    expect(rested.limits.some((l) => l.what === 'fatigue')).toBe(false);
  });

  it('the same booked network part: its preparation done to ready against not at all, judged on its two shoot days, comes out higher each day, and a band higher', () => {
    const shoot = (part: boolean) => {
      const sim = opened('offer');
      const e = () => sim.player.pro!.engagements.find((x) => x.projectId === 'calloway-files');
      playTo(sim, at(2029, 12, 19), { career: graduatingActor({ joinSag: true, part }) }, () => e()?.status === 'finished');
      return e()!;
    };
    const prepared = shoot(true);
    const left = shoot(false);
    // Left alone, the part has only the half of the sides' preparation every booking starts from (`WORK.sidesKept`).
    expect(left.prep!.memorization).toBeLessThan(prepared.prep!.memorization);
    expect(left.prep!.rehearsal).toBeLessThan(prepared.prep!.rehearsal);
    for (const day of [0, 1]) {
      expect(prepared.log![day]!.overall!).toBeGreaterThan(left.log![day]!.overall! + 5);
      expect(BAND_RANK[prepared.log![day]!.band!]).toBeGreaterThan(BAND_RANK[left.log![day]!.band!]);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Life B: a second graduate, whose follow-up brings no request to meet
// ---------------------------------------------------------------------------------------------------------------------

describe('a second graduate (life B, seed v1-7), who cuts her reel only once the School’s follow-up has come', () => {
  const B = { saves: new Map<string, string>(), lines: [] as string[] };
  beforeAll(() => {
    let sim = lastTermMorning(SEED_B);
    const t = transcriptFrom(sim);
    const player: Player = { career: graduatingActor({ reel: 'after-follow-up', resume: 'when-asked', agreement: 'decline' }), transcript: t };
    const rel = () => relationOf(sim.player, AGENT.id);
    const until = (name: string, by: number, reached: (s: Simulation) => boolean) => {
      playTo(sim, by, player, reached);
      expect(reached(sim), `${name} by ${formatDate(by, zone)}`).toBe(true);
      B.saves.set(name, serialise(sim.universe));
      sim = cross(sim);
    };
    until('follow-up', at(2029, 5, 12), () => sim.player.pro!.showcase?.followUp !== undefined);
    until('sent', at(2029, 5, 12), () => rel()?.stage === 'sent');
    until('requested', at(2029, 6, 1), () => rel()?.stage === 'requested');
    until('supplied', at(2029, 6, 15), () => (rel()?.counts.supplied ?? 0) === 1);
    until('meeting-set', at(2029, 6, 15), () => rel()?.meeting !== undefined);
    until('offered', at(2029, 6, 30), () => (sim.player.pro!.agreements.length ?? 0) > 0);
    until('declined', at(2029, 6, 30), () => sim.player.pro!.agreements[0]!.status === 'declined');
    readNotices(sim, t);
    B.lines = t.lines;
  }, 600_000);
  const openedB = (name: string) => loadSave(deserialise(B.saves.get(name)!) as never);

  it('PLAYER JOURNEY: no request to meet from the follow-up; the reel cut then, Check Your Materials and Send Your Materials; his office asks for an up-to-date résumé, made and sent with Send What His Office Asked For; a meeting kept; his offer declined with Decline The Agreement, held six months', () => {
    const fu = openedB('follow-up');
    expect(fu.player.pro!.showcase!.followUp!.agents).toEqual([]);
    expect(currentOf(fu.player.pro, 'reel')).toBeUndefined();
    // The answer to her send, after the degree: enough factors at the bar now, the draw under the chance, and her résumé
    // from before the degree is what's behind, so that's what his office asks for.
    const rq = openedB('requested');
    const r = relationOf(rq.player, AGENT.id)!;
    expect(r.request!.what).toEqual(['resume']);
    expect(rq.player.school!.standing).toBe('graduated');
    expect(drawOf(rq, rq.player, AGENT, 1, 'interest')).toBeLessThan(r.why!.chance!);
    const sp = relationOf(openedB('supplied').player, AGENT.id)!;
    expect(sp.history.map((e) => e.kind)).toEqual(['discovered', 'introduced', 'checked', 'sent', 'requested', 'supplied']);
    const dc = openedB('declined');
    const a = dc.player.pro!.agreements[0]!;
    expect(a.status).toBe('declined');
    const rel = relationOf(dc.player, AGENT.id)!;
    expect([rel.stage, rel.cooldown?.why]).toEqual(['declined', 'declined']);
    expect(formatDate(rel.cooldown!.until, zone)).toBe(formatDate(addDays(a.offeredAt, 182, 'America/New_York'), zone));
    expect(met(B.lines, /^(NOTICE \| (The School’s Follow-Up|His Office|You Met|He Offered)|PRESS \| (Cut A Reel|Check|Send|Update Your Résumé \(asked|Decline))/)).toEqual([
      expect.stringMatching(/ \| NOTICE: The School’s Follow-Up After The Showcase$/), expect.stringMatching(/ \| PRESS: Cut A Reel/), expect.stringMatching(/ \| PRESS: Check Your Materials$/), expect.stringMatching(/ \| PRESS: Send Your Materials$/),
      expect.stringMatching(/ \| NOTICE: His Office Asked For More$/), expect.stringMatching(/ \| PRESS: Update Your Résumé \(asked for\)$/), expect.stringMatching(/ \| PRESS: Send What His Office Asked For$/),
      expect.stringMatching(/ \| NOTICE: His Office Asked To Meet You$/), expect.stringMatching(/ \| NOTICE: You Met His Office$/), expect.stringMatching(/ \| NOTICE: He Offered You Representation$/), expect.stringMatching(/ \| PRESS: Decline The Agreement$/),
    ]);
    expect(notice(B.lines, 'His Office Asked For More')).toContain('has asked for an up-to-date résumé by');
    expect(breaches(dc.universe, dc.now)).toEqual([]);
  });
});
