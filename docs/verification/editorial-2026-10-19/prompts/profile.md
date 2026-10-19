# Brief 15: The Profile Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/e15-profile`, on its branch `ed15-profile`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `profile` (`docs/verification/editorial-2026-10-19/profile/`, `docs/text/second-pass/profile.json`).
- **Your port** for the built app: 4284.

## What's Yours

615 sources and 53,667 words in 27 files, all Pending in the second pass at the start. Each file, biggest first (sources, words):

- `src/engine/content/genre-demands.json`: 149 sources, 27,395 words
- `src/engine/content/guide/craft.ts`: 19 sources, 10,377 words
- `src/engine/content/genres.ts`: 149 sources, 3,682 words
- `src/engine/content/genre-register.ts`: 149 sources, 1,986 words
- `src/engine/content/practice.ts`: 30 sources, 1,572 words
- `src/engine/content/abilities.ts`: 12 sources, 1,491 words
- `src/engine/content/attributes-matrix.ts`: 6 sources, 1,428 words
- `src/ui/workspaces/ProfileWorkspace.tsx`: 17 sources, 1,305 words
- `src/ui/looks/actor.tsx`: 3 sources, 819 words
- `src/engine/content/contemporary.ts`: 29 sources, 796 words
- `src/engine/systems/next-steps.ts`: 10 sources, 676 words
- `src/engine/systems/practice.ts`: 6 sources, 368 words
- `src/engine/systems/experience.ts`: 4 sources, 343 words
- `src/engine/content/genre-coverage.ts`: 2 sources, 254 words
- `src/engine/systems/learning.ts`: 4 sources, 222 words
- `src/engine/content/film-genres.ts`: 1 source, 221 words
- `src/engine/systems/artistry.ts`: 1 source, 182 words
- `src/engine/content/interpretation.ts`: 8 sources, 164 words
- `src/engine/systems/interpretation-read.ts`: 2 sources, 94 words
- `src/engine/content/approaches.ts`: 2 sources, 83 words
- `src/ui/components/AttributesPanel.tsx`: 1 source, 82 words
- `src/engine/systems/register.ts`: 3 sources, 43 words
- `src/engine/content/demands.ts`: 1 source, 23 words
- `src/engine/systems/engagement.ts`: 3 sources, 21 words
- `src/engine/systems/interpretation.ts`: 2 sources, 21 words
- `src/engine/systems/attributes.ts`: 1 source, 10 words
- `src/engine/content/reference.ts`: 1 source, 9 words

## What To Watch For

**What's yours:** the Player Profile, the abilities (`content/abilities.ts`), techniques, genres and genre knowledge (`genre-demands.json` and the genre content), mastery, practice exercises, ways of playing and interpretation, the advice (`systems/advice.ts`, `systems/next-steps.ts`), the actor, person, craft and genre looks, and the How This Works entry `guide/craft.ts`.

**From the working reference:** examples 6 (an ability's description) and 7 (the advice when it's seen again).

**Say plainly:** abilities versus techniques versus genre knowledge; choosing a way of playing versus rehearsing it; readiness now versus a full preparation; a forecast is always a forecast.

**Repetition (section 8) is most visible in the advice:** each time it's read, it says what changed since, what the player did, why it still holds or why it moved on, and what to do now. It never rotates to worse advice for variety.

**Tools that read your words:** `tools/advice-harness.ts` reads the advice's sentences (its checks S1 onward). Update its matchers as exactly as before, and run it as it ran in brief 14 (`docs/verification/language-2026-10-17/profile/` shows how).
