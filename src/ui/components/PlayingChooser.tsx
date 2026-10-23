/**
 * SLATE — what a piece of material asks, and how the player chooses to play it (from 2026-10-10;
 * `content/material.ts`, `content/approaches.ts`, `systems/material.ts`).
 *
 * Everything a choice does is shown before it's made: the material's features and the text's reasons for each; any
 * side the material or the director doesn't take, and why; the abilities each side draws on; and what the work would
 * come to, fully prepared, played each way (the evaluation's own expected result, with no draw). A change of mind
 * keeps half of what was rehearsed in, said on the button.
 */

import { useId, useState } from 'react';
import { Fine, WhyNot } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { HowItWorks } from '@/ui/guide/HowItWorks';
import { AXES, APPROACH_EFFECT, MISFIT, PLAYING } from '@/engine/content/approaches';
import type { Axis, AxisValue, MaterialProfile } from '@/engine/content/material';
import { misfitOf, sidesOf, transitionsOf, type Playing } from '@/engine/systems/material';
import { abilityDef } from '@/engine/systems/attributes';
import type { Evaluation } from '@/engine/systems/evaluation';
import { SKILLS } from '@/engine/content/school';
import { CIRCUMSTANCE_AFFINITY, GRAIN_LABEL } from '@/engine/content/interpretation';
import { requiredFor, sceneOfMaterial, suitabilityOf, type Scene } from '@/engine/systems/interpretation';

const LEVEL = ['None', 'Some', 'Much', 'Built On It'];
const FEATURE_WORD: Record<string, string> = { timing: 'Timing', physical: 'Physical Work', partner: 'Playing Off The Partner', vocal: 'Vocal Demand', improvisation: 'Freedom To Improvise' };
const LANGUAGE_WORD: Record<MaterialProfile['language'], string> = { everyday: 'Everyday Speech', heightened: 'Heightened Prose', verse: 'Verse' };

type Choice = Omit<Playing, 'chosenAt' | 'prep'>;

/**
 * A material's demands, with the text's reasons. A stage scene's circumstances too, each with its reason (from 2026-10-16,
 * later): until then each of the 86 class scenes and plays had a reason written for each circumstance, and no screen
 * showed it, while The Scene named the circumstance alone.
 */
export function MaterialDemands({ material }: { material: MaterialProfile }) {
  const features = (['timing', 'physical', 'partner', 'vocal', 'improvisation'] as const).filter((f) => material[f] > 0);
  const circumstances = (Object.entries(material.circumstances ?? {}) as [keyof typeof CIRCUMSTANCE_AFFINITY, number][]).filter(([, level]) => level > 0);
  const tech = Object.keys(material.techniques ?? {}).map((k) => SKILLS.find((s) => s.id === k)?.label ?? k);
  return (
    <div className="col gap-1">
      <div className="eyebrow">What {material.title} Asks</div>
      <ul className="small" style={{ margin: 0 }}>
        <li><strong>{LANGUAGE_WORD[material.language]}</strong>{material.medium === 'camera' ? ', on camera' : ''}{material.why.language ? `: ${material.why.language}` : ''}</li>
        {features.map((f) => <li key={f}><strong>{FEATURE_WORD[f]}: {LEVEL[material[f]]}</strong>{material.why[f] ? `. ${material.why[f]}` : ''}</li>)}
        {circumstances.map(([c, level]) => <li key={c} data-circumstance={c}><strong>{CIRCUMSTANCE_AFFINITY[c].label}: {LEVEL[level]}</strong>{material.why[c] ? `. ${material.why[c]}` : ''}</li>)}
        {/* The count by the brief pane's own name for it, changes of tone (from 2026-10-19, brief 15, at material-b's
            suggestion): until then “N transitions to play”. */}
        <li><strong>{material.tones.length > 1 ? `Tone: ${material.tones.join(' to ')}` : `Tone: ${material.tones[0]}`}</strong>, {transitionsOf(material)} change{transitionsOf(material) === 1 ? '' : 's'} of tone to play{material.why.tones ? `. ${material.why.tones}` : material.why.turns ? `. ${material.why.turns}` : ''}</li>
        {tech.length > 0 && <li><strong>Techniques It Asks: {tech.join(', ')}</strong>{material.why.techniques ? `. ${material.why.techniques}` : ''}</li>}
        {material.allows && <li><strong>It Only Takes: {Object.values(material.allows).flat().map((v) => APPROACH_EFFECT[v as AxisValue].label).join(', ')}</strong>{material.why.allows ? `. ${material.why.allows}` : ''}</li>}
      </ul>
    </div>
  );
}

