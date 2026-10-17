/** The rendered-text check's rules, as `tools/text-render-check.mjs` exports them (from 2026-10-17). */
export const ALLOWED: readonly (readonly [RegExp, string])[];
export const CHECKS: readonly (readonly [string, RegExp])[];
export function strip(text: string): string;
export function unbalanced(text: string): boolean;
export function faultsIn(text: string): string[];
