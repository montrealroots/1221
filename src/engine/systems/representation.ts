/**
 * SLATE — seeking other representation, from 2026-10-08, on the career's own
 * agencies, offers, contracts and terms (`systems/career.ts`): nothing here is a
 * second way to be represented. Until then an actor signed with an agency
 * stayed until it let them go or they walked out, and a played New York life
 * spent forty-five years with the agency it signed at twenty-nine.
 *
 * **The sequence.** Review what the agency has done (`representationReview`:
 * the auditions it sent, the work booked through it, the days worked that the
 * rule on leaving counts), look at the others (`agencyOutlook`), and approach
 * one (`career.approach_agency`): a submission, or an introduction by a
 * classmate it represents who's close to you, by your manager, or by a
 * casting office you met at a workshop (`introducerFor`; until later on
 * 2026-10-08 only a classmate introduced anyone). It answers by a date: it passes,
 * it doesn't answer (the answer date passes without one), or it asks to meet,
 * in its town, on a weekday a week or more on. A meeting kept may bring an
 * offer, whose terms are shown (`AgencyTerms`) and stand for two weeks; it's
 * signed (`career.sign`), declined (`career.decline_agency`) or let lapse. An
 * approach can be withdrawn before its answer (`career.withdraw_approach`).
 *
 * **Moving.** Free to leave under the contract's terms (`mayLeave`, SAG-AFTRA's
 * Rule 16(g) as `LEAVING` keeps it), the move is at once. Not free, the new
 * contract begins when the current one ends, which isn't renewed: never two at
 * once. Work offered while with an agency stays its to commission
 * (`Booking.agentId`), whoever represents them when it's paid. Auditions it set
 * up are still theirs to go to.
 *
 * **What's interesting to an agency.** Where they stand (`standing`: craft,
 * presence, reputation), their credits and their reel, a referral, and whether
 * the agency works where they do. A big agency won't take everybody, and a
 * client well below its roster is sent less (`rosterFit`), so a move isn't
 * always better.
 *
 * **Limits.** Three approaches open at once; after a pass, a year before the
 * same agency again; after silence or an offer declined, six months; a meeting
 * missed, a year, and a little reputation. Every number here is SLATE's
 * estimate unless it says otherwise.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, formatTime, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { AGENCIES, AGENT_COMMISSION, type Agency, type CareerCity } from '../content/career';
import { AGENCY_TERM, LEAVING, agencyById, careerOf, managerById, daysWorkedIn, endRepresentation, mayLeave, present, represent, rosterFit, standing, takesBack, workCity, type Offer } from './career';
import { earn } from './attributes';
import { contactsOf, levelOf } from './people';
import { reelCallback } from './footage';

export interface AgencyTerms {
  commission: number;
  years: number;
  /** When it begins: at once, or when the current contract ends. */
  effective: Instant;
  scope: string;
  exclusive: true;
}

export type ApproachStatus = 'waiting' | 'meeting' | 'offered' | 'passed' | 'silent' | 'withdrawn' | 'declined' | 'signed' | 'missed' | 'lapsed';
export interface Approach {
  id: string;
  agencyId: string;
  cityId: CareerCity;
  /** A submission, or an introduction: by a classmate the agency represents, the actor's manager, or a casting office met (from 2026-10-08, later). */
  via: 'submission' | 'referral' | 'manager' | 'casting';
  /** Who introduced them: a classmate's name, the manager's firm, the casting office. */
  referrer?: string;
  sentAt: Instant;
  answerAt: Instant;
  status: ApproachStatus;
  meetingAt?: Instant;
  offerUntil?: Instant;
  closedAt?: Instant;
  history: { at: Instant; what: string }[];
}

export const APPROACH = {
  open: 3,
  answerDays: { submission: 28, referral: 10, manager: 10, casting: 14 },
  /** No answer at all, by the way it came. */
  silence: { submission: 0.3, referral: 0.05, manager: 0.03, casting: 0.1 },
  /** An introduction's weight in the reading, in points of standing: a manager's relationships most, a casting office's word least. */
  introduction: { submission: 0, referral: 3, manager: 4, casting: 2 },
  /** A casting office introduces someone it met within this many days, once a year. */
  castingMetDays: 730, castingOnceDays: 365,
  /** Credits, to this many points, one a credit; the reel by its callback. */
  creditsMost: 3,
  /** Below the bar by more than this, a pass without a meeting. */
  meetBelow: 3,
  meetingLeadDays: 7, meetingMinutes: 60, meetingHour: 11,
  offerDays: 14,
  /** Before the same agency again, by how the last approach ended, in days. */
  again: { passed: 365, silent: 182, declined: 182, withdrawn: 90, missed: 365, lapsed: 182, signed: 0 },
  missedMeeting: -1,
} as const;

