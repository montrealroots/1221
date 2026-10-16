# Your Area: Banking's Remaining Behavior (Key `banking`)

Read `common.md` beside this file. Your section of the brief is section 4, in full. You work in the shared tree.

1. **Germany's month's fee on a close** (`docs/verification/remaining/banking-result.json`, `banking.1.pro-rata`):
   verify BGB § 675h(3) and each affected German account's terms from authoritative sources (the statute's text, the
   banks' own price lists), and implement the partial-period charge: fees already collected, accrued, refunded where
   the rule says, in exact cents, balanced ledger entries, the amount and its explanation shown before the player
   confirms. Verify month boundaries, leap years, the closing date, insufficient funds, a repeated attempt, and save and
   load, with twins in one jump and day by day. Three test titles the audit cites assert the whole month (`scope-money`'s
   Berlin Cancel It and Close It "for its €4.90 month", `accountlife`'s quarter-fee test): where the rule changes what
   they assert, the test changes with a dated comment saying what it said and why, and its title is renamed with the
   rename recorded in `docs/verification/pipeline/inputs/renames.json` so the audit follows it. That's allowed this time:
   the brief asks for the behavior.
2. **Every remaining banking decision row**, one by one: the banking area's results (`../remaining/banking-result.json`),
   the audit's money rows whose status isn't verified, and anything else marked for the owner. Implement each requirement
   the owner's realism brief already covers; a row stays a decision only for a genuine product choice, inconsistent
   sources or an external dependency, with exactly what's missing.
3. **What the last pass found and left** in banking: `homeCloses` re-settling fees on each daily retry at a bank with
   quarterly fees (`systems/abroad.ts`), unreachable then: check whether it's reachable now and fix it either way, with a
   GUARD test if no play reaches it.

Other agents in this tree: coverage (the audit pipeline and its records), journeys (school, papers, health). You own
`systems/banking.ts`, `bankmoves.ts`, `accountlife.ts`, `lending.ts`, `abroad.ts`, `homeaccount.ts` and the bank's UI.
New tests in `tests/remaining-09-banking.test.ts`. Your result: `docs/verification/remaining-09/banking-result.json`, with
`rowText` for any audit row whose words change.
