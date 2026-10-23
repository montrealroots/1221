/**
 * The one life brief 23's walk (`capture.mjs`) opens that no earlier brief had made: long names and large sums.
 *
 * - long: a new student in New York named Maximiliana-Josephine Evangeline Featherstonehaugh-Montgomery, from the
 *   inherited family ($2,400,000 in savings, $240,000 in checking), played three days by the clock.
 *
 * The walk's other lives were made before it and are read where they are: `saves/offer.json.gz` (b20-4 at 5 PM on 16
 * August 2029, the offer for Hester Vane standing; brief 22's captures, `../../career-genre-2026-10-22/captures/README.md`,
 * say how it was played), brief 22's `before`, `released` and `roles` (`../../career-genre-2026-10-22/app/saves/`), the
 * journey j01's year one, last term and degree (`tests/fixtures/journey-j01-*`), and the four older saves
 * (`tests/fixtures/old-*`).
 *
 * TEST SETUP, as brief 22's make-saves plays: the body kept fed, rested and awake as the clock moves, and Go pressed at
 * every stop, so nothing but the clock decides what happens.
 *
 * Run: npx vite-node docs/verification/ui-2026-10-23/app/make-saves.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createSave } from '@/engine';
import { newLifeFrom } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { serialise } from '@/engine/persistence/adapter';
import type { Simulation } from '@/engine/core/simulation';
import { answerStop } from '@/engine/world/clock';

const DIR = 'docs/verification/ui-2026-10-23/app/saves';
mkdirSync(DIR, { recursive: true });

function played(sim: Simulation, until: number): void {
  const tend = () => {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
  };
  while (sim.now < until) {
    tend();
    const wanted = Math.min(until, sim.now + 6 * MS_HOUR);
    let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
    for (let n = 0; r.interruptedBy && n < 50; n += 1) {
      tend();
      r = answerStop(sim, { item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, 'go').result!;
    }
  }
}

const long = createSave(1, 'b23-long', newLifeFrom({
  homeRegionId: 'us-ny-newyork', firstName: 'Maximiliana-Josephine', middleName: 'Evangeline',
  lastName: 'Featherstonehaugh-Montgomery', pronouns: 'she/her', wealth: 'inherited',
}));
played(long, long.now + 3 * MS_DAY);
writeFileSync(`${DIR}/long.json.gz`, gzipSync(serialise(long.universe)));
console.log(`long: ${new Date(long.now).toISOString()}, ${long.player.firstName} ${long.player.lastName}`);
