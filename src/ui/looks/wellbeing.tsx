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
  A_NORMAL_DAYS_DEBT, EMPTY, EVERYDAY_FITNESS, FITNESS, OVERWROUGHT, mendsTo, moraleSettlesAt, readiness, readinessParts, wellbeingSummary, workoutCosts,
} from '@/engine/systems/life';
import { EVALUATION } from '@/engine/content/tasks';
import { theCountry } from '@/engine/systems/documents';
import { plural } from '@/engine/core/text';
import type { Person, Wellbeing } from '@/engine/domain/model';
import { ESTIMATE as SCHOOL_ESTIMATE, schoolEnded } from '@/engine/systems/school';
import type { Simulation } from '@/engine';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { isAre, outOf, spokenList } from './words';
import { GENRE_BY_ID } from '@/engine/content/film-genres';
import { KNOB_READS, PERSONALITY_TRAIT_BY_ID, type PersonalityKnob } from '@/engine/content/personality-traits';
import { personalityOf } from '@/engine/systems/personality';
import { CONDITION_LABEL, type Condition } from '@/engine/systems/health';
import { CHRONIC } from '@/engine/content/safetynet';
import { ageWords, ceilingAt } from '@/engine/content/lifespan';
import { describeEthnicity } from '@/engine/content/ethnicity';
import { COUNTRIES } from '@/engine/content/geography';
import { bmiOf, bmiWord, bodyUnits, type Body } from '@/engine/systems/body';
import { injuryOf } from '@/engine/systems/injury';
import { formatDate } from '@/engine/core/time';
import { INJURY_KIND } from '@/engine/content/injury';
import { ONSET } from '@/engine/content/body';

/**
 * A body in words: its height and weight, in feet and pounds or centimeters and kilograms, and its body mass index in
 * the WHO’s range. Until 2026-10-17 (brief 14) the range was tacked on after a colon, "a body mass index of 22.5:
 * healthy weight".
 */
function bodyWords(body: Body, imperial: boolean): string {
  const bmi = bmiOf(body);
  const index = `with a body mass index of ${bmi.toFixed(1)}, in the ${bmiWord(bmi).toLowerCase()} range`;
  if (imperial) {
    const inches = Math.round(body.heightCm / 2.54);
    return `${Math.floor(inches / 12)} ft ${inches % 12} in and ${Math.round(body.weightKg / 0.45359237)} lb, ${index}`;
  }
  return `${Math.round(body.heightCm)} cm and ${body.weightKg.toFixed(1)} kg, ${index}`;
}

/** The words somebody is spoken of in: "you" for the player, and anybody else in their own pronouns. */
interface Spoken { they: string; them: string; their: string; are: string; s: (verb: string) => string }

/**
 * The player is "you". Anybody else is spoken of in the pronouns on their papers: she/her and he/him in the singular,
 * and they/them, or pronouns SLATE doesn’t know, as "they" (from 2026-10-15). Until then the person look, the trait
 * look and the condition look said "they" of everybody but the player, so a she/her person read "Their body." above
 * "On their papers. she/her": changing her pronouns changed only that line.
 */
function spokenOf(person: Person, isYou: boolean): Spoken {
  const third = (v: string) => (/[^aeiou]y$/.test(v) ? `${v.slice(0, -1)}ies` : `${v}s`);
  if (isYou) return { they: 'you', them: 'you', their: 'your', are: 'are', s: (v) => v };
  if (/^\s*she\b/i.test(person.pronouns ?? '')) return { they: 'she', them: 'her', their: 'her', are: 'is', s: third };
  if (/^\s*he\b/i.test(person.pronouns ?? '')) return { they: 'he', them: 'him', their: 'his', are: 'is', s: third };
  return { they: 'they', them: 'them', their: 'their', are: 'are', s: (v) => v };
}
const upper = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

