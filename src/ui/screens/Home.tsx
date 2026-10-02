/**
 * SLATE — HOME.
 *
 * Immediate life. Where am I, what day is it, what happens next, what needs
 * attention, how am I doing. A command surface, not a place to bury depth.
 */

import { modelById, vehiclesOf } from '@/engine/systems/vehicles';
import { landValue, parcelsOf } from '@/engine/systems/land';
import { inSaveMoney } from '@/engine/systems/banking';
import { LAND_MARKETS } from '@/engine/content/land';
import { journeysOf } from '@/engine/systems/journey';
import { formatDaylight } from '@/engine/core/sun';
import { RATES_NOTE, formatAtlasCompact} from '@/engine/content/currency';
import { titleCaseLabel } from '@/engine/core/text';
import { placeProfile, placeKindLabel, formatPeople, type PlaceProfile } from '@/engine/world/place';
import { WEATHER_EMOJI, forecastFor, weatherAt, weatherShort } from '@/engine/systems/weather';
import { MS_DAY, WEEKDAY_NAMES, formatDateTime, zonedParts } from '@/engine/core/time';
import { PERFORMER_NOUN } from '@/engine/core/performer';
import { Children, useState, type ReactNode } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, MoneyText, Empty } from '@/ui/components/primitives';
import { openDecisions, lifeSnapshot, unreadNotifications } from '@/engine/world/world';
import { entriesBetween, nextCommitment, upcoming } from '@/engine/world/calendar';
import { netWorth } from '@/engine/systems/finance';
import { readiness, wellbeingSummary, EMPTY, OVERWROUGHT } from '@/engine/systems/life';
import { CITIES } from '@/engine/content/geography';
import { OWN_UNITS_IN, PORTABLE_LABEL, applianceCost, portableCost, portableRefusal, unitsRefusal, type Portable } from '@/engine/systems/appliances';
import {
  dateKey, formatDate, formatRelative, formatTime, formatWeekdayDate, seasonOf, zoneAbbreviation,
} from '@/engine/core/time';
import { formatMoney, saveCurrency, centsFromTyped } from '@/engine/core/money';
import { cardOf, cardsOf, cardTerms, scoreIsANumberIn, scoreWord, stateOf } from '@/engine/systems/credit';
import { HOUSING, OWNED, SOFA, arrearsOf, billsOf, depositBack, moveCost, moveRefusal, rentOf, troubles } from '@/engine/systems/household';
import { wasteFeeOf } from '@/engine/systems/waste';
import { latePenalty } from '@/engine/systems/taxreturn';
import { LookRegion, Open, at } from '@/ui/looks';
import { YALE_DRAMA } from '@/engine/content/school';
import { STANDING_LABEL, nextClasses, rankIn, yearOfStudy } from '@/engine/systems/school';
import { agencyById } from '@/engine/systems/career';
import { COVER_LABEL, coverOn } from '@/engine/systems/health';
import { Gated, LockedPanel, useFeature } from '@/ui/guide/Guide';
import { resolveIncomeTaxLayers } from '@/engine/content/tax';
import { homeOf } from '@/engine/systems/earnings';
import { TIDY, cleanerCost, livingOf, placeOf, rentersPremium } from '@/engine/systems/dwelling';
import { cleanOutfits, dryCleanDirty, garmentsOf, washableDirty } from '@/engine/systems/wardrobe';
import { COOLING_LABEL, GYM_LABEL, LAUNDRY_LABEL, OUTDOOR_LABEL, typeLabel } from '@/engine/content/homes';
import { alarmRefusal, alarmed } from '@/engine/systems/alarm';
import { deviceCost, securityRefusal, type Device } from '@/engine/systems/homesecurity';
import { chargerQuote } from '@/engine/systems/charging';
import { billedApart, internetIn, internetShare, leavingCost, telecomOf } from '@/engine/systems/telecom';
import { levelOf } from '@/engine/systems/people';
import { kitchenStock } from '@/engine/systems/kitchen';
import { mealsReady } from '@/engine/systems/pantry';
import { groupLabelOf } from '@/ui/shell/destinations';
import { underWay } from '@/engine/systems/underway';
import { MACHINE_LABEL, faultsOf, repairBill, repairRefusal, type Machine } from '@/engine/systems/appliancefaults';
import { rentersCouncilTax, sizeText } from '@/engine/systems/homes';

