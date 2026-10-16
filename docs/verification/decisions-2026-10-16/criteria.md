# The Owner's Approved Decisions: The Criteria, Written Before Any Change, 2026-10-16

The owner's brief 10, "Implement The Approved Acting, Advice, Banking, And Stamina Decisions"
(`../briefs-2026-10-16/10-approved-acting-advice-banking-and-stamina-decisions.txt`, kept verbatim), authorizes
decisions 1, 2, 3 and 5 of brief 09's For The Owner (`../integration-2026-10-16/brief-09.md`, section 8), and leaves
decision 4 unchanged. This file was written and committed before any code, content or tool changed for the brief, on
`44dcd973` (#36's merge). Nothing here is changed afterward to make a measurement pass: a criterion found wrong after it
has been measured is reported, and any correction is the owner's.

**Superseding, not erasing.** ST3, ST6, H4 and L3 as written stay in the record with every result they had
(`../integration-2026-10-16/st3.md`, `st6.md`, `h4.md`, `l3.md`, and the completion matrix's rows): not met. The
replacements below, ST3-R, ST6-R, H4-R and L3-R, supersede them from this brief on; an original's failure stays its
failure, and the matrix shows both, the original marked superseded.

**How thresholds are set.** A property with no draw (the same inputs, the same output) is required on every case, with
a tolerance of 1e-9 at full precision: the floating-point noise measured on these judgments is 3e-14
(`st3.md`), and the display's half-step is 0.05, so 1e-9 sits five orders above the one and far below the other. A share
of a population (materials, pieces, cases) keeps the owner's own figure where the original criterion had one (25% for
ST6, 60% for H4, 80% for F2), as a floor and not a target, and every new figure is argued beside it. "Ahead" means ahead
at full precision by more than 0.05, half a displayed tenth, as H4 and ST6 have measured it since phase 2b.

## 1. The Acting Criteria

### ST3 → ST3-R, Consistent Evaluation

**ST3 as written** (`../stage-2026-10-16/criteria.md`): the voice-and-body specialist better on stage than at a close
frame; an even actor's result the same on both. Last measured 178 of 189 the same as shown (`../integration-2026-10-16/integrated-09/`): not met.

**ST3′ (proposed in brief 08) against the owner's requirements.** Its (a) is the stage's legitimate demand; its (b) is
identical inputs across the two media; its (c) bounds the even actor's difference under half a rounding step. It falls
short in two places: (c) bounds a difference without saying where it comes from, and the owner asks that every
difference be attributed to an intended input or rule; and nothing in it would fail if the stamina drain or the stage's
lean were removed to make the shown results agree, which the owner rules out. So it isn't adopted as it stands.

**ST3-R**, on every class scene and play as a class scene, every side that fits, the grain held at nothing so the
medium's own lean is compared (as ST3 measured):

- **(a) Identical inputs, identical results.** The same piece, actor, preparation, way of playing, day and medium judged
  twice, judged after a save and a load, and replayed from its own record, give the same exact result (0 apart, or
  under 1e-12) on every case. An actor even in everything the formula reads, undrained, gets the same result on stage
  and at a close frame, under 1e-9 at full precision and the same as shown, on every case.
- **(b) Legitimate demands kept.** The voice-and-body specialist (85) does better on stage than at a close frame on every
  case. An actor whose stamina drains (55) shows a stamina part above 1e-9 on every case with a unit after its first.
- **(c) Every difference attributed.** On every case, the criterion's even actor's exact stage-less-close difference
  equals the sum of its named parts, each measured by changing one input at a time (the techniques' share against the
  abilities', the stamina drain under each medium's weights, and any further rule the tool names), with what's left
  under 1e-9.
- **(d) Rounded once, at the end.** Every shown result and every shown part is its own exact value rounded once, on every
  case: no rounding defect.
- **(e) It catches what it should.** Run in a copy against each of these, it fails: rounding twice or by floor (d);
  `STAGE_LEAN` and `CAMERA_LEAN` both 1 (b); the drain removed (b); the grain leaking into the comparison (a).

ST3's own clause, the even actor the same as shown, is still measured and reported beside it, as the record.

### ST6 → ST6-R, Viable Restrained Interpretations

**ST6 as written:** specialists at 85 come out ahead playing their own side on at least 25% of the materials where the
other side suits better: the expansive half met (22 of 50), the restrained half not (9 of 42). Not met.

**ST6′ (proposed in brief 09):** each specialist, playing its own side where the other suits better, ahead of an
equal-budget even actor playing the better-suited side, on at least 25% of those materials (26 of 42 measured).
**Against the owner's requirements it isn't enough.** A restrained specialist is strong in emotional depth, which
believability reads whichever side is played (`st6.md`), so it could beat the even actor on that alone in a judge where
choosing restraint did nothing: ST6′ would pass a system where restraint is useless, and the owner asks that the
revised test catch exactly that. It also asks nothing of preparation, circumstances, limits or diversity.

**ST6-R**, on the class scenes and plays where both sides fit. The restrained specialist is emotional depth 85, composure
75, focus 75, its other abilities lowered evenly to the even actor's budget; the even actor every ability at 50; both
fully prepared unless a clause says otherwise; "against the grain" is a material where expansive suits better.

- **(a) Viable.** Playing restrained against the grain, the restrained specialist is ahead of the even actor playing the
  better-suited side on at least **25%** of those materials. The owner's original floor, kept: often enough that a
  restrained artist has real opportunities, not so often that the scene's circumstances stop mattering.
- **(b) Restraint's own craft pays.** On at least **90%** of all materials where both sides fit, the restrained
  specialist's lift over the even actor (the same side for each) is larger playing restrained than playing expansive.
  This is what fails when restraint is useless: if choosing it drew on nothing, the lift would be the same either way.
  90% and not 100% because a draw adds nothing where the task already reads the drawn ability at full weight, and those
  materials are named in the report.
- **(c) Success depends on what it should.** Abilities: the even actor playing restrained against the grain is ahead of
  its own better-suited side on at least 10 percentage points fewer materials than the specialist is in (a).
  Preparation: with the restrained choice only half rehearsed in, the specialist's count in (a) is lower. Circumstances:
  its rate in (a) on the half of the materials with the smaller suitability gap is at least 20 points above its rate on
  the half with the larger gap. Interpretation: a win counts only where the restrained side is allowed by the material.
- **(d) Limits kept.** On at least 25% of the against-grain materials the restrained specialist's restrained take is
  behind the even actor's expansive one, and on those the expansive specialist playing expansive is ahead of the
  restrained specialist playing restrained on at least half: scenes where size is genuinely what works stay so.
- **(e) Diverse, independent examples.** The wins in (a) come from at least 6 distinct source works and at least 3
  register families, no one work giving more than a quarter of them, and the limits in (d) from at least 4 works.
- **(f) The other half kept.** ST6's expansive half as written: the expansive specialist ahead playing expansive on at
  least 25% of the materials where restrained suits better.
- **(g) It catches what it should.** Run in a copy against each of these, it fails: restraint's draws removed (b);
  restrained suitability forced to its least on every material (a or c); the grain removed (c or d).

No restraint bonus: a change to how restraint is read needs a source, as every draw in `APPROACH_EFFECT` has.

### H4 → H4-R, Meaningful Specialization

**H4 as written:** each specialist ahead of the even actor on at least 60% of the top half of the pieces its ability
moves, for 10 of 12 abilities. Last measured 1 of 12 (2 of 12 before `evaluation-10`). Not met.

**H4′ (proposed in brief 09):** (a) on its own work (the pieces where its +10 effect is the largest of the twelve), each
specialist ahead on at least 60%, for every ability that has own work; (b) stamina ahead on the last segment of at least
60% of nights. **Against the owner's requirements it falls short.** "For every ability that has own work" lets an
ability with one piece (stamina) or three (presence) pass or fail on a coin toss, and asks nothing when an ability has
none: opportunities aren't required. (b) proves stamina is read late in a night, not that it pays. Nothing checks that
one exceptional ability doesn't cover unrelated weaknesses, and direct and indirect effects aren't told apart.

**H4-R.** Profiles: for each of the twelve abilities a specialist with that ability at 85 and the other eleven lowered
evenly so its total equals the even actor's (every ability at 50), techniques alike; the budgets are printed with the
results. Pieces: every judged piece in scope (briefs and their readings, class scenes, nights, castings, coursework),
fully prepared, its fitting way, a sufficient day, no draw.

- **(a) Opportunities.** Each of the twelve is the largest input (its +10 effect the largest, at full precision) of at
  least **5** pieces, in at least **2** kinds of work. Five so that no single near-tie decides an ability's role (with one
  piece, stamina's whole H4′ result was one piece 0.06 behind); two kinds so that a role isn't one corner of the catalog.
- **(b) Advantage where the work is about it.** On its own work, each specialist is ahead of the even actor on at least
  **60%** of the pieces (the owner's H4 figure, kept), and its median advantage there is at least **0.3** points: three
  displayed tenths, where the coin-toss band of `h4.md`'s share table gives under a tenth. For all twelve, not ten.
- **(c) No erased weakness.** Where an ability carries under a tenth of a piece's ability effects, its specialist is ahead
  of the even actor on at most **1%** of such pairs (0 of 3,463 measured in brief 09); and H2 holds (no actor best on more
  than half of any kind of work with 30 or more pieces).
- **(d) Direct and indirect apart.** (a) and (b) are the judged piece itself, a long performance's stamina drain
  included. Each benefit outside the judged piece that an ability's own description claims (discipline's pace of growth,
  stamina's condition after the work and across a run, and any other `ABILITY_DEFS[].affects` names) is measured by twin
  lives through the game's commands, reported on its own line, and shows the claimed benefit; none is added into (b).
- **(e) It catches what it should.** Run in a copy, it fails when one ability's effects are cut to a tenth everywhere (a
  or b), and when a specialist's budget isn't matched (the printed budgets).

H5 must hold beside it (the even actor ahead of half the specialists on every piece). Where (a) or (b) fails for an
ability, the remedy is in-scope work or material read from a source, as the house scenes were, or a defect fixed in how
the ability is read, never a weight with no figure behind it.

### L3 → L3-R, Real Progress

**L3 as written:** the last month's mean take at or over the first's, for every non-mastered profile. Last measured:
the specialist 65.5 → 64.3, not met; the beginner 54.0 → 56.8, met.

**L3′ (proposed in brief 08 and 09):** every take of the term, judged again at each later month's levels, at or over
itself at the month before's, and at the end's over the start's. **It is adopted as L3-R's core, improved in four ways:**
its fixed set was each journey's own takes on two journeys of one seed, so a fixed set shared across journeys is added;
it counted a fall without asking whether an ability the piece reads fell (stamina detrains without workouts, which is a
legitimate fall), so the no-fall rule is conditioned on that; the monotonicity is extended from two journeys to the
whole catalog; and the journey outcomes are made part of the report it requires.

**L3-R.**

- **(a) A fixed set, controlled.** 24 pieces chosen and committed before measurement (8 briefs across registers, 8 class
  scenes, 4 nights, 4 castings), each fully prepared, its fitting way, a sufficient day, no draw, judged at the levels of
  each month of each journey; beside them, each journey's own takes replayed as they were taped (L3′).
- **(b) Enough journeys.** At least four profiles (beginner, developing, specialist, generalist) on two seeds each, 120
  days, through the game's commands (`tools/brief-journeys.ts`).
- **(c) Growth.** For every non-mastered profile the fixed set's mean rises from the start's levels to the end's by at
  least **1.0** point: at least a visible step after a term's work (the journeys measured rose 3 to 4). Between
  consecutive months no piece of the fixed set and no replayed take falls by more than 1e-9 where no ability it reads
  fell; where one did, the fall is put down to it by holding that ability at the month before's level, and disappears.
- **(d) More never makes it worse.** On every piece in scope, raising any one ability (+10, or to full), holding everything
  else, never lowers the result by more than 1e-9.
- **(e) The journey kept in view.** For each journey and month the report gives the takes, their purposes (first takes,
  callbacks, other readings), difficulty (mean and range), stakes and genres, and the journey metric (L3 as written)
  beside the controlled measure. A falling raw average with (c) met passes L3-R, and the report says so in its numbers.

### Mastery Is Kept

M1 holds throughout and after every change: maximum relevant abilities (stamina included), genre mastery, complete
preparation, a valid interpretation and a sufficient day give 100 on every judged piece and reading, with no draw taking
a case off it. It's measured on the integrated code with the stamina model in place.

## 2. The Advice: F2-A, Adopted, And Its Proof Broadened (F2-A10)

**F2 as written** stays in the record (67.6%, not met), and keeps being reported. **F2-A** (`../advice-2026-10-16/criteria.md`)
is the primary advice measure from this brief, as approved. Its pass is kept as it was defined: the advised input's
realized gain over 20 sessions through `practice.exercise` is the largest, within a tenth of the largest, or the largest
is among those the advice called about as useful.

**F2-A10**, the broadened proof:

- **(a) Cases, tuning apart from held out.** Tuning: F2-A's `adv-0` to `adv-9` and a new `adv-t-0` to `adv-t-19`.
  Held out: F2-A's `adv-10` to `adv-39`, and **120 fresh cases** (`adv-h-0` to `adv-h-119`), stratified as four profile
  bands (beginner, abilities 25 to 45; developing, 40 to 65; advanced, 60 to 85; near mastery, 80 to 97 with some inputs
  at full), three stages (the first week, one to three takes; mid-term, six to ten; later, fifteen or more across
  genres), and ten seeds each, their genres drawn across the 149. The held-out seeds are first run on the code to be
  reported, and the commit is recorded.
- **(b) Right often enough.** At least **80%** of the 120 fresh held-out cases pass (F2's figure), and at least **70%** of
  each band and of each stage, so no kind of player is systematically misled (each stratum 30 or 40 cases).
- **(c) Better than the alternatives.** On the same budget, the advised input's realized gain is at or above the median
  of the other inputs' in at least **95%** of held-out cases, and its mean is at least **1.5×** the mean of an input
  chosen at random.
- **(d) Improvable.** The advice names no input at full and none the player has no way to train: 0 cases. Where every
  read input is at full, it says so.
- **(e) The real curve.** Its predicted gain for the first input is within 0.3 points, or a quarter, of the realized
  gain in at least 80% of held-out cases (it reads the engine's growth, costs and diminishing returns, not its own).
- **(f) Mastery and preparation.** Near mastery, a predicted gain falls as the input's level rises (diminishing returns),
  on every case; where a take's preparation, not an ability, held it back, the advice's figures read the take as prepared.
- **(g) It says why.** Every recommendation states the work it read and the gain it expects: 100%.
- **(h) It updates.** After the player follows it (20 sessions of the advised exercise, through the commands), the advice
  is read again: the trained input's predicted gain falls on every case, and the first-named changes wherever another
  input's gain now leads.
- **(i) No hardcoding.** The advice reads no seed, profile or case name, and a case renamed gets the same advice.

## 3. Arion's Debit-Card Year

Brief 09 left it: Arion's price list (07.05.2026) gives 950 kr from age 24 and 0 kr under it; its terms (18.7.1.15)
say card fees follow the price list and come from the account; neither says whether the year is paid ahead or behind,
nor what a close owes. Act 114/2021 couldn't be read (althingi.is answered 403).

- **AR0 Research, recorded.** The fee's timing searched for in Arion's own documents (the price list, the card terms,
  the debit-card terms, the account terms) and in law that binds it (Act 114/2021; the payment services rules it carries
  into Icelandic law). The record says exactly what is confirmed, with the source and date, and what isn't. If a source
  settles the timing, that's implemented. If not, a SLATE simulation assumption is chosen, documented, labelled
  unverified and simulated on the screen and in the guide, kept apart from the confirmed amount and age, and
  configurable, so later evidence replaces it safely; no statute is cited for what a statute doesn't say.
- **AR1 to AR7, the lifecycle, under the rule in force:** the first charge (its day and its amount, 950 kr exactly, 0 under
  24); the year's renewal, once a year; a close (what it owes or refunds, by the rule, and what's said before the press);
  any refund the rule supports; insufficient funds (what SLATE's fees do on an account that can't cover them, said);
  duplicate attempts (a second charge in a year, a second refund, a reload: nothing more); save and load, and the
  calendar's edges (29 February, the year's turn, Reykjavík's time). Krónur exact, balanced against Bank Fees, every
  posting a sum of postings.
- **AR8 Verified as specified.** The lifecycle is verified against the rule as written here and in the code; the
  real-world uncertainty stays in the record and on the screen.

## 4. Stamina: A Performance's Workload

Until this brief a night's load was 0.6 and 0.12 for each level of the body's and the voice's work, clamped at 1
(`PIECE.load`, `loadOf`), so a one-act was loaded as a whole evening; a call held 180 minutes whatever the play; and a
performance took 10 energy flat (`ESTIMATE.energy.performance`). The owner authorizes a workload that reads the
production's running time, the actor's participation, the physical and vocal intensity, breaks and recovery, and the
starting condition and stamina. The coefficients are SLATE's design choices unless a source sizes them, and are said to
be.

- **W1 Running times, with their basis.** Every play in the catalog has a running time, each labelled with its basis: a
  cited production's published running time, or an estimate from its text (its length read at a stated speaking rate),
  said as an estimate. A one-act runs shorter than a full-length play, and nothing is loaded as a whole evening without a
  whole evening's running time.
- **W2 Longer costs more.** Holding every other input, longer participation gives a greater workload and drain, never less.
- **W3 Intensity counts.** Holding the duration, more physical or vocal intensity gives a greater workload; and a short,
  intense performance can be at least as demanding as a long, light one (shown on a pair the catalog or a test holds).
- **W4 Stamina protects, and has limits.** More stamina gives less drain within the performance and less fatigue after
  it, never more. At stamina 100 the drain within the piece is 0 (so mastery is kept), but the performance still costs
  energy afterward in proportion to its workload.
- **W5 Breaks recover, once.** An interval recovers part of the drain for what follows it, a bounded share; that recovery
  isn't credited again by anything else (the clock's rest during the interval, the night's sleep).
- **W6 Elapsed time and fatigue applied once.** The call holds the clock for the running time (and its calls), once; its
  fatigue is applied once; a save and a load during or after the evening applies neither again.
- **W7 Segments sum to the whole.** The drain and fatigue of a performance judged in its units equals the same
  performance processed whole, under 1e-9.
- **W8 Starting condition.** A lower condition at the curtain gives a greater effect, never less, within bounds.
- **W9 Bounded, and said.** The workload is a number between 0 and a stated cap, by a stated formula; the forecast before
  the performance and the result after it say the running time, the participation, the intensity, the breaks, the
  workload and what it does (the drain at the end, the energy it costs).
- **W10 History kept.** A result kept under an earlier ruleset is shown as it was, under its ruleset's name; a save from
  before the change opens with its nights as they were judged, and plays the new model from then on.

## 5. Together

Measured on the integrated code, with everything above in place: ST3-R, ST6-R, H4-R and L3-R; ST1 to ST9's others, F1
and F2 of the stage, I1 to I5, every attribute criterion (H2 and H5 among them), M1, S1 to S4 on all four samples, G2 and
the genre audit's isolation; F2-A10; W1 to W10; AR1 to AR8. A criterion that held before this brief and fails after is a
regression, fixed or reported with its cause. The tests the brief lists are written as played journeys where the
game's commands reach what they test.

## 6. Decision 4, Unchanged

The twelve rows out of a player's reach (the eight bank commands, `tax.catch_up_state_plan`, `tax.lien_dispute`,
`tax.request_waiver` and `tax.amend`) stay exactly as brief 09 left them: Unresolved in the audit, Decision Required in
the completion matrix (`coverage09.3-unresolved`, `KS-bank-rows-scope`, `banking.2.scope`), counted in its totals. Nothing
in this brief implements, defers, reclassifies or closes them, and the close-out checks their statuses against brief 09's.
