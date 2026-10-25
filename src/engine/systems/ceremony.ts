/**
 * SLATE — the ceremony (from 2026-10-25, the owner's brief 27, K7, loop 46: "Nomination or invitation → attendance decision
 * → schedule and preparation → ceremony occurs on the appropriate date → category is announced → player wins or loses →
 * acceptance interaction if the player wins → award history updates → justified professional consequences unfold"), for
 * each competition the player can be nominated at: the Television Academy's Emmys and SAG-AFTRA's Actor Awards.
 *
 * - **The invitation.** A nominee is invited (the Actor Awards' rules: attendance "is by invitation only"), and says by a
 *   week before the show whether they'll go (`CEREMONY.rsvpDays`, ASSUMPTION). Unanswered, they watch from home.
 * - **Going** books the trip as a work trip's legs are booked (`bookCeremonyTrip`), out to land a day and a half ahead and
 *   home the morning after, held against other bookings; it's refused where it would clash with booked work. Nobody pays:
 *   the game doesn't price a trip a production doesn't book. The show is a call on the clock in its city, for its hours.
 * - **Preparing remarks** is an hour at a time, each going further the less is left (`CEREMONY.prepare`, ASSUMPTION).
 * - **The night.** The result was settled at the final round, so being there changes nothing about it. There and losing,
 *   nothing more comes of it: the loop's "justified" consequences, and no boost merely for appearing. There and winning,
 *   the clock stops a minute on for the player to go up (`SPEECH_KIND`, its stop's choice Go Up And Accept,
 *   `pro.ceremony_accept`), and the speech is judged from the remarks' preparation and the actor's composure and presence,
 *   with its own draw (decider `ceremony.speech`); a Strong speech or better is quoted from the night, and makes the actor a
 *   little more visible to casting for a while (`VISIBILITY.speech`, `systems/awards.ts`). Going on past the stop, they say
 *   thank you and sit down. Absent, the result is read from home. Until the first test of it played the night, the show's
 *   one stop ran its four hours on Go, and the half hour to go up had passed before anything could be pressed.
 *
 * Other nominees and winners are never named, and a loss says only that the player didn't win.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, MS_HOUR, formatDate, formatTime, formatWeekdayDate, type Instant } from '../core/time';
import { ACTOR_AWARDS_PLACE, ACTOR_CATEGORIES, EMMY_CATEGORIES, actorEdition, emmyEdition } from '../content/awards';
import type { ProId } from './pro';
import type { AwardEntry } from './awards';
import type { GuildEntry } from './actorawards';
import type { Band } from './coursework';
import { attributesOf } from './attributes';
import { TRIP, bookCeremonyTrip, cancelTrip, needsTrip, planTrip, tripsOf, windowOf } from './worktrip';
import { defineStop } from '../world/clock';

const NY = 'America/New_York';
const MIN = 60_000;

/** Whether the player went to a show they're nominated at, and how it went. */
export interface Attendance {
  rsvp: 'attending' | 'declined';
  /** When they said. */
  at: Instant;
  tripId?: ProId;
  /** How far their remarks are prepared, 0 to 1. */
  prepared?: number;
  /** At the show's hour: in the room, or not. */
  outcome?: 'there' | 'absent';
  /** On winning: went up and gave the speech, or the half hour passed. */
  accepted?: 'speech' | 'unanswered';
  speech?: { score: number; band: Band };
}

/**
 * ASSUMPTION every figure, the game's: an answer due a week before the show; four hours of it; an hour's preparation
 * taking the remarks 35% of the way left; the category announced a minute in and half an hour to go up; and the speech's
 * weights, the remarks' preparation the most, its draw's spread, and the bands' lines.
 */
export const CEREMONY = {
  rsvpDays: 7, hours: 4, prepare: { minutes: 60, gain: 0.35 }, announcedMinutes: 1, acceptMinutes: 30,
  speech: { prepared: 0.55, composure: 0.25, presence: 0.2, spread: 0.08, bands: { exceptional: 0.78, strong: 0.58, working: 0.35 } },
} as const;

export const CEREMONY_KIND = 'pro.ceremony';
export const SPEECH_KIND = 'pro.ceremony_speech';

