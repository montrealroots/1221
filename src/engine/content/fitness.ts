/**
 * SLATE — what a gym is, and what you can do in one.
 *
 * Exercises with a unit and a progression; classes on a timetable; what a
 * gym of a given standing has in it and charges; and the real gyms, named,
 * with only what is on the public record said about them.
 *
 * Honesty rule, as everywhere: a real chain's presence in a city is public
 * record and is stated. Its opening hours, its prices and which branch you
 * are standing in are SLATE's calibration and are labelled that way. SLATE's
 * own gyms say they are SLATE's. The coverage of real gyms is what it is —
 * a handful of cities — and is never described as more.
 */

import type { Money } from '../core/money';
import { makeRng } from '../core/rng';
import { costOfLiving } from './tax';
import type { Place, PlaceAction } from './places';
import type { WorkoutFocus, WorkoutIntensity } from '../domain/model';

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

export type ExerciseFocus = Exclude<WorkoutFocus, 'class'>;
export type Facility = 'weights' | 'cardio' | 'floor' | 'pool' | 'studio' | 'boxing';

export interface ExerciseDef {
  id: string;
  name: string;
  focus: ExerciseFocus;
  facility: Facility;
  /** What the number on the record measures. */
  unit: 'kg' | 'min' | 'reps' | 'm';
  /** First personal best, before any training. */
  start: number;
  /** How much the best moves when a hard set succeeds. */
  step: number;
  minutesPerSet: number;
  /** Per set at steady intensity; easy and hard scale from it. */
  energy: number;
  fitness: number;
  condition: number;
  stress: number;
  /** Chance a hard set goes wrong, before soreness and a trainer. */
  injuryRisk: number;
  /** One line for the scene. */
  cue: string;
}

