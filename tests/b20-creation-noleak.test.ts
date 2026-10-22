/**
 * Brief 20, the creation area: what creation asks that decides nothing, held to deciding nothing. Race and ethnicity
 * (`content/ethnicity.ts`: "nothing in the simulation reads it"), the background in the player's own words, the portrait,
 * the name the game calls them and their legal names are said back and never read to decide anything. Each is played as
 * twins that differ only in it, from the same seed, through the same commands and three months of the clock, and the two
 * saves are then compared whole, to the byte, with only the answer itself taken out of each: everything the game did is
 * the same.
 *
 * PLAYER JOURNEYS: a new life as creation makes it, born in New York, at Yale from 7:30 AM Monday 24 August 2026, begun
 * as `SlateApp` begins it with "I Know SLATE." chosen; at 8 AM a brief chosen and taped and a meal eaten, then the clock
 * run to 1 December 2026. The seed is this file's, b20-c-noleak, and the same in every twin. (`SlateApp` draws a save's
 * seed from the slot, the names and the moment of creation, as entropy: two saves begun alike are different worlds. The
 * names aren't read after that, which is what this holds.)
 */
import { describe, expect, it } from 'vitest';
import { createSave, refreshMeta } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { SaveUniverse } from '@/engine/domain/model';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { serialise } from '@/engine/persistence/adapter';
import { BRIEF_BY_ID } from '@/engine/content/briefs';

const EDT = (year: number, month: number, day: number, hour: number, minute = 0): number => Date.UTC(year, month - 1, day, hour + 4, minute);
const ada = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Zephyrine', lastName: 'Quarles', pronouns: 'she/her', ...extra });

/** A life played: the first morning's take and meal, through their commands, and the clock to 1 December. */
function played(config: NewSaveConfig): Simulation {
  const sim = createSave(1, 'b20-c-noleak', { ...config, tutorial: false, paused: true });
  sim.advanceTo(EDT(2026, 8, 24, 8));
  const b = BRIEF_BY_ID['brief-drama']!;
  expect(sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id } }).ok).toBe(true);
  const taped = sim.execute({ kind: 'practice.self_tape', payload: { genre: b.kinds[0], brief: b.id } });
  expect(taped.ok, taped.error).toBe(true);
  expect(sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } }).ok).toBe(true);
  sim.advanceTo(EDT(2026, 12, 1, 9));
  refreshMeta(sim);
  return sim;
}
/** The save, with what's said back taken out: the fields given, and every place a given word is written. */
function without(sim: Simulation, fields: (u: SaveUniverse) => void, words: Record<string, string> = {}): string {
  const u = JSON.parse(serialise(sim.universe)) as SaveUniverse;
  fields(u);
  let text = JSON.stringify(u);
  for (const [word, token] of Object.entries(words)) text = text.split(word).join(token);
  return text;
}
const player = (u: SaveUniverse) => u.people[u.playerId]!;

describe('what creation asks that decides nothing', () => {
  it('PLAYER JOURNEY: race and ethnicity, none said, two said, or said in their own words: the same life', () => {
    const none = played(ada());
    const two = played(ada({ raceEthnicity: ['black', 'hispanic'] }));
    const own = played(ada({ raceEthnicity: ['other'], raceEthnicityOwn: 'Cornish and Sámi' }));
    expect(two.player.raceEthnicity).toEqual(['black', 'hispanic']);
    expect(own.player.raceEthnicityOwn).toBe('Cornish and Sámi');
    const strip = (u: SaveUniverse) => { delete (player(u) as { raceEthnicity?: unknown }).raceEthnicity; delete player(u).raceEthnicityOwn; };
    expect(without(two, strip)).toBe(without(none, strip));
    expect(without(own, strip)).toBe(without(none, strip));
    // The take on the first morning, the same figure.
    expect(two.player.work?.[0]?.overall).toBe(none.player.work?.[0]?.overall);
  });

  it('PLAYER JOURNEY: the background, left empty or written: the same life', () => {
    const empty = played(ada());
    const written = played(ada({ background: 'Raised by the sea, and a long time leaving it. A choir, a ferry job, and the audition nobody expected.' }));
    expect(written.player.background).toContain('ferry job');
    const strip = (u: SaveUniverse) => { player(u).background = ''; };
    expect(without(written, strip)).toBe(without(empty, strip));
  });

  it('PLAYER JOURNEY: the portrait, none or a headshot: the same life', () => {
    const none = played(ada());
    const headshot = played(ada({ portrait: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==' }));
    expect(headshot.universe.meta.portrait).toMatch(/^data:image\/jpeg/);
    const strip = (u: SaveUniverse) => { delete player(u).portrait; delete u.meta.portrait; };
    expect(without(headshot, strip)).toBe(without(none, strip));
  });

  it('PLAYER JOURNEY: the name the game calls them and the legal names: the same life, but where the name is said', () => {
    const one = played(ada());
    const other = played(ada({ firstName: 'Ottoline', middleName: 'Erla', lastName: 'Vexley', displayName: 'Tolly' }));
    expect([other.player.displayName, other.universe.meta.characterName]).toEqual(['Tolly', 'Tolly']);
    expect(one.universe.meta.characterName).toBe('Zephyrine Quarles');
    const strip = (u: SaveUniverse) => { delete player(u).middleName; };
    const a = without(one, strip, { 'Zephyrine Quarles': '<CALLED>', Zephyrine: '<FIRST>', Quarles: '<LAST>' });
    const b = without(other, strip, { Tolly: '<CALLED>', Ottoline: '<FIRST>', Vexley: '<LAST>' });
    expect(b).toBe(a);
    // Where the names are said, the save's id isn't one of them: it's the seed's.
    expect(other.universe.meta.id).toBe(one.universe.meta.id);
  });
});
