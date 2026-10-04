/**
 * SLATE — groceries and toiletries in a basket (from 2026-10-04, the owner's
 * expansion, §2): things put in from the town's chains and taken out, then
 * checked out a chain at a time, one payment at its till, by the debit card,
 * the credit card or cash, as clothes are (`systems/clothing.ts`). What's
 * bought goes as a single Buy's does: carried, or in the car, until it's put
 * away (`stow`).
 *
 * A checkout of groceries and toiletries together is one payment, kept as
 * food where any of it is food, since a ledger line has one category.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { GROCERY_CHAINS } from '../content/groceries';
import { deliverGroceries, groceryPrice, groceryRefusal, productById } from './kitchen';
import { giveToiletry, toiletryById, toiletryPrice, toiletryRefusal } from './hygiene';
import { payWith, payWithRefusal, type PayWith } from './household';

export interface CartLine { id: string; kind: 'grocery' | 'toiletry'; productId: string; quantity: number }

export const cartOf = (person: Person): CartLine[] => (person.cart ??= []);

/** A line's chain, its name, and what it costs here now. */
export function cartLine(sim: Simulation, person: Person, line: CartLine): { chain: string; label: string; price: Money } | undefined {
  if (line.kind === 'grocery') {
    const p = productById(line.productId);
    return p ? { chain: p.chain, label: p.name, price: groceryPrice(sim, person.currentLocationId, p) * line.quantity } : undefined;
  }
  const t = toiletryById(line.productId);
  return t ? { chain: t.chain, label: t.name, price: toiletryPrice(sim, person.currentLocationId, t) * line.quantity } : undefined;
}

const refusal = (sim: Simulation, person: Person, line: Omit<CartLine, 'id'>): string | undefined =>
  line.kind === 'grocery' ? groceryRefusal(sim, person, line.productId, line.quantity) : toiletryRefusal(person, line.productId, line.quantity, sim.now);

/** The basket's lines by chain, each chain's total here now. */
export function cartByChain(sim: Simulation, person: Person): { chain: string; name: string; lines: (CartLine & { label: string; price: Money })[]; total: Money }[] {
  const out = new Map<string, { chain: string; name: string; lines: (CartLine & { label: string; price: Money })[]; total: Money }>();
  for (const line of cartOf(person)) {
    const l = cartLine(sim, person, line);
    if (!l) continue;
    const g = out.get(l.chain) ?? { chain: l.chain, name: GROCERY_CHAINS.find((c) => c.id === l.chain)?.name ?? l.chain, lines: [], total: 0 };
    g.lines.push({ ...line, label: l.label, price: l.price });
    g.total += l.price;
    out.set(l.chain, g);
  }
  return [...out.values()];
}

/** Checks out one chain's lines: each still buyable here, one payment the way chosen, then each thing given. */
export function checkoutCart(sim: Simulation, person: Person, chain: string, way: PayWith): Money {
  const group = cartByChain(sim, person).find((g) => g.chain === chain);
  if (!group) throw new CommandError('The basket has nothing from that chain.');
  for (const line of group.lines) {
    const no = refusal(sim, person, line);
    if (no) throw new CommandError(`${line.label}: ${no}`);
  }
  const wayNo = payWithRefusal(sim, person, group.total, way, true);
  if (wayNo) throw new CommandError(wayNo);
  const food = group.lines.some((l) => l.kind === 'grocery');
  if (!payWith(sim, person, group.total, `${group.name}: ${group.lines.length === 1 ? group.lines[0]!.label : `${group.lines.length} things`}`, food ? 'food' : 'personal', way, true)) {
    throw new CommandError(`It comes to ${formatMoney(group.total, saveCurrency(sim.universe))}, more than you can pay.`);
  }
  for (const line of group.lines) {
    const each = Math.round(line.price / line.quantity);
    if (line.kind === 'grocery') deliverGroceries(sim, person, productById(line.productId)!, line.quantity, line.price);
    else for (let i = 0; i < line.quantity; i += 1) giveToiletry(sim, person, toiletryById(line.productId)!, each);
  }
  const done = new Set(group.lines.map((l) => l.id));
  person.cart = cartOf(person).filter((l) => !done.has(l.id));
  return group.total;
}

export function registerShoppingCart(sim: Simulation): void {
  sim.onCommand<{ kind: CartLine['kind']; productId: string; quantity?: number }, { lineId: string }>('cart.add', (p, { sim: s }) => {
    const person = s.player;
    const kind = p?.kind === 'toiletry' ? 'toiletry' : 'grocery';
    const quantity = Math.max(1, Math.floor(Number(p?.quantity ?? 1)));
    const line = { kind, productId: String(p?.productId ?? ''), quantity } as const;
    const no = refusal(s, person, line);
    if (no) throw new CommandError(no);
    // The same thing again is one line, more of it.
    const same = cartOf(person).find((l) => l.kind === kind && l.productId === line.productId);
    if (same) { same.quantity += quantity; return { lineId: same.id }; }
    // Numbered from the purchases', as the clothes basket's lines are.
    const made: CartLine = { id: s.nextId('purchase'), ...line };
    cartOf(person).push(made);
    return { lineId: made.id };
  });
  sim.onCommand<{ lineId: string }, { left: number }>('cart.remove', (p, { sim: s }) => {
    const cart = cartOf(s.player);
    if (!cart.some((l) => l.id === p?.lineId)) throw new CommandError('That isn’t in the basket.');
    s.player.cart = cart.filter((l) => l.id !== p.lineId);
    return { left: s.player.cart.length };
  });
  sim.onCommand<{ chain: string; payWith?: PayWith }, { paid: Money }>('cart.checkout', (p, { sim: s }) => {
    const way: PayWith = p?.payWith === 'credit' || p?.payWith === 'cash' ? p.payWith : 'debit';
    return { paid: checkoutCart(s, s.player, String(p?.chain ?? ''), way) };
  });
}
