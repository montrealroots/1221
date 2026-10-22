# Brief 20, The Guide Area

Written down by the coordinator from the guide area's report as it returned it (2026-10-22): the harness wouldn't let the
area write this file itself. The words are the area's but for this note.

- **Clone and commits:** `b20-guide`, from `c4832549`: `a1f499c0` (the wiring list and its test, the twenty chapters
  followed, two guide sentences corrected, the eight promises, first notices, startup and saves) and `fb95a70f` (the Save
  & Exit repair, the two trip-warning repairs, stronger tests, 27 mutations).

## Rows And Promises

All 47 rows Implemented And Verified (9 mechanics, 38 presentation) and all 8 promises. Every row was written again from
the code: the seed's words weren't usable, several rows carrying another's (`world.mark_read`'s prerequisites were the
decisions'). Where the tests followed only part of a chapter, the row's `missing` says which sentences and names the
owning area's test that holds the rest. `node tools/effects.mjs --todo guide` lists nothing; `--check` names no problem in
`guide.json`.

## The Wiring List: 193 Controls, 6 Decision Answers, 3 Stop Choices, No Miswiring

`tools/wiring.mjs` reads it from the code; the list read line by line against each handler (`file:line`) is `wiring.json`
here. No control issues the wrong command, sends the wrong id, or sends a key its handler doesn't take, and every one of
the 180 commands registered is issued by some control. `tests/b20-guide-wiring.test.ts` holds it, and fails when a control
is added or changed: after integration, `node tools/wiring.mjs --write`, then a verdict for each new line. Notes on single
lines: Papers' Renew is always greyed and its command always refuses; Home's "Mark N Read" marks every unread notice, those
past the six shown too; the NHS prepay labels write £32.05 and £114.50 by hand, which match the content's figures today.

## Defects Repaired

Each with a test that failed first and a mutation it kills.

| # | Defect | File | Test | Mutation |
|---|---|---|---|---|
| G1 | The Weather chapter said the day's weather sets the flu's weeks; the flu follows the town's climate (`fluByWeek`), as the guide's own weather entry already said. The words corrected. | `src/engine/content/tutorial.ts` | `b20-guide-chapters`, "10. Weather" | 21 |
| G2 | Finding Your Way promised "Go There… takes you to its screen and tab"; most notices name only a screen. Now "to its screen, and to its tab where the notice names one." | `src/engine/content/guide/start.ts` | `b20-guide-promises` | 22 |
| G3 | Home's Calendar panel said "you're not in New York", in red, for a career meeting, audition or work day whose trip is part of the commitment, where its entry, its stop and its handler all say you needn't be there first. Before: `expected '…' not to contain 'you're not in'`. Said now only for a commitment with no trip of its own (`travelMinutes` undefined). | `src/ui/screens/Home.tsx` | `b20-guide-screens` | 23 |
| G4 | Skip To Event marked the same commitments "Elsewhere", with a "You're in … this is in …" note. Before: `not to contain 'Elsewhere'` failed. The same rule as G3; `tests/defects-g4-2.test.ts`, which reads that line, brought up to date. | `src/ui/shell/TimeControls.tsx` | `b20-guide-screens` | 24 |
| G5 | Save & Exit went to the save slots even when the save failed: everything played since the last save lost, the error's toast closed with the game. Before: `expected [ 1787683020000 ] to deeply equal []` (it exited anyway). `saveNow` says whether it saved, and the exit comes only then; on a failure the game stays open with "Save Failed: Try Again". | `src/app/game-context.tsx` | `b20-guide-startup` | 25 |

G1 and G2 changed text, marked with `--mark2` under the areas that own those sources (`tutorial`, `frame`): they're
claimed in `tutorial.json` and `frame.json` already, a second claim fails the check, and the tool asks for `--mark2`. The
text, surfaces and guide-quotes checks exit 0.

## What Only This Area Checks

- **The tutorial (C3):** `tests/b20-guide-chapters.test.ts` (37 tests) reads each chapter in a guided life, in order, and
  after each does what it says, through the drawn buttons where they exist, with the chapter's own examples (Mark 3 Read,
  Sleep 8 Hours, Comic Timing, Read The Scene, Ask with the partner's name), and finds nothing a chapter tells you to press
  still locked once it's read.
