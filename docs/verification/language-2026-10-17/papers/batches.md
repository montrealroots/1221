# Papers: Batches

Brief 14, the papers area: 465 sources in 35 files, 53,141 words at the baseline (`d82d38d0`). Every source has a
status (`docs/text/statuses/papers.json`): 222 rewritten, 243 reviewed and kept. Engine-speak in these files fell from
73 to 3; the three left are in `src/engine/content/licensepaths.ts`, which nothing reads (defects.md, 5).

The house conventions this pass used throughout, so each batch below doesn't repeat them:

- **The game's own rule is said as the game's.** Where the world's rule isn't published or the game doesn't model it,
  the sentence says what's published first and then “In the game, …” or “so the game …”, in place of “SLATE takes”,
  “SLATE’s assumption” and “SLATE’s estimate”. An estimated figure says “estimated”.
- **Applying is never holding.** “Applied”, “Being decided” and “decides by …” for an application; “In Force” only
  for what's granted. A toast after applying names who decides and when.
- **A consequence is never more certain than the rule.** Where the agency's own rule is unpublished, the sentence says
  so before saying what the game does (“What happens after a missed payment isn’t published. In the game, the plan
  ends.”).
- **Every fee, date and condition kept.** No figure was retyped: where a sentence had typed a rule's figure, it now
  reads the constant (defects.md, 3).
- **One refusal shape for money.** “Your bank can’t cover $…, so nothing was charged.” (or “paid”, or “changed”), in
  place of “… is more than the bank can cover.” and its variants.

## Batch 1: The Papers Screen

**Sources:** `src/ui/workspaces/PapersWorkspace.tsx` (21 sources), `src/ui/components/LienPanels.tsx` (4).

**Changed:** the screen's subtitle (all five tabs, in their order); Who Is Owed and its assessed-by lines; the state
plan panel (its tiers, each “up to N months for $X or less”, the cure, the missed-payment rule as unpublished, “Apply For
The Plan” in place of “Ask For The Plan”, the toast); the IRS plan panel (“Plan Type”, “Catch Up By”, the plan's two
statuses “Being decided” and “Declined”, the toast naming the setup fee); payments (“{amount} paid. {tax} went to the
tax, …”, and the IRS toasts “Paid the IRS: …. You still owe ….” and “Paid the IRS in full.”); the interest note and
the returns' fine print, now read from `COLLECTION` and `RETURN`; return line labels (“Home Sale Gain Excluded From
Tax”, “Credit For Tax Paid To Another Country”, “{State}’s Credit For Tax Paid To Another State”, “Your Refund”); UK tax
years; the health tab's public-cover paragraph, the notice of noncompliance, hardship, aid and medical-debt words;
conditions, dental and therapy (“Begin A Course Of 6 Sessions”); benefits and pensions panels; Your Doctor's toasts
(“… is now your doctor.”); the lien panels' facts, requests and toasts.

**Kept:** the ledger's account names the code reads; `Pay (Blank Pays It All)`, shared with the School; Keep It Up and
Let It Go, which `health.ts`'s notice quotes; `aidWord`'s three labels and `STATE_NAMES`; the lien `STATUS` words.

**Meaning-sensitive:** the state plan's missed-payment rule (unpublished, said so before “In the game, the plan ends”);
the IRS plan's statuses (applying vs in force); the lien release toasts (a date the agency is “to” meet, not a fact);
“count as met” for a hardship exception. Each checked against the command's own result in the tests below.

**Tests updated:** `tests/scope-taxpapers.test.ts`, `tests/liens-and-arrangements.test.ts`,
`tests/evidence-g16-papers.test.ts`, `tests/evidence2-b06.test.ts`, `tests/remaining-09-coverage.test.ts`,
`tests/defects-g8-6.test.ts`, `tests/remaining-health-eligibility.test.ts`, `tests/scope-health.test.ts`,
`tests/evidence-g02-life.test.ts`, `tests/evidence-g03-life.test.ts`, `tests/evidence-g04-life.test.ts`,
`tests/state-tax.test.ts`, `tests/tax-places.test.ts`. **Matchers updated in `tools/acceptance-ui.mjs`:** “Apply For The
Plan”, “Applied: $… a month. Connecticut DRS decides by”, “Asked. It’s to be released by”, “It’s to be released by”
(twice), “Applied. The IRS answers by”, `/^(Being decided|In force)$/`, `/^Catch Up By$/`, and, after the
first acceptance run at the end showed them reading the old words: the work rules' sentence (“From 2027 Medicaid also
has work rules. You meet them …”), the state's assessment (“Connecticut DRS assessed this year on …, with no return
from you”), Connecticut's interest (“12% a year, simple, for each month or part of one”), the lien's record (“recorded
in the town clerk”) and the IRS plan's scope (“It’s for federal tax only: a state has its own plan for what you owe
it.”). `tests/evidence-g32-ui.test.ts` (What Needs You) reads the return's “File it by …”.

