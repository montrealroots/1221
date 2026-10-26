/**
 * SLATE — Productions And People, the industry reference (from 2026-10-25, the owner's brief 27, K8, Part 16 and loop 48:
 * "Player opens a project, person, company, season, or episode → sees verified information and clearly marked simulation
 * developments → follows relationships to related records → sees the player's involvement and relevant history → reaches
 * legitimate available actions where appropriate → returns without losing navigation context").
 *
 * Every page is read from what the game already holds, and says which kind each fact is:
 * - **verified**: a real production's, company's, agency's or person's field as its official page had it on the day this
 *   build read it (`content/catalog.ts`, `content/agencies.ts`, `content/agents.ts`), or a published chart's week
 *   (`content/charts.ts`); a field no page gave is **not given**, said with why, never filled in;
 * - **simulated**: the game's own inventions and what the clock has done with them (a fictional project, a series' seasons
 *   and their audience, a film's run in the game's own chart, a network's word);
 * - **yours**: the player's own record (a posting, a booking, a credit, an award entry, an agent's answer).
 *
 * What it holds, and doesn't: the real productions the catalog read; the game's projects the player has met (a part posted
 * to them, booked or credited), the series in play, their seasons and episodes; the companies, casting offices, agencies
 * and people those name; and the player. It doesn't claim to hold what another service lists. It never shows a part the
 * player hasn't been posted: a production's page names the player's own part, not who else it's casting, and a real
 * production's page names a part the game drew from it only once that part is posted to the player (loop 48: "Keep public
 * information separate from confidential casting access"). A release's fate, a season's audience, a network's word and a
 * chart's week show only once the clock has reached them. Its actions only open the tab where the player can act.
 *
 * The IMDb-style database brief 7 built (`world/database.ts`, 540 Wikidata titles and 2,663 people) was retired with the
 * scope of 2026-10-09 and isn't restored here: this holds the records the career already reads, and nothing it doesn't.
 */

import type { Instant } from '../core/time';
import { formatDate, instantFromZoned } from '../core/time';
import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { spokenList } from '../core/text';
import {
  CATALOG, COMPANIES, READ_ON, companyName, productionById,
  type CastCredit, type CompanyRole, type Field, type PersonCredit, type Production, type Scope,
} from '../content/catalog';
import { AGENCY_RECORDS, fieldWords, type AgencyRecord } from '../content/agencies';
import { AGENCIES, AGENTS, agencyById, agentById, type Agency, type Agent } from '../content/agents';
import { projectById, type ProjectTemplate } from '../content/careerwork';
import { FORMATS } from '../content/workflows';
import { CHARTS } from '../content/charts';
import { REAL_SERIES, episodeDays, seasonWindow, seriesById, type SeriesTemplate } from '../content/series';
import { REFERENCE, abroadSoFar, figureWords, peakOf, titleAcross, totalsOf, weekEnd, weekWords, weeksSoFar } from './charts';
import { routeWords } from './market';
import { pilotSeries } from './continuity';
import { kindPhrase, projectGenresOf } from './projobs';
import { requirementWords } from './engagement';
import { activeAgreement, honorsOf, type Engagement, type Opportunity, type ProCredit, type ProEvent } from './pro';
import { STAGE_LABEL } from './proagent';
import { recapWords, festivalWords } from './awards';
import { actorRecapWords } from './actorawards';
import { clauseOf } from './contracts';
import { audienceWords, decisionWords, decisionsTo, networkOf, ordinal, productionEnds, seasonAudience, seasonMade, seasonName, seriesInPlay, simulatedSeason } from './series';

// ---------------------------------------------------------------------------------------------------------------------
// The shapes a page is drawn from
// ---------------------------------------------------------------------------------------------------------------------

export type RefKind = 'production' | 'project' | 'series' | 'season' | 'episode' | 'company' | 'person';

/**
 * A page's address. A production is the catalog's id; a project the game's production key (`projectKey`); a series its
 * id, with the year a season began and an episode's number; a company `catalog:`, `company:`, `casting:` or `agency:`
 * and its id or name; a person `real:` and a name, `agent:` and an id, or `you`.
 */
export interface RefKey { kind: RefKind; id: string; season?: number; episode?: number }

/** One string for a key, for comparing and for React's keys. */
export const refId = (k: RefKey): string => [k.kind, k.id, k.season ?? '', k.episode ?? ''].join('|');

export type Known = 'verified' | 'not-given' | 'simulated' | 'yours';

/** How each kind of fact is tagged where it's shown. */
export const KNOWN_LABEL: Readonly<Record<Known, string>> = { verified: 'Verified', 'not-given': 'Not Given', simulated: 'Simulated', yours: 'Yours' };

/** One fact: its label, its words, how it's known, and the page it opens, where it opens one. */
export interface RefFact { label: string; words: string; known: Known; to?: RefKey }
export interface RefSection { title: string; facts: RefFact[] }

/** The Career screen's tabs an action can open. */
export type CareerTab = 'opportunities' | 'work' | 'industry' | 'representation' | 'portfolio';
export interface RefAction { label: string; tab: CareerTab; words: string }

export interface RefPage { key: RefKey; title: string; known: Known; what: string; sections: RefSection[]; actions: RefAction[] }

/** An entry in the front page's lists and in Find. */
export interface RefEntry { key: RefKey; words: string; known: Known; note: string }

const ACTION: Readonly<Record<CareerTab, string>> = {
  opportunities: 'Open Opportunities', work: 'Open Work', industry: 'Open Charts And Awards', representation: 'Open Representation', portfolio: 'Open Portfolio',
};
const act = (tab: CareerTab, words: string): RefAction => ({ label: ACTION[tab], tab, words });
const fact = (label: string, words: string, known: Known, to?: RefKey): RefFact => ({ label, words, known, ...(to ? { to } : {}) });
const cap = (x: string): string => `${x.charAt(0).toUpperCase()}${x.slice(1)}`;
/** A phrase as a title: every word capitalised ("The Season Beginning In 2027"). */
const titleWords = (x: string): string => x.split(' ').map(cap).join(' ');
const readOn = (): string => { const [y, m, d] = READ_ON.split('-').map(Number); return formatDate(Date.UTC(y!, m! - 1, d!, 12), 'UTC'); };
const dated = (sim: Simulation, at: Instant): string => formatDate(at, sim.zone);

/** A catalog field as a fact: its value, verified; what no page gave, not given, with why. */
function fieldFact<T>(label: string, f: Field<T>, say: (v: T) => string): RefFact {
  if (f.kind === 'unknown') return fact(label, f.why, 'not-given');
  if (f.kind === 'assumption') return fact(label, `${say(f.value)}. ${f.why}`, 'simulated');
  if (f.kind === 'conflict') return fact(label, `${say(f.value)}. ${f.why}`, 'verified');
  return fact(label, say(f.value), 'verified');
}

