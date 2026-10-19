# Brief 15, UI Tools: The Interface Tools Read The Game's New Words (2026-10-19)

Brief 15 changed the game's words again. Two tools press the controls a player presses on the built app and read the
screen. On the first final commit, `c3478f9e`, some of their checks still looked for brief 14's words:

- **`tools/acceptance-ui.mjs`:** 71 of 77 at 1440 and at 390.
- **`tools/playthroughs-ui.mjs`, brief 13's three playthroughs:** `normal` 11 of 14, `setback` 5 of 9 and `specialist`
  10 of 11, the same at both widths.
- **`tools/playthroughs-ui.mjs`, brief 14's three journeys:** `banking` 6 of 10, `document` 4 of 8 and `health` 9 of 10,
  the same at both widths. Health also had one language check fail.

Their logs are in `before/`, copied from lanes A and UI of the first final runs (`../runs/first/`). The FAIL lines
quoted below are theirs. The engine's lanes on `c3478f9e` all exited 0.

Each failing check was read against the code that writes its screen and against what the screen said. Each was then
called one of three things:
- **about words:** the check looked for a sentence brief 15 reworded;
- **a knock-on:** an earlier step failed and left a dialog open, and the steps after it timed out behind the dialog;
- **the game:** the game didn't do what the check says.

**The verdict:**
- Seven matchers, on five sentences, were about words. Each now matches the new sentence at least as closely as the old
  one matched the old. `e5fdacb7`'s message counted six; there were seven.
- One failure was the game: the health journey's wall of text.
- The rest were knock-ons.
- Two trials on the working tree then found one more thing that was the game: a day's work that didn't show.

Both fixes to the game are in the player's words, and both are held by a test or by the tools.

## The Matchers Changed

| # | Where | Old | New | The sentence, and what changed it |
|---|---|---|---|---|
| 1 | `tools/acceptance-ui.mjs:746` | `/and the clock stops at\s+each one/` | `/passes (?:one commitment\.\s+The clock stops at\s+it\|\w+ commitments\.\s+The clock stops at\s+each one)\s+so\s+you can choose/` | On The Way (`src/ui/shell/TimeControls.tsx:160`), said per commitment from `4afe124c`. The frame area matched it again in the playthroughs (`tools/playthroughs-ui.mjs:345` and `:1195`) and missed acceptance's. |
| 2 | `tools/acceptance-ui.mjs:1218` | `/would come to about (\d+\.\d)/` | `/would come to about (\d+\.\d) of 100 /` | Shown Today's figure (`src/ui/components/CourseworkPane.tsx`). `f67198f7` wrote it in whole points "of 100". The school area matched the words on lines 1242 and 1246 again, but not the figure's reader, which read NaN. |
| 3 | `tools/playthroughs-ui.mjs:278` | `/would come to about (\d+\.\d)/` | `/would come to about (\d+\.\d) of 100 /` | The same figure (`figureOf`). |
| 4 | `tools/playthroughs-ui.mjs:279` | `/would come to about \d+\.\d \((\w+)\)/` | `/would come to about \d+\.\d of 100 \((\w+)\)/` | The same line's band (`bandOf`). |
| 5 | `tools/acceptance-ui.mjs:1720` | `/Sent \$100(\.00)?\. It arrives/` | `/Sent \$100(\.00)? to HSBC Bank Account\. It arrives [A-Z][a-z]+ \d{1,2}, \d{4}\./` | Move Money's toast (`src/ui/workspaces/BankWorkspace.tsx:114`). From `5b2cc6d0` it names the account the money went to. |
| 6 | `tools/playthroughs-ui.mjs:373` | `/This deletes (?:.+’s life from the slot\|the save in this slot)\./` | `/This deletes (?:.+’s life from the slot, with everything that happened in it\|the save in this slot)\./` | Confirm Deletion (`src/ui/saves/SaveSlots.tsx:245`), from `ebfadd83`. |
| 7 | `tools/playthroughs-ui.mjs:644` | `/(One piece is\|\d+ pieces are) set and still to be shown/` | `/(One piece is\|(?:Two\|Three\|…\|Nine\|\d+) pieces are) set and still to be shown/` | The coursework warning (`src/engine/systems/coursework.ts`), whose count is spelled out from `f67198f7`. It failed no run: setback's warning had one piece set. It would have failed on two. |

