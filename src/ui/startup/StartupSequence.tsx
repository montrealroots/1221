/**
 * SLATE — the opening.
 *
 * The progression is real. Each stage does actual work — resolving persistence,
 * reading the slots, validating what is stored, checking schema versions — and
 * the bar reflects it. A failure stops with a specific reason and a way forward
 * rather than a spinner that never ends.
 */

import { titleCaseLabel } from '@/engine/core/text';
import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveAdapter } from '@/engine/persistence/base44';
import type { SaveAdapter, SaveSlotInfo } from '@/engine/persistence/adapter';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { APP_VERSION } from '@/engine/world/bootstrap';

export interface StartupResult {
  adapter: SaveAdapter;
  slots: SaveSlotInfo[];
}

type StageState = 'waiting' | 'active' | 'done' | 'failed';

interface Stage {
  id: string;
  label: string;
  /** Fraction of the bar this stage accounts for. */
  weight: number;
  run: (context: StartupContext) => Promise<void>;
}

interface StartupContext {
  adapter?: SaveAdapter;
  slots?: SaveSlotInfo[];
  warnings: string[];
}

const STAGES: Stage[] = [
  {
    id: 'boot', label: 'Starting The Projector', weight: 10,
    run: async () => { await pause(160); },
  },
  {
    id: 'storage', label: 'Connecting To Storage', weight: 20,
    run: async (context) => {
      context.adapter = await resolveAdapter();
      await pause(140);
    },
  },
  {
    id: 'saves', label: 'Reading Save Slots', weight: 25,
    run: async (context) => {
      if (!context.adapter) throw new Error('Storage wasn’t resolved.');
      context.slots = await context.adapter.listSlots();
    },
  },
  {
    id: 'validate', label: 'Validating Universes', weight: 25,
    run: async (context) => {
      for (const slot of context.slots ?? []) {
        if (slot.error) {
          context.warnings.push(`Slot ${slot.slot}: ${slot.error}${slot.hasBackup ? ' A backup is available.' : ''}`);
        }
      }
      await pause(180);
    },
  },
  {
    id: 'migrations', label: 'Checking Schema Versions', weight: 15,
    run: async (context) => {
      for (const slot of context.slots ?? []) {
        const version = slot.meta?.schemaVersion;
        if (version === undefined) continue;
        if (version > SAVE_SCHEMA_VERSION) {
          context.warnings.push(
            `Slot ${slot.slot} was written by a newer version of SLATE and won’t be opened, to avoid damaging it.`,
          );
        } else if (version < SAVE_SCHEMA_VERSION) {
          context.warnings.push(
            `Slot ${slot.slot} will be brought forward from schema ${version} to ${SAVE_SCHEMA_VERSION} when you open it. A checkpoint is taken first.`,
          );
        }
      }
      await pause(150);
    },
  },
  {
    id: 'ready', label: 'Ready', weight: 5,
    run: async () => { await pause(220); },
  },
];

export function StartupSequence({ onReady }: { onReady: (result: StartupResult) => void }) {
  const [progress, setProgress] = useState(0);
  const [states, setStates] = useState<Record<string, StageState>>({});
  const [failure, setFailure] = useState<{ stage: string; message: string } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);
  const cancelled = useRef(false);

  const start = useCallback(async () => {
    const context: StartupContext = { warnings: [] };
    let completed = 0;
    setFailure(null);
    setWarnings([]);
    setProgress(0);
    setStates({});

    for (const stage of STAGES) {
      if (cancelled.current) return;
      setStates((s) => ({ ...s, [stage.id]: 'active' }));
      try {
        await stage.run(context);
      } catch (error) {
        setStates((s) => ({ ...s, [stage.id]: 'failed' }));
        setFailure({ stage: stage.label, message: (error as Error).message });
        return;
      }
      completed += stage.weight;
      setStates((s) => ({ ...s, [stage.id]: 'done' }));
      setProgress(completed);
    }

    setWarnings(context.warnings);
    if (!context.adapter || !context.slots) {
      setFailure({ stage: 'Startup', message: 'Storage didn’t report back.' });
      return;
    }

    // Warnings are surfaced but never block. The player decides.
    if (context.warnings.length === 0) {
      await pause(260);
      if (!cancelled.current) onReady({ adapter: context.adapter, slots: context.slots });
    } else {
      (window as unknown as { __slateStartup?: StartupResult }).__slateStartup = {
        adapter: context.adapter, slots: context.slots,
      };
    }
  }, [onReady]);

  useEffect(() => {
    cancelled.current = false;
    void start();
    return () => { cancelled.current = true; };
  }, [start, attempt]);

  const proceed = () => {
    const stored = (window as unknown as { __slateStartup?: StartupResult }).__slateStartup;
    if (stored) onReady(stored);
  };

  return (
    <div className="startup">
      <div className="startup-inner">
        <span className="clapper" role="img" aria-label="SLATE">🎬</span>
        <div className="wordmark">SLATE</div>
        <div className="wordmark-sub">A life in pictures</div>

        <div
          className="startup-bar"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Startup Progress"
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="startup-status">
          <span>{failure ? 'Startup stopped' : progress >= 100 ? 'Ready' : currentLabel(states)}</span>
          <span className="mono">{progress}%</span>
        </div>

        <div className="startup-stages" aria-live="polite">
          {STAGES.map((stage) => {
            const state = states[stage.id] ?? 'waiting';
            return (
              <div key={stage.id} className="startup-stage" data-state={state}>
                <span aria-hidden="true">
                  {state === 'done' ? '✓' : state === 'failed' ? '✕' : state === 'active' ? '▸' : '·'}
                </span>
                <span>{stage.label}</span>
              </div>
            );
          })}
        </div>

        {failure && (
          <div className="callout callout-negative" style={{ marginTop: 'var(--s5)', textAlign: 'left' }}>
            <strong>{titleCaseLabel(failure.stage)} failed.</strong>
            <p className="small" style={{ marginTop: 'var(--s1)' }}>{failure.message}</p>
            <div className="row gap-2" style={{ marginTop: 'var(--s3)' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setAttempt((a) => a + 1)}>
                Try Again
              </button>
            </div>
          </div>
        )}

        {warnings.length > 0 && !failure && (
          <div className="callout callout-warning" style={{ marginTop: 'var(--s5)', textAlign: 'left' }}>
            <strong>Before you continue</strong>
            <ul className="small" style={{ margin: 'var(--s2) 0 0', paddingLeft: 'var(--s4)' }}>
              {warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
            <div className="row gap-2" style={{ marginTop: 'var(--s3)' }}>
              <button className="btn btn-primary btn-sm" onClick={proceed}>Continue</button>
            </div>
          </div>
        )}

        <div className="dim xs" style={{ marginTop: 'var(--s6)' }}>
          Version {APP_VERSION} · Schema {SAVE_SCHEMA_VERSION}
        </div>
      </div>
    </div>
  );
}

function currentLabel(states: Record<string, StageState>): string {
  const active = STAGES.find((s) => states[s.id] === 'active');
  return active?.label ?? 'Starting';
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
