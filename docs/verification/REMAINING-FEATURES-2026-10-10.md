# Remaining Features: Scope, Evidence And What Is Still Short

The brief was "Complete SLATE's Remaining Features And Deepen Its Attribute And Genre Engines". The work began from
`main` at `2f376a08` and ran on the branch `claude/remaining-and-engines`. It made six commits:

| Commit | What it did |
|---|---|
| `a55de67a` | The engine: material, choices, practice and experience |
| `c400aa5f` | School: leave lengths, the mandatory leave, the cohort, finishing late |
| `7e44117b` | Finance and Papers: switch stages, Discover loans, IRS plans, the care log |
| `6470a2f4` | Balance runs, property tests, mutation testing, `docs/ENGINE-MODEL.md` |
| `c7dd706f` | First classes followed to their degree; the 18 lives and four scenarios |
| `89796845` | Screen fixes at 1440 and 390 |

This page is the scope inventory and the evidence matrix. The mathematics is in `docs/ENGINE-MODEL.md`. The per-path
rows, with commands, tests and acceptance, are in `docs/verification/STUDENT-MATRIX.md` (45 of 45 verified).

---

## 1. Scope Inventory

### School

#### Mandatory medical leave

- **Journey.** Two stays in hospital in 28 days, or 60% of at least 12 class days missed ill.
  1. Yale Health asks to see the student two working days later.
  2. It recommends a leave, or modifications if the student will be back within 14 days.
  3. The dean decides the next working day.
  4. The student may appeal within 7 days. The appeal is decided in 5 working days, and it overturns the leave only
     if the student is cleared and half the term or more is still ahead.
  5. The way back is notice with a physician's clearance, then registration.
- **Not tied to a diagnosis.** The trigger reads function: stays and days missed.
- **Consequences.** Those of a medical leave: aid on the rebate schedule, Affiliate cover the School pays, the I-20
  extended. While the leave stands there are no classes, calls or shifts.
- **Persistence.** `SchoolRecord.welfare`, `welfares`, `leave.mandatory`. All optional.
- **UI.** Your Leave, on Standing And Craft.
- **Acceptance.** Three tests in `tests/school-paths.test.ts`, and the `mandatory` scenario played to the degree.
- **Basis.** Yale Bulletin p.159 sets the process. The thresholds are SLATE's.

#### Leave length

- Worked out from the course sequence (`leaveLengths`). The year-long a/b courses mean only a two-term leave returns
  to a first half the student hasn't taken, so one and three terms are offered and refused with the reason.

#### The returning cohort

- The student joins the class at the same stage.
- The first class is kept with its relationships. It is played forward through the terms it had without the
  student, and from `c7dd706f` on through each later term to its own degree. Before that commit it stopped at the
  join.
- Old coursework keeps its partners' names.

#### Extended study

- **What changed.**
  - Repeated courses and years, an additional term, and late conferral, including 22 December after a fall term.
  - Every course attempt is kept.
  - The aid review is new: a tuition exception where a medical leave caused the delay, and living aid continued for
    students with need.
- **The old blanket rules, reviewed.**

  | Old rule | Now |
  |---|---|
  | One repeat only | No year is approved twice; any year may be |
  | Whole-year repeats | An additional term is offered beside the repeat |
  | Automatic disqualification | A faculty review keeps a student on warning, and one that does stops further stepping |
  | No aid after six terms | Kept for tuition, with the aid office's exception; living aid continues for need |
  | Scholarship repayment by the rebate schedule | Kept, as the Bulletin's |

#### Parental leave

- Not added, as the brief says.

### Banking

#### Switch failure stages

| Stage | What happens |
|---|---|
| Destination declines | The new bank looks the next day, by its own opening rules, and declines with nothing moved |
| Pending card payments | Held back to cover them; the old account closes once they post |
| Balance transfer stopped | Allowed alone past the cancel window, up to close of business the working day before |
| Partial switch | Britain only: 20 working days, the old account kept |
| Old account in debt | Blocked to all but repayment; closes itself once repaid |
| History | Each switch's outcome is kept |

- **Found during the work.** The held path skipped moving savings and orders; `payments.test` caught it.

#### Lending

- **Capital One.** It sells no personal loan under its own name. Discover lends for it.
  - Range: 7.99% to 24.99%. This is Credible's figure and is labeled third-party.
  - Amounts and terms: $2,500 to $40,000, over 36 to 84 months.
  - Discover's own conditions are enforced: an SSN, $25,000 of income, and not for education.
- **HSBC and NatWest.** Their ranges and new-customer limits were corrected from the research.

### Papers

#### IRS payment plans

- **Kinds.** Short-term (180 days, no fee) or monthly, with fees by direct debit and by income.
- **While pending or in force.** Collection pauses. The penalty is 0.25% a month on a return filed on time.
- **A missed payment.** Notice CP523, then 30 days to catch up before the plan ends.
- **A new balance.** It joins the plan if it adds two payments or fewer. Past that, the plan is in default until
  revised, which costs $6.
- **Refunds.** A refund is offset to another year's balance first.
- **Kept separate from a partial payment.** `tax.pay` still pays any part.

