/**
 * A first year of coursework played through (from 2026-10-08): every evening
 * in New Haven the student reads their notes, answers partners, chooses at
 * the table and prepares, some weeks well and some hardly at all; saved and
 * loaded midway. What it checks is downstream, not the buttons: every
 * revision shown again with a band, the ledger's notes moving (new, the same
 * again, better, taken, the step beyond), no note on something put right and
 * holding, partners not repeated in a course, scenes not repeated while
 * fresh ones fit, and every law of the save. The freshness numbers it prints
 * are the ones the handoff reports.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { templateById } from '@/engine/content/coursework';
import { courseworkOf, notesOf, prepareRefusal, questionsFor, type Assignment } from '@/engine/systems/coursework';
import { LEARNING, freshnessOf } from '@/engine/systems/learning';
import { CHOICES, momentsOf } from '@/engine/systems/classmates';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 20) => instantFromZoned({ year, month, day, hour }, zone);
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const tend = (sim: Simulation) => { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); };

/** One evening's work: notes read, asks answered, the table chosen, and up to `steps` steps on each open piece. */
function evening(sim: Simulation, steps: number, careful: boolean) {
  const cw = courseworkOf(sim, sim.player)!;
  // What classmates brought: answered, the careful way or the first offered.
  for (const m of momentsOf(cw).filter((x) => x.status === 'open')) {
    const choice = careful ? ({ disagreement: 'both', study: 'yes', help: 'help', apology: 'accept', boundary: 'respect', encouragement: '' } as const)[m.kind] : CHOICES[m.kind][0]!.id;
    sim.execute({ kind: 'school.respond', payload: { momentId: m.id, choice } });
  }
  for (const a of cw.assignments.filter((x) => x.status === 'open' || x.status === 'revising')) {
    if (a.feedback && !a.feedback.seen) sim.execute({ kind: 'school.read_feedback', payload: { assignmentId: a.id } });
    for (const k of a.asks ?? []) if (k.status === 'open') sim.execute({ kind: 'school.answer_partner', payload: { assignmentId: a.id, askId: k.id, yes: careful } });
    for (const { q, options } of questionsFor(a)) {
      if (a.answers[q.id]) continue;
      // Careful, a supported reading, another than last time's where it can; careless, the first offered.
      const pick = careful ? (options.filter((o) => o.supported).find((o) => o.id !== a.revisit?.answers?.[q.id]) ?? options.find((o) => o.supported)!) : options[0]!;
      sim.execute({ kind: 'school.choose', payload: { assignmentId: a.id, question: q.id, option: pick.id } });
    }
    const t = templateById(a.template)!;
    for (let n = 0; n < steps; n += 1) {
      const act = t.activities.find((x) => x.dim !== 'partner' && !prepareRefusal(sim, sim.player, a, x.id));
      if (!act) break;
      if (sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: act.id } }).error) break;
    }
  }
}

describe('journey: a first year of coursework', () => {
  it('keeps the work fresh and the notes honest across a year, through a save', () => {
    let sim = createSave(1, 'jr-year', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const end = at(2027, 5, 7);
    let day = at(2026, 8, 31);
    let reloaded = false;
    while (day < end) {
      while (sim.now < day) { tend(sim); sim.advanceTo(Math.min(day, sim.now + 6 * MS_HOUR)); }
      tend(sim);
      // Some weeks careful and thorough, some hardly at all: the work and its notes should show both.
      const week = Math.floor((day - at(2026, 8, 31)) / (7 * MS_DAY));
      const careful = week % 4 !== 3;
      if (sim.player.currentLocationId === 'us-ct-newhaven') evening(sim, careful ? 3 : 0, careful);
      if (!reloaded && day >= at(2026, 12, 1)) { sim = reload(sim); reloaded = true; }
      day += MS_DAY;
    }
    const cw = courseworkOf(sim, sim.player)!;
    const as = cw.assignments as (Assignment & { feedback?: { text: string; kind?: string } })[];
    const report = freshnessOf(as);
    console.log('FRESHNESS', JSON.stringify(report));
    // The class's moments: several kinds, and the same kind twice running rare.
    const ms = momentsOf(cw);
    const kinds = ms.reduce<Record<string, number>>((m, x) => { m[x.kind] = (m[x.kind] ?? 0) + 1; return m; }, {});
    const sameRun = ms.filter((m, i) => i > 0 && ms[i - 1]!.kind === m.kind).length;
    console.log('MOMENTS', JSON.stringify({ count: ms.length, kinds, sameKindRunning: Math.round((sameRun / Math.max(1, ms.length - 1)) * 1000) / 1000, answered: ms.filter((m) => m.status === 'answered').length, lapsed: ms.filter((m) => m.status === 'lapsed').length }));
    expect(Object.keys(kinds).length).toBeGreaterThanOrEqual(4);
    expect(sameRun / Math.max(1, ms.length - 1)).toBeLessThanOrEqual(0.25);

    expect(report.assignments).toBeGreaterThan(40);
    // Every revision shown again, and its band kept (the showcase reads it).
    const revised = as.filter((a) => a.revision?.applied !== undefined);
    expect(revised.length).toBeGreaterThanOrEqual(4);
    expect(revised.every((a) => a.revision!.band !== undefined)).toBe(true);
    // Spring Acting I's simulated rehearsals: one scene taken through its three rounds, in order, each shown once.
    const rehearsals = as.filter((a) => a.template === 'simulated-rehearsal' && a.status === 'done');
    expect(rehearsals.length).toBeGreaterThan(0);
    for (const a of rehearsals) expect(a.roundsShown!.map((r) => r.label)).toEqual(['At The Table', 'Off Book, On Its Feet', 'The Run']);
    expect(as.filter((a) => a.course === 'DRAM 103a/b' && a.term === 1).every((a) => a.template === 'simulated-rehearsal')).toBe(true);
    // The notes move: new ones, the same again, better, and the step beyond; and some taken.
    expect(report.kinds.new).toBeGreaterThan(0);
    expect((report.kinds.recurring ?? 0) + (report.kinds.partial ?? 0)).toBeGreaterThan(0);
    expect(report.kinds.advanced ?? 0).toBeGreaterThan(0);
    expect(notesOf(cw).some((n) => n.history.some((h) => h.kind === 'applied'))).toBe(true);
    // No note given on a part put right and holding: each dim note given after it was taken measured below the slip line.
    for (const n of notesOf(cw).filter((x) => x.key.startsWith('dim:'))) {
      n.history.forEach((h, i) => { if (h.kind === 'applied' && n.history[i + 1]) expect(n.history[i + 1]!.kind).toBe('recurring'); });
    }
    // Partners never last time's in the same course; scenes not back within six while fresh ones fit.
    expect(report.partnerRepeat).toBe(0);
    // A scene back only once every fitting one has been studied, and always said, with something new asked of it.
    expect(report.avoidableRepeat).toBe(0);
    expect(report.unacknowledged).toBe(0);
    // The same words twice running in a course are rare: the ledger says where a note stands.
    expect(report.sameNoteRun).toBeLessThanOrEqual(0.15);
    expect(LEARNING.slipped).toBeLessThan(LEARNING.enough);
    expect(breaches(sim.universe)).toEqual([]);
  }, 600_000);
});