export function Home() {
  const { sim, navigate, run } = useGame();
  const snapshot = useWorld(lifeSnapshot);
  const decisions = useWorld(openDecisions);
  const next = useWorld(nextCommitment);
  const soon = useWorld((s) => upcoming(s, 6));
  const worth = useWorld((s) => netWorth(s, s.player.id));
  const cur = saveCurrency(sim.universe);
  const unread = useWorld(unreadNotifications);
  // What still weighs with nothing to decide: a notice, what money weighs
  // with (`troubles`, which the day's worry reads too), a clash in the next
  // month. "All Clear" was said over all of them, and until 2026-09-27 it
  // read only the rent of the money.
  const weighing = useWorld((s) => {
    const notice = s.player.home?.noticeUntil;
    const clash = entriesBetween(s, s.now, s.now + 30 * MS_DAY).some((e) => e.conflicted);
    const cur = saveCurrency(s.universe);
    const m = (cents: number) => formatMoney(cents, cur, { cents: false });
    const said: string[] = [];
    if (notice !== undefined) said.push(`A notice to pay or quit runs until ${formatDate(notice, s.zone)}.`);
    for (const t of troubles(s, s.player)) {
      if (t.kind === 'landlord') said.push(`You owe your landlord ${m(t.amount)}.`);
      else if (t.kind === 'overdrawn') said.push(`Your current account is ${m(t.amount)} overdrawn.`);
      else if (t.kind === 'card') said.push(`Your card is nearly at its limit, owing ${m(t.amount)}.`);
      else if (t.kind === 'card_behind') {
        // The card named, where there's more than one.
        const card = t.accountId ? s.universe.accounts[t.accountId] : undefined;
        const state = card && s.player.credit ? stateOf(s.player, card) : s.player.credit;
        const which = card && cardsOf(s, s.player).length > 1 ? `The ${card.name}` : 'Your card';
        said.push(state?.suspended ? `${which} is suspended, owing ${m(t.amount)}.` : `${which} is ${state?.missed === 1 ? 'a payment' : `${state?.missed} payments`} behind, owing ${m(t.amount)}.`);
      }
      else if (t.kind === 'return_late') said.push(`A tax return is past its day, unfiled, ${m(t.amount)} with its penalty so far.`);
      else if (t.kind === 'medical') said.push(`You owe ${m(t.amount)} for medical care.`);
      else if (t.kind === 'collections') said.push(`${m(t.amount)} is with collections.`);
      else if (t.kind === 'home') said.push(`You’re behind on your homes, ${m(t.amount)} owed.`);
      else if (t.kind === 'council') said.push(`You owe ${m(t.amount)} of council tax.`);
      else said.push(`You owe ${m(t.amount)} of income tax.`);
    }
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
    school: useFeature('ui.school').open,
    career: useFeature('ui.career').open,
    papers: useFeature('ui.papers').open,
    travel: useFeature('ui.travel').open,
    vehicles: useFeature('ui.vehicles').open,
    land: useFeature('ui.land').open,
    people: useFeature('ui.people').open,
    food: useFeature('ui.food').open,
    clothes: useFeature('ui.clothes').open,
    routines: useFeature('ui.routines').open,
    belongings: useFeature('ui.belongings').open,
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
                {/* The call's own clock, where it names another city: until 2026-09-27 the home clock with no zone. */}
                <Open subject={at('entry', next.id)}>{(() => { const tz = next.locationId ? CITIES.get(next.locationId)?.timeZone : undefined; return tz && tz !== sim.zone ? `${formatTime(next.at, tz)} ${zoneAbbreviation(next.at, tz)}` : formatTime(next.at, sim.zone); })()}</Open>
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
                body="You owe nobody anything past due, the bank and the card are in order, and the calendar doesn’t clash. Go and do something you want to do."
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
                <Meter label="Energy" value={player.wellbeing.energy} line={EMPTY} look={at('dial', `${player.id}/energy`)} />
                <Meter label="Stress" value={player.wellbeing.stress} invert line={OVERWROUGHT} look={at('dial', `${player.id}/stress`)} />
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
                  value={resolveIncomeTaxLayers(place.city.id, sim.now).length > 0 ? `${Math.round(place.effectiveIncomeTax * 100)}%` : 'Not On File'}
                  note={resolveIncomeTaxLayers(place.city.id, sim.now).length > 0 ? 'Income tax and payroll both, on a US$60,000 wage' : 'No table for this country yet'}
                  look={at('place', place.city.id)}
                />
                <Stat
                  label="Sales Tax"
                  value={`${(place.salesTax * 100).toFixed(1)}%`}
                  note={`Property ${(place.propertyTax * 100).toFixed(2)}%, on owners${player.home?.kind === 'owned' ? ', which you pay' : ': you rent'}`}
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

      {/*
        Every place in the life opens from Home, under the group it belongs to,
        the same groups the screens' eyebrows name (`ui/shell/destinations.ts`).
        Until 2026-10-02 eight panels sat in one grid in no order, and the Home
        panel carried five other places as buttons in its corner.
      */}
      <HomeGroup label={groupLabelOf('/workspace/people')} lead={!shows.home ? <LockedPanel feature="ui.home" title="Home" /> : (
        <Panel
          title="Home"
          tight
          actions={(
            <Gated feature="ui.homes" className="btn btn-sm" onClick={() => navigate('/workspace/homes', 'Homes')}>
              Homes
            </Gated>
          )}
        >
          <div className="grid grid-2">
            <div><YourHome cur={cur} /></div>
            <div><YourPlace cur={cur} /></div>
          </div>
        </Panel>
        )}>
        {!shows.people ? <LockedPanel feature="ui.people" title="People" /> : (
        <Panel
          title="People"
          tight
          actions={(
            <Gated feature="ui.people" className="btn btn-sm" onClick={() => navigate('/workspace/people', 'People')}>
              People
            </Gated>
          )}
        >
          <YourPeople />
        </Panel>
        )}
        {!shows.food ? <LockedPanel feature="ui.food" title="Food" /> : (
        <Panel
          title="Food"
          tight
          actions={(
            <Gated feature="ui.food" className="btn btn-sm" onClick={() => navigate('/workspace/food', 'Food')}>
              Food
            </Gated>
          )}
        >
          <YourFood />
        </Panel>
        )}
        {!shows.clothes ? <LockedPanel feature="ui.clothes" title="Clothes" /> : (
        <Panel
          title="Clothes"
          tight
          actions={(
            <Gated feature="ui.clothes" className="btn btn-sm" onClick={() => navigate('/workspace/clothes', 'Clothes')}>
              Clothes
            </Gated>
          )}
        >
          <YourClothes />
        </Panel>
        )}
        {!shows.routines ? <LockedPanel feature="ui.routines" title="Routines" /> : (
        <Panel
          title="Routines"
          tight
          actions={(
            <Gated feature="ui.routines" className="btn btn-sm" onClick={() => navigate('/workspace/routines', 'Routines')}>
              Routines
            </Gated>
          )}
        >
          <YourRoutines />
        </Panel>
        )}
        {!shows.belongings ? <LockedPanel feature="ui.belongings" title="Belongings" /> : (
        <Panel
          title="Belongings"
          tight
          actions={(
            <Gated feature="ui.belongings" className="btn btn-sm" onClick={() => navigate('/workspace/belongings', 'Belongings')}>
              Belongings
            </Gated>
          )}
        >
          <YourBelongings />
        </Panel>
        )}
      </HomeGroup>
      <HomeGroup label={groupLabelOf('/workspace/career')}>
        {player.school && (!shows.school ? <LockedPanel feature="ui.school" title="School" /> : (
        <Panel
          title="School"
          tight
          actions={(
            <Gated feature="ui.school" className="btn btn-sm" onClick={() => navigate('/workspace/school', 'Your School')}>
              {YALE_DRAMA.short}
            </Gated>
          )}
        >
          <YourSchool />
        </Panel>
        ))}
        {player.career && (!shows.career ? <LockedPanel feature="ui.career" title="Career" /> : (
        <Panel
          title="Career"
          tight
          actions={(
            <Gated feature="ui.career" className="btn btn-sm" onClick={() => navigate('/workspace/career', 'Your Career')}>
              Career
            </Gated>
          )}
        >
          <YourCareer cur={cur} />
        </Panel>
        ))}
      </HomeGroup>
      <HomeGroup label={groupLabelOf('/workspace/travel')}>
        {(player.career || player.school) && (!shows.travel ? <LockedPanel feature="ui.travel" title="Travel" /> : (
        <Panel
          title="Travel"
          tight
          actions={(
            <Gated feature="ui.travel" className="btn btn-sm" onClick={() => navigate('/workspace/travel', 'Travel')}>
              Travel
            </Gated>
          )}
        >
          <YourTravel />
        </Panel>
        ))}
        {(player.career || player.school) && (!shows.vehicles ? <LockedPanel feature="ui.vehicles" title="Cars" /> : (
        <Panel
          title="Cars"
          tight
          actions={(
            <Gated feature="ui.vehicles" className="btn btn-sm" onClick={() => navigate('/workspace/vehicles', 'Cars')}>
              Cars
            </Gated>
          )}
        >
          <YourCars />
        </Panel>
        ))}
      </HomeGroup>
      <HomeGroup label={groupLabelOf('/workspace/bank')}>
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
              note={`${formatMoney(worth.cash, cur, { cents: false })} in the bank and in hand${worth.held > 0 ? `, ${formatMoney(worth.held, cur, { cents: false })} held as a deposit` : ''}${worth.pension > 0 ? `, ${formatMoney(worth.pension, cur, { cents: false })} in a pension` : ''}${worth.home > 0 ? `, a home worth ${formatMoney(worth.home, cur, { cents: false })}` : ''}`}
              look={at('networth', player.id)}
            />
            {worth.liabilities > 0 && (
              <Stat
                label="Owed"
                value={<span className="mono negative">{formatMoney(worth.liabilities, cur, { cents: false })}</span>}
                look={at('debt', player.id)}
              />
            )}
            <CardSummary cur={cur} />
          </LookRegion>
        </Panel>
        )}
        {(player.career || player.school) && (!shows.land ? <LockedPanel feature="ui.land" title="Land" /> : (
        <Panel
          title="Land"
          tight
          actions={(
            <Gated feature="ui.land" className="btn btn-sm" onClick={() => navigate('/workspace/land', 'Land')}>
              Land
            </Gated>
          )}
        >
          <YourLand />
        </Panel>
        ))}
      </HomeGroup>
      <HomeGroup label={groupLabelOf('/workspace/papers')}>
        {/* From school on: Yale Health, the returns and the bills run from the first term. Until 2026-09-27 it waited for the career. */}
        {(player.career || player.school) && (!shows.papers ? <LockedPanel feature="ui.papers" title="Papers" /> : (
        <Panel
          title="Papers"
          tight
          actions={(
            <Gated feature="ui.papers" className="btn btn-sm" onClick={() => navigate('/workspace/papers', 'Papers')}>
              Papers
            </Gated>
          )}
        >
          <YourPapers cur={cur} />
        </Panel>
        ))}
      </HomeGroup>
    </>
  );
}

