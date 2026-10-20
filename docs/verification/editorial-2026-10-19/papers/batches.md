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

**Rewritten (32):**
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

**Kept (43):** the status and kind words, the toasts' openings, the residence routes and refusals, the OPT and status
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

**Sources (189):** the Tax Returns parts of `src/ui/workspaces/PapersWorkspace.tsx` (9: `WhoIsOwed`, `filedWords`,
`amendWords`, `StatePlanPanel`, `ReturnLife`, `PLAN_STATUS`, `TaxPlanPanel`, `PapersWorkspace`, `ReturnsPane`),
`src/ui/components/LienPanels.tsx` (4), `src/engine/systems/taxreturn.ts` (32), `src/engine/systems/statetax.ts` (37),
`src/engine/content/statetax.ts` (86), `src/engine/content/tax.ts` (10), `src/engine/content/guide/taxes.ts` (11), and
one connection of `guide/documents.ts` that took its weeks in words. About 14,000 words. The tax guide was planned as
its own batch; it went with the engine whose words it quotes, inside the size the prompt sets.

**Rewritten (26, and the documents guide's connection):**
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

**Kept (163):** every other notice, refusal, label and line, with a reason each. Most of the tax engine's words were
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

## Batch 3: Health Cover, Unemployment, Benefits, Pensions, Banking Abroad And The Papers Guide

**Sources (96):** the rest of `src/ui/workspaces/PapersWorkspace.tsx` (12: `HealthPane`, `aidWord`, `TherapyRow`,
`ConditionsPanel`, `DentalPanel`, `STATE_NAMES`, `HomeClaimsPanel`, `AssistancePanel`, `EiPanel`, `BenefitsPane`,
`YourDoctor`, `PensionsPanel`); `src/engine/systems/unemployment.ts` (7), `assistance.ts` (6), `homebenefits.ts` (5),
`universalcredit.ts` (5), `eiself.ts` (2), `homepensions.ts` (6), `socialsecurity.ts` (3), `statepension.ts` (3),
`imss.ts` (3), `abroad.ts` (15); `src/engine/content/safetynet.ts` (6), `workrules.ts` (1); and
`src/engine/content/guide/papers.ts` (22). About 14,800 words. Health Cover's systems are the health area's; its panels'
words on Papers, and the papers guide's entries about them, are this area's.

**Rewritten (14):**
- *Health Cover:* Your Conditions became **Your Long-Term Conditions** and Left Alone **Left Untreated**, with Let It
  Go's toast "Care stopped. It's left untreated from now on." (the glossary's long-term condition and left untreated,
  `renames.json`); the fine print "at what your plan doesn't cover"; Apply For HUSKY D's toast ("decided on …"); "Your
  medical debt is paid off."; financial assistance over the limit says nothing came off the bill; the dental toasts.
- *Unemployment:* "The game certifies each week for you on Sunday …"; "count toward the claim's base period"; the
  benefit year's end ("The benefit year ended a year after you filed.").
- *Banking abroad:* "There's no known way to open anything new at … from America …", the refusal decision 4's
  `bank.take_overrun_loan` returns, its behavior unchanged.
- *The guide:* Health Cover's and the doctor's overviews (the first action first, your share, financial assistance);
  Conditions And Therapy's overview (the rates moved to What Decides It, How Often A Life Begins With One); the
  benefits overview without the formula; the checking account (FROM_CURRENT and the rest, 9 places); three connections.

**Kept (82):** the benefits, pensions and assistance refusals and notices (each says its rule's figure against your
record), Your Doctor and its fine print, the pensions panels, the research and plan names in `safetynet.ts` and
`workrules.ts`, the banking-abroad sentences built from each bank's own terms, and the guide's overview, pensions and
most connections. Universal Credit, Jobseeker's Allowance, EI, the Seguro de Desempleo, the UK's, Ireland's and
Mexico's pensions and Ontario's and BC's assistance are reached by no life in New Haven; their reasons say so.

