/**
 * SLATE — HOME.
 *
 * Immediate life. Where am I, what day is it, what happens next, what needs
 * attention, how am I doing. A command surface, not a place to bury depth.
 */

import { formatDaylight } from '@/engine/core/sun';
import { RATES_NOTE } from '@/engine/content/currency';
import { titleCaseLabel } from '@/engine/core/text';
import { placeProfile, placeKindLabel, formatPeople, type PlaceProfile } from '@/engine/world/place';
import { forecastFor, weatherAt, weatherIcon } from '@/engine/systems/weather';
import { WEEKDAY_NAMES } from '@/engine/core/time';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, MoneyText, Empty } from '@/ui/components/primitives';
import { TutorialCard } from '@/ui/shell/Tutorial';
import { openDecisions, lifeSnapshot, unreadNotifications } from '@/engine/world/world';
import { nextCommitment, upcoming } from '@/engine/world/calendar';
import { netWorth } from '@/engine/systems/finance';
import { readiness, wellbeingSummary } from '@/engine/systems/life';
import { activeProjects } from '@/engine/systems/film';
import { CITIES } from '@/engine/content/geography';
import {
  formatDate, formatRelative, formatTime, formatWeekdayDate, seasonOf, zoneAbbreviation,
} from '@/engine/core/time';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';

