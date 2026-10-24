/**
 * Brief 26 (2026-10-24, M11): the saves' repeats, failures and reopenings, which the persistence tests of earlier
 * passes left to one open each. Each probe presses the same thing twice or breaks it once and reads what the slot,
 * its backup and the life hold after.
 *
 * - A save an opening has to bring forward (a `history` field, which 2026-10-02 dropped) is written back once, after a
 *   backup of what was stored; opened again it is current, and nothing is written. One from a newer build is refused
 *   twice in the same words, and the slot's bytes don't move.
 * - A write that fails on the slot's own key leaves the slot readable and as it was, says so in the player's words, and
 *   the next write goes through.
 * - A slot deleted twice is empty once with its backup kept; restored, it holds the life again; restored again it holds
 *   the same life, not nothing.
 * - A life of thirty days opened through its slot every five days, with Save & Exit's own write before each, is the same
 *   to the byte as the life played straight; `openSlot` never writes a current save back.
 * - `loadSave` on the same bytes twice gives the same bytes: every once-on-opening step is marked, and the rest change
 *   nothing on a save they've already visited.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createSave, loadSave, openSlot, refreshMeta, validateUniverse } from '@/engine';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { MS_DAY } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { LocalSaveAdapter, type SaveStore } from '@/engine/persistence/local';
import { PersistenceError, deserialise, serialise } from '@/engine/persistence/adapter';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

/** A store in memory, counting its writes, that can be told to fail the next write of one key. */
function memory(): SaveStore & { map: Map<string, string>; writes: string[]; failNext: string | null } {
  const map = new Map<string, string>();
  const self = {
    map, writes: [] as string[], failNext: null as string | null,
    async getItem(key: string) { return map.get(key) ?? null; },
    async setItem(key: string, value: string) {
      if (self.failNext === key) { self.failNext = null; throw new DOMException('full', 'QuotaExceededError'); }
      self.writes.push(key); map.set(key, value);
    },
    async removeItem(key: string) { map.delete(key); },
  };
  return self;
}

const SAVE = 'slate.save.1';
const BACKUP = 'slate.backup.1';

describe('a save brought forward, opened twice', () => {
  let store: ReturnType<typeof memory>;
  let adapter: LocalSaveAdapter;
  beforeEach(() => { store = memory(); adapter = new LocalSaveAdapter(store); });

  it('is written back once after a backup, and the second open writes nothing', async () => {
    const sim = life('b26-persist-forward');
    // A field 2026-10-02 dropped, as a save from before carries it.
    (sim.universe as unknown as Record<string, unknown>).history = [{ at: sim.now, what: 'slept' }];
    await adapter.save(sim.universe);
    const stored = store.map.get(SAVE)!;
    expect(store.map.has(BACKUP)).toBe(false);
    store.writes.length = 0;

    const first = await openSlot(adapter, 1);
    if ('error' in first) throw new Error(first.error);
    expect(first.migration.migrated).toBe(true);
    expect(first.migration.steps).toContain('Dropped the history: nothing read it.');
    expect('history' in first.universe).toBe(false);
    // The slot before the step is the backup; the slot is the save brought forward; each written once.
    expect(store.map.get(BACKUP)).toBe(stored);
    expect(store.map.get(SAVE)).not.toBe(stored);
    expect(store.writes).toEqual([BACKUP, BACKUP, SAVE]);
    const written = store.map.get(SAVE)!;
    store.writes.length = 0;

    const second = await openSlot(adapter, 1);
    if ('error' in second) throw new Error(second.error);
    expect(second.migration.migrated).toBe(false);
    expect(second.migration.steps).toEqual([]);
    expect(store.writes).toEqual([]);
    expect(store.map.get(SAVE)).toBe(written);
    expect(store.map.get(BACKUP)).toBe(stored);
    // And what was opened plays: a day on, the clock moved and the save still whole.
    const played = loadSave(second.universe);
    played.advanceTo(played.now + MS_DAY);
    expect(validateUniverse(played.universe).ok).toBe(true);
  });

  it('refuses a save from a newer build twice in the same words, and moves nothing', async () => {
    const sim = life('b26-persist-newer');
    sim.universe.meta.schemaVersion = SAVE_SCHEMA_VERSION + 1;
    await adapter.save(sim.universe);
    const stored = store.map.get(SAVE)!;
    store.writes.length = 0;
    const once = await openSlot(adapter, 1);
    const twice = await openSlot(adapter, 1);
    expect(once).toEqual({ error: 'Slot 1 was saved by a newer version of SLATE, so this version won’t open it. SLATE hasn’t changed anything in it.' });
    expect(twice).toEqual(once);
    expect(store.writes).toEqual([]);
    expect(store.map.get(SAVE)).toBe(stored);
    expect(store.map.has(BACKUP)).toBe(false);
  });
});

