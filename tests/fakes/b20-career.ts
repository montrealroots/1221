/**
 * TEST SETUP and play helpers for brief 20's career comparisons (`tests/b20-career-*.test.ts`,
 * `docs/verification/audit-2026-10-21/areas/career/REPORT.md`). Every life here is a new one (`createSave` with
 * `newLifeConfig`): Ada Cole at Yale in New Haven, born in New York, from Monday 24 August 2026. What's set by hand is
 * named TEST SETUP where it's done, and is only ever an input the comparison is about (an ability's level, a genre
 * known, a document, an agreement signed), never the consequence it checks.
 *
 * - `graduate`: a graduate of the class of 2029 made by the School's own evaluation and Commencement handlers brought
 *   forward to 3 September 2026, as tests/pro-core.test.ts, tests/pro-work.test.ts and tests/pro-agent.test.ts make one.
 * - `tended`: the body kept rested, fed and awake as the clock moves six hours at a time; `played`: the same, moved as
 *   the top bar moves it, every commitment that wants the player stopped at and answered with Go (`answerStop`).
 * - `twin`: the save written and opened again (`serialise`, `deserialise`, `loadSave`), as Save & Exit and Continue do:
 *   two lives alike in everything from the same seed and the same save.
 * - `setSkill`: every ability and every technique at one level, where each is kept (`systems/attributes.ts`'s
 *   `CRAFT_ABILITY`, `attrs`, and the body's fitness for stamina, as `systems/advice.ts`'s `setAbility` sets them).
 */
import { expect } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { answerStop } from '@/engine/world/clock';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { COMMENCEMENT_KIND, EVALUATION_KIND, evenCraft } from '@/engine/systems/school';
import { attributesOf } from '@/engine/systems/attributes';
import { ABILITY_DEFS } from '@/engine/content/abilities';
import { AGENTS } from '@/engine/content/agents';
import { AGREEMENT_TERMS, PROJECTS, projectById } from '@/engine/content/careerwork';
import { genreState } from '@/engine/systems/engagement';
import { addCredit, type Agreement, type Engagement, type Opportunity } from '@/engine/systems/pro';
import { roundToCome, tapeRefusal } from '@/engine/systems/projobs';
import type { Band } from '@/engine/systems/coursework';
import { rngFor } from '@/engine/core/rng';
import { BRIEFS } from '@/engine/content/briefs';

export const zone = 'America/New_York';
export const AGENT = AGENTS[0]!;
export const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
export const life = (seed: string, more: Partial<ReturnType<typeof newLifeConfig>> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...more });

/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
export const tend = (sim: Simulation) => {
  Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
  sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
};
export const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    tend(sim);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};

/** Played as the top bar plays it: six hours at a time, every commitment on the way stopped at and Go pressed. TEST SETUP: tended. */
export const played = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    tend(sim);
    const wanted = Math.min(until, sim.now + 6 * MS_HOUR);
    let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
    for (let n = 0; r.interruptedBy && n < 50; n += 1) {
      tend(sim);
      r = answerStop(sim, { item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, 'go').result!;
    }
  }
};

/** The save written and opened again, as Save & Exit and Continue do it. */
export const twin = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

/** TEST SETUP: a graduate of the class of 2029, by the School's own evaluation and Commencement, brought forward to 3 September 2026. */
export function graduate(seed: string, more: Partial<ReturnType<typeof newLifeConfig>> = {}): Simulation {
  const sim = life(seed, more);
  tended(sim, at(2026, 9, 1, 18));
  const school = sim.player.school!;
  Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
  school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 20, excused: 0 } } as never;
  sim.schedule({ at: sim.now + 60_000, kind: EVALUATION_KIND, label: 'Spring Term 2029 Evaluation', category: 'school', priority: 32, requiresPlayer: false, payload: { personId: sim.player.id, term: 5 } });
  sim.advanceTo(sim.now + 2 * 60_000);
  const booked = sim.universe.scheduled.filter((i) => i.kind === COMMENCEMENT_KIND && i.status === 'pending');
  sim.timeline.cancel(booked[0]!.id, sim.now);
  sim.schedule({ at: at(2026, 9, 3, 10), kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 32, durationMinutes: 180, payload: booked[0]!.payload });
  tended(sim, at(2026, 9, 3, 15));
  expect(sim.player.school!.standing).toBe('graduated');
  return sim;
}

/**
 * TEST SETUP: every ability and every technique at one level, each where it's kept: the four kept in the craft
 * (Emotional Depth, Memory, Vocal and Physical Expression) with every technique by `evenCraft`, Stamina as the body's
 * fitness, the rest in `attrs`. The input of brief 20's B2 twins, set once and nothing else touched.
 */
