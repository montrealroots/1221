/**
 * SLATE — deliberate practice (from the connected attributes of 2026-10-09).
 *
 * `practice.exercise` is an hour on one exercise (`content/practice.ts`): the
 * hour passes, it costs energy, and the ability or technique it trains grows
 * by deliberate practice (`develop`), which goes on past where classes level
 * off. What stops it being farmed: the same exercise again the same day
 * gives half what it gave before, a day's practice stops counting at four
 * hours, and nothing grows from anything but the hour itself (opening a
 * screen, saving and loading, or asking again is no hour). Discipline grows
 * once for each day practised.
 *
 * From 2026-10-10 an hour is practice on a challenge (`EXERCISE_DESIGN`): its material at a tier chosen against the
 * actor's level (`TIER`), and a focus for the hour (`FOCUS`): steady, precision, spaced, variation or live. Each
 * focus is better somewhere and worse somewhere else; the same exercise twice in a day still keeps half, whatever the
 * focus, since the focus doesn't change what's being practised (the source is the exercise's alone). What it
 * carries over to grows by the same rule, under its own source. The hour says what it found: the tier against the
 * actor, what the focus made of it, what carried over, and what would fit next time (`feedback`), from the same
 * numbers that moved the level.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatTime, zonedParts } from '../core/time';
import { EXERCISE_BY_ID, EXERCISE_DESIGN, FOCUS, FOCUS_RATE, PRACTICE, TIER, type Exercise, type PracticeFocus } from '../content/practice';
import { experienceOf, FEATURE_LABEL } from './experience';
import { abilityDef, abilityFull, isAbility } from './attributes';
import { SKILLS } from '../content/school';

/** A target's label: an ability's, or a technique's. */
const labelOf = (id: string): string => (isAbility(id as never) ? abilityDef(id as never).label : SKILLS.find((k) => k.id === id)?.label ?? id);
import { abilityOf, alreadyApplied, develop, developmentOf, levelOf, markApplied, previewGrowth, repeatsSoFar, targetId } from './attributes';
import { DEVELOPMENT, MASTERED, TECHNIQUES } from '../content/abilities';
import type { Skill } from '../content/school';
import { focusAt } from './school';
import { SPENT, commitmentWithin, occupiedAt } from './life';
import { exerts } from './body';
import { trainingRefusal } from './injury';
import { inHospital } from './health';
import { noteAdvice } from './next-steps';

