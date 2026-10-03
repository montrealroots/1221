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
 */

export type ClubKind = 'parkrun' | 'running' | 'league' | 'lesson';

export interface Club {
  id: string; cityId: string; kind: ClubKind; name: string; place: string;
  /** 0 Sunday. */ weekday: number; hour: number; minute: number;
  /** A different start in some months, 1 to 12, both ends in. */ summer?: { from: number; to: number; hour: number; minute: number };
  minutes: number; /** The Compendium's METs; none where none fits. */ met?: number;
  /** A season's fee, or a week's, in its money; none for a free club. */ fee?: { amount: number; per: 'season' | 'week'; currency: string; taxIncluded: boolean };
  seasonWeeks?: number;
  confirmed: boolean;
}

const RUN_MINUTES_5K = 31;

export const CLUBS: readonly Club[] = [
  { id: 'parkrun-brooklyn-bridge', cityId: 'us-ny-newyork', kind: 'parkrun', name: 'Brooklyn Bridge parkrun', place: 'Brooklyn Bridge Park', weekday: 6, hour: 9, minute: 0, summer: { from: 5, to: 10, hour: 8, minute: 0 }, minutes: RUN_MINUTES_5K, met: 9.3, confirmed: true },
  { id: 'parkrun-battersea', cityId: 'uk-eng-london', kind: 'parkrun', name: 'Battersea parkrun', place: 'Battersea Park', weekday: 6, hour: 9, minute: 0, minutes: RUN_MINUTES_5K, met: 9.3, confirmed: true },
  { id: 'parkrun-bushy', cityId: 'uk-eng-london', kind: 'parkrun', name: 'Bushy parkrun', place: 'Bushy Park, Teddington', weekday: 6, hour: 9, minute: 0, minutes: RUN_MINUTES_5K, met: 9.3, confirmed: true },
  { id: 'parkrun-fairview', cityId: 'ie-lei-dublin', kind: 'parkrun', name: 'Fairview parkrun', place: 'Fairview Park', weekday: 6, hour: 9, minute: 30, minutes: RUN_MINUTES_5K, met: 9.3, confirmed: true },
  { id: 'parkrun-budapest-park', cityId: 'ca-on-toronto', kind: 'parkrun', name: 'Budapest Park parkrun', place: 'Budapest Park', weekday: 6, hour: 9, minute: 0, summer: { from: 5, to: 9, hour: 8, minute: 0 }, minutes: RUN_MINUTES_5K, met: 9.3, confirmed: true },
  { id: 'parkrun-spanish-banks', cityId: 'ca-bc-vancouver', kind: 'parkrun', name: 'Spanish Banks Beach parkrun', place: 'Spanish Banks Beach', weekday: 6, hour: 9, minute: 0, minutes: RUN_MINUTES_5K, met: 9.3, confirmed: true },
  { id: 'nyrr-open-run-morningside', cityId: 'us-ny-newyork', kind: 'running', name: 'NYRR Open Run', place: 'Morningside Park', weekday: 6, hour: 9, minute: 0, minutes: 30, met: 9.3, confirmed: true },
  { id: 'los-feliz-running-club', cityId: 'us-ca-losangeles', kind: 'running', name: 'Los Feliz Running Club', place: 'Griffith Park', weekday: 0, hour: 8, minute: 0, minutes: 40, met: 9.3, confirmed: true },
  { id: 'parkdale-roadrunners', cityId: 'ca-on-toronto', kind: 'running', name: 'Parkdale Roadrunners', place: 'Brock Avenue', weekday: 2, hour: 19, minute: 0, minutes: RUN_MINUTES_5K, met: 9.3, confirmed: false },
  { id: 'vrc-flight-crew', cityId: 'ca-bc-vancouver', kind: 'running', name: 'Flight Crew Run Club', place: 'West 4th Avenue', weekday: 4, hour: 18, minute: 15, minutes: RUN_MINUTES_5K, met: 9.3, confirmed: true },
  { id: 'volo-ny-kickball', cityId: 'us-ny-newyork', kind: 'league', name: 'Volo Kickball', place: 'McCarren Park', weekday: 3, hour: 18, minute: 30, minutes: 60, met: 7.0, fee: { amount: 135, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 6, confirmed: true },
  { id: 'volo-la-kickball', cityId: 'us-ca-losangeles', kind: 'league', name: 'Volo Kickball', place: 'Immaculate Heart High School', weekday: 1, hour: 19, minute: 15, minutes: 60, met: 7.0, fee: { amount: 84.66, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 8, confirmed: true },
  { id: 'go-mammoth-netball', cityId: 'uk-eng-london', kind: 'league', name: 'GO Mammoth Netball', place: 'Park Sports Hyde Park', weekday: 1, hour: 19, minute: 0, minutes: 60, met: 7.0, fee: { amount: 11.1, per: 'week', currency: 'GBP', taxIncluded: true }, seasonWeeks: 8, confirmed: true },
  { id: 'firmballs-spawell-fives', cityId: 'ie-lei-dublin', kind: 'league', name: 'FirmBalls Five-A-Side', place: 'Spawell Powerleague', weekday: 3, hour: 18, minute: 30, minutes: 54, met: 7.0, fee: { amount: 60 / 5, per: 'week', currency: 'EUR', taxIncluded: true }, confirmed: true },
  { id: 'new-haven-pickleball', cityId: 'us-ct-newhaven', kind: 'league', name: 'New Haven Pickleball League', place: 'Wilbur Cross High School', weekday: 2, hour: 17, minute: 30, minutes: 60, met: 4.1, fee: { amount: 30, per: 'week', currency: 'USD', taxIncluded: true }, seasonWeeks: 9, confirmed: true },
  { id: 'pumas7-futbol7', cityId: 'mx-cmx-mexicocity', kind: 'league', name: 'Pumas7 Fútbol 7', place: 'Pumas7', weekday: 6, hour: 9, minute: 0, minutes: 60, met: 7.0, fee: { amount: 1_100, per: 'season', currency: 'MXN', taxIncluded: true }, seasonWeeks: 12, confirmed: true },
  { id: 'go-mammoth-vauxhall-netball', cityId: 'uk-eng-london', kind: 'league', name: 'GO Mammoth Netball Vauxhall', place: 'Vauxhall', weekday: 2, hour: 18, minute: 0, minutes: 40, met: 7.0, fee: { amount: 10.6, per: 'week', currency: 'GBP', taxIncluded: true }, seasonWeeks: 8, confirmed: true },
  { id: 'ymca-cross-island-swim', cityId: 'us-ny-newyork', kind: 'lesson', name: 'Adult Swimming, Stage 1', place: 'Cross Island YMCA', weekday: 1, hour: 19, minute: 0, minutes: 45, met: 6.0, fee: { amount: 335, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 8, confirmed: true },
  { id: 'ymca-new-haven-swim', cityId: 'us-ct-newhaven', kind: 'lesson', name: 'Swimming Lessons', place: 'New Haven YMCA Youth Center', weekday: 5, hour: 16, minute: 30, minutes: 30, met: 6.0, fee: { amount: 210, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 7, confirmed: true },
  { id: 'trinity-sport-swim', cityId: 'ie-lei-dublin', kind: 'lesson', name: 'Adult Swimming', place: 'Trinity Sport', weekday: 2, hour: 17, minute: 40, minutes: 30, met: 6.0, fee: { amount: 90, per: 'season', currency: 'EUR', taxIncluded: true }, seasonWeeks: 6, confirmed: true },
  { id: 'toronto-st-lawrence-swim', cityId: 'ca-on-toronto', kind: 'lesson', name: 'Adult Swim 1', place: 'St. Lawrence Community Rec Center', weekday: 2, hour: 14, minute: 0, minutes: 60, met: 6.0, fee: { amount: 140.19, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 9, confirmed: true },
  { id: 'vancouver-kensington-swim', cityId: 'ca-bc-vancouver', kind: 'lesson', name: 'Adult And Teen Swimmer 1', place: 'Kensington Pool', weekday: 4, hour: 11, minute: 0, minutes: 40, met: 6.0, fee: { amount: 115.92 + 4.3, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 10, confirmed: true },
  { id: 'bulldog-tennis-clinic', cityId: 'us-ct-newhaven', kind: 'lesson', name: 'Adult Tennis Clinic', place: 'Bulldog Tennis Club', weekday: 3, hour: 18, minute: 0, minutes: 90, met: 6.8, fee: { amount: 200, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 4, confirmed: true },
  { id: 'better-islington-tennis', cityId: 'uk-eng-london', kind: 'lesson', name: 'Adult Tennis, Level 1', place: 'Islington Tennis Center', weekday: 1, hour: 19, minute: 0, minutes: 60, met: 6.8, fee: { amount: 79.9, per: 'season', currency: 'GBP', taxIncluded: true }, seasonWeeks: 4, confirmed: true },
  { id: 'trinity-sport-tennis', cityId: 'ie-lei-dublin', kind: 'lesson', name: 'Adult Tennis', place: 'Trinity Sport, Botany Bay', weekday: 4, hour: 17, minute: 15, minutes: 60, met: 6.8, fee: { amount: 100, per: 'season', currency: 'EUR', taxIncluded: true }, seasonWeeks: 6, confirmed: true },
  { id: 'west-point-grey-tennis', cityId: 'ca-bc-vancouver', kind: 'lesson', name: 'Adult Beginner Tennis', place: 'West Point Grey Community Center', weekday: 2, hour: 19, minute: 15, minutes: 60, met: 6.8, fee: { amount: 266, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 7, confirmed: true },
  { id: 'waltons-guitar', cityId: 'ie-lei-dublin', kind: 'lesson', name: 'Introducing Guitar For Adults', place: 'Waltons New School Of Music', weekday: 1, hour: 19, minute: 0, minutes: 60, met: 2.0, fee: { amount: 230, per: 'season', currency: 'EUR', taxIncluded: true }, seasonWeeks: 10, confirmed: true },
  { id: 'northwood-guitar', cityId: 'ca-on-toronto', kind: 'lesson', name: 'Music: Guitar', place: 'Northwood Community Center', weekday: 6, hour: 11, minute: 0, minutes: 60, met: 2.0, fee: { amount: 102.62, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 9, confirmed: true },
  { id: 'barnsdall-painting', cityId: 'us-ca-losangeles', kind: 'lesson', name: 'Black And White Acrylic Portraiture', place: 'Barnsdall Arts Center', weekday: 3, hour: 10, minute: 0, minutes: 180, fee: { amount: 96 + 30, per: 'season', currency: 'USD', taxIncluded: true }, seasonWeeks: 8, confirmed: true },
  { id: 'rouge-valley-cooking', cityId: 'ca-on-toronto', kind: 'lesson', name: 'Cooking', place: 'Rouge Valley Community Rec Center', weekday: 6, hour: 14, minute: 45, minutes: 120, met: 2.0, fee: { amount: 135.15, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 9, confirmed: true },
  { id: 'urban-rec-ubc-soccer', cityId: 'ca-bc-vancouver', kind: 'league', name: 'Urban Rec Soccer', place: 'UBC', weekday: 4, hour: 20, minute: 0, minutes: 60, met: 7.0, fee: { amount: 195, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 12, confirmed: true },
];
