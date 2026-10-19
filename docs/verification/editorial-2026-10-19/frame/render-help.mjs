/**
 * The frame's How This Works entries as the Help dialog draws them (brief 15, 2026-10-19): the evidence for an entry's
 * words, read where the player reads them, not in the data.
 *
 *   npx vite-node docs/verification/editorial-2026-10-19/frame/render-help.mjs <out.txt> [entry id ...]
 *
 * For each entry (by default every `start.*` and `day.*` entry), it opens the help at the entry the way an address
 * naming it does (`#/home?help=<id>`, `HelpProvider`'s first state), over the real `GameProvider` and `GuideProvider`
 * on a New Haven student's first evening, and writes the dialog's text. A server render draws every section of the
 * entry, folded or not, so the whole entry is read. Nothing is pressed and no command runs.
 */
import { writeFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_HOUR } from '@/engine/core/time';
import { GameProvider } from '@/app/game-context';
import { GuideProvider } from '@/ui/guide/Guide';
import { HelpProvider } from '@/ui/guide/Help';
import { START } from '@/engine/content/guide/start';
import { DAY } from '@/engine/content/guide/day';

const [OUT = 'help-rendered.txt', ...ONLY] = process.argv.slice(2);
const ids = ONLY.length ? ONLY : [...START, ...DAY].map((e) => e.id);

const sim = createSave(1, 'frame-help', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
sim.advanceTo(sim.now + 2 * MS_HOUR);

/** The page's window, at an address that names the entry: the help opens on it. FIXTURE. */
const at = (id) => {
  globalThis.window = {
    location: { hash: `#/home?help=${id}` },
    history: { state: null, replaceState: () => undefined, pushState: () => undefined },
    addEventListener: () => undefined, removeEventListener: () => undefined,
    setTimeout: () => 0, clearTimeout: () => undefined, setInterval: () => 0, clearInterval: () => undefined,
  };
  globalThis.document = { addEventListener: () => undefined, removeEventListener: () => undefined, visibilityState: 'visible', activeElement: null, contains: () => false };
};

const words = (html) => html.replace(/<!-- -->/g, '')
  .replace(/<\/(p|div|li|h1|h2|h3|summary|tr|dt|dd)>/g, '\n').replace(/<br\s*\/?>/g, '\n')
  .replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n').replace(/\n{2,}/g, '\n').trim();

const out = [];
for (const id of ids) {
  at(id);
  const html = renderToStaticMarkup(createElement(GameProvider, { sim, adapter: { save: async () => undefined }, onExit: () => undefined },
    createElement(GuideProvider, null, createElement(HelpProvider, null, null))));
  const dialog = html.slice(html.indexOf('role="dialog"') >= 0 ? html.lastIndexOf('<div', html.indexOf('role="dialog"')) : 0);
  out.push(`=== ${id}\n${words(dialog)}\n`);
}
writeFileSync(OUT, out.join('\n'));
console.log(`wrote ${ids.length} entries to ${OUT}`);
