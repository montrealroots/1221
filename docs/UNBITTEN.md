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
| Id namespaces | 0 | 19 |
| Trait modifier keys | 0 | 6 |
| Higher-is-worse guards | 0 | 2 |
| Personality axes | 0 | 3 |
| Dials nothing moves | 0 | every field on Reputation and Wellbeing |
| Save tables nothing fills | 0 | 22 |
| Draw streams no decider owns | 0 | 21 |

**Nought declared words that nothing reads.** Every row above was above nought
when this cleanup started, and the four that were not already nought — the trait
modifier keys, the higher-is-worse guards, the dials and the draw streams — came
down in one run of work. The ratchet may fall. It may not rise.

This table said **160** for a long time after it was 47, with id namespaces at
104 of 125 and personality axes at 3 of 7 — numbers from before the cull, the
wellbeing sweep and the axes going. A summary that is wrong is worse than no
summary, on the page whose whole subject is that, so it is read straight off
`docs/UNWIRED.json` now and the figures above are that file's.

The last row is new and it is the one that had been invisible: `deciders.mjs`
checked draw ownership per FILE, so a stream added to a file that already owned
one slid past. Thirteen were hiding there.

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

**The personality axes were in the same position and are not any more.**
`agreeableness`, `extraversion`, `riskTolerance` and `openness` were asked for
at character creation and consulted by nothing — four questions with no
consequence, out of seven.

They are deleted. The creation screen had been honest about them, which is
better than hiding them and is not the same as not having them; what settled it
is that they appeared on that screen and on no other, so nothing ever showed
them back. `background` survives exactly that test by being printed under a
person's name. `Personality` holds three now and each one moves `axisModifier`.

Openness was the last of the four to be read at all: its one case scaled how
fast `travelFatigue` came off, and nothing in this build ever put any on, so the
axis that looked wired had the emptiest reader in the game. The dial went in the
wellbeing sweep, the case went with it, and the axis has now followed both.

---

## Dead: named, and confirmed

**`prestige`** was one of seven reputation axes and is deleted. Every honest
reader for it was a reader something else already had: put it on the sale and it
is `audienceAppeal` under another name; put it on who gets called and it is
`publicFame`. It was awards-and-critics standing with no awards and no critics,
so inventing a seventh reader to finish the row would have been the disease
`DEPTH.md` is about, performed on the page about the disease.

This entry used to end "it stays declared until there are". What changed the
answer was measuring it: written for 87 of the 146 people in a played save, read
by nothing that decides anything, nought on the player for a whole career — and
`looks/standing.tsx` printed it while calling it "an economy of its own". A dial
that lies is worse than no dial. `docs/AWARDS.md` holds the design, costed, for
the day something reads it. Six axes now, and `controversy` is the one that
stayed dead-but-declared, because two live mechanisms already read it and
nothing ever raises it.

**Six trait modifier keys** across 445 traits, and all six are consulted:
`energyRecovery`, `recoveryRate`, `sleepQuality`, `stressGain`,
`stressPerShootDay` and `stressRecovery`. Every one is read in `systems/life.ts`
and in no other file, at seven call sites.

**It was fifty-three, and forty-seven of them have been deleted.** Everything
below this paragraph is the state before that, kept because the reasoning it
records is the reasoning that was overturned — the argument for keeping them was
that a dormant knob is dormant *on purpose*, and the thing that settled it was
asking who a dormant knob could ever wake up for. Nobody. Every person the
generators write gets `traits: []`; the only holder of a trait in the save is the
player, who is a prodigy whose sheet starts at the ceiling and whom
`favourableOnly` already protects from anything subtracting. A knob no system
reads was not waiting for a system. It was waiting for nothing.

One hundred and thirty-two entries went, across seventy-three traits, and forty
traits lost `systemMods` entirely rather than carrying an empty object that reads
as a promise. Six higher-is-worse guards went with them, because a guard exists to
flip the sign on a key and a guard on a key no trait declares is — in the words
already written above it — a rule about a word, kept after the word went. What is
left is two guards and six keys, and `tests/taste.test.ts` now asserts the strong
form: no declared knob goes unread, in either file.

