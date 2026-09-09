/**
 * SLATE — the independent film.
 *
 * The half of making something yourself that the catalog cannot do: a counter
 * with a rate card. You pick the house, you put a body, some glass and a couple
 * of lamps on a ticket, you see what the week actually bills at, you leave a
 * deposit, and you go and collect it. Then you bring it back, and somebody
 * checks the cases.
 *
 * Everything shown here is SLATE's own calibration. No rate on this page is a
 * quote from any house, and the note under the heading says so.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Tabs, Stat } from '@/ui/components/primitives';
import { formatMoney } from '@/engine/core/money';
import { MS_DAY, formatDate } from '@/engine/core/time';
import { plural, titleCaseLabel } from '@/engine/core/text';
import {
  describeHire, equipmentCover, hiresOf, housesIn, linesOf, quoteFor, rateFor, stockOf,
} from '@/engine/systems/rental';
import {
  CREW_ROLES, CREW_ROLE_LABEL, HOME_SETUPS, MAX_HOURS, MAX_SETUPS, MIN_HOURS, STANDARD_HOURS,
  askable, capabilityOf, describeDay, locationsIn, permissionFee, shootDaysOf,
} from '@/engine/systems/shoot';
import type { CrewRole, IndieFilm, ShootDay } from '@/engine/domain/model';
import {
  RUNTIME_CAP, SETUPS_NEEDED, ceilingOf, cutHoursWanted, describeFilm, entryFee, filmsOf, roomCost,
  roomsIn, setupsIn,
} from '@/engine/systems/picture';
import { FESTIVAL_NOTE, FORMAT_LABEL, festivalsFor, type FilmFormat } from '@/engine/content/festivals';
import { RENTAL_LINE_LABEL, RENTAL_NOTE, WEEK_BILLS_DAYS } from '@/engine/content/rental';
import type { Place } from '@/engine/content/places';
import { CITIES } from '@/engine/content/geography';

type Tab = 'houses' | 'hires' | 'days' | 'pictures' | 'owned';

export function FilmWorkspace() {
  const { sim, run } = useGame();
  const [tab, setTab] = useState<Tab>('houses');
  const [openId, setOpenId] = useState<string | null>(null);
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [days, setDays] = useState(3);
  const [waiver, setWaiver] = useState(true);
  const [delivery, setDelivery] = useState(false);

  const houses = useWorld((s) => housesIn(s));
  const hires = useWorld((s) => hiresOf(s));
  const cover = useWorld(equipmentCover);
  const cityName = useWorld((s) => CITIES.get(s.player.currentLocationId)?.name ?? 'town');
  // Kit bought outright carries the catalog's own category on the asset, which
  // is how a camera on a shelf tells itself apart from a sofa.
  const owned = useWorld((s) => Object.values(s.universe.assets)
    .filter((a) => a.ownerId === s.player.id && !a.soldAt)
    .filter((a) => a.tags.includes('kit')));

  const open = houses.find((house) => house.id === openId);
  const out = hires.filter((hire) => hire.status === 'booked' || hire.status === 'out');
  const shootDays = useWorld((s) => shootDaysOf(s));
  const pictures = useWorld((s) => filmsOf(s));

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Film</div>
        <h1>The Independent Film</h1>
        <p className="muted">
          Nobody buys an Alexa. The kit for a picture of your own is hired by the day from a
          house that has been doing it for years, and it goes back on the Monday.
        </p>
        <p className="xs dim">{RENTAL_NOTE}</p>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'houses', label: 'Rental Houses', badge: houses.length },
          { id: 'hires', label: 'On Hire', badge: out.length },
          { id: 'days', label: 'Shoot Days', badge: shootDays.filter((day) => day.status === 'planned').length },
          { id: 'pictures', label: 'Pictures', badge: pictures.filter((film) => film.status !== 'abandoned').length },
          { id: 'owned', label: 'Your Own Kit', badge: owned.length },
        ]}
      />

      {tab === 'houses' && (
        open
          ? (
            <HouseCounter
              house={open}
              basket={basket}
              setBasket={setBasket}
              days={days}
              setDays={setDays}
              waiver={waiver}
              setWaiver={setWaiver}
              delivery={delivery}
              setDelivery={setDelivery}
              onBack={() => { setOpenId(null); setBasket({}); }}
              onHire={(payload) => {
                const result = run('kit.hire', payload);
                if (result.ok) {
                  setBasket({});
                  setOpenId(null);
                  setTab('hires');
                }
              }}
            />
          )
          : (
            <Panel title="Who Hires Kit Here" subtitle={`In ${cityName}, today`}>
              {houses.length === 0
                ? <Empty title="Nowhere Here" body="No house in this city hires camera kit. The nearest one is in a city that shoots." />
                : (
                  <div className="stack">
                    {houses.map((house) => (
                      <div key={house.id} className="card card-tight">
                        <div className="row-between">
                          <div>
                            <strong>{house.name}</strong>
                            <span className="chip" style={{ marginLeft: 8 }}>
                              {house.real ? 'Real House' : 'SLATE’s Own'}
                            </span>
                            <p className="small muted" style={{ margin: '4px 0 0' }}>{house.about}</p>
                            <p className="xs dim" style={{ margin: '4px 0 0' }}>
                              {linesOf(house).map((line) => RENTAL_LINE_LABEL[line]).join(' · ')}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => { setOpenId(house.id); setBasket({}); }}
                          >
                            Go To The Counter
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </Panel>
          )
      )}

      {tab === 'hires' && (
        <Panel title="Your Tickets" subtitle={cover ? 'Your own equipment cover is on file at the counter.' : 'No cover of your own, so the deposit is the full one.'}>
          {hires.length === 0
            ? <Empty title="Nothing Out" body="Hire something from a house and the ticket lives here until it goes back." />
            : (
              <div className="stack">
                {hires.map((hire) => (
                  <div key={hire.id} className="card card-tight">
                    <div className="row-between">
                      <div>
                        <strong>{hire.houseName}</strong>
                        <p className="small" style={{ margin: '2px 0 0' }}>{describeHire(sim, hire)}</p>
                        <p className="xs dim" style={{ margin: '4px 0 0' }}>
                          {hire.lines.map((line) => `${line.quantity > 1 ? `${line.quantity} × ` : ''}${line.name}`).join(', ')}
                        </p>
                        {hire.damage && <p className="xs warning" style={{ margin: '4px 0 0' }}>{hire.damage.note}</p>}
                      </div>
                      <div className="row gap-2">
                        {hire.status === 'booked' && (
                          <>
                            <button type="button" className="btn btn-sm btn-primary" onClick={() => run('kit.collect', { hireId: hire.id })}>
                              Collect It
                            </button>
                            <button type="button" className="btn btn-sm" onClick={() => run('kit.cancel', { hireId: hire.id })}>
                              Call It Off
                            </button>
                          </>
                        )}
                        {hire.status === 'out' && (
                          <>
                            <button type="button" className="btn btn-sm" onClick={() => run('kit.extend', { hireId: hire.id, days: 3 })}>
                              Three More Days
                            </button>
                            <button type="button" className="btn btn-sm btn-primary" onClick={() => run('kit.return', { hireId: hire.id })}>
                              Take It Back
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-4" style={{ marginTop: 10 }}>
                      <Stat label="Hire" value={formatMoney(hire.hire)} note={`${plural(hire.billedDays, 'billed day')} of ${plural(hire.days, 'day')}`} />
                      <Stat label="Deposit" value={formatMoney(hire.deposit)} note={hire.refunded === undefined ? 'Held by the house' : `${formatMoney(hire.refunded)} came back`} />
                      <Stat label="Back By" value={formatDate(hire.dueAt, sim.homeZone)} note={hire.lateFee ? `${formatMoney(hire.lateFee)} in late fees` : undefined} tone={hire.lateFee ? 'negative' : undefined} />
                    </div>
                  </div>
                ))}
              </div>
            )}
        </Panel>
      )}

      {tab === 'days' && <ShootDays days={shootDays} />}

      {tab === 'pictures' && <Pictures films={pictures} days={shootDays} />}

      {tab === 'owned' && (
        <Panel title="Kit You Own" subtitle="Bought outright, from the shops that sell it.">
          {owned.length === 0
            ? <Empty title="Nothing Of Your Own" body="Kit is on the Shopping page under Kit. Most of it is worth hiring rather than owning." />
            : (
              <div className="stack">
                {owned.map((asset) => (
                  <div key={asset.id} className="row-between">
                    <div>
                      <strong>{asset.name}</strong>
                      <p className="xs dim" style={{ margin: 0 }}>{asset.brand}</p>
                    </div>
                    <span className="small">{formatMoney(asset.currentValue)}</span>
                  </div>
                ))}
              </div>
            )}
        </Panel>
      )}
    </>
  );
}

/** The counter at one house: the shelf, the ticket, and what it comes to. */
function HouseCounter({
  house, basket, setBasket, days, setDays, waiver, setWaiver, delivery, setDelivery, onBack, onHire,
}: {
  house: Place;
  basket: Record<string, number>;
  setBasket: (next: Record<string, number>) => void;
  days: number;
  setDays: (days: number) => void;
  waiver: boolean;
  setWaiver: (on: boolean) => void;
  delivery: boolean;
  setDelivery: (on: boolean) => void;
  onBack: () => void;
  onHire: (payload: Record<string, unknown>) => void;
}) {
  const { sim } = useGame();
  const shelf = useWorld((s) => stockOf(s, house));
  const rates = useWorld((s) => Object.fromEntries(shelf.map((good) => [good.id, rateFor(s, house, good)])));
  const items = Object.entries(basket)
    .filter(([, quantity]) => quantity > 0)
    .map(([catalogId, quantity]) => ({ catalogId, quantity }));
  // The quote moves with the basket rather than with the world, so it is read
  // straight rather than through useWorld, which only recomputes on a tick.
  const quote = quoteFor(sim, house, items, days, { waiver, delivery });

  const groups = new Map<string, typeof shelf>();
  for (const good of shelf) {
    const key = good.subcategory ?? 'other';
    groups.set(key, [...(groups.get(key) ?? []), good]);
  }

  return (
    <>
      <Panel
        title={house.name}
        subtitle={house.about}
        actions={<button type="button" className="btn btn-sm" onClick={onBack}>Back To The Street</button>}
      >
        <p className="xs dim" style={{ margin: 0 }}>
          A rental week bills as {WEEK_BILLS_DAYS} days, which is why a Friday to Monday costs what a
          Friday does. Every figure is SLATE’s own calibration.
        </p>
      </Panel>

      {items.length > 0 && (
        <Panel title="The Ticket" subtitle={quote.note}>
          <div className="stack">
            {quote.lines.map((line) => (
              <div key={line.catalogId} className="row-between">
                <span>{line.quantity > 1 ? `${line.quantity} × ` : ''}{line.name}</span>
                <span className="small">{formatMoney(line.dayRate)} a day</span>
              </div>
            ))}
          </div>
          <div className="field-row" style={{ marginTop: 12 }}>
            <label htmlFor="hire-days">Days: {days}, billed as {quote.billedDays}</label>
            <input
              id="hire-days"
              type="range"
              min={1}
              max={30}
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            />
          </div>
          <div className="row gap-2" style={{ marginTop: 8 }}>
            {!quote.policy && (
              <label className="small row gap-2">
                <input type="checkbox" checked={waiver} onChange={(event) => setWaiver(event.target.checked)} />
                Take The House Waiver
              </label>
            )}
            <label className="small row gap-2">
              <input type="checkbox" checked={delivery} onChange={(event) => setDelivery(event.target.checked)} />
              Have It Delivered
            </label>
          </div>
          <div className="grid grid-4" style={{ marginTop: 10 }}>
            <Stat label="Hire" value={formatMoney(quote.hire)} note={`${formatMoney(quote.rate)} a day`} />
            <Stat label="Waiver" value={formatMoney(quote.waiver)} note={quote.policy ? 'Your own cover stands' : 'Optional'} />
            <Stat label="Delivery" value={formatMoney(quote.delivery)} note={delivery ? 'To the location' : 'You collect'} />
            <Stat label="Deposit" value={formatMoney(quote.deposit)} note="Held, not spent" />
            <Stat label="Due Now" value={formatMoney(quote.dueNow)} note="Deposit included" />
          </div>
          <div className="row gap-2" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onHire({
                houseId: house.id,
                items,
                days,
                waiver: quote.policy ? false : waiver,
                delivery,
              })}
            >
              Take The Ticket
            </button>
            <button type="button" className="btn" onClick={() => setBasket({})}>Clear It</button>
          </div>
        </Panel>
      )}

      {[...groups.entries()].map(([subcategory, goods]) => (
        <Panel key={subcategory} title={titleCaseLabel(subcategory)} tight>
          <div className="stack">
            {goods.map((good) => (
              <div key={good.id} className="row-between">
                <div>
                  <strong>{good.name}</strong>
                  <p className="xs dim" style={{ margin: 0 }}>{good.brand}</p>
                </div>
                <div className="row gap-2">
                  <span className="small">{formatMoney(rates[good.id] ?? 0)} a day</span>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setBasket({ ...basket, [good.id]: (basket[good.id] ?? 0) + 1 })}
                  >
                    Add
                  </button>
                  {(basket[good.id] ?? 0) > 0 && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => setBasket({ ...basket, [good.id]: Math.max(0, (basket[good.id] ?? 0) - 1) })}
                    >
                      Take Off ({basket[good.id]})
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </>
  );
}

/**
 * The days themselves: planning one, asking the place, ringing round, and
 * then shooting it. What you get out of a day is worked out from what was
 * true about it rather than rolled and narrated.
 */
function ShootDays({ days }: { days: ShootDay[] }) {
  const { sim, run } = useGame();
  const [title, setTitle] = useState('');
  const [inDays, setInDays] = useState(3);
  const [hours, setHours] = useState(STANDARD_HOURS);
  const [where, setWhere] = useState<'home' | 'place' | 'street'>('street');
  const [placeId, setPlaceId] = useState('');
  const [setups, setSetups] = useState(6);
  const [askOpen, setAskOpen] = useState<string | null>(null);
  const [role, setRole] = useState<CrewRole>('camera');
  const [whoId, setWhoId] = useState('');

  const locations = useWorld((s) => locationsIn(s));
  const people = useWorld((s) => askable(s));
  const now = useWorld((s) => s.now);
  const place = locations.find((one) => one.id === placeId);
  const cap = where === 'home' ? HOME_SETUPS : MAX_SETUPS;

  const plan = () => {
    const result = run('shoot.plan', {
      title,
      at: now + inDays * MS_DAY,
      hours,
      where,
      placeId: where === 'place' ? placeId : undefined,
      setups: Math.min(setups, cap),
    });
    if (result.ok) setTitle('');
  };

  return (
    <>
      <Panel title="Put A Day In The Diary" subtitle="A day is a place, some hours, and whoever you can talk into coming.">
        <div className="grid grid-2">
          <div>
            <label className="label" htmlFor="shoot-title">What The Day Is</label>
            <input
              id="shoot-title"
              className="input"
              value={title}
              maxLength={80}
              placeholder="The kitchen scene"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="shoot-when">In {plural(inDays, 'Day')}</label>
            <input id="shoot-when" type="range" min={0} max={30} value={inDays} onChange={(event) => setInDays(Number(event.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="shoot-hours">{plural(hours, 'Hour')} On The Day</label>
            <input id="shoot-hours" type="range" min={MIN_HOURS} max={MAX_HOURS} value={hours} onChange={(event) => setHours(Number(event.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="shoot-setups">{plural(Math.min(setups, cap), 'Setup')} Planned</label>
            <input id="shoot-setups" type="range" min={1} max={cap} value={Math.min(setups, cap)} onChange={(event) => setSetups(Number(event.target.value))} />
          </div>
        </div>

        <div className="label" style={{ marginTop: 10 }}>Where</div>
        <div className="row gap-2 wrap">
          {(['street', 'home', 'place'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={`btn btn-sm${where === option ? ' btn-primary' : ''}`}
              onClick={() => setWhere(option)}
            >
              {option === 'street' ? 'On The Street' : option === 'home' ? 'Your Own Place' : 'Somewhere You Ask'}
            </button>
          ))}
        </div>
        {where === 'place' && (
          <div style={{ marginTop: 8 }}>
            <label className="label" htmlFor="shoot-place">The Location</label>
            <select id="shoot-place" className="input" value={placeId} onChange={(event) => setPlaceId(event.target.value)}>
              <option value="">Pick somewhere</option>
              {locations.slice(0, 120).map((one) => (
                <option key={one.id} value={one.id}>{one.name}</option>
              ))}
            </select>
            {place && (
              <p className="xs dim" style={{ margin: '4px 0 0' }}>
                {place.about} They would want about {formatMoney(permissionFee(sim, place))} to let a camera in, and an answer takes a few days.
              </p>
            )}
          </div>
        )}
        <p className="xs dim" style={{ marginTop: 8 }}>
          {where === 'home'
            ? `Your own place carries ${plural(HOME_SETUPS, 'setup')} at the outside. It’s a flat, not a stage.`
            : where === 'street'
              ? 'Nobody owns the street, so nobody has to say yes. Somebody may still come and ask what you are doing.'
              : 'Somebody owns that room, and they answer in their own time.'}
        </p>
        <div className="row gap-2" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={title.trim().length < 3 || (where === 'place' && !placeId)}
            onClick={plan}
          >
            Put It In The Diary
          </button>
        </div>
      </Panel>

      {days.length === 0
        ? <Empty title="No Days Yet" body="A day in the diary is where a picture of your own actually starts." />
        : days.map((day) => {
          const yes = day.crew.filter((member) => member.answer === 'yes');
          const carry = capabilityOf(sim, day);
          return (
            <Panel key={day.id} title={day.title} subtitle={describeDay(sim, day)}>
              <div className="grid grid-4">
                <Stat label="Where" value={day.placeName} note={day.where === 'place' ? 'Somebody owns it' : day.where === 'home' ? 'Your own place' : 'The street'} />
                <Stat label="Hours" value={day.hours} note={`${plural(day.setups, 'setup')} planned`} />
                <Stat label="Coming" value={yes.length} note={yes.length > 0 ? yes.map((member) => CREW_ROLE_LABEL[member.role]).join(', ') : 'Nobody yet'} />
                <Stat
                  label={day.status === 'shot' ? 'In The Can' : 'The Day Could Carry'}
                  value={day.status === 'shot' ? `${day.got ?? 0} of ${day.setups}` : `${Math.round(carry * 100)}%`}
                  note={day.status === 'shot' ? undefined : 'Before the weather'}
                />
              </div>

              {day.permission.needed && (
                <p className="small" style={{ marginTop: 8 }}>
                  {day.permission.status === 'none' && `${day.placeName} hasn’t been asked. The fee is ${formatMoney(day.permission.fee)}, up front.`}
                  {day.permission.status === 'asked' && `Asked ${formatDate(day.permission.askedAt ?? day.at, sim.homeZone)}. Waiting.`}
                  {day.permission.status === 'granted' && day.permission.note}
                  {day.permission.status === 'refused' && `${day.permission.note} The fee came back.`}
                </p>
              )}
              {day.note && <p className="small" style={{ marginTop: 8 }}>{day.note}</p>}
              {day.crew.filter((member) => member.answer === 'no').map((member) => (
                <p key={member.personId} className="xs dim" style={{ margin: '2px 0 0' }}>{member.note}</p>
              ))}

              {day.status === 'planned' && (
                <div className="row gap-2 wrap" style={{ marginTop: 12 }}>
                  {day.permission.needed && day.permission.status === 'none' && (
                    <button type="button" className="btn btn-sm" onClick={() => run('shoot.ask_permission', { dayId: day.id })}>
                      Ask Them
                    </button>
                  )}
                  <button type="button" className="btn btn-sm" onClick={() => setAskOpen(askOpen === day.id ? null : day.id)}>
                    Ask Somebody To Come
                  </button>
                  {now >= day.at - 12 * 60 * 60_000 && now <= day.at + 2 * MS_DAY ? (
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => run('shoot.run', { dayId: day.id })}>
                      Shoot It
                    </button>
                  ) : (
                    <span className="xs dim">
                      {now < day.at ? `Nothing to shoot until ${formatDate(day.at, sim.homeZone)}.` : 'That day has gone by.'}
                    </span>
                  )}
                  <button type="button" className="btn btn-sm" onClick={() => run('shoot.abandon', { dayId: day.id })}>
                    Call It Off
                  </button>
                </div>
              )}

              {askOpen === day.id && (
                <div className="card card-tight" style={{ marginTop: 10 }}>
                  {people.length === 0
                    ? <p className="small" style={{ margin: 0 }}>You don’t know anybody well enough yet. Meet people first; a day is a favour, and favours need somebody to owe them to.</p>
                    : (
                      <div className="row gap-2 wrap">
                        <select className="input" value={whoId} onChange={(event) => setWhoId(event.target.value)} aria-label="Who To Ask">
                          <option value="">Who</option>
                          {people.map((person) => (
                            <option key={person.id} value={person.id}>{person.displayName}</option>
                          ))}
                        </select>
                        <select className="input" value={role} onChange={(event) => setRole(event.target.value as CrewRole)} aria-label="What They Would Do">
                          {CREW_ROLES.map((one) => (
                            <option key={one} value={one}>{CREW_ROLE_LABEL[one]}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={!whoId}
                          onClick={() => {
                            const result = run('shoot.ask_crew', { dayId: day.id, personId: whoId, role });
                            if (result.ok) setWhoId('');
                          }}
                        >
                          Ring Them
                        </button>
                      </div>
                    )}
                </div>
              )}
            </Panel>
          );
        })}
    </>
  );
}

/**
 * The picture: the days that went into it, the hours at the bench, and then
 * putting it in front of people. A festival is a form, a fee and a wait, and
 * the answer is what you made against how selective they are.
 */
function Pictures({ films, days }: { films: IndieFilm[]; days: ShootDay[] }) {
  const { sim, run } = useGame();
  const [title, setTitle] = useState('');
  const [logline, setLogline] = useState('');
  const [format, setFormat] = useState<FilmFormat>('short');
  const [roomFor, setRoomFor] = useState<string | null>(null);
  const [roomId, setRoomId] = useState('');
  const [sendFor, setSendFor] = useState<string | null>(null);
  const [festivalId, setFestivalId] = useState('');

  const rooms = useWorld((s) => roomsIn(s));
  const shot = days.filter((day) => day.status === 'shot');
  const taken = new Set(films.flatMap((film) => film.dayIds));

  return (
    <>
      <Panel title="Start Something" subtitle="A title, a line about what it is, and the shape it wants to be.">
        <div className="grid grid-2">
          <div>
            <label className="label" htmlFor="film-title">Title</label>
            <input id="film-title" className="input" value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="film-format">What It Is</label>
            <select id="film-format" className="input" value={format} onChange={(event) => setFormat(event.target.value as FilmFormat)}>
              {(['short', 'feature', 'documentary', 'animation'] as const).map((one) => (
                <option key={one} value={one}>
                  {FORMAT_LABEL[one]} · About {plural(SETUPS_NEEDED[one], 'Setup')}, Up To {RUNTIME_CAP[one]} Minutes
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="label" htmlFor="film-logline">The Line</label>
        <input
          id="film-logline"
          className="input"
          value={logline}
          maxLength={240}
          placeholder="Two people, one flat, one long night."
          onChange={(event) => setLogline(event.target.value)}
        />
        <div className="row gap-2" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={title.trim().length < 2}
            onClick={() => {
              const result = run('film.start', { title, logline, format });
              if (result.ok) { setTitle(''); setLogline(''); }
            }}
          >
            Start It
          </button>
        </div>
        <p className="xs dim" style={{ marginTop: 8 }}>{FESTIVAL_NOTE}</p>
      </Panel>

      {films.length === 0
        ? <Empty title="Nothing In Hand" body="A picture is days of shooting, hours at a bench, and then somewhere to put it." />
        : films.map((film) => {
          const got = setupsIn(sim, film);
          const wanted = cutHoursWanted(sim, film);
          const ceiling = ceilingOf(sim, film);
          // Days that are not in anything yet. Material goes into one picture,
          // so a day already in another one is not offered here.
          const unattached = shot.filter((day) => !taken.has(day.id));
          const room = rooms.find((one) => one.id === roomId);
          const open = festivalsFor(film.format);
          return (
            <Panel key={film.id} title={film.title} subtitle={describeFilm(sim, film)}>
              {film.logline && <p className="small" style={{ marginTop: 0 }}>{film.logline}</p>}
              <div className="grid grid-4">
                <Stat label="Kind" value={FORMAT_LABEL[film.format]} note={`Wants about ${plural(SETUPS_NEEDED[film.format], 'setup')}`} />
                <Stat label="In The Can" value={`${got} of ${SETUPS_NEEDED[film.format]}`} note={`${plural(film.dayIds.length, 'day')} shot`} />
                <Stat label="At The Bench" value={`${Math.round(film.cutHours)} of ${wanted}`} note="Hours" />
                <Stat
                  label={film.cut ? 'How It Came Out' : 'The Material Allows'}
                  value={film.cut ? film.cut.quality : ceiling}
                  note={film.cut ? `${film.cut.runtimeMinutes} minutes` : 'Out of a hundred'}
                />
              </div>
              {film.cut && <p className="small" style={{ marginTop: 8 }}>{film.cut.note}</p>}

              {film.status !== 'abandoned' && (
                <div className="row gap-2 wrap" style={{ marginTop: 12 }}>
                  {!film.cut && (
                    <>
                      <button type="button" className="btn btn-sm" onClick={() => run('film.cut', { filmId: film.id, hours: 6 })}>
                        Six Hours At The Bench
                      </button>
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => run('film.finish', { filmId: film.id })}>
                        Call It Finished
                      </button>
                    </>
                  )}
                  {film.cut && (
                    <>
                      <button type="button" className="btn btn-sm" onClick={() => { setRoomFor(roomFor === film.id ? null : film.id); setSendFor(null); }}>
                        Put On A Screening
                      </button>
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => { setSendFor(sendFor === film.id ? null : film.id); setRoomFor(null); }}>
                        Send It Somewhere
                      </button>
                    </>
                  )}
                  <button type="button" className="btn btn-sm" onClick={() => run('film.abandon', { filmId: film.id })}>
                    Leave It In The Drawer
                  </button>
                </div>
              )}

              {!film.cut && unattached.length > 0 && (
                <div className="card card-tight" style={{ marginTop: 10 }}>
                  <div className="label">Days Not In It Yet</div>
                  {unattached.map((day) => (
                    <div key={day.id} className="row-between">
                      <span className="small">{day.title} · {day.got ?? 0} of {plural(day.setups, 'setup')}</span>
                      <button type="button" className="btn btn-sm" onClick={() => run('film.attach_day', { filmId: film.id, dayId: day.id })}>
                        Put It In
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {roomFor === film.id && (
                <div className="card card-tight" style={{ marginTop: 10 }}>
                  <label className="label" htmlFor={`room-${film.id}`}>The Room</label>
                  <select id={`room-${film.id}`} className="input" value={roomId} onChange={(event) => setRoomId(event.target.value)}>
                    <option value="">Your own place, for nothing</option>
                    {rooms.slice(0, 40).map((one) => (
                      <option key={one.id} value={one.id}>{one.name}</option>
                    ))}
                  </select>
                  <p className="xs dim" style={{ margin: '4px 0 0' }}>
                    {room
                      ? `${room.name} is about ${formatMoney(roomCost(sim.player.currentLocationId, room.price))} for the evening.`
                      : 'Your own place costs nothing and holds whoever fits.'}
                  </p>
                  <div className="row gap-2" style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        const result = run('film.screen', { filmId: film.id, placeId: roomId || undefined });
                        if (result.ok) setRoomFor(null);
                      }}
                    >
                      Show It
                    </button>
                  </div>
                </div>
              )}

              {sendFor === film.id && (
                <div className="card card-tight" style={{ marginTop: 10 }}>
                  <label className="label" htmlFor={`fest-${film.id}`}>Where To Send It</label>
                  <select id={`fest-${film.id}`} className="input" value={festivalId} onChange={(event) => setFestivalId(event.target.value)}>
                    <option value="">Pick a festival</option>
                    {open.map((festival) => (
                      <option key={festival.id} value={festival.id}>
                        {festival.name} · {formatMoney(entryFee(festival))} · {festival.selectivity >= 90 ? 'Almost nobody gets in' : festival.selectivity >= 80 ? 'Hard' : 'Worth a try'}
                      </option>
                    ))}
                  </select>
                  <div className="row gap-2" style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      disabled={!festivalId}
                      onClick={() => {
                        const result = run('film.submit', { filmId: film.id, festivalId });
                        if (result.ok) { setSendFor(null); setFestivalId(''); }
                      }}
                    >
                      Send It
                    </button>
                  </div>
                </div>
              )}

              {film.screenings.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div className="label">Screenings</div>
                  {film.screenings.map((screening) => (
                    <p key={screening.id} className="xs dim" style={{ margin: '2px 0 0' }}>
                      {formatDate(screening.at, sim.homeZone)}, {screening.placeName}
                      {screening.cost > 0 ? ` (${formatMoney(screening.cost)})` : ''}: {screening.note}
                    </p>
                  ))}
                </div>
              )}
              {film.submissions.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div className="label">Sent To</div>
                  {film.submissions.map((submission) => (
                    <p key={submission.id} className="xs dim" style={{ margin: '2px 0 0' }}>
                      {submission.festivalName} ({formatMoney(submission.fee)}): {submission.status === 'sent'
                        ? `waiting, an answer by ${formatDate(submission.answerAt, sim.homeZone)}`
                        : `${submission.status === 'accepted' ? 'in' : 'passed'} — ${submission.note ?? ''}`}
                    </p>
                  ))}
                </div>
              )}
            </Panel>
          );
        })}
    </>
  );
}
