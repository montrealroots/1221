/**
 * SLATE — what people remember.
 *
 * A scene's transcript is what was said; it is bounded and it goes. A fact
 * is what somebody took from it: a goal you told your trainer, a promise you
 * made a friend, a thing you said you would never do again. Facts live on the
 * person who holds them, they are structured rather than prose, they can
 * fade, and they are what the next scene reads to behave as if it remembers
 * — because it does.
 */

import type { Simulation } from '../core/simulation';
import type { Id, PersonFact, PersonFactKind } from '../domain/model';

/** How many facts one person carries. The least important go first. */
export const MAX_FACTS_PER_PERSON = 60;

export type FactSpec = Omit<PersonFact, 'id' | 'at'> & { at?: number };

/**
 * Records a fact on a person. The same fact — kind, subject and wording —
 * told twice is one fact with the greater weight and the later time, not two.
 */
export function rememberFact(sim: Simulation, personId: Id, spec: FactSpec): PersonFact | undefined {
  const person = sim.universe.people[personId];
  if (!person) return undefined;
  const facts = (person.facts ??= []);
  const at = spec.at ?? sim.now;

  const existing = facts.find((f) => f.kind === spec.kind && f.aboutId === spec.aboutId && f.text === spec.text);
  if (existing) {
    existing.weight = Math.max(existing.weight, spec.weight);
    existing.at = at;
    existing.expiresAt = spec.expiresAt ?? existing.expiresAt;
    existing.refType = spec.refType ?? existing.refType;
    existing.refId = spec.refId ?? existing.refId;
    return existing;
  }

  const fact: PersonFact = { id: sim.nextId('fact'), at, ...spec };
  facts.push(fact);
  prune(person.facts!, sim.now);
  return fact;
}

/** Facts a person holds, most important first, expired ones left out. */
export function factsOf(
  sim: Simulation, personId: Id,
  opts: { kind?: PersonFactKind; aboutId?: Id } = {},
): PersonFact[] {
  const person = sim.universe.people[personId];
  if (!person?.facts) return [];
  return person.facts
    .filter((f) => (f.expiresAt === undefined || f.expiresAt > sim.now)
      && (opts.kind === undefined || f.kind === opts.kind)
      && (opts.aboutId === undefined || f.aboutId === opts.aboutId))
    .sort((a, b) => b.weight - a.weight || b.at - a.at);
}

/** The single most important fact of a kind, if any. */
export function factOf(sim: Simulation, personId: Id, kind: PersonFactKind, aboutId?: Id): PersonFact | undefined {
  return factsOf(sim, personId, { kind, aboutId })[0];
}

export function forgetFact(sim: Simulation, personId: Id, factId: Id): boolean {
  const person = sim.universe.people[personId];
  if (!person?.facts) return false;
  const before = person.facts.length;
  person.facts = person.facts.filter((f) => f.id !== factId);
  return person.facts.length !== before;
}

/** Drops what has expired, then the least important beyond the cap. */
function prune(facts: PersonFact[], now: number): void {
  let kept = facts.filter((f) => f.expiresAt === undefined || f.expiresAt > now);
  if (kept.length > MAX_FACTS_PER_PERSON) {
    kept = kept
      .sort((a, b) => b.weight - a.weight || b.at - a.at)
      .slice(0, MAX_FACTS_PER_PERSON);
  }
  facts.length = 0;
  facts.push(...kept);
}
