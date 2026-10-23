/**
 * SLATE — HOME.
 *
 * Immediate life. Where am I, what day is it, what happens next, what needs
 * attention, how am I doing. A command surface, not a place to bury depth.
 *
 * Its Home, Career, Travel, Cars and Land panels went with those systems in
 * the scope reset of 2026-10-09.
 *
 * From 2026-10-23 (the owner's brief 23) it reads in the day's order: Today, What Needs You, Up Next, How You Are and
 * Recent Updates. Until then it was the Calendar, What Needs You with every unread notice under the questions, How You
 * Are, Where You Are, the Weather and Your Affairs: the date and the time were said three times, the town and the weather
 * twice, and a graduate's 500 notices ran down the page between the questions and the rest. Where You Are and the Weather
 * are a line of Today, their detail a press away (their looks); Your Affairs' three lines went, Money, the School and
 * Papers being on the menu, and what they said needed doing is under What Needs You, with the way to its screen. The
 * notices are Recent Updates, the latest few, and every one is on Updates (`Updates.tsx`).
 */

import { useState } from 'react';
import { formatDaylight } from '@/engine/core/sun';
import { countWords, titleCaseLabel } from '@/engine/core/text';
import { placeProfile } from '@/engine/world/place';
import { WEATHER_EMOJI, forecastFor, weatherAt, weatherShort } from '@/engine/systems/weather';
import { MS_DAY, WEEKDAY_NAMES } from '@/engine/core/time';
import { PERFORMER_NOUN } from '@/engine/core/performer';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Meter, Empty } from '@/ui/components/primitives';
import { openDecisions, lifeSnapshot, unreadNotifications } from '@/engine/world/world';
import { entriesBetween, nextCommitment, upcoming } from '@/engine/world/calendar';
import { readiness, wellbeingSummary, EMPTY, OVERWROUGHT, fullNightBefore, fullNightWords, lookAfterOptions, type LookAfter } from '@/engine/systems/life';
import { CITIES } from '@/engine/content/geography';
import {
  dateKey, formatDate, formatRelative, formatTime, formatWeekdayDate, seasonOf, zoneAbbreviation,
} from '@/engine/core/time';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { cardsOf, stateOf } from '@/engine/systems/credit';
import { troubles } from '@/engine/systems/spending';
import { LookRegion, Open, at } from '@/ui/looks';
import { STANDING_LABEL } from '@/engine/systems/school';
import { papersAlerts, returnAsked } from '@/ui/components/Glance';
import { Gated, LockedPanel, useFeature } from '@/ui/guide/Guide';
import { HowItWorks } from '@/ui/guide/HowItWorks';
import { lookedAfter } from '@/ui/shell/TimeControls';
import { UPDATES_ROUTE } from '@/ui/shell/destinations';
import { useMedia } from '@/ui/components/media';
import { aboutLabel, groupNotices } from './Updates';
import type { Simulation } from '@/engine/core/simulation';

/** How many unread notices Recent Updates shows before View All Updates. */
const RECENT = 4;
/** How many questions What Needs You shows before the rest wait their turn. */
const QUESTIONS = 6;
/**
 * A phone on its side, whose first window What Needs You shares with the head and Up Next: there it shows the most
 * pressing thing waiting, a question or else a thing to put right, and how many more, with Show All (from 2026-10-23,
 * the owner's brief 24: "show the highest-priority item and a clear route to the remainder").
 */
const SHORT = '(max-height: 500px)';
/**
 * The guide's feature that opens each screen a line goes to: a line shows once its own chapter is read (`thingsToDo`'s
 * `feature`), and its button opens once the screen's is, as Your Affairs' Chase button waited for “Your Bank”.
 */
const SCREEN_FEATURE: Readonly<Record<string, string>> = {
  '/workspace/bank': 'ui.bank', '/workspace/school': 'ui.school', '/workspace/papers': 'ui.papers', '/workspace/calendar': 'ui.calendar',
};

