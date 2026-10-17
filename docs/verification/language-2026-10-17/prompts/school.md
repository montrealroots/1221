# Brief 14: The School Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/l14-school`, on its branch `lang14-school`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `school` (`docs/verification/language-2026-10-17/school/`, `docs/text/statuses/school.json`).
- **Your port** for the built app: 4203.

## What's Yours

The inventory's subsystem school: 610 sources, 62,227 words, in 38 files. Each file, its sources and its words, biggest first:

- `src/engine/content/guide/coursework.ts`: 22 sources, 9,976 words
- `src/engine/content/guide/school.ts`: 25 sources, 9,677 words
- `src/engine/content/guide/productions.ts`: 22 sources, 9,452 words
- `src/engine/content/coursework.ts`: 68 sources, 8,156 words
- `src/engine/content/material.ts`: 98 sources, 4,813 words
- `src/engine/systems/leave.ts`: 43 sources, 2,395 words
- `src/engine/content/roundups.ts`: 22 sources, 2,386 words
- `src/ui/workspaces/SchoolWorkspace.tsx`: 20 sources, 2,343 words
- `src/engine/systems/school.ts`: 54 sources, 2,093 words
- `src/ui/components/StudyPlanPanels.tsx`: 8 sources, 1,450 words
- `src/engine/systems/coursework.ts`: 37 sources, 1,296 words
- `src/engine/content/concerns.ts`: 1 source, 844 words
- `src/engine/content/school.ts`: 31 sources, 722 words
- `src/ui/looks/school.tsx`: 4 sources, 713 words
- `src/ui/components/BriefPane.tsx`: 6 sources, 607 words
- `src/engine/content/plays.ts`: 6 sources, 542 words
- `src/ui/components/CourseworkPane.tsx`: 12 sources, 529 words
- `src/engine/systems/classmates.ts`: 26 sources, 503 words
- `src/engine/content/workload.ts`: 2 sources, 488 words
- `src/ui/components/RehearsalProcess.tsx`: 4 sources, 362 words
- `src/engine/systems/briefs.ts`: 13 sources, 351 words
- `src/engine/systems/production.ts`: 7 sources, 349 words
- `src/ui/components/PlayingChooser.tsx`: 5 sources, 317 words
- `src/engine/content/tasks.ts`: 16 sources, 302 words
- `src/engine/systems/workbook.ts`: 12 sources, 255 words
- `src/ui/components/WorkThrough.tsx`: 3 sources, 247 words
- `src/engine/systems/courserecord.ts`: 9 sources, 241 words
- `src/engine/systems/playreading.ts`: 8 sources, 163 words
- `src/engine/content/workbook.ts`: 6 sources, 144 words
- `src/ui/looks/classmate.tsx`: 1 source, 113 words
- `src/engine/systems/evaluation.ts`: 5 sources, 81 words
- `src/ui/components/ClassMoments.tsx`: 1 source, 78 words
- `src/engine/systems/workload.ts`: 3 sources, 67 words
- `src/engine/systems/workpieces.ts`: 4 sources, 66 words
- `src/engine/systems/ensemble.ts`: 2 sources, 55 words
- `src/engine/content/replacements.ts`: 1 source, 19 words
- `src/engine/systems/piece.ts`: 2 sources, 19 words
- `src/engine/systems/material.ts`: 1 source, 13 words

A file of yours that another area's tests or tools assert is still yours to change; update those assertions and say so in your batch record.

## What To Watch For

- **Faculty feedback** (`systems/coursework.ts` `noteText`, `feedbackWords`, `remedyWords`, the term warning and
  review): a teacher talking about this piece. Say what they saw (the part that was short or strong, as the game
  records it) and what to do next. Invent no observation or quotation. Label it as the teacher's note.
- **Repetition:** a note that comes back says what changed since last time, what's still open and what was already
  done. Brief 13's records count "The Note Was Taken" 31 times in one journey, and "Shown: … , Strong" 15. Make a
  returning message acknowledge the history the game keeps, and don't paraphrase at random.
- **Standing:** name the actual consequence. "Your standing falls a step" becomes what the next step is: an academic
  warning, the casting pool, dismissal, as the rules say for that standing. The coursework warning isn't the term
  review, and the text says so.
- **The part most often short** (`shortCause`, brief 13's D2) and **a choice rehearsed in**: say what's meant. Is the
  scene's way of playing chosen but not yet rehearsed? Is the piece unready because the lines aren't learned? Keep each
  of `shortCause`'s three cases distinct.
- **Assignments, showings, readiness and the forecast:** how ready a piece is now and the fully prepared forecast are
  different things. Keep "forecast" for a forecast.
- **Casting, productions, leave, the additional term and the degree,** and their refusals.
- **Watch for keys:** the `Cast: ` title prefix and `Yale Cabaret` are read back by the code (common.md).
- **The judge reads some of these files** (`content/coursework.ts`, `material.ts`, `tasks.ts`, `plays.ts`): change
  words only, never a number, an id or a list's order.

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
