/**
 * SLATE — what a piece of material asks, and how the player chooses to play it (from 2026-10-10;
 * `content/material.ts`, `content/approaches.ts`, `systems/material.ts`).
 *
 * Everything a choice does is shown before it's made: the material's features and the text's reasons for each; any
 * side the material or the director doesn't take, and why; the abilities each side draws on; and what the work would
 * come to, fully prepared, played each way (the evaluation's own expected result, with no draw). A change of mind
 * keeps half of what was rehearsed in, said on the button.
 */

import { useState } from 'react';
import { Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { HowItWorks } from '@/ui/guide/HowItWorks';
import { AXES, APPROACH_EFFECT, MISFIT, PLAYING } from '@/engine/content/approaches';
import type { Axis, AxisValue, MaterialProfile } from '@/engine/content/material';
import { misfitOf, sidesOf, transitionsOf, type Playing } from '@/engine/systems/material';
import { abilityDef } from '@/engine/systems/attributes';
import type { Evaluation } from '@/engine/systems/evaluation';
import { SKILLS } from '@/engine/content/school';

const LEVEL = ['None', 'Some', 'Much', 'Built On It'];
const FEATURE_WORD: Record<string, string> = { timing: 'Timing', physical: 'Physical Work', partner: 'Playing Off The Partner', vocal: 'Vocal Demand', improvisation: 'Freedom To Improvise' };
const LANGUAGE_WORD: Record<MaterialProfile['language'], string> = { everyday: 'Everyday Speech', heightened: 'Heightened Prose', verse: 'Verse' };

type Choice = Omit<Playing, 'chosenAt' | 'prep'>;

/** A material's demands, with the text's reasons. */
export function MaterialDemands({ material }: { material: MaterialProfile }) {
  const features = (['timing', 'physical', 'partner', 'vocal', 'improvisation'] as const).filter((f) => material[f] > 0);
  const tech = Object.keys(material.techniques ?? {}).map((k) => SKILLS.find((s) => s.id === k)?.label ?? k);
  return (
    <div className="col gap-1">
      <div className="eyebrow">What {material.title} Asks</div>
      <ul className="small" style={{ margin: 0 }}>
        <li><strong>{LANGUAGE_WORD[material.language]}</strong>{material.medium === 'camera' ? ', on camera' : ''}{material.why.language ? `: ${material.why.language}` : ''}</li>
        {features.map((f) => <li key={f}><strong>{FEATURE_WORD[f]}: {LEVEL[material[f]]}</strong>{material.why[f] ? `. ${material.why[f]}` : ''}</li>)}
        <li><strong>{material.tones.length > 1 ? `Tone: ${material.tones.join(' to ')}` : `Tone: ${material.tones[0]}`}</strong>, {transitionsOf(material)} transition{transitionsOf(material) === 1 ? '' : 's'} to play{material.why.tones ? `. ${material.why.tones}` : material.why.turns ? `. ${material.why.turns}` : ''}</li>
        {tech.length > 0 && <li><strong>Techniques It Asks: {tech.join(', ')}</strong>{material.why.techniques ? `. ${material.why.techniques}` : ''}</li>}
        {material.allows && <li><strong>It Only Takes: {Object.values(material.allows).flat().map((v) => APPROACH_EFFECT[v as AxisValue].label).join(', ')}</strong>{material.why.allows ? `. ${material.why.allows}` : ''}</li>}
      </ul>
    </div>
  );
}

export function PlayingChooser({ material, current, direction, preview, feature, help, onChoose }: {
  material?: MaterialProfile;
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
  return (
    <div className="col gap-2">
      {help ? <div className="row-between"><div className="eyebrow">How You’ll Play It</div><HowItWorks help={help} /></div> : <div className="eyebrow">How You’ll Play It</div>}
      {asked.length > 0 && <p className="small" style={{ margin: 0 }}>The director has asked for it {asked.map(([, v]) => APPROACH_EFFECT[v].label.toLowerCase()).join(' and ')}: {asked.map(([, v]) => APPROACH_EFFECT[v].words).join(' ')}</p>}
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Axis</th><th scope="col">Choice</th><th scope="col">What It Draws On</th><th scope="col" className="num">Fully Prepared</th></tr></thead>
          <tbody>
            {(Object.keys(AXES) as Axis[]).flatMap((axis) => AXES[axis].values.map((side, i) => {
              const e = APPROACH_EFFECT[side];
              const why = misfitOf(axis, side, material, direction);
              const chosen = draft[axis] === side;
              const result = preview({ ...draft, [axis]: side }).overall;
              const draws = [...new Set(Object.values(e.inputs).flat().filter((x) => !movements || x!.ability !== 'stamina').map((x) => abilityDef(x!.ability).label))].join(', ');
              return (
                <tr key={side}>
                  <td className="nowrap">{i === 0 ? AXES[axis].label : ''}</td>
                  <td>
                    <label className="row gap-1" style={{ alignItems: 'flex-start' }}>
                      <input type="radio" name={`axis-${axis}`} checked={chosen} onChange={() => setDraft({ ...draft, [axis]: side })} />
                      <span><strong>{e.label}</strong> <span className="xs">{e.words}</span>{why && <span className="xs" style={{ display: 'block', color: 'var(--warning, inherit)' }}>Doesn’t fit: {why}</span>}</span>
                    </label>
                  </td>
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
        Played this way, fully prepared and on a good day: {now.overall.toFixed(1)}, against {open.toFixed(1)} with nothing chosen.
        {current && sidesOf(current).length > 0 ? ` Your choice now is rehearsed in to ${Math.round(current.prep * 100)}% (complete at ${Math.round(PLAYING.complete * 100)}%), by work on your feet.` : ' A choice is rehearsed in by work on your feet after it’s made.'}
        {changed && current && sidesOf(current).length > 0 ? ` Changing it keeps ${Math.round(PLAYING.keptOnChange * 100)}% of that.` : ''}
      </p>
      <div>
        <Gated feature={feature} className="btn btn-sm" disabled={!changed} onClick={() => onChoose(draft)}>{current && sidesOf(current).length ? 'Change How You Play It' : 'Play It This Way'}</Gated>
      </div>
      <Fine>Each side leans the work’s quality dimensions toward what it is and draws on the abilities shown; leaning moves weight, never adds it, so at full ability every choice that fits reaches 100. Below it, a choice that leans on what you do well shows you better. A choice the material or the director doesn’t take holds the dimensions it leans on to {Math.round(MISFIT * 100)}% of themselves.{movements ? ' Judged in its movements, the work reads stamina only as tiring late in it, however it’s played, so no side draws on it here.' : ''} The sizes are SLATE’s design.</Fine>
    </div>
  );
}
