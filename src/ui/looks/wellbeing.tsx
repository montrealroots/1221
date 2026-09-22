/**
 * SLATE — you, and the eight dials the day moves.
 *
 * Home shows two of them under a readiness figure. The other six are simulated
 * every hour and appear on no screen in the game: sleep debt, morale,
 * condition, fitness, nourishment and hygiene are all real state that has never
 * been rendered. This is exposure, not invention — every sentence below is
 * `person.wellbeing`, read out.
 *
 * Travel fatigue was a ninth until the sweep that took it out. Nothing in this
 * build ever raised it, so it sat at nought for a whole life and its term in
 * readiness was a fixed 1.0; a dial a player is invited to watch has to be able
 * to move.
 *
 * Readiness is the exception and is treated as one. It is a product of six of
 * the eight and it is not stored anywhere. It opens into a sentence about what
 * is holding it back and ways into the dials actually doing the holding,
 * because a dial is a thing and a multiplication is not.
 */

import { readiness, wellbeingSummary } from '@/engine/systems/life';
import type { Person, Wellbeing } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { isAre, outOf, spokenList } from './words';
import { GENRE_BY_ID, INTEREST_BY_ID } from '@/engine/content/interests';
import { PERSONALITY_TRAIT_BY_ID } from '@/engine/content/personality-traits';

/**
 * The eight, in the order a person would notice them.
 *
 * `behind` is what the way in says next to the figure. The figure alone —
 * "82/100" — names the dial twice and says nothing about what moves it, which
 * is the whole reason a person would open one.
 */
const DIALS = [
  { key: 'energy', name: 'Energy', unit: 'level', behind: 'what the day has left in you' },
  { key: 'stress', name: 'Stress', unit: 'level', behind: 'what it is doing to your sleep' },
  { key: 'sleepDebt', name: 'Sleep Debt', unit: 'hours', behind: 'the nights you still owe' },
  { key: 'morale', name: 'Morale', unit: 'level', behind: 'whether the work feels worth doing' },
  { key: 'condition', name: 'Condition', unit: 'level', behind: 'what a long day would find' },
  { key: 'fitness', name: 'Fitness', unit: 'level', behind: 'what a physical day would cost' },
  { key: 'nourishment', name: 'Nourishment', unit: 'level', behind: 'how long since you ate properly' },
  { key: 'hygiene', name: 'Hygiene', unit: 'level', behind: 'what a room notices about you' },
] as const;

type DialKey = typeof DIALS[number]['key'];

const dialOf = (key: string) => DIALS.find((d) => d.key === key);
const valueOf = (w: Wellbeing, key: DialKey): number => Number(w[key] ?? 0);

/** `personId/dial`, so a dial belongs to somebody rather than to the game. */
function splitDialId(id: string): { personId: string; key: string } | undefined {
  const cut = id.lastIndexOf('/');
  if (cut <= 0) return undefined;
  return { personId: id.slice(0, cut), key: id.slice(cut + 1) };
}

const personIn = (sim: Simulation, id: string): Person | undefined =>
  sim.universe.people[id];

// ---------------------------------------------------------------------------
// You
// ---------------------------------------------------------------------------

