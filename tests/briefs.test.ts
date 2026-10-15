/**
 * A practice brief, end to end (from 2026-10-12; `systems/briefs.ts`, `content/briefs/`).
 *
 * - The guarantee over every brief, every reading and every fitting way of playing it, and over a callback answered.
 * - A reading never misfits; leans never add weight; an ability or technique a brief doesn't read changes nothing, and
 *   one it does raises it.
 * - Two tones held at once ask something different from a change between beats, and both ask more rehearsal.
 * - A brief's genres, in any order or repeated, change nothing about the take, and share one session's practice.
 * - Played through its commands: chosen, prepared, taped, kept with its purpose; refused with reasons; an action sent
 *   twice lived once; the same take again the same day keeps half its practice; a callback earned, answered, cleared;
 *   the record and the draw kept across a save and a reload.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import type { Person } from '@/engine/domain/model';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { BRIEFS, BRIEF_BY_ID, briefsOf, type Brief } from '@/engine/content/briefs';
import { AXES } from '@/engine/content/approaches';
import { MASTERED } from '@/engine/content/abilities';
import type { Axis } from '@/engine/content/material';
import { BRIEF, briefContext, briefMaterial, briefPiece, genreKnown, prepSpeed, recordOf, requiredOf, shareOf, suggestions, tapeReadsOf, type BriefRecord } from '@/engine/systems/briefs';
import { leanedWeights, type Performer } from '@/engine/systems/evaluation';
import { judgePiece, segmentRequired } from '@/engine/systems/piece';
import { PIECE } from '@/engine/content/piece';
import { addPractice, genreState } from '@/engine/systems/engagement';
import { materialContext, misfitOf, type Playing } from '@/engine/systems/material';
import { TASK_PROFILES } from '@/engine/content/tasks';
import { evenCraft } from '@/engine/systems/school';
import { abilityFull } from '@/engine/systems/attributes';
import { activitiesOf, courseworkOf, prepareRefusal, setWork } from '@/engine/systems/coursework';

const ABILITIES = ['emotionalDepth', 'presence', 'listening', 'imagination', 'focus', 'memory', 'adaptability', 'composure', 'vocal', 'physical', 'discipline', 'stamina'] as const;
const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const blank = (): BriefRecord => ({ prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] });
const FULL_PREP = { interpretation: 1, memorization: 1, rehearsal: 1, genre: 1, approach: 1 };
const performer = (abilities: Partial<Record<string, number>>, technique = 0, techs: Partial<Record<string, number>> = {}): Performer => ({ ability: (id) => abilities[id] ?? 50, full: () => 100, technique: (s) => techs[s] ?? technique });
const FULL: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };
// A take as the game judges one: in its beats (`systems/piece.ts`), from 2026-10-12.
const run = (p: Performer, b: Brief, rec: BriefRecord, over: Parameters<typeof briefContext>[3] = {}, readiness = 100) => judgePiece('seed', p, { ...briefContext(nobody, b, rec, { prep: FULL_PREP, ...over }), condition: { readiness }, key: `t:${b.id}`, expected: true }, briefPiece(b, rec));

/** The ways a brief can be played that fit it: nothing chosen, and each side of each axis it allows. */
type Sides = Omit<Playing, 'chosenAt' | 'prep'>;
function fitting(b: Brief): Sides[] {
  const out: Sides[] = [{}];
  for (const axis of Object.keys(AXES) as Axis[]) for (const side of AXES[axis].values) if (!misfitOf(axis, side, briefMaterial(b))) out.push({ [axis]: side } as Sides);
  return out;
}

