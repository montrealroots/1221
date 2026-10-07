/**
 * What they own and where each thing is (`systems/items.ts`, from 2026-10-01):
 * on them, at home and in which spot, in a vehicle, inside a bag, on its way
 * from an order, or with a service. A thing is moved only from where it's to
 * hand, to a place they can reach, into room enough.
 */
import { Fragment, useState } from 'react';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { assembleRefusal, assemblyMinutes, buybackRefusal, buybackShare } from '@/engine/systems/furnishings';
import { bulkyFee, bulkyRefusal } from '@/engine/systems/bulky';
import { useGame, useWorld } from '@/app/game-context';
import { gearRefusal, sportShop } from '@/engine/systems/sportsgear';
import { homeCourts } from '@/engine/systems/dwelling';
import { titleCaseLabel } from '@/engine/core/text';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { CatalogControls, CompareTable, CompareToggle, FavoriteToggle, ShowMore, useCatalogView, useCompare, usePaged } from '@/ui/components/Catalog';
import { Gated, useFeature } from '@/ui/guide/Guide';
import { formatDate } from '@/engine/core/time';
import { SPOT_LABEL, homeKeyOf, itemsOf, moveRefusal, reachable, usedL, whereWords, type Item, type Place, type Spot } from '@/engine/systems/items';
import { bagKg, bagsGoing, bagsOf, buyLuggageRefusal, checkedSize, colorsOf, luggageCatalog, luggageProduct, luggageRefusal, packedIn, suitcaseOf } from '@/engine/systems/luggage';
import type { LuggagePiece } from '@/engine/content/luggagecatalog';
import { arrange, type CatalogEntry } from '@/engine/systems/catalog';
import { CITIES } from '@/engine/content/geography';
import { ENGRAVERS, JEWELERS, METAL_LABEL, PIECE_LABEL, commissionMoney, commissionRefusal, commissionsOf, jewelersFor, type Metal, type PieceKind } from '@/engine/systems/commissions';
import { cheapestPlanFor, finished, placeIn, programmeRefusal, programmesHere } from '@/engine/systems/programmes';
import { consolesHere, consolesOwned, gamesHere, gamesOwned, licenceHere, licensed, planById, planPrice, plansHere, subscriptionsOf, watchRefusal } from '@/engine/systems/homelife';
import { activationCost, batteryQuote, claimQuote, phoneById, phonePrice, phoneQuote, phoneRefusal, phonesOf, phonesOnSale, plansFor, protectionFor } from '@/engine/systems/phones';
import { heldRefusal, orderStage, ordersOf } from '@/engine/systems/orders';
import { giveRefusal } from '@/engine/systems/gifts';
import { cardRefusal, hasSomethingToRead, libraryIn, readingCatalog } from '@/engine/systems/reading';
import { batteryOptions, batteryRefusal, batteryYears, makerServiceOf, serviceDue, servicePrice, stopped } from '@/engine/systems/watches';
import { owedOn, pawnTermsIn, pawnsOf, pledgeQuote, pledgeRefusal } from '@/engine/systems/pawn';
import { lockedAway, safeCatalog, safesAtHome, scheduleRefusal, scheduledPremium, valuablesOf } from '@/engine/systems/valuables';
import { contactsOf, type Contact } from '@/engine/systems/people';
import { facetsOf, passes, type FacetFilter } from '@/engine/systems/itemfacets';
import { modelById, vehiclesOf } from '@/engine/systems/vehicles';
import { COLD_CHAIN_HOURS, waitingShopping } from '@/engine/systems/trips';
import { ROOM_USE_LABEL, furnishedIn, roomList } from '@/engine/systems/rooms';
import { claimAmount, claimRefusal } from '@/engine/systems/baggage';
import { GROOMERS, certificatePrice, chipPrice, foodLeftG, groomDue, groomerPrice, litterLeftKg, petShop, petsOf, vetPrice } from '@/engine/systems/pets';
import { PET_ENTRY } from '@/engine/content/petentry';
import { livingIn } from '@/engine/systems/homes';
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

/**
 * Each pet's care (`systems/pets.ts`, from 2026-10-04): fed today or not, the
 * food and litter at home, its food and litter ordered at the retailer's
 * price, a dog walked or a walker booked, and the yearly visit at the vet.
 */
