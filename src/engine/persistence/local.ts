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

/**
 * A save is gzipped before it goes into local storage, because a universe
 * that has run for a year is several megabytes of JSON and a browser gives
 * an origin about five. The packed form is marked so an older, plain save
 * still loads; the marker is not valid JSON, so the two cannot be confused.
 */
const PACKED = 'slate.gz1:';

function canPack(): boolean {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function pack(json: string): Promise<string> {
  if (!canPack()) return json;
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  return PACKED + toBase64(bytes);
}

async function unpack(raw: string): Promise<string> {
  if (!raw.startsWith(PACKED)) return raw;
  if (!canPack()) throw new PersistenceError('This save is packed and this browser can’t unpack it. Open it in a current browser.', false);
  const bytes = fromBase64(raw.slice(PACKED.length));
  const stream = new Blob([bytes as unknown as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

function storage(): Storage {
  if (typeof localStorage === 'undefined') {
    throw new PersistenceError('This browser has no local storage available, so saves can’t be kept here.', false);
  }
  return localStorage;
}

export class LocalSaveAdapter implements SaveAdapter {
  readonly name = 'This Device';
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
      // A backup is only a backup if it can be read. Advertising one that
      // cannot puts a button on the card that fails when it is pressed.
      const backup = await this.readBackup(store, slot);
      const hasBackup = backup !== null;
      const backupDateLabel = backup?.meta.worldDateLabel || undefined;
      if (!raw) {
        slots.push({ slot, occupied: false, hasBackup, backupDateLabel });
        continue;
      }
      try {
        const universe = deserialise(await unpack(raw));
        slots.push({ slot, occupied: true, meta: universe.meta, hasBackup, backupDateLabel, bytes: raw.length });
      } catch (error) {
        slots.push({
          slot, occupied: true, hasBackup, backupDateLabel, bytes: raw.length,
          error: (error as Error).message,
        });
      }
    }
    return slots;
  }

  async load(slot: Slot): Promise<SaveUniverse | null> {
    const raw = storage().getItem(KEY(slot));
    if (!raw) return null;
    return deserialise(await unpack(raw));
  }

  async save(universe: SaveUniverse): Promise<void> {
    const store = storage();
    const slot = universe.meta.slot;
    const previous = store.getItem(KEY(slot));
    const next = await pack(serialise(universe));

    try {
      // Back up what is already there before overwriting it.
      if (previous) {
        store.setItem(BACKUP_KEY(slot), previous);
      }
      store.setItem(KEY(slot), next);
    } catch (error) {
      const message = (error as Error).name === 'QuotaExceededError'
        ? 'There isn’t enough storage space left on this device to save. Free some space, or delete a save you no longer want.'
        : `The save couldn’t be written: ${(error as Error).message}`;
      throw new PersistenceError(message, true);
    }
  }

  async remove(slot: Slot): Promise<void> {
    const store = storage();
    const existing = store.getItem(KEY(slot));
    // Deleting keeps a backup, so an accidental delete is recoverable. A save
    // that cannot be read is not worth keeping and must never be written over
    // a backup that can: deleting a corrupt slot is exactly when the older
    // copy is the only thing left.
    if (existing && await this.readable(existing)) {
      store.setItem(BACKUP_KEY(slot), existing);
    }
    store.removeItem(KEY(slot));
  }

  private async readable(raw: string): Promise<boolean> {
    try {
      deserialise(await unpack(raw));
      return true;
    } catch {
      return false;
    }
  }

  private async readBackup(store: Storage, slot: Slot): Promise<SaveUniverse | null> {
    const raw = store.getItem(BACKUP_KEY(slot));
    if (!raw) return null;
    try {
      return deserialise(await unpack(raw));
    } catch {
      return null;
    }
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
    const universe = deserialise(await unpack(raw));
    await this.save(universe);
    return universe;
  }
}
