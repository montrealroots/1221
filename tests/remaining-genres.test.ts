/**
 * The thin genres of brief 09 (2026-10-16; docs/verification/integration-2026-10-16/prompts-09/genres.md, the owner's
 * brief 09, section 3), each in docs/verification/remaining-09/genres-checklist.json before any code changed:
 *
 * - The audit found 55 genres whose two briefs suit the same sides on every axis (the account said 54: it took off
 *   drama's stage scenes twice). Matching sides alone aren't the same work, so each pair was read as the engine reads it
 *   (`tools/genre-pairs.ts`): circumstances, objectives and obstacles, technique demands, preparation, valid
 *   interpretations, feedback and consequences, each the same or not by a rule fixed before any brief changed, and a pair
 *   the same in three of the six or more is substantively repetitive. Fourteen were. Each one's second situation was
 *   retired and a new scene written for SLATE took its place under a new id; the other 41 were kept, each with its reason
 *   (genres-09.md).
 * - Nothing a save holds of a retired brief is lost or read as the new one's: its record stays as it was, nothing offers
 *   it, its takes are still its genre's, and the new scene starts from nothing.
 *
 * The parts each revised genre is the same in were worked by hand from the two briefs' own fields (the medium, the
 * language, the stakes, the reader, the beats' tones, the features, the techniques, the length, and each reading's
 * heaviest lean and draw), written as literals. Feedback (who a take rewards and what it names as the limit) is the
 * judge's, read through `judgePiece` as the engine stands (evaluation-9): where the judge changes, that one part may.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { BRIEFS, BRIEF_BY_ID, RETIRED_BRIEFS, briefKinds, briefsOf, type Brief } from '@/engine/content/briefs';
import { GENRE_REGISTER } from '@/engine/content/genre-register';
import { registerOf, suggestions, type BriefRecord } from '@/engine/systems/briefs';
import { identityOf } from '@/engine/systems/artistry';
import { workPiece } from '@/engine/systems/workpieces';
import { PARTS, REPETITIVE_AT, betterSides, compare, pairOf, readOf, type Part } from '../tools/genre-pairs';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';

/** The 55 genres whose two briefs suited the same sides on every axis on 2026-10-16 (`tools/genre-audit.ts`, before any change). */
const SAME_SIDES_BEFORE = ['animated', 'anime', 'apocalyptic', 'blaxploitation', 'buddy_comedy', 'caper', 'chanbara', 'christmas', 'comedy', 'coming_of_age', 'conspiracy_thriller', 'costume_drama', 'creature_feature', 'dance', 'domestic_drama', 'drama', 'dystopian', 'erotic_thriller', 'family', 'farce', 'film_noir', 'gangster', 'gothic_horror', 'grindhouse', 'historical_fiction', 'isekai', 'jukebox_musical', 'melodrama', 'mockumentary', 'monster_movie', 'mumblecore', 'neorealism', 'new_wave', 'occult', 'parody', 'political_thriller', 'psychological_thriller', 'road_movie', 'samurai', 'satire', 'science_fantasy', 'silent_film', 'social_realism', 'spaghetti_western', 'splatter', 'stoner_comedy', 'swashbuckler', 'sword_and_sorcery', 'techno_thriller', 'tragicomedy', 'true_crime', 'western', 'whodunit', 'yakuza', 'zombie'];

/**
 * The fourteen revised: the new scene, and the parts its genre's two briefs are the same in now. Worked by hand from the
 * fields, e.g. yakuza: everyday against heightened (circumstances differ), steady against pressing (obstacles), on its
 * feet against not (technique demands: physical 2 against 0), short against long (preparation), no reading of the new
 * one leaning first and drawing most where one of the first's does (readings), and the specialist each rewards most.
 */
