import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Empty, Tabs } from '@/ui/components/primitives';
import { searchFlights, privateAircraftOptions, estimateFlightMinutes } from '@/engine/systems/travel';
import { CITIES, cityDistanceKm } from '@/engine/content/geography';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDate, formatTime, addDays, formatDuration, MS_MINUTE } from '@/engine/core/time';

type Tab = 'flights' | 'private' | 'hotels' | 'bookings';

export function TravelWorkspace() {
  const { sim, run } = useGame();
  const [tab, setTab] = useState<Tab>('flights');
  const [destination, setDestination] = useState('us-ny-newyork');
  const [daysOut, setDaysOut] = useState(14);
  const [cabin, setCabin] = useState<'economy' | 'premium_economy' | 'business' | 'first'>('economy');

  const player = useWorld((s) => s.player);
  const departAt = addDays(sim.now, daysOut, sim.homeZone);
  const flights = useWorld((s) => (destination !== s.player.currentLocationId ? searchFlights(s, s.player.currentLocationId, destination, departAt) : []));
  const aircraft = privateAircraftOptions(player.currentLocationId, destination);
  const bookings = useWorld((s) => Object.values(s.universe.flightBookings).sort((a, b) => b.bookedAt - a.bookedAt));
  const stays = useWorld((s) => Object.values(s.universe.hotelBookings).sort((a, b) => b.bookedAt - a.bookedAt));

  const here = CITIES.get(player.currentLocationId);
  const there = CITIES.get(destination);

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Travel</div>
        <h1>You are in {here?.name}.</h1>
        <p className="muted">
          Where you are decides what you can attend. Flying changes your local time, and crossing zones
          costs you for days afterwards.
        </p>
      </div>

      <Panel title="Route">
        <div className="field-row">
          <div className="field">
            <label htmlFor="destination">Going to</label>
            <select id="destination" value={destination} onChange={(e) => setDestination(e.target.value)}>
              {CITIES.all().filter((c) => c.id !== player.currentLocationId).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="days">Days from now</label>
            <input id="days" type="number" min={0} max={365} value={daysOut} onChange={(e) => setDaysOut(Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="cabin">Cabin</label>
            <select id="cabin" value={cabin} onChange={(e) => setCabin(e.target.value as typeof cabin)}>
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>
        </div>
        {there && (
          <div className="grid grid-4">
            <Stat label="Distance" value={`${Math.round(cityDistanceKm(player.currentLocationId, destination)).toLocaleString('en-US')} km`} />
            <Stat label="Flight time" value={formatDuration(estimateFlightMinutes(player.currentLocationId, destination) * MS_MINUTE)} />
            <Stat label="Local time there" value={formatTime(sim.now, there.timeZone)} />
            <Stat label="Cost of living" value={there.costOfLivingIndex} />
          </div>
        )}
      </Panel>

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'flights', label: 'Commercial' },
        { id: 'private', label: 'Private' },
        { id: 'hotels', label: 'Hotels' },
        { id: 'bookings', label: 'Booked', badge: bookings.filter((b) => b.status === 'booked').length },
      ]} />

      {tab === 'flights' && (
        <Panel title="Flights" subtitle="Fares rise sharply as departure approaches." flush>
          {flights.length === 0 ? (
            <Empty title="No route" body="Pick a different destination." />
          ) : (
            <div className="list">
              {flights.map((flight) => (
                <div key={flight.flightNumber} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{flight.airlineName} {flight.flightNumber}</div>
                    <div className="xs dim">
                      {flight.fromAirport} → {flight.toAirport} ·{' '}
                      {formatTime(flight.departAt, sim.zone)} · {formatDuration(flight.durationMinutes * MS_MINUTE)}
                      {flight.stops > 0 ? ` · ${flight.stops} stop` : ' · nonstop'}
                    </div>
                  </div>
                  <span className="mono small">{formatMoney(flight.fares[cabin], { cents: false })}</span>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => run('travel.book_flight', {
                      toCityId: destination, departAt: flight.departAt, cabin, airlineCode: flight.airlineCode,
                    })}
                  >
                    Book
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === 'private' && (
        <Panel title="Private charter" subtitle="Range and runway length are real constraints, not price tiers." flush>
          <div className="list">
            {aircraft.map((option) => (
              <div key={option.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{option.name}</div>
                  <div className="xs dim">
                    {option.seats} seats · {option.rangeKm.toLocaleString('en-US')} km range · needs {option.runwayFeet.toLocaleString('en-US')} ft
                  </div>
                  {!option.available && <div className="xs negative">{option.reason}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono small">{formatMoneyCompact(option.estimatedCost)}</div>
                  <div className="xs dim">{option.estimatedHours}h</div>
                </div>
                <button
                  className="btn btn-sm"
                  disabled={!option.available}
                  onClick={() => run('travel.charter_private', { toCityId: destination, departAt, aircraftId: option.id })}
                >
                  Charter
                </button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'hotels' && (
        <Panel title="Hotels" subtitle={`In ${there?.name}`} flush>
          <div className="list">
            {(['standard', 'deluxe', 'suite', 'penthouse'] as const).map((roomClass) => (
              <div key={roomClass} className="list-item list-static">
                <div className="grow">
                  <div className="small strong" style={{ textTransform: 'capitalize' }}>{roomClass}</div>
                  <div className="xs dim">
                    {roomClass === 'standard' && 'Somewhere to sleep.'}
                    {roomClass === 'deluxe' && 'Better room, better sleep.'}
                    {roomClass === 'suite' && 'Space to work and to have people over.'}
                    {roomClass === 'penthouse' && 'The kind of room people mention afterwards.'}
                  </div>
                </div>
                {[3, 7].map((nights) => (
                  <button
                    key={nights}
                    className="btn btn-sm"
                    onClick={() => run('travel.book_hotel', { cityId: destination, checkInAt: departAt, nights, roomClass })}
                  >
                    {nights} nights
                  </button>
                ))}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'bookings' && (
        <>
          <Panel title="Flights" flush>
            {bookings.length === 0 ? <Empty title="Nothing booked" body="Book a flight and it appears on your calendar." /> : (
              <div className="list">
                {bookings.map((booking) => (
                  <div key={booking.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{booking.airlineName} {booking.flightNumber}</div>
                      <div className="xs dim">
                        {booking.fromAirport} → {booking.toAirport} · {formatDate(booking.departAt, sim.homeZone)} at {formatTime(booking.departAt, sim.homeZone)} · {booking.cabin.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <span className="mono small">{formatMoney(booking.fare + booking.taxesFees, { cents: false })}</span>
                    <span className="chip">{booking.status.replace(/_/g, ' ')}</span>
                    {booking.status === 'booked' && (
                      <button className="btn btn-sm" onClick={() => run('travel.cancel_flight', { bookingId: booking.id })}>Cancel</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Stays" flush>
            {stays.length === 0 ? <Empty title="No hotels booked" body="" /> : (
              <div className="list">
                {stays.map((stay) => (
                  <div key={stay.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{stay.hotelName}</div>
                      <div className="xs dim">
                        {formatDate(stay.checkInAt, sim.homeZone)} — {formatDate(stay.checkOutAt, sim.homeZone)} · {stay.nights} nights · {stay.roomClass}
                      </div>
                    </div>
                    <span className="mono small">{formatMoney(stay.total, { cents: false })}</span>
                    <span className="chip">{stay.status.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </>
  );
}
