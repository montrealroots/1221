# Brief 15: The School Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/e15-school`, on its branch `ed15-school`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `school` (`docs/verification/editorial-2026-10-19/school/`, `docs/text/second-pass/school.json`).
- **Your port** for the built app: 4283.

## What's Yours

589 sources and 62,549 words in 36 files, all Pending in the second pass at the start. Each file, biggest first (sources, words):

- `src/engine/content/guide/coursework.ts`: 22 sources, 10,729 words
- `src/engine/content/guide/school.ts`: 25 sources, 10,572 words
- `src/engine/content/guide/productions.ts`: 22 sources, 9,976 words
- `src/engine/content/coursework.ts`: 68 sources, 8,165 words
- `src/engine/content/material.ts`: 98 sources, 4,811 words
- `src/ui/workspaces/SchoolWorkspace.tsx`: 20 sources, 2,477 words
- `src/engine/systems/leave.ts`: 43 sources, 2,460 words
- `src/engine/systems/school.ts`: 56 sources, 2,275 words
- `src/engine/systems/coursework.ts`: 40 sources, 1,590 words
- `src/ui/components/StudyPlanPanels.tsx`: 8 sources, 1,470 words
- `src/engine/content/concerns.ts`: 1 source, 844 words
- `src/engine/content/school.ts`: 32 sources, 755 words
- `src/ui/looks/school.tsx`: 4 sources, 711 words
- `src/ui/components/CourseworkPane.tsx`: 12 sources, 612 words
- `src/ui/components/BriefPane.tsx`: 6 sources, 611 words
- `src/engine/systems/classmates.ts`: 26 sources, 538 words
- `src/engine/content/workload.ts`: 2 sources, 487 words
- `src/engine/systems/production.ts`: 7 sources, 423 words
- `src/ui/components/RehearsalProcess.tsx`: 4 sources, 375 words
- `src/engine/systems/briefs.ts`: 13 sources, 354 words
- `src/ui/components/PlayingChooser.tsx`: 5 sources, 342 words
- `src/engine/content/tasks.ts`: 16 sources, 309 words
- `src/engine/systems/courserecord.ts`: 9 sources, 280 words
- `src/engine/systems/workbook.ts`: 12 sources, 271 words
- `src/ui/components/WorkThrough.tsx`: 3 sources, 252 words
- `src/engine/systems/playreading.ts`: 8 sources, 178 words
- `src/engine/content/workbook.ts`: 6 sources, 141 words
- `src/ui/looks/classmate.tsx`: 1 source, 109 words
- `src/engine/systems/evaluation.ts`: 6 sources, 101 words
- `src/ui/components/ClassMoments.tsx`: 1 source, 80 words
- `src/engine/systems/workload.ts`: 3 sources, 77 words
- `src/engine/systems/workpieces.ts`: 4 sources, 68 words
- `src/engine/systems/ensemble.ts`: 2 sources, 55 words
- `src/engine/systems/piece.ts`: 2 sources, 19 words
- `src/engine/content/replacements.ts`: 1 source, 19 words
- `src/engine/systems/material.ts`: 1 source, 13 words

## What To Watch For

**What's yours:** classes, coursework and its preparation steps, the teachers' feedback (`systems/coursework.ts`, and `systems/evaluation.ts`'s `chiefLimit`), rehearsals and partners, productions, casting, calls, the director's notes and Looking Back, standing and the term review, the degree, and the How This Works entries `guide/school.ts`, `guide/coursework.ts` and `guide/productions.ts`.

**From the working reference:** examples 2 (a teacher's note on a showing that didn't come together) and 3 (a piece set in class), and in the table below them: Note Not Taken Yet, "(Simulated: the game's summary, not the director's words.)" and "You share no open scene with Chloe…".

**The teacher's voice:** a teacher responding to this performance. Name a specific strength or weakness, give a next step where there is one, and never invent an observation, dialogue or knowledge the simulation doesn't have. A figure to a tenth is the engine's, not the teacher's. A note that comes back ("This is the 3rd time you've had this note") says what was tried and what's still open, and doesn't announce the weakness as new.

**Interactions to read whole:**

- a piece set, its steps prepared (and each refusal, "Read the scene first"), shown, the note, taken or not, and the warning before the term review;
- a classmate's request, answered or not, the rehearsal, and when they don't come;
- casting, the calls, a missed call, the director's note and Looking Back.

**Say plainly:** choosing a way of playing versus rehearsing it; Shown Today versus a full preparation's forecast; a warning (A Word On Your Coursework) versus the formal consequence (the term review).

**Tools that read your words:** `tools/journeys.ts`, `tools/acceptance-ui.mjs` and `tools/playthroughs-ui.mjs` (coursework, feedback and casting).
