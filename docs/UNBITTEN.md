# What Does Not Bite

A standing list of everything in SLATE that is declared, written, displayed or
believed, and that changes no outcome. It is kept separate from `DEPTH.md`
because that page argues for the standard and this page is the arrears against
it.

The test, which is the project's own: change an input — does the outcome change,
or only the sentence? A thing that fails it is on this page until it passes or
until it is deleted. Both are acceptable endings. Only leaving it alone is not.

Three kinds of failure, and they want different fixes, so they are never mixed:

- **Dead.** Move it across its whole range and nothing observable moves. Either
  wire it or delete it.
- **Unreachable.** The code is correct and general, and nothing in the build can
  reach the input that would exercise it. The fix is usually elsewhere: build
  the thing that would reach it, or assert the contract directly on the function
  and say plainly that no play can get there.
- **Dead by construction.** It reads something that is the same on every person
  in every save. The prodigy constraint is the whole of this category and no
  amount of wiring fixes it; the fix is to decide something else instead.

---

## The count, as the ratchet has it

From `tools/wired.mjs`, held against `docs/UNWIRED.json`. These may fall. They
may not rise.

| Declared | Nothing reads | Of |
|---|---|---|
| Id namespaces | 104 | 125 |
| Trait modifier keys | 47 | 54 |
| Higher-is-worse guards | 6 | 18 |
| Personality axes | 3 | 7 |
| Dials nothing moves | 0 | every field on Reputation and Wellbeing |
| Save tables nothing fills | 0 | 24 |

160 declared words that nothing reads.

The tool counts writers. The One Rule asks for readers, which is stricter, so
the true arrears are larger than this table and the rest of this page is the
part the tool cannot see.

---

## Dead by construction: the prodigy constraint

The player holds all 813 acting attributes at the ceiling
(`src/engine/content/prodigy.ts`, `seedCapability` in
`src/engine/world/bootstrap.ts`). Nineteen attributes are read, as three casting
axes, and every one of those reads happens on somebody who is not the player.

**794 of 813 acting attributes decide nothing.** Forty-five of them are named
for the audition room specifically — `cold_reading`, `taking_a_redirect`,
`nerve_management`, `walking_into_the_room`, `self_tape_craft`. A faithful port
of the research would be forty-five lookups all returning a hundred, which is
why `src/engine/world/audition.ts` deliberately reads no attribute anywhere and
a test enforces that by grepping the file.

This is the largest single entry on this page and it is not a bug. The question
it asks is a design question: what decides a performer's work, on a character
who cannot be bad at it? Everything built for the player so far answers it the
same way — spend calendar, money, other people's minutes or other people's
goodwill. Whether that is the whole answer is undecided.

**3 of 7 personality axes** are in the same position for a different reason:
`agreeableness`, `extraversion` and `riskTolerance` are asked for at character
creation and consulted by nothing. A question with no consequence.

---

## Dead: named, and confirmed

**`prestige`**, one of seven reputation axes, deliberately. Every honest reader
for it is a reader something else already has: put it on the sale and it is
`audienceAppeal` under another name; put it on who gets called and it is
`publicFame`. It is awards-and-critics standing, and there are no awards and no
critics. It stays declared until there are. Inventing a seventh reader to finish
the row would be the disease `DEPTH.md` is about, performed on the page about
the disease.

**47 trait modifier keys** across 445 traits, of which seven are consulted:
`ageCurveShift`, `audienceAppeal`, `audienceVariance`, `brandDealOdds`,
`breakoutOdds`, `burnoutRisk`, `careerLongevity`, `castingPrestige`,
`coStarPerformance`, `crewFriction`, `crisisRecovery`, `criticalScrutiny`,
`dealTerms`, `earlyOpportunityRate` and thirty-three more. Each one is an effect
a trait promises on screen and does not deliver.

**6 higher-is-worse guards** — `coverageDays`, `dealDays`, `decisionDays`,
`draftDays`, `healthDrain`, `overrunOdds` — guarding keys no trait declares.
Left over from systems that were deleted.

**104 id namespaces** of 125, each a noun with no `nextId` call site: a table
the game never fills.

---

## Unreachable: correct, and nothing can get there

**`datesFor` on a plan with no shoot** (`src/engine/world/casting.ts`). It dates
a part off the plan's base period, which is right for a format season. No
greenlight can reach it: only a plan carrying `cast: 'performers'` lays any
parts, and both plans that do have a period called `shooting`. The contract is
asserted on the function directly, and the day a contributor cast board exists
it is already right. The same is true of the office's own pass and of the
player's availability check, which read the same window.

**The higher reimbursement rate's unconditional case.** `REBATE.note` records
that the higher rate also applies with no conditions at all to work made for
audiences of eighteen and under. No picture in the build declares an audience,
so nothing reads it.

---

## Claimed, and not yet verified

Two findings in `DEPTH.md`'s "Where We Stand" were measured on a booted save a
long time ago and have not been re-measured since. If they still hold they are
the most serious entries on this page.

**The simulation is said to reach a fixed point in thirty days.** Fitness has no
source of income — its only write is a subtraction — so it slides from 50 to 0
in 277 days and stays there. The autopilot night sleeps at 95% quality, which
always clears the restful threshold, so morale climbs to 100 and pins while its
only counterweight waits on a nourishment floor the same autopilot prevents.
Four of nine dials are said to be constants by day thirty.

**The ageing model is said to be unable to fire**, because fitness is already at
zero and the age ceiling clamp binds on 0 of 27,375 days. Eight authored bands,
each with its own prose, would be dead arithmetic, and
`src/engine/content/lifespan.ts` would be 540 lines with 2 of its 28 exports
wired.

---

## Recently on this page, and no longer

Kept because the shape of what went wrong is worth more than the fix.

**An unscripted season hired nobody.** Twenty-four posts carried, zero people
engaged, for as long as the crew looked for a period literally called
`shooting`. A format season has none. Fixed by having a plan name its base
period and routing all six readers of that question through one place.

**`REBATE.appliedBefore`** read `true`, and its only reader was a test asserting
it was `true`. The rule it described exists now, in the engine, where a rule can
refuse something.

**Six reputation axes** were unread when the ledger was written. All six decide
something now. The seventh is `prestige`, above.

---

## How to work this page

Take a section, not an item. Forty singletons is not a task and wiring one key
out of forty-seven teaches nothing. A section is a coherent piece of work: the
trait modifier keys are one system, the id namespaces are a question about which
nouns the build actually intends to have, and the prodigy constraint is a design
conversation before it is any code at all.

And every fix on this page has to be shown to bite, by the standard the page is
written against: move the input, watch the outcome move, and prove the test
would have caught its absence.
