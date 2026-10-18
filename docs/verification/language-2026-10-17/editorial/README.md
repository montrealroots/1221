# The Editorial Review

Brief 14, section 9: the finished game read as a player meets it, screen after screen and notice after notice, in one
voice, against `docs/STYLE.md` ("Talking to the player") and `docs/GLOSSARY.md`, from the instructions in
`../prompts/editorial.md` and `../prompts/common.md`. Worked 2026-10-17 into 2026-10-18 in the clone
`scratchpad/l14-editorial`, on `l14-editorial`, from `c74a02e1`, in six batches (`batches.md`). The before-and-after
pairs are in `examples.json`; what was found and not fixed is in `defects.md`.

## What Was Read

| What | How | Count |
|---|---|---|
| The built app | `npm run build`, then `tools/text-walk.mjs` at 1440 and 390 over the fourteen scenario saves in `scratchpad/l14/saves/` (`walk-1440/`, `walk-390/`) | 700 screens: 14 saves × 25 screens and tabs × 2 widths, every walk's exit 0 |
| The notices a played life is given | J01's two fixtures, `tests/fixtures/journey-j01-year-one-8283f80c.json.gz` and `journey-j01-degree-8283f80c.json.gz`, opened and every notice's title and body read | 798 notices |
| The three journeys | `../journeys/*/trace.json`, every step's words and dialog | 104 steps' words |
| Deduplicated | `dedupe.mjs`: each line split into sentences, each distinct sentence kept once with up to six places it's shown | **8,687 distinct**: 6,315 screen lines, 640 control names, 195 field labels, 39 dialog lines, 13 placeholders, 1,149 notice sentences, 190 notice titles, 3 question lines, 143 trace lines |
| Beyond the brief | the scenario saves written again on this code (`tools/scenario-saves.mjs`), their 3,251 notices | 762 distinct sentences more, **9,449 in all** |

The 390 walk showed no sentence the 1440 one didn't (the two deduplicated apart: 8,687 both). Each batch's part of the
game was read again in the code, with its variants, before a word was changed, and J01 was played again through
`tools/journeys.ts`: its school notices on batch 2's and batch 3's code are in `b2-rendered.txt` and `b3-rendered.txt`,
and its 798 notices on the final code in `notices-j01.json` (the render check on them: 1,596 strings, 0 faults).

## What Was Found And Fixed

Six batches, 57 sources re-marked Rewritten And Verified, each `--by` the area `docs/text/statuses/` says owns it:
school 22, money 14, papers 9, health 6, frame 3, profile 3. Two of them were marked for their evidence: `CoursesPanel`,
whose line changed in batch 4 without its source going Pending, and `ClassMoments`, whose first evidence cited a walk
that doesn't show it. The 61 before-and-after pairs in `examples.json`, each given the kind of fault it fixed and its
part of the game, are counted below; a pair can stand for several sentences or sources (batch 1's one shape is 16 pairs
over 24 sources).

**By kind** (the kinds `prompts/editorial.md` reads for, in its order):

| Kind | Pairs | For example |
|---|---|---|
| Wrong | 9 | “Worth $4,851, $149 of it owed.” → “Worth $4,851, after $149 owed.” (worth is already after the debt); “1 of 16 in the class” → “1st of 16” as the School's look says; a part named two ways on one card (“The revision isn’t complete” of a piece with no revision yet); a note worked into the revision that read as taken and not moved |
| The engine showing | 5 | “Coursework: reader” → “Coursework: running it with a reader”; “the need assessment reads the family’s means” → “judged from your family’s means”; “Simulated: the game’s reading of the process.” → “Simulated: the game’s summary, not the director’s words.” |
| Unclear | 13 | “It costs more than your bank can cover.” → “Your bank can’t cover $125.37 for every condition’s fill, so nothing was filled or charged.”; “$270.00 to pay, at least $40.00.” → “The statement comes to $270.00, due October 11, 2026. At least $40.00 has to be paid by then.”; “Advance ▾” as a button's accessible name → “Advance” |
| Voice | 11 | three refusal shapes for money that isn't there made one (batch 1); Looking Back's ledger of semicolons in sentences; a bank's closing notice leading with what happened |
| One word for one thing | 4 | a lien “filed for” what's owed, never “secured”, in the refusals and the guide; “clown and mask” → “clowning” |
| Mechanics | 19 | “Year 1 of three” → “Year 1 of 3”; “at 5 of 5 classes” → “5 of 5 classes attended”; “of 1 slips” → “of the 1 slip”; a list with no “and”; a place mid-sentence opening on a capital; “0 of 0 notes taken” → “The director gave you no notes.” |

