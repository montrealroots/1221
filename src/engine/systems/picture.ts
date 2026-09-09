/**
 * SLATE — cutting it, screening it, and putting it somewhere.
 *
 * The last third of making something yourself. The days you shot go into a
 * picture; the picture is cut at a bench over hours that come out of your
 * life; what comes out has a runtime and a quality that the material sets a
 * ceiling on, because you cannot cut a good film out of days you never got.
 * Then you put it in front of people: a room you pay for and the people you
 * know, or a festival, which is a form, a fee and a long wait that usually
 * ends in a no.
 *
 * Nothing here invents a result and narrates backwards. The quality is the
 * material and the work. The festival's answer is that quality against how
 * selective the festival is, and the note says which it was.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Id, IndieFilm, Screening, Submission } from '../domain/model';
import { clamp } from '../core/rng';
import type { Instant } from '../core/time';
import { MS_MINUTE, addDays, formatDate } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { plural } from '../core/text';
import { CITIES } from '../content/geography';
import { placesIn } from '../content/places';
import { costOfLiving } from '../content/tax';
import {
  ANSWER_DAYS, FESTIVAL_BY_ID, FESTIVALS, type Festival, type FilmFormat, festivalsFor,
} from '../content/festivals';
import { addMemory, findRelationship, relationshipsOf, otherParty } from './relationships';
import { shootDaysOf } from './shoot';

// ---------------------------------------------------------------------------
// What a picture is
// ---------------------------------------------------------------------------

/** How long each kind of thing runs, at the outside, in minutes. */
export const RUNTIME_CAP: Readonly<Record<FilmFormat, number>> = {
  short: 30,
  feature: 130,
  documentary: 110,
  animation: 24,
};

/** Setups you need in the can before there is a picture there at all. */
export const SETUPS_NEEDED: Readonly<Record<FilmFormat, number>> = {
  short: 8,
  feature: 45,
  documentary: 30,
  animation: 12,
};

/** Hours at the bench a cut wants, per setup, before it stops improving. */
const CUT_HOURS_PER_SETUP = 2.2;

/** A screening costs the room, by how good the room is. SLATE's calibration. */
const ROOM_BY_PRICE: Readonly<Record<1 | 2 | 3 | 4, Money>> = {
  1: 90_00, 2: 220_00, 3: 600_00, 4: 1_500_00,
};

/** The most people who will ever come to a screening you put on yourself. */
const SEATS = 80;

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export function filmsOf(sim: Simulation, personId: Id = sim.player.id): IndieFilm[] {
  return Object.values(sim.universe.indieFilms)
    .filter((film) => film.personId === personId)
    .sort((a, b) => b.startedAt - a.startedAt);
}

export function filmById(sim: Simulation, filmId: Id): IndieFilm | undefined {
  return sim.universe.indieFilms[filmId];
}

/** Setups actually in the can for a picture, across every day that fed it. */
export function setupsIn(sim: Simulation, film: IndieFilm): number {
  return film.dayIds
    .map((dayId) => sim.universe.shootDays[dayId])
    .filter((day) => day?.status === 'shot')
    .reduce((sum, day) => sum + (day!.got ?? 0), 0);
}

/** What the material will carry, before any work at the bench. */
export function ceilingOf(sim: Simulation, film: IndieFilm): number {
  const got = setupsIn(sim, film);
  const need = SETUPS_NEEDED[film.format];
  const coverage = clamp(got / need, 0, 1.15);

  // Days with people on them are better days, and it shows in the cut.
  const days = film.dayIds.map((dayId) => sim.universe.shootDays[dayId]).filter(Boolean);
  const crewed = days.length === 0
    ? 0
    : days.reduce((sum, day) => sum + day!.crew.filter((member) => member.answer === 'yes').length, 0) / days.length;

  return clamp(Math.round(coverage * 72 + Math.min(crewed, 4) * 5 + 8), 0, 100);
}

/** Hours the cut wants before more hours stop helping. */
export function cutHoursWanted(sim: Simulation, film: IndieFilm): number {
  return Math.max(6, Math.round(setupsIn(sim, film) * CUT_HOURS_PER_SETUP));
}

