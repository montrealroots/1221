/**
 * Schema 92, the connected attributes of 2026-10-09 (`migrate` in
 * `src/engine/index.ts`): an older save brought forward with the five new
 * abilities drawn from what it already holds, genre practice counted from its
 * own credits, the histories begun empty, nothing rerolled; and a second open
 * changing nothing.
 */

import { describe, expect, it } from 'vitest';
import { createSave, loadSave, migrate } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { derivedAbilities } from '@/engine/systems/attributes';
import { nightEvaluation } from '@/engine/systems/school';
import { SUPPORTED_SCHEMA_VERSION } from '../base44/shared/guard.js';
import { SUMMER_PLAYS } from '@/engine/content/plays';
import { GENRE_DEFS } from '@/engine/content/genres';

const KNOWN = SUMMER_PLAYS.find((p) => (p.kinds ?? []).some((k) => GENRE_DEFS[k]))!;

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

/** A save as 91 wrote it: no new abilities, no engagement, no histories. */
function at91(seed: string) {
  const sim = life(seed);
  const u = JSON.parse(JSON.stringify(sim.universe));
  const p = u.people[u.playerId];
  for (const k of ['listening', 'imagination', 'focus', 'adaptability', 'discipline']) delete p.attrs[k];
  delete p.engagement;
  delete p.development;
  delete p.work;
  u.meta.schemaVersion = 91;
  return u;
}

describe('schema 92', () => {
  it('is the one version the engine and the guard both name', () => {
    expect(SAVE_SCHEMA_VERSION).toBe(92);
    expect(SUPPORTED_SCHEMA_VERSION).toBe(SAVE_SCHEMA_VERSION);
  });

  it('draws the five abilities from what the save holds, keeps presence and composure, and begins the histories empty', () => {
    const u = at91('mig92-abilities');
    const p = u.people[u.playerId];
    const kept = { presence: p.attrs.presence, composure: p.attrs.composure };
    const expected = derivedAbilities(p);
    const r = migrate(u);
    expect(r.migrated).toBe(true);
    expect(r.steps.some((s) => s.includes('abilities'))).toBe(true);
    expect(p.attrs).toMatchObject({ ...kept, ...expected });
    expect(p.development).toEqual({ day: '', counts: {}, history: [] });
    expect(p.work).toEqual([]);
    expect(p.engagement).toEqual({ byInterest: {}, byGenre: {} });
    expect(u.meta.schemaVersion).toBe(92);
  });

  it('counts each night a credit records as practice in its play’s genres, and nothing for a credit it can’t place', () => {
    const u = at91('mig92-credits');
    const p = u.people[u.playerId];
    p.school.credits = [
      { production: `${KNOWN.title}, Yale Summer Cabaret 2027`, role: 'A Part', kind: 'summer', year: 2027, wentOn: 4 },
      { production: 'A Play Nobody Wrote', role: 'A Part', kind: 'hughes', year: 2027, wentOn: 3 },
    ];
    migrate(u);
    const genres = Object.entries(p.engagement.byGenre) as [string, { practice: number }][];
    // A play the game has, with its kinds; four nights of it, and the unplaceable credit nothing.
    expect(genres.map(([id]) => id).sort()).toEqual([...new Set(KNOWN.kinds!)].filter((k) => GENRE_DEFS[k]).sort());
    for (const [, g] of genres) expect(g.practice).toBeGreaterThan(0);
    const again = JSON.stringify(u);
    const second = migrate(u);
    expect(JSON.stringify(u)).toBe(again);
    expect(second.steps.filter((s) => /abilit|nights on stage/.test(s))).toHaveLength(0);
  });

  it('opens an old save into a game that runs: the abilities read, a night judged, practice possible', () => {
    // As a slot opens: brought forward, then loaded.
    const u = at91('mig92-open');
    migrate(u);
    const opened = loadSave(u);
    expect(opened.player.attrs!.listening).toBeGreaterThan(0);
    expect(opened.player.engagement).toBeDefined();
    expect(nightEvaluation(opened, opened.player, 'k', {}, opened.now).overall).toBeGreaterThan(0);
    const second = migrate(JSON.parse(JSON.stringify(opened.universe)));
    expect(second.steps.filter((s) => /abilit|nights on stage/.test(s))).toHaveLength(0);
  });

  it('gives a new life every ability from the start, with nothing to migrate', () => {
    const sim = life('mig92-new');
    const r = migrate(JSON.parse(JSON.stringify(sim.universe)));
    expect(r.steps.filter((s) => /abilit/.test(s))).toHaveLength(0);
    expect(Object.keys(sim.player.attrs!).sort()).toEqual(['adaptability', 'composure', 'discipline', 'focus', 'imagination', 'listening', 'presence']);
  });
});