**Screens verified:** the text walk's Papers screens, every tab, on the tax, lien, missed-plan, nonfiler, withdraw and
brief saves, at 1440 and 390 (`after-1440/`, `after-390/`).

## Batch 2: The Tax Engine And Its Rules

**Sources:** `src/engine/systems/taxreturn.ts` (32), `src/engine/systems/statetax.ts` (37),
`src/engine/content/statetax.ts` (86), `src/engine/content/tax.ts` (10).

**Changed:** every IRS notice body (CP14, CP501, CP503, CP504, LT11, Letter 3172, CP523, CP2566, the levy, the offset,
the plan's approval, refusal and end, the amended return's), every refusal, the decision on a year's return, the split
of an older save's single balance, the IRS plan's fine-print source (a research file's name was in it); every state's notice body (“{code}: you owe $… on your {year} {state} return. … You can
pay it on Papers, under Tax Returns.”), its plan refusals and notices, the lien notices, the waiver and three-year
notices; the state rules' sentences in `content/statetax.ts` (research file names out of the player's sources, “isn’t
published, so in the game its review takes 30 days”, six estimated-assessment notices “based on” what was reported).

**Kept:** the ledger memos and labels the code and the tests read (`Interest`, `Tax On Interest`, `Tax Refund`, `refund
offset`, the plan payment memos); each state's notice code and title; `stateName`; the time zones; 29 state notice
fragments that already read as plain sentences once the body capitalizes them.

**Meaning-sensitive:** Letter 3172 promised a hearing nothing offers (defects.md, 2); the state notice no longer says
“Pay it, or apply for … plan” where Ohio's plan comes only after a later step; the plan refusal's two sentences keep
the words “payment plan” and “application” that `/payment plan|application/` reads (defects.md, 4); a state's
missed-payment ending is said as the game's rule. Checked by the tests below, which play each notice.

**Tests updated:** `tests/remaining-tax.test.ts`, `tests/tax-lifecycle.test.ts`, `tests/state-tax.test.ts`,
`tests/tax-places.test.ts`, `tests/save-migration.test.ts`, `tests/evidence-g17-papers.test.ts`,
`tests/defects-g8-7.test.ts`, `tests/defects-g24-1.test.ts`, `tests/coverage-gaps-papers.test.ts`,
`tests/papers-transitions.test.ts`, `tests/remaining-09-banking.test.ts`.

## Batch 3: The Tax Guide

**Sources:** `src/engine/content/guide/taxes.ts` (11): four entries, `taxes.return`, `taxes.pay`, `taxes.plan`,
`taxes.lien`, each now answering the eight questions in order, with the screen's own labels and a `next`.

**Changed:** every entry rewritten from drafts (`taxes-return.ts`, `taxes-pay.ts`, `taxes-plan.ts`, `taxes-lien.ts` in
the scratchpad); the quoted refusals and toasts now match the screen word for word. **Kept:** `PART`, `REFUND_WORDS`,
the time zone. **Meaning-sensitive:** the penalty's reduction under a plan (0.25% only for a return filed on time), the
release and withdrawal dates, the offset. **Tests:** `tests/guide.test.ts`, `tests/guide-examples-papers.test.ts`
(its regexes read the new example text).

## Batch 4: Documents, Status And The Documents Guide

**Sources:** `src/ui/papers/Documents.tsx` (13), `src/ui/looks/papers.tsx` (4), `src/engine/systems/documents.ts`
(13), `identity.ts` (9), `residence.ts` (6), `permission.ts` (6), `citizenship.ts` (3), `taxid.ts` (3),
`papervisits.ts` (2), `src/engine/content/visas.ts` (5), `src/engine/content/guide/documents.ts` (11).