/** Today's date at home, the key a day's practice is counted under. */
const today = (sim: Simulation) => { const p = zonedParts(sim.now, sim.homeZone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };

/** The hours practised today, from the development ledger's own count. */
export function practicedToday(sim: Simulation, person: Person): number {
  const led = developmentOf(person);
  return led.practice?.day === today(sim) ? led.practice.hours : 0;
}

/** Why an exercise can't be done now, or nothing. */
export function practiceRefusal(sim: Simulation, person: Person, e: Exercise | undefined): string | undefined {
  if (!e) return 'There’s no such exercise.';
  // A craft is the School's to begin (`enroll`): a life with none is refused, where until 2026-10-10 a technique's exercise threw.
  if (!person.craft) return 'You haven’t started training, so there’s nothing to practice yet.';
  if (inHospital(person, sim.now)) return 'Not from a hospital bed.';
  const asleep = person.awakeSince !== undefined && person.awakeSince > sim.now;
  if (asleep) return 'You’re asleep.';
  const busy = occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  const ahead = commitmentWithin(sim, PRACTICE.minutes);
  if (ahead) return ahead;
  if (practicedToday(sim, person) >= PRACTICE.dailyHours) return `You’ve practiced ${PRACTICE.dailyHours} hours today, and more stops helping after that. Practice again tomorrow.`;
  if (e.feet) {
    if (person.wellbeing.energy < SPENT) return 'You’re too tired to work on your feet. Sleep first.';
    const hurt = trainingRefusal(person, sim.now);
    if (hurt) return hurt;
  }
  // “It takes a classmate, and you have no class to ask.” stood here until 2026-10-13, reached by no play: a craft is
  // the School’s to begin, refused above without one, and a student always has a class, kept through withdrawal and
  // after the degree (found by that day’s final defect pass).
  return undefined;
}

/** The tier matched to a level (`TIER.bands`). */
export const matchedTier = (level: number): 0 | 1 | 2 => (level < TIER.bands[0] ? 0 : level < TIER.bands[1] ? 1 : 2);

/** What a tier makes of an hour at a level. */
export function tierFactor(tier: 0 | 1 | 2, level: number): number {
  const d = tier - matchedTier(level);
  return d === 0 ? TIER.matched : Math.abs(d) >= 2 ? TIER.far : d < 0 ? TIER.below : TIER.above;
}

/** Days since the exercise was last practised, from the record; undefined for the first time. */
function daysSince(sim: Simulation, person: Person, id: string): number | undefined {
  const last = person.experience?.exercises?.[id]?.lastDay;
  if (!last) return undefined;
  const [y, m, d] = last.split('-').map(Number);
  const p = zonedParts(sim.now, sim.homeZone);
  return Math.round((Date.UTC(p.year, p.month - 1, p.day) - Date.UTC(y!, m! - 1, d!)) / 86_400_000);
}

/** What a focus makes of the hour on its own target, at a focus of the day and a gap since the last session. */
export function focusFactor(f: PracticeFocus, dayFocus: number, gap: number | undefined): number {
  if (f === 'precision') return dayFocus >= FOCUS_RATE.precision.restedAt ? FOCUS_RATE.precision.rested : FOCUS_RATE.precision.tired;
  if (f === 'spaced') return gap !== undefined && gap >= FOCUS_RATE.spaced.fromDays && gap <= FOCUS_RATE.spaced.toDays ? FOCUS_RATE.spaced.within : FOCUS_RATE.spaced.outside;
  if (f === 'variation') return FOCUS_RATE.variation.primary;
  if (f === 'live') return FOCUS_RATE.live.primary;
  return 1;
}

/** Why a focus can't be taken for an exercise now, or nothing. */
export function focusRefusal(f: string): string | undefined {
  if (!(f in FOCUS)) return 'There’s no such way to practice.';
  // Until 2026-10-13 a live focus was refused with no class to ask, and a variation for an exercise carrying over to
  // nothing; no play reached either: every student has a class (`practiceRefusal`), and each of the 27 exercises
  // carries over to something (`EXERCISE_DESIGN`; found by that day’s final defect pass).
  return undefined;
}

/** What carries over from a focus: the exercise's kin for variation, listening and adaptability for live work. */
const carriesTo = (e: Exercise, f: PracticeFocus): { target: string; weight: number }[] => {
  if (f === 'variation') return (EXERCISE_DESIGN[e.id]?.transfer ?? []).filter((t) => t !== e.trains).map((t) => ({ target: t, weight: FOCUS_RATE.variation.transfer }));
  if (f === 'live') return (['listening', 'adaptability'] as const).filter((t) => t !== e.trains).map((t) => ({ target: t, weight: FOCUS_RATE.live.transfer }));
  return [];
};

/** What an hour would grow, said before it (from 2026-10-16): each target's expected gain and the reasons it's that size. */
export interface PracticePreview {
  gain: number;
  target: string;
  level: number;
  carried: { target: string; gain: number }[];
  discipline: number;
  /** The terms the gain is made of, as factors: the tier, the focus, the day's focus, the repeat, discipline's lift. */
  terms: { tier: number; focus: number; day: number; repeat: number; lift: number };
  words: string;
}

/**
 * What an hour on an exercise would grow, counting nothing (from 2026-10-16): the same terms `practiceHour` reads (the
 * tier against the level, the focus, the day's focus at the hour, today's repeats) through the same formula
 * (`previewGrowth`, the one `develop` uses), at the instant the hour would land. Until then the practice control said
 * nothing of what an hour would buy until it had been spent (criterion T1).
 */
export function practicePreview(sim: Simulation, person: Person, e: Exercise, tierAsked?: 0 | 1 | 2, focusAsked: PracticeFocus = 'steady'): PracticePreview {
  const focus = focusAt(sim, person, sim.now);
  const id = targetId(e.trains);
  const before = levelOf(sim, person, id);
  const tier = tierAsked ?? matchedTier(before);
  const tf = tierFactor(tier, before);
  const ff = focusFactor(focusAsked, focus, daysSince(sim, person, e.id));
  const end = sim.now + PRACTICE.minutes * 60_000;
  const gain = previewGrowth(sim, person, e.trains, { weight: tf * ff, focus, deliberate: true, source: `practice:${e.id}` }, 100, end);
  const carried = carriesTo(e, focusAsked).map((c) => ({ target: c.target, gain: previewGrowth(sim, person, c.target as never, { weight: c.weight * tf, focus, deliberate: true, source: `transfer:${e.id}` }, 100, end) }));
  const first = developmentOf(person).practice?.day !== today(sim);
  const discipline = first ? previewGrowth(sim, person, 'discipline', { weight: PRACTICE.disciplineDay, focus: 1, deliberate: true, source: 'practice-day' }, 100, end) : 0;
  const n = repeatsSoFar(sim, person, `${id}<practice:${e.id}`, end);
  const lift = id === 'discipline' ? 1 : 1 + DEVELOPMENT.disciplineLift * (abilityOf(sim, person, 'discipline') - 50) / 50;
  const terms = { tier: tf, focus: ff, day: Math.round(focus * 100) / 100, repeat: 0.5 ** n, lift: Math.round(lift * 1000) / 1000 };
  const label = labelOf(id);
  const why: string[] = [];
  if (tf < 1) why.push(`the ${TIER.label[tier]} tier isn’t your level (×${tf})`);
  if (ff !== 1) why.push(`${FOCUS[focusAsked].label} today makes it ×${ff}`);
  if (focus < 1) why.push(`you’re at ${Math.round(focus * 100)}% of a rested day’s focus`);
  if (n > 0) why.push(`hour ${n + 1} on it today gives ${Math.round(0.5 ** n * 100)}% of the first`);
  if (Math.abs(lift - 1) >= 0.005) why.push(`your discipline makes it ×${terms.lift}`);
  const moved = carried.filter((c) => c.gain > 0);
  const words = gain <= 0
    ? `${label} is full: an hour adds nothing to it.`
    : `About +${gain.toFixed(2)} to ${label.toLowerCase()} (now ${before.toFixed(1)})${moved.length ? `, and ${moved.map((c) => `+${c.gain.toFixed(2)} to ${labelOf(c.target).toLowerCase()}`).join(' and ')}` : ''}${discipline > 0 ? `, and +${discipline.toFixed(2)} to discipline for a day of practice kept` : ''}.${why.length ? ` Compared with an ordinary hour: ${why.join('; ')}.` : ''} The higher your level, the less an hour adds.${pastMastery(id, before)}`;
  return { gain, target: id, level: before, carried, discipline, terms, words };
}

/**
 * What a technique past mastery is worth to the work, said (from 2026-10-16): every piece reads a technique against
 * `MASTERED`, so from there to 100 it moves no result (baseline.md §1: 0 of 427 pieces), and the hour is for the
 * record alone. Empty for an ability, or a technique under it.
 */
export function pastMastery(id: string, level: number): string {
  if (!TECHNIQUES.includes(id as Skill) || level < MASTERED) return '';
  return ` Past ${MASTERED}, no piece of work asks more of a technique, so what it adds from here changes no result.`;
}

/** An hour's practice: the time, the energy, and what it grew, with what it found. */
export function practiceHour(sim: Simulation, person: Person, e: Exercise, tierAsked?: 0 | 1 | 2, focusAsked: PracticeFocus = 'steady'): { gained: number; level: number; discipline: number; tier: 0 | 1 | 2; focus: PracticeFocus; carried: { target: string; gained: number }[]; feedback: string } {
  const focus = focusAt(sim, person, sim.now);
  const before = levelOf(sim, person, targetId(e.trains));
  const tier = tierAsked ?? matchedTier(before);
  const tf = tierFactor(tier, before);
  const gap = daysSince(sim, person, e.id);
  const ff = focusFactor(focusAsked, focus, gap);
  sim.advanceTo(sim.now + PRACTICE.minutes * 60_000);
  exerts(person, e.feet ? PRACTICE.met.feet : PRACTICE.met.desk, PRACTICE.minutes / 60);
  const above = tier > matchedTier(before);
  person.wellbeing.energy = Math.max(0, person.wellbeing.energy - (e.feet ? PRACTICE.energy.feet : PRACTICE.energy.desk) - (above ? TIER.aboveEnergy : 0));
  const gained = develop(sim, person, e.trains, { weight: tf * ff, focus, deliberate: true, source: `practice:${e.id}` });
  const carried = carriesTo(e, focusAsked).map((c) => ({ target: c.target, gained: develop(sim, person, c.target as never, { weight: c.weight * tf, focus, deliberate: true, source: `transfer:${e.id}` }) }));
  // On the record: the session, how, at which tier, and the features it's practice in (`systems/experience.ts`).
  const xp = experienceOf(person);
  const rec = (xp.exercises[e.id] ??= { sessions: 0, focus: {}, tiers: {} });
  rec.sessions += 1;
  rec.lastDay = today(sim);
  const priorTier = rec.lastTier;
  rec.streak = xp.lastExercise === e.id ? (rec.streak ?? 0) + 1 : 1;
  xp.lastExercise = e.id;
  rec.gains = [...(rec.gains ?? []), Math.round(gained * 1000) / 1000].slice(-8);
  rec.lastTier = tier;
  rec.focus[focusAsked] = (rec.focus[focusAsked] ?? 0) + 1;
  rec.tiers[String(tier)] = (rec.tiers[String(tier)] ?? 0) + 1;
  for (const f of EXERCISE_DESIGN[e.id]?.practises ?? []) { const r = (xp.features[f] ??= { met: 0, practiced: 0 }); r.practiced += 1; r.last = sim.now; }
  // The day's hours, and discipline once for a day kept.
  const led = developmentOf(person);
  const day = today(sim);
  const first = led.practice?.day !== day;
  led.practice = { day, hours: (first ? 0 : led.practice!.hours) + PRACTICE.minutes / 60, days: (led.practice?.days ?? 0) + (first ? 1 : 0), ...(first ? { last: day } : { last: led.practice!.last }) };
  // Deliberate, so a habit kept up reaches its full and doesn't stall a hair under it (from 2026-10-10).
  const discipline = first ? develop(sim, person, 'discipline', { weight: PRACTICE.disciplineDay, focus: 1, deliberate: true, source: 'practice-day' }) : 0;
  const level = levelOf(sim, person, targetId(e.trains));
  const full = isAbility(targetId(e.trains)) ? abilityFull(sim, person, targetId(e.trains) as never) : 100;
  // The same exercise again today: the hours before it on the day's count (`repeatsToday`), the half it keeps each.
  const repeats = Math.max(0, (developmentOf(person).counts[`${targetId(e.trains)}<practice:${e.id}`] ?? 1) - 1);
  return { gained, level, discipline, tier, focus: focusAsked, carried, feedback: practiceFeedback(e, before, tier, focusAsked, focus, gap, carried, { gained, level, full, sessions: rec.sessions, streak: rec.streak, gains: rec.gains, priorTier, repeats, dayFocus: focus }) };
}

/** What the hour found, in words, from the numbers that moved it. */
/** What the record says about the hour (from the integration pass of 2026-10-10): its gain, where the level stands, the run and its gains. */
export interface HourRecord { gained: number; level: number; full: number; sessions: number; streak?: number; gains?: number[]; priorTier?: number; repeats?: number; dayFocus?: number }

/** How far the next tier's band is, or nothing past the last. */
const nextBand = (level: number): number | undefined => TIER.bands.find((b) => b > level);

export function practiceFeedback(e: Exercise, level: number, tier: 0 | 1 | 2, f: PracticeFocus, dayFocus: number, gap: number | undefined, carried: { target: string; gained: number }[], hour?: HourRecord): string {
  const design = EXERCISE_DESIGN[e.id];
  const matched = matchedTier(level);
  const out: string[] = [];
  out.push(design ? `${TIER.label[tier]}: ${design.tiers[tier]}.` : '');
  out.push(tier === matched ? 'Pitched at your level.' : tier < matched ? `It went easily: you’re past it, and the ${TIER.label[matched]} tier would ask more.` : `You struggled to hold it: the ${TIER.label[matched]} tier fits where you are now.`);
  if (f === 'precision') out.push(dayFocus >= FOCUS_RATE.precision.restedAt ? 'You were rested, so the exactness paid off.' : 'You were tired, so the exactness cost more than it gave. A Steady hour would have done better today.');
  if (f === 'spaced') out.push(gap !== undefined && gap >= FOCUS_RATE.spaced.fromDays && gap <= FOCUS_RATE.spaced.toDays ? `Picked up after ${gap} day${gap === 1 ? '' : 's'}: the gap helped it stick.` : gap === undefined ? 'Your first session, begun cold: spacing helps from the next one, and a Steady hour would have done better.' : gap === 0 ? 'The same day as your last session: spacing needs a day between, and a Steady hour would have done better.' : 'Too long since your last session: part of the hour went on relearning. Spacing helps within a week.');
  const moved = carried.filter((c) => c.gained > 0);
  if (moved.length) out.push(`It carried over to ${moved.map((c) => labelOf(c.target).toLowerCase()).join(' and ')}.`);
  else if (f === 'variation' || f === 'live') out.push('What it carries over to is full already.');
  const feats = design?.practises.map((x) => FEATURE_LABEL[x]?.toLowerCase()).filter(Boolean) ?? [];
  if (feats.length) out.push(`It also counts as experience of ${feats.join(' and ')}, so material that asks for it prepares faster.`);
  if (level >= 100) out.push('It’s at its full, whatever the focus. What’s left is new material.');
  // Past mastery, said (from 2026-10-16): until then an hour on a technique at 95 said what it rose by and not that no
  // work reads it past `MASTERED`.
  else if (hour) out.push(pastMastery(targetId(e.trains), hour.level).trim());
  // What changed, from the record (from the integration pass of 2026-10-10): the hour's gain and where the level now
  // stands against the next tier and full, the move up a tier since last time, and a long run whose gains are falling.
  if (hour && hour.level < hour.full) {
    const label = labelOf(e.trains);
    const band = nextBand(hour.level);
    out.push(`${label} ${hour.gained > 0 ? `rose ${hour.gained.toFixed(2)}, to` : 'stands at'} ${hour.level.toFixed(1)} of ${Math.round(hour.full)}${band !== undefined && band < hour.full ? `, ${(band - hour.level).toFixed(1)} short of the ${TIER.label[matchedTier(band)]} tier` : ''}.`);
    // Why an hour gave less, where it did (acceptance pass, 2026-10-11): a tired day scales every hour, not only a
    // precise one's; a repeat the same day keeps half the one before.
    if ((hour.repeats ?? 0) > 0) out.push(`Hour ${(hour.repeats ?? 0) + 1} on it today: each repeat gives half the one before, so another exercise would give more.`);
    if (f !== 'precision' && (hour.dayFocus ?? 1) < 0.7) out.push('A tired day: the hour counted for less than a rested one would.');
    if (hour.priorTier !== undefined && hour.priorTier < matched && tier === matched) out.push(`You’ve moved up to the ${TIER.label[matched]} tier since last time.`);
    const g = hour.gains ?? [];
    const slowing = g.length >= 6 && g.slice(-3).reduce((a, b) => a + b, 0) < 0.8 * g.slice(0, 3).reduce((a, b) => a + b, 0);
    if ((hour.streak ?? 0) >= 6) out.push(`Session ${hour.streak} on it in a row${slowing ? `: each hour is giving less as ${label.toLowerCase()} nears its full${design?.transfer.length ? `. A Variation hour would carry some to ${design.transfer.map((t) => labelOf(t).toLowerCase()).join(' and ')} instead` : ''}` : ''}.`);
  }
  return out.filter(Boolean).join(' ');
}

export function registerPractice(sim: Simulation): void {
  sim.onCommand<{ exercise: string; actionId?: string; tier?: number; focus?: string }, ReturnType<typeof practiceHour>>('practice.exercise', (p, { sim: s }) => {
    const person = s.player;
    const e = EXERCISE_BY_ID[String(p?.exercise)];
    const focus = (p?.focus ?? 'steady') as PracticeFocus;
    const tier = p?.tier === undefined ? undefined : Number(p.tier);
    if (tier !== undefined && tier !== 0 && tier !== 1 && tier !== 2) throw new CommandError('There’s no such tier.');
    const no = alreadyApplied(person, p?.actionId) ?? practiceRefusal(s, person, e) ?? focusRefusal(focus);
    if (no) throw new CommandError(no);
    markApplied(person, p?.actionId);
    // The advice in front of them as they came to practice after new work, noted (from brief 11, `noteAdvice`).
    noteAdvice(s, person, 'practice');
    return practiceHour(s, person, e!, tier as 0 | 1 | 2 | undefined, focus);
  });
}
