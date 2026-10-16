/**
 * SLATE — the figures a body is drawn from and changes by (`systems/body.ts`),
 * and what its weight raises.
 */

import { COURSES } from './school';

// ---------------------------------------------------------------------------
// Drawn from
// ---------------------------------------------------------------------------

/**
 * A country's adults, each sex's side: mean height at 19 in 2019 (NCD-RisC,
 * Lancet 2020), and the share in each band of body mass index at 25 to 29 in
 * 2024 (NCD-RisC, Nature 2026): under 18.5, 18.5 to 20, 20 to 25, 25 to 30,
 * 30 to 35, 35 to 40, 40 and over. A body is drawn from one side or the
 * other, half and half, so the draw is the country's mix of adults; SLATE
 * keeps no sex, and a person's is never set by it. Height's spread within a
 * side is Japan's survey's at 20 to 29 (6.3 cm and 5.6 cm; NHNS 2023), the
 * only one published as a spread, SLATE's estimate elsewhere.
 */
export interface BodyNorms { height: readonly [number, number]; bands: readonly [readonly number[], readonly number[]] }
const n = (hm: number, hw: number, m: number[], w: number[]): BodyNorms => ({ height: [hm, hw], bands: [m, w] });
export const BODY_BY_COUNTRY: Readonly<Record<string, BodyNorms>> = {
  us: n(176.9, 163.3, [2.0, 3.7, 27.8, 31.8, 20.3, 8.7, 5.7], [3.4, 4.9, 26.5, 26.5, 15.4, 10.8, 12.5]),
  uk: n(178.2, 163.9, [2.9, 4.1, 39.1, 35.9, 11.8, 3.9, 2.5], [2.8, 6.9, 39.2, 27.0, 12.4, 6.3, 5.4]),
  is: n(182.1, 168.9, [1.5, 3.5, 38.6, 40.3, 10.2, 3.4, 2.6], [3.5, 5.8, 47.4, 26.2, 10.6, 4.4, 2.1]),
  ca: n(178.7, 164.7, [1.9, 3.9, 40.0, 31.7, 14.7, 4.5, 3.3], [4.4, 10.0, 40.3, 24.0, 9.7, 6.8, 4.7]),
  au: n(178.8, 164.7, [2.0, 2.9, 33.8, 37.3, 15.7, 5.9, 2.4], [3.3, 7.8, 39.5, 25.7, 13.3, 5.6, 4.7]),
  nz: n(177.7, 164.7, [1.4, 3.0, 32.4, 36.0, 16.1, 6.9, 4.2], [2.4, 5.0, 32.5, 27.1, 14.6, 9.8, 8.6]),
  ie: n(179.0, 164.5, [1.7, 3.8, 39.3, 37.0, 15.7, 1.7, 0.8], [2.2, 7.1, 39.4, 30.3, 12.7, 5.5, 2.8]),
  de: n(180.3, 166.2, [1.4, 4.1, 46.0, 34.7, 10.7, 2.0, 1.1], [4.7, 10.2, 51.9, 20.4, 8.1, 3.5, 1.3]),
  fr: n(178.6, 164.5, [3.8, 9.3, 58.6, 22.1, 4.6, 1.1, 0.5], [7.5, 14.6, 49.9, 18.7, 6.1, 2.2, 1.1]),
  es: n(176.1, 162.0, [1.5, 2.7, 51.6, 34.4, 6.3, 2.6, 0.9], [5.8, 12.6, 53.0, 21.7, 4.0, 1.6, 1.4]),
  it: n(174.4, 161.8, [1.2, 4.3, 53.5, 31.7, 7.9, 0.8, 0.6], [6.8, 15.2, 53.3, 18.3, 4.7, 1.2, 0.5]),
  jp: n(172.1, 158.5, [7.5, 13.6, 50.3, 19.0, 7.2, 1.5, 0.8], [24.8, 27.1, 38.4, 6.7, 2.0, 0.8, 0.2]),
  kr: n(175.5, 163.2, [2.8, 5.3, 43.3, 33.7, 11.1, 3.3, 0.5], [15.0, 20.9, 46.0, 12.1, 4.3, 1.4, 0.4]),
  mx: n(170.3, 157.9, [1.8, 3.4, 26.3, 36.6, 20.6, 7.7, 3.5], [1.9, 3.0, 25.9, 34.4, 20.8, 9.4, 4.5]),
  br: n(175.7, 162.4, [2.6, 4.4, 36.7, 33.7, 14.6, 5.8, 2.2], [4.1, 5.6, 33.3, 29.1, 16.1, 7.7, 4.3]),
};
/** Where the country isn't one of those: the United States', SLATE's stand-in. */
export const BODY_DEFAULT: BodyNorms = BODY_BY_COUNTRY.us!;
/** The bands' edges, the first and last closed at a body's plausible ends, SLATE's. */
export const BMI_EDGES = [16, 18.5, 20, 25, 30, 35, 40, 50] as const;
export const HEIGHT_SPREAD = [6.3, 5.6] as const;

