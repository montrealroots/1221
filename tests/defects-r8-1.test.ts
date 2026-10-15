/**
 * What the actor's work so far informs, and two things a brief's pane and the Player Profile drew but didn't do, until
 * 2026-10-12:
 *
 * - A brief was suggested for a weakness no brief reads, "(0% of the work)": a technique no take reads (audition, cold
 *   reading, script analysis), or one a few briefs read once all of them were taped.
 * - The genres under "You love:" were drawn with Open outside any LookRegion, so none of them ever opened.
 * - The owner's brief asked the artistic identity (`systems/artistry.ts`) to inform recommendations and feedback, with
 *   inspectable evidence and no duplicate reward. What To Work On read recent work alone, and a director's note on the
 *   craft knew only the part. Now the weakness the work for life keeps coming back to is said on its recommendation,
 *   with its pieces, and put first within half a point of the top; and a craft note on a limit on it says it's held
 *   back that many pieces before this. The falsifiability test: the words and the order change, the numbers don't.
 * - A brief's pane passed What To Work On no days since practice, so the same weakness read "Steady to begin" there
 *   and "Spaced" on the Profile.
 *
 * PLAYER JOURNEYS play through the clock and the commands; FIXTURES set a state by hand to reach one rule, and say so.
 * The screens are rendered to markup (react-dom/server) over real saves, as tests/defects-g3-1.test.ts renders them.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { CHAPTERS } from '@/engine/content/tutorial';
import { abilityFull, levelOf } from '@/engine/systems/attributes';
import { ABILITY_DEFS, MASTERED, TECHNIQUE_LABEL, type AbilityId } from '@/engine/content/abilities';
import { practicedDaysAgo, recommendations, type Recommendation } from '@/engine/systems/experience';
import { exerciseFor } from '@/engine/content/practice';
import { matchedTier } from '@/engine/systems/practice';
import { BRIEFS, BRIEF_BY_ID } from '@/engine/content/briefs';
import { FILM_GENRES, GENRE_BY_ID } from '@/engine/content/film-genres';
import { briefsRead, shareOf, suggestions } from '@/engine/systems/briefs';
import { trainingForecast, tied } from '@/engine/systems/advice';
import { identityOf, type Identity } from '@/engine/systems/artistry';
import { CALL_KIND } from '@/engine/systems/school';
import { hasProcess, noteText, type NoteFocus } from '@/engine/systems/production';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

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

const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { BriefPane } = await import('@/ui/components/BriefPane');

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const config = (extra: Record<string, unknown> = {}) => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** A student with nothing waiting on them, as tests/defects-g3-1.test.ts makes one. */
function student(seed: string, extra: Record<string, unknown> = {}): Simulation {
  const sim = createSave(1, seed, config(extra));
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  return sim;
}
const rest = (sim: Simulation) => {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
};
const go = (sim: Simulation, kind: string, payload: Record<string, unknown>) => { rest(sim); return sim.execute({ kind, payload }); };
/** A take of a brief through the commands: its first reading chosen, prepared six rounds, its genre studied, taped. */
function taped(sim: Simulation, id: string) {
  const b = BRIEF_BY_ID[id]!;
  expect(go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id }).ok).toBe(true);
  for (let i = 0; i < 6; i += 1) for (const step of ['read', 'lines', 'rehearse']) go(sim, 'brief.prepare', { brief: b.id, step });
  for (let i = 0; i < 3; i += 1) go(sim, 'genre.study', { genre: b.kinds[0] });
  const r = go(sim, 'practice.self_tape', { genre: b.kinds[0], brief: b.id });
  expect(r.ok, r.error).toBe(true);
}
const profile = (sim: Simulation) => { h.sim = sim; return renderToStaticMarkup(createElement(ProfileWorkspace)); };
const pane = (sim: Simulation, genre: string, brief?: string) => {
  h.sim = sim;
  return renderToStaticMarkup(createElement(BriefPane, { genre, ...(brief ? { brief } : {}), onOpen: () => undefined, practice: (id: string) => createElement('span', { 'data-practice': id }) }));
};
const isAbility = (id: string) => ABILITY_DEFS.some((d) => d.id === id);
/**
 * What To Work On as the Profile reads it, with the identity's recurring weakness or without. From 2026-10-16 with the
 * forecast of what each input's hours are worth (`trainingForecast`), as the Profile and the pane read it.
 */