export const AGENCY_ANSWER_KIND = 'career.agency_answer';
export const AGENCY_MEETING_KIND = 'career.agency_meeting';
export const AGENCY_OFFER_LAPSE_KIND = 'career.agency_offer_lapse';

export const approachesOf = (person: Person): Approach[] => (careerOf(person).approaches ??= []);
const isOpen = (a: Approach) => a.status === 'waiting' || a.status === 'meeting' || a.status === 'offered';
const name = (id: string) => agencyById(id)?.name ?? 'The agency';

/** How an agency reads an approach: standing, credits, the reel, and a referral. */
export function interestOf(sim: Simulation, person: Person, via: Approach['via']): number {
  const career = careerOf(person);
  const credits = Math.min(APPROACH.creditsMost, career.credits.length);
  const reel = career.reelAt !== undefined ? (reelCallback(career.reelCut) - 1) * 10 : 0;
  return standing(sim, person) + credits + reel + APPROACH.introduction[via];
}

/**
 * Who'd introduce them to this agency, by the way asked, or nothing: a
 * classmate it represents (`referrerFor`); their manager, whose firm is
 * American and introduces to American agencies; a casting office they met at
 * a workshop where they work, within two years, and not one that introduced
 * them anywhere in the last year.
 */
export function introducerFor(sim: Simulation, person: Person, agencyId: string, via: Approach['via']): string | undefined {
  const career = careerOf(person);
  if (via === 'referral') return referrerFor(person, agencyId);
  if (via === 'manager') return career.managerId && (agencyById(agencyId)?.countryId ?? 'us') === 'us' ? managerById(career.managerId)?.name : undefined;
  if (via !== 'casting') return undefined;
  const city = workCity(person);
  const lately = new Set(approachesOf(person).filter((a) => a.via === 'casting' && sim.now - a.sentAt < APPROACH.castingOnceDays * MS_DAY).map((a) => a.referrer));
  return [...(career.castingContacts ?? [])].reverse().find((c) => c.cityId === city && sim.now - c.at <= APPROACH.castingMetDays * MS_DAY && !lately.has(c.office))?.office;
}

/** A classmate the agency represents who'd introduce you: a friend or closer, not a rival. */
export function referrerFor(person: Person, agencyId: string): string | undefined {
  const school = person.school;
  if (!school || school.standing !== 'graduated') return undefined;
  for (const [i, m] of school.classmates.entries()) {
    if (m.career?.agencyId !== agencyId) continue;
    const c = contactsOf(person).find((x) => x.classmate === i);
    if (c && !c.rival && (levelOf(c) === 'Friend' || levelOf(c) === 'Close Friend')) return m.name;
  }
  return undefined;
}

/** The agencies that work where they do. */
export const agenciesHere = (person: Person): Agency[] => {
  const country = CITIES.get(workCity(person))?.countryId ?? 'us';
  return AGENCIES.filter((a) => (a.countryId ?? 'us') === country);
};

