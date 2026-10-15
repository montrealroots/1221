/**
 * SLATE — two saves that show a way of playing rehearsed in to its scene's own mark (from 2026-10-16, the sweep;
 * docs/verification/sweep-2026-10-16/). A mastered actor, as `tests/briefs.test.ts` ("found by the sweep") plays it,
 * chooses brief-rockumentary-2 played Set, against the grain there and complete at 97%, and prepares it a day at a time:
 * - `rock-mid.json`, the moment rehearsal's own part is full and the choice is past 90% and short of its mark (93.5%).
 *   Until the sweep, Rehearse It On Your Feet was refused there ("There's nothing more to gain from it now."), and the
 *   choice stalled; from it, the step stays open;
 * - `rock.json`, twenty days on: the choice rehearsed in to 98%, complete, and the take at 100.
 * `tools/captures.mjs` opens both in the built app.
 *
 *   npx vite-node tools/rehearsal-mark-saves.ts -- DIR
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createSave } from '../src/engine';
import { newLifeConfig } from '../src/engine/world/bootstrap';
import { MS_DAY } from '../src/engine/core/time';
import { BRIEF_BY_ID } from '../src/engine/content/briefs';
import { MASTERED } from '../src/engine/content/abilities';
import { briefMaterial, prepareRefusal, readingOf, sceneOf } from '../src/engine/systems/briefs';
import { requiredFor } from '../src/engine/systems/interpretation';
import { evenCraft } from '../src/engine/systems/school';
import { abilityFull } from '../src/engine/systems/attributes';
import { genreState } from '../src/engine/systems/engagement';
import { serialise } from '../src/engine/persistence/adapter';

const DIR = process.argv.at(-1)!;
mkdirSync(DIR, { recursive: true });
const b = BRIEF_BY_ID['brief-rockumentary-2']!;
const sim = createSave(1, 'rock-mark-shot', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
// TEST SETUP, as the test's: nothing else booked, a rested day before each step, a mastered actor who knows the genre.
const clear = () => { for (const it of sim.universe.scheduled) if (it.status === 'pending' && it.requiresPlayer) sim.timeline.cancel(it.id, sim.now); };
const rest = () => Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
const p = sim.player;
p.craft = evenCraft(MASTERED);
for (const k of ['emotion', 'memorization', 'voice', 'movement'] as const) p.craft[k] = 100;
p.attrs = { presence: 100, composure: 100, listening: 100, imagination: 100, focus: 100, adaptability: 100, discipline: 100 } as typeof p.attrs;
p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
genreState(p, b.kinds[0]!).familiarity = 100;
const mark = requiredFor(['set'], briefMaterial(b), sceneOf(b, readingOf(b, b.readings[0]!.id)));
clear(); rest();
const chose = sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id, structure: 'set' } });
if (!chose.ok) throw new Error(`brief.choose: ${chose.error}`);
const rec = () => sim.player.briefs![b.id]!;
const write = (file: string) => { clear(); rest(); p.wellbeing.fitness = abilityFull(sim, p, 'stamina'); writeFileSync(join(DIR, file), serialise(sim.universe)); };
let mid = false;
for (let day = 0; day < 20; day += 1) {
  sim.advanceTo(sim.now + MS_DAY);
  for (const step of ['read', 'lines', 'rehearse']) {
    clear(); rest(); sim.execute({ kind: 'brief.prepare', payload: { brief: b.id, step } });
    const r = rec();
    if (!mid && r.prep.rehearsal >= 0.97 && r.playing!.prep > 0.9 && r.playing!.prep < mark) {
      mid = true;
      write('rock-mid.json');
      console.log(`rock-mid.json: rehearsal ${r.prep.rehearsal.toFixed(3)}, the choice ${r.playing!.prep.toFixed(3)} of ${mark}; Rehearse: ${prepareRefusal(sim, p, b, 'rehearse') ?? 'open'}`);
    }
  }
}
write('rock.json');
console.log(`rock.json: rehearsal ${rec().prep.rehearsal.toFixed(3)}, the choice ${rec().playing!.prep.toFixed(3)} of ${mark}; Rehearse: ${prepareRefusal(sim, p, b, 'rehearse') ?? 'open'}`);
if (!mid) { console.error('No moment with the choice past 90% and short of its mark: the brief or the rules have moved.'); process.exit(1); }
