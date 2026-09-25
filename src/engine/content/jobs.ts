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
 * Tips are the custom's where it tips (`tipsPerHour` below).
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
  /** Worked outdoors, and so called off in a thunderstorm (`outdoorWeather`). */
  outdoors?: boolean;
}

const job = (id: string, title: string, overMinimum: number, days: number[], startHour: number, hours: number, outdoors = false): Job =>
  ({ id, title, overMinimum, days, startHour, hours, ...(outdoors ? { outdoors } : {}) });

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
  trades: job('trades', 'Construction', 1.5, [MON, TUE, WED, THU], 9, 8, true),
  armed_forces: job('armed_forces', 'Security Work', 1.2, [FRI, SAT, SUN], 12, 10),
  dance: job('dance', 'Teaching Dance', 1.7, [MON, WED, THU], 16, 5),
  sport: job('sport', 'Coaching', 1.5, [TUE, THU, SAT], 9, 6, true),
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

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** When a cycle pays, said the way a person says it. */
export function payCycleWords(cycle: PayCycle): string {
  if (cycle.kind === 'biweekly') return `every other ${WEEKDAY_NAMES[cycle.weekday]}`;
  if (cycle.kind === 'semimonthly') return 'on the 15th and the last day of the month';
  const day = cycle.day === 'last' ? 'the last day of the month' : `the ${cycle.day}${cycle.day === 1 ? 'st' : cycle.day === 2 ? 'nd' : cycle.day === 3 ? 'rd' : 'th'}`;
  return cycle.inArrears ? `on ${day}, for the month before` : `on ${day}`;
}

/** The days a job works, said as a list: "Thursday to Sunday", "Monday, Wednesday and Thursday". */
export function workDaysWords(job: Job): string {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const days = order.filter((d) => job.days.includes(d));
  const run = days.every((d, i) => i === 0 || order.indexOf(d) === order.indexOf(days[i - 1]!) + 1);
  if (run && days.length > 2) return `${WEEKDAY_NAMES[days[0]!]} to ${WEEKDAY_NAMES[days[days.length - 1]!]}`;
  const names = days.map((d) => WEEKDAY_NAMES[d]!);
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Tips an hour, in hundredths of the country's money, where tipping is the
 * custom: a lot for bar and restaurant work in the United States and Canada,
 * a real share in Mexico, a little in Britain, Ireland, Australia and New
 * Zealand, less for a café counter, and nothing where nobody tips, which is
 * most of the world, Iceland, Japan and Korea among it. SLATE's estimates of
 * the custom, not published figures. Where the US lets an employer pay a
 * tipped worker under the minimum and count the tips toward it, that is not
 * modeled: the floor is paid, and the tips go on top.
 */
const TIPS: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  hospitality: { US: 10_00, CA: 7_00, MX: 30_00, GB: 1_50, IE: 1_50, AU: 1_00, NZ: 1_00 },
  school: { US: 3_00, CA: 2_00, MX: 10_00, GB: 50, IE: 50 },
};

export function tipsPerHour(jobId: string, countryCode: string): number {
  return TIPS[jobId]?.[countryCode] ?? 0;
}

export interface Pattern {
  days: readonly number[];
  startHour: number;
  hours: number;
}

/**
 * The week a job is worked: its own part-time days and hours, or full-time,
 * five eight-hour days starting with its own, done by eleven at night.
 */
export function patternOf(job: Job, fullTime = false): Pattern {
  if (!fullTime) return { days: job.days, startHour: job.startHour, hours: job.hours };
  const order = [1, 2, 3, 4, 5, 6, 0];
  const days = [...job.days];
  for (const day of order) if (days.length < 5 && !days.includes(day)) days.push(day);
  return { days: days.slice(0, 5), startHour: Math.min(job.startHour, 15), hours: 8 };
}

export function patternHours(pattern: Pattern): number {
  return pattern.days.length * pattern.hours;
}

/** An hour of the day as a clock says it: "9:00 AM", "4:00 PM". */
export function clockWords(hour: number): string {
  return `${((hour + 11) % 12) + 1}:00 ${hour < 12 ? 'AM' : 'PM'}`;
}
