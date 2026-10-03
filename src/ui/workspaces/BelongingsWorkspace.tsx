/**
 * What they own and where each thing is (`systems/items.ts`, from 2026-10-01):
 * on them, at home and in which spot, in a vehicle, inside a bag, on its way
 * from an order, or with a service. A thing is moved only from where it's to
 * hand, to a place they can reach, into room enough.
 */
import { Fragment, useState } from 'react';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { assembleRefusal } from '@/engine/systems/furnishings';
import { bulkyFee, bulkyRefusal } from '@/engine/systems/bulky';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated, useFeature } from '@/ui/guide/Guide';
import { formatDate } from '@/engine/core/time';
import { SPOT_LABEL, homeKeyOf, itemsOf, moveRefusal, reachable, usedL, whereWords, type Item, type Place, type Spot } from '@/engine/systems/items';
import { bagsOf, buyLuggageRefusal, luggageCatalog, luggageRefusal, packedIn, suitcaseOf } from '@/engine/systems/luggage';
import { CITIES } from '@/engine/content/geography';
import { ENGRAVERS, JEWELERS, METAL_LABEL, PIECE_LABEL, commissionMoney, commissionRefusal, commissionsOf, jewelersFor, type Metal, type PieceKind } from '@/engine/systems/commissions';
import { cheapestPlanFor, finished, placeIn, programmeRefusal, programmesHere } from '@/engine/systems/programmes';
import { consolesHere, consolesOwned, gamesHere, gamesOwned, licenceHere, licensed, planById, planPrice, plansHere, subscriptionsOf, watchRefusal } from '@/engine/systems/homelife';
import { activationCost, batteryQuote, claimQuote, phoneById, phonePrice, phoneQuote, phoneRefusal, phonesOf, phonesOnSale, plansFor, protectionFor } from '@/engine/systems/phones';
import { orderStage, ordersOf } from '@/engine/systems/orders';
import { giveRefusal } from '@/engine/systems/gifts';
import { cardRefusal, hasSomethingToRead, libraryIn, readingCatalog } from '@/engine/systems/reading';
import { batteryOptions, batteryRefusal, batteryYears, makerServiceOf, serviceDue, servicePrice, stopped } from '@/engine/systems/watches';
import { owedOn, pawnTermsIn, pawnsOf, pledgeQuote, pledgeRefusal } from '@/engine/systems/pawn';
import { lockedAway, safeCatalog, safesAtHome, scheduleRefusal, scheduledPremium, valuablesOf } from '@/engine/systems/valuables';
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

/** Furniture at home collected by the council, at its own terms (`items.discard`). */
function Collected({ item }: { item: Item }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  if (!item.bulky || item.at.kind !== 'home') return null;
  if (item.collectAt !== undefined) return <span className="xs dim">{`Collected ${formatDate(item.collectAt, sim.zone)}`}</span>;
  const no = bulkyRefusal(person, [item.id]);
  const fee = no ? 0 : bulkyFee(sim, person, 1);
  return <Gated feature="items.discard" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no ?? (fee ? `The council's collection, ${formatMoney(fee, saveCurrency(sim.universe))}` : 'The council collects it free')} onClick={() => { const a = run<{ collectAt: number }>('items.discard', { itemIds: [item.id] }); if (a.ok) toast(`Booked for collection ${formatDate(a.value!.collectAt, sim.zone)}.`, 'positive'); }}>Have It Collected</Gated>;
}