/**
 * The eight, in the order a person would notice them.
 *
 * `behind` is what the way in says next to the figure. The figure alone —
 * "82/100" — names the dial twice and says nothing about what moves it, which
 * is the whole reason a person would open one. Each names what the dial
 * decides, and the engine does what it names: morale said "whether the work
 * feels worth doing", condition "what a long day would find" and fitness
 * "what a physical day would cost" while nothing read any of the three.
 * It is said of whoever the dials belong to (from 2026-10-15: until then
 * another person’s look said "what the day has left in you" of them).
 *
 * From 2026-10-17 (brief 14) `behind` says what the measure is before what it
 * decides, in sentences: until then it was a clause after the figure, "82/100,
 * and how far rest can mend you, and what a workout costs", which named what
 * fitness decided and never what fitness was. `what` is the player’s own
 * explanation, the body of the measure’s look, and the place the game says
 * plainly that energy, condition, fitness (the Player Profile’s Stamina) and
 * health are four things.
 */
const DIALS = [
  { key: 'energy', name: 'Energy', unit: 'level', behind: (p: Spoken) => `What’s left in ${p.them} for today. Sleep brings it back` },
  { key: 'stress', name: 'Stress', unit: 'level', behind: (p: Spoken) => `How wound up ${p.they} ${p.are}. High stress spoils ${p.their} sleep` },
  { key: 'sleepDebt', name: 'Sleep Debt', unit: 'hours', behind: (p: Spoken) => `Sleep ${p.they} ${p.s('owe')}, which a night pays back` },
  { key: 'morale', name: 'Morale', unit: 'level', behind: (p: Spoken) => `${upper(p.their)} mood. When it’s up, a night clears more of the day’s stress` },
  { key: 'condition', name: 'Condition', unit: 'level', behind: (p: Spoken) => `How sound ${p.their} body is. It sets how much a night gives back, ${p.their} mood, sick days, and how likely each year is to be ${p.their} last` },
  { key: 'fitness', name: 'Fitness', unit: 'level', behind: (p: Spoken) => `How trained ${p.their} body is${p.they === 'you' ? ', the Stamina on your Player Profile' : ''}. It sets how far rest can mend ${p.them} and what a workout costs` },
  { key: 'nourishment', name: 'Nourishment', unit: 'level', behind: (p: Spoken) => `How well fed ${p.they} ${p.are}. A meal puts it back` },
  { key: 'hygiene', name: 'Hygiene', unit: 'level', behind: (p: Spoken) => `How clean ${p.they} ${p.are}. When it’s low, it drags on ${p.their} mood, and on readiness a little` },
] as const;

