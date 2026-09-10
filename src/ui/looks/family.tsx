/**
 * SLATE — the people in the house, all the way down.
 *
 * Who Lives Here has always listed names, and every name opened onto the nine
 * dials and stopped. That was the whole of a mother: a stress reading. What
 * was missing is everything a person actually is to you — what they are, how
 * the two of you are getting on, what moved it there, and which of the three
 * things on the land they are the one who runs.
 *
 * None of it is invented. A relation is a fact stored on the person; a
 * standing is one number between two people that nothing sets by hand; the
 * bands are the words the engine already uses for it; and what somebody does
 * on the land opens onto the house, the lot or the company themselves, which
 * were already here. This file is edges, not new state.
 */

import type { Bond, Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { ageOn, dateKey, formatDate } from '@/engine/core/time';
import { familyOf, relationWord } from '@/engine/world/family';
import {
  DRIFT_PER_DAY, MISSED_COOLS, RESTING_APART, RESTING_UNDER_ONE_ROOF, STANDING_BANDS,
  TOGETHER_WARMS, bondFor, bondsOf, daysSinceTogether, otherIn, restingLevel,
  standingSaid, standingWord, underOneRoof,
} from '@/engine/world/standing';
import { Stat } from '@/ui/components/primitives';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { isAre, said, spokenList } from './words';

// ---------------------------------------------------------------------------
// Reading the world
// ---------------------------------------------------------------------------

const personIn = (sim: Simulation, id: string): Person | undefined => sim.universe.people[id];

const nameOf = (person: Person): string => person.displayName || person.firstName;

/** Everybody in the save the player has a standing with, warmest first. */
const yourPeople = (sim: Simulation): Person[] =>
  bondsOf(sim.universe, sim.universe.playerId)
    .map((bond) => sim.universe.people[otherIn(bond, sim.universe.playerId)])
    .filter((person): person is Person => person !== undefined);

/** What somebody is to the player, in the word the world uses, or nothing. */
export function whatTheyAre(sim: Simulation, person: Person): string | undefined {
  const player = sim.universe.people[sim.universe.playerId];
  const found = player?.relations?.find((relation) => relation.toId === person.id);
  return found ? relationWord(found.kind, person.gender) : undefined;
}

/** The bond between the player and somebody, where there is one. */
const standingWith = (sim: Simulation, person: Person): Bond | undefined =>
  bondFor(sim.universe, sim.universe.playerId, person.id);

/** The band a closeness falls in. */
const bandAt = (closeness: number) =>
  STANDING_BANDS.find((band) => closeness >= band.from) ?? STANDING_BANDS[STANDING_BANDS.length - 1]!;

/** The top of a band, which is the bottom of the one above it. */
function topOf(word: string): number {
  const index = STANDING_BANDS.findIndex((band) => band.word === word);
  return index <= 0 ? 100 : STANDING_BANDS[index - 1]!.from - 1;
}

/** The people the seeds crawl. Everybody the player has a standing with. */
const seedPeople = (sim: Simulation): string[] => yourPeople(sim).map((person) => person.id);

// ---------------------------------------------------------------------------
// What they are to you
// ---------------------------------------------------------------------------

interface Related { person: Person; word: string }

defineLook<Related>('relation', {
  gone: 'They aren’t anything to you any more, which is a strange thing for the save to be saying.',
  resolve: (sim, id) => {
    const person = personIn(sim, id);
    if (!person) return undefined;
    const word = whatTheyAre(sim, person);
    return word ? { person, word } : undefined;
  },
  seeds: seedPeople,
  look: ({ person, word }, { sim }) => {
    const player = sim.universe.people[sim.universe.playerId]!;
    const twin = word.startsWith('Twin');
    const apart = ageOn(
      Math.min(person.birthInstant, player.birthInstant),
      Math.max(person.birthInstant, player.birthInstant),
      sim.homeZone,
    );
    const older = person.birthInstant < player.birthInstant;
    const theirs = familyOf(sim.universe, person.id)
      .filter((one) => one.person.id !== person.id);
    const roof = underOneRoof(sim.universe, player.id, person.id);

    return {
      name: `Your ${word}`,
      kind: 'The Fact Of It',
      parent: at('person', person.id),
      summary: twin
        ? `${person.firstName} was born the same morning you were, which is the only thing that makes `
          + 'somebody a twin rather than a sibling who shares a birthday.'
        : `${person.firstName} was ${said(Math.round(apart), 'year')} into their own life when yours `
          + 'started, and has been in the house for every day of it since.',
      body: (
        <>
          <p className="small">
            {twin
              ? `The two of you have the same parents, the same surname, the same birthday and, if you were `
                + 'born identical, the same face. Nothing else in this game is that close by default.'
              : `${older ? 'They were here first' : 'They were born after you'}, by `
                + `${said(apart, 'year')}. `}
            {' '}You share the surname {player.lastName}, which is also the name on the gate of the lot.
            {roof
              ? ' And you still sleep under the same roof, which is why you see each other whether either of you meant to.'
              : ' You no longer live in the same house, which is why keeping up with them takes deciding to.'}
          </p>
          <p className="small">
            {theirs.length === 0
              ? 'Nobody else in the save is related to them.'
              : `${spokenList(theirs.map((one) => `${one.person.firstName} is their `
                + `${relationWord(one.kind, one.person.gender).toLowerCase()}`))}.`}
          </p>
          <div className="grid grid-3">
            <Stat label="What They Are" value={word} note="From your side of it" />
            <Stat
              label="Born"
              value={formatDate(person.birthInstant, sim.homeZone)}
              note={`${said(ageOn(person.birthInstant, sim.now, sim.homeZone), 'year')} old now`}
            />
            <Stat
              label="Under One Roof"
              value={roof ? 'Yes' : 'No'}
              note={roof ? 'The same house as you' : 'Somewhere else now'}
            />
          </div>
        </>
      ),
      ways: theirs.map((one) => ({
        to: at('person', one.person.id),
        label: nameOf(one.person),
        detail: `${person.firstName}’s ${relationWord(one.kind, one.person.gender).toLowerCase()}`,
      })),
      provenance: 'A relation is stored on the person rather than between two of them, because being '
        + 'somebody’s mother is a fact about her.',
    };
  },
});

// ---------------------------------------------------------------------------
// Where you stand
// ---------------------------------------------------------------------------

interface Standing { person: Person; bond: Bond }

defineLook<Standing>('bond', {
  gone: 'There’s no standing between the two of you to look at.',
  resolve: (sim, id) => {
    const person = personIn(sim, id);
    const bond = person ? standingWith(sim, person) : undefined;
    return person && bond ? { person, bond } : undefined;
  },
  seeds: seedPeople,
  look: ({ person, bond }, { sim }) => {
    const closeness = Math.round(bond.closeness);
    const band = bandAt(closeness);
    const rest = restingLevel(sim.universe, bond);
    const above = closeness - rest;
    const days = daysSinceTogether(bond, sim.now);
    const roof = underOneRoof(sim.universe, sim.universe.playerId, person.id);

    const ways: Way[] = [
      {
        to: at('scale', person.id),
        label: 'The Whole Of It',
        detail: `Seven words for it, and ${band.word} is the one you’re in`,
      },
      {
        to: at('whatmoves', person.id),
        label: 'What Moves It',
        detail: 'Turning up, not turning up, and what time does on its own',
      },
    ];
    if (bond.lastTogetherAt !== undefined) {
      ways.push({
        to: at('day', dateKey(bond.lastTogetherAt, sim.homeZone)),
        label: 'The Last Time',
        detail: `${formatDate(bond.lastTogetherAt, sim.homeZone)}, the last day you two set aside`,
      });
    }

    return {
      name: `You And ${person.firstName}`,
      kind: 'How You’re Getting On',
      parent: at('person', person.id),
      summary: standingSaid(closeness),
      body: (
        <>
          <p className="small">
            {above > 2
              ? `You’re ${said(Math.round(above), 'point')} above where this would sit if neither of you did `
                + 'anything about it, and that is entirely down to the two of you.'
              : above < -2
                ? `You’re ${said(Math.round(-above), 'point')} below where this would sit on its own, which `
                  + 'takes some doing.'
                : 'This is sitting almost exactly where it would sit on its own, which means neither of you '
                  + 'has done anything to it lately, good or bad.'}
            {roof
              ? ' Living in the same house holds it up on its own: you hear them on the stairs and you eat at the same table, whether either of you planned to.'
              : ' Nothing holds this up on its own any more, because you don’t share a roof.'}
          </p>
          <p className="small">
            {days === undefined
              ? 'The two of you haven’t set aside a day for each other yet.'
              : days === 0
                ? 'You saw them today, on purpose.'
                : `It’s been ${said(days, 'day')} since the two of you set aside time for each other.`}
          </p>
          <div className="grid grid-3">
            <Stat label="Where It Stands" value={closeness} note={`${band.word}, out of a hundred`} />
            <Stat label="Where It Settles" value={rest} note={roof ? 'Because you live together' : 'Because you live apart'} />
            <Stat
              label="Last Together"
              value={days === undefined ? 'Never' : days === 0 ? 'Today' : said(days, 'day')}
              note={days === undefined ? 'Nothing set aside yet' : 'Since you set time aside'}
            />
          </div>
        </>
      ),
      ways,
      provenance: 'One number for the pair rather than one each. The game has no interest in a mother who '
        + 'feels close to a son who doesn’t feel close back.',
    };
  },
});

// ---------------------------------------------------------------------------
// The whole scale
// ---------------------------------------------------------------------------

interface Scale { person: Person; bond: Bond }

defineLook<Scale>('scale', {
  gone: 'There’s no standing to lay out.',
  resolve: (sim, id) => {
    const person = personIn(sim, id);
    const bond = person ? standingWith(sim, person) : undefined;
    return person && bond ? { person, bond } : undefined;
  },
  seeds: seedPeople,
  look: ({ person, bond }, { sim }) => {
    const closeness = Math.round(bond.closeness);
    const band = bandAt(closeness);
    const people = yourPeople(sim);
    const inBand = (word: string): number => people.filter((one) => {
      const other = standingWith(sim, one);
      return other !== undefined && standingWord(Math.round(other.closeness)) === word;
    }).length;

    return {
      name: 'Seven Words For It',
      kind: 'Every Rung Of The Ladder',
      parent: at('bond', person.id),
      summary: `The scale runs from estranged to inseparable in seven steps, and you and ${person.firstName} `
        + `are ${band.word.toLowerCase()}.`,
      body: (
        <p className="small">
          Nobody in this game says a number out loud, so every standing comes out as one of these seven
          words. They’re bands rather than points: {band.word} covers {band.from} to {topOf(band.word)}, and
          you’re at {closeness}, which is {closeness - band.from === 0 ? 'right at the bottom of it'
            : topOf(band.word) - closeness === 0 ? 'right at the top of it'
              : `${said(closeness - band.from, 'point')} into it`}.
        </p>
      ),
      waysAs: 'strip',
      ways: STANDING_BANDS.map((one) => ({
        to: at('band', `${person.id}/${one.word}`),
        label: one.word,
        detail: one.word === band.word
          ? `Where you and ${person.firstName} are, at ${closeness}`
          : `${one.from} to ${topOf(one.word)} out of a hundred`,
        glance: {
          lines: [`${one.from}–${topOf(one.word)}`, inBand(one.word) === 0 ? 'Nobody' : said(inBand(one.word), 'person', 'people')],
        },
      })),
      provenance: 'The bands are the engine’s own words for a closeness, not a second scale written for a screen.',
    };
  },
});

// ---------------------------------------------------------------------------
// One rung of it
// ---------------------------------------------------------------------------

interface Rung { person: Person; word: string; from: number; said: string }

defineLook<Rung>('band', {
  gone: 'There’s no such rung on the ladder.',
  resolve: (sim, id) => {
    const cut = id.lastIndexOf('/');
    if (cut <= 0) return undefined;
    const person = personIn(sim, id.slice(0, cut));
    const band = STANDING_BANDS.find((one) => one.word === id.slice(cut + 1));
    return person && band ? { person, word: band.word, from: band.from, said: band.said } : undefined;
  },
  seeds: (sim) => {
    const first = seedPeople(sim)[0];
    return first ? STANDING_BANDS.map((band) => `${first}/${band.word}`) : [];
  },
  look: ({ person, word, from, said: sentence }, { sim }) => {
    const top = topOf(word);
    const here = yourPeople(sim).filter((one) => {
      const bond = standingWith(sim, one);
      return bond !== undefined && standingWord(Math.round(bond.closeness)) === word;
    });
    const yours = standingWith(sim, person);
    const youAreHere = yours !== undefined && standingWord(Math.round(yours.closeness)) === word;

    return {
      name: word,
      kind: 'One Rung Of Seven',
      parent: at('scale', person.id),
      summary: sentence,
      body: (
        <>
          <p className="small">
            It covers {from} to {top} out of a hundred.{' '}
            {here.length === 0
              ? 'Nobody in your life is here at the moment.'
              : `${spokenList(here.map((one) => one.firstName))} ${isAre(here.length)} here right now.`}
            {youAreHere
              ? ` That includes ${person.firstName}, which is how you came to be reading this.`
              : ` You and ${person.firstName} are ${standingWord(Math.round(yours?.closeness ?? 0)).toLowerCase()} rather than this.`}
          </p>
          <div className="grid grid-3">
            <Stat label="From" value={from} note="The bottom of it" />
            <Stat label="To" value={top} note="The top of it" />
            <Stat label="Who Is Here" value={here.length} note={here.length === 1 ? 'One person' : 'People in your life'} />
          </div>
        </>
      ),
      ways: here.map((one) => ({
        to: at('bond', one.id),
        label: nameOf(one),
        detail: `${Math.round(standingWith(sim, one)?.closeness ?? 0)} out of a hundred, which is ${word.toLowerCase()}`,
      })),
    };
  },
});

// ---------------------------------------------------------------------------
// What moves it
// ---------------------------------------------------------------------------

interface Moves { person: Person; bond: Bond }

defineLook<Moves>('whatmoves', {
  gone: 'There’s no standing here for anything to move.',
  resolve: (sim, id) => {
    const person = personIn(sim, id);
    const bond = person ? standingWith(sim, person) : undefined;
    return person && bond ? { person, bond } : undefined;
  },
  seeds: seedPeople,
  look: ({ person, bond }, { sim }) => {
    const rest = restingLevel(sim.universe, bond);
    const roof = underOneRoof(sim.universe, sim.universe.playerId, person.id);
    // How long a day above the resting level takes to be half forgotten.
    const halfLife = Math.round(Math.log(0.5) / Math.log(1 - DRIFT_PER_DAY));

    return {
      name: 'Turning Up, And Not',
      kind: 'The Only Two Things That Do',
      parent: at('bond', person.id),
      summary: 'Putting a plan on the calendar with somebody and being there for it is the one thing that '
        + 'warms this. Not being there is the one thing that cools it on purpose.',
      body: (
        <>
          <p className="small">
            A plan you make with {person.firstName} and turn up to is worth {TOGETHER_WARMS} points.
            One you don’t turn up to costs {MISSED_COOLS}. They aren’t even on purpose: if they were, you
            could make a dozen plans, keep half of them and come out ahead, and a plan would stop meaning
            anything.
          </p>
          <p className="small">
            The rest is what time does. Every day this slides {Math.round(DRIFT_PER_DAY * 100)}% of the way
            back toward {rest}, which is {roof
              ? 'what living in the same house is worth on its own — you hear them on the stairs and you eat at the same table, whether either of you planned to'
              : 'what a standing with somebody you don’t live with settles at when neither of you does anything'}.
            So a good afternoon is about half forgotten in {said(halfLife, 'day')}, and nothing you do to
            this is permanent in either direction.
          </p>
          <div className="grid grid-3">
            <Stat label="Turning Up" value={`+${TOGETHER_WARMS}`} note="A plan you were there for" />
            <Stat label="Not Turning Up" value={`−${MISSED_COOLS}`} note="A plan that wanted you elsewhere" />
            <Stat label="A Day Of Neither" value={`${Math.round(DRIFT_PER_DAY * 100)}%`} note={`Of the way back to ${rest}`} />
          </div>
        </>
      ),
      ways: [
        {
          to: at('plans'),
          label: 'Your Own Plans',
          detail: 'Everything you have put on the calendar, and who it is with',
        },
        {
          to: at('household', sim.universe.people[sim.universe.playerId]?.householdId ?? ''),
          label: 'Everybody Under This Roof',
          detail: roof
            ? `Which is why this settles at ${rest} rather than ${RESTING_APART}`
            : `Which ${person.firstName} is no longer part of`,
        },
      ],
      provenance: `Under one roof a standing rests at ${RESTING_UNDER_ONE_ROOF}; apart it rests at `
        + `${RESTING_APART}. Sharing a house is contact whether anybody meant it to be.`,
    };
  },
});

// ---------------------------------------------------------------------------
// What they do on the land
// ---------------------------------------------------------------------------

/** Where each role goes, and what it is called on the way in. */
const ROLE_OPENS: Record<string, { label: string; detail: string; to: () => { kind: string; id: string } }> = {
  'the house': {
    label: 'The House',
    detail: 'The six bedrooms, the condition of it, and who sleeps in it',
    to: () => at('house'),
  },
  'the lot': {
    label: 'The Studio Lot',
    detail: 'The stages on the family land, and what has shot on them',
    to: () => at('lot'),
  },
  'the company': {
    label: 'The Family Company',
    detail: 'The name on the gate, and everything behind it',
    to: () => at('company'),
  },
};

interface Doing { person: Person; role: string }

defineLook<Doing>('estaterole', {
  gone: 'They don’t do anything on the land any more.',
  resolve: (sim, id) => {
    const person = personIn(sim, id);
    return person?.estateRole ? { person, role: person.estateRole } : undefined;
  },
  seeds: seedPeople,
  look: ({ person, role }, { sim }) => {
    const player = sim.universe.people[sim.universe.playerId]!;
    const older = person.birthInstant < player.birthInstant;
    const opens = ROLE_OPENS[role];
    const others = yourPeople(sim).filter((one) => one.id !== person.id && one.estateRole === role);
    const word = whatTheyAre(sim, person);

    return {
      name: opens ? `${person.firstName} And ${opens.label}` : `${person.firstName} Runs None Of It`,
      kind: 'What They Do Here',
      parent: at('person', person.id),
      summary: opens
        ? `${person.firstName} is the one who runs ${opens.label.toLowerCase()}, and ${older
          ? 'has been since before you were old enough to notice'
          : 'took it on while the two of you were growing up on the same land'}.`
        : `${person.firstName} lives on the land and leaves the running of it to everybody else, which is a `
          + 'thing a person is allowed to do.',
      body: (
        <>
          <p className="small">
            {opens
              ? `It isn’t a job in a labor market — there is no labor market here, and nobody on this land `
                + `draws a wage from anybody. It’s the thing ${person.firstName} is the one who does, and on `
                + `this land that is a more permanent arrangement than a job: your `
                + `${(word ?? 'family').toLowerCase()} will still be the one who does it next year.`
              : `Somebody has to run the house, the lot and the company, and it isn’t ${person.firstName}. `
                + 'That leaves them the only person on the land with nothing they have to be doing.'}
          </p>
          <p className="small">
            {others.length === 0
              ? 'Nobody else in the house has the same one.'
              : `${spokenList(others.map((one) => one.firstName))} ${isAre(others.length)} in it with them.`}
          </p>
        </>
      ),
      ways: opens
        ? [{ to: opens.to(), label: opens.label, detail: opens.detail }]
        : [{
          to: at('estate'),
          label: 'The Land Itself',
          detail: 'The two thousand acres they live on and don’t run',
        }],
      provenance: 'What somebody does here was chosen on the Your People step and is stored on the person. '
        + 'Nothing pays them for it, because SLATE has no wages on this land.',
    };
  },
});

/** For a screen that wants to say what somebody is without opening them. */
export function relationSaid(sim: Simulation, person: Person): string {
  const word = whatTheyAre(sim, person);
  if (!word) return '';
  const bond = standingWith(sim, person);
  return bond ? `${word} · ${standingWord(Math.round(bond.closeness))}` : word;
}

/** Everybody the household look and the person look both need to see. */
export { yourPeople };

/** One extra way for anybody who is somebody to you. Used by the person look. */
export function waysIntoSomebody(sim: Simulation, person: Person): Way[] {
  if (person.id === sim.universe.playerId) return [];
  const ways: Way[] = [];
  const word = whatTheyAre(sim, person);
  const bond = standingWith(sim, person);

  if (word) {
    ways.push({
      to: at('relation', person.id),
      label: `Your ${word}`,
      detail: 'What they are to you, and who else they belong to',
    });
  }
  if (bond) {
    ways.push({
      to: at('bond', person.id),
      label: 'Where You Stand',
      detail: `${standingWord(Math.round(bond.closeness))}, and what put it there`,
    });
  }
  if (person.estateRole) {
    ways.push({
      to: at('estaterole', person.id),
      label: 'What They Do Here',
      detail: person.estateRole === 'nothing in particular'
        ? 'Which is nothing in particular, and that is allowed'
        : `They’re the one who runs ${person.estateRole}`,
    });
  }
  return ways;
}
