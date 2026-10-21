// Prints the words the regional company's move to Hudson changed (2026-10-21), for reading them where they stand
// (npx vite-node docs/verification/career-2026-10-20/integration/hudson-text.ts).
import { CHAPTERS } from '@/engine/content/tutorial';
import { CAREER_GUIDE } from '@/engine/content/guide/career';
import { AUDITION_TOWNS, projectById } from '@/engine/content/careerwork';
const p = projectById('winter-ledger')!;
console.log(`${p.project}, ${p.company}: ${p.place.venue} in ${p.place.city} (${p.place.cityId})`);
console.log(`Audition towns: ${AUDITION_TOWNS}`);
console.log(CHAPTERS.find((c) => c.id === 'finding-work')!.body.find((b) => b.includes('answers with an audition')));
console.log(CAREER_GUIDE.find((e) => e.id === 'career.auditions')!.short);
