/**
 * SLATE — the shops that actually exist.
 *
 * Every chain and house in this file is a real business, named as public
 * record, in the markets it really trades in. What is SLATE's own, and says
 * so on screen, is everything the game needs and the record cannot supply:
 * whether a branch stands in a particular SLATE-generated city, what any
 * given branch has on the rail this fortnight, and the price on the ticket.
 * Placing a branch is a calibration from the chain's real market and the
 * city's size; it is never a claim that a shop is at that address.
 *
 * No endorsement, affiliation or sponsorship is implied by any name here,
 * and nothing in this file describes a real company's conduct.
 */

import { Registry, REFERENCE_VERSION, type ReferenceRecord } from './reference';

const V = REFERENCE_VERSION;

/** A real company, named from public record. */
const REAL = { source: 'public_reference', confidence: 'high', version: V, note: 'Real company, named as public record. Branch placement, stock and prices are SLATE\'s own.' } as const;

export const REAL_RETAILER_NOTE = 'A real chain. Whether it has a branch here, what is on the rail and what it costs are SLATE\'s calibration, not the shop\'s.';

export type RetailerType =
  | 'grocery' | 'convenience' | 'warehouse' | 'department' | 'highstreet' | 'boutique' | 'maison'
  | 'footwear' | 'sportswear' | 'electronics' | 'furniture' | 'homeware' | 'jeweller' | 'watch'
  | 'bookshop' | 'pharmacy' | 'hardware' | 'gallery' | 'online';

export interface RealRetailer extends ReferenceRecord {
  type: 'retailer';
  kind: RetailerType;
  /** 1 = discount, 5 = by appointment. */
  tier: 1 | 2 | 3 | 4 | 5;
  /** Multiplier on a catalogue item's base price. SLATE's calibration. */
  priceMultiplier: number;
  categories: string[];
  /**
   * Country codes the chain really trades in, matched against a city id's
   * prefix. Empty means it trades widely enough that SLATE does not gate it.
   */
  markets: string[];
  /** Only these cities, for a house that really is flagship-only. */
  flagshipCities?: string[];
  /** Smallest city population SLATE will put a branch in. */
  minimumCity: number;
  online: boolean;
  deliveryDays: number;
  /** What it is, in one line of plain public fact. */
  description: string;
}

function shop(spec: Omit<RealRetailer, 'type' | 'source' | 'confidence' | 'version' | 'note'>): RealRetailer {
  return { ...spec, type: 'retailer', ...REAL };
}

const ANY = [] as string[];
const EU = ['fr', 'de', 'it', 'es', 'nl', 'be', 'at', 'ch', 'pt', 'ie', 'se', 'dk', 'no', 'fi', 'pl', 'cz'];
const ANGLO = ['us', 'uk', 'ca', 'au', 'nz', 'ie'];
const WORLD_CITIES = [
  'us-ca-losangeles', 'us-ny-newyork', 'uk-eng-london', 'fr-idf-paris', 'it-lom-milan', 'it-laz-rome',
  'jp-13-tokyo', 'ae-du-dubai', 'hk-hk-hongkong', 'sg-sg-singapore', 'ch-ge-geneva', 'us-fl-miami',
];