/** Why they can't approach this agency now, or nothing. */
export function approachRefusal(sim: Simulation, person: Person, agencyId: string, via: Approach['via']): string | undefined {
  const career = careerOf(person);
  const agency = agencyById(agencyId);
  if (!agency) return 'There’s no such agency.';
  if (career.since === undefined) return 'Agencies are approached once the career has begun.';
  if (career.headshotsAt === undefined) return 'An approach is a headshot and a résumé: have headshots taken first.';
  if (!agenciesHere(person).includes(agency)) return `${agency.name} represents actors working in another country.`;
  if (career.agencyId === agencyId) return `You’re with ${agency.name}.`;
  // A move settled is settled: nothing more until it's made. Until 2026-10-08's ten-year runs an actor signing every offer
  // replaced the agency to follow again and again, 97 times in seven years.
  if (career.nextAgency) return `You’ve signed with ${name(career.nextAgency.agencyId)} from ${formatDate(career.nextAgency.terms.effective, sim.zone)}: the move is settled.`;
  if (!takesBack(sim, person, agencyId)) return `${agency.name} won’t take you back yet: you parted on ${formatDate(career.ended!.at, sim.zone)}.`;
  const mine = approachesOf(person);
  const open = mine.find((a) => a.agencyId === agencyId && isOpen(a));
  if (open) return open.status === 'offered' ? `${agency.name}’s offer stands until ${formatDate(open.offerUntil!, sim.zone)}.` : open.status === 'meeting' ? `You meet ${agency.name} on ${formatDate(open.meetingAt!, sim.zone)}.` : `You’ve approached ${agency.name}: they answer by ${formatDate(open.answerAt, sim.zone)}.`;
  if (mine.filter(isOpen).length >= APPROACH.open) return `${APPROACH.open} approaches at once at most: wait for an answer, or withdraw one.`;
  const last = mine.filter((a) => a.agencyId === agencyId && a.closedAt !== undefined).sort((a, b) => b.closedAt! - a.closedAt!)[0];
  if (last) {
    const wait = APPROACH.again[last.status as keyof typeof APPROACH.again] ?? 0;
    if (sim.now - last.closedAt! < wait * MS_DAY) return `${agency.name} ${last.status === 'passed' ? 'passed' : last.status === 'silent' ? 'didn’t answer' : last.status === 'missed' ? 'was stood up' : last.status === 'declined' ? 'was turned down' : last.status === 'lapsed' ? 'saw its offer lapse' : 'heard you withdraw'} on ${formatDate(last.closedAt!, sim.zone)}: approach them again from ${formatDate(last.closedAt! + wait * MS_DAY, sim.zone)}.`;
  }
  if (via === 'referral' && !referrerFor(person, agencyId)) return `Nobody close to you is with ${agency.name} to introduce you.`;
  if (via === 'manager' && !introducerFor(sim, person, agencyId, via)) return career.managerId ? `Your manager’s firm works with American agencies; ${agency.name} isn’t one.` : 'You have no manager to introduce you.';
  if (via === 'casting' && !introducerFor(sim, person, agencyId, via)) return (career.castingContacts ?? []).length ? 'No casting office you’ve met here in the last two years can introduce you now: each introduces you once a year.' : 'You haven’t met a casting office: a workshop is where actors meet them.';
  return undefined;
}

/** The terms an offer from this agency would carry now. */
export function termsFor(sim: Simulation, person: Person, agency: Agency): AgencyTerms {
  const career = careerOf(person);
  const effective = !career.agencyId ? sim.now : mayLeave(sim, person).ok ? sim.now : career.termEnds ?? sim.now;
  const scope = career.commercial ? 'Film, television and theater; commercials stay with your commercial agent' : 'Film, television, theater and commercials';
  return { commission: agency.commission ?? AGENT_COMMISSION.rate, years: AGENCY_TERM.firstYears, effective, scope, exclusive: true };
}

function close(sim: Simulation, a: Approach, status: ApproachStatus, what: string): void {
  a.status = status;
  a.closedAt = sim.now;
  a.history.push({ at: sim.now, what });
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.payload.approachId === a.id) sim.timeline.cancel(item.id, sim.now);
  for (const d of Object.values(sim.universe.decisions)) if (d.refType === 'agency-offer' && d.refId === a.id && !d.resolvedAt) d.resolvedAt = sim.now;
}

/** A weekday at eleven, a week or more on, clear of anything that wants them. */
function meetingTime(sim: Simulation, cityId: string): Instant {
  const zone = CITIES.require(cityId).timeZone;
  for (let d = APPROACH.meetingLeadDays; d < APPROACH.meetingLeadDays + 21; d += 1) {
    const p = zonedParts(sim.now + d * MS_DAY, zone);
    const at = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: APPROACH.meetingHour, minute: 0 }, zone);
    if (p.weekday === 0 || p.weekday === 6) continue;
    const ends = at + APPROACH.meetingMinutes * 60_000;
    if (!sim.universe.scheduled.some((x) => x.status === 'pending' && x.requiresPlayer && x.durationMinutes && x.at < ends && x.at + x.durationMinutes * 60_000 > at)) return at;
  }
  return sim.now + APPROACH.meetingLeadDays * MS_DAY;
}

