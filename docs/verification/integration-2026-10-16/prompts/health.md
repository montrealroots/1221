# Health: Eligibility, And Billing And Renewal Evidence (keys `health-eligibility` and `health-billing`)

Read `common.md` beside this file first. This area was two agents' on 2026-10-15; it's one now, so the two halves of
`src/engine/systems/health.ts` don't collide. Write both checklists (`health-eligibility-checklist.json`,
`health-billing-checklist.json`) before any code, settle eligibility first (billing's renewal-through-work fixture reads
the look-back eligibility settles), and write both results.

The owner's brief of this pass asks of every retained system what its section 9 says (every control read, biting and
connected, both directions; no duplicate processing, stale forecasts or contradictory statuses) and section 10 (a valid
constraint explained, with the next legitimate action). Health is a retained system the school journey depends on
(Yale Health's enrollment and its charge on the term bill).

## Eligibility (`health-eligibility`), As Given On 2026-10-15

Items:
1. Covered Connecticut eligibility for a noncitizen at 100–138% of the poverty line who is barred from HUSKY D by immigration status (CT DSS / Access Health CT practice: is such a person “ineligible for HUSKY due to income”? The ACA: lawfully present immigrants under 100% FPL ineligible for Medicaid due to status get PTC (36B(c)(1)(B)); check how that and §71301/71302 interact in 2026 and 2027, and what Covered Connecticut does).
2. Work-test exemptions (Pub. L. 119-21 §71119: the mandatory and optional exemptions, e.g. under 19 / over 64, pregnant/postpartum, medically frail, parent/caretaker of a dependent child under 14 or disabled, veterans with total disability, tribal members, people in compliance with SNAP/TANF work requirements, inmates and recently released, short-term hardship) and which SLATE can read from its state (age, conditions, children: SLATE has no children; disability; SNAP compliance). Apply those it can, before denial or termination; record those it can't.
3. Required notice and response periods (§71119's notice of noncompliance and 30 days to show compliance before denial/disenrollment; any advance-notice rule at termination, 42 CFR 431.211's 10 days; CT's own). Order: notice, response window, then decision; tested on the clock.
4. The look-back at application and renewal: §71119 lets a state check 1–3 consecutive months before application, and at renewal compliance in one or more months between renewals; find Connecticut's chosen period (DSS's published HUSKY D work requirement materials, CMS guidance of 2026) and apply it at each; record the source and its date, or the uncertainty.
5. Whether a nonresident-alien F-1 student qualifies for advance premium tax credits in 2026 (26 USC 36B: a taxpayer must file jointly if married and the credit is for “an applicable taxpayer”; lawfully present; nonresident aliens and the PTC: 26 CFR 1.36B-2 / IRS Pub. 974 / Form 8962 instructions on nonresident aliens; the marketplace's own rule at 45 CFR 155.305). Settle what the engine should do in 2026 and implement it (the marketplace's credit, Covered Connecticut's dependence on it).
Trace each through Eligibility → Application → Approval or Refusal → Effective Coverage → Renewal or Termination → Notice → Persistence. Tests in tests/remaining-health-eligibility.test.ts.

## Billing And Renewal Evidence (`health-billing`), As Given On 2026-10-15

Items:
1. `repriceCare`'s insurer portion (planPaid, near health.ts:1530) doesn't match its documented intent (its comment): find exactly how, decide what's right (read the comment's intent against the bill's other paths and the plan rules), fix, and prove: repricing produces consistent totals (patient + insurer = price), never double-charges, never duplicates a payment, and a coverage change never silently rewrites a bill already issued or paid (historical bills stand; say what repricing may change and when).
2. health.enroll's remaining evidence gap: HUSKY D kept at renewal through work. Current gameplay can't produce a life on HUSKY D with work wages (SLATE pays wages only for a student's work-study and the Summer Cabaret; a student on Yale Health can't enroll): test the engine's renewal on a fixture labelled FIXTURE (wages posted by hand for the look-back the eligibility agent settles: read their checklist docs/verification/remaining/health-eligibility-checklist.json once it exists, and coordinate by re-reading health.ts), proving the program is kept, its next renewal date, no gap, no premium, and the notice; and the negative twin. Don't invent jobs.
3. Trace verification, with tests, for the insured paths: Eligibility → Application → Approval → Effective Coverage → Appointment → Bill → Patient And Insurer Shares → Payment → Renewal → Notice → Persistence, for Yale Health at its Health Center, Yale Health at Fair Haven (uninsured), a marketplace plan, HUSKY D and Covered Connecticut: each bill's two shares worked by hand, paid once, across save/load and time advancement giving the same result; clinic selection's stated effects on access, waiting, coverage and cost.
Tests in tests/remaining-health-billing.test.ts.
