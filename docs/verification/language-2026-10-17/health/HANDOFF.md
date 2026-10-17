# Health Area: Where It Stopped

Brief 14, 2026-10-17. Batch 1 is committed (`93cf918b`) and verified. Batch 2 is applied and committed as work in
progress (this commit), with its tests part-updated and not yet green.

## Done

- **Batch 1** (`batches.md`): `wellbeing.tsx` (13 sources, with the new `#WHAT`), `guide/body.ts` (8),
  `lifespan.ts#AGING`: Rewritten And Verified. 563 of 564 tests, then the last fixed; checks all 0.
- **Batch 3's marks** (no code change): world-data, geography (all but `loadCountryCities`), invariants, deciders,
  rng, performer, carevisits, content/clinics, content/injury, content/body, systems/body, mortality: Reviewed And
  Retained, each with its reason, in `docs/text/statuses/health.json`.

## Batch 2, In Progress

- **Applied** (scripts kept in the session's scratchpad, `hw/b2.py` then `hw/b2r.py`, which put back the refusals
  whose old words were already plain, so the papers guide's quotes of them stay true): every notice and refusal in
  `systems/health.ts`, `appointments.ts`, `clinics.ts`, `therapy.ts`, `injury.ts`, and `geography.ts#loadCountryCities`.
  `guide/papers.ts:375` (the papers area's) changed to quote the new HUSKY D line, because
  `tests/guide-examples-papers.test.ts` requires the quote to equal `mayEnroll`'s words.
- **Tests:** the first run on 53 files had 150 failures, all of them old words. Fragments were mapped old to new in
  the 37 failing files (titles held unchanged), and the hand cases done (appeal upheld, claim denied, billed again,
  longer supply, course done, denial, public cover ends, out of status). Still to fix, known: the injury notices'
  first sentence ("10 days to mend." is now "It takes 10 days to mend, and you can’t work out until then." for a
  sprain, strain or back; "…, and you’re laid up until then, kept from classes, work and training." where laid up),
  the care notices' "due in 30 days" (now "due on <date>. It’s paid from your current account then, and if there
  isn’t enough, it becomes medical debt."), the stay and the flu's added sentences, the appointment notice's added
  sentence where tests assert it whole, the Diagnosed notice, the prescription run out, and "You have no health cover
  from … Enroll on Papers, under Health Cover." where a test asserts the cover-ended notice whole.
- **The rerun after the mapping** finished after this was first written: 59 failed, 480 passed, in 23 of the 37 files.
  Its full output is `batch2-rerun.txt` in this folder; `grep "^ FAIL " batch2-rerun.txt` lists them.
- **Next:** rerun `$(cat hw/failfiles.txt)`, fix each failure to the new words as exactly as before, then the checks
  (tsc, eslint, the writing tools, text-inventory), mark the batch 2 sources (the rewritten ones Rewritten And Verified
  with the tests as evidence; the labels, memos, care names, program names and system labels in health.ts Reviewed And
  Retained), finish `examples.json` (the drafted pairs in `hw/ex2.py` need their verbatim befores from `git diff
  tests/`), write batch 2 in `batches.md`, commit.
- **Then:** the whole suite once, the build, the text walk at 1440 and 390 on port 4207, `text-render-check`.

## For The Coordinator

- `guide/papers.ts` quotes these refusals and notices verbatim, and they changed: lines 315 (“You’re uncovered from …”
  is now “You have no health cover from …”), 334 (the outside-open-enrollment refusal, now “It’s outside open
  enrollment, November 1 to January 15, and you haven’t lost cover in the last 60 days.”), 339 and 375 (the HUSKY D
  line), 340 (“Enroll gives it.” is now “so press Enroll instead.”), 341 (the three hardship refusals), 344 (the
  appeal window), 454 (“Your doctor has to be in the town you live in.”), 479 (the appointment notice).
- `defects.md` 5 and 6: the Profile's "Sleep owed 1 hours" and life.ts's "dial" are other areas'.
- `glossary.md`: Core's energy ("sleep and food") and condition definitions are wrong against the code.
