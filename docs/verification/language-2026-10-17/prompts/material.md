# Brief 14: The Material Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/l14-material`, on its branch `lang14-material`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `material` (`docs/verification/language-2026-10-17/material/`, `docs/text/statuses/material.json`).
- **Your port** for the built app: 4208.

## What's Yours

The inventory's subsystem material: 994 sources, 153,517 words, in 21 files. Each file, its sources and its words, biggest first:

- `src/engine/content/briefs/second-f.ts`: 84 sources, 12,921 words
- `src/engine/content/briefs/second-c.ts`: 86 sources, 12,757 words
- `src/engine/content/briefs/second-a.ts`: 85 sources, 12,615 words
- `src/engine/content/briefs/second-e.ts`: 78 sources, 12,415 words
- `src/engine/content/briefs/second-d.ts`: 81 sources, 11,784 words
- `src/engine/content/briefs/second-b.ts`: 78 sources, 11,583 words
- `src/engine/content/briefs/briefs-c.ts`: 77 sources, 9,191 words
- `src/engine/content/briefs/briefs-f.ts`: 72 sources, 8,702 words
- `src/engine/content/briefs/briefs-a.ts`: 74 sources, 8,696 words
- `src/engine/content/briefs/briefs-b.ts`: 74 sources, 8,382 words
- `src/engine/content/briefs/briefs-d.ts`: 74 sources, 8,298 words
- `src/engine/content/briefs/briefs-e.ts`: 75 sources, 8,181 words
- `src/engine/content/scenes-classical.ts`: 18 sources, 7,083 words
- `src/engine/content/scenes-modern.ts`: 11 sources, 5,412 words
- `src/engine/content/scenes-original.ts`: 9 sources, 4,580 words
- `src/engine/content/scenes-greek.ts`: 6 sources, 3,284 words
- `src/engine/content/scenes-house.ts`: 4 sources, 2,686 words
- `src/engine/content/scenes-public.ts`: 4 sources, 2,670 words
- `src/engine/content/scenes-meeting.ts`: 2 sources, 1,512 words
- `src/engine/content/scenes-scored.ts`: 1 source, 709 words
- `src/engine/content/briefs/index.ts`: 1 source, 56 words

A file of yours that another area's tests or tools assert is still yours to change; update those assertions and say so in your batch record.

## What To Watch For

- **This is in-world material:** class scenes, plays and audition sides, in their characters' voices. The brief's
  standard is for the game's own voice. A character keeps how they talk (`docs/STYLE.md`, Voice), so dialogue and
  stage description that's in the world's voice is Reviewed And Retained, with that reason.
- **What you rewrite** is the game's voice around it: a brief's `why` notes and readings' explanations, any label, any
  framing sentence that explains a demand. Bring those to the standard where they read as the engine describing
  itself.
- **The judge reads these files.** Never change a number, an id, a tag, a tone, a list's order or its length, and check
  in the code that no text you change is read for a computation: a line's length, a word count, a match on words. Run
  the judge's own tests (`tests/decisions-judge.test.ts`, `tests/briefs.test.ts`, `tests/material.test.ts`,
  `tests/stage-interpretation.test.ts`) after each batch.
- **Read all of it.** Your files are the biggest share of the game's words. Don't sample: each source gets a status, on
  its own reading. Check each for engine-speak (`--speak`) and for the faults the brief names.