/** Where a picture stands, in a sentence. */
export function describeFilm(sim: Simulation, film: IndieFilm): string {
  const got = setupsIn(sim, film);
  if (film.status === 'abandoned') return 'Left in a drawer.';
  if (film.cut) {
    const accepted = film.submissions.filter((one) => one.status === 'accepted').length;
    const waiting = film.submissions.filter((one) => one.status === 'sent').length;
    return `${film.cut.runtimeMinutes} minutes, cut ${formatDate(film.cut.at, sim.homeZone)}.`
      + (accepted > 0 ? ` In ${plural(accepted, 'festival')}.` : waiting > 0 ? ` ${plural(waiting, 'answer')} still to come.` : '');
  }
  return `${plural(got, 'setup')} in the can, ${plural(Math.round(film.cutHours), 'hour')} at the bench.`;
}

/** Rooms in this city that would let you screen something. */
export function roomsIn(sim: Simulation, cityId = sim.player.currentLocationId) {
  return placesIn(cityId)
    .filter((place) => place.kind === 'cinema' || place.kind === 'theatre' || place.kind === 'bar' || place.kind === 'club')
    .sort((a, b) => (b.quality ?? 0) - (a.quality ?? 0));
}

export function roomCost(cityId: string, price: 1 | 2 | 3 | 4): Money {
  return Math.round((ROOM_BY_PRICE[price] * costOfLiving(cityId)) / 100) * 100;
}

/**
 * What an entry actually costs, where the festival is.
 *
 * The list carries a base fee; what you pay is that fee where the festival
 * lives. The panel and the command both read this, so what you are shown is
 * what leaves the account.
 */
export function entryFee(festival: Festival): Money {
  return Math.round((festival.fee * costOfLiving(festival.cityId)) / 100) * 100;
}

// ---------------------------------------------------------------------------
// The commands
// ---------------------------------------------------------------------------