export function setSkill(sim: Simulation, level: number): void {
  sim.player.craft = evenCraft(level);
  sim.player.wellbeing.fitness = level;
  const attrs = attributesOf(sim, sim.player) as unknown as Record<string, number>;
  for (const d of ABILITY_DEFS) if (d.id in attrs) attrs[d.id] = level;
}

/** Headshots and a résumé, made through their own commands at the next ten o'clock in the morning. */
export function portfolio(sim: Simulation): void {
  const p = zonedParts(sim.now, zone);
  let ten = at(p.year, p.month, p.day, 10);
  if (ten <= sim.now) ten += MS_DAY;
  played(sim, ten);
  sim.must({ kind: 'pro.headshots', payload: {} });
  played(sim, sim.now + 15 * 60_000);
  sim.must({ kind: 'pro.update_resume', payload: {} });
}

/** The clock moved a week at a time until a role posted to the actor that's still open matches. */
export function waitFor(sim: Simulation, match: (o: Opportunity) => boolean, weeks = 30): Opportunity | undefined {
  for (let k = 0; k < weeks; k += 1) {
    const o = sim.player.pro!.opportunities.find((x) => x.status === 'open' && sim.now < x.submitBy && match(x));
    if (o) return o;
    played(sim, sim.now + 7 * MS_DAY);
  }
  return undefined;
}

/** An opportunity of the player's by its id: the same one in a twin. */
export const opp = (sim: Simulation, id: string): Opportunity => sim.player.pro!.opportunities.find((o) => o.id === id)!;
export const eng = (sim: Simulation, id: string): Engagement => sim.player.pro!.engagements.find((e) => e.id === id)!;

/** Submitted through the command, and the clock run on to the casting office's answer, which sets the round. */
export function submitted(sim: Simulation, o: Opportunity): void {
  sim.must({ kind: 'pro.submit', payload: { opportunityId: o.id } });
  for (let n = 0; n < 8 && o.status === 'submitted'; n += 1) played(sim, sim.now + MS_DAY);
  expect(roundToCome(o)).toBeDefined();
}

/** The sides or the part prepared, each step pressed until it can do no more, half an hour between. */
export function prepareAll(sim: Simulation, target: { opportunityId: string } | { engagementId: string }): void {
  for (let n = 0; n < 24; n += 1) {
    let any = false;
    for (const step of ['read', 'lines', 'rehearse']) {
      if (sim.execute({ kind: 'pro.prepare', payload: { ...target, step } }).ok) any = true;
      played(sim, sim.now + 30 * 60_000);
    }
    if (!any) break;
  }
}

/** A self-tape taped at the first free hour before it's due, through the command. */
export function tape(sim: Simulation, o: Opportunity): void {
  const r = roundToCome(o)!;
  for (let n = 0; n < 48 && tapeRefusal(sim, sim.player, o) && sim.now < r.at - 2 * MS_HOUR; n += 1) played(sim, sim.now + MS_HOUR);
  sim.must({ kind: 'pro.tape_audition', payload: { opportunityId: o.id } });
}

/** The clock run on until casting has decided on every round so far (an offer, a pass, a lapse or the next round). */
export function toCasting(sim: Simulation, o: Opportunity): void {
  const rounds = o.rounds?.length ?? 0;
  for (let k = 0; k < 20 && (o.status === 'audition' || o.status === 'callback') && (o.rounds?.length ?? 0) === rounds; k += 1) played(sim, sim.now + MS_DAY);
}

/** TEST SETUP: an agreement with the agent signed now for a year, as the agent's builder writes one in play. */
export function represent(sim: Simulation): Agreement {
  const a: Agreement = { id: sim.nextId('pro'), agentId: AGENT.id, offeredAt: sim.now - MS_DAY, standsUntil: sim.now + 13 * MS_DAY, status: 'accepted', terms: [...AGREEMENT_TERMS], signedAt: sim.now, endsAt: sim.now + 365 * MS_DAY };
  sim.player.pro!.agreements.push(a);
  return a;
}

/**
 * TEST SETUP: a professional engagement finished, with its credit, as the work loop leaves one, its work judged at
 * `band` (tests/pro-agent.test.ts's `finishedJob`).
 */
export function finishedJob(sim: Simulation, band: Band | null = 'strong', projectId = 'calder-street'): Engagement {
  const t = projectById(projectId)!;
  const credit = addCredit(sim, sim.player, { kind: t.medium === 'stage' ? 'stage' : 'screen', project: t.project, role: t.role.part, company: t.company, year: 2026, medium: t.medium, status: t.medium === 'stage' ? 'performed' : 'shot', at: sim.now - MS_DAY, ...(band ? { band } : {}) });
  const e: Engagement = { id: sim.nextId('pro'), opportunityId: sim.nextId('pro'), projectId, role: t.role.part, status: 'finished', days: [{ from: sim.now - 10 * MS_DAY, to: sim.now - MS_DAY, label: t.project }], pay: [], history: [], counts: {}, creditId: credit.id, finishedAt: sim.now - MS_DAY };
  credit.engagementId = e.id;
  sim.player.pro!.engagements.push(e);
  return e;
}