/** A heading for one part of life, a panel that takes the whole row where one is given, and the rest laid out to fill each row; nothing at all where none of them is shown. */
function HomeGroup({ label, lead, children }: { label: string; lead?: ReactNode; children: ReactNode }) {
  const shown = Children.toArray(children);
  if (shown.length === 0 && !lead) return null;
  return (
    <section className="home-group" aria-label={label}>
      <h2 className="home-group-label">{label}</h2>
      {lead && <div className="home-group-lead">{lead}</div>}
      {shown.length > 0 && <div className="grid grid-3">{children}</div>}
    </section>
  );
}

/** Who you know: how many, the close ones, and who you’re seeing. */
function YourPeople() {
  const contacts = useWorld((s) => s.player.contacts ?? []);
  const close = contacts.filter((c) => levelOf(c) === 'Close Friend').length;
  const partner = contacts.find((c) => c.dating);
  return <Stat label="Who You Know" value={String(contacts.length)} note={`${close} ${close === 1 ? 'close friend' : 'close friends'}${partner ? `; seeing ${partner.name}` : ''}`} />;
}

/** What there is to eat: meals ready, and the food fresh in the kitchen. */
function YourFood() {
  const ready = useWorld((s) => mealsReady(s, s.player).length);
  const stock = useWorld((s) => kitchenStock(s, s.player).length);
  return <Stat label="Ready To Eat" value={String(ready)} note={`${stock} ${stock === 1 ? 'thing' : 'things'} fresh in the kitchen`} tone={ready === 0 ? 'warning' : undefined} />;
}