defineLook<Person>('person', {
  gone: 'They aren’t part of this story any more.',
  resolve: (sim, id) => personIn(sim, id || sim.universe.playerId),
  seeds: (sim) => [sim.universe.playerId],
  look: (person, { sim }) => {
    const isYou = person.id === sim.universe.playerId;
    const w = person.wellbeing;
    const ways: Way[] = DIALS
      .filter((d) => valueOf(w, d.key) !== undefined)
      .map((d) => ({
        to: at('dial', `${person.id}/${d.key}`),
        label: d.name,
        detail: d.unit === 'hours'
          ? `${Math.round(valueOf(w, d.key))} hours owed, and ${d.behind}`
          : `${outOf(valueOf(w, d.key))}, and ${d.behind}`,
      }));
    ways.push({
      to: at('readiness', person.id),
      label: 'Readiness',
      detail: 'What six of the eight come to, for turning up today',
    });
    if (isYou) {
      ways.push({
        to: at('plans'),
        label: 'Your Own Plans',
        detail: 'Everything you have put on the calendar yourself',
      });
    }
    // The life before this one, said back: the sentence the player wrote at
    // creation, or the one an older build wrote for somebody else. It carries
    // no number and decides nothing, and it is here so that a sentence
    // somebody authored is not written into the save and then never shown to
    // anybody again.
    const before = (person.background ?? '').trim();
    // What they care about and the films they love, said back for the same
    // reason. Nothing in the simulation reads either, so this is the one place
    // an answer given at creation is seen again.
    const cares = person.interests.map((id) => INTEREST_BY_ID[id]?.label).filter((one): one is string => !!one);
    const loves = (person.genres ?? []).map((id) => GENRE_BY_ID[id]?.label).filter((one): one is string => !!one);
    // The traits they picked, which unlike the rest of this do move the dials
    // below: the nights of a light sleeper and the stress of an even temper
    // are theirs.
    const traits = (person.personalityTraits ?? [])
      .map((id) => PERSONALITY_TRAIT_BY_ID[id]?.name).filter((one): one is string => !!one);
    const said = [
      traits.length > 0 && (
        <p key="traits" className="small">
          <span className="dim">{isYou ? 'Who you are. ' : 'Who they are. '}</span>
          {spokenList(traits)}.
        </p>
      ),
      before.length > 0 && (
        <p key="before" className="small">
          <span className="dim">{isYou ? 'Where you come from. ' : 'Where they come from. '}</span>
          {before}
        </p>
      ),
      cares.length > 0 && (
        <p key="cares" className="small">
          <span className="dim">{isYou ? 'What you care about. ' : 'What they care about. '}</span>
          {spokenList(cares)}.
        </p>
      ),
      loves.length > 0 && (
        <p key="loves" className="small">
          <span className="dim">{isYou ? 'The films you love. ' : 'The films they love. '}</span>
          {spokenList(loves)}.
        </p>
      ),
    ].filter(Boolean);

    return {
      name: isYou ? (person.displayName || person.firstName) : person.displayName,
      kind: isYou ? 'Yourself' : 'Somebody',
      summary: wellbeingSummary(person),
      body: said.length > 0 ? <>{said}</> : undefined,
      ways,
      provenance: isYou
        ? 'Eight dials, moved by the hours you keep and the person you are. Six of them the game has never shown you.'
        : 'The same eight dials you have, moved by the same days.',
    };
  },
});

// ---------------------------------------------------------------------------
// One of the eight
// ---------------------------------------------------------------------------

interface Dial { person: Person; key: DialKey; name: string; value: number; unit: string }

defineLook<Dial>('dial', {
  gone: 'That isn’t something the body keeps track of any more.',
  resolve: (sim, id) => {
    const split = splitDialId(id);
    if (!split) return undefined;
    const person = personIn(sim, split.personId);
    const dial = dialOf(split.key);
    if (!person || !dial) return undefined;
    return { person, key: dial.key, name: dial.name, value: valueOf(person.wellbeing, dial.key), unit: dial.unit };
  },
  seeds: (sim) => DIALS.map((d) => `${sim.universe.playerId}/${d.key}`),
  look: (dial) => ({
    name: dial.name,
    kind: 'One Of Eight',
    parent: at('person', dial.person.id),
    summary: sentenceFor(dial),
    provenance: dial.unit === 'hours'
      ? 'Counted in hours, and paid back by sleeping longer than you need to.'
      : 'Nought to a hundred, moved every hour the clock runs.',
  }),
});

