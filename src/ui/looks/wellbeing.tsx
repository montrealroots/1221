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
  A_NORMAL_DAYS_DEBT, EVERYDAY_FITNESS, mendsTo, moraleSettlesAt, readiness, readinessParts, wellbeingSummary, workoutCosts,
} from '@/engine/systems/life';
import type { Person, Wellbeing } from '@/engine/domain/model';
import { ESTIMATE as SCHOOL_ESTIMATE } from '@/engine/systems/school';
import type { Simulation } from '@/engine';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { isAre, outOf, spokenList } from './words';
import { GENRE_BY_ID, INTEREST_BY_ID } from '@/engine/content/interests';
import { KNOB_READS, PERSONALITY_TRAIT_BY_ID, type PersonalityKnob } from '@/engine/content/personality-traits';
import { personalityOf } from '@/engine/systems/personality';
import { CONDITION_LABEL, type Condition } from '@/engine/systems/health';
import { CHRONIC } from '@/engine/content/safetynet';
import { ageWords, ceilingAt } from '@/engine/content/lifespan';
import { describeEthnicity } from '@/engine/content/ethnicity';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import { bmiOf, bmiWord, type Body } from '@/engine/systems/body';
import { injuryOf } from '@/engine/systems/injury';
import { formatDate } from '@/engine/core/time';
import { INJURY_KIND } from '@/engine/content/injury';

