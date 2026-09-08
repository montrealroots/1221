/**
 * SLATE — the ordinary rooms.
 *
 * The salon, the chemist, the post office and the launderette. Small rooms
 * with somebody in them, two minutes of play each, and between them most of
 * what makes a week feel like a week rather than a sequence of decisions.
 *
 * A cut lasts six weeks and then stops looking like one. A chemist is a real
 * chain where chains are allowed and an independent pharmacy where the law
 * says it has to be. A parcel is a weight, a price, a waiting time and a
 * small chance it never turns up. A service wash is somebody else doing it,
 * for more money, and your clothes are not there until tomorrow.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Id, Parcel, Person } from '../domain/model';
import { clamp } from '../core/rng';
import type { Instant } from '../core/time';
import { MS_DAY, MS_MINUTE, addDays, formatDate } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { plural } from '../core/text';
import { CITIES, countryOfCity } from '../content/geography';
import { placesIn, type Place } from '../content/places';
import { costOfLiving } from '../content/tax';
import { zoneOf } from './cinema';
import { NEEDS_WASHING, garmentsOf } from './wardrobe';
import { LAUNDERETTE_LOAD } from './household';
import {
  COUNTER_BY_ID, COUNTER_GOODS, type CounterGood, DELAY_CHANCE, GROOMING_DAYS,
  INDEPENDENT_PHARMACY_WORD, LOOKS_UNKEMPT, LOST_CHANCE, MAX_PARCEL_GRAMS,
  PHARMACIES_ARE_INDEPENDENT, type PharmacyChain, QUEUE_MINUTES, SALON_BY_ID, SALON_SERVICES,
  SERVICE_BY_ID, SERVICE_WASH_SHARE, pharmacyChainsIn, postalOperatorIn,
} from '../content/errands';

// ---------------------------------------------------------------------------
// The rooms
// ---------------------------------------------------------------------------

export function salonsIn(sim: Simulation, cityId: string = sim.player.currentLocationId): Place[] {
  return placesIn(cityId).filter((place) => place.kind === 'salon');
}

export function pharmaciesIn(sim: Simulation, cityId: string = sim.player.currentLocationId): Place[] {
  return placesIn(cityId).filter((place) => place.kind === 'pharmacy');
}

export function postOfficesIn(sim: Simulation, cityId: string = sim.player.currentLocationId): Place[] {
  return placesIn(cityId).filter((place) => place.kind === 'post_office');
}

export function launderettesIn(sim: Simulation, cityId: string = sim.player.currentLocationId): Place[] {
  return placesIn(cityId).filter((place) => place.kind === 'launderette');
}

/**
 * Whose chemist this is.
 *
 * Where a country lets chains own pharmacies, it is one of the chains that
 * really trades there. Where the law requires a pharmacy to be owned by the
 * pharmacist running it — Germany, France, Italy, Spain, Austria, Greece,
 * Turkey, Denmark — there is no chain, and that is the law rather than a gap.
 */
export function pharmacyChainOf(place: Place): PharmacyChain | undefined {
  const countryId = countryOfCity(place.cityId) ?? '';
  if (PHARMACIES_ARE_INDEPENDENT.has(countryId)) return undefined;
  // The sign is the name: the shop floor named it after a chain that really
  // trades here, so the chain is read off the sign rather than drawn again
  // from a different seed that could disagree with it. A second branch in a
  // city whose high street already has every chain carries the corner it
  // stands on after the name, and is still that chain's branch.
  return pharmacyChainsIn(countryId).find(
    (chain) => place.name === chain.name || place.name.startsWith(`${chain.name} `),
  );
}

/** What the chemist is called, and why it is called that. */
export function describePharmacy(place: Place): string {
  const countryId = countryOfCity(place.cityId) ?? '';
  const chain = pharmacyChainOf(place);
  if (chain) return `A ${chain.name} branch. ${chain.about}`;
  const word = INDEPENDENT_PHARMACY_WORD[countryId];
  if (word) {
    return `An independent ${word}. The law here requires a pharmacy to be owned by the pharmacist `
      + 'who runs it, which is why there is no chain on this corner.';
  }
  return place.about;
}

/** The national operator whose counter this is. */
export function operatorAt(place: Place): string {
  const operator = postalOperatorIn(countryOfCity(place.cityId) ?? '');
  // Where SLATE does not carry that country's operator by name, the counter
  // says what the sign says rather than inventing an operator for it.
  return operator?.name ?? place.name;
}

