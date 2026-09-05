/**
 * SLATE — reading the chain against real people.
 *
 * `domain/quality.ts` holds the arithmetic and knows nothing about a universe.
 * This is the layer that fills it in: who is holding which job, what their
 * sheets actually say, and how well any two of them understand each other.
 *
 * Every number a player is shown about a piece of work comes through here, so
 * that a screen can never quote a figure the engine did not produce.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Id, Person } from '../domain/model';
import { attributesOf, overallRating, skillsOf } from '../domain/attributes';
import { findRelationship } from './relationships';
import {
  JOBS, JOB_BY_ID, STORY_DEPARTMENT_BY_ID, type Job,
} from '../content/authorship';
import {
  capabilityFor, readWork, scriptFrom, settle,
  type Assignment, type Hand, type WorkRead,
} from '../domain/quality';

/** Who is doing what on one piece of work. */
export type Crew = Partial<Record<Job, Id>>;

/**
 * How well two people understand each other, 0-100.
 *
 * Working shorthand, mostly: respect and compatibility from whatever
 * relationship they have. Two strangers sit at fifty, which is why the first
 * thing you make with somebody is rarely the best thing you make with them.
 */
export function alignmentBetween(sim: Simulation, aId: Id, bId: Id): number {
  if (aId === bId) return 100;
  const rel = findRelationship(sim, aId, bId);
  if (!rel) return 50;
  const respect = rel.dimensions['respect'] ?? 50;
  const compatibility = rel.dimensions['compatibility'] ?? 50;
  return Math.max(0, Math.min(100, (respect + compatibility) / 2));
}

/** What one person is worth in one job, read off their real sheets. */
export function handFor(sim: Simulation, person: Person, job: Job, upstreamId?: Id): Hand {
  const skills = skillsOf(person, Object.values(person.professions ?? {}).flatMap((p) => p?.traitIds ?? []));
  const capability = job === 'actor'
    ? capabilityFor(job, skills, overallRating(attributesOf(person)))
    : capabilityFor(job, skills);
  return {
    id: person.id,
    name: person.displayName,
    capability,
    alignment: upstreamId ? alignmentBetween(sim, upstreamId, person.id) : 50,
  };
}

function requirePerson(sim: Simulation, id: Id): Person {
  const person = sim.universe.people[id];
  if (!person) throw new CommandError('That person is not in this save.');
  return person;
}

/**
 * The whole chain for a crew, on this kind of work.
 *
 * `subjectId` is whose stack is being counted — the player, unless something
 * has a reason to ask about somebody else.
 */
export function readCrew(
  sim: Simulation,
  crew: Crew,
  opts: { isSeries?: boolean; subjectId?: Id } = {},
): WorkRead {
  const subjectId = opts.subjectId ?? sim.universe.playerId;
  const isSeries = opts.isSeries ?? false;

  const writerId = crew.writer;
  if (!writerId) throw new CommandError('Somebody has to write it.');
  const writer = requirePerson(sim, writerId);
  const writerSkills = skillsOf(writer, Object.values(writer.professions ?? {}).flatMap((p) => p?.traitIds ?? []));
  const script = scriptFrom(writerSkills, writer.id);

  // Who hands to whom, so alignment is read against the right person.
  const upstreamOf: Partial<Record<Job, Job>> = {
    director: 'writer', actor: 'director', producer: 'director', showrunner: 'producer',
  };

  const hands: Assignment['hands'] = {};
  for (const job of JOBS) {
    const id = crew[job];
    if (!id) continue;
    if (job === 'showrunner' && !isSeries) continue;
    const upstreamJob = upstreamOf[job];
    const upstreamId = upstreamJob ? crew[upstreamJob] : undefined;
    hands[job] = handFor(sim, requirePerson(sim, id), job, upstreamId);
  }

  return readWork(script, { hands, isSeries, subjectId });
}

/**
 * The chain, settled, with the reason written into the record.
 *
 * The audit is the contract: whatever a screen says about a piece of work, the
 * player can open this and see which seam cost them what. At full stack there
 * is nothing left to luck and the audit says so rather than implying it.
 */
