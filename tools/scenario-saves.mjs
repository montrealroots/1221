/**
 * SLATE — the scenario saves the built app's acceptance run opens (`tools/acceptance-ui.mjs`, its SAVEDIR), written
 * again on the engine as it stands (from 2026-10-16, the sweep). Each is a life played by `tools/scenarios.ts` to where a
 * journey a new life can't reach in a session begins: a tax balance owed, a decision waiting, a later term, a scene with a
 * director's note. Until that day the list of the fourteen, their seeds and their lengths lived in a session's
 * scratchpad, and a fresh session couldn't write them again.
 *
 *   node tools/scenario-saves.mjs DIR
 *
 * Runs four at a time, as the scratchpad's script did; the direction save is played in three legs from its own last save.
 * Each run's output is DIR/<name>.log, and DIR/exits.txt says each one's exit. It exits 1 if any run did.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, appendFileSync, createWriteStream } from 'node:fs';
import { join } from 'node:path';

const DIR = process.argv[2];
if (!DIR) { console.error('Usage: node tools/scenario-saves.mjs DIR'); process.exit(2); }
mkdirSync(DIR, { recursive: true });

const run = (name, args) => new Promise((resolve) => {
  const log = createWriteStream(join(DIR, `${name}.log`));
  const child = spawn('npx', ['vite-node', 'tools/scenarios.ts', '--', ...args], { shell: process.platform === 'win32' });
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  child.on('close', (code) => { appendFileSync(join(DIR, 'exits.txt'), `${name} exit=${code}\n`); resolve(code); });
});
const save = (file) => ['--save', join(DIR, file)];

const batches = [
  [
    () => run('brief', ['--scenario', 'brief', '--seed', 'sc-0', ...save('brief.json')]),
    () => run('rehearsal', ['--scenario', 'rehearsal', '--seed', 'sc-0', '--years', '0.6655', ...save('rehearsal.json')]),
    () => run('decision', ['--scenario', 'nonfiler', '--seed', 'sc-0', '--years', '0.47', ...save('decision.json')]),
    () => run('nonfiler', ['--scenario', 'nonfiler', '--seed', 'sc-0', '--years', '1.15', ...save('nonfiler.json')]),
  ],
  [
    () => run('roundups', ['--scenario', 'roundups', '--seed', 'sc-0', ...save('roundups.json')]),
    () => run('lien', ['--scenario', 'lien', '--seed', 'sc-0', ...save('lien.json')]),
    () => run('missed', ['--scenario', 'missed-plan', '--seed', 'sc-0', ...save('missed-plan.json')]),
    () => run('withdraw', ['--scenario', 'withdraw', '--seed', 'sc-0', '--years', '1', ...save('withdraw.json')]),
  ],
  [
    () => run('leave', ['--scenario', 'leave', '--seed', 'sc-0', '--years', '1.5', ...save('leave.json')]),
    () => run('tax', ['--scenario', 'tax-plan', '--seed', 'sc-0', '--years', '0.75', ...save('tax.json')]),
    () => run('workload', ['--scenario', 'workload', '--seed', 'sc-0', ...save('workload.json')]),
    async () => {
      const a = await run('dir1', ['--scenario', 'direction', '--seed', 'sc-1', '--years', '0.15', ...save('dir1.json')]);
      if (a !== 0) return a;
      const b = await run('dir2', ['--scenario', 'direction', '--from', join(DIR, 'dir1.json'), '--years', '0.2', ...save('dir2.json')]);
      if (b !== 0) return b;
      return run('direction', ['--scenario', 'direction', '--from', join(DIR, 'dir2.json'), '--years', '0.45', ...save('direction.json')]);
    },
  ],
];

let failed = 0;
for (const batch of batches) for (const code of await Promise.all(batch.map((f) => f()))) if (code !== 0) failed += 1;
console.log(failed ? `${failed} run(s) failed; see ${join(DIR, 'exits.txt')}.` : `Every save written to ${DIR}.`);
process.exit(failed ? 1 : 0);
