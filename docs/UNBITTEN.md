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

**Then, the industry's picture lags the truth.** Built. An office's picture of
the player starts at nothing and climbs with every reading those particular
people have sat through — including the ones that ended in no, because being
watched is what teaches a room whatever it decided afterwards — and a reputation
stands in for some of it and never all. That picture decides what size of part
somebody is asked about, so a career opens on day parts among strangers and
reaches a lead only where an office has watched enough.

It also closed a defect. Size was decided by the length of the shoot alone, and
at nine weeks or more that returned the first row of `SIZES` for every roll there
is. The lot mostly books long, so the first job of every career was a lead, and
one of the four authored size rows was unreachable.

**What was not done, and why.** `shownOn` still returns the truth on
`person.isPlayer`. Removing that would change nothing anybody could reach: the
only company that calls it is the family's own, `putItOut` excludes the player
from every pile another company draws, and the family has watched the player
their whole life. Changing it would be a line that could never alter an answer,
which is the trap this page is about.

**Not chosen, and why it is worth writing down.** Cutting the sheet back to the
twenty-nine anything writes is the cheapest honest answer and it was refused:
the 813 are the domain vocabulary the research was mined for, and re-deriving
them later costs more than carrying them. Reading more of them on everybody
else is a background habit rather than an answer — it enriches the world around
a character who still has nothing to decide.

**4 of 7 personality axes** are in the same position for a different reason:
`agreeableness`, `extraversion`, `riskTolerance` and now `openness` are asked
for at character creation and consulted by nothing. A question with no
consequence.

Openness was three until the wellbeing sweep, and it was the fourth state: read,
and reaching nowhere. Its one case in `axisModifier` scaled how fast
`travelFatigue` came off, and nothing in this build ever put any on, so the axis
that looked wired was the axis with the emptiest reader in the game. The dial
went and the case went with it, which is why `tools/wired.mjs` counts one more
here than it did. The number went up because a fake reader came out, not because
a new word went in — which is the one kind of rise that baseline is wrong to
forbid, and it is recorded in the tool rather than absorbed quietly.

---

## Dead: named, and confirmed

**`prestige`**, one of seven reputation axes, deliberately. Every honest reader
for it is a reader something else already has: put it on the sale and it is
`audienceAppeal` under another name; put it on who gets called and it is
`publicFame`. It is awards-and-critics standing, and there are no awards and no
critics. It stays declared until there are. Inventing a seventh reader to finish
the row would be the disease `DEPTH.md` is about, performed on the page about
the disease.

**53 trait modifier keys** across 445 traits, of which six are consulted and
forty-seven are not. The six: `energyRecovery`, `recoveryRate`, `sleepQuality`,
`stressGain`, `stressPerShootDay` and `stressRecovery`. Every one of them is
read in `systems/life.ts` and in no other file, at seven call sites.

There were fifty-four and seven. `travelFatigue` was the seventh, and the four
personality traits that declared it — Early Riser, Homebody, Restless and Sleeps
Anywhere — declared it onto a dial nothing raised. Key and declarations went
together in the wellbeing sweep, so the dead count held at forty-seven rather
than rising to forty-eight. Two of those four, Early Riser and Homebody, carried
`travelFatigue` as their only live cost and now carry none, which leaves each of
them ahead of its pair on every knob a system still reads. That is a balance
question and it is open.

This entry used to read "47 trait modifier keys … of which seven are consulted:"
and then list fourteen names, which are the *dead* ones — the colon made the
sentence say the opposite of what it meant, and the total was the dead count
rather than the declared count. Two people read it as a contradiction before
anybody read it as a typo.

The forty-seven split by family, and they are not in the same state. Six sit on
the personality traits and `tests/taste.test.ts` has named them by hand since it
was written, on the argument that a trait which says it costs something must not
quietly cost nothing without anybody knowing which. The other forty-four sit on
the acting traits, and until now nothing counted them at all. They are named in
the same test now, so the two families are held to one standard: dormant on
purpose, rather than dormant by nobody looking.

~~**6 higher-is-worse guards** — `coverageDays`, `dealDays`, `decisionDays`,
`draftDays`, `healthDrain`, `overrunOdds` — guarding keys no trait declares.
Left over from systems that were deleted.~~ **Gone.** Verified before cutting:
`SYSTEM_HIGHER_IS_WORSE` is consulted only inside `systemModifier`, which is
reached only through `modifierFor`, which is called at three sites with two
literal keys, neither of them one of the six. Deleting them could not move an
outcome, and that is a proof rather than a run. The seven that remain each name
a knob some trait really carries, which `tests/taste.test.ts` now holds the set
to — a lower bar than being read, and the right one, because a dormant knob is
dormant on purpose here and its guard is part of what it will mean when
something wakes it.

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
long time ago. It has now been re-measured, and it was wrong.