/** What each measure is, said to the player on its own look (from 2026-10-17, brief 14). */
const WHAT: Record<DialKey, string> = {
  energy: 'Energy is what you have left for today. It runs down every hour you’re awake, faster when you owe sleep. Only sleep brings it back: a meal doesn’t. Your stamina is something else: how long you can keep going in a long scene or a night on stage. So is your condition: how sound your body is.',
  stress: `Stress is how wound up you are. It eases while you have energy left and climbs once you run out, and money you owe adds to it every day. Over ${OVERWROUGHT}, it wears your condition down every hour.`,
  sleepDebt: 'Sleep debt is the sleep you owe. Every waking hour adds a little, and a night’s sleep pays it back. The more you owe, the faster your energy runs down and the less a night gives back.',
  morale: 'Morale is your mood. Meals, workouts, unwinding and good nights lift it. Hunger, grime, money trouble and an injury pull it down.',
  condition: 'Condition is how sound your body is, after illness, hunger, stress and short nights. A good night’s rest mends it, as far as your fitness allows. Energy is about today, and condition changes more slowly. Your health is a separate thing again: a long-term condition such as asthma, your health cover and your medical care are on Papers, under Health Cover.',
  fitness: `Fitness is how trained your body is, and it’s the same figure as Stamina on your Player Profile: how long you can keep going in a long scene or a night on stage before you tire. Working out builds it. It holds for ${plural(FITNESS.heldDays, 'day')} after a workout, then slowly falls. Rest doesn’t build it: rest brings back energy and condition.`,
  nourishment: 'Nourishment is how well fed you are. It falls every hour you’re awake, and a meal puts it back.',
  hygiene: 'Hygiene is how clean you are. It falls through the day, and a shower puts it back.',
};

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
    const p = spokenOf(person, isYou);
    const ways: Way[] = DIALS
      .filter((d) => valueOf(w, d.key) !== undefined)
      .map((d) => ({
        to: at('dial', `${person.id}/${d.key}`),
        label: d.name,
        // The hours in the plural only when there are more than one (from 2026-10-17: until then "1 hours on the books").
        detail: d.unit === 'hours'
          ? `${plural(Math.round(valueOf(w, d.key)), 'hour')}. ${(d.behind as (who: Spoken) => string)(p)}.`
          : `${outOf(valueOf(w, d.key))}. ${(d.behind as (who: Spoken) => string)(p)}.`,
      }));
    ways.push({
      to: at('readiness', person.id),
      label: 'Readiness',
      // What reads it now (from 2026-10-12): until then this named an audition and a day’s work, which went with the
      // career on 2026-10-09.
      detail: `How ready ${p.they} ${p.are} today, from all of these but fitness. It sets what a class, a lab, a rehearsal, an hour of practice or a workout builds, and how judged work goes.`,
    });
    // The traits held and the conditions carried, each opening into what it does (from 2026-10-09: until then the
    // traits were a sentence here and the conditions a row on Papers, and neither said what it moved).
    for (const id of person.personalityTraits ?? []) {
      const t = PERSONALITY_TRAIT_BY_ID[id];
      // Another person’s trait names them in its id, as a dial’s does; the player’s stays the trait’s own.
      if (t) ways.push({ to: at('trait', isYou ? id : `${person.id}/${id}`), label: t.name, detail: t.description });
    }
    // A condition another person carries names them in its id, as their trait does (from 2026-10-14).
    for (const c of Object.keys(person.health?.chronic ?? {}) as Condition[]) {
      ways.push({ to: at('condition', isYou ? c : `${person.id}/${c}`), label: CONDITION_LABEL[c], detail: person.health!.chronic![c]!.treated ? `Kept up, at what ${p.their} plan doesn’t cover.` : 'Left untreated, and what that does.' });
    }
    if (injuryOf(person, sim.now)) ways.push({ to: at('condition', isYou ? 'injury' : `${person.id}/injury`), label: 'An Injury', detail: `What it is, when it mends, and what it keeps ${p.them} from.` });
    if (isYou) {
      ways.push({
        to: at('plans'),
        label: 'Your Own Plans',
        detail: 'Everything you’ve put on the calendar yourself.',
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
    // The films they love, said back for the same reason; `systems/enjoyment.ts` reads them for what a rehearsal or a
    // night of a play gives, and read them for a day of work until the career went on 2026-10-09. What they cared
    // about was said here too until 2026-10-10, when the owner removed the interests.
    const loves = (person.genres ?? []).map((id) => GENRE_BY_ID[id]?.label).filter((one): one is string => !!one);
    // The traits they picked. Most of them, unlike the rest of this, move the
    // dials below: the nights of a light sleeper and the stress of an even
    // temper are theirs. Three of the money traits move what food costs, and
    // Keeps Accounts how a slight cuts; it moved what a return deducts from
    // 2026-09-27 until 2026-10-14, when that knob (`receipts`) went.
    const traits = (person.personalityTraits ?? [])
      .map((id) => PERSONALITY_TRAIT_BY_ID[id]?.name).filter((one): one is string => !!one);
    const said = [
      traits.length > 0 && (
        <p key="traits" className="small">
          <span className="dim">{`Who ${p.they} ${p.are}. `}</span>
          {spokenList(traits)}.
        </p>
      ),
      // Their pronouns and their citizenship, as creation took them: the citizenship is the country of birth’s.
      // Their height and weight, in the units of where they live, and what the weight comes to; and which units, and why
      // (`bodyUnits`, the rule creation’s Your Body reads too, from 2026-10-14: until then the units went unsaid). Each line is
      // said in their own pronouns (`spokenOf`, from 2026-10-15).
      person.body && (
        <p key="body" className="small">
          <span className="dim">{`${upper(p.their)} body. `}</span>
          {`${bodyWords(person.body, bodyUnits(person.currentLocationId).imperial)}. ${bodyUnits(person.currentLocationId, `where ${p.they} ${p.s('live')}`).why}`}
        </p>
      ),
      // An injury mending, and whether it keeps them off work (`systems/injury.ts`).
      (() => {
        const hurt = injuryOf(person, sim.now);
        return hurt ? (
          <p key="hurt" className="small">
            <span className="dim">Mending. </span>
            {INJURY_KIND[hurt.kind].label}, until {formatDate(hurt.until, sim.zone)}{hurt.offWorkUntil ? ', and laid up until then' : ''}{hurt.atWork ? ', on workers’ compensation' : ''}.
          </p>
        ) : null;
      })(),
      <p key="papers" className="small">
        {/* Pronouns named as pronouns, and the country with its article (from 2026-10-17: until then "she/her, a citizen of
            United States."). */}
        <span className="dim">{`On ${p.their} papers. `}</span>
        {`${person.pronouns?.trim() ? `Pronouns ${person.pronouns.trim()}. ` : ''}A citizen of ${theCountry(COUNTRIES.get(person.citizenshipId)?.name ?? person.citizenshipId)}.`}
      </p>,
      // Who they are in their own terms, as creation took it, and nothing more: it moves nothing.
      (person.raceEthnicity?.length ?? 0) > 0 && (
        <p key="identity" className="small">
          <span className="dim">{`In ${p.their} own terms. `}</span>
          {describeEthnicity(person.raceEthnicity!, person.raceEthnicityOwn)}.
        </p>
      ),
      before.length > 0 && (
        <p key="before" className="small">
          <span className="dim">{`Where ${p.they} ${p.s('come')} from. `}</span>
          {before}
        </p>
      ),
      loves.length > 0 && (
        <p key="loves" className="small">
          <span className="dim">{`The films ${p.they} ${p.s('love')}. `}</span>
          {spokenList(loves)}.
        </p>
      ),
    ].filter(Boolean);

    return {
      name: isYou ? (person.displayName || person.firstName) : person.displayName,
      kind: isYou ? 'Yourself' : 'Somebody',
      summary: wellbeingSummary(person, isYou),
      body: said.length > 0 ? <>{said}</> : undefined,
      ways,
      provenance: isYou
        ? 'Your wellbeing: eight measures that move with the hours you keep, the work you do, what you can afford and the kind of person you are. Home shows Energy and Stress, and all eight are here.'
        : 'The same eight measures you have, moved by the same kinds of day.',
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
  // Whose wellbeing it is, and, for the player, what the measure is (from 2026-10-17, brief 14: until then the kind was
  // "One Of Eight" and the look said where the figure stood but never what it was).
  look: (dial, { sim }) => {
    const isYou = dial.person.id === sim.universe.playerId;
    const p = spokenOf(dial.person, isYou);
    return {
      name: dial.name,
      kind: `${upper(p.their)} Wellbeing`,
      parent: at('person', dial.person.id),
      summary: sentenceFor(dial, sim.now, p),
      body: isYou ? <p className="small">{WHAT[dial.key]}</p> : undefined,
      provenance: dial.unit === 'hours'
        ? 'Counted in hours. Each waking hour adds about a third of an hour, and a night pays it back, a long night faster. A night under six hours adds some too, and the shortest add more than they pay back.'
        : 'From 0 to 100. It changes with every hour the clock runs.',
    };
  },
});

/**
 * What the number actually means, right now, said of whoever the dial belongs to: "you" of the player, and anybody else
 * in their own pronouns (`spokenOf`). Until 2026-10-15 it was said in the second person of everybody, so another
 * person’s Energy, one press from her look’s "what the day has left in her", read "you’ve a full day in you".
 *
 * Where a dial decides something, the sentence says what, with the engine’s
 * own figure: condition, fitness, morale and hygiene read what the night, a
 * workout and the mood are actually given. They said "long days will find
 * it", "A stunt day would cost you a week" and "Rooms notice" when nothing
 * did any of it.
 */
function sentenceFor(dial: Dial, now: number, p: Spoken): string {
  const n = Math.round(dial.value);
  const w = dial.person.wellbeing;
  const one = p.are === 'is';
  // "You’re", "she’s", "they’re". "You’ve had" and "she has" a day in her went with their sentences on 2026-10-17.
  const theyAre = `${p.they}’${one ? 's' : 're'}`;
  switch (dial.key) {
    case 'energy':
      return n > 75 ? `${n}. Plenty for a full day.`
        : n > 40 ? `${n}. Enough for today, but not much more.`
          : `${n}. ${upper(theyAre)} running low, and it pulls readiness down. Under ${EMPTY}, stress starts to climb.`;
    case 'stress':
      return n < 25 ? `${n}. Not much is adding to it. Running out of energy would, and so would money trouble or bad nights.`
        : n < 60 ? `${n}. Noticeable, but manageable. The higher it is, the longer it takes to clear.`
          : `${n}. High enough to spoil ${p.their} sleep, and bad sleep adds more.${n > OVERWROUGHT ? ` Over ${OVERWROUGHT}, it’s wearing ${p.their} condition down every hour.` : ''}`;
    case 'sleepDebt':
      // A day awake puts debt on the books as it goes, 5.4 hours by eleven
      // after a day up from seven, and a night pays it back. Counted as owed,
      // this said "5 hours owed. One long night would clear it." while the
      // Sleep dialog offered the same evening a normal eight hours. It is the
      // day’s only when they woke owing next to nothing: in the morning after
      // a short night, the same five hours are what the night left.
      return n < 2 ? `None to speak of. ${upper(theyAre)} caught up on sleep.`
        : (dial.person.wokeWithDebt ?? dial.value) < 2 && dial.value < A_NORMAL_DAYS_DEBT + 2
          ? `${plural(n, 'hour')}, about what a normal day awake adds. A night’s sleep pays it back.`
          : n < 12 ? `${plural(n, 'hour')} owed. One long night would clear it.`
            : `${plural(n, 'hour')} owed. Everything is harder than it should be until it’s paid back.`;
    case 'morale': {
      // Even at 62.5, where a night clears its usual share of stress.
      const settles = Math.round(moraleSettlesAt(dial.person, w.condition, now));
      const mood = n > 70 ? 'In good spirits' : n > 40 ? 'Steady' : 'Low';
      return `${n}. ${mood}, and each night brings it back toward ${settles}. `
        + (n >= 63 ? 'Up like this, a night clears more of the day’s stress than usual.'
          : 'Down like this, a night clears less of the day’s stress than usual.');
    }
    case 'condition': {
      const mends = Math.round(mendsTo(dial.person, now));
      const share = Math.round(100 * (0.8 + 0.2 * Math.min(1, w.condition / mendsTo(dial.person, now))));
      // What the dial decides, and the midnight pull toward the same mark.
      // On the figure the school reads, not the one shown rounded (from 2026-10-13: until then 54.8, shown as 55, left the
      // line out where the school would excuse the day; found by the review of that day).
      const also = `${dial.person.school && dial.value < SCHOOL_ESTIMATE.sickBelow ? ` Under ${SCHOOL_ESTIMATE.sickBelow}, a sick day from classes is excused.` : ''} The lower it is, the likelier a year is to be ${p.their} last.`;
      return n >= mends ? `${n}. As sound as rest can make ${p.them} at ${p.their} fitness. Above ${mends}, it settles back toward ${mends} each midnight.${also}`
        : `${n}. At ${p.their} fitness, rest can mend it to ${mends}. For now, a night gives back ${share}% of the energy it would at ${mends}, and each midnight brings it a little closer.${also}`;
    }
    case 'fitness': {
      const mends = Math.round(mendsTo(dial.person, now));
      const costs = Math.round(workoutCosts(dial.person));
      // The age’s ceiling, which training can’t pass, and what the years are like now.
      const age = (now - dial.person.birthInstant) / (365.2425 * 86_400_000);
      return `${n}. At this fitness, rest can mend ${p.their} condition to ${mends}, and a workout costs ${costs} energy.`
        + (dial.value <= EVERYDAY_FITNESS ? ' This is where everyday life keeps it without training.' : '')
        + ` At ${Math.floor(age)}, the most a body can be trained to is ${Math.round(ceilingAt(age).fitness)}. ${ageWords(age)}`;
    }
    case 'nourishment':
      // With the day’s meals: at least 76 each morning when the food is paid for, 40 when it can’t be.
      return (n > 70 ? `${n}. Well fed.`
        : n >= 20 ? `${n}. Getting hungry. Under 20, hunger costs condition and mood every hour.`
          : `${n}. Hungry, and it’s costing condition and mood every hour.`)
        + ' Each morning the day’s groceries bring it up to at least 76, or to 40 on a day the food can’t be paid for.';
    case 'hygiene':
      return (n >= 50 ? `${n}. Clean enough not to bother ${p.them}.`
        : `${n}. Under 50, it wears on ${p.their} mood every hour. A shower puts it back.`)
        + ' The morning shower brings it up to at least 82.';
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
  // Said of whoever it belongs to (`spokenOf`, from 2026-10-15: until then another person’s readiness was "How Well You
  // Would Do Today" and "what’s costing you", one press from her look, which said her dials of her).
  look: (ready, { sim }) => {
    const p = spokenOf(ready.person, ready.person.id === sim.universe.playerId);
    // From 2026-10-17 (brief 14): the kind says how ready, the drags hold back rather than "cost", and the footnote says
    // what judged work does with it. Until then it said "the work judged that day reads it as its condition".
    return {
      name: 'Readiness',
      kind: `How Ready ${upper(p.they)} ${upper(p.are)} Today`,
      parent: at('person', ready.person.id),
      summary: ready.drags.length === 0
        ? `${Math.round(ready.value)}. Very little is holding ${p.them} back.${ready.value >= 99.5 ? ' This is as good as a day gets.' : ''}`
        // At the ceiling a measure short of its best takes nothing off the figure shown (`readiness` clamps at 100), so it
        // isn’t said to hold anybody back (from 2026-10-17: until then "100, and nourishment is what’s costing you").
        : ready.value >= 99.5
          ? `${Math.round(ready.value)}. As good as a day gets, even with ${spokenList(ready.drags.map((d) => d.name.toLowerCase()))} short of ${p.their} best.`
          : `${Math.round(ready.value)}. ${upper(spokenList(ready.drags.map((d) => d.name.toLowerCase())))} ${isAre(ready.drags.length)} holding ${p.them} back most.`,
      ways: ready.drags.map((d) => ({
        to: at('dial', `${ready.person.id}/${d.key}`),
        label: d.name,
        detail: `${d.key === 'sleepDebt' ? `${plural(Math.round(d.value), 'hour')} owed` : `At ${Math.round(d.value)}`}, and pulling readiness down.`,
      })),
      provenance: `Seven of the eight measures, all but fitness, from 5 to 100. It sets how much a class, a lab, a rehearsal, an hour of practice or a workout builds, and under ${EVALUATION.sufficientReadiness} it costs ${p.them} in judged work.`,
    };
  },
});

// ---------------------------------------------------------------------------
// A trait, and a condition carried (from the connected world of 2026-10-09)
// ---------------------------------------------------------------------------

interface HeldTrait { person: Person; id: string }

defineLook<HeldTrait>('trait', {
  gone: 'There’s no such trait.',
  // The person the look is of: named in the id (`person/trait`, as a dial’s is), or the player. Until 2026-10-14 every
  // trait resolved against the player, so the Curious way on another person’s look opened a look about the player,
  // judged held by the player’s traits, parented to the player’s look (found by that day’s third round of evidence).
  resolve: (sim, id) => {
    const split = splitDialId(id);
    const person = split ? personIn(sim, split.personId) : sim.player;
    const trait = split ? split.key : id;
    return person && PERSONALITY_TRAIT_BY_ID[trait] ? { person, id: trait } : undefined;
  },
  seeds: (sim) => [...(sim.player.personalityTraits ?? [])],
  look: ({ person, id }, { sim }) => {
    const t = PERSONALITY_TRAIT_BY_ID[id]!;
    const isYou = person.id === sim.universe.playerId;
    const held = (person.personalityTraits ?? []).includes(id);
    const p = spokenOf(person, isYou);
    const mods = Object.entries(t.systemMods ?? {}) as [PersonalityKnob, number][];
    const times = (x: number) => `${x >= 1 ? '+' : '−'}${Math.round(Math.abs(x - 1) * 100)}%`;
    return {
      name: t.name,
      // Whose trait it is, and "all told" for every trait and disposition together (from 2026-10-17, brief 14: until then
      // "A Trait She Holds" and "with all she is").
      kind: held ? `${upper(p.their)} Trait` : 'A Trait',
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
                    {held && <td className="num mono dim">{times(personalityOf(person, knob))} all told</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="small">It doesn’t change any figure in the game. It says who {p.they} {p.are}.</p>
          )}
          <p className="small"><span className="dim">Its cost. </span>{t.cost}</p>
        </div>
      ),
      ways: [{ to: at('readiness', person.id), label: 'Readiness', detail: `How ready the measures it moves leave ${p.them} today.` }],
      provenance: `Each figure is the trait’s own. “All told” is ${p.their} traits and dispositions taken together, within set limits.`,
    };
  },
});