describe('the guarantee, in every brief', () => {
  it('full abilities, mastered techniques, complete preparation, a sufficient day and a fitting choice give exactly 100, in every reading and every fitting way of playing it', () => {
    let cases = 0;
    for (const b of BRIEFS) for (const r of b.readings) for (const sides of fitting(b)) {
      const e = run(FULL, b, blank(), { reading: r.id, playing: { ...sides, chosenAt: 0, prep: 1 } }, 60);
      expect(e.overall, `${b.id} ${r.id} ${JSON.stringify(sides)}`).toBe(100);
      expect(e.mastery).toBe(true);
      expect(e.limits).toEqual([]);
      cases += 1;
    }
    expect(cases).toBeGreaterThan(BRIEFS.length * 2 * 5);
  });

  it('a callback answered as its note asks is 100 too, and against its note holds the work back, said', () => {
    for (const b of BRIEFS.slice(0, 40)) {
      const axis = (Object.keys(AXES) as Axis[]).find((a) => !b.allows?.[a])!;
      const [side, other] = AXES[axis].values;
      const rec: BriefRecord = { ...blank(), callback: { axis, side, why: 'x', at: 0 } };
      expect(run(FULL, b, rec, { reading: b.readings[0]!.id, playing: { [axis]: side, chosenAt: 0, prep: 1 } }).overall, b.id).toBe(100);
      const against = run(FULL, b, rec, { reading: b.readings[0]!.id, playing: { [axis]: other, chosenAt: 0, prep: 1 } });
      expect(against.overall, b.id).toBeLessThan(100);
      expect(against.limits.some((l) => l.kind === 'fit')).toBe(true);
    }
  });
});

describe('what a brief reads', () => {
  it('no reading misfits, and no lean adds weight', () => {
    for (const b of BRIEFS) for (const r of b.readings) {
      const ctx = briefContext(nobody, b, blank(), { reading: r.id });
      expect(ctx.fit, `${b.id} ${r.id}`).toEqual({});
      const w = leanedWeights(ctx.task, [], ctx.lean);
      const base = Object.values(ctx.task.dims).reduce((s, d) => s + d!.weight, 0);
      expect(Object.values(w).reduce((s, x) => s + (x ?? 0), 0)).toBeCloseTo(base, 9);
    }
  });

  it('an ability it doesn’t read changes nothing, and one it reads raises the work', () => {
    for (const b of BRIEFS) {
      const r = b.readings[0]!.id;
      const ctx = briefContext(nobody, b, blank(), { reading: r });
      // Stamina is read by every brief, from 2026-10-12, as the drain through its beats (`systems/piece.ts`).
      const read = new Set<string>([...Object.values(ctx.task.dims).flatMap((d) => d!.inputs.flatMap((i) => ('ability' in i ? [i.ability] : []))), ...Object.values(ctx.inputs).flatMap((xs) => (xs ?? []).map((x) => x.ability)), 'stamina']);
      const base = run(performer({}), b, blank(), { reading: r }).overall;
      for (const a of ABILITIES) {
        const up = run(performer({ [a]: 80 }), b, blank(), { reading: r }).overall;
        if (read.has(a)) expect(up, `${b.id}: ${a}`).toBeGreaterThan(base);
        else expect(up, `${b.id}: ${a}`).toBe(base);
      }
      // A technique it doesn't read changes nothing; one it reads raises it.
      const reads = tapeReadsOf(b);
      const unread = (['singing', 'combat', 'accents', 'intimacy', 'dance', 'clown'] as const).find((s) => reads[s] === undefined);
      if (unread) expect(run(performer({}, 40, { [unread]: 90 }), b, blank(), { reading: r }).overall).toBe(run(performer({}, 40), b, blank(), { reading: r }).overall);
      const one = Object.keys(reads)[0]!;
      expect(run(performer({}, 40, { [one]: 90 }), b, blank(), { reading: r }).overall).toBeGreaterThan(run(performer({}, 40), b, blank(), { reading: r }).overall);
    }
  });

  it('each reading changes what the work leans on, so actors of different strengths come out differently by the reading', () => {
    const actors = [
      performer({ emotionalDepth: 80, composure: 75, listening: 30, adaptability: 30, physical: 40, focus: 55 }, 45),
      performer({ emotionalDepth: 30, composure: 35, listening: 85, adaptability: 80, physical: 70, focus: 40 }, 45),
      performer({ imagination: 85, presence: 80, memory: 30, discipline: 30, vocal: 75, stamina: 40 }, 45),
    ];
    for (const b of BRIEFS) {
      const differs = actors.some((p) => new Set(b.readings.map((r) => run(p, b, blank(), { reading: r.id }).overall)).size > 1);
      expect(differs, b.id).toBe(true);
    }
  });
});

