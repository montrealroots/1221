import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { titleCaseLabel } from '@/engine/core/text';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Modal, Stat } from '@/ui/components/primitives';
import { monthGrid, entriesBetween, keptCalendars, CALENDAR_LEGEND, LEGEND_BY_CATEGORY, type CalendarEntry } from '@/engine/world/calendar';
import { formatDate, formatDuration, formatTime, zonedParts, MS_DAY, MS_MINUTE } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { holidayLabel, isHolidaysLoaded, loadCountryHolidays } from '@/engine/content/holidays';
import { dayLabel, hiddenIn, holidayChips, roomFor } from './cell';

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

  const days = useWorld((s) => monthGrid(s, view.year, view.month), [view.year, view.month]);
  const next30 = useWorld((s) => entriesBetween(s, s.now, s.now + 30 * MS_DAY));
  const conflicts = next30.filter((e) => e.conflicted);
  const selectedDay = days.find((d) => d.key === selected);

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
              {day.entries.slice(0, roomFor(day)).map((entry) => (
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
          actions={<button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>}
        >
          {selectedDay.entries.length === 0 ? (
            <Empty title="Nothing Scheduled" body="That day is entirely yours." />
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
    </>
  );
}

/** An entry's own state, in the word the screen shows. */
function statusOf(entry: CalendarEntry): string {
  return entry.status === 'done' ? 'completed' : entry.status;
}

/**
 * One entry, opened. What it is, when it is, how long it runs and what state
 * it is in. Nothing here is yours to change: every entry on this calendar now
 * belongs to the clock rather than to a system you can argue with.
 */
function EntryDetail({ entry, onClose }: { entry: CalendarEntry; onClose: () => void }) {
  const { sim } = useGame();
  const legend = LEGEND_BY_CATEGORY[entry.category];
  const status = statusOf(entry);
  const city = entry.locationId ? CITIES.get(entry.locationId)?.name : undefined;

  return (
    <Modal title={titleCaseLabel(entry.title)} onClose={onClose}>
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
      </p>
    </Modal>
  );
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
