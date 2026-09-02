/**
 * SLATE — Reference registry.
 *
 * Reference data is immutable and shared by every save. It is the only thing
 * saves have in common; nothing here is ever mutated by gameplay.
 *
 * Honesty rule: every record declares where it came from. Geography is real
 * public reference data. Market figures, company behaviour, prices and specs
 * are SIMULATED and say so, because presenting an invented 2027 box-office
 * result or an invented lease rate as verified fact would be a lie the player
 * cannot detect.
 */

export type Provenance =
  /** Widely published, stable public fact (a city is in a country; an airport code). */
  | 'public_reference'
  /** Real entity, but the specific figures here are SLATE's own calibration. */
  | 'calibrated_estimate'
  /** Entirely invented by SLATE for the simulation. */
  | 'simulated';

export type Confidence = 'high' | 'medium' | 'low';

export interface ReferenceRecord {
  id: string;
  name: string;
  aliases?: string[];
  type: string;
  /** Owning entity, where one exists. */
  parentId?: string;
  source: Provenance;
  confidence: Confidence;
  /** Data set version, bumped when values change. */
  version: string;
  /** When this record starts and stops being valid in world time. */
  effectiveFrom?: string;
  effectiveTo?: string;
  /** Free note explaining the provenance decision. */
  note?: string;
}

export const REFERENCE_VERSION = '1.0.0';

/**
 * A typed, indexed collection of reference records. Lookups are O(1) and the
 * data is frozen, so no system can corrupt shared reference state.
 */
export class Registry<T extends ReferenceRecord> {
  private byId: Map<string, T>;
  private byType: Map<string, T[]>;
  private byParent: Map<string, T[]>;
  private aliasIndex: Map<string, T>;

  constructor(public readonly name: string, records: readonly T[]) {
    this.byId = new Map();
    this.byType = new Map();
    this.byParent = new Map();
    this.aliasIndex = new Map();
    for (const raw of records) {
      const record = Object.freeze(raw);
      if (this.byId.has(record.id)) {
        throw new Error(`Registry '${name}' has a duplicate id: ${record.id}`);
      }
      this.byId.set(record.id, record);
      pushInto(this.byType, record.type, record);
      if (record.parentId) pushInto(this.byParent, record.parentId, record);
      this.aliasIndex.set(normalise(record.name), record);
      for (const alias of record.aliases ?? []) this.aliasIndex.set(normalise(alias), record);
    }
  }

  get(id: string): T | undefined {
    return this.byId.get(id);
  }

  require(id: string): T {
    const found = this.byId.get(id);
    if (!found) throw new Error(`Registry '${this.name}' has no record '${id}'.`);
    return found;
  }

  all(): T[] {
    return [...this.byId.values()];
  }

  ofType(type: string): T[] {
    return this.byType.get(type) ?? [];
  }

  childrenOf(parentId: string): T[] {
    return this.byParent.get(parentId) ?? [];
  }

  /** Exact match on name or alias, case and punctuation insensitive. */
  byName(name: string): T | undefined {
    return this.aliasIndex.get(normalise(name));
  }

  /** Ranked fuzzy search used by Go Anywhere. */
  search(query: string, limit = 12): T[] {
    const q = normalise(query);
    if (!q) return [];
    const scored: { record: T; score: number }[] = [];
    for (const record of this.byId.values()) {
      const score = scoreMatch(q, record);
      if (score > 0) scored.push({ record, score });
    }
    scored.sort((a, b) => b.score - a.score || a.record.name.localeCompare(b.record.name));
    return scored.slice(0, limit).map((s) => s.record);
  }

  get size(): number {
    return this.byId.size;
  }
}

function pushInto<T>(map: Map<string, T[]>, key: string, value: T): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

export function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Shared scoring so search feels the same everywhere in SLATE. */
export function scoreMatch(normalisedQuery: string, record: { name: string; aliases?: string[]; type: string }): number {
  const candidates = [record.name, ...(record.aliases ?? [])];
  let best = 0;
  for (const candidate of candidates) {
    const n = normalise(candidate);
    if (n === normalisedQuery) best = Math.max(best, 100);
    else if (n.startsWith(normalisedQuery)) best = Math.max(best, 80);
    else if (n.includes(normalisedQuery)) best = Math.max(best, 60);
    else if (wordsStartWith(n, normalisedQuery)) best = Math.max(best, 50);
  }
  if (best === 0 && normalise(record.type).includes(normalisedQuery)) best = 25;
  return best;
}

function wordsStartWith(haystack: string, needle: string): boolean {
  return haystack.split(' ').some((w) => w.startsWith(needle));
}
