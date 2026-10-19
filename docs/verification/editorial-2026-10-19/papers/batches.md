# Papers: Batches

Brief 15, the papers area: 465 sources in 35 files, 55,976 words, every one Pending in the second pass at the start
(`6d111b49`). Each batch below reads its sources again against `docs/STYLE.md` ("Speak like a finished game") and
`docs/GLOSSARY.md`, rewrites what falls short and keeps what doesn't, with the reason in each status
(`docs/text/second-pass/papers.json`).

Conventions this pass kept from brief 14 and doesn't repeat batch by batch:
- **Applying is never holding.** "Applied", "Being Decided", "On Its Way" for what isn't in hand; "you can use it" and
  In Force only for what is.
- **The game's rule is said as the game's,** after the world's, and an estimate says "estimated".
- **One refusal for money:** "Your bank can't cover $…, so nothing was charged." (or paid, changed, moved).
- **No typed rule figure.** Where a sentence typed a rule's number, it reads the constant now; a number under ten in
  prose is in words, through a fixed mapping where the rule's value is the one the words were written for.

Evidence for a guide entry is its rendering with every figure evaluated from the rules (`guide-*.txt` in this folder,
written by a vite-node script over `GUIDE_BY_ID` that prints the parts in the order How This Works shows them), and
`tools/guide-quotes.mjs --check` for its quotes; the built app's Help is read at the end of the area.

## Batch 1: Documents, Status And The Documents Guide

**Sources (75):** `src/ui/papers/Documents.tsx` (13), `src/ui/looks/papers.tsx` (4), `src/engine/systems/documents.ts`
(13), `identity.ts` (9), `residence.ts` (6), `permission.ts` (6), `citizenship.ts` (3), `taxid.ts` (3),
`papervisits.ts` (2), `src/engine/content/visas.ts` (5), `src/engine/content/guide/documents.ts` (11). About 7,900 words.

**Rewritten (35):**
- *Passport And ID tab:* the empty table ("You don't hold any."); the run-out license row ("You can't renew a driving
  license in the game. Use a passport or ID card in force as your photo ID …"); a new passport cancels the old one
  "when it arrives"; Going Abroad names the country it answers for; the ID card's Get toast in its three variants
  (mailed, handed over at the counter, free); the estimated replacement time said as estimated.
- *Permission To Work tab:* the OPT window and months read the rule; Your US Status's out-of-status note gives all three
  consequences; OPT's paragraph says what OPT is first; the Social Security panel ("None yet", the ITIN holds up the
  refund, not the return); Residence Abroad's toasts ("Applied for citizenship and paid $…").
- *A document's page:* "It's no longer in force, so a bank or an office won't accept it."; "It's in force, but another
  passport …"; stolen said as stolen; the gone page without its literary second sentence.
- *Engine:* every "… yet" that promised content the game won't add; the stay lines as sentences; the report-lost and
  police-report refusals in the active voice; the US renewal's terms as two sentences; the passport's arrival notice
  (defects.md, 1); the ID card's arrival notice (the working reference's example 5); the DMV's out-of-status refusal; the
  noncitizen card term without the maintenance sentence; the Social Security refusal and arrival notice; naturalizing
  names the country; the visits' notices (defects.md, 2 and 3); the visas' fine print as sentences.
- *Guide:* Passport And ID's overview; its Now lines (On Its Way, defects.md, 5); the correction sentences on game
  upkeep removed from two Costs; Status's six values; Permission To Work's overview, Time, Registration and next step;
  two connections ("Your status ends on a set day.", the registration prerequisite).

**Kept (40):** the status and kind words, the toasts' openings, the residence routes and refusals, the OPT and status
notices, the replacement refusals, the starting documents' names (keys the code reads), Residence Abroad's entry, and
the guide connections that already say who checks what. Each status gives its reason; a sample is in `retained.md`.

**Meaning-sensitive, and how each was checked:**
- *The passport's arrival:* the sentence now depends on what the passport replaced, read before `issuePassport`
  cancels it; a first passport, a renewal and a renewal with an authorization are played in
  `tests/editorial-papers.test.ts`.
