/**
 * Brief 22, section 2 (docs/verification/career-genre-2026-10-22/criteria.md, W1 to W10): a work's genres as its
 * material states them, at the most precise level the game holds, one resolved set for every reading.
 *
 * - The content (`content/genre-weights.ts`): every stated set valid, no genre beside its own kind, every play with kinds
 *   stated, every part and scene named there real, and each play's register the genre it had.
 * - The resolver (`resolveGenres`): one genre, two even and uneven, three; two scenes of one play; a part's and a role's
 *   own against their defaults; tags reordered and repeated; weights missing and invalid; a broad genre beside its kind;
 *   older saves' castings.
 * - The readers: each path that reads a work's genres reads the resolved set, a part's, role's or scene's own moving it
 *   and an inherited one reading the default: a night, a call's practice, casting, a professional round and work day, a
 *   rehearsal day's lines, a class scene's preparation, the showcase, a brief, the Profile's suggestion and the casting
 *   notice's words.
 *
 * TEST SETUP, said where it's done: what a person knows of genres set for one reading (`knowing`, as brief 21's proof
 * sets it); a role's own requirement set by hand where no role in the game has one (`listed`); a class assignment built
 * as tests/coursework-objective.test.ts builds one.
 */
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { loadSave } from '@/engine';
import { deserialise } from '@/engine/persistence/adapter';
import { GENRE_DEFS } from '@/engine/content/genres';
import { PROJECTS, projectById } from '@/engine/content/careerwork';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS, catalogTitle } from '@/engine/content/plays';
import { SCENES, PREP_DIMS } from '@/engine/content/coursework';
import { BRIEFS } from '@/engine/content/briefs';
import { PLAY_GENRES, PROJECT_GENRES, ROLE_GENRES, SCENE_GENRES, registerOfPlay } from '@/engine/content/genre-weights';
import {
  ancestorsOf, creditPractice, genreSpeed, relatedness, relevantGenre, requirementOf, requirementOfBrief, requirementOfHolder, requirementOfPlay, requirementOfRole,
  requirementOfScene, requirementWords, resolveGenres, weightsProblem, type GenreRequirement,
} from '@/engine/systems/engagement';
import { nightEvaluation, castFit } from '@/engine/systems/school';
import { callAnswered } from '@/engine/systems/production';
import { fitOf, rehearseDay } from '@/engine/systems/projobs';
import { courseworkOf, prepare, activitiesOf, questionsFor, type Assignment } from '@/engine/systems/coursework';
import { performerOf } from '@/engine/systems/evaluation';
import { genreKnown } from '@/engine/systems/briefs';
import { playOfCredit } from '@/engine/systems/engagement';
import { nextGenre } from '@/ui/workspaces/ProfileWorkspace';
import { askedWords } from '@/engine/systems/proshowcase';
import { GUIDE_BY_ID } from '@/engine/content/guide';
import { ENGAGEMENT } from '@/engine/content/engagement';
import type { Engagement } from '@/engine/systems/pro';
import { PATHS, actor, knowing, listed, type Known, type Material } from './setup/genre-proof';

const CATALOG = [...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...REP_PLAYS, ...SUMMER_PLAYS];
const shares = (r: GenreRequirement) => Object.fromEntries(r.needs.map((n) => [n.id, Math.round(n.weight * 1e9) / 1e9]));
const knower = (known: Known) => ({ engagement: { byGenre: Object.fromEntries(Object.entries(known).map(([g, v]) => [g, { familiarity: v, practice: 0 }])) } });
const read = (known: Known, work: Parameters<typeof relevantGenre>[1]) => relevantGenre(knower(known), work).total;
const permutations = <T,>(xs: readonly T[]): T[][] => (xs.length <= 1 ? [[...xs]] : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));

