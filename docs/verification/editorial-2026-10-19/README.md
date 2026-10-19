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
