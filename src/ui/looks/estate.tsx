/**
 * SLATE — the family land, and everything standing on it.
 *
 * Home’s The Land panel prints four facts and every one of them is a dead end
 * today: a house called The House, "2,000 acres, held by the family", a
 * condition meter and a count of the household. They are all real. The acreage
 * and the house are `content/estate.ts`, the house itself is built in
 * `engine/index.ts` owned outright with no mortgage and no rent against it,
 * and the condition is the number `sleepQuality` reads every night.
 *
 * The chain here is the land’s own shape rather than an invented one. The land
 * hangs beneath the city it sits outside, because that is where it is. The
 * house and the lot hang beneath the land, because they stand on it. The
 * household hangs beneath the house, because that is the roof it is under. The
 * company hangs beneath the lot, because that is where it works out of. Every
 * floor is a place, a thing or a person.
 *
 * The company is the honest one. It is named — the surname is the family name,
 * so it names itself — and that is the entire extent of it. There is no
 * company record in the universe, no slate, no picture and nothing anybody has
 * seen, and this says so in a sentence instead of printing a zero it cannot
 * stand behind.
 */

import { CITIES, type City } from '@/engine/content/geography';
import {
  ESTATE_ACRES, ESTATE_CITY_ID, ESTATE_COUNTRY_ID, ESTATE_NAME, ESTATE_NOTE, HOUSE, LOT_NAME,
  MOVED_IN, PEACE_RANKED_SINCE, SAFEGUARDS, SAFEGUARD_BY_ID, SAFETY_NOTE, studioName,
  type Safeguard,
} from '@/engine/content/estate';
import { plural } from '@/engine/core/text';
import type { Household, Person, Property } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { Open } from './Look';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { whatTheyAre } from './family';
import { bondFor, standingWord } from '@/engine/world/standing';
import { isAre, outOf, spokenList, toStart } from './words';

// ---------------------------------------------------------------------------
// Reading the world
// ---------------------------------------------------------------------------

const acresSaid = (): string => ESTATE_ACRES.toLocaleString('en-US');

/** Numbers under ten are words in prose and figures in facts. This is the prose half. */
const SMALL = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'] as const;

/** "six bedrooms", "12 bedrooms" — said the way a person says it. */
function said(count: number, one: string, many = `${one}s`): string {
  const n = Math.round(count);
  const figure = n >= 0 && n < SMALL.length ? SMALL[n]! : n.toLocaleString('en-US');
  return `${figure} ${n === 1 ? one : many}`;
}

const playerIn = (sim: Simulation): Person | undefined => sim.universe.people[sim.universe.playerId];

/** The city the land sits outside. Read from the gazetteer, never typed out. */
const estateTown = (): City | undefined => CITIES.get(ESTATE_CITY_ID);

/** The family name. It is the surname, because that is where a surname comes from. */
const surnameIn = (sim: Simulation): string => playerIn(sim)?.lastName.trim() ?? '';

/**
 * The house, live.
 *
 * By id where one is given, otherwise the roof the player sleeps under, and
 * failing that the one property the save marks as the home. A house that has
 * been sold is not the house any more.
 */
function houseIn(sim: Simulation, id: string): Property | undefined {
  if (id) {
    const named = sim.universe.properties[id];
    return named && !named.soldAt ? named : undefined;
  }
  const player = playerIn(sim);
  const own = player?.residenceId ? sim.universe.properties[player.residenceId] : undefined;
  if (own && !own.soldAt) return own;
  return Object.values(sim.universe.properties).find((p) => p.isPrimaryResidence && !p.soldAt);
}

function householdIn(sim: Simulation, id: string): Household | undefined {
  const found = id ? sim.universe.households[id] : undefined;
  if (found) return found.dissolvedAt ? undefined : found;
  if (id) return undefined;
  const player = playerIn(sim);
  const theirs = player?.householdId ? sim.universe.households[player.householdId] : undefined;
  return theirs?.dissolvedAt ? undefined : theirs;
}

/**
 * What is behind the company, said once.
 *
 * Written here rather than read out of the holdings list, because that list is
 * the Home panel’s copy for a card and a way in has to say what is at the far
 * end of it before anybody takes it.
 */
