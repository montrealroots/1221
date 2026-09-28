/**
 * A part's own demands (2026-09-28): a breakdown may ask for a song, a
 * fight, a dance, an accent or an intimate scene whatever the genre, and the
 * audition reads it and the job grows it.
 */

import { describe, expect, it } from 'vitest';
import { ROLES } from '@/engine/content/career';
import { auditionLevel, demandsOf, growsFor, readsFor } from '@/engine/systems/career';
import { evenCraft } from '@/engine/systems/school';

const role = (id: string) => ROLES.find((r) => r.id === id)!;

describe('a part’s own demands', () => {
  it('are drawn for the stage and the screen, not for voice work or a commercial, and never what the genre asks already', () => {
    const always = () => 0;
    expect(demandsOf(role('costar'), 'drama', always)).toEqual(['accents', 'combat', 'intimacy', 'singing', 'dance']);
    // A musical asks singing and dance already.
    expect(demandsOf(role('costar'), 'musical', always)).toEqual(['accents', 'combat', 'intimacy']);
    expect(demandsOf(role('audiobook'), undefined, always)).toEqual([]);
    expect(demandsOf(role('commercial'), undefined, always)).toEqual([]);
    expect(demandsOf(role('costar'), 'drama', () => 0.99)).toEqual([]);
  });

  it('are read at the audition and grown on the job', () => {
    expect(readsFor(role('costar'), 'drama', ['singing']).singing).toBe(1);
    expect(growsFor(role('costar'), 'drama', ['combat']).combat).toBeGreaterThan(0);
    // A singer reads better for a part that asks a song than one who doesn't sing.
    const singer = { ...evenCraft(60), singing: 95 };
    const plain = { ...evenCraft(60), singing: 20 };
    const asks = auditionLevel(singer, role('costar'), 'room', 'drama', ['singing']) - auditionLevel(plain, role('costar'), 'room', 'drama', ['singing']);
    const doesnt = auditionLevel(singer, role('costar'), 'room', 'drama') - auditionLevel(plain, role('costar'), 'room', 'drama');
    expect(asks).toBeGreaterThan(0);
    expect(doesnt).toBe(0);
  });
});
