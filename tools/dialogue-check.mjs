#!/usr/bin/env node
/**
 * The dialogue library, checked and counted.
 *
 * Runs the library's own tests with the report switched on: every id
 * unique and placed, every expectation covered, follow-ups resolving, no
 * normalised duplicates, near-twins reported, and the honest count by
 * section against the 100,001 target. Exit code is the tests'.
 */

import { spawnSync } from 'node:child_process';

const result = spawnSync('npx', ['vitest', 'run', 'tests/dialogue.test.ts'], {
  stdio: 'inherit',
  env: { ...process.env, SLATE_DIALOGUE_REPORT: '1' },
});
process.exit(result.status ?? 1);
