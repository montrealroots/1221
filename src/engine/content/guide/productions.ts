/**
 * SLATE — the guide's reference: productions and casting (from 2026-10-12; `content/guide/types.ts`).
 *
 * Seven entries: how the chair casts, learning a part between its calls, the director's notes, how a part is played,
 * the nights, the Yale Cabaret and the Summer Cabaret, and the plays to read. Written against the engine as rebuilt on
 * 2026-10-12: a night judged in its movements (`systems/piece.ts`), the company's contribution kept apart from your
 * own night (`systems/ensemble.ts`), and a note on the craft worked one of the workbook's ways (`systems/production.ts`,
 * `systems/workbook.ts`).
 *
 * Every rule figure is imported from the rule that sets it, and the worked examples are worked out here from the same
 * rules: the first spring's Carlotta Festival as the calendar has it (`schoolProduction`, `rehearsalDays`), what every
 * call makes of a part (`completeFor`), a reading for the chair (`castScore`), Woyzeck's movements and load
 * (`materialOf`, `toneSegments`, `loadOf`), and the Summer Cabaret of 2027 (`summerRuns`). A few figures the systems
 * keep as bare numbers, exported by nothing, are written out in words and would drift from their rule unnoticed: a
 * call rehearsing a choice in at 0.3 before `PLAYING.gainShare` (`callAnswered`), "You know the part." at 97% of the
 * lines, a note on the blocking while it's under 70%, the Rep's calls at three and on call at five, the run-through's
 * dark Monday, the School's curtains at eight, the summer stipend paid on Fridays at five, a summer show's rehearsals
 * from Tuesday to Saturday, a focus of 1 for the learning example as readiness 80 (`focusOf`) before five in the
 * evening (`hourFit`), the 30% of a part learned before a craft note can be worked (`partWork`), and the half a point
 * a night an ability or technique must cost a run before the closing note names it (`closeRun`).
 *
 * The prose pass later on 2026-10-12 read the entries against the day's fixes. Until then they said a missed lab only
 * counted toward the casting pool's missed calls, where it takes you out at the count as a rehearsal does; that
 * Delivered read tiring late and a slip, where it reads preparation and the day's condition alone (`reckonNight`); that
 * Work On The Note asked an hour clear whatever the way, and spent the hour on a note on the director's request, which it
 * now refuses (`ownWorkRefusal`, `wayRefusal`); that a blocking note left a missed call's gap open; that a movement held
 * back by tiring was given "I don't know what you want…" (`craftNoteOf` gives "It sags in…"); that a Rep cast listed
 * none of the class; that a sick day excused no Cabaret or Summer Cabaret call; that the stipend went on beside
 * workers' compensation; that a summer show rehearsed every Tuesday to Saturday afternoon, another show's matinee
 * included; and that a student on a leave could join the Cabaret or the summer company. A craft note on the weakness
 * your work keeps coming back to says so from the same day (`noteText`), and the notes entry says that too.
 *
 * The guide’s audit of 2026-10-13 read them against that day’s fixes. Until then the nights entry said the closing
 * note named the play’s skill weakest in you, which it stopped doing on 2026-10-12, and that every run was kept among
 * the milestones, where one with no night played isn’t; the Cabaret entry gave only the closing night played as a
 * credit; and the notes entry gave what was tried only for a note taken, where `noteText` says it after “Still:” too.
 *
 * Later that day “A copy is at the Haas Arts Library, in New Haven.” went from the engine (`copyAt`), reached by no
 * play, since every student is in New Haven and nothing moves one; until then the plays-to-read entry listed it, and
 * said a read needed New Haven.
 */

import { formatMoney } from '../../core/money';
import { STEP_SPEED } from '../abilities';
import { CHAPTER_BY_ID } from '../tutorial';
import { SUMMER_CABARET, TERM_STARTS_2026_27, YALE_CABARET, YALE_DRAMA, type SchoolDate } from '../school';
import { CONTEMPORARY_PLAYS } from '../contemporary';
import { DIMENSION_LABEL, EVALUATION, type Dimension } from '../tasks';
import { PIECE, TONE_LEAN } from '../piece';
import { ADJUSTMENTS, WORKBOOK } from '../workbook';
import { APPROACH_EFFECT, MISFIT, PLAYING } from '../approaches';
import { GRAIN } from '../interpretation';
import type { AxisValue } from '../material';
import {
  BONDS, CAST_LIST, ESTIMATE, NIGHT_DIFFICULTY, NIGHT_LEAST, NIGHT_VALUE, castScore, evenCraft, rehearsalDays, schoolProduction, summerRuns,
} from '../../systems/school';
import { DIRECTION, PROCESS, completeFor, stagesOf, type Process } from '../../systems/production';
import { ENSEMBLE } from '../../systems/ensemble';
import { WORK } from '../../systems/coursework';
import { PLAYREADING } from '../../systems/playreading';
import { materialOf } from '../../systems/material';
import { loadOf, unitSegments } from '../../systems/piece';
import { ATTRIBUTES, abilityDef } from '../../systems/attributes';
import { SPENT } from '../../systems/life';
import { WORKERS_COMP } from '../injury';
import type { GuideEntry } from './types';

const CHAPTER = CHAPTER_BY_ID['school']!.title;
const OPENED = `From the guide’s chapter “${CHAPTER}”`;
const LOCKED = `Locked, on a guided life, until “${CHAPTER}” has been read.`;
const ROUTE = '/workspace/school';
/** The School screen's tabs (`ui/shell/sections.ts`), named through constants: a literal `tab` reads as a label. */
const TAB = { casting: 'casting', coursework: 'coursework' } as const;

// --- how a figure is written ------------------------------------------------------------------------------------------

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const ORDINAL = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh'];
const word = (n: number): string => WORDS[n] ?? String(n);
const ordinal = (n: number): string => ORDINAL[n] ?? `${n}th`;
const pct = (x: number): string => `${Math.round(x * 100)}%`;
const one = (x: number): string => (Math.round(x * 10) / 10).toFixed(1);
const usd = (cents: number): string => formatMoney(cents, 'USD', { cents: cents % 100 !== 0 });
const clock = (hour: number): string => (hour === 12 ? 'noon' : hour < 12 ? `${hour} a.m.` : `${hour - 12} p.m.`);
const hoursOf = (minutes: number): string =>
  minutes === 60 ? 'an hour' : minutes === 90 ? 'an hour and a half' : minutes === 150 ? 'two and a half hours' : minutes % 60 === 0 ? `${word(minutes / 60)} hours` : `${minutes} minutes`;
const dated = (d: SchoolDate, year = true): string => `${MONTHS[d.month - 1]} ${d.day}${year ? `, ${d.year}` : ''}`;
const andList = (items: readonly string[]): string => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const lower = (s: string): string => s.toLowerCase();
const upper = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * What a way of playing leans on and draws on, in words, from its effect. A night is judged in its movements, and a
 * piece judged so reads stamina only through its drain (`judgePiece` takes it out of every input), so a side's stamina
 * is left out of what it draws on for a part and said apart. Until the verifier's pass of 2026-10-12 this said Driven
 * drew on stamina, as the chooser's table did until later that day; measured that day, a part played Driven came out the
 * same at stamina 0 and 100 where its load was 0. Until the prose pass of the same day the Pace row said the table
 * listed stamina under Driven, which it no longer does for a part (`PlayingChooser`, a piece judged in its movements).
 */
const leansOn = (side: AxisValue): string => andList(Object.keys(APPROACH_EFFECT[side].lean).map((d) => lower(DIMENSION_LABEL[d as Dimension])));
const drawsOn = (side: AxisValue): string => andList([...new Set(Object.values(APPROACH_EFFECT[side].inputs).flat().filter((x) => x!.ability !== 'stamina').map((x) => lower(abilityDef(x!.ability).label)))]);
const drawsStamina = (side: AxisValue): boolean => Object.values(APPROACH_EFFECT[side].inputs).flat().some((x) => x!.ability === 'stamina');
const axisFact = (a: AxisValue, b: AxisValue): string => {
  const aside = [a, b].filter(drawsStamina).map((s) => APPROACH_EFFECT[s].label);
  return `${APPROACH_EFFECT[a].label} leans on ${leansOn(a)} and draws on ${drawsOn(a)}; ${APPROACH_EFFECT[b].label} leans on ${leansOn(b)} and draws on ${drawsOn(b)}${aside.length ? `. Stamina, which ${andList(aside)} ${aside.length > 1 ? 'draw' : 'draws'} on in work shown whole with no scene, isn’t listed for a part: a night reads it only through its drain, however you play it` : ''}`;
};
/** What each tone leans, in words (`TONE_LEAN`). */
const TONES = Object.entries(TONE_LEAN).map(([tone, lean]) => `${tone}, ${andList(Object.keys(lean).map((d) => lower(DIMENSION_LABEL[d as Dimension])))}`).join('; ');

/** A process with every call of a run to come, nothing yet done: what `completeFor` reads coming to every call makes. */
const fresh = (of: number, format?: Process['format']): { process: Process } => ({ process: { lines: 0, blocking: 0, calls: 0, blockingMissed: 0, notes: [], trained: 0, of, ...(format ? { format } : {}) } });

// --- the first spring's Carlotta Festival, the first production a class is cast in --------------------------------------

const CARLOTTA = schoolProduction(1, 1, 1)!;
const CARLOTTA_DAYS = rehearsalDays(1, CARLOTTA.runs[0]!, CARLOTTA.weeks);
const CARLOTTA_CALLS = CARLOTTA_DAYS.length;
const CARLOTTA_STAGES = stagesOf(CARLOTTA_CALLS);
const BLOCKING_CALLS = CARLOTTA_STAGES.filter((s) => s === 'blocking').length;
const WORK_CALLS = CARLOTTA_STAGES.filter((s) => s === 'work').length;
const PAR = completeFor(fresh(CARLOTTA_CALLS))!;
const OFF_BOOK_CALL = Math.ceil(PROCESS.blockingShare * CARLOTTA_CALLS);
const FIRST_NOTE_CALL = CARLOTTA_STAGES.indexOf('work') + 1;

