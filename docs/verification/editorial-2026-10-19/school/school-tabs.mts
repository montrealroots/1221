/**
 * Brief 15, the school area, batch 4: the School screen's six tabs as they draw for a life played into its first spring
 * (a term reviewed, a Carlotta casting, the Cabaret and the shifts), rendered on the server inside the game's own
 * provider, for the batch record. What the player reads, a block a line, as the tests read a screen.
 *
 *   npx vite-node --config docs/verification/editorial-2026-10-19/school/tabs.vite.config.ts \
 *     docs/verification/editorial-2026-10-19/school/school-tabs.mts > docs/verification/editorial-2026-10-19/school/school-tabs.txt
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { GameProvider } from '@/app/game-context';
import type { Simulation } from '@/engine/core/simulation';
// The tab is kept in `useKept`'s store; tabs.vite.config.ts reads it without a subscription, which a server render lacks.
import { SchoolWorkspace } from '@/ui/workspaces/SchoolWorkspace';
import { keep } from '@/ui/kept';

const zone = 'America/New_York';
const INLINE = /<\/?(?:strong|em|b|i|a|abbr|small|code)(?:\s[^>]*)?>/g;
const BLOCK = /<\/?(?:p|div|li|ul|ol|td|th|tr|table|thead|tbody|h[1-6]|button|label|summary|details|section|header|select|option|nav|output|figure|figcaption|input)(?:\s[^>]*)?>|<br\s*\/?>/g;
const words = (html: string) => html.replace(/<!-- -->/g, '').replace(INLINE, '').replace(/<\/?span[^>]*>/g, ' ').replace(BLOCK, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n+/g, '\n').trim();
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};

const sim = createSave(1, 'school-tabs', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Sam', lastName: 'Reyes', pronouns: 'they/them', tutorial: false } as never);
tended(sim, instantFromZoned({ year: 2027, month: 3, day: 3, hour: 12 }, zone));
const adapter = {} as never;
for (const tab of ['standing', 'classes', 'casting', 'work', 'terms']) {
  keep('tab:/workspace/school', tab);
  const html = renderToStaticMarkup(createElement(GameProvider, { sim, adapter, onExit: () => undefined }, createElement(SchoolWorkspace)));
  console.log(`\n===== ${tab} =====\n${words(html)}`);
}
