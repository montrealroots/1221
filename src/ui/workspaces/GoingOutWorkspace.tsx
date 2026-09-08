/**
 * SLATE — going out.
 *
 * The cinema, for now. A real chain, the real certificate of the country you
 * are standing in, a named time in a named room and a seat you paid for. The
 * program is SLATE's own and the note under the heading says so.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Tabs, Stat } from '@/ui/components/primitives';
import { formatMoney } from '@/engine/core/money';
import { MS_DAY, formatDate, formatTime } from '@/engine/core/time';
import { plural } from '@/engine/core/text';
import {
  DOORS_OPEN_MINUTES, DOORS_SHUT_MINUTES, chainOf, cinemasIn, describeCinema, describeTicket,
  programmeIn, screenFor, seatsLeft,
  showtimesFor, snackPrice, tasteFor, ticketPrice, ticketsOf, tierOf, weekStartOf, type Showing,
} from '@/engine/systems/cinema';
import {
  CHAIN_TIER_LABEL, CINEMA_NOTE, GENRE_LABEL, SCREEN_LABEL, SNACK_LABEL, SNACK_PRICES,
  ratingSystemFor, seasonFor,
} from '@/engine/content/cinemas';
import { CITIES } from '@/engine/content/geography';
import type { Place } from '@/engine/content/places';
import type { CinemaTicket } from '@/engine/domain/model';

type Tab = 'whats_on' | 'tickets';
type Snack = keyof typeof SNACK_PRICES;

export function GoingOutWorkspace() {
  const [tab, setTab] = useState<Tab>('whats_on');

  const cityName = useWorld((s) => CITIES.get(s.player.currentLocationId)?.name ?? 'town');
  const cinemas = useWorld((s) => cinemasIn(s));
  const tickets = useWorld((s) => ticketsOf(s));
  const waiting = tickets.filter((one) => one.status === 'booked');
  const system = useWorld((s) => ratingSystemFor(CITIES.get(s.player.currentLocationId)?.countryId ?? ''));
  const season = useWorld((s) => seasonFor(new Date(s.now).getUTCMonth() + 1));

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Going Out</div>
        <h1>Going Out</h1>
        <p className="muted">
          A seat at a named time in a named room, and whoever else decided to come out that
          evening. {season.about}
        </p>
        <p className="xs dim">{CINEMA_NOTE}</p>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'whats_on', label: 'What Is On', badge: cinemas.length },
          { id: 'tickets', label: 'Your Tickets', badge: waiting.length },
        ]}
      />

      {tab === 'whats_on' && (
        cinemas.length === 0
          ? <Empty title="No Cinema Here" body="Nowhere in this city shows a film. The nearest screen is in a bigger town." />
          : <WhatIsOn cinemas={cinemas} cityName={cityName} systemBody={system.body} />
      )}

      {tab === 'tickets' && <YourTickets tickets={tickets} />}
    </>
  );
}

/**
 * The program.
 *
 * A cinema at a time, because a listings page for a whole city at once is a
 * wall of text and nobody reads it.
 */