export const EXERCISES: readonly ExerciseDef[] = [
  { id: 'squat', name: 'Back Squat', focus: 'strength', facility: 'weights', unit: 'kg', start: 40, step: 2.5, minutesPerSet: 4, energy: -4.5, fitness: 0.7, condition: 0.5, stress: -2, injuryRisk: 0.05, cue: 'Bar on your back, hips below the knee, stand up.' },
  { id: 'deadlift', name: 'Deadlift', focus: 'strength', facility: 'weights', unit: 'kg', start: 50, step: 2.5, minutesPerSet: 4, energy: -5, fitness: 0.7, condition: 0.5, stress: -2, injuryRisk: 0.06, cue: 'Flat back, bar close, drive the floor away.' },
  { id: 'bench', name: 'Bench Press', focus: 'strength', facility: 'weights', unit: 'kg', start: 30, step: 2.5, minutesPerSet: 3.5, energy: -3.5, fitness: 0.5, condition: 0.4, stress: -1.5, injuryRisk: 0.04, cue: 'Shoulders pinned, bar to the chest, press.' },
  { id: 'press', name: 'Overhead Press', focus: 'strength', facility: 'weights', unit: 'kg', start: 20, step: 1.25, minutesPerSet: 3.5, energy: -3.5, fitness: 0.5, condition: 0.4, stress: -1.5, injuryRisk: 0.04, cue: 'Ribs down, bar straight up, lock out.' },
  { id: 'row', name: 'Barbell Row', focus: 'strength', facility: 'weights', unit: 'kg', start: 30, step: 2.5, minutesPerSet: 3.5, energy: -3.5, fitness: 0.5, condition: 0.4, stress: -1.5, injuryRisk: 0.03, cue: 'Hinge, pull to the stomach, control it down.' },
  { id: 'pullups', name: 'Pull-Ups', focus: 'strength', facility: 'floor', unit: 'reps', start: 3, step: 1, minutesPerSet: 3, energy: -3.5, fitness: 0.6, condition: 0.4, stress: -1.5, injuryRisk: 0.02, cue: 'Dead hang, chin over the bar, all the way down.' },
  { id: 'lunges', name: 'Walking Lunges', focus: 'strength', facility: 'floor', unit: 'reps', start: 16, step: 2, minutesPerSet: 3, energy: -3, fitness: 0.6, condition: 0.5, stress: -1.5, injuryRisk: 0.02, cue: 'Long step, knee to the floor, up through the heel.' },
  { id: 'swings', name: 'Kettlebell Swings', focus: 'strength', facility: 'floor', unit: 'reps', start: 15, step: 5, minutesPerSet: 3, energy: -4, fitness: 0.8, condition: 0.4, stress: -2.5, injuryRisk: 0.03, cue: 'Hips, not arms. Snap and float.' },
  { id: 'carry', name: 'Farmer Carry', focus: 'strength', facility: 'weights', unit: 'm', start: 30, step: 10, minutesPerSet: 3, energy: -3.5, fitness: 0.6, condition: 0.5, stress: -1.5, injuryRisk: 0.02, cue: 'Heavy in each hand, walk tall, do not rush.' },
  { id: 'core', name: 'Core Circuit', focus: 'strength', facility: 'floor', unit: 'min', start: 4, step: 1, minutesPerSet: 5, energy: -2.5, fitness: 0.5, condition: 0.4, stress: -1.5, injuryRisk: 0.01, cue: 'Planks, hollow holds, dead bugs. Breathe.' },
  { id: 'treadmill', name: 'Treadmill Run', focus: 'cardio', facility: 'cardio', unit: 'min', start: 12, step: 3, minutesPerSet: 10, energy: -5, fitness: 1.0, condition: 0.6, stress: -3.5, injuryRisk: 0.02, cue: 'Find the pace you could hold a sentence at, then hold it.' },
  { id: 'rower', name: 'Rowing Machine', focus: 'cardio', facility: 'cardio', unit: 'm', start: 1000, step: 250, minutesPerSet: 8, energy: -5, fitness: 1.0, condition: 0.6, stress: -3.5, injuryRisk: 0.02, cue: 'Legs, body, arms. Arms, body, legs.' },
  { id: 'bike', name: 'Stationary Bike', focus: 'cardio', facility: 'cardio', unit: 'min', start: 15, step: 5, minutesPerSet: 10, energy: -4, fitness: 0.9, condition: 0.6, stress: -3, injuryRisk: 0.01, cue: 'Cadence up, resistance where it bites.' },
  { id: 'stairs', name: 'Stair Climber', focus: 'cardio', facility: 'cardio', unit: 'min', start: 8, step: 2, minutesPerSet: 8, energy: -5, fitness: 1.0, condition: 0.6, stress: -3, injuryRisk: 0.02, cue: 'No hands on the rails. That is the whole trick.' },
  { id: 'intervals', name: 'Sprint Intervals', focus: 'cardio', facility: 'cardio', unit: 'reps', start: 6, step: 1, minutesPerSet: 8, energy: -6.5, fitness: 1.3, condition: 0.7, stress: -4, injuryRisk: 0.05, cue: 'Thirty on, ninety off. The off is the hard part.' },
  { id: 'ropes', name: 'Battle Ropes', focus: 'cardio', facility: 'floor', unit: 'min', start: 3, step: 1, minutesPerSet: 5, energy: -5, fitness: 1.0, condition: 0.5, stress: -3.5, injuryRisk: 0.02, cue: 'Waves to the anchor. Do not let them die.' },
  { id: 'swim', name: 'Swim', focus: 'cardio', facility: 'pool', unit: 'm', start: 400, step: 100, minutesPerSet: 12, energy: -4.5, fitness: 1.1, condition: 0.8, stress: -4.5, injuryRisk: 0.01, cue: 'Long strokes, bilateral breathing, count the lengths.' },
  { id: 'skipping', name: 'Skipping', focus: 'cardio', facility: 'floor', unit: 'min', start: 4, step: 1, minutesPerSet: 5, energy: -4, fitness: 0.9, condition: 0.5, stress: -3, injuryRisk: 0.03, cue: 'Wrists, not arms. Light on the balls of the feet.' },
  { id: 'flow', name: 'Mobility Flow', focus: 'mobility', facility: 'floor', unit: 'min', start: 10, step: 5, minutesPerSet: 10, energy: -1, fitness: 0.3, condition: 0.8, stress: -4, injuryRisk: 0.0, cue: 'Hips, thoracic, ankles. Slow is the point.' },
  { id: 'stretch', name: 'Stretching', focus: 'mobility', facility: 'floor', unit: 'min', start: 10, step: 5, minutesPerSet: 10, energy: 0.5, fitness: 0.2, condition: 0.7, stress: -4.5, injuryRisk: 0.0, cue: 'Hold each for a slow count of thirty. No bouncing.' },
  { id: 'foam', name: 'Foam Rolling', focus: 'mobility', facility: 'floor', unit: 'min', start: 8, step: 2, minutesPerSet: 8, energy: 1, fitness: 0.1, condition: 0.9, stress: -3.5, injuryRisk: 0.0, cue: 'Find the spot that makes you wince and stay on it.' },
  { id: 'yoga', name: 'Yoga Holds', focus: 'mobility', facility: 'floor', unit: 'min', start: 12, step: 4, minutesPerSet: 12, energy: 0, fitness: 0.4, condition: 0.7, stress: -5, injuryRisk: 0.0, cue: 'Warrior, pigeon, down dog. Breathe into whatever complains.' },
];

