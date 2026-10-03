/**
 * Reading (`systems/reading.ts`, from 2026-10-02): a reader enjoys an hour
 * unwinding at home only with something to read, a library card free to a
 * resident, a book or an e-reader at its seller's price.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { lovedIn } from '@/engine/systems/enjoyment';
import { NOVEL_WORDS, READ_WPM, cardRefusal, hasSomethingToRead, readFor, readingCatalog } from '@/engine/systems/reading';

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

  it('reads a book through, at Brysbaert’s 260 words a minute and the corpus’s novel, and then wants another', () => {
    const sim = life('ie-lei-dublin', 'read-through');
    const p = sim.player;
    p.interests = ['reading'];
    const book = readingCatalog(sim, p).find((x) => x.buy.kind === 'book')!;
    sim.must({ kind: 'reading.buy', payload: { id: book.buy.id } });
    expect(NOVEL_WORDS).toBe(96_398);
    const hours = Math.ceil(NOVEL_WORDS / (60 * READ_WPM));
    for (let h = 1; h < hours; h += 1) expect(readFor(sim, p, 60)).toBeUndefined();
    expect(hasSomethingToRead(p)).toBe(true);
    expect(readFor(sim, p, 60)).toBe(book.buy.label);
    expect(hasSomethingToRead(p)).toBe(false);
    expect(lovedIn(p, 'unwind')).toEqual([]);
    expect(sim.universe.notifications.some((n) => n.title === 'A Book Read Through')).toBe(true);
    // A library card doesn't run out.
    sim.must({ kind: 'reading.library_card', payload: {} });
    expect(hasSomethingToRead(p)).toBe(true);
  });

  it('an hour unwinding at home is an hour of the book', () => {
    const sim = life('ie-lei-dublin', 'read-hour');
    const p = sim.player;
    p.interests = ['reading'];
    sim.must({ kind: 'reading.buy', payload: { id: readingCatalog(sim, p).find((x) => x.buy.kind === 'book')!.buy.id } });
    p.wellbeing.stress = 60;
    const r = sim.execute({ kind: 'life.look_after', payload: { action: 'unwind' } });
    expect(r.ok, r.error).toBe(true);
    const owned = (p.items ?? []).find((i) => i.kind.startsWith('book:'))!;
    expect(owned.readWords).toBe(60 * READ_WPM);
  });
});