**The ageing model was said to be unable to fire.** It fires. On played careers
— ten years, three seeds, two birth years — age costs two to seven parts and
fourteen to sixteen points of mean readiness, and the whole of that effect is
the `recovery` column of `AGING`: zero it and a seventy-five-year-old plays an
identical career to a twenty-five-year-old, on every seed. What is dead is the
rest of the table. The `fitness` column changes nothing byte-for-byte, and the
`condition` column moves one number nothing reads by about a point. So the
finding was right that most of the file is unread and wrong about the part that
matters, which is the same mistake in both directions: it was taken on a save
where nobody ever went up for anything.

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
above measured rather than asserted. **Settled**, and the count was 43 rather
than 46: an export with no import is not the same as an export with no reader,
and `AGING`, `agingAt` and `AgingBand` are reached from inside the two that are
imported. The file is 87 lines and 2 exports — the three the closure reaches
stayed as file-private declarations, because an `export` on a name no module
imports is the same defect one size down — and the authored tables are in
`research/LIFESPAN.md`.

Everything the audit found is in the workflow's own ledger rather than repeated
here line by line; what is worth carrying is the shape. A quarter of this build's
declared levers do not move anything, and the largest single cause is that the
player is perfect.

**One finding was fixed the day it was found and is in the section below**:
`THE_GIVING`, which is the reason the audit is worth more than a read-through.

---

## Was measured, and is fixed: the one decision in the room

This was the best-evidenced entry on the page and the worst thing on it, because
it was the player's single craft-adjacent choice. It is kept in full because the
method is the point and because the replacement is measured against it.

**What was wrong.** A reading is three shades, each from -3 to +3. The room gives
one note, on one shade, and the player picks how far to take it. `afterTheNote`
moved that shade by `share` of the **real** gap, and the magnitudes were
`{0, 0.5, 1, 1.7}` — so All The Way landed exactly on the want by construction.
It was an identity, not a balance. Every reachable state was enumerated: 117,306
of them give a note.

| Magnitude | Times it is among the best |
|---|---|
| Leave It | 16,514 |
| Halfway | 47,738 |
| **All The Way** | **117,306 — every state there is** |
| Past It | 39,242 |

All The Way was beaten zero times. Leave It was never once *uniquely* best: its
16,514 are exactly the states where all four are identical.

**Three more designs were enumerated and thrown away**, which is the part worth
keeping, because each looks right until it is measured:

| Design | The favorite, among the best in |
|---|---|
| Share of the hidden gap (as shipped) | 100.0% |
| Absolute steps, note on the closest shade | 63.8% — but *step 1 is optimal in all twelve situations a player can read* |
| Absolute steps, note on the farthest shade | 95.9% |
| The above, plus fatigue blurring how precisely the step lands | 79–96% |

The second one is the trap this page warned about in its own words — "absolute
steps that do not read the hidden gap only promote Halfway to dominance" — and
it is now measured rather than asserted. The cause was found underneath it: the
note was given on the shade the reading was **closest** on, and the closest
non-zero error is nearly always the smallest one there is. **57% of notes asked
for a move of one step, and 83% for one or two.** A question whose answer is
almost always the same number is not a question, whatever the buttons say.

**What is built.** Three changes, and they need each other:

- The note is given on the shade the reading was **farthest** off, which is what
  a room actually says and which spreads the distances across the whole range —
  one step to six, nothing above a quarter of them.
- The magnitudes are **absolute steps** `{0, 1, 2, 3}`. Nothing multiplies the
  player's choice by the answer. Over-taking stopped being a button and became
  an outcome: ask for one step and give three and you have gone past them, which
  is what over-taking is.
- **Readiness decides how surely the note was heard.** Below the ceiling there is
  a chance the player moved the shade the wrong way — not because they cannot
  act, but because a room gives one note, once, and a tired person hears it
  wrong. It is the only thing that makes the size of the move a decision: three
  steps is three steps of right or three steps of wrong, and one step is
  neither. It is also the first thing in the engine that reads `readiness`.

