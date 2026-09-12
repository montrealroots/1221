/**
 * SLATE — the posts a picture has to fill, and when each one starts.
 *
 * A production is a set of departments with a head each, and the set barely
 * changes between a four-week picture and a nine-month one. What changes is how
 * many people sit under each head and how many heads one person wears. So the
 * posts are data and the staffing is a function of the money, the same way
 * periods are data and the schedule is a function of the shoot.
 *
 * ## Crew is a calendar, not a budget line
 *
 * The thing `docs/research/PIPELINE.md` is most emphatic about in this domain:
 * nobody starts on the first day. A studio feature opens its office ten weeks
 * out with the producers, the director, the UPM and the production designer;
 * the first AD comes on at six; the director of photography takes a week of
 * prep at five and goes exclusive at two, which is also when the gaffer and the
 * key grip arrive; everybody else lands in the last week. Each post below
 * carries that offset, so a crew costs what its calendar says rather than a
 * lump somebody guessed, and giving the art department another week is a
 * decision with a price.
 *
 * The offsets are the sample studio-feature schedule in the research. Smaller
 * pictures compress them, which `world/crew.ts` does by scaling against the
 * shoot rather than by carrying a second table.
 *
 * ## What is real here and what is ours
 *
 * The posts, the departments, the start weeks and the locals are real. The
 * budget floor on each post — the point at which a picture can afford to carry
 * that post at all rather than fold it into another — is SLATE's own, fitted to
 * the crew-size bands in the research: five to seven people on an ultra-low
 * budget where the DP operates and the director handles props, ten to twenty on
 * a small independent, twenty-five to over a hundred fully staffed.
 */

import type { Money } from '../core/money';

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

export type DepartmentId =
  | 'production' | 'ad' | 'camera' | 'electric' | 'grip' | 'art' | 'setdec'
  | 'property' | 'costume' | 'hairmakeup' | 'sound' | 'script' | 'locations'
  | 'transport';

export interface Department {
  id: DepartmentId;
  /** Title Case, for a screen. */
  label: string;
  /** What it is responsible for, in the world's words. */
  what: string;
}

export const DEPARTMENTS: readonly Department[] = [
  { id: 'production', label: 'Production', what: 'The office, the money and the schedule. It opens first and closes last.' },
  { id: 'ad', label: 'Assistant Directors', what: 'Whoever actually runs the floor. The director decides what to shoot; this decides when.' },
  { id: 'camera', label: 'Camera', what: 'What the picture looks like, and the only department the audience sees the work of directly.' },
  { id: 'electric', label: 'Electric', what: 'Light, and the power to make it. The largest department on most stages.' },
  { id: 'grip', label: 'Grip', what: 'Everything that holds something up, shapes light, or moves the camera.' },
  { id: 'art', label: 'Art', what: 'What the world of the picture is, drawn and then built.' },
  { id: 'setdec', label: 'Set Decoration', what: 'Everything inside a built room that somebody could pick up or sit on.' },
  { id: 'property', label: 'Property', what: 'What an actor handles. A separate craft from set decoration, and separately represented.' },
  { id: 'costume', label: 'Costume', what: 'What everybody wears, designed and then maintained across a shoot that films out of order.' },
  { id: 'hairmakeup', label: 'Hair And Makeup', what: 'Two crafts under one roof, and the first people an actor sees every morning.' },
  { id: 'sound', label: 'Production Sound', what: 'What is recorded on the day, which decides how much has to be replaced later.' },
  { id: 'script', label: 'Script Supervision', what: 'Continuity, and the only continuous record of what was actually shot.' },
  { id: 'locations', label: 'Locations', what: 'Somewhere to film that isn’t a stage, and permission to be there.' },
  { id: 'transport', label: 'Transportation', what: 'Moving the picture. Trucks, trailers, and everybody who drives one.' },
];

export const departmentById = (id: string): Department | undefined =>
  DEPARTMENTS.find((d) => d.id === id);

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export interface Post {
  id: string;
  /** Title Case, for a screen. */
  label: string;
  /** What the job is, for anybody who has not done it. */
  what: string;
  department: DepartmentId;
  /**
   * Whether this post runs its department.
   *
   * Heads are engaged by production; everybody under a head is engaged by that
   * head. That two-tier chain is why the choice of a head matters beyond their
   * own rate, and `world/crew.ts` reads this to decide who does the hiring.
   */
  head: boolean;
  /**
   * The agreement that covers it.
   *
   * Quoted from the locals' own jurisdictions. The two that surprise people are
   * locations and casting, which are Teamsters crafts rather than IATSE ones.
   */
  local: string;
  /** Weeks before the first day of photography that they start. */
  startsAt: number;
  /** Weeks after the last day of photography that they finish. */
  endsAt: number;
  /**
   * The smallest budget that carries this post at all, in cents.
   *
   * Below it the work still happens — it is done by somebody who is already
   * there, wearing a second hat. SLATE's own, fitted to the crew-size bands in
   * the research.
   */
  carriedFrom: Money;
}

