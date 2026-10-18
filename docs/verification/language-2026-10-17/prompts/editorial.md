# Brief 14: The Editorial Review

Read `prompts/common.md` first; it holds for you. The brief's section 9 asks for an editorial review of the whole sweep.
The eight areas each read their own words, and the integration's passes read what crosses them; nobody has yet read
the finished game as a player meets it, screen after screen, in one voice. That's your job: read what the built app
shows, against `docs/STYLE.md` ("Talking to the player") and `docs/GLOSSARY.md`, and fix what falls short.

## Your Clone

`$S/l14-editorial`, on the branch `l14-editorial`, with `node_modules` a link to the main tree's. `$S` is
`/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad`. Use port 4231 for a preview server,
stop it by its process id when you're done, and never touch another port.

## What You Read

1. **The built app, walked.** `npm run build`, then `node tools/text-walk.mjs` (read its header for its arguments) at
   1440 and 390, over every scenario save in `$S/l14/saves/`. That's every screen and tab a player reaches on fourteen
   lives at different points, with each control's accessible name.
2. **What a played life is told.** The notices, reviews and feedback a played career receives: the dynamic cases'
   journey fixtures (`tests/fixtures/journey-j01-*.json.gz`, a first year and a degree, played through commands) opened
   and their notices read, and the three journeys' traces (`docs/verification/language-2026-10-17/journeys/*/trace.json`).
3. Deduplicate: read each distinct sentence once, and know where it's shown.

## What You Look For

Read as a player, and as an editor, in this order:
- **Wrong:** a sentence that misstates what the game does, or that disagrees with another screen. Check the code
  before you change a word; a rewrite never changes what a sentence means.
- **The engine showing:** an id, an internal word, a formula where a player needs a consequence, "the game" as a
  narrator where the sentence could just say the thing.
- **Unclear:** a sentence a player has to read twice, a control whose label doesn't say what pressing it does, a
  refusal that doesn't say why or what to do next.
- **Voice:** each kind of text in its own voice (buttons, notices, a teacher's feedback, a bank's and an office's
  notices, narration, errors), as the standard describes. Notices that repeat without saying what changed.
- **One word for one thing:** a term the glossary names said another way.
- **Mechanics:** plurals, articles, punctuation, capitals (Title Case for headings, navigation and buttons; sentence
  case for prose), dates and money in the game's forms.

One known item is yours: **a refusal for money that isn't there** has three shapes. Papers says "Your bank can’t cover
$…, so nothing was charged.", health "It costs …, more than your bank can cover.", and Money's refusals have their
own. Make them one shape, with the amount and what didn't happen, unless a refusal's context needs it otherwise, and
say why where it does.

## How You Fix

As the areas did (`prompts/common.md`): in batches by part of the game, each source read in the code with its
variants, tests that held the old words updated to hold the new ones as exactly (titles never change), the checks run,
each changed source re-marked with `--by` its owning area (`docs/text/statuses/<area>.json` says whose it is), each
batch recorded and committed. What you find and don't fix (a defect in behavior, a decision for the owner, a change
that would need a fact the game doesn't have) goes in `defects.md` with where and why.

## What You Record

In `docs/verification/language-2026-10-17/editorial/`:
- `README.md`: what you read (counts of screens, distinct sentences, notices), how, and what you found, by kind and
  by part of the game, with the numbers;
- `batches.md`: each batch, as the areas' records are;
- `examples.json`: before and after, with the kind of text and why;
- `defects.md`;
- the walks you read, as `walk-1440/` and `walk-390/`.

## Checks

Before your last commit: `npx tsc -b --noEmit`; `npx eslint` on what you changed; every test file that names a source
you changed; `node tools/text-inventory.mjs --check`, `title-case --check`, `label-sweep`, `plural-check`,
`voice-check --check`, `tics --check`, `spelling`, `typos`, `doc-refs --check`, `deciders --check`,
`guide-quotes --check`; and `tools/text-render-check.mjs` on your final walk. Each exit read from a file. Then the
whole suite once, with a long timeout, its exit read from its file. Say in your last message the branch, the commits,
what you read, what you found and fixed by kind, what you left and why, and each check's exit.
