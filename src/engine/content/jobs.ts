/**
 * SLATE — the job that pays the rent between roles.
 *
 * Nearly every working actor has one. What somebody did before acting
 * (`content/backgrounds.ts`) is the work they fall back on, so each answer
 * carries on as a survival job: its hours, its week, and how far over the
 * legal floor where they live (`content/wages.ts`) it pays.
 *
 * The premiums are SLATE's estimates of how far each kind of work usually
 * pays over the minimum, not published figures; the floor under them is real.
 * Tips are not modeled.
 *
 * Every week starts no earlier than nine. A night nobody chose that starts at
 * midnight ends by 08:24 at the latest (`unattendedNight`), so somebody left
 * on autopilot is up for their shift. One the player kept them up past, or
 * slept through by choice, can cost them it.
 */

export interface Job {
  id: string;
  title: string;
  /** How many times the local minimum an hour pays. SLATE's estimate. */
  overMinimum: number;
  /** Days of the week, 0 for Sunday. */
  days: readonly number[];
  startHour: number;
  hours: number;
}

const job = (id: string, title: string, overMinimum: number, days: number[], startHour: number, hours: number): Job =>
  ({ id, title, overMinimum, days, startHour, hours });

const MON = 1, TUE = 2, WED = 3, THU = 4, FRI = 5, SAT = 6, SUN = 0;

/** Keyed by the Before Acting answer it follows from. */
export const JOBS: Readonly<Record<string, Job>> = {
  school: job('school', 'Café Work', 1.0, [THU, FRI, SAT, SUN], 9, 7),
  office: job('office', 'Temp Office Work', 1.35, [MON, TUE, WED], 9, 8),
  between: job('between', 'Gig Work', 1.05, [MON, WED, FRI, SAT], 11, 6),
  retail: job('retail', 'Retail', 1.05, [THU, FRI, SAT, SUN], 10, 7),
  always_performing: job('always_performing', 'Background And Promo Work', 1.25, [TUE, THU, SAT], 9, 9),
  hospitality: job('hospitality', 'Bar And Restaurant Work', 1.05, [WED, THU, FRI, SAT], 16, 7),
  care: job('care', 'Care Work', 1.2, [MON, TUE, FRI, SAT], 9, 8),
  modeling: job('modeling', 'Modeling And Fit Work', 2.2, [TUE, THU], 10, 6),
  trades: job('trades', 'Construction', 1.5, [MON, TUE, WED, THU], 9, 8),
  armed_forces: job('armed_forces', 'Security Work', 1.2, [FRI, SAT, SUN], 12, 10),
  dance: job('dance', 'Teaching Dance', 1.7, [MON, WED, THU], 16, 5),
  sport: job('sport', 'Coaching', 1.5, [TUE, THU, SAT], 9, 6),
};

export function jobFor(beforeActing: string | undefined): Job {
  return JOBS[beforeActing ?? ''] ?? JOBS.school!;
}

/** Hours a week on the schedule. */
export function weeklyHours(job: Job): number {
  return job.days.length * job.hours;
}

/**
 * How often, and on what day, a country's employers pay hourly work.
 *
 * The common practice, not a law: American and Canadian hourly work is most
 * often paid every other Friday, Australian and New Zealand work every
 * fortnight, Mexican work on the fifteenth and the last day (the quincena),
 * Japanese on the twenty-fifth for the month before, Icelandic on the first
 * for the month before, and most of Europe at the end of the month. Paid "for
 * the month before" (`inArrears`), a shift on the first of the month waits
 * for the next payday.
 */
export type PayCycle =
  | { kind: 'biweekly'; weekday: number }
  | { kind: 'monthly'; day: number | 'last'; inArrears?: boolean }
  | { kind: 'semimonthly' };

const PAY: Readonly<Record<string, PayCycle>> = {
  US: { kind: 'biweekly', weekday: FRI },
  CA: { kind: 'biweekly', weekday: FRI },
  AU: { kind: 'biweekly', weekday: THU },
  NZ: { kind: 'biweekly', weekday: THU },
  MX: { kind: 'semimonthly' },
  JP: { kind: 'monthly', day: 25, inArrears: true },
  KR: { kind: 'monthly', day: 25 },
  IS: { kind: 'monthly', day: 1, inArrears: true },
};

export function payCycleFor(countryCode: string): PayCycle {
  return PAY[countryCode] ?? { kind: 'monthly', day: 'last' };
}
