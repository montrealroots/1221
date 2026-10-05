/**
 * SLATE — clubs a life can join (the master plan's §54, from 2026-10-03;
 * `docs/research/world/research-clubs.json`, each organiser's own pages read
 * that day, one secondhand as marked).
 *
 * - **parkrun**, free, 5 km every Saturday, registered once: Brooklyn Bridge
 *   (8:00 from May to October, 9:00 otherwise), Battersea and Bushy in
 *   London (9:00), Fairview in Dublin (9:30), Budapest Park in Toronto (8:00
 *   from May to September, 9:00 otherwise), Spanish Banks Beach in Vancouver
 *   (9:00). Los Angeles's and New Haven's nearest are 34 and 107 km off, and
 *   Mexico has none.
 * - **Running clubs**, free, weekly: NYRR's Open Run at Morningside Park
 *   (Saturday 9:00, 3 miles); Los Feliz Running Club (Sunday 8:00, 3 to 5
 *   miles); Parkdale Roadrunners in Toronto (Tuesday 19:00, read on its host's
 *   page); Vancouver Running Company's Flight Crew (Thursday 18:15, 5 km).
 * - **Leagues**, a season's fee: Volo's kickball in New York ($135, six
 *   Wednesdays from 18:30) and Los Angeles ($84.66, eight Mondays from
 *   19:15); GO Mammoth's netball at Hyde Park (£11.10 a week, eight Mondays
 *   from 19:00); Urban Rec's soccer at UBC (C$195 with tax, twelve Thursdays
 *   from 20:00). Volo and GO Mammoth don't say whether tax is in their fees,
 *   which are taken as charged. The Toronto Ultimate Club's summer league says
 *   only weeknights, and isn't kept.
 * A league runs season after season, as Volo's do; a season begins the week
 * it's joined. A game is an hour, a run its distance at a ten-minute mile,
 * SLATE's estimates; each at the Compendium of Physical Activities' METs
 * (kickball and netball 7.0, running at a ten-minute mile 9.3; casual
 * soccer 7.0).
 *
 * From 2026-10-03 (`research-life-gaps.json`, each provider's own page):
 * - **Leagues** more: FirmBalls' five-a-side at Spawell in Dublin, Wednesdays
 *   from 18:30, €60 a team a game, a player's share €12 of a team of five,
 *   SLATE's reading; New Haven's pickleball league, Tuesdays from 17:30, $30 a
 *   player a session, at the 4.1 METs measured for doubles; Pumas7's fútbol 7
 *   in Mexico City, Saturday mornings, MX$1,100 a player for its 12 rounds;
 *   GO Mammoth's netball at Vauxhall, Tuesdays from 18:00, £10.60 a player a
 *   week, 40-minute games, eight weeks.
 * - **Lessons**, a course of weekly sessions at a provider's own day, hour
 *   and price for someone not a member: swimming at the YMCA in New York and
 *   New Haven, Trinity Sport in Dublin, Toronto's St. Lawrence center and
 *   Vancouver's Kensington Pool; tennis at Bulldog Tennis Club, Better's
 *   Islington Tennis Center, Trinity Sport and West Point Grey; guitar at
 *   Waltons in Dublin and Toronto's Northwood center; painting at Barnsdall
 *   Arts Center in Los Angeles (its lab fee in); cooking at Toronto's Rouge
 *   Valley center. Each at the 2024 Compendium's METs where one fits:
 *   swimming leisurely 6.0, tennis 6.8, guitar 2.0, cooking 2.0; painting has
 *   none read, and is time spent. A session under three METs is an hour
 *   unwinding, not a workout. A course runs its sessions from the week it's
 *   joined, as a league's season does.
 *
 * **Outdoors** (from 2026-10-03), where a thunderstorm stops it: parkrun and
 * the running clubs, on their parks and streets; Volo's kickball in
 * McCarren Park and on a school field; GO Mammoth's netball on Park Sports
 * Hyde Park's open courts; FirmBalls' and Urban Rec's pitches; Pumas7's.
 * Vauxhall's netball and every lesson are taken as indoors, their venues
 * not read for it. The pickleball league was too, until its own page,
 * read on 2026-10-05, said its matches are canceled in poor weather.
 *
 * **Courses in the actor's craft** (from 2026-10-05,
 * `docs/research/world/research-actor-courses-a.json` and `-b.json`, each
 * read from its provider's own page that day, three secondhand from
 * CourseHorse): 39 weekly courses that train singing, voice-over, stage
 * combat, accents or acting on camera, at the providers' own day, hour,
 * length, sessions and price, each a session of the skill it trains
 * (`systems/clubs.ts`). As with every lesson, a course runs from the week
 * it's booked to start; the published term dates are kept in the research.
 * A venue in a neighbouring town (Pasadena, Burbank, Glendale, Hamden) is
 * gone to as an errand in town, SLATE's reading. Left out: a two-week daily
 * intensive (Affair of Honour), a members-only workshop (the New Actors
 * Centre), and seven with no fixed sessions or price; none was found for
 * voice-over in Dublin and Toronto, singing and voice-over in Mexico City,
 * accents in New Haven, Dublin, Toronto and Mexico City, or stage combat in
 * New Haven and Mexico City. A price whose page doesn't say whether tax is
 * in it is taken as charged.
 *
 * **Terms** (from 2026-10-05, `docs/research/world/research-club-terms.json`):
 * each provider's own words on leaving and on a meeting it calls off, read
 * from its own page (Kensington's swim policy secondhand, from another of
 * Vancouver's community centers). None makes up a session its member
 * misses: the nearest is a substitute in a league's team.
 */

import type { Skill } from './school';

export type ClubKind = 'parkrun' | 'running' | 'league' | 'lesson';

/**
 * What leaving gives back of a season paid ahead, step by step, the first
 * that applies taken (from 2026-10-05, `research-club-terms.json`, each
 * provider's own terms read that day, Kensington's secondhand): before
 * meeting `before` of the season, counted from 1, and `daysAhead` days ahead
 * of it, the fee back less `keepSessions` sessions' worth and an admin `fee`
 * in the club's money, or pro-rated by the meetings left, or as a credit with
 * the provider in place of money. No step that applies, nothing back.
 */