/**
 * The US adults' mix of weights that the published onset rates are an average
 * over: healthy, overweight and obese, NCD-RisC's 25 to 29 year olds, the
 * two sides averaged (34.15%, 29.15%, 36.7%).
 */
export const POPULATION_WEIGHT = { healthy: 0.3415, over: 0.2915, obese: 0.367 } as const;

// ---------------------------------------------------------------------------
// Changed by
// ---------------------------------------------------------------------------

/**
 * - Resting energy: Mifflin–St Jeor (Am J Clin Nutr 1990), 10 a kilogram,
 *   6.25 a centimetre, less 5 a year, plus 5 for men and less 161 for women:
 *   SLATE, keeping no sex, takes the middle, less 78.
 * - A sedentary day is 1.4 times it, the least of FAO/WHO/UNU's sedentary
 *   range (2004).
 * - The weight moves as Hall's rule has it (Lancet 2011): a lasting change of
 *   100 kJ a day, 23.9 kcal, moves the weight a kilogram in the end, half of
 *   it in about a year. So a day's gap goes into the weight over 23.9 × 527
 *   days' worth of kcal a kilogram, and a heavier body spends 23.9 a day more
 *   a kilogram: the resting rate's own share, and the rest as the extra body
 *   costs to move. A body's slowing rest alone, 5 kcal less a year, comes to
 *   about 0.29 kg a year, what the cohorts measured (Zheng et al., JAMA 2017:
 *   0.29 for men, 0.34 for women, from their twenties to 55).
 * - A meal eaten out or ordered in is 134 kcal more than the same at home
 *   (USDA ERS, Todd, Mancino & Lin, 2010).
 * - An hour's MET value (2024 Adult Compendium of Physical Activities): a run
 *   at 6 mph 9.3, weight training 3.5, a recreational swim 5.8; an actor on
 *   stage or on set 3.0, musical theater's singing and dancing 10.3, a dance
 *   rehearsal 5.0, sitting at a microphone 1.5.
 */
export const BODY = {
  sexMidpoint: (5 - 161) / 2,
  sedentary: 1.4,
  kcalPerKgDay: 23.9,
  halfLifeDays: 365,
  eatenOut: 134,
  /** A day they can't pay for eats the share of the habit its nourishment reaches, 40 of the coasted 76 (`systems/life.ts`), SLATE's estimate of what's on the plate. */
  shortDay: 40 / 76,
  met: { run: 9.3, workout: 3.5, swim: 5.8, acting: 3.0, musical: 10.3, rehearsal: 5.0, booth: 1.5 },
  source: 'NCD-RisC (Lancet 2020; Nature 2026); NHNS 2023; Mifflin et al. 1990; FAO/WHO/UNU 2004; Hall et al., Lancet 2011; Zheng et al., JAMA 2017; USDA ERS ERR-90; 2024 Adult Compendium of Physical Activities',
} as const;

