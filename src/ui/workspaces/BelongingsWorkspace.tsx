/**
 * What they own and where each thing is (`systems/items.ts`, from 2026-10-01):
 * on them, at home and in which spot, in a vehicle, inside a bag, on its way
 * from an order, or with a service. A thing is moved only from where it's to
 * hand, to a place they can reach, into room enough.
 */
import { Fragment, useState } from 'react';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { useFeature } from '@/ui/guide/Guide';
import { formatDate } from '@/engine/core/time';
import { SPOT_LABEL, homeKeyOf, itemsOf, moveRefusal, reachable, usedL, whereWords, type Item, type Place, type Spot } from '@/engine/systems/items';
import { luggageRefusal, packedIn, suitcaseOf } from '@/engine/systems/luggage';
import { activationCost, batteryQuote, phoneById, phonePrice, phoneQuote, phoneRefusal, phonesOf, phonesOnSale, plansFor, protectionFor } from '@/engine/systems/phones';
import { ordersOf } from '@/engine/systems/orders';
import { modelById, vehiclesOf } from '@/engine/systems/vehicles';
import { groupLabelOf } from '@/ui/shell/destinations';
import { LookRegion, Open, at } from '@/ui/looks';

/** The places they can put a thing now: on them, a spot at home, a vehicle here, a bag to hand. */
function placesNow(sim: Parameters<typeof reachable>[0], person: Parameters<typeof reachable>[1], items: readonly Item[]): { key: string; label: string; place: Place }[] {
  const out: { key: string; label: string; place: Place }[] = [{ key: 'person', label: 'On You', place: { kind: 'person' } }];
  const home = homeKeyOf(person.home);
  if (home && reachable(sim, person, { kind: 'home', home })) {
    for (const spot of Object.keys(SPOT_LABEL) as Spot[]) out.push({ key: `home:${spot}`, label: `Home, ${SPOT_LABEL[spot]}`, place: { kind: 'home', home, spot } });
  }
  for (const v of vehiclesOf(person)) {
    const place: Place = { kind: 'vehicle', vehicleId: v.id };
    if (reachable(sim, person, place)) { const m = modelById(v.modelId); out.push({ key: `vehicle:${v.id}`, label: `The ${m?.make ?? ''} ${m?.model ?? 'Vehicle'}`.replace('  ', ' '), place }); }
  }
  for (const bag of items) if (bag.holdsL && reachable(sim, person, bag.at)) out.push({ key: `inside:${bag.id}`, label: `In The ${bag.label}`, place: { kind: 'inside', itemId: bag.id } });
  return out;
}

/** Words for a place, as a heading. */
const titled = (words: string) => words.replace(/(^|[\s,]+)(\w)/g, (_m, sep: string, c: string) => sep + c.toUpperCase());