export function Home() {
  const { sim, navigate, run } = useGame();
  const snapshot = useWorld(lifeSnapshot);
  const decisions = useWorld(openDecisions);
  const unread = useWorld(unreadNotifications);
  const shows = {
    calendar: useFeature('ui.calendar').open,
    needs: useFeature('ui.needs').open,
    how: useFeature('ui.how').open,
    where: useFeature('ui.where').open,
    weather: useFeature('ui.weather').open,
  };
  // What needs doing shows once the guide has opened its screen's chapter, as its line in Your Affairs did.
  const opened: Readonly<Record<string, boolean>> = {
    'ui.money': useFeature('ui.money').open,
    'ui.school': useFeature('ui.school').open,
    'ui.papers': useFeature('ui.papers').open,
    'ui.calendar': shows.calendar,
  };
  const needsDoing = useWorld(thingsToDo).filter((item) => opened[item.feature]);
  const [allQuestions, setAllQuestions] = useState(false);
  // The forecast's fold on a phone on its side (from 2026-10-23, brief 24): shut as Home opens.
  const [skyOpen, setSkyOpen] = useState(false);

  const player = snapshot.player;
  const city = snapshot.city ?? CITIES.get(player.currentLocationId);
  const place = city ? placeProfile(sim, city.id) : undefined;
  const today = dateKey(sim.now, sim.zone);
  const season = seasonOf(sim.now, sim.zone, city?.latitude ?? 34);
  const weather = city ? weatherAt(sim, city.id) : undefined;
  const week = city ? forecastFor(sim, city.id, 6) : [];
  const unit = weather?.fahrenheit ? '°F' : '°C';
  const short = useMedia(SHORT);
  const limit = allQuestions ? Infinity : short ? 1 : QUESTIONS;
  const questions = decisions.slice(0, limit);
  const todos = short && !allQuestions ? needsDoing.slice(0, Math.max(0, limit - questions.length)) : needsDoing;
  const waitingAll = decisions.length + needsDoing.length;
  const hidden = waitingAll - questions.length - todos.length;
  // The unread as Updates groups them, a run of the same notice about the same thing one row with its count, ranked as its
  // newest, the most important first (from 2026-10-23, brief 23's walk: two terms' “A Word On Your Coursework” were two of
  // the four rows). A run's notices share their importance, so ranking by its most important changed nothing (mutated).
  const runs = groupNotices(unread).sort((a, b) => b.notes[0]!.importance - a.notes[0]!.importance || b.notes[0]!.at - a.notes[0]!.at);
  const recent = runs.slice(0, RECENT);
  const beyond = unread.length - recent.reduce((n, r) => n + r.notes.length, 0);

  return (
    <>
      {/*
        Today: the day, the hour, the town and the sky, said once (from 2026-10-23). Each names the thing it is, and
        the thing knows what it opens into: the town into its region, country, money, daylight and population, which
        Where You Are's panel said until then, and the sky into its days and hours, which the Weather panel did.
      */}
      <LookRegion className="page-head today">
        <div className="today-main">
          <div className="eyebrow">
            <Open subject={at('day', today)}>{formatWeekdayDate(sim.now, sim.zone)}</Open>
            {' · '}
            <Open subject={at('person', player.id)}>{PERFORMER_NOUN[player.performerTitle]}</Open>
          </div>
          <h1>
            Good {partOfDay(sim.now, sim.zone)},{' '}
            <Open subject={at('person', player.id)}>{calledBy(player)}</Open>.
          </h1>
          {/* On a phone on its side the line drops the time, which the bar has, and the daylight, which the forecast's
              fold holds, and ends with the sky in a few words (from 2026-10-23, the owner's brief 24): until then the line,
              the forecast and the five days took the whole first window at 667 by 375, with nothing under them showing. */}
          <p className="muted today-line">
            {!short && <><Open subject={at('day', today)}>{formatTime(sim.now, sim.zone)}</Open>{place ? ' in ' : ''}</>}
            {/* The town, its zone and the season always, as the head said them, words until “Your Life, Hour By Hour”
                makes them links; the daylight, Where You Are's, once that chapter is read. */}
            {place ? (
              <>
                <Open subject={at('place', place.city.id)}>{place.city.name}</Open>
                {place.regionName && (<>{', '}<Open subject={at('region', place.city.parentId)}>{place.regionName}</Open></>)}
                {' · '}
                <Open subject={at('place', place.city.id)}>{zoneAbbreviation(sim.now, sim.zone)}</Open>
                {' · '}
                <Open subject={at('season', `${place.city.id}/${season}`)}>{season}</Open>
                {shows.where && !short && (
                  <>
                    {' · '}
                    <Open subject={at('daylight', place.city.id)}>
                      {place.sun.polar === 'day' ? 'Midnight Sun' : place.sun.polar === 'night' ? 'Polar Night'
                        : daylightWords(place, sim.now)}
                    </Open>
                  </>
                )}
                {weather && city && shows.weather && short && (
                  <>
                    {' · '}
                    <Open subject={at('weather', city.id)}>{weather.temperature}{unit} {titleCaseLabel(weather.condition)}</Open>
                  </>
                )}
              </>
            ) : (
              <>{` ${zoneAbbreviation(sim.now, sim.zone)} · ${season}`}</>
            )}
          </p>
          <div className="help-below today-actions">
            {!shows.where && <Gated feature="ui.where" className="btn btn-sm">Where You Are</Gated>}
            {/* The forecast's fold, a phone's only: on a desktop the days ahead are always shown. */}
            {weather && city && shows.weather && short && (
              <button type="button" className="btn btn-sm today-more" aria-expanded={skyOpen} aria-controls="today-weather" onClick={() => setSkyOpen(!skyOpen)}>
                {skyOpen ? 'Hide The Forecast' : 'Forecast And Daylight'}
              </button>
            )}
            <HowItWorks help="start.home" label="How Home Works" />
          </div>
        </div>
        {weather && city && (shows.weather ? (
          <div className="today-weather" id="today-weather" hidden={short && !skyOpen}>
            <div className="today-weather-now">
              <span aria-hidden="true" className="today-weather-icon">{WEATHER_EMOJI[weather.condition]}</span>
              <span>
                <Open subject={at('weather', city.id)}>{weather.temperature}{unit} {titleCaseLabel(weather.condition)}</Open>
                <span className="xs dim nowrap">{` High ${weather.high}${unit} · Low ${weather.low}${unit}`}</span>
              </span>
            </div>
            <div className="weather-week today-week" aria-label="The Days Ahead">
              {week.slice(1).map((day) => {
                const [y, m, d] = day.dateKey.split('-').map(Number);
                const weekday = WEEKDAY_NAMES[new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1)).getUTCDay()] ?? '';
                return (
                  <div key={day.dateKey} className="weather-day">
                    <div className="xs dim">
                      <Open subject={at('forecastday', `${city.id}/${day.dateKey}`)}>{weekday.slice(0, 3)}</Open>
                    </div>
                    <div aria-hidden="true">{WEATHER_EMOJI[day.condition]}</div>
                    <div className="xs weather-cond">{weatherShort(day.condition)}</div>
                    <div className="xs mono">{day.high}° / {day.low}°</div>
                  </div>
                );
              })}
            </div>
            {/* The daylight with the days ahead, where a phone's line leaves it out. */}
            {place && shows.where && short && (
              <p className="xs muted today-daylight-more">
                <Open subject={at('daylight', place.city.id)}>{place.sun.polar === 'day' ? 'Midnight Sun' : place.sun.polar === 'night' ? 'Polar Night' : daylightWords(place, sim.now)}</Open>
              </p>
            )}
            <div className="help-below"><HowItWorks help="day.weather" label="How The Weather Works" /></div>
          </div>
        ) : (
          <div className="today-weather today-weather-locked row gap-2 wrap">
            <Gated feature="ui.weather" className="btn btn-sm">Weather</Gated>
            <HowItWorks help="day.weather" label="How The Weather Works" />
          </div>
        ))}
      </LookRegion>

      <div className="home-grid">
        {!shows.needs ? <LockedPanel feature="ui.needs" title="What Needs You" /> : (
        // With nothing waiting, its head and one All Clear line (from 2026-10-23, brief 24): until then the line was a block in
        // the middle of a card stretched to Up Next's height, under a subtitle that said the same.
        <Panel
          title="What Needs You"
          subtitle={waitingAll === 0 ? undefined : needsLine(decisions.length, needsDoing.length)}
          flush
          help="day.needs"
        >
          {waitingAll === 0 ? (
            <Empty
              compact
              title="All Clear"
              body="You owe nobody anything past due, the bank and the card are in order, and the calendar doesn’t clash. Go and do something you want to do."
            />
          ) : (
            <LookRegion className="list">
              {questions.map((decision) => (
                <Question key={decision.id} decision={decision} />
              ))}
              {!short && decisions.length > QUESTIONS && (
                <div className="row-between xs dim" style={{ padding: 'var(--s3) var(--s4)' }}>
                  <span>{allQuestions ? `All ${decisions.length} questions, the most pressing first.` : `${upFirst(decisions.length - QUESTIONS === 1 ? 'one more question' : `${countWords(decisions.length - QUESTIONS)} more questions`)} waiting.`}</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAllQuestions(!allQuestions)}>
                    {allQuestions ? `Show The First ${QUESTIONS}` : `Show All ${decisions.length}`}
                  </button>
                </div>
              )}
              {/* What needs doing: a state to put right, with its screen. It goes when it's put right, never by a press here. */}
              {todos.map((item) => (
                <div key={item.text} className="decision" data-urgency="high">
                  <div className="decision-urgency" aria-hidden="true" />
                  <div className="grow row-between wrap">
                    <span className="small grow todo-text">{item.text}</span>
                    <span className="row gap-2">
                      <Gated feature={SCREEN_FEATURE[item.route.split('?')[0]!] ?? item.feature} className="btn btn-sm" onClick={() => navigate(item.route, item.label)}>
                        Open {item.label}
                      </Gated>
                      <ToDoHelp feature={item.feature} />
                    </span>
                  </div>
                </div>
              ))}
              {short && (hidden > 0 || allQuestions) && waitingAll > 1 && (
                <div className="row-between xs dim needs-more">
                  <span>{allQuestions ? `All ${waitingAll}, the most pressing first.` : `${upFirst(hidden === 1 ? 'one more' : `${countWords(hidden)} more`)} waiting.`}</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAllQuestions(!allQuestions)}>
                    {allQuestions ? 'Show The Most Pressing' : `Show All ${waitingAll}`}
                  </button>
                </div>
              )}
            </LookRegion>
          )}
        </Panel>
        )}

        {!shows.calendar ? <LockedPanel feature="ui.calendar" title="Up Next" /> : <UpNext />}

        {!shows.how ? <LockedPanel feature="ui.how" title="How You Are" /> : <HowYouAre />}

        {/* Opened by the same chapter as What Needs You, whose locked panel says both. */}
        {shows.needs && (
        <Panel
          title="Recent Updates"
          subtitle={unread.length === 0 ? 'All read.' : unread.length === 1 ? 'One unread notice.' : `${upFirst(countWords(unread.length))} unread, the most important first.`}
          flush
          actions={unread.length > 0 ? (
            <Gated feature="world.mark_read" className="btn btn-ghost btn-sm" onClick={() => run('world.mark_read')}>
              Mark {unread.length} Read
            </Gated>
          ) : undefined}
          help="day.needs"
        >
          {unread.length === 0 ? (
            <p className="small muted" style={{ padding: '0 var(--s4) var(--s4)', margin: 0 }}>
              You’ve read every notice. Updates keeps them all.
            </p>
          ) : (
            <LookRegion className="list">
              {recent.map(({ key, notes: [note, ...earlier] }) => (
                <div key={key} className="list-item list-static notice-row">
                  <div className="grow">
                    <div className="small strong">
                      <Open subject={at('notification', note!.id)}>{titleCaseLabel(note!.title)}</Open>
                    </div>
                    <div className="xs dim">
                      {aboutLabel(note!.category)} · {formatRelative(note!.at, sim.now)}
                      {earlier.length > 0 && ` · ${earlier.length === 1 ? 'one earlier' : `${countWords(earlier.length)} earlier`} on Updates`}
                    </div>
                    <div className="xs muted clamp-2">{note!.body}</div>
                  </div>
                  <div className="row gap-2 notice-row-actions">
                    {note!.route && (
                      <button className="btn btn-sm" onClick={() => navigate(note!.route!, titleCaseLabel(note!.title))}>Go There</button>
                    )}
                    <Gated feature="world.mark_read" className="btn btn-sm btn-ghost" onClick={() => run('world.mark_read', { notificationIds: [note!, ...earlier].map((n) => n.id) })}>
                      Mark Read
                    </Gated>
                  </div>
                </div>
              ))}
            </LookRegion>
          )}
          <div className="row-between panel-foot">
            <span className="xs dim">{beyond > 0 ? `${upFirst(countWords(beyond))} more unread.` : ''}</span>
            <button type="button" className="btn btn-sm" onClick={() => navigate(UPDATES_ROUTE, 'Updates')}>
              View All Updates
            </button>
          </div>
        </Panel>
        )}
      </div>
    </>
  );
}

