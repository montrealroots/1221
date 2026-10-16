# The Audit Pipeline

`docs/verification/audit/*.json` and `docs/GAMEPLAY-COVERAGE.md` are generated, never edited by hand. Until 2026-10-15
the scripts and inputs that generate them lived only in one session's scratchpad, which a later session or the other
account wouldn't have. They were copied here on 2026-10-15, their paths made relative to this folder, and the copy was
run once and checked: it regenerated the committed audit with no difference (`git diff` empty).

## Regenerating The Audit

From `docs/verification/pipeline/inputs/`:

```sh
node ../scope-fold.cjs
node ../remaining-fold.cjs
node ../collect-checks.cjs
node ../scope-prep.cjs
node ../merge-review.cjs evidence-results.json,evidence2-results.json,evidence3-results.json,evidence4-results.json,evidence5-results.json mutations.json,mutations2-final.json,mutations3.json,mutations4-final.json fixes.json checks.json
node ../resolve-titles.cjs
```

`remaining-fold.cjs` (from 2026-10-16) runs after `scope-fold.cjs`, whose row text it may correct again; until that day this
pass's areas' results (`docs/verification/remaining/`) were in no input, and their hand edits of the audit were undone by
every regeneration.

Where `resolve-titles.cjs` says it fixed row text, run `merge-review.cjs` (and `resolve-titles.cjs`) once more: it corrects
`doc-fields.json`, which the merge reads, after the merge has run (found on 2026-10-16, when a regeneration left two
renamed titles in the audit until the merge ran again).

Then, from the repository’s root, `node tools/coverage.mjs`, `node tools/coverage.mjs --check`, and
`node tools/capabilities.mjs --write` and `--check`.

## What Each Part Is

- `merge-review.cjs` writes each row's `review` (from `inputs/row-review.json`, the review of 2026-10-13 against
  `fca00d8f`), its `after` (from the evidence rounds), and its status: the latest skeptic's verdict, held at partial
  where mutations ran and none was killed, and moved by `inputs/after-check.json` where a note is newer than the check.
- The evidence rounds: `evidence-results.json` (round one, 2026-10-13), `evidence2-results.json` (round two),
  `evidence3-results.json` (round three, 2026-10-14), `evidence4-results.json` (the current scope, 2026-10-15, made by
  `scope-fold.cjs` from `docs/verification/scope/<key>-result.json`) and `evidence5-results.json` (the integration pass's
  areas, 2026-10-16, made by `remaining-fold.cjs` from every `docs/verification/remaining/<key>-result.json` there, so a
  result written later is taken by running it again). Round five judges nothing: its records add tests to the rows
  `inputs/remaining-rows.json` maps each area's item to (an item whose id is a row's needs no entry), and the merge takes a
  row's verdict, gaps and disposition from its latest record that has one. An item unmapped, a row-text fragment
  unplaced, or a cited title that isn't a test is listed when it runs, and left out.
- From 2026-10-16 `merge-review.cjs` also writes each row's evidence class (`verification`): its status where that
  settles it (deferred, legacy, informational), `inputs/classes.json` where a row's claim is the repository's own text
  (with each static test's standard as read), the retained engine on fixtures where it's unresolved, else a player
  journey; the class moves no status. It writes a row's `acceptance` (its four parts, where it's out of a player's reach)
  from `doc-fields.json`, a field of its own so an area's corrected `issue` can't overwrite it. It records a test whose
  title is labelled FIXTURE, GUARD, OLDER SAVE or LEGACY STATE as a fixture whatever its round said, and follows a test
  renamed more than once to its last name (until then one step, so c-performerTitle's stood at its middle name).
- `collect-checks.cjs` keeps `inputs/checks.json`, every row's latest skeptic check; `--add <file>` adds a new one.
  `inputs/final-checks/` holds each skeptic's file as written.
- `scope-prep.cjs` puts the reruns of mutations in place (`mutations4-final.json`) and keys the current scope's fixes in
  `inputs/fixes.json`.
- `resolve-titles.cjs` applies `inputs/renames.json` (a test title renamed since it was cited) and
  `inputs/doc-fields.json` (a row's own words corrected against the code as it stands).
- `mut-parallel.cjs` runs mutations, each in its own copy of the tree in the system's temporary folder, never the working
  tree: `node mut-parallel.cjs <workers> <out.json> <groups.json>`. Delete old copies first (it reuses one that exists),
  removing each copy's `node_modules` junction on its own before the rest, so nothing follows it into the real one.
  `solo.cjs` runs one mutation the same way.
- `yale-into-health.cjs`, `round3-fold.cjs` and `fix-citations-1014.cjs` are one-off steps kept as the record of what
  was done; `round3-fold.cjs` overwrites `doc-fields.json` entries and must not be run again.
- `prompts/` holds the instructions the agents and skeptics of 2026-10-14 and 2026-10-15 worked from, as written.

## Adding A Round

Write the round's results as `docs/verification/scope/<key>-result.json` (or a new evidence file in the rounds' shape),
fold them in, run the mutations in copies, have an independent read-only skeptic write its check, `--add` it, and
regenerate. A row is verified only on the standard `docs/GAMEPLAY-COVERAGE.md` states.