export const EXERCISE_BY_ID: Readonly<Record<string, ExerciseDef>> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export const INTENSITY: Readonly<Record<WorkoutIntensity, { label: string; effort: number; risk: number; progress: number; note: string }>> = {
  easy: { label: 'Easy', effort: 0.65, risk: 0.3, progress: 0, note: 'Technique and blood flow. Nothing is beaten today.' },
  steady: { label: 'Steady', effort: 1.0, risk: 1.0, progress: 0.35, note: 'Working sets. A chance of a new best if it is there.' },
  hard: { label: 'Hard', effort: 1.4, risk: 2.2, progress: 0.8, note: 'The last rep is the one that counts, and the one that hurts.' },
};

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export interface ClassDef {
  id: string;
  name: string;
  facility: Facility;
  minutes: number;
  /** Hours of the day it starts, local time. */
  startHours: readonly number[];
  /** SLATE's calibrated drop-in price, cents, before cost of living. Members pay nothing. */
  dropIn: Money;
  energy: number;
  fitness: number;
  condition: number;
  stress: number;
  morale: number;
  about: string;
}

export const CLASSES: readonly ClassDef[] = [
  { id: 'yoga', name: 'Yoga', facility: 'studio', minutes: 60, startHours: [7, 12, 18], dropIn: 25_00, energy: 2, fitness: 3, condition: 5, stress: -18, morale: 6, about: 'An hour on the mat. You leave taller.' },
  { id: 'spin', name: 'Spin', facility: 'studio', minutes: 45, startHours: [6, 8, 18, 19], dropIn: 28_00, energy: -22, fitness: 7, condition: 4, stress: -14, morale: 7, about: 'Forty-five minutes in the dark with the music too loud.' },
  { id: 'hiit', name: 'HIIT', facility: 'floor', minutes: 45, startHours: [6, 7, 17, 18], dropIn: 26_00, energy: -26, fitness: 8, condition: 4, stress: -15, morale: 6, about: 'Intervals until the instructor is satisfied, which is never.' },
  { id: 'pilates', name: 'Pilates', facility: 'studio', minutes: 55, startHours: [8, 10, 17], dropIn: 30_00, energy: -6, fitness: 4, condition: 6, stress: -12, morale: 5, about: 'Small movements that find muscles you had not met.' },
  { id: 'boxing', name: 'Boxing', facility: 'boxing', minutes: 60, startHours: [7, 12, 18, 19], dropIn: 32_00, energy: -24, fitness: 8, condition: 3, stress: -20, morale: 9, about: 'Pads, bags and a lot of shouting. Nobody hits you.' },
  { id: 'strength', name: 'Strength Class', facility: 'weights', minutes: 60, startHours: [6, 9, 17, 19], dropIn: 26_00, energy: -20, fitness: 7, condition: 5, stress: -12, morale: 6, about: 'Coached lifting in a group. Form first, ego last.' },
];

export const CLASS_BY_ID: Readonly<Record<string, ClassDef>> = Object.fromEntries(CLASSES.map((c) => [c.id, c]));

// ---------------------------------------------------------------------------
// What a gym has in it
// ---------------------------------------------------------------------------

