/**
 * Schema 94, the interests removed (2026-10-10, at the owner's word; `migrate` in `src/engine/index.ts`): a save that
 * kept each person's interests and what they'd done of them (`engagement.byInterest`) opens without either, its genres,
 * their familiarity and practice, and the tickets already paid on the ledger as they were; and a second open changes
 * nothing.
 */

import { describe, expect, it } from 'vitest';
import { createSave, loadSave, migrate } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { SUPPORTED_SCHEMA_VERSION } from '../base44/shared/guard.js';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', genres: ['comedy'] });

/** A save as 93 wrote it: interests on the sheet, an hour of one on record, a genre studied, and a ticket paid. */
function at93(seed: string) {
  const sim = life(seed);
  sim.must({ kind: 'genre.study', payload: { genre: 'comedy' } });
  const u = JSON.parse(JSON.stringify(sim.universe));
  const p = u.people[u.playerId];
  p.interests = ['theatre', 'cooking'];
  p.engagement.byInterest = { theatre: { familiarity: 6, sessions: 1, satiation: 0.25, satiatedAt: sim.now, lastAt: sim.now } };
  u.transactions.push({ id: 'txn-ticket', at: sim.now, memo: 'A ticket: Theater', category: 'entertainment', postings: [] });
  u.meta.schemaVersion = 93;
  return { u, genres: JSON.stringify(p.engagement.byGenre) };
}

describe('schema 94', () => {
  it('is the one version the engine and the guard both name', () => {
    expect(SAVE_SCHEMA_VERSION).toBe(94);
    expect(SUPPORTED_SCHEMA_VERSION).toBe(SAVE_SCHEMA_VERSION);
  });

  it('drops the interests and their record, keeps the genres and the ledger, and says so', () => {
    const { u, genres } = at93('m94-drop');
    const report = migrate(u);
    const p = u.people[u.playerId];
    expect('interests' in p).toBe(false);
    expect('byInterest' in p.engagement).toBe(false);
    expect(JSON.stringify(p.engagement.byGenre)).toBe(genres);
    expect(p.genres).toEqual(['comedy']);
    expect(u.transactions.some((t: { id: string }) => t.id === 'txn-ticket')).toBe(true);
    expect(report.steps.join(' ')).toMatch(/interests/);
    expect(u.meta.schemaVersion).toBe(94);
  });

  it('changes nothing on a second open, and opens into a game that runs', () => {
    const { u } = at93('m94-again');
    migrate(u);
    const once = JSON.stringify(u);
    const again = migrate(u);
    expect(JSON.stringify(u)).toBe(once);
    expect(again.steps.join(' ')).not.toMatch(/interests/);
    const sim = loadSave(u as never);
    // The genre studied before is still known, and an hour of an interest is no command at all.
    expect(sim.player.engagement!.byGenre.comedy!.familiarity).toBeGreaterThan(0);
    const pursued = sim.execute({ kind: 'interest.pursue', payload: { interest: 'theatre' } });
    expect(pursued.ok).toBe(false);
    // The player's sentence says it changed nothing; the command's name is the detail, for a developer (brief 14).
    expect(pursued.error).toBe('That isn’t something the game can do, so it changed nothing.');
    expect(pursued.detail).toMatch(/unknown|no handler|not a command/i);
  });

  it('gives a new life no interests to drop', () => {
    const sim = life('m94-new');
    expect('interests' in sim.player).toBe(false);
    expect(migrate(JSON.parse(JSON.stringify(sim.universe))).steps.join(' ')).not.toMatch(/interests/);
  });
});
