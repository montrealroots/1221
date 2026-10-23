/**
 * SLATE — working a problem through, on screen (from 2026-10-12; `systems/workbook.ts`), and a piece's segments.
 *
 * `WorkThrough` is the process for any piece in progress, by its key (`brief:<id>`, `assignment:<id>`, `part:<which>`):
 * the problems its forecast shows, each with why; the one being worked; the ways at it, each with what it is and its
 * time; a change tried waiting to be kept or put back; the evidence of each try; and the discoveries kept, which every
 * later forecast and performance reads. `Segments` shows a piece judged in its segments: each one's result, its own
 * rehearsal against what it asks, the stamina it costs there, a slip and what it carried, and the continuity read from
 * them. Neither runs anything but the commands on its buttons.
 */

import { useGame, useWorld } from '@/app/game-context';
import { Fine, WhyNot, SectionHead } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { ADJUSTMENTS, WORKBOOK } from '@/engine/content/workbook';
import { PIECE } from '@/engine/content/piece';
import type { Evaluation } from '@/engine/systems/evaluation';
import { discoveriesOf, identifyRefusal, optionsOf, problemsOf, tryRefusal, type Try } from '@/engine/systems/workbook';
import { workPiece } from '@/engine/systems/workpieces';

const pct = (x: number) => `${Math.round(x * 100)}%`;
const TONE: Record<string, string> = { comic: 'Comic', grave: 'Grave', lyric: 'Lyric', grotesque: 'Grotesque' };

