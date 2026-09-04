/**
 * SLATE — the award record boards.
 *
 * Who has won the most, who has been nominated the most and never won, who won
 * youngest, who waited longest between one and the next. All of it counted
 * from the awards the public record links to the people on the roster.
 *
 * Two honesty rules run through this file. The counts are of what the record
 * links, which is not the same as a complete awards history — a body's older
 * years are thinly recorded and the boards say so rather than presenting a
 * partial count as a total. And the boards cover the roster, not everybody who
 * has ever won: they are the record for the people in this game.
 */

import { allPeople, awardsFor, personByQid, type PersonAward, type PersonRecord } from './people';
import { CRAFT_ROLE_LABEL, type CraftRole } from './craft-attributes';

/**
 * Awards that are not for anything on a screen.
 *
 * Somebody on the roster may be a champion athlete or a decorated musician
 * away from the camera, and the record holds those honours too. They are real
 * and they are theirs, but a board about the film and television industry that
 * ranks somebody first on the strength of an ESPY is not measuring anything
 * this game is about, so they are left out of the boards and said to be.
 */
const NOT_SCREEN = /espy|athlete|sportsman|sportswoman|laureus|olympic|all-star|mvp|most valuable player|nba |nfl |fifa|ballon d'or|hall of fame \(sport|world cup|championship performance|slam dunk|scoring title|rookie of the year|humanitarian award|philanthrop/i;

export const isScreenAward = (award: string): boolean => !NOT_SCREEN.test(award);

/** The bodies worth a board of their own, and how to spot one from an award's name. */
export const AWARD_BODIES: readonly { id: string; name: string; short: string; match: RegExp }[] = [
  { id: 'academy', name: 'The Academy Awards', short: 'Oscars', match: /academy award|oscar/i },
  { id: 'emmy', name: 'The Primetime Emmy Awards', short: 'Emmys', match: /emmy/i },
  { id: 'bafta', name: 'The BAFTA Awards', short: 'BAFTAs', match: /bafta|british academy/i },
  { id: 'globe', name: 'The Golden Globes', short: 'Globes', match: /golden globe/i },
  { id: 'grammy', name: 'The Grammy Awards', short: 'Grammys', match: /grammy/i },
  { id: 'sag', name: 'The Screen Actors Guild Awards', short: 'SAG', match: /screen actors guild/i },
  { id: 'guild', name: 'The Guild Awards', short: 'Guilds', match: /directors guild|producers guild|writers guild|american society of cinematographers/i },
  { id: 'festival', name: 'The Festival Prizes', short: 'Festivals', match: /palme d'or|golden lion|golden bear|grand prix|caméra d'or|silver bear|jury prize/i },
  { id: 'critics', name: 'The Critics Awards', short: 'Critics', match: /critics|national board|new york film critics|los angeles film critics/i },
  { id: 'spirit', name: 'The Independent Spirit Awards', short: 'Spirit', match: /independent spirit|gotham/i },
];

export const bodyOf = (award: string): string | undefined =>
  AWARD_BODIES.find((body) => body.match.test(award))?.id;

export interface AwardLeader {
  qid: string;
  name: string;
  roles: CraftRole[];
  value: number;
  /** What the number is made of, in words. */
  detail: string;
}

export interface AwardBoard {
  id: string;
  label: string;
  /** What the number means, so nobody has to guess. */
  explain: string;
  unit: 'count' | 'age' | 'years' | 'percent';
  leaders: AwardLeader[];
}

const yearOf = (award: PersonAward): number | undefined => (award.year && award.year > 1900 ? award.year : undefined);

function ageAt(person: PersonRecord, year: number): number | undefined {
  // Only a date the record is sure of. A year-only birth date is fine for
  // saying when somebody was born and useless for saying how old they were on
  // a given night, which is what produced a showrunner winning at twelve.
  if (!person.birth) return undefined;
  const born = Number(person.birth.slice(0, 4));
  if (!born) return undefined;
  const age = year - born;
  return age > 0 && age < 110 ? age : undefined;
}

function top(leaders: AwardLeader[], count = 10): AwardLeader[] {
  return leaders.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)).slice(0, count);
}

