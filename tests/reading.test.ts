/**
 * Reading (`systems/reading.ts`, from 2026-10-02): a reader enjoys an hour
 * unwinding at home only with something to read, a library card free to a
 * resident, a book or an e-reader at its seller's price.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { lovedIn } from '@/engine/systems/enjoyment';
import { cardRefusal, hasSomethingToRead, readingCatalog } from '@/engine/systems/reading';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a reader', () => {
  it('enjoys an hour unwinding at home only with something to read', () => {
    const sim = life('us-ny-newyork', 'read-love');
    const p = sim.player;
    p.interests = ['reading'];
    expect(hasSomethingToRead(p)).toBe(false);
    expect(lovedIn(p, 'unwind')).toEqual([]);
    sim.must({ kind: 'reading.library_card', payload: {} });
    expect(p.libraryCard).toBe('us-ny-newyork');
    expect(lovedIn(p, 'unwind')).toEqual(['reading']);
    expect(cardRefusal(p)).toBe('You have one.');
    // Had where you live: not on a friend's sofa, nor with no home.
    expect(cardRefusal({ ...p, libraryCard: undefined, home: { ...p.home!, kind: 'sofa' } })).toBe('A library card is had where you live.');
    expect(cardRefusal({ ...p, home: undefined })).toBe('A library card is had where you live.');
  });

  it('can buy a book instead, at its seller’s price, cheapest first', () => {
    const sim = life('ie-lei-dublin', 'read-book');
    const p = sim.player;
    p.interests = ['reading'];
    const shop = readingCatalog(sim, p);
    expect(shop.every((x) => x.buy.country === 'ie')).toBe(true);
    expect(shop.map((x) => x.price)).toEqual([...shop.map((x) => x.price)].sort((a, b) => a - b));
    sim.must({ kind: 'reading.buy', payload: { id: shop[0]!.buy.id } });
    expect(hasSomethingToRead(p)).toBe(true);
    expect(lovedIn(p, 'unwind')).toEqual(['reading']);
    // What's on sale is what's sold in the country they live in.
    expect(sim.execute({ kind: 'reading.buy', payload: { id: 'us-james' } }).error).toBe('It’s sold in another country.');
  });
});
