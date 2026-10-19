/**
 * Brief 15, the school area: the Coursework tab as it draws for a played life, rendered on the server inside the game's
 * own provider, for the batch records. What the player reads, a block a line, as the tests read a screen.
 *
 *   npx vite-node docs/verification/editorial-2026-10-19/school/screens.mts > docs/verification/editorial-2026-10-19/school/screens.txt
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned } from '@/engine/core/time';
import { GameProvider } from '@/app/game-context';
import { CourseworkPane } from '@/ui/components/CourseworkPane';
import { courseworkOf } from '@/engine/systems/coursework';

const zone = 'America/New_York';
const INLINE = /<\/?(?:strong|em|b|i|a|abbr|small|code)(?:\s[^>]*)?>/g;
const BLOCK = /<\/?(?:p|div|li|ul|ol|td|th|tr|table|thead|tbody|h[1-6]|button|label|summary|details|section|header|select|option|nav|output|figure|figcaption|input)(?:\s[^>]*)?>|<br\s*\/?>/g;
const words = (html: string) => html.replace(/<!-- -->/g, '').replace(INLINE, '').replace(/<\/?span[^>]*>/g, ' ').replace(BLOCK, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n+/g, '\n').trim();

const sim = createSave(1, 'school-screens', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Sam', lastName: 'Reyes', pronouns: 'they/them', tutorial: false } as never);
for (let d = 24; d <= 31 + 21; d += 1) {
  const day = d <= 31 ? { month: 8, day: d } : { month: 9, day: d - 31 };
  sim.advanceTo(instantFromZoned({ year: 2026, ...day, hour: 23 }, zone));
}
const cw = courseworkOf(sim, sim.player)!;
// Some preparation, so the card has parts done and parts short.
for (const a of cw.assignments.filter((x) => x.status === 'open' || x.status === 'revising')) { a.prep.familiarity = 0.6; a.prep.memorization = 0.35; }
const adapter = {} as never;
const html = renderToStaticMarkup(createElement(GameProvider, { sim, adapter, onExit: () => undefined }, createElement(CourseworkPane)));
console.log(words(html));
