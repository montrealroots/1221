/**
 * Routines (`systems/routines.ts`, from 2026-10-01): a list of everyday
 * steps put together, named and saved, and run in order, each the command
 * a screen would run, stopping at the first that can't be done.
 */
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Fine } from '@/ui/components/primitives';
import { useFeature } from '@/ui/guide/Guide';
import { LOOKING_AFTER, type LookAfter } from '@/engine/systems/life';
import { RECIPES } from '@/engine/content/groceries';
import { MAX_STEPS, routineRefusal, runRoutine, stepLabel, type RoutineStep } from '@/engine/systems/routines';

export function RoutinesWorkspace() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const routines = useWorld((s) => s.player.routines ?? []);
  const outfits = useWorld((s) => s.player.outfits ?? []);
  const save = useFeature('routine.save');
  const drop = useFeature('routine.delete');
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [name, setName] = useState('');
  const [choice, setChoice] = useState('look:wash');
  // The steps there are to choose from: looking after yourself, eating, cooking, dressing.
  const options: { key: string; label: string; step: RoutineStep }[] = [
    ...(Object.keys(LOOKING_AFTER) as LookAfter[]).map((a) => ({ key: `look:${a}`, label: LOOKING_AFTER[a].label, step: { kind: 'life.look_after', payload: { action: a } } })),
    { key: 'ready', label: 'Eat Something Ready', step: { kind: 'food.eat_ready', payload: {} } },
    ...RECIPES.map((r) => ({ key: `cook:${r.id}`, label: `Cook ${r.name}`, step: { kind: 'food.cook', payload: { recipeId: r.id } } })),
    ...outfits.map((o) => ({ key: `wear:${o.id}`, label: `Wear ${o.name}`, step: { kind: 'clothes.wear_outfit', payload: { outfitId: o.id } } })),
  ];
  const picked = options.find((o) => o.key === choice) ?? options[0]!;
  const no = routineRefusal(name, steps);
  const go = (routineId: string, routineName: string) => {
    const result = runRoutine(sim, routineId, (kind, payload) => run(kind, payload, { silent: true }));
    if (result.stopped) toast(`${routineName} stopped at ${result.stopped.label}: ${result.stopped.error}`, 'negative');
    else toast(`${routineName}, done.`, 'positive');
  };
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Day</div>
        <h1>Routines</h1>
        <p className="muted">The things you do in order, saved and done again: each step as you’d do it, stopping where one can’t be done.</p>
      </div>
      <div className="col gap-5">
        <Panel title="Your Routines">
          {routines.length === 0 ? <p className="small muted" style={{ margin: 0 }}>You haven’t put a routine together yet.</p> : (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Routine</th><th scope="col">Steps</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {routines.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td className="small">{r.steps.map((s) => stepLabel(person, s)).join(' · ')}</td>
                      <td>
                        <div className="row gap-1" style={{ justifyContent: 'flex-end' }}>
                          <button type="button" className="btn btn-sm" onClick={() => go(r.id, r.name)}>Run It</button>
                          <button type="button" className="btn btn-sm btn-ghost" disabled={!drop.open} title={drop.reason} onClick={() => run('routine.delete', { routineId: r.id })}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel title="Put One Together" subtitle={`Up to ${MAX_STEPS} steps`}>
          <div className="col gap-3">
            <div className="field-row field-row-tight">
              <div className="field">
                <label htmlFor="routine-step">Step</label>
                <select id="routine-step" value={picked.key} onChange={(e) => setChoice(e.target.value)}>
                  {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="routine-name">Name</label>
                <input id="routine-name" value={name} placeholder="Weekday Morning" onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div className="row gap-1">
              <button type="button" className="btn btn-sm btn-ghost" disabled={steps.length >= MAX_STEPS} onClick={() => setSteps([...steps, picked.step])}>Add The Step</button>
              <button type="button" className="btn btn-sm btn-ghost" disabled={steps.length === 0} onClick={() => setSteps(steps.slice(0, -1))}>Take The Last Off</button>
              <button type="button" className="btn btn-sm" disabled={!save.open || Boolean(no)} title={no ?? save.reason} onClick={() => { if (run('routine.save', { name, steps }).ok) { toast(`${name.trim()}, saved.`, 'positive'); setSteps([]); setName(''); } }}>Save It</button>
            </div>
            <div className="small">{steps.length ? steps.map((s, i) => `${i + 1}. ${stepLabel(person, s)}`).join('   ') : 'No steps yet.'}</div>
          </div>
        </Panel>
        <Fine>A routine runs each step as you would, with its own time and checks: a shower when you aren’t clean, a meal when you’re hungry and can pay, a recipe when the kitchen has what it takes. It stops at the first that can’t be done and says why; what was done before it stays done.</Fine>
      </div>
    </>
  );
}