**Honest about what it did not fix.** The favorite is among the best in about
80% of states rather than 100%, three different steps are uniquely best across
the situations a player can read, and which one is best moves with readiness. A
single scalar guess against a distribution will always have a favorite, and no
amount of tuning removes that — it needs a second thing the player is trading
against, and the room now has one rather than none. The figures stay here so the
claim is falsifiable rather than a comment's word.

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

- **Age decides nothing.** `content/lifespan.ts` was 540 lines with two exports
  read, and a scout put it at 2 of 48 rather than 2 of 28. The count held; the
  headline did not — `ARREARS.md` proved by A/B that both of the two decide
  outcomes, so age decides plenty and what was dead was everything around it.
  **Settled.** The file is 87 lines and 2 exports. Five names survived, which
  is the transitive closure of the two that are read; the three the closure
  reaches are file-private, so the module's public surface is only what
  `systems/life.ts` imports. The forty-three the closure does not reach are
  kept unwired in `research/LIFESPAN.md`.
- **The whole wellbeing model**, and this is now half true rather than true.
  Readiness is read in exactly one place: `heardItRight` in the audition room,
  where how ready the player is decides how surely they took in the one note
  anybody gives them. That is the first and so far only outcome any of the eight
  dials under it decides. The dials themselves still feed nothing but readiness,
  and readiness still feeds nothing but the room.
- ~~**Travel fatigue is a second fitness bug**, and it takes openness down with
  it — the same shape as the fitness fault, on a second dial.~~ **Deleted.** It
  was seeded at nought and written twice, both times by a subtraction, so it held
  one value for a whole life and `tools/dials.mjs` reported it as "one value, 0".
  Its term in `readiness` was `remap(0, 0, 100, 1.0, 0.80)`, a fixed 1.0, so
  dropping the factor changed the figure for nobody: readiness measured across
  3,903 samples of a 25-year played career is bit-for-bit what it was. The term
  itself was well built — forcing the input to 100 moves the best day from 81.73
  to 65.38 — and it was the input that had no producer. Field, `axisModifier`
  case, four trait modifiers, the higher-is-worse guard and the ninth dial on the
  screen all went together. Openness went with it into the paragraph above.
- **The tax engine is a screen.** Real, correct, and read by one thing: the place
  card, which works out what a reference wage would be taxed at and prints it.
  Nothing taxes a fee, a wage or a company's profit. Iceland is at least IN the
  tables now — it was in none of them, so the home screen told a player living
  in Mosfellsbær that Iceland taxes a wage at 0% and charges no sales tax — but
  a correct table nobody is charged from is still a screen.

  **Costed, so the decision is a number rather than a preference.** Running
  `computeAnnualTax` — the engine's own function, on its own tables, against the
  year's takings — over three seeds of twenty-five played years in Mosfellsbær:

  | seed | career gross | income tax that would fall due | effective |
  |---|---|---|---|
  | t1 | €1,836,230 | €628,406 | 34.2% |
  | t2 | €1,607,992 | €566,292 | 35.2% |
  | t3 | €1,899,507 | €623,086 | 32.8% |

  A third of the career, about €606,000 of €1,781,000 on the mean. That is what
  charging it costs the player, and it is the whole of the decision: the
  machinery to compute it already exists and is already correct, so nothing has
  to be built to find out — only wired.

  **One half of the claim above is wrong, and this is the correction.** Income
  tax is inert. **Corporation tax is not inert; it does not exist.** There is no
  corporate rate table in `content/tax.ts` at all — income, payroll, sales,
  property and the film incentives are the five, and a company's profit is taxed
  by nothing because there is nothing to tax it with. Wiring income tax is
  connecting a finished thing. Taxing the company is building one.

  **And the vehicles are gone.** `VEHICLE_FEE_RULES` carried registration rates,
  minimums, purchase-tax rates and whether an annual safety inspection was
  required, across twelve jurisdictions, for a game with no vehicles in it — the
  same cull `core/ids.ts` describes, surviving in a different file. Thirty-five
  lines, with `vehicleFees` and `VehicleFeeRule`, read by nothing inside the
  module or outside it. `PAYROLL_TAX_RULES` looked like the same thing and is
  not: `computeAnnualTax` resolves it, so it stays.

