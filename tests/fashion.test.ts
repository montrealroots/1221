/**
 * The fashion weeks.
 *
 * What a test can hold about asking a house for a seat: a calendar that is
 * really the four weeks in the four cities, a season named a year ahead of
 * itself the way the industry names it, a schedule where the big names close
 * the week, a letter that cannot be sent to a show that has already gone, an
 * answer that is who you are rather than what you paid, a seat you cannot use
 * from another city or in what you slept in, and a room that looks at what you
 * have on and sometimes takes a photograph of it.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  describeInvite, editionById, editionsIn, editionsWithShows, invitesOf, piecesBy, seasonYear,
  seatFor, showById, showsIn, standingWith, turningUpCost, upcomingEditions, upcomingInvites,
  wardrobeValue,
} from '@/engine/systems/fashion';
import {
  FASHION_NOTE, FASHION_WEEKS, SEAT_THRESHOLD, SHOWING_HOUSES, housesAt, weeksFor,
} from '@/engine/content/fashionweeks';
import { CATALOG, shoppableItemsIn, stockistsFor } from '@/engine/content/catalog';
import { CITIES } from '@/engine/content/geography';
import { emptySlots, garmentsOf, wearing } from '@/engine/systems/wardrobe';
import { ESSENTIAL_SLOTS } from '@/engine/content/wardrobe';
import type { Simulation } from '@/engine/core/simulation';
import type { Id } from '@/engine/domain/model';

const DAY = 86_400_000;
const MINUTE = 60_000;

function inParis(name: string): Simulation {
  const sim = quickSave({ wealth: 'wealthy' }, name);
  sim.player.currentLocationId = 'fr-idf-paris';
  sim.universe.currentZone = 'Europe/Paris';
  sim.income(sim.player.primaryAccountId!, 900_000_00, 'Test funding', 'other');
  return sim;
}

/** Somebody the whole world has heard of. */
function famous(sim: Simulation): void {
  sim.player.reputation.publicFame = 94;
  sim.player.reputation.prestige = 88;
  sim.player.reputation.professionalReputation = 85;
}

/** The next Paris week, and a show at it that would have you. */
function aSeat(sim: Simulation): { showId: string; at: number; brand: string; cityId: string } {
  for (const edition of editionsWithShows(sim, 400 * DAY)) {
    for (const show of showsIn(sim, edition)) {
      if (show.at < sim.now + 5 * DAY) continue;
      if (!seatFor(sim, show.house)) continue;
      return { showId: show.id, at: show.at, brand: show.house.brand, cityId: edition.week.cityId };
    }
  }
  throw new Error('nobody in the world would sit this person down, which cannot be right');
}

/** Buy a few things and put them on, so you are actually dressed. */
function getDressed(sim: Simulation): void {
  // Buy until there is something for every slot an outfit needs. A one piece
  // covers the top and the bottom by itself, so either is enough.
  const covered = () => {
    const own = garmentsOf(sim, sim.player.id);
    const has = (slot: string) => own.some((asset) => asset.wardrobe?.slot === slot);
    return has('shoes') && (has('outfit') || (has('top') && has('bottom')));
  };
  for (const brand of ['Prada', 'Gucci', 'Chanel', 'COS', 'Uniqlo', 'Zara', 'Levi’s', 'Massimo Dutti', 'Mango']) {
    if (covered()) break;
    buyFrom(sim, brand, 14);
  }
  const own = garmentsOf(sim, sim.player.id);
  // A one piece covers the top and the bottom by itself, which is why the
  // slots are tried in that order rather than assumed.
  for (const slot of ['outfit', 'top', 'bottom', 'shoes', 'outerwear'] as const) {
    const piece = own.find((asset) => asset.wardrobe?.slot === slot);
    if (piece) sim.execute({ kind: 'wear.put_on', payload: { assetId: piece.id } });
  }
}

/** Buy some things by a house, which is what makes you a customer of it. */
function buyFrom(sim: Simulation, brand: string, howMany = 6): number {
  const city = sim.player.currentLocationId;
  const items = shoppableItemsIn(city)
    .filter((item) => item.brand === brand && ['clothing', 'footwear'].includes(item.category))
    .slice(0, howMany);
  let bought = 0;
  for (const item of items) {
    // Only a shop that really stocks the house will sell you the house, and a
    // shop you can walk into hands it over now rather than putting it on a van.
    const shops = stockistsFor(item, city);
    const shop = shops.find((one) => !one.online) ?? shops[0];
    if (!shop) continue;
    const result = sim.execute({
      kind: 'shop.purchase',
      payload: {
        retailerId: shop.id,
        lines: [{ catalogId: item.id, quantity: 1 }],
        channel: shop.online ? 'online' : 'in_store',
      },
    });
    if (result.ok) bought += 1;
  }
  return bought;
}

