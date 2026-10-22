/**
 * SLATE — complete school journeys, each checked ten ways (from 2026-10-17, brief 13's sections 4 and 6;
 * docs/verification/playthroughs-2026-10-17/journeys-criteria.md, written before this and before any journey ran).
 *
 * Each journey is a profile (who the student is, from creation's own choices, and what's TEST SETUP, said in its name)
 * and a player (how they play, every hour, through public commands only): `tools/lives.ts`'s attentive and practicing
 * students, through `tools/policy.ts`, and the players the brief adds: one who partly follows the advice, one who ignores
 * it, one who neglects the coursework, one who neglects it until a warning or a concern, one who misses a course's
 * meetings and repeats the year, and the ill. It saves and opens the life every thirty days at noon and at the end of each
 * part, and checks that the state after is the state before, to the byte.
 *
 * A journey runs in parts, each under ten minutes in the foreground: `--part 1` creates the life and plays to 1 June 2027,
 * `--part 2` to 1 June 2028, `--part 3` to 1 June 2029, `--part 4` to the end (75 days after the school ends, or
 * 1 September 2030). Each part opens the save and the record the part before left in `--state`, a directory outside the
 * repository, and writes its own record to `--out`. The last part works out the ten checks and the continuity and
 * freshness record. `--summarize` reads every journey's last record and writes the table.
 *
 *   npx vite-node tools/journeys.ts -- --journey J01 --part 1 --state <dir> --out docs/verification/playthroughs-2026-10-17/journeys/J01-p1.json
 *   npx vite-node tools/journeys.ts -- --summarize docs/verification/playthroughs-2026-10-17/journeys
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createSave, loadSave } from '../src/engine';
import type { Simulation } from '../src/engine/core/simulation';
import { newLifeFrom, type NewSaveConfig } from '../src/engine/world/bootstrap';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '../src/engine/core/time';
import { breaches } from '../src/engine/core/invariants';
import { suggestedSleep } from '../src/engine/systems/life';
import { careFor, coverOn, healthOf, inHospital } from '../src/engine/systems/health';
import { CARE } from '../src/engine/content/safetynet';
import { injuryOf, mayHurt } from '../src/engine/systems/injury';
import { ABILITY_DEFS, MASTERED, type AbilityId } from '../src/engine/content/abilities';
import { abilityFull, abilityOf, levelOf } from '../src/engine/systems/attributes';
import { evenCraft, hasNeed, coursesOn, classPeriod, keyOf, termStart, sickRefusal, STANDING_LABEL } from '../src/engine/systems/school';
import type { SchoolDate } from '../src/engine/content/school';
import { courseworkOf, playingPreview, shortAtShowing, questionsFor, type Assignment } from '../src/engine/systems/coursework';
import { templateById } from '../src/engine/content/coursework';
import { exerciseFor, PRACTICE } from '../src/engine/content/practice';
import { practiceRefusal, practicedToday, matchedTier } from '../src/engine/systems/practice';
import { adviceFor } from '../src/engine/systems/next-steps';
import { replay, replayAs, frozenPerformer, type Performer, type WorkRecord } from '../src/engine/systems/evaluation';
import { RULESET, TASK_PROFILES } from '../src/engine/content/tasks';
import { documentsOf, inForce, passportOf, passportRefusal, photoIdOf, citizenOf } from '../src/engine/systems/documents';
import { optRefusal, usWorkAuthorized } from '../src/engine/systems/permission';
import { openRefusal } from '../src/engine/systems/bankmoves';
import { banksFor } from '../src/engine/systems/banking';
import { homeOf } from '../src/engine/systems/earnings';
import { accountOwed, aidReviewRefusal, repeatRefusal } from '../src/engine/systems/leave';
import { genreSpeed, relatedness } from '../src/engine/systems/engagement';
import { GENRE_DEFS } from '../src/engine/content/genres';
import { inTheBank } from '../src/engine/systems/spending';
import { POLICY, evening, freeHour, keepCovered, lookAfter, practiceHour } from './policy';
import { fixedPieces } from './pieces';

// ---------------------------------------------------------------------------
// The journeys, as the criteria name them
// ---------------------------------------------------------------------------

export type Player = 'attentive' | 'follows' | 'partly' | 'ignores' | 'neglect';
export type Setup = 'low40' | 'generalist' | 'feeling' | 'body' | 'mastered';
export interface Spec {
  id: string; profile: string; seed: string; config: Partial<NewSaveConfig>; setup?: Setup; player: Player;
  /** Neglect until this notice comes, then attentive. */
  until?: 'A Word On Your Coursework' | 'A Notice Of Academic Concern';
  papers: boolean; playing?: boolean;
  /** Meetings slept through: the term, the course and how many. */
  skip?: { term: number; code: string; times: number };
  /** Asks to repeat the year when offered, asks the aid office's review when offered, pays the Yale account only on a hold. */
  repeats?: boolean;
  adverse?: 'flu-injury' | 'stays';
  sickCalls?: boolean;
  /** A focused scenario's TEST SETUP. */
  focused?: 'passport' | 'plan-unpaid';
  /** What it should come to (journeys-criteria.md): the standing, and the day it comes on where the rules give one. */
  expect: { standing: 'graduated' | 'dismissed'; on?: string; note: string };
}

const C = (homeRegionId: string, pronouns: string, wealth: NewSaveConfig['wealth'], extra: Partial<NewSaveConfig> = {}): Partial<NewSaveConfig> => ({ homeRegionId, pronouns, wealth, ...extra });
const GRAD29 = { standing: 'graduated' as const, on: '2029-05-21' };
const GRAD30 = { standing: 'graduated' as const, on: '2030-05-20' };

export const JOURNEYS: Spec[] = [
  { id: 'J01', profile: 'beginner, as made', seed: 'j13-1', config: C('us-ny-newyork', 'she/her', 'wealthy'), player: 'attentive', papers: true, expect: { ...GRAD29, note: 'good at the last review; at most one concern, remedied' } },
  { id: 'J02', profile: 'TEST SETUP beginner: every ability and technique at 40', seed: 'j13-2', config: C('mx-cmx-mexicocity', 'he/him', 'comfortable'), setup: 'low40', player: 'attentive', papers: true, expect: { ...GRAD29, note: 'more Unready pieces in the first year than J01; a second concern no defect, a warning a surprise' } },
  { id: 'J03', profile: 'as made, follows the advice', seed: 'j13-3', config: C('uk-eng-london', 'they/them', 'modest', { performerTitle: 'actor' }), player: 'follows', papers: true, expect: { ...GRAD29, note: 'the advised inputs rise most here of J03 to J05' } },
  { id: 'J04', profile: 'as made, partly follows the advice', seed: 'j13-3', config: C('uk-eng-london', 'they/them', 'modest', { performerTitle: 'actor' }), player: 'partly', papers: true, expect: { ...GRAD29, note: 'between J03 and J05' } },
  { id: 'J05', profile: 'as made, ignores the advice', seed: 'j13-3', config: C('uk-eng-london', 'they/them', 'modest', { performerTitle: 'actor' }), player: 'ignores', papers: true, expect: { ...GRAD29, note: 'its favorite rises most here; the advice may repeat, justified while unmoved' } },
  { id: 'J06', profile: 'as made, follows the advice', seed: 'j13-4', config: C('us-ny-newyork', 'he/him', 'wealthy'), player: 'follows', papers: true, expect: { ...GRAD29, note: 'the advised inputs rise most here of J06 to J08' } },
  { id: 'J07', profile: 'as made, partly follows the advice', seed: 'j13-4', config: C('us-ny-newyork', 'he/him', 'wealthy'), player: 'partly', papers: true, expect: { ...GRAD29, note: 'between J06 and J08' } },
  { id: 'J08', profile: 'as made, ignores the advice', seed: 'j13-4', config: C('us-ny-newyork', 'he/him', 'wealthy'), player: 'ignores', papers: true, expect: { ...GRAD29, note: 'its favorite rises most here' } },
  { id: 'J09', profile: 'TEST SETUP balanced generalist: the eleven at 703/11', seed: 'j13-5', config: C('jp-13-tokyo', 'she/her', 'comfortable'), setup: 'generalist', player: 'follows', papers: true, expect: { ...GRAD29, note: 'the generalist J11 is compared with' } },
  { id: 'J10', profile: 'TEST SETUP balanced generalist: the eleven at 703/11', seed: 'j13-6', config: C('de-be-berlin', 'he/him', 'wealthy'), setup: 'generalist', player: 'follows', papers: true, expect: { ...GRAD29, note: 'the generalist J12 is compared with' } },
  { id: 'J11', profile: 'TEST SETUP feeling specialist: emotional depth, composure, imagination, presence 90, the other seven 49', seed: 'j13-5', config: C('jp-13-tokyo', 'she/her', 'comfortable'), setup: 'feeling', player: 'follows', playing: true, papers: true, expect: { ...GRAD29, note: 'above J09 where its strengths are read, below where its 49s are; its 90s stay above its 49s' } },
  { id: 'J12', profile: 'TEST SETUP voice-and-body specialist: vocal, physical, memory, presence 90, the other seven 49', seed: 'j13-6', config: C('de-be-berlin', 'he/him', 'wealthy'), setup: 'body', player: 'follows', playing: true, papers: true, expect: { ...GRAD29, note: 'above J10 where its strengths are read, below where its 49s are' } },
  { id: 'J13', profile: 'TEST SETUP mastered: every ability and technique at full', seed: 'j13-7', config: C('us-ny-newyork', 'they/them', 'wealthy', { performerTitle: 'actress' }), setup: 'mastered', player: 'attentive', playing: true, papers: true, expect: { ...GRAD29, note: 'complete pieces at mastery; any short of it limited by preparation, condition, fit or suitability' } },
  { id: 'J14', profile: 'TEST SETUP mastered: every ability and technique at full', seed: 'j13-8', config: C('kr-11-seoul', 'she/her', 'modest'), setup: 'mastered', player: 'attentive', playing: true, papers: true, expect: { ...GRAD29, note: 'as J13' } },
  { id: 'J15', profile: 'as made, neglects the coursework', seed: 'j13-9', config: C('us-ca-losangeles', 'she/her', 'wealthy'), player: 'neglect', papers: false, expect: { standing: 'dismissed', on: '2027-12-10', note: 'concern December 2026, warning April 2027, dismissed at the third review, each review warned in its term' } },
  { id: 'J16', profile: 'as made, neglects the coursework', seed: 'j13-10', config: C('is-39-reykjavik', 'he/him', 'scraping'), player: 'neglect', papers: false, expect: { standing: 'dismissed', on: '2027-12-10', note: 'as J15; F-1 status ends with the dismissal, OPT refused for leaving without the degree' } },
  { id: 'J17', profile: 'as made, neglects until the first coursework warning, then keeps up', seed: 'j13-11', config: C('ca-on-toronto', 'they/them', 'wealthy', { performerTitle: 'actor' }), player: 'attentive', until: 'A Word On Your Coursework', papers: true, expect: { ...GRAD29, note: 'warned in the first term; that term good' } },
  { id: 'J18', profile: 'as made, neglects the first term, then keeps up from its concern', seed: 'j13-12', config: C('us-tx-houston', 'he/him', 'nothing'), player: 'attentive', until: 'A Notice Of Academic Concern', papers: true, expect: { ...GRAD29, note: 'concern at the first review, good at the second' } },
  { id: 'J19', profile: 'as made, a family with nothing, papers not kept', seed: 'j13-13', config: C('nz-akl-auckland', 'she/her', 'nothing'), player: 'attentive', papers: false, expect: { ...GRAD29, note: 'scholarship each term, 14% withheld; out of status sixty days after the program ends' } },
  { id: 'J20', profile: 'as made, scraping, sleeps through four meetings of Text Analysis I in the first spring, repeats the year, pays the Yale account only on a hold', seed: 'j13-14', config: C('fr-idf-paris', 'he/him', 'scraping'), player: 'attentive', papers: true, skip: { term: 1, code: 'DRAM 163b', times: 4 }, repeats: true, expect: { ...GRAD30, note: 'course failed, concern, repeat, terms past six billed, a hold and its late fee, paid, registered, degree in 2030' } },
  { id: 'J21', profile: 'TEST SETUP the flu each 15 October and 15 February and a fall each 1 March; calls in sick', seed: 'j13-15', config: C('mx-cmx-mexicocity', 'she/her', 'scraping'), player: 'attentive', papers: true, adverse: 'flu-injury', sickCalls: true, expect: { ...GRAD29, note: 'illness excused; work ill judged lower by condition' } },
  { id: 'J22', profile: 'TEST SETUP two stays in hospital in October 2026 and a third six weeks long; gives notice and registers', seed: 'j13-16', config: C('ie-lei-dublin', 'they/them', 'wealthy', { performerTitle: 'actress' }), player: 'attentive', papers: true, adverse: 'stays', expect: { ...GRAD30, note: 'the dean’s medical leave, the return with the class of 2030, the degree in 2030' } },
  // Added after J21's life ended in its third year (journeys-criteria.md, Added After A Journey Ran), before it ran.
  { id: 'J23', profile: 'TEST SETUP the flu each 15 October and 15 February and a fall each 1 March; calls in sick', seed: 'j13-17', config: C('ng-05-lagos', 'he/him', 'scraping'), player: 'attentive', papers: true, adverse: 'flu-injury', sickCalls: true, expect: { ...GRAD29, note: 'as J21' } },
  // Focused scenarios (journeys-criteria.md, Focused Scenarios): played as journeys, to their end, from a TEST SETUP.
  { id: 'F1', profile: 'focused, papers: TEST SETUP the passport runs out on 1 October 2026', seed: 'j13-f1', config: C('de-be-berlin', 'she/her', 'wealthy'), player: 'attentive', papers: true, focused: 'passport', expect: { ...GRAD29, note: 'the bank asks a photo ID while none is in force; renewed, issued, the old canceled, the ask gone' } },
  { id: 'F2', profile: 'focused, money: TEST SETUP the checking emptied the day before the spring term, $3,000 from family a week later', seed: 'j13-f2', config: C('us-ny-newyork', 'he/him', 'wealthy'), player: 'attentive', papers: true, focused: 'plan-unpaid', expect: { ...GRAD29, note: 'the spring plan owed and said, paid the first day there’s money' } },
];

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const arg = (name: string, d = '') => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1]! : d; };
const NY = 'America/New_York';
const on = (y: number, m: number, d: number, h = 0) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);
const PART_ENDS = [on(2027, 6, 1), on(2028, 6, 1), on(2029, 6, 1), on(2030, 9, 1)];
const day = (t: number) => new Date(t).toISOString().slice(0, 10);
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;

