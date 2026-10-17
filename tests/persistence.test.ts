/**
 * Saves on this device are packed, and a save from before packing still loads.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openSlot, quickSave } from '@/engine';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { LOCAL_STORE, LocalSaveAdapter, movingStore } from '@/engine/persistence/local';
import { deserialise, serialise } from '@/engine/persistence/adapter';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(key: string) { return this.map.get(key) ?? null; }
  key(index: number) { return [...this.map.keys()][index] ?? null; }
  removeItem(key: string) { this.map.delete(key); }
  setItem(key: string, value: string) { this.map.set(key, value); }
}

describe('saves on this device', () => {
  let store: MemoryStorage;
  beforeEach(() => {
    store = new MemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true, writable: true });
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage');
  });

  it('packs a save to a fraction of its JSON and loads it back whole', async () => {
    // A save with a few years of life on it, so there is something to compress.
    const sim = quickSave({ wealth: 'inherited' }, 'pack-1');
    sim.advanceTo(sim.now + 3 * 365 * 86_400_000);
    const adapter = new LocalSaveAdapter();
    const json = serialise(sim.universe);
    await adapter.save(sim.universe);
    const raw = store.getItem(`slate.save.${sim.universe.meta.slot}`)!;
    expect(raw.startsWith('slate.gz1:')).toBe(true);
    expect(raw.length).toBeLessThan(json.length * 0.4);
    const loaded = await adapter.load(sim.universe.meta.slot);
    expect(loaded).not.toBeNull();
    expect(serialise(loaded!)).toBe(json);
    const slots = await adapter.listSlots();
    const mine = slots.find((s) => s.slot === sim.universe.meta.slot)!;
    expect(mine.occupied).toBe(true);
    expect(mine.meta?.id).toBe(sim.universe.meta.id);
    expect(mine.bytes).toBe(raw.length);
  });

  it('still loads a save written before packing existed', async () => {
    const sim = quickSave({ wealth: 'inherited' }, 'pack-legacy');
    const adapter = new LocalSaveAdapter();
    store.setItem(`slate.save.${sim.universe.meta.slot}`, serialise(sim.universe));
    const loaded = await adapter.load(sim.universe.meta.slot);
    expect(loaded?.meta.id).toBe(sim.universe.meta.id);
    // The next save packs it, and keeps the plain one as the backup.
    await adapter.save(loaded!);
    expect(store.getItem(`slate.save.${sim.universe.meta.slot}`)!.startsWith('slate.gz1:')).toBe(true);
    expect(store.getItem(`slate.backup.${sim.universe.meta.slot}`)!.startsWith('{')).toBe(true);
    const restored = await adapter.restoreBackup(sim.universe.meta.slot);
    expect(restored?.meta.id).toBe(sim.universe.meta.id);
  });
});

describe('a save that will not read', () => {
  let store: MemoryStorage;
  beforeEach(() => {
    store = new MemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true, writable: true });
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage');
  });

  it('tells the player something they can act on, not the parser’s message', () => {
    // JSON.parse says "Unexpected token 'h', ... is not valid JSON". That used
    // to reach the slot card verbatim. What the player can do about a corrupt
    // save does not depend on which byte broke it.
    expect(() => deserialise('this is not a universe')).toThrow(/damaged and can’t be read/);
    expect(() => deserialise('this is not a universe')).not.toThrow(/JSON|Unexpected token/);
  });

  it('still says so when the file parses but is not a SLATE save', () => {
    expect(() => deserialise('{"hello":"world"}')).toThrow(/isn’t a SLATE save/);
  });

  it('puts that sentence on the slot rather than a prefix and a parser', async () => {
    const adapter = new LocalSaveAdapter();
    store.setItem('slate.save.2', 'this is not a universe');

    const slots = await adapter.listSlots();
    const broken = slots.find((s) => s.slot === 2);
    expect(broken?.occupied).toBe(true);
    expect(broken?.error).toBe('That save file is damaged and can’t be read.');
    expect(broken?.error).not.toMatch(/JSON|Unexpected token/);
  });

  it('does not write a damaged save over the backup that could still be read', async () => {
    // Deleting a corrupt slot is precisely when the older copy is the only
    // thing left, so it is the last moment to overwrite it with the corruption.
    const sim = quickSave({ wealth: 'inherited' }, 'delete-corrupt');
    const adapter = new LocalSaveAdapter();
    const slot = sim.universe.meta.slot;
    await adapter.save(sim.universe);
    await adapter.backup(slot);
    store.setItem(`slate.save.${slot}`, 'this is not a universe');

    await adapter.remove(slot);

    const restored = await adapter.restoreBackup(slot);
    expect(restored?.meta.id).toBe(sim.universe.meta.id);
  });
});

describe('deleting a slot', () => {
  let store: MemoryStorage;
  beforeEach(() => {
    store = new MemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true, writable: true });
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage');
  });

  it('leaves a backup behind, so the screen can honor the undo it promises', async () => {
    const sim = quickSave({ wealth: 'inherited' }, 'delete-undo');
    const adapter = new LocalSaveAdapter();
    const slot = sim.universe.meta.slot;
    await adapter.save(sim.universe);

    await adapter.remove(slot);

    const slots = await adapter.listSlots();
    const emptied = slots.find((s) => s.slot === slot)!;
    expect(emptied.occupied).toBe(false);
    // An empty slot that reports a backup is what puts Restore Backup on the card.
    expect(emptied.hasBackup).toBe(true);
    const restored = await adapter.restoreBackup(slot);
    expect(restored?.meta.id).toBe(sim.universe.meta.id);
  });

  it('says which world date the backup sits at, so restoring is not a blind step', async () => {
    const sim = quickSave({ wealth: 'inherited' }, 'backup-dated');
    const adapter = new LocalSaveAdapter();
    const slot = sim.universe.meta.slot;
    sim.universe.meta.worldDateLabel = 'March 2, 2026';
    await adapter.save(sim.universe);

    // A year on, saving again pushes the older state into the backup.
    sim.advanceTo(sim.now + 365 * 86_400_000);
    sim.universe.meta.worldDateLabel = 'March 2, 2027';
    await adapter.save(sim.universe);

    const info = (await adapter.listSlots()).find((s) => s.slot === slot)!;
    expect(info.meta?.worldDateLabel).toBe('March 2, 2027');
    expect(info.hasBackup).toBe(true);
    expect(info.backupDateLabel).toBe('March 2, 2026');
  });

  it('does not offer a restore from a backup that cannot be read either', async () => {
    const adapter = new LocalSaveAdapter();
    store.setItem('slate.save.1', 'this is not a universe');
    store.setItem('slate.backup.1', 'nor is this');

    const info = (await adapter.listSlots()).find((s) => s.slot === 1)!;
    expect(info.occupied).toBe(true);
    expect(info.error).toBe('That save file is damaged and can’t be read.');
    // The button is drawn from hasBackup. A backup that will not open is not one.
    expect(info.hasBackup).toBe(false);
    expect(info.backupDateLabel).toBeUndefined();
  });

  it('reports no backup when a damaged slot had none, rather than offering a restore that fails', async () => {
    const adapter = new LocalSaveAdapter();
    store.setItem('slate.save.1', 'this is not a universe');

    await adapter.remove(1);

    const slots = await adapter.listSlots();
    const emptied = slots.find((s) => s.slot === 1)!;
    expect(emptied.occupied).toBe(false);
    expect(emptied.hasBackup).toBe(false);
    expect(await adapter.restoreBackup(1)).toBeNull();
  });
});

describe('opening a slot', () => {
  let store: MemoryStorage;
  beforeEach(() => {
    store = new MemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true, writable: true });
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage');
  });
  const DAY = 86_400_000;

  it('restores a backup from an older build without losing the newer save it set aside', async () => {
    const adapter = new LocalSaveAdapter();
    const sim = quickSave({}, 'restore-older');
    const slot = sim.universe.meta.slot;
    sim.universe.meta.schemaVersion = 83;
    await adapter.save(sim.universe);
    const older = sim.universe.now;
    sim.advanceTo(sim.now + 10 * DAY);
    await adapter.save(sim.universe);
    const newer = sim.universe.now;

    const opened = await openSlot(adapter, slot, { fromBackup: true });
    if ('error' in opened) throw new Error(opened.error);
    expect(opened.universe.now).toBe(older);
    expect(opened.universe.meta.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    // The newer save is still in the slot's backup, where restoring put it.
    expect((await adapter.restoreBackup(slot))!.now).toBe(newer);
  });

  it('opens a current save without writing it again', async () => {
    const adapter = new LocalSaveAdapter();
    const sim = quickSave({}, 'current');
    const slot = sim.universe.meta.slot;
    await adapter.save(sim.universe);
    const stored = store.getItem(`slate.save.${slot}`);

    const opened = await openSlot(adapter, slot);
    if ('error' in opened) throw new Error(opened.error);
    expect(opened.migration.migrated).toBe(false);
    expect(store.getItem(`slate.save.${slot}`)).toBe(stored);
    expect(store.getItem(`slate.backup.${slot}`)).toBeNull();
  });

  it('refuses a save from a newer build', async () => {
    const adapter = new LocalSaveAdapter();
    const sim = quickSave({}, 'newer');
    sim.universe.meta.schemaVersion = SAVE_SCHEMA_VERSION + 1;
    await adapter.save(sim.universe);
    const opened = await openSlot(adapter, sim.universe.meta.slot);
    expect('error' in opened && opened.error).toMatch(/newer version of SLATE/);
  });
});

describe('where saves are kept', () => {
  /** A store in memory, standing in for IndexedDB. */
  const memoryStore = () => {
    const map = new Map<string, string>();
    return { map, store: { getItem: async (k: string) => map.get(k) ?? null, setItem: async (k: string, v: string) => { map.set(k, v); }, removeItem: async (k: string) => { map.delete(k); } } };
  };
  let legacy: MemoryStorage;
  beforeEach(() => {
    legacy = new MemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', { value: legacy, configurable: true, writable: true });
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage');
  });

  it('moves a save still in local storage across the first time it is read, and keeps new saves out of local storage', async () => {
    // Until 2026-09-28 saves lived in local storage, where two long lives no longer fit.
    const old = new LocalSaveAdapter(LOCAL_STORE);
    await old.save(quickSave({}, 'moving').universe);
    expect(legacy.getItem('slate.save.1')).not.toBeNull();
    const primary = memoryStore();
    const adapter = new LocalSaveAdapter(movingStore(primary.store, LOCAL_STORE));
    const loaded = await adapter.load(1);
    expect(loaded?.meta.slot).toBe(1);
    expect(primary.map.has('slate.save.1')).toBe(true);
    expect(legacy.getItem('slate.save.1')).toBeNull();
    await adapter.save(loaded!);
    expect(legacy.getItem('slate.save.1')).toBeNull();
    expect(primary.map.has('slate.backup.1')).toBe(true);
    await adapter.remove(1);
    expect(primary.map.has('slate.save.1')).toBe(false);
  });
});