// Learning the part: the read-through and two blocking calls kept, the third missed, then an hour on each.
const after = (calls: number, share: number): number => 1 - (1 - share) ** calls;
const LINES_3 = after(3, PROCESS.call.lines);
const BLOCK_2 = after(2, PROCESS.call.blocking);
const CAUGHT = BLOCK_2 + PROCESS.own.blocking * (1 - BLOCK_2);
const LEARNED = LINES_3 + PROCESS.own.lines * (1 - LINES_3);

// A Cabaret show's evenings, every one kept: what they make of the part.
const CABARET_PAR = completeFor(fresh(YALE_CABARET.rehearsalEvenings, 'cabaret'))!;

// --- the director's notes ---------------------------------------------------------------------------------------------

const WAY_MINUTES = Object.values(ADJUSTMENTS).map((a) => a.minutes);
const NEW_PLAY_LOAD = loadOf({ physical: 0, vocal: 0 }, 'night');
/** What tiring leaves of what it reaches, at a movement's place in the evening, by a load and a stamina from 0 to 1. */
const drainAt = (load: number, position: number, stamina: number): number => 1 - PIECE.drain * load * position * (1 - stamina);
const SPENT_BEFORE = drainAt(NEW_PLAY_LOAD, 1, 0.5);
const SPENT_AFTER = drainAt(NEW_PLAY_LOAD * WORKBOOK.breathe, 1, 0.5);

// --- how a part is played ---------------------------------------------------------------------------------------------

/** A call after the read-through rehearses a choice in by this share of what's left (`callAnswered`). */
const CALL_GAIN = 0.3 * PLAYING.gainShare;
const rehearsed = (from: number, calls: number): number => 1 - (1 - from) * (1 - CALL_GAIN) ** calls;
const CALLS_TO_COMPLETE = (() => { let k = 0; while (rehearsed(0, k) < PLAYING.complete) k += 1; return k; })();
const LATEST_CHOICE = CARLOTTA_CALLS - CALLS_TO_COMPLETE;
const SWITCH_AT = 8;
const PREP_AT_SWITCH = rehearsed(0, SWITCH_AT - 1);
const PREP_KEPT = PREP_AT_SWITCH * PLAYING.keptOnChange;
const PREP_END = rehearsed(PREP_KEPT, CARLOTTA_CALLS - SWITCH_AT);
const PREP_STAYED = rehearsed(0, CARLOTTA_CALLS - 1);

// --- the nights: Woyzeck, as a thesis may deal it -----------------------------------------------------------------------

const WOYZECK = materialOf('Woyzeck');
const W_TITLE = WOYZECK?.title ?? 'Woyzeck';
// Its units, each tone section cut again at its turns (from 2026-10-16, evaluation-10: its tones only until then).
const W_SEGMENTS = unitSegments(WOYZECK ?? { tones: [], turns: 0 }, 2);
const W_LOAD = loadOf(WOYZECK ?? { physical: 0, vocal: 0 }, 'night');
const W_LATE = drainAt(W_LOAD, 1, 0.5);
const W_SLIP = 6;
const W_RECOVER = 0.6;
const W_SHAKEN = 1 - PIECE.rattle * (W_SLIP / 100) * (1 - W_RECOVER);
const W_MOVEMENTS = andList(W_SEGMENTS.map((s) => `${lower(s.label)}${s.tones.length ? ` (${s.tones.join(' and ')})` : ''}`));
/** The company in it: the share of calls they keep, their timing, and what they bring. */
const COMPANY_KEEPS = 0.85;
const COMPANY_TIMING = 0.9;
const COMPANY_BRINGS = (ENSEMBLE.prepFloor + (1 - ENSEMBLE.prepFloor) * COMPANY_KEEPS) * COMPANY_TIMING;
const COMPANY_SLIPS = (1 - COMPANY_KEEPS) * ENSEMBLE.slipRate;
const W_LEVEL = WOYZECK?.partner ?? 2;
const CONNECTION_SHARE = (ENSEMBLE.share.connection ?? 0) * (W_LEVEL / 3);
const YOUR_CONNECTION = 70;
const TOGETHER_CONNECTION = (1 - CONNECTION_SHARE) * YOUR_CONNECTION + CONNECTION_SHARE * 100 * COMPANY_BRINGS;

// --- the chair's read: you after a lead, a classmate after a featured part -------------------------------------------

const C = ESTIMATE.casting;
const R = C.record;
const YOUR_FIT = 62;
const MATE_FIT = 58;
const YOUR_DELIVERY = 0.9;
const MATE_DELIVERY = 0.95;
const YOUR_READ = castScore({ craft: evenCraft(50), fit: YOUR_FIT, last: { size: 'lead', delivery: YOUR_DELIVERY } }, {});
const MATE_READ = castScore({ craft: evenCraft(50), fit: MATE_FIT, last: { size: 'featured', delivery: MATE_DELIVERY } }, {});

// --- the Summer Cabaret of the first summer ---------------------------------------------------------------------------

const DAY = 86_400_000;
const SUMMER_YEAR = TERM_STARTS_2026_27.spring.year;
const SUMMER = summerRuns(SUMMER_YEAR);
const utc = (d: SchoolDate): number => Date.UTC(d.year, d.month - 1, d.day);
const fromUtc = (t: number): SchoolDate => { const d = new Date(t); return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }; };
const SUMMER_FROM = utc(SUMMER[0]!.from) - SUMMER_CABARET.rehearsalWeeks * 7 * DAY;
const FIRST_SUMMER_CALL = (() => { let t = SUMMER_FROM; while (![2, 3, 4, 5, 6].includes(new Date(t).getUTCDay())) t += DAY; return fromUtc(t); })();
const STIPEND_FRIDAYS = (() => { let n = 0; for (let t = SUMMER_FROM; t <= utc(SUMMER[SUMMER.length - 1]!.to) + 7 * DAY; t += DAY) if (new Date(t).getUTCDay() === 5) n += 1; return n; })();
const APPLY_BY = `${MONTHS[SUMMER_CABARET.applyBy[0] - 1]} ${SUMMER_CABARET.applyBy[1]}`;
/** Workers' compensation where the Summer Cabaret plays (`compWeek`: New Haven is in Connecticut). */
const CT_COMP = WORKERS_COMP.states['us-ct']!;
/**
 * The week under which Connecticut pays its share of the whole wage: its minimum, a fifth of its maximum, held to that
 * share of the wage before tax (CGS 31-307(a); `compWeekly`). Until 2026-10-13 the entry said the stipend was paid at
 * 75% after tax, which it was until that day’s fix of the minimum.
 */
const CT_MINIMUM_UNDER = Math.round((CT_COMP.max * (CT_COMP.minShareOfMax ?? 0)) / CT_COMP.share);
const CABARET_WEEKS = word(Math.round(YALE_CABARET.leadDays / 7));

// --- a play to read ---------------------------------------------------------------------------------------------------

const PLAY = CONTEMPORARY_PLAYS.find((p) => p.id === 'clybourne-park') ?? CONTEMPORARY_PLAYS[0]!;
const PLAY_CAST = PLAY.cast?.f !== undefined ? `${PLAY.cast.f} ${PLAY.cast.f === 1 ? 'woman' : 'women'} and ${PLAY.cast.m} ${PLAY.cast.m === 1 ? 'man' : 'men'}` : PLAY.cast?.text ?? 'not on record';
const PLAY_MINUTES = /short play|monologue/.test(PLAY.form ?? '') ? PLAYREADING.minutes.short : PLAYREADING.minutes.full;