export interface GymHours {
  /** Local hour it opens and closes; 0 and 24 for always. */
  open: number;
  close: number;
}

export interface GymProfile {
  placeId: string;
  name: string;
  real: boolean;
  /** 1 is a box with a squat rack; 4 is towels folded for you. */
  tier: 1 | 2 | 3 | 4;
  hours: GymHours;
  facilities: Facility[];
  /** Prices in cents, already scaled to the city. SLATE's calibration, always. */
  dayPass: Money;
  monthly: Money;
  annual: Money;
  trainerHourly: Money;
  classes: ClassDef[];
  /** Where the prices and hours come from. Never 'public_reference'. */
  calibration: 'simulated' | 'calibrated_estimate';
  about: string;
}

const TIERS: Record<1 | 2 | 3 | 4, { hours: GymHours[]; facilities: Facility[][]; dayPass: Money; monthly: Money; annual: Money; trainer: Money; classes: number }> = {
  1: { hours: [{ open: 6, close: 22 }, { open: 5, close: 23 }, { open: 0, close: 24 }], facilities: [['weights', 'floor'], ['weights', 'floor', 'cardio']], dayPass: 15_00, monthly: 39_00, annual: 399_00, trainer: 55_00, classes: 1 },
  2: { hours: [{ open: 5, close: 23 }, { open: 0, close: 24 }], facilities: [['weights', 'cardio', 'floor'], ['weights', 'cardio', 'floor', 'studio']], dayPass: 25_00, monthly: 69_00, annual: 699_00, trainer: 75_00, classes: 3 },
  3: { hours: [{ open: 5, close: 23 }, { open: 5, close: 22 }], facilities: [['weights', 'cardio', 'floor', 'studio', 'boxing'], ['weights', 'cardio', 'floor', 'studio', 'pool']], dayPass: 40_00, monthly: 145_00, annual: 1_450_00, trainer: 110_00, classes: 4 },
  4: { hours: [{ open: 5, close: 23 }, { open: 5, close: 22 }], facilities: [['weights', 'cardio', 'floor', 'studio', 'pool', 'boxing']], dayPass: 65_00, monthly: 260_00, annual: 2_600_00, trainer: 160_00, classes: 6 },
};

export const FACILITY_LABEL: Readonly<Record<Facility, string>> = {
  weights: 'Free Weights', cardio: 'Cardio Floor', floor: 'Open Floor', pool: 'Pool', studio: 'Studio', boxing: 'Boxing Ring',
};

/** What a gym place is like. Deterministic from the place, so it is the same gym every time. */
export function gymProfile(place: Place): GymProfile {
  const rng = makeRng(`gym:${place.id}`);
  const tier = place.price;
  const spec = TIERS[tier];
  const col = costOfLiving(place.cityId);
  const facilities = rng.pick(spec.facilities);
  const classes = rng.shuffle(CLASSES.filter((c) => facilities.includes(c.facility))).slice(0, spec.classes);
  return {
    placeId: place.id,
    name: place.name,
    real: place.real,
    tier,
    hours: rng.pick(spec.hours),
    facilities,
    dayPass: Math.round(spec.dayPass * col),
    monthly: Math.round(spec.monthly * col),
    annual: Math.round(spec.annual * col),
    trainerHourly: Math.round(spec.trainer * col),
    classes,
    calibration: place.real ? 'calibrated_estimate' : 'simulated',
    about: place.about,
  };
}

export function isOpenAt(hours: GymHours, localHour: number): boolean {
  if (hours.open === 0 && hours.close === 24) return true;
  return localHour >= hours.open && localHour < hours.close;
}

export function hoursLabel(hours: GymHours): string {
  if (hours.open === 0 && hours.close === 24) return 'Open 24 Hours';
  const h = (n: number) => `${n % 12 === 0 ? 12 : n % 12} ${n < 12 ? 'AM' : 'PM'}`;
  return `${h(hours.open)} – ${h(hours.close)}`;
}

/** Membership periods, in days. */
export const PERIOD_DAYS: Readonly<Record<'day_pass' | 'monthly' | 'annual', number>> = { day_pass: 1, monthly: 30, annual: 365 };

