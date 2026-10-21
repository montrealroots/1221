/**
 * The saves the time area's walks open (brief 19, D1 to D4, 2026-10-20). Each is a new life played on by the game's own
 * moves, the way a player makes them: a jump with every stop gone to (Go), a plan put on the calendar (`calendar.schedule`),
 * a night slept (`life.sleep`) and the clock paused (`world.set_preferences`). Nothing is set by hand.
 *
 *   npx vite-node docs/verification/career-2026-10-20/time/make-saves.ts -- OUTDIR
 *
 * - `night.json`: Thursday, August 27, 2026, at 11:00 PM, with two plans of the player's own on the way to the morning, one
 *   from 11:30 PM to 12:30 AM (across midnight) and one at 2:00 AM, and Friday's classes at 9:00 AM.
 * - `bedtime.json`: the same Thursday at 11:00 PM, nothing on the calendar before Friday's classes at 9:00 AM.
 * - `morning.json`: Saturday, August 29, 2026, at 7:15 AM, up from a night slept from 11:15 PM, with a plan of the player's
 *   own on Sunday at 9:00 AM.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createSave } from '../../../../src/engine';
import type { Simulation } from '../../../../src/engine/core/simulation';
import { newLifeConfig } from '../../../../src/engine/world/bootstrap';
import { serialise } from '../../../../src/engine/persistence/adapter';
import { MS_MINUTE, formatDateTime, instantFromZoned } from '../../../../src/engine/core/time';

const OUT = process.argv.at(-1) ?? '.';
mkdirSync(OUT, { recursive: true });
const NY = 'America/New_York';
const at = (day: number, hour: number, minute = 0) => instantFromZoned({ year: 2026, month: 8, day, hour, minute }, NY);

function life(): Simulation {
  const sim = createSave(1, 'b19-time', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  sim.must({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } });
  return sim;
}
/** A jump to `wanted`, every stop on the way gone to, as Go carries it on. */
function jump(sim: Simulation, wanted: number): void {
  let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
  while (r.interruptedBy) {
    const item = r.interruptedBy;
    r = sim.advanceTo(Math.max(wanted, item.at + (item.durationMinutes ?? 0) * MS_MINUTE), { stopOnPlayerRequired: true, resumes: r.sentFrom });
  }
}
const plan = (sim: Simulation, title: string, when: number, minutes: number) => sim.must({ kind: 'calendar.schedule', payload: { title, at: when, durationMinutes: minutes } });
const write = (sim: Simulation, name: string) => {
  writeFileSync(`${OUT}/${name}`, serialise(sim.universe));
  const next = sim.timeline.next(sim.now - 1, (i) => i.requiresPlayer === true);
  console.log(`${name}: ${formatDateTime(sim.now, NY)}; next commitment ${next ? `${next.label}, ${formatDateTime(next.at, NY)}` : 'none'}; energy ${sim.player.wellbeing.energy.toFixed(1)}`);
};

{
  const sim = life();
  jump(sim, at(27, 23));
  plan(sim, 'Meet Sam At The Station', at(27, 23, 30), 60);
  plan(sim, 'Call Home', at(28, 2), 30);
  write(sim, 'night.json');
}
{
  const sim = life();
  jump(sim, at(27, 23));
  write(sim, 'bedtime.json');
}
{
  const sim = life();
  jump(sim, at(28, 23, 15));
  sim.must({ kind: 'life.sleep', payload: { hours: 8 } });
  plan(sim, 'Run Lines With Sam', at(30, 9), 60);
  write(sim, 'morning.json');
}
