/**
 * Five productions defects found by the triage of 2026-10-12, each held here against the engine and the screen that
 * shows it (from 2026-10-12):
 * - a Rep understudy's part was forecast as a supporting part (A Night Now, The Part Now, the workbook's problems) and
 *   judged as the lead it covers at the run-through and on a night gone on;
 * - the Rep's casting listed none of the class, so every Rep curtain counted as one with no friends in it, a third-year
 *   asked into the company beside classmates included, and the nights together never read them;
 * - `completeFor` said an actor who came to every call was fully prepared, which a night asking `NIGHT_LEAST` never
 *   held for a short run (the claim the comment now makes is measured here);
 * - the British spelling of fulfill in what the player reads, with a spelling check that didn't know the word;
 * - a movement played its own way Driven drew on stamina where the whole played Driven didn't, and How You'll Play It
 *   listed Stamina under Driven for a piece judged in movements, which never read it through the side.
 *
 * PLAYER JOURNEYS play through the clock and the commands; FIXTURES set a state by hand to reach one rule, and say so.
 * The screens are rendered to markup (react-dom/server) over real saves, as tests/defects-g8-2.test.ts renders them.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { CALL_KIND, ESTIMATE, NIGHT_DIFFICULTY, NIGHT_LEAST, actingOf, companyRead, evenCraft } from '@/engine/systems/school';
import { completeFor, type Holder } from '@/engine/systems/production';
import { workPiece } from '@/engine/systems/workpieces';
import { courseworkOf } from '@/engine/systems/coursework';
import { PREP_DIMS } from '@/engine/content/coursework';
import { GENRE_DEFS } from '@/engine/content/genres';
import { judgePiece, toneSegments, withBook, type PieceSpec } from '@/engine/systems/piece';
import { APPROACH_EFFECT } from '@/engine/content/approaches';
import { TASK_PROFILES } from '@/engine/content/tasks';
import type { Evaluation, Performer } from '@/engine/systems/evaluation';
import type { AbilityId } from '@/engine/content/abilities';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

// The School screen's kept tab, at Casting: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/school' ? 'casting' : initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');
const { PlayingChooser } = await import('@/ui/components/PlayingChooser');

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
/** TEST SETUP: a student who does the coursework, as tests/casting.test.ts plays one, so a good standing reaches the Rep. */
const doTheWork = (sim: Simulation) => { for (const a of courseworkOf(sim, sim.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95); };
const student = (seed: string) => {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => doTheWork(s));
  return sim;
};
/** Played by somebody who looks after themselves, awake through the evening, as tests/defects-g8-11.test.ts plays one. */
const tended = (sim: Simulation, until: number, step = 6 * MS_HOUR) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + step)); } };
const repCalls = (sim: Simulation, call: string) => sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.which === 'rep' && i.payload.call === call && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);

/** A screen's markup as the player has it. */
function markup(sim: Simulation, screen: FunctionComponent): string {
  h.sim = sim;
  return renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
}
/** Its text, with the tags taken out. */
const drawn = (sim: Simulation, screen: FunctionComponent): string => markup(sim, screen).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('a Rep understudy’s part', () => {
  it('is forecast as the lead it covers, as the run-through judges it', () => {
    const sim = student('g8-12-a');
    // The first spring's casting: an understudy at the Rep, whose casting carries no size.
    tended(sim, at(2027, 1, 25));
    const rep = sim.player.school!.rep!;
    expect(rep.kind).toBe('understudy');
    expect(rep.size).toBeUndefined();
    // The casting notice reads in American spelling (the spelling defect, below).
    expect(sim.universe.notifications.find((n) => n.title.startsWith('Cast: '))?.body).toMatch(/Once cast, you play the part through the run, and a missed call counts against you\.$/);
    const run = repCalls(sim, 'runthrough')[0]!;
    expect(run).toBeDefined();
    tended(sim, run.at - MS_HOUR);
    const forecast = workPiece(sim, sim.player, 'part:rep')!.forecast();
    expect(forecast.inputs.difficulty).toBe(NIGHT_DIFFICULTY.rep.lead);
    tended(sim, run.at + 4 * MS_HOUR);
    // The run-through itself, judged and kept on the record: at the difficulty its forecast read.
    const judged = (sim.player.work ?? []).find((w) => w.inputs.key === `night:${sim.player.id}:${rep.production}-${run.at}`);
    expect(judged).toBeDefined();
    expect(judged!.inputs.difficulty).toBe(forecast.inputs.difficulty);
  });
});