// ---------------------------------------------------------------------------------------------------------------------
// What the player has met
// ---------------------------------------------------------------------------------------------------------------------

/** The page a part's project is on: a real production's, for a part drawn from one; the game's production's otherwise. */
export function projectKey(t: ProjectTemplate): RefKey {
  return t.drawn ? { kind: 'production', id: t.drawn.production } : { kind: 'project', id: t.slate?.production ?? t.project };
}

/** The parts the player has met: each posted to them, booked or credited, once. Never a part only another actor was posted. */
export function metParts(person: Person): ProjectTemplate[] {
  const ids = new Set([...(person.pro?.opportunities ?? []).map((o) => o.projectId), ...(person.pro?.engagements ?? []).map((e) => e.projectId)]);
  return [...ids].map((id) => projectById(id)).filter((t): t is ProjectTemplate => t !== undefined);
}

const partsOn = (person: Person, key: RefKey): ProjectTemplate[] => metParts(person).filter((t) => refId(projectKey(t)) === refId(key));
const oppsOf = (person: Person, t: ProjectTemplate): Opportunity[] => (person.pro?.opportunities ?? []).filter((o) => o.projectId === t.id);
const engsOf = (person: Person, t: ProjectTemplate): Engagement[] => (person.pro?.engagements ?? []).filter((e) => e.projectId === t.id);
const creditOf = (person: Person, e: Engagement): ProCredit | undefined => (e.creditId ? person.pro?.credits.find((c) => c.id === e.creditId) : undefined);
const live = (e: Engagement): boolean => e.status !== 'finished' && e.status !== 'canceled';

/** The series the player can look up: the fixed ones, which are on the air for anyone, and the slate's the player met. */
const seriesHeld = (sim: Simulation): SeriesTemplate[] => seriesInPlay(sim);

// ---------------------------------------------------------------------------------------------------------------------
// The player's part, as the player's own record has it
// ---------------------------------------------------------------------------------------------------------------------

const OPPORTUNITY_WORDS: Readonly<Record<Opportunity['status'], string>> = {
  open: 'Posted to you', submitted: 'You submitted', audition: 'Auditioning', callback: 'Called back', offered: 'Offered to you',
  booked: 'You booked it', passed: 'Casting chose another actor', declined: 'You declined it', lapsed: 'It lapsed', withdrawn: 'Withdrawn', refused: 'Refused',
};
const ENGAGEMENT_WORDS: Readonly<Record<Engagement['status'], string>> = {
  booked: 'Booked', preparing: 'Preparing', working: 'Working', finished: 'Finished', canceled: 'Called off',
};

/** Whether the player has been told a credit's release is shelved or held back: its engagement's own history says so. */
const toldOf = (e: Engagement, key: 'release:late' | 'release:shelved'): ProEvent | undefined => e.history.find((x) => x.key === key);

/** Where a credit stands, as far as the player has been told. */
export function creditWords(sim: Simulation, person: Person, c: ProCredit): string {
  if (c.status === 'performed') return `Performed, ${c.year}`;
  // Its way out, where it had another (from 2026-10-25, brief 27, `routeWords`), and the network that picked its series up.
  const route = c.release?.kind === 'limited' || c.release?.kind === 'territory' || (c.release?.kind === 'distributor' && c.release.told) ? ` ${routeWords(c)}` : '';
  const network = c.network ? ` Seen on ${c.network}, which picked the series up.` : '';
  if (c.status === 'released' && c.releasedAt !== undefined) return route || network ? `Released on ${dated(sim, c.releasedAt)}.${route}${network}` : `Released on ${dated(sim, c.releasedAt)}`;
  const e = c.engagementId ? person.pro?.engagements.find((x) => x.id === c.engagementId) : undefined;
  // A pilot its network passed on (from 2026-10-25, brief 27, Part 8): never aired.
  if (e?.pilot && !e.pilot.picked) return 'Shot, and its network passed on the pilot: it won’t air';
  if (e && toldOf(e, 'release:shelved')) return 'Shot, and shelved by its distributor: it won’t be released';
  if (e && toldOf(e, 'release:late')) return 'Shot, and held back by its distributor';
  if (e && e.history.some((x) => x.key === 'release:distributor')) return `Shot, and taken over by ${c.release?.distributor ?? 'another distributor'}, which moved its release`;
  if (c.status === 'unreleased') return 'Never released';
  return 'Shot, not yet released';
}

/** The player's part in a project: what it is, where the posting went, the work and the credit. */
function yourPart(sim: Simulation, person: Person, t: ProjectTemplate): RefFact[] {
  const out: RefFact[] = [fact(t.role.part, t.role.about, 'yours')];
  for (const o of oppsOf(person, t)) {
    const open = o.status === 'open' && sim.now < o.submitBy;
    out.push(fact('The Posting', o.outcome && o.status !== 'open' ? o.outcome : `${OPPORTUNITY_WORDS[o.status]}${open ? `, open until ${dated(sim, o.submitBy)}` : ''}.`, 'yours'));
  }
  for (const e of engsOf(person, t)) {
    const first = e.days[0], last = e.days.at(-1);
    out.push(fact('The Work', `${ENGAGEMENT_WORDS[e.status]}${first && last ? `, ${dated(sim, first.from)}${last.from !== first.from ? ` to ${dated(sim, last.from)}` : ''}` : ''}`, 'yours'));
    const c = creditOf(person, e);
    if (c) out.push(fact('The Credit', creditWords(sim, person, c), 'yours'));
  }
  return out;
}

/** What happened, oldest first: the posting's and the work's own history, as the player was told it. */
function historyOf(sim: Simulation, person: Person, parts: readonly ProjectTemplate[]): RefFact[] {
  const all = parts.flatMap((t) => [...oppsOf(person, t).flatMap((o) => o.history), ...engsOf(person, t).flatMap((e) => e.history)]);
  // The posting and the work each keep the booking, in the same words: said once.
  const seen = new Set<string>();
  return all.sort((a, b) => a.at - b.at).filter((x) => !seen.has(x.words) && !!seen.add(x.words)).map((x) => fact(dated(sim, x.at), x.words, 'yours'));
}

