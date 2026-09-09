/**
 * Types for the server-side guards, so the test suite can exercise them with
 * the same strictness as the rest of the codebase. The implementation is
 * plain JavaScript because it runs on the Base44 backend, not in the bundle.
 */

export declare const SUPPORTED_SCHEMA_VERSION: number;
export declare const MAX_PAYLOAD_BYTES: number;

export declare class GuardError extends Error {
  readonly status: number;
  constructor(message: string, status?: number);
}

/**
 * What the save says it is. SLATE is an actor and actress life simulator, every
 * payload carries the premise, and the server refuses one that does not.
 */
export interface InspectedPremise {
  kind: 'actor-actress-life-simulator';
  statement?: string;
  titles?: readonly ('actor' | 'actress')[];
  equalStanding: true;
  playerTitle: 'actor' | 'actress';
  playerTitleSource?: 'stated' | 'implied';
}

export interface InspectedPayload {
  universe: Record<string, unknown>;
  meta: Record<string, unknown> & { slot?: number; schemaVersion?: number };
  premise: InspectedPremise;
  saveId: string;
  worldNow: number;
  playtimeSeconds: number;
  bytes: number;
}

export interface StoredRow {
  save_id?: string;
  world_now?: number;
  playtime_seconds?: number;
}

export declare function requireSlot(value: unknown): number;
export declare function inspectPayload(payload: unknown, expectedSlot?: number): InspectedPayload;
export declare function requireForwardProgress(existing: StoredRow | null | undefined, incoming: InspectedPayload): void;
export declare function ok<T extends Record<string, unknown>>(data: T): { ok: true } & T;
export declare function failure(error: unknown): { ok: false; status: number; error: string };
