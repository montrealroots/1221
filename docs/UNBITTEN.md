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

This is the largest single entry on this page and it is not a bug. It is the
premise. `content/prodigy.ts` says so in its own words: the player is the best
there has ever been and the industry knows it, and "being the best there has
ever been at the work is not the same as being able to keep the lights on, and
that gap is the entire game."

So the question was never how to let the player fail on craft. It was what the
794 are for, given they can never be that. **Answered on 2026-09-15, by the
owner: spend the instrument, then make the industry's picture of it lag.**

**First, a performance costs something.** The player can do anything and cannot
do everything at once. An attribute stops being a check and becomes a claim
about what a performance takes out of the person giving it. The currency for
this already exists and is dead: readiness and the nine dials under it are read
by nothing in the engine, and the calendar has a cancellation curve with exactly
one subject. It is gated on a prerequisite — being cast has to put days on the
player's calendar before those days can cost anything, and today it does not:
`theyWantYou` posts money, moves four reputation fields and schedules nothing,
and `requiresPlayer` has one write site in the whole engine.

**Then, the industry's picture lags the truth.** The player is at the ceiling and
every office reads them correctly the instant they see them, because `shownOn`
returns the truth on `person.isPlayer`. The machinery for the other answer is
already built and already used on everybody else — `believedAt`, `howWide`,
`offsetOn`. Turned on for the player, the forty-five attributes named for the
audition room stop being what the player *has* and become what a room *learns*,
which is what `DEPTH.md` means by typecasting: the industry's categorical
picture of you, lagging what you can actually do.

**Not chosen, and why it is worth writing down.** Cutting the sheet back to the
twenty-nine anything writes is the cheapest honest answer and it was refused:
the 813 are the domain vocabulary the research was mined for, and re-deriving
them later costs more than carrying them. Reading more of them on everybody
else is a background habit rather than an answer — it enriches the world around
a character who still has nothing to decide.

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

## Measured, and one of the two is now fixed

Both findings in `DEPTH.md`'s "Where We Stand" were re-measured on 2026-09-15.
Both were true, and the first was worse than stated.

**The fixed point was real and larger than recorded.** Not four of nine dials by
day thirty: **seven of nine**, and eight of nine by day three hundred and sixty
five. `readiness`, which the whole model rolls up to, sat on 49 from the first
month to the fifth year without moving once, and `reliability` never moved at
all. The cause was not the arithmetic. The autopilot restores to a fixed ceiling
and a fixed floor every day, and no day had ever been different from any other
day. **Fixed**, in the section below: a week on a picture is now a different kind
of day, and readiness moves between 49 and 19 across a long run and comes back.

**The ageing model still cannot fire.** Unverified and still standing.

---

## Claimed, and not yet verified

One finding in `DEPTH.md`'s "Where We Stand" was measured on a booted save a
long time ago and has not been re-measured since.

**The ageing model is said to be unable to fire**, because fitness is already at
zero and the age ceiling clamp binds on 0 of 27,375 days. Eight authored bands,
each with its own prose, would be dead arithmetic, and
`src/engine/content/lifespan.ts` would be 540 lines with 2 of its 28 exports
wired.

---

## The bite audit of 2026-09-15

Six slices of the engine, every lever enumerated and then **proven by running
the engine** — probe scripts driving a real save, one input moved at a time,
before and after printed. Not read. This is the one audit on this page whose
findings are measurements.

**372 levers tested. 283 bite. 89 do not.**

| Verdict | Count |
|---|---|
| BITES | 283 |
| DEAD — moved across its range, nothing observable moved | 71 |
| UNREACHABLE — correct, and no play can get there | 18 |

By how much it matters: 6 critical, 41 serious, 100 minor, 225 none.

Three of the six critical findings are the prodigy constraint wearing different
clothes, which is the section at the top of this page and not six separate jobs:
`modifierFor(person, 'recoveryRate')` and `'stressPerShootDay'` are named in the
prover's own words as THE PRODIGY TRAP, the player's `repeatable` read into the
cutting room's ratio is the same fault, and `shootDayWeather` computes every
factor and both temperature guards for nobody.

The other three are their own work. `theOfficeFills` never calls `decideOffer`,
so the office hires people the player is refused — it bites, and what it bites
is the symmetry between the two halves of the game. `project.hands` cannot be
changed after the greenlight, so the cutting room cannot be restaffed. And the
other 46 exports of `content/lifespan.ts` are dead, which is the ageing claim
above measured rather than asserted.

Everything the audit found is in the workflow's own ledger rather than repeated
here line by line; what is worth carrying is the shape. A quarter of this build's
declared levers do not move anything, and the largest single cause is that the
player is perfect.

**One finding was fixed the day it was found and is in the section below**:
`THE_GIVING`, which is the reason the audit is worth more than a read-through.

---

## Measured: the one decision in the room the game is named after

This is the best-evidenced entry on the page and the only one proven by
exhausting the state space rather than by reading. It is also the worst, because
it is the player's single craft-adjacent choice.

