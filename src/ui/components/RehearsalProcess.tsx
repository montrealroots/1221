/**
 * A casting's rehearsal process on the School's casting tab
 * (`systems/production.ts`, from 2026-10-07): the part's lines and blocking,
 * blocking missed, the director's notes and whether each was taken, the dress
 * rehearsal's reading, and the actor's own work on the part between calls.
 *
 * From 2026-10-12 a note on the craft names what the part's forecast shows, where in the play, with the ways at it:
 * Work On The Note takes one of them, its evidence is kept on the note, and the next call says whether it was
 * answered. The part's forecast is shown in its movements (`systems/piece.ts`), the nights together with the company
 * beside it, and the part can be worked through between calls (`WorkThrough`). Until then "A Night's Readiness" was
 * shown as what a night would come to; from 2026-10-09 it reached a night's growth only, and it's said so now.
 *
 * From 2026-10-16 (brief 10) The Evening's Workload under A Night Now says what the night asks of stamina from the
 * forecast's own figures (`workloadWords`): the running time and its breaks, the part's share, the intensity, the
 * workload, the drain at the curtain's fall and the energy it costs, and where the running time comes from.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Stat, Fine, WhyNot } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { HowItWorks } from '@/ui/guide/HowItWorks';
import { formatDate } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { YALE_DRAMA } from '@/engine/content/school';
import { ADJUSTMENTS, WORKBOOK } from '@/engine/content/workbook';
import { PROCESS, hasProcess, nightFactor, ownWorkRefusal, partPlayingRefusal, reworkable, solutionsOf, type DirectorNote, type Holder, type Which } from '@/engine/systems/production';
import { MaterialDemands, PlayingChooser } from '@/ui/components/PlayingChooser';
import { Segments, WorkThrough } from '@/ui/components/WorkThrough';
import { materialOf } from '@/engine/systems/material';
import { partPreview } from '@/engine/systems/school';
import { workPiece } from '@/engine/systems/workpieces';
import { wayRefusal } from '@/engine/systems/workbook';
import { workloadWords } from '@/engine/systems/workload';

const zone = () => CITIES.require(YALE_DRAMA.cityId).timeZone;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const DRESS_WORD: Record<string, string> = { off: 'An Off Run', solid: 'Solid', strong: 'Strong', remarkable: 'Remarkable' };

/**
 * A note's state in words (from 2026-10-16, `NoteOutcome`): what became of it, so a way that changed nothing reads as
 * tried and learned from, not taken. A note from before has no outcome and reads as it did.
 */
const OUTCOME_WORD = { resolved: '· Resolved', better: '· Taken: Better', learned: '· Tried: Learned From, Not Moved', unchanged: '· Not Taken' } as const;
const noteState = (n: DirectorNote, notYet: string) => (n.outcome ? OUTCOME_WORD[n.outcome] : n.taken === undefined ? (n.worked ? '· Worked On' : `· ${notYet}`) : n.taken ? '· Taken' : '· Not Taken');

