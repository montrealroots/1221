/**
 * Three students through the first fall term (from 2026-10-08): one engaged
 * (prepares every evening, chooses another way at a weakness that keeps
 * coming back, answers classmates), one uneven (prepares most weeks), one who
 * ignores the work. Measured separately: repeated situations (the same note's
 * subject twice running in a course) and repeated wording (the same words
 * twice running), the notices a persistent weakness sends, and what's left
 * open. The numbers printed are the ones the handoff reports.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { activitiesOf, approachRefusal, courseworkOf, notesOf, persistentFor, prepareRefusal, questionsFor } from '@/engine/systems/coursework';
import { CHOICES, momentsOf } from '@/engine/systems/classmates';
import { freshnessOf } from '@/engine/systems/learning';

type Kind = 'engaged' | 'uneven' | 'ignoring';
const zone = 'America/New_York';
const at = (month: number, day: number, hour = 20) => instantFromZoned({ year: 2026, month, day, hour }, zone);
const tend = (sim: Simulation) => { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); };

function evening(sim: Simulation, kind: Kind, week: number) {
  if (kind === 'ignoring') return;
  const cw = courseworkOf(sim, sim.player)!;
  for (const m of momentsOf(cw).filter((x) => x.status === 'open')) sim.execute({ kind: 'school.respond', payload: { momentId: m.id, choice: CHOICES[m.kind][0]!.id } });
  if (kind === 'uneven' && week % 4 === 3) return;
  for (const a of cw.assignments.filter((x) => x.status === 'open' || x.status === 'revising')) {
    if (a.feedback && !a.feedback.seen) sim.execute({ kind: 'school.read_feedback', payload: { assignmentId: a.id } });
    for (const k of a.asks ?? []) if (k.status === 'open') sim.execute({ kind: 'school.answer_partner', payload: { assignmentId: a.id, askId: k.id, yes: true } });
    for (const { q, options } of questionsFor(a)) if (!a.answers[q.id]) sim.execute({ kind: 'school.choose', payload: { assignmentId: a.id, question: q.id, option: options.find((o) => o.supported)!.id } });
    // The engaged student takes another way at a weakness that keeps coming back, a drill.
    if (kind === 'engaged' && !a.approach && persistentFor(cw, a).length && !approachRefusal(sim, sim.player, a, 'drill')) sim.execute({ kind: 'school.approach', payload: { assignmentId: a.id, kind: 'drill' } });
    const steps = kind === 'engaged' ? 4 : 2;
    for (let n = 0; n < steps; n += 1) {
      const act = activitiesOf(a).find((x) => x.dim !== 'partner' && !prepareRefusal(sim, sim.player, a, x.id));
      if (!act || sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: act.id } }).error) break;
    }
  }
}

function term(kind: Kind) {
  const sim = createSave(1, 'three-students', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  const start = at(8, 31);
  for (let day = start; day < at(12, 12); day += MS_DAY) {
    while (sim.now < day) { tend(sim); sim.advanceTo(Math.min(day, sim.now + 6 * MS_HOUR)); }
    tend(sim);
    if (sim.player.currentLocationId === 'us-ct-newhaven') evening(sim, kind, Math.floor((day - start) / (7 * MS_DAY)));
  }
  const cw = courseworkOf(sim, sim.player)!;
  const f = freshnessOf(cw.assignments as never);
  const stillList = sim.universe.notifications.filter((n) => n.title.startsWith('Still There:'));
  const still = stillList.length;
  if (process.env.SHOW_STILL) for (const n of stillList) console.log('STILL', kind, new Date(n.at).toISOString(), n.title, n.body.slice(0, 80));
  // Each subject's notices a week apart at least (`LEARNING.quietDays`), however often it was given.
  for (const title of new Set(stillList.map((n) => n.title))) {
    const times = stillList.filter((n) => n.title === title).map((n) => n.at).sort((x, y) => x - y);
    for (let i = 1; i < times.length; i += 1) expect(times[i]! - times[i - 1]!).toBeGreaterThanOrEqual(7 * MS_DAY - 60_000);
  }
  const shown = sim.universe.notifications.filter((n) => n.title.startsWith('Shown:')).length;
  const notes = notesOf(cw);
  const out = { kind, notes: f.notes, sameSubjectRun: f.sameSubjectRun, sameNoteRun: f.sameNoteRun, kinds: f.kinds, approaches: f.approaches, stillNotices: still, shownNotices: shown, openSubjects: notes.filter((n) => n.status === 'open').length, taken: notes.filter((n) => n.status === 'resolved').length, mostGiven: Math.max(0, ...notes.map((n) => n.given)) };
  console.log('STUDENT', JSON.stringify(out));
  if (process.env.SHOW_SAME) { const noted = [...cw.assignments].filter((a) => a.feedback).sort((a, b) => (a.setOn < b.setOn ? -1 : 1)); for (const a of noted) { const prev = noted.filter((b) => b.course === a.course && b.setOn < a.setOn).at(-1); if (prev && prev.feedback!.text === a.feedback!.text) console.log('SAME', kind, a.course, a.template, a.feedback!.kind, a.feedback!.text.slice(0, 120)); } }
  expect(breaches(sim.universe)).toEqual([]);
  return out;
}

describe('journey: three students through a term', () => {
  it('measures repeated situations apart from repeated wording, for the engaged, the uneven and the ignoring', () => {
    const engaged = term('engaged');
    const uneven = term('uneven');
    const ignoring = term('ignoring');
    // The engaged student takes another way at what persists, and is told the step beyond more than the one who ignores it.
    expect(Object.values(engaged.approaches).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    expect(engaged.kinds.advanced ?? 0).toBeGreaterThan(ignoring.kinds.advanced ?? 0);
    // The one who ignores it hears the same subject again and again; the words differ (the date, the count), and the
    // notices are quiet: no more than one a week a subject, not one a showing.
    expect(ignoring.sameSubjectRun).toBeGreaterThan(engaged.sameSubjectRun);
    expect(ignoring.sameNoteRun).toBeLessThan(0.2);
    expect(ignoring.stillNotices).toBeLessThanOrEqual(15 * ignoring.openSubjects);
    expect(ignoring.stillNotices + ignoring.shownNotices).toBeLessThan(ignoring.notes);
    expect(uneven.notes).toBeGreaterThan(0);
  }, 600_000);
});