interface Carried { person: Person; key: Condition | 'injury' }

/**
 * What a condition left untreated does, by the week, in the measures' words (`CHRONIC.untreated`), and whether keeping it
 * up undoes anything. Said of the type a diabetes is (from 2026-10-17: until then a type 2 read what type 1 does).
 */
function leftAlone(c: Condition, typeOne?: boolean): { untreated: string; keptUp: boolean } {
  const u = CHRONIC.untreated;
  const likely = (x: number) => (x === 2 ? 'twice as likely' : `${x} times as likely`);
  if (c === 'depression') return { untreated: `Left untreated, it takes ${u.moraleAWeek} from morale every week.`, keptUp: true };
  if (c === 'asthma') return { untreated: `Left untreated, it makes an asthma emergency ${likely(u.asthmaEmergencies)}.`, keptUp: true };
  if (c === 'diabetes') {
    return {
      untreated: typeOne
        ? `Left untreated, it makes an emergency ${likely(u.diabetesEmergencies)}, and it takes ${u.diabetesConditionAWeek} from condition every week.`
        : `Left untreated, it takes ${u.diabetesConditionAWeek} from condition every week.`,
      keptUp: true,
    };
  }
  if (c === 'arthritis') return { untreated: `Left untreated, it takes ${u.arthritisEnergyAWeek} from energy every week.`, keptUp: true };
  return { untreated: 'Left untreated, it has no effect in the game beyond going without its care, which then costs nothing.', keptUp: false };
}

