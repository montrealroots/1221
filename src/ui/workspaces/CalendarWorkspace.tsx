import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { titleCaseLabel } from '@/engine/core/text';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Modal, Stat } from '@/ui/components/primitives';
import { monthGrid, entriesBetween, keptCalendars, CALENDAR_LEGEND, LEGEND_BY_CATEGORY, type CalendarDay, type CalendarEntry } from '@/engine/world/calendar';
import { formatDate, formatDuration, formatTime, startOfDay, zonedParts, MS_DAY, MS_MINUTE } from '@/engine/core/time';
import {
  LONGEST_TITLE, MOST_PEOPLE_ON_A_PLAN, PLANNABLE, PLAN_KIND, PLAN_LENGTHS,
  couldPlanWith, namesOn, saidAsList, type PlanResult, type PlannableCategory,
} from '@/engine/world/plans';
import { MISSED_COOLS, TOGETHER_WARMS, standingWord } from '@/engine/world/standing';
import { CITIES } from '@/engine/content/geography';
import { holidayLabel, isHolidaysLoaded, loadCountryHolidays } from '@/engine/content/holidays';
import { dayLabel, hiddenIn, holidayChips, roomFor, standingIn, stillStands } from './cell';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarWorkspace() {
  const { sim, refresh } = useGame();
  const today = zonedParts(sim.now, sim.homeZone);

  // Every calendar this life keeps — where you are standing, and the
  // industry's — fetched once per country. Both, because the year a person
  // lives in is not always one country's.
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
  const selectedDay = days.find((d) => d.key === selected);
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
      <div className="page-head">
        <div className="eyebrow">Calendar</div>
        <h1>Every commitment you have.</h1>
        <p className="muted">
          Everything the world has put on your calendar, and the days both your
          calendars keep — the country you’re standing in, and the one the
          business runs on. If two things want you at once, they’re flagged
          here first.
        </p>
      </div>

      {conflicts.length > 0 && (
        <div className="callout callout-negative" style={{ marginBottom: 'var(--s5)' }}>
          <strong>{conflicts.length / 2 >= 1 ? `${Math.ceil(conflicts.length / 2)} collision${Math.ceil(conflicts.length / 2) === 1 ? '' : 's'}` : 'A collision'} in the next month.</strong>
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
        <Panel
          title={formatDate(selectedDay.date, sim.homeZone)}
          subtitle={selectedDay.holidays.length > 0 ? selectedDay.holidays.map(holidayLabel).join(' · ') : `${selectedDay.season}`}
          flush
          actions={(
            <>
              {canPlan(selectedDay, sim.now) && (
                <button className="btn btn-sm btn-primary" onClick={() => setPlanning(selectedDay.key)}>
                  Put Something On It
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
            </>
          )}
        >
          {selectedDay.entries.length === 0 ? (
            <Empty
              title="Nothing Scheduled"
              body={canPlan(selectedDay, sim.now)
                ? 'That day is entirely yours. Put something on it if you want it spoken for.'
                : 'That day was entirely yours.'}
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
                      {entry.durationMinutes ? ` · ${entry.durationMinutes} min` : ''}
                      {entry.locationId ? ` · ${CITIES.get(entry.locationId)?.name ?? ''}` : ''}
                    </div>
                  </div>
                  {entry.conflicted && <span className="chip chip-negative">Clash</span>}
                  {statusOf(entry) !== 'pending' && <span className="chip">{titleCaseLabel(statusOf(entry))}</span>}
                </button>
              ))}
            </div>
          )}
        </Panel>
      )}


      <Panel title="Next Thirty Days" flush>
        {next30.length === 0 ? (
          <Empty title="Clear Ahead" body="Nothing is on the calendar for the next month." />
        ) : (
          <div className="list">
            {next30.slice(0, 20).map((entry) => (
              <button key={entry.id} className="list-item" onClick={() => setDetail(entry)}>
                <span
                  className="cal-swatch"
                  style={{ background: LEGEND_BY_CATEGORY[entry.category]?.colour }}
                  aria-hidden="true"
                />
                <div className="grow">
                  <div className="small">{titleCaseLabel(entry.title)}</div>
                  <div className="xs dim">
                    {formatDate(entry.at, sim.homeZone)} · {formatTime(entry.at, sim.homeZone)}
                  </div>
                </div>
                {entry.requiresPlayer && <span className="chip">You</span>}
                {entry.conflicted && <span className="chip chip-negative">Clash</span>}
              </button>
            ))}
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

/** Whether a day is still ahead enough to put something on. */
function canPlan(day: CalendarDay, now: number): boolean {
  return day.date + MS_DAY > now;
}

/**
 * Putting something on a day.
 *
 * A modal, because it asks a question and changes the world — which is the
 * one thing a look never does. Five questions and no more: what it is, when
 * it starts, how long it takes, which kind of day it is, and who it is with.
 *
 * The last of those is the only one that reaches anything outside the
 * calendar. A plan with somebody on it is the one thing in the game that
 * moves where you stand with them, and until this field existed the engine
 * took `withIds`, the standing model read it, five floors of drill-down
 * described what it did — and no screen could send one. Every bond in every
 * save drifted to its resting level and stayed there for good.
 *
 * No "where" yet. Every plan is where you are standing, because nothing in
 * the game moves you anywhere else, and offering a city you cannot get to
 * would be offering a commitment you are guaranteed to miss.
 */
function PlanForm({ day, onClose, onDone }: { day: CalendarDay; onClose: () => void; onDone: () => void }) {
  const { sim, run } = useGame();
  const zone = sim.homeZone;
  const [title, setTitle] = useState('');
  const [minute, setMinute] = useState(() => firstFreeSlot(day, sim.now, zone));
  const [minutes, setMinutes] = useState(60);
  const [category, setCategory] = useState<PlannableCategory>('personal');
  const [withIds, setWithIds] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();

  const at = startOfDay(day.date, zone) + minute * MS_MINUTE;
  const slots = openSlots(day, sim.now, zone);
  const people = useWorld((s) => couldPlanWith(s));
  const full = withIds.length >= MOST_PEOPLE_ON_A_PLAN;

  const toggle = (id: string) => {
    setError(undefined);
    setWithIds((chosen) => (chosen.includes(id)
      ? chosen.filter((one) => one !== id)
      : chosen.length >= MOST_PEOPLE_ON_A_PLAN ? chosen : [...chosen, id]));
  };

  const put = () => {
    // The command succeeds even when the calendar declines the plan: a
    // refusal is an answer, not a failure, and it belongs beside the field
    // rather than in a toast that slides away while you are still reading it.
    const result = run<PlanResult>('calendar.schedule', {
      title, at, durationMinutes: minutes, category, withIds,
    });
    if (result.value?.ok) { onDone(); return; }
    setError(result.value?.error ?? result.error ?? 'The calendar wouldn’t take it.');
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
          placeholder="Something you’d recognize on the day"
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
      <div className="field">
        <label id="plan-kind-label">What Kind Of Day It Is</label>
        <div className="row gap-2" role="group" aria-labelledby="plan-kind-label">
          {PLANNABLE.map((option) => (
            <button
              key={option}
              type="button"
              className="trait grow"
              aria-pressed={category === option}
              onClick={() => setCategory(option)}
            >
              <div className="trait-name">{LEGEND_BY_CATEGORY[option]?.label ?? titleCaseLabel(option)}</div>
              <div className="xs muted">{LEGEND_BY_CATEGORY[option]?.description}</div>
            </button>
          ))}
        </div>
      </div>
      {people.length > 0 && (
        <div className="field">
          <label id="plan-with-label">Who It’s With (Optional)</label>
          <div className="trait-grid" role="group" aria-labelledby="plan-with-label">
            {people.map(({ person, relation, closeness }) => {
              const on = withIds.includes(person.id);
              return (
                <button
                  key={person.id}
                  type="button"
                  className="trait"
                  aria-pressed={on}
                  disabled={!on && full}
                  onClick={() => toggle(person.id)}
                >
                  <div className="trait-name">{person.displayName || person.firstName}</div>
                  <div className="trait-desc">
                    {relation ? `Your ${relation.toLowerCase()} · ` : ''}
                    {standingWord(Math.round(closeness))}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="xs dim" style={{ marginTop: 'var(--s2)', marginBottom: 0 }}>
            {withIds.length === 0
              ? 'Leave it empty and it’s an hour of your own. Put somebody on it and turning up is worth '
                + `${TOGETHER_WARMS} points of where you stand with them — and not turning up costs ${MISSED_COOLS}.`
              : `Turning up is worth ${TOGETHER_WARMS} points of where you stand with `
                + `${withIds.length === 1 ? 'them' : 'each of them'}. Not turning up costs ${MISSED_COOLS}.`}
            {full && ' That’s as many as one plan holds.'}
          </p>
        </div>
      )}
      <p className="xs dim" style={{ margin: 0 }}>
        It will want you in {CITIES.get(sim.player.currentLocationId)?.name ?? 'where you are'}, and the clock
        stops when it comes round. Two things at once are allowed — the calendar flags them rather than
        refusing.
      </p>
      {error && <p className="small negative" style={{ marginTop: 'var(--s3)' }}>{error}</p>}
    </Modal>
  );
}

/** Every half hour of a day that has not already gone by. */
function openSlots(day: CalendarDay, now: number, zone: string): number[] {
  const midnight = startOfDay(day.date, zone);
  const out: number[] = [];
  for (let minute = 0; minute < 24 * 60; minute += 30) {
    if (midnight + minute * MS_MINUTE >= now) out.push(minute);
  }
  return out;
}

/** Where the picker opens: the next half hour still ahead, or nine in the morning. */
function firstFreeSlot(day: CalendarDay, now: number, zone: string): number {
  const slots = openSlots(day, now, zone);
  const nine = slots.find((m) => m >= 9 * 60);
  return nine ?? slots[0] ?? 0;
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
function EntryDetail({ entry, onClose }: { entry: CalendarEntry; onClose: () => void }) {
  const { sim, run, refresh } = useGame();
  const legend = LEGEND_BY_CATEGORY[entry.category];
  const status = statusOf(entry);
  const city = entry.locationId ? CITIES.get(entry.locationId)?.name : undefined;
  const [error, setError] = useState<string | undefined>();
  const mine = sim.timeline.get(entry.id)?.kind === PLAN_KIND && entry.status === 'pending';
  const item = sim.timeline.get(entry.id);
  const names = item ? namesOn(sim, item) : [];
  const them = names.length === 1 ? 'them' : 'each of them';

  const callOff = () => {
    const result = run<PlanResult>('calendar.cancel', { entryId: entry.id });
    if (result.value?.ok) { refresh(); onClose(); return; }
    setError(result.value?.error ?? result.error ?? 'It wouldn’t come off the calendar.');
  };

  return (
    <Modal
      title={titleCaseLabel(entry.title)}
      onClose={onClose}
      footer={mine ? (
        <>
          <button className="btn btn-ghost" onClick={onClose}>Leave It</button>
          <button className="btn" onClick={callOff}>Call It Off</button>
        </>
      ) : undefined}
    >
      <div className="grid grid-2" style={{ marginBottom: 'var(--s4)' }}>
        <Stat label="When" value={formatTime(entry.at, sim.homeZone)} note={formatDate(entry.at, sim.homeZone)} />
        <Stat label="Length" value={entry.durationMinutes ? formatDuration(entry.durationMinutes * MS_MINUTE) : '—'} />
        <Stat label="Kind" value={legend?.label ?? titleCaseLabel(entry.category)} note={city} />
        <Stat
          label="Status"
          value={titleCaseLabel(status)}
          tone={status === 'missed' || status === 'cancelled' ? 'negative' : status === 'completed' ? 'positive' : undefined}
        />
      </div>

      <p className="small muted">
        {entry.status === 'observance'
          ? 'An observance. It’s on the calendar so you know; nothing about it is yours to change.'
          : entry.requiresPlayer
            ? 'This one wants you there. Move the clock to it and it happens.'
            : 'The world handles this one on its own when the clock reaches it.'}
        {mine && ' You put it there, so you can take it off again.'}
      </p>
      {/*
        Who it is with. The same fact the entry look prints, said here too,
        because this modal is what a person actually taps when they want to
        know about a plan they made — and a plan that forgets who it was with
        is a picker that writes to nowhere.
      */}
      {names.length > 0 && (
        <p className="small">
          {`It’s with ${saidAsList(names)}. `}
          {status === 'missed'
            ? `Being somewhere else cost you ${MISSED_COOLS} points of where you stand with ${them}.`
            : status === 'cancelled'
              ? 'You called it off, which costs nothing but doesn’t earn anything either.'
              : entry.status === 'pending'
                ? `Turning up is worth ${TOGETHER_WARMS} points of where you stand with ${them}, `
                  + `and not turning up costs ${MISSED_COOLS}.`
                : `You were there. That was worth ${TOGETHER_WARMS} points of where you stand with ${them}.`}
        </p>
      )}
      {error && <p className="small negative">{error}</p>}
    </Modal>
  );
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