const recsOf = (sim: Simulation, recurring?: Identity['recurring']) => recommendations((id) => levelOf(sim, sim.player, id as never), (id) => (isAbility(id) ? abilityFull(sim, sim.player, id as AbilityId) : MASTERED), sim.player.work ?? [], (id) => exerciseFor(id as never), matchedTier, 12, practicedDaysAgo(sim.player, sim.now, sim.homeZone), recurring, trainingForecast(sim, sim.player));
/** Everything a recommendation decides, without its words, in a fixed order. */
const numbers = (rs: readonly Recommendation[]) => rs.map(({ target, points, exercise, tier, focus }) => ({ target, points, exercise, tier, focus })).sort((a, b) => a.target.localeCompare(b.target));
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('a brief suggested for a weakness', () => {
  it('is never made for a technique no brief reads, whether recent work or the work for life names it', () => {
    const sim = student('r8-unread');
    const p = sim.player;
    for (const t of ['audition', 'coldReading', 'script'] as const) {
      // No brief's take reads it at all.
      expect(BRIEFS.every((b) => shareOf(p, b, t) === 0), t).toBe(true);
      expect(briefsRead(p, t), t).toBe(false);
      const label = TECHNIQUE_LABEL[t];
      const recent = suggestions(p, { target: t, label, level: 5, full: MASTERED });
      const life = suggestions(p, undefined, { ...identityOf(p), recurring: { target: t, label, pieces: 9, whole: 31.5, last: 0, evidence: [] } });
      for (const s of [...recent, ...life]) {
        expect(s.why, t).not.toMatch(/% of the work\)/);
        expect(s.why, t).not.toContain(label.toLowerCase());
      }
    }
    // The falsifiability test: a technique a brief reads is still suggested the brief that leans on it most.
    expect(briefsRead(p, 'screen')).toBe(true);
    expect(suggestions(p, { target: 'screen', label: TECHNIQUE_LABEL.screen, level: 5, full: MASTERED }).some((s) => /on camera more than any other brief \([1-9]\d*% of the work\)/.test(s.why))).toBe(true);
  });

  it('PLAYER JOURNEY: once every brief that reads it is taped, is the one leaning most, never an untaped one at 0%', () => {
    const sim = student('r8-accents');
    const readers = BRIEFS.filter((b) => shareOf(sim.player, b, 'accents') > 0);
    // Accents And Dialects is read by a few briefs, and by none of the rest.
    expect(readers.length).toBeGreaterThan(0);
    expect(readers.length).toBeLessThan(5);
    for (const b of readers) taped(sim, b.id);
    const s = suggestions(sim.player, { target: 'accents', label: TECHNIQUE_LABEL.accents, level: 5, full: MASTERED });
    for (const x of s) expect(x.why).not.toMatch(/\(0% of the work\)/);
    const weak = s.find((x) => x.why.includes('accents and dialects'));
    // Suggested again, a brief that reads it, unless every one of them is already suggested as a callback.
    if (weak) {
      expect(readers.map((b) => b.id)).toContain(weak.brief);
      expect(weak.why).toMatch(/more than any other brief \([1-9]\d*% of the work\)/);
    } else for (const b of readers) expect(s.some((x) => x.brief === b.id && x.why.startsWith('A callback'))).toBe(true);
  });

  it('in a brief’s pane, isn’t made for a technique no brief reads, and the pane says none reads it', () => {
    const sim = student('r8-pane-unread');
    taped(sim, 'brief-drama');
    // FIXTURE: the last piece read script analysis, a technique the coursework reads and no brief does, and the student
    // is far behind in it (played, a student whose script work lags meets it in class work; here it's set on the last
    // piece judged). Until 2026-10-16 the fixture put a limit on the piece alone; advice from then forecasts from what a
    // piece read (`trainingForecast`), so the piece reads it, and it's forecast as the most worth training.
    const w = sim.player.work!.at(-1)!;
    w.inputs.techniques = { ...w.inputs.techniques, script: 4 };
    sim.player.craft!.script = 0;
    w.limits = [{ kind: 'technique', what: 'script', label: TECHNIQUE_LABEL.script, dimension: 'interpretation', by: 60, whole: 30 }, ...w.limits];
    w.inputs.levels = { ...(w.inputs.levels ?? {}), script: sim.player.craft!.script };
    expect(recsOf(sim).find((r) => !r.target.includes(':'))?.target).toBe('script');
    const html = pane(sim, 'drama', 'brief-drama');
    expect(html).toContain('>What To Work On<');
    expect(html).toContain('data-practice="script"');
    expect(html).not.toMatch(/% of the work\)/);
    expect(html).toContain('No practice brief reads script analysis, so a take won’t show it and none is suggested for it.');
    // The falsifiability test: with the take held back by something a brief reads, a brief is suggested for it, and
    // the pane doesn't say none reads it.
    w.limits = w.limits.filter((l) => l.what !== 'script');
    w.inputs.techniques = Object.fromEntries(Object.entries(w.inputs.techniques).filter(([k]) => k !== 'script'));
    const read = pane(sim, 'drama', 'brief-drama');
    expect(read).not.toContain('No practice brief reads');
  });
});