- ~~**Reclaim The Tax was a door onto nothing.**~~ **Fixed.** Of the nine
  capability doors, three are read by the engine at the greenlight, the delivery
  and the reimbursement; three more bite as greenlight blockers; hiring
  Americans is enforced in the casting room. This one said "claim back the value
  added tax on everything the company buys, which for a production is a fifth of
  the spend" and not one króna was ever reclaimed. `VAT_RATE` had a single
  reader and it was a test asserting the constant still equalled the number
  written beside it.

  It files a return every two months now, on the tax inside what was actually
  bought — which is three of the lot's seven standing costs and not seven, since
  a wage carries no VSK, insurance is an exempt supply, fasteignaskattur is a
  tax and money moved into the company's own sinking fund is not a purchase
  until the day it buys a roof. Measured over three years: about €690,000 back
  on an idle lot, and €4.05m when the fifth stage is built, because a
  construction bill is the largest single claim this company ever makes. An
  unregistered company pays the same prices and keeps none of it, which is the
  door.
- ~~**366 lines of `domain/model.ts`** are record shapes with no table, no
  importer and no writer.~~ **Deleted**, and it was 199 lines across eight
  names rather than 366: `Structure`, `Room`, `Zone`, `Costume`, `Order`,
  `Training`, `Running` and its `Mark`. A house broken into rooms with
  furnishings, a shop with a cart and a refund window, a gym with grading
  panels, and a track season with wind readings and shoe contracts — the same
  game `core/ids.ts` records losing a hundred and five id namespaces to. The
  namespaces went in that cull and the shapes stayed. Cut by transitive closure
  and not by region, which mattered: `Mark`'s only two readers are fields on
  `Running`, so it is dead only once `Running` is, and `Booking` sits directly
  above the region and is live.
- ~~**Four fields on every person, and the whole skill sheet.**~~ **Deleted**,
  and it was five fields and a sheet. `goals` was not collected by any screen;
  `lifestyle` was a select whose four options each promised something about how
  you spend and opened the same world either way; `creditScore` stays on
  `WEALTH_PROFILE`, where the creation review reads it, and came off the person,
  where no lending consults it; `goatTraits` was a second copy of a content list
  the screen already reads from `content/prodigy.ts`. The sheet held the prodigy
  at 100 and everybody else at 5, with an empty exceptions map at boot and after
  1,825 simulated days, so it was dead by construction.

  `background` was the fifth field and it was kept, because it is the one the
  player writes rather than picks, and a sentence somebody authored about their
  own character is not the same kind of thing as an option list. It was kept on
  a condition: the person look prints it now, for the player and for every
  relative the family generator writes one for, and `tests/looks.test.ts` holds
  that reader. Flavour with a reader is not a dead word. Flavour written into a
  save and never shown to anybody would have been.
- ~~**The audit trail is a persisted, empty table**~~ — deleted in `5a5232e` —
  **and the history table is a sleep diary.** Measured rather than asserted, and
  the truth is sharper than the claim in both directions. Structurally it is a
  sleep diary exactly: `universe.history` has **one writer in the whole engine**,
  `systems/life.ts` inside the sleep command. In practice it holds **nought rows
  after twenty-five played years**, because that writer is a command the player
  presses and a career that only acts never presses it. Its only readers count
  its length for the save-size estimate and relabel it on migration; **no screen
  reads it**, so nothing a player does is ever shown back to them from it.

  That is the audit trail's shape again — persisted, validated, counted in the
  size estimate, read by nobody — with one difference that stops it being the
  same call: the audit trail had zero writers *and* zero readers, and this has a
  writer that works. So it is either a table that wants a screen or a table that
  wants deleting, and which of those it is belongs to the owner rather than to
  whoever next reads this line.
- **`Audition.took`** is written and read by nothing, in the save record of the
  system the game is named after.
- **The guild signature is a gate with no money behind it.** The content says
  what the agreement costs and nothing charges any of it.
- ~~**A season anchored on an airdate has no airdates.**~~ **Stale.** The
  defaulting was fixed: `AIRDATE_WEEKS` is 52, `greenlight` picks the lead
  against the end the plan actually anchors — `plan.anchor === 'delivery' ?
  AIRDATE_WEEKS : LEAD_WEEKS` — under a comment saying it is there so a caller
  that says nothing gets a sensible date for the kind of thing it is rather than
  a start date silently used as an airdate. There is a refusal in front of it
  too, for the date that is too near, because a delivery-anchored plan laid out
  backward from a close airdate used to put casting, the rig and the field all
  in the past and strand the picture in the save forever.

  What is genuinely absent is narrower than the line said: **nothing in the
  world supplies an airdate.** No broadcaster asks for an autumn slot; the date
  is the caller's or the default. That is a feature nobody has built rather than
  a mechanism that does not work.

