/**
 * SLATE — time controls.
 *
 * Sleep and Skip to Event both go through the one advancement path, so the
 * world processes everything that comes due either way.
 */

import { titleCaseLabel } from '@/engine/core/text';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Modal, WhyNot, dialogOpen } from '@/ui/components/primitives';
import {
  suggestedSleep, hoursUntilNextCommitment, sleepStandsForTheNight, occupiedAt, lookAfterOptions, labelFor, type LookAfter,
  LONGEST_NIGHT, SHORTEST_SLEEP,
} from '@/engine/systems/life';
import { skipTargets, type SkipTarget } from '@/engine/world/calendar';
import { ADVANCE_HOURS, carryOnTo, nextAtHour, nextMondayAt, refusalOf, stopChoices, type Stop, type StopChoice } from '@/engine/world/clock';
import { onTheWay, type OnTheWay } from '@/engine/foresight';
import {
  addDays, formatDate, formatDateTime, formatDuration, formatDurationWords, formatTime, formatWeekdayDate, MS_DAY, MS_HOUR, MS_MINUTE,
  type Instant,
} from '@/engine/core/time';
import { PARTNER_KIND } from '@/engine/systems/coursework';
import { APPOINTMENT_KIND } from '@/engine/systems/appointments';
import { THERAPY_SESSION_KIND } from '@/engine/systems/therapy';
import { formatMoney, saveCurrency } from '@/engine/core/money';
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

/**
 * The live clock held while a dialog that moves it is open (from 2026-10-20, the owner's brief 19, D4: brief 18's S4), as
 * the guide and the reference hold it (`hold`, `app/game-context.tsx`): Sleep, On The Way and Skip To Event each say where
 * the clock would go from now, and a clock running behind them made what they said untrue. Closed without moving it, the
 * clock goes on from where it was, the time the dialog was open not counted; a sleep or a jump moves it as it always did.
 * Until then only the guide and the reference held it, and with Play on the Sleep dialog's Now and its suggestion moved
 * under the player (11:00 PM became 11:01 PM in a minute open on the built app, brief 19's walk).
 */
function useHeld(key: string, on = true): void {
  const { hold } = useGame();
  useEffect(() => {
    hold(key, on);
    return () => hold(key, false);
  }, [hold, key, on]);
}

/** How far ahead Skip To Event foresees the stops not on the calendar yet: a month. */
const FORESEEN_DAYS = 31;

/** "a, or b, or c": the stop's choices as On The Way offers them. */
const orList = (items: readonly string[]): string => items.join(', or ');

/** What On The Way says of the choices the commitments it lists offer beyond Go and Stand Here, and what each does to the jump. */
function choicesAhead(missed: readonly OnTheWay[]): string {
  const seen = new Map<string, StopChoice>();
  for (const { item } of missed) for (const c of stopChoices(item.kind)) seen.set(c.command, c);
  const carry = [...seen.values()].filter((c) => c.then === 'carry-on').map((c) => c.ahead);
  const stay = [...seen.values()].filter((c) => c.then === 'stay').map((c) => c.ahead);
  const after = (n: number) => (n === 1 ? 'the clock then carries on' : n === 2 ? 'the clock carries on after either' : 'the clock carries on after any of them');
  return [
    carry.length ? ` You can also ${orList(carry)}, and ${after(carry.length)}.` : '',
    stay.length ? ` You can also ${orList(stay)}, and the clock then stays paused there.` : '',
  ].join('');
}

