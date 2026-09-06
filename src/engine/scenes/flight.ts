/**
 * A flight, as a day.
 *
 * Packing, the run to the airport, the desk, the gate, the air, the
 * carousel and the way into town. Every commit is the journey system's own
 * command; the flight lands through the travel system's own arrival when
 * the clock reaches it, and what the day costs is on the line before you
 * choose. A gate can close on you, an airline can cancel and move you, a
 * bag can fail to arrive.
 *
 * The short version packs light, calls a cab, keeps its seat, sleeps, and
 * takes a cab to the hotel.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { formatTime } from '../core/time';
import { formatMoney } from '../core/money';
import type { FlightBooking, SceneSession } from '../domain/model';
import { CITIES } from '../content/geography';
import { preview, speak } from '../dialogue/library';
import {
  GATE_CLOSE_MINUTES, PACK_MINUTES, airportName, airportRuns, bagFee, bookingOf, dayFacts, documentsFor, flyable, hotelOnArrival, seatOptions, toCityOf,
  type Activity, type BagChoice, type Documents,
} from '../systems/journey';
import type { Mode } from '../systems/places';
import { defineScene, unknownStep, type SceneChoice } from '../systems/scenes';

function str(session: SceneSession, key: string): string {
  const value = session.context[key];
  return value === null || value === undefined ? '' : String(value);
}

function num(session: SceneSession, key: string): number {
  return Number(session.context[key] ?? 0);
}

function say(sim: Simulation, purpose: string, beat: string, ctx: { flags?: string[]; result?: string; vars?: Record<string, string> }, salt: string, record: boolean): string {
  const query = { section: 'travel', purpose, beat };
  return (record ? speak(sim, query, ctx, salt) : preview(sim, query, ctx, salt)).text;
}

function nodeFor(booking: FlightBooking): string {
  if (booking.status === 'flown') return booking.bagsClaimedAt ? 'town' : 'land';
  if (booking.boardedAt) return 'air';
  if (booking.checkedInAt) return 'gate';
  if (booking.bag) return 'airport';
  return 'pack';
}

export const FLIGHT_SCENE = defineScene({
  id: 'travel.flight',
  version: 1,
  title: 'A Flight',
  placeBound: false,

  available(sim, input) {
    const booking = sim.universe.flightBookings[String(input['bookingId'])];
    if (!booking) return { ok: false, reason: 'There is no flight like that.' };
    if (booking.boardedAt || booking.status === 'flown') return booking.bagsClaimedAt && booking.status === 'flown' ? { ok: false, reason: 'That day is done.' } : { ok: true };
    const can = flyable(sim, booking);
    return can.ok ? { ok: true } : { ok: false, reason: can.reason };
  },

  start(sim, input) {
    const booking = bookingOf(sim, String(input['bookingId']));
    return {
      node: nodeFor(booking),
      context: { bookingId: booking.id, lastNote: '', result: '', spent: booking.extras ?? 0 },
      participantIds: [],
      refType: 'flight',
      refId: booking.id,
    };
  },

  view(sim, session) {
    const booking = bookingOf(sim, str(session, 'bookingId'));
    const toCity = CITIES.get(toCityOf(booking) ?? '')?.name ?? booking.toAirport;
    const eyebrow = `${booking.airlineName} ${booking.flightNumber} · ${airportName(booking.fromAirport)} to ${airportName(booking.toAirport)} · ${formatTime(booking.departAt, sim.zone)}`;
    const facts = [
      { label: 'Departs', value: formatTime(booking.departAt, sim.zone) },
      { label: 'Gate Closes', value: formatTime(booking.departAt - GATE_CLOSE_MINUTES * 60_000, sim.zone) },
      { label: 'Cabin', value: booking.cabin.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) },
      { label: 'Now', value: formatTime(sim.now, sim.zone) },
    ];
    switch (session.node) {
      case 'pack': {
        const documents = documentsFor(sim, booking);
        const fee = bagFee(sim, booking);
        return {
          title: `Fly To ${toCity}`,
          eyebrow,
          text: say(sim, 'pack', 'home', { flags: [documents.international ? 'international' : 'domestic'], vars: { passport: documents.passport } }, `${booking.id}:pack`, false),
          choices: [
            { id: 'bag:carry_on', label: 'Carry It On', aliases: ['carry on', 'carry-on', 'light'], tone: 'primary', detail: `${PACK_MINUTES} minutes to pack. Nothing to wait for on the other side.` },
            { id: 'bag:checked', label: 'Check A Bag', aliases: ['check', 'checked', 'hold'], detail: `${fee > 0 ? `${formatMoney(fee)} at the desk.` : 'Included in the fare.'} Twenty-five minutes at the carousel, and a small bet that it lands with you.` },
          ],
          facts: [...facts, { label: 'Documents', value: documents.international ? `${documents.passport} passport` : 'Photo identification' }],
          canSkip: true,
        };
      }
      case 'airport': {
        const choices: SceneChoice[] = airportRuns(sim, booking).map((r) => ({ id: `run:${r.mode}`, label: r.label, aliases: [r.mode], detail: r.detail, disabled: r.disabled }));
        return {
          title: 'To The Airport',
          eyebrow,
          text: str(session, 'lastNote') || documentsFor(sim, booking).note,
          choices,
          facts,
          canSkip: true,
        };
      }
      case 'desk': {
        const choices: SceneChoice[] = seatOptions(sim, booking).map((o) => ({ id: `seat:${o.id}`, label: o.label, aliases: [o.id], detail: `${o.detail}${o.cost > 0 ? ` ${formatMoney(o.cost)}.` : ''}`, tone: o.id === 'keep' ? 'primary' : undefined }));
        return {
          title: 'The Desk',
          eyebrow,
          text: str(session, 'lastNote') || 'A queue, a belt, a person with a lanyard. Bags weighed, passes printed.',
          choices,
          facts,
          canSkip: true,
        };
      }
      case 'gate': {
        return {
          title: `Gate For ${booking.flightNumber}`,
          eyebrow,
          text: str(session, 'lastNote') || `Seat ${booking.seats[0]}. The board says ${formatTime(booking.departAt, sim.zone)}. Boards say things.`,
          choices: [{ id: 'board', label: 'Board When They Call', aliases: ['board', 'wait', 'go'], tone: 'primary', detail: 'What the gate does next is the gate\'s.' }],
          facts,
          canSkip: true,
        };
      }
      case 'air': {
        const hours = Math.max(0, (booking.arriveAt - sim.now) / 3_600_000);
        return {
          title: 'In The Air',
          eyebrow,
          text: str(session, 'lastNote') || `${Math.round(hours * 10) / 10} hours to ${toCity}. The seat belt sign goes off.`,
          choices: [
            { id: 'do:sleep', label: 'Sleep Through It', aliases: ['sleep'], tone: 'primary', detail: 'Sleep debt down, energy up, a mark on your cheek.' },
            { id: 'do:work', label: 'Work', aliases: ['work', 'laptop'], detail: 'Something done; something wound tighter.' },
            { id: 'do:watch', label: 'Watch Something', aliases: ['watch', 'film', 'movie'], detail: 'Stress down. Two and a half films.' },
          ],
          facts: [...facts, { label: 'Hours', value: `${Math.round(hours * 10) / 10}` }],
          canSkip: true,
        };
      }
      case 'land': {
        return {
          title: `Landed In ${toCity}`,
          eyebrow,
          text: str(session, 'lastNote') || 'Wheels down, phones on, the long walk.',
          choices: [{ id: 'bags', label: booking.bag === 'checked' ? 'Wait At The Carousel' : 'Walk Straight Through', aliases: ['bags', 'carousel', 'through'], tone: 'primary' }],
          facts: [...facts, { label: 'Local Time', value: formatTime(sim.now, sim.zone) }],
          canSkip: true,
        };
      }
      case 'town': {
        const hotel = hotelOnArrival(sim, booking);
        const choices: SceneChoice[] = [
          { id: 'go:taxi', label: hotel ? 'A Cab To The Hotel' : 'A Cab Into Town', aliases: ['taxi', 'cab'], tone: 'primary', detail: hotel ? hotel.hotelName : 'Wherever tonight is.' },
          { id: 'go:transit', label: hotel ? 'The Train To The Hotel' : 'The Train Into Town', aliases: ['train', 'transit'], detail: 'Cheaper, slower, more people.' },
        ];
        return {
          title: 'Into Town',
          eyebrow,
          text: str(session, 'lastNote') || (hotel ? `${hotel.hotelName} has a room in your name from ${formatTime(hotel.checkInAt, sim.zone)}.` : 'No hotel booked. The city is yours to find a bed in.'),
          choices,
          facts,
          canSkip: true,
        };
      }
      case 'missed': {
        return {
          title: 'Missed',
          eyebrow,
          text: str(session, 'lastNote'),
          choices: [{ id: 'finish', label: 'Back To The Day', aliases: ['done', 'ok', 'finish'], tone: 'primary' }],
          facts: [{ label: 'Fare', value: booking.refundable ? 'Refunded' : `${formatMoney(booking.fare + booking.taxesFees)} gone` }, { label: 'Rebook', value: 'From Travel, or from Home' }],
          canSkip: false,
          canLeave: false,
        };
      }
      case 'done': {
        return {
          title: str(session, 'result') === 'cancelled' ? 'Cancelled, And Moved' : `${toCity}`,
          eyebrow,
          text: str(session, 'lastNote'),
          choices: [{ id: 'finish', label: 'Back To The Day', aliases: ['done', 'ok', 'finish'], tone: 'primary' }],
          facts: dayFacts(sim, booking),
          canSkip: false,
          canLeave: false,
        };
      }
      default:
        throw unknownStep();
    }
  },

  choose(sim, session, choiceId, ctx) {
    const booking = bookingOf(sim, str(session, 'bookingId'));
    switch (session.node) {
      case 'pack': {
        if (!choiceId.startsWith('bag:')) throw unknownStep();
        const bag = choiceId.slice(4) as BagChoice;
        const { fee, documents } = ctx.commit<{ fee: number; documents: Documents }>('pack', { kind: 'travel.pack', payload: { bookingId: booking.id, bag } });
        session.context['spent'] = num(session, 'spent') + fee;
        const line = `${say(sim, 'pack', 'home', { flags: [bag], vars: { fee: formatMoney(fee) } }, `${booking.id}:bag`, true)} ${documents.note}`;
        session.context['lastNote'] = line;
        ctx.say(line);
        ctx.go('airport');
        return;
      }
      case 'airport': {
        if (!choiceId.startsWith('run:')) throw unknownStep();
        const mode = choiceId.slice(4) as Mode;
        const run = ctx.commit<{ minutes: number; cost: number; late: boolean }>('run', { kind: 'travel.to_airport', payload: { bookingId: booking.id, mode } });
        session.placeId = undefined;
        session.context['spent'] = num(session, 'spent') + run.cost;
        if (run.late) {
          const line = `${say(sim, 'run', 'road', { flags: ['late'] }, `${booking.id}:late`, true)} ${say(sim, 'missed', 'gate', {}, `${booking.id}:missed`, true)}`;
          session.context['lastNote'] = line;
          ctx.say(line);
          ctx.go('missed');
          return;
        }
        const line = say(sim, 'run', 'road', { flags: [mode], vars: { minutes: String(run.minutes) } }, `${booking.id}:run`, true);
        session.context['lastNote'] = line;
        ctx.say(line);
        ctx.go('desk');
        return;
      }
      case 'desk': {
        if (!choiceId.startsWith('seat:')) throw unknownStep();
        const result = ctx.commit<{ seat: string; cost: number }>('checkin', { kind: 'travel.check_in_flight', payload: { bookingId: booking.id, seat: choiceId.slice(5) } });
        session.context['spent'] = num(session, 'spent') + result.cost;
        const line = `${say(sim, 'desk', 'checkin', { flags: [booking.cabin], vars: { seat: result.seat } }, `${booking.id}:desk`, true)}${choiceId === 'seat:legroom' ? ` ${say(sim, 'desk', 'checkin', { flags: ['legroom'] }, `${booking.id}:legroom`, true)}` : ''}`;
        session.context['lastNote'] = line;
        ctx.say(line);
        ctx.go('gate');
        return;
      }
      case 'gate': {
        if (choiceId !== 'board') throw unknownStep();
        const gate = ctx.commit<{ delayMinutes: number; cancelled: boolean; replacement?: string }>('board', { kind: 'travel.board', payload: { bookingId: booking.id } });
        if (gate.cancelled) {
          const replacement = gate.replacement ? sim.universe.flightBookings[gate.replacement] : undefined;
          session.context['result'] = 'cancelled';
          const line = `${say(sim, 'gate', 'board', { result: 'cancelled' }, `${booking.id}:gate`, true)}${replacement ? ` The airline has moved you to ${replacement.airlineName} ${replacement.flightNumber}, ${formatTime(replacement.departAt, sim.zone)}, at no cost.` : ''}`;
          session.context['lastNote'] = line;
          ctx.say(line);
          ctx.go('done');
          return;
        }
        const line = say(sim, 'gate', 'board', { result: gate.delayMinutes > 0 ? 'delayed' : 'ontime', vars: { delay: String(gate.delayMinutes) } }, `${booking.id}:gate`, true);
        session.context['lastNote'] = line;
        ctx.say(line);
        ctx.go('air');
        return;
      }
      case 'air': {
        if (!choiceId.startsWith('do:')) throw unknownStep();
        const activity = choiceId.slice(3) as Activity;
        const air = ctx.commit<{ hours: number; landedIn?: string }>('air', { kind: 'travel.inflight', payload: { bookingId: booking.id, activity } });
        // The scene moves with you: landing is the point, not an interruption.
        session.locationId = air.landedIn ?? session.locationId;
        session.placeId = undefined;
        const line = `${say(sim, 'air', 'cabin', { flags: [booking.cabin, activity] }, `${booking.id}:air`, true)} ${air.hours} hours.`;
        session.context['lastNote'] = line;
        ctx.say(line);
        ctx.go('land');
        return;
      }
      case 'land': {
        if (choiceId !== 'bags') throw unknownStep();
        const bags = ctx.commit<{ lost: boolean; minutes: number }>('bags', { kind: 'travel.claim_bags', payload: { bookingId: booking.id } });
        const line = say(sim, 'land', 'carousel', { result: booking.bag === 'checked' ? (bags.lost ? 'lost' : 'ok') : 'carry_on' }, `${booking.id}:bags`, true);
        session.context['lastNote'] = line;
        ctx.say(line);
        ctx.go('town');
        return;
      }
      case 'town': {
        if (!choiceId.startsWith('go:')) throw unknownStep();
        const mode = choiceId.slice(3) as Mode;
        const arrived = ctx.commit<{ hotel?: string; checkedIn: boolean; readyAt?: number; minutes: number; cost: number }>('town', { kind: 'travel.to_hotel', payload: { bookingId: booking.id, mode } });
        session.placeId = undefined;
        const line = say(sim, 'hotel', 'desk', { result: !arrived.hotel ? 'none' : arrived.checkedIn ? 'ready' : 'early', vars: { ready: arrived.readyAt ? formatTime(arrived.readyAt, sim.zone) : '' } }, `${booking.id}:hotel`, true);
        session.context['lastNote'] = line;
        session.context['result'] = 'landed';
        ctx.say(line);
        ctx.go('done');
        return;
      }
      case 'missed':
      case 'done': {
        if (choiceId !== 'finish') throw unknownStep();
        ctx.finish();
        return;
      }
      default:
        throw unknownStep();
    }
  },

  summarise(sim, session, ctx) {
    const booking = bookingOf(sim, str(session, 'bookingId'));
    const result = ctx.commit<{ landedIn?: string; delayMinutes: number; cancelled: boolean; missed: boolean; hotel?: string }>('fly', { kind: 'travel.fly', payload: { bookingId: booking.id } });
    if (result.missed) { ctx.say(say(sim, 'missed', 'gate', {}, `${booking.id}:missed`, true)); ctx.finish(); return; }
    if (result.cancelled) { ctx.say(say(sim, 'gate', 'board', { result: 'cancelled' }, `${booking.id}:gate`, true)); ctx.finish(); return; }
    const toCity = CITIES.get(result.landedIn ?? '')?.name ?? booking.toAirport;
    ctx.say(`${result.delayMinutes > 0 ? `${result.delayMinutes} minutes late off the ground. ` : ''}Landed in ${toCity}.${result.hotel ? ` ${result.hotel}.` : ''}`);
    ctx.finish();
  },
});

export function unusedGuard(): never { throw new CommandError('unreachable'); }
