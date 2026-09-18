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
import { deciders, sweepOne, sweepDirection } from '@/engine/core/deciders';
import '@/engine/decided';

const ALL = deciders();

describe('the deciders', () => {
  it('has some', () => {
    // Not a formality. A build with an empty registry and a career system in
    // it would mean the career system decides nothing, or decides it
    // somewhere nothing is looking.
    expect(ALL.length).toBeGreaterThan(0);
  });

  it('declares which way its inputs push, on every decision that has a scale', () => {
    // A floor rather than a target, and it only goes up. `sweepOne` proves an
    // input changes the answer and cannot prove it changes it the right way, so a
    // decider with no declared direction is a decider where an inverted sign would
    // still pass. The first six declarations found one: `making.slip` read its
    // schedule figure backwards, in a field called `tightness` whose value was
    // actually slack, with a docstring that said the opposite of what the number
    // did.
    //
    // Not every decision has a scale. `casting.wants` answers with the shape of a
    // part and `casting.board` with who happens to be around, and neither has a
    // worse or better end. So this counts declarations rather than demanding one
    // from everybody — and when a decider gains a ladder, this number rises with
    // it and never falls.
    const declared = ALL.flatMap((d) => Object.keys(d.rises ?? {}));
    const withLadder = ALL.filter((d) => d.ladder !== undefined);
    expect(declared.length, 'fewer declared directions than there were').toBeGreaterThanOrEqual(15);
    expect(withLadder.length, 'fewer deciders with a ladder than there were').toBeGreaterThanOrEqual(6);
    // A ladder nothing pushes along is decoration, and so is a direction with no
    // ladder to push along. Both are caught here rather than at the sweep.
    for (const d of ALL) {
      if (d.ladder !== undefined) {
        expect(Object.keys(d.rises ?? {}).length, `${d.id} has a ladder and no direction to push along it`)
          .toBeGreaterThan(0);
        expect(new Set(d.ladder).size, `${d.id} has a ladder with a repeated rung`).toBe(d.ladder.length);
      }
      for (const reads of Object.keys(d.rises ?? {})) {
        expect(d.ladder, `${d.id} says '${reads}' pushes somewhere and declares no ladder`).toBeDefined();
        expect(d.reads[reads], `${d.id} declares a direction for '${reads}', which it does not read`).toBeDefined();
      }
    }
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
          `${decider.id} says it reads '${reads}', but sweeping it end to end inside each of `
          + `${sweep.samples} worlds, with everything else held still, never once changed the `
          + `outcome. Either it does not read it, or the sweep is too narrow to reach anything. `
          + `Both are worth knowing.`,
        ).toBe(false);
      });
    }

    for (const reads of Object.keys(decider.rises ?? {})) {
      it(`moves ${reads} the way it says it does`, () => {
        // The hole every other check in this file leaves open. `sweepOne` proves
        // the input changes the answer; nothing proved it changes it the right
        // way, so inverting a sign anywhere in `decided.ts` passed the whole
        // build. A decider that declares a direction is asked to hold it.
        const went = sweepDirection(decider, reads);
        expect(
          went.backwards,
          `${decider.id} says '${reads}' pushes ${went.declared} along its ladder, and across `
          + `${went.agreed + went.against + went.flat} worlds it went the other way ${went.against} `
          + `times against ${went.agreed}. Either the direction declared is wrong or the model is.`,
        ).toBe(false);
        expect(
          went.agreed,
          `${decider.id} declares a direction for '${reads}' that no world could show: `
          + `${went.flat} of ${went.agreed + went.against + went.flat} never moved off one rung. `
          + `A direction nothing can demonstrate is not a claim, it is decoration.`,
        ).toBeGreaterThan(0);
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
