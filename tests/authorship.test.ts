/**
 * The system behind the system: what a maxed-out person's work comes out as.
 *
 * Three claims, and every one of them is arithmetic rather than assertion.
 *
 * One: everything the founder writes is a hundred, in all nine storytelling
 * departments, because the departments are averages of skills that are all at
 * the ceiling.
 *
 * Two: quality is a chain and every handoff between two different people
 * loses something. A perfect script directed by somebody else is not a perfect
 * film, and nothing on any screen may claim otherwise.
 *
 * Three: holding more than one job closes the seam between them. Hold all of
 * them and the finished thing is exactly the thing that was written, with no
 * spread around it at all — which is what the stack multiplier actually buys,
 * rather than a number above the top of the scale.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  HANDOFF_FIDELITY_BASE, JOBS, SELF_FIDELITY, STACK, STAGES, STORY_DEPARTMENTS,
  spreadFor, stackFor, type Job,
} from '@/engine/content/authorship';
import {
  capabilityFor, centred, fidelityBetween, jobsRequired, missingFrom,
  readWork, scriptFrom, settle, type Hand,
} from '@/engine/domain/quality';
import { readCrew, jobSheet, settleCrew, alignmentBetween } from '@/engine/systems/authorship';
import { SKILLS } from '@/engine/domain/skills';
import { CEILING } from '@/engine/content/prodigy';

const sheetAt = (value: number) => Object.fromEntries(SKILLS.map((s) => [s.id, value]));

function hand(id: string, job: Job, level: number, alignment = 50): Hand {
  const skills = sheetAt(level);
  return {
    id, name: id, alignment,
    capability: job === 'actor' ? level : capabilityFor(job, skills),
  };
}

describe('the nine storytelling departments', () => {
  it('are each drawn from skills that exist', () => {
    const ids = new Set(SKILLS.map((s) => s.id));
    for (const department of STORY_DEPARTMENTS) {
      expect(department.from.length, department.id).toBeGreaterThan(0);
      for (const id of department.from) expect(ids.has(id), `${department.id} reads unknown skill ${id}`).toBe(true);
      expect(department.weight, department.id).toBeGreaterThan(0);
    }
    expect(STORY_DEPARTMENTS).toHaveLength(9);
    expect(new Set(STORY_DEPARTMENTS.map((d) => d.id)).size).toBe(9);
  });

  it('come out at a hundred, every one of them, for a sheet at the ceiling', () => {
    const script = scriptFrom(sheetAt(CEILING));
    for (const department of STORY_DEPARTMENTS) {
      expect(script.departments[department.id], department.name).toBe(CEILING);
    }
    expect(script.overall).toBe(CEILING);
  });

  it('scale honestly for anybody else', () => {
    expect(scriptFrom(sheetAt(50)).overall).toBeCloseTo(50, 5);
    expect(scriptFrom(sheetAt(0)).overall).toBe(0);
    // And a lopsided writer reads lopsided rather than averaging out of sight.
    const lopsided = { ...sheetAt(40), dialogue: 100 };
    const script = scriptFrom(lopsided);
    expect(script.departments['dialogue']).toBe(100);
    expect(script.departments['structure']).toBe(40);
    expect(script.overall).toBeGreaterThan(40);
    expect(script.overall).toBeLessThan(55);
  });
});

describe('what the founder is worth in each of the five jobs', () => {
  it('reads a hundred in all of them', () => {
    const sim = quickSave({}, 'authorship-jobs');
    for (const row of jobSheet(sim)) {
      expect(row.capability, row.name).toBe(CEILING);
    }
    expect(jobSheet(sim)).toHaveLength(JOBS.length);
  });
});

describe('a handoff', () => {
  it('is lossless when one person holds both ends, and only then', () => {
    const me = hand('me', 'director', 100);
    const them = hand('them', 'director', 100, 100);
    expect(fidelityBetween(me, me)).toBe(SELF_FIDELITY);
    // Even two people who understand each other perfectly lose something.
    expect(fidelityBetween(me, them)).toBeLessThan(SELF_FIDELITY);
    expect(fidelityBetween(me, them)).toBeGreaterThan(HANDOFF_FIDELITY_BASE);
  });

  it('gets better the better two people understand each other', () => {
    const from = hand('a', 'writer', 100);
    const low = fidelityBetween(from, hand('b', 'director', 100, 10));
    const high = fidelityBetween(from, hand('b', 'director', 100, 95));
    expect(high).toBeGreaterThan(low);
    expect(low).toBeGreaterThanOrEqual(HANDOFF_FIDELITY_BASE);
  });
});

describe('the chain', () => {
  const perfectScript = () => scriptFrom(sheetAt(CEILING), 'me');
  const meIn = (job: Job) => hand('me', job, CEILING);

  it('gives a hundred, exactly, when one person holds every job', () => {
    const read = readWork(perfectScript(), {
      hands: { writer: meIn('writer'), director: meIn('director'), producer: meIn('producer'), actor: meIn('actor') },
      isSeries: false, subjectId: 'me',
    });
    expect(read.quality).toBe(100);
    expect(read.coherence).toBe(100);
    expect(read.spread).toBe(0);
    expect(read.jobsHeld).toBe(read.jobsInChain);
    for (const stage of read.stages) {
      expect(stage.unbroken, stage.name).toBe(true);
      expect(stage.out, stage.name).toBe(100);
    }
  });

  it('does not give a hundred when the same script is handed to somebody else', () => {
    const read = readWork(perfectScript(), {
      hands: {
        writer: meIn('writer'),
        director: hand('d', 'director', 72, 55),
        producer: hand('p', 'producer', 72, 55),
        actor: hand('a', 'actor', 72, 55),
      },
      isSeries: false, subjectId: 'me',
    });
    expect(read.script.overall).toBe(100);
    expect(read.quality).toBeLessThan(90);
    expect(read.quality).toBeGreaterThan(70);
    expect(read.stages.every((s) => !s.unbroken)).toBe(true);
  });

  it('rises with every job the same person takes back', () => {
    const crews: Partial<Record<Job, Hand>>[] = [
      { writer: meIn('writer'), director: hand('d', 'director', 72, 55), producer: hand('p', 'producer', 72, 55), actor: hand('a', 'actor', 72, 55) },
      { writer: meIn('writer'), director: meIn('director'), producer: hand('p', 'producer', 72, 55), actor: hand('a', 'actor', 72, 55) },
      { writer: meIn('writer'), director: meIn('director'), producer: meIn('producer'), actor: hand('a', 'actor', 72, 55) },
      { writer: meIn('writer'), director: meIn('director'), producer: meIn('producer'), actor: meIn('actor') },
    ];
    const reads = crews.map((hands) => readWork(perfectScript(), { hands, isSeries: false, subjectId: 'me' }));
    for (let i = 1; i < reads.length; i++) {
      expect(reads[i]!.quality, `${i} jobs`).toBeGreaterThan(reads[i - 1]!.quality);
      expect(reads[i]!.spread, `${i} jobs`).toBeLessThan(reads[i - 1]!.spread);
      expect(reads[i]!.stack.multiplier).toBeGreaterThanOrEqual(reads[i - 1]!.stack.multiplier);
    }
    expect(reads[3]!.spread).toBe(0);
  });

  it('cannot rescue a weak script by shooting it well, but does lift it', () => {
    const weak = scriptFrom(sheetAt(66), 'w');
    const read = readWork(weak, {
      hands: { writer: hand('w', 'writer', 66), director: meIn('director'), producer: meIn('producer'), actor: meIn('actor') },
      isSeries: false, subjectId: 'me',
    });
    // Better than the script, and nowhere near what the founder's own would be.
    expect(read.quality).toBeGreaterThan(weak.overall);
    expect(read.quality).toBeLessThan(85);
  });

  it('puts an extra seam in a series, so the same crew reads lower', () => {
    const crew = {
      writer: meIn('writer'),
      director: hand('d', 'director', 72, 55),
      producer: hand('p', 'producer', 72, 55),
      actor: hand('a', 'actor', 72, 55),
      showrunner: hand('s', 'showrunner', 72, 55),
    };
    const film = readWork(perfectScript(), { hands: crew, isSeries: false, subjectId: 'me' });
    const series = readWork(perfectScript(), { hands: crew, isSeries: true, subjectId: 'me' });
    expect(series.jobsInChain).toBe(film.jobsInChain + 1);
    expect(series.quality).toBeLessThan(film.quality);
  });

  it('leaves nothing to luck at a full stack, and real luck at none', () => {
    const full = readWork(perfectScript(), {
      hands: { writer: meIn('writer'), director: meIn('director'), producer: meIn('producer'), actor: meIn('actor') },
      isSeries: false, subjectId: 'me',
    });
    for (const roll of [0, 0.5, 1]) expect(settle(full, roll)).toBe(full.quality);

    const none = readWork(perfectScript(), {
      hands: { writer: hand('w', 'writer', 80), director: hand('d', 'director', 80, 50), producer: hand('p', 'producer', 80, 50), actor: hand('a', 'actor', 80, 50) },
      isSeries: false, subjectId: 'me',
    });
    expect(none.spread).toBeGreaterThan(0);
    expect(settle(none, 0)).toBeLessThan(settle(none, 1));
  });
});

describe('the stack', () => {
  it('never pushes anything above the top of the scale', () => {
    for (const step of STACK) {
      expect(step.multiplier).toBeGreaterThanOrEqual(1);
      expect(step.multiplier).toBeLessThanOrEqual(1.3);
    }
    const read = readWork(scriptFrom(sheetAt(CEILING), 'me'), {
      hands: {
        writer: hand('me', 'writer', 100), director: hand('me', 'director', 100),
        producer: hand('me', 'producer', 100), actor: hand('me', 'actor', 100),
      },
      isSeries: false, subjectId: 'me',
    });
    expect(read.coherence).toBe(100);
    expect(read.quality).toBe(100);
    expect(read.receptionMultiplier).toBe(read.stack.multiplier);
  });

  it('keeps coherence rising all the way to the last job, without saturating', () => {
    // This is a regression: coherence used to be the mean of the fidelities
    // times the stack multiplier, which hit 100 at three jobs and made the
    // fourth one worth nothing at all on that axis.
    const script = scriptFrom(sheetAt(CEILING), 'me');
    const other = (job: Job) => hand(`x_${job}`, job, 100, 50);
    const ladder: Partial<Record<Job, Hand>>[] = [
      { writer: other('writer'), director: other('director'), producer: other('producer'), actor: other('actor') },
      { writer: hand('me', 'writer', 100), director: other('director'), producer: other('producer'), actor: other('actor') },
      { writer: hand('me', 'writer', 100), director: hand('me', 'director', 100), producer: other('producer'), actor: other('actor') },
      { writer: hand('me', 'writer', 100), director: hand('me', 'director', 100), producer: hand('me', 'producer', 100), actor: other('actor') },
      { writer: hand('me', 'writer', 100), director: hand('me', 'director', 100), producer: hand('me', 'producer', 100), actor: hand('me', 'actor', 100) },
    ];
    const coherences = ladder.map((hands) => readWork(script, { hands, isSeries: false, subjectId: 'me' }).coherence);
    // The writer is not a seam of its own, so the first two are level. Every
    // job after that closes one, and only the last reaches the top.
    expect(coherences[0]).toBe(coherences[1]);
    for (let i = 2; i < coherences.length; i++) {
      expect(coherences[i], `job ${i}`).toBeGreaterThan(coherences[i - 1]!);
    }
    expect(coherences[coherences.length - 1]).toBe(100);
    expect(coherences[coherences.length - 2]).toBeLessThan(100);
  });

  it('rises with each job and is named at every step', () => {
    for (let jobs = 0; jobs <= 5; jobs++) {
      const step = stackFor(jobs);
      expect(step.jobs).toBe(jobs);
      expect(step.name.length).toBeGreaterThan(3);
      if (jobs > 1) expect(step.multiplier).toBeGreaterThan(stackFor(jobs - 1).multiplier);
    }
    expect(stackFor(99).jobs).toBe(5);
    expect(stackFor(-3).jobs).toBe(0);
  });

  it('collapses the spread to nothing exactly when every job is held', () => {
    expect(spreadFor(0, 4)).toBeGreaterThan(0);
    expect(spreadFor(4, 4)).toBe(0);
    expect(spreadFor(5, 5)).toBe(0);
    expect(spreadFor(2, 4)).toBeCloseTo(spreadFor(0, 4) / 2, 5);
  });
});

describe('read against a real save', () => {
  it('gives the founder a hundred script and a hundred picture when they do it all', () => {
    const sim = quickSave({}, 'authorship-live');
    const me = sim.player.id;
    const read = readCrew(sim, { writer: me, director: me, producer: me, actor: me });
    expect(read.script.overall).toBe(CEILING);
    expect(read.quality).toBe(CEILING);
    expect(read.spread).toBe(0);
    expect(read.stack.name).toBe('Total Authorship');
  });

  it('drops the moment anybody else is in the chain', () => {
    const sim = quickSave({}, 'authorship-live-hired');
    const me = sim.player.id;
    const other = Object.values(sim.universe.people).find((p) => !p.isPlayer)!;
    const alone = readCrew(sim, { writer: me, director: me, producer: me, actor: me });
    const hired = readCrew(sim, { writer: me, director: other.id, producer: me, actor: me });
    expect(hired.quality).toBeLessThan(alone.quality);
    expect(hired.spread).toBeGreaterThan(0);
    expect(hired.jobsHeld).toBe(3);
  });

  it('reads a stranger at fifty and yourself at a hundred', () => {
    const sim = quickSave({}, 'authorship-alignment');
    const me = sim.player.id;
    const other = Object.values(sim.universe.people).find((p) => !p.isPlayer && !sim.universe.relationships[`${p.id}`])!;
    expect(alignmentBetween(sim, me, me)).toBe(100);
    expect(alignmentBetween(sim, me, other.id)).toBeGreaterThanOrEqual(0);
    expect(alignmentBetween(sim, me, other.id)).toBeLessThanOrEqual(100);
  });

  it('refuses a chain with nobody writing it', () => {
    const sim = quickSave({}, 'authorship-nowriter');
    expect(() => readCrew(sim, { director: sim.player.id })).toThrow(/write/i);
  });

  it('writes an audit that names every seam', () => {
    const sim = quickSave({}, 'authorship-audit');
    const me = sim.player.id;
    const other = Object.values(sim.universe.people).find((p) => !p.isPlayer)!;
    const { read, outcome } = settleCrew(sim, { writer: me, director: other.id, producer: me, actor: me }, { title: 'The Test' });
    const audit = sim.universe.audits.find((a) => a.kind === 'work.quality');
    expect(audit).toBeDefined();
    expect(audit!.factors.length).toBe(read.stages.length + 2);
    expect(audit!.factors.some((f) => /handoff/i.test(f.detail))).toBe(true);
    expect(Number(audit!.outcome)).toBe(Math.round(outcome));
    for (const factor of audit!.factors) expect(factor.knowable).toBe(true);
  });

  it('is deterministic: the same save settles the same picture twice', () => {
    const a = quickSave({}, 'authorship-determinism');
    const b = quickSave({}, 'authorship-determinism');
    const otherA = Object.values(a.universe.people).find((p) => !p.isPlayer)!.id;
    const otherB = Object.values(b.universe.people).find((p) => !p.isPlayer)!.id;
    const crewA = { writer: a.player.id, director: otherA, producer: a.player.id, actor: a.player.id };
    const crewB = { writer: b.player.id, director: otherB, producer: b.player.id, actor: b.player.id };
    expect(settleCrew(a, crewA, { refId: 'x' }).outcome).toBe(settleCrew(b, crewB, { refId: 'x' }).outcome);
  });
});

describe('the planning command', () => {
  it('answers what a crew would produce without changing anything', () => {
    const sim = quickSave({}, 'authorship-project');
    const me = sim.player.id;
    const before = JSON.stringify(sim.universe);
    const result = sim.execute<{ quality: number; script: number; stack: string; spread: number; stages: unknown[] }>({
      kind: 'work.project',
      payload: { crew: { writer: me, director: me, producer: me, actor: me }, title: 'A Test' },
    });
    expect(result.ok).toBe(true);
    expect(result.value!.script).toBe(100);
    expect(result.value!.quality).toBe(100);
    expect(result.value!.spread).toBe(0);
    expect(result.value!.stack).toBe('Total Authorship');
    expect(result.value!.stages.length).toBe(STAGES.filter((s) => !s.seriesOnly).length);
    expect(JSON.stringify(sim.universe), 'projecting changed the world').toBe(before);
  });

  it('refuses a crew naming somebody who is not in the save', () => {
    const sim = quickSave({}, 'authorship-ghost');
    const result = sim.execute({ kind: 'work.project', payload: { crew: { writer: 'person_nobody' } } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/n[o’]t in this save/i);
  });
});

describe('a crew with a hole in it', () => {
  const script = () => scriptFrom(sheetAt(CEILING), 'me');
  const meIn = (job: Job) => hand('me', job, CEILING);

  it('names every job nobody is holding', () => {
    expect(jobsRequired(false)).toEqual(['writer', 'director', 'producer', 'actor']);
    expect(jobsRequired(true)).toContain('showrunner');
    expect(missingFrom({ writer: meIn('writer') }, false)).toEqual(['director', 'producer', 'actor']);
    expect(missingFrom({ writer: meIn('writer'), director: meIn('director'), producer: meIn('producer'), actor: meIn('actor') }, false)).toEqual([]);
    // A showrunner is only missing when it is a series.
    expect(missingFrom({ writer: meIn('writer'), director: meIn('director'), producer: meIn('producer'), actor: meIn('actor') }, true)).toEqual(['showrunner']);
  });

  it('is never reported as certain', () => {
    // The regression this locks: a picture with no lead actor came back as
    // "86, exactly, nothing left to chance". A department nobody is running is
    // an unknown, so it is the widest spread there is, never the narrowest.
    for (const hands of [
      { writer: meIn('writer') },
      { writer: meIn('writer'), producer: meIn('producer'), actor: meIn('actor') },
      { writer: meIn('writer'), director: meIn('director'), producer: meIn('producer') },
    ]) {
      const read = readWork(script(), { hands, isSeries: false, subjectId: 'me' });
      expect(read.missing.length, JSON.stringify(Object.keys(hands))).toBeGreaterThan(0);
      expect(read.spread, 'an incomplete crew was reported as certain').toBe(16);
    }
  });

  it('is refused outright rather than guessed at, against a real save', () => {
    const sim = quickSave({}, 'authorship-incomplete');
    const me = sim.player.id;
    expect(() => readCrew(sim, { writer: me, director: me, producer: me })).toThrow(/lead/i);
    expect(() => readCrew(sim, { writer: me, producer: me, actor: me })).toThrow(/director/i);
    expect(() => readCrew(sim, {
      writer: me, director: me, producer: me, actor: me,
    }, { isSeries: true })).toThrow(/showrunner/i);
    // And the complete one still reads.
    expect(readCrew(sim, { writer: me, director: me, producer: me, actor: me }).quality).toBe(CEILING);
  });
});

describe('how the luck falls', () => {
  it('clusters near what was made rather than spreading flat', () => {
    expect(centred(0)).toBe(-1);
    expect(centred(0.5)).toBe(0);
    expect(centred(1)).toBe(1);
    // A flat roll made the far ends as likely as the mark. They are not.
    let middle = 0;
    let edges = 0;
    const N = 20_000;
    for (let i = 0; i < N; i++) {
      const x = Math.abs(centred(i / N));
      if (x <= 0.2) middle++;
      if (x >= 0.8) edges++;
    }
    expect(middle / N, 'outcomes do not cluster near the mark').toBeGreaterThan(0.3);
    expect(edges / N, 'the extremes are too common').toBeLessThan(0.06);
    expect(middle).toBeGreaterThan(edges * 4);
  });

  it('is monotone, so a better roll is never a worse picture', () => {
    const read = readWork(scriptFrom(sheetAt(CEILING), 'me'), {
      hands: {
        writer: hand('me', 'writer', 100), director: hand('d', 'director', 72, 55),
        producer: hand('p', 'producer', 72, 55), actor: hand('a', 'actor', 72, 55),
      },
      isSeries: false, subjectId: 'me',
    });
    let previous = -Infinity;
    for (let i = 0; i <= 20; i++) {
      const value = settle(read, i / 20);
      expect(value, `roll ${i / 20}`).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  it('gives two unnamed pieces of work different luck', () => {
    // They shared the seed 'unfiled' and came out identically.
    const sim = quickSave({}, 'authorship-unfiled');
    const me = sim.player.id;
    const other = Object.values(sim.universe.people).find((p) => !p.isPlayer)!;
    const crew = { writer: me, director: other.id, producer: me, actor: me };
    const first = settleCrew(sim, crew, { title: 'One' });
    const second = settleCrew(sim, crew, { title: 'Two' });
    expect(first.read.spread).toBeGreaterThan(0);
    expect(second.outcome, 'two separate works settled identically').not.toBe(first.outcome);
  });

  it('still settles the same named work the same way twice', () => {
    const sim = quickSave({}, 'authorship-named');
    const me = sim.player.id;
    const other = Object.values(sim.universe.people).find((p) => !p.isPlayer)!;
    const crew = { writer: me, director: other.id, producer: me, actor: me };
    const a = settleCrew(sim, crew, { refId: 'work_alpha' });
    const b = settleCrew(sim, crew, { refId: 'work_alpha' });
    expect(b.outcome).toBe(a.outcome);
  });
});