/**
 * Where each show is given: Los Angeles for both, ASSUMPTION for each. The Emmys' rules give their dates, not their place;
 * the Actor Awards' 32nd results were dated from Los Angeles (`ACTOR_AWARDS_PLACE`).
 */
const PLACE = { emmys: { city: 'Los Angeles', cityId: 'us-ca-losangeles' }, 'actor-awards': ACTOR_AWARDS_PLACE } as const;

export type Nomination = AwardEntry | GuildEntry;
export const nominationsOf = (person: Person): Nomination[] => [...(person.pro?.awards ?? []), ...(person.pro?.guild ?? [])];
export const nominationById = (person: Person, id: unknown): Nomination | undefined => nominationsOf(person).find((n) => n.id === id);
/**
 * The player's other nominations at the same show, the same night: one show, one trip and one answer for them all. Until
 * brief 27's F each nomination was its own invitation and booked its own trip, so a second nomination at the 84th Creative
 * Arts Emmys found the first's trip a clash and could only be watched from home, while its nominee sat in the room (a long
 * career, `tools/long-career.ts`, found it: 12 of its 15 nominations).
 */
export const sameShow = (person: Person, n: Nomination): Nomination[] => nominationsOf(person).filter((m) => m.id !== n.id && m.ceremonyAt === n.ceremonyAt && showTitle(m) === showTitle(n));

const ordinalOf = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const titled = (s: string) => s.replace(/(^|\s)(\S)/g, (_m, a: string, b: string) => `${a}${b.toUpperCase()}`);

/** The award's name, as a win says it: "the 79th Emmy Awards", "the 33rd Actor Awards". */
export function awardTitle(n: Nomination): string {
  return n.institution === 'emmys' ? `the ${ordinalOf(emmyEdition(n.year).number)} Emmy Awards` : `the ${ordinalOf(actorEdition(n.year).number)} Actor Awards`;
}

/** The show's name, as an invitation says it: the Creative Arts Emmys for the categories given there. */
export function showTitle(n: Nomination): string {
  if (n.institution === 'emmys' && EMMY_CATEGORIES[n.category].at === 'creative-arts') return `the ${ordinalOf(emmyEdition(n.year).number)} Creative Arts Emmys`;
  return awardTitle(n);
}

/** The category's name for this performer. */
export function nominationCategory(person: Person, n: Nomination): string {
  const names = n.institution === 'emmys' ? EMMY_CATEGORIES[n.category] : ACTOR_CATEGORIES[n.category];
  return person.performerTitle === 'actress' ? names.actressName : names.actorName;
}

const nomineesOf = (n: Nomination): number => (n.institution === 'emmys' ? n.field?.nominations ?? 1 : n.field?.nominees.length ?? 1);
const placeOf = (n: Nomination) => PLACE[n.institution];
/** When the answer is due. */
export const rsvpBy = (n: Nomination): Instant => n.ceremonyAt - CEREMONY.rsvpDays * MS_DAY;
/** The show's evening, as a booking's days are read. */
const spanOf = (n: Nomination) => ({ from: n.ceremonyAt - MS_HOUR, to: n.ceremonyAt + CEREMONY.hours * MS_HOUR });

// ---------------------------------------------------------------------------------------------------------------------
// The invitation and the answer
// ---------------------------------------------------------------------------------------------------------------------