A reading is three shades, each from -3 to +3. The room gives one note, on one
shade, and the player picks how far to take it: Leave It, Halfway, All The Way,
Past It. `afterTheNote` moves that shade by `share` of the real gap, and the
magnitudes are `{0, 0.5, 1, 1.7}` — so All The Way lands exactly on the want by
construction. `decideAudition` falls away monotonically with distance and reads
nothing else.

Every reachable state was enumerated: 117,306 of them give a note.

| Magnitude | Times it is among the best |
|---|---|
| Leave It | 0 |
| Halfway | 33,498 |
| All The Way | 117,306 |
| Past It | 23,240 |

**All The Way is beaten zero times.** It wins outright in 66,151 states and ties
in the other 51,155. **Leave It is never once among the best.** One button is
never wrong and one is always wrong, in every state the game can reach.

It is worse than a dominant option, though. In 14,202 states — 12.1% — all four
magnitudes land inside `CLOSE_ENOUGH` and the chance of being cast is *identical
whatever the player picks*. On a reading wrong on one shade only, that is 71.4%
of states. The cause is structural: `howFarOff` is the mean across three shades
and the note moves exactly one, so the worst possible single-shade error is 2.0
against a `CLOSE_ENOUGH` of 1.2. A player who is wrong in one way cannot be
wrong enough for the answer to matter.

The file's own comment says of half-taking and over-taking that "both halves of
that sentence are built". Both halves are present and neither is ever worth
choosing. `content/audition.ts` describes the research's sharpest decision and
`world/audition.ts` resolves it with arithmetic that has one answer.

**This one needs a decision before it needs code.** Absolute steps that do not
read the hidden gap only promote Halfway to dominance; a magnitude becomes a
decision when it trades against something, and the room has nothing scarce in it
— going in costs money from an account nothing can drain and three days that
occupy no calendar. The fix is bound up with what the room is allowed to spend,
which is the same question the prodigy constraint asks above.

---

## From the audit of 2026-09-15

Six scouts read the build against this standard and returned sixty-six
candidates. Forty-one of them belong on this page: fifteen declared words with
no reader, eight things correct and unreachable, and eighteen defects. The rest
are missing features and live in `COVERAGE-MATRIX.md`, which is where a gap
belongs.

Three were fixed the day they were found and are in the section below. What
follows is everything still owed, in the scouts' own framing, and none of it has
been independently verified by a second pass — treat each line as a lead with a
file reference rather than as a finding.

### Declared, and nothing reads it

- **Age decides nothing.** `content/lifespan.ts` is 540 lines with two exports
  read, and a scout puts it at 2 of 48 rather than 2 of 28. It also strengthens
  the ageing claim from an empirical one about 27,375 days to an arithmetic one
  that holds for a save of any length. Verify the count before quoting it.
- **The whole wellbeing model.** Readiness and the nine dials under it are read
  by nothing in the engine, and they sit directly under the only thing a player
  can choose to spend a day on.
- **Travel fatigue is a second fitness bug**, unrecorded until now, and it takes
  openness down with it — the same shape as the fitness fault, on a second dial.
- **The tax engine is a screen.** Real, correct, entirely unwired.
- **366 lines of `domain/model.ts`** are record shapes with no table, no
  importer and no writer.
- **Four fields on every person, and the whole skill sheet.** The scout's view is
  that deletion is the honest answer here rather than wiring, because the prodigy
  holds every skill at 100 and every other person at 5.
- **The audit trail is a persisted, empty table**, and the history table is a
  sleep diary.
- **`Audition.took`** is written and read by nothing, in the save record of the
  system the game is named after.
- **The guild signature is a gate with no money behind it.** The content says
  what the agreement costs and nothing charges any of it.
- **A season anchored on an airdate has no airdates.**
- **The denominator never moves:** a cut that cannot run long.
- **The collective floor under an Icelandic fee**, and **`canWorkIn`**, which has
  no reader at all.
- **Awards and critics**, which is where `prestige` above is waiting.

### Correct, and nothing can reach it

- **The Decision Center is a room nothing ever writes to.** Every deadline in the
  build goes unannounced, and the most expensive of them is the reimbursement.
  Two commands — `world.take_decision_action` and `world.dismiss_decision` — read
  a table the engine never fills.
- **Nobody can see the booking board**, which is the only pipeline the career
  has. The lever is money spent a year early and its effect is invisible until it
  arrives as one notification.
- **Three signable guilds, a registry, a policy and a company form** can be
  reached only as a blocker chip.
- **`sizeCasting` is inverted at both ends:** a long shoot always offers a lead
  and a day player is unreachable, so a career's first job can only be a lead.
  The Day Player row carries its own prose, rate, on-screen share and leans and
  none of it is reachable.
- **Three more guards at points the arithmetic already settles**, which is the
  same fault as the crowd guard below.
- **The reimbursement's under-18 case**, which needs a picture to declare an
  audience.
