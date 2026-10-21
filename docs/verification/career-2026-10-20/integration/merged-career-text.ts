// Prints the "Your Career" chapter and the career guide's connections by kind, as merged on 2026-10-21, for reading the joined words (npx vite-node docs/verification/career-2026-10-20/integration/merged-career-text.ts).
import { CHAPTERS } from '@/engine/content/tutorial';
import { CAREER_GUIDE } from '@/engine/content/guide/career';
const ch = CHAPTERS.find((c) => c.id === 'career')!;
console.log(JSON.stringify(ch, null, 1));
for (const kind of ['prerequisite', 'history', 'scheduled', 'evaluation']) {
  console.log(`\n== ${kind}`);
  for (const e of CAREER_GUIDE) for (const c of e.connections ?? []) if (c.kind === kind) console.log(`${e.id} -> ${c.to}: ${c.why}`);
}
