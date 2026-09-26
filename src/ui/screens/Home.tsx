/**
 * SLATE — HOME.
 *
 * Immediate life. Where am I, what day is it, what happens next, what needs
 * attention, how am I doing. A command surface, not a place to bury depth.
 */

import { formatDaylight } from '@/engine/core/sun';
import { RATES_NOTE, formatAtlasCompact} from '@/engine/content/currency';
import { titleCaseLabel } from '@/engine/core/text';
import { placeProfile, placeKindLabel, formatPeople, type PlaceProfile } from '@/engine/world/place';
import { WEATHER_EMOJI, forecastFor, weatherAt, weatherShort } from '@/engine/systems/weather';
import { MS_DAY, WEEKDAY_NAMES } from '@/engine/core/time';
import { PERFORMER_NOUN } from '@/engine/core/performer';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, MoneyText, Empty } from '@/ui/components/primitives';
import { openDecisions, lifeSnapshot, unreadNotifications } from '@/engine/world/world';
import { entriesBetween, nextCommitment, upcoming } from '@/engine/world/calendar';
import { netWorth } from '@/engine/systems/finance';
import { readiness, wellbeingSummary } from '@/engine/systems/life';
import { CITIES } from '@/engine/content/geography';
import {
  dateKey, formatDate, formatRelative, formatTime, formatWeekdayDate, seasonOf, zoneAbbreviation,
} from '@/engine/core/time';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { scoreIsANumberIn, scoreWord } from '@/engine/systems/credit';
import { HOUSING, SOFA, arrearsOf, billsOf, inTheBank, moveCost, rentOf } from '@/engine/systems/household';
import { LookRegion, Open, at } from '@/ui/looks';
import { Gated, LockedPanel, useFeature } from '@/ui/guide/Guide';

