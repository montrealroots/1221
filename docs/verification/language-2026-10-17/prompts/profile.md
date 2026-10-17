# Brief 14: The Profile Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/l14-profile`, on its branch `lang14-profile`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `profile` (`docs/verification/language-2026-10-17/profile/`, `docs/text/statuses/profile.json`).
- **Your port** for the built app: 4204.

## What's Yours

The inventory's subsystem profile: 462 sources, 25,363 words, in 26 files. Each file, its sources and its words, biggest first:

- `src/engine/content/guide/craft.ts`: 19 sources, 9,876 words
- `src/engine/content/genres.ts`: 149 sources, 3,690 words
- `src/engine/content/genre-register.ts`: 149 sources, 1,988 words
- `src/engine/content/practice.ts`: 30 sources, 1,569 words
- `src/engine/content/attributes-matrix.ts`: 6 sources, 1,428 words
- `src/engine/content/abilities.ts`: 12 sources, 1,275 words
- `src/ui/workspaces/ProfileWorkspace.tsx`: 16 sources, 1,216 words
- `src/engine/content/contemporary.ts`: 29 sources, 796 words
- `src/ui/looks/actor.tsx`: 3 sources, 780 words
- `src/engine/systems/next-steps.ts`: 9 sources, 636 words
- `src/engine/systems/experience.ts`: 2 sources, 369 words
- `src/engine/systems/practice.ts`: 6 sources, 339 words
- `src/engine/content/genre-coverage.ts`: 2 sources, 254 words
- `src/engine/content/film-genres.ts`: 1 source, 221 words
- `src/engine/systems/learning.ts`: 4 sources, 215 words
- `src/engine/systems/artistry.ts`: 1 source, 177 words
- `src/engine/content/interpretation.ts`: 8 sources, 163 words
- `src/engine/systems/interpretation-read.ts`: 2 sources, 100 words
- `src/engine/content/approaches.ts`: 2 sources, 83 words
- `src/ui/components/AttributesPanel.tsx`: 1 source, 74 words
- `src/engine/systems/register.ts`: 3 sources, 35 words
- `src/engine/content/demands.ts`: 1 source, 23 words
- `src/engine/systems/interpretation.ts`: 2 sources, 22 words
- `src/engine/systems/engagement.ts`: 3 sources, 21 words
- `src/engine/content/reference.ts`: 1 source, 9 words
- `src/engine/systems/attributes.ts`: 1 source, 4 words

A file of yours that another area's tests or tools assert is still yours to change; update those assertions and say so in your batch record.

## What To Watch For

- **Abilities, techniques, genre knowledge and practice:** four different things, and the words keep them apart
  (`docs/GLOSSARY.md`, Core). Each ability's description says what it does in a performance and how to grow it, in a
  player's words. Brief 11's A4 holds that what the game says an ability does, it does, so keep each claim true to
  `material.ts`'s readers. "Which work reads it" and "work reads it against 90" become where it matters and what
  mastering it means.
- **The tics check** fails a long list whose lines open on one word. The descriptions are a long list, so vary their
  shape.
- **Genres:** each genre's description and register, studying one, and genre mastery.
- **Interpretation** (`content/interpretation.ts`, `approaches.ts`, the How You'll Play It words): choosing a way of
  playing isn't rehearsing it. Say what suits the scene and why, in the scene's terms, not "the grain".
- **The advice** (`systems/advice.ts`, `next-steps.ts`, `experience.ts`): the forecast's words carry the brief 12
  clauses F1 to F6 and H1 to H6. Each says what it read, what it expects, what it assumes and what changed. Keep every
  number, every condition and the forecast-versus-result distinction. The advice tests assert them, so update their
  words, never their claims.
- **The Profile workspace and the actor look.**
- **The judge reads `abilities.ts`, `approaches.ts`, `interpretation.ts` and `genres.ts`:** change words only, never a
  number, an id or a list's order.

**How This Works entries.** An entry in `src/engine/content/guide/*.ts` is a feature's tutorial. Rewrite yours so it answers the
brief's eight questions in order, with the screen's own labels:
- what it's for (`short`);
- where to go (`where`, `available`);
- what to press (`steps`);
- what's needed first (`needs`);
- what happens (`now`, `later`, `costs`, `interpret`);
- how it affects the rest of the game (`connections`, `reads`);
- what to do next (`next`, a new optional field: give every entry one, or `[]` with a reason in your batch record);
- what to do if you can't (`unavailable`, `mistakes`).

Lead with a short plain overview, then the steps, then results, then the deeper explanation and the figures (`reads`,
`example`). Every route and label it gives must exist on the built app: check each against the text walk of your
screens. Figures stay read from the rules' constants, as they are now, never typed into the words. The tutorial area
renames the headings Help shows, so write each field for its question, not for its old heading ("What The Game Reads"
becomes what it affects).