// ---------------------------------------------------------------------------
// The record a journey keeps, part to part
// ---------------------------------------------------------------------------

export interface Rec {
  id: string; seed: string; profile: string; player: string; expect: Spec['expect'];
  parts: { part: number; from: string; to: string; secs: number; reloads: number }[];
  creation?: Record<string, unknown>; counterfactual?: Record<string, unknown>; setup?: Record<string, unknown>;
  /** Each morning at nine (the first hour seen from nine): the day, energy, stamina, condition, stress, ill, hurt, in hospital. */
  daily: [string, number, number, number, number, 0 | 1, 0 | 1, 0 | 1][];
  monthly: Record<string, unknown>[];
  notices: [string, string, string, string][];
  saidAgain: [string, string, string][];
  work: { at: string; task: string; what: string; overall: number; band?: string; mastery: boolean; limit?: string; ill?: boolean; hurt?: boolean; readiness: number }[];
  showings: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  advice: { day: string; target?: string; level?: number; forecast?: number; standing?: string; next?: string; attention?: string; why?: string; full?: boolean; recs: string[] }[];
  practice: Record<string, Record<string, number>>;
  commands: Record<string, number>;
  acts: string[];
  health: Record<string, unknown>[];
  reloads: { at: string; same: boolean; bytes: number; diff?: string }[];
  standings: { at: string; standing: string }[];
  interpretations: Record<string, unknown>[];
  ledger: { at: string; audit: number; breaches: number }[];
  end?: Record<string, unknown>;
  checks?: Record<string, { pass: boolean; evidence: string[]; fails: string[] }>;
  continuity?: Record<string, unknown>;
}

