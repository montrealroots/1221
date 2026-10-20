/**
 * Brief 15, the school area, batch 3: a medical leave played through commands, and every notice it gives printed as
 * the player reads it, for the batch record (`batches.md`). The journey is `tests/leave.test.ts`'s first: asked for
 * with the flu, decided, a notice of return given with a clearance, and the return registered.
 *
 *   npx vite-node docs/verification/editorial-2026-10-19/school/leave.mts > docs/verification/editorial-2026-10-19/school/leave.txt
 */
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { termStart } from '@/engine/systems/school';
import { healthOf } from '@/engine/systems/health';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
const TITLES = ['Your Leave Has Begun', 'Two Weeks To Give Notice', 'Back From Your Leave', 'The Class Of', 'Not Registered'];
const seen = new Set<string>();
const print = (sim: Simulation, step: string) => {
  for (const n of sim.universe.notifications) {
    if (seen.has(n.id) || !TITLES.some((t) => n.title.startsWith(t))) continue;
    seen.add(n.id);
    console.log(`${step} | ${n.title}: ${n.body}`);
  }
};

const sim = createSave(1, 'lv-med', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
tended(sim, at(2026, 10, 5));
healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
tended(sim, asked.decideAt + MS_HOUR);
print(sim, 'decided');
const by = sim.player.school!.leave!.noticeBy!;
tended(sim, by - 13 * MS_DAY);
print(sim, 'two weeks before');
sim.must({ kind: 'school.return_notice', payload: {} });
const back = termStart(2).date;
tended(sim, at(back.year, back.month, back.day, 12));
print(sim, 'term begins');
tended(sim, at(back.year, back.month, back.day + 3, 18));
print(sim, 'classes, unregistered');
