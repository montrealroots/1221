/**
 * SLATE — the fashion weeks.
 *
 * A real week, in the city and the month it really runs in, with real houses
 * on the schedule. You write to a house and ask for a seat; whether you get
 * one, and which row it is in, is who you are — how many people know your
 * name, what the industry thinks of you, and whether you have ever bought
 * anything the house makes. Then you turn up, and what you are wearing is
 * looked at, because that is what the row of photographers outside is for.
 *
 * Nothing here announces that any house is showing anywhere. The season
 * schedule is published a few weeks out and moves every year, and the note on
 * the page says so.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { FashionInvite, Id, OwnedAsset, Person } from '../domain/model';
import { clamp } from '../core/rng';
import type { Instant } from '../core/time';
import { MS_DAY, MS_HOUR, MS_MINUTE, addDays, formatDate, formatTime, zonedParts } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { plural } from '../core/text';
import { CITIES } from '../content/geography';
import { costOfLiving } from '../content/tax';
import {
  AHEAD_OF_THE_YEAR, ANSWER_DAYS, FASHION_WEEKS, type FashionWeek, SEASON_LABEL, SEAT_LABEL,
  SEAT_THRESHOLD,
  SEAT_BAR_SHARE, SEAT_WEIGHT, SHOW_DAYS, SHOW_HOURS, SHOW_MINUTES, type Season, type Seat,
  type ShowingHouse,
  TURNING_UP_COST, WEEK_BY_ID, housesAt, weeksFor,
} from '../content/fashionweeks';
import { appraise, emptySlots, garmentsOf, recentRepeat, wearing } from './wardrobe';
import { ESSENTIAL_SLOTS, SLOT_LABEL } from '../content/wardrobe';

// ---------------------------------------------------------------------------
// The calendar
// ---------------------------------------------------------------------------

/** One edition of one week: a city, a season and the days it runs. */
export interface Edition {
  id: string;
  weekId: string;
  week: FashionWeek;
  season: Season;
  year: number;
  startsAt: Instant;
  endsAt: Instant;
}

/**
 * A season's name runs a year ahead of the calendar.
 *
 * The trade names a collection for the season it arrives in rather than the
 * month it was shown in, so a September spring/summer show is next year's
 * spring and a November show of the southern winter is next year's winter.
 * A festive collection shown in October is for the festive season two months
 * later, so it keeps the year it was shown in.
 */
export function seasonYear(season: Season, month: number, year: number): number {
  if (AHEAD_OF_THE_YEAR[season] && month >= 6) return year + 1;
  // South of the equator the winter collection shown late in the year is for
  // the winter that arrives halfway through the next one.
  if (season === 'autumn_winter' && month >= 10) return year + 1;
  return year;
}

const EDITION_CACHE = new Map<string, Edition[]>();

/** Every edition of every week in a calendar year, in order. */
export function editionsIn(sim: Simulation, year: number): Edition[] {
  const key = `${sim.universe.meta.id}:${year}`;
  const cached = EDITION_CACHE.get(key);
  if (cached) return cached;
  const out: Edition[] = [];
  for (const week of FASHION_WEEKS) {
    const zone = CITIES.get(week.cityId)?.timeZone ?? sim.zone;
    for (const edition of week.editions) {
      const { month, season } = edition;
      // The exact day inside the window is SLATE's own, but it is stable for a
      // given year and week, so a save's calendar does not move underneath the
      // player between one look and the next.
      const day = sim.rng('fw.edition', week.id, year, month)
        .int(edition.days[0], edition.days[1]);
      const startsAt = Date.UTC(year, month - 1, day, 9) - zoneOffset(zone, year, month, day);
      out.push({
        id: `${week.id}-${year}-${month}`,
        weekId: week.id,
        week,
        season,
        year: seasonYear(season, month, year),
        startsAt,
        endsAt: startsAt + SHOW_DAYS * MS_DAY,
      });
    }
  }
  const list = out.sort((a, b) => a.startsAt - b.startsAt);
  EDITION_CACHE.set(key, list);
  return list;
}

/**
 * The editions you could actually ask for a seat at.
 *
 * A week with no houses on it here is still a real week that really runs; it
 * is that SLATE only carries the houses its catalog sells, which are the Paris,
 * Milan, London and New York ones. The calendar shows the rest and says why
 * there is nothing to ask for.
 */
