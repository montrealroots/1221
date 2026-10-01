/**
 * SLATE — a letting agent who manages a home let (Stage 11 of
 * `docs/BACKLOG.md`, from 2026-10-01), from
 * `docs/research/world/research-hired-services.json`, read 2026-10-01: one
 * named agent a town where one publishes its fees for a single home, on the
 * page itself.
 *
 * - **Los Angeles:** PMI Los Angeles' Gold plan, 6% of the rent a month, $175
 *   at least; letting, the greater of half a month's rent or $1,500; a
 *   renewal $195.
 * - **New Haven:** Nexus Property Management, a single home 10% of a rent to
 *   $850, 9% to $1,200 and 8% above; letting, the greater of half the first
 *   month's rent or $450; no renewal fee.
 * - **London:** Foxtons, let and managed: 13.2% of the rent to let it and
 *   7.2% to manage it, VAT in; renewed, 12% and 4.8% for the first two
 *   renewals, then 8.4% and 4.8%; its £450 tenancy agreement. Foxtons takes
 *   its letting share of the term ahead; SLATE takes it month by month.
 * - **Dublin:** Property Vision, a month's rent and VAT to let it, and €600
 *   and VAT a month to manage it, flat (well above the market's 6% to 10%,
 *   as the page states it).
 * - **Toronto:** Property Management Partners' Standard plan, 6.9% of the
 *   rent a month, C$125 at least; letting, 8.4% of the year's rent. Whether
 *   HST is added isn't said, and SLATE adds none.
 * - **Vancouver:** Merestone, 8.5% and GST a month, charged only when rent is
 *   received; placement half the first month's rent and GST; nothing else.
 *
 * No New York manager publishes a single home's fees, only the market's
 * ranges, and Mexico City's Homie now guarantees the rent on five-year terms
 * instead; neither is kept.
 */

export interface PropertyManager {
  id: string;
  cityId: string;
  name: string;
  currency: string;
  /** A month's management: its share of the rent by the tenancy's renewals, and its least; or flat. */
  share: (rent: number, renewals: number) => number;
  minimum?: number;
  flat?: number;
  /** Letting the home to a new tenant, by the month's rent. */
  letting: (rent: number) => number;
  /** A tenant renewing. */
  renewal: number;
  source: string;
}

const VAT_IE = 1.23;
const GST = 1.05;

export const PROPERTY_MANAGERS: readonly PropertyManager[] = [
  { id: 'pmi-los-angeles', cityId: 'us-ca-losangeles', name: 'PMI Los Angeles', currency: 'USD', share: () => 0.06, minimum: 175, letting: (rent) => Math.max(rent * 0.5, 1_500), renewal: 195, source: 'https://www.losangelespmi.com/pricing' },
  { id: 'nexus-new-haven', cityId: 'us-ct-newhaven', name: 'Nexus Property Management', currency: 'USD', share: (rent) => (rent <= 850 ? 0.1 : rent <= 1_200 ? 0.09 : 0.08), letting: (rent) => Math.max(rent * 0.5, 450), renewal: 0, source: 'https://www.nexuspropertymanagement.com/connecticut/hamden/price' },
  { id: 'foxtons', cityId: 'uk-eng-london', name: 'Foxtons', currency: 'GBP', share: (_rent, renewals) => (renewals === 0 ? 0.132 + 0.072 : (renewals <= 2 ? 0.12 : 0.084) + 0.048), letting: () => 450, renewal: 0, source: 'https://www.foxtons.co.uk/landlord/property-management/fees' },
  { id: 'property-vision', cityId: 'ie-lei-dublin', name: 'Property Vision', currency: 'EUR', share: () => 0, flat: 600 * VAT_IE, letting: (rent) => rent * VAT_IE, renewal: 0, source: 'https://propertyvision.ie/letting-agent-fees-dublin/' },
  { id: 'pmp-toronto', cityId: 'ca-on-toronto', name: 'Property Management Partners', currency: 'CAD', share: () => 0.069, minimum: 125, letting: (rent) => rent * 12 * 0.084, renewal: 0, source: 'https://propertymanagementpartners.ca/toronto-on-property-management-fees/' },
  { id: 'merestone', cityId: 'ca-bc-vancouver', name: 'Merestone Property Management', currency: 'CAD', share: () => 0.085 * GST, letting: (rent) => rent * 0.5 * GST, renewal: 0, source: 'https://merestonepm.com/property-management-fees-services/' },
];
