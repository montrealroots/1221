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
import { DIMENSION_LABEL } from '@/engine/content/tasks';
import { abilityFull, abilityOf } from '@/engine/systems/attributes';
import { bandOfQuality, chiefLimit } from '@/engine/systems/evaluation';
import { BAND_LABEL } from '@/engine/systems/coursework';
import { BRIEF, PURPOSE_WORDS, asksOf, briefMaterial, forecast, prepareRefusal, preview, purposeOf, readingOf, requiredOf, stepMinutes, suggestions, tapeRefusal, turnsOf, type BriefStep } from '@/engine/systems/briefs';
import { studyRefusal } from '@/engine/systems/engagement';
import { exerciseFor } from '@/engine/content/practice';
import { matchedTier } from '@/engine/systems/practice';
import { recommendations } from '@/engine/systems/experience';
import { levelOf } from '@/engine/systems/attributes';

const TONE: Record<string, string> = { comic: 'Comic', grave: 'Grave', lyric: 'Lyric', grotesque: 'Grotesque' };
const pct = (x: number) => `${Math.round(x * 100)}%`;
const isAbility = (id: string) => ABILITY_DEFS.some((d) => d.id === id);

/** A brief's pane for a genre: `practice` renders the way to train an ability or technique, as the profile does. */
export function BriefPane({ genre, onOpen, practice }: { genre: string; onOpen: (genre: string) => void; practice: (id: string) => ReactNode }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const briefs = briefsOf(genre);
  const [which, setWhich] = useState(0);
  const b = briefs[Math.min(which, briefs.length - 1)];
  const rec = b ? person.briefs?.[b.id] : undefined;
  const [reading, setReading] = useState<string | undefined>(rec?.reading);
  if (!b) return <p className="small">No brief has been written for {GENRE_BY_ID[genre]?.label ?? genre} yet.</p>;
  const draftReading = reading ?? rec?.reading ?? b.readings[0]!.id;
  const material = briefMaterial(b);
  const req = requiredOf(b);
  const turns = turnsOf(b);
  const known = Math.max(0, ...b.kinds.map((g) => person.engagement?.byGenre[g]?.familiarity ?? 0)) / 100;
  const prep = rec?.prep ?? { interpretation: 0, memorization: 0, rehearsal: 0 };
  const now = forecast(sim, person, b);
  const purpose = rec?.reading ? purposeOf(rec, now.overall) : undefined;
  const tape = tapeRefusal(sim, person, genre, b);
  const last = rec?.takes.at(-1);
  const lastWork = last ? [...(person.work ?? [])].reverse().find((w) => w.inputs.key === last.key) : undefined;
  const levelLabel = (id: string) => (isAbility(id) ? `${ABILITY_DEFS.find((d) => d.id === id)!.label} ${Math.round(abilityOf(sim, person, id as AbilityId))}` : `${TECHNIQUE_LABEL[id as keyof typeof TECHNIQUE_LABEL] ?? id} ${Math.round(person.craft?.[id as keyof typeof TECHNIQUE_LABEL] ?? 0)} of ${MASTERED}`);
  const recs = recommendations((id) => levelOf(sim, person, id as never), (id) => (isAbility(id) ? abilityFull(sim, person, id as AbilityId) : MASTERED), person.work ?? [], (id) => exerciseFor(id as never), matchedTier);
  const top = recs.find((r) => !r.target.startsWith('prep:'));
  const ideas = suggestions(person, top ? { target: top.target, label: top.label, level: levelOf(sim, person, top.target as never), full: isAbility(top.target) ? abilityFull(sim, person, top.target as AbilityId) : MASTERED } : undefined).filter((s) => s.brief !== b.id);
  const step = (s: BriefStep) => {
    const r = run<{ moved: number; minutes: number }>('brief.prepare', { brief: b.id, step: s });
    if (r.ok) toast(`${BRIEF.steps[s].label}: ${r.value!.minutes} minutes, ${pct(r.value!.moved)} further.`, 'positive');
  };
  const study = studyRefusal(sim, person, genre);
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
          <dt>What You Want</dt><dd>{b.objective}</dd>
          <dt>What’s In The Way</dt><dd>{b.obstacle}</dd>
        </dl>
        <div className="eyebrow">Where It Turns</div>
        <ol className="small" style={{ margin: 0 }}>
          {b.beats.map((beat, i) => <li key={i}>{beat.what} <span className="xs dim">({beat.tones.map((t) => TONE[t]).join(' and ')}{beat.tones.length > 1 ? ', held at once' : ''})</span></li>)}
        </ol>
        <p className="xs dim" style={{ margin: 0 }}>{turns.transitions} change{turns.transitions === 1 ? '' : 's'} of tone between beats and {turns.blends} beat{turns.blends === 1 ? '' : 's'} held two ways: rehearsal counts complete at {pct(req.rehearsal!)}. {b.why.beats}</p>
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
        <div className="eyebrow">Preparation</div>
        <div className="grid grid-3">
          <Stat label="The Breakdown" value={`${pct(prep.interpretation)} of ${pct(req.interpretation!)}`} />
          <Stat label="The Lines" value={`${pct(prep.memorization)} of ${pct(req.memorization!)}`} />
          <Stat label="Rehearsal" value={`${pct(prep.rehearsal)} of ${pct(req.rehearsal!)}`} />
          <Stat label="Knowing The Genre" value={`${pct(known)} of ${pct(req.genre!)}`} note="Study It builds it" />
        </div>
        <div className="row gap-2 wrap">
          {(['read', 'lines', 'rehearse'] as BriefStep[]).map((s) => {
            const no = prepareRefusal(sim, person, b, s);
            return <Gated key={s} feature="brief.prepare" className="btn btn-sm" disabled={Boolean(no)} title={no ?? BRIEF.steps[s].what} onClick={() => step(s)}>{`${BRIEF.steps[s].label} (${stepMinutes(b, s)} Min)`}</Gated>;
          })}
          <Gated feature="genre.study" className="btn btn-sm btn-ghost" disabled={Boolean(study)} title={study ?? 'An hour and a half with a work of the kind'} onClick={() => run('genre.study', { genre })}>Study The Genre</Gated>
        </div>
        <WhyNot reasons={(['read', 'lines', 'rehearse'] as BriefStep[]).map((s) => [BRIEF.steps[s].label, prepareRefusal(sim, person, b, s)] as const)} />
      </div>

      <div className="col gap-1">
        <div className="eyebrow">Your Reading</div>
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
          <Gated feature="brief.choose" className="btn btn-sm" disabled={rec?.reading === draftReading} onClick={() => { const r = run<{ interpretation: number }>('brief.choose', { brief: b.id, reading: draftReading, ...(rec?.playing ? { pace: rec.playing.pace, scale: rec.playing.scale, structure: rec.playing.structure } : {}) }); if (r.ok) toast(`Reading it as ${readingOf(b, draftReading)!.label}.${rec?.reading ? ` The breakdown keeps ${pct(BRIEF.readingKept)} of what it was.` : ''}`, 'positive'); }}>{rec?.reading ? 'Change The Reading' : 'Read It This Way'}</Gated>
        </div>
        <Fine>Every reading here is one the brief supports; none is the right answer. A reading leans what the take counts for and draws on different abilities, and moves weight without adding any. Changing it keeps {pct(BRIEF.readingKept)} of the breakdown.</Fine>
      </div>

      {rec?.callback && <p className="small" style={{ margin: 0 }}><strong>A Callback.</strong> {rec.callback.why} It’s pitched harder than a first take.</p>}
      {rec?.reading && (
        <PlayingChooser material={material} current={rec.playing} direction={rec.callback ? { [rec.callback.axis]: rec.callback.side } as Partial<Record<Axis, typeof rec.callback.side>> : undefined} feature="brief.choose" preview={(c) => preview(sim, person, b, rec.reading!, c)} onChoose={(c) => { const r = run('brief.choose', { brief: b.id, reading: rec.reading, ...c }); if (r.ok) toast('Chosen: rehearse it in on your feet.', 'positive'); }} />
      )}

      <div className="col gap-1">
        <div className="eyebrow">The Take</div>
        <p className="small" style={{ margin: 0 }}>
          {rec?.reading ? <>Taped now, with today’s preparation and condition, it would come to about <strong>{now.overall.toFixed(1)}</strong> ({BAND_LABEL[bandOfQuality(now.overall)]}). {chiefLimit(now) ? `${chiefLimit(now)}.` : 'Every part of it is where the take asks.'} {purpose ? PURPOSE_WORDS[purpose] : ''}</> : 'Choose a reading first.'}
        </p>
        <div>
          <Gated feature="practice.self_tape" className="btn btn-sm" disabled={Boolean(tape)} title={tape ?? `An hour: ${b.title}, ${readingOf(b, rec?.reading)?.label ?? ''}`} onClick={() => { const r = run<{ overall: number; purpose: string; band: string }>('practice.self_tape', { genre, brief: b.id }); if (r.ok) toast(`Taped: ${r.value!.overall.toFixed(1)}, ${BAND_LABEL[r.value!.band as keyof typeof BAND_LABEL]}.`, 'positive'); }}>Tape It (60 Min)</Gated>
        </div>
        {tape && <p className="xs dim" style={{ margin: 0 }}>{tape}</p>}
      </div>

      {last && (
        <div className="col gap-1">
          <div className="eyebrow">The Last Take, {formatDate(last.at, sim.zone)}</div>
          <p className="small" style={{ margin: 0 }}><strong>{last.overall.toFixed(1)}</strong>, {BAND_LABEL[last.band as keyof typeof BAND_LABEL]}: {readingOf(b, last.reading)?.label}{last.sides.length ? `, played ${last.sides.join(' and ')}` : ''}. {PURPOSE_WORDS[last.purpose]} {last.chief ? `${last.chief}.` : ''}</p>
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
          <p className="small" style={{ margin: 0 }}><strong>{top.label}</strong>. {top.why}</p>
          <div>{practice(top.target)}</div>
        </div>
      )}
      {ideas.length > 0 && (
        <div className="col gap-1">
          <div className="eyebrow">Where It Would Show Next</div>
          <ul className="small" style={{ margin: 0 }}>{ideas.map((s) => <li key={s.brief}>{s.why} <button type="button" className="btn btn-sm btn-ghost" onClick={() => onOpen(s.genre)}>{`Open ${GENRE_BY_ID[s.genre]?.label ?? s.genre}`}</button></li>)}</ul>
        </div>
      )}

      {rec && rec.takes.length > 0 && (
        <div className="col gap-1">
          <div className="eyebrow">Your Takes Of It</div>
          <div className="table-scroll">
            <table>
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
      <Fine>A brief’s preparation is the breakdown, the lines and rehearsal on your feet, each step going further the less is left and half as far again the same day; rehearsal counts complete higher the more the scene turns. A Strong take earns a callback: a harder pitch, with a note on how to play it said before you tape. The sizes are SLATE’s design; the shape of a breakdown (where and when, the relationship, what you want, what’s in the way, where it turns) is the acting texts’.</Fine>
    </div>
  );
}
