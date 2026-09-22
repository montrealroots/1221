/**
 * Two passports.
 *
 * Born in one country, naturalised in the one they moved to and live in now,
 * carrying both for the rest of their life. An ordinary biography, and one the
 * save could not express.
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
import { citizenshipLabel, citizenshipsOf } from '@/engine/domain/citizenship';

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

  it('keeps the passport it was given, and drops a second that names the same country', () => {
    // The family passport was pinned to Iceland while there was a family.
    // There is not, so the save holds whatever creation said.
    const abroad = quickSave({ homeRegionId: 'jp-13-tokyo', citizenshipId: 'jp' }, 'cit-abroad');
    expect(abroad.player.citizenshipId).toBe('jp');
    const twice = quickSave({ citizenshipId: 'is', secondCitizenshipId: 'is' }, 'cit-twice');
    expect(citizenshipsOf(twice.player)).toEqual(['is']);
    expect(twice.player.secondCitizenshipId).toBeUndefined();
  });

  it('asks for both passports on the screen', () => {
    const creation = readFileSync('src/ui/creation/CharacterCreation.tsx', 'utf8');
    expect(creation, 'creation has no citizenship dropdown').toMatch(/id="citizenship"[\s\S]{0,80}<select|<select id="citizenship"/);
    expect(creation, 'creation offers no second citizenship').toMatch(/citizenship-second/);
  });
});