/**
 * A third-year asked into the Rep's company in the fall of 2028, with classmates asked in beside them. FIXTURE: the
 * player's craft and two classmates' set at 85 the day before the term's casting, so the directors' bar (`castAtRep`)
 * is met without three years' growth played to it.
 */
function inTheCompany(seed: string): Simulation {
  const sim = student(seed);
  tended(sim, at(2028, 8, 27));
  const school = sim.player.school!;
  sim.player.craft = evenCraft(85);
  for (const i of [0, 1]) school.classmates[i]!.craft = evenCraft(85);
  tended(sim, at(2028, 8, 29));
  return sim;
}

describe('the Rep’s company with classmates in it', () => {
  it('lists the class’s others asked in, reads them as the company, and counts a friend among them at the curtain', () => {
    const a = inTheCompany('g8-12-company');
    const school = a.player.school!;
    const rep = school.rep!;
    expect(rep.kind).toBe('role');
    // Everyone of the class the directors asked in, as Around The Class lists them at the Rep.
    const asked = school.classmates.filter((m) => actingOf(m.craft) >= ESTIMATE.castAtRep).map((m) => m.name);
    expect(asked.length).toBeGreaterThanOrEqual(2);
    expect(rep.cast?.map((c) => c.name).sort()).toEqual([...asked].sort());
    expect(school.around!.list.filter((x) => x.production === rep.production).map((x) => x.name).sort()).toEqual([...asked].sort());
    for (const c of rep.cast!) expect(c.part).toBe('A Featured Part In The Company');
    // The company is read for the nights together, and the workbook works with it.
    expect(companyRead(a, a.player, rep)).toBeDefined();
    expect(workPiece(a, a.player, 'part:rep')?.together).toBeDefined();

    // The screen says the rest of the company is the Rep's own, not the other two classes.
    const text = drawn(a, SchoolWorkspace);
    expect(text).toContain(`From the class in the company with you, each in a featured part: ${rep.cast!.map((c) => c.name).join(', ')}. The rest of the company is the Rep’s own.`);
    expect(text).not.toContain('from the other two classes');

    // The same save twice to the first curtain, one with a friend in the company and one with none: the curtain is the
    // better night to be in with the friend there.
    const b = inTheCompany('g8-12-company');
    const curtain = repCalls(a, 'performance')[0]!;
    expect(repCalls(b, 'performance')[0]!.at).toBe(curtain.at);
    const morale = (sim: Simulation, bond: number) => {
      tended(sim, curtain.at - 60_000, MS_HOUR);
      // FIXTURE: how close the first of them is, set at the curtain so nothing else reads it in between.
      const mates = sim.player.school!.classmates;
      for (const c of sim.player.school!.rep!.cast!) mates.find((m) => m.name === c.name)!.bond = 0;
      mates.find((m) => m.name === sim.player.school!.rep!.cast![0]!.name)!.bond = bond;
      sim.player.wellbeing.morale = 50;
      sim.advanceTo(curtain.at + 60_000);
      return sim.player.wellbeing.morale;
    };
    expect(morale(a, 60)).toBeGreaterThan(morale(b, 0));
  });
});

describe('what every call kept makes of a part', () => {
  it('falls short of a night’s least for a short run, as completeFor now says', () => {
    const of = (n: number, format: 'cabaret' | 'production') => completeFor({ production: 'x', process: { lines: 0, blocking: 0, calls: 0, blockingMissed: 0, notes: [], trained: 0, of: n, format } } as unknown as Holder)!;
    // A Yale Cabaret show's nine evenings: both under a night's least. A ten-call production: its blocking.
    const cabaret = of(9, 'cabaret');
    const ten = of(10, 'production');
    expect(Math.round(cabaret.lines * 100)).toBe(68);
    expect(Math.round(cabaret.blocking * 100)).toBe(58);
    expect(Math.round(ten.blocking * 100)).toBe(68);
    expect(cabaret.lines).toBeLessThan(NIGHT_LEAST.lines);
    expect(cabaret.blocking).toBeLessThan(NIGHT_LEAST.blocking);
    expect(ten.blocking).toBeLessThan(NIGHT_LEAST.blocking);
  });
});