export function Home() {
  const { sim, navigate, run } = useGame();
  const snapshot = useWorld(lifeSnapshot);
  const decisions = useWorld(openDecisions);
  const next = useWorld(nextCommitment);
  const soon = useWorld((s) => upcoming(s, 6));
  const worth = useWorld((s) => netWorth(s, s.player.id));
  const projects = useWorld((s) => activeProjects(s, s.player.id).slice(0, 3));
  const unread = useWorld(unreadNotifications);

  const player = snapshot.player;
  const city = snapshot.city ?? CITIES.get(player.currentLocationId);
  const ready = readiness(player);
  const accounts = useWorld((s) => s.ledger.accountsOf(s.player.id));
  const primary = accounts.find((a) => a.id === player.primaryAccountId) ?? accounts[0];
  const place = city ? placeProfile(sim, city.id) : undefined;
  const weather = city ? weatherAt(sim, city.id) : undefined;
  const week = city ? forecastFor(sim, city.id, 6) : [];
  const unit = weather?.fahrenheit ? '°F' : '°C';

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">{formatWeekdayDate(sim.now, sim.zone)}</div>
        <h1>Good {partOfDay(sim.now, sim.zone)}, {player.firstName}.</h1>
        <p className="muted">
          {formatTime(sim.now, sim.zone)} in {city?.name ?? 'an unknown place'} ·{' '}
          {zoneAbbreviation(sim.now, sim.zone)} · {seasonOf(sim.now, sim.zone, city?.latitude ?? 34)}
          {weather && (
            <> · <span aria-hidden="true">{weather.icon}</span> {weather.temperature}{unit} {weather.condition}</>
          )}
        </p>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--s5)' }}>
        <Panel
          title="What Needs You"
          subtitle={decisions.length === 0 ? 'Nothing is waiting on a decision.' : `${decisions.length} open`}
          flush
          actions={unread.length > 0 ? (
            <button className="btn btn-ghost btn-sm" onClick={() => run('world.mark_read')}>
              Mark {unread.length} Read
            </button>
          ) : undefined}
        >
          {decisions.length === 0 ? (
            <Empty
              title="Nothing Pressing"
              body="No bills overdue, no offers expiring, no conflicts on the calendar. Go and do something you want to do."
            />
          ) : (
            <div className="list">
              {decisions.slice(0, 6).map((decision) => (
                <div
                  key={decision.id}
                  className="decision"
                  data-urgency={decision.urgency >= 85 ? 'critical' : decision.urgency >= 65 ? 'high' : 'normal'}
                >
                  <div className="decision-urgency" aria-hidden="true" />
                  <div className="grow">
                    <div className="row-between">
                      <span className="small strong">{decision.title}</span>
                      {decision.dueAt !== undefined && (
                        <span className={`xs ${decision.dueAt < sim.now ? 'negative' : 'dim'}`}>
                          {decision.dueAt < sim.now ? 'Overdue' : formatRelative(decision.dueAt, sim.now)}
                        </span>
                      )}
                    </div>
                    <p className="xs muted" style={{ margin: '2px 0 0' }}>{decision.detail}</p>
                    <div className="row gap-2 wrap" style={{ marginTop: 'var(--s2)' }}>
                      {decision.actions.map((action, index) => (
                        <button
                          key={action.label}
                          className="btn btn-sm btn-primary"
                          onClick={() => run('world.take_decision_action', { decisionId: decision.id, actionIndex: index })}
                        >
                          {action.label}
                        </button>
                      ))}
                      <button className="btn btn-sm" onClick={() => navigate(decision.route)}>
                        Open
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => run('world.dismiss_decision', { decisionId: decision.id })}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {decisions.length > 6 && (
                <div className="xs dim" style={{ padding: 'var(--s3) var(--s4)' }}>
                  {decisions.length - 6} more waiting.
                </div>
              )}
            </div>
          )}
        </Panel>

        <div className="col gap-4">
          <Panel title="What Happens Next" tight>
            {next ? (
              <>
                <div className="stat" style={{ marginBottom: 'var(--s3)' }}>
                  <span className="stat-label">{formatRelative(next.at, sim.now)}</span>
                  <span className="stat-value" style={{ fontSize: 'var(--size-md)' }}>{next.title}</span>
                  <span className="stat-note">
                    {formatDate(next.at, sim.zone)} at {formatTime(next.at, sim.zone)}
                    {next.locationId && next.locationId !== player.currentLocationId && (
                      <span className="negative"> · you are not in {CITIES.get(next.locationId)?.name}</span>
                    )}
                  </span>
                </div>
                <button className="btn btn-sm" onClick={() => navigate('/workspace/calendar', 'Calendar')}>
                  Open Calendar
                </button>
              </>
            ) : (
              <p className="muted small">Nothing scheduled. The day is yours.</p>
            )}

            {soon.length > 1 && (
              <>
                <hr className="divider" />
                <div className="col gap-2">
                  {soon.slice(1, 5).map((entry) => (
                    <div key={entry.id} className="row-between">
                      <span className="small truncate">{entry.title}</span>
                      <span className="xs dim nowrap">{formatRelative(entry.at, sim.now)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Panel>

          <Panel title="How You Are" tight>
            <p className="small muted" style={{ marginBottom: 'var(--s3)' }}>{wellbeingSummary(player)}</p>
            <div className="col gap-3">
              <Meter label="Energy" value={player.wellbeing.energy} />
              <Meter label="Stress" value={player.wellbeing.stress} invert />
              <Meter label="Readiness" value={ready} hint="How well you will perform at anything right now." />
            </div>
            <button className="btn btn-sm" style={{ marginTop: 'var(--s3)' }} onClick={() => navigate('/workspace/wellbeing', 'Wellbeing')}>
              Wellbeing
            </button>
          </Panel>

          {place && (
            <Panel
              title="Where You Are"
              tight
              actions={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/workspace/travel', 'Travel')}>Travel</button>}
            >
              <div className="strong">
                {place.city.name}{place.regionName ? `, ${place.regionName}` : ''} · {place.countryName}
              </div>
              <div className="xs dim" style={{ marginBottom: 'var(--s3)' }}>
                {place.away && place.homeCity
                  ? `${place.distanceFromHome} from home in ${place.homeCity.name}${place.hoursFromHome ? ` · ${place.hoursFromHome > 0 ? '+' : ''}${place.hoursFromHome}h from home time` : ''}.`
                  : 'Home.'}
                {placeLine(place) && ` ${placeLine(place)}.`}
              </div>
              <div className="grid grid-3">
                <Stat
                  label="Local Time"
                  value={place.localTime}
                  note={`${place.zoneAbbreviation}${place.away && place.hoursFromHome ? ` · ${place.hoursFromHome > 0 ? '+' : ''}${place.hoursFromHome}h from home` : ''}`}
                />
                <Stat
                  label="Daylight"
                  value={place.sun.polar === 'day' ? 'Midnight Sun' : place.sun.polar === 'night' ? 'Polar Night'
                    : `${formatTime(place.sun.sunrise ?? sim.now, place.zone)} – ${formatTime(place.sun.sunset ?? sim.now, place.zone)}`}
                  note={`${formatDaylight(place.sun.daylightMinutes)} of light`}
                />
                <Stat
                  label="Currency"
                  value={`${place.currency.symbol} ${place.currency.code}`}
                  note={`${place.currency.name}${place.currency.unitsPerUsd !== undefined && place.currency.code !== 'USD' ? ` · ${place.currency.unitsPerUsd} per $1` : ''}`}
                />
                <Stat
                  label="Cost Of Living"
                  value={place.costOfLivingIndex}
                  note={`Rent about ${place.localRent ?? formatMoneyCompact(place.medianRentCents)}/mo`}
                />
                <Stat label="Income Tax" value={`${Math.round(place.effectiveIncomeTax * 100)}%`} note="Effective on $60,000" />
                <Stat label="Sales Tax" value={`${(place.salesTax * 100).toFixed(1)}%`} note={`Property ${(place.propertyTax * 100).toFixed(2)}%`} />
                <Stat label="Industry" value={`${place.industryPresence}/100`} note={`Jobs ${place.jobMarketDepth}/100`} />
                <Stat
                  label="Languages"
                  value={place.languages[0] ?? '—'}
                  note={place.languages.slice(1).join(', ') || 'Official language'}
                />
                <Stat
                  label={place.countryName}
                  value={place.capital || place.continent}
                  note={`${place.continent} · ${place.countryPopulation >= 1_000_000 ? `${(place.countryPopulation / 1_000_000).toFixed(1)}M people` : `${place.countryPopulation.toLocaleString('en-US')} people`}${place.phone ? ` · +${place.phone}` : ''}`}
                />
              </div>
              <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>
                Drives on the {place.drivesOn}. Distances in {place.units.distance === 'mi' ? 'miles' : 'kilometres'}, temperatures in °{place.units.temperature}.
                {place.filmIncentive ? ` ${Math.round(place.filmIncentive * 100)}% film incentive here.` : ''}
                {place.currency.code !== 'USD' ? ` ${RATES_NOTE}` : ''}
              </p>
            </Panel>
          )}

          {weather && city && (
            <Panel title="Weather" tight actions={<span className="chip">{weather.climateName}</span>}>
              <div className="weather-now">
                <span className="weather-icon" aria-hidden="true">{weather.icon}</span>
                <div className="grow">
                  <div className="weather-temp mono">{weather.temperature}{unit}</div>
                  <div className="small muted">
                    {weather.condition} · High {weather.high}{unit} · Low {weather.low}{unit}
                  </div>
                  <div className="xs dim">
                    Humidity {weather.humidity}% · Wind {weather.fahrenheit ? `${Math.round(weather.windKph * 0.621)} mph` : `${weather.windKph} km/h`}
                  </div>
                </div>
              </div>
              <div className="weather-week" aria-label="The Days Ahead">
                {week.slice(1).map((day) => {
                  const [y, m, d] = day.dateKey.split('-').map(Number);
                  const weekday = WEEKDAY_NAMES[new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1)).getUTCDay()] ?? '';
                  return (
                    <div key={day.dateKey} className="weather-day" title={`${day.condition}, ${day.low}${unit} to ${day.high}${unit}`}>
                      <div className="xs dim">{weekday.slice(0, 3)}</div>
                      <div aria-hidden="true">{weatherIcon(day.condition)}</div>
                      <div className="xs mono">{day.high}° / {day.low}°</div>
                    </div>
                  );
                })}
              </div>
              <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>
                SLATE's climate model for {city.name}: the season, the latitude and the kind of place it is. Not a forecast service.
              </p>
            </Panel>
          )}
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 'var(--s5)' }}>
        <Panel title="Money" tight actions={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/workspace/bank', 'Bank')}>Bank</button>}>
          <div className="col gap-3">
            <Stat
              label={primary?.name ?? 'No account'}
              value={<MoneyText amount={primary?.balance ?? 0} />}
            />
            <Stat label="Net Worth" value={<MoneyText amount={worth.total} compact />} note={`${formatMoney(worth.assets, { cents: false })} in assets`} />
            {worth.liabilities > 0 && (
              <Stat label="Owed" value={<span className="mono negative">{formatMoney(worth.liabilities, { cents: false })}</span>} />
            )}
          </div>
        </Panel>

        <Panel title="Work" tight actions={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/workspace/jobs', 'Work')}>Work</button>}>
          {snapshot.job ? (
            <div className="col gap-3">
              <Stat label={snapshot.job.employerName} value={<span style={{ fontSize: 'var(--size-md)' }}>{snapshot.job.title}</span>} />
              <Meter label="Performance" value={snapshot.job.performance} />
              <Meter label="Attendance" value={snapshot.job.attendance} />
            </div>
          ) : (
            <div className="col gap-2">
              <p className="small muted">You are not employed.</p>
              <button className="btn btn-sm" onClick={() => navigate('/workspace/jobs', 'Work')}>Find work</button>
            </div>
          )}
        </Panel>

        <Panel title="Standing" tight actions={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/workspace/character', 'Character')}>Character</button>}>
          <div className="col gap-3">
            <Meter label="Public Fame" value={player.reputation.publicFame} />
            <Meter label="Professional Reputation" value={player.reputation.professionalReputation} />
            <Meter label="Industry Demand" value={player.reputation.industryDemand} />
          </div>
        </Panel>
      </div>

      <div className="grid grid-2">
        <Panel
          title="What You Are Working On"
          flush
          actions={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/workspace/projects', 'Projects')}>All Projects</button>}
        >
          {projects.length === 0 ? (
            <Empty
              title="Nothing In Development"
              body="No script, no shoot, no release. Every career in this game starts with somebody deciding to make something."
              action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/workspace/projects', 'Projects')}>Start Something</button>}
            />
          ) : (
            <div className="list">
              {projects.map((project) => (
                <button key={project.id} className="list-item" onClick={() => navigate('/workspace/projects', project.title)}>
                  <div className="grow">
                    <div className="small strong">{project.title}</div>
                    <div className="xs dim">
                      {project.format.replace(/_/g, ' ')} · {project.phase.replace(/_/g, ' ')}
                      {project.genres.length > 0 && ` · ${project.genres.join(', ')}`}
                    </div>
                  </div>
                  <span className="chip">{project.phase.replace(/_/g, ' ')}</span>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Home And Household" tight actions={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/workspace/property', 'Property')}>Property</button>}>
          {snapshot.home ? (
            <div className="col gap-3">
              <Stat
                label={snapshot.home.tenure === 'owned' ? 'You own' : 'You rent'}
                value={<span style={{ fontSize: 'var(--size-md)' }}>{snapshot.home.addressLine}</span>}
                note={`${snapshot.home.bedrooms} bed · ${snapshot.home.interiorSqft.toLocaleString('en-US')} sq ft`}
              />
              <Meter label="Condition" value={snapshot.home.condition} />
              <Stat label="Household" value={`${snapshot.householdSize} ${snapshot.householdSize === 1 ? 'person' : 'people'}`} />
            </div>
          ) : (
            <div className="col gap-2">
              <p className="small muted">You do not have a place of your own.</p>
              <button className="btn btn-sm" onClick={() => navigate('/workspace/property', 'Property')}>Find somewhere</button>
            </div>
          )}
        </Panel>
      </div>

      <TutorialCard />
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