export const REAL_RETAILERS: readonly RealRetailer[] = [
  // --- Groceries: the weekly shop -------------------------------------------------------------
  shop({ id: 'whole_foods', name: 'Whole Foods Market', kind: 'grocery', tier: 4, priceMultiplier: 1.38, categories: ['groceries', 'household', 'prepared'], markets: ['us', 'uk', 'ca'], minimumCity: 120_000, online: true, deliveryDays: 1, description: 'Natural and organic grocery chain, owned by Amazon since 2017.' }),
  shop({ id: 'trader_joes', name: "Trader Joe's", kind: 'grocery', tier: 2, priceMultiplier: 0.94, categories: ['groceries', 'prepared'], markets: ['us'], minimumCity: 90_000, online: false, deliveryDays: 0, description: 'Own-label American grocery chain with a short, rotating range.' }),
  shop({ id: 'kroger', name: 'Kroger', kind: 'grocery', tier: 2, priceMultiplier: 0.98, categories: ['groceries', 'household', 'pharmacy'], markets: ['us'], minimumCity: 40_000, online: true, deliveryDays: 1, description: 'One of the largest supermarket operators in the United States.' }),
  shop({ id: 'safeway', name: 'Safeway', kind: 'grocery', tier: 2, priceMultiplier: 1.02, categories: ['groceries', 'household', 'pharmacy'], markets: ['us', 'ca'], minimumCity: 40_000, online: true, deliveryDays: 1, description: 'American supermarket chain, part of the Albertsons group.' }),
  shop({ id: 'publix', name: 'Publix', kind: 'grocery', tier: 3, priceMultiplier: 1.08, categories: ['groceries', 'household', 'prepared'], markets: ['us'], minimumCity: 50_000, online: true, deliveryDays: 1, description: 'Employee-owned supermarket chain of the American southeast.' }),
  shop({ id: 'wegmans', name: 'Wegmans', kind: 'grocery', tier: 3, priceMultiplier: 1.06, categories: ['groceries', 'household', 'prepared'], markets: ['us'], minimumCity: 90_000, online: true, deliveryDays: 1, description: 'Family-owned supermarket chain of the American northeast.' }),
  shop({ id: 'heb', name: 'H-E-B', kind: 'grocery', tier: 2, priceMultiplier: 0.96, categories: ['groceries', 'household', 'prepared'], markets: ['us'], minimumCity: 60_000, online: true, deliveryDays: 1, description: 'Texas grocery chain, privately held and locally dominant.' }),
  shop({ id: 'aldi', name: 'Aldi', kind: 'grocery', tier: 1, priceMultiplier: 0.72, categories: ['groceries', 'household'], markets: ['de', 'uk', 'us', 'au', 'fr', 'ie', 'nl', 'at', 'pl', 'es', 'it'], minimumCity: 25_000, online: false, deliveryDays: 0, description: 'German hard-discount grocer trading in much of Europe, the United States and Australia.' }),
  shop({ id: 'lidl', name: 'Lidl', kind: 'grocery', tier: 1, priceMultiplier: 0.74, categories: ['groceries', 'household'], markets: ['de', 'uk', 'us', 'fr', 'es', 'it', 'pl', 'ie', 'nl', 'be', 'pt', 'se', 'fi'], minimumCity: 25_000, online: false, deliveryDays: 0, description: 'German hard-discount grocer, part of the Schwarz Group.' }),
  shop({ id: 'tesco', name: 'Tesco', kind: 'grocery', tier: 2, priceMultiplier: 0.92, categories: ['groceries', 'household', 'clothing', 'electronics'], markets: ['uk', 'ie', 'cz', 'sk', 'hu'], minimumCity: 15_000, online: true, deliveryDays: 1, description: 'The largest supermarket chain in the United Kingdom.' }),
  shop({ id: 'sainsburys', name: "Sainsbury's", kind: 'grocery', tier: 2, priceMultiplier: 0.98, categories: ['groceries', 'household', 'clothing'], markets: ['uk'], minimumCity: 15_000, online: true, deliveryDays: 1, description: 'British supermarket chain founded in 1869.' }),
  shop({ id: 'waitrose', name: 'Waitrose & Partners', kind: 'grocery', tier: 4, priceMultiplier: 1.28, categories: ['groceries', 'household', 'prepared'], markets: ['uk'], minimumCity: 40_000, online: true, deliveryDays: 1, description: 'Employee-owned British supermarket, part of the John Lewis Partnership.' }),
  shop({ id: 'marks_spencer', name: 'Marks & Spencer', kind: 'department', tier: 3, priceMultiplier: 1.18, categories: ['groceries', 'clothing', 'home', 'prepared'], markets: ['uk', 'ie'], minimumCity: 30_000, online: true, deliveryDays: 2, description: 'British retailer selling own-label clothing, homeware and food.' }),
  shop({ id: 'morrisons', name: 'Morrisons', kind: 'grocery', tier: 2, priceMultiplier: 0.93, categories: ['groceries', 'household'], markets: ['uk'], minimumCity: 20_000, online: true, deliveryDays: 1, description: 'British supermarket chain with its own food manufacturing.' }),
  shop({ id: 'carrefour', name: 'Carrefour', kind: 'grocery', tier: 2, priceMultiplier: 0.95, categories: ['groceries', 'household', 'electronics', 'clothing'], markets: ['fr', 'es', 'it', 'be', 'pl', 'br', 'ar', 'ro'], minimumCity: 20_000, online: true, deliveryDays: 2, description: 'French multinational grocery group, one of the largest in Europe.' }),
  shop({ id: 'monoprix', name: 'Monoprix', kind: 'grocery', tier: 3, priceMultiplier: 1.16, categories: ['groceries', 'household', 'clothing', 'home'], markets: ['fr'], minimumCity: 40_000, online: true, deliveryDays: 1, description: 'French city-centre chain selling food, clothing and homeware.' }),
  shop({ id: 'mercadona', name: 'Mercadona', kind: 'grocery', tier: 2, priceMultiplier: 0.88, categories: ['groceries', 'household'], markets: ['es', 'pt'], minimumCity: 20_000, online: true, deliveryDays: 1, description: 'The largest supermarket chain in Spain, privately held.' }),
  shop({ id: 'esselunga', name: 'Esselunga', kind: 'grocery', tier: 3, priceMultiplier: 1.04, categories: ['groceries', 'household', 'prepared'], markets: ['it'], minimumCity: 30_000, online: true, deliveryDays: 1, description: 'Northern Italian supermarket chain, privately held.' }),
  shop({ id: 'rewe', name: 'REWE', kind: 'grocery', tier: 2, priceMultiplier: 0.96, categories: ['groceries', 'household'], markets: ['de', 'at'], minimumCity: 20_000, online: true, deliveryDays: 1, description: 'German supermarket cooperative and one of the country\'s largest grocers.' }),
  shop({ id: 'edeka', name: 'EDEKA', kind: 'grocery', tier: 2, priceMultiplier: 0.97, categories: ['groceries', 'household'], markets: ['de'], minimumCity: 15_000, online: false, deliveryDays: 0, description: 'German cooperative of independently owned supermarkets.' }),
  shop({ id: 'migros', name: 'Migros', kind: 'grocery', tier: 2, priceMultiplier: 1.05, categories: ['groceries', 'household', 'home'], markets: ['ch'], minimumCity: 15_000, online: true, deliveryDays: 1, description: 'Swiss retail cooperative and the country\'s largest supermarket chain.' }),
  shop({ id: 'coles', name: 'Coles', kind: 'grocery', tier: 2, priceMultiplier: 0.99, categories: ['groceries', 'household'], markets: ['au'], minimumCity: 20_000, online: true, deliveryDays: 1, description: 'Australian supermarket chain, listed since its 2018 demerger from Wesfarmers.' }),
  shop({ id: 'woolworths_au', name: 'Woolworths', kind: 'grocery', tier: 2, priceMultiplier: 1.01, categories: ['groceries', 'household'], markets: ['au', 'nz'], minimumCity: 20_000, online: true, deliveryDays: 1, description: 'Australian supermarket chain and the country\'s largest grocery retailer.' }),
  shop({ id: 'loblaws', name: 'Loblaws', kind: 'grocery', tier: 3, priceMultiplier: 1.06, categories: ['groceries', 'household', 'pharmacy'], markets: ['ca'], minimumCity: 25_000, online: true, deliveryDays: 1, description: 'Canadian supermarket chain, part of Loblaw Companies.' }),
  shop({ id: 'seven_eleven', name: '7-Eleven', kind: 'convenience', tier: 2, priceMultiplier: 1.34, categories: ['groceries', 'prepared', 'household'], markets: ANY, minimumCity: 5_000, online: false, deliveryDays: 0, description: 'International convenience-store chain, majority owned by Seven & i Holdings.' }),
  shop({ id: 'familymart', name: 'FamilyMart', kind: 'convenience', tier: 2, priceMultiplier: 1.30, categories: ['groceries', 'prepared'], markets: ['jp', 'tw', 'th', 'cn', 'my'], minimumCity: 10_000, online: false, deliveryDays: 0, description: 'Japanese convenience-store chain.' }),
  shop({ id: 'lawson', name: 'Lawson', kind: 'convenience', tier: 2, priceMultiplier: 1.30, categories: ['groceries', 'prepared'], markets: ['jp', 'cn', 'th'], minimumCity: 10_000, online: false, deliveryDays: 0, description: 'Japanese convenience-store chain.' }),

  // --- Warehouse and general ------------------------------------------------------------------
  shop({ id: 'costco', name: 'Costco Wholesale', kind: 'warehouse', tier: 2, priceMultiplier: 0.78, categories: ['groceries', 'household', 'electronics', 'clothing', 'appliance', 'watch'], markets: ['us', 'ca', 'uk', 'jp', 'kr', 'au', 'mx', 'es', 'fr'], minimumCity: 120_000, online: true, deliveryDays: 3, description: 'Membership warehouse club selling in bulk.' }),
  shop({ id: 'target', name: 'Target', kind: 'department', tier: 2, priceMultiplier: 0.95, categories: ['groceries', 'household', 'clothing', 'home', 'electronics'], markets: ['us'], minimumCity: 40_000, online: true, deliveryDays: 2, description: 'American general-merchandise chain.' }),
  shop({ id: 'walmart', name: 'Walmart', kind: 'warehouse', tier: 1, priceMultiplier: 0.82, categories: ['groceries', 'household', 'clothing', 'electronics', 'home', 'appliance'], markets: ['us', 'ca', 'mx'], minimumCity: 15_000, online: true, deliveryDays: 2, description: 'The largest retailer in the world by revenue.' }),

  // --- Department stores ----------------------------------------------------------------------
  shop({ id: 'nordstrom', name: 'Nordstrom', kind: 'department', tier: 4, priceMultiplier: 1.42, categories: ['clothing', 'footwear', 'accessory', 'home', 'jewelry'], markets: ['us', 'ca'], minimumCity: 250_000, online: true, deliveryDays: 3, description: 'American luxury department store, founded in Seattle as a shoe shop.' }),
  shop({ id: 'saks', name: 'Saks Fifth Avenue', kind: 'department', tier: 5, priceMultiplier: 1.72, categories: ['clothing', 'footwear', 'accessory', 'jewelry', 'watch'], markets: ['us', 'ca'], minimumCity: 400_000, online: true, deliveryDays: 3, description: 'American luxury department store, founded on Fifth Avenue in 1924.' }),
  shop({ id: 'bloomingdales', name: "Bloomingdale's", kind: 'department', tier: 4, priceMultiplier: 1.46, categories: ['clothing', 'footwear', 'accessory', 'home'], markets: ['us', 'ae'], minimumCity: 300_000, online: true, deliveryDays: 3, description: 'American department store chain, owned by Macy\'s, Inc.' }),
  shop({ id: 'macys', name: "Macy's", kind: 'department', tier: 3, priceMultiplier: 1.16, categories: ['clothing', 'footwear', 'accessory', 'home', 'appliance'], markets: ['us'], minimumCity: 120_000, online: true, deliveryDays: 3, description: 'American department store chain with its flagship at Herald Square.' }),
  shop({ id: 'neiman_marcus', name: 'Neiman Marcus', kind: 'department', tier: 5, priceMultiplier: 1.76, categories: ['clothing', 'footwear', 'accessory', 'jewelry', 'watch'], markets: ['us'], minimumCity: 400_000, online: true, deliveryDays: 3, description: 'American luxury department store, founded in Dallas in 1907.' }),
  shop({ id: 'selfridges', name: 'Selfridges', kind: 'department', tier: 5, priceMultiplier: 1.74, categories: ['clothing', 'footwear', 'accessory', 'jewelry', 'watch', 'home'], markets: ['uk'], minimumCity: 400_000, online: true, deliveryDays: 3, description: 'British department store, opened on Oxford Street in 1909.' }),
  shop({ id: 'harrods', name: 'Harrods', kind: 'department', tier: 5, priceMultiplier: 1.88, categories: ['clothing', 'footwear', 'accessory', 'jewelry', 'watch', 'home', 'groceries'], markets: ['uk'], flagshipCities: ['uk-eng-london'], minimumCity: 0, online: true, deliveryDays: 3, description: 'Knightsbridge department store, trading since 1849.' }),
  shop({ id: 'harvey_nichols', name: 'Harvey Nichols', kind: 'department', tier: 5, priceMultiplier: 1.70, categories: ['clothing', 'footwear', 'accessory', 'home'], markets: ['uk', 'ie'], minimumCity: 400_000, online: true, deliveryDays: 3, description: 'British luxury department store, founded in 1831.' }),
  shop({ id: 'liberty', name: 'Liberty', kind: 'department', tier: 5, priceMultiplier: 1.68, categories: ['clothing', 'accessory', 'home'], markets: ['uk'], flagshipCities: ['uk-eng-london'], minimumCity: 0, online: true, deliveryDays: 3, description: 'London department store known for its Tudor-revival building and its prints.' }),
  shop({ id: 'john_lewis', name: 'John Lewis', kind: 'department', tier: 3, priceMultiplier: 1.20, categories: ['clothing', 'home', 'electronics', 'appliance', 'furniture'], markets: ['uk'], minimumCity: 80_000, online: true, deliveryDays: 3, description: 'Employee-owned British department store chain.' }),
  shop({ id: 'fortnum', name: 'Fortnum & Mason', kind: 'department', tier: 5, priceMultiplier: 1.80, categories: ['groceries', 'home', 'accessory'], markets: ['uk'], flagshipCities: ['uk-eng-london'], minimumCity: 0, online: true, deliveryDays: 3, description: 'Piccadilly grocer and department store, trading since 1707.' }),
  shop({ id: 'galeries_lafayette', name: 'Galeries Lafayette', kind: 'department', tier: 4, priceMultiplier: 1.52, categories: ['clothing', 'footwear', 'accessory', 'home', 'groceries'], markets: ['fr'], minimumCity: 150_000, online: true, deliveryDays: 4, description: 'French department store group with its flagship on Boulevard Haussmann.' }),
  shop({ id: 'bon_marche', name: 'Le Bon Marché', kind: 'department', tier: 5, priceMultiplier: 1.78, categories: ['clothing', 'footwear', 'accessory', 'home', 'groceries'], markets: ['fr'], flagshipCities: ['fr-idf-paris'], minimumCity: 0, online: true, deliveryDays: 4, description: 'Left Bank department store, part of LVMH, opened in the nineteenth century.' }),
  shop({ id: 'printemps', name: 'Printemps', kind: 'department', tier: 4, priceMultiplier: 1.56, categories: ['clothing', 'footwear', 'accessory', 'home'], markets: ['fr'], minimumCity: 150_000, online: true, deliveryDays: 4, description: 'French department store group founded in 1865.' }),
  shop({ id: 'rinascente', name: 'La Rinascente', kind: 'department', tier: 4, priceMultiplier: 1.58, categories: ['clothing', 'footwear', 'accessory', 'home'], markets: ['it'], minimumCity: 200_000, online: false, deliveryDays: 0, description: 'Italian upmarket department store chain.' }),
  shop({ id: 'corte_ingles', name: 'El Corte Inglés', kind: 'department', tier: 3, priceMultiplier: 1.30, categories: ['clothing', 'footwear', 'home', 'electronics', 'groceries'], markets: ['es', 'pt'], minimumCity: 100_000, online: true, deliveryDays: 3, description: 'The largest department store group in Europe by revenue.' }),
  shop({ id: 'kadewe', name: 'KaDeWe', kind: 'department', tier: 5, priceMultiplier: 1.74, categories: ['clothing', 'footwear', 'accessory', 'groceries', 'home'], markets: ['de'], minimumCity: 500_000, online: false, deliveryDays: 0, description: 'Berlin department store, opened in 1907 and the largest on the continent.' }),
  shop({ id: 'isetan', name: 'Isetan', kind: 'department', tier: 5, priceMultiplier: 1.66, categories: ['clothing', 'footwear', 'accessory', 'groceries', 'home'], markets: ['jp', 'sg', 'my'], minimumCity: 300_000, online: false, deliveryDays: 0, description: 'Japanese department store chain, part of Isetan Mitsukoshi Holdings.' }),
  shop({ id: 'takashimaya', name: 'Takashimaya', kind: 'department', tier: 5, priceMultiplier: 1.62, categories: ['clothing', 'footwear', 'accessory', 'groceries', 'home'], markets: ['jp', 'sg', 'vn'], minimumCity: 300_000, online: false, deliveryDays: 0, description: 'Japanese department store chain founded in Kyoto in 1831.' }),
  shop({ id: 'david_jones', name: 'David Jones', kind: 'department', tier: 4, priceMultiplier: 1.40, categories: ['clothing', 'footwear', 'accessory', 'home'], markets: ['au'], minimumCity: 150_000, online: true, deliveryDays: 3, description: 'Australian department store chain, trading since 1838.' }),
  shop({ id: 'holt_renfrew', name: 'Holt Renfrew', kind: 'department', tier: 5, priceMultiplier: 1.70, categories: ['clothing', 'footwear', 'accessory', 'jewelry'], markets: ['ca'], minimumCity: 400_000, online: true, deliveryDays: 3, description: 'Canadian luxury department store chain, founded in Quebec City in 1837.' }),

  // --- High street clothing --------------------------------------------------------------------
  shop({ id: 'zara', name: 'Zara', kind: 'highstreet', tier: 2, priceMultiplier: 1.00, categories: ['clothing', 'footwear', 'accessory'], markets: ANY, minimumCity: 60_000, online: true, deliveryDays: 3, description: 'Spanish fast-fashion chain, the flagship brand of Inditex.' }),
  shop({ id: 'hm', name: 'H&M', kind: 'highstreet', tier: 1, priceMultiplier: 0.76, categories: ['clothing', 'footwear', 'accessory', 'home'], markets: ANY, minimumCity: 50_000, online: true, deliveryDays: 4, description: 'Swedish fast-fashion chain, founded in Västerås in 1947.' }),
  shop({ id: 'uniqlo', name: 'Uniqlo', kind: 'highstreet', tier: 2, priceMultiplier: 0.88, categories: ['clothing', 'footwear'], markets: ANY, minimumCity: 100_000, online: true, deliveryDays: 3, description: 'Japanese clothing chain, part of Fast Retailing.' }),
  shop({ id: 'cos', name: 'COS', kind: 'highstreet', tier: 3, priceMultiplier: 1.22, categories: ['clothing', 'footwear', 'accessory'], markets: ANY, minimumCity: 250_000, online: true, deliveryDays: 4, description: 'Minimalist clothing label owned by H&M Group.' }),
  shop({ id: 'arket', name: 'Arket', kind: 'highstreet', tier: 3, priceMultiplier: 1.18, categories: ['clothing', 'footwear', 'home'], markets: ['uk', 'se', 'de', 'fr', 'nl', 'be', 'dk', 'no', 'at', 'ch', 'es', 'it'], minimumCity: 250_000, online: true, deliveryDays: 4, description: 'Nordic clothing and homeware label owned by H&M Group.' }),
  shop({ id: 'massimo_dutti', name: 'Massimo Dutti', kind: 'highstreet', tier: 3, priceMultiplier: 1.26, categories: ['clothing', 'footwear', 'accessory'], markets: ANY, minimumCity: 150_000, online: true, deliveryDays: 4, description: 'Tailored clothing chain, part of Inditex.' }),
  shop({ id: 'mango', name: 'Mango', kind: 'highstreet', tier: 2, priceMultiplier: 0.92, categories: ['clothing', 'footwear', 'accessory'], markets: ANY, minimumCity: 80_000, online: true, deliveryDays: 4, description: 'Spanish clothing chain founded in Barcelona in 1984.' }),
  shop({ id: 'muji', name: 'Muji', kind: 'highstreet', tier: 2, priceMultiplier: 0.96, categories: ['clothing', 'home', 'household', 'furniture'], markets: ANY, minimumCity: 200_000, online: true, deliveryDays: 4, description: 'Japanese no-brand retailer of clothing, homeware and stationery.' }),
  shop({ id: 'gap', name: 'Gap', kind: 'highstreet', tier: 2, priceMultiplier: 0.90, categories: ['clothing', 'footwear'], markets: ['us', 'ca', 'uk', 'jp', 'fr', 'it', 'mx'], minimumCity: 80_000, online: true, deliveryDays: 4, description: 'American clothing chain founded in San Francisco in 1969.' }),
  shop({ id: 'jcrew', name: 'J.Crew', kind: 'highstreet', tier: 3, priceMultiplier: 1.14, categories: ['clothing', 'footwear', 'accessory'], markets: ['us', 'ca', 'uk'], minimumCity: 150_000, online: true, deliveryDays: 4, description: 'American clothing retailer known for its catalogue and its suiting.' }),
  shop({ id: 'everlane', name: 'Everlane', kind: 'highstreet', tier: 3, priceMultiplier: 1.04, categories: ['clothing', 'footwear', 'accessory'], markets: ['us'], minimumCity: 400_000, online: true, deliveryDays: 3, description: 'American clothing brand that publishes its cost breakdowns.' }),
  shop({ id: 'aritzia', name: 'Aritzia', kind: 'highstreet', tier: 3, priceMultiplier: 1.24, categories: ['clothing', 'footwear', 'accessory'], markets: ['ca', 'us'], minimumCity: 200_000, online: true, deliveryDays: 3, description: 'Canadian women\'s clothing retailer founded in Vancouver.' }),
  shop({ id: 'reiss', name: 'Reiss', kind: 'highstreet', tier: 3, priceMultiplier: 1.32, categories: ['clothing', 'footwear', 'accessory'], markets: ['uk', 'us', 'ie', 'ae'], minimumCity: 200_000, online: true, deliveryDays: 4, description: 'British clothing brand founded in London in 1971.' }),
  shop({ id: 'lululemon', name: 'Lululemon', kind: 'sportswear', tier: 3, priceMultiplier: 1.30, categories: ['clothing', 'footwear', 'equipment'], markets: ANY, minimumCity: 150_000, online: true, deliveryDays: 3, description: 'Canadian technical apparel company founded in Vancouver in 1998.' }),
  shop({ id: 'patagonia', name: 'Patagonia', kind: 'sportswear', tier: 3, priceMultiplier: 1.28, categories: ['clothing', 'footwear', 'equipment'], markets: ANY, minimumCity: 150_000, online: true, deliveryDays: 4, description: 'American outdoor clothing company, owned since 2022 by a trust and a non-profit.' }),
  shop({ id: 'north_face', name: 'The North Face', kind: 'sportswear', tier: 3, priceMultiplier: 1.20, categories: ['clothing', 'footwear', 'equipment'], markets: ANY, minimumCity: 120_000, online: true, deliveryDays: 4, description: 'American outdoor brand, part of VF Corporation.' }),
  shop({ id: 'levis', name: "Levi's", kind: 'highstreet', tier: 2, priceMultiplier: 1.00, categories: ['clothing', 'footwear', 'accessory'], markets: ANY, minimumCity: 100_000, online: true, deliveryDays: 4, description: 'American denim company, founded in San Francisco in 1853.' }),
  shop({ id: 'carhartt', name: 'Carhartt', kind: 'highstreet', tier: 2, priceMultiplier: 1.02, categories: ['clothing', 'footwear'], markets: ['us', 'ca', 'de', 'uk', 'fr', 'nl'], minimumCity: 100_000, online: true, deliveryDays: 4, description: 'American workwear company founded in Detroit in 1889.' }),

  // --- Houses ------------------------------------------------------------------------------------
  shop({ id: 'hermes', name: 'Hermès', kind: 'maison', tier: 5, priceMultiplier: 3.60, categories: ['clothing', 'accessory', 'footwear', 'watch', 'home'], markets: ANY, minimumCity: 700_000, online: true, deliveryDays: 5, description: 'French house founded in 1837, still controlled by the founding family.' }),
  shop({ id: 'chanel', name: 'Chanel', kind: 'maison', tier: 5, priceMultiplier: 3.40, categories: ['clothing', 'accessory', 'footwear', 'watch', 'jewelry'], markets: ANY, minimumCity: 700_000, online: false, deliveryDays: 0, description: 'French house founded by Gabrielle Chanel, privately held by the Wertheimer family.' }),
  shop({ id: 'louis_vuitton', name: 'Louis Vuitton', kind: 'maison', tier: 5, priceMultiplier: 3.20, categories: ['clothing', 'accessory', 'footwear', 'watch'], markets: ANY, minimumCity: 600_000, online: true, deliveryDays: 5, description: 'French house founded in 1854, the largest brand within LVMH.' }),
  shop({ id: 'gucci', name: 'Gucci', kind: 'maison', tier: 5, priceMultiplier: 2.90, categories: ['clothing', 'accessory', 'footwear', 'watch'], markets: ANY, minimumCity: 500_000, online: true, deliveryDays: 5, description: 'Florentine house founded in 1921, part of Kering.' }),
  shop({ id: 'prada', name: 'Prada', kind: 'maison', tier: 5, priceMultiplier: 2.80, categories: ['clothing', 'accessory', 'footwear'], markets: ANY, minimumCity: 500_000, online: true, deliveryDays: 5, description: 'Milanese house founded in 1913.' }),
  shop({ id: 'dior', name: 'Dior', kind: 'maison', tier: 5, priceMultiplier: 3.10, categories: ['clothing', 'accessory', 'footwear', 'jewelry'], markets: ANY, minimumCity: 600_000, online: true, deliveryDays: 5, description: 'Parisian house founded in 1946, part of LVMH.' }),
  shop({ id: 'saint_laurent', name: 'Saint Laurent', kind: 'maison', tier: 5, priceMultiplier: 2.85, categories: ['clothing', 'accessory', 'footwear'], markets: ANY, minimumCity: 500_000, online: true, deliveryDays: 5, description: 'Parisian house founded in 1961, part of Kering.' }),
  shop({ id: 'bottega', name: 'Bottega Veneta', kind: 'maison', tier: 5, priceMultiplier: 2.95, categories: ['clothing', 'accessory', 'footwear'], markets: ANY, minimumCity: 600_000, online: true, deliveryDays: 5, description: 'Vicenza house known for its intrecciato leather, part of Kering.' }),
  shop({ id: 'celine', name: 'Celine', kind: 'maison', tier: 5, priceMultiplier: 2.90, categories: ['clothing', 'accessory', 'footwear'], markets: ANY, minimumCity: 700_000, online: true, deliveryDays: 5, description: 'Parisian house founded in 1945, part of LVMH.' }),
  shop({ id: 'loewe', name: 'Loewe', kind: 'maison', tier: 5, priceMultiplier: 2.70, categories: ['clothing', 'accessory', 'footwear'], markets: ANY, minimumCity: 700_000, online: true, deliveryDays: 5, description: 'Spanish leather house founded in Madrid in 1846, part of LVMH.' }),
  shop({ id: 'burberry', name: 'Burberry', kind: 'maison', tier: 5, priceMultiplier: 2.40, categories: ['clothing', 'accessory', 'footwear'], markets: ANY, minimumCity: 400_000, online: true, deliveryDays: 5, description: 'British house founded in 1856, known for the trench coat and gabardine.' }),
  shop({ id: 'ralph_lauren', name: 'Ralph Lauren', kind: 'maison', tier: 4, priceMultiplier: 1.90, categories: ['clothing', 'accessory', 'footwear', 'home'], markets: ANY, minimumCity: 250_000, online: true, deliveryDays: 4, description: 'American fashion company founded in 1967.' }),
  shop({ id: 'tom_ford', name: 'Tom Ford', kind: 'maison', tier: 5, priceMultiplier: 3.00, categories: ['clothing', 'accessory', 'footwear'], markets: ANY, minimumCity: 800_000, online: true, deliveryDays: 5, description: 'American luxury label founded in 2005; its beauty arm was sold to Estée Lauder in 2023.' }),
  shop({ id: 'zegna', name: 'Zegna', kind: 'maison', tier: 5, priceMultiplier: 2.60, categories: ['clothing', 'accessory', 'footwear'], markets: ANY, minimumCity: 600_000, online: true, deliveryDays: 5, description: 'Italian menswear house and wool mill, founded in Trivero in 1910.' }),
  shop({ id: 'brunello', name: 'Brunello Cucinelli', kind: 'maison', tier: 5, priceMultiplier: 3.05, categories: ['clothing', 'accessory', 'footwear'], markets: ANY, minimumCity: 800_000, online: true, deliveryDays: 6, description: 'Umbrian house known for cashmere, based in Solomeo.' }),
  shop({ id: 'loro_piana', name: 'Loro Piana', kind: 'maison', tier: 5, priceMultiplier: 3.30, categories: ['clothing', 'accessory', 'footwear', 'home'], markets: ANY, minimumCity: 900_000, online: true, deliveryDays: 6, description: 'Italian textile house known for cashmere and vicuña, part of LVMH.' }),
  shop({ id: 'the_row', name: 'The Row', kind: 'maison', tier: 5, priceMultiplier: 3.15, categories: ['clothing', 'accessory', 'footwear'], markets: ANY, flagshipCities: WORLD_CITIES, minimumCity: 0, online: false, deliveryDays: 0, description: 'American label founded in 2006, known for quiet tailoring.' }),
  shop({ id: 'acne', name: 'Acne Studios', kind: 'boutique', tier: 4, priceMultiplier: 2.10, categories: ['clothing', 'accessory', 'footwear'], markets: ANY, minimumCity: 500_000, online: true, deliveryDays: 5, description: 'Stockholm label founded in 1996.' }),
  shop({ id: 'moncler', name: 'Moncler', kind: 'maison', tier: 5, priceMultiplier: 2.50, categories: ['clothing', 'accessory'], markets: ANY, minimumCity: 400_000, online: true, deliveryDays: 5, description: 'Italian outerwear house, founded in France in 1952 and now based in Milan.' }),
  shop({ id: 'canada_goose', name: 'Canada Goose', kind: 'boutique', tier: 4, priceMultiplier: 1.95, categories: ['clothing', 'accessory'], markets: ['ca', 'us', 'uk', 'fr', 'de', 'it', 'jp', 'cn', 'se', 'no'], minimumCity: 250_000, online: true, deliveryDays: 4, description: 'Canadian outerwear maker founded in Toronto in 1957.' }),
  shop({ id: 'stone_island', name: 'Stone Island', kind: 'boutique', tier: 4, priceMultiplier: 2.05, categories: ['clothing', 'accessory'], markets: ANY, minimumCity: 500_000, online: true, deliveryDays: 5, description: 'Italian sportswear label founded in 1982, part of Moncler since 2020.' }),

  // --- Footwear ------------------------------------------------------------------------------------
  shop({ id: 'nike_store', name: 'Nike', kind: 'sportswear', tier: 3, priceMultiplier: 1.10, categories: ['footwear', 'clothing', 'equipment'], markets: ANY, minimumCity: 150_000, online: true, deliveryDays: 3, description: 'American sportswear company founded in 1964 as Blue Ribbon Sports.' }),
  shop({ id: 'adidas_store', name: 'Adidas', kind: 'sportswear', tier: 3, priceMultiplier: 1.06, categories: ['footwear', 'clothing', 'equipment'], markets: ANY, minimumCity: 150_000, online: true, deliveryDays: 3, description: 'German sportswear company founded in Herzogenaurach in 1949.' }),
  shop({ id: 'new_balance_store', name: 'New Balance', kind: 'sportswear', tier: 3, priceMultiplier: 1.08, categories: ['footwear', 'clothing'], markets: ANY, minimumCity: 200_000, online: true, deliveryDays: 4, description: 'American footwear company founded in Boston in 1906.' }),
  shop({ id: 'dr_martens', name: 'Dr. Martens', kind: 'footwear', tier: 3, priceMultiplier: 1.14, categories: ['footwear'], markets: ANY, minimumCity: 200_000, online: true, deliveryDays: 4, description: 'British bootmaker; the air-cushioned sole was first sold in Britain in 1960.' }),
  shop({ id: 'church_s', name: "Church's", kind: 'footwear', tier: 5, priceMultiplier: 2.30, categories: ['footwear'], markets: ANY, minimumCity: 700_000, online: true, deliveryDays: 6, description: 'Northampton shoemaker founded in 1873, owned by Prada since 1999.' }),
  shop({ id: 'crockett_jones', name: 'Crockett & Jones', kind: 'footwear', tier: 5, priceMultiplier: 2.20, categories: ['footwear'], markets: ['uk', 'us', 'fr', 'jp'], minimumCity: 700_000, online: true, deliveryDays: 7, description: 'Northampton shoemaker, family-owned since 1879.' }),
  shop({ id: 'john_lobb', name: 'John Lobb', kind: 'footwear', tier: 5, priceMultiplier: 3.40, categories: ['footwear'], markets: ANY, flagshipCities: WORLD_CITIES, minimumCity: 0, online: false, deliveryDays: 0, description: 'Bootmaker founded in 1866; the ready-to-wear house is owned by Hermès.' }),
  shop({ id: 'birkenstock_store', name: 'Birkenstock', kind: 'footwear', tier: 2, priceMultiplier: 1.02, categories: ['footwear'], markets: ANY, minimumCity: 150_000, online: true, deliveryDays: 4, description: 'German footwear maker with a contoured cork footbed, listed in 2023.' }),
  shop({ id: 'christian_louboutin', name: 'Christian Louboutin', kind: 'maison', tier: 5, priceMultiplier: 3.00, categories: ['footwear', 'accessory'], markets: ANY, minimumCity: 800_000, online: true, deliveryDays: 5, description: 'Parisian shoemaker founded in 1991, known for a red sole.' }),
  shop({ id: 'manolo_blahnik', name: 'Manolo Blahnik', kind: 'maison', tier: 5, priceMultiplier: 3.05, categories: ['footwear'], markets: ANY, flagshipCities: WORLD_CITIES, minimumCity: 0, online: true, deliveryDays: 6, description: 'Shoemaker founded in London in 1970 by the Spanish designer of the same name.' }),
  shop({ id: 'jimmy_choo', name: 'Jimmy Choo', kind: 'maison', tier: 5, priceMultiplier: 2.85, categories: ['footwear', 'accessory'], markets: ANY, minimumCity: 700_000, online: true, deliveryDays: 5, description: 'London shoemaker founded in 1996, part of Capri Holdings.' }),

  // --- Electronics ------------------------------------------------------------------------------
  shop({ id: 'apple_store', name: 'Apple Store', kind: 'electronics', tier: 4, priceMultiplier: 1.00, categories: ['electronics'], markets: ANY, minimumCity: 200_000, online: true, deliveryDays: 2, description: 'Apple\'s own retail chain; the first stores opened in 2001.' }),
  shop({ id: 'best_buy', name: 'Best Buy', kind: 'electronics', tier: 2, priceMultiplier: 0.98, categories: ['electronics', 'appliance', 'equipment'], markets: ['us', 'ca'], minimumCity: 60_000, online: true, deliveryDays: 2, description: 'American consumer electronics chain.' }),
  shop({ id: 'bh_photo', name: 'B&H Photo Video', kind: 'electronics', tier: 3, priceMultiplier: 0.96, categories: ['electronics', 'equipment'], markets: ['us'], flagshipCities: ['us-ny-newyork'], minimumCity: 0, online: true, deliveryDays: 2, description: 'New York photography and professional video retailer, on Ninth Avenue.' }),
  shop({ id: 'currys', name: 'Currys', kind: 'electronics', tier: 2, priceMultiplier: 1.00, categories: ['electronics', 'appliance'], markets: ['uk', 'ie'], minimumCity: 40_000, online: true, deliveryDays: 2, description: 'British electrical goods retailer.' }),
  shop({ id: 'fnac', name: 'Fnac', kind: 'electronics', tier: 2, priceMultiplier: 1.02, categories: ['electronics', 'equipment'], markets: ['fr', 'es', 'pt', 'be', 'ch'], minimumCity: 80_000, online: true, deliveryDays: 2, description: 'French retailer of electronics, books and recorded media.' }),
  shop({ id: 'mediamarkt', name: 'MediaMarkt', kind: 'electronics', tier: 2, priceMultiplier: 0.99, categories: ['electronics', 'appliance'], markets: ['de', 'es', 'it', 'nl', 'at', 'pl', 'be', 'ch', 'se'], minimumCity: 60_000, online: true, deliveryDays: 2, description: 'European consumer electronics chain, part of Ceconomy.' }),
  shop({ id: 'yodobashi', name: 'Yodobashi Camera', kind: 'electronics', tier: 3, priceMultiplier: 1.00, categories: ['electronics', 'equipment', 'appliance'], markets: ['jp'], minimumCity: 200_000, online: true, deliveryDays: 1, description: 'Japanese electronics chain built out of a camera shop.' }),
  shop({ id: 'leica_store', name: 'Leica Store', kind: 'electronics', tier: 5, priceMultiplier: 1.00, categories: ['electronics', 'equipment'], markets: ANY, minimumCity: 600_000, online: true, deliveryDays: 4, description: 'Retail arm of the German camera maker, founded in Wetzlar.' }),
  shop({ id: 'bang_olufsen', name: 'Bang & Olufsen', kind: 'electronics', tier: 5, priceMultiplier: 1.00, categories: ['electronics'], markets: ANY, minimumCity: 400_000, online: true, deliveryDays: 4, description: 'Danish audio and television company founded in Struer in 1925.' }),

  // --- Furniture and home -------------------------------------------------------------------------
  shop({ id: 'ikea', name: 'IKEA', kind: 'furniture', tier: 1, priceMultiplier: 0.62, categories: ['furniture', 'home', 'household', 'appliance'], markets: ANY, minimumCity: 150_000, online: true, deliveryDays: 7, description: 'Swedish flat-pack furniture retailer, founded in 1943.' }),
  shop({ id: 'herman_miller', name: 'Herman Miller', kind: 'furniture', tier: 5, priceMultiplier: 2.10, categories: ['furniture', 'home'], markets: ANY, minimumCity: 500_000, online: true, deliveryDays: 21, description: 'American furniture maker, part of MillerKnoll since the 2021 merger.' }),
  shop({ id: 'knoll', name: 'Knoll', kind: 'furniture', tier: 5, priceMultiplier: 2.15, categories: ['furniture', 'home'], markets: ANY, minimumCity: 600_000, online: true, deliveryDays: 28, description: 'American furniture maker founded in 1938, part of MillerKnoll.' }),
  shop({ id: 'vitra', name: 'Vitra', kind: 'furniture', tier: 5, priceMultiplier: 2.30, categories: ['furniture', 'home'], markets: ANY, minimumCity: 600_000, online: true, deliveryDays: 28, description: 'Swiss furniture company in Birsfelden, licensed maker of Eames designs in Europe.' }),
  shop({ id: 'bebitalia', name: 'B&B Italia', kind: 'furniture', tier: 5, priceMultiplier: 2.90, categories: ['furniture', 'home'], markets: ANY, minimumCity: 700_000, online: false, deliveryDays: 0, description: 'Italian furniture maker founded in Novedrate in 1966.' }),
  shop({ id: 'minotti', name: 'Minotti', kind: 'furniture', tier: 5, priceMultiplier: 3.10, categories: ['furniture', 'home'], markets: ANY, minimumCity: 800_000, online: false, deliveryDays: 0, description: 'Italian furniture house founded in Meda in 1948.' }),
  shop({ id: 'poliform', name: 'Poliform', kind: 'furniture', tier: 5, priceMultiplier: 2.80, categories: ['furniture', 'home'], markets: ANY, minimumCity: 700_000, online: false, deliveryDays: 0, description: 'Italian furniture and fitted-interiors maker, founded in Inverigo.' }),
  shop({ id: 'ligne_roset', name: 'Ligne Roset', kind: 'furniture', tier: 4, priceMultiplier: 2.00, categories: ['furniture', 'home'], markets: ANY, minimumCity: 400_000, online: true, deliveryDays: 35, description: 'French furniture company, family-run since 1860.' }),
  shop({ id: 'carl_hansen', name: 'Carl Hansen & Søn', kind: 'furniture', tier: 5, priceMultiplier: 2.20, categories: ['furniture', 'home'], markets: ANY, minimumCity: 600_000, online: true, deliveryDays: 30, description: 'Danish furniture maker, licensed producer of Hans Wegner\'s designs.' }),
  shop({ id: 'fritz_hansen', name: 'Fritz Hansen', kind: 'furniture', tier: 5, priceMultiplier: 2.25, categories: ['furniture', 'home'], markets: ANY, minimumCity: 600_000, online: true, deliveryDays: 30, description: 'Danish furniture maker, producer of Arne Jacobsen\'s chairs since 1872.' }),
  shop({ id: 'hay', name: 'HAY', kind: 'furniture', tier: 3, priceMultiplier: 1.30, categories: ['furniture', 'home', 'household'], markets: ANY, minimumCity: 300_000, online: true, deliveryDays: 14, description: 'Danish design company founded in 2002.' }),
  shop({ id: 'dwr', name: 'Design Within Reach', kind: 'furniture', tier: 4, priceMultiplier: 1.85, categories: ['furniture', 'home'], markets: ['us', 'ca'], minimumCity: 300_000, online: true, deliveryDays: 21, description: 'American modern-furniture retailer, part of MillerKnoll.' }),
  shop({ id: 'rh', name: 'RH', kind: 'furniture', tier: 4, priceMultiplier: 1.80, categories: ['furniture', 'home', 'art'], markets: ['us', 'ca', 'uk'], minimumCity: 250_000, online: true, deliveryDays: 28, description: 'American home furnishings company, formerly Restoration Hardware.' }),
  shop({ id: 'west_elm', name: 'West Elm', kind: 'furniture', tier: 3, priceMultiplier: 1.22, categories: ['furniture', 'home', 'household'], markets: ['us', 'ca', 'uk', 'au'], minimumCity: 200_000, online: true, deliveryDays: 14, description: 'American furniture retailer, part of Williams-Sonoma.' }),
  shop({ id: 'crate_barrel', name: 'Crate & Barrel', kind: 'furniture', tier: 3, priceMultiplier: 1.24, categories: ['furniture', 'home', 'household', 'appliance'], markets: ['us', 'ca'], minimumCity: 200_000, online: true, deliveryDays: 14, description: 'American home furnishings retailer founded in Chicago in 1962.' }),
  shop({ id: 'williams_sonoma', name: 'Williams Sonoma', kind: 'homeware', tier: 4, priceMultiplier: 1.42, categories: ['household', 'appliance', 'home', 'groceries'], markets: ['us', 'ca', 'au'], minimumCity: 200_000, online: true, deliveryDays: 5, description: 'American kitchenware retailer founded in Sonoma in 1956.' }),
  shop({ id: 'the_conran_shop', name: 'The Conran Shop', kind: 'homeware', tier: 5, priceMultiplier: 1.90, categories: ['furniture', 'home', 'household'], markets: ['uk', 'fr', 'jp', 'kr'], minimumCity: 600_000, online: true, deliveryDays: 14, description: 'Design shop founded by Terence Conran in London in 1974.' }),

  // --- Watches and jewellery ---------------------------------------------------------------------
  shop({ id: 'watches_of_switzerland', name: 'Watches Of Switzerland', kind: 'watch', tier: 5, priceMultiplier: 1.00, categories: ['watch'], markets: ['uk', 'us', 'ie'], minimumCity: 300_000, online: true, deliveryDays: 3, description: 'Authorised watch retail group listed in London in 2019.' }),
  shop({ id: 'bucherer', name: 'Bucherer', kind: 'watch', tier: 5, priceMultiplier: 1.00, categories: ['watch', 'jewelry'], markets: ['ch', 'de', 'at', 'fr', 'uk', 'dk', 'us'], minimumCity: 250_000, online: true, deliveryDays: 4, description: 'Swiss watch and jewellery retailer founded in Lucerne in 1888; acquired by Rolex in 2023.' }),
  shop({ id: 'wempe', name: 'Wempe', kind: 'watch', tier: 5, priceMultiplier: 1.00, categories: ['watch', 'jewelry'], markets: ['de', 'uk', 'us', 'at', 'es'], minimumCity: 400_000, online: true, deliveryDays: 4, description: 'German watch and jewellery house founded in 1878.' }),
  shop({ id: 'tiffany', name: 'Tiffany & Co.', kind: 'jeweller', tier: 5, priceMultiplier: 1.00, categories: ['jewelry', 'watch', 'home'], markets: ANY, minimumCity: 500_000, online: true, deliveryDays: 4, description: 'American jeweller founded in New York in 1837, part of LVMH since 2021.' }),
  shop({ id: 'cartier_store', name: 'Cartier', kind: 'jeweller', tier: 5, priceMultiplier: 1.00, categories: ['jewelry', 'watch', 'accessory'], markets: ANY, minimumCity: 600_000, online: true, deliveryDays: 5, description: 'French jeweller and watchmaker founded in 1847, part of Richemont.' }),
  shop({ id: 'van_cleef', name: 'Van Cleef & Arpels', kind: 'jeweller', tier: 5, priceMultiplier: 1.00, categories: ['jewelry', 'watch'], markets: ANY, minimumCity: 800_000, online: true, deliveryDays: 6, description: 'Parisian jeweller founded on the Place Vendôme in 1906, part of Richemont.' }),
  shop({ id: 'bulgari', name: 'Bulgari', kind: 'jeweller', tier: 5, priceMultiplier: 1.00, categories: ['jewelry', 'watch', 'accessory'], markets: ANY, minimumCity: 700_000, online: true, deliveryDays: 5, description: 'Roman jeweller founded in 1884, part of LVMH.' }),
  shop({ id: 'harry_winston', name: 'Harry Winston', kind: 'jeweller', tier: 5, priceMultiplier: 1.00, categories: ['jewelry', 'watch'], markets: ANY, flagshipCities: WORLD_CITIES, minimumCity: 0, online: false, deliveryDays: 0, description: 'American jeweller founded in New York in 1932, part of the Swatch Group.' }),
  shop({ id: 'graff', name: 'Graff', kind: 'jeweller', tier: 5, priceMultiplier: 1.00, categories: ['jewelry', 'watch'], markets: ANY, flagshipCities: WORLD_CITIES, minimumCity: 0, online: false, deliveryDays: 0, description: 'British jeweller founded in London in 1960, known for large diamonds.' }),
  shop({ id: 'mikimoto', name: 'Mikimoto', kind: 'jeweller', tier: 5, priceMultiplier: 1.00, categories: ['jewelry'], markets: ANY, minimumCity: 800_000, online: true, deliveryDays: 6, description: 'Japanese jeweller founded in 1893 by the originator of cultured pearls.' }),
  shop({ id: 'david_yurman', name: 'David Yurman', kind: 'jeweller', tier: 4, priceMultiplier: 1.00, categories: ['jewelry', 'watch'], markets: ['us', 'ca'], minimumCity: 400_000, online: true, deliveryDays: 4, description: 'American jewellery house founded in New York in 1980.' }),

  // --- Books, chemists, hardware, art -------------------------------------------------------------
  shop({ id: 'waterstones', name: 'Waterstones', kind: 'bookshop', tier: 3, priceMultiplier: 1.00, categories: ['books'], markets: ['uk', 'ie'], minimumCity: 40_000, online: true, deliveryDays: 3, description: 'British bookshop chain founded in 1982.' }),
  shop({ id: 'barnes_noble', name: 'Barnes & Noble', kind: 'bookshop', tier: 3, priceMultiplier: 1.00, categories: ['books'], markets: ['us'], minimumCity: 60_000, online: true, deliveryDays: 3, description: 'American bookshop chain.' }),
  shop({ id: 'shakespeare_co', name: 'Shakespeare And Company', kind: 'bookshop', tier: 4, priceMultiplier: 1.08, categories: ['books'], markets: ['fr'], flagshipCities: ['fr-idf-paris'], minimumCity: 0, online: true, deliveryDays: 7, description: 'English-language bookshop on the Left Bank, reopened under that name in 1951.' }),
  shop({ id: 'boots', name: 'Boots', kind: 'pharmacy', tier: 2, priceMultiplier: 1.04, categories: ['household', 'pharmacy'], markets: ['uk', 'ie'], minimumCity: 15_000, online: true, deliveryDays: 2, description: 'British chemist chain founded in Nottingham in 1849.' }),
  shop({ id: 'cvs', name: 'CVS Pharmacy', kind: 'pharmacy', tier: 2, priceMultiplier: 1.10, categories: ['household', 'pharmacy', 'groceries'], markets: ['us'], minimumCity: 15_000, online: true, deliveryDays: 2, description: 'American pharmacy chain.' }),
  shop({ id: 'walgreens', name: 'Walgreens', kind: 'pharmacy', tier: 2, priceMultiplier: 1.10, categories: ['household', 'pharmacy', 'groceries'], markets: ['us'], minimumCity: 15_000, online: true, deliveryDays: 2, description: 'American pharmacy chain founded in Chicago in 1901.' }),
  shop({ id: 'home_depot', name: 'The Home Depot', kind: 'hardware', tier: 2, priceMultiplier: 0.94, categories: ['household', 'appliance', 'equipment', 'home'], markets: ['us', 'ca', 'mx'], minimumCity: 40_000, online: true, deliveryDays: 3, description: 'American home-improvement chain.' }),
  shop({ id: 'bq', name: 'B&Q', kind: 'hardware', tier: 2, priceMultiplier: 0.96, categories: ['household', 'appliance', 'home'], markets: ['uk', 'ie'], minimumCity: 30_000, online: true, deliveryDays: 3, description: 'British home-improvement chain, part of Kingfisher.' }),
  shop({ id: 'gagosian', name: 'Gagosian', kind: 'gallery', tier: 5, priceMultiplier: 1.00, categories: ['art'], markets: ANY, flagshipCities: WORLD_CITIES, minimumCity: 0, online: false, deliveryDays: 0, description: 'Contemporary art gallery founded by Larry Gagosian, with spaces in several cities.' }),
  shop({ id: 'david_zwirner', name: 'David Zwirner', kind: 'gallery', tier: 5, priceMultiplier: 1.00, categories: ['art'], markets: ANY, flagshipCities: ['us-ny-newyork', 'uk-eng-london', 'fr-idf-paris', 'hk-hk-hongkong', 'us-ca-losangeles'], minimumCity: 0, online: false, deliveryDays: 0, description: 'Contemporary art gallery founded in New York in 1993.' }),
  shop({ id: 'hauser_wirth', name: 'Hauser & Wirth', kind: 'gallery', tier: 5, priceMultiplier: 1.00, categories: ['art'], markets: ANY, flagshipCities: WORLD_CITIES, minimumCity: 0, online: false, deliveryDays: 0, description: 'Contemporary art gallery founded in Zurich in 1992.' }),
  shop({ id: 'christies', name: "Christie's", kind: 'gallery', tier: 5, priceMultiplier: 1.00, categories: ['art', 'watch', 'jewelry'], markets: ANY, flagshipCities: WORLD_CITIES, minimumCity: 0, online: true, deliveryDays: 14, description: 'British auction house founded in 1766.' }),
  shop({ id: 'sothebys', name: "Sotheby's", kind: 'gallery', tier: 5, priceMultiplier: 1.00, categories: ['art', 'watch', 'jewelry'], markets: ANY, flagshipCities: WORLD_CITIES, minimumCity: 0, online: true, deliveryDays: 14, description: 'Auction house founded in London in 1744.' }),

  // --- Online only ------------------------------------------------------------------------------
  shop({ id: 'amazon', name: 'Amazon', kind: 'online', tier: 2, priceMultiplier: 0.90, categories: ['groceries', 'household', 'electronics', 'clothing', 'home', 'furniture', 'books', 'equipment', 'appliance'], markets: ANY, minimumCity: 0, online: true, deliveryDays: 2, description: 'American online retailer founded in 1994.' }),
  shop({ id: 'net_a_porter', name: 'Net-A-Porter', kind: 'online', tier: 5, priceMultiplier: 1.85, categories: ['clothing', 'footwear', 'accessory', 'jewelry'], markets: ANY, minimumCity: 0, online: true, deliveryDays: 3, description: 'Online luxury retailer founded in London in 2000.' }),
  shop({ id: 'mr_porter', name: 'Mr Porter', kind: 'online', tier: 5, priceMultiplier: 1.85, categories: ['clothing', 'footwear', 'accessory', 'watch'], markets: ANY, minimumCity: 0, online: true, deliveryDays: 3, description: 'Menswear arm of the Net-A-Porter group, launched in 2011.' }),
  shop({ id: 'ssense', name: 'SSENSE', kind: 'online', tier: 4, priceMultiplier: 1.68, categories: ['clothing', 'footwear', 'accessory'], markets: ANY, minimumCity: 0, online: true, deliveryDays: 4, description: 'Montreal-based online retailer of designer and streetwear labels.' }),
  shop({ id: 'farfetch', name: 'Farfetch', kind: 'online', tier: 4, priceMultiplier: 1.72, categories: ['clothing', 'footwear', 'accessory', 'jewelry'], markets: ANY, minimumCity: 0, online: true, deliveryDays: 5, description: 'Online luxury marketplace founded in London in 2007.' }),
  shop({ id: 'mytheresa', name: 'Mytheresa', kind: 'online', tier: 5, priceMultiplier: 1.80, categories: ['clothing', 'footwear', 'accessory'], markets: ANY, minimumCity: 0, online: true, deliveryDays: 4, description: 'German online luxury retailer, grown out of a Munich boutique.' }),
  shop({ id: 'end_clothing', name: 'END. Clothing', kind: 'online', tier: 3, priceMultiplier: 1.34, categories: ['clothing', 'footwear', 'accessory'], markets: ANY, minimumCity: 0, online: true, deliveryDays: 4, description: 'Newcastle-based retailer of streetwear and designer labels.' }),
  shop({ id: 'zalando', name: 'Zalando', kind: 'online', tier: 2, priceMultiplier: 1.00, categories: ['clothing', 'footwear', 'accessory'], markets: EU, minimumCity: 0, online: true, deliveryDays: 3, description: 'German online fashion platform founded in Berlin in 2008.' }),
  shop({ id: 'asos', name: 'ASOS', kind: 'online', tier: 2, priceMultiplier: 0.86, categories: ['clothing', 'footwear', 'accessory'], markets: ANGLO.concat(EU), minimumCity: 0, online: true, deliveryDays: 4, description: 'British online fashion retailer founded in 2000.' }),
  shop({ id: 'rei', name: 'REI', kind: 'sportswear', tier: 3, priceMultiplier: 1.10, categories: ['equipment', 'clothing', 'footwear'], markets: ['us'], minimumCity: 100_000, online: true, deliveryDays: 3, description: 'American outdoor co-operative founded in Seattle in 1938.' }),
  shop({ id: 'wayfair', name: 'Wayfair', kind: 'online', tier: 2, priceMultiplier: 0.92, categories: ['furniture', 'home', 'household', 'appliance'], markets: ['us', 'ca', 'uk', 'ie', 'de'], minimumCity: 0, online: true, deliveryDays: 7, description: 'American online furniture and homeware retailer.' }),
  shop({ id: 'chrono24', name: 'Chrono24', kind: 'online', tier: 4, priceMultiplier: 1.05, categories: ['watch'], markets: ANY, minimumCity: 0, online: true, deliveryDays: 6, description: 'German online marketplace for new and pre-owned watches.' }),
  shop({ id: 'stockx', name: 'StockX', kind: 'online', tier: 3, priceMultiplier: 1.40, categories: ['footwear', 'clothing', 'watch'], markets: ANY, minimumCity: 0, online: true, deliveryDays: 6, description: 'American resale marketplace with an authentication step.' }),
  shop({ id: 'the_realreal', name: 'The RealReal', kind: 'online', tier: 3, priceMultiplier: 0.62, categories: ['clothing', 'footwear', 'accessory', 'jewelry', 'watch'], markets: ['us'], minimumCity: 0, online: true, deliveryDays: 5, description: 'American consignment marketplace for authenticated luxury resale.' }),
  shop({ id: 'vestiaire', name: 'Vestiaire Collective', kind: 'online', tier: 3, priceMultiplier: 0.60, categories: ['clothing', 'footwear', 'accessory', 'jewelry'], markets: ANY, minimumCity: 0, online: true, deliveryDays: 8, description: 'French resale platform for second-hand designer fashion.' }),
];