/** What there is to wear: clean outfits, and what’s in the wash. */
function YourClothes() {
  const outfits = useWorld((s) => cleanOutfits(s, s.player));
  const wash = useWorld((s) => washableDirty(s, s.player).length);
  return <Stat label="Clean Outfits" value={String(outfits)} note={wash ? `${wash} ${wash === 1 ? 'garment' : 'garments'} to wash` : 'Nothing to wash'} tone={outfits <= 2 ? 'warning' : undefined} />;
}

/** The routines saved, by name. */
function YourRoutines() {
  const routines = useWorld((s) => s.player.routines ?? []);
  return <Stat label="Saved" value={String(routines.length)} note={routines.length ? routines.map((r) => r.name).slice(0, 3).join(', ') : 'None saved yet'} />;
}

/** A machine at home that's broken, and its repair booked (`systems/appliancefaults.ts`). */
function BrokenMachines() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const broken = Object.keys(faultsOf(person)) as Machine[];
  if (broken.length === 0) return null;
  const cur = saveCurrency(sim.universe);
  return (
    <div className="col gap-1">
      <div className="small muted">Broken At Home</div>
      {broken.map((m) => {
        const f = faultsOf(person)[m]!;
        const bill = repairBill(sim, person, m);
        const no = repairRefusal(sim, person, m);
        return (
          <div key={m} className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="small">{MACHINE_LABEL[m]}{f.fixAt !== undefined ? <span className="xs dim">{` · mended ${formatDate(f.fixAt, sim.zone)}${f.landlord ? ', the landlord’s' : ''}`}</span> : null}</span>
            {f.fixAt === undefined && <Gated feature="home.repair_machine" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { if (run('home.repair_machine', { machine: m }).ok) toast('A technician comes tomorrow.', 'positive'); }}>{bill !== undefined ? `Book The Repair, ${formatMoney(bill, cur, { cents: false })}` : 'Book The Repair'}</Gated>}
          </div>
        );
      })}
    </div>
  );
}

/** What you own besides clothes and food, and how much of it is at home. */
function YourBelongings() {
  const { sim } = useGame();
  const things = useWorld((s) => (s.player.items ?? []).filter((i) => !i.garment && !i.food));
  const atHome = things.filter((i) => i.at.kind === 'home').length;
  // Everything in progress, soonest first (`systems/underway.ts`, from 2026-10-02).
  const pending = useWorld((s) => underWay(s, s.player));
  return (
    <div className="col gap-2">
      <Stat label="Things You Own" value={String(things.length)} note={`${atHome} at home`} />
      {pending.length > 0 && (
        <div className="col gap-1">
          <div className="small muted">Under Way</div>
          {pending.slice(0, 6).map((u) => <div key={`${u.kind}-${u.label}-${u.until}`} className="small">{u.label}<span className="xs dim">{` · ${formatDate(u.until, sim.zone)}`}</span></div>)}
          {pending.length > 6 && <div className="xs dim">{`And ${pending.length - 6} more`}</div>}
        </div>
      )}
      <BrokenMachines />
    </div>
  );
}

/**
 * Where the life began: the year and standing, the place in the class, and
 * the next thing the school has on the calendar (`systems/school.ts`). Until
 * 2026-09-26 it said what scholarship the next term paid in, which a family
 * with means isn't paid.
 */
function YourSchool() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school;
  if (!school) return null;
  const zone = CITIES.require(YALE_DRAMA.cityId).timeZone;
  const booked = sim.universe.scheduled
    .filter((item) => item.status === 'pending' && item.category === 'school' && item.requiresPlayer && item.payload.personId === person.id)
    .sort((x, y) => x.at - y.at)[0];
  // What the calendar holds, or past this week, the next classes, while there are classes to go to.
  const enrolled = school.standing !== 'graduated' && school.standing !== 'dismissed';
  const classes = enrolled ? nextClasses(sim.now) : undefined;
  const next = enrolled ? booked ?? (classes !== undefined ? { label: 'Classes', at: classes } : undefined) : undefined;
  return (
    <div className="col gap-3">
      <Stat
        label={`${YALE_DRAMA.degree} In ${YALE_DRAMA.program}`}
        value={school.standing === 'graduated' ? 'Graduated' : school.termsBegun === 0 ? 'Arriving' : `Year ${yearOfStudy(person)}`}
        note={`Class of ${school.classOf}, ${STANDING_LABEL[school.standing].toLowerCase()}`}
        tone={school.standing === 'concern' || school.standing === 'warning' || school.standing === 'dismissed' ? 'warning' : undefined}
      />
      <Stat label="Your Place In The Class" value={`${rankIn(person)} of ${YALE_DRAMA.classSize}`} note="By craft, across every skill" />
      {next && <Stat label="Next" value={next.label} note={formatDateTime(next.at, zone)} />}
    </div>
  );
}

/**
 * Taxes and cover (`systems/health.ts`, `systems/taxreturn.ts`,
 * `systems/unemployment.ts`): what covers them, the next return, and a claim.
 */