describe('the calendar', () => {
  it('is real weeks in real cities in the months they really run', () => {
    expect(FASHION_WEEKS.length).toBeGreaterThanOrEqual(24);
    for (const week of FASHION_WEEKS) {
      expect(CITIES.get(week.cityId), week.name).toBeTruthy();
      expect(week.editions.length).toBeGreaterThan(0);
      for (const edition of week.editions) {
        expect(edition.month).toBeGreaterThanOrEqual(1);
        expect(edition.month).toBeLessThanOrEqual(12);
        // The window has to be a window, and a real day of that month.
        expect(edition.days[0]).toBeGreaterThanOrEqual(1);
        expect(edition.days[1]).toBeGreaterThanOrEqual(edition.days[0]);
        // The last day of the window has to be a day that month really has,
        // in a year that is not a leap year.
        const lastDay = new Date(Date.UTC(2025, edition.month, 0)).getUTCDate();
        expect(edition.days[1], `${week.name} month ${edition.month}`).toBeLessThanOrEqual(lastDay);
      }
      expect(['record', 'slate']).toContain(week.placement);
    }
    // The four, in the four cities, in February and September or thereabouts.
    const four = FASHION_WEEKS.filter((week) => week.tier === 'big_four');
    expect(four.map((week) => week.cityId)).toContain('us-ny-newyork');
    expect(four.map((week) => week.cityId)).toContain('uk-eng-london');
    expect(four.map((week) => week.cityId)).toContain('it-09-milan');
    expect(four.map((week) => week.cityId)).toContain('fr-idf-paris');
    expect(FASHION_NOTE).toContain('SLATE');
    expect(FASHION_NOTE).toContain('moves every year');
    expect(FASHION_NOTE).toContain('public record');
  });

  it('names a collection for the season it arrives in, the way the trade does', () => {
    expect(seasonYear('autumn_winter', 2, 2026)).toBe(2026);
    expect(seasonYear('spring_summer', 9, 2026)).toBe(2027);
    expect(seasonYear('spring_summer', 2, 2026)).toBe(2026);
    // South of the equator a November winter collection is next year's winter.
    expect(seasonYear('autumn_winter', 11, 2026)).toBe(2027);
    // A festive collection shown in October is for that same December.
    expect(seasonYear('winter_festive', 10, 2026)).toBe(2026);
    expect(seasonYear('summer_resort', 3, 2026)).toBe(2026);
  });

  it('runs the four back to back in the order they really run', () => {
    const sim = inParis('fw-four');
    const year = new Date(sim.now).getUTCFullYear();
    const order = ['fw-nyfw', 'fw-lfw', 'fw-mfw', 'fw-pfw'];
    for (const season of [2, 9]) {
      const dates = order.map((id) => editionsIn(sim, year)
        .find((one) => one.weekId === id && new Date(one.startsAt).getUTCMonth() + 1 === (season === 2 ? 2 : 9))!);
      for (const edition of dates) expect(edition, `${season} edition missing`).toBeTruthy();
      for (let i = 1; i < dates.length; i += 1) {
        expect(dates[i]!.startsAt, `${order[i]} does not follow ${order[i - 1]}`)
          .toBeGreaterThan(dates[i - 1]!.startsAt);
      }
    }
  });

  it('turns the calendar round south of the equator', () => {
    // São Paulo and Johannesburg show the summer that is coming to them in
    // April, and the winter that is coming to them in the back half of the year.
    for (const id of ['fw-spfw', 'fw-safw']) {
      const week = FASHION_WEEKS.find((one) => one.id === id)!;
      const spring = week.editions.find((one) => one.season === 'spring_summer')!;
      const autumn = week.editions.find((one) => one.season === 'autumn_winter')!;
      expect(spring.month).toBeLessThan(7);
      expect(autumn.month).toBeGreaterThan(9);
    }
    // And Melbourne in March is showing the autumn that is arriving there.
    const melbourne = FASHION_WEEKS.find((one) => one.id === 'fw-melbourne')!;
    expect(melbourne.editions[0]!.season).toBe('autumn_winter');
    expect(melbourne.editions[0]!.month).toBe(3);
  });

  it('names the Indian editions the way India names them', () => {
    const lakme = FASHION_WEEKS.find((one) => one.id === 'fw-lakme')!;
    expect(lakme.editions.map((one) => one.season)).toEqual(['summer_resort', 'winter_festive']);
    const couture = FASHION_WEEKS.find((one) => one.id === 'fw-icw')!;
    expect(couture.editions[0]!.season).toBe('bridal');
  });

  it('says which dates are public record and which are its own placement', () => {
    const record = FASHION_WEEKS.filter((one) => one.placement === 'record');
    const placed = FASHION_WEEKS.filter((one) => one.placement === 'slate');
    // The four are documented; some of the smaller ones move every year.
    for (const week of FASHION_WEEKS.filter((one) => one.tier === 'big_four')) {
      expect(week.placement, week.name).toBe('record');
    }
    expect(record.length).toBeGreaterThan(placed.length);
    // A week SLATE placed itself says so in its own description.
    for (const week of placed) {
      expect(week.about.toLowerCase(), week.name).toMatch(/move|fixed slot|suspended|stopped/);
    }
  });

  it('lays a year out the same way twice, and only lists a week once per edition', () => {
    const sim = inParis('fw-calendar');
    const year = new Date(sim.now).getUTCFullYear();
    const first = editionsIn(sim, year);
    const again = editionsIn(sim, year);
    expect(again.map((one) => one.id)).toEqual(first.map((one) => one.id));
    expect(new Set(first.map((one) => one.id)).size).toBe(first.length);
    for (let i = 1; i < first.length; i += 1) {
      expect(first[i]!.startsAt).toBeGreaterThanOrEqual(first[i - 1]!.startsAt);
    }
    expect(editionById(sim, first[0]!.id)?.id).toBe(first[0]!.id);
    expect(editionById(sim, 'not-an-edition')).toBeUndefined();
  });

  it('only offers a schedule for the weeks whose houses the catalog sells', () => {
    const sim = inParis('fw-schedules');
    const all = upcomingEditions(sim, 300 * DAY);
    const carried = editionsWithShows(sim, 300 * DAY);
    expect(carried.length).toBeGreaterThan(0);
    expect(carried.length).toBeLessThan(all.length);
    for (const edition of carried) expect(housesAt(edition.weekId).length).toBeGreaterThan(0);
  });
});

