/**
 * Who a garment is cut for, and the aisles that were missing.
 *
 * Two things are held here. First, that the wardrobe now has a men's side and
 * a women's side and that a shop leads with the right one — while refusing
 * nothing, because that is the rule everywhere else in SLATE and it does not
 * get an exception for clothes.
 *
 * Second, that the four aisles nobody had built have a hundred real things in
 * them for each side: underwear, socks, earrings, and necklaces and chains.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CATALOG, shoppableItems } from '@/engine/content/catalog';
import { MENS, WOMENS, audienceOf } from '@/engine/content/audience';
import {
  MENS_EARRINGS, MENS_NECKLACES, REAL_ADORNMENT, WOMENS_EARRINGS, WOMENS_NECKLACES,
} from '@/engine/content/adornment';
import {
  MENS_SOCKS, MENS_UNDERWEAR, REAL_INTIMATES, WOMENS_SOCKS, WOMENS_UNDERWEAR,
} from '@/engine/content/intimates';
import { JEWELLERY_SLOTS, SLOTS, jewellerySlotFor } from '@/engine/content/wardrobe';
import { preferenceOf, shows } from '@/engine/systems/wardrobe';
import { createAsset, shoppingCatalogue } from '@/engine/systems/commerce';

const WEAR_CATEGORIES = ['clothing', 'footwear', 'accessory', 'watch', 'jewelry'];

describe('a hundred real things in each of the four missing aisles', () => {
  const groups = [
    ["men's underwear", MENS_UNDERWEAR, 'men'],
    ["women's underwear", WOMENS_UNDERWEAR, 'women'],
    ["men's socks", MENS_SOCKS, 'men'],
    ["women's socks", WOMENS_SOCKS, 'women'],
    ["men's earrings", MENS_EARRINGS, 'men'],
    ["women's earrings", WOMENS_EARRINGS, 'women'],
    ["men's necklaces", MENS_NECKLACES, 'men'],
    ["women's necklaces", WOMENS_NECKLACES, 'women'],
  ] as const;

  for (const [label, items, audience] of groups) {
    it(`carries at least a hundred in ${label}, all cut for that side`, () => {
      expect(items.length, `${label} is short`).toBeGreaterThanOrEqual(100);
      const wrong = items.filter((i) => i.audience !== audience);
      expect(wrong.map((i) => i.id), `${label} has rows on the wrong side`).toEqual([]);
    });
  }

  it('never uses the same id twice, and never the same product name twice', () => {
    const all = [...REAL_INTIMATES, ...REAL_ADORNMENT];
    const ids = new Set<string>();
    const dupIds = all.filter((i) => (ids.has(i.id) ? true : (ids.add(i.id), false))).map((i) => i.id);
    expect(dupIds).toEqual([]);

    const names = new Set<string>();
    const dupNames = all.filter((i) => (names.has(i.name) ? true : (names.add(i.name), false))).map((i) => i.name);
    expect(dupNames).toEqual([]);
  });

  it('names a real brand on every one, and puts the brand in the product name', () => {
    for (const item of [...REAL_INTIMATES, ...REAL_ADORNMENT]) {
      expect(item.brand.length, item.id).toBeGreaterThan(1);
      // The name leads with the maker, the way the rest of the catalogue does,
      // so a shelf reads as a shelf rather than a list of nouns.
      const brandHead = item.brand.split(/[\s&]/)[0]!.toLowerCase();
      expect(item.name.toLowerCase(), `${item.id} does not name its brand`).toContain(brandHead);
    }
  });

  it('says out loud that the price is SLATE’s own arithmetic', () => {
    for (const item of [...REAL_INTIMATES, ...REAL_ADORNMENT]) {
      expect(item.source, item.id).toBe('calibrated_estimate');
      expect(item.note, item.id).toMatch(/public record/i);
    }
  });

  it('hangs each one on a peg that exists', () => {
    for (const item of [...REAL_INTIMATES, ...REAL_ADORNMENT]) {
      expect(SLOTS, item.id).toContain(item.slot);
    }
  });

  it('reaches the catalogue, so it can actually be bought', () => {
    for (const id of ['u_m_saxx_vibe', 'u_w_cuup_balconette', 's_m_falke_airport', 's_w_wolford_neon40',
      'e_m_tom_wood_ear', 'e_w_vca_alhambra_earring', 'n_m_le_gramme_chain', 'n_w_tiffany_open_heart']) {
      expect(CATALOG.get(id), id).toBeDefined();
    }
  });
});

describe('jewellery is four pegs, not one', () => {
  it('has a peg each for earrings, a necklace, a ring and a bracelet', () => {
    for (const slot of ['earrings', 'necklace', 'ring', 'bracelet']) expect(SLOTS).toContain(slot);
    expect(JEWELLERY_SLOTS).toContain('jewellery');
  });

  it('works out which peg a piece belongs on from what it is', () => {
    expect(jewellerySlotFor('earrings', 'Mejuri Bold Hoops')).toBe('earrings');
    expect(jewellerySlotFor('necklace', 'Tiffany HardWear Link Necklace')).toBe('necklace');
    expect(jewellerySlotFor('chain', 'JAXXON 3mm Cuban Link Chain')).toBe('necklace');
    expect(jewellerySlotFor('pendant', 'Foundrae Medallion Pendant')).toBe('necklace');
    expect(jewellerySlotFor('ring', 'Cartier Trinity Ring')).toBe('ring');
    expect(jewellerySlotFor('engagement', 'Tiffany Setting Engagement Ring')).toBe('ring');
    expect(jewellerySlotFor('bracelet', 'Cartier Love Bracelet')).toBe('bracelet');
    // Nothing forced: cufflinks are none of the four and keep the old peg.
    expect(jewellerySlotFor('cufflinks', 'Deakin & Francis Enamel Cufflinks')).toBe('jewellery');
    // The subcategory decides, so a name that borrows another peg's word does
    // not move the piece: a Chain Bracelet is a bracelet.
    expect(jewellerySlotFor('bracelet', 'Cartier Panthère Chain Bracelet')).toBe('bracelet');
    expect(jewellerySlotFor('necklace', 'Tiffany Diamonds By The Yard Necklace')).toBe('necklace');
    expect(jewellerySlotFor('engagement', 'Tiffany Setting Engagement Ring, One Carat')).toBe('ring');
    // And when the catalogue says nothing useful, the name is the fallback.
    expect(jewellerySlotFor('', 'Missoma Lucy Williams Chain')).toBe('necklace');
  });

  it('lets a chain, a pair of earrings and a ring be on at the same time', () => {
    const sim = quickSave({}, 'four-pegs');
    // Straight into the wardrobe, so the test is about pegs and not shopping.
    const own = (catalogId: string) => {
      const item = CATALOG.require(catalogId);
      return createAsset(sim, {
        ownerId: sim.player.id, catalogItem: item, purchasePrice: item.basePrice, acquiredVia: 'purchase',
      }).id;
    };
    const worn = [own('e_w_vca_alhambra_earring'), own('n_w_tiffany_open_heart'), own('j_cartier_trinity')];
    for (const id of worn) {
      const result = sim.execute({ kind: 'wear.put_on', payload: { assetId: id } });
      expect(result.ok, result.error).toBe(true);
    }
    const on = sim.universe.people[sim.player.id]!.wearing ?? [];
    expect(on, 'one of them displaced another').toHaveLength(3);
    // And the pegs really are different ones.
    const slots = on.map((id) => sim.universe.assets[id]!.wardrobe!.slot);
    expect(new Set(slots)).toEqual(new Set(['earrings', 'necklace', 'ring']));
  });
});

describe('which rack a shop leads with', () => {
  it('lets everything through when the answer is both', () => {
    expect(shows('men', 'both')).toBe(true);
    expect(shows('women', 'both')).toBe(true);
    expect(shows(undefined, 'both')).toBe(true);
  });

  it('always shows what is not cut for one side or the other', () => {
    expect(shows('unisex', 'men')).toBe(true);
    expect(shows('unisex', 'women')).toBe(true);
    // An item with nothing recorded is offered to everybody rather than hidden.
    expect(shows(undefined, 'men')).toBe(true);
  });

  it('shows one side to somebody who asked for that side', () => {
    expect(shows('men', 'men')).toBe(true);
    expect(shows('women', 'men')).toBe(false);
    expect(shows('women', 'women')).toBe(true);
    expect(shows('men', 'women')).toBe(false);
  });

  it('takes the actress title as the answer until somebody says otherwise', () => {
    // The title is not written on the person; the pronouns imply it, exactly
    // as they do for the award categories that are named for one.
    const her = quickSave({ pronouns: 'she/her' }, 'rack-actress');
    expect(preferenceOf(her, her.player.id)).toBe('women');
    const him = quickSave({ pronouns: 'he/him' }, 'rack-actor');
    expect(preferenceOf(him, him.player.id)).toBe('men');
  });

  it('is a preference and not a lock: it can be set, and set back', () => {
    const sim = quickSave({ pronouns: 'she/her' }, 'rack-set');
    expect(sim.execute({ kind: 'wear.set_preference', payload: { preference: 'men' } }).ok).toBe(true);
    expect(preferenceOf(sim, sim.player.id)).toBe('men');
    expect(sim.execute({ kind: 'wear.set_preference', payload: { preference: 'both' } }).ok).toBe(true);
    expect(preferenceOf(sim, sim.player.id)).toBe('both');
    expect(sim.execute({ kind: 'wear.set_preference', payload: { preference: 'neither' } }).ok).toBe(false);
  });

  it('leads with one rack and still sells the other when asked', () => {
    const sim = quickSave({ pronouns: 'he/him' }, 'rack-shop');
    expect(sim.execute({ kind: 'wear.set_preference', payload: { preference: 'men' } }).ok).toBe(true);

    const led = shoppingCatalogue(sim, 'clothing');
    expect(led.length, 'the mens rack is empty').toBeGreaterThan(20);
    expect(led.some((r) => r.item.audience === 'women'), 'a gown is on the mens rack').toBe(false);

    const all = shoppingCatalogue(sim, 'clothing', true);
    expect(all.length, 'the whole floor is no bigger than one rack').toBeGreaterThan(led.length);
    expect(all.some((r) => r.item.audience === 'women'), 'the whole floor is missing the other rack').toBe(true);
  });
});

describe('the audience list against the catalogue it describes', () => {
  it('names only ids that still exist', () => {
    const known = new Set(shoppableItems().map((i) => i.id));
    const gone = [...MENS, ...WOMENS].filter((id) => !known.has(id));
    expect(gone, 'these ids are on an audience list and not in the catalogue').toEqual([]);
  });

  it('never puts the same id on both lists', () => {
    const both = MENS.filter((id) => WOMENS.includes(id));
    expect(both).toEqual([]);
  });

  it('gets the obvious ones right', () => {
    expect(audienceOf('c_tom_ford_tux')).toBe('men');
    expect(audienceOf('c_valentino_gown')).toBe('women');
    expect(audienceOf('f_louboutin_so_kate')).toBe('women');
    expect(audienceOf('f_alden_990')).toBe('men');
    expect(audienceOf('a_birkin_30')).toBe('women');
    expect(audienceOf('a_drakes_tie')).toBe('men');
    // A t-shirt, a pair of jeans and a dive watch are not split by cut.
    expect(audienceOf('c_uniqlo_supima')).toBe('unisex');
    expect(audienceOf('c_levis_501')).toBe('unisex');
    expect(audienceOf('w_omega_moonwatch')).toBe('unisex');
    expect(audienceOf('f_samba')).toBe('unisex');
  });

  it('stamps every wardrobe row in the catalogue with an answer', () => {
    const wear = shoppableItems().filter((i) => WEAR_CATEGORIES.includes(i.category));
    const missing = wear.filter((i) => i.audience === undefined);
    expect(missing.map((i) => i.id), 'these wardrobe rows say nothing about cut').toEqual([]);
  });

  it('has a real men’s side and a real women’s side, not a token one', () => {
    const wear = shoppableItems().filter((i) => WEAR_CATEGORIES.includes(i.category));
    const mens = wear.filter((i) => i.audience === 'men').length;
    const womens = wear.filter((i) => i.audience === 'women').length;
    expect(mens, 'the mens side is thin').toBeGreaterThanOrEqual(250);
    expect(womens, 'the womens side is thin').toBeGreaterThanOrEqual(250);
  });
});