describe('tone held and tone changed', () => {
  const base = BRIEF_BY_ID['brief-drama']!;
  const shaped = (beats: Brief['beats'], id: string): Brief => ({ ...base, id, beats });
  const none = shaped([{ what: 'one thing', tones: ['comic'] }, { what: 'the same thing', tones: ['comic'] }], 'brief-drama-t0');
  const change = shaped([{ what: 'a joke', tones: ['comic'] }, { what: 'the grief', tones: ['grave'] }], 'brief-drama-t1');
  const held = shaped([{ what: 'a joke that is grief', tones: ['comic', 'grave'] }, { what: 'the same', tones: ['comic', 'grave'] }], 'brief-drama-t2');

  it('asks more rehearsal of the beat a change leads into, and of a beat held two ways, said in what completes it', () => {
    // From 2026-10-12 the beat asks it, not the whole brief (`systems/piece.ts`).
    const at = (b: Brief, s: number) => segmentRequired(briefPiece(b, {}), requiredOf(b).rehearsal!, s);
    expect([at(none, 0), at(none, 1)]).toEqual([BRIEF.complete.rehearsal, BRIEF.complete.rehearsal]);
    expect(at(change, 0)).toBeCloseTo(BRIEF.complete.rehearsal, 9);
    expect(at(change, 1)).toBeCloseTo(BRIEF.complete.rehearsal + PIECE.brief.perTurn, 9);
    expect(at(held, 0)).toBeCloseTo(BRIEF.complete.rehearsal + PIECE.brief.perBlend, 9);
    // Independent of the sizes: the beat after a change, or one held two ways, asks more than a beat that does neither.
    expect(at(change, 1)).toBeGreaterThan(at(change, 0) + 0.01);
    expect(at(held, 1)).toBeGreaterThan(at(none, 1) + 0.01);
    // And it reaches the result: rehearsed only to the base, the beat after the change comes out under the beat before it.
    const part = { prep: { interpretation: 1, memorization: 1, rehearsal: BRIEF.complete.rehearsal }, takes: [] };
    const e = run(performer({}, 60), change, part, { prep: { ...FULL_PREP, rehearsal: BRIEF.complete.rehearsal } });
    expect(e.piece!.segments[1]!.part).toBeLessThan(e.piece!.segments[1]!.required);
    expect(e.piece!.segments[0]!.part).toBeGreaterThanOrEqual(e.piece!.segments[0]!.required);
  });

  it('asks adaptability of a change and depth of a held beat, so different actors meet each differently', () => {
    const r = base.readings[0]!.id;
    const nimble = performer({ adaptability: 90, emotionalDepth: 30 });
    const deep = performer({ adaptability: 30, emotionalDepth: 90 });
    const change1 = run(nimble, change, blank(), { reading: r }).overall - run(deep, change, blank(), { reading: r }).overall;
    const held1 = run(nimble, held, blank(), { reading: r }).overall - run(deep, held, blank(), { reading: r }).overall;
    expect(change1).toBeGreaterThan(held1);
    for (const b of [none, change, held]) expect(run(FULL, b, blank(), { reading: r }).overall).toBe(100);
    // The held beat itself asks depth: against the same scene with nothing held, the deep actor gains more than the nimble one.
    expect(run(deep, held, blank(), { reading: r }).overall - run(deep, none, blank(), { reading: r }).overall).toBeGreaterThan(run(nimble, held, blank(), { reading: r }).overall - run(nimble, none, blank(), { reading: r }).overall);
  });
});

describe('a brief’s genres', () => {
  it('in any order, or repeated, change nothing about a take', () => {
    for (const b of BRIEFS.filter((x) => x.kinds.length > 1).concat(BRIEFS.slice(0, 20))) {
      const shuffled: Brief = { ...b, kinds: [...b.kinds].reverse().concat(b.kinds) };
      expect(tapeReadsOf(shuffled)).toEqual(tapeReadsOf(b));
      const p = performer({ listening: 70 }, 40);
      expect(run(p, shuffled, blank(), { reading: b.readings[0]!.id })).toEqual(run(p, b, blank(), { reading: b.readings[0]!.id }));
    }
  });

  it('share one session’s practice however many there are, so a tag adds no growth', () => {
    const one = { engagement: { byGenre: {} } } as unknown as Person;
    const two = { engagement: { byGenre: {} } } as unknown as Person;
    addPractice(one, ['drama'], 1);
    addPractice(two, ['drama', 'comedy', 'drama'], 1);
    const total = (p: Person) => Object.values(p.engagement!.byGenre).reduce((s, g) => s + g.practice, 0);
    expect(total(two)).toBeCloseTo(total(one), 6);
  });
});

