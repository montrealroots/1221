/**
 * The saves brief 22's built-app walk opens (`walk.mjs`), from b20-4's own save of 1 September 2029
 * (`tests/fixtures/b22/b20-4-opt-2029-09-01.json.gz`, the life that worked 47 days after its OPT ended until brief 22),
 * played on by the clock, then written as the game writes a slot (`serialise`), gzipped:
 *
 * - before: 1 September 2029 at 2 PM, The Winter Ledger booked to begin on the 4th, OPT at 88 days without work as its
 *   weekly count left it: Papers says when OPT will run out, the run booked as if it goes ahead;
 * - released: 2 September 2029 at 9 AM, OPT ended at the end of 1 September: Papers says OPT ended, and Booked Work's
 *   history says the run was released and why;
 * - roles: a new student in New York, played a day at a time until a role open to anyone is posted: Opportunities says
 *   What It Asks in words.
 *
 * TEST SETUP, as tests/b22-authorization.test.ts plays it: the body kept fed, rested and awake as the clock moves, and Go
 * pressed at every stop, so nothing but the clock and permission decides what happens.
 *
 * Run: npx vite-node docs/verification/career-genre-2026-10-22/app/make-saves.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned, MS_DAY, MS_HOUR } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import type { Simulation } from '@/engine/core/simulation';
import { answerStop } from '@/engine/world/clock';

const DIR = 'docs/verification/career-genre-2026-10-22/app/saves';
mkdirSync(DIR, { recursive: true });
const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 12) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);
const opened = () => loadSave(deserialise(gunzipSync(readFileSync('tests/fixtures/b22/b20-4-opt-2029-09-01.json.gz')).toString('utf8')) as never);
const write = (name: string, sim: Simulation, said: string) => { writeFileSync(`${DIR}/${name}.json.gz`, gzipSync(serialise(sim.universe))); console.log(`${name}: ${new Date(sim.now).toISOString()}; ${said}`); };

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

const before = opened();
played(before, at(2029, 9, 1, 14));
write('before', before, `The Winter Ledger ${before.player.pro!.engagements.find((e) => e.projectId === 'winter-ledger-hester')?.status}`);

const released = opened();
played(released, at(2029, 9, 2, 9));
write('released', released, `The Winter Ledger ${released.player.pro!.engagements.find((e) => e.projectId === 'winter-ledger-hester')?.status}`);

// No role is posted to b20-4 once its OPT has ended (three weeks played on, none), so What It Asks is read on a new
// student's Opportunities tab, played a day at a time until a role open to anyone is posted, as
// tests/pro-opportunities-screen.test.ts plays one.
const roles = createSave(1, 'b22-app-roles', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const posted = () => roles.player.pro?.opportunities.filter((o) => o.status === 'open' && o.via === 'open' && roles.now < o.submitBy - MS_DAY) ?? [];
for (let n = 0; n < 70 && !posted().length; n += 1) played(roles, roles.now + MS_DAY);
write('roles', roles, `open roles: ${posted().map((o) => o.projectId).join(', ') || 'none'}`);
