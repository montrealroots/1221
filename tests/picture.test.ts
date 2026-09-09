/**
 * Cutting it, screening it, and putting it somewhere.
 *
 * What a test can hold about the last third of making something yourself: a
 * picture that will not be finished out of days that were never shot, a cut
 * that stops improving once it has had what it wants, a quality that is
 * written once and never rewritten, a room you pay for and the people who
 * actually came, and a festival that takes the fee, takes months, and usually
 * says no.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  RUNTIME_CAP, SETUPS_NEEDED, ceilingOf, cutHoursWanted, describeFilm, entryFee, filmsOf, roomCost,
  roomsIn, setupsIn,
} from '@/engine/systems/picture';
import { placesIn } from '@/engine/content/places';
import { FESTIVALS, FESTIVAL_BY_ID, festivalsFor } from '@/engine/content/festivals';
import { CITIES } from '@/engine/content/geography';
import { housesIn, stockOf, outNow } from '@/engine/systems/rental';
import { createRelationship, relationshipsOf } from '@/engine/systems/relationships';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, IndieFilm } from '@/engine/domain/model';

const DAY = 86_400_000;
const HOUR = 3_600_000;

function inLosAngeles(name: string): Simulation {
  const sim = quickSave({ wealth: 'wealthy' }, name);
  sim.player.currentLocationId = 'us-ca-losangeles';
  return sim;
}

/** A camera in your hands, because a day will not run without one. */
function withCamera(sim: Simulation): void {
  const house = housesIn(sim).find((place) => ((place as { lines?: string[] }).lines ?? []).includes('camera'))!;
  const body = [...stockOf(sim, house)]
    .filter((good) => good.subcategory === 'camera')
    .sort((a, b) => a.basePrice - b.basePrice)[0]!;
  const hired = sim.execute<{ hireId: Id }>({
    kind: 'kit.hire', payload: { houseId: house.id, items: [{ catalogId: body.id }], days: 30 },
  });
  expect(hired.ok, String(hired.error)).toBe(true);
  sim.execute({ kind: 'kit.collect', payload: { hireId: hired.value!.hireId } });
  expect(outNow(sim).length).toBe(1);
}

/** Plan a day, wait for it, shoot it, and hand back what it got. */
function shootADay(sim: Simulation, setups = 6): Id {
  const planned = sim.execute<{ dayId: Id }>({
    kind: 'shoot.plan',
    payload: { title: 'A Day', at: sim.now + 2 * HOUR, hours: 10, where: 'street', setups },
  });
  expect(planned.ok, String(planned.error)).toBe(true);
  const dayId = planned.value!.dayId;
  sim.advanceTo(sim.universe.shootDays[dayId]!.at);
  sim.player.wellbeing.energy = 100;
  const ran = sim.execute({ kind: 'shoot.run', payload: { dayId } });
  expect(ran.ok, String(ran.error)).toBe(true);
  return dayId;
}

/** Start a picture and put enough shot days into it to be worth cutting. */
function aPictureInTheCan(sim: Simulation, days = 3): IndieFilm {
  const started = sim.execute<{ filmId: Id }>({
    kind: 'film.start', payload: { title: 'The Kitchen Scene', format: 'short', logline: 'A flat, a Sunday.' },
  });
  expect(started.ok, String(started.error)).toBe(true);
  const filmId = started.value!.filmId;
  for (let i = 0; i < days; i += 1) {
    const dayId = shootADay(sim);
    expect(sim.execute({ kind: 'film.attach_day', payload: { filmId, dayId } }).ok).toBe(true);
  }
  return sim.universe.indieFilms[filmId]!;
}

/** Sit at the bench until the cut has had everything it wants. */
function cutItThrough(sim: Simulation, film: IndieFilm): void {
  for (let i = 0; i < 40 && film.cutHours < cutHoursWanted(sim, film); i += 1) {
    sim.player.wellbeing.energy = 100;
    const result = sim.execute({ kind: 'film.cut', payload: { filmId: film.id, hours: 8 } });
    expect(result.ok, String(result.error)).toBe(true);
  }
}