/**
 * The rest of the world.
 *
 * The chains above are the ones a European or North American player meets
 * first. These are the ones everybody else meets first, and a shop in São
 * Paulo, Lagos, Mumbai, Seoul or Istanbul should be a shop from there rather
 * than an American one with the sign changed. Same rules: the company and the
 * countries it trades in are public record; the branch, the rail and the price
 * are SLATE's.
 */
export const REGIONAL_RETAILERS: readonly RealRetailer[] = [
  // --- Latin America ------------------------------------------------------------------------
  shop({ id: 'pao_de_acucar', name: 'Pão De Açúcar', kind: 'grocery', tier: 3, priceMultiplier: 1.12, categories: ['groceries', 'household'], markets: ['br'], minimumCity: 100_000, online: true, deliveryDays: 1, description: 'Brazilian supermarket chain, part of Grupo Pão de Açúcar.' }),
  shop({ id: 'extra_br', name: 'Extra', kind: 'grocery', tier: 2, priceMultiplier: 0.95, categories: ['groceries', 'household', 'electronics'], markets: ['br'], minimumCity: 80_000, online: true, deliveryDays: 2, description: 'Brazilian hypermarket banner.' }),
  shop({ id: 'magazine_luiza', name: 'Magazine Luiza', kind: 'department', tier: 2, priceMultiplier: 1.00, categories: ['electronics', 'appliance', 'furniture', 'home'], markets: ['br'], minimumCity: 60_000, online: true, deliveryDays: 4, description: 'Brazilian retailer of electronics, appliances and furniture.' }),
  shop({ id: 'casas_bahia', name: 'Casas Bahia', kind: 'department', tier: 2, priceMultiplier: 1.02, categories: ['electronics', 'appliance', 'furniture'], markets: ['br'], minimumCity: 60_000, online: true, deliveryDays: 5, description: 'Brazilian furniture and electronics chain.' }),
  shop({ id: 'renner', name: 'Renner', kind: 'department', tier: 2, priceMultiplier: 0.94, categories: ['clothing', 'footwear', 'accessory', 'home'], markets: ['br'], minimumCity: 100_000, online: true, deliveryDays: 4, description: 'Brazilian fashion department store chain.' }),
  shop({ id: 'riachuelo', name: 'Riachuelo', kind: 'department', tier: 2, priceMultiplier: 0.90, categories: ['clothing', 'footwear', 'accessory'], markets: ['br'], minimumCity: 100_000, online: true, deliveryDays: 4, description: 'Brazilian clothing retailer.' }),
  shop({ id: 'havaianas_store', name: 'Havaianas', kind: 'footwear', tier: 2, priceMultiplier: 1.00, categories: ['footwear', 'accessory'], markets: ANY, minimumCity: 250_000, online: true, deliveryDays: 4, description: 'Brazilian footwear brand, part of Alpargatas.' }),
  shop({ id: 'soriana', name: 'Soriana', kind: 'grocery', tier: 2, priceMultiplier: 0.94, categories: ['groceries', 'household'], markets: ['mx'], minimumCity: 80_000, online: true, deliveryDays: 2, description: 'Mexican supermarket chain.' }),
  shop({ id: 'chedraui', name: 'Chedraui', kind: 'grocery', tier: 2, priceMultiplier: 0.92, categories: ['groceries', 'household', 'clothing'], markets: ['mx', 'us'], minimumCity: 80_000, online: true, deliveryDays: 2, description: 'Mexican supermarket group, which also owns El Super in the United States.' }),
  shop({ id: 'liverpool_mx', name: 'Liverpool', kind: 'department', tier: 4, priceMultiplier: 1.34, categories: ['clothing', 'footwear', 'accessory', 'home', 'appliance'], markets: ['mx'], minimumCity: 150_000, online: true, deliveryDays: 3, description: 'Mexican department store chain, trading since 1847.' }),
  shop({ id: 'palacio_hierro', name: 'El Palacio De Hierro', kind: 'department', tier: 5, priceMultiplier: 1.68, categories: ['clothing', 'footwear', 'accessory', 'jewelry', 'watch', 'home'], markets: ['mx'], minimumCity: 400_000, online: true, deliveryDays: 3, description: 'Mexican luxury department store.' }),
  shop({ id: 'oxxo', name: 'OXXO', kind: 'convenience', tier: 2, priceMultiplier: 1.28, categories: ['groceries', 'prepared'], markets: ['mx', 'co', 'cl', 'pe', 'br'], minimumCity: 10_000, online: false, deliveryDays: 0, description: 'Mexican convenience-store chain, part of FEMSA.' }),
  shop({ id: 'falabella', name: 'Falabella', kind: 'department', tier: 3, priceMultiplier: 1.18, categories: ['clothing', 'footwear', 'accessory', 'home', 'appliance', 'electronics'], markets: ['cl', 'pe', 'co', 'ar'], minimumCity: 100_000, online: true, deliveryDays: 4, description: 'Chilean department store group trading across South America.' }),
  shop({ id: 'ripley', name: 'Ripley', kind: 'department', tier: 3, priceMultiplier: 1.14, categories: ['clothing', 'footwear', 'home', 'electronics'], markets: ['cl', 'pe'], minimumCity: 100_000, online: true, deliveryDays: 4, description: 'Chilean department store chain.' }),
  shop({ id: 'jumbo_cl', name: 'Jumbo', kind: 'grocery', tier: 3, priceMultiplier: 1.10, categories: ['groceries', 'household'], markets: ['cl', 'ar', 'co'], minimumCity: 80_000, online: true, deliveryDays: 2, description: 'South American hypermarket banner of Cencosud.' }),
  shop({ id: 'exito', name: 'Éxito', kind: 'grocery', tier: 2, priceMultiplier: 0.98, categories: ['groceries', 'household', 'clothing'], markets: ['co'], minimumCity: 80_000, online: true, deliveryDays: 2, description: 'Colombian retail chain.' }),
  shop({ id: 'coto', name: 'Coto', kind: 'grocery', tier: 2, priceMultiplier: 0.96, categories: ['groceries', 'household'], markets: ['ar'], minimumCity: 80_000, online: true, deliveryDays: 2, description: 'Argentine supermarket chain.' }),

  // --- South Asia ---------------------------------------------------------------------------------
  shop({ id: 'dmart', name: 'DMart', kind: 'grocery', tier: 1, priceMultiplier: 0.80, categories: ['groceries', 'household', 'clothing'], markets: ['in'], minimumCity: 100_000, online: true, deliveryDays: 2, description: 'Indian value retail chain, operated by Avenue Supermarts.' }),
  shop({ id: 'reliance_fresh', name: 'Reliance Fresh', kind: 'grocery', tier: 2, priceMultiplier: 0.92, categories: ['groceries', 'household'], markets: ['in'], minimumCity: 80_000, online: true, deliveryDays: 1, description: 'Indian grocery chain, part of Reliance Retail.' }),
  shop({ id: 'croma', name: 'Croma', kind: 'electronics', tier: 3, priceMultiplier: 1.02, categories: ['electronics', 'appliance'], markets: ['in'], minimumCity: 200_000, online: true, deliveryDays: 3, description: 'Indian electronics chain, part of the Tata group.' }),
  shop({ id: 'shoppers_stop', name: 'Shoppers Stop', kind: 'department', tier: 3, priceMultiplier: 1.22, categories: ['clothing', 'footwear', 'accessory', 'home'], markets: ['in'], minimumCity: 250_000, online: true, deliveryDays: 4, description: 'Indian department store chain.' }),
  shop({ id: 'lifestyle_in', name: 'Lifestyle', kind: 'department', tier: 3, priceMultiplier: 1.16, categories: ['clothing', 'footwear', 'accessory'], markets: ['in'], minimumCity: 250_000, online: true, deliveryDays: 4, description: 'Indian fashion retailer, part of the Landmark Group.' }),
  shop({ id: 'westside', name: 'Westside', kind: 'department', tier: 3, priceMultiplier: 1.10, categories: ['clothing', 'footwear', 'home'], markets: ['in'], minimumCity: 200_000, online: true, deliveryDays: 4, description: 'Indian retail chain, part of Trent and the Tata group.' }),
  shop({ id: 'fabindia', name: 'Fabindia', kind: 'boutique', tier: 3, priceMultiplier: 1.20, categories: ['clothing', 'home', 'household'], markets: ['in'], minimumCity: 200_000, online: true, deliveryDays: 4, description: 'Indian retailer of handloom textiles and homeware.' }),
  shop({ id: 'tanishq', name: 'Tanishq', kind: 'jeweller', tier: 4, priceMultiplier: 1.00, categories: ['jewelry', 'watch'], markets: ['in'], minimumCity: 200_000, online: true, deliveryDays: 5, description: 'Indian jewellery brand, part of Titan and the Tata group.' }),

  // --- East Asia ---------------------------------------------------------------------------------------
  shop({ id: 'aeon', name: 'AEON', kind: 'grocery', tier: 2, priceMultiplier: 0.98, categories: ['groceries', 'household', 'clothing'], markets: ['jp', 'my', 'vn', 'th', 'kh'], minimumCity: 80_000, online: true, deliveryDays: 2, description: 'Japanese retail group operating across Asia.' }),
  shop({ id: 'ito_yokado', name: 'Ito-Yokado', kind: 'grocery', tier: 3, priceMultiplier: 1.06, categories: ['groceries', 'household', 'clothing'], markets: ['jp'], minimumCity: 100_000, online: true, deliveryDays: 1, description: 'Japanese superstore chain, part of Seven & i Holdings.' }),
  shop({ id: 'don_quijote', name: 'Don Quijote', kind: 'department', tier: 2, priceMultiplier: 0.92, categories: ['groceries', 'household', 'electronics', 'clothing'], markets: ['jp', 'sg', 'th', 'hk'], minimumCity: 150_000, online: false, deliveryDays: 0, description: 'Japanese discount chain known for its dense, late-opening stores.' }),
  shop({ id: 'bic_camera', name: 'Bic Camera', kind: 'electronics', tier: 3, priceMultiplier: 1.00, categories: ['electronics', 'appliance', 'equipment'], markets: ['jp'], minimumCity: 200_000, online: true, deliveryDays: 2, description: 'Japanese electronics retail chain.' }),
  shop({ id: 'loft_jp', name: 'Loft', kind: 'homeware', tier: 3, priceMultiplier: 1.10, categories: ['household', 'home', 'accessory'], markets: ['jp'], minimumCity: 200_000, online: true, deliveryDays: 3, description: 'Japanese variety and lifestyle store chain.' }),
  shop({ id: 'beams', name: 'BEAMS', kind: 'boutique', tier: 4, priceMultiplier: 1.44, categories: ['clothing', 'footwear', 'accessory'], markets: ['jp'], minimumCity: 300_000, online: true, deliveryDays: 4, description: 'Japanese select shop and clothing label, founded in Harajuku in 1976.' }),
  shop({ id: 'united_arrows', name: 'United Arrows', kind: 'boutique', tier: 4, priceMultiplier: 1.52, categories: ['clothing', 'footwear', 'accessory'], markets: ['jp'], minimumCity: 300_000, online: true, deliveryDays: 4, description: 'Japanese select shop known for tailoring and imported labels.' }),
  shop({ id: 'lotte_department', name: 'Lotte Department Store', kind: 'department', tier: 4, priceMultiplier: 1.40, categories: ['clothing', 'footwear', 'accessory', 'groceries', 'home'], markets: ['kr'], minimumCity: 200_000, online: true, deliveryDays: 2, description: 'South Korean department store chain.' }),
  shop({ id: 'shinsegae', name: 'Shinsegae', kind: 'department', tier: 5, priceMultiplier: 1.62, categories: ['clothing', 'footwear', 'accessory', 'jewelry', 'home'], markets: ['kr'], minimumCity: 300_000, online: true, deliveryDays: 2, description: 'South Korean luxury department store group.' }),
  shop({ id: 'emart', name: 'Emart', kind: 'grocery', tier: 2, priceMultiplier: 0.94, categories: ['groceries', 'household', 'electronics'], markets: ['kr'], minimumCity: 100_000, online: true, deliveryDays: 1, description: 'South Korean hypermarket chain.' }),
  shop({ id: 'olive_young', name: 'Olive Young', kind: 'pharmacy', tier: 2, priceMultiplier: 1.04, categories: ['household', 'pharmacy', 'accessory'], markets: ['kr'], minimumCity: 80_000, online: true, deliveryDays: 1, description: 'South Korean health and beauty chain, part of CJ.' }),
  shop({ id: 'miniso', name: 'MINISO', kind: 'homeware', tier: 1, priceMultiplier: 0.70, categories: ['household', 'home', 'accessory'], markets: ANY, minimumCity: 150_000, online: false, deliveryDays: 0, description: 'Chinese variety retailer with stores in many countries.' }),
  shop({ id: 'skp', name: 'SKP', kind: 'department', tier: 5, priceMultiplier: 1.74, categories: ['clothing', 'footwear', 'accessory', 'jewelry', 'watch'], markets: ['cn'], minimumCity: 1_000_000, online: false, deliveryDays: 0, description: 'Chinese luxury department store group.' }),

  // --- Southeast Asia -------------------------------------------------------------------------------------
  shop({ id: 'fairprice', name: 'FairPrice', kind: 'grocery', tier: 2, priceMultiplier: 0.96, categories: ['groceries', 'household'], markets: ['sg'], minimumCity: 50_000, online: true, deliveryDays: 1, description: 'Singaporean supermarket cooperative run by NTUC Enterprise.' }),
  shop({ id: 'mustafa', name: 'Mustafa Centre', kind: 'department', tier: 2, priceMultiplier: 0.90, categories: ['groceries', 'electronics', 'clothing', 'jewelry', 'household'], markets: ['sg'], flagshipCities: ['sg-sg-singapore'], minimumCity: 0, online: false, deliveryDays: 0, description: 'Singaporean department store in Little India, open around the clock.' }),
  shop({ id: 'central_th', name: 'Central', kind: 'department', tier: 4, priceMultiplier: 1.32, categories: ['clothing', 'footwear', 'accessory', 'home', 'groceries'], markets: ['th'], minimumCity: 150_000, online: true, deliveryDays: 3, description: 'Thai department store group.' }),
  shop({ id: 'big_c', name: 'Big C', kind: 'grocery', tier: 2, priceMultiplier: 0.92, categories: ['groceries', 'household', 'clothing'], markets: ['th', 'vn', 'kh', 'la'], minimumCity: 80_000, online: true, deliveryDays: 2, description: 'Thai hypermarket chain.' }),
  shop({ id: 'sm_store', name: 'The SM Store', kind: 'department', tier: 3, priceMultiplier: 1.10, categories: ['clothing', 'footwear', 'accessory', 'home', 'appliance'], markets: ['ph'], minimumCity: 100_000, online: true, deliveryDays: 4, description: 'Philippine department store chain, part of SM Investments.' }),
  shop({ id: 'mercury_drug', name: 'Mercury Drug', kind: 'pharmacy', tier: 2, priceMultiplier: 1.06, categories: ['household', 'pharmacy'], markets: ['ph'], minimumCity: 40_000, online: false, deliveryDays: 0, description: 'Philippine pharmacy chain.' }),
  shop({ id: 'indomaret', name: 'Indomaret', kind: 'convenience', tier: 2, priceMultiplier: 1.14, categories: ['groceries', 'household'], markets: ['id'], minimumCity: 20_000, online: false, deliveryDays: 0, description: 'Indonesian convenience-store chain.' }),
  shop({ id: 'alfamart', name: 'Alfamart', kind: 'convenience', tier: 2, priceMultiplier: 1.12, categories: ['groceries', 'household'], markets: ['id', 'ph'], minimumCity: 20_000, online: false, deliveryDays: 0, description: 'Indonesian convenience-store chain.' }),
  shop({ id: 'ninety_nine_speedmart', name: '99 Speedmart', kind: 'convenience', tier: 1, priceMultiplier: 0.94, categories: ['groceries', 'household'], markets: ['my'], minimumCity: 20_000, online: false, deliveryDays: 0, description: 'Malaysian mini-market chain.' }),

  // --- Middle East ------------------------------------------------------------------------------------------
  shop({ id: 'lulu', name: 'Lulu Hypermarket', kind: 'grocery', tier: 2, priceMultiplier: 0.96, categories: ['groceries', 'household', 'electronics', 'clothing'], markets: ['ae', 'sa', 'qa', 'om', 'kw', 'bh', 'in', 'eg'], minimumCity: 80_000, online: true, deliveryDays: 2, description: 'Gulf hypermarket chain based in Abu Dhabi.' }),
  shop({ id: 'spinneys', name: 'Spinneys', kind: 'grocery', tier: 4, priceMultiplier: 1.30, categories: ['groceries', 'household'], markets: ['ae', 'lb', 'eg', 'qa'], minimumCity: 100_000, online: true, deliveryDays: 1, description: 'Middle Eastern supermarket chain.' }),
  shop({ id: 'level_shoes', name: 'Level Shoes', kind: 'footwear', tier: 5, priceMultiplier: 1.70, categories: ['footwear', 'accessory'], markets: ['ae'], flagshipCities: ['ae-du-dubai'], minimumCity: 0, online: true, deliveryDays: 3, description: 'Dubai Mall footwear destination operated by the Chalhoub Group.' }),
  shop({ id: 'jarir', name: 'Jarir Bookstore', kind: 'electronics', tier: 3, priceMultiplier: 1.04, categories: ['electronics', 'books', 'household'], markets: ['sa', 'ae', 'kw', 'qa', 'bh'], minimumCity: 100_000, online: true, deliveryDays: 2, description: 'Saudi retailer of books, stationery and electronics.' }),
  shop({ id: 'panda_sa', name: 'Panda', kind: 'grocery', tier: 2, priceMultiplier: 0.94, categories: ['groceries', 'household'], markets: ['sa'], minimumCity: 80_000, online: true, deliveryDays: 2, description: 'Saudi supermarket chain.' }),
  shop({ id: 'boyner', name: 'Boyner', kind: 'department', tier: 3, priceMultiplier: 1.14, categories: ['clothing', 'footwear', 'accessory', 'home'], markets: ['tr'], minimumCity: 150_000, online: true, deliveryDays: 3, description: 'Turkish department store chain.' }),
  shop({ id: 'beymen', name: 'Beymen', kind: 'department', tier: 5, priceMultiplier: 1.70, categories: ['clothing', 'footwear', 'accessory', 'jewelry'], markets: ['tr'], minimumCity: 400_000, online: true, deliveryDays: 3, description: 'Turkish luxury department store.' }),
  shop({ id: 'lc_waikiki', name: 'LC Waikiki', kind: 'highstreet', tier: 1, priceMultiplier: 0.72, categories: ['clothing', 'footwear'], markets: ['tr', 'ro', 'pl', 'eg', 'ma', 'kz', 'rs', 'bg'], minimumCity: 60_000, online: true, deliveryDays: 4, description: 'Turkish clothing retailer trading across Europe, the Middle East and Central Asia.' }),
  shop({ id: 'migros_tr', name: 'Migros Türkiye', kind: 'grocery', tier: 2, priceMultiplier: 0.98, categories: ['groceries', 'household'], markets: ['tr'], minimumCity: 60_000, online: true, deliveryDays: 1, description: 'Turkish supermarket chain, independent of the Swiss cooperative of the same origin.' }),
  shop({ id: 'bim', name: 'BİM', kind: 'grocery', tier: 1, priceMultiplier: 0.74, categories: ['groceries', 'household'], markets: ['tr', 'ma', 'eg'], minimumCity: 20_000, online: false, deliveryDays: 0, description: 'Turkish hard-discount grocery chain.' }),

  // --- Africa ----------------------------------------------------------------------------------------------------
  shop({ id: 'shoprite', name: 'Shoprite', kind: 'grocery', tier: 2, priceMultiplier: 0.90, categories: ['groceries', 'household'], markets: ['za', 'na', 'zm', 'ao', 'gh', 'mz', 'bw'], minimumCity: 50_000, online: true, deliveryDays: 2, description: 'South African supermarket group, the largest in Africa.' }),
  shop({ id: 'checkers', name: 'Checkers', kind: 'grocery', tier: 3, priceMultiplier: 1.08, categories: ['groceries', 'household'], markets: ['za', 'na', 'bw'], minimumCity: 80_000, online: true, deliveryDays: 1, description: 'South African supermarket chain, part of the Shoprite group.' }),
  shop({ id: 'pick_n_pay', name: 'Pick n Pay', kind: 'grocery', tier: 2, priceMultiplier: 0.98, categories: ['groceries', 'household', 'clothing'], markets: ['za', 'zm', 'na', 'bw', 'zw'], minimumCity: 50_000, online: true, deliveryDays: 2, description: 'South African supermarket chain.' }),
  shop({ id: 'woolworths_za', name: 'Woolworths', kind: 'department', tier: 4, priceMultiplier: 1.32, categories: ['groceries', 'clothing', 'home', 'prepared'], markets: ['za', 'na', 'bw', 'ke'], minimumCity: 80_000, online: true, deliveryDays: 2, description: 'South African retailer of food, clothing and homeware, unrelated to the Australian chain.' }),
  shop({ id: 'naivas', name: 'Naivas', kind: 'grocery', tier: 2, priceMultiplier: 0.96, categories: ['groceries', 'household'], markets: ['ke'], minimumCity: 50_000, online: true, deliveryDays: 2, description: 'Kenyan supermarket chain.' }),
  shop({ id: 'spar_int', name: 'SPAR', kind: 'grocery', tier: 2, priceMultiplier: 1.04, categories: ['groceries', 'household'], markets: ['za', 'ie', 'at', 'nl', 'no', 'hu', 'in', 'ng', 'zw'], minimumCity: 15_000, online: false, deliveryDays: 0, description: 'International grocery brand run as a network of independent retailers.' }),
  shop({ id: 'jumia', name: 'Jumia', kind: 'online', tier: 2, priceMultiplier: 0.94, categories: ['electronics', 'clothing', 'household', 'home', 'appliance'], markets: ['ng', 'ke', 'eg', 'gh', 'ci', 'ma', 'sn', 'tn', 'ug'], minimumCity: 0, online: true, deliveryDays: 5, description: 'Pan-African online marketplace listed in New York in 2019.' }),

  // --- Northern and Eastern Europe --------------------------------------------------------------------------------------
  shop({ id: 'ica', name: 'ICA', kind: 'grocery', tier: 2, priceMultiplier: 1.02, categories: ['groceries', 'household'], markets: ['se'], minimumCity: 15_000, online: true, deliveryDays: 1, description: 'Swedish grocery group run with independent retailers.' }),
  shop({ id: 'rema_1000', name: 'Rema 1000', kind: 'grocery', tier: 1, priceMultiplier: 0.86, categories: ['groceries', 'household'], markets: ['no', 'dk'], minimumCity: 10_000, online: false, deliveryDays: 0, description: 'Norwegian discount grocery chain.' }),
  shop({ id: 'prisma_fi', name: 'Prisma', kind: 'grocery', tier: 2, priceMultiplier: 0.98, categories: ['groceries', 'household', 'clothing', 'electronics'], markets: ['fi', 'ee'], minimumCity: 30_000, online: true, deliveryDays: 1, description: 'Finnish hypermarket chain, part of the S Group.' }),
  shop({ id: 'stockmann', name: 'Stockmann', kind: 'department', tier: 4, priceMultiplier: 1.42, categories: ['clothing', 'footwear', 'accessory', 'home', 'groceries'], markets: ['fi', 'ee', 'lv'], minimumCity: 100_000, online: true, deliveryDays: 3, description: 'Finnish department store, trading since 1862.' }),
  shop({ id: 'illums_bolighus', name: 'Illums Bolighus', kind: 'homeware', tier: 5, priceMultiplier: 1.66, categories: ['furniture', 'home', 'household'], markets: ['dk', 'se'], minimumCity: 150_000, online: true, deliveryDays: 5, description: 'Danish design department store on Strøget in Copenhagen.' }),
  shop({ id: 'elgiganten', name: 'Elgiganten', kind: 'electronics', tier: 2, priceMultiplier: 1.00, categories: ['electronics', 'appliance'], markets: ['se', 'dk', 'no', 'fi'], minimumCity: 30_000, online: true, deliveryDays: 2, description: 'Nordic electronics chain, part of Elkjøp.' }),
  shop({ id: 'biedronka', name: 'Biedronka', kind: 'grocery', tier: 1, priceMultiplier: 0.78, categories: ['groceries', 'household'], markets: ['pl'], minimumCity: 10_000, online: false, deliveryDays: 0, description: 'Polish discount grocery chain, owned by Jerónimo Martins.' }),
  shop({ id: 'zabka', name: 'Żabka', kind: 'convenience', tier: 2, priceMultiplier: 1.18, categories: ['groceries', 'prepared'], markets: ['pl'], minimumCity: 10_000, online: false, deliveryDays: 0, description: 'Polish convenience-store chain.' }),
  shop({ id: 'empik', name: 'Empik', kind: 'bookshop', tier: 3, priceMultiplier: 1.06, categories: ['books', 'electronics', 'household'], markets: ['pl'], minimumCity: 50_000, online: true, deliveryDays: 3, description: 'Polish retailer of books, music and media.' }),
  shop({ id: 'rossmann', name: 'Rossmann', kind: 'pharmacy', tier: 2, priceMultiplier: 0.96, categories: ['household', 'pharmacy'], markets: ['de', 'pl', 'hu', 'cz', 'tr', 'es', 'al'], minimumCity: 20_000, online: true, deliveryDays: 2, description: 'German health and beauty retailer.' }),
  shop({ id: 'dm_drogerie', name: 'dm', kind: 'pharmacy', tier: 2, priceMultiplier: 0.94, categories: ['household', 'pharmacy'], markets: ['de', 'at', 'cz', 'hu', 'hr', 'si', 'sk', 'bg', 'ro'], minimumCity: 20_000, online: true, deliveryDays: 2, description: 'German drugstore chain.' }),
  shop({ id: 'kaufland', name: 'Kaufland', kind: 'grocery', tier: 1, priceMultiplier: 0.84, categories: ['groceries', 'household'], markets: ['de', 'pl', 'cz', 'sk', 'ro', 'bg', 'hr', 'md'], minimumCity: 25_000, online: false, deliveryDays: 0, description: 'German hypermarket chain, part of the Schwarz Group.' }),
  shop({ id: 'billa', name: 'BILLA', kind: 'grocery', tier: 2, priceMultiplier: 1.00, categories: ['groceries', 'household'], markets: ['at', 'cz', 'sk', 'bg', 'ro', 'it'], minimumCity: 15_000, online: true, deliveryDays: 1, description: 'Austrian supermarket chain, part of REWE Group.' }),
  shop({ id: 'saturn', name: 'Saturn', kind: 'electronics', tier: 2, priceMultiplier: 0.99, categories: ['electronics', 'appliance'], markets: ['de', 'at', 'lu'], minimumCity: 60_000, online: true, deliveryDays: 2, description: 'German electronics chain, part of Ceconomy.' }),
  shop({ id: 'manor', name: 'Manor', kind: 'department', tier: 3, priceMultiplier: 1.26, categories: ['clothing', 'footwear', 'home', 'groceries'], markets: ['ch'], minimumCity: 40_000, online: true, deliveryDays: 3, description: 'Swiss department store chain.' }),
  shop({ id: 'albert_heijn', name: 'Albert Heijn', kind: 'grocery', tier: 3, priceMultiplier: 1.06, categories: ['groceries', 'household', 'prepared'], markets: ['nl', 'be'], minimumCity: 15_000, online: true, deliveryDays: 1, description: 'Dutch supermarket chain, part of Ahold Delhaize.' }),
  shop({ id: 'jumbo_nl', name: 'Jumbo', kind: 'grocery', tier: 2, priceMultiplier: 0.96, categories: ['groceries', 'household'], markets: ['nl', 'be'], minimumCity: 15_000, online: true, deliveryDays: 1, description: 'Dutch supermarket chain, unrelated to the South American banner.' }),
  shop({ id: 'hema', name: 'HEMA', kind: 'department', tier: 2, priceMultiplier: 0.90, categories: ['household', 'home', 'clothing', 'groceries'], markets: ['nl', 'be', 'fr', 'de', 'lu'], minimumCity: 20_000, online: true, deliveryDays: 3, description: 'Dutch variety store chain, trading since 1926.' }),
  shop({ id: 'bijenkorf', name: 'De Bijenkorf', kind: 'department', tier: 5, priceMultiplier: 1.60, categories: ['clothing', 'footwear', 'accessory', 'home', 'jewelry'], markets: ['nl'], minimumCity: 150_000, online: true, deliveryDays: 3, description: 'Dutch luxury department store chain.' }),
  shop({ id: 'colruyt', name: 'Colruyt', kind: 'grocery', tier: 1, priceMultiplier: 0.86, categories: ['groceries', 'household'], markets: ['be', 'fr', 'lu'], minimumCity: 15_000, online: true, deliveryDays: 1, description: 'Belgian discount supermarket chain.' }),
  shop({ id: 'coolblue', name: 'Coolblue', kind: 'electronics', tier: 3, priceMultiplier: 1.02, categories: ['electronics', 'appliance'], markets: ['nl', 'be', 'de'], minimumCity: 0, online: true, deliveryDays: 1, description: 'Dutch electronics retailer.' }),

  // --- Western Europe, filling the gaps ---------------------------------------------------------------------------------
  shop({ id: 'leclerc', name: 'E.Leclerc', kind: 'grocery', tier: 1, priceMultiplier: 0.88, categories: ['groceries', 'household', 'electronics'], markets: ['fr', 'pl', 'pt', 'si'], minimumCity: 15_000, online: true, deliveryDays: 2, description: 'French retail cooperative of independent hypermarkets.' }),
  shop({ id: 'intermarche', name: 'Intermarché', kind: 'grocery', tier: 2, priceMultiplier: 0.92, categories: ['groceries', 'household'], markets: ['fr', 'pt', 'be', 'pl'], minimumCity: 10_000, online: true, deliveryDays: 2, description: 'French supermarket group of independent retailers.' }),
  shop({ id: 'auchan', name: 'Auchan', kind: 'grocery', tier: 2, priceMultiplier: 0.93, categories: ['groceries', 'household', 'electronics', 'clothing'], markets: ['fr', 'pl', 'pt', 'es', 'hu', 'ro', 'ua'], minimumCity: 40_000, online: true, deliveryDays: 2, description: 'French hypermarket group.' }),
  shop({ id: 'darty', name: 'Darty', kind: 'electronics', tier: 2, priceMultiplier: 1.02, categories: ['electronics', 'appliance'], markets: ['fr', 'be'], minimumCity: 40_000, online: true, deliveryDays: 2, description: 'French electrical goods retailer, part of Fnac Darty.' }),
  shop({ id: 'sephora', name: 'Sephora', kind: 'pharmacy', tier: 4, priceMultiplier: 1.24, categories: ['accessory', 'household'], markets: ANY, minimumCity: 150_000, online: true, deliveryDays: 3, description: 'French beauty retail chain, part of LVMH.' }),
  shop({ id: 'ulta', name: 'Ulta Beauty', kind: 'pharmacy', tier: 3, priceMultiplier: 1.10, categories: ['accessory', 'household'], markets: ['us'], minimumCity: 60_000, online: true, deliveryDays: 3, description: 'American beauty retail chain.' }),
  shop({ id: 'douglas', name: 'Douglas', kind: 'pharmacy', tier: 3, priceMultiplier: 1.16, categories: ['accessory', 'household'], markets: ['de', 'nl', 'pl', 'it', 'es', 'at', 'fr', 'ch'], minimumCity: 60_000, online: true, deliveryDays: 3, description: 'German beauty retail chain.' }),
  shop({ id: 'mecca', name: 'MECCA', kind: 'pharmacy', tier: 4, priceMultiplier: 1.26, categories: ['accessory', 'household'], markets: ['au', 'nz'], minimumCity: 100_000, online: true, deliveryDays: 3, description: 'Australian beauty retailer.' }),
  shop({ id: 'decathlon', name: 'Decathlon', kind: 'sportswear', tier: 1, priceMultiplier: 0.68, categories: ['equipment', 'clothing', 'footwear'], markets: ANY, minimumCity: 60_000, online: true, deliveryDays: 3, description: 'French sporting goods retailer.' }),
  shop({ id: 'eataly', name: 'Eataly', kind: 'grocery', tier: 4, priceMultiplier: 1.42, categories: ['groceries', 'prepared', 'household'], markets: ['it', 'us', 'jp', 'ae', 'ca', 'kr', 'se'], minimumCity: 400_000, online: true, deliveryDays: 3, description: 'Italian food hall and grocery chain founded in Turin in 2007.' }),
  shop({ id: 'conad', name: 'Conad', kind: 'grocery', tier: 2, priceMultiplier: 0.96, categories: ['groceries', 'household'], markets: ['it'], minimumCity: 15_000, online: true, deliveryDays: 1, description: 'Italian retail cooperative.' }),
  shop({ id: 'unieuro', name: 'Unieuro', kind: 'electronics', tier: 2, priceMultiplier: 1.02, categories: ['electronics', 'appliance'], markets: ['it'], minimumCity: 40_000, online: true, deliveryDays: 2, description: 'Italian electronics retail chain.' }),
  shop({ id: 'continente', name: 'Continente', kind: 'grocery', tier: 2, priceMultiplier: 0.94, categories: ['groceries', 'household'], markets: ['pt'], minimumCity: 20_000, online: true, deliveryDays: 1, description: 'Portuguese hypermarket chain, part of Sonae.' }),
  shop({ id: 'worten', name: 'Worten', kind: 'electronics', tier: 2, priceMultiplier: 1.02, categories: ['electronics', 'appliance'], markets: ['pt', 'es'], minimumCity: 30_000, online: true, deliveryDays: 2, description: 'Portuguese electronics chain, part of Sonae.' }),

  // --- Britain and Ireland, filling the gaps ------------------------------------------------------------------------------
  shop({ id: 'asda', name: 'Asda', kind: 'grocery', tier: 1, priceMultiplier: 0.88, categories: ['groceries', 'household', 'clothing'], markets: ['uk'], minimumCity: 20_000, online: true, deliveryDays: 1, description: 'British supermarket chain.' }),
  shop({ id: 'coop_uk', name: 'Co-op', kind: 'convenience', tier: 2, priceMultiplier: 1.10, categories: ['groceries', 'household'], markets: ['uk'], minimumCity: 5_000, online: true, deliveryDays: 1, description: 'British consumer cooperative running convenience stores.' }),
  shop({ id: 'iceland_uk', name: 'Iceland', kind: 'grocery', tier: 1, priceMultiplier: 0.84, categories: ['groceries', 'household'], markets: ['uk', 'ie'], minimumCity: 15_000, online: true, deliveryDays: 2, description: 'British frozen food supermarket chain.' }),
  shop({ id: 'primark', name: 'Primark', kind: 'highstreet', tier: 1, priceMultiplier: 0.42, categories: ['clothing', 'footwear', 'accessory', 'home'], markets: ['uk', 'ie', 'es', 'de', 'fr', 'nl', 'it', 'us', 'pt', 'be', 'at', 'pl'], minimumCity: 40_000, online: false, deliveryDays: 0, description: 'Irish clothing retailer, part of Associated British Foods.' }),
  shop({ id: 'next_uk', name: 'Next', kind: 'highstreet', tier: 2, priceMultiplier: 1.00, categories: ['clothing', 'footwear', 'accessory', 'home', 'furniture'], markets: ['uk', 'ie'], minimumCity: 30_000, online: true, deliveryDays: 2, description: 'British clothing and homeware retailer.' }),
  shop({ id: 'superdrug', name: 'Superdrug', kind: 'pharmacy', tier: 2, priceMultiplier: 0.96, categories: ['household', 'pharmacy', 'accessory'], markets: ['uk', 'ie'], minimumCity: 20_000, online: true, deliveryDays: 2, description: 'British health and beauty chain.' }),
  shop({ id: 'argos', name: 'Argos', kind: 'department', tier: 2, priceMultiplier: 0.96, categories: ['electronics', 'appliance', 'furniture', 'home', 'equipment'], markets: ['uk', 'ie'], minimumCity: 20_000, online: true, deliveryDays: 1, description: 'British catalogue retailer, owned by Sainsbury\'s.' }),
  shop({ id: 'jd_sports', name: 'JD Sports', kind: 'sportswear', tier: 2, priceMultiplier: 1.06, categories: ['footwear', 'clothing'], markets: ['uk', 'ie', 'fr', 'de', 'es', 'nl', 'us', 'au'], minimumCity: 40_000, online: true, deliveryDays: 3, description: 'British sports fashion retailer.' }),
  shop({ id: 'halfords', name: 'Halfords', kind: 'hardware', tier: 2, priceMultiplier: 1.00, categories: ['equipment', 'household'], markets: ['uk', 'ie'], minimumCity: 30_000, online: true, deliveryDays: 2, description: 'British retailer of motoring and cycling goods.' }),
  shop({ id: 'screwfix', name: 'Screwfix', kind: 'hardware', tier: 2, priceMultiplier: 0.94, categories: ['household', 'equipment'], markets: ['uk', 'ie', 'fr'], minimumCity: 20_000, online: true, deliveryDays: 1, description: 'British trade tools and hardware retailer, part of Kingfisher.' }),

  // --- North America and Oceania, filling the gaps -------------------------------------------------------------------------
  shop({ id: 'metro_ca', name: 'Metro', kind: 'grocery', tier: 2, priceMultiplier: 1.02, categories: ['groceries', 'household', 'pharmacy'], markets: ['ca'], minimumCity: 25_000, online: true, deliveryDays: 1, description: 'Canadian grocery chain.' }),
  shop({ id: 'sobeys', name: 'Sobeys', kind: 'grocery', tier: 2, priceMultiplier: 1.02, categories: ['groceries', 'household'], markets: ['ca'], minimumCity: 20_000, online: true, deliveryDays: 1, description: 'Canadian supermarket chain.' }),
  shop({ id: 'canadian_tire', name: 'Canadian Tire', kind: 'hardware', tier: 2, priceMultiplier: 1.00, categories: ['household', 'equipment', 'appliance', 'home'], markets: ['ca'], minimumCity: 20_000, online: true, deliveryDays: 3, description: 'Canadian retailer of automotive, hardware and sporting goods.' }),
  shop({ id: 'hudsons_bay', name: "Hudson's Bay", kind: 'department', tier: 3, priceMultiplier: 1.24, categories: ['clothing', 'footwear', 'accessory', 'home'], markets: ['ca'], minimumCity: 100_000, online: true, deliveryDays: 3, description: 'Canadian department store chain, the successor to a company chartered in 1670.' }),
  shop({ id: 'shoppers_drug_mart', name: 'Shoppers Drug Mart', kind: 'pharmacy', tier: 2, priceMultiplier: 1.10, categories: ['household', 'pharmacy', 'accessory', 'groceries'], markets: ['ca'], minimumCity: 15_000, online: true, deliveryDays: 2, description: 'Canadian pharmacy chain, part of Loblaw Companies.' }),
  shop({ id: 'indigo', name: 'Indigo', kind: 'bookshop', tier: 3, priceMultiplier: 1.04, categories: ['books', 'home', 'household'], markets: ['ca'], minimumCity: 50_000, online: true, deliveryDays: 3, description: 'Canadian bookshop chain.' }),
  shop({ id: 'bunnings', name: 'Bunnings', kind: 'hardware', tier: 2, priceMultiplier: 0.94, categories: ['household', 'equipment', 'home'], markets: ['au', 'nz'], minimumCity: 20_000, online: true, deliveryDays: 3, description: 'Australian home-improvement chain, part of Wesfarmers.' }),
  shop({ id: 'jb_hifi', name: 'JB Hi-Fi', kind: 'electronics', tier: 2, priceMultiplier: 0.98, categories: ['electronics', 'appliance'], markets: ['au', 'nz'], minimumCity: 40_000, online: true, deliveryDays: 2, description: 'Australian electronics retail chain.' }),
  shop({ id: 'harvey_norman', name: 'Harvey Norman', kind: 'department', tier: 2, priceMultiplier: 1.04, categories: ['electronics', 'appliance', 'furniture', 'home'], markets: ['au', 'nz', 'ie', 'sg', 'my'], minimumCity: 40_000, online: true, deliveryDays: 4, description: 'Australian retailer of electronics, furniture and bedding.' }),
  shop({ id: 'kmart_au', name: 'Kmart', kind: 'department', tier: 1, priceMultiplier: 0.66, categories: ['clothing', 'home', 'household', 'furniture'], markets: ['au', 'nz'], minimumCity: 20_000, online: true, deliveryDays: 3, description: 'Australian discount department store, part of Wesfarmers and separate from the American chain.' }),
  shop({ id: 'chemist_warehouse', name: 'Chemist Warehouse', kind: 'pharmacy', tier: 1, priceMultiplier: 0.86, categories: ['household', 'pharmacy', 'accessory'], markets: ['au', 'nz'], minimumCity: 20_000, online: true, deliveryDays: 2, description: 'Australian discount pharmacy chain.' }),
  shop({ id: 'the_warehouse', name: 'The Warehouse', kind: 'department', tier: 1, priceMultiplier: 0.74, categories: ['household', 'clothing', 'home', 'electronics'], markets: ['nz'], minimumCity: 15_000, online: true, deliveryDays: 3, description: 'New Zealand discount department store chain.' }),

  // --- The kit: what an independent film is actually shot with ------------------------------------------------------------
  shop({ id: 'adorama', name: 'Adorama', kind: 'electronics', tier: 3, priceMultiplier: 0.97, categories: ['electronics', 'equipment'], markets: ['us'], flagshipCities: ['us-ny-newyork'], minimumCity: 0, online: true, deliveryDays: 2, description: 'New York photography and video retailer.' }),
  shop({ id: 'samys_camera', name: "Samy's Camera", kind: 'electronics', tier: 3, priceMultiplier: 1.00, categories: ['electronics', 'equipment'], markets: ['us'], flagshipCities: ['us-ca-losangeles'], minimumCity: 0, online: true, deliveryDays: 2, description: 'Los Angeles camera retailer and rental house.' }),
  shop({ id: 'wex_photo', name: 'Wex Photo Video', kind: 'electronics', tier: 3, priceMultiplier: 1.00, categories: ['electronics', 'equipment'], markets: ['uk'], minimumCity: 200_000, online: true, deliveryDays: 2, description: 'British photography and video retailer.' }),
  shop({ id: 'thomann', name: 'Thomann', kind: 'electronics', tier: 2, priceMultiplier: 0.94, categories: ['electronics', 'equipment'], markets: EU.concat(['uk']), minimumCity: 0, online: true, deliveryDays: 4, description: 'German musical instrument and audio retailer.' }),
  shop({ id: 'guitar_center', name: 'Guitar Center', kind: 'electronics', tier: 2, priceMultiplier: 1.04, categories: ['electronics', 'equipment'], markets: ['us'], minimumCity: 100_000, online: true, deliveryDays: 3, description: 'American musical instrument retail chain.' }),
  shop({ id: 'panavision', name: 'Panavision', kind: 'electronics', tier: 5, priceMultiplier: 1.00, categories: ['equipment'], markets: ANY, flagshipCities: WORLD_CITIES, minimumCity: 0, online: false, deliveryDays: 0, description: 'Camera and optics rental house, founded in 1954; its cameras are hired, not sold.' }),
  shop({ id: 'arri_rental', name: 'ARRI Rental', kind: 'electronics', tier: 5, priceMultiplier: 1.00, categories: ['equipment'], markets: ANY, flagshipCities: WORLD_CITIES, minimumCity: 0, online: false, deliveryDays: 0, description: 'Rental arm of the German camera and lighting manufacturer.' }),
  shop({ id: 'angels_costumes', name: 'Angels Costumes', kind: 'boutique', tier: 5, priceMultiplier: 1.00, categories: ['clothing', 'accessory'], markets: ['uk'], flagshipCities: ['uk-eng-london'], minimumCity: 0, online: false, deliveryDays: 0, description: 'London costumier, family run since 1840 and the oldest in the business.' }),
  shop({ id: 'western_costume', name: 'Western Costume', kind: 'boutique', tier: 5, priceMultiplier: 1.00, categories: ['clothing', 'accessory'], markets: ['us'], flagshipCities: ['us-ca-losangeles'], minimumCity: 0, online: false, deliveryDays: 0, description: 'Los Angeles costume house, in business since 1912.' }),
  shop({ id: 'tirelli', name: 'Tirelli Costumi', kind: 'boutique', tier: 5, priceMultiplier: 1.00, categories: ['clothing', 'accessory'], markets: ['it'], flagshipCities: ['it-laz-rome'], minimumCity: 0, online: false, deliveryDays: 0, description: 'Roman costume house, founded in 1964 and known for period film work.' }),
  shop({ id: 'mac_cosmetics', name: 'M·A·C Cosmetics', kind: 'pharmacy', tier: 3, priceMultiplier: 1.14, categories: ['accessory'], markets: ANY, minimumCity: 150_000, online: true, deliveryDays: 3, description: 'Canadian cosmetics brand founded in Toronto in 1984, part of Estée Lauder.' }),
  shop({ id: 'ben_nye', name: 'Ben Nye Makeup', kind: 'pharmacy', tier: 4, priceMultiplier: 1.00, categories: ['accessory'], markets: ['us'], flagshipCities: ['us-ca-losangeles'], minimumCity: 0, online: true, deliveryDays: 3, description: 'Los Angeles theatrical and film makeup manufacturer, founded by a studio makeup artist.' }),
  shop({ id: 'charles_fox', name: 'Charles Fox', kind: 'pharmacy', tier: 4, priceMultiplier: 1.00, categories: ['accessory'], markets: ['uk'], flagshipCities: ['uk-eng-london'], minimumCity: 0, online: true, deliveryDays: 3, description: 'London theatrical makeup and costume supplier, trading since 1878.' }),
];

