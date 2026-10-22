/**
 * Brief 20's B2 for the career: skill does what it should and no more (`docs/verification/audit-2026-10-21/criteria.md`
 * B2; the career area's report, `docs/verification/audit-2026-10-21/areas/career/REPORT.md`). Twins from the same seed
 * and the same save, every ability and every technique at the top in one and at the bottom in the other (TEST SETUP,
 * `setSkill`, the only thing set between them), then the same commands and the same clock:
 * - the most skilled actor's self-tape, in-person audition and shoot days are judged better, from the same preparation;
 * - skill moves neither which parts are posted (`postingsAt`, `writtenFor`) nor his office's reading of the record, the
 *   room on his list among it (`rosterFor`, `interestOf`);
 * - skill guarantees neither a booking nor representation: casting's draw and his office's are each a chance short of
 *   certain, and the other factors stand whatever the skill. Shown on fixed seeds, named before their first run and kept
 *   whatever came of them (`SKILL_SEEDS`, `REP_SEEDS`), never searched.
 *
 * TEST SETUP besides the twins' skill, each an input and never the consequence checked: the graduate made by the School's
 * own handlers brought forward (`graduate`); the body tended as the clock moves; in the life the twins are split from,
 * every ability and technique at the top and the projects' genres known, so that life reaches an offer to split at more
 * often (a success-path fixture: the base life's own casting isn't what's measured); a finished job and its credit for
 * the referral route (`finishedJob`, as tests/pro-agent.test.ts has it).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { PROJECTS, projectById } from '@/engine/content/careerwork';
import { CASTING, postingTimes, postingsAt, projectOf, roundToCome, writtenFor } from '@/engine/systems/projobs';
import { CHANCE, interestOf, relationOf, rosterFor } from '@/engine/systems/proagent';
import type { Band } from '@/engine/systems/coursework';
import {
  AGENT, at, baseLife, eng, finishedJob, graduate, life, opp, played, postedKeys, prepareAll, represent, setSkill, submitted, tape, tended, toCasting, twin, waitFor,
} from './fakes/b20-career';

/** Named before their first run (2026-10-21) and kept whatever came of them. */
const SKILL_SEEDS = Array.from({ length: 8 }, (_, n) => `b20-skill-${n}`);
const REP_SEEDS = Array.from({ length: 8 }, (_, n) => `b20-rep-${n}`);
const TOP = 100;
const BOTTOM = 0;
const RANK: Readonly<Record<Band, number>> = { unready: 0, working: 1, strong: 2, exceptional: 3 };

interface Run {
  seed: string;
  project: string;
  form: 'self-tape' | 'in-person';
  top: { overall: number; band: Band; chance: number; yes: boolean };
  bottom: { overall: number; band: Band; chance: number; yes: boolean };
  /** The base life, at the top, cast or not: the same draw the top twin's. */
  offered: boolean;
  days?: { top: number[]; bottom: number[]; topBands: Band[]; bottomBands: Band[] };
}

/**
 * One seed played: the first open role of the student film, the ultra-low-budget film or the non-union short posted to
 * the base life, submitted and its sides prepared there; the twins split from that save at the top and the bottom, each
 * auditioned at the same moment (Tape It, or the clock to the audition in person); casting's word in each. Where the base
 * life is offered the part, it accepts and prepares the part, and the twins split from that save play its shoot days.
 */
function play(seed: string): Run | undefined {
  const base = baseLife(seed);
  const o = waitFor(base, (x) => ['non-union-short', 'ultra-low-budget', 'student-film'].includes(projectById(x.projectId)!.kind));
  if (!o) return undefined;
  submitted(base, o);
  prepareAll(base, { opportunityId: o.id });
  const top = twin(base); setSkill(top, TOP);
  const bottom = twin(base); setSkill(bottom, BOTTOM);
  const form = roundToCome(o)!.form;
  if (form === 'self-tape') for (const s of [top, bottom, base]) tape(s, opp(s, o.id));
  for (const s of [top, bottom, base]) toCasting(s, opp(s, o.id));
  const round = (s: Simulation) => { const r = opp(s, o.id).rounds![0]!; return { overall: r.overall!, band: r.band!, chance: r.casting!.chance, yes: r.casting!.yes }; };
  const run: Run = { seed, project: projectOf(o).id, form, top: round(top), bottom: round(bottom), offered: o.status === 'offered' };
  if (o.status === 'offered') {
    const id = base.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
    prepareAll(base, { engagementId: id });
    const a = twin(base); setSkill(a, TOP);
    const b = twin(base); setSkill(b, BOTTOM);
    const last = eng(base, id).days.at(-1)!.to;
    played(a, last + MS_DAY);
    played(b, last + MS_DAY);
    const log = (s: Simulation) => eng(s, id).log!;
    run.days = { top: log(a).map((l) => l.overall!), bottom: log(b).map((l) => l.overall!), topBands: log(a).map((l) => l.band!), bottomBands: log(b).map((l) => l.band!) };
  }
  return run;
}