- **The unscripted contributor cast board.**

### Found while building, and not yet fixed

- **The company can pay the player money it does not have.** Casting the player
  at a lead's band on a €20m picture paid €877,000 out of a company holding
  €117,000 and left it at minus €761,000. `sim.expense` has no balance check and
  neither does `payThePlayer`, so the family's business goes negative silently
  and the greenlight door then shuts on the next picture for want of money — the
  right consequence arriving from the wrong cause. It was only reachable at all
  because the player can now be seated in the family's own pictures, so it is
  new in reach rather than new in code.

### Wrong, rather than missing

- **Nothing in the company ever ends.** An option you forgot to exercise never
  lapses; cover you forgot to renew never lapses. The scout calls this the
  cheapest large consequence available, and it is pure calendar and money.
- **A quote that can only go up.** `quoteOf` returns the maximum of every past
  fee, so taking a cheap job costs nothing — and the code's own comment claims
  the opposite mechanic. The research names quote protection as a ratchet that
  must bite in both directions.
- **`stillOwedCents` stops accruing interest at week 260** and the screen still
  says interest is included.
- **The strike week is booked as prep**, and `RATE_SHARE.hold` is dead. `DEPTH.md`
  records this one as fixed; only the prep third of it was.
- **A directed night's sleep is added on top of the autopilot's**, which inverts
  the contract its own comment states, and the guard written for it has no
  caller.
- **The house rots with no repair**, and the screen tells the player it is their
  fault for a choice they do not have.
- **The creation screen, `taste.ts` and the engine give three different counts**
  of which personality axes do anything — and the screen's copy exists precisely
  to be honest about that.
- **`whereTheCrewStands` counts strangers as returning hands**, and no screen
  reads it. Both halves of the One Rule at once.
- **The note's magnitude has one right answer in every state**, and the tests pin
  it. Four buttons, three decoys, in the second of only two decisions in the room
  the game is named after.
- **The room's want is drawn from nothing**, so the opening reading is a constant.
- **A part is priced off the stage rate card** — what the room costs, not what the
  cast costs.
- **Two functions answer whether the player is free, and they disagree.**
- **The casting office is a display string**, so roster memory has nine
  addressable offices, two of which are one.
- **The posts cost nothing and nobody has to say yes.**

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

**The reimbursement leaked a lump rather than a share.** Fourteen percent of a
whole negative was subtracted from a running total, so the certificate read
nought through the whole of prep on a picture that had already filed, and
seventy percent off the spend a fifth of the way through. It converged on the
right answer only once the last euro went out, which is the worst possible shape
for a wrong number: right whenever somebody checks it at the end.

**The casting office flew people in and never paid for the flights.** It writes
its own seats rather than going through the offer path, so it skipped the one
payment that path makes for somebody who does not live here. A hundred and
fifty-three thousand euros of travel incurred, nothing spent, and the
reimbursement then took those fees off the certificate as money paid abroad on
travel nobody had bought — wrong in two directions at once, from one missing
line.

**Chemistry's second term was craft standing under another name.** `sheetFor`
wrote the three casting axes and the four tape attributes and never once wrote
the six in `THE_GIVING`, so every performer carried them at the sheet's base —
which is a function of `standing`. Two people equally good were equally generous,
always, and `sparkBetween` multiplied its one genuinely non-separable term by a
number it already knew. Four hundred performers at an identical standing now
produce 271 distinct giving values across a range of 13 to 97; before, they
produced one.

The way it hid is worth more than the bug. `tools/deciders.mjs` sweeps every
declared input and fails if the outcome never moves, and `THE_GIVING` passed that
sweep from the day it was written — because the harness writes the field itself.
A decider sweep proves something *reads* an input. It cannot prove the world ever
*varies* it, and a field only the test ever varies is dead in play and green on
the board.

**Work is the first thing that ever made a day different.** The wellbeing model
was a fixed point because the autopilot restored to the same ceiling every
morning and nothing ever asked more of anybody. A week on a picture is a shorter
night, deepening the further into the run it is, so a long job declines and a
short one costs nothing — and the cost lands on how reliable people found
somebody, never on how good they were, because the premise forbids the second
and leaves the first available. An office asks less about somebody who was
trouble, and only about trouble: nobody gets extra calls for having been
punctual.

Three of its numbers did not survive being measured, which is the part worth
keeping. A flat working penalty only moved the fixed point somewhere else and
took a career from sixty-six to nothing on one job. Dropping the coasting floor
made a shoot *restful*, because that floor was holding stress up rather than
down. And a cap on how fast sleep debt clears was written against an arithmetic
guess of twelve a night; measured, it clears about two and a half, so the cap
never once bound and was deleted along with a floor eighteen minutes away from
the floor beside it.

**Three different counts of one thing.** The reimbursement's conditions were
called three in the law's own content, four in nine places across the module
built on top of it, and tested as five. There is a test holding the three counts
to each other now, because the one certain thing about a hand-written count is
that it stops being true.

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
