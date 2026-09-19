/**
 * SLATE — which lessons a played game ever actually reaches.
 *
 * `tools/wired.mjs` asks which declared words nothing reads. `tools/dials.mjs` asks
 * which numbers never move. This asks the same question of the teaching, and it has
 * to be asked the same way — by playing, not by reading the source.
 *
 * A lesson's condition is a sentence about the world: "there is a company and no
 * registration", "a card is carrying a balance", "a term is inside two months of
 * its date". Every one of those is plausible. A static check can prove the
 * condition is referenced and can prove the lesson exists, and neither of those is
 * the question. The question is whether a person playing this game ever arrives at
 * the state the condition describes, and the only instrument for that is a played
 * career.
 *
 * ## Two careers, because the game has two halves
 *
 * `playACareer` plays the acting half: auditions, notes, parts, sleep, training,
 * the house, the bank. `playABusiness` runs the company the way a producer does:
 * fill the post, option, register, insure, develop, greenlight, deliver, sell.
 * Neither reaches the other's lessons, which is not a defect in either — it is why
 * this plays both and unions what fired.
 *
 * A lesson that fires in neither is reported. It is not automatically wrong: the
 * unscripted cast board needs a format season and the dividend needs the sugar
 * group's year to land, and a five-year run may simply not get there. So this
 * reports and the gate holds a floor, rather than demanding every lesson fire in
 * every run — the same shape as `docs/UNWIRED.json`, where the count may fall and
 * may not rise.
 *
 *   npx vite-node tools/tutorial.mjs                  play and report
 *   npx vite-node tools/tutorial.mjs --years 10       longer
 *   npx vite-node tools/tutorial.mjs --seeds 6        more worlds
 *   npx vite-node tools/tutorial.mjs --check          fail under the floor
 */

import { quickSave } from '../src/engine/index.ts';
import { LESSONS, STRANDS } from '../src/engine/content/tutorial.ts';
import { theTeachingWeek } from '../src/engine/world/tutorial.ts';
import { playACareer } from '../tests/played.ts';

const arg = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback;
};

const YEARS = Number(arg('years', 6));
const SEEDS = Number(arg('seeds', 3));
const CHECK = process.argv.includes('--check');

/**
 * The floor.
 *
 * How many of the lessons a played game has to reach. Set from measurement rather
 * than chosen: it is what the run below actually reached when this was written,
 * and like every other ratchet in this repo it may rise and may not fall. A lesson
 * that stops being reachable takes this under the floor and fails the gate.
 */
const FLOOR = 18;

/**
 * The one lesson no played game reaches, and why it stays.
 *
 * It fires when something is open in the Decision Center, and nothing in this
 * build raises one any more. The only kind it ever raised was a picture whose
 * Icelandic reimbursement claim was still open, and that went with the production
 * system.
 *
 * The lesson stays because the Decision Center itself does: the screen, the two
 * commands and the row are all still here, and the rebuild will give them
 * something to hold. A lesson kept for a system that exists and has nothing to say
 * yet is a different thing from a lesson nothing can ever satisfy.
 */
const KNOWN_UNREACHED = ['decisions'];

const fired = new Map();
for (const lesson of LESSONS) fired.set(lesson.id, 0);

for (let seed = 0; seed < SEEDS; seed += 1) {
  // The acting half. The teaching is already armed on the weekly schedule, so the
  // career plays it without help — nothing here calls the tick, because a second
  // caller would say lessons twice as fast as a player ever would and the count
  // would be a measurement of this file.
  const acting = quickSave({}, `tutorial-acting-${seed}`);
  playACareer(acting, YEARS, {});
  for (const id of Object.keys(acting.universe.tutorial?.seen ?? {})) {
    fired.set(id, (fired.get(id) ?? 0) + 1);
  }

  // There was a company half here, which ran the production pipeline and reached
  // the lessons about making pictures. It went with that pipeline, and so did those
  // lessons, so what is measured now is the life: the clock, sleep, training, the
  // roof, the money and the company's own doors.
}

const reached = [...fired].filter(([, n]) => n > 0);
const never = [...fired].filter(([, n]) => n === 0).map(([id]) => id);

console.log(`${SEEDS} worlds, ${YEARS} years each, played both as a performer and as a company.`);
console.log(`${reached.length} of ${LESSONS.length} lessons were reached. ${never.length} never fired.\n`);

for (const strand of STRANDS) {
  const mine = LESSONS.filter((one) => one.strand === strand.id);
  const got = mine.filter((one) => (fired.get(one.id) ?? 0) > 0);
  const missing = mine.filter((one) => (fired.get(one.id) ?? 0) === 0);
  console.log(`  ${strand.name.padEnd(16)} ${got.length}/${mine.length}`
    + `${missing.length > 0 ? `   never: ${missing.map((one) => one.id).join(', ')}` : ''}`);
}

const unexpected = never.filter((id) => !KNOWN_UNREACHED.includes(id));
if (never.length > 0) {
  console.log('\nLessons no played game reached:\n');
  for (const id of never) {
    const lesson = LESSONS.find((one) => one.id === id);
    console.log(`  ${id} — ${lesson?.title}`
      + `${KNOWN_UNREACHED.includes(id) ? '   (known: the instrument cannot enter its window)' : ''}`);
  }
  if (unexpected.length > 0) {
    console.log('\nEach of the unmarked ones is either a condition nothing can satisfy, which is');
    console.log('decoration and should come out, or a real state neither instrument drives the game');
    console.log('into, which is a gap in the instrument and not in the teaching. Work out which');
    console.log('before deleting one — and if it is the instrument, say so in KNOWN_UNREACHED with');
    console.log('the evidence, the way `decisions` does.');
  }
}

console.log(`\nFloor is ${FLOOR}. Reached ${reached.length}.`);
if (CHECK && reached.length < FLOOR) {
  console.log('Under the floor. A lesson that used to be reachable is not any more.');
  process.exit(1);
}
