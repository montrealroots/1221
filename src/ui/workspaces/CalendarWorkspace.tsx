import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { titleCaseLabel } from '@/engine/core/text';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Modal, Stat } from '@/ui/components/primitives';
import { monthGrid, entriesBetween, CALENDAR_LEGEND, LEGEND_BY_CATEGORY, type CalendarDay, type CalendarEntry } from '@/engine/world/calendar';
import { formatDate, formatDuration, formatTime, zonedParts, addDays, instantFromZoned, MS_DAY, MS_HOUR, MS_MINUTE } from '@/engine/core/time';
import { POSTPONE_DAYS, canPostpone, closingNumbers, furnishable } from '@/engine/systems/purchase';
import { formatMoney } from '@/engine/core/money';
import { CITIES } from '@/engine/content/geography';
import { activeScene, sceneDefinition } from '@/engine/systems/scenes';
import { attendable } from '@/engine/systems/plans';
import { activityOf, dateAttendable, placeOfDate } from '@/engine/systems/dating';
import { viewable } from '@/engine/systems/viewings';
import type { DateStatus } from '@/engine/domain/model';
import { placesNear } from '@/engine/systems/places';
import { holidayLabel, isHolidaysLoaded, loadCountryHolidays } from '@/engine/content/holidays';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarWorkspace() {
  const { sim, refresh } = useGame();
  const today = zonedParts(sim.now, sim.homeZone);

  // The holidays of the country you are standing in, fetched once per country.
  const countryId = CITIES.get(sim.player.currentLocationId)?.countryId;
  useEffect(() => {
    if (!countryId || isHolidaysLoaded(countryId)) return;
    let cancelled = false;
    loadCountryHolidays(countryId).then(() => { if (!cancelled) refresh(); }).catch(() => {});
    return () => { cancelled = true; };
  }, [countryId, refresh]);
  const [view, setView] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<CalendarEntry | null>(null);
  const [planning, setPlanning] = useState(false);

  const days = useWorld((s) => monthGrid(s, view.year, view.month));
  const next30 = useWorld((s) => entriesBetween(s, s.now, s.now + 30 * MS_DAY));
  const conflicts = next30.filter((e) => e.conflicted);
  const selectedDay = days.find((d) => d.key === selected);
  // How many of the player's own entries fit in a cell after the day's holiday chips.
  const roomFor = (day: CalendarDay) => 3 - (day.holidays.length > 0 ? 1 : 0);

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
                {day.holidays.length > 0 && <span className="xs dim cal-holiday-mark" title={day.holidays.map(holidayLabel).join(', ')}>✦</span>}
              </div>
              {day.holidays.slice(0, 1).map((holiday) => (
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
              {day.entries.length > roomFor(day) && (
                <span className="xs dim cal-more">+{day.entries.length - roomFor(day)} more</span>
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
              {selectedDay.date + MS_DAY > sim.now && (
                <button className="btn btn-sm btn-primary" onClick={() => setPlanning(true)}>Plan Something</button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
            </>
          )}
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
                  {statusOf(sim, entry) !== 'pending' && <span className="chip">{titleCaseLabel(statusOf(sim, entry))}</span>}
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
      {planning && selectedDay && <PlanForm day={selectedDay} onClose={() => setPlanning(false)} />}
    </>
  );
}

/** A plan's own state, where the entry is a plan; the calendar item's otherwise. */
function statusOf(sim: { universe: { plans: Record<string, { status: string }> } }, entry: CalendarEntry): string {
  if (entry.refType === 'plan' && entry.refId) {
    const plan = sim.universe.plans[entry.refId];
    if (plan) return plan.status === 'planned' ? 'pending' : plan.status;
  }
  return entry.status === 'done' ? 'completed' : entry.status;
}

function toLocalInput(instant: number, zone: string): string {
  const p = zonedParts(instant, zone);
  const two = (n: number) => String(n).padStart(2, '0');
  return `${p.year}-${two(p.month)}-${two(p.day)}T${two(p.hour)}:${two(p.minute)}`;
}

function fromLocalInput(value: string, zone: string): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return undefined;
  return instantFromZoned({ year: Number(m[1]), month: Number(m[2]), day: Number(m[3]), hour: Number(m[4]), minute: Number(m[5]) }, zone);
}

/**
 * One entry, opened. What it is, what state it is in, and the things its
 * owning system lets you do to it — a plan can be played, done, moved,
 * skipped or dropped; an appointment moved or cancelled; a bill paid; a
 * flight opened where it lives; an observance only looked at.
 */
const DATE_STATUS_WORD: Readonly<Record<DateStatus, string>> = {
  planned: 'planned', underway: 'under way', attended: 'attended', skipped: 'skipped', stood_up: 'missed, because you did not go', they_cancelled: 'called off by them', cancelled: 'cancelled',
};

function EntryDetail({ entry, onClose }: { entry: CalendarEntry; onClose: () => void }) {
  const { sim, run, navigate } = useGame();
  const scene = useWorld(activeScene);
  const [when, setWhen] = useState(() => toLocalInput(entry.at, sim.homeZone));
  const plan = useWorld((s) => (entry.refType === 'plan' && entry.refId ? s.universe.plans[entry.refId] : undefined));
  const appointment = useWorld((s) => (entry.refType === 'appointment' && entry.refId ? s.universe.appointments[entry.refId] : undefined));
  const bill = useWorld((s) => (entry.refType === 'bill' && entry.refId ? s.universe.bills[entry.refId] : undefined));
  const date = useWorld((s) => (entry.refType === 'date' && entry.refId ? s.universe.dates[entry.refId] : undefined));
  const showing = useWorld((s) => (entry.refType === 'listing' && entry.refId && s.timeline.get(entry.id)?.kind === 'prop.showing' ? s.universe.propertyListings[entry.refId] : undefined));
  const offer = useWorld((s) => (entry.refType === 'offer' && entry.refId ? s.universe.propertyOffers[entry.refId] : undefined));
  const offerKind = useWorld((s) => (entry.refType === 'offer' ? s.timeline.get(entry.id)?.kind : undefined));
  const movingHome = useWorld((s) => (entry.refType === 'property' && entry.refId && s.timeline.get(entry.id)?.kind === 'prop.moving_day' ? s.universe.properties[entry.refId] : undefined));
  const showingCan = showing ? viewable(sim, showing) : { ok: false as const, reason: undefined };
  const dateCan = date ? dateAttendable(sim, date) : { ok: false as const, reason: undefined };
  const legend = LEGEND_BY_CATEGORY[entry.category];
  const status = statusOf(sim, entry);
  const city = entry.locationId ? CITIES.get(entry.locationId)?.name : undefined;
  const after = (result: { ok: boolean }) => { if (result.ok) onClose(); };
  const moveTo = () => fromLocalInput(when, sim.homeZone);
  const busy = scene ? 'Finish or leave the scene you are in first.' : undefined;
  const can = plan ? attendable(sim, plan) : { ok: false };
  const summarisable = plan?.sceneDefinitionId ? Boolean(sceneDefinition(plan.sceneDefinitionId)?.summarise) : true;

  return (
    <Modal title={titleCaseLabel(entry.title)} onClose={onClose}>
      <div className="grid grid-2" style={{ marginBottom: 'var(--s4)' }}>
        <Stat label="When" value={formatTime(entry.at, sim.homeZone)} note={formatDate(entry.at, sim.homeZone)} />
        <Stat label="Length" value={entry.durationMinutes ? formatDuration(entry.durationMinutes * MS_MINUTE) : '—'} />
        <Stat label="Kind" value={legend?.label ?? titleCaseLabel(entry.category)} note={city} />
        <Stat label="Status" value={titleCaseLabel(status)} tone={status === 'missed' || status === 'cancelled' ? 'negative' : status === 'attended' || status === 'completed' ? 'positive' : undefined} />
      </div>

      {plan && (
        <>
          <p className="small muted">
            {plan.status === 'planned'
              ? 'Yours to play, get done, move, skip or drop.'
              : `This plan was ${plan.status}${plan.resolvedAt ? ` on ${formatDate(plan.resolvedAt, sim.homeZone)}` : ''}.`}
            {plan.status === 'planned' && !can.ok && can.reason ? ` ${can.reason}` : ''}
          </p>
          {plan.status === 'planned' && (
            <>
              <div className="row wrap gap-2" style={{ marginBottom: 'var(--s3)' }}>
                {plan.sceneDefinitionId && (
                  <button className="btn btn-sm btn-primary" disabled={!can.ok || Boolean(busy)} title={busy ?? can.reason}
                    onClick={() => after(run('plan.attend', { planId: plan.id, mode: 'play' }, { idempotencyKey: `plan:${plan.id}:play` }))}>
                    Play It Out
                  </button>
                )}
                {summarisable && (
                  <button className="btn btn-sm" disabled={!can.ok || Boolean(busy)} title={busy ?? can.reason}
                    onClick={() => after(run('plan.attend', { planId: plan.id, mode: 'summary' }, { idempotencyKey: `plan:${plan.id}:summary` }))}>
                    {plan.sceneDefinitionId ? 'Just Do It' : 'Done'}
                  </button>
                )}
                <button className="btn btn-sm" onClick={() => after(run('plan.skip', { planId: plan.id }))}>Skip It</button>
                <button className="btn btn-ghost btn-sm" onClick={() => after(run('plan.cancel', { planId: plan.id }))}>Cancel It</button>
              </div>
              <div className="row wrap gap-2" style={{ alignItems: 'end' }}>
                <div className="col gap-1">
                  <label htmlFor="plan-when" className="xs dim">Move It To</label>
                  <input id="plan-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
                </div>
                <button className="btn btn-sm" onClick={() => { const at = moveTo(); if (at) after(run('plan.reschedule', { planId: plan.id, at })); }}>
                  Move
                </button>
              </div>
            </>
          )}
        </>
      )}

      {appointment && (
        <>
          <p className="small muted">
            {sim.universe.healthProviders[appointment.providerId]?.name ?? 'Your provider'}. {formatMoney(appointment.outOfPocket)} out of pocket.
            {appointment.status === 'scheduled' ? ' Cancelling inside a day of it costs a fee.' : ` This appointment was ${appointment.status}.`}
          </p>
          {appointment.status === 'scheduled' && (
            <div className="row wrap gap-2" style={{ alignItems: 'end' }}>
              <div className="col gap-1">
                <label htmlFor="appt-when" className="xs dim">Move It To</label>
                <input id="appt-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
              </div>
              <button className="btn btn-sm" onClick={() => { const at = moveTo(); if (at) after(run('health.reschedule', { appointmentId: appointment.id, at })); }}>Move</button>
              <button className="btn btn-ghost btn-sm" onClick={() => after(run('health.cancel', { appointmentId: appointment.id }))}>Cancel It</button>
              <button className="btn btn-sm" onClick={() => navigate('/workspace/health', 'Health')}>Open Health</button>
            </div>
          )}
        </>
      )}

      {date && (
        <>
          <p className="small muted">
            {activityOf(date).label} with {sim.universe.people[date.personId]?.displayName ?? 'somebody'}{placeOfDate(date) ? ` at ${placeOfDate(date)!.name}` : ''}.
            {date.status === 'planned' ? (dateCan.ok ? ' It is time.' : dateCan.reason ? ` ${dateCan.reason}` : '') : date.status === 'underway' ? ' Under way.' : ` This date was ${DATE_STATUS_WORD[date.status]}.`}
          </p>
          {(date.status === 'planned' || date.status === 'underway') && (
            <>
              <div className="row wrap gap-2">
                <button className="btn btn-sm btn-primary" disabled={!dateCan.ok || Boolean(busy)} title={busy ?? (dateCan.ok ? undefined : dateCan.reason)} onClick={() => after(run('date.attend', { dateId: date.id, mode: 'play' }, { idempotencyKey: `date:${date.id}:play` }))}>Play It Out</button>
                <button className="btn btn-sm" disabled={!dateCan.ok || Boolean(busy)} onClick={() => after(run('date.attend', { dateId: date.id, mode: 'summary' }, { idempotencyKey: `date:${date.id}:summary` }))}>Just Do It</button>
                {date.status === 'planned' && <button className="btn btn-sm" onClick={() => after(run('date.skip', { dateId: date.id }))}>Skip It</button>}
                {date.status === 'planned' && <button className="btn btn-ghost btn-sm" onClick={() => after(run('date.cancel', { dateId: date.id }))}>Cancel It</button>}
                <button className="btn btn-sm" onClick={() => navigate('/workspace/relationships', 'Relationships')}>Open Relationships</button>
              </div>
              {date.status === 'planned' && (
                <div className="row wrap gap-2" style={{ alignItems: 'end', marginTop: 'var(--s3)' }}>
                  <div className="col gap-1">
                    <label htmlFor="date-when" className="xs dim">Move It To</label>
                    <input id="date-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
                  </div>
                  <button className="btn btn-sm" onClick={() => { const at = moveTo(); if (at) after(run('date.reschedule', { dateId: date.id, at })); }}>Move</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {showing && (
        <>
          <p className="small muted">
            A showing at {sim.universe.properties[showing.propertyId]?.addressLine ?? 'the house'}, {formatMoney(showing.askingPrice)} asking.
            {showing.viewedByPlayer ? ' You have seen it.' : showingCan.ok ? ' Go over any time you are in the city; when it comes round it will ask.' : showingCan.reason ? ` ${showingCan.reason}` : ''}
          </p>
          <div className="row wrap gap-2">
            <button className="btn btn-sm btn-primary" disabled={!showingCan.ok || Boolean(busy)} title={busy} onClick={() => after(run('scene.start', { definitionId: 'property.viewing', input: { listingId: showing.id }, refType: 'listing', refId: showing.id }))}>Play It Out</button>
            <button className="btn btn-sm" disabled={!showingCan.ok || Boolean(busy)} onClick={() => after(run('viewing.summary', { listingId: showing.id }, { idempotencyKey: `showing:${showing.id}:${entry.at}` }))}>Just Look Around</button>
            <button className="btn btn-sm" onClick={() => after(run('viewing.skip', { listingId: showing.id }))}>Skip It</button>
            <button className="btn btn-sm" onClick={() => navigate('/workspace/property', 'Property')}>Open Property</button>
          </div>
        </>
      )}

      {offer && (
        <>
          <p className="small muted">
            {offerKind === 'prop.inspection' && `The inspector goes through ${sim.universe.properties[offer.propertyId]?.addressLine ?? 'the house'} on the day. The report comes to you afterwards and asks: walk it with them, read it, decide.`}
            {offerKind === 'prop.appraisal' && `The lender's appraiser values ${sim.universe.properties[offer.propertyId]?.addressLine ?? 'the house'}. A short appraisal means more cash at the table, or the end of the purchase if you cannot carry it.`}
            {offerKind === 'prop.closing' && `Closing on ${sim.universe.properties[offer.propertyId]?.addressLine ?? 'the house'}: ${formatMoney(closingNumbers(sim, offer).cashToClose)} to close. ${sim.now >= (offer.closingAt ?? 0) - 12 * MS_HOUR ? 'The table is set.' : 'When it comes round it will ask.'}`}
            {!['prop.inspection', 'prop.appraisal', 'prop.closing'].includes(offerKind ?? '') && 'Part of a purchase in progress.'}
          </p>
          <div className="row wrap gap-2">
            {offerKind === 'prop.closing' && sim.now >= (offer.closingAt ?? 0) - 12 * MS_HOUR && offer.status === 'accepted' && (
              <>
                <button className="btn btn-sm btn-primary" disabled={Boolean(busy)} title={busy} onClick={() => after(run('scene.start', { definitionId: 'property.closing', input: { offerId: offer.id }, refType: 'offer', refId: offer.id }))}>Sit At The Table</button>
                <button className="btn btn-sm" onClick={() => after(run('prop.close', { offerId: offer.id }, { idempotencyKey: `close:${offer.id}` }))}>Sign Remotely</button>
                {canPostpone(offer) && <button className="btn btn-sm" onClick={() => after(run('prop.postpone_closing', { offerId: offer.id }))}>Ask For {POSTPONE_DAYS} More Days</button>}
              </>
            )}
            <button className="btn btn-sm" onClick={() => navigate('/workspace/property', 'Property')}>Open Property</button>
          </div>
        </>
      )}

      {movingHome && (
        <>
          <p className="small muted">Moving day at {movingHome.addressLine}. {sim.player.residenceId === movingHome.id ? 'You already live there.' : 'The keys are yours; the rooms are empty.'}</p>
          <div className="row wrap gap-2">
            {sim.player.residenceId !== movingHome.id && (
              <>
                <button className="btn btn-sm btn-primary" disabled={Boolean(busy) || !furnishable(sim, movingHome.id).ok} title={busy ?? furnishable(sim, movingHome.id).reason} onClick={() => after(run('scene.start', { definitionId: 'property.movein', input: { propertyId: movingHome.id }, refType: 'property', refId: movingHome.id }))}>Play It Out</button>
                <button className="btn btn-sm" onClick={() => after(run('prop.move_in', { propertyId: movingHome.id }, { idempotencyKey: `movein:${movingHome.id}` }))}>Just Move In</button>
              </>
            )}
            <button className="btn btn-sm" onClick={() => navigate('/workspace/property', 'Property')}>Open Property</button>
          </div>
        </>
      )}

      {bill && (
        <div className="row wrap gap-2">
          <span className="small muted grow">{formatMoney(bill.amount)} {bill.frequency}. {bill.active ? 'Paid automatically when it is due, if the money is there.' : 'No longer active.'}</span>
          {bill.active && <button className="btn btn-sm btn-primary" onClick={() => after(run('finance.pay_bill', { billId: bill.id }, { idempotencyKey: `pay:${bill.id}:${bill.nextDueAt}` }))}>Pay Now</button>}
          <button className="btn btn-sm" onClick={() => navigate('/workspace/bank', 'Bank')}>Open Bank</button>
        </div>
      )}

      {!plan && !appointment && !bill && !date && !showing && !offer && !movingHome && (
        <div className="row wrap gap-2">
          <span className="small muted grow">
            {entry.status === 'observance'
              ? 'An observance. It is on the calendar so you know; nothing about it is yours to change.'
              : 'This belongs to the system that made it. Open it there to change anything.'}
          </span>
          {entry.status !== 'observance' && (
            <button className="btn btn-sm" onClick={() => { navigate(routeForCategory(entry.category)); onClose(); }}>Open</button>
          )}
        </div>
      )}
    </Modal>
  );
}

const PLAN_KINDS: readonly { id: string; label: string; scene?: string; input?: Record<string, string | number>; minutes: number; place?: 'gym' }[] = [
  { id: 'gym', label: 'Train At A Gym', scene: 'fitness.gym', minutes: 90, place: 'gym' },
  { id: 'run', label: 'Go For A Run', scene: 'life.run', minutes: 45 },
  { id: 'meal', label: 'Eat Out', scene: 'life.meal', minutes: 75 },
  { id: 'rest', label: 'Rest', scene: 'wellbeing.activity', input: { activityId: 'rest' }, minutes: 60 },
  { id: 'read', label: 'Read', scene: 'wellbeing.activity', input: { activityId: 'read' }, minutes: 60 },
  { id: 'rehearse', label: 'Rehearse', scene: 'wellbeing.activity', input: { activityId: 'rehearse' }, minutes: 90 },
  { id: 'write', label: 'Write', scene: 'wellbeing.activity', input: { activityId: 'write' }, minutes: 120 },
  { id: 'other', label: 'Something Else', minutes: 60 },
];

/** Something to do on a chosen day: what, where, when, how long, and whether to be reminded. */
function PlanForm({ day, onClose }: { day: CalendarDay; onClose: () => void }) {
  const { sim, run, toast } = useGame();
  const [kindId, setKindId] = useState('gym');
  const [placeId, setPlaceId] = useState('');
  const [title, setTitle] = useState('');
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [minutes, setMinutes] = useState(90);
  const [reminder, setReminder] = useState(30);
  const gyms = useWorld((s) => placesNear(s, { kind: 'gym', mode: 'walk', limit: 12 }));
  const kind = PLAN_KINDS.find((k) => k.id === kindId) ?? PLAN_KINDS[0]!;
  const gymId = placeId || gyms[0]?.place.id || '';
  const parts = zonedParts(day.date, sim.homeZone);

  const choose = (id: string) => {
    const next = PLAN_KINDS.find((k) => k.id === id) ?? PLAN_KINDS[0]!;
    setKindId(next.id);
    setMinutes(next.minutes);
  };

  const submit = () => {
    const at = instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour, minute }, sim.homeZone);
    const result = run('plan.create', {
      title: title.trim() || kind.label,
      at, durationMinutes: minutes,
      placeId: kind.place ? gymId : undefined,
      sceneDefinitionId: kind.scene,
      sceneInput: kind.input ? { ...kind.input } : kind.place ? { placeId: gymId } : undefined,
      reminderMinutes: reminder || undefined,
    });
    if (result.ok) { toast(`Planned for ${formatDate(at, sim.homeZone)} at ${formatTime(at, sim.homeZone)}.`, 'positive'); onClose(); }
  };

  return (
    <Modal title="Plan Something" onClose={onClose}
      footer={(
        <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Never Mind</button>
          <button className="btn btn-sm btn-primary" onClick={submit} disabled={kind.place === 'gym' && !gymId}>Put It On The Calendar</button>
        </div>
      )}
    >
      <p className="small muted" style={{ marginTop: 0 }}>{formatDate(day.date, sim.homeZone)}. When the time comes it asks whether to play it out or just get it done.</p>
      <div className="col gap-3">
        <div className="col gap-1">
          <label htmlFor="plan-kind" className="xs dim">What</label>
          <select id="plan-kind" value={kindId} onChange={(e) => choose(e.target.value)}>
            {PLAN_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </div>
        {kind.place === 'gym' && (
          <div className="col gap-1">
            <label htmlFor="plan-gym" className="xs dim">Where</label>
            <select id="plan-gym" value={gymId} onChange={(e) => setPlaceId(e.target.value)}>
              {gyms.map(({ place, journey }) => (
                <option key={place.id} value={place.id}>{place.name}{place.real ? ' (Real)' : ''} · {formatDuration(journey.minutes * MS_MINUTE)} Away</option>
              ))}
            </select>
            {gyms.length === 0 && <span className="xs dim">No gym in this city that SLATE knows about.</span>}
          </div>
        )}
        <div className="col gap-1">
          <label htmlFor="plan-title" className="xs dim">Call It</label>
          <input id="plan-title" value={title} placeholder={kind.label} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="row wrap gap-3">
          <div className="col gap-1">
            <label htmlFor="plan-hour" className="xs dim">Time</label>
            <div className="row gap-1">
              <select id="plan-hour" value={hour} onChange={(e) => setHour(Number(e.target.value))}>
                {Array.from({ length: 18 }, (_, i) => i + 5).map((h) => (
                  <option key={h} value={h}>{h % 12 === 0 ? 12 : h % 12} {h < 12 ? 'AM' : 'PM'}</option>
                ))}
              </select>
              <select aria-label="Minutes Past The Hour" value={minute} onChange={(e) => setMinute(Number(e.target.value))}>
                {[0, 15, 30, 45].map((m) => <option key={m} value={m}>:{String(m).padStart(2, '0')}</option>)}
              </select>
            </div>
          </div>
          <div className="col gap-1">
            <label htmlFor="plan-minutes" className="xs dim">How Long</label>
            <input id="plan-minutes" type="number" min={5} max={720} step={5} value={minutes} style={{ width: 96 }} onChange={(e) => setMinutes(Number(e.target.value))} />
          </div>
          <div className="col gap-1">
            <label htmlFor="plan-reminder" className="xs dim">Remind Me</label>
            <select id="plan-reminder" value={reminder} onChange={(e) => setReminder(Number(e.target.value))}>
              <option value={0}>Not At All</option>
              <option value={15}>15 Minutes Before</option>
              <option value={30}>30 Minutes Before</option>
              <option value={60}>An Hour Before</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function routeForCategory(category: string): string {
  const map: Record<string, string> = {
    finance: '/workspace/bank', health: '/workspace/health',
    personal: '/workspace/relationships', family: '/workspace/relationships',
    education: '/workspace/education', property: '/workspace/property',
    vehicles: '/workspace/vehicles', travel: '/workspace/travel', social: '/workspace/social',
  };
  return map[category] ?? '/workspace/calendar';
}

void addDays;
