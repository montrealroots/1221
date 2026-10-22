/**
 * SLATE — brief 20's journeys (from 2026-10-21, the owner's brief 20, section 5; the items J1 to J5 and the table of fixed
 * seeds in `docs/verification/audit-2026-10-21/criteria.md`, written before any journey ran).
 *
 * Each of the eight lives `b20-1` to `b20-8` is made from creation's own choices (`newLifeFrom`, as the table gives them),
 * played through the School by brief 13's school player (`tools/journeys.ts`: its hour, its papers kept, its record and its
 * ten checks, imported unchanged), and carried on into the career by brief 19's career players (`tools/career-player.ts`:
 * `graduatingActor` and `unsignedActor`, through public commands, the clock moved as the top bar moves it and every stop
 * answered Go) to the first of the month at least nine months after the School's end. Nothing is set by hand but the one
 * labeled TEST SETUP the table needs and creation can't make: b20-8's flu in the first term, given through the game's own
 * care (`careFor`), as brief 13's ill journeys were.
 *
 * Why a file of its own and not more journeys in `tools/journeys.ts`: brief 13's journeys, their parts and their records
 * stay as they were, to be played again as they were, and this one adds what they don't have: the career after the
 * School, the transitions saved and opened (J4), a stretch played straight against the same stretch saved and opened in
 * the middle of an obligation (J4), the coherence checks at the end (J5), the routes met (J3) and the credit record at
 * each transition (D2). `tools/journeys.ts` was changed only to export what this imports and to run its own main only when
 * a journey is named.
 *
 * What it records:
 * - **Transitions** (J4): creation; each term's review; each calendar year's end; the School's end; a signing; the first
 *   booking, work day and pay. At each, the life is saved and opened, the state after compared with the state before to
 *   the byte, and the life goes on from the opened save. Beside that, brief 13's reload every thirty days at noon.
 * - **Straight against reopened** (J4): the first time a partner rehearsal is booked ahead in the School, and in the career
 *   the first time an audition is set, the first an offer stands and the first a union's bill is unsettled, the life is
 *   copied by a save and an opening, both copies are played fourteen days by the same player, and their ends are compared
 *   to the byte.
 * - **The credit record** (D2, the coordinator's addition): at each transition and each year's end, every open card's name
 *   and limit, the score, the past twelve months' income (`earnings.months`, the twelve before the current one), and the
 *   money in the bank (positive balances of open checking and savings accounts).
 * - **The career's transcript**: every notice and question as it came, each stop and how it was answered, each command
 *   pressed (`Transcript`), from the first hour the career player acts.
 * - **At the end:** brief 13's ten checks and continuity record, the coherence checks (J5) and the routes met (J3).
 *
 * A journey runs in parts, each under ten minutes, its save and record kept in `--state`, a directory outside the
 * repository: part 1 creates the life and plays to 1 June 2027, part 2 to 1 June 2028, part 3 to 1 June 2029, then part 4
 * to 1 November 2029, part 5 to 1 April 2030, part 6 to 1 September 2030, part 7 to 1 February 2031 and part 8 to 1 July
 * 2031, each stopping early where the journey ends. A part's line says `done` when the journey has ended.
 *
 *   npx vite-node tools/b20-journeys.ts -- --life b20-1 --part 1 --state <dir> --out docs/verification/audit-2026-10-21/journeys
 *   npx vite-node tools/b20-journeys.ts -- --older journey-j01-last-term-8283f80c --part 1 --state <dir> --out <dir>
 *   npx vite-node tools/b20-journeys.ts -- --table docs/verification/audit-2026-10-21/journeys
 *
 * `--older` opens a save from `tests/fixtures/`, plays it on with the attentive school player and the career player that
 * takes whatever comes, through the School's end and three months past it, in parts of 304 days, and records the
 * opening (what it built, whether it reads back to the byte) and the transitions.
 *
 * For a closer look, none of which the journeys' own parts use: `--reread <life>` works out the ten checks, the coherence
 * checks and the routes again from a finished journey's save and record, nothing played; `--trace <from> <to>` writes
 * down every step between two days, what it pressed and the body before and after; `--end <day>` plays a journey on to a
 * day past its own end; `--to <day>` stops a part early; `--fault fork` takes a point of energy from the reopened copy
 * at each straight-against-reopened stretch, which must then read DIFFERENT (the comparison's own fault check).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { loadSave } from '../src/engine';
import type { Simulation } from '../src/engine/core/simulation';
import type { NewSaveConfig } from '../src/engine/world/bootstrap';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '../src/engine/core/time';
import { breaches } from '../src/engine/core/invariants';
import { occupiedAt, readiness, suggestedSleep } from '../src/engine/systems/life';
import { careFor, healthOf, inHospital } from '../src/engine/systems/health';
import { injuryOf } from '../src/engine/systems/injury';
import { CARE } from '../src/engine/content/safetynet';
import { schoolEnded, sickRefusal } from '../src/engine/systems/school';
import { courseworkOf } from '../src/engine/systems/coursework';
import { templateById } from '../src/engine/content/coursework';
import { activeAgreement, ENGAGEMENTS_KEPT, finished } from '../src/engine/systems/pro';
import { roundToCome } from '../src/engine/systems/projobs';
import { optRefusal, usWorkAuthorized } from '../src/engine/systems/permission';
import { documentsOf, inForce } from '../src/engine/systems/documents';
import { playOfCredit } from '../src/engine/systems/engagement';
import { genresOfPlay } from '../src/engine/content/plays';
import { projectById } from '../src/engine/content/careerwork';
import { inTheBank } from '../src/engine/systems/spending';
import { POLICY, evening, freeHour, keepCovered, lookAfter, practiceHour } from './policy';
import { go, graduatingActor, readNotices, transcriptFrom, unsignedActor, type CareerStep, type Player, type Transcript } from './career-player';
import {
  type PolicyState, type Rec, type Spec, checks, choosePlaying, compact, continuity, counterfactual, creationRead, dailyActs, finish, firstDiff, fresh, freshPolicy,
  instrument, make, monthly, practiceFor, reload, scan, skipTonight, weeklyAdvice,
} from './journeys';

// ---------------------------------------------------------------------------------------------------------------------
// The lives, as criteria.md's table gives them
// ---------------------------------------------------------------------------------------------------------------------

/** How the life goes about the career once the School has ended (and, but for the unsigned, in its final term). */
type CareerWay = 'represented' | 'unsigned' | 'whatever' | 'declines';

interface Life {
  seed: string;
  /** The table's row, as written. */
  table: { who: string; means: string; papers: string; genres: string; player: string };
  config: Partial<NewSaveConfig>;
  school: Pick<Spec, 'player' | 'until' | 'skip' | 'repeats' | 'sickCalls'>;
  career: CareerWay;
  /** The players as played, in words. */
  played: string;
  /** Where the table names something creation or the players can't make as written, what was used. */
  nearest: string[];
  illFirstTerm?: boolean;
}

const C = (homeRegionId: string, pronouns: string, wealth: NewSaveConfig['wealth'], genres: string[], extra: Partial<NewSaveConfig> = {}): Partial<NewSaveConfig> => ({ homeRegionId, pronouns, wealth, genres, ...extra });

const CAREER_WORDS: Record<CareerWay, string> = {
  represented: 'graduatingActor (the faculty’s two scenes, the portfolio once the School posts recorded work, the follow-up’s approach answered, the agreement accepted, SAG-AFTRA joined when it can be); after the School and while not represented, unsignedActor’s open calls too',
  unsigned: 'unsignedActor after the School (headshots, a résumé, a submission to every open call that takes them, the sides prepared, offers accepted or declined as they can be); nothing of the career before the School ends, and no agent’s approach answered',
  whatever: 'graduatingActor (the agreement accepted if offered) and, after the School, unsignedActor’s open calls too, represented or not: whatever comes',
  declines: 'graduatingActor with the agreement declined; after the School, unsignedActor’s open calls too',
};

