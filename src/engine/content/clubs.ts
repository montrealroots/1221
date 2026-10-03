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
 */

export type ClubKind = 'parkrun' | 'running' | 'league';

export interface Club {
  id: string; cityId: string; kind: ClubKind; name: string; place: string;
  /** 0 Sunday. */ weekday: number; hour: number; minute: number;
  /** A different start in some months, 1 to 12, both ends in. */ summer?: { from: number; to: number; hour: number; minute: number };
  minutes: number; met: number;
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
  { id: 'urban-rec-ubc-soccer', cityId: 'ca-bc-vancouver', kind: 'league', name: 'Urban Rec Soccer', place: 'UBC', weekday: 4, hour: 20, minute: 0, minutes: 60, met: 7.0, fee: { amount: 195, per: 'season', currency: 'CAD', taxIncluded: true }, seasonWeeks: 12, confirmed: true },
];