describe('the houses', () => {
  it('are all brands the catalog actually sells', () => {
    const sellable = new Set(CATALOG.all()
      .filter((item) => ['clothing', 'footwear', 'accessory', 'watch', 'jewelry'].includes(item.category))
      .map((item) => item.brand));
    for (const house of SHOWING_HOUSES) {
      expect(sellable.has(house.brand), `${house.brand} shows but is not sold`).toBe(true);
    }
    expect(housesAt('fw-pfw').map((one) => one.brand)).toContain('Chanel');
    expect(weeksFor('Chanel').length).toBeGreaterThan(0);
    expect(weeksFor('Not A House')).toEqual([]);
  });

  it('puts the biggest names at the end of the week and nobody in two rooms at once', () => {
    const sim = inParis('fw-schedule');
    const edition = editionsWithShows(sim, 400 * DAY).find((one) => one.weekId === 'fw-pfw')!;
    const shows = showsIn(sim, edition);
    expect(shows.length).toBeGreaterThan(6);

    const slots = new Set(shows.map((show) => `${show.at}@${show.venue}`));
    expect(slots.size).toBe(shows.length);
    for (const show of shows) {
      expect(show.at).toBeGreaterThanOrEqual(edition.startsAt);
      expect(show.at).toBeLessThanOrEqual(edition.endsAt);
    }
    // Chanel closes Paris. It does not open it.
    const chanel = shows.find((show) => show.house.brand === 'Chanel')!;
    const first = shows[0]!;
    expect(chanel.at).toBeGreaterThan(first.at);
    expect(showById(sim, chanel.id)?.show.house.brand).toBe('Chanel');
    expect(showById(sim, 'not-a-show')).toBeUndefined();
  });
});

