# Defects The Health Area Found

Brief 15, 2026-10-19. Functional faults found while reading the health area's sources, apart from the writing.

## Fixed, Inside The Area

1. **A body at its mark was told what happens above it.**
   - **Where:** the Condition look (`sentenceFor`, `src/ui/looks/wellbeing.tsx`).
   - **What:** a body exactly as sound as rest could make it read "Above 100, it settles back toward 100 each
     midnight." That can't happen at 100, and at 91 (fitness 35) it said the same of 91.
   - **How it was found:** reading `looks-before.txt`, the peak band.
   - **The fix:** the sentence is said only when the condition is above the mark (`settleTheBody` pulls a body above
     `mendsTo` down, and does nothing at it).
   - **Test:** `tests/evidence-g06-life.test.ts`, "the Condition look says the midnight pulls it back only for a body
     above what rest can mend it to, not one at it". It fails with the old guard, run with `n >= mends`, and passes
     with the fix.
2. **The Morale look contradicted itself at 62.**
   - **What:** it said "Steady", and then "Down like this, a night clears less …", of the same mood.
   - **Why:** the branch turns at 63, where a night's stress clearing breaks even (`applySleep`), but the words assumed
     a low mood.
   - **The fix:** each branch now gives the line ("Under 63, …", "Above 62, …"), so a steady mood just under it reads
     true. The branch itself is unchanged.
   - **Test:** `tests/evidence-g06-life.test.ts` asserts the 20 and 90 variants.
3. **A lost appeal was titled "Appeal Upheld".**
   - **What:** when a plan kept its denial, the notice was titled "Appeal Upheld". An upheld appeal is one that
     succeeded, so the title said the opposite of its body ("The plan kept its denial …, so the full bill stands.").
   - **Where:** Papers already called the outcome Denial Upheld (`PapersWorkspace.tsx`), so the two disagreed.
   - **How it was found:** reading `registerHealth` against Papers' bill row.
   - **The fix:** the title is "Appeal Lost", beside "Appeal Won" (renames.json). The outcome, `'upheld'`, is unchanged.
   - **Tests:** `tests/evidence-g02-life.test.ts`, `tests/evidence-g05-life.test.ts`, `tests/evidence3-lifepapers.test.ts`
     and `tests/evidence2-b02.test.ts` find the notice by its new title. Under the old title they find none. Their test
     titles, which quote "Appeal Upheld", are kept as the coverage audit cites them.

## For The Coordinator

4. **The booking notice is still telegraphic, and can't change alone.**
   - **Where:** `appointments.ts`, `bookIn`, which writes "A doctor’s visit: booked at … for …, the usual wait where you
     live."
   - **What's missing:** it says what was booked but not what to do next.
   - **Why it's blocked:** the papers guide's papers.doctor example quotes it whole, and
     `tests/guide-examples-papers.test.ts` holds the two equal.
   - **Suggested:** the same sentence, then "Be there then, or press Call It Off on Papers, under Health Cover." Change
     the quote in `src/engine/content/guide/papers.ts` (papers.doctor, steps[0]) in the same commit. Its status is
     Blocked until then.
