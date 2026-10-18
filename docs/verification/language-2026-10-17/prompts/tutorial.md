# Brief 14: The Tutorial Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/l14-tutorial`, on its branch `lang14-tutorial`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `tutorial` (`docs/verification/language-2026-10-17/tutorial/`, `docs/text/statuses/tutorial.json`).
- **Your port** for the built app: 4202.

## What's Yours

The inventory's subsystem tutorial: 43 sources, 9,328 words, in 6 files. Each file, its sources and its words, biggest first:

- `src/engine/content/tutorial.ts`: 18 sources, 8,835 words
- `src/ui/guide/Help.tsx`: 8 sources, 193 words
- `src/engine/content/guide/index.ts`: 9 sources, 144 words
- `src/ui/guide/Guide.tsx`: 5 sources, 119 words
- `src/engine/world/tutorial.ts`: 2 sources, 34 words
- `src/ui/guide/HowItWorks.tsx`: 1 source, 3 words

A file of yours that another area's tests or tools assert is still yours to change; update those assertions and say so in your batch record.

## What To Watch For

- **The guide's chapters** (`src/engine/content/tutorial.ts`, `CHAPTERS`) are the first-run tutorial: a new life
  starts with everything shut, and reading a chapter opens its part of the game (`opens`). Rewrite each to teach the
  task it opens, in the eight questions' order where they apply. Keep every chapter's `id`, `opens` and order exactly,
  and keep `names` true to the screen. `tests/tutorial.test.ts` holds the coverage.
- **Help itself** (`src/ui/guide/Help.tsx`, `Guide.tsx`, `HowItWorks.tsx`, `help-context.ts`, `content/guide/index.ts`):
  - **The headings** follow the eight questions in order: what it's for, where to go, what to press, what you need
    first, what happens, how it connects, what to do next (render the new optional `next` field), and if you can't.
    The deeper parts (the figures, the worked example) come last.
  - **The contents, search, empty results and links** are yours.
  - **Context:** a link in Help, followed and returned from, keeps the player's place, runs no command and moves no
    clock. There's a test that reading leaves a save byte for byte as it was. Extend it to following a link and coming
    back. Help that opens on a screen shows that screen's entry, for the player's stage and state.
- **The routes on the built app.** Write `tools/tutorial-routes.mjs`. It reads every chapter's `names` and every
  How This Works entry's `where.label` and steps. It pulls out each screen label they tell the player to go to or press
  (the Title Case names, the quoted ones), and checks each exists on the built app, in the text walk's screens
  (buttons, tabs and text) for the scenario saves. A label no screen has is a wrong instruction. The domain areas are
  rewriting their entries at the same time, so build and test the tool on today's words, and report what it finds.
  The coordinator runs it again on the merged words.
- **The distinctions** the brief lists (`docs/STYLE.md`, Tutorials and help teach a task): the chapters that first meet
  each one say it plainly.
- **`src/engine/world/tutorial.ts`:** the refusal a player meets for a part not yet opened. It names the chapter to
  read, and where.