export function BelongingsWorkspace() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const items = itemsOf(person);
  const move = useFeature('items.move');
  const assemble = useFeature('items.assemble');
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
          {coming.length > 0 && (
            <div className="col gap-1 small" style={{ marginTop: '0.5rem' }}>
              {/* Each order's stage as the carrier's tracking says it (`orderStage`). */}
              {coming.map((o) => <div key={o.id}>{`${o.from}: ${orderStage(person, o, sim.now)}, due ${formatDate(o.arrivesAt, sim.zone)}`}</div>)}
            </div>
          )}
        </Panel>
        <Suitcase />
        <Luggage />
        <Phones />
        <WatchingAndPlaying />
        <Reading />
        <Valuables />
        <Commissions />
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
                            <td><Open subject={item.garment ? at('garment', item.id) : at('item', item.id)}>{item.label}</Open>{item.flatPacked ? <span className="xs dim"> · Flat-Packed</span> : null}</td>
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
                                  <Collected item={item} />
                                  {item.flatPacked && <button type="button" className="btn btn-sm btn-ghost" disabled={!assemble.open || Boolean(assembleRefusal(person, item.id))} title={assembleRefusal(person, item.id) ?? assemble.reason ?? 'An hour'} onClick={() => { if (run('items.assemble', { itemId: item.id }).ok) toast(`The ${item.label}, put together.`, 'positive'); }}>Put It Together</button>}
                                </div>
                              ) : (item.flatPacked || item.bulky) && here ? <div className="row gap-1" style={{ justifyContent: 'flex-end' }}><Collected item={item} />{item.flatPacked && <button type="button" className="btn btn-sm btn-ghost" disabled={!assemble.open || Boolean(assembleRefusal(person, item.id))} title={assembleRefusal(person, item.id) ?? assemble.reason ?? 'An hour'} onClick={() => { if (run('items.assemble', { itemId: item.id }).ok) toast(`The ${item.label}, put together.`, 'positive'); }}>Put It Together</button>}</div> : <div className="xs dim" style={{ textAlign: 'right' }}>{here ? 'Stays Where It Is' : 'Not To Hand'}</div>}
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

