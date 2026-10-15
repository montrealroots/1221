/**
 * SLATE — What To Improve Next against what training actually brings, played (from 2026-10-16;
 * docs/verification/advice-2026-10-16/criteria.md, F2-A).
 *
 * Each case is a student who tapes three briefs through the game's commands. The advice is read (`adviceFor`). Then, for
 * every ability and technique the work read that has an exercise, a copy of the save plays twenty sessions of it, one a
 * day, through `practice.exercise`; a baseline copy lives the same days without them. What each copy's training brought is
 * its `forecast` of the three briefs less the baseline's. Abilities are drawn from the seed (TEST SETUP), and every hour a
 * calendar item would take is cleared, so every copy lives the same days.
 *
 *   npx vite-node tools/advice.ts -- --from 0 --to 10 [--out file.json]
 */
import { writeFileSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import { MASTERED, type AbilityId } from '../src/engine/content/abilities';
import { exerciseFor } from '../src/engine/content/practice';
import { adviceFor } from '../src/engine/systems/next-steps';
import { trainingForecast } from '../src/engine/systems/advice';
import { matchedTier } from '../src/engine/systems/practice';
import { abilityFull, isAbility, levelOf } from '../src/engine/systems/attributes';
import { practicedDaysAgo, recommendations } from '../src/engine/systems/experience';
import { identityOf } from '../src/engine/systems/artistry';
import { realize, setUp } from './advice-harness';

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1]! : d; };
const FROM = Number(arg('from', '0'));
const TO = Number(arg('to', '10'));

const cases: unknown[] = [];
for (let n = FROM; n < TO; n += 1) {
  const seed = `adv-${n}`;
  const { sim, briefs } = setUp(seed);
  const advice = adviceFor(sim, sim.player);
  const first = advice.find((x) => x.forecast);
  const predicted = trainingForecast(sim, sim.player);
  // The advice as it was before 2026-10-16: the same call with no forecast, ranked by what each limit cost made whole.
  const before = recommendations((id) => levelOf(sim, sim.player, id as never), (id) => (isAbility(id as never) ? abilityFull(sim, sim.player, id as AbilityId) : MASTERED), sim.player.work ?? [], (id) => exerciseFor(id as never), matchedTier, 12, practicedDaysAgo(sim.player, sim.now, sim.homeZone), identityOf(sim.player).recurring).find((x) => x.exercise)?.target;
  const chief = sim.player.work!.at(-1)!.limits.find((l) => l.kind === 'ability' || l.kind === 'technique')?.what;
  const realized = realize(sim, briefs, predicted.keys());
  const best = Object.entries(realized).sort((a, b) => b[1] - a[1])[0]!;
  const said = first ? [first.target, ...(advice.filter((x) => first.tiedWith?.includes(x.label)).map((x) => x.target))] : [];
  const passBefore = before !== undefined && (realized[before] ?? -Infinity) >= best[1] - 0.1;
  const pass = first !== undefined && (realized[first.target]! >= best[1] - 0.1 || said.includes(best[0]));
  cases.push({ seed, briefs, first: first?.target, tiedWith: first?.tiedWith ?? [], chief, chiefIsFirst: chief === first?.target, before, passBefore, chiefPass: chief !== undefined && (realized[chief] ?? -Infinity) >= best[1] - 0.1, predicted: Object.fromEntries([...predicted].map(([k, v]) => [k, v.points])), realized, best: best[0], bestGain: best[1], firstGain: first ? realized[first.target] : undefined, pass });
  console.log(`${seed} first=${first?.target} best=${best[0]} (${best[1]}) first gained ${first ? realized[first.target] : '-'} chief=${chief} ${pass ? 'PASS' : 'MISS'}`);
}
const out = arg('out', '');
if (out) writeFileSync(out, `${JSON.stringify(cases, null, 1)}\n`);