/** Signing an offer: at once where they're free to, else from the current contract's end (`AgencyTerms.effective`). */
export function moveTo(sim: Simulation, person: Person, offer: Offer): Instant {
  const career = careerOf(person);
  if (career.nextAgency) throw new CommandError(`You’ve signed with ${name(career.nextAgency.agencyId)} from ${formatDate(career.nextAgency.terms.effective, sim.zone)}: the move is settled.`);
  const agency = agencyById(offer.agencyId)!;
  const approach = approachesOf(person).find((a) => a.agencyId === offer.agencyId && a.status === 'offered');
  const terms = termsFor(sim, person, agency);
  if (approach) close(sim, approach, 'signed', terms.effective > sim.now ? `Signed, from ${formatDate(terms.effective, sim.zone)}` : 'Signed');
  if (!career.agencyId || terms.effective <= sim.now) {
    if (career.agencyId) endRepresentation(sim, person, `You moved to ${agency.name}.`, true, true);
    represent(sim, person, { ...offer, terms });
    return sim.now;
  }
  // Bound to the current contract: the new one begins as it ends, which isn't renewed meanwhile.
  career.nextAgency = { agencyId: agency.id, cityId: offer.cityId, terms };
  career.renewal = { state: 'declined' };
  career.offers = career.offers.filter((o) => o !== offer);
  for (const d of Object.values(sim.universe.decisions)) if (d.refType === 'agency-renewal' && !d.resolvedAt) d.resolvedAt = sim.now;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'career', title: `Signed With ${agency.name}`, body: `${agency.name} represents you from ${formatDate(terms.effective, sim.zone)}, when your contract with ${name(career.agencyId)} ends; until then ${name(career.agencyId)} does, and it won’t be renewed.`, importance: 70, route: '/workspace/career' });
  return terms.effective;
}

/** What the agency has done for them since signing, from the career's own records. */
export function representationReview(sim: Simulation, person: Person) {
  const career = careerOf(person);
  if (!career.agencyId || career.signedAt === undefined) return undefined;
  const since = career.signedAt;
  const sent = career.auditions.filter((a) => !a.self && a.via !== 'commercial' && a.at >= since);
  const booked = career.bookings.filter((b) => b.agentId === career.agencyId && b.offeredAt >= since);
  const agency = agencyById(career.agencyId)!;
  return {
    agency, since, termEnds: career.termEnds, renewal: career.renewal?.state, commission: agency.commission ?? AGENT_COMMISSION.rate,
    sent: sent.length, sentBooked: sent.filter((a) => a.status === 'booked').length, offers: booked.length,
    worked91: daysWorkedIn(sim, person, LEAVING.windowDays), mayLeave: mayLeave(sim, person),
    fit: rosterFit(standing(sim, person), agency), next: career.nextAgency,
  };
}

/** Each agency where they work, read against them: a fact (its name, commission) beside SLATE's estimates (its reach, their chance, its attention). */
export function agencyOutlook(sim: Simulation, person: Person) {
  const score = interestOf(sim, person, 'submission');
  return agenciesHere(person).map((agency) => {
    const gap = score - agency.bar;
    return {
      agency, commission: agency.commission ?? AGENT_COMMISSION.rate,
      chance: gap >= 3 ? 'Within Reach' : gap >= -APPROACH.meetBelow ? 'A Stretch' : 'Out Of Reach',
      fit: rosterFit(standing(sim, person), agency),
      referrer: referrerFor(person, agency.id),
      /** The manager's firm, or the casting office, that'd introduce them, where one would now. */
      manager: approachRefusal(sim, person, agency.id, 'manager') ? undefined : introducerFor(sim, person, agency.id, 'manager'),
      casting: approachRefusal(sim, person, agency.id, 'casting') ? undefined : introducerFor(sim, person, agency.id, 'casting'),
      refusal: approachRefusal(sim, person, agency.id, 'submission'),
    } as const;
  });
}

