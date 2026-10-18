# Brief 14: The Player's Language, 2026-10-17

The owner's "Complete Player-Facing Language And Tutorial Overhaul"
(`../briefs-2026-10-16/14-complete-player-facing-language-and-tutorial-overhaul.txt`, kept verbatim). Every string the
game shows is rewritten or reviewed for a player: clear controls, natural feedback, useful notices, and tutorials that
teach. The rules, the calculations, the saves and decision 4's rows don't change.

## Where It Started

- **The branch:** `claude/peaceful-hamilton-59zdbb`, restarted by a fast-forward from `main` at `0368d46b` (#41's merge,
  the handoff fixed after brief 13's #40). Nothing was uncommitted, there was no stash and one worktree.
- **The last gate:** it ran on `ed4f2d40`, #41's head, and had finished before this began: 376 of 376 files, 4,587 of
  4,587 tests, the completion matrix holding, exit 0. `ed4f2d40`'s code is `main`'s.
- **The game's code** is brief 13's tested code, `7e7a3af6`: nothing under `src/` changed after it, so its final runs
  (`../playthroughs-2026-10-17/`) are this pass's before.

## The Standard

`docs/STYLE.md`, "Talking to the player", and `docs/GLOSSARY.md`, written before any text was changed. The conventions
the brief authorized replacing are named where they stood, with what they said until 2026-10-17.

## The Inventory

`tools/text-inventory.mjs` finds every string in `src/` a player can see, by parsing the source. It covers string
literals, templates and JSX text, and leaves out ids, keys, class names, comparisons and console lines. It groups the
strings into the sources a writer reads as one thing, and gives each a subsystem from the brief's list. Each source has a
status: one of the brief's four, recorded per area in `docs/text/statuses/` against a hash of its text, so a source
changed since it was reviewed counts as Pending again. `docs/text/INVENTORY.md` is the checklist, written by the tool.

At the start, before anything changed (`docs/text/statuses/baseline.json`): **3,894 sources, 31,397 strings, 463,488
words, every one Pending.** The tool also counts engine-speak, the internal words the standard keeps from the player:
758 hits at the start (`docs/text/engine-speak.json`). Those counts may fall and may not rise, and the gate's new
check holds that.

Two more tools read what the game prints, not its source:
- `tools/text-walk.mjs` records each screen of the built app, for each scenario save: its text, its controls'
  accessible names and its placeholders.
- `tools/text-render-check.mjs` reads those screens, and a played journey's notices and reviews, for the faults a
  sentence built from parts can have: a leaked value, doubled punctuation, a raw id, a plural that disagrees, a
  fragment.

The before:
- **Brief 13's 25 played journeys:** 16,815 rendered strings and 0 faults. The text was mechanically sound; its voice
  is what this pass is for.
- **The built app's screens** at 1440 and 390, on all fourteen scenario saves: `before/`.

## How It's Worked

Eight areas, each in its own clone, from instructions written before their work (`prompts/`). Each area works its
sources in batches and records the batch: the sources reviewed, before-and-after examples, the meaning-sensitive
changes, the screens checked. The areas:
- **frame:** start, creation, save slots, Home, notices, the shared controls, the calendar and the clock;
- **tutorial:** the guide's chapters and How This Works itself;
- **school:** classes, coursework, feedback, rehearsals, productions, standing and the degree;
- **profile:** abilities, techniques, genres, mastery, interpretation and the advice;
- **money:** banking, cards, payments, fees, holds and statements;
- **papers:** documents, applications, status, taxes and benefits;
- **health:** care, cover, the body's wellbeing, stamina and energy, and the world's reference data;
- **material:** the scenes, plays and audition sides, in their characters' voices.

The coordinator merges them, runs the final verification and writes the receipt.

## Where It Ended

Each figure here is read from a file in this folder, and `RECEIPT.md` is written by `receipt.py` from them. The tested
code is `ebdb5577`'s.

- **The inventory:** 4,151 sources, every one with a status: 1,285 Rewritten And Verified, 2,866 Reviewed And Retained,
  0 Pending, 0 Blocked. Engine-speak fell from 758 hits to 332. From this close-out the gate fails a Pending source as
  well as one with no status, and `tools/guide-quotes.mjs --check` is in the gate.
- **The same game:** `numbers-same.py` compared every number, id and key in the final runs with brief 13's
  (`numbers-same.json`), and the judge's 36 figures are brief 13's (`final/README.md`). Nothing the game judges moved,
  and RULESET stays evaluation-11.
- **The built app:** the final walk's render check found 0 faults in 68,812 strings at each width, and no label the
  guide names is nowhere (`final-walk/`). On `edd7be91` the acceptance walk passed 77 of 77 steps and brief 13's
  playthroughs every step, at both widths. Brief 14's journeys passed too, but for banking's step 8, which is `journeys-3`
  (`runs/README.md`, `interface-final/`, `journeys14-final/`).
- **Defects:** 101, 90 fixed and 11 left, each left one with its reason (`DEFECTS.md`).
- **Left open:** dead content (the owner's) and On The Way before Sunday evening (`journeys-3`), in `coordinator.md`.
- **The gate:** on `a51b0e15`, exit 0, 391 of 391 test files and 4,713 of 4,713 tests passed, none skipped, every one of the twenty checks holding; the build exit 0 (`runs/gate.txt`, `final-checks/`).
- **The matrix:** 612 of 636 rows in scope Implemented And Verified, the same rows as at brief 13's close.
- **Not claimed:** human usability approval. `PLAYTEST.md` is the owner's route, and only the owner can give it.
- **Merged** to `main` in #42 at the owner's word (`99f3c756`). Deploying is the owner's.
