/**
 * SLATE — ten companies of the film and television business, from
 * `docs/research/world/research-industry-companies.json` (retrieved
 * 2026-10-08), and SLATE's own words for the work it invents.
 *
 * **Why these ten.** Weighed on four things: whether a company itself
 * develops and makes scripted film and television, and how much; how far it
 * reaches (2025's box-office shares in the US and Canada and in the UK and
 * Ireland, and the last subscriber counts published); whether it orders work
 * from other producers; and how much it matters to an actor in New York, Los
 * Angeles or London. It's a selection for a game's world, not a ranking of
 * the business. Each counted once: NBCUniversal and Sky under Comcast; Warner
 * Bros. Discovery under Skydance, which bought it on 2026-10-06 (PBS NewsHour,
 * "Skydance-owned Paramount closed its $81 billion takeover of Warner Bros.
 * Discovery on Tuesday"); BBC Studios under the BBC. Sony Pictures, Amazon MGM
 * Studios and Apple's studio are the units rather than their parents, which
 * do far more besides. Left out, and why, in the research's `excluded`: A24,
 * Legendary, Banijay, Fremantle, Versant (spun off from Comcast on
 * 2026-01-02), Starz, Channel 4, Mediawan.
 *
 * **What a company does in SLATE**, by rules, each a fact or labelled SLATE's:
 * - where it makes work (`markets`): a town where it has a studio or its
 *   headquarters, from the research; where none was found and it plainly
 *   works there, SLATE's assumption, said so;
 * - how much of a town's work is its (`weight`): SLATE's estimate, anchored
 *   on the published shares;
 * - what it makes (`formats`) and how it's seen (`release`): in cinemas, on
 *   its own streaming service, or on its channels. A television job's
 *   episodes are seen where its company shows them, and on a streaming
 *   service by the service's size (`streamer`), from its subscribers: what
 *   the residuals pay and how many see the work (`systems/industry.ts`).
 *
 * Nothing here is any company's own policy on hiring, and nothing says any
 * company has to do with SLATE: a project of theirs in a save is the save's
 * fiction, and says so where it's shown.
 */

import type { CareerCity } from './career';

export type CompanyKind = 'conglomerate' | 'streamer' | 'studio' | 'broadcaster' | 'independent';
export type DivisionRole = 'studio' | 'network' | 'streaming' | 'production' | 'distribution' | 'label';
export type CompanyFunction = 'develops' | 'commissions' | 'produces' | 'finances' | 'distributes theatrically' | 'streams' | 'broadcasts' | 'sells internationally';

export interface IndustryCompany {
  id: string;
  name: string;
  /** What the world calls it day to day. */
  short: string;
  parent?: string;
  kind: CompanyKind;
  headquarters: { city: string; country: string };
  whyChosen: string;
  divisions: readonly { name: string; role: DivisionRole; relationship?: string }[];
  functions: readonly CompanyFunction[];
  sites: readonly { name: string; city: string; country: string; /** What it is to the company, where the name doesn't say. */ note?: string }[];
  /** Its registered name, where that isn't its name. */
  legal?: string;
  /** The towns SLATE's careers work in where it makes work, and on what basis. */
  markets: readonly { cityId: CareerCity; basis: 'facility' | 'headquarters' | 'assumption'; note: string }[];
  /** Its share of a town's screen projects, against the others there. SLATE's estimate, anchored on published shares. */
  weight: number;
  /** Films against series, of what it makes. SLATE's estimate, from its titles. */
  formats: { film: number; series: number };
  /** How its work is first seen. */
  release: 'theatrical' | 'streaming' | 'broadcast';
  /** Its streaming service, its last published subscribers, and the size SLATE reads them as: over 40 million large, 10 to 40 middle. */
  streamer?: { name: string; subscribers: string; size: 'small' | 'middle' | 'large' };
  /** Its broadcast channels, where a television job's episodes air. */
  network?: string;
  /** A line of its scale, each figure from the research, dated. */
  scale: string;
  /** The research findings this rests on. */
  findings: readonly string[];
}

export const COMPANIES_SOURCE = 'docs/research/world/research-industry-companies.json (retrieved 2026-10-08); the Warner Bros. Discovery takeover read again from PBS NewsHour, 2026-10-06.';

