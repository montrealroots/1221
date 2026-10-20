// Prints every How This Works entry as the help draws it, the figures filled in, one file per goal.
import { writeFileSync, mkdirSync } from 'node:fs';
const root = process.env.ROOT!;
const out = process.argv[2]!;
const { GUIDE, GUIDE_BY_ID } = await import(`${root}/src/engine/content/guide/index.ts`);
mkdirSync(out, { recursive: true });
const by: Record<string, string[]> = {};
for (const e of GUIDE) {
  const L: string[] = [];
  L.push(`## ${e.title}  [${e.id}]  (${e.where.route}${e.where.tab ? '?tab=' + e.where.tab : ''})`);
  L.push(...e.short.split(/\n\n+/).map((p: string) => `SHORT: ${p}`));
  L.push(`WHERE: ${e.where.label}.`, `WHEN: ${e.available}`);
  const sec = (t: string, xs: readonly string[]) => { if (xs.length) { L.push(`-- ${t}`); xs.forEach((x, i) => L.push(`  ${i + 1}. ${x}`)); } };
  const facts = (t: string, xs: readonly { label: string; value: string; estimate?: boolean }[]) => { if (xs.length) { L.push(`-- ${t}`); xs.forEach((f) => L.push(`  * ${f.label}: ${f.value}${f.estimate ? ' (estimated)' : ''}`)); } };
  sec('What To Press', e.steps); sec('What You Need First', e.needs); facts('Time And Money', e.costs);
  sec('Straight Away', e.now); sec('Later On', e.later); sec('Reading The Result', e.interpret);
  if (e.connections.length) { L.push('-- How It Connects'); for (const c of e.connections) L.push(`  > [${c.kind}] ${GUIDE_BY_ID[c.to]?.title ?? '??' + c.to}: ${c.why}`); }
  sec('What To Do Next', e.next); sec('If You Can’t', e.unavailable); sec('Mistakes', e.mistakes); facts('What Decides It', e.reads);
  L.push('-- A Worked Example', `  ${e.example.setup}`, ...e.example.steps.map((s: string, i: number) => `  ${i + 1}. ${s}`), `  RESULT: ${e.example.result}`);
  if (e.related.length) L.push(`-- Read With It: ${e.related.map((r: string) => GUIDE_BY_ID[r]?.title ?? '??' + r).join(', ')}`);
  (by[e.goal] ??= []).push(L.join('\n'));
}
for (const [g, xs] of Object.entries(by)) writeFileSync(`${out}/${g}.txt`, xs.join('\n\n') + '\n');
console.log(Object.entries(by).map(([g, xs]) => `${g}: ${xs.length}`).join(', '), 'entries', GUIDE.length);
