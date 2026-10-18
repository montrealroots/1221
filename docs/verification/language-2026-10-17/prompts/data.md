# Brief 14: The Research Data's Dates And Punctuation

Read `prompts/common.md` first; it holds for you. You're not an area: the money, papers and health areas reviewed their
reference data as data, and the dynamic cases (`dynamic/defects.md`, Recorded And Left) found what that left: about 306
strings in the inventory print a date as their source wrote it, "2026-09-26" or "8 April 2026", in a source line or a
note under what it explains, where everywhere else the game writes "September 26, 2026". And Chase's card source has a
space before a semicolon (`content/cards.ts`, "…/LGC61498.html ; minimum-payment formula from …").

## Your Clone

`$S/l14-data`, on the branch `l14-data`, with `node_modules` a link to the main tree's. `$S` is
`/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad`.

## What You Do

1. **Find them all.** Every string a player can read that holds a date in a form the game doesn't write: ISO
   (`2026-09-26`), day-month (`8 April 2026`), or a month and year the game writes otherwise. Use the inventory
   (`node tools/text-inventory.mjs --show`), and read where each is shown, so a date that only a comment, a key or a
   test reads is left alone.
2. **Where the words come from.** Much of the reference data is generated: a `JSON.parse("…")` in a content file is a
   builder's output (`tools/build-*.mjs`), and a research file under `docs/research/` is its source. Change it where a
   rebuild keeps the change. That means the builder's words step where there is one, as `tools/build-attribute-content.mjs`
   applies `genre-demands-words.txt`, or a step you add the same way, never by hand in the output. A research file keeps
   the research's own text; the game's words are applied on the way in. If a builder can't run here (its inputs
   aren't in the repository), say so and change the content file in a way the builder's own next run would give,
   and record it.
3. **Nothing reads them back.** Before you change a date, show that no code parses it, compares it, sorts by it or keys on
   it (`grep -rn` the field and the value). A date the code reads is data, not words: leave it, and if the player sees
   it, format it where it's shown.
4. **The game's form.** `formatDate`'s ("September 26, 2026"). A date written as a reading day ("read 2026-10-10")
   becomes "read October 10, 2026". Keep every figure and every date's value exactly.
5. **The semicolon,** and any other stray space before punctuation you find in the same data.

## What You Keep

The rules, the figures, the dates' values, every id and key, quotations in the research's words (a quotation is the
source's, and keeps its own date form), and each test's title. Re-mark each source you change with
`--by <its area>` and `--evidence`, after its last edit.

## Checks And Record

Record in `docs/verification/language-2026-10-17/data/`: `batches.md` (what you changed, where, how a rebuild keeps it,
and what you left and why), `examples.json` (before and after), and the proof each changed date is read by no code.
Before your last commit run: `npx tsc -b --noEmit`; `npx eslint` on what you changed; every test file that names a
source or file you changed; `node tools/text-inventory.mjs --check`, `title-case --check`, `label-sweep`, `plural-check`,
`voice-check --check`, `tics --check`, `spelling`, `typos`, `doc-refs --check`, `deciders --check`,
`inventory --check`, `npx vite-node tools/geo-check.mjs`; and, if you changed a builder, the builder run and a
`git diff` showing its output is what you committed. Each exit read from a file. Then say in your last message the
branch, the commits, how many strings changed and how many were left (and why), and each check's exit.
