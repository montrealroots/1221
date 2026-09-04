import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat } from '@/ui/components/primitives';
import { simulationLoad } from '@/engine/world/world';
import { validateUniverse } from '@/engine';
import { formatDate } from '@/engine/core/time';
import { useState } from 'react';

export function SettingsWorkspace() {
  const { sim, run, refresh, saveNow, exitToMenu } = useGame();
  const prefs = sim.universe.preferences;
  const tutorial = sim.universe.tutorial;
  const sandbox = sim.universe.sandbox;
  const load = useWorld(simulationLoad);
  const [validation, setValidation] = useState<ReturnType<typeof validateUniverse> | null>(null);

  const setPref = (patch: Partial<typeof prefs>) => {
    Object.assign(prefs, patch);
    refresh();
  };

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Settings</div>
        <h1>Preferences</h1>
      </div>

      <div className="grid grid-2">
        <Panel title="Time And Play">
          <div className="field">
            <label htmlFor="speed">Time Speed</label>
            <select id="speed" value={prefs.timeSpeed} onChange={(e) => setPref({ timeSpeed: e.target.value as typeof prefs.timeSpeed })}>
              <option value="paused">Paused — The Clock Stops</option>
              <option value="live">Live — One Minute Per Minute</option>
              <option value="fast">Fast — One Hour Per Minute</option>
              <option value="faster">Faster — Ten Hours Per Minute</option>
            </select>
            <p className="hint">
              Live runs at real time: a minute of your evening is a minute of theirs.
              The faster settings are for waiting something out.
            </p>
          </div>
          <label className="row gap-2" style={{ marginBottom: 'var(--s3)' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={prefs.confirmLargePurchases}
              onChange={(e) => setPref({ confirmLargePurchases: e.target.checked })} />
            <span className="small" style={{ color: 'var(--text)' }}>Confirm Large Purchases</span>
          </label>
          <div className="field">
            <label htmlFor="threshold">Large Purchase Threshold</label>
            <input
              id="threshold" type="number" min={100}
              value={Math.round(prefs.largePurchaseThreshold / 100)}
              onChange={(e) => setPref({ largePurchaseThreshold: Number(e.target.value) * 100 })}
            />
          </div>
        </Panel>

        <Panel title="Accessibility">
          <label className="row gap-2" style={{ marginBottom: 'var(--s3)' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={prefs.reducedMotion}
              onChange={(e) => setPref({ reducedMotion: e.target.checked })} />
            <span className="small" style={{ color: 'var(--text)' }}>Reduce Motion</span>
          </label>
          <label className="row gap-2" style={{ marginBottom: 'var(--s3)' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={prefs.compactMode}
              onChange={(e) => setPref({ compactMode: e.target.checked })} />
            <span className="small" style={{ color: 'var(--text)' }}>Compact Layout</span>
          </label>
          <label className="row gap-2" style={{ marginBottom: 'var(--s3)' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={prefs.audioEnabled}
              onChange={(e) => setPref({ audioEnabled: e.target.checked })} />
            <span className="small" style={{ color: 'var(--text)' }}>Audio Cues</span>
          </label>
          <p className="xs dim">
            SLATE also honours your system reduced-motion setting automatically.
          </p>
        </Panel>

        <Panel title="Guidance">
          <label className="row gap-2" style={{ marginBottom: 'var(--s3)' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={tutorial.guidedMode}
              onChange={(e) => run('tutorial.set_mode', { guided: e.target.checked })} />
            <span className="small" style={{ color: 'var(--text)' }}>Guided Mode — Explain Each System The First Time</span>
          </label>
          <label className="row gap-2" style={{ marginBottom: 'var(--s3)' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={tutorial.advancedMode}
              onChange={(e) => run('tutorial.set_mode', { advanced: e.target.checked })} />
            <span className="small" style={{ color: 'var(--text)' }}>Advanced Mode — Show The Formulas Behind Outcomes</span>
          </label>
          <div className="row gap-2">
            <button className="btn btn-sm" onClick={() => run('tutorial.reset')}>Replay Tutorials</button>
          </div>
          <p className="xs dim" style={{ marginTop: 'var(--s2)' }}>
            Replaying tutorials does not touch your save. {tutorial.completed.length} completed.
          </p>
        </Panel>

        <Panel title="Save">
          <div className="grid grid-2" style={{ marginBottom: 'var(--s4)' }}>
            <Stat label="Slot" value={sim.universe.meta.slot} />
            <Stat label="Schema" value={sim.universe.meta.schemaVersion} />
            <Stat label="World Date" value={formatDate(sim.now, sim.homeZone)} />
            <Stat label="Backup" value={sim.universe.meta.backupAvailable ? 'Available' : 'None yet'} />
          </div>
          <div className="row gap-2 wrap">
            <button className="btn btn-sm" onClick={() => void saveNow()}>Save Now</button>
            <button className="btn btn-sm" onClick={() => setValidation(validateUniverse(sim.universe))}>
              Validate This Universe
            </button>
            <button className="btn btn-sm" onClick={exitToMenu}>Save And Exit</button>
          </div>

          {validation && (
            <div className={`callout ${validation.ok ? 'callout-accent' : 'callout-negative'}`} style={{ marginTop: 'var(--s4)' }}>
              <strong>{validation.ok ? 'This universe is internally consistent.' : `${validation.errors.length} problem${validation.errors.length === 1 ? '' : 's'} found.`}</strong>
              <p className="xs" style={{ margin: 'var(--s1) 0 0' }}>{validation.checked.toLocaleString('en-US')} records checked.</p>
              {validation.errors.slice(0, 5).map((error) => (
                <p key={error} className="xs negative" style={{ margin: '4px 0 0' }}>{error}</p>
              ))}
              {validation.warnings.slice(0, 3).map((warning) => (
                <p key={warning} className="xs warning" style={{ margin: '4px 0 0' }}>{warning}</p>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Simulation Load" subtitle="What this universe currently costs to run.">
          <div className="grid grid-2">
            <Stat label="People" value={load.people.toLocaleString('en-US')} />
            <Stat label="Pending Events" value={load.pendingEvents.toLocaleString('en-US')} />
            <Stat label="Transactions" value={load.transactions.toLocaleString('en-US')} />
            <Stat label="History Records" value={load.history.toLocaleString('en-US')} />
            <Stat label="Projects" value={load.projects.toLocaleString('en-US')} />
            <Stat label="Estimated Size" value={`${(load.estimatedBytes / 1024 / 1024).toFixed(1)} MB`} />
          </div>
          <hr className="divider" />
          <div className="xs dim">
            Simulation tiers: {load.tiers.full} full, {load.tiers.active} active, {load.tiers.background} background,{' '}
            {load.tiers.dormant} dormant. Only the people who matter to you get detailed processing.
          </div>
        </Panel>

        <Panel title="Sandbox" subtitle="Explicit overrides. Everything here is logged so history stays honest.">
          <label className="row gap-2" style={{ marginBottom: 'var(--s3)' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={sandbox.enabled}
              onChange={(e) => run('sandbox.toggle', { enabled: e.target.checked })} />
            <span className="small" style={{ color: 'var(--text)' }}>Enable Sandbox Tools</span>
          </label>

          <div className="row gap-2 wrap">
            <button className="btn btn-sm" disabled={!sandbox.enabled} onClick={() => run('sandbox.max_attributes')}>
              Max All Attributes
            </button>
            <button className="btn btn-sm" disabled={!sandbox.enabled} onClick={() => run('sandbox.grant_all_traits')}>
              Grant All Traits
            </button>
            <button className="btn btn-sm" disabled={!sandbox.enabled} onClick={() => run('sandbox.add_funds', { amount: 100_000_000 })}>
              Add $1,000,000
            </button>
          </div>
          <div className="xs dim" style={{ marginTop: 'var(--s3)' }}>
            A demo picture, staged through the same commands you would use: written, greenlit, funded, cast from the world and boarded — or shot out and in post, for trying the rooms.
          </div>
          <div className="row gap-2 wrap" style={{ marginTop: 'var(--s2)' }}>
            <button className="btn btn-sm" disabled={!sandbox.enabled} onClick={() => run('sandbox.stage_picture', { to: 'boarded' })}>
              Stage A Picture, Boarded
            </button>
            <button className="btn btn-sm" disabled={!sandbox.enabled} onClick={() => run('sandbox.stage_picture', { to: 'post' })}>
              Stage A Picture In Post
            </button>
          </div>

          {sandbox.log.length > 0 && (
            <div style={{ marginTop: 'var(--s4)' }}>
              <div className="eyebrow" style={{ marginBottom: 'var(--s2)' }}>Sandbox log</div>
              {sandbox.log.slice(-6).reverse().map((entry, i) => (
                <div key={i} className="xs dim">{formatDate(entry.at, sim.homeZone)} — {entry.action}</div>
              ))}
            </div>
          )}
          <p className="xs dim" style={{ marginTop: 'var(--s3)' }}>
            Conflicting traits stay mutually exclusive even here. Granting them all skips the ones that contradict.
          </p>
        </Panel>
      </div>
    </>
  );
}
