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
