/**
 * Each matcher this pass changed, held to two things: it is still in the tool, word for word, and it tells the screen's
 * new sentence from its siblings and from the old words. Run from the repository's root:
 *
 *   node docs/verification/language-2026-10-17/uitools/matchers.mjs
 *
 * Exit 1 if a matcher is gone from its tool, misses the sentence the screen says, or matches one it must not.
 */
import { readFileSync } from 'node:fs';

const ACC = 'tools/acceptance-ui.mjs';
const PT = 'tools/playthroughs-ui.mjs';
const SUITS = ['This choice is complete once it’s rehearsed to 84%: it suits the scene, so it asks less.'];
const NOT_SUITS = [
  'This choice is complete once it’s rehearsed to 96%: it goes against the scene, so it asks more.',
  'This choice is complete once it’s rehearsed to 90%: the scene neither favors nor resists it.',
  'This one is complete at 84% rehearsed in: with the grain of the scene, it asks less.',
];
const cases = [
  { name: 'the suited side’s mark', in: [ACC, PT], re: /it suits the scene, so it asks less/, yes: SUITS, no: NOT_SUITS },
  {
    name: 'the lien’s release refused', in: [ACC], re: /once what it was filed for is paid in full/,
    yes: ['Not now: You can ask for its release once what it was filed for is paid in full.'],
    no: ['You can ask for its release once the balance it secures is paid in full.', 'The lien has already been released.', 'You’ve already asked. It’s to be released by October 1, 2026.'],
  },
  {
    name: 'the registration notice', in: [PT], re: /Your tuition/,
    yes: ['Your tuition, $20,375.00 a term, is covered by the tuition scholarship.'],
    no: ['Tuition, $20,375.00 a term, is met by the tuition scholarship.', 'The aid office found no financial need, so you pay the Yale Health plan, $1,882.00 a term, yourself.'],
  },
  {
    name: 'a showing’s notice', in: [PT], re: /Well prepared: |Simulated note from /,
    yes: ['Well prepared: Knows The Scene, Lines and Rehearsal. Your scene study carried it.', 'Simulated note from Acting I: It held together this time.'],
    no: ['Lines was there; Rehearsal was there. The note (simulated feedback from Acting I): It held together.', 'Up from Working on the course’s last piece, shown September 9, 2026. You came rested and ready.', ''],
  },
  {
    name: 'the coursework warning’s count', in: [PT], re: /So far this term, \d+ of the \d+ pieces (you’ve shown|due) were Unready/,
    yes: ['So far this term, 3 of the 6 pieces you’ve shown were Unready.', 'So far this term, 4 of the 8 pieces due were Unready or not shown.'],
    no: ['3 of the 6 pieces shown this term so far were Unready.', 'Everything set so far has been shown.'],
  },
  {
    name: 'a Due Soonest line', in: [PT], re: /, due .+\. Shown today, it would come to about \d+\.\d \((Unready|Working|Strong|Exceptional)\)\./,
    yes: ['Speech And Accents II: Sound Changes And A Text, due September 28, 2027. Shown today, it would come to about 49.3 (Unready). Still to finish: Drills (Drill The Sounds).'],
    no: ['Speech And Accents II: Sound Changes And A Text, due September 28, 2027: about 49.3 (Unready) shown today. Short of complete: drills (Drill The Sounds).', 'Speech And Accents II: Sound Changes And A Text, due September 28, 2027. Shown today, it would come to about 49.3. Still to finish: Drills.'],
  },
];
let bad = 0;
for (const c of cases) {
  for (const file of c.in) if (!readFileSync(file, 'utf8').includes(`/${c.re.source}/`)) { bad += 1; console.log(`GONE  ${c.name}: not in ${file}`); }
  for (const s of c.yes) if (!c.re.test(s)) { bad += 1; console.log(`MISS  ${c.name}: ${s}`); }
  for (const s of c.no) if (c.re.test(s)) { bad += 1; console.log(`LOOSE ${c.name}: ${s}`); }
  console.log(`${c.name}: in ${c.in.join(' and ')}; ${c.yes.length} matched, ${c.no.length} refused`);
}
process.exit(bad ? 1 : 0);