export const COMPANIES: readonly IndustryCompany[] = [
  {
    id: 'walt-disney', name: 'The Walt Disney Company', short: 'Disney', kind: 'conglomerate', headquarters: { city: 'Burbank', country: 'United States' },
    whyChosen: 'The largest American distributor by 2025’s box-office share, second in the UK and Ireland, with studios, networks and two large streaming services.',
    divisions: [
      { name: 'Walt Disney Studios (Walt Disney Pictures, Walt Disney Animation Studios, Pixar, Marvel Studios, Lucasfilm, 20th Century Studios, Searchlight Pictures)', role: 'studio', relationship: 'wholly owned' },
      { name: 'ABC', role: 'network', relationship: 'wholly owned' },
      { name: 'FX, Disney Channel, Freeform, National Geographic', role: 'network', relationship: 'owned' },
      { name: 'Disney+', role: 'streaming', relationship: 'wholly owned' },
      { name: 'Hulu', role: 'streaming', relationship: 'wholly owned since 2025' },
    ],
    functions: ['develops', 'commissions', 'produces', 'finances', 'distributes theatrically', 'streams', 'broadcasts', 'sells internationally'],
    sites: [{ name: 'The Walt Disney Studios Lot', city: 'Burbank', country: 'United States' }, { name: 'Pinewood Studios', city: 'Iver Heath, near London', country: 'United Kingdom', note: 'a long-term lease of almost all its stages' }],
    markets: [
      { cityId: 'us-ca-losangeles', basis: 'facility', note: 'its Burbank lot' },
      { cityId: 'uk-eng-london', basis: 'facility', note: 'its lease at Pinewood' },
      { cityId: 'us-ny-newyork', basis: 'assumption', note: 'ABC’s and its other New York work, SLATE’s assumption' },
    ],
    weight: 27.5, formats: { film: 0.5, series: 0.5 }, release: 'theatrical',
    streamer: { name: 'Disney+', subscribers: '132 million (September 2025, its last report)', size: 'large' }, network: 'ABC',
    scale: '27.5% of 2025’s US and Canada box office ($2.49bn); 23.1% of the UK and Ireland’s; Disney+ 132 million subscribers (September 2025).',
    findings: ['box-office-us-2025-disney', 'box-office-uk-2025', 'disney-plus-subs', 'disney-hulu-subs'],
  },
  {
    id: 'netflix', name: 'Netflix, Inc.', short: 'Netflix', kind: 'streamer', headquarters: { city: 'Los Gatos', country: 'United States' },
    whyChosen: 'The largest subscription streamer, and a very large commissioner and maker of series and films in America and Britain.',
    divisions: [{ name: 'Netflix', role: 'streaming', relationship: 'its service' }, { name: 'Albuquerque Studios', role: 'studio', relationship: 'owned' }, { name: 'Netflix Studios Fort Monmouth', role: 'studio', relationship: 'being built; projected to open in 2028' }],
    functions: ['develops', 'commissions', 'produces', 'finances', 'streams', 'sells internationally'],
    sites: [{ name: 'Albuquerque Studios', city: 'Albuquerque', country: 'United States' }, { name: 'Shepperton Studios', city: 'Shepperton, near London', country: 'United Kingdom', note: 'a long-term production hub' }, { name: 'Netflix Studios Fort Monmouth', city: 'Oceanport and Eatontown, New Jersey', country: 'United States', note: 'projected to open in 2028' }, { name: 'Netflix Canada', city: 'Toronto', country: 'Canada', note: 'its Canadian headquarters' }],
    markets: [
      { cityId: 'uk-eng-london', basis: 'facility', note: 'its hub at Shepperton' },
      { cityId: 'ca-on-toronto', basis: 'headquarters', note: 'its Canadian headquarters' },
      { cityId: 'us-ca-losangeles', basis: 'assumption', note: 'Hollywood productions, SLATE’s assumption: its own studio is in Albuquerque' },
      { cityId: 'us-ny-newyork', basis: 'assumption', note: 'New York productions, SLATE’s assumption until Fort Monmouth opens' },
    ],
    weight: 20, formats: { film: 0.35, series: 0.65 }, release: 'streaming',
    streamer: { name: 'Netflix', subscribers: 'over 325 million paid memberships (crossed in late 2025)', size: 'large' },
    scale: 'Over 325 million paid memberships, crossed in the fourth quarter of 2025.',
    findings: ['netflix-subs', 'wbd-netflix-deal', 'wbd-netflix-withdrew'],
  },
  {
    id: 'comcast-nbcuniversal', name: 'Comcast Corporation (NBCUniversal and Sky)', short: 'NBCUniversal', kind: 'conglomerate', headquarters: { city: 'Philadelphia', country: 'United States' },
    whyChosen: 'Universal was third in 2025’s American box office and first in the UK and Ireland’s; it owns NBC, Peacock, and Sky with its studios at Elstree.',
    divisions: [
      { name: 'Universal Pictures, Focus Features, DreamWorks Animation', role: 'studio', relationship: 'wholly owned' },
      { name: 'Universal Television, Universal International Studios, Carnival Films', role: 'production', relationship: 'wholly owned' },
      { name: 'NBC, Telemundo, Bravo', role: 'network', relationship: 'wholly owned' },
      { name: 'Peacock', role: 'streaming', relationship: 'wholly owned' },
      { name: 'Sky (Sky Studios, Sky Atlantic, NOW)', role: 'network', relationship: 'wholly owned' },
    ],
    functions: ['develops', 'commissions', 'produces', 'finances', 'distributes theatrically', 'streams', 'broadcasts', 'sells internationally'],
    sites: [{ name: 'Universal Studios Lot', city: 'Universal City, California', country: 'United States' }, { name: 'Sky Studios Elstree', city: 'Borehamwood, near London', country: 'United Kingdom' }],
    markets: [
      { cityId: 'us-ca-losangeles', basis: 'facility', note: 'the Universal lot' },
      { cityId: 'uk-eng-london', basis: 'facility', note: 'Sky Studios Elstree' },
      { cityId: 'us-ny-newyork', basis: 'assumption', note: 'NBC’s New York work, SLATE’s assumption' },
    ],
    weight: 19.7, formats: { film: 0.5, series: 0.5 }, release: 'theatrical',
    streamer: { name: 'Peacock', subscribers: '48 million paid (June 2026)', size: 'large' }, network: 'NBC',
    scale: '19.7% of 2025’s US and Canada box office; 25.1% of the UK and Ireland’s, first; Peacock 48 million paid subscribers (June 2026). It said on 2026-06-29 it would spin off NBCUniversal and Sky in about a year.',
    findings: ['box-office-us-2025-universal', 'box-office-uk-2025', 'peacock-subs'],
  },
  {
    id: 'skydance-corporation', name: 'Skydance Corporation', short: 'Skydance', kind: 'conglomerate', headquarters: { city: 'Los Angeles and New York', country: 'United States' },
    whyChosen: 'Formed on 2026-10-06 when Paramount Skydance took over Warner Bros. Discovery: Paramount Pictures and Warner Bros., CBS, HBO, and Paramount+ and HBO Max.',
    divisions: [
      { name: 'Paramount Pictures', role: 'studio', relationship: 'wholly owned; keeps its name' },
      { name: 'Warner Bros. Pictures, New Line Cinema, DC Studios', role: 'studio', relationship: 'wholly owned since 2026-10-06; keeps its name' },
      { name: 'CBS Studios, Paramount Television Studios, Warner Bros. Television', role: 'production', relationship: 'wholly owned' },
      { name: 'CBS, HBO, CNN, TNT, Nickelodeon, MTV', role: 'network', relationship: 'wholly owned' },
      { name: 'Paramount+, HBO Max, Pluto TV', role: 'streaming', relationship: 'wholly owned' },
    ],
    functions: ['develops', 'commissions', 'produces', 'finances', 'distributes theatrically', 'streams', 'broadcasts', 'sells internationally'],
    sites: [{ name: 'The Paramount Lot', city: 'Hollywood, Los Angeles', country: 'United States', note: '5555 Melrose Avenue' }, { name: 'Warner Bros. Studios Burbank', city: 'Burbank', country: 'United States' }, { name: 'Warner Bros. Studios Leavesden', city: 'Leavesden, near London', country: 'United Kingdom' }],
    markets: [
      { cityId: 'us-ca-losangeles', basis: 'facility', note: 'the Paramount lot and Warner Bros. Burbank' },
      { cityId: 'us-ny-newyork', basis: 'headquarters', note: 'its New York headquarters, One Astor Plaza' },
      { cityId: 'uk-eng-london', basis: 'facility', note: 'Warner Bros. Studios Leavesden' },
    ],
    weight: 26, formats: { film: 0.5, series: 0.5 }, release: 'theatrical',
    streamer: { name: 'Paramount+ and HBO Max', subscribers: 'Paramount+ 81.6 million (June 2026)', size: 'large' }, network: 'CBS',
    scale: 'Warner Bros. had 21% of 2025’s US and Canada box office and 18.5% of the UK and Ireland’s; Paramount+ 81.6 million subscribers (June 2026); the takeover closed at $81 billion (PBS NewsHour).',
    findings: ['wbd-deal-closed', 'wbd-deal-pbs-close', 'wbd-studios-keep-names', 'box-office-us-2025-wbd', 'paramount-plus-subs', 'skydance-hq', 'leavesden', 'wb-burbank'],
  },
  {
    id: 'sony-pictures-entertainment', name: 'Sony Pictures Entertainment', short: 'Sony Pictures', parent: 'Sony Group Corporation', kind: 'studio', headquarters: { city: 'Culver City', country: 'United States' },
    whyChosen: 'A major studio with no general streaming service of its own, so it makes for others as well as for its own labels.',
    divisions: [
      { name: 'Columbia Pictures, TriStar Pictures, Screen Gems, Sony Pictures Classics', role: 'label', relationship: 'wholly owned' },
      { name: 'Sony Pictures Animation', role: 'studio', relationship: 'wholly owned' },
      { name: 'Sony Pictures Television, Left Bank Pictures, Bad Wolf', role: 'production', relationship: 'owned' },
      { name: 'Crunchyroll', role: 'streaming', relationship: 'owned; anime' },
    ],
    functions: ['develops', 'produces', 'finances', 'distributes theatrically', 'streams', 'sells internationally'],
    sites: [{ name: 'Sony Pictures Studios', city: 'Culver City', country: 'United States' }],
    markets: [{ cityId: 'us-ca-losangeles', basis: 'facility', note: 'Sony Pictures Studios, Culver City' }],
    weight: 6.5, formats: { film: 0.6, series: 0.4 }, release: 'theatrical',
    scale: 'About 6.5% of 2025’s US and Canada box office; it made KPop Demon Hunters for Netflix and The Last of Us for HBO.',
    findings: ['box-office-us-2025-sony'],
  },
  {
    id: 'amazon-mgm-studios', name: 'Amazon MGM Studios', short: 'Amazon MGM', parent: 'Amazon', kind: 'studio', headquarters: { city: 'Culver City', country: 'United States' },
    whyChosen: 'Amazon’s film and television studio, a theatrical distributor, and the commissioner for Prime Video.',
    divisions: [{ name: 'Metro-Goldwyn-Mayer, United Artists, Orion Pictures', role: 'studio', relationship: 'wholly owned' }, { name: 'Amazon MGM Studios Distribution', role: 'distribution', relationship: 'wholly owned' }, { name: 'Prime Video, MGM+', role: 'streaming', relationship: 'Amazon’s' }],
    functions: ['develops', 'commissions', 'produces', 'finances', 'distributes theatrically', 'streams', 'sells internationally'],
    sites: [{ name: 'The Culver Studios', city: 'Culver City', country: 'United States' }, { name: 'Bray Film Studios', city: 'Water Oakley, Berkshire', country: 'United Kingdom' }, { name: 'Shepperton Studios', city: 'Shepperton, near London', country: 'United Kingdom', note: 'nine stages of its own' }],
    markets: [{ cityId: 'us-ca-losangeles', basis: 'facility', note: 'The Culver Studios' }, { cityId: 'uk-eng-london', basis: 'facility', note: 'Bray, and its stages at Shepperton' }],
    weight: 8, formats: { film: 0.4, series: 0.6 }, release: 'streaming',
    streamer: { name: 'Prime Video', subscribers: 'not published as subscribers (Amazon gives viewers a month)', size: 'large' },
    scale: 'Prime Video, which Amazon says reaches over 315 million viewers a month with ads, worldwide; SLATE reads it as a large service. Nine stages of its own at Shepperton.',
    findings: ['amazon-shepperton', 'fallout-s2'],
  },
  {
    id: 'apple-tv', name: 'Apple TV and Apple Studios', short: 'Apple TV', parent: 'Apple Inc.', kind: 'streamer', headquarters: { city: 'Culver City', country: 'United States' },
    whyChosen: 'A high-budget commissioner and maker of series and films, Severance near New York and Slow Horses in Britain among them.',
    divisions: [{ name: 'Apple Studios (Apple Original Films)', role: 'studio', relationship: 'Apple’s' }, { name: 'Apple TV', role: 'streaming', relationship: 'Apple’s; called Apple TV+ until 2025-10-13' }],
    functions: ['develops', 'commissions', 'produces', 'finances', 'streams'],
    sites: [{ name: 'Apple Studios', city: 'Culver City', country: 'United States', note: 'its offices, 8600 Hayden Place' }],
    markets: [{ cityId: 'us-ca-losangeles', basis: 'facility', note: 'its Culver City offices' }, { cityId: 'us-ny-newyork', basis: 'assumption', note: 'New York-area productions such as Severance, SLATE’s assumption' }, { cityId: 'uk-eng-london', basis: 'assumption', note: 'British series such as Slow Horses, SLATE’s assumption' }],
    weight: 4, formats: { film: 0.3, series: 0.7 }, release: 'streaming',
    streamer: { name: 'Apple TV', subscribers: 'not published by Apple', size: 'middle' },
    scale: 'F1 grossed $634.1 million worldwide in 2025, through a theatrical partnership with Warner Bros.; Apple publishes no subscriber count, so SLATE reads it as a middle-sized service.',
    findings: ['f1-film', 'apple-studios', 'apple-subs'],
  },
  {
    id: 'lionsgate-studios', name: 'Lionsgate Studios Corp.', short: 'Lionsgate', kind: 'independent', headquarters: { city: 'Santa Monica and Vancouver', country: 'United States and Canada' },
    whyChosen: 'The largest studio outside the conglomerates: 24 films released in the US in the year to March 2026, distributing itself in Britain, and owner of the management firm 3 Arts.',
    divisions: [{ name: 'Lionsgate Films (with Summit Entertainment)', role: 'studio', relationship: 'wholly owned' }, { name: 'Lionsgate Television, Entertainment One', role: 'production', relationship: 'owned' }, { name: 'Lionsgate UK, Roadside Attractions', role: 'distribution', relationship: 'owned' }, { name: '3 Arts Entertainment', role: 'production', relationship: 'a majority stake; also a management firm' }],
    functions: ['develops', 'produces', 'finances', 'distributes theatrically', 'sells internationally'],
    sites: [],
    markets: [{ cityId: 'us-ca-losangeles', basis: 'headquarters', note: 'its Santa Monica headquarters' }, { cityId: 'ca-bc-vancouver', basis: 'headquarters', note: 'its Vancouver headquarters' }],
    weight: 4, formats: { film: 0.7, series: 0.3 }, release: 'theatrical',
    scale: '24 films released theatrically in the US in the fiscal year to March 2026; separate from Starz since 2025-05-07.',
    findings: ['lionsgate-releases'],
  },
  {
    id: 'bbc', name: 'British Broadcasting Corporation', short: 'The BBC', kind: 'broadcaster', headquarters: { city: 'London', country: 'United Kingdom' },
    whyChosen: 'Britain’s largest commissioner of original television, and an employer of actors itself through BBC Studios’ own dramas.',
    divisions: [{ name: 'BBC One, BBC iPlayer And Other BBC Channels', role: 'network', relationship: 'the BBC’s' }, { name: 'BBC Studios', role: 'production', relationship: 'a commercial subsidiary' }, { name: 'Baby Cow Productions, Sid Gentle Films, Lookout Point, Clerkenwell Films', role: 'production', relationship: 'BBC Studios’ labels' }],
    functions: ['develops', 'commissions', 'produces', 'finances', 'broadcasts', 'streams', 'sells internationally'],
    sites: [{ name: 'Broadcasting House', city: 'London', country: 'United Kingdom' }, { name: 'Television Center', city: 'London', country: 'United Kingdom' }, { name: 'BBC Elstree Center', city: 'Borehamwood, near London', country: 'United Kingdom' }, { name: 'MediaCityUK', city: 'Salford', country: 'United Kingdom' }, { name: 'Roath Lock', city: 'Cardiff', country: 'United Kingdom' }],
    markets: [{ cityId: 'uk-eng-london', basis: 'facility', note: 'Broadcasting House, Television Center and Elstree' }],
    weight: 30, formats: { film: 0.1, series: 0.9 }, release: 'broadcast', network: 'BBC One',
    scale: 'Over £1.6bn on original British television from more than 300 production companies (its 2024/25 commissioning report).',
    findings: ['bbc-commissioning'],
  },
  {
    id: 'itv', name: 'ITV', legal: 'ITV plc', short: 'ITV', kind: 'broadcaster', headquarters: { city: 'London', country: 'United Kingdom' },
    whyChosen: 'Britain’s main commercial public service broadcaster, and through ITV Studios a producer with about 60 labels, its continuing dramas among the steadiest employers of British actors.',
    divisions: [{ name: 'ITV1, ITV2, ITV3, ITV4, ITVX, UTV', role: 'network', relationship: 'ITV’s; Sky agreed on 2026-07-06 to buy them, expected to close in the second half of 2027' }, { name: 'ITV Studios (Mammoth Screen, World Productions, Big Talk Studios and others)', role: 'production', relationship: 'wholly owned; stays with ITV' }],
    functions: ['develops', 'commissions', 'produces', 'broadcasts', 'streams', 'sells internationally'],
    sites: [{ name: 'MediaCityUK', city: 'Trafford, Greater Manchester', country: 'United Kingdom', note: 'the Coronation Street set' }],
    markets: [{ cityId: 'uk-eng-london', basis: 'headquarters', note: 'its London headquarters' }],
    weight: 20, formats: { film: 0.05, series: 0.95 }, release: 'broadcast', network: 'ITV1',
    scale: 'About 60 production labels in 12 countries through ITV Studios; Sky agreed to buy its channels and ITVX for up to £1.6bn (2026-07-06).',
    findings: ['itv-studios-scale'],
  },
];