describe('American spelling', () => {
  it('reads fulfill where the player reads it, and the spelling check fails the British word', () => {
    expect(GENRE_DEFS.adventure!.conventions).toContain('to fulfill a goal');
    // The check over a tree of one file with the British word in a string: it fails and names the change.
    // The British word is put together here, so this file holds none for the check to find in it.
    const british = ['fulf', 'il'].join('');
    const dir = mkdtempSync(join(tmpdir(), 'g8-12-spelling-'));
    try {
      for (const d of ['src', 'tools', 'tests', 'docs']) mkdirSync(join(dir, d));
      writeFileSync(join(dir, 'src', 'cast.ts'), `export const NOTICE = 'Once cast, you ${british} the casting, and a student cast ${british}s it.';\n`);
      const r = spawnSync(process.execPath, [resolve('tools/spelling.mjs')], { cwd: dir, encoding: 'utf8' });
      expect(r.status).toBe(1);
      expect(r.stdout).toContain(`${british} → fulfill`);
      expect(r.stdout).toContain(`${british}s → fulfills`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('a side’s stamina in a piece judged in its movements', () => {
  /**
   * A play in two movements, the first played its own way Driven (`withBook`, as Play This Part Another Way keeps it),
   * with no load, so stamina has no drain to tell through; the whole played Driven too, or left open.
   */
  const spec = (): PieceSpec => ({ ...withBook({ segments: toneSegments(['grave', 'comic'], 2), work: [], part: 'blocking', perTurn: 0, perBlend: 0, most: 1, load: 0 }, { tries: [], ways: [{ axis: 'pace', side: 'driven', prep: 1 }, null] }), load: 0 });
  const judged = (stamina: number, whole: boolean): number => {
    const performer: Performer = { ability: (id: AbilityId) => (id === 'stamina' ? stamina : 50), full: () => 100, technique: () => 50 };
    const ctx = { task: TASK_PROFILES.performance!, techniques: {}, prep: { lines: 1, blocking: 1, notes: 1 }, required: { lines: 1, blocking: 1, notes: 1 }, difficulty: 0, condition: { readiness: 100 }, key: 'g8-12', expected: true, ...(whole ? { inputs: APPROACH_EFFECT.driven.inputs } : {}) };
    return judgePiece('g8-12', performer, ctx, spec()).overall;
  };

  it('isn’t read through a movement’s own Driven way, as it isn’t through the whole played Driven', () => {
    expect(spec().own?.[0]?.inputs?.consistency?.some((x) => x.ability === 'stamina')).toBe(true);
    expect(judged(0, false)).toBe(judged(100, false));
    expect(judged(0, true)).toBe(judged(100, true));
  });

  it('isn’t listed under What It Draws On for a piece judged in movements, and is for a scene judged whole', () => {
    const sim = student('g8-12-chooser');
    const piece = { overall: 50, piece: { segments: [], continuity: 100, lowest: 50 } } as unknown as Evaluation;
    const whole = { overall: 50 } as unknown as Evaluation;
    // What It Draws On, in the table's Driven row.
    const row = (html: string) => html.split('<tr').find((r) => r.includes('<strong>Driven</strong>'))?.match(/<td class="xs">([^<]*)<\/td>/)?.[1];
    const chooser = (e: Evaluation) => () => createElement(PlayingChooser, { preview: () => e, feature: 'school.choose_part_playing', onChoose: () => undefined });
    expect(row(markup(sim, chooser(piece)))).toBe('Adaptability');
    expect(drawn(sim, chooser(piece))).toContain('Judged movement by movement, the piece only counts stamina as tiring late in it');
    expect(row(markup(sim, chooser(whole)))).toBe('Adaptability, Stamina');
    expect(drawn(sim, chooser(whole))).not.toContain('Judged movement by movement');
  });
});
