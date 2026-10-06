/**
 * Every player command, given nothing and given nonsense (the owner's audit
 * of 2026-10-06, §6): each is refused in the world's own words, never a crash
 * surfacing as "… failed: TypeError", and a refused command leaves the save
 * exactly as it was. The list of commands is the developer map's, so a
 * command added later is tried here too.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { quickSave } from '@/engine';
import { serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';

const KINDS = readFileSync('docs/DEVMAP.md', 'utf8').split('\n').filter((l) => l.startsWith('| `')).map((l) => l.split('|')[1]!.trim().replace(/`/g, ''));
// Values of every shape a field might be asked for, each wrong: an id that names nothing, a negative amount, a word where a number goes.
const NONSENSE = {
  id: 'no-such-thing', itemId: 'no-such-thing', itemIds: ['no-such-thing'], homeId: 'no-such-thing', vehicleId: 'no-such-thing', accountId: 'no-such-thing',
  offerId: 'no-such-thing', productId: 'no-such-thing', bookingId: 'no-such-thing', documentId: 'no-such-thing', parcelId: 'no-such-thing', contactId: 'no-such-thing',
  amount: -500, quantity: -3, days: -2, minutes: 'ten', hours: 'many', price: -1, to: 'nowhere', kind: 'nothing', action: 'nothing', how: 'nothing',
};
/** A crash: the engine's own failure surfaced, not a refusal in the world's words. */
const crashed = (error: string | undefined) => Boolean(error && / failed: /.test(error) && /(TypeError|ReferenceError|RangeError|Cannot read|undefined|null|is not a function|is not iterable)/.test(error));

describe('every command, given nothing or nonsense', () => {
  it('is refused in the world’s words or done, never crashes, and a refusal leaves the save as it was', () => {
    expect(KINDS.length).toBeGreaterThan(300);
    const crashes: string[] = [];
    const leaky: string[] = [];
    const done: string[] = [];
    for (const kind of KINDS) {
      for (const payload of [{}, NONSENSE]) {
        const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, `robust-${kind}`);
        const before = serialise(sim.universe);
        const r = sim.execute({ kind, payload: payload as Record<string, unknown> });
        if (crashed(r.error)) crashes.push(`${kind} ${JSON.stringify(payload).slice(0, 30)}: ${r.error}`);
        if (!r.ok && serialise(sim.universe) !== before) leaky.push(kind);
        if (r.ok) done.push(`${kind} ${payload === NONSENSE ? 'nonsense' : 'nothing'}`);
        if (r.ok && breaches(sim.universe).length) leaky.push(`${kind} (done, but broke ${breaches(sim.universe).map((b) => b.law).join(', ')})`);
      }
    }
    // Done on nothing or nonsense: listed for review, as a toggle or a reading needs no input.
    console.log(`ACCEPTED ${done.length}: ${done.join(' | ')}`);
    expect(crashes, crashes.join('\n')).toEqual([]);
    expect(leaky, leaky.join('\n')).toEqual([]);
  }, 1_800_000);
});

describe('what the sweep found (from 2026-10-06)', () => {
  const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  it('refuses deleting an outfit or a routine that isn’t there, and an errand to nowhere', () => {
    const sim = life('robust-found');
    expect(sim.execute({ kind: 'clothes.delete_outfit', payload: { outfitId: 'nope' } }).error).toBe('There’s no outfit of yours by that name.');
    expect(sim.execute({ kind: 'routine.delete', payload: { routineId: 'nope' } }).error).toBe('There’s no routine of yours by that name.');
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'nowhere' } }).error).toBe('Say where you’re going: the shops or an errand.');
    expect(sim.player.trip).toBeUndefined();
  });
});
