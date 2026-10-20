# Brief 15: The Natural-Language Editorial Pass, 2026-10-19

The owner's "Complete Natural-Language Editorial Pass, Including All Retained Text"
(`../briefs-2026-10-16/15-complete-natural-language-editorial-pass.txt`, kept verbatim). Every source of player text
is read again, whatever brief 14 decided about it. Each one is:
- rewritten where it reads stiff, indirect or like the engine's notes;
- kept, with a reason specific to it, where it already speaks like a finished game.

The rules, the calculations, the saves, the scope and decision 4's rows don't change.

## Where It Started

- **The branch:** `claude/peaceful-hamilton-59zdbb`, moved forward to `main` at `bdb23949` (#43's merge) with nothing
  rewritten. There was no stash and one worktree.
- **The gate on that commit:** it ran in a clean clone before anything changed: exit 0, 391 of 391 test files, 4,713 of
  4,713 tests, every check holding, the completion matrix at 612 of 636 (`before/gate-baseline.txt`).
- **The inventory:** 4,151 sources in `src/`, every one read in brief 14 (1,285 Rewritten And Verified, 2,866 Reviewed
  And Retained). Those statuses are kept as the first pass's history.

## The Second Pass

`tools/text-inventory.mjs` holds a second status for each source, apart from the first: Rewritten, Retained, Pending
or Blocked, in `docs/text/second-pass/<area>.json`.
- **Ownership:** each source belongs to one area by its file (`AREAS2` in the tool), and only that area may mark it
  (`--mark2`).
- **Rewritten** names where the new words were read.
- **Retained** gives a reason the tool checks: at least eight words, and none of the reasons the brief rules out.
- **Pending:** a source whose words change after its status is Pending again.
- **Read:** a source counts as read when either pass's status matches its words.
- **Closing:** once the coordinator closes the pass, the gate fails any source the second pass hasn't read.

## The Inventory Against The Game

The brief asks that the inventory be checked against the actual sources, and omissions recorded (`omissions.md`).
`tools/text-omissions.mjs` reads a walk of the built app line by line. For each line it finds the inventory string
behind it, or the file outside the inventory that holds it, or the template that built it from values.

## How It's Worked

- **The working reference** (`reference.md`): real sentences from the game, rewritten to the standard, each checked
  against the code. It's the voice every area works to. It went to the owner in the first progress update, so they
  could steer.
- **The standard:** `docs/STYLE.md`'s new section "Speak like a finished game", and `docs/GLOSSARY.md`, whose everyday
  account is now a checking account.
- **Ten areas,** each in its own clone, from instructions written before their work (`prompts/`):
  - **frame:** start, save slots, creation, Home, notices, controls, calendar and time;
  - **tutorial:** the guide's 17 chapters and Help, each chapter followed on the built app;
  - **school:** classes, coursework, feedback, rehearsals, productions and standing;
  - **profile:** abilities, techniques, genres, mastery, ways of playing and the advice;
  - **money:** banking, cards, payments and statements;
  - **money-data:** the banks' research data;
  - **papers:** documents, taxes, status and benefits;
  - **health:** care, cover, the body and the world's reference data;
  - **material-a** and **material-b:** the audition briefs and class scenes.
- **The coordinator** merges them, reads all the areas together for one voice, follows the guide and the journeys on
  the built app at both widths, compares the engine's outputs with brief 14's, and writes the receipt.

## How It Went

- **Four areas finished on their own:** frame, papers, material-b and health.
- **Six were stopped before they reported:** tutorial, school, profile, money, money-data and material-a. Their agents
  couldn't be resumed, so the coordinator finished each from its clone as it stood:
  - Tutorial, money and material-a had every source marked, and were merged as they were.
  - Money-data's area-end runs were done but uncommitted. The coordinator committed them.
  - School's last three batches were done but uncommitted. The coordinator ran their checks again, committed them, and
    fixed one test they'd missed.
  - Profile had 146 sources left. Its research marks were run whole. Three UI sources were read and marked by the
    coordinator. Its last fixes were checked again, and its notes were written up. Each area's `batches.md` says what
    was its own and what the coordinator did.
- **Merging found what no area could:** sentences one area rewrote and another area's test still held. Each is in the
  merge or the commit after it.
- **The whole suite, after every merge:** 393 of 395 files and 4,767 of 4,769 tests. The two failures were more of the
  same, fixed in `e0e7831d`.
- **The cross-area review** (`crossarea.md`) read the ten areas together:
  - on the integrated build, from saves made again on it;
  - across every source at once;
  - in the areas' own records.

  The coordinator's list (`coordinator.md`) settles everything the areas left for others.
- **The final runs** (`runs/README.md`) ran first on `c3478f9e`. The engine's lanes passed, and the interface's found
  three more things (`uitools/README.md`, `coordinator.md`, In The Final Runs):
  - matchers in the interface tools that looked for brief 14's words;
  - a warning past the playthroughs' wall of text;
  - a forecast too coarse to show a day's work.

  Each was fixed, and every lane ran again on `d6f6527a`.
- **The defects** found apart from the writing are indexed in `DEFECTS.md`.
- **The owner's route by hand** is `PLAYTEST.md`.
- **The receipt** is `RECEIPT.md`, written by `receipt.py` from these records.

## Where It Ended

- **The second pass:** 4,177 sources, 916 Rewritten and 3,261 Retained, none Pending or Blocked. The pass is closed, and
  the gate fails a source neither pass has read (`docs/text/second-pass-closed.json`).
- **The same game:** `numbers-same.py` compared every number, id and key in the final runs on `d6f6527a` with brief 14's
  (`numbers-same.json`). The judge's 36 figures are brief 14's (`final/README.md`), and RULESET stays evaluation-11.
- **The built app,** on `d6f6527a`'s build, at both widths:
  - the acceptance walk, 77 of 77;
  - brief 13's playthroughs, every step;
  - brief 14's journeys, but for banking's step 8, which is brief 14's `journeys-3`;
  - the guide followed, every check (`final-follow/`);
  - the final walk, every line held by the inventory or assembled from values (`final-walk/`).
- **The gate:** on `aabfc1b2`, exit 0, 395 of 395 test files and 4,771 of 4,771 tests passed, none skipped, every one of
  the twenty checks holding; the build exit 0 (`runs/gate.txt`, `final-checks/`).
- **The matrix:** 612 of 636 rows in scope Implemented And Verified, the same rows as at brief 14's close.
- **Not claimed:** human usability approval. `PLAYTEST.md` is the owner's route, and only the owner can give it.
- **Merged** to `main` in #44 at the owner's word (`74259312`). Deploying is the owner's.