export interface PolicyState {
  seen: Record<string, number>; workAt: number; workSeenAtLast: number; shown: string[]; reviews: number; lastDay: string;
  lastMonth: string; lastAdviceDay: number; lastReload: number; switched: boolean; struck: string[]; skipped: string[]; considered: string[];
  standing: string; adverseLog: string[]; lastHealth: { careLog: number; injuryAt?: number; hospitalUntil?: number; fluUntil?: number };
  docs: Record<string, string>; courses: Record<string, string>; credits: number; nights?: number; tally?: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Creation and its TEST SETUP
// ---------------------------------------------------------------------------

export function make(spec: Spec, config: Partial<NewSaveConfig> = spec.config): Simulation {
  return createSave(1, spec.seed, newLifeFrom({ firstName: 'Ada', lastName: 'Cole', ...config }));
}

/** What creation chose, read back from the state it made. */
export function creationRead(sim: Simulation) {
  const p = sim.player;
  const accounts = Object.values(sim.universe.accounts).filter((a) => a.ownerId === p.id && !a.nominal);
  return {
    family: p.family ?? 'none', need: hasNeed(p), citizenship: p.citizenshipId, title: p.performerTitle, genres: p.genres ?? [], traits: p.personalityTraits ?? [],
    discipline: abilityOf(sim, p, 'discipline'), composure: abilityOf(sim, p, 'composure'), conscientiousness: p.personality?.conscientiousness, stability: p.personality?.emotionalStability,
    f1: documentsOf(p).some((d) => d.kind === 'visa' && d.name.startsWith('F-1')), documents: documentsOf(p).map((d) => `${d.kind} ${d.issuer} ${d.status} to ${d.expiresAt ? day(d.expiresAt) : 'none'}`),
    accounts: accounts.map((a) => `${a.kind} ${a.name} ${a.balance}`), bank: inTheBank(sim, p),
    abilities: Object.fromEntries(ABILITY_DEFS.map((d) => [d.id, r1(abilityOf(sim, p, d.id))])),
  };
}

export function applySetup(sim: Simulation, setup: Setup): Record<string, unknown> {
  const p = sim.player;
  const at = (v: number) => { for (const k of ['emotion', 'memorization', 'voice', 'movement'] as const) p.craft![k] = v; p.attrs = { ...(p.attrs ?? {}), presence: v, composure: v, listening: v, imagination: v, focus: v, adaptability: v, discipline: v } as typeof p.attrs; };
  if (setup === 'low40') { p.craft = evenCraft(40); at(40); p.wellbeing.fitness = 40; }
  if (setup === 'generalist') at(703 / 11);
  if (setup === 'feeling') {
    p.craft!.emotion = 90; p.craft!.memorization = 49; p.craft!.voice = 49; p.craft!.movement = 49;
    p.attrs = { ...(p.attrs ?? {}), composure: 90, imagination: 90, presence: 90, listening: 49, focus: 49, adaptability: 49, discipline: 49 } as typeof p.attrs;
  }
  if (setup === 'body') {
    p.craft!.voice = 90; p.craft!.movement = 90; p.craft!.memorization = 90; p.craft!.emotion = 49;
    p.attrs = { ...(p.attrs ?? {}), presence: 90, composure: 49, imagination: 49, listening: 49, focus: 49, adaptability: 49, discipline: 49 } as typeof p.attrs;
  }
  if (setup === 'mastered') {
    p.craft = evenCraft(MASTERED);
    for (const k of ['emotion', 'memorization', 'voice', 'movement'] as const) p.craft[k] = 100;
    p.attrs = { presence: 100, composure: 100, listening: 100, imagination: 100, focus: 100, adaptability: 100, discipline: 100 };
    p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
  }
  // The term's own starting point is the craft set (from J02's first run, 2026-10-17): the term had begun at creation
  // with the craft as admitted, and its review read the setup's lowering as growth of -7.9.
  if (p.school?.tally) p.school.tally.craftAtStart = { ...p.craft! };
  return { setup, abilities: Object.fromEntries(ABILITY_DEFS.map((d) => [d.id, r1(abilityOf(sim, p, d.id))])), techniques: { ...p.craft } };
}

/** The falsifiability test at creation: the same seed made again with one choice changed. */
export function counterfactual(spec: Spec, base: ReturnType<typeof creationRead>) {
  const read = (c: Partial<NewSaveConfig>) => creationRead(make(spec, { ...spec.config, ...c }));
  const fam = base.need ? 'wealthy' : 'scraping';
  const a = read({ wealth: fam as NewSaveConfig['wealth'] });
  const consc = (base.conscientiousness ?? 55) + 20;
  const b = read({ personality: { openness: 55, conscientiousness: consc, extraversion: 55, agreeableness: 55, emotionalStability: 55, ambition: 60, riskTolerance: 50 } });
  const home = base.f1 ? 'us-ny-newyork' : 'uk-eng-london';
  const c = read({ homeRegionId: home });
  // Across the title: an actress made an actor, an actor an actress (J13's first finish changed they/them to she/her, which
  // left its actress an actress and tested nothing).
  const pron = base.title === 'actress' ? 'he/him' : 'she/her';
  const d = read({ pronouns: pron, performerTitle: undefined });
  return {
    family: { to: fam, need: [base.need, a.need], bank: [base.bank, a.bank], moved: base.need !== a.need && base.bank !== a.bank },
    conscientiousness: { to: consc, discipline: [base.discipline, b.discipline], moved: Math.abs(b.discipline - base.discipline - 10) < 0.11 || Math.abs(b.discipline - (30 + 0.5 * consc)) < 0.11 },
    home: { to: home, f1: [base.f1, c.f1], moved: base.f1 !== c.f1 },
    pronouns: { to: pron, title: [base.title, d.title], moved: base.title !== d.title },
  };
}

// ---------------------------------------------------------------------------
// The player
// ---------------------------------------------------------------------------

/** The strongest ability that still has room and an exercise: the favorite a player who ignores the advice trains. */
function favorite(sim: Simulation): AbilityId | undefined {
  const p = sim.player;
  return ABILITY_DEFS.map((d) => d.id).filter((id) => exerciseFor(id) && levelOf(sim, p, id) < abilityFull(sim, p, id) - 0.5)
    .sort((a, b) => levelOf(sim, p, b) / abilityFull(sim, p, b) - levelOf(sim, p, a) / abilityFull(sim, p, a))[0];
}

/** An hour on the favorite, as `practiceHour` spends one on the advice's choice: the same unwinding, the same daily hours. */
function ownHour(sim: Simulation): boolean {
  const person = sim.player;
  if ((person.awakeSince ?? 0) > sim.now || person.wellbeing.energy < 40) return false;
  if (person.wellbeing.stress > 45) return practiceHour(sim);
  if (practicedToday(sim, person) >= PRACTICE.dailyHours) return false;
  const id = favorite(sim);
  const e = id ? exerciseFor(id) : undefined;
  if (e && !practiceRefusal(sim, person, e)) return sim.execute({ kind: 'practice.exercise', payload: { exercise: e.id, tier: matchedTier(levelOf(sim, person, id!)) } }).ok;
  return false;
}

export function practiceFor(spec: Spec, sim: Simulation): boolean {
  if (spec.player === 'follows') return practiceHour(sim);
  if (spec.player === 'ignores') return ownHour(sim);
  if (spec.player === 'partly') {
    const p = zonedParts(sim.now, sim.zone);
    const doy = Math.floor((Date.UTC(p.year, p.month - 1, p.day) - Date.UTC(p.year, 0, 1)) / MS_DAY);
    return doy % 2 === 0 ? practiceHour(sim) : ownHour(sim);
  }
  return false;
}

/** The way of playing the screen previews highest, on each axis against leaving it open; the previews kept. */
export function choosePlaying(sim: Simulation, rec: Rec, st: PolicyState, a: Assignment, choose: boolean) {
  st.considered.push(a.id);
  const today = keyOf(dateOf(sim.now));
  const base = playingPreview(sim, sim.player, a, today, {});
  const sides: Record<string, unknown> = { open: r2(base.exact ?? base.overall) };
  const pick: Record<string, string> = {};
  for (const [axis, opts] of [['scale', ['restrained', 'expansive']], ['pace', ['measured', 'driven']], ['structure', ['set', 'open']]] as const) {
    let best = { side: '', v: base.exact ?? base.overall };
    for (const side of opts) {
      const e = playingPreview(sim, sim.player, a, today, { [axis]: side } as never);
      const fit = Object.values(e.inputs.fit ?? {}).map((f) => `${f!.label} ${r2(f!.f)}`);
      const grain = Object.values(e.inputs.grain ?? {}).map((g) => `${g!.label} ${r2(g!.d)}`);
      sides[`${axis}:${side}`] = { v: r2(e.exact ?? e.overall), fit: [...new Set(fit)].slice(0, 3), grain: [...new Set(grain)].slice(0, 3) };
      if ((e.exact ?? e.overall) > best.v + 0.05) best = { side, v: e.exact ?? e.overall };
    }
    if (best.side) pick[axis] = best.side;
  }
  rec.interpretations.push({ at: day(sim.now), assignment: a.id, template: a.template, scene: a.sceneId, previews: sides, chosen: choose ? pick : 'not a chooser' });
  if (choose && Object.keys(pick).length) sim.execute({ kind: 'school.choose_playing', payload: { assignmentId: a.id, ...pick } });
}

export const dateOf = (t: number): SchoolDate => { const p = zonedParts(t, NY); return { year: p.year, month: p.month, day: p.day }; };

// ---------------------------------------------------------------------------
// One part of a journey
// ---------------------------------------------------------------------------

export function instrument(sim: Simulation, rec: Rec): void {
  const exec = sim.execute.bind(sim);
  const refusedLast: Record<string, string | undefined> = {};
  const notable = /^(documents\.|school\.(request_|pay_balance|reregister|call_in_sick|choose_playing|return_notice|withdraw)|health\.enroll)/;
  sim.execute = ((c: { kind: string; payload?: Record<string, unknown> }) => {
    const r = exec(c as never);
    const k = `${c.kind}${r.ok ? '' : ' refused'}`;
    rec.commands[k] = (rec.commands[k] ?? 0) + 1;
    if (r.ok && c.kind === 'practice.exercise') {
      const d = day(sim.now);
      const ex = String(c.payload?.exercise);
      (rec.practice[d.slice(0, 7)] ??= {})[ex] = (rec.practice[d.slice(0, 7)]![ex] ?? 0) + 1;
    }
    // A refusal is logged when it's new for its command, not each day it's met again.
    if (notable.test(c.kind) && (r.ok || refusedLast[c.kind] !== r.error)) rec.acts.push(`${day(sim.now)} ${c.kind}${r.ok ? '' : ` refused: ${r.error}`}`);
    refusedLast[c.kind] = r.ok ? undefined : r.error;
    return r;
  }) as typeof sim.execute;
}

export function fresh(spec: Spec): Rec {
  return { id: spec.id, seed: spec.seed, profile: spec.profile, player: spec.player, expect: spec.expect, parts: [], daily: [], monthly: [], notices: [], saidAgain: [], work: [], showings: [], reviews: [], advice: [], practice: {}, commands: {}, acts: [], health: [], reloads: [], standings: [], interpretations: [], ledger: [] };
}
export function freshPolicy(): PolicyState {
  return { seen: {}, workAt: 0, workSeenAtLast: 0, shown: [], reviews: 0, lastDay: '', lastMonth: '', lastAdviceDay: -1, lastReload: 0, switched: false, struck: [], skipped: [], considered: [], standing: '', adverseLog: [], lastHealth: { careLog: 0 }, docs: {}, courses: {}, credits: 0 };
}

/** What's new since the last look: notices, work, showings, reviews, standings, health events. */
export function scan(sim: Simulation, rec: Rec, st: PolicyState, prev: { condition: number; fitness: number; energy: number }): void {
  const p = sim.player;
  for (const n of sim.universe.notifications) {
    const was = st.seen[n.id];
    if (was === undefined) { st.seen[n.id] = n.at; rec.notices.push([day(n.at), n.category, n.title, n.body.slice(0, 600)]); }
    else if (was !== n.at) { st.seen[n.id] = n.at; rec.saidAgain.push([day(n.at), n.title, n.body.slice(0, 160)]); }
  }
  const work = p.work ?? [];
  const fresh: WorkRecord[] = [];
  for (let i = work.length - 1; i >= 0; i -= 1) { const w = work[i]!; if (w.at > st.workAt) fresh.unshift(w); else break; }
  for (const w of fresh) {
    rec.work.push({ at: new Date(w.at).toISOString().slice(0, 16), task: w.task, what: w.what, overall: w.overall, ...(w.band ? { band: w.band } : {}), mastery: w.mastery, ...(w.limits[0] ? { limit: `${w.limits[0].kind}:${w.limits[0].what}` } : {}), ...(w.inputs.condition.ill ? { ill: true } : {}), ...(w.inputs.condition.injured ? { hurt: true } : {}), readiness: Math.round(w.inputs.condition.readiness) });
    st.workAt = Math.max(st.workAt, w.at);
  }
  const cw = courseworkOf(sim, p);
  for (const a of cw?.assignments ?? []) {
    if (!a.shown || st.shown.includes(a.id)) continue;
    st.shown.push(a.id);
    const t = templateById(a.template)!;
    // Each piece's own record: by its title and the moment it was shown, and where two pieces of one title are shown at
    // one moment, by its score too (from 2026-10-21: the Actor Showcase's two scenes, both Your Showcase Scene, are shown
    // together, and each had read both records; brief 19's final runs). A record's overall is its piece's score × 100.
    const same = work.filter((w) => w.at === a.shown!.at && w.what === t.title);
    const byScore = same.length > 1 ? same.filter((w) => Math.abs(w.overall - a.shown!.score * 100) < 0.06) : same;
    // Two pieces at one score too (F1's two scenes, both 61.8): paired one to one, so each has its own where there are as
    // many records as pieces, and a record more than its pieces still fails.
    const twins = byScore.length > 1 ? (cw?.assignments ?? []).filter((x) => x.shown?.at === a.shown!.at && x.template === a.template && Math.abs(x.shown.score - a.shown!.score) < 0.0006).length : 1;
    const recs = byScore.length > 1 && byScore.length === twins ? byScore.slice(0, 1) : byScore;
    // As its showing read it: the round shown, for work in rounds (`shortAtShowing`; until 2026-10-17 this read the next
    // round's parts, J15's three "recurring" notes on table work counted as on a part not short).
    const short = shortAtShowing(p, a);
    rec.showings.push({
      id: a.id, term: a.term, course: a.course, template: a.template, scene: a.sceneId, at: day(a.shown.at), band: a.shown.band, score: a.shown.score,
      records: recs.length, recordBand: recs[0]?.band, recordOverall: recs[0]?.overall, prep: recs[0] ? Object.fromEntries(Object.entries(recs[0].inputs.prep).map(([k, v]) => [k, r2(v)])) : undefined,
      answers: Object.keys(a.answers).length, questions: questionsFor(a).length, playing: a.playing ? { ...a.playing, chosenAt: undefined } : undefined,
      recordFit: recs[0]?.inputs.fit ? Object.keys(recs[0].inputs.fit).length : 0, recordGrain: recs[0]?.inputs.grain ? Object.keys(recs[0].inputs.grain).length : 0,
      short, shortLabels: short.map((d) => t.dims[d]?.label), feedback: a.feedback ? { kind: a.feedback.kind, focus: a.feedback.focus.kind === 'dim' ? `dim:${a.feedback.focus.dim}` : a.feedback.focus.kind === 'choice' ? `choice:${(a.feedback.focus as { question?: string }).question ?? ''}` : a.feedback.focus.kind, text: a.feedback.text.slice(0, 200) } : undefined,
    });
  }
  const s = p.school;
  if (s && s.history.length > st.reviews) {
    for (const h of s.history.slice(st.reviews)) {
      // The term's last coursework piece judged again with its preparation at nothing and at complete (check 2).
      const term = h.term;
      const pieces = (cw?.assignments ?? []).filter((a) => a.term === term && a.shown).sort((x, y) => x.shown!.at - y.shown!.at);
      const last = pieces.at(-1);
      const w = last ? work.find((x) => x.at === last.shown!.at && x.what === templateById(last.template)!.title) : undefined;
      let prepReplay: Record<string, unknown> | undefined;
      if (w && w.ruleset === RULESET) {
        const profile = TASK_PROFILES[w.task]!;
        const same = replay(w, profile);
        const none = replay({ ...w, inputs: { ...w.inputs, prep: Object.fromEntries(Object.keys(w.inputs.prep).map((k) => [k, 0])) } }, profile);
        const full = replay({ ...w, inputs: { ...w.inputs, prep: Object.fromEntries(Object.entries(w.inputs.prep).map(([k, v]) => [k, Math.max(v, w.inputs.required[k] ?? 0.9)])) } }, profile);
        prepReplay = { piece: last!.id, kept: w.overall, again: same?.overall, none: none?.exact, full: full?.exact, exact: same?.exact };
      }
      rec.reviews.push({ term, at: day(sim.now), standing: h.standing, attendance: r2(h.attendance), growth: r2(h.growth), classGrowth: r2(h.classGrowth), coursework: h.coursework, reason: h.reason.slice(0, 700), tally: st.tally, prepReplay });
    }
    st.reviews = s.history.length;
  }
  if (s && s.tally) st.tally = { classDays: s.tally.classDays, attended: s.tally.attended, excused: s.tally.excused };
  if (s && s.standing !== st.standing) { rec.standings.push({ at: new Date(sim.now).toISOString().slice(0, 16), standing: s.standing }); st.standing = s.standing; }
  // Health: a new care, an injury, a stay, the flu.
  const h = healthOf(p);
  const care = h.careLog?.length ?? 0;
  const inj = injuryOf(p, sim.now);
  const ev: string[] = [];
  if (care > st.lastHealth.careLog) ev.push(...(h.careLog ?? []).slice(st.lastHealth.careLog).map((c) => `care ${(c as { care: string }).care}: ${(c as { what?: string }).what ?? ''}`));
  if (inj && inj.at !== st.lastHealth.injuryAt) ev.push(`injury ${inj.kind} ${Math.round((inj.until - inj.at) / MS_DAY)} days`);
  if ((h.inHospitalUntil ?? 0) !== (st.lastHealth.hospitalUntil ?? 0) && (h.inHospitalUntil ?? 0) > sim.now) ev.push(`in hospital to ${day(h.inHospitalUntil!)}`);
  if ((h.fluUntil ?? 0) !== (st.lastHealth.fluUntil ?? 0) && (h.fluUntil ?? 0) > sim.now) ev.push(`the flu to ${day(h.fluUntil!)}`);
  if (ev.length) rec.health.push({ at: new Date(sim.now).toISOString().slice(0, 16), events: ev, before: prev, after: { condition: r1(p.wellbeing.condition), fitness: r2(p.wellbeing.fitness), energy: r1(p.wellbeing.energy) } });
  st.lastHealth = { careLog: care, ...(inj ? { injuryAt: inj.at } : st.lastHealth.injuryAt !== undefined ? { injuryAt: st.lastHealth.injuryAt } : {}), ...(h.inHospitalUntil !== undefined ? { hospitalUntil: h.inHospitalUntil } : {}), ...(h.fluUntil !== undefined ? { fluUntil: h.fluUntil } : {}) };
}

/** The month's look: standing, abilities, money, papers and the refusals they govern, the ledger. */
export function monthly(sim: Simulation, rec: Rec, st: PolicyState): void {
  const p = sim.player;
  const banks = banksFor(homeOf(p));
  const asked = banks.map((b) => ({ bank: b.name, no: openRefusal(sim, p, b.id) })).find((x) => !x.no?.startsWith('You already keep'));
  const docs = documentsOf(p).map((d) => ({ kind: d.kind, name: d.name, status: d.status, to: d.expiresAt ? day(d.expiresAt) : undefined, inForce: inForce(d, sim.now) }));
  // Completed stays completed: a document issued never pending again, a course's result never unset, credits never fewer.
  const undone: string[] = [];
  for (const d of documentsOf(p)) { if (st.docs[d.id] && st.docs[d.id] !== 'pending' && d.status === 'pending') undone.push(`document ${d.name} pending again`); st.docs[d.id] = d.status; }
  for (const [k, r] of Object.entries(p.school?.courses ?? {})) { if (st.courses[k] && r.result === undefined) undone.push(`course ${k} unsettled`); if (st.courses[k] && r.result && r.result !== st.courses[k] && !(st.courses[k] === 'incomplete')) undone.push(`course ${k} ${st.courses[k]} to ${r.result}`); if (r.result) st.courses[k] = r.result; }
  const credits = p.school?.credits?.length ?? 0;
  if (credits < st.credits) undone.push(`credits ${st.credits} to ${credits}`);
  st.credits = credits;
  for (const id of st.shown) { const a = courseworkOf(sim, p)?.assignments.find((x) => x.id === id); if (a && !a.shown) undone.push(`piece ${id} unshown`); }
  rec.monthly.push({
    on: day(sim.now), standing: p.school?.standing, termsBegun: p.school?.termsBegun,
    abilities: Object.fromEntries(ABILITY_DEFS.map((d) => [d.id, r1(abilityOf(sim, p, d.id))])),
    genresKnown: Object.entries(p.engagement?.byGenre ?? {}).filter(([, g]) => Math.max(g?.familiarity ?? 0, g?.practice ?? 0) > 0).length,
    bank: Math.round(inTheBank(sim, p) / 100), yaleOwed: accountOwed(sim, p), hold: p.school?.hold !== undefined, mustRegister: Boolean(p.school?.mustRegister),
    docs, photoId: Boolean(photoIdOf(p, sim.now)), bankAsk: asked ? `${asked.bank}: ${asked.no ?? 'would open'}` : 'no bank to ask',
    opt: optRefusal(sim, p) ?? 'open', workAuthorized: usWorkAuthorized(p, sim.now), outOfStatus: p.usOutOfStatus !== undefined, cover: coverOn(p, sim.now) ?? 'none',
    audit: sim.ledger.audit().length, breaches: breaches(sim.universe).length, undone,
  });
  void st;
}

export function weeklyAdvice(sim: Simulation, rec: Rec): void {
  const recs = adviceFor(sim, sim.player);
  const first = recs.find((r) => r.forecast) ?? recs[0];
  rec.advice.push({
    day: day(sim.now), ...(first ? { target: first.target, level: r2(levelOf(sim, sim.player, first.target.includes(':') ? 'focus' : first.target as never)), forecast: first.forecast ? r2(first.forecast.exact ?? first.forecast.points) : undefined, standing: first.standing?.slice(0, 300), next: first.next?.slice(0, 300), attention: first.attention?.slice(0, 300), why: first.why.slice(0, 200) } : {}),
    full: recs[0]?.target === 'all-full' || /full/i.test(recs[0]?.label ?? '') && recs[0]?.exercise === undefined,
    recs: recs.slice(0, 5).map((r) => `${r.target}${r.forecast ? ` ${r2(r.forecast.exact ?? r.forecast.points)}` : ''}`),
  });
}

/** The day's own play beside the hour's: papers kept, the meetings slept through, the repeat, the hold, the leave, the TEST SETUP. */
export function dailyActs(spec: Spec, sim: Simulation, rec: Rec, st: PolicyState): void {
  const p = sim.player;
  const s = p.school;
  if (spec.papers) {
    const pass = passportOf(p, sim.now);
    if (pass?.expiresAt !== undefined && pass.expiresAt - sim.now < 183 * MS_DAY && !documentsOf(p).some((d) => d.kind === 'passport' && d.status === 'pending') && !passportRefusal(p)) sim.execute({ kind: 'documents.apply_passport', payload: {} });
    if (!citizenOf(p, 'US') && !optRefusal(sim, p)) sim.execute({ kind: 'documents.apply_opt', payload: {} });
  }
  // Registration asked again, where nothing holds it (a leave's return, a term begun under a hold since paid).
  if (s?.mustRegister && s.hold === undefined && !(s.leave && s.leave.status === 'on')) sim.execute({ kind: 'school.reregister', payload: {} });
  if (spec.repeats && s) {
    if (!repeatRefusal(sim, p) && !(s.repeatedYears ?? []).length) sim.execute({ kind: 'school.request_repeat', payload: {} });
    if (!aidReviewRefusal(sim, p)) sim.execute({ kind: 'school.request_aid_review', payload: {} });
    if (s.hold !== undefined && accountOwed(sim, p) > 0) sim.execute({ kind: 'school.pay_balance', payload: {} });
  } else if (s && s.hold !== undefined && accountOwed(sim, p) > 0) sim.execute({ kind: 'school.pay_balance', payload: {} });
  if (spec.adverse === 'stays') {
    if (s && !st.struck.includes('stays') && sim.now >= on(2026, 10, 20, 9)) {
      // TEST SETUP: two stays in hospital in the last four weeks, and the student in a third for six weeks (`tools/scenarios.ts mandatory`).
      const h = healthOf(p);
      h.careLog = [...(h.careLog ?? []), { at: sim.now - 12 * MS_DAY, care: 'stay', what: 'A stay', share: 0 }, { at: sim.now - 2 * MS_DAY, care: 'stay', what: 'A stay', share: 0 }] as never;
      h.inHospitalUntil = sim.now + 42 * MS_DAY;
      st.struck.push('stays');
      rec.acts.push(`${day(sim.now)} TEST SETUP: two stays recorded, in hospital to ${day(h.inHospitalUntil)}`);
    }
    if (s?.leave?.status === 'on' && !s.leave.noticeAt) sim.execute({ kind: 'school.return_notice', payload: {} });
  }
  if (spec.focused === 'passport' && !st.struck.includes('passport')) {
    // TEST SETUP: the passport runs out on 1 October 2026; the visa is left as issued.
    const pass = documentsOf(p).find((d) => d.kind === 'passport');
    if (pass) { pass.expiresAt = on(2026, 10, 1); st.struck.push('passport'); rec.acts.push(`${day(sim.now)} TEST SETUP: the passport's expiry set to 2026-10-01`); }
  }
  if (spec.focused === 'plan-unpaid') {
    if (!st.struck.includes('emptied') && sim.now >= on(2027, 1, 3, 9)) {
      // TEST SETUP: the checking emptied the day before the spring term.
      for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === p.id && a.kind === 'checking' && a.balance > 0) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] });
      st.struck.push('emptied');
      rec.acts.push(`${day(sim.now)} TEST SETUP: the checking emptied`);
    }
    if (!st.struck.includes('gift') && sim.now >= on(2027, 1, 11, 9)) {
      sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: p.primaryAccountId!, amount: 3_000_00 }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -3_000_00 }] });
      st.struck.push('gift');
      rec.acts.push(`${day(sim.now)} TEST SETUP: $3,000 from family`);
    }
  }
}

