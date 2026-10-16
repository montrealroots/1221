# Banking (key `banking`)

Read `common.md` beside this file first.

## As Given On 2026-10-15

Items:
1. A bank closing an idle German account at zero (`closedByBank` and the dormancy/idle path, src/engine/systems/accountlife.ts / banking.ts / bankmoves.ts): it can go negative from fees on closing. Find the German rule and the banks' terms SLATE cites (what a bank may charge on its own termination: BGB §675h, the Kontoführungsentgelt settlement), and make the bank's own close settle consistently: closure can't erase debt or strand money; a balance below the fees ends as the rule says (no negative manufactured; or debt kept and pursued the way SLATE's other overdrawn closures do — decide by the rule, cite it); closed accounts stop all recurring processing (fees, interest, standing orders, round-ups, statements, alerts).
2. Interest withdrawn from a term deposit before 2026-10-15 (Take Interest) isn't found when the term is canceled in its cooling-off period: since 2026-10-15 Take Interest adds a zero posting against the term (`interestPaidSince`), but older saves' transactions don't have it. Inspect the actual records (transactions, memos, postings, scheduled items) an older save holds; derive the correction from reliable historical records where possible (e.g. the term's own Take Interest transactions: memo, date, amount, the account it paid into — but the memo is shared by same-named terms, which was the defect: find a field that does tell them apart, such as the term's id in another posting, the scheduled item's payload, or the term's opening date bounding the search); never fabricate transactions or double-count income. If an older save lacks enough information, specify and test a deterministic compatibility policy that preserves financial consistency (e.g. a one-time migration named in `SaveUniverse.opened`, as `followTheCover` is, in src/engine/index.ts ONCE_ON_OPENING) and say in the guide what it does.
Verify for both: principal, interest, fees, withholding, refunds and outstanding debt reconcile (the ledger sums); repeated commands and reloads can't repeat a settlement; existing saves keep their legitimate balances and history (test through loadSave on an older save written as an older build wrote it, labelled TEST SETUP). Use labelled foreign-bank fixtures (no played life reaches a German bank). Don't restore travel or relocation. Tests in tests/remaining-banking.test.ts.

## Added By The Owner's Brief Of This Pass (Its Section 7, "Finish Money And Banking")

Audit the banking and finance features SLATE has now (the five US banks a life opens at in New Haven, the home-country
account kept from before Yale where its bank's terms allow, cards, savings, transfers, the international payment,
statements, round-ups, overdrafts, loans, school payments), each against this list, in the checklist, as items of their
own (`banking.s7.<topic>`):

- account opening, eligibility, required documents, and verification;
- existing account ownership and retention;
- switching banks without silently replacing existing accounts;
- account closure, remaining balances, pending activity, and obligations;
- available, pending, and posted funds;
- transfers, settlement times, fees, currencies, exchange rates, and rounding;
- rejections, failed transfers, reversals, and duplicate submissions;
- statements, transaction history, and explanations;
- existing interest, overdraft, card, loan, or other account features;
- school payments and other retained financial obligations;
- holds or restrictions and legitimate recovery paths.

For each: what exists (file:line, the audit rows that cover it, the tests), and whether it holds for a New Haven
student's life as played. A real hole in a retained journey is fixed (a control that does nothing, a refusal that says
something false or leaves no next step, funds spendable before their settlement, a duplicate that posts twice, a
closure that strands money or erases a debt, a statement that disagrees with the ledger). Don't invent financial
products to widen scope. Exact money (integer minor units, as `src/engine/core/money.ts` and `core/ledger.ts` keep them), every movement a
balanced ledger posting: funds never duplicate, never vanish without a recorded cause. A bank-specific requirement is
researched from the bank's own published terms or its regulator, with the jurisdiction, the date read, the effective
date where given, and the uncertainty; never call a guessed fee, rule or rate verified or live. The ledger checks
(`tools/lives.ts`'s breaches and unbalanced counts, `tests/home-account-ledger.test.ts` and the invariants in `core/invariants.ts`) must stay at 0.

Tests in `tests/remaining-banking.test.ts` (more than one file if it grows past what one file should hold:
`tests/remaining-banking-<topic>.test.ts`).
