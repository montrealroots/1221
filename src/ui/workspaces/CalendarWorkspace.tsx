import { useState } from 'react';
import { titleCaseLabel } from '@/engine/core/text';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty } from '@/ui/components/primitives';
import { monthGrid, entriesBetween, CALENDAR_LEGEND, LEGEND_BY_CATEGORY } from '@/engine/world/calendar';
import { formatDate, formatTime, zonedParts, addDays, MS_DAY } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarWorkspace() {
  const { sim, navigate } = useGame();
  const today = zonedParts(sim.now, sim.homeZone);
  const [view, setView] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState<string | null>(null);

  const days = useWorld((s) => monthGrid(s, view.year, view.month));
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
          Work, auditions, shoot days, appointments, flights, bills, classes and birthdays.
          If two things want you at once, they are flagged here first.
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
              aria-label={`${formatDate(day.date, sim.homeZone)}, ${day.entries.length} entries`}
              style={{ textAlign: 'left', border: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }}
            >
              <div className="row-between">
                <span className="cal-daynum">{day.dayOfMonth}</span>
                {day.holidays.length > 0 && <span className="xs dim" title={day.holidays.join(', ')}>✦</span>}
              </div>
              {day.entries.slice(0, 3).map((entry) => (
                <span
                  key={entry.id}
                  className="cal-event"
                  data-conflict={entry.conflicted}
                  style={{ borderLeftColor: LEGEND_BY_CATEGORY[entry.category]?.colour }}
                  title={titleCaseLabel(entry.title)}
                >
                  {titleCaseLabel(entry.title)}
                </span>
              ))}
              {day.entries.length > 3 && (
                <span className="xs dim">+{day.entries.length - 3} more</span>
              )}
            </button>
          ))}
        </div>

        <hr className="divider" />
        <div className="cal-legend">
          {CALENDAR_LEGEND.filter((e) => e.category !== 'system').map((entry) => (
            <span key={entry.category} className="cal-legend-item" title={entry.description}>
              <span className="cal-swatch" style={{ background: entry.colour }} />
              {entry.label}
            </span>
          ))}
        </div>
      </Panel>

      {selectedDay && (
        <Panel
          title={formatDate(selectedDay.date, sim.homeZone)}
          subtitle={selectedDay.holidays.length > 0 ? selectedDay.holidays.join(' · ') : `${selectedDay.season}`}
          flush
          actions={<button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>}
        >
          {selectedDay.entries.length === 0 ? (
            <Empty title="Nothing Scheduled" body="That day is entirely yours." />
          ) : (
            <div className="list">
              {selectedDay.entries.map((entry) => (
                <button key={entry.id} className="list-item" onClick={() => navigate(routeForCategory(entry.category))}>
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
                  {entry.status !== 'pending' && <span className="chip">{entry.status}</span>}
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
              <div key={entry.id} className="list-item list-static">
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
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function routeForCategory(category: string): string {
  const map: Record<string, string> = {
    work: '/workspace/jobs', career: '/workspace/casting', production: '/workspace/projects',
    release: '/workspace/projects', marketing: '/workspace/projects', awards: '/workspace/awards',
    finance: '/workspace/bank', business: '/workspace/company', health: '/workspace/health',
    personal: '/workspace/relationships', family: '/workspace/relationships',
    education: '/workspace/education', property: '/workspace/property',
    vehicles: '/workspace/vehicles', travel: '/workspace/travel', social: '/workspace/social',
  };
  return map[category] ?? '/workspace/calendar';
}

void addDays;
