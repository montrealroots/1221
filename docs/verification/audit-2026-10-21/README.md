# Brief 20: The Functional And Downstream-Effects Audit, 2026-10-21 To 2026-10-22

The owner's brief 20 (`../briefs-2026-10-16/20-complete-functional-and-downstream-effects-audit.txt`, kept verbatim) asked
that every gameplay feature, from creation through the School to the professional career, be shown to read meaningful
state, produce logical consequences and connect to the rest of the game; that what doesn't be repaired and tested, not
only listed; and that the work stay reviewable, merged and deployed only at the owner's word. Its items were written
before any fix (`criteria.md`). This is the receipt (R1).

**An automated audit isn't a person's play.** What follows says what was read, measured and repaired, and what the
evidence holds. It doesn't say there are no defects left, and it doesn't call the game complete beyond the counts below.

## The Tested Commit

`cbec90d8` on `claude/peaceful-hamilton-59zdbb`, from `340ce7ae` (`main`, #49). The full gate in a clean clone, its exit
read from its file (`final-runs/runs/gate.txt`): exit 0; 479 of 479 test files and 5,481 of 5,481 tests passed, none
skipped; all 22 checks. Every later commit changes documents and the final runs' scripts only, nothing under `src`. The
gate was run again on the receipt's own commit and passed (The Gate, below).

The baseline, `340ce7ae`: 423 of 423 test files, 5,092 of 5,092 tests, all 21 checks (`baseline/gate.txt`). Brief 20
added 56 test files and 389 tests, and the gate's twenty-second check.

## The Feature-To-Effect Matrix (S, M)

`EFFECTS.md`, written by `tools/effects.mjs` from `effects/<area>.json`. The features are found in the code, not in a
document: every command, scheduled kind, passage reactor and event the engine registers; creation's fields; the dials,
abilities, personality axes and traits; the looks; the guide's `ui.*` controls; the tutorial's chapters; every notice
sent outside a handler; and every connection the guide promises between two entries. Each row was read against the
code by the area that owns it (none is left seeded), with the brief's nine fields and the consumer of each change at its
file and line. `tools/effects.mjs --check` is now in the gate: a feature the code has with no row fails it, and so do a
row whose feature is gone, a status outside the owner's seven, a mechanic with no consumer, a verified row with no test
the gate runs, and an `EFFECTS.md` behind its rows.

| | In scope | Implemented And Verified | Implemented, Verification Incomplete | Explicitly Deferred |
|---|---|---|---|---|
| Features | 518 | **491 (94.8%)** | 27 | 20 |
| The guide's promises | 403 | **389 (96.5%)** | 14 | 2 |

407 of the 538 rows are mechanics and 131 presentation (each saying its purpose). No row is Partially Implemented, Not
Implemented, Blocked Externally or Decision Required. The denominator is every row but Explicitly Deferred, and nothing
was moved out of it: the 20 deferred are the owner's scope reset of 2026-10-09 (benefits 14, papers 6), each saying so.

**What's left Verification Incomplete, and why.** Each row says it in `EFFECTS.md`; together:
- **Reached by no current life (25 rows):** every life is a student at Yale banking in America, so the banking features of
  other countries (an overdraft arranged, a switch and its five steps, a cooling-off cancellation, a money transfer, an
  overrun loan, a term's notice, FCA's persistent-debt notice, Iceland's refund) aren't met, nor an amended return, a
  lien in error, a tax waiver, Oregon's penalty, a UK year, a 2026 visit booked, British Columbia's prescriptions, the
  desempleo month, or `livesWhereBorn` (creation). Each is held by tests on fixture lives, said as FIXTURE.
- **Reached only by a test's hand (2):** the "Didn't Go Through" notice (`core/simulation`) and a stranger's attempt on a
  card number drawn by hand (`security`).
- **Promises held in halves, or only on screens no test draws (14):** for example the commission and union dues in the
  year's return (each link played, the whole not in one life), Move Money appearing with a second account, a School night
  at readiness under 60, a pension (no life reaches the age).

## The Areas

Ten audits, each in its own clone, each merged with its report. Each area read its rows, made controlled comparisons
(twins from one seed, one input changed, both directions), looked for the brief's twelve kinds of disconnection, repaired
what it found with a test that failed first, and ran mutations.

| Area | Report | Rows, promises | Defects repaired | Mutations (killed of run) |
|---|---|---|---|---|
| Creation | `areas/creation/REPORT.md` | 93, — | 1 (the Generous line), and four tests made to hold what a surviving mutation showed they didn't | 51 of 51 |
| The School | `areas/school/REPORT.md` | 102, 43 | 2 (D4's load order; a last year's repeat offered then refused) | 25 of 26, below |
| Craft | `areas/craft/REPORT.md` | —, 144 | none found | 23 of 23 |
| Money | `areas/money/REPORT.md` | 96, 63 | 4 (a false Short For A Payment; a loan's day drifting; Iceland's refund abroad; the round-ups promise) | 22 of 22 |
| Benefits and tax | `areas/benefits/REPORT.md` | 57, 20 | 5 (a week worked paid in full; a lien "in error" on the tax alone; "1 months"; a penalty said to fall; the guide's Catch Up) | 21 of 21 |
| Papers and health | `areas/papers/REPORT.md` | 58, 43 | 4 (an OPT approved said in force; therapy on a holiday; Connecticut's medical debt on the record; a care log kept for nothing) | 22 of 22 |
| Life, time and the body | `areas/life/REPORT.md` | 36, 44 | 13, D3 among them | 37 of 37 |
| The career | `areas/career/REPORT.md` | 49, 40 | 8 (a part posted again; Equity by contract never billed; an agreement offered again; Sam beside Samuel; dues paid from the bank lost to the return; the work day's nerves and enjoyment; four values never read; `jordan.ts`) | 22 of 22 |
| The guide and controls | `areas/guide/REPORT.md` | 47, 8 | 5 (two guide sentences; "you're not in" and "Elsewhere" for a trip's own commitment; Save & Exit after a failed save) | 27 of 27 |
| The journeys | `journeys/REPORT.md` | — | F8 (its own runner's check) and the findings below | — |

**The coordinator's.** D2, the credit limit (`credit/README.md`, 10 mutations, all killed). J4, a new life made with the
three records an opening makes, so a save opened is the life never saved, to the byte (1, killed). F10, the School's
request to meet lapsing in silence (2, killed). And the integration's own: the guide's wiring list re-pointed to where
the merges moved each registration, a straight apostrophe, a visa approved but not started said of its country, the
comment in a test that named, in the present, a feature taken out on 2026-10-10, and two renamed tests carried through the audit.

**Mutations, all told: 264, 263 killed by an assertion, none a setup error, none not applied.** B20-SCHOOL-13 survives:
it removes Orientation's registration mark, which the School keeps twice on purpose for saves made before the second
mark, and B20-SCHOOL-21, which breaks the reader of both, is killed. Each area's `mutations/<area>.json` and `.txt` say
what each one broke, which test failed and how.

## D2: The Credit Limit's Growth

Every played life's limit rose a fifth each six months with no ceiling (brief 19's life A, $194,736 by October 2029).
**Now** a raise, reviewed or asked for, goes only as far as the holder can carry under Regulation Z §1026.51(a). That's
one of two tests:
- the minimum payment on the whole line, with the other cards' and the loans', is a quarter of the past year's monthly
  income or less;
- or the line and what's owed elsewhere is no more than the money held in checking and savings.

An ask waits six months. Measured on six years of each starting means, before and after (`credit/before.jsonl`,
`after.jsonl`): the wealthy life's six years end at $162,280 against $484,566, its raises stopping at the last fifth its
$491,316 in the bank covered and none after its savings went to the state; the inherited life's at $405,703 against
$1,211,424. In the final journeys b20-6 ends at $162,280 against $194,736. Where the scholarship's savings carry the line
(b20-1, $19,474), the raises come as before; whether savings should count in full is the owner's (below).

## D3: Consecutive Work Days And Fatigue

Measured on a shoot week of five 7 AM calls two hours away (`areas/life/REPORT.md`). The body's figures were right: a
short night was counted twice. Brief 19's scripted player met day 5 at readiness 20.1 with a sleep debt of 67.4. **Now:**
- a sleep after the night adds none of the night's debt, condition or mood (F1's nap with it);
- Home, the Day look and the Sleep dialog say by the evening before when to be asleep for a full night;
- a work day takes a School rehearsal call's energy once it's judged.

The 11 PM player wears down a day at a time and is judged tired from day 4; the player asleep at the hour the game names
stays level all week. In the final journeys, fatigue as the first limit on the work fell from 1 to 5 in each life that
met it to 0 in all eight.

## Journeys (J1 To J6)

- **Eight fixed-seed lives** (`b20-1` to `b20-8`, chosen in `criteria.md` before any ran), made through creation's own
  choices and played through the School into the career by the player's commands and the clock; and **the seven older
  saves** in `tests/fixtures/`, opened as the game opens them and played on. First run on `12c04ee1` (`journeys/`), with
  every finding kept (F1 to F12, below); played again on `cbec90d8` (`final-runs/b20-journeys/`): every life and save to
  its end, every check and every coherence check passed, saved and opened at the transitions 165 of 165 the same to the
  byte, and 53 of 53 straight-against-reopened forks the same.
- **The routes met:** unsigned and represented (the older `journey-j01-last-term` and `old-leave` signed, in both runs;
  in the first run the agent passed on six of the eight lives and two had no answer, and in the second none signed); success, failure, decline, delay, interruption, recovery, a clash,
  little money (two older saves), poor and strong preparation, genre strengths, fatigue, work authorization refused.
- **Brief 13's 25 journeys** played again on `cbec90d8`: all to the end, all ten checks passed, each ending as brief 19's
  final run ended. **Brief 19's four lives** played again: what moved is each brief 20's, said in
  `final-runs/runs/README.md`.
- **The built app (J6), at 1440 and 390:**
  - creation to the School's first showing, a setback and a specialist (brief 13's playthroughs, 14, 9 and 11 steps,
    every one passed at each width);
  - brief 14's banking, document and health journeys (10, 8 and 10 of the same);
  - the acceptance walk (77 passed, none skipped, at each width);
  - the career's 52 surfaces from one life played from the last term through the showcase, an agent's meeting and
    agreement, an audition, booked work and its pay (brief 19's walk, every surface: no error, no sideways scroll, every
    control named and reached by Tab, every grayed control saying why);
  - the seven older saves opened, every destination pressed, the clock moved, saved and continued
    (`app/older-walk.mjs`, the same clock after as before, nothing found).

**The journeys' findings.** F1, F2, F10 and F12 were repaired (D3, the career's repost, the lapse, the title); F5 is
D2; F8 was the runner's. F4 (no new life is short of money: the scholarship accrues and there's no rent), F6 (dormant
savings escheated, as built), F7 (the players file no returns) and F11 (a shoot and a curtain the same day taken when
their hours don't overlap, the curtain judged Unready) are observations, said. F3 (OPT's days between gigs) and F9
(hunger that brings no illness) are the owner's (below).

## The Comparisons (B1 To B3)

Each area's report gives its twins and figures. Among them:
- **Skill (B2, `tests/b20-career-skill.test.ts`):** at the top every audition and shoot day was judged 100, Exceptional;
  at the bottom 0 to 4.4, Unready. The top was cast on 6 of 8 seeds and the bottom on none. The roles posted over two
  years, and the agent's list and answer, were the same for both.
- **Preparation:** a self-tape 100 prepared, 35 cold.
- **Genre:** 100 knowing the project's genres, 90.4 not, and 100 where only an unrelated genre was unknown.
- **Representation:** $25.00 commission and the pay through the trust account, against none, the same work.
- **Sleep:** 8, 6 and 3 hours gave readiness 89.1, 78.9 and 50.2.
- **Attributes, money, papers and eligibility:** in the areas' reports (creation's 51 twins, money's 22, papers' and
  benefits').

The delayed consequences B3 names are each reached through the clock in a test the gate runs: a missed deadline,
recovery, a payment, interest, a fee, attendance, learning, an assessment, career eligibility, an audition, the quality
of work, a referral, commission, a credit and a later opportunity.

## The Completion Matrix

**634 of 658 rows in scope Implemented And Verified (96.3%)**: 20 Implemented, Verification Incomplete, 4 Decision
Required, 40 Explicitly Deferred (`../integration-2026-10-16/COMPLETION-MATRIX.md`).
- **Its course this brief:** D2's change to `src/engine` left 46 rows measured on code since changed, and the line read
  588 of 658. Brief 19's final runs were made again on `cbec90d8` (`final-runs/runs/README.md`): every figure the same as
  brief 19's but the gate's, the advice's four rows held, brief 13's 36 clauses held, and the line is 634 of 658 again.
- **The 20 left** are earlier briefs': twelve commands no current life reaches and eight banking decisions for the owner.

## The Gate

The full gate in a clean clone, its exit read from its file:
- **At the integrated commit, `cbec90d8`:** exit 0; 479 of 479 test files, 5,481 of 5,481 tests, none skipped; all 22
  checks.
- **On this receipt's commit, `fdf6897e`:** run again after the final runs were gathered and these records written, as
  the brief asks after integration: exit 0; 479 of 479 test files, 5,481 of 5,481 tests, none skipped; all 22 checks
  (`final-runs/runs/gate-receipt.txt`). Only this figure was written after it.

The gate also ran three times before that:
- **At the mid-point, `e9b3efeb`:** it failed 3 tests where merges met, and they were mended (`61b90818`).
- **At `ed6a9fdd`, before the life merge:** it failed 2 tests on that comment, mended in the
  merge.
- **At `cbec90d8`:** passed (above).

## For The Owner

Decisions the evidence can't make, none changed here:
- **D2:** savings counted in full against a limit; the opening limit set by the score alone.
- **Readiness 60** as the work's knee, at about 20 hours awake in the measured fixture, later than the 15.84 hours of the
  project's own source (Van Dongen 2003).
- **F9:** hunger wears condition, readiness, the night's recovery and mortality, and brings no illness or care; nothing
  declares that it should. Whether it should is a new mechanic.
- **F3:** whether an actor's days between gigs count against OPT's 90 days (Yale OISS counts 20 hours a week, paid or
  unpaid, and gigs; it doesn't address the days between).
- **A start outside the School** (`livesWhereBorn`, creation's three Starting Point controls).
- **School casting** reads no genre experience (its stated rule); **notes worked past what's needed** can leave a first
  night no better; **a chosen way of playing** can cost points (craft).
- **Amend The Return**, which no played life can use; **the lien's stricter rule**, under which no life reaches Filed In
  Error; **the desempleo month**, paid only from saves before 2026-10-09 (benefits).
- **Notices naming their tab** (only the pay notices do).
- **Money:**
  - autopay that can't be turned off;
  - a card's due day moving with the month;
  - APY run as a nominal rate;
  - the penalty rate at 30 days and charge-off at 150;
  - a weekend standing order paid that day;
  - the banking rows no life reaches.
- **The career:** a shoot day takes no nerves; genre isn't part of judging an in-person audition or a night on stage;
  the two tax-return promises want a life with two employers in one year.
- **Brief 19's V17**, a person's look at desktop and mobile, stays the owner's.

## Not Done, Or Not Measured

- **No person has played it.** The playthroughs are scripted players, and the built app's walks are automated.
- **Not measured:**
  - a long commitment in the small hours inside a night already paid;
  - a jump of more than an hour cut short by an early call;
  - a loved genre's mood on a night;
  - the hungry older saves again after D3.
- **Not reached by a control:** the Sleep dialog sleeps from now, so a bedtime later in the evening is planned by opening
  it then (`startAt` exists, and no screen offers it).
- **Craft's 90 promises** kept on earlier tests have no mutation of their own here.
- **Brief 18** stays paused at the owner's word, but for the credit limit this brief named.

## To Look For Yourself

```powershell
git switch claude/peaceful-hamilton-59zdbb
npm ci
npm run gate *> "$env:TEMP\gate.txt"; "exit=$LASTEXITCODE" | Out-File -Encoding utf8 "$env:TEMP\gate-exit.txt"
npm run build; npx vite preview --port 4187
```

Then, in the game at http://localhost:4187, at desktop width and on a phone-sized window:
1. **A new life:** make one through creation and play the first week at the School. The Calendar names the hour to be
   asleep by before an early call.
2. **An older save:** put one of `tests/fixtures/*.json.gz` in a slot (`docs/verification/audit-2026-10-21/app/older-walk.mjs`
   shows how) and continue it. Visit each screen, move the clock, Save & Exit and Continue.
3. **The career:** open the saves `docs/verification/career-2026-10-20/app/make-saves.ts` writes (the showcase, the
   follow-up, the meeting, the offer, a work day, the pay) and read the Career tabs.
4. **A short week of shoots:** go to bed at the hour named, and again at 11 PM, and compare Readiness and the work's
   judgment day by day.
5. **A card:** watch its limit at the six-monthly review; Ask For A Higher Limit says why it waits.
6. **The matrix:** `docs/verification/audit-2026-10-21/EFFECTS.md` has a row for each feature, with the file and line
   that read its change.