const COMPANY_DETAIL = 'Television and Film out of the lot, the family name on the gate and nothing made yet';

/** The people under one roof, in the world’s words, nobody skipped. */
function membersOf(sim: Simulation, household: Household): Person[] {
  return household.memberIds
    .map((memberId) => sim.universe.people[memberId])
    .filter((person): person is Person => person !== undefined);
}

const nameOf = (person: Person): string => person.displayName || person.firstName;

/**
 * The household’s own word for itself.
 *
 * The save writes it lowercase — `Rivera household` — and a name the trail
 * prints is Title Case, so it is built here rather than read back raw, and
 * built in one place so the way in and the thing it opens agree.
 */
const householdName = (sim: Simulation): string => {
  const surname = surnameIn(sim);
  return surname ? `${surname} Household` : 'The Household';
};

// ---------------------------------------------------------------------------
// The land
// ---------------------------------------------------------------------------

interface TheLand {
  town: City;
  house: Property | undefined;
  household: Household | undefined;
  company: string;
}

defineLook<TheLand>('estate', {
  gone: 'The land isn’t the family’s any more, and nothing standing on it answers to you.',
  resolve: (sim) => {
    const town = estateTown();
    if (!town) return undefined;
    return {
      town,
      house: houseIn(sim, ''),
      household: householdIn(sim, ''),
      company: studioName(surnameIn(sim)),
    };
  },
  seeds: () => [''],
  look: (land) => {
    // Only what is really standing. A house that has been sold is not one of
    // the things on the land, and the sentence naming them does not name it.
    const standing = [
      ...(land.house ? [land.house.name || HOUSE.name] : []),
      LOT_NAME,
      land.company,
    ];
    const living = land.household?.memberIds.length ?? 1;

    const ways: Way[] = [];
    if (land.house) {
      ways.push({
        to: at('house', land.house.id),
        label: land.house.name || HOUSE.name,
        detail: 'Where you sleep, and the condition that decides how much a night here puts back',
      });
    }
    ways.push({
      to: at('lot'),
      label: LOT_NAME,
      detail: 'Newly built stages on the same land, close enough to walk to, and nothing shot on one yet',
    });
    ways.push({
      to: at('company'),
      label: land.company,
      detail: COMPANY_DETAIL,
    });
    ways.push({
      to: at('security'),
      label: 'The Way In',
      detail: `${toStart(said(SAFEGUARDS.length, 'layer'))} between the road and the front door, and one gate through all of them`,
    });

    return {
      name: ESTATE_NAME,
      kind: 'What The Family Holds',
      parent: at('place', land.town.id),
      summary: `${ESTATE_NAME} is ${acresSaid()} acres outside ${land.town.name}, it’s the family’s, and `
        + 'there’s no rent, no mortgage and nobody to answer to about any of it.',
      body: (
        <>
          <p className="small">
            The family has been on it since the first day of {MOVED_IN.year}, and it sits outside{' '}
            <Open subject={at('place', land.town.id)}>{land.town.name}</Open>. Three things stand on it:{' '}
            {spokenList(standing)}.
          </p>
          <p className="small">{ESTATE_NOTE}</p>
          <div className="grid grid-3">
            <Stat label="Acres" value={acresSaid()} note={`Outside ${land.town.name}`} />
            <Stat label="Held By" value="The Family" note="Not bought, not leased and not yours to sell" />
            <Stat
              label="Living On It"
              value={plural(living, 'person', 'people')}
              note="No rent, no lease, no landlord"
            />
          </div>
        </>
      ),
      ways,
      provenance: 'The acreage, the house and the lot are the premise, true before your first day starts. '
        + 'Nothing about the land is bought, sold or priced by the simulation.',
    };
  },
});

// ---------------------------------------------------------------------------
// The house
// ---------------------------------------------------------------------------

