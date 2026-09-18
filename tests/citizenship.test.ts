/**
 * Two passports.
 *
 * Born in one country, naturalised in the one they moved to and live in now,
 * carrying both for the rest of their life. An ordinary biography in this
 * business, and one the save could not express.
 *
 * The work-permit rule that used to sit beside it is gone, and the note that
 * used to stand here is why: it said the arithmetic had no caller and was being
 * kept because the company would hire people one day. Five tests proved a rule
 * nothing asked, under a header admitting nothing asked it — which is the most
 * expensive kind of green there is, because it reads as coverage. What these
 * hold now is what the game actually reads: who holds which passports, how that
 * reads out loud, and that both survive a save.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig, quickSave } from '@/engine';
import {
  citizenshipLabel, citizenshipsOf, isCitizenOf,
} from '@/engine/domain/citizenship';

const dual = { citizenshipId: 'us', secondCitizenshipId: 'ca' };
const single = { citizenshipId: 'us' };

describe('holding one passport or two', () => {
  it('lists them in the order they are held', () => {
    expect(citizenshipsOf(single)).toEqual(['us']);
    expect(citizenshipsOf(dual)).toEqual(['us', 'ca']);
  });

  it('never counts the same country twice', () => {
    expect(citizenshipsOf({ citizenshipId: 'us', secondCitizenshipId: 'us' })).toEqual(['us']);
    expect(citizenshipsOf({ citizenshipId: 'us', secondCitizenshipId: undefined })).toEqual(['us']);
  });

  it('answers whether a country is one of theirs', () => {
    expect(isCitizenOf(dual, 'us')).toBe(true);
    expect(isCitizenOf(dual, 'ca')).toBe(true);
    expect(isCitizenOf(dual, 'fr')).toBe(false);
    expect(isCitizenOf(single, 'ca')).toBe(false);
  });

  it('reads both names on a screen', () => {
    expect(citizenshipLabel(single)).toBe('United States');
    expect(citizenshipLabel(dual)).toBe('United States And Canada');
  });
});

describe('against a real save', () => {
  it('carries the second passport onto the person and through a save', () => {
    const sim = createSave(1, 'cit-save', {
      ...defaultConfig(), firstName: 'Robin', lastName: 'Vance',
      citizenshipId: 'us', secondCitizenshipId: 'ca',
    });
    expect(sim.player.citizenshipId).toBe('us');
    expect(sim.player.secondCitizenshipId).toBe('ca');
    expect(citizenshipsOf(sim.player)).toEqual(['us', 'ca']);
  });

  it('gives everybody the family passport, and only that one', () => {
    // Citizenship is not a question the game asks any more. The family is
    // Icelandic, so anybody created here is, wherever they were born.
    const born = quickSave({ homeRegionId: 'us-ca-losangeles' }, 'cit-abroad');
    expect(born.player.citizenshipId).toBe('is');
    expect(born.player.secondCitizenshipId).toBeUndefined();
    expect(citizenshipsOf(born.player)).toEqual(['is']);
    // And where they were born does not quietly change it.
    const elsewhere = quickSave({ homeRegionId: 'jp-13-tokyo' }, 'cit-elsewhere');
    expect(elsewhere.player.citizenshipId).toBe('is');
  });

  it('leaves the screen no way to set citizenship to anything else', () => {
    // The engine can still carry two passports — that is a fact about people,
    // and it is tested above. What creation offers is one, locked.
    const creation = readFileSync('src/ui/creation/CharacterCreation.tsx', 'utf8');
    expect(creation, 'creation still has a citizenship dropdown')
      .not.toMatch(/id="citizenship"[\s\S]{0,80}<select/);
    expect(creation, 'creation still offers a second citizenship')
      .not.toMatch(/citizenship-second/);
    expect(creation).toMatch(/id="citizenship"[\s\S]{0,200}readOnly/);
  });

});
