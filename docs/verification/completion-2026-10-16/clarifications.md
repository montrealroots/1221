# Brief 11: Criterion Clarifications, 2026-10-17

Each is written and committed before the test it touches changes (`prompts/common.md`): the criterion, the approved
behavior it maps to, quoted from the brief or decision that approved it, the clarification, and the earlier result kept.
A clarification here makes a criterion read what the approved design asks; none is made because the new reading passes.

## Acting (ST6-R)

### A1. ST6-R (g)'s first item is read against (b′), with (b) kept as written

**Rows:** `ST6-R.g`, `ST6-R.bPrime` (the baseline's Decision Required, "whether (b′) replaces (b)").

**The criterion** (`../decisions-2026-10-16/criteria.md`, ST6-R):

- (b) "Restraint's own craft pays. On at least 90% of all materials where both sides fit, the restrained specialist's
  lift over the even actor (the same side for each) is larger playing restrained than playing expansive. This is what
  fails when restraint is useless: if choosing it drew on nothing, the lift would be the same either way."
- (g) "Run in a copy against each of these, it fails: restraint's draws removed (b); …"

**The approved behavior it maps to:**

- Brief 10, ST6, the owner's: "A revised test must still catch a system where restraint is effectively useless."
- Brief 11, section 8: "Ensure tests detect when restraint's own relevant abilities cease to matter." and "Do not declare
  all of ST6 resolved because one replacement subclause passes."

**Why (b) as written contradicts it, measured.** With restraint's draws removed in a copy
(`APPROACH_EFFECT.restrained.inputs` set to nothing, the mutation `st6-no-draws`), (b) still holds on 96 of 96: expansive's
draws read this specialist's weakest abilities (presence, the voice, the body at 40.56), so its lift playing expansive is
lower whatever restraint draws. The rationale (b) gives for itself, "if choosing it drew on nothing, the lift would be the
same either way", doesn't hold on this engine, and (g) can't be met through (b).

**The clarification.** (b) stays as written, measured and reported (96 of 96, met). (g)'s first item is read against
**(b′)**, the comparison (b)'s own rationale describes: on at least 90% of the materials where both sides fit ((b)'s
floor), the restrained specialist's lift over the even actor, both playing restrained, is more than 0.05 larger with
restraint's draws than with them taken out. It's read because it's the one of the two that fails when restraint draws on
nothing, measured; that it passes on the engine isn't the reason.

**The earlier result, kept** (`../decisions-2026-10-16/integrated/after/st6.json` and `mutations.json`; again on this
clone's commit in `acting/`):

| | On the engine | Restraint's draws removed |
|---|---|---|
| (b) as written | 96 of 96 | 96 of 96: survives |
| (b′) | 96 of 96, the draws' part 0.329 at least | 0 of 96: killed |

**What this doesn't settle.** ST6-R (a), (c) and (e), and (g)'s second and third items, are a decision, put with its
evidence in `acting-result.json`. (b′) passing doesn't resolve ST6.

**The test.** `tests/decisions-judge.test.ts`, "restraint's own craft pays: …", already held (b′) on every material, more
strictly (the draws' part over 0.3); its title and assertions are unchanged.

### A2. How (g) reads "it fails": against a clause that holds without the mutation

**Row:** `ST6-R.g`.

**The criterion:** (g) "Run in a copy against each of these, it fails: restraint's draws removed (b); restrained
suitability forced to its least on every material (a or c); the grain removed (c or d)."

**The approved behavior it maps to:** brief 10, ST6, "A revised test must still catch a system where restraint is
effectively useless"; criteria.md's own "It catches what it should".

**The clarification.** A mutation is caught where a clause, or a named part of one, that holds on the engine fails with
the mutation in place. A clause that fails on the engine can't tell the mutated engine from the real one, so its
failing under a mutation catches nothing. This is a stricter reading than brief 10's record, never a looser one, and it
changes no test.

**The earlier result, kept.** Brief 10's `mutations.json` recorded `st6-least` and `st6-no-grain` as killed, beside the
note that (a) and (c) fail unmutated. Read this way, measured again on this clone's commit (`acting/mutations-st6.json`):
restrained suitability forced to its least turns (c) from failing to met; the grain removed turns (a) from failing to met.
Neither is caught by the clauses (g) names.