/** The flu on 15 October and 15 February and a fall on 1 March, through the game's own care (`tools/lives.ts`'s pressure). */
export function adverse(sim: Simulation, rec: Rec, st: PolicyState): void {
  const p = zonedParts(sim.now, sim.zone);
  const key = (m: number, d: number) => (p.month === m && p.day >= d) || (p.month === m + 1 && p.day < d) ? `${p.year}-${m}` : undefined;
  const w = sim.player.wellbeing;
  const before = { condition: r1(w.condition), fitness: r2(w.fitness), energy: r1(w.energy) };
  const flu = key(10, 15) ?? key(2, 15);
  if (flu && !st.struck.includes(`flu ${flu}`)) {
    st.struck.push(`flu ${flu}`);
    careFor(sim, sim.player, { care: 'visit', what: 'The flu', flu: true }, sim.now);
    rec.health.push({ at: new Date(sim.now).toISOString().slice(0, 16), events: [`TEST SETUP: the flu (${CARE.fluDays} days)`], before, after: { condition: r1(w.condition), fitness: r2(w.fitness), energy: r1(w.energy) } });
  }
  const hurt = key(3, 1);
  if (hurt && !st.struck.includes(`hurt ${hurt}`)) {
    st.struck.push(`hurt ${hurt}`);
    const i = mayHurt(sim, sim.player, 'fall', 1, sim.now);
    rec.health.push({ at: new Date(sim.now).toISOString().slice(0, 16), events: [`TEST SETUP: a fall: ${i ? `${i.kind}, ${Math.round((i.until - i.at) / MS_DAY)} days` : 'already hurt'}`], before, after: { condition: r1(w.condition), fitness: r2(w.fitness), energy: r1(w.energy) } });
  }
}

/** The night before a meeting to sleep through: twelve hours from eleven, so the nine o'clock classes go by. */
export function skipTonight(spec: Spec, sim: Simulation, st: PolicyState): boolean {
  if (!spec.skip || st.skipped.length >= spec.skip.times) return false;
  const tomorrow = dateOf(sim.now + 3 * MS_HOUR);
  const period = classPeriod(spec.skip.term);
  if (keyOf(tomorrow) < keyOf(period.from) || keyOf(tomorrow) > keyOf(period.to)) return false;
  const school = sim.player.school;
  if (!coursesOn(tomorrow, school?.offset ?? 0).some((c) => c.code === spec.skip!.code)) return false;
  // As tests/remaining-school.test.ts's `sleepThrough`: not a day with a piece due, nor a call.
  if ((courseworkOf(sim, sim.player)?.assignments ?? []).some((a) => a.course === spec.skip!.code && (a.status === 'open' || a.status === 'revising') && (a.status === 'revising' ? a.revision!.dueOn : a.dueOn) === keyOf(tomorrow))) return false;
  const from = on(tomorrow.year, tomorrow.month, tomorrow.day, 0), to = from + MS_DAY;
  if (sim.universe.scheduled.some((i) => i.status === 'pending' && i.requiresPlayer && i.kind !== 'school.classes' && i.at >= from && i.at < to)) return false;
  const r = sim.execute({ kind: 'life.sleep', payload: { hours: 12 } });
  if (r.ok) st.skipped.push(keyOf(tomorrow));
  return r.ok;
}

function playPart(spec: Spec, part: number, stateDir: string, out: string): Rec {
  const started = performance.now(); // the tool's own running time, not the game's
  mkdirSync(stateDir, { recursive: true });
  const savePath = join(stateDir, `${spec.id}.save`);
  const statePath = join(stateDir, `${spec.id}.state.json`);
  let sim: Simulation;
  let rec: Rec;
  let st: PolicyState;
  if (part === 1) {
    sim = make(spec);
    rec = fresh(spec);
    st = freshPolicy();
    const read = creationRead(sim);
    rec.creation = read;
    rec.counterfactual = counterfactual(spec, read);
    if (spec.setup) rec.setup = applySetup(sim, spec.setup);
    st.lastReload = sim.now;
  } else {
    if (!existsSync(savePath)) throw new Error(`No save for ${spec.id} in ${stateDir}: run part ${part - 1} first.`);
    const saved = readFileSync(savePath, 'utf8');
    sim = loadSave(deserialise(saved) as never);
    // Opening the save at the part's start is a reload like any other: the state after must be the state before.
    const again = serialise(sim.universe);
    ({ rec, st } = JSON.parse(readFileSync(statePath, 'utf8')) as { rec: Rec; st: PolicyState });
    rec.reloads.push({ at: new Date(sim.now).toISOString().slice(0, 16), same: again === saved, bytes: saved.length, ...(again === saved ? {} : { diff: firstDiff(saved, again) }) });
  }
  POLICY.ownWork = true; POLICY.workNotes = true; POLICY.partnerPart = true;
  instrument(sim, rec);
  // `--to <yyyy-mm-dd>` stops the part early (for developing the harness on dev-0).
  const partEnd = arg('to') ? on(Number(arg('to').slice(0, 4)), Number(arg('to').slice(5, 7)), Number(arg('to').slice(8, 10))) : PART_ENDS[part - 1]!;
  const from = sim.now;
  let reloads = 0;
  let endAt: number | undefined = sim.player.school?.endedAt;
  const finalEnd = () => (endAt !== undefined ? Math.min(endAt + 75 * MS_DAY, PART_ENDS[3]!) : PART_ENDS[3]!);
  let prev = { condition: r1(sim.player.wellbeing.condition), fitness: r2(sim.player.wellbeing.fitness), energy: r1(sim.player.wellbeing.energy) };
  const neglecting = () => spec.player === 'neglect' || (spec.until !== undefined && !st.switched);
  try {
    while (sim.now < Math.min(partEnd, finalEnd()) && sim.universe.meta.endedAt === undefined) {
      scan(sim, rec, st, prev);
      const w = sim.player.wellbeing;
      prev = { condition: r1(w.condition), fitness: r2(w.fitness), energy: r1(w.energy) };
      if (spec.until && !st.switched && rec.notices.some((n) => n[2] === spec.until)) { st.switched = true; rec.acts.push(`${day(sim.now)} keeps up from now (${spec.until})`); }
      if (sim.player.school?.endedAt !== undefined && endAt === undefined) endAt = sim.player.school.endedAt;
      const p = zonedParts(sim.now, sim.zone);
      const today = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
      const awake = (sim.player.awakeSince ?? 0) <= sim.now;
      if (spec.adverse === 'flu-injury') adverse(sim, rec, st);
      if (p.hour >= 9 && today !== st.lastDay && awake) {
        st.lastDay = today;
        const h = healthOf(sim.player);
        rec.daily.push([today, r1(w.energy), r2(w.fitness), r1(w.condition), Math.round(w.stress), (h.fluUntil ?? 0) > sim.now ? 1 : 0, injuryOf(sim.player, sim.now) ? 1 : 0, inHospital(sim.player, sim.now) ? 1 : 0]);
        dailyActs(spec, sim, rec, st);
        if (today.slice(0, 7) !== st.lastMonth) { st.lastMonth = today.slice(0, 7); monthly(sim, rec, st); }
        const n = Math.floor((sim.now - on(2026, 8, 24)) / MS_DAY);
        if (n - st.lastAdviceDay >= 7) { st.lastAdviceDay = n; weeklyAdvice(sim, rec); }
      }
      // Called in sick before the day's classes, ill on a day with something at school.
      if (spec.sickCalls && awake && p.hour >= 6 && p.hour < 9 && !sickRefusal(sim, sim.player)) sim.execute({ kind: 'school.call_in_sick', payload: {} });
      const weekend = [0, 6].includes(new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay());
      lookAfter(sim);
      if (p.hour === 12) keepCovered(sim);
      if (!neglecting()) {
        if (p.hour === 20 && sim.player.currentLocationId === 'us-ct-newhaven') {
          for (const a of courseworkOf(sim, sim.player)?.assignments ?? []) if ((a.status === 'open') && a.sceneId && templateById(a.template)?.material !== 'none' && !a.playing && !st.considered.includes(a.id) && Object.values(a.prep).every((v) => v === 0)) choosePlaying(sim, rec, st, a, Boolean(spec.playing));
          evening(sim);
        }
        if (p.hour >= (weekend ? 10 : 15) && p.hour < 22 && freeHour(sim)) continue;
        if (spec.player !== 'attentive' && p.hour >= (weekend ? 10 : 15) && p.hour < 22 && practiceFor(spec, sim)) continue;
      }
      if (p.hour === 23 && awake && skipTonight(spec, sim, st)) continue;
      if ((p.hour >= 23 || p.hour < 5) && awake) {
        const r = sim.execute({ kind: 'life.sleep', payload: { hours: suggestedSleep(sim).hours } });
        if (r.ok) continue;
      }
      sim.advanceTo(sim.now + MS_HOUR);
      if (sim.now - st.lastReload >= 30 * MS_DAY && zonedParts(sim.now, sim.zone).hour === 12) {
        sim = reload(sim, rec);
        instrument(sim, rec);
        reloads += 1;
        st.lastReload = sim.now;
      }
    }
  } catch (e) {
    rec.end = { ...(rec.end ?? {}), error: String((e as Error).stack ?? e).slice(0, 800) };
  }
  scan(sim, rec, st, prev);
  const done = sim.now >= finalEnd() || sim.universe.meta.endedAt !== undefined || part === 4;
  rec.parts.push({ part, from: day(from), to: day(sim.now), secs: Math.round((performance.now() - started) / 1000), reloads });
  if (done) { rec.end = { ...(rec.end ?? {}), ...finish(sim, rec) }; rec.checks = checks(spec, sim, rec); rec.continuity = continuity(rec); }
  const saved = serialise(sim.universe);
  writeFileSync(savePath, saved);
  writeFileSync(statePath, JSON.stringify({ rec, st }));
  writeFileSync(out, `${JSON.stringify(done ? compact(rec) : partSummary(rec), null, 1)}\n`);
  return rec;
}

/** A part's output while the journey goes on: what it played and what it counted. The whole record is in `--state`. */
function partSummary(rec: Rec) {
  const part = rec.parts.at(-1)!;
  return { id: rec.id, ...part, done: false, standing: rec.standings.at(-1)?.standing, reloads: rec.reloads.length, notSame: rec.reloads.filter((r) => !r.same).length, notices: rec.notices.length, showings: rec.showings.length, work: rec.work.length, reviews: rec.reviews.map((r) => `${r.term} ${r.at} ${r.standing}`) };
}

const KEPT_WORDS = /Begins$|Coursework|Concern|Warning|Dismiss|Degree|Commencement|Graduat|Not Passed|Not Registered|Missed Classes|Hold|Repeat|Aid|Tuition|Leave|Return|Status|OPT|Issued|Passport|Plan|Owed|Cover|Enrolled|Incomplete|Called In Sick|Hospital|Injur|Flu/;