export const LIVES: Life[] = [
  { seed: 'b20-1', table: { who: 'she/her, born New York', means: 'modest', papers: 'US citizen', genres: 'Drama, Comedy', player: 'attentive, then represented if offered' }, config: C('us-ny-newyork', 'she/her', 'modest', ['drama', 'comedy']), school: { player: 'attentive' }, career: 'represented', played: 'brief 13’s attentive player', nearest: [] },
  { seed: 'b20-2', table: { who: 'he/him, born New York', means: 'nothing', papers: 'US citizen', genres: 'Thriller', player: 'attentive, then unsigned' }, config: C('us-ny-newyork', 'he/him', 'nothing', ['thriller']), school: { player: 'attentive' }, career: 'unsigned', played: 'brief 13’s attentive player', nearest: [] },
  { seed: 'b20-3', table: { who: 'they/them, actor, born Toronto', means: 'scraping', papers: 'Canadian on an F-1', genres: 'Musical', player: 'attentive, then whatever comes' }, config: C('ca-on-toronto', 'they/them', 'scraping', ['musical'], { performerTitle: 'actor' }), school: { player: 'attentive' }, career: 'whatever', played: 'brief 13’s attentive player', nearest: [] },
  { seed: 'b20-4', table: { who: 'she/her, born London', means: 'comfortable', papers: 'British on an F-1', genres: 'Period Drama', player: 'ignores the coursework’s advice' }, config: C('uk-eng-london', 'she/her', 'comfortable', ['period_drama']), school: { player: 'ignores' }, career: 'whatever', played: 'brief 13’s `ignores` player: the coursework done as the attentive player does it, the way of playing left open whatever the preview advises, and the free hours practiced on its own strongest ability instead of What To Work On’s advice, in the School and after it', nearest: ['The table names no career player: the one that takes whatever comes.', 'No school player ignores "the coursework’s advice" by that name: brief 13’s `ignores` ignores the advice the School and the Profile give on the work (the preview’s way of playing and What To Work On), and keeps up the coursework itself.'] },
  { seed: 'b20-5', table: { who: 'he/him, born Mexico City', means: 'modest', papers: 'Mexican on an F-1', genres: 'Horror', player: 'neglects the coursework until warned' }, config: C('mx-cmx-mexicocity', 'he/him', 'modest', ['horror']), school: { player: 'attentive', until: 'A Word On Your Coursework' }, career: 'whatever', played: 'brief 13’s J17 player: neglects the coursework (no evening work, no free hour on it) until the notice A Word On Your Coursework, then attentive', nearest: ['The table names no career player: the one that takes whatever comes.'] },
  { seed: 'b20-6', table: { who: 'she/her, born Chicago', means: 'wealthy', papers: 'US citizen', genres: 'Romance', player: 'attentive, declines the agent' }, config: C('us-il-chicago', 'she/her', 'wealthy', ['romance']), school: { player: 'attentive' }, career: 'declines', played: 'brief 13’s attentive player', nearest: [] },
  { seed: 'b20-7', table: { who: 'he/him, born Los Angeles', means: 'scraping', papers: 'US citizen', genres: 'Action', player: 'misses a course’s meetings' }, config: C('us-ca-losangeles', 'he/him', 'scraping', ['action']), school: { player: 'attentive', skip: { term: 1, code: 'DRAM 163b', times: 4 }, repeats: true }, career: 'whatever', played: 'brief 13’s J20 player: sleeps through four meetings of Text Analysis I (DRAM 163b) in the first spring, otherwise attentive; asks to repeat the year and for the aid office’s review when offered, pays the Yale account on a hold', nearest: ['The table names no career player: the one that takes whatever comes.', 'The course and the meetings are J20’s (brief 13), the one way the school players miss a course’s meetings.'] },
  { seed: 'b20-8', table: { who: 'they/them, actress, born Dublin', means: 'modest', papers: 'Irish on an F-1', genres: 'Comedy, Fantasy', player: 'ill in the first term, then attentive' }, config: C('ie-lei-dublin', 'they/them', 'modest', ['comedy', 'fantasy'], { performerTitle: 'actress' }), school: { player: 'attentive', sickCalls: true }, career: 'whatever', played: 'brief 13’s attentive player, calling in sick on a morning they’re ill', illFirstTerm: true, nearest: ['The table names no career player: the one that takes whatever comes.', 'Creation makes nobody ill: TEST SETUP the flu on 15 October 2026, given through the game’s own care (`careFor`, as brief 13’s J21), the life’s other illnesses the game’s own.'] },
];

const specOf = (life: Life): Spec => ({
  id: life.seed, seed: life.seed, profile: `${life.table.who}, ${life.table.means}, ${life.table.papers}, loves ${life.table.genres}; ${life.table.player}`,
  config: life.config, ...life.school, papers: true,
  expect: life.school.repeats ? { standing: 'graduated', note: 'misses four meetings of a course; may repeat a year' } : { standing: 'graduated', on: '2029-05-21', note: 'the degree at the 2029 Commencement' },
});

/** An older save from `tests/fixtures/`, played on as a life whose making isn't ours. */
const olderLife = (name: string): Life => ({
  seed: name, table: { who: 'as saved', means: 'as saved', papers: 'as saved', genres: 'as saved', player: 'attentive, then whatever comes' }, config: {}, school: { player: 'attentive' },
  career: 'whatever', played: 'brief 13’s attentive player, papers kept', nearest: [],
});

// ---------------------------------------------------------------------------------------------------------------------
// Arguments and dates
// ---------------------------------------------------------------------------------------------------------------------

const arg = (name: string, d = '') => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1]! : d; };
const NY = 'America/New_York';
const on = (y: number, m: number, d: number, h = 0) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);
const PART_ENDS = [on(2027, 6, 1), on(2028, 6, 1), on(2029, 6, 1), on(2029, 11, 1), on(2030, 4, 1), on(2030, 9, 1), on(2031, 2, 1), on(2031, 7, 1)];
const day = (t: number) => new Date(t).toISOString().slice(0, 10);
const stamp = (t: number) => new Date(t).toISOString().slice(0, 16);
const dollars = (cents: number) => Math.round(cents) / 100;
const r1 = (x: number) => Math.round(x * 10) / 10;

/** The first of the month on or after `months` months past `t`, New York's: where a journey ends. */
function monthsPast(t: number, months: number): number {
  const p = zonedParts(t, NY);
  const m0 = p.month - 1 + months + 1;
  return on(p.year + Math.floor(m0 / 12), (m0 % 12) + 1, 1);
}

// ---------------------------------------------------------------------------------------------------------------------
// The record this runner keeps beside brief 13's
// ---------------------------------------------------------------------------------------------------------------------

interface CreditRead { at: string; what: string; cards: { name: string; limit: number | null; owed: number }[]; score: number | null; income12: number; bank: number }
interface Transition { at: string; what: string; same: boolean; bytes: number; diff?: string; credit: CreditRead }
interface Fork { why: string; at: string; days: number; same: boolean; bytes: [number, number]; diff?: string; straight: Record<string, unknown>; reopened: Record<string, unknown>; secs: number }
interface WorkDay { at: string; project: string; role: string; status: string; band?: string; authorized: boolean; papers: string[]; school?: string }

interface Extra {
  life: string; table: Life['table']; played: string; career: string; nearest: string[];
  transitions: Transition[]; credit: CreditRead[]; forks: Fork[]; workDays: WorkDay[];
  careerFrom?: string; schoolEnd?: string; journeyEnd?: number; startedAt?: number;
  opening?: Record<string, unknown>;
  errors: string[];
}
type BRec = Rec & { b20: Extra };

/** What a part keeps between parts beside brief 13's policy state. */
interface Watch {
  reviews: number; ended: boolean; year: number; signed: boolean; booked: boolean; worked: boolean; paid: boolean;
  /** The stretches played both ways so far, by the obligation's kind: once each of school, audition, offer and bill. */
  forked: string[]; seenLog: string[];
}
const freshWatch = (sim: Simulation): Watch => ({ reviews: sim.player.school?.history.length ?? 0, ended: sim.player.school ? schoolEnded(sim.player.school.standing) : false, year: zonedParts(sim.now, NY).year, signed: false, booked: false, worked: false, paid: false, forked: [], seenLog: [] });

interface Ctx { life: Life; spec: Spec; sim: Simulation; rec: BRec; st: PolicyState; w: Watch; t?: Transcript; player: Player; prev: { condition: number; fitness: number; energy: number } }

// ---------------------------------------------------------------------------------------------------------------------
// Reads that change nothing (each reads the save's own fields, never an accessor that fills one in)
// ---------------------------------------------------------------------------------------------------------------------

/** D2: every open card's name and limit, the score, the past twelve months' income, the money in the bank. */
function creditRead(sim: Simulation, what: string): CreditRead {
  const p = sim.player;
  const mine = Object.values(sim.universe.accounts).filter((a) => a.ownerId === p.id && !a.nominal && a.closedAt === undefined);
  const cards = mine.filter((a) => a.kind === 'credit_card').map((a) => ({ name: a.name, limit: a.creditLimit !== undefined ? dollars(a.creditLimit) : null, owed: dollars(-a.balance) }));
  const now = zonedParts(sim.now, NY);
  const months = p.earnings?.months ?? {};
  let income = 0;
  for (let k = 1; k <= 12; k += 1) {
    const m0 = now.year * 12 + (now.month - 1) - k;
    const key = `${Math.floor(m0 / 12)}-${String((m0 % 12) + 1).padStart(2, '0')}`;
    income += months[key] ?? 0;
  }
  const bank = mine.filter((a) => (a.kind === 'checking' || a.kind === 'savings') && a.balance > 0).reduce((t, a) => t + a.balance, 0);
  return { at: stamp(sim.now), what, cards, score: p.credit?.score ?? null, income12: dollars(income), bank: dollars(bank) };
}

