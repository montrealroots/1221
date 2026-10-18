# The Material Area's Handoff

Brief 14, the material area, 2026-10-17, branch `lang14-material`. Written for whoever integrates the areas or takes the
material up again.

## Where It Stands

Every one of the area's 994 sources has a status in `docs/text/statuses/material.json`, made through
`tools/text-inventory.mjs --mark --by material`: 101 Rewritten And Verified, 893 Reviewed And Retained, none Pending
or Blocked (`node tools/text-inventory.mjs`, and its `--check` exit 0). Each Rewritten And Verified source names the test that
renders it (`tests/material-words.test.ts`, with its title) and what changed; each Reviewed And Retained names the brief
or scene, a detail of it, and any in-world use of a word the engine-speak list counts.

The rewrites, the test and the records are committed; `batches.md` has the four batches, `examples.json` 154 verbatim
pairs, `defects.md` none of this area's and two of others', `glossary.md` the material's section for `docs/GLOSSARY.md`.

## What's Left

Nothing of the area's sources. For the coordinator, not this area:

1. **The completion matrix.** `node tools/completion-matrix.mjs --check` fails on this branch, as it will on any area's
   branch that changes `src/`: its `judge` watch covers `src/engine/content/briefs` and every `scenes-*.ts`, and its
   `engine` and `app` watches all of `src/engine` and `src`, so 85 rows measured before brief 14 drop from Implemented
   And Verified to Implemented, Verification Incomplete (612 of 636 to 527), and the handoff's completion line no longer
   matches. None of these words is read by the judge, so re-measuring should find the same; re-measuring and moving the
   handoff's line belong to the integration.
2. **The glossary.** `glossary.md` is this area's section, ready to go into `docs/GLOSSARY.md` after Core; its last part
   lists three terms other areas share (take, reader, reading).
3. **Two shapes kept across all briefs** (`batches.md`, "Kept As They Are"): the arc of the beats said as a run of
   phrases, and a noun-phrase gloss after a heading. If the standard wants a whole sentence after every heading, it's
   about 313 strings of one form, and every source that holds one would need marking again.
4. **The engine-speak ratchet's "a take".** 74 of the area's 120 hits are a self-tape's take, which Core keeps. The
   ratchet can't tell them apart, and it stopped the area writing "every take" where it was the right word.
5. **Two plural faults outside the area** found by the render check: "rehearsed together 1 times"
   (`src/engine/systems/coursework.ts`, school's) and "Sleep owed 1 hours" (`src/ui/workspaces/ProfileWorkspace.tsx`).

## If The Words Change Again

A status is held against a hash of its source's strings, so any later edit to a brief or a scene puts that source back
to Pending until it's marked again. The scratch tools that made the marks lived outside the repository; to mark a
source again, run `tools/text-inventory.mjs --mark "<source id>" "<status>" --by material` with a reason or evidence, one
call per source (each re-parses `src/`, about ten seconds), never two at once, since each rewrites the one file.