- **The denominator never moves:** a cut that cannot run long. **True, and
  exactly true:** `project.owesSeconds` has one writer in the whole engine —
  `making.ts` at the greenlight — and is never written again, so the shooting
  ratio moves only through its numerator.

  **It is not the defect it sounds like, and the difference matters.** The ratio
  it feeds is live: `trouble.ts` reads it into the deck of things that go wrong,
  and `cutsAWeek` sets how fast material becomes runtime. And a fixed
  denominator is arguably what a delivery contract *is* — eight parts at fifty
  minutes is a thing somebody signed, not a thing that drifts. What is missing
  is the event where a network asks for a shorter cut or a picture runs long and
  somebody pays for it, which is a feature, not a broken number.

- ~~**The booking board is invisible to the player.**~~ **Stale for what it
  says.** `looks/estate.tsx` prints, for every stage, `${on.holder}, through
  ${date}` or `Empty`, off `onStageAt`. What is missing is the forward view:
  the player can see who is on a stage **now** and not what is booked for next
  month, so it is a board without the dates in front of it.
- **The collective floor under an Icelandic fee.** Still true, and it is a
  sentence and not a number: two rows in `content/incorporation.ts` carry
  `binds: 'The collective floor, holiday pay, and the mandatory pension
  contribution'` with `signable: false` and no figure anywhere, and no fee in
  the build is ever checked against a minimum. **`canWorkIn` is stale on this
  line** — it was deleted in `bcbf271`, with `workRefusalFor`, a duplicate
  `countryOfCity` and the five tests whose own header admitted nothing called
  the rule.
- **Awards and critics**, which is where `prestige` above is waiting.
  **Specified and costed in `docs/AWARDS.md`**, which is the deliverable this
  section was scoped to rather than a built festival circuit. The finding that
  shaped it: the two fields involved are half-connected in opposite directions.
  `prestige` is written for 87 of 146 people in a played save and **read by
  nothing at all**; `controversy` is **read by two live mechanisms** — a casting
  office refuses anybody over `TOO_HOT = 55`, and the cast's controversy takes
  up to 38% off what a picture sells for — and is **0 for every person at every
  moment**, because every writer in the build sets the literal nought. So the
  expensive half of an awards system is already built and waiting for a source,
  which makes this a much smaller job than the page implies.

### Correct, and nothing can reach it

- ~~**The Decision Center is a room nothing ever writes to.**~~ **Fixed.** Two
  commands — `world.take_decision_action` and `world.dismiss_decision` — read a
  table the engine never filled, and the panel on Home rendered its Empty state
  for every save anybody could play.

  The world tick raises one thing now, and it is the deadline that was silent:
  the reimbursement, whose application closes on the first day of photography
  and never reopens. Raised on the tick rather than at the greenlight, because a
  runway is not known when a picture is greenlit and a company that has nobody
  keeping its books cannot claim at all — so the prompt has to be able to arrive
  in week three. Measured on a twenty million euro feature: a hundred and five
  days of runway, seventeen notices across it about crew and prep and stages,
  and not one word about 5.98m euro.

  The ledger's framing was wrong on two counts and both corrections are in the
  code. "Every deadline in the build goes unannounced" is too broad: a delivery
  past its date notifies twice and an audition arrives with its closing date in
  the body of the notice. And this is a reminder rather than a decision — filing
  on the first open day and on the last were played out to the money landing
  across four budgets and two seeds each, and the difference was exactly nought
  in all eight pairs. So it carries one button and the code says why.
- **Nobody can see the booking board**, which is the only pipeline the career
  has. The lever is money spent a year early and its effect is invisible until it
  arrives as one notification.
- **Three signable guilds, a registry, a policy and a company form** can be
  reached only as a blocker chip — which is fine, because the chip carries a
  working control. Measured by driving the built app: a player who presses what
  the panel offers goes from two doors to nine. It was six until the material
  blocker got a control of its own; "Anything At All" named the thing keeping
  three doors shut and then left the player to find the button for it a panel
  away, under a heading that does not mention doors.
- **Three more guards at points the arithmetic already settles**, which is the
  same fault as the crowd guard below.
- **The reimbursement's under-18 case**, which needs a picture to declare an
  audience.
- **The unscripted contributor cast board.**

### Found while building, and not yet fixed

