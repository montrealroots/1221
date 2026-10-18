/**
 * Saves that hold the health area's new notice words (brief 14, 2026-10-17), for the text walk to read on Home at 1440
 * and 390 wide: the scenario saves hold their notices in the words of their day, so these lives are played on today's
 * code through the commands and the clock, as `render2.ts` plays them, and written as a save is written (`serialise`).
 *
 *   npx vite-node docs/verification/language-2026-10-17/health/notice-saves.ts -- OUTDIR
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { quickSave, type Simulation } from '../../../../src/engine';
import { MS_DAY, MS_HOUR, instantFromZoned } from '../../../../src/engine/core/time';
import { healthOf } from '../../../../src/engine/systems/health';
import { earningsOf } from '../../../../src/engine/systems/earnings';
import { serialise } from '../../../../src/engine/persistence/adapter';

const [OUT = 'notice-saves'] = process.argv.slice(2).filter((a) => a !== '--');
mkdirSync(OUT, { recursive: true });
const at = (y: number, m: number, d: number, h = 12, zone = 'America/New_York') => instantFromZoned({ year: y, month: m, day: d, hour: h, minute: 0 }, zone);
const life = (city: string, seed: string, wealth = 'comfortable', slot: 1 | 2 | 3 = 1): Simulation => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth } as never, seed, slot);
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}
const lastMonth = (sim: Simulation): string => {
  const d = new Date(sim.now);
  const [y, m] = d.getUTCMonth() === 0 ? [d.getUTCFullYear() - 1, 12] : [d.getUTCFullYear(), d.getUTCMonth()];
  return `${y}-${String(m).padStart(2, '0')}`;
};
const write = (name: string, sim: Simulation) => {
  writeFileSync(`${OUT}/${name}.json`, serialise(sim.universe));
  console.log(name, sim.universe.notifications.filter((n) => n.category === 'health').map((n) => n.title).join(' | '));
};

// Los Angeles: a marketplace plan bought in open enrollment and dropped.
{
  const sim = life('us-ca-losangeles', 'h2-la');
  tended(sim, at(2026, 11, 3, 12, 'America/Los_Angeles'));
  sim.execute({ kind: 'health.enroll', payload: {} } as never);
  tended(sim, at(2027, 1, 5, 12, 'America/Los_Angeles'));
  sim.execute({ kind: 'health.drop', payload: {} } as never);
  tended(sim, at(2027, 2, 3, 12, 'America/Los_Angeles'));
  write('h-la-dropped', sim);
}
// New Haven: Covered Connecticut, then out of status.
{
  const sim = life('us-ct-newhaven', 'h2-nh-cc', 'scraping');
  earningsOf(sim.player).months[lastMonth(sim)] = 2_052_00;
  sim.execute({ kind: 'health.enroll', payload: {} } as never);
  sim.player.usOutOfStatus = sim.now;
  tended(sim, sim.now + 40 * MS_DAY);
  write('h-nh-status', sim);
}
// Vancouver: a prescription past its date, its renewal booked.
{
  const sim = life('ca-bc-vancouver', 'g03-van-1');
  const c = healthOf(sim.player).chronic?.depression;
  if (c) c.prescribedAt = at(2024, 1, 20, 12, 'America/Vancouver');
  tended(sim, at(2026, 1, 26, 12, 'America/Vancouver'));
  write('h-van-rx', sim);
}