/**
 * Every post, in the order they come on.
 *
 * Ten weeks of people arriving. Read top to bottom this is the shape of a
 * pre-production: the money and the design first, the floor next, the camera
 * late, and the people who only exist once there is something to point at last.
 */
export const POSTS: readonly Post[] = [
  // --- Ten weeks out: the office opens ------------------------------------
  {
    id: 'upm',
    label: 'Unit Production Manager',
    what: 'Runs everything off the floor: the schedule, the budget, the crew and the logistics. The producer picks them, but the director has to be consulted.',
    department: 'production', head: true, local: 'DGA',
    startsAt: 10, endsAt: 4, carriedFrom: 0,
  },
  {
    id: 'coordinator',
    label: 'Production Coordinator',
    what: 'The office itself. Every deal memo, travel booking and piece of paperwork on the picture goes through them.',
    department: 'production', head: false, local: 'IATSE Local 871',
    startsAt: 10, endsAt: 3, carriedFrom: 150_000_00,
  },
  {
    id: 'accountant',
    label: 'Production Accountant',
    what: 'Where the money actually is, against where the budget said it would be. Stays months after everybody else has gone.',
    department: 'production', head: false, local: 'IATSE Local 871',
    startsAt: 10, endsAt: 12, carriedFrom: 300_000_00,
  },
  {
    id: 'designer',
    label: 'Production Designer',
    what: 'What the picture looks like before a camera is involved. Runs art, construction and set decoration between them.',
    department: 'art', head: true, local: 'IATSE Local 800',
    startsAt: 10, endsAt: 1, carriedFrom: 0,
  },
  {
    id: 'locationmanager',
    label: 'Location Manager',
    what: 'Finds somewhere that isn’t a stage, and gets permission to be there. A Teamsters craft, not an IATSE one.',
    department: 'locations', head: true, local: 'Teamsters Local 399',
    startsAt: 10, endsAt: 2, carriedFrom: 400_000_00,
  },

  // --- Eight weeks out ----------------------------------------------------
  {
    id: 'artdirector',
    label: 'Art Director',
    what: 'Turns the designer’s drawings into something that can be built, costed and scheduled.',
    department: 'art', head: false, local: 'IATSE Local 800',
    startsAt: 8, endsAt: 1, carriedFrom: 2_000_000_00,
  },
  {
    id: 'costumedesigner',
    label: 'Costume Designer',
    what: 'Designs what everybody wears. Represented separately from the costumers who maintain it.',
    department: 'costume', head: true, local: 'IATSE Local 892',
    startsAt: 8, endsAt: 1, carriedFrom: 250_000_00,
  },
  {
    id: 'setdecorator',
    label: 'Set Decorator',
    what: 'Everything inside a built room. A separate craft from property, and separately represented.',
    department: 'setdec', head: true, local: 'IATSE Local 44',
    startsAt: 8, endsAt: 1, carriedFrom: 1_200_000_00,
  },

  // --- Six weeks out: the floor -------------------------------------------
  {
    id: 'firstad',
    label: 'First Assistant Director',
    what: 'Runs the floor and the clock. The director has the contractual right to pick them, which is why this post is an argument.',
    department: 'ad', head: true, local: 'DGA',
    startsAt: 6, endsAt: 1, carriedFrom: 0,
  },
  {
    id: 'propmaster',
    label: 'Property Master',
    what: 'Everything an actor picks up, and the continuity of where it was last seen.',
    department: 'property', head: true, local: 'IATSE Local 44',
    startsAt: 6, endsAt: 1, carriedFrom: 500_000_00,
  },
  {
    id: 'transportcoordinator',
    label: 'Transportation Coordinator',
    what: 'Every truck and trailer on the picture, and everybody who drives one.',
    department: 'transport', head: true, local: 'Teamsters Local 399',
    startsAt: 6, endsAt: 2, carriedFrom: 800_000_00,
  },

  // --- Four weeks out -----------------------------------------------------
  {
    id: 'secondad',
    label: 'Second Assistant Director',
    what: 'The call sheet, the cast, and the background. Everything the first AD can’t be in two places for.',
    department: 'ad', head: false, local: 'DGA',
    startsAt: 4, endsAt: 1, carriedFrom: 600_000_00,
  },
  {
    id: 'costumer',
    label: 'Key Costumer',
    what: 'Keeps the clothes continuous across a shoot that films in the wrong order.',
    department: 'costume', head: false, local: 'IATSE Local 705',
    startsAt: 4, endsAt: 1, carriedFrom: 1_500_000_00,
  },

  // --- Three weeks out ----------------------------------------------------
  {
    id: 'scriptsupervisor',
    label: 'Script Supervisor',
    what: 'The only continuous record of what was actually shot, and the reason an edit is possible at all.',
    department: 'script', head: true, local: 'IATSE Local 871',
    startsAt: 3, endsAt: 1, carriedFrom: 120_000_00,
  },

  // --- Two weeks out: the camera goes exclusive ---------------------------
  {
    id: 'dp',
    label: 'Director Of Photography',
    what: 'What the picture looks like. Usually engaged for a week of prep first, and exclusive only from two weeks out.',
    department: 'camera', head: true, local: 'IATSE Local 600',
    startsAt: 5, endsAt: 1, carriedFrom: 0,
  },
  {
    id: 'gaffer',
    label: 'Gaffer',
    what: 'Chief lighting technician, and head of the largest department on most stages.',
    department: 'electric', head: true, local: 'IATSE Local 728',
    startsAt: 2, endsAt: 1, carriedFrom: 250_000_00,
  },
  {
    id: 'keygrip',
    label: 'Key Grip',
    what: 'Everything that holds, shapes or moves. Reviews every hire and every order in their own department.',
    department: 'grip', head: true, local: 'IATSE Local 80',
    startsAt: 2, endsAt: 1, carriedFrom: 250_000_00,
  },
  {
    id: 'keymakeup',
    label: 'Key Makeup Artist',
    what: 'The first person an actor sees every morning, and often the one who hears about it first.',
    department: 'hairmakeup', head: true, local: 'IATSE Local 706',
    startsAt: 2, endsAt: 1, carriedFrom: 200_000_00,
  },
  {
    id: 'keyhair',
    label: 'Key Hair Stylist',
    what: 'Hair, which is its own craft under the same roof as makeup and not a part of it.',
    department: 'hairmakeup', head: false, local: 'IATSE Local 706',
    startsAt: 2, endsAt: 1, carriedFrom: 900_000_00,
  },

  // --- One week out: everybody else ---------------------------------------
  {
    id: 'operator',
    label: 'Camera Operator',
    what: 'Frames the shot. On a smaller picture the director of photography does this themselves, and can’t watch a monitor while they do.',
    department: 'camera', head: false, local: 'IATSE Local 600',
    startsAt: 1, endsAt: 0, carriedFrom: 3_000_000_00,
  },
  {
    id: 'focuspuller',
    label: 'First Assistant Camera',
    what: 'Holds focus, which is the one thing on a take that can’t be fixed afterward.',
    department: 'camera', head: false, local: 'IATSE Local 600',
    startsAt: 2, endsAt: 0, carriedFrom: 400_000_00,
  },
  {
    id: 'bestboyelectric',
    label: 'Best Boy Electric',
    what: 'The gaffer’s second, and the person who actually hires, schedules and pays the electricians.',
    department: 'electric', head: false, local: 'IATSE Local 728',
    startsAt: 1, endsAt: 1, carriedFrom: 1_000_000_00,
  },
  {
    id: 'soundmixer',
    label: 'Production Sound Mixer',
    what: 'What gets recorded on the day, which decides how much dialogue has to be replaced later.',
    department: 'sound', head: true, local: 'IATSE Local 695',
    startsAt: 1, endsAt: 0, carriedFrom: 150_000_00,
  },
  {
    id: 'boom',
    label: 'Boom Operator',
    what: 'Gets the microphone close without getting it in shot. On a small picture the mixer does both and does neither as well.',
    department: 'sound', head: false, local: 'IATSE Local 695',
    startsAt: 1, endsAt: 0, carriedFrom: 700_000_00,
  },
];

export const postById = (id: string): Post | undefined => POSTS.find((p) => p.id === id);

/** The posts in one department, heads first. */
export const postsIn = (department: DepartmentId): Post[] =>
  POSTS.filter((p) => p.department === department)
    .sort((a, b) => Number(b.head) - Number(a.head));

/**
 * How far a picture's prep is compressed against a studio feature's.
 *
 * The offsets above are a studio feature's ten weeks. A four-week picture does
 * not get ten weeks of prep, and a twenty-week one gets more, so the offsets
 * scale against the shoot rather than a second table being written. A six-week
 * shoot is the reference and reads 1.
 */
export const prepScale = (shootWeeks: number): number =>
  Math.max(0.35, Math.min(1.6, shootWeeks / 6));
