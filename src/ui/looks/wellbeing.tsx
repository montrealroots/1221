/**
 * SLATE — you, and the eight dials the day moves.
 *
 * Home shows two of them under a readiness figure. The other six, sleep debt,
 * morale, condition, fitness, nourishment and hygiene, appeared on no screen
 * until this page, which said so to the player long after it was showing them.
 * This is exposure, not invention — every sentence below is
 * `person.wellbeing`, read out.
 *
 * Travel fatigue was a ninth until the sweep that took it out. Nothing in this
 * build ever raised it, so it sat at nought for a whole life and its term in
 * readiness was a fixed 1.0; a dial a player is invited to watch has to be able
 * to move.
 *
 * Readiness is the exception and is treated as one. It is a product of seven
 * of the eight, six until condition joined them, and it is not stored
 * anywhere. It opens into a sentence about what
 * is holding it back and ways into the dials actually doing the holding,
 * because a dial is a thing and a multiplication is not.
 */

import {
  A_NORMAL_DAYS_DEBT, EVERYDAY_FITNESS, mendsTo, moraleSettlesAt, readiness, wellbeingSummary, workoutCosts,
} from '@/engine/systems/life';
import type { Person, Wellbeing } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { isAre, outOf, spokenList } from './words';
import { GENRE_BY_ID, INTEREST_BY_ID } from '@/engine/content/interests';
import { BEFORE_ACTING_BY_ID } from '@/engine/content/backgrounds';
import { PERSONALITY_TRAIT_BY_ID } from '@/engine/content/personality-traits';

/**
 * The eight, in the order a person would notice them.
 *
 * `behind` is what the way in says next to the figure. The figure alone —
 * "82/100" — names the dial twice and says nothing about what moves it, which
 * is the whole reason a person would open one. Each names what the dial
 * decides, and the engine does what it names: morale said "whether the work
 * feels worth doing", condition "what a long day would find" and fitness
 * "what a physical day would cost" while nothing read any of the three.
 */
