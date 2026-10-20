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
import { EXERCISE_BY_ID, FOCUS, PRACTICE, TIER, exerciseFor } from '../content/practice';
import { abilityFull, abilityOf, isAbility, levelOf, targetId } from './attributes';
import { identityOf } from './artistry';
import { ADVICE_FLOOR, SPACED_NOW, STEADY_FIRST, experienceOf, practicedDaysAgo, recommendations, type Advised, type AdvisedAt, type Recommendation } from './experience';
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
/** How long ago, in days or weeks: today where it's under a day (from 2026-10-17, brief 14: until then “0 days ago”). */
const agoOf = (ms: number): string => { const d = Math.floor(ms / MS_DAY); return d < 1 ? 'earlier today' : d < 14 ? `${d} ${d === 1 ? 'day' : 'days'} ago` : `${Math.floor(d / 7)} weeks ago`; };
/** A label said at the start of a sentence: its first letter capitalized (`labelOf(...).toLowerCase()` is how prose names one). */
const capFirst = (x: string): string => x.charAt(0).toUpperCase() + x.slice(1);

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
    const still = Math.abs(level - was.first.level) < 0.05;
    const moved = `${still ? `it’s still at ${r1(level)}` : `it’s gone from ${r1(was.first.level)} to ${r1(level)}`}${now !== undefined ? `${still ? ', and its forecast has gone' : ' and its forecast has gone'} from ${said(was.first.forecast, now - was.first.forecast)} to ${said(now, now - was.first.forecast)} a piece` : ''}`;
    const mine = exactOf(first.forecast)!;
    const why = now === undefined ? `There’s nothing left to forecast for ${labelOf(was.target).toLowerCase()} on your recent work, so it’s dropped out.` : `${capFirst(first.label.toLowerCase())}’s forecast is now the higher, at ${said(mine, mine - now)}, so it leads now.`;
    const old = labelOf(was.target).toLowerCase();
    const led = dateOfDay(sim, was.day) === date(was.since) ? `${capFirst(old)} led the advice on what to train when you last saw it, on ${dateOfDay(sim, was.day)}.` : `${capFirst(old)} led the advice on what to train from ${date(was.since)}, and was still first when you last saw it, on ${dateOfDay(sim, was.day)}.`;
    // What moved the one that was first (from brief 12), where its forecast changed since it was first given.
    const whatMoved = now !== undefined && Math.abs(now - was.first.forecast) > 1e-12 ? movedSaid(forecastChange(sim, person, was.target, was.first), `${old}’s forecast since it took the lead`, now > was.first.forecast) : undefined;
    return `${led} Since it took the lead, ${moved}. ${why}${whatMoved ? ` ${whatMoved}` : ''}`;
  }
  const level = levelOf(sim, person, first.target as never);
  const now = exactOf(first.forecast)!;
  const out: string[] = [];
  if (was.before) {
    const b = was.before;
    out.push(`It took over from ${labelOf(b.target).toLowerCase()} on ${date(was.since)}. ${capFirst(labelOf(b.target).toLowerCase())} had led since ${date(b.since)}, and by then it ${Math.abs(b.then.level - b.first.level) < 0.05 ? `was still at ${r1(b.then.level)}` : `had gone from ${r1(b.first.level)} to ${r1(b.then.level)}`}${b.then.forecast !== undefined ? `${Math.abs(b.then.level - b.first.level) < 0.05 ? ', and its forecast had gone' : ' and its forecast'} from ${said(b.first.forecast, b.then.forecast - b.first.forecast)} to ${said(b.then.forecast, b.then.forecast - b.first.forecast)} a piece` : ''}.`);
  }
  const change = now - was.first.forecast;
  // Its forecast said once where it hasn't moved at four places (from 2026-10-19, brief 15): until then “gone from 0.8339 to 0.8339”.
  const forecastSaid = Math.abs(change) < 0.00005 ? `its forecast is still ${now.toFixed(2)} a piece` : null;
  const stillAt = Math.abs(level - was.first.level) < 0.05;
  const parts: string[] = [`It has led the advice on what to train since ${date(was.since)}, ${agoOf(sim.now - was.since)}. ${stillAt ? `It’s still at ${r1(level)}, and ${forecastSaid ?? `its forecast has gone from ${said(was.first.forecast, change)} to ${said(now, change)} a piece`}` : `Since then it’s gone from ${r1(was.first.level)} to ${r1(level)}, and ${forecastSaid ?? `its forecast from ${said(was.first.forecast, change)} to ${said(now, change)} a piece`}`}`];
  // The work since: how many pieces, and how many it held back (each piece's own limits).
  const work = (person.work ?? []).filter((w) => w.at >= was.since);
  const held = work.filter((w) => w.limits.some((l) => l.what === first.target && (l.kind === 'ability' || l.kind === 'technique')));
  parts.push(work.length === 1 ? (held.length ? `It held back the one piece you’ve done since, ${held[0]!.what}, on ${date(held[0]!.at)}` : 'It didn’t hold back the one piece you’ve done since') : work.length ? `Of the ${work.length} pieces you’ve done since, it held back ${held.length || 'none'}${held.length ? `, most recently ${held.at(-1)!.what}, on ${date(held.at(-1)!.at)}` : ''}` : 'You haven’t done any new work since');
  // The hours of its exercise, from the development record (`DevelopmentLedger.history`, the latest it keeps).
  const ex = first.exercise ? EXERCISE_BY_ID[first.exercise] : undefined;
  const hist = person.development?.history ?? [];
  const short = (from: number) => hist.length >= DEVELOPMENT.historyKept && (hist[0]?.at ?? 0) > from;
  const hoursSince = (from: number) => (ex ? hist.filter((h) => h.at >= from && h.id === targetId(first.target as never) && h.source === `practice:${ex.id}`).length : 0);
  if (ex) { const n = hoursSince(was.since); parts.push(n ? `You’ve practiced ${ex.label} for ${short(was.since) ? 'at least ' : ''}${n} ${n === 1 ? 'hour' : 'hours'} since` : `You haven’t practiced ${ex.label} since`); }
  out.push(`${parts.join('. ')}.`);
  // What moved its forecast since it was first given, in parts (from brief 12): until then a rise there was said with
  // nothing to account for it (adv-t-5's composure, still at 42, "its forecast from 1.00 to 1.28").
  if (Math.abs(change) > 1e-12) { const m = movedSaid(forecastChange(sim, person, first.target, was.first), 'its forecast since it took the lead', change > 0); if (m) out.push(m); }
  // Since the latest work (`last`): what practice did, and where the forecast rose, discipline's part of the rise
  // (F2-A10 (h), brief 11): a small increase explained by what improved.
  const last = was.last;
  const discipline = abilityOf(sim, person, 'discipline');
  const hours = hoursSince(last.at);
  const lifted = Math.abs(discipline - last.discipline) >= 0.05 && now > last.forecast;
  const part = lifted ? disciplinePart(sim, person, first.target, last, now, discipline) : undefined;
  if (last.at > was.since && hours > 0) {
    const by = now - last.forecast;
    out.push(`Since ${date(last.at)} you’ve put in ${hours} ${hours === 1 ? 'hour' : 'hours'} of ${ex!.label}: it went from ${r1(last.level)} to ${r1(level)}, and its forecast from ${said(last.forecast, by)} to ${said(now, by)}${part ? `, a little up because ${part}` : ''}.`);
  } else if (part) {
    out.push(`Its forecast is a little up on ${said(last.forecast, now - last.forecast)} because ${part}.`);
  }
  // And since the latest work, where that's a later note than the first (from brief 12).
  if (last.at > was.since && Math.abs(now - last.forecast) > 1e-12) { const m = movedSaid(forecastChange(sim, person, first.target, last), `its forecast since ${date(last.at)}`, now > last.forecast); if (m) out.push(m); }
  return out.join(' ');
}

