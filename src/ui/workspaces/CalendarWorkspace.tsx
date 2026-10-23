import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { titleCaseLabel } from '@/engine/core/text';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Modal, Stat } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { HowItWorks } from '@/ui/guide/HowItWorks';
import { said, toStart } from '@/ui/looks/words';
import { monthGrid, entriesBetween, keptCalendars, CALENDAR_LEGEND, LEGEND_BY_CATEGORY, type CalendarDay, type CalendarEntry } from '@/engine/world/calendar';
import { formatDate, formatDuration, formatTime, startOfDay, zonedParts, MS_DAY, MS_MINUTE } from '@/engine/core/time';
import { LONGEST_TITLE, PLAN_KIND, PLAN_LENGTHS, type PlanResult } from '@/engine/world/plans';
import { CITIES } from '@/engine/content/geography';
import { tripWords } from '@/engine/systems/proagent';
import { holidayLabel, isHolidaysLoaded, loadCountryHolidays } from '@/engine/content/holidays';
import { canPlan, dayLabel, firstFreeSlot, hiddenIn, holidayChips, openSlots, roomFor, standingIn, stillStands } from './cell';
import { BackToHome } from '@/ui/components/BackToHome';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** The entries as runs: the same title together, in the order each first comes. */
export function runsOf(entries: readonly CalendarEntry[]): { title: string; entries: CalendarEntry[] }[] {
  const runs = new Map<string, CalendarEntry[]>();
  for (const e of [...entries].sort((a, b) => a.at - b.at)) runs.set(e.title, [...(runs.get(e.title) ?? []), e]);
  return [...runs].map(([title, list]) => ({ title, entries: list }));
}

