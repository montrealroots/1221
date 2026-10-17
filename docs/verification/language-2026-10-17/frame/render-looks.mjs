/**
 * The frame area's looks, rendered for lives in several places and states, and written out as a player reads them (brief
 * 14, 2026-10-17): the evidence for a drill-down's words, in every variant the lives here reach.
 *
 *   npx vite-node docs/verification/language-2026-10-17/frame/render-looks.mjs <out.txt>
 *
 * Each life is a played career, not an idle save: a New Haven student a week into the fall, the same student on a
 * winter evening, and quick lives in Longyearbyen in midwinter and midsummer (the polar sun), Sydney (the southern seasons)
 * and London. For each, every seed of each kind below is resolved and printed: its name, kind and summary, its body as
 * text, its ways, its facets and its source line.
 */
import { writeFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned, MS_DAY, MS_HOUR } from '@/engine/core/time';
import { resolveLook, seedsFor } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';
import '@/ui/looks/all';
import { GameProvider } from '@/app/game-context';

const OUT = process.argv[2] ?? 'looks-rendered.txt';
const KINDS = ['day', 'entry', 'season', 'daylight', 'place', 'region', 'country', 'currency', 'weather', 'forecastday', 'hours', 'skyhour', 'skyweek', 'stretch', 'plans', 'decision', 'notification'];

/** The life whose looks are being rendered: a look's body names things through the provider, as the screen draws it. */
let current;
const text = (node) => (node === undefined || node === null ? '' : renderToStaticMarkup(createElement(GameProvider, { sim: current, adapter: { save: async () => undefined }, onExit: () => undefined }, createElement('div', null, node)))
  .replace(/<\/(p|div|li|span)>/g, ' ').replace(/<[^>]+>/g, '').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim());

/** Kept rested and fed while the clock runs, as a player's meals and sleep keep them. TEST SETUP's kind. */
function played(sim, until) {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 85, stress: 20, sleepDebt: 0, nourishment: 80, morale: 70 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
  return sim;
}

const NY = 'America/New_York';
const student = () => createSave(1, 'frame-looks', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const lives = [
  ['a New Haven student, a week into the fall', () => {
    const sim = played(student(), instantFromZoned({ year: 2026, month: 9, day: 1, hour: 18 }, NY));
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Dinner With Sam', at: sim.now + 26 * MS_HOUR, durationMinutes: 120 } });
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Gym', at: sim.now + 26 * MS_HOUR, durationMinutes: 60 } });
    return sim;
  }],
  ['the same student, on a February evening', () => played(student(), instantFromZoned({ year: 2027, month: 2, day: 11, hour: 20 }, NY))],
  ['a quick life in Longyearbyen, in midwinter', () => quickSave({ startLocationId: 'sj-21-longyearbyen', homeRegionId: 'sj-21-longyearbyen', startMonth: 12, startDay: 21 }, 'frame-polar-w')],
  ['a quick life in Longyearbyen, in midsummer', () => quickSave({ startLocationId: 'sj-21-longyearbyen', homeRegionId: 'sj-21-longyearbyen', startMonth: 6, startDay: 21 }, 'frame-polar-s')],
  ['a quick life in Sydney', () => quickSave({ startLocationId: 'au-nsw-sydney', homeRegionId: 'au-nsw-sydney' }, 'frame-sydney')],
  ['a quick life in London', () => quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' }, 'frame-london')],
];

const out = [];
for (const [name, make] of lives) {
  let sim;
  try { sim = make(); } catch (e) { out.push(`\n# ${name}: not made (${String(e).slice(0, 160)})`); continue; }
  current = sim;
  out.push(`\n# ${name}`);
  for (const kind of KINDS) {
    let seeds = [];
    try { seeds = seedsFor(kind, sim); } catch (e) { out.push(`\n## ${kind}: no seeds (${String(e).slice(0, 120)})`); continue; }
    for (const id of seeds.slice(0, 4)) {
      const found = resolveLook(sim, at(kind, id));
      if (!found) continue;
      if ('gone' in found) { out.push(`\n## ${kind} ${id}: gone — ${found.gone}`); continue; }
      out.push(`\n## ${kind} ${id}: ${found.name} [${found.kind}]`, `summary: ${found.summary}`, `body: ${text(found.body)}`);
      for (const w of found.ways ?? []) out.push(`way: ${w.label} — ${w.detail ?? ''}`);
      for (const f of found.facets ?? []) out.push(`facet ${f.label}: ${text(f.body)}`);
      if (found.provenance) out.push(`source: ${found.provenance}`);
    }
  }
}
writeFileSync(OUT, `${out.join('\n')}\n`);
console.log(`${OUT}: ${out.length} lines`);
