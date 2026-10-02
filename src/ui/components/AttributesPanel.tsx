/**
 * SLATE — the actor's attributes, as the School and Career screens show them
 * (`systems/attributes.ts`): presence, composure, reputation and recognition,
 * each with what it does now.
 */

import { useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { ATTRIBUTES, overscaleOf, sendsFactor } from '@/engine/systems/attributes';

const whole = (x: number) => String(Math.round(x));

export function AttributesPanel() {
  const attrs = useWorld((s) => s.player.attrs);
  if (!attrs) return null;
  const sends = sendsFactor(attrs.reputation);
  const over = overscaleOf(attrs.recognition);
  const nerves = Math.round(100 * ATTRIBUTES.nerves.focusCost * (1 - attrs.composure / 100));
  return (
    <Panel title="Your Attributes" subtitle="What the business reads beside the craft">
      <div className="col gap-3">
        <div className="grid grid-4">
          <Stat label="Presence" value={whole(attrs.presence)} note="Read at every audition and the showcase; grows slowly with audiences" />
          <Stat label="Composure" value={whole(attrs.composure)} note={nerves > 0 ? `Nerves take up to ${nerves}% off an audition or a performance, and add stress` : 'Nerves take nothing off the work'} />
          <Stat label="Reputation" value={whole(attrs.reputation)} note={`Called in ${Math.round(sends * 100)}% as often as the agency’s and the sites’ usual`} />
          <Stat label="Recognition" value={whole(attrs.recognition)} note={over > 1 ? `Quoted at ${Math.round(over * 100)}% of scale` : 'Paid at scale: the public doesn’t know the name yet'} />
        </div>
        <p className="small" style={{ margin: 0 }}>
          Presence is mostly given. Composure grows with every audition and performance. Reputation is earned by work done and calls kept, the degree and a good showing, and lost by a missed day, a firing or a missed audition. Recognition comes from screen work that airs, and Broadway, and fades a little each month without it.
        </p>
        <Fine>What each does, and how fast each moves, is SLATE’s estimate: the trades publish no scale for any of the four.</Fine>
      </div>
    </Panel>
  );
}
