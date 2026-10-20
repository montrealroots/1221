/**
 * Brief 15, the school area: the How This Works entries of `content/guide/school.ts`, `coursework.ts` and
 * `productions.ts`, printed field by field with every figure filled in from the rules, as the help shows them, for the
 * batch records. An id given prints that entry alone.
 *
 *   npx vite-node docs/verification/editorial-2026-10-19/school/guide.mts [entry id ...] > docs/verification/editorial-2026-10-19/school/guide.txt
 */
import { COURSEWORK } from '@/engine/content/guide/coursework';
import { SCHOOL } from '@/engine/content/guide/school';
import { PRODUCTIONS } from '@/engine/content/guide/productions';
import type { GuideEntry } from '@/engine/content/guide/types';

const want = process.argv.slice(2);
const all: readonly GuideEntry[] = [...SCHOOL, ...COURSEWORK, ...PRODUCTIONS];
const out: string[] = [];
for (const e of all.filter((x) => !want.length || want.includes(x.id))) {
  out.push(`=== ${e.id}: ${e.title}`, `Where To Find It: ${e.where.label}`, `When You Can Use It: ${e.available}`, '', e.short, '');
  const list = (head: string, xs: readonly string[]) => { if (xs.length) out.push(head, ...xs.map((x) => `  - ${x}`), ''); };
  list('What To Press', e.steps);
  list('What You Need First', e.needs);
  list('Costs', e.costs.map((c) => `${c.label}: ${c.value}${c.estimate ? ' (estimated)' : ''}`));
  list('What Happens', e.now);
  list('Later', e.later);
  list('Reading What Comes Back', e.interpret);
  list('If You Can’t', e.unavailable);
  list('Common Mistakes', e.mistakes);
  list('What To Do Next', e.next);
  list('What Decides It', e.reads.map((c) => `${c.label}: ${c.value}${c.estimate ? ' (estimated)' : ''}`));
  list('How It Connects', e.connections.map((c) => `${c.to} (${c.kind}): ${c.why}`));
  out.push('A Worked Example', `  ${e.example.setup}`, ...e.example.steps.map((s) => `  - ${s}`), `  ${e.example.result}`, '');
}
console.log(out.join('\n'));
