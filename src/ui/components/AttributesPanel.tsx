/**
 * SLATE — the actor's attributes, as the School screen shows them
 * (`systems/attributes.ts`): composure, and what it does now.
 *
 * Presence, reputation and recognition were shown here too, with what the
 * business read of them: auditions, the showcase, an agency's sends and a
 * quote over scale. The career went in the scope reset of 2026-10-09, and
 * with it everything that read the three, so they aren't shown
 * (`docs/UNBITTEN.md`).
 */

import { useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { ATTRIBUTES } from '@/engine/systems/attributes';

const whole = (x: number) => String(Math.round(x));

export function AttributesPanel() {
  const attrs = useWorld((s) => s.player.attrs);
  if (!attrs) return null;
  const nerves = Math.round(100 * ATTRIBUTES.nerves.focusCost * (1 - attrs.composure / 100));
  return (
    <Panel title="Your Composure" subtitle="What nerves take from a performance">
      <div className="col gap-3">
        <Stat label="Composure" value={whole(attrs.composure)} note={nerves > 0 ? `Nerves take up to ${nerves}% off a performance, and add stress` : 'Nerves take nothing off the work'} />
        <p className="small" style={{ margin: 0 }}>Composure grows with every performance and with scene study.</p>
        <Fine>What it does, and how fast it moves, is SLATE’s estimate: nothing published puts a scale on it.</Fine>
      </div>
    </Panel>
  );
}