/** Something to read: the town's library card, a book or an e-reader (`systems/reading.ts`). */
function Reading() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const card = useFeature('reading.library_card');
  const buy = useFeature('reading.buy');
  const cur = saveCurrency(sim.universe);
  const lib = libraryIn(person.home?.cityId ?? '');
  const shop = readingCatalog(sim, person);
  const noCard = cardRefusal(person);
  if (!lib && shop.length === 0) return null;
  return (
    <Panel title="Reading" subtitle={hasSomethingToRead(person) ? 'Something To Read At Home' : 'Nothing To Read At Home Yet'}>
      <div className="col gap-2">
        {lib && <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="small">{lib.name}{person.libraryCard === person.home?.cityId ? ': your card' : ', free to a resident'}</span>
          {person.libraryCard !== person.home?.cityId && <button type="button" className="btn btn-sm btn-ghost" disabled={!card.open || Boolean(noCard)} title={noCard ?? card.reason} onClick={() => { if (run('reading.library_card', {}).ok) toast('A library card of your own.', 'positive'); }}>Get A Library Card</button>}
        </div>}
        {shop.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Read</th><th scope="col">Sold By</th><th scope="col" className="num">Price</th><th scope="col"><span className="sr-only">Buy</span></th></tr></thead>
              <tbody>
                {shop.map(({ buy: b, price }) => (
                  <tr key={b.id}>
                    <td>{b.label}</td>
                    <td className="small">{b.seller}</td>
                    <td className="num mono">{formatMoney(price, cur)}</td>
                    <td><button type="button" className="btn btn-sm btn-ghost" disabled={!buy.open} title={buy.reason} onClick={() => { if (run('reading.buy', { id: b.id }).ok) toast(`${b.label}, bought.`, 'positive'); }}>Buy It To Read</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="xs dim">A reader enjoys an hour unwinding at home only with something to read there: the town’s library card, a book or an e-reader, as a film lover needs a TV.</div>
      </div>
    </Panel>
  );
}

/** Jewelry and watches: a safe to lock them in, and scheduling on the home's insurance (`systems/valuables.ts`). */
function Valuables() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const buy = useFeature('valuables.buy_safe');
  const lock = useFeature('valuables.lock_up');
  const out = useFeature('valuables.take_out');
  const sched = useFeature('valuables.schedule');
  const pledge = useFeature('pawn.pledge');
  const redeem = useFeature('pawn.redeem');
  const battery = useFeature('watch.battery');
  const service = useFeature('watch.service');
  const broker = pawnTermsIn(person.currentLocationId);
  const pledges = pawnsOf(person);
  const cur = saveCurrency(sim.universe);
  const pieces = valuablesOf(person);
  const shop = safeCatalog(sim, person);
  const safes = safesAtHome(person);
  if (pieces.length === 0 && safes.length === 0 && pledges.length === 0) return null;
  return (
    <Panel title="Jewelry And Watches" subtitle={safes.length ? safes.map((x) => x.label).join(', ') : 'No Safe At Home'}>
      <div className="col gap-2">
        {pieces.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Piece</th><th scope="col">Where</th><th scope="col" className="num">Paid</th><th scope="col"><span className="sr-only">Safe</span></th><th scope="col"><span className="sr-only">Insurance</span></th><th scope="col"><span className="sr-only">Battery</span></th>{broker && <th scope="col"><span className="sr-only">Pawn</span></th>}</tr></thead>
              <tbody>
                {pieces.filter((i) => i.at.kind !== 'service').map((i) => {
                  const inSafe = lockedAway(person, i);
                  const noSched = i.scheduled ? undefined : scheduleRefusal(sim, person, i);
                  return (
                    <tr key={i.id}>
                      <td>{i.label}{stopped(i, sim.now) && <span className="xs dim"> · Stopped</span>}</td>
                      <td className="small">{whereWords(person, i.at)}</td>
                      <td className="num mono">{i.paid ? formatMoney(i.paid, cur) : '—'}</td>
                      <td>{inSafe
                        ? <button type="button" className="btn btn-sm btn-ghost" disabled={!out.open} title={out.reason} onClick={() => { if (run('valuables.take_out', { itemId: i.id }).ok) toast(`${i.label}, out of the safe.`, 'positive'); }}>Out Of The Safe</button>
                        : <button type="button" className="btn btn-sm btn-ghost" disabled={!lock.open || safes.length === 0} title={safes.length === 0 ? 'There’s no safe where you live.' : lock.reason} onClick={() => { if (run('valuables.lock_up', { itemId: i.id }).ok) toast(`${i.label}, locked away.`, 'positive'); }}>Into The Safe</button>}</td>
                      <td>{i.scheduled
                        ? <button type="button" className="btn btn-sm btn-ghost" disabled={!sched.open} title={`${formatMoney(scheduledPremium(i), cur)} a month`} onClick={() => { if (run('valuables.schedule', { itemId: i.id, on: false }).ok) toast(`${i.label}, no longer scheduled.`, 'positive'); }}>Unschedule It</button>
                        : <button type="button" className="btn btn-sm btn-ghost" disabled={!sched.open || Boolean(noSched)} title={noSched ?? `${formatMoney(scheduledPremium(i), cur)} a month, paid in full without a deductible`} onClick={() => { if (run('valuables.schedule', { itemId: i.id, on: true }).ok) toast(`${i.label}, scheduled.`, 'positive'); }}>Schedule It</button>}</td>
                      <td>{makerServiceOf(i) && (() => { const price = servicePrice(sim, person, i); const due = serviceDue(i)!; return <button type="button" className="btn btn-sm btn-ghost" disabled={!service.open || price === undefined} title={price === undefined ? 'Its maker prices no service where you are.' : service.reason ?? `Due ${formatDate(due, sim.zone)}; away three weeks`} onClick={() => { if (run('watch.service', { itemId: i.id }).ok) toast(`${i.label}, off to be serviced.`, 'positive'); }}>{price === undefined ? 'Have It Serviced' : `Have It Serviced, ${formatMoney(price, cur, { cents: false })}`}</button>; })()}{batteryYears(i) !== undefined && (() => { const opt = batteryOptions(sim, person, i)[0]; const no = opt ? batteryRefusal(sim, person, i.id, opt.service.id) : 'No battery change is published where you are.'; return <button type="button" className="btn btn-sm btn-ghost" disabled={!battery.open || Boolean(no)} title={no ?? `${opt!.service.name}, back in a week`} onClick={() => { if (run('watch.battery', { itemId: i.id, serviceId: opt!.service.id }).ok) toast(`${i.label}, away for its battery.`, 'positive'); }}>{opt ? `Change The Battery, ${formatMoney(opt.price, cur)}` : 'Change The Battery'}</button>; })()}</td>
                      {broker && (() => { const no = pledgeRefusal(sim, person, [i.id]); return <td><button type="button" className="btn btn-sm btn-ghost" disabled={!pledge.open || Boolean(no)} title={no ?? `A loan of ${formatMoney(pledgeQuote(sim, person, [i.id]).loan, cur)} from ${broker.lender}`} onClick={() => { if (run('pawn.pledge', { itemIds: [i.id] }).ok) toast(`${i.label}, pledged.`, 'positive'); }}>Pawn It</button></td>; })()}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {shop.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Safe</th><th scope="col">Sold By</th><th scope="col" className="num">Holds</th><th scope="col" className="num">Price</th><th scope="col"><span className="sr-only">Buy</span></th></tr></thead>
              <tbody>
                {shop.map(({ safe, price }) => (
                  <tr key={safe.id}>
                    <td>{safe.label}</td>
                    <td className="small">{safe.seller}{safe.confirmed ? '' : ' (read secondhand)'}</td>
                    <td className="num mono">{safe.holdsL} L</td>
                    <td className="num mono">{formatMoney(price, cur)}</td>
                    <td><button type="button" className="btn btn-sm btn-ghost" disabled={!buy.open} title={buy.reason} onClick={() => { if (run('valuables.buy_safe', { id: safe.id }).ok) toast(`${safe.label}, bolted down at home.`, 'positive'); }}>Buy The Safe</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pledges.length > 0 && (
          <div className="col gap-1 small">{pledges.map((p) => (
            <div key={p.id} className="row-between">
              <span>{p.itemIds.map((id) => itemsOf(person).find((x) => x.id === id)?.label ?? 'A Piece').join(', ')}<span className="xs dim">{` · ${pawnTermsIn(p.cityId)?.lender ?? 'A Pawnbroker'}, until ${formatDate(p.until, sim.zone)}`}</span></span>
              <button type="button" className="btn btn-sm btn-ghost" disabled={!redeem.open || person.currentLocationId !== p.cityId} title={person.currentLocationId !== p.cityId ? 'A pledge is redeemed where it was made.' : redeem.reason} onClick={() => { if (run('pawn.redeem', { pawnId: p.id }).ok) toast('Redeemed.', 'positive'); }}>{`Redeem It, ${formatMoney(owedOn(sim, p), cur)}`}</button>
            </div>
          ))}</div>
        )}
        <div className="xs dim">A burglary takes the jewelry and watches at home that aren’t locked in a safe or worn that day. The policy on what’s inside pays for them only up to its limit on jewelry; a piece scheduled on it is paid in full, without a deductible.</div>
      </div>
    </Panel>
  );
}

/** Bags: the ones owned, which goes away, and the ones on sale where you live, cheapest first (`systems/luggage.ts`). */
/** A piece made to order by a named jeweler where you live, and words engraved on one (`systems/commissions.ts`). */
function Commissions() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const order = useFeature('jewelry.commission');
  const engrave = useFeature('jewelry.engrave');
  const jewelers = jewelersFor(person);
  const [jewelerId, setJewelerId] = useState('');
  const [kind, setKind] = useState<PieceKind>('ring');
  const [metal, setMetal] = useState<Metal>('gold');
  const [price, setPrice] = useState('');
  const [pieceId, setPieceId] = useState('');
  const [words, setWords] = useState('');
  const pieces = valuablesOf(person).filter((i) => i.at.kind !== 'service');
  const engraver = ENGRAVERS.find((e) => e.country === CITIES.get(person.currentLocationId)?.countryId);
  const pending = commissionsOf(person);
  if (jewelers.length === 0 && !engraver && pending.length === 0) return null;
  const j = jewelers.find((x) => x.id === jewelerId) ?? jewelers[0];
  const least = j?.from(kind, metal);
  const units = Number(price) || least || 0;
  const no = j ? commissionRefusal(person, j.id, kind, metal, units) : undefined;
  const piece = pieces.find((i) => i.id === pieceId) ?? pieces[0];
  const cur = saveCurrency(sim.universe);
  return (
    <Panel title="Made To Order" subtitle="A named jeweler’s commission at the price you set, from its own least, and words engraved at a jeweler’s posted price">
      <div className="col gap-2">
        {pending.map((c) => <div key={c.id} className="small">{`${METAL_LABEL[c.metal]} ${PIECE_LABEL[c.kind]}, ${JEWELERS.find((x) => x.id === c.jewelerId)?.name}: ready ${formatDate(c.readyAt, sim.zone)}, ${formatMoney(commissionMoney(sim, c), cur, { cents: false })}`}</div>)}
        {j && (
          <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="commission-jeweler">Jeweler</label>
              <select id="commission-jeweler" value={j.id} onChange={(e) => setJewelerId(e.target.value)}>{jewelers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="commission-kind">Piece</label>
              <select id="commission-kind" value={kind} onChange={(e) => setKind(e.target.value as PieceKind)}>{(Object.keys(PIECE_LABEL) as PieceKind[]).map((k) => <option key={k} value={k}>{PIECE_LABEL[k]}</option>)}</select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="commission-metal">Metal</label>
              <select id="commission-metal" value={metal} onChange={(e) => setMetal(e.target.value as Metal)}>{(Object.keys(METAL_LABEL) as Metal[]).map((m) => <option key={m} value={m}>{METAL_LABEL[m]}</option>)}</select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="commission-price">{`Your Price, ${j.currency}`}</label>
              <input id="commission-price" inputMode="numeric" value={price} placeholder={least !== undefined ? String(least) : ''} onChange={(e) => setPrice(e.target.value)} style={{ width: '8rem' }} />
            </div>
            <button type="button" className="btn btn-sm btn-ghost" disabled={!order.open || Boolean(no)} title={no ?? order.reason} onClick={() => { const r = run<{ readyAt: number }>('jewelry.commission', { jewelerId: j.id, kind, metal, price: units }); if (r.ok) toast(`Commissioned from ${j.name}, ready ${formatDate(r.value!.readyAt, sim.zone)}.`, 'positive'); }}>Commission It</button>
          </div>
        )}
        {engraver && piece && (
          <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="engrave-piece">Piece To Engrave</label>
              <select id="engrave-piece" value={piece.id} onChange={(e) => setPieceId(e.target.value)}>{pieces.map((i) => <option key={i.id} value={i.id}>{i.label}{i.engraved ? ` (“${i.engraved}”)` : ''}</option>)}</select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="engrave-words">Words</label>
              <input id="engrave-words" value={words} onChange={(e) => setWords(e.target.value)} style={{ width: '12rem' }} />
            </div>
            <button type="button" className="btn btn-sm btn-ghost" disabled={!engrave.open || !words.trim()} title={engrave.reason ?? `${engraver.name}’s posted price`} onClick={() => { if (run('jewelry.engrave', { itemId: piece.id, words }).ok) { toast('Engraved.', 'positive'); setWords(''); } }}>Engrave It</button>
          </div>
        )}
      </div>
    </Panel>
  );
}

function Luggage() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const buy = useFeature('luggage.buy');
  const choose = useFeature('luggage.choose');
  const cur = saveCurrency(sim.universe);
  const owned = bagsOf(person);
  const going = suitcaseOf(person);
  const shop = luggageCatalog(sim, person);
  const [type, setType] = useState('');
  const types = [...new Set(shop.map((x) => x.piece.type))];
  const shown = shop.filter((x) => !type || x.piece.type === type);
  if (shop.length === 0 && owned.length < 2) return null;
  const TYPE: Record<string, string> = { 'carry-on': 'Carry-On', medium: 'Medium', large: 'Large', duffel: 'Duffel', backpack: 'Backpack' };
  return (
    <Panel title="Bags" subtitle={going ? `${going.label} Goes Away With You` : 'None Yet'}>
      <div className="col gap-2">
        {owned.length > 1 && (
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            {owned.map((b) => <button key={b.id} type="button" className="btn btn-sm btn-ghost" disabled={!choose.open || b.id === going?.id} title={choose.reason} onClick={() => { if (run('luggage.choose', { itemId: b.id }).ok) toast(`${b.label} goes away with you now.`, 'positive'); }}>{b.id === going?.id ? `${b.label}, Going` : `Take The ${b.label}`}</button>)}
          </div>
        )}
        {shop.length > 0 && (
          <>
            <div className="field" style={{ margin: 0, maxWidth: '14rem' }}>
              <label htmlFor="bag-type">Kind</label>
              <select id="bag-type" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Any</option>
                {types.map((t) => <option key={t} value={t}>{TYPE[t] ?? t}</option>)}
              </select>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Bag</th><th scope="col" className="num">Holds</th><th scope="col" className="num">Price</th><th scope="col"><span className="sr-only">Buy</span></th></tr></thead>
                <tbody>
                  {shown.slice(0, 12).map(({ piece, price }) => {
                    const no = buyLuggageRefusal(person, piece.id);
                    return (
                      <tr key={piece.id}>
                        <td>{piece.brand} {piece.model}<div className="xs dim">{TYPE[piece.type] ?? piece.type}{piece.retailer ? `, ${piece.retailer}` : ''}</div></td>
                        <td className="num">{piece.liters} L</td>
                        <td className="num mono">{formatMoney(price, cur, { cents: false })}</td>
                        <td><button type="button" className="btn btn-sm btn-ghost" disabled={!buy.open || Boolean(no)} title={no ?? buy.reason} onClick={() => { if (run('luggage.buy', { pieceId: piece.id }).ok) toast(`${piece.brand} ${piece.model}, bought.`, 'positive'); }}>Buy The Bag</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Panel>
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
  // Away at a stay, it's unpacked into the room (from 2026-10-03).
  const away = Boolean(person.stay) && person.currentLocationId !== person.home?.cityId;
  const unpackNo = away ? undefined : no;
  const inRoom = itemsOf(person).filter((i) => i.at.kind === 'stay').length;
  return (
    <Panel title="Suitcase" subtitle={`${bag.label}: ${Math.round(used)} of ${bag.holdsL} liters packed, ${inIt.length} ${inIt.length === 1 ? 'thing' : 'things'}`}>
      <div className="col gap-2">
        <p className="small muted" style={{ margin: 0 }}>Move what you want into it on Each Thing, or have a week’s clothes and the bathroom’s things packed for you. Leaving home takes it as you packed it; an empty one is packed for you as you go. Away, it can be unpacked into the room; leaving packs it back while it holds, and what doesn’t fit stays behind.{inRoom > 0 ? ` ${inRoom} unpacked in the room.` : ''}</p>
        <div className="row gap-1">
          <button type="button" className="btn btn-sm" disabled={!pack.open || Boolean(no)} title={no ?? pack.reason} onClick={() => { const a = run<{ packed: number }>('luggage.pack', {}); if (a.ok) toast(`${a.value!.packed} packed.`, 'positive'); }}>Pack For Me</button>
          <button type="button" className="btn btn-sm btn-ghost" disabled={!empty.open || Boolean(unpackNo) || inIt.length === 0} title={unpackNo ?? empty.reason} onClick={() => { const a = run<{ unpacked: number }>('luggage.unpack', {}); if (a.ok) toast(`${a.value!.unpacked} put away.`, 'positive'); }}>{away ? 'Unpack Into The Room' : 'Unpack'}</button>
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
  const claim = useFeature('phone.claim');
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
          const fix = o.device.broken || o.device.stolen !== undefined ? claimQuote(sim, person, o) : undefined;
          return (
            <div key={o.id} className="col gap-1">
              <div className="small"><strong>{o.label}</strong>, {o.device.color}{o.device.activated ? `, on your ${line?.carrier ?? ''} line` : ''}{o.at.kind === 'order' ? ', on its way' : ''}{o.device.stolen !== undefined ? ', stolen' : o.device.broken === 'screen' ? ', its screen cracked' : o.device.broken ? ', damaged' : ''}</div>
              {typeof fix === 'string' && <div className="xs dim">{fix}</div>}
              <div className="xs dim">{`Battery ${Math.round(o.device.battery * 100)}%`}{o.device.finance ? ` · ${o.device.finance.plan}: ${money(o.device.finance.monthly)} a month, ${o.device.finance.monthsLeft} left` : ''}{o.device.protection ? ` · ${o.device.protection.plan}, ${money(o.device.protection.monthly)} a month` : ''}</div>
              <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
                {typeof fix === 'number' && <button type="button" className="btn btn-sm btn-ghost" disabled={!claim.open} title={claim.reason} onClick={() => { if (run('phone.claim', { itemId: o.id }).ok) toast(o.device.stolen !== undefined ? 'Replaced.' : 'Repaired.', 'positive'); }}>{`${o.device.stolen !== undefined ? 'Claim A Replacement' : 'Have It Repaired'}, ${money(fix)}`}</button>}
                {!o.device.activated && o.device.stolen === undefined && <button type="button" className="btn btn-sm btn-ghost" disabled={!activate.open || o.at.kind === 'order'} title={activate.reason} onClick={() => { const a = run<{ paid: number }>('phone.activate', { itemId: o.id }); if (a.ok) toast(`On your line, for ${money(a.value!.paid)}.`, 'positive'); }}>{line ? `Put It On Your Line, ${money(line.cost)}` : 'Put It On Your Line'}</button>}
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
  const buyGame = useFeature('home.buy_game');
  const unwind = useFeature('life.look_after');
  const plans = plansHere(person).sort((a, b) => planPrice(sim, person, a) - planPrice(sim, person, b));
  const mine = subscriptionsOf(person);
  const [planId, setPlanId] = useState('');
  const [consoleId, setConsoleId] = useState('');
  const [progId, setProgId] = useState('');
  const watchTv = useFeature('tv.watch');
  // Least watched that week first, the market's most watched last.
  const shows = [...programmesHere(person)].reverse();
  const show = shows.find((x) => x.id === progId) ?? shows[shows.length - 1];
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
        {consolesOwned(person).length > 0 && gamesHere(person).length > 0 && (
          <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
            {gamesHere(person).filter((g) => !gamesOwned(person).some((i) => i.kind === `game:${g.id}`)).map((g) => <button key={g.id} type="button" className="btn btn-sm btn-ghost" disabled={!buyGame.open} title={buyGame.reason ?? `${g.maker}’s own price`} onClick={() => { const r = run<{ paid: number }>('home.buy_game', { gameId: g.id }); if (r.ok) toast(`${g.title}, bought for ${money(r.value!.paid)}.`, 'positive'); }}>{`Buy ${g.title}`}</button>)}
          </div>
        )}
        <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
          {ways.map((w) => { const no = watchRefusal(sim, person, w.how); return <button key={w.how} type="button" className="btn btn-sm btn-ghost" disabled={!unwind.open || Boolean(no)} title={no ?? unwind.reason} onClick={() => { if (run('life.look_after', { action: 'unwind', how: w.how }).ok) toast('An hour to yourself.', 'positive'); }}>{w.label}</button>; })}
        </div>
        {show && (() => {
          const at = placeIn(person, show);
          const no = programmeRefusal(sim, person, show);
          const watch = (to: 'episode' | 'hour') => { const r = run<{ watched: number; finished: boolean }>('tv.watch', { programmeId: show.id, to }); if (r.ok) toast(r.value!.finished ? `${show.title}, watched to the end.` : `${r.value!.watched} minutes of ${show.title}.`, 'positive'); };
          return (
            <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="field" style={{ margin: 0 }}>
                <label htmlFor="homelife-programme">Program</label>
                <select id="homelife-programme" value={show.id} onChange={(e) => setProgId(e.target.value)}>
                  {shows.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
                </select>
              </div>
              <span className="small">{finished(show, at) ? 'Watched to the end.' : `On ${show.service}${show.confirmed ? '' : ' (its episodes read secondhand)'}: season ${at.season + 1} of ${show.seasons.length}, episode ${at.episode + 1} of ${show.seasons[at.season]![0]}${at.minute > 0 ? `, ${at.minute} minutes in` : ''}.`}</span>
              {(() => { const plan = cheapestPlanFor(sim, person, show); return plan ? <button type="button" className="btn btn-sm btn-ghost" disabled={!subscribe.open} title={subscribe.reason} onClick={() => { if (run('home.subscribe', { id: plan.id }).ok) toast(`${plan.label}, from now.`, 'positive'); }}>{`Subscribe: ${plan.label}, ${money(plan.monthly)} A Month`}</button> : null; })()}
              <button type="button" className="btn btn-sm btn-ghost" disabled={!watchTv.open || Boolean(no)} title={no ?? watchTv.reason} onClick={() => watch('episode')}>{at.minute > 0 ? 'Finish The Episode' : 'Watch An Episode'}</button>
              <button type="button" className="btn btn-sm btn-ghost" disabled={!watchTv.open || Boolean(no)} title={no ?? watchTv.reason} onClick={() => watch('hour')}>Watch For An Hour</button>
            </div>
          );
        })()}
      </div>
    </Panel>
  );
}
