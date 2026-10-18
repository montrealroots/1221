/**
 * SLATE — time controls.
 *
 * Sleep and Skip to Event both go through the one advancement path, so the
 * world processes everything that comes due either way.
 */

import { titleCaseLabel } from '@/engine/core/text';
import { useEffect, useRef, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Modal, WhyNot, dialogOpen } from '@/ui/components/primitives';
import {
  suggestedSleep, hoursUntilNextCommitment, sleepStandsForTheNight, occupiedAt, lookAfterOptions, labelFor, type LookAfter,
  LONGEST_NIGHT, SHORTEST_SLEEP,
} from '@/engine/systems/life';
import { missedBy, skipTargets } from '@/engine/world/calendar';
import type { CalendarEntry } from '@/engine/world/calendar';
import {
  addDays, formatDate, formatDateTime, formatDuration, formatDurationWords, formatTime, instantFromZoned, zonedParts, MS_HOUR,
  type Instant,
} from '@/engine/core/time';
import { PLAN_KIND } from '@/engine/world/plans';
import { PARTNER_KIND } from '@/engine/systems/coursework';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import type { ScheduledItem } from '@/engine/core/scheduler';
import { Gated, useFeature } from '@/ui/guide/Guide';
import { HowItWorks } from '@/ui/guide/HowItWorks';
import { said, toStart } from '@/ui/looks/words';
import { plural } from '@/engine/core/text';

/** The foot of a top-bar menu, where its How This Works sits: the bar itself has no room for one. */
const MENU_FOOT = { padding: 'var(--s2) var(--s3) var(--s1)', marginTop: 'var(--s1)', borderTop: '1px solid var(--line)' } as const;

/** The dials, as the menu names them. */
const DIAL_LABEL: Partial<Record<string, string>> = {
  energy: 'Energy', stress: 'Stress', sleepDebt: 'Sleep Debt', nourishment: 'Nourishment', morale: 'Morale', hygiene: 'Hygiene', condition: 'Condition', fitness: 'Fitness',
};

/**
 * A dial as the menu says it: a whole number, and fitness, stamina's own figure, to the tenth the Player Profile keeps it
 * to (from 2026-10-17, brief 11, T1). Until then a workout's gain under a point read as none: at 50.6 a run building 0.8
 * said "Fitness 51 → 51".
 */
const dialFigure = (dial: string, x: number): string => (dial === 'fitness' ? x.toFixed(1) : String(Math.round(x)));

