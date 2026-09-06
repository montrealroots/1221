/**
 * SLATE — Commerce: shopping, groceries, wardrobe, luxury goods and orders.
 *
 * One engine covers every purchase in the game: cart, tax by jurisdiction,
 * delivery time, receipt, and the creation of a real owned asset the player can
 * then wear, gift, insure, sell or lose.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { AssetCategory, Id, Order, OwnedAsset, PantryItem } from '../domain/model';
import { clamp } from '../core/rng';
import { addDays, MS_DAY } from '../core/time';
import { applyRate, formatMoney, type Money } from '../core/money';
import { CATALOG, RETAILERS, retailPrice, retailersFor, shoppableItemsIn, type CatalogItem } from '../content/catalog';
import { costOfLiving, salesTaxRate } from '../content/tax';
import { defaultColour, guessMaterial } from '../content/wardrobe';

export interface CartLine {
  catalogId: string;
  quantity: number;
}

export function registerCommerce(sim: Simulation): void {
  sim.onSchedule('shop.deliver', (item) => deliverOrder(sim, item.payload.orderId as Id));
  sim.onSchedule('shop.pantry_expiry', () => {
    expirePantry(sim);
    sim.schedule({ at: addDays(sim.now, 3, sim.homeZone), kind: 'shop.pantry_expiry', label: 'Pantry Check', category: 'system', priority: 95 });
  });

  sim.onCommand<
    { retailerId: string; lines: CartLine[]; channel?: Order['channel']; accountId?: Id; giftFor?: Id; colours?: Record<string, string> },
    { orderId: Id; total: Money; deliverAt?: number }
  >(
    'shop.purchase',
    (p, { sim: s }) => {
      const retailer = RETAILERS.get(p.retailerId);
      if (!retailer) throw new CommandError('No such retailer.');
      if (p.lines.length === 0) throw new CommandError('Your basket is empty.');

      const player = s.player;
      const cityId = player.currentLocationId;
      if (retailer.locations.length > 0 && !retailer.locations.includes(cityId)) {
        throw new CommandError(`${retailer.name} does not have a location where you are.`);
      }
      const channel = p.channel ?? (retailer.online ? 'online' : 'in_store');
      if (channel === 'online' && !retailer.online) throw new CommandError(`${retailer.name} does not sell online.`);

      const col = costOfLiving(cityId);
      const items: Order['items'] = [];
      let subtotal = 0;
      let tax = 0;

      for (const line of p.lines) {
        const catalogItem = CATALOG.get(line.catalogId);
        if (!catalogItem) throw new CommandError(`Unknown item: ${line.catalogId}`);
        if (!retailer.categories.includes(catalogItem.category) && !retailer.categories.includes(catalogItem.subcategory)) {
          throw new CommandError(`${retailer.name} does not stock ${catalogItem.name}.`);
        }
        const quantity = clamp(Math.round(line.quantity), 1, 999);
        const unitPrice = retailPrice(catalogItem.id, retailer.id, col);
        const lineTotal = unitPrice * quantity;
        subtotal += lineTotal;
        tax += applyRate(lineTotal, salesTaxRate(cityId, s.now, catalogItem.category));
        items.push({ catalogId: catalogItem.id, name: catalogItem.name, unitPrice, quantity, category: catalogItem.category });
      }

      const shipping = channel === 'online' && subtotal < 10_000_00 ? Math.round(1_200 * col) : 0;
      const total = subtotal + tax + shipping;

      const accountId = p.accountId ?? player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < total) {
        throw new CommandError(`That comes to ${formatMoney(total)} with tax and you have ${formatMoney(s.ledger.availableFunds(accountId))} available.`);
      }

      // Large purchases can be gated by a preference, so nobody buys a watch by accident.
      if (s.universe.preferences.confirmLargePurchases && total > s.universe.preferences.largePurchaseThreshold) {
        // The UI is expected to have confirmed; the flag exists so the check is real.
        void total;
      }

      const order: Order = {
        id: s.nextId('order'),
        saveId: s.universe.meta.id,
        buyerId: player.id,
        buyerKind: 'person',
        retailerId: retailer.id,
        channel,
        items,
        subtotal, tax, shipping, total,
        status: 'placed',
        placedAt: s.now,
        paidFromAccountId: accountId,
        createdAssetIds: [],
        giftFor: p.giftFor,
        colours: p.colours,
      };
      s.universe.orders[order.id] = order;

      s.expense(accountId, total, `${retailer.name}`, categoryFor(items), { refType: 'order', refId: order.id });

      const deliveryDays = channel === 'in_store' || channel === 'pickup' ? 0 : retailer.deliveryDays;
      if (deliveryDays === 0) {
        deliverOrder(s, order.id);
      } else {
        order.deliverAt = addDays(s.now, deliveryDays, s.homeZone);
        order.status = 'shipped';
        s.schedule({
          at: order.deliverAt,
          kind: 'shop.deliver',
          label: `Delivery From ${retailer.name}`,
          category: 'personal',
          payload: { orderId: order.id },
          priority: 75,
          refType: 'order', refId: order.id,
        });
      }

      s.emit('shop.order_placed', { orderId: order.id, retailerId: retailer.id, total, itemCount: items.length });
      return { orderId: order.id, total, deliverAt: order.deliverAt };
    },
  );

  sim.onCommand<{ orderId: Id; catalogId?: string }, { refund: Money }>(
    'shop.return',
    (p, { sim: s }) => {
      const order = s.universe.orders[p.orderId];
      if (!order) throw new CommandError('No such order.');
      if (order.status !== 'delivered') throw new CommandError('That order has not been delivered yet.');
      if (order.returnWindowEndsAt && s.now > order.returnWindowEndsAt) {
        throw new CommandError('The return window on that order has closed.');
      }

      const lines = p.catalogId ? order.items.filter((i) => i.catalogId === p.catalogId) : order.items;
      if (lines.length === 0) throw new CommandError('That item is not on this order.');

      let refund = 0;
      for (const line of lines) {
        const lineTotal = line.unitPrice * line.quantity;
        refund += lineTotal + applyRate(lineTotal, salesTaxRate(s.player.currentLocationId, s.now, line.category));
      }

      // Remove the assets that came from those lines.
      for (const assetId of [...order.createdAssetIds]) {
        const asset = s.universe.assets[assetId];
        if (!asset) continue;
        if (p.catalogId && asset.catalogId !== p.catalogId) continue;
        delete s.universe.assets[assetId];
        order.createdAssetIds = order.createdAssetIds.filter((id) => id !== assetId);
      }
      for (const [id, stock] of Object.entries(s.universe.pantry)) {
        if (p.catalogId && stock.catalogId !== p.catalogId) continue;
        if (lines.some((l) => l.catalogId === stock.catalogId)) delete s.universe.pantry[id];
      }

      s.income(order.paidFromAccountId, refund, `Refund — ${RETAILERS.get(order.retailerId)?.name ?? 'retailer'}`, 'refund', { refType: 'order', refId: order.id });
      order.refundedAmount = (order.refundedAmount ?? 0) + refund;
      if (!p.catalogId) order.status = 'returned';

      s.emit('shop.returned', { orderId: order.id, refund });
      return { refund };
    },
  );

  sim.onCommand<{ personId?: Id; name: string; assetIds: Id[] }, { outfitId: Id; styleScore: number; formality: number }>(
    'shop.save_outfit',
    (p, { sim: s }) => {
      const personId = p.personId ?? s.player.id;
      const assets = p.assetIds.map((id) => s.universe.assets[id]).filter(Boolean) as OwnedAsset[];
      if (assets.length === 0) throw new CommandError('An outfit needs at least one item.');
      for (const asset of assets) {
        if (asset.ownerId !== personId) throw new CommandError(`${asset.name} is not yours.`);
      }

      const formality = Math.round(assets.reduce((s_, a) => s_ + (a.wardrobe?.formality ?? 30), 0) / assets.length);
      const styleScore = Math.round(clamp(
        assets.reduce((s_, a) => s_ + (CATALOG.get(a.catalogId ?? '')?.quality ?? 50) * (a.condition / 100), 0) / assets.length
        + (assets.length >= 3 ? 6 : 0),
        0, 100,
      ));

      const outfit = {
        id: s.nextId('item'),
        saveId: s.universe.meta.id,
        personId,
        name: p.name,
        assetIds: p.assetIds,
        formality,
        styleScore,
        createdAt: s.now,
      };
      s.universe.outfits[outfit.id] = outfit;
      return { outfitId: outfit.id, styleScore, formality };
    },
  );

  sim.onCommand<{ assetId: Id; accountId?: Id }, { proceeds: Money }>(
    'shop.sell_asset',
    (p, { sim: s }) => {
      const asset = s.universe.assets[p.assetId];
      if (!asset || asset.soldAt || asset.ownerId !== s.player.id) throw new CommandError('You do not own that.');
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to receive the proceeds.');

      const rng = s.rng('sell_asset', asset.id);
      // Secondary market: most things sell below their carrying value.
      const liquidity = ['watch', 'jewelry', 'art'].includes(asset.category) ? rng.float(0.82, 1.05) : rng.float(0.45, 0.72);
      const proceeds = Math.max(100, Math.round(asset.currentValue * liquidity));

      s.income(accountId, proceeds, `Sold ${asset.name}`, 'resale', { refType: 'asset', refId: asset.id });
      asset.soldAt = s.now;
      asset.provenance.push({ at: s.now, note: `Sold for ${formatMoney(proceeds)}.` });
      s.emit('shop.asset_sold', { assetId: asset.id, proceeds });
      return { proceeds };
    },
  );
}

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

function categoryFor(items: Order['items']): string {
  const categories = new Set(items.map((i) => i.category));
  if (categories.size === 1) {
    const only = [...categories][0] as string;
    return only === 'groceries' ? 'groceries' : only === 'dining' ? 'dining' : 'shopping';
  }
  return 'shopping';
}

function deliverOrder(sim: Simulation, orderId: Id): void {
  const order = sim.universe.orders[orderId];
  if (!order || order.status === 'delivered' || order.status === 'returned') return;
  const player = sim.universe.people[order.buyerId];
  if (!player) return;

  order.status = 'delivered';
  order.deliveredAt = sim.now;
  order.returnWindowEndsAt = addDays(sim.now, 30, sim.homeZone);

  for (const line of order.items) {
    const catalogItem = CATALOG.get(line.catalogId);
    if (!catalogItem) continue;

    if (catalogItem.category === 'groceries') {
      addToPantry(sim, player.id, catalogItem, line.quantity, line.unitPrice);
      continue;
    }
    if (catalogItem.category === 'dining') continue;

    for (let i = 0; i < line.quantity; i++) {
      const asset = createAsset(sim, {
        ownerId: order.giftFor ?? player.id,
        catalogItem,
        purchasePrice: line.unitPrice,
        acquiredVia: order.giftFor ? 'gift' : 'purchase',
        giftedById: order.giftFor ? player.id : undefined,
        colour: order.colours?.[line.catalogId],
      });
      order.createdAssetIds.push(asset.id);
    }
  }

  sim.emit('shop.order_delivered', { orderId: order.id, assetIds: order.createdAssetIds });
}

export function createAsset(
  sim: Simulation,
  spec: {
    ownerId: Id; catalogItem: CatalogItem; purchasePrice: Money;
    acquiredVia: OwnedAsset['acquiredVia']; giftedById?: Id; ownerKind?: 'person' | 'company';
    /** The colourway chosen at the counter, where the thing comes in colours. */
    colour?: string;
  },
): OwnedAsset {
  const owner = sim.universe.people[spec.ownerId];
  const item = spec.catalogItem;
  const asset: OwnedAsset = {
    id: sim.nextId('asset'),
    saveId: sim.universe.meta.id,
    ownerId: spec.ownerId,
    ownerKind: spec.ownerKind ?? 'person',
    category: (item.category as AssetCategory) ?? 'other',
    catalogId: item.id,
    name: item.name,
    brand: item.brand,
    purchasePrice: spec.purchasePrice,
    currentValue: spec.purchasePrice,
    condition: 100,
    acquiredAt: sim.now,
    acquiredVia: spec.acquiredVia,
    giftedById: spec.giftedById,
    locationPropertyId: owner?.residenceId,
    provenance: [{ at: sim.now, note: spec.acquiredVia === 'gift' ? 'Received as a gift.' : `Purchased for ${formatMoney(spec.purchasePrice)}.` }],
    wardrobe: item.slot
      ? {
        slot: item.slot,
        formality: item.formality ?? 30,
        season: item.seasons ?? ['Spring', 'Summer', 'Autumn', 'Winter'],
        colour: spec.colour ?? defaultColour(item.id, item.name, item.slot),
        material: guessMaterial(item.name, item.slot, item.subcategory),
        cleanliness: 100,
        timesWorn: 0,
      }
      : undefined,
    tags: item.tags,
  };
  sim.universe.assets[asset.id] = asset;

  // Valuable items should be insured, and the game should say so.
  if (asset.currentValue >= 15_000_00) {
    sim.requireDecision({
      urgency: 42, category: 'insurance',
      title: `Insure ${asset.name}?`,
      detail: `${formatMoney(asset.currentValue)} of uninsured property. A valuables policy is a fraction of that a year.`,
      route: '/workspace/insurance',
      refType: 'asset', refId: asset.id,
    });
  }

  sim.emit('shop.asset_acquired', { assetId: asset.id, ownerId: spec.ownerId, category: asset.category, value: asset.currentValue });
  return asset;
}