- *"You have your … now":* only on the branch where `documents.apply_idcard` returns no `readyAt`, which is the branch
  that pushes the card with status `valid`.
- *Out of status:* the three consequences are what `permission.ts` does that day (it cancels the visa and sets
  `usOutOfStatus`, which the work and Visa Waiver checks read), as the J16 notice already said.
- *The plan's and the guide's "you can use it from then":* the arrival handler sets status `valid` and `issuedAt`.
- *Social Security:* "once you're registered, the School's work-study counts" is `registered(...)`, the only condition
  between that refusal and the next; the arrival notice no longer asks the player to do what no control does.
- *The guide's Now line:* `idCardOnItsWay` shows On Its Way for a card past SAVE (a citizen's at once).

**Interactions read whole:**
- *An ID card:* Get → refusal (each `idCardRefusal` branch) → toast → row (On Its Way / Being Decided) → the
  card's page → the arrival notice → the guide's Now, Later and If You Can't.
- *A passport:* Apply For One → toast ("Applied and paid … It should arrive by …") → Being Decided → arrival notice →
  page → the lost-or-stolen confirm → police report → the guide.
- *OPT:* the OPT panel → Apply For OPT → toast ("It's decided by …") → Your US Status held → OPT Approved / OPT Denied
  / Your US Status Is Ending / Out Of Status → the guide's Permission To Work. The notices already said what happened,
  what it means as the game's rule, and the next step, and were kept.
- *A Social Security number:* the panel → refusal → Apply → "Applied. The card comes …" → the arrival notice → the
  guide's next step, which now points to what the number opens.

