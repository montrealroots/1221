/**
 * SLATE — The entertainment industry registry.
 *
 * The studios are the real ones (content/studios), with their real catalogues
 * behind them (content/filmography). The game generates greenlight decisions,
 * box-office results and corporate behaviour inside a save; everything up to
 * the day the save starts is the record, and everything after is SLATE, and
 * the interface says which is which.
 *
 * The networks are the real ones too (content/networks). The agencies and
 * exhibitor chains below are still SLATE's own placeholders, marked
 * `simulated`, until their own steps.
 */

import { Registry, REFERENCE_VERSION, type ReferenceRecord } from './reference';
import type { Money } from '../core/money';
import { STUDIOS, type Studio } from './studios';
import { NETWORKS, type Network } from './networks';
import { GENRES_FULL, GENRE_ALIASES, GENRE_IDS, genre } from './genres';


const V = REFERENCE_VERSION;
const SIM = {
  source: 'simulated', confidence: 'high', version: V,
  note: 'Original to SLATE. Not a real company. A placeholder until its own step.',
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
  /** Set when the buyer is a real studio in the registry. */
  studioId?: string;
  /** Set when the buyer is a real network or service in the registry. */
  networkId?: string;
}

function buyerOf(studio: Studio): Buyer {
  const type: Buyer['type'] = studio.type === 'major' || studio.type === 'international' ? 'studio'
    : studio.type === 'streamer' ? 'streamer'
    : studio.type === 'mini_major' ? 'mini_major'
    : 'indie';
  return {
    id: studio.id, name: studio.name, aliases: studio.aliases, type, locationId: studio.locationId,
    budgetCeiling: studio.budgetCeiling, budgetFloor: studio.budgetFloor,
    riskAppetite: studio.riskAppetite, prestigeBias: studio.prestigeBias,
    wants: studio.wants, avoids: studio.avoids, formats: studio.formats, slateSize: studio.slateSize,
    accessDifficulty: studio.accessDifficulty, distributionReach: studio.distributionReach,
    description: studio.description, studioId: studio.id,
    source: 'calibrated_estimate', confidence: 'medium', version: V,
    note: 'A real studio. Its taste and budgets are measured from its own catalogue where the record allows and estimated by SLATE where it does not.',
  };
}

function buyerOfNetwork(network: Network): Buyer {
  return {
    id: network.id, name: network.name, aliases: network.aliases, type: network.type === 'streaming' ? 'streamer' : 'network', locationId: network.countryId === 'us' ? 'us-ca-losangeles' : 'us-ny-newyork',
    budgetCeiling: network.budgetCeiling, budgetFloor: network.budgetFloor,
    riskAppetite: network.riskAppetite, prestigeBias: network.prestigeBias,
    wants: network.wants, avoids: network.avoids, formats: network.formats, slateSize: network.slateSize,
    accessDifficulty: network.accessDifficulty, distributionReach: 0,
    description: network.description, networkId: network.id,
    source: 'calibrated_estimate', confidence: 'medium', version: V,
    note: 'A real network. What it commissions and what it pays are SLATE\'s calibration from the public record.',
  };
}

export const BUYERS = new Registry<Buyer>('buyers', [...STUDIOS.all().map(buyerOf), ...NETWORKS.all().map(buyerOfNetwork)]);

/** The fictional buyers earlier saves may still point at, by id, with the real name they map to for history. */
export const LEGACY_BUYER_NAMES: Readonly<Record<string, string>> = {
  meridian: 'Meridian Pictures', crestwood: 'Crestwood Studios', halcyon: 'Halcyon Entertainment', northgate: 'Northgate Films',
  brightline: 'Brightline Pictures', tessellate: 'Tessellate', lumenplus: 'Lumen+', pinewharf: 'Pine Wharf Media', sablefox: 'Sable & Fox',
  atlasnet: 'Atlas Network', vertexcable: 'Vertex',
};

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

// The award bodies and festivals are the real ones: see content/events-data,
// content/award-bodies and content/festival-rules.

/**
 * The genres a project may be built from. The full list, with what each one
 * is and what makes it good, lives in content/genres; this re-exports the
 * ids so everything that already asked this module keeps working.
 */
export const GENRES: readonly string[] = GENRE_IDS;

export type Genre = string;

/** Base audience appetite by genre, 0-100. Feeds greenlight and box office. */
export const GENRE_APPETITE: Readonly<Record<string, number>> = Object.fromEntries([
  ...GENRES_FULL.map((g) => [g.id, g.appetite]),
  ...Object.entries(GENRE_ALIASES).map(([alias, id]) => [alias, genre(id)?.appetite ?? 45]),
]);

/** Typical budget band by genre, as a multiplier on a baseline. */
export const GENRE_BUDGET_INDEX: Readonly<Record<string, number>> = Object.fromEntries([
  ...GENRES_FULL.map((g) => [g.id, g.budgetIndex]),
  ...Object.entries(GENRE_ALIASES).map(([alias, id]) => [alias, genre(id)?.budgetIndex ?? 0.8]),
]);

export const DEPARTMENTS = [
  'production', 'direction', 'camera', 'grip', 'electric', 'art', 'set_decoration',
  'construction', 'costume', 'hair_makeup', 'sound', 'stunts', 'special_effects',
  'transportation', 'locations', 'catering', 'script', 'editorial', 'vfx', 'music', 'post_sound',
] as const;