/** A piece's segments as the evaluation judged them, and the continuity read from them. */
export function Segments({ e, caption }: { e: Evaluation; caption?: string }) {
  const p = e.piece;
  if (!p || p.segments.length < 2) return null;
  return (
    <div className="col gap-1" data-segments="">
      <div className="eyebrow">{caption ?? 'Part By Part'}</div>
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Part</th><th scope="col">Tone</th><th scope="col" className="num">Result</th><th scope="col" className="num">Its Rehearsal</th><th scope="col">Stamina</th><th scope="col">What Happened</th></tr></thead>
          <tbody>
            {p.segments.map((s) => (
              <tr key={s.label}>
                <td className="nowrap">{s.label}</td>
                <td className="xs">{s.tones.length ? s.tones.map((t) => TONE[t] ?? t).join(' And ') : 'Unknown'}</td>
                <td className="num mono">{s.overall.toFixed(1)}</td>
                <td className="num mono">{pct(s.part)} of {pct(s.required)}</td>
                <td className="xs">{s.drain < 1 ? `Tiring: ${pct(1 - s.drain)} off` : 'Holding'}</td>
                <td className="xs">{s.slip ? `A slip, ${s.slip} under what was expected` : s.shaken !== undefined ? `Shaken by the slip before: ${pct(1 - s.shaken)} off` : s.chief ? `${s.chief.label} cost it most` : 'As expected'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="xs dim" style={{ margin: 0 }}>Continuity, how evenly the character held from part to part: {p.continuity.toFixed(1)}. The whole is the average of the parts; continuity comes from them, and isn’t added to it.</p>
    </div>
  );
}

/** Working a problem through, for a piece in progress. */
export function WorkThrough({ piece: key }: { piece: string }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const piece = useWorld((s) => workPiece(s, s.player, key), [key]);
  if (!piece) return null;
  const book = piece.peek();
  const pending = book?.tries.find((t) => t.verdict === 'pending');
  const problems = problemsOf(piece);
  const current = book?.problem;
  const options = current ? optionsOf(piece, current) : [];
  const discoveries = discoveriesOf(piece);
  const tries = [...(book?.tries ?? [])].reverse().slice(0, 6);
  const name = (t: Try) => `${ADJUSTMENTS[t.adjustment].label}${t.option ? ` (${t.option.split(':')[1]})` : ''}`;
  const trying = (adjustment: string, option?: string) => {
    const r = run<Try>('work.try', { piece: key, adjustment, ...(option ? { option } : {}) });
    if (r.ok) toast(`${name(r.value!)}: ${r.value!.before} to ${r.value!.after}.${r.value!.verdict === 'pending' ? ' Keep it or put it back.' : ''}`, r.value!.after >= r.value!.before ? 'positive' : 'neutral');
  };
  return (
    <div className="col gap-2" data-workbook={key}>
      <SectionHead title="Work It Through" help="work.try" />
      {pending ? (
        <div className="callout small">
          <strong>{name(pending)}</strong>, tried on “{pending.label}”: {pending.before} before, {pending.after} after.{' '}
          <Gated feature="work.settle" className="btn btn-sm btn-primary" onClick={() => { if (run('work.settle', { piece: key, keep: true }).ok) toast('Kept. Everything from now on includes it.', 'positive'); }}>Keep It</Gated>{' '}
          <Gated feature="work.settle" className="btn btn-sm" onClick={() => { if (run('work.settle', { piece: key, keep: false }).ok) toast('Put back as it was. It won’t be offered for this again.', 'neutral'); }}>Put It Back</Gated>
        </div>
      ) : current ? (
        <div className="col gap-1">
          <p className="small" style={{ margin: 0 }}><strong>Working On: {current.label}.</strong> {current.why}</p>
          {options.length ? (
            <ul className="small" style={{ margin: 0, paddingLeft: 'var(--s4)' }}>
              {options.map((o) => {
                const no = tryRefusal(sim, person, piece, o.adjustment, o.option);
                return (
                  <li key={`${o.adjustment}:${o.option ?? ''}`} style={{ marginBottom: 'var(--s1)' }}>
                    <Gated feature="work.try" className="btn btn-sm" disabled={Boolean(no)} title={no ?? o.words} onClick={() => trying(o.adjustment, o.option)}>{`${o.label} (${o.minutes} Min)`}</Gated>{' '}
                    <span className="xs dim">{o.words}{ADJUSTMENTS[o.adjustment].kind === 'choice' ? ' You keep it or put it back.' : ''}</span>
                  </li>
                );
              })}
            </ul>
          ) : <p className="xs dim" style={{ margin: 0 }}>There’s no way left to work on it here: its own preparation step works on it, or the ways you tried were put back.</p>}
          <WhyNot reasons={options.map((o) => [o.label, tryRefusal(sim, person, piece, o.adjustment, o.option)] as const)} />
        </div>
      ) : null}
      {!pending && (
        problems.length ? (
          <div className="col gap-1">
            <p className="xs dim" style={{ margin: 0 }}>{current ? 'Or pick another problem:' : 'What the forecast shows, worst first. Pick one to work on:'}</p>
            <ul className="small" style={{ margin: 0, paddingLeft: 'var(--s4)' }}>
              {problems.filter((p) => p.id !== current?.id).map((p) => {
                const no = identifyRefusal(piece, p.id);
                return (
                  <li key={p.id} style={{ marginBottom: 'var(--s1)' }}>
                    <Gated feature="work.identify" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no ?? p.why} onClick={() => run('work.identify', { piece: key, problem: p.id })}>{p.label}</Gated>{' '}
                    <span className="xs dim">{p.why}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : <p className="xs dim" style={{ margin: 0 }}>The forecast shows nothing to work through: every part of it is where it needs to be.</p>
      )}
      {tries.length > 0 && (
        <div className="table-scroll">
          <table data-tries="">
            <thead><tr><th scope="col">Tried</th><th scope="col">For</th><th scope="col" className="num">Before</th><th scope="col" className="num">After</th><th scope="col">Kept</th></tr></thead>
            <tbody>{tries.map((t, i) => <tr key={`${t.at}-${i}`}><td className="xs">{name(t)}</td><td className="xs">{t.label}</td><td className="num mono">{t.before}</td><td className="num mono">{t.after}</td><td className="xs">{t.verdict === 'kept' ? 'Kept' : t.verdict === 'revised' ? 'Put back' : 'Waiting'}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      {discoveries.length > 0 && (
        <div className="col gap-1">
          <div className="eyebrow">What You’ve Found</div>
          <ul className="xs" style={{ margin: 0 }}>{discoveries.map((d) => <li key={d}>{d}</li>)}</ul>
        </div>
      )}
      <Fine>Problems come from the piece’s own forecast, its expected result without luck, so the same way tried on the same day shows the same result. A way of playing part of it, or places to breathe, is kept or put back; work done is kept. Working a part slowly moves its own rehearsal by {pct(WORKBOOK.workGain)} of what’s left, and a part a turn leads into asks up to {pct(PIECE.brief.perTurn)} more of a brief’s rehearsal. The sizes are estimated.</Fine>
    </div>
  );
}
