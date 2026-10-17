/**
 * SLATE — the player's own "What To Improve Next" (from 2026-10-16): `recommendations` with the forecast of what each
 * input's hours would be worth (`trainingForecast`, `systems/advice.ts`). The brief's pane, the profile and the tools that
 * play a student read this one call, so what the screen advises is what a played student follows.
 *
 * From brief 11 (2026-10-17; L1, docs/verification/completion-2026-10-16/clarifications.md): what was first is noted as the
 * player comes to tape a brief (once a day) and to practice after new work (`noteAdvice`, `Experience.advised`), and the first
 * recommendation says how long it has been first and what has moved since (`standing`), or what was first before it and
 * how that has moved, and what the player can do about it now (`next`). Measured on 2026-10-16 (decisions-2026-10-16/l1/),
 * a student whose school left few hours to practice read focus first eight weeks running, each week in the same sentence
 * but for its figures and the piece it named; the advice keeps naming what brings most (F2-A10 (b)), and what it says now
 * changes with the player's state.
 *
 * From brief 12 (2026-10-17; docs/verification/resolution-2026-10-17/advice-criteria.md): a note keeps the state its
 * forecast was made in, and every change since a note is said in parts (`forecastChange`): the work read, knowing its
 * genres, the other abilities and techniques, the input's own level and discipline, with whatever none of them accounts
 * for said as untraced. Until then only discipline's part of a rise was said. The first training recommendation also says
 * what the forecast assumes of the work (`assumes`) and whether preparation, training or both deserve attention
 * (`attention`).
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, instantFromZoned, zonedParts } from '../core/time';
import { DEVELOPMENT, MASTERED, TECHNIQUE_LABEL, type AbilityId } from '../content/abilities';
import { EXERCISE_BY_ID, PRACTICE, TIER, exerciseFor } from '../content/practice';
import { abilityFull, abilityOf, isAbility, levelOf, targetId } from './attributes';
import { identityOf } from './artistry';
import { ADVICE_FLOOR, experienceOf, practicedDaysAgo, recommendations, type Advised, type AdvisedAt, type Recommendation } from './experience';
import { matchedTier, practicePreview, practiceRefusal } from './practice';
import { CHANGE_ORDER, assumedOf, atFullRead, forecastAtDiscipline, forecastChange, forecastWork, preparationWorth, stateOf, trainingForecast, type ChangePart, type Forecast, type ForecastChange } from './advice';
import { ABILITY_DEFS } from '../content/abilities';
import { TASK_PROFILES } from '../content/tasks';

/**
 * From brief 10 (later on 2026-10-16): the forecast is passed only where work is kept under today's rules, and passed
 * then even when it holds nothing, so an empty one no longer falls back to the costs; and where every input the recent
 * work read that an exercise trains is at full, the advice says so first (`allFull`), with what's short that no exercise
 * trains. Until then it said nothing of it, and the Profile read as if nothing had held the work back (F2-A10 (d)).
 *
 * From brief 11: the first training recommendation carries `standing` and `next`. Reading it changes nothing: the save is
 * the same before and after, and the same save gives the same advice.
 *
 * From brief 12: it carries `assumes` too, and the first recommendation, training or not, `attention`.
 */
export function adviceFor(sim: Simulation, person: Person): Recommendation[] {
  const { recs, forecast } = advised(sim, person);
  const first = recs.find((r) => r.forecast);
  const lead = first ?? recs[0];
  if (!lead) return recs;
  const was = person.experience?.advised;
  const standing = first && was ? standingOf(sim, person, was, first, forecast) : undefined;
  const next = first ? nextOf(sim, person, first) : undefined;
  const assumes = first ? assumesOf(sim, person, first) : undefined;
  const attention = attentionSaid(attentionOf(sim, person, first), first);
  return recs.map((r) => (r === lead ? { ...r, ...(standing ? { standing } : {}), ...(next ? { next } : {}), ...(assumes ? { assumes } : {}), ...(attention ? { attention } : {}) } : r));
}

