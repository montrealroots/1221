/**
 * SLATE — the Actor Showcase, DRAM 793b, in the final term (from 2026-10-21, the owner's brief 19, W1 and W2: the
 * criteria and the design in `docs/verification/career-2026-10-20/`), and the early degree the Bulletin doesn't offer
 * (A5). Until 2026-10-09 the career engine read the course's last class showing as the showcase (`showcaseSceneSeen` in
 * `systems/career.ts`); the showcase went with the career in the scope reset, and the course went on setting a class
 * scene each fortnight with nothing after it. This is the showcase itself, built on the School's course, calls and
 * coursework, not beside them.
 *
 * **Verified** (`docs/research/career-2026-10-20/yale.md`: B27, the Bulletin 2026–2027; B26, 2025–2026; SC26 and SC25, the
 * School's showcase pages):
 * - "In their final term, students choose and rehearse scenes, which are presented to agents, managers, casting
 *   directors, and other members of the industry in New York and Los Angeles"; the faculty assist with the choice
 *   (B27 p.33).
 * - A student with an outstanding Incomplete "must satisfy the course requirements by the fourth week of their final
 *   semester and before course DRAM 793b, Actor Showcase, begins" (B27 p.26).
 * - 2026: New York on Monday April 27 and Tuesday April 28, Los Angeles on Tuesday May 5 (SC26), after spring classes
 *   ended on Friday April 24 and before Commencement on May 18 (B26 p.6); 2025's fell the same way (SC25).
 * - "on rare occasions the faculty of David Geffen School of Drama may reduce the residency requirement, but in no case
 *   below a minimum of two years" (B27 p.21), with no criteria, way to ask or Acting case published.
 *
 * **The game's rule from them**, each ASSUMPTION said so here and where a player reads it:
 * - The dates are worked out from the final term's own class calendar (`classPeriod`), never written down for a year:
 *   New York on the Monday and Tuesday after its classes end, Los Angeles the Tuesday after (`showcaseCalendar`).
 * - ASSUMPTION: each showcase day is one School call from New Haven with the trip inside its hours (`travelMinutes: 0`,
 *   `SHOWCASE.days`). The showings' hours are SC26's; the trips' are the game's. Los Angeles's ran from seven in the
 *   morning on the first day it was written (2026-10-21) and was moved to nine the same day, the hour the School's other
 *   early calls keep: a life played on without the clock stopping for it (a journey, a scenario) is often still asleep
 *   at seven, and a nine o'clock flight still lands for the 1 PM Pacific showing.
 * - ASSUMPTION: the course's rehearsals are School rehearsal calls at the School's rehearsal hours (Tuesday to Friday
 *   from three, `SCHOOL_SEASON`), three hours each, over the last two weeks of classes.
 * - Eligibility: enrolled in the final term (begun there, not on leave, not an additional term) and no course still
 *   Incomplete when the term's fourth week ends, read as its Friday at five (ASSUMPTION). The game has Incompletes
 *   (`systems/courserecord.ts`): a course passed short only of excused absences, made up within a month and extendable
 *   once by another, so the fall's Incomplete given a month more is the one that can still be open then.
 * - ASSUMPTION: the faculty offer four scenes, each in either part, from the course's kind of material (a prose
 *   two-hander), first by how each would come out fully prepared for this actor (the judge's own forecast), then by the
 *   genres they know and the scenes they've done well with before; their note on each says which of those it rests on.
 *   The player chooses two by the end of the fourth week; for one who hasn't, the faculty choose their first two.
 * - Each chosen scene is a piece of DRAM 793b's coursework (`systems/coursework.ts`), due at the first showcase day, so
 *   its steps, table work, partner, way of playing and forecast are the coursework's own. It's shown at the first day
 *   it's played (the course's note), played again at the next, and shown again with the note taken in Los Angeles, as a
 *   piece is shown in class and then again with the note taken.
 * - Each scene is judged at each showcase day by the judge (`judgeWork`), with its preparation, the day's condition and
 *   the scene's demands; kept in the work record and the journey (`recordWork`) and in `pro.showcase.performed`.
 * - A showcase day missed is a missed call of the course, as a lab missed is (attendance at calls "is expected and
 *   mandatory", B27 p.24): a call missed in the School's record (`tally`, which the Player Profile's reliability reads),
 *   a meeting of DRAM 793b missed, and the scenes not seen there. A scene played at no showcase day counts as a piece not
 *   shown, and a course with half its pieces not shown isn't passed (`settleCourses`), so DRAM 793b is settled after the
 *   showcase's last day, not at the term review three days before it (`showcaseHolds`). A day missed ill is excused.
 * - Early graduation: no route. The Bulletin's sentence is said on the School's Terms And Award tab and in the Career's
 *   The Way You're On (`EARLY_DEGREE`), and nothing awards the degree in fewer than six terms.
 *
 * Nothing here promises or names an agent's attendance, interest or follow-up: the School presents its students to the
 * guests the Bulletin names, and that's all. The School's follow-up in the week after is the agent's system's (brief 19's
 * W3), scheduled where the showcase's last day has been judged (`endShowcase`).
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { ScheduledItem } from '../core/scheduler';
import type { Person } from '../domain/model';
import { MS_MINUTE, formatDate, formatTime, formatWeekdayDate, type Instant } from '../core/time';
import { spokenList } from '../core/text';
import { CITIES } from '../content/geography';
import { COURSES, YALE_DRAMA, type SchoolDate } from '../content/school';
import { PREP_DIMS, sceneById, templateById, type PrepDim, type Scene } from '../content/coursework';
import {
  ESTIMATE, REHEARSAL_WEIGHTS, academicTerm, actingOf, at as schoolAt, classPeriod, countWords, dayKeyAt, focusAt, grewFrom, isClassDay, keyOf,
  missedCallsOut, offSick, present, schoolEnded, termStart,
} from './school';
import { BAND_LABEL, bandFor, courseworkOf, judgeWork, noteTaken, notesOf, playingPreview, preparedParts, reshow, show, weightsOf, type Assignment, type Band } from './coursework';
import { noteKey, objectiveFor, partnerFor, resolveNote, scenePast, scenesFor, targetDifficulty } from './learning';
import { coursesOf, noteMeeting, settleCourses, type CourseRecord } from './courserecord';
import { bandOfQuality, recordWork } from './evaluation';
import { noteMaterial } from './experience';
import { UNPERFORMED, materialOf, rehearseChoice, sidesOf } from './material';
import { TEMPLATE_TASK } from '../content/tasks';
import { rehearseWays } from './piece';
import { nerves } from './attributes';
import { ensurePro, type ShowcaseRecord } from './pro';

// ---------------------------------------------------------------------------------------------------------------------
// The rules
// ---------------------------------------------------------------------------------------------------------------------

export const SHOWCASE_COURSE = 'DRAM 793b';
/** The course's work, as `content/coursework.ts` sets it: a prose scene with a partner, shown and shown again. */
export const SHOWCASE_TEMPLATE = 'showcase-scene';
/** A showcase rehearsal call or a showcase day. */
export const SHOWCASE_KIND = 'school.showcase';
/** The end of the term's fourth week: the Incompletes read, and the scenes chosen for a student who hasn't. */
export const SHOWCASE_CHECK_KIND = 'school.showcase_check';
export const NEW_YORK = 'us-ny-newyork';
export const LOS_ANGELES = 'us-ca-losangeles';