export function TimeControls() {
  // Why sleep can't start now, as the command has it: in the middle of a commitment.
  const sleepBusy = useWorld((s) => { const busy = occupiedAt(s, s.now); return busy ? `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, s.zone)}.` : undefined; });
  const sleepGate = useFeature('ui.sleep');
  const { sim, advanceTo, run, refresh, standingAt, clearStandingAt } = useGame();
  const [sleepOpen, setSleepOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ at: Instant; label: string; missed: OnTheWay[] } | null>(null);
  const speed = sim.universe.preferences.timeSpeed;
  useHeld('on-the-way', confirm !== null);

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
            // What the jump would stop at, those not on the calendar yet among them (`onTheWay`, from 2026-10-20, brief
            // 19's D5): until then the calendar's own alone (`missedBy`), and One Week from a Friday evening asked nothing
            // and stopped at Monday's classes, which the School puts on the calendar the Sunday before.
            const missed = onTheWay(sim, at);
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
          stop={due}
          // Carrying on is the same jump the stop broke off, not a new one, through the commitment's own hours
          // (`carryOnTo`, `world/clock.ts`).
          onGo={() => {
            clearStandingAt();
            advanceTo(carryOnTo(due, 'go')!, due.sentFrom);
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
          {/* What each stop offers is DueNow's: Go and Stand Here always, and what a kind of commitment declares
              (`stopChoices`, `world/clock.ts`). What each does to this move is said (from 2026-10-20, brief 17): Go carries
              the move on to where it was headed and Stand Here ends it, the clock paused at the stop (`onGo`, `onClose`).
              Until then it said "press Go, or Stand Here to wait", which didn't say the move stops there. From later that
              day (brief 19, D1) it names only the choices of the commitments it lists, and that the move carries on after
              them: until then it named Skip It and Call It Off whatever was on the way, and nothing said where the clock
              went after either. */}
          <p className="small muted">
            Moving the clock to <strong>{confirm.label}</strong> ({formatDateTime(confirm.at, sim.zone)}) passes{' '}
            {said(confirm.missed.length, 'commitment')}. The clock stops at {confirm.missed.length === 1 ? 'it' : 'each one'} so
            you can choose: press Go to be there and carry on, or Stand Here to stop the clock there.{choicesAhead(confirm.missed)}
          </p>
          <ul className="small" style={{ margin: 'var(--s2) 0 0', paddingLeft: 'var(--s4)' }}>
            {confirm.missed.slice(0, 8).map(({ item, foreseen }) => (
              <li key={`${item.id}${foreseen ? ' ahead' : ''}`}>{titleCaseLabel(item.label)} — {formatDateTime(item.at, sim.zone)}{foreseen ? ', not on your calendar yet' : ''}</li>
            ))}
          </ul>
          {confirm.missed.some((w) => w.foreseen) && (
            <p className="xs dim" style={{ marginTop: 'var(--s2)' }}>
              What isn’t on your calendar yet goes on it as the clock moves, before it comes.
            </p>
          )}
        </Modal>
      )}
    </>
  );
}

