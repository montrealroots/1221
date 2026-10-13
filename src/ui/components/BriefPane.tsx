/**
 * SLATE — a genre's practice brief, worked through (from 2026-10-12; `systems/briefs.ts`): what the scene is, what it
 * asks and how far you stand against it, its preparation, the reading and the way you'll play it, the take, and what the
 * record makes of it. Everything a take will read is on the screen before it's taped: the forecast is the evaluation's
 * own expected result with today's preparation and condition, and each refusal is on its button.
 */

import { useState, type ReactNode } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Fine, Stat, WhyNot } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { MaterialDemands, PlayingChooser } from '@/ui/components/PlayingChooser';
import { formatDate } from '@/engine/core/time';
import { ABILITY_DEFS, MASTERED, TECHNIQUE_LABEL, type AbilityId } from '@/engine/content/abilities';
import type { Axis } from '@/engine/content/material';
import { briefsOf } from '@/engine/content/briefs';
import { GENRE_BY_ID } from '@/engine/content/film-genres';
import { DIMENSION_LABEL, TASK_PROFILES } from '@/engine/content/tasks';
import { abilityFull, abilityOf } from '@/engine/systems/attributes';
import { bandOfQuality, chiefLimit, replay } from '@/engine/systems/evaluation';
import { BAND_LABEL } from '@/engine/systems/coursework';
import { BRIEF, PURPOSE_WORDS, READER_PLAYS, asksOf, briefsRead, genreKnown, briefMaterial, forecast, prepareRefusal, preview, purposeOf, readerRefusal, readingOf, requiredOf, stepMinutes, suggestions, tapeRefusal, turnsOf, type BriefStep } from '@/engine/systems/briefs';
import { PIECE } from '@/engine/content/piece';
import { Segments, WorkThrough } from '@/ui/components/WorkThrough';
import { HowItWorks } from '@/ui/guide/HowItWorks';
import { studyRefusal } from '@/engine/systems/engagement';
import { exerciseFor } from '@/engine/content/practice';
import { matchedTier } from '@/engine/systems/practice';
import { practicedDaysAgo, recommendations } from '@/engine/systems/experience';
import { identityOf } from '@/engine/systems/artistry';
import { levelOf } from '@/engine/systems/attributes';

const TONE: Record<string, string> = { comic: 'Comic', grave: 'Grave', lyric: 'Lyric', grotesque: 'Grotesque' };

/**
 * Who reads opposite you (from 2026-10-12, `brief.reader`): a recording of the other lines, or a classmate, who learns it
 * as you rehearse it on your feet together. Your own take reads none of it; the take with the reader is what a casting
 * office would see.
 */