export const PRODUCTIONS: readonly GuideEntry[] = [
  {
    id: 'productions.casting',
    title: 'Casting',
    goal: 'productions',
    covers: [],
    synonyms: ['cast list', 'why this cast', 'casting pool', 'the chair casts', 'fit for the play', 'balance of opportunity', 'understudy at Yale Rep', 'Carlotta Festival', 'directors’ thesis', 'around the class'],
    questions: ['How does the chair decide who plays what?', 'Why didn’t I get the lead?', 'What’s my fit for a play?', 'Why wasn’t I cast this term?', 'When do I go to Yale Rep?', 'What does an understudy do?'],
    where: { route: ROUTE, tab: TAB.casting, label: 'School, Casting, Why This Cast' },
    available: `${OPENED}. The chair casts as each term begins, from the first spring.`,
    short: `The chair of Acting, ${YALE_DRAMA.actingChair.name}, casts every student in the casting pool as each term begins, from the first spring. Everyone is read the same way for the play: their fit for it, what a night of it would come to from their abilities and the techniques it asks, fully prepared on a good day; ${pct(C.delivery)} of that fit riding on how much of themselves they delivered in their runs since the last casting; and a balance for the size of their last part. The best read takes the biggest part still open that’s written for them. Why This Cast, on the Casting tab, shows every read in your production.`,
    steps: [
      'As each term begins, read the notice “Cast: …”: your part, the play, and who plays the lead where it isn’t you.',
      'Open School, then Casting. Each production you’re in has a panel with Role, Performed (Went On for an understudy) and Calls Ahead, then its rehearsal process.',
      'Why This Cast lists each student in your production with Fit, Delivered, Balance, Read and Part, best read first, and above the table the runs your own Delivered was read from.',
      'Around The Class shows who’s playing what this term, each classmate’s Last Run, and what they are to you.',
      'Calls Ahead, at the foot of the tab, lists the next eight School and Rep calls and labs; press one to look at the call, or its date to look at that day.',
    ],
    needs: [
      `A place in the casting pool: ${word(ESTIMATE.missedCallsOut)} missed calls in a term take you out of it until a good evaluation puts you back. A rehearsal, a run-through or a lab missed unexcused takes you out when it brings the count there; a missed performance counts toward it, and is a grave breach besides.`,
      'A first-year is first cast in the spring; the first fall has Drama 50 and no production.',
      `Good standing, for Yale Rep: an understudy in the first spring and in the second and third years’ falls, or, as a third-year at ${ESTIMATE.castAtRep} acting or more, a part in the Rep’s company in place of a School production.`,
    ],
    costs: [
      { label: 'Time', value: 'None to be cast. A School production calls you Tuesday to Friday from three for six hours through its rehearsal weeks, and plays at eight. A Rep understudy rehearses Wednesday and Friday from three to six and is on call at every performance; a company member rehearses Tuesday to Saturday from three to nine', estimate: true },
      { label: 'Money', value: 'None: casting is part of the program, and unpaid' },
    ],
    reads: [
      { label: 'Fit', value: 'What a night of the play would come to with no draw: your abilities and the techniques it asks, the play’s material leaning them (its kinds of play, where the game has no profile of it), preparation complete and a sufficient day. Stamina and discipline count as full for everyone, since the class’s bodies and habits aren’t simulated', estimate: true },
      { label: 'Delivered', value: `How much of yourself you brought to your runs since the last casting: each night’s preparation and the day’s condition, each run weighed by its nights up to ${R.nightsCap}, a Cabaret or Summer run at ${pct(R.weight.cabaret)} of a School production’s, your record before at ${pct(R.carry)} of its weight. A classmate’s is the share of calls they keep, ${pct(WORK.reliability.from)} to ${pct(WORK.reliability.to)}`, estimate: true },
      { label: 'Balance', value: `Your last School production’s part: a lead ${C.balance.lead}, a supporting part ${C.balance.supporting}, a featured part +${C.balance.featured}`, estimate: true },
      { label: 'Read', value: `The fit, with ${pct(C.delivery)} of it scaled by Delivered, plus the balance. Best read first, each takes the biggest part still open written for an actor, an actress or either; with none left, In The Company`, estimate: true },
      { label: 'Which Production', value: 'The first spring, the Carlotta Festival for the whole class. In the second and third years’ falls, a directors’ thesis for the upper half of the read and the Langston Hughes Festival for the rest; the second spring, a thesis or the Carlotta; the last spring, a Shakespeare Repertory Project by place in the read', estimate: true },
      { label: 'Yale Rep', value: `Good standing, in a term with a Rep production for your year. A third-year at ${ESTIMATE.castAtRep} acting or more is asked into the company, a featured part; everyone else understudies`, estimate: true },
    ],
    now: [
      'The cast list goes up as the term begins: every rehearsal call and performance goes on your calendar, from the first call, and a notice names your part.',
      `The list read: a lead of your own lifts morale ${CAST_LIST.ownLead}, a friend’s lead ${CAST_LIST.friendLead}, and a rival’s adds ${CAST_LIST.rivalLead} stress, each by your nature.`,
      `Each classmate in your cast comes ${BONDS.shared} closer for the weeks shared, ${BONDS.leadTaken} less where a lead written for one of you went to the other, by your warmth or how a slight cuts you.`,
      `The runs the chair read are marked read: the next casting reads what you play after this one, with this read carried at ${pct(R.carry)} of its weight.`,
    ],
    later: [
      'The School and the Rep never call you to two places at once: a School rehearsal gives way to a Rep rehearsal, performance or run-through, and ends where a Rep night on call begins; a Rep night on call gives way to your own School performance, and a School performance to a Rep performance in a role.',
      `On call, the Rep calls three hours before each curtain, at five for an evening and at eleven for a Sunday matinee. Most nights you aren’t needed; on about ${pct(ESTIMATE.goesOn)} of them you go on, and the performance goes on your calendar.`,
      'An understudy plays one run-through for the director, on the dark Monday of the run’s second week.',
      'When a run ends, the classmates in it grow by its rehearsals and nights, and their own run is judged and kept as their Last Run.',
    ],
    interpret: [
      `Read decides it: a higher fit can lose a lead across a balance of ${C.balance.featured - C.balance.lead} points between a lead last time and a featured part.`,
      'Delivered at 100% means every night came fully prepared, on a sufficient day: the day’s fatigue, the flu, an injury or a concussion read as less delivered. Tiring late in the play and a slip carried into the next movement don’t, since the fit and the night’s draw read them already. A night missed unexcused, not in hospital, laid up or called in sick, counts as delivered at nothing.',
      'Fit reads the same abilities a night does, so the work that grows them moves it. Identity plays no part in it.',
      'A part called In The Company means no part written for you was left when your read came up.',
      'Why This Cast shows the production you’re in; Around The Class shows the whole class, the Rep’s company included.',
    ],
    unavailable: [
      '“Not Cast Yet”, out of the pool: “Out of the casting pool after missed calls. A good evaluation puts you back.”',
      'Not Cast Yet, in the first fall: the chair casts from the first spring.',
      'No Rep part: a term with no Rep production for your year, or a standing below good.',
      // The panel's own words once the School has ended, from 2026-10-16: until then it said Not Cast Yet and when the chair casts.
      'On a leave, after a withdrawal or a dismissal, or after the degree, the chair casts you in no production. Once the School has ended, No Casting Ahead says so in place of Not Cast Yet, and that the productions you played stay on your Profile.',
    ],
    mistakes: [
      `Missing calls: ${word(ESTIMATE.missedCallsOut)} in a term and you’re out of the pool for every casting until a good evaluation. Unwell, Call In Sick before the call: an excused call isn’t a missed one.`,
      `Skipping nights: a night missed unexcused is delivered at nothing, and the next casting reads the run for up to ${R.nightsCap} nights of weight.`,
      `Counting on a lead every term: a lead takes ${-C.balance.lead} off your next read, and a featured part adds ${C.balance.featured}.`,
      'Away from New Haven at five on a night you’re on call, if the Rep needs you: a grave breach, as a missed performance is. It puts you on academic warning, or from warning dismisses you.',
    ],
    related: ['productions.part', 'productions.nights', 'school.standing', 'productions.cabaret', 'coursework.partners'],
    connections: [
      { to: 'school.standing', kind: 'prerequisite', why: `Only a student in the casting pool is cast, and only one in good standing goes to Yale Rep; ${word(ESTIMATE.missedCallsOut)} missed calls take you out until a good evaluation.` },
      { to: 'productions.part', kind: 'immediate', why: 'Being cast puts every rehearsal call on the calendar with its stage, and opens the part’s rehearsal process.' },
      { to: 'day.calendar', kind: 'scheduled', why: 'Each call and performance is a commitment on the calendar, and the clock stops at it.' },
      { to: 'productions.nights', kind: 'evaluation', why: 'The part’s size and stage set how hard each night is: a lead harder than a featured part, and the Rep harder than the School.' },
      { to: 'coursework.partners', kind: 'immediate', why: `The cast list moves bonds: a classmate in your cast comes ${BONDS.shared} closer, ${BONDS.leadTaken} less where a lead went between you.` },
      { to: 'body.how', kind: 'immediate', why: `The list read: your own lead lifts morale ${CAST_LIST.ownLead}, a friend’s ${CAST_LIST.friendLead}, and a rival’s adds ${CAST_LIST.rivalLead} stress.` },
      { to: 'productions.cabaret', kind: 'optional', why: 'A Cabaret show is set in a week clear of your casting calls; cast at the School and the Rep at once, you can’t take one.' },
    ],
    example: {
      setup: `A play both of you could lead. You read with a fit of ${YOUR_FIT}, after a lead last time, ${pct(YOUR_DELIVERY)} delivered; a classmate reads ${MATE_FIT}, after a featured part, keeping ${pct(MATE_DELIVERY)} of their calls.`,
      steps: [
        `Yours: ${YOUR_FIT} with ${pct(C.delivery)} of it scaled by ${pct(YOUR_DELIVERY)}, then ${C.balance.lead} for the lead: ${one(YOUR_READ)}.`,
        `Theirs: ${MATE_FIT} with ${pct(C.delivery)} of it scaled by ${pct(MATE_DELIVERY)}, then +${C.balance.featured} for the featured part: ${one(MATE_READ)}.`,
      ],
      result: MATE_READ > YOUR_READ
        ? `The classmate is read first, ${one(MATE_READ)} to your ${one(YOUR_READ)}, and takes the lead written for either of you; you take the biggest part still open for you. Why This Cast shows both rows, and next term the chair reads the part you play now.`
        : `You’re read first, ${one(YOUR_READ)} to their ${one(MATE_READ)}, and take the lead; Why This Cast shows both rows, and next term the chair reads the part you play now.`,
    },
  },
  {
    id: 'productions.part',
    title: 'Learning A Part',
    goal: 'productions',
    covers: ['school.learn_part', 'school.review_blocking'],
    synonyms: ['learn the part', 'learn lines', 'off book', 'catch up the blocking', 'blocking book', 'rehearsal calls', 'read-through', 'technical rehearsal', 'dress rehearsal', 'growth from a night', 'rehearsal process'],
    questions: ['How do I learn my lines?', 'When do I have to be off book?', 'I missed a blocking call: what now?', 'What happens at each rehearsal call?', 'What does Growth From A Night mean?', 'Why is Learn The Part grayed?'],
    where: { route: ROUTE, tab: TAB.casting, label: 'School, Casting, The Rehearsal Process' },
    available: `${OPENED}, while a part you’re cast in has calls to come: a School production, Yale Rep, a Cabaret show or a Summer Cabaret show.`,
    short: `A part is learned at its rehearsal calls and between them. Each call you come to learns ${pct(PROCESS.call.lines)} of the lines still to learn, and a blocking call sets ${pct(PROCESS.call.blocking)} of the blocking still to set. Between calls, Learn The Part is an hour on the lines, and Catch Up The Blocking an hour with the blocking book for a blocking call you missed. A night reads both against what coming to every call makes, and never asks less than ${pct(NIGHT_LEAST.lines)} of either.`,
    steps: [
      'Open School, then Casting. Under your production, The Rehearsal Process shows Lines, Blocking (with any blocking calls Missed To Catch Up), Growth From A Night and A Night Now.',
      `Come to the calls on your calendar: the read-through first, blocking for the first ${pct(PROCESS.blockingShare)} of the calls, then rehearsals, and the technical and dress rehearsals last.`,
      'Press Learn The Part for an hour on the lines, as often as you like until you know the part.',
      'After a blocking or technical call missed, press Catch Up The Blocking, an hour for each call missed.',
      'A grayed button gives its reason when you point at it, and the reasons are listed under the buttons.',
    ],
    needs: [
      'A part you’re cast in, its run still to come.',
      'For Catch Up The Blocking, a blocking or technical call missed and not yet caught up.',
      'Free for the hour: not at something already, and nothing you’re expected at within it.',
    ],
    costs: [
      { label: 'Time', value: `${upper(hoursOf(PROCESS.own.minutes))} each, on the clock` },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'A Call Kept', value: `Learns ${pct(PROCESS.call.lines)} of the lines still to learn. A blocking or technical call, and every understudy rehearsal, sets ${pct(PROCESS.call.blocking)} of the blocking still to set`, estimate: true },
      { label: 'Learn The Part', value: `${pct(PROCESS.own.lines)} of the lines still to learn, more at a sharp hour and less at a tired one, faster in a kind of play you know, and ${pct(STEP_SPEED.least)} as far at memory 0 to ${pct(STEP_SPEED.most)} at 100. It trains memory the first ${word(PROCESS.own.trainsAtMost)} times for each part`, estimate: true },
      { label: 'Catch Up The Blocking', value: `Closes one missed call’s gap and sets ${pct(PROCESS.own.blocking)} of the blocking still to set. It trains memory each time`, estimate: true },
      { label: 'Off Book', value: `Asked ${pct(PROCESS.blockingShare)} of the way through the calls: from then, lines under ${pct(PROCESS.offBook)} are the director’s note at a work-through, after any blocking call still to catch up`, estimate: true },
      { label: 'Complete For A Night', value: `What coming to every call makes of the lines and the blocking, and never under ${pct(NIGHT_LEAST.lines)} of either` },
      { label: 'Growth From A Night', value: `${pct(PROCESS.factor.least)} to ${pct(PROCESS.factor.most)}: the lines, the blocking and the notes taken, weighed ${PROCESS.factor.lines}, ${PROCESS.factor.blocking} and ${PROCESS.factor.notes}, against what every call kept and no more makes, which grows at 100%`, estimate: true },
    ],
    now: [
      'Learn The Part: the clock moves on an hour and Lines rises; a toast says where it stands.',
      'Catch Up The Blocking: one fewer Missed To Catch Up, and Blocking rises.',
      'Each call you come to moves the lines and the blocking as above, and keeps up your discipline, a quarter of a session’s worth.',
    ],
    later: [
      'From the first work-through rehearsal, the director gives a note at each one, and the lines and the blocking come first.',
      'The dress rehearsal is played through as a night with no house, and its band shows under the process: “The dress rehearsal: Solid.”',
      'Each night reads the lines and the blocking as preparation, the blocking movement by movement with any work on each.',
      `A School or Rep call missed counts against the term’s attendance, and ${word(ESTIMATE.missedCallsOut)} in a term take you out of the casting pool.`,
    ],
    interpret: [
      `Lines under ${pct(PROCESS.offBook)} past the off-book call bring the note “Be off book: the lines aren’t there yet, and the scene can’t start until they are.”`,
      'Growth From A Night is how much a night grows your craft, 100% for every call kept and no more. It doesn’t change the night’s result.',
      'A Night Now is what a night would come to if it opened now, with no draw. The Part Now, Movement By Movement shows each movement’s own blocking against what it asks.',
      'Blocking set at a call you were excused from is still a gap, and Missed To Catch Up counts it.',
    ],
    unavailable: [
      '“You aren’t cast in anything there.”',
      '“The run is over.”',
      '“You know the part.”: the lines at 97%.',
      '“You haven’t missed any blocking.”',
      '“You’re at … until ….”, or “… starts at …: there isn’t the time before it.”',
      LOCKED,
    ],
    mistakes: [
      `Leaving the lines to the calls: in a short run they don’t get there. A Cabaret show’s ${YALE_CABARET.rehearsalEvenings} evenings, every one kept, make ${pct(CABARET_PAR.lines)} of the lines and ${pct(CABARET_PAR.blocking)} of the blocking, under the ${pct(NIGHT_LEAST.lines)} a show asks. Learn The Part between calls.`,
      'Missing a blocking call and leaving it: the gap stays, and the next note asks for the blocking first. Catch it up before the next work-through.',
      'Learning lines tired: an hour at a low ebb moves less. Do it rested, at your own best time of day.',
    ],
    related: ['productions.casting', 'productions.notes', 'productions.nights', 'coursework.workbook', 'school.sick'],
    connections: [
      { to: 'productions.casting', kind: 'prerequisite', why: 'Only a part you’re cast in has lines and blocking to learn, while its run is to come.' },
      { to: 'productions.notes', kind: 'immediate', why: `A missed blocking call, or lines under ${pct(PROCESS.offBook)} past the off-book call, is what the next note asks for first.` },
      { to: 'productions.nights', kind: 'evaluation', why: 'The lines and the blocking are a night’s preparation, against what every call makes.' },
      { to: 'school.standing', kind: 'evaluation', why: 'Each call kept or missed is counted in the attendance the term’s evaluation reads.' },
      { to: 'craft.profile', kind: 'immediate', why: `An hour on the part trains memory the first ${word(PROCESS.own.trainsAtMost)} times for each part; an hour with the book does every time.` },
      { to: 'coursework.workbook', kind: 'optional', why: 'Work It Through on the part works a movement’s own blocking, slowly or run into from the one before.' },
    ],
    example: {
      setup: `A first-year cast in the ${CARLOTTA.name}: ${CARLOTTA_CALLS} calls from ${dated(CARLOTTA_DAYS[0]!, false)} to ${dated(CARLOTTA_DAYS[CARLOTTA_CALLS - 1]!)}, the read-through, ${word(BLOCKING_CALLS)} blocking calls, ${word(WORK_CALLS)} rehearsals, and the technical and dress rehearsals. The lines are asked off book from the ${ordinal(OFF_BOOK_CALL)} call, and the first note comes at the ${ordinal(FIRST_NOTE_CALL)}.`,
      steps: [
        `You come to the read-through and the first two blocking calls: the lines stand at ${pct(LINES_3)}, the blocking at ${pct(BLOCK_2)}.`,
        'You miss the third blocking call, unexcused. Blocking shows 1 Missed To Catch Up.',
        'Later that afternoon, before five, at a readiness of 80 and your memory at 50, press Catch Up The Blocking, then Learn The Part.',
      ],
      result: `The blocking goes to ${pct(CAUGHT)} and the gap is closed; the lines go to ${pct(LEARNED)}, a new play having no kind of play you could know already. Coming to every call and no more would have the lines at ${pct(PAR.lines)} and the blocking at ${pct(PAR.blocking)} by the opening, what a night of it counts as complete.`,
    },
  },
  {
    id: 'productions.notes',
    title: 'The Director’s Notes',
    goal: 'productions',
    covers: ['school.work_note'],
    synonyms: ['director’s note', 'work on the note', 'note taken', 'notes taken', 'craft note', 'ways at the note', 'better since the last note', 'the director’s request'],
    questions: ['What does the director’s note mean?', 'How do I take a note?', 'Why does the note say “Still”?', 'Was my note taken?', 'Which way should I work a note?'],
    where: { route: ROUTE, tab: TAB.casting, label: 'School, Casting, The Rehearsal Process, The Director’s Last Note' },
    available: `${OPENED}, from a production’s first work-through rehearsal. An understudy’s rehearsals bring no notes.`,
    short: `At each work-through rehearsal the director gives one note, on what most needs it now: a blocking call missed, the lines past the off-book call, the blocking short, or else something the part’s own forecast shows, named as a director names it (what you want, listening, pacing, the physical life, a change, a relationship) and placed in the play. Where that’s the weakness your work keeps coming back to, the note says so, and how many of your pieces it has held back. Work On The Note before the next call, one of the ways at it, and the next call reads whether it was answered. A note taken makes that call’s growth ${pct(PROCESS.noteTaken - 1)} more, and the share taken is part of a night’s preparation.`,
    steps: [
      'Open School, then Casting. Under The Rehearsal Process, read the director’s last note, its date, and whether it’s Not Worked On Yet, Worked On, Taken or Not Taken.',
      'For a note on the craft, choose one of the ways at it from the list after The Ways At It, and read what the chosen way is beside the list.',
      'Press Work On The Note, which names the way chosen. It takes the way’s time, and a toast gives the figure before and after.',
      'A way that plays a movement differently, or finds places to breathe, waits under Work It Through: Keep It or Put It Back. Left alone, the next call keeps it.',
      'A note on the lines or the blocking is an hour’s work on them. A note on the director’s request is answered by changing How You’ll Play It, and Work On The Note won’t take it.',
    ],
    needs: [
      'A note given and not yet settled: the next call settles it either way.',
      `For a craft note: awake and out of hospital, 30% of the part learned, free now with the way’s own minutes clear of anything you’re expected at, and, for a way on your feet, energy of ${SPENT} or more and no injury that stops training. Any other note: free now, with ${hoursOf(PROCESS.own.minutes)} clear.`,
      'For a craft note, a way at it not already tried and put back, and no change waiting to be kept or put back.',
    ],
    costs: [
      { label: 'Time', value: `A note on the craft: the way’s own time, ${Math.min(...WAY_MINUTES)} to ${Math.max(...WAY_MINUTES)} minutes. Any other note: ${hoursOf(PROCESS.own.minutes)}`, estimate: true },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'What The Note Is On', value: `In order: a blocking call missed and not caught up; lines under ${pct(PROCESS.offBook)} once ${pct(PROCESS.blockingShare)} of the calls are past; blocking under 70%; else the worst problem in the part’s forecast that has a way at it, the one just answered left out; else the play’s skill that’s weakest in you`, estimate: true },
      { label: 'The Director’s Request', value: `In ${pct(DIRECTION.asks)} of productions, one side of one axis, drawn at the first call you come to. A choice against it is the note at the next work-through, ahead of any other`, estimate: true },
      { label: 'Answered', value: `A craft note: worked a way that left its figure no more than ${WORKBOOK.evidence / 10} lower, and the way kept; or its problem gone from the forecast, whatever did it. A note on the lines or the blocking: worked, or the calls got them there. A note on a skill the play asks: worked. A note on the request: the choice no longer against it` },
      { label: 'A Note Taken', value: `That call’s growth ×${PROCESS.noteTaken}. The share of notes taken is a night’s third part of preparation, weighed ${PROCESS.factor.notes} in Growth From A Night`, estimate: true },
      { label: 'Working It', value: 'Trains adaptability each time. A way tried trains what it works on too: working a movement slowly, or playing it another way, trains the ability or technique holding it back, where one does; running into it from the one before trains adaptability', estimate: true },
    ],
    now: [
      'A craft note: the way is tried on the part, its time spent, and its evidence kept on the note, the figure before and after. The note shows Worked On.',
      'A way that changes how a movement is played, or places to breathe, waits to be kept or put back.',
      `Any other note: an hour on it. A note on the lines moves them ${pct(PROCESS.own.lines)} of what’s left, and one on the blocking moves it ${pct(PROCESS.own.blocking)} of what’s left and closes one missed call’s gap where one is open, as Catch Up The Blocking does.`,
      'Each craft note and each request of the director’s, given and answered, is counted for life, and each craft note worked with the way you used.',
    ],
    later: [
      'At the next call the note is settled, Taken or Not Taken, its figure then kept beside it, and a change still waiting is kept and played at it.',
      'Once another note comes, the settled one moves under The Director’s Notes So Far, below the last note: each earlier note with what came of it, and the way it was worked with its figure before, after and at the next call.',
      'At the next work-through, where the same note comes again: “Better since the last note.” if it was taken, and “Still:” if it wasn’t; either way, where you worked it a way, the way you tried with its figure then and now.',
      'When the run closes, the notes still open go into the coursework’s ledger: what you want as the choices, listening and a relationship as the work with your partner, lines as the lines, a skill as that skill, the rest as rehearsal on its feet. A note on the director’s request stays with the part.',
      'Looking Back, at the closing, counts the notes taken and those answered in the work.',
    ],
    interpret: [
      'The note names its place, “in the second half”, “by the close”; a note on the whole part says “the whole play”.',
      'The words come from what holds the place back most, by the quality it costs: believability or interpretation is “I don’t know what you want…”, connection “Who are they to you…?”, responsiveness “You’re not taking what they give you…”, execution “The physical life … isn’t clean yet”, consistency “It sags in…”. Tiring named as a problem of its own is “You’re spent by…”, and a turn into a movement “The change into … lurches”. A movement held back most by tiring is given “It sags in…”, a note on its pacing.',
      '“Still:” is the same note again, unanswered. “Better since the last note.” means it was answered, and more is asked.',
      'A craft note on an ability or technique your work keeps coming back to, the one Your Work So Far names, ends “It’s your … again: it’s held back … of your pieces before this.” The words change, and the note, its figure and what answers it stay as they are.',
      'Under the note, the figure before, after and at the next call says whether the change held.',
    ],
    unavailable: [
      '“There’s no note to work on.”: none given yet, or the last one settled at a call.',
      '“You’ve worked on it: the next call will show it.”',
      '“This note asks for the part played another way: change it under How You’ll Play It.” and, once you have, “You’ve changed how you play it: the next call will show it.”',
      '“That isn’t one of the ways at this note.”',
      '“There’s no way left at this note that hasn’t been tried and put back.”',
      '“Keep or put back the change you tried first.”',
      '“Learn some of the part first: there’s nothing to rehearse without it.”',
      '“Not from a hospital bed.”, “You’re asleep.”, “You’re too tired to work on your feet. Sleep first.” or an injury’s “Not with …; it has … days yet to mend.”',
      '“You’re at … until ….”, or “… starts at …: there isn’t the time before it.”',
      '“You aren’t cast in anything there.” and “The run is over.”',
      LOCKED,
    ],
    mistakes: [
      'Leaving a note on the director’s request to the calls: Work On The Note won’t take it, and it comes back at each work-through until you change How You’ll Play It to the side asked for.',
      'Putting a way back and counting the note answered: the note stays open, and that way isn’t offered for it again. Work it another way before the next call.',
      'Leaving a craft note to the calls: it’s taken only if the next call finds its problem gone from the forecast, and where the director gives it again, it comes back as “Still:”.',
    ],
    related: ['productions.part', 'coursework.workbook', 'productions.playing', 'productions.nights', 'craft.identity'],
    connections: [
      { to: 'productions.part', kind: 'prerequisite', why: 'A note comes at a work-through call you come to; one on the lines or the blocking comes first while either is short.' },
      { to: 'coursework.workbook', kind: 'immediate', why: 'A craft note’s ways are Work It Through’s, and working one is a try kept in the part’s workbook.' },
      { to: 'productions.nights', kind: 'evaluation', why: 'The share of notes taken is part of a night’s preparation, and of Growth From A Night.' },
      { to: 'craft.identity', kind: 'history', why: 'Each note on the craft given, worked and answered counts for life in Taking Direction, with the way you reach for most; a note on the weakness your work keeps coming back to names it, with its count.' },
      { to: 'coursework.feedback', kind: 'history', why: 'Notes still open when the run closes go into the coursework’s ledger, and the next work can ask for them.' },
      { to: 'craft.profile', kind: 'immediate', why: `Working a note trains adaptability, and a note taken makes that call’s growth ${pct(PROCESS.noteTaken - 1)} more.` },
      { to: 'productions.playing', kind: 'optional', why: 'A choice against the director’s request comes back as a note until the choice changes.' },
    ],
    example: {
      setup: `In the ${CARLOTTA.name}, off book and with the blocking set, at stamina half of full. A new play is judged in its two halves, and at a work-through the director says “You’re spent by the second half: find where the play lets you breathe.”`,
      steps: [
        `From the ways beside the note, choose ${ADJUSTMENTS.breathe.label}.`,
        `Press Work On The Note: ${ADJUSTMENTS.breathe.label}. It takes ${ADJUSTMENTS.breathe.minutes} minutes, and the toast gives the second half’s figure before and after.`,
        'Under Work It Through, press Keep It.',
      ],
      result: `Tiring took ${pct(1 - SPENT_BEFORE)} off what it reaches in the second half; now it takes ${pct(1 - SPENT_AFTER)}, as places to breathe leave ${pct(WORKBOOK.breathe)} of the evening’s load on stamina. At the next call the note shows Taken, its figure kept beside it, and that call grows you ${pct(PROCESS.noteTaken - 1)} more.`,
    },
  },
  {
    id: 'productions.playing',
    title: 'How You’ll Play A Part',
    goal: 'productions',
    covers: ['school.choose_part_playing'],
    synonyms: ['how you’ll play it', 'play it this way', 'change how you play it', 'measured or driven', 'restrained or expansive', 'set or open', 'leave the pace open', 'doesn’t fit'],
    questions: ['How should I play my part?', 'What does the director’s request do?', 'What happens if I change my mind?', 'Why does a choice say it doesn’t fit?', 'How long does a choice take to rehearse in?'],
    where: { route: ROUTE, tab: TAB.casting, label: 'School, Casting, How You’ll Play It' },
    available: `${OPENED}, while a part you’re cast in has calls to come.`,
    short: `How You’ll Play It sets a part’s pace (Measured or Driven), scale (Restrained or Expansive) and structure (Set or Open), or leaves any of them open. Each side leans the night’s quality dimensions and draws on abilities of its own, and the table shows what the part would come to played each way, fully prepared. A choice is rehearsed in at every call after it’s made, and each night reads how far. In ${pct(DIRECTION.asks)} of productions the director asks for one side; a side against the request, or one the play doesn’t take, holds what it leans on to ${pct(MISFIT)}.`,
    steps: [
      'Open School, then Casting, and find How You’ll Play It under your production’s rehearsal process.',
      'Read the table: each side with what it is, What It Draws On, and Fully Prepared, the night it would make played that way with everything else complete. A side that doesn’t fit says why.',
      'Pick a side on any axis, or Leave The Pace Open (and the same for scale and structure). The line under the table gives the night played this way against nothing chosen.',
      'Press Play It This Way, or Change How You Play It once a choice is made.',
    ],
    needs: ['A part you’re cast in, with calls still to come.', 'A choice that differs from the one you have: the button is grayed until it does.'],
    costs: [
      { label: 'Time', value: 'None: the choice takes no time, and the calls rehearse it in' },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'Pace', value: axisFact('measured', 'driven') },
      { label: 'Scale', value: axisFact('restrained', 'expansive') },
      { label: 'Structure', value: axisFact('set', 'open') },
      { label: 'Rehearsed In', value: `Every call after the read-through rehearses it in, ${pct(CALL_GAIN)} of what’s left: complete at the play’s own mark, ${pct(PLAYING.complete)} where the play leans neither way on the side or has no text to read it against, as a festival of new plays has, and ${pct(PLAYING.complete - GRAIN.prep)} to ${pct(Math.min(1, PLAYING.complete + GRAIN.prep))} by how well the play suits it; ${word(CALLS_TO_COMPLETE)} calls from nothing to ${pct(PLAYING.complete)}. Short of it, what it leans on reads as preparation not done`, estimate: true },
      { label: 'A Change Of Mind', value: `Keeps ${pct(PLAYING.keptOnChange)} of what was rehearsed in` },
      { label: 'Doesn’t Fit', value: `A side the play doesn’t take, or one against the director’s request, holds each dimension it leans on to ${pct(MISFIT)} of itself` },
      { label: 'Fully Prepared', value: 'The evaluation’s own night for the part played that way, as a supporting part at the School, rested, every part of preparation complete, with no draw' },
    ],
    now: [
      'The choice is kept on the part, with what was rehearsed in before it as a change keeps it, and the toast says how far it’s rehearsed in.',
      'Leaving every axis open clears the choice.',
      'The sides you choose are kept among your habits.',
    ],
    later: [
      'Each call after the read-through rehearses it in further.',
      'At a work-through, a choice against the director’s request is the note, “I want it …”, and it’s taken at the next call if the choice has changed.',
      'Each night reads it: what it leans on, what it draws on, and how far it’s rehearsed in.',
      'Work It Through offers a movement played another way only on an axis the whole part leaves open.',
    ],
    interpret: [
      'Fully Prepared shows what a way can reach with everything complete; A Night Now, above it, shows the part as it stands today.',
      'At full ability every side that fits reaches 100. Below it, a side that leans on what you do well shows you better.',
      '“Doesn’t fit:” under a side gives the reason: the play’s own, or “The director has asked for it …”.',
      '“Your choice now is rehearsed in to …% (complete at …%)” is how far the calls have taken it, against the play’s own mark.',
    ],
    unavailable: [
      '“You aren’t cast in anything there.”',
      '“The run is over.”: the chooser leaves the panel once the run’s calls are behind it.',
      'Play It This Way stays grayed until a side differs from your choice.',
      LOCKED,
    ],
    mistakes: [
      `Choosing late: a choice takes ${word(CALLS_TO_COMPLETE)} calls to rehearse in, so in a run of ${CARLOTTA_CALLS} calls one made after the ${ordinal(LATEST_CHOICE + 1)} isn’t complete by the opening, and the ${ordinal(LATEST_CHOICE)} is the last to choose after.`,
      `Changing your mind late: ${pct(1 - PLAYING.keptOnChange)} of what was rehearsed in goes, and the calls left may not bring it back.`,
      `Playing against the director’s request: what it leans on holds at ${pct(MISFIT)} every night, and the note comes back at each work-through.`,
      'Expecting Learn The Part, Work It Through or a note worked to rehearse the choice in: only the calls do.',
    ],
    related: ['productions.notes', 'productions.nights', 'coursework.playing', 'craft.identity'],
    connections: [
      { to: 'productions.casting', kind: 'prerequisite', why: 'Only a part you’re cast in, with calls to come, can be chosen how to play.' },
      { to: 'productions.part', kind: 'scheduled', why: `Each call after the read-through rehearses the choice in, ${pct(CALL_GAIN)} of what’s left.` },
      { to: 'productions.notes', kind: 'immediate', why: 'A choice against the director’s request is the note at the next work-through.' },
      { to: 'productions.nights', kind: 'evaluation', why: 'Each night reads the choice: what it leans on, what it draws on, and how far it’s rehearsed in.' },
      { to: 'craft.identity', kind: 'history', why: 'The sides you choose are kept as habits in Your Work So Far.' },
      { to: 'coursework.playing', kind: 'optional', why: 'A scene for class is chosen the same way, on the same three axes.' },
    ],
    example: {
      setup: `A first-year cast in the ${CARLOTTA.name}, ${CARLOTTA_CALLS} calls in all, the director asking for nothing.`,
      steps: [
        `After the read-through, choose ${APPROACH_EFFECT.driven.label} and press Play It This Way.`,
        `After the ${ordinal(SWITCH_AT)} call, change to ${APPROACH_EFFECT.measured.label}: the ${pct(PREP_AT_SWITCH)} rehearsed in keeps ${pct(PLAYING.keptOnChange)}, ${pct(PREP_KEPT)}.`,
        `The ${word(CARLOTTA_CALLS - SWITCH_AT)} calls left rehearse it in.`,
      ],
      result: `By the opening ${APPROACH_EFFECT.measured.label} stands at ${pct(PREP_END)}, ${PREP_END < PLAYING.complete ? `short of the ${pct(PLAYING.complete)} that completes it, so every night reads what it leans on short of preparation` : 'complete'}. Kept on ${APPROACH_EFFECT.driven.label}, the ${CARLOTTA_CALLS - 1} calls after the read-through would have taken it to ${pct(PREP_STAYED)}.`,
    },
  },
  {
    id: 'productions.nights',
    title: 'The Nights',
    goal: 'productions',
    covers: [],
    synonyms: ['performance night', 'opening night', 'night band', 'off night', 'remarkable night', 'nights together', 'judged in movements', 'tiring late in the play', 'slip in the company', 'looking back', 'director’s note at the closing'],
    questions: ['How is a night judged?', 'What makes a night off, solid, strong or remarkable?', 'Why did I tire in the second half?', 'What does the company do to my night?', 'What happens if I miss a performance?', 'What’s Looking Back?'],
    where: { route: ROUTE, tab: TAB.casting, label: 'School, Casting, Your Nights' },
    available: `${OPENED}, from the first performance of a part you’re cast in.`,
    short: `Each performance is judged, the part as you play it that night, in the play’s movements: two at least, by its tones in order and each turn within them, and a new play’s two halves; more than three ask discipline to hold the score through them. Each movement reads its own blocking and any work on it, its tones lean what counts, stamina tells more the later it falls, and a slip carries into the next until composure and adaptability recover it. The night is the movements’ mean, in a band at LAMDA’s pass, merit and distinction: Off, Solid, Strong or Remarkable. With classmates in the cast, the night together, their contribution blended in, is what the night leaves you feeling; your own night is your result.`,
    steps: [
      'Be in New Haven, awake and well at the curtain: the performance is on your calendar, and the clock stops at it.',
      'Afterward, Casting shows Your nights by band under the production, and The Nights Together under its rehearsal process where classmates are in the cast.',
      'Each night is kept in your work, movement by movement, with what held it back.',
      'After the closing, read The Director’s Note and Looking Back, in the notices and on the production’s panel.',
    ],
    needs: [
      'A part you’re cast in, its performance on your calendar. An understudy plays only when sent on, and at the run-through.',
      'In New Haven, awake, out of hospital and not laid up at the curtain. In hospital, laid up or with the day called in sick, the night is covered and excused.',
    ],
    costs: [
      { label: 'Time', value: `A School performance at eight, ${hoursOf(150)}; Yale Rep evenings at eight and Sundays at two, three hours; a Cabaret show ${hoursOf(90)}; a Summer Cabaret night ${hoursOf(150)}`, estimate: true },
      { label: 'Money', value: 'None' },
      { label: 'The Body', value: `${ESTIMATE.energy.performance} energy; a stage’s risk of injury at the School, the Rep and the Summer Cabaret; and nerves, ${ATTRIBUTES.eventWeight.performance} stress before the curtain by your nature, less the more composure you have`, estimate: true },
    ],
    reads: [
      { label: 'The Part’s Techniques', value: 'What the play asks, its techniques and its kinds of play, as Why This Cast lists them' },
      { label: 'The Abilities', value: 'Believability from emotional depth and a little imagination, interpretation from imagination, connection from presence (a house’s, weighed heavily) and listening, execution from memory (every line of the part) and the voice and the body, consistency from composure and discipline (the score kept night after night), responsiveness from listening and adaptability; believability weighs most. The play’s own demands add to them: its partners listening, a grave play emotional depth, a comic one focus, a lyric or grotesque one imagination, verse memory, a fight or a dance the body and discipline', estimate: true },
      { label: 'Preparation', value: `The lines, the blocking and the notes taken, against what coming to every call makes and never under ${pct(NIGHT_LEAST.lines)} of the lines or the blocking; and how far your choice in How You’ll Play It has been rehearsed in, against its mark, ${pct(PLAYING.complete - GRAIN.prep)} to ${pct(Math.min(1, PLAYING.complete + GRAIN.prep))}` },
      { label: 'Each Movement', value: `Its own blocking with any work on it, and its tones leaning what counts: ${TONES}`, estimate: true },
      { label: 'Stamina', value: `A drain growing through the evening, none at the first movement and at the last up to ${pct(PIECE.drain)} off what tiring reaches, by the evening’s load, ${pct(PIECE.load.night)} for its length and more for the play’s physical and vocal work, and how far your stamina is from full`, estimate: true },
      { label: 'A Slip', value: `A movement ${PIECE.slipAt} or more points under what it was expected to come to carries ${pct(PIECE.rattle)} of it into the next movement’s believability and consistency, less as composure and adaptability recover it. At full abilities and mastered techniques there’s no draw, and so no slip`, estimate: true },
      { label: 'The Day', value: 'Readiness at the curtain, the flu, and an injury by what it limits' },
      { label: 'How Hard', value: `By the part and the stage: a School featured, supporting or leading part ${NIGHT_DIFFICULTY.school.featured}, ${NIGHT_DIFFICULTY.school.supporting} or ${NIGHT_DIFFICULTY.school.lead}; at Yale Rep ${NIGHT_DIFFICULTY.rep.featured}, ${NIGHT_DIFFICULTY.rep.supporting} or ${NIGHT_DIFFICULTY.rep.lead}. An understudy plays the lead they cover`, estimate: true },
      { label: 'The Bands', value: `Under ${EVALUATION.bands.working} Off, from ${EVALUATION.bands.working} Solid, from ${EVALUATION.bands.strong} Strong, from ${EVALUATION.bands.exceptional} Remarkable: LAMDA’s pass, merit and distinction` },
      { label: 'The Company', value: `The classmates cast with you, as one partner: their preparation the share of calls they keep, their timing their listening and focus, and a slip on the night as likely as ${pct(ENSEMBLE.slipRate)} of how unreliable they are, part of which your listening and adaptability cover. Blended into connection and responsiveness most, by how much the play is played off a partner`, estimate: true },
    ],
    now: [
      'The night’s band is kept on the run, and the night in your work.',
      `Morale: Strong or Remarkable lifts it ${ESTIMATE.nights.lift}, Off takes ${ESTIMATE.nights.sting}, by the night together where there’s a company and by your own night where there isn’t. A Remarkable night of your own adds a little presence.`,
      `Before a School or Rep curtain, friends in the cast lift your morale, a point each up to ${BONDS.most}, by how much you need company; a cast with none weighs on you if you need it. A third-year in the Rep’s company has the class’s others asked in listed as the cast; an understudy sent on plays with none of the class.`,
      'Your craft grows by the night, the scene, feeling and voice and what the play asks, scaled by Growth From A Night; listening grows, and the play’s kinds of play are practiced.',
      'The night’s delivery, its preparation and the day’s condition, goes into the run record the next casting reads.',
    ],
    later: [
      'At the closing the director’s note comes: how the nights went on average and, where an ability or technique cost the nights half a point or more each on average, the one that cost them most, to work on. A run with a night played is kept among your milestones; a School or Rep run whose every night went on without you isn’t, and its note, “The run went on without you: …”, shows on the production’s panel as well as in the notices.',
      'Looking Back, once, counts the calls answered, the notes given and taken, the dress, and the nights with the company; what’s still open goes with you into class.',
      `At the term’s evaluation, a run with ${ESTIMATE.workNights} or more nights is read: mostly off falls short of the program’s standards, and strong work is noted.`,
      'The next casting reads your delivery across the runs since the last one.',
    ],
    interpret: [
      'Your own night is the evaluation of your work, and a partner’s slip can’t lower it. The night together can come out above or below it.',
      'The Nights Together gives their average, the slips in the company, and how many you covered.',
      `For the director’s note and the term’s evaluation, an Off night counts ${NIGHT_VALUE.off}, Solid ${NIGHT_VALUE.solid}, Strong ${NIGHT_VALUE.strong} and Remarkable ${NIGHT_VALUE.remarkable}.`,
      'Open a night in your work, and Part By Part shows each movement: its result, its own rehearsal, Tiring or Holding, and a slip or what cost it most. Continuity is read from the movements and isn’t added to the night.',
    ],
    unavailable: [
      'An understudy has a night only when sent on, and at the one run-through.',
      'A night excused, in hospital, laid up or with the day called in sick, is covered and goes unjudged.',
      'The Nights Together shows only with classmates in the cast, at a School production or in the Rep’s company: an understudy sent on, the Cabaret and the Summer Cabaret have none, and there your own night sets the mood.',
    ],
    mistakes: [
      'Missing a School or Rep performance, well and unexcused: a grave breach, academic warning at once (dismissal from warning), and a night delivered at nothing in the record.',
      `Coming in tired: readiness under ${EVALUATION.sufficientReadiness} at the curtain costs every dimension but interpretation, and widens the draw downward.`,
      'Leaving stamina to chance in a long, physical play: the last movement pays. Find Places To Breathe in Work It Through, or train stamina.',
      'Missing a Summer Cabaret performance, not in hospital, laid up or called in sick, ends your summer with the company.',
    ],
    related: ['productions.part', 'productions.notes', 'productions.casting', 'school.standing', 'craft.work', 'craft.identity'],
    connections: [
      { to: 'productions.part', kind: 'prerequisite', why: `The lines and the blocking at what every call makes, and never under ${pct(NIGHT_LEAST.lines)}, complete a night’s preparation.` },
      { to: 'school.standing', kind: 'evaluation', why: `A run with ${ESTIMATE.workNights} or more nights by the term’s evaluation is read: mostly off falls short.` },
      { to: 'productions.casting', kind: 'evaluation', why: 'Each night’s delivery is read by the chair at the next casting; a night missed counts at nothing.' },
      { to: 'craft.work', kind: 'history', why: 'Each night is kept in your work, judged movement by movement, with what held it back.' },
      { to: 'craft.identity', kind: 'history', why: 'The nights with a company count toward Playing With Others in Your Work So Far.' },
      { to: 'body.how', kind: 'immediate', why: `A night Strong or better, the night together where there’s a company, lifts morale ${ESTIMATE.nights.lift}, an Off one takes ${ESTIMATE.nights.sting}, and nerves add stress before the curtain.` },
      { to: 'craft.profile', kind: 'immediate', why: 'A night grows the scene, feeling, voice and what the play asks, scaled by Growth From A Night, and listening with them.' },
      { to: 'coursework.feedback', kind: 'history', why: 'At the closing, the notes still open go into the coursework’s ledger for the next work.' },
    ],
    example: {
      setup: `A part in ${W_TITLE}, if a thesis deals it to you: it plays in ${word(W_SEGMENTS.length)} movements, ${W_MOVEMENTS}, and its body’s work makes it a hard evening on stamina. Your stamina is at half of full, your composure and adaptability at ${pct(W_RECOVER)}.`,
      steps: [
        `${W_SEGMENTS[W_SEGMENTS.length - 1]!.label} falls last: its Stamina reads “Tiring: ${pct(1 - W_LATE)} off”, and the first reads Holding.`,
        `A slip in ${lower(W_SEGMENTS[0]!.label)}, ${W_SLIP} under what was expected, carries into the next: “Shaken by the slip before: ${pct(1 - W_SHAKEN)} off”.`,
        `Your classmates in the cast keep ${pct(COMPANY_KEEPS)} of their calls, with a timing of ${pct(COMPANY_TIMING)}: they bring ${pct(COMPANY_BRINGS)}, and a slip of theirs is ${pct(COMPANY_SLIPS)} likely.`,
      ],
      result: `${W_TITLE} is played off a partner at ${W_LEVEL} of 3, so ${pct(CONNECTION_SHARE)} of the connection is theirs: at your own ${YOUR_CONNECTION} it comes to ${one(TOGETHER_CONNECTION)} together. Your own night keeps its band on the run; if the night together reaches ${EVALUATION.bands.strong}, Strong, it leaves you ${ESTIMATE.nights.lift} morale up.`,
    },
  },
  {
    id: 'productions.cabaret',
    title: 'Cabaret And Summer Cabaret',
    goal: 'productions',
    covers: ['school.cabaret', 'school.summer_cabaret'],
    synonyms: ['Yale Cabaret', 'join a cabaret show', 'Summer Cabaret', 'join the summer company', 'summer stipend', 'a new piece', 'student theater', 'double-cast'],
    questions: ['How do I join a Cabaret show?', 'Why can’t I join the Cabaret?', 'Does the Summer Cabaret pay?', 'What happens if I miss a Summer Cabaret performance?', 'When does the summer company form?'],
    where: { route: ROUTE, tab: TAB.casting, label: 'School, Casting, The Yale Cabaret And The Yale Summer Cabaret' },
    available: `${OPENED}: the Cabaret in any term, the Summer Cabaret in the spring of the first and second years.`,
    short: `The Yale Cabaret is the students’ own theater. Join A Cabaret Show puts you in a new piece, one a term, in a week at least ${CABARET_WEEKS} weeks off and clear of your calls, shifts and days off: ${YALE_CABARET.rehearsalEvenings} weekday evenings of rehearsal and ${YALE_CABARET.shows.length} shows, unpaid. The Yale Summer Cabaret is a company for the summer. Join The Summer Company in the first or second spring, in good standing and by ${APPLY_BY}, and you’re in its three shows, each with ${word(SUMMER_CABARET.rehearsalWeeks)} weeks of afternoon rehearsals, for ${usd(SUMMER_CABARET.stipendWeekly)} a week.`,
    steps: [
      'Open School, then Casting, and find The Yale Cabaret.',
      'Press Join A Cabaret Show: the first week that fits is found, and every evening and show goes on your calendar. Where you can’t join, the reason shows in place of the button.',
      'Rehearse and play it as any part: its rehearsal process, notes and nights are under the panel.',
      `In a first or second spring, find The Yale Summer Cabaret below it and press Join The Summer Company by ${APPLY_BY}.`,
      'Each summer show is listed with your part, its dates and the nights played. The rehearsal process is the show in rehearsal once its read-through is past, even while another still plays; until then, the show playing or the next to come.',
    ],
    needs: [
      'For the Cabaret: a student of the School, off academic warning, not on a leave, the term begun, no Cabaret show this term yet, a week that fits, and not cast at the School and the Rep both in the weeks it would rehearse and play.',
      `For the Summer Cabaret: good standing, not on a leave, the spring of the first or second year, by ${APPLY_BY}, and not in this summer’s company already.`,
    ],
    costs: [
      { label: 'Time, The Cabaret', value: `${YALE_CABARET.rehearsalEvenings} weekday evenings from ${clock(YALE_CABARET.rehearsalFrom)}, ${hoursOf(YALE_CABARET.rehearsalMinutes)} each, then ${YALE_CABARET.shows.length} shows of ${hoursOf(90)}: Thursday at eight, Friday and Saturday at eight and eleven`, estimate: true },
      { label: 'Time, The Summer', value: `For each of three shows, Tuesday to Saturday afternoons from ${clock(SUMMER_CABARET.rehearsalFrom)} for the ${word(SUMMER_CABARET.rehearsalWeeks)} weeks before it, ${hoursOf(SUMMER_CABARET.rehearsalMinutes)} each, but for an afternoon when another show plays its Saturday matinee; evenings at eight, dark on Mondays, and Saturday matinees at two`, estimate: true },
      { label: 'Money', value: `The Cabaret is unpaid. The Summer Cabaret pays ${usd(SUMMER_CABARET.stipendWeekly)} a week on Fridays at five, from the first rehearsal week to the week after the closing, with federal and Connecticut tax withheld, and FICA too unless you’re a nonresident on an F-1`, estimate: true },
    ],
    reads: [
      { label: 'Your Cabaret Week', value: `The first Thursday at least ${YALE_CABARET.leadDays} days off whose week misses a recess, whose evenings and shows miss every casting call, lab, night on call and shift, and no later than the term’s last class day`, estimate: true },
      { label: 'Your Part', value: 'Cast within the company: a lead if you’re among the class’s top four on what the play asks, a supporting part if not. The Cabaret’s is a new piece; each summer show is a real play, with the part it names for you', estimate: true },
      { label: 'The Evenings', value: 'A Cabaret show’s: the read-through, two blocking evenings, rehearsals, and the last the technical and dress at once. A summer show’s: a full production’s' },
      { label: 'The Run Record', value: `A Cabaret or Summer run counts ${pct(R.weight.cabaret)} of a School production’s in the delivery the chair reads. The term’s evaluation reads a Cabaret run; the Summer Cabaret reaches casting only` },
    ],
    now: [
      'Joining the Cabaret: your part, and every evening and show on your calendar at once.',
      'Joining the summer company: its three plays named with your part in each, and every afternoon and night of the three on your calendar.',
    ],
    later: [
      'Each evening and show is answered as a call is: lines, blocking and notes as for any part, and each show a night.',
      'The closing night played puts the show among your credits, and so does a closing night missed, excused or not, once a night of the show has been played; either way the run closes, with the director’s note and Looking Back.',
      'The summer stipend is paid each Friday at five, tax withheld, and counted as wages on the year’s return.',
      'Put on academic warning, on a leave or out of the School during a Cabaret show, the calls still to come are called off and not held against you; what you played stays.',
      `Hurt on a Summer Cabaret stage, workers’ compensation pays the care; kept off it, ${pct(CT_COMP.share)} of the whole stipend as well, Connecticut’s minimum for a week under ${usd(CT_MINIMUM_UNDER)} and more than its ${pct(CT_COMP.share)} after tax; nothing for the first ${word(CT_COMP.waitingDays)} days unless you’re off more than ${word(CT_COMP.retroAfterDays)}. For the days it keeps you off, the stipend stops, the compensation paid in its place. Laid up by anything else, the company covers the nights and the stipend goes on.`,
    ],
    interpret: [
      `Performed counts the Cabaret shows played of ${YALE_CABARET.shows.length}, with the calls still ahead beside it.`,
      'The summer panel lists each show with the nights played, and once the company has let you go its subtitle says “The company let you go”.',
      'A day called in sick excuses a Cabaret evening or show and a Summer Cabaret call, as hospital or being laid up does: the blocking an evening sets without you is still a gap to catch up, a show missed so isn’t held against the run record, and the summer company keeps you.',
    ],
    unavailable: [
      '“The Cabaret is for students.”',
      '“Nobody on academic warning may take part in the Cabaret.”',
      '“You’re on leave: a student on leave takes no part in the Yale Cabaret.”',
      '“The Cabaret’s season begins with the term.”',
      '“You’re in a Cabaret show this term already.”',
      '“No Cabaret week this term is three weeks off and clear of your recesses and calls.”',
      '“Cast in two productions at once, you can’t take a Cabaret show: the Bulletin bars double-cast actors from it.”',
      '“The Summer Cabaret’s company takes a student in good standing.”',
      '“You’re on leave: a student on leave takes no part in the Summer Cabaret.”',
      '“The company forms in the spring, for students with a year still to come.”',
      '“You’re in this summer’s company.”',
      '“This summer’s company has formed.”',
      LOCKED,
    ],
    mistakes: [
      `Trusting the Cabaret’s evenings to learn the part: all ${YALE_CABARET.rehearsalEvenings} kept leave the lines at ${pct(CABARET_PAR.lines)} and the blocking at ${pct(CABARET_PAR.blocking)}, under the ${pct(NIGHT_LEAST.lines)} a show asks. Learn The Part between evenings, and work the blocking note when it comes.`,
      'Missing a Summer Cabaret performance, not in hospital, laid up or called in sick: the company lets you go, the calls and the stipend after it stop, and the week is paid for the days worked.',
      'Leaving the Cabaret late in a term: the week has to be three weeks off and no later than the last class day, so a late term may have none.',
      'Calling in sick for a Cabaret evening and leaving the blocking it set: excused, it’s still a gap in the book. Catch Up The Blocking before the next evening that builds on it.',
    ],
    related: ['productions.part', 'productions.nights', 'productions.casting', 'school.standing', 'taxes.return'],
    connections: [
      { to: 'school.standing', kind: 'prerequisite', why: 'Academic warning bars the Cabaret and takes you out of a show under way; the summer company takes good standing.' },
      { to: 'productions.casting', kind: 'prerequisite', why: 'A Cabaret week has to miss every casting call and night on call; with the School and the Rep both calling in its weeks, you can’t take one.' },
      { to: 'day.calendar', kind: 'immediate', why: 'Joining puts every evening, call and show on the calendar at once.' },
      { to: 'productions.part', kind: 'immediate', why: 'Each show has its own rehearsal process, lines, blocking and notes, under its panel.' },
      { to: 'productions.nights', kind: 'evaluation', why: 'Each show is a night judged as any other, kept on the run and in your work.' },
      { to: 'productions.casting', kind: 'evaluation', why: `A Cabaret or Summer run counts ${pct(R.weight.cabaret)} of a School production’s in the delivery the chair reads.` },
      { to: 'money.affairs', kind: 'scheduled', why: `The summer stipend lands in your account each Friday at five, ${usd(SUMMER_CABARET.stipendWeekly)} a week before tax.` },
      { to: 'taxes.return', kind: 'history', why: 'The summer stipend is wages on the year’s return, its tax withheld already.' },
    ],
    example: {
      setup: `A first-year in the spring of ${SUMMER_YEAR}, in good standing, before ${APPLY_BY}.`,
      steps: [
        'Press Join The Summer Company.',
        `The first show rehearses from ${dated(FIRST_SUMMER_CALL, false)} and opens ${dated(SUMMER[0]!.from, false)}; the third closes ${dated(SUMMER[SUMMER.length - 1]!.to)}.`,
      ],
      result: `Three shows, each with a part cast within the company, and ${STIPEND_FRIDAYS} Fridays of stipend, ${usd(STIPEND_FRIDAYS * SUMMER_CABARET.stipendWeekly)} before tax. Miss a performance unexcused and the rest stops that week.`,
    },
  },
  {
    id: 'productions.plays',
    title: 'Plays To Read',
    goal: 'productions',
    covers: ['plays.read', 'plays.research'],
    synonyms: ['read a play', 'research a play', 'Haas Arts Library', 'contemporary plays', 'first production', 'who licenses it', 'a part for you', 'read it again'],
    questions: ['Where can I read a play?', 'What does reading a play do?', 'Why can’t I read a play?', 'What does research find?', 'Why did reading again teach me nothing?'],
    where: { route: ROUTE, tab: TAB.coursework, label: 'School, Coursework, Plays To Read' },
    available: `${OPENED}. A copy is lent once orientation’s tour has shown you the library.`,
    short: `Plays To Read lists ${CONTEMPORARY_PLAYS.length} plays first staged since 2000, with their facts as their theaters and publishers give them. Read It borrows the Haas Arts Library’s copy for a close first read, ${hoursOf(PLAYREADING.minutes.full)} or ${hoursOf(PLAYREADING.minutes.short)} for a short play or a monologue, and leaves a note on its form, its published cast and whether there’s a part in it for you, and its setting. Research It, once read, finds its first production, its first edition and who licenses it. Each trains your script analysis, and a read your imagination too. None of them is played: their texts are under copyright.`,
    steps: [
      'Open School, then Coursework, and find Plays To Read below the coursework.',
      'Each row has the play, its playwright, where it was first staged, its cast as published, and whether there’s a part for you.',
      'Press Read It, or Read It Again; the note shows as a toast and under Your Latest Notes.',
      'Once a play is read, press Research It.',
    ],
    needs: [
      'At school, with orientation’s tour done or orientation behind you.',
      'Free for the read’s time.',
      'For Research It: read first, and not researched yet.',
    ],
    costs: [
      { label: 'Time', value: `Read It: ${PLAYREADING.minutes.full} minutes, ${PLAYREADING.minutes.short} for a short play or a monologue; read again, ${pct(PLAYREADING.again)} of that. Research It: ${PLAYREADING.minutes.research} minutes`, estimate: true },
      { label: 'Money', value: 'None: the library lends it' },
    ],
    reads: [
      { label: 'A First Read', value: 'Trains script analysis and imagination, each as much as a step of coursework that trains it', estimate: true },
      { label: 'A Read Again', value: `Half the training, and none within ${PLAYREADING.freshDays} days of the last read. The note turns to what wasn’t noticed before`, estimate: true },
      { label: 'Research', value: 'Script analysis once more, as much as a first read', estimate: true },
      { label: 'A Part For You', value: 'By the published cast: a part for an actress where it has women, for an actor where it has men, and none where you’re more than ten years younger than its youngest part' },
    ],
    now: [
      `The clock moves on the read’s time, and the note is kept with the play, its last ${PLAYREADING.notesKept}.`,
      'Read It becomes Read It Again, the Read column counts the reads, and Research It appears.',
      'Research It: the play shows Researched, and the note gives its first production, first edition and who licenses it.',
    ],
    later: ['The training shows as your craft grows, each step kept on the development history.'],
    interpret: [
      'Read shows Not Yet, Once, or how many times; Researched shows under it once researched.',
      '“A part for you” or “No part for you” is by the published cast’s women and men; neither shows where they aren’t on record, and the Cast column says “Not on record” where the cast isn’t.',
      '“Too soon after it to see it fresh.” means no training this time.',
      'Your Latest Notes shows the five most recent, one for each play.',
    ],
    unavailable: [
      '“The library isn’t known to you yet: the tour shows you it.”',
      '“A copy is borrowed from the Haas Arts Library, which lends to students.”: after school.',
      '“Read it first: research needs questions.”',
      '“Its first production is researched: there’s nothing more on record to find.”',
      '“You’re at … until ….”, or “… starts at …: there isn’t the time before it.”',
      LOCKED,
    ],
    mistakes: [
      `Reading the same play again within ${PLAYREADING.freshDays} days: it costs ${pct(PLAYREADING.again)} of the time and trains no craft. Wait a month.`,
      'Missing orientation’s tour: the library stays unknown to you until the tour is caught up.',
      'Expecting to play one: none of them is played in SLATE. The scenes for class are public-domain plays and scenes written for SLATE.',
    ],
    related: ['coursework.prepare', 'school.orientation', 'craft.profile'],
    connections: [
      { to: 'school.orientation', kind: 'prerequisite', why: 'The tour shows you the Haas Arts Library, where every copy is borrowed.' },
      { to: 'craft.profile', kind: 'immediate', why: 'A read trains script analysis and imagination, and research script analysis again, each kept on the development history.' },
      { to: 'coursework.prepare', kind: 'optional', why: 'Script analysis, which every read trains, is part of the craft a scene’s preparation draws on.' },
    ],
    example: {
      setup: 'A first-year in New Haven, the tour done, with a free evening.',
      steps: [`Press Read It on ${PLAY.title}, by ${PLAY.by}.`, `${PLAY_MINUTES} minutes later, read the note.`, 'Press Research It.'],
      result: `The note reads “${PLAY.title}, by ${PLAY.by}, read through.”, then its form, “The cast as published: ${PLAY_CAST}.”, whether there’s a part for you, and its setting. Research, ${PLAYREADING.minutes.research} minutes more, finds it first staged in ${PLAY.premiere.year} at ${PLAY.premiere.venue}${PLAY.published ? `, first published in ${PLAY.published.year} by ${PLAY.published.by}` : ''}, and who licenses it. Read again the next week, it takes ${Math.round(PLAY_MINUTES * PLAYREADING.again)} minutes and trains nothing.`,
    },
  },
];
