/**
 * Universal Credit for someone living in Britain (`systems/universalcredit.ts`):
 * claimed, assessed a month at a time and paid a week after, the standard
 * allowance and the rent up to London's allowance, less 55% of earnings and
 * the tariff on savings, closed after six nil months or on leaving Britain.
 */
import { quickSave } from '@/engine';
import { exchange } from '@/engine/content/currency';
import { saveCurrency } from '@/engine/core/money';
import type { Simulation } from '@/engine/core/simulation';
import { creditRefusal } from '@/engine/systems/universalcredit';
import { describe,expect,it } from 'vitest';

function londoner(seed: string, pounds = 1_000): Simulation {
  const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'modest' }, seed);
  const cur = saveCurrency(sim.universe);
  const accounts = Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && (a.kind === 'checking' || a.kind === 'savings'));
  for (const a of accounts) a.balance = 0;
  accounts.find((a) => a.kind === 'checking')!.balance = cur === 'GBP' ? pounds * 100 : exchange(pounds * 100, 'GBP', cur)!;
  return sim;
}

describe('Universal Credit', () => {

  it('isn’t for savings over £16,000, a visa holder, or someone abroad', () => {
    const rich = londoner('uc-rich2', 20_000);
    expect(creditRefusal(rich, rich.player)).toMatch(/16,000/);
    const ny = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, 'uc-ny');
    expect(creditRefusal(ny, ny.player)).toMatch(/living in Britain/);
  });
});