Two of the forty-seven shared a name with a field on `Person.reputation`,
`audienceAppeal` and `professionalReputation`, which is how a wide grep reads them
as live and how they were nearly kept. A knob and a field can share a name and
share nothing else. The fields are untouched and are two of the four standings the
same run of work gave a second direction to.

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
- ~~**The whole wellbeing model.**~~ **Stale, and stale in the direction that
  matters: readiness reaches the career now, not just the room.** This line said
  "the dials feed nothing but readiness, and readiness feeds nothing but the
  room", and it is wrong on the second half and on the first.

  Readiness has three readers. `heardItRight` is the original one — how ready the
  player is decides how surely they took in the one note anybody gives them.
  `whatTheWeekTook` is the one that changes the shape of it: a week worked below
  `A_WORKING_WEEK.spentAt` **costs reliability** and a week above it earns it, so
  a run of exhausted weeks is a record of how somebody works. And reliability is
  read twice by things that decide — `remembersYou`, where being unreliable is
  the only thing in the build that can take work away from somebody perfect at
  the work, and `castsReliability`, which feeds the slip model, so a picture cast
  with tired people runs over more often.

  The dials feed more than readiness too. Energy gates `life.train` at
  `TOO_SPENT_TO_TRAIN`, and training moves fitness against a ceiling that falls
  with age — which is also where the answer to "age decides nothing" ended up.
  So the chain runs wellbeing → readiness → reliability → what you are offered
  and whether the picture wraps on time, and none of it was there when this line
  was written.
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
- ~~**The tax engine is a screen.**~~ **Nothing about it is, any more, and this
  line has now been wrong twice in one day in two different directions.** It first
  read "nothing taxes a fee, a wage or a company's profit", which had become two
  thirds false: the group pays corporation tax at `CORPORATION_TAX` of 20% filed
  in May, wages carry Tryggingagjald at 6.35% on the group's payroll and the lot's
  posts, and VAT is filed and reclaimed on a real return. It was corrected to say
  income tax on the player was the one tax still unwired — and then the banking
  build wired it three commits later, which made the correction false too.

  `computeAnnualTax` is charged now. `settleTheReturn` assesses a person on what
  their accounts actually took in the year gone and posts the bill out of the
  pocket that can stand it, in the June after the year it was earned, for
  everybody in the save rather than only the player. Measured over twenty-five
  played years: EUR 227,263 off a career grossing EUR 938,000, and EUR 14.5m off
  the parents against the EUR 26.6m they drew from the board.

  The lesson is not about tax. **This entry was falsified by the same session that
  wrote it**, which is what a live page does when it is edited faster than it is
  re-read, and it is the third time in this run of work that a claim about the code
  outlived the code. Read anything here against the tree before trusting it.

  Iceland is at least IN the tables — it was in none of them, so the home screen
  told a player living in Mosfellsbær that Iceland taxes a wage at 0% and charges
  no sales tax — but a correct table nobody is charged from is still a screen.

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
  **and the history table is a sleep diary.** **Deleted.** Measured rather than asserted, and
  the truth is sharper than the claim in both directions. Structurally it is a
  sleep diary exactly: `universe.history` has **one writer in the whole engine**,
  `systems/life.ts` inside the sleep command. In practice it holds **nought rows
  after twenty-five played years**, because that writer is a command the player
  presses and a career that only acts never presses it. Its only readers count
  its length for the save-size estimate and relabel it on migration; **no screen
  reads it**, so nothing a player does is ever shown back to them from it.

  That is the audit trail's shape again — persisted, validated, counted in the
  size estimate, read by nobody — with one difference: the audit trail had zero
  writers *and* zero readers, and this had a writer that works.

  **It went anyway, and the deciding fact was `Historian.timeline`.** A query
  API with category, refId, significance and limit filters, carefully built, and
  **no caller anywhere in the tree**. A retrieval surface that considered over a
  table nobody opens is the audit trail again by a longer route. So the second
  half of `core/audit.ts` followed the first, the file is gone, `sim.remember`
  is gone, the `history` id namespace is gone — nineteen now, from a hundred and
  twenty-five — and `history` came out of `APPEND_ONLY_LOGS`, which is the
  rollback path, so the cut had to be right rather than merely tidy.

  A pre-cut save was the proof, exactly as the audit cut proved itself: it
  migrates, validates with zero errors, reloads, and its stale array survives as
  inert JSON. No schema bump. What the log was for — years later, the player
  looks back at where they lived and what they made — is a good feature and is
  worth building the day there is a screen that asks for it. It was not this.
- ~~**`Audition.took`** is written and read by nothing, in the save record of the
  system the game is named after.~~ **Stale — the field is gone.** It is not on
  `Audition` any more; the only `.took` left in the tree is `Answer.took` on a
  casting offer and `Split.took` on the selling tiers, both live.