/** A finished journey's output: the checks, the continuity record, the end, and compact traces of what the checks read. */
export function compact(rec: Rec) {
  const shown = /^Shown: /;
  return {
    id: rec.id, seed: rec.seed, profile: rec.profile, player: rec.player, expect: rec.expect, done: true, parts: rec.parts,
    creation: rec.creation, counterfactual: rec.counterfactual, setup: rec.setup, end: rec.end, checks: rec.checks, continuity: rec.continuity,
    standings: rec.standings, reviews: rec.reviews, acts: rec.acts, health: rec.health, interpretations: rec.interpretations.slice(0, 12), interpretationsSeen: rec.interpretations.length,
    reloads: { n: rec.reloads.length, notSame: rec.reloads.filter((r) => !r.same) },
    ledger: { n: rec.ledger.length, bad: rec.ledger.filter((l) => l.audit || l.breaches) },
    // The notices the checks read, with the start of their words; the rest by day and title.
    notices: rec.notices.filter((n) => !shown.test(n[2])).map((n) => (KEPT_WORDS.test(n[2]) ? [n[0], n[2], n[3].slice(0, 220)] : [n[0], n[2]])),
    shownNotices: rec.notices.filter((n) => shown.test(n[2])).length,
    showings: (rec.showings as { id: string; term: number; course: string; template: string; band: string; score: number; short: string[]; feedback?: { kind?: string; focus: string }; playing?: unknown }[]).map((x) => [x.id, x.term, x.course, x.template, x.band, x.score, x.short.length, x.feedback?.kind ?? '', x.feedback?.focus ?? '', x.playing ? 1 : 0]),
    workByTerm: Object.entries(rec.work.reduce((o, w) => { const k = `${w.at.slice(0, 4)} ${Number(w.at.slice(5, 7)) < 7 ? 'spring' : 'fall'} ${w.task}`; const b = (o[k] ??= { n: 0, sum: 0, ill: 0, mastery: 0 }); b.n += 1; b.sum += w.overall; if (w.ill || w.hurt) b.ill += 1; if (w.mastery) b.mastery += 1; return o; }, {} as Record<string, { n: number; sum: number; ill: number; mastery: number }>)).map(([k, v]) => `${k}: ${v.n} @ ${r1(v.sum / v.n)}${v.ill ? `, ${v.ill} ill or hurt` : ''}${v.mastery ? `, ${v.mastery} at mastery` : ''}`),
    advice: rec.advice.map((a) => [a.day, a.target ?? '', a.level ?? null, a.forecast ?? null, a.standing ? 1 : 0, a.recs.join(' ')]),
    monthly: (rec.monthly as Record<string, unknown>[]).map((m) => ({ ...m, docs: (m.docs as { kind: string; status: string; to?: string; inForce: boolean }[]).map((d) => `${d.kind} ${d.status}${d.to ? ` to ${d.to}` : ''}${d.inForce ? '' : ' (not in force)'}`) })),
    practice: rec.practice, commands: rec.commands,
  };
}

export function firstDiff(a: string, b: string): string {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i += 1;
  return `at ${i}: ${JSON.stringify(a.slice(Math.max(0, i - 80), i + 80))} against ${JSON.stringify(b.slice(Math.max(0, i - 80), i + 80))}`;
}

/** Saved and opened, as a player between sessions: the state after must be the state before, and the kept results replay. */
export function reload(sim: Simulation, rec: Rec): Simulation {
  const before = serialise(sim.universe);
  const next = loadSave(deserialise(before) as never);
  const after = serialise(next.universe);
  rec.reloads.push({ at: new Date(next.now).toISOString().slice(0, 16), same: before === after, bytes: before.length, ...(before === after ? {} : { diff: firstDiff(before, after) }) });
  rec.ledger.push({ at: day(next.now), audit: next.ledger.audit().length, breaches: breaches(next.universe).length });
  return next;
}

// ---------------------------------------------------------------------------
// The end, and the ten checks
// ---------------------------------------------------------------------------

export function finish(sim: Simulation, rec: Rec): Record<string, unknown> {
  const p = sim.player;
  const s = p.school;
  const work = p.work ?? [];
  // Check 3's influence: the last twelve pieces judged again at the levels the journey began with, and at their own.
  const start = (rec.setup?.abilities ?? rec.creation?.abilities) as Record<string, number> | undefined;
  const startTech = (rec.setup?.techniques ?? undefined) as Record<string, number> | undefined;
  const replays = work.filter((w) => w.ruleset === RULESET && w.inputs.seed !== undefined && TASK_PROFILES[w.task]).slice(-12).map((w) => {
    const own = frozenPerformer(w.inputs);
    // What the rises did: each ability that rose since the start put back to where it began, the rest as they were.
    // And apart, what the falls did (stamina unworked, `settleTheBody`): each that fell put back up.
    const rose = Object.keys(w.inputs.abilities).filter((id) => (w.inputs.abilities[id as AbilityId] ?? 0) > (start?.[id] ?? 0) + 0.05) as AbilityId[];
    const fell = Object.keys(w.inputs.abilities).filter((id) => (w.inputs.abilities[id as AbilityId] ?? 0) < (start?.[id] ?? 0) - 0.05) as AbilityId[];
    const back = (ids: AbilityId[], tech: boolean): Performer => ({ ability: (id) => (ids.includes(id) ? start![id]! : own.ability(id)), full: (id) => own.full(id), technique: (k) => (tech && startTech?.[k] !== undefined && startTech[k]! < own.technique(k) ? startTech[k]! : own.technique(k)) });
    const a = replayAs(w, TASK_PROFILES[w.task]!, own)?.exact, b = replayAs(w, TASK_PROFILES[w.task]!, back(rose, true))?.exact, c = fell.length ? replayAs(w, TASK_PROFILES[w.task]!, back(fell, false))?.exact : undefined;
    return { what: w.what, own: a !== undefined ? r2(a) : undefined, atStart: b !== undefined ? r2(b) : undefined, rose, ...(fell.length ? { fell, fallsUndone: c !== undefined ? r2(c) : undefined } : {}) };
  });
  // Every kept result replayed from its own inputs (check 10: historical results).
  let kept = 0, mismatched = 0;
  for (const w of work) { if (w.ruleset !== RULESET || !w.inputs.levels) continue; const again = replay(w, TASK_PROFILES[w.task]!); if (!again) continue; kept += 1; if (again.overall !== w.overall) mismatched += 1; }
  const genres = Object.entries(p.engagement?.byGenre ?? {}).map(([g, x]) => ({ g, f: r1(x?.familiarity ?? 0), practice: r1(x?.practice ?? 0) })).filter((x) => x.f > 0 || x.practice > 0).sort((a, b) => Math.max(b.f, b.practice) - Math.max(a.f, a.practice));
  const known = genres[0]?.g;
  // An unmet genre no genre they know is directly linked to (`relatedness`), which must read nothing: from brief 22
  // (2026-10-22), the owner's approved transfer lets a known broad genre reach its direct kinds, so the first unmet genre
  // alone, as this was until then, could read some (J18's absurdist, a kind of the comedy it had worked in, at 1.06).
  const unknownGenre = Object.keys(GENRE_DEFS).find((g) => !genres.some((x) => x.g === g) && !genres.some((x) => relatedness(x.g, g) > 0));
  // What of the school's is done or pending after its end (check 9).
  const ended = s?.endedAt;
  // Less what `setStanding` keeps on purpose: the class going on without them (`leaveClassBehind`), a classmate's moment's
  // own lapse, and a company's calls the class keeps (J15's first finish counted the class's own next term).
  const keptOn = (i: { kind: string; payload: Record<string, unknown> }) => i.kind === 'school.former_class' || i.kind === 'school.moment' || (i.kind === 'school.company' && i.payload.classOf !== undefined);
  const after = ended === undefined ? [] : sim.universe.scheduled.filter((i) => i.kind.startsWith('school.') && !keptOn(i) && i.at > ended + 60_000 && (i.status === 'done' || i.status === 'pending') && i.payload.personId === p.id).map((i) => `${day(i.at)} ${i.kind} ${i.status}`);
  // Each term's money by memo (check 6).
  const memos: Record<string, number> = {};
  for (const t of sim.universe.transactions) if (/^(Living-expense scholarship|Yale Health plan|Late fee|Yale account|Tuition|Payment to your Yale account)/i.test(t.memo)) memos[t.memo] = (memos[t.memo] ?? 0) + 1;
  return {
    on: day(sim.now), standing: s?.standing, endedAt: ended ? new Date(ended).toISOString().slice(0, 16) : undefined, classOf: s?.classOf,
    history: (s?.history ?? []).map((h) => `${h.term}:${h.standing}`), termsBegun: s?.termsBegun, enrolled: s?.enrolled,
    courses: Object.fromEntries(Object.entries(s?.courses ?? {}).filter(([, r]) => r.result && r.result !== 'pass').map(([k, r]) => [k, `${r.result}${r.why ? `: ${r.why}` : ''}`])),
    credits: (s?.credits ?? []).map((c) => `${c.year} ${c.kind} ${c.size ?? ''}`.trim()), parts: Object.fromEntries(Object.entries((s?.credits ?? []).reduce((o, c) => { o[c.size ?? 'unsized'] = (o[c.size ?? 'unsized'] ?? 0) + 1; return o; }, {} as Record<string, number>))),
    abilities: Object.fromEntries(ABILITY_DEFS.map((d) => [d.id, r1(abilityOf(sim, p, d.id))])), startAbilities: start,
    replays, keptReplayed: kept, keptMismatched: mismatched,
    genres: genres.slice(0, 8), genreSpeed: known ? { known, speed: r2(genreSpeed(p, [known])), unknown: unknownGenre, speedUnknown: unknownGenre ? r2(genreSpeed(p, [unknownGenre])) : undefined } : undefined,
    // The first limit on each piece judged short of mastery, by kind (J13 and J14's expectation reads it).
    firstLimits: rec.work.filter((w) => !w.mastery).reduce((o, w) => { const k = (w.limit ?? 'none').split(':')[0]!; o[k] = (o[k] ?? 0) + 1; return o; }, {} as Record<string, number>),
    afterEnd: after, memos, yaleOwed: accountOwed(sim, p), hold: s?.hold !== undefined, lateFees: s?.lateFees,
    bank: Math.round(inTheBank(sim, p) / 100), audit: sim.ledger.audit().length, breaches: breaches(sim.universe).length,
    outOfStatus: p.usOutOfStatus !== undefined ? day(p.usOutOfStatus) : undefined, cover: coverOn(p, sim.now) ?? 'none', documents: documentsOf(p).map((d) => `${d.kind} ${d.name} ${d.status}${d.expiresAt ? ` to ${day(d.expiresAt)}` : ''}`),
    standingLabel: s ? STANDING_LABEL[s.standing] : undefined,
  };
}

const messageOf = (x: Rec['advice'][number]) => `${x.why ?? ''} ${x.standing ?? ''} ${x.next ?? ''} ${x.attention ?? ''}`;
const has = (rec: Rec, title: string | RegExp) => rec.notices.filter((n) => (typeof title === 'string' ? n[2] === title : title.test(n[2])));

