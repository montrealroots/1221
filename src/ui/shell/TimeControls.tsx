/**
 * SLATE — time controls.
 *
 * Sleep and Skip to Event both go through the one advancement path, so the
 * world processes everything that comes due either way.
 */

import { titleCaseLabel } from '@/engine/core/text';
import { useEffect, useRef, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Modal } from '@/ui/components/primitives';
import { suggestedSleep, hoursUntilNextCommitment } from '@/engine/systems/life';
import { missedBy, skipTargets } from '@/engine/world/calendar';
import type { CalendarEntry } from '@/engine/world/calendar';
import {
  addDays, formatDate, formatDateTime, formatDuration, formatTime, instantFromZoned, zonedParts, MS_HOUR,
  type Instant,
} from '@/engine/core/time';
import { PLAN_KIND, namesOn, saidAsList } from '@/engine/world/plans';
import { MISSED_COOLS, TOGETHER_WARMS } from '@/engine/world/standing';
import type { ScheduledItem } from '@/engine/core/scheduler';

export function TimeControls() {
  const { sim, advanceTo, run, refresh, toast, standingAt, clearStandingAt } = useGame();
  const [sleepOpen, setSleepOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ at: Instant; label: string; missed: CalendarEntry[] } | null>(null);
  const speed = sim.universe.preferences.timeSpeed;

  /**
   * Moving the clock, and standing still when something wants you.
   *
   * Every way of moving the clock stops at anything that needs the player
   * rather than running it over, and the halt is held by the provider because
   * the live tick can be halted too. That halt is the whole decision: you are
   * at the thing, and you either go — which spends the hours it takes — or you
   * do not, and they find out you were not there.
   */
  const due = standingAt;

  const setSpeed = (next: typeof speed) => {
    sim.universe.preferences.timeSpeed = next;
    refresh();
  };

  return (
    <>
      <div className="row gap-1" role="group" aria-label="Time Controls">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setSpeed(speed === 'paused' ? 'live' : 'paused')}
          aria-pressed={speed === 'paused'}
          title={speed === 'paused' ? 'Resume Time' : 'Pause Time'}
        >
          {speed === 'paused' ? 'Play' : 'Pause'}
        </button>
        <button className="btn btn-sm" onClick={() => setSleepOpen(true)}>Sleep</button>
        <AdvanceMenu
          onAdvance={(at, label) => {
            const missed = missedBy(sim, at);
            if (missed.length > 0) setConfirm({ at, label, missed });
            else advanceTo(at);
          }}
          onChooseEvent={() => setSkipOpen(true)}
        />
      </div>

      {due && (
        <DueNow
          item={due.item}
          wanted={due.wanted}
          onGo={() => { clearStandingAt(); advanceTo(due.wanted); }}
          onStay={() => {
            // Not silent: if the world refuses to let you walk away from
            // something, the reason is the answer and it belongs on screen.
            const answer = run<{ ok: boolean; error?: string }>('calendar.skip', { entryId: due.item.id });
            clearStandingAt();
            if (!answer.value?.ok) {
              if (answer.value?.error) toast(answer.value.error, 'negative');
              refresh();
              return;
            }
            advanceTo(due.wanted);
          }}
          onClose={clearStandingAt}
        />
      )}

      {sleepOpen && <SleepDialog onClose={() => setSleepOpen(false)} />}
      {skipOpen && <SkipDialog onClose={() => setSkipOpen(false)} onSkip={(at) => { advanceTo(at); setSkipOpen(false); }} />}
      {confirm && (
        <Modal
          title="You Would Miss Something"
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className="btn" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { advanceTo(confirm.at); setConfirm(null); }}>
                Advance Anyway
              </button>
            </>
          }
        >
          <p className="small muted">
            Advancing to <strong>{confirm.label}</strong> ({formatDateTime(confirm.at, sim.zone)}) passes{' '}
            {confirm.missed.length} commitment{confirm.missed.length === 1 ? '' : 's'} you are expected at.
            Time only moves forwards; anything missed stays missed.
          </p>
          <ul className="small" style={{ margin: 'var(--s2) 0 0', paddingLeft: 'var(--s4)' }}>
            {confirm.missed.slice(0, 8).map((entry) => (
              <li key={entry.id}>{titleCaseLabel(entry.title)} — {formatDateTime(entry.at, sim.zone)}</li>
            ))}
          </ul>
        </Modal>
      )}
    </>
  );
}