const REVISED: Readonly<Record<string, { title: string; same: readonly Part[] }>> = {
  animated: { title: 'The Lamp On Gull Rock', same: [] },
  christmas: { title: 'The Last Hour In The Grotto', same: ['circumstances'] },
  conspiracy_thriller: { title: 'Everything In Order', same: [] },
  farce: { title: 'Rooms 412, 414 And 416', same: ['techniques'] },
  film_noir: { title: 'The Pawn Ticket', same: ['circumstances'] },
  gothic_horror: { title: 'Entries For The Twelfth Of November', same: [] },
  jukebox_musical: { title: 'The Last Dance Before The Cake', same: ['circumstances'] },
  new_wave: { title: 'The Long Take On The Quay', same: ['circumstances'] },
  psychological_thriller: { title: 'The Third Telling', same: [] },
  samurai: { title: 'Two Bowls Of Rice A Day', same: ['techniques', 'feedback'] },
  silent_film: { title: 'Forty Feet Left', same: ['circumstances', 'feedback'] },
  sword_and_sorcery: { title: 'The Oath In The Old Tongue', same: [] },
  tragicomedy: { title: 'Episode Two Hundred', same: [] },
  yakuza: { title: 'The Cups At The Ferry House', same: [] },
};

describe('a genre’s two briefs, read as the engine reads them', () => {
  it('a brief against itself renamed is the same in all six parts: a renamed description is caught, never passed', () => {
    for (const g of ['yakuza', 'silent_film', 'drama']) {
      const b = BRIEF_BY_ID[`brief-${g}`]!;
      const renamed: Brief = { ...b, id: `${b.id}-renamed`, title: `${b.title} Again`, logline: `Again: ${b.logline}` };
      const c = compare(readOf(b), readOf(renamed));
      expect(c.n, g).toBe(6);
      expect(c.repetitive).toBe(true);
    }
  });

  it('none of the 55 genres whose briefs suited the same sides on 2026-10-16 is the same in three of the six parts or more', () => {
    const repetitive = SAME_SIDES_BEFORE.map((g) => pairOf(g)!).filter((p) => p.n >= REPETITIVE_AT).map((p) => `${p.genre}: ${PARTS.filter((x) => p.same[x]).join(', ')}`);
    expect(repetitive).toEqual([]);
  });

  it('the 55 are every genre in the code (149) whose briefs suited the same sides, counted from the register as it stands', () => {
    expect(Object.keys(GENRE_REGISTER).length).toBe(149);
    for (const g of SAME_SIDES_BEFORE) expect(GENRE_REGISTER[g], g).toBeDefined();
    expect(SAME_SIDES_BEFORE.length).toBe(55);
  });
});

describe('the genres revised on 2026-10-16', () => {
  for (const [g, x] of Object.entries(REVISED)) {
    it(`${g}: its second situation is ${x.title}, under a new id, and its two briefs are the same in ${x.same.length ? x.same.join(' and ') : 'none of the six parts'}`, () => {
      const [first, second] = briefsOf(g);
      expect(briefsOf(g).map((b) => b.id)).toEqual([`brief-${g}`, `brief-${g}-3`]);
      expect(second!.title).toBe(x.title);
      // Its genre kept: the register its takes are played in is the genre's, unchanged.
      expect(registerOf(second!)).toEqual(GENRE_REGISTER[g]!.concerns);
      expect(registerOf(first!)).toEqual(registerOf(second!));
      // The scene it replaced is gone, under an id never reused.
      expect(BRIEF_BY_ID[`brief-${g}-2`]).toBeUndefined();
      // Kept by its genre alone (from 2026-10-20, brief 17: its title and `replacedBy` were read by nothing, and went).
      expect(RETIRED_BRIEFS[`brief-${g}-2`]).toEqual({ kinds: [g] });
      const p = pairOf(g)!;
      expect(PARTS.filter((part) => p.same[part])).toEqual(x.same);
      expect(p.repetitive).toBe(false);
    });
  }

  it('every brief retired is one of the fourteen, and none is offered: the catalog is 298 briefs, two a genre', () => {
    expect(Object.keys(RETIRED_BRIEFS).sort()).toEqual(Object.keys(REVISED).map((g) => `brief-${g}-2`).sort());
    for (const id of Object.keys(RETIRED_BRIEFS)) expect(BRIEFS.some((b) => b.id === id), id).toBe(false);
    expect(BRIEFS.length).toBe(298);
  });
});

// --- A save that prepared a retired brief.

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