export function checks(spec: Spec, sim: Simulation, rec: Rec): Rec['checks'] {
  const out: NonNullable<Rec['checks']> = {};
  const put = (k: string, fails: string[], evidence: string[]) => { out[k] = { pass: fails.length === 0, evidence, fails }; };
  const e = rec.end as Record<string, unknown>;
  const p = sim.player;

  // 1. Creation.
  {
    const c = rec.creation as ReturnType<typeof creationRead>;
    const cf = rec.counterfactual as ReturnType<typeof counterfactual>;
    const fails: string[] = [];
    const wantNeed = !['wealthy', 'inherited'].includes(String(spec.config.wealth ?? 'wealthy'));
    if (c.need !== wantNeed) fails.push(`need ${c.need} for the ${spec.config.wealth} family`);
    const wantF1 = !spec.config.homeRegionId!.startsWith('us-');
    if (c.f1 !== wantF1) fails.push(`F-1 ${c.f1} for a home in ${spec.config.homeRegionId}`);
    if (Math.abs(c.discipline - (30 + 0.5 * (c.conscientiousness ?? 55))) > 0.11) fails.push(`discipline ${c.discipline} against conscientiousness ${c.conscientiousness}`);
    for (const [k, v] of Object.entries(cf)) if (!v.moved) fails.push(`${k} changed and nothing moved: ${JSON.stringify(v)}`);
    const sch = Object.keys((e.memos as Record<string, number>) ?? {}).filter((m) => m.startsWith('Living-expense scholarship')).length;
    const plan = Object.keys((e.memos as Record<string, number>) ?? {}).filter((m) => m.startsWith('Yale Health plan')).length;
    if (wantNeed && sch === 0) fails.push('need and no living-expense scholarship');
    if (!wantNeed && sch > 0) fails.push('no need and a living-expense scholarship');
    if (!wantNeed && plan === 0) fails.push('no need and no Yale Health plan paid from the bank');
    put('1 creation', fails, [`family ${c.family}, need ${c.need}, citizenship ${c.citizenship}, F-1 ${c.f1}, title ${c.title}, discipline ${c.discipline} (conscientiousness ${c.conscientiousness}), bank ${Math.round(c.bank / 100)}`, `counterfactual: ${Object.entries(cf).map(([k, v]) => `${k} ${v.moved ? 'moved' : 'did not move'}`).join(', ')}`, `scholarship memos ${sch}, plan memos ${plan}`]);
  }

  // 2. Classes, preparation, rehearsal, interpretation, showings.
  {
    const fails: string[] = [];
    const sh = rec.showings as { id: string; records: number; band: string; recordBand?: string; playing?: unknown; recordGrain: number; recordFit: number; answers: number; questions: number }[];
    for (const x of sh) { if (x.records !== 1) fails.push(`${x.id}: ${x.records} records at its showing`); else if (x.recordBand !== x.band && !(x.band === 'working' && ['strong', 'exceptional'].includes(String(x.recordBand)))) fails.push(`${x.id}: shown ${x.band}, recorded ${x.recordBand}`); }
    for (const x of sh.filter((y) => y.playing)) if (!x.recordGrain && !x.recordFit) fails.push(`${x.id}: a way of playing chosen and no fit or grain on its record`);
    const reps = rec.reviews.map((r) => r.prepReplay as { piece: string; kept: number; again?: number; none?: number; full?: number; exact?: number } | undefined).filter((x): x is NonNullable<typeof x> => Boolean(x));
    for (const r of reps) {
      if (r.again !== r.kept) fails.push(`${r.piece}: replayed ${r.again}, kept ${r.kept}`);
      if (r.none !== undefined && r.exact !== undefined && r.full !== undefined && !(r.none < r.exact - 1e-9 || r.full > r.exact + 1e-9)) fails.push(`${r.piece}: preparation unread (none ${r.none}, as shown ${r.exact}, complete ${r.full})`);
      if (r.full !== undefined && r.exact !== undefined && r.full < r.exact - 1e-9) fails.push(`${r.piece}: complete preparation lower than as shown`);
    }
    const classGrowth = rec.commands; void classGrowth;
    const tally = rec.reviews.map((r) => r.tally as Record<string, number> | undefined).filter(Boolean);
    const attended = tally.reduce((t, x) => t + (x!.attended ?? 0), 0);
    if (!attended && !spec.adverse) fails.push('no class day attended');
    const calls = sim.universe.scheduled.filter((i) => i.kind === 'school.call' && i.payload.personId === p.id);
    put('2 classes to showings', fails, [`${sh.length} showings, each with its record; ${sh.filter((x) => x.answers).length} with table work answered; ${sh.filter((x) => x.playing).length} with a way of playing`, `${reps.length} terms' last pieces judged again: ${reps.map((r) => `${r.none?.toFixed(1)} < ${r.exact?.toFixed(1)} ≤ ${r.full?.toFixed(1)}`).join('; ')}`, `class days attended over the reviews ${attended}; calls on the calendar kept ${calls.filter((i) => i.status === 'done').length}, missed ${calls.filter((i) => i.status === 'missed').length}`]);
  }

  // 3. Attributes and genres.
  {
    const fails: string[] = [];
    const reps = (e.replays as { what: string; own?: number; atStart?: number; rose: string[]; fell?: string[]; fallsUndone?: number }[]) ?? [];
    for (const r of reps) if (r.own !== undefined && r.atStart !== undefined && r.atStart > r.own + 1e-6) fails.push(`${r.what}: higher with its risen abilities put back to the start (${r.atStart}) than at its own (${r.own})`);
    if (spec.setup !== 'mastered' && reps.length && !reps.some((r) => r.own !== undefined && r.atStart !== undefined && r.own > r.atStart + 0.05)) fails.push('no recent piece better for the development since the start');
    const start = e.startAbilities as Record<string, number>; const end = e.abilities as Record<string, number>;
    const fell = Object.keys(end).filter((k) => end[k]! < (start?.[k] ?? 0) - 0.5);
    const unexplained = fell.filter((k) => k !== 'stamina');
    if (unexplained.length) fails.push(`fell for no recorded cause: ${unexplained.map((k) => `${k} ${start[k]} to ${end[k]}`).join(', ')}`);
    const gs = e.genreSpeed as { known: string; speed: number; unknown?: string; speedUnknown?: number } | undefined;
    if (gs && gs.speedUnknown !== undefined && !(gs.speed > gs.speedUnknown)) fails.push(`a known genre (${gs.known}) no faster than an unmet one (${gs.unknown})`);
    if (gs && gs.speedUnknown !== undefined && gs.speedUnknown !== 1) fails.push(`an unmet genre (${gs.unknown}) at ${gs.speedUnknown}, not 1`);
    put('3 development', fails, [`abilities ${Object.keys(end).map((k) => `${k} ${start?.[k]}→${end[k]}`).join(', ')}`, `last pieces at their own levels, then with what rose put back: ${reps.map((r) => `${r.own}/${r.atStart}`).join(' ')}`, `with what fell put back up: ${reps.filter((r) => r.fell).map((r) => `${r.own}→${r.fallsUndone} (${r.fell!.join(',')})`).join(' ') || 'nothing fell'}`, `first limits short of mastery: ${JSON.stringify(e.firstLimits)}`, `genres known ${(e.genres as unknown[]).length}; ${gs ? `${gs.known} speed ${gs.speed}, unmet ${gs.unknown} ${gs.speedUnknown}` : 'none'}`, ...(fell.length ? [`fell: ${fell.map((k) => `${k} ${start[k]}→${end[k]}`).join(', ')} (stamina falls unworked: \`settleTheBody\`)`] : [])]);
  }

  // 4. Advice.
  {
    const fails: string[] = [];
    const a = rec.advice;
    // Stale: the whole message (why, standing and next) the same week after week while what it shows moved: the level as
    // the screen rounds it, or the forecast to a tenth. A move under what's shown, with the same words, is the display's
    // precision, counted apart (`belowShown`).
    let start = 0, belowShown = 0;
    for (let i = 1; i <= a.length; i += 1) {
      const x = a[i], y = a[i - 1]!;
      if (x && x.target === y.target && messageOf(x) === messageOf(y)) continue;
      // A run of the same words, a[start..i-1]: stale where it's over four weeks and what it's about moved by what the
      // screen shows (a whole point of the level, a tenth of the forecast) across it.
      const run = a.slice(start, i);
      const span = (f: (z: Rec['advice'][number]) => number) => Math.max(...run.map(f)) - Math.min(...run.map(f));
      const levelSpan = span((z) => z.level ?? 0), forecastSpan = span((z) => z.forecast ?? 0);
      if (run.length > 4 && run[0]!.target && (levelSpan >= 1 || forecastSpan >= 0.1)) fails.push(`${run[0]!.day} to ${run.at(-1)!.day}: ${run[0]!.target} in the same words ${run.length} weeks while it moved ${r2(levelSpan)} (forecast ${r2(forecastSpan)})`);
      if (run.length > 1 && (levelSpan > 0 || forecastSpan > 0)) belowShown += run.length - 1;
      start = i;
    }
    const targets = new Set(a.map((x) => x.target).filter(Boolean));
    if (spec.player === 'follows' && spec.setup !== 'mastered' && targets.size < 2) fails.push(`a follower's first target never changed: ${[...targets].join(', ')}`);
    put('4 advice', fails, [`${a.length} weekly reads, ${targets.size} first targets: ${[...targets].join(', ')}`, `all full said in ${a.filter((x) => x.full).length} weeks`, `${belowShown} weeks the same words over a move under what's shown`, `standing said in ${a.filter((x) => x.standing).length} weeks (noted where the player practices or tapes)`, `circumstances: a condition named among the five in ${a.filter((x) => x.recs.some((r) => r.startsWith('condition:'))).length} weeks (${[...new Set(a.flatMap((x) => x.recs.filter((r) => r.startsWith('condition:')).map((r) => r.split(' ')[0])))].join(', ') || 'none'}), a preparation in ${a.filter((x) => x.recs.some((r) => r.startsWith('prep:'))).length}`]);
  }

  // 5. Health, stamina, energy.
  {
    const fails: string[] = [];
    const d = rec.daily;
    const de = d.slice(1).map((x, i) => x[1] - d[i]![1]); const df = d.slice(1).map((x, i) => x[2] - d[i]![2]);
    const corr = (xs: number[], ys: number[]) => { const n = xs.length; if (n < 3) return 0; const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n; let sxy = 0, sx = 0, sy = 0; for (let i = 0; i < n; i += 1) { sxy += (xs[i]! - mx) * (ys[i]! - my); sx += (xs[i]! - mx) ** 2; sy += (ys[i]! - my) ** 2; } return sx && sy ? sxy / Math.sqrt(sx * sy) : 0; };
    const r = corr(de, df);
    if (Math.abs(r) >= 0.9) fails.push(`energy's and stamina's daily changes correlate at ${r2(r)}`);
    const bigStep = df.map((x, i) => [x, d[i + 1]![0]] as const).filter(([x]) => Math.abs(x) > 3);
    if (bigStep.length && !spec.setup) fails.push(`stamina moved over 3 in a day: ${bigStep.slice(0, 3).map(([x, dd]) => `${dd} ${r2(x)}`).join(', ')}`);
    for (const h of rec.health as { at: string; events: string[]; before: { condition: number; fitness: number }; after: { condition: number; fitness: number } }[]) {
      const ill = h.events.some((x) => /flu|stay|emergency|urgent/.test(x));
      if (ill && h.events.some((x) => x.startsWith('TEST SETUP: the flu')) && !(h.after.condition < h.before.condition)) fails.push(`${h.at}: the flu and no toll on condition`);
      if (h.events.some((x) => x.startsWith('TEST SETUP')) && Math.abs(h.after.fitness - h.before.fitness) > 1e-6) fails.push(`${h.at}: a toll on stamina`);
    }
    const missedIll = rec.notices.filter((n) => n[2] === 'You Missed Classes' && d.some((x) => x[0] === n[0] && (x[7] === 1)));
    if (missedIll.length) fails.push(`unexcused while in hospital: ${missedIll.map((n) => n[0]).join(', ')}`);
    const called = new Set(rec.acts.filter((x) => x.includes('school.call_in_sick') && !x.includes('refused')).map((x) => x.slice(0, 10)));
    const missedCalled = rec.notices.filter((n) => n[2] === 'You Missed Classes' && called.has(n[0]));
    if (missedCalled.length) fails.push(`unexcused on a day called in sick: ${missedCalled.map((n) => n[0]).join(', ')}`);
    const illWork = rec.work.filter((w) => w.ill || w.hurt); const wellWork = rec.work.filter((w) => !w.ill && !w.hurt);
    const mean = (xs: { overall: number }[]) => xs.length ? r1(xs.reduce((t, x) => t + x.overall, 0) / xs.length) : undefined;
    put('5 health, stamina, energy', fails, [`daily changes of energy and stamina correlate at ${r2(r)} over ${d.length} mornings`, `health events ${rec.health.length}: ${(rec.health as { at: string; events: string[] }[]).slice(0, 8).map((h) => `${h.at.slice(0, 10)} ${h.events.join('; ')}`).join(' | ')}`, `called in sick ${called.size} days; work ill or hurt ${illWork.length} at ${mean(illWork)}, well ${wellWork.length} at ${mean(wellWork)}; excused class days by term ${rec.reviews.map((r) => (r.tally as Record<string, number> | undefined)?.excused ?? 0).join(',')}`]);
  }

  // 6. Money.
  {
    const fails: string[] = [];
    const bad = rec.ledger.filter((l) => l.audit || l.breaches);
    if (bad.length) fails.push(`unbalanced or breached at ${bad.map((l) => l.at).join(', ')}`);
    if (e.audit || e.breaches) fails.push(`at the end: audit ${e.audit}, breaches ${e.breaches}`);
    for (const [m, n] of Object.entries(e.memos as Record<string, number>)) if (n > 1 && /^(Living-expense scholarship|Yale Health plan)/.test(m)) fails.push(`${m} posted ${n} times`);
    for (const m of rec.monthly as { on: string; hold: boolean; yaleOwed: number }[]) { if (m.hold && m.yaleOwed <= 0) fails.push(`${m.on}: a hold over nothing owed`); }
    // A notice said again in the same words while unread is moved, not added (`Simulation.notify`): counted with its first.
    const said = (t: string) => has(rec, t).length + rec.saidAgain.filter((x) => x[1] === t).length;
    const holdNotices = said('A Financial Hold'), lifted = said('The Financial Hold Is Lifted');
    if (lifted > holdNotices) fails.push(`${lifted} holds lifted against ${holdNotices} put on`);
    put('6 money', fails, [`${rec.ledger.length} reloads with the ledger balanced and no breach; at the end audit ${e.audit}, breaches ${e.breaches}`, `memos: ${Object.entries(e.memos as Record<string, number>).map(([m, n]) => `${m.slice(0, 60)} ×${n}`).join('; ')}`, `holds ${holdNotices}, lifted ${lifted}; owed at the end ${e.yaleOwed}; bank ${e.bank}`]);
  }

  // 7. Papers.
  {
    const fails: string[] = [];
    for (const m of rec.monthly as { on: string; photoId: boolean; bankAsk: string; opt: string; standing?: string }[]) {
      const asksId = /photo ID/.test(m.bankAsk);
      const earlier = /already|reviewing|charged-off|ChexSystems|no bank/.test(m.bankAsk);
      if (m.photoId && asksId) fails.push(`${m.on}: the bank asks a photo ID with one in force`);
      if (!m.photoId && !asksId && !earlier) fails.push(`${m.on}: no photo ID in force and the bank doesn't ask (${m.bankAsk})`);
    }
    const citizen = !(rec.creation as { f1: boolean }).f1;
    const optWords = new Set((rec.monthly as { opt: string }[]).map((m) => m.opt.replace(/[A-Z][a-z]+ \d+, \d{4}/g, 'DATE')));
    if (citizen && [...optWords].some((w) => !w.includes('citizen'))) fails.push(`a citizen's OPT refusal: ${[...optWords].join(' | ')}`);
    const left = ['dismissed', 'withdrawn', 'withheld'].includes(String(e.standing));
    // The refusal's own words (`optRefusal`): "you left without one" from 2026-10-17 (brief 14), "you left without it" until then.
    if (!citizen && left && !(rec.monthly as { opt: string; standing?: string }[]).filter((m) => m.standing === e.standing).every((m) => m.opt.includes('you left without one'))) fails.push('OPT not refused after leaving without the degree');
    const applied = rec.acts.filter((x) => x.includes('documents.apply_opt') && !x.includes('refused'));
    const issued = has(rec, 'OPT Approved');
    if (applied.length && !issued.length && e.on && String(e.on) > '2029-08-01') fails.push('OPT applied for and never decided');
    const outs = has(rec, 'Out Of Status');
    // An OPT ended for more than 90 days without work (`OPT Ended`, `systems/permission.ts`) ends the status with it, no
    // grace after (from 2026-10-21, brief 20's journeys, which play nine months past the School: brief 13's ended 75 days
    // after it, before an OPT from 31 May could reach its 91st idle day, and this failed the first two that did).
    const optEnded = documentsOf(p).find((d) => d.kind === 'permit' && d.name.includes('OPT') && d.endedAt !== undefined)?.endedAt;
    if (outs.length && applied.length && issued.length && optEnded === undefined) fails.push('out of status with OPT approved');
    // The day an F-1 status ends, by the rules worked here apart from the engine (8 CFR 214.2(f)(5)(iv), as
    // `STATUS_GRACE_DAYS` cites it): the program's end and sixty days after the degree, which is the visa's own end, kept
    // to the program with any leave or year again; the day itself after a dismissal; fifteen days after a withdrawal or a
    // degree withheld; an OPT's end and sixty days where one was approved, or the day it ended for its days without work
    // (from 2026-10-21). Only where the journey ran past it.
    const f1 = documentsOf(p).find((d) => d.kind === 'visa' && d.name.startsWith('F-1'));
    const opt = documentsOf(p).find((d) => d.kind === 'permit' && d.name.includes('OPT') && d.expiresAt !== undefined && d.issuedAt !== undefined);
    const endedAt = p.school?.endedAt;
    if (f1 && endedAt !== undefined) {
      const std = p.school!.standing;
      const due = opt ? (opt.endedAt ?? opt.expiresAt! + 60 * MS_DAY) : std === 'graduated' ? f1.expiresAt! : std === 'dismissed' ? endedAt : endedAt + 15 * MS_DAY;
      const outAt = p.usOutOfStatus;
      if (sim.now > due + MS_DAY && (outAt === undefined || day(outAt) !== day(due))) fails.push(`F-1 status: by the rules out on ${day(due)}, the game ${outAt === undefined ? 'never' : `on ${day(outAt)}`}`);
      if (sim.now <= due && outAt !== undefined) fails.push(`F-1 status: out on ${day(outAt)}, before its end on ${day(due)}`);
    }
    // Each passport applied for is issued after it, or still pending at the end (read from the documents: an issue's notice
    // is titled with the passport's own name, "Pasaporte ordinario mexicano (tipo "N") Issued").
    const passports = rec.acts.filter((x) => x.includes('documents.apply_passport') && !x.includes('refused')).map((x) => x.slice(0, 10));
    const ownPassports = documentsOf(p).filter((d) => d.kind === 'passport');
    const issuedP = passports.filter((d) => ownPassports.some((x) => x.issuedAt !== undefined && day(x.issuedAt) >= d && x.status !== 'pending'));
    const pendingP = ownPassports.filter((x) => x.status === 'pending');
    if (passports.length > issuedP.length + pendingP.length) fails.push(`${passports.length} passports applied for, ${issuedP.length} issued, ${pendingP.length} pending`);
    const validPassports = documentsOf(p).filter((d) => d.kind === 'passport' && d.status === 'valid' && inForce(d, sim.now));
    if (validPassports.length > 1) fails.push(`${validPassports.length} passports valid at once`);
    put('7 papers', fails, [`photo ID in force ${(rec.monthly as { photoId: boolean }[]).filter((m) => m.photoId).length} of ${rec.monthly.length} months; the bank's asks: ${[...new Set((rec.monthly as { bankAsk: string }[]).map((m) => m.bankAsk.slice(0, 90)))].join(' | ')}`, `OPT: ${[...optWords].map((w) => w.slice(0, 90)).join(' | ')}; applied ${applied.length}, approved ${issued.length}; out of status ${outs.map((n) => n[0]).join(', ') || 'never'}`, `passports applied ${passports.length}, issued ${issuedP.length}, pending ${pendingP.length}; documents at the end: ${(e.documents as string[]).join('; ')}`]);
  }

  // 8. Warnings and the reviews that followed.
  {
    const fails: string[] = [];
    const words = has(rec, 'A Word On Your Coursework');
    const reviews = rec.reviews as { term: number; at: string; standing: string; coursework?: { shown: number; unready: number } }[];
    let prevStanding = 'good';
    for (const r of reviews) {
      const from = day(on(termStart(r.term).date.year, termStart(r.term).date.month, termStart(r.term).date.day));
      const warned = words.filter((n) => n[0] >= from && n[0] <= r.at);
      const cw = r.coursework;
      const forCoursework = cw && cw.shown >= 4 && cw.unready >= 0.5 * cw.shown;
      if (forCoursework && !warned.length) fails.push(`term ${r.term}: stepped for coursework (${cw!.unready} of ${cw!.shown}) with no warning in the term`);
      // A piece shown Unready before a warning and revised after it to a band above is counted Unready by the warning and
      // not by the review, which reads a revision's band (`termTally`): both are true when said. So the warning may
      // exceed the review by those pieces, and only by them (from 2026-10-20, brief 17's final journeys: F1's fourth
      // term, its Heightened Text Scene shown Unready on 2028-11-14, warned of with 12 others on the 17th, and revised to
      // Working on the 20th). Until then a warning above the review failed this whatever the revisions between.
      const lifted = (w: Rec['notices'][number]) => (courseworkOf(sim, p)?.assignments ?? []).filter((a) => a.term === r.term && a.shown && a.shown.band === 'unready' && day(a.shown.at) <= w[0]
        && a.revision && !a.revision.missed && a.revision.band && a.revision.band !== 'unready' && a.revision.dueOn > w[0]).length;
      for (const w of warned) { const m = /^So far this term, (\d+) of the (\d+)/.exec(w[3]); if (m && cw && Number(m[1]) > cw.unready + lifted(w)) fails.push(`term ${r.term}: the warning counted ${m[1]}, the review ${cw.unready}, with ${lifted(w)} revised above Unready after it`); }
      const rank = { good: 0, concern: 1, warning: 2, dismissed: 3 } as Record<string, number>;
      if (r.standing in rank && prevStanding in rank && rank[r.standing]! > rank[prevStanding]! + 1) fails.push(`term ${r.term}: ${prevStanding} to ${r.standing}, more than a step`);
      if (r.standing === 'dismissed' && prevStanding !== 'warning' && !has(rec, /Fails|Disqualif/).length) fails.push(`term ${r.term}: dismissed from ${prevStanding}`);
      prevStanding = r.standing;
    }
    // The cause a warning names is among the parts short on the pieces it counts.
    for (const w of words) {
      const m = /(?:The part most often left unfinished was “([^”]+)”, on|“([^”]+)” was left unfinished on the one)/.exec(w[3]);
      if (!m) continue;
      const label = (m[1] ?? m[2])!.toLowerCase();
      const shortLabels = new Set((rec.showings as { at: string; shortLabels: string[]; band: string }[]).filter((x) => x.at <= w[0] && x.band === 'unready').flatMap((x) => x.shortLabels.map((l) => String(l).toLowerCase())));
      if (!shortLabels.has(label)) fails.push(`${w[0]}: the warning names ${label}, short on none of the unready pieces`);
    }
    put('8 warnings', fails, [`coursework warnings ${words.map((n) => `${n[0]} "${n[3].slice(0, 110)}"`).join(' | ') || 'none'}`, `reviews ${reviews.map((r) => `${r.term} ${r.at} ${r.standing}${r.coursework ? ` (${r.coursework.unready}/${r.coursework.shown} unready)` : ''}`).join('; ')}`, `missed classes notices ${has(rec, 'You Missed Classes').length}, not registered ${has(rec, 'Not Registered').length}, not passed ${has(rec, /^Not Passed/).length}`]);
  }

  // 9. Terms and the endpoint.
  {
    const fails: string[] = [];
    const begins = rec.notices.filter((n) => / Term \d{4} Begins$/.test(n[2])).map((n) => n[2]);
    const dupBegins = begins.filter((b, i) => begins.indexOf(b) !== i);
    if (dupBegins.length) fails.push(`term begun twice: ${dupBegins.join(', ')}`);
    const terms = (rec.reviews as { term: number }[]).map((r) => r.term);
    if (terms.some((t, i) => i > 0 && t <= terms[i - 1]!)) fails.push(`reviews out of order or doubled: ${terms.join(',')}`);
    const st = rec.standings;
    const endIdx = st.findIndex((x) => ['graduated', 'dismissed', 'withdrawn', 'withheld'].includes(x.standing));
    if (endIdx >= 0 && endIdx < st.length - 1) fails.push(`the standing changed after the end: ${st.slice(endIdx).map((x) => `${x.at} ${x.standing}`).join(', ')}`);
    if (spec.expect.on && endIdx >= 0 && st[endIdx]!.standing === spec.expect.standing && st[endIdx]!.at.slice(0, 10) !== spec.expect.on) fails.push(`${st[endIdx]!.standing} on ${st[endIdx]!.at}, the rule's day ${spec.expect.on}`);
    if ((e.afterEnd as string[]).length) fails.push(`the school's after its end: ${(e.afterEnd as string[]).slice(0, 4).join('; ')}`);
    put('9 terms and the end', fails, [`terms begun ${begins.length}: ${begins.join(', ')}`, `reviews ${terms.join(',')}`, `standings ${st.map((x) => `${x.at.slice(0, 10)} ${x.standing}`).join(', ')}`]);
  }

  // 10. Save, exit, reload, continue.
  {
    const fails: string[] = [];
    const diff = rec.reloads.filter((r) => !r.same);
    if (diff.length) fails.push(`${diff.length} reloads not the same: ${diff[0]!.at} ${diff[0]!.diff?.slice(0, 300)}`);
    if (e.keptMismatched) fails.push(`${e.keptMismatched} kept results replay to another figure`);
    if ((rec.end as { error?: string }).error) fails.push(`thrown: ${(rec.end as { error?: string }).error}`);
    put('10 save and reload', fails, [`${rec.reloads.length} reloads (every thirty days and at each part), every one the same to the byte: ${diff.length === 0}`, `${e.keptReplayed} kept results replayed from their inputs, ${e.keptMismatched} different`]);
  }
  return out;
}

