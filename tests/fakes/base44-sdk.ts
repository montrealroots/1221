/**
 * A stand-in for the Base44 SDK, so the real server functions can be run.
 *
 * The four functions in `base44/functions` import the SDK with a Deno style
 * `npm:@base44/sdk` specifier. Vitest aliases that specifier to this file, so
 * the tests execute the actual handler source — the same guards, the same
 * ordering, the same error paths — against an in-memory store instead of a
 * live project.
 *
 * This is not a substitute for deploying. It verifies everything except the
 * network hop and Base44's own row-level security, and the Base44 document
 * says exactly that.
 */

export interface FakeRow extends Record<string, unknown> {
  id: string;
}

interface Collection {
  rows: FakeRow[];
  nextId: number;
}

export interface FakeWorld {
  /** Who the request is from. Null means nobody is signed in. */
  user: { id: string; email: string } | null;
  /** One store per signed-in user, which is how row-level security behaves. */
  stores: Map<string, Record<string, Collection>>;
  /** Every call the handlers made, in order, for assertions about ordering. */
  calls: string[];
}

const COLLECTIONS = ['SlateSave', 'SlateCommandReceipt', 'SlateOfficialResult'] as const;

export const world: FakeWorld = { user: { id: 'u1', email: 'one@example.test' }, stores: new Map(), calls: [] };

/** Wipes the world back to one signed-in user with three empty collections. */
export function resetWorld(userId = 'u1'): void {
  world.user = { id: userId, email: `${userId}@example.test` };
  world.stores = new Map();
  world.calls = [];
}

/** Signs a different person in without emptying anybody's store. */
export function signIn(userId: string): void {
  world.user = { id: userId, email: `${userId}@example.test` };
}

function storeFor(userId: string): Record<string, Collection> {
  let store = world.stores.get(userId);
  if (!store) {
    store = Object.fromEntries(COLLECTIONS.map((c) => [c, { rows: [], nextId: 1 }])) as Record<string, Collection>;
    world.stores.set(userId, store);
  }
  return store;
}

/** The rows one user can see. Used by tests to assert isolation. */
export function rowsFor(userId: string, collection: string): FakeRow[] {
  return storeFor(userId)[collection]!.rows;
}

function matches(row: FakeRow, query: Record<string, unknown>): boolean {
  return Object.entries(query).every(([key, value]) => row[key] === value);
}

function entityApi(userId: string, name: string) {
  const collection = () => storeFor(userId)[name]!;
  return {
    async filter(query: Record<string, unknown>): Promise<FakeRow[]> {
      world.calls.push(`${name}.filter`);
      // Row-level security is Base44's: a query only ever sees this user's rows.
      return collection().rows.filter((r) => matches(r, query));
    },
    async create(data: Record<string, unknown>): Promise<FakeRow> {
      world.calls.push(`${name}.create`);
      const c = collection();
      const row: FakeRow = { ...data, id: `${name.toLowerCase()}-${c.nextId++}` };
      c.rows.push(row);
      return row;
    },
    async update(id: string, data: Record<string, unknown>): Promise<FakeRow> {
      world.calls.push(`${name}.update`);
      const c = collection();
      const row = c.rows.find((r) => r.id === id);
      if (!row) throw new Error(`No ${name} with id ${id}.`);
      Object.assign(row, data);
      return row;
    },
  };
}

/** What the handlers call. The request is ignored; `world.user` decides who it is. */
export function createClientFromRequest(_req: unknown) {
  const user = world.user;
  return {
    auth: {
      async me() {
        world.calls.push('auth.me');
        return user;
      },
    },
    entities: Object.fromEntries(
      COLLECTIONS.map((name) => [name, entityApi(user?.id ?? 'anonymous', name)]),
    ) as Record<(typeof COLLECTIONS)[number], ReturnType<typeof entityApi>>,
  };
}