- ~~**The guild signature is a gate with no money behind it.** The content says
  what the agreement costs and nothing charges any of it.~~ **Stale.**
  `company.sign` calls `payFor` with the guild's own `depositCents`, so signing
  charges the deposit. The handoff had already flagged this line as stale and it
  was never struck through, which is how a page rots.
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
- ~~**The collective floor under an Icelandic fee.**~~ **Built.** It was a
  sentence and not a number — two rows in `content/incorporation.ts` carrying
  `binds: 'The collective floor, holiday pay, and the mandatory pension
  contribution'` with no figure anywhere, and no fee in the build ever checked
  against a minimum. It is a figure now: `A_MONTH_AT_LEAST_ISK` of 425,000,
  carried to a week as `SCALE_A_WEEK_CENTS`, and `feeFor` takes the greater of
  the share and `weeks * SCALE_A_WEEK_CENTS`.

  The way it was reached is the part worth keeping. A small part on a low-spend
  booking was paying **three hundred and sixty-one euros a week**, which is below
  the law rather than merely mean, and nothing in the build could have noticed
  because there was no minimum to notice against. **`canWorkIn` was stale on this
  line too** — deleted in `bcbf271`, with `workRefusalFor`, a duplicate
  `countryOfCity` and the five tests whose own header admitted nothing called the
  rule.
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
- ~~**Nobody can see the booking board**, which is the only pipeline the career
  has. The lever is money spent a year early and its effect is invisible until it
  arrives as one notification.~~ **Fixed.** The Stages table on the estate look
  said who was in a room *right now* and stopped, which is a board that cannot
  be read ahead — and the lot is the only pipeline a career has: every part the
  player is ever asked about comes from a production that booked a stage here,
  months before anybody rings. It carries what is booked after today as well
  now, off `bookingsFor`, so the money spent on being known has somewhere to
  show up before the notification arrives.

- **Three more guards at points the arithmetic already settles.** **Left, and
  the reason is worth recording:** the entry names none of the three and its
  cross-reference — "the same fault as the crowd guard below" — points at an
  entry that is no longer on this page. An item that names nothing and cites
  nothing cannot be verified or cleared, and guessing at which three guards were
  meant would be inventing an arrears rather than paying one. It wants naming
  before it wants fixing.
- ~~**Three signable guilds, a registry, a policy and a company form** can be
  reached only as a blocker chip — which is fine, because the chip carries a
  working control.~~ **It was not fine, and the count was short by a policy.**
  The chip does carry a working control and a player who presses what the panel
  offers does go from two doors to nine — that measurement stands. What it misses
  is that a chip only appears for something a shut door is waiting on, and
  walking every door open leaves three of the four signable guilds, one register,
  **two** policies and a company form named by no blocker ever. A
  fix-what-is-broken affordance was being used as the only shop, so forty-odd
  lines of authored content apiece could not be bought by any route a player
  could walk.

  The `register`, `guild` and `cover` pages already printed every fact about each
  one and carried no action. They offer it now, and the refusal under the button
  is `whyNotRegister` / `whyNotSign` / `whyNotInsure` — the same functions the
  command handlers were rewritten to call, so the screen cannot offer what the
  engine will refuse.
- ~~**The reimbursement's under-18 case**, which needs a picture to declare an
  audience.~~ **Said plainly instead.** `content/incorporation.ts` states that the
  higher rate is for audiences of eighteen and under, "which SLATE doesn't model:
  no picture declares an audience." A note describing a rule the engine cannot
  apply is a note that lies.
- ~~**The unscripted contributor cast board**~~ — **built, and it was more than an
  inventory line after all.** This entry said it was one, on the grounds that
  everything downstream was written to be right the day the screen existed. That
  was true and it missed the cost of the screen not existing.

  Measured: an unscripted season carries no `roles`, so `castOf` returns nothing
  for it, so **all five cast terms the sale reads came back undefined** — appeal,
  controversy, spark, truth and reads. A third of every career's pictures were sold
  on the negative and the deal alone, blind to who was in them. The absence was not
  neutral; it was a whole axis of the sale switched off for one of the three forms
  this game makes.

  Three of the five read the board now and two deliberately do not. Appeal,
  controversy and spark are questions about people. `truth` and `reads` ask
  `wantsOn(role, axis)` — what the written part wanted — and a format has no part
  to want anything, so they stay undefined and the code says why.

  The warning this entry rested on still stands and was not taken back: a flag
  reading true for both would say something false. What made the build possible is
  that `Plan.cast` was a union rather than a boolean, which is the design
  anticipating exactly this — the format season says `'contributors'`,
  `castsPerformers` is still only `'performers'`, and no role is laid, no audition
  armed, and no slot offered to the player. Being on a format's cast board is a job
  and it is not this job; the refusal says that in those words.

  Twelve people, one at a time, out of a pool of civilians. Nothing is charged for
  them — the casting period already spends 12% of the budget on filling the board,
  and billing a contributor on top would charge the same money twice. Once the
  field starts the board is fixed.

### Found by measuring rather than by reading

This one is here because it is the only place a defect could still come from.
`docs/ARREARS.md` is verdicted through, this page is verdicted through, and
`docs/UNWIRED.json` reads nought on every row — so the lists are exhausted and
what is left is running the game and looking at it.

**The instrument was measuring a derelict house, and had been for its whole
life.** `playACareer` trains two hours a week and answers every ask, and it never
once had the work done on the roof. Over twenty-five years, one seed at a year's
resolution:

| | year 15 | year 20 | year 25 |
|---|---|---|---|
| house condition | 34 | 21 | 0 |
| body condition | 80 | 53 | 0 |
| energy | 25 | 0 | 0 |
| stress | 4 | 25 | 90 |
| morale | 52 | 22 | 0 |
| fitness | 94.0 | 36.1 | 0.0 |
| readiness | 43 | 20 | 11 |

Everything after the roof is downstream of a night's sleep. And the fitness row
is the one that matters most, because it is not simply a low number: once energy
is under `TOO_SPENT_TO_TRAIN`, `life.train` refuses every week, so the only thing
that raises fitness stops working and the dial ratchets to the floor with nothing
able to put it back. **Read off the endpoint, that is
`w.fitness is a one-way ratchet to zero` — a claim this project has recorded as
built, and which the dial passes the moment the character can train.** A
measurement that reproduces a fixed defect is the most expensive kind of wrong.

`playACareer` keeps the house now, and `letTheHouseGo` turns it off for the A/B
that `tests/house.test.ts` runs. Kept, the same seeds end: house 99, body 94,
energy 25, stress 4, morale 100, fitness 86.6 against an age ceiling of 89.1,
readiness 49. Over the full career the figures that had looked like defects come
back as ordinary: professional standing 53 and 61 rather than 2 and 1, reliability
72 and 73 rather than 63 and 58, fitness 88 rather than 0.

Two notes for whoever measures next. The default is on because a player told "the
condition is the one figure in this house that moves on its own, and left alone it
only moves one way", holding EUR 1.2m, keeps the house — the rotting career is a
real way to play and it is not the ordinary one. And `haveTheWorkDone` charges by
the point and refuses when there is nothing to do, so calling it every week is the
cheap end of keeping it rather than a restoration bill.

