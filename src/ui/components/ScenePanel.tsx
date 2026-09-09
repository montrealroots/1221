/**
 * SLATE — the scene in front of you.
 *
 * Mounted in the shell, above whatever screen you are on, so a scene that
 * is in progress is in progress wherever you go. It shows what the scene
 * says, the choices it offers, a place to type, and what has happened so
 * far. It never decides anything itself: every button and every line typed
 * is a `scene.*` command, carrying the step's revision and an idempotency
 * key, so a double click or a replay lands on the same answer.
 */

import { useState, type FormEvent } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { formatTime } from '@/engine/core/time';
import { activeScene, sceneDefinition, sceneView, type ChooseResult, type SceneChoice } from '@/engine/systems/scenes';
import { Stat } from './primitives';

export function ScenePanel() {
  const { sim, run, toast } = useGame();
  const scene = useWorld(activeScene);
  const [text, setText] = useState('');
  const [minimised, setMinimised] = useState(false);
  const [hinted, setHinted] = useState<string[]>([]);

  if (!scene) return null;
  const view = sceneView(sim, scene);
  const definition = sceneDefinition(scene.definitionId);
  const interrupted = scene.status === 'interrupted';
  const key = (op: string) => `ui:scene:${scene.id}:r${scene.revision}:${op}`;

  const handle = (result: { ok: boolean; value?: ChooseResult }) => {
    if (!result.ok || !result.value) return;
    const outcome = result.value;
    setHinted(outcome.ambiguous ?? []);
    if (outcome.help) {
      toast(`You can: ${view.choices.filter((c) => !c.disabled).map((c) => c.label).join(' · ')}`, 'neutral');
    } else if (outcome.message) {
      toast(outcome.message, outcome.unsupported || outcome.status === 'interrupted' ? 'neutral' : 'neutral');
    }
    if (outcome.status !== 'active' || !outcome.unsupported) setText('');
  };

  const choose = (choice: SceneChoice) => {
    if (choice.disabled) { toast(choice.disabled, 'neutral'); return; }
    handle(run<ChooseResult>('scene.choose', { sceneId: scene.id, revision: scene.revision, choiceId: choice.id }, { idempotencyKey: key(choice.id) }));
  };

  const typed = (event: FormEvent) => {
    event.preventDefault();
    const line = text.trim();
    if (!line) return;
    handle(run<ChooseResult>('scene.choose', { sceneId: scene.id, revision: scene.revision, text: line }, { idempotencyKey: key(`text:${line.toLowerCase()}`) }));
  };

  const leave = () => run('scene.leave', { sceneId: scene.id, revision: scene.revision }, { idempotencyKey: key('leave') });
  const skip = () => run('scene.skip', { sceneId: scene.id, revision: scene.revision }, { idempotencyKey: key('skip') });
  const resume = () => run('scene.resume', { sceneId: scene.id }, { idempotencyKey: key('resume') });

  if (minimised) {
    return (
      <section className="scene scene-min" aria-label="Scene In Progress">
        <div className="row-between gap-3">
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="eyebrow">{interrupted ? 'Scene Interrupted' : 'Scene In Progress'}</div>
            <div className="small strong truncate" title={view.title}>{view.title}</div>
          </div>
          <button className="btn btn-sm btn-primary" onClick={() => setMinimised(false)}>Open</button>
        </div>
      </section>
    );
  }

  const canSkip = !interrupted && view.canSkip !== false && Boolean(definition?.summarise);
  const canLeave = view.canLeave !== false;

  return (
    <section className={`scene${interrupted ? ' scene-interrupted' : ''}`} aria-label="Current Scene">
      <div className="panel-head">
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">{view.eyebrow ?? definition?.title ?? 'Scene'}</div>
          <h2 className="truncate" title={view.title}>{view.title}</h2>
        </div>
        <div className="row gap-2">
          {interrupted && <span className="chip chip-warning">Interrupted</span>}
          <button className="btn btn-ghost btn-sm" onClick={() => setMinimised(true)} aria-label="Minimise The Scene">Minimise</button>
        </div>
      </div>

      <p className="scene-text" aria-live="polite">{view.text}</p>

      {view.facts && view.facts.length > 0 && (
        <div className="grid grid-4 scene-facts">
          {view.facts.map((fact) => <Stat key={fact.label} label={fact.label} value={fact.value} />)}
        </div>
      )}

      {interrupted ? (
        <div className="row wrap gap-2">
          {scene.interruption?.resumable !== false && (
            <button className="btn btn-primary" onClick={resume}>Pick It Up Again</button>
          )}
          <button className="btn" onClick={leave}>Leave It</button>
        </div>
      ) : (
        <>
          {hinted.length > 0 && (
            <p className="xs muted" style={{ margin: '0 0 var(--s2)' }}>Did you mean one of these?</p>
          )}
          <div className="scene-choices">
            {view.choices.map((choice) => (
              <button
                key={choice.id}
                className={`scene-choice${choice.tone === 'primary' ? ' is-primary' : ''}${choice.tone === 'danger' ? ' is-danger' : ''}${hinted.includes(choice.id) ? ' is-hinted' : ''}${choice.disabled ? ' is-disabled' : ''}`}
                onClick={() => choose(choice)}
                aria-disabled={choice.disabled ? true : undefined}
                title={choice.disabled ?? choice.detail}
              >
                <span className="scene-choice-label">{choice.label}</span>
                {(choice.disabled ?? choice.detail) && (
                  <span className="scene-choice-detail">{choice.disabled ?? choice.detail}</span>
                )}
              </button>
            ))}
          </div>

          <form className="scene-type" onSubmit={typed}>
            <label htmlFor="scene-typed" className="xs dim">{view.freeText?.label ?? 'Or Type It'}</label>
            <div className="row gap-2">
              <input
                id="scene-typed"
                className="grow"
                value={text}
                maxLength={200}
                placeholder={view.freeText?.placeholder ?? 'A choice above, or leave, skip, help'}
                onChange={(event) => setText(event.target.value)}
                autoComplete="off"
              />
              <button className="btn btn-sm" type="submit" disabled={!text.trim()}>Go</button>
            </div>
          </form>

          <div className="row wrap gap-2 scene-foot">
            {canSkip && <button className="btn btn-sm" onClick={skip}>Skip To The End</button>}
            {canLeave && <button className="btn btn-ghost btn-sm" onClick={leave}>{view.leaveLabel ?? 'Leave'}</button>}
            {scene.committed.length > 0 && (
              <span className="xs dim">What you have already done stays done if you leave.</span>
            )}
          </div>
        </>
      )}

      <details className="scene-transcript">
        <summary className="xs dim">What Has Happened</summary>
        <ol>
          {scene.transcript.map((line, index) => (
            <li key={index} className={line.who === 'you' ? 'is-you' : undefined}>
              <span className="mono xs dim">{formatTime(line.at, sim.zone)}</span>
              <span>{line.who === 'you' ? `You: ${line.text}` : line.text}</span>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
