/**
 * SLATE — a receipt (the master plan’s §22d, from 2026-10-03): a purchase of
 * clothes and the rest of the order it came on, line by line, as the
 * retailer’s own record of it.
 *
 * Each line is the product, its size and color, how many and what it cost
 * with the tax; then what paid, and until when it can be taken back by the
 * retailer’s own return window, counted from the day it was had: bought in
 * a store, or delivered (`receivedAt`), as a return is. Until
 * 2026-10-03 the purchase was a row on Clothes and nothing opened into it.
 *
 * An order’s receipt says what the order paid, the delivery or collection
 * with the goods, and the order itself: where it went, how far it has come,
 * the day it arrived. Until 2026-10-05 it said the goods alone, so an order
 * of $24.90 with its delivery read $24.90 against $32.89 out of the bank.
 */

import { formatMoney, saveCurrency } from '@/engine/core/money';
import { MS_DAY, dateKey, formatDate } from '@/engine/core/time';
import { productById, purchaseItems, receivedAt, retailerById, type ClothesPurchase } from '@/engine/systems/clothing';
import { orderStage, ordersOf } from '@/engine/systems/orders';
import { Stat } from '@/ui/components/primitives';
import { defineLook, lookExists, type Way } from './registry';
import { at } from './subject';

/** The purchases a receipt holds: the order’s, or the one bought on its own. */
function linesOf(bought: readonly ClothesPurchase[], id: string): ClothesPurchase[] {
  const one = bought.find((b) => b.id === id);
  if (!one) return [];
  return one.orderId ? bought.filter((b) => b.orderId === one.orderId) : [one];
}

defineLook<ClothesPurchase[]>('receipt', {
  gone: 'There’s no receipt by that name among what you’ve bought.',
  resolve: (sim, id) => {
    const lines = linesOf(sim.player.clothesBought ?? [], id);
    return lines.length ? lines : undefined;
  },
  seeds: (sim) => (sim.player.clothesBought ?? []).slice(0, 2).map((b) => b.id),
  look: (lines, { sim }) => {
    const cur = saveCurrency(sim.universe);
    const money = (c: number) => formatMoney(c, cur);
    const first = lines[0]!;
    const r = retailerById(first.retailerId);
    const goods = lines.reduce((a, b) => a + b.goods, 0);
    // The order paid the goods and its delivery or collection together.
    const order = first.orderId ? ordersOf(sim.player).find((o) => o.id === first.orderId) : undefined;
    const total = order ? Math.max(order.paid, goods) : goods;
    const carriage = total - goods;
    const back = lines.filter((b) => b.returnedAt !== undefined || b.canceledAt !== undefined);
    const had = receivedAt(sim.player, first);
    const until = r?.returnDays != null && had !== undefined ? had + r.returnDays * MS_DAY : undefined;
    const paid = [...new Set(lines.flatMap((b) => (b.paidFrom ?? []).map((x) => sim.universe.accounts[x.accountId]?.name ?? 'An Account')))];
    const how = first.how === 'store' ? 'in store' : first.how === 'collect' ? 'online, to collect in store' : 'online, delivered';
    const ways: Way[] = [];
    for (const b of lines) {
      const item = purchaseItems(sim.player, b.id).find((i) => i.garment);
      if (item && lookExists(sim, at('garment', item.id))) ways.push({ to: at('garment', item.id), label: productById(b.productId)?.name ?? 'Clothes', detail: 'What it is now, and where' });
    }
    ways.push({ to: at('day', dateKey(first.at, sim.homeZone)), label: 'The Day It Was Bought', detail: `${formatDate(first.at, sim.homeZone)}, and what else that day held` });
    return {
      name: `Bought From ${r?.name ?? 'A Retailer'}`,
      kind: 'A Receipt',
      summary: `On ${formatDate(first.at, sim.zone)} you paid ${money(total)} for ${lines.length === 1 ? 'one line' : `${lines.length} lines`}, bought ${how}${back.length ? `, and ${back.length === lines.length ? 'all of it' : `${back.length} of them`} came back` : ''}.`,
      body: (
        <>
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Line</th><th scope="col">Size</th><th scope="col">Color</th><th scope="col" className="num">Count</th><th scope="col" className="num">Tax In</th></tr></thead>
              <tbody>
                {lines.map((b) => (
                  <tr key={b.id}>
                    <td>{productById(b.productId)?.name ?? 'Clothes'}{b.returnedAt !== undefined ? ', returned' : b.canceledAt !== undefined ? ', canceled' : ''}</td>
                    <td className="small">{b.size ?? '—'}</td>
                    <td className="small">{b.color ?? '—'}</td>
                    <td className="num">{b.count}</td>
                    <td className="num mono">{money(b.goods)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-3">
            <Stat label="Total" value={<span className="mono">{money(total)}</span>} note={order ? `The goods, tax in, ${money(goods)}; ${first.how === 'collect' ? 'collecting' : 'delivery'}, ${carriage > 0 ? money(carriage) : 'free'}` : 'The goods, tax in'} />
            <Stat label="Paid With" value={paid.join(', ') || '—'} note="Where a return is refunded" />
            <Stat label="Returns Until" value={until !== undefined ? formatDate(until, sim.zone) : r?.returnDays != null ? 'Once It Arrives' : 'Not Known'} note={r?.returnDays != null ? `${r.name}’s ${r.returnDays} days from when you had it` : 'Its window wasn’t read'} />
          </div>
          {order && (
            <div className="grid grid-3">
              <Stat label="Order" value={orderStage(sim.player, order, sim.now)} note={order.stolen ? 'Taken from the door when it was delivered' : `Order ${order.id}`} />
              <Stat label="Sent To" value={order.to.kind === 'service' ? `${r?.name ?? 'The Store'}, To Collect` : order.to.kind === 'home' ? 'Your Home' : 'You'} note={first.how === 'collect' ? 'Collected in store' : 'Delivered'} />
              <Stat label={order.deliveredAt !== undefined ? 'Arrived' : 'Due'} value={formatDate(order.deliveredAt ?? order.arrivesAt, sim.zone)} note={order.deliveredAt !== undefined ? 'The day it came' : 'The day it’s due'} />
            </div>
          )}
        </>
      ),
      ways,
      provenance: r?.terms ? `Its returns as ${r.name}’s own terms say: ${r.terms}.` : 'Its returns weren’t read.',
    };
  },
});