export interface LeaveStep {
  before: number; daysAhead?: number;
  /** `daysAhead` counted in business days, Monday to Friday, holidays not kept. */
  business?: true;
  keepSessions?: number;
  /** A share of the fee kept: 0.2 where 80% comes back. */
  keepShare?: number;
  fee?: number; prorated?: true; credit?: true;
  /** How long a credit is good for, in months; for good where not said. */
  creditMonths?: number;
}

export interface ClubTerms {
  leave: readonly LeaveStep[];
  /** The provider's terms on leaving, in its own words where they could be kept, as read. */
  leaveSaid: string;
  /**
   * A meeting it calls off in a thunderstorm: a week added on to the season,
   * only past the first `after` called off, up to `most` a season, and past
   * those a session's credit where `creditPast`.
   */
  calledOff?: { after?: number; most?: number; creditPast?: true };
  calledOffSaid?: string;
  /** Classes a member misses that it makes up, a week added on each, a season (Voice Academy NYC's one). */
  missedMakeUps?: number;
  read: 'page' | 'secondhand';
  source: string;
}

export interface Club {
  id: string; cityId: string; kind: ClubKind; name: string; place: string;
  /** 0 Sunday. */ weekday: number; hour: number; minute: number;
  /** A different start in some months, 1 to 12, both ends in. */ summer?: { from: number; to: number; hour: number; minute: number };
  minutes: number; /** The Compendium's METs; none where none fits. */ met?: number;
  /** A season's fee, or a week's, in its money; none for a free club. */ fee?: { amount: number; per: 'season' | 'week'; currency: string; taxIncluded: boolean };
  seasonWeeks?: number;
  /** Played or run outside, and so not in a thunderstorm. */ outdoor?: boolean;
  confirmed: boolean;
  /** Who runs it, where a credit with them is kept across their clubs. */
  provider?: string;
  /** Its own terms for leaving and for a meeting called off, where they were read (from 2026-10-05). */
  terms?: ClubTerms;
  /** The actor's skill a session grows (from 2026-10-05, `content/school.ts`). */
  trains?: Skill;
}

const RUN_MINUTES_5K = 31;

const VOLO_TERMS: ClubTerms = {
  leave: [],
  leaveSaid: 'If you, or your group/team, decide not to participate after registering, refunds are not available.',
  calledOff: { most: 2, creditPast: true },
  calledOffSaid: 'Volo guarantees up to two weather-related makeup games per season; a postponed game it can’t make up is a prorated credit.',
  read: 'page', source: 'https://help.volosports.com/support/solutions/articles/29000049635-what-s-volo-s-refund-policy-',
};
const GO_MAMMOTH_TERMS: ClubTerms = {
  leave: [],
  leaveSaid: 'Paid by the week at each game, so nothing is paid ahead to come back; its refunds of a season paid ahead stop 5 days before the start, less £15.',
  calledOff: {},
  calledOffSaid: 'Your missed games will be rescheduled (extra week added on to the season).',
  read: 'page', source: 'https://www.gomammoth.co.uk/need-help/',
};
const TRINITY_TERMS: ClubTerms = {
  leave: [{ before: 1, daysAhead: 7 }],
  leaveSaid: 'Bookings cancelled with less than the required notice periods will not be entitled to a transfer or a refund: courses, 7 days’ notice.',
  read: 'page', source: 'https://www.tcd.ie/media/tcd/sport/pdfs/admin-/Terms-and-Conditions-August-2026.pdf',
};
const TORONTO_TERMS: ClubTerms = {
  leave: [{ before: 3, prorated: true, fee: 14.13 }],
  leaveSaid: 'You can withdraw or request a refund up to the third class of a program, prorated on the date received, less a $14.13 administration fee.',
  read: 'page', source: 'https://www.toronto.ca/explore-enjoy/parks-recreation/how-to-use-our-services/how-to-register-for-recreation-programs',
};
const NOTHING_BACK = (leaveSaid: string, source: string): ClubTerms => ({ leave: [], leaveSaid, read: 'page', source });