/** Everything, the first list and the regional one. */
export const ALL_RETAILERS: readonly RealRetailer[] = [...REAL_RETAILERS, ...REGIONAL_RETAILERS];

export const RETAILER_REGISTRY = new Registry<RealRetailer>('retailers_real', ALL_RETAILERS);

/** The market a city belongs to, read from the front of its id. */
export function marketOf(cityId: string): string {
  return cityId.split('-')[0] ?? '';
}

/**
 * Whether SLATE will put a branch of this chain in this city. The market is
 * the chain's real trading territory; the size threshold and the placement
 * itself are SLATE's calibration and are labelled so on screen.
 */
export function tradesIn(retailer: RealRetailer, cityId: string, population: number): boolean {
  if (retailer.flagshipCities) return retailer.flagshipCities.includes(cityId);
  if (retailer.markets.length > 0 && !retailer.markets.includes(marketOf(cityId))) return false;
  return population >= retailer.minimumCity;
}

// ---------------------------------------------------------------------------
// Coverage, reported rather than implied
// ---------------------------------------------------------------------------

/** How well a country is served by the real chains this build knows. */
export interface MarketCoverage {
  market: string;
  /**
   * Chains authored for this country specifically. This is the honest signal:
   * a worldwide chain reaching everywhere says nothing about whether the local
   * high street has been written.
   */
  local: number;
  /** Chains SLATE does not gate to a market, which reach here as well. */
  worldwide: number;
  /** Local grocers, so the weekly shop can be somewhere from there. */
  grocers: number;
  /** Whether the local chains alone can supply food, clothes and a television. */
  essentials: boolean;
  band: 'deep' | 'workable' | 'thin' | 'none';
}

