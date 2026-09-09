/**
 * A short Monte Carlo run inside the gate.
 *
 * The full harness (tools/monte-carlo.mjs) plays dozens of lives for a year
 * each and takes half an hour. This plays a handful for a few weeks, on a fixed
 * seed, so that a command which starts throwing, a ledger that stops
 * balancing, or a save that no longer survives a round trip is caught before
 * it ships rather than found by a player.
 */
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';

describe('a few random lives', () => {
  it('play out without a single throw, missed event, ledger fault or bad number', () => {
    let out = '';
    try {
      out = execFileSync('npx', ['vite-node', 'tools/monte-carlo.mjs', '--lives', '4', '--days', '21', '--seed', 'gate'], {
        encoding: 'utf8', timeout: 240_000, stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      const failed = err as { stdout?: string; stderr?: string };
      throw new Error(`${failed.stdout ?? ''}\n${failed.stderr ?? ''}`);
    }
    expect(out).toMatch(/No bugs\. Every invariant held/);
  }, 300_000);
});
