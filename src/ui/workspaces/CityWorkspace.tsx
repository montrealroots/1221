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
import { Panel, Stat, Empty, Tabs, Modal, Meter } from '@/ui/components/primitives';
import { titleCaseLabel } from '@/engine/core/text';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDuration } from '@/engine/core/time';
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

const GROUPS: { id: string; label: string; kinds: PlaceKind[] }[] = [
  { id: 'eat', label: 'Eat And Drink', kinds: ['restaurant', 'cafe', 'bar', 'fast_food'] },
  { id: 'see', label: 'See Something', kinds: ['landmark', 'museum', 'park', 'beach', 'viewpoint', 'cinema', 'theatre', 'stadium'] },
  { id: 'shop', label: 'Shops', kinds: ['shop', 'market'] },
  { id: 'do', label: 'Errands', kinds: ['gas_station', 'garage', 'gym', 'salon', 'dealership', 'marina', 'storage'] },
  { id: 'stay', label: 'Stay Out', kinds: ['hotel', 'club'] },
];

export function CityWorkspace() {
  const { sim, run, navigate } = useGame();
  const here = useWorld((s) => whatIsHere(s));
  const [group, setGroup] = useState('eat');
  const [mode, setMode] = useState<Mode>('drive');
  const [ordering, setOrdering] = useState<Place | null>(null);

  const kinds = GROUPS.find((g) => g.id === group)?.kinds ?? [];
  const near = useWorld((s) => placesNear(s, { mode, limit: 120 }).filter((entry) => kinds.includes(entry.place.kind)));
  const room = useWorld((s) => hotelRoom(s, s.player));
  // A seat here, tonight, that the doors are open for. Read off the world
  // clock rather than a tick, because the doors close half an hour in.
  const seatWaiting = useWorld((s) => upcomingTickets(s)).find(
    (ticket) => ticket.placeId === sim.player.currentPlaceId
      && sim.now >= ticket.at - DOORS_OPEN_MINUTES * 60_000 && sim.now <= ticket.at + DOORS_SHUT_MINUTES * 60_000,
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
              : 'You are in the city, between places. Everything below is somewhere you could be instead.'}
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
          {here.place?.actions.includes('watch') && here.place.kind !== 'cinema' && (
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
        subtitle={`In ${here.city}. Nearest first, in whatever traffic there is right now.`}
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
        {formatDuration(place.minutes * 60_000)} at the table. {sim.player.wellbeing.nourishment < 40 ? 'You are hungry' : 'You are not especially hungry'}.
      </p>
    </Modal>
  );
}

/** What the button on a lot says, by what the lot sells. */
function lookLabel(place: Place): string {
  const sells = lotSells(place);
  return sells === 'motorcycle' ? 'Look At The Bikes' : sells === 'boat' ? 'Look At The Boats' : sells === 'jet' ? 'Look At The Aircraft' : 'Look At The Cars';
}