describe('a write that fails', () => {
  it('leaves the slot readable and as it was, says so, and the next write goes through', async () => {
    const store = memory();
    const adapter = new LocalSaveAdapter(store);
    const sim = life('b26-persist-fail');
    await adapter.save(sim.universe);
    const before = store.map.get(SAVE)!;
    sim.advanceTo(sim.now + 2 * MS_DAY);

    store.failNext = SAVE;
    let failed: unknown;
    try { await adapter.save(sim.universe); } catch (e) { failed = e; }
    expect(failed).toBeInstanceOf(PersistenceError);
    expect((failed as PersistenceError).recoverable).toBe(true);
    expect((failed as Error).message).toBe('There isn’t enough storage space on this device to save, so nothing in the slot changed. Free some space, or delete a save you no longer want, then try again.');
    expect(store.map.get(SAVE)).toBe(before);
    const stillThere = await adapter.load(1);
    expect(stillThere?.now).toBe(deserialise(serialise(sim.universe)).now - 2 * MS_DAY);
    // The backup made before the failed write is the slot's own save, readable, not the newer one that didn't land.
    expect(store.map.get(BACKUP)).toBe(before);
    const slots = await adapter.listSlots();
    expect(slots[0]).toMatchObject({ slot: 1, occupied: true, hasBackup: true });

    // Pressed again, with room: the newer save lands, the older is its backup.
    await adapter.save(sim.universe);
    expect((await adapter.load(1))!.now).toBe(sim.now);
    expect(store.map.get(BACKUP)).toBe(before);
  });
});

describe('a slot deleted twice, and restored twice', () => {
  it('is empty once with its backup kept, and a second restore holds the same life', async () => {
    const store = memory();
    const adapter = new LocalSaveAdapter(store);
    const sim = life('b26-persist-delete');
    sim.advanceTo(sim.now + MS_DAY);
    refreshMeta(sim);
    await adapter.save(sim.universe);
    const stored = store.map.get(SAVE)!;

    await adapter.remove(1);
    await adapter.remove(1);
    expect(store.map.has(SAVE)).toBe(false);
    expect(store.map.get(BACKUP)).toBe(stored);
    let slots = await adapter.listSlots();
    expect(slots[0]).toMatchObject({ slot: 1, occupied: false, hasBackup: true, backupDateLabel: sim.universe.meta.worldDateLabel });

    const back = await openSlot(adapter, 1, { fromBackup: true });
    if ('error' in back) throw new Error(back.error);
    expect(back.universe.meta.id).toBe(sim.universe.meta.id);
    expect(back.universe.now).toBe(sim.now);
    expect(store.map.get(SAVE)).toBe(stored);
    slots = await adapter.listSlots();
    expect(slots[0]).toMatchObject({ slot: 1, occupied: true, hasBackup: true });

    // Restored again: the backup is the same save, so the slot holds the same life, not an empty one.
    const again = await openSlot(adapter, 1, { fromBackup: true });
    if ('error' in again) throw new Error(again.error);
    expect(serialise(again.universe)).toBe(serialise(back.universe));
    expect(store.map.get(SAVE)).toBe(stored);
    expect(await openSlot(adapter, 2, { fromBackup: true })).toEqual({ error: 'That slot has no backup to restore.' });
    expect(await openSlot(adapter, 2)).toEqual({ error: 'That slot is empty.' });
  });
});

describe('a life of thirty days, reopened through its slot every five', () => {
  it('is the same to the byte as the life played straight, and a current save is never written back', async () => {
    const store = memory();
    const adapter = new LocalSaveAdapter(store);
    const play = (sim: ReturnType<typeof life>) => {
      // TEST SETUP: a tended body before each stretch, so the days are what's measured.
      Object.assign(sim.player.wellbeing, { energy: 90, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80 });
      sim.advanceTo(sim.now + 5 * MS_DAY);
    };
    const straight = life('b26-persist-thirty');
    for (let n = 0; n < 6; n += 1) play(straight);

    let sim = life('b26-persist-thirty');
    let opens = 0;
    for (let n = 0; n < 6; n += 1) {
      play(sim);
      // Save & Exit's own write, then Continue: the slot opened, brought forward (nothing to do), validated.
      refreshMeta(sim);
      await adapter.save(sim.universe);
      const writes = store.writes.length;
      const opened = await openSlot(adapter, 1);
      if ('error' in opened) throw new Error(opened.error);
      expect(opened.migration.migrated).toBe(false);
      expect(store.writes.length).toBe(writes);
      expect(validateUniverse(opened.universe).ok).toBe(true);
      sim = loadSave(opened.universe) as ReturnType<typeof life>;
      opens += 1;
    }
    expect(opens).toBe(6);
    refreshMeta(straight);
    expect(serialise(sim.universe)).toBe(serialise(straight.universe));
    expect(sim.now).toBe(straight.now);
    expect(sim.now - createSaveNow('b26-persist-thirty')).toBe(30 * MS_DAY);
    // The slot's card reads the life as it stands.
    const [card] = await adapter.listSlots();
    expect(card?.meta?.worldDateLabel).toBe(sim.universe.meta.worldDateLabel);
    expect(card?.meta?.netWorthLabel).toBe(sim.universe.meta.netWorthLabel);
  }, 120_000);
});

describe('loadSave on the same bytes twice', () => {
  it('gives the same bytes, on a new life and on one played a fortnight', () => {
    const fresh = life('b26-persist-twice');
    const a = serialise(fresh.universe);
    const b = serialise(loadSave(deserialise(a) as never).universe);
    const c = serialise(loadSave(deserialise(b) as never).universe);
    expect(b).toBe(a);
    expect(c).toBe(a);

    fresh.advanceTo(fresh.now + 14 * MS_DAY);
    const p = serialise(fresh.universe);
    const q = serialise(loadSave(deserialise(p) as never).universe);
    const r = serialise(loadSave(deserialise(q) as never).universe);
    expect(q).toBe(p);
    expect(r).toBe(p);
  });
});

function createSaveNow(seed: string): number {
  return life(seed).now;
}
