# The Integration And Verification Pass

**Brief:** "Complete SLATE's Next Integration And Verification Pass".

**Started from** `main` at `ff837dfa`, the commit the brief reviewed. Nothing newer had landed. The work is on branch
`claude/integration-pass`. The engine's final source is tree `9ee4b8d9`, the same at `5b4e507b`, `f3915368` and
every later commit, which change only tools and documents.

**Every result below was measured on that final source** unless it says otherwise:

- the gate;
- the 18 lives;
- the five scenarios;
- the balance grid;
- the variety audit.

The words are kept apart:

| Word | Meaning |
|---|---|
| implemented | in the code |
| tested | a test asserts it |
| played through | a long run reached it through commands |
| simplified | it stops short of the real world, and says where |
| deferred | not done, by decision |

---

## 1. What Changed, And What Reads It

Each row traces one change along nine steps:

1. the player's action;
2. its preconditions;
3. what it costs in time and resources;
4. the state it changes;
5. the downstream consumer that reads it;
6. the visible feedback;
7. how it persists;
8. how it fails;
9. how the player recovers.

### Federal And State Tax Kept Apart

**Implemented, tested, played through.**

| Step | Trace |
|---|---|
| Action | `tax.file`; `tax.pay` (the IRS); `tax.pay_state {state, year, amount?}`; `tax.apply_plan` (the IRS); `tax.apply_state_plan {state, months}`; `tax.catch_up_state_plan {state}` |
| Preconditions | A return with a balance. A state's plan needs every return filed, the balance under the state's cap, the months in its range, and (Connecticut) not under levy. An unresearched state refuses a plan and says why. |
| Costs | The money paid, from the bank; California's $34 plan fee, added to the balance; California's $362 levy fee. |
| State | `TaxReturn.figures.owedTo` and `TaxReturn.stateDue[state]`: balance, owed, parts, accrued, payments, collection, refund. Also `Person.statePlans`, `YearEarnings.withheldBy`, and `TaxReturn.split` (the migration). |
| Consumers | Collection notices and levies (`tax.state_notice`); plans (`tax.state_plan_payment`, `tax.state_plan_end`); refunds and their offsets (`tax.refund` with a `state`); the IRS plan's cover (`owedAll`, federal only); the budget's tax reserve (`owedEverywhere`); Home's tax line (`latePenaltyAll`, `owedEverywhere`). |
| Feedback | Papers, Tax Returns: Who It's Owed To; Owed To each agency, with its parts, payments, notices and order; each state's plan panel; the return's Still Owed rows by authority. Each state's notices, levy, refund and plan messages. |
| Persistence | Optional fields; schema 94 unchanged. A save from before is divided once on opening (`splitReturns`). |
| Failure | Bank short: owed, then collected by the state's own notices and levy. A plan payment missed: New York's is cured by the next due date; California's brings Intent to Terminate and 30 days; Connecticut's ends (SLATE's reading). A new balance under a California plan is a default. |
| Recovery | Pay in part or in full; catch up a plan; a later refund offsets the same authority's balance; a federal refund goes to the return's state after its notice (IRC 6402(e)). |

### A First Class's Continuity

**Implemented, tested, played through.**

| Step | Trace |
|---|---|
| Action | `school.request_leave`, or a repeated year, then `school.return_notice` and `school.reregister`. |
| Preconditions | As before. Productions are played only for terms that are over (last class day and last night both past), only between the first and sixth terms, and only while the student is at the School. |
| Costs | None to the player. |
| State | The first class's `productions`, its `classmates[].craft`, `abilities`, `shown` and `last`, its `playedTo` and `graduatedAt`; the joined class's `joinedHistory`; the presence and reliability drawn under the class's own key. |
| Consumers | The first class's craft and parts, and the balance of opportunity in its next casting; its classmates' runs, judged; the graduation notice; Your Classes. |
| Feedback | Your Classes: where the first class is, or that it has its degrees; What The Class Of … Played Without You (play, date, cast size, lead and how it went); what the class joined had played. |
| Persistence | Optional fields. Ceilings are bound for first classes on load; that was missing, and a reloaded save's first class outgrew them. |
| Failure | None the player meets. A term isn't played early; a second call for the same term records nothing. |
| Recovery | n/a |

The new class's own production history is **tested by fixture only**: no played run rejoined in a second year.

### Feedback And Notes That Read History

**Implemented, tested, played through.**

| Step | Trace |
|---|---|
| Action | `practice.exercise`, and a production's work-through calls. |
| Preconditions | As before. |
| Costs | As before. |
| State | The exercise's `streak`, `gains` and `lastTier`; `Experience.lastExercise`; each note's `taken`. |
| Consumers | The hour's feedback; the next note's choice of skill; the note's words. |
| Feedback | The hour's text: its gain, the level against the next tier, a move up a tier, a long run and its slowing, what a variation hour carries to. Notes that move on, or say "Still:", or acknowledge one taken. |
| Persistence | Optional fields. |
| Failure | n/a |
| Recovery | n/a |

### Informational Records

These serve history and explanation, and give no stat bonus:

- `FormerProduction.cast[].quality`;
- `TaxReturn.split.how`;
- `StateDue.migrated`.

Every interactive choice above performs what it says: a part paid lowers that authority's balance in its order, a
plan stops that authority's notices, and a catch-up restores the plan.

---

## 2. Research And Assumptions

The state rules come from `docs/research/world/research-state-tax-collection.json`, 42 entries drawn mostly from
statute, from DRS, DTF and FTB pages, and from irs.gov.

**Verified rules:**

- **Connecticut:** a 10% late-payment penalty, once, with no monthly accrual (12-735(a)); interest at 1% a month or
  part, simple, on the tax (12-735(b)); a payment applied to the penalty, then the interest, then the tax (12-39h);
  a plan up to $50,000 over 2 to 12 months; the 30-day notice of intent before a levy.
- **New York:**
  - Late payment: 0.5% a month or part, to 25%.
  - Late filing: 5% a month or part, to 25%, less the late-payment penalty in the same months. Past 60 days, at
    least the lesser of $100 and the tax.
  - Interest: 9.5% a year (October to December 2026), compounded daily.
  - Plan: online up to $20,000 over 36 months, no fee. A missed payment is cured by the next due date.
- **California:**
  - Late payment: 5% once, plus 0.5% a month for up to 40 months, to 25%.
  - Late filing: 5% a month or part, to 25%, at least the lesser of $135 and the tax. The larger of the two
    penalties applies, not both.
  - Interest: 7%, compounded daily, on the tax, interest and penalties.
  - Plan: up to $25,000 over 60 months, a $34 fee added to the balance, decided in about 2 days online. A missed
    payment or a new liability brings a 30-day termination notice.
  - Collection: three notices, then a levy with a $362 fee.
- **New York City's** resident tax is collected with New York State's (Tax Law 1312(a)).
- **The IRS:** an installment agreement is for federal tax (IRC 6159); a refund offsets federal tax first
  (6402(a)); a federal refund can go to a state's past-due income tax (6402(e)).

**SLATE's assumptions**, each said where it applies:

- the order of a part payment for New York and California (not found; SLATE applies it to the tax first);
- the days between New York's and Connecticut's notices;
- Connecticut's plan decision time, its rule on a missed payment (SLATE ends the plan), and whether a new balance
  joins (SLATE: it does);
- New York's decision time, and whether a new balance joins;
- "past due" for a federal offset read as "noticed";
- state refunds in 21 days;
- interest on New York's penalties, charged only after notice and demand, left out (SLATE charges the tax only).

**States SLATE hasn't researched** keep their balance and add nothing to it. They refuse a plan with
`STATE_UNRESEARCHED` rather than copy the IRS's rules. In play only Connecticut is reached by a student, and New York
and California through unemployment or California's mandate.

---

## 3. Save Migration

`splitReturns` runs once, when a save is opened.

1. A return figured before the split (no `figures.owedTo`) gets its split worked out from its own lines.
2. Its withholding is divided by the calculation that withheld it. The cabaret's old paychecks withheld no
   Connecticut tax, so a derived year's withholding is all the IRS's.
3. What was still owed is divided between the authorities owed, in proportion to each one's part of the return. The
   sum is kept to the cent. The return says it was SLATE's division, because payments before were never kept by
   authority.
4. A refund not yet paid is divided the same way among the authorities due it back.
5. An IRS plan's cover is reduced to the federal part, and its history says so.
6. The IRS keeps its collection where it was. Each state's starts at its first notice.

The ledger isn't touched, and a second opening changes nothing. Both are tested in `tests/state-tax.test.ts`.

**Limitation, exposed on the return:** a state balance that was netted against a federal refund before the split
stays netted.

---

## 4. Tests, Runs And Results

### The Gate

On `5b4e507b`, `src` `9ee4b8d9`:

```
VITEST_MAX_FORKS=2 VITEST_MIN_FORKS=1 npm run gate
```

154 files and 1,660 tests passed, along with all sixteen checks.

**New and changed tests:**

- `tests/state-tax.test.ts`, 11 tests;
- `tests/variety.test.ts`, 3 tests;
- in `tests/school-paths.test.ts`: the first class's productions, the joined class, steps against a jump, and
  graduation once;
- `tests/tax-lifecycle.test.ts`, `retirement`, `safetynet`: restated for the split and for interest from the due
  date.

### Mutations

18 mutations of this pass's rules (`mutate-pass.cjs`):

- Tax: 11.
- School and variety: 7.
- Four survived at first:
  - Three were test weaknesses. Each test was fixed, and each mutant is now killed.
  - One was an equivalent mutant, a redundant guard. The guard was removed.

### The 18 Lives

On `f3915368` (`node tools/verify.mjs lives`):

- 15 graduated.
- The 3 autopilot lives were dismissed, as kept.
- 0 breaches and 0 unbalanced ledgers.

One run was cut off by the batch's own 595-second limit (exit 143), not by the memory reaper. It ran in full on the
next call.

### The Five Scenarios

Seed `sc-0`, all with `--watch` (`docs/verification/SCENARIOS-2026-10-11.json`). All had 0 breaches and 0 unbalanced
ledgers.

| Scenario | Result |
|---|---|
| Leave | Back with the class of 2030; degree conferred. The class of 2029 was followed to its sixth term, its productions played. |
| Mandatory leave | Yale Health's assessment, a refused notice from hospital, then the way back and the degree. |
| UK switch | Partial, then full. |
| IRS plan with Connecticut left alone | Connecticut billed, gave notice of intent, and levied. |
| Connecticut's own plan | Paid off in 14 payments while the IRS plan ended. |

### The Balance Grid

The grid: `docs/verification/BALANCE-GRID.md`. The engine model, §4: `docs/ENGINE-MODEL.md`.

- 48 jobs: 13 scenarios × 2 seed sets, plus 20 range-end sweeps.
- Each cell n = 3, with its standard deviation and range.
- Identical on both sources the pass used.

### Variety

`docs/verification/VARIETY-2026-10-10.json`, written on the final source; the engine model, §6–7.

---

## 5. Bugs Found And Fixed

Each has a regression test:

1. **First classes outgrew their ceilings after a reload.** A reloaded save bound no ceilings for a first class.
   Found by comparing small steps with one jump.
2. **New classes copied the first class's draws.** A later class's presence and reliability were drawn by place, so
   they repeated the first class's.
3. **Interest and penalty started early.** On a return filed early and unpaid, both ran from filing, not the due
   date. This was federal and state.
4. **The Summer Cabaret withheld no Connecticut tax.** The tax table has none for Connecticut.
5. **A refund could be paid twice.** Nothing stopped a refund item firing twice.
6. **The migration treated the IRS's substitute return as an old combined return.**
7. **Feedback and notes ignored history.** See §6 of the engine model.
8. **The return's Still Owed row** was the IRS's alone and didn't say so.
9. **Your Classes gave the wrong date.** It said the first class went on from the day the student rejoined.
10. **The tests had weaknesses**, found by mutation.

---

## 6. Limitations

**Simplified:**

- A state doesn't assess a non-filer's tax on its own. SLATE models only the IRS's substitute return. A state
  balance is assessed when the student files.
- First classes are followed only while the student is at the School.
- The Rep's and the Cabaret's parts aren't played for a first class.
- The new class's production history before a join is tested by fixture, never by a played second-year rejoin.
- Cross-state offsets between Connecticut, New York and California aren't modeled.

**Deferred, unchanged:** the 16 items. No removed system was restored, and parental leave wasn't added.

---

## 7. Whether Later Changes Invalidate Earlier Results

- The balance grid was run on `src` `c73d2b43` and again on `9ee4b8d9`. Every cell is identical.
- The previous pass's 18 lives (`6470a2f4`) and scenarios are superseded by this pass's, run on the final source.
- The previous pass's practice-strategy comparison (`STRATEGIES-2026-10-10.json`) measured a single plan on rested
  students. Its conclusions hold in the wider grid.
- Its tired sample (about 5 hours) is replaced.