describe('who gets a seat', () => {
  it('will not seat somebody nobody has heard of, however much money they have', () => {
    const sim = inParis('fw-nobody');
    expect(wardrobeValue(sim)).toBeGreaterThanOrEqual(0);
    const chanel = housesAt('fw-pfw').find((one) => one.brand === 'Chanel')!;
    expect(standingWith(sim, chanel)).toBeLessThan(SEAT_THRESHOLD.standing);
    expect(seatFor(sim, chanel)).toBeUndefined();
  });

  it('seats somebody the world has heard of, and the harder rooms last', () => {
    const sim = inParis('fw-famous');
    famous(sim);
    const seats = housesAt('fw-pfw').map((house) => ({ house, seat: seatFor(sim, house) }));
    expect(seats.filter((one) => one.seat).length).toBeGreaterThan(0);
    // The biggest name on the schedule is the hardest room on it.
    const chanel = seats.find((one) => one.house.brand === 'Chanel')!;
    const smaller = seats.find((one) => one.house.standing < 85)!;
    const order = ['standing', 'back', 'second_row', 'front_row'];
    expect(order.indexOf(chanel.seat ?? 'none')).toBeLessThanOrEqual(order.indexOf(smaller.seat ?? 'none'));
  });

  it('counts buying from a house as knowing the house', () => {
    const sim = inParis('fw-customer');
    const chanel = housesAt('fw-pfw').find((one) => one.brand === 'Chanel')!;
    const before = standingWith(sim, chanel);
    const bought = buyFrom(sim, 'Chanel');
    expect(bought).toBeGreaterThan(0);
    expect(piecesBy(sim, 'Chanel').length).toBe(bought);
    const after = standingWith(sim, chanel);
    expect(after).toBeGreaterThan(before);
    // And it is that house it counts with, not every house.
    const gucci = housesAt('fw-mfw').find((one) => one.brand === 'Gucci')!;
    expect(standingWith(sim, gucci)).toBe(0);
  });

  it('holds controversy against you', () => {
    const sim = inParis('fw-controversy');
    famous(sim);
    const house = housesAt('fw-pfw').find((one) => one.standing < 90)!;
    const clean = standingWith(sim, house);
    sim.player.reputation.controversy = 90;
    expect(standingWith(sim, house)).toBeLessThan(clean);
  });
});

describe('writing to a house', () => {
  it('takes the letter, waits, and answers', () => {
    const sim = inParis('fw-request');
    famous(sim);
    const { showId, brand } = aSeat(sim);
    const asked = sim.execute<{ answerAt: number; house: string }>({
      kind: 'fw.request', payload: { showId },
    });
    expect(asked.ok, String(asked.error)).toBe(true);
    expect(asked.value!.house).toBe(brand);

    const invite = invitesOf(sim)[0]!;
    expect(invite.status).toBe('asked');
    expect(invite.brand).toBe(brand);
    expect(describeInvite(sim, invite)).toContain('No answer yet');

    // Not twice to the same show.
    expect(sim.execute({ kind: 'fw.request', payload: { showId } }).ok).toBe(false);

    sim.advanceTo(asked.value!.answerAt + 60 * MINUTE);
    expect(['accepted', 'refused']).toContain(invite.status);
    if (invite.status === 'accepted') {
      expect(invite.seat).toBeTruthy();
      expect(upcomingInvites(sim).length).toBe(1);
      // A seat is a commitment, so it goes on the calendar.
      expect(sim.timeline.between(sim.now, invite.at + DAY).some((one) => one.kind === 'fw.show')).toBe(true);
    }
  });

  it('refuses a show that has gone and one the list has closed on', () => {
    const sim = inParis('fw-request-late');
    famous(sim);
    const edition = editionsWithShows(sim, 400 * DAY)[0]!;
    const show = showsIn(sim, edition)[0]!;
    expect(sim.execute({ kind: 'fw.request', payload: { showId: 'not-a-show' } }).ok).toBe(false);

    sim.advanceTo(show.at - 2 * DAY);
    const late = sim.execute({ kind: 'fw.request', payload: { showId: show.id } });
    expect(late.ok).toBe(false);
    expect(late.error).toContain('list closed');

    sim.advanceTo(show.at + 2 * DAY);
    expect(sim.execute({ kind: 'fw.request', payload: { showId: show.id } }).ok).toBe(false);
  });

  it('says no to somebody it does not want, and says it in a sentence', () => {
    const sim = inParis('fw-refused');
    // Known enough that a small house might, and nowhere near enough for Paris.
    sim.player.reputation.publicFame = 18;
    const show = editionsWithShows(sim, 400 * DAY)
      .filter((one) => one.weekId === 'fw-pfw')
      .flatMap((one) => showsIn(sim, one))
      .find((one) => one.house.brand === 'Chanel' && one.at > sim.now + 5 * DAY)!;
    expect(show, 'no Chanel show ahead').toBeTruthy();
    const asked = sim.execute<{ answerAt: number }>({ kind: 'fw.request', payload: { showId: show.id } });
    expect(asked.ok, String(asked.error)).toBe(true);
    sim.advanceTo(asked.value!.answerAt + 60 * MINUTE);
    const invite = invitesOf(sim)[0]!;
    expect(invite.status).toBe('refused');
    expect((invite.note ?? '').length).toBeGreaterThan(10);
    expect(describeInvite(sim, invite)).toBe(invite.note);
    // A refusal can be written to again, so long as the list has not closed —
    // and an answer that comes back the day before a show means it has.
    const again = sim.execute({ kind: 'fw.request', payload: { showId: show.id } });
    if (show.at > sim.now + 3 * DAY) expect(again.ok).toBe(true);
    else expect(String(again.error)).toContain('list closed');
  });
});

