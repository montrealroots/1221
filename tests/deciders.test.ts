/**
 * Every decider, asked whether it is deciding anything.
 *
 * This is the falsifiability test from `docs/DEPTH.md`, run automatically:
 * move one declared input from one end of its range to the other, and see
 * whether the outcome ever changes. A decider that names an input and then
 * ignores it fails here, and so does one that ignores all of them, which is
 * the shape a hidden roll with prose on top actually has.
 *
 * There is nothing to write weakly. The sweep is generic, so the only way to
 * pass is for the inputs to matter.
 */

import { describe, expect, it } from 'vitest';
import { deciders, sweepOne } from '@/engine/core/deciders';
import '@/engine/decided';

const ALL = deciders();

describe('the deciders', () => {
  it('has some', () => {
    // Not a formality. A build with an empty registry and a career system in
    // it would mean the career system decides nothing, or decides it
    // somewhere nothing is looking.
    expect(ALL.length).toBeGreaterThan(0);
  });

  it('says what each one decides, in words', () => {
    for (const d of ALL) {
      expect(d.id, 'a decider with no id').toMatch(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/);
      expect(d.decides.split(/\s+/).length, `${d.id} does not say what it decides`).toBeGreaterThan(3);
      expect(d.drawnIn, `${d.id} does not say which file it accounts for`).toMatch(/^src\/engine\/.+\.ts$/);
    }
  });
});

for (const decider of ALL) {
  describe(`${decider.id} — ${decider.decides}`, () => {
    for (const reads of Object.keys(decider.reads)) {
      it(`is actually changed by ${reads}`, () => {
        const sweep = sweepOne(decider, reads);
        expect(
          sweep.inert,
          `${decider.id} says it reads '${reads}', but sweeping it end to end across six worlds `
          + `never once changed the outcome. Either it does not read it, or the sweep is too narrow `
          + `to reach anything. Both are worth knowing.`,
        ).toBe(false);
      });
    }

    it('does not answer the same thing whatever it is given', () => {
      // The one every slot machine fails: across every input at once, is
      // there more than one possible answer?
      const everything = new Set<string>();
      for (const reads of Object.keys(decider.reads)) {
        for (const outcome of sweepOne(decider, reads).outcomes) everything.add(outcome);
      }
      expect(everything.size, `${decider.id} only ever returns one answer`).toBeGreaterThan(1);
    });
  });
}
