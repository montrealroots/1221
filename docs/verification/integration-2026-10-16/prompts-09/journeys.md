# Your Area: School, Money And Papers As Connected Journeys (Key `journeys`)

Read `common.md` beside this file. Your section of the brief is section 6, in full. You work in the shared tree.

1. **The six areas' changes of the last pass, across their boundaries** (`docs/verification/remaining/*-result.json`,
   and `git log 64b69fc7^1..64b69fc7^2` for what changed): where one area's change reaches another's system, play it.
   A Yale payment drawing on savings, then the hold, then registration; a leave and its Affiliate cover, then a bill;
   withdrawal, then health eligibility, then tax and Papers; a document expiring under a payment or a registration.
2. **Played journeys** through the commands and the clock, on lives creation offers, each through save and load and in
   one jump against day by day: school (requirements, preparation, attendance, missed work, revisions, warnings,
   evaluations, progression); money (payments, pending funds, fees, restrictions, closures, recovery); papers (required
   documents, applications, verification, expiry, correction, renewal where the game has them); health eligibility and
   billing where they reach school or money.
3. **Every exposed action** you meet: it validates what it should, changes the right state, brings its consequence,
   says the result, and survives a reload. Remove placeholders, misleading controls, stale forecasts and dead ends you
   find; a legitimate restriction says why and what comes next. Nothing decorative: a mechanic's consequence fits its
   purpose.
4. **Known on the way in:** a graduated student's School page still says "Only the terms to come stand between you and
   the degree" (found in the built app on 2026-10-16). Fix it, with its test.

The banking agent owns `systems/banking.ts`, `bankmoves.ts`, `accountlife.ts`, `lending.ts`, `abroad.ts`, `homeaccount.ts`
and the bank's UI: a defect you find there goes in your result, with its reproduction, not into those files. The coverage
agent owns the audit pipeline. New tests in `tests/remaining-09-journeys.test.ts` (or one file per journey,
`tests/remaining-09-journey-<name>.test.ts`). Your result: `docs/verification/remaining-09/journeys-result.json`, with
`rowText` for any audit row whose words change.
