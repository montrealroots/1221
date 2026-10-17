# Brief 13, Interface: Three Playthroughs Of The Built App, And The Owner's Route (2026-10-17)

Read `common.md` first. Your area is `interface`; your clone is `…/scratchpad/interface13`, branch `interface13`.

## The Owner's Ask

Brief 13's section 5 is yours, whole. Quote it in your criteria as the owner wrote it. In short, at least three distinct
multi-step playthroughs of the built application, covering desktop and mobile widths overall:
- **A normal student journey.**
- **A setback-and-recovery journey.**
- **A specialist's preparation, performance, advice and training journey.**

Each exercises navigation, drill-down explanations, unavailable-action reasons, confirmation steps, notifications, and
save and continue. Use screenshots or structured traces. Engine-only tests are no substitute. Then a separate short
walkthrough for the owner to play by hand. Automated interface tests are never to be described as human usability
approval.

## What Exists

- **`tools/acceptance-ui.mjs`:** brief 11's and 12's built-app run, 76 steps at 1440 and at 390. It covers creation, the
  guide, Home, the Advance and Look After Yourself menus, Coursework, help, Money, Papers and save and continue. Then
  steps on saves `tools/scenario-saves.mjs` writes: brief, rehearsal, direction, workload, lien, missed-plan, leave and
  others.
- **Its playthroughs are short,** a step or two each. Brief 13 asks for longer ones that carry one player through many
  steps in order, with what each screen says recorded.
- **Other tools:**
  - `tools/captures.mjs`: full-height captures;
  - `tools/screens-check.mjs`: every screen and tab;
  - `tools/ui-audit.mjs`: widths.
- **The confirmation steps:**
  - the Advance confirm (`TimeControls.tsx`);
  - Delete on the save slots ("Confirm Deletion");
  - Call Off The Leave (`StudyPlanPanels.tsx`);
  - Report It Lost on Passport And ID;
  - the bank's cancellations.
- **Brief 12's walkthrough:** `docs/verification/resolution-2026-10-17/PLAYTEST.md`.

## How To Work It

1. **Write the three playthroughs first,** in `docs/verification/playthroughs-2026-10-17/interface-criteria.md`,
   committed before the tool:
   - each one's player, starting point (a new life, or a save `tools/scenarios.ts` writes, said as such), and steps in
     order;
   - what each step must show, and the width it runs at. At least one playthrough at 390, and each of the six things
     (navigation, drill-down, an unavailable action's reason, a confirmation, a notification, save and continue)
     exercised in each.
   - **Setback and recovery:** a real setback the game gives, recovered through what the game offers. A missed piece of
     coursework and its warning, then the work done and the warning answered, is one; a held account paid, or a missed
     plan caught up, are others.
   - **The specialist's:** a brief prepared, a way of playing chosen, taped, the take read, the advice read, the
     exercise it names trained, and the brief taped again better.
2. **The tool:** a new `tools/playthroughs-ui.mjs` beside `tools/acceptance-ui.mjs`. Reuse its helpers by copying what
   you need, without changing its 76 steps. It drives the built app through its visible controls only, at a width, and
   writes:
   - a structured trace, each step with what was pressed, what the screen said, the clock, and passed or failed;
   - a screenshot at each milestone.

   It goes in `docs/verification/playthroughs-2026-10-17/interface/<playthrough>-<width>/`. Keep the screenshots few and
   small: the milestones, not every step.
3. **Run it** on a build of your clone, served by `npx vite preview` on a port of its own (4187 or 4188), each width a
   separate run.
4. **A step that fails** is a defect in the game or in the playthrough's expectation. Fix a game defect with its test (an
   engine test, or a drawn screen under the mocks), and say an expectation that was wrong, and why.
5. **The owner's short walkthrough:** `docs/verification/playthroughs-2026-10-17/PLAYTEST.md`, a different route from
   brief 12's, about twenty minutes. It carries a setback and its recovery, and a specialist's training. Each step says
   what to press, what to expect, and what to report. It says plainly that the automated runs aren't a judgment of how
   the game feels to play.

## Your Result

`docs/verification/playthroughs-2026-10-17/interface-result.json`:
- **Each playthrough at each width:** its steps, passed or failed, its trace and screenshot files, and what it
  exercised of the six.
- **The defects:** found, fixed and tested.
- **The commands,** for the coordinator to repeat on the tested commit.