/** Continuity and freshness (section 6), from the record. */
export function continuity(rec: Rec): Record<string, unknown> {
  const undone = (rec.monthly as { on: string; undone: string[] }[]).flatMap((m) => m.undone.map((u) => `${m.on} ${u}`));
  // Said again, by title; and each title's count, once-per-term ones flagged where doubled within a term.
  const again: Record<string, number> = {};
  for (const [, t] of rec.saidAgain) again[t] = (again[t] ?? 0) + 1;
  const byTitle: Record<string, number> = {};
  for (const n of rec.notices) byTitle[n[2]] = (byTitle[n[2]] ?? 0) + 1;
  const strip = (s: string) => s.replace(/\$?[\d,]+(\.\d+)?%?/g, '#').replace(/(January|February|March|April|May|June|July|August|September|October|November|December) #/g, 'DATE').replace(/\s+/g, ' ');
  const sameWordsTwice = Object.entries(rec.notices.reduce((o, n) => { const k = `${n[2]} | ${n[3].slice(0, 300)}`; o[k] = (o[k] ?? 0) + 1; return o; }, {} as Record<string, number>)).filter(([, n]) => n > 1).map(([k, n]) => `${k.slice(0, 140)} ×${n}`);
  // Advice: runs of one target, how many weeks its words were new and its state new.
  const runs: { from: string; to: string; target: string; weeks: number; newWords: number; moved: number; stripped: number }[] = [];
  rec.advice.forEach((a, i) => {
    const last = runs.at(-1); const b = rec.advice[i - 1];
    if (last && b && last.target === a.target) {
      last.to = a.day; last.weeks += 1;
      if (messageOf(a) !== messageOf(b)) last.newWords += 1;
      if ((a.level ?? 0) !== (b.level ?? 0) || (a.forecast ?? 0) !== (b.forecast ?? 0)) last.moved += 1;
      if (strip(messageOf(a)) === strip(messageOf(b)) && messageOf(a) !== messageOf(b)) last.stripped += 1;
    } else runs.push({ from: a.day, to: a.day, target: a.target ?? 'none', weeks: 1, newWords: 0, moved: 0, stripped: 0 });
  });
  // Feedback given again on a part: is the part short there?
  const fb = rec.showings as { id: string; feedback?: { kind?: string; focus: string }; short: string[] }[];
  const recurring = fb.filter((x) => x.feedback?.kind === 'recurring');
  const recurringUnfounded = recurring.filter((x) => x.feedback!.focus.startsWith('dim:') && !x.short.includes(x.feedback!.focus.slice(4)));
  // Variety.
  const tally = (xs: string[]) => { const o: Record<string, number> = {}; for (const x of xs) o[x] = (o[x] ?? 0) + 1; return o; };
  const longestRun = (xs: string[]) => xs.reduce((a, x, i) => { const run = i > 0 && x === xs[i - 1] ? a.run + 1 : 1; return { run, best: Math.max(a.best, run), what: run > a.best ? x : a.what }; }, { run: 0, best: 0, what: '' });
  const templates = fb.map((x) => (x as unknown as { template: string }).template);
  const scenes = (rec.showings as { scene?: string }[]).map((x) => x.scene).filter((x): x is string => Boolean(x));
  const exercises = Object.values(rec.practice).flatMap((m) => Object.entries(m).flatMap(([k, n]) => Array(n).fill(k) as string[]));
  const notes = fb.map((x) => x.feedback?.focus ?? 'none');
  return {
    undone, saidAgain: again, sameWordsTwice: sameWordsTwice.slice(0, 20),
    onceATerm: Object.fromEntries(Object.entries(byTitle).filter(([t]) => /Begins$|^A Word On Your Coursework$|^A Notice Of Academic Concern$|^Academic Warning$|^Dismissed|^Commencement|^Cast:/.test(t))),
    // Within each term, from its start to its review: the coursework warning and the review's own notice at most once.
    twiceInATerm: (rec.reviews as { term: number; at: string }[]).flatMap((r) => {
      const d = termStart(r.term).date;
      const from = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
      const inTerm = (t: string) => rec.notices.filter((n) => n[2] === t && n[0] >= from && n[0] <= r.at).length + rec.saidAgain.filter((n) => n[1] === t && n[0] >= from && n[0] <= r.at).length;
      return ['A Word On Your Coursework', 'A Notice Of Academic Concern', 'Academic Warning'].filter((t) => inTerm(t) > 1).map((t) => `term ${r.term}: ${t} ${inTerm(t)} times`);
    }),
    advice: { weeks: rec.advice.length, targets: tally(rec.advice.map((a) => a.target ?? 'none')), longRuns: runs.filter((r) => r.weeks > 4), runs: runs.length, staleRuns: runs.filter((r) => r.weeks > 4 && r.moved > 0 && r.newWords < r.moved).length, wordsOnlyChanges: runs.reduce((t, r) => t + r.stripped, 0) },
    feedback: { notes: fb.filter((x) => x.feedback).length, recurring: recurring.length, recurringOnAPartNotShort: recurringUnfounded.map((x) => `${x.id} ${x.feedback!.focus}`), kinds: tally(fb.map((x) => x.feedback?.kind ?? 'none')), longestSameNote: longestRun(notes) },
    variety: { templates: Object.keys(tally(templates)).length, pieces: templates.length, longestSameTemplate: longestRun(templates), scenes: new Set(scenes).size, sceneShowings: scenes.length, scenesAgain: Object.entries(tally(scenes)).filter(([, n]) => n > 1).length, exercises: tally(exercises), longestSameExercise: longestRun(exercises).best },
    interpretations: rec.interpretations.length,
  };
}

// ---------------------------------------------------------------------------
// The table
// ---------------------------------------------------------------------------

function summarize(dir: string): void {
  const rows: Record<string, unknown>[] = [];
  for (const spec of JOURNEYS) {
    const parts = readdirSync(dir).filter((f) => f.startsWith(`${spec.id}-p`) && f.endsWith('.json')).sort();
    if (!parts.length) { rows.push({ id: spec.id, missing: true }); continue; }
    const rec = JSON.parse(readFileSync(join(dir, parts.at(-1)!), 'utf8')) as Rec & { done: boolean };
    const e = (rec.end ?? {}) as Record<string, unknown>;
    rows.push({
      id: spec.id, profile: spec.profile, seed: spec.seed, done: rec.done, played: `${rec.parts[0]?.from} to ${rec.parts.at(-1)?.to}`, secs: rec.parts.reduce((t, x) => t + x.secs, 0),
      expected: `${spec.expect.standing}${spec.expect.on ? ` ${spec.expect.on}` : ''}: ${spec.expect.note}`, actual: `${e.standing} ${rec.standings.find((x) => x.standing === e.standing)?.at.slice(0, 10) ?? ''} (${(e.history as string[] | undefined)?.join(' ')})`,
      checks: Object.fromEntries(Object.entries(rec.checks ?? {}).map(([k, v]) => [k, v.pass ? 'pass' : `FAIL: ${v.fails.slice(0, 3).join(' / ')}`])),
    });
  }
  writeFileSync(join(dir, 'summary.json'), `${JSON.stringify(rows, null, 1)}\n`);
  console.log(JSON.stringify(rows, null, 1));
}

/**
 * `--recheck`: the checks and the continuity record worked out again from a finished journey's record and save, nothing
 * played, for a change to the checks alone; the last part's output is written again with them.
 */
function recheck(spec: Spec, stateDir: string, out: string): void {
  const sim = loadSave(deserialise(readFileSync(join(stateDir, `${spec.id}.save`), 'utf8')) as never);
  const { rec, st } = JSON.parse(readFileSync(join(stateDir, `${spec.id}.state.json`), 'utf8')) as { rec: Rec; st: PolicyState };
  // The creation's counterfactual is made again too: it plays nothing, and reads only creation.
  rec.counterfactual = counterfactual(spec, rec.creation as ReturnType<typeof creationRead>);
  rec.end = { ...(rec.end?.error ? { error: rec.end.error } : {}), ...finish(sim, rec) };
  rec.checks = checks(spec, sim, rec);
  rec.continuity = continuity(rec);
  writeFileSync(join(stateDir, `${spec.id}.state.json`), JSON.stringify({ rec, st }));
  writeFileSync(out, `${JSON.stringify(compact(rec), null, 1)}\n`);
  // The parts before are left as they were written. Until brief 17 the recheck wrote them again as their own entries
  // alone, which made sense when a part's output repeated the whole record so far (before `9e005462`); after it a
  // part's output was already its summary, and writing it again only lost what it had counted at its end. Brief 17's
  // recheck of its final journeys lost those counts from 75 parts, and the journeys were played again to have them.
  console.log(JSON.stringify({ id: spec.id, rechecked: true, checks: Object.fromEntries(Object.entries(rec.checks!).map(([k, v]) => [k, v.pass ? 'pass' : v.fails.slice(0, 2)])) }));
}

/**
 * `--compare <state> --out <file>`: what the expectations compare across journeys (journeys-criteria.md, Expected Outcomes),
 * read from the finished saves.
 * - **The advice's three players** (J03 to J05, J06 to J08): each one seed and one creation, so only how the advice was
 *   taken differs. How far every ability the follower was advised first rose for each; how far the ignorer's favorite
 *   (the ability its most practiced exercise trains) rose for each; and the follower's last twelve pieces judged again
 *   without the draw at each player's final levels (`replayAs`).
 * - **The specialists against their generalists** (J11 against J09, J12 against J10): one seed and one budget. The fixed
 *   set of 24 (`tools/pieces.ts`, named in brief 10 before it was measured) judged at the setup's levels and at the final
 *   ones; each piece's difference split into what the specialist's strengths add (the generalist's levels with the
 *   strengths put in) and what its 49s cost (with the 49s put in), so a piece reads its strengths where the first is the
 *   larger, its weaknesses where the second is. And at the end, the strengths against the weaknesses, and the weeks the
 *   advice named each.
 */
function compare(stateDir: string, out: string): void {
  const open = (id: string) => ({ sim: loadSave(deserialise(readFileSync(join(stateDir, `${id}.save`), 'utf8')) as never), rec: (JSON.parse(readFileSync(join(stateDir, `${id}.state.json`), 'utf8')) as { rec: Rec }).rec });
  const frozen = (sim: Simulation): Performer => { const p = sim.player; const ab = Object.fromEntries(ABILITY_DEFS.map((d) => [d.id, abilityOf(sim, p, d.id)])); const fu = Object.fromEntries(ABILITY_DEFS.map((d) => [d.id, abilityFull(sim, p, d.id)])); const te = { ...p.craft! }; return { ability: (id) => ab[id] ?? 0, full: (id) => fu[id] ?? 100, technique: (k) => te[k] ?? 0 }; };
  const ids = ABILITY_DEFS.map((d) => d.id);
  const result: Record<string, unknown> = {};
  for (const [f, pt, ig] of [['J03', 'J04', 'J05'], ['J06', 'J07', 'J08']] as const) {
    const [F, P, I] = [open(f), open(pt), open(ig)];
    const start = F.rec.creation!.abilities as Record<string, number>;
    const rise = (x: typeof F) => Object.fromEntries(ids.map((id) => [id, r1(abilityOf(x.sim, x.sim.player, id) - start[id]!)]));
    const [rf, rp, ri] = [rise(F), rise(P), rise(I)];
    const named = [...new Set(F.rec.advice.map((a) => a.target).filter((t): t is string => Boolean(t) && ids.includes(t as AbilityId)))];
    const sum = (r: Record<string, number>) => r1(named.reduce((t, id) => t + r[id]!, 0));
    const practiced = Object.values(I.rec.practice).reduce((o, m) => { for (const [k, n] of Object.entries(m)) o[k] = (o[k] ?? 0) + n; return o; }, {} as Record<string, number>);
    const fav = Object.entries(practiced).sort((a, b) => b[1] - a[1])[0]?.[0];
    const favId = fav ? ids.find((id) => exerciseFor(id)?.id === fav) : undefined;
    const work = (F.sim.player.work ?? []).filter((w) => w.ruleset === RULESET && w.inputs.seed !== undefined && TASK_PROFILES[w.task]).slice(-12);
    const at = (perf: Performer) => r2(work.reduce((t, w) => t + (replayAs(w, TASK_PROFILES[w.task]!, perf)?.exact ?? 0), 0) / Math.max(1, work.length));
    result[`${f} ${pt} ${ig}`] = {
      advisedToTheFollower: named, risesOfTheAdvised: { follows: sum(rf), partly: sum(rp), ignores: sum(ri) }, byInput: Object.fromEntries(named.map((id) => [id, { follows: rf[id], partly: rp[id], ignores: ri[id] }])),
      ignorersFavorite: favId ? { ability: favId, exercise: fav, sessions: practiced[fav!], follows: rf[favId], partly: rp[favId], ignores: ri[favId] } : undefined,
      followersLastTwelve: { pieces: work.length, atFollowers: at(frozen(F.sim)), atPartlys: at(frozen(P.sim)), atIgnorers: at(frozen(I.sim)) },
      outcome: [F, P, I].map((x) => x.sim.player.school?.standing),
    };
  }
  const STRENGTHS: Record<string, AbilityId[]> = { feeling: ['emotionalDepth', 'composure', 'imagination', 'presence'], body: ['vocal', 'physical', 'memory', 'presence'] };
  const pieces = fixedPieces();
  for (const [g, sp] of [['J09', 'J11'], ['J10', 'J12']] as const) {
    const [G, S] = [open(g), open(sp)];
    const kind = S.rec.setup!.setup as string;
    const strong = STRENGTHS[kind]!;
    const weak = ids.filter((id) => id !== 'stamina' && !strong.includes(id));
    const fromSetup = (rec: Rec): Performer => { const ab = rec.setup!.abilities as Record<string, number>; const te = rec.setup!.techniques as Record<string, number>; return { ability: (id) => ab[id] ?? 0, full: (id) => (id === 'stamina' ? Math.max(100, ab.stamina ?? 100) : 100), technique: (k) => te[k] ?? 0 }; };
    const mix = (base: Performer, from: Performer, put: AbilityId[]): Performer => ({ ability: (id) => (put.includes(id) ? from.ability(id) : base.ability(id)), full: base.full, technique: base.technique });
    const judgeAll = (gp: Performer, spp: Performer) => pieces.map((pc) => {
      const gv = pc.judge(gp).exact!, sv = pc.judge(spp).exact!;
      const addStrong = pc.judge(mix(gp, spp, strong)).exact! - gv, costWeak = pc.judge(mix(gp, spp, weak)).exact! - gv;
      const reads = addStrong > -costWeak ? 'strengths' : 'weaknesses';
      return { piece: `${pc.kind}:${pc.id}`, generalist: r2(gv), specialist: r2(sv), strengthsAdd: r2(addStrong), weaknessesCost: r2(costWeak), reads, asExpected: reads === 'strengths' ? sv > gv : sv < gv };
    });
    const atStart = judgeAll(fromSetup(G.rec), fromSetup(S.rec));
    const atEnd = judgeAll(frozen(G.sim), frozen(S.sim));
    const endLevels = Object.fromEntries(ids.map((id) => [id, r1(abilityOf(S.sim, S.sim.player, id))]));
    const weeks = (list: AbilityId[]) => S.rec.advice.filter((a) => list.includes(a.target as AbilityId)).length;
    result[`${sp} against ${g}`] = {
      specialist: kind, strengths: strong, weaknesses: weak,
      atSetupLevels: { asExpected: atStart.filter((x) => x.asExpected).length, of: atStart.length, readsStrengths: atStart.filter((x) => x.reads === 'strengths').length, pieces: atStart },
      atFinalLevels: { asExpected: atEnd.filter((x) => x.asExpected).length, of: atEnd.length, pieces: atEnd },
      finalLevels: endLevels, strengthsMin: Math.min(...strong.map((id) => endLevels[id]!)), weaknessesMax: Math.max(...weak.map((id) => endLevels[id]!)), weaknessesMean: r1(weak.reduce((t, id) => t + endLevels[id]!, 0) / weak.length),
      adviceWeeks: { strengths: weeks(strong), weaknesses: weeks(weak), all: S.rec.advice.length },
      strengthsNamed: S.rec.advice.filter((a) => strong.includes(a.target as AbilityId)).map((a) => `${a.day} ${a.target} at ${a.level}`),
      outcome: [G, S].map((x) => x.sim.player.school?.standing),
    };
  }
  writeFileSync(out, `${JSON.stringify(result, null, 1)}\n`);
  console.log(JSON.stringify(Object.fromEntries(Object.entries(result).map(([k, v]) => [k, Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([kk]) => !['byInput', 'pieces', 'atSetupLevels', 'atFinalLevels', 'strengthsNamed', 'finalLevels'].includes(kk)))]))));
}