/**
 * The showcase's figures. The scenes chosen (two) and the cities are the Bulletin's; the showings' hours SC26's; the rest
 * the game's, each ASSUMPTION: four scenes offered; a known genre worth up to ten points of the faculty's ranking and a
 * scene shown Strong or better before five; the check on the Friday of the fourth week at five; rehearsal calls over the
 * last two weeks of classes, from three for three hours; and each day's call from New Haven, its trip inside its hours.
 */
export const SHOWCASE = {
  scenes: 2,
  offered: 4,
  genrePoints: 10,
  strongBefore: 5,
  checkWeek: 4,
  checkHour: 17,
  rehearsal: { weeks: 2, hour: 15, minutes: 180 },
  days: [
    { city: NEW_YORK, weekday: 'Monday', week: 0, hour: 13, minutes: 600, showings: '5 PM and 7:30 PM' },
    { city: NEW_YORK, weekday: 'Tuesday', week: 0, hour: 9, minutes: 480, showings: '1 PM' },
    { city: LOS_ANGELES, weekday: 'Tuesday', week: 1, hour: 9, minutes: 1440, showings: '1 PM, 4:30 PM and 7 PM Pacific time' },
  ],
  source: 'Source: the Yale Bulletin, David Geffen School of Drama 2026–2027, pp.26 and 33, and the School’s 2026 showcase page. Each year’s dates follow the 2026 showcase’s pattern; the calls’ hours, the rehearsals and the faculty’s shortlist are estimated.',
} as const;

/** The rule on early graduation, the Bulletin's sentence quoted in it. */
const EARLY_RULE = 'Graduating early isn’t a route the game offers. The Bulletin says that “on rare occasions the faculty of David Geffen School of Drama may reduce the residency requirement, but in no case below a minimum of two years,” and publishes no criteria for it and no way to ask.';

/**
 * Early graduation (brief 19's A5): the Bulletin's sentence, and what the game makes of it, said word for word on the
 * School's Terms And Award tab (`words`) and in the candidate's line of the Career's The Way You're On (`rule`, `pathwayOf`).
 * The Career's line said the whole of `words` when it was first written (2026-10-21); the built app's walk the same day
 * read when the degree comes twice in its one paragraph, since the line already says it, and from then it says the rule.
 */
export const EARLY_DEGREE = {
  quote: 'on rare occasions the faculty of David Geffen School of Drama may reduce the residency requirement, but in no case below a minimum of two years.',
  rule: EARLY_RULE,
  words: `${EARLY_RULE} So the MFA comes at Commencement after your sixth term.`,
  source: 'Source: the Yale Bulletin, David Geffen School of Drama 2026–2027, p.21.',
} as const;

/** A showcase day grows the course's skills as one of its meetings does, a session each. */
const courseSkills = () => (COURSES.find((c) => c.code === SHOWCASE_COURSE)?.skills ?? []).map((k) => [k, 1] as const);
const courseName = (code: string): string => COURSES.find((c) => c.code === code)?.name ?? code;
const cityName = (id: string): string => CITIES.get(id)?.name ?? id;
const plus = (d: SchoolDate, n: number): SchoolDate => { const t = new Date(Date.UTC(d.year, d.month - 1, d.day + n)); return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() }; };
const weekdayOf = (d: SchoolDate): number => new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
const zoneNow = (): string => CITIES.require(YALE_DRAMA.cityId).timeZone;
const dayWords = (when: Instant): string => formatDate(when, zoneNow());
const shortDay = (when: Instant): string => dayWords(when).replace(/, \d{4}$/, '');

// ---------------------------------------------------------------------------------------------------------------------
// The calendar
// ---------------------------------------------------------------------------------------------------------------------