/** An agency's answer to an approach: no answer, a pass, or a meeting (`career.approach`). */
export function answerOf(sim: Simulation, person: Person, a: Pick<Approach, 'id' | 'agencyId' | 'via'>): 'silent' | 'passed' | 'meeting' {
  const rng = sim.rng('career.approach', person.id, `answer-${a.id}`);
  if (rng.next() < APPROACH.silence[a.via]) return 'silent';
  const gap = interestOf(sim, person, a.via) - agencyById(a.agencyId)!.bar;
  return gap >= -APPROACH.meetBelow && rng.next() < Math.min(0.85, Math.max(0.1, 0.25 + gap / 10)) ? 'meeting' : 'passed';
}

/** Whether a meeting kept brings an offer (`career.approach`). */
export function offersAfterMeeting(sim: Simulation, person: Person, a: Pick<Approach, 'id' | 'agencyId' | 'via'>): boolean {
  const gap = interestOf(sim, person, a.via) - agencyById(a.agencyId)!.bar;
  return sim.rng('career.approach', person.id, `meeting-${a.id}`).next() < Math.min(0.9, Math.max(0.15, 0.4 + gap / 10));
}

export function registerRepresentation(sim: Simulation): void {
  sim.onCommand<{ agencyId: string; via?: Approach['via'] }, { answerBy: Instant }>('career.approach_agency', (p, { sim: s }) => {
    const person = s.player;
    const via: Approach['via'] = p?.via === 'referral' || p?.via === 'manager' || p?.via === 'casting' ? p.via : 'submission';
    const agencyId = String(p?.agencyId);
    const no = approachRefusal(s, person, agencyId, via);
    if (no) throw new CommandError(no);
    const career = careerOf(person);
    const id = `ap${(career.seq += 1)}`;
    const answerAt = s.now + APPROACH.answerDays[via] * MS_DAY;
    const referrer = introducerFor(s, person, agencyId, via);
    approachesOf(person).push({ id, agencyId, cityId: workCity(person), via, ...(referrer ? { referrer } : {}), sentAt: s.now, answerAt, status: 'waiting', history: [{ at: s.now, what: !referrer ? 'Submitted: headshot, résumé and reel' : via === 'manager' ? `Introduced by your manager, ${referrer}` : via === 'casting' ? `Introduced by ${referrer}, who met you at a workshop` : `Introduced by ${referrer}` }] });
    s.schedule({ at: answerAt, kind: AGENCY_ANSWER_KIND, label: `${name(agencyId)} Answers`, category: 'career', priority: 20, payload: { personId: person.id, approachId: id } });
    return { answerBy: answerAt };
  });

  sim.onSchedule(AGENCY_ANSWER_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const a = person && approachesOf(person).find((x) => x.id === item.payload.approachId);
    if (!person || !a || a.status !== 'waiting') return;
    const agency = agencyById(a.agencyId)!;
    const tell = (title: string, body: string) => { if (person.id === s.universe.playerId) s.notify({ category: 'career', title, body, importance: 60, route: '/workspace/career' }); };
    const answer = answerOf(s, person, a);
    if (answer === 'silent') {
      close(s, a, 'silent', 'No answer by the date');
      tell(`No Answer From ${agency.name}`, `${agency.name} hadn’t answered by ${formatDate(a.answerAt, s.zone)}; an agency that wants to meet says so by then. You can approach them again in six months.`);
      return;
    }
    if (answer === 'passed') {
      close(s, a, 'passed', 'Passed');
      tell(`${agency.name} Passed`, `${agency.name} passed on representing you for now. They’ll read you again in a year; another agency may see it differently.`);
      return;
    }
    a.status = 'meeting';
    a.meetingAt = meetingTime(s, a.cityId);
    a.history.push({ at: s.now, what: `Asked to meet, ${formatDate(a.meetingAt, s.zone)}` });
    s.schedule({ at: a.meetingAt, kind: AGENCY_MEETING_KIND, label: `Meeting ${agency.name}`, category: 'career', priority: 30, requiresPlayer: true, durationMinutes: APPROACH.meetingMinutes, locationId: a.cityId, payload: { personId: person.id, approachId: a.id } });
    tell(`${agency.name} Wants To Meet`, `${agency.name} asks you to meet on ${formatDate(a.meetingAt, s.zone)} at ${formatTime(a.meetingAt, s.zone)}, in ${CITIES.require(a.cityId).name}. A meeting missed ends it.`);
  });

  sim.onSchedule(AGENCY_MEETING_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const a = person && approachesOf(person).find((x) => x.id === item.payload.approachId);
    if (!person || !a || a.status !== 'meeting') return;
    const agency = agencyById(a.agencyId)!;
    const mine = person.id === s.universe.playerId;
    if (!present(person, item.at, a.cityId)) {
      item.status = 'missed';
      close(s, a, 'missed', 'You didn’t come to the meeting');
      earn(s, person, APPROACH.missedMeeting);
      if (mine) s.notify({ category: 'career', title: `You Missed ${agency.name}`, body: `You didn’t come to the meeting with ${agency.name}, and that’s the end of it for a year.`, importance: 70, route: '/workspace/career' });
      return;
    }
    if (!offersAfterMeeting(s, person, a)) {
      close(s, a, 'passed', 'Met; they passed');
      if (mine) s.notify({ category: 'career', title: `${agency.name} Passed`, body: `You met ${agency.name}; they decided it isn’t the right fit now.`, importance: 60, route: '/workspace/career' });
      return;
    }
    const terms = termsFor(s, person, agency);
    const until = s.now + APPROACH.offerDays * MS_DAY;
    a.status = 'offered';
    a.offerUntil = until;
    a.history.push({ at: s.now, what: 'Offered to represent you' });
    const career = careerOf(person);
    career.offers = career.offers.filter((o) => o.agencyId !== agency.id);
    career.offers.push({ agencyId: agency.id, cityId: a.cityId, until, terms });
    s.schedule({ at: until, kind: AGENCY_OFFER_LAPSE_KIND, label: `${agency.name}’s Offer Lapses`, category: 'system', priority: 20, payload: { personId: person.id, approachId: a.id } });
    if (!mine) return;
    const starts = terms.effective > s.now ? `from ${formatDate(terms.effective, s.zone)}, when your contract with ${name(career.agencyId!)} ends` : 'from the day you sign';
    s.requireDecision({
      urgency: 75, category: 'career', title: `${agency.name} Offers To Represent You`,
      detail: `${agency.name} offers a ${terms.years}-year contract ${starts}: ${Math.round(terms.commission * 1000) / 10}% commission (SAG-AFTRA’s franchise caps it at 10%), exclusive, for ${terms.scope.toLowerCase()}. The offer stands until ${formatDate(until, s.zone)}.`,
      route: '/workspace/career', dueAt: until, refType: 'agency-offer', refId: a.id,
      actions: [
        { label: `Sign With ${agency.name}`, commandKind: 'career.sign', payload: { agencyId: agency.id, cityId: a.cityId } },
        { label: 'Decline', commandKind: 'career.decline_agency', payload: { agencyId: agency.id } },
      ],
    });
  });

  sim.onSchedule(AGENCY_OFFER_LAPSE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const a = person && approachesOf(person).find((x) => x.id === item.payload.approachId);
    if (!person || !a || a.status !== 'offered') return;
    const career = careerOf(person);
    career.offers = career.offers.filter((o) => o.agencyId !== a.agencyId);
    close(s, a, 'lapsed', 'The offer lapsed');
  });

  sim.onCommand<{ agencyId: string }, { declined: string }>('career.decline_agency', (p, { sim: s }) => {
    const person = s.player;
    const a = approachesOf(person).find((x) => x.agencyId === p?.agencyId && x.status === 'offered');
    if (!a) throw new CommandError('That agency hasn’t an offer standing.');
    const career = careerOf(person);
    career.offers = career.offers.filter((o) => o.agencyId !== a.agencyId);
    close(s, a, 'declined', 'You declined');
    return { declined: name(a.agencyId) };
  });

  sim.onCommand<{ agencyId: string }, { withdrawn: string }>('career.withdraw_approach', (p, { sim: s }) => {
    const person = s.player;
    const a = approachesOf(person).find((x) => x.agencyId === p?.agencyId && (x.status === 'waiting' || x.status === 'meeting'));
    if (!a) throw new CommandError('You’ve no approach waiting on that agency.');
    close(s, a, 'withdrawn', 'You withdrew');
    return { withdrawn: name(a.agencyId) };
  });
}