/** How This Works beside a thing to put right: its screen's entry, as its line in Your Affairs had it. */
function ToDoHelp({ feature }: { feature: string }) {
  if (feature === 'ui.money') return <HowItWorks help="money.affairs" />;
  if (feature === 'ui.school') return <HowItWorks help="school.standing" />;
  if (feature === 'ui.papers') return <HowItWorks help="papers.overview" />;
  return <HowItWorks help="day.calendar" />;
}

/**
 * The line under What Needs You's title: how many questions wait, and how many things to put right. Drawn only with
 * something waiting (from 2026-10-23, brief 24): with nothing, the panel is its head and All Clear. Until then it said "No
 * questions are waiting on you." over All Clear; when brief 24 took that line away the words stayed here, written and never
 * shown, until its final runs found them later that day.
 */
function needsLine(questions: number, todo: number): string {
  const q = questions === 0 ? '' : questions === 1 ? 'a question waiting on you' : `${countWords(questions)} questions waiting on you`;
  const t = todo === 0 ? '' : todo === 1 ? 'one thing to put right' : `${countWords(todo)} things to put right`;
  return `${upFirst(q && t ? `${q}, and ${t}` : q || t)}.`;
}
const upFirst = (line: string) => `${line[0]!.toUpperCase()}${line.slice(1)}`;
/** The town's daylight today, in the words the head's line says it. */
const daylightWords = (place: NonNullable<ReturnType<typeof placeProfile>>, now: number) =>
  `Daylight ${formatTime(place.sun.sunrise ?? now, place.zone)} to ${formatTime(place.sun.sunset ?? now, place.zone)}, ${formatDaylight(place.sun.daylightMinutes)}`;

