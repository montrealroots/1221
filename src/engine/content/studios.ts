/**
 * SLATE — the real studios.
 *
 * The companies the universe operates around, as they actually are: their
 * parents, their homes, their labels and the people running them. What each
 * one makes is not asserted here; it is measured from the studio's own
 * catalogue (studio-stats.ts, built from Wikidata) and only falls back to a
 * written estimate when the catalogue has too little to measure.
 *
 * Provenance, so nothing invented is ever shown as fact:
 *   - identity, parent, home and founding are public record;
 *   - each leader carries the source that confirmed them when one was checked
 *     this year, and none when the seat is from the record and unverified;
 *   - the behavioural numbers (access, risk, reach) are SLATE's calibration and
 *     say so.
 *
 * Everything after the day a save starts is simulation. A studio's real
 * catalogue is what it made; what it greenlights in your save is SLATE.
 */

import { Registry, REFERENCE_VERSION, type ReferenceRecord } from './reference';
import type { Money } from '../core/money';
import { STUDIO_LABELS, type StudioLabel } from './studio-labels';
import { STUDIO_STATS, type StudioStats } from './studio-stats';

export type StudioTier = 'major' | 'mini_major' | 'specialty' | 'streamer' | 'producer' | 'international';

export interface Leader {
  name: string;
  title: string;
  /** A URL that confirmed the seat this year. Absent means from the record, unverified. */
  source?: string;
  /** Anything the player should know: a deal pending, a seat expiring. */
  note?: string;
}

export type StudioFormat = 'feature' | 'series' | 'limited_series' | 'documentary' | 'tv_movie';

export interface StudioSeed {
  id: string;
  name: string;
  shortName: string;
  type: StudioTier;
  aliases?: string[];
  parent?: { name: string; note?: string };
  /** One line on who owns it: public, private, state, a family. */
  ownership: string;
  countryId: string;
  locationId: string;
  /** The home city's name, so it reads right before the city list is loaded. */
  city: string;
  founded?: number;
  leadership: Leader[];
  /** Live situation that changes how the studio behaves, e.g. a sale in court. */
  status?: string;
  /** Where the record is known to be thin, say so rather than let a small number mislead. */
  catalogueNote?: string;
  description: string;
  formats: StudioFormat[];
  /** Whether the studio releases films itself; producers hand distribution to a major. */
  distributes: boolean;
  /** SLATE's calibration of behaviour, 0-100. */
  accessDifficulty: number;
  riskAppetite: number;
  prestigeBias: number;
  /** Fraction of a wide release they can book in their home market. */
  distributionReach: number;
  avoids: string[];
  /** Used only when the catalogue is too thin to measure from. */
  fallback: { wants: string[]; budgetFloor: Money; budgetCeiling: Money; slateSize: number };
  /** Hard ceiling in cents, whatever the catalogue's outliers say. */
  maxBudget: Money;
}

export interface Studio extends StudioSeed, Omit<ReferenceRecord, 'id' | 'name' | 'type' | 'aliases'> {
  labels: readonly StudioLabel[];
  stats?: StudioStats;
  /** Measured from the catalogue where it can be, estimated where it cannot. */
  wants: string[];
  budgetFloor: Money;
  budgetCeiling: Money;
  slateSize: number;
  /** Where each of the four numbers came from. */
  measured: { wants: boolean; budgets: boolean; slate: boolean };
}

const M = 1_000_000_00;
const V = REFERENCE_VERSION;