/** A credit's run in the game's own chart, to the clock. */
function runFacts(sim: Simulation, person: Person, parts: readonly ProjectTemplate[]): RefFact[] {
  const out: RefFact[] = [];
  for (const t of parts) for (const e of engsOf(person, t)) {
    const c = creditOf(person, e);
    // A film released abroad first shows from its first week abroad (from the review of 2026-10-25), not its first at home.
    const abroad = c?.run ? abroadSoFar(c.run, sim.now) : [];
    if (!c?.run || (!weeksSoFar(c.run, sim.now).length && !abroad.length)) continue;
    const weeks = weeksSoFar(c.run, sim.now);
    const peak = peakOf(c.run, sim.now);
    const gross = weeks.reduce((s, w) => s + w.gross, 0);
    if (!weeks.length) out.push(fact('In Cinemas', `Opened in ${c.release?.first ?? 'other countries'} on ${dated(sim, abroad[0]!.from)}, and opens in the US on ${dated(sim, c.run.opening)}: ${abroad.length === 1 ? 'one week' : `${abroad.length} weeks`} abroad so far.`, 'simulated'));
    else out.push(fact('In Cinemas', `Opened ${dated(sim, c.run.opening)}. ${weeks.length === 1 ? 'One week' : `${weeks.length} weeks`} so far, about $${Math.round(gross).toLocaleString('en-US')} in all; ${peak !== undefined ? `its best week No. ${peak} in the game’s own chart` : 'never in the game’s own Top 10'}.`, 'simulated'));
    // Its totals, each in the run's currency, and its reception (from 2026-10-25, brief 27, Part 12), each the game's.
    const totals = totalsOf(c.run, sim.now);
    const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
    if (totals.worldwide !== undefined) out.push(fact('Box Office', `${usd(totals.domestic)} in the US, ${usd(totals.international!)} abroad, ${usd(totals.worldwide)} worldwide, all in US dollars, the game’s estimates.`, 'simulated'));
    if (c.run.response) out.push(fact('Reception', `Critics ${c.run.response.critics} of 100, audiences ${c.run.response.audience} of 100, the game’s estimates.`, 'simulated'));
  }
  return out;
}

/**
 * A project's release, where it went another way than on time (from 2026-10-25, brief 27; `routeWords`), and a pilot's word
 * once the clock has reached it, picked up with its series' page or passed on (Part 8): each the game's.
 */
function releaseFacts(sim: Simulation, person: Person, parts: readonly ProjectTemplate[]): RefFact[] {
  const out: RefFact[] = [];
  const pilot = parts.find((t) => t.pilot);
  if (pilot && pilot.pilot) {
    const e = engsOf(person, pilot).find((x) => x.pilot);
    const s = pilotSeries(pilot);
    const held = seriesHeld(sim).some((x) => x.id === s.id);
    out.push(e?.pilot
      ? fact('The Pilot', e.pilot.picked ? `${pilot.pilot.network} picked it up to series on ${dated(sim, e.pilot.at)}.` : `${pilot.pilot.network} passed on it on ${dated(sim, e.pilot.at)}, so it won’t air.`, 'simulated', e.pilot.picked && held ? { kind: 'series', id: s.id } : undefined)
      : fact('The Pilot', `A pilot for ${pilot.pilot.network}, a network invented for the game, which picks it up to series or passes on it on ${dated(sim, pilot.pilot.decideAt)}.`, 'simulated'));
  }
  for (const t of parts) for (const e of engsOf(person, t)) {
    const c = creditOf(person, e);
    const words = c && (c.release?.kind !== 'distributor' || c.release.told) ? routeWords(c) : undefined;
    if (words) out.push(fact('Release', words, 'simulated'));
  }
  return out;
}

/** Each award entry and festival entry of a project's credits, in the words the Charts And Awards tab uses. */
function honorFacts(person: Person, parts: readonly ProjectTemplate[]): RefFact[] {
  const ids = new Set(parts.flatMap((t) => engsOf(person, t)).map((e) => e.creditId).filter((x): x is string => !!x));
  return [
    ...(person.pro?.awards ?? []).filter((a) => ids.has(a.creditId)).map((a) => fact('The Emmy Awards', recapWords(person, a), 'yours')),
    ...(person.pro?.guild ?? []).filter((g) => ids.has(g.creditId)).map((g) => fact('The Actor Awards', actorRecapWords(person, g), 'yours')),
    ...(person.pro?.festivals ?? []).filter((f) => ids.has(f.creditId)).map((f) => fact('Sundance', festivalWords(person, f), 'yours')),
  ];
}

