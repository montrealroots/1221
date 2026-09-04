/**
 * SLATE — The entertainment industry registry.
 *
 * Every studio, network, streamer, agency, exhibitor, award body and festival
 * here is ORIGINAL TO SLATE and marked `simulated`. That is deliberate: the
 * game generates greenlight decisions, box-office results, award outcomes and
 * corporate behaviour, and attributing invented business decisions to real
 * companies would present fiction as fact. The structures are modelled on how
 * the real industry works; the names and the actions are SLATE's own.
 */

import { Registry, REFERENCE_VERSION, type ReferenceRecord } from './reference';
import type { Money } from '../core/money';


const V = REFERENCE_VERSION;
const SIM = {
  source: 'simulated', confidence: 'high', version: V,
  note: 'Original to SLATE. Not a real company.',
} as const;

export interface Buyer extends ReferenceRecord {
  type: 'studio' | 'network' | 'streamer' | 'mini_major' | 'indie';
  locationId: string;
  /** Largest single-project budget they will commit to, in cents. */
  budgetCeiling: Money;
  /** Smallest project they will look at. */
  budgetFloor: Money;
  /** 0-100 appetite for risk and unusual material. */
  riskAppetite: number;
  /** 0-100 how much prestige matters relative to commercial return. */
  prestigeBias: number;
  /** Genres they actively want. */
  wants: string[];
  /** Genres they will not buy. */
  avoids: string[];
  formats: ('feature' | 'series' | 'limited_series' | 'documentary' | 'tv_movie')[];
  /** Projects they release per year, bounding how much they can absorb. */
  slateSize: number;
  /** 0-100 how hard they are to get a meeting with. */
  accessDifficulty: number;
  /** Distribution reach: fraction of a wide release they can achieve. */
  distributionReach: number;
  description: string;
}

export const BUYERS = new Registry<Buyer>('buyers', [
  { id: 'meridian', name: 'Meridian Pictures', type: 'studio', locationId: 'us-ca-burbank', budgetCeiling: 300_000_000_00, budgetFloor: 25_000_000_00, riskAppetite: 32, prestigeBias: 40, wants: ['action', 'adventure', 'science fiction', 'family', 'thriller'], avoids: ['experimental'], formats: ['feature', 'series'], slateSize: 14, accessDifficulty: 92, distributionReach: 1.0, description: 'The biggest of the majors. Four tentpoles a year and a library that pays for everything else.', ...SIM },
  { id: 'crestwood', name: 'Crestwood Studios', type: 'studio', locationId: 'us-ca-losangeles', budgetCeiling: 220_000_000_00, budgetFloor: 15_000_000_00, riskAppetite: 45, prestigeBias: 58, wants: ['drama', 'thriller', 'biography', 'crime', 'adventure'], avoids: [], formats: ['feature', 'series', 'limited_series'], slateSize: 12, accessDifficulty: 88, distributionReach: 0.95, description: 'A major with a prestige habit. Wins awards and occasionally loses money doing it.', ...SIM },
  { id: 'halcyon', name: 'Halcyon Entertainment', type: 'studio', locationId: 'us-ca-burbank', budgetCeiling: 180_000_000_00, budgetFloor: 20_000_000_00, riskAppetite: 25, prestigeBias: 22, wants: ['family', 'animation', 'comedy', 'adventure'], avoids: ['horror', 'crime'], formats: ['feature', 'series'], slateSize: 10, accessDifficulty: 90, distributionReach: 0.98, description: 'Four-quadrant family entertainment and the merchandising machine behind it.', ...SIM },
  { id: 'northgate', name: 'Northgate Films', type: 'mini_major', locationId: 'us-ny-newyork', budgetCeiling: 60_000_000_00, budgetFloor: 4_000_000_00, riskAppetite: 68, prestigeBias: 82, wants: ['drama', 'comedy', 'biography', 'romance', 'crime'], avoids: ['action'], formats: ['feature', 'limited_series', 'documentary'], slateSize: 16, accessDifficulty: 70, distributionReach: 0.55, description: 'Specialty label. Buys at festivals, campaigns hard, and has a shelf of statues to show for it.', ...SIM },
  { id: 'brightline', name: 'Brightline Pictures', type: 'mini_major', locationId: 'us-ca-losangeles', budgetCeiling: 45_000_000_00, budgetFloor: 2_000_000_00, riskAppetite: 78, prestigeBias: 45, wants: ['horror', 'thriller', 'science fiction', 'comedy'], avoids: [], formats: ['feature'], slateSize: 18, accessDifficulty: 52, distributionReach: 0.62, description: 'Low budgets, high margins, and a horror slate that funds everything else.', ...SIM },
  { id: 'tessellate', name: 'Tessellate', type: 'streamer', locationId: 'us-ca-losangeles', budgetCeiling: 200_000_000_00, budgetFloor: 3_000_000_00, riskAppetite: 62, prestigeBias: 50, wants: ['thriller', 'drama', 'documentary', 'science fiction', 'romance', 'comedy'], avoids: [], formats: ['feature', 'series', 'limited_series', 'documentary'], slateSize: 60, accessDifficulty: 74, distributionReach: 0.0, description: 'The volume player. Buys everything, releases everything, and tells nobody what worked.', ...SIM },
  { id: 'lumenplus', name: 'Lumen+', type: 'streamer', locationId: 'us-wa-seattle', budgetCeiling: 150_000_000_00, budgetFloor: 8_000_000_00, riskAppetite: 44, prestigeBias: 66, wants: ['drama', 'limited_series', 'biography', 'science fiction'], avoids: ['horror'], formats: ['series', 'limited_series', 'feature'], slateSize: 28, accessDifficulty: 80, distributionReach: 0.0, description: 'Fewer, bigger swings. Wants the show people talk about, not the show people finish.', ...SIM },
  { id: 'atlasnet', name: 'Atlas Network', type: 'network', locationId: 'us-ny-newyork', budgetCeiling: 12_000_000_00, budgetFloor: 1_500_000_00, riskAppetite: 28, prestigeBias: 34, wants: ['crime', 'medical', 'comedy', 'family', 'legal'], avoids: ['experimental', 'horror'], formats: ['series', 'tv_movie'], slateSize: 22, accessDifficulty: 66, distributionReach: 0.0, description: 'Broadcast. Twenty-two episodes, a timeslot and a lead-in that decides your fate.', ...SIM },
  { id: 'vertexcable', name: 'Vertex', type: 'network', locationId: 'us-ny-newyork', budgetCeiling: 20_000_000_00, budgetFloor: 2_500_000_00, riskAppetite: 72, prestigeBias: 88, wants: ['drama', 'crime', 'science fiction', 'limited_series'], avoids: ['family'], formats: ['series', 'limited_series'], slateSize: 8, accessDifficulty: 84, distributionReach: 0.0, description: 'Premium cable. Ten episodes, no notes worth the name, and a habit of making careers.', ...SIM },
  { id: 'pinewharf', name: 'Pine Wharf Media', type: 'indie', locationId: 'us-ga-atlanta', budgetCeiling: 8_000_000_00, budgetFloor: 250_000_00, riskAppetite: 88, prestigeBias: 55, wants: ['horror', 'drama', 'thriller', 'documentary'], avoids: [], formats: ['feature', 'documentary'], slateSize: 12, accessDifficulty: 26, distributionReach: 0.18, description: 'Where a first feature actually gets made. Small money, real credits.', ...SIM },
  { id: 'sablefox', name: 'Sable & Fox', type: 'indie', locationId: 'uk-eng-london', budgetCeiling: 15_000_000_00, budgetFloor: 500_000_00, riskAppetite: 82, prestigeBias: 78, wants: ['drama', 'biography', 'romance', 'documentary'], avoids: ['action'], formats: ['feature', 'limited_series', 'documentary'], slateSize: 9, accessDifficulty: 44, distributionReach: 0.24, description: 'British independent with a taste for uncomfortable subject matter and European co-financing.', ...SIM },
]);