const SEEDS: StudioSeed[] = [
  // --- The Big Five ---------------------------------------------------------
  {
    id: 'disney', name: 'Walt Disney Studios', shortName: 'Disney', type: 'major', aliases: ['Disney', 'Walt Disney Pictures', '20th Century Studios', 'Searchlight', 'Marvel Studios', 'Pixar', 'Lucasfilm'],
    parent: { name: 'The Walt Disney Company' }, ownership: 'Public company', countryId: 'us', locationId: 'us-ca-burbank', city: 'Burbank', founded: 1923,
    leadership: [
      { name: 'Josh D\'Amaro', title: 'Chief Executive Officer, The Walt Disney Company', source: 'https://www.cnbc.com/2026/02/03/disney-ceo-josh-damaro-successor-bob-iger.html', note: 'Since March 18, 2026.' },
      { name: 'Bob Iger', title: 'Adviser Through December 31, 2026', source: 'https://www.cnbc.com/2026/02/03/disney-ceo-josh-damaro-successor-bob-iger.html' },
      { name: 'Dana Walden', title: 'President And Chief Creative Officer', source: 'https://deadline.com/2026/02/new-disney-ceo-movie-studio-future-1236707370/' },
      { name: 'Alan Bergman', title: 'Chairman, Disney Entertainment Studios', source: 'https://deadline.com/2026/02/new-disney-ceo-movie-studio-future-1236707370/' },
      { name: 'David Greenbaum', title: 'President, Disney Live Action And 20th Century Studios', source: 'https://deadline.com/2024/02/disney-sean-bailey-exits-david-greenbaum-searchlight-1235838865/' },
      { name: 'Steve Asbell', title: 'President, 20th Century Studios', source: 'https://deadline.com/2024/02/disney-sean-bailey-exits-david-greenbaum-searchlight-1235838865/' },
      { name: 'Kevin Feige', title: 'President, Marvel Studios' },
      { name: 'Dave Filoni', title: 'President And Chief Creative Officer, Lucasfilm', source: 'https://variety.com/2026/film/news/kathleen-kennedy-lucasfilm-dave-filoni-lynwen-brennan-star-wars-1236624307/' },
      { name: 'Lynwen Brennan', title: 'Co-President, Lucasfilm', source: 'https://variety.com/2026/film/news/kathleen-kennedy-lucasfilm-dave-filoni-lynwen-brennan-star-wars-1236624307/' },
      { name: 'Jim Morris', title: 'President, Pixar', source: 'https://www.pixar.com/morris' },
      { name: 'Pete Docter', title: 'Chief Creative Officer, Pixar', source: 'https://www.pixar.com/morris' },
      { name: 'Clark Spencer', title: 'President, Walt Disney Animation Studios', source: 'https://thewaltdisneycompany.com/news/d23-2026-disney-entertainment-showcase/' },
      { name: 'Jared Bush', title: 'Chief Creative Officer, Walt Disney Animation Studios', source: 'https://thewaltdisneycompany.com/news/d23-2026-disney-entertainment-showcase/' },
      { name: 'Matthew Greenfield', title: 'President, Searchlight Pictures', source: 'https://theorg.com/org/searchlight-pictures/org-chart/matthew-greenfield' },
    ],
    description: 'The largest studio in the world by reach: Disney, Pixar, Marvel, Lucasfilm and 20th Century under one roof, with Searchlight for the awards season.',
    formats: ['feature', 'series', 'limited_series', 'documentary'], distributes: true,
    accessDifficulty: 94, riskAppetite: 28, prestigeBias: 38, distributionReach: 1.0, avoids: ['horror', 'experimental'],
    fallback: { wants: ['family', 'animation', 'adventure', 'action', 'fantasy', 'science fiction'], budgetFloor: 25 * M, budgetCeiling: 300 * M, slateSize: 14 }, maxBudget: 400 * M,
  },
  {
    id: 'universal', name: 'Universal Pictures', shortName: 'Universal', type: 'major', aliases: ['Universal', 'NBCUniversal', 'Illumination', 'DreamWorks Animation', 'Focus'],
    parent: { name: 'NBCUniversal, owned by Comcast', note: 'Comcast announced in June 2026 that it will spin NBCUniversal off as its own public company.' }, ownership: 'Public company', countryId: 'us', locationId: 'us-ca-universalcity', city: 'Universal City', founded: 1912,
    leadership: [
      { name: 'Brian Roberts', title: 'Co-Chief Executive Officer, Comcast', source: 'https://www.cnbc.com/2026/06/29/comcast-announces-it-will-spin-off-media-and-tech-wings-into-separate-public-companies.html' },
      { name: 'Mike Cavanagh', title: 'Co-Chief Executive Officer, Comcast', source: 'https://www.cnbc.com/2026/06/29/comcast-announces-it-will-spin-off-media-and-tech-wings-into-separate-public-companies.html', note: 'Will run NBCUniversal after the spin-off.' },
      { name: 'Donna Langley', title: 'Chairman, NBCUniversal Entertainment And Studios' },
      { name: 'Peter Cramer', title: 'President, Universal Pictures', source: 'https://www.theofficialboard.com/biography/peter-cramer-de70g' },
      { name: 'Peter Levinsohn', title: 'Vice Chairman And Chief Distribution Officer' },
      { name: 'Jim Orr', title: 'President, Domestic Distribution' },
      { name: 'Chris Meledandri', title: 'Founder And Chief Executive Officer, Illumination' },
      { name: 'Margie Cohn', title: 'President, DreamWorks Animation' },
      { name: 'Peter Kujawski', title: 'Chairman, Focus Features', source: 'https://www.screendaily.com/news/focus-features-president-robert-walak-stepping-down/5152341.article' },
      { name: 'Tim Bevan', title: 'Co-Chairman, Working Title Films', source: 'https://www.screendaily.com/features/the-brit-50-working-title-films/5210547.article' },
      { name: 'Eric Fellner', title: 'Co-Chairman, Working Title Films', source: 'https://www.screendaily.com/features/the-brit-50-working-title-films/5210547.article' },
    ],
    description: 'Universal, Focus, Illumination, DreamWorks Animation and Working Title. Volume, franchises and the most reliable animation business in the industry.',
    formats: ['feature', 'series', 'limited_series'], distributes: true,
    accessDifficulty: 92, riskAppetite: 40, prestigeBias: 42, distributionReach: 1.0, avoids: ['experimental'],
    fallback: { wants: ['animation', 'horror', 'action', 'comedy', 'thriller', 'family'], budgetFloor: 20 * M, budgetCeiling: 250 * M, slateSize: 18 }, maxBudget: 300 * M,
  },
  {
    id: 'warner', name: 'Warner Bros. Pictures', shortName: 'Warner Bros.', type: 'major', aliases: ['Warner Bros.', 'Warner', 'New Line', 'DC Studios', 'WB'],
    parent: { name: 'Warner Bros. Discovery', note: 'Paramount Skydance agreed to buy the company and shareholders and the Justice Department approved it. Twelve states sued and a federal court has blocked closing pending a trial into 2027, so Warner Bros. still stands alone.' },
    ownership: 'Public company, sale to Paramount Skydance blocked in court', countryId: 'us', locationId: 'us-ca-burbank', city: 'Burbank', founded: 1923,
    status: 'Sale to Paramount Skydance approved by shareholders and regulators, then blocked by a federal court pending a trial in 2027.',
    leadership: [
      { name: 'David Zaslav', title: 'President And Chief Executive Officer, Warner Bros. Discovery', source: 'https://variety.com/2026/film/news/warner-bros-discovery-paramount-shareholder-approval-zaslav-pay-package-1236727798/' },
      { name: 'Mike De Luca', title: 'Co-Chair And Chief Executive Officer, Warner Bros. Motion Picture Group', source: 'https://www.hollywoodreporter.com/movies/movie-news/warner-bros-movie-chiefs-michael-de-luca-and-pamela-abdy-2-1236396190/' },
      { name: 'Pam Abdy', title: 'Co-Chair And Chief Executive Officer, Warner Bros. Motion Picture Group', source: 'https://www.hollywoodreporter.com/movies/movie-news/warner-bros-movie-chiefs-michael-de-luca-and-pamela-abdy-2-1236396190/' },
      { name: 'Richard Brener', title: 'President, New Line Cinema', source: 'https://www.cbr.com/james-gunn-peter-safran-dc-studios-staying-paramount-merger/' },
      { name: 'James Gunn', title: 'Co-Chair And Chief Executive Officer, DC Studios', source: 'https://www.cbr.com/james-gunn-peter-safran-dc-studios-staying-paramount-merger/', note: 'Contract runs to around the end of 2026.' },
      { name: 'Peter Safran', title: 'Co-Chair And Chief Executive Officer, DC Studios', source: 'https://www.cbr.com/james-gunn-peter-safran-dc-studios-staying-paramount-merger/', note: 'Contract runs to around the end of 2026.' },
      { name: 'Bill Damaschke', title: 'Head Of Warner Bros. Pictures Animation' },
      { name: 'Jeff Goldstein', title: 'President, Global Distribution' },
      { name: 'Josh Goldstine', title: 'President, Global Marketing' },
    ],
    description: 'Warner Bros., New Line and DC Studios. Filmmaker-driven, franchise-heavy, and living through the industry\'s biggest unresolved sale.',
    formats: ['feature', 'series', 'limited_series'], distributes: true,
    accessDifficulty: 92, riskAppetite: 48, prestigeBias: 52, distributionReach: 1.0, avoids: ['experimental'],
    fallback: { wants: ['action', 'fantasy', 'horror', 'drama', 'science fiction', 'comedy'], budgetFloor: 20 * M, budgetCeiling: 250 * M, slateSize: 16 }, maxBudget: 300 * M,
  },
  {
    id: 'sony', name: 'Sony Pictures', shortName: 'Sony', type: 'major', aliases: ['Sony Pictures Entertainment', 'Columbia Pictures', 'Columbia', 'TriStar', 'Screen Gems'],
    parent: { name: 'Sony Group Corporation' }, ownership: 'Public company', countryId: 'us', locationId: 'us-ca-culvercity', city: 'Culver City', founded: 1924,
    status: 'Netflix became Sony\'s exclusive worldwide streaming home for new features in January 2026.',
    leadership: [
      { name: 'Hiroki Totoki', title: 'President And Chief Executive Officer, Sony Group' },
      { name: 'Ravi Ahuja', title: 'Chairman And Chief Executive Officer, Sony Pictures Entertainment', source: 'https://www.thewrap.com/industry-news/business/sony-pictures-entertainment-layoffs-2026/' },
      { name: 'Tom Rothman', title: 'Chairman And Chief Executive Officer, Motion Picture Group', source: 'https://www.thewrap.com/sony-shakeup-sanford-panitch-promotions/' },
      { name: 'Sanford Panitch', title: 'President, Motion Picture Group', source: 'https://www.thewrap.com/sony-shakeup-sanford-panitch-promotions/' },
      { name: 'Peter Kang', title: 'President Of Production, Columbia Pictures', source: 'https://www.thewrap.com/sony-shakeup-sanford-panitch-promotions/' },
      { name: 'Nicole Brown', title: 'President, TriStar Pictures', source: 'https://www.screendaily.com/features/my-screen-life-tristar-pictures-president-nicole-brown-on-being-a-child-actor-baby-driver-2/5179511.article' },
      { name: 'Kristine Belson', title: 'President, Sony Pictures Animation', source: 'https://www.screendaily.com/features/my-screen-life-tristar-pictures-president-nicole-brown-on-being-a-child-actor-baby-driver-2/5179511.article' },
      { name: 'Michael Barker', title: 'Co-President, Sony Pictures Classics', source: 'https://www.sonyclassics.com/about-us/' },
      { name: 'Tom Bernard', title: 'Co-President, Sony Pictures Classics', source: 'https://www.sonyclassics.com/about-us/' },
    ],
    description: 'Columbia, TriStar, Screen Gems, Sony Pictures Animation and Sony Pictures Classics. The only major without its own streaming service, which is why it sells to everyone.',
    formats: ['feature', 'series', 'limited_series'], distributes: true,
    accessDifficulty: 90, riskAppetite: 46, prestigeBias: 46, distributionReach: 0.98, avoids: ['experimental'],
    fallback: { wants: ['action', 'comedy', 'horror', 'animation', 'thriller', 'drama'], budgetFloor: 15 * M, budgetCeiling: 220 * M, slateSize: 16 }, maxBudget: 300 * M,
  },
  {
    id: 'paramount', name: 'Paramount Pictures', shortName: 'Paramount', type: 'major', aliases: ['Paramount', 'Paramount Skydance', 'Skydance', 'Nickelodeon Movies'],
    parent: { name: 'Paramount Skydance Corporation', note: 'Formed when Skydance took over Paramount Global in August 2025.' }, ownership: 'Public company, controlled by David Ellison', countryId: 'us', locationId: 'us-ca-hollywood', city: 'Hollywood', founded: 1912,
    leadership: [
      { name: 'David Ellison', title: 'Chairman And Chief Executive Officer, Paramount Skydance', source: 'https://variety.com/2026/film/news/paramount-josh-greenstein-dana-goldberg-cinemacon-1236723868/' },
      { name: 'Jeff Shell', title: 'President, Paramount Skydance' },
      { name: 'Dana Goldberg', title: 'Co-Chair And Co-Chief Executive Officer, Paramount Pictures', source: 'https://variety.com/2026/film/news/paramount-josh-greenstein-dana-goldberg-cinemacon-1236723868/' },
      { name: 'Josh Greenstein', title: 'Co-Chair And Co-Chief Executive Officer, Paramount Pictures', source: 'https://variety.com/2026/film/news/paramount-josh-greenstein-dana-goldberg-cinemacon-1236723868/' },
    ],
    description: 'Paramount, Skydance, Paramount Animation and Nickelodeon Movies, plus a stake in Miramax. Newly capitalised and buying aggressively.',
    formats: ['feature', 'series', 'limited_series'], distributes: true,
    accessDifficulty: 90, riskAppetite: 50, prestigeBias: 40, distributionReach: 0.98, avoids: ['experimental'],
    fallback: { wants: ['action', 'adventure', 'family', 'horror', 'comedy', 'thriller'], budgetFloor: 15 * M, budgetCeiling: 250 * M, slateSize: 14 }, maxBudget: 300 * M,
  },

  // --- The next tier, United States -------------------------------------------
  {
    id: 'lionsgate', name: 'Lionsgate', shortName: 'Lionsgate', type: 'mini_major', aliases: ['Lionsgate Films', 'Summit Entertainment', 'Summit', 'eOne'],
    ownership: 'Independent public company since its 2025 split from Starz', countryId: 'us', locationId: 'us-ca-santamonica', city: 'Santa Monica', founded: 1997,
    leadership: [
      { name: 'Jon Feltheimer', title: 'Chief Executive Officer', source: 'https://deadline.com/2026/04/lionsgate-extends-ceo-jon-feltheimer-contract-2031-1236862195/', note: 'Contract extended to 2031.' },
      { name: 'Michael Burns', title: 'Vice Chair', source: 'https://deadline.com/2026/04/lionsgate-extends-ceo-jon-feltheimer-contract-2031-1236862195/' },
      { name: 'Adam Fogelson', title: 'Chair, Motion Picture Group', source: 'https://www.hollywoodreporter.com/business/business-news/erin-westerman-president-lionsgate-motion-picture-1236318809/' },
      { name: 'Erin Westerman', title: 'President, Motion Picture Group', source: 'https://www.hollywoodreporter.com/business/business-news/erin-westerman-president-lionsgate-motion-picture-1236318809/' },
      { name: 'Kevin Beggs', title: 'Chair, Television Group' },
    ],
    description: 'The largest studio outside the majors. Franchise-minded, deal-driven and always open to a co-financed swing.',
    formats: ['feature', 'series', 'limited_series'], distributes: true,
    accessDifficulty: 78, riskAppetite: 58, prestigeBias: 40, distributionReach: 0.85, avoids: ['experimental'],
    fallback: { wants: ['action', 'thriller', 'horror', 'drama', 'comedy'], budgetFloor: 5 * M, budgetCeiling: 120 * M, slateSize: 14 }, maxBudget: 200 * M,
  },
  {
    id: 'amazon-mgm', name: 'Amazon MGM Studios', shortName: 'Amazon MGM', type: 'streamer', aliases: ['Amazon Studios', 'MGM', 'Metro-Goldwyn-Mayer', 'United Artists', 'Orion'],
    parent: { name: 'Amazon' }, ownership: 'Public company', countryId: 'us', locationId: 'us-ca-culvercity', city: 'Culver City', founded: 2010,
    catalogueNote: 'MGM, United Artists and Orion carry a century of releases. Amazon\'s own originals are listed only where Amazon is recorded as producer or premiere outlet.',
    leadership: [
      { name: 'Mike Hopkins', title: 'Head Of Prime Video And Amazon MGM Studios', source: 'https://www.imdb.com/news/ni65168853/' },
      { name: 'Courtenay Valenti', title: 'Head Of Film, Streaming And Theatrical', source: 'https://www.imdb.com/news/ni65168853/' },
      { name: 'Vernon Sanders', title: 'Head Of Television' },
    ],
    description: 'MGM, United Artists and Orion inside Amazon. Theatrical when it wants to be, Prime Video when it does not, and the owner of Bond.',
    formats: ['feature', 'series', 'limited_series', 'documentary'], distributes: true,
    accessDifficulty: 84, riskAppetite: 52, prestigeBias: 55, distributionReach: 0.7, avoids: [],
    fallback: { wants: ['action', 'thriller', 'drama', 'comedy', 'romance'], budgetFloor: 8 * M, budgetCeiling: 200 * M, slateSize: 20 }, maxBudget: 300 * M,
  },
  {
    id: 'netflix', name: 'Netflix', shortName: 'Netflix', type: 'streamer', aliases: ['Netflix Films'],
    ownership: 'Independent public company', countryId: 'us', locationId: 'us-ca-losgatos', city: 'Los Gatos', founded: 1997,
    catalogueNote: 'The record lists only what Netflix produced or premiered. Films it licensed are left out, and many of its own films are recorded under their production companies, so its film count runs low.',
    leadership: [
      { name: 'Ted Sarandos', title: 'Co-Chief Executive Officer' },
      { name: 'Greg Peters', title: 'Co-Chief Executive Officer' },
      { name: 'Bela Bajaria', title: 'Chief Content Officer', source: 'https://www.thewrap.com/creative-content/movies/netflix-film-chief-dan-lin-outlines-vision/' },
      { name: 'Dan Lin', title: 'Chairman Of Film', source: 'https://www.thewrap.com/creative-content/movies/netflix-film-chief-dan-lin-outlines-vision/' },
    ],
    description: 'The largest buyer of finished and original film and television in the world. Rarely theatrical, never says what worked.',
    formats: ['feature', 'series', 'limited_series', 'documentary', 'tv_movie'], distributes: true,
    accessDifficulty: 80, riskAppetite: 60, prestigeBias: 48, distributionReach: 0.1, avoids: [],
    fallback: { wants: ['thriller', 'drama', 'comedy', 'romance', 'action', 'documentary'], budgetFloor: 3 * M, budgetCeiling: 200 * M, slateSize: 60 }, maxBudget: 300 * M,
  },
  {
    id: 'apple', name: 'Apple Original Films', shortName: 'Apple', type: 'streamer', aliases: ['Apple Studios', 'Apple TV'],
    parent: { name: 'Apple Inc.' }, ownership: 'Public company', countryId: 'us', locationId: 'us-ca-culvercity', city: 'Culver City', founded: 2019,
    catalogueNote: 'The record lists what Apple produced or premiered. Films Apple bought finished are often recorded under their production companies.',
    leadership: [
      { name: 'Tim Cook', title: 'Chief Executive Officer, Apple' },
      { name: 'Eddy Cue', title: 'Senior Vice President, Services, Apple' },
      { name: 'Zack Van Amburg', title: 'Head Of Worldwide Video', source: 'https://www.screendaily.com/features/apple-content-team-on-f1-emmys-success-and-launching-a-platform/5210477.article' },
      { name: 'Jamie Erlicht', title: 'Head Of Worldwide Video', source: 'https://www.screendaily.com/features/apple-content-team-on-f1-emmys-success-and-launching-a-platform/5210477.article' },
      { name: 'Matt Dentler', title: 'Head Of Features', source: 'https://www.screendaily.com/features/apple-content-team-on-f1-emmys-success-and-launching-a-platform/5210477.article' },
    ],
    description: 'Fewer, bigger, filmmaker-led swings, released theatrically through a partner when the film earns it.',
    formats: ['feature', 'series', 'limited_series', 'documentary'], distributes: false,
    accessDifficulty: 86, riskAppetite: 45, prestigeBias: 70, distributionReach: 0.0, avoids: ['horror'],
    fallback: { wants: ['drama', 'thriller', 'biography', 'science fiction', 'action'], budgetFloor: 15 * M, budgetCeiling: 200 * M, slateSize: 10 }, maxBudget: 300 * M,
  },
  {
    id: 'a24', name: 'A24', shortName: 'A24', type: 'specialty', ownership: 'Independent, privately held', countryId: 'us', locationId: 'us-ny-newyork', city: 'New York City', founded: 2012,
    leadership: [
      { name: 'Daniel Katz', title: 'Co-Founder, Greenlights And Talent', source: 'https://www.britannica.com/topic/A24' },
      { name: 'David Fenkel', title: 'Co-Founder, Financing And Distribution', source: 'https://www.britannica.com/topic/A24' },
      { name: 'Noah Sacco', title: 'Head Of Film', source: 'https://www.britannica.com/topic/A24' },
      { name: 'Ravi Nandan', title: 'Head Of Television', source: 'https://www.britannica.com/topic/A24' },
    ],
    description: 'The defining independent of its era. Director-first, marketing-literate, and the label a first feature wants.',
    formats: ['feature', 'series', 'limited_series', 'documentary'], distributes: true,
    accessDifficulty: 72, riskAppetite: 82, prestigeBias: 84, distributionReach: 0.55, avoids: [],
    fallback: { wants: ['drama', 'horror', 'comedy', 'thriller', 'science fiction'], budgetFloor: 2 * M, budgetCeiling: 40 * M, slateSize: 18 }, maxBudget: 100 * M,
  },
  {
    id: 'legendary', name: 'Legendary Entertainment', shortName: 'Legendary', type: 'producer', aliases: ['Legendary Pictures'],
    ownership: 'Independent, with Apollo Global Management as a major investor', countryId: 'us', locationId: 'us-ca-burbank', city: 'Burbank', founded: 2000,
    leadership: [
      { name: 'Joshua Grode', title: 'Chief Executive Officer', source: 'https://labusinessjournal.com/la500-2026/media-2026/la500-2026-joshua-grode/' },
      { name: 'Mary Parent', title: 'Vice Chairman Of Worldwide Production' },
    ],
    description: 'Big-budget genre with a major as distribution partner: Dune, Godzilla, Kong and whatever is next at that scale.',
    formats: ['feature', 'series'], distributes: false,
    accessDifficulty: 84, riskAppetite: 42, prestigeBias: 45, distributionReach: 0.0, avoids: ['romance', 'documentary'],
    fallback: { wants: ['science fiction', 'action', 'fantasy', 'adventure', 'horror'], budgetFloor: 40 * M, budgetCeiling: 200 * M, slateSize: 5 }, maxBudget: 250 * M,
  },
  {
    id: 'blumhouse', name: 'Blumhouse Productions', shortName: 'Blumhouse', type: 'producer', aliases: ['Blumhouse', 'Atomic Monster'],
    ownership: 'Independent, NBCUniversal holds a minority stake', countryId: 'us', locationId: 'us-ca-losangeles', city: 'Los Angeles', founded: 2000,
    leadership: [
      { name: 'Jason Blum', title: 'Founder And Chief Executive Officer', source: 'https://www.thewrap.com/blumhouse-president-abhijay-prakash-interview/' },
      { name: 'Abhijay Prakash', title: 'President', source: 'https://www.thewrap.com/blumhouse-president-abhijay-prakash-interview/' },
    ],
    description: 'Low budgets, real filmmakers, Universal releases. The most reliable horror business in the industry.',
    formats: ['feature', 'series', 'limited_series'], distributes: false,
    accessDifficulty: 60, riskAppetite: 80, prestigeBias: 30, distributionReach: 0.0, avoids: ['family', 'animation', 'musical'],
    fallback: { wants: ['horror', 'thriller'], budgetFloor: 1 * M, budgetCeiling: 20 * M, slateSize: 8 }, maxBudget: 40 * M,
  },
  {
    id: 'neon', name: 'Neon', shortName: 'Neon', type: 'specialty', ownership: 'Independent, majority held by 30WEST, with Department M a shareholder since July 2026', countryId: 'us', locationId: 'us-ny-newyork', city: 'New York City', founded: 2017,
    leadership: [
      { name: 'Tom Quinn', title: 'Founder And Chief Executive Officer', source: 'https://deadline.com/2026/07/neon-department-m-1236979301/' },
      { name: 'Elissa Federoff', title: 'Chief Distribution Officer', source: 'https://deadline.com/2026/07/neon-department-m-1236979301/' },
      { name: 'Kristen Figeroid', title: 'President, International Sales And Distribution', source: 'https://deadline.com/2026/07/neon-department-m-1236979301/' },
      { name: 'Ryan Friscia', title: 'Chief Financial Officer', source: 'https://deadline.com/2026/07/neon-department-m-1236979301/' },
    ],
    description: 'Buys at festivals and campaigns like a major. Five Palme d\'Or winners in a row, and a television arm since 2026.',
    formats: ['feature', 'documentary', 'limited_series'], distributes: true,
    accessDifficulty: 66, riskAppetite: 86, prestigeBias: 92, distributionReach: 0.4, avoids: ['family'],
    fallback: { wants: ['drama', 'horror', 'thriller', 'documentary', 'comedy'], budgetFloor: 1 * M, budgetCeiling: 25 * M, slateSize: 14 }, maxBudget: 60 * M,
  },
  {
    id: 'focus', name: 'Focus Features', shortName: 'Focus', type: 'specialty', parent: { name: 'Universal Pictures, so NBCUniversal and Comcast' }, ownership: 'Division of a public company', countryId: 'us', locationId: 'us-ca-universalcity', city: 'Universal City', founded: 2002,
    leadership: [
      { name: 'Peter Kujawski', title: 'Chairman', source: 'https://www.screendaily.com/news/focus-features-president-robert-walak-stepping-down/5152341.article' },
      { name: 'Jason Cassidy', title: 'Vice Chairman', source: 'https://www.screendaily.com/news/focus-features-president-robert-walak-stepping-down/5152341.article' },
    ],
    description: 'Universal\'s specialty label. Prestige drama, British co-productions and a Universal-sized marketing budget behind a small film.',
    formats: ['feature', 'documentary'], distributes: true,
    accessDifficulty: 74, riskAppetite: 62, prestigeBias: 84, distributionReach: 0.6, avoids: ['action'],
    fallback: { wants: ['drama', 'biography', 'romance', 'comedy', 'thriller'], budgetFloor: 3 * M, budgetCeiling: 40 * M, slateSize: 10 }, maxBudget: 80 * M,
  },
  {
    id: 'searchlight', name: 'Searchlight Pictures', shortName: 'Searchlight', type: 'specialty', parent: { name: 'The Walt Disney Company' }, ownership: 'Division of a public company', countryId: 'us', locationId: 'us-ca-centurycity', city: 'Century City', founded: 1994,
    leadership: [{ name: 'Matthew Greenfield', title: 'President', source: 'https://theorg.com/org/searchlight-pictures/org-chart/matthew-greenfield' }],
    description: 'Disney\'s awards label. Four Best Picture winners and a habit of finding the film nobody else saw coming.',
    formats: ['feature', 'documentary'], distributes: true,
    accessDifficulty: 76, riskAppetite: 60, prestigeBias: 90, distributionReach: 0.6, avoids: ['action', 'family'],
    fallback: { wants: ['drama', 'comedy', 'biography', 'romance', 'thriller'], budgetFloor: 3 * M, budgetCeiling: 40 * M, slateSize: 8 }, maxBudget: 80 * M,
  },
  {
    id: 'sony-classics', name: 'Sony Pictures Classics', shortName: 'Sony Classics', type: 'specialty', parent: { name: 'Sony Pictures Entertainment, so Sony Group' }, ownership: 'Division of a public company', countryId: 'us', locationId: 'us-ny-newyork', city: 'New York City', founded: 1992,
    leadership: [
      { name: 'Michael Barker', title: 'Co-President', source: 'https://www.sonyclassics.com/about-us/' },
      { name: 'Tom Bernard', title: 'Co-President', source: 'https://www.sonyclassics.com/about-us/' },
    ],
    description: 'The longest-serving specialty label in the business. Patient releases, international cinema and the film that plays for months.',
    formats: ['feature', 'documentary'], distributes: true,
    accessDifficulty: 62, riskAppetite: 64, prestigeBias: 92, distributionReach: 0.35, avoids: ['action', 'horror', 'family'],
    fallback: { wants: ['drama', 'documentary', 'biography', 'romance', 'comedy'], budgetFloor: 500_000_00, budgetCeiling: 15 * M, slateSize: 14 }, maxBudget: 30 * M,
  },
  {
    id: 'angel', name: 'Angel Studios', shortName: 'Angel', type: 'specialty', ownership: 'Public company, listed on the New York Stock Exchange in April 2026', countryId: 'us', locationId: 'us-ut-provo', city: 'Provo', founded: 2013,
    leadership: [
      { name: 'Neal Harmon', title: 'Chief Executive Officer', source: 'https://ir.angel.com/management/' },
      { name: 'Jordan Harmon', title: 'President' },
      { name: 'Jeffrey Harmon', title: 'Chief Creative Officer' },
    ],
    description: 'Faith and family films chosen by its own paying membership, released wide on crowd power.',
    formats: ['feature', 'series', 'documentary'], distributes: true,
    accessDifficulty: 48, riskAppetite: 55, prestigeBias: 25, distributionReach: 0.5, avoids: ['horror', 'crime', 'experimental'],
    fallback: { wants: ['family', 'drama', 'biography', 'animation'], budgetFloor: 2 * M, budgetCeiling: 30 * M, slateSize: 8 }, maxBudget: 60 * M,
  },
  {
    id: 'annapurna', name: 'Annapurna Pictures', shortName: 'Annapurna', type: 'specialty', ownership: 'Independent, privately held by Megan Ellison', countryId: 'us', locationId: 'us-ca-losangeles', city: 'Los Angeles', founded: 2011,
    status: 'Cut about thirty jobs in August 2026 while its film heads were newly installed.',
    leadership: [
      { name: 'Megan Ellison', title: 'Chairwoman And Chief Executive Officer', source: 'https://variety.com/2026/film/news/megan-ellison-annapurna-layoffs-1236843926/' },
      { name: 'Chelsea Barnard', title: 'Co-Head Of Film', source: 'https://variety.com/2026/film/news/megan-ellison-annapurna-layoffs-1236843926/' },
      { name: 'Matthew Budman', title: 'Co-Head Of Film', source: 'https://variety.com/2026/film/news/megan-ellison-annapurna-layoffs-1236843926/' },
      { name: 'Ed Rubin', title: 'Head Of International Television', source: 'https://variety.com/2026/film/news/megan-ellison-annapurna-layoffs-1236843926/' },
    ],
    description: 'Auteur financing at a scale nobody else attempts, and the scars to show for it.',
    formats: ['feature', 'series', 'limited_series'], distributes: false,
    accessDifficulty: 78, riskAppetite: 76, prestigeBias: 88, distributionReach: 0.0, avoids: ['family'],
    fallback: { wants: ['drama', 'crime', 'biography', 'comedy', 'thriller'], budgetFloor: 5 * M, budgetCeiling: 60 * M, slateSize: 4 }, maxBudget: 100 * M,
  },
  {
    id: 'bleecker', name: 'Bleecker Street', shortName: 'Bleecker Street', type: 'specialty', ownership: 'Independent, privately held', countryId: 'us', locationId: 'us-ny-newyork', city: 'New York City', founded: 2014,
    leadership: [
      { name: 'Kent Sanderson', title: 'Chief Executive Officer', source: 'https://variety.com/2025/film/news/bleecker-street-promotion-kent-sanderson-ceo-1236416858/' },
      { name: 'Tyler DiNapoli', title: 'President And Chief Marketing Officer', source: 'https://variety.com/2025/film/news/bleecker-street-promotion-kent-sanderson-ceo-1236416858/' },
    ],
    description: 'Adult drama for adults, acquired finished and released with care.',
    formats: ['feature', 'documentary'], distributes: true,
    accessDifficulty: 50, riskAppetite: 60, prestigeBias: 78, distributionReach: 0.3, avoids: ['horror', 'family', 'action'],
    fallback: { wants: ['drama', 'biography', 'comedy', 'romance', 'thriller'], budgetFloor: 500_000_00, budgetCeiling: 15 * M, slateSize: 10 }, maxBudget: 30 * M,
  },
  {
    id: 'ifc', name: 'IFC Films', shortName: 'IFC', type: 'specialty', aliases: ['IFC Midnight', 'RLJE Films', 'Shudder'], parent: { name: 'AMC Networks' }, ownership: 'Division of a public company', countryId: 'us', locationId: 'us-ny-newyork', city: 'New York City', founded: 2000,
    leadership: [{ name: 'Scott Shooman', title: 'Head Of AMC Networks Film Group', source: 'https://www.amcnetworks.com/press-releases/amc-networks-appoints-scott-shooman-as-head-of-its-film-group-encompassing-ifc-films-rlje-films-and-shudder/' }],
    description: 'IFC Films, IFC Midnight, RLJE and Shudder: independent drama by day, genre by night, with a streaming home for both.',
    formats: ['feature', 'documentary'], distributes: true,
    accessDifficulty: 44, riskAppetite: 72, prestigeBias: 66, distributionReach: 0.3, avoids: ['family'],
    fallback: { wants: ['horror', 'drama', 'thriller', 'documentary', 'comedy'], budgetFloor: 300_000_00, budgetCeiling: 10 * M, slateSize: 24 }, maxBudget: 20 * M,
  },
  {
    id: 'magnolia', name: 'Magnolia Pictures', shortName: 'Magnolia', type: 'specialty', aliases: ['Magnet Releasing'], parent: { name: '2929 Entertainment, Mark Cuban and Todd Wagner' }, ownership: 'Privately held', countryId: 'us', locationId: 'us-ny-newyork', city: 'New York City', founded: 2001,
    leadership: [
      { name: 'Eamonn Bowles', title: 'Co-Chief Executive Officer', source: 'https://www.indiewire.com/features/commentary/magnolia-pictures-not-for-sale-1234862075/' },
      { name: 'Dori Begley', title: 'Co-Chief Executive Officer', source: 'https://www.indiewire.com/features/commentary/magnolia-pictures-not-for-sale-1234862075/' },
    ],
    description: 'Documentaries, world cinema and Magnet for genre. Day-and-date before anyone else was.',
    formats: ['feature', 'documentary'], distributes: true,
    accessDifficulty: 42, riskAppetite: 70, prestigeBias: 70, distributionReach: 0.25, avoids: ['family', 'action'],
    fallback: { wants: ['documentary', 'drama', 'horror', 'comedy', 'thriller'], budgetFloor: 250_000_00, budgetCeiling: 8 * M, slateSize: 20 }, maxBudget: 15 * M,
  },
  {
    id: 'roadside', name: 'Roadside Attractions', shortName: 'Roadside', type: 'specialty', ownership: 'Independent, Lionsgate holds a minority stake', countryId: 'us', locationId: 'us-ca-losangeles', city: 'Los Angeles', founded: 2003,
    leadership: [
      { name: 'Howard Cohen', title: 'Co-President', source: 'https://en.wikipedia.org/wiki/Roadside_Attractions' },
      { name: 'Eric d\'Arbeloff', title: 'Co-President', source: 'https://en.wikipedia.org/wiki/Roadside_Attractions' },
    ],
    description: 'Mid-size specialty releases with a Lionsgate pipeline behind them.',
    formats: ['feature', 'documentary'], distributes: true,
    accessDifficulty: 46, riskAppetite: 58, prestigeBias: 72, distributionReach: 0.3, avoids: ['horror', 'action'],
    fallback: { wants: ['drama', 'biography', 'comedy', 'documentary', 'romance'], budgetFloor: 500_000_00, budgetCeiling: 12 * M, slateSize: 8 }, maxBudget: 25 * M,
  },

  // --- International --------------------------------------------------------------
  {
    id: 'toho', name: 'Toho', shortName: 'Toho', type: 'international', aliases: ['Toho Animation'], parent: { name: 'Toho Co., part of the Hankyu Hanshin Toho Group' }, ownership: 'Public company', countryId: 'jp', locationId: 'jp-13-tokyo', city: 'Tokyo', founded: 1932,
    leadership: [{ name: 'Hiroyasu Matsuoka', title: 'President And Chief Executive Officer', source: 'https://www.keio.ac.jp/en/about/public-relations/mita-hyoron/spotlight/20260415/' }],
    description: 'Japan\'s biggest distributor and the home of Godzilla, Ghibli\'s releases and the anime that tops the domestic chart.',
    formats: ['feature', 'series'], distributes: true,
    accessDifficulty: 84, riskAppetite: 36, prestigeBias: 44, distributionReach: 1.0, avoids: ['western'],
    fallback: { wants: ['animation', 'fantasy', 'drama', 'action', 'family'], budgetFloor: 3 * M, budgetCeiling: 40 * M, slateSize: 30 }, maxBudget: 80 * M,
  },
  {
    id: 'toei', name: 'Toei Company', shortName: 'Toei', type: 'international', aliases: ['Toei Animation'], ownership: 'Public company, listed in Tokyo', countryId: 'jp', locationId: 'jp-13-tokyo', city: 'Tokyo', founded: 1951,
    leadership: [
      { name: 'Fumio Yoshimura', title: 'President And Chief Executive Officer', source: 'https://www.tipranks.com/news/company-announcements/toei-reshapes-and-reaffirms-leadership-team-after-shareholder-meeting' },
      { name: 'Noriyuki Tada', title: 'Chair', source: 'https://www.tipranks.com/news/company-announcements/toei-reshapes-and-reaffirms-leadership-team-after-shareholder-meeting' },
    ],
    description: 'Live-action genre, tokusatsu and Toei Animation, which owns One Piece and Dragon Ball.',
    formats: ['feature', 'series'], distributes: true,
    accessDifficulty: 80, riskAppetite: 40, prestigeBias: 36, distributionReach: 0.9, avoids: ['western'],
    fallback: { wants: ['animation', 'action', 'fantasy', 'drama'], budgetFloor: 2 * M, budgetCeiling: 30 * M, slateSize: 20 }, maxBudget: 60 * M,
  },
  {
    id: 'shochiku', name: 'Shochiku', shortName: 'Shochiku', type: 'international', ownership: 'Public company, listed in Tokyo', countryId: 'jp', locationId: 'jp-13-tokyo', city: 'Tokyo', founded: 1895,
    leadership: [{ name: 'Toshihiro Takahashi', title: 'President', source: 'https://www.theworldfolio.com/interviews/respecting-tradition-while-embracing-the-future-shochikus-vision-for-globalizing-japans-kabuki-culture/6888/' }],
    description: 'The oldest of Japan\'s majors: Ozu\'s studio, kabuki\'s custodian, and a steady drama slate.',
    formats: ['feature', 'series'], distributes: true,
    accessDifficulty: 78, riskAppetite: 34, prestigeBias: 60, distributionReach: 0.85, avoids: ['western'],
    fallback: { wants: ['drama', 'animation', 'family', 'comedy'], budgetFloor: 1 * M, budgetCeiling: 20 * M, slateSize: 20 }, maxBudget: 40 * M,
  },
  {
    id: 'kadokawa', name: 'Kadokawa', shortName: 'Kadokawa', type: 'international', aliases: ['Kadokawa Corporation', 'Kadokawa Daiei'], ownership: 'Public company, Sony holds a minority stake', countryId: 'jp', locationId: 'jp-13-tokyo', city: 'Tokyo', founded: 1945,
    leadership: [{ name: 'Takeshi Natsuno', title: 'Chief Executive Officer', source: 'https://www.animenewsnetwork.com/news/2026-07-09/kadokawa-ceo-takeshi-natsuno-retains-positions-after-shareholder-vote/.239012', note: 'Kept his seat through an activist vote in June 2026.' }],
    description: 'A publisher first: its films and anime come from its own novels, manga and games.',
    formats: ['feature', 'series'], distributes: true,
    accessDifficulty: 72, riskAppetite: 48, prestigeBias: 40, distributionReach: 0.7, avoids: ['western'],
    fallback: { wants: ['animation', 'fantasy', 'horror', 'drama', 'romance'], budgetFloor: 1 * M, budgetCeiling: 20 * M, slateSize: 15 }, maxBudget: 40 * M,
  },
  {
    id: 'cj-enm', name: 'CJ ENM', shortName: 'CJ ENM', type: 'international', aliases: ['CJ Entertainment', 'Studio Dragon'], parent: { name: 'CJ Group' }, ownership: 'Public company', countryId: 'kr', locationId: 'kr-11-seoul', city: 'Seoul', founded: 1995,
    leadership: [
      { name: 'Koo Chang-gun', title: 'Chief Executive Officer, Entertainment Division', source: 'https://www.imdb.com/news/ni63803926/' },
      { name: 'Jung Hyun-joo', title: 'Head Of Film', source: 'https://www.screendaily.com/news/koreas-cj-enm-recruits-acemaker-ceo-jung-hyun-joo-to-lead-film-division/5202754.article' },
      { name: 'Miky Lee', title: 'Vice Chair, CJ Group' },
    ],
    description: 'Korea\'s biggest studio and the producer of Parasite. Studio Dragon makes the dramas the world streams.',
    formats: ['feature', 'series', 'limited_series'], distributes: true,
    accessDifficulty: 82, riskAppetite: 56, prestigeBias: 62, distributionReach: 1.0, avoids: ['western'],
    fallback: { wants: ['thriller', 'drama', 'crime', 'action', 'comedy'], budgetFloor: 3 * M, budgetCeiling: 30 * M, slateSize: 10 }, maxBudget: 60 * M,
  },
  {
    id: 'lotte', name: 'Lotte Entertainment', shortName: 'Lotte', type: 'international', parent: { name: 'Lotte Cultureworks, Lotte Group' }, ownership: 'Part of a conglomerate', countryId: 'kr', locationId: 'kr-11-seoul', city: 'Seoul', founded: 2003,
    leadership: [{ name: 'Choi Byung-hwan', title: 'Chief Executive Officer, Lotte Cultureworks', source: 'https://en.wikipedia.org/wiki/Lotte_Cultureworks' }],
    description: 'Korea\'s second circuit and a distributor with a taste for the big domestic event film.',
    formats: ['feature'], distributes: true,
    accessDifficulty: 74, riskAppetite: 48, prestigeBias: 40, distributionReach: 0.9, avoids: ['western'],
    fallback: { wants: ['action', 'thriller', 'drama', 'comedy', 'crime'], budgetFloor: 3 * M, budgetCeiling: 25 * M, slateSize: 8 }, maxBudget: 50 * M,
  },
  {
    id: 'showbox', name: 'Showbox', shortName: 'Showbox', type: 'international', parent: { name: 'Orion Group' }, ownership: 'Public company', countryId: 'kr', locationId: 'kr-11-seoul', city: 'Seoul', founded: 1999,
    leadership: [{ name: 'Kim Do-soo', title: 'Chief Executive Officer', source: 'https://en.namu.wiki/w/%EC%87%BC%EB%B0%95%EC%8A%A4', note: 'Since March 2026. One source names Shin Ho-jung; verify before relying on it.' }],
    description: 'The Korean distributor behind Taegukgi, The Host and Train to Busan\'s era of genre hits.',
    formats: ['feature'], distributes: true,
    accessDifficulty: 70, riskAppetite: 58, prestigeBias: 44, distributionReach: 0.8, avoids: ['western'],
    fallback: { wants: ['thriller', 'action', 'crime', 'drama', 'horror'], budgetFloor: 2 * M, budgetCeiling: 20 * M, slateSize: 6 }, maxBudget: 40 * M,
  },
  {
    id: 'studiocanal', name: 'StudioCanal', shortName: 'StudioCanal', type: 'international', parent: { name: 'Canal+ Group, controlled by Bolloré' }, ownership: 'Division of a public company', countryId: 'fr', locationId: 'fr-11-issylesmoulineaux', city: 'Issy-les-Moulineaux', founded: 1988,
    leadership: [
      { name: 'Anna Marsh', title: 'Chief Executive Officer, Also Deputy Chief Executive Officer And Chief Content Officer Of Canal+', source: 'https://www.screendaily.com/news/canal-names-anna-marsh-chief-content-officer/5204024.article' },
      { name: 'Maxime Saada', title: 'Chief Executive Officer, Canal+', source: 'https://www.screendaily.com/news/canal-names-anna-marsh-chief-content-officer/5204024.article' },
    ],
    description: 'Europe\'s biggest studio: Paddington, a library of thousands, and distribution in France, the UK, Germany and beyond.',
    formats: ['feature', 'series', 'limited_series'], distributes: true,
    accessDifficulty: 80, riskAppetite: 46, prestigeBias: 58, distributionReach: 0.95, avoids: [],
    fallback: { wants: ['family', 'comedy', 'thriller', 'drama', 'action'], budgetFloor: 3 * M, budgetCeiling: 60 * M, slateSize: 12 }, maxBudget: 120 * M,
  },
  {
    id: 'pathe', name: 'Pathé', shortName: 'Pathé', type: 'international', aliases: ['Pathé Films'], ownership: 'Independent, controlled by Jérôme Seydoux', countryId: 'fr', locationId: 'fr-idf-paris', city: 'Paris', founded: 1896,
    leadership: [
      { name: 'Jérôme Seydoux', title: 'President, Pathé Group', source: 'https://ecran-total.fr/2026/05/15/ardavan-safaee-president-de-pathe-films-avoir-cinq-films-en-selection-officielle-cest-exceptionnel/' },
      { name: 'Ardavan Safaee', title: 'President, Pathé Films', source: 'https://ecran-total.fr/2026/05/15/ardavan-safaee-president-de-pathe-films-avoir-cinq-films-en-selection-officielle-cest-exceptionnel/' },
    ],
    description: 'The oldest film company still making films. Big French productions and a Cannes presence every year.',
    formats: ['feature'], distributes: true,
    accessDifficulty: 78, riskAppetite: 50, prestigeBias: 66, distributionReach: 0.9, avoids: ['western'],
    fallback: { wants: ['drama', 'comedy', 'biography', 'thriller', 'adventure'], budgetFloor: 3 * M, budgetCeiling: 50 * M, slateSize: 10 }, maxBudget: 100 * M,
  },
  {
    id: 'gaumont', name: 'Gaumont', shortName: 'Gaumont', type: 'international', ownership: 'Controlled by the Seydoux family, going private in 2026', countryId: 'fr', locationId: 'fr-11-neuillysurseine', city: 'Neuilly-sur-Seine', founded: 1895,
    status: 'The family is buying out the remaining public shareholders in 2026.',
    leadership: [
      { name: 'Nicolas Seydoux', title: 'Chairman', source: 'https://variety.com/2026/film/global/gaumont-buyout-offer-french-regulator-shareholder-standoff-1236696511/' },
      { name: 'Sidonie Dumas', title: 'Chief Executive Officer', source: 'https://variety.com/2026/film/global/gaumont-buyout-offer-french-regulator-shareholder-standoff-1236696511/' },
    ],
    description: 'France\'s other founding studio, with a television business as big as its films.',
    formats: ['feature', 'series'], distributes: true,
    accessDifficulty: 76, riskAppetite: 48, prestigeBias: 60, distributionReach: 0.85, avoids: ['western'],
    fallback: { wants: ['comedy', 'drama', 'thriller', 'animation', 'crime'], budgetFloor: 2 * M, budgetCeiling: 40 * M, slateSize: 8 }, maxBudget: 80 * M,
  },
  {
    id: 'constantin', name: 'Constantin Film', shortName: 'Constantin', type: 'international', parent: { name: 'Highlight Communications' }, ownership: 'Subsidiary of a listed company', countryId: 'de', locationId: 'de-02-munich', city: 'Munich', founded: 1950,
    leadership: [{ name: 'Oliver Berben', title: 'Chairman And Chief Executive Officer', source: 'https://www.dwdl.de/nachrichten/95696/constantin_film_oliver_berben_folgt_als_ceo_auf_martin_moszkowicz/' }],
    description: 'Germany\'s biggest producer, from Resident Evil to the year\'s top German comedy.',
    formats: ['feature', 'series'], distributes: true,
    accessDifficulty: 72, riskAppetite: 50, prestigeBias: 44, distributionReach: 0.85, avoids: ['western'],
    fallback: { wants: ['comedy', 'drama', 'action', 'family', 'thriller'], budgetFloor: 2 * M, budgetCeiling: 40 * M, slateSize: 10 }, maxBudget: 80 * M,
  },
  {
    id: 'working-title', name: 'Working Title Films', shortName: 'Working Title', type: 'producer', parent: { name: 'Universal Pictures, so NBCUniversal and Comcast' }, ownership: 'Subsidiary of a public company', countryId: 'uk', locationId: 'uk-eng-london', city: 'London', founded: 1983,
    leadership: [
      { name: 'Tim Bevan', title: 'Co-Chairman', source: 'https://www.screendaily.com/features/the-brit-50-working-title-films/5210547.article' },
      { name: 'Eric Fellner', title: 'Co-Chairman', source: 'https://www.screendaily.com/features/the-brit-50-working-title-films/5210547.article' },
    ],
    description: 'Britain\'s most successful production company: Bridget Jones, Bond-adjacent prestige and Wicked.',
    formats: ['feature', 'series'], distributes: false,
    accessDifficulty: 80, riskAppetite: 44, prestigeBias: 62, distributionReach: 0.0, avoids: ['horror'],
    fallback: { wants: ['comedy', 'romance', 'drama', 'biography', 'musical'], budgetFloor: 8 * M, budgetCeiling: 120 * M, slateSize: 5 }, maxBudget: 200 * M,
  },
  {
    id: 'film4', name: 'Film4 Productions', shortName: 'Film4', type: 'producer', aliases: ['Film4', 'Channel Four Films'], parent: { name: 'Channel Four Television Corporation' }, ownership: 'Publicly owned broadcaster', countryId: 'uk', locationId: 'uk-eng-london', city: 'London', founded: 1982,
    leadership: [{ name: 'Ollie Madden', title: 'Director Of Film4', source: 'https://www.screendaily.com/news/pressure-mounts-for-uk-indie-tax-relief-as-film4-bbc-film-bosses-talk-to-film-committee/5190887.article' }],
    description: 'Development money for the British film that becomes the year\'s awards contender.',
    formats: ['feature', 'documentary'], distributes: false,
    accessDifficulty: 56, riskAppetite: 74, prestigeBias: 88, distributionReach: 0.0, avoids: ['action', 'family'],
    fallback: { wants: ['drama', 'comedy', 'horror', 'biography', 'crime'], budgetFloor: 1 * M, budgetCeiling: 15 * M, slateSize: 10 }, maxBudget: 30 * M,
  },
  {
    id: 'bbc-film', name: 'BBC Film', shortName: 'BBC Film', type: 'producer', aliases: ['BBC Films'], parent: { name: 'The BBC' }, ownership: 'Public broadcaster', countryId: 'uk', locationId: 'uk-eng-london', city: 'London', founded: 1990,
    leadership: [{ name: 'Eva Yates', title: 'Director Of BBC Film', source: 'https://www.screendaily.com/news/pressure-mounts-for-uk-indie-tax-relief-as-film4-bbc-film-bosses-talk-to-film-committee/5190887.article' }],
    description: 'The BBC\'s film arm, co-financing a dozen British features a year.',
    formats: ['feature', 'documentary'], distributes: false,
    accessDifficulty: 54, riskAppetite: 66, prestigeBias: 84, distributionReach: 0.0, avoids: ['action', 'horror'],
    fallback: { wants: ['drama', 'biography', 'comedy', 'romance', 'documentary'], budgetFloor: 1 * M, budgetCeiling: 12 * M, slateSize: 10 }, maxBudget: 25 * M,
  },
  {
    id: 'yash-raj', name: 'Yash Raj Films', shortName: 'YRF', type: 'international', aliases: ['YRF'], ownership: 'Privately held by the Chopra family', countryId: 'in', locationId: 'in-16-mumbai', city: 'Mumbai', founded: 1970,
    leadership: [
      { name: 'Aditya Chopra', title: 'Chairman And Managing Director' },
      { name: 'Akshaye Widhani', title: 'Chief Executive Officer', source: 'https://www.yashrajfilms.com/about-us/the-professionals/akshaye-widhani' },
    ],
    description: 'Hindi cinema\'s biggest studio, with its own spy universe and its own distribution.',
    formats: ['feature', 'series'], distributes: true,
    accessDifficulty: 82, riskAppetite: 42, prestigeBias: 40, distributionReach: 1.0, avoids: ['western', 'horror'],
    fallback: { wants: ['action', 'romance', 'drama', 'comedy', 'musical'], budgetFloor: 3 * M, budgetCeiling: 40 * M, slateSize: 6 }, maxBudget: 60 * M,
  },
  {
    id: 'dharma', name: 'Dharma Productions', shortName: 'Dharma', type: 'international', ownership: 'Karan Johar and Adar Poonawalla\'s Serene Productions, half each since 2024', countryId: 'in', locationId: 'in-16-mumbai', city: 'Mumbai', founded: 1976,
    leadership: [
      { name: 'Karan Johar', title: 'Executive Chair', source: 'https://deadline.com/2024/10/karan-johar-dharma-productions-sells-stake-adar-poonawalla-1236121685/' },
      { name: 'Apoorva Mehta', title: 'Chief Executive Officer', source: 'https://deadline.com/2024/10/karan-johar-dharma-productions-sells-stake-adar-poonawalla-1236121685/' },
    ],
    description: 'Glossy Hindi romance and family drama at the top of the market.',
    formats: ['feature', 'series'], distributes: false,
    accessDifficulty: 78, riskAppetite: 44, prestigeBias: 42, distributionReach: 0.0, avoids: ['western', 'horror'],
    fallback: { wants: ['romance', 'drama', 'comedy', 'family', 'musical'], budgetFloor: 3 * M, budgetCeiling: 30 * M, slateSize: 5 }, maxBudget: 50 * M,
  },
  {
    id: 't-series', name: 'T-Series', shortName: 'T-Series', type: 'international', parent: { name: 'Super Cassettes Industries' }, ownership: 'Privately held by Bhushan Kumar', countryId: 'in', locationId: 'in-36-noida', city: 'Noida', founded: 1983,
    catalogueNote: 'A fraction of T-Series\' several hundred productions is linked to it on Wikidata.',
    leadership: [{ name: 'Bhushan Kumar', title: 'Chairman And Managing Director', source: 'https://www.tseries.com/about-us' }],
    description: 'The music label that became one of India\'s most prolific film producers.',
    formats: ['feature'], distributes: true,
    accessDifficulty: 68, riskAppetite: 56, prestigeBias: 30, distributionReach: 0.8, avoids: ['western'],
    fallback: { wants: ['romance', 'drama', 'musical', 'thriller', 'comedy'], budgetFloor: 1 * M, budgetCeiling: 25 * M, slateSize: 12 }, maxBudget: 40 * M,
  },
  {
    id: 'red-chillies', name: 'Red Chillies Entertainment', shortName: 'Red Chillies', type: 'international', ownership: 'Privately held by Shah Rukh Khan and Gauri Khan', countryId: 'in', locationId: 'in-16-mumbai', city: 'Mumbai', founded: 2002,
    leadership: [{ name: 'Venky Mysore', title: 'Chief Executive Officer', source: 'https://www.redchillies.com/the-company' }],
    description: 'Shah Rukh Khan\'s company, with a visual effects house that works for everyone else too.',
    formats: ['feature', 'series'], distributes: false,
    accessDifficulty: 80, riskAppetite: 40, prestigeBias: 42, distributionReach: 0.0, avoids: ['western'],
    fallback: { wants: ['action', 'drama', 'romance', 'thriller', 'comedy'], budgetFloor: 3 * M, budgetCeiling: 40 * M, slateSize: 3 }, maxBudget: 60 * M,
  },
  {
    id: 'china-film', name: 'China Film Group', shortName: 'China Film', type: 'international', aliases: ['China Film Group Corporation', 'China Film Co.'], ownership: 'State owned', countryId: 'cn', locationId: 'cn-22-beijing', city: 'Beijing', founded: 1999,
    catalogueNote: 'Only a fraction of China Film Group\'s output is linked to it on Wikidata.',
    leadership: [{ name: 'Fu Ruoqing', title: 'Chairman', source: 'http://www.china.org.cn/arts/2025-03/10/content_117758075.htm' }],
    description: 'The state\'s studio and the gatekeeper for every imported film in the world\'s second market.',
    formats: ['feature', 'series'], distributes: true,
    accessDifficulty: 96, riskAppetite: 20, prestigeBias: 40, distributionReach: 1.0, avoids: ['horror', 'experimental', 'western'],
    fallback: { wants: ['war', 'drama', 'action', 'animation', 'biography'], budgetFloor: 5 * M, budgetCeiling: 80 * M, slateSize: 15 }, maxBudget: 200 * M,
  },
  {
    id: 'bona', name: 'Bona Film Group', shortName: 'Bona', type: 'international', ownership: 'Public company, listed in Shenzhen', countryId: 'cn', locationId: 'cn-22-beijing', city: 'Beijing', founded: 1999,
    catalogueNote: 'Wikidata links very few titles directly to Bona, so this catalogue is far shorter than the studio\'s real output.',
    leadership: [{ name: 'Yu Dong', title: 'Founder, Chairman And Chief Executive Officer', source: 'https://en.wikipedia.org/wiki/Bona_Film_Group' }],
    description: 'Patriotic blockbusters made with Hong Kong craft: Operation Red Sea, The Battle at Lake Changjin.',
    formats: ['feature'], distributes: true,
    accessDifficulty: 88, riskAppetite: 36, prestigeBias: 34, distributionReach: 0.9, avoids: ['horror', 'western'],
    fallback: { wants: ['action', 'war', 'drama', 'crime', 'thriller'], budgetFloor: 5 * M, budgetCeiling: 80 * M, slateSize: 6 }, maxBudget: 200 * M,
  },
  {
    id: 'huayi', name: 'Huayi Brothers', shortName: 'Huayi', type: 'international', ownership: 'Public company, listed in Shenzhen, in restructuring since 2026', countryId: 'cn', locationId: 'cn-22-beijing', city: 'Beijing', founded: 1994,
    status: 'A creditor petitioned for restructuring in April 2026. Treat it as distressed.',
    leadership: [
      { name: 'Wang Zhongjun', title: 'Chairman', source: 'https://finance.biggo.com/news/5cy4lp0Bga3fZL9MuaZW' },
      { name: 'Wang Zhonglei', title: 'Vice Chairman And Chief Executive Officer', source: 'https://finance.biggo.com/news/5cy4lp0Bga3fZL9MuaZW' },
    ],
    description: 'The first private Chinese studio to matter, now fighting to stay solvent.',
    formats: ['feature', 'series'], distributes: true,
    accessDifficulty: 70, riskAppetite: 30, prestigeBias: 44, distributionReach: 0.6, avoids: ['horror', 'western'],
    fallback: { wants: ['drama', 'comedy', 'action', 'crime', 'romance'], budgetFloor: 2 * M, budgetCeiling: 30 * M, slateSize: 4 }, maxBudget: 60 * M,
  },
  {
    id: 'ruyi', name: 'Ruyi Film Entertainment', shortName: 'Ruyi Film', type: 'international', aliases: ['Wanda Pictures', 'Wanda Media', 'Wanda Film'], parent: { name: 'China Ruyi, controlled by Ke Liming', note: 'Wanda Film, renamed in 2026 after China Ruyi took control.' }, ownership: 'Public company', countryId: 'cn', locationId: 'cn-22-beijing', city: 'Beijing', founded: 2009,
    catalogueNote: 'The renamed studio inherits Wanda\'s record, of which Wikidata holds only a handful of titles.',
    leadership: [{ name: 'Chen Zhixi', title: 'Chair', source: 'https://www.screendaily.com/news/chinas-wanda-film-renamed-ruyi-film-entertainment/5215967.article' }],
    description: 'The former Wanda studio and China\'s biggest cinema circuit, under new ownership and a new name.',
    formats: ['feature', 'series'], distributes: true,
    accessDifficulty: 84, riskAppetite: 40, prestigeBias: 36, distributionReach: 1.0, avoids: ['horror', 'western'],
    fallback: { wants: ['comedy', 'action', 'drama', 'fantasy', 'family'], budgetFloor: 5 * M, budgetCeiling: 60 * M, slateSize: 8 }, maxBudget: 150 * M,
  },
  {
    id: 'enlight', name: 'Enlight Media', shortName: 'Enlight', type: 'international', aliases: ['Beijing Enlight Pictures', 'Coloroom Pictures'], ownership: 'Public company, listed in Shenzhen', countryId: 'cn', locationId: 'cn-22-beijing', city: 'Beijing', founded: 1998,
    leadership: [{ name: 'Wang Changtian', title: 'Chairman', source: 'https://www.hollywoodreporter.com/movies/movie-news/2026-shanghai-film-festival-takeaways-1236626719/' }],
    description: 'The studio behind Ne Zha, the highest-grossing animated film ever made.',
    formats: ['feature'], distributes: true,
    accessDifficulty: 86, riskAppetite: 44, prestigeBias: 38, distributionReach: 0.9, avoids: ['horror', 'western'],
    fallback: { wants: ['animation', 'fantasy', 'comedy', 'romance', 'drama'], budgetFloor: 5 * M, budgetCeiling: 80 * M, slateSize: 8 }, maxBudget: 200 * M,
  },
  {
    id: 'emperor', name: 'Emperor Motion Pictures', shortName: 'Emperor', type: 'international', parent: { name: 'Emperor Group' }, ownership: 'Part of a private conglomerate', countryId: 'hk', locationId: 'hk-hongkong', city: 'Hong Kong', founded: 2000,
    leadership: [{ name: 'Albert Yeung', title: 'Chairman, Emperor Group', source: 'https://variety.com/2026/film/markets-festivals/crouching-tiger-producer-bill-kong-berlin-efm-1236639147/' }],
    description: 'Hong Kong action and crime with mainland co-financing.',
    formats: ['feature'], distributes: true,
    accessDifficulty: 68, riskAppetite: 50, prestigeBias: 38, distributionReach: 0.8, avoids: ['western'],
    fallback: { wants: ['action', 'crime', 'thriller', 'comedy', 'drama'], budgetFloor: 2 * M, budgetCeiling: 30 * M, slateSize: 5 }, maxBudget: 60 * M,
  },
  {
    id: 'edko', name: 'Edko Films', shortName: 'Edko', type: 'international', ownership: 'Privately held by Bill Kong', countryId: 'hk', locationId: 'hk-hongkong', city: 'Hong Kong', founded: 1979,
    leadership: [{ name: 'Bill Kong', title: 'Chairman', source: 'https://variety.com/2026/film/markets-festivals/crouching-tiger-producer-bill-kong-berlin-efm-1236639147/' }],
    description: 'Crouching Tiger, Hero and the Hong Kong producer most trusted by international partners.',
    formats: ['feature'], distributes: true,
    accessDifficulty: 66, riskAppetite: 54, prestigeBias: 66, distributionReach: 0.7, avoids: ['western'],
    fallback: { wants: ['action', 'drama', 'fantasy', 'crime', 'romance'], budgetFloor: 2 * M, budgetCeiling: 40 * M, slateSize: 4 }, maxBudget: 80 * M,
  },
  {
    id: 'alcon', name: 'Alcon Entertainment', shortName: 'Alcon', type: 'producer', aliases: ['Village Roadshow Pictures'], ownership: 'Privately held, now holding the Village Roadshow Pictures library after its 2025 bankruptcy', countryId: 'us', locationId: 'us-ca-losangeles', city: 'Los Angeles', founded: 1997,
    status: 'Bought the Village Roadshow Pictures studio and its 108-film library out of bankruptcy, effective May 1, 2026.',
    leadership: [
      { name: 'Andrew Kosove', title: 'Co-Founder And Co-Chief Executive Officer' },
      { name: 'Broderick Johnson', title: 'Co-Founder And Co-Chief Executive Officer' },
    ],
    description: 'Blade Runner 2049, The Blind Side, and now the Matrix and Ocean\'s co-financier\'s library.',
    formats: ['feature', 'series'], distributes: false,
    accessDifficulty: 76, riskAppetite: 48, prestigeBias: 50, distributionReach: 0.0, avoids: ['horror'],
    fallback: { wants: ['science fiction', 'drama', 'action', 'thriller', 'family'], budgetFloor: 15 * M, budgetCeiling: 150 * M, slateSize: 3 }, maxBudget: 200 * M,
  },
  {
    id: 'nordisk', name: 'Nordisk Film', shortName: 'Nordisk', type: 'international', parent: { name: 'Egmont' }, ownership: 'Owned by a foundation', countryId: 'dk', locationId: 'dk-17-copenhagen', city: 'Copenhagen', founded: 1906,
    leadership: [
      { name: 'Allan Mathson Hansen', title: 'Chief Executive Officer', source: 'https://nordiskfilm.com/news/strong-year-egmont-media-group' },
      { name: 'Katrine Vogelsang', title: 'Chief Executive Officer, Nordisk Film Production', source: 'https://nordiskfilm.com/news/strong-year-egmont-media-group' },
    ],
    description: 'The oldest studio still operating, and the Nordic region\'s biggest producer and distributor.',
    formats: ['feature', 'series'], distributes: true,
    accessDifficulty: 64, riskAppetite: 52, prestigeBias: 62, distributionReach: 0.9, avoids: ['western'],
    fallback: { wants: ['drama', 'comedy', 'thriller', 'family', 'crime'], budgetFloor: 1 * M, budgetCeiling: 12 * M, slateSize: 10 }, maxBudget: 25 * M,
  },
  {
    id: 'sf-studios', name: 'SF Studios', shortName: 'SF Studios', type: 'international', aliases: ['Svensk Filmindustri'], parent: { name: 'Bonnier' }, ownership: 'Privately held media group', countryId: 'se', locationId: 'se-26-stockholm', city: 'Stockholm', founded: 1919,
    leadership: [{ name: 'Iréne Lindblad', title: 'Chief Executive Officer', source: 'https://www.bonnier.com/en/news/irene-lindblad-new-ceo-of-sf-studios/' }],
    description: 'Bergman\'s old studio, now the Nordic region\'s other major.',
    formats: ['feature', 'series'], distributes: true,
    accessDifficulty: 62, riskAppetite: 50, prestigeBias: 60, distributionReach: 0.85, avoids: ['western'],
    fallback: { wants: ['drama', 'comedy', 'thriller', 'crime', 'family'], budgetFloor: 1 * M, budgetCeiling: 12 * M, slateSize: 8 }, maxBudget: 25 * M,
  },
  {
    id: 'globo', name: 'Globo Filmes', shortName: 'Globo Filmes', type: 'international', parent: { name: 'Grupo Globo' }, ownership: 'Privately held media group', countryId: 'br', locationId: 'br-21-riodejaneiro', city: 'Rio de Janeiro', founded: 1998,
    leadership: [{ name: 'Simone Oliveira', title: 'Managing Director', source: 'https://variety.com/2026/film/global/globo-filmes-glauber-rocha-fernanda-torres-1236745560/' }],
    description: 'Brazil\'s biggest co-producer, behind most of the domestic hits of the last two decades.',
    formats: ['feature', 'series'], distributes: false,
    accessDifficulty: 66, riskAppetite: 48, prestigeBias: 52, distributionReach: 0.0, avoids: ['western'],
    fallback: { wants: ['comedy', 'drama', 'biography', 'romance', 'crime'], budgetFloor: 1 * M, budgetCeiling: 10 * M, slateSize: 15 }, maxBudget: 20 * M,
  },
  {
    id: 'videocine', name: 'Videocine', shortName: 'Videocine', type: 'international', parent: { name: 'Grupo Televisa' }, ownership: 'Division of a public company', countryId: 'mx', locationId: 'mx-cmx-mexicocity', city: 'Mexico City', founded: 1979,
    catalogueNote: 'Wikidata records only a few of Videocine\'s releases; the studio\'s real output is far larger.',
    leadership: [{ name: 'Rodrigo de Pedro Barreto', title: 'General Director' }],
    description: 'Televisa\'s film arm and the biggest Mexican distributor of Mexican films.',
    formats: ['feature'], distributes: true,
    accessDifficulty: 60, riskAppetite: 46, prestigeBias: 38, distributionReach: 0.85, avoids: ['western'],
    fallback: { wants: ['comedy', 'romance', 'drama', 'family', 'thriller'], budgetFloor: 1 * M, budgetCeiling: 8 * M, slateSize: 10 }, maxBudget: 20 * M,
  },
  {
    id: 'filmone', name: 'FilmOne Entertainment', shortName: 'FilmOne', type: 'international', parent: { name: 'Filmhouse Group' }, ownership: 'Privately held', countryId: 'ng', locationId: 'ng-05-lagos', city: 'Lagos', founded: 2013,
    catalogueNote: 'Nollywood is thinly recorded on Wikidata; this is a fraction of FilmOne\'s real slate.',
    leadership: [{ name: 'Kene Okwuosa', title: 'Group Managing Director And Chief Executive Officer, Filmhouse Group', source: 'https://nairametrics.com/2026/02/22/meet-the-owners-of-nigerias-largest-cinemas/' }],
    description: 'Nollywood\'s biggest distributor, with the Filmhouse cinema circuit behind it.',
    formats: ['feature'], distributes: true,
    accessDifficulty: 50, riskAppetite: 60, prestigeBias: 36, distributionReach: 0.9, avoids: ['western'],
    fallback: { wants: ['comedy', 'drama', 'romance', 'thriller', 'crime'], budgetFloor: 100_000_00, budgetCeiling: 2 * M, slateSize: 15 }, maxBudget: 5 * M,
  },
  {
    id: 'ebonylife', name: 'EbonyLife', shortName: 'EbonyLife', type: 'international', aliases: ['EbonyLife Films', 'EbonyLife Studios'], ownership: 'Privately held by Mo Abudu', countryId: 'ng', locationId: 'ng-05-lagos', city: 'Lagos', founded: 2013,
    catalogueNote: 'Nollywood is thinly recorded on Wikidata; this is a fraction of EbonyLife\'s real slate.',
    leadership: [{ name: 'Mo Abudu', title: 'Founder And Chief Executive Officer', source: 'https://nairametrics.com/2026/02/22/meet-the-owners-of-nigerias-largest-cinemas/' }],
    description: 'Nigeria\'s most internationally connected studio, with Netflix and Sony deals and a London home opening in 2026.',
    formats: ['feature', 'series'], distributes: false,
    accessDifficulty: 56, riskAppetite: 62, prestigeBias: 48, distributionReach: 0.0, avoids: ['western'],
    fallback: { wants: ['drama', 'comedy', 'romance', 'thriller', 'biography'], budgetFloor: 100_000_00, budgetCeiling: 3 * M, slateSize: 5 }, maxBudget: 8 * M,
  },
];

