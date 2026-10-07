/**
 * A casting's rehearsal process on the School's casting tab
 * (`systems/production.ts`, from 2026-10-07): the part's lines and blocking,
 * blocking missed, the director's notes and whether each was taken, the dress
 * rehearsal's reading, and what it all makes of a night; and the actor's own
 * work on the part between calls.
 */

import { useGame, useWorld } from '@/app/game-context';
import { Stat, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatDate } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { YALE_DRAMA } from '@/engine/content/school';
import { PROCESS, hasProcess, nightFactor, ownWorkRefusal, type Holder, type Which } from '@/engine/systems/production';

const zone = () => CITIES.require(YALE_DRAMA.cityId).timeZone;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const DRESS_WORD: Record<string, string> = { off: 'An Off Run', solid: 'Solid', strong: 'Strong', remarkable: 'Remarkable' };

export function RehearsalProcess({ casting, which }: { casting: Holder; which: Which }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const p = hasProcess(casting) ? casting.process : undefined;
  const part = ownWorkRefusal(sim, person, which, 'part');
  const blocking = ownWorkRefusal(sim, person, which, 'blocking');
  const note = ownWorkRefusal(sim, person, which, 'note');
  const last = p?.notes.at(-1);
  return (
    <div className="col gap-2">
      <div className="eyebrow">The Rehearsal Process</div>
      <div className="grid grid-3">
        <Stat label="Lines" value={pct(p?.lines ?? 0)} note={`Asked off book ${pct(PROCESS.blockingShare)} of the way through`} />
        <Stat label="Blocking" value={pct(p?.blocking ?? 0)} note={p?.blockingMissed ? `${p.blockingMissed} Missed To Catch Up` : 'Set at the blocking calls'} />
        <Stat label="A Night’s Readiness" value={`${Math.round(nightFactor(casting) * 100)}%`} note="Were it opening now: every call kept, and no more, makes 100%" />
      </div>
      {p?.dress && <div className="small">The dress rehearsal: {DRESS_WORD[p.dress] ?? p.dress}.</div>}
      {p?.reflection && <div className="small"><strong>Looking Back.</strong> {p.reflection.text} <span className="xs dim">Simulated: the game’s reading of the process.</span></div>}
      {last && (
        <div className="small">
          The director’s last note, {formatDate(last.at, zone())}: {last.text}
          <span className="xs dim"> {last.taken === undefined ? (last.worked ? '· Worked On' : '· Not Worked On Yet') : last.taken ? '· Taken' : '· Not Taken'}</span>
          <div className="xs dim">Simulated notes: the game’s words, not a director’s.</div>
        </div>
      )}
      {p && p.notes.length > 1 && <div className="xs dim">{`Notes taken: ${p.notes.filter((n) => n.taken).length} of ${p.notes.filter((n) => n.taken !== undefined).length}.`}</div>}
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <Gated feature="school.learn_part" className="btn btn-sm btn-ghost" disabled={Boolean(part)} title={part ?? 'An hour on the lines'} onClick={() => { const r = run<{ lines: number }>('school.learn_part', { which }); if (r.ok) toast(`An hour on the part: lines at ${pct(r.value!.lines)}.`, 'positive'); }}>Learn The Part</Gated>
        <Gated feature="school.review_blocking" className="btn btn-sm btn-ghost" disabled={Boolean(blocking)} title={blocking ?? 'An hour with the stage manager’s book'} onClick={() => { const r = run<{ blocking: number }>('school.review_blocking', { which }); if (r.ok) toast(`Caught up from the book: blocking at ${pct(r.value!.blocking)}.`, 'positive'); }}>Catch Up The Blocking</Gated>
        <Gated feature="school.work_note" className="btn btn-sm btn-ghost" disabled={Boolean(note)} title={note ?? 'An hour on the director’s note'} onClick={() => { if (run('school.work_note', { which }).ok) toast('Worked on: the next call will show it.', 'positive'); }}>Work On The Note</Gated>
      </div>
      <Fine>The stages and their order are a rehearsal’s; how far a call or an hour moves the lines and blocking, and what they make of a night, are SLATE’s estimate.</Fine>
    </div>
  );
}