**Tests and tool matchers updated:** `tests/defects-g25-1.test.ts`, `tests/evidence-g15-papers.test.ts`,
`tests/evidence-g16-papers.test.ts`, `tests/evidence-g17-papers.test.ts`, `tests/evidence2-b03.test.ts` (plus an assertion
of the kept visit's body), `tests/evidence2-b05.test.ts`, `tests/remaining-09-journeys.test.ts`,
`tests/remaining-papers.test.ts`, `tests/language-dynamic.test.ts`, `tests/papers-fixes.test.ts`,
`tests/commands-kept.test.ts`, `tests/papers-complete.test.ts`, `tests/defects3-50-70.test.ts`; new,
`tests/editorial-papers.test.ts` (batch 1's variants). `tools/acceptance-ui.mjs`: the ID card toast's matcher ("You
applied for the Non-Driver Identification Card and paid $28.00. The card comes …, and it's good until …").

**Checks (exits read from files in the scratchpad's `papers15/`):** `npx tsc -b --noEmit` 0; `npx eslint` on the 24 changed
files 0; `npx vitest run` on the 20 files holding these sources, 4 failed on old words, fixed, then those and the new file
0 (129 tests); title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0, spelling 0, typos 0, doc-refs 0,
deciders 0, guide-quotes 0 (580 quotes, 0 stale); text-inventory 1 before the marks (the changed sources Pending), then
none of batch 1's sources pending.

**Screens:** the guide entries rendered in `guide-documents.txt`; the built app's Passport And ID and Permission To Work
are read in the area's final walk (below).

## Batch 2: The Tax Returns Tab, The Tax Engine And The Tax Guide

**Sources (199):** the Tax Returns parts of `src/ui/workspaces/PapersWorkspace.tsx` (9: `WhoIsOwed`, `filedWords`,
`amendWords`, `StatePlanPanel`, `ReturnLife`, `PLAN_STATUS`, `TaxPlanPanel`, `PapersWorkspace`, `ReturnsPane`),
`src/ui/components/LienPanels.tsx` (4), `src/engine/systems/taxreturn.ts` (32), `src/engine/systems/statetax.ts` (37),
`src/engine/content/statetax.ts` (86), `src/engine/content/tax.ts` (10), `src/engine/content/guide/taxes.ts` (11), and
one connection of `guide/documents.ts` that took its weeks in words. About 14,000 words. The tax guide was planned as
its own batch; it went with the engine whose words it quotes, inside the size the prompt sets.

**Rewritten (34):**
- *The screen:* an unresearched state's notes ("None added: the game doesn't have this state's rules"); the state
  plan "covers" up to its limit, and a plan being decided gives its day under Answered By; the IRS plan says how it's
  decided with a Social Security number and without (defects.md, 8) and "Not by direct debit" (defects.md, 9); a UK
  year's date and refund; the returns' fine print ("None of it is assessed …"); a lien announced or dropped
  (defects.md, 4).
- *The IRS's letters:* CP503 says it follows the first reminder; CP504 and LT11 say where to pay or set up a plan;
  CP14's weeks in words; the ended plan and the revise refusal in the active voice.
- *The states:* the ended plan; the waiver's window; five fragments made sentences (Louisiana's and Hawaii's letters,
  Ohio's bL0006, Columbus's lien effect, New Mexico's long-term agreement); the unresearched state's line.
- *The guide:* the checking account throughout (the glossary's word from brief 15: 16 places); "send it with File
  It"; "If you don't pay"; weeks and payments under ten in words; a date's comma; Answered By said.

**Kept (165):** every other notice, refusal, label and line, with a reason each. Most of the tax engine's words were
rewritten in brief 14 to say the amount, the year, who acts, when and where to pay, and they still do. The 21 states
other than Connecticut are reachable by no life in New Haven (every life files in Connecticut), and their names,
notice titles and statutes are the agencies' own; their reasons say so. `content/tax.ts`'s labels are tax names the
place page lists; its research notes reach no screen.

**Meaning-sensitive, and how each was checked:**
- *A lien's facts:* each variant matches its status as `stateLienStep`, `fileStateLien` and `stateLienPaid` set it.
- *The IRS plan's two ways:* `tax.apply_plan` decides at `s.now + 60_000` with `hasSsn`, else at `PLAN.mailDays`.
- *"Not by direct debit":* `directDebit` changes the setup fee only (`planFee`); every payment is posted by the plan's
  schedule from the accounts either way.
- *"You'd get a refund":* the UK year's `change < 0` branch is money coming back from HMRC at settlement.
- *The state fragments:* the words only; the codes and titles, which the code keys notices by, unchanged.

**Interactions read whole:**
- *A return due, filed late, the bill, the plan, the lien:* No Returns Yet → the year's panel → File It → the
  toast (`filedWords`) → CP14 → CP501, CP503, CP504, LT11 → Pay → the toast → the IRS plan (apply, Being decided,
  approved, CP523, catch up or end) → the state's bill, notice of intent and lien → Ask For Its Release → the guide's
  four entries. The letters now say where to act each time and why a second one came; the lien no longer says it
  was filed before it was.

**Tests and tool matchers updated:** `tests/remaining-tax.test.ts` (and a new assertion of the state's ended plan),
`tests/scope-taxpapers.test.ts` (and a new assertion of the IRS's ended plan), `tests/defects-g8-8.test.ts`,
`tests/guide-examples-papers.test.ts` (the late example's comma, and the lien example's regex now reads "…, with");
new tests in `tests/editorial-papers.test.ts` (batch 2: a played 2027 return; the lien's announced and dropped facts;
the state fragments; the waiver). No tool matcher read these words: `tools/acceptance-ui.mjs`'s lien matcher
(`· Filed.` and `recorded in the town clerk`) still reads the Filed variant.

**Checks:** `npx tsc -b --noEmit` 0; `npx eslint` on the 13 changed files 0; `npx vitest run` on the 34 tax and papers
files, 1 failure (the lien example's regex reading the old "… with"), fixed, then 0; the new file 13 of 13; title-case,
label-sweep, plural-check, voice-check, tics, spelling, typos, doc-refs, deciders and guide-quotes 0.

**Screens:** the guide entries rendered in `guide-taxes.txt`; the Tax Returns tab drawn on a played 2027 return in the
new test; the built app's Tax Returns on the tax, lien, missed-plan and nonfiler saves in the area's final walk.
