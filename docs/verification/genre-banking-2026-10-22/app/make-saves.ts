/**
 * The saves brief 21's built-app walk opens (`walk.mjs`), each a new life played by the clock through the commands a
 * player sends, then written as the game writes a slot (`serialise`), gzipped:
 *
 * - behind: a Chase card's autopay bounced on 13 October and 13 November 2026 (the checking moved to savings the hour
 *   before), played to 14 December, the day after the 61st day's notice: the card's panel says what's past due;
 * - capone: Capital One's savings on 2 September 2026: the account says its 3.00% APY and the rate a day's interest is
 *   worked from;
 * - london: a Barclays current account in London with a standing order on the 3rd, on 1 April 2026, before Good Friday.
 *
 * Run: npx vite-node docs/verification/genre-banking-2026-10-22/app/make-saves.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned } from '@/engine/core/time';
import { serialise } from '@/engine/persistence/adapter';
import type { Simulation } from '@/engine/core/simulation';

const DIR = 'docs/verification/genre-banking-2026-10-22/app/saves';
mkdirSync(DIR, { recursive: true });
const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 12, zone = NY) => instantFromZoned({ year: y, month: m, day: d, hour: h }, zone);
const student = (seed: string, bankId: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId });
const own = (sim: Simulation, kind: string) => sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === kind && !a.closedAt && !a.nominal && a.category !== 'term')!;
const write = (name: string, sim: Simulation) => { writeFileSync(`${DIR}/${name}.json.gz`, gzipSync(serialise(sim.universe))); console.log(`${name}: ${new Date(sim.now).toISOString()}`); };

const behind = student('b21-app-behind', 'us-chase');
behind.must({ kind: 'bank.set_payments', payload: { everyday: 'credit' } });
behind.must({ kind: 'finance.set_autopay', payload: { mode: 'full' } });
for (const due of [at(2026, 10, 13), at(2026, 11, 13)]) {
  behind.advanceTo(due - 3_600_000);
  const checking = own(behind, 'checking');
  if (checking.balance > 0) behind.must({ kind: 'bank.transfer', payload: { fromId: checking.id, toId: own(behind, 'savings').id, amount: checking.balance } });
  behind.advanceTo(due + 60_000);
}
behind.advanceTo(at(2026, 12, 14, 9));
write('behind', behind);

const capone = student('b21-app-capone', 'us-capital-one');
capone.advanceTo(at(2026, 9, 2, 9));
write('capone', capone);

const London = 'Europe/London';
const london = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'comfortable', bankId: 'gb-barclays' }, 'b21-app-london');
london.must({ kind: 'bank.add_standing_order', payload: { toId: own(london, 'savings').id, amount: 100_00, day: 3 } });
london.advanceTo(at(2026, 4, 1, 9, London));
write('london', london);