/** What each part of a forecast's change is said as (from brief 12; `forecastChange`, `CHANGE_ORDER`). */
const PART_SAID: Readonly<Record<ChangePart, string>> = { work: 'the work it’s forecast on', genre: 'how well you know its genres', others: 'your other abilities and techniques', own: 'its own level', discipline: 'discipline' };

/**
 * A forecast's change said in parts (from brief 12; advice-criteria.md, H4): each part that shows at four places, by
 * name, and whatever the parts don't account for (`residual`) as untraced. Undefined where nothing shows at four places.
 * Where a rise can't be worked out (a note from before brief 12, or the work it read no longer kept), it says so; a fall
 * that can't is said as brief 11 said it.
 */
function movedSaid(ch: ForecastChange | undefined, what: string, rose: boolean): string | undefined {
  if (!ch) return rose ? `What moved ${what} can’t be worked out: the advice was noted before it kept what it’s forecast on, or the work it was forecast on then is no longer on your record.` : undefined;
  const shown = CHANGE_ORDER.filter((k) => Math.abs(ch.parts[k]) >= 0.00005).map((k) => `${PART_SAID[k]}, ${signed(ch.parts[k], 4)}`);
  const untraced = Math.abs(ch.residual) >= 0.00005 ? `${signed(-ch.residual, 4)} the advice can’t trace to anything it’s forecast on` : undefined;
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
  // What each piece was, its parts with “and” inside them, joined with a comma before the last (from 2026-10-19, brief 15).
  const listed = (xs: readonly string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')}, and ${xs.at(-1)}` : xs[0] ?? '');
  const was = (n: number) => (n === 1 ? 'was' : 'were');
  const own: string[] = [];
  // The pieces are every kind of work judged, a class showing and a night on stage as well as a tape, so they aren't
  // all “taped”; and “count as taped” is said as a player would say it (from 2026-10-19, brief 15).
  if (a.complete) own.push(`${a.complete} ${was(a.complete)} fully prepared`);
  if (a.short) own.push(`${a.short} ${was(a.short)} underprepared and ${a.short === 1 ? 'is counted as it was' : 'are counted as they were'}`);
  if (a.prepared.length) own.push(`${a.prepared.length} ${was(a.prepared.length)} underprepared but ${a.prepared.length === 1 ? 'is' : 'are'} counted as fully prepared`);
  // One piece is “it”, not “1 was” (from 2026-10-19, brief 15).
  const out = [`What the forecast assumes of your last ${a.pieces === 1 ? 'piece' : `${a.pieces} pieces`}: ${a.pieces === 1 ? own[0]!.replace(/^1 /, 'it ') : listed(own)}.`];
  if (a.prepared.length) {
    const label = (task: string, part: string) => (TASK_PROFILES[task]?.prepLabel?.[part] ?? (part === 'approach' ? 'Rehearsing how you play it' : part)).toLowerCase();
    for (const p of a.prepared) out.push(`In ${p.what}, ${list(p.parts.map((x, i) => `${label(p.task, x.part)} ${p.parts.length > 1 && i > 0 ? '' : 'stood '}at ${Math.round(x.share * 100)}%`))} of the way to complete.`);
    const taped = exactOf(trainingForecast(sim, person, person.work ?? [], [first.target], true).get(first.target));
    out.push(`The forecast counts ${a.prepared.length === 1 ? 'that piece' : 'those pieces'} as fully prepared, since ${a.prepared.length === 1 ? 'its' : 'their'} own preparation held ${a.prepared.length === 1 ? 'it' : 'each'} back most.${taped !== undefined ? ` Counted as ${a.prepared.length === 1 ? 'it was' : 'they were'}, ${first.forecast!.hours} hours of ${first.label.toLowerCase()} would be worth about ${taped.toFixed(2)} a piece, not ${exactOf(first.forecast)!.toFixed(2)}.` : ''}`);
  }
  out.push(a.genreCount === 1 ? `${a.pieces === 1 ? 'Its genre is counted' : 'One of them depends on knowing a genre, counted'} as you know it today: ${a.genreShort ? 'it’s short of complete' : 'it’s complete'}${a.genreBetter ? ', and you know it better than when you taped it' : ''}.` : a.genreCount ? `Each genre is counted as you know it today: of the ${a.genreCount} pieces’ genres, ${a.genreShort} ${a.genreShort === 1 ? 'is' : 'are'} short of complete and ${a.genreBetter} ${a.genreBetter === 1 ? 'is' : 'are'} known better than when you taped them.` : `${a.pieces === 1 ? 'It doesn’t' : 'None of them'} depend${a.pieces === 1 ? '' : 's'} on knowing a genre.`);
  return out.join(' ');
}

/**
 * Whether preparation, ability development or both deserve attention now (from brief 12; advice-criteria.md, F5): two
 * figures in the same units, points a piece on the recent work as you are now. Preparation's (`preparationWorth`): each
 * piece's own preparation complete, then its genre known in full, against each as taped with its genre as known today.
 * Training's: the first training recommendation's forecast. Each deserves attention at the advice's floor, a tenth.
 */
export interface Attention { own: number; genre: number; preparation: number; training?: number; target?: string; verdict: 'both' | 'preparation' | 'training' | 'neither' }
export function attentionOf(sim: Simulation, person: Person, first?: Recommendation): Attention | undefined {
  const w = preparationWorth(sim, person);
  if (!w) return undefined;
  const preparation = w.own + w.genre;
  const training = first ? exactOf(first.forecast) : undefined;
  const p = preparation >= ADVICE_FLOOR;
  const t = training !== undefined && training >= ADVICE_FLOOR;
  return { ...w, preparation, ...(training !== undefined ? { training, target: first!.target } : {}), verdict: p && t ? 'both' : p ? 'preparation' : t ? 'training' : 'neither' };
}

/** The verdict said, with both figures, the larger first where both deserve attention. */
function attentionSaid(a: Attention | undefined, first?: Recommendation): string | undefined {
  if (!a) return undefined;
  const n2 = (x: number) => x.toFixed(2);
  const prep = `coming to your recent work fully prepared would have added about ${n2(a.preparation)} a piece as you are now (${n2(a.own)} from each piece’s own preparation, ${n2(a.genre)} from knowing its genre in full)`;
  const train = first && a.training !== undefined ? `${first.forecast!.hours} hours of ${first.label.toLowerCase()} would add about ${n2(a.training)}` : undefined;
  switch (a.verdict) {
    case 'both': return a.preparation > a.training! ? `Both preparation and training are worth your time now, preparation more: ${prep}, and ${train}.` : `Both training and preparation are worth your time now, training more: ${train} a piece, and ${prep}.`;
    case 'training': return `Training is worth your time now, and preparation isn’t: ${train} a piece, and ${prep}, less than the tenth of a point a result shows.`;
    case 'preparation': return `Preparation is worth your time now, and training isn’t: ${prep}${train ? `, and ${train}, under a tenth` : ', and no hours of practice are forecast to add a tenth'}.`;
    default: return `Neither preparation nor training would add a tenth of a point to your recent work now: ${prep}${train ? `, and ${train}` : ', and no hours of practice are forecast to add a tenth'}.`;
  }
}

/**
 * How much of a forecast's change since a note is discipline's (from brief 11, F2-A10 (h)): discipline then and now, the
 * lift each hour grows by at each (`gainAfter`), and the forecast now at the discipline it had then, so the rest is the
 * input's own (its level, and the work).
 */
function disciplinePart(sim: Simulation, person: Person, id: string, then: AdvisedAt, now: number, discipline: number): string {
  const atThen = exactOf(forecastAtDiscipline(sim, person, id, then.discipline));
  const lifts = `an hour of practice now grows it ×${liftAt(discipline).toFixed(3)}, where it was ×${liftAt(then.discipline).toFixed(3)}, though twenty days of practice would now add less discipline beside it`;
  if (atThen === undefined) return `discipline went from ${r1(then.discipline)} to ${r1(discipline)}, so ${lifts}`;
  const places = Math.abs(now - then.forecast) < 0.001 ? 4 : 3;
  // Until brief 12 (2026-10-17) the rest was said as "its own", where it holds whatever else moved (the work, the genres,
  // the other inputs) beside the input's own level; the parts are said after it where the note kept its state.
  return `discipline went from ${r1(then.discipline)} to ${r1(discipline)}: ${lifts}. At discipline ${r1(then.discipline)} its forecast would be ${atThen.toFixed(places)}, so ${signed(now - atThen, places)} of the change is discipline’s and ${signed(atThen - then.forecast, places)} comes from everything else`;
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
  const n = nextParts(sim, person, first);
  return n && `Next: ${n.action}${n.no ? ` Not now: ${n.no}` : ''}`;
}

/** `nextOf` in its parts (from 2026-10-20, brief 16): the action, and why it can't be done now, which the card says apart. */
function nextParts(sim: Simulation, person: Person, first: Recommendation): { action: string; no?: string } | undefined {
  const e = first.exercise ? EXERCISE_BY_ID[first.exercise] : undefined;
  if (!e) return undefined;
  const tier = first.tier ?? matchedTier(levelOf(sim, person, e.trains as never));
  const no = practiceRefusal(sim, person, e);
  const energy = e.feet ? PRACTICE.energy.feet : PRACTICE.energy.desk;
  // The panel it's in, the ability's or the technique's (from 2026-10-19, brief 15): until then Attributes And Craft for both,
  // where a technique's exercise is in the Techniques table.
  const panel = isAbility(targetId(e.trains as never)) ? 'Attributes And Craft' : 'Techniques';
  const hour = `${e.label} at the ${TIER.label[tier]} tier, with Focus on ${FOCUS[first.focus === 'spaced' ? 'spaced' : 'steady'].label}. It’s in the Practice column under ${panel} on your Player Profile: open it and press Practice An Hour. An hour costs ${energy} energy${e.feet ? ', on your feet' : ''}`;
  if (no) return { action: `${hour}.`, no };
  const p = practicePreview(sim, person, e, tier, first.focus === 'spaced' ? 'spaced' : 'steady');
  return { action: `${hour}, and it would add about +${p.gain.toFixed(2)} to ${labelOf(targetId(e.trains as never)).toLowerCase()} now${p.discipline > 0 ? `, plus +${p.discipline.toFixed(2)} to discipline for a day of practice kept` : ''}.` };
}

/** Where training reaches nothing more in the recent work (from brief 10): said, with what's short and what builds it. Its target has a colon, so a reader of training targets passes it by. */
function allFull(short: readonly AbilityId[]): Recommendation {
  const builds: Partial<Record<AbilityId, string>> = { stamina: 'workouts build it', discipline: 'practice kept up day after day builds it' };
  const left = short.map((id) => `${ABILITY_DEFS.find((d) => d.id === id)!.label.toLowerCase()} isn’t full, and no exercise trains it: ${builds[id] ?? 'the work itself builds it'}`);
  return { target: 'full:all', label: 'Everything You Can Train Is At Full', focus: 'full', points: 0, why: `Every ability and technique your recent work called on that an exercise trains is at its full (for a technique, ${MASTERED}, past which no piece asks more), so more practice wouldn’t improve that work.${left.length ? ` Of what else it called on, ${left.join('; ')}.` : ''} What’s left is new material and new ways of playing it.` };
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
  // At two places (from 2026-10-19, brief 15): until then at the tenth, which could print “about 0.6 points a piece, against 0.6”.
  const mine = theirs?.forecast ? exactOf(theirs.forecast)! : undefined;
  const said = theirs?.forecast ? `${theirs.forecast.hours} hours of it are forecast at about ${mine!.toFixed(2)} a piece, against ${exactOf(top.forecast)!.toFixed(2)} for ${top.label.toLowerCase()}` : `it would pay less to train than ${top.label.toLowerCase()}`;
  return `What held your last piece back most was ${held.label.toLowerCase()}, but it isn’t what pays most to train now: ${said}. ${capFirst(top.label.toLowerCase())} is called on by more of your recent work, or has more room to grow.`;
}

/**
 * The advice as the Profile and a brief's pane put it first (from 2026-10-20, the owner's brief 16, section 6): what to
 * work on, why it matters now, the action, what it's expected to bring said as an estimate, and why it can't be done now
 * where it can't; and behind Why This Recommendation, the reasoning, each part said once. Until then each recommendation
 * was its whole reasoning inline, the first with four more paragraphs beside it, and the shared ones said again in each:
 * 437 blocks over brief 16's seven baseline students averaged 674 words and 56 figures, at most 898 words, with 9.6
 * sentences said twice in the same block (docs/verification/voices-2026-10-20/before/). Nothing here is worked out
 * afresh: every figure is the recommendation's own, read from the forecast that ranked it.
 */
export interface AdviceSection {
  heading: string;
  lines: string[];
  /** What the section's first line is, where a reader of the screen looks for it (`data-standing`, `data-assumes`, `data-attention`). */
  mark?: 'standing' | 'assumes' | 'attention';
}
export interface AdviceSummary {
  target: string;
  /** What to work on, as the heading says it. */
  what: string;
  /** Why it matters now: a sentence or two. */
  why: string;
  /** What to do: where, at what tier and focus, what an hour costs and brings now. */
  action?: string;
  /** What it's expected to bring, said as an estimate. */
  estimate?: string;
  /** Why the action can't be done now (`practiceRefusal`, the command's own refusal). */
  unavailable?: string;
  details: AdviceSection[];
}

/** How a forecast says the work it read (`recommendations`'s words): the pieces that call on it, of how many. */
function readOf(f: Forecast): string {
  const calls = `${f.pieces === 1 ? 'calls' : 'call'} on it`;
  if (f.of === undefined) return `${f.pieces} of the pieces ${calls}`;
  return f.of === 1 && f.pieces === 1 ? `your last piece ${calls}` : f.pieces === f.of ? `your last ${f.of} pieces all call on it` : `${f.pieces} of your last ${f.of} ${f.of === 1 ? 'piece' : 'pieces'} ${calls}`;
}
const pointsOf = (n: number) => `${n} ${n === 1 ? 'point' : 'points'}`;
const listOf = (xs: readonly string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0] ?? '');

