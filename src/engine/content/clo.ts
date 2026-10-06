/**
 * SLATE — how warm each garment is, in clo, the measured insulation of one
 * garment worn (from 2026-10-03; `docs/research/world/research-clothing-warmth.json`).
 *
 * - ASHRAE 55-2010 Addendum h, Table 5.2.2.2B, from the ASHRAE Handbook's
 *   measurements: underwear, slips, long underwear, shirts, sweaters,
 *   trousers, skirts, dresses, suit jackets, socks, shoes, boots, sleepwear.
 * - Brüel & Kjær's table of ISO 7730's era (BO 0281) for what ASHRAE's
 *   leaves out: a coat 0.60, a down jacket 0.55, a parka 0.70, a jacket
 *   0.35, gloves 0.05.
 *
 * A garment whose weight SLATE doesn't keep takes the table's thin one where
 * it has two; a dress, unspecified, its short-sleeved shirtdress; activewear,
 * which neither table measures, a T-shirt's. A swimsuit and a scarf have no
 * published value, and count nothing. An outfit's insulation is the sum of
 * its garments', ASHRAE's rule.
 *
 * From 2026-10-05 a hat and mittens, from Kuklane and Toma (2020), Industrial
 * Health 59(1), Table 2, each measured on a thermal manikin: a warm knit or
 * fleece cap (their Biwak cap) 0.03, any other cap or hat (their Hillside
 * cap) 0.01, and mittens (their Grizzly mitten) 0.06; gloves stay Brüel &
 * Kjær's 0.05 (`research-gaps-2026-10-05.json`). Until then a hat counted
 * nothing.
 */

export const CLO = {
  bra: 0.01, underwear: 0.03, tShirt: 0.08, longUnderwearTop: 0.2, longUnderwearBottoms: 0.15, fullSlip: 0.16,
  shirt: 0.25, sweater: 0.25, trousers: 0.15, jeans: 0.24, sweatpants: 0.28, skirt: 0.14, dress: 0.29,
  suitJacket: 0.36, coat: 0.6, downJacket: 0.55, parka: 0.7, jacket: 0.35,
  socks: 0.02, tights: 0.02, kneeSocks: 0.06, shoes: 0.02, boots: 0.1, gloves: 0.05, pajamas: 0.57,
  mittens: 0.06, warmCap: 0.03, hat: 0.01,
} as const;

/** What a garment of a kind, by its name, is worth in clo. */
export function cloOf(kind: string, slot: string, label: string): number {
  const name = label.toLowerCase();
  if (slot === 'accessory') {
    if (/\bmittens?\b/.test(name)) return CLO.mittens;
    if (/\bgloves?\b/.test(name)) return CLO.gloves;
    if (/\b(beanie|toque|tuque|gorro|bobble|knit(ted)? (hat|cap)|fleece (hat|cap)|wool(len)? (hat|cap)|ushanka|trapper)\b/.test(name)) return CLO.warmCap;
    if (/\b(hats?|caps?|fedora|beret|bucket|panama|trilby|sombrero)\b/.test(name)) return CLO.hat;
    return 0;
  }
  if (kind === 'swimsuit' || slot === 'towel') return 0;
  if (kind === 'thermal-top') return CLO.longUnderwearTop;
  if (kind === 'thermal-bottom') return CLO.longUnderwearBottoms;
  if (kind === 'slip') return CLO.fullSlip;
  if (kind === 'bra') return CLO.bra;
  if (slot === 'underwear') return CLO.underwear;
  if (slot === 'socks') return /tights|hosiery|stocking|pantyhose|pantimedia|medias/.test(name) ? CLO.tights : /knee/.test(name) ? CLO.kneeSocks : CLO.socks;
  if (slot === 'shoes') return /\bboots?\b|\bbotas?\b/.test(name) ? CLO.boots : CLO.shoes;
  if (slot === 'sleep') return CLO.pajamas;
  if (slot === 'suit') return CLO.suitJacket + CLO.trousers;
  if (slot === 'outer') {
    if (kind === 'suit' || /blazer/.test(name)) return CLO.suitJacket;
    if (/parka/.test(name)) return CLO.parka;
    if (/\bdown\b|puffer/.test(name)) return CLO.downJacket;
    if (/coat|trench|\bmac\b|overcoat|abrigo/.test(name)) return CLO.coat;
    return CLO.jacket;
  }
  if (kind === 't-shirt' || slot === 'active') return /sweatpants|joggers/.test(name) ? CLO.sweatpants : CLO.tShirt;
  if (kind === 'shirt') return CLO.shirt;
  if (kind === 'sweater') return CLO.sweater;
  if (kind === 'jeans') return CLO.jeans;
  if (kind === 'skirt') return CLO.skirt;
  if (kind === 'dress' || slot === 'dress') return CLO.dress;
  if (slot === 'bottom') return /sweatpants|joggers/.test(name) ? CLO.sweatpants : CLO.trousers;
  return CLO.tShirt;
}

/** One clo, in m²·K/W. */
export const CLO_SI = 0.155;