**The business half came out clean on the same pass**, which is worth recording
because it is the half with the money in it: 36 and 37 greenlit, 34 and 35
delivered, no week under water, the group holding EUR 2.81bn and EUR 2.86bn
against a year's profit of EUR 128m and EUR 152m, 1,915–1,930 stage-weeks taken
of which 147–153 are load-out, and the same four offices that can never book on
either seed.

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

  | seed | greenlit | delivered | lowest cash | ended |
  |---|---|---|---|---|
  | b1 | 36 | 33 | −€5,903,416 | +€138,680,188 |
  | b2 | 36 | 34 | −€9,960,698 | +€221,186,198 |
  | b3 | 37 | 33 | −€9,834,132 | +€850,307 (mid-drawdown, €78m still owed) |
  | b4 | 36 | 33 | −€5,860,533 | +€127,717,198 |
  | b5 | 36 | 32 | −€9,834,047 | +€156,369,268 |

  So the overdraft is real, is six to ten times the figure this page records,
  and is reachable inside the first year. And the company runs away: **thirty-six
  pictures in twenty-five years on every seed**, ending on nine figures wherever
  it is not caught mid-drawdown.

  **An earlier version of this entry said the number of pictures ran from seven
  to thirty-six on seed alone, and that one company in five stalled and never
  recovered. Both were wrong, and both were the instrument.** `playABusiness`
  asked for a twenty-million budget every week regardless of what stood behind
  the company, and `greenlight` rightly refuses a budget larger than the cash
  plus the family's remaining patience — so a company that dipped early asked
  the same impossible question for fifteen years and was told no every time.
  Sizing the ask to the money takes that seed from seven pictures to thirty-six.
  There was no trap and there was no spread; there was a loop that could only
  ask for one number. The runaway is the finding that survives, and it is
  stronger for being on every seed rather than four in five.

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

  **Still true, verified rather than assumed.** `world/company.ts` says so in its
  own words — *"`world/company.ts` schedules nothing. A registration never
  lapses, a policy bound in 2026 is still bound in 2046"* — and the fields to
  hang it on are already there and already read: `endedAt` filters
  `registrationsOf` and `signaturesOf`, `lapsedAt` filters `policiesOf`, and
  nothing ever sets either.

  **Built, on the third attempt, by being smaller than the first two.** It failed
  specification twice by trying for a general lapsing engine whose scaffolding
  moved the numbers it was meant to measure. What landed instead ends the two
  things the sentence above actually names, and ends nothing else — both already
  carried the date they end on, and both of the filters that hide them already
  existed with no writer.

  **An option runs out.** `Holding.expiresAt` is eighteen months and was read by
  nothing. `runTheClock` reads it, stamps `lapsedAt`, and `holdingsOf` filters
  on that, so `own_material`, `deliver` and `greenlight` shut behind it. The
  greenlight beats the clock by exercising the option — committing to a picture
  buys the rights outright, which is what a producer does with the money, and is
  what makes it safe: a picture in production can never lose its material, so
  the mistake is hesitating rather than making something. Warned sixty days out.

  **Cover has to be renewed.** `Policy.renewsAt` is twelve months and
  `Policy.lapsedAt` was, in its own docstring's words, the purest example in the
  file of a guard no reachable input could trip. The premium is charged again
  now, out of the same content figure `company.insure` charges the first time —
  **EUR 1,392,000 over twenty-five played years**, on a company that used to pay
  each premium once and hold the cover for ever. Renewal is automatic while the
  company can pay, because six buttons a year is a chore rather than a decision;
  a company that cannot find the premium gets a month of grace with the date
  said out loud, and loses the cover if the month goes by.

  Two bugs fell out of it, both latent until a clock existed. `company.develop`
  linked a project to its rights only when passed an explicit `holdingId`, which
  nothing passes — so a company that optioned a title and developed the same
  title made a project with no link to the option it was obviously for, sitting
  in `idea` because `stage: holding ? 'optioned' : 'idea'` was a branch nothing
  could reach. And the renewals sweep was `category: 'business'`, which put it on
  the player's own calendar of things they have to be at.

  **And the registrations, which was the deferred half.** `Registration.endedAt`
  had no writer in the engine at all — the only one in the tree was a test setting
  it by hand to prove the filter worked. The question it was deferred on was what
  it should cost to stay on the register, and the answer is not money: what gets a
  company struck off is that nobody filed. The annual return is signed by whoever
  answers for the company, so a year with nobody in the principal's chair, plus a
  month of grace, and it is off the register.

  The first version got two things wrong and both are worth keeping. It charged
  `REGISTRY_BY_ID[...].cost` on every filing, which is the one-off fee for getting
  *on* the register — so a company paid its formation fee again every year and the
  measurement came back at **EUR 3,120,000** over twenty-five. A recurring charge
  built out of a one-off figure is a number that looks researched and is not. And
  it gated the filing on the accountant, which read well and made a third seat
  mandatory in a save with three relatives: six tests went red on a scarcity
  invented by a lapsing clock rather than by anything about lapsing.

  It also had to be given teeth. `trade` is the door the company register sits
  behind and **nothing outside `world/company.ts` has ever read it**, so the first
  working version struck a company off and it went on greenlighting pictures for
  another twenty-four years. The greenlight asks for the register now, which is
  what being struck off means.

  **Guild signatures stay, and that was decided rather than forgotten.** Everything
  else here ends on a date it already carried; a signature carries a deposit and
  nothing else, because you are signatory until you breach rather than until a year
  is up. The hazard is named on the field itself: the day a guild can pull a
  signature is the day Global Rule One starts biting backwards on a cast already
  seated.
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
- ~~**The strike week is booked as prep**, and `RATE_SHARE.hold` is dead. `DEPTH.md`
  records this one as fixed; only the prep third of it was.~~ **Both halves are
  done, and by opposite answers.** `hold` was deleted: a table that throws when
  anything reads it, run across eighteen played years and the whole suite, was
  read seven hundred times for `shooting`, a hundred for `prep` and never once
  for `hold`. The strike was built: `BookingKind` has a word for a load-out now,
  `book()` writes it as its own row, and `quotedFor` splits the term instead of
  folding the strike weeks into the prep one — the total is unchanged, and what
  changes is that the quote and the rows agree about which rate is which.

  The reader is the part that made it worth doing rather than relabelling.
  `Utilisation` carries the strike weeks and the estate screen says how much of
  the month anybody was on a stage was somebody taking a set down. Turnaround is
  a real occupation of a room that reads as an empty one: the stage cannot be
  let, and the weeks go at the build rate, so a month two thirds full at half the
  money is usually a month with a lot of load-out in it.

  A second dead word went with it. `foregone()` — "what the lot gives up by
  housing its owner's picture" — was exported from `world/making.ts` and called
  by nothing. It is `Utilisation.ownWouldHaveLetFor` now, beside the weeks it
  prices, and the screen names the figure.

  And the test that was written to catch this could not see it. It asserted that
  prep rows outnumbered shooting rows and sat at the prep rate — both true of the
  bug, because the two rates are equal. It is structural now: a build abuts the
  start of a shoot, a load-out abuts the end of one.
- ~~**A directed night's sleep is added on top of the autopilot's**, which inverts
  the contract its own comment states, and the guard written for it has no
  caller.~~ **Stale.** `life.sleep` sets `lastSleptAt`, and the unattended day
  only sleeps somebody when `sinceSlept >= 20 * MS_HOUR`, so a deliberate night
  blocks the automatic one for the rest of the day. The guard has a caller and it
  is that comparison.
- ~~**The house rots with no repair**, and the screen tells the player it is their
  fault for a choice they do not have.~~ **Cleared**, and half of it was already
  stale when it was cleared — see "Recently on this page, and no longer" below.
- ~~**The creation screen, `taste.ts` and the engine give three different counts**
  of which personality axes do anything — and the screen's copy exists precisely
  to be honest about that.~~ **Cleared by there being one count.** The four that
  did nothing are deleted, so the screen asks three, `taste.ts` reads three and
  `Personality` holds three. Nothing has to be honest about a discrepancy that no
  longer exists.
