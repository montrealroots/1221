# The Audit Pipeline

`docs/verification/audit/*.json` and `docs/GAMEPLAY-COVERAGE.md` are generated, never edited by hand. Until 2026-10-15
the scripts and inputs that generate them lived only in one session's scratchpad, which a later session or the other
account wouldn't have. They were copied here on 2026-10-15, their paths made relative to this folder, and the copy was
run once and checked: it regenerated the committed audit with no difference (`git diff` empty).

## Regenerating The Audit

From `docs/verification/pipeline/inputs/`:

```sh
node ../scope-fold.cjs
node ../collect-checks.cjs
node ../scope-prep.cjs
node ../merge-review.cjs evidence-results.json,evidence2-results.json,evidence3-results.json,evidence4-results.json mutations.json,mutations2-final.json,mutations3.json,mutations4-final.json fixes.json checks.json
node ../resolve-titles.cjs
```

then, from the repository's root, `node tools/coverage.mjs`, `node tools/coverage.mjs --check`, and
`node tools/capabilities.mjs --write` and `--check`.

## What Each Part Is

- `merge-review.cjs` writes each row's `review` (from `inputs/row-review.json`, the review of 2026-10-13 against
  `fca00d8f`), its `after` (from the evidence rounds), and its status: the latest skeptic's verdict, held at partial
  where mutations ran and none was killed, and moved by `inputs/after-check.json` where a note is newer than the check.
- The evidence rounds: `evidence-results.json` (round one, 2026-10-13), `evidence2-results.json` (round two),
  `evidence3-results.json` (round three, 2026-10-14) and `evidence4-results.json` (the current scope, 2026-10-15, made by
  `scope-fold.cjs` from `docs/verification/scope/<key>-result.json`).
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
