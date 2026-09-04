import { titleCaseLabel } from '@/engine/core/text';
import { useEffect, useMemo, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Empty, Tabs, Modal } from '@/ui/components/primitives';
import { MAX_DRIVE_KM, drivingOptions, formatDistance, roadKm, vehicleLocation } from '@/engine/systems/driving';
import { formatPeople, homeCityOf, placeKindLabel, upcomingShoots } from '@/engine/world/place';
import { missedBy } from '@/engine/world/calendar';
import type { CalendarEntry } from '@/engine/world/calendar';
import { weatherAt } from '@/engine/systems/weather';
import { searchFlights, privateAircraftOptions, estimateFlightMinutes } from '@/engine/systems/travel';
import { CITIES, cityDistanceKm, isCountryLoaded, loadCountryCities } from '@/engine/content/geography';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDate, formatTime, addDays, formatDuration, MS_MINUTE } from '@/engine/core/time';

type Tab = 'flights' | 'private' | 'hotels' | 'bookings';

export function TravelWorkspace() {
  const { sim, run, advanceTo, navigate } = useGame();
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

  // --- Driving --------------------------------------------------------------
  const cars = useWorld((s) => Object.values(s.universe.vehicles).filter((v) => v.ownerId === s.player.id && v.ownerKind === 'person'));
  const carsHere = cars.filter((v) => vehicleLocation(sim, v) === player.currentLocationId);
  const [carId, setCarId] = useState(carsHere[0]?.id ?? '');
  const car = carsHere.find((v) => v.id === carId) ?? carsHere[0];
  const [loadedTick, setLoadedTick] = useState(0);
  const [driveConfirm, setDriveConfirm] = useState<{ toCityId: string; label: string; arriveAt: number; missed: CalendarEntry[] } | null>(null);
  const [driveSearch, setDriveSearch] = useState('');

  // The real neighbourhood: pull in every town in the country you stand in.
  useEffect(() => {
    const countryId = here?.countryId;
    if (!countryId || isCountryLoaded(countryId)) return;
    let cancelled = false;
    loadCountryCities(countryId).then(() => { if (!cancelled) setLoadedTick((n) => n + 1); }).catch(() => {});
    return () => { cancelled = true; };
  }, [here?.countryId]);

  const drives = useMemo(() => {
    void loadedTick;
    return here ? drivingOptions(sim, here.id, car, { query: driveSearch }) : [];
  }, [sim, here, car, loadedTick, driveSearch]);

  const home = homeCityOf(sim);
  const homeInRange = !!home && !!here && home.id !== here.id && roadKm(here, home) <= MAX_DRIVE_KM;
  const shoots = useWorld((s) => upcomingShoots(s));

  const startDrive = (toCityId: string, label: string) => {
    if (!car) return;
    const result = run<{ arriveAt: number }>(
      'travel.drive',
      { vehicleId: car.id, toCityId },
      { idempotencyKey: `travel.drive:${car.id}:${toCityId}:${sim.now}` },
    );
    if (!result.ok || !result.value) return;
    const missed = missedBy(sim, result.value.arriveAt);
    if (missed.length > 0) setDriveConfirm({ toCityId, label, arriveAt: result.value.arriveAt, missed });
    else advanceTo(result.value.arriveAt);
  };

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

      <Panel
        title="Drive"
        subtitle={car ? `Your ${car.year} ${car.make} ${car.model} is here. Fifty real places within a day's drive, or search for any place in range.` : undefined}
        actions={carsHere.length > 1 ? (
          <select value={car?.id ?? ''} onChange={(e) => setCarId(e.target.value)} aria-label="Which Car">
            {carsHere.map((v) => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
          </select>
        ) : undefined}
      >
        {cars.length === 0 && (
          <Empty
            title="No Car"
            body="You cannot drive anywhere without one. Flights still go where flights go."
            action={<button className="btn btn-sm" onClick={() => navigate('/workspace/vehicles', 'Vehicles')}>Find A Car</button>}
          />
        )}
        {cars.length > 0 && carsHere.length === 0 && (
          <Empty
            title="Your Car Is Not Here"
            body={`${cars.map((v) => `${v.year} ${v.make} ${v.model} is in ${CITIES.get(vehicleLocation(sim, v) ?? '')?.name ?? 'another city'}`).join('. ')}. A car stays where it was driven.`}
          />
        )}
        {car && (
          <>
            <div className="row wrap gap-2" style={{ marginBottom: 'var(--s3)' }}>
              <input
                type="search"
                placeholder="Find any place within a day's drive"
                value={driveSearch}
                onChange={(e) => setDriveSearch(e.target.value)}
                aria-label="Find A Place To Drive To"
                style={{ flex: '1 1 12rem' }}
              />
              {homeInRange && home && (
                <button className="btn btn-sm btn-primary" onClick={() => startDrive(home.id, home.name)}>Drive Home</button>
              )}
            </div>
            <div className="list" style={{ maxHeight: 420, overflowY: 'auto' }}>
              {drives.length === 0 && <p className="hint" style={{ padding: 'var(--s3)' }}>Nothing within a day's drive matches.</p>}
              {drives.map((d) => {
                const sky = weatherAt(sim, d.city.id);
                return (
                  <div key={d.city.id} className="list-item">
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="small strong truncate">
                        {d.city.name}{d.city.id === home?.id ? ' · Home' : ''}
                        {placeKindLabel(d.city) && <span className="dim"> · {placeKindLabel(d.city)}</span>}
                      </div>
                      <div className="xs muted truncate">
                        {d.city.population > 0 && `${formatPeople(d.city.population)} people · `}
                        {formatDistance(d, here?.countryId ?? 'us')} · {formatDuration(d.minutes * MS_MINUTE)}
                        {d.fuelCents > 0 && ` · fuel ${formatMoney(d.fuelCents)}`}
                        {d.crossesZone && ' · crosses a time zone'}
                        {sky && ` · ${sky.icon} ${sky.temperature}${sky.fahrenheit ? '°F' : '°C'}`}
                      </div>
                    </div>
                    <button className="btn btn-sm" onClick={() => startDrive(d.city.id, d.city.name)}>Drive There</button>
                  </div>
                );
              })}
            </div>
            <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>
              Fuel prices and consumption are SLATE's estimates. A drive takes the time it takes; anything on your calendar on the way is asked about first.
            </p>
          </>
        )}
      </Panel>

      <Panel title="Where Things Are Shooting" subtitle="Projects you are on. Nobody sends you a memo about anyone else's.">
        {shoots.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>Nothing you are part of has a shoot day scheduled.</p>
        ) : (
          <div className="list">
            {shoots.slice(0, 8).map((shoot) => {
              const drivable = !!car && !!here && roadKm(here, shoot.city) <= MAX_DRIVE_KM;
              const isHere = shoot.city.id === player.currentLocationId;
              return (
                <div key={`${shoot.projectId}:${shoot.city.id}`} className="list-item">
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="small strong truncate">{shoot.title} · {shoot.city.name}{shoot.isStage ? ' (Stage)' : ''}</div>
                    <div className="xs muted truncate">
                      {shoot.days} day{shoot.days === 1 ? '' : 's'} from {formatDate(shoot.firstDay, sim.zone)}
                      {isHere ? ' · You are here' : ` · ${formatDistance({ km: cityDistanceKm(player.currentLocationId, shoot.city.id), miles: Math.round(cityDistanceKm(player.currentLocationId, shoot.city.id) * 0.621371) }, here?.countryId ?? 'us')} away`}
                    </div>
                  </div>
                  {!isHere && drivable && car && (
                    <button className="btn btn-sm" onClick={() => startDrive(shoot.city.id, shoot.city.name)}>Drive There</button>
                  )}
                  {!isHere && !drivable && (
                    <button className="btn btn-sm" onClick={() => { setDestination(shoot.city.id); setTab('flights'); }}>Fly There</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {driveConfirm && (
        <Modal
          title="You Would Miss Something On The Way"
          onClose={() => setDriveConfirm(null)}
          footer={
            <>
              <button className="btn" onClick={() => setDriveConfirm(null)}>Stay On The Clock</button>
              <button className="btn btn-primary" onClick={() => { advanceTo(driveConfirm.arriveAt); setDriveConfirm(null); }}>
                Drive Anyway
              </button>
            </>
          }
        >
          <p className="small muted">
            The drive to <strong>{driveConfirm.label}</strong> is under way and arrives at {formatTime(driveConfirm.arriveAt, sim.zone)}.
            Letting the clock run to arrival passes {driveConfirm.missed.length} commitment{driveConfirm.missed.length === 1 ? '' : 's'}.
            Staying on the clock keeps you on the road at live speed; the arrival happens when it happens.
          </p>
          <ul className="small" style={{ margin: 'var(--s2) 0 0', paddingLeft: 'var(--s4)' }}>
            {driveConfirm.missed.slice(0, 8).map((entry) => <li key={entry.id}>{entry.title} — {formatTime(entry.at, sim.zone)}</li>)}
          </ul>
        </Modal>
      )}

      <Panel title="Route">
        <div className="field-row">
          <div className="field">
            <label htmlFor="destination">Going To</label>
            <select id="destination" value={destination} onChange={(e) => setDestination(e.target.value)}>
              {CITIES.all().filter((c) => c.id !== player.currentLocationId).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="days">Days From Now</label>
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
            <Stat label="Flight Time" value={formatDuration(estimateFlightMinutes(player.currentLocationId, destination) * MS_MINUTE)} />
            <Stat label="Local Time There" value={formatTime(sim.now, there.timeZone)} />
            <Stat label="Cost Of Living" value={there.costOfLivingIndex} />
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
            <Empty title="No Route" body="Pick a different destination." />
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
        <Panel title="Private Charter" subtitle="Range and runway length are real constraints, not price tiers." flush>
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
            {bookings.length === 0 ? <Empty title="Nothing Booked" body="Book a flight and it appears on your calendar." /> : (
              <div className="list">
                {bookings.map((booking) => (
                  <div key={booking.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{booking.airlineName} {booking.flightNumber}</div>
                      <div className="xs dim">
                        {booking.fromAirport} → {booking.toAirport} · {formatDate(booking.departAt, sim.homeZone)} at {formatTime(booking.departAt, sim.homeZone)} · {titleCaseLabel(booking.cabin.replace(/_/g, ' '))}
                      </div>
                    </div>
                    <span className="mono small">{formatMoney(booking.fare + booking.taxesFees, { cents: false })}</span>
                    <span className="chip">{titleCaseLabel(booking.status.replace(/_/g, ' '))}</span>
                    {booking.status === 'booked' && (
                      <button className="btn btn-sm" onClick={() => run('travel.cancel_flight', { bookingId: booking.id })}>Cancel</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Stays" flush>
            {stays.length === 0 ? <Empty title="No Hotels Booked" body="" /> : (
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
                    <span className="chip">{titleCaseLabel(stay.status.replace(/_/g, ' '))}</span>
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