export interface Agency extends ReferenceRecord {
  type: 'agency' | 'management' | 'law' | 'publicity';
  locationId: string;
  tier: 1 | 2 | 3;
  /** Minimum fame or demand needed before they will sign you. */
  signingThreshold: number;
  commission: number;
  /** Multiplier on opportunity flow for their clients. */
  opportunityMultiplier: number;
  dealQuality: number;
  description: string;
}

export const AGENCIES = new Registry<Agency>('agencies', [
  { id: 'summit_talent', name: 'Summit Talent Group', aliases: ['STG'], type: 'agency', locationId: 'us-ca-santamonica', tier: 1, signingThreshold: 62, commission: 0.10, opportunityMultiplier: 2.4, dealQuality: 94, description: 'The biggest agency in the business. Signing here changes what you get offered.', ...SIM },
  { id: 'ironwood', name: 'Ironwood Partners', type: 'agency', locationId: 'us-ca-losangeles', tier: 1, signingThreshold: 58, commission: 0.10, opportunityMultiplier: 2.2, dealQuality: 90, description: 'Aggressive, packaging-obsessed, and very good at getting money out of studios.', ...SIM },
  { id: 'kestrel', name: 'Kestrel Agency', type: 'agency', locationId: 'us-ny-newyork', tier: 2, signingThreshold: 34, commission: 0.10, opportunityMultiplier: 1.6, dealQuality: 74, description: 'Mid-size, theatre-literate, and genuinely returns calls.', ...SIM },
  { id: 'brightpath', name: 'Brightpath Talent', type: 'agency', locationId: 'us-ga-atlanta', tier: 3, signingThreshold: 12, commission: 0.10, opportunityMultiplier: 1.2, dealQuality: 52, description: 'Boutique regional agency. Will sign you before anyone else will.', ...SIM },
  { id: 'halloway_mgmt', name: 'Halloway Management', type: 'management', locationId: 'us-ca-losangeles', tier: 1, signingThreshold: 44, commission: 0.15, opportunityMultiplier: 1.5, dealQuality: 86, description: 'Managers who develop careers rather than book jobs. Expensive and worth it.', ...SIM },
  { id: 'renshaw_mgmt', name: 'Renshaw & Co.', type: 'management', locationId: 'us-ca-losangeles', tier: 2, signingThreshold: 18, commission: 0.15, opportunityMultiplier: 1.25, dealQuality: 66, description: 'Small management shop with a good eye and a full slate.', ...SIM },
  { id: 'blackwell_law', name: 'Blackwell Entertainment Law', type: 'law', locationId: 'us-ca-losangeles', tier: 1, signingThreshold: 0, commission: 0.05, opportunityMultiplier: 1.0, dealQuality: 92, description: 'Reads the contract properly. The five percent that saves you far more than five percent.', ...SIM },
  { id: 'vantage_pr', name: 'Vantage Publicity', type: 'publicity', locationId: 'us-ca-losangeles', tier: 1, signingThreshold: 40, commission: 0, opportunityMultiplier: 1.0, dealQuality: 90, description: 'Crisis management, awards campaigns, and keeping your name out of things.', ...SIM },
  { id: 'foldpress', name: 'Fold Press', type: 'publicity', locationId: 'us-ny-newyork', tier: 2, signingThreshold: 15, commission: 0, opportunityMultiplier: 1.0, dealQuality: 68, description: 'Monthly retainer, solid trade relationships, no miracles.', ...SIM },
]);