describe('the genres you love, on the Player Profile', () => {
  const loved = FILM_GENRES.slice(0, 2).map((g) => g.id);
  const paragraph = (html: string) => /You love: (.*?)<\/p>/s.exec(html)?.[1] ?? '';
  const opens = (para: string, id: string) => new RegExp(`<button[^>]*class="link"[^>]*>${escape(GENRE_BY_ID[id]!.label)}</button>`).test(para);

  it('open once the chapter that opens a genre is read, and not before', () => {
    // A life with no guide has everything open.
    const free = paragraph(profile(student('r8-loved', { genres: loved })));
    for (const id of loved) expect(opens(free, id), id).toBe(true);
    // A guided life: plain names until the chapter that opens a genre is read, ways in after.
    const sim = student('r8-loved-guided', { genres: loved, tutorial: true });
    const chapter = CHAPTERS.findIndex((c) => c.opens.includes('look.genre'));
    expect(chapter).toBeGreaterThanOrEqual(0);
    for (const c of CHAPTERS.slice(0, chapter)) expect(sim.execute({ kind: 'tutorial.read', payload: { chapterId: c.id } }).ok).toBe(true);
    const before = paragraph(profile(sim));
    for (const id of loved) { expect(before).toContain(GENRE_BY_ID[id]!.label); expect(opens(before, id), id).toBe(false); }
    expect(sim.execute({ kind: 'tutorial.read', payload: { chapterId: CHAPTERS[chapter]!.id } }).ok).toBe(true);
    const after = paragraph(profile(sim));
    for (const id of loved) expect(opens(after, id), id).toBe(true);
  });
});