function ReaderChoice({ b }: { b: import('@/engine/content/briefs').Brief }) {
  const { run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const rec = person.briefs?.[b.id];
  const mates = person.school?.classmates ?? [];
  const current = rec?.reader ? String(rec.reader.mate) : 'alone';
  const [draft, setDraft] = useState(current);
  const no = readerRefusal(person, b, draft === 'alone' ? 'alone' : Number(draft));
  return (
    <div className="col gap-1">
      <div className="row-between"><div className="eyebrow">Read With</div><HowItWorks help="brief.reader" /></div>
      <div className="row gap-2 wrap">
        <select aria-label="Who Reads Opposite You" value={draft} onChange={(e) => setDraft(e.target.value)}>
          <option value="alone">A Recording Of The Other Lines</option>
          {mates.map((m, i) => <option key={m.name} value={String(i)}>{m.name}</option>)}
        </select>
        <Gated feature="brief.reader" className="btn btn-sm" disabled={draft === current || Boolean(no)} title={no ?? 'Who reads opposite you'} onClick={() => { const r = run<{ reader: string }>('brief.reader', { brief: b.id, mate: draft === 'alone' ? 'alone' : Number(draft) }); if (r.ok) toast(`Reading with ${r.value!.reader}.`, 'positive'); }}>Read With Them</Gated>
      </div>
      {no && <p className="xs dim" style={{ margin: 0 }}>{no}</p>}
      <p className="xs dim" style={{ margin: 0 }}>{rec?.reader && mates[rec.reader.mate] ? `${mates[rec.reader.mate]!.name} has it ${pct(rec.reader.prep)} prepared with you: Rehearse It On Your Feet brings them along, and so does running it with them.` : `A recording answers on cue and never slips, but it can’t listen.`}</p>
    </div>
  );
}
const pct = (x: number) => `${Math.round(x * 100)}%`;
const isAbility = (id: string) => ABILITY_DEFS.some((d) => d.id === id);

/**
 * What an hour and a half of study says, here and on the Player Profile: the work studied and the familiarity it came
 * to (from 2026-10-12: until then Study It and Study The Genre said nothing, the work studied, `study`'s `with`, was read
 * by nothing, and here a study that left familiarity under practice changed nothing on the screen).
 */
export const studiedWords = (genre: string, r: { familiarity: number; with: string }) => `${GENRE_BY_ID[genre]?.label ?? genre}: an hour and a half with ${r.with}. Familiarity ${r.familiarity.toFixed(1)} of 100.`;

/**
 * How the reader plays the other part, in words (from 2026-10-12, `READER_PLAYS`): its label, and what playing against
 * it asks, the dimensions it leans and the abilities it draws on. Until then the take leaned on it and the scene didn't
 * say, and `READER_PLAYS`' labels were read by nothing.
 */
export function readerPlaysWords(b: import('@/engine/content/briefs').Brief): string | undefined {
  if (b.medium === 'voice') return undefined;
  const plays = READER_PLAYS[b.readerPlays ?? 'steady'];
  const leans = (Object.keys(plays.lean) as (keyof typeof DIMENSION_LABEL)[]).map((d) => DIMENSION_LABEL[d].toLowerCase());
  const draws = [...new Set(Object.values(plays.inputs).flatMap((xs) => (xs ?? []).map((x) => ABILITY_DEFS.find((d) => d.id === x.ability)?.label.toLowerCase() ?? x.ability)))];
  const and = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0] ?? '');
  if (!leans.length && !draws.length) return `${plays.label}: playing against it asks nothing past the scene’s own.`;
  return `${plays.label}: playing against it, the take weighs ${and(leans)} more${draws.length ? `, and draws on your ${and(draws)}` : ''}.`;
}

/**
 * A brief's pane for a genre: `practice` renders the way to train an ability or technique, as the profile does. `brief`
 * opens it at one brief of the genre, as a suggestion names one (from 2026-10-12; until then a suggestion opened the
 * genre at its first brief, whichever it named).
 */
