# Tax And Papers (key `tax`)

Read `common.md` beside this file first.

## As Given On 2026-10-15

Items:
1. IRS correspondence arriving before the payment due date after an early filing (src/engine/systems/taxreturn.ts: `armCollection`, the letters COLLECTION.noticeWeeks after filing). Distinguish a valid filing acknowledgement / balance-due notice (the IRS's CP14 is a balance-due notice sent after assessment, which for a return filed early with a balance comes after processing; interest and the failure-to-pay penalty run only from the due date, IRC 6601, 6651(a)(2)) from a premature overdue or collection notice (a "past due"/levy-track letter before the due date is wrong). Read the IRS's own notice sequence (CP14, CP501, CP503, CP504, LT11/CP90, with their published timing) and IRC 6331 / 6303. Make each notice match the correct obligation, jurisdiction and date; test with an early-filed return owing a balance (a played student with need owes the IRS: tests/evidence3-home.test.ts and tests/scope-taxpapers.test.ts show how), across a reload; and Connecticut's equivalent.
2. Connecticut's “filed in error” control (find it: Papers, a state return, statetax.ts): classify it (reachable? misleading? a guard?); fix or remove per the rules (if it's a control the screen draws that no valid state enables, or whose words promise what SLATE doesn't do, correct it; THE ONE RULE).
3. Every other tax/papers control or refusal no current player journey reaches (the five unresolved tax rows tax.amend, tax.catch_up_state_plan, tax.lien_dispute, tax.federal_lien_withdraw, tax.request_waiver, and other refusals in taxreturn.ts / statetax.ts / taxid.ts / PapersWorkspace.tsx): inspect each individually; classify; for the five rows, confirm their implementation is retained and tested by fixtures (or add fixture tests where missing, labelled), and state for each: current Yale-player acceptance (unreachable, why), retained engine behavior tested through fixtures (which tests), or actual unfinished implementation (then implement it). Don't introduce unrelated gameplay to make them reachable.
Tests in tests/remaining-tax.test.ts.

## Added By The Owner's Brief Of This Pass (Its Section 8, "Finish Papers And Documents")

Items of their own in the checklist (`tax.s8.<topic>`):

1. **What Papers contains** (`tax.s8.inventory`): inventory the Papers screen and the documents system as the build has
   them (`src/ui/papers/`, `src/ui/workspaces/` for Papers, `systems/documents.ts`, `taxid.ts`, `citizenship.ts`,
   `residence.ts`, `content/visas.ts`, `content/passports.ts`, `content/identity.ts`, and whatever else a life's
   papers hold): each document or status, what it unlocks, satisfies, restricts or proves, and who reads it.
2. **Each document's lifecycle** (`tax.s8.<document>`), where it applies: eligibility and prerequisites; application and
   supporting evidence; fees and processing time; issuance and validity; submission and verification; expiry, renewal,
   replacement, rejection and correction; and what a missing, expired or mismatched one does. A document that occupies a
   list and is read by nothing is a declared word with nothing reading it: wire it to what the rule says it decides, or
   say why it's shown only (the brief allows identity and presentation to serve without a gameplay modifier). The
   connections the brief names: a required document affecting the relevant banking or school action.
3. **Jurisdiction**: US federal (USCIS, SSA, IRS, the State Department where a US citizen's passport is held), Connecticut
   (DMV, DRS), and the home country's where a life's papers come from it; real requirements apart from SLATE's
   assumptions, each cited with the date read. **Don't restore travel**: a passport or a visa is read for what it proves
   in New Haven (identity, status, the right to work, an SSN or ITIN), never for a journey.

Tests in `tests/remaining-tax.test.ts`, and `tests/remaining-papers.test.ts` for section 8's items.
