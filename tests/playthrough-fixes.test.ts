/**
 * What the 2026-09-28 playthrough found and what was fixed: a sleep that
 * slept through the next call, an offer that kept a Take It it couldn't
 * honor, and a statement notice every month for every account.
 */

import { quickSave } from '@/engine';
import { evenCraft } from '@/engine/systems/school';
import { alertsOf,statementReady } from '@/engine/systems/statements';
import { describe,expect,it } from 'vitest';

const pro = (seed: string) => {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(75);
  return sim;
};

describe('statement notices', () => {
  it('tells of a statement with a payment due always, and of the rest only where asked', () => {
    const sim = pro('fix-statements');
    const p = sim.player;
    expect(alertsOf(p).statements).toBe(false);
    const account = Object.values(sim.universe.accounts).find((a) => a.ownerId === p.id)!;
    const count = () => sim.universe.notifications.filter((n) => n.title.startsWith('Statement Ready')).length;
    statementReady(sim, p, account, 'Nothing owed.');
    expect(count()).toBe(0);
    statementReady(sim, p, account, '$40 to pay.', true);
    expect(count()).toBe(1);
    sim.must({ kind: 'bank.set_alerts', payload: { statements: true } });
    statementReady(sim, p, account, 'Nothing owed.');
    expect(count()).toBe(2);
  });
});