describe('B2: skill does what it should and no more (twins at the top and the bottom of every ability and technique)', () => {
  let runs: Run[] = [];
  beforeAll(() => { runs = SKILL_SEEDS.map(play).filter((r): r is Run => r !== undefined); }, 240_000);

  it('PLAYER JOURNEY: the most skilled actor’s self-tape, audition in person and shoot days are judged better than the least skilled’s, from the same save and the same preparation', () => {
    expect(runs).toHaveLength(SKILL_SEEDS.length);
    for (const r of runs) {
      expect(r.top.overall).toBeGreaterThan(r.bottom.overall + 50);
      expect(RANK[r.top.band]).toBeGreaterThan(RANK[r.bottom.band]);
    }
    expect(runs.some((r) => r.form === 'self-tape')).toBe(true);
    expect(runs.some((r) => r.form === 'in-person')).toBe(true);
    const worked = runs.filter((r) => r.days);
    expect(worked.length).toBeGreaterThan(0);
    for (const r of worked) {
      expect(r.days!.top.length).toBe(r.days!.bottom.length);
      r.days!.top.forEach((x, i) => expect(x).toBeGreaterThan(r.days!.bottom[i]! + 50));
      expect(r.days!.topBands.every((b) => RANK[b] >= RANK.strong)).toBe(true);
      expect(r.days!.bottomBands.every((b) => b === 'unready')).toBe(true);
    }
  });

  it('PLAYER JOURNEY: skill guarantees no booking: casting’s chance stays short of certain at the top, the draw is the same for both twins, and of the fixed seeds the most skilled actor still lost some', () => {
    for (const r of runs) {
      expect(r.top.chance).toBeLessThanOrEqual(CASTING.most);
      // The higher band and the closer fit (the techniques are half of it) raise the chance; nothing else about them differs.
      expect(r.top.chance).toBeGreaterThan(r.bottom.chance);
      // The base life, at the top as the top twin is, drew the same and was cast the same: the draw is the role's own.
      expect(r.offered).toBe(r.top.yes);
    }
    const lost = runs.filter((r) => !r.top.yes);
    expect(lost.length).toBeGreaterThan(0);
    // The least skilled were cast nowhere: a band Unready keeps the chance at its least.
    expect(runs.every((r) => !r.bottom.yes)).toBe(true);
  });
});

describe('B2: skill moves neither the roles posted nor his office’s reading of the record', () => {
  it('PLAYER JOURNEY: twins at the top and the bottom are posted the same roles, week by week, unsigned and then through him', () => {
    const base = graduate('b20-skill-postings');
    const top = twin(base); setSkill(top, TOP);
    const bottom = twin(base); setSkill(bottom, BOTTOM);
    // The game's own rule, read for every Monday of two years: the same parts, each written for her or for either.
    for (const when of postingTimes(base.now, base.now + 104 * 7 * MS_DAY)) {
      const a = postingsAt(top, top.player, when).map((p) => `${p.project.id}:${p.via}`);
      expect(postingsAt(bottom, bottom.player, when).map((p) => `${p.project.id}:${p.via}`)).toEqual(a);
    }
    for (const t of PROJECTS) expect(writtenFor(t, top.player)).toBe(writtenFor(t, bottom.player));
    // Played: forty weeks unsigned, then an agreement (TEST SETUP, the same in both) and twenty weeks through him.
    for (const s of [top, bottom]) tended(s, s.now + 40 * 7 * MS_DAY);
    expect(postedKeys(top).length).toBeGreaterThan(5);
    expect(postedKeys(bottom)).toEqual(postedKeys(top));
    for (const s of [top, bottom]) { represent(s); tended(s, s.now + 20 * 7 * MS_DAY); }
    expect(postedKeys(top).some((k) => k.endsWith(':agent'))).toBe(true);
    expect(postedKeys(bottom)).toEqual(postedKeys(top));
  });

  it('PLAYER JOURNEY: his office reads the twins’ records alike, the room on his list among them, and answers the same approach the same way', () => {
    // TEST SETUP in the life they're split from: a finished job judged Strong and its credit, for the referral's route.
    const base = graduate('b20-skill-roster');
    base.must({ kind: 'pro.agent_notice', payload: {} });
    base.must({ kind: 'pro.headshots', payload: {} });
    base.must({ kind: 'pro.update_resume', payload: {} });
    const job = finishedJob(base, 'strong');
    base.must({ kind: 'pro.update_resume', payload: {} });
    base.must({ kind: 'pro.agent_check', payload: {} });
    base.must({ kind: 'pro.ask_referral', payload: { engagementId: job.id } });
    const top = twin(base); setSkill(top, TOP);
    const bottom = twin(base); setSkill(bottom, BOTTOM);
    const year = 2026;
    expect(rosterFor(bottom, AGENT, year)).toEqual(rosterFor(top, AGENT, year));
    expect(interestOf(bottom, bottom.player, AGENT, bottom.now).factors).toEqual(interestOf(top, top.player, AGENT, top.now).factors);
    for (const s of [top, bottom]) { s.must({ kind: 'pro.send_materials', payload: {} }); tended(s, s.now + 15 * MS_DAY); }
    const a = relationOf(top.player, AGENT.id)!;
    const b = relationOf(bottom.player, AGENT.id)!;
    expect(a.why).toBeDefined();
    expect(b.why).toEqual(a.why);
    expect(b.why!.factors.find((f) => f.id === 'roster')).toEqual(a.why!.factors.find((f) => f.id === 'roster'));
    expect(b.stage).toBe(a.stage);
  });
});

