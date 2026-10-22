# Brief 20's Areas: What Each Area Does

Every area of brief 20's audit works from this, beside `../criteria.md` (the items, written before any fix) and the
brief itself (`../../briefs-2026-10-16/20-complete-functional-and-downstream-effects-audit.txt`). Read both, and the
repository's `CLAUDE.md`, first. An area's own prompt says which rows are its, what it alone checks, and where its clone
is.

## Where You Work

- **Your clone only**, on your branch (`b20-<area>`), made from the commit your prompt names. Never touch
  `/home/user/1221`, never push, never fetch into another clone. The coordinator collects your branch from your clone.
- **Never** run `git stash` (any form), `git reset --hard` on work you haven't committed, a force of any kind, or
  anything that merges worktrees. To put a file back after a mutation, write its old text back, as `mutate.py` does.
- **The machine is shared**: four cores and fifteen gigabytes among up to ten areas. Run only the test files you need,
  one worker at a time: `npx vitest run <files> --pool=forks --poolOptions.forks.singleFork=true`. Never the whole suite,
  never `npm run gate`, no build unless your prompt asks for one. Typecheck with `npx tsc --noEmit -p tsconfig.app.json`
  (not `tsc -b`, which writes its build information through the shared `node_modules`), and lint the files you changed
  with `npx eslint <files>`.
- **Commit** in your clone, in the project's way: the message says what was decided and why, and ends with the two lines
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and
  `Claude-Session: https://claude.ai/code/session_01977Z2bLodCspXyxELfcefM`. No model name anywhere else.

## Your Rows (M1 to M3, C3)

Your rows are in `docs/verification/audit-2026-10-21/effects/<area>.json`: `rows`, one a feature the code has, and
`promises`, one a connection the guide says one entry makes to another. `node tools/effects.mjs --todo <area>` lists what's
still seeded. Each was seeded from the completion matrix where it had the feature, so its words are an earlier record's
and its status is that record's claim: **read every row against the code before you keep a word of it.**

For each row:
1. Find the feature in the code: the command's or the scheduled kind's handler, the creation field's readers, the dial's,
   the look's component, the notice's sender. Read what it reads, what it changes, and then who reads that change later:
   grep for the field, follow it to the code that consumes it, and go on until the consequence reaches the player (a
   judged piece, a balance, a refusal, a notice, a page).