// --- Played through the commands.

function student(seed: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  return sim;
}
const rest = (sim: Simulation) => {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
};
const go = (sim: Simulation, kind: string, payload: Record<string, unknown>) => { rest(sim); return sim.execute<Record<string, unknown>>({ kind, payload }); };
function prepared(sim: Simulation, id: string, rounds = 6) { for (let i = 0; i < rounds; i += 1) for (const step of ['read', 'lines', 'rehearse']) go(sim, 'brief.prepare', { brief: id, step }); }
function mastered(sim: Simulation) {
  const p = sim.player;
  p.craft = evenCraft(MASTERED);
  for (const k of ['emotion', 'memorization', 'voice', 'movement'] as const) p.craft[k] = 100;
  p.attrs = { presence: 100, composure: 100, listening: 100, imagination: 100, focus: 100, adaptability: 100, discipline: 100 };
  p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
}

describe('a brief, played', () => {
  it('refuses a take before a reading is chosen and a rehearsal before any lines, each with its reason', () => {
    const sim = student('brief-refusals');
    expect(go(sim, 'practice.self_tape', { genre: 'drama' }).error).toMatch(/Choose a reading first/);
    expect(go(sim, 'brief.prepare', { brief: 'brief-drama', step: 'rehearse' }).error).toMatch(/Learn some of the lines first/);
    expect(go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'nonsense' }).error).toMatch(/isn’t a reading/);
    expect(go(sim, 'practice.self_tape', { genre: 'comedy', brief: 'brief-drama' }).error).toMatch(/isn’t a scene of that genre/);
    sim.player.wellbeing.energy = 5;
    go(sim, 'brief.prepare', { brief: 'brief-drama', step: 'lines' });
    sim.player.wellbeing.energy = 5;
    expect(sim.execute({ kind: 'brief.prepare', payload: { brief: 'brief-drama', step: 'rehearse' } }).error).toMatch(/too tired/);
  });

  it('is chosen, prepared and taped, kept with its purpose, and each step spends its time', () => {
    const sim = student('brief-played');
    expect(go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'guarded', scale: 'restrained' }).ok).toBe(true);
    const t0 = sim.now;
    const step = go(sim, 'brief.prepare', { brief: 'brief-drama', step: 'read' });
    expect(step.ok).toBe(true);
    expect(sim.now - t0).toBe(30 * 60_000);
    const first = go(sim, 'practice.self_tape', { genre: 'drama' });
    expect(first.value).toMatchObject({ brief: 'brief-drama', purpose: 'first' });
    prepared(sim, 'brief-drama');
    const better = go(sim, 'practice.self_tape', { genre: 'drama' });
    expect(better.value!.purpose).toBe('improved');
    expect(better.value!.overall as number).toBeGreaterThan(first.value!.overall as number);
    go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'listening', scale: 'restrained' });
    expect(go(sim, 'practice.self_tape', { genre: 'drama' }).value!.purpose).toBe('another-reading');
    const rec = recordOf(sim.player, 'brief-drama');
    expect(rec.takes.map((t) => t.purpose)).toEqual(['first', 'improved', 'another-reading']);
    expect(rec.takes.every((t) => t.chief === undefined || /points/.test(t.chief))).toBe(true);
    // A change of reading kept half the breakdown.
    expect(rec.takes[2]!.prep.interpretation!).toBeCloseTo(rec.takes[1]!.prep.interpretation! * BRIEF.readingKept, 2);
    expect(sim.player.work!.filter((w) => w.task === 'tape')).toHaveLength(3);
  });

  it('goes half as far with a step done again the same day', () => {
    const sim = student('brief-step-twice');
    go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'guarded' });
    const one = go(sim, 'brief.prepare', { brief: 'brief-drama', step: 'read' }).value!.moved as number;
    const two = go(sim, 'brief.prepare', { brief: 'brief-drama', step: 'read' }).value!.moved as number;
    // A share of what's left either way; the second, the same day, at half the share.
    expect(two).toBeLessThan(one * (1 - one) * 0.65);
    expect(two).toBeGreaterThan(one * (1 - one) * 0.35);
  });

  it('lives an action sent twice once, and the same take again the same day keeps half its practice', () => {
    const sim = student('brief-twice');
    go(sim, 'brief.choose', { brief: 'brief-comedy', reading: BRIEF_BY_ID['brief-comedy']!.readings[0]!.id });
    const before = JSON.stringify(sim.player.briefs);
    expect(go(sim, 'brief.prepare', { brief: 'brief-comedy', step: 'read', actionId: 'x-1' }).ok).toBe(true);
    const after = JSON.stringify(sim.player.briefs);
    expect(go(sim, 'brief.prepare', { brief: 'brief-comedy', step: 'read', actionId: 'x-1' }).error).toMatch(/already done/);
    expect(JSON.stringify(sim.player.briefs)).toBe(after);
    expect(after).not.toBe(before);
    // Known past what completes it, so a second take is the same work again: the first take's practice adds nothing to it.
    genreState(sim.player, 'comedy').familiarity = 40;
    const p0 = genreState(sim.player, 'comedy').practice;
    go(sim, 'practice.self_tape', { genre: 'comedy' });
    const p1 = genreState(sim.player, 'comedy').practice;
    go(sim, 'practice.self_tape', { genre: 'comedy' });
    const p2 = genreState(sim.player, 'comedy').practice;
    expect(p2 - p1).toBeLessThan((p1 - p0) * 0.55);
    expect(recordOf(sim.player, 'brief-comedy').takes.at(-1)!.purpose).toBe('again');
  });

  it('earns a callback with a Strong take: a harder pitch with a note said before it, answered, then cleared', () => {
    const sim = student('brief-callback');
    mastered(sim);
    const b = BRIEF_BY_ID['brief-thriller']!;
    go(sim, 'genre.study', { genre: 'thriller' });
    genreState(sim.player, 'thriller').familiarity = 70;
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    prepared(sim, b.id);
    const take = go(sim, 'practice.self_tape', { genre: 'thriller' });
    expect(take.value!.band).toMatch(/strong|exceptional/);
    const cb = recordOf(sim.player, b.id).callback!;
    expect(cb).toBeDefined();
    expect(b.allows?.[cb.axis]).toBeUndefined();
    expect(briefContext(sim.player, b, recordOf(sim.player, b.id)).difficulty).toBeCloseTo(BRIEF.difficulty + BRIEF.callback, 9);
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id, [cb.axis]: cb.side });
    prepared(sim, b.id, 3);
    const answered = go(sim, 'practice.self_tape', { genre: 'thriller' });
    expect(answered.value!.purpose).toBe('callback');
    const rec = recordOf(sim.player, b.id);
    expect(rec.takes.at(-1)!.callback).toEqual({ axis: cb.axis, side: cb.side });
    expect(sim.player.work!.at(-1)!.limits.some((l) => l.kind === 'fit')).toBe(false);
  });

  it('keeps the record across a save and a reload, and the same state tapes to the same result', () => {
    const sim = student('brief-reload');
    go(sim, 'brief.choose', { brief: 'brief-western', reading: BRIEF_BY_ID['brief-western']!.readings[1]!.id, pace: 'measured' });
    prepared(sim, 'brief-western', 2);
    rest(sim);
    const again = loadSave(deserialise(serialise(sim.universe)) as never);
    expect(JSON.stringify(again.player.briefs)).toBe(JSON.stringify(sim.player.briefs));
    const a = sim.execute<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre: 'western' } });
    const b = again.execute<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre: 'western' } });
    expect(a.value!.overall).toBe(b.value!.overall);
  });
});