**Meaning-sensitive, and how each was checked:**
- *"Care stopped. It's left untreated from now on.":* `health.treat` with `on: false` stops the care and the refills
  at once (the guide's Now line, unchanged); `tests/evidence-g04-life.test.ts` presses it.
- *"so nothing came off this bill":* the over-the-limit branch sets `aid: 'refused'` and leaves the amount;
  `tests/defects-g8-6.test.ts`.
- *"The game certifies each week for you":* `BENEFIT_WEEK_KIND` certifies on Sunday with no player action.
- *The doctor's overview:* every figure and condition kept (the wait, the hour, the uninsured price at Fair Haven),
  only the order and the sentences changed; the doctor's example still plays (`tests/guide-examples-papers.test.ts`).

**Interactions read whole:**
- *Unemployment claimed:* No Claim Open (what filing now would pay, or why not) → File A Claim → "Claim filed: $… a
  week." → A Connecticut Claim → Sunday's certification → "Your Unemployment Claim Ended" → Past Claims → the guide's
  Unemployment And Assistance.
- *A long-term condition:* the row → Let It Go → the toast → Left Untreated → the Monday toll → Keep It Up → the
  guide's Conditions And Therapy. The panel, the row, the toast and the guide now use the same words.
- *A medical bill:* Care And Its Bills → Appeal It / Apply For Assistance → the toasts → Pay It Off → the guide.

**Tests updated:** `tests/evidence-g04-life.test.ts`, `tests/evidence-g03-life.test.ts`, `tests/evidence-g05-life.test.ts`,
`tests/evidence3-lifepapers.test.ts`, `tests/evidence2-b02.test.ts`, `tests/defects-g8-6.test.ts`,
`tests/remaining-health-eligibility.test.ts`, `tests/evidence-g16-papers.test.ts`, `tests/remaining-09-banking.test.ts`,
`tests/home-account-setoff.test.ts`. No tool matcher read these words.

**Checks:** `npx tsc -b --noEmit` 0; `npx eslint` on the changed files 0; `npx vitest run` on the 30 health, benefits,
pensions, banking-abroad and guide files 0 (374 tests); the guide's three test files 0 (40); title-case, label-sweep,
plural-check, voice-check, tics, spelling, typos, doc-refs, deciders and guide-quotes (581 quotes, 0 stale) 0.

**Screens:** `guide-papers.txt`; the built app's Health Cover and Unemployment tabs in the walk below.

## Batch 4: The Generated Research: Passports, Licenses And License Paths

**Sources (105):** `src/engine/content/passports.ts` (15), `passportsabroad.ts` (2), `licenses.ts` (19),
`licensepaths.ts` (69). About 18,900 words, most of them research notes no screen shows.

**Read, and how it was decided what reaches a player:** every reader of each export was followed (`grep` over `src/`).
- `passports.ts` is generated by `tools/build-passports.mjs` from `docs/research/world/research-passports.json` and says
  not to edit it by hand. A screen shows each office's `name` and `issuer` (Your Passport's subtitle, a refusal, the
  arrival notice) and, for a US citizen applying at home only, the US entry's `feeBasis` and `abroad` in the fine print
  (`passportOffice`). Every life lives in New Haven, so another office's `feeBasis`, `abroad` and `lost` never show.
- `passportsabroad.ts`'s terms are what a citizen of anywhere else reads under Your Passport, with the game's
  assumptions under "Assumed in the game:". They were rewritten in brief 14 as sentences that say what's assumed and
  why, and still do.
- `licenses.ts` is generated by `tools/build-licenses.mjs`. Only a US-born citizen starts with a license, from a US state
  (`startingDocuments`), so only the New York, Connecticut and California entries' `name` and `authority` reach a
  screen, on the license's page. Since driving went (2026-10-09) the notes, steps, renewal and visitor texts reach none.
- `licensepaths.ts` has no reader: only its `LicenseStage` type is imported (`systems/documents.ts`).