function SleepDialog({ onClose }: { onClose: () => void }) {
  const { sim, run } = useGame();
  const suggestion = useWorld((s) => suggestedSleep(s));
  const untilNext = useWorld((s) => hoursUntilNextCommitment(s));
  const [hours, setHours] = useState(suggestion.hours);

  const wakeAt = sim.now + hours * MS_HOUR;
  const crossed = sim.timeline.between(sim.now, wakeAt).filter((i) => i.requiresPlayer);

  const sleep = () => {
    const result = run('life.sleep', { hours });
    if (result.ok) onClose();
  };

  return (
    <Modal
      title="Sleep"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Not Yet</button>
          <button className="btn btn-primary" onClick={sleep}>
            Sleep {hours} Hours
          </button>
        </>
      }
    >
      <p className="muted">{suggestion.reason}</p>

      <div className="field">
        <div className="row-between">
          <label htmlFor="sleep-hours" style={{ marginBottom: 0 }}>Hours</label>
          <span className="mono">{hours}</span>
        </div>
        <input
          id="sleep-hours" type="range" min={1} max={14} step={0.5}
          value={hours} onChange={(e) => setHours(Number(e.target.value))}
        />
      </div>

      <div className="grid grid-2">
        <div className="stat">
          <span className="stat-label">Now</span>
          <span className="small">{formatTime(sim.now, sim.zone)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">You’d wake at</span>
          <span className="small">{formatTime(wakeAt, sim.zone)}, {formatDate(wakeAt, sim.zone)}</span>
        </div>
      </div>

      {untilNext !== undefined && (
        <div className="callout" style={{ marginTop: 'var(--s4)' }}>
          Your next commitment is in {formatDuration(untilNext * MS_HOUR)}.
        </div>
      )}

      {crossed.length > 0 && (
        <div className="callout callout-warning" style={{ marginTop: 'var(--s3)' }}>
          <strong>You would sleep through {crossed.length} commitment{crossed.length === 1 ? '' : 's'}:</strong>
          <ul className="small" style={{ margin: 'var(--s2) 0 0', paddingLeft: 'var(--s4)' }}>
            {crossed.slice(0, 5).map((item) => (
              <li key={item.id}>{item.label} — {formatTime(item.at, sim.zone)}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="xs dim" style={{ marginTop: 'var(--s4)' }}>
        The world keeps running while you sleep. Bills come due, messages arrive and other people
        get on with their lives.
      </p>
    </Modal>
  );
}

/**
 * You are at it. Go, or do not.
 *
 * The one place in the game where turning up is a decision rather than a
 * consequence. Going costs the hours it takes, which is why not going is a
 * real option and not a way of throwing points away for nothing.
 */
function DueNow({ item, wanted, onGo, onStay, onClose }: {
  item: ScheduledItem;
  wanted: Instant;
  onGo: () => void;
  onStay: () => void;
  onClose: () => void;
}) {
  const { sim } = useGame();
  const zone = sim.zone;
  const mine = item.kind === PLAN_KIND;
  const names = namesOn(sim, item);
  const runs = item.durationMinutes ?? 60;
  const ahead = Math.max(0, wanted - item.at);

  return (
    <Modal
      title={titleCaseLabel(item.label)}
      onClose={onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Stand Here</button>
          {mine && (
            <button className="btn" onClick={onStay}>
              {names.length > 0 ? 'Don’t Go' : 'Skip It'}
            </button>
          )}
          <button className="btn btn-primary" onClick={onGo}>Go</button>
        </>
      )}
    >
      <p className="small">
        It’s {formatTime(item.at, zone)} on {formatDate(item.at, zone)}, and this is what wanted you.
        {' '}Going takes {formatDuration(runs * 60_000)} of the day
        {ahead > 0 ? `, and the clock carries on to ${formatDateTime(wanted, zone)} after.` : '.'}
      </p>
      {names.length > 0 && (
        <p className="small">
          {`It’s with ${saidAsList(names)}. Going is worth ${TOGETHER_WARMS} points of where you stand with `
            + `${names.length === 1 ? 'them' : 'each of them'}. Not going costs ${MISSED_COOLS}, and `
            + `${names.length === 1 ? 'they’ll' : 'they’ll each'} know you weren’t there.`}
        </p>
      )}
      {!mine && (
        <p className="small muted">
          This one isn’t yours to walk away from — it’s the world’s. Go, or leave the clock where it is.
        </p>
      )}
    </Modal>
  );
}

function SkipDialog({ onClose, onSkip }: { onClose: () => void; onSkip: (at: number) => void }) {
  const { sim } = useGame();
  const targets = useWorld((s) => skipTargets(s, 14));
  const [selected, setSelected] = useState<string | null>(targets[0]?.item.id ?? null);
  const target = targets.find((t) => t.item.id === selected);

  return (
    <Modal
      title="Skip To Event"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!target}
            onClick={() => target && onSkip(target.item.at)}
          >
            Skip {target ? `To ${titleCaseLabel(target.entry.title)}` : ''}
          </button>
        </>
      }
    >
      {targets.length === 0 ? (
        <p className="muted">Nothing is scheduled ahead of you right now.</p>
      ) : (
        <>
          <div className="list card card-flush" style={{ maxHeight: 260, overflowY: 'auto' }}>
            {targets.map((entry) => (
              <button
                key={entry.item.id}
                className="list-item"
                aria-selected={selected === entry.item.id}
                onClick={() => setSelected(entry.item.id)}
              >
                <div className="grow">
                  <div className="small strong">{entry.entry.title}</div>
                  <div className="xs dim">
                    {formatDate(entry.item.at, sim.zone)} at {formatTime(entry.item.at, sim.zone)}
                    {entry.daysAway > 0 && ` · in ${entry.daysAway} day${entry.daysAway === 1 ? '' : 's'}`}
                  </div>
                </div>
                {entry.missed.length > 0 && (
                  <span className="chip chip-warning">{entry.missed.length} missed</span>
                )}
                {entry.needsTravel && <span className="chip chip-negative">Travel</span>}
              </button>
            ))}
          </div>

          {target && (
            <div style={{ marginTop: 'var(--s4)' }}>
              <div className="eyebrow" style={{ marginBottom: 'var(--s2) ' }}>What this jump costs</div>

              {target.travelNote && (
                <div className="callout callout-negative" style={{ marginBottom: 'var(--s3)' }}>
                  {target.travelNote}
                </div>
              )}

              {target.missed.length > 0 ? (
                <div className="callout callout-warning" style={{ marginBottom: 'var(--s3)' }}>
                  <strong>You would miss {target.missed.length} commitment{target.missed.length === 1 ? '' : 's'}:</strong>
                  <ul className="small" style={{ margin: 'var(--s2) 0 0', paddingLeft: 'var(--s4)' }}>
                    {target.missed.slice(0, 6).map((entry) => (
                      <li key={entry.id}>{entry.title} — {formatDate(entry.at, sim.zone)}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="small muted">Nothing you have to attend falls before it.</p>
              )}

              <p className="xs dim">
                {target.crossed.length} scheduled thing{target.crossed.length === 1 ? '' : 's'} will be
                processed in order on the way. Time only moves forwards.
              </p>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

/**
 * Advance: the world moved forward on purpose.
 *
 * Live time is a minute a minute. This is for when you do not want to wait —
 * the hour until a call, the night until a morning, the week until a
 * decision. Every jump goes through the one world clock, everything on the
 * way is processed in order, and a jump that would skip past a commitment
 * asks first.
 */
function AdvanceMenu({
  onAdvance, onChooseEvent,
}: {
  onAdvance: (at: Instant, label: string) => void;
  onChooseEvent: () => void;
}) {
  const { sim } = useGame();
  const nextEvent = useWorld((s) => skipTargets(s, 1)[0]);
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (anchor.current && !anchor.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const zone = sim.zone;
  const now = sim.now;
  const today = zonedParts(now, zone);
  const todayAt = (hour: number) => instantFromZoned(
    { year: today.year, month: today.month, day: today.day, hour, minute: 0, second: 0 }, zone,
  );
  const nextAt = (hour: number) => (todayAt(hour) > now ? todayAt(hour) : addDays(todayAt(hour), 1, zone));
  const weekday = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();
  const untilMonday = ((1 - weekday) + 7) % 7 || 7;

  const items: { label: string; detail: string; at?: Instant; choose?: boolean }[] = [
    { label: 'One Hour', detail: formatTime(now + MS_HOUR, zone), at: now + MS_HOUR },
    { label: 'This Evening', detail: `6:00 PM · ${formatDate(nextAt(18), zone)}`, at: nextAt(18) },
    { label: 'Tonight', detail: `10:00 PM · ${formatDate(nextAt(22), zone)}`, at: nextAt(22) },
    { label: 'Tomorrow Morning', detail: `7:00 AM · ${formatDate(addDays(todayAt(7), 1, zone), zone)}`, at: addDays(todayAt(7), 1, zone) },
    {
      label: 'Next Event',
      detail: nextEvent ? `${nextEvent.entry.title} · ${formatDateTime(nextEvent.item.at, zone)}` : 'Nothing is scheduled',
      at: nextEvent?.item.at,
    },
    { label: 'Next Monday', detail: `9:00 AM · ${formatDate(addDays(todayAt(9), untilMonday, zone), zone)}`, at: addDays(todayAt(9), untilMonday, zone) },
    { label: 'One Week', detail: formatDateTime(addDays(now, 7, zone), zone), at: addDays(now, 7, zone) },
    { label: 'Choose An Event…', detail: 'Pick from everything on the calendar', choose: true },
  ];

  return (
    <div className="menu-anchor" ref={anchor}>
      <button
        type="button"
        className="btn btn-sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Advance ▾
      </button>
      {open && (
        <div className="menu" role="menu" aria-label="Advance Time">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className="menu-item"
              disabled={!item.choose && item.at === undefined}
              onClick={() => {
                setOpen(false);
                if (item.choose) onChooseEvent();
                else if (item.at !== undefined) onAdvance(item.at, item.label);
              }}
            >
              <span className="menu-item-label">{item.label}</span>
              <span className="menu-item-detail">{item.detail}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