describe('what the record makes of it', () => {
  it('suggests the brief that leans most on a named weakness, a callback waiting, and a reading not yet tried', () => {
    const sim = student('brief-suggest');
    const s = suggestions(sim.player, { target: 'listening', label: 'Listening', level: 30, full: 100 });
    const top = BRIEFS.map((b) => ({ id: b.id, share: shareOf(sim.player, b, 'listening') })).sort((x, y) => y.share - x.share)[0]!;
    expect(s[0]!.brief).toBe(top.id);
    expect(s[0]!.why).toMatch(/listening/);
    // The brief leaning most on listening leans on it more than the least.
    const least = BRIEFS.map((b) => shareOf(sim.player, b, 'listening')).sort((x, y) => x - y)[0]!;
    expect(top.share).toBeGreaterThan(least * 1.2);
    go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'guarded' });
    go(sim, 'practice.self_tape', { genre: 'drama' });
    expect(suggestions(sim.player).some((x) => x.brief === 'brief-drama' && /another reading/.test(x.why))).toBe(true);
  });

  it('offers a brief new to them in the genre their work knows least, ahead of another reading (from 2026-10-12)', () => {
    const sim = student('brief-suggest-genre');
    go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'guarded' });
    go(sim, 'practice.self_tape', { genre: 'drama' });
    const s = suggestions(sim.player);
    const fresh = s.findIndex((x) => /knows least/.test(x.why));
    const again = s.findIndex((x) => /another reading/.test(x.why));
    expect(fresh).toBeGreaterThanOrEqual(0);
    expect(again).toBeGreaterThan(fresh);
    const pick = BRIEFS.find((b) => b.id === s[fresh]!.brief)!;
    expect(sim.player.briefs?.[pick.id]).toBeUndefined();
    const known = (g: string) => sim.player.engagement?.byGenre[g]?.familiarity ?? 0;
    expect(BRIEFS.every((b) => b.id === 'brief-drama' || known(b.kinds[0]!) >= known(pick.kinds[0]!))).toBe(true);
    // Drama, now taped, is not the least known; practicing the suggested genre moves the next suggestion on.
    expect(pick.kinds[0]).not.toBe('drama');
  });

  it('offers a weakness a brief not yet taped, once the one leaning most has been (from 2026-10-12)', () => {
    const sim = student('brief-suggest-fresh');
    const weak = { target: 'listening', label: 'Listening', level: 30, full: 100 };
    const first = suggestions(sim.player, weak)[0]!;
    const b = BRIEFS.find((x) => x.id === first.brief)!;
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    go(sim, 'practice.self_tape', { genre: b.kinds[0], brief: b.id });
    const next = suggestions(sim.player, weak).find((x) => /leans on listening/.test(x.why))!;
    expect(next.brief).not.toBe(b.id);
    expect(next.why).toMatch(/haven’t taped/);
    const second = BRIEFS.map((x) => ({ id: x.id, share: shareOf(sim.player, x, 'listening') })).sort((x, y) => y.share - x.share || x.id.localeCompare(y.id)).filter((x) => x.id !== b.id)[0]!;
    expect(next.brief).toBe(second.id);
  });

  it('every genre has a brief, reachable by the genre’s own tape', () => {
    for (const b of BRIEFS) expect(briefsOf(b.kinds[0]!)[0], b.id).toBeDefined();
  });
});