- ~~**The hands on a feature decide nothing.**~~ **Fixed, and the first reading
  of it was wrong.** The claim here was that a feature delivers on the same day
  at one editor as at four. It does — but not because the staffing has no
  effect. Measured at the start of post: a feature at one room has 1.6 weeks in
  hand against its date and at four it has 11. The slack moves enormously; a
  feature just never generates enough trouble to spend 1.6 weeks of it, because
  it is one part rather than a season of them.

  The real fault was underneath and applied to all three forms: **a room cost
  nothing.** `spends` is a flat share of the budget and knew nothing about how
  many rooms were running, so six editors cost exactly what one did. More hands
  cut faster, bought weeks against the date, and were free — which made the
  largest number correct on every picture in every state, and the only crew
  decision the game offers a number nobody had a reason to lower.

  The rooms are paid for now. `converts.ofTheSpend` says how much of a
  converting period IS the rooms — a third on the scripted forms, and nearly
  half on unscripted, which is made in the edit rather than shot to a script —
  and that part moves with the staffing actually on it while the finish around
  it does not. The ratio is against the staffing the plan itself assumes, so a
  picture run as expected costs exactly what it always did and only a deliberate
  change costs or saves anything. On a €20m picture: about €1m a room on a
  feature, €0.47m on a series, €0.72m on an unscripted season, and the price is
  now on the greenlight form beside the number.

- **A default-staffed season misses its date a third to a half of the time**,
  and that is probably right rather than wrong — trouble is supposed to threaten
  the date, and the warning arrives while there is still time to act. It is here
  because a test asserted the opposite and passed for months on the seed it was
  written against, which means nobody had measured it. Now measured, and the
  test says the true thing.


- **The company can pay the player money it does not have.** Casting the player
  at a lead's band on a €20m picture paid €877,000 out of a company holding
  €117,000 and left it at minus €761,000. `sim.expense` has no balance check and
  neither does `payThePlayer`. It was only reachable at all because the player
  can now be seated in the family's own pictures, so it is new in reach rather
  than new in code.

  **Two halves of this are now measured rather than asserted, and one of them
  was wrong.** "Goes negative *silently*" is false: `sayIfItWentUnder` raises a
  notification naming the shortfall and saying it is counted against what the
  family will still put in. And `tests/doors.ts` already records the €117,000
  against €878,000 case in its own docstring, with *it goes under, which is
  allowed and is said out loud* — so overdrawing is a deliberate, tested
  position rather than an oversight.

  What was never measured is how far it actually goes, because there was no
  instrument that ran the company. `playABusiness` exists now. Over
  twenty-five years on three seeds, running the pipeline the way a producer
  does — option, develop, greenlight, deliver, sell, repeat:

  | seed | greenlit | delivered | lowest cash | weeks under water | ended |
  |---|---|---|---|---|---|
  | b1 | 35 | 31 | −€5,861,270 (week 35) | 12 of 1300 | +€196,632,956 |
  | b2 | 7 | 6 | −€9,875,275 (week 151) | 62 of 1300 | +€128,970 |
  | b3 | 36 | 33 | −€5,949,128 (week 35) | 20 of 1300 | +€162,808,126 |

  So the overdraft is real, is six to ten times the figure this page records,
  and is reachable inside the first year. Two things nobody had seen before sit
  beside it and are bigger: **the same pipeline ends a career holding between
  €129,000 and €197 million** depending only on the seed, and **the number of
  pictures a company gets made in twenty-five years runs from seven to
  thirty-six** on the same inputs. A business whose lifetime outcome spans three
  orders of magnitude on seed alone is not a balance question yet; it is a
  question about what the seed is deciding. Both are owner calls and neither is
  costed here.

- ~~**An audition never expires.**~~ **Fixed.** `whatIsGoing` wrote a row with a
  `closesAt` on it and nothing ever read that date. Measured on a save nobody
  plays: 66 auditions across 25 years, every one still `open`, the oldest closed
  twelve years earlier.

  The fix took the harder of the two endings. An ask now closes when its date
  goes past, *and* being asked and not answering costs standing with the people
  who asked — the `remembersYou` ratchet running the other way, which the
  research describes and this build only ever had one half of. An office that
  asks twice and hears nothing twice stops asking.

  With a window on it, and that was the second pass. The first version counted
  every unanswered ask ever, which took a holder to nothing after two and left
  them there for the rest of the save: a countdown rather than a consequence,
  and exactly the fault this build refuses on the family's patience. Three
  years now, the same window the lot judges its own record over, so there is a
  way back. Measured across three seeds over 25 years: a player who answers
  nobody is asked about **29-38 parts instead of 66**, and holders come back.

### Wrong, rather than missing