defineLook<Property>('house', {
  gone: 'You don’t sleep there any more.',
  resolve: (sim, id) => houseIn(sim, id),
  seeds: (sim) => {
    const house = houseIn(sim, '');
    return house ? [house.id] : [];
  },
  look: (house, { sim }) => {
    const kept = Math.round(house.condition);
    const household = householdIn(sim, '');
    const ways: Way[] = [];
    if (household) {
      ways.push({
        to: at('household', household.id),
        label: householdName(sim),
        detail: household.memberIds.length <= 1
          ? 'Just you under this roof, and nothing to split with anybody'
          : `${toStart(said(household.memberIds.length, 'person', 'people'))} under this roof, and what each is to you`,
      });
    }

    ways.push({
      to: at('safeguard', 'house'),
      label: 'What Stands Around It',
      detail: 'The doors, the glass and the room inside it nobody thinks about from one year to the next',
    });

    return {
      name: house.name || HOUSE.name,
      kind: 'Where You Sleep',
      parent: at('estate'),
      summary: kept >= 100
        ? `You sleep here, it’s at ${outOf(kept)}, and nothing in a house this new has had time to go `
          + 'wrong yet.'
        : kept >= 70
          ? `You sleep here, it’s kept at ${outOf(kept)}, and a night in a house this well looked `
            + 'after puts back more than a night in one that isn’t.'
          : `You sleep here, it’s down to ${outOf(kept)}, and the nights aren’t putting back what `
            + 'they should.',
      body: (
        <>
          <p className="small">
            It’s {said(house.bedrooms, 'bedroom')}, {said(house.bathrooms, 'bathroom')} and{' '}
            {house.interiorSqft.toLocaleString('en-US')} square feet of house, built in {house.yearBuilt} and
            lived in since the first day of {MOVED_IN.year}. The family put it up rather than bought it, so
            there’s no lease on it, no loan against it and nobody whose permission you need to be in it.
          </p>
          <p className="small">
            Condition is the one figure in this house that moves on its own. It sets how much a night here
            gives you back and it slips a little each day nobody tends to it — and at {outOf(kept)} it’s
            {kept >= 100
              ? ' as high as the figure goes, because the house is barely a year old and the family keeps it that way.'
              : kept >= 70 ? ' working for you rather than against you.' : ' costing you sleep you’d otherwise have had.'}
          </p>
          <div className="grid grid-3">
            <Stat label="Condition" value={outOf(kept)} note="What a night here is worth" />
            <Stat label="Bedrooms" value={house.bedrooms} note={`And ${plural(house.bathrooms, 'bathroom')}`} />
            <Stat
              label="Floor Area"
              value={`${house.interiorSqft.toLocaleString('en-US')} sq ft`}
              note={`On ${acresSaid()} acres`}
            />
            <Stat label="Built" value={house.yearBuilt} note={`Moved into on 1 January ${MOVED_IN.year}`} />
            <Stat label="What It Costs You" value="Nothing" note="No rent, no lease, no landlord" />
          </div>
        </>
      ),
      ways,
      provenance: 'The rooms and the floor area are the premise’s placeholders. The year, the day the family '
        + 'moved in and the condition are real, and the condition moves every day the clock runs.',
    };
  },
});

// ---------------------------------------------------------------------------
// Who lives there
// ---------------------------------------------------------------------------

defineLook<Household>('household', {
  gone: 'That household broke up, and the people who were in it are somewhere else now.',
  resolve: (sim, id) => householdIn(sim, id),
  seeds: (sim) => {
    const household = householdIn(sim, '');
    return household ? [household.id] : [];
  },
  look: (household, { sim }) => {
    const members = membersOf(sim, household);
    const count = members.length;
    const heads = household.headIds
      .map((id) => sim.universe.people[id])
      .filter((one): one is Person => one !== undefined);
    const house = household.residenceId ? sim.universe.properties[household.residenceId] : houseIn(sim, '');
    const dependents = household.dependentIds.length;

    return {
      name: householdName(sim),
      kind: 'Who Lives Here',
      parent: house ? at('house', house.id) : at('estate'),
      summary: count <= 1
        ? 'You’re the only person in it, and the house is a good deal bigger than one person needs.'
        : `${toStart(said(count, 'person', 'people'))} live under the one roof, and you’re one of them.`,
      body: (
        <>
          <p className="small">
            {count === 0
              ? 'Nobody else is named under this roof yet, and it’s a big house to be the only one in.'
              : heads.length === 0
                ? 'Nobody is named as the head of it, which for a house this size is unusual.'
                : `${spokenList(heads.map((one) => one.firstName))} ${isAre(heads.length)} `
                  + `the ${heads.length === 1 ? 'head' : 'heads'} of it, which is what it means for the land `
                  + 'to have been theirs before it was yours.'}
            {' '}It’s the family’s household and it carries the family’s name, the same name that’s on the gate
            of the lot.
          </p>
          <p className="small">
            There’s nothing to split here. No rent between you, no lease anybody signed, no landlord to answer
            to and {dependents === 0
              ? 'nobody depending on the household for money.'
              : `${said(dependents, 'person', 'people')} depending on it for money.`}
          </p>
        </>
      ),
      ways: members.map((person) => {
        // A name on this list is a person, and if they are somebody to you the
        // list says which somebody rather than making you open them to find out.
        const word = whatTheyAre(sim, person);
        const bond = person.id === sim.universe.playerId
          ? undefined
          : bondFor(sim.universe, sim.universe.playerId, person.id);
        return {
          to: at('person', person.id),
          label: nameOf(person),
          detail: person.id === sim.universe.playerId
            ? 'You, and the nine dials the day moves'
            : word && bond
              ? `Your ${word.toLowerCase()}, and the two of you are ${standingWord(Math.round(bond.closeness)).toLowerCase()}`
              : 'Who they are, and how they’re doing today',
        };
      }),
    };
  },
});

