/**
 * The Base44 adapter, against a stand-in for the platform.
 *
 * The point of this file is the calling convention, because that is the part
 * that is easy to get wrong and impossible to notice locally: backend
 * functions are reached through `invoke(name, payload)` rather than as
 * properties, the function's JSON arrives on `.data` rather than at the top
 * level, and a non-2xx reply is thrown rather than returned, with the body on
 * `error.response.data`. An adapter that gets any of those wrong looks fine in
 * development — where there is no Base44 client at all — and fails on the
 * first real save.
 *
 * The double here mirrors that shape exactly. It is not the platform, and it
 * cannot prove the platform behaves as documented; it does prove the adapter
 * speaks the documented protocol rather than one of its own invention.
 */

import { describe, expect, it, beforeAll, beforeEach } from 'vitest';
import { quickSave } from '@/engine';
import { Base44SaveAdapter, type Base44Client, type FunctionReply } from '@/engine/persistence/base44';
import { PersistenceError, serialise } from '@/engine/persistence/adapter';

/**
 * The local mirror needs somewhere to write. Node has no localStorage, so
 * this is the smallest thing that behaves like one.
 */
function installLocalStorage(): void {
  if ('localStorage' in globalThis) return;
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, String(value)); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() { return store.size; },
    },
  });
}

/** An error shaped the way a thrown non-2xx arrives. */
function httpError(status: number, body: unknown) {
  const error = new Error(`Request failed with status code ${status}`) as Error & {
    response?: { status: number; data: unknown };
  };
  error.response = { status, data: body };
  return error;
}

interface Call { name: string; payload: Record<string, unknown> | undefined }

/** A stand-in for the injected client, with `invoke` semantics. */
function fakeClient(handler: (name: string, payload?: Record<string, unknown>) => FunctionReply | undefined) {
  const calls: Call[] = [];
  const client: Base44Client = {
    entities: { SlateSave: undefined as never },
    functions: {
      invoke: async (name: string, payload?: Record<string, unknown>) => {
        calls.push({ name, payload });
        // The platform resolves with the whole HTTP response.
        return { data: handler(name, payload), status: 200, headers: {} };
      },
    },
  };
  return { calls, client };
}

