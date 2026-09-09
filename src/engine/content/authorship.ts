/**
 * SLATE — authorship: what a maxed-out person actually produces.
 *
 * ── The rule ────────────────────────────────────────────────────────────────
 *
 * Quality is a chain, not a sum. A script is written, then directed, then
 * performed, then built, then cut, and every one of those is a handoff. At
 * each handoff some of what came in does not survive: the director read it
 * slightly differently, the actor played it a shade off, the producer took the
 * day out of the wrong week. Nobody is being incompetent. It is the ordinary
 * loss of one person's intention passing through another person's hands.
 *
 * So a ceiling of 100 does not mean the finished thing is 100. It means the
 * script was 100 and the only question left is how much of it reaches the
 * screen.
 *
 * That is where holding more than one job pays. When the same person is on
 * both ends of a handoff there is nothing to translate, so nothing is lost —
 * fidelity is 1, exactly. Hold two jobs and one seam disappears. Hold all five
 * and there are no seams at all: the finished thing is the thing that was
 * written, at full strength, with no variance around it.
 *
 * The multiplier is on fidelity, coherence and certainty. It is never on the
 * ceiling, because the ceiling is already the top of the scale and a number
 * above it would not mean anything.
 *
 * ── Why it is built this way ────────────────────────────────────────────────
 *
 * Three things had to be true at once. The founder's sheet had to matter, or
 * being the best alive is decoration. It had to stay inside 0-100, or every
 * curve downstream breaks. And doing four jobs on one picture had to beat
 * doing one, without making hiring anybody pointless — because a company that
 * never hires is not a company.
 *
 * A chain with losses does all three. Your ceiling is 100 everywhere. What you
 * are playing for is how much of it survives, and there are only so many hours
 * in a week to hold the seams closed yourself.
 */

// ---------------------------------------------------------------------------
// The storytelling departments
// ---------------------------------------------------------------------------

/**
 * What a script is judged on, department by department.
 *
 * Nine of them, and a script is not one number until the end. A writer can be
 * extraordinary at dialogue and unable to land an ending, and the game should
 * say which — so notes, rewrites and reviews all have something specific to
 * point at.
 */
export interface StoryDepartment {
  id: string;
  name: string;
  what: string;
  /** Skills it is drawn from, averaged. */
  from: readonly string[];
  /** How much of the script's overall read it carries. */
  weight: number;
}

export const STORY_DEPARTMENTS: readonly StoryDepartment[] = [
  {
    id: 'structure', name: 'Structure', weight: 1.15,
    what: 'Whether the thing is built. Where it turns, and whether it holds when it does.',
    from: ['story_structure'],
  },
  {
    id: 'dialogue', name: 'Dialogue', weight: 1.05,
    what: 'Lines an actor/actress wants to say and an audience wants to hear.',
    from: ['dialogue'],
  },
  {
    id: 'character', name: 'Character', weight: 1.2,
    what: 'People on the page who behave like people, including when it’s inconvenient.',
    from: ['character_writing'],
  },
  {
    id: 'theme', name: 'Theme', weight: 0.9,
    what: 'What it is about underneath what it is about, carried rather than stated.',
    from: ['story_structure', 'character_writing'],
  },
  {
    id: 'world', name: 'World', weight: 0.85,
    what: 'Rules, texture and internal logic that hold up when the audience pushes on them.',
    from: ['world_building'],
  },
  {
    id: 'pace', name: 'Pace', weight: 1.0,
    what: 'Whether it moves. The most common thing wrong with a competent script.',
    from: ['story_structure', 'page_speed'],
  },
  {
    id: 'originality', name: 'Originality', weight: 0.95,
    what: 'Whether anybody has seen this before, and whether it needed to exist.',
    from: ['world_building', 'character_writing'],
  },
  {
    id: 'emotional_truth', name: 'Emotional Truth', weight: 1.15,
    what: 'Whether a moment lands as felt rather than as written.',
    from: ['character_writing', 'dialogue'],
  },
  {
    id: 'ending', name: 'The Ending', weight: 1.1,
    what: 'The part everybody remembers and almost nobody gets right.',
    from: ['story_structure', 'rewriting'],
  },
];

export const STORY_DEPARTMENT_BY_ID: Readonly<Record<string, StoryDepartment>> =
  Object.fromEntries(STORY_DEPARTMENTS.map((d) => [d.id, d]));

// ---------------------------------------------------------------------------
// The five jobs
// ---------------------------------------------------------------------------

/**
 * The jobs one person can hold on one piece of work.
 *
 * Exactly the five the founder is the best living practitioner of, which is
 * not a coincidence: the disciplines were chosen to be the five seams in a
 * production, so that holding all of them means holding all of it.
 */
export type Job = 'writer' | 'director' | 'producer' | 'showrunner' | 'actor';

export const JOBS: readonly Job[] = ['writer', 'director', 'producer', 'showrunner', 'actor'];

export interface JobDef {
  id: Job;
  name: string;
  /** What this job decides about the finished thing. */
  owns: string;
  /** Skills the job is read from, averaged. */
  from: readonly string[];
  /** Whether the job exists on this kind of work at all. */
  seriesOnly?: boolean;
}