/**
 * FIXTURE: a life that prepared and taped Five Years From The Day before 2026-10-16. Play can't make one now (the brief is
 * gone), so its first brief is played through the commands and its record and its take are copied under the retired id,
 * in the shape the 2026-10-12 code wrote them: a reading of that brief (`dignity`), a way of playing it, a callback
 * earned, and the take on the work record keyed by its id.
 */
function prepared(): { sim: Simulation; key: string } {
  const sim = student('retired-brief');
  expect(go(sim, 'brief.choose', { brief: 'brief-yakuza', reading: 'elder', pace: 'measured' }).error).toBeUndefined();
  for (const step of ['read', 'lines', 'rehearse']) expect(go(sim, 'brief.prepare', { brief: 'brief-yakuza', step }).error).toBeUndefined();
  expect(go(sim, 'practice.self_tape', { genre: 'yakuza' }).error).toBeUndefined();
  const own = sim.player.briefs!['brief-yakuza']!;
  const record: BriefRecord = JSON.parse(JSON.stringify(own));
  record.reading = 'dignity';
  record.takes = record.takes.map((t) => ({ ...t, reading: 'dignity', key: t.key.replace('brief-yakuza:', 'brief-yakuza-2:') }));
  record.callback = { axis: 'pace', side: 'driven', why: 'The callback asks for it driven.', at: sim.now };
  sim.player.briefs!['brief-yakuza-2'] = record;
  delete sim.player.briefs!['brief-yakuza'];
  const work = sim.player.work!.at(-1)!;
  work.inputs.key = work.inputs.key.replace('brief-yakuza:', 'brief-yakuza-2:');
  work.what = 'Five Years From The Day (Dignity Intact), Taped';
  return { sim, key: work.inputs.key };
}

describe('a save that prepared a retired brief', () => {
  it('keeps its record as it was across a reload, and nothing offers it or reads it as the new scene', () => {
    const { sim } = prepared();
    const before = JSON.stringify(sim.player.briefs!['brief-yakuza-2']);
    const again = loadSave(deserialise(serialise(sim.universe)) as never);
    expect(JSON.stringify(again.player.briefs!['brief-yakuza-2'])).toBe(before);
    // Nothing offers it: not a callback waiting, not a reading untried, not a weakness's brief.
    expect(suggestions(again.player).map((s) => s.brief)).not.toContain('brief-yakuza-2');
    expect(suggestions(again.player, { target: 'composure', label: 'Composure', level: 40, full: 100 }).map((s) => s.brief)).not.toContain('brief-yakuza-2');
    expect(() => identityOf(again.player)).not.toThrow();
    expect(workPiece(again, again.player, 'brief:brief-yakuza-2')).toBeUndefined();
    // Every command on it is refused with the same reason as any brief that doesn't exist.
    expect(go(again, 'brief.prepare', { brief: 'brief-yakuza-2', step: 'lines' }).error).toBe('There’s no such brief.');
    expect(go(again, 'brief.choose', { brief: 'brief-yakuza-2', reading: 'dignity' }).error).toBe('There’s no such brief.');
    expect(go(again, 'practice.self_tape', { genre: 'yakuza', brief: 'brief-yakuza-2' }).error).toBe('There’s no such brief.');
    // The new scene starts from nothing: no record until the player chooses it, and then none of the old preparation.
    expect(again.player.briefs!['brief-yakuza-3']).toBeUndefined();
    expect(go(again, 'brief.choose', { brief: 'brief-yakuza-3', reading: 'form' }).error).toBeUndefined();
    expect(again.player.briefs!['brief-yakuza-3']!.prep).toEqual({ interpretation: 0, memorization: 0, rehearsal: 0 });
    expect(again.player.briefs!['brief-yakuza-3']!.takes).toEqual([]);
    expect(JSON.stringify(again.player.briefs!['brief-yakuza-2'])).toBe(before);
  });

  it('its take is still the genre’s: the genre’s look lists it among its tapes', () => {
    const { sim, key } = prepared();
    const again = loadSave(deserialise(serialise(sim.universe)) as never);
    const look = resolveLook(again, { kind: 'genre', id: 'yakuza' }) as Looked;
    expect(look.ways!.map((w) => w.label)).toContain('Five Years From The Day (Dignity Intact), Taped');
    expect(look.ways!.some((w) => JSON.stringify(w.to).includes(key))).toBe(true);
  });

  it('GUARD: a retired id names its genres, one offered now its own, and an id never written none', () => {
    for (const [id, r] of Object.entries(RETIRED_BRIEFS)) expect(briefKinds(id), id).toEqual(r.kinds);
    expect(briefKinds('brief-yakuza-3')).toEqual(['yakuza']);
    expect(briefKinds('brief-nothing-9')).toEqual([]);
  });
});