#### Medical repricing

- **The 60-event loss is gone.** The log keeps 400 days, plus every event whose bill is open, in debt or under
  appeal.
- **The rest is archived.** Older events are counted by year.
- **Each change is recorded** against the event. A second change of cover bills only the difference: tested twice
  over the same days, it bills once.

### Attributes, Practice And Creative Choices

- See `docs/ENGINE-MODEL.md`.
- **Material.** 68 materials, each with structured features and the reasons for them.
- **Choices.** Three axes of choice. A misfit is said before the choice is made. A choice must be rehearsed in.
  Directors give direction.
- **Practice.** 27 exercises, each designed around a challenge with three tiers, transfer and features. Five focuses,
  each with a cost somewhere.
- **Experience.** Speeds preparation, takes the larger of genre and feature speed rather than the sum, and never
  touches quality.
- **Consumers.** Every new field is read: material and choices by the evaluation; practice by `develop`; experience
  by preparation speed and recommendations.
- **Ratchet.** `tools/wired.mjs --check` passes.

---

## 2. Research

Three files hold the research. Each entry records what the source establishes, how certain it is, and which values
are SLATE's.

| File | Entries | Covers |
|---|---|---|
| `docs/research/world/research-yale-leave-2.json` | 36 | Yale's leave, return, repeat, aid and conferral rules |
| `docs/research/world/research-switch-loans-plans.json` | 24 | CASS and other switching rules; Capital One, Discover, HSBC and NatWest loans; IRS plans |
| `docs/research/attributes/research-practice-material.json` | 30 | Spacing, challenge point, contextual interference, sleep loss, material demands |

**What is SLATE's, not research:**

- The mandatory-leave thresholds.
- The aid office's decisions.
- The least monthly payment on an IRS plan.
- Every focus and tier size.
- The misfit factor.
- The preparation floor.
- The variation and spread sizes.

No exact real-world growth rate is claimed.

---

## 3. Evidence Matrix

| Category | Items |
|---|---|
| **Verified** (a test asserts the outcome and its reader) | All 45 student-matrix rows. The 11 engine invariants over 1,500 drawn cases. 18 mutations: 17 killed, 1 equivalent. |
| **Played** | The 18 lives on `6470a2f4`: 15 graduated, 3 autopilot lives dismissed as kept, 0 breaches, 0 unbalanced. Four scenarios, all 0 breaches and 0 unbalanced: leave, mandatory leave, UK switch, IRS plan (`SCENARIOS-2026-10-10.json`). |
| **Simplified** | A return's balance is one, federal and state together, so an IRS plan covers state tax a state would collect. This predates the plan; splitting it means a balance per authority. The first class's productions aren't played forward. Only Britain's switch service has a partial switch. |
| **Research uncertainty** | Every practice size (direction only): spaced and precision pay only while their factors stay above 1. Capital One's APR range is third-party. The Yale aid office's discretion is unpublished. |
| **Blockers** | None found that stops a path. |
| **Deferred** (unchanged, not restored) | The 16 items: `health.prepay`, `pension.social_security`, `documents.residence`, `documents.renew_residence`, `documents.settle`, `documents.naturalize`, `benefits.ei_register`, `pension.bienestar`, `pension.ie_state`, `pension.imss`, `pension.state`, `benefits.ja_week`, `benefits.uc_period`, the pension payment kinds, `trait-receipts`, `l-trait`. Interests, professional career, housing, vehicles, travel and shopping stay removed. |

---

## 4. Before And After

| Area | Before `2f376a08` | After |
|---|---|---|
| Leave | One length; the first class waited for the student, frozen | Lengths from the course data; the class a year below; the first class goes on to its degree |
| Mandatory leave | None | Function-based assessment, the dean's decision, an appeal, and the way back |
| Finishing late | A repeated year only | An additional term, December conferral, an aid review |
| Switching | Complete or cancelled | Declined, held, balance kept, partial, in debt; with history |
| Capital One loan | Under Capital One's name | Discover's, with its terms enforced |
| IRS | Pay in parts | Plus plans: short and monthly, CP523, revision, offsets |
| Care log | The latest 60 events | 400 days, plus anything open; archived; repricing recorded |
| Practice | One way to practise an hour | Tier and focus, each with a cost; feedback from the numbers |
| Material | Genre families leant the weights | 68 profiles with features; choices; direction; misfit |
| Balance evidence | None for practice | Matched and held-out seeds; sensitivity analysis; two dominance problems removed |

---

## 5. Screens

Checked in the built app at 1440 and 390 wide, from saves the scenarios wrote:

- the switch panel, with its history and the stop-transfer confirmation;
- the IRS plan;
- the Discover loan, with its purpose;
- Your Classes after a leave;
- practice.

There were no page errors, and nothing ran past the right edge after one fix: at 390 the partial switch's checkbox
had crushed the form's fields, and it now has its own line.

Two text fixes were also made:

- the plan's penalty note now says 0.25%;
- "made by Discover Personal Loans" replaces "Discover Personal Loans's".

The visual style, Title Case, the sidebar, the mobile drawer and Home are unchanged.