export function registerPictureSystem(sim: Simulation): void {
  /** Naming the thing, which is where it starts. */
  sim.onCommand<
    { title: string; logline?: string; format: FilmFormat },
    { filmId: Id }
  >(
    'film.start',
    (p, { sim: s }) => {
      const title = (p.title ?? '').trim();
      if (title.length < 2) throw new CommandError('Give it a title, even a working one.');
      if (!RUNTIME_CAP[p.format]) throw new CommandError('That isn’t a kind of picture.');

      const film: IndieFilm = {
        id: s.nextId('film'),
        saveId: s.universe.meta.id,
        personId: s.player.id,
        title,
        logline: (p.logline ?? '').trim().slice(0, 240),
        format: p.format,
        startedAt: s.now,
        dayIds: [],
        cutHours: 0,
        screenings: [],
        submissions: [],
        status: 'shooting',
      };
      s.universe.indieFilms[film.id] = film;
      s.emit('film.started', { filmId: film.id, format: film.format });
      return { filmId: film.id };
    },
  );

  /** Putting a day that was shot into the picture it belongs to. */
  sim.onCommand<{ filmId: Id; dayId: Id }, { setups: number }>(
    'film.attach_day',
    (p, { sim: s }) => {
      const film = s.universe.indieFilms[p.filmId];
      if (!film) throw new CommandError('No such picture.');
      if (film.cut) throw new CommandError('That picture is cut. Nothing more goes into it.');
      const day = s.universe.shootDays[p.dayId];
      if (!day || day.personId !== s.player.id) throw new CommandError('No such day.');
      if (film.dayIds.includes(day.id)) throw new CommandError('That day is already in it.');
      if (day.status !== 'shot') throw new CommandError('Nothing was shot that day.');
      // A day of material goes into one picture. Otherwise three days shot
      // once could be cut into two finished films, which is not how any of
      // this works.
      const elsewhere = Object.values(s.universe.indieFilms)
        .find((other) => other.id !== film.id && other.dayIds.includes(day.id));
      if (elsewhere) throw new CommandError(`That day is already in ${elsewhere.title}.`);

      film.dayIds.push(day.id);
      s.emit('film.day_attached', { filmId: film.id, dayId: day.id });
      return { setups: setupsIn(s, film) };
    },
  );

  /**
   * Hours at the bench.
   *
   * The hours are real hours out of the day. They stop helping once the cut
   * has had what it wants, and the panel says so rather than letting you sit
   * there forever improving nothing.
   */
  sim.onCommand<{ filmId: Id; hours?: number }, { cutHours: number; wanted: number; note: string }>(
    'film.cut',
    (p, { sim: s }) => {
      const film = s.universe.indieFilms[p.filmId];
      if (!film) throw new CommandError('No such picture.');
      if (film.cut) throw new CommandError('That picture is already cut.');
      if (setupsIn(s, film) === 0) throw new CommandError('There’s nothing in the can to cut.');
      if (s.player.wellbeing.energy < 10) throw new CommandError('You’re too tired to be any use at a bench.');

      const hours = clamp(Math.round(p.hours ?? 4), 1, 12);
      s.advanceTo(s.now + hours * 60 * MS_MINUTE);
      s.player.wellbeing.energy = clamp(s.player.wellbeing.energy - hours * 2.6, 0, 100);
      film.cutHours += hours;
      film.status = 'cutting';

      const wanted = cutHoursWanted(s, film);
      const note = film.cutHours >= wanted
        ? 'It has had what it needs. More hours won’t make it better.'
        : `${plural(Math.max(0, wanted - Math.round(film.cutHours)), 'hour')} of it left in the material.`;
      s.emit('film.cut_hours', { filmId: film.id, hours, total: film.cutHours });
      return { cutHours: film.cutHours, wanted, note };
    },
  );

  /**
   * Calling it finished.
   *
   * The runtime comes out of what was shot; the quality out of the material
   * and the hours, and it can never be better than the material. This is the
   * only place a quality is ever written, and it is never written twice.
   */
  sim.onCommand<{ filmId: Id }, { runtimeMinutes: number; quality: number; note: string }>(
    'film.finish',
    (p, { sim: s }) => {
      const film = s.universe.indieFilms[p.filmId];
      if (!film) throw new CommandError('No such picture.');
      if (film.cut) throw new CommandError('That picture is already finished.');

      const got = setupsIn(s, film);
      const need = SETUPS_NEEDED[film.format];
      if (got < Math.ceil(need * 0.4)) {
        throw new CommandError(
          `There isn’t enough there. A ${film.format} wants about ${plural(need, 'setup')}, and you have ${got}.`,
        );
      }
      if (film.cutHours < 2) throw new CommandError('Nobody finishes a picture they haven’t sat down with.');

      const ceiling = ceilingOf(s, film);
      const wanted = cutHoursWanted(s, film);
      const work = clamp(film.cutHours / wanted, 0, 1);
      // The bench gets you most of the way to what the material allows, and
      // the last of it is craft.
      const craft = clamp((s.player.skills?.directing ?? s.player.skills?.acting ?? 20) / 100, 0, 1);
      const quality = clamp(Math.round(ceiling * (0.55 + work * 0.35 + craft * 0.1)), 1, 100);

      // More setups than the form wants does not make it longer than the form
      // is: it makes the cut better, which the quality already carries.
      const runtimeMinutes = clamp(
        Math.round(Math.min(1, got / need) * RUNTIME_CAP[film.format] * 0.8) + (film.format === 'short' ? 4 : 12),
        film.format === 'short' ? 4 : 40,
        RUNTIME_CAP[film.format],
      );

      const note = quality >= 75
        ? 'It works. Whatever else happens to it, it works.'
        : quality >= 55
          ? 'It holds together. The seams show in two places and you know where they are.'
          : quality >= 35
            ? 'It’s what it is. There wasn’t enough there and cutting could only do so much.'
            : 'It doesn’t work, and you knew that at the bench.';

      film.cut = { at: s.now, runtimeMinutes, quality, note };
      film.status = 'finished';
      s.notify({
        title: `${film.title} Is Finished`,
        body: `${runtimeMinutes} minutes. ${note}`,
        category: 'personal',
        importance: 60,
        route: '/workspace/film',
        refType: 'film', refId: film.id,
      });
      s.emit('film.finished', { filmId: film.id, quality, runtimeMinutes });
      return { runtimeMinutes, quality, note };
    },
  );

  /**
   * Showing it to people in a room you paid for.
   *
   * Who comes is who you actually know, and how many of them come depends on
   * how well you know them. Everybody who came remembers it.
   */
  sim.onCommand<
    { filmId: Id; placeId?: string },
    { came: number; invited: number; cost: Money; note: string }
  >(
    'film.screen',
    (p, { sim: s }) => {
      const film = s.universe.indieFilms[p.filmId];
      if (!film) throw new CommandError('No such picture.');
      if (!film.cut) throw new CommandError('There’s nothing finished to show anybody.');

      const cityId = s.player.currentLocationId;
      const place = p.placeId ? roomsIn(s, cityId).find((one) => one.id === p.placeId) : undefined;
      if (p.placeId && !place) throw new CommandError('That isn’t a room in this city you could show anything in.');
      const cost = place ? roomCost(cityId, place.price) : 0;

      const accountId = s.player.primaryAccountId;
      if (cost > 0) {
        if (!accountId) throw new CommandError('You have no account to pay the room from.');
        if (s.ledger.availableFunds(accountId) < cost) {
          throw new CommandError(`That room is ${formatMoney(cost)} for the evening, and you don’t have it.`);
        }
      }

      // Everybody you know gets asked. Whether they come is how well they know you.
      const rng = s.rng('film.screening', film.id, film.screenings.length);
      const rels = relationshipsOf(s, s.player.id);
      let came = 0;
      const cameIds: Id[] = [];
      for (const rel of rels) {
        const chance = clamp(rel.dimensions.familiarity / 150 + rel.dimensions.affection / 260, 0.05, 0.9);
        if (rng.float(0, 1) < chance) {
          came += 1;
          cameIds.push(otherParty(rel, s.player.id));
        }
      }
      // A room is a room: strangers wander into a good one on a good night.
      const passing = place ? Math.round(rng.int(0, 12) * ((place.quality ?? 50) / 100)) : 0;
      came = Math.min(SEATS, came + passing);

      if (cost > 0 && accountId) {
        s.expense(accountId, cost, `Screening room — ${place!.name}`, 'production', { refType: 'film', refId: film.id });
      }
      s.advanceTo(s.now + 3 * 60 * MS_MINUTE);
      s.player.wellbeing.energy = clamp(s.player.wellbeing.energy - 8, 0, 100);

      const note = came === 0
        ? 'Nobody came. You watched your own picture in an empty room, which is a thing that happens.'
        : came < 6
          ? `${plural(came, 'person', 'people')} came. Small, and they stayed for the whole thing.`
          : `${plural(came, 'person', 'people')} came, which for a picture nobody commissioned is a room.`;

      const screening: Screening = {
        id: s.nextId('screening'),
        at: s.now,
        placeId: place?.id,
        placeName: place?.name ?? 'Your Own Place',
        cost,
        invited: rels.length,
        came,
        note,
      };
      film.screenings.push(screening);

      for (const personId of cameIds) {
        const rel = findRelationship(s, s.player.id, personId);
        if (!rel) continue;
        addMemory(s, rel, {
          kind: 'shared',
          summary: `Came to the screening of ${film.title}.`,
          impact: film.cut.quality >= 55 ? 7 : 4,
          decayDays: 240,
        });
      }
      if (came > 0 && film.cut.quality >= 60) {
        s.player.reputation.publicFame = clamp(s.player.reputation.publicFame + came / 60, 0, 100);
      }

      s.emit('film.screened', { filmId: film.id, came, cost });
      return { came, invited: rels.length, cost, note };
    },
  );

  /**
   * Sending it to a festival.
   *
   * A form, a fee and a wait of six weeks to four months. The answer is what
   * you made against how selective they are, and nothing else.
   */
  sim.onCommand<
    { filmId: Id; festivalId: string },
    { fee: Money; answerAt: Instant; festival: string }
  >(
    'film.submit',
    (p, { sim: s }) => {
      const film = s.universe.indieFilms[p.filmId];
      if (!film) throw new CommandError('No such picture.');
      if (!film.cut) throw new CommandError('There’s nothing finished to send.');
      const festival = FESTIVAL_BY_ID[p.festivalId];
      if (!festival) throw new CommandError('That isn’t a festival on the list.');
      if (!festival.takes.includes(film.format)) {
        throw new CommandError(`${festival.name} doesn’t take that kind of picture.`);
      }
      if (film.submissions.some((one) => one.festivalId === festival.id && one.status !== 'rejected')) {
        throw new CommandError(`${film.title} is already with ${festival.name}.`);
      }

      const fee = entryFee(festival);
      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('You have no account to pay the entry fee from.');
      if (s.ledger.availableFunds(accountId) < fee) {
        throw new CommandError(`${festival.name} charges ${formatMoney(fee)} to enter, and you don’t have it.`);
      }
      s.expense(accountId, fee, `Festival entry — ${festival.name}`, 'production', { refType: 'film', refId: film.id });

      const rng = s.rng('film.submit', film.id, festival.id);
      const answerAt = addDays(s.now, rng.int(ANSWER_DAYS[0], ANSWER_DAYS[1]), s.homeZone);
      const submission: Submission = {
        id: s.nextId('submission'),
        festivalId: festival.id,
        festivalName: festival.name,
        cityId: festival.cityId,
        sentAt: s.now,
        fee,
        answerAt,
        status: 'sent',
      };
      film.submissions.push(submission);

      s.schedule({
        at: answerAt,
        kind: 'film.answer',
        label: `${festival.name} Answers`,
        category: 'personal',
        payload: { filmId: film.id, submissionId: submission.id },
        priority: 60,
        refType: 'film', refId: film.id,
      });
      s.emit('film.submitted', { filmId: film.id, festivalId: festival.id, fee });
      return { fee, answerAt, festival: festival.name };
    },
  );

  /** Leaving it in a drawer, which is also an ending. */
  sim.onCommand<{ filmId: Id }, { filmId: Id }>(
    'film.abandon',
    (p, { sim: s }) => {
      const film = s.universe.indieFilms[p.filmId];
      if (!film) throw new CommandError('No such picture.');
      if (film.status === 'abandoned') throw new CommandError('It’s already in the drawer.');
      film.status = 'abandoned';
      s.emit('film.abandoned', { filmId: film.id });
      return { filmId: film.id };
    },
  );

  // --- The answer -----------------------------------------------------------

  sim.onSchedule('film.answer', (item, s) => {
    const payload = item.payload as { filmId: Id; submissionId: Id };
    const film = s.universe.indieFilms[payload.filmId];
    if (!film || !film.cut) return;
    const submission = film.submissions.find((one) => one.id === payload.submissionId);
    if (!submission || submission.status !== 'sent') return;
    const festival = FESTIVAL_BY_ID[submission.festivalId];
    if (!festival) return;

    const rng = s.rng('film.answer', film.id, submission.id);
    // What you made against how much of what they are sent they can take. The
    // great ones take almost nothing, and a good picture is still usually a no.
    const room = clamp((100 - festival.selectivity) / 100, 0.02, 0.5);
    const merit = clamp(film.cut.quality / 100, 0, 1);
    const chance = clamp(room * (0.35 + merit * 1.5), 0.005, 0.85);
    const accepted = rng.float(0, 1) < chance;

    submission.status = accepted ? 'accepted' : 'rejected';
    submission.note = accepted
      ? rng.pick([
        'A programmer wrote a paragraph about it. They want it in the shorts block.',
        'In. They ask you to be there for the screening if you can.',
        'Selected. The email is three lines long and you read it eleven times.',
      ])
      : rng.pick([
        'A form letter. They had a great many submissions this year.',
        'No, with a line about the volume they received.',
        'Not this year. Nobody says why, and nobody ever does.',
      ]);

    if (accepted) {
      const city = CITIES.get(festival.cityId)?.name ?? festival.cityId;
      s.player.reputation.publicFame = clamp(s.player.reputation.publicFame + festival.standing / 40, 0, 100);
      s.player.reputation.prestige = clamp(s.player.reputation.prestige + festival.standing / 25, 0, 100);
      s.notify({
        title: `${festival.name} Said Yes`,
        body: `${film.title} is in, in ${city}. ${submission.note}`,
        category: 'personal',
        importance: 82,
        route: '/workspace/film',
        refType: 'film', refId: film.id,
      });
    } else {
      s.notify({
        title: `${festival.name} Passed`,
        body: `${film.title}: ${submission.note}`,
        category: 'personal',
        importance: 44,
        route: '/workspace/film',
        refType: 'film', refId: film.id,
      });
    }
    s.emit('film.answered', { filmId: film.id, festivalId: festival.id, accepted });
  });
}

export { FESTIVALS, festivalsFor, shootDaysOf };