- **Nothing in the company ever ends.** An option you forgot to exercise never
  lapses; cover you forgot to renew never lapses. The scout calls this the
  cheapest large consequence available, and it is pure calendar and money.
- **A quote that can only go up.** `quoteOf` returns the maximum of every past
  fee, so taking a cheap job costs nothing. The research names quote protection
  as a ratchet that must bite in both directions.

  **For the player it is worse than one-way: it is not read at all.** Proven
  rather than argued. Over three seeds of twenty-five played years the player
  accumulates 96, 115 and 99 quotes, and wiping every one of them each week
  leaves the career **bit-identical** — same sha256 over parts won, earnings,
  reliability, fame and energy, same purse to the euro, on all three. The reason
  is one branch: `seatThem` answers `{ took: true }` for the player before
  `offerOf` is built, so `askFor` — the only engine reader of `quoteOf` — is
  never called about them.

  It is **not deleted**, and that is the one place The One Rule is deliberately
  not applied here: this field is the input to an owner decision already on the
  books, *whether the player's fee should be floored at their quote*, measured
  at ×2.32–3.56 of lifetime acting income. Deleting the number that decision
  needs in order to satisfy a rule about dead words would be the rule eating the
  thing it exists to protect. It stays until that call is made, and if the call
  is no, it goes then.

- **`stillOwedCents` stops accruing interest at week 260** and the screen still
  says interest is included. **True, and the cause is exact:** interest is
  applied inside the receipt loop, for the gap since the previous receipt, so it
  compounds only when money arrives — and the last window opens at week 260,
  after which no receipt ever comes. The debt stops.

  Said in the code rather than fixed. Two screens print `stillOwedCents` and
  **nothing anywhere decides on it**, so compounding it past the last window
  would move a printed number and no outcome, which is the definition of
  decoration this page exists to name.
- **The strike week is booked as prep**, and `RATE_SHARE.hold` is dead. `DEPTH.md`
  records this one as fixed; only the prep third of it was.
- **A directed night's sleep is added on top of the autopilot's**, which inverts
  the contract its own comment states, and the guard written for it has no
  caller.
- ~~**The house rots with no repair**, and the screen tells the player it is their
  fault for a choice they do not have.~~ **Cleared**, and half of it was already
  stale when it was cleared — see "Recently on this page, and no longer" below.
- **The creation screen, `taste.ts` and the engine give three different counts**
  of which personality axes do anything — and the screen's copy exists precisely
  to be honest about that.
- **`whereTheCrewStands` counts strangers as returning hands**, and no screen
  reads it. Both halves of the One Rule at once.
- ~~**The note's magnitude has one right answer in every state**, and the tests
  pin it. Four buttons, three decoys, in the second of only two decisions in the
  room the game is named after.~~ **Both halves measured, and both are wrong —
  the truth is narrower and worse in a different way.**

  There are **three** buttons, not four: `HOW_FAR` went to `touch`, `good`,
  `far` at some point and this line did not follow.

  And there is no one right answer. Playing each policy fixed for a whole
  career, six seeds, twenty-five years each, counting parts won:

  | seed | touch | good | far |
  |---|---|---|---|
  | n1 | **113** | 113 | 107 |
  | n2 | 115 | **116** | 111 |
  | n3 | **111** | 110 | 108 |
  | n4 | 87 | **92** | 91 |
  | n5 | 120 | **121** | 117 |
  | n6 | **123** | 118 | 113 |

  `touch` takes three seeds and `good` takes three, by margins of nought to
  five parts in about a hundred and ten — which is to say they are the same
  button wearing two labels, and over four seeds the ranking even flips by
  metric: `touch` earns the most money while `good` wins the most parts.

  **`far` wins nothing. Not one seed, on either count.** So the shape is not
  four buttons with three decoys. It is **two buttons that cannot be told apart
  and one that is never the right play** — which is a worse decision than the
  page describes, because a dominated option at least teaches somebody something
  the first time it loses. Two identical ones teach nobody anything, ever.

  Not acted on: whether `far` should pay off somewhere, and whether `touch` and
  `good` should be pulled apart, are balance calls, and this is the second of
  only two decisions in the room the game is named after.
- **The room's want is drawn from nothing**, so the opening reading is a constant.
- **A part is priced off the stage rate card** — what the room costs, not what the
  cast costs.
- ~~**Two functions answer whether the player is free, and they disagree.**~~
  **Cleared.** There were three, and the disagreement was 40.5% of spans — see
  below.
