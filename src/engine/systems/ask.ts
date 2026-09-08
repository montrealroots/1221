/**
 * SLATE — say what you want, and the game works out what you meant.
 *
 * The contract asks for four things and this does exactly those four: work out
 * which supported action was meant, ask when it cannot tell, do it, and say
 * what happened. And the fifth, which is the one that matters: never pretend
 * to have done something it cannot do, and where the answer is no, say what
 * would make it yes.
 *
 * The last of those is why this resolves to a plan rather than running
 * anything itself. The plan is a real command with a real payload, executed
 * through the same path a button uses, so every guard, every refusal and every
 * refusal's wording is the command's own. Nothing here can say yes on behalf
 * of a command that would have said no.
 *
 * There is no model behind this and no network. It is a matcher over a written
 * phrasebook of the things the game actually does, which is why it says it did
 * not understand rather than guessing.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { placesIn, type Place } from '../content/places';
import { resolveIntent, type IntentChoice } from './intent';
import {
  ASK_LIMITS_NOTE, ASK_NOTE, ASKABLE_BY_ID, PHRASEBOOK, type Askable,
} from '../content/phrasebook';

/** What came back from asking for something. */
export type AskResult =
  /** One thing, understood, with the command to run it. */
  | {
    kind: 'do';
    askable: Askable;
    command: string;
    payload: Record<string, unknown>;
    /** What is about to happen, in a sentence, so it can be confirmed. */
    preview: string;
  }
  /** Understood, but it is a screen rather than a command. */
  | { kind: 'go'; askable: Askable; route: string; why: string }
  /** Understood the verb, needs to know which one. */
  | { kind: 'which'; askable: Askable; question: string; options: { id: string; label: string; detail: string }[] }
  /** Two or more things it could have been. */
  | { kind: 'ambiguous'; question: string; options: { id: string; label: string; detail: string }[] }
  /** Understood, and cannot be done here. The reason is the whole point. */
  | { kind: 'cannot'; askable: Askable; why: string; route: string }
  /** Not something the game does. Said plainly. */
  | { kind: 'unsupported'; why: string; nearest: { id: string; label: string }[] };

/** The phrasebook as the intent matcher wants it. */
function choicesOf(entries: readonly Askable[]): IntentChoice[] {
  return entries.map((one) => ({ id: one.id, label: one.label, aliases: one.says }));
}

/** The places in this city of the kind an entry needs. */
export function candidatesFor(sim: Simulation, askable: Askable, person: Person = sim.player): Place[] {
  if (askable.needs !== 'place' || !askable.placeKind) return [];
  return placesIn(person.currentLocationId).filter((one) => one.kind === askable.placeKind);
}

/**
 * The plan for one place: do the thing if you are there, go there if not.
 *
 * The command is always the real one, and every guard on it still applies.
 * What this decides is only which of two real commands was meant.
 */
function planAt(askable: Askable, place: Place, standingHere: boolean): AskResult {
  if (standingHere && askable.command) {
    return {
      kind: 'do',
      askable,
      command: askable.command,
      payload: { ...(askable.payload ?? {}), placeId: place.id },
      preview: `${askable.label}, at ${place.name}.`,
    };
  }
  return {
    kind: 'do',
    askable,
    command: 'go.to',
    payload: { placeId: place.id },
    preview: `${place.name}. ${askable.about}`,
  };
}

/**
 * What somebody meant, and what to do about it.
 *
 * Everything this returns is either a real command with a real payload, a real
 * route, a question, or a plain no. There is no fifth kind, and in particular
 * there is no "done" — because this has not done anything.
 */