/** A body in words: its height and weight, in feet and pounds or centimeters and kilograms, and its body mass index. */
function bodyWords(body: Body, imperial: boolean): string {
  const bmi = bmiOf(body);
  if (imperial) {
    const inches = Math.round(body.heightCm / 2.54);
    return `${Math.floor(inches / 12)} ft ${inches % 12} in and ${Math.round(body.weightKg / 0.45359237)} lb, a body mass index of ${bmi.toFixed(1)}: ${bmiWord(bmi).toLowerCase()}`;
  }
  return `${Math.round(body.heightCm)} cm and ${body.weightKg.toFixed(1)} kg, a body mass index of ${bmi.toFixed(1)}: ${bmiWord(bmi).toLowerCase()}`;
}

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
  { key: 'condition', name: 'Condition', unit: 'level', behind: 'how much a night puts back, your mood, a sick day, and how likely a year is to be your last' },
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
      detail: 'What seven of the eight come to: your chance at an audition, and what a class, a day’s work or a workout builds',
    });
    // The traits held and the conditions carried, each opening into what it does (from 2026-10-09: until then the
    // traits were a sentence here and the conditions a row on Papers, and neither said what it moved).
    for (const id of person.personalityTraits ?? []) {
      const t = PERSONALITY_TRAIT_BY_ID[id];
      if (t) ways.push({ to: at('trait', id), label: t.name, detail: t.description });
    }
    for (const c of Object.keys(person.health?.chronic ?? {}) as Condition[]) {
      ways.push({ to: at('condition', c), label: CONDITION_LABEL[c], detail: person.health!.chronic![c]!.treated ? 'Kept up, at what the plan leaves' : 'Left alone, and what that does' });
    }
    if (injuryOf(person, sim.now)) ways.push({ to: at('condition', 'injury'), label: 'An Injury', detail: 'What it is, till when, and what it keeps you from' });
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
    // What they did before acting was said here until 2026-09-26, when the
    // question went with the job engine.
    // What they care about and the films they love, said back for the same
    // reason. Nothing in the simulation read either until the interests were
    // let change how much an hour of looking after yourself gives the mood
    // (`systems/enjoyment.ts`), and since 2026-09-27 the same file reads the
    // genres, and the interests again, for what a day of work gives.
    const cares = person.interests.map((id) => INTEREST_BY_ID[id]?.label).filter((one): one is string => !!one);
    const loves = (person.genres ?? []).map((id) => GENRE_BY_ID[id]?.label).filter((one): one is string => !!one);
    // The traits they picked. Most of them, unlike the rest of this, move the
    // dials below: the nights of a light sleeper and the stress of an even
    // temper are theirs. Three of the money traits move what food costs, and
    // Keeps Accounts, only said back until 2026-09-27, what a return deducts.
    const traits = (person.personalityTraits ?? [])
      .map((id) => PERSONALITY_TRAIT_BY_ID[id]?.name).filter((one): one is string => !!one);
    const said = [
      traits.length > 0 && (
        <p key="traits" className="small">
          <span className="dim">{isYou ? 'Who you are. ' : 'Who they are. '}</span>
          {spokenList(traits)}.
        </p>
      ),
      // Their pronouns and their citizenship, as creation took them: the citizenship is the country of birth’s.
      // Their height and weight, in the units of where they live, and what the weight comes to.
      person.body && (
        <p key="body" className="small">
          <span className="dim">{isYou ? 'Your body. ' : 'Their body. '}</span>
          {bodyWords(person.body, CITIES.get(person.currentLocationId)?.countryId === 'us')}.
        </p>
      ),
      // An injury mending, and whether it keeps them off work (`systems/injury.ts`).
      (() => {
        const hurt = injuryOf(person, sim.now);
        return hurt ? (
          <p key="hurt" className="small">
            <span className="dim">Mending. </span>
            {INJURY_KIND[hurt.kind].label}, till {formatDate(hurt.until, sim.zone)}{hurt.offWorkUntil ? ', and off work till then' : ''}{hurt.atWork ? ', on workers’ compensation' : ''}.
          </p>
        ) : null;
      })(),
      <p key="papers" className="small">
        <span className="dim">{isYou ? 'On your papers. ' : 'On their papers. '}</span>
        {person.pronouns}, a citizen of {COUNTRIES.get(person.citizenshipId)?.name ?? person.citizenshipId}.
      </p>,
      // Who they are in their own terms, as creation took it, and nothing more: it moves nothing.
      (person.raceEthnicity?.length ?? 0) > 0 && (
        <p key="identity" className="small">
          <span className="dim">{isYou ? 'In your own terms. ' : 'In their own terms. '}</span>
          {describeEthnicity(person.raceEthnicity!, person.raceEthnicityOwn)}.
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
      return n < 25 ? `${n}, and not much is adding to it. Running on empty adds to it, and so do money trouble and a night on a sofa.`
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
      // What the dial decides, and the midnight pull toward the same mark.
      const also = `${dial.person.school && n < SCHOOL_ESTIMATE.sickBelow ? ` Under ${SCHOOL_ESTIMATE.sickBelow}, a day off classes called in sick is excused.` : ''} The lower it is, the likelier a year is to be your last.`;
      return n >= mends ? `${n}, as sound as your fitness lets rest make you. Each midnight settles it back toward ${mends} if it’s over.${also}`
        : `${n}, under the ${mends} your fitness lets rest mend you to. A night puts back ${share}% of the energy it would, and each midnight settles it a little toward ${mends}.${also}`;
    }
    case 'fitness': {
      const mends = Math.round(mendsTo(dial.person, now));
      const costs = Math.round(workoutCosts(dial.person));
      // The age’s ceiling, which training can’t pass, and what the years are like now.
      const age = (now - dial.person.birthInstant) / (365.2425 * 86_400_000);
      return `${n}. Rest can mend you to ${mends}, and a workout costs ${costs} energy.`
        + (dial.value <= EVERYDAY_FITNESS ? ' This is what an everyday life keeps without training.' : '')
        + ` At ${Math.floor(age)}, the most a body can be trained to is ${Math.round(ceilingAt(age).fitness)}. ${ageWords(age)}`;
    }
    case 'nourishment':
      // With the day’s meals: at least 76 each morning when the food is paid for, 40 when it can’t be.
      return (n > 70 ? `${n}. Fed, and not thinking about it.`
        : n >= 20 ? `${n}. Getting hungry. Under twenty it costs condition and mood by the hour.`
          : `${n}. Hungry, and it’s costing condition and mood by the hour.`)
        + ' Each morning the day’s meals take it to 76 at least, or to 40 on a day the food can’t be paid for.';
    case 'hygiene':
      return (n >= 50 ? `${n}. Clean enough that it isn’t wearing on you.`
        : `${n}. Under fifty it wears on your mood by the hour. A shower puts it back.`)
        + ' The morning’s shower takes it to 82 at least.';
    default:
      return `${n}.`;
  }
}