export interface ShowcaseDay { city: string; at: Instant; minutes: number; key: string; last: boolean; label: string; showings: string }
export interface ShowcaseCalendar { checkBy: Instant; rehearsals: Instant[]; days: ShowcaseDay[] }

/**
 * A final term's showcase on the calendar: the check at the end of its fourth week, its rehearsal calls, and its three
 * days, all from the term's own dates. New York is the first Monday after the last day of classes and the Tuesday after
 * it, Los Angeles the Tuesday a week on, as 2026's and 2025's were.
 */
export function showcaseCalendar(term: number): ShowcaseCalendar {
  const start = termStart(term).date;
  let fourth = plus(start, 7 * (SHOWCASE.checkWeek - 1));
  while (weekdayOf(fourth) !== 5) fourth = plus(fourth, 1);
  const period = classPeriod(term);
  let monday = plus(period.to, 1);
  while (weekdayOf(monday) !== 1) monday = plus(monday, 1);
  const rehearsals: Instant[] = [];
  for (let d = plus(period.to, -7 * SHOWCASE.rehearsal.weeks + 1); keyOf(d) <= keyOf(period.to); d = plus(d, 1)) {
    const wd = weekdayOf(d);
    if (wd >= 2 && wd <= 5 && isClassDay(term, d)) rehearsals.push(schoolAt(d, SHOWCASE.rehearsal.hour));
  }
  const days = SHOWCASE.days.map((x, i) => {
    const d = plus(monday, 7 * x.week + (x.weekday === 'Tuesday' ? 1 : 0));
    return { city: x.city, at: schoolAt(d, x.hour), minutes: x.minutes, key: keyOf(d), last: i === SHOWCASE.days.length - 1, label: `The Actor Showcase In ${cityName(x.city)}`, showings: x.showings };
  });
  return { checkBy: schoolAt(fourth, SHOWCASE.checkHour), rehearsals, days };
}

// ---------------------------------------------------------------------------------------------------------------------
// The record
// ---------------------------------------------------------------------------------------------------------------------

/** The showcase on the record, where it has begun. */
export const showcaseOf = (person: Person): ShowcaseRecord | undefined => person.pro?.showcase;

/** The pieces of coursework that prepare the chosen scenes, in the order chosen. */
export function showcasePieces(sim: Simulation, person: Person): Assignment[] {
  const sc = showcaseOf(person);
  const cw = courseworkOf(sim, person);
  if (!sc || !cw) return [];
  return sc.scenes.map((s) => cw.assignments.find((a) => a.id === s.assignmentId)).filter((a): a is Assignment => a !== undefined);
}

/** Whether a final term's DRAM 793b is still to be settled after its showcase: the student is in it and its last day is ahead. */
export function showcaseHolds(person: Person, term: number, at: Instant): boolean {
  const sc = showcaseOf(person);
  if (!sc || sc.term !== term || sc.eligible !== true) return false;
  const last = showcaseCalendar(term).days.at(-1)!;
  return last.at > at && !performedOn(sc, last.key) && !(sc.missed ?? []).some((m) => m.at === last.at);
}

const performedOn = (sc: ShowcaseRecord, key: string): boolean => sc.performed.some((p) => dayKeyAt(p.at) === key);

/** The courses still Incomplete now, as the course records have them. */
const outstandingOf = (person: Person): CourseRecord[] => Object.values(coursesOf(person.school!)).filter((r) => r.result === 'incomplete');

// ---------------------------------------------------------------------------------------------------------------------
// The course's options, and the faculty's note on each
// ---------------------------------------------------------------------------------------------------------------------

/** How well they know a genre: the better of its familiarity and their work in it, 0 to 1 (`genreKnown`'s rule). */
const knownOf = (person: Person, genre: string): number => Math.max(person.engagement?.byGenre[genre]?.familiarity ?? 0, person.engagement?.byGenre[genre]?.practice ?? 0) / 100;

/** A scene fully prepared on a good day for this actor, with no draw: the judge's own forecast, as How You’ll Play It previews one. */
export function sceneForecast(sim: Simulation, person: Person, sceneId: string): number {
  const probe = {
    id: 'showcase-forecast', course: SHOWCASE_COURSE, template: SHOWCASE_TEMPLATE, term: 0, setOn: '', dueOn: '', sceneId, role: 0,
    prep: Object.fromEntries(PREP_DIMS.map((d) => [d, 0])) as Record<PrepDim, number>, answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
  } as Assignment;
  return playingPreview(sim, person, probe, '', {}).overall;
}

/** Whether a piece was performed, not written: Table Work's analysis of a scene sets it and plays no part in it. */
const performed = (a: Assignment): boolean => !UNPERFORMED.has(TEMPLATE_TASK[a.template] ?? 'scene');

/** The best a scene came out when the player showed it before, in either part, and in which part. */
function bestBefore(sim: Simulation, person: Person, sceneId: string): { band: Band; role: 0 | 1; course: string; at: Instant } | undefined {
  const RANK: Record<Band, number> = { unready: 0, working: 1, strong: 2, exceptional: 3 };
  const past = scenePast(courseworkOf(sim, person)?.assignments ?? [], sceneId) as Assignment[];
  let best: { band: Band; role: 0 | 1; course: string; at: Instant } | undefined;
  for (const a of past) {
    if (!a.shown || a.role === undefined || !performed(a)) continue;
    const band = a.revision?.band && RANK[a.revision.band] > RANK[a.shown.band] ? a.revision.band : a.shown.band;
    if (!best || RANK[band] > RANK[best.band]) best = { band, role: a.role, course: a.course, at: a.shown.at };
  }
  return best;
}

interface Ranked { scene: Scene; forecast: number; known: number; before?: ReturnType<typeof bestBefore>; score: number }