export function RehearsalProcess({ casting, which }: { casting: Holder; which: Which }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const p = hasProcess(casting) ? casting.process : undefined;
  const part = ownWorkRefusal(sim, person, which, 'part');
  const blocking = ownWorkRefusal(sim, person, which, 'blocking');
  const note = ownWorkRefusal(sim, person, which, 'note');
  const last = p?.notes.at(-1);
  const piece = useWorld((s) => workPiece(s, s.player, `part:${which}`), [which]);
  const forecast = piece?.forecast();
  const ways = solutionsOf(piece, last);
  const [way, setWay] = useState(0);
  const chosen = ways[Math.min(way, ways.length - 1)];
  // The way chosen is refused here as the command refuses it, by its own checks and minutes (from 2026-10-12).
  const noteWhy = note ?? (piece && chosen ? wayRefusal(sim, person, piece, chosen.adjustment) : undefined);
  const work = () => {
    const r = run<{ before?: number; after?: number; pending?: boolean }>('school.work_note', { which, ...(chosen ? { solution: chosen.adjustment, ...(chosen.option ? { option: chosen.option } : {}) } : {}) });
    // Said as it measured (from 2026-10-16): a way that moved nothing says so, and isn't called an answer.
    const moved = r.ok && r.value!.before !== undefined ? r.value!.after! - r.value!.before : 0;
    if (r.ok) toast(r.value!.before !== undefined ? `Worked ${chosen?.label.toLowerCase() ?? 'on it'}: ${r.value!.before} to ${r.value!.after}.${Math.abs(moved) < WORKBOOK.evidence ? ' It didn’t move it: worth knowing, and not yet the answer.' : ''}${r.value!.pending ? ' Keep it or put it back, below.' : ' The next call will show it.'}` : 'Worked on: the next call will show it.', 'positive');
  };
  return (
    <div className="col gap-2">
      <div className="row-between"><div className="eyebrow">The Rehearsal Process</div><HowItWorks help="school.learn_part" /></div>
      <div className="grid grid-3">
        <Stat label="Lines" value={pct(p?.lines ?? 0)} note={`You’re asked to be off book ${pct(PROCESS.blockingShare)} of the way through`} />
        <Stat label="Blocking" value={pct(p?.blocking ?? 0)} note={p?.blockingMissed ? `${p.blockingMissed} Missed To Catch Up` : 'Set at the blocking calls'} />
        <Stat label="Growth From A Night" value={`${Math.round(nightFactor(casting) * 100)}%`} note="How much a night would grow your craft, against keeping every call. It doesn’t change the night’s result" />
        {forecast && <Stat label="A Night Now" value={forecast.overall.toFixed(1)} note="A forecast: what a night would come to if it opened now, without good or bad luck" />}
      </div>
      {forecast && workloadWords(forecast) && (
        <div className="small" data-workload="">
          <strong>The Evening’s Workload.</strong> {workloadWords(forecast)}
          {forecast.inputs.piece?.night && <span className="xs dim"> The running time: {forecast.inputs.piece.night.from}.</span>}
        </div>
      )}
      {p?.dress && <div className="small">The dress rehearsal: {DRESS_WORD[p.dress] ?? p.dress}.</div>}
      {p?.together && p.together.n > 0 && <div className="small"><strong>The Nights Together.</strong> With the company, your nights have averaged {Math.round(p.together.sum / p.together.n)} of 100{p.together.slips ? `, ${p.together.slips === 1 ? 'one' : p.together.slips} with a slip by someone else${p.together.covered ? `, ${p.together.covered === p.together.slips ? (p.together.slips === 1 ? 'which you covered' : 'all of which you covered') : `${p.together.covered} of which you covered`}` : ''}` : ''}. How the show goes together changes how a night leaves you feeling, but your own night is your result.</div>}
      {p?.reflection && <div className="small"><strong>Looking Back.</strong> {p.reflection.text} <span className="xs dim">A summary of your run, not the director’s own words.</span></div>}
      {last && (
        <div className="small col gap-1">
          <div className="row-between" style={{ alignItems: 'flex-start' }}>
            <div>
              The director’s last note, {formatDate(last.at, zone())}: {last.text}
              <span className="xs dim"> {noteState(last, 'Not Worked On Yet')}</span>
            </div>
            <HowItWorks help="school.work_note" />
          </div>
          {/* The way by its own label, as the notes so far name it (from 2026-10-13: until then a movement played to a
              side read “Worked play this part another way” here, after the list below had been given the label; found by
              that day’s guide audit). */}
          {last.answer?.solution && <div className="xs">Worked {(last.answer.label ?? ADJUSTMENTS[last.answer.solution as keyof typeof ADJUSTMENTS]?.label ?? last.answer.solution).toLowerCase()}: {last.answer.before} before, {last.answer.after} after{last.answer.now !== undefined ? `; ${last.answer.now} at the next call` : ''}.</div>}
          {/* Shown again once a way is put back (`reworkable`, from 2026-10-12): until then it stayed hidden, and Work On
              The Note worked whatever place was last chosen in the shorter list of the ways left. */}
          {ways.length > 0 && (!last.worked || (p !== undefined && reworkable(p))) && (
            <label className="row gap-2 wrap xs" style={{ alignItems: 'center' }}>
              <span>Ways to work on it:</span>
              <select aria-label="A Way To Work On The Note" value={Math.min(way, ways.length - 1)} onChange={(e) => setWay(Number(e.target.value))}>
                {ways.map((o, i) => <option key={`${o.adjustment}:${o.option ?? ''}`} value={i}>{o.label}</option>)}
              </select>
              <span className="dim">{chosen?.words}</span>
            </label>
          )}
          <div className="xs dim">These notes are simulated: the game’s words, not a real director’s.</div>
        </div>
      )}
      {p && p.notes.length > 1 && <div className="xs dim">{`Notes taken: ${p.notes.filter((n) => n.taken).length} of ${p.notes.filter((n) => n.taken !== undefined).length}.${p.notes.some((n) => n.outcome === 'learned') ? ` Worked and learned from without moving: ${p.notes.filter((n) => n.outcome === 'learned').length}.` : ''}`}</div>}
      {/* The notes before the last, each with what came of it (from 2026-10-13): until then a note's outcome went from
          the screen when the next call gave another, and a player couldn't see whether the note they worked was taken,
          only a count. History, read from the process: it changes nothing. */}
      {p && p.notes.length > 1 && (
        <details className="xs" data-notes="">
          <summary>The Director’s Notes So Far</summary>
          <ol style={{ margin: 'var(--s1) 0 0', paddingLeft: 'var(--s4)' }}>
            {p.notes.slice(0, -1).reverse().map((n) => (
              <li key={n.at} style={{ marginBottom: 'var(--s1)' }}>
                {formatDate(n.at, zone())}: {n.text}{' '}
                <span className="dim">{noteState(n, 'Not Worked On')}</span>
                {n.answer?.solution && <span className="dim">{` · Worked ${(n.answer.label ?? ADJUSTMENTS[n.answer.solution as keyof typeof ADJUSTMENTS]?.label ?? n.answer.solution).toLowerCase()}: ${n.answer.before} before, ${n.answer.after} after${n.answer.now !== undefined ? `, ${n.answer.now} at the next call` : ''}`}</span>}
              </li>
            ))}
          </ol>
        </details>
      )}
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <Gated feature="school.learn_part" className="btn btn-sm btn-ghost" disabled={Boolean(part)} title={part ?? 'An hour on the lines'} onClick={() => { const r = run<{ lines: number }>('school.learn_part', { which }); if (r.ok) toast(`An hour on the part: lines at ${pct(r.value!.lines)}.`, 'positive'); }}>Learn The Part</Gated>
        <Gated feature="school.review_blocking" className="btn btn-sm btn-ghost" disabled={Boolean(blocking)} title={blocking ?? 'An hour with the stage manager’s book'} onClick={() => { const r = run<{ blocking: number }>('school.review_blocking', { which }); if (r.ok) toast(`Caught up from the book: blocking at ${pct(r.value!.blocking)}.`, 'positive'); }}>Catch Up The Blocking</Gated>
        <Gated feature="school.work_note" className="btn btn-sm btn-ghost" disabled={Boolean(noteWhy)} title={noteWhy ?? (chosen ? `${chosen.label}, ${chosen.minutes} minutes` : 'An hour on the director’s note')} onClick={work}>{chosen ? `Work On The Note: ${chosen.label}` : 'Work On The Note'}</Gated>
      </div>
      <WhyNot reasons={[['Learn The Part', part], ['Catch Up The Blocking', blocking], ['Work On The Note', noteWhy]]} />
      {forecast && <Segments e={forecast} caption="The Part Now, Movement By Movement" />}
      {piece && <WorkThrough piece={`part:${which}`} />}
      {materialOf((casting as { play?: string }).play) && <MaterialDemands material={materialOf((casting as { play?: string }).play)!} />}
      {!partPlayingRefusal(sim, person, which) && (
        <PlayingChooser material={materialOf((casting as { play?: string }).play)} current={p?.playing} direction={p?.direction} feature="school.choose_part_playing" help="school.choose_part_playing"
          preview={(c) => partPreview(sim, person, casting as never, c)}
          onChoose={(c) => { const r = run<{ prep: number }>('school.choose_part_playing', { which, ...c }); if (r.ok) toast(`Chosen. You’ve rehearsed this way of playing it to ${pct(r.value!.prep)} so far.`, 'positive'); }} />
      )}
      <Fine>The stages and their order are a rehearsal’s; how far a call or an hour moves the lines and blocking, what a note asks and what answers it, and what they make of a night, are estimated. A night is judged movement by movement: each movement’s blocking, where stamina tells late in the evening, and a slip carried into the next.</Fine>
    </div>
  );
}
