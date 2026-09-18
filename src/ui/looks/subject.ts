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
 * `refType` and `refId` are declared on five record shapes — a decision, a
 * notification, a ledger transaction, a scheduled item and a calendar entry —
 * and this resolves the two the interface asks it about. The engine writes a
 * literal `refType` in fifty-two places:
 * forty-two `'project'`, nine `'audition'` and one `'property'`. Forty-one of
 * the project ones are notifications and transactions about a picture; the
 * forty-second is the reimbursement row the Decision Center raises, which is
 * what made this comment worth rewriting, because it is the first decision in
 * the build that carries an address at all.
 *
 * Forty-two of the fifty-two resolve. The other ten do not, and it is the kind
 * and not the id that is missing: there is no `'audition'` look and no
 * `'property'` look — the registry has `house` and `estate`, which are the same
 * things under different names, and `person`, `project`, `role`, `rebate`,
 * `lot` and the rest. So nine of the career’s own notifications and the one the
 * lot writes about a stage point at a kind nothing has ever declared.
 *
 * This still returns undefined rather than inventing an address, and every
 * caller guards on `lookExists` before painting a way, so a kind with no look
 * paints nothing rather than a dead link. Declaring an `'audition'` look is
 * what would make those nine open onto the room they are about.
 */
export function subjectForRef(ref: { refType?: string; refId?: string }): Subject | undefined {
  if (!ref.refType || !ref.refId) return undefined;
  return at(ref.refType, ref.refId);
}