/** The cars they own, and when the first's registration is next due (`systems/vehicles.ts`). */
function YourCars() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const owned = vehiclesOf(person).filter((v) => v.soldAt === undefined);
  const first = owned[0];
  const m = first ? modelById(first.modelId) : undefined;
  return (
    <div className="col gap-3">
      <Stat label="Own" value={owned.length ? `${owned.length} ${owned.length === 1 ? 'Car' : 'Cars'}` : 'None'} note={m ? `${m.make} ${m.model}` : undefined} />
      <Stat label="Registration" value={first ? formatDateTime(first.registrationDue, sim.zone).split(' at ')[0]! : '—'} note={first ? 'Next due' : undefined} />
    </div>
  );
}

/** The land they own, and what it's worth (`systems/land.ts`). */
function YourLand() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const owned = parcelsOf(person).filter((p) => p.soldAt === undefined);
  const cur = saveCurrency(sim.universe);
  const worth = owned.reduce((a, p) => { const m = LAND_MARKETS[p.market]!; return a + inSaveMoney(sim, landValue(m, p.acres, sim.now), m.currency); }, 0);
  return (
    <div className="col gap-3">
      <Stat label="Own" value={owned.length ? `${owned.length} ${owned.length === 1 ? 'Parcel' : 'Parcels'}` : 'None'} note={owned[0] ? LAND_MARKETS[owned[0].market]!.label : undefined} />
      <Stat label="Worth" value={owned.length ? formatMoney(worth, cur, { cents: false }) : '—'} note={owned.some((p) => p.selling) ? 'Some of it for sale' : undefined} />
    </div>
  );
}

/** Where they are, and the next journey booked (`systems/journey.ts`). */
function YourTravel() {
  const person = useWorld((s) => s.player);
  const next = journeysOf(person).filter((j) => j.status === 'booked' || j.status === 'underway').sort((a, b) => a.leaveAt - b.leaveAt)[0];
  return (
    <div className="col gap-3">
      <Stat label="In" value={CITIES.get(person.currentLocationId)?.name ?? person.currentLocationId} />
      <Stat label="Next Journey" value={next ? `To ${CITIES.get(next.toCity)?.name ?? next.toCity}` : 'None Booked'} note={next ? formatDateTime(next.leaveAt, CITIES.require(next.fromCity).timeZone) : undefined} />
    </div>
  );
}

function YourPapers({ cur }: { cur: string }) {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const cover = coverOn(person, sim.now);
  const open = Object.values(person.returns ?? {}).find((r) => r.filedAt === undefined);
  // Past its day, the penalty filing now would add; filed and unpaid, what's owed and growing. Until 2026-09-27 neither showed.
  const penalty = open && open.figures.balance > 0 && sim.now > open.due ? latePenalty(open.figures.balance, open.due, sim.now, cur) : 0;
  const owedTax = Object.values(person.returns ?? {}).reduce((sum, r) => sum + Math.max(0, r.owed ?? 0), 0);
  const claim = person.unemployment?.claim;
  return (
    <div className="col gap-3">
      <Stat label="Health Cover" value={cover ? COVER_LABEL[cover] : 'None'} tone={cover ? undefined : 'warning'} />
      <Stat label="Tax Return" value={open ? `${open.year}, Due ${formatDateTime(open.due, 'America/New_York').split(' at ')[0]}` : owedTax > 0 ? `Owed: ${formatMoney(owedTax, cur, { cents: false })}` : 'None Open'} note={open ? (open.figures.balance > 0 ? `${formatMoney(open.figures.balance + penalty, cur, { cents: false })} owed${penalty > 0 ? `, ${formatMoney(penalty, cur, { cents: false })} of it the late penalty so far` : ''}` : `${formatMoney(-open.figures.balance, cur, { cents: false })} back`) : owedTax > 0 ? 'Filed, and growing half a percent a month until it’s paid' : undefined} tone={(open && sim.now > open.due) || owedTax > 0 ? 'warning' : undefined} />
      <Stat label="Unemployment" value={claim ? `${formatMoney(claim.weekly, cur, { cents: false })} A Week` : 'No Claim'} note={claim ? 'Less for a week you work' : undefined} />
    </div>
  );
}

/**
 * The working life (`systems/career.ts`): who represents them, what's next
 * on the calendar for it, and the year's wages.
 */
function YourCareer({ cur }: { cur: string }) {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const career = person.career;
  if (!career) return null;
  const agency = career.agencyId ? agencyById(career.agencyId) : undefined;
  const next = sim.universe.scheduled
    .filter((item) => item.status === 'pending' && item.category === 'career' && item.requiresPlayer && item.payload.personId === person.id)
    .sort((x, y) => x.at - y.at)[0];
  const year = String(zonedParts(sim.now, sim.zone).year);
  // A manager's offer is one to answer too: until 2026-09-27 it wasn't counted.
  const offers = career.offers.filter((o) => o.until > sim.now).length + career.managerOffers.filter((o) => o.until > sim.now).length + career.bookings.filter((b) => b.status === 'offered').length;
  return (
    <div className="col gap-3">
      <Stat label="Representation" value={agency?.name ?? 'None'} note={offers ? `${offers} ${offers === 1 ? 'offer' : 'offers'} to answer` : `${career.credits.length} ${career.credits.length === 1 ? 'credit' : 'credits'}`} tone={offers ? 'warning' : undefined} />
      <Stat label="Earned This Year" value={formatMoney(person.earnings?.years[year]?.acting ?? 0, cur, { cents: false })} note="Before commission and tax" />
      {next && <Stat label="Next" value={next.label} note={formatDateTime(next.at, sim.zone)} />}
    </div>
  );
}

/**
 * The home, run by hand: where they live, what it costs, any notice standing,
 * and moving (`home.move`), with what moving takes from the bank. It was
 * Work And Home until 2026-09-26, with the day job's week, extra shifts,
 * hours, quitting and looking for work above it; the job engine went.
 */