// ---------------------------------------------------------------------------
// Readiness — a figure, not a dial
// ---------------------------------------------------------------------------

interface Ready { person: Person; value: number; drags: { key: DialKey; name: string; value: number }[] }

/** The dials pulling readiness down hardest, worst first, by what each takes off it: a dial costing more than a twentieth of it. */
function dragsOn(person: Person): { key: DialKey; name: string; value: number }[] {
  const w = person.wellbeing;
  return readinessParts(person)
    .map((part) => ({ key: part.key as DialKey, name: DIALS.find((d) => d.key === part.key)!.name, value: part.key === 'hygiene' ? w.hygiene ?? 80 : w[part.key], hurt: 1 - part.factor / part.best }))
    .filter((c) => c.hurt > 0.05).sort((a, b) => b.hurt - a.hurt).slice(0, 3)
    .map(({ key, name, value }) => ({ key, name, value }));
}

defineLook<Ready>('readiness', {
  gone: 'There’s nobody here to be ready.',
  resolve: (sim, id) => {
    const person = personIn(sim, id || sim.universe.playerId);
    if (!person) return undefined;
    return { person, value: readiness(person), drags: dragsOn(person) };
  },
  seeds: (sim) => [sim.universe.playerId],
  look: (ready) => ({
    name: 'Readiness',
    kind: 'How Well You Would Do Today',
    parent: at('person', ready.person.id),
    summary: ready.drags.length === 0
      ? `${Math.round(ready.value)}, and nothing is holding you back much.${ready.value >= 99.5 ? ' This is as good as a day gets.' : ''}`
      : `${Math.round(ready.value)}, and ${spokenList(ready.drags.map((d) => d.name.toLowerCase()))} ${isAre(ready.drags.length)} what’s costing you.`,
    ways: ready.drags.map((d) => ({
      to: at('dial', `${ready.person.id}/${d.key}`),
      label: d.name,
      detail: `At ${Math.round(d.value)}, and pulling on the rest`,
    })),
    provenance: 'Seven of the eight multiplied, fitness through condition, and stored nowhere. It sets the chance of booking an audition and what a class, a lab, a day’s work or a workout builds.',
  }),
});

// ---------------------------------------------------------------------------
// A trait, and a condition carried (from the connected world of 2026-10-09)
// ---------------------------------------------------------------------------

interface HeldTrait { person: Person; id: string }