export interface ExhibitorChain extends ReferenceRecord {
  type: 'exhibitor';
  locationId: string;
  screens: number;
  /** Fraction of domestic box office this chain represents. */
  marketShare: number;
  /** Fraction of ticket revenue the exhibitor keeps in week one. */
  openingWeekSplit: number;
  premiumFormats: string[];
  description: string;
}

export const EXHIBITORS = new Registry<ExhibitorChain>('exhibitors', [
  { id: 'grandview', name: 'Grandview Cinemas', type: 'exhibitor', locationId: 'us-ca-losangeles', screens: 8400, marketShare: 0.32, openingWeekSplit: 0.45, premiumFormats: ['Grandview XL', 'Laser Premium'], description: 'The largest circuit. If they do not book you, you are not in wide release.', ...SIM },
  { id: 'cineport', name: 'Cineport Theatres', type: 'exhibitor', locationId: 'us-tx-dallas', screens: 6100, marketShare: 0.24, openingWeekSplit: 0.46, premiumFormats: ['PortMAX', 'Recliner Plus'], description: 'Suburban multiplexes and the reliable middle of the market.', ...SIM },
  { id: 'lantern', name: 'Lantern Picture Houses', type: 'exhibitor', locationId: 'us-ny-newyork', screens: 1450, marketShare: 0.07, openingWeekSplit: 0.42, premiumFormats: ['70mm', 'Lantern Reserve'], description: 'Arthouse and repertory. Where a platform release actually starts.', ...SIM },
  { id: 'orbit', name: 'Orbit Entertainment', type: 'exhibitor', locationId: 'us-fl-miami', screens: 3900, marketShare: 0.16, openingWeekSplit: 0.47, premiumFormats: ['Orbit Dome'], description: 'Aggressive on premium formats and aggressive on terms.', ...SIM },
]);

// The award bodies and festivals are the real ones now: see content/events-data,
// content/award-bodies and content/festival-rules.

export const GENRES = [
  'action', 'adventure', 'animation', 'biography', 'comedy', 'crime', 'documentary',
  'drama', 'family', 'fantasy', 'horror', 'legal', 'medical', 'musical', 'mystery',
  'romance', 'science fiction', 'sport', 'thriller', 'war', 'western', 'experimental',
] as const;

export type Genre = (typeof GENRES)[number];

/** Base audience appetite by genre, 0-100. Feeds greenlight and box office. */
export const GENRE_APPETITE: Readonly<Record<string, number>> = {
  action: 78, adventure: 76, animation: 72, biography: 48, comedy: 68, crime: 62,
  documentary: 32, drama: 54, family: 74, fantasy: 66, horror: 70, legal: 44,
  medical: 42, musical: 46, mystery: 56, romance: 58, 'science fiction': 74,
  sport: 48, thriller: 68, war: 44, western: 34, experimental: 14,
};

/** Typical budget band by genre, as a multiplier on a baseline. */
export const GENRE_BUDGET_INDEX: Readonly<Record<string, number>> = {
  action: 2.6, adventure: 2.4, animation: 2.2, biography: 0.7, comedy: 0.6, crime: 0.8,
  documentary: 0.15, drama: 0.6, family: 1.4, fantasy: 2.2, horror: 0.25, legal: 0.6,
  medical: 0.6, musical: 1.2, mystery: 0.7, romance: 0.5, 'science fiction': 2.0,
  sport: 0.8, thriller: 0.8, war: 1.8, western: 1.1, experimental: 0.2,
};

export const DEPARTMENTS = [
  'production', 'direction', 'camera', 'grip', 'electric', 'art', 'set_decoration',
  'construction', 'costume', 'hair_makeup', 'sound', 'stunts', 'special_effects',
  'transportation', 'locations', 'catering', 'script', 'editorial', 'vfx', 'music', 'post_sound',
] as const;