export function BelongingsWorkspace() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const items = itemsOf(person);
  const move = useFeature('items.move');
  const [target, setTarget] = useState<Record<string, string>>({});
  const places = placesNow(sim, person, items);
  const toHandCount = items.filter((i) => reachable(sim, person, i.at)).length;
  const coming = ordersOf(person).filter((o) => o.status === 'placed');
  // Grouped by where each thing is, in the order a person thinks of them.
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const key = whereWords(person, item.at);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">{groupLabelOf('/workspace/belongings')}</div>
        <h1>Belongings</h1>
        <p className="muted">What you own, and where each thing is: only what’s to hand can be used or moved.</p>
      </div>
      <div className="col gap-5">
        <Panel title="Where Things Are">
          <div className="grid grid-3">
            <Stat label="Owned" value={String(items.length)} note="Each thing, or each set of the same" />
            <Stat label="To Hand" value={String(toHandCount)} note="Where you are now" />
            <Stat label="On Their Way" value={String(coming.length)} note={coming.length ? `The next arrives ${formatDate(Math.min(...coming.map((o) => o.arrivesAt)), sim.zone)}` : 'No orders outstanding'} />
          </div>
        </Panel>
        <Suitcase />
        <Phones />
        {items.length > 0 && (
          <Panel title="Each Thing">
            <LookRegion>
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Thing</th><th scope="col" className="num">How Many</th><th scope="col" className="num">Condition</th><th scope="col">Room</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {[...groups.entries()].map(([where, list]) => (
                    <Fragment key={where}>
                      <tr><th scope="rowgroup" colSpan={5}>{list[0]!.at.kind === 'home' ? <Open subject={at('home', list[0]!.at.home)}>{titled(where)}</Open> : list[0]!.at.kind === 'vehicle' ? <Open subject={at('vehicle', list[0]!.at.vehicleId)}>{titled(where)}</Open> : titled(where)}</th></tr>
                      {list.map((item) => {
                        const here = reachable(sim, person, item.at);
                        // Only where the engine would take it: not where it is, nor anywhere it would refuse.
                        const options = places.filter((p) => JSON.stringify(p.place) !== JSON.stringify(item.at) && !moveRefusal(sim, person, item, p.place));
                        const chosen = options.some((o) => o.key === target[item.id]) ? target[item.id] : options[0]?.key;
                        const to = options.find((o) => o.key === chosen)?.place;
                        return (
                          <tr key={item.id}>
                            <td><Open subject={item.garment ? at('garment', item.id) : at('item', item.id)}>{item.label}</Open></td>
                            <td className="num mono">{item.quantity}</td>
                            <td className="num mono"><Open subject={item.garment ? at('garment', item.id) : at('item', item.id)}>{Math.round(item.condition * 100)}%</Open></td>
                            <td className="small">{item.holdsL ? `${Math.round(usedL(person, item.id))} Of ${item.holdsL} L` : '—'}</td>
                            <td>
                              {here && options.length > 0 ? (
                                <div className="row gap-1" style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                                  <select aria-label={`Move the ${item.label} to`} value={chosen} disabled={!move.open} onChange={(e) => setTarget({ ...target, [item.id]: e.target.value })}>
                                    {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                                  </select>
                                  <button type="button" className="btn btn-sm btn-ghost" disabled={!move.open || !to} title={move.reason} onClick={() => { if (to && run('items.move', { itemId: item.id, to }).ok) toast(`The ${item.label}, moved.`, 'positive'); }}>Move It</button>
                                </div>
                              ) : <div className="xs dim" style={{ textAlign: 'right' }}>{here ? 'Stays Where It Is' : 'Not To Hand'}</div>}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            </LookRegion>
          </Panel>
        )}
        {items.length === 0 && <Panel title="Your Belongings"><p className="small muted" style={{ margin: 0 }}>You own nothing here yet beyond your home and vehicles. What you buy appears here, where it’s put.</p></Panel>}
        <Fine>A thing at home is to hand only at home; one in a car, only where the car is; one in a bag, wherever the bag is. An order’s things are yours from when you pay, and to hand when they’re delivered. A move brings your belongings with it.</Fine>
      </div>
    </>
  );
}

/** The suitcase: what's in it and how full, packed by hand on Each Thing, or a week's packed for you (`luggage.pack`). */
function Suitcase() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const bag = suitcaseOf(person);
  const pack = useFeature('luggage.pack');
  const empty = useFeature('luggage.unpack');
  if (!bag) return null;
  const used = usedL(person, bag.id);
  const inIt = packedIn(person, bag);
  const no = luggageRefusal(sim, person);
  return (
    <Panel title="Suitcase" subtitle={`${bag.label}: ${Math.round(used)} of ${bag.holdsL} liters packed, ${inIt.length} ${inIt.length === 1 ? 'thing' : 'things'}`}>
      <div className="col gap-2">
        <p className="small muted" style={{ margin: 0 }}>Move what you want into it on Each Thing, or have a week’s clothes and the bathroom’s things packed for you. Leaving home takes it as you packed it; an empty one is packed for you as you go.</p>
        <div className="row gap-1">
          <button type="button" className="btn btn-sm" disabled={!pack.open || Boolean(no)} title={no ?? pack.reason} onClick={() => { const a = run<{ packed: number }>('luggage.pack', {}); if (a.ok) toast(`${a.value!.packed} packed.`, 'positive'); }}>Pack For Me</button>
          <button type="button" className="btn btn-sm btn-ghost" disabled={!empty.open || Boolean(no) || inIt.length === 0} title={no ?? empty.reason} onClick={() => { const a = run<{ unpacked: number }>('luggage.unpack', {}); if (a.ok) toast(`${a.value!.unpacked} put away.`, 'positive'); }}>Unpack</button>
        </div>
      </div>
    </Panel>
  );
}

/** Phones: the makers' own where you live, cheapest first, bought outright or on a 0% plan, an old one traded in; and the phones you own, on your line, their batteries and cover (`systems/phones.ts`). */
function Phones() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const money = (c: number) => formatMoney(c, saveCurrency(sim.universe), { cents: false });
  const buy = useFeature('phone.buy');
  const activate = useFeature('phone.activate');
  const battery = useFeature('phone.battery');
  const protect = useFeature('phone.protect');
  const list = phonesOnSale(sim, person);
  const owned = phonesOf(person);
  const [phoneId, setPhoneId] = useState('');
  const [color, setColor] = useState('');
  const [how, setHow] = useState('');
  const [tradeIn, setTradeIn] = useState('');
  const chosen = phoneById(phoneId) ?? list[0];
  if (!chosen && owned.length === 0) return null;
  const plans = chosen ? plansFor(chosen).flatMap((x) => x.months.map((m) => ({ key: `${x.plan.name}|${m}`, name: x.plan.name, months: m }))) : [];
  const plan = plans.find((x) => x.key === how);
  const order = chosen ? { phoneId: chosen.id, color: chosen.colors.includes(color) ? color : chosen.colors[0] ?? '', ...(tradeIn ? { tradeInItemId: tradeIn } : {}), ...(plan ? { plan: plan.name, months: plan.months } : {}) } : undefined;
  const q = order ? phoneQuote(sim, person, order) : undefined;
  const no = order ? phoneRefusal(sim, person, order) : 'Choose a phone.';
  const line = activationCost(sim, person);
  const size = (gb: number) => (gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`);
  return (
    <Panel title="Phones" subtitle={chosen ? `${list.length} on their makers’ own stores where you live, unlocked, cheapest first` : undefined}>
      <div className="col gap-3">
        {owned.map((o) => {
          const p = phoneById(o.device.phoneId);
          const cost = batteryQuote(sim, person, o);
          const covers = p ? protectionFor(p) : [];
          return (
            <div key={o.id} className="col gap-1">
              <div className="small"><strong>{o.label}</strong>, {o.device.color}{o.device.activated ? `, on your ${line?.carrier ?? ''} line` : ''}{o.at.kind === 'order' ? ', on its way' : ''}</div>
              <div className="xs dim">{`Battery ${Math.round(o.device.battery * 100)}%`}{o.device.finance ? ` · ${o.device.finance.plan}: ${money(o.device.finance.monthly)} a month, ${o.device.finance.monthsLeft} left` : ''}{o.device.protection ? ` · ${o.device.protection.plan}, ${money(o.device.protection.monthly)} a month` : ''}</div>
              <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
                {!o.device.activated && <button type="button" className="btn btn-sm btn-ghost" disabled={!activate.open || o.at.kind === 'order'} title={activate.reason} onClick={() => { const a = run<{ paid: number }>('phone.activate', { itemId: o.id }); if (a.ok) toast(`On your line, for ${money(a.value!.paid)}.`, 'positive'); }}>{line ? `Put It On Your Line, ${money(line.cost)}` : 'Put It On Your Line'}</button>}
                {o.device.battery < 0.999 && cost !== undefined && <button type="button" className="btn btn-sm btn-ghost" disabled={!battery.open} title={battery.reason} onClick={() => { if (run('phone.battery', { itemId: o.id }).ok) toast('A new battery.', 'positive'); }}>{`Replace The Battery, ${money(cost)}`}</button>}
                {covers.filter((c) => o.device.protection?.plan !== c.plan).map((c) => <button key={c.plan} type="button" className="btn btn-sm btn-ghost" disabled={!protect.open} title={protect.reason} onClick={() => { if (run('phone.protect', { itemId: o.id, plan: c.plan }).ok) toast(`${c.plan}, from now.`, 'positive'); }}>{`${c.plan}, ${formatMoney(Math.round(c.monthly * 100), c.currency, { cents: false })} A Month`}</button>)}
                {o.device.protection && <button type="button" className="btn btn-sm btn-ghost" disabled={!protect.open} onClick={() => run('phone.protect', { itemId: o.id })}>End The Cover</button>}
              </div>
            </div>
          );
        })}
        {chosen && order && (
          <div className="field-row field-row-tight">
            <div className="field">
              <label htmlFor="phone-pick">Phone</label>
              <select id="phone-pick" value={chosen.id} onChange={(e) => { setPhoneId(e.target.value); setHow(''); }}>
                {list.map((p) => <option key={p.id} value={p.id}>{`${p.maker} ${p.model}, ${size(p.storageGB)}, ${money(phonePrice(sim, person, p))}${p.press ? ', A Press Price' : ''}`}</option>)}
              </select>
            </div>
            {chosen.colors.length > 1 && (
              <div className="field">
                <label htmlFor="phone-color">Color</label>
                <select id="phone-color" value={order.color} onChange={(e) => setColor(e.target.value)}>{chosen.colors.map((c) => <option key={c} value={c}>{c}</option>)}</select>
              </div>
            )}
            <div className="field">
              <label htmlFor="phone-how">Paying</label>
              <select id="phone-how" value={how} onChange={(e) => setHow(e.target.value)}>
                <option value="">Outright</option>
                {plans.map((x) => <option key={x.key} value={x.key}>{`${x.name}, ${x.months} Months At 0%`}</option>)}
              </select>
            </div>
            {owned.length > 0 && (
              <div className="field">
                <label htmlFor="phone-trade">Trade In</label>
                <select id="phone-trade" value={tradeIn} onChange={(e) => setTradeIn(e.target.value)}>
                  <option value="">Nothing</option>
                  {owned.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
        {chosen && order && q && (
          <div className="row gap-2" style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-sm btn-primary" disabled={!buy.open || Boolean(no)} title={no ?? buy.reason} onClick={() => { if (run('phone.buy', order).ok) toast(`${chosen.maker} ${chosen.model}, on its way.`, 'positive'); }}>{q.monthly ? `Buy It, ${money(q.monthly)} A Month` : `Buy It, ${money(q.total)}`}</button>
            <span className="xs dim">{q.tradeIn > 0 ? `${money(q.tradeIn)} off for the trade-in, the maker's published most. ` : ''}{no ?? ''}</span>
          </div>
        )}
      </div>
    </Panel>
  );
}