- ~~**`whereTheCrewStands` counts strangers as returning hands**, and no screen
  reads it. Both halves of the One Rule at once.~~ **Both halves stale, and one
  was backwards.** `looks/business.tsx` prints it, so a screen reads it. And the
  function's own comment records the fix: it undercounted, saying six returning
  hands where there were eighteen — the opposite of what this line claimed.
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
- ~~**The room's want is drawn from nothing**, so the opening reading is a constant.~~
  **Stale.** `HOUSE_HOLDS` gave a holder a taste: seven tenths of each shade is
  the same across everything one office casts, so what they asked for last time
  is a real handle on the next one and dead center stopped being the best
  opening against every room at once.
- ~~**A part is priced off the stage rate card** — what the room costs, not what the
  cast costs.~~ **Fixed, the way `feeFor`'s own docstring said to.** The booking
  now carries `spendCents` from the enquiry that took the stage, and a part is
  priced as its share of a cast pot that is `CAST_SHARE` of that spend.

  The obvious fix — dividing the room out — was already built and refuted here
  (+0.934 to −0.044, because floor area *was* the proxy). Carrying the real
  spend is the other version, and it measures: rank correlation between what a
  production spends and what it pays a lead or support goes **0.292 and 0.511 to
  0.995** across two seeds of twenty-five played years, and the same guest part
  now pays the same whatever room happened to be free.

  **Calibrated to hold the level, not to raise it.** Across 361 parts the old
  fees came to €3.16m and €3.00m; the new ones come to €3.47m and €2.75m — ten
  per cent over on one seed, eight under on the other. The first attempt was
  fitted from a mean of per-part ratios and doubled career earnings, because a
  mean of ratios is not the ratio of means; the divisor is fitted against the
  total instead. Connecting the fee to the money and giving the player a pay
  rise are two changes, and this is only the first.
- ~~**Two functions answer whether the player is free, and they disagree.**~~
  **Cleared.** There were three, and the disagreement was 40.5% of spans — see
  below.
- ~~**The casting office is a display string**, so an office's identity is its own
  prose and its taste is seeded from it.~~ **Fixed, and the reason to fix it was
  the last clause of this entry.** Nothing showed the split biting, which is why
  it sat here for so long — but "editing the copy silently moves the simulation"
  is a standing hazard on a project that rewrites its own prose weekly. Every
  memory function keys on `Enquiry.officeId` now, `holder` does nothing but
  print, and a test rewrites an office's sentence and checks that what the player
  has built up with it survives. Schema 81 matches old rows on the sentence, once.

  **And four of the ten shapes never book on the lot as the family built it** —
  the Icelandic documentary on price, the European commercial and the streamer
  documentary on the rebate against what it costs to bring a crew here, and the
  Nordic series on price. Thirty-six of a hundred and one in enquiry weight.
  That is the premise working, not dead content: every refusal is counted and
  shown. What was wrong is that `turnedAway` buckets by reason, so the board
  could not tell three standing customers it cannot serve from a run of awkward
  weeks. `keepsRinging` names them now, with the reason each gave, which is also
  what makes building a room readable: the fifth stage recovers exactly one of
  the four and the three foreign ones go on ringing.
- **The posts cost nothing and nobody has to say yes.** **Half fixed, and the
  half that is fixed is the money.** `ROLES` carried a `monthlyCents` on every
  row — nine thousand for a head of development, eleven for a head of
  production, ten for business affairs, seven for the facility manager — and
  nothing read one, so a company staffed itself completely on its first morning
  for nothing and the capability doors behind a filled post opened free.
  `chargeThePosts` bills them on the month now, off the same figures, and it
  comes to €3,289,000 across twenty-five played years.

  The clearest single case of what that fixes: **a save opens with the facility
  manager already in post**, running the lot from the first morning, and until
  now they were free.

  **Nobody having to say yes is built too, and separately, for the reason it was
  held back:** an offer and a refusal is a decision with a shape. Three reasons,
  all read off the world. They barely know you — no bond at all, which is every
  one of the sugar group's five executives, any of whom could be made head of
  production. You stopped keeping up with them — `closeness` under forty, which
  is `Cordial` in `STANDING_BANDS`, and which is the reason that costs
  something, because closeness is a record of what the player did rather than a
  fact about the save: four missed plans takes the opening 72 under the line, a
  parent who moves out rests at 25, and warming it back is six a kept plan. And
  they are already somewhere better, ordered by `monthlyCents`.

  With it, the constraint this file has described from the beginning finally
  costs something: **six posts, three relatives, and whoever you put in one is
  not doing the other thing they were doing.** `post.personId = person.id` never
  emptied the seat somebody already held, so one relative could hold all six and
  every door behind them opened. One seat per company now — per company, because
  both parents sit on the sugar group's board as well and those are not
  competing jobs. Thirty-eight tests went red the moment that question was asked
  of the right company, every one of them a helper putting one person in two
  chairs a door each depended on. Only the head of production and the accountant
  gate a door, so three people is still enough to open all nine. By one.