/**
 * The classes that train the body as hard as a workout does or harder, by the course's code, and the term it does so in
 * (from 2026-10-16, brief 09's follow-up): by the 2024 Adult Compendium of Physical Activities, read against each
 * course's description in the Bulletin (docs/research/world/research-yale-coursework.json). A workout indoors is the
 * Compendium's weight training, multiple exercises (02054), 3.5 METs (`BODY.met.workout`).
 * - Movement Invention II and III (DRAM 273a, DRAM 373a), "improvisation, physical research, phrase work, and
 *   composition": a ballet, modern or jazz class or rehearsal (03010), 5.0.
 * - Stage combat: Advanced Principles Of Acting Stage Combat (DRAM 405a/b), and Acting Intimacy And Combat For The Stage
 *   (DRAM 403a/b) in its spring, when its work is combat (the consent and intimacy practice is the fall's,
 *   `content/coursework.ts`): martial arts of different types at a slower pace, novices practicing (15425), 5.3, a fight
 *   drilled at half speed before it's shown at speed. Fencing's 6.0 (15200) is the sport's bout.
 *
 * Left out, their descriptions fitting no activity at 3.5 or more: the Alexander Technique (balance, alignment and
 * breath, much of it in tutorials), The Body As Source (the energetic body and its impulses; not a dance class, by the
 * citations review, docs/research/attributes/research-citations-review.json), Commedia (mask, articulation, sound and
 * rhythm, improvised) and Character Analysis And Movement, whose description the Bulletin doesn't print. No voice class
 * is one. One counts as one workout indoors and no more (`classTrains`, systems/life.ts): a dance class, built to develop
 * technique, asks significantly less of the heart and lungs than a performance does (Rodrigues-Krause, Krause &
 * Reischak-Oliveira, J Dance Med Sci 2015;19(3):91-102, its abstract; until a check later on 2026-10-16 this called it
 * "low to moderate in intensity", which the abstract doesn't say), and the house builds no more for a harder hour, as a run at 9.3 METs builds a tenth more than
 * a workout's 3.5 (`TRAINING`), not 2.7 times. What a class burns isn't counted here: a class day is charged as any
 * waking day is.
 */
export const TRAINING_CLASSES: Readonly<Record<string, 'fall' | 'spring' | 'both'>> = {
  'DRAM 273a': 'both',
  'DRAM 373a': 'both',
  'DRAM 403a/b': 'spring',
  'DRAM 405a/b': 'both',
};

/** Those classes by name, in the catalog's order, as the guide and the tutorial say them. */
export const TRAINING_CLASS_NAMES: readonly string[] = COURSES.filter((c) => TRAINING_CLASSES[c.code]).map((c) => (TRAINING_CLASSES[c.code] === 'both' ? c.name : `${c.name} in its ${TRAINING_CLASSES[c.code]}`));

// ---------------------------------------------------------------------------
// What the weight raises
// ---------------------------------------------------------------------------

/**
 * All-cause mortality by body mass index, against 22.5 to 25: the Global BMI
 * Mortality Collaboration's never-smokers without chronic disease (Lancet
 * 2016;388:776), its bands. SLATE reads it beside the shape a body is in
 * (`frailty` in `systems/mortality.ts`), which the study's exclusions keep
 * apart from it.
 */
export const BMI_MORTALITY: readonly (readonly [number, number])[] = [
  // At 15 and under, the Asian cohorts' pooled figure (Zheng et al., NEJM 2011;364:719), the only large one below 15.
  [15, 2.8],
  [18.5, 1.51], [20, 1.13], [22.5, 1.0], [25, 1.0], [27.5, 1.07], [30, 1.2], [35, 1.45], [40, 1.94], [Number.POSITIVE_INFINITY, 2.76],
];

