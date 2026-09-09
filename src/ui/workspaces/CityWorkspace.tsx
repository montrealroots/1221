/**
 * SLATE — the city you are in.
 *
 * Where you are standing, what you can do there, and everywhere you could go
 * instead — with what the journey costs in time, money and fuel. The landmarks
 * are real and say so. The restaurants, bars, gyms and filling stations are
 * SLATE's own, and say that too.
 */

import { useMemo, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { ageOf } from '@/engine/systems/lifespan';
import {
  countryHere, describePlan, officeHere, planOf, planPrice,
} from '@/engine/systems/rooms';
import {
  ARRIVAL_LABEL, type Arrival, HANDSET_NOTE, NETWORK_KIND_LABEL, NETWORK_NOTE, OFFICE_NOTE,
  PORTING_NOTE, QUEUE_NOTE, TARIFFS, TARIFF_BY_ID, counterJobsAt, networksIn,
} from '@/engine/content/rooms';
import { Panel, Stat, Empty, Tabs, Modal, Meter } from '@/ui/components/primitives';
import { plural, titleCaseLabel } from '@/engine/core/text';
import { formatMoney, formatMoneyCompact, type Money } from '@/engine/core/money';
import { formatDate, formatDuration } from '@/engine/core/time';
import { CITIES, NEIGHBOURHOODS } from '@/engine/content/geography';
import {
  INVENTED_NOTE, PLACE_KIND_LABEL, REAL_NOTE, cuisineOf, menuOf, priceOf, type Place, type PlaceKind,
} from '@/engine/content/places';
import {
  MODE_LABEL, hotelRoom, placesNear, planJourney, whatIsHere, type Mode,
} from '@/engine/systems/places';
import { activeScene } from '@/engine/systems/scenes';
import { isJeweller } from '@/engine/systems/jewellery';
import { isCostumier } from '@/engine/systems/costume';
import { lotSells } from '@/engine/systems/dealership';
import { DOORS_OPEN_MINUTES, DOORS_SHUT_MINUTES, upcomingTickets } from '@/engine/systems/cinema';
import { upcomingTickets as upcomingSeats } from '@/engine/systems/going';
import {
  counterPrice, describePharmacy, groomingNote, operatorAt, postagePrice, salonPrice, shelfAt,
} from '@/engine/systems/errands';
import { PHARMACY_NOTE, POST_NOTE, POST_SERVICES, SALON_SERVICES } from '@/engine/content/errands';

/** The rooms a town goes out in, which have their own listings page. */
const VENUE_KINDS: PlaceKind[] = ['stadium', 'arena', 'concert_hall', 'theatre', 'museum', 'club'];

const GROUPS: { id: string; label: string; kinds: PlaceKind[] }[] = [
  { id: 'eat', label: 'Eat And Drink', kinds: ['restaurant', 'cafe', 'bar', 'fast_food'] },
  { id: 'see', label: 'See Something', kinds: ['landmark', 'museum', 'park', 'beach', 'viewpoint', 'cinema', 'theatre', 'stadium', 'arena', 'concert_hall'] },
  { id: 'shop', label: 'Shops', kinds: ['shop', 'market'] },
  { id: 'do', label: 'Errands', kinds: ['gas_station', 'garage', 'gym', 'salon', 'pharmacy', 'post_office', 'launderette', 'dentist', 'vet', 'license_office', 'phone_shop', 'dealership', 'marina', 'storage'] },
  { id: 'stay', label: 'Stay Out', kinds: ['hotel', 'club'] },
];

export function CityWorkspace() {
  const { sim, run, navigate, toast } = useGame();
  const here = useWorld((s) => whatIsHere(s));
  const [group, setGroup] = useState('eat');
  const [mode, setMode] = useState<Mode>('drive');
  const [ordering, setOrdering] = useState<Place | null>(null);
  const [errand, setErrand] = useState<'salon' | 'chemist' | 'post' | 'counter' | 'phone' | null>(null);

  const kinds = GROUPS.find((g) => g.id === group)?.kinds ?? [];
  const near = useWorld((s) => placesNear(s, { mode, kinds, limit: 120 }));
  const room = useWorld((s) => hotelRoom(s, s.player));
  // A seat here, tonight, that the doors are open for. Read off the world
  // clock rather than a tick, because the doors close half an hour in.
  const seatWaiting = useWorld((s) => upcomingTickets(s)).find(
    (ticket) => ticket.placeId === sim.player.currentPlaceId
      && sim.now >= ticket.at - DOORS_OPEN_MINUTES * 60_000 && sim.now <= ticket.at + DOORS_SHUT_MINUTES * 60_000,
  );
  // A seat here tonight that the doors are open for, at a venue rather than a
  // cinema. Read off the world clock, because the doors shut.
  const seatTonight = useWorld((s) => upcomingSeats(s)).find(
    (ticket) => ticket.placeId === sim.player.currentPlaceId
      && sim.now >= ticket.at - 75 * 60_000 && sim.now <= ticket.at + 30 * 60_000,
  );
  const scene = useWorld(activeScene);
  const city = CITIES.get(sim.player.currentLocationId);
  const homeJourney = useMemo(() => {
    const home = sim.player.residenceId ? sim.universe.properties[sim.player.residenceId] : undefined;
    if (!home || home.locationId !== sim.player.currentLocationId) return undefined;
    return { home, journey: planJourney(sim, { cityId: home.locationId, neighbourhoodId: home.neighbourhoodId }, mode) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, mode, here.place?.id, here.property?.id]);

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">{city?.name ?? 'Somewhere'}</div>
        <h1>{here.place?.name ?? here.property?.addressLine ?? `Out In ${here.city}`}</h1>
        <p className="muted">
          {here.place
            ? `${PLACE_KIND_LABEL[here.place.kind]}. ${here.place.about} ${here.place.real ? REAL_NOTE : INVENTED_NOTE}`
            : here.property
              ? 'Your own front door. Eat, shower, sleep, or go out.'
              : 'You’re in the city, between places. Everything below is somewhere you could be instead.'}
        </p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 'var(--s4)' }}>
        <Stat label="Energy" value={Math.round(sim.player.wellbeing.energy)} note="out of 100" />
        <Stat label="Fed" value={Math.round(sim.player.wellbeing.nourishment)} note="out of 100" />
        <Stat label="Clean" value={Math.round(sim.player.wellbeing.hygiene)} note="a shower puts it back" />
        <Stat
          label="Your Car"
          value={here.vehicle ? `${Math.round(here.vehicle.fuel)}%` : '—'}
          note={here.vehicle ? `${here.vehicle.range} km on what is in it` : 'not in this city'}
        />
      </div>


      <Panel title="Right Here" subtitle="What you can do without going anywhere.">
        <div className="row wrap gap-2">
          {here.place && (here.place.actions.includes('eat') || here.place.actions.includes('drink')) && menuOf(here.place).length > 0 && (
            <button className="btn btn-sm btn-primary" onClick={() => setOrdering(here.place!)}>See The Menu</button>
          )}
          {here.place?.actions.includes('visit') && (
            <button className="btn btn-sm btn-primary" onClick={() => run('place.visit', {})}>
              Look Around{here.place.admissionCalibration ? ` (${formatMoneyCompact(here.place.admissionCalibration)} Or So)` : ''}
            </button>
          )}
          {here.place?.actions.includes('refuel') && here.vehicle && (
            <button className="btn btn-sm btn-primary" onClick={() => run('place.refuel', {})}>
              Fill The Tank
            </button>
          )}
          {here.place?.actions.includes('train') && (
            <button className="btn btn-sm btn-primary" disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'fitness.gym', input: { placeId: here.place!.id } })}>
              Work Out
            </button>
          )}
          {here.place?.actions.includes('browse') && (
            <button className="btn btn-sm btn-primary" disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'vehicles.dealer', input: { placeId: here.place!.id } })}>
              {lookLabel(here.place)}
            </button>
          )}
          {here.place && here.place.actions.includes('eat') && menuOf(here.place).length > 0 && (
            <button className="btn btn-sm" disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'life.meal', input: { placeId: here.place!.id } })}>
              Eat Here
            </button>
          )}
          {here.place?.retailerId && !isJeweller(here.place) && (
            <button className="btn btn-sm btn-primary" disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'life.shop', input: { placeId: here.place!.id } })}>
              Have A Look Round
            </button>
          )}
          {isJeweller(here.place) && (
            <button className="btn btn-sm btn-primary" disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'life.jeweller', input: { placeId: here.place!.id } })}>
              Go To The Counter
            </button>
          )}
          {isCostumier(here.place) && (
            <button className="btn btn-sm btn-primary" disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'life.costumier', input: { placeId: here.place!.id } })}>
              Go To The Table
            </button>
          )}
          {here.place?.kind === 'cinema' && (
            <button className="btn btn-sm btn-primary" onClick={() => navigate('/workspace/goingout', 'Going Out')}>
              See What Is On
            </button>
          )}
          {seatWaiting && (
            <button className="btn btn-sm btn-primary" onClick={() => run('cine.attend', { ticketId: seatWaiting.id })}>
              Take Your Seat For {seatWaiting.title}
            </button>
          )}
          {seatTonight && (
            <button className="btn btn-sm btn-primary" onClick={() => run('going.attend', { ticketId: seatTonight.id })}>
              Go In For {seatTonight.card}
            </button>
          )}
          {here.place?.kind === 'salon' && (
            <button className="btn btn-sm btn-primary" onClick={() => setErrand(errand === 'salon' ? null : 'salon')}>
              Sit In The Chair
            </button>
          )}
          {here.place?.kind === 'pharmacy' && (
            <button className="btn btn-sm btn-primary" onClick={() => setErrand(errand === 'chemist' ? null : 'chemist')}>
              Go To The Counter
            </button>
          )}
          {here.place?.kind === 'license_office' && (
            <button className="btn btn-sm btn-primary" onClick={() => setErrand(errand === 'counter' ? null : 'counter')}>
              Take A Ticket
            </button>
          )}
          {here.place?.kind === 'phone_shop' && (
            <button className="btn btn-sm btn-primary" onClick={() => setErrand(errand === 'phone' ? null : 'phone')}>
              Talk To Somebody
            </button>
          )}
          {here.place?.kind === 'post_office' && (
            <button className="btn btn-sm btn-primary" onClick={() => setErrand(errand === 'post' ? null : 'post')}>
              Join The Queue
            </button>
          )}
          {here.place?.kind === 'launderette' && (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                const result = run<{ paid: Money; pieces: number; readyAt: number }>(
                  'errand.service_wash', { placeId: here.place!.id },
                );
                if (result.ok) {
                  const { pieces, paid, readyAt } = result.value!;
                  toast(
                    `${plural(pieces, 'piece')} for ${formatMoney(paid)}, `
                    + `back ${formatDate(readyAt, sim.homeZone)}.`,
                    'positive',
                  );
                }
              }}
            >
              Leave It With Them
            </button>
          )}
          {VENUE_KINDS.includes(here.place?.kind ?? 'shop') && (
            <button className="btn btn-sm btn-primary" onClick={() => navigate('/workspace/goingout', 'Going Out')}>
              See What Is On Here
            </button>
          )}
          {here.place?.actions.includes('watch') && here.place.kind !== 'cinema' && !VENUE_KINDS.includes(here.place.kind) && (
            <button className="btn btn-sm" onClick={() => run('life.do_activity', { activityId: 'watch' })}>Watch Something</button>
          )}
          {here.place?.kind === 'hotel' && !room && (
            <button className="btn btn-sm btn-primary" onClick={() => run('place.book_room', { nights: 1 })}>Take A Room For The Night</button>
          )}
          {here.canShower && (
            <button className="btn btn-sm" onClick={() => run('life.shower', {})}>Shower</button>
          )}
          {here.canSleep && (
            <button className="btn btn-sm" onClick={() => run('life.sleep', { hours: 8 })}>Sleep Eight Hours</button>
          )}
          {here.property && (
            <button className="btn btn-sm" onClick={() => run('life.do_activity', { activityId: 'cook' })}>Cook Something</button>
          )}
          {homeJourney && here.property?.id !== homeJourney.home.id && (
            <button className="btn btn-sm" onClick={() => run('go.to', { home: true, mode })}>
              Go Home ({titleCaseLabel(formatDuration(homeJourney.journey.minutes * 60_000))})
            </button>
          )}
        </div>
        {errand && here.place && (
          <ErrandCounter place={here.place} kind={errand} onDone={() => setErrand(null)} />
        )}
        {room && (
          <p className="xs dim" style={{ marginTop: 'var(--s3)' }}>
            You have a room at {room.hotelName} until {new Date(room.checkOutAt).toDateString()}. That is a bed and a bathroom.
          </p>
        )}
        {!here.canSleep && !here.canShower && (
          <p className="xs dim" style={{ marginTop: 'var(--s3)' }}>
            Nowhere to sleep or wash here. Home, or a hotel room you have booked.
          </p>
        )}
      </Panel>

      <Panel
        title="Where You Could Go"
        subtitle={`In ${here.city}. Nearest first, in whatever traffic there’s right now.`}
        actions={
          <div className="row gap-1">
            {(['walk', 'drive', 'taxi', 'transit'] as Mode[]).map((m) => (
              <button key={m} className={`btn btn-sm ${mode === m ? 'btn-primary' : ''}`} onClick={() => setMode(m)}>{MODE_LABEL[m]}</button>
            ))}
          </div>
        }
        flush
      >
        <Tabs active={group} onChange={setGroup} tabs={GROUPS.map((g) => ({ id: g.id, label: g.label }))} />
        {near.length === 0 ? (
          <Empty title="Nothing Of That Kind Here" body="Try another kind of place, or another city." />
        ) : (
          <div className="list">
            {near.map(({ place, journey }) => (
              <div key={place.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">
                    {place.name}
                    {place.real ? <span className="chip chip-positive" style={{ marginLeft: 6 }}>Real</span> : null}
                  </div>
                  <div className="xs dim">
                    {PLACE_KIND_LABEL[place.kind]}
                    {cuisineOf(place) ? ` · ${cuisineOf(place)!.name}` : ''}
                    {place.neighbourhoodId ? ` · ${NEIGHBOURHOODS.get(place.neighbourhoodId)?.name}` : ''}
                    {' · '}{'$'.repeat(place.price)}
                    {place.opened ? ` · since ${place.opened}` : ''}
                  </div>
                  <div className="xs muted" style={{ marginTop: 2 }}>{place.about}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 96 }}>
                  <div className="mono small">{formatDuration(journey.minutes * 60_000)}</div>
                  <div className="xs dim">{journey.km} km{journey.cost > 0 ? ` · ${formatMoney(journey.cost, { cents: false })}` : ''}</div>
                </div>
                <div className="row gap-1 wrap" style={{ justifyContent: 'flex-end' }}>
                  {place.kind === 'gym' && (
                    <button className="btn btn-sm btn-primary" disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'fitness.gym', input: { placeId: place.id } })}>
                      Work Out
                    </button>
                  )}
                  {place.kind === 'dealership' && (
                    <button className="btn btn-sm btn-primary" disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'vehicles.dealer', input: { placeId: place.id } })}>
                      {lookLabel(place)}
                    </button>
                  )}
                  {place.actions.includes('eat') && menuOf(place).length > 0 && (
                    <button className="btn btn-sm btn-primary" disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'life.meal', input: { placeId: place.id } })}>
                      Eat Here
                    </button>
                  )}
                  {place.retailerId && !isJeweller(place) && (
                    <button className="btn btn-sm btn-primary" disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'life.shop', input: { placeId: place.id } })}>
                      Shop Here
                    </button>
                  )}
                  {isJeweller(place) && (
                    <button className="btn btn-sm btn-primary" disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'life.jeweller', input: { placeId: place.id } })}>
                      Go To The Counter
                    </button>
                  )}
                  {isCostumier(place) && (
                    <button className="btn btn-sm btn-primary" disabled={Boolean(scene)} onClick={() => run('scene.start', { definitionId: 'life.costumier', input: { placeId: place.id } })}>
                      Go To The Table
                    </button>
                  )}
                  <button
                    className={`btn btn-sm${place.kind === 'gym' || place.kind === 'dealership' || place.retailerId || (place.actions.includes('eat') && menuOf(place).length > 0) ? '' : ' btn-primary'}`}
                    disabled={sim.player.currentPlaceId === place.id}
                    onClick={() => run('go.to', { placeId: place.id, mode })}
                  >
                    {sim.player.currentPlaceId === place.id ? 'Here' : MODE_LABEL[mode]}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {ordering && <OrderDialog place={ordering} onClose={() => setOrdering(null)} />}
    </>
  );
}