**Changed:** the documents table (“Status”), each refusal and toast, the lost-or-stolen confirm (“… canceled for good,
even if it turns up, along with any visa or travel authorization issued on it. An F-1 status you hold continues.”), the
run-out note on a license, the going-abroad and residence panels, OPT's paragraph, the Social Security and ITIN
panels; the look's kind words (defects.md, 6) and summaries; the three documents guide entries with `next`.

**J16, the out-of-status notice:** “You stayed in the United States past the end of your status, so you’re now out of
status. In the game, your US visa is canceled and the Visa Waiver Program is closed to you from now on.” The ending
decision: “… If you’re still here after that, you’ll be out of status. In the game, that means you can’t work here,
your US visa is canceled, and the Visa Waiver Program is closed to you from then on.” Each consequence is what
`permission.ts` does on that day (it cancels the visa and sets `usOutOfStatus`, which the waiver and work checks read),
said as the game's rule, not as US law's certain outcome. Meaning-sensitive; `tests/evidence2-b12.test.ts` asserts it.

**Kept:** the document names the code reads (F-1, OPT, Passport, Driver License), `PLAIN_NAME`, `STATUS_WORD`, the
residence panel's fallback labels, the starting documents' research line.

**`next: []`:** `documents.residence`, because moving abroad isn't part of the game: the panel is for reference, and
nothing on it can be done next.

**Tests updated:** `tests/documents.test.ts`, `tests/evidence-g15-papers.test.ts`, `tests/evidence2-b05.test.ts`,
`tests/evidence2-b12.test.ts`, `tests/idreplace.test.ts`, `tests/residence.test.ts`, `tests/permission.test.ts`,
`tests/defects-r7-1.test.ts`, `tests/defects-g25-1.test.ts`, `tests/defects3-50-70.test.ts`, `tests/papers-complete.test.ts`,
`tests/papers-fixes.test.ts`, `tests/commands-kept.test.ts`, `tests/remaining-09-journeys.test.ts`,
`tests/remaining-papers.test.ts`, `tests/looks.test.ts` (read, not changed). **Matchers:** the ID card toast and “One
is already on its way.” in `tools/acceptance-ui.mjs`.

## Batch 5: Benefits And Pensions

**Sources:** `unemployment.ts` (7), `assistance.ts` (6), `homebenefits.ts` (5), `universalcredit.ts` (5), `eiself.ts`
(2), `homepensions.ts` (6), `socialsecurity.ts` (3), `statepension.ts` (3), `imss.ts` (3), `abroad.ts` (15).

**Changed:** each refusal (“You can claim it from 66.”, “It’s only for Mexican citizens.”, “In the game, SNAP is only
for US citizens, because a noncitizen’s eligibility depends on immigration details the game doesn’t track.”, Seguro de
Desempleo's tracks), the claim toasts, the foreign-account notice (FBAR and Form 8938: “at the game’s exchange rate”;
“The game doesn’t file either form for you …”), the banking-abroad refusals. **Kept:** the ledger memos, notice titles
and calendar labels of each benefit and pension, read by the code and the tests. **Meaning-sensitive:** SNAP's
citizen-only rule is said as the game's, not as SNAP's federal rule. **Tests updated:** `tests/assistance.test.ts`,
`tests/homepensions.test.ts`, `tests/imss.test.ts`, `tests/home-account-tax.test.ts`, `tests/home-account-abroad.test.ts`,
`tests/home-account-setoff.test.ts`, `tests/home-account-transfers.test.ts`, `tests/evidence3-home.test.ts`,
`tests/remaining-09-hardship.test.ts`.

## Batch 6: The Papers Guide

**Sources:** `src/engine/content/guide/papers.ts` (22): the overview, health cover, doctor, conditions, benefits and
pensions entries, with `next` on each.

**Changed:** each entry's opening says what the thing is before how to use it; quoted toasts match the screen; “dial”,
“SLATE keeps” and “kept in memory” are gone. **Kept:** `MONTHS`, `FROM_CURRENT`, the practice and chain labels, and the
prerequisite, history and evaluation lines that already read plainly. **`next: []`:** `papers.pensions`, because no
life reaches a pension's age in the game's span, so Claim never shows; the entry says so. **Meaning-sensitive:**
applying for HUSKY D isn't being covered by it; Drop The Plan opens no special enrollment period. **Tests:**
`tests/guide.test.ts`, `tests/guide-examples-papers.test.ts`.

