/**
 * SLATE — conceiving a thing, and the four refusals that make an engine real.
 *
 * `content/concept.ts` says what a story engine is and why television needs one.
 * This attaches one to a project, and — the part that matters — stands in front of
 * the greenlight and refuses the ones that cannot work.
 *
 * ## An engine that refuses nothing is a label
 *
 * That is the whole test. A concept the player fills in and the engine never reads
 * is the defect this project has a tool for, so the engine earns its place by
 * shutting four doors that used to be open:
 *
 *   1. **Television with no concept at all.** A series is a machine that makes
 *      episodes. A television premise with no engine under it is refused in the
 *      room rather than made badly, and now it is refused here.
 *   2. **An engine that cannot sustain the cadence.** A transformation finishes, so
 *      it cannot carry something that keeps coming back. The refusal says which
 *      cadences it *can* carry, because a refusal that does not tell you where to
 *      go is a wall.
 *   3. **A plan asking for more parts than the engine has fuel for.** `carries` is
 *      a tank, and twenty-four parts of withheld secret will not stretch to forty.
 *   4. **An ensemble too small to run it.** Television turns on a web of characters.
 *      An engine built on people who cannot get away from each other does not run
 *      on two of them.
 *
 * And one thing it writes rather than refuses: the concept says where the thing is
 * set, and the unit works out of that city. `unitBaseId` existed and was always the
 * lot's own town, because nothing else ever wrote it.
 *
 * ## Why this is not part of `company.develop`
 *
 * Because conceiving and developing are different acts with different costs, and
 * folding them together was what made the medium the real format decision — taken
 * first, in a modal, with the least information anybody will ever have about the
 * thing. A concept can be changed while a picture is still an idea and is fixed at
 * the greenlight, which is the moment the engine starts being checked.
 */

import type { Simulation } from '../core/simulation';
import type { Id, Project } from '../domain/model';

import {
  CADENCE_LABEL, MOST_PARTS, engineById, enginesFor, type Cadence, type StoryEngine,
} from '../content/concept';
import { CITIES } from '../content/geography';
import { plural } from '../core/text';
import { MAKING } from '../domain/company';

/**
 * What the engine needs to know about a way of making something.
 *
 * Declared here rather than imported, and that is the point. The engine used to
 * take a `Plan` off the production system, which made the first thing in the
 * pipeline depend on the last. It now states its own contract — an id, a label,
 * how many parts it delivers and what shape of commitment it is — and whatever
 * production system is built next conforms to it rather than the other way round.
 */
export interface MadeAs {
  id: string;
  label: string;
  cadence: Cadence;
  parts: number;
}

/** What the player is asking for when they conceive something. */
export interface Conceiving {
  projectId: Id;
  engineId: string;
  worldId: string;
  people: number;
}

/** A concept can be changed while the thing is still an idea, and not after. */
const UNDER_WAY = new Set<string>(MAKING);

/**
 * Why a concept cannot be attached, where it cannot.
 *
 * Refusals in the order a person would hit them, and each one names the thing that
 * would fix it. `undefined` means it would take.
 */
export function whyNotConceive(sim: Simulation, spec: Conceiving): string | undefined {
  const project = sim.universe.projects[spec.projectId];
  if (!project) return 'There’s no such picture.';
  if (project.shelvedAt !== undefined) return `${project.title} is off the slate.`;
  if (UNDER_WAY.has(project.stage)) {
    return `${project.title} is already being made. What it is was settled at the greenlight.`;
  }

  const engine = engineById(spec.engineId);
  if (!engine) return 'There’s no such engine.';

  if (!CITIES.get(spec.worldId)) return 'There’s nowhere by that name to set it.';

  if (!Number.isFinite(spec.people) || spec.people < 1) {
    return 'It has to be about at least one person.';
  }
  if (spec.people < engine.leastPeople) {
    return `${engine.label} runs on people rubbing against each other, and ${spec.people} `
      + `${spec.people === 1 ? 'person isn’t' : 'people aren’t'} enough of them. It needs ${engine.leastPeople}.`;
  }
  return undefined;
}