/** What the number actually means, in the second person, right now. */
function sentenceFor(dial: Dial): string {
  const n = Math.round(dial.value);
  switch (dial.key) {
    case 'energy':
      return n > 75 ? `${n}, and you’ve a full day in you.`
        : n > 40 ? `${n}. Enough for what today asks, not much more.`
          : `${n}. You’re running down, and it shows in everything else.`;
    case 'stress':
      return n < 25 ? `${n}, and nothing is adding to it. That only starts when you’re running on empty.`
        : n < 60 ? `${n}. Present, manageable, and slower to clear than it was.`
          : `${n}. High enough that sleep is going badly and it feeds itself.`;
    case 'sleepDebt':
      return n < 2 ? 'None to speak of. You’re square with the nights you’ve had.'
        : n < 12 ? `${n} hours owed. One long night would clear it.`
          : `${n} hours owed. Everything is harder than it should be, and it will stay that way.`;
    case 'morale':
      return n > 70 ? `${n}. The work feels worth doing.`
        : n > 40 ? `${n}. Level. Neither carrying you nor dragging.`
          : `${n}. Flat — the work is fine, the feeling isn’t.`;
    case 'condition':
      return n > 70 ? `${n}. Sound, with no ache waiting to surface.`
        : `${n}. Something isn’t right, and long days will find it.`;
    case 'fitness':
      return n > 65 ? `${n}. You could do a physical day without paying for it after.`
        : `${n}. A stunt day would cost you a week.`;
    case 'nourishment':
      return n > 70 ? `${n}. Fed, and not thinking about it.`
        : `${n}. Hungry, and it’s starting to show.`;
    case 'hygiene':
      return n > 70 ? `${n}. Clean, rested-looking, ready to be seen.`
        : `${n}. A shower would put it back. Rooms notice.`;
    default:
      return `${n}.`;
  }
}

// ---------------------------------------------------------------------------
// Readiness — a figure, not a dial
// ---------------------------------------------------------------------------

interface Ready { person: Person; value: number; drags: { key: DialKey; name: string; value: number }[] }

/** The dials pulling readiness down hardest, worst first. */
function dragsOn(w: Wellbeing): { key: DialKey; name: string; value: number }[] {
  const cost: { key: DialKey; name: string; value: number; hurt: number }[] = [
    { key: 'energy', name: 'Energy', value: w.energy, hurt: 100 - w.energy },
    { key: 'stress', name: 'Stress', value: w.stress, hurt: w.stress },
    { key: 'sleepDebt', name: 'Sleep Debt', value: w.sleepDebt, hurt: Math.min(100, w.sleepDebt * 3.3) },
    { key: 'nourishment', name: 'Nourishment', value: w.nourishment, hurt: 100 - w.nourishment },
    { key: 'morale', name: 'Morale', value: w.morale, hurt: 100 - w.morale },
    { key: 'hygiene', name: 'Hygiene', value: w.hygiene ?? 80, hurt: 100 - (w.hygiene ?? 80) },
  ];
  return cost.filter((c) => c.hurt > 12).sort((a, b) => b.hurt - a.hurt).slice(0, 3)
    .map(({ key, name, value }) => ({ key, name, value }));
}

defineLook<Ready>('readiness', {
  gone: 'There’s nobody here to be ready.',
  resolve: (sim, id) => {
    const person = personIn(sim, id || sim.universe.playerId);
    if (!person) return undefined;
    return { person, value: readiness(person), drags: dragsOn(person.wellbeing) };
  },
  seeds: (sim) => [sim.universe.playerId],
  look: (ready) => ({
    name: 'Readiness',
    kind: 'How Well You Would Do Today',
    parent: at('person', ready.person.id),
    summary: ready.drags.length === 0
      ? `${Math.round(ready.value)}, and nothing is holding you back. This is as good as a day gets.`
      : `${Math.round(ready.value)}, and ${spokenList(ready.drags.map((d) => d.name.toLowerCase()))} ${isAre(ready.drags.length)} what’s costing you.`,
    ways: ready.drags.map((d) => ({
      to: at('dial', `${ready.person.id}/${d.key}`),
      label: d.name,
      detail: `At ${Math.round(d.value)}, and pulling on the rest`,
    })),
    provenance: 'Six of the eight, multiplied together. It isn’t stored anywhere — it’s what they come to.',
  }),
});
