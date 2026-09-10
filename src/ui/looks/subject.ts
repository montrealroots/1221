/**
 * SLATE — the address of a thing you can look at.
 *
 * A subject is a kind and an id. The kind says what sort of thing it is and
 * picks the declaration that knows how to open it; the id is opaque to
 * everything except that declaration. `at('dial', 'stress')` is the stress
 * dial; `at('place', 'is-39-reykjavik')` is Reykjavík; `at('person', id)` is
 * somebody.
 *
 * Deliberately not a route. There is no URL in this build — `route` is React
 * state in the game provider and react-router is in package.json and imported
 * nowhere — so a subject addresses a thing in the world, not a location in an
 * application. If routing ever arrives, `?look=` can carry a subject key
 * without any of this changing.
 */

/** A thing you can look at. */
export interface Subject {
  readonly kind: string;
  readonly id: string;
}

/** The short way to write one. An id is optional for things there is only one of. */
export const at = (kind: string, id = ''): Subject => ({ kind, id });

/** One string, for keying React children and comparing two subjects. */
export const subjectKey = (s: Subject): string => (s.id ? `${s.kind}:${s.id}` : s.kind);

export const sameSubject = (a: Subject | null, b: Subject | null): boolean =>
  a !== null && b !== null && a.kind === b.kind && a.id === b.id;

/** Back from a key. Returns undefined rather than a half-made subject. */
export function parseSubject(key: string): Subject | undefined {
  if (!key) return undefined;
  const cut = key.indexOf(':');
  if (cut < 0) return { kind: key, id: '' };
  const kind = key.slice(0, cut);
  return kind ? { kind, id: key.slice(cut + 1) } : undefined;
}

/**
 * The typed pointer five record types carry, resolved into a subject.
 *
 * `refType` and `refId` are declared on decisions, notifications and history
 * records, and there is not one literal `refType` written anywhere in the
 * engine today — every one is pass-through of a caller-supplied value that no
 * caller supplies. So this resolves nothing yet, on purpose, and returns
 * undefined rather than inventing an address. The day something populates
 * them, notifications open onto what they are about and nothing here changes.
 */
export function subjectForRef(ref: { refType?: string; refId?: string }): Subject | undefined {
  if (!ref.refType || !ref.refId) return undefined;
  return at(ref.refType, ref.refId);
}