function PetCare() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const pets = petsOf(person);
  const [buy, setBuy] = useState('');
  if (!pets.length) return null;
  const shop = petShop(sim, person).filter((x) => x.kind === 'litter' ? pets.some((p) => p.species === 'cat') : pets.some((p) => p.species === x.species));
  const chosen = shop.find((x) => x.id === buy) ?? shop[0];
  const money = (c: number) => formatMoney(c, saveCurrency(sim.universe));
  const today = new Date(sim.now).toLocaleDateString('en-CA', { timeZone: sim.homeZone });
  return (
    <Panel title="Your Pets" subtitle="Fed, walked, kept in food and litter, and seen by the vet each year">
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Pet</th><th scope="col">Today</th><th scope="col">The Vet</th><th scope="col"><span className="sr-only">Care</span></th></tr></thead>
          <tbody>
            {pets.map((p) => {
              const vet = vetPrice(sim, person, p);
              return (
                <tr key={p.id}>
                  <td>{p.name}<div className="xs dim">{p.species === 'dog' ? 'A Dog' : 'A Cat'}</div></td>
                  <td className="small">{p.fedOn === today ? 'Fed' : 'Not Fed Yet'}{p.species === 'dog' ? (p.walkedOn === today ? ', Walked' : ', Not Walked Yet') : ''}{(p.hungryDays ?? 0) > 0 ? <div className="xs dim">{`${p.hungryDays} days unfed running`}</div> : null}</td>
                  <td className="small">{p.vetUntil && p.vetUntil > sim.now ? `Vaccinated to ${formatDate(p.vetUntil, sim.zone)}` : 'Due'}{typeof vet === 'number' ? <div className="xs dim">{`A visit, ${money(vet)}`}</div> : null}{p.species === 'dog' ? <div className="xs dim">{groomDue(p) <= sim.now ? 'A Bath Is Due' : `Bath Due ${formatDate(groomDue(p), sim.zone)}`}</div> : null}</td>
                  <td>
                    <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
                      {p.species === 'dog' && <Gated feature="pets.walk" className="btn btn-sm btn-ghost" disabled={p.walkedOn === today} onClick={() => { if (run('pets.walk', { petId: p.id }).ok) toast(`An hour’s walk with ${p.name}.`, 'positive'); }}>Walk It</Gated>}
                      {p.species === 'dog' && <Gated feature="pets.walker" className="btn btn-sm btn-ghost" onClick={() => run('pets.walker', { petId: p.id, on: !p.walker })}>{p.walker ? 'Stop The Walker' : 'Book A Walker'}</Gated>}
                      {p.species === 'dog' && <Gated feature="pets.groom" className="btn btn-sm btn-ghost" onClick={() => { if (run('pets.groom', { petId: p.id, at: 'home' }).ok) toast(`${p.name}, bathed.`, 'positive'); }}>Bathe It At Home</Gated>}
                      {p.species === 'dog' && typeof groomerPrice(sim, person) === 'number' && <Gated feature="pets.groom" className="btn btn-sm btn-ghost" onClick={() => { if (run('pets.groom', { petId: p.id, at: 'groomer' }).ok) toast(`${p.name}, bathed at ${GROOMERS[person.home!.cityId]!.name}.`, 'positive'); }}>{`To ${GROOMERS[person.home?.cityId ?? '']?.name}, ${money(groomerPrice(sim, person) as number)}`}</Gated>}
                      {p.chippedAt === undefined && typeof chipPrice(sim, person) === 'number' && <Gated feature="pets.chip" className="btn btn-sm btn-ghost" onClick={() => { if (run('pets.chip', { petId: p.id }).ok) toast(`${p.name}, chipped.`, 'positive'); }}>{`Microchip It, ${money(chipPrice(sim, person) as number)}`}</Gated>}
                      {p.species === 'dog' && <Gated feature="pets.tapeworm" className="btn btn-sm btn-ghost" onClick={() => { if (run('pets.tapeworm', { petId: p.id }).ok) toast(`${p.name}, treated for tapeworm.`, 'positive'); }}>Treat For Tapeworm</Gated>}
                      {p.species === 'dog' && <Gated feature="pets.import_form" className="btn btn-sm btn-ghost" onClick={() => { if (run('pets.import_form', { petId: p.id }).ok) toast(`${p.name}’s CDC form, filed.`, 'positive'); }}>File The CDC Form</Gated>}
                      <Gated feature="pets.vet" className="btn btn-sm btn-ghost" disabled={typeof vet === 'string'} onClick={() => { if (run('pets.vet', { petId: p.id }).ok) toast(`${p.name} saw the vet.`, 'positive'); }}>Take It To The Vet</Gated>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <PetPapers />
      <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Gated feature="pets.feed" className="btn btn-sm btn-primary" onClick={() => { const r = run<{ fed: string[] }>('pets.feed', {}); if (r.ok) toast(`Fed ${r.value!.fed.join(' and ')}.`, 'positive'); }}>Feed Them</Gated>
        <span className="small">{`At home: ${pets.some((p) => p.species === 'dog') ? `${(foodLeftG(person, 'dog') / 1000).toFixed(1)} kg of dog food, ` : ''}${pets.some((p) => p.species === 'cat') ? `${(foodLeftG(person, 'cat') / 1000).toFixed(1)} kg of cat food, ${litterLeftKg(person).toFixed(1)} kg of litter` : ''}`.replace(/, $/, '')}</span>
      </div>
      {chosen && (
        <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <select aria-label="Food Or Litter To Order" value={chosen.id} onChange={(e) => setBuy(e.target.value)}>
            {shop.map((x) => <option key={x.id} value={x.id}>{`${x.label}, ${money(x.price)} at ${x.retailer}`}</option>)}
          </select>
          <Gated feature="pets.buy" className="btn btn-sm btn-ghost" onClick={() => { if (run('pets.buy', { productId: chosen.id }).ok) toast('Ordered: it comes in two days.', 'positive'); }}>Order It</Gated>
        </div>
      )}
    </Panel>
  );
}

/**
 * The home room by room (`roomList`, from 2026-10-04): each room's use, size,
 * whose and what's fixed in it, the furniture standing in it, a piece on the
 * floor put in a room that can take it, and a spare bedroom kept spare or
 * used for storage.
 */
const SPORT_KIND: Readonly<Record<string, string>> = { 'tennis-racket': 'Tennis Racket', 'tennis-balls': 'Tennis Balls', 'pickleball-paddle': 'Pickleball Paddle', pickleballs: 'Pickleballs', basketball: 'Basketball', football: 'Football' };
/** Rackets, paddles and balls where they live (`systems/sportsgear.ts`, from 2026-10-05): what a home's court or pitch is played with. */
function SportsEquipment() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const shop = useWorld((s) => sportShop(s, s.player));
  const entries = shop.map((g) => ({ id: g.id, label: g.name, value: g, basis: 'Tax In', price: g.cost, priceKind: 'advertised' as const, facets: { kind: SPORT_KIND[g.kind]!, brand: g.brand } }));
  const [view, setView] = useCatalogView('sport-gear');
  const arranged = arrange(entries, view);
  const [count, more] = usePaged('sport-gear');
  const buy = useFeature('sport.buy');
  if (entries.length === 0) return null;
  const courts = homeCourts(person);
  return (
    <Panel title="Sports Equipment" subtitle={courts.length ? courts.map((c) => `${titleCaseLabel(c.court)}: ${gearRefusal(person, c.court) ?? 'Ready To Play'}`).join(' · ') : 'What a court or a pitch at home is played with'}>
      <div className="col gap-2">
        <CatalogControls id="sport-gear-catalog" entries={entries} view={view} onChange={setView} facets={{ kind: 'Kind', brand: 'Maker' }} />
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Product</th><th scope="col">Kind</th><th scope="col">Seller</th><th scope="col" className="num">Price</th><th scope="col"><span className="sr-only">Buy</span></th></tr></thead>
            <tbody>
              {arranged.slice(0, count).map((e) => (
                <tr key={e.id}>
                  <td>{e.label}{e.value.count > 1 ? <span className="xs dim">{` · ${e.value.count} In A Pack`}</span> : null}</td>
                  <td className="small">{e.facets?.kind}</td>
                  <td className="small">{e.value.retailer}</td>
                  <td className="num mono">{formatMoney(e.price ?? 0, cur, { cents: false })}</td>
                  <td><button type="button" className="btn btn-sm btn-ghost" disabled={!buy.open} title={buy.reason} onClick={() => { if (run('sport.buy', { productId: e.id }).ok) toast(`${e.label}, at home.`, 'positive'); }}>Buy</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ShowMore shown={Math.min(count, arranged.length)} total={arranged.length} onMore={more} />
      </div>
    </Panel>
  );
}

function YourRooms() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const [piece, setPiece] = useState<Record<string, string>>({});
  const rooms = roomList(sim, person);
  const home = homeKeyOf(person.home);
  if (!rooms.length || !home || person.currentLocationId !== person.home?.cityId) return null;
  const floor = itemsOf(person).filter((i) => i.at.kind === 'home' && i.at.home === home && (i.at.spot ?? 'floor') === 'floor' && (i.bulky || i.kind.startsWith('ikea:') || i.kind.startsWith('furn:')));
  const owns = Boolean(livingIn(person));
  // What a furnished home came with, in its rooms (from 2026-10-06).
  const came = furnishedIn(person);
  return (
    <Panel title="Your Rooms" subtitle="Each room, what it’s used for and what stands in it">
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Room</th><th scope="col">Used For</th><th scope="col" className="num">Size</th><th scope="col">In It</th><th scope="col"><span className="sr-only">Put Something Here</span></th></tr></thead>
          <tbody>
            {rooms.map((r) => {
              const inIt = floor.filter((i) => i.at.kind === 'home' && i.at.room === r.id);
              const loose = floor.filter((i) => i.at.kind === 'home' && i.at.room === undefined);
              const chosen = piece[r.id] ?? loose[0]?.id ?? '';
              const item = loose.find((i) => i.id === chosen);
              const no = item ? moveRefusal(sim, person, item, { kind: 'home', home, spot: 'floor', room: r.id }) : 'Every piece on the floor is in a room.';
              return (
                <tr key={r.id}>
                  <td>{r.label}{r.access === 'shared' ? <div className="xs dim">Shared</div> : null}{r.fixtures.length ? <div className="xs dim">{r.fixtures.join(', ')}</div> : null}</td>
                  <td className="small">
                    {r.use ? ROOM_USE_LABEL[r.use] : r.kind === 'bedroom' ? 'A Flatmate’s Room' : '—'}
                    {owns && (r.use === 'spare' || r.use === 'storage' || r.use === 'guest') && (
                      <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
                        <Gated feature="home.room_use" className="btn btn-sm btn-ghost" onClick={() => { if (run('home.room_use', { roomId: r.id, use: r.use === 'spare' ? 'storage' : 'spare' }).ok) toast(r.use === 'spare' ? 'It’s a storage room now.' : 'It’s kept spare now.', 'positive'); }}>{r.use === 'spare' ? 'Use It For Storage' : 'Keep It Spare'}</Gated>
                        {r.use === 'spare' && <Gated feature="home.room_use" className="btn btn-sm btn-ghost" onClick={() => { if (run('home.room_use', { roomId: r.id, use: 'guest' }).ok) toast('It’s a guest room now: put a bed in it, and a friend from out of town can come and stay.', 'positive'); }}>Make It A Guest Room</Gated>}
                      </div>
                    )}
                  </td>
                  <td className="num small">{`${r.m2.toFixed(1)} m²`}</td>
                  <td className="small">{[...inIt.map((i) => i.label), ...came.filter((f) => f.roomId === r.id).map((f) => f.label)].join(', ') || '—'}</td>
                  <td>
                    {loose.length > 0 && r.kind !== 'bathroom' && (
                      <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
                        <select aria-label={`What To Put In ${r.label}`} value={chosen} onChange={(e) => setPiece((x) => ({ ...x, [r.id]: e.target.value }))}>
                          {loose.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
                        </select>
                        <Gated feature="items.move" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { if (run('items.move', { itemId: chosen, to: { kind: 'home', home, spot: 'floor', room: r.id } }).ok) toast(`Put in ${r.label.replace(/^The /, 'the ')}.`, 'positive'); }}>Put It Here</Gated>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="xs dim">Bedrooms at the space standard’s least, a bathroom four square meters, the living room and kitchen sharing the rest, scaled to the home; a storage room holds half its volume.</div>
    </Panel>
  );
}

/**
 * Shopping bought on a trip and not yet put away (from 2026-10-03): in the
 * car or in your arms, each with where it keeps and, for what needs the
 * fridge, how long before USDA's two hours run out; put away one by one or
 * all at once, where it keeps or where chosen; and the shortcut that puts it
 * all away on getting home.
 */
function ShoppingOut() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const waiting = waitingShopping(person);
  const [spots, setSpots] = useState<Record<string, Spot>>({});
  const auto = person.automation?.unloadShopping === true;
  const say = (r: { put: number; spoiled: number; refused: { label: string; why: string }[] }) => toast(`Put away ${r.put}${r.spoiled ? `, ${r.spoiled} thrown out` : ''}${r.refused.length ? `; ${r.refused[0]!.label}: ${r.refused[0]!.why}` : ''}.`, r.refused.length ? 'negative' : 'positive');
  if (!waiting.length && !auto) {
    return (
      <Panel title="Your Shopping" subtitle="Nothing waiting to be put away">
        <Gated feature="life.set_automation" className="btn btn-sm btn-ghost" onClick={() => run('life.set_automation', { key: 'unloadShopping', on: true })}>Put It Away When I Get Home</Gated>
      </Panel>
    );
  }
  return (
    <Panel title="Your Shopping" subtitle="Bought on a trip and not yet put away: it waits where it rode until you bring it in">
      {waiting.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Item</th><th scope="col">Where It Is</th><th scope="col">Keeps</th><th scope="col">Put It In</th><th scope="col"><span className="sr-only">Put Away</span></th></tr></thead>
            <tbody>
              {waiting.map((i) => {
                const spot = spots[i.id] ?? i.storeIn!;
                const cold = i.storeIn === 'fridge' || i.storeIn === 'freezer';
                const left = cold ? COLD_CHAIN_HOURS * 60 - Math.floor((sim.now - i.acquiredAt) / 60_000) : undefined;
                const home = homeKeyOf(person.home);
                const no = home ? moveRefusal(sim, person, i, { kind: 'home', home, spot }) : 'You have no home to put it in.';
                return (
                  <tr key={i.id}>
                    <td>{i.label}{i.quantity > 1 ? ` × ${i.quantity}` : ''}</td>
                    <td className="small">{i.at.kind === 'vehicle' ? 'In The Car' : i.at.kind === 'home' ? 'Inside The Door' : 'In Your Arms'}</td>
                    <td className="small">{SPOT_LABEL[i.storeIn!]}{left !== undefined ? <div className="xs dim">{left > 0 ? `${left} minutes of the two hours left` : 'Out past the two hours'}</div> : null}</td>
                    <td>
                      <select aria-label={`Where To Put ${i.label}`} value={spot} onChange={(e) => setSpots((x) => ({ ...x, [i.id]: e.target.value as Spot }))}>
                        {(Object.keys(SPOT_LABEL) as Spot[]).filter((sp) => sp !== 'hamper').map((sp) => <option key={sp} value={sp}>{SPOT_LABEL[sp]}</option>)}
                      </select>
                    </td>
                    <td><Gated feature="items.put_away" className="btn btn-sm btn-ghost" disabled={Boolean(no) && !(left !== undefined && left <= 0)} title={no} onClick={() => { const r = run<{ put: number; spoiled: number; refused: { label: string; why: string }[] }>('items.put_away', { itemIds: [i.id], spot }); if (r.ok) say(r.value!); }}>Put It Away</Gated></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        {waiting.length > 0 && <Gated feature="items.put_away" className="btn btn-sm btn-primary" onClick={() => { const r = run<{ put: number; spoiled: number; refused: { label: string; why: string }[] }>('items.put_away', {}); if (r.ok) say(r.value!); }}>Put It All Away</Gated>}
        <Gated feature="life.set_automation" className="btn btn-sm btn-ghost" onClick={() => run('life.set_automation', { key: 'unloadShopping', on: !auto })}>{auto ? 'Leave It Out Until I Put It Away' : 'Put It Away When I Get Home'}</Gated>
        <span className="xs dim">{auto ? 'Getting home puts it all away where each keeps, on the same rules as by hand.' : 'Food is cooked from once it’s brought in from the car; what needs the fridge keeps two hours out, USDA’s limit.'}</span>
      </div>
    </Panel>
  );
}

export function BelongingsWorkspace() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const items = itemsOf(person);
  const move = useFeature('items.move');
  const assemble = useFeature('items.assemble');
  const sellBack = useFeature('home.sell_back');
  const [target, setTarget] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<FacetFilter>({});
  const places = placesNow(sim, person, items);
  // Who a thing can be handed to, once for the screen: somebody here who isn’t a rival (`giveRefusal`’s own reading).
  const givable = contactsOf(person).filter((c) => !c.rival && c.cityId === person.currentLocationId);
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
        <ShoppingOut />
        <PetCare />
        <YourRooms />
        <SportsEquipment />
        <Panel title="Where Things Are">
          <div className="grid grid-3">
            <Stat label="Owned" value={String(items.length)} note="Each thing, or each set of the same" />
            <Stat label="To Hand" value={String(toHandCount)} note="Where you are now" />
            <Stat label="On Their Way" value={String(coming.length)} note={coming.length ? `The next arrives ${formatDate(Math.min(...coming.map((o) => o.arrivesAt)), sim.zone)}` : 'No orders outstanding'} />
          </div>
          {coming.length > 0 && (
            <div className="col gap-1 small" style={{ marginTop: '0.5rem' }}>
              {/* Each order's stage as the carrier's tracking says it (`orderStage`). */}
              {/* Missed for want of a signature, it's held by its carrier and collected (`orders.collect`, from 2026-10-06). */}
              {coming.map((o) => (
                <div key={o.id} className="row gap-2" style={{ alignItems: 'center' }}>
                  <span>{o.held ? `${o.from}: ${orderStage(person, o, sim.now)} at ${o.held.carrier}, until ${formatDate(o.held.until, sim.zone)}` : `${o.from}: ${orderStage(person, o, sim.now)}, due ${formatDate(o.arrivesAt, sim.zone)}`}</span>
                  {o.held && <Gated feature="orders.collect" className="btn btn-sm btn-ghost" title={heldRefusal(person, o.id, sim.now)} disabled={Boolean(heldRefusal(person, o.id, sim.now))} onClick={() => { if (run('orders.collect', { orderId: o.id }).ok) toast('Collected.', 'positive'); }}>Collect It</Gated>}
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Suitcase />
        <LeftBehind />
        <MishandledBags />
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
                                  <GiveTo itemId={item.id} label={item.label} people={givable} />
                                  <Collected item={item} />
                                  {item.kind.startsWith('ikea:') && !buybackRefusal(person, item.id) && <button type="button" className="btn btn-sm btn-ghost" disabled={!sellBack.open} title={sellBack.reason ?? 'IKEA’s refund card, for the next piece'} onClick={() => { const r = run<{ credit: number }>('home.sell_back', { itemId: item.id }); if (r.ok) toast(`${formatMoney(r.value!.credit, saveCurrency(sim.universe))} of IKEA credit.`, 'positive'); }}>{`Sell It Back To IKEA, ${formatMoney(Math.round((item.paid ?? 0) * buybackShare(item.condition)), saveCurrency(sim.universe))}`}</button>}
                                  {item.flatPacked && <button type="button" className="btn btn-sm btn-ghost" disabled={!assemble.open || Boolean(assembleRefusal(person, item.id))} title={assembleRefusal(person, item.id) ?? assemble.reason ?? `About ${Math.round(assemblyMinutes(item.label))} minutes`} onClick={() => { if (run('items.assemble', { itemId: item.id }).ok) toast(`The ${item.label}, put together.`, 'positive'); }}>Put It Together</button>}
                                </div>
                              ) : (item.flatPacked || item.bulky) && here ? <div className="row gap-1" style={{ justifyContent: 'flex-end' }}><Collected item={item} />{item.flatPacked && <button type="button" className="btn btn-sm btn-ghost" disabled={!assemble.open || Boolean(assembleRefusal(person, item.id))} title={assembleRefusal(person, item.id) ?? assemble.reason ?? `About ${Math.round(assemblyMinutes(item.label))} minutes`} onClick={() => { if (run('items.assemble', { itemId: item.id }).ok) toast(`The ${item.label}, put together.`, 'positive'); }}>Put It Together</button>}</div> : <div className="xs dim" style={{ textAlign: 'right' }}>{here ? 'Stays Where It Is' : 'Not To Hand'}</div>}
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

/**
 * Bags on sale where you live (`content/luggagecatalog.ts`, as products from
 * 2026-10-04): searched, filtered by kind and brand, cheapest first with the
 * tax as the place shows it, a page at a time, up to three compared side by
 * side, marked favorite, and bought in a color it's offered in.
 */
function Luggage() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const buy = useFeature('luggage.buy');
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const shop = luggageCatalog(sim, person);
  const [view, setView] = useCatalogView('luggage');
  const [shownCount, more] = usePaged('luggage');
  const [compared, toggleCompare, clearCompare] = useCompare('luggage');
  const [colors, setColors] = useState<Record<string, string>>({});
  if (shop.length === 0) return null;
  const TYPE: Record<string, string> = { 'carry-on': 'Carry-On', underseat: 'Underseat', medium: 'Medium', large: 'Large', duffel: 'Duffel', backpack: 'Backpack', garment: 'Garment Bag' };
  const entries: CatalogEntry<{ piece: LuggagePiece; price: number }>[] = shop.map((x) => {
    const p = luggageProduct(x.piece);
    return {
      id: x.piece.id, label: `${x.piece.brand} ${x.piece.model}`, price: x.price, priceKind: 'advertised', basis: 'Each, with the tax as the place shows it',
      facets: { kind: TYPE[x.piece.type] ?? x.piece.type, brand: x.piece.brand },
      words: [p?.family, p?.attrs.material, x.piece.retailer].filter(Boolean).join(' '), value: x,
    };
  });
  const arranged = arrange(entries, view);
  const page = arranged.slice(0, shownCount);
  const chosen = compared.map((id) => entries.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => Boolean(e));
  const attr = (e: (typeof entries)[number], k: string): string => { const v = luggageProduct(e.value.piece)?.attrs[k]; return v === null || v === undefined ? '—' : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v); };
  return (
    <Panel title="Bags" subtitle={`${shop.length} on sale where you live, from ${new Set(shop.map((x) => x.piece.brand)).size} makers`}>
      <div className="col gap-2">
        <CatalogControls id="luggage-catalog" entries={entries} view={view} onChange={setView} facets={{ kind: 'Kind', brand: 'Maker' }} />
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Bag</th><th scope="col" className="num">Holds</th><th scope="col" className="num">Weighs</th><th scope="col" className="num">Price</th><th scope="col"><span className="sr-only">Choose</span></th></tr></thead>
            <tbody>
              {page.map((e) => {
                const { piece, price } = e.value;
                const no = buyLuggageRefusal(person, piece.id);
                const offered = colorsOf(piece);
                const color = colors[piece.id] ?? offered[0];
                return (
                  <tr key={piece.id}>
                    <td>{e.label}<div className="xs dim">{TYPE[piece.type] ?? piece.type}{piece.retailer ? `, ${piece.retailer}` : ''}</div></td>
                    <td className="num" title={piece.litersEstimated ? 'Estimated from its outside measure; the maker doesn’t publish what it holds' : undefined}>{piece.litersEstimated ? '≈' : ''}{piece.liters} L</td>
                    <td className="num">{piece.kg !== null ? `${piece.kg} kg` : '—'}</td>
                    <td className="num mono">{money(price)}</td>
                    <td>
                      <div className="row gap-1" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {offered.length > 1 && <select aria-label={`Color Of ${e.label}`} value={color} onChange={(ev) => setColors((x) => ({ ...x, [piece.id]: ev.target.value }))}>{offered.map((c) => <option key={c} value={c}>{c}</option>)}</select>}
                        <FavoriteToggle list="luggage" id={piece.id} />
                        <CompareToggle on={compared.includes(piece.id)} onToggle={() => toggleCompare(piece.id)} />
                        <button type="button" className="btn btn-sm btn-ghost" disabled={!buy.open || Boolean(no)} title={no ?? buy.reason} onClick={() => { if (run('luggage.buy', { pieceId: piece.id, ...(offered.length > 1 && color ? { color } : {}) }).ok) toast(`${e.label}${color ? `, ${color}` : ''}, bought.`, 'positive'); }}>Buy</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {arranged.length === 0 && <div className="small">None on sale here matches that; clear the search or a filter.</div>}
        <ShowMore shown={Math.min(shownCount, arranged.length)} total={arranged.length} onMore={more} />
        <CompareTable heads={chosen.map((e) => e.label)} onClear={clearCompare} rows={[
          { label: 'Price', values: chosen.map((e) => money(e.value.price)) },
          { label: 'Holds', values: chosen.map((e) => `${e.value.piece.litersEstimated ? '≈' : ''}${e.value.piece.liters} L`) },
          { label: 'Weighs', values: chosen.map((e) => (e.value.piece.kg !== null ? `${e.value.piece.kg} kg` : '—')) },
          { label: 'Outside', values: chosen.map((e) => (e.value.piece.outsideL !== null ? `${e.value.piece.outsideL} L` : '—')) },
          { label: 'Material', values: chosen.map((e) => attr(e, 'material')) },
          { label: 'Wheels', values: chosen.map((e) => attr(e, 'wheels')) },
          { label: 'Expands', values: chosen.map((e) => attr(e, 'expandable')) },
          { label: 'Warranty, Years', values: chosen.map((e) => attr(e, 'warrantyYears')) },
          { label: 'Colors', values: chosen.map((e) => colorsOf(e.value.piece).join(', ') || '—') },
        ]} />
      </div>
    </Panel>
  );
}

const PAPERS_FOR: Readonly<Record<string, string>> = { mx: 'Mexico', ca: 'Canada', us: 'America', ie: 'Ireland', uk: 'Great Britain' };
/** A health certificate for the pets, for where they're going (`pets.certificate`, from 2026-10-04): each country's own days from issue to arrival. */
function PetPapers() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const [to, setTo] = useState('uk');
  const price = certificatePrice(sim, person);
  if (petsOf(person).length === 0) return null;
  const cur = saveCurrency(sim.universe);
  return (
    <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div className="field" style={{ margin: 0 }}>
        <label htmlFor="pet-papers-to">A Health Certificate For</label>
        <select id="pet-papers-to" value={to} onChange={(e) => setTo(e.target.value)}>{Object.keys(PET_ENTRY).sort((a, z) => PAPERS_FOR[a]!.localeCompare(PAPERS_FOR[z]!)).map((c) => <option key={c} value={c}>{PAPERS_FOR[c]}</option>)}</select>
      </div>
      <Gated feature="pets.certificate" className="btn btn-sm" disabled={typeof price === 'string'} title={typeof price === 'string' ? price : undefined} onClick={() => { if (run('pets.certificate', { to }).ok) toast(`A health certificate for ${PAPERS_FOR[to]}.`, 'positive'); }}>{typeof price === 'number' ? `Get One, ${formatMoney(price, cur, { cents: false })}` : 'Get One'}</Gated>
      <span className="xs dim">Each country’s own list is checked on the day you arrive: a microchip, rabies, the certificate’s days, a dog’s tapeworm treatment or the CDC’s form.</span>
    </div>
  );
}

/** Giving a thing to a friend here (`items.give`): theirs from then, and remembered. */
function GiveTo({ itemId, label, people }: { itemId: string; label: string; people: readonly Contact[] }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const give = useFeature('items.give');
  const [to, setTo] = useState('');
  // The list drawn only once asked for (from 2026-10-06): until then each row drew everybody known who's here, and a
  // life at 60 with 339 people in town and 490 things drew 166,000 choices and took 8.9 seconds to open.
  const [open, setOpen] = useState(false);
  if (people.length === 0 || giveRefusal(sim, person, itemId, people[0]!.id)) return null;
  if (!open) return <button type="button" className="btn btn-sm btn-ghost" disabled={!give.open} title={give.reason} onClick={() => setOpen(true)}>Give To…</button>;
  const here = people;
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

/**
 * Your bags (from 2026-10-03): each one, whether it goes away, how full and
 * how heavy packed against a checked bag's allowance, packed by hand on Each
 * Thing or a week packed for you, unpacked one by one; away, the room's
 * things repacked; and the Pack For Me shortcut that does all of it on its
 * own (`systems/luggage.ts`).
 */
function Suitcase() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const bags = bagsOf(person);
  if (!bags.length) return null;
  const going = new Set(bagsGoing(person).map((b) => b.id));
  const main = suitcaseOf(person);
  const no = luggageRefusal(sim, person);
  const away = Boolean(person.stay) && person.currentLocationId !== person.home?.cityId;
  const inRoom = itemsOf(person).filter((i) => i.at.kind === 'stay' && i.at.cityId === person.currentLocationId).length;
  const auto = person.automation?.packForMe === true;
  return (
    <Panel title="Your Bags" subtitle={`${going.size} of ${bags.length} going away with you${inRoom ? `; ${inRoom} ${inRoom === 1 ? 'thing' : 'things'} out in the room` : ''}`}>
      <div className="col gap-2">
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Bag</th><th scope="col" className="num">Packed</th><th scope="col" className="num">Weighs</th><th scope="col">Goes Away</th><th scope="col"><span className="sr-only">Unpack</span></th></tr></thead>
            <tbody>
              {bags.map((bag) => {
                const kg = bagKg(person, bag);
                const inIt = packedIn(person, bag);
                return (
                  <tr key={bag.id}>
                    <td>{bag.label}{bag.id === main?.id ? <div className="xs dim">The main one: Pack For Me fills it</div> : null}</td>
                    <td className="num small">{`${Math.round(usedL(person, bag.id))} of ${bag.holdsL} L, ${inIt.length} ${inIt.length === 1 ? 'thing' : 'things'}`}</td>
                    <td className="num small">{`${kg.toFixed(1)} kg`}{checkedSize(bag) && kg > 23 ? <div className="xs dim">Past the 23 kg most airlines allow</div> : null}</td>
                    <td>
                      <div className="row gap-1">
                        <Gated feature="luggage.take" className="btn btn-sm btn-ghost" onClick={() => run('luggage.take', { itemId: bag.id, going: !going.has(bag.id) })}>{going.has(bag.id) ? 'Leave It Home' : 'Take It'}</Gated>
                        {bag.id !== main?.id && <Gated feature="luggage.choose" className="btn btn-sm btn-ghost" onClick={() => { if (run('luggage.choose', { itemId: bag.id }).ok) toast(`${bag.label} is the main one now.`, 'positive'); }}>Make It The Main One</Gated>}
                      </div>
                    </td>
                    <td><Gated feature="luggage.unpack" className="btn btn-sm btn-ghost" disabled={inIt.length === 0} onClick={() => { const r = run<{ unpacked: number }>('luggage.unpack', { itemId: bag.id }); if (r.ok) toast(`${r.value!.unpacked} unpacked.`, 'positive'); }}>{away ? 'Unpack Into The Room' : 'Unpack'}</Gated></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Gated feature="luggage.pack" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => { const r = run<{ packed: number }>('luggage.pack', {}); if (r.ok) toast(`${r.value!.packed} packed.`, 'positive'); }}>Pack For Me</Gated>
          {away && <Gated feature="luggage.repack" className="btn btn-sm" disabled={inRoom === 0} onClick={() => { const r = run<{ packed: number; left: number }>('luggage.repack', {}); if (r.ok) toast(`${r.value!.packed} repacked${r.value!.left ? `, ${r.value!.left} won’t fit` : ''}.`, r.value!.left ? 'negative' : 'positive'); }}>Repack The Room</Gated>}
          <Gated feature="life.set_automation" className="btn btn-sm btn-ghost" onClick={() => run('life.set_automation', { key: 'packForMe', on: !auto })}>{auto ? 'Pack Only When I Do' : 'Pack And Unpack For Me'}</Gated>
        </div>
        <PackingLists />
        <p className="xs dim" style={{ margin: 0 }}>{auto ? 'Leaving home packs a week into an empty main bag, coming back unpacks, and leaving a room repacks it, as far as the bags hold.' : 'Bags go as they’re packed, an empty one empty; home, they’re set down packed. A room left without repacking leaves its things behind, held there 90 days.'} A packed bag’s weight is reckoned from laundry tables’ grams a garment; checked bags past the airline’s allowance pay at the counter.</p>
      </div>
    </Panel>
  );
}

/** Packing lists (`luggage.save_list`, `luggage.pack_list`, from 2026-10-04): the main bag's things kept under a name, and packed again, what can't go named. */
function PackingLists() {
  const { run, toast } = useGame();
  const lists = useWorld((s) => s.player.packingLists ?? []);
  const [name, setName] = useState('');
  const [pick, setPick] = useState('');
  const chosen = lists.find((l) => l.id === pick) ?? lists[0];
  return (
    <div className="field-row field-row-tight">
      <div className="field">
        <label htmlFor="pack-list-name">Keep What’s In The Main Bag As</label>
        <input id="pack-list-name" value={name} placeholder="A Week In London" onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field" style={{ alignSelf: 'flex-end' }}>
        <Gated feature="luggage.save_list" className="btn btn-sm" disabled={!name.trim()} onClick={() => { const r = run<{ things: number }>('luggage.save_list', { name }); if (r.ok) { toast(`${name.trim()}, kept: ${r.value!.things} things.`, 'positive'); setName(''); } }}>Keep The List</Gated>
      </div>
      {chosen && (
        <>
          <div className="field">
            <label htmlFor="pack-list-pick">A Packing List</label>
            <select id="pack-list-pick" value={chosen.id} onChange={(e) => setPick(e.target.value)}>{lists.map((l) => <option key={l.id} value={l.id}>{`${l.name}, ${l.itemIds.length} Things`}</option>)}</select>
          </div>
          <div className="field row gap-1" style={{ alignSelf: 'flex-end' }}>
            <Gated feature="luggage.pack_list" className="btn btn-sm" onClick={() => { const r = run<{ packed: number; already: number; short: { label: string; why: string }[] }>('luggage.pack_list', { listId: chosen.id }); if (r.ok) toast(`${r.value!.packed} packed${r.value!.already ? `, ${r.value!.already} in already` : ''}${r.value!.short.length ? `; not packed: ${r.value!.short.map((x) => `${x.label} (${x.why})`).join(', ')}` : ''}.`, r.value!.short.length ? 'negative' : 'positive'); }}>Pack This List</Gated>
            <Gated feature="luggage.delete_list" className="btn btn-sm btn-ghost" onClick={() => run('luggage.delete_list', { listId: chosen.id })}>Delete It</Gated>
          </div>
        </>
      )}
    </div>
  );
}

/** Checked bags the airline mishandled (`systems/baggage.ts`, from 2026-10-05): each one's state, and its claim when it can be made. */
function MishandledBags() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const claims = person.bagClaims ?? [];
  if (claims.length === 0) return null;
  const cur = saveCurrency(sim.universe);
  const state = (c: (typeof claims)[number]) => c.paid !== undefined ? `Claimed, ${formatMoney(c.paid, cur, { cents: false })} paid` : c.kind === 'delayed' ? (c.backAt !== undefined && sim.now >= c.backAt ? 'Back' : `With ${c.carrier}, back by ${formatDate(c.backAt ?? c.at, sim.zone)}`) : c.kind === 'damaged' ? 'Damaged' : c.lostAt !== undefined && sim.now >= c.lostAt ? 'Declared lost' : `Being traced until ${formatDate(c.lostAt ?? c.at, sim.zone)}`;
  return (
    <Panel title="Mishandled Bags" subtitle="Checked bags the airline delayed, damaged or lost, and the claims on them">
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Bag</th><th scope="col">What Happened</th><th scope="col" className="num">Claimable</th><th scope="col"><span className="sr-only">Claim</span></th></tr></thead>
          <tbody>{claims.map((c) => {
            const no = claimRefusal(sim, person, c);
            return (
              <tr key={c.id}>
                <td>{c.bagLabel}<div className="xs dim">{`${c.carrier}, ${formatDate(c.at, sim.zone)}`}</div></td>
                <td className="small">{state(c)}</td>
                <td className="num mono">{c.paid === undefined ? formatMoney(claimAmount(person, c), cur, { cents: false }) : '—'}</td>
                <td><Gated feature="travel.bag_claim" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { const r = run<{ paid: number }>('travel.bag_claim', { claimId: c.id }); if (r.ok) toast(`${c.carrier} paid ${formatMoney(r.value!.paid, cur, { cents: false })}.`, 'positive'); }}>Make The Claim</Gated></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </Panel>
  );
}

/** What was left behind at a stay or taken out at an airport's counter, held there until a day, collected in that town (`items.recover`). */
function LeftBehind() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const held = itemsOf(person).filter((i): i is Item & { at: { kind: 'held'; cityId: string; by: string; until: number } } => i.at.kind === 'held' && i.at.until > sim.now);
  if (!held.length) return null;
  const towns = [...new Set(held.map((i) => i.at.cityId))];
  return (
    <Panel title="Left Behind" subtitle="Held where it was left, to collect in person before the day it’s kept to">
      <div className="col gap-2">
        {towns.map((cityId) => {
          const here = held.filter((i) => i.at.cityId === cityId);
          return (
            <div key={cityId} className="row gap-2" style={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span className="small">{`${here.length} at ${here[0]!.at.by}, ${CITIES.get(cityId)?.name ?? cityId}, until ${formatDate(here[0]!.at.until, sim.zone)}: ${here.slice(0, 4).map((i) => i.label).join(', ')}${here.length > 4 ? ' and more' : ''}`}</span>
              <Gated feature="items.recover" className="btn btn-sm btn-ghost" disabled={person.currentLocationId !== cityId} title={person.currentLocationId !== cityId ? `It’s collected in ${CITIES.get(cityId)?.name ?? 'its town'}.` : undefined} onClick={() => { const r = run<{ collected: number }>('items.recover', { cityId }); if (r.ok) toast(`Collected ${r.value!.collected}.`, 'positive'); }}>Collect It</Gated>
            </div>
          );
        })}
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