export const JOB_DEFS: readonly JobDef[] = [
  {
    id: 'writer', name: 'Writer',
    owns: 'The nine storytelling departments. Everything downstream is a copy of this, degraded.',
    from: ['story_structure', 'dialogue', 'character_writing', 'world_building', 'rewriting'],
  },
  {
    id: 'director', name: 'Director',
    owns: 'Whether what was written is what is on the screen.',
    from: ['visual_language', 'actor_direction', 'tone_control', 'coverage_planning', 'post_vision'],
  },
  {
    id: 'producer', name: 'Producer',
    owns: 'Whether it got made at the size it needed, on the days it needed.',
    from: ['budgeting', 'scheduling', 'crisis_management', 'vendor_management', 'post_supervision'],
  },
  {
    id: 'showrunner', name: 'Showrunner', seriesOnly: true,
    owns: 'Whether episode nineteen is as good as episode one.',
    from: ['room_leadership', 'episode_breaking', 'slate_strategy', 'story_structure'],
  },
  {
    id: 'actor', name: 'Lead',
    owns: 'Whether anybody believes it.',
    from: [],
  },
];

export const JOB_BY_ID: Readonly<Record<Job, JobDef>> =
  Object.fromEntries(JOB_DEFS.map((j) => [j.id, j])) as Record<Job, JobDef>;

// ---------------------------------------------------------------------------
// The chain
// ---------------------------------------------------------------------------

/**
 * The stages the work passes through, in order, and who hands to whom.
 *
 * `from` is the stage whose output arrives here. `head` is the job responsible.
 * `lift` is how much a head better than the material can raise it; `drag` is
 * how much a head worse than the material loses. Drag is always the larger of
 * the two, because it is much easier to lose a good script than to rescue a
 * bad one.
 */
export interface Stage {
  id: string;
  name: string;
  what: string;
  head: Job;
  /** Which earlier stage feeds this one. 'script' is the source. */
  from: 'script' | 'direction' | 'performance' | 'craft';
  lift: number;
  drag: number;
  /** Share of the finished work's read. */
  weight: number;
  seriesOnly?: boolean;
}

export const STAGES: readonly Stage[] = [
  {
    id: 'direction', name: 'Direction', head: 'director', from: 'script',
    what: 'The script becomes shots, performances and a tone. The widest seam in the whole chain.',
    lift: 0.35, drag: 0.5, weight: 1.25,
  },
  {
    id: 'performance', name: 'Performance', head: 'actor', from: 'direction',
    what: 'What the cast does with what the director asked for.',
    lift: 0.3, drag: 0.42, weight: 1.15,
  },
  {
    id: 'craft', name: 'Craft', head: 'producer', from: 'direction',
    what: 'Whether the money, the days and the departments were there when the scene needed them.',
    lift: 0.2, drag: 0.38, weight: 0.9,
  },
  {
    id: 'season', name: 'The Season', head: 'showrunner', from: 'craft', seriesOnly: true,
    what: 'Whether it holds across a run rather than for one hour.',
    lift: 0.28, drag: 0.45, weight: 1.0,
  },
];

export const STAGE_BY_ID: Readonly<Record<string, Stage>> =
  Object.fromEntries(STAGES.map((s) => [s.id, s]));

// ---------------------------------------------------------------------------
// Fidelity, and what stacking jobs is worth
// ---------------------------------------------------------------------------

/**
 * How much of the incoming work survives a handoff between two different
 * people, before their alignment is read.
 *
 * Not a penalty for hiring. It is the cost of translation, and it is why a
 * great script and a great director do not automatically make a great film.
 */
export const HANDOFF_FIDELITY_BASE = 0.8;

/** How far alignment between the two people can raise it. Ceiling is 0.97. */
export const HANDOFF_FIDELITY_RANGE = 0.17;

/**
 * The same person on both ends. Exactly one, and it is the whole point: there
 * is nothing to translate, so nothing is lost.
 */
export const SELF_FIDELITY = 1;

/**
 * What holding more than one job is worth, by how many are held.
 *
 * It multiplies coherence and it divides variance. It never multiplies a
 * department score, because those are already at the top of the scale and a
 * number above it would mean nothing.
 */
export const STACK: readonly { jobs: number; multiplier: number; name: string; what: string }[] = [
  { jobs: 0, multiplier: 1, name: 'Hands Off', what: 'You own it and other people made it. Every seam is somebody else’s.' },
  { jobs: 1, multiplier: 1, name: 'One Job', what: 'You did one of the five yourself. The other four are handoffs.' },
  { jobs: 2, multiplier: 1.06, name: 'Hyphenate', what: 'One seam closed. What you meant on one side is what arrives on the other.' },
  { jobs: 3, multiplier: 1.13, name: 'Triple Threat', what: 'Two seams closed. Most of the picture is coming through undiluted.' },
  { jobs: 4, multiplier: 1.21, name: 'Total Authorship', what: 'Three seams closed. Almost nothing is being translated by anybody.' },
  { jobs: 5, multiplier: 1.3, name: 'One Person, Whole Picture', what: 'No seams. The finished thing is the thing you wrote, at full strength.' },
];

export function stackFor(jobsHeld: number): (typeof STACK)[number] {
  const clamped = Math.max(0, Math.min(STACK.length - 1, Math.round(jobsHeld)));
  return STACK[clamped]!;
}

/**
 * How wide the outcome can land either side of what was made.
 *
 * Every hand a picture passes through is a chance for it to come out other
 * than intended — better on a good day, worse on a bad one. Holding the jobs
 * yourself removes the chances one at a time, and holding all five removes
 * them entirely: what you made is exactly what comes out, with nothing left
 * to luck.
 */
export const SPREAD_WITH_NO_JOBS = 16;

export function spreadFor(jobsHeld: number, totalJobs: number): number {
  if (totalJobs <= 0) return SPREAD_WITH_NO_JOBS;
  const share = Math.max(0, Math.min(1, jobsHeld / totalJobs));
  return SPREAD_WITH_NO_JOBS * (1 - share);
}