function SleepDialog({ onClose }: { onClose: () => void }) {
  const { sim, run } = useGame();
  // The clock waits while the hours are chosen (from 2026-10-20, brief 19's D4): Not Yet leaves it where it was, and
  // Sleep moves it as the night does.
  useHeld('sleep');
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

      {/* Until 2026-10-20 (brief 17) this said "anything on your calendar in those hours happens without you", where a
          commitment slept through is missed (`life.sleep`'s You Slept Through notice), and only what happens without
          you runs on its own. */}
      <p className="xs dim" style={{ marginTop: 'var(--s4)' }}>
        The clock moves on while you sleep. What happens without you still happens, and you miss any commitment in
        those hours.
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
 *
 * Its buttons beyond Go and Stand Here are the commitment's kind's own (`stopChoices`, `world/clock.ts`, from 2026-10-20,
 * the owner's brief 19, D1): Skip It on a plan of your own and Call It Off on a rehearsal with a partner, as they were,
 * and what a career appointment declares. Each says what it does to the jump before it's pressed, and does it: its
 * command run, then the jump carried on to where it was headed (`carryOnTo`), or, refused, the stop left open with the
 * refusal said. Until then Skip It carried the jump on and Call It Off ended it, neither said, and a refused Skip It
 * closed the stop and left the jump there.
 */
function DueNow({ stop, onGo, onClose }: {
  stop: Stop;
  onGo: () => void;
  onClose: () => void;
}) {
  const { sim, run, toast, advanceTo, clearStandingAt } = useGame();
  const zone = sim.zone;
  const { item, wanted } = stop;
  const choices = stopChoices(item.kind);
  const partner = item.kind === PARTNER_KIND;
  // Your own care asks only that you're awake and out of hospital (`presentForCare`); anything else, that you're in its
  // town and not laid up by an injury too (`present`).
  const care = item.kind === APPOINTMENT_KIND || item.kind === THERAPY_SESSION_KIND;
  const runs = item.durationMinutes ?? 0;
  const name = titleCaseLabel(item.label);
  // Where the clock goes after a choice, in words: a stop the live clock made is a second from where it was headed.
  const onward = (choice: StopChoice) => {
    const to = carryOnTo(stop, choice);
    return to !== undefined && to - item.at >= MS_MINUTE
      ? `the clock carries on to ${formatDateTime(to, zone)}, stopping at the next commitment on the way`
      : 'the clock stays paused here';
  };
  // A rehearsal with a partner can be called off even now, late (from 2026-10-12): until then this said it wasn’t
  // the player’s to walk away from, while Call It Off on the Coursework tab worked at this very moment.
  const choose = (choice: StopChoice) => {
    // Not silent about a refusal: if the world won't let you walk away from something, the reason is the answer, and
    // the stop stays where it is.
    const refused = refusalOf(run(choice.command, choice.payload(item), { silent: true }));
    if (refused) { toast(refused, 'negative'); return; }
    clearStandingAt();
    if (choice.done) toast(choice.done, 'neutral');
    const to = carryOnTo(stop, choice);
    if (to !== undefined) advanceTo(to, stop.sentFrom);
  };

  return (
    <Modal
      title={name}
      onClose={onClose}
      footer={(
        <>
          <HowItWorks help="day.calendar" />
          <button className="btn btn-ghost" onClick={onClose}>Stand Here</button>
          {choices.map((choice) => (
            <Gated key={choice.command} feature={choice.command} className="btn" onClick={() => choose(choice)}>{choice.label}</Gated>
          ))}
          <Gated feature="ui.go" className="btn btn-primary" onClick={onGo}>Go</Gated>
        </>
      )}
    >
      <p className="small">
        It’s {formatTime(item.at, zone)} on {formatDate(item.at, zone)}, and this needs you now.
        {' '}Going takes {formatDurationWords(runs * 60_000)}
        {`, and the clock moves on to ${formatDateTime(Math.max(wanted, item.at + runs * 60_000), zone)}.`}
      </p>
      {choices.length === 0 && (
        <p className="small muted">
          {/* What starts and who's there, said (from 2026-10-20, brief 16, section 8): until then "It happens the next time
              the clock moves, and you’re there if you’re awake and in the right city", which left out the hospital and an
              injury, and didn't say what "it" was. What to press comes first, and why there's no Skip It last (brief 17,
              the same day): until then the paragraph opened on the button that isn't there, and "Stand Here to wait"
              didn't say the clock waits paused, as the stop pauses it (`halt` in `game-context.tsx`). */}
          Press Go, or Stand Here to wait with the clock paused.
          {` ${name} starts the next time the clock moves, and you’re there if you’re awake${care ? ' and out of hospital' : ', in its town, and not in hospital or laid up with an injury'}.`}
          {' '}Only a plan of your own can be skipped, so there’s no Skip It button here.
        </p>
      )}
      {partner && (
        <p className="small muted">
          Your partner is expecting you. You can go or call it off, but at this short notice calling it off costs their
          trust, and they’ll remember it.{' '}
          <HowItWorks help="coursework.partners" />
        </p>
      )}
      {choices.length > 0 && (
        <p className="small muted">
          {choices.map((choice) => `${choice.label} ${choice.does}, and ${onward(choice)}. `).join('')}
          {`Stand Here keeps the clock paused here, and ${name} starts the next time it moves.`}
        </p>
      )}
    </Modal>
  );
}

/** Exported for `tests/whynot-time.test.ts`, which renders it: the bar opens it from Advance's Choose An Event. */
export function SkipDialog({ onClose, onSkip }: { onClose: () => void; onSkip: (at: number) => void }) {
  const { sim } = useGame();
  // Held while it's open, as Sleep and On The Way are (from 2026-10-20, brief 19's D4).
  useHeld('skip');
  const targets = useWorld((s) => skipTargets(s, 14));
  const [selected, setSelected] = useState<string | null>(targets[0]?.item.id ?? null);
  const target = targets.find((t) => t.item.id === selected);
  // The stops on the way that aren't on the calendar yet, foreseen once for the list as it opens (`onTheWay`, from
  // 2026-10-20, brief 19's D5), as far as its last event or a month ahead, whichever is sooner: a month's jump played
  // ahead takes a tenth of a second or so, a year's could take seconds. Until then each event's count and list were the
  // calendar's alone, and the week's classes the School hadn't put on it yet weren't counted.
  const ids = targets.map((t) => t.item.id).join(' ');
  const ahead = useMemo(() => {
    const last = targets.at(-1)?.item.at;
    return last === undefined ? [] : onTheWay(sim, Math.min(last, sim.now + FORESEEN_DAYS * MS_DAY)).filter((w) => w.foreseen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, ids]);
  // Not one the clock is standing at, which the jump runs at once, with no stop (as On The Way, `onTheWay`).
  const stopsBefore = (t: SkipTarget) => [
    ...t.missed.filter((e) => e.at > sim.now).map((e) => ({ id: e.id, title: e.title, at: e.at, foreseen: false })),
    ...ahead.filter((w) => w.item.at < t.item.at).map((w) => ({ id: `${w.item.id} ahead`, title: titleCaseLabel(w.item.label), at: w.item.at, foreseen: true })),
  ].sort((a, b) => a.at - b.at);
  const missed = target ? stopsBefore(target) : [];

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
                {stopsBefore(entry).length > 0 && (
                  <span className="chip chip-warning">{stopsBefore(entry).length} on the way</span>
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

              {missed.length > 0 ? (
                <div className="callout callout-warning" style={{ marginBottom: 'var(--s3)' }}>
                  <strong>The clock will stop at {said(missed.length, 'commitment')} on the way and ask what you want to do:</strong>
                  <ul className="small" style={{ margin: 'var(--s2) 0 0', paddingLeft: 'var(--s4)' }}>
                    {missed.slice(0, 6).map((entry) => (
                      <li key={entry.id}>{entry.title} — {formatDate(entry.at, sim.zone)}{entry.foreseen ? ', not on your calendar yet' : ''}</li>
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
  // Each line says the day and the time it lands (from 2026-10-20, brief 19's D2): until then One Hour said the time
  // alone and the rest a date with no day, and at 2 AM Tomorrow Morning said the next date's seven, where it then went.
  // It goes to the next seven now (`nextAtHour`, `world/clock.ts`), the same date's after midnight.
  const lands = (at: Instant) => `${formatTime(at, zone)} · ${formatWeekdayDate(at, zone)}`;
  const line = (label: string, at: Instant) => ({ label, detail: lands(at), at });

  const items: { label: string; detail: string; at?: Instant; choose?: boolean }[] = [
    line('One Hour', now + MS_HOUR),
    line('This Evening', nextAtHour(now, zone, ADVANCE_HOURS.evening)),
    line('Tonight', nextAtHour(now, zone, ADVANCE_HOURS.tonight)),
    line('Tomorrow Morning', nextAtHour(now, zone, ADVANCE_HOURS.morning)),
    {
      label: 'Next Event',
      detail: nextEvent ? `${nextEvent.entry.title} · ${formatDateTime(nextEvent.item.at, zone)}` : 'No plans or commitments ahead',
      at: nextEvent?.item.at,
    },
    line('Next Monday', nextMondayAt(now, zone)),
    line('One Week', addDays(now, 7, zone)),
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
                    {/* Named as the measures beside it are (from 2026-10-20, brief 17): until then "Morale 84 → 86 · readiness +0.4". */}
                    {o.gain !== 0 ? ` · Readiness ${o.gain > 0 ? '+' : ''}${o.gain.toFixed(1)}` : ''}
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