/**
 * The place they live as it is inside (`systems/dwelling.ts`): what kind of
 * home, what it has, how many clean clothes are left and what's drying, how
 * tidy it is, and a cleaner every week.
 */
const SECURITY_LABEL: Readonly<Record<Device, string>> = { windows: 'Fit Window Locks', timers: 'Buy Lamp Timers', lights: 'Fit An Outside Motion Light' };

function YourPlace({ cur }: { cur: string }) {
  const { run, toast } = useGame();
  const place = useWorld((s) => placeOf(s, s.player));
  const living = useWorld((s) => ({ ...livingOf(s.player) }));
  const cleaner = useWorld((s) => cleanerCost(s, s.player));
  // The wardrobe's state (`systems/wardrobe.ts`): whole clean outfits to hand, and what's in the wash, drying or for the dry cleaner.
  const clothes = useWorld((s) => ({
    outfits: cleanOutfits(s, s.player),
    toWash: washableDirty(s, s.player).length,
    toDryClean: dryCleanDirty(s, s.player).length,
    drying: garmentsOf(s.player).filter((g) => (g.garment.dryUntil ?? 0) > s.now).length,
  }));
  const premium = useWorld((s) => rentersPremium(s, s.player));
  const hasAlarm = useWorld((s) => alarmed(s.player));
  const noAlarm = useWorld((s) => alarmRefusal(s.player));
  const home = useWorld((s) => s.player.home);
  const noUnits = useWorld((s) => unitsRefusal(s, s.player));
  // A charger for an electric car, on a house they own that hasn't one (`systems/charging.ts`).
  const charger = useWorld((s) => { const q = chargerQuote(s, s.player); return typeof q === 'string' ? undefined : q.cost; });
  // Locks, a light and timers, where they're priced and the home could take them (`systems/homesecurity.ts`).
  const security = useWorld((s) => (['windows', 'timers', 'lights'] as Device[]).flatMap((device) => {
    const cost = deviceCost(s, s.player, device);
    const no = securityRefusal(s.player, device);
    return cost === undefined || (no && /has them|not a flat|landlord|of your own/.test(no)) ? [] : [{ device, cost, no }];
  }));
  // A machine offered where it's priced and the home lacks it: a dryer once there's a washer.
  const portables = useWorld((s) => (['dishwasher', 'washer', 'dryer'] as Portable[]).flatMap((kind) => {
    const cost = s.player.home ? portableCost(s, s.player.home.cityId, kind) : undefined;
    const no = portableRefusal(s, s.player, kind);
    return cost === undefined || (no && /has one|beside a washer/.test(no)) ? [] : [{ kind, cost, no }];
  }));
  const unitsCost = useWorld((s) => (s.player.home && OWN_UNITS_IN.has(CITIES.get(s.player.home.cityId)?.countryId ?? '') ? applianceCost(s, s.player.home.cityId, 'ac-units') : undefined));
  if (!place || !home) return null;
  const country = CITIES.get(home.cityId)?.countryId ?? 'us';
  const f = place.fixtures;
  const has = [f.bathtub ? 'Bath And Shower' : 'Shower', f.dishwasher ? 'Dishwasher' : 'No Dishwasher', LAUNDRY_LABEL[f.laundry], COOLING_LABEL[f.cooling], OUTDOOR_LABEL[f.outdoor], GYM_LABEL[f.gym]];
  const kind = home.kind === 'sofa' ? 'A friend’s place' : place.shared ? `A room in a shared ${typeLabel(place.type, country, true).toLowerCase()}` : typeLabel(place.type, country, !place.owned);
  return (
    <div className="col gap-2 small">
      <div>{kind} · {sizeText(place.size, country)}</div>
      <div className="muted">{has.join(' · ')}</div>
      <div className="stats">
        <Stat label="Clean Outfits" value={`${clothes.outfits}`} note={clothes.drying > 0 ? `${clothes.drying} drying` : clothes.toWash > 0 ? `${clothes.toWash} to wash` : clothes.toDryClean > 0 ? `${clothes.toDryClean} for the dry cleaner` : 'All washed'} tone={clothes.outfits <= 2 ? 'warning' : undefined} />
        {place.keeps && <Stat label="Tidy" value={`${Math.round(living.tidy)}`} note={living.tidy < TIDY.messy ? 'A mess, and it weighs on you' : living.cleaner ? 'A cleaner comes weekly' : 'Out of a hundred'} tone={living.tidy < TIDY.messy ? 'warning' : undefined} />}
      </div>
      {place.keeps && (home.kind === 'own' || home.kind === 'shared') && (
        <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {living.rentersInsurance
            ? <Gated feature="home.renters_insurance" className="btn btn-sm btn-ghost" onClick={() => run('home.renters_insurance', { on: false })}>Cancel Renters Insurance</Gated>
            : <Gated feature="home.renters_insurance" className="btn btn-sm btn-ghost" onClick={() => { if (run('home.renters_insurance', { on: true }).ok) toast('Your things are insured.', 'positive'); }}>Get Renters Insurance ({formatMoney(premium, cur, { cents: false })} A Month)</Gated>}
          {hasAlarm
            ? <Gated feature="home.alarm" className="btn btn-sm btn-ghost" onClick={() => run('home.alarm', { on: false })}>Switch Off The Alarm</Gated>
            : !noAlarm && <Gated feature="home.alarm" className="btn btn-sm btn-ghost" onClick={() => { if (run('home.alarm', { on: true }).ok) toast('The alarm is fitted and monitored; your insurer takes its discount off.', 'positive'); }}>Fit A Burglar Alarm</Gated>}
        </div>
      )}
      {place.keeps && home.kind !== 'sofa' && portables.length > 0 && (
        <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {portables.map(({ kind, cost, no }) => <Gated key={kind} feature="home.buy_portable" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { if (run('home.buy_portable', { kind }).ok) toast('Yours, and it moves with you.', 'positive'); }}>{`Buy ${PORTABLE_LABEL[kind]} (${formatMoney(cost, cur, { cents: false })})`}</Gated>)}
        </div>
      )}
      {place.keeps && home.kind !== 'sofa' && (security.length > 0 || charger !== undefined) && (
        <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {security.map(({ device, cost, no }) => <Gated key={device} feature="home.security" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { if (run('home.security', { device }).ok) toast(device === 'timers' ? 'Lamps on a timer, as if somebody were home.' : 'Fitted. A burglar has a harder way in.', 'positive'); }}>{`${SECURITY_LABEL[device]} (${formatMoney(cost, cur, { cents: false })})`}</Gated>)}
          {charger !== undefined && <Gated feature="home.charger" className="btn btn-sm btn-ghost" onClick={() => { if (run('home.charger', {}).ok) toast('Charged at home now, overnight, at the home’s price.', 'positive'); }}>{`Fit A Home Charger (${formatMoney(charger, cur, { cents: false })})`}</Gated>}
        </div>
      )}
      {place.keeps && home.kind !== 'sofa' && place.fixtures.cooling === 'none' && unitsCost !== undefined && (
        <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Gated feature="home.buy_units" className="btn btn-sm btn-ghost" disabled={Boolean(noUnits)} title={noUnits} onClick={() => { if (run('home.buy_units', {}).ok) toast('Yours, and they move with you.', 'positive'); }}>Buy Air Conditioning Units ({formatMoney(unitsCost, cur, { cents: false })})</Gated>
        </div>
      )}
      {place.keeps && (
        <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {living.cleaner
            ? <><Gated feature="home.cleaner" className="btn btn-sm btn-ghost" onClick={() => run('home.cleaner', { on: false })}>Let The Cleaner Go</Gated><Gated feature="home.cleaner_key" className="btn btn-sm btn-ghost" title="Without a key the cleaner gets in only when you or a partner are home at ten" onClick={() => { if (run('home.cleaner_key', { give: !living.cleaner!.key }).ok) toast(living.cleaner!.key ? 'The key back.' : 'They let themselves in now.', 'positive'); }}>{living.cleaner.key ? 'Take The Key Back' : 'Give The Cleaner A Key'}</Gated></>
            : <Gated feature="home.cleaner" className="btn btn-sm btn-ghost" onClick={() => { if (run('home.cleaner', { on: true }).ok) toast('A cleaner comes every Friday.', 'positive'); }}>Hire A Cleaner ({formatMoney(cleaner, cur, { cents: false })} A Week)</Gated>}
        </div>
      )}
    </div>
  );
}