const DIALS = [
  { key: 'energy', name: 'Energy', unit: 'level', behind: 'what the day has left in you' },
  { key: 'stress', name: 'Stress', unit: 'level', behind: 'what it is doing to your sleep' },
  { key: 'sleepDebt', name: 'Sleep Debt', unit: 'hours', behind: 'what sleep pays back' },
  { key: 'morale', name: 'Morale', unit: 'level', behind: 'how much of the day’s stress a night clears' },
  { key: 'condition', name: 'Condition', unit: 'level', behind: 'how much a night puts back, and your mood' },
  { key: 'fitness', name: 'Fitness', unit: 'level', behind: 'how far rest can mend you, and what a workout costs' },
  { key: 'nourishment', name: 'Nourishment', unit: 'level', behind: 'how long since you ate properly' },
  { key: 'hygiene', name: 'Hygiene', unit: 'level', behind: 'your mood once it’s low, and readiness a little' },
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
          ? `${Math.round(valueOf(w, d.key))} hours on the books, and ${d.behind}`
          : `${outOf(valueOf(w, d.key))}, and ${d.behind}`,
      }));
    ways.push({
      to: at('readiness', person.id),
      label: 'Readiness',
      detail: 'What seven of the eight come to, and what a workout builds',
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
    // What they did before acting, which set the fitness they started with.
    // A save from before the question was asked has none, and says nothing.
    const work = BEFORE_ACTING_BY_ID[person.beforeActing ?? '']?.label;
    // What they care about and the films they love, said back for the same
    // reason. Nothing in the simulation read either until the interests were
    // let change how much an hour of looking after yourself gives the mood
    // (`systems/enjoyment.ts`); the genres are still read by nothing.
    const cares = person.interests.map((id) => INTEREST_BY_ID[id]?.label).filter((one): one is string => !!one);
    const loves = (person.genres ?? []).map((id) => GENRE_BY_ID[id]?.label).filter((one): one is string => !!one);
    // The traits they picked. Most of them, unlike the rest of this, move the
    // dials below: the nights of a light sleeper and the stress of an even
    // temper are theirs. Three of the money traits move what food costs, and
    // Keeps Accounts is only said back.
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
      work && (
        <p key="work" className="small">
          <span className="dim">Before acting. </span>
          {work}.
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
        ? 'Eight dials, moved by the hours you keep, the work you do, what you can afford and the person you are. Home shows two of them; all eight are here.'
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
  look: (dial, { sim }) => ({
    name: dial.name,
    kind: 'One Of Eight',
    parent: at('person', dial.person.id),
    summary: sentenceFor(dial, sim.now),
    provenance: dial.unit === 'hours'
      ? 'Counted in hours: a waking hour adds a third of one, and a night pays it back, a long one faster. A night under six hours adds some too, and the shortest add more than they pay back.'
      : 'Nought to a hundred, moved every hour the clock runs.',
  }),
});

/**
 * What the number actually means, in the second person, right now.
 *
 * Where a dial decides something, the sentence says what, with the engine’s
 * own figure: condition, fitness, morale and hygiene read what the night, a
 * workout and the mood are actually given. They said "long days will find
 * it", "A stunt day would cost you a week" and "Rooms notice" when nothing
 * did any of it.
 */
function sentenceFor(dial: Dial, now: number): string {
  const n = Math.round(dial.value);
  const w = dial.person.wellbeing;
  switch (dial.key) {
    case 'energy':
      return n > 75 ? `${n}, and you’ve a full day in you.`
        : n > 40 ? `${n}. Enough for what today asks, not much more.`
          : `${n}. You’re running down, and it shows in everything else.`;
    case 'stress':
      return n < 25 ? `${n}, and not much is adding to it. A shift adds some, and so do running on empty, money trouble and a night on a sofa.`
        : n < 60 ? `${n}. Present, manageable, and slower to clear than it was.`
          : `${n}. High enough that sleep is going badly and it feeds itself.`;
    case 'sleepDebt':
      // A day awake puts debt on the books as it goes, 5.4 hours by eleven
      // after a day up from seven, and a night pays it back. Counted as owed,
      // this said "5 hours owed. One long night would clear it." while the
      // Sleep dialog offered the same evening a normal eight hours. It is the
      // day’s only when they woke owing next to nothing: in the morning after
      // a short night, the same five hours are what the night left.
      return n < 2 ? 'None to speak of. You’re square with the nights you’ve had.'
        : (dial.person.wokeWithDebt ?? dial.value) < 2 && dial.value < A_NORMAL_DAYS_DEBT + 2
          ? `${n} hours, about what a day awake puts on the books. A night pays it back.`
          : n < 12 ? `${n} hours owed. One long night would clear it.`
            : `${n} hours owed. Everything is harder than it should be, and it will stay that way.`;
    case 'morale': {
      // Even at 62.5, where a night clears its usual share of stress.
      const settles = Math.round(moraleSettlesAt(dial.person, w.condition, now));
      const mood = n > 70 ? 'The day feels worth it' : n > 40 ? 'Level' : 'Flat';
      return `${n}. ${mood}, and the nights bring it back toward ${settles}. `
        + (n >= 63 ? 'Up like this, a night clears more of the day’s stress than usual.'
          : 'Down like this, a night clears less of the day’s stress than usual.');
    }
    case 'condition': {
      const mends = Math.round(mendsTo(dial.person, now));
      const share = Math.round(100 * (0.8 + 0.2 * Math.min(1, w.condition / mendsTo(dial.person, now))));
      return n >= mends ? `${n}, as sound as your fitness lets rest make you. A night puts all of itself back.`
        : `${n}, under the ${mends} your fitness lets rest mend you to. A night puts back ${share}% of what it would.`;
    }
    case 'fitness': {
      const mends = Math.round(mendsTo(dial.person, now));
      const costs = Math.round(workoutCosts(dial.person));
      return `${n}. Rest can mend you to ${mends}, and a workout costs ${costs} energy.`
        + (dial.value <= EVERYDAY_FITNESS ? ' This is what an everyday life keeps without training.' : '');
    }
    case 'nourishment':
      return n > 70 ? `${n}. Fed, and not thinking about it.`
        : n >= 20 ? `${n}. Getting hungry. Under twenty it costs condition and mood by the hour.`
          : `${n}. Hungry, and it’s costing condition and mood by the hour.`;
    case 'hygiene':
      return n >= 50 ? `${n}. Clean enough that it isn’t wearing on you.`
        : `${n}. Under fifty it wears on your mood by the hour. A shower puts it back.`;
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
    { key: 'condition', name: 'Condition', value: w.condition, hurt: 100 - w.condition },
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
    provenance: 'Seven of the eight, multiplied together, and fitness through condition. It isn’t stored anywhere — it’s what they come to, and it sets what a workout builds.',
  }),
});