export const CLUBS: readonly Club[] = [
  { id: 'parkrun-brooklyn-bridge', cityId: 'us-ny-newyork', kind: 'parkrun', name: 'Brooklyn Bridge parkrun', place: 'Brooklyn Bridge Park', weekday: 6, hour: 9, minute: 0, summer: { from: 5, to: 10, hour: 8, minute: 0 }, minutes: RUN_MINUTES_5K, met: 9.3, outdoor: true, confirmed: true },
  { id: 'parkrun-battersea', cityId: 'uk-eng-london', kind: 'parkrun', name: 'Battersea parkrun', place: 'Battersea Park', weekday: 6, hour: 9, minute: 0, minutes: RUN_MINUTES_5K, met: 9.3, outdoor: true, confirmed: true },
  { id: 'parkrun-bushy', cityId: 'uk-eng-london', kind: 'parkrun', name: 'Bushy parkrun', place: 'Bushy Park, Teddington', weekday: 6, hour: 9, minute: 0, minutes: RUN_MINUTES_5K, met: 9.3, outdoor: true, confirmed: true },
  { id: 'parkrun-fairview', cityId: 'ie-lei-dublin', kind: 'parkrun', name: 'Fairview parkrun', place: 'Fairview Park', weekday: 6, hour: 9, minute: 30, minutes: RUN_MINUTES_5K, met: 9.3, outdoor: true, confirmed: true },
  { id: 'parkrun-budapest-park', cityId: 'ca-on-toronto', kind: 'parkrun', name: 'Budapest Park parkrun', place: 'Budapest Park', weekday: 6, hour: 9, minute: 0, summer: { from: 5, to: 9, hour: 8, minute: 0 }, minutes: RUN_MINUTES_5K, met: 9.3, outdoor: true, confirmed: true },
  { id: 'parkrun-spanish-banks', cityId: 'ca-bc-vancouver', kind: 'parkrun', name: 'Spanish Banks Beach parkrun', place: 'Spanish Banks Beach', weekday: 6, hour: 9, minute: 0, minutes: RUN_MINUTES_5K, met: 9.3, outdoor: true, confirmed: true },
  { id: 'nyrr-open-run-morningside', cityId: 'us-ny-newyork', kind: 'running', name: 'NYRR Open Run', place: 'Morningside Park', weekday: 6, hour: 9, minute: 0, minutes: 30, met: 9.3, outdoor: true, confirmed: true },
  { id: 'los-feliz-running-club', cityId: 'us-ca-losangeles', kind: 'running', name: 'Los Feliz Running Club', place: 'Griffith Park', weekday: 0, hour: 8, minute: 0, minutes: 40, met: 9.3, outdoor: true, confirmed: true },
  { id: 'parkdale-roadrunners', cityId: 'ca-on-toronto', kind: 'running', name: 'Parkdale Roadrunners', place: 'Brock Avenue', weekday: 2, hour: 19, minute: 0, minutes: RUN_MINUTES_5K, met: 9.3, outdoor: true, confirmed: false },
  { id: 'vrc-flight-crew', cityId: 'ca-bc-vancouver', kind: 'running', name: 'Flight Crew Run Club', place: 'West 4th Avenue', weekday: 4, hour: 18, minute: 15, minutes: RUN_MINUTES_5K, met: 9.3, outdoor: true, confirmed: true },
  { id: 'volo-ny-kickball', cityId: 'us-ny-newyork', kind: 'league', name: 'Volo Kickball', place: 'McCarren Park', weekday: 3, hour: 18, minute: 30, minutes: 60, met: 7.0, fee: { amount: 135, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 6, outdoor: true, confirmed: true, provider: 'volo', terms: VOLO_TERMS },
  { id: 'volo-la-kickball', cityId: 'us-ca-losangeles', kind: 'league', name: 'Volo Kickball', place: 'Immaculate Heart High School', weekday: 1, hour: 19, minute: 15, minutes: 60, met: 7.0, fee: { amount: 84.66, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 8, outdoor: true, confirmed: true, provider: 'volo', terms: VOLO_TERMS },
  { id: 'go-mammoth-netball', cityId: 'uk-eng-london', kind: 'league', name: 'GO Mammoth Netball', place: 'Park Sports Hyde Park', weekday: 1, hour: 19, minute: 0, minutes: 60, met: 7.0, fee: { amount: 11.1, per: 'week', currency: 'GBP', taxIncluded: true }, seasonWeeks: 8, outdoor: true, confirmed: true, provider: 'go-mammoth', terms: GO_MAMMOTH_TERMS },
  { id: 'firmballs-spawell-fives', cityId: 'ie-lei-dublin', kind: 'league', name: 'FirmBalls Five-A-Side', place: 'Spawell Powerleague', weekday: 3, hour: 18, minute: 30, minutes: 54, met: 7.0, fee: { amount: 60 / 5, per: 'week', currency: 'EUR', taxIncluded: true }, outdoor: true, confirmed: true, terms: NOTHING_BACK('Match fees are paid as you go; a team leaving without 3 weeks’ notice forfeits its deposit.', 'https://www.firmballs.com/table/dublin-spawell-powerleague-centre/') },
  { id: 'new-haven-pickleball', cityId: 'us-ct-newhaven', kind: 'league', name: 'New Haven Pickleball League', place: 'Wilbur Cross High School', weekday: 2, hour: 17, minute: 30, minutes: 60, met: 4.1, fee: { amount: 30, per: 'week', currency: 'USD', taxIncluded: true }, seasonWeeks: 9, outdoor: true, confirmed: true, terms: { leave: [], leaveSaid: 'Registration for each session is $30 per player, paid to secure your spot: no refund is published.', calledOff: { after: 2 }, calledOffSaid: 'If weather is poor, matches will be canceled; if more than two games are canceled, makeup games are added before playoffs.', read: 'page', source: 'https://nhvpickleball.com/' } },
  { id: 'pumas7-futbol7', cityId: 'mx-cmx-mexicocity', kind: 'league', name: 'Pumas7 Fútbol 7', place: 'Pumas7', weekday: 6, hour: 9, minute: 0, minutes: 60, met: 7.0, fee: { amount: 1_100, per: 'season', currency: 'MXN', taxIncluded: true }, seasonWeeks: 12, outdoor: true, confirmed: true, terms: NOTHING_BACK('Only the team’s MX$1,000 deposit is returned when it leaves; nothing is said of a player’s registration.', 'https://pumas7.com/informaci%C3%B3n%2Finscripciones') },
  { id: 'go-mammoth-vauxhall-netball', cityId: 'uk-eng-london', kind: 'league', name: 'GO Mammoth Netball Vauxhall', place: 'Vauxhall', weekday: 2, hour: 18, minute: 0, minutes: 40, met: 7.0, fee: { amount: 10.6, per: 'week', currency: 'GBP', taxIncluded: true }, seasonWeeks: 8, confirmed: true, provider: 'go-mammoth', terms: GO_MAMMOTH_TERMS },
  { id: 'ymca-cross-island-swim', cityId: 'us-ny-newyork', kind: 'lesson', name: 'Adult Swimming, Stage 1', place: 'Cross Island YMCA', weekday: 1, hour: 19, minute: 0, minutes: 45, met: 6.0, fee: { amount: 335, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 8, confirmed: true, terms: NOTHING_BACK('Programs are non-refundable and make up classes not available, unless the YMCA cancels or postpones a class.', 'https://ymcanyc.org/membership-policies') },
  { id: 'ymca-new-haven-swim', cityId: 'us-ct-newhaven', kind: 'lesson', name: 'Swimming Lessons', place: 'New Haven YMCA Youth Center', weekday: 5, hour: 16, minute: 30, minutes: 30, met: 6.0, fee: { amount: 210, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 7, confirmed: true, terms: { leave: [{ before: 1, fee: 10 }], leaveSaid: 'A credit or refund at the participant’s request, received before the session starts, with a $10.00 administrative fee.', read: 'page', source: 'https://cccymca.org/locations/newhaven/swim/' } },
  { id: 'trinity-sport-swim', cityId: 'ie-lei-dublin', kind: 'lesson', name: 'Adult Swimming', place: 'Trinity Sport', weekday: 2, hour: 17, minute: 40, minutes: 30, met: 6.0, fee: { amount: 90, per: 'season', currency: 'EUR', taxIncluded: true }, seasonWeeks: 6, confirmed: true, provider: 'trinity-sport', terms: TRINITY_TERMS },
  { id: 'toronto-st-lawrence-swim', cityId: 'ca-on-toronto', kind: 'lesson', name: 'Adult Swim 1', place: 'St. Lawrence Community Rec Center', weekday: 2, hour: 14, minute: 0, minutes: 60, met: 6.0, fee: { amount: 140.19, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 9, confirmed: true, provider: 'toronto-rec', terms: TORONTO_TERMS },
  { id: 'vancouver-kensington-swim', cityId: 'ca-bc-vancouver', kind: 'lesson', name: 'Adult And Teen Swimmer 1', place: 'Kensington Pool', weekday: 4, hour: 11, minute: 0, minutes: 40, met: 6.0, fee: { amount: 115.92 + 4.3, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 10, confirmed: true, terms: { leave: [{ before: 1, daysAhead: 5 }, { before: 1, keepSessions: 1 }, { before: 2, daysAhead: 5, keepSessions: 1 }, { before: 2, keepSessions: 2 }], leaveSaid: 'Full refund five or more days before the start; the fee less one class until five days before the second, less two after; none after the second (the 4 to 5 days before the second, unstated, taken as less two).', read: 'secondhand', source: 'https://kerrisdalecc.com/programs-registration/policies-procedures/' } },
  { id: 'bulldog-tennis-clinic', cityId: 'us-ct-newhaven', kind: 'lesson', name: 'Adult Tennis Clinic', place: 'Bulldog Tennis Club', weekday: 3, hour: 18, minute: 0, minutes: 90, met: 6.8, fee: { amount: 200, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 4, confirmed: true, terms: NOTHING_BACK('Payment is final, we do not offer any make-up classes or refunds for missed sessions.', 'https://bulldogtennisclub.com/adult-clinic') },
  { id: 'better-islington-tennis', cityId: 'uk-eng-london', kind: 'lesson', name: 'Adult Tennis, Level 1', place: 'Islington Tennis Center', weekday: 1, hour: 19, minute: 0, minutes: 60, met: 6.8, fee: { amount: 79.9, per: 'season', currency: 'GBP', taxIncluded: true }, seasonWeeks: 4, confirmed: true, terms: NOTHING_BACK('All fees paid in advance are non-refundable; it runs by the month, and is stopped by notice.', 'https://www.better.org.uk/leisure-centre/london/islington/islingtontc/tennis') },
  { id: 'trinity-sport-tennis', cityId: 'ie-lei-dublin', kind: 'lesson', name: 'Adult Tennis', place: 'Trinity Sport, Botany Bay', weekday: 4, hour: 17, minute: 15, minutes: 60, met: 6.8, fee: { amount: 100, per: 'season', currency: 'EUR', taxIncluded: true }, seasonWeeks: 6, confirmed: true, provider: 'trinity-sport', terms: TRINITY_TERMS },
  { id: 'west-point-grey-tennis', cityId: 'ca-bc-vancouver', kind: 'lesson', name: 'Adult Beginner Tennis', place: 'West Point Grey Community Center', weekday: 2, hour: 19, minute: 15, minutes: 60, met: 6.8, fee: { amount: 266, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 7, confirmed: true, terms: { leave: [{ before: 2, daysAhead: 2, prorated: true, fee: 5 }], leaveSaid: 'Pro-rated with an administration fee of $5, requested 48 hours prior to the second class; no refunds after the 2nd scheduled class.', read: 'page', source: 'https://anc.ca.apm.activecommunities.com/vancouver/rest/activity/detail/estimateprice/624751' } },
  { id: 'waltons-guitar', cityId: 'ie-lei-dublin', kind: 'lesson', name: 'Introducing Guitar For Adults', place: 'Waltons New School Of Music', weekday: 1, hour: 19, minute: 0, minutes: 60, met: 2.0, fee: { amount: 230, per: 'season', currency: 'EUR', taxIncluded: true }, seasonWeeks: 10, confirmed: true, terms: NOTHING_BACK('Group courses are given no refunds, although in exceptional circumstances deferral may be possible.', 'https://www.newschool.ie/tuition/group-courses-for-beginners/introducing-guitar-for-adults/') },
  { id: 'northwood-guitar', cityId: 'ca-on-toronto', kind: 'lesson', name: 'Music: Guitar', place: 'Northwood Community Center', weekday: 6, hour: 11, minute: 0, minutes: 60, met: 2.0, fee: { amount: 102.62, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 9, confirmed: true, provider: 'toronto-rec', terms: TORONTO_TERMS },
  { id: 'barnsdall-painting', cityId: 'us-ca-losangeles', kind: 'lesson', name: 'Black And White Acrylic Portraiture', place: 'Barnsdall Arts Center', weekday: 3, hour: 10, minute: 0, minutes: 180, fee: { amount: 96 + 30, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 8, confirmed: true, provider: 'barnsdall', terms: { leave: [{ before: 2, credit: true, fee: 30, creditMonths: 12 }], leaveSaid: 'All fees are non-refundable; a class credit, good for a year, if asked before the second day of class (SLATE keeps the $30 lab fee out of it, the page naming only its refund on a cancellation).', read: 'page', source: 'https://barnsdallarts.lacity.gov/bac/faq/' } },
  { id: 'rouge-valley-cooking', cityId: 'ca-on-toronto', kind: 'lesson', name: 'Cooking', place: 'Rouge Valley Community Rec Center', weekday: 6, hour: 14, minute: 45, minutes: 120, met: 2.0, fee: { amount: 135.15, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 9, confirmed: true, provider: 'toronto-rec', terms: TORONTO_TERMS },
  { id: 'urban-rec-ubc-soccer', cityId: 'ca-bc-vancouver', kind: 'league', name: 'Urban Rec Soccer', place: 'UBC', weekday: 4, hour: 20, minute: 0, minutes: 60, met: 7.0, fee: { amount: 195, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 12, outdoor: true, confirmed: true, terms: { leave: [], leaveSaid: 'We only offer refunds if we are able to resell your spot: SLATE doesn’t model a resale, so nothing comes back.', calledOff: {}, calledOffSaid: 'Urban Rec will do its best to reschedule those games: SLATE adds a week, where it says doubleheaders before the end date.', read: 'page', source: 'https://vancouver.urbanrec.ca/member/faq' } },
  // Courses in the actor's craft (from 2026-10-05, `research-actor-courses-a.json` and `-b.json`): each the skill it trains.
  { id: 'hb-singing-voice-1', cityId: 'us-ny-newyork', kind: 'lesson', name: 'Singing Voice 1', place: 'HB Studio', weekday: 0, hour: 13, minute: 30, minutes: 120, fee: { amount: 555, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 10, confirmed: true, provider: 'hb-studio', trains: 'singing', terms: { leave: [{ before: 1 }], leaveSaid: 'As of the first day of class, there are no refunds, credits, withdrawals or transfers.', read: 'page', source: 'https://hbstudio.coursestorm.com/course/singing-voice-14' } },
  { id: 'voice-academy-secrets-of-singing', cityId: 'us-ny-newyork', kind: 'lesson', name: 'Secrets Of Singing', place: 'Ripley Grier Studios', weekday: 2, hour: 18, minute: 0, minutes: 60, fee: { amount: 349, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 8, confirmed: true, provider: 'voice-academy-nyc', trains: 'singing', terms: { leave: [], leaveSaid: 'One make-up class, and no refunds.', missedMakeUps: 1, read: 'page', source: 'https://voiceacademynyc.com/group-classes/' } },
  { id: 'acting-studio-voiceover', cityId: 'us-ny-newyork', kind: 'lesson', name: 'Voice-Over Workshop', place: 'The Acting Studio New York, 14th floor', weekday: 1, hour: 19, minute: 0, minutes: 180, fee: { amount: 450, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 8, confirmed: true, provider: 'acting-studio-ny', trains: 'voiceover', terms: { leave: [{ before: 1, daysAhead: 14, fee: 75 }, { before: 8, credit: true, fee: 75 }], leaveSaid: 'Withdrawal 14 or more days before the first class: all of the tuition back less the $75 processing fee; after it, account credit only (SLATE takes the credit as the tuition less the fee, its amount not stated).', read: 'page', source: 'https://www.actingstudio.com/acting-classes/actors/voice-over-workshop/' } },
  { id: 'acting-voice-studios-voiceover', cityId: 'us-ny-newyork', kind: 'lesson', name: 'Voice-Over Intensive', place: 'Acting & Voice Studios', weekday: 2, hour: 18, minute: 30, minutes: 120, fee: { amount: 299, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 4, confirmed: true, provider: 'acting-voice-studios', trains: 'voiceover', terms: { leave: [{ before: 1, daysAhead: 1, credit: true }], leaveSaid: 'Full credit toward another class if canceled 24 hours or more before the class; no refunds under any circumstances.', read: 'page', source: 'https://www.actingandvoicestudios.com/products/september-october-4-week-in-person-or-zoom-voice-over-intensive-with-casting-director-barry-shapiro' } },
  { id: 'venice-singing-for-fun', cityId: 'us-ca-losangeles', kind: 'lesson', name: 'Singing For Fun', place: 'Venice School of Music', weekday: 2, hour: 18, minute: 0, minutes: 55, fee: { amount: 220, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 4, confirmed: true, provider: 'venice-school-of-music', trains: 'singing', terms: { leave: [], leaveSaid: 'Group classes are given no refunds.', read: 'page', source: 'https://www.veniceschoolofmusic.com/groupsingingclasses' } },
  { id: 'pasadena-playhouse-singers', cityId: 'us-ca-losangeles', kind: 'lesson', name: 'Playhouse Singers: Beginner', place: 'Pasadena Playhouse', weekday: 3, hour: 19, minute: 0, minutes: 90, fee: { amount: 200, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 6, confirmed: true, provider: 'pasadena-playhouse', trains: 'singing', terms: { leave: [{ before: 1, daysAhead: 10 }], leaveSaid: 'A full refund if canceled at least ten days before the start; none from the first day.', read: 'page', source: 'https://www.pasadenaplayhouse.org/event/playhouse-singers-fall-2026/' } },
  { id: 'voiceover-academy-intro', cityId: 'us-ca-losangeles', kind: 'lesson', name: 'Introduction To Voiceover', place: 'Aura Sound & Color', weekday: 2, hour: 19, minute: 0, minutes: 180, fee: { amount: 495, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 6, confirmed: true, provider: 'voiceover-academy', trains: 'voiceover', terms: { leave: [{ before: 1, daysAhead: 14, business: true, keepShare: 0.2 }], leaveSaid: 'Refunds 14 business days before the class start date, of 80% of the class total cost.', read: 'page', source: 'https://www.thevoiceoveracademy.com/event-details/introduction-to-voiceover-6-weeks-2' } },
  { id: 'a-plus-voiceover-101', cityId: 'us-ca-losangeles', kind: 'lesson', name: 'Voiceover 101', place: 'A Plus Voice Overs studio', weekday: 6, hour: 10, minute: 0, minutes: 180, fee: { amount: 450, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 4, confirmed: true, provider: 'a-plus-voice-overs', trains: 'voiceover', terms: { leave: [], leaveSaid: 'Its page published no refund terms: nothing comes back.', read: 'page', source: 'https://www.aplusvoiceovers.com/voice-acting-classes.html' } },
  { id: 'city-lit-singing-1', cityId: 'uk-eng-london', kind: 'lesson', name: 'Singing 1', place: 'City Lit, Keeley Street', weekday: 3, hour: 19, minute: 45, minutes: 90, fee: { amount: 279, per: 'season', currency: 'GBP', taxIncluded: true }, seasonWeeks: 10, confirmed: true, provider: 'city-lit', trains: 'singing', terms: { leave: [{ before: 1, daysAhead: 14 }], leaveSaid: 'A full refund requested at least 14 calendar days before the course is due to start.', read: 'page', source: 'https://www.citylit.ac.uk/courses/singing-1' } },
  { id: 'guildhall-singing-beginners', cityId: 'uk-eng-london', kind: 'lesson', name: 'Singing For Beginners', place: 'Guildhall School of Music & Drama', weekday: 3, hour: 19, minute: 0, minutes: 105, fee: { amount: 320, per: 'season', currency: 'GBP', taxIncluded: true }, seasonWeeks: 8, confirmed: true, provider: 'guildhall', trains: 'singing', terms: { leave: [{ before: 1 }], leaveSaid: 'Once a course has started we are unable to offer any refunds.', read: 'page', source: 'https://www.gsmd.ac.uk/study-with-guildhall/short-courses-summer-schools/find-a-short-course-or-summer-school/singing-for-beginners' } },
  { id: 'city-lit-voiceovers', cityId: 'uk-eng-london', kind: 'lesson', name: 'Voiceovers: Beginners', place: 'City Lit, Keeley Street', weekday: 2, hour: 17, minute: 0, minutes: 135, fee: { amount: 349, per: 'season', currency: 'GBP', taxIncluded: true }, seasonWeeks: 10, confirmed: true, provider: 'city-lit', trains: 'voiceover', terms: { leave: [{ before: 1, daysAhead: 14 }], leaveSaid: 'A full refund requested at least 14 calendar days before the course is due to start.', read: 'page', source: 'https://www.citylit.ac.uk/courses/voiceovers-beginners' } },
  { id: 'city-academy-voice-over', cityId: 'uk-eng-london', kind: 'lesson', name: 'Voice Over Skills With Voice Demo Reel', place: 'Premises Studios, Shoreditch', weekday: 3, hour: 19, minute: 0, minutes: 150, fee: { amount: 545, per: 'season', currency: 'GBP', taxIncluded: true }, seasonWeeks: 5, confirmed: true, provider: 'city-academy', trains: 'voiceover', terms: { leave: [{ before: 1, daysAhead: 3 }], leaveSaid: 'A full refund or credit if canceled at least 72 hours before the start of the course.', read: 'page', source: 'https://www.city-academy.com/voice-over-skills-with-voice-demo-reel' } },
  { id: 'waltons-singing', cityId: 'ie-lei-dublin', kind: 'lesson', name: 'Introducing Singing For Adults', place: 'Waltons New School of Music', weekday: 2, hour: 19, minute: 0, minutes: 60, fee: { amount: 230, per: 'season', currency: 'EUR', taxIncluded: true }, seasonWeeks: 10, confirmed: true, provider: 'waltons', trains: 'singing', terms: { leave: [], leaveSaid: 'Group courses are given no refunds, although in exceptional circumstances deferral may be possible.', read: 'page', source: 'https://www.newschool.ie/tuition/group-courses-for-beginners/introducing-singing-for-adults/' } },
  { id: 'rcm-beginner-choir', cityId: 'ca-on-toronto', kind: 'lesson', name: 'Beginner Choir: Learn To Sing', place: 'The Royal Conservatory of Music, TELUS Centre for Performance and Learning', weekday: 3, hour: 18, minute: 30, minutes: 60, fee: { amount: 325, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 14, confirmed: true, provider: 'royal-conservatory', trains: 'singing', terms: { leave: [], leaveSaid: 'Its page published no refund terms: nothing comes back.', read: 'page', source: 'https://www.rcmusic.com/course/choir-adults' } },
  { id: 'vancouver-acting-voiceover', cityId: 'ca-bc-vancouver', kind: 'lesson', name: 'Part Time Voice Over', place: 'Vancouver Acting School', weekday: 1, hour: 19, minute: 0, minutes: 180, fee: { amount: 809.97, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 12, confirmed: true, provider: 'vancouver-acting-school', trains: 'voiceover', terms: { leave: [{ before: 1, daysAhead: 3 }], leaveSaid: 'Withdrawals without penalty up to 72 hours before the first class; none once it has commenced.', read: 'page', source: 'https://vancouveractingschool.com/part-time-classes/part-time-voice-over/' } },
  { id: 'hb-stage-combat', cityId: 'us-ny-newyork', kind: 'lesson', name: 'Stage Combat: Weapons Training', place: 'HB Studio', weekday: 1, hour: 16, minute: 0, minutes: 120, fee: { amount: 255, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 5, confirmed: true, provider: 'hb-studio', trains: 'combat', terms: { leave: [{ before: 1 }], leaveSaid: 'As of the first day of class, there are no refunds, credits, withdrawals or transfers.', read: 'page', source: 'https://hbstudio.coursestorm.com/course/stage-combat-weapons-training2' } },
  { id: 'nyc-stage-screen-combat', cityId: 'us-ny-newyork', kind: 'lesson', name: 'Weekly Class: Unarmed And Rapier', place: 'NYC Stage & Screen Combat', weekday: 1, hour: 11, minute: 0, minutes: 120, fee: { amount: 135, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 4, confirmed: true, provider: 'nyc-stage-screen-combat', trains: 'combat', terms: { leave: [{ before: 1, daysAhead: 3, business: true, credit: true, creditMonths: 2 }], leaveSaid: 'Canceled 3 business days before, the registration applies to a class within the next 2 months; there are no refunds.', read: 'page', source: 'https://coursehorse.com/nyc/classes/performing-arts/acting/acting-technique/stage-combat/weekly-class--unarmed---rapier' } },
  { id: 'antaeus-stage-combat', cityId: 'us-ca-losangeles', kind: 'lesson', name: 'Stage Combat', place: 'Kiki & David Gindler Performing Arts Center', weekday: 1, hour: 18, minute: 0, minutes: 180, fee: { amount: 245, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 4, confirmed: true, provider: 'antaeus', trains: 'combat', terms: { leave: [{ before: 1, daysAhead: 28 }], leaveSaid: 'Fully refundable up to 4 weeks in advance of the first class.', read: 'page', source: 'https://antaeus.org/show-details/academy-2026-stage-combat' } },
  { id: 'st-tiernans-stage-combat', cityId: 'ie-lei-dublin', kind: 'lesson', name: 'Stage Combat', place: 'St Tiernan’s Community School', weekday: 4, hour: 19, minute: 0, minutes: 120, fee: { amount: 150, per: 'season', currency: 'EUR', taxIncluded: true }, seasonWeeks: 10, confirmed: true, provider: 'st-tiernans', trains: 'combat', terms: { leave: [], leaveSaid: 'Its page published no refund terms: nothing comes back.', read: 'page', source: 'https://www.adultedtiernans.ie/copy-of-music-drama' } },
  { id: 'rapier-wit-basic-actor-combatant', cityId: 'ca-on-toronto', kind: 'lesson', name: 'Basic Actor Combatant Course', place: 'Rapier Wit Studio', weekday: 2, hour: 18, minute: 0, minutes: 240, fee: { amount: 2288.25, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 22, confirmed: true, provider: 'rapier-wit', trains: 'combat', terms: { leave: [], leaveSaid: 'Giving up a place is asked to be told early, for the waitlist; no refund is stated.', read: 'page', source: 'https://www.rapierwit.com/training-new/upcoming-classes-new/' } },
  { id: 'barrow-dialects-1', cityId: 'us-ny-newyork', kind: 'lesson', name: 'Dialects For The Actor I', place: 'The Barrow Group Acting School', weekday: 6, hour: 11, minute: 0, minutes: 420, fee: { amount: 345, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 2, confirmed: true, provider: 'barrow-group', trains: 'accents', terms: { leave: [], leaveSaid: 'All payments are non-refundable unless the school cancels the class.', read: 'page', source: 'https://coursehorse.com/nyc/classes/performing-arts/acting/dialects-for-the-actor' } },
  { id: 'hb-accent-acquisition', cityId: 'us-ny-newyork', kind: 'lesson', name: 'Accent Acquisition: General American', place: 'HB Studio', weekday: 3, hour: 10, minute: 0, minutes: 90, fee: { amount: 555, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 10, confirmed: true, provider: 'hb-studio', trains: 'accents', terms: { leave: [{ before: 1 }], leaveSaid: 'As of the first day of class, there are no refunds, credits, withdrawals or transfers.', read: 'page', source: 'https://hbstudio.coursestorm.com/course/accent-acquisition-general-american-english1' } },
  { id: 'stella-adler-academy-speech-3', cityId: 'us-ca-losangeles', kind: 'lesson', name: 'Speech III: Accents And Dialects', place: 'Stella Adler Academy of Acting & Theatre, Studio G', weekday: 1, hour: 13, minute: 30, minutes: 135, fee: { amount: 800, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 16, confirmed: true, provider: 'stella-adler-academy', trains: 'accents', terms: { leave: [], leaveSaid: 'Its page published no refund terms: nothing comes back.', read: 'page', source: 'https://stellaadler.la/courses/registration-open/' } },
  { id: 'city-lit-accents', cityId: 'uk-eng-london', kind: 'lesson', name: 'Accents: Standard English', place: 'City Lit', weekday: 2, hour: 18, minute: 0, minutes: 90, fee: { amount: 149, per: 'season', currency: 'GBP', taxIncluded: true }, seasonWeeks: 6, confirmed: true, provider: 'city-lit', trains: 'accents', terms: { leave: [{ before: 1, daysAhead: 14 }], leaveSaid: 'A full refund requested at least 14 calendar days before the course is due to start.', read: 'page', source: 'https://www.citylit.ac.uk/courses/accents-standard-english' } },
  { id: 'city-academy-accent-clarity', cityId: 'uk-eng-london', kind: 'lesson', name: 'Accent Clarity For Actors', place: 'Photoion Studio, Waterloo', weekday: 1, hour: 18, minute: 0, minutes: 120, fee: { amount: 325, per: 'season', currency: 'GBP', taxIncluded: true }, seasonWeeks: 6, confirmed: true, provider: 'city-academy', trains: 'accents', terms: { leave: [{ before: 1, daysAhead: 3 }], leaveSaid: 'Cancel at least 72 hours before the course starts for a full refund, course credit or a free transfer.', read: 'page', source: 'https://www.city-academy.com/accent-clarity-for-actors' } },
  { id: 'vancouver-acting-dialects', cityId: 'ca-bc-vancouver', kind: 'lesson', name: 'Dialects And Accents: Foreign Accents', place: 'Vancouver Acting School', weekday: 3, hour: 19, minute: 0, minutes: 180, fee: { amount: 749.97, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 12, confirmed: true, provider: 'vancouver-acting-school', trains: 'accents', terms: { leave: [{ before: 1, daysAhead: 3 }], leaveSaid: 'Withdrawals without penalty up to 72 hours before the first class; none once it has commenced.', read: 'page', source: 'https://vancouveractingschool.com/part-time-classes/dialects-accents/' } },
  { id: 'hb-acting-with-the-camera-1', cityId: 'us-ny-newyork', kind: 'lesson', name: 'Acting With The Camera 1', place: 'HB Studio', weekday: 4, hour: 18, minute: 30, minutes: 180, fee: { amount: 885, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 10, confirmed: true, provider: 'hb-studio', trains: 'screen', terms: { leave: [{ before: 1 }], leaveSaid: 'As of the first day of class, there are no refunds, credits, withdrawals or transfers.', read: 'page', source: 'https://hbstudio.coursestorm.com/course/acting-with-the-camera-18' } },
  { id: 'stella-adler-film-tv-1', cityId: 'us-ny-newyork', kind: 'lesson', name: 'Acting For Film And Television 1', place: 'Stella Adler Studio of Acting', weekday: 2, hour: 19, minute: 0, minutes: 180, fee: { amount: 650, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 8, confirmed: true, provider: 'stella-adler-ny', trains: 'screen', terms: { leave: [{ before: 1, fee: 300 }, { before: 2, credit: true, keepShare: 0.25, fee: 300 }], leaveSaid: 'Before classes commence, all of it back less the $300 deposit; in the first week, 75% as credit less the deposit; nothing after.', read: 'page', source: 'https://classes.stellaadler.com/workshops/acting-for-film-television-1/' } },
  { id: 'stella-adler-la-on-camera', cityId: 'us-ca-losangeles', kind: 'lesson', name: 'On-Camera Weekend Introductory Program', place: 'Art of Acting Studio', weekday: 6, hour: 12, minute: 0, minutes: 270, fee: { amount: 650, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 8, confirmed: true, provider: 'stella-adler-la', trains: 'screen', terms: { leave: [{ before: 1, fee: 300 }, { before: 2, credit: true, keepShare: 0.25, fee: 300 }], leaveSaid: 'Before classes commence, all of it back less the $300 deposit; in the first week, 75% as credit less the deposit; nothing after (the words read, the same for New York and Los Angeles).', read: 'page', source: 'https://artofactingstudio.com/workshops/oncameraweekendintroductoryprogram/' } },
  { id: 'lacc-acting-film-tv', cityId: 'us-ca-losangeles', kind: 'lesson', name: 'Acting For Film And TV', place: 'Los Angeles City College', weekday: 1, hour: 19, minute: 0, minutes: 180, fee: { amount: 169, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 6, confirmed: true, provider: 'lacc', trains: 'screen', terms: { leave: [{ before: 1, daysAhead: 4, business: true }], leaveSaid: 'Four business days before class, refunds and transfers stop.', read: 'page', source: 'https://coursehorse.com/los-angeles/classes/performing-arts/acting/film-acting/acting-for-film-tv-level-1' } },
  { id: 'actors-gym-film-tv', cityId: 'us-ct-newhaven', kind: 'lesson', name: 'Film And TV Class', place: 'Actors Gym Studio', weekday: 4, hour: 19, minute: 0, minutes: 150, fee: { amount: 289, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 6, confirmed: true, provider: 'actors-gym', trains: 'screen', terms: { leave: [{ before: 1, daysAhead: 8, fee: 25 }, { before: 1, keepShare: 0.25 }, { before: 2, keepShare: 0.5 }, { before: 3, keepShare: 0.75 }], leaveSaid: 'All of it less $25 eight or more days before; 75% within the week before; 50% within the week after the first class; 25% after the second; none after the third.', read: 'page', source: 'https://www.actorsgym.net/Film%20and%20TV.html' } },
  { id: 'city-lit-screen-acting', cityId: 'uk-eng-london', kind: 'lesson', name: 'Screen Acting: Improvers', place: 'City Lit', weekday: 3, hour: 18, minute: 0, minutes: 180, fee: { amount: 349, per: 'season', currency: 'GBP', taxIncluded: true }, seasonWeeks: 6, confirmed: true, provider: 'city-lit', trains: 'screen', terms: { leave: [{ before: 1, daysAhead: 14 }], leaveSaid: 'A full refund requested at least 14 calendar days before the course is due to start.', read: 'page', source: 'https://www.citylit.ac.uk/courses/screen-acting-improvers' } },
  { id: 'lir-screen-acting-1', cityId: 'ie-lei-dublin', kind: 'lesson', name: 'Screen Acting, Level 1', place: 'The Lir Academy', weekday: 1, hour: 19, minute: 0, minutes: 150, fee: { amount: 455, per: 'season', currency: 'EUR', taxIncluded: true }, seasonWeeks: 10, confirmed: true, provider: 'lir-academy', trains: 'screen', terms: { leave: [], leaveSaid: 'All short courses are non-refundable and non-transferable.', read: 'page', source: 'https://www.thelir.ie/courses/screen-acting-level-1' } },
  { id: 'gaiety-acting-for-camera-1', cityId: 'ie-lei-dublin', kind: 'lesson', name: 'Acting For Camera 1', place: 'The Gaiety School of Acting', weekday: 5, hour: 19, minute: 0, minutes: 180, fee: { amount: 430, per: 'season', currency: 'EUR', taxIncluded: true }, seasonWeeks: 8, confirmed: true, provider: 'gaiety', trains: 'screen', terms: { leave: [{ before: 1, daysAhead: 5, business: true }], leaveSaid: 'Course fees are only refundable if the cancellation is received at least 5 working days before the course begins.', read: 'page', source: 'https://gaietyschool.com/whatson-event/acting-for-camera-1-acting-skills/' } },
  { id: 'armstrong-on-camera', cityId: 'ca-on-toronto', kind: 'lesson', name: 'Introduction To On Camera Performance', place: 'Armstrong Acting Studios', weekday: 1, hour: 18, minute: 30, minutes: 180, fee: { amount: 549, per: 'season', currency: 'CAD', taxIncluded: false }, seasonWeeks: 6, confirmed: true, provider: 'armstrong', trains: 'screen', terms: { leave: [{ before: 1, daysAhead: 10, business: true, fee: 113 }], leaveSaid: 'Cancel 10 business days before the start for the tuition back less the $100 plus HST cancellation fee.', read: 'page', source: 'https://www.armstrongactingstudios.com/aas-toronto-in-studio-adult-classes' } },
  { id: 'evn-acting-level-1', cityId: 'ca-on-toronto', kind: 'lesson', name: 'Acting Level I', place: 'EVN Studios', weekday: 6, hour: 15, minute: 30, minutes: 170, fee: { amount: 475, per: 'season', currency: 'CAD', taxIncluded: false }, seasonWeeks: 6, confirmed: true, provider: 'evn', trains: 'screen', terms: { leave: [], leaveSaid: 'Its page published no refund terms: nothing comes back.', read: 'page', source: 'https://www.evnstudios.com/product/acting-level-i/' } },
  { id: 'railtown-acting-on-film', cityId: 'ca-bc-vancouver', kind: 'lesson', name: 'Acting On Film', place: 'Railtown Actors Studio', weekday: 0, hour: 12, minute: 0, minutes: 240, fee: { amount: 495, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 5, confirmed: true, provider: 'railtown', trains: 'screen', terms: { leave: [], leaveSaid: 'Its page published no refund terms: nothing comes back.', read: 'page', source: 'https://www.railtownactors.com/class-actingonfilmsundays' } },
  { id: 'shoreline-screen-acting', cityId: 'ca-bc-vancouver', kind: 'lesson', name: 'Screen Acting Essentials', place: 'Shoreline Studios', weekday: 2, hour: 18, minute: 30, minutes: 180, fee: { amount: 405, per: 'season', currency: 'CAD', taxIncluded: false }, seasonWeeks: 6, confirmed: true, provider: 'shoreline', trains: 'screen', terms: { leave: [], leaveSaid: 'Its page published no refund terms: nothing comes back.', read: 'page', source: 'https://www.shoreline-studios.com/vancouver-acting-classes/sae18/screen-acting-essentials' } },
  { id: 'casazul-camara-encendida', cityId: 'mx-cmx-mexicocity', kind: 'lesson', name: 'La Cámara Está Encendida', place: 'CasAzul', weekday: 3, hour: 16, minute: 0, minutes: 240, fee: { amount: 5900, per: 'season', currency: 'MXN', taxIncluded: true }, seasonWeeks: 4, confirmed: true, provider: 'casazul', trains: 'screen', terms: { leave: [], leaveSaid: 'Its page published no refund terms: nothing comes back.', read: 'page', source: 'https://www.casazul.edu.mx/lacamaraestaencendidajuega/' } },
];