const ESSENTIAL_CATEGORIES = ['groceries', 'clothing', 'electronics'];

/** Every country code any chain in this build trades in. */
export function coveredMarkets(): string[] {
  const seen = new Set<string>();
  for (const retailer of ALL_RETAILERS) {
    for (const market of retailer.markets) seen.add(market);
    for (const city of retailer.flagshipCities ?? []) seen.add(city.split('-')[0] ?? '');
  }
  seen.delete('');
  return [...seen].sort();
}

/**
 * What a player living in this country would actually find. `worldwide` is the
 * count of chains that SLATE does not gate to a market at all, which reach
 * everywhere; they are counted here because they are genuinely there.
 */
export function coverageFor(market: string): MarketCoverage {
  const local = ALL_RETAILERS.filter((r) =>
    r.markets.includes(market)
    || (r.flagshipCities ?? []).some((c) => c.startsWith(`${market}-`)));
  const worldwide = ALL_RETAILERS.filter((r) => r.markets.length === 0 && !r.flagshipCities).length;
  const categories = new Set(local.flatMap((r) => r.categories));
  const grocers = local.filter((r) => r.kind === 'grocery' || r.kind === 'convenience').length;
  const essentials = ESSENTIAL_CATEGORIES.every((c) => categories.has(c)) && grocers > 0;
  const band = local.length >= 20 ? 'deep'
    : local.length >= 10 ? 'workable'
      : local.length > 0 ? 'thin'
        : 'none';
  return { market, local: local.length, worldwide, grocers, essentials, band };
}

/** Every market this build has authored retail for, worst served first. */
export function coverageReport(): MarketCoverage[] {
  return coveredMarkets()
    .map(coverageFor)
    .sort((a, b) => a.local - b.local || a.market.localeCompare(b.market));
}