describe('B2: skill guarantees no representation', () => {
  /** A referred actor at the top, ready to send: the notice read, a portfolio, a finished job judged Strong (TEST SETUP), the check and the referral. */
  function referred(sim: Simulation): void {
    setSkill(sim, TOP);
    sim.must({ kind: 'pro.agent_notice', payload: {} });
    sim.must({ kind: 'pro.headshots', payload: {} });
    sim.must({ kind: 'pro.update_resume', payload: {} });
    const job = finishedJob(sim, 'strong');
    sim.must({ kind: 'pro.update_resume', payload: {} });
    sim.must({ kind: 'pro.agent_check', payload: {} });
    sim.must({ kind: 'pro.ask_referral', payload: { engagementId: job.id } });
  }

  it('PLAYER JOURNEY: at the top, a graduate’s approach is taken further only on the draw, never for certain; a first-year’s turns on the room on his list, which skill doesn’t move (fixed seeds)', () => {
    const graduates = REP_SEEDS.map((seed) => {
      const sim = graduate(seed);
      referred(sim);
      sim.must({ kind: 'pro.send_materials', payload: {} });
      tended(sim, sim.now + 15 * MS_DAY);
      const rel = relationOf(sim.player, AGENT.id)!;
      return { seed, stage: rel.stage, why: rel.why! };
    });
    for (const g of graduates) {
      expect(g.why.atOrBeyond).toBeGreaterThanOrEqual(g.why.needed);
      expect(g.why.chance!).toBeLessThanOrEqual(CHANCE.most);
    }
    const further = graduates.filter((g) => g.stage === 'requested' || g.stage === 'meeting');
    const notFurther = graduates.filter((g) => g.stage !== 'requested' && g.stage !== 'meeting');
    expect(further.length).toBeGreaterThan(0);
    expect(notFurther.length).toBeGreaterThan(0);

    // A first-year at the top on a Sunday morning, the same referral: training, availability and the record's stage and
    // screen stand near the bar whatever the skill, so whether the approach can go further turns on the room on his list,
    // which the year's openings give and skill can't move. On the seeds where it stands near the bar, never; where it's at
    // the bar, only on the draw.
    const firstYears = REP_SEEDS.map((seed) => {
      const sim = life(seed);
      tended(sim, at(2026, 9, 6, 10));
      referred(sim);
      sim.must({ kind: 'pro.send_materials', payload: {} });
      tended(sim, sim.now + 15 * MS_DAY);
      const rel = relationOf(sim.player, AGENT.id)!;
      return { seed, stage: rel.stage, why: rel.why!, room: rel.why!.factors.find((x) => x.id === 'roster')!.level };
    });
    for (const f of firstYears) for (const id of ['training', 'availability', 'relevance']) expect(f.why.factors.find((x) => x.id === id)!.level).toBe('near');
    const shortOfIt = firstYears.filter((f) => f.why.atOrBeyond < f.why.needed);
    expect(shortOfIt.length).toBeGreaterThan(0);
    for (const f of shortOfIt) {
      expect(['short', 'near']).toContain(f.room);
      expect(f.why.chance).toBeUndefined();
      expect(['passed', 'waiting']).toContain(f.stage);
    }
    for (const f of firstYears.filter((x) => x.why.atOrBeyond >= x.why.needed)) expect(['at', 'beyond']).toContain(f.room);
  }, 120_000);
});