/** The invitation, on the record as a question to answer, and in a sentence for the nomination's notice. */
export function invitation(sim: Simulation, person: Person, n: Nomination): string {
  const at = `${formatWeekdayDate(n.ceremonyAt, NY)}, at ${formatTime(n.ceremonyAt, NY)}`;
  if (sim.now >= rsvpBy(n)) return `It’s presented in ${placeOf(n).city} on ${at}.`;
  // Already answered for this show: the same answer, the same trip.
  const answered = sameShow(person, n).find((m) => m.attend?.rsvp);
  if (answered) {
    n.attend = { ...answered.attend!, prepared: answered.attend!.prepared ?? 0 };
    delete n.attend.outcome;
    delete n.attend.accepted;
    delete n.attend.speech;
    return answered.attend!.rsvp === 'attending' ? `You’re going to ${showTitle(n)} already, so you’ll be in the room for this one too.` : `You’ve said you’ll watch ${showTitle(n)} from home.`;
  }
  const words = `As a nominee you’re invited to ${showTitle(n)} in ${placeOf(n).city} on ${at}. Say by ${formatDate(rsvpBy(n), NY)}, whether you’ll go; going means flying out ahead and home the morning after, and the trip isn’t charged to you. Your answer is for the whole show, every nomination of yours at it.`;
  // One question a show: a second nomination announced with the first is answered with it.
  const asked = sameShow(person, n).some((m) => Object.values(sim.universe.decisions).some((d) => d.refType === 'pro.ceremony' && d.refId === m.id && d.resolvedAt === undefined));
  if (person.id === sim.universe.playerId && !asked) {
    sim.requireDecision({
      urgency: 60, category: 'career', title: `Will You Go To ${titled(showTitle(n))}?`, detail: words, dueAt: rsvpBy(n), route: '/workspace/career', refType: 'pro.ceremony', refId: n.id,
      actions: [
        { label: 'Go To The Ceremony', commandKind: 'pro.ceremony_rsvp', payload: { entryId: n.id, attend: true } },
        { label: 'Watch From Home', commandKind: 'pro.ceremony_rsvp', payload: { entryId: n.id, attend: false } },
      ],
    });
  }
  return words;
}

/** What the ceremony's hooks lend it from the work loop. */
export interface CeremonyHooks {
  tell: (sim: Simulation, person: Person, title: string, body: string) => void;
  /** Awake and not laid up at a moment. */
  there: (person: Person, at: Instant) => boolean;
  /** Another booking on these days, by its label and when. */
  clash: (person: Person, days: readonly { from: Instant; to: Instant }[]) => { label: string; from: Instant } | undefined;
  /** The awards' own steps run to now, so a result due is settled. */
  settle: (sim: Simulation, person: Person) => void;
}

/** The days the trip would take, or the evening where no trip is needed. */
function awayFor(person: Person, n: Nomination): { from: Instant; to: Instant } {
  const plan = planTrip(person.currentLocationId, placeOf(n).cityId, [spanOf(n)]);
  return (plan && windowOf(plan.legs)) ?? spanOf(n);
}

/** Why the player can't give this answer now, or nothing. */
export function rsvpRefusal(sim: Simulation, person: Person, entryId: string, attend: boolean, hooks: Pick<CeremonyHooks, 'clash'>): string | undefined {
  const n = nominationById(person, entryId);
  if (!n) return 'There’s no such nomination.';
  if (n.state !== 'nominated') return 'Only a nominee is invited, before the show.';
  if (sim.now >= rsvpBy(n)) return `The answer was due by ${formatDate(rsvpBy(n), NY)}.`;
  if (attend && n.attend?.rsvp === 'attending') return 'You’ve said you’re going.';
  if (!attend && n.attend?.rsvp === 'declined') return 'You’ve said you’ll watch from home.';
  if (attend) {
    const away = awayFor(person, n);
    const clash = hooks.clash(person, [away]);
    if (clash) return `You’re booked for ${clash.label} on ${formatDate(clash.from, NY)}, and going would take you away from ${formatDate(away.from, NY)} to ${formatDate(away.to, NY)}.`;
  }
  return undefined;
}

