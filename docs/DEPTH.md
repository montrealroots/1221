# Depth

The standard this game is held to, and how it is checked.

## The Standard

This page used to hold SLATE to one bar: a deeper simulation than *Total
Extreme Wrestling* and *The Movies* combined, with the player as the talent
rather than the buyer. That bar was written for the film career and the family
business, and the revamp took both out, together with the sixteen axes, the
build order and the measured distance between them and the build. The revamp
sets the next bar.

What does not change with it is how any bar is checked. The rest of this page
is that, and all of it is enforced by the gate rather than by good intentions.

## The One Rule

**A declared word with nothing that reads it is worse than no word at all.**

This is first because it is the failure this project is most exposed to. The
cheapest way to fake depth is to declare the vocabulary without building the
systems: a field for every axis, a modifier key for every effect, an id
namespace for every noun. It reads as a deep game to anybody scrolling the
source and it plays as nothing.

It was found here by measurement. When the ledger was first written the build
declared 125 id namespaces and read 17, 54 trait modifier keys and read 7, and
813 acting attributes that nothing read at all. The revamp did not wire them.
It deleted them, which the rule allows and which is often the honest answer.

Writing a number is not wiring it, and a tool that measures writers will say a
thing is finished before it is.

`tools/wired.mjs` walks the declared vocabulary, finds what nothing reads, and
holds the count against `docs/UNWIRED.json`. It does not demand zero — content
written a little ahead of its system is normal — but it forbids the number
going **up**. `--check` fails the gate.

### The Falsifiability Test

Every system has to survive one question, asked the same way each time:

> **Change one input by a little. Does the outcome change, or only the prose?**

If only the sentence explaining the result changes, it is a slot machine with an
essay attached, and the essay is the tell.

**This one is not left to good intentions.** A decider — anything that turns
the state of the world into an outcome the player did not choose — registers in
`src/engine/decided.ts` saying what it decides and every input it reads.
`tests/deciders.test.ts` then sweeps each declared input from one end of its
range to the other across six worlds, and fails if the outcome never moves.
There is no hand-written sensitivity test to write weakly; the sweep is
generic, so the only way to pass is for the inputs to matter.

`tools/deciders.mjs --check` closes the other half: a file in the engine that
gets hold of the random number generator and is owned by no decider fails the
gate. Randomness is where slot machines live, so that is where the rule sits.

One decider is registered today, `weather.day`, because the sky is the only
thing left in the build that decides anything. Whatever the revamp builds next
lands in the same file, and cannot land without proving its inputs matter.

## What Holds It In Place

- `docs/UNBITTEN.md` — the arrears against this page. Everything declared,
  written, displayed or believed that changes no outcome, kept in one list and
  worked a section at a time.
- `tools/wired.mjs --check` — the declared vocabulary against what reads it,
  ratcheted at `docs/UNWIRED.json`. The count may fall. It may not rise.
- `tools/deciders.mjs --check` and `tests/deciders.test.ts` — every draw owned
  by a registered decider, and every decider swept until it proves the inputs
  it named change what it decides.
- `tools/doc-refs.mjs --check` — every file a doc names has to be there, so
  this document cannot start lying the way `docs/STYLE.md` did.
- `tests/cohesion.test.ts` — the "everything is wired to something" suite,
  which proves no schedule handler is dead.
- `tests/looks.test.ts` — crawls the whole drill-down graph, so a reason that
  does not open fails.
