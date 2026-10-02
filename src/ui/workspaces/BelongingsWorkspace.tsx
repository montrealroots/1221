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
import { consolesHere, consolesOwned, licenceHere, licensed, planById, planPrice, plansHere, subscriptionsOf, watchRefusal } from '@/engine/systems/homelife';
import { activationCost, batteryQuote, phoneById, phonePrice, phoneQuote, phoneRefusal, phonesOf, phonesOnSale, plansFor, protectionFor } from '@/engine/systems/phones';
import { ordersOf } from '@/engine/systems/orders';
import { giveRefusal } from '@/engine/systems/gifts';
import { contactsOf } from '@/engine/systems/people';
import { facetsOf, passes, type FacetFilter } from '@/engine/systems/itemfacets';
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
  const [filter, setFilter] = useState<FacetFilter>({});
  const places = placesNow(sim, person, items);
  const toHandCount = items.filter((i) => reachable(sim, person, i.at)).length;
  const coming = ordersOf(person).filter((o) => o.status === 'placed');
  // Grouped by where each thing is, in the order a person thinks of them.
  const groups = new Map<string, Item[]>();
  // What's shown, by the filter chosen (`systems/itemfacets.ts`).
  const values = (key: 'kind' | 'color' | 'size' | 'condition' | 'state') => [...new Set(items.map((i) => facetsOf(i, sim.now)[key]).filter((v): v is string => Boolean(v)))].sort();
  for (const item of items) {
    if (!passes(item, filter, sim.now)) continue;
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
        <WatchingAndPlaying />
        {items.length > 0 && (
          <Panel title="Each Thing">
            <div className="field-row" style={{ marginBottom: '0.75rem' }}>
              <div className="field">
                <label htmlFor="things-words">Find</label>
                <input id="things-words" value={filter.words ?? ''} onChange={(e) => setFilter({ ...filter, words: e.target.value })} />
              </div>
              {(['kind', 'state', 'condition', 'color', 'size'] as const).map((key) => {
                const list = values(key);
                if (list.length < 2) return null;
                const label = { kind: 'Kind', state: 'Clean Or Not', condition: 'Condition', color: 'Color', size: 'Size' }[key];
                return (
                  <div className="field" key={key}>
                    <label htmlFor={`things-${key}`}>{label}</label>
                    <select id={`things-${key}`} value={filter[key] ?? ''} onChange={(e) => setFilter({ ...filter, [key]: e.target.value || undefined })}>
                      <option value="">Any</option>
                      {list.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
            {groups.size === 0 && <p className="small muted" style={{ margin: 0 }}>Nothing you own matches.</p>}
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
                                  <GiveTo itemId={item.id} label={item.label} />
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

/** Giving a thing to a friend here (`items.give`): theirs from then, and remembered. */
function GiveTo({ itemId, label }: { itemId: string; label: string }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const give = useFeature('items.give');
  const here = contactsOf(person).filter((c) => !giveRefusal(sim, person, itemId, c.id));
  const [to, setTo] = useState('');
  if (here.length === 0) return null;
  const chosen = here.find((c) => c.id === to) ?? here[0]!;
  return (
    <>
      <select aria-label={`Give the ${label} to`} value={chosen.id} disabled={!give.open} onChange={(e) => setTo(e.target.value)}>
        {here.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button type="button" className="btn btn-sm btn-ghost" disabled={!give.open} title={give.reason} onClick={() => { if (run('items.give', { itemId, contactId: chosen.id }).ok) toast(`The ${label}, given to ${chosen.name.split(' ')[0]}.`, 'positive'); }}>Give It</button>
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

/** What a home watches, listens to and plays: the services where you live, the TV license, consoles, and unwinding in front of any of it (`systems/homelife.ts`). */
function WatchingAndPlaying() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const money = (c: number) => formatMoney(c, saveCurrency(sim.universe), { cents: false });
  const subscribe = useFeature('home.subscribe');
  const unsubscribe = useFeature('home.unsubscribe');
  const licence = useFeature('home.tv_licence');
  const buyConsole = useFeature('home.console');
  const unwind = useFeature('life.look_after');
  const plans = plansHere(person).sort((a, b) => planPrice(sim, person, a) - planPrice(sim, person, b));
  const mine = subscriptionsOf(person);
  const [planId, setPlanId] = useState('');
  const [consoleId, setConsoleId] = useState('');
  const l = licenceHere(person);
  const consoles = consolesHere(person);
  if (plans.length === 0 && !l && consoles.length === 0) return null;
  const plan = plans.find((x) => x.id === planId) ?? plans.find((x) => !mine.some((m) => m.id === x.id));
  const pick = consoles.find((x) => x.id === consoleId) ?? consoles[0];
  const ways = [{ how: 'live', label: 'Watch Live TV' }, ...mine.map((m) => ({ how: m.id, label: `Watch Or Listen: ${planById(m.id)?.label ?? m.id}` })), ...(consolesOwned(person).length ? [{ how: 'games', label: 'Play A Game' }] : [])];
  return (
    <Panel title="Watching, Listening And Playing" subtitle="The services where you live at their own prices, the TV license where the law asks one, and consoles">
      <div className="col gap-3">
        {mine.length > 0 && (
          <div className="col gap-1">
            {mine.map((m) => { const p = planById(m.id); return (
              <div key={m.id} className="row gap-2" style={{ alignItems: 'baseline' }}>
                <span className="small">{p?.label}, {p ? money(planPrice(sim, person, p)) : ''} A Month</span>
                <button type="button" className="btn btn-sm btn-ghost" disabled={!unsubscribe.open} title={unsubscribe.reason} onClick={() => run('home.unsubscribe', { id: m.id })}>Cancel It</button>
              </div>
            ); })}
          </div>
        )}
        {plan && (
          <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="homelife-plan">Service</label>
              <select id="homelife-plan" value={plan.id} onChange={(e) => setPlanId(e.target.value)}>
                {plans.filter((x) => !mine.some((m) => m.id === x.id)).map((x) => <option key={x.id} value={x.id}>{`${x.label}, ${money(planPrice(sim, person, x))} A Month`}</option>)}
              </select>
            </div>
            <button type="button" className="btn btn-sm" disabled={!subscribe.open} title={subscribe.reason} onClick={() => { if (run('home.subscribe', { id: plan.id }).ok) toast(`${plan.label}, from today.`, 'positive'); }}>Subscribe</button>
          </div>
        )}
        {l && (
          <div className="row gap-2" style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span className="small">{licensed(person, sim.now) ? `${l.name}: yours runs to ${formatDate(person.tvLicence!.until, sim.zone)}` : `${l.name}: you have none`}</span>
            <button type="button" className="btn btn-sm btn-ghost" disabled={!licence.open} title={licence.reason} onClick={() => { if (run('home.tv_licence', {}).ok) toast('Licensed for a year.', 'positive'); }}>{`Buy The License, ${money(Math.round(l.annual * 100))}`}</button>
          </div>
        )}
        {pick && (
          <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="homelife-console">Console</label>
              <select id="homelife-console" value={pick.id} onChange={(e) => setConsoleId(e.target.value)}>
                {consoles.map((c) => <option key={c.id} value={c.id}>{`${c.model}${c.edition ? `, ${c.edition}` : ''}`}</option>)}
              </select>
            </div>
            <button type="button" className="btn btn-sm btn-ghost" disabled={!buyConsole.open} title={buyConsole.reason} onClick={() => { const a = run<{ paid: number }>('home.console', { consoleId: pick.id }); if (a.ok) toast(`Bought, for ${money(a.value!.paid)}.`, 'positive'); }}>Buy The Console</button>
          </div>
        )}
        <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
          {ways.map((w) => { const no = watchRefusal(sim, person, w.how); return <button key={w.how} type="button" className="btn btn-sm btn-ghost" disabled={!unwind.open || Boolean(no)} title={no ?? unwind.reason} onClick={() => { if (run('life.look_after', { action: 'unwind', how: w.how }).ok) toast('An hour to yourself.', 'positive'); }}>{w.label}</button>; })}
        </div>
      </div>
    </Panel>
  );
}