describe('turning up', () => {
  function withASeat(name: string): { sim: Simulation; inviteId: Id; at: number; cityId: string } {
    const sim = inParis(name);
    famous(sim);
    const { showId } = aSeat(sim);
    const asked = sim.execute<{ answerAt: number }>({ kind: 'fw.request', payload: { showId } });
    expect(asked.ok, String(asked.error)).toBe(true);
    sim.advanceTo(asked.value!.answerAt + 60 * MINUTE);
    const invite = invitesOf(sim).find((one) => one.status === 'accepted');
    if (!invite) throw new Error('the house said no, which this test cannot use');
    // The show is wherever the show is, so be in that city for it.
    sim.player.currentLocationId = invite.cityId;
    return { sim, inviteId: invite.id, at: invite.at, cityId: invite.cityId };
  }

  it('will not let you in early, from another city, or in nothing you chose', () => {
    const { sim, inviteId, at } = withASeat('fw-attend-guards');
    const early = sim.execute({ kind: 'fw.attend', payload: { inviteId } });
    expect(early.ok).toBe(false);
    expect(early.error).toContain('Nobody is inside yet');

    sim.advanceTo(at - 20 * MINUTE);
    const there = sim.player.currentLocationId;
    sim.player.currentLocationId = 'us-tx-austin';
    const away = sim.execute({ kind: 'fw.attend', payload: { inviteId } });
    expect(away.ok).toBe(false);
    expect(away.error).toContain('you are not');

    sim.player.currentLocationId = there;
    const undressed = sim.execute({ kind: 'fw.attend', payload: { inviteId } });
    expect(undressed.ok).toBe(false);
    expect(undressed.error).toContain('not dressed');

    // And wearing something is not the same as being dressed: one T-shirt and
    // nothing else is refused by name.
    buyFrom(sim, 'Uniqlo', 4);
    const shirt = garmentsOf(sim, sim.player.id).find((asset) => asset.wardrobe?.slot === 'top');
    expect(shirt, 'no top was bought to test with').toBeTruthy();
    sim.execute({ kind: 'wear.put_on', payload: { assetId: shirt!.id } });
    expect(wearing(sim, sim.player.id).length).toBe(1);
    const half = sim.execute({ kind: 'fw.attend', payload: { inviteId } });
    expect(half.ok).toBe(false);
    expect(half.error).toContain('no bottom');
    expect(half.error).toContain('no shoes');
  });

  it('looks at what you have on, charges for the evening and writes it down', () => {
    const { sim, inviteId, at } = withASeat('fw-attend');
    sim.advanceTo(at - 20 * MINUTE);
    getDressed(sim);
    expect(wearing(sim, sim.player.id).length).toBeGreaterThan(0);
    const accountId = sim.player.primaryAccountId!;

    const went = sim.execute<{ verdict: number; photographed: boolean; note: string; cost: number }>({
      kind: 'fw.attend', payload: { inviteId },
    });
    expect(went.ok, String(went.error)).toBe(true);
    expect(went.value!.verdict).toBeGreaterThanOrEqual(0);
    expect(went.value!.verdict).toBeLessThanOrEqual(100);
    expect(went.value!.note.length).toBeGreaterThan(10);
    expect(went.value!.cost).toBe(turningUpCost(sim.player.currentLocationId));
    expect(sim.ledger.history(accountId, 30).some((entry) => (entry.memo ?? '').includes('show'))).toBe(true);

    const invite = sim.universe.fashionInvites[inviteId]!;
    expect(invite.status).toBe('attended');
    expect(invite.attended!.verdict).toBe(went.value!.verdict);
    expect(invite.attended!.look.length).toBeGreaterThan(0);
    expect(describeInvite(sim, invite)).toContain(invite.weekName);
    expect(describeInvite(sim, invite)).toContain(invite.venue);

    // And you go to a show once.
    expect(sim.execute({ kind: 'fw.attend', payload: { inviteId } }).ok).toBe(false);
  });

  it('reads the house’s own clothes as the compliment they are', () => {
    const sim = inParis('fw-house-clothes');
    famous(sim);
    const edition = editionsWithShows(sim, 400 * DAY)
      .find((one) => one.weekId === 'fw-pfw' && one.startsAt > sim.now + 5 * DAY)!;
    const show = showsIn(sim, edition).find((one) => seatFor(sim, one.house) && one.at > sim.now + 5 * DAY)!;
    expect(show, 'nothing ahead in Paris to go to').toBeTruthy();
    buyFrom(sim, show.house.brand, 4);

    const asked = sim.execute<{ answerAt: number }>({ kind: 'fw.request', payload: { showId: show.id } });
    expect(asked.ok, String(asked.error)).toBe(true);
    sim.advanceTo(asked.value!.answerAt + 60 * MINUTE);
    // Famous, and a customer of this house: they say yes.
    const invite = invitesOf(sim).find((one) => one.status === 'accepted');
    expect(invite, 'a famous customer of the house was still turned away').toBeTruthy();

    sim.advanceTo(invite!.at - 20 * MINUTE);
    // Wear the house's own, and enough of it to be dressed.
    getDressed(sim);
    for (const piece of piecesBy(sim, show.house.brand).slice(0, 3)) {
      sim.execute({ kind: 'wear.put_on', payload: { assetId: piece.id } });
    }
    // Putting the house's own on can displace something, so fill the gaps.
    getDressed(sim);
    expect(wearing(sim, sim.player.id).some((one) => one.brand === show.house.brand)).toBe(true);
    expect(emptySlots(wearing(sim, sim.player.id)).filter((slot) => ESSENTIAL_SLOTS.includes(slot))).toEqual([]);
    const went = sim.execute<{ look: string }>({ kind: 'fw.attend', payload: { inviteId: invite!.id } });
    expect(went.ok, String(went.error)).toBe(true);
    expect(went.value!.look).toContain('house’s own');
  });

  it('shuts the doors, and an empty seat is noticed', () => {
    const { sim, inviteId, at } = withASeat('fw-missed');
    sim.advanceTo(at + 2 * 3_600_000);
    const invite = sim.universe.fashionInvites[inviteId]!;
    expect(invite.status).toBe('missed');
    expect(describeInvite(sim, invite)).toContain('never turned up');
    expect(sim.execute({ kind: 'fw.attend', payload: { inviteId } }).ok).toBe(false);
  });

  it('can be turned down, once', () => {
    const { sim, inviteId } = withASeat('fw-decline');
    expect(sim.execute({ kind: 'fw.decline', payload: { inviteId } }).ok).toBe(true);
    expect(sim.universe.fashionInvites[inviteId]!.status).toBe('declined');
    expect(sim.execute({ kind: 'fw.decline', payload: { inviteId } }).ok).toBe(false);
    expect(sim.execute({ kind: 'fw.attend', payload: { inviteId } }).ok).toBe(false);
  });
});

describe('what a save carries', () => {
  it('keeps the letter rather than the calendar', () => {
    const sim = inParis('fw-persist');
    famous(sim);
    const { showId } = aSeat(sim);
    sim.execute({ kind: 'fw.request', payload: { showId } });
    const snapshot = JSON.parse(JSON.stringify(sim.universe)) as typeof sim.universe;
    expect(Object.keys(snapshot.fashionInvites).length).toBe(1);
    const [invite] = Object.values(snapshot.fashionInvites);
    // The stub stands on its own after the season has moved on.
    expect(invite!.weekName.length).toBeGreaterThan(0);
    expect(invite!.season.length).toBeGreaterThan(0);
    expect(invite!.venue.length).toBeGreaterThan(0);
    expect(invite!.saveId).toBe(sim.universe.meta.id);
  });
});