/** The course's kind of scene, each ranked for this actor: its forecast, then a known genre, then a scene done well before. */
function ranked(sim: Simulation, person: Person): Ranked[] {
  const t = templateById(SHOWCASE_TEMPLATE)!;
  const pool = scenesFor(t, SHOWCASE_COURSE, courseworkOf(sim, person)?.assignments ?? [], targetDifficulty(3, person.craft ? actingOf(person.craft) : 50));
  return pool.map((scene) => {
    const forecast = sceneForecast(sim, person, scene.id);
    const known = knownOf(person, scene.genre);
    const before = bestBefore(sim, person, scene.id);
    const score = forecast + SHOWCASE.genrePoints * known + (before && (before.band === 'strong' || before.band === 'exceptional') ? SHOWCASE.strongBefore : 0);
    return { scene, forecast, known, ...(before ? { before } : {}), score };
  }).sort((a, b) => b.score - a.score || a.scene.id.localeCompare(b.scene.id));
}

/** The options the faculty offer: four scenes, each in both parts, the part played well before first. */
function offer(sim: Simulation, person: Person): { scene: string; role: 0 | 1 }[] {
  return ranked(sim, person).slice(0, SHOWCASE.offered).flatMap((r) => {
    const first: 0 | 1 = r.before?.role ?? 0;
    return [{ scene: r.scene.id, role: first }, { scene: r.scene.id, role: (first === 0 ? 1 : 0) as 0 | 1 }];
  });
}

export const optionId = (o: { scene: string; role: 0 | 1 }): string => `${o.scene}:${o.role}`;

export interface ShowcaseOption {
  id: string;
  scene: Scene;
  role: 0 | 1;
  /** The part, and the other part, by name. */
  part: string;
  other: string;
  /** The fully prepared forecast, 0 to 100, and its band. */
  forecast: number;
  band: Band;
  /** The faculty's note on the scene (its genre and its forecast), and on this part (what the record holds of it). */
  sceneNote: string;
  partNote?: string;
  /** Among the two the faculty would choose. */
  faculty: boolean;
}

/** The course's options as the record has them, each with the faculty's note read from the record now. */
export function showcaseOptions(sim: Simulation, person: Person): ShowcaseOption[] {
  const sc = showcaseOf(person);
  if (!sc?.options) return [];
  const cw = courseworkOf(sim, person);
  const firsts = facultyChoice(sc).map(optionId);
  const forecasts = new Map<string, number>();
  return sc.options.map((o) => {
    const scene = sceneById(o.scene)!;
    const forecast = forecasts.get(o.scene) ?? sceneForecast(sim, person, o.scene);
    forecasts.set(o.scene, forecast);
    const band = bandOfQuality(forecast);
    const known = knownOf(person, scene.genre);
    const genre = `${scene.play} is ${/^[aeiou]/.test(scene.genre) ? 'an' : 'a'} ${scene.genre}${known >= 0.6 ? ', a genre you know well' : known >= 0.25 ? ', a genre you know a little' : ', a genre you haven’t studied or worked in much yet'}.`;
    const sceneNote = `${genre} Fully prepared, it would come to about ${Math.round(forecast)} of 100 for you, ${BAND_LABEL[band]}.`;
    // A piece performed: a written analysis of the scene (Table Work's own course) wasn't played in either part.
    const past = (scenePast(cw?.assignments ?? [], o.scene) as Assignment[]).filter((a) => a.shown && a.role !== undefined && performed(a));
    const mine = past.filter((a) => a.role === o.role).sort((a, b) => b.shown!.at - a.shown!.at)[0];
    const theirs = past.find((a) => a.role !== o.role);
    const part = scene.roles[o.role].name;
    const other = scene.roles[o.role === 0 ? 1 : 0].name;
    const partNote = mine
      ? `You played ${part} in it for ${courseName(mine.course)} on ${dayWords(mine.shown!.at)}, and it came out ${BAND_LABEL[mine.revision?.band ?? mine.shown!.band]}.`
      : theirs ? `You’ve played ${other} in it, so this is the other side of the scene.` : undefined;
    return { id: optionId(o), scene, role: o.role, part, other, forecast, band, sceneNote, ...(partNote ? { partNote } : {}), faculty: firsts.includes(optionId(o)) };
  });
}