defineLook<Carried>('condition', {
  // Said of whoever the look was of, the player or not (until 2026-10-15 “You don’t carry that now.”, of anyone).
  gone: 'That isn’t there any more.',
  // The person the look is of, named in the id (`person/condition`) as a trait’s is, or the player. Until 2026-10-14
  // every condition resolved against the player, as the trait look did until earlier that day, so another person’s
  // Depression opened a look of the player’s, or none when the player carried none (found by that day’s third round of
  // evidence).
  resolve: (sim, raw) => {
    const split = splitDialId(raw);
    const person = split ? personIn(sim, split.personId) : sim.player;
    const id = split ? split.key : raw;
    if (!person) return undefined;
    if (id === 'injury') return injuryOf(person, sim.now) ? { person, key: 'injury' } : undefined;
    return person.health?.chronic?.[id as Condition] ? { person, key: id as Condition } : undefined;
  },
  seeds: (sim) => [...Object.keys(sim.player.health?.chronic ?? {}), ...(injuryOf(sim.player, sim.now) ? ['injury'] : [])],
  look: ({ person, key }, { sim }) => {
    const isYou = person.id === sim.universe.playerId;
    const p = spokenOf(person, isYou);
    const theyAre = `${p.they}’${p.are === 'is' ? 's' : 're'}`;
    if (key === 'injury') {
      const hurt = injuryOf(person, sim.now)!;
      return {
        name: INJURY_KIND[hurt.kind].label,
        kind: 'An Injury',
        // What it keeps them from, by what it limits (from 2026-10-17, brief 14): until then only an injury that lays them
        // up said so, and a sprained ankle, which keeps them from training too (`trainingRefusal`), said nothing. The same
        // day, the health journey found it didn’t say Call In Sick excuses a day of classes for it, as the flu’s notice does.
        summary: `It mends by ${formatDate(hurt.until, sim.zone)}.${hurt.offWorkUntil
          ? ` Until then ${theyAre} laid up, kept from classes, work and training.`
          : INJURY_KIND[hurt.kind].limits !== 'none' ? ` Until then ${p.they} can’t work out, and it holds back the physical side of ${p.their} work.${isYou && person.school && !schoolEnded(person.school.standing) ? ' Call In Sick, on School, excuses a day of classes while it mends.' : ''}` : ''}`,
        parent: at('person', person.id),
        ways: [{ to: at('dial', `${person.id}/condition`), label: 'Condition', detail: `How sound ${p.their} body is. An injury doesn’t lower it, but it adds to ${p.their} stress and lowers ${p.their} mood each day.` }],
        provenance: 'How long it takes depends on the injury, and it’s longer for somebody illness hits harder.',
      };
    }
    const state = person.health!.chronic![key]!;
    const dial = key === 'depression' ? 'morale' : key === 'diabetes' ? 'condition' : key === 'arthritis' ? 'energy' : undefined;
    return {
      name: CONDITION_LABEL[key] + (key === 'diabetes' ? (state.typeOne ? ', Type 1' : ', Type 2') : ''),
      // A long-term condition, so it isn’t read as the Condition measure (from 2026-10-17, brief 14: until then "A
      // Condition She Carries", one press from her Condition), and where it’s kept up or let go, by the buttons' names.
      kind: 'A Long-Term Condition',
      summary: state.treated
        ? (state.lapsed
          ? `${upper(theyAre)} keeping it up, but this month’s care went unpaid, so it goes untreated until next month.`
          : `${upper(theyAre)} keeping it up. Its care is paid each month, at what ${p.their} plan doesn’t cover.`)
        : `${upper(theyAre)} leaving it untreated. That costs nothing, but it has the effects below.`,
      parent: at('person', person.id),
      body: (() => {
        const left = leftAlone(key, state.typeOne);
        return <p className="small">{left.untreated}{left.keptUp ? ' Kept up, it does none of that.' : ''}{isYou ? ' To change it, go to Papers, then Health Cover, and press Keep It Up or Let It Go beside it.' : ''}</p>;
      })(),
      ways: dial ? [{ to: at('dial', `${person.id}/${dial}`), label: dial[0]!.toUpperCase() + dial.slice(1), detail: 'What it takes from when it’s left untreated.' }] : [],
      // Some begin later in a life too (`onsetMonth`, from 2026-09-28): until 2026-10-17 this said every one was drawn once.
      provenance: `${key in ONSET.yearly ? 'It can start with a life, at a young adult’s rates, or begin later, likelier in a heavier body.' : 'It starts with a life, at a young adult’s rates.'} Source: ${CHRONIC.source}.`,
    };
  },
});
