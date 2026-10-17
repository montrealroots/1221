/**
 * SLATE — HOME.
 *
 * Immediate life. Where am I, what day is it, what happens next, what needs
 * attention, how am I doing. A command surface, not a place to bury depth.
 *
 * Its Home, Career, Travel, Cars and Land panels went with those systems in
 * the scope reset of 2026-10-09; the rest is as it stood on 2026-09-29.
 */

import { useState } from 'react';
import { formatDaylight } from '@/engine/core/sun';
import { titleCaseLabel } from '@/engine/core/text';
import { placeProfile, placeKindLabel, formatPeople, type PlaceProfile } from '@/engine/world/place';
import { WEATHER_EMOJI, forecastFor, weatherAt, weatherShort } from '@/engine/systems/weather';
import { MS_DAY, WEEKDAY_NAMES, formatDateTime } from '@/engine/core/time';
import { PERFORMER_NOUN } from '@/engine/core/performer';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, Empty } from '@/ui/components/primitives';
import { openDecisions, lifeSnapshot, unreadNotifications } from '@/engine/world/world';
import { entriesBetween, nextCommitment, upcoming } from '@/engine/world/calendar';
import { netWorth } from '@/engine/systems/finance';
import { readiness, wellbeingSummary, EMPTY, OVERWROUGHT } from '@/engine/systems/life';
import { CITIES } from '@/engine/content/geography';
import {
  dateKey, formatDate, formatRelative, formatTime, formatWeekdayDate, seasonOf, zoneAbbreviation,
} from '@/engine/core/time';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { balanceText, heldOf } from '@/engine/systems/abroad';
import { cardsOf, stateOf } from '@/engine/systems/credit';
import { troubles } from '@/engine/systems/spending';
import { latePenaltyAll, owedEverywhere, unassessedBalance } from '@/engine/systems/taxreturn';
import { LookRegion, Open, at } from '@/ui/looks';
import { YALE_DRAMA } from '@/engine/content/school';
import { STANDING_LABEL, nextClasses, rankIn, schoolEnded, yearOfStudy } from '@/engine/systems/school';
import { coverLabel, coverOn } from '@/engine/systems/health';
import { Gated, LockedPanel, useFeature } from '@/ui/guide/Guide';
import { HowItWorks } from '@/ui/guide/HowItWorks';