export function resolveAsk(sim: Simulation, text: string, person: Person = sim.player): AskResult {
  const typed = text.trim();
  if (typed.length === 0) {
    return { kind: 'unsupported', why: 'Say what you want and it will have a go.', nearest: [] };
  }

  const intent = resolveIntent(typed, choicesOf(PHRASEBOOK));

  if (intent.kind === 'ambiguous') {
    const options = intent.candidates
      .map((id) => ASKABLE_BY_ID[id])
      .filter((one): one is Askable => one !== undefined)
      .map((one) => ({ id: one.id, label: one.label, detail: one.about }));
    return {
      kind: 'ambiguous',
      question: 'That could be a couple of things. Which did you mean?',
      options,
    };
  }

  if (intent.kind !== 'choice') {
    // The matcher understood nothing. Offer the nearest few by hand rather
    // than a guess, so somebody can see what the game does know about.
    const words = typed.toLowerCase().split(/\s+/).filter((one) => one.length > 3);
    const nearest = PHRASEBOOK
      .filter((one) => words.some((word) => one.says.some((says) => says.includes(word))
        || one.label.toLowerCase().includes(word)))
      .slice(0, 4)
      .map((one) => ({ id: one.id, label: one.label }));
    return {
      kind: 'unsupported',
      why: nearest.length > 0
        ? 'That is not something SLATE does in those words. These are near it.'
        : 'That is not something SLATE does. It will not pretend otherwise.',
      nearest,
    };
  }

  const askable = ASKABLE_BY_ID[intent.choiceId];
  if (!askable) return { kind: 'unsupported', why: 'That is not something SLATE does.', nearest: [] };

  // A screen is a screen. Saying so is honest; running something instead
  // would be the game deciding for you.
  if (askable.needs === 'screen' || !askable.command) {
    return { kind: 'go', askable, route: askable.route, why: askable.about };
  }

  if (askable.needs === 'place') {
    const found = candidatesFor(sim, askable, person);
    if (found.length === 0) {
      return {
        kind: 'cannot',
        askable,
        why: 'There is nothing of that kind in this city. Somewhere bigger will have one.',
        route: askable.route,
      };
    }
    // Standing in the right kind of place already means doing the thing;
    // standing anywhere else means going there first. Both are real commands
    // and neither is this deciding anything on the command's behalf.
    const here = found.find((one) => one.id === person.currentPlaceId);
    if (here) return planAt(askable, here, true);
    if (found.length > 1) {
      return {
        kind: 'which',
        askable,
        question: 'Which one?',
        options: found.slice(0, 6).map((one) => ({ id: one.id, label: one.name, detail: one.about })),
      };
    }
    return planAt(askable, found[0]!, false);
  }

  return {
    kind: 'do',
    askable,
    command: askable.command,
    payload: { ...(askable.payload ?? {}) },
    preview: `${askable.label}. ${askable.about}`,
  };
}

/**
 * The plan for one option of a question that was asked back.
 *
 * Picking "the Yardley practice" out of three dentists is still not doing
 * anything: it produces the same plan the unambiguous case would have.
 */
export function planFor(
  sim: Simulation, askableId: string, optionId?: string, person: Person = sim.player,
): AskResult {
  const askable = ASKABLE_BY_ID[askableId];
  if (!askable) return { kind: 'unsupported', why: 'That is not something SLATE does.', nearest: [] };
  if (askable.needs === 'screen' || !askable.command) {
    return { kind: 'go', askable, route: askable.route, why: askable.about };
  }
  if (askable.needs === 'place') {
    const found = candidatesFor(sim, askable, person).find((one) => one.id === optionId);
    if (!found) {
      return { kind: 'cannot', askable, why: 'That is not somewhere in this city.', route: askable.route };
    }
    return planAt(askable, found, person.currentPlaceId === found.id);
  }
  return {
    kind: 'do',
    askable,
    command: askable.command,
    payload: { ...(askable.payload ?? {}) },
    preview: `${askable.label}. ${askable.about}`,
  };
}

/** Everything the game knows how to be asked for, for a page that lists it. */
export function everythingAskable(): readonly Askable[] {
  return PHRASEBOOK;
}

export { ASK_LIMITS_NOTE, ASK_NOTE, PHRASEBOOK, type Askable };