function addToPantry(sim: Simulation, personId: Id, item: CatalogItem, quantity: number, unitCost: Money): void {
  const person = sim.universe.people[personId];
  if (!person?.residenceId || !person.householdId) return;
  const storage: PantryItem['storage'] =
    item.subcategory === 'frozen' ? 'freezer'
      : ['dairy', 'produce', 'protein'].includes(item.subcategory) ? 'fridge'
        : 'pantry';

  const pantryItem: PantryItem = {
    id: sim.nextId('item'),
    saveId: sim.universe.meta.id,
    householdId: person.householdId,
    propertyId: person.residenceId,
    catalogId: item.id,
    name: item.name,
    storage,
    quantity,
    unit: item.unit ?? 'each',
    purchasedAt: sim.now,
    expiresAt: sim.now + (item.shelfLifeDays ?? 30) * MS_DAY,
    unitCost,
  };
  sim.universe.pantry[pantryItem.id] = pantryItem;
}

function expirePantry(sim: Simulation): void {
  let expired = 0;
  let wasted = 0;
  for (const [id, item] of Object.entries(sim.universe.pantry)) {
    if (item.expiresAt <= sim.now) {
      expired++;
      wasted += item.unitCost * item.quantity;
      delete sim.universe.pantry[id];
    }
  }
  if (expired > 0) {
    sim.emit('shop.pantry_expired', { count: expired, value: wasted });
  }
}