function bottom(leaders: AwardLeader[], count = 10): AwardLeader[] {
  return leaders.sort((a, b) => a.value - b.value || a.name.localeCompare(b.name)).slice(0, count);
}

/**
 * Every board, computed from the loaded people. Cheap enough to recompute
 * whenever the data changes, which is what the count in the key is for.
 */
let cache: { key: string; boards: AwardBoard[] } | undefined;

export function awardBoards(): AwardBoard[] {
  const people = allPeople();
  const key = `${people.length}`;
  if (cache && cache.key === key) return cache.boards;

  const wins: AwardLeader[] = [];
  const noms: AwardLeader[] = [];
  const dry: AwardLeader[] = [];
  const conversion: AwardLeader[] = [];
  const bestYear: AwardLeader[] = [];
  const youngest: AwardLeader[] = [];
  const oldest: AwardLeader[] = [];
  const span: AwardLeader[] = [];
  const gap: AwardLeader[] = [];
  const byBody = new Map<string, AwardLeader[]>();

  for (const person of people) {
    const awards = awardsFor(person.qid).filter((award) => isScreenAward(award.award));
    if (awards.length === 0) continue;
    const won = awards.filter((a) => a.outcome === 'won');
    const nominated = awards.filter((a) => a.outcome === 'nominated');

    const base = { qid: person.qid, name: person.name, roles: person.roles };
    if (won.length > 0) wins.push({ ...base, value: won.length, detail: `${won.length} won, ${nominated.length} nominated` });
    if (awards.length > 0) noms.push({ ...base, value: awards.length, detail: `${won.length} won of ${awards.length}` });
    if (won.length === 0 && nominated.length >= 3) {
      dry.push({ ...base, value: nominated.length, detail: `${nominated.length} nominations, none of them won` });
    }
    if (awards.length >= 8) {
      conversion.push({ ...base, value: Math.round((won.length / awards.length) * 100), detail: `${won.length} of ${awards.length}` });
    }

    // The best single year, and the ages at either end of a winning career.
    const perYear = new Map<number, number>();
    const winYears: number[] = [];
    for (const award of won) {
      const year = yearOf(award);
      if (year === undefined) continue;
      perYear.set(year, (perYear.get(year) ?? 0) + 1);
      winYears.push(year);
    }
    const best = [...perYear.entries()].sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] > 1) bestYear.push({ ...base, value: best[1], detail: `${best[1]} in ${best[0]}` });

    if (winYears.length > 0) {
      const first = Math.min(...winYears);
      const last = Math.max(...winYears);
      const youngAge = ageAt(person, first);
      const oldAge = ageAt(person, last);
      if (youngAge !== undefined) youngest.push({ ...base, value: youngAge, detail: `First win at ${youngAge}, in ${first}` });
      if (oldAge !== undefined) oldest.push({ ...base, value: oldAge, detail: `Latest win at ${oldAge}, in ${last}` });
      if (last > first) span.push({ ...base, value: last - first, detail: `${first} to ${last}` });
      const sorted = [...new Set(winYears)].sort((a, b) => a - b);
      let widest = 0;
      let where = '';
      for (let i = 1; i < sorted.length; i++) {
        const between = sorted[i]! - sorted[i - 1]!;
        if (between > widest) { widest = between; where = `${sorted[i - 1]} to ${sorted[i]}`; }
      }
      if (widest >= 5) gap.push({ ...base, value: widest, detail: `${widest} years, ${where}` });
    }

    for (const body of AWARD_BODIES) {
      const theirs = won.filter((a) => body.match.test(a.award));
      if (theirs.length === 0) continue;
      const list = byBody.get(body.id) ?? [];
      list.push({ ...base, value: theirs.length, detail: `${theirs.length} won` });
      byBody.set(body.id, list);
    }
  }

  const boards: AwardBoard[] = ([
    { id: 'wins', label: 'Most Awards Won', explain: 'Every award the record links to them, of any kind.', unit: 'count', leaders: top(wins) },
    { id: 'nominations', label: 'Most Nominated', explain: 'Wins and nominations together: how often they were in the running.', unit: 'count', leaders: top(noms) },
    { id: 'dry', label: 'Most Nominated Without Winning', explain: 'Nominated at least three times, and never once won.', unit: 'count', leaders: top(dry) },
    { id: 'conversion', label: 'Best Conversion', explain: 'The share of nominations that became wins, for anybody with eight or more.', unit: 'percent', leaders: top(conversion) },
    { id: 'year', label: 'Best Single Year', explain: 'The most won inside one calendar year.', unit: 'count', leaders: top(bestYear) },
    { id: 'youngest', label: 'Youngest First Win', explain: 'Their age in the year of their first win, where the record has a birthday.', unit: 'age', leaders: bottom(youngest) },
    { id: 'oldest', label: 'Latest Win By Age', explain: 'Their age in the year of their most recent win.', unit: 'age', leaders: top(oldest) },
    { id: 'span', label: 'Longest Winning Career', explain: 'From first win to latest.', unit: 'years', leaders: top(span) },
    { id: 'gap', label: 'Longest Wait Between Wins', explain: 'The widest gap between one win and the next.', unit: 'years', leaders: top(gap) },
    ...AWARD_BODIES.map((body) => ({
      id: `body-${body.id}`,
      label: `Most ${body.short}`,
      explain: `${body.name}, counted from what the record links.`,
      unit: 'count' as const,
      leaders: top(byBody.get(body.id) ?? []),
    })),
  ] as AwardBoard[]).filter((board) => board.leaders.length > 0);

  cache = { key, boards };
  return boards;
}