/** The answer: going books the trip and the show's call; not going calls off what going had booked. */
export function rsvp(sim: Simulation, person: Person, entryId: string, attend: boolean, hooks: Pick<CeremonyHooks, 'clash'>): Attendance {
  const no = rsvpRefusal(sim, person, entryId, attend, hooks);
  if (no) throw new CommandError(no);
  const n = nominationById(person, entryId)!;
  // The answer is the show's: every nomination of the player's at it goes, or is watched from home, together.
  const all = [n, ...sameShow(person, n).filter((m) => m.state === 'nominated')];
  for (const m of all) sim.resolveDecision('pro.ceremony', m.id, 'career');
  const place = placeOf(n);
  if (!attend) {
    for (const m of all) {
      const trip = m.attend?.tripId ? tripsOf(person).find((t) => t.id === m.attend!.tripId) : undefined;
      if (trip && trip.status !== 'canceled') cancelTrip(sim, trip);
      sim.timeline.cancelFor('pro.ceremony', m.id, sim.now);
      m.attend = { rsvp: 'declined', at: sim.now };
    }
    return n.attend!;
  }
  const far = needsTrip(person.currentLocationId, place.cityId);
  const trip = far ? bookCeremonyTrip(sim, person, { engagementId: n.engagementId, entryId: n.id, title: showTitle(n), cityId: place.cityId, span: spanOf(n) }) : undefined;
  sim.schedule({
    at: n.ceremonyAt, kind: CEREMONY_KIND, label: titled(showTitle(n)), category: 'career', priority: 39, requiresPlayer: true, durationMinutes: CEREMONY.hours * 60,
    travelMinutes: far ? TRIP.hotelMinutes : 60, locationId: place.cityId, refType: 'pro.ceremony', refId: n.id, payload: { personId: person.id, entryId: n.id },
  });
  for (const m of all) m.attend = { rsvp: 'attending', at: sim.now, ...(trip ? { tripId: trip.id } : {}), prepared: m.attend?.prepared ?? 0 };
  return n.attend!;
}

/** Why the player can't prepare remarks for this show now, or nothing. */
export function prepareRemarksRefusal(sim: Simulation, person: Person, entryId: string): string | undefined {
  const n = nominationById(person, entryId);
  if (!n) return 'There’s no such nomination.';
  if (n.attend?.rsvp !== 'attending') return 'Remarks are for a show you’re going to.';
  if (sim.now >= n.ceremonyAt) return 'The show has begun.';
  if ((n.attend.prepared ?? 0) >= 0.99) return 'Your remarks are as ready as they’ll get.';
  return undefined;
}

/** An hour on the remarks, going further the less is left. */
export function prepareRemarks(sim: Simulation, person: Person, entryId: string): { prepared: number; minutes: number } {
  const no = prepareRemarksRefusal(sim, person, entryId);
  if (no) throw new CommandError(no);
  const n = nominationById(person, entryId)!;
  const p = n.attend!.prepared ?? 0;
  const next = Math.round((p + CEREMONY.prepare.gain * (1 - p)) * 1000) / 1000;
  // One evening's remarks, for whichever of the show's awards it brings the player up for.
  for (const m of [n, ...sameShow(person, n)]) if (m.attend?.rsvp === 'attending') m.attend.prepared = next;
  sim.advanceTo(sim.now + CEREMONY.prepare.minutes * MIN);
  return { prepared: next, minutes: CEREMONY.prepare.minutes };
}

// ---------------------------------------------------------------------------------------------------------------------
// The night, and the speech
// ---------------------------------------------------------------------------------------------------------------------

/** A draw from a normal curve, from two uniform draws. */
const normal = (a: number, b: number) => Math.sqrt(-2 * Math.log(Math.max(1e-9, a))) * Math.cos(2 * Math.PI * b);

/** The speech (decider `ceremony.speech`): the remarks' preparation, composure and presence, and its own draw, judged into a band. */
export function speechOf(sim: Simulation, person: Person, n: Nomination): { score: number; band: Band } {
  const a = attributesOf(sim, person);
  const w = CEREMONY.speech;
  const r = sim.rng('ceremony.speech', n.institution, n.year, n.creditId);
  const raw = w.prepared * (n.attend?.prepared ?? 0) + w.composure * (a.composure / 100) + w.presence * (a.presence / 100) + w.spread * normal(r.next(), r.next());
  const score = Math.round(Math.max(0, Math.min(1, raw)) * 1000) / 1000;
  const band: Band = score >= w.bands.exceptional ? 'exceptional' : score >= w.bands.strong ? 'strong' : score >= w.bands.working ? 'working' : 'unready';
  return { score, band };
}

const SPEECH_WORDS: Readonly<Record<Band, string>> = {
  exceptional: 'Your speech was the night’s: what you said is what people quote from it, and it makes you a little more visible to casting for a while.',
  strong: 'Your speech landed, and it’s quoted from the night: it makes you a little more visible to casting for a while.',
  working: 'You said what you’d meant to, thanked the people you meant to thank, and sat down.',
  unready: 'You lost your place halfway, thanked some people twice, and sat down.',
};