describe('What To Work On, with the work so far', () => {
  /** Three pieces each held back by the same abilities, at the points of the whole given, by an actor at 40 in each. */
  const work = (xs: [string, number][]) => Array.from({ length: 3 }, (_, i) => ({ at: i, limits: xs.map(([what, whole]) => ({ kind: 'ability', what, label: what, by: whole * 4, whole })), inputs: { abilities: Object.fromEntries(xs.map(([what]) => [what, 40])) } }));
  const run = (w: ReturnType<typeof work>, recurring?: Identity['recurring'], level: (id: string) => number = () => 40) => recommendations(level, () => 100, w, (id) => ({ id: `ex-${id}` }), matchedTier, 12, undefined, recurring);
  const life = (target: string): NonNullable<Identity['recurring']> => ({ target, label: target, pieces: 9, whole: 31.5, last: 0, evidence: ['An ability, 31.5 points in all'] });

  it('names the weakness the work keeps coming back to with its pieces for life, first within half a point of the top', () => {
    const w = work([['presence', 2], ['imagination', 1.7], ['focus', 1]]);
    const without = run(w);
    expect(without.map((r) => r.target)).toEqual(['presence', 'imagination', 'focus']);
    const near = run(w, life('imagination'));
    expect(near.map((r) => r.target)).toEqual(['imagination', 'presence', 'focus']);
    expect(near[0]!.why).toContain('Your work keeps coming back to it: it’s held back 9 of your pieces for life, 31.5 points of the whole in all.');
    expect(near[0]!.recurring).toEqual({ last: 0, evidence: ['An ability, 31.5 points in all'] });
    // The falsifiability test: the words and the order change, the numbers don't.
    expect(numbers(near)).toEqual(numbers(without));
    expect(near.filter((r) => r.target !== 'imagination').map((r) => r.why)).toEqual(without.filter((r) => r.target !== 'imagination').map((r) => r.why));
    // More than half a point under the top, it's named where its points put it.
    const far = run(w, life('focus'));
    expect(far.map((r) => r.target)).toEqual(['presence', 'imagination', 'focus']);
    expect(far[2]!.why).toContain('it’s held back 9 of your pieces for life');
    expect(numbers(far)).toEqual(numbers(without));
  });

  it('never brings back an input at full, under the floor, or that recent work doesn’t name', () => {
    const w = work([['presence', 2], ['imagination', 0.3]]);
    expect(run(w, life('imagination'))).toEqual(run(w));
    expect(run(w, life('memory'))).toEqual(run(w));
    const full = (id: string) => (id === 'presence' ? 100 : 40);
    expect(run(w, life('presence'), full)).toEqual(run(w, undefined, full));
  });

  it('PLAYER JOURNEY: on the Player Profile, a fall term of school in, names it with the pieces it has held back for life', () => {
    const sim = createSave(1, 'r8-a', config());
    sim.advanceTo(at(2027, 1, 4) + 60_000);
    const id = identityOf(sim.player);
    const r = id.recurring!;
    expect(r).toBeDefined();
    // The count is the journey's own, for life.
    const kept = sim.player.journey!.limits!;
    expect(r.pieces).toBe((kept[`ability:${r.target}`] ?? kept[`technique:${r.target}`])!.n);
    expect(r.pieces).toBeGreaterThanOrEqual(3);
    const withIt = recsOf(sim, r);
    const without = recsOf(sim);
    const mine = withIt.find((x) => x.target === r.target)!;
    expect(mine).toBeDefined();
    expect(mine.why).toContain(`it’s held back ${r.pieces} of your pieces for life`);
    expect(numbers(withIt)).toEqual(numbers(without));
    const html = profile(sim);
    expect(html).toContain(`it’s held back ${r.pieces} of your pieces for life`);
    expect(html).toContain(`From your work for life: ${r.evidence.join('; ')}`);
    // A brief's pane names the first ability or technique and says it as the Profile does. Until 2026-10-16 that was
    // the recurring weakness here, put first within half a point; from then what's first is what training pays most for
    // (`trainingForecast`), and the recurring weakness goes first only where it's about as useful.
    const first = withIt.find((x) => !x.target.includes(':'))!;
    const brief = pane(sim, 'drama', 'brief-drama');
    expect(brief).toContain(`<strong>${first.label}</strong>. ${first.why}`);
    // About as useful as the top, it goes first; otherwise it's said where its forecast puts it, with its pieces for life.
    if (tied(mine.points, first.points)) expect(first.target).toBe(r.target); else expect(first.points).toBeGreaterThan(mine.points);
  }, 120_000);
});

