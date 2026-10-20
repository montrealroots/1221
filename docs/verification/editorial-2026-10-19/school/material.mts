/**
 * Brief 15, the school area, batch 5: What … Asks, as the coursework card and the casting tab draw it (`MaterialDemands`),
 * for each scene and play whose reasons this batch rewrote, rendered on the server, for the batch record.
 *
 *   npx vite-node docs/verification/editorial-2026-10-19/school/material.mts > docs/verification/editorial-2026-10-19/school/material.txt
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PLAY_MATERIAL, SCENE_MATERIAL } from '@/engine/content/material';
import { MaterialDemands } from '@/ui/components/PlayingChooser';

const IDS = ['seagull-4', 'muchado-4-1', 'macbeth-1-7', 'twelfth-1-5', 'hamlet-3-1', 'measure-2-4', 'bacchae-451', 'medea-446', 'Much Ado About Nothing', 'The Playboy Of The Western World', 'The Bear', 'A Marriage Proposal'];
const words = (html: string) => html.replace(/<!-- -->/g, '').replace(/<\/li>/g, '\n').replace(/<[^>]+>/g, '').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
for (const id of IDS) {
  const material = [...SCENE_MATERIAL, ...PLAY_MATERIAL].find((m) => m.id === id);
  if (!material) { console.log(`${id}: not found`); continue; }
  console.log(`\n===== ${id} =====\n${words(renderToStaticMarkup(createElement(MaterialDemands, { material })))}`);
}