2. Fill the fields, in plain words, said of this code: `where` (the screen and the control, or the clock), `prerequisites`
   (and the refusals), `reads`, `changes`, `consumers` (a list of `{ "what": "...", "at": "src/...:<line>" }`, each the line
   that reads the change; at least one for a mechanic that's built), `experienced` (when and how the player meets the
   consequence, later as well as at once), `saveLoad` (what a save keeps, and whether a load could drop or replay it),
   `evidence` (`tests`, each a `tests/….test.ts` the gate runs; `comparisons`, `mutations` and `journeys`, each named),
   `missing` (a missing connection or limitation, or "None found" once you've looked).
3. Say `mechanic` (true or false). A presentation row (a label, navigation, a record) gives its `purpose`, and its
   evidence shows the purpose works (it shows the truth, it takes the player where it says). Don't invent a penalty or a
   bonus so a presentation row has an effect.
4. Set `status`, one of the owner's seven. **Implemented And Verified** only where a test the gate runs reaches the
   feature as a player does (the command issued as a screen issues it, the clock run) and checks the consequence your
   consumers name, with an expectation of its own: read the test's assertions; a test that sets the change by hand, or
   calls a reader in the clock's place, checks less. Otherwise say in `why` what's missing; and write the test where you
   can (that's the work, not a note). **Explicitly Deferred** says who deferred it and when. A row the code can't reach
   for any current life stays Implemented, Verification Incomplete, and says so.
5. Set `seeded` to false, and add `"readBy": "<area>"` and `"readAt": "<the commit you read>"`. You may drop the seed's
   `laterText` once you've used it.

For each promise: `claim` is the guide's sentence; `holds` says what in the code keeps it (with `file:line`); `tests`
names a test that shows it; `status` as above, and `why` where it isn't verified. A promise the code doesn't keep is a
defect (D1, a notice or tutorial describing behavior that isn't there): connect the behavior where it belongs to the game
as it is, or, where the guide promised more than the game is meant to do, correct the guide's words. Say which and why.

Don't hand-edit the generated pages (`docs/COVERAGE-MATRIX.md`, `docs/CAPABILITIES.md`, `docs/GAMEPLAY-COVERAGE.md`, the
completion matrix, `EFFECTS.md`, `docs/text/INVENTORY.md`, `docs/text/SURFACES.md`, `docs/DEVMAP.md`,
`docs/TRACEABILITY.md`). The coordinator writes them again at integration.

## Read And Bite (B1 to B3)

Write controlled comparisons as tests the gate runs, in `tests/b20-<area>-*.test.ts`: two lives alike in everything but
one input (the same seed, the same save, the same commands and the same clock), the input changed, and then:
- the difference it should make where it's relevant, asserted with its size or direction, and
- no difference where it isn't (an irrelevant input that mustn't leak), asserted as equality.

Reach the consequence through the commands and the clock. A delayed consequence (a deadline missed, a fee, interest, a
payment, recovery, an assessment, eligibility, an audition, a credit, a later opportunity) is reached by running the
clock to it, not by calling its handler. Keep each file under about a minute on one worker. Name a fixture that sets
anything by hand `TEST SETUP` in the test's title or comment, and never let it set the consequence under test.

## Disconnections (D1)

Look for each of the brief's twelve kinds in your area, and write down how you looked and what you found, including what
you looked for and didn't find: values written and never read; choices that promise a difference and make none; success
reported with nothing changed; effects worked out and never applied; a notice or tutorial describing behavior that isn't
there; something charged, rewarded, penalised or progressed twice; time skipping an obligation (a jump of a day, a week,
a month: does the obligation still fall due, once?); a save and load dropping or replaying a consequence (save in the
middle of it, load, play on); impossible scheduling or eligibility; a control wired to the wrong command; a feature only
a test's hand can reach; an opportunity offered again against what's done.

For each defect you confirm:
1. Write the test that fails on it first, and keep its failing output for the report.
2. Repair it where it's in the game's scope: connect what's disconnected; never hide the feature, never weaken what it
   promised, never mark an unreachable path as passed. Where a figure changes, the rule behind it is said and sourced, or
   called SLATE's estimate with what it was based on; no number is moved so a test passes.
3. A comment your change makes untrue is part of your change: say what's no longer so in the past tense, as the code's
   comments do. Player text follows `docs/STYLE.md` and `docs/GLOSSARY.md`; a source of player text you change is marked
   again in the same commit: `node tools/text-inventory.mjs --mark "<source id>" "Rewritten And Verified" --by b20-<area>
   --evidence "<test>"` (ids are literal: `[` and `]` are escaped, `?` isn't a wildcard). Run
   `node tools/text-inventory.mjs --check` and `node tools/surfaces.mjs --check` before you commit.
4. Mutate the repair (below) and see the new test kill it.

What's outside your area: write it down for the coordinator, with the evidence, and don't change that area's code.

## Mutations (T2)

At least twelve, across your area's systems (not only what you repaired): each breaks one connection a row of yours says
is held, the way a real defect would (a reader not reading, a change not made, a condition dropped). Write them as a JSON
list in `docs/verification/audit-2026-10-21/mutations/<area>.json`, `{ "id": "B20-<AREA>-<n>", "what": "...", "file":
"...", "find": "...", "replace": "...", "tests": ["tests/..."] }`, each `find` met once in its file, and run them in your
clone:

    python3 docs/verification/audit-2026-10-21/mutate.py . docs/verification/audit-2026-10-21/mutations/<area>.json docs/verification/audit-2026-10-21/mutations/<area>.txt

Killed means an assertion failed; SETUP ERROR isn't a kill. A mutation that survives, or only breaks setup, is a finding:
the test doesn't hold what the row says; strengthen it, run the mutation again, and record both runs. Name the mutation in
the row's `evidence.mutations`.

## Your Report

`docs/verification/audit-2026-10-21/areas/<area>/REPORT.md`, plain and specific: the commit you started from and the one
you ended at; your rows by status, and the promises; each comparison and what it showed (the figures); each defect (what,
where, the failing test's output before, the repair, the test, the mutation); the twelve kinds and how you looked for each;
the mutations' results; what you found outside your area; and what's left, with why. Say only what you measured. Where
you didn't do something, say so.

Before you finish: `node tools/effects.mjs --todo <area>` lists nothing of yours; your test files pass on one worker;
`npx tsc --noEmit -p tsconfig.app.json` exits 0; eslint on your changed files exits 0; the text and surfaces checks exit
0; and everything is committed on your branch.
