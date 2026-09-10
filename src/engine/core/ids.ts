/**
 * SLATE — Deterministic identifier generation.
 *
 * Ids must be deterministic so that replaying the same command sequence against
 * the same seed reproduces a byte-identical universe. We therefore never use
 * crypto.randomUUID() for world entities; ids are derived from a per-save
 * monotonic counter that lives inside the save itself.
 */

export type Id = string;

/** Collections are namespaced so an id is self-describing in logs and audits. */
export type IdNamespace =
  | 'save' | 'person' | 'household' | 'account' | 'txn' | 'posting' | 'bill' | 'rx'
  | 'job' | 'shift' | 'application' | 'employer'
  | 'rel' | 'relmem' | 'bond' | 'event' | 'sched' | 'cal'
  | 'company' | 'reg' | 'sign' | 'policy' | 'hold' | 'post' | 'project'
  | 'prop' | 'listing' | 'offer' | 'build' | 'room' | 'furn'
  | 'stage' | 'booking'
  | 'veh' | 'vehmod' | 'service' | 'part'
  | 'trip' | 'flight' | 'stay'
  | 'trade' | 'deal' | 'wave' | 'press'
  | 'acct' | 'post' | 'deal' | 'campaign'
  | 'proj' | 'script' | 'draft' | 'role' | 'audition' | 'contract' | 'rights'
  | 'shootday' | 'posttask' | 'release' | 'award' | 'nom'
  | 'company' | 'division' | 'employee' | 'equip' | 'franchise' | 'merch'
  | 'order' | 'item' | 'asset' | 'policy' | 'claim' | 'appt' | 'provider'
  | 'course' | 'history' | 'audit' | 'notice' | 'decision' | 'idem'
  | 'scene' | 'fact' | 'membership' | 'workout' | 'plan' | 'deal' | 'date' | 'berth'
  | 'statement' | 'standing' | 'dining' | 'retail' | 'worn' | 'commission' | 'costume'
  | 'chan' | 'vid' | 'vcom' | 'vsub' | 'watch'
  | 'vlist' | 'stream' | 'cpost' | 'member' | 'payout' | 'vnotice' | 'profile' | 'sitem' | 'follow' | 'sroom' | 'hire' | 'shoot' | 'film' | 'screening' | 'submission' | 'ticket' | 'invite' | 'seat' | 'parcel' | 'school' | 'part' | 'uniapp' | 'degree' | 'season' | 'running' | 'meet' | 'growing' | 'firstjob' | 'sitting' | 'report' | 'training' | 'plan' | 'recall';

const COUNTER_KEY = '__idCounter';

export interface IdCounterHost {
  [COUNTER_KEY]: number;
}

/**
 * Creates an id factory bound to a mutable counter host (the save universe).
 * Ids look like `veh_0042` — sortable, readable, and reproducible.
 */
export function createIdFactory(host: IdCounterHost) {
  return function nextId(ns: IdNamespace): Id {
    host[COUNTER_KEY] += 1;
    return `${ns}_${host[COUNTER_KEY].toString(36).padStart(6, '0')}`;
  };
}

/** Stable, non-cryptographic 32-bit string hash (FNV-1a). Used for seeding. */
export function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Human-facing short code, e.g. for save slots or invoice numbers. */
export function shortCode(seed: string, length = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let h = hash32(seed);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[h % alphabet.length] ?? 'X';
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
  }
  return out;
}