Matchers 2 to 4 were moved to whole points first (`e5fdacb7`), and then back to a tenth with the game (below,
`d6f6527a`). Each now matches the figure as the screen writes it. The figure must still rise where the step says it
rises.

**Why each is the same claim:**
- **1:** The claim is that On The Way says the clock stops at what's on the way. The old pattern took brief 14's one
  wording. The new one takes brief 15's two wordings and ties the pronoun to the count: "one commitment … at it", or
  several "… at each one". So it is tighter than the old one.
- **2 to 4:** The claim is the figure and its band. The new pattern reads the number the line shows, with its scale.
- **5:** The claim is that the money is sent and arrives on a day. The new pattern also asks for the account and the
  date, which the old didn't.
- **6:** The claim is that the dialog names whose life is deleted. Only the sentence's end changed.
- **7:** The claim is that the warning says how many pieces are still set. The new pattern takes the spelled-out
  count the game writes.

The warning's own sentences changed in this pass too (below), and the two tools' patterns for them moved with them:
`tools/acceptance-ui.mjs:1233` and `:1234`, and `tools/playthroughs-ui.mjs:645`. The playthroughs' old pattern let
anything stand between "by then," and "the review would" (`.*`). The new one doesn't.

## The Knock-Ons

A step that fails leaves whatever it opened. These failed only because the step before them did:
- **Acceptance, at each width:**
  - three steps timed out on a click (health, stamina and recovery, papers) behind On The Way, left open by 1;
  - the workload save's Shown Today read NaN (2).
- **normal:** step 11 read NaN (3), so the showing never came, and step 12 found no "Shown:" notice.
- **setback:** steps 3, 5 and 7 read NaN or no band (3, 4), and step 8 found no showing.
- **specialist, banking, document and health:** the save-and-continue step failed on Confirm Deletion (6). Its dialog
  stayed open, and banking's 8 to 10 and document's 6 to 8 timed out behind it.

## What Was The Game

**1. The coursework warning, a wall of text.** The health journey's language check read A Word On Your Coursework at
121 words in one block. The playthroughs fail a block of more than 120 (`before/health-1440-trace.json`).
- **The cause:** the school area had put the warning's meaning first and added a sentence pointing to Shown Today.
- **How long it could get:** built from the game's own parts, the warning reached 144 words. Its longest cause is the
  partner part, whose remedy is the longest of any part's in every template.
- **The fix (`e5fdacb7`):**
  - the review is two short sentences: "This is a warning. The term review is on …";
  - the clause "the term falls short of what the program asks, and" is gone, since the next clause says what the
    review would do;
  - the last sentence names only what Shown Today adds.
- **Now:** 119 words at its longest. `tests/language-dynamic.test.ts` ("the term’s coursework warning at its longest")
  builds that case and fails on `c3478f9e`'s words, at 144.

**2. A day's work that didn't show.** The first trial, on `e5fdacb7`'s tree, failed normal at 390, step 11: "1 steps
done and Shown Today 52 → 52".
- **The cause:** whole points had made the forecast too coarse for one step.
- **The fix (`d6f6527a`):** Shown Today and Due Soonest go back to a tenth, as before brief 15 and as a brief's Taped
  Now writes its own. They keep the area's "of 100". The score a showing gets stays in whole points, as before.
- **Held by:** the playthroughs' and acceptance's "Shown Today rises" steps, which read the figure as shown, and the
  Due Soonest test.

## The Trials And The Final Runs

The trials were run on copies of the working tree, not as records (the scratchpad's `try15.sh` and `try15b.sh`).

**The first trial, `e5fdacb7`'s tree:**
- acceptance: 77 of 77 at each width;
- normal 14 of 14 at 1440 and 12 of 14 at 390 (above);
- setback 9 of 9, specialist 11 of 11, document 8 of 8 and health 10 of 10, at each width;
- banking 9 of 10 at each width: step 8 is brief 14's `journeys-3`, which brief 15 didn't change.

The second trial, on `d6f6527a`'s tree, and the final runs are in `../runs/README.md`.