describe('found by the played runs (2026-10-12)', () => {
  it('rehearses in a way of playing chosen after rehearsal was complete, where it was refused', () => {
    const sim = student('brief-late-choice');
    go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'guarded' });
    recordOf(sim.player, 'brief-drama').prep = { interpretation: 1, memorization: 1, rehearsal: 1 };
    expect(go(sim, 'brief.prepare', { brief: 'brief-drama', step: 'rehearse' }).error).toMatch(/nothing more to gain/);
    go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'guarded', pace: 'measured' });
    const before = recordOf(sim.player, 'brief-drama').playing!.prep;
    expect(go(sim, 'brief.prepare', { brief: 'brief-drama', step: 'rehearse' }).ok).toBe(true);
    expect(recordOf(sim.player, 'brief-drama').playing!.prep).toBeGreaterThan(before);
    expect(recordOf(sim.player, 'brief-drama').prep.rehearsal).toBe(1);
  });

  it('earns one callback a round: a callback answered, however Strong, earns no other until a fresh take', () => {
    const sim = student('brief-one-callback');
    mastered(sim);
    const b = BRIEF_BY_ID['brief-thriller']!;
    // The genre known in full: 70 was past the 0.3 that completed it until 2026-10-16, and short of the 0.9 from then.
    genreState(sim.player, 'thriller').familiarity = BRIEF.complete.genre * 100;
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    recordOf(sim.player, b.id).prep = { interpretation: 1, memorization: 1, rehearsal: 1 };
    go(sim, 'practice.self_tape', { genre: 'thriller' });
    const cb = recordOf(sim.player, b.id).callback!;
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id, [cb.axis]: cb.side });
    expect(go(sim, 'brief.prepare', { brief: b.id, step: 'rehearse' }).ok).toBe(true);
    // TEST SETUP: the note rehearsed in fully, which days of rehearsal would do.
    recordOf(sim.player, b.id).playing!.prep = 1;
    const answered = go(sim, 'practice.self_tape', { genre: 'thriller' });
    expect(answered.value!.purpose).toBe('callback');
    expect(answered.value!.overall).toBe(100);
    expect(recordOf(sim.player, b.id).callback).toBeUndefined();
    // A fresh take of another reading can earn the next.
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[1]!.id, [cb.axis]: cb.side });
    for (let i = 0; i < 4; i += 1) for (const s of ['read', 'rehearse']) go(sim, 'brief.prepare', { brief: b.id, step: s });
    expect(go(sim, 'practice.self_tape', { genre: 'thriller' }).value!.purpose).toBe('another-reading');
    expect(recordOf(sim.player, b.id).callback).toBeDefined();
  });

  it('coursework rehearses in a way of playing chosen after its rehearsal was complete, too', () => {
    const sim = student('cw-late-choice');
    const a = setWork(sim, sim.player, 'DRAM 103a/b', { year: 2026, month: 9, day: 28 })!;
    const act = activitiesOf(a).find((x) => x.dim === 'rehearsal');
    if (!act) return;
    courseworkOf(sim, sim.player)!.orientation.done.tour = sim.now;
    a.prep.memorization = 1;
    a.prep.rehearsal = 0.99;
    rest(sim);
    expect(prepareRefusal(sim, sim.player, a, act.id)).toMatch(/nothing more to gain/);
    a.playing = { pace: 'driven', chosenAt: sim.now, prep: 0.2 };
    expect(prepareRefusal(sim, sim.player, a, act.id)).toBeUndefined();
  });
});

