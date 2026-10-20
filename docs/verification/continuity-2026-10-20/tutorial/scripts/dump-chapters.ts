import { writeFileSync } from 'node:fs';
const { CHAPTERS } = await import(`${process.env.ROOT}/src/engine/content/tutorial.ts`);
const out: string[] = [];
for (const [i, c] of CHAPTERS.entries()) {
  out.push(`## ${i + 1}. ${c.title} [${c.id}] — ${c.lead}`);
  c.body.forEach((p: string, j: number) => out.push(`  P${j + 1}: ${p}`));
  (c.more ?? []).forEach((p: string, j: number) => out.push(`  D${j + 1}: ${p}`));
  out.push(`  OPENS: ${c.names.join(' | ')}`, '');
}
writeFileSync(process.argv[2]!, out.join('\n'));
