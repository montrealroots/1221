/**
 * Giving something to a friend (`systems/gifts.ts`, from 2026-10-02).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { contactsOf, newContact } from '@/engine/systems/people';
import { garmentsOf } from '@/engine/systems/wardrobe';
import { giveRefusal } from '@/engine/systems/gifts';

describe('a gift', () => {
  it('is theirs from then: gone from what you own and your outfits, and remembered', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'gift');
    const p = sim.player;
    const c = newContact(sim, p, 'us-ny-newyork', 'gift-friend', { at: sim.now, how: 'school' });
    contactsOf(p).push(c);
    const shirt = garmentsOf(p)[0]!;
    p.dressed = [shirt.id];
    const hours = c.hours;
    const r = sim.execute<{ given: string }>({ kind: 'items.give', payload: { itemId: shirt.id, contactId: c.id } });
    expect(r.ok, r.error).toBe(true);
    expect(garmentsOf(p).some((g) => g.id === shirt.id)).toBe(false);
    expect(p.dressed).toEqual([]);
    expect(c.memory[0]!.what).toBe(`You gave them ${shirt.label}`);
    expect(c.hours).toBe(hours);
  });

  it('is handed over in person, not to a rival, and not furniture', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'gift-no');
    const p = sim.player;
    const far = newContact(sim, p, 'us-ca-losangeles', 'gift-far', { at: sim.now, how: 'school' });
    const rival = newContact(sim, p, 'us-ny-newyork', 'gift-rival', { at: sim.now, how: 'school' });
    rival.rival = true;
    contactsOf(p).push(far, rival);
    const shirt = garmentsOf(p)[0]!;
    expect(giveRefusal(sim, p, shirt.id, far.id)).toMatch(/isn’t here to hand it to/);
    // Away from home, what's at home isn't to hand, whoever's there.
    p.currentLocationId = 'us-ca-losangeles';
    expect(giveRefusal(sim, p, shirt.id, far.id)).toBe('It isn’t to hand.');
    p.currentLocationId = 'us-ny-newyork';
    expect(giveRefusal(sim, p, shirt.id, rival.id)).toMatch(/would rather not/);
    expect(giveRefusal(sim, p, 'nothing', far.id)).toBe('That isn’t something you own.');
    expect(giveRefusal(sim, p, shirt.id, 'nobody')).toBe('You don’t know them.');
    expect(giveRefusal(sim, p, { ...shirt }.id, rival.id)).not.toBeUndefined();
    const sofa = { ...shirt, id: 'sofa', bulky: true };
    p.items = [...(p.items ?? []), sofa];
    expect(giveRefusal(sim, p, 'sofa', far.id)).toBe('It’s moved by movers, not handed over.');
  });
});