// ---------------------------------------------------------------------------
// The chair
// ---------------------------------------------------------------------------

/**
 * How recently it was cut, out of a hundred.
 *
 * A hundred on the way out of the chair, nothing six weeks later. Somebody
 * who has never been reads as freshly cut rather than as a hole in the data,
 * because a life does not start halfway through growing out.
 */
export function groomingOf(sim: Simulation, person: Person = sim.player): number {
  if (person.groomedAt === undefined) return 100;
  const days = (sim.now - person.groomedAt) / MS_DAY;
  return clamp(Math.round(100 - (days / GROOMING_DAYS) * 100), 0, 100);
}

/** What the mirror would say about it, in a few words. */
export function groomingNote(sim: Simulation, person: Person = sim.player): string {
  const level = groomingOf(sim, person);
  if (level >= 80) return 'Recently cut, and it shows.';
  if (level >= LOOKS_UNKEMPT) return 'Growing out, but nobody would remark on it.';
  if (level >= 15) return 'Past the point where it looks deliberate.';
  return 'It has been a while, and it is the first thing anybody notices.';
}

/** What a room does about it: a number a scene can weigh. */
export function groomingPenalty(sim: Simulation, person: Person = sim.player): number {
  const level = groomingOf(sim, person);
  return level >= LOOKS_UNKEMPT ? 0 : Math.round((LOOKS_UNKEMPT - level) / 4);
}

/** What a service costs at this salon, in this city. */
export function salonPrice(place: Place, serviceId: string): Money {
  const service = SALON_BY_ID[serviceId];
  if (!service) return 0;
  const raw = service.price * costOfLiving(place.cityId) * (0.65 + (place.quality ?? 60) / 110);
  return Math.max(500, Math.round(raw / 100) * 100);
}

// ---------------------------------------------------------------------------
// The counter
// ---------------------------------------------------------------------------

/** What a thing costs at this chemist. */
export function counterPrice(place: Place, goodId: string): Money {
  const good = COUNTER_BY_ID[goodId];
  if (!good) return 0;
  return Math.max(100, Math.round((good.price * costOfLiving(place.cityId)) / 50) * 50);
}

/** What is on the shelves here. Every chemist carries the ordinary things. */
export function shelfAt(sim: Simulation, place: Place): CounterGood[] {
  // A smaller chemist does not carry everything, and which things it is out
  // of is the same every time you walk in.
  const rng = sim.rng('errand.shelf', place.id);
  return COUNTER_GOODS.filter(() => rng.chance(0.86));
}

// ---------------------------------------------------------------------------
// The parcel
// ---------------------------------------------------------------------------

/** What it costs to send this, from here, this way. */
export function postagePrice(place: Place, serviceId: string, grams: number, toCityId: string): Money {
  const service = SERVICE_BY_ID[serviceId];
  if (!service) return 0;
  const abroad = countryOfCity(place.cityId) !== countryOfCity(toCityId);
  const kilos = Math.max(0.1, grams / 1000);
  const raw = (service.base + service.perKilo * kilos) * (abroad ? 2.4 : 1) * costOfLiving(place.cityId);
  return Math.max(200, Math.round(raw / 50) * 50);
}

export function parcelsOf(sim: Simulation, personId: Id = sim.player.id): Parcel[] {
  return Object.values(sim.universe.parcels)
    .filter((parcel) => parcel.personId === personId)
    .sort((a, b) => b.sentAt - a.sentAt);
}

/** Parcels still on their way. */
export function inTransit(sim: Simulation, personId: Id = sim.player.id): Parcel[] {
  return parcelsOf(sim, personId).filter((one) => one.status === 'in_transit' || one.status === 'delayed');
}

/** A parcel in a sentence. */
export function describeParcel(sim: Simulation, parcel: Parcel): string {
  const zone = zoneOf(sim, parcel.fromCityId);
  const to = CITIES.get(parcel.toCityId)?.name ?? parcel.toCityId;
  if (parcel.status === 'delivered') {
    return `Delivered to ${to} on ${formatDate(parcel.arrivedAt ?? parcel.dueAt, zone)}.`;
  }
  if (parcel.status === 'lost') return parcel.note ?? 'It never turned up, and nobody can say where it went.';
  if (parcel.status === 'delayed') return parcel.note ?? `Held up somewhere. Due in ${to} by ${formatDate(parcel.dueAt, zone)}.`;
  return `On its way to ${to}, due ${formatDate(parcel.dueAt, zone)}.`
    + (parcel.tracked ? '' : ' Nobody can tell you where it is.');
}