describe('the list of festivals', () => {
  it('is real festivals in cities this world has', () => {
    expect(FESTIVALS.length).toBeGreaterThanOrEqual(24);
    for (const festival of FESTIVALS) {
      expect(CITIES.get(festival.cityId), `${festival.name} is in a city that exists`).toBeTruthy();
      expect(festival.month).toBeGreaterThanOrEqual(1);
      expect(festival.month).toBeLessThanOrEqual(12);
      expect(festival.takes.length).toBeGreaterThan(0);
      expect(festival.fee).toBeGreaterThan(0);
      expect(festival.about).toContain('SLATE');
    }
    const ids = new Set(FESTIVALS.map((one) => one.id));
    expect(ids.size).toBe(FESTIVALS.length);
    const names = new Set(FESTIVALS.map((one) => one.name));
    expect(names.size).toBe(FESTIVALS.length);
  });

  it('only offers a picture the festivals that would look at it', () => {
    for (const format of ['short', 'feature', 'documentary', 'animation'] as const) {
      const list = festivalsFor(format);
      expect(list.length).toBeGreaterThan(0);
      for (const festival of list) expect(festival.takes).toContain(format);
      // Sorted by what getting in is worth, best first.
      for (let i = 1; i < list.length; i += 1) {
        expect(list[i - 1]!.standing).toBeGreaterThanOrEqual(list[i]!.standing);
      }
    }
    expect(festivalsFor('animation').some((one) => one.id === 'fest-cannes')).toBe(false);
  });
});