export function BriefPane({ genre, brief, onOpen, practice }: { genre: string; brief?: string; onOpen: (genre: string, brief?: string) => void; practice: (id: string) => ReactNode }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const briefs = briefsOf(genre);
  const [which, setWhich] = useState(() => Math.max(0, briefs.findIndex((x) => x.id === brief)));
  const b = briefs[Math.min(which, briefs.length - 1)];
  const rec = b ? person.briefs?.[b.id] : undefined;
  const [reading, setReading] = useState<string | undefined>(rec?.reading);
  if (!b) return <p className="small">No brief has been written for {GENRE_BY_ID[genre]?.label ?? genre} yet.</p>;
  const draftReading = reading ?? rec?.reading ?? b.readings[0]!.id;
  const material = briefMaterial(b);
  const req = requiredOf(b);
  const turns = turnsOf(b);
  const known = genreKnown(person, b);
  const prep = rec?.prep ?? { interpretation: 0, memorization: 0, rehearsal: 0 };
  const now = forecast(sim, person, b);
  const purpose = rec?.reading ? purposeOf(rec, now.overall) : undefined;
  const tape = tapeRefusal(sim, person, genre, b);
  const last = rec?.takes.at(-1);
  const lastWork = last ? [...(person.work ?? [])].reverse().find((w) => w.inputs.key === last.key) : undefined;
  // The last take worked out again from what it kept, for its beats: one kept under other rules isn't.
  const lastEval = lastWork && TASK_PROFILES[lastWork.task] ? replay(lastWork, TASK_PROFILES[lastWork.task]!) : undefined;
  const levelLabel = (id: string) => (isAbility(id) ? `${ABILITY_DEFS.find((d) => d.id === id)!.label} ${Math.round(abilityOf(sim, person, id as AbilityId))}` : `${TECHNIQUE_LABEL[id as keyof typeof TECHNIQUE_LABEL] ?? id} ${Math.round(person.craft?.[id as keyof typeof TECHNIQUE_LABEL] ?? 0)} of ${MASTERED}`);
  // What To Work On as the Player Profile reads it (from 2026-10-12): the days since each exercise, for the focus, and
  // the weakness the work so far keeps coming back to (`Identity.recurring`), said with its pieces and first within half
  // a point of the top. Until then the pane passed neither, so the same weakness read "Steady to begin" here and
  // "Spaced" on the Profile, and the identity reached only the suggestions below.
  const identity = identityOf(person);
  const recs = recommendations((id) => levelOf(sim, person, id as never), (id) => (isAbility(id) ? abilityFull(sim, person, id as AbilityId) : MASTERED), person.work ?? [], (id) => exerciseFor(id as never), matchedTier, 12, practicedDaysAgo(person, sim.now, sim.homeZone), identity.recurring);
  // An ability or technique only (from 2026-10-12: until then only a preparation was passed over, so a day's condition
  // or a fit could be named the weakness, with a brief suggested for it at 0% of the work and practice offered for it).
  const top = recs.find((r) => !r.target.includes(':'));
  const ideas = suggestions(person, top ? { target: top.target, label: top.label, level: levelOf(sim, person, top.target as never), full: isAbility(top.target) ? abilityFull(sim, person, top.target as AbilityId) : MASTERED } : undefined, identity).filter((s) => s.brief !== b.id);
  // A technique no brief reads (audition, cold reading, script analysis) is suggested no brief, and said so here (from
  // 2026-10-12: until then a brief was suggested for it "(0% of the work)").
  const unread = top && !briefsRead(person, top.target);
  const step = (s: BriefStep) => {
    const r = run<{ moved: number; minutes: number }>('brief.prepare', { brief: b.id, step: s });
    if (r.ok) toast(`${BRIEF.steps[s].label}: ${r.value!.minutes} minutes, ${pct(r.value!.moved)} further.`, 'positive');
  };
  const study = studyRefusal(sim, person, genre);
  const plays = readerPlaysWords(b);
  return (
    <div className="col gap-3" data-brief={b.id}>
      <div className="row gap-2 wrap" style={{ alignItems: 'baseline' }}>
        <h3 style={{ margin: 0 }}>{b.title}</h3>
        <span className="xs dim">A practice brief for {b.kinds.map((g) => GENRE_BY_ID[g]?.label ?? g).join(', ')}: an original scene written for SLATE, {b.medium === 'voice' ? 'recorded alone at a microphone' : 'taped to a reader off camera'}.</span>
        {briefs.length > 1 && (
          <select aria-label="Which Brief" value={which} onChange={(e) => { setWhich(Number(e.target.value)); setReading(undefined); }}>
            {briefs.map((x, i) => <option key={x.id} value={i}>{x.title}</option>)}
          </select>
        )}
      </div>
      <p className="small" style={{ margin: 0 }}>{b.logline}</p>

      <div className="col gap-1">
        <div className="eyebrow">The Scene</div>
        <dl className="small" style={{ margin: 0 }}>
          <dt>Where And When</dt><dd>{b.circumstances}</dd>
          <dt>The Two Of You</dt><dd>{b.relationship}</dd>
          <dt>You Play</dt><dd>{b.you}</dd>
          <dt>{b.medium === 'voice' ? 'You Speak To' : 'The Reader Plays'}</dt><dd>{b.reader}</dd>
          {plays && <><dt>How They Play It</dt><dd>{plays}</dd></>}
          <dt>What You Want</dt><dd>{b.objective}</dd>
          <dt>What’s In The Way</dt><dd>{b.obstacle}</dd>
        </dl>
        <div className="eyebrow">Where It Turns</div>
        <ol className="small" style={{ margin: 0 }}>
          {b.beats.map((beat, i) => <li key={i}>{beat.what} <span className="xs dim">({beat.tones.map((t) => TONE[t]).join(' and ')}{beat.tones.length > 1 ? ', held at once' : ''})</span></li>)}
        </ol>
        <p className="xs dim" style={{ margin: 0 }}>{turns.transitions} change{turns.transitions === 1 ? '' : 's'} of tone between beats and {turns.blends} beat{turns.blends === 1 ? '' : 's'} held two ways. Rehearsal counts complete at {pct(req.rehearsal!)} in a beat, and at up to {pct(PIECE.brief.perTurn)} more in a beat a change leads into, {pct(PIECE.brief.perBlend)} more in one held two ways. {b.why.beats}</p>
      </div>

      <MaterialDemands material={material} />

      <div className="col gap-1">
        <div className="eyebrow">What The Take Weighs, Read This Way</div>
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Dimension</th><th scope="col" className="num">Share</th><th scope="col">What It Reads, Yours Now</th></tr></thead>
            <tbody>
              {asksOf(person, b, draftReading).map((a) => (
                <tr key={a.dimension}><td className="nowrap">{a.label}</td><td className="num mono">{pct(a.share)}</td><td className="xs">{a.reads.map(levelLabel).join(', ')}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col gap-1">
        <div className="row-between"><div className="eyebrow">Preparation</div><HowItWorks help="brief.prepare" /></div>
        <div className="grid grid-3">
          <Stat label="The Breakdown" value={`${pct(prep.interpretation)} of ${pct(req.interpretation!)}`} />
          <Stat label="The Lines" value={`${pct(prep.memorization)} of ${pct(req.memorization!)}`} />
          <Stat label="Rehearsal" value={`${pct(prep.rehearsal)} of ${pct(req.rehearsal!)}`} note="More in a beat a change leads into: part by part below" />
          <Stat label="Knowing The Genre" value={`${pct(known)} of ${pct(req.genre!)}`} note="Studied, or worked in: the better of the two" />
        </div>
        <div className="row gap-2 wrap">
          {(['read', 'lines', 'rehearse'] as BriefStep[]).map((s) => {
            const no = prepareRefusal(sim, person, b, s);
            return <Gated key={s} feature="brief.prepare" className="btn btn-sm" disabled={Boolean(no)} title={no ?? BRIEF.steps[s].what} onClick={() => step(s)}>{`${BRIEF.steps[s].label} (${stepMinutes(b, s)} Min)`}</Gated>;
          })}
          <Gated feature="genre.study" className="btn btn-sm btn-ghost" disabled={Boolean(study)} title={study ?? 'An hour and a half with a work of the kind'} onClick={() => { const r = run<{ familiarity: number; with: string }>('genre.study', { genre }); if (r.ok) toast(studiedWords(genre, r.value!), 'positive'); }}>Study The Genre</Gated>
          <HowItWorks help="genre.study" label="How Genres Work" />
        </div>
        <WhyNot reasons={(['read', 'lines', 'rehearse'] as BriefStep[]).map((s) => [BRIEF.steps[s].label, prepareRefusal(sim, person, b, s)] as const)} />
      </div>

      <div className="col gap-1">
        <div className="row-between"><div className="eyebrow">Your Reading</div><HowItWorks help="brief.choose" /></div>
        {b.readings.map((r) => {
          const full = preview(sim, person, b, r.id, { ...(rec?.playing?.pace ? { pace: rec.playing.pace } : {}), ...(rec?.playing?.scale ? { scale: rec.playing.scale } : {}), ...(rec?.playing?.structure ? { structure: rec.playing.structure } : {}) }).overall;
          return (
            <label key={r.id} className="row gap-1" style={{ alignItems: 'flex-start' }}>
              <input type="radio" name={`reading-${b.id}`} checked={draftReading === r.id} onChange={() => setReading(r.id)} />
              <span className="small"><strong>{r.label}</strong>{rec?.reading === r.id ? ', Chosen' : ''}. {r.reading} <span className="xs dim">It rests on: {r.rests} Fully prepared, it would come to {full.toFixed(1)} for you now.</span></span>
            </label>
          );
        })}
        <div>
          <Gated feature="brief.choose" className="btn btn-sm" disabled={rec?.reading === draftReading} onClick={() => { const r = run<{ interpretation: number; readingChanged: boolean }>('brief.choose', { brief: b.id, reading: draftReading, ...(rec?.playing ? { pace: rec.playing.pace, scale: rec.playing.scale, structure: rec.playing.structure } : {}) }); if (r.ok) toast(`Reading it as ${readingOf(b, draftReading)!.label}.${r.value!.readingChanged ? ` The breakdown keeps ${pct(BRIEF.readingKept)} of what it was: ${pct(r.value!.interpretation)} now.` : ''}`, 'positive'); }}>{rec?.reading ? 'Change The Reading' : 'Read It This Way'}</Gated>
        </div>
        <Fine>Every reading here is one the brief supports; none is the right answer. A reading leans what the take counts for and draws on different abilities, and moves weight without adding any. Changing it keeps {pct(BRIEF.readingKept)} of the breakdown.</Fine>
      </div>

      {rec?.callback && <p className="small" style={{ margin: 0 }}><strong>A Callback.</strong> {rec.callback.why} It’s pitched harder than a first take.</p>}
      {rec?.reading && (
        <PlayingChooser material={material} current={rec.playing} direction={rec.callback ? { [rec.callback.axis]: rec.callback.side } as Partial<Record<Axis, typeof rec.callback.side>> : undefined} feature="brief.choose" preview={(c) => preview(sim, person, b, rec.reading!, c)} onChoose={(c) => { const r = run('brief.choose', { brief: b.id, reading: rec.reading, ...c }); if (r.ok) toast('Chosen: rehearse it in on your feet.', 'positive'); }} />
      )}

      {b.medium !== 'voice' && <ReaderChoice b={b} />}

      <div className="col gap-1">
        <div className="row-between"><div className="eyebrow">The Take</div><HowItWorks help="practice.self_tape" /></div>
        <p className="small" style={{ margin: 0 }}>
          {rec?.reading ? <>Taped now, with today’s preparation and condition, it would come to about <strong>{now.overall.toFixed(1)}</strong> ({BAND_LABEL[bandOfQuality(now.overall)]}). {chiefLimit(now) ? `${chiefLimit(now)}.` : 'Every part of it is where the take asks.'} {purpose ? PURPOSE_WORDS[purpose] : ''}</> : 'Choose a reading first.'}
        </p>
        <div>
          <Gated feature="practice.self_tape" className="btn btn-sm" disabled={Boolean(tape)} title={tape ?? `An hour: ${b.title}, ${readingOf(b, rec?.reading)?.label ?? ''}`} onClick={() => { const r = run<{ overall: number; purpose: string; band: string }>('practice.self_tape', { genre, brief: b.id }); if (r.ok) toast(`Taped: ${r.value!.overall.toFixed(1)}, ${BAND_LABEL[r.value!.band as keyof typeof BAND_LABEL]}.`, 'positive'); }}>Tape It (60 Min)</Gated>
        </div>
        {tape && <p className="xs dim" style={{ margin: 0 }}>{tape}</p>}
        {rec?.reading && <Segments e={now} caption="Beat By Beat, Taped Now" />}
      </div>

      {rec?.reading && <WorkThrough piece={`brief:${b.id}`} />}

      {last && (
        <div className="col gap-1">
          <div className="eyebrow">The Last Take, {formatDate(last.at, sim.zone)}</div>
          <p className="small" style={{ margin: 0 }}><strong>{last.overall.toFixed(1)}</strong>, {BAND_LABEL[last.band as keyof typeof BAND_LABEL]}: {readingOf(b, last.reading)?.label}{last.sides.length ? `, played ${last.sides.join(' and ')}` : ''}. {PURPOSE_WORDS[last.purpose]} {last.chief ? `${last.chief}.` : ''}{last.callback ? (last.answered ? ' The callback’s note was answered.' : ' Played against the callback’s note: the callback is still yours.') : ''}</p>
          {last.together && <p className="small" style={{ margin: 0 }}><strong>With {last.together.reader}.</strong> {last.together.words} A casting office sees the take with its reader: that’s what a callback reads.</p>}
          {lastEval && <Segments e={lastEval} caption="The Last Take, Beat By Beat" />}
          {lastWork && (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Dimension</th><th scope="col" className="num">Result</th></tr></thead>
                <tbody>{Object.entries(lastWork.dims).map(([d, q]) => <tr key={d}><td>{DIMENSION_LABEL[d as keyof typeof DIMENSION_LABEL]}</td><td className="num mono">{(q ?? 0).toFixed(1)}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          {lastWork && lastWork.limits.length > 0 && <ul className="xs" style={{ margin: 0 }}>{lastWork.limits.map((l, i) => <li key={i}>{l.label}: {l.by} points of the {DIMENSION_LABEL[l.dimension].toLowerCase()}</li>)}</ul>}
        </div>
      )}

      {top && (
        <div className="col gap-1">
          <div className="eyebrow">What To Work On</div>
          <p className="small" style={{ margin: 0 }}><strong>{top.label}</strong>. {top.why}{top.recurring && <> <span className="xs dim">From your work for life: {top.recurring.evidence.join('; ')}; it last held a piece back on {formatDate(top.recurring.last, sim.zone)}.</span></>}</p>
          {unread && <p className="xs dim" style={{ margin: 0 }}>No practice brief reads {top.label.toLowerCase()}, so a take won’t show it and none is suggested for it.</p>}
          <div>{practice(top.target)}</div>
        </div>
      )}
      {ideas.length > 0 && (
        <div className="col gap-1">
          <div className="eyebrow">Where It Would Show Next</div>
          <ul className="small" style={{ margin: 0 }}>{ideas.map((s) => <li key={s.brief}>{s.why} <button type="button" className="btn btn-sm btn-ghost" onClick={() => onOpen(s.genre, s.brief)}>{`Open ${GENRE_BY_ID[s.genre]?.label ?? s.genre}`}</button></li>)}</ul>
        </div>
      )}

      {rec && rec.takes.length > 0 && (
        <div className="col gap-1">
          <div className="eyebrow">Your Takes Of It</div>
          <div className="table-scroll">
            <table data-takes="">
              <thead><tr><th scope="col">When</th><th scope="col">Reading</th><th scope="col">Played</th><th scope="col">For</th><th scope="col" className="num">Result</th><th scope="col">Held Back Most By</th></tr></thead>
              <tbody>
                {[...rec.takes].reverse().map((t) => (
                  <tr key={t.key}><td className="nowrap">{formatDate(t.at, sim.zone)}</td><td>{readingOf(b, t.reading)?.label}</td><td className="xs">{t.sides.length ? t.sides.join(', ') : 'Left open'}{t.callback ? ', a callback' : ''}</td><td className="xs">{PURPOSE_WORDS[t.purpose]}</td><td className="num mono">{t.overall.toFixed(1)}</td><td className="xs">{t.chief ?? 'Nothing'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Fine>A brief’s preparation is the breakdown, the lines and rehearsal on your feet, each step going further the less is left and half as far again the same day; a beat a change of tone leads into asks more rehearsal than the rest. A take is judged beat by beat (each beat’s rehearsal, where stamina tells, a slip and its recovery), and the take is the beats’ mean. A Strong take with its reader earns a callback: a harder pitch, with a note on how to play it said before you tape, answered only by a take played that way. The sizes are SLATE’s design; the shape of a breakdown (where and when, the relationship, what you want, what’s in the way, where it turns) is the acting texts’.</Fine>
    </div>
  );
}