/** The two the faculty would choose: their first two scenes, each in the part they list first. */
function facultyChoice(sc: ShowcaseRecord): { scene: string; role: 0 | 1 }[] {
  const out: { scene: string; role: 0 | 1 }[] = [];
  for (const o of sc.options ?? []) if (out.length < SHOWCASE.scenes && !out.some((x) => x.scene === o.scene)) out.push(o);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Beginning it, and choosing the scenes
// ---------------------------------------------------------------------------------------------------------------------

/**
 * The showcase begun with the final term (the School's term handler, `systems/school.ts`, or an older save's first
 * opening, `beginOnOpening`): the course's options fixed, the fourth week's check, the rehearsal calls and the three days
 * on the calendar from now, and a notice. Only for a student in the program's last term, enrolled in it. The program's
 * term alone settles that: a leave adds its terms to the offset as it begins (`startLeave`, `systems/leave.ts`), so the
 * term it's taken in never reads as the sixth, and an additional term comes after the sixth. Guards for a leave and an
 * additional term were written here on 2026-10-21 and taken out the same day, when mutating each left every test passing
 * and the offset was found to settle both; so was one for a second beginning of the same term, which neither the term
 * handler (a term is begun once) nor the opening step (once, by `ONCE_ON_OPENING`) can reach, and one for a student
 * with no craft, which enrolling gives every student with the School's record (`enroll`, `systems/school.ts`). Returns
 * the record, or nothing.
 */
export function beginShowcase(sim: Simulation, person: Person, term: number): ShowcaseRecord | undefined {
  const school = person.school;
  if (!school || schoolEnded(school.standing) || academicTerm(school, term) !== YALE_DRAMA.terms - 1) return undefined;
  const pro = ensurePro(sim, person);
  const cal = showcaseCalendar(term);
  const last = cal.days.at(-1)!;
  if (last.at <= sim.now) return undefined;
  const sc: ShowcaseRecord = { term, scenes: [], performed: [], options: offer(sim, person) };
  pro.showcase = sc;
  const item = (at: Instant, kind: string, label: string, minutes: number, payload: Record<string, unknown>, requiresPlayer: boolean) => {
    if (at <= sim.now) return;
    sim.schedule({ at, kind, label, category: 'school', priority: 32, requiresPlayer, durationMinutes: minutes, locationId: YALE_DRAMA.cityId, ...(requiresPlayer ? { travelMinutes: 0 } : {}), payload: { personId: person.id, term, ...payload } });
  };
  item(cal.checkBy, SHOWCASE_CHECK_KIND, 'Actor Showcase: Scenes And Incompletes Due', 0, {}, false);
  for (const r of cal.rehearsals) item(r, SHOWCASE_KIND, 'Actor Showcase Rehearsal', SHOWCASE.rehearsal.minutes, { call: 'rehearsal' }, true);
  for (const d of cal.days) item(d.at, SHOWCASE_KIND, d.label, d.minutes, { call: 'showcase', city: d.city, day: d.key, ...(d.last ? { last: true } : {}) }, true);
  if (person.id === sim.universe.playerId) {
    const [ny1, ny2, la] = cal.days;
    const open = outstandingOf(person);
    const due = cal.checkBy > sim.now
      ? ` Choose your two scenes by ${formatWeekdayDate(cal.checkBy, zoneNow())}, under The Actor Showcase on the School’s Coursework tab. To take part, you need every Incomplete made up by then.${open.length ? ` ${spokenList(open.map((r) => r.name))} ${open.length === 1 ? 'is' : 'are'} still incomplete: make ${open.length === 1 ? 'it' : 'them'} up on the Standing And Craft tab.` : ''}`
      : '';
    sim.notify({ category: 'school', title: 'The Actor Showcase', body: `Your last term ends with the Actor Showcase: two scenes you choose and rehearse, which the Bulletin says are presented to agents, managers and casting directors. You play them in New York on ${shortDay(ny1!.at)} and ${shortDay(ny2!.at)}, and in Los Angeles on ${shortDay(la!.at)}.${due}`, importance: 70, route: '/workspace/school' });
  }
  // An older save opened after the fourth week: read as its record stands now, after the notice that says what it is.
  if (cal.checkBy <= sim.now) decide(sim, person, sc);
  return sc;
}

/** Why the scenes can't be chosen now, or nothing; with `picks`, why these can't. */
export function choiceRefusal(sim: Simulation, person: Person, picks?: readonly string[]): string | undefined {
  const school = person.school;
  if (!school || schoolEnded(school.standing)) return 'You’re not at school.';
  const sc = showcaseOf(person);
  if (!sc || sc.term !== school.termsBegun - 1) return 'The Actor Showcase is in your last spring term.';
  if (sc.eligible === false) return `You can’t take part in the Actor Showcase: ${spokenList(sc.outstanding ?? [])} ${(sc.outstanding ?? []).length === 1 ? 'was' : 'were'} still incomplete at the end of the term’s fourth week.`;
  const pieces = showcasePieces(sim, person);
  if (sc.scenes.length) return `Your scenes are chosen: ${spokenList(pieces.map((a) => sceneById(a.sceneId!)!.play))}.`;
  if (picks === undefined) return undefined;
  if (picks.length !== SHOWCASE.scenes) return `Choose two scenes${picks.length ? `: you’ve chosen ${countWords(picks.length)}` : ''}.`;
  const offered = new Set((sc.options ?? []).map(optionId));
  if (picks.some((p) => !offered.has(p))) return 'That scene isn’t one of the course’s options.';
  if (new Set(picks.map((p) => p.split(':')[0])).size !== picks.length) return 'Choose two different scenes.';
  return undefined;
}

/** The chosen scenes set as DRAM 793b's pieces of coursework, due at the first showcase day. */
function setScenes(sim: Simulation, person: Person, sc: ShowcaseRecord, picks: readonly { scene: string; role: 0 | 1 }[], by: 'you' | 'faculty'): Assignment[] {
  const cw = courseworkOf(sim, person)!;
  const school = person.school!;
  const t = templateById(SHOWCASE_TEMPLATE)!;
  const due = showcaseCalendar(sc.term).days[0]!.key;
  const made: Assignment[] = [];
  for (const pick of picks) {
    const a: Assignment = {
      id: sim.nextId('assignment'), course: SHOWCASE_COURSE, template: t.id, term: sc.term, setOn: dayKeyAt(sim.now), dueOn: due,
      sceneId: pick.scene, role: pick.role,
      prep: Object.fromEntries(PREP_DIMS.map((d) => [d, 0])) as Record<PrepDim, number>,
      answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
    };
    // The classmate least worked with, not the first scene's (`partnerFor`, as the course's work is partnered), the first
    // in the class among those equal: a showcase's pairing is the faculty's, so no draw.
    const current = cw.assignments.filter((x) => x.partnerName === undefined);
    if (school.classmates.length) a.partner = partnerFor(current, SHOWCASE_COURSE, school.classmates.length, 0);
    // A scene chosen for the showcase isn't a class scene set again: no revisit asks it to be read another way.
    const objective = objectiveFor(t, SHOWCASE_COURSE, cw.assignments, notesOf(cw));
    if (objective) a.objective = objective;
    cw.assignments.push(a);
    if (!cw.used.includes(pick.scene)) cw.used.push(pick.scene);
    sc.scenes.push({ id: pick.scene, role: pick.role, chosenAt: sim.now, assignmentId: a.id, by });
    made.push(a);
  }
  return made;
}

/** A part and its scene in a sentence: “Nina in The Seagull”. */
const asPlayed = (a: Assignment): string => { const s = sceneById(a.sceneId!)!; return `${s.roles[a.role!].name} in ${s.play}`; };

/**
 * The end of the term's fourth week: no course incomplete, and the student takes part, their scenes chosen by the
 * faculty if not by them; one still incomplete, and they don't, the calls off and the pieces excused (not held against
 * them), DRAM 793b settled at the term review with the rest.
 */
function decide(sim: Simulation, person: Person, sc: ShowcaseRecord): void {
  if (sc.eligible !== undefined) return;
  const open = outstandingOf(person);
  const mine = person.id === sim.universe.playerId;
  if (open.length) {
    sc.eligible = false;
    sc.outstanding = open.map((r) => r.name);
    for (const i of sim.universe.scheduled) if (i.status === 'pending' && i.kind === SHOWCASE_KIND && i.payload.personId === person.id) sim.timeline.cancel(i.id, sim.now);
    for (const a of showcasePieces(sim, person)) if (a.status === 'open') a.status = 'excused';
    if (mine) sim.notify({ category: 'school', title: 'Not In The Actor Showcase', body: `${spokenList(sc.outstanding)} ${open.length === 1 ? 'was' : 'were'} still incomplete at the end of the term’s fourth week, and the Bulletin keeps a student with an Incomplete outstanding out of the Actor Showcase. Its calls are off your calendar, and Actor Showcase is settled at the term review with your other courses. Make up what’s still incomplete on the Standing And Craft tab: an Incomplete still open at Commencement keeps you out of it too, and holds the degree.`, importance: 80, route: '/workspace/school' });
    return;
  }
  sc.eligible = true;
  const chosen = !sc.scenes.length;
  if (chosen) setScenes(sim, person, sc, facultyChoice(sc), 'faculty');
  if (!mine) return;
  const cal = showcaseCalendar(sc.term);
  const pieces = showcasePieces(sim, person);
  const firstCall = cal.rehearsals.find((r) => r > sim.now);
  sim.notify({
    category: 'school', title: 'You’re In The Actor Showcase',
    body: `No course was incomplete at the end of the term’s fourth week, so you take part in the Actor Showcase.${chosen ? ' You hadn’t chosen your scenes, so the faculty chose the two their notes put first.' : ''} Your scenes: ${spokenList(pieces.map(asPlayed))}. Prepare them on the Coursework tab: they’re due in New York on ${shortDay(cal.days[0]!.at)}.${firstCall ? ` The course’s rehearsal calls begin on ${shortDay(firstCall)}.` : ''}`,
    importance: 70, route: '/workspace/school',
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// A rehearsal call, and a showcase day
// ---------------------------------------------------------------------------------------------------------------------

/** How prepared a piece is, all its parts by their weights, 0 to 1. */
function prepShare(person: Person, a: Assignment, onDay: string): number {
  const w = weightsOf(a);
  const parts = preparedParts(person, a, onDay);
  return Math.round(Object.entries(w).reduce((n, [d, x]) => n + (x ?? 0) * (parts[d as PrepDim] ?? 0), 0) * 1000) / 1000;
}

/** A rehearsal call kept: each scene worked on its feet with its partner, by the steps' own gains at the call's focus. */
function rehearse(sim: Simulation, person: Person, item: ScheduledItem): void {
  const focus = Math.min(1.1, Math.max(0.5, focusAt(sim, person, item.at)));
  for (const a of showcasePieces(sim, person)) {
    if (a.status !== 'open' && a.status !== 'revising') continue;
    for (const act of templateById(a.template)!.activities.filter((x) => x.dim === 'rehearsal' || x.dim === 'partner')) {
      const before = a.prep[act.dim];
      a.prep[act.dim] = Math.max(0, Math.min(1, before + act.gain * focus * (1 - before)));
      rehearseChoice(a.playing, act.gain * focus);
      rehearseWays(a.book, act.gain * focus);
    }
  }
  grewFrom(sim, person, 'rehearsal:showcase', focus, REHEARSAL_WEIGHTS);
  person.wellbeing.energy = Math.max(0, person.wellbeing.energy - ESTIMATE.energy.rehearsal);
}

/**
 * A scene played at a showcase day: shown, with the course's note, the first day it's played; shown again with the note
 * taken at the last; played and judged again between. Each kept in the work record under its own key, so a reload can't
 * judge it twice, and in the professional record's performances.
 */
function perform(sim: Simulation, person: Person, sc: ShowcaseRecord, a: Assignment, day: ShowcaseDay, when: Instant): { band: Band; overall: number; noted: boolean } {
  const t = templateById(a.template)!;
  let band: Band;
  let key: string;
  const noted = !a.shown;
  if (!a.shown) {
    key = `show:${person.id}:${a.id}:${day.key}`;
    band = show(sim, person, a, day.key, when).band;
    const later = showcaseCalendar(sc.term).days.find((d) => d.last && d.key > day.key);
    if (later && t.revised && a.feedback) {
      const f = a.feedback.focus;
      a.revision = { dueOn: later.key, before: f.kind === 'dim' ? preparedParts(person, a, day.key)[f.dim] ?? 0 : 0 };
      a.status = 'revising';
    } else a.status = 'done';
  } else if (a.status === 'revising' && a.revision?.dueOn === day.key) {
    key = `reshow:${person.id}:${a.id}:${day.key}`;
    const applied = noteTaken(person, a, day.key);
    a.revision.applied = applied;
    band = reshow(sim, person, a, day.key, when);
    a.revision.band = band;
    if (applied && a.feedback) resolveNote(notesOf(courseworkOf(sim, person)!), noteKey(a.feedback.focus), day.key, a.id, courseName(a.course));
    a.status = 'done';
  } else {
    key = `showcase:${person.id}:${a.id}:${day.key}`;
    const judged = judgeWork(sim, person, a, day.key, when, key);
    band = bandFor(a, judged.overall);
    recordWork(sim, person, judged, { at: when, what: `${t.title}, ${cityName(day.city)}`, band });
    noteMaterial(person, { material: materialOf(a.sceneId), at: when, overall: judged.overall, approaches: sidesOf(a.playing), shown: true });
  }
  const overall = Math.round(((person.work ?? []).find((w) => w.inputs.key === key)?.overall ?? 0) * 10) / 10;
  const entry = sc.scenes.find((s) => s.assignmentId === a.id);
  if (entry) entry.prep = prepShare(person, a, day.key);
  // Once a day each: the day's call runs once, its item done before its handler (`advanceTo`), so a reload can't run it
  // again. A check for a performance already kept was written here and taken out on 2026-10-21, unreachable.
  sc.performed.push({ city: day.city, at: when, band, overall, scene: a.sceneId! });
  return { band, overall, noted };
}

/**
 * The showcase's last day settled, played or missed: what was never played at all counts as not shown (or excused, where
 * every day it was due was missed ill), and DRAM 793b is settled on its meetings and its pieces as any course is at its
 * term review (`settleCourses`). Once, here.
 */
function endShowcase(sim: Simulation, person: Person, sc: ShowcaseRecord): string {
  for (const a of showcasePieces(sim, person)) {
    if (a.status !== 'open' && a.status !== 'revising') continue;
    if (a.shown) { a.status = 'done'; continue; }
    a.status = (sc.missed ?? []).some((m) => !m.excused) ? 'missed' : 'excused';
  }
  const result = settleShowcaseCourse(sim, person, sc.term);
  // Integration (brief 19, W3): the School's follow-up is scheduled here.
  return result;
}

/** A final term's DRAM 793b settled, where its showcase held it past the term review; what came of it, said for a notice. */
export function settleShowcaseCourse(sim: Simulation, person: Person, term: number): string {
  const school = person.school;
  if (!school) return '';
  const r = Object.values(coursesOf(school)).find((x) => x.term === term && x.code === SHOWCASE_COURSE && x.result === undefined && x.meetings > 0);
  if (!r) return '';
  const work = (courseworkOf(sim, person)?.assignments ?? []).filter((a) => a.term === term);
  settleCourses(sim, person, term, (code) => {
    const due = work.filter((a) => a.course === code && (a.shown || a.status === 'missed'));
    return { due: due.length, notShown: due.filter((a) => !a.shown).length };
  }, (code) => COURSES.find((c) => c.code === code)?.perWeek ?? 4);
  if (r.result === 'pass') return ` You passed ${r.name}.`;
  if (r.result === 'fail') return ` You didn’t pass ${r.name}: ${r.why}. The degree needs every course passed, so it can’t be awarded at Commencement.`;
  return '';
}

/**
 * A final term's DRAM 793b the showcase held past the term review, settled when the School ends before the showcase
 * does (`setStanding`, `systems/school.ts`): the term reviewed, the course still open, and nothing left to play it at.
 */
export function settleHeldShowcase(sim: Simulation, person: Person): void {
  const sc = showcaseOf(person);
  if (!sc || !person.school?.history.some((h) => h.term === sc.term)) return;
  settleShowcaseCourse(sim, person, sc.term);
}

// ---------------------------------------------------------------------------------------------------------------------
// An older save's opening, and the registration
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A save from before 2026-10-21 in its final term with the showcase still ahead (`showcase.begun` in `ONCE_ON_OPENING`,
 * `engine/index.ts`): the showcase begun as the term would have begun it, from now. Returns whether one was.
 */
export function beginOnOpening(sim: Simulation): boolean {
  const person = sim.universe.people[sim.universe.playerId];
  const school = person?.school;
  if (!person || !school || school.termsBegun === 0) return false;
  return beginShowcase(sim, person, school.termsBegun - 1) !== undefined;
}

export function registerShowcase(sim: Simulation): void {
  const personOf = (item: ScheduledItem) => sim.universe.people[String(item.payload.personId)];

  sim.onSchedule(SHOWCASE_CHECK_KIND, (item, s) => {
    const person = personOf(item);
    const sc = person ? showcaseOf(person) : undefined;
    if (!person?.school || !sc || sc.term !== Number(item.payload.term) || schoolEnded(person.school.standing)) return;
    decide(s, person, sc);
  });

  sim.onSchedule(SHOWCASE_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    const sc = person ? showcaseOf(person) : undefined;
    if (!person || !school || !sc || !person.craft || sc.term !== Number(item.payload.term) || schoolEnded(school.standing)) return;
    const mine = person.id === s.universe.playerId;
    const note = (how: 'attended' | 'excused' | 'missed') => noteMeeting(school, sc.term, SHOWCASE_COURSE, courseName(SHOWCASE_COURSE), how);
    const excused = offSick(person, item.at) || school.sickDay === dayKeyAt(item.at);
    if (item.payload.call === 'rehearsal') {
      if (excused) { item.status = 'missed'; note('excused'); return; }
      school.tally.calls += 1;
      if (!present(person, item.at)) {
        item.status = 'missed';
        note('missed');
        if (missedCallsOut(s, person)) return;
        if (mine) s.notify({ category: 'school', title: 'You Missed A Showcase Rehearsal', body: 'You missed today’s Actor Showcase rehearsal call. It counts as a missed call and a missed class of Actor Showcase, and your scenes went without the rehearsal.', importance: 65, route: '/workspace/school' });
        return;
      }
      school.tally.answered += 1;
      note('attended');
      rehearse(s, person, item);
      return;
    }
    const cal = showcaseCalendar(sc.term);
    const day = cal.days.find((d) => d.key === String(item.payload.day))!;
    const next = cal.days.find((d) => d.key > day.key);
    const city = cityName(day.city);
    const pieces = showcasePieces(s, person).filter((a) => a.status === 'open' || a.status === 'revising');
    const ahead = next ? ` Your scenes are next due in ${cityName(next.city)} on ${shortDay(next.at)}.` : '';
    const again = next ? ` You play them again in ${cityName(next.city)} on ${shortDay(next.at)}.` : '';
    // The School's record keeps the call whatever comes of it: a showcase day is a call, as a lab is (`LAB_KIND`).
    if (excused) {
      item.status = 'missed';
      note('excused');
      (sc.missed ??= []).push({ city: day.city, at: day.at, excused: true });
      const after = day.last ? endShowcase(s, person, sc) : '';
      if (mine) s.notify({ category: 'school', title: `Excused: ${day.label}`, body: `You were ill, so you’re excused from the showcase in ${city}, and it isn’t held against you. Your scenes weren’t seen there.${ahead}${after}`, importance: 70, route: '/workspace/school' });
      return;
    }
    school.tally.calls += 1;
    if (!present(person, item.at)) {
      item.status = 'missed';
      note('missed');
      (sc.missed ??= []).push({ city: day.city, at: day.at, excused: false });
      const never = day.last && pieces.some((a) => !a.shown);
      const after = day.last ? endShowcase(s, person, sc) : '';
      if (mine) s.notify({ category: 'school', title: `You Missed ${day.label}`, body: `You weren’t at the School’s call for the showcase in ${city}, so your scenes weren’t seen there. It counts as a missed call, and as an unexcused absence from Actor Showcase.${ahead}${never ? ' A scene played at no showcase day counts as a piece not shown, and a course with half its pieces not shown isn’t passed.' : ''}${after}`, importance: 75, route: '/workspace/school' });
      return;
    }
    school.tally.answered += 1;
    note('attended');
    nerves(s, person, 'performance');
    const played = pieces.map((a) => ({ a, ...perform(s, person, sc, a, day, item.at) }));
    grewFrom(s, person, `showcase:${day.key}`, focusAt(s, person, item.at), courseSkills());
    person.wellbeing.energy = Math.max(0, person.wellbeing.energy - ESTIMATE.energy.rehearsal * played.length);
    const after = day.last ? endShowcase(s, person, sc) : '';
    if (!mine) return;
    const each = played.map((p) => `${asPlayed(p.a)}: ${BAND_LABEL[p.band]}, ${Math.round(p.overall)} of 100`).join('. ');
    // The notes said where they're new: the first day a scene is shown. On a later day they stand as they were given.
    const fresh = played.filter((p) => p.noted && p.a.status === 'revising');
    const notes = fresh.length ? ` The faculty’s ${fresh.length === 1 ? 'note is' : 'notes are'} on ${fresh.length === 1 ? 'the scene’s card' : 'each scene’s card'} on the Coursework tab. Work on ${fresh.length === 1 ? 'it' : 'them'} before Los Angeles, where ${fresh.length === 1 ? 'the scene is' : 'they’re'} shown again with the note taken.` : '';
    s.notify({ category: 'school', title: day.label, body: `You played ${played.length === 1 ? 'your scene' : `your ${countWords(played.length)} scenes`} at the showcase in ${city}. ${each}.${notes}${again}${after}`, importance: 70, route: '/workspace/school' });
  });

  sim.onCommand<{ options: string[] }, { assignments: string[] }>('school.choose_showcase', (p, { sim: s }) => {
    const person = s.player;
    const picks = Array.isArray(p?.options) ? p.options.map(String) : [];
    const no = choiceRefusal(s, person, picks);
    if (no) throw new CommandError(no);
    const sc = showcaseOf(person)!;
    const made = setScenes(s, person, sc, picks.map((id) => { const [scene, role] = id.split(':'); return { scene: scene!, role: (Number(role) === 1 ? 1 : 0) as 0 | 1 }; }), 'you');
    return { assignments: made.map((a) => a.id) };
  });
}

/** The days the term's showcase calls fall on, for a screen: each with its date, its hours and its showings. */
export const callWords = (d: ShowcaseDay): string => `${formatWeekdayDate(d.at, zoneNow())}, from ${clock(d.at)}${d.minutes >= 1440 ? ' to the next morning' : ` to ${clock(d.at + d.minutes * MS_MINUTE)}`}, for the showing${/,| and /.test(d.showings) ? 's' : ''} at ${d.showings}`;
/** A time as the School's notices say one: 1 PM, 7:30 PM. */
const clock = (when: Instant): string => formatTime(when, zoneNow()).replace(':00 ', ' ');
