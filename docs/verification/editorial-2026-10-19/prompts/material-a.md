# Brief 15: The First Material Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/e15-material-a`, on its branch `ed15-material-a`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `material-a` (`docs/verification/editorial-2026-10-19/material-a/`, `docs/text/second-pass/material-a.json`).
- **Your port** for the built app: 4289.

## What's Yours

508 sources and 80,076 words in 16 files, all Pending in the second pass at the start. Each file, biggest first (sources, words):

- `src/engine/content/briefs/briefs-c.ts`: 77 sources, 9,206 words
- `src/engine/content/briefs/briefs-a.ts`: 74 sources, 8,712 words
- `src/engine/content/briefs/briefs-f.ts`: 72 sources, 8,701 words
- `src/engine/content/briefs/briefs-b.ts`: 74 sources, 8,396 words
- `src/engine/content/briefs/briefs-d.ts`: 74 sources, 8,307 words
- `src/engine/content/briefs/briefs-e.ts`: 75 sources, 8,189 words
- `src/engine/content/scenes-classical.ts`: 18 sources, 7,092 words
- `src/engine/content/scenes-modern.ts`: 11 sources, 5,413 words
- `src/engine/content/scenes-original.ts`: 9 sources, 4,595 words
- `src/engine/content/scenes-greek.ts`: 6 sources, 3,284 words
- `src/engine/content/scenes-house.ts`: 4 sources, 2,686 words
- `src/engine/content/scenes-public.ts`: 4 sources, 2,670 words
- `src/engine/content/scenes-meeting.ts`: 2 sources, 1,514 words
- `src/engine/content/scenes-scored.ts`: 1 source, 713 words
- `src/engine/content/plays.ts`: 6 sources, 542 words
- `src/engine/content/briefs/index.ts`: 1 source, 56 words

## What To Watch For

**What's yours:** the first set of audition briefs (`content/briefs/briefs-a.ts` to `briefs-f.ts`, and `index.ts`), the class scenes (`content/scenes-*.ts`) and `content/plays.ts`.

**What these are:** in-world material, the scenes an actor performs. A brief's title, scene, situation, characters, objective, obstacle and beats are written to the actor, and the readings ("She plays it as …") are its interpretations. The interface reads them out in the brief's pane (`ui/components/BriefPane.tsx`) and on the coursework card (`CourseworkPane.tsx`). Check which fields each screen shows.

**The standard for this material:**

- The game's own narration is plain, vivid, specific English for an actor: no literary flourish for its own sake, and no engine words.
- A staging note or an objective is a direct instruction.
- A character's line keeps the character's voice.
- A line from a real play (Shakespeare, Chekhov, the Greeks, and any other public-domain text) stays exactly as written. The game's summary around it is clearly the game's, and a title or an author's name is as published.

**"Take":** in a self-tape's brief, take is the industry's word and stays (Glossary, take). Anywhere else, engine-speak may fall and may not rise.

**Reasons for keeping:** you have about 500 sources. One reason may cover a run of sources of the same kind, but it says what that kind of text does well (for example: "a brief's situation and characters, each a concrete, playable fact an actor can use, in plain narration"). Your batch record lists every source read. Rewrite where a sentence fails the standard. Don't rewrite good scene writing to raise the count.
