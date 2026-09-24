/**
 * SLATE — what somebody did before this life.
 *
 * The structured half of Interests & Background. It used to be one box of free
 * text that the screen said carried "no attribute and no advantage", and that
 * was true: nothing read it. What somebody did for a living before is the one
 * part of a past this build can honestly read, because it is written on the
 * body: years on a building site or a stage floor leave somebody fitter than
 * years at a desk. So each answer is the fitness they start with, and nothing
 * more. It fades like any fitness, to an everyday life's thirty-five, unless
 * they keep it up.
 *
 * It is not a skill. A dancer doesn't start better at anything; they start
 * with a dancer's body, and that is all the engine reads.
 */

export interface BeforeActing {
  id: string;
  label: string;
  /** Fitness on the first morning, before the age's ceiling. */
  fitness: number;
  /** What it left them with, in a sentence. */
  note: string;
}

const of = (id: string, label: string, fitness: number, note: string): BeforeActing => ({ id, label, fitness, note });

/** In the order a reader would look for them: the desk to the most physical. */
export const BEFORE_ACTING: readonly BeforeActing[] = [
  of('school', 'Straight From School', 50, 'No job before this one to speak of, and an ordinary body for your age.'),
  of('office', 'Office Work', 40, 'Years at a desk. You start softer than most.'),
  of('between', 'Between Things', 42, 'A stretch of odd jobs and waiting, and none of it kept you moving.'),
  of('retail', 'Retail', 48, 'On your feet all day, though never really working hard.'),
  of('always_performing', 'Always Performing', 50, 'On stages and sets since you were young. It kept your diary full, not your body fit.'),
  of('hospitality', 'Hospitality', 55, 'Double shifts carrying plates. Tired, but used to being on your feet.'),
  of('care', 'Nursing And Care', 55, 'Lifting, turning and walking wards. Stronger than you look.'),
  of('modeling', 'Modeling', 58, 'Kept in shape because the work asked for it.'),
  of('trades', 'Trades And Construction', 68, 'Years of real physical work. You start strong.'),
  of('armed_forces', 'The Armed Forces', 75, 'Trained hard and kept to it. Few start fitter.'),
  of('dance', 'Dance', 78, 'Classes every day for years, and a body built by them.'),
  of('sport', 'Competitive Sport', 80, 'An athlete’s body. It fades like anybody’s if you stop.'),
];

export const BEFORE_ACTING_BY_ID: Record<string, BeforeActing> = Object.fromEntries(BEFORE_ACTING.map((one) => [one.id, one]));

/** What a new save picks when nobody says: the body every character had before this list. */
export const DEFAULT_BEFORE_ACTING = 'school';
