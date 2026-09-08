/**
 * SLATE — the shoot day.
 *
 * The day itself, which is the part of making something yourself that the
 * catalog and the rental counter only lead up to. You pick a day and a place,
 * you ask whoever owns the place whether you can be there, you ring round the
 * people you know and ask them for a favor, you make sure the kit is actually
 * in your hands, and then you shoot it. The weather has a vote. So do the
 * hours, the crew who turned up and whether anybody has ever done this before.
 *
 * Nothing here rolls dice for how the day went and then tells you a story: the
 * day is worked out from what was true about it. Setups you got is setups you
 * planned times what the day could actually carry, and the note says which
 * part cost you.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { CrewRole, Id, Person, ShootCrew, ShootDay } from '../domain/model';
import { clamp } from '../core/rng';
import type { Instant } from '../core/time';
import { MS_DAY, MS_HOUR, MS_MINUTE, addDays, formatDate, zonedParts } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { plural } from '../core/text';
import { CITIES } from '../content/geography';
import { placesIn, type Place } from '../content/places';
import { costOfLiving } from '../content/tax';
import { shootDayWeather } from './weather';
import { addMemory, findRelationship, relationshipsOf, otherParty, relationshipStrength } from './relationships';
import { outNow } from './rental';

// ---------------------------------------------------------------------------
// What a day is made of
// ---------------------------------------------------------------------------

export const CREW_ROLES: readonly CrewRole[] = ['camera', 'sound', 'lighting', 'grip', 'production'];

export const CREW_ROLE_LABEL: Readonly<Record<CrewRole, string>> = {
  camera: 'Camera',
  sound: 'Sound',
  lighting: 'Lighting',
  grip: 'Grip',
  production: 'Producing',
};

/** What each pair of hands is worth to a day, at most. */
const ROLE_WORTH: Readonly<Record<CrewRole, number>> = {
  camera: 0.16,
  sound: 0.10,
  lighting: 0.12,
  grip: 0.08,
  production: 0.09,
};

/** Alone, with nobody, you still get something. This is how much. */
const ALONE = 0.45;

/** A day is this many hours before it is a long day. */
export const STANDARD_HOURS = 10;
/** Nobody plans more than this, and the ones who do regret it. */
export const MAX_HOURS = 14;
export const MIN_HOURS = 2;
/** Setups you can plan for a day. */
export const MAX_SETUPS = 20;
/** What a flat can carry, however ambitious the day is. */
export const HOME_SETUPS = 7;

/** How long a location takes to say yes or no. */
const PERMISSION_DAYS: readonly [number, number] = [1, 4];

/** The fee a place asks, by how dear the place is, before cost of living. */
const PERMISSION_FEE: Readonly<Record<1 | 2 | 3 | 4, Money>> = {
  1: 120_00, 2: 320_00, 3: 850_00, 4: 2_400_00,
};

/** Being moved on off a street, and what it costs the day. */
const MOVED_ON = 0.7;

// ---------------------------------------------------------------------------
// Reading the diary
// ---------------------------------------------------------------------------

export function shootDaysOf(sim: Simulation, personId: Id = sim.player.id): ShootDay[] {
  return Object.values(sim.universe.shootDays)
    .filter((day) => day.personId === personId)
    .sort((a, b) => b.at - a.at);
}

export function shootDayById(sim: Simulation, dayId: Id): ShootDay | undefined {
  return sim.universe.shootDays[dayId];
}

/** The days still to come, which are the ones you can still change. */
export function planned(sim: Simulation, personId: Id = sim.player.id): ShootDay[] {
  return shootDaysOf(sim, personId).filter((day) => day.status === 'planned').sort((a, b) => a.at - b.at);
}

/** Places in this city somebody might let you shoot in. */
export function locationsIn(sim: Simulation, cityId = sim.player.currentLocationId): Place[] {
  return placesIn(cityId)
    .filter((place) => place.kind !== 'rental_house' && place.kind !== 'storage')
    .filter((place) => place.actions.includes('visit') || place.actions.includes('eat') || place.actions.includes('drink'))
    .sort((a, b) => (a.name < b.name ? -1 : 1));
}

/** What a place would ask to let a camera in for a day. */
export function permissionFee(sim: Simulation, place: Place): Money {
  const living = costOfLiving(place.cityId ?? sim.player.currentLocationId);
  const base = PERMISSION_FEE[place.price] ?? PERMISSION_FEE[2];
  // A famous place asks for more than a quiet one of the same price band.
  const fame = 0.8 + (place.quality ?? 60) / 140;
  return Math.round((base * living * fame) / 100) * 100;
}