// ---------------------------------------------------------------------------
// What it takes to get onto the land
// ---------------------------------------------------------------------------

interface TheWayIn { town: City }

defineLook<TheWayIn>('security', {
  gone: 'There’s nothing standing between the road and the door any more.',
  resolve: () => {
    const town = estateTown();
    return town ? { town } : undefined;
  },
  seeds: () => [''],
  look: ({ town }) => ({
    name: 'The Way In',
    kind: 'What It Takes To Get Onto The Land',
    parent: at('estate'),
    summary: `One road runs onto ${ESTATE_NAME}, there are ${said(SAFEGUARDS.length, 'layer')} between it `
      + 'and the front door, and nobody reaches the second without being expected at the first.',
    body: (
      <>
        <p className="small">
          The family didn’t build a house and then worry about it. All of this went in with the build:
          the line around the land first, the one gate through it, the room that watches both, and the
          house hardened inside all three. Every layer works whether or not the one outside it does.
        </p>
        <p className="small">{SAFETY_NOTE}</p>
        <div className="grid grid-3">
          <Stat label="Roads In" value="1" note="And somebody is watching it" />
          <Stat label="Layers" value={SAFEGUARDS.length} note="Between the road and the door" />
          <Stat
            label="Where This Is"
            value={`First since ${PEACE_RANKED_SINCE}`}
            note={`${town.name}, in the most peaceful country there is`}
          />
        </div>
      </>
    ),
    ways: [
      ...SAFEGUARDS.map((one): Way => ({
        to: at('safeguard', one.id),
        label: one.label,
        detail: one.summary,
      })),
      {
        to: at('country', ESTATE_COUNTRY_ID),
        label: 'The Country Around It',
        detail: `First in the world for peace every year since ${PEACE_RANKED_SINCE}, which is what makes all of the above remarkable`,
      },
    ],
    provenance: 'The ranking is real and published. Everything on this land is the premise: SLATE runs no '
      + 'intrusions, no incidents and no threat model, and none of this has ever had to work.',
  }),
});

// ---------------------------------------------------------------------------
// One layer of it
// ---------------------------------------------------------------------------

defineLook<Safeguard>('safeguard', {
  gone: 'That isn’t one of the things standing between the road and the door.',
  resolve: (_sim, id) => SAFEGUARD_BY_ID[id],
  seeds: () => SAFEGUARDS.map((one) => one.id),
  look: (guard, { sim }) => {
    const house = houseIn(sim, '');
    const opensOnto: Way[] = [];
    if (guard.covers === 'house' && house) {
      opensOnto.push({
        to: at('house', house.id),
        label: house.name || HOUSE.name,
        detail: 'The building this stands around, and the condition of it',
      });
    }
    if (guard.covers === 'lot') {
      opensOnto.push({
        to: at('lot'),
        label: LOT_NAME,
        detail: 'The stages this keeps a lens off',
      });
    }
    if (guard.covers === 'land') {
      opensOnto.push({
        to: at('estate'),
        label: ESTATE_NAME,
        detail: `The ${acresSaid()} acres this runs around`,
      });
    }

    return {
      name: guard.label,
      kind: guard.kind,
      parent: at('security'),
      summary: guard.summary,
      body: (
        <>
          {guard.detail.map((paragraph) => <p key={paragraph.slice(0, 24)} className="small">{paragraph}</p>)}
          <div className="grid grid-3">
            {guard.figures.map((figure) => (
              <Stat key={figure.label} label={figure.label} value={figure.value} note={figure.note} />
            ))}
          </div>
        </>
      ),
      ways: opensOnto,
      provenance: 'Part of the build rather than added to it, which is why none of it looks bolted on. '
        + 'Nothing in SLATE tests any of it.',
    };
  },
});

