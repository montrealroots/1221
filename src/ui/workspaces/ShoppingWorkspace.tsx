import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Tabs, MoneyText } from '@/ui/components/primitives';
import { shoppingCatalogue, wardrobeOf } from '@/engine/systems/commerce';
import { formatMoney } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';

type Tab = 'shop' | 'owned' | 'wardrobe' | 'orders';

const CATEGORIES = ['groceries', 'clothing', 'footwear', 'watch', 'jewelry', 'furniture', 'appliance', 'electronics', 'art'];

export function ShoppingWorkspace() {
  const { sim, run } = useGame();
  const [tab, setTab] = useState<Tab>('shop');
  const [category, setCategory] = useState('groceries');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const catalogue = useWorld((s) => shoppingCatalogue(s, category));
  const owned = useWorld((s) => Object.values(s.universe.assets).filter((a) => a.ownerId === s.player.id && !a.soldAt));
  const wardrobe = useWorld((s) => wardrobeOf(s, s.player.id));
  const orders = useWorld((s) => Object.values(s.universe.orders).filter((o) => o.buyerId === s.player.id).sort((a, b) => b.placedAt - a.placedAt));

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Shopping</div>
        <h1>Everything you can buy.</h1>
        <p className="muted">
          One engine for all of it. Prices move with local cost of living, sales tax follows your
          jurisdiction, and what arrives becomes something you actually own.
        </p>
      </div>

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'shop', label: 'Shop' },
        { id: 'owned', label: 'What You Own', badge: owned.length },
        { id: 'wardrobe', label: 'Wardrobe' },
        { id: 'orders', label: 'Orders', badge: orders.filter((o) => o.status === 'shipped').length },
      ]} />

      {tab === 'shop' && (
        <>
          <div className="row wrap gap-2" style={{ marginBottom: 'var(--s4)' }}>
            {CATEGORIES.map((c) => (
              <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}
                style={category === c ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)', borderColor: 'var(--accent-line)' } : undefined}>
                {c}
              </button>
            ))}
          </div>

          <Panel title={category} flush>
            {catalogue.length === 0 ? (
              <Empty title="Nothing Stocked" body="No retailer near you carries that category." />
            ) : (
              <div className="list">
                {catalogue.map(({ item, retailers }) => (
                  <div key={item.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{item.name}</div>
                      <div className="xs dim">
                        {item.brand} · quality {item.quality}
                        {item.depreciation < 0 && <span className="positive"> · appreciates</span>}
                        {item.shelfLifeDays && ` · keeps ${item.shelfLifeDays} days`}
                      </div>
                    </div>
                    <input
                      type="number" min={1} max={99} style={{ width: 62 }}
                      value={quantities[item.id] ?? 1}
                      onChange={(e) => setQuantities((q) => ({ ...q, [item.id]: Number(e.target.value) }))}
                      aria-label={`Quantity of ${item.name}`}
                    />
                    <select
                      style={{ width: 190 }} defaultValue=""
                      aria-label={`Buy ${item.name} from`}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        run('shop.purchase', {
                          retailerId: e.target.value,
                          lines: [{ catalogId: item.id, quantity: quantities[item.id] ?? 1 }],
                        });
                        e.target.value = '';
                      }}
                    >
                      <option value="">Buy from…</option>
                      {retailers.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} — {formatMoney(r.price, { cents: r.price < 10000 })}
                          {r.deliveryDays > 0 ? ` (${r.deliveryDays}d)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}

      {tab === 'owned' && (
        <Panel title="Your Things" flush>
          {owned.length === 0 ? (
            <Empty title="Nothing Yet" body="Anything you buy that is not consumed shows up here." />
          ) : (
            <div className="list">
              {owned.sort((a, b) => b.currentValue - a.currentValue).map((asset) => (
                <div key={asset.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{asset.name}</div>
                    <div className="xs dim">
                      {asset.brand} · {asset.category} · acquired {formatDate(asset.acquiredAt, sim.homeZone)}
                      {asset.acquiredVia !== 'purchase' && ` · ${asset.acquiredVia}`}
                      {asset.insurancePolicyId && ' · insured'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <MoneyText amount={asset.currentValue} />
                    <div className="xs dim">paid {formatMoney(asset.purchasePrice, { cents: false })}</div>
                  </div>
                  <button className="btn btn-sm" onClick={() => run('shop.sell_asset', { assetId: asset.id })}>Sell</button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === 'wardrobe' && (
        <div className="grid grid-2">
          {Object.entries(wardrobe).map(([slot, items]) => (
            <Panel key={slot} title={slot} flush>
              <div className="list">
                {items.map((asset) => (
                  <div key={asset.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small">{asset.name}</div>
                      <div className="xs dim">
                        formality {asset.wardrobe?.formality} · condition {Math.round(asset.condition)}
                      </div>
                    </div>
                    <span className="mono xs">{formatMoney(asset.currentValue, { cents: false })}</span>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
          {Object.keys(wardrobe).length === 0 && (
            <Empty title="Nothing To Wear" body="Buy clothing and it appears here, ready to be assembled into outfits." />
          )}
        </div>
      )}

      {tab === 'orders' && (
        <Panel title="Orders" flush>
          {orders.length === 0 ? (
            <Empty title="No Orders" body="Everything you buy is recorded here with a receipt." />
          ) : (
            <div className="list">
              {orders.map((order) => (
                <div key={order.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">
                      {order.items.map((i) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ')}
                    </div>
                    <div className="xs dim">
                      {formatDate(order.placedAt, sim.homeZone)} · {order.channel.replace(/_/g, ' ')}
                      {order.deliverAt && ` · arriving ${formatDate(order.deliverAt, sim.homeZone)}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono small">{formatMoney(order.total)}</div>
                    <div className="xs dim">incl. {formatMoney(order.tax)} tax</div>
                  </div>
                  <span className="chip">{order.status}</span>
                  {order.status === 'delivered' && (
                    <button className="btn btn-sm" onClick={() => run('shop.return', { orderId: order.id })}>Return</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </>
  );
}