const playerOf = (sim: Simulation) => sim.player;
const ended = (sim: Simulation) => { const s = playerOf(sim).school; return s !== undefined && schoolEnded(s.standing); };

/** The obligations a stretch can be begun in the middle of. */
function schoolObligation(sim: Simulation): string | undefined {
  for (const a of courseworkOf(sim, sim.player)?.assignments ?? []) {
    const r = a.rehearsals.find((x) => x.status === 'booked' && x.at > sim.now + 2 * MS_HOUR);
    if (r) return `a rehearsal with a partner booked for ${stamp(r.at)} on ${templateById(a.template)?.title ?? a.template}`;
  }
  return undefined;
}
/** The career's obligations of each kind standing now: an audition set, an offer standing, a union's bill unsettled. */
function careerObligations(sim: Simulation): { kind: 'audition' | 'offer' | 'bill'; why: string }[] {
  const pro = sim.player.pro;
  const out: { kind: 'audition' | 'offer' | 'bill'; why: string }[] = [];
  if (!pro) return out;
  for (const o of pro.opportunities) {
    const r = roundToCome(o);
    if (r && (o.status === 'audition' || o.status === 'callback') && r.at > sim.now + 2 * MS_HOUR) { out.push({ kind: 'audition', why: `an ${r.round} (${r.form}) set for ${stamp(r.at)}, ${projectById(o.projectId)?.role.part ?? o.projectId} in ${projectById(o.projectId)?.project ?? o.projectId}` }); break; }
  }
  for (const d of Object.values(sim.universe.decisions)) if (d.resolvedAt === undefined && d.refType === 'pro.offer') { out.push({ kind: 'offer', why: `an offer standing: ${d.title}` }); break; }
  for (const b of pro.unionBills ?? []) if (!b.settled && b.due > sim.now) { out.push({ kind: 'bill', why: `a union bill due ${stamp(b.due)}: ${b.what}` }); break; }
  return out;
}