/** Why the player can't go up to accept now, or nothing. */
export function acceptRefusal(sim: Simulation, person: Person, entryId: string): string | undefined {
  const n = nominationById(person, entryId);
  if (!n) return 'There’s no such nomination.';
  if (n.state !== 'won') return 'Only a winner goes up to accept.';
  if (n.attend?.outcome !== 'there') return 'You weren’t in the room.';
  if (n.attend.accepted === 'speech') return 'It’s accepted, and your speech is given.';
  if (n.attend.accepted === 'unanswered') return 'The moment has passed: you said thank you and sat down.';
  if (sim.now > n.ceremonyAt + CEREMONY.acceptMinutes * MIN) return 'The moment has passed.';
  return undefined;
}

/** Going up to accept: the speech given and judged. */
export function acceptAward(sim: Simulation, person: Person, entryId: string): { band: Band; words: string } {
  const no = acceptRefusal(sim, person, entryId);
  if (no) throw new CommandError(no);
  const n = nominationById(person, entryId)!;
  n.attend!.speech = speechOf(sim, person, n);
  n.attend!.accepted = 'speech';
  return { band: n.attend!.speech.band, words: SPEECH_WORDS[n.attend!.speech.band] };
}

/** Why the player can't watch a show now, or nothing. */
export function watchRefusal(sim: Simulation, person: Person, entryId: string): string | undefined {
  const n = nominationById(person, entryId);
  if (!n) return 'There’s no such entry.';
  if (!['nominated', 'won', 'lost'].includes(n.state) || !n.field) return 'You weren’t nominated, so there’s no ceremony of yours to watch.';
  if (sim.now < n.ceremonyAt) return `The award is presented on ${formatDate(n.ceremonyAt, NY)}.`;
  return undefined;
}

/** The ceremony as it went, a line at a time, read from the settled result: watching it changes nothing. */
export function ceremonyLines(person: Person, n: Nomination): string[] {
  const c = person.pro?.credits.find((x) => x.id === n.creditId);
  const name = nominationCategory(person, n);
  // The player's other parts among the nominees (from 2026-10-25, brief 27's F: an Emmy category's one field holds every
  // entry of the player's, `fieldFor` in `systems/awards.ts`); until then each nomination's field held only itself.
  const again = (n.field?.nominees ?? []).filter((id) => id.startsWith('you:') && id !== `you:${n.creditId}`).map((id) => person.pro?.credits.find((x) => x.id === id.slice(4))).filter((x): x is NonNullable<typeof x> => !!x);
  const others = nomineesOf(n) - 1 - again.length;
  const won = n.state === 'won';
  const tie = n.institution === 'actor-awards' && (n.field?.winners?.length ?? 0) > 1;
  // Lost to another of the player's own parts in the category.
  const mine = n.state === 'lost' && n.institution === 'emmys' ? again.find((x) => n.field?.winner === `you:${x.id}`) : undefined;
  const lines = [
    `First come the nominees for ${name}: you, for ${c?.role ?? 'your part'} in ${c?.project ?? 'your work'}, ${again.map((x) => `you again, for ${x.role} in ${x.project}, `).join('')}and ${others === 1 ? 'one other performer' : `${others} other performers`}.`,
    'Then the envelope is opened.',
    won ? `${tie ? 'It’s a tie, and you’re one of the winners' : 'It’s you'}: you won ${name} at ${awardTitle(n)}.`
      : mine ? `It’s you, for ${mine.role} in ${mine.project}: you won ${name} at ${awardTitle(n)} for that part, and this nomination stands.`
        : 'It goes to another nominee. You didn’t win, and your nomination stands.',
  ];
  if (n.attend?.outcome === 'there' && won) lines.push(n.attend.speech ? SPEECH_WORDS[n.attend.speech.band] : 'You went up, said thank you, and sat down.');
  return lines;
}

/** The stop's choice, declared once for every simulation (`defineStop` throws on a second). */
let stopDeclared = false;