function YourHome({ cur }: { cur: string }) {
  const { sim, run, toast } = useGame();
  const [paying, setPaying] = useState('');
  const owed = useWorld((s) => arrearsOf(s, s.player));
  const ahead = useWorld((s) => s.player.payments?.rentCredit ?? 0);
  const payLandlord = () => {
    const answer = run('home.pay_landlord', { amount: centsFromTyped(paying) });
    if (answer.ok) { toast('Paid.', 'positive'); setPaying(''); }
  };
  const home = useWorld((s) => s.player.home);
  // Away on a job or a stay, a home is found back where they live (`home.move`).
  const away = useWorld((s) => (s.player.home && s.player.home.cityId !== s.player.currentLocationId ? s.player.home.cityId : undefined));
  const rent = useWorld((s) => rentOf(s, s.player));
  const bills = useWorld((s) => billsOf(s, s.player));
  const bins = useWorld((s) => wasteFeeOf(s, s.player));
  const council = useWorld((s) => Math.round(rentersCouncilTax(s, s.player) / 10));
  const checking = useWorld((s) => Math.max(0, s.universe.accounts[s.player.primaryAccountId ?? '']?.balance ?? 0));
  // What leaves the bank, the old deposit back set against it, and why a move can't be made, as `move` has it.
  const costs = useWorld((s) => ({ shared: moveCost(s, s.player, 'shared') - depositBack(s, s.player), own: moveCost(s, s.player, 'own') - depositBack(s, s.player) }));
  const refused = useWorld((s) => ({ shared: moveRefusal(s, s.player, 'shared'), own: moveRefusal(s, s.player, 'own') }));
  const money = (cents: number) => formatMoney(cents, cur, { cents: false });
  const homeLabel = home ? (home.kind === 'sofa' ? SOFA.label : home.kind === 'owned' ? OWNED.label : HOUSING[home.kind].label) : 'Nowhere';
  return (
    <div className="col gap-3">
      <Stat
        label="Where You Sleep"
        value={homeLabel}
        note={home?.kind === 'sofa' ? SOFA.note : `${money(rent + bills + council)} a month on the first: ${money(rent)} rent and ${money(bills)} bills${bins > 0 ? ` (${money(bins)} of it the bins)` : ''}${council > 0 ? `, and ${money(council)} council tax, April to January` : ''}. Since ${formatDate(home!.since, sim.zone)}`}
      />
      <InternetControl />
      {home && home.kind !== 'sofa' && home.kind !== 'owned' && (
        <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="pay-landlord">{owed > 0 ? `Owed: ${money(owed)}` : ahead > 0 ? `Paid Ahead: ${money(ahead)}` : 'Pay The Landlord'} ({cur})</label>
            <input id="pay-landlord" inputMode="decimal" value={paying} onChange={(e) => setPaying(e.target.value)} />
          </div>
          <Gated feature="home.pay_landlord" className="btn btn-sm" onClick={payLandlord} disabled={!paying || centsFromTyped(paying) > checking}>Pay The Landlord</Gated>
        </div>
      )}
      {home?.noticeUntil !== undefined && (
        <div className="callout callout-warning small">
          A notice to pay or quit runs until {formatDate(home.noticeUntil, sim.zone)}. Get what you owe under a month’s rent by then.
        </div>
      )}
      {home?.kind === 'owned' ? null : away ? (
        <div className="small muted">You’re away: a new home is found back in {CITIES.get(away)?.name ?? 'your town'}.</div>
      ) : (
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        {home?.kind !== 'shared' && (
          <Gated feature="home.move" className="btn btn-sm btn-ghost" disabled={Boolean(refused.shared)} onClick={() => run('home.move', { kind: 'shared' })}>
            Rent A Room ({money(costs.shared)} To Move In)
          </Gated>
        )}
        {home?.kind !== 'own' && (
          <Gated feature="home.move" className="btn btn-sm btn-ghost" disabled={Boolean(refused.own)} onClick={() => run('home.move', { kind: 'own' })}>
            Rent A One-Bedroom ({money(costs.own)} To Move In)
          </Gated>
        )}
      </div>
      )}
      {!away && home?.kind !== 'owned' && (refused.own ?? refused.shared) && <div className="xs dim">{home?.kind === 'own' ? refused.shared : refused.own}</div>}
    </div>
  );
}

