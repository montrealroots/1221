/**
 * The health area's rendered examples, first written for brief 14 (2026-10-17) and kept for brief 15 (2026-10-19): every
 * variant of the wellbeing looks and the guide's body chapter, printed from the game as it stands, so a before and an
 * after can be set side by side (looks-before.txt, then looks-after-1.txt).
 *
 *   npx vite-node docs/verification/editorial-2026-10-19/health/render-looks.ts -- OUT.txt [SAVEDIR]
 *
 * It opens each scenario save in SAVEDIR and reads the player's looks there, then plays a new life and sets its
 * wellbeing to each band a sentence turns on, a condition carried each way, an injury, and another person in each of
 * the pronouns a life can have. Nothing it does is saved.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createElement, isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, loadPlacesFor, type Simulation } from '../../../../src/engine';
import { createUniverse, newLifeConfig, type NewSaveConfig } from '../../../../src/engine/world/bootstrap';
import { deserialise } from '../../../../src/engine/persistence/adapter';
import '../../../../src/ui/looks/all';
import { resolveLook, type Looked } from '../../../../src/ui/looks/registry';
import { at, type Subject } from '../../../../src/ui/looks/subject';
import { GUIDE } from '../../../../src/engine/content/guide';
import { MS_DAY } from '../../../../src/engine/core/time';
import { healthOf } from '../../../../src/engine/systems/health';

const [OUT = 'render.txt', DIR = ''] = process.argv.slice(2).filter((a) => a !== '--');
const lines: string[] = [];
const say = (s: string) => lines.push(s);

const text = (node: ReactNode): string => {
  if (node === undefined || node === null || node === false) return '';
  const html = isValidElement(node) || Array.isArray(node) ? renderToStaticMarkup(createElement('div', null, node)) : String(node);
  return html.replace(/<\/(p|tr|li|div)>/g, '\n').replace(/<td[^>]*>/g, ' | ').replace(/<[^>]+>/g, '').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\n+/g, '\n').trim();
};

function printLook(sim: Simulation, subject: Subject, title: string): void {
  const found = resolveLook(sim, subject);
  say(`--- ${title} (${subject.kind}:${subject.id})`);
  if (!found) { say('  (no look)'); return; }
  if ('gone' in found) { say(`  gone: ${(found as { gone: string }).gone}`); return; }
  const l = found as Looked;
  say(`  name: ${l.name}`);
  say(`  kind: ${l.kind}`);
  say(`  summary: ${l.summary}`);
  const body = text(l.body);
  if (body) say(`  body: ${body.split('\n').join('\n        ')}`);
  for (const w of l.ways ?? []) say(`  way: ${w.label} — ${w.detail}`);
  if (l.provenance) say(`  provenance: ${l.provenance}`);
}

function allLooks(sim: Simulation, who: string): void {
  const p = sim.universe.people[who]!;
  printLook(sim, at('person', who), 'person');
  for (const key of ['energy', 'stress', 'sleepDebt', 'morale', 'condition', 'fitness', 'nourishment', 'hygiene']) printLook(sim, at('dial', `${who}/${key}`), key);
  printLook(sim, at('readiness', who), 'readiness');
  const isYou = who === sim.universe.playerId;
  for (const t of p.personalityTraits ?? []) printLook(sim, at('trait', isYou ? t : `${who}/${t}`), `trait ${t}`);
  for (const c of Object.keys(p.health?.chronic ?? {})) printLook(sim, at('condition', isYou ? c : `${who}/${c}`), `condition ${c}`);
  printLook(sim, at('condition', isYou ? 'injury' : `${who}/injury`), 'injury');
}

// The scenario saves.
if (DIR) {
  for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json')).sort()) {
    const universe = deserialise(readFileSync(`${DIR}/${f}`, 'utf8')) as never;
    await loadPlacesFor(universe);
    const sim = loadSave(universe);
    say(`\n===== save ${f}`);
    allLooks(sim, sim.universe.playerId);
  }
}

// A new life, set to each band.
const fresh = () => createSave(1, 'health-render', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', heightCm: 170, weightKg: 65, personalityTraits: ['spender'], tutorial: false } as never);
/** Another person, made as the people test makes one (`tests/scope-people.test.ts`, `seeded`). */
function seeded(sim: Simulation, firstName: string, pronouns: string, id: string) {
  const config = { ...newLifeConfig(), school: undefined, homeRegionId: 'uk-eng-london', startLocationId: 'uk-eng-london', livesWhereBorn: true, firstName, lastName: 'Lane', pronouns, heightCm: 160, weightKg: 55, personalityTraits: ['curious', 'frugal'], startYear: 2026, startMonth: 8, startDay: 24 } as unknown as NewSaveConfig;
  const made = createUniverse(1, `hr-${firstName}`, config);
  const person = { ...made.universe.people[made.playerId]!, id, isPlayer: false, saveId: sim.universe.meta.id };
  sim.universe.people[id] = person;
  return person;
}
const bands: [string, Record<string, number>, ((sim: Simulation) => void)?][] = [
  ['first morning', {}],
  ['all high', { energy: 90, stress: 10, sleepDebt: 0, morale: 80, condition: 99, fitness: 80, nourishment: 90, hygiene: 90 }],
  ['middling', { energy: 55, stress: 40, sleepDebt: 6, morale: 55, condition: 85, fitness: 35, nourishment: 50, hygiene: 60 }],
  ['low', { energy: 20, stress: 70, sleepDebt: 15, morale: 30, condition: 50, fitness: 30, nourishment: 10, hygiene: 30 }],
  ['worn out', { energy: 8, stress: 90, sleepDebt: 25, morale: 15, condition: 30, fitness: 20, nourishment: 5, hygiene: 10 }],
  ['sick, at school', { condition: 40, energy: 60 }],
  ['a day awake', { sleepDebt: 4 }, (sim) => { sim.player.wokeWithDebt = 0; }],
  ['a short night left', { sleepDebt: 5 }, (sim) => { sim.player.wokeWithDebt = 5; }],
  ['one drag', { energy: 30 }],
  ['two drags', { energy: 30, stress: 85 }],
  ['peak', { energy: 100, stress: 0, sleepDebt: 0, morale: 100, condition: 100, nourishment: 100, hygiene: 100 }],
];
for (const [name, set, more] of bands) {
  const sim = fresh();
  Object.assign(sim.player.wellbeing, set);
  more?.(sim);
  say(`\n===== new life, ${name}`);
  allLooks(sim, sim.universe.playerId);
}