describe('a director’s note on the craft', () => {
  const limit = (target: string): NoteFocus => ({ kind: 'craft', note: 'objective', problem: `limit:${target}`, segment: 1, where: 'The Second Half', measure: 50 });
  const recurring = { target: 'emotionalDepth', label: 'Emotional Depth', pieces: 9 };

  it('on a limit the work keeps coming back to, says how many pieces it has held back before this', () => {
    expect(noteText(limit('emotionalDepth'), undefined, recurring)).toBe('I don’t know what you want in the second half. Find it, and play it. It’s your emotional depth again: it’s held back 9 of your pieces before this.');
    // On a limit on something else, or a problem that isn't a limit, it says nothing of it.
    expect(noteText(limit('imagination'), undefined, recurring)).toBe(noteText(limit('imagination')));
    expect(noteText({ kind: 'craft', note: 'pacing', problem: 'stamina', segment: 1, where: 'The Second Half', measure: 50 }, undefined, recurring)).not.toContain('held back');
  });

  /** Plays the first spring's festival to its dress, working each note, as tests/direction.test.ts plays it. */
  function festival(seed: string, fixture?: (sim: Simulation) => void) {
    const sim = createSave(1, seed, config());
    sim.advanceTo(at(2027, 1, 4) + 60_000);
    fixture?.(sim);
    const tended = (until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
    const proc = () => { const c = sim.player.school!.casting!; return hasProcess(c) ? c.process : undefined; };
    const calls = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which !== 'rep' && i.payload.call === 'rehearsal').sort((a, b) => a.at - b.at);
    for (let k = 0; k < calls.length - 1; k += 1) {
      tended(calls[k]!.at + 6 * MS_HOUR + 30 * 60_000);
      if ((proc()?.lines ?? 1) < 0.97) sim.execute({ kind: 'school.learn_part', payload: {} });
      if ((proc()?.blockingMissed ?? 0) > 0) sim.execute({ kind: 'school.review_blocking', payload: {} });
      const last = proc()?.notes.at(-1);
      if (last && last.taken === undefined && !last.worked) {
        const r = sim.execute<{ pending?: boolean }>({ kind: 'school.work_note', payload: {} });
        if (r.ok && r.value?.pending) sim.execute({ kind: 'work.settle', payload: { piece: 'part:school', keep: true } });
      }
    }
    tended(calls.at(-1)!.at + 7 * MS_HOUR);
    const p = proc()!;
    return { notes: p.notes, kept: { lines: p.lines, blocking: p.blocking, calls: p.calls, trained: p.trained }, work: (sim.player.work ?? []).map((w) => [w.inputs.key, w.overall, w.dims]), craft: sim.player.craft };
  }

  it('PLAYER JOURNEY: says it on the festival’s notes on that limit, and nothing else about the festival changes', () => {
    const plain = festival('r8-a');
    // The ability the festival's first note on a limit names. Emotional depth until 2026-10-16; from then a night weighs
    // each ability as the play demands it (`BASE_INPUTS`, `DEMAND_EFFECT`), and the note names whichever the forecast
    // holds back most, found here rather than assumed.
    const first = plain.notes.find((n) => n.focus.kind === 'craft' && n.focus.problem.startsWith('limit:') && ABILITY_DEFS.some((d) => `limit:${d.id}` === (n.focus as { problem: string }).problem))!;
    const id = (first.focus as { problem: string }).problem.slice('limit:'.length) as AbilityId;
    const def = ABILITY_DEFS.find((d) => d.id === id)!;
    // FIXTURE: that ability made the weakness the work for life keeps coming back to, ahead of the imagination the
    // played fall term names, so the festival's note on a limit on it is a note on that weakness.
    const kept = festival('r8-a', (sim) => { sim.player.journey!.limits![`ability:${id}`] = { label: def.label, n: 30, whole: 160, last: sim.now }; });
    const onIt = (n: { focus: NoteFocus }) => n.focus.kind === 'craft' && n.focus.problem === `limit:${id}`;
    expect(kept.notes.filter(onIt).length).toBeGreaterThan(0);
    // The falsifiability test: the same notes on the same problems at the same figures, the same part and the same
    // work, judged the same; only the words of the notes on that limit change.
    expect(kept.notes.map((n) => n.focus)).toEqual(plain.notes.map((n) => n.focus));
    expect(kept.kept).toEqual(plain.kept);
    expect(kept.work).toEqual(plain.work);
    expect(kept.craft).toEqual(plain.craft);
    kept.notes.forEach((n, i) => {
      const was = plain.notes[i]!.text;
      if (!onIt(n)) { expect(n.text).toBe(was); return; }
      expect(was).not.toContain('held back');
      const said = new RegExp(`^(.*) It’s your ${def.label.toLowerCase()} again: it’s held back (\\d+) of your pieces before this\\.$`).exec(n.text);
      expect(said, n.text).not.toBeNull();
      expect(said![1]).toBe(was);
      expect(Number(said![2])).toBeGreaterThanOrEqual(30);
    });
  }, 240_000);
});

describe('What To Work On in a brief’s pane', () => {
  it('reads the days since practice as the Player Profile does: spaced a day to a week on, in both', () => {
    const sim = student('r8-since');
    taped(sim, 'brief-drama');
    const top = recsOf(sim).find((r) => !r.target.includes(':') && r.exercise)!;
    expect(top).toBeDefined();
    expect(go(sim, 'practice.exercise', { exercise: top.exercise, tier: top.tier, focus: 'steady' }).ok).toBe(true);
    sim.advanceTo(sim.now + 2 * MS_DAY);
    const now = recsOf(sim).find((r) => r.target === top.target)!;
    expect(now.focus).toBe('spaced');
    expect(recsOf(sim).find((r) => !r.target.includes(':'))!.target).toBe(top.target);
    const html = pane(sim, 'drama', 'brief-drama');
    expect(html).toContain(`<strong>${top.label}</strong>. ${now.why}`);
    expect(html).toContain('Spaced: the last session was a day to a week ago, when spacing pays.');
    expect(profile(sim)).toContain(now.why);
  });
});