/** People you actually know well enough to ask for a favor. */
export function askable(sim: Simulation, personId: Id = sim.player.id): Person[] {
  const out: Person[] = [];
  for (const rel of relationshipsOf(sim, personId)) {
    const other = sim.universe.people[otherParty(rel, personId)];
    if (!other) continue;
    if (rel.dimensions.familiarity < 25) continue;
    out.push(other);
  }
  return out.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * What the day can carry, before the weather.
 *
 * Alone with a camera you get less than half of what you planned. Every pair
 * of hands in a role that matters buys some of the rest back, and being good
 * at this buys a little more.
 */
export function capabilityOf(sim: Simulation, day: ShootDay): number {
  let carry = ALONE;
  const filled = new Set<CrewRole>();
  for (const member of day.crew) {
    if (member.answer !== 'yes' || filled.has(member.role)) continue;
    filled.add(member.role);
    carry += ROLE_WORTH[member.role];
  }
  const craft = sim.player.skills?.directing ?? sim.player.skills?.acting ?? 20;
  carry += clamp(craft / 100, 0, 1) * 0.12;
  // A long day gets more done than a short one, up to the point where it does not.
  carry *= clamp(day.hours / STANDARD_HOURS, 0.4, 1.15);
  return clamp(carry, 0.1, 1.25);
}

/** A sentence on where a day stands. */
export function describeDay(sim: Simulation, day: ShootDay): string {
  const yes = day.crew.filter((member) => member.answer === 'yes').length;
  const when = formatDate(day.at, sim.homeZone);
  if (day.status === 'shot') {
    return `${day.got ?? 0} of ${plural(day.setups, 'setup')} in the can, ${when}.`;
  }
  if (day.status === 'abandoned') return `Called off, ${when}.`;
  if (day.permission.status === 'refused') return `${day.placeName} said no. ${when} is free again.`;
  if (day.permission.status === 'asked') return `Waiting on ${day.placeName}, for ${when}.`;
  return `${when}, ${plural(day.hours, 'hour')}, ${yes > 0 ? plural(yes, 'person', 'people') : 'nobody'} coming.`;
}

// ---------------------------------------------------------------------------
// The commands
// ---------------------------------------------------------------------------

export function registerShootSystem(sim: Simulation): void {
  /** Putting a day in the diary. */
  sim.onCommand<
    { title: string; at: Instant; hours?: number; where: 'home' | 'place' | 'street'; placeId?: string; setups?: number },
    { dayId: Id; permissionNeeded: boolean }
  >(
    'shoot.plan',
    (p, { sim: s }) => {
      const title = (p.title ?? '').trim();
      if (title.length < 3) throw new CommandError('Give the day a name, so the call sheet says something.');
      if (p.at < s.now - MS_HOUR) throw new CommandError('You cannot plan a day that has already gone.');
      if (p.at > s.now + 400 * MS_DAY) throw new CommandError('That is more than a year out.');

      const hours = clamp(Math.round(p.hours ?? STANDARD_HOURS), MIN_HOURS, MAX_HOURS);
      const cityId = s.player.currentLocationId;
      let place: Place | undefined;
      if (p.where === 'place') {
        place = placesIn(cityId).find((one) => one.id === p.placeId);
        if (!place) throw new CommandError('That is not somewhere in this city.');
      }
      const home = Object.values(s.universe.properties)
        .find((one) => one.ownerId === s.player.id && one.isPrimaryResidence && !one.soldAt);
      const placeName = p.where === 'place'
        ? place!.name
        : p.where === 'home'
          ? (home?.addressLine ?? home?.name ?? 'Your Own Place')
          : `${CITIES.get(cityId)?.name ?? 'The City'}, On The Street`;

      const cap = p.where === 'home' ? HOME_SETUPS : MAX_SETUPS;
      const setups = clamp(Math.round(p.setups ?? 6), 1, cap);

      const day: ShootDay = {
        id: s.nextId('shoot'),
        saveId: s.universe.meta.id,
        personId: s.player.id,
        title,
        cityId,
        at: p.at,
        hours,
        where: p.where,
        placeId: place?.id,
        placeName,
        permission: {
          needed: p.where === 'place',
          status: 'none',
          fee: place ? permissionFee(s, place) : 0,
        },
        crew: [],
        hireIds: [],
        setups,
        status: 'planned',
      };
      s.universe.shootDays[day.id] = day;

      s.schedule({
        at: day.at,
        kind: 'shoot.call',
        label: `Call: ${title}`,
        category: 'personal',
        payload: { dayId: day.id },
        priority: 80,
        refType: 'shoot', refId: day.id,
      });

      s.emit('shoot.planned', { dayId: day.id, at: day.at, where: day.where });
      return { dayId: day.id, permissionNeeded: day.permission.needed };
    },
  );

  /**
   * Asking whether you can be there.
   *
   * A form, a fee and a wait, which is what it is. A quiet place says yes
   * more often than a famous one, and somebody the city has heard of gets
   * further than somebody it has not.
   */
  sim.onCommand<{ dayId: Id }, { fee: Money; answerBy: Instant }>(
    'shoot.ask_permission',
    (p, { sim: s }) => {
      const day = s.universe.shootDays[p.dayId];
      if (!day) throw new CommandError('No such day.');
      if (day.status !== 'planned') throw new CommandError('That day is over.');
      if (!day.permission.needed) throw new CommandError('Nobody owns that location. You can just turn up.');
      if (day.permission.status !== 'none') throw new CommandError('You have already asked.');

      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('You have no account to pay the fee from.');
      if (s.ledger.availableFunds(accountId) < day.permission.fee) {
        throw new CommandError(`${day.placeName} wants ${formatMoney(day.permission.fee)} up front, and you do not have it.`);
      }

      s.expense(accountId, day.permission.fee, `Location fee — ${day.placeName}`, 'production', { refType: 'shoot', refId: day.id });
      day.permission.status = 'asked';
      day.permission.askedAt = s.now;

      const rng = s.rng('shoot.permission', day.id);
      const wait = rng.int(PERMISSION_DAYS[0], PERMISSION_DAYS[1]);
      const answerBy = Math.min(day.at, addDays(s.now, wait, s.homeZone));
      s.schedule({
        at: answerBy,
        kind: 'shoot.permission',
        label: `${day.placeName} Answers`,
        category: 'personal',
        payload: { dayId: day.id },
        priority: 65,
        refType: 'shoot', refId: day.id,
      });
      s.emit('shoot.permission_asked', { dayId: day.id, fee: day.permission.fee });
      return { fee: day.permission.fee, answerBy };
    },
  );

  /**
   * Ringing somebody up and asking them for a day.
   *
   * This is a favor, not a job: whether they come depends on how well they
   * know you, how warm it is, and whether you asked them for one last week.
   * A yes costs some of the goodwill it was made of.
   */
  sim.onCommand<{ dayId: Id; personId: Id; role: CrewRole }, { answer: 'yes' | 'no'; note: string }>(
    'shoot.ask_crew',
    (p, { sim: s }) => {
      const day = s.universe.shootDays[p.dayId];
      if (!day) throw new CommandError('No such day.');
      if (day.status !== 'planned') throw new CommandError('That day is over.');
      if (!CREW_ROLES.includes(p.role)) throw new CommandError('Nobody does that on a set.');
      if (day.crew.some((member) => member.personId === p.personId)) {
        throw new CommandError('You have already asked them.');
      }
      const person = s.universe.people[p.personId];
      if (!person) throw new CommandError('You do not know anybody by that name.');
      const rel = findRelationship(s, s.player.id, p.personId);
      if (!rel || rel.dimensions.familiarity < 25) {
        throw new CommandError('You do not know them well enough to ask for a day of their time.');
      }

      // How often you have asked lately. Favors are a bucket, not a tap.
      const recent = shootDaysOf(s)
        .filter((other) => other.id !== day.id && s.now - other.at < 30 * MS_DAY)
        .reduce((count, other) => count + other.crew.filter((m) => m.personId === p.personId && m.answer === 'yes').length, 0);

      const strength = relationshipStrength(rel, s.now);
      const rng = s.rng('shoot.crew', day.id, p.personId);
      const chance = clamp(
        0.15 + strength / 160 + rel.dimensions.respect / 400 - recent * 0.18 - rel.dimensions.conflict / 300,
        0.05,
        0.95,
      );
      const yes = rng.float(0, 1) < chance;

      const note = yes
        ? rng.pick([
          `${person.displayName} is in. They will be there for the call.`,
          `${person.displayName} says yes, and asks what they should bring.`,
          `${person.displayName} will come, and can only do the morning if it overruns.`,
        ])
        : rng.pick([
          `${person.displayName} cannot do that day.`,
          `${person.displayName} says no, warmly, and means it kindly.`,
          `${person.displayName} is working. Another time.`,
        ]);

      const member: ShootCrew = { personId: p.personId, name: person.displayName, role: p.role, answer: yes ? 'yes' : 'no', note };
      day.crew.push(member);

      if (yes) {
        // A favor given is a favor spent. It is warm, and it is a debt.
        addMemory(s, rel, {
          kind: 'favour',
          summary: `Gave you a day on ${day.title}.`,
          impact: 6,
          decayDays: 120,
        });
        rel.dimensions.trust = clamp(rel.dimensions.trust + 1.5, 0, 100);
      }

      s.emit('shoot.crew_asked', { dayId: day.id, personId: p.personId, answer: member.answer });
      return { answer: yes ? 'yes' : 'no', note };
    },
  );

  /**
   * The day.
   *
   * The hours go. What you get is what the day could carry: the crew who came,
   * the kit that is actually in your hands, how good you are at this, and then
   * the weather, which does not care what any of that was.
   */
  sim.onCommand<
    { dayId: Id },
    { got: number; setups: number; note: string; hours: number }
  >(
    'shoot.run',
    (p, { sim: s }) => {
      const day = s.universe.shootDays[p.dayId];
      if (!day) throw new CommandError('No such day.');
      if (day.status !== 'planned') throw new CommandError('That day has already been shot or called off.');
      if (s.now < day.at - 12 * MS_HOUR) {
        throw new CommandError(`That day is ${formatDate(day.at, s.homeZone)}. You cannot shoot it early.`);
      }
      if (s.now > day.at + 2 * MS_DAY) throw new CommandError('That day has gone by. Plan another one.');
      if (day.permission.needed && day.permission.status !== 'granted') {
        throw new CommandError(`Nobody at ${day.placeName} has said you can be there.`);
      }
      if (s.player.wellbeing.energy < 15) throw new CommandError('You have nothing left. Sleep first.');

      // Something to shoot on. Hired kit in your hands counts, and so does a
      // camera of your own; nothing counts if it is still on the shelf.
      const hires = outNow(s);
      const ownCamera = Object.values(s.universe.assets).some(
        (asset) => asset.ownerId === s.player.id && !asset.soldAt && asset.tags.includes('camera'),
      );
      if (hires.length === 0 && !ownCamera) {
        throw new CommandError('You have nothing to shoot on. Hire a camera, or buy one.');
      }

      const onStage = day.where === 'home';
      const weather = shootDayWeather(s, day.cityId, day.at, onStage);
      const rng = s.rng('shoot.day', day.id);

      let carry = capabilityOf(s, day);
      const reasons: string[] = [];

      // Kit that is really there. A hire with a camera on it is the difference
      // between a day and an afternoon of holding a phone.
      const pieces = hires.reduce((sum, hire) => sum + hire.lines.reduce((n, line) => n + line.quantity, 0), 0);
      if (hires.length > 0) {
        carry += clamp(pieces / 20, 0, 0.12);
        for (const hire of hires) {
          hire.shootDayIds = [...(hire.shootDayIds ?? []), day.id];
          if (!day.hireIds.includes(hire.id)) day.hireIds.push(hire.id);
        }
      } else {
        carry -= 0.1;
        reasons.push('Shooting on what you own rather than what you would have hired.');
      }

      // The street is the street: somebody comes and asks what you are doing.
      let interruption = 1;
      if (day.where === 'street' && rng.float(0, 1) < 0.35) {
        interruption = MOVED_ON;
        reasons.push('You were moved on halfway through the afternoon.');
      }
      if (weather.note) reasons.push(weather.note);

      const got = clamp(
        Math.round(day.setups * clamp(carry, 0.1, 1.2) * weather.factor * interruption),
        0,
        day.setups,
      );

      // The hours, and what they take out of you.
      s.advanceTo(s.now + day.hours * 60 * MS_MINUTE);
      s.player.wellbeing.energy = clamp(s.player.wellbeing.energy - day.hours * 3.4, 0, 100);
      s.player.wellbeing.stress = clamp(s.player.wellbeing.stress + (got < day.setups ? 8 : 3), 0, 100);

      day.status = 'shot';
      day.got = got;
      day.shotAt = s.now;
      day.weatherNote = weather.note;
      const yes = day.crew.filter((member) => member.answer === 'yes').length;
      const summary = got >= day.setups
        ? `Everything you went for, in ${plural(day.hours, 'hour')}.`
        : got === 0
          ? 'Nothing usable. It happens, and it is nobody’s fault but the day’s.'
          : `${got} of ${plural(day.setups, 'setup')}, with ${yes > 0 ? plural(yes, 'person', 'people') : 'nobody'} on it.`;
      day.note = [summary, ...reasons].join(' ');

      // Whoever came gets the memory of having been there.
      for (const member of day.crew) {
        if (member.answer !== 'yes') continue;
        const rel = findRelationship(s, s.player.id, member.personId);
        if (!rel) continue;
        addMemory(s, rel, {
          kind: 'shared',
          summary: `A day on ${day.title}, ${CREW_ROLE_LABEL[member.role].toLowerCase()}.`,
          impact: got > 0 ? 8 : 3,
          decayDays: 180,
        });
      }

      s.notify({
        title: got >= day.setups ? 'The Day Is In The Can' : 'Wrapped',
        body: day.note,
        category: 'personal',
        importance: 55,
        route: '/workspace/film',
        refType: 'shoot', refId: day.id,
      });
      s.emit('shoot.wrapped', { dayId: day.id, got, setups: day.setups });
      return { got, setups: day.setups, note: day.note, hours: day.hours };
    },
  );

  /** Calling it off, which is better than turning up to nothing. */
  sim.onCommand<{ dayId: Id }, { dayId: Id }>(
    'shoot.abandon',
    (p, { sim: s }) => {
      const day = s.universe.shootDays[p.dayId];
      if (!day) throw new CommandError('No such day.');
      if (day.status !== 'planned') throw new CommandError('That day is already over.');
      day.status = 'abandoned';
      day.note = 'Called off before the call.';
      s.emit('shoot.abandoned', { dayId: day.id });
      return { dayId: day.id };
    },
  );

  // --- What happens without you ---------------------------------------------

  /** The location comes back with an answer. */
  sim.onSchedule('shoot.permission', (item, s) => {
    const day = s.universe.shootDays[(item.payload as { dayId: Id }).dayId];
    if (!day || day.permission.status !== 'asked' || day.status !== 'planned') return;
    const place = day.placeId ? placesIn(day.cityId).find((one) => one.id === day.placeId) : undefined;

    const rng = s.rng('shoot.answer', day.id);
    // A quiet place says yes more often than a famous one, and a name the city
    // knows gets further than one it does not.
    const quality = place?.quality ?? 60;
    const fame = clamp((s.player.reputation?.publicFame ?? 0) / 100, 0, 1);
    const chance = clamp(0.85 - quality / 220 + fame * 0.2, 0.15, 0.95);
    const yes = rng.float(0, 1) < chance;

    day.permission.status = yes ? 'granted' : 'refused';
    day.permission.decidedAt = s.now;
    day.permission.note = yes
      ? rng.pick([
        'They said yes, with a list of what you must not touch.',
        'Granted, on the condition you are out by six.',
        'Yes, and they asked for a credit.',
      ])
      : rng.pick([
        'They said no, without saying why.',
        'They have somebody else in that day.',
        'No. Their insurer will not have a camera in there.',
      ]);

    if (!yes) {
      // A refusal returns the fee. Nobody keeps money for a day you cannot have.
      const accountId = s.player.primaryAccountId;
      if (accountId && day.permission.fee > 0) {
        s.income(accountId, day.permission.fee, `Location fee returned — ${day.placeName}`, 'production');
      }
    }

    s.notify({
      title: yes ? 'You Can Be There' : 'They Said No',
      body: `${day.placeName}: ${day.permission.note}${yes ? '' : ` ${formatMoney(day.permission.fee)} is back with you.`}`,
      category: 'personal',
      importance: yes ? 50 : 62,
      route: '/workspace/film',
      refType: 'shoot', refId: day.id,
    });
    s.emit('shoot.permission_answered', { dayId: day.id, granted: yes });
  });

  /** The morning of. */
  sim.onSchedule('shoot.call', (item, s) => {
    const day = s.universe.shootDays[(item.payload as { dayId: Id }).dayId];
    if (!day || day.status !== 'planned') return;
    const parts = zonedParts(day.at, s.homeZone);
    const yes = day.crew.filter((member) => member.answer === 'yes').length;
    s.notify({
      title: `Call Today: ${day.title}`,
      body: `${day.placeName}, ${plural(day.hours, 'hour')}, ${yes > 0 ? plural(yes, 'person', 'people') : 'nobody'} coming.`
        + (day.permission.needed && day.permission.status !== 'granted' ? ' Nobody has said you can be there.' : ''),
      category: 'personal',
      importance: 70,
      route: '/workspace/film',
      refType: 'shoot', refId: day.id,
    });
    void parts;
  });
}