/**
 * A question: its title, when it's due, what it's about in two lines and the rest on demand, and its answers. Answering,
 * Go There and Dismiss are the commands they always were (`world.take_decision_action`, `world.dismiss_decision`).
 */
function Question({ decision }: { decision: ReturnType<typeof openDecisions>[number] }) {
  const { sim, navigate, run } = useGame();
  const [whole, setWhole] = useState(false);
  const long = decision.detail.length > 160;
  return (
    <div
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
        <p className={`xs muted${whole || !long ? '' : ' clamp-2'}`} style={{ margin: '2px 0 0' }}>{decision.detail}</p>
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
          {long && (
            <button type="button" className="btn btn-ghost btn-sm" aria-expanded={whole} onClick={() => setWhole(!whole)}>
              {whole ? 'Show Less' : 'Read It All'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Up Next: the next commitment, then the five after it (the Calendar panel until 2026-10-23, its words the same). One
 * button into the month, in the header.
 */
function UpNext() {
  const { sim, navigate } = useGame();
  const player = useWorld((s) => s.player);
  const next = useWorld(nextCommitment);
  // The trip the next commitment carries, where it carries its own, and the full night before it while one's still to be had.
  const nextTrip = useWorld((s) => { const n = nextCommitment(s); return n ? s.timeline.get(n.id)?.travelMinutes ?? 0 : 0; });
  const fullNight = useWorld((s) => { const n = fullNightBefore(s); return n && n.by >= s.now ? fullNightWords(s, n) : undefined; });
  const soon = useWorld((s) => upcoming(s, 6));
  const today = dateKey(sim.now, sim.zone);
  return (
    <Panel
      look={at('day', today)}
      title="Up Next"
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
              {/* Not of a commitment that carries its own trip (`travelMinutes`, the career's meetings, auditions and
                  work days), whose handler takes the trip as made and never asks the town, as its entry and its stop say
                  (from 2026-10-21, brief 20, found by both the guide area and the life area): until then a shoot day in
                  New York read "you’re not in New York" in red from New Haven, where the entry it opens says the trip is
                  part of it. */}
              {next.locationId && next.locationId !== player.currentLocationId && nextTrip <= 0 && (
                <span className="negative">
                  {' · you’re not in '}
                  <Open subject={at('place', next.locationId)}>{CITIES.get(next.locationId)?.name ?? 'that place'}</Open>
                </span>
              )}
            </span>
            {/* When a full night before it starts, said by the evening before (`fullNightBefore`, from 2026-10-21, the
                owner's brief 20, D3): until then nothing said it until the Sleep dialog, opened at bedtime, said there
                wasn't time for one. */}
            {fullNight && <span className="stat-note">{fullNight}</span>}
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
                  {/* Two lines before it's cut (from 2026-10-17, brief 14's document journey): one line cut "Yale Cabaret,
                      Season 59: The Show Ends" short at 390 wide. */}
                  <span className="small clamp-2" style={{ minWidth: 0 }}>
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
        {/* Under what it explains, on its left edge (from 2026-10-23, brief 24): until then it stood alone at the right. */}
        <div className="help-below">
          <HowItWorks help="day.plans" label="How Your Own Plans Work" />
        </div>
      </LookRegion>
    </Panel>
  );
}

/**
 * How You Are: the line that sums it up, the three dials, and the first two things Look After Yourself offers, in the
 * engine's own order (`lookAfterOptions`: what's costing the body every hour first, then by the readiness it gives
 * back), each done as the menu does it. The menu, with all of them, stays in the bar.
 */
function HowYouAre() {
  const { sim, run, toast } = useGame();
  const player = useWorld((s) => s.player);
  const ready = readiness(player);
  const options = useWorld((s) => lookAfterOptions(s).filter((o) => !o.refused).slice(0, 2));
  const doing = useFeature('life.look_after');
  // As the bar's Look After Yourself does it: the command, then when it was done.
  const lookAfter = (action: LookAfter) => {
    const said = lookedAfter(sim, action, run<{ doneAt: number }>('life.look_after', { action }));
    if (said) toast(said, 'positive');
  };
  const cur = saveCurrency(sim.universe);
  return (
    <Panel title="How You Are" tight look={at('person', player.id)} help="body.how">
      {/*
        The summary names you, and the three bars name their dials, so
        each is the way into itself. Six more dials are simulated every
        hour and have never been on a screen — they are behind the
        person, one press away, rather than crowded onto this panel.
      */}
      <LookRegion>
        <p className="small muted" style={{ marginBottom: 'var(--s3)' }}>
          <Open subject={at('person', player.id)}>{wellbeingSummary(player, true, { at: sim.now, zone: sim.zone })}</Open>
        </p>
        <div className="col gap-3">
          <Meter label="Energy" value={player.wellbeing.energy} line={EMPTY} look={at('dial', `${player.id}/energy`)} />
          <Meter label="Stress" value={player.wellbeing.stress} invert line={OVERWROUGHT} look={at('dial', `${player.id}/stress`)} />
          <Meter label="Readiness" value={ready} look={at('readiness', player.id)} />
        </div>
        {options.length > 0 && (
          <div className="look-after-now">
            <div className="eyebrow">Look After Yourself</div>
            <div className="row gap-2 wrap">
              {options.map((o, i) => (
                <Gated key={o.action} feature="life.look_after" className={`btn btn-sm${i === 0 && (o.urgent || o.gain >= 0.5) ? ' btn-primary' : ''}`} onClick={() => (doing.open ? lookAfter(o.action) : doing.ask())}>
                  {o.label} <span className="btn-detail">{o.minutes} Min{o.cost > 0 ? `, ${formatMoney(o.cost, cur)}` : ''}</span>
                </Gated>
              ))}
            </div>
            {options[0] && <p className="xs dim" style={{ margin: 'var(--s1) 0 0' }}>{options[0].why}</p>}
            <div className="help-below"><HowItWorks help="body.look-after" /></div>
          </div>
        )}
      </LookRegion>
    </Panel>
  );
}

/**
 * What needs doing: a state to put right, each with its screen and the guide's feature that opens it. What Your Affairs
 * said under its Money, School and Papers lines as alerts until 2026-10-23, and what What Needs You said with nothing to
 * decide (`troubles`, which the day's worry reads too, and a clash in the next month), now listed under the questions
 * whatever else is there. Home shows a line once its feature is open, as its Your Affairs line did. The words are theirs.
 */
export function thingsToDo(s: Simulation): { text: string; route: string; label: string; feature: string }[] {
  const cur = saveCurrency(s.universe);
  const m = (cents: number) => formatMoney(cents, cur, { cents: false });
  const person = s.player;
  const out: { text: string; route: string; label: string; feature: string }[] = [];
  const said = new Set<string>();
  const add = (text: string, route: string, label: string, feature: string) => { if (!said.has(text)) { said.add(text); out.push({ text, route, label, feature }); } };
  const papersOpen = person.school !== undefined;
  for (const t of troubles(s, person)) {
    if (t.kind === 'owed') add(`You owe ${m(t.amount)} that went unpaid.`, '/workspace/bank', 'Money', 'ui.money');
    else if (t.kind === 'overdrawn') add(`Your account is ${m(t.amount)} overdrawn.`, '/workspace/bank', 'Money', 'ui.money');
    else if (t.kind === 'card') add(`Your card is nearly at its limit, owing ${m(t.amount)}.`, '/workspace/bank?tab=cards', 'Money', 'ui.money');
    else if (t.kind === 'card_behind') {
      // The card named, where there's more than one.
      const card = t.accountId ? s.universe.accounts[t.accountId] : undefined;
      const state = card && person.credit ? stateOf(person, card) : person.credit;
      const which = card && cardsOf(s, person).length > 1 ? `The ${card.name}` : 'Your card';
      // Unsuspended, a card is one payment behind: the second missed suspends it (`SUSPEND_AFTER`), and every way a
      // suspension lifts puts the count back to none. “N payments behind” for two or more went on 2026-10-13, reached by
      // no played life once a card paid off reset its count (defect 68 of that day’s third round; found by its final checks).
      add(`${which} is ${state?.suspended ? 'suspended' : 'a payment behind'}, owing ${m(t.amount)}.`, '/workspace/bank?tab=cards', 'Money', 'ui.money');
    }
    // A late return and income tax owed are Papers' alerts below (`papersAlerts`), with the penalty and the growing interest, once a life has Papers.
    else if (t.kind === 'return_late') { if (!papersOpen) add(`A tax return is past its due date and not filed yet. You owe ${m(t.amount)}, including the penalty so far.`, '/workspace/papers?tab=returns', 'Papers', 'ui.papers'); }
    else if (t.kind === 'medical') add(`You owe ${m(t.amount)} for medical care.`, '/workspace/papers?tab=health', 'Papers', 'ui.papers');
    else if (t.kind === 'collections') add(`${m(t.amount)} you owe is with a collection agency.`, '/workspace/bank', 'Money', 'ui.money');
    else if (!papersOpen) add(`You owe ${m(t.amount)} of income tax.`, '/workspace/papers?tab=returns', 'Papers', 'ui.papers');
  }
  if (entriesBetween(s, s.now, s.now + 30 * MS_DAY).some((e) => e.conflicted)) add('Two things on your calendar in the next month are at the same time.', '/workspace/calendar', 'Calendar', 'ui.calendar');

  const school = person.school;
  if (school && (school.standing === 'concern' || school.standing === 'warning' || school.standing === 'dismissed')) {
    add(`Your standing is ${STANDING_LABEL[school.standing].toLowerCase()}. The School screen says why.`, '/workspace/school', 'School', 'ui.school');
  }
  // Taxes and cover, as Papers' head says them (`papersAlerts`). Not the return's line while its own question is open
  // (`Your 2026 Tax Return`, with File It), which says the same above it.
  if (school) {
    for (const a of papersAlerts(s)) if (!(a.kind === 'return' && a.year !== undefined && returnAsked(s, a.year))) add(a.text, a.kind === 'cover' ? '/workspace/papers?tab=health' : '/workspace/papers?tab=returns', 'Papers', 'ui.papers');
  }
  return out;
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
