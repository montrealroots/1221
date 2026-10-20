# Brief 15: The Tutorial Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/e15-tutorial`, on its branch `ed15-tutorial`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `tutorial` (`docs/verification/editorial-2026-10-19/tutorial/`, `docs/text/second-pass/tutorial.json`).
- **Your port** for the built app: 4282.

## What's Yours

47 sources and 10,929 words in 6 files, all Pending in the second pass at the start. Each file, biggest first (sources, words):

- `src/engine/content/tutorial.ts`: 18 sources, 10,325 words
- `src/ui/guide/Help.tsx`: 11 sources, 236 words
- `src/engine/content/guide/index.ts`: 10 sources, 181 words
- `src/ui/guide/Guide.tsx`: 5 sources, 126 words
- `src/engine/world/tutorial.ts`: 2 sources, 58 words
- `src/ui/guide/HowItWorks.tsx`: 1 source, 3 words

## What To Watch For

**What's yours:** the guide's 17 chapters (`content/tutorial.ts`), the Guide dialog and the Help panel (`ui/guide/`), the refusals in `world/tutorial.ts`, and `guide/index.ts` and `guide/types.ts`.

**From the working reference:** examples 1 (the first chapter) and 8 (the refusal for a life without the guide). The brief's example about school events and Skip lives in your chapter Moving Time On too.

**The brief's section 5 is yours above all.** Each chapter teaches its task in the order the player does it. It answers the eight questions: what it's for, where it is, which control to press, what's needed first, what happens next, what the result means, what it connects to, and what to do if it's unavailable. Lead with a short explanation and the first action. Put formulas, exceptions and advanced conditions in later paragraphs or the How This Works entries. Use the exact interface labels. Where a chapter touches them, say plainly: choosing a way of playing versus rehearsing it, readiness now versus a full preparation, abilities versus techniques versus genre knowledge, health versus stamina versus energy, pending versus available money, applying for a document versus holding it, a warning versus a formal consequence.

**Follow every chapter on the built app.** Start a new life, read the chapter, then do what it says: press the control it names, where it says, and check that the result is what it describes. Write a script in your folder (Playwright, as `tools/playthroughs-ui.mjs` does; `tools/capture-all.mjs` in the scratchpad's `cap-main` clone shows a new life reading each chapter) and keep its log and screenshots. Record each chapter's route and result in `routes.md`, and name any instruction you couldn't follow and why. Finding a label in the code is only partial evidence.

**Labels from other areas:** the chapters name buttons and tabs on every screen. The areas record renames in their `renames.json`, and the coordinator carries them into your chapters at the merge. List in your report every label your chapters rely on, so a rename can't strand one.