function build(seed: StudioSeed): Studio {
  const stats = STUDIO_STATS[seed.id];
  const labels = STUDIO_LABELS[seed.id] ?? [];
  const shares = stats ? Object.entries(stats.genreShares).filter(([g, share]) => share >= 0.1 && !seed.avoids.includes(g)) : [];
  const wants = shares.length >= 2 ? shares.slice(0, 6).map(([g]) => g) : seed.fallback.wants;
  const budgetsMeasured = !!stats && stats.budgetSample >= 6 && stats.budgetLow !== null && stats.budgetHigh !== null;
  const budgetFloor = budgetsMeasured ? Math.max(100_000_00, Math.round((stats.budgetLow as number) * 100)) : seed.fallback.budgetFloor;
  const budgetCeiling = budgetsMeasured ? Math.min(seed.maxBudget, Math.max(budgetFloor * 2, Math.round((stats.budgetHigh as number) * 100))) : seed.fallback.budgetCeiling;
  const slateMeasured = !!stats && stats.filmsPerYear >= 1;
  const slateSize = slateMeasured ? Math.round(stats.filmsPerYear) : seed.fallback.slateSize;
  return {
    ...seed,
    type: seed.type,
    aliases: seed.aliases,
    source: 'public_reference', confidence: 'high', version: V,
    note: 'Identity, home and leadership from the public record; behaviour calibrated by SLATE from the studio\'s own catalogue.',
    labels, stats, wants, budgetFloor, budgetCeiling, slateSize,
    measured: { wants: shares.length >= 2, budgets: budgetsMeasured, slate: slateMeasured },
  };
}

export const STUDIOS = new Registry<Studio>('studios', SEEDS.map(build));

export const STUDIO_TIER_LABEL: Readonly<Record<StudioTier, string>> = {
  major: 'The Majors',
  mini_major: 'Mini-Majors',
  streamer: 'Streamers',
  specialty: 'Specialty And Independent',
  producer: 'Producers Without Distribution',
  international: 'International Majors',
};

export const STUDIO_TIER_ORDER: readonly StudioTier[] = ['major', 'mini_major', 'streamer', 'specialty', 'producer', 'international'];

/** The studio a real title belongs to, by the label that produced or released it. */
export function studioForLabel(labelName: string): Studio | undefined {
  const wanted = labelName.toLowerCase();
  for (const studio of STUDIOS.all()) {
    if (studio.labels.some((l) => l.name.toLowerCase() === wanted)) return studio;
  }
  return undefined;
}
