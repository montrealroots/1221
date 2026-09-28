/**
 * The crafts, read (2026-09-28): each of the trades on the character sheet is
 * one somebody meets somewhere real in the work, a set, a stage, a booth, the
 * casting room, the finished film, and loving it lifts that day, never the
 * work itself (the owner's rule for interests).
 */

import { describe, expect, it } from 'vitest';
import type { Person } from '@/engine/domain/model';
import { CRAFT_INTERESTS } from '@/engine/content/interests';
import { CRAFTS_AT, GENRE_CRAFTS, craftsOf, enjoyCrafts, lovedCraft, lovedIn, lovedInWork, type WorkDay } from '@/engine/systems/enjoyment';
import { FILM_GENRES } from '@/engine/content/interests';

const body = (interests: string[]) => ({
  interests, genres: [], personality: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50 },
  wellbeing: { energy: 70, sleepDebt: 0, condition: 80, fitness: 50, nourishment: 70, hygiene: 70, stress: 50, morale: 50 },
} as unknown as Person);

describe('the crafts', () => {
  it('each has somewhere in the work, or an evening, to be met', () => {
    const days: WorkDay[] = [];
    for (const medium of ['screen', 'stage', 'voice'] as const) {
      for (const after of [undefined, 'tv', 'film', 'commercial'] as const) {
        for (const genre of [undefined, ...FILM_GENRES.map((g) => g.id)]) {
          for (const role of [undefined, 'animation', 'game']) {
            for (const rehearsal of [false, true]) days.push({ medium, ...(after ? { after } : {}), ...(genre ? { genre } : {}), ...(role ? { role } : {}), away: rehearsal, rehearsal });
          }
        }
      }
    }
    const met = new Set<string>([...days.flatMap(craftsOf), ...Object.values(CRAFTS_AT).flat(), ...lovedIn({ interests: CRAFT_INTERESTS.map((c) => c.id) }, 'unwind'), 'voice_acting']);
    expect(CRAFT_INTERESTS.map((c) => c.id).filter((id) => !met.has(id))).toEqual([]);
  });

  it('name only genres and crafts that are on the sheet', () => {
    const genres = new Set(FILM_GENRES.map((g) => g.id));
    const crafts = new Set(CRAFT_INTERESTS.map((c) => c.id));
    for (const [gs, cs] of GENRE_CRAFTS) {
      for (const g of gs) expect(genres.has(g), g).toBe(true);
      for (const c of cs) expect(crafts.has(c), c).toBe(true);
    }
    for (const c of Object.values(CRAFTS_AT).flat()) expect(crafts.has(c), c).toBe(true);
  });

  it('are the right ones in the right places', () => {
    expect(craftsOf({ medium: 'screen', away: false })).toContain('cinematography');
    expect(craftsOf({ medium: 'stage', away: false })).not.toContain('cinematography');
    expect(craftsOf({ medium: 'screen', after: 'tv', away: false })).toContain('writers_rooms');
    expect(craftsOf({ medium: 'screen', after: 'film', away: false })).not.toContain('writers_rooms');
    expect(craftsOf({ medium: 'screen', away: true })).toContain('location_scouting');
    expect(craftsOf({ medium: 'screen', away: false })).not.toContain('location_scouting');
    expect(craftsOf({ medium: 'screen', genre: 'action', away: false })).toContain('stunts');
    expect(craftsOf({ medium: 'screen', genre: 'romance', away: false })).not.toContain('stunts');
    expect(craftsOf({ medium: 'voice', role: 'game', away: false })).toContain('motion_capture');
    expect(craftsOf({ medium: 'voice', role: 'audiobook', away: false })).not.toContain('motion_capture');
    expect(craftsOf({ medium: 'stage', rehearsal: true, away: false })).toContain('dialect_coaching');
    expect(craftsOf({ medium: 'stage', rehearsal: false, away: false })).not.toContain('dialect_coaching');
  });

  it('count once a day however many are loved, and lift only who loves one', () => {
    const many = { interests: ['lighting', 'cinematography', 'props'], genres: [] };
    expect(lovedInWork(many, { medium: 'screen', away: false })).toEqual(['cinematography']);
    expect(lovedInWork({ interests: ['foley'], genres: [] }, { medium: 'screen', away: false })).toEqual([]);
    expect(lovedCraft({ interests: ['foley'] }, CRAFTS_AT.seen)).toBe('foley');
    const fan = body(['foley']);
    const other = body(['stunts']);
    expect(enjoyCrafts(fan, CRAFTS_AT.seen)).toBe(true);
    expect(enjoyCrafts(other, CRAFTS_AT.seen)).toBe(false);
    expect(fan.wellbeing.morale).toBeGreaterThan(other.wellbeing.morale);
    expect(fan.wellbeing.stress).toBeLessThan(other.wellbeing.stress);
    expect(fan.wellbeing.energy).toBe(other.wellbeing.energy);
  });
});