export function Home() {
  const { sim, navigate, run } = useGame();
  const snapshot = useWorld(lifeSnapshot);
  const decisions = useWorld(openDecisions);
  const next = useWorld(nextCommitment);
  const soon = useWorld((s) => upcoming(s, 6));
  const worth = useWorld((s) => netWorth(s, s.player.id));
  const cur = saveCurrency(sim.universe);
  const unread = useWorld(unreadNotifications);
  // What still weighs with nothing to decide: rent owed, a notice, a clash in
  // the next month. "All Clear" was said over all three.
  const weighing = useWorld((s) => {
    const owed = arrearsOf(s, s.player);
    const notice = s.player.home?.noticeUntil;
    const clash = entriesBetween(s, s.now, s.now + 30 * MS_DAY).some((e) => e.conflicted);
    const cur = saveCurrency(s.universe);
    const said: string[] = [];
    if (notice !== undefined) said.push(`A notice to pay or quit runs until ${formatDate(notice, s.zone)}.`);
    if (owed > 0) said.push(`You owe your landlord ${formatMoney(owed, cur, { cents: false })}.`);
    if (clash) said.push('Two things on your calendar in the next month want you at once.');
    return said;
  });

  const player = snapshot.player;
  const city = snapshot.city ?? CITIES.get(player.currentLocationId);
  const ready = readiness(player);
  const accounts = useWorld((s) => s.ledger.accountsOf(s.player.id));
  const primary = accounts.find((a) => a.id === player.primaryAccountId) ?? accounts[0];
  const place = city ? placeProfile(sim, city.id) : undefined;
  const today = dateKey(sim.now, sim.zone);
  const season = seasonOf(sim.now, sim.zone, city?.latitude ?? 34);
  const weather = city ? weatherAt(sim, city.id) : undefined;
  const week = city ? forecastFor(sim, city.id, 6) : [];
  const unit = weather?.fahrenheit ? '°F' : '°C';
  // Each panel opens with its chapter in the guide (`content/tutorial.ts`).
  const shows = {
    calendar: useFeature('ui.calendar').open,
    needs: useFeature('ui.needs').open,
    how: useFeature('ui.how').open,
    where: useFeature('ui.where').open,
    weather: useFeature('ui.weather').open,
    money: useFeature('ui.money').open,
    home: useFeature('ui.home').open,
  };

  return (
    <>
      {/*
        Six nouns in three lines, and until now not one of them opened: the
        date, your title, your own name, the city, the season and the sky.
        Each names the thing it is, and the thing knows what it opens into.
      */}
      <LookRegion className="page-head">
        <div className="eyebrow">
          <Open subject={at('day', today)}>{formatWeekdayDate(sim.now, sim.zone)}</Open>
          {' · '}
          <Open subject={at('person', player.id)}>{PERFORMER_NOUN[player.performerTitle]}</Open>
        </div>
        <h1>
          Good {partOfDay(sim.now, sim.zone)},{' '}
          <Open subject={at('person', player.id)}>{calledBy(player)}</Open>.
        </h1>
        <p className="muted">
          <Open subject={at('day', today)}>{formatTime(sim.now, sim.zone)}</Open> in{' '}
          {city ? <Open subject={at('place', city.id)}>{city.name}</Open> : 'an unknown place'} ·{' '}
          {city
            ? <Open subject={at('place', city.id)}>{zoneAbbreviation(sim.now, sim.zone)}</Open>
            : zoneAbbreviation(sim.now, sim.zone)} ·{' '}
          {city
            ? <Open subject={at('season', `${city.id}/${season}`)}>{season}</Open>
            : season}
          {weather && city && (
            <>
              {' · '}
              <span aria-hidden="true">{WEATHER_EMOJI[weather.condition]}</span>
              {' '}
              <Open subject={at('weather', city.id)}>
                {weather.temperature}{unit} {titleCaseLabel(weather.condition)}
              </Open>
            </>
          )}
        </p>
      </LookRegion>

      {/*
        The calendar is a section of the hub rather than a tile pointing at
        one. What is coming is part of standing in the day, not somewhere else
        to go, and it reads that way at the top of Home. One button into the
        month, in the header: there used to be three, all going to the same
        screen.
      */}
      {!shows.calendar ? <LockedPanel feature="ui.calendar" title="Calendar" /> : (
      <Panel
        look={at('day', today)}
        title="Calendar"
        subtitle={next ? 'What is coming, and when.' : undefined}
        actions={(
          <Gated feature="ui.open-calendar" className="btn btn-sm btn-primary" onClick={() => navigate('/workspace/calendar', 'Calendar')}>
            Open Calendar
          </Gated>
        )}
      >
        <LookRegion>
          {next ? (
            <div className="stat">
              <span className="stat-label">
                <Open subject={at('entry', next.id)}>{formatRelative(next.at, sim.now)}</Open>
              </span>
              <span className="stat-value" style={{ fontSize: 'var(--size-md)' }}>
                <Open subject={at('entry', next.id)}>{titleCaseLabel(next.title)}</Open>
              </span>
              <span className="stat-note">
                <Open subject={at('day', dateKey(next.at, sim.zone))}>{formatDate(next.at, sim.zone)}</Open>
                {' at '}
                <Open subject={at('entry', next.id)}>{formatTime(next.at, sim.zone)}</Open>
                {next.locationId && next.locationId !== player.currentLocationId && (
                  <span className="negative">
                    {' · you’re not in '}
                    <Open subject={at('place', next.locationId)}>{CITIES.get(next.locationId)?.name ?? 'that place'}</Open>
                  </span>
                )}
              </span>
            </div>
          ) : (
            <p className="muted small" style={{ margin: 0 }}>
              No plans or commitments ahead. <Open subject={at('day', today)}>The day</Open> is yours.
            </p>
          )}

          {soon.some((entry) => entry.id !== next?.id) && (
            <>
              <hr className="divider" />
              <div className="col gap-2">
                {soon.filter((entry) => entry.id !== next?.id).slice(0, 5).map((entry) => (
                  <div key={entry.id} className="row-between">
                    <span className="small truncate">
                      <Open subject={at('entry', entry.id)}>{titleCaseLabel(entry.title)}</Open>
                    </span>
                    <span className="xs dim nowrap">
                      <Open subject={at('entry', entry.id)}>{formatRelative(entry.at, sim.now)}</Open>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </LookRegion>
      </Panel>
      )}

      <div className="grid grid-2" style={{ marginBottom: 'var(--s5)' }}>
        {!shows.needs ? <LockedPanel feature="ui.needs" title="What Needs You" /> : (
        <Panel
          title="What Needs You"
          subtitle={decisions.length === 0 ? 'No decision is waiting on you.' : `${decisions.length} open`}
          flush
          actions={unread.length > 0 ? (
            <Gated feature="world.mark_read" className="btn btn-ghost btn-sm" onClick={() => run('world.mark_read')}>
              Mark {unread.length} Read
            </Gated>
          ) : undefined}
        >
          {decisions.length === 0 && unread.length === 0 ? (
            weighing.length === 0 ? (
              <Empty
                title="All Clear"
                body="You’re not late for anything, you owe nobody rent, and the calendar doesn’t clash. Go and do something you want to do."
              />
            ) : (
              <Empty title="No Decisions Waiting" body={weighing.join(' ')} />
            )
          ) : (
            <LookRegion className="list">
              {decisions.slice(0, 6).map((decision) => (
                <div
                  key={decision.id}
                  className="decision"
                  data-urgency={decision.urgency >= 85 ? 'critical' : decision.urgency >= 65 ? 'high' : 'normal'}
                >
                  <div className="decision-urgency" aria-hidden="true" />
                  <div className="grow">
                    <div className="row-between">
                      <span className="small strong">
                        <Open subject={at('decision', decision.id)}>{titleCaseLabel(decision.title)}</Open>
                      </span>
                      {decision.dueAt !== undefined && (
                        <span className={`xs ${decision.dueAt < sim.now ? 'negative' : 'dim'}`}>
                          <Open subject={at('decision', decision.id)}>
                            {decision.dueAt < sim.now ? 'Overdue' : formatRelative(decision.dueAt, sim.now)}
                          </Open>
                        </span>
                      )}
                    </div>
                    <p className="xs muted" style={{ margin: '2px 0 0' }}>{decision.detail}</p>
                    <div className="row gap-2 wrap" style={{ marginTop: 'var(--s2)' }}>
                      {decision.actions.map((action, index) => (
                        <Gated
                          key={action.label}
                          feature="world.take_decision_action"
                          className="btn btn-sm btn-primary"
                          onClick={() => run('world.take_decision_action', { decisionId: decision.id, actionIndex: index })}
                        >
                          {action.label}
                        </Gated>
                      ))}
                      {decision.route && (
                        <button className="btn btn-sm" onClick={() => navigate(decision.route!)}>
                          Go There
                        </button>
                      )}
                      <Gated
                        feature="world.dismiss_decision"
                        className="btn btn-ghost btn-sm"
                        onClick={() => run('world.dismiss_decision', { decisionId: decision.id })}
                      >
                        Dismiss
                      </Gated>
                    </div>
                  </div>
                </div>
              ))}
              {decisions.length > 6 && (
                <div className="xs dim" style={{ padding: 'var(--s3) var(--s4)' }}>
                  {decisions.length - 6} more waiting.
                </div>
              )}
            </LookRegion>
          )}
          {unread.length > 0 && (
            <LookRegion className="list">
              {unread.slice(0, 6).map((note) => (
                <div key={note.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">
                      <Open subject={at('notification', note.id)}>{titleCaseLabel(note.title)}</Open>
                    </div>
                    <div className="xs muted">{note.body}</div>
                  </div>
                  <span className="xs dim nowrap">
                    <Open subject={at('notification', note.id)}>{formatRelative(note.at, sim.now)}</Open>
                  </span>
                  {note.route && (
                    <button
                      className="btn btn-sm"
                      onClick={() => navigate(note.route!, titleCaseLabel(note.title))}
                    >
                      Go There
                    </button>
                  )}
                </div>
              ))}
            </LookRegion>
          )}
        </Panel>
        )}

        <div className="col gap-4">
          {!shows.how ? <LockedPanel feature="ui.how" title="How You Are" /> : (
          <Panel title="How You Are" tight look={at('person', player.id)}>
            {/*
              The summary names you, and the three bars name their dials, so
              each is the way into itself. Six more dials are simulated every
              hour and have never been on a screen — they are behind the
              person, one press away, rather than crowded onto this panel.
            */}
            <LookRegion>
              <p className="small muted" style={{ marginBottom: 'var(--s3)' }}>
                <Open subject={at('person', player.id)}>{wellbeingSummary(player)}</Open>
              </p>
              <div className="col gap-3">
                <Meter label="Energy" value={player.wellbeing.energy} look={at('dial', `${player.id}/energy`)} />
                <Meter label="Stress" value={player.wellbeing.stress} invert look={at('dial', `${player.id}/stress`)} />
                <Meter label="Readiness" value={ready} look={at('readiness', player.id)} />
              </div>
            </LookRegion>
          </Panel>
          )}

          {!shows.where && <LockedPanel feature="ui.where" title="Where You Are" />}
          {place && shows.where && (
            <Panel title="Where You Are" tight look={at('place', place.city.id)}>
              <LookRegion>
                <div className="strong">
                  <Open subject={at('place', place.city.id)}>{place.city.name}</Open>
                  {place.regionName && (
                    <>
                      {', '}
                      <Open subject={at('region', place.city.parentId)}>{place.regionName}</Open>
                    </>
                  )}
                  {' · '}
                  <Open subject={at('country', place.city.countryId)}>{place.countryName}</Open>
                </div>
                <div className="xs dim" style={{ marginBottom: 'var(--s3)' }}>
                  <Open subject={at('place', place.city.id)}>
                    {place.away && place.homeCity
                      ? `${place.distanceFromHome} from home in ${place.homeCity.name}${place.hoursFromHome ? ` · ${place.hoursFromHome > 0 ? '+' : ''}${place.hoursFromHome}h from home time` : ''}.`
                      : 'Home.'}
                    {placeLine(place) && ` ${placeLine(place)}.`}
                  </Open>
                </div>
                <div className="grid grid-3">
                <Stat
                  label="Local Time"
                  value={place.localTime}
                  note={`${place.zoneAbbreviation}${place.away && place.hoursFromHome ? ` · ${place.hoursFromHome > 0 ? '+' : ''}${place.hoursFromHome}h from home` : ''}`}
                  look={at('day', today)}
                />
                <Stat
                  label="Daylight"
                  value={place.sun.polar === 'day' ? 'Midnight Sun' : place.sun.polar === 'night' ? 'Polar Night'
                    : `${formatTime(place.sun.sunrise ?? sim.now, place.zone)} – ${formatTime(place.sun.sunset ?? sim.now, place.zone)}`}
                  note={`${formatDaylight(place.sun.daylightMinutes)} of light`}
                  look={at('daylight', place.city.id)}
                />
                <Stat
                  label="Currency"
                  value={`${place.currency.symbol} ${place.currency.code}`}
                  note={`${place.currency.name}${place.currency.unitsPerUsd !== undefined && place.currency.code !== 'USD' ? ` · ${place.currency.unitsPerUsd} per $1` : ''}`}
                  look={at('currency', place.currency.code)}
                />
                <Stat
                  label="Cost Of Living"
                  value={place.costOfLivingIndex}
                  note={`A one-bedroom about ${place.localRent ?? formatAtlasCompact(place.medianRentCents)}/mo`}
                  look={at('place', place.city.id)}
                />
                <Stat
                  label="Tax On A Wage"
                  value={`${Math.round(place.effectiveIncomeTax * 100)}%`}
                  note="Income tax and payroll both, on a US$60,000 wage"
                  look={at('place', place.city.id)}
                />
                <Stat
                  label="Sales Tax"
                  value={`${(place.salesTax * 100).toFixed(1)}%`}
                  note={`Property ${(place.propertyTax * 100).toFixed(2)}%`}
                  look={at('place', place.city.id)}
                />
                <Stat
                  label="Industry"
                  value={`${place.industryPresence}/100`}
                  note="Film and Television work here"
                  look={at('place', place.city.id)}
                />
                <Stat
                  label="Languages"
                  value={place.languages[0] ?? '—'}
                  note={place.languages.slice(1).join(', ') || 'Official language'}
                  look={at('country', place.city.countryId)}
                />
                <Stat
                  label={place.countryName}
                  value={place.capital || place.continent}
                  note={`${place.continent} · ${place.countryPopulation >= 1_000_000 ? `${(place.countryPopulation / 1_000_000).toFixed(1)}M people` : `${place.countryPopulation.toLocaleString('en-US')} people`}${place.phone ? ` · +${place.phone}` : ''}`}
                  look={at('country', place.city.countryId)}
                />
                </div>
                <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>
                  <Open subject={at('country', place.city.countryId)}>
                    Drives on the {place.drivesOn}. Distances in {place.units.distance === 'mi' ? 'miles' : 'kilometers'}, temperatures in °{place.units.temperature}.
                  </Open>
                  {place.currency.code !== 'USD' ? (
                    <>
                      {' '}
                      <Open subject={at('currency', place.currency.code)}>{RATES_NOTE}</Open>
                    </>
                  ) : ''}
                </p>
              </LookRegion>
            </Panel>
          )}

          {!shows.weather && <LockedPanel feature="ui.weather" title="Weather" />}
          {weather && city && shows.weather && (
            <Panel title="Weather" tight look={at('weather', city.id)}>
              {/*
                Every day in the strip is its own moment and opens as one. The
                climate band used to sit in the header as a chip that did
                nothing; it is a face of the sky now, one press inside it, so
                the header carries no control at all.
              */}
              <LookRegion>
                <div className="weather-now">
                  <div className="grow">
                    <div className="weather-temp mono">
                      <span aria-hidden="true" style={{ marginRight: 8 }}>{WEATHER_EMOJI[weather.condition]}</span>
                      <Open subject={at('weather', city.id)}>{weather.temperature}{unit}</Open>
                    </div>
                    <div className="small muted">
                      <Open subject={at('weather', city.id)}>
                        {titleCaseLabel(weather.condition)} · High {weather.high}{unit} · Low {weather.low}{unit}
                      </Open>
                    </div>
                    <div className="xs dim">
                      <Open subject={at('weather', city.id)}>
                        Humidity {weather.humidity}% · Wind {weather.fahrenheit ? `${Math.round(weather.windKph * 0.621)} mph` : `${weather.windKph} km/h`}
                      </Open>
                      {' · '}<Open subject={at('weather', city.id)}>{weather.climateName}</Open>
                    </div>
                  </div>
                </div>
                <div className="weather-week" aria-label="The Days Ahead">
                  {week.slice(1).map((day) => {
                    const [y, m, d] = day.dateKey.split('-').map(Number);
                    const weekday = WEEKDAY_NAMES[new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1)).getUTCDay()] ?? '';
                    return (
                      <div key={day.dateKey} className="weather-day">
                        <div className="xs dim">
                          <Open subject={at('forecastday', `${city.id}/${day.dateKey}`)}>{weekday.slice(0, 3)}</Open>
                        </div>
                        <div aria-hidden="true">{WEATHER_EMOJI[day.condition]}</div>
                        <div className="xs weather-cond">
                          <Open subject={at('forecastday', `${city.id}/${day.dateKey}`)}>{weatherShort(day.condition)}</Open>
                        </div>
                        <div className="xs mono">
                          <Open subject={at('forecastday', `${city.id}/${day.dateKey}`)}>{day.high}° / {day.low}°</Open>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </LookRegion>
            </Panel>
          )}
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 'var(--s5)' }}>
        {!shows.money ? <LockedPanel feature="ui.money" title="Money" /> : (
        <Panel
          title="Money"
          tight
          look={at('networth', player.id)}
          actions={(
            <Gated feature="ui.bank" className="btn btn-sm" onClick={() => navigate('/workspace/bank', 'Your Bank')}>
              {primary?.institution ?? 'Your Bank'}
            </Gated>
          )}
        >
          <LookRegion className="col gap-3">
            <Stat
              label={primary?.name ?? 'No account'}
              value={<MoneyText amount={primary?.balance ?? 0} currency={cur} />}
              note={`Your money is kept in ${cur}`}
              look={primary ? at('account', primary.id) : undefined}
            />
            <Stat
              label="Net Worth"
              value={<MoneyText amount={worth.total} currency={cur} compact />}
              note={`${formatMoney(worth.cash, cur, { cents: false })} in the bank${worth.held > 0 ? `, ${formatMoney(worth.held, cur, { cents: false })} held as a deposit` : ''}${worth.pension > 0 ? `, ${formatMoney(worth.pension, cur, { cents: false })} in a pension` : ''}`}
              look={at('networth', player.id)}
            />
            {worth.liabilities > 0 && (
              <Stat
                label="Owed"
                value={<span className="mono negative">{formatMoney(worth.liabilities, cur, { cents: false })}</span>}
                look={at('debt', player.id)}
              />
            )}
            <CardControls cur={cur} />
          </LookRegion>
        </Panel>
        )}
        {!shows.home ? <LockedPanel feature="ui.home" title="Home" /> : (
        <Panel title="Home" tight>
          <YourHome cur={cur} />
        </Panel>
        )}
      </div>
    </>
  );
}

/**
 * The home, run by hand: where they live, what it costs, any notice standing,
 * and moving (`home.move`), with what moving takes from the bank. It was
 * Work And Home until 2026-09-26, with the day job's week, extra shifts,
 * hours, quitting and looking for work above it; the job engine went.
 */
function YourHome({ cur }: { cur: string }) {
  const { sim, run } = useGame();
  const home = useWorld((s) => s.player.home);
  const rent = useWorld((s) => rentOf(s, s.player));
  const bills = useWorld((s) => billsOf(s, s.player));
  const costs = useWorld((s) => ({ shared: moveCost(s, s.player, 'shared'), own: moveCost(s, s.player, 'own') }));
  const money = (cents: number) => formatMoney(cents, cur, { cents: false });
  const homeLabel = home ? (home.kind === 'sofa' ? SOFA.label : HOUSING[home.kind].label) : 'Nowhere';
  return (
    <div className="col gap-3">
      <Stat
        label="Where You Sleep"
        value={homeLabel}
        note={home?.kind === 'sofa' ? SOFA.note : `${money(rent + bills)} a month on the first: ${money(rent)} rent and ${money(bills)} bills`}
      />
      {home?.noticeUntil !== undefined && (
        <div className="callout callout-warning small">
          A notice to pay or quit runs until {formatDate(home.noticeUntil, sim.zone)}. Get what you owe under a month’s rent by then.
        </div>
      )}
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        {home?.kind !== 'shared' && (
          <Gated feature="home.move" className="btn btn-sm btn-ghost" onClick={() => run('home.move', { kind: 'shared' })}>
            Move Into A Room ({money(costs.shared)})
          </Gated>
        )}
        {home?.kind !== 'own' && (
          <Gated feature="home.move" className="btn btn-sm btn-ghost" onClick={() => run('home.move', { kind: 'own' })}>
            Get A Place Of Your Own ({money(costs.own)})
          </Gated>
        )}
      </div>
    </div>
  );
}

/**
 * The card, run by hand: pay it off now, and whether autopay clears the
 * whole statement or only the minimum (`systems/credit.ts`). And the record
 * a lender reads, as a number where lenders use one and a word elsewhere.
 */
function CardControls({ cur }: { cur: string }) {
  const { sim, run } = useGame();
  const card = useWorld((s) => Object.values(s.universe.accounts).find((a) => a.ownerId === s.player.id && a.kind === 'credit_card' && !a.closedAt));
  const credit = useWorld((s) => s.player.credit);
  const owed = card ? Math.max(0, -card.balance) : 0;
  // What pressing it pays: all of it, or as much as the bank holds.
  const payable = useWorld((s) => Math.min(owed, inTheBank(s, s.player)));
  if (!credit) return null;
  const record = scoreIsANumberIn(sim.player.currentLocationId) ? String(credit.score) : scoreWord(credit.score);
  return (
    <>
      <Stat label="Credit Record" value={record} note={card?.apr !== undefined ? `The card charges ${(card.apr * 100).toFixed(2)}% a year on what's carried` : undefined} />
      {card && (
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Gated feature="finance.pay_card" className="btn btn-sm" disabled={payable === 0} onClick={() => run('finance.pay_card', { amount: 'full' })}>
            {payable < owed ? 'Pay What You Can' : 'Pay Card In Full'} ({formatMoney(payable, cur, { cents: false })})
          </Gated>
          <Gated
            feature="finance.set_autopay"
            className="btn btn-sm btn-ghost"
            onClick={() => run('finance.set_autopay', { mode: credit.autopay === 'full' ? 'minimum' : 'full' })}
          >
            Autopay: {credit.autopay === 'full' ? 'The Whole Statement' : 'The Minimum'}
          </Gated>
        </div>
      )}
    </>
  );
}

function partOfDay(instant: number, zone: string): string {
  const hour = Number(formatTime(instant, zone).split(':')[0]) % 12;
  const isPm = formatTime(instant, zone).includes('PM');
  const h24 = isPm ? (hour === 0 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
  if (h24 < 5) return 'Night';
  if (h24 < 12) return 'Morning';
  if (h24 < 18) return 'Afternoon';
  return 'Evening';
}


/** What kind of place this is: its tags if SLATE has them, else its kind and its size. */
function placeLine(place: PlaceProfile): string {
  if (place.tags.length > 0) return place.tags.map(titleCaseLabel).join(' · ');
  const parts = [placeKindLabel(place.city), place.cityPopulation > 0 ? `${formatPeople(place.cityPopulation)} people` : undefined];
  return parts.filter((p): p is string => !!p).join(' · ');
}

/**
 * What they're called day to day: the preferred name Identity asks for, and
 * their first name when they gave none. The greeting used the first name
 * whatever they'd said.
 */
function calledBy(person: { firstName: string; lastName: string; middleName?: string; displayName: string }): string {
  const full = [person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ');
  const plain = `${person.firstName} ${person.lastName}`;
  return person.displayName && person.displayName !== full && person.displayName !== plain ? person.displayName : person.firstName;
}
