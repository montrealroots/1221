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
 * The company was the honest one and then stopped being. It is named — the
 * surname is the family name, so it names itself — and on the day a save opens
 * that really is the whole of it. This said so in a sentence rather than
 * printing a zero it could not stand behind, which was right, and then it went
 * on saying so for twenty-five years and thirty delivered pictures, which was
 * not. It counts the slate, the material and the company’s cash now, and the
 * empty save still reads the way it did, because on that day the counts are
 * nought for real.
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
import { SELLING } from '@/engine/content/lot';
import {
  bookingsFor, breakEvenShare, monthlyOverhead, onStageAt, paidInSoFar, pullOn, sellsFor, stagesOn, standingWith,
  keepsRinging, turnedAway, utilisation, whatTheFamilySays, whereTheLotStands,
} from '@/engine/world/lot';
import { formatMoney } from '@/engine/core/money';
import { companyCash, holdingsOf, projectsOf } from '@/engine/world/company';
import { formatDate, MS_DAY } from '@/engine/core/time';

const moneyOf = (cents: number): string => formatMoney(cents, { cents: false });

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
const COMPANY_DETAIL = 'The company’s headquarters, Television and Film both, with the family name on the gate';

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
  look: (land, { sim }) => {
    // "Nothing shot on one yet" was true for the first week of a save and then
    // wrong for the rest of it, on the one way in that decides whether anybody
    // opens the lot at all. Counted instead, off the bookings, which is where
    // the rest of this file already reads occupancy from.
    const everLet = stagesOn(sim).some((stage) => bookingsFor(sim, stage.id).length > 0);
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
      detail: everLet
        ? 'Four stages on the same land, close enough to walk to, and what they have been let for'
        : 'Newly built stages on the same land, close enough to walk to, and nothing shot on one yet',
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
              note="Nobody to answer to about it"
            />
          </div>
        </>
      ),
      ways,
      provenance: 'The acreage, the house and the lot were true before your first day started. SLATE '
        + 'never buys, sells or prices any of it.',
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
          ? `You sleep here, it’s at ${outOf(kept)}, and a night in a house in this shape puts `
            + 'back more than a night in one that isn’t.'
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
            Condition is the one figure in this house that moves on its own, and left alone it only
            moves one way. It sets how much a night here gives you back. Having the work done puts it
            back to a hundred and is charged by the point, so a year of it costs about what a year of
            wear took off. At {outOf(kept)} it’s
            {kept >= 100
              ? ' as high as it goes, because the house is barely a year old.'
              : kept >= 70 ? ' working for you.' : ' costing you sleep you’d otherwise have had.'}
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
            <Stat label="What It Costs You" value="Nothing" note="Nobody to answer to about it" />
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
                  + `the ${heads.length === 1 ? 'head' : 'heads'} of it. The land was theirs before it was `
                  + 'yours, and this is what that means day to day.'}
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
          <Stat label="Roads In" value="1" note="Watched around the clock" />
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
        detail: `First in the world for peace every year since ${PEACE_RANKED_SINCE}. That’s what makes all of the above remarkable`,
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
      provenance: 'It went in with the build, so none of it looks bolted on. SLATE never tests any of it.',
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
  look: (lot, { sim }) => {
    const stages = stagesOn(sim);
    const month = utilisation(sim, sim.now - 30 * MS_DAY, sim.now);
    const need = breakEvenShare(sim);
    const took = month.earnsShare ?? 0;
    const standing = standingWith(sim);
    const aMonth = monthlyOverhead(sim);
    const aYear = aMonth * 12;
    const pull = pullOn(sim);
    const away = turnedAway(sim);
    const never = keepsRinging(sim);
    return {
    name: LOT_NAME,
    kind: 'What The Family Built',
    parent: at('estate'),
    summary: whereTheLotStands(sim),
    body: (
      <>
        <p className="small">
          On the same land, close enough to walk to from the house. Stages for Television and Film both.
          In a country with no business to speak of, they’re the only stages there are — and being the
          only stages in Iceland is worth less than it sounds, because what a production is choosing
          between is here and Budapest.
        </p>
        <div className="grid grid-3">
          <Stat label="What A Month Costs" value={moneyOf(aMonth)}
            note={`${moneyOf(aYear)} a year, whether or not anybody is standing on a stage`} />
          <Stat label="What Last Month Took"
            value={`${Math.round(took * 100)}/100`}
            tone={need !== undefined && took < need ? 'negative' : 'positive'}
            note={need === undefined
              ? 'Of what a full month is worth'
              : `Of what a full month is worth. It needs ${Math.round(need * 100)}/100 to cover itself`} />
          <Stat label="What The Family Has Put In" value={moneyOf(paidInSoFar(sim))}
            tone={standing.conditional ? 'negative' : undefined}
            note={`${Math.round(standing.share * 100)}/100 of a year of the group’s profit`} />
        </div>
        <p className="small">{whatTheFamilySays(sim)}</p>
        <p className="small">
          {month.taken <= 0
            ? 'Nobody was on a stage at all last month.'
            : <>
              Of the {said(Math.round(month.taken), 'stage-week')} anybody was on last month,{' '}
              {Math.round(month.strike) === 0
                ? 'none was load-out'
                : `${said(Math.round(month.strike), 'week')} of it was somebody taking a set down`}
              {month.own > 0 && ` and ${said(Math.round(month.own), 'week')} of it was the family’s own
                picture, which pays nothing and would have let for ${moneyOf(month.ownWouldHaveLetFor)}`}.
              {' '}A room with a unit striking in it is a room nobody else can have, and load-out is
              charged at the build rate. A busy month and a paid month are two different months.
            </>}
        </p>
        <h4>Who Rings</h4>
        <div className="table-wrap">
        <table className="table">
          <tbody>
            <tr>
              <td className="nowrap">Calls A Month</td>
              <td className="small nowrap">{pull.calls.toFixed(1)}</td>
              <td className="small">What it started at was one. The rest is earned.</td>
            </tr>
            <tr>
              <td className="nowrap">Spent On Being Known</td>
              <td className="small money nowrap">{moneyOf(sellsFor(sim))} a month</td>
              <td className="small">
                {Math.round(pull.reach * 100)}/100 of the way to everybody who books a stage. The
                floor is {moneyOf(SELLING.floor)}, and the market takes {SELLING.remembers} months
                to notice a lot and as long again to forget one.
              </td>
            </tr>
            <tr>
              <td className="nowrap">Crew In The Country</td>
              <td className="small nowrap">{Math.round(pull.crew * 100)}/100</td>
              <td className="small">
                Against what there was on the first day. Every picture made here leaves people
                behind, and a country you can crew in is a country worth calling.
              </td>
            </tr>
            {away.map((one) => (
              <tr key={one.why}>
                <td className="nowrap">{one.count} Turned Away</td>
                <td className="small nowrap" />
                <td className="small">{one.said}.</td>
              </tr>
            ))}
            {never.map((one) => (
              <tr key={one.officeId}>
                <td className="nowrap">{one.from}</td>
                <td className="small nowrap">{said(one.times, 'call')}, none booked</td>
                <td className="small">{one.because}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <p className="small">
          A producer in Reykjavik knows the stages are there whatever anybody spends. A desk in Los
          Angeles hears about a show after the budget is locked unless the lot was in that
          conversation first, so money spent on being known buys calls from abroad — and most of what
          it buys is productions the rebate was never built for.
        </p>
        <h4>The Stages</h4>
        <div className="table-wrap">
        <table className="table">
          <tbody>
            {stages.map((stage) => {
              const on = onStageAt(sim, stage.id, sim.now);
              // What is booked after today, which is the part that was missing.
              // This table said who was in a room right now and stopped, and
              // the lot is the only pipeline a career has: every part the
              // player is ever asked about comes from a production that booked
              // a stage here, months before anybody rings. A board that shows
              // only today is a board that cannot be read ahead, which is the
              // one thing a board is for.
              const coming = bookingsFor(sim, stage.id)
                .filter((one) => one.from > sim.now && one.kind === 'shooting')
                .slice(0, 2);
              return (
                <tr key={stage.id}>
                  <td className="nowrap">{stage.name}</td>
                  <td className="small nowrap">{stage.floorSqm.toLocaleString('en-US')} m²</td>
                  <td className="small nowrap">{stage.clearHeightM} m to the grid</td>
                  <td className="small money nowrap">{moneyOf(stage.weekRateCents)} a week</td>
                  <td className="small">{on ? `${on.holder}, through ${formatDate(on.to, sim.homeZone)}` : 'Empty'}</td>
                  <td className="small">
                    {coming.length === 0
                      ? <span className="dim">Open from today on</span>
                      : coming.map((one) => (
                        <div key={one.id}>
                          {one.holder}, from {formatDate(one.from, sim.homeZone)}
                        </div>
                      ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        <p className="small">
          {lot.company} works out of here, and nobody outside{' '}
          <Open subject={at('place', lot.town.id)}>{lot.town.name}</Open> has much reason to know it.
          A lot with nothing on it is the same money every month as a lot that’s full.
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
        detail: 'Inside the same line as the house, so nothing shooting here can be photographed from outside',
      },
    ],
    provenance: 'The rate card, the overhead and what the family will carry are all SLATE’s own, '
      + 'worked out from what a lot this size costs to build and to keep open.',
    };
  },
});

// ---------------------------------------------------------------------------
// The company — named, and that is all of it
// ---------------------------------------------------------------------------

interface TheCompany { name: string; namesake: Person; surname: string }

/**
 * The family company, read out of the save rather than out of the day it opened.
 *
 * Every sentence on this page used to be a fact about a brand-new save, written
 * once and true for about five minutes: there was nothing behind the name but
 * empty stages, no slate, nothing in development, no credit, no deal, nobody
 * had seen anything, and — in the provenance line — SLATE kept no books for it,
 * so there were no figures and none were invented. By then the company had an
 * account, a ledger, four posts with people in them, a slate and delivered
 * pictures. A career could run twenty-five years, make thirty-odd films and
 * clear two hundred million, and this page still said it had a name and not
 * much else.
 *
 * That is the worse half of a stale page. A missing screen tells you nothing; a
 * screen like this one told you something false and sounded certain about it.
 * So all of it is counted now — `projectsOf`, `holdingsOf` and the company’s own
 * cash — and the empty save reads the way it always did because the counts
 * really are nought on the day it opens.
 */
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
  look: (company, { sim }) => {
    const projects = projectsOf(sim.universe);
    const delivered = projects.filter((one) => one.stage === 'delivered').length;
    const making = projects.length - delivered;
    const rights = holdingsOf(sim.universe).length;
    const cash = companyCash(sim.universe);
    const nothingYet = projects.length === 0 && rights === 0;

    return {
      name: company.name,
      kind: 'The Family Company',
      parent: at('lot'),
      summary: nothingYet
        ? 'The name on the gate is your family’s, not yours, and there’s nothing behind it yet but a '
          + 'set of empty stages.'
        : `The name on the gate is your family’s, not yours, and ${delivered > 0
          ? `${plural(delivered, 'picture')} ${delivered === 1 ? 'has' : 'have'} gone out under it`
          : 'there’s work behind it now'}.`,
      body: (
        <>
          <p className="small">
            Television and Film, and this is where the company is headquartered — it doesn’t rent space on
            somebody else’s lot, because the stages, the offices and the gate are all the same piece of
            family land. The name is the family’s, not yours. It came off the surname, and it was on the
            gate before you were on the lot.
          </p>
          <p className="small">
            {nothingYet
              ? 'That’s as far as it goes so far. There’s no slate, nothing in development, no credit and '
                + 'no deal. Nobody has seen anything. It comes to a name, a set of empty stages, and a '
                + 'country that hasn’t heard of either.'
              : `${toStart(spokenList([
                delivered > 0 ? `${plural(delivered, 'picture')} delivered` : '',
                making > 0 ? `${plural(making, 'picture')} still in hand` : '',
                rights > 0 ? `${plural(rights, 'piece')} of material held` : '',
              ].filter((one) => one.length > 0)))}, and ${moneyOf(cash)} in the company account. `
                + 'What that came from is on the lot’s own page and in the ledger, line by line.'}
          </p>
          <p className="small">
            Everybody who reads {company.name} on a call sheet will know which family it belongs to. That’s
            the advantage. It’s also the problem.
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
      provenance: nothingYet
        ? 'The slate, the material and the money are all nought because nothing has happened yet, and the '
          + 'moment something does this page counts it. None of it is invented.'
        : 'Counted off the save — the projects, the material held and the company’s own cash balance. Not '
          + 'one figure here was typed by hand.',
    };
  },
});