- **The casting office is a display string**, so an office's identity is its own
  prose and its taste is seeded from it. The count on this line used to say nine
  addressable offices, two of which are one. Measured: **six** offices appear
  across three careers of twenty-five played years, of ten shapes declared, and
  the two that are one thing addressed twice are *an American studio, a feature*
  and *a Hollywood studio, a feature*. Not built on, because nothing shows the
  split biting; recorded because editing the copy silently moves the simulation.
- **The posts cost nothing and nobody has to say yes.**

---

## Recently on this page, and no longer

Kept because the shape of what went wrong is worth more than the fix.

**Two functions answered whether the player was free, and there were three.**
`diary.theyAreFree` reads the cast seats and the auditions, with a week in front
of a first day and `heldUntil` scoping; `casting.freeToWork` read the cast seats
alone, with neither; `crew.freeAcross` reads the crew seats alone. The first is
player-only by construction, the other two take anybody.

The disagreement was not an edge. Asking `freeToWork` and `theyAreFree` about
the same fortnight over three seeds of twenty-five played years, they differed
on **1,580 of 3,900 spans — 40.5%** — and every single one was the same way
round: `freeToWork` saying free while the diary named the part. The cause is one
line: a part won in the room is a row in `universe.auditions`, and `freeToWork`
only ever read `project.cast`. In a career that only acts, `project.cast` is
empty from the first day to the last, so this was not a function that was
sometimes incomplete. It was a function that returned `true`.

So it was right about every person in the save except the one the game is about.
The player is now handed to the diary, which exists to be the one answer, and
the disagreement measures **0 of 3,900**. `crew.freeAcross` is left alone
deliberately: a played acting career produces no crew seats at all, so nothing
shows it biting, and inventing a third consultation to fix a collision no input
reaches is the thing this page exists to stop.

**The house rotted with no repair.** `property.condition` had one writer in the
whole build and it was a subtraction: `systems/life.ts` took `WEAR_A_DAY` off
every standing property every day, `sleepQuality` read the result every night,
and nothing anywhere put a point back — so the house reached nought in a little
under twenty-three years, inside one career. There is a command for it now
(`life.upkeep`), the player pays for it out of their own account, and the price
is a quotient rather than a taste: the trade's rule of thumb of a currency unit
per square foot per year, divided by the 4.38 points a year of wear takes off.

Two things came out of fixing it that are worth more than the fix. The first is
that **the second half of this entry was already false when it was written** —
the estate screen did not blame the player, it said plainly that nothing in the
game could put a point back, which was true and was the reason to build one. An
entry on this page was stale in exactly the way this page warns about.

The second is the size of the prize, paired over six seeds of twenty-five played
years, the same seeds both sides. Keeping the house prevents the late-career
collapse outright — reliability ends at 94.3 rather than 0.0, no seed reaches
nought where six of six did, readiness in the last third goes 19.3 to 46.6, and
weeks spent under `spentAt` fall from 575 of 1300 to 77. And **parts won moves
by three, from 115 to 119, while readings given does not move at all.** Career
earnings move 14.8%, from EUR 1.92m to 2.20m, so the player wins better-paid
work rather than more of it. Anybody reading the reliability row as the size of
the prize is wrong by an order of magnitude. That gap — an enormous, real,
measurable chain that arrives almost nowhere — is the open question this fix
hands on, and it belongs to `readiness` and `reliability` rather than to the
house.

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

**Resting between jobs decided nothing, and now it decides a fortnight.** The
first cut of the cost moved the dials but left the one lever a tired player has
inert: measured, a one-week gap and a twelve-week gap left a career in precisely
the same place. Energy had no memory — a night returned about ninety points
whatever the last three months had been — so the only dial carrying anything was
the debt, and the debt barely reaches readiness.

Two halves of one idea fixed it, and both were needed. A night puts back less
when there is a debt behind it, which is the other half of a coupling the build
already declared on the drain side and the audit had measured dead. And the
night's shortening is the worse of how deep into this job today is and how worn
the person already was, because how-deep-into-this-job resets with every
engagement and so handed somebody who finished a twelve-weeker last week a run
of ordinary nights while they were still carrying it.

Measured across four builds: with neither, a one-week gap and a three-week gap
ended at 47 and 49 readiness and identical reliability. With only the weaker
half, 35 and 49, four points of reliability apart. With both, 19 and 48, forty
points apart. Under ten days is ruinous, thirteen days and over is fine, and the
transition runs across days nine to thirteen.

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