- **The promises:** `tests/b20-guide-promises.test.ts` holds all eight.
- **Notices and questions (C1, C2):** `tests/b20-guide-screens.test.ts` presses Home's buttons. With two offers waiting,
  the second row's Accept books the second offer and the first row's Decline declines the first; an answer can't be given
  twice, before or after a save and a load; an answer that can't be done says why and leaves the question open; after
  Dismiss, an answer is refused in the game's own words, and a second Dismiss too, and the offer can still be accepted on
  its own tab; a notice read stays read through a save, a load and another day; a notice repeated word for word while
  unread isn't shown twice.
- **First notices:** `tests/b20-guide-firsts.test.ts`, every notice read and the save opened again every day: Welcome,
  Meeting Your Class, Registration and Fall Term Begins once each in a new life's first fortnight; the Equity initiation
  fee's notice once through graduation and a month after; an older save's first milestones once each.
- **Startup and saves:** `tests/b20-guide-startup.test.ts`: the startup's stages flag a slot from an older or a newer
  version; a new life's slot card matches the life; Continue opens at the same moment; all 7 saves in `tests/fixtures/`
  open through a slot without error and play a day; a save made at 2:37 PM opens at 2:37 PM and, played on to the next
  morning, matches the never-saved life to the byte but for three empty records (Outside The Area).
- **Features only a test can reach:** none shown to the player. One command option, `mark_read`'s list of particular ids,
  is sent by no control (tests and tools only).

## The Comparisons

The same seed, one input changed.

| Input | Result |
|---|---|
| 4 hours' sleep against 8 | Energy from 8 to 11 AM: 80 → 70.49 against 80 → 71.00 |
| Overdrawn against not (`world.day_rollover`) | Stress across midnight: 10 → 13.64 against 10 → 9.64 |
| No energy against some, stress at 40 | After an hour: 41.24 against 39.64 |
| 12 hours of sleep owed against none, 8 hours' sleep | Energy 91.86 against 100 |
| 7 hours' sleep against 4 | Condition 71.16 (debt 0) against 68.99 (debt 2.70) |
| Two New Havens under different skies | A workout outdoors builds 1.1 against 1.0 indoors; the flu's weeks the same |

## Mutations

27 in `../../mutations/guide.json`, both runs in `guide.txt`: all 27 killed by an assertion, no setup errors. On the first
run B20-GUIDE-18 (the Money line showing cash as the worth) survived, the test's character owing nothing; a $400 card
debt was added to that test, marked TEST SETUP, and the second run killed it.

## Outside The Area, Not Changed

- **Weather (the life area's):** `weather.ts` works the hourly temperature out from the high and low rounded in Celsius,
  but shows the high and low converted from the unrounded values; over a year of New Haven hours 124 read above the day's
  high and 118 below its low (25 August 2026, 2:37 PM: Home showed "86°F … High 85°F"). (Sent to the life area.)
- **Opening through a slot:** `migrate`'s step 93 (`engine/index.ts`) fills in three empty records (`engagement`,
  `development`, `work`) on every open. No outcome differs, but a save opened through a slot isn't the never-saved life to
  the byte (criteria J4); the test compares everything but exactly those three.
- **Already failing at `c4832549`** (in a fresh clone): `tools/coverage.mjs --check`, "cardlife.test.ts:99 isn't inside a
  test", and devmap, traceability and the completion matrix behind; with `EFFECTS.md`, those pages want writing again.
  (The coordinator's `16630746` carried the citations forward and wrote them again.)
- **LienPanels (the benefits area's):** the greyed reason's line names the button "Ask For Its Withdrawal" even where it
  reads "Ask For Its Release As Erroneous".
- **`tests/guide-examples-start-day-body.test.ts`:** its `tomorrowMorning` helper is behind the rule; it runs only from
  evenings, where the old rule and the new agree.

## For The Owner

- Not done: the built app at desktop and mobile widths (J6); INSTRUCTIONS asks no build of an area.
- Whether notices should name the tab they're about: only the pay notices do today. The guide's words were corrected to
  match the game, rather than every area's notices changed.

## Checks

The area's six test files and the neighbouring tests its changes touch, on one worker, pass. `npx tsc --noEmit -p
tsconfig.app.json` exit 0; eslint on every changed file exit 0; the text-inventory, surfaces, guide-quotes and wiring checks
exit 0.
