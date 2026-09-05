/**
 * SLATE — the quality chain.
 *
 * Pure arithmetic, no simulation. Given who is doing which job and how good
 * each of them is, this says what comes out, department by department, stage
 * by stage, with the reason for every number.
 *
 * It is kept pure on purpose. This is the arithmetic every other system reads
 * — what a buyer pays, what a critic writes, what an award votes on — so it
 * must be inspectable on its own, testable without a world around it, and
 * impossible for a screen to disagree with.
 */

import {
  HANDOFF_FIDELITY_BASE, HANDOFF_FIDELITY_RANGE, JOBS, JOB_BY_ID, SELF_FIDELITY,
  STAGES, STORY_DEPARTMENTS, spreadFor, stackFor, type Job, type Stage,
} from '../content/authorship';

/**
 * A score on the 0-100 scale.
 *
 * Rounded to six places before clamping, because a perfect chain is a sum of
 * weighted hundreds and floating point lands that on 99.99999999999999. Six
 * places is far beyond anything the game displays and it makes a hundred read
 * as a hundred, which is the whole claim being made about the founder's work.
 */
const clamp100 = (n: number) => {
  const rounded = Math.round(n * 1e6) / 1e6;
  return Math.max(0, Math.min(100, rounded));
};

/** Somebody doing one of the jobs. */
export interface Hand {
  /** Whoever they are. Two jobs with the same id are the same person. */
  id: string;
  name: string;
  /** Their capability for the job they are holding, 0-100. */
  capability: number;
  /**
   * How well this person and the one who handed to them understand each other,
   * 0-100. Ignored when it is the same person, because there is no handoff.
   */
  alignment?: number;
}

export interface Assignment {
  /** Who holds each job. A job with nobody on it does not happen. */
  hands: Partial<Record<Job, Hand>>;
  /** Whether this is a run rather than one thing, which puts a showrunner in the chain. */
  isSeries: boolean;
  /** Whose stack is being counted — the founder's, normally. */
  subjectId: string;
}

/** The nine storytelling departments as they came out of the writer. */
export interface ScriptRead {
  departments: Record<string, number>;
  /** The weighted mean of the nine. */
  overall: number;
  writer?: string;
}

export interface StageRead {
  id: string;
  name: string;
  /** What arrived from the stage before, after the handoff. */
  carried: number;
  /** The head's own capability. */
  capability: number;
  /** 1 when the same person held both ends. */
  fidelity: number;
  /** What the head added, being better than what arrived. */
  lift: number;
  /** What the head lost, not being able to hold what arrived. */
  drag: number;
  /** What leaves this stage. */
  out: number;
  head?: string;
  headJob: Job;
  /** True when no handoff happened because one person held both ends. */
  unbroken: boolean;
}

export interface WorkRead {
  script: ScriptRead;
  stages: StageRead[];
  /** The weighted read of the finished thing, before luck. */
  quality: number;
  /** How much of one intention the finished thing is, 0-100. */
  coherence: number;
  /** How many of the jobs in this chain the subject held. */
  jobsHeld: number;
  jobsInChain: number;
  /** What the stack is worth, and what it is called. */
  stack: ReturnType<typeof stackFor>;
  /** How far the outcome can land either side of `quality`. Zero at full stack. */
  spread: number;
  /** The seams that were closed, and the ones that were not. */
  seams: { from: Job; to: Job; unbroken: boolean }[];
}

/**
 * What a writer's skills make of the nine departments.
 *
 * Each department averages the skills it is drawn from, so a sheet at the
 * ceiling produces a script at the ceiling in every department — which is the
 * whole claim about the founder, expressed as arithmetic rather than asserted.
 */
export function scriptFrom(skills: Record<string, number>, writer?: string): ScriptRead {
  const departments: Record<string, number> = {};
  let weighted = 0;
  let weight = 0;
  for (const department of STORY_DEPARTMENTS) {
    const parts = department.from.map((id) => skills[id] ?? 0);
    const value = parts.length > 0 ? parts.reduce((a, b) => a + b, 0) / parts.length : 0;
    departments[department.id] = clamp100(value);
    weighted += departments[department.id]! * department.weight;
    weight += department.weight;
  }
  return {
    departments,
    overall: weight > 0 ? clamp100(weighted / weight) : 0,
    ...(writer === undefined ? {} : { writer }),
  };
}

/** What one job is worth, from the skills of whoever is holding it. */
export function capabilityFor(job: Job, skills: Record<string, number>, performerRating = 0): number {
  const def = JOB_BY_ID[job];
  if (def.from.length === 0) return clamp100(performerRating);
  const parts = def.from.map((id) => skills[id] ?? 0);
  return clamp100(parts.reduce((a, b) => a + b, 0) / parts.length);
}