export function TimeControls() {
  // Why sleep can't start now, as the command has it: in the middle of a commitment.
  const sleepBusy = useWorld((s) => { const busy = occupiedAt(s, s.now); return busy ? `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, s.zone)}.` : undefined; });
  const sleepGate = useFeature('ui.sleep');
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

  // Through the command, the way every other change to the save goes. It was
  // an assignment into `sim.universe` from a React component, which is the one
  // write in the interface that skipped the engine entirely.
  const setSpeed = (next: typeof speed) => {
    run('world.set_preferences', { timeSpeed: next }, { silent: true });
    refresh();
  };

  return (
    <>
      <div className="row gap-1 topbar-time" role="group" aria-label="Time Controls">
        {/* Play or Pause names what a press does, and has no pressed state. Until 2026-10-13 it was also a toggle,
            `aria-pressed` on while paused, so a screen reader said “Play, pressed” with the clock stopped and “Pause, not
            pressed” with it running: a toggle’s name stays the same while its state changes (WAI-ARIA Authoring
            Practices, Button pattern), and this one’s changes. */}
        <Gated
          feature="ui.play"
          className="btn btn-ghost btn-sm"
          onClick={() => setSpeed(speed === 'paused' ? 'live' : 'paused')}
          title={speed === 'paused' ? 'Resume Time' : 'Pause Time'}
        >
          {speed === 'paused' ? 'Play' : 'Pause'}
        </Gated>
        <Gated feature="ui.sleep" className="btn btn-sm" disabled={Boolean(sleepBusy)} title={sleepBusy} onClick={() => setSleepOpen(true)}>Sleep</Gated>
        <LookAfterMenu />
        <AdvanceMenu
          onAdvance={(at, label) => {
            const missed = missedBy(sim, at);
            if (missed.length > 0) setConfirm({ at, label, missed });
            else advanceTo(at);
          }}
          onChooseEvent={() => setSkipOpen(true)}
        />
      </div>
      {/* Why Sleep is grayed out, in words on a row of its own at the foot of the bar (from 2026-10-12): until then it
          was only Sleep's tooltip, which a phone never shows and a keyboard never reaches. The bar's other controls are
          listed, never refused, so the line names Sleep rather than saying "Not now". Its row is the bar's own
          (`.topbar-why`): first written as an item beside the controls, it squeezed the bar on a desktop or a tablet and
          pushed Save & Exit off its edge. Not said while the guide still has Sleep locked, when it isn't grayed out. */}
      {sleepBusy && sleepGate.open && (
        <div className="topbar-why">
          <WhyNot reasons={[[speed === 'paused' ? 'Play' : 'Pause', undefined], ['Sleep', sleepBusy], ['Look After Yourself', undefined], ['Advance', undefined]]} />
        </div>
      )}

      {due && (
        <DueNow
          item={due.item}
          wanted={due.wanted}
          // Carrying on is the same jump the stop broke off, not a new one.
          // Going takes the thing's own hours: the clock goes through them, on
          // to where it was headed if that is later. It went only to where it
          // was headed, and a stop at a bar shift with the evening asked for
          // left the clock at six, halfway through the shift.
          onGo={() => {
            clearStandingAt();
            advanceTo(Math.max(due.wanted, due.item.at + (due.item.durationMinutes ?? 0) * 60_000), due.sentFrom);
          }}
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
            advanceTo(due.wanted, due.sentFrom);
          }}
          onClose={clearStandingAt}
        />
      )}

      {sleepOpen && <SleepDialog onClose={() => setSleepOpen(false)} />}
      {skipOpen && <SkipDialog onClose={() => setSkipOpen(false)} onSkip={(at) => { advanceTo(at); setSkipOpen(false); }} />}
      {confirm && (
        <Modal
          title="On The Way"
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className="btn" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { advanceTo(confirm.at); setConfirm(null); }}>
                Advance
              </button>
            </>
          }
        >
          {/* What each stop offers is DueNow's: Go and Stand Here always, Skip It on a plan of your own, Call It Off on a
              rehearsal with a partner, which at short notice costs their trust (`school.cancel_rehearsal`). */}
          <p className="small muted">
            Moving the clock to <strong>{confirm.label}</strong> ({formatDateTime(confirm.at, sim.zone)}) passes{' '}
            {said(confirm.missed.length, 'commitment')}, and the clock stops at each one. At each, you can go, or press
            Stand Here and the clock waits. A plan of your own can also be skipped, and a rehearsal with a partner called
            off, though at short notice that costs their trust.
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
  // Said, because the suggestion can be one: three hours before something at
  // three in the morning is tonight’s night, and they are up from half past
  // two to the next midnight.
  const tonight = sleepStandsForTheNight(sim, hours);

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
          <HowItWorks help="body.sleep" />
          <button className="btn" onClick={onClose}>Not Yet</button>
          <Gated feature="life.sleep" className="btn btn-primary" onClick={sleep}>
            Sleep {plural(hours, 'Hour')}
          </Gated>
        </>
      }
    >
      <p className="muted">{suggestion.reason}</p>

      <div className="field">
        <div className="row-between">
          <label htmlFor="sleep-hours" style={{ marginBottom: 0 }}>Hours</label>
          <span className="mono">{hours}</span>
        </div>
        {/* The engine's own floor and ceiling (from 2026-10-12): the slider started at 1 until then, under a suggestion
            that can be half an hour. */}
        <input
          id="sleep-hours" type="range" min={SHORTEST_SLEEP} max={LONGEST_NIGHT} step={0.5}
          value={hours} onChange={(e) => setHours(Number(e.target.value))}
        />
      </div>

      <div className="grid grid-2">
        <div className="stat">
          <span className="stat-label">Now</span>
          <span className="small">{formatTime(sim.now, sim.zone)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">You’d Wake At</span>
          <span className="small">{formatTime(wakeAt, sim.zone)}, {formatDate(wakeAt, sim.zone)}</span>
        </div>
      </div>

      {/* Standing at it, it's now (from 2026-10-12). Until then this line left it out, and counted from now it would
          have said "in less than a minute". */}
      {untilNext !== undefined && (
        <div className="callout" style={{ marginTop: 'var(--s4)' }}>
          {untilNext <= 0 ? 'Your next commitment is now, and you’re standing at it.' : `Your next commitment is in ${formatDurationWords(untilNext * MS_HOUR)}.`}
        </div>
      )}

      {tonight && (
        <div className="callout callout-warning" style={{ marginTop: 'var(--s4)' }}>
          This would count as tonight’s sleep. You’d be up from {formatTime(wakeAt, sim.zone)}, and you wouldn’t
          sleep the rest of the night.
        </div>
      )}

      {crossed.length > 0 && (
        <div className="callout callout-warning" style={{ marginTop: 'var(--s3)' }}>
          <strong>You’d sleep through {said(crossed.length, 'commitment')}:</strong>
          <ul className="small" style={{ margin: 'var(--s2) 0 0', paddingLeft: 'var(--s4)' }}>
            {crossed.slice(0, 5).map((item) => (
              <li key={item.id}>{item.label} — {formatTime(item.at, sim.zone)}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="xs dim" style={{ marginTop: 'var(--s4)' }}>
        The world keeps running while you sleep. The clock moves on, and anything on your
        calendar in those hours happens without you.
      </p>
    </Modal>
  );
}

/**
 * You are at it. Go, or do not.
 *
 * The one place in the game where turning up is a decision rather than a
 * consequence. Going costs the hours it takes, which is why not going is a
 * real option.
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
  const { run, toast } = useGame();
  const mine = item.kind === PLAN_KIND;
  const partner = item.kind === PARTNER_KIND;
  const runs = item.durationMinutes ?? 0;
  // A rehearsal with a partner can be called off even now, late (from 2026-10-12): until then this said it wasn’t
  // the player’s to walk away from, while Call It Off on the Coursework tab worked at this very moment.
  const callOff = () => {
    const r = run('school.cancel_rehearsal', { assignmentId: item.payload.assignmentId, rehearsalId: item.payload.rehearsalId });
    if (r.ok) { toast('Rehearsal called off. At this short notice, it costs your partner’s trust.', 'neutral'); onClose(); }
  };

  return (
    <Modal
      title={titleCaseLabel(item.label)}
      onClose={onClose}
      footer={(
        <>
          <HowItWorks help="day.calendar" />
          <button className="btn btn-ghost" onClick={onClose}>Stand Here</button>
          {mine && (
            <Gated feature="calendar.skip" className="btn" onClick={onStay}>Skip It</Gated>
          )}
          {partner && (
            <Gated feature="school.cancel_rehearsal" className="btn" onClick={callOff}>Call It Off</Gated>
          )}
          <Gated feature="ui.go" className="btn btn-primary" onClick={onGo}>Go</Gated>
        </>
      )}
    >
      <p className="small">
        It’s {formatTime(item.at, zone)} on {formatDate(item.at, zone)}, and this needs you now.
        {' '}Going takes {formatDurationWords(runs * 60_000)}
        {`, and the clock moves on to ${formatDateTime(Math.max(wanted, item.at + runs * 60_000), zone)}.`}
      </p>
      {!mine && !partner && (
        <p className="small muted">
          Only a plan of your own can be skipped. Go, or press Stand Here and the clock waits. Whatever moves the clock next
          runs this, with you there if you’re awake and in the right city.
        </p>
      )}
      {partner && (
        <p className="small muted">
          Your partner is expecting you. You can go or call it off, but at this short notice calling it off costs their
          trust, and they’ll remember it.{' '}
          <HowItWorks help="coursework.partners" />
        </p>
      )}
    </Modal>
  );
}

/** Exported for `tests/whynot-time.test.ts`, which renders it: the bar opens it from Advance's Choose An Event. */
export function SkipDialog({ onClose, onSkip }: { onClose: () => void; onSkip: (at: number) => void }) {
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
        <p className="muted">There’s nothing on your calendar ahead of you.</p>
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
                  <span className="chip chip-warning">{entry.missed.length} on the way</span>
                )}
                {/* Until 2026-10-12 it was a Travel chip, for travel that went with the scope reset of 2026-10-09. */}
                {entry.elsewhere && <span className="chip chip-negative">Elsewhere</span>}
              </button>
            ))}
          </div>

          {/* Skip grayed out with events on the list and none picked, said under the list (from 2026-10-12): the one
              picked when this opened went by on a live clock, or nothing was ahead then. Until then nothing said why.
              With nothing ahead at all, the line in the list's place says it. */}
          {!target && (
            <div style={{ marginTop: 'var(--s2)' }}>
              <WhyNot reasons={[['Cancel', undefined], ['Skip', 'Pick an event from the list.']]} />
            </div>
          )}

          {target && (
            <div style={{ marginTop: 'var(--s4)' }}>
              <div className="eyebrow" style={{ marginBottom: 'var(--s2) ' }}>On The Way</div>

              {target.travelNote && (
                <div className="callout callout-negative" style={{ marginBottom: 'var(--s3)' }}>
                  {target.travelNote}
                </div>
              )}

              {target.missed.length > 0 ? (
                <div className="callout callout-warning" style={{ marginBottom: 'var(--s3)' }}>
                  <strong>The clock will stop at {said(target.missed.length, 'commitment')} on the way and ask what you want to do:</strong>
                  <ul className="small" style={{ margin: 'var(--s2) 0 0', paddingLeft: 'var(--s4)' }}>
                    {target.missed.slice(0, 6).map((entry) => (
                      <li key={entry.id}>{entry.title} — {formatDate(entry.at, sim.zone)}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="small muted">You have no commitments before it.</p>
              )}

              <p className="xs dim">
                {target.crossed.length === 0
                  ? 'It’s the next thing on your calendar.'
                  : `${toStart(said(target.crossed.length, 'thing'))} on your calendar ${target.crossed.length === 1 ? 'happens' : 'happen'} on the way, in order. The clock only moves forward.`}
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
  const { open, setOpen, anchor } = useDropdown();
  const gate = useFeature('ui.advance');
  const choosing = useFeature('ui.skip');

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
      detail: nextEvent ? `${nextEvent.entry.title} · ${formatDateTime(nextEvent.item.at, zone)}` : 'No plans or commitments ahead',
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
        className={`btn btn-sm${gate.open ? '' : ' is-locked'}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={gate.reason}
        onClick={() => (gate.open ? setOpen((o) => !o) : gate.ask())}
      >
        {/* The arrow is drawn, not said (from 2026-10-17, brief 14's editorial review): until then the button's accessible
            name was “Advance ▾”, which a screen reader says with the arrow's name in it. Look After Yourself's likewise. */}
        Advance <span aria-hidden="true">▾</span>{!gate.open && <span className="lock-word">Locked</span>}
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
                if (item.choose && !choosing.open) choosing.ask();
                else if (item.choose) onChooseEvent();
                else if (item.at !== undefined) onAdvance(item.at, item.label);
              }}
            >
              <span className="menu-item-label">{item.label}</span>
              <span className="menu-item-detail">{item.detail}</span>
            </button>
          ))}
          <div role="none" className="row gap-2 wrap" style={MENU_FOOT}>
            <HowItWorks help="day.advance" />
            <HowItWorks help="day.clock" label="How Play And Pause Work" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A menu that closes on a click outside it or on Escape, but not while a dialog is open over it: the press or the
 * Escape is the dialog’s, and the menu is left as it was under it, with the control that opened the dialog, which
 * gets focus back when the dialog closes. Until 2026-10-13 it closed on either, so How This Works in the menu opened
 * the help and the help’s own Close, or Escape, shut the menu under it and lost the focus (found by the guide audit
 * of that day).
 */
function useDropdown() {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (dialogOpen()) return;
      if (anchor.current && !anchor.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (dialogOpen()) return;
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return { open, setOpen, anchor };
}

/**
 * Look after yourself: the things besides sleep a player does for their body.
 *
 * Each item says how long it takes, what it costs, why it stands where it
 * does and what it would do to the dials, or, when the engine would refuse
 * it, why, and is grayed out. The order is the engine's (`lookAfterOptions`,
 * from 2026-10-09): what's costing the body every hour first, then by the
 * readiness it gives back. Until then the menu was a fixed list. Nothing on it
 * happens until it's chosen.
 */
function LookAfterMenu() {
  const { sim, run, toast } = useGame();
  const { open, setOpen, anchor } = useDropdown();
  const gate = useFeature('ui.look-after');
  const doing = useFeature('life.look_after');
  // Asked again whenever the world changes, so a meal eaten or a clock moved since counts.
  const options = useWorld((s) => lookAfterOptions(s));
  const cur = saveCurrency(sim.universe);

  const act = (action: LookAfter) => {
    setOpen(false);
    const result = run<{ doneAt: number }>('life.look_after', { action });
    if (result.ok && result.value) {
      toast(`${labelFor(sim, action)}: done at ${formatTime(result.value.doneAt, sim.zone)}.`, 'positive');
    }
  };

  return (
    <div className="menu-anchor" ref={anchor}>
      <button
        type="button"
        className={`btn btn-sm${gate.open ? '' : ' is-locked'}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={gate.reason}
        onClick={() => (gate.open ? setOpen((o) => !o) : gate.ask())}
      >
        Look After Yourself <span aria-hidden="true">▾</span>{!gate.open && <span className="lock-word">Locked</span>}
      </button>
      {open && (
        <div className="menu" role="menu" aria-label="Look After Yourself">
          {options.map((o, i) => {
            const { action, refused } = o;
            const first = i === 0 && !refused && (o.urgent || o.gain >= 0.5);
            return (
              <button
                key={action}
                type="button"
                role="menuitem"
                className="menu-item"
                disabled={refused !== undefined}
                onClick={() => (doing.open ? act(action) : doing.ask())}
              >
                <span className="menu-item-label">
                  {o.label}
                  {first && <span className={`chip ${o.urgent ? 'chip-warning' : 'chip-accent'}`} style={{ marginLeft: 8 }}>{o.urgent ? 'Needed Now' : 'Most Worth It'}</span>}
                </span>
                <span className="menu-item-detail">
                  {formatDuration(o.minutes * 60_000)}{o.cost > 0 ? ` · ${formatMoney(o.cost, cur)}` : ''} · {refused ?? o.why}
                </span>
                {!refused && o.changes.length > 0 && (
                  <span className="menu-item-detail">
                    {o.changes.map((c) => `${DIAL_LABEL[c.dial] ?? c.dial} ${dialFigure(c.dial, c.from)} → ${dialFigure(c.dial, c.to)}`).join(' · ')}
                    {o.gain !== 0 ? ` · readiness ${o.gain > 0 ? '+' : ''}${o.gain.toFixed(1)}` : ''}
                  </span>
                )}
              </button>
            );
          })}
          <div role="none" className="row gap-2 wrap" style={MENU_FOOT}>
            <HowItWorks help="body.look-after" />
          </div>
        </div>
      )}
    </div>
  );
}