function WhatIsOn({ cinemas, cityName, systemBody }: { cinemas: Place[]; cityName: string; systemBody: string }) {
  const { sim, run } = useGame();
  const [placeId, setPlaceId] = useState(cinemas[0]?.id ?? '');
  const [dayOffset, setDayOffset] = useState(0);
  const [seats, setSeats] = useState(1);

  const place = cinemas.find((one) => one.id === placeId) ?? cinemas[0]!;
  // The program, the times and the seats all move with the world clock, so
  // they are read straight off the simulation rather than memoised on a tick.
  const day = sim.now + dayOffset * MS_DAY;
  const program = programmeIn(sim, place.cityId, day);
  const chain = chainOf(sim, place);

  return (
    <>
      <Panel
        title="Which Cinema"
        subtitle={`In ${cityName}. The week of ${formatDate(weekStartOf(sim, day, place.cityId), sim.zone)}, classified by ${systemBody}.`}
      >
        <div className="row gap-2 wrap">
          {cinemas.map((one) => (
            <button
              key={one.id}
              type="button"
              className={`btn btn-sm${one.id === place.id ? ' btn-primary' : ''}`}
              onClick={() => setPlaceId(one.id)}
            >
              {one.name}
            </button>
          ))}
        </div>
        <p className="small" style={{ marginTop: 10 }}>{describeCinema(sim, place)}</p>
        <div className="grid grid-4" style={{ marginTop: 10 }}>
          <Stat label="Whose It Is" value={chain ? chain.name : 'Its Own'} note={CHAIN_TIER_LABEL[tierOf(sim, place)]} />
          <Stat label="On This Week" value={program.length} note="Pictures" />
          <Stat label="Seats You Want" value={seats} note="On one ticket" />
        </div>
        <div className="row gap-2 wrap" style={{ marginTop: 10 }}>
          {[1, 2, 3, 4].map((n) => (
            <button key={n} type="button" className={`btn btn-sm${seats === n ? ' btn-primary' : ''}`} onClick={() => setSeats(n)}>
              {plural(n, 'Seat')}
            </button>
          ))}
        </div>
        <div className="row gap-2 wrap" style={{ marginTop: 10 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((n) => (
            <button key={n} type="button" className={`btn btn-sm${dayOffset === n ? ' btn-primary' : ''}`} onClick={() => setDayOffset(n)}>
              {n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : formatDate(sim.now + n * MS_DAY, sim.homeZone)}
            </button>
          ))}
        </div>
      </Panel>

      {program.length === 0
        ? <Empty title="Nothing On" body="The program is between one week and the next." />
        : program.map((showing) => (
          <ShowingPanel key={showing.id} place={place} showing={showing} day={day} seats={seats} onBook={run} />
        ))}
    </>
  );
}

function ShowingPanel({
  place, showing, day, seats, onBook,
}: {
  place: Place;
  showing: Showing;
  day: number;
  seats: number;
  onBook: ReturnType<typeof useGame>['run'];
}) {
  const { sim } = useGame();
  const times = showtimesFor(sim, place, showing, day);
  const taste = tasteFor(sim, showing.genre);

  return (
    <Panel
      title={showing.title}
      subtitle={`${GENRE_LABEL[showing.genre]} · ${showing.certificate.label} · ${plural(showing.runtimeMinutes, 'minute')}`}
    >
      <p className="small" style={{ marginTop: 0 }}>
        {showing.certificate.about} {showing.weekOfRun === 1
          ? 'It opened this week.'
          : `${plural(showing.weekOfRun, 'week')} into its run.`}
      </p>
      <div className="grid grid-4">
        <Stat label="People Are Saying" value={showing.buzz >= 58 ? 'A Lot' : showing.buzz >= 32 ? 'Something' : 'Not Much'} note="How full it gets" />
        <Stat label="Your Sort Of Thing" value={taste >= 65 ? 'Yes' : taste >= 45 ? 'Maybe' : 'Not Really'} note={GENRE_LABEL[showing.genre]} />
        <Stat label="Certificate" value={showing.certificate.label} note={showing.certificate.minimumAge > 0 ? `${showing.certificate.minimumAge} and over` : 'No age bar'} />
      </div>
      <div className="row gap-2 wrap" style={{ marginTop: 12 }}>
        {times.map((at) => {
          const screen = screenFor(sim, place, showing, at);
          const left = seatsLeft(sim, place, showing, at);
          const price = ticketPrice(sim, place, screen, at) * seats;
          const gone = left < seats;
          const past = at < sim.now;
          return (
            <button
              key={at}
              type="button"
              className={`btn btn-sm${gone || past ? '' : ' btn-primary'}`}
              disabled={gone || past}
              onClick={() => onBook('cine.book', { placeId: place.id, showingId: showing.id, at, seats })}
            >
              {formatTime(at, sim.homeZone)} · {SCREEN_LABEL[screen]} · {gone ? 'Sold Out' : past ? 'Gone' : formatMoney(price)}
            </button>
          );
        })}
      </div>
      <p className="xs dim" style={{ marginTop: 8 }}>
        {times.length === 0
          ? 'No showings that day.'
          : `${plural(times.length, 'showing')}, and a matinee is cheaper than an evening everywhere.`}
      </p>
    </Panel>
  );
}

/** The stubs in your pocket, and the ones you already used. */
function YourTickets({ tickets }: { tickets: CinemaTicket[] }) {
  const { sim, run } = useGame();
  const [snacks, setSnacks] = useState<Snack>('nothing');

  if (tickets.length === 0) {
    return <Empty title="No Tickets" body="Book a seat and the stub lives here until you have used it." />;
  }

  return (
    <>
      {tickets.map((ticket) => {
        const place = cinemasIn(sim, ticket.cityId).find((one) => one.id === ticket.placeId);
        const here = sim.player.currentPlaceId === ticket.placeId;
        const open = sim.now >= ticket.at - DOORS_OPEN_MINUTES * 60_000 && sim.now <= ticket.at + DOORS_SHUT_MINUTES * 60_000;
        return (
          <Panel key={ticket.id} title={ticket.title} subtitle={describeTicket(sim, ticket)}>
            <div className="grid grid-4">
              <Stat label="Where" value={ticket.placeName} note={CITIES.get(ticket.cityId)?.name ?? ticket.cityId} />
              <Stat label="When" value={formatTime(ticket.at, sim.homeZone)} note={formatDate(ticket.at, sim.homeZone)} />
              <Stat label="What You Paid" value={formatMoney(ticket.paid)} note={plural(ticket.seats, 'seat')} />
              <Stat label="Certificate" value={ticket.certificate} note={SCREEN_LABEL[ticket.screen as keyof typeof SCREEN_LABEL] ?? ticket.screen} />
            </div>

            {ticket.seen && (
              <>
                <p className="small" style={{ marginTop: 10 }}>{ticket.seen.note}</p>
                <p className="xs dim" style={{ margin: '4px 0 0' }}>{ticket.seen.room}</p>
              </>
            )}

            {ticket.status === 'booked' && (
              <>
                <div className="row gap-2 wrap" style={{ marginTop: 12 }}>
                  {(['nothing', 'small', 'large', 'works'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`btn btn-sm${snacks === size ? ' btn-primary' : ''}`}
                      onClick={() => setSnacks(size)}
                    >
                      {SNACK_LABEL[size]}
                      {size !== 'nothing' && place ? ` · ${formatMoney(snackPrice(place, size))}` : ''}
                    </button>
                  ))}
                </div>
                <div className="row gap-2 wrap" style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    disabled={!open || !here}
                    onClick={() => run('cine.attend', { ticketId: ticket.id, snacks })}
                  >
                    Take Your Seat
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => run('cine.cancel', { ticketId: ticket.id })}>
                    Give It Back
                  </button>
                </div>
                <p className="xs dim" style={{ marginTop: 8 }}>
                  {!here
                    ? `You have to be at ${ticket.placeName}. Go there from The City, and then take your seat.`
                    : open
                      ? 'They are letting people in.'
                      : `They open the doors forty five minutes before, and shut them half an hour after it starts.`}
                </p>
              </>
            )}
          </Panel>
        );
      })}
    </>
  );
}