// ---------------------------------------------------------------------------
// The commands
// ---------------------------------------------------------------------------

export function registerErrandSystem(sim: Simulation): void {
  /** Sitting in the chair. */
  sim.onCommand<
    { placeId: string; service: string },
    { paid: Money; note: string; grooming: number }
  >(
    'errand.haircut',
    (p, { sim: s }) => {
      const place = salonsIn(s).find((one) => one.id === p.placeId);
      if (!place) throw new CommandError('That is not a salon in this city.');
      if (s.player.currentPlaceId !== place.id) {
        throw new CommandError(`You are not at ${place.name}. Nobody cuts hair over the telephone.`);
      }
      const service = SALON_BY_ID[p.service];
      if (!service) throw new CommandError('They do not do that here.');

      const paid = salonPrice(place, service.id);
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('You have no account to pay for it from.');
      if (s.ledger.availableFunds(accountId) < paid) {
        throw new CommandError(`${service.label} is ${formatMoney(paid)} here, and you do not have it.`);
      }
      s.expense(accountId, paid, `${service.label} — ${place.name}`, 'personal', { refType: 'place', refId: place.id });

      // A good room gets it right more often than a cheap one, and nobody
      // gets it right every time.
      const rng = s.rng('errand.chair', place.id, s.now);
      const wentWell = rng.float(0, 100) < 55 + (place.quality ?? 60) * 0.4;
      const note = wentWell
        ? rng.pick([
          'Exactly what you asked for, which is not nothing.',
          'Better than you asked for. You will come back here.',
          'They took their time and it shows.',
        ])
        : rng.pick([
          'Shorter than you meant. It will be fine in a fortnight.',
          'Not quite what you described, and you said it was fine.',
          'Fine, and you will find somewhere else next time.',
        ]);

      s.advanceTo(s.now + service.minutes * MS_MINUTE);
      s.player.wellbeing.energy = clamp(s.player.wellbeing.energy - 3, 0, 100);
      // A trim puts back less than a cut does, so it is a share of the clock
      // rather than a reset of it.
      const back = (service.restores / 100) * GROOMING_DAYS * MS_DAY;
      const from = s.player.groomedAt ?? s.now;
      s.player.groomedAt = clamp(Math.max(from + back, s.now - (GROOMING_DAYS * MS_DAY - back)), 0, s.now);
      if (service.restores >= 100) s.player.groomedAt = s.now;

      s.remember({
        category: 'life',
        title: service.label,
        detail: `${place.name}. ${note}`,
        refs: [{ type: 'place', id: place.id }],
        significance: 2,
        public: false,
      });
      s.emit('errand.cut', { placeId: place.id, service: service.id, paid });
      return { paid, note, grooming: groomingOf(s) };
    },
  );

  /** Buying the ordinary things over a counter. */
  sim.onCommand<
    { placeId: string; items: { id: string; quantity?: number }[] },
    { paid: Money; bought: number; note: string }
  >(
    'errand.buy',
    (p, { sim: s }) => {
      const place = pharmaciesIn(s).find((one) => one.id === p.placeId);
      if (!place) throw new CommandError('That is not a chemist in this city.');
      if (s.player.currentPlaceId !== place.id) {
        throw new CommandError(`You are not at ${place.name}.`);
      }
      const shelf = new Set(shelfAt(s, place).map((one) => one.id));
      let paid = 0;
      let bought = 0;
      for (const line of p.items ?? []) {
        const good = COUNTER_BY_ID[line.id];
        if (!good) throw new CommandError('They do not sell that.');
        if (!shelf.has(good.id)) throw new CommandError(`${place.name} is out of ${good.name.toLowerCase()}.`);
        const quantity = clamp(Math.round(line.quantity ?? 1), 1, 6);
        paid += counterPrice(place, good.id) * quantity;
        bought += quantity;
      }
      if (bought === 0) throw new CommandError('You have not picked anything up.');

      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('You have no account to pay with.');
      if (s.ledger.availableFunds(accountId) < paid) {
        throw new CommandError(`That comes to ${formatMoney(paid)} and you do not have it.`);
      }
      s.expense(accountId, paid, `Chemist — ${place.name}`, 'household', { refType: 'place', refId: place.id });

      const rng = s.rng('errand.counter', place.id, s.now);
      const queue = rng.int(QUEUE_MINUTES[0], QUEUE_MINUTES[1]);
      s.advanceTo(s.now + queue * MS_MINUTE);
      const note = `${plural(bought, 'thing')}, and ${plural(queue, 'minute')} in the queue.`;
      s.emit('errand.bought', { placeId: place.id, paid, bought });
      return { paid, bought, note };
    },
  );

  /** Handing something over a counter and hoping. */
  sim.onCommand<
    { placeId: string; service: string; grams: number; toCityId: string; contents?: string },
    { parcelId: Id; paid: Money; dueAt: Instant; operator: string }
  >(
    'errand.post',
    (p, { sim: s }) => {
      const place = postOfficesIn(s).find((one) => one.id === p.placeId);
      if (!place) throw new CommandError('That is not a post office in this city.');
      if (s.player.currentPlaceId !== place.id) {
        throw new CommandError(`You are not at ${place.name}.`);
      }
      const service = SERVICE_BY_ID[p.service];
      if (!service) throw new CommandError('They do not offer that.');
      const to = CITIES.get(p.toCityId);
      if (!to) throw new CommandError('That is not somewhere you can send anything to.');
      if (p.toCityId === place.cityId) {
        throw new CommandError('That is this city. Walk it round yourself.');
      }
      const grams = Math.round(p.grams ?? 0);
      if (grams <= 0) throw new CommandError('There is nothing in it.');
      if (grams > MAX_PARCEL_GRAMS) {
        throw new CommandError(`They will not take anything over ${MAX_PARCEL_GRAMS / 1000} kilos at the counter.`);
      }

      const paid = postagePrice(place, service.id, grams, p.toCityId);
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('You have no account to pay the postage from.');
      if (s.ledger.availableFunds(accountId) < paid) {
        throw new CommandError(`The postage is ${formatMoney(paid)} and you do not have it.`);
      }
      s.expense(accountId, paid, `Postage — ${operatorAt(place)}`, 'household', { refType: 'place', refId: place.id });

      const rng = s.rng('errand.post', place.id, s.now, grams);
      const queue = rng.int(QUEUE_MINUTES[0], QUEUE_MINUTES[1]);
      s.advanceTo(s.now + queue * MS_MINUTE);

      const abroad = countryOfCity(place.cityId) !== countryOfCity(p.toCityId);
      const window = abroad ? service.abroadDays : service.homeDays;
      const dueAt = addDays(s.now, rng.int(window[0], window[1]), s.homeZone);

      const parcel: Parcel = {
        id: s.nextId('parcel'),
        saveId: s.universe.meta.id,
        personId: s.player.id,
        placeId: place.id,
        placeName: place.name,
        operator: operatorAt(place),
        fromCityId: place.cityId,
        toCityId: p.toCityId,
        service: service.id,
        contents: (p.contents ?? 'A parcel').trim().slice(0, 120) || 'A parcel',
        grams,
        paid,
        sentAt: s.now,
        dueAt,
        tracked: service.tracked,
        status: 'in_transit',
      };
      s.universe.parcels[parcel.id] = parcel;

      s.schedule({
        at: dueAt,
        kind: 'errand.parcel',
        label: `${parcel.contents} — ${to.name}`,
        category: 'personal',
        payload: { parcelId: parcel.id },
        priority: 30,
        refType: 'place', refId: place.id,
      });
      s.emit('errand.posted', { parcelId: parcel.id, paid, service: service.id });
      return { parcelId: parcel.id, paid, dueAt, operator: parcel.operator };
    },
  );

  /**
   * Leaving the washing with somebody.
   *
   * The machine at home and the wait at the launderette are already what
   * `wear.clean` does. This is the other thing a launderette sells: you hand
   * it over, you pay nearly twice, and you have nothing to wear until
   * tomorrow.
   */
  sim.onCommand<{ placeId: string }, { paid: Money; pieces: number; readyAt: Instant }>(
    'errand.service_wash',
    (p, { sim: s }) => {
      const place = launderettesIn(s).find((one) => one.id === p.placeId);
      if (!place) throw new CommandError('That is not a launderette in this city.');
      if (s.player.currentPlaceId !== place.id) {
        throw new CommandError(`You are not at ${place.name}.`);
      }
      const dirty = garmentsOf(s, s.player.id).filter(
        // The same line the mirror draws, so the room and the mirror can
        // never disagree about what is dirty.
        (asset) => (asset.wardrobe?.cleanliness ?? 100) < NEEDS_WASHING
          && asset.wardrobe?.awayUntil === undefined,
      );
      if (dirty.length === 0) throw new CommandError('Nothing you own needs washing.');

      const loads = Math.max(1, Math.ceil(dirty.length / 6));
      const paid = Math.round(loads * LAUNDERETTE_LOAD * SERVICE_WASH_SHARE * costOfLiving(place.cityId));
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('You have no account to pay with.');
      if (s.ledger.availableFunds(accountId) < paid) {
        throw new CommandError(`A service wash is ${formatMoney(paid)} and you do not have it.`);
      }
      s.expense(accountId, paid, `Service wash — ${place.name}`, 'household', { refType: 'place', refId: place.id });

      // It is theirs until tomorrow, and it is not in your wardrobe meanwhile.
      const readyAt = addDays(s.now, 1, s.homeZone);
      for (const asset of dirty) {
        asset.wardrobe!.cleanliness = 100;
        asset.wardrobe!.awayUntil = readyAt;
        asset.wardrobe!.awayReason = 'at the launderette';
        s.player.wearing = (s.player.wearing ?? []).filter((id) => id !== asset.id);
      }
      s.advanceTo(s.now + 12 * MS_MINUTE);
      s.emit('errand.service_wash', { placeId: place.id, paid, pieces: dirty.length });
      return { paid, pieces: dirty.length, readyAt };
    },
  );

  // --- What happens to it on the way ---------------------------------------

  sim.onSchedule('errand.parcel', (item, s) => {
    const parcel = s.universe.parcels[(item.payload as { parcelId: Id }).parcelId];
    if (!parcel || (parcel.status !== 'in_transit' && parcel.status !== 'delayed')) return;
    const to = CITIES.get(parcel.toCityId)?.name ?? parcel.toCityId;
    const rng = s.rng('errand.transit', parcel.id, parcel.status);

    // A parcel that has already been held up once gets where it is going.
    if (parcel.status === 'in_transit' && rng.float(0, 1) < LOST_CHANCE) {
      parcel.status = 'lost';
      parcel.note = parcel.tracked
        ? 'The tracking stopped at a depot four days ago and has not moved since.'
        : 'It never arrived, and there is nothing to look up.';
      s.notify({
        title: `${parcel.contents} Never Arrived`,
        body: `${parcel.operator}. ${parcel.note}`,
        category: 'personal',
        importance: 52,
        route: '/workspace/city',
        refType: 'place', refId: parcel.placeId,
      });
      s.emit('errand.parcel_lost', { parcelId: parcel.id });
      return;
    }

    if (parcel.status === 'in_transit' && rng.float(0, 1) < DELAY_CHANCE) {
      const extra = rng.int(2, 9);
      parcel.status = 'delayed';
      parcel.dueAt = addDays(parcel.dueAt, extra, s.homeZone);
      parcel.note = parcel.tracked
        ? `Held at a sorting office. ${plural(extra, 'day')} behind.`
        : `Late. Nobody can tell you why, or by how much, but it is ${plural(extra, 'day')} now.`;
      s.schedule({
        at: parcel.dueAt,
        kind: 'errand.parcel',
        label: `${parcel.contents} — ${to}`,
        category: 'personal',
        payload: { parcelId: parcel.id },
        priority: 30,
        refType: 'place', refId: parcel.placeId,
      });
      if (parcel.tracked) {
        s.notify({
          title: `${parcel.contents} Is Late`,
          body: `${parcel.operator}. ${parcel.note}`,
          category: 'personal',
          importance: 26,
          route: '/workspace/city',
          refType: 'place', refId: parcel.placeId,
        });
      }
      s.emit('errand.parcel_delayed', { parcelId: parcel.id, days: extra });
      return;
    }

    parcel.status = 'delivered';
    parcel.arrivedAt = s.now;
    parcel.note = 'Delivered.';
    s.notify({
      title: `${parcel.contents} Arrived`,
      body: `${parcel.operator} delivered it in ${to}.`,
      category: 'personal',
      importance: 24,
      route: '/workspace/city',
      refType: 'place', refId: parcel.placeId,
    });
    s.emit('errand.parcel_delivered', { parcelId: parcel.id });
  });
}

export { COUNTER_GOODS, SALON_SERVICES, SERVICE_BY_ID };