describe('W4: the material’s stated requirements', () => {
  const sets: [string, Record<string, number>][] = [
    ...Object.entries(PROJECT_GENRES).map(([k, v]) => [`project ${k}`, v.weights] as [string, Record<string, number>]),
    ...Object.entries(ROLE_GENRES).map(([k, v]) => [`role ${k}`, v.weights] as [string, Record<string, number>]),
    ...Object.entries(PLAY_GENRES).flatMap(([k, v]) => [[`play ${k}`, v.weights], ...Object.entries(v.parts ?? {}).map(([p, w]) => [`part ${p} in ${k}`, w.weights])] as [string, Record<string, number>][]),
    ...Object.entries(SCENE_GENRES).map(([k, v]) => [`scene ${k}`, v.weights] as [string, Record<string, number>]),
  ];

  it('are every one valid: genres the game has, weights nonnegative numbers, one above 0, and no genre beside one of its own kinds', () => {
    expect(sets.length).toBeGreaterThan(60);
    for (const [name, w] of sets) {
      expect(weightsProblem(w), name).toBeUndefined();
      const ids = Object.keys(w);
      for (const g of ids) expect(ids.filter((k) => k !== g && ancestorsOf(k).has(g)), `${name}: ${g} beside its kind`).toEqual([]);
    }
  });

  it('cover every project, every play the catalog gives kinds and the Rep’s Seagull, name only real parts and scenes, give each a reason, and keep each play’s register the genre it had, its first-listed kind', () => {
    for (const t of PROJECTS) expect(PROJECT_GENRES[t.project], t.project).toBeDefined();
    for (const p of CATALOG.filter((x) => x.kinds?.length)) {
      const stated = PLAY_GENRES[p.title];
      expect(stated, p.title).toBeDefined();
      // The register is the genre a play was played in, named now, never read from the order of its list.
      expect(registerOfPlay(p.title), p.title).toBe(p.kinds![0]);
      for (const part of Object.keys(stated!.parts ?? {})) expect(p.parts.map((x) => x.name), `${p.title}: ${part}`).toContain(part);
    }
    for (const title of Object.keys(PLAY_GENRES)) expect(catalogTitle(title) ?? (title === 'The Seagull' ? title : undefined), title).toBe(title);
    for (const id of Object.keys(SCENE_GENRES)) expect(SCENES.some((s) => s.id === id), id).toBe(true);
    for (const v of [...Object.values(PROJECT_GENRES), ...Object.values(PLAY_GENRES), ...Object.values(SCENE_GENRES)]) expect(v.why.length).toBeGreaterThan(20);
    // No role in the game asks other than its project: each pair of parts is one story from two sides.
    expect(ROLE_GENRES).toEqual({});
    // Every practice brief is one genre, so its requirement is that genre whole.
    for (const b of BRIEFS) expect(requirementOfBrief(b).needs, b.id).toEqual([{ id: b.kinds[0], weight: 1, from: [b.kinds[0]] }]);
  });
});

