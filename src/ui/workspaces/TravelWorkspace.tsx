/**
 * SLATE — Travel: where you are, a journey by air or, where one runs, by
 * train (from 2026-09-29), booked with its legs and a hotel at the far end,
 * and the journeys booked and taken (`systems/journey.ts`, `systems/rail.ts`,
 * `systems/stays.ts`). Every leg's time is the local
 * time where it happens, and every figure names whose it is.
 */

import { RENTALS } from '@/engine/content/rentals';
import { LETS } from '@/engine/content/lets';
import { Fragment, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { MS_DAY, formatDateTime, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { STAYS } from '@/engine/content/stays';
import { AIR } from '@/engine/content/air';
import { asRoundTrip, bookRefusal, journeysOf, letQuote, nightsBetween, partnerOf, planBy, whereBy, type Journey, type JourneyLeg } from '@/engine/systems/journey';
import { rentalAt, rentalQuote, rentalsOf } from '@/engine/systems/rentals';
import { OWN_172, PILOT_TRAINING, buyAircraftRefusal, ownHourCost, trainRefusal, trainingCosts } from '@/engine/systems/aviation';
import { departureHours, railRouteById, railRoutes } from '@/engine/systems/rail';
import { ownPlaceIn, stayPrice } from '@/engine/systems/stays';
import { hoursOut } from '@/engine/systems/jetlag';
import { modelById, vehiclesOf } from '@/engine/systems/vehicles';
import { byRoad } from '@/engine/systems/driving';
import { airportByCode } from '@/engine/systems/airports';

const STATUS_WORD: Record<Journey['status'], string> = { booked: 'Booked', underway: 'Underway', arrived: 'Arrived', missed: 'Missed', canceled: 'Canceled' };
const MODE_WORD: Record<JourneyLeg['mode'], string> = { ground: 'To Or From The Airport', 'check-in': 'Check-In', flight: 'Flight', fly: 'Flown Yourself', train: 'Train', bus: 'Coach', drive: 'Drive', arrival: 'Off The Aircraft' };
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
  const [daysThere, setDaysThere] = useState(4);
  const toCity = to || destinations[0] || '';
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
  const flies = Boolean(person.pilot) && by === 'fly';
  const mode = route ? route.id : car ? `car:${car.id}` : rented && by === 'rental' ? 'rental' : flies ? 'fly' : undefined;
  const slots = route ? departureHours(route).map((h, i) => ({ i, word: clock(h) })) : car || mode === 'rental' ? Array.from({ length: 15 }, (_, i) => ({ i, word: clock(7 + i) })) : AIR.departureHours.map((h, i) => ({ i, word: `${SLOT_WORD[i]}, ${clock(h)}` }));
  const pick = Math.min(slot, slots.length - 1);
  const own = toCity ? ownPlaceIn(person, toCity) : false;
  const round = daysThere > 0;
  const seat = mode ? 'economy' : cabin;
  const outLegs = toCity ? planBy(sim, mode, fromCity, toCity, day, pick, bags, seat) : 'Choose where.';
  const backLegs = toCity && round ? planBy(sim, mode, toCity, fromCity, day + daysThere * MS_DAY, pick, bags, seat) : undefined;
  // A round trip's discount is the airlines'; a train's return is two singles.
  const outPlan = typeof outLegs === 'string' ? undefined : round && !mode ? asRoundTrip(outLegs) : outLegs;
  const backPlan = backLegs && typeof backLegs !== 'string' ? (mode ? backLegs : asRoundTrip(backLegs)) : undefined;
  // A round trip's hotel runs from the night it lands to the morning it flies home.
  const stayNights = own ? 0 : round && outPlan && backPlan ? nightsBetween(toCity, outPlan[outPlan.length - 1]!.arriveAt, backPlan[0]!.departAt) : nights;
  const no = !toCity ? 'Choose where.' : bookRefusal(sim, person, toCity, outLegs, Math.max(1, stayNights), stayNights)
    ?? (typeof backLegs === 'string' ? backLegs : backPlan && outPlan && backPlan[0]!.departAt <= outPlan[outPlan.length - 1]!.arriveAt ? 'The way home leaves before the way out arrives.' : undefined);
  const hotel = toCity && !own && stayNights > 0 ? stayPrice(sim, toCity, stayNights) : undefined;
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
                  {person.pilot && <option value="fly">Fly Yourself</option>}
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
                <label htmlFor="travel-nights">Hotel Nights</label>
                <input id="travel-nights" type="number" min={0} max={90} value={stayNights} disabled={own || round} onChange={(e) => setNights(Math.max(0, Math.min(90, Number(e.target.value) || 0)))} />
              </div>
            </div>
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
                            <td>{(mode && RAIL_WORD[l.mode]) || MODE_WORD[l.mode]}</td>
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
              <Stat label="Hotel" value={own ? 'Your Own Place' : hotel ? money(hotel.price) : '—'} note={own ? 'No hotel needed' : `${stayNights} ${stayNights === 1 ? 'night' : 'nights'}, taxes in`} />
              <Stat label="In All" value={plan ? money(fares + (hotel?.price ?? 0)) : '—'} />
            </div>
            {no ? <p className="small" style={{ margin: 0 }}>{no}</p> : null}
            <div className="row gap-2">
              <Gated feature="travel.book" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => {
                const a = run<{ journeyId: string; leaveAt: number; total: number }>('travel.book', { toCity, day, slot: pick, bags: mode ? 0 : bags, ...(mode ? { by: mode } : { cabin: seat }), ...(round ? { returnDay: day + daysThere * MS_DAY, returnSlot: pick } : { nights: own ? 0 : nights }) });
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
                      <td>{place(j.toCity)}{j.cabin === 'premium' ? ', Business Or First' : ''}{j.by ? `, By ${railRouteById(j.by)?.service ?? 'Train'}` : ''}{j.hotel ? `, ${j.hotel.nights} ${j.hotel.nights === 1 ? 'night' : 'nights'}` : ''}{j.let ? `, ${j.let.nights} ${j.let.nights === 1 ? 'night' : 'nights'} In A Let` : ''}</td>
                      <td>{formatDateTime(j.leaveAt, CITIES.require(j.fromCity).timeZone)}</td>
                      <td>{formatDateTime(j.arriveAt + (j.lateMinutes ?? 0) * 60_000, CITIES.require(j.toCity).timeZone)}</td>
                      <td className="mono">{money(j.total)}</td>
                      <td className="small">{STATUS_WORD[j.status]}{j.why ? `: ${j.why}` : j.rebooked ? ', Rebooked' : j.lateMinutes ? `, ${j.lateMinutes} Minutes Late` : ''}</td>
                      <td><div className="col gap-1" style={{ alignItems: 'flex-start' }}>{j.status === 'booked' && (
                        <Gated feature="travel.cancel" className="btn btn-sm btn-ghost" onClick={() => {
                          const a = run<{ refund: number }>('travel.cancel', { journeyId: j.id });
                          if (a.ok) toast(a.value!.refund > 0 ? `Canceled: ${money(a.value!.refund)} back.` : 'Canceled: the fares aren’t refunded.', 'positive');
                        }}>Cancel It</Gated>
                      )}{j.status === 'booked' && <RentACar j={j} />}{j.status === 'booked' && <StayInALet j={j} />}</div></td>
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
  // Only where a rental is kept: elsewhere the button would say no to every journey.
  if (!RENTALS[j.toCity] || !back || back.leaveAt <= j.arriveAt) return null;
  if (has) return <span className="xs dim">A Car Rented</span>;
  const q = rentalQuote(sim, person, j.toCity, j.arriveAt, back.leaveAt, true);
  const cur = saveCurrency(sim.universe);
  const no = typeof q === 'string' ? q : undefined;
  const title = typeof q === 'string' ? q : `${q.company} at ${q.airport}, ${q.days} ${q.days === 1 ? 'day' : 'days'}: ${q.lines.map((l) => `${l.label} ${formatMoney(l.amount, cur)}`).join(', ')}${q.deposit > 0 ? `; ${formatMoney(q.deposit, cur)} held on the card` : ''}`;
  return (
    <Gated feature="travel.rent_car" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={title} onClick={() => {
      const a = run<{ paid: number }>('travel.rent_car', { journeyId: j.id });
      if (a.ok) toast(`A car rented for ${formatMoney(a.value!.paid, cur)}, prepaid.`, 'positive');
    }}>{typeof q === 'string' ? 'Rent A Car There' : `Rent A Car There, ${formatMoney(q.total, cur, { cents: false })}`}</Gated>
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
  const costs = trainingCosts(sim);
  const no = trainRefusal(sim, person);
  const standing = person.pilot ? 'A Private Pilot' : t?.status === 'training' ? `Training, Month ${Math.min(t.monthsDone, PILOT_TRAINING.months)} Of ${PILOT_TRAINING.months}` : t?.status === 'stopped' ? 'Training Stopped' : 'Not Begun';
  return (
    <Panel title="Learning To Fly" subtitle={standing}>
      <div className="col gap-3">
        <div className="grid grid-3">
          <Stat label="A Month" value={formatMoney(costs.month, cur, { cents: false })} note={`${PILOT_TRAINING.hours / PILOT_TRAINING.months} hours in a Cessna 172, and an instructor`} />
          <Stat label="The Tests" value={formatMoney(costs.tests, cur, { cents: false })} note="The knowledge test and the checkride" />
          <Stat label="In All" value={formatMoney(costs.total, cur, { cents: false })} note={`Over ${PILOT_TRAINING.months} months`} />
        </div>
        {!person.pilot && (
          <div className="row gap-2">
            <Gated feature="pilot.train" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => { if (run('pilot.train', {}).ok) toast(t?.status === 'stopped' ? 'Training taken up again.' : 'Training begun.', 'positive'); }}>{t?.status === 'stopped' ? 'Take It Up Again' : 'Learn To Fly'}</Gated>
          </div>
        )}
        {no && !person.pilot ? <p className="small" style={{ margin: 0 }}>{no}</p> : null}
        <OwnPlane />
        <Fine>An FAA private pilot certificate: 60 hours in a rented Cessna 172 at the median school’s $176 an hour with fuel, AOPA’s middle of the 50 to 70 most students take; 20 with an instructor at $75; PSI’s $175 knowledge test and a typical $1,000 checkride. The six months are SLATE’s. Qualified, By offers Fly Yourself between towns in America, in a rented 172 at Textron’s 124 knots within its range less a day flight’s half-hour reserve.</Fine>
      </div>
    </Panel>
  );
}

/** A plane of one's own (`systems/aviation.ts`): bought without a certificate, flown only with one. */
function OwnPlane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const a = person.aircraft && person.aircraft.soldAt === undefined ? person.aircraft : undefined;
  const no = buyAircraftRefusal(sim, person);
  const hour = ownHourCost(sim, a?.at ?? person.home?.cityId ?? person.currentLocationId);
  return (
    <div className="col gap-2">
      <div className="strong small">A Plane Of Your Own</div>
      <div className="grid grid-3">
        <Stat label="A Cessna 172" value={a ? `${Math.round(a.hours)} Hours Flown` : formatMoney(Math.round(OWN_172.priceUsd * 100), 'USD', { cents: false })} note={a ? `At ${CITIES.get(a.at)?.name ?? a.at}` : 'The median asked for a used one'} />
        <Stat label="An Hour Flown" value={formatMoney(hour, cur, { cents: false })} note="Its fuel, against $176 to rent one" />
        <Stat label="Kept" value={`${formatMoney(Math.round((OWN_172.tiedownDefault + OWN_172.insuranceYear / 12) * 100), 'USD', { cents: false })} A Month`} note="A tiedown and insurance; the annual, and an overhaul in time" />
      </div>
      <div className="row gap-2">
        {a
          ? <Gated feature="aircraft.sell" className="btn btn-sm btn-ghost" onClick={() => { if (run('aircraft.sell', {}).ok) toast('Sold.', 'positive'); }}>Sell The Plane</Gated>
          : <Gated feature="aircraft.buy" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { if (run('aircraft.buy', {}).ok) toast(person.pilot ? 'A 172 of your own.' : 'A 172 of your own: flying it asks a pilot certificate.', 'positive'); }}>Buy A Plane</Gated>}
      </div>
      {a && !person.pilot ? <p className="small" style={{ margin: 0 }}>Owning it asks no certificate; flying it does. Until you’re a pilot it sits, and its keeping is paid.</p> : null}
    </div>
  );
}