// Conditions carried, each way, and an injury.
{
  const sim = fresh();
  const h = healthOf(sim.player);
  h.chronic = { depression: { treated: false }, asthma: { treated: true }, diabetes: { treated: true, lapsed: true, typeOne: true }, arthritis: { treated: false }, hypertension: { treated: false } } as never;
  h.injury = { kind: 'fracture', at: sim.now, until: sim.now + 40 * MS_DAY, offWorkUntil: sim.now + 40 * MS_DAY } as never;
  say('\n===== new life, conditions and a broken bone');
  allLooks(sim, sim.universe.playerId);
  h.injury = { kind: 'sprain', at: sim.now, until: sim.now + 4 * MS_DAY } as never;
  say('\n===== new life, a sprain');
  printLook(sim, at('condition', 'injury'), 'injury');
  printLook(sim, at('person', sim.universe.playerId), 'person');
  h.chronic = { diabetes: { treated: false, typeOne: false } } as never;
  say('\n===== new life, type 2 diabetes left alone');
  printLook(sim, at('condition', 'diabetes'), 'condition diabetes');
}

// Another person, in each set of pronouns.
{
  const sim = fresh();
  for (const [i, pronouns] of ['she/her', 'he/him', 'they/them'].entries()) {
    const other = seeded(sim, ['Cleo', 'Dev', 'Kit'][i]!, pronouns, `person_00009${i}`);
    Object.assign(other.wellbeing, { energy: 30, stress: 80, sleepDebt: 14, hygiene: 40 });
    healthOf(other).chronic = { depression: { treated: true } } as never;
    healthOf(other).injury = { kind: 'sprain', at: sim.now, until: sim.now + 4 * MS_DAY } as never;
    say(`\n===== another person, ${pronouns}`);
    allLooks(sim, other.id);
  }
}

// The fitness look at each age band (`AGING`, `content/lifespan.ts`).
{
  const sim = fresh();
  for (const age of [18, 25, 35, 45, 55, 65, 75, 85]) {
    sim.player.birthInstant = sim.now - age * 365.2425 * MS_DAY - MS_DAY;
    say(`\n===== a body of ${age}`);
    printLook(sim, at('dial', `${sim.universe.playerId}/fitness`), 'fitness');
  }
}

// The guide's body chapter.
say('\n===== guide');
for (const e of GUIDE.filter((g) => g.id.startsWith('body.'))) {
  say(`--- ${e.id}: ${e.title}`);
  for (const [k, v] of Object.entries(e)) {
    if (['id', 'title', 'goal', 'covers'].includes(k)) continue;
    say(`  ${k}: ${JSON.stringify(v, null, 1).replace(/\n\s*/g, ' ')}`);
  }
}

writeFileSync(OUT, `${lines.join('\n')}\n`);
console.log(`${lines.length} lines to ${OUT}`);