describe('starting a picture', () => {
  it('takes a title and a kind, and refuses neither', () => {
    const sim = inLosAngeles('film-start');
    const started = sim.execute<{ filmId: Id }>({
      kind: 'film.start', payload: { title: 'Nightshift', format: 'short' },
    });
    expect(started.ok, String(started.error)).toBe(true);
    const film = sim.universe.indieFilms[started.value!.filmId]!;
    expect(film.title).toBe('Nightshift');
    expect(film.status).toBe('shooting');
    expect(film.dayIds).toEqual([]);
    expect(filmsOf(sim).length).toBe(1);
    expect(describeFilm(sim, film)).toContain('in the can');

    expect(sim.execute({ kind: 'film.start', payload: { title: ' ', format: 'short' } }).ok).toBe(false);
    expect(sim.execute({ kind: 'film.start', payload: { title: 'Fine', format: 'opera' } }).ok).toBe(false);
  });

  it('only takes days that were actually shot, and only once each', () => {
    const sim = inLosAngeles('film-attach');
    withCamera(sim);
    const filmId = sim.execute<{ filmId: Id }>({
      kind: 'film.start', payload: { title: 'The Yard', format: 'short' },
    }).value!.filmId;

    const plannedOnly = sim.execute<{ dayId: Id }>({
      kind: 'shoot.plan', payload: { title: 'Later', at: sim.now + 6 * DAY, hours: 8, where: 'street', setups: 4 },
    }).value!.dayId;
    const refused = sim.execute({ kind: 'film.attach_day', payload: { filmId, dayId: plannedOnly } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toContain('Nothing was shot');

    const dayId = shootADay(sim);
    expect(sim.execute({ kind: 'film.attach_day', payload: { filmId, dayId } }).ok).toBe(true);
    expect(sim.execute({ kind: 'film.attach_day', payload: { filmId, dayId } }).ok).toBe(false);
    expect(sim.universe.indieFilms[filmId]!.dayIds).toEqual([dayId]);
  });
});

describe('whose material it is', () => {
  it('will not put one day of material into two pictures', () => {
    const sim = inLosAngeles('film-one-day-one-picture');
    withCamera(sim);
    const first = sim.execute<{ filmId: Id }>({
      kind: 'film.start', payload: { title: 'The First One', format: 'short' },
    }).value!.filmId;
    const second = sim.execute<{ filmId: Id }>({
      kind: 'film.start', payload: { title: 'The Other One', format: 'short' },
    }).value!.filmId;
    const dayId = shootADay(sim);
    expect(sim.execute({ kind: 'film.attach_day', payload: { filmId: first, dayId } }).ok).toBe(true);
    const stolen = sim.execute({ kind: 'film.attach_day', payload: { filmId: second, dayId } });
    expect(stolen.ok).toBe(false);
    expect(stolen.error).toContain('The First One');
    expect(sim.universe.indieFilms[second]!.dayIds).toEqual([]);
  });
});

describe('the bench', () => {
  it('will not cut an empty picture, and takes the hours out of the day', () => {
    const sim = inLosAngeles('film-cut');
    withCamera(sim);
    const empty = sim.execute<{ filmId: Id }>({
      kind: 'film.start', payload: { title: 'Nothing Yet', format: 'short' },
    }).value!.filmId;
    const refused = sim.execute({ kind: 'film.cut', payload: { filmId: empty, hours: 4 } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toContain('nothing in the can');

    const film = aPictureInTheCan(sim, 2);
    const before = sim.now;
    sim.player.wellbeing.energy = 100;
    const cut = sim.execute<{ cutHours: number; wanted: number; note: string }>({
      kind: 'film.cut', payload: { filmId: film.id, hours: 6 },
    });
    expect(cut.ok, String(cut.error)).toBe(true);
    expect(cut.value!.cutHours).toBe(6);
    expect((sim.now - before) / HOUR).toBeCloseTo(6, 1);
    expect(sim.player.wellbeing.energy).toBeLessThan(100);
    expect(film.status).toBe('cutting');
  });

  it('says so when more hours would not make it better', () => {
    const sim = inLosAngeles('film-cut-enough');
    withCamera(sim);
    const film = aPictureInTheCan(sim, 2);
    cutItThrough(sim, film);
    expect(film.cutHours).toBeGreaterThanOrEqual(cutHoursWanted(sim, film));
    sim.player.wellbeing.energy = 100;
    const more = sim.execute<{ note: string }>({ kind: 'film.cut', payload: { filmId: film.id, hours: 4 } });
    expect(more.ok, String(more.error)).toBe(true);
    expect(more.value!.note).toMatch(/(will not|won’t) make it better/);
  });

  it('refuses a bench when there is nothing left of you', () => {
    const sim = inLosAngeles('film-cut-tired');
    withCamera(sim);
    const film = aPictureInTheCan(sim, 2);
    sim.player.wellbeing.energy = 4;
    const refused = sim.execute({ kind: 'film.cut', payload: { filmId: film.id, hours: 4 } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toContain('too tired');
  });
});

describe('calling it finished', () => {
  it('will not finish a picture out of days that were never got', () => {
    const sim = inLosAngeles('film-thin');
    withCamera(sim);
    const filmId = sim.execute<{ filmId: Id }>({
      kind: 'film.start', payload: { title: 'Half A Thing', format: 'feature' },
    }).value!.filmId;
    const dayId = shootADay(sim, 4);
    sim.execute({ kind: 'film.attach_day', payload: { filmId, dayId } });
    const refused = sim.execute({ kind: 'film.finish', payload: { filmId } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/n[o’]t enough there/);
  });

  it('will not finish a picture nobody sat down with', () => {
    const sim = inLosAngeles('film-unsat');
    withCamera(sim);
    const film = aPictureInTheCan(sim, 3);
    expect(setupsIn(sim, film)).toBeGreaterThanOrEqual(Math.ceil(SETUPS_NEEDED.short * 0.4));
    const refused = sim.execute({ kind: 'film.finish', payload: { filmId: film.id } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toContain('sat down with');
  });

  it('writes a runtime and a quality the material set a ceiling on, and writes it once', () => {
    const sim = inLosAngeles('film-finish');
    withCamera(sim);
    const film = aPictureInTheCan(sim, 3);
    const ceiling = ceilingOf(sim, film);
    cutItThrough(sim, film);

    const done = sim.execute<{ runtimeMinutes: number; quality: number; note: string }>({
      kind: 'film.finish', payload: { filmId: film.id },
    });
    expect(done.ok, String(done.error)).toBe(true);
    expect(done.value!.quality).toBeLessThanOrEqual(ceiling);
    expect(done.value!.quality).toBeGreaterThan(0);
    expect(done.value!.runtimeMinutes).toBeLessThanOrEqual(RUNTIME_CAP.short);
    expect(done.value!.runtimeMinutes).toBeGreaterThanOrEqual(4);
    expect(film.status).toBe('finished');
    expect(film.cut!.quality).toBe(done.value!.quality);
    expect(describeFilm(sim, film)).toContain('minutes');

    // The quality is written once. Nothing after this rewrites it.
    const again = sim.execute({ kind: 'film.finish', payload: { filmId: film.id } });
    expect(again.ok).toBe(false);
    expect(film.cut!.quality).toBe(done.value!.quality);
    // And nothing more goes into a picture that is cut.
    const late = shootADay(sim);
    expect(sim.execute({ kind: 'film.attach_day', payload: { filmId: film.id, dayId: late } }).ok).toBe(false);
  });
});

describe('showing it to people', () => {
  it('has nothing to show until it is finished', () => {
    const sim = inLosAngeles('film-screen-early');
    withCamera(sim);
    const film = aPictureInTheCan(sim, 2);
    const refused = sim.execute({ kind: 'film.screen', payload: { filmId: film.id } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toContain('nothing finished');
  });

  it('pays for the room, and who comes is who you actually know', () => {
    const sim = inLosAngeles('film-screen');
    withCamera(sim);
    const film = aPictureInTheCan(sim, 3);
    cutItThrough(sim, film);
    expect(sim.execute({ kind: 'film.finish', payload: { filmId: film.id } }).ok).toBe(true);

    // Ten people who know you well enough to turn up.
    const others = Object.values(sim.universe.people).filter((person) => !person.isPlayer).slice(0, 10);
    for (const person of others) {
      createRelationship(sim, sim.player.id, person.id, 'friend', {
        dimensions: { familiarity: 90, affection: 90, trust: 80, respect: 80, conflict: 0 },
      });
    }

    const rooms = roomsIn(sim);
    expect(rooms.length).toBeGreaterThan(0);
    const room = rooms[0]!;
    const accountId = sim.player.primaryAccountId!;

    const shown = sim.execute<{ came: number; invited: number; cost: number; note: string }>({
      kind: 'film.screen', payload: { filmId: film.id, placeId: room.id },
    });
    expect(shown.ok, String(shown.error)).toBe(true);
    expect(shown.value!.cost).toBe(roomCost(sim.player.currentLocationId, room.price));
    expect(shown.value!.invited).toBe(relationshipsOf(sim, sim.player.id).length);
    expect(shown.value!.invited).toBeGreaterThan(0);
    expect(shown.value!.came).toBeGreaterThan(0);
    expect(shown.value!.note.length).toBeGreaterThan(10);
    expect(film.screenings.length).toBe(1);
    expect(film.screenings[0]!.placeName).toBe(room.name);

    const paid = sim.ledger.history(accountId, 40)
      .some((entry) => (entry.memo ?? '').includes('Screening room'));
    expect(paid).toBe(true);

    // A room in this city, and nowhere else. A restaurant is not a room.
    expect(sim.execute({ kind: 'film.screen', payload: { filmId: film.id, placeId: 'not-a-place' } }).ok).toBe(false);
    const notARoom = placesIn(sim.player.currentLocationId)
      .find((one) => !rooms.some((each) => each.id === one.id))!;
    expect(notARoom).toBeTruthy();
    expect(sim.execute({ kind: 'film.screen', payload: { filmId: film.id, placeId: notARoom.id } }).ok).toBe(false);
  });

  it('can be shown at your own place for nothing', () => {
    const sim = inLosAngeles('film-screen-home');
    withCamera(sim);
    const film = aPictureInTheCan(sim, 3);
    cutItThrough(sim, film);
    sim.execute({ kind: 'film.finish', payload: { filmId: film.id } });
    const shown = sim.execute<{ cost: number }>({ kind: 'film.screen', payload: { filmId: film.id } });
    expect(shown.ok, String(shown.error)).toBe(true);
    expect(shown.value!.cost).toBe(0);
    expect(film.screenings[0]!.placeName).toBe('Your Own Place');
  });
});

describe('sending it somewhere', () => {
  function aFinishedShort(name: string): { sim: Simulation; film: IndieFilm } {
    const sim = inLosAngeles(name);
    withCamera(sim);
    const film = aPictureInTheCan(sim, 3);
    cutItThrough(sim, film);
    expect(sim.execute({ kind: 'film.finish', payload: { filmId: film.id } }).ok).toBe(true);
    return { sim, film };
  }

  it('takes the fee, and takes months to answer', () => {
    const { sim, film } = aFinishedShort('film-submit');
    const accountId = sim.player.primaryAccountId!;
    const sent = sim.execute<{ fee: number; answerAt: number; festival: string }>({
      kind: 'film.submit', payload: { filmId: film.id, festivalId: 'fest-sxsw' },
    });
    expect(sent.ok, String(sent.error)).toBe(true);
    expect(sent.value!.festival).toBe('SXSW');
    expect(sent.value!.fee).toBe(entryFee(FESTIVAL_BY_ID['fest-sxsw']!));
    expect(sent.value!.fee).toBeGreaterThan(0);
    const wait = (sent.value!.answerAt - sim.now) / DAY;
    expect(wait).toBeGreaterThanOrEqual(44);
    expect(wait).toBeLessThanOrEqual(121);
    expect(film.submissions.length).toBe(1);
    expect(film.submissions[0]!.status).toBe('sent');
    expect(sim.ledger.history(accountId, 40).some((entry) => (entry.memo ?? '').includes('Festival entry'))).toBe(true);

    // Not twice to the same one while it is still out.
    expect(sim.execute({ kind: 'film.submit', payload: { filmId: film.id, festivalId: 'fest-sxsw' } }).ok).toBe(false);
    // And not to one that does not take this kind of picture.
    expect(FESTIVAL_BY_ID['fest-hotdocs']!.takes).not.toContain('short');
    expect(sim.execute({ kind: 'film.submit', payload: { filmId: film.id, festivalId: 'fest-hotdocs' } }).ok).toBe(false);
    expect(sim.execute({ kind: 'film.submit', payload: { filmId: film.id, festivalId: 'fest-nowhere' } }).ok).toBe(false);
  });

  it('answers when the wait is up, and the answer is one of the two', () => {
    const { sim, film } = aFinishedShort('film-answer');
    const sent = sim.execute<{ answerAt: number }>({
      kind: 'film.submit', payload: { filmId: film.id, festivalId: 'fest-gff' },
    });
    expect(sent.ok, String(sent.error)).toBe(true);
    expect(film.submissions[0]!.status).toBe('sent');

    sim.advanceTo(sent.value!.answerAt + HOUR);
    const submission = film.submissions[0]!;
    expect(['accepted', 'rejected']).toContain(submission.status);
    expect((submission.note ?? '').length).toBeGreaterThan(10);
    if (submission.status === 'accepted') {
      expect(describeFilm(sim, film)).toContain('festival');
    }
  });

  it('has nothing to send until it is finished', () => {
    const sim = inLosAngeles('film-submit-early');
    withCamera(sim);
    const film = aPictureInTheCan(sim, 2);
    const refused = sim.execute({ kind: 'film.submit', payload: { filmId: film.id, festivalId: 'fest-gff' } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toContain('nothing finished');
  });
});

describe('the drawer', () => {
  it('takes a picture out of the running, once', () => {
    const sim = inLosAngeles('film-abandon');
    withCamera(sim);
    const film = aPictureInTheCan(sim, 1);
    expect(sim.execute({ kind: 'film.abandon', payload: { filmId: film.id } }).ok).toBe(true);
    expect(film.status).toBe('abandoned');
    expect(describeFilm(sim, film)).toContain('drawer');
    expect(sim.execute({ kind: 'film.abandon', payload: { filmId: film.id } }).ok).toBe(false);
    expect(sim.execute({ kind: 'film.abandon', payload: { filmId: 'film-nope' } }).ok).toBe(false);
  });
});

describe('what a save carries', () => {
  it('keeps pictures across a save and a load', () => {
    const sim = inLosAngeles('film-persist');
    withCamera(sim);
    const film = aPictureInTheCan(sim, 2);
    const snapshot = JSON.parse(JSON.stringify(sim.universe)) as typeof sim.universe;
    expect(Object.keys(snapshot.indieFilms).length).toBe(1);
    expect(snapshot.indieFilms[film.id]!.dayIds.length).toBe(2);
    expect(snapshot.indieFilms[film.id]!.saveId).toBe(sim.universe.meta.id);
  });
});