/** The recommendations and the forecast they read, as they stand: what `adviceFor` says and `noteAdvice` notes. */
function advised(sim: Simulation, person: Person): { recs: Recommendation[]; forecast?: Map<string, Forecast> } {
  const read = forecastWork(person.work ?? []).length > 0;
  const forecast = read ? trainingForecast(sim, person) : undefined;
  const recs = recommendations((id) => levelOf(sim, person, id as never), (id) => (isAbility(id as never) ? abilityFull(sim, person, id as AbilityId) : MASTERED), person.work ?? [], (id) => exerciseFor(id as never), matchedTier, 12, practicedDaysAgo(person, sim.now, sim.homeZone), identityOf(person).recurring, forecast);
  const full = read ? atFullRead(sim, person) : undefined;
  return { recs: full?.all ? [allFull(full.short), ...recs].slice(0, 5) : recs, ...(forecast ? { forecast } : {}) };
}

/** Today at home, the key a day's note is kept under. */
const dayOf = (sim: Simulation): string => { const p = zonedParts(sim.now, sim.homeZone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };
const exactOf = (f: Forecast | undefined): number | undefined => (f ? f.exact ?? f.points : undefined);

/**
 * What was first, noted (from brief 11): before a brief is taped (`tapeBrief`), once a day, and before an hour of practice
 * (`practice.exercise`) where there's been new work since the last note: the two places the advice is shown beside what
 * it's for, so it's the advice that was in front of the player when they came to it, and practice is read against where
 * things stood after their latest work. The same
 * input again keeps when it was first given and its figures then, and where there's been new work since the last note,
 * where it stands now (`last`); another starts its own, keeping what was first before it (`before`). Nothing is noted
 * where there's no work to forecast, and the note goes where nothing is first (every input at full). The player's alone.
 * Noted no more than that, since a forecast costs a few hundredths of a second (2026-10-17): noted before each day's first
 * hour of practice as well, the F2-A measure of two tuning cases took 49 seconds where it had taken 9; and noted before
 * every day's first judged piece of any kind (`recordWork`), a school year of class scenes (tests/remaining-school.test.ts)
 * took 99 seconds where it had taken 34.
 */
export function noteAdvice(sim: Simulation, person: Person, when: 'work' | 'practice'): void {
  if (person.id !== sim.universe.playerId) return;
  const day = dayOf(sim);
  const key = person.work?.at(-1)?.inputs.key;
  const was = person.experience?.advised;
  if (was?.day === day || (when === 'practice' && was && was.last.key === key)) return;
  if (!forecastWork(person.work ?? []).length) return;
  const { recs, forecast } = advised(sim, person);
  const first = recs.find((r) => r.forecast);
  const xp = experienceOf(person);
  if (!first) { delete xp.advised; return; }
  // The state the forecast was made in (from brief 12), so what moves it from here can be worked out in parts.
  const at = { at: sim.now, level: levelOf(sim, person, first.target as never), forecast: exactOf(first.forecast)!, discipline: abilityOf(sim, person, 'discipline'), state: stateOf(sim, person) };
  const last = { ...at, ...(key ? { key } : {}) };
  if (was?.target === first.target) {
    xp.advised = { ...was, day, ...(was.last.key !== key ? { last } : {}) };
    return;
  }
  const before = was ? { target: was.target, since: was.since, until: was.day, first: { level: was.first.level, forecast: was.first.forecast }, then: { level: levelOf(sim, person, was.target as never), ...(forecast?.get(was.target) ? { forecast: exactOf(forecast.get(was.target))! } : {}) } } : undefined;
  xp.advised = { target: first.target, since: sim.now, day, first: at, last, ...(before ? { before } : {}) };
}

const labelOf = (id: string): string => ABILITY_DEFS.find((d) => d.id === id)?.label ?? TECHNIQUE_LABEL[id as keyof typeof TECHNIQUE_LABEL] ?? id;
const r1 = (x: number) => Math.round(x * 10) / 10;
/** A forecast said at the precision its change needs: four places where it moved by under a thousandth, three under a hundredth, two otherwise. */
const said = (x: number, by: number) => x.toFixed(Math.abs(by) < 0.001 ? 4 : Math.abs(by) < 0.01 ? 3 : 2);
const signed = (x: number, places: number) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(places)}`;
/** Discipline's lift on an hour's growth at a level (`gainAfter`). */
const liftAt = (d: number) => 1 + (DEVELOPMENT.disciplineLift * (d - 50)) / 50;
/** How long ago, in days or weeks. */
const agoOf = (ms: number): string => { const d = Math.floor(ms / MS_DAY); return d < 14 ? `${d} ${d === 1 ? 'day' : 'days'}` : `${Math.floor(d / 7)} weeks`; };

/**
 * How long the first recommendation has been first and what has moved since it was first given (from brief 11): its
 * level, its forecast, the pieces since and how many it held back, and the hours of its exercise since; then, where the
 * player has practiced or discipline has moved since their latest work, what that did, and how much of the forecast's
 * change is discipline's (F2-A10 (h): its forecast now against its forecast at the discipline it had then). Where another
 * was first before it, what that was and how it had moved; where another was first when last noted, how it has moved since.
 */
function standingOf(sim: Simulation, person: Person, was: Advised, first: Recommendation, forecast: Map<string, Forecast> | undefined): string | undefined {
  const date = (at: number) => formatDate(at, sim.zone);
  if (was.target !== first.target) {
    // Another was first: said with how it has moved, so the change reads as the player's progress or the work's.
    const now = exactOf(forecast?.get(was.target));
    const level = levelOf(sim, person, was.target as never);
    const moved = `${Math.abs(level - was.first.level) < 0.05 ? `it’s still at ${r1(level)}` : `it has gone from ${r1(was.first.level)} to ${r1(level)}`}${now !== undefined ? ` and its forecast from ${said(was.first.forecast, now - was.first.forecast)} to ${said(now, now - was.first.forecast)} a piece` : ''}`;
    const mine = exactOf(first.forecast)!;
    const why = now === undefined ? `${labelOf(was.target).toLowerCase()} has nothing left to forecast on your recent work` : `${first.label.toLowerCase()}’s forecast, ${said(mine, mine - now)}, is now the larger`;
    const from = dateOfDay(sim, was.day) === date(was.since) ? '' : `, first since ${date(was.since)}`;
    // What moved the one that was first (from brief 12), where its forecast changed since it was first given.
    const whatMoved = now !== undefined && Math.abs(now - was.first.forecast) > 1e-12 ? movedSaid(forecastChange(sim, person, was.target, was.first), `${labelOf(was.target).toLowerCase()}’s forecast since it was first given`, now > was.first.forecast) : undefined;
    return `When it was last noted, on ${dateOfDay(sim, was.day)}, the first was ${labelOf(was.target).toLowerCase()}${from}: since it was first given ${moved}, and ${why}.${whatMoved ? ` ${whatMoved}` : ''}`;
  }
  const level = levelOf(sim, person, first.target as never);
  const now = exactOf(first.forecast)!;
  const out: string[] = [];
  if (was.before) {
    const b = was.before;
    out.push(`It took over from ${labelOf(b.target).toLowerCase()} on ${date(was.since)}: that had been first since ${date(b.since)}, and ${Math.abs(b.then.level - b.first.level) < 0.05 ? `was still at ${r1(b.then.level)}` : `had gone from ${r1(b.first.level)} to ${r1(b.then.level)}`}${b.then.forecast !== undefined ? ` and its forecast from ${said(b.first.forecast, b.then.forecast - b.first.forecast)} to ${said(b.then.forecast, b.then.forecast - b.first.forecast)} a piece` : ''} by then.`);
  }
  const parts: string[] = [`It has been first since ${date(was.since)}, ${agoOf(sim.now - was.since)} ago`];
  const change = now - was.first.forecast;
  parts.push(`${Math.abs(level - was.first.level) < 0.05 ? `it’s still at ${r1(level)}` : `it has gone from ${r1(was.first.level)} to ${r1(level)}`}, and its forecast from ${said(was.first.forecast, change)} to ${said(now, change)} a piece`);
  // The work since: how many pieces, and how many it held back (each piece's own limits).
  const work = (person.work ?? []).filter((w) => w.at >= was.since);
  const held = work.filter((w) => w.limits.some((l) => l.what === first.target && (l.kind === 'ability' || l.kind === 'technique')));
  parts.push(work.length ? `of the ${work.length} ${work.length === 1 ? 'piece' : 'pieces'} you’ve done since, it held back ${held.length}${held.length ? `, most lately ${held.at(-1)!.what} on ${date(held.at(-1)!.at)}` : ''}` : 'you’ve done no work since');
  // The hours of its exercise, from the development record (`DevelopmentLedger.history`, the latest it keeps).
  const ex = first.exercise ? EXERCISE_BY_ID[first.exercise] : undefined;
  const hist = person.development?.history ?? [];
  const short = (from: number) => hist.length >= DEVELOPMENT.historyKept && (hist[0]?.at ?? 0) > from;
  const hoursSince = (from: number) => (ex ? hist.filter((h) => h.at >= from && h.id === targetId(first.target as never) && h.source === `practice:${ex.id}`).length : 0);
  if (ex) { const n = hoursSince(was.since); parts.push(n ? `you’ve practiced ${ex.label} for ${short(was.since) ? 'at least ' : ''}${n} ${n === 1 ? 'hour' : 'hours'} since` : `you haven’t practiced ${ex.label} since`); }
  out.push(`${parts.join('; ')}.`);
  // What moved its forecast since it was first given, in parts (from brief 12): until then a rise there was said with
  // nothing to account for it (adv-t-5's composure, still at 42, "its forecast from 1.00 to 1.28").
  if (Math.abs(change) > 1e-12) { const m = movedSaid(forecastChange(sim, person, first.target, was.first), 'its forecast since it was first given', change > 0); if (m) out.push(m); }
  // Since the latest work (`last`): what practice did, and where the forecast rose, discipline's part of the rise
  // (F2-A10 (h), brief 11): a small increase explained by what improved.
  const last = was.last;
  const discipline = abilityOf(sim, person, 'discipline');
  const hours = hoursSince(last.at);
  const lifted = Math.abs(discipline - last.discipline) >= 0.05 && now > last.forecast;
  const part = lifted ? disciplinePart(sim, person, first.target, last, now, discipline) : undefined;
  if (last.at > was.since && hours > 0) {
    const by = now - last.forecast;
    out.push(`Since ${date(last.at)}, ${hours} ${hours === 1 ? 'hour' : 'hours'} of ${ex!.label}: it went from ${r1(last.level)} to ${r1(level)}, and its forecast from ${said(last.forecast, by)} to ${said(now, by)}${part ? `, a little up: ${part}` : ''}.`);
  } else if (part) {
    out.push(`Its forecast is a little up on ${said(last.forecast, now - last.forecast)}: ${part}.`);
  }
  // And since the latest work, where that's a later note than the first (from brief 12).
  if (last.at > was.since && Math.abs(now - last.forecast) > 1e-12) { const m = movedSaid(forecastChange(sim, person, first.target, last), `its forecast since ${date(last.at)}`, now > last.forecast); if (m) out.push(m); }
  return out.join(' ');
}

/** What each part of a forecast's change is said as (from brief 12; `forecastChange`, `CHANGE_ORDER`). */
const PART_SAID: Readonly<Record<ChangePart, string>> = { work: 'the work it reads', genres: 'how well you know its genres', others: 'your other abilities and techniques', own: 'its own level', discipline: 'discipline' };

/**
 * A forecast's change said in parts (from brief 12; advice-criteria.md, H4): each part that shows at four places, by
 * name, and whatever the parts don't account for (`residual`) as untraced. Undefined where nothing shows at four places.
 * Where a rise can't be worked out (a note from before brief 12, or the work it read no longer kept), it says so; a fall
 * that can't is said as brief 11 said it.
 */
function movedSaid(ch: ForecastChange | undefined, what: string, rose: boolean): string | undefined {
  if (!ch) return rose ? `What moved ${what} can’t be worked out: it was noted before the advice kept what it reads, or the work it read then is no longer kept.` : undefined;
  const shown = CHANGE_ORDER.filter((k) => Math.abs(ch.parts[k]) >= 0.00005).map((k) => `${PART_SAID[k]}, ${signed(ch.parts[k], 4)}`);
  const untraced = Math.abs(ch.residual) >= 0.00005 ? `${signed(-ch.residual, 4)} the advice can’t trace to anything it reads` : undefined;
  if (!shown.length && !untraced) return undefined;
  return `What moved ${what}: ${[...shown, ...(untraced ? [untraced] : [])].join('; ')}.`;
}

/**
 * What the forecast assumes of the work it read (from brief 12; advice-criteria.md, F2 and F4): its own preparation as
 * taped, each piece read as prepared named with how far short each part was and the first's figure read as taped, and each
 * genre as known today, with how many are short of complete and how many known better than when taped.
 */
function assumesOf(sim: Simulation, person: Person, first: Recommendation): string | undefined {
  const a = assumedOf(person);
  if (!a) return undefined;
  const list = (xs: readonly string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0] ?? '');
  const was = (n: number) => (n === 1 ? 'was' : 'were');
  const own: string[] = [];
  if (a.complete) own.push(`${a.complete} ${was(a.complete)} taped with ${a.complete === 1 ? 'its' : 'their'} own preparation complete`);
  if (a.short) own.push(`${a.short} ${a.complete ? '' : `${was(a.short)} taped `}short of it and read as taped`);
  if (a.prepared.length) own.push(`${a.prepared.length} short of it and read as if complete`);
  const out = [`What it assumes of your last ${a.pieces === 1 ? 'piece' : `${a.pieces} pieces`}: ${list(own)}.`];
  if (a.prepared.length) {
    const label = (task: string, part: string) => (TASK_PROFILES[task]?.prepLabel?.[part] ?? (part === 'approach' ? 'The way you chose to play it, rehearsed in' : part)).toLowerCase();
    for (const p of a.prepared) out.push(`In ${p.what}, ${list(p.parts.map((x, i) => `${label(p.task, x.part)} ${p.parts.length > 1 && i > 0 ? '' : 'stood '}at ${Math.round(x.share * 100)}%`))} of what completes ${p.parts.length === 1 ? 'it' : 'them'}.`);
    const taped = exactOf(trainingForecast(sim, person, person.work ?? [], [first.target], true).get(first.target));
    out.push(`${a.prepared.length === 1 ? 'That piece is' : 'Those pieces are'} read as if ${a.prepared.length === 1 ? 'its' : 'their'} own preparation were complete, since that held ${a.prepared.length === 1 ? 'it' : 'each'} back most${taped !== undefined ? `: read as taped, ${first.forecast!.hours} hours of ${first.label.toLowerCase()} would be worth about ${taped.toFixed(2)} a piece, not ${exactOf(first.forecast)!.toFixed(2)}` : ''}.`);
  }
  out.push(a.genres ? `Each genre is read as you know it today: of the ${a.genres === 1 ? 'piece’s genre' : `${a.genres} pieces’ genres`}, ${a.genreShort} ${a.genreShort === 1 ? 'is' : 'are'} short of complete and ${a.genreBetter} known better than when taped.` : 'None of them reads knowing a genre.');
  return out.join(' ');
}

/**
 * Whether preparation, ability development or both deserve attention now (from brief 12; advice-criteria.md, F5): two
 * figures in the same units, points a piece on the recent work as you are now. Preparation's (`preparationWorth`): each
 * piece's own preparation complete, then its genre known in full, against each as taped with its genre as known today.
 * Training's: the first training recommendation's forecast. Each deserves attention at the advice's floor, a tenth.
 */
export interface Attention { own: number; genres: number; preparation: number; training?: number; target?: string; verdict: 'both' | 'preparation' | 'training' | 'neither' }
export function attentionOf(sim: Simulation, person: Person, first?: Recommendation): Attention | undefined {
  const w = preparationWorth(sim, person);
  if (!w) return undefined;
  const preparation = w.own + w.genres;
  const training = first ? exactOf(first.forecast) : undefined;
  const p = preparation >= ADVICE_FLOOR;
  const t = training !== undefined && training >= ADVICE_FLOOR;
  return { ...w, preparation, ...(training !== undefined ? { training, target: first!.target } : {}), verdict: p && t ? 'both' : p ? 'preparation' : t ? 'training' : 'neither' };
}

/** The verdict said, with both figures, the larger first where both deserve attention. */
function attentionSaid(a: Attention | undefined, first?: Recommendation): string | undefined {
  if (!a) return undefined;
  const n2 = (x: number) => x.toFixed(2);
  const prep = `coming to your recent work fully prepared would have brought it about ${n2(a.preparation)} a piece as you are now (${n2(a.own)} from each piece’s own preparation, ${n2(a.genres)} from knowing its genre in full)`;
  const train = first && a.training !== undefined ? `${first.forecast!.hours} hours of ${first.label.toLowerCase()} would bring about ${n2(a.training)}` : undefined;
  switch (a.verdict) {
    case 'both': return a.preparation > a.training! ? `Both preparation and training deserve attention, preparation most: ${prep}; and ${train}.` : `Both training and preparation deserve attention, training most: ${train} a piece; and ${prep}.`;
    case 'training': return `Training deserves attention now, and preparation doesn’t: ${train} a piece, and ${prep}, under the tenth a result shows.`;
    case 'preparation': return `Preparation deserves attention now, and training doesn’t: ${prep}${train ? `, and ${train}, under a tenth` : ', and no hours of practice are forecast to bring a tenth'}.`;
    default: return `Neither preparation nor training would bring your recent work a tenth of a point now: ${prep}${train ? `, and ${train}` : ', and no hours of practice are forecast to bring a tenth'}.`;
  }
}

/**
 * How much of a forecast's change since a note is discipline's (from brief 11, F2-A10 (h)): discipline then and now, the
 * lift each hour grows by at each (`gainAfter`), and the forecast now at the discipline it had then, so the rest is the
 * input's own (its level, and the work).
 */
function disciplinePart(sim: Simulation, person: Person, id: string, then: AdvisedAt, now: number, discipline: number): string {
  const atThen = exactOf(forecastAtDiscipline(sim, person, id, then.discipline));
  const lifts = `each hour grows ×${liftAt(discipline).toFixed(3)} where it grew ×${liftAt(then.discipline).toFixed(3)}, and twenty days would add less discipline beside it`;
  if (atThen === undefined) return `discipline went from ${r1(then.discipline)} to ${r1(discipline)}: ${lifts}`;
  const places = Math.abs(now - then.forecast) < 0.001 ? 4 : 3;
  // Until brief 12 (2026-10-17) the rest was said as "its own", where it holds whatever else moved (the work, the genres,
  // the other inputs) beside the input's own level; the parts are said after it where the note kept its state.
  return `discipline went from ${r1(then.discipline)} to ${r1(discipline)} (${lifts}): at discipline ${r1(then.discipline)} its forecast would be ${atThen.toFixed(places)}, so ${signed(now - atThen, places)} of the change is discipline’s and ${signed(atThen - then.forecast, places)} everything else’s`;
}

/** A noted day (`Advised.day`, at home), as a date. */
function dateOfDay(sim: Simulation, day: string): string {
  const [year, month, d] = day.split('-').map(Number);
  return formatDate(instantFromZoned({ year: year!, month: month!, day: d!, hour: 12 }, sim.homeZone), sim.homeZone);
}

/**
 * What the player can do about the first recommendation now (from brief 11): its exercise at the tier it names, where
 * it's practiced, what an hour costs and what it would bring now (`practicePreview`, the hour's own formula), or why it
 * can't be done now (`practiceRefusal`, the command's own refusal).
 */
function nextOf(sim: Simulation, person: Person, first: Recommendation): string | undefined {
  const e = first.exercise ? EXERCISE_BY_ID[first.exercise] : undefined;
  if (!e) return undefined;
  const tier = first.tier ?? matchedTier(levelOf(sim, person, e.trains as never));
  const no = practiceRefusal(sim, person, e);
  const energy = e.feet ? PRACTICE.energy.feet : PRACTICE.energy.desk;
  const hour = `Next: ${e.label} at the ${TIER.label[tier]!.toLowerCase()} tier, ${first.focus}, from Practice An Hour under Attributes And Craft on your Player Profile: an hour, and ${energy} energy${e.feet ? ' (on your feet)' : ''}`;
  if (no) return `${hour}. Not now: ${no}`;
  const p = practicePreview(sim, person, e, tier, first.focus === 'spaced' ? 'spaced' : 'steady');
  return `${hour}, for about +${p.gain.toFixed(2)} to ${labelOf(targetId(e.trains as never)).toLowerCase()} now${p.discipline > 0 ? ` and +${p.discipline.toFixed(2)} to discipline for the day kept` : ''}.`;
}

/** Where training reaches nothing more in the recent work (from brief 10): said, with what's short and what builds it. Its target has a colon, so a reader of training targets passes it by. */
function allFull(short: readonly AbilityId[]): Recommendation {
  const builds: Partial<Record<AbilityId, string>> = { stamina: 'workouts build it', discipline: 'practice kept up on days running builds it' };
  const left = short.map((id) => `${ABILITY_DEFS.find((d) => d.id === id)!.label.toLowerCase()} isn’t, and no exercise trains it: ${builds[id] ?? 'the work itself builds it'}`);
  return { target: 'full:all', label: 'Everything Training Reaches Is At Full', focus: 'full', points: 0, why: `Every ability and technique your recent work read that an exercise trains is at its full (a technique at ${MASTERED}, past which no piece asks more), so no hours of practice would move it.${left.length ? ` Of what else it read, ${left.join('; ')}.` : ''} The work now is in new material and new ways of playing it.` };
}

/**
 * What held the last piece back most against what pays most to train now, where they aren't the same (from 2026-10-16):
 * the first is the piece's own chief limit, the second the forecast's. Nothing where they agree or there's no forecast.
 */
export function heldVersusNext(person: Person, recs: readonly Recommendation[]): string | undefined {
  const top = recs.find((r) => r.forecast);
  const last = person.work?.at(-1);
  const held = last?.limits.find((l) => l.kind === 'ability' || l.kind === 'technique');
  if (!top || !held || held.what === top.target) return undefined;
  const theirs = recs.find((r) => r.target === held.what);
  const said = theirs?.forecast ? `${theirs.forecast.hours} hours of it are forecast at about ${theirs.points} points a piece, against ${top.points} for ${top.label.toLowerCase()}` : `it would pay less to train than ${top.label.toLowerCase()}`;
  return `What held your last piece back most was ${held.label.toLowerCase()}, but it isn’t what pays most to train now: ${said}, which your recent work reads across more of it or has more room to grow in.`;
}