export const companyById = (id: string): IndustryCompany | undefined => COMPANIES.find((c) => c.id === id);

/**
 * A screen project in a town goes to one of the ten at this share, the rest
 * to independent producers SLATE doesn't name. SLATE's estimate: most work an
 * actor reads for in these towns is made or ordered by a large company, but
 * far from all.
 */
export const MAJOR_SHARE = 0.7;

/**
 * SLATE's own words for the projects it makes up: titles, and the characters
 * in them. Put together from these lists, so a title is the save's own and
 * not a real one's; one that matched a real title would still be the save's
 * fiction, and is labelled so.
 */
export const TITLE_WORDS = {
  first: ['Quiet', 'Northern', 'Last', 'Small', 'Long', 'Salt', 'Paper', 'Glass', 'Winter', 'Second', 'Hollow', 'Bright', 'Lower', 'Open', 'Late', 'Slow', 'Broken', 'Distant', 'Silver', 'Common'],
  second: ['Harbor', 'Hours', 'Country', 'Season', 'Line', 'House', 'Water', 'Field', 'Ground', 'Signal', 'Light', 'Roads', 'Rooms', 'Weather', 'Distance', 'Kingdom', 'Shore', 'Market', 'Hand', 'Station'],
  /** A part's description by its size, before a character name where one's given. */
  descriptor: { principal: ['Lead'], supporting: ['Detective', 'Doctor', 'Teacher', 'Neighbor', 'Lawyer', 'Sister', 'Brother', 'Captain', 'Reporter', 'Landlord'], featured: ['Waiter', 'Nurse', 'Clerk', 'Officer', 'Driver', 'Receptionist', 'Bartender', 'Guard'], understudy: ['Understudy'] },
} as const;