export function registerCeremonies(sim: Simulation, hooks: CeremonyHooks): void {
  // The show's hour: in the room or not; the result told; a winner in the room asked to go up.
  sim.onSchedule(CEREMONY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const first = person ? nominationById(person, item.payload.entryId) : undefined;
    if (!person || !first || first.attend?.rsvp !== 'attending' || first.attend.outcome) return;
    hooks.settle(s, person);
    // The show's one evening: every nomination of the player's at it, there or not by the one trip.
    const trip = first.attend.tripId ? tripsOf(person).find((t) => t.id === first.attend!.tripId) : undefined;
    const there = (!trip || trip.status === 'there') && hooks.there(person, item.at);
    const title = titled(showTitle(first));
    let wins = 0;
    for (const n of [first, ...sameShow(person, first)].filter((m) => m.attend?.rsvp === 'attending' && !m.attend.outcome)) {
      n.attend!.outcome = there ? 'there' : 'absent';
      const c = person.pro?.credits.find((x) => x.id === n.creditId);
      const name = nominationCategory(person, n);
      if (!there) {
        hooks.tell(s, person, `You Weren’t At ${title}`, `You weren’t in the room for ${name}${trip && trip.status !== 'there' ? ', since the trip never got you there' : ''}. ${n.state === 'won' ? `You won it, for ${c?.role} in ${c?.project}, and it was accepted without you.` : 'It went to another nominee; your nomination stands.'}`);
        continue;
      }
      n.watchedAt ??= item.at;
      if (n.state !== 'won') {
        hooks.tell(s, person, title, `You were in the room for ${name}. It went to another nominee: you didn’t win, and your nomination stands.`);
        continue;
      }
      // The moment to go up: a stop of its own, its choice Go Up And Accept; gone on past, a thank you and a seat. A second
      // win the same night is announced a minute after the first's moment.
      wins += 1;
      s.schedule({ at: item.at + wins * CEREMONY.announcedMinutes * MIN, kind: SPEECH_KIND, label: `${title}: ${capital(name)}`, category: 'career', priority: 39, requiresPlayer: true, durationMinutes: 5, locationId: placeOf(n).cityId, refType: 'pro.ceremony', refId: n.id, payload: { personId: person.id, entryId: n.id } });
      hooks.tell(s, person, `You Won At ${title}`, `It’s you: you won ${name} at ${awardTitle(n)}, for ${c?.role} in ${c?.project}. Go up and accept it.`);
    }
  });
  // Gone on past the moment: thanked, and sat down.
  sim.onSchedule(SPEECH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const n = person ? nominationById(person, item.payload.entryId) : undefined;
    if (!n || n.state !== 'won' || n.attend?.outcome !== 'there' || n.attend.accepted) return;
    n.attend.accepted = 'unanswered';
  });
  sim.onCommand<{ entryId: string; attend: boolean }, { rsvp: Attendance['rsvp'] }>('pro.ceremony_rsvp', (p, { sim: s }) => ({ rsvp: rsvp(s, s.player, String(p?.entryId), p?.attend === true, hooks).rsvp }));
  sim.onCommand<{ entryId: string }, { prepared: number; minutes: number }>('pro.ceremony_prepare', (p, { sim: s }) => prepareRemarks(s, s.player, String(p?.entryId)));
  sim.onCommand<{ entryId: string }, { band: Band; words: string }>('pro.ceremony_accept', (p, { sim: s }) => {
    const r = acceptAward(s, s.player, String(p?.entryId));
    hooks.tell(s, s.player, 'Your Speech', r.words);
    return r;
  });
  if (!stopDeclared) {
    stopDeclared = true;
    defineStop(SPEECH_KIND, [{
      label: 'Go Up And Accept', command: 'pro.ceremony_accept', payload: (item) => ({ entryId: item.payload.entryId }), then: 'carry-on',
      does: 'goes up to the stage and gives your speech', ahead: 'go up and accept an award you’ve won',
    }]);
  }
  sim.onCommand<{ entryId: string }, { lines: string[] }>('pro.watch_ceremony', (p, { sim: s }) => {
    const person = s.player;
    const no = watchRefusal(s, person, String(p?.entryId));
    if (no) throw new CommandError(no);
    // The result was settled at the final round and given at the ceremony; watching only shows it.
    hooks.settle(s, person);
    const n = nominationById(person, p.entryId)!;
    n.watchedAt ??= s.now;
    return { lines: ceremonyLines(person, n) };
  });
}
