/**
 * SLATE — one shape for anything sold by brand (the owner's expansion of
 * 2026-10-03, §4): the brand, the product as its maker names it, the
 * variants it's actually offered in, and each seller's offer of it in a
 * market, kept apart. An owned item points back to its product, the variant
 * chosen and the offer it was bought on.
 *
 * - A **product** is one model: "Away The Carry-On". Its attributes are its
 *   maker's: liters, weight, material, a warranty's years.
 * - A **variant** is a combination the maker offers: a color, a size. Only
 *   combinations sold are kept; nothing is made up by crossing lists.
 * - An **offer** is one seller's listing in one market, at its own price on
 *   the day read, with or without its tax as the market shows it. A price
 *   read is that day's, not a live price.
 * Catalogs are content, never copied into a save; a save keeps only the ids
 * of what was bought.
 */

export type CatalogMarket = 'us' | 'uk' | 'ie' | 'ca' | 'mx';
export type ReadStatus = 'verified' | 'secondhand';

export interface CatalogOffer {
  /** Stable: an owned item's kind names it. */
  id: string; market: CatalogMarket; seller: string; channel: 'online' | 'store';
  price: number; currency: string; taxIncluded: boolean; url: string | null; read: string; status: ReadStatus;
  /**
   * The model number the seller lists it under, where its market's differs from the product's own (from 2026-10-04):
   * Samsung's UE32F6000FKXXU in Britain for its American UN32F6000FFXZA. A shopper there sees this one.
   */
  model?: string;
}
export interface CatalogVariant { id: string; attrs: Readonly<Record<string, string>> }
export interface CatalogProduct {
  id: string; category: string; brand: string; family: string | null; model: string;
  attrs: Readonly<Record<string, string | number | boolean | null>>;
  variants: readonly CatalogVariant[]; offers: readonly CatalogOffer[];
  url: string | null; status: ReadStatus;
}
