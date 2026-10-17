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
