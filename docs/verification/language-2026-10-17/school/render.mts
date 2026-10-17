/**
 * Brief 14, the school area: the dynamic sentences of coursework, feedback, the term's warning and its review, printed in
 * each of their variants from the engine itself, for the batch records (`batches.md`, `examples.json`).
 *
 *   npx vite-node docs/verification/language-2026-10-17/school/render.mts > docs/verification/language-2026-10-17/school/rendered.txt
 *
 * Every line is the engine's output: direct calls for the word builders, and a short played term for the notices.
 */
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned } from '@/engine/core/time';
import { PREP_DIMS } from '@/engine/content/coursework';
import { courseworkOf, feedbackWords, mateBusy, meetingWeight, meetingsFrom, noteText, questionsFor, remedyWords, revisitWords, setWork, type Assignment } from '@/engine/systems/coursework';
import { chiefLimit, type Limit } from '@/engine/systems/evaluation';
import { directorsNote, shortTermWords, teachersNotes, type SchoolRecord } from '@/engine/systems/school';

const out: string[] = [];
const say = (head: string, s: string | undefined) => out.push(`${head}: ${s ?? '(nothing)'}`);
const zone = 'America/New_York';

// 1. Where a note stands against the ones before (feedbackWords).
const body = 'The lines weren’t secure, so the attention went to remembering, not to the other person. (Lines: 45% prepared.)';
say('note, new', feedbackWords('new', body));
say('note, the second time', feedbackWords('recurring', body, { on: '2026-10-01', course: 'Acting I', given: 1 }));
say('note, the fourth time', feedbackWords('recurring', body, { on: '2026-10-08', course: 'Acting I', given: 3 }));
say('note, better with figures', feedbackWords('partial', body, { on: '2026-10-08', course: 'Acting I', given: 2, level: 0.22 }, 0.5));
say('note, better without figures', feedbackWords('partial', body, { on: '2026-10-08', course: 'Acting I', given: 2 }));
say('note, back after it was taken', feedbackWords('recurring', body, { on: '2026-10-08', course: 'Voice I', given: 2, taken: '2026-10-15' }));
say('note, the step beyond', feedbackWords('advanced', 'Make one moment exact: choose where it starts and ends, and repeat it the same way twice.'));

// 2. The first limit, said, of a piece shown and of one as it would be shown today (chiefLimit).
const lim = (l: Partial<Limit>): { limits: Limit[] } => ({ limits: [{ kind: 'preparation', what: 'memorization', label: 'Learning the lines', dimension: 'believability', by: 12.4, ...l } as Limit] });
for (const [name, l] of [
  ['preparation', {}],
  ['preparation, rehearsal', { what: 'rehearsal', label: 'Rehearsal', dimension: 'execution', by: 22 }],
  ['condition, tired', { kind: 'condition', what: 'fatigue', label: 'Readiness At 61, Under 80' }],
  ['condition, ill', { kind: 'condition', what: 'illness', label: 'Down With The Flu' }],
  ['condition, injured', { kind: 'condition', what: 'injury', label: 'An Injury Still Mending' }],
  ['condition, concussed', { kind: 'condition', what: 'injury', label: 'A Concussion Still Mending' }],
  ['condition, stamina', { kind: 'condition', what: 'stamina', label: 'Stamina, By The Close' }],
  ['condition, shaken', { kind: 'condition', what: 'shaken', label: 'Shaken By A Slip In Beat 3' }],
  ['difficulty', { kind: 'difficulty', what: 'difficulty', label: 'How Hard The Work Is' }],
  ['fit', { kind: 'fit', what: 'fit', label: 'Restrained, Where It Asks For Scale' }],
  ['suitability', { kind: 'suitability', what: 'grain', label: 'Expansive' }],
  ['ability', { kind: 'ability', what: 'presence', label: 'Presence', dimension: 'connection', by: 8.1 }],
  ['technique', { kind: 'technique', what: 'scene', label: 'Scene Study', dimension: 'interpretation', by: 5 }],
] as [string, Partial<Limit>][]) {
  say(`limit, ${name}, shown`, chiefLimit(lim(l)));
  say(`limit, ${name}, today`, chiefLimit(lim(l), 'now'));
}

// 3. What the term's review would do if it found the term short, by standing (shortTermWords).
const school = (standing: SchoolRecord['standing'], extra: Partial<SchoolRecord> = {}) => ({ standing, termsBegun: 1, offset: 0, ...extra }) as unknown as SchoolRecord;
say('the review, from good standing', shortTermWords(school('good'), 0));
say('the review, from concern', shortTermWords(school('concern'), 0));
say('the review, from warning', shortTermWords(school('warning'), 0));
say('the review, from concern, the last term', shortTermWords(school('concern'), 5));
say('the review, kept on warning by a faculty review', shortTermWords(school('warning', { reviews: [{ at: 0, term: 2, outcome: 'warning', why: '' }] }), 2));

