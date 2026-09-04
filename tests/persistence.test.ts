/**
 * Saves on this device are packed, and a save from before packing still loads.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { LocalSaveAdapter } from '@/engine/persistence/local';
import { serialise } from '@/engine/persistence/adapter';

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
    const sim = quickSave({ wealth: 'inherited' }, 'pack-1');
    sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
    const staged = sim.execute({ kind: 'sandbox.stage_picture', payload: { to: 'post' } });
    expect(staged.ok, staged.error).toBe(true);
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