describe('W2 and W5: one resolved set, normalized, bounded and free of order', () => {
  it('one genre, two even, two uneven and three, each stated by the play', () => {
    expect([requirementOfPlay('Riders To The Sea').level, requirementOfPlay('Riders To The Sea').how, shares(requirementOfPlay('Riders To The Sea'))]).toEqual(['play', 'stated', { tragedy: 1 }]);
    expect(shares(requirementOfPlay('Measure For Measure'))).toEqual({ political_drama: 0.5, tragicomedy: 0.5 });
    expect(shares(requirementOfPlay('Blood Wedding'))).toEqual({ romantic_drama: 0.4, tragedy: 0.6 });
    expect(shares(requirementOfPlay('Macbeth'))).toEqual({ historical_drama: 0.2, supernatural: 0.2, tragedy: 0.6 });
    expect(shares(requirementOfPlay('The Winter’s Tale'))).toEqual({ fairy_tale: 0.2, romance: 0.3, tragicomedy: 0.5 });
    // Until brief 22 the first listed took half: The Winter's Tale was romance 0.5, tragicomedy and fairy tale 0.25.
  });

  it('keeps distinct demands distinct: Trifles and Woyzeck share drama, and a tragedy specialist reads them apart', () => {
    expect(shares(requirementOfPlay('Trifles'))).toEqual({ drama: 0.6, mystery: 0.4 });
    expect(shares(requirementOfPlay('Woyzeck'))).toEqual({ drama: 0.4, tragedy: 0.6 });
    expect(read({ tragedy: 90 }, requirementOfPlay('Woyzeck'))).toBeCloseTo(0.54, 12);
    expect(read({ tragedy: 90 }, requirementOfPlay('Trifles'))).toBe(0);
  });

  it('sums to 1, every weight between 0 and 1, for every material in the game, stated or read from its tags', () => {
    const all = [
      ...PROJECTS.map((t) => requirementOfRole(t)), ...CATALOG.map((p) => requirementOfPlay(p.title)),
      ...CATALOG.flatMap((p) => p.parts.map((x) => requirementOfPlay(p.title, x.name))), ...SCENES.map((s) => requirementOfScene(s.id)), ...BRIEFS.map((b) => requirementOfBrief(b)),
      ...PROJECTS.map((t) => requirementOf(t.genres)), ...CATALOG.filter((p) => p.kinds).map((p) => requirementOf(p.kinds!)),
    ];
    for (const r of all) {
      if (!r.needs.length) continue;
      expect(r.needs.reduce((a, n) => a + n.weight, 0)).toBeCloseTo(1, 12);
      for (const n of r.needs) expect(n.weight > 0 && n.weight <= 1).toBe(true);
    }
  });

  it('W1: the same tags in every order, and the same weights written in every order, resolve to the same set to the bit; a tag repeated adds nothing', () => {
    const lists = [...PROJECTS.map((t) => t.genres), ...CATALOG.filter((p) => p.kinds).map((p) => p.kinds!), ['tragedy', 'drama', 'comedy', 'romance']];
    for (const kinds of lists) {
      const one = JSON.stringify(resolveGenres({ level: 'tags', tags: kinds }));
      for (const p of permutations(kinds)) {
        expect(JSON.stringify(resolveGenres({ level: 'tags', tags: p })), p.join(',')).toBe(one);
        expect(JSON.stringify(resolveGenres({ level: 'tags', tags: [...p, p[0]!, ...p] })), `${p.join(',')} repeated`).toBe(one);
      }
    }
    for (const [title, stated] of Object.entries(PLAY_GENRES)) {
      const one = JSON.stringify(resolveGenres({ level: 'play', weights: stated.weights }));
      for (const p of permutations(Object.entries(stated.weights))) expect(JSON.stringify(resolveGenres({ level: 'play', weights: Object.fromEntries(p) })), title).toBe(one);
    }
    // And the reading of every play by a person knowing its genres unevenly is the same in every order of its tags.
    for (const p of CATALOG.filter((x) => (x.kinds?.length ?? 0) > 1)) {
      const known = Object.fromEntries(p.kinds!.map((g, i) => [g, 20 + 30 * i]));
      const one = read(known, p.kinds!);
      for (const order of permutations(p.kinds!)) expect(read(known, order), p.title).toBe(one);
    }
  });

  it('a broad genre beside its own kind is one demand: folded into the kind, at any depth, never counted twice', () => {
    expect(requirementOf(['drama', 'domestic_drama']).needs).toEqual([{ id: 'domestic_drama', weight: 1, from: ['domestic_drama', 'drama'] }]);
    expect(resolveGenres({ level: 'play', weights: { comedy: 1, farce: 1 } }).needs).toEqual([{ id: 'farce', weight: 1, from: ['farce', 'comedy'] }]);
    // Drama, crime and Nordic noir, each the broad genre of the next: one demand, Nordic noir's.
    expect(requirementOf(['drama', 'crime', 'nordic_noir']).needs.map((n) => [n.id, n.weight])).toEqual([['nordic_noir', 1]]);
    // Drama known reads a domestic drama once, at its link's 0.4, never its 0.4 plus its whole.
    expect(read({ drama: 90 }, ['drama', 'domestic_drama'])).toBeCloseTo(0.36, 12);
    // Two kinds of one broad genre listed with it share its weight between them.
    expect(shares(requirementOf(['comedy', 'farce', 'satire']))).toEqual({ farce: 0.5, satire: 0.5 });
  });

  it('W2: weights missing read the tags evenly; invalid weights are skipped, said, and the level’s tags or the next level read', () => {
    const tags = ['tragedy', 'comedy'];
    expect(resolveGenres({ level: 'play', tags })).toMatchObject({ how: 'even', level: 'play', skipped: [] });
    for (const [weights, why] of [
      [{ tragedy: -1, comedy: 2 }, 'tragedy’s weight is below 0'],
      [{ tragedy: Number.NaN, comedy: 1 }, 'tragedy’s weight isn’t a number'],
      [{ tragedy: 1, not_a_genre: 1 }, 'not_a_genre isn’t a genre the game has'],
      [{ tragedy: 0, comedy: 0 }, 'no genre weighs above 0'],
      [{}, 'no genre weighs above 0'],
    ] as [Record<string, number>, string][]) {
      const r = resolveGenres({ level: 'play', weights, tags });
      expect([r.how, r.level, shares(r), r.skipped.map((s) => s.why.replace(/'/g, '’'))], JSON.stringify(weights)).toEqual(['even', 'play', { comedy: 0.5, tragedy: 0.5 }, [why]]);
      // A part's invalid set with no tags of its own falls to the play's stated set.
      const part = resolveGenres({ level: 'part', weights }, { level: 'play', weights: { tragedy: 3, comedy: 1 } });
      expect([part.level, part.how, shares(part)]).toEqual(['play', 'stated', { comedy: 0.25, tragedy: 0.75 }]);
    }
    // A weight of 0 beside others is that genre left out.
    expect(shares(resolveGenres({ level: 'play', weights: { tragedy: 1, comedy: 0 } }))).toEqual({ tragedy: 1 });
    // Nothing at any level: no requirement, and no reading.
    expect(resolveGenres(undefined, { level: 'play' })).toEqual({ needs: [], how: 'none', skipped: [] });
    expect(read({ tragedy: 100 }, resolveGenres())).toBe(0);
  });
});

describe('W2 and W3: the levels, the most precise first', () => {
  it('different scenes within one play: Julius Caesar’s Forum, orchard and tent each ask their own, a political drama specialist reading the Forum highest; a scene without its own reads its play’s; a scene of a play with no kinds its filed genre', () => {
    const forum = requirementOfScene('caesar-3-2');
    const orchard = requirementOfScene('caesar-2-1');
    const tent = requirementOfScene('caesar-4-3');
    expect([forum.level, forum.how, shares(forum)]).toEqual(['scene', 'stated', { historical_drama: 0.1, political_drama: 0.6, tragedy: 0.3 }]);
    expect(shares(orchard)).toEqual({ political_drama: 0.25, tragedy: 0.75 });
    expect(shares(tent)).toEqual({ political_drama: 0.3, tragedy: 0.7 });
    const politics = { political_drama: 90 };
    expect(read(politics, forum)).toBeGreaterThan(read(politics, tent));
    expect(read(politics, tent)).toBeGreaterThan(read(politics, orchard));
    expect(read(politics, requirementOfPlay('Julius Caesar'))).toBeCloseTo(0.27, 12);
    // The two of A Midsummer Night's Dream: the lovers' quarrel and the mechanicals' play.
    expect(shares(requirementOfScene('dream-3-2'))).toEqual({ farce: 0.3, romantic_comedy: 0.7 });
    expect(shares(requirementOfScene('dream-5-1'))).toEqual({ farce: 0.8, romantic_comedy: 0.2 });
    // Twelfth Night's scenes state none: the play's.
    expect(requirementOfScene('twelfth-1-5')).toEqual(requirementOfPlay('Twelfth Night'));
    expect(requirementOfScene('twelfth-1-5').level).toBe('play');
    // Hamlet's play has no kinds: the scene's filed genre, tragedy, evenly. It's coarser than a play's kinds, so a
    // scene of a play with kinds never reads it: Act Four of The Cherry Orchard is filed drama and reads tragicomedy.
    expect([requirementOfScene('hamlet-3-1').level, requirementOfScene('hamlet-3-1').how, shares(requirementOfScene('hamlet-3-1'))]).toEqual(['scene', 'even', { tragedy: 1 }]);
    expect(SCENES.find((s) => s.id === 'cherry-orchard-4')!.genre).toBe('drama');
    expect(shares(requirementOfScene('cherry-orchard-4'))).toEqual({ tragicomedy: 1 });
  });

  it('a part’s own against its play’s: Bottom’s farce, the fairies’ fairy tale, the lovers’ inherited romantic comedy; a part with invalid weights reads the play', () => {
    const dream = 'A Midsummer Night’s Dream';
    expect([requirementOfPlay(dream, 'Bottom').level, shares(requirementOfPlay(dream, 'Bottom'))]).toEqual(['part', { farce: 1 }]);
    expect(shares(requirementOfPlay(dream, 'Titania'))).toEqual({ fairy_tale: 0.6, romantic_comedy: 0.4 });
    expect([requirementOfPlay(dream, 'Hermia').level, shares(requirementOfPlay(dream, 'Hermia'))]).toEqual(['play', { fairy_tale: 0.4, romantic_comedy: 0.6 }]);
    expect(requirementOfHolder({ play: dream, role: 'Bottom' })).toEqual(requirementOfPlay(dream, 'Bottom'));
    // A part the play doesn't name, or no part: the play's.
    expect(requirementOfHolder({ play: dream, role: 'Nobody' })).toEqual(requirementOfPlay(dream));
    // The Rep's Seagull, by its production's name, as Nina.
    expect(shares(requirementOfHolder({ production: 'The Seagull', kind: 'role', role: 'Nina' }))).toEqual({ drama: 0.4, tragicomedy: 0.6 });
  });

  it('a professional role’s own against its project’s: every role inherits its project’s, and one given its own (TEST SETUP) reads it in casting’s fit', () => {
    for (const t of PROJECTS) {
      const r = requirementOfRole(t);
      expect([r.level, r.how], t.id).toEqual(['project', 'stated']);
      expect(r).toEqual(requirementOfRole(PROJECTS.find((x) => x.project === t.project && x.id !== t.id) ?? t));
    }
    const route = projectById('route-nine')!;
    const m: Material = { name: 'a role asking comedy', project: 'route-nine', role: { comedy: 1 }, needs: [['comedy', 1]], shape: 'single' };
    const sim = actor('b22-weights-role');
    const fit = (known: Known) => knowing(sim.player, known, () => fitOf(sim.player, route).genre);
    expect(fit({ comedy: 90 })).toBe(0);
    expect(fit({ psychological_horror: 90 })).toBe(1);
    listed(m, () => {
      expect([requirementOfRole(route).level, shares(requirementOfRole(route))]).toEqual(['role', { comedy: 1 }]);
      expect(fit({ comedy: 90 })).toBe(1);
      expect(fit({ psychological_horror: 90 })).toBe(0);
    });
  });
});

describe('W6: every reader reads the resolved set', () => {
  it('a night on stage reads the part’s: a farce specialist as Bottom has the genre part complete, as Hermia none', () => {
    const sim = actor('b22-weights-night');
    const night = (role: string, known: Known) => knowing(sim.player, known, () => nightEvaluation(sim, sim.player, `b22:${role}`, { play: 'A Midsummer Night’s Dream', role, kind: 'thesis', process: { lines: 1, blocking: 1, blockingMissed: 0, calls: 20, of: 20, notes: [], trained: 0 } } as never, sim.now, 'lead'));
    expect(night('Bottom', { farce: 90 }).inputs.prep.genre).toBeCloseTo(0.9, 12);
    expect(night('Hermia', { farce: 90 }).inputs.prep.genre).toBe(0);
    expect(night('Hermia', { romantic_comedy: 90, fairy_tale: 90 }).inputs.prep.genre).toBeCloseTo(0.9, 12);
    expect(night('Bottom', { farce: 90 }).overall).toBeGreaterThan(night('Bottom', {}).overall);
  });

  it('a call kept is practice in the part’s genres only: Bottom’s in farce, Hermia’s shared 3 to 2', () => {
    const sim = actor('b22-weights-call');
    const call = (role: string) => { sim.player.engagement = { byGenre: {} }; callAnswered(sim, sim.player, { play: 'A Midsummer Night’s Dream', role, kind: 'thesis' } as never, 'work', 1, 20, {}); return Object.fromEntries(Object.entries(sim.player.engagement!.byGenre).map(([g, v]) => [g, v.practice])); };
    expect(call('Bottom')).toEqual({ farce: 10 });
    expect(call('Hermia')).toEqual({ fairy_tale: 4, romantic_comedy: 6 });
  });

  it('School casting reads the play’s, the parts being dealt after it: knowing farce alone fits A Midsummer Night’s Dream as knowing nothing does', () => {
    const sim = actor('b22-weights-cast');
    const play = CATALOG.find((p) => p.title === 'A Midsummer Night’s Dream')!;
    const fit = (known: Known) => knowing(sim.player, known, () => castFit(sim, performerOf(sim, sim.player), play.reads, play.kinds ?? [], 'b22:cast', play.title, sim.player));
    expect(fit({ farce: 100 })).toBe(fit({}));
    expect(fit({ romantic_comedy: 90, fairy_tale: 90 })).toBeGreaterThan(fit({}));
  });

  it('a professional round and work day read the role’s: the genre part moves with a role given its own (TEST SETUP)', () => {
    const sim = actor('b22-weights-pro');
    const m: Material = { name: 'Static On Route 9, a comedy role', project: 'route-nine', role: { comedy: 1 }, needs: [['comedy', 1]], shape: 'single' };
    for (const path of ['audition in person', 'self-tape', 'callback', 'work day'] as const) {
      const at = (known: Known) => listed(m, () => knowing(sim.player, known, () => PATHS[path](sim, m)));
      expect(at({ comedy: 90 }).part, path).toBeCloseTo(0.9, 9);
      expect(at({ psychological_horror: 90 }).part, path).toBe(0);
    }
  });

  it('a professional rehearsal day learns the role’s lines faster by the role’s, and practice on a work day goes to the role’s genres', () => {
    const sim = actor('b22-weights-rehearsal');
    const t = projectById('calder-street')!;
    const lines = (known: Known) => knowing(sim.player, known, () => { const e = { prep: { interpretation: 0, memorization: 0, rehearsal: 0 } } as unknown as Engagement; rehearseDay(sim.player, e, t); return e.prep!.memorization; });
    expect(lines({ domestic_drama: 90 })).toBe(Math.round(0.12 * (1 + 0.9 / 6) * 1000) / 1000);
    expect(lines({ drama: 90 })).toBe(Math.round(0.12 * (1 + 0.36 / 6) * 1000) / 1000);
    const record = { byGenre: {} };
    creditPractice(record, requirementOfRole(t));
    expect(Object.keys(record.byGenre)).toEqual(['domestic_drama']);
  });

  it('a class scene’s preparation goes faster by the scene’s own: the Forum faster for a political drama specialist than the orchard', () => {
    const step = (sceneId: string, known: Known) => {
      const sim = actor('b22-weights-scene');
      sim.player.engagement = knower(known).engagement;
      const a: Assignment = {
        id: `b22-${sceneId}`, course: 'DRAM 103a/b', template: 'scene-study', term: 1, setOn: '2026-09-07', dueOn: '2026-09-21', sceneId, role: 0, partner: 0,
        prep: Object.fromEntries(PREP_DIMS.map((d) => [d, 0])) as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
      };
      for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id as never;
      courseworkOf(sim, sim.player)!.assignments.push(a);
      const act = activitiesOf(a).find((x) => x.dim === 'memorization' && !(x.needs ?? []).includes('partner'))!;
      return prepare(sim, sim.player, a, act.id).moved;
    };
    expect(genreSpeed(knower({ political_drama: 90 }), requirementOfScene('caesar-3-2'))).toBeCloseTo(1 + 0.54 / 6, 12);
    expect(step('caesar-3-2', { political_drama: 90 })).toBeGreaterThan(step('caesar-2-1', { political_drama: 90 }));
    expect(step('caesar-3-2', {})).toBe(step('caesar-2-1', {}));
  });

  it('a brief reads its one genre, and the Profile suggests, of what the next part asks, where study helps most', () => {
    const sim = actor('b22-weights-brief');
    const b = BRIEFS.find((x) => x.kinds[0] === 'farce')!;
    expect(knowing(sim.player, { farce: 90 }, () => genreKnown(sim.player, b))).toBeCloseTo(0.9, 12);
    expect(knowing(sim.player, { comedy: 90 }, () => genreKnown(sim.player, b))).toBeCloseTo(0.36, 12);
    sim.player.school!.casting = { play: 'A Midsummer Night’s Dream', role: 'Bottom', kind: 'thesis' } as never;
    expect(knowing(sim.player, {}, () => nextGenre(sim.player))).toEqual({ id: 'farce', why: 'part' });
    sim.player.school!.casting = { play: 'A Midsummer Night’s Dream', role: 'Hermia', kind: 'thesis' } as never;
    expect(knowing(sim.player, {}, () => nextGenre(sim.player))).toEqual({ id: 'romantic_comedy', why: 'part' });
    // Romantic comedy known: fairy tale is where study helps most.
    expect(knowing(sim.player, { romantic_comedy: 90 }, () => nextGenre(sim.player))).toEqual({ id: 'fairy_tale', why: 'part' });
  });
});

describe('W10: the explanations say it in words', () => {
  it('one genre, about even and uneven, never a weight or a share', () => {
    expect(requirementWords(requirementOfRole(projectById('calder-street')!))).toBe('Domestic Drama');
    expect(requirementWords(requirementOfPlay('Measure For Measure'))).toBe('Political Drama and Tragicomedy, about evenly');
    expect(requirementWords(requirementOfPlay('Blood Wedding'))).toBe('Mostly Tragedy, with some Romantic Drama');
    expect(requirementWords(requirementOfPlay('Macbeth'))).toBe('Mostly Tragedy, with some Historical Drama and Supernatural');
    expect(requirementWords(resolveGenres())).toBeUndefined();
    for (const t of PROJECTS) expect(requirementWords(requirementOfRole(t)), t.id).not.toMatch(/\d|weight|share|%/);
  });

  it('the Actor Showcase’s faculty say what a scene asks: a scene of one genre names it, one asking several says which most', () => {
    const scene = (id: string) => SCENES.find((x) => x.id === id)!;
    expect(askedWords(scene('caesar-3-2'))).toEqual({ words: 'This scene of Julius Caesar is mostly political drama, with some tragedy and historical drama', one: false });
    expect(askedWords(scene('dream-5-1'))).toEqual({ words: 'This scene of A Midsummer Night’s Dream is mostly farce, with some romantic comedy', one: false });
    // A scene of a play asking one genre, as before: until brief 22 every scene said its filed genre, comedy, drama or tragedy.
    const one = SCENES.find((x) => requirementOfScene(x.id).needs.length === 1 && requirementOfScene(x.id).level === 'play')!;
    const label = requirementWords(requirementOfScene(one.id))!.toLowerCase();
    expect(askedWords(one)).toEqual({ words: `${one.play} is ${/^[aeiou]/.test(label) ? 'an' : 'a'} ${label}`, one: true });
    for (const x of SCENES) expect(askedWords(x).words, x.id).not.toMatch(/\d|weight|share|%/);
  });
});

describe('the guide says the rule the game reads', () => {
  const row = (label: string) => GUIDE_BY_ID['craft.genre']!.reads!.find((r) => r.label === label)!.value;

  it('Related Genres: a kind toward its broad genre at 65%, a broad genre toward its kind at 40%, one step only, siblings nothing, the genre itself always helping, anything else nothing; each sentence what the game does', () => {
    const said = row('Related Genres');
    expect(said).toContain(`counts at ${Math.round(ENGAGEMENT.related.kindToParent * 100)}%: Psychological Horror known counts toward Horror`);
    expect(said).toContain(`counts at ${Math.round(ENGAGEMENT.related.parentToKind * 100)}%: Comedy known counts toward Farce`);
    expect([ENGAGEMENT.related.kindToParent, ENGAGEMENT.related.parentToKind]).toEqual([0.65, 0.4]);
    expect(relatedness('psychological_horror', 'horror')).toBe(0.65);
    expect(relatedness('comedy', 'farce')).toBe(0.4);
    expect(said).toContain('Nordic Noir doesn’t count toward Drama, two steps away, and two kinds of one genre don’t count toward each other');
    expect([relatedness('nordic_noir', 'drama'), relatedness('farce', 'satire'), relatedness('satire', 'farce')]).toEqual([0, 0, 0]);
    expect(said).toContain('so studying the genre itself always helps');
    const at = (known: Record<string, number>) => relevantGenre(knower(known), ['farce']).total;
    for (const comedy of [0, 50, 100]) expect(at({ comedy, farce: 10 }), String(comedy)).toBeGreaterThan(at({ comedy, farce: 0 }));
    expect(said).toContain('Any other genre counts for nothing');
    expect(at({ western: 100, horror: 100 })).toBe(0);
  });

  it('Knowing The Genre: the order genres are named in changes nothing, and a genre named beside its own kind counts as that kind', () => {
    const said = row('Knowing The Genre');
    expect(said).toContain('a genre named beside one of its own kinds counts as that kind, and the order genres are named in changes nothing');
    expect(requirementOf(['comedy', 'farce']).needs.map((n) => n.id)).toEqual(['farce']);
    expect(requirementOf(['tragedy', 'romantic_drama', 'tragedy']).needs).toEqual(requirementOf(['romantic_drama', 'tragedy']).needs);
  });
});

describe('W9: older saves', () => {
  it('every fixture save opens, and every School casting and credit it holds resolves: a play of the catalog to its stated set, a part’s where the play gives one, a new play to none', () => {
    let read = 0;
    for (const name of ['journey-j01-degree-8283f80c', 'journey-j01-last-term-8283f80c', 'journey-j01-year-one-8283f80c', 'b22/b20-4-opt-2029-09-01']) {
      const sim = loadSave(deserialise(gunzipSync(readFileSync(`tests/fixtures/${name}.json.gz`)).toString('utf8')) as never);
      const school = sim.player.school!;
      const holders = [school.casting, school.rep, school.cabaret, ...(school.summer?.shows ?? [])].filter((h): h is NonNullable<typeof h> => Boolean(h)) as { play?: string; role?: string; kind?: string; production?: string }[];
      const titles = [...holders.map((h) => h.play), ...(school.credits ?? []).map((c) => playOfCredit(c.production))].filter((t): t is string => Boolean(t));
      for (const h of holders) {
        const r = requirementOfHolder(h);
        if (!h.play) continue;
        read += 1;
        const known = CATALOG.find((p) => p.title === catalogTitle(h.play))?.kinds;
        expect(r.how, `${name}: ${h.play}`).toBe(known ? 'stated' : 'none');
        expect(r.level, `${name}: ${h.play}`).toBe(known ? (PLAY_GENRES[catalogTitle(h.play)!]?.parts?.[h.role ?? ''] ? 'part' : 'play') : undefined);
      }
      for (const title of titles) { read += 1; expect(requirementOfPlay(title).how, `${name}: ${title}`).toBe(CATALOG.find((p) => p.title === catalogTitle(title))?.kinds ? 'stated' : 'none'); }
    }
    expect(read).toBeGreaterThan(5);
  });

  it('a brief’s or a credit’s tags alone, as an older record keeps them, read evenly, the genres the game no longer has dropped', () => {
    expect(shares(requirementOf(['tragedy', 'retired_genre', 'comedy']))).toEqual({ comedy: 0.5, tragedy: 0.5 });
    expect(Object.keys(GENRE_DEFS)).not.toContain('retired_genre');
  });
});