/**
 * The card and the record, at a glance: what the card owes of its limit, and
 * the record a lender reads, as a number where lenders use one and a word
 * elsewhere. The card is the bank's, and paying it and its autopay are on the
 * bank's screen (`ui/bank/BankCard.tsx`); they were here until 2026-09-26.
 */
function CardSummary({ cur }: { cur: string }) {
  const { sim } = useGame();
  const card = useWorld((s) => cardOf(s, s.player));
  const cards = useWorld((s) => cardsOf(s, s.player));
  const credit = useWorld((s) => s.player.credit);
  if (!credit) return null;
  // Read as it’s read where they live, not where a job has them.
  const record = scoreIsANumberIn(homeOf(sim.player)) ? String(Math.round(credit.score)) : scoreWord(credit.score);
  const terms = card ? cardTerms(sim, card, credit.score) : undefined;
  return (
    <>
      {cards.length > 1 && (
        // Several, as one figure, as the bureaus read them together: until 2026-09-28 a person held one card.
        <Stat
          label="Credit Cards"
          value={<span className="mono">{formatMoney(cards.reduce((sum, c) => sum + Math.max(0, -c.balance), 0), cur, { cents: false })}</span>}
          note={`Owed of ${formatMoney(cards.reduce((sum, c) => sum + (c.creditLimit ?? 0), 0), cur, { cents: false })} in limits, on ${cards.length} cards`}
        />
      )}
      {cards.length === 1 && card && terms && (
        <Stat
          label={terms.name}
          value={<span className="mono">{formatMoney(Math.max(0, -card.balance), cur, { cents: false })}</span>}
          note={`Owed of a ${formatMoney(card.creditLimit ?? 0, cur, { cents: false })} limit${terms.kind === 'charge' ? ', taken in full each month' : `, at ${Number((terms.apr * 100).toFixed(2))}% a year on what's carried`}`}
        />
      )}
      <Stat label="Credit Record" value={record} />
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

/** The home's internet provider and the other offers in town (`systems/telecom.ts`). */
function InternetControl() {
  const { run, toast, sim } = useGame();
  const cur = saveCurrency(sim.universe);
  const home = sim.player.home;
  const [planId, setPlanId] = useState('');
  if (!home || !billedApart(home.cityId) || internetShare(home.kind) === 0) return null;
  const now = telecomOf(sim.player).internet;
  const offers = internetIn(home.cityId);
  const current = offers.find((x) => x.id === now?.planId && now?.cityId === home.cityId);
  const others = offers.filter((x) => x.id !== current?.id);
  const chosen = others.find((x) => x.id === planId) ?? others[0];
  const priced = (x: (typeof offers)[number]) => `${x.provider}, ${x.plan}, ${formatMoney(Math.round(x.monthly * 100), x.currency)} A Month${x.months && x.after !== undefined ? ` For ${x.months} Months, Then ${formatMoney(Math.round(x.after * 100), x.currency)}` : ''}`;
  const leaving = leavingCost(sim, sim.player, sim.now);
  return (
    <div className="field-row">
      <span className="small">{current ? `Internet: ${priced(current)}` : `Internet: ${priced(offers[0]!)}, From The First`}</span>
      {chosen && others.length > 1 && (
        <select aria-label="Internet Offer" value={chosen.id} onChange={(e) => setPlanId(e.target.value)} style={{ width: 'auto' }}>
          {others.map((x) => <option key={x.id} value={x.id}>{priced(x)}</option>)}
        </select>
      )}
      {chosen && current && (
        <Gated feature="home.internet" className="btn btn-sm btn-ghost" title={leaving > 0 ? `What's left of the contract, ${formatMoney(leaving, cur, { cents: false })}, is owed on leaving.` : `${chosen.source}.`} onClick={() => { if (run('home.internet', { planId: chosen.id }).ok) toast(`${chosen.provider} from now.`, 'positive'); }}>{`Switch To ${chosen.provider}`}</Gated>
      )}
    </div>
  );
}
