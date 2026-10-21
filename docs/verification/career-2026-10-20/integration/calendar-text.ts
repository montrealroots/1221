// Prints the Calendar's legend and its How This Works entry as joined at the playthroughs' merge (2026-10-21), where the
// built-app walk's and the playthroughs' words met (npx vite-node docs/verification/career-2026-10-20/integration/calendar-text.ts).
import { CALENDAR_LEGEND } from '@/engine/world/calendar';
import { GUIDE } from '@/engine/content/guide';
for (const l of CALENDAR_LEGEND) console.log(`${l.label}: ${l.description}`);
const e = GUIDE.find((g) => g.id === 'day.calendar')!;
console.log(JSON.stringify({ interpret: e.interpret, reads: e.reads }, null, 1));