export function PlayingChooser({ material, scene, current, direction, preview, feature, help, onChoose }: {
  material?: MaterialProfile;
  /** What the scene is beyond its material (from 2026-10-16): a brief's genre register, its reader, the reading taken. */
  scene?: Scene;
  current?: Playing;
  direction?: Partial<Record<Axis, AxisValue>>;
  preview: (c: Choice) => Evaluation;
  feature: string;
  /**
   * The guide's entry for the choice (from 2026-10-12), by its id or a feature it covers: How This Works beside How
   * You’ll Play It. The caller names it, so its own file holds the help for the control it gates.
   */
  help?: string;
  onChoose: (c: Choice) => void;
}) {
  const [draft, setDraft] = useState<Choice>({ ...(current?.pace ? { pace: current.pace } : {}), ...(current?.scale ? { scale: current.scale } : {}), ...(current?.structure ? { structure: current.structure } : {}) });
  // Each chooser's radio groups named for it alone (from 2026-10-21): until then every chooser named its groups
  // `axis-pace`, `axis-scale` and `axis-structure`, so two on one screen (the showcase's two scenes on Coursework) were
  // one group each to the browser, Tab stopped only in the first, and the second's choices were reached only by the
  // arrow keys running on from the first (brief 19's app walk).
  const group = useId();
  const same = (a: Choice, b: Choice) => a.pace === b.pace && a.scale === b.scale && a.structure === b.structure;
  const whole = preview({});
  const open = whole.overall;
  // A piece judged in its movements, a brief's beats or a scene's parts reads stamina only as tiring late in it
  // (`judgePiece`), so it isn't listed as what a side draws on there (from 2026-10-12: until then Driven listed Stamina
  // for a part, which a night never read through the side). Work judged whole, with no scene, still lists and reads it; a
  // scene of one tone was judged whole too until 2026-10-16 (`scenePiece`).
  const movements = whole.piece !== undefined;
  const now = preview(draft);
  const changed = current ? !same(draft, current) : sidesOf({ ...draft, chosenAt: 0, prep: 0 }).length > 0;
  const asked = Object.entries(direction ?? {}) as [Axis, AxisValue][];
  // How much of the choice's rehearsal completes it (from 2026-10-16): less with the scene's grain, more against it.
  const draftSides = sidesOf({ ...draft, chosenAt: 0, prep: 0 });
  // The scene as the take reads it: the caller's, or a class scene's or a play's own genre (`sceneOfMaterial`).
  const sceneRead = scene ?? sceneOfMaterial(material);
  const completeAt = requiredFor(draftSides, material, sceneRead);
  const label = current && sidesOf(current).length ? 'Change How You Play It' : 'Play It This Way';
  const unchanged = current && sidesOf(current).length ? 'That’s how you play it now. Choose another way above to change it.' : 'Choose a way to play it above first.';
  return (
    <div className="col gap-2">
      {help ? <div className="row-between"><div className="eyebrow">How You’ll Play It</div><HowItWorks help={help} /></div> : <div className="eyebrow">How You’ll Play It</div>}
      {asked.length > 0 && <p className="small" style={{ margin: 0 }}>The director has asked for it {asked.map(([, v]) => APPROACH_EFFECT[v].label.toLowerCase()).join(' and ')}: {asked.map(([, v]) => APPROACH_EFFECT[v].words).join(' ')}</p>}
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Aspect</th><th scope="col">Choice</th><th scope="col">The Scene</th><th scope="col">Abilities It Uses</th><th scope="col" className="num">Fully Prepared</th></tr></thead>
          <tbody>
            {(Object.keys(AXES) as Axis[]).flatMap((axis) => AXES[axis].values.map((side, i) => {
              const e = APPROACH_EFFECT[side];
              const why = misfitOf(axis, side, material, direction);
              const chosen = draft[axis] === side;
              const result = preview({ ...draft, [axis]: side }).overall;
              // How well the side suits the scene (from 2026-10-16, `systems/interpretation.ts`): its band and what it rests on.
              const suit = suitabilityOf(side, material, sceneRead);
              const rests = suit.signals.filter((g) => Math.abs(g.v) >= 0.1).slice(0, 3);
              const draws = [...new Set(Object.values(e.inputs).flat().filter((x) => !movements || x!.ability !== 'stamina').map((x) => abilityDef(x!.ability).label))].join(', ');
              return (
                <tr key={side}>
                  <td className="nowrap">{i === 0 ? AXES[axis].label : ''}</td>
                  {/* The choice and what the scene says of it at a width they read at, the table scrolling in its box where
                      the page is narrower (from 2026-10-23, brief 23's walk: at 1024 the choice's words were five lines in
                      107 pixels). */}
                  <td>
                    <label className="row gap-1 cell-wide" style={{ alignItems: 'flex-start' }}>
                      <input type="radio" name={`${group}axis-${axis}`} checked={chosen} onChange={() => setDraft({ ...draft, [axis]: side })} />
                      <span><strong>{e.label}</strong> <span className="xs">{e.words}</span>{why && <span className="xs" style={{ display: 'block', color: 'var(--warning, inherit)' }}>Doesn’t fit: {why}</span>}</span>
                    </label>
                  </td>
                  <td className="xs" data-suit={suit.band}><div className="cell-min"><strong>{GRAIN_LABEL[suit.band]}</strong>{rests.length ? <ul style={{ margin: 0, paddingLeft: '1.1em' }}>{rests.map((g) => <li key={g.source}>{g.source}: {g.v > 0 ? 'for it' : 'against it'}</li>)}</ul> : <span style={{ display: 'block' }}>Nothing in the scene leans either way.</span>}</div></td>
                  <td className="xs">{draws}</td>
                  <td className="num mono">{result.toFixed(1)}</td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
      <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        {(Object.keys(AXES) as Axis[]).map((axis) => draft[axis] && <button key={axis} type="button" className="btn btn-sm btn-ghost" onClick={() => { const next = { ...draft }; delete next[axis]; setDraft(next); }}>Leave The {AXES[axis].label} Open</button>)}
      </div>
      <p className="small" style={{ margin: 0 }}>
        Fully prepared and on a good day, playing it this way would come to {now.overall.toFixed(1)}, {now.overall.toFixed(1) === open.toFixed(1) ? 'the same as' : `against ${open.toFixed(1)}`} with nothing chosen.
        {current && sidesOf(current).length > 0 ? ` You’ve rehearsed your current choice to ${Math.round(current.prep * 100)}% so far (it’s complete at ${Math.round(requiredFor(sidesOf(current), material, sceneRead) * 100)}%). Work on your feet rehearses it.` : ' Choosing a way to play it isn’t rehearsing it: once you choose, work on your feet rehearses it.'}
        {draftSides.length > 0 ? ` This choice is complete once it’s rehearsed to ${Math.round(completeAt * 100)}%: ${completeAt < PLAYING.complete ? 'it suits the scene, so it asks less' : completeAt > PLAYING.complete ? 'it goes against the scene, so it asks more' : 'the scene neither favors nor resists it'}.` : ''}
        {changed && current && sidesOf(current).length > 0 ? ` If you change it, you keep ${Math.round(PLAYING.keptOnChange * 100)}% of that rehearsal.` : ''}
      </p>
      {/* Grayed with its reason (from 2026-10-21): until then it said nothing under it or in its title until a way was
          picked, on the showcase's scene cards among the rest (brief 19's app walk). */}
      <div>
        <Gated feature={feature} className="btn btn-sm" disabled={!changed} title={changed ? undefined : unchanged} onClick={() => onChoose(draft)}>{label}</Gated>
      </div>
      {!changed && <WhyNot reasons={[[label, unchanged]]} />}
      <Fine>Each way of playing shifts what counts most in your work toward what it is, and uses the abilities shown. It moves the balance without adding to it, so at full ability every choice that fits reaches 100; below that, a choice that leans on what you do well shows you at your best. A choice the material or the director doesn’t take holds the qualities it leans on to {Math.round(MISFIT * 100)}% of themselves. A choice that fits can still suit the scene or go against it, by what the scene is (its genre, its reader, its tones and turns, its features and language, its circumstances, the medium and the reading you’ve taken): one that suits it is easier to make work and needs less rehearsal, one that goes against it is harder and needs more, and at full ability either reaches 100.{movements ? ' Judged movement by movement, the piece only counts stamina as tiring late in it, however it’s played, so no choice uses it here.' : ''} The sizes are estimated.</Fine>
    </div>
  );
}
