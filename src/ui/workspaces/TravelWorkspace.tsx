/**
 * SLATE — Travel: where you are, a journey by air booked with its legs and
 * a hotel at the far end, and the journeys booked and taken
 * (`systems/journey.ts`, `systems/stays.ts`). Every leg's time is the local
 * time where it happens, and every figure names whose it is.
 */

import { Fragment, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { MS_DAY, formatDateTime, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { STAYS } from '@/engine/content/stays';
import { AIR } from '@/engine/content/air';
import { asRoundTrip, bookRefusal, journeysOf, nightsBetween, planJourney, whereBy, type Journey, type JourneyLeg } from '@/engine/systems/journey';
import { ownPlaceIn, stayPrice } from '@/engine/systems/stays';
import { airportByCode } from '@/engine/systems/airports';

const STATUS_WORD: Record<Journey['status'], string> = { booked: 'Booked', underway: 'Underway', arrived: 'Arrived', missed: 'Missed', canceled: 'Canceled' };
const MODE_WORD: Record<JourneyLeg['mode'], string> = { ground: 'To Or From The Airport', 'check-in': 'Check-In', flight: 'Flight', arrival: 'Off The Aircraft' };
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
  const [bags, setBags] = useState(0);
  const [nights, setNights] = useState(3);
  const [daysThere, setDaysThere] = useState(4);
  const toCity = to || destinations[0] || '';
  const p = zonedParts(sim.now + days * MS_DAY, sim.zone);
  const day = instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone);
  const fromCity = whereBy(person, day);
  const own = toCity ? ownPlaceIn(person, toCity) : false;
  const round = daysThere > 0;
  const outLegs = toCity ? planJourney(sim, fromCity, toCity, day, slot, bags) : 'Choose where.';
  const backLegs = toCity && round ? planJourney(sim, toCity, fromCity, day + daysThere * MS_DAY, slot, bags) : undefined;
  const outPlan = typeof outLegs === 'string' ? undefined : round ? asRoundTrip(outLegs) : outLegs;
  const backPlan = backLegs && typeof backLegs !== 'string' ? asRoundTrip(backLegs) : undefined;
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
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Day</div>
        <h1>Travel</h1>
        <p className="muted">A journey by air, somewhere to stay at the far end, and the way home.</p>
      </div>
      <div className="col gap-5">
        <Panel title="Where You Are">
          <div className="grid grid-3">
            <Stat label="Town" value={here?.name ?? person.currentLocationId} note={sim.zone} />
            <Stat label="Sleeping" value={person.home?.cityId === person.currentLocationId ? 'At Home' : stay?.kind === 'hotel' ? 'A Hotel' : stay?.kind === 'own' ? 'Your Own Place' : stay?.kind === 'sofa' ? 'A Friend’s Sofa' : 'Away'} />
            <Stat label="Journeys Booked" value={String(journeys.filter((j) => j.status === 'booked').length)} />
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
                <label htmlFor="travel-slot">Departure</label>
                <select id="travel-slot" value={slot} onChange={(e) => setSlot(Number(e.target.value))}>
                  {AIR.departureHours.map((h, i) => <option key={h} value={i}>{SLOT_WORD[i]}, {h % 12 === 0 ? 12 : h % 12}:00 {h < 12 ? 'AM' : 'PM'}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="travel-bags">Checked Bags</label>
                <select id="travel-bags" value={bags} onChange={(e) => setBags(Number(e.target.value))}>
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
                            <td>{MODE_WORD[l.mode]}</td>
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
                const a = run<{ journeyId: string; leaveAt: number; total: number }>('travel.book', round ? { toCity, day, slot, bags, returnDay: day + daysThere * MS_DAY, returnSlot: slot } : { toCity, day, slot, bags, nights: own ? 0 : nights });
                if (a.ok) toast(`Booked, for ${money(a.value!.total)}: you leave ${formatDateTime(a.value!.leaveAt, sim.zone)}.`, 'positive');
              }}>Book It</Gated>
            </div>
            <Fine>
              {plan ? plan.map((l) => l.basis).filter((b, i, all) => all.indexOf(b) === i).join(' ') : ''} {hotel?.basis ?? ''} Booked a week or more ahead, the whole booking is refunded if it’s canceled within a day, the DOT’s rule; after that the fares aren’t, and the hotel is until a day before you arrive. Late and canceled flights come at BTS’s rates for 2025.
            </Fine>
          </div>
        </Panel>

        <Panel title="Your Journeys">
          {!journeys.length ? <p className="small muted" style={{ margin: 0 }}>None yet.</p> : (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">To</th><th scope="col">Leave</th><th scope="col">Arrive</th><th scope="col">Paid</th><th scope="col">Standing</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
                <tbody>
                  {journeys.map((j) => (
                    <tr key={j.id}>
                      <td>{place(j.toCity)}{j.hotel ? `, ${j.hotel.nights} ${j.hotel.nights === 1 ? 'night' : 'nights'}` : ''}</td>
                      <td>{formatDateTime(j.leaveAt, CITIES.require(j.fromCity).timeZone)}</td>
                      <td>{formatDateTime(j.arriveAt + (j.lateMinutes ?? 0) * 60_000, CITIES.require(j.toCity).timeZone)}</td>
                      <td className="mono">{money(j.total)}</td>
                      <td className="small">{STATUS_WORD[j.status]}{j.why ? `: ${j.why}` : j.rebooked ? ', Rebooked' : j.lateMinutes ? `, ${j.lateMinutes} Minutes Late` : ''}</td>
                      <td>{j.status === 'booked' && (
                        <Gated feature="travel.cancel" className="btn btn-sm btn-ghost" onClick={() => {
                          const a = run<{ refund: number }>('travel.cancel', { journeyId: j.id });
                          if (a.ok) toast(a.value!.refund > 0 ? `Canceled: ${money(a.value!.refund)} back.` : 'Canceled: the fares aren’t refunded.', 'positive');
                        }}>Cancel It</Gated>
                      )}</td>
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