/**
 * genres-09.md §4, the table of the 55, read against the engine as it stands (from 2026-10-16, brief 11: the genres
 * area's genres.4-kept and genres.6-table, which until then were a document held by nothing). Each row's parts the
 * same, a kept genre's parts that differ, and what carries each of its sides are worked here from `tools/genre-pairs.ts`,
 * so the table can't fall behind the code unseen: where the judge or a brief moves one, the table is corrected with it.
 */
describe('genres-09.md’s table of the 55, against the code', () => {
  const md = readFileSync('docs/verification/integration-2026-10-16/genres-09.md', 'utf8');
  const section = md.split('## 4. Every Genre, Before And After')[1]!.split('\n## 5.')[0]!;
  // Genre, before, decision, what changed, what the engine reads, after, evidence.
  const table = section.split('\n').filter((l) => /^\| [a-z_]+ \|/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
  const NAMES: Readonly<Record<Part, string>> = { circumstances: 'circumstances', obstacles: 'objectives and obstacles', techniques: 'technique demands', preparation: 'preparation', readings: 'interpretations', feedback: 'feedback' };

  it('GUARD: lists the 55 and no other, the fourteen revised and the 41 kept', () => {
    expect(table.map((c) => c[0]).sort()).toEqual([...SAME_SIDES_BEFORE].sort());
    expect(table.filter((c) => c[2] === 'Revised').map((c) => c[0]).sort()).toEqual(Object.keys(REVISED).sort());
    expect(table.filter((c) => c[2] === 'Kept')).toHaveLength(41);
  });

  it('GUARD: says each genre’s two briefs are the same in the parts the engine reads now, and a kept one differs in the rest', () => {
    for (const [genre, , decision, , reads, after] of table) {
      const p = pairOf(genre!)!;
      const same = PARTS.filter((x) => p.same[x]).map((x) => NAMES[x]);
      expect(after!.match(/^(\d+)(?: \(([^)]*)\))?/)?.slice(1), genre).toEqual([String(same.length), same.length ? same.join(', ') : undefined]);
      if (decision === 'Kept') expect(reads!.match(/^Differs in ([^:]*):/)?.[1], genre).toBe(PARTS.filter((x) => !p.same[x]).map((x) => NAMES[x]).join(', '));
    }
  });

  it('GUARD: gives each kept genre’s sides and what carries each: its register where either brief’s side moves with its concerns set aside, else its scenes', () => {
    let decided = 0;
    for (const [genre, , decision, , reads] of table.filter((c) => c[2] === 'Kept')) {
      const [x, y] = BRIEFS.filter((b) => b.kinds[0] === genre);
      const withIt = [betterSides(x!), betterSides(y!)].map((s) => s.split(', '));
      const withoutIt = [betterSides(x!, false), betterSides(y!, false)].map((s) => s.split(', '));
      const said = [...reads!.matchAll(/(pace|scale|structure) ([a-z]+), (the register decides it|the scenes agree without the register too)/g)];
      expect(said.map((m) => m[1]), `${genre} (${decision})`).toEqual(['pace', 'scale', 'structure']);
      said.forEach((m, i) => {
        const register = withoutIt[0]![i] !== withIt[0]![i] || withoutIt[1]![i] !== withIt[1]![i];
        expect(m[2], `${genre}’s ${m[1]}`).toBe(withIt[0]![i]);
        expect(m[3], `${genre}’s ${m[1]}`).toBe(register ? 'the register decides it' : 'the scenes agree without the register too');
        if (register) decided += 1;
      });
    }
    expect(decided).toBe(29);
  });
});
