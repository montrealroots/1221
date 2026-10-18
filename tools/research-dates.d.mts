/** The research's dates written the game's way, as `tools/research-dates.mjs` exports them (from 2026-10-17). */
export function gameDates(text: string): string;
export function noSpaceBefore(text: string): string;
export const GENERATED: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>>;
export const BY_HAND: readonly (readonly [string, string, string, string, string, string])[];
export function editFields(data: Record<string, unknown>, paths: readonly string[], edit: (text: string) => string): { key: string; field: string; before: string; after: string }[];
