/**
 * SLATE — the actor’s composure, as the School screen shows it
 * (`systems/attributes.ts`), and what it does now.
 *
 * Presence, reputation and recognition were shown here too, with what the
 * business read of them: auditions, the showcase, an agency’s sends and a
 * quote over scale. The career went in the scope reset of 2026-10-09, and
 * with it everything that read the three, so they aren’t shown
 * (`docs/UNBITTEN.md`). Until the connected attributes of 2026-10-09 this
 * said nerves took up to 18% off a performance; composure is read in a
 * night’s consistency by the evaluation since (`systems/evaluation.ts`), and
 * every ability is on the Player Profile. Until 2026-10-16 the panel said composure "holds a performance’s consistency,
 * and it grows with every performance": it holds consistency in a scene, a song, a tape and an audition as well as a
 * night, and recovery from a slip, and it's practised too (attributes-matrix.md).
 */

import { useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { ATTRIBUTES } from '@/engine/systems/attributes';
import { personalityOf } from '@/engine/systems/personality';

const whole = (x: number) => String(Math.round(x));

export function AttributesPanel() {
  const player = useWorld((s) => s.player);
  const attrs = player.attrs;
  if (!attrs) return null;
  const stress = Math.round(ATTRIBUTES.eventWeight.performance * (1 - attrs.composure / 100) * personalityOf(player, 'stressGain') * 10) / 10;
  return (
    <Panel title="Your Composure" subtitle="What nerves do to a performance">
      <div className="col gap-3">
        <Stat label="Composure" value={whole(attrs.composure)} note={stress > 0 ? `Nerves add ${stress} stress before a performance` : 'Nerves add no stress'} />
        <p className="small" style={{ margin: 0 }}>Composure keeps your work consistent under pressure, in a scene, a song, a self-tape, an audition and a night on stage, and steadies you after a slip. A little comes with every night in front of an audience, and the Graded Exposure exercise trains it.</p>
        <Fine>Source: Reeves et al. (2022), on performance anxiety falling with exposure. How fast it moves here is estimated.</Fine>
      </div>
    </Panel>
  );
}