export function Home() {
  const { sim, navigate, run } = useGame();
  const snapshot = useWorld(lifeSnapshot);
  const decisions = useWorld(openDecisions);
  const next = useWorld(nextCommitment);
  const soon = useWorld((s) => upcoming(s, 6));
  const worth = useWorld((s) => netWorth(s, s.player.id));
  const cur = saveCurrency(sim.universe);
  const unread = useWorld(unreadNotifications);
  // Every unread notice drawn, not only the six heaviest (from 2026-10-17, brief 13's interface playthroughs): until then
  // the panel drew six and said nothing of the rest, and Mark N Read marked them all, so a notice past the sixth was on
  // no screen at all. A new life has fourteen unread by its first Saturday, and The Courses And What They Ask was the
  // thirteenth.
  const [allNotices, setAllNotices] = useState(false);
  // What still weighs with nothing to decide: a notice, what money weighs
  // with (`troubles`, which the day's worry reads too), a clash in the next
  // month. "All Clear" was said over all of them, and until 2026-09-27 it
  // read only the rent of the money.
  const weighing = useWorld((s) => {
    const clash = entriesBetween(s, s.now, s.now + 30 * MS_DAY).some((e) => e.conflicted);
    const cur = saveCurrency(s.universe);
    const m = (cents: number) => formatMoney(cents, cur, { cents: false });
    const said: string[] = [];
    for (const t of troubles(s, s.player)) {
      if (t.kind === 'owed') said.push(`You owe ${m(t.amount)} that went unpaid.`);
      else if (t.kind === 'overdrawn') said.push(`Your account is ${m(t.amount)} overdrawn.`);
      else if (t.kind === 'card') said.push(`Your card is nearly at its limit, owing ${m(t.amount)}.`);
      else if (t.kind === 'card_behind') {
        // The card named, where there's more than one.
        const card = t.accountId ? s.universe.accounts[t.accountId] : undefined;
        const state = card && s.player.credit ? stateOf(s.player, card) : s.player.credit;
        const which = card && cardsOf(s, s.player).length > 1 ? `The ${card.name}` : 'Your card';
        // Unsuspended, a card is one payment behind: the second missed suspends it (`SUSPEND_AFTER`), and every way a
        // suspension lifts puts the count back to none. “N payments behind” for two or more went on 2026-10-13, reached by
        // no played life once a card paid off reset its count (defect 68 of that day’s third round; found by its final checks).
        said.push(`${which} is ${state?.suspended ? 'suspended' : 'a payment behind'}, owing ${m(t.amount)}.`);
      }
      else if (t.kind === 'return_late') said.push(`A tax return is past its due date and unfiled: ${m(t.amount)}, with its penalty so far.`);
      else if (t.kind === 'medical') said.push(`You owe ${m(t.amount)} for medical care.`);
      else if (t.kind === 'collections') said.push(`${m(t.amount)} you owe is with a collection agency.`);
      else said.push(`You owe ${m(t.amount)} of income tax.`);
    }
    if (clash) said.push('Two things on your calendar in the next month are at the same time.');
    return said;
  });

  const player = snapshot.player;
  const city = snapshot.city ?? CITIES.get(player.currentLocationId);
  const ready = readiness(player);
  const accounts = useWorld((s) => s.ledger.accountsOf(s.player.id));
  const primary = accounts.find((a) => a.id === player.primaryAccountId) ?? accounts[0];
  // Accounts kept at home, by bank, in their own money (from 2026-10-16): the money line says them beside the primary.
  const kept = new Map<string, { currency: string; held: number }>();
  for (const a of accounts) {
    if (!a.currency || a.closedAt || a.id === primary?.id) continue;
    const was = kept.get(a.institution ?? '') ?? { currency: a.currency, held: 0 };
    kept.set(a.institution ?? '', { currency: was.currency, held: was.held + heldOf(a) });
  }
  const keptWords = [...kept].map(([bank, k]) => `, and ${formatMoney(k.held, k.currency)} at ${bank}`).join('');
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
    school: useFeature('ui.school').open,
    papers: useFeature('ui.papers').open,
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
        subtitle={next ? 'What’s coming up, and when.' : undefined}
        actions={(
          <Gated feature="ui.open-calendar" className="btn btn-sm btn-primary" onClick={() => navigate('/workspace/calendar', 'Calendar')}>
            Open Calendar
          </Gated>
        )}
        help="day.calendar"
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
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'var(--s2)' }}>
            <HowItWorks help="ui.open-calendar" label="How Your Own Plans Work" />
          </div>
        </LookRegion>
      </Panel>
      )}

      <div className="grid grid-2" style={{ marginBottom: 'var(--s5)' }}>
        {!shows.needs ? <LockedPanel feature="ui.needs" title="What Needs You" /> : (
        <Panel
          title="What Needs You"
          subtitle={decisions.length === 0 ? 'No questions are waiting on you.' : `${decisions.length} open`}
          flush
          actions={unread.length > 0 ? (
            <Gated feature="world.mark_read" className="btn btn-ghost btn-sm" onClick={() => run('world.mark_read')}>
              Mark {unread.length} Read
            </Gated>
          ) : undefined}
          help="day.needs"
        >
          {decisions.length === 0 && unread.length === 0 ? (
            weighing.length === 0 ? (
              <Empty
                title="All Clear"
                body="You owe nobody anything past due, the bank and the card are in order, and the calendar doesn’t clash. Go and do something you want to do."
              />
            ) : (
              <Empty title="No Questions Waiting" body={weighing.join(' ')} />
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
                      {/* Every row has a date from 2026-10-14; until then an undated one showed none here. */}
                      <span className={`xs ${decision.dueAt < sim.now ? 'negative' : 'dim'}`}>
                        <Open subject={at('decision', decision.id)}>
                          {decision.dueAt < sim.now ? 'Overdue' : formatRelative(decision.dueAt, sim.now)}
                        </Open>
                      </span>
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
                  {/* Past the sixth there's nothing to open: each comes up as one above it closes (`openDecisions`' order). */}
                  {decisions.length - 6} more waiting. Each one comes up here as one above it closes.
                </div>
              )}
            </LookRegion>
          )}
          {unread.length > 0 && (
            <LookRegion className="list">
              {(allNotices ? unread : unread.slice(0, 6)).map((note) => (
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
          {unread.length > 6 && (
            <div className="row-between xs dim" style={{ padding: 'var(--s3) var(--s4)' }}>
              <span>{allNotices ? `All ${unread.length} unread, the most important first.` : `${unread.length - 6} more unread.`}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAllNotices(!allNotices)}>
                {allNotices ? 'Show The Six Most Important' : `Show All ${unread.length}`}
              </button>
            </div>
          )}
        </Panel>
        )}

        <div className="col gap-4">
          {!shows.how ? <LockedPanel feature="ui.how" title="How You Are" /> : (
          <Panel title="How You Are" tight look={at('person', player.id)} help="body.how">
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
            <Panel title="Where You Are" tight look={at('place', place.city.id)} help="start.home">
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
                {/* Until 2026-10-13 this line said the distance and the hours from home when away, and Local Time’s note
                    the hours from home; nothing has put a player away from home since the home went in the scope of
                    2026-10-09, as the city Home profiles is the one `homeCityOf` gives (found by that day’s evidence
                    pass). The place look still says them for another city. */}
                <div className="xs dim" style={{ marginBottom: 'var(--s3)' }}>
                  <Open subject={at('place', place.city.id)}>
                    Home.
                    {placeLine(place) && ` ${placeLine(place)}.`}
                  </Open>
                </div>
                <div className="grid grid-3">
                <Stat
                  label="Local Time"
                  value={place.localTime}
                  note={place.zoneAbbreviation}
                  look={at('day', today)}
                />
                <Stat
                  label="Daylight"
                  value={place.sun.polar === 'day' ? 'Midnight Sun' : place.sun.polar === 'night' ? 'Polar Night'
                    : `${formatTime(place.sun.sunrise ?? sim.now, place.zone)} – ${formatTime(place.sun.sunset ?? sim.now, place.zone)}`}
                  note={`${formatDaylight(place.sun.daylightMinutes)} of daylight`}
                  look={at('daylight', place.city.id)}
                />
                </div>
                {/* Let Home breathe (from 2026-10-09): the currency, the cost of living, the taxes, the languages, the
                    country and its roads were six more tiles here; each is on the place’s and the country’s looks. */}
                <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>
                  <Open subject={at('place', place.city.id)}>Its money, costs, taxes and languages</Open>
                </p>
              </LookRegion>
            </Panel>
          )}

          {!shows.weather && <LockedPanel feature="ui.weather" title="Weather" />}
          {weather && city && shows.weather && (
            <Panel title="Weather" tight look={at('weather', city.id)} help="day.weather">
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

      {/* Your affairs, in a line each (from 2026-10-10): money, the school and the papers were three panels of their own
          here, each with three or four tiles, the same figures as their workspaces. Each is a summary now, with only what
          needs doing as an alert, and its workspace for the rest. */}
      <Panel title="Your Affairs" tight look={at('networth', player.id)} help="money.affairs">
        <div className="col gap-3">
          {/* "No account" and "Your Bank" are a guard, reached by no played life as of 2026-10-14: every life has a
              current account from creation, the bank refuses to close a life's only one, and a card charged off to
              collections leaves the checking named (tests/evidence3-home.test.ts measured both). Kept for a save that
              comes to have no primary account by some way play doesn't reach, and tested as that guard from 2026-10-15
              (tests/scope-money.test.ts). */}
          {!shows.money ? <LockedPanel feature="ui.money" title="Money" /> : (
            <AffairLine
              title="Money"
              line={`${primary?.name ?? 'No account'}: ${primary ? balanceText(sim, primary) : formatMoney(0, cur)}${keptWords}. Worth ${formatMoney(worth.total, cur, { cents: false })}${worth.liabilities > 0 ? `, ${formatMoney(worth.liabilities, cur, { cents: false })} of it owed` : ''}.`}
              alert={(primary?.balance ?? 0) < 0 ? 'Your account is overdrawn.' : undefined}
              action={<Gated feature="ui.bank" className="btn btn-sm" onClick={() => navigate('/workspace/bank', 'Money')}>{primary?.institution ?? 'Your Bank'}</Gated>}
              help="bank.accounts"
            />
          )}
          {player.school && (!shows.school ? <LockedPanel feature="ui.school" title="School" /> : <SchoolLine />)}
          {player.school && (!shows.papers ? <LockedPanel feature="ui.papers" title="Papers" /> : <PapersLine cur={cur} />)}
        </div>
      </Panel>
    </>
  );
}

/** One of your affairs on Home: what it is, one line of where it stands, what needs doing if anything, and the way in. */
function AffairLine({ title, line, alert, action, help }: { title: string; line: string; alert?: string; action: React.ReactNode; help: string }) {
  return (
    <div className="row gap-3 wrap" style={{ alignItems: 'baseline' }}>
      <strong className="small" style={{ minWidth: 64 }}>{title}</strong>
      <span className="small grow" style={{ minWidth: 0 }}>{line}{alert && <span className="xs" style={{ display: 'block', color: 'var(--warning)' }}>{alert}</span>}</span>
      {action}
      <HowItWorks help={help} />
    </div>
  );
}

/**
 * Where the life began: the year and standing, the place in the class, and
 * the next thing the school has on the calendar (`systems/school.ts`). Until
 * 2026-09-26 it said what scholarship the next term paid in, which a family
 * with means isn't paid.
 */
function SchoolLine() {
  const { sim, navigate } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school;
  if (!school) return null;
  const zone = CITIES.require(YALE_DRAMA.cityId).timeZone;
  const booked = sim.universe.scheduled
    .filter((item) => item.status === 'pending' && item.category === 'school' && item.requiresPlayer && item.payload.personId === person.id)
    .sort((x, y) => x.at - y.at)[0];
  // What the calendar holds, or past this week, the next classes, while there are classes to go to.
  const enrolled = !schoolEnded(school.standing);
  const classes = enrolled ? nextClasses(sim.now, school) : undefined;
  const next = enrolled ? booked ?? (classes !== undefined ? { label: 'Classes', at: classes } : undefined) : undefined;
  // Left without the degree, not a year of study (from 2026-10-10: until then a dismissed student was "Year 2").
  const where = school.standing === 'graduated' ? 'Graduated' : !enrolled ? 'Left the school' : school.termsBegun === 0 ? 'Arriving' : school.leave?.status === 'on' ? 'On Leave' : `Year ${yearOfStudy(person)}`;
  const troubled = school.standing === 'concern' || school.standing === 'warning' || school.standing === 'dismissed';
  // The standing after where they are, except where that already says it: until 2026-10-13 a graduate's line read
  // "Graduated, graduated, …" (found by the review of that day).
  const standing = school.standing === 'graduated' ? '' : `, ${STANDING_LABEL[school.standing].toLowerCase()}`;
  return (
    <AffairLine
      title="School"
      line={`${where}${standing}, ${rankIn(person)} of ${YALE_DRAMA.classSize} in the class.${next ? ` Next: ${next.label}, ${formatDateTime(next.at, zone)}.` : ''}`}
      alert={troubled ? `Your standing is ${STANDING_LABEL[school.standing].toLowerCase()}. The School screen says why.` : undefined}
      action={<Gated feature="ui.school" className="btn btn-sm" onClick={() => navigate('/workspace/school', 'School')}>{YALE_DRAMA.short}</Gated>}
      help="school.standing"
    />
  );
}

/**
 * Taxes and cover (`systems/health.ts`, `systems/taxreturn.ts`,
 * `systems/unemployment.ts`): what covers them, the next return, and a claim.
 */
function PapersLine({ cur }: { cur: string }) {
  const { sim, navigate } = useGame();
  const person = useWorld((s) => s.player);
  const cover = coverOn(person, sim.now);
  // The open return with something to pay, the newest first, or the newest open. Until 2026-10-14 it was the first
  // open one by year, so a 2026 return owing nothing, Connecticut’s $3.35 taken by levy, was named on 1 February 2028
  // as “due April 15, 2027”, and the 2027 return’s $2,286 to pay wasn’t (found by that day’s third round of evidence).
  const opens = Object.values(person.returns ?? {}).filter((r) => r.filedAt === undefined).sort((a, b) => b.year - a.year);
  const open = opens.find((r) => unassessedBalance(person, r) > 0) ?? opens[0];
  // Past its day, the penalty filing now would add; filed and unpaid, what's owed and growing. Until 2026-09-27 neither showed.
  const penalty = open && open.figures.balance > 0 && sim.now > open.due ? latePenaltyAll(person, open, sim.now, cur) : 0;
  // What's owed today, its interest and late-payment penalty since it was last brought up to date (`owedOn`), as Papers
  // says it: until 2026-10-10 the line read the balance as last stored, short of both.
  const owedTax = owedEverywhere(person, sim.now);
  // What filing it would pay: what no authority has assessed yet, a state's own assessment being in `owedTax` (from
  // 2026-10-11: until then it was in both).
  const toPay = open ? unassessedBalance(person, open) : 0;
  const claim = person.unemployment?.claim;
  // Growing once something owed is past its return's due date, from which the IRS's interest and late-payment penalty
  // run (IRC 6601(a), 6651(a)(2)), and a state's too (`accrueState`, from the return's due date). Until 2026-10-13 the
  // alert said so from the day a return was filed early and left unpaid, when nothing grows (found by that day's
  // evidence pass).
  const growing = Object.values(person.returns ?? {}).some((r) => sim.now > r.due
    && ((r.owed ?? 0) > 0 || Object.values(r.stateDue ?? {}).some((d) => (d.owed ?? 0) > 0)));
  // Only what needs doing is an alert: no cover, a return open or late, tax owed. The rest is the line. Past its due
  // date, as the penalty counts it, an open return “was due” on it: until 2026-10-14 it still “is due” a day gone.
  const alerts = [
    !cover ? 'You have no health cover.' : '',
    open ? `The ${open.year} return ${sim.now > open.due ? 'was' : 'is'} due ${formatDateTime(open.due, 'America/New_York').split(' at ')[0]}${toPay > 0 ? `, ${formatMoney(toPay + penalty, cur, { cents: false })} to pay${penalty > 0 ? ', a late penalty in it' : ''}` : ''}.` : '',
    owedTax > 0 ? `${formatMoney(owedTax, cur, { cents: false })} of tax owed${growing ? ', with its interest and a late penalty growing each month' : ''}.` : '',
  ].filter(Boolean);
  return (
    <AffairLine
      title="Papers"
      line={`Cover: ${coverLabel(person, sim.now) ?? 'none'}.${claim ? ` Unemployment, ${formatMoney(claim.weekly, cur, { cents: false })} a week.` : ''}`}
      alert={alerts.length ? alerts.join(' ') : undefined}
      action={<Gated feature="ui.papers" className="btn btn-sm" onClick={() => navigate('/workspace/papers', 'Papers')}>Papers</Gated>}
      help="papers.overview"
    />
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