/** What a stretch's end comes to, read the same way on both copies. */
function outcomeOf(sim: Simulation, since: number): Record<string, unknown> {
  const p = sim.player;
  const pro = p.pro;
  return {
    now: stamp(sim.now), bank: dollars(inTheBank(sim, p)), standing: p.school?.standing,
    notices: sim.universe.notifications.filter((n) => n.at >= since).map((n) => n.title).slice(-30),
    opportunities: (pro?.opportunities ?? []).filter((o) => (o.resolvedAt ?? o.postedAt) >= since || ['audition', 'callback', 'offered', 'submitted'].includes(o.status)).map((o) => `${o.projectId} ${o.status}`),
    engagements: (pro?.engagements ?? []).map((e) => `${e.projectId} ${e.status} ${e.log?.filter((l) => l.status === 'worked').length ?? 0} worked`),
    work: (p.work ?? []).filter((w) => w.at >= since).map((w) => `${w.what} ${w.overall}`),
    transactions: sim.universe.transactions.length,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// The players
// ---------------------------------------------------------------------------------------------------------------------

/** The career's business in a free waking hour, as the life's way has it (`CAREER_WORDS`). */
function careerStepFor(life: Life): CareerStep {
  const grad = graduatingActor({ joinSag: true, ...(life.career === 'declines' ? { agreement: 'decline' as const } : {}) });
  const open = unsignedActor();
  return (sim, player) => {
    const out = ended(sim);
    if (life.career === 'unsigned') return out ? open(sim, player) : false;
    if (grad(sim, player)) return true;
    if (!out) return false;
    if (life.career === 'represented' && activeAgreement(sim.player, sim.now)) return false;
    return open(sim, player);
  };
}

/** Whether the career player acts this hour: in the School's final term once the showcase has begun, but for the unsigned; after it, always. */
const careerOn = (ctx: Ctx) => ended(ctx.sim) || (ctx.life.career !== 'unsigned' && ctx.sim.player.pro?.showcase?.options !== undefined);

/** b20-8's TEST SETUP: the flu on 15 October 2026, through the game's own care. */
function illOnce(ctx: Ctx): void {
  const { sim, rec, st } = ctx;
  if (!ctx.life.illFirstTerm || st.struck.includes('flu first term') || sim.now < on(2026, 10, 15, 9)) return;
  st.struck.push('flu first term');
  const w = sim.player.wellbeing;
  const before = { condition: r1(w.condition), fitness: Math.round(w.fitness * 100) / 100, energy: r1(w.energy) };
  careFor(sim, sim.player, { care: 'visit', what: 'The flu', flu: true }, sim.now);
  rec.health.push({ at: stamp(sim.now), events: [`TEST SETUP: the flu (${CARE.fluDays} days)`], before, after: { condition: r1(w.condition), fitness: Math.round(w.fitness * 100) / 100, energy: r1(w.energy) } });
}

/** Work days as they're logged, with what permission to work read at that hour (J5's papers against work). */
function watchWork(ctx: Ctx): void {
  const { sim, rec, w } = ctx;
  const p = sim.player;
  for (const e of p.pro?.engagements ?? []) {
    for (const l of e.log ?? []) {
      const key = `${e.id}:${l.day}`;
      if (w.seenLog.includes(key)) continue;
      w.seenLog.push(key);
      const t = projectById(e.projectId);
      const papers = documentsOf(p).filter((d) => (d.kind === 'visa' || d.kind === 'permit') && inForce(d, l.at)).map((d) => `${d.name} ${d.status}`);
      rec.b20.workDays.push({ at: stamp(l.at), project: t?.project ?? e.projectId, role: e.role, status: l.status, ...(l.band ? { band: l.band } : {}), authorized: usWorkAuthorized(p, l.at), papers, ...(e.school ? { school: e.school } : {}) });
    }
  }
}

/** The hour in the School: brief 13's (`tools/journeys.ts` `playPart`), with the career's business in the final term. */
function schoolHour(ctx: Ctx): void {
  const { sim, rec, st, spec } = ctx;
  const p = zonedParts(sim.now, sim.zone);
  const awake = (sim.player.awakeSince ?? 0) <= sim.now;
  const neglecting = spec.player === 'neglect' || (spec.until !== undefined && !st.switched);
  if (spec.sickCalls && awake && p.hour >= 6 && p.hour < 9 && !sickRefusal(sim, sim.player)) sim.execute({ kind: 'school.call_in_sick', payload: {} });
  const weekend = [0, 6].includes(new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay());
  lookAfter(sim);
  if (p.hour === 12) keepCovered(sim);
  if (!neglecting) {
    if (p.hour === 20 && sim.player.currentLocationId === 'us-ct-newhaven') {
      for (const a of courseworkOf(sim, sim.player)?.assignments ?? []) if ((a.status === 'open') && a.sceneId && templateById(a.template)?.material !== 'none' && !a.playing && !st.considered.includes(a.id) && Object.values(a.prep).every((v) => v === 0)) choosePlaying(sim, rec, st, a, Boolean(spec.playing));
      evening(sim);
    }
    if (p.hour >= (weekend ? 10 : 15) && p.hour < 22 && freeHour(sim)) return;
    if (spec.player !== 'attentive' && p.hour >= (weekend ? 10 : 15) && p.hour < 22 && practiceFor(spec, sim)) return;
  }
  if (careerOn(ctx) && awake && p.hour >= 9 && p.hour < 22 && !occupiedAt(sim, sim.now) && ctx.player.career!(sim, ctx.player)) return;
  if (p.hour === 23 && awake && skipTonight(spec, sim, st)) return;
  if ((p.hour >= 23 || p.hour < 5) && awake && sim.execute({ kind: 'life.sleep', payload: { hours: suggestedSleep(sim).hours } }).ok) return;
  sim.advanceTo(sim.now + MS_HOUR);
}

/** The hour after the School: brief 19's (`tools/career-player.ts` `hour`), its free hours practiced as the school player practiced. */
function careerHour(ctx: Ctx): void {
  const { sim, spec, player } = ctx;
  const p = zonedParts(sim.now, sim.zone);
  const weekend = p.weekday === 0 || p.weekday === 6;
  const awake = (sim.player.awakeSince ?? 0) <= sim.now;
  lookAfter(sim);
  if (p.hour === 12) keepCovered(sim);
  if (p.hour === 20 && sim.player.currentLocationId === 'us-ct-newhaven') evening(sim);
  if (p.hour >= (weekend ? 10 : 15) && p.hour < 22 && freeHour(sim)) return;
  if (player.career && awake && p.hour >= 9 && p.hour < 22 && !occupiedAt(sim, sim.now) && player.career(sim, player)) return;
  if (awake && p.hour >= 10 && p.hour < 22 && (spec.player === 'ignores' ? practiceFor(spec, sim) : practiceHour(sim))) return;
  if ((p.hour >= 23 || p.hour < 5) && awake && sim.execute({ kind: 'life.sleep', payload: { hours: suggestedSleep(sim).hours } }).ok) return;
  go(sim, sim.now + MS_HOUR, player);
}

/** One step of a journey: what's new looked at, the day's and month's records, then the hour played. Saves nothing. */
function step(ctx: Ctx): void {
  const { sim, rec, st, spec } = ctx;
  scan(sim, rec, st, ctx.prev);
  const w = sim.player.wellbeing;
  ctx.prev = { condition: r1(w.condition), fitness: Math.round(w.fitness * 100) / 100, energy: r1(w.energy) };
  if (spec.until && !st.switched && rec.notices.some((n) => n[2] === spec.until)) { st.switched = true; rec.acts.push(`${day(sim.now)} keeps up from now (${spec.until})`); }
  const p = zonedParts(sim.now, sim.zone);
  const today = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
  const awake = (sim.player.awakeSince ?? 0) <= sim.now;
  illOnce(ctx);
  if (p.hour >= 9 && today !== st.lastDay && awake) {
    st.lastDay = today;
    const h = healthOf(sim.player);
    rec.daily.push([today, r1(w.energy), Math.round(w.fitness * 100) / 100, r1(w.condition), Math.round(w.stress), (h.fluUntil ?? 0) > sim.now ? 1 : 0, injuryOf(sim.player, sim.now) ? 1 : 0, inHospital(sim.player, sim.now) ? 1 : 0]);
    dailyActs(spec, sim, rec, st);
    if (today.slice(0, 7) !== st.lastMonth) { st.lastMonth = today.slice(0, 7); monthly(sim, rec, st); }
    const n = Math.floor((sim.now - on(2026, 8, 24)) / MS_DAY);
    if (n - st.lastAdviceDay >= 7) { st.lastAdviceDay = n; weeklyAdvice(sim, rec); }
  }
  if (careerOn(ctx) && !ctx.t) { ctx.t = transcriptFrom(sim); ctx.player.transcript = ctx.t; rec.b20.careerFrom = stamp(sim.now); }
  const before = traceFrom(ctx);
  if (ended(sim)) careerHour(ctx); else schoolHour(ctx);
  readNotices(sim, ctx.t);
  watchWork(ctx);
  if (before) traceStep(ctx, before);
}

/**
 * `--trace <from> <to>` (dates, yyyy-mm-dd): each step between them written down, what it did and the body before and
 * after it: for looking closely at a stretch (brief 20's D3, the nights between shoot days). Reads only.
 */
const TRACE = process.argv.includes('--trace') ? [on(Number(arg('trace').slice(0, 4)), Number(arg('trace').slice(5, 7)), Number(arg('trace').slice(8, 10))), on(Number(process.argv[process.argv.indexOf('--trace') + 2]!.slice(0, 4)), Number(process.argv[process.argv.indexOf('--trace') + 2]!.slice(5, 7)), Number(process.argv[process.argv.indexOf('--trace') + 2]!.slice(8, 10)))] : undefined;
function body(ctx: Ctx) {
  const p = ctx.sim.player; const w = p.wellbeing;
  return { at: stamp(ctx.sim.now), awake: (p.awakeSince ?? 0) <= ctx.sim.now, energy: r1(w.energy), sleepDebt: r1(w.sleepDebt), stress: r1(w.stress), condition: r1(w.condition), readiness: r1(readiness(p)), commands: { ...ctx.rec.commands } };
}
function traceFrom(ctx: Ctx) { return TRACE && ctx.sim.now >= TRACE[0]! && ctx.sim.now < TRACE[1]! ? body(ctx) : undefined; }
function traceStep(ctx: Ctx, before: ReturnType<typeof body>): void {
  const after = body(ctx);
  const did = Object.entries(after.commands).filter(([k, n]) => n !== (before.commands[k] ?? 0)).map(([k, n]) => `${k}×${n - (before.commands[k] ?? 0)}`);
  const scheduled = ctx.sim.universe.scheduled.filter((i) => i.requiresPlayer && i.at >= ctx.sim.now && i.at < ctx.sim.now + 12 * MS_HOUR && i.status === 'pending').map((i) => `${stamp(i.at)} ${i.label}`);
  ((ctx.rec.b20 as Extra & { trace?: unknown[] }).trace ??= []).push({ from: before.at, to: after.at, did, before: { awake: before.awake, energy: before.energy, sleepDebt: before.sleepDebt, readiness: before.readiness }, after: { awake: after.awake, energy: after.energy, sleepDebt: after.sleepDebt, stress: after.stress, condition: after.condition, readiness: after.readiness }, ahead: scheduled.slice(0, 3), sleepSuggested: suggestedSleep(ctx.sim).hours });
}

// ---------------------------------------------------------------------------------------------------------------------
// Saved and opened: the transitions, and the stretch played both ways
// ---------------------------------------------------------------------------------------------------------------------

/** Saved and opened at a transition: compared to the byte, and the life goes on from the opened save. */
function transition(ctx: Ctx, what: string): void {
  const credit = creditRead(ctx.sim, what);
  ctx.rec.b20.credit.push(credit);
  const before = serialise(ctx.sim.universe);
  const next = reload(ctx.sim, ctx.rec);
  const last = ctx.rec.reloads.at(-1)!;
  ctx.rec.b20.transitions.push({ at: stamp(next.now), what, same: last.same, bytes: before.length, ...(last.diff ? { diff: last.diff } : {}), credit });
  ctx.sim = next;
  instrument(ctx.sim, ctx.rec);
}

/** What has come to pass since the last look, by the names J4 gives them; each saved and opened. */
function transitions(ctx: Ctx): void {
  const { sim, w } = ctx;
  const p = sim.player;
  const s = p.school;
  if (s && s.history.length > w.reviews) {
    const h = s.history.slice(w.reviews);
    w.reviews = s.history.length;
    transition(ctx, `term ${h.map((x) => `${x.term} reviewed: ${x.standing}`).join(', ')}`);
  }
  const y = zonedParts(ctx.sim.now, NY).year;
  if (y > w.year) { w.year = y; transition(ctx, `the end of ${y - 1}`); }
  if (s && !w.ended && schoolEnded(s.standing)) { w.ended = true; ctx.rec.b20.schoolEnd = stamp(s.endedAt ?? ctx.sim.now); transition(ctx, `the School’s end: ${s.standing}`); }
  const pro = ctx.sim.player.pro;
  if (pro && !w.signed && pro.agreements.some((a) => a.status === 'accepted')) { w.signed = true; transition(ctx, 'a signing'); }
  if (pro && !w.booked && pro.engagements.length) { w.booked = true; transition(ctx, `the first booking: ${pro.engagements[0]!.role} in ${projectById(pro.engagements[0]!.projectId)?.project ?? pro.engagements[0]!.projectId}`); }
  if (pro && !w.worked && pro.engagements.some((e) => e.log?.some((l) => l.status === 'worked'))) { w.worked = true; transition(ctx, 'the first work day'); }
  if (pro && !w.paid && pro.engagements.some((e) => e.pay.some((x) => x.received))) { w.paid = true; transition(ctx, 'the first pay'); }
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/**
 * J4's comparison: the life copied by a save and an opening in the middle of an obligation, the copy played `days` days,
 * then the journey's own life played the same days without a save, and the two ends compared to the byte. The journey goes
 * on from its own life, as it would have without the comparison.
 */
function fork(ctx: Ctx, why: string, days = 14): void {
  const started = performance.now();
  const at = ctx.sim.now;
  const snap = serialise(ctx.sim.universe);
  const b: Ctx = { ...ctx, sim: loadSave(deserialise(snap) as never), rec: clone(ctx.rec), st: clone(ctx.st), w: clone(ctx.w), prev: { ...ctx.prev }, player: { ...ctx.player } };
  if (ctx.t) { b.t = { seen: new Set(ctx.t.seen), lines: [...ctx.t.lines] }; b.player.transcript = b.t; }
  instrument(b.sim, b.rec);
  // `--fault fork`: the comparison's own fault check, a point of energy taken from the reopened copy, which must read DIFFERENT.
  if (arg('fault') === 'fork') b.sim.player.wellbeing.energy = Math.max(0, b.sim.player.wellbeing.energy - 1);
  const until = at + days * MS_DAY;
  while (b.sim.now < until && b.sim.universe.meta.endedAt === undefined) step(b);
  while (ctx.sim.now < until && ctx.sim.universe.meta.endedAt === undefined) step(ctx);
  const a1 = serialise(ctx.sim.universe), b1 = serialise(b.sim.universe);
  ctx.rec.b20.forks.push({ why, at: stamp(at), days, same: a1 === b1, bytes: [a1.length, b1.length], ...(a1 === b1 ? {} : { diff: firstDiff(a1, b1) }), straight: outcomeOf(ctx.sim, at), reopened: outcomeOf(b.sim, at), secs: Math.round((performance.now() - started) / 1000) });
}

// ---------------------------------------------------------------------------------------------------------------------
// J5: coherence at the journey's end
// ---------------------------------------------------------------------------------------------------------------------

function coherence(sim: Simulation, rec: BRec): Record<string, { pass: boolean; evidence: string[]; fails: string[] }> {
  const out: Record<string, { pass: boolean; evidence: string[]; fails: string[] }> = {};
  const put = (k: string, fails: string[], evidence: string[]) => { out[k] = { pass: fails.length === 0, evidence, fails }; };
  const p = sim.player;
  const s = p.school;
  const pro = p.pro;

  // The School's record against the attributes and the genres.
  {
    const fails: string[] = [];
    const hist = s?.history ?? [];
    for (let i = 1; i < hist.length; i += 1) if (hist[i]!.term <= hist[i - 1]!.term) fails.push(`reviews out of order: ${hist.map((h) => h.term).join(',')}`);
    if (s?.standing === 'graduated') {
      const unsettled = Object.entries(s.courses ?? {}).filter(([, r]) => r.result === undefined || r.result === 'incomplete').map(([k]) => k);
      if (unsettled.length) fails.push(`graduated with courses unsettled: ${unsettled.join(', ')}`);
    }
    const credited = new Set<string>();
    // The plays the School cast them in: its runs (each with its play, or a production named for one), its credits and the
    // casting under way; and the career's projects worked in.
    const plays = [...(s?.runs ?? []).map((x) => x.play ?? playOfCredit(x.production)), ...(s?.credits ?? []).map((c) => playOfCredit(c.production)), s?.casting?.play];
    for (const play of plays) for (const g of genresOfPlay(play) ?? []) credited.add(g);
    for (const e of pro?.engagements ?? []) if (e.log?.some((l) => l.status === 'worked')) for (const g of projectById(e.projectId)?.genres ?? []) credited.add(g);
    const byGenre = Object.entries(p.engagement?.byGenre ?? {});
    const practicedWithout = byGenre.filter(([g, x]) => (x?.practice ?? 0) > 0 && !credited.has(g)).map(([g]) => g);
    const tapes = Object.entries(rec.commands).filter(([k]) => k.startsWith('practice.self_tape') && !k.includes('refused')).length;
    if (practicedWithout.length && !tapes) fails.push(`genres practiced with no play, job or tape of theirs on the record: ${practicedWithout.join(', ')}`);
    const studied = Object.entries(rec.commands).some(([k]) => k.startsWith('genre.study') && !k.includes('refused'));
    const familiar = byGenre.filter(([, x]) => (x?.familiarity ?? 0) > 0).map(([g]) => g);
    if (familiar.length && !studied) fails.push(`genres familiar with nothing studied: ${familiar.join(', ')}`);
    const dev = rec.checks?.['3 development'];
    if (dev && !dev.pass) fails.push(...dev.fails.map((f) => `development: ${f}`));
    put('school, attributes and genres', fails, [
      `standing ${s?.standing}, reviews ${hist.map((h) => `${h.term}:${h.standing}`).join(' ')}, credits ${(s?.credits ?? []).map((c) => `${c.year} ${c.production} (${c.role}${c.size ? `, ${c.size}` : ''})`).join('; ')}`,
      `genres practiced ${byGenre.filter(([, x]) => (x?.practice ?? 0) > 0).sort((a, b) => (b[1]?.practice ?? 0) - (a[1]?.practice ?? 0)).map(([g, x]) => `${g} ${r1(x?.practice ?? 0)}`).join(', ') || 'none'}; from plays and jobs: ${[...credited].join(', ') || 'none'}; loved at creation: ${(p.genres ?? []).join(', ') || 'none'}`,
      `development (brief 13's check 3): ${dev ? (dev.pass ? 'pass' : 'fail') : 'not run'}`,
    ]);
  }

  // Every account's balance against the sum of its postings.
  {
    const fails: string[] = [];
    const posted = new Map<string, number>();
    for (const t of sim.universe.transactions) for (const x of t.postings) posted.set(x.accountId, (posted.get(x.accountId) ?? 0) + x.amount);
    const accounts = Object.values(sim.universe.accounts);
    for (const a of accounts) if (a.balance !== (posted.get(a.id) ?? 0)) fails.push(`${a.name}: ${a.balance} against postings ${posted.get(a.id) ?? 0}`);
    const audit = sim.ledger.audit();
    fails.push(...audit.slice(0, 5));
    const mine = accounts.filter((a) => a.ownerId === p.id && !a.nominal);
    put('ledger', fails, [`${accounts.length} accounts (${mine.length} the player's), ${sim.universe.transactions.length} transactions; every balance the sum of its postings: ${fails.length === 0}; ledger audit ${audit.length} problems`, `the player's: ${mine.map((a) => `${a.kind} ${a.name} ${dollars(a.balance)}${a.closedAt ? ' (closed)' : ''}`).join('; ')}`]);
  }

  // The papers in force against what the life did.
  {
    const fails: string[] = [];
    const bad = rec.b20.workDays.filter((d) => d.status === 'worked' && !d.authorized);
    if (bad.length) fails.push(`worked without permission: ${bad.map((d) => `${d.at} ${d.role}`).join(', ')}`);
    for (const e of pro?.engagements ?? []) if (e.eligibility && !e.eligibility.authorized && e.log?.some((l) => l.status === 'worked')) fails.push(`${e.role}: booked with permission read as not given (${e.eligibility.words}) and worked`);
    const unapproved = (pro?.engagements ?? []).filter((e) => e.school === 'unapproved' || e.school === 'reported');
    if (unapproved.length) fails.push(`work in term without the School's approval: ${unapproved.map((e) => e.role).join(', ')}`);
    const outAt = p.usOutOfStatus;
    const workedAfterOut = outAt === undefined ? [] : rec.b20.workDays.filter((d) => d.status === 'worked' && d.at >= stamp(outAt));
    if (workedAfterOut.length) fails.push(`worked after falling out of status on ${day(outAt!)}: ${workedAfterOut.map((d) => d.at).join(', ')}`);
    const papers = rec.checks?.['7 papers'];
    if (papers && !papers.pass) fails.push(...papers.fails.map((f) => `papers (brief 13's check 7): ${f}`));
    put('papers and work', fails, [
      `documents: ${documentsOf(p).map((d) => `${d.kind} ${d.name} ${d.status}${d.expiresAt ? ` to ${day(d.expiresAt)}` : ''}`).join('; ')}`,
      `work days ${rec.b20.workDays.length}: ${rec.b20.workDays.map((d) => `${d.at.slice(0, 10)} ${d.role} ${d.status}${d.authorized ? '' : ' UNAUTHORIZED'}${d.papers.length ? ` [${d.papers.join(', ')}]` : ''}`).join('; ') || 'none'}`,
      `authorized now ${usWorkAuthorized(p, sim.now)}; OPT: ${optRefusal(sim, p) ?? 'open'}; out of status ${outAt !== undefined ? day(outAt) : 'never'}`,
    ]);
  }

  // Relationships, and credits against engagements.
  {
    const fails: string[] = [];
    for (const [i, m] of (s?.classmates ?? []).entries()) {
      if (m.bond !== undefined && (m.bond < -100 || m.bond > 100)) fails.push(`classmate ${i} bond ${m.bond}`);
      if (m.trust !== undefined && (m.trust < 0 || m.trust > 100)) fails.push(`classmate ${i} trust ${m.trust}`);
      if (m.reliability !== undefined && (m.reliability < 0 || m.reliability > 1)) fails.push(`classmate ${i} reliability ${m.reliability}`);
      const inc = (m as { incidents?: { at: number; repaired?: number }[] }).incidents ?? [];
      for (const x of inc) if (x.repaired !== undefined && x.repaired < x.at) fails.push(`classmate ${i}: an incident repaired before it happened`);
    }
    for (const [id, rel] of Object.entries(pro?.relations ?? {})) {
      const live = pro!.agreements.find((a) => a.agentId === id && a.status === 'accepted');
      if (live && rel.stage !== 'represented') fails.push(`${id}: an agreement accepted and the relation at ${rel.stage}`);
      if (rel.stage === 'represented' && !live) fails.push(`${id}: represented with no agreement accepted`);
      if (live && rel.agreementId !== live.id) fails.push(`${id}: the relation's agreement ${rel.agreementId}, the accepted ${live.id}`);
      if (pro!.agreements.some((a) => a.agentId === id && a.status === 'declined') && !['declined', 'ended', 'passed', 'unanswered', 'represented'].includes(rel.stage)) fails.push(`${id}: declined and the relation at ${rel.stage}`);
    }
    for (const e of pro?.engagements ?? []) {
      if (e.agentId) {
        const a = pro!.agreements.find((x) => x.id === e.agreementId);
        if (!a) fails.push(`${e.role}: through an agent with no agreement on record`);
      }
      const worked = e.log?.some((l) => l.status === 'worked');
      const t = projectById(e.projectId);
      const credit = pro!.credits.find((c) => c.engagementId === e.id);
      if (e.creditId && !credit) fails.push(`${e.role}: names a credit not on record`);
      // A stage credit comes at the first night (a performance judged, `ProCredit`'s 'performed'), not at a rehearsal; a
      // screen credit at the wrap.
      const due = t?.medium === 'stage' ? e.log?.some((l) => l.status === 'worked' && l.band !== undefined) : e.status === 'finished' && worked;
      if (due && !credit) fails.push(`${e.role} in ${t?.project}: ${t?.medium === 'stage' ? 'performed' : 'worked and finished'} with no credit`);
    }
    // A credit's engagement may be gone only where the finished ones kept are at their bound (`keepBounded`): from
    // 2026-10-22 read off the bound, where until then the record's `trimmed` count said so, removed by the career area.
    for (const c of pro?.credits ?? []) {
      if (c.engagementId && !(pro!.engagements.some((e) => e.id === c.engagementId) || pro!.engagements.filter(finished).length >= ENGAGEMENTS_KEPT)) fails.push(`credit ${c.role} in ${c.project}: its engagement gone`);
    }
    const twice = (pro?.credits ?? []).filter((c, i, all) => c.engagementId && all.findIndex((x) => x.engagementId === c.engagementId) !== i);
    if (twice.length) fails.push(`credits twice for one engagement: ${twice.map((c) => c.role).join(', ')}`);
    put('relationships and credits', fails, [
      `classmates ${(s?.classmates ?? []).length}: bonds ${(s?.classmates ?? []).map((m) => Math.round(m.bond ?? 0)).join(' ')}`,
      `agents: ${Object.values(pro?.relations ?? {}).map((r) => `${r.agentId} ${r.stage} (${r.history.map((h) => h.kind).join(',')})`).join('; ') || 'none'}; agreements ${(pro?.agreements ?? []).map((a) => `${a.status}${a.endedHow ? ` ${a.endedHow}` : ''}`).join(', ') || 'none'}`,
      `engagements: ${(pro?.engagements ?? []).map((e) => `${e.role} in ${projectById(e.projectId)?.project} ${e.status} (${e.log?.filter((l) => l.status === 'worked').length ?? 0} worked, ${e.pay.filter((x) => x.received).length}/${e.pay.length} paid)`).join('; ') || 'none'}`,
      `credits: ${(pro?.credits ?? []).map((c) => `${c.kind} ${c.role} in ${c.project} ${c.status}${c.band ? ` ${c.band}` : ''}`).join('; ') || 'none'}`,
    ]);
  }

  {
    const b = breaches(sim.universe);
    put('breaches', b.map((x) => `${x.law}: ${x.detail}`).slice(0, 10), [`${b.length} breaches`]);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// J3: the routes met, read from the record
// ---------------------------------------------------------------------------------------------------------------------

function routes(sim: Simulation, rec: BRec, life: Life): Record<string, string[]> {
  const p = sim.player;
  const pro = p.pro;
  const lines = (rec.b20 as Extra & { transcript?: string[] }).transcript ?? [];
  const has = (re: RegExp) => lines.filter((l) => re.test(l)).map((l) => l.slice(0, 220));
  // What the player pressed or answered at a stop, not what a notice's words mention.
  const did = (re: RegExp) => lines.filter((l) => /\| (PRESS|STOP|REFUSED) \|/.test(l) && re.test(l)).map((l) => l.slice(0, 220));
  const notices = (re: RegExp) => rec.notices.filter((n) => re.test(n[2])).map((n) => `${n[0]} ${n[2]}`);
  const opps = pro?.opportunities ?? [];
  const rounds = opps.flatMap((o) => (o.rounds ?? []).map((r) => ({ o, r })));
  const r: Record<string, string[]> = {};
  const accepted = (pro?.agreements ?? []).filter((a) => a.status === 'accepted' || (a.status === 'ended' && a.signedAt !== undefined));
  r.represented = accepted.map((a) => `agreement with ${a.agentId} signed ${a.signedAt ? day(a.signedAt) : '?'}${a.endedAt ? `, ended ${day(a.endedAt)} (${a.endedHow})` : ''}`);
  r.unsigned = ended(sim) && !accepted.length ? [`no agreement in ${rec.b20.schoolEnd ?? '?'} to ${stamp(sim.now)}; ${opps.filter((o) => o.via === 'open' && o.sent !== undefined).length} open calls submitted to of those kept`] : [];
  r.success = [...(pro?.engagements ?? []).map((e) => `${e.role} in ${projectById(e.projectId)?.project}: ${e.status}, ${e.pay.filter((x) => x.received).length} payments received`), ...rounds.filter(({ r: x }) => x.casting?.yes).map(({ o, r: x }) => `${x.round} for ${o.projectId} went on (${x.band})`)];
  r.failure = [...rounds.filter(({ r: x }) => x.casting && !x.casting.yes).map(({ o, r: x }) => `${x.round} for ${o.projectId} ${x.band ?? ''}: not cast (chance ${Math.round((x.casting!.chance) * 100)}%)`), ...Object.values(pro?.relations ?? {}).filter((x) => ['passed', 'unanswered'].includes(x.stage)).map((x) => `${x.agentId}: ${x.stage}`), ...(rec.reviews as { term: number; standing: string }[]).filter((x) => x.standing !== 'good').map((x) => `term ${x.term}: ${x.standing}`)];
  r.delay = [...rounds.filter(({ r: x }) => (x.moved ?? 0) > 0).map(({ o, r: x }) => `${x.round} for ${o.projectId} moved ${x.moved}`), ...did(/Ask To Move|Ask For Another Time/), ...notices(/Repeat|Leave|Hold/), ...(rec.b20.workDays.length === 0 && ended(sim) ? [] : [])];
  r.decline = [...did(/Decline The (Offer|Agreement)/), ...(pro?.agreements ?? []).filter((a) => a.status === 'declined').map((a) => `agreement declined ${day(a.offeredAt)}`)];
  r.interruption = [...(rec.health as { at: string; events: string[] }[]).map((h) => `${h.at.slice(0, 10)} ${h.events.join('; ')}`), ...rec.b20.workDays.filter((d) => d.status === 'missed').map((d) => `${d.at} ${d.role} missed`), ...notices(/^You Missed/), ...rounds.filter(({ r: x }) => x.status === 'missed').map(({ o }) => `${o.projectId} audition missed`)];
  // Each stretch ill, hurt or in hospital (the morning record), and the condition a week after it ended against the morning it began.
  const spells: string[] = [];
  const d = rec.daily;
  for (let i = 1; i < d.length; i += 1) {
    const was = d[i - 1]![5] || d[i - 1]![6] || d[i - 1]![7], is = d[i]![5] || d[i]![6] || d[i]![7];
    if (!was || is) continue;
    let k = i - 1; while (k > 0 && (d[k - 1]![5] || d[k - 1]![6] || d[k - 1]![7])) k -= 1;
    const week = d[Math.min(d.length - 1, i + 7)]!;
    spells.push(`${d[k]![0]} to ${d[i - 1]![0]} ${d[i - 1]![5] ? 'ill' : d[i - 1]![6] ? 'hurt' : 'in hospital'}: condition ${d[Math.max(0, k - 1)]![3]} the morning before, ${d[k]![3]} at its start, ${week[3]} a week after its end`);
  }
  r.recovery = [...(rec.standings as { at: string; standing: string }[]).filter((x, i, all) => i > 0 && x.standing === 'good' && all[i - 1]!.standing !== 'good').map((x) => `${x.at.slice(0, 10)} back to good`), ...notices(/^The Financial Hold Is Lifted$/), ...spells];
  r.clash = [...did(/clash|You’re booked for|holds you for/i), ...has(/NOTICE \|[^|]*\|[^|]*(clash|at the same time)/i).slice(0, 6), ...notices(/Clash/)];
  const monthsLow = (rec.monthly as { on: string; bank: number }[]).filter((m) => m.bank < 1000).map((m) => `${m.on} $${m.bank}`);
  r.littleMoney = [...(['nothing', 'scraping'].includes(String(life.config.wealth)) ? [`made ${life.config.wealth}`] : []), ...monthsLow.slice(0, 6), ...notices(/Declined|Overdra|Owed|Hold|Late Fee/).slice(0, 6)];
  const prepped = rounds.filter(({ o }) => o.prep && o.prep.interpretation >= 0.9);
  const cold = rounds.filter(({ o }) => !o.prep || o.prep.interpretation < 0.3);
  r.poorPreparation = [...(rec.showings as { id: string; band: string }[]).filter((x) => x.band === 'unready').slice(0, 5).map((x) => `${x.id} Unready`), ...cold.map(({ o, r: x }) => `${o.projectId} ${x.round} with the sides at ${Math.round((o.prep?.interpretation ?? 0) * 100)}%: ${x.band ?? ''}`)];
  r.strongPreparation = [...(rec.showings as { id: string; band: string }[]).filter((x) => ['strong', 'exceptional'].includes(x.band)).slice(0, 5).map((x) => `${x.id} ${x.band}`), ...prepped.map(({ o, r: x }) => `${o.projectId} ${x.round} prepared: ${x.band ?? ''}`)];
  const genres = Object.entries(p.engagement?.byGenre ?? {}).filter(([, x]) => (x?.practice ?? 0) > 0).sort((a, b) => (b[1]?.practice ?? 0) - (a[1]?.practice ?? 0)).slice(0, 3);
  r.genreStrengths = [`strongest practiced: ${genres.map(([g, x]) => `${g} ${r1(x?.practice ?? 0)}`).join(', ') || 'none'}; loved at creation: ${(p.genres ?? []).join(', ')}`];
  const tired = (p.work ?? []).filter((w) => w.limits.some((l) => /fatigue|tired|energy|sleep/i.test(`${l.kind} ${l.what}`)));
  r.fatigue = [...tired.slice(-5).map((w) => `${stamp(w.at)} ${w.what}: ${w.limits.map((l) => `${l.kind}:${l.what}`).join(', ')}`), ...notices(/Tired|Exhaust|Fatigue|Sleep/).slice(0, 5)];
  const f1 = documentsOf(p).some((d) => d.kind === 'visa' && d.name.startsWith('F-1'));
  r.workAuthorization = f1 ? [
    ...documentsOf(p).filter((d) => d.kind === 'permit' || d.kind === 'visa').map((d) => `${d.name} ${d.status}${d.issuedAt ? ` issued ${day(d.issuedAt)}` : ''}${d.expiresAt ? ` to ${day(d.expiresAt)}` : ''}`),
    ...did(/rules out work/i).slice(0, 6), ...has(/NOTICE \| [^|]*(OPT|Status|Work Authori|Permission)[^|]*\|/i).slice(0, 8),
    ...rec.b20.workDays.filter((d) => d.status === 'worked').slice(0, 3).map((d) => `${d.at} worked under ${d.papers.join(', ') || 'nothing in force'}`),
  ] : [];
  return r;
}

// ---------------------------------------------------------------------------------------------------------------------
// A part
// ---------------------------------------------------------------------------------------------------------------------

function partSummary(rec: BRec, done: boolean) {
  const part = rec.parts.at(-1)!;
  const last = rec.b20.credit.at(-1);
  return {
    id: rec.id, ...part, done, standing: rec.standings.at(-1)?.standing, schoolEnd: rec.b20.schoolEnd, careerFrom: rec.b20.careerFrom,
    reloads: rec.reloads.length, notSame: rec.reloads.filter((r) => !r.same).length,
    transitions: rec.b20.transitions.map((t) => `${t.at} ${t.what}: ${t.same ? 'same' : 'DIFFERENT'}`), forks: rec.b20.forks.map((f) => `${f.at} ${f.why}: ${f.same ? 'same' : 'DIFFERENT'}`),
    workDays: rec.b20.workDays.length, notices: rec.notices.length, bank: last?.bank, errors: rec.b20.errors,
  };
}

function playPart(life: Life, part: number, stateDir: string, outDir: string, older?: string): void {
  const started = performance.now();
  mkdirSync(stateDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  const savePath = join(stateDir, `${life.seed}.save`);
  const statePath = join(stateDir, `${life.seed}.state.json`);
  const spec = specOf(life);
  let ctx: Ctx;
  if (part === 1) {
    let sim: Simulation;
    const rec = fresh(spec) as BRec;
    rec.b20 = { life: life.seed, table: life.table, played: life.played, career: CAREER_WORDS[life.career], nearest: life.nearest, transitions: [], credit: [], forks: [], workDays: [], errors: [] };
    if (older) {
      // An older save, opened as the game opens one: migrated, its professional record built once. Then opened again, to
      // the byte, and the reads its opening changed counted.
      const raw = gunzipSync(readFileSync(`tests/fixtures/${older}.json.gz`)).toString('utf8');
      sim = loadSave(deserialise(raw) as never);
      const first = serialise(sim.universe);
      const again = serialise(loadSave(deserialise(first) as never).universe);
      rec.b20.opening = {
        fixture: `tests/fixtures/${older}.json.gz`, at: stamp(sim.now), schema: (JSON.parse(raw) as { meta?: { schemaVersion?: number } }).meta?.schemaVersion, bytesSaved: raw.length, bytesOpened: first.length,
        openedAgainSame: first === again, ...(first === again ? {} : { diff: firstDiff(first, again) }), breaches: breaches(sim.universe).map((b) => `${b.law}: ${b.detail}`).slice(0, 10), audit: sim.ledger.audit().slice(0, 5),
        standing: sim.player.school?.standing, termsBegun: sim.player.school?.termsBegun, pro: sim.player.pro ? { since: stamp(sim.player.pro.since), equity: sim.player.pro.equity ? `${sim.player.pro.equity.how} ${stamp(sim.player.pro.equity.since)}` : undefined, showcase: sim.player.pro.showcase ? { term: sim.player.pro.showcase.term, options: sim.player.pro.showcase.options?.length, scenes: sim.player.pro.showcase.scenes.length } : undefined } : 'none',
        unread: sim.universe.notifications.filter((n) => !n.read).slice(-12).map((n) => `${day(n.at)} ${n.title}`),
      };
      rec.creation = { opened: older };
    } else {
      sim = make(spec);
      const read = creationRead(sim);
      rec.creation = read;
      rec.counterfactual = counterfactual(spec, read);
    }
    const st = freshPolicy();
    st.lastReload = sim.now;
    rec.b20.startedAt = sim.now;
    ctx = { life, spec, sim, rec, st, w: freshWatch(sim), player: { career: careerStepFor(life) }, prev: { condition: r1(sim.player.wellbeing.condition), fitness: Math.round(sim.player.wellbeing.fitness * 100) / 100, energy: r1(sim.player.wellbeing.energy) } };
    POLICY.ownWork = true; POLICY.workNotes = true; POLICY.partnerPart = true;
    instrument(ctx.sim, ctx.rec);
    transition(ctx, older ? 'opened' : 'creation');
  } else {
    if (!existsSync(savePath)) throw new Error(`No save for ${life.seed} in ${stateDir}: run part ${part - 1} first.`);
    const saved = readFileSync(savePath, 'utf8');
    const sim = loadSave(deserialise(saved) as never);
    const again = serialise(sim.universe);
    const kept = JSON.parse(readFileSync(statePath, 'utf8')) as { rec: BRec; st: PolicyState; w: Watch; tLines?: string[]; prev: Ctx['prev'] };
    if (kept.rec.parts.some((x) => (x as { done?: boolean }).done)) { console.log(JSON.stringify({ id: life.seed, part, done: true, note: 'the journey had already ended' })); return; }
    kept.rec.reloads.push({ at: stamp(sim.now), same: again === saved, bytes: saved.length, ...(again === saved ? {} : { diff: firstDiff(saved, again) }) });
    ctx = { life, spec, sim, rec: kept.rec, st: kept.st, w: kept.w, prev: kept.prev, player: { career: careerStepFor(life) } };
    if (kept.tLines) { ctx.t = transcriptFrom(sim); ctx.t.lines = kept.tLines; ctx.player.transcript = ctx.t; }
    POLICY.ownWork = true; POLICY.workNotes = true; POLICY.partnerPart = true;
    instrument(ctx.sim, ctx.rec);
  }
  const from = ctx.sim.now;
  const partEnd = arg('to') ? on(Number(arg('to').slice(0, 4)), Number(arg('to').slice(5, 7)), Number(arg('to').slice(8, 10))) : older ? Math.min(from + 304 * MS_DAY, PART_ENDS.at(-1)!) : PART_ENDS[part - 1]!;
  // The journey's end: nine months past the School's end, on the first of a month (three for an older save); a year past
  // the last part's start where the School never ends.
  const journeyEnd = () => {
    // `--end <yyyy-mm-dd>`: a journey played on to a day of the looker's choosing (for a closer look past its own end).
    if (arg('end')) return on(Number(arg('end').slice(0, 4)), Number(arg('end').slice(5, 7)), Number(arg('end').slice(8, 10)));
    const e = ctx.sim.player.school?.endedAt;
    if (e === undefined) return older && ctx.w.ended ? monthsPast(ctx.rec.b20.startedAt!, 3) : PART_ENDS.at(-1)!;
    return older ? monthsPast(Math.max(e, ctx.rec.b20.startedAt!), 3) : monthsPast(e, 9);
  };
  let reloads = 0;
  try {
    while (ctx.sim.now < Math.min(partEnd, journeyEnd()) && ctx.sim.universe.meta.endedAt === undefined) {
      step(ctx);
      transitions(ctx);
      if (!ctx.w.forked.includes('school') && !ended(ctx.sim) && ctx.sim.now > on(2026, 9, 1)) { const why = schoolObligation(ctx.sim); if (why) { ctx.w.forked.push('school'); fork(ctx, why); transitions(ctx); } }
      if (careerOn(ctx) && ctx.sim.universe.meta.endedAt === undefined) {
        const o = careerObligations(ctx.sim).find((x) => !ctx.w.forked.includes(x.kind));
        if (o) { ctx.w.forked.push(o.kind); fork(ctx, o.why); transitions(ctx); }
      }
      if (ctx.sim.now - ctx.st.lastReload >= 30 * MS_DAY && zonedParts(ctx.sim.now, ctx.sim.zone).hour === 12) {
        ctx.sim = reload(ctx.sim, ctx.rec);
        instrument(ctx.sim, ctx.rec);
        reloads += 1;
        ctx.st.lastReload = ctx.sim.now;
      }
    }
  } catch (e) {
    ctx.rec.b20.errors.push(`${stamp(ctx.sim.now)} ${String((e as Error).stack ?? e).slice(0, 900)}`);
    ctx.rec.end = { ...(ctx.rec.end ?? {}), error: String((e as Error).stack ?? e).slice(0, 800) };
  }
  scan(ctx.sim, ctx.rec, ctx.st, ctx.prev);
  readNotices(ctx.sim, ctx.t);
  const done = ctx.sim.now >= journeyEnd() || ctx.sim.universe.meta.endedAt !== undefined || ctx.rec.b20.errors.length > 0 || (!older && part === PART_ENDS.length);
  ctx.rec.parts.push({ part, from: day(from), to: day(ctx.sim.now), secs: Math.round((performance.now() - started) / 1000), reloads, ...(done ? { done } : {}) } as Rec['parts'][number]);
  const transcript = ctx.t?.lines ?? [];
  if (done) {
    ctx.rec.b20.credit.push(creditRead(ctx.sim, 'the journey’s end'));
    ctx.rec.b20.journeyEnd = journeyEnd();
    if (!older) {
      ctx.rec.end = { ...(ctx.rec.end ?? {}), ...finish(ctx.sim, ctx.rec) };
      ctx.rec.checks = checks(spec, ctx.sim, ctx.rec);
      ctx.rec.continuity = continuity(ctx.rec);
    } else {
      ctx.rec.end = { ...(ctx.rec.end ?? {}), on: day(ctx.sim.now), standing: ctx.sim.player.school?.standing, history: (ctx.sim.player.school?.history ?? []).map((h) => `${h.term}:${h.standing}`), bank: Math.round(inTheBank(ctx.sim, ctx.sim.player) / 100), audit: ctx.sim.ledger.audit().length, breaches: breaches(ctx.sim.universe).length, documents: documentsOf(ctx.sim.player).map((d) => `${d.kind} ${d.name} ${d.status}${d.expiresAt ? ` to ${day(d.expiresAt)}` : ''}`) };
    }
    (ctx.rec.b20 as Extra & { transcript?: string[] }).transcript = transcript;
    const coh = coherence(ctx.sim, ctx.rec);
    const met = routes(ctx.sim, ctx.rec, life);
    delete (ctx.rec.b20 as Extra & { transcript?: string[] }).transcript;
    const base = older ? { id: ctx.rec.id, done: true, parts: ctx.rec.parts, creation: ctx.rec.creation, end: ctx.rec.end, standings: ctx.rec.standings, reviews: ctx.rec.reviews, acts: ctx.rec.acts, health: ctx.rec.health, reloads: { n: ctx.rec.reloads.length, notSame: ctx.rec.reloads.filter((r) => !r.same) }, notices: ctx.rec.notices.map((n) => [n[0], n[2]]) } : compact(ctx.rec);
    writeFileSync(join(outDir, `${life.seed}.json`), `${JSON.stringify({ ...base, b20: ctx.rec.b20, coherence: coh, routes: met }, null, 1)}\n`);
  }
  writeFileSync(join(outDir, `${life.seed}-career.txt`), `${transcript.join('\n')}\n`);
  writeFileSync(join(outDir, `${life.seed}-p${part}.json`), `${JSON.stringify(partSummary(ctx.rec, done), null, 1)}\n`);
  writeFileSync(savePath, serialise(ctx.sim.universe));
  writeFileSync(statePath, JSON.stringify({ rec: ctx.rec, st: ctx.st, w: ctx.w, tLines: ctx.t?.lines, prev: ctx.prev }));
  console.log(JSON.stringify(partSummary(ctx.rec, done)));
}

// ---------------------------------------------------------------------------------------------------------------------
// The table across the journeys
// ---------------------------------------------------------------------------------------------------------------------

function table(dir: string): void {
  const rows: Record<string, unknown>[] = [];
  for (const f of readdirSync(dir).filter((x) => /^(b20-\d|journey-|old-).*\.json$/.test(x) && !/-p\d+\.json$/.test(x)).sort()) {
    const r = JSON.parse(readFileSync(join(dir, f), 'utf8')) as { id: string; end?: Record<string, unknown>; checks?: Record<string, { pass: boolean; fails: string[] }>; b20: Extra; coherence: Record<string, { pass: boolean; fails: string[] }>; routes: Record<string, string[]> };
    if (!r.b20 || !r.coherence) continue; // a trace or another record kept beside the journeys
    rows.push({
      id: r.id, end: `${r.end?.standing} ${r.b20.schoolEnd ?? ''}`, career: r.b20.careerFrom, transitions: `${r.b20.transitions.filter((t) => t.same).length}/${r.b20.transitions.length} same`,
      forks: r.b20.forks.map((x) => `${x.why.slice(0, 50)}: ${x.same ? 'same' : 'DIFFERENT'}`), checks: Object.fromEntries(Object.entries(r.checks ?? {}).map(([k, v]) => [k, v.pass ? 'pass' : v.fails.slice(0, 2)])),
      coherence: Object.fromEntries(Object.entries(r.coherence).map(([k, v]) => [k, v.pass ? 'pass' : v.fails.slice(0, 3)])), routes: Object.fromEntries(Object.entries(r.routes).map(([k, v]) => [k, v.length])),
      money: r.b20.credit.filter((c) => /end of|end’s|School’s end|creation|opened/.test(c.what)).map((c) => `${c.what}: bank $${c.bank}, cards ${c.cards.map((x) => `${x.name} $${x.limit}`).join(' + ')}, score ${c.score}, income $${c.income12}`), errors: r.b20.errors,
    });
  }
  writeFileSync(join(dir, 'table.json'), `${JSON.stringify(rows, null, 1)}\n`);
  console.log(JSON.stringify(rows, null, 1));
}

/**
 * `--reread`: a finished journey's ten checks, coherence checks and routes worked out again from its save and record,
 * nothing played, for a change to those reads alone; its record is written again with them.
 */
function reread(life: Life, stateDir: string, outDir: string): void {
  const sim = loadSave(deserialise(readFileSync(join(stateDir, `${life.seed}.save`), 'utf8')) as never);
  const kept = JSON.parse(readFileSync(join(stateDir, `${life.seed}.state.json`), 'utf8')) as { rec: BRec; tLines?: string[] };
  const file = join(outDir, `${life.seed}.json`);
  const out = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  (kept.rec.b20 as Extra & { transcript?: string[] }).transcript = kept.tLines ?? [];
  // Brief 13's ten checks again too, for a life this runner made (an older save's weren't run).
  if (LIVES.some((l) => l.seed === life.seed)) { kept.rec.checks = checks(specOf(life), sim, kept.rec); out.checks = kept.rec.checks; }
  out.coherence = coherence(sim, kept.rec);
  out.routes = routes(sim, kept.rec, life);
  writeFileSync(file, `${JSON.stringify(out, null, 1)}\n`);
  console.log(JSON.stringify({ id: life.seed, reread: true, coherence: Object.fromEntries(Object.entries(out.coherence as Record<string, { pass: boolean }>).map(([k, v]) => [k, v.pass])) }));
}

if (process.argv.includes('--reread')) { const id = arg('reread'); reread(LIVES.find((l) => l.seed === id) ?? olderLife(id), arg('state'), arg('out')); }
else if (process.argv.includes('--table')) table(arg('table'));
else if (process.argv.includes('--older')) playPart(olderLife(arg('older')), Number(arg('part', '1')), arg('state'), arg('out'), arg('older'));
else if (process.argv.includes('--life')) {
  const life = LIVES.find((l) => l.seed === arg('life'));
  if (!life) throw new Error(`No life "${arg('life')}": ${LIVES.map((l) => l.seed).join(', ')}`);
  playPart(life, Number(arg('part', '1')), arg('state'), arg('out'));
}