/** The titles the roster's awards were won for, most-decorated first. */
export function mostAwardedWorks(limit = 20): { title: string; wins: number; nominations: number; people: string[] }[] {
  const works = new Map<string, { title: string; wins: number; nominations: number; people: Set<string> }>();
  for (const person of allPeople()) {
    for (const award of awardsFor(person.qid)) {
      if (!award.forWork || !isScreenAward(award.award)) continue;
      const entry = works.get(award.forWork) ?? { title: award.forWork, wins: 0, nominations: 0, people: new Set<string>() };
      if (award.outcome === 'won') entry.wins++; else entry.nominations++;
      entry.people.add(person.name);
      works.set(award.forWork, entry);
    }
  }
  return [...works.values()]
    .sort((a, b) => b.wins - a.wins || b.nominations - a.nominations)
    .slice(0, limit)
    .map((entry) => ({ title: entry.title, wins: entry.wins, nominations: entry.nominations, people: [...entry.people].slice(0, 6) }));
}

/** How much of an award board rests on how much record, so a screen can say. */
export function awardCoverage(): { people: number; withAwards: number; awards: number; won: number; dated: number } {
  let withAwards = 0;
  let awards = 0;
  let won = 0;
  let dated = 0;
  for (const person of allPeople()) {
    const theirs = awardsFor(person.qid).filter((award) => isScreenAward(award.award));
    if (theirs.length === 0) continue;
    withAwards++;
    awards += theirs.length;
    for (const award of theirs) {
      if (award.outcome === 'won') won++;
      if (yearOf(award) !== undefined) dated++;
    }
  }
  return { people: allPeople().length, withAwards, awards, won, dated };
}

/** One person's award standing, for their profile. */
export function standingOf(qid: string): { won: number; nominated: number; bodies: { name: string; won: number; nominated: number }[] } | undefined {
  const person = personByQid(qid);
  if (!person) return undefined;
  const awards = awardsFor(qid).filter((award) => isScreenAward(award.award));
  const bodies = AWARD_BODIES.map((body) => {
    const theirs = awards.filter((a) => body.match.test(a.award));
    return { name: body.short, won: theirs.filter((a) => a.outcome === 'won').length, nominated: theirs.filter((a) => a.outcome === 'nominated').length };
  }).filter((row) => row.won + row.nominated > 0);
  return {
    won: awards.filter((a) => a.outcome === 'won').length,
    nominated: awards.filter((a) => a.outcome === 'nominated').length,
    bodies,
  };
}

export { CRAFT_ROLE_LABEL };