export function editionsWithShows(sim: Simulation, within = 400 * MS_DAY): Edition[] {
  return upcomingEditions(sim, within).filter((edition) => housesAt(edition.weekId).length > 0);
}

/** The offset a zone was at on a date, so a start hour is a local hour. */
function zoneOffset(zone: string, year: number, month: number, day: number): number {
  const at = Date.UTC(year, month - 1, day, 9);
  const parts = zonedParts(at, zone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return asUtc - at;
}

/** Editions that have not finished yet, soonest first. */
export function upcomingEditions(sim: Simulation, within = 400 * MS_DAY): Edition[] {
  const thisYear = zonedParts(sim.now, sim.zone).year;
  return [...editionsIn(sim, thisYear), ...editionsIn(sim, thisYear + 1)]
    .filter((edition) => edition.endsAt >= sim.now && edition.startsAt <= sim.now + within);
}

export function editionById(sim: Simulation, editionId: string): Edition | undefined {
  const year = Number(editionId.split('-').at(-2));
  if (!Number.isFinite(year)) return undefined;
  return editionsIn(sim, year).find((edition) => edition.id === editionId);
}

/** One house's show inside one edition: a day, an hour and a room. */
export interface Show {
  id: string;
  editionId: string;
  house: ShowingHouse;
  at: Instant;
  venue: string;
}

const VENUES = [
  'a tent in the park', 'a hall nobody uses the rest of the year', 'the house’s own courtyard',
  'a car park under a bridge', 'a museum after hours', 'a disused railway shed',
  'the top floor of a department store', 'an atrium with the lights taken out',
  'a townhouse with the furniture removed', 'a swimming pool that has been drained',
];

/** Every show in an edition, in the order they happen. */
export function showsIn(sim: Simulation, edition: Edition): Show[] {
  const houses = housesAt(edition.weekId);
  // The biggest names anchor the end of the week, which is how a schedule
  // really lays itself out: the openings are for the people nobody has to fly
  // in for. Shows are dealt into the days from the back forwards.
  const ordered = [...houses].reverse();
  const perDay = Math.max(1, Math.ceil(ordered.length / SHOW_DAYS));
  return ordered.map((house, index) => {
    const rng = sim.rng('fw.show', edition.id, house.brand);
    const day = clamp(Math.floor(index / perDay), 0, SHOW_DAYS - 1);
    // Two houses never show in the same room at the same minute: the hour is
    // the slot inside the day rather than a draw.
    const slot = index % perDay;
    // The slots are spread across the day the shows really run over, rather
    // than stacked into the first hours of it.
    const hour = SHOW_HOURS[Math.min(SHOW_HOURS.length - 1, Math.floor((slot * SHOW_HOURS.length) / perDay))]!;
    return {
      id: `${edition.id}-${house.brand.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
      editionId: edition.id,
      house,
      at: edition.startsAt + day * MS_DAY + (hour - 9) * MS_HOUR + rng.int(0, 5) * 5 * MS_MINUTE,
      venue: VENUES[(index * 3 + day) % VENUES.length]!,
    };
  }).sort((a, b) => a.at - b.at);
}

export function showById(sim: Simulation, showId: string): { edition: Edition; show: Show } | undefined {
  for (const edition of upcomingEditions(sim, 400 * MS_DAY)) {
    const show = showsIn(sim, edition).find((one) => one.id === showId);
    if (show) return { edition, show };
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Who you are
// ---------------------------------------------------------------------------

/** What you own by a house, which is the only claim on it anybody respects. */
export function piecesBy(sim: Simulation, brand: string, personId: Id = sim.player.id): OwnedAsset[] {
  return garmentsOf(sim, personId).filter((asset) => asset.brand === brand);
}

/** What a wardrobe is worth, which says roughly who its owner is. */
export function wardrobeValue(sim: Simulation, personId: Id = sim.player.id): Money {
  return garmentsOf(sim, personId).reduce((sum, asset) => sum + (asset.purchasePrice ?? 0), 0);
}

/**
 * What a house thinks of you, out of a hundred.
 *
 * A seat is not sold, so money on its own buys nothing. What it takes is that
 * somebody has heard of you, that the industry thinks something of you, and
 * that you have some relationship with the house — which for almost everybody
 * means having bought from it.
 */
export function standingWith(sim: Simulation, house: ShowingHouse, person: Person = sim.player): number {
  const reputation = person.reputation;
  const known = reputation.publicFame * 0.5 + reputation.prestige * 0.28
    + reputation.professionalReputation * 0.12;
  const owned = piecesBy(sim, house.brand, person.id);
  // A customer of the house is somebody the house knows, and a good customer
  // is somebody the house wants in the room.
  const spent = owned.reduce((sum, asset) => sum + (asset.purchasePrice ?? 0), 0);
  const customer = clamp(owned.length * 3 + spent / 250_00, 0, 40);
  // Being seen in it is worth more than owning it.
  const worn = owned.filter((asset) => (asset.wardrobe?.timesWorn ?? 0) > 0).length;
  const controversy = reputation.controversy * 0.18;
  return clamp(Math.round(known + customer + Math.min(worn, 6) - controversy), 0, 100);
}

/** The best seat a house would give you, or nothing at all. */
export function seatFor(sim: Simulation, house: ShowingHouse, person: Person = sim.player): Seat | undefined {
  const standing = standingWith(sim, house, person);
  // A bigger name on the schedule is a harder room, and the four are harder
  // still than that.
  const week = WEEK_BY_ID[house.weekId];
  const bar = (house.standing - 70) * 0.55 + ((week?.selectivity ?? 60) - 60) * 0.35;
  for (const seat of ['front_row', 'second_row', 'back', 'standing'] as const) {
    if (standing >= SEAT_THRESHOLD[seat] + bar * SEAT_BAR_SHARE[seat]) return seat;
  }
  return undefined;
}

/** What it would cost you to turn up to something photographed, here. */
export function turningUpCost(cityId: string): Money {
  return Math.round((TURNING_UP_COST * costOfLiving(cityId)) / 100) * 100;
}

// ---------------------------------------------------------------------------
// Your own invitations
// ---------------------------------------------------------------------------

export function invitesOf(sim: Simulation, personId: Id = sim.player.id): FashionInvite[] {
  return Object.values(sim.universe.fashionInvites)
    .filter((invite) => invite.personId === personId)
    .sort((a, b) => a.at - b.at);
}

/** Invitations for a show that has not happened yet. */
export function upcomingInvites(sim: Simulation, personId: Id = sim.player.id): FashionInvite[] {
  return invitesOf(sim, personId).filter((invite) => invite.status === 'accepted' && invite.at > sim.now);
}

/** An invitation in a sentence. */
export function describeInvite(sim: Simulation, invite: FashionInvite): string {
  const zone = CITIES.get(invite.cityId)?.timeZone ?? sim.zone;
  if (invite.status === 'asked') return `Asked ${formatDate(invite.askedAt, zone)}. No answer yet.`;
  if (invite.status === 'refused') return invite.note ?? 'They didn’t write back.';
  if (invite.status === 'declined') return 'You said no.';
  if (invite.status === 'missed') return 'You never turned up, and the seat sat empty in front of everybody.';
  if (invite.attended) {
    return `${SEAT_LABEL[invite.seat as Seat]} at ${invite.weekName}, ${formatDate(invite.at, zone)}, `
      + `in ${invite.venue}. ${formatMoney(invite.attended.cost)} to get there and be ready for it.`;
  }
  return `${SEAT_LABEL[invite.seat as Seat]}, ${formatDate(invite.at, zone)} at ${formatTime(invite.at, zone)}.`;
}

/** How long before a show they will let you in, and how long after they will not. */
export const DOORS_OPEN_MINUTES = 60;
export const DOORS_SHUT_MINUTES = 15;

// ---------------------------------------------------------------------------
// The commands
// ---------------------------------------------------------------------------

export function registerFashionSystem(sim: Simulation): void {
  /**
   * Writing to a house.
   *
   * You ask, and then you wait. Nobody sells a seat and nobody can be talked
   * into one: the answer is what the house makes of you.
   */
  sim.onCommand<{ showId: string }, { answerAt: Instant; house: string; when: Instant }>(
    'fw.request',
    (p, { sim: s }) => {
      const found = showById(s, p.showId);
      if (!found) throw new CommandError('That isn’t a show on any schedule you can see.');
      const { edition, show } = found;
      if (show.at < s.now) throw new CommandError('That show has been and gone.');
      if (show.at < s.now + 3 * MS_DAY) {
        throw new CommandError('That’s in less than three days. The list closed a fortnight ago.');
      }
      const already = invitesOf(s).find(
        (invite) => invite.showId === show.id && invite.status !== 'refused' && invite.status !== 'declined',
      );
      if (already) throw new CommandError(`You have already written to ${show.house.brand} about that one.`);

      const answerAt = Math.min(
        show.at - MS_DAY,
        addDays(s.now, s.rng('fw.wait', show.id).int(ANSWER_DAYS[0], ANSWER_DAYS[1]), s.homeZone),
      );

      const invite: FashionInvite = {
        id: s.nextId('invite'),
        saveId: s.universe.meta.id,
        personId: s.player.id,
        weekId: edition.weekId,
        weekName: edition.week.name,
        editionId: edition.id,
        showId: show.id,
        brand: show.house.brand,
        cityId: edition.week.cityId,
        season: `${SEASON_LABEL[edition.season]} ${edition.year}`,
        venue: show.venue,
        at: show.at,
        askedAt: s.now,
        status: 'asked',
      };
      s.universe.fashionInvites[invite.id] = invite;

      s.schedule({
        at: answerAt,
        kind: 'fw.answer',
        label: `${show.house.brand} Answers`,
        category: 'personal',
        payload: { inviteId: invite.id },
        priority: 55,
      });
      s.emit('fw.requested', { inviteId: invite.id, brand: show.house.brand });
      return { answerAt, house: show.house.brand, when: show.at };
    },
  );

  /** Saying no, which is allowed and is remembered by nobody. */
  sim.onCommand<{ inviteId: Id }, { inviteId: Id }>(
    'fw.decline',
    (p, { sim: s }) => {
      const invite = s.universe.fashionInvites[p.inviteId];
      if (!invite) throw new CommandError('No such invitation.');
      if (invite.status !== 'accepted' && invite.status !== 'asked') {
        throw new CommandError('There’s nothing to turn down.');
      }
      invite.status = 'declined';
      s.emit('fw.declined', { inviteId: invite.id });
      return { inviteId: invite.id };
    },
  );

  /**
   * Turning up.
   *
   * What you are wearing is looked at, and the looking is the point: the
   * mirror's verdict, whether it is the house's own, whether the room has seen
   * it on you before, and how close to the front you were sat.
   */
  sim.onCommand<
    { inviteId: Id },
    { verdict: number; photographed: boolean; note: string; look: string; cost: Money }
  >(
    'fw.attend',
    (p, { sim: s }) => {
      const invite = s.universe.fashionInvites[p.inviteId];
      if (!invite) throw new CommandError('No such invitation.');
      if (invite.status === 'attended') throw new CommandError('You have already been to that one.');
      if (invite.status !== 'accepted') throw new CommandError('You don’t have a seat at that show.');
      if (s.now < invite.at - DOORS_OPEN_MINUTES * MS_MINUTE) {
        const zone = CITIES.get(invite.cityId)?.timeZone ?? s.zone;
        throw new CommandError(
          `That’s at ${formatTime(invite.at, zone)} on ${formatDate(invite.at, zone)}. Nobody is inside yet.`,
        );
      }
      if (s.now > invite.at + DOORS_SHUT_MINUTES * MS_MINUTE) {
        invite.status = 'missed';
        throw new CommandError('They started without you. A show doesn’t wait.');
      }
      if (s.player.currentLocationId !== invite.cityId) {
        throw new CommandError(
          `The show is in ${CITIES.get(invite.cityId)?.name ?? 'another city'} and you aren’t.`,
        );
      }

      const worn = wearing(s, s.player.id);
      if (worn.length === 0) {
        throw new CommandError('You aren’t dressed. Nobody walks into that room in whatever they slept in.');
      }
      // Wearing something is not the same as being dressed. The mirror's own
      // rule about what an outfit is missing is the rule at the door.
      const missing = emptySlots(worn).filter((slot) => ESSENTIAL_SLOTS.includes(slot));
      if (missing.length > 0) {
        throw new CommandError(
          `You have no ${missing.map((slot) => SLOT_LABEL[slot].toLowerCase()).join(' and no ')}. `
          + 'That room photographs everybody who walks into it.',
        );
      }

      const accountId = s.player.primaryAccountId;
      const cost = turningUpCost(invite.cityId);
      if (!accountId) throw new CommandError('You have no account to pay for the car and the rest of it from.');
      if (s.ledger.availableFunds(accountId) < cost) {
        throw new CommandError(`Getting there and being ready for it is ${formatMoney(cost)}, and you don’t have it.`);
      }
      s.expense(accountId, cost, `${invite.brand} show — ${invite.weekName}`, 'leisure', {
        refType: 'invite', refId: invite.id,
      });

      // What the mirror says, and then what the room adds to it.
      // A front row is not a black tie room: it is the most directional thing
      // you own, and the wardrobe has a code for exactly that.
      const appraisal = appraise(s, worn, { occasion: 'fashion_show', personId: s.player.id });
      const houseOn = worn.filter((asset) => asset.brand === invite.brand).length;
      const onSchedule = worn.filter(
        (asset) => asset.brand && weeksFor(asset.brand).some((one) => one.weekId === invite.weekId),
      ).length;
      const repeat = recentRepeat(s, s.player.id, worn);

      let verdict = appraisal.verdict;
      const looks: string[] = [];
      if (houseOn > 0) {
        verdict += Math.min(14, houseOn * 7);
        looks.push(`You wore the house’s own, which is the only compliment that room reads.`);
      } else if (onSchedule > 0) {
        verdict += 5;
        looks.push('You wore somebody else on this week’s schedule, which is a near miss and reads as one.');
      } else {
        looks.push('Nothing you had on shows here, and everybody in that room can tell.');
      }
      if (repeat?.photographed) {
        verdict -= 12;
        looks.push(`They photographed you in this ${plural(repeat.days, 'day')} ago.`);
      }
      verdict = clamp(Math.round(verdict), 0, 100);

      // Whether anybody points a camera at you is where you were sat and how
      // many people already know your face.
      const seat = invite.seat as Seat;
      const rng = s.rng('fw.room', invite.id);
      const attention = SEAT_WEIGHT[seat] * (0.35 + s.player.reputation.publicFame / 140)
        * (0.6 + verdict / 160);
      const photographed = rng.float(0, 1) < clamp(attention, 0.02, 0.96);

      const note = photographed
        ? verdict >= 78
          ? 'Photographed on the way in, and again on the way out. Somebody will run it.'
          : verdict >= 55
            ? 'Two photographers took you on the way in. It will end up somewhere.'
            : 'They photographed you, which given what you had on isn’t entirely good news.'
        : seat === 'standing'
          ? 'Nobody looked at you once, which standing at the back is for.'
          : 'You got in, sat down, watched it and left. Nobody took a picture.';

      s.advanceTo(s.now + SHOW_MINUTES * MS_MINUTE);
      s.player.wellbeing.energy = clamp(s.player.wellbeing.energy - 14, 0, 100);
      s.player.wellbeing.stress = clamp(s.player.wellbeing.stress + (photographed ? 6 : 2), 0, 100);

      if (photographed) {
        const move = (verdict - 45) / 22 * SEAT_WEIGHT[seat];
        s.player.reputation.publicFame = clamp(s.player.reputation.publicFame + Math.abs(move) * 0.8, 0, 100);
        if (move > 0) {
          s.player.reputation.prestige = clamp(s.player.reputation.prestige + move * 0.5, 0, 100);
        } else {
          s.player.reputation.controversy = clamp(s.player.reputation.controversy - move * 0.6, 0, 100);
        }
      }

      const look = worn.map((asset) => asset.brand ?? asset.name).join(', ');
      invite.status = 'attended';
      invite.attended = { at: s.now, verdict, photographed, note, look, cost };

      s.remember({
        category: 'life',
        title: `${invite.brand}, ${invite.season}`,
        detail: `${SEAT_LABEL[seat]} at ${invite.weekName}, in ${invite.venue}. ${looks.join(' ')} ${note}`,
        refs: [{ type: 'person', id: s.player.id }],
        significance: photographed ? 5 : 3,
        public: photographed,
      });
      s.emit('fw.attended', { inviteId: invite.id, verdict, photographed });
      return { verdict, photographed, note, look: looks.join(' '), cost };
    },
  );

  // --- The answer -----------------------------------------------------------

  sim.onSchedule('fw.answer', (item, s) => {
    const invite = s.universe.fashionInvites[(item.payload as { inviteId: Id }).inviteId];
    if (!invite || invite.status !== 'asked') return;
    const house = housesAt(invite.weekId).find((one) => one.brand === invite.brand);
    if (!house) return;

    const seat = seatFor(s, house);
    if (!seat) {
      invite.status = 'refused';
      invite.note = s.rng('fw.refusal', invite.id).pick([
        'A polite three lines. The room is small this season.',
        'No answer at all, which is the answer.',
        'They regret that the list is closed.',
        'A press officer writes back to say they’ll keep you in mind.',
      ]);
      s.notify({
        title: `${invite.brand} Said No`,
        body: `${invite.weekName}, ${invite.season}. ${invite.note}`,
        category: 'personal',
        importance: 34,
        route: '/workspace/goingout',
        refType: 'invite', refId: invite.id,
      });
      s.emit('fw.refused', { inviteId: invite.id });
      return;
    }

    invite.status = 'accepted';
    invite.seat = seat;
    invite.note = seat === 'front_row'
      ? 'Front row, with your name on the card.'
      : seat === 'second_row'
        ? 'Second row, which is a real seat and everybody knows it.'
        : seat === 'back'
          ? 'A seat at the back, which is still a seat.'
          : 'Standing, at the back, behind the people who were sat down.';

    // The seat is a commitment: it goes on the calendar, and the doors shut.
    s.schedule({
      at: invite.at,
      kind: 'fw.show',
      label: `${invite.brand} — ${invite.weekName}`,
      category: 'personal',
      payload: { inviteId: invite.id },
      priority: 62,
      requiresPlayer: true,
      refType: 'invite', refId: invite.id,
    });
    s.schedule({
      at: invite.at + DOORS_SHUT_MINUTES * MS_MINUTE,
      kind: 'fw.doors',
      label: `Doors Shut At ${invite.brand}`,
      category: 'personal',
      payload: { inviteId: invite.id },
      priority: 20,
    });

    s.notify({
      title: `${invite.brand} Said Yes`,
      body: `${SEAT_LABEL[seat]} at ${invite.weekName}, ${invite.season}, in ${invite.venue}.`,
      category: 'personal',
      importance: seat === 'front_row' ? 80 : 62,
      route: '/workspace/goingout',
      refType: 'invite', refId: invite.id,
    });
    s.emit('fw.accepted', { inviteId: invite.id, seat });
  });

  sim.onSchedule('fw.show', (item, s) => {
    const invite = s.universe.fashionInvites[(item.payload as { inviteId: Id }).inviteId];
    if (!invite || invite.status !== 'accepted') return;
    s.notify({
      title: `${invite.brand} Is About To Start`,
      body: `${invite.venue}, ${invite.weekName}. ${SEAT_LABEL[invite.seat as Seat]}.`,
      category: 'personal',
      importance: 58,
      route: '/workspace/goingout',
      refType: 'invite', refId: invite.id,
    });
  });

  /** A show does not wait, and an empty seat in the front row is noticed. */
  sim.onSchedule('fw.doors', (item, s) => {
    const invite = s.universe.fashionInvites[(item.payload as { inviteId: Id }).inviteId];
    if (!invite || invite.status !== 'accepted') return;
    invite.status = 'missed';
    s.notify({
      title: `You Missed ${invite.brand}`,
      body: `${invite.weekName}, ${invite.season}. The seat sat empty in front of everybody.`,
      category: 'personal',
      importance: 40,
      route: '/workspace/goingout',
      refType: 'invite', refId: invite.id,
    });
    s.emit('fw.missed', { inviteId: invite.id });
  });
}

export { FASHION_WEEKS, SEASON_LABEL, SEAT_LABEL, housesAt, weeksFor };