export function settleCrew(
  sim: Simulation,
  crew: Crew,
  opts: { isSeries?: boolean; subjectId?: Id; title?: string; refType?: string; refId?: Id } = {},
): { read: WorkRead; outcome: number } {
  const read = readCrew(sim, crew, opts);
  const roll = read.spread > 0 ? sim.rng('work', opts.refId ?? 'unfiled', read.jobsHeld).next() : 0;
  const outcome = settle(read, roll);
  const title = opts.title ?? 'This Piece Of Work';

  sim.audit({
    kind: 'work.quality',
    subjectType: opts.refType ?? 'work',
    subjectId: opts.refId ?? sim.universe.playerId,
    question: `Why did ${title} come out at ${Math.round(outcome)}?`,
    summary: read.spread === 0
      ? `A ${Math.round(read.script.overall)} script, and you held every job in the chain, so a ${Math.round(outcome)} is exactly what it is. Nothing was left to chance.`
      : `A ${Math.round(read.script.overall)} script came out at ${Math.round(outcome)}. `
        + `${read.jobsHeld} of ${read.jobsInChain} jobs were yours; the rest was handed to somebody else.`,
    factors: [
      {
        label: 'The Script',
        detail: `${Math.round(read.script.overall)} across the nine departments. Everything after this is a copy of it.`,
        weight: 1.1, contribution: read.script.overall / 100, knowable: true,
      },
      ...read.stages.map((stage) => ({
        label: stage.name,
        detail: stage.unbroken
          ? `You held both ends, so nothing was lost in the handoff. ${Math.round(stage.carried)} in, ${Math.round(stage.out)} out.`
          : `${Math.round(stage.carried)} of ${Math.round(stage.carried / (stage.fidelity || 1))} survived the handoff`
            + `${stage.drag > 0.5 ? `, and ${Math.round(stage.drag)} more went because the material was above them` : ''}`
            + `${stage.lift > 0.5 ? `, and they added ${Math.round(stage.lift)} of their own` : ''}. `
            + `Out at ${Math.round(stage.out)}.`,
        weight: 1, contribution: stage.out / 100, knowable: true,
      })),
      {
        label: read.stack.name,
        detail: `${read.stack.what} Coherence ${Math.round(read.coherence)}`
          + `${read.spread === 0 ? ', and no spread at all.' : `, and it could have landed ${read.spread.toFixed(0)} either way.`}`,
        weight: 1, contribution: read.stack.multiplier - 1, knowable: true,
      },
    ],
    outcome: String(Math.round(outcome)),
  });

  return { read, outcome };
}

export function registerAuthorship(sim: Simulation): void {
  /**
   * What would come out, if this crew made this.
   *
   * The planning tool, and the reason the founder's sheet is worth reading:
   * it answers "is it worth directing this one myself" with a number rather
   * than a feeling. It changes nothing, so it is free and can be asked twice.
   */
  sim.onCommand<
    { crew: Crew; isSeries?: boolean; title?: string },
    {
      script: number;
      departments: Record<string, { name: string; value: number }>;
      quality: number;
      coherence: number;
      spread: number;
      low: number;
      high: number;
      jobsHeld: number;
      jobsInChain: number;
      stack: string;
      multiplier: number;
      stages: { name: string; out: number; unbroken: boolean; head?: string }[];
    }
  >('work.project', (p, { sim: s }) => {
    const read = readCrew(s, p.crew, { isSeries: p.isSeries ?? false });
    return {
      script: Math.round(read.script.overall * 10) / 10,
      departments: Object.fromEntries(
        Object.entries(read.script.departments).map(([id, value]) => [
          id, { name: STORY_DEPARTMENT_BY_ID[id]?.name ?? id, value: Math.round(value * 10) / 10 },
        ]),
      ),
      quality: Math.round(read.quality * 10) / 10,
      coherence: Math.round(read.coherence),
      spread: Math.round(read.spread * 10) / 10,
      low: Math.round(Math.max(0, read.quality - read.spread) * 10) / 10,
      high: Math.round(Math.min(100, read.quality + read.spread) * 10) / 10,
      jobsHeld: read.jobsHeld,
      jobsInChain: read.jobsInChain,
      stack: read.stack.name,
      multiplier: read.stack.multiplier,
      stages: read.stages.map((stage) => ({
        name: stage.name,
        out: Math.round(stage.out * 10) / 10,
        unbroken: stage.unbroken,
        ...(stage.head === undefined ? {} : { head: s.universe.people[stage.head]?.displayName ?? stage.head }),
      })),
    };
  });
}

/** For a screen: what each of the five jobs is worth in this person's hands. */
export function jobSheet(sim: Simulation, personId?: Id) {
  const person = requirePerson(sim, personId ?? sim.universe.playerId);
  return JOBS.map((job) => ({
    job,
    name: JOB_BY_ID[job].name,
    owns: JOB_BY_ID[job].owns,
    capability: Math.round(handFor(sim, person, job).capability),
  }));
}