describe('found by the played comparison of strategies (2026-10-12)', () => {
  it('a take that’s the same again is worth half as practice on another day too: repeating a take earns less than trying something', () => {
    const sim = student('brief-again-days');
    genreState(sim.player, 'comedy').familiarity = 40;
    const b = BRIEF_BY_ID['brief-comedy']!;
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    const p0 = genreState(sim.player, 'comedy').practice;
    go(sim, 'practice.self_tape', { genre: 'comedy' });
    const first = genreState(sim.player, 'comedy').practice - p0;
    sim.advanceTo(sim.now + 24 * 60 * 60_000);
    const p1 = genreState(sim.player, 'comedy').practice;
    expect(go(sim, 'practice.self_tape', { genre: 'comedy' }).value!.purpose).toBe('again');
    const again = genreState(sim.player, 'comedy').practice - p1;
    expect(again).toBeCloseTo(first * BRIEF.againWorth * (1 - p1 / 100) / (1 - p0 / 100), 2);
    // Another reading, the next day, is worth a whole session again.
    sim.advanceTo(sim.now + 24 * 60 * 60_000);
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[1]!.id });
    const p2 = genreState(sim.player, 'comedy').practice;
    expect(go(sim, 'practice.self_tape', { genre: 'comedy' }).value!.purpose).toBe('another-reading');
    expect(genreState(sim.player, 'comedy').practice - p2).toBeGreaterThan(again * 1.5);
  });
});