/**
 * The body mass index below which an adult starving can't live: 12, the mean
 * of the lower limits, fatal near 13 in men and survived to about 11 by women
 * (Henry's review, 2001, after James et al., 1988). Below 10 has been
 * survived only in specialized care (Collins, Nature Medicine 1995), which
 * SLATE doesn't give. Until 2026-09-29 the weight's hazard stopped at the
 * study's lowest band, and a life played broke lived on for years at a body
 * mass index of 12.6.
 */
export const BMI_SURVIVAL_LIMIT = 12;

/** The hazard at a body mass index: its band's, up to each band's top. */
export function bmiHazard(bmi: number): number {
  return BMI_MORTALITY.find(([upTo]) => bmi < upTo)![1];
}

/**
 * A condition's onset a year, per person, by age, at the population's mix of
 * weights, and its relative risk overweight and obese against a healthy
 * weight (Guh et al., BMC Public Health 2009;9:88, men's and women's pooled
 * ratios averaged, since SLATE keeps no sex).
 *
 * - Diabetes: the CDC's new diagnoses, 3.0 a thousand at 18 to 44, 10.1 at
 *   45 to 64, 6.8 from 65 (National Diabetes Statistics Report, 2021).
 * - High blood pressure, at 140/90: Olmsted County's twenty years, 19.6% of
 *   who began at 18 to 29 and 46.0% at 50 to 59 (Mayo Clinic Proceedings,
 *   2025), as a year's share; between 30 and 49 SLATE runs from the one to
 *   the other.
 * - Arthritis: symptomatic knee, hand and hip osteoarthritis together, 3.3 a
 *   thousand, standardized for age and sex (Oliveria et al., Arthritis &
 *   Rheumatism 1995); its rates by age weren't published.
 *
 * New asthma and new depression a year aren't published for US adults, so
 * those stay what a life begins with.
 */
export const ONSET = {
  yearly: {
    diabetes: [[45, 0.003], [65, 0.0101], [Number.POSITIVE_INFINITY, 0.0068]] as readonly (readonly [number, number])[],
    hypertension: [[30, 1 - (1 - 0.196) ** (1 / 20)], [50, NaN], [Number.POSITIVE_INFINITY, 1 - (1 - 0.46) ** (1 / 20)]] as readonly (readonly [number, number])[],
    arthritis: [[Number.POSITIVE_INFINITY, 0.0033]] as readonly (readonly [number, number])[],
  },
  /** Relative risk overweight and obese against a healthy weight. */
  risk: {
    diabetes: { over: (2.4 + 3.92) / 2, obese: (6.74 + 12.41) / 2 },
    hypertension: { over: (1.28 + 1.65) / 2, obese: (1.84 + 2.42) / 2 },
    arthritis: { over: (2.76 + 1.8) / 2, obese: (4.2 + 1.96) / 2 },
  },
  source: 'CDC National Diabetes Statistics Report (2021 estimates); https://pmc.ncbi.nlm.nih.gov/articles/PMC12049255/; Oliveria et al. 1995; https://pmc.ncbi.nlm.nih.gov/articles/PMC2667420/',
} as const;

/** A condition's onset in a year at an age and a body mass index, the population's rate turned to their weight's by its risk over the population's mix. */
export function onsetYearly(condition: keyof typeof ONSET.yearly, age: number, bmi: number): number {
  const bands = ONSET.yearly[condition];
  let rate = bands.find(([upTo]) => age < upTo)![1];
  if (Number.isNaN(rate)) {
    // Between the published ends, from the one to the other.
    const lo = bands[0]![1];
    const hi = bands[bands.length - 1]![1];
    rate = lo + (hi - lo) * Math.min(1, Math.max(0, (age - 30) / 20));
  }
  const r = ONSET.risk[condition];
  const mine = bmi >= 30 ? r.obese : bmi >= 25 ? r.over : 1;
  const mix = POPULATION_WEIGHT.healthy + POPULATION_WEIGHT.over * r.over + POPULATION_WEIGHT.obese * r.obese;
  return (rate * mine) / mix;
}
