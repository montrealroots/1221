# The School Area: Where It Stands

For whoever picks up brief 14's school area next. Read `../prompts/common.md` and `../prompts/school.md` first; this
says only where the work is and what's left. The clone is
`/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/l14-school`, branch `lang14-school`.

## Done

Every one of the area's 615 sources has a status, recorded with `tools/text-inventory.mjs --mark … --by school`
(`docs/text/statuses/school.json`). Five batches, each in `batches.md`:

1. Feedback, the notes ledger, the coursework warning, the term review, the standing notices, `chiefLimit`, the
   Coursework tab (committed first).
2. The rest of `systems/school.ts`, `courserecord.ts`, `leave.ts`, `classmates.ts`, `production.ts`, `briefs.ts`,
   `playreading.ts`, `workbook.ts`, `workpieces.ts` and the rest of the systems.
3. The School screen and its looks and panels.
4. The content files (`content/coursework.ts`, `material.ts`, `school.ts`, `roundups.ts`, `tasks.ts`, `plays.ts`,
   `workbook.ts`, `concerns.ts`, `replacements.ts`, `workload.ts`).
5. The three guides (`content/guide/school.ts`, `coursework.ts`, `productions.ts`), every entry to the brief's eight
   questions with a `next`, every quoted refusal set against its code.

The built app was walked at 1440 and 390 on seven of brief 13's saves (`after-1440`, `after-390`) and on four saves
written again with this code (`after-new-1440`, `after-new-390`); `tools/text-render-check.mjs` found nothing of this
area's on the new saves (the old saves keep their notices and feedback in the words of their day).

## Left, For Someone Else Or Later

- **`src/ui/bank/RoundUps.tsx`** (the money area's) heads the round-ups notes “What SLATE Leaves Out” and prefixes a line
  “Not in SLATE:”. The notes under it (this area's `content/roundups.ts`) say “the game” now.
- **“Sleep owed 1 hours”** on the Player Profile (the render check, workload save): the profile or health area's.
- **A forecast's limit names the task's part, not the card's.** `chiefLimit` reads `TASK_PROFILES[task].prepLabel`, so a
  speech drill's Shown Today says “Rehearsal isn’t complete” where its card calls the part “Drills”. True, and the same
  part, but two names for it. A fix reads the template's `dims` label where there's a template (`evaluation.ts`,
  `showingForecast`); it changes no figure.
- **The Standing tab's paragraph on how the review works** still shows once the School has ended (a withdrawal, a
  dismissal, the degree). It was so at the baseline too; it says nothing untrue, but nothing more is reviewed.

## Watch For

- The part's share (`weightsOf`) chooses the note and reaches no result: it's Note Priority on the card, the look and
  the guides.
- `There’s nothing at school today to miss.` and `You have …` (the prefix `answerRefusal` reads) are compared in code.
- A literal shared with another area: check `grep -rnF` over `src`, `tests` and `tools` before mapping test words.
- **`node tools/voice-check.mjs --fix` with no file rewrites every file in the tree.** Run it with the files named, or
  not at all: one run here contracted a Shakespeare quotation in another area's file before it was reverted.
