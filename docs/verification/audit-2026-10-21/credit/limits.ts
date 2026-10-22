/**
 * Brief 20's D2 measurement (criteria.md): each of creation's six starting means, from one seed, played six years from
 * 24 August 2026 by the playthroughs' TEST SETUP clock (six hours at a time, the body kept fed and rested and the
 * coursework prepared each midnight, as `docs/verification/career-2026-10-20/playthroughs/play.ts` brings a life to its
 * last term), and every card's limit read at each change, with the past twelve months' income from the earnings record
 * and the money held in the bank, and once more at the end. The clock's TEST SETUP keeps a life going; it sets nothing a
 * card's review reads but the days passing.
 *
 *   npx vite-node docs/verification/audit-2026-10-21/credit/limits.ts -- <out.jsonl> [seed] [years]
 */
import { appendFileSync, writeFileSync } from 'node:fs';
import { createSave } from '../../../../src/engine';
import { MS_HOUR, formatDate, instantFromZoned, zonedParts } from '../../../../src/engine/core/time';
import { newLifeConfig, type StartingWealth } from '../../../../src/engine/world/bootstrap';
import { PREP_DIMS } from '../../../../src/engine/content/coursework';
import { courseworkOf } from '../../../../src/engine/systems/coursework';
import { cardsOf } from '../../../../src/engine/systems/credit';
import { earningsOf } from '../../../../src/engine/systems/earnings';
import { bankAccountsOf } from '../../../../src/engine/systems/banking';

const [out, seed = 'b20-credit', yearsArg = '6'] = process.argv.slice(2);
const MEANS: StartingWealth[] = ['nothing', 'scraping', 'modest', 'comfortable', 'wealthy', 'inherited'];
const zone = 'America/New_York';
writeFileSync(out, '');
for (const wealth of MEANS) {
  const sim = createSave(1, seed, { ...newLifeConfig(), wealth, homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) {
      if (a.status !== 'open' && a.status !== 'revising') continue;
      for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
    }
  });
  const p = sim.player;
  const start = zonedParts(sim.now, zone);
  const until = instantFromZoned({ year: start.year + Number(yearsArg), month: start.month, day: start.day, hour: 7, minute: 0 }, zone);
  const income12 = (): number => {
    const now = zonedParts(sim.now, zone);
    let sum = 0;
    for (let i = 1; i <= 12; i += 1) {
      const m = new Date(Date.UTC(now.year, now.month - 1 - i, 1));
      sum += earningsOf(p).months[`${m.getUTCFullYear()}-${String(m.getUTCMonth() + 1).padStart(2, '0')}`] ?? 0;
    }
    return sum;
  };
  const held = (): number => bankAccountsOf(sim, p).reduce((s, a) => s + Math.max(0, a.balance), 0);
  const line = (why: string): void => {
    for (const c of cardsOf(sim, p)) appendFileSync(out, JSON.stringify({ wealth, seed, at: formatDate(sim.now, zone), why, card: c.name, limit: (c.creditLimit ?? 0) / 100, owed: Math.max(0, -c.balance) / 100, score: Math.round(p.credit?.score ?? 0), income12: income12() / 100, held: held() / 100 }) + '\n');
  };
  line('start');
  const last = new Map<string, number>();
  for (const c of cardsOf(sim, p)) last.set(c.id, c.creditLimit ?? 0);
  let year = start.year;
  while (sim.now < until && sim.universe.meta.endedAt === undefined) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
    for (const c of cardsOf(sim, p)) if (last.get(c.id) !== c.creditLimit) { line('changed'); last.set(c.id, c.creditLimit ?? 0); }
    const y = zonedParts(sim.now, zone).year;
    if (y !== year) { year = y; line('new year'); }
  }
  line('end');
  console.log(`${wealth} done`);
}