defineLook<HeldTrait>('trait', {
  gone: 'There’s no such trait.',
  resolve: (sim, id) => (PERSONALITY_TRAIT_BY_ID[id] ? { person: sim.player, id } : undefined),
  seeds: (sim) => [...(sim.player.personalityTraits ?? [])],
  look: ({ person, id }) => {
    const t = PERSONALITY_TRAIT_BY_ID[id]!;
    const held = (person.personalityTraits ?? []).includes(id);
    const mods = Object.entries(t.systemMods ?? {}) as [PersonalityKnob, number][];
    const times = (x: number) => `${x >= 1 ? '+' : '−'}${Math.round(Math.abs(x - 1) * 100)}%`;
    return {
      name: t.name,
      kind: held ? 'A Trait You Hold' : 'A Trait',
      summary: t.description,
      parent: at('person', person.id),
      body: (
        <div className="col gap-2">
          {mods.length > 0 ? (
            <table>
              <tbody>
                {mods.map(([knob, x]) => (
                  <tr key={knob}>
                    <td className="small">{KNOB_READS[knob]}</td>
                    <td className="num mono">{times(x)}</td>
                    {held && <td className="num mono dim">{times(personalityOf(person, knob))} with all you are</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="small">It moves nothing SLATE draws: it says who you are.</p>
          )}
          <p className="small"><span className="dim">Its cost. </span>{t.cost}</p>
        </div>
      ),
      ways: [{ to: at('readiness', person.id), label: 'Readiness', detail: 'What the dials it moves come to' }],
      provenance: 'Each figure is the trait’s own; “with all you are” is every trait and disposition you hold together, held inside its limits (`KNOB_LIMITS`).',
    };
  },
});

interface Carried { person: Person; key: Condition | 'injury' }

/** What a condition left alone does, by the week, in the dials' words (`CHRONIC.untreated`). */
function leftAlone(c: Condition): string {
  const u = CHRONIC.untreated;
  if (c === 'depression') return `Left alone, it takes ${u.moraleAWeek} morale a week.`;
  if (c === 'asthma') return `Left alone, it makes an emergency ${u.asthmaEmergencies} times likelier.`;
  if (c === 'diabetes') return `Left alone, type 1 makes an emergency ${u.diabetesEmergencies} times likelier, and either type takes ${u.diabetesConditionAWeek} condition a week.`;
  if (c === 'arthritis') return `Left alone, it takes ${u.arthritisEnergyAWeek} energy a week.`;
  return 'Left alone, SLATE draws nothing more from it than the care it goes without.';
}

defineLook<Carried>('condition', {
  gone: 'You don’t carry that now.',
  resolve: (sim, id) => {
    const person = sim.player;
    if (id === 'injury') return injuryOf(person, sim.now) ? { person, key: 'injury' } : undefined;
    return person.health?.chronic?.[id as Condition] ? { person, key: id as Condition } : undefined;
  },
  seeds: (sim) => [...Object.keys(sim.player.health?.chronic ?? {}), ...(injuryOf(sim.player, sim.now) ? ['injury'] : [])],
  look: ({ person, key }, { sim }) => {
    if (key === 'injury') {
      const hurt = injuryOf(person, sim.now)!;
      return {
        name: INJURY_KIND[hurt.kind].label,
        kind: 'An Injury',
        summary: `It mends by ${formatDate(hurt.until, sim.zone)}${hurt.offWorkUntil ? ', and keeps you off work and training till then' : ''}.`,
        parent: at('person', person.id),
        ways: [{ to: at('dial', `${person.id}/condition`), label: 'Condition', detail: 'What a body is fit for, which an injury takes from' }],
        provenance: 'How long it takes is the injury’s own, longer for somebody an illness hits harder (`illnessToll`).',
      };
    }
    const state = person.health!.chronic![key]!;
    const dial = key === 'depression' ? 'morale' : key === 'diabetes' ? 'condition' : key === 'arthritis' ? 'energy' : undefined;
    return {
      name: CONDITION_LABEL[key] + (key === 'diabetes' ? (state.typeOne ? ', Type 1' : ', Type 2') : ''),
      kind: 'A Condition You Carry',
      summary: state.treated
        ? (state.lapsed ? 'You keep it up, but this month’s care went unpaid, so it’s been left alone till next month.' : 'You keep it up: its care is paid each month at what your plan leaves.')
        : 'You leave it alone, which costs nothing and does what’s below.',
      parent: at('person', person.id),
      body: <p className="small">{leftAlone(key)} Kept up, it does none of that. Papers keeps it up or lets it go.</p>,
      ways: dial ? [{ to: at('dial', `${person.id}/${dial}`), label: dial[0]!.toUpperCase() + dial.slice(1), detail: 'The dial it takes from, left alone' }] : [],
      provenance: `Drawn once at the start of a life, at a young adult’s rates. Source: ${CHRONIC.source}.`,
    };
  },
});