if (process.argv.includes('--summarize')) summarize(arg('summarize'));
else if (process.argv.includes('--compare')) compare(arg('compare'), arg('out'));
else if (process.argv.includes('--recheck')) {
  const spec = JOURNEYS.find((j) => j.id === arg('journey'));
  if (!spec) throw new Error(`No journey "${arg('journey')}"`);
  recheck(spec, arg('state'), arg('out'));
}
// Run only when a journey is named (from 2026-10-21, brief 20's `tools/b20-journeys.ts`, which imports this file's player
// and checks): until then a bare import ran this and threw "No journey". Every invocation above names one.
else if (process.argv.includes('--journey')) {
  const named = JOURNEYS.find((j) => j.id === arg('journey'));
  if (!named) throw new Error(`No journey "${arg('journey')}": ${JOURNEYS.map((j) => j.id).join(', ')}`);
  // `--seed` plays a journey's profile on another seed, under its own id (the harness was developed on dev-0 this way).
  const spec = arg('seed') ? { ...named, seed: arg('seed'), id: `${named.id}-${arg('seed')}` } : named;
  const part = Number(arg('part', '1'));
  const rec = playPart(spec, part, arg('state'), arg('out'));
  const last = rec.parts.at(-1)!;
  console.log(JSON.stringify({ id: spec.id, part, from: last.from, to: last.to, secs: last.secs, standing: (rec.standings.at(-1) ?? {}).standing, reloads: rec.reloads.length, notSame: rec.reloads.filter((r) => !r.same).length, error: (rec.end as { error?: string } | undefined)?.error, checks: rec.checks ? Object.fromEntries(Object.entries(rec.checks).map(([k, v]) => [k, v.pass ? 'pass' : v.fails.slice(0, 2)])) : undefined }));
}