describe('talking to the backend functions', () => {
  let universe: ReturnType<typeof quickSave>['universe'];

  beforeAll(() => { installLocalStorage(); });

  beforeEach(() => {
    universe = quickSave({ wealth: 'comfortable' }, 'adapter').universe;
  });

  it('calls functions by name through invoke, not as properties', async () => {
    const { client, calls } = fakeClient((name) => {
      if (name === 'saveUniverse') return { ok: true, slot: 1, backupAvailable: false };
      return { ok: true };
    });
    const adapter = new Base44SaveAdapter(client);

    await adapter.save(universe);
    expect(calls.map((c) => c.name)).toEqual(['saveUniverse']);
    expect(calls[0]!.payload).toMatchObject({ slot: universe.meta.slot });
    expect(typeof calls[0]!.payload!['payload']).toBe('string');
  });

  it('sends an idempotency key so a retried save writes once', async () => {
    const { client, calls } = fakeClient(() => ({ ok: true, backupAvailable: false }));
    const adapter = new Base44SaveAdapter(client);

    await adapter.save(universe);
    await adapter.save(universe);

    const keys = calls.map((c) => c.payload!['idempotencyKey']);
    expect(keys[0], 'no idempotency key was sent').toBeTruthy();
    expect(keys[1], 'the same unchanged save sent a different key').toBe(keys[0]);
  });

  it('writes a save brought forward, though its clock and playtime did not move', async () => {
    const { client, calls } = fakeClient(() => ({ ok: true, backupAvailable: false }));
    const adapter = new Base44SaveAdapter(client);

    universe.meta.schemaVersion = 83;
    await adapter.save(universe);
    universe.meta.schemaVersion = 87;
    await adapter.save(universe);

    const keys = calls.map((c) => c.payload!['idempotencyKey']);
    expect(keys[1], 'the migrated save reused the key of the write before it').not.toBe(keys[0]);
  });

  it('reads the reply off .data rather than the response object', async () => {
    const payload = serialise(universe);
    const { client } = fakeClient((name) => {
      expect(name).toBe('loadUniverse');
      return { ok: true, slot: 1, payload };
    });
    const adapter = new Base44SaveAdapter(client);

    const loaded = await adapter.load(1);
    expect(loaded, 'the payload was not unwrapped from .data').not.toBeNull();
    expect(loaded!.meta.id).toBe(universe.meta.id);
  });

  it('surfaces the server’s own words when a call is refused', async () => {
    const { client } = fakeClient(() => {
      throw httpError(409, {
        ok: false,
        status: 409,
        error: 'That save is older than the one already stored — its world clock is behind.',
      });
    });
    const adapter = new Base44SaveAdapter(client);

    await expect(adapter.save(universe)).rejects.toThrow(/world clock is behind/);
  });

  it('marks a conflict or a server fault retryable, and a refusal not', async () => {
    const attempt = async (status: number) => {
      const { client } = fakeClient(() => {
        throw httpError(status, { ok: false, status, error: 'nope' });
      });
      try {
        await new Base44SaveAdapter(client).load(1);
        return null;
      } catch (error) {
        return error as PersistenceError;
      }
    };

    expect((await attempt(409))?.recoverable, 'a conflict should be worth retrying').toBe(true);
    expect((await attempt(500))?.recoverable, 'a server fault should be worth retrying').toBe(true);
    expect((await attempt(400))?.recoverable, 'a refusal on purpose is not worth retrying').toBe(false);
    expect((await attempt(401))?.recoverable, 'being signed out is not fixed by retrying').toBe(false);
  });

  it('says something useful when the connection simply fails', async () => {
    const { client } = fakeClient(() => { throw new Error('Network Error'); });
    const adapter = new Base44SaveAdapter(client);
    await expect(adapter.load(1)).rejects.toThrow(/could(n’t| not) reach the server/);
  });

  it('does not mistake an empty reply for an empty slot', async () => {
    const { client } = fakeClient(() => undefined);
    const adapter = new Base44SaveAdapter(client);
    await expect(adapter.load(1)).rejects.toThrow(/came back empty/);
  });

  it('reads all three slots from one call when asked to list them', async () => {
    const { client, calls } = fakeClient(() => ({
      ok: true,
      slots: [
        { slot: 1, occupied: true, hasBackup: true, saveId: 'u1', characterName: 'Ana', playtimeSeconds: 90 },
        { slot: 2, occupied: false, hasBackup: false },
        { slot: 3, occupied: false, hasBackup: false },
      ],
    }));
    const adapter = new Base44SaveAdapter(client);

    const slots = await adapter.listSlots();
    expect(calls).toHaveLength(1);
    expect(slots.map((s) => s.slot)).toEqual([1, 2, 3]);
    expect(slots[0]!.occupied).toBe(true);
    expect(slots[0]!.meta?.characterName).toBe('Ana');
    expect(slots[1]!.occupied).toBe(false);
  });

  it('keeps a local copy of every remote write, so a dropped connection costs nothing', async () => {
    const { client } = fakeClient(() => { throw httpError(503, { ok: false, status: 503, error: 'upstream is down' }); });
    const adapter = new Base44SaveAdapter(client);

    await expect(adapter.save(universe)).rejects.toThrow(/upstream is down/);

    // The remote write failed, but the save is not lost.
    const local = await adapter['fallback'].load(universe.meta.slot);
    expect(local, 'nothing was mirrored locally').not.toBeNull();
    expect(local!.meta.id).toBe(universe.meta.id);
  });

  it('falls back to local storage when the platform is not there at all', async () => {
    const adapter = new Base44SaveAdapter(null);
    await adapter.save(universe);
    const loaded = await adapter.load(universe.meta.slot);
    expect(loaded?.meta.id).toBe(universe.meta.id);
  });
});