/** Attaches a concept to a project, or says why not. */
export function conceive(
  sim: Simulation, spec: Conceiving,
): { ok: boolean; error?: string } {
  const why = whyNotConceive(sim, spec);
  if (why) return { ok: false, error: why };
  const project = sim.universe.projects[spec.projectId]!;
  const engine = engineById(spec.engineId)!;
  project.concept = {
    engineId: engine.id,
    worldId: spec.worldId,
    people: Math.round(spec.people),
    at: sim.now,
  };
  sim.notify({
    category: 'business',
    title: `${project.title}: What It Is`,
    body: `${engine.label}. ${engine.asks} Set in ${CITIES.get(spec.worldId)?.name ?? 'somewhere'}, `
      + `${plural(spec.people, 'person')}. ${engine.rules}`,
    importance: 40,
    route: '/workspace/business',
    refType: 'project',
    refId: project.id,
  });
  return { ok: true };
}

/**
 * Whether this engine can honestly be made as this plan, and why not where it cannot.
 *
 * The gate. Called from `wouldBe` before any date is laid, so a refused greenlight
 * writes nothing — and called from the screen, on the same function, so the form can
 * gray out a plan rather than letting somebody find out by pressing the button.
 */
export function whyNotMakeAs(project: Project, plan: MadeAs): string | undefined {
  const concept = project.concept;

  // 1. Television with nothing underneath it.
  if (concept === undefined) {
    if (plan.cadence === 'single') return undefined;
    return `${plan.label} is a machine that has to make ${plan.parts} of something, `
      + 'and nobody has said what makes the next one. Say what it is first.';
  }

  const engine = engineById(concept.engineId);
  if (!engine) return 'The engine this was conceived on is not one this build has.';

  // 2. An engine that cannot sustain the shape of the commitment.
  if (!engine.cadences.includes(plan.cadence)) {
    const can = engine.cadences.map((one) => CADENCE_LABEL[one].toLowerCase());
    return `${engine.label} can’t carry ${CADENCE_LABEL[plan.cadence].toLowerCase()}. `
      + `${engine.carries === undefined ? 'It’s the wrong shape for it' : 'It finishes'}, `
      + `and what it can carry is ${said(can)}.`;
  }

  // 3. More parts than there is fuel for.
  const fuel = engine.carries;
  if (fuel !== undefined && plan.parts > fuel) {
    return `${engine.label} has about ${fuel} parts in it before there’s nothing left to `
      + `reveal, and ${plan.label} asks for ${plan.parts}.`;
  }
  if (plan.parts > MOST_PARTS) {
    return `${plan.parts} parts is more than anybody makes of one thing.`;
  }

  // 4. Not enough people to run it.
  if (concept.people < engine.leastPeople) {
    return `${engine.label} needs ${plural(engine.leastPeople, 'person')} and this one has ${concept.people}.`;
  }
  return undefined;
}

/** The plans this project could honestly be made as, for a screen to offer. */
export function couldBeMadeAs<T extends MadeAs>(project: Project, plans: readonly T[]): readonly T[] {
  return plans.filter((one) => whyNotMakeAs(project, one) === undefined);
}

/** The engines that could carry a given plan, for a screen to explain a refusal with. */
export function enginesThatCarry(plan: MadeAs): readonly StoryEngine[] {
  return enginesFor(plan.cadence).filter((one) => one.carries === undefined || one.carries >= plan.parts);
}

/** "a, b and c", because a refusal reads as a sentence or it does not get read. */
function said(all: readonly string[]): string {
  if (all.length === 0) return 'nothing';
  if (all.length === 1) return all[0]!;
  return `${all.slice(0, -1).join(', ')} and ${all[all.length - 1]}`;
}

export function registerConcept(sim: Simulation): void {
  sim.onCommand<Conceiving, { ok: boolean; error?: string }>(
    'company.conceive',
    (payload) => conceive(sim, payload),
  );
}
