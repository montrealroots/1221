/**
 * The saves the agent's walk opens (brief 19, G1, G6, G7 and V7, 2026-10-21), each a life played on by the game's own
 * commands and clock, the way a player plays it, the clock paused at the end (`world.set_preferences`).
 *
 *   npx vite-node docs/verification/career-2026-10-20/agent/make-saves.ts -- OUTDIR
 *
 * TEST SETUP, as tests/journey-agent.test.ts does it, said where it's done: a graduate made by the School's own
 * Commencement handler brought forward to September 3, 2026; a finished professional job and its credit, judged Strong
 * (the work loop is built apart); the body tended as the clock moves; and the life's seed, the first of its prefix whose
 * first approach the game's own draw takes to a meeting and an offer.
 *
 * - `unread.json`: the graduate on Thursday, September 3, 2026, at 8:00 PM, with headshots and a résumé, his panel never
 *   opened: the notice still to read.
 * - `meeting.json`: referred, sent on September 4, answered with a meeting on Friday, September 25 at 11:00 AM at the
 *   agency's New York office; the clock at 8:00 AM that day.
 * - `offered.json`: the meeting kept, his offer standing from September 30; the clock at noon that day.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createSave } from '../../../../src/engine';
import type { Simulation } from '../../../../src/engine/core/simulation';
import { newLifeConfig } from '../../../../src/engine/world/bootstrap';
import { serialise } from '../../../../src/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, formatDateTime, instantFromZoned } from '../../../../src/engine/core/time';
import { rngFor } from '../../../../src/engine/core/rng';
import { COMMENCEMENT_KIND, EVALUATION_KIND } from '../../../../src/engine/systems/school';
import { BRIEFS } from '../../../../src/engine/content/briefs';
import { AGENTS } from '../../../../src/engine/content/agents';
import { projectById } from '../../../../src/engine/content/careerwork';
import { addCredit, type Engagement } from '../../../../src/engine/systems/pro';

const OUT = process.argv.at(-1) ?? '.';
mkdirSync(OUT, { recursive: true });
const NY = 'America/New_York';
const at = (month: number, day: number, hour: number) => instantFromZoned({ year: 2026, month, day, hour, minute: 0 }, NY);
const AGENT = AGENTS[0]!;

/** TEST SETUP: the first seed whose first approach the game's own draw takes to a meeting and an offer. */
function seed(): string {
  for (let i = 0; ; i += 1) {
    const s = `agent-walk-${i}`;
    const d = (step: string) => rngFor(s, 'pro.agent', 'person_000001', AGENT.id, 'approach-1', step).next();
    if (d('interest') < 0.12 && d('offer') < 0.18) return s;
  }
}
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
function tended(sim: Simulation, until: number) {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}
/** TEST SETUP: a graduate made by the School's own handlers, Commencement on September 3, as the tests make one. */
function graduate(): Simulation {
  const sim = createSave(1, seed(), { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  tended(sim, at(9, 1, 18));
  const school = sim.player.school!;
  Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
  school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 20, excused: 0 } } as never;
  school.casting = { production: 'Shakespeare Repertory Project I', play: 'Twelfth Night', by: 'William Shakespeare', role: 'Viola', kind: 'shakespeare', term: 5, performed: 4, size: 'lead' };
  sim.schedule({ at: sim.now + 60_000, kind: EVALUATION_KIND, label: 'Spring Term 2029 Evaluation', category: 'school', priority: 32, requiresPlayer: false, payload: { personId: sim.player.id, term: 5 } });
  sim.advanceTo(sim.now + 2 * 60_000);
  const booked = sim.universe.scheduled.filter((i) => i.kind === COMMENCEMENT_KIND && i.status === 'pending');
  sim.timeline.cancel(booked[0]!.id, sim.now);
  sim.schedule({ at: at(9, 3, 10), kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 32, durationMinutes: 180, payload: booked[0]!.payload });
  tended(sim, at(9, 3, 15));
  sim.must({ kind: 'pro.headshots', payload: {} });
  sim.must({ kind: 'pro.update_resume', payload: {} });
  return sim;
}
/** TEST SETUP: a finished job, A House On Calder Street's Nell, judged Strong, as the work loop leaves one. */
function finishedJob(sim: Simulation): Engagement {
  const t = projectById('calder-street')!;
  const credit = addCredit(sim, sim.player, { kind: 'stage', project: t.project, role: t.role.part, company: t.company, year: 2026, medium: 'stage', status: 'performed', at: sim.now - MS_DAY, band: 'strong' });
  const e: Engagement = { id: sim.nextId('pro'), opportunityId: sim.nextId('pro'), projectId: t.id, role: t.role.part, status: 'finished', days: [{ from: sim.now - 10 * MS_DAY, to: sim.now - MS_DAY, label: t.project }], pay: [], history: [], counts: {}, creditId: credit.id, finishedAt: sim.now - MS_DAY };
  credit.engagementId = e.id;
  sim.player.pro!.engagements.push(e);
  return e;
}
const write = (sim: Simulation, name: string) => {
  sim.must({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } });
  writeFileSync(`${OUT}/${name}`, serialise(sim.universe));
  console.log(`${name}: ${formatDateTime(sim.now, NY)}, ${sim.player.pro?.relations[AGENT.id]?.stage ?? 'no relation'}`);
};

const unread = graduate();
tended(unread, at(9, 3, 20));
write(unread, 'unread.json');

const sim = graduate();
sim.must({ kind: 'pro.agent_notice', payload: {} });
const job = finishedJob(sim);
sim.must({ kind: 'pro.update_resume', payload: {} });
sim.must({ kind: 'pro.agent_check', payload: {} });
sim.must({ kind: 'pro.ask_referral', payload: { engagementId: job.id } });
const brief = BRIEFS.find((b) => b.medium === 'camera')!;
sim.must({ kind: 'brief.choose', payload: { brief: brief.id, reading: brief.readings[0]!.id } });
sim.must({ kind: 'practice.self_tape', payload: { genre: brief.kinds[0], brief: brief.id } });
sim.must({ kind: 'pro.cut_reel', payload: { pieces: [`tape:${brief.id}:${sim.player.briefs![brief.id]!.takes[0]!.at}`] } });
tended(sim, at(9, 4, 10));
sim.must({ kind: 'pro.send_materials', payload: {} });
tended(sim, at(9, 25, 8));
write(sim, 'meeting.json');
tended(sim, at(9, 30, 12));
write(sim, 'offered.json');
