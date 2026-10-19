/**
 * Brief 15, the school area, batch 5: Work It Through's problems as the list under a practice brief gives them, played
 * through commands on a few briefs at a few stages of preparation, one of each kind; the audition's note on its lines;
 * and the concerns' two quotations. For the batch record.
 *
 *   npx vite-node docs/verification/editorial-2026-10-19/school/b5.mts > docs/verification/editorial-2026-10-19/school/b5.txt
 */
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { BRIEFS } from '@/engine/content/briefs';
import { TEMPLATES } from '@/engine/content/coursework';
import { CONCERNS } from '@/engine/content/concerns';
import { workPiece } from '@/engine/systems/workpieces';
import { problemsOf } from '@/engine/systems/workbook';

const rest = (sim: Simulation) => {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
};
const go = (sim: Simulation, kind: string, payload: Record<string, unknown>) => { rest(sim); return sim.execute({ kind, payload }); };

const seen = new Map<string, string>();
const STAGES = [['read', 'lines'], ['read', 'lines', 'lines', 'rehearse'], ['read', 'read', 'lines', 'lines', 'lines', 'rehearse', 'rehearse'], ['read', 'read', 'read', 'lines', 'lines', 'lines', 'lines', 'rehearse', 'rehearse', 'rehearse', 'rehearse', 'rehearse']];
for (const [i, b] of BRIEFS.slice(0, 24).entries()) {
  for (const [j, steps] of STAGES.entries()) {
    const sim = createSave(1, `b5-${i}-${j}`, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    rest(sim);
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    for (const step of steps) go(sim, 'brief.prepare', { brief: b.id, step });
    const piece = workPiece(sim, sim.player, `brief:${b.id}`);
    if (!piece) continue;
    for (const p of problemsOf(piece)) { const k = p.kind === 'segment' && p.label.endsWith('Holds It Back') ? 'segment, held back' : p.kind; if (!seen.has(k)) seen.set(k, `${b.title}, after ${steps.join(', ')} | ${p.label}: ${p.why}`); }
  }
}
console.log('== Work It Through, one problem of each kind ==');
for (const [kind, line] of seen) console.log(`${kind}: ${line}`);
console.log('\n== The audition’s notes ==');
const audition = TEMPLATES.find((t) => t.id === 'audition-pair')!;
for (const [part, note] of Object.entries((audition as unknown as { notes: Record<string, string> }).notes ?? {})) console.log(`${part}: ${note}`);
console.log('\n== The concerns’ sources ==');
for (const c of Object.values(CONCERNS)) console.log(`${c.label}: ${c.principle}`);
