/** The types of `tools/wiring.mjs`, for the test that holds its list (`tests/b20-guide-wiring.test.ts`). */
export interface WiringLine { file: string; label: string; kind: string; payload: string; control?: string; feature?: string; stop?: string }
export const WIRING: string;
export function controls(): WiringLine[];
export function decisionAnswers(): WiringLine[];
export function stopChoices(): WiringLine[];
export function handlerReads(): Map<string, string[] | null>;
export function sentKeys(payload: string): string[] | null;
