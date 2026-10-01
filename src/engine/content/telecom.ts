/**
 * SLATE — the internet at home and the phone in a pocket, by provider
 * (Stage 11 of `docs/BACKLOG.md`, from 2026-10-01), from
 * `docs/research/world/research-utilities.json`, read 2026-10-01. Each is a
 * provider's advertised starting offer on that date, not a quote for an
 * address, and several were read through comparison sites (`confidence`).
 *
 * **Internet**, two offers a town where two were found. An offer's price
 * holds for its months, then its standard price where the provider
 * publishes one: Virgin Media's £23.99 for 24 months then £62, eir's €34.99
 * for 24 then €75.99, Virgin Media Ireland's €35 for 12 then €70. Spectrum,
 * Frontier and BT print no price after; SLATE keeps those at the offer, and
 * says so. Verizon's comes with a multi-year price lock. A contract's months
 * are owed if it's left early, SLATE's reading of an early termination
 * charge. Canada's are quoted before tax, and Ontario's 13% HST and British
 * Columbia's 5% GST and 7% PST are added; Britain's, Ireland's and Mexico's
 * are with tax; America's before its local taxes, which aren't kept.
 *
 * **A phone**, each country's cheapest plan read: Mint Mobile's 6GB at $15 a
 * month on its twelve-month prepay, paid a year at a time; giffgaff's 2GB at
 * £6 a month, rolling; Tesco Mobile's €10; Public Mobile's 1GB at C$22, with
 * the province's tax; Telcel Amigo's MX$50 for 30 days.
 */

export interface InternetPlan {
  id: string;
  cityId: string;
  provider: string;
  plan: string;
  currency: string;
  /** The offer, a month, with tax where the place adds it. */
  monthly: number;
  /** Its months, then its standard price where published; a contract's term where there is one. */
  months?: number;
  after?: number;
  contract?: number;
  source: string;
  confidence?: 'medium' | 'low';
}

const HST_ON = 1.13;
const GST_PST_BC = 1.12;

export const INTERNET: readonly InternetPlan[] = [
  { id: 'verizon-fios-300', cityId: 'us-ny-newyork', provider: 'Verizon Fios', plan: 'Fios 300 Mbps', currency: 'USD', monthly: 30, source: 'verizon.com/home/internet/near-me/new-york-ny/' },
  { id: 'spectrum-100-ny', cityId: 'us-ny-newyork', provider: 'Spectrum', plan: 'Internet 100', currency: 'USD', monthly: 30, months: 12, source: 'spectrum.com/internet' },
  { id: 'spectrum-100-la', cityId: 'us-ca-losangeles', provider: 'Spectrum', plan: 'Internet 100', currency: 'USD', monthly: 30, months: 12, source: 'spectrum.com/internet' },
  { id: 'att-fiber-300', cityId: 'us-ca-losangeles', provider: 'AT&T Fiber', plan: 'Internet 300', currency: 'USD', monthly: 35, source: 'whistleout / att.com/local', confidence: 'low' },
  { id: 'frontier-fiber-200', cityId: 'us-ct-newhaven', provider: 'Frontier Fiber', plan: 'Fiber 200', currency: 'USD', monthly: 29.99, months: 12, source: 'broadbandnow / allconnect New Haven', confidence: 'medium' },
  { id: 'xfinity-connect', cityId: 'us-ct-newhaven', provider: 'Xfinity', plan: 'Connect', currency: 'USD', monthly: 30, source: 'broadbandnow / allconnect New Haven', confidence: 'low' },
  { id: 'virgin-m125', cityId: 'uk-eng-london', provider: 'Virgin Media', plan: 'M125 Fibre Broadband', currency: 'GBP', monthly: 23.99, months: 24, after: 62, contract: 24, source: 'virginmedia.com/broadband, via dealsonbroadband.co.uk', confidence: 'medium' },
  { id: 'bt-full-fibre-100', cityId: 'uk-eng-london', provider: 'BT', plan: 'Full Fibre 100', currency: 'GBP', monthly: 30.99, months: 24, contract: 24, source: 'bt.com, via comparison sites', confidence: 'low' },
  { id: 'eir-500', cityId: 'ie-lei-dublin', provider: 'eir', plan: 'Standard 500Mb', currency: 'EUR', monthly: 34.99, months: 24, after: 75.99, contract: 24, source: 'eir.ie/shop/broadband' },
  { id: 'virgin-ie-500', cityId: 'ie-lei-dublin', provider: 'Virgin Media Ireland', plan: '500Mb', currency: 'EUR', monthly: 35, months: 12, after: 70, contract: 12, source: 'virginmedia.ie/broadband/buy-a-broadband-package/' },
  { id: 'bell-fibe-150', cityId: 'ca-on-toronto', provider: 'Bell', plan: 'Fibe 150', currency: 'CAD', monthly: 65 * HST_ON, source: 'internetadvice.ca Canadian Internet Price Tracker, 2026-09-22', confidence: 'medium' },
  { id: 'rogers-starter-150', cityId: 'ca-on-toronto', provider: 'Rogers', plan: 'Xfinity Starter 150', currency: 'CAD', monthly: 75 * HST_ON, source: 'internetadvice.ca Canadian Internet Price Tracker, 2026-09-22', confidence: 'medium' },
  { id: 'telus-purefibre-500', cityId: 'ca-bc-vancouver', provider: 'Telus', plan: 'PureFibre 500', currency: 'CAD', monthly: 70 * GST_PST_BC, source: 'telus.com/en/deals-and-bundles/internet-500', confidence: 'medium' },
  { id: 'telmex-infinitum', cityId: 'mx-cmx-mexicocity', provider: 'Telmex', plan: 'Infinitum', currency: 'MXN', monthly: 349, source: 'xataka.com.mx, March 2026', confidence: 'medium' },
  { id: 'izzi-internet', cityId: 'mx-cmx-mexicocity', provider: 'izzi', plan: 'Internet', currency: 'MXN', monthly: 379, source: 'comparison sites', confidence: 'low' },
];

export interface MobilePlan { id: string; country: string; provider: string; plan: string; currency: string; monthly: number; /** Paid this many months ahead, at once. */ prepayMonths?: number; source: string }

export const MOBILE: readonly MobilePlan[] = [
  { id: 'mint-6gb', country: 'us', provider: 'Mint Mobile', plan: '6GB', currency: 'USD', monthly: 15, prepayMonths: 12, source: 'whistleout.com best-mint-mobile-plans' },
  { id: 'giffgaff-2gb', country: 'uk', provider: 'giffgaff', plan: '2GB 5G', currency: 'GBP', monthly: 6, source: 'moneysupermarket / simsherpa' },
  { id: 'tesco-mobile-10', country: 'ie', provider: 'Tesco Mobile', plan: '€10 SIM Only', currency: 'EUR', monthly: 10, source: 'smartsaver.ie, bonkers.ie' },
  { id: 'public-mobile-1gb', country: 'ca', provider: 'Public Mobile', plan: '4G 1GB', currency: 'CAD', monthly: 22, source: 'whistleout.ca, topicks.ca' },
  { id: 'telcel-amigo', country: 'mx', provider: 'Telcel', plan: 'Amigo', currency: 'MXN', monthly: 50, source: 'internetencasa.mx, selectra.mx' },
];

/** A Canadian province's tax on a phone plan: Ontario's HST, British Columbia's GST and PST. */
export const PHONE_TAX: Readonly<Record<string, number>> = { 'ca-08': HST_ON, 'ca-02': GST_PST_BC };
