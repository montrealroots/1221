/**
 * SLATE — Travel: where you are, a journey by air or, where one runs, by
 * train (from 2026-09-29), booked with its legs and a hotel at the far end,
 * and the journeys booked and taken (`systems/journey.ts`, `systems/rail.ts`,
 * `systems/stays.ts`). Every leg's time is the local
 * time where it happens, and every figure names whose it is.
 */

import { RENTALS, RENTAL_CLASS_LABEL, type RentalClass } from '@/engine/content/rentals';
import { LETS } from '@/engine/content/lets';
import { Fragment, useState } from 'react';
import { PREPAID_OFF, STAY_CLASS_LABEL, type RatePlan, type StayClass } from '@/engine/content/staytypes';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { MS_DAY, formatDateTime, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { STAYS } from '@/engine/content/stays';
import { AIR } from '@/engine/content/air';
import { caravansOf, towFor, towedLegs } from '@/engine/systems/caravans';
import { asRoundTrip, bookRefusal, extendQuote, journeysOf, letQuote, nightsBetween, partnerOf, planBy, slotOf, whereBy, type Journey, type JourneyLeg, CHAUFFEURS, inMotorhome, residentOf } from '@/engine/systems/journey';
import { rentalAt, rentalQuote, rentalsOf } from '@/engine/systems/rentals';
import { arrange } from '@/engine/systems/catalog';
import { rentalCatalog, stayCatalog } from '@/engine/systems/catalogs';
import { catalogPrice } from '@/ui/components/Catalog';
import { OWN_172, PILOT_SCHOOLS, PILOT_TRAINING, PLANE_LOAN, buyAircraftRefusal, licensedIn, ownHourCost, trainRefusal, trainingCosts, trainingCountry, planesOf } from '@/engine/systems/aviation';
import { departureHours, railRouteById, railRoutes } from '@/engine/systems/rail';
import { ownPlaceIn, stayPrice, stayClassesIn } from '@/engine/systems/stays';
import { hoursOut } from '@/engine/systems/jetlag';
import { modelById, vehiclesOf } from '@/engine/systems/vehicles';
import { byRoad } from '@/engine/systems/driving';
import { hotelById, hotelsIn, namedStayQuote } from '@/engine/systems/hotels';
import { airportByCode } from '@/engine/systems/airports';

const STATUS_WORD: Record<Journey['status'], string> = { booked: 'Booked', underway: 'Underway', arrived: 'Arrived', missed: 'Missed', canceled: 'Canceled' };
/** A flight not flown by an airline: a chartered jet, or one's own plane flown by its owner or a hired pilot. */
const flownWord = (l: JourneyLeg, pilot: boolean): string | undefined => (l.mode === 'drive' && l.routeId === 'chauffeur' ? 'Car And Driver' : l.mode !== 'fly' ? undefined : l.routeId === 'jet' ? 'Chartered Jet' : l.routeId === 'own' ? (pilot ? 'Your Plane' : 'Your Plane, A Hired Pilot') : undefined);
const MODE_WORD: Record<JourneyLeg['mode'], string> = { ground: 'To Or From The Airport', 'check-in': 'Check-In', flight: 'Flight', fly: 'Flown Yourself', train: 'Train', bus: 'Coach', ferry: 'Ferry', drive: 'Drive', arrival: 'Off The Aircraft' };
/** A train journey's legs, named for a station. */
const RAIL_WORD: Partial<Record<JourneyLeg['mode'], string>> = { ground: 'To Or From The Station', 'check-in': 'At The Station' };
const clock = (h: number) => `${Math.floor(h) % 12 === 0 ? 12 : Math.floor(h) % 12}:${String(Math.round((h % 1) * 60)).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
const SLOT_WORD = ['Morning', 'Afternoon', 'Evening'];
const place = (id: string) => CITIES.get(id)?.name ?? airportByCode(id)?.name ?? id;

export function TravelWorkspace() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const destinations = [...new Set([...Object.keys(STAYS), person.home?.cityId ?? ''])].filter((id) => id && CITIES.get(id) && id !== person.currentLocationId)
    .sort((a, b) => place(a).localeCompare(place(b)));
  const [to, setTo] = useState('');
  const [days, setDays] = useState(14);
  const [slot, setSlot] = useState(1);
  const [by, setBy] = useState('air');
  const [cabin, setCabin] = useState<'economy' | 'premium'>('economy');
  const [bags, setBags] = useState(0);
  const [nights, setNights] = useState(3);
  const [stayCls, setStayCls] = useState<StayClass>('hotel');
  // A named hotel's room, as "hotel|room", or the town's average (`systems/hotels.ts`).
  const [hotelPick, setHotelPick] = useState('');
  const [ratePlan, setRatePlan] = useState<RatePlan>('flexible');
  const [daysThere, setDaysThere] = useState(4);
  const [tow, setTow] = useState(false);
  // A town chosen before arriving in it isn't a destination from it: until 2026-09-30 it stayed chosen, the list showing
  // another town while the plan said both fly from the same airport.
  const toCity = (destinations.includes(to) ? to : '') || destinations[0] || '';
  const p = zonedParts(sim.now + days * MS_DAY, sim.zone);
  const day = instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone);
  const fromCity = whereBy(person, day);
  // The trains between the two towns, where any run; a choice no longer offered falls back to air.
  const trains = toCity ? railRoutes(fromCity, toCity) : [];
  const route = trains.find((r) => r.id === by);
  // Your own car, where it is: from 2026-09-29 (`systems/driving.ts`).
  const cars = toCity ? vehiclesOf(person).filter((v) => v.soldAt === undefined && (v.at ?? v.cityId) === fromCity && byRoad(fromCity, toCity)) : [];
  const car = cars.find((v) => `car:${v.id}` === by);
  // A car rented where they'll be (`systems/rentals.ts`, from 2026-09-29).
  const rented = toCity && byRoad(fromCity, toCity) ? rentalAt(person, fromCity, day) : undefined;
  // A pilot flies themselves; an owner who isn't one hires a pilot for their own plane.
  const ownsPlane = planesOf(person).length > 0;
  const licensedHere = licensedIn(person, CITIES.get(fromCity)?.countryId ?? '');
  const flies = (licensedHere || ownsPlane) && by === 'fly';
  const mode = route ? route.id : car ? `car:${car.id}` : rented && by === 'rental' ? 'rental' : flies ? 'fly' : by === 'jet' ? 'jet' : by === 'chauffeur' && toCity && byRoad(fromCity, toCity) && CHAUFFEURS[fromCity] ? 'chauffeur' : undefined;
  // A flight of one's own leaves on the hour from 7 AM to 5 PM, as its plan books it. Until 2026-09-30 it offered the
  // airline's 8 AM, 1 PM and 7 PM and booked 7, 8 and 9 AM.
  const slots = route ? departureHours(route).map((h, i) => ({ i, word: clock(h) })) : car || mode === 'rental' || mode === 'chauffeur' ? Array.from({ length: 15 }, (_, i) => ({ i, word: clock(7 + i) })) : mode === 'fly' || mode === 'jet' ? Array.from({ length: 11 }, (_, i) => ({ i, word: clock(7 + i) })) : AIR.departureHours.map((h, i) => ({ i, word: `${SLOT_WORD[i]}, ${clock(h)}` }));
  const pick = Math.min(slot, slots.length - 1);
  const own = toCity ? ownPlaceIn(person, toCity) : false;
  const round = daysThere > 0;
  const seat = mode ? 'economy' : cabin;
  // A caravan of one's own behind the car (`systems/caravans.ts`, from 2026-09-30).
  const caravanHere = car && toCity && caravansOf(person).some((c) => (c.at ?? c.cityId) === fromCity) ? towFor(person, car, fromCity, toCity) : undefined;
  const towing = tow && car && caravanHere && typeof caravanHere !== 'string' ? caravanHere : undefined;
  const planned = toCity ? planBy(sim, mode, fromCity, toCity, day, pick, bags, seat) : 'Choose where.';
  const outLegs = towing && typeof planned !== 'string' ? towedLegs(sim, car!, towing, planned) : planned;
  const plannedBack = toCity && round ? planBy(sim, mode, toCity, fromCity, day + daysThere * MS_DAY, pick, bags, seat, toCity) : undefined;
  const backLegs = towing && plannedBack && typeof plannedBack !== 'string' ? towedLegs(sim, car!, towing, plannedBack) : plannedBack;
  // A round trip's discount is the airlines'; a train's return is two singles.
  const outPlan = typeof outLegs === 'string' ? undefined : round && !mode ? asRoundTrip(outLegs) : outLegs;
  const backPlan = backLegs && typeof backLegs !== 'string' ? (mode ? backLegs : asRoundTrip(backLegs)) : undefined;
  // A round trip's hotel runs from the night it lands to the morning it flies home.
  const stayNights = own ? 0 : round && outPlan && backPlan ? nightsBetween(toCity, outPlan[outPlan.length - 1]!.arriveAt, backPlan[0]!.departAt) : nights;
  // The kinds of stay the town has; one chosen for another town falls back to its hotel.
  const classes = toCity ? stayClassesIn(toCity, inMotorhome(person, mode) || Boolean(towing)) : [];
  const cls: StayClass = classes.includes(stayCls) ? stayCls : 'hotel';
  const no = !toCity ? 'Choose where.' : bookRefusal(sim, person, fromCity, toCity, outLegs, Math.max(1, stayNights), stayNights, cls === 'campground' || cls === 'street')
    ?? (typeof backLegs === 'string' ? backLegs : backPlan && outPlan && backPlan[0]!.departAt <= outPlan[outPlan.length - 1]!.arriveAt ? 'The way home leaves before the way out arrives.' : undefined);
  const arrival = outPlan ? outPlan[outPlan.length - 1]!.arriveAt : day;
  // The named hotels' rooms in the town on this rate, cheapest first, priced for the nights.
  const rooms = toCity && cls === 'hotel' && !own && stayNights > 0 ? hotelsIn(toCity).flatMap((h) => h.rooms.map((r) => ({ key: `${h.id}|${r.name}`, hotel: h, room: r, quote: namedStayQuote(sim, h.id, r.name, ratePlan, arrival, stayNights) })))
    .filter((x) => x.quote).sort((a, b) => a.quote!.price - b.quote!.price) : [];
  const picked = rooms.find((x) => x.key === hotelPick);
  const hotel = picked ? picked.quote : toCity && !own && stayNights > 0 ? stayPrice(sim, toCity, stayNights, 1, cls, ratePlan, residentOf(person, toCity), arrival) : undefined;
  const plan = outPlan ? [...outPlan, ...(backPlan ?? [])] : undefined;
  const fares = plan ? plan.reduce((a, l) => a + l.fare, 0) : 0;
  const journeys = journeysOf(person).slice().sort((a, b) => b.leaveAt - a.leaveAt);
  const here = CITIES.get(person.currentLocationId);
  const stay = person.stay?.cityId === person.currentLocationId ? person.stay : undefined;
  const lag = hoursOut(person.bodyClock, sim.now);
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Day</div>
        <h1>Travel</h1>
        <p className="muted">A journey by air or by train, somewhere to stay at the far end, and the way home.</p>
      </div>
      <div className="col gap-5">
        <Panel title="Where You Are">
          <div className="grid grid-4">
            <Stat label="Town" value={here?.name ?? person.currentLocationId} note={sim.zone} />
            <Stat label="Sleeping" value={person.home?.cityId === person.currentLocationId ? 'At Home' : stay?.kind === 'hotel' ? 'A Hotel' : stay?.kind === 'own' ? 'Your Own Place' : stay?.kind === 'sofa' ? 'A Friend’s Sofa' : 'Away'} />
            <Stat label="Journeys Booked" value={String(journeys.filter((j) => j.status === 'booked').length)} />
            <Stat label="Body Clock" value={Math.abs(lag) < 0.5 ? 'On Local Time' : `${Math.round(Math.abs(lag) * 10) / 10} Hours ${lag > 0 ? 'Behind' : 'Ahead'}`} note={Math.abs(lag) < 0.5 ? undefined : `Catching up ${lag > 0 ? 'an hour' : 'an hour and a half'} a day; nights sleep worse until then`} />
          </div>
        </Panel>

        <Panel title="Book A Journey" subtitle={`From ${place(fromCity)}`}>
          <div className="col gap-3">
            <div className="field-row field-row-tight">
              <div className="field">
                <label htmlFor="travel-to">To</label>
                <select id="travel-to" value={toCity} onChange={(e) => setTo(e.target.value)}>
                  {destinations.map((id) => <option key={id} value={id}>{place(id)}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="travel-days">Days From Now</label>
                <input id="travel-days" type="number" min={1} max={330} value={days} onChange={(e) => setDays(Math.max(1, Math.min(330, Number(e.target.value) || 1)))} />
              </div>
              <div className="field">
                <label htmlFor="travel-by">By</label>
                <select id="travel-by" value={mode ?? 'air'} onChange={(e) => { setBy(e.target.value); setSlot(0); }}>
                  <option value="air">Air</option>
                  {trains.map((r) => <option key={r.id} value={r.id}>{r.operator === r.service ? r.service : `${r.operator}, ${r.service}`}</option>)}
                  {cars.map((v) => <option key={v.id} value={`car:${v.id}`}>Your {modelById(v.modelId)?.make} {modelById(v.modelId)?.model}</option>)}
                  {rented && <option value="rental">Your Rental Car</option>}
                  {(licensedHere || ownsPlane) && <option value="fly">{licensedHere ? 'Fly Yourself' : 'Your Plane, A Hired Pilot'}</option>}
                  <option value="jet">A Chartered Light Jet</option>
                  {toCity && byRoad(fromCity, toCity) && CHAUFFEURS[fromCity] && <option value="chauffeur">A Car And Driver</option>}
                </select>
              </div>
              <div className="field">
                <label htmlFor="travel-slot">Departure</label>
                <select id="travel-slot" value={pick} onChange={(e) => setSlot(Number(e.target.value))}>
                  {slots.map((o) => <option key={o.i} value={o.i}>{o.word}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="travel-cabin">Cabin</label>
                <select id="travel-cabin" value={seat} disabled={Boolean(mode)} onChange={(e) => setCabin(e.target.value === 'premium' ? 'premium' : 'economy')}>
                  <option value="economy">Economy</option>
                  <option value="premium">Business Or First</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="travel-bags">Checked Bags</label>
                <select id="travel-bags" value={mode ? 0 : bags} disabled={Boolean(mode)} onChange={(e) => setBags(Number(e.target.value))}>
                  {[0, 1, 2].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="travel-there">Days There</label>
                <input id="travel-there" type="number" min={0} max={90} value={daysThere} onChange={(e) => setDaysThere(Math.max(0, Math.min(90, Number(e.target.value) || 0)))} />
              </div>
              <div className="field">
                <label htmlFor="travel-nights">Nights</label>
                <input id="travel-nights" type="number" min={0} max={90} value={stayNights} disabled={own || round} onChange={(e) => setNights(Math.max(0, Math.min(90, Number(e.target.value) || 0)))} />
              </div>
            </div>
            {caravanHere !== undefined && (
              <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="field" style={{ margin: 0 }}>
                  <label htmlFor="travel-tow">Your Caravan</label>
                  <select id="travel-tow" value={towing ? 'tow' : 'leave'} disabled={typeof caravanHere === 'string'} title={typeof caravanHere === 'string' ? caravanHere : undefined} onChange={(e) => setTow(e.target.value === 'tow')}>
                    <option value="leave">Left Where It Is</option>
                    <option value="tow">Towed Behind</option>
                  </select>
                </div>
                {typeof caravanHere === 'string' && <div className="xs dim">{caravanHere}</div>}
              </div>
            )}
            {!own && classes.length > 0 && (
              <div className="field-row">
                <div className="field">
                  <label htmlFor="travel-stay">Stay</label>
                  <select id="travel-stay" value={cls} onChange={(e) => setStayCls(e.target.value as StayClass)}>
                    {arrange(stayCatalog(sim, toCity, stayNights, ratePlan, residentOf(person, toCity), inMotorhome(person, mode) || Boolean(towing), outPlan ? outPlan[outPlan.length - 1]!.arriveAt : day)).map((e) => <option key={e.id} value={e.id}>{`${e.label}, ${catalogPrice(e, (c) => formatMoney(c, saveCurrency(sim.universe), { cents: false }))} The Stay`}</option>)}
                  </select>
                </div>
                {rooms.length > 0 && (
                  <div className="field">
                    <label htmlFor="travel-hotel">Hotel</label>
                    <select id="travel-hotel" value={picked ? picked.key : ''} onChange={(e) => setHotelPick(e.target.value)}>
                      <option value="">The Town’s Average Hotel</option>
                      {rooms.map((x) => <option key={x.key} value={x.key}>{`${x.hotel.name}, ${x.room.name}, ${formatMoney(x.quote!.price, saveCurrency(sim.universe), { cents: false })}${x.quote!.estimated ? ' (Estimate)' : ''}`}</option>)}
                    </select>
                  </div>
                )}
                <div className="field">
                  <label htmlFor="travel-rate">Rate</label>
                  <select id="travel-rate" value={ratePlan} onChange={(e) => setRatePlan(e.target.value === 'prepaid' ? 'prepaid' : 'flexible')}>
                    <option value="prepaid">{`Prepaid, ${Math.round(PREPAID_OFF * 1000) / 10}% Off, Not Refunded`}</option>
                    <option value="flexible">Flexible, Free To A Day Before</option>
                  </select>
                </div>
              </div>
            )}
            {plan && (
              <div className="table-scroll">
                <table>
                  <thead><tr><th scope="col">Leg</th><th scope="col">From</th><th scope="col">To</th><th scope="col">Leaves</th><th scope="col">Arrives</th><th scope="col">Fare</th></tr></thead>
                  <tbody>
                    {plan.map((l, i) => {
                      // Each half's legs read in its own places' time: leaving where it starts, arriving where it ends.
                      const outbound = !outPlan || i < outPlan.length;
                      const start = CITIES.require(outbound ? fromCity : toCity).timeZone;
                      const end = CITIES.require(outbound ? toCity : fromCity).timeZone;
                      const departsFar = l.mode === 'arrival' || (l.mode === 'ground' && CITIES.get(l.to) !== undefined);
                      const arrivesNear = l.mode === 'check-in' || (l.mode === 'ground' && CITIES.get(l.to) === undefined);
                      return (
                        <Fragment key={i}>
                          {outPlan && i === outPlan.length && <tr><th scope="rowgroup" colSpan={6}>The Way Home</th></tr>}
                          <tr>
                            <td>{flownWord(l, person.pilot !== undefined) ?? ((mode && RAIL_WORD[l.mode]) || MODE_WORD[l.mode])}</td>
                            <td>{place(l.from)}</td>
                            <td>{place(l.to)}</td>
                            <td>{formatDateTime(l.departAt, departsFar ? end : start)}</td>
                            <td>{formatDateTime(l.arriveAt, arrivesNear ? start : end)}</td>
                            <td className="mono">{l.fare > 0 ? money(l.fare) : 'None'}</td>
                          </tr>
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="grid grid-3">
              <Stat label="Fares" value={plan ? money(fares) : '—'} />
              <Stat label="Stay" value={own ? 'Your Own Place' : hotel ? money(hotel.price) : '—'} note={own ? 'No hotel needed' : `${STAY_CLASS_LABEL[cls]}, ${stayNights} ${stayNights === 1 ? 'night' : 'nights'}, taxes in`} />
              <Stat label="In All" value={plan ? money(fares + (hotel?.price ?? 0)) : '—'} />
            </div>
            {no ? <p className="small" style={{ margin: 0 }}>{no}</p> : null}
            <div className="row gap-2">
              <Gated feature="travel.book" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => {
                const a = run<{ journeyId: string; leaveAt: number; total: number }>('travel.book', { toCity, day, slot: pick, bags: mode ? 0 : bags, ...(mode ? { by: mode } : { cabin: seat }), ...(round ? { returnDay: day + daysThere * MS_DAY, returnSlot: pick } : { nights: own ? 0 : nights }), stay: cls, plan: ratePlan, ...(towing ? { tow: true } : {}), ...(picked ? { hotelId: picked.hotel.id, room: picked.room.name } : {}) });
                if (a.ok) toast(`Booked, for ${money(a.value!.total)}: you leave ${formatDateTime(a.value!.leaveAt, sim.zone)}.`, 'positive');
              }}>Book It</Gated>
            </div>
            <Fine>
              {plan ? plan.map((l) => l.basis).filter((b, i, all) => all.indexOf(b) === i).join(' ') : ''} {hotel?.basis ?? ''} {car ? 'A drive’s fuel, upkeep and tolls are paid when it’s booked, and all of it comes back if it’s canceled.' : route ? `${route.refund.basis} Late at ${route.operator}’s rate, ${Math.round((1 - route.onTime.share) * 1000) / 10}% over ${route.onTime.withinMinutes} minutes (${route.onTime.basis}).` : 'Booked a week or more ahead, the whole booking is refunded if it’s canceled within a day, the DOT’s rule; after that the fares aren’t. Late and canceled flights come at BTS’s rates for 2025.'} The hotel is refunded until a day before you arrive.
            </Fine>
          </div>
        </Panel>

        <LearnToFly />

        <Panel title="Your Journeys">
          {!journeys.length ? <p className="small muted" style={{ margin: 0 }}>None yet.</p> : (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">To</th><th scope="col">Leave</th><th scope="col">Arrive</th><th scope="col">Paid</th><th scope="col">Standing</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
                <tbody>
                  {journeys.map((j) => (
                    <tr key={j.id}>
                      <td>{place(j.toCity)}{j.cabin === 'premium' ? ', Business Or First' : ''}{j.by ? `, ${byWord(j)}` : ''}{j.hotel ? `, ${j.hotel.nights} ${j.hotel.nights === 1 ? 'night' : 'nights'}` : ''}{j.let ? `, ${j.let.nights} ${j.let.nights === 1 ? 'night' : 'nights'} In A Let` : ''}{j.hotel ? <Folio hotel={j.hotel} /> : null}</td>
                      <td>{formatDateTime(j.leaveAt, CITIES.require(j.fromCity).timeZone)}</td>
                      <td>{formatDateTime(j.arriveAt + (j.lateMinutes ?? 0) * 60_000, CITIES.require(j.toCity).timeZone)}</td>
                      <td className="mono">{money(j.total)}</td>
                      <td className="small">{STATUS_WORD[j.status]}{j.why ? `: ${j.why}` : j.rebooked ? ', Rebooked' : j.lateMinutes ? `, ${j.lateMinutes} Minutes Late` : ''}</td>
                      <td><div className="col gap-1" style={{ alignItems: 'flex-start' }}>{j.status === 'booked' && (
                        <Gated feature="travel.cancel" className="btn btn-sm btn-ghost" onClick={() => {
                          const a = run<{ refund: number }>('travel.cancel', { journeyId: j.id });
                          if (a.ok) toast(a.value!.refund > 0 ? `Canceled: ${money(a.value!.refund)} back.` : 'Canceled: the fares aren’t refunded.', 'positive');
                        }}>Cancel It</Gated>
                      )}{j.status === 'booked' && <RentACar j={j} />}{j.status === 'booked' && <StayInALet j={j} />}{j.status === 'booked' && <StayLonger j={j} />}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

/** A car rented at the far end of a booked journey with its way home (`systems/rentals.ts`): its price, and why not where it can't be had. */
function RentACar({ j }: { j: Journey }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const back = partnerOf(person, j);
  const has = rentalsOf(person).find((r) => r.journeyId === j.id && r.status !== 'canceled');
  const [waiver, setWaiver] = useState(false);
  const [carCls, setCarCls] = useState<RentalClass>('small');
  // Only where a rental is kept: elsewhere the button would say no to every journey.
  if (!RENTALS[j.toCity] || !back || back.leaveAt <= j.arriveAt) return null;
  if (has) return <span className="xs dim">A Car Rented</span>;
  // The damage waiver, where its price is known (from 2026-10-01): declined, a crash leaves the repair owed.
  const offered = RENTALS[j.toCity]!.waiverOffered !== undefined;
  // The class, from those the airport rents (from 2026-10-01).
  // The classes, the cheapest whole rental first (`rentalCatalog`).
  const classesHere = arrange(rentalCatalog(sim, person, j.toCity, j.arriveAt, back.leaveAt, offered && waiver)).map((e) => e.value);
  const chosen: RentalClass = classesHere.includes(carCls) ? carCls : 'small';
  const q = rentalQuote(sim, person, j.toCity, j.arriveAt, back.leaveAt, true, offered && waiver, chosen);
  const cur = saveCurrency(sim.universe);
  const no = typeof q === 'string' ? q : undefined;
  const title = typeof q === 'string' ? q : `${q.company} at ${q.airport}, ${q.days} ${q.days === 1 ? 'day' : 'days'}: ${q.lines.map((l) => `${l.label} ${formatMoney(l.amount, cur)}`).join(', ')}${q.deposit > 0 ? `; ${formatMoney(q.deposit, cur)} held on the card` : ''}`;
  return (
    <>
    {classesHere.length > 1 && (
      <select id={`rent-class-${j.id}`} className="select-sm" aria-label="Class" value={chosen} onChange={(e) => setCarCls(e.target.value as RentalClass)}>
        {classesHere.map((c) => <option key={c} value={c}>{RENTAL_CLASS_LABEL[c]}</option>)}
      </select>
    )}
    {offered && (
      <select id={`rent-waiver-${j.id}`} className="select-sm" aria-label="Damage Waiver" value={waiver ? 'taken' : 'declined'} onChange={(e) => setWaiver(e.target.value === 'taken')}>
        <option value="declined">Without The Damage Waiver</option>
        <option value="taken">With The Damage Waiver</option>
      </select>
    )}
    <Gated feature="travel.rent_car" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={title} onClick={() => {
      const a = run<{ paid: number }>('travel.rent_car', { journeyId: j.id, waiver: offered && waiver, cls: chosen });
      if (a.ok) toast(`A car rented for ${formatMoney(a.value!.paid, cur)}, prepaid.`, 'positive');
    }}>{typeof q === 'string' ? 'Rent A Car There' : `Rent A Car There, ${formatMoney(q.total, cur, { cents: false })}`}</Gated>
    </>
  );
}

/** A holiday let in place of a booked journey's hotel (`content/lets.ts`): its price, and why not where it can't be had. */
function StayInALet({ j }: { j: Journey }) {
  const { sim, run, toast } = useGame();
  if (!j.hotel || !LETS[j.toCity]) return null;
  const q = letQuote(sim, j.toCity, j.hotel.nights);
  const cur = saveCurrency(sim.universe);
  return (
    <Gated feature="travel.stay_let" className="btn btn-sm btn-ghost" disabled={typeof q === 'string'} title={typeof q === 'string' ? q : q.basis} onClick={() => {
      const a = run<{ price: number }>('travel.stay_let', { journeyId: j.id });
      if (a.ok) toast(`A holiday let instead of the hotel, ${formatMoney(a.value!.price, cur)}.`, 'positive');
    }}>{typeof q === 'string' ? 'Stay In A Holiday Let' : `Stay In A Holiday Let, ${formatMoney(q.price, cur, { cents: false })}`}</Gated>
  );
}

/** A private pilot's certificate (`systems/aviation.ts`): its training, and then By offers Fly Yourself. */
function LearnToFly() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const t = person.pilotTraining;
  const country = trainingCountry(person);
  const school = PILOT_SCHOOLS[country];
  const costs = trainingCosts(sim, country);
  const no = trainRefusal(sim, person);
  const licensed = licensedIn(person, country);
  const standing = licensed ? 'A Private Pilot' : t?.status === 'training' ? `Training, Month ${Math.min(t.monthsDone, PILOT_TRAINING.months)} Of ${PILOT_TRAINING.months}` : t?.status === 'stopped' ? 'Training Stopped' : 'Not Begun';
  return (
    <Panel title="Learning To Fly" subtitle={standing}>
      <div className="col gap-3">
        <div className="grid grid-3">
          <Stat label="A Month" value={formatMoney(costs.month, cur, { cents: false })} note={school ? 'The school’s whole cost, by the month' : `${PILOT_TRAINING.hours / PILOT_TRAINING.months} hours in a Cessna 172, and an instructor`} />
          <Stat label="The Tests" value={school ? 'In The Price' : formatMoney(costs.tests, cur, { cents: false })} note={school ? `For ${school.license.replace(/^An? /, '')}` : 'The knowledge test and the checkride'} />
          <Stat label="In All" value={formatMoney(costs.total, cur, { cents: false })} note={`Over ${PILOT_TRAINING.months} months`} />
        </div>
        {!licensed && (
          <div className="row gap-2">
            <Gated feature="pilot.train" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => { if (run('pilot.train', {}).ok) toast(t?.status === 'stopped' ? 'Training taken up again.' : 'Training begun.', 'positive'); }}>{t?.status === 'stopped' ? 'Take It Up Again' : 'Learn To Fly'}</Gated>
          </div>
        )}
        {no && !licensed ? <p className="small" style={{ margin: 0 }}>{no}</p> : null}
        <OwnPlane />
        <Fine>An FAA private pilot certificate: 60 hours in a rented Cessna 172 at the median school’s $176 an hour with fuel, AOPA’s middle of the 50 to 70 most students take; 20 with an instructor at $75; PSI’s $175 knowledge test and a typical $1,000 checkride; a third-class medical at the middle of two examiners’ $125 and $160, renewed every five years under 40 and two from 40. The six months are SLATE’s. Qualified, By offers Fly Yourself between towns in America, in a rented 172 at Textron’s 124 knots within its range less a day flight’s half-hour reserve, on a day with no fog or thunderstorm at either end. In Britain, Ireland, Canada and Mexico the license is the country’s own, at a school’s published cost over the same six months with the country’s own medical, renewed on its own terms, and a four-seater is rented after at its hourly rate, within the country.</Fine>
      </div>
    </Panel>
  );
}

/** Planes of one's own (`systems/aviation.ts`): as many as the bank allows, each kept and sold on its own; bought without a certificate, flown only with one. */
function OwnPlane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const planes = planesOf(person);
  const a = planes[0];
  const [financed, setFinanced] = useState(false);
  const no = buyAircraftRefusal(sim, person, financed);
  const hour = ownHourCost(sim, a?.at ?? person.home?.cityId ?? person.currentLocationId);
  return (
    <div className="col gap-2">
      <div className="strong small">{planes.length > 1 ? 'Your Planes' : 'A Plane Of Your Own'}</div>
      <div className="grid grid-3">
        <Stat label="A Cessna 172" value={formatMoney(Math.round(OWN_172.priceUsd * 100), 'USD', { cents: false })} note="The median asked for a used one" />
        <Stat label="An Hour Flown" value={formatMoney(hour, cur, { cents: false })} note="Its fuel, against $176 to rent one" />
        <Stat label="Kept" value={`${formatMoney(Math.round((OWN_172.tiedownDefault + OWN_172.insuranceYear / 12) * 100), 'USD', { cents: false })} A Month`} note="A tiedown and insurance; the annual, and an overhaul in time" />
      </div>
      {planes.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Plane</th><th scope="col">At</th><th scope="col" className="num">Hours</th><th scope="col">Standing</th><th scope="col">Sell</th></tr></thead>
            <tbody>
              {planes.map((p) => (
                <tr key={p.id}>
                  <td>Cessna 172</td>
                  <td>{CITIES.get(p.at)?.name ?? p.at}</td>
                  <td className="num mono">{Math.round(p.hours)}</td>
                  <td>{p.repossessed ? 'Taken By The Lender' : p.loan ? `${formatMoney(p.loan.owed, cur, { cents: false })} Owed` : 'Owned Outright'}</td>
                  <td><Gated feature="aircraft.sell" className="btn btn-sm btn-ghost" disabled={Boolean(p.repossessed)} title={p.repossessed ? 'The lender has it.' : undefined} onClick={() => { if (run('aircraft.sell', { planeId: p.id }).ok) toast('Sold.', 'positive'); }}>Sell</Gated></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(
        <div className="field-row field-row-tight">
          <div className="field">
            <label htmlFor="plane-paid">Paid</label>
            <select id="plane-paid" value={financed ? 'loan' : 'outright'} onChange={(e) => setFinanced(e.target.value === 'loan')}>
              <option value="outright">Outright</option>
              <option value="loan">{`A Loan, ${PLANE_LOAN.months} Months, ${Math.round(PLANE_LOAN.downShare * 100)}% Down`}</option>
            </select>
          </div>
        </div>
      )}
      <div className="row gap-2">
        <Gated feature="aircraft.buy" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { if (run('aircraft.buy', { financed }).ok) toast(person.pilot ? 'A 172 of your own.' : 'A 172 of your own: flying it asks a pilot certificate.', 'positive'); }}>{planes.length ? 'Buy Another Plane' : 'Buy A Plane'}</Gated>
      </div>
      {a && !person.pilot ? <p className="small" style={{ margin: 0 }}>Owning it asks no certificate; flying it yourself does. Until you’re a pilot, By offers it flown by a hired commercial pilot, at $450 a half day and $900 a full one.</p> : null}
    </div>
  );
}

/** How a journey not by airline goes. Until 2026-09-30 every one of them read By Train, a drive and a flight of one's own too. */
function byWord(j: Journey): string {
  if (j.by?.startsWith('car:')) return 'By Car';
  if (j.by === 'rental') return 'By Rental Car';
  if (j.by === 'jet') return 'By Chartered Jet';
  if (j.by === 'chauffeur') return 'By Car And Driver';
  if (j.by === 'fly') return 'By Plane Of Your Own';
  return `By ${railRouteById(j.by)?.service ?? 'Train'}`;
}

/** Staying longer (`travel.extend`): the way home, booked, moved some days on at the same hour, with the stay and any rental car carried to it. */
function StayLonger({ j }: { j: Journey }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const [days, setDays] = useState(2);
  // Only a way home, from where they are now.
  const out = partnerOf(person, j);
  if (!out || person.currentLocationId !== j.fromCity || out.leaveAt > j.leaveAt) return null;
  const q = extendQuote(sim, person, j.id, j.leaveAt + days * MS_DAY, slotOf(j));
  const cur = saveCurrency(sim.universe);
  return (
    <div className="row gap-1" style={{ alignItems: 'center' }}>
      <label className="sr-only" htmlFor={`longer-${j.id}`}>Days Longer</label>
      <select id={`longer-${j.id}`} value={days} onChange={(e) => setDays(Number(e.target.value))}>
        {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'Day' : 'Days'}</option>)}
      </select>
      <Gated feature="travel.extend" className="btn btn-sm btn-ghost" disabled={typeof q === 'string'} title={typeof q === 'string' ? q : undefined} onClick={() => {
        if (run('travel.extend', { journeyId: j.id, day: j.leaveAt + days * MS_DAY, slot: slotOf(j) }).ok) toast(`Staying ${days} ${days === 1 ? 'day' : 'days'} longer.`, 'positive');
      }}>{typeof q === 'string' ? 'Stay Longer' : `Stay Longer (${formatMoney(q.total, cur, { cents: false })})`}</Gated>
    </div>
  );
}

/** A hotel stay's folio: the room and its taxes, parking, and the deposit held and returned. */
function Folio({ hotel }: { hotel: NonNullable<Journey['hotel']> }) {
  const { sim } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const named = hotel.named ? hotelById(hotel.named.hotelId) : undefined;
  const lines = [
    `${named ? `${named.name}, ${hotel.named!.room}` : 'The Room'}, ${money(hotel.price - (hotel.parking ?? 0))}`,
    ...(hotel.parking ? [`Parking, ${money(hotel.parking)}`] : []),
    ...(hotel.deposit ? [`Deposit Held, ${money(hotel.deposit)}`] : []),
    ...(hotel.returned ? [`Deposit Returned, ${money(hotel.returned)}`] : []),
    ...(named?.checkOut ? [`Check-Out ${named.checkOut}`] : []),
  ];
  return <div className="xs dim">{lines.join(' · ')}</div>;
}
