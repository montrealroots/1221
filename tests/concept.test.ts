/**
 * The story engine, held to the one thing that makes it an engine and not a label.
 *
 * A concept the player fills in and nothing reads is exactly the defect
 * `tools/wired.mjs` and `tools/claims.mjs` exist for. So every test here is about
 * something being **refused** or **written** — never about a field being stored.
 *
 * The four refusals, and the one write:
 *
 *   - television with no concept under it at all
 *   - an engine that cannot sustain the plan's cadence
 *   - a plan asking for more parts than the engine has fuel for
 *   - an ensemble too small for the engine to run on
 *   - and the world, which decides the city the unit works out of
 *
 * The last one is the write, and it matters because `unitBaseId` existed from the
 * beginning and was always the lot's own town, because nothing else ever wrote it.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  CADENCE_LABEL, ENGINES, ENGINE_BY_ID, MOST_PARTS, enginesFor, engineById,
} from '@/engine/content/concept';
import {
  whyNotConceive, whyNotMakeAs, couldBeMadeAs, enginesThatCarry, type MadeAs,
} from '@/engine/world/concept';

/**
 * Ways of making something, standing in for the plans.
 *
 * The production system that held `WAYS` has gone, and the engine deliberately
 * no longer imports one — it states its own contract, `MadeAs`, and whatever is
 * built next conforms to it. These three are the shapes the engine has to be able
 * to refuse and allow, written here so the refusals can be tested before the thing
 * they refuse exists.
 */
const A_FEATURE: MadeAs = { id: 'feature', label: 'A Feature', cadence: 'single', parts: 1 };
const A_SERIES: MadeAs = { id: 'series', label: 'A Series', cadence: 'returning', parts: 8 };
const A_SEASON: MadeAs = { id: 'season', label: 'A Season', cadence: 'closed', parts: 8 };
const WAYS: readonly MadeAs[] = [A_FEATURE, A_SERIES, A_SEASON];
import type { Project } from '@/engine/domain/model';

/** A project with a concept on it, without going through the whole pipeline. */
const withConcept = (engineId: string, people = 8): Project => ({
  id: 'p1', saveId: 's', companyId: 'c', title: 'A Thing',
  medium: 'television', stage: 'idea', startedAt: 0, spentCents: 0,
  delivered: [],
  concept: { engineId, worldId: 'is-39-reykjavik', people, at: 0 },
} as unknown as Project);

describe('the engines themselves', () => {
  it('are all there and each says what it asks every week', () => {
    expect(ENGINES.length).toBe(6);
    for (const engine of ENGINES) {
      expect(engine.id).toMatch(/^[a-z]+$/);
      expect(engine.label.length, `${engine.id} has no label`).toBeGreaterThan(8);
      // The question is the thing a person is actually choosing. "A Case Every Week"
      // is a name; "What came in this week?" is the decision.
      expect(engine.asks.endsWith('?'), `${engine.id} does not ask anything`).toBe(true);
      expect(engine.what.length, `${engine.id} is not explained`).toBeGreaterThan(40);
      expect(engine.rules.length, `${engine.id} states no rules`).toBeGreaterThan(40);
      expect(engine.cadences.length, `${engine.id} can be made as nothing`).toBeGreaterThan(0);
      expect(engine.leastPeople).toBeGreaterThan(0);
    }
    expect(new Set(ENGINES.map((one) => one.id)).size).toBe(ENGINES.length);
  });

  it('gives a fuel gauge to exactly the engines that spend something', () => {
    // The whole distinction the file is built on. An engine whose stories arrive
    // from outside, or whose situation never resolves, cannot run out. One that is
    // revealing something is spending it.
    for (const engine of ENGINES) {
      if (engine.renewal === 'revealed') {
        expect(engine.carries, `${engine.id} reveals something and never runs out`).toBeDefined();
        expect(engine.carries!).toBeGreaterThan(0);
        expect(engine.carries!).toBeLessThanOrEqual(MOST_PARTS);
      } else {
        expect(engine.carries, `${engine.id} is renewable and has a tank`).toBeUndefined();
      }
    }
  });

  it('never lets an engine that finishes carry something that keeps coming back', () => {
    for (const engine of ENGINES) {
      if (engine.carries !== undefined) {
        expect(
          engine.cadences.includes('returning'),
          `${engine.id} runs out after ${engine.carries} parts and claims it can keep coming back`,
        ).toBe(false);
      }
    }
  });

  it('leaves every cadence something that can carry it', () => {
    // A cadence no engine supports is a plan nobody can ever make.
    for (const cadence of ['single', 'closed', 'returning'] as const) {
      expect(enginesFor(cadence).length, `nothing can be made as ${CADENCE_LABEL[cadence]}`).toBeGreaterThan(0);
    }
  });

  it('answers to its own id and to nothing else', () => {
    expect(engineById('case')).toBe(ENGINE_BY_ID.case);
    expect(engineById('not-an-engine')).toBeUndefined();
    expect(engineById(undefined)).toBeUndefined();
  });
});

describe('every plan declares what shape of commitment it is', () => {
  it('and something can carry each one', () => {
    for (const plan of WAYS) {
      expect(['single', 'closed', 'returning'], `${plan.id} has no cadence`).toContain(plan.cadence);
      expect(
        enginesThatCarry(plan).length,
        `no engine in the build can carry ${plan.label}, so nobody can ever make it`,
      ).toBeGreaterThan(0);
    }
  });

  it('lets a film be made with no concept at all, and refuses television', () => {
    const bare = { ...withConcept('case'), concept: undefined, medium: 'film' } as Project;
    const feature = A_FEATURE;
    const series = A_SERIES;
    expect(whyNotMakeAs(bare, feature)).toBeUndefined();
    // The refusal the research is blunt about: a television premise with no weekly
    // generator dies in the room.
    expect(whyNotMakeAs(bare, series)).toContain('what makes the next one');
  });
});