// ---------------------------------------------------------------------------
// The real ones
// ---------------------------------------------------------------------------

/**
 * A real gym, or a real chain's presence in a city, on the record.
 *
 * What is said in `about` is durable public fact: where and when a chain was
 * founded, what a famous gym is known for. Which branch, its hours and its
 * prices are SLATE's calibration and the profile says so. This list covers
 * the cities it covers and no more.
 */
export interface RealGym extends Omit<Place, 'quality' | 'price' | 'minutes' | 'real' | 'actions'> {
  price: 1 | 2 | 3 | 4;
  quality?: number;
  actions?: PlaceAction[];
}

export const REAL_GYMS: readonly RealGym[] = [
  // --- Los Angeles ---------------------------------------------------------
  { id: 'gym-la-golds-venice', name: "Gold's Gym Venice", kind: 'gym', cityId: 'us-ca-losangeles', about: "The Gold's Gym on Hampton Drive in Venice, opened by Joe Gold in 1965 and the gym in the 1977 documentary Pumping Iron. Called the Mecca of Bodybuilding ever since.", opened: 1965, price: 2, quality: 88 },
  { id: 'gym-la-equinox', name: 'Equinox', kind: 'gym', cityId: 'us-ca-losangeles', about: 'A branch of the luxury fitness chain founded in New York in 1991. Which branch, and what it charges, is SLATE’s calibration.', opened: 1991, price: 4 },
  { id: 'gym-la-barrys', name: "Barry's", kind: 'gym', cityId: 'us-ca-losangeles', about: 'A studio of the interval-training chain Barry Jay founded in West Hollywood in 1998. The red light is real; the timetable is SLATE’s.', opened: 1998, price: 3 },
  { id: 'gym-la-24hour', name: '24 Hour Fitness', kind: 'gym', cityId: 'us-ca-losangeles', about: 'A club of the chain that began in California in 1983. The hours are in the name; the branch is SLATE’s calibration.', opened: 1983, price: 2 },
  { id: 'gym-la-planet', name: 'Planet Fitness', kind: 'gym', cityId: 'us-ca-losangeles', about: 'A club of the budget chain founded in New Hampshire in 1992. Prices here are SLATE’s calibration, not the chain’s.', opened: 1992, price: 1 },
  // --- New York ------------------------------------------------------------
  { id: 'gym-ny-equinox', name: 'Equinox', kind: 'gym', cityId: 'us-ny-newyork', about: 'A branch of the chain founded on the Upper West Side in 1991. Which branch, and what it charges, is SLATE’s calibration.', opened: 1991, price: 4 },
  { id: 'gym-ny-crunch', name: 'Crunch', kind: 'gym', cityId: 'us-ny-newyork', about: 'A club of the chain that started in a basement studio in the East Village in 1989. The branch and the prices are SLATE’s calibration.', opened: 1989, price: 2 },
  { id: 'gym-ny-barrys', name: "Barry's", kind: 'gym', cityId: 'us-ny-newyork', about: 'A studio of the chain founded in West Hollywood in 1998. The timetable is SLATE’s.', opened: 1998, price: 3 },
  { id: 'gym-ny-planet', name: 'Planet Fitness', kind: 'gym', cityId: 'us-ny-newyork', about: 'A club of the budget chain founded in New Hampshire in 1992. Prices are SLATE’s calibration.', opened: 1992, price: 1 },
  // --- Chicago, Atlanta, Miami, San Francisco --------------------------------
  { id: 'gym-chi-equinox', name: 'Equinox', kind: 'gym', cityId: 'us-il-chicago', about: 'A branch of the chain founded in New York in 1991. Which branch, and what it charges, is SLATE’s calibration.', opened: 1991, price: 4 },
  { id: 'gym-chi-planet', name: 'Planet Fitness', kind: 'gym', cityId: 'us-il-chicago', about: 'A club of the budget chain founded in New Hampshire in 1992. Prices are SLATE’s calibration.', opened: 1992, price: 1 },
  { id: 'gym-atl-planet', name: 'Planet Fitness', kind: 'gym', cityId: 'us-ga-atlanta', about: 'A club of the budget chain founded in New Hampshire in 1992. Prices are SLATE’s calibration.', opened: 1992, price: 1 },
  { id: 'gym-mia-equinox', name: 'Equinox', kind: 'gym', cityId: 'us-fl-miami', about: 'A branch of the chain founded in New York in 1991. Which branch, and what it charges, is SLATE’s calibration.', opened: 1991, price: 4 },
  { id: 'gym-sf-24hour', name: '24 Hour Fitness', kind: 'gym', cityId: 'us-ca-sanfrancisco', about: 'A club of the chain that began in California in 1983. The branch is SLATE’s calibration.', opened: 1983, price: 2 },
  // --- London --------------------------------------------------------------
  { id: 'gym-ldn-puregym', name: 'PureGym', kind: 'gym', cityId: 'uk-eng-london', about: 'A club of the low-cost chain founded in 2009, open around the clock by design. The branch and the prices are SLATE’s calibration.', opened: 2009, price: 1 },
  { id: 'gym-ldn-virgin', name: 'Virgin Active', kind: 'gym', cityId: 'uk-eng-london', about: 'A club of the chain Virgin launched in 1999. The branch and the prices are SLATE’s calibration.', opened: 1999, price: 3 },
  { id: 'gym-ldn-third-space', name: 'Third Space', kind: 'gym', cityId: 'uk-eng-london', about: 'A club of the London luxury chain that opened its first site in Soho in 2001. Which club, and what it charges, is SLATE’s calibration.', opened: 2001, price: 4 },
  { id: 'gym-ldn-david-lloyd', name: 'David Lloyd Clubs', kind: 'gym', cityId: 'uk-eng-london', about: 'A club of the racquets-and-fitness chain the tennis player David Lloyd founded in 1982. The branch and the prices are SLATE’s calibration.', opened: 1982, price: 3 },
  // --- Elsewhere -----------------------------------------------------------
  { id: 'gym-syd-f45', name: 'F45 Training', kind: 'gym', cityId: 'au-nsw-sydney', about: 'A studio of the functional-training franchise founded in Sydney in 2013. Forty-five minutes is in the name; the timetable is SLATE’s.', opened: 2013, price: 2 },
  { id: 'gym-syd-anytime', name: 'Anytime Fitness', kind: 'gym', cityId: 'au-nsw-sydney', about: 'A club of the 24-hour franchise founded in Minnesota in 2002. The branch and the prices are SLATE’s calibration.', opened: 2002, price: 1 },
  { id: 'gym-mel-anytime', name: 'Anytime Fitness', kind: 'gym', cityId: 'au-vic-melbourne', about: 'A club of the 24-hour franchise founded in Minnesota in 2002. The branch and the prices are SLATE’s calibration.', opened: 2002, price: 1 },
  { id: 'gym-tor-goodlife', name: 'GoodLife Fitness', kind: 'gym', cityId: 'ca-on-toronto', about: 'A club of the Canadian chain founded in London, Ontario in 1979. The branch and the prices are SLATE’s calibration.', opened: 1979, price: 2 },
  { id: 'gym-van-goodlife', name: 'GoodLife Fitness', kind: 'gym', cityId: 'ca-bc-vancouver', about: 'A club of the Canadian chain founded in 1979. The branch and the prices are SLATE’s calibration.', opened: 1979, price: 2 },
  { id: 'gym-par-basicfit', name: 'Basic-Fit', kind: 'gym', cityId: 'fr-idf-paris', about: 'A club of the Dutch low-cost chain that grew from a 1984 gym in Hoofddorp. The branch and the prices are SLATE’s calibration.', opened: 1984, price: 1 },
  { id: 'gym-ber-mcfit', name: 'McFIT', kind: 'gym', cityId: 'de-be-berlin', about: 'A club of the German chain Rainer Schaller founded in Würzburg in 1997. The branch and the prices are SLATE’s calibration.', opened: 1997, price: 1 },
];

/** The cities the real list reaches. Everywhere else, the gyms are SLATE's. */
export const CITIES_WITH_REAL_GYMS: readonly string[] = [...new Set(REAL_GYMS.map((g) => g.cityId))];