describe('what each new rule holds (2026-10-12)', () => {
  it('knowing the genre is the better of studied and worked in, never the sum, and it doesn’t also speed preparation', () => {
    const p = { engagement: { byGenre: { comedy: { familiarity: 20, practice: 25 } } } } as unknown as Person;
    const b = BRIEF_BY_ID['brief-comedy']!;
    expect(genreKnown(p, b)).toBeCloseTo(0.25, 9);
    p.engagement!.byGenre.comedy!.familiarity = 60;
    expect(genreKnown(p, b)).toBeCloseTo(0.6, 9);
    // Practice in the genre, however much, moves the steps no faster; only the material's features met before do.
    const none = { engagement: { byGenre: {} } } as unknown as Person;
    const lots = { engagement: { byGenre: { comedy: { familiarity: 100, practice: 100 } } } } as unknown as Person;
    expect(prepSpeed(lots, b)).toBe(prepSpeed(none, b));
  });

  it('a microphone leans the work toward execution, as a camera leans it toward believability', () => {
    const voice = BRIEFS.find((x) => x.medium === 'voice')!;
    const asCamera: Brief = { ...voice, id: `${voice.id}-as-camera`, medium: 'camera' };
    const w = (b: Brief) => { const c = briefContext(nobody, b, blank(), { reading: b.readings[0]!.id }); const ws = leanedWeights(c.task, [], c.lean); const t = Object.values(ws).reduce((s, x) => s + (x ?? 0), 0); return { exec: ws.execution! / t, bel: ws.believability! / t }; };
    expect(w(voice).exec).toBeGreaterThan(w(asCamera).exec);
    expect(w(asCamera).bel).toBeGreaterThan(w(voice).bel);
    // Against a medium that leans nothing on execution, the microphone's own lean shows: the camera, which leans
    // believability. Until 2026-10-16 the stage leant nothing at all and was the comparison; since then its house leans
    // execution as the microphone does (`STAGE_LEAN`, docs/verification/stage-2026-10-16/).
    const plain = briefMaterial(voice);
    const ctxPlain = materialContext(TASK_PROFILES.tape!, { ...plain, id: `${plain.id}-plain`, medium: 'camera' });
    const ctxVoice = materialContext(TASK_PROFILES.tape!, plain);
    expect(ctxVoice.lean.execution! / ctxPlain.lean.execution!).toBeCloseTo(1.2, 6);
  });

  it('a feature at 3, the material built on it, makes its ability a real share of its dimension', () => {
    for (const b of BRIEFS.filter((x) => x.physical === 3)) {
      const ctx = briefContext(nobody, b, blank(), { reading: b.readings[0]!.id });
      const exec = [...ctx.task.dims.execution!.inputs.map((i) => ('ability' in i ? { a: i.ability, w: i.weight } : { a: 'tech', w: i.weight })), ...(ctx.inputs.execution ?? []).map((x) => ({ a: x.ability, w: x.weight }))];
      const total = exec.reduce((s, x) => s + x.w, 0);
      const physical = exec.filter((x) => x.a === 'physical').reduce((s, x) => s + x.w, 0);
      expect(physical / total, b.id).toBeGreaterThanOrEqual(0.25);
    }
  });
});

describe('found by the mastery tool’s twins (2026-10-12)', () => {
  it('an injury holds back a brief built on physical work, and leaves one that isn’t where it was', () => {
    const dance = BRIEFS.find((x) => x.physical >= 2)!;
    const still = BRIEFS.find((x) => x.physical === 0)!;
    for (const b of [dance, still]) {
      const ctx = { ...briefContext(nobody, b, blank(), { reading: b.readings[0]!.id, prep: FULL_PREP }), key: 'injury', expected: true };
      const well = judgePiece('seed', FULL, { ...ctx, condition: { readiness: 100 } }, briefPiece(b, blank())).overall;
      const hurt = judgePiece('seed', FULL, { ...ctx, condition: { readiness: 100, injured: true } }, briefPiece(b, blank())).overall;
      expect(well, b.id).toBe(100);
      if (b === dance) expect(hurt, b.id).toBeLessThan(100); else expect(hurt, b.id).toBe(100);
    }
  });
});
