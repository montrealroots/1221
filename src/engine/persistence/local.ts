/**
 * SLATE — Browser-local persistence.
 *
 * Used standalone and as the offline fallback. Every write makes a backup of
 * the previous state first, so a failed write or a corrupt save always has
 * something to recover from.
 */

import type { SaveUniverse } from '../domain/model';
import { deserialise, serialise, PersistenceError, type SaveAdapter, type SaveSlotInfo, type Slot } from './adapter';

const KEY = (slot: Slot) => `slate.save.${slot}`;
const BACKUP_KEY = (slot: Slot) => `slate.backup.${slot}`;

function storage(): Storage {
  if (typeof localStorage === 'undefined') {
    throw new PersistenceError('This browser has no local storage available, so saves cannot be kept here.', false);
  }
  return localStorage;
}

export class LocalSaveAdapter implements SaveAdapter {
  readonly name = 'This device';
  readonly serverAuthoritative = false;

  async listSlots(): Promise<SaveSlotInfo[]> {
    const slots: SaveSlotInfo[] = [];
    for (const slot of [1, 2, 3] as Slot[]) {
      let store: Storage;
      try {
        store = storage();
      } catch {
        slots.push({ slot, occupied: false, hasBackup: false, error: 'Local storage is unavailable.' });
        continue;
      }
      const raw = store.getItem(KEY(slot));
      const hasBackup = store.getItem(BACKUP_KEY(slot)) !== null;
      if (!raw) {
        slots.push({ slot, occupied: false, hasBackup });
        continue;
      }
      try {
        const universe = deserialise(raw);
        slots.push({ slot, occupied: true, meta: universe.meta, hasBackup, bytes: raw.length });
      } catch (error) {
        slots.push({
          slot, occupied: true, hasBackup, bytes: raw.length,
          error: `This save could not be read: ${(error as Error).message}`,
        });
      }
    }
    return slots;
  }

  async load(slot: Slot): Promise<SaveUniverse | null> {
    const raw = storage().getItem(KEY(slot));
    if (!raw) return null;
    return deserialise(raw);
  }

  async save(universe: SaveUniverse): Promise<void> {
    const store = storage();
    const slot = universe.meta.slot;
    const previous = store.getItem(KEY(slot));
    const next = serialise(universe);

    try {
      // Back up what is already there before overwriting it.
      if (previous) {
        store.setItem(BACKUP_KEY(slot), previous);
        universe.meta.backupAvailable = true;
      }
      store.setItem(KEY(slot), next);
    } catch (error) {
      const message = (error as Error).name === 'QuotaExceededError'
        ? 'There is not enough storage space left on this device to save. Free some space, or delete a save you no longer want.'
        : `The save could not be written: ${(error as Error).message}`;
      throw new PersistenceError(message, true);
    }
  }

  async remove(slot: Slot): Promise<void> {
    const store = storage();
    const existing = store.getItem(KEY(slot));
    // Deleting keeps a backup, so an accidental delete is recoverable.
    if (existing) store.setItem(BACKUP_KEY(slot), existing);
    store.removeItem(KEY(slot));
  }

  async backup(slot: Slot): Promise<boolean> {
    const store = storage();
    const raw = store.getItem(KEY(slot));
    if (!raw) return false;
    store.setItem(BACKUP_KEY(slot), raw);
    return true;
  }

  async restoreBackup(slot: Slot): Promise<SaveUniverse | null> {
    const raw = storage().getItem(BACKUP_KEY(slot));
    if (!raw) return null;
    const universe = deserialise(raw);
    await this.save(universe);
    return universe;
  }
}