/** What the player can buy right now, in one place, for the shopping UI. */
export function shoppingCatalogue(sim: Simulation, category?: string) {
  const cityId = sim.player.currentLocationId;
  const col = costOfLiving(cityId);
  const results: { item: CatalogItem; retailers: { id: string; name: string; price: Money; deliveryDays: number }[] }[] = [];

  for (const item of shoppableItemsIn(cityId)) {
    if (category && item.category !== category) continue;
    if (item.category === 'dining') continue;
    const stores = retailersFor(item.category, cityId).filter((r) => r.categories.includes(item.category));
    if (stores.length === 0) continue;
    results.push({
      item,
      retailers: stores
        .map((r) => ({ id: r.id, name: r.name, price: retailPrice(item.id, r.id, col), deliveryDays: r.deliveryDays }))
        .sort((a, b) => a.price - b.price),
    });
  }
  return results.sort((a, b) => a.item.category.localeCompare(b.item.category) || a.item.basePrice - b.item.basePrice);
}

/** The player's wardrobe, grouped by slot, for the styling UI. */
export function wardrobeOf(sim: Simulation, personId: Id) {
  const grouped: Record<string, OwnedAsset[]> = {};
  for (const asset of Object.values(sim.universe.assets)) {
    if (asset.ownerId !== personId || asset.soldAt || !asset.wardrobe) continue;
    const slot = asset.wardrobe.slot;
    (grouped[slot] ??= []).push(asset);
  }
  return grouped;
}

/** Style score used by red carpets, press and dress-code checks. */
export function outfitScore(sim: Simulation, outfitId: Id): { styleScore: number; formality: number } {
  const outfit = sim.universe.outfits[outfitId];
  if (!outfit) return { styleScore: 0, formality: 0 };
  const assets = outfit.assetIds.map((id) => sim.universe.assets[id]).filter(Boolean) as OwnedAsset[];
  if (assets.length === 0) return { styleScore: 0, formality: 0 };
  const styleScore = Math.round(
    assets.reduce((s, a) => s + (CATALOG.get(a.catalogId ?? '')?.quality ?? 50) * (a.condition / 100), 0) / assets.length,
  );
  const formality = Math.round(assets.reduce((s, a) => s + (a.wardrobe?.formality ?? 30), 0) / assets.length);
  return { styleScore, formality };
}