/** What was posted to the actor, by project, week and way: the same in two lives when nothing between them reads it differently. */
export const postedKeys = (sim: Simulation): string[] => sim.player.pro!.opportunities.map((o) => `${o.projectId}@${o.postedAt}:${o.via}`).sort();

/** The game's own draw for an approach's step to his office, read for a seed as the game reads it (`drawOf`). */
export const agentDraw = (seed: string, n: number, step: 'interest' | 'offer') => rngFor(seed, 'pro.agent', 'person_000001', AGENT.id, `approach-${n}`, step).next();
/**
 * TEST SETUP: a life's seed whose draws at his office fall where a journey needs them, the first of its prefix that does
 * (tests/journey-agent.test.ts's `seedWhere`): every outcome is the game's, decided by its own rules on the facts; the seed
 * only chooses which of the draw's answers the journey meets. A success-path fixture, not a balance claim.
 */
export function seedWhere(prefix: string, ok: (d: (n: number, step: 'interest' | 'offer') => number) => boolean): string {
  for (let i = 0; i < 20_000; i += 1) {
    const seed = `${prefix}-${i}`;
    if (ok((n, step) => agentDraw(seed, n, step))) return seed;
  }
  throw new Error(`No seed for ${prefix}`);
}
/** Draws under these take an approach further and make an offer whatever the room on his list (tests/journey-agent.test.ts). */
export const SURE = { meet: 0.12, offer: 0.18 };

/** A camera brief taped cold and cut into a reel, by the Player Profile's and the Portfolio tab's commands. */
export function reel(sim: Simulation): void {
  const brief = BRIEFS.find((b) => b.medium === 'camera')!;
  sim.must({ kind: 'brief.choose', payload: { brief: brief.id, reading: brief.readings[0]!.id } });
  sim.must({ kind: 'practice.self_tape', payload: { genre: brief.kinds[0], brief: brief.id } });
  sim.must({ kind: 'pro.cut_reel', payload: { pieces: [`tape:${brief.id}:${sim.player.briefs![brief.id]!.takes[0]!.at}`] } });
}

/** A graduate ready to send: the notice read, a portfolio, a finished job judged Strong and its credit (TEST SETUP), the check and the job's referral. */
export function referredGraduate(seed: string): { sim: Simulation; job: Engagement } {
  const sim = graduate(seed);
  sim.must({ kind: 'pro.agent_notice', payload: {} });
  sim.must({ kind: 'pro.headshots', payload: {} });
  sim.must({ kind: 'pro.update_resume', payload: {} });
  const job = finishedJob(sim, 'strong');
  sim.must({ kind: 'pro.update_resume', payload: {} });
  sim.must({ kind: 'pro.agent_check', payload: {} });
  sim.must({ kind: 'pro.ask_referral', payload: { engagementId: job.id } });
  return { sim, job };
}

/**
 * TEST SETUP: a graduate at the top of every ability and technique, knowing the projects' genres, with headshots and a
 * résumé: a life that's offered parts at all, to split twins from (a success-path fixture, not a balance claim).
 */
export function baseLife(seed: string, more: Partial<ReturnType<typeof newLifeConfig>> = {}): Simulation {
  const sim = graduate(seed, more);
  setSkill(sim, 100);
  for (const t of PROJECTS) for (const g of t.genres) genreState(sim.player, g).familiarity = 95;
  portfolio(sim);
  return sim;
}

/**
 * A base life played to an offer for a part, through the commands and the clock: the part's first posting submitted,
 * its sides prepared, taped or auditioned, and casting's word. The seeds used are tests/b20-career-skill.test.ts's fixed
 * list's, whose lives were offered: b20-skill-0 (Jess, Static On Route 9) and b20-skill-2 (Robin, Last Bus To Eastview).
 */
export function offeredPart(seed: string, projectId: string): { sim: Simulation; o: Opportunity } {
  const sim = baseLife(seed);
  const o = waitFor(sim, (x) => x.projectId === projectId)!;
  submitted(sim, o);
  prepareAll(sim, { opportunityId: o.id });
  if (roundToCome(o)!.form === 'self-tape') tape(sim, o);
  toCasting(sim, o);
  expect(o.status).toBe('offered');
  return { sim, o };
}
