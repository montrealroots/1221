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
import { abilityDef, isAbility } from './attributes';
import { SKILLS } from '../content/school';

/** A target's label: an ability's, or a technique's. */
const labelOf = (id: string): string => (isAbility(id as never) ? abilityDef(id as never).label : SKILLS.find((k) => k.id === id)?.label ?? id);
import { alreadyApplied, develop, developmentOf, levelOf, markApplied, targetId } from './attributes';
import { focusAt } from './school';
import { SPENT, commitmentWithin, occupiedAt } from './life';
import { exerts } from './body';
import { trainingRefusal } from './injury';
import { inHospital } from './health';

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
  if (!person.craft) return 'Your training hasn’t begun: there’s no craft to practice yet.';
  if (inHospital(person, sim.now)) return 'Not from a hospital bed.';
  const asleep = person.awakeSince !== undefined && person.awakeSince > sim.now;
  if (asleep) return 'You’re asleep.';
  const busy = occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  const ahead = commitmentWithin(sim, PRACTICE.minutes);
  if (ahead) return ahead;
  if (practicedToday(sim, person) >= PRACTICE.dailyHours) return `You’ve practiced ${PRACTICE.dailyHours} hours today: past that, more stops helping. Tomorrow.`;
  if (e.feet) {
    if (person.wellbeing.energy < SPENT) return 'You’re too tired to work on your feet. Sleep first.';
    const hurt = trainingRefusal(person, sim.now);
    if (hurt) return hurt;
  }
  if (e.partnered && !person.school?.classmates.length) return 'It takes a classmate, and you have no class to ask.';
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
export function focusRefusal(person: Person, e: Exercise, f: PracticeFocus): string | undefined {
  if (!(f in FOCUS)) return 'There’s no such way to practice.';
  if (f === 'live' && !person.school?.classmates.length) return 'It takes a classmate, and you have no class to ask.';
  if (f === 'variation' && !(EXERCISE_DESIGN[e.id]?.transfer.length)) return 'This exercise has nothing it carries over to.';
  return undefined;
}

/** What carries over from a focus: the exercise's kin for variation, listening and adaptability for live work. */
const carriesTo = (e: Exercise, f: PracticeFocus): { target: string; weight: number }[] => {
  if (f === 'variation') return (EXERCISE_DESIGN[e.id]?.transfer ?? []).filter((t) => t !== e.trains).map((t) => ({ target: t, weight: FOCUS_RATE.variation.transfer }));
  if (f === 'live') return (['listening', 'adaptability'] as const).filter((t) => t !== e.trains).map((t) => ({ target: t, weight: FOCUS_RATE.live.transfer }));
  return [];
};

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
  return { gained, level, discipline, tier, focus: focusAsked, carried, feedback: practiceFeedback(e, before, tier, focusAsked, focus, gap, carried) };
}

/** What the hour found, in words, from the numbers that moved it. */
export function practiceFeedback(e: Exercise, level: number, tier: 0 | 1 | 2, f: PracticeFocus, dayFocus: number, gap: number | undefined, carried: { target: string; gained: number }[]): string {
  const design = EXERCISE_DESIGN[e.id];
  const matched = matchedTier(level);
  const out: string[] = [];
  out.push(design ? `${TIER.label[tier]}: ${design.tiers[tier]}.` : '');
  out.push(tier === matched ? 'Pitched where you are.' : tier < matched ? `It went easily: you’re past it, and the ${TIER.label[matched].toLowerCase()} tier would ask more.` : `You struggled to hold it: the ${TIER.label[matched].toLowerCase()} tier fits where you are now.`);
  if (f === 'precision') out.push(dayFocus >= FOCUS_RATE.precision.restedAt ? 'Rested, the exactness paid.' : 'Tired, the exactness cost more than it gave: a steady hour would have done better today.');
  if (f === 'spaced') out.push(gap !== undefined && gap >= FOCUS_RATE.spaced.fromDays && gap <= FOCUS_RATE.spaced.toDays ? `Picked up after ${gap} day${gap === 1 ? '' : 's'}: the gap helped it stick.` : gap === undefined ? 'The first time, begun cold: spacing helps from the next session, and a steady hour would have done better.' : gap === 0 ? 'The same day as the last: spacing needs a day between, and a steady hour would have done better.' : 'Too long since the last: the hour went partly on relearning. Spacing helps within a week.');
  const moved = carried.filter((c) => c.gained > 0);
  if (moved.length) out.push(`It carried over to ${moved.map((c) => labelOf(c.target).toLowerCase()).join(' and ')}.`);
  else if (f === 'variation' || f === 'live') out.push('What it carries over to is full already.');
  const feats = design?.practises.map((x) => FEATURE_LABEL[x]?.toLowerCase()).filter(Boolean) ?? [];
  if (feats.length) out.push(`Practice in ${feats.join(' and ')}: material that asks it prepares faster.`);
  if (level >= 100) out.push(`${FOCUS[f].label} or not, it’s full: the work now is in new material.`);
  return out.filter(Boolean).join(' ');
}

export function registerPractice(sim: Simulation): void {
  sim.onCommand<{ exercise: string; actionId?: string; tier?: number; focus?: string }, ReturnType<typeof practiceHour>>('practice.exercise', (p, { sim: s }) => {
    const person = s.player;
    const e = EXERCISE_BY_ID[String(p?.exercise)];
    const focus = (p?.focus ?? 'steady') as PracticeFocus;
    const tier = p?.tier === undefined ? undefined : Number(p.tier);
    if (tier !== undefined && tier !== 0 && tier !== 1 && tier !== 2) throw new CommandError('There’s no such tier.');
    const no = alreadyApplied(person, p?.actionId) ?? practiceRefusal(s, person, e) ?? focusRefusal(person, e!, focus);
    if (no) throw new CommandError(no);
    markApplied(person, p?.actionId);
    return practiceHour(s, person, e!, tier as 0 | 1 | 2 | undefined, focus);
  });
}