// ---------------------------------------------------------------------------
// The lot
// ---------------------------------------------------------------------------

interface TheLot { town: City; company: string }

defineLook<TheLot>('lot', {
  gone: 'There are no stages on the land any more.',
  resolve: (sim) => {
    const town = estateTown();
    if (!town) return undefined;
    return { town, company: studioName(surnameIn(sim)) };
  },
  seeds: () => [''],
  look: (lot) => ({
    name: LOT_NAME,
    kind: 'What The Family Built',
    parent: at('estate'),
    summary: 'You can walk to the stages from the house, they’re newly built and standing empty, and nothing '
      + 'has shot on one of them yet.',
    body: (
      <>
        <p className="small">
          Newly built, on the same land, close enough to walk to from the house. Stages for Television and
          Film both — which, in a country with no business to speak of, makes them the only stages there
          are.
        </p>
        <p className="small">
          {lot.company} works out of here, and so far that means a gate, a name on it and a set of empty
          stages. Nothing has been shot on one, nothing is booked onto one, and nobody outside{' '}
          <Open subject={at('place', lot.town.id)}>{lot.town.name}</Open> knows they exist.
        </p>
      </>
    ),
    ways: [
      {
        to: at('company'),
        label: lot.company,
        detail: COMPANY_DETAIL,
      },
      {
        to: at('safeguard', 'lot'),
        label: 'What Keeps A Lens Off It',
        detail: 'Inside the same line the house is, which is why a shoot here can’t be photographed from outside',
      },
    ],
    provenance: 'The lot is the premise. SLATE has no stage bookings, no day rate and no overhead running '
      + 'against it yet.',
  }),
});

// ---------------------------------------------------------------------------
// The company — named, and that is all of it
// ---------------------------------------------------------------------------

interface TheCompany { name: string; namesake: Person; surname: string }

defineLook<TheCompany>('company', {
  gone: 'There’s no name on the gate, so there’s no company to look at.',
  resolve: (sim, id) => {
    const namesake = playerIn(sim);
    if (!namesake) return undefined;
    const surname = namesake.lastName.trim();
    const name = studioName(surname);
    if (id && id !== name) return undefined;
    return { name, namesake, surname };
  },
  seeds: () => [''],
  look: (company) => ({
    name: company.name,
    kind: 'The Family Company',
    parent: at('lot'),
    summary: 'The name on the gate here is your family’s rather than yours, and there’s nothing behind it yet '
      + 'but a set of empty stages.',
    body: (
      <>
        <p className="small">
          Television and Film, run out of the lot on the family land. The name is the family’s rather than
          yours — it came off the surname because that’s where a surname comes from, and it was on the gate
          before you were on the lot.
        </p>
        <p className="small">
          And that’s the whole of it so far. No slate, no picture in development, no credit, no deal and
          nothing anybody has seen. There’s no account in its name, nothing on a schedule and nothing to
          report. It comes to a name, a set of empty stages and a country that hasn’t heard of either.
        </p>
        <p className="small">
          Everybody who reads {company.name} on a call sheet will know which family it belongs to. That’s the
          advantage, and it’s also the whole problem.
        </p>
      </>
    ),
    ways: [{
      to: at('person', company.namesake.id),
      label: nameOf(company.namesake),
      detail: company.surname
        ? `The ${company.surname} the name comes from, and how they’re doing today`
        : 'The person the name would come from, and how they’re doing today',
    }],
    provenance: 'Named, and nothing else. SLATE keeps no books, no slate and no schedule for it yet, so there '
      + 'are no figures here and none are invented.',
  }),
});
