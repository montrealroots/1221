/**
 * SLATE — time controls.
 *
 * Sleep and Skip to Event both go through the one advancement path, so the
 * world processes everything that comes due either way.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Modal } from '@/ui/components/primitives';
import { suggestedSleep, hoursUntilNextCommitment } from '@/engine/systems/life';
import { skipTargets } from '@/engine/world/calendar';
import { formatDate, formatDuration, formatTime, MS_HOUR } from '@/engine/core/time';

export function TimeControls() {
  const { sim, advanceTo, refresh } = useGame();
  const [sleepOpen, setSleepOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const speed = sim.universe.preferences.timeSpeed;

  const setSpeed = (next: typeof speed) => {
    sim.universe.preferences.timeSpeed = next;
    refresh();
  };

  return (
    <>
      <div className="row gap-1" role="group" aria-label="Time controls">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setSpeed(speed === 'paused' ? 'standard' : 'paused')}
          aria-pressed={speed === 'paused'}
          title={speed === 'paused' ? 'Resume time' : 'Pause time'}
        >
          {speed === 'paused' ? '▶' : '❚❚'}
        </button>
        <button className="btn btn-sm" onClick={() => setSleepOpen(true)}>Sleep</button>
        <button className="btn btn-sm hide-sm" onClick={() => setSkipOpen(true)}>Skip to…</button>
      </div>

      {sleepOpen && <SleepDialog onClose={() => setSleepOpen(false)} />}
      {skipOpen && <SkipDialog onClose={() => setSkipOpen(false)} onSkip={(at) => { advanceTo(at); setSkipOpen(false); }} />}
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
          <button className="btn" onClick={onClose}>Not yet</button>
          <button className="btn btn-primary" onClick={sleep}>
            Sleep {hours} hours
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
          <span className="stat-label">You would wake at</span>
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

function SkipDialog({ onClose, onSkip }: { onClose: () => void; onSkip: (at: number) => void }) {
  const { sim } = useGame();
  const targets = useWorld((s) => skipTargets(s, 14));
  const [selected, setSelected] = useState<string | null>(targets[0]?.item.id ?? null);
  const target = targets.find((t) => t.item.id === selected);

  return (
    <Modal
      title="Skip to event"
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
            Skip {target ? `to ${target.entry.title}` : ''}
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