/** The tabs the player can act on from a project's page: only where there's something to do there. */
function actionsFor(sim: Simulation, person: Person, parts: readonly ProjectTemplate[]): RefAction[] {
  const out: RefAction[] = [];
  const opps = parts.flatMap((t) => oppsOf(person, t));
  const engs = parts.flatMap((t) => engsOf(person, t));
  if (opps.some((o) => (o.status === 'open' && sim.now < o.submitBy) || ['submitted', 'audition', 'callback', 'offered'].includes(o.status))) {
    out.push(act('opportunities', 'The posting is still in play: submit, audition or answer the offer on the Opportunities tab.'));
  }
  if (engs.some(live)) out.push(act('work', 'The work is booked: its days, its pay and its preparation are on the Work tab.'));
  const credits = engs.map((e) => creditOf(person, e)).filter((c): c is ProCredit => !!c);
  if (credits.some((c) => c.medium !== 'stage')) out.push(act('industry', 'Its awards and festivals, and where to enter or go, are on the Charts And Awards tab.'));
  if (credits.some((c) => c.status === 'released')) out.push(act('portfolio', 'It’s out, so its footage can go on your reel, or your voice demo, on the Portfolio tab.'));
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// A real production, as its official pages had it
// ---------------------------------------------------------------------------------------------------------------------

const ROLE_LABEL: Readonly<Record<CompanyRole, string>> = {
  producer: 'Producer', 'in-association': 'In Association', broadcaster: 'Broadcaster', 'streaming-platform': 'Streaming On',
  distributor: 'Distributor', 'studio-label': 'Label', 'production-company': 'Production Company',
};
const MADE_LABEL: Readonly<Record<PersonCredit['role'], string>> = { creator: 'Creator', showrunner: 'Showrunner', director: 'Director', writer: 'Writer', producer: 'Producer' };
const scopeWords = (s: Scope): string => (s.kind === 'season' ? `the ${ordinal(s.n)} season` : s.kind === 'film' ? 'the film' : 'the series');

/**
 * The catalog productions in a published chart, by the chart's title id. Box Office Mojo's Verity is the slate's: the
 * catalog dates it October 2, 2026, and the chart has it in its second week from October 9.
 */
export const CHARTED: Readonly<Record<string, string>> = { verity: 'verity' };

function productionPage(sim: Simulation, person: Person, p: Production): RefPage {
  const key: RefKey = { kind: 'production', id: p.id };
  // The production's kinds of story as its pages give them, taken as the work loop takes a project's
  // (`tests/cohesion.test.ts` holds that nothing but enjoyment reads a person's genres, by the property's name). Until
  // brief 27's F this read it by name, and K8's clean-clone gate failed there.
  const { genres: kinds } = p;
  const pages: RefFact[] = [
    fieldFact('Where It Stands', p.status, (v) => v),
    fieldFact('Genres', kinds, (v) => v),
    ...p.seasons.map((s) => {
      // What its pages give of the season, then what they don't, each said with why.
      const said = [
        s.episodes.kind === 'unknown' ? '' : `${String(s.episodes.value)} episodes`,
        s.premiere.kind === 'unknown' ? '' : `premiered ${String(s.premiere.value)}`,
        s.schedule.kind === 'unknown' ? '' : String(s.schedule.value),
      ].filter(Boolean);
      const missing = [s.episodes, s.premiere, s.schedule].flatMap((f) => (f.kind === 'unknown' ? [f.why] : []));
      return fact(`The ${cap(ordinal(s.n))} Season`, [said.length ? `${cap(said.join('; '))}.` : '', ...missing].filter(Boolean).join(' '), said.length ? 'verified' : 'not-given');
    }),
    fieldFact('Release', p.release, (v) => v),
    fieldFact('Language', p.languages, (v) => spokenList(v)),
    fieldFact('Running Time', p.runtime, (v) => v),
    fieldFact('Where It’s Filmed', p.filming, (v) => v),
    ...p.ratings.map((r) => fact(`Rating, ${r.territory}`, r.rating, 'verified')),
  ];
  const companies = p.companies.map((c) => fact(ROLE_LABEL[c.role], companyName(c.company), 'verified', { kind: 'company', id: `catalog:${c.company}` }));
  const made = p.people.map((x) => fact(MADE_LABEL[x.role], `${x.name}, for ${scopeWords(x.scope)}`, 'verified', { kind: 'person', id: `real:${x.name}` }));
  const cast = p.cast.map((c: CastCredit) => fact(c.performer, c.character.kind === 'unknown' ? `In the cast of ${scopeWords(c.scope)}. ${c.character.why}` : `As ${String(c.character.value)}, for ${scopeWords(c.scope)}`, c.character.kind === 'unknown' ? 'not-given' : 'verified', { kind: 'person', id: `real:${c.performer}` }));
  const charted = CHARTED[p.id];
  const charts = charted ? titleAcross(REFERENCE, charted).filter((x) => weekEnd(x.to) <= sim.now).map((x) => fact(`${CHARTS[x.chart].name}, ${weekWords(x)}`, `No. ${x.entry.rank} in ${CHARTS[x.chart].territory}: ${figureWords(x.chart, x.entry.value)}, as ${CHARTS[x.chart].provider} published it`, 'verified')) : [];
  const parts = partsOn(person, key);
  const game = parts.map((t) => fact(t.role.part, `The game’s own character, in ${t.drawn!.season}. It isn’t a real casting notice, and no one at the real production is casting it.`, 'simulated'));
  // The simulation's seasons after its baseline (from 2026-10-25, brief 27, Part 13, `REAL_SERIES`), each said as the game's.
  const continued = REAL_SERIES.find((x) => x.real?.production === p.id);
  const said = continued ? saidBy(sim, continued) : [];
  const continuation = continued ? [fact('Its Seasons In The Game', `${said.length ? decisionWords(sim, continued, said[said.length - 1]!) : `Every season after the one its pages had on the air is the game’s own continuation, and the first word on one comes on ${dated(sim, decisionsTo(sim, continued, continued.orderedThrough + 1)[0]?.at ?? sim.now)}.`} Open it for each season the game has simulated.`, 'simulated', { kind: 'series', id: continued.id })] : [];
  return {
    key, title: p.title, known: 'verified',
    what: `A real ${p.format}, as its official pages had it when the game read them on ${readOn()}. The game holds only what those pages say, and says where they don’t.`,
    sections: [
      { title: 'From Its Official Pages', facts: pages },
      { title: 'Companies', facts: companies },
      ...(made.length ? [{ title: 'Made By', facts: made }] : []),
      { title: 'Cast', facts: cast.length ? cast : [fact('None Named', 'The pages the game read name none of its cast.', 'not-given')] },
      ...(charted ? [{ title: 'Published Charts', facts: charts.length ? charts : [fact('Not Yet', 'No week of a published chart the game holds has ended with it in yet.', 'verified')] }] : []),
      ...(continuation.length ? [{ title: 'The Game’s Continuation', facts: continuation }] : []),
      ...(game.length ? [{ title: 'In The Game', facts: game }] : []),
      ...(parts.length ? [{ title: 'Your Part', facts: parts.flatMap((t) => yourPart(sim, person, t)) }, { title: 'What Happened', facts: historyOf(sim, person, parts) }] : []),
      ...(honorFacts(person, parts).length ? [{ title: 'Awards And Festivals', facts: honorFacts(person, parts) }] : []),
    ],
    actions: actionsFor(sim, person, parts),
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// One of the game's projects
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A company or casting office the game names, as against one it describes: a student film's "a graduate film program's
 * thesis production", cast by "the film's director", is no company of its own, so it has no page. Found by brief 27's F walk,
 * which opened such a page titled with the description.
 */
const named = (s: string): boolean => /^[A-Z0-9]/.test(s);
const companyKey = (name: string): RefKey | undefined => {
  const real = COMPANIES.find((c) => c.name === name);
  return real ? { kind: 'company', id: `catalog:${real.id}` } : named(name) ? { kind: 'company', id: `company:${name}` } : undefined;
};
/** A casting office the game names, with a page; the production's own, unnamed, has none. */
const castingKey = (t: ProjectTemplate): RefKey | undefined => (t.fictional && named(t.casting) ? { kind: 'company', id: `casting:${t.casting}` } : undefined);

function projectPage(sim: Simulation, person: Person, key: RefKey, parts: ProjectTemplate[]): RefPage {
  const t = parts[0]!;
  const genres = requirementWords(projectGenresOf(t));
  const facts: RefFact[] = [
    fact('Company', t.company, 'simulated', companyKey(t.company)),
    fact('Casting', t.casting, 'simulated', castingKey(t)),
    fact('How The Work Is Done', `${FORMATS[t.format].label}. ${FORMATS[t.format].words}`, 'simulated'),
    ...(genres ? [fact('Genres', genres, 'simulated')] : []),
    fact('Where', `${cap(t.place.venue)}, ${t.place.city}`, 'simulated'),
    fact('Agreement', t.contract, 'simulated'),
    ...(t.series && seriesById(t.series) ? [fact('Series', seriesById(t.series)!.title, 'simulated', { kind: 'series', id: t.series })] : []),
  ];
  const run = [...releaseFacts(sim, person, parts), ...runFacts(sim, person, parts)];
  const honors = honorFacts(person, parts);
  return {
    key, title: t.project, known: 'simulated',
    what: `${cap(kindPhrase(t))}: the project, its company and its casting office are invented for the game. Only your own part in it is shown here, never another actor’s.`,
    sections: [
      { title: 'The Project', facts },
      { title: parts.length > 1 ? 'Your Parts' : 'Your Part', facts: parts.flatMap((p) => yourPart(sim, person, p)) },
      ...(run.length ? [{ title: 'On Screen', facts: run }] : []),
      ...(honors.length ? [{ title: 'Awards And Festivals', facts: honors }] : []),
      { title: 'What Happened', facts: historyOf(sim, person, parts) },
    ],
    actions: actionsFor(sim, person, parts),
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// A series, its seasons and its episodes: the game's, to the clock
// ---------------------------------------------------------------------------------------------------------------------

/** The seasons of a series the player can know of: every one ordered, and after the order each the network has said yes to. */
export function seasonsKnown(sim: Simulation, s: SeriesTemplate): number[] {
  const said = decisionsTo(sim, s, new Date(sim.now).getUTCFullYear() + 1).filter((d) => d.at <= sim.now);
  const out: number[] = [];
  for (let y = s.firstSeason; y <= s.orderedThrough || said.some((d) => d.year === y); y += 1) if (y <= s.orderedThrough ? true : seasonMade(sim, s, y)) out.push(y);
  return out;
}

/**
 * A season's shoot, from its first day to its last, said as past, under way or to come; and, once the network's word has
 * stopped it early, to that day. Until brief 27's F walk of a long career's save, a season the network canceled in May
 * said it was shot to the end of its window, beside the word that stopped it a fortnight before.
 */
function shootWords(sim: Simulation, s: SeriesTemplate, year: number): string {
  const w = seasonWindow(s, year);
  const ends = productionEnds(sim, s, year);
  if (ends < w.to && ends <= sim.now) return `shot from ${dated(sim, w.from)} to ${dated(sim, ends)}, when the network ended it`;
  const last = instantFromZoned({ year: year + 1, month: s.season.to[0], day: s.season.to[1], hour: 12, minute: 0 }, 'America/New_York');
  const span = `${dated(sim, w.from)} to ${dated(sim, last)}`;
  return w.to <= sim.now ? `shot from ${span}` : w.from <= sim.now ? `shooting from ${span}` : `to shoot from ${span}`;
}

const saidBy = (sim: Simulation, s: SeriesTemplate) => decisionsTo(sim, s, new Date(sim.now).getUTCFullYear() + 1).filter((d) => d.at <= sim.now);
const seriesEngagements = (person: Person, s: SeriesTemplate, year?: number): Engagement[] => (person.pro?.engagements ?? []).filter((e) => projectById(e.projectId)?.series === s.id && (year === undefined || e.contract?.series?.year === year));

function seriesPage(sim: Simulation, person: Person, s: SeriesTemplate): RefPage {
  const key: RefKey = { kind: 'series', id: s.id };
  // A real series' baseline season is its pages', the seasons after it the simulation's (from 2026-10-25, brief 27).
  const seasons = seasonsKnown(sim, s).map((y) => {
    if (!simulatedSeason(s, y)) return fact(titleWords(seasonName(sim, s, y)), `On the air when the game read its pages on ${readOn()}. The game simulates only the seasons after it.`, 'verified', s.real ? { kind: 'production', id: s.real.production } : undefined);
    return fact(`${titleWords(seasonName(sim, s, y))}${s.real ? ' (Simulated)' : ''}`, `${y <= s.orderedThrough ? 'Ordered' : 'Renewed'}; ${shootWords(sim, s, y)}, ${s.episodes} episodes${s.real ? ', the game’s own count' : ''}`, 'simulated', { kind: 'season', id: s.id, season: y });
  });
  const word = saidBy(sim, s).map((d) => fact(dated(sim, d.at), decisionWords(sim, s, d), 'simulated'));
  const yours = seriesEngagements(person, s).map((e) => { const t = projectById(e.projectId)!; return fact(t.role.part, `${ENGAGEMENT_WORDS[e.status]}${e.contract?.series ? `, in ${seasonName(sim, s, e.contract.series.year).replace(/^the /, 'its ')}` : ''}`, 'yours', projectKey(t)); });
  // The network it's seen on now, where another picked it up after its cancellation (from 2026-10-25, `PICKUP`).
  const net = networkOf(sim, s, new Date(sim.now).getUTCFullYear());
  const picked = net.since !== undefined && decisionsTo(sim, s, net.since).some((d) => d.year === net.since && d.at <= sim.now) ? [fact('Seen On', `${net.name}, invented for the game, which picked it up for the season beginning in ${net.since}`, 'simulated')] : [];
  const company = s.real ? fact('Company', s.company, 'verified', companyKey(s.company)) : fact('Company', s.company, 'simulated', companyKey(s.company));
  return {
    key, title: s.title, known: 'simulated',
    what: s.real ? `A real series, as its official pages had it on ${readOn()}: the season on the air then is the pages’, and every season after it is the game’s simulation, never an announcement. ${s.words}` : `A fictional ${s.program === 'hour' ? 'hour-long' : 'half-hour'} series by ${s.company}, invented for the game, with every season and audience the game’s. ${s.words}`,
    sections: [
      { title: 'The Series', facts: s.real ? [company, fact('Its Official Pages', `Productions The Game Read has ${s.title} as its pages had it.`, 'verified', { kind: 'production', id: s.real.production }), ...picked] : [company, fact('First Season', String(s.firstSeason), 'simulated'), fact('Ordered Through', `The season beginning in ${s.orderedThrough}`, 'simulated'), ...picked] },
      { title: 'Seasons', facts: seasons },
      ...(word.length ? [{ title: 'The Network’s Word', facts: word }] : []),
      ...(yours.length ? [{ title: 'Your Work In It', facts: yours }] : []),
    ],
    actions: seriesEngagements(person, s).some(live) ? [act('work', 'Your work in it is booked: its days and pay are on the Work tab.')] : [],
  };
}

function seasonPage(sim: Simulation, person: Person, s: SeriesTemplate, year: number): RefPage {
  const key: RefKey = { kind: 'season', id: s.id, season: year };
  const w = seasonWindow(s, year);
  const after = saidBy(sim, s).find((d) => d.year === year + 1);
  const finished = w.to <= sim.now;
  const audience = finished ? seasonAudience(sim, s, year) : undefined;
  const facts: RefFact[] = [
    fact('Series', s.title, 'simulated', { kind: 'series', id: s.id }),
    fact('The Shoot', cap(shootWords(sim, s, year)), 'simulated'),
    fact('Episodes', String(s.episodes), 'simulated'),
    fact('Audience', audience ? `${cap(audienceWords(audience))}; critics ${audience.critics} of 100` : 'Not measured until the season has finished.', 'simulated'),
    ...(after ? [fact('The Network’s Word After It', decisionWords(sim, s, after), 'simulated')] : []),
  ];
  const episodes = Array.from({ length: s.episodes }, (_, k) => k + 1).map((e) => fact(`Episode ${e}`, `First shot on ${dated(sim, episodeDays(s, year, e)[0]!)}`, 'simulated', { kind: 'episode', id: s.id, season: year, episode: e }));
  const yours = seriesEngagements(person, s, year).map((e) => fact(projectById(e.projectId)!.role.part, episodesWords(e, s, year), 'yours', projectKey(projectById(e.projectId)!)));
  // Its network, where another picked the series up (from 2026-10-25, `PICKUP`).
  const net = networkOf(sim, s, year);
  if (net.since !== undefined) facts.splice(1, 0, fact('Seen On', `${net.name}, invented for the game`, 'simulated'));
  return {
    key, title: `${s.title}: ${titleWords(seasonName(sim, s, year))}`, known: 'simulated',
    what: `The season beginning in ${year}, on the game’s schedule. Its audience and reviews are the game’s simulation, never a published figure.${s.real ? ` ${s.title} is a real series, and this season is the game’s own continuation of it, not an announcement.` : ''}`,
    sections: [{ title: 'The Season', facts }, { title: 'Episodes', facts: episodes }, ...(yours.length ? [{ title: 'Your Episodes', facts: yours }] : [])],
    actions: [],
  };
}

/** A part's episodes in its season: a recurring part's as its contract has them, another's those its work days fall on. */
function episodesWords(e: Engagement, s: SeriesTemplate, year: number): string {
  const c = clauseOf(e.contract, 'episodes');
  if (!c) {
    const on = Array.from({ length: s.episodes }, (_, k) => k + 1).filter((n) => inEpisode(e, s, year, n));
    return `${ENGAGEMENT_WORDS[e.status]}: ${on.length ? `episode${on.length === 1 ? '' : 's'} ${spokenList(on.map(String))}` : 'no episode’s shoot holds its days'}`;
  }
  const called = c.further.filter((f) => f.status === 'called').map((f) => f.n);
  return `Guaranteed episode${c.numbers.length === 1 ? '' : 's'} ${spokenList(c.numbers.map(String))}${called.length ? `; called for ${spokenList(called.map(String))}` : ''}`;
}

/** Whether a part was in an episode, by its contract or by its days. */
function inEpisode(e: Engagement, s: SeriesTemplate, year: number, n: number): string | undefined {
  const c = clauseOf(e.contract, 'episodes');
  if (c?.numbers.includes(n)) return 'In it: one of your guaranteed episodes.';
  const f = c?.further.find((x) => x.n === n);
  if (f?.status === 'called') return 'In it: the production called you for it.';
  if (f?.status === 'not-called') return 'Not in it: the production didn’t call you for it.';
  if (f?.status === 'off') return 'Not in it: the series stopped before it.';
  if (f?.status === 'pending') return 'The production hasn’t said yet whether it needs you for it.';
  const days = episodeDays(s, year, n);
  const span = { from: days[0]!, to: days.at(-1)! + 86_400_000 };
  return e.days.some((d) => d.from >= span.from && d.from < span.to) ? 'In it: your work days fall on its shoot.' : undefined;
}

function episodePage(sim: Simulation, person: Person, s: SeriesTemplate, year: number, n: number): RefPage {
  const key: RefKey = { kind: 'episode', id: s.id, season: year, episode: n };
  const days = episodeDays(s, year, n);
  const ends = productionEnds(sim, s, year);
  const state = days[0]! > sim.now ? `Set to shoot from ${dated(sim, days[0]!)}.`
    : ends <= sim.now && days[0]! >= ends ? 'Never shot: the network ended the series before it.'
      : `Shot ${days.length === 1 ? `on ${dated(sim, days[0]!)}` : `over ${days.length === 2 ? 'two days' : `${days.length} days`} from ${dated(sim, days[0]!)}`}.`;
  const yours = seriesEngagements(person, s, year).map((e) => ({ e, w: inEpisode(e, s, year, n) })).filter((x) => x.w).map(({ e, w }) => fact(projectById(e.projectId)!.role.part, w!, 'yours', projectKey(projectById(e.projectId)!)));
  return {
    key, title: `${s.title}: Episode ${n}`, known: 'simulated',
    what: `Episode ${n} of the season beginning in ${year}, on the game’s schedule.`,
    sections: [
      { title: 'The Episode', facts: [fact('Season', cap(seasonName(sim, s, year)), 'simulated', { kind: 'season', id: s.id, season: year }), fact('Shoot', state, 'simulated')] },
      ...(yours.length ? [{ title: 'You In It', facts: yours }] : []),
    ],
    actions: [],
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Companies, casting offices and agencies
// ---------------------------------------------------------------------------------------------------------------------

function catalogCompanyPage(id: string): RefPage {
  const name = companyName(id);
  const facts = CATALOG.flatMap((p) => p.companies.filter((c) => c.company === id).map((c) => fact(ROLE_LABEL[c.role], p.title, 'verified', { kind: 'production', id: p.id })));
  return { key: { kind: 'company', id: `catalog:${id}` }, title: name, known: 'verified', what: `A real company, as the productions’ official pages credit it, read on ${readOn()}. Only those productions are here, never all its work.`, sections: [{ title: 'Credited On', facts }], actions: [] };
}

function gameCompanyPage(sim: Simulation, person: Person, name: string): RefPage {
  const parts = metParts(person).filter((t) => t.company === name && !t.drawn);
  const projects = [...new Map(parts.map((t) => [refId(projectKey(t)), t])).values()].map((t) => fact(t.project, `${cap(kindPhrase(t))}; your part in it, ${t.role.part}`, 'simulated', projectKey(t)));
  const series = seriesHeld(sim).filter((s) => s.company === name).map((s) => fact(s.title, `A fictional ${s.program === 'hour' ? 'hour-long' : 'half-hour'} series`, 'simulated', { kind: 'series', id: s.id }));
  return { key: { kind: 'company', id: `company:${name}` }, title: name, known: 'simulated', what: 'A company invented for the game. Only its work that has reached you, and its series on the air, are here.', sections: [{ title: 'Its Work You’ve Met', facts: [...projects, ...series] }], actions: [] };
}

function castingPage(sim: Simulation, person: Person, name: string): RefPage {
  const parts = metParts(person).filter((t) => t.fictional && t.casting === name);
  const projects = [...new Map(parts.map((t) => [refId(projectKey(t)), t])).values()].map((t) => fact(t.project, cap(kindPhrase(t)), 'simulated', projectKey(t)));
  const rounds = parts.flatMap((t) => oppsOf(person, t)).flatMap((o) => (o.rounds ?? []).filter((r) => r.status === 'done').map((r) => ({ o, r })));
  const seen = rounds.map(({ o, r }) => fact(dated(sim, r.at), `${r.round === 'audition' ? 'An audition' : r.round === 'callback' ? 'A callback' : r.round === 'chemistry' ? 'A chemistry read' : 'A screen test'} for ${projectById(o.projectId)!.role.part}${r.casting ? `: ${r.casting.yes ? 'it went your way' : 'it went to another actor'}` : ''}`, 'yours'));
  return {
    key: { kind: 'company', id: `casting:${name}` }, title: name, known: 'simulated',
    what: 'A casting office invented for the game. Only the projects it has posted to you are here, never its other casting.',
    sections: [{ title: 'Projects It Posted To You', facts: projects }, ...(seen.length ? [{ title: 'You Were Seen', facts: seen }] : [])],
    actions: [],
  };
}

/** A real agency's record by name, where the game read its pages. */
const recordOf = (name: string): AgencyRecord | undefined => AGENCY_RECORDS.find((r) => r.name === name);

function agencyPage(person: Person, id: string): RefPage | undefined {
  const a: Agency | undefined = agencyById(id);
  const record = a ? recordOf(a.name) : AGENCY_RECORDS.find((r) => r.id === id);
  if (!a && !record) return undefined;
  const name = a?.name ?? record!.name;
  const facts: RefFact[] = [];
  if (a) {
    // Its other departments too (from 2026-10-25, brief 27's review: until then the page gave only the legit department,
    // and listed the voice-over agent under it).
    facts.push(fact('Office', a.office.city, a.real ? 'verified' : 'simulated'), ...[a.department, ...(a.otherDepartments ?? [])].map((d) => fact('Department', `${d.called}, also called ${d.alsoCalled}`, a.real ? 'verified' : 'simulated')), fact('Submissions', a.policy.words, a.real ? 'verified' : 'simulated'));
  }
  if (record) {
    facts.push(fieldFact('About', record.about, (v) => v));
    record.offices.forEach((o) => facts.push(fact(o.city ? `Office, ${o.city}` : 'Office', fieldWords(o.route), o.route.kind === 'unknown' ? 'not-given' : 'verified')));
    facts.push(fact('In The Game', record.inGame, 'simulated'));
  }
  const agents = AGENTS.filter((g) => g.agencyId === a?.id && shownAgent(person, g)).map((g) => fact(g.name, g.role, g.real ? 'verified' : 'simulated', { kind: 'person', id: `agent:${g.id}` }));
  const yours = agents.map((f) => agentById(f.to!.id.slice(6))!).map((g) => ({ g, rel: person.pro?.relations[g.id] })).filter((x) => x.rel).map(({ g, rel }) => fact(g.name, STAGE_LABEL[rel!.stage], 'yours', { kind: 'person', id: `agent:${g.id}` }));
  const real = !!a?.real || (!a && !!record);
  return {
    key: { kind: 'company', id: `agency:${a?.id ?? record!.id}` }, title: name, known: real ? 'verified' : 'simulated',
    what: real ? 'A real talent agency, as its own pages had it when the game read them. Whatever happens between you and its agents here is the game’s invention.' : 'A talent agency invented for the game.',
    sections: [{ title: 'The Agency', facts }, ...(agents.length ? [{ title: 'Its Agents In The Game', facts: agents }] : []), ...(yours.length ? [{ title: 'Where You Stand', facts: yours }] : [])],
    actions: yours.length ? [act('representation', 'Your approaches and any agreement are on the Representation tab.')] : [],
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------------------------------------------------

/** An agent the player can look up: a real one, named on the office's own page, or the game's once the player has met them. */
const shownAgent = (person: Person, g: Agent): boolean => !!g.real || person.pro?.relations[g.id]?.noticeShownAt !== undefined || !!person.pro?.relations[g.id];

/** Every real person the catalog names, once. */
export function catalogPeople(): string[] {
  return [...new Set(CATALOG.flatMap((p) => [...p.cast.map((c) => c.performer), ...p.people.map((x) => x.name)]))];
}

function realPersonPage(name: string): RefPage | undefined {
  const credits = CATALOG.flatMap((p) => [
    ...p.cast.filter((c) => c.performer === name).map((c) => fact(p.title, c.character.kind === 'unknown' ? `In the cast of ${scopeWords(c.scope)}. ${c.character.why}` : `As ${String(c.character.value)}, for ${scopeWords(c.scope)}`, c.character.kind === 'unknown' ? 'not-given' : 'verified', { kind: 'production', id: p.id })),
    ...p.people.filter((x) => x.name === name).map((x) => fact(p.title, `${MADE_LABEL[x.role]}, for ${scopeWords(x.scope)}`, 'verified', { kind: 'production', id: p.id })),
  ]);
  if (!credits.length) return undefined;
  return {
    key: { kind: 'person', id: `real:${name}` }, title: name, known: 'verified',
    what: `A real person, named on the official pages the game read on ${readOn()}. Only what those pages say of their work is here, never all of it, and nothing between you and them happens in the game.`,
    sections: [{ title: 'Credits In The Pages Read', facts: credits }],
    actions: [],
  };
}

function agentPage(sim: Simulation, person: Person, id: string): RefPage | undefined {
  const g = agentById(id);
  if (!g || !shownAgent(person, g)) return undefined;
  const agency = agencyById(g.agencyId)!;
  const rel = person.pro?.relations[g.id];
  const facts = [fact('Role', g.role, g.real ? 'verified' : 'simulated'), fact('Agency', `${agency.name}, ${agency.office.city}`, agency.real ? 'verified' : 'simulated', { kind: 'company', id: `agency:${agency.id}` })];
  const history = (rel?.history ?? []).map((x) => fact(dated(sim, x.at), x.words, 'yours'));
  return {
    key: { kind: 'person', id: `agent:${g.id}` }, title: g.name, known: g.real ? 'verified' : 'simulated',
    what: g.real ? `A real theatrical agent, named on the office’s own page when the game read it. Whatever happens between you here is the game’s invention.` : 'An agent invented for the game.',
    sections: [{ title: 'The Agent', facts }, ...(rel ? [{ title: 'Where You Stand', facts: [fact('Now', STAGE_LABEL[rel.stage], 'yours'), ...history] }] : [])],
    actions: rel ? [act('representation', 'Your approach, and anything they’ve asked for, are on the Representation tab.')] : [],
  };
}

function youPage(sim: Simulation, person: Person): RefPage {
  const credits = (person.pro?.credits ?? []).map((c) => {
    const e = c.engagementId ? person.pro?.engagements.find((x) => x.id === c.engagementId) : undefined;
    const t = e ? projectById(e.projectId) : undefined;
    return fact(`${c.role}, ${c.project}`, creditWords(sim, person, c), 'yours', t ? projectKey(t) : undefined);
  });
  const honors = honorsOf(person).map((h) => fact('Recognition', h.line, 'yours'));
  const agreement = activeAgreement(person, sim.now);
  const agent = agreement ? agentById(agreement.agentId) : undefined;
  return {
    key: { kind: 'person', id: 'you' }, title: `${person.firstName} ${person.lastName}`, known: 'yours',
    what: 'You, as your own record has it: your professional credits, what they’ve been recognized for, and who represents you.',
    sections: [
      { title: 'Credits', facts: credits.length ? credits : [fact('None Yet', 'Your professional credits show here as you work.', 'yours')] },
      ...(honors.length ? [{ title: 'Recognition', facts: honors }] : []),
      { title: 'Representation', facts: [agent ? fact('Your Agent', agent.name, 'yours', { kind: 'person', id: `agent:${agent.id}` }) : fact('Your Agent', 'Nobody represents you.', 'yours')] },
    ],
    actions: [act('portfolio', 'Your résumé, headshots, reel and voice demo are on the Portfolio tab.')],
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Opening a page, and the front page's lists
// ---------------------------------------------------------------------------------------------------------------------

/** The page at a key, or nothing where the game holds none there for this player. */
export function pageOf(sim: Simulation, person: Person, key: RefKey): RefPage | undefined {
  if (key.kind === 'production') { const p = productionById(key.id); return p ? productionPage(sim, person, p) : undefined; }
  if (key.kind === 'project') { const parts = partsOn(person, key); return parts.length ? projectPage(sim, person, key, parts) : undefined; }
  const s = key.kind === 'series' || key.kind === 'season' || key.kind === 'episode' ? seriesHeld(sim).find((x) => x.id === key.id) : undefined;
  if (key.kind === 'series') return s ? seriesPage(sim, person, s) : undefined;
  // A real series' baseline season has no page of the game's: its pages are the catalog's (from 2026-10-25).
  if (key.kind === 'season') return s && key.season !== undefined && seasonsKnown(sim, s).includes(key.season) && simulatedSeason(s, key.season) ? seasonPage(sim, person, s, key.season) : undefined;
  if (key.kind === 'episode') return s && key.season !== undefined && key.episode !== undefined && key.episode >= 1 && key.episode <= s.episodes && seasonsKnown(sim, s).includes(key.season) && simulatedSeason(s, key.season) ? episodePage(sim, person, s, key.season, key.episode) : undefined;
  if (key.kind === 'company') {
    const [space, ...rest] = key.id.split(':');
    const id = rest.join(':');
    if (space === 'catalog') return COMPANIES.some((c) => c.id === id) ? catalogCompanyPage(id) : undefined;
    if (space === 'company') return named(id) && (metParts(person).some((t) => t.company === id && !t.drawn) || seriesHeld(sim).some((x) => x.company === id)) ? gameCompanyPage(sim, person, id) : undefined;
    if (space === 'casting') return named(id) && metParts(person).some((t) => t.fictional && t.casting === id) ? castingPage(sim, person, id) : undefined;
    if (space === 'agency') return agencyPage(person, id);
    return undefined;
  }
  if (key.id === 'you') return youPage(sim, person);
  if (key.id.startsWith('real:')) return realPersonPage(key.id.slice(5));
  if (key.id.startsWith('agent:')) return agentPage(sim, person, key.id.slice(6));
  return undefined;
}

/** The front page: the player's own work first, then the series, the productions the game read, companies and people. */
export function refIndex(sim: Simulation, person: Person): { title: string; entries: RefEntry[] }[] {
  const yours = [...new Map(metParts(person).map((t) => [refId(projectKey(t)), t])).values()].map((t): RefEntry => ({ key: projectKey(t), words: t.project, known: t.drawn ? 'verified' : 'simulated', note: `${t.role.part}: ${OPPORTUNITY_WORDS[oppsOf(person, t).at(-1)?.status ?? 'booked'].toLowerCase()}` }));
  // A real series continued by the simulation is listed with the productions the game read, its page linked from there.
  const series = seriesHeld(sim).filter((s) => !s.real).map((s): RefEntry => ({ key: { kind: 'series', id: s.id }, words: s.title, known: 'simulated', note: `A fictional series by ${s.company}` }));
  const productions = CATALOG.map((p): RefEntry => ({ key: { kind: 'production', id: p.id }, words: p.title, known: 'verified', note: `A real ${p.format}` }));
  const companies: RefEntry[] = [
    ...COMPANIES.map((c): RefEntry => ({ key: { kind: 'company', id: `catalog:${c.id}` }, words: c.name, known: 'verified', note: 'A real company' })),
    ...[...new Set([...metParts(person).filter((t) => !t.drawn).map((t) => t.company), ...seriesHeld(sim).map((s) => s.company)])].filter((n) => named(n) && !COMPANIES.some((c) => c.name === n)).map((n): RefEntry => ({ key: { kind: 'company', id: `company:${n}` }, words: n, known: 'simulated', note: 'A company invented for the game' })),
    ...[...new Set(metParts(person).filter((t) => t.fictional && named(t.casting)).map((t) => t.casting))].map((n): RefEntry => ({ key: { kind: 'company', id: `casting:${n}` }, words: n, known: 'simulated', note: 'A casting office invented for the game' })),
    ...AGENCIES.map((a): RefEntry => ({ key: { kind: 'company', id: `agency:${a.id}` }, words: a.name, known: a.real ? 'verified' : 'simulated', note: a.real ? 'A real talent agency' : 'A talent agency invented for the game' })),
    ...AGENCY_RECORDS.filter((r) => !AGENCIES.some((a) => a.name === r.name)).map((r): RefEntry => ({ key: { kind: 'company', id: `agency:${r.id}` }, words: r.name, known: 'verified', note: 'A real talent agency' })),
  ];
  const people: RefEntry[] = [
    { key: { kind: 'person', id: 'you' }, words: `${person.firstName} ${person.lastName}`, known: 'yours', note: 'You' },
    ...AGENTS.filter((g) => shownAgent(person, g)).map((g): RefEntry => ({ key: { kind: 'person', id: `agent:${g.id}` }, words: g.name, known: g.real ? 'verified' : 'simulated', note: `${g.role}, ${agencyById(g.agencyId)!.name}` })),
    ...catalogPeople().map((n): RefEntry => ({ key: { kind: 'person', id: `real:${n}` }, words: n, known: 'verified', note: 'Named on a production’s official pages' })),
  ];
  return [
    { title: 'Your Work', entries: yours },
    { title: 'Series', entries: series },
    { title: 'Productions The Game Read', entries: productions },
    { title: 'Companies And Agencies', entries: companies },
    { title: 'People', entries: people },
  ];
}

/** Every entry whose name holds what was typed, in the front page's order. */
export function refFind(sim: Simulation, person: Person, typed: string): RefEntry[] {
  const q = typed.trim().toLowerCase();
  if (!q) return [];
  return refIndex(sim, person).flatMap((g) => g.entries).filter((e) => e.words.toLowerCase().includes(q));
}
