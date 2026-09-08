/**
 * Saying what you want, in your own words.
 *
 * What a test can hold: a sentence resolving to the command a button would
 * have run, a plan that has not run anything yet, a refusal that belongs to
 * the command rather than to the box, a question asked back when a city has
 * three dentists in it, and a plain no for the things the game does not do.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { candidatesFor, everythingAskable, planFor, resolveAsk } from '@/engine/systems/ask';
import { ASKABLE_BY_ID, ASK_LIMITS_NOTE, ASK_NOTE, PHRASEBOOK } from '@/engine/content/phrasebook';
import { placesIn } from '@/engine/content/places';

describe('the phrasebook', () => {
  it('points every entry at a command the engine registers', () => {
    const sim = quickSave();
    const kinds = new Set(sim.commandKinds());
    for (const entry of PHRASEBOOK) {
      if (entry.command) expect(kinds.has(entry.command), `${entry.label} runs ${entry.command}`).toBe(true);
    }
  });

  it('gives every entry more than one way of being said', () => {
    for (const entry of PHRASEBOOK) expect(entry.says.length).toBeGreaterThanOrEqual(3);
  });

  it('indexes by id, and everythingAskable is the whole book', () => {
    expect(everythingAskable()).toHaveLength(PHRASEBOOK.length);
    for (const entry of PHRASEBOOK) expect(ASKABLE_BY_ID[entry.id]).toBe(entry);
  });

  it('says what it is and what it is not', () => {
    expect(ASK_NOTE.length).toBeGreaterThan(60);
    expect(ASK_LIMITS_NOTE.length).toBeGreaterThan(60);
  });
});

describe('resolving a sentence', () => {
  it('understands going to bed and produces the command a button would run', () => {
    const sim = quickSave();
    const answer = resolveAsk(sim, 'i want to go to bed');
    expect(answer.kind).toBe('do');
    if (answer.kind !== 'do') return;
    expect(answer.command).toBe('life.sleep');
    expect(answer.payload.hours).toBe(8);
  });

  it('takes several different phrasings of the same thing to the same place', () => {
    const sim = quickSave();
    for (const said of ['get some sleep', 'turn in', 'have a kip', 'go to sleep']) {
      const answer = resolveAsk(sim, said);
      expect(answer.kind, said).toBe('do');
      if (answer.kind === 'do') expect(answer.askable.id, said).toBe('sleep');
    }
  });

  it('opens the screen, and says it is a screen, where the thing is done there', () => {
    const sim = quickSave();
    const answer = resolveAsk(sim, 'im hungry');
    expect(answer.kind).toBe('go');
    if (answer.kind !== 'go') return;
    expect(answer.route.startsWith('/workspace/')).toBe(true);
    expect(answer.why.length).toBeGreaterThan(20);
  });

  it('refuses what the game does not do, without inventing a capability', () => {
    const sim = quickSave();
    for (const line of ['buy a spaceship', 'become president', 'travel back in time']) {
      const answer = resolveAsk(sim, line);
      expect(answer.kind, line).toBe('unsupported');
    }
  });

  it('asks for something to be typed rather than guessing at an empty line', () => {
    const sim = quickSave();
    expect(resolveAsk(sim, '    ').kind).toBe('unsupported');
  });
});

describe('a plan is only a plan', () => {
  it('changes nothing in the world by being asked for', () => {
    const sim = quickSave();
    const before = JSON.stringify(sim.universe);
    for (const entry of PHRASEBOOK) {
      resolveAsk(sim, entry.says[0]!);
      planFor(sim, entry.id);
    }
    expect(JSON.stringify(sim.universe)).toBe(before);
  });

  it('leaves the refusal to the command, in the command′s own words', () => {
    const sim = quickSave({ birthYear: 2014 });
    const answer = resolveAsk(sim, 'work my shift');
    expect(answer.kind).toBe('do');
    if (answer.kind !== 'do') return;
    const outcome = sim.execute({ kind: answer.command, payload: answer.payload });
    expect(outcome.ok).toBe(false);
    expect(outcome.error?.length ?? 0).toBeGreaterThan(10);
  });

  it('runs, when the command is willing, exactly as the button does', () => {
    const sim = quickSave();
    const answer = resolveAsk(sim, 'go to bed');
    expect(answer.kind).toBe('do');
    if (answer.kind !== 'do') return;
    const outcome = sim.execute({ kind: answer.command, payload: answer.payload });
    expect(outcome.ok).toBe(true);
  });
});

describe('a place you have to be standing in', () => {
  it('walks you there from anywhere else', () => {
    const sim = quickSave();
    const answer = resolveAsk(sim, 'get petrol');
    if (answer.kind === 'do') expect(answer.command).toBe('go.to');
    else expect(answer.kind).toBe('which');
  });

  it('does the thing itself once you are standing in one', () => {
    const sim = quickSave();
    const station = placesIn(sim.player.currentLocationId).find((one) => one.kind === 'gas_station');
    expect(station).toBeDefined();
    sim.player.currentPlaceId = station!.id;
    const answer = resolveAsk(sim, 'get petrol');
    expect(answer.kind).toBe('do');
    if (answer.kind !== 'do') return;
    expect(answer.command).toBe('place.refuel');
    expect(answer.payload.placeId).toBe(station!.id);
  });

  it('asks which one when a city has more than one, and the answer is a real place', () => {
    const sim = quickSave();
    const entry = PHRASEBOOK.find((one) => one.needs === 'place'
      && candidatesFor(sim, one).length > 1
      && candidatesFor(sim, one).every((place) => place.id !== sim.player.currentPlaceId));
    expect(entry).toBeDefined();
    const answer = resolveAsk(sim, entry!.says[0]!);
    expect(answer.kind).toBe('which');
    if (answer.kind !== 'which') return;
    expect(answer.options.length).toBeGreaterThan(1);
    const picked = planFor(sim, entry!.id, answer.options[0]!.id);
    expect(picked.kind).toBe('do');
    if (picked.kind !== 'do') return;
    expect(picked.payload.placeId).toBe(answer.options[0]!.id);
  });

  it('says plainly when this city has nothing of the kind', () => {
    const sim = quickSave();
    const entry = PHRASEBOOK.find((one) => one.needs === 'place' && candidatesFor(sim, one).length === 0);
    if (!entry) return;
    const answer = resolveAsk(sim, entry.says[0]!);
    expect(answer.kind).toBe('cannot');
    if (answer.kind !== 'cannot') return;
    expect(answer.why).toContain('city');
    expect(answer.route.startsWith('/')).toBe(true);
  });
});