**By part of the game:**

| Part | Pairs | Batches | What |
|---|---|---|---|
| School | 31 | 1–4, 6 | coursework's parts and skills named one way, notes taken and not, classmates' moments, Looking Back, parts cast by size, Standing, Terms, the leave, aid, orientation |
| Money | 9 | 1, 5 | the refusal shape, the cents, a withdrawal's fees, a statement's due date, a limit raised, an account closed |
| Health | 7 | 1, 5 | the refusal shape, a renewal, a doctor's wait |
| Papers | 4 | 1, 5 | a state plan's down payment, the lien's word, Mexico's papers |
| Home | 3 | 4, 6 | the worth, the place in the class, “Your home.” |
| The guide | 3 | 1, 5 | its quotes of what the game now says (every quote the game's own words: `guide-quotes`, 580 of 580) |
| Player Profile | 2 | 4 | the slips' plural, the reader's evenings |
| The top bar | 2 | 6 | Advance and Look After Yourself named without their arrow |

**The known item.** A refusal for money that isn't there had three shapes, four with the school's. It has one now: what
can't pay, the amount, what didn't happen, then the next step where there is one (“Your bank can’t cover $150.00, so
nothing was charged.”). Two variants, each said in `docs/STYLE.md` (Errors and unavailable actions) with why: an account
the player chose shows what it has (“Chase Total Checking has only $40.50, so nothing was moved.”), and a reason shown
before anything is pressed names the amount only. “You can’t afford it.”, beside a meal or groceries whose price is in
the same line, was kept.

Every meaning-sensitive change was checked against the code that makes the figure, and each is in `batches.md` with how:
Home's worth against `netWorth`, Fill A Longer Supply's figure against the fill's own price (a test holds it to
`medicineShareOf × fillsCharged`, and a mutation that stops the sum fails it), Looking Back's counts against `reflect`'s
own, a statement's due date against `dueAt`, the limit's conditions against the review's.

## What Was Left

In `defects.md`, each with where and why: a casting notice's part in Title Case (the code reads it back word for word),
a state's added penalty named by its Title Case label (`label-sweep` holds it, and a prose field is a change of the
data's shape), the research text's straight apostrophes (the data pass's), a role named “Bottom, As Pyramus” (the
material area's data), a teacher's note that reads as the evaluation (a decision about the feedback's voice), the
Profile's dense advice (a design decision); and one behavior noticed, Looking Back's “What’s still open goes with you
into class.” when the only open note is a direction, which doesn't go into class.

## The Final Walk And The Checks

The final walk (`after-1440/`, `after-390/`) is the fourteen saves on the build of the last batch's code, 25 screens
each at both widths, every exit 0. `names.mjs` asks the browser for the accessible names and reads the rewritten lines
on the saves that show them (`names.json`). The render check on the final walk and the last commit's checks, each exit
read from its own file:

| Check | Exit |
|---|---|
| `npx tsc -b --noEmit` | 0 |
| `npx eslint` on the 90 TypeScript files changed since `c74a02e1` | 0 |
| `text-inventory --check` (4,150 sources, Pending 0) | 0 |
| `title-case --check`, `label-sweep`, `plural-check`, `voice-check --check`, `tics --check`, `spelling`, `typos` | 0 each |
| `doc-refs --check`, `deciders --check` | 0 each |
| `guide-quotes --check` (580 of 580) | 0 |
| `coverage --check`, `traceability`, `devmap --check`, `wired --check`, `inventory --check`, `capabilities --check`, `student-matrix --check` | 0 each |
| `completion-matrix --check` | 1, then 0 once written (batch 6) |
| `tools/text-render-check.mjs` on `after-1440/` and `after-390/` (`render-after.txt`) | 1: 128,638 strings, one distinct fault, the workload save's stored “rehearsed together 1 times”, written before the school area fixed it |
| the same on the workload save written again on this code, at both widths (`render-now-workload.txt`) | 0: 10,336 strings, “rehearsed together once” |
| each batch's test files (in `batches.md`), once the tests that held the old words held the new | 0 |