/**
 * How much survives one handoff.
 *
 * One person on both ends is exactly 1. Two people is the base, raised by how
 * well they understand each other, and it never reaches 1 — because two people
 * agreeing completely about a scene is not a thing that happens.
 */
export function fidelityBetween(from: Hand | undefined, to: Hand | undefined): number {
  if (!from || !to) return HANDOFF_FIDELITY_BASE;
  if (from.id === to.id) return SELF_FIDELITY;
  const alignment = Math.max(0, Math.min(100, to.alignment ?? 50));
  return HANDOFF_FIDELITY_BASE + HANDOFF_FIDELITY_RANGE * (alignment / 100);
}

/**
 * One stage of the chain.
 *
 * `lift` is bounded by how good the head is, so a weak head cannot lift
 * anything. `drag` is unbounded by comparison and always the bigger of the
 * two: losing a good script is easy and rescuing a bad one is not.
 */
function runStage(stage: Stage, incoming: number, head: Hand | undefined, fidelity: number): StageRead {
  const capability = head?.capability ?? 0;
  const carried = incoming * fidelity;
  const lift = Math.max(0, capability - carried) * stage.lift * (capability / 100);
  const drag = Math.max(0, carried - capability) * stage.drag;
  return {
    id: stage.id,
    name: stage.name,
    carried,
    capability,
    fidelity,
    lift,
    drag,
    out: clamp100(carried + lift - drag),
    ...(head === undefined ? {} : { head: head.id }),
    headJob: stage.head,
    unbroken: fidelity === SELF_FIDELITY,
  };
}

/**
 * The whole chain, from the script to the finished thing.
 *
 * Nothing here is random. `spread` says how much luck is still to be applied
 * and by whom; at full stack it is zero, and the work is exactly what it reads.
 */
export function readWork(script: ScriptRead, assignment: Assignment): WorkRead {
  const stages = STAGES.filter((s) => !s.seriesOnly || assignment.isSeries);
  const out: Record<string, number> = { script: script.overall };
  const reads: StageRead[] = [];
  const seams: WorkRead['seams'] = [];

  // Who handed to whom. The script's author is the first hand in the chain.
  const handFor = (job: Job) => assignment.hands[job];
  const sourceJob = (stage: Stage): Job => {
    if (stage.from === 'script') return 'writer';
    return STAGES.find((s) => s.id === stage.from)?.head ?? 'writer';
  };

  for (const stage of stages) {
    const upstream = handFor(sourceJob(stage));
    const head = handFor(stage.head);
    const fidelity = fidelityBetween(upstream, head);
    const incoming = out[stage.from] ?? script.overall;
    const read = runStage(stage, incoming, head, fidelity);
    out[stage.id] = read.out;
    reads.push(read);
    seams.push({ from: sourceJob(stage), to: stage.head, unbroken: read.unbroken });
  }

  // The finished read: the stages, weighted, with the script still carrying
  // its own weight — a picture is not only its execution.
  let weighted = script.overall * 1.1;
  let weight = 1.1;
  for (const read of reads) {
    const stage = STAGES.find((s) => s.id === read.id)!;
    weighted += read.out * stage.weight;
    weight += stage.weight;
  }
  const quality = clamp100(weighted / weight);

  // Which of the jobs in this chain the subject is holding.
  const jobsInChain = JOBS.filter((job) => {
    if (job === 'showrunner' && !assignment.isSeries) return false;
    return assignment.hands[job] !== undefined;
  });
  const held = jobsInChain.filter((job) => assignment.hands[job]?.id === assignment.subjectId);
  const stack = stackFor(held.length);

  // Coherence is how much of one intention survived, seam by seam, lifted by
  // the stack. It is its own axis: a picture can be very good and incoherent,
  // and it is the incoherent ones that get the reviews saying "does not know
  // what it wants to be".
  const meanFidelity = reads.length > 0
    ? reads.reduce((sum, r) => sum + r.fidelity, 0) / reads.length
    : SELF_FIDELITY;
  const coherence = clamp100(meanFidelity * 100 * stack.multiplier);

  return {
    script,
    stages: reads,
    quality,
    coherence,
    jobsHeld: held.length,
    jobsInChain: jobsInChain.length,
    stack,
    spread: spreadFor(held.length, jobsInChain.length),
    seams,
  };
}

/**
 * What the work is finally worth, once luck has been applied.
 *
 * `roll` is a number in [0, 1) from the simulation's own generator, so the
 * same save reaches the same picture twice. At full stack the spread is zero
 * and the roll changes nothing, which is exactly the promise: hold every job
 * and there is no luck left in it.
 */
export function settle(read: WorkRead, roll: number): number {
  if (read.spread <= 0) return read.quality;
  const offset = (roll * 2 - 1) * read.spread;
  return clamp100(read.quality + offset);
}