// 4. A played term: setting work, a partner's day, the notes as they come back, a showing again.
const sim = createSave(1, 'school-render', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
sim.player.craft = Object.fromEntries(Object.keys(sim.player.craft!).map((k) => [k, 60])) as never;
const cw = courseworkOf(sim, sim.player)!;
cw.orientation.behind = true;
for (const a of cw.assignments) a.status = 'done';
const busyAt = (d: number, h: number) => mateBusy(sim.player, 0, instantFromZoned({ year: 2026, month: 9, day: d, hour: h }, zone), 90);
say('partner busy, too early', busyAt(1, 6));
say('partner busy, in class', busyAt(1, 10));
const seen = new Set<string>();
const notices = () => { for (const n of sim.universe.notifications) { if (seen.has(n.id)) continue; seen.add(n.id); out.push(`NOTICE ${n.title}\n    ${n.body}`); } };
notices();
let a: Assignment | undefined;
const day = (key: string) => { const [y, m, d] = key.split('-').map(Number); return { year: y!, month: m!, day: d! }; };
for (const lines of [0.2, 0.25, 0.5, 0.95, 0.3]) {
  for (const x of cw.assignments) if (x.status === 'open' || x.status === 'revising') x.status = 'done';
  const from = a ? day(a.revision?.dueOn ?? a.dueOn) : { year: 2026, month: 9, day: 1 };
  a = setWork(sim, sim.player, 'DRAM 103a/b', from)!;
  notices();
  for (const d of PREP_DIMS) a.prep[d] = 0.95;
  a.prep.memorization = lines;
  for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id;
  meetingWeight(sim, sim.player, a.course, day(a.dueOn), instantFromZoned({ ...day(a.dueOn), hour: 10 }, zone), true, false);
  notices();
  if (a.status === 'revising') {
    a.prep.memorization = Math.min(1, lines + 0.3);
    a.prep.revision = 0.7;
    if (a.feedback) a.feedback.seen = true;
    meetingWeight(sim, sim.player, a.course, day(a.revision!.dueOn), instantFromZoned({ ...day(a.revision!.dueOn), hour: 10 }, zone), true, false);
    notices();
  }
}
const scene = cw.assignments.find((x) => x.sceneId)!;
say('a scene back, the other part', revisitWords({ ...scene, revisit: { assignmentId: 'x', on: '2026-09-01', role: 0, partner: 1, change: 'role' } }, 'Lear', 'Zoe Park'));
say('a scene back, another reading', revisitWords({ ...scene, revisit: { assignmentId: 'x', on: '2026-09-01', role: 0, change: 'reading' } }, 'Lear'));
say('what works on the partner part', remedyWords(scene, 'partner'));
say('what works on the table work', remedyWords(scene, 'interpretation'));
say('what works on the lines', remedyWords(scene, 'memorization'));
const paired = cw.assignments.find((x) => x.partner !== undefined) ?? a!;
for (const [kept, read] of [[0, 0], [1, 0], [2, 1], [3, 3]] as const) {
  const copy = { ...paired, rehearsals: Array.from({ length: kept }, (_, i) => ({ id: `r${i}`, at: 0, status: 'kept' as const })), steps: { ...paired.steps, reader: read } };
  say(`a note on the partner part, ${kept} kept, ${read} with a reader`, noteText(copy as Assignment, { kind: 'dim', dim: 'partner' }, 0.1, 'Sofia Carter'));
}
say('meetings left', String(meetingsFrom('DRAM 103a/b', { year: 2026, month: 9, day: 1 }, sim.player.school).length));

// 5. A first month left to the clock: orientation's sessions, the first pieces set, partners asking and not answered.
const fresh = createSave(1, 'school-render-month', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Sam', lastName: 'Reyes', pronouns: 'they/them' });
const seen2 = new Set<string>();
for (let d = 24; d <= 31 + 21; d += 1) {
  const day = d <= 31 ? { month: 8, day: d } : { month: 9, day: d - 31 };
  fresh.advanceTo(instantFromZoned({ year: 2026, ...day, hour: 23 }, zone));
}
for (const n of fresh.universe.notifications) { if (seen2.has(n.id)) continue; seen2.add(n.id); if (n.category === 'school') out.push(`MONTH ${n.title}\n    ${n.body}`); }

// 6. The director's note on a run, by how its nights went (directorsNote), and the teachers' notes on a term (teachersNotes).
for (const mean of [1.5, 0.8, 0, -1]) say(`director's note, nights averaging ${mean}`, directorsNote(mean));
const t = fresh.player.school!.tally;
if (t.classCraftAtStart) {
  const base = { ...fresh.player.craft! };
  for (const [name, by] of [['ahead', 6], ['in step', 0.4], ['behind', -0.01]] as const) {
    fresh.player.craft = Object.fromEntries(Object.entries(t.craftAtStart).map(([k, v]) => [k, (v as number) + (by === 0.4 ? (base[k as keyof typeof base]! - (v as number)) : by)])) as never;
    for (const n of teachersNotes(fresh.player, 0).slice(0, 3)) say(`teacher's note, ${name}, ${n.course}`, n.note);
  }
  fresh.player.craft = base;
}
console.log(out.join('\n'));