## Batch 7: Passports, Generated Research, And The House Checks

**Sources:** `src/engine/content/passportsabroad.ts` (2), `passports.ts` (15), `licenses.ts` (19), `licensepaths.ts`
(69), `safetynet.ts` (6), `workrules.ts` (1).

**Changed:** the offices' assumptions abroad, said as the game's (“…, so the game uses its three weeks at home.”); the
passport pane's fine print now prints them under “Assumed in the game:” and, in place of the research's raw notes,
“Some details weren’t published, or couldn’t be confirmed on the office’s own pages.” (defects.md, 9). Britain named
by its name on two refusals and a list (defects.md, 7). The checks' late findings: no sentence opens on “Nothing”
(22 did), three tacked-on clauses, five look summaries opening on “It’s”, and one plural the plural check reads.

**Reviewed and kept, with the reason in each status:** `passports.ts` and `licenses.ts` are generated
(`tools/build-passports.mjs`, `tools/build-licenses.mjs`) and say not to edit by hand; only names and authorities reach
a player. `licensepaths.ts` is read by nothing (defects.md, 5). `safetynet.ts`'s strings are plan names and research
citations; `workrules.ts`'s are form names.

**Meaning-sensitive:** New Zealand's GST and urgent fee stay labeled assumptions, and the research's uncertainty is
still said. `tests/remaining-papers.test.ts` asserts both.

## Checks, At The End

Run from the clone on the final code, each exit read from a file. Late in the pass the whole suite found five
assertions this pass's searches had missed, each a short regex or a fragment of the return's decision (“File it by”,
“You owe $…, on $… of income.”, “completed degree”, “lowest monthly payment”, “record of professional work”, and
“forty credits to qualify” in `tests/socialsecurity.test.ts`); each now reads the new words as narrowly as before.

| Check | Exit |
|---|---|
| `npx tsc -b --noEmit` | 0 |
| `npx eslint` on the 89 changed files, `--max-warnings=0` | 0 |
| `node tools/title-case.mjs --check` | 0 |
| `node tools/label-sweep.mjs` | 0 |
| `node tools/plural-check.mjs` | 0 |
| `node tools/voice-check.mjs --check` | 0 |
| `node tools/tics.mjs --check` | 0 |
| `node tools/spelling.mjs` | 0 |
| `node tools/typos.mjs` | 0 |
| `node tools/text-inventory.mjs --check` | 0 |
| `node tools/doc-refs.mjs --check` | 0 |
| `node tools/deciders.mjs --check` | 0 |
| `npx vitest run` on the 36 files that failed or hold late changes | 1: 8 tests in 6 files still read the old words; each fixed after, and the whole suite below reran them |
| `npx vitest run`, the whole suite (`vt-full.txt` in the scratchpad) | 1: 4,582 of 4,587 tests passed in 372 of 376 files; the five failures were tests asserting the old words (`evidence2-b11`, `finance-paths`, `naturalize`, `student-experience` twice) |
| `npx vitest run` on those four files and the four others changed after it started | 0: 111 of 111 in 8 files |
| `npm run build` | 0 |
| `node tools/text-walk.mjs`, six saves, at 1440 and at 390 | 0 and 0: 25 screens each, none failed |
| `node tools/text-render-check.mjs after-1440 after-390` | 1: five faults, none on Papers (“Sleep owed 1 hours” on Player Profile, “-$3” four ways on Money), each in the walk before this pass too |
| `node tools/acceptance-ui.mjs`, at 1440 and at 390 | 1 then 0 at 1440: the first run's four papers failures were matchers reading the old words; then 77 of 77 passed at 1440 and at 390, no overflow |

On the six saves' Papers screens, at 1440, “SLATE” fell from 20 mentions to none, and the words from 9,533 to 10,215:
the sentences are whole now, where they were clipped.

The batches' own runs were the same commands on each batch's files; the earlier runs' logs are in the scratchpad
(`papers14/vt-b12.txt`, `vt-r3.txt`, `vt-r4.txt`), and each failure they showed was a test asserting the old words,
fixed in the batch that followed.