/** The first recommendation said short, and its reasoning in sections (brief 16). `primary` is the one the screen puts first. */
export function adviceSummary(sim: Simulation, person: Person, recs: readonly Recommendation[], primary: Recommendation | undefined = recs[0]): AdviceSummary | undefined {
  if (!primary) return undefined;
  const first = recs.find((r) => r.forecast);
  const f = primary.forecast;
  let why = primary.now ?? primary.why;
  let action: string | undefined = primary.act;
  let estimate: string | undefined;
  let unavailable: string | undefined;
  if (f) {
    // Why now: what it would add against everything else that can be trained, the work that says so, and anything near it.
    why = `Of what you can train, it would add most to your recent work: ${readOf(f)}.`;
    if (primary.recurring) why += ` It keeps holding your work back, most recently on ${formatDate(primary.recurring.last, sim.zone)}.`;
    if (primary.tiedWith?.length) why += ` ${capFirst(listOf(primary.tiedWith).toLowerCase())} would be about as useful.`;
    estimate = `Estimate: ${f.hours} hours${f.of !== undefined ? ', an hour a day,' : ''} would take it from ${Math.round(f.from)} to about ${Math.round(f.to)}, worth about ${pointsOf(primary.points)} a piece on your recent work.`;
  }
  // The action is the first's `next` without its "Next:", in the same words, and why not now said apart.
  const n = nextParts(sim, person, primary);
  if (n) { action = n.action; if (n.no) unavailable = `Not now: ${n.no}`; }
  const details: AdviceSection[] = [];
  // How the estimates are worked out: the method, the first training's work and its parts, the focus and what's assumed,
  // each once. Until then the focus and the method were said again in every recommendation.
  const lead = recs.find((r) => r.assumes) ?? first;
  if (first?.forecast) {
    const ff = first.forecast;
    const lines = ['Each estimate is your recent work judged again as you are now, with the hours of practice added: what that would be worth a piece, in points of the whole, the latest piece counting most.'];
    lines.push(`For ${first.label.toLowerCase()}, ${readOf(ff)}${ff.most ? `; ${ff.most.what} would gain most, about ${ff.most.points >= 0 ? '+' : ''}${Math.round(ff.most.points * 10) / 10}` : ''}.`);
    if ((ff.days ?? 0) >= 0.05) lines.push(`About ${Math.round(ff.days! * 10) / 10} of its estimate comes from the discipline ${ff.hours} days of practice build, which any exercise kept up daily would bring too.`);
    if (ff.prepared && !lead?.assumes) lines.push(`It counts ${ff.prepared === 1 ? 'the piece' : `the ${ff.prepared} pieces`} held back most by ${ff.prepared === 1 ? 'its' : 'their'} own preparation as if fully prepared.`);
    lines.push(first.focus === 'spaced' ? SPACED_NOW : STEADY_FIRST);
    lines.push('It’s an estimate: it reads only the work on your record, and the work you do next may call on different things.');
    details.push({ heading: 'How The Estimate Is Worked Out', lines });
  }
  if (lead?.assumes) details.push({ heading: 'What It Assumes Of Your Work', lines: [lead.assumes], mark: 'assumes' });
  const attention = recs.find((r) => r.attention)?.attention;
  const prepApart = first?.forecast && first.forecast.preparation !== undefined && (first.forecast.prepared ?? 0) > 0
    ? `Apart from training, fully preparing ${first.forecast.prepared === 1 ? 'the piece' : `the ${first.forecast.prepared} pieces`} held back most by ${first.forecast.prepared === 1 ? 'its' : 'their'} own preparation would bring ${first.forecast.prepared === 1 ? 'it' : 'them'} about ${Math.round(first.forecast.preparation * 100) / 100} ${Math.round(first.forecast.preparation * 100) === 100 ? 'point' : 'points'} a piece as you are now. That’s preparation, not training, and it isn’t part of ${first.label.toLowerCase()}’s estimate.`
    : undefined;
  if (attention || prepApart) details.push({ heading: 'Preparation Or Training', lines: [attention, prepApart].filter((x): x is string => !!x), ...(attention ? { mark: 'attention' as const } : {}) });
  const standing = recs.find((r) => r.standing)?.standing;
  if (standing) details.push({ heading: 'How Long It’s Been First', lines: [standing], mark: 'standing' });
  // From the record: the weakness that keeps coming back, what it rests on, and what held the last piece against what pays.
  const record: string[] = [];
  for (const r of recs) {
    if (!r.recurring) continue;
    record.push(`${r.label} keeps coming back in your work${r.recurring.pieces !== undefined ? `: it has held back ${r.recurring.pieces} of your pieces in all, ${pointsOf(r.recurring.whole ?? 0)} off the whole across them` : ''}, the last on ${formatDate(r.recurring.last, sim.zone)}. ${capFirst(r.recurring.evidence.join('; '))}.`);
  }
  const versus = heldVersusNext(person, recs);
  if (versus) record.push(versus);
  if (record.length) details.push({ heading: 'From Your Record', lines: record });
  // The others, a line each: what, the exercise, and its estimate or its cost. Shared reasoning isn't said again.
  const others = recs.filter((r) => r !== primary).map((r) => {
    const ex = r.exercise ? EXERCISE_BY_ID[r.exercise] : undefined;
    const doing = ex ? `, ${ex.label} at the ${TIER.label[r.tier ?? 0]} tier` : '';
    if (r.forecast) return `${r.label}${doing}: an estimated ${pointsOf(r.points)} a piece for ${r.forecast.hours} hours, from ${Math.round(r.forecast.from)} to about ${Math.round(r.forecast.to)}.${primary.tiedWith?.includes(r.label) ? ' About as useful as the first.' : ''}`;
    return `${r.label}${doing}: ${r.why}`;
  });
  if (others.length) details.push({ heading: 'Other Things Worth Your Time', lines: others });
  if (primary.more) details.push({ heading: `More On ${primary.label}`, lines: [primary.more] });
  return { target: primary.target, what: primary.label, why, ...(action ? { action } : {}), ...(estimate ? { estimate } : {}), ...(unavailable ? { unavailable } : {}), details };
}