describe('the four refusals', () => {
  it('refuses an engine that finishes when the plan keeps coming back', () => {
    const series = A_SERIES;
    expect(series.cadence).toBe('returning');
    const why = whyNotMakeAs(withConcept('transformation'), series);
    expect(why).toBeDefined();
    expect(why).toContain('finishes');
    // And it says where to go instead, because a refusal that does not is a wall.
    expect(why).toContain('what it can carry is');
  });

  it('allows the same plan on an engine that never runs out', () => {
    expect(whyNotMakeAs(withConcept('case'), A_SERIES)).toBeUndefined();
  });

  it('refuses a plan asking for more parts than the engine has fuel for', () => {
    const serial = ENGINE_BY_ID.serial!;
    const tooLong: MadeAs = { ...A_SEASON, parts: serial.carries! + 1 };
    const why = whyNotMakeAs(withConcept('serial'), tooLong);
    expect(why).toContain('nothing left to');
    expect(why).toContain(String(serial.carries));
  });

  it('refuses an ensemble too small to run the engine', () => {
    const needs = ENGINE_BY_ID.ensemble!.leastPeople;
    const why = whyNotMakeAs(withConcept('ensemble', needs - 1), A_SERIES);
    expect(why).toContain(String(needs));
  });

  it('refuses an engine the build does not have', () => {
    const odd = withConcept('case');
    odd.concept!.engineId = 'gone';
    expect(whyNotMakeAs(odd, A_SERIES)).toContain('not one this build has');
  });
});

describe('conceiving something', () => {
  const start = () => {
    const sim = quickSave({}, 'concept-test');
    const ours = Object.values(sim.universe.companies).find((one) => one.trade === 'film')!;
    sim.execute({ kind: 'company.develop', payload: { title: 'A Thing', medium: 'television' } });
    const project = Object.values(sim.universe.projects).find((one) => one.title === 'A Thing')!;
    return { sim, project, ours };
  };

  it('attaches a concept, and says so out loud', () => {
    const { sim, project } = start();
    const out = sim.execute<{ ok: boolean; error?: string }>({
      kind: 'company.conceive',
      payload: { projectId: project.id, engineId: 'case', worldId: 'is-39-reykjavik', people: 5 },
    });
    expect(out.value?.ok).toBe(true);
    expect(sim.universe.projects[project.id]!.concept?.engineId).toBe('case');
    expect(sim.universe.notifications.some((one) => one.refId === project.id)).toBe(true);
  });

  it('refuses an ensemble the engine cannot run on, by name and by number', () => {
    const { sim, project } = start();
    const out = sim.execute<{ ok: boolean; error?: string }>({
      kind: 'company.conceive',
      payload: { projectId: project.id, engineId: 'ensemble', worldId: 'is-39-reykjavik', people: 2 },
    });
    expect(out.value?.ok).toBe(false);
    expect(out.value?.error).toContain('4');
    expect(sim.universe.projects[project.id]!.concept).toBeUndefined();
  });

  it('refuses a world that is not a place', () => {
    const { sim, project } = start();
    expect(whyNotConceive(sim, {
      projectId: project.id, engineId: 'case', worldId: 'nowhere-at-all', people: 5,
    })).toContain('nowhere by that name');
  });

  it('refuses nought people, and refuses an unknown picture', () => {
    const { sim, project } = start();
    expect(whyNotConceive(sim, {
      projectId: project.id, engineId: 'case', worldId: 'is-39-reykjavik', people: 0,
    })).toContain('at least one person');
    expect(whyNotConceive(sim, {
      projectId: 'nope', engineId: 'case', worldId: 'is-39-reykjavik', people: 5,
    })).toContain('no such picture');
  });

  it('can be changed while it is an idea and not once it is being made', () => {
    const { sim, project } = start();
    const ask = (engineId: string) => sim.execute<{ ok: boolean; error?: string }>({
      kind: 'company.conceive',
      payload: { projectId: project.id, engineId, worldId: 'is-39-reykjavik', people: 6 },
    }).value;
    expect(ask('case')?.ok).toBe(true);
    expect(ask('dilemma')?.ok).toBe(true);
    expect(sim.universe.projects[project.id]!.concept?.engineId).toBe('dilemma');

    sim.universe.projects[project.id]!.stage = 'shooting';
    const shut = ask('case');
    expect(shut?.ok).toBe(false);
    expect(shut?.error).toContain('settled at the greenlight');
  });
});

describe('what the screen can offer', () => {
  it('offers only the plans the engine can honestly carry', () => {
    const could = couldBeMadeAs(withConcept('transformation'), WAYS);
    expect(could.length).toBeGreaterThan(0);
    for (const plan of could) expect(plan.cadence).not.toBe('returning');
    // And the distinction stated directly rather than by counting: a renewable
    // engine is offered the returning plan and a finishing one never is.
    const renewable = couldBeMadeAs(withConcept('case'), WAYS);
    expect(renewable.some((one) => one.cadence === 'returning')).toBe(true);
    expect(could.some((one) => one.cadence === 'returning')).toBe(false);
  });
});