export function CalendarWorkspace() {
  const { sim, refresh } = useGame();
  const today = zonedParts(sim.now, sim.homeZone);

  // Every calendar this life keeps, fetched once per country.
  const wanted = keptCalendars(sim).map((c) => c.countryId).join(',');
  useEffect(() => {
    const ids = wanted.split(',').filter((id) => id && !isHolidaysLoaded(id));
    if (ids.length === 0) return;
    let cancelled = false;
    Promise.all(ids.map((id) => loadCountryHolidays(id).catch(() => 0)))
      .then(() => { if (!cancelled) refresh(); });
    return () => { cancelled = true; };
  }, [wanted, refresh]);
  const [view, setView] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<CalendarEntry | null>(null);
  const [planning, setPlanning] = useState<string | null>(null);

  const days = useWorld((s) => monthGrid(s, view.year, view.month), [view.year, view.month]);
  // What is still coming. A plan you called off is not in the next thirty
  // days, however recently it was.
  const next30 = useWorld((s) => entriesBetween(s, s.now, s.now + 30 * MS_DAY).filter(stillStands));
  const conflicts = next30.filter((e) => e.conflicted);
  const collisions = [...conflicts].sort((x, y) => x.at - y.at).reduce((runs, e) => {
    const last = runs[runs.length - 1];
    if (last && e.at < last.end) { last.end = Math.max(last.end, e.endsAt ?? e.at); return runs; }
    runs.push({ end: e.endsAt ?? e.at });
    return runs;
  }, [] as { end: number }[]).length;
  // The day chosen, or today's while none is (from 2026-10-23, brief 23): choosing a day shows its agenda, brought into
  // view under the month. Until then nothing showed under the month until a day was chosen, and the choice opened below
  // the fold at 1440 by 900 with nothing to say it had.
  const selectedDay = days.find((d) => d.key === selected) ?? days.find((d) => d.isToday);
  const agenda = useRef<HTMLDivElement>(null);
  useEffect(() => { if (selected) agenda.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }); }, [selected]);
  const groups = runsOf(next30);
  const [openRuns, setOpenRuns] = useState<ReadonlySet<string>>(new Set());
  const planningDay = days.find((d) => d.key === planning);

  const shift = (delta: number) => {
    setView((v) => {
      const month = v.month + delta;
      if (month < 1) return { year: v.year - 1, month: 12 };
      if (month > 12) return { year: v.year + 1, month: 1 };
      return { year: v.year, month };
    });
  };

  return (
    <>
      {/* Back To Home where its eyebrow named it, from brief 24 (2026-10-23): it's Home's, by Open Calendar, and not on
          the menu. */}
      <div className="page-head">
        <BackToHome />
        <h1>Your Plans And Commitments</h1>
        <p className="muted">
          Everything on your calendar, and the public holidays where you are. When two things you need to be at
          overlap, they’re marked Clash.
        </p>
      </div>

      {/* A collision is a run of items that overlap, however many are in it: until 2026-09-27 it was the items over two, rounded up, so three at once read as two. */}
      {conflicts.length > 0 && (
        <div className="callout callout-negative" style={{ marginBottom: 'var(--s5)' }}>
          <strong>{collisions === 1 ? 'A clash' : toStart(said(collisions, 'clash', 'clashes'))} in the next month.</strong>
          <ul className="small" style={{ margin: 'var(--s2) 0 0', paddingLeft: 'var(--s4)' }}>
            {conflicts.slice(0, 6).map((entry) => (
              <li key={entry.id}>
                {titleCaseLabel(entry.title)} — {formatDate(entry.at, sim.homeZone)} at {formatTime(entry.at, sim.homeZone)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Panel
        title={`${MONTHS[view.month - 1]} ${view.year}`}
        actions={
          <>
            <button className="btn btn-sm" onClick={() => shift(-1)} aria-label="Previous Month">‹</button>
            <button className="btn btn-sm" onClick={() => setView({ year: today.year, month: today.month })}>Today</button>
            <button className="btn btn-sm" onClick={() => shift(1)} aria-label="Next Month">›</button>
          </>
        }
      >
        <div className="cal-grid">
          {WEEKDAYS.map((day) => <div key={day} className="cal-weekday">{day}</div>)}
          {days.map((day) => (
            <button
              key={day.key}
              className="cal-day"
              data-out={!day.inMonth}
              data-today={day.isToday}
              onClick={() => setSelected(day.key === selected ? null : day.key)}
              aria-label={dayLabel(day, sim.homeZone)}
              style={{ textAlign: 'left', border: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }}
            >
              <div className="row-between">
                <span className="cal-daynum">{day.dayOfMonth}</span>
                {day.holidays.length > 0 && <span className="xs dim cal-holiday-mark" aria-hidden="true">✦</span>}
              </div>
              {day.holidays.slice(0, holidayChips(day)).map((holiday) => (
                <span
                  key={`${day.key}:${holiday.name}`}
                  className="cal-event"
                  style={{ '--event-colour': LEGEND_BY_CATEGORY.holiday?.colour, opacity: holiday.type === 'public' ? 1 : 0.7 } as CSSProperties}
                  title={holidayLabel(holiday)}
                >
                  {holiday.name === holiday.englishName ? titleCaseLabel(holiday.name) : holiday.name}
                </span>
              ))}
              {standingIn(day).slice(0, roomFor(day)).map((entry) => (
                <span
                  key={entry.id}
                  className="cal-event"
                  data-conflict={entry.conflicted}
                  style={{ '--event-colour': LEGEND_BY_CATEGORY[entry.category]?.colour } as CSSProperties}
                  title={titleCaseLabel(entry.title)}
                >
                  {titleCaseLabel(entry.title)}
                </span>
              ))}
              {hiddenIn(day) > 0 && (
                <span className="xs dim cal-more">+{hiddenIn(day)} more</span>
              )}
            </button>
          ))}
        </div>

        <hr className="divider" />
        <div className="cal-legend">
          {CALENDAR_LEGEND.filter((e) => e.category !== 'system').map((entry) => (
            <span key={titleCaseLabel(entry.category)} className="cal-legend-item" title={entry.description}>
              <span className="cal-swatch" style={{ background: entry.colour }} />
              {entry.label}
            </span>
          ))}
        </div>
      </Panel>

      {selectedDay && (
        <div ref={agenda}>
        <Panel
          title={`${selectedDay.isToday ? 'Today, ' : ''}${formatDate(selectedDay.date, sim.homeZone)}`}
          subtitle={selectedDay.holidays.length > 0 ? selectedDay.holidays.map(holidayLabel).join(' · ') : `${selectedDay.season}`}
          flush
          actions={(
            <>
              {canPlan(selectedDay, sim.now, sim.homeZone) && (
                <Gated feature="calendar.schedule" className="btn btn-sm btn-primary" onClick={() => setPlanning(selectedDay.key)}>
                  Put Something On It
                </Gated>
              )}
              {!selectedDay.isToday && <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Show Today</button>}
            </>
          )}
          help="day.plans"
        >
          {selectedDay.entries.length === 0 ? (
            <Empty
              title="No Plans"
              body={canPlan(selectedDay, sim.now, sim.homeZone)
                ? 'You have nothing on that day. Press Put Something On It to add a plan.'
                : 'You had nothing on that day.'}
            />
          ) : (
            <div className="list">
              {selectedDay.entries.map((entry) => (
                <button key={entry.id} className="list-item" onClick={() => setDetail(entry)}>
                  <span
                    className="cal-swatch"
                    style={{ background: LEGEND_BY_CATEGORY[entry.category]?.colour, width: 4, height: 32, borderRadius: 2 }}
                    aria-hidden="true"
                  />
                  <div className="grow">
                    <div className="small strong">{titleCaseLabel(entry.title)}</div>
                    <div className="xs dim">
                      {formatTime(entry.at, sim.homeZone)}
                      {entry.durationMinutes ? ` · ${formatDuration(entry.durationMinutes * MS_MINUTE)}` : ''}
                      {entry.locationId ? ` · ${CITIES.get(entry.locationId)?.name ?? ''}` : ''}
                    </div>
                  </div>
                  {entry.category === 'home' && <span className="chip chip-positive">{LEGEND_BY_CATEGORY.home?.label}</span>}
                  {entry.conflicted && <span className="chip chip-negative">Clash</span>}
                  {statusOf(entry) !== 'pending' && <span className="chip">{statusWords(statusOf(entry))}</span>}
                </button>
              ))}
            </div>
          )}
        </Panel>
        </div>
      )}


      {/* A run of the same call is one line, its count and its dates, opening into each (from 2026-10-23, brief 23): until
          then the next thirty days listed each, and a run's rehearsals filled the twenty it showed. */}
      <Panel title="Next Thirty Days" subtitle={next30.length ? 'Everything in the next thirty days, a run of the same call on one line.' : undefined} flush>
        {next30.length === 0 ? (
          <Empty
            title="No Plans Ahead"
            body="No plans or commitments in the next thirty days. Holidays are marked on the month above, not listed here."
          />
        ) : (
          <div className="list">
            {groups.map((group) => {
              const first = group.entries[0]!;
              const many = group.entries.length > 1;
              const open = openRuns.has(group.title);
              const clash = group.entries.some((e) => e.conflicted);
              const swatch = <span className="cal-swatch" style={{ background: LEGEND_BY_CATEGORY[first.category]?.colour }} aria-hidden="true" />;
              const chips = (
                <>
                  {first.requiresPlayer && <span className="chip">You</span>}
                  {first.category === 'home' && <span className="chip chip-positive">{LEGEND_BY_CATEGORY.home?.label}</span>}
                  {clash && <span className="chip chip-negative">Clash</span>}
                </>
              );
              if (!many) {
                return (
                  <button key={first.id} className="list-item" onClick={() => setDetail(first)}>
                    {swatch}
                    <div className="grow">
                      <div className="small">{titleCaseLabel(first.title)}</div>
                      <div className="xs dim">{formatDate(first.at, sim.homeZone)} · {formatTime(first.at, sim.homeZone)}</div>
                    </div>
                    {chips}
                  </button>
                );
              }
              const last = group.entries[group.entries.length - 1]!;
              return (
                <div key={group.title} className="cal-run">
                  <button className="list-item" aria-expanded={open} onClick={() => setOpenRuns((was) => { const next = new Set(was); if (next.has(group.title)) next.delete(group.title); else next.add(group.title); return next; })}>
                    {swatch}
                    <div className="grow">
                      <div className="small">{`${titleCaseLabel(first.title)} (${group.entries.length})`}</div>
                      <div className="xs dim">{`${formatDate(first.at, sim.homeZone)} to ${formatDate(last.at, sim.homeZone)}, the next at ${formatTime(first.at, sim.homeZone)}`}</div>
                    </div>
                    {chips}
                    <span className="xs dim">{open ? 'Hide Each' : 'Show Each'}</span>
                  </button>
                  {open && (
                    <div className="list cal-run-each">
                      {group.entries.map((entry) => (
                        <button key={entry.id} className="list-item" onClick={() => setDetail(entry)}>
                          <div className="grow">
                            <div className="xs">{formatDate(entry.at, sim.homeZone)} · {formatTime(entry.at, sim.homeZone)}</div>
                          </div>
                          {entry.conflicted && <span className="chip chip-negative">Clash</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {detail && <EntryDetail entry={detail} onClose={() => setDetail(null)} />}
      {planningDay && (
        <PlanForm
          day={planningDay}
          onClose={() => setPlanning(null)}
          onDone={() => { setPlanning(null); refresh(); }}
        />
      )}
    </>
  );
}

/**
 * Putting something on a day.
 *
 * A modal, because it asks a question and changes the world — which is the
 * one thing a look never does. Three questions and no more: what it is, when
 * it starts, and how long it takes. It used to ask which kind of day it was
 * and who it was with; the family was the only other kind and the only
 * company, and both went with it.
 *
 * No "where" yet. Every plan is where you are standing. When it was written
 * nothing in the game moved you anywhere else; travel to a job, a sublet and
 * a move all do now, and a plan is still made where you are at the time, so
 * a city you won't be in is never offered.
 */
function PlanForm({ day, onClose, onDone }: { day: CalendarDay; onClose: () => void; onDone: () => void }) {
  const { sim, run } = useGame();
  const zone = sim.homeZone;
  const [title, setTitle] = useState('');
  const [minute, setMinute] = useState(() => firstFreeSlot(day, sim.now, zone));
  const [minutes, setMinutes] = useState(60);
  const [error, setError] = useState<string | undefined>();

  const at = startOfDay(day.date, zone) + minute * MS_MINUTE;
  const slots = openSlots(day, sim.now, zone);

  const put = () => {
    // The command succeeds even when the calendar declines the plan: a
    // refusal is an answer, not a failure, and it belongs beside the field
    // rather than in a toast that slides away while you are still reading it.
    const result = run<PlanResult>('calendar.schedule', {
      title, at, durationMinutes: minutes,
    });
    if (result.value?.ok) { onDone(); return; }
    setError(result.value?.error ?? result.error ?? 'That plan couldn’t be added, so the calendar is as it was.');
  };

  return (
    <Modal
      title={`Put Something On ${formatDate(day.date, zone)}`}
      onClose={onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Never Mind</button>
          <button className="btn btn-primary" onClick={put} disabled={title.trim().length === 0}>
            Put It On
          </button>
        </>
      )}
    >
      <div className="field">
        <label htmlFor="plan-title">What Is It</label>
        <input
          id="plan-title"
          type="text"
          value={title}
          maxLength={LONGEST_TITLE}
          placeholder="A name you’ll recognize on the day"
          onChange={(e) => { setTitle(e.target.value); setError(undefined); }}
        />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="plan-at">When It Starts</label>
          <select id="plan-at" value={minute} onChange={(e) => { setMinute(Number(e.target.value)); setError(undefined); }}>
            {slots.map((slot) => (
              <option key={slot} value={slot}>
                {formatTime(startOfDay(day.date, zone) + slot * MS_MINUTE, zone)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="plan-length">How Long It Takes</label>
          <select id="plan-length" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
            {PLAN_LENGTHS.map((length) => (
              <option key={length.minutes} value={length.minutes}>{length.label}</option>
            ))}
          </select>
        </div>
      </div>
      {/* The clash by the chip's own word (from 2026-10-20, brief 17), as the screen's heading has it: until then "the calendar
          marks the clash". */}
      <p className="xs dim" style={{ margin: 0 }}>
        You’ll need to be in {CITIES.get(sim.player.currentLocationId)?.name ?? 'the place you are now'} for it, and the clock
        stops when it’s time. You can have two things at the same time, and the calendar marks them Clash.
      </p>
      {error && <p className="small negative" style={{ marginTop: 'var(--s3)' }}>{error}</p>}
    </Modal>
  );
}

/** An entry's own state, in the word the screen shows. */
function statusOf(entry: CalendarEntry): string {
  return entry.status === 'done' ? 'completed' : entry.status;
}

/**
 * One entry, opened.
 *
 * What it is, when it is, how long it runs and what state it is in. The one
 * thing here that is yours is a plan you made: you can call it off, and
 * nothing else on the calendar can be argued with — a holiday is a country's
 * and a world event belongs to the clock.
 */
export function EntryDetail({ entry, onClose }: { entry: CalendarEntry; onClose: () => void }) {
  const { sim, run, refresh } = useGame();
  const legend = LEGEND_BY_CATEGORY[entry.category];
  const status = statusOf(entry);
  const city = entry.locationId ? CITIES.get(entry.locationId)?.name : undefined;
  const [error, setError] = useState<string | undefined>();
  const mine = sim.timeline.get(entry.id)?.kind === PLAN_KIND && entry.status === 'pending';
  // The trip a commitment carries inside its time (a career meeting, audition or work day), said as the day's look says
  // it. From 2026-10-21 (the app's second walk): until then the meeting's notice said it was "on your calendar with two
  // hours to get there" and the entry the Calendar opened said nothing of the trip.
  const trip = sim.timeline.get(entry.id)?.travelMinutes;

  const callOff = () => {
    const result = run<PlanResult>('calendar.cancel', { entryId: entry.id });
    if (result.value?.ok) { refresh(); onClose(); return; }
    setError(result.value?.error ?? result.error ?? 'It couldn’t be taken off the calendar, so it’s still there.');
  };

  return (
    <Modal
      title={titleCaseLabel(entry.title)}
      onClose={onClose}
      footer={mine ? (
        <>
          <HowItWorks help="calendar.cancel" />
          <button className="btn btn-ghost" onClick={onClose}>Leave It</button>
          <Gated feature="calendar.cancel" className="btn" onClick={callOff}>Call It Off</Gated>
        </>
      ) : undefined}
    >
      <div className="grid grid-2" style={{ marginBottom: 'var(--s4)' }}>
        <Stat label="When" value={formatTime(entry.at, sim.homeZone)} note={formatDate(entry.at, sim.homeZone)} />
        <Stat label="Length" value={entry.durationMinutes ? formatDuration(entry.durationMinutes * MS_MINUTE) : '—'} />
        <Stat label="Kind" value={legend?.label ?? titleCaseLabel(entry.category)} note={city} />
        <Stat
          label="Status"
          value={statusWords(status)}
          tone={status === 'missed' || status === 'cancelled' ? 'negative' : status === 'completed' ? 'positive' : undefined}
        />
      </div>

      <p className="small muted">
        {entry.status === 'observance'
          ? 'An observance. It’s on the calendar so you know, and there’s nothing for you to do about it.'
          : entry.requiresPlayer
            ? `You need to be there. The clock stops when it’s time, so you can go.${trip ? ` Getting there takes ${tripWords(trip)} each way, and the trip is part of it.` : ''}`
            : 'It happens on its own when the clock reaches it.'}
        {mine && ' You put it there, so you can take it off again.'}
      </p>
      {error && <p className="small negative">{error}</p>}
    </Modal>
  );
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * A status as the screen says it, in American spelling. The save keeps the
 * status with a doubled l; the Day look already wrote Canceled while this
 * wrote the doubled spelling beside it.
 */
function statusWords(status: string): string {
  return status === 'cancelled' ? 'Canceled' : titleCaseLabel(status);
}