**Rewritten:** none. **Kept (105):** each with the reason above specific to its kind. The one blemish a player can
meet, the US fee basis's closing fragment "Two separate payments.", is the research's own sentence; changing it means a
curated basis in the build tool and a rebuild, which this pass didn't do (the coordinator's, in the report).

**Checks:** nothing changed in these files, so no test or check moved; `node tools/text-inventory.mjs --check` holds
their statuses.

## The Built App, At The End

- **Build:** `npm run build` 0, served on port 4287 with `vite preview --strictPort`; `curl … | cmp - dist/index.html`
  matched before anything was read. Built and walked twice: once when the text was done, and again on the final code
  after the IRS plan's paragraph was split (below); `after-1440/` and `after-390/` are the second walk. The server was
  stopped by its process id each time.
- **The walk:** `tools/text-walk.mjs` on the tax, health, lien, missed-plan, nonfiler and withdraw saves
  (`b15-saves/`), at 1440 (`after-1440/`) and 390 (`after-390/`), 25 screens each, exit 0 both.
  `tools/text-render-check.mjs after-1440 after-390`: 54,826 strings, 0 faults, exit 0.
- **Before and after:** `walk-compare-1440.txt` sets each Papers tab's changed lines beside the walk on `main` at
  `bdb23949` (`b15-before/walk-1440/`): 28 of the six saves' Papers screens changed, 8,952 words before and 9,042 after.
  Notices in the saves keep the words of the day they were written, so the notices' new words are read in the tests.
- **How This Works on the built app:** `help-1440.json` holds the 11 entries of this area that a Papers panel opens,
  each opened by its How This Works button on the tax save, Show Everything pressed, read whole (the overview entry,
  Papers, opens from the guide's contents, not a panel).
- **At 390:** screenshots of each Papers tab and of the changed panels (`shots-390/`). Nothing of this area's text runs past
  the edge; the tab strip and the bills table scroll, as they did before. The IRS plan's paragraph, about 120 words
  once it said how a plan is decided without a Social Security number, was a wall at 390 and became two: what the plan
  is, then, dimmer, how it's decided and what it changes (`TaxPlanPanel`, its status marked again on the same test).

## Checks, At The End

Run from the clone on the final code (`6f0391a7` and these records), each exit read from a file in the scratchpad's
`papers15/`.

| Check | Exit |
|---|---|
| `npx tsc -b --noEmit` | 0 |
| `npx eslint` on every file this area changed, `--max-warnings=0` | 0 |
| `node tools/title-case.mjs --check`, `label-sweep`, `plural-check`, `voice-check --check`, `tics --check`, `spelling`, `typos` | 0 each |
| `node tools/text-inventory.mjs --check` | 0: papers 465 sources, Rewritten 73, Retained 392, Pending 0, Blocked 0; engine-speak 3, unchanged (`licensepaths.ts`, which nothing reads) |
| `node tools/doc-refs.mjs --check`, `deciders --check`, `guide-quotes --check` | 0 each; 581 quotes, 0 stale |
| `npx vitest run`, the whole suite once (`vt-full.txt`) | 1: 4,724 of 4,726 tests in 390 of 392 files. The two failures were `tests/evidence2-b13.test.ts` and `tests/evidence3-person.test.ts` (the removed interests' stale-claims check, which reads `docs/`): one of this area's reasons in `papers.json` said "that interest", which the check reads as one of the removed interests. The reason was reworded and the source marked again; both files then 0 (26 of 26). Started before the IRS plan's paragraph was split in two; `tests/editorial-papers.test.ts` and `tests/scope-taxpapers.test.ts`, which draw that panel, 0 after it (30 of 30). |
| `npm run build` | 0 |
| `node tools/text-walk.mjs`, six saves, at 1440 and 390, on the final build | 0 and 0: 25 screens each on every save |
| `node tools/text-render-check.mjs after-1440 after-390` | 0: 54,826 strings, 0 faults |