---

## `A_WORKING_WEEK.spentAt` divides something now, and it was not moved

It sat on the open list as a threshold no played career could hold: mean
readiness by third ran 47.7 / 38.9 / 16.7 on autopilot and 49.2 / 47.8 / 35.3
for a player managing sleep deliberately, so **both ended under thirty-eight**
and the number separated nothing. The obvious answer was to lower it.

That would have been wrong, and the reason is the house. `property.condition`
fell every day with nothing that raised it, `sleepQuality` read it, and every
career ended worn out whatever the player did — so the threshold was not badly
chosen. It was the only honest reading of a world with one outcome.

With `life.upkeep` there are two. Three seeds, twenty-five played years:

| | readiness by third | weeks under the line, of 1300 | reliability at the end |
|---|---|---|---|
| let the house rot | 45.7 / 41.8 / 18.0 | 498–549 | 0 |
| keep it up | 47.8 / 47.9 / 46.8 | 58–74 | 91–97 |

Thirty-eight now sits between them. **Unchanged, deliberately:** a number that
divided nothing because the world had one outcome does not want moving once the
world has two, and the entry is cleared by the fix landing somewhere else
entirely.

---

## The six decisions, taken

The owner handed these back to be decided rather than costed. They are recorded
with their reasoning because a decision without its reasoning is a preference,
and the next person to disagree with one of these should be able to find out
what it was weighed against.

**1. Income tax does not charge. Blocked on sinks, not on appetite.** It would
take 34.0% — €605,928 of a €1,781,243 career. But the player has almost nothing
to spend money on: `life.upkeep` is the only command in the build that spends
their own money on themselves, and they cannot chase a bigger fee to make up
the difference, because `feeFor` prices off the stage rate card and their quote
is not read. A 34% drain would move the number and not one decision, which is
the failure the falsifiability test exists to catch. Wire it the day money buys
something.

**2. The family's patience stays as it is.** The proposal was to make it a hard
input to the greenlight door. Measuring killed it: the company already runs
away — thirty-six pictures in twenty-five years on every seed, ending on nine
figures — so the constraint is not missing on the downside, and a harder wall
would only bite the case that is already working.

The first version of this reasoning also said that one company in five stalls
under `GREENLIGHT_FLOOR` and never recovers, and that a harder wall would make
such dead saves commoner. **That was the instrument and not the game** — see the
correction under "The company can pay the player money it does not have" above.
The decision is unchanged, but it now rests on the runaway alone rather than on
a trap that does not exist.

**3. `far` is left alone and the sentence that sold it is corrected.** Asked to
pick rather than diagnose, the diagnosis is the pick: the button was never the
defect. Measured over three seeds of twenty-five played years, 1,707
shade-wants, the distribution is **nought 19.9%, one 33.0%, two 23.5%, three
23.6%** — against copy claiming about half want a good deal and two in five want
more. Both figures were wrong.

And the reason `far` wins no seed is not that it is rarely right. It is right
**as often as `good` is**, 23.6% against 23.5%. It loses because the commonest
note wants **one** step and `far` misses that by two: mean error 1.49 steps
against 0.91 for `touch` and 0.96 for `good`. That 6% gap between `touch` and
`good` is the whole of why they split six seeds three-three.

So a high-variance play that is usually wrong is a real thing to offer somebody;
telling them it is right two times in five when it is right one in four is not.
The copy now says the measured thing. **The want distribution was deliberately
not touched** — making big wants common so that a button looks better is tuning
the world to fit the interface.

**6. The company must stop out-earning the career, and the lever is named.**
Measured: of 31 and 33 pictures sold, 4 and 11 returned less than their
negative — so pictures do fail. But the slate returns **1.44× to 1.63× the
negative in aggregate**, reliably, and the company keeps all of it, which is the
engine of the hundred-to-one. €620m of negative returned €1.01bn; €660m
returned €949m.

The specific lever is this: **the family finances the first pictures and never
recoups.** `greenlight` refuses a budget larger than company cash plus
`stillToCarry` — the family's remaining patience — so the first €20m picture is
the family's money, its return goes to the company, and from then on cash
dominates and the slate is self-funding forever. The waterfall already models
exactly this idea for the distributor and for the negative; the family is the
one financier in the build with no tier in it.

**Built — and it did not do what it was built for.** `familyTakesItBack` now
repays the family out of surplus, keeping back only what is owed on work in
progress plus `GREENLIGHT_FLOOR`, both read from the build rather than picked.
Measured over the same five seeds:

| seed | ended before | ended after | family repaid | patience left |
|---|---|---|---|---|
| b1 | €196.6m | €188.2m | in full | €56.4m |
| b2 | €0.13m | €0.17m | **no — €136m still owed** | €0 |
| b3 | €162.8m | €101.8m | in full | €74.4m |
| b4 | €141.4m | €125.0m | in full | €56.4m |
| b5 | €177.2m | **€206.1m** | in full | €77.0m |

So it lands — the family is repaid on four seeds in five and the patience comes
back — and **the runaway is not fixed.** One seed even rose. The reason is
arithmetic: the family puts in tens of millions and the slate earns hundreds,
so recouping the financing barely touches the surplus.

**The second claim made here has been retracted.** It said the absorbing state
was not fixed either, because b2 never reached surplus and so never repaid.
There is no absorbing state: b2 was stuck because `playABusiness` could only ask
for twenty million, and sizing the ask to the money takes it to thirty-six
pictures like every other seed. The table above is from the instrument before
that was corrected, which is why b2's row reads as it does; the numbers on the
other four rows stand, and the conclusion — that repaying the financier does not
touch the runaway — stands with them.

It is kept anyway, on its own merits rather than the one it was built for: a
financier that never recoups is a modelling error whatever it does to the
balance, and this was the **fifth one-way ratchet** this build has found and the
only one on the money. `paidInSoFar` rose forever and `stillToCarry` fell
forever; both move both ways now.

**And the framing that motivated it was overstated.** "A hundred to one inverts
the premise" does not survive scrutiny: a company that makes thirty-five
pictures across twenty-five years being worth €190m is not obviously wrong, and
the player owns it either way — which is false, and is the finding below: they own
nought percent of it. The real question is whether producing makes
acting pointless — which is a question about what this game is, and the honest
answer is that it should not be settled by quietly moving `ultimateFor`, a curve
the content file marks as **SLATE's own** rather than anything researched.

The measurement that matters stands and is recorded above: pictures gross 3.2× to
5.6× their negative on the mean, sublinearly in the budget, and the slate
returns 1.44–1.63× after the waterfall.

**And it was the wrong question, which one further measurement settled.** The
multiple was never moved and should not be. Asked who actually receives the
slate's return: over twenty-five years a company that greenlights thirty-six
pictures and delivers thirty-three ends holding **EUR 238,755,876**, and the
player who ran every one of them ends with **EUR 700** — the balance the save
opened with. They hold **nought percent** of the company, because the parents
built it and the parents hold it, and **EUR 1,540** reached their own accounts in
a quarter of a century.

So the company was not out-earning the career. It was earning money the career
could never reach, and there was no mechanism of any kind — no dividend, no
ownership, no fee. Moving `ultimateFor` would have changed how much money the
player could not have.

**What landed is the line every picture actually carries: a producer's fee.**
Three percent of what the picture was greenlit at, paid across the schedule to
whoever holds the principal's chair, out of the budget rather than on top of it —
so a picture is made for ninety-seven percent of its number, costs the company
exactly its number, and three percent of what was going on the screen goes to the
person who made it instead. Measured: **EUR 19,047,915 to the player over
twenty-five years** where they hold the chair, against EUR 700 where they do not,
with the company still ending on EUR 238m for the family that financed it.

It is sized against acting rather than against the slate, which is the whole
answer to whether producing makes acting pointless. Three percent of a
twenty-million feature is EUR 600,000; a lead part on the same picture is about
EUR 878,000. So producing pays a little less than a good part, per picture, and
the return on the bet stays with the people who took it.

Two things had to be built for it to be reachable at all. The chair could not be
taken — a parent holds the principal from the first morning and `fill_post`
refused with "Somebody is already the principal", so the fee's recipient could
never be the player. Whoever is in a seat can be asked to stand down now, and it
reads the same `closeness` that consent does, so the chair the money is attached
to is held by a relationship. And nobody in this save had an account to be paid
into: `purseFor` moved out of `world/sugar.ts`, where it had been written for the
board's monthly draw, into `world/money.ts`, because the family generator writes
people and gives none of them a bank.

**4. `prestige` is deleted.** Written for 87 of 146 people, read by nothing that
decides anything, nought on the player for a whole career — and the standing
screen called it "an economy of its own" while showing a number that never
moved. A dial that lies is worse than no dial. The design survives in
`docs/AWARDS.md`, which is the audit trail's precedent exactly. `tools/dials.mjs`
falls from 8 to 7.

**5. The player's fee is not floored at their quote, so the player's quote is
deleted.** The floor measures at ×2.32–3.56 of lifetime acting income, which is
a different game rather than a tuning, and it would make the player's pay a
number that only ever rises — the fourth one-way ratchet this build has found.
`c459c2e` already proved the obvious fee fix was backwards. Answering the
question is what made the field dead, so it went with the answer instead of
outliving it. `Person.quotes` stays: every other person in the save is priced
through it.

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
