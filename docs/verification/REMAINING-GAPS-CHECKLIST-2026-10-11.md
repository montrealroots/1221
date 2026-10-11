# The Remaining In-Scope Gaps: Acceptance Checklist

**Brief:** "Finish SLATE's Remaining In-Scope Gaps And Verify Completion", 2026-10-11. Written before the engine was
changed, from `main` at `086d00ca`, and kept as the work's bar: each item is marked done only with the evidence it
names. The 16 deferred items stay deferred. No removed system comes back, and parental leave isn't added.

**Where a player can be taxed.** In play every new life is a student living in New Haven (`atSchool`): a player's
residence never changes. Other residences are reached only by the engine's own saves, for tools and tests. The
federal return, each state's side and the city taxes they collect are what SLATE files and collects.

The scope below takes "supported locations" as every US city in SLATE's tables, where a return can be computed. Of
the 246 countries with a city, 231 have no income-tax rule. No command in play puts a player's residence or work there:
a birthplace sets citizenship and papers, not residence. That's recorded and tested (A3), not hidden.

Each item lists:
- **behavior:** what the player can do;
- **refusals:** the preconditions, and what is refused and why;
- **costs and time;**
- **state:** what changes, and what reads it downstream;
- **UI:** the visible controls and the feedback;
- **saves:** compatibility with older and current saves;
- **failure:** what goes wrong, and how the player recovers;
- **evidence:** what marks it complete.

---

## A. Tax Where A Return Can Be Computed

**A1. Indiana, with Marion County; the District of Columbia; Oklahoma.**
- **behavior:** income there is taxed by the researched rules for each year, as federal tax is.
- **refusals:** none of its own. The return is filed by `tax.file`.
- **costs and time:** the tax itself; late penalties and interest from the due date.
- **state:**
  - each authority's side of the return (`TaxReturn.stateDue`);
  - Marion County's tax is collected by Indiana's DOR on the state return;
  - DC is a district, kept apart as its own authority.
- **UI:** Papers names each authority, the tax lines, what's owed and to whom.
- **saves:** none were taxed there before. An older save that held income there isn't taxed back for past years: no
  debt is made retroactively.
- **failure:** unpaid tax is collected by notices, and a lien where its rules file one.
- **evidence:**
  - calculation tests against amounts computed by hand from the published rates;
  - a played journey: file, owe, pay, refund;
  - the rules cited with effective dates in `content/tax.ts` and `content/statetax.ts`.

**A2. Local taxes found missing.**
- **New York City:** the tax was attached to Manhattan's id only, not Brooklyn, Queens or the Bronx.
- **Philadelphia:** the Wage Tax was missing.
- **Columbus:** the city income tax was missing.
- **Portland:** the Metro SHS and Multnomah PFA taxes were missing.
- **Denver:** the Occupational Privilege Tax was missing.

Each is either implemented by its research, or recorded as not applying to the circumstances SLATE supports (for
example, a threshold no student's income reaches) with the threshold kept. A city-collected tax is its own authority;
one a state collects stays on the state's side.
- **evidence:** calculation tests, and a played journey for a city-collected tax.

**A3. Coverage that catches an omission.**
- A test asserts that every US city in SLATE's tables resolves to researched rules or to an explicit no-tax rule, at
  state and city level, and that each researched authority has collection rules.
- The countries with no rule are listed by the test as unreachable for residence or work in play. It fails if a
  command or config starts reaching them.

## B. Collection Gaps

**B1. Liens,** for each researched authority, by its researched rules.
- **behavior:** the full lifecycle:
  - notice of intent, where the authority sends one;
  - filing and recording, with any recording fee;
  - the lien shown as a public record on Papers;
  - paid off, then released within the published days;
  - a lien filed in error (a balance already paid or not owed) corrected on request, by the authority's process.
- **refusals:**
  - no lien while a plan stands, where the rules withhold one;
  - a dispute is refused when the lien isn't in error.
- **state:** a lien record on the obligation.
- **UI:** each lien's authority, trigger, amount, dates and status, and the dispute action.
- **saves:** older saves gain no lien retroactively for a past step. One is filed at the next step that files it.
- **failure:** none is filed twice; it's released once; nothing continues after the obligation is paid.
- **evidence:** a lifecycle test per kind of rule; the UI from a save; step versus skip.
- Liens add no credit-score effect, and no property system is restored for them.

**B2. Pennsylvania's extended payment plan.**
- **behavior:** applied for where the standard plan refuses; decided; scheduled.
- **costs:** its down payment or fee, where researched.
- **failure:** a missed payment and its cure; completion.
- **evidence:** a journey; the UI; refusal tests.

**B3. Louisiana's down payment.** The researched rule, as written. A discretionary "up to" isn't charged as automatic;
a required one is.

**B4. New Mexico's longer plans,** 13 to 72 months, with the security or lien they require.

**B5. Oregon's 100% penalty for three years running unfiled,** under its exact conditions, applied when they're met
and not otherwise.

**B6. Massachusetts's discretionary escalation.** By its researched text: if the statute leaves it to DOR's discretion
with no published criterion, it isn't charged automatically, and SLATE says so.

## C. Playable And Consistent

**C1. The interface shows:**
- which authority is acting;
- what triggered it;
- the amount and its components;
- the date or deadline;
- the actions available and what each does;
- why an unavailable one is refused;
- what changed after one succeeds.

**C2. Agreement and no duplication.**
- Home, Money, Papers, the budget, notifications and history agree.
- Nothing happens twice: no duplicate charges, no repeated refunds, no stale balances, no orphaned scheduled events.
- No collection continues after an obligation is resolved.
- **evidence:** tests that reload and replay, and count each charge, refund and pending event.

## D. Successful UI Journeys (tools/acceptance-ui.mjs, 1440 and 390)

Each counts only when it succeeds and its result shows on screen. A greyed control, an absent one, or "no decision
waiting" doesn't count as a success.

1. **Rehearsal preparation:** Learn The Part, the lines' share rising.
2. **A director's note:** Work On The Note, the note marked Worked On.
3. **A creative choice:** a way of playing chosen, then Advance to its next rehearsal call, and the choice rehearsed in
   past 0%.
4. **Tax:** a payment and a payment plan's application.
5. **A missed plan payment recovered:** Catch Up, and the plan back in force.
6. **A lien:** filed and shown; paid and released, or disputed where reachable.
7. **Save & Exit, Continue,** and the game carrying on from the same state.

Saves written by `tools/scenarios.ts` are labelled as such. Both desktop and phone show the explanations,
confirmations, navigation and resulting state.

## E. Engines Preserved

- Full relevant abilities, mastered techniques, complete preparation, a sufficient day and a fitting choice still make
  exactly 100/100 (`tests/mastery-contract.test.ts`, `tests/evaluation.test.ts`).
- Histories, relationships, coursework, credits, training recommendations and director notes stay consistent: the 18
  lives and the variety audit.
- No artificial novelty is claimed.

## F. Saves And Time

- Older saves (`tests/fixtures/`) and current saves open once, stay stable on reload, and keep their balances,
  owners, payment histories, credits and scheduled events.
- Uncertain history is said, not invented.
- Step versus skip is compared across deadlines, a year's change, effective-date changes, default, repayment and
  recovery.

## G. Evidence

- The gate on the final commit.
- Calculation, property, integration, command-journey, UI, migration and duplicate-processing tests.
- Long scenarios with recorded seeds and revisions.
- Each bug: reproduced, its cause, the fix, a regression test.