function OrderDialog({ place, onClose }: { place: Place; onClose: () => void }) {
  const { sim, run } = useGame();
  const [chosen, setChosen] = useState<string[]>([]);
  const [withIds, setWithIds] = useState<string[]>([]);
  const menu = menuOf(place);
  const total = chosen.reduce((sum, name) => {
    const item = menu.find((m) => m.name === name);
    return sum + (item ? priceOf(place, item) : 0);
  }, 0);
  const company = useWorld((s) => Object.values(s.universe.relationships)
    .filter((r) => !r.endedAt && (r.aId === s.player.id || r.bId === s.player.id))
    .map((r) => s.universe.people[r.aId === s.player.id ? r.bId : r.aId])
    .filter((p) => p && p.currentLocationId === s.player.currentLocationId)
    .slice(0, 6));

  const order = () => {
    const result = run('place.order', { items: chosen, withPersonIds: withIds });
    if (result.ok) onClose();
  };

  return (
    <Modal
      title={place.name}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Leave It</button>
          <button className="btn btn-primary" disabled={chosen.length === 0} onClick={order}>
            Order{total > 0 ? ` — ${formatMoney(total + Math.round(total * 0.18))}` : ''}
          </button>
        </>
      }
    >
      <p className="muted small">
        {place.about} {place.real ? REAL_NOTE : INVENTED_NOTE} Prices are SLATE’s calibration against the cost of
        living in {CITIES.get(place.cityId)?.name}, with service on top.
      </p>
      <Meter label="How Good It Is" value={place.quality} hint="On SLATE’s scale, not a review." />
      <div className="list" style={{ marginTop: 'var(--s3)' }}>
        {menu.map((item) => (
          <button
            key={item.name}
            className={`list-item ${chosen.includes(item.name) ? 'list-item-active' : ''}`}
            onClick={() => setChosen(chosen.includes(item.name) ? chosen.filter((n) => n !== item.name) : [...chosen, item.name])}
          >
            <div className="grow">
              <div className="small strong">{item.name}</div>
              <div className="xs dim">{item.nourishment > 25 ? 'A proper plate of food' : item.nourishment > 12 ? 'Something small' : 'A drink'}</div>
            </div>
            <span className="mono small">{formatMoney(priceOf(place, item), { cents: false })}</span>
          </button>
        ))}
      </div>
      {company.length > 0 && (
        <div style={{ marginTop: 'var(--s3)' }}>
          <div className="eyebrow">Anyone With You</div>
          <div className="row wrap gap-1" style={{ marginTop: 'var(--s2)' }}>
            {company.map((person) => person && (
              <button
                key={person.id}
                className={`btn btn-sm ${withIds.includes(person.id) ? 'btn-primary' : ''}`}
                onClick={() => setWithIds(withIds.includes(person.id) ? withIds.filter((id) => id !== person.id) : [...withIds, person.id])}
              >
                {person.displayName}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="xs dim" style={{ marginTop: 'var(--s3)' }}>
        {formatDuration(place.minutes * 60_000)} at the table. {sim.player.wellbeing.nourishment < 40 ? 'You’re hungry' : 'You aren’t especially hungry'}.
      </p>
    </Modal>
  );
}

/** What the button on a lot says, by what the lot sells. */
function lookLabel(place: Place): string {
  const sells = lotSells(place);
  return sells === 'motorcycle' ? 'Look At The Bikes' : sells === 'boat' ? 'Look At The Boats' : sells === 'jet' ? 'Look At The Aircraft' : 'Look At The Cars';
}

/**
 * The counter you are standing at.
 *
 * A chair, a chemist's shelf or a post office queue, in the room you are
 * already in. Every price is read straight off the simulation, because the
 * city clock moves while you are standing there.
 */
function ErrandCounter({
  place, kind, onDone,
}: { place: Place; kind: 'salon' | 'chemist' | 'post' | 'counter' | 'phone'; onDone: () => void }) {
  const { sim, run, toast } = useGame();
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [service, setService] = useState('tracked');
  const [grams, setGrams] = useState(1000);
  const [toCityId, setToCityId] = useState('');
  const [contents, setContents] = useState('');
  const [arrival, setArrival] = useState<Arrival>('walk_in');
  const [tariffId, setTariffId] = useState('sim_only');

  if (kind === 'counter') {
    const age = ageOf(sim);
    return (
      <div className="card card-tight" style={{ marginTop: 'var(--s3)' }}>
        <div className="label">{officeHere(sim)}</div>
        <p className="xs dim" style={{ margin: '4px 0 0' }}>{QUEUE_NOTE}</p>
        <div className="row gap-2 wrap" style={{ marginTop: 'var(--s2)' }}>
          {(Object.keys(ARRIVAL_LABEL) as Arrival[]).map((one) => (
            <button
              key={one}
              className={`btn btn-sm${arrival === one ? ' btn-primary' : ''}`}
              onClick={() => setArrival(one)}
            >
              {ARRIVAL_LABEL[one]}
            </button>
          ))}
        </div>
        <div className="list" style={{ marginTop: 'var(--s2)' }}>
          {counterJobsAt(age).map((job) => (
            <div key={job.id} className="list-item list-static">
              <div className="grow">
                <div className="small strong">{job.label}</div>
                <div className="xs dim">{job.about}</div>
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  const result = run<{ note: string; done: boolean }>(
                    'room.counter', { placeId: place.id, jobId: job.id, arrival },
                  );
                  if (result.ok) {
                    toast(result.value!.note, result.value!.done ? 'positive' : 'neutral');
                    if (result.value!.done) onDone();
                  }
                }}
              >
                {job.fee > 0 ? formatMoney(job.fee) : 'Free'}
              </button>
            </div>
          ))}
        </div>
        <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>{OFFICE_NOTE}</p>
      </div>
    );
  }

  if (kind === 'phone') {
    const countryId = countryHere(sim);
    const held = planOf(sim);
    const shopNetworks = networksIn(countryId);
    return (
      <div className="card card-tight" style={{ marginTop: 'var(--s3)' }}>
        <div className="label">The Counter</div>
        {held ? (
          <>
            <p className="xs dim" style={{ margin: '4px 0 0' }}>{describePlan(sim, held)}</p>
            <div className="row gap-2 wrap" style={{ marginTop: 'var(--s2)' }}>
              <button
                className="btn btn-sm"
                onClick={() => {
                  const result = run<{ note: string }>('room.end_plan', {});
                  if (result.ok) { toast(result.value!.note, 'neutral'); onDone(); }
                }}
              >
                End The Plan
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="row gap-2 wrap" style={{ marginTop: 'var(--s2)' }}>
              {TARIFFS.map((one) => (
                <button
                  key={one.id}
                  className={`btn btn-sm${tariffId === one.id ? ' btn-primary' : ''}`}
                  onClick={() => setTariffId(one.id)}
                >
                  {one.label}
                </button>
              ))}
            </div>
            <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>{TARIFF_BY_ID[tariffId]?.about}</p>
            <div className="list" style={{ marginTop: 'var(--s2)' }}>
              {shopNetworks.map((network) => (
                <div key={network.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{network.name}</div>
                    <div className="xs dim">{NETWORK_KIND_LABEL[network.kind]} · {network.about}</div>
                  </div>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      const result = run<{ note: string }>(
                        'room.take_plan',
                        { placeId: place.id, networkId: network.id, tariffId, keepNumber: true },
                      );
                      if (result.ok) { toast(result.value!.note, 'positive'); onDone(); }
                    }}
                  >
                    {formatMoney(planPrice(sim, network, tariffId))} A Month
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="row gap-2 wrap" style={{ marginTop: 'var(--s2)' }}>
          <button
            className="btn btn-sm"
            onClick={() => {
              const result = run<{ note: string; wentWell: boolean }>('room.repair_phone', { placeId: place.id });
              if (result.ok) toast(result.value!.note, result.value!.wentWell ? 'positive' : 'neutral');
            }}
          >
            Mend The Screen
          </button>
        </div>
        <div className="col gap-2" style={{ marginTop: 'var(--s2)' }}>
          <p className="xs dim" style={{ margin: 0 }}>{NETWORK_NOTE}</p>
          <p className="xs dim" style={{ margin: 0 }}>{PORTING_NOTE}</p>
          <p className="xs dim" style={{ margin: 0 }}>{HANDSET_NOTE}</p>
        </div>
      </div>
    );
  }

  if (kind === 'salon') {
    return (
      <div className="card card-tight" style={{ marginTop: 'var(--s3)' }}>
        <div className="label">The Chair</div>
        <p className="xs dim" style={{ margin: '4px 0 0' }}>{groomingNote(sim)}</p>
        <div className="list" style={{ marginTop: 'var(--s2)' }}>
          {SALON_SERVICES.map((one) => (
            <div key={one.id} className="list-item list-static">
              <div className="grow">
                <div className="small strong">{one.label}</div>
                <div className="xs dim">{one.about}</div>
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  const result = run<{ paid: Money; note: string }>(
                    'errand.haircut', { placeId: place.id, service: one.id },
                  );
                  if (result.ok) { toast(result.value!.note, 'positive'); onDone(); }
                }}
              >
                {formatMoney(salonPrice(place, one.id))}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'chemist') {
    const shelf = shelfAt(sim, place);
    const total = Object.entries(basket).reduce((sum, [id, n]) => sum + counterPrice(place, id) * n, 0);
    return (
      <div className="card card-tight" style={{ marginTop: 'var(--s3)' }}>
        <div className="label">The Counter</div>
        <p className="xs dim" style={{ margin: '4px 0 0' }}>{describePharmacy(place)}</p>
        <p className="xs dim" style={{ margin: '4px 0 0' }}>{PHARMACY_NOTE}</p>
        <div className="list" style={{ marginTop: 'var(--s2)' }}>
          {shelf.map((good) => (
            <div key={good.id} className="list-item list-static">
              <div className="grow">
                <div className="small strong">{good.name}</div>
                <div className="xs dim">{good.about}</div>
              </div>
              <span className="mono small">{formatMoney(counterPrice(place, good.id))}</span>
              <button
                className="btn btn-sm"
                onClick={() => setBasket({ ...basket, [good.id]: (basket[good.id] ?? 0) + 1 })}
              >
                Add{basket[good.id] ? ` (${basket[good.id]})` : ''}
              </button>
            </div>
          ))}
        </div>
        <div className="row gap-2" style={{ marginTop: 'var(--s3)' }}>
          <button
            className="btn btn-sm btn-primary"
            disabled={total === 0}
            onClick={() => {
              const items = Object.entries(basket).map(([id, quantity]) => ({ id, quantity }));
              const result = run<{ paid: Money; note: string }>('errand.buy', { placeId: place.id, items });
              if (result.ok) {
                toast(`${formatMoney(result.value!.paid)}. ${result.value!.note}`, 'positive');
                setBasket({});
                onDone();
              }
            }}
          >
            Pay{total > 0 ? ` — ${formatMoney(total)}` : ''}
          </button>
          <button className="btn btn-sm" onClick={() => setBasket({})}>Put It Back</button>
        </div>
      </div>
    );
  }

  const cities = CITIES.all().filter((one) => one.id !== place.cityId).slice(0, 60);
  const price = toCityId ? postagePrice(place, service, grams, toCityId) : 0;
  return (
    <div className="card card-tight" style={{ marginTop: 'var(--s3)' }}>
      <div className="label">The Queue</div>
      <p className="xs dim" style={{ margin: '4px 0 0' }}>{operatorAt(place)}. {POST_NOTE}</p>
      <label className="label" htmlFor="post-contents" style={{ marginTop: 'var(--s2)' }}>What Is In It</label>
      <input
        id="post-contents"
        className="input"
        value={contents}
        maxLength={120}
        placeholder="A script, bound"
        onChange={(event) => setContents(event.target.value)}
      />
      <label className="label" htmlFor="post-to" style={{ marginTop: 'var(--s2)' }}>Where To</label>
      <select id="post-to" className="input" value={toCityId} onChange={(event) => setToCityId(event.target.value)}>
        <option value="">Pick somewhere</option>
        {cities.map((one) => <option key={one.id} value={one.id}>{one.name}</option>)}
      </select>
      <label className="label" htmlFor="post-grams" style={{ marginTop: 'var(--s2)' }}>
        {(grams / 1000).toFixed(1)} kg
      </label>
      <input id="post-grams" type="range" min={100} max={20000} step={100} value={grams} onChange={(event) => setGrams(Number(event.target.value))} />
      <div className="row gap-2 wrap" style={{ marginTop: 'var(--s2)' }}>
        {POST_SERVICES.map((one) => (
          <button key={one.id} className={`btn btn-sm${service === one.id ? ' btn-primary' : ''}`} onClick={() => setService(one.id)}>
            {one.label}
          </button>
        ))}
      </div>
      <p className="xs dim" style={{ marginTop: 'var(--s2)' }}>
        {POST_SERVICES.find((one) => one.id === service)?.about}
      </p>
      <div className="row gap-2" style={{ marginTop: 'var(--s3)' }}>
        <button
          className="btn btn-sm btn-primary"
          disabled={!toCityId || contents.trim().length < 2}
          onClick={() => {
            const result = run<{ paid: Money; dueAt: number; operator: string }>(
              'errand.post', { placeId: place.id, service, grams, toCityId, contents },
            );
            if (result.ok) {
              const { operator, dueAt } = result.value!;
              toast(`${operator} has it. Due ${formatDate(dueAt, sim.homeZone)}.`, 'positive');
              onDone();
            }
          }}
        >
          Send It{price > 0 ? ` — ${formatMoney(price)}` : ''}
        </button>
      </div>
    </div>
  );
}
