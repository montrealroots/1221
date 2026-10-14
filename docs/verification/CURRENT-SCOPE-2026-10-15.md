# Completing The Current Scope, 2026-10-15

The owner's brief of 2026-10-15 ("SLATE: Complete The Remaining Current-Scope Work And Prove Acceptance"), done on
`claude/current-scope-acceptance` from `main` at `bef4bde5`. The pass before it is `OPEN-ITEMS-2026-10-14.md`, whose
standard this one holds to: a row is verified only where a gate test reaches the action as a player does (a command, the
clock, or the screen rendered), checks the consequence, expects a figure worked independently, and can't pass vacuously,
checked last by an independent read-only skeptic.

The traceable checklist each row was worked from, written before any code changed, and each row's result (tests, fixes,
guards, mutations, the skeptics' problems and what closed each) are in `docs/verification/scope/`: `<key>-checklist.json`
and `<key>-result.json` for people, taxpapers, health, money and school, and `yale-result.json` for the health work that
followed (Yale Health's rule, program renewal, public cover, and its recheck).

## The Rows: Before And After

| | At `bef4bde5` | Now |
|---|---:|---:|
| Verified | 271 | **285** |
| Partial | 11 | **2** |
| Unresolved | 19 | **14** |
| Deferred | 16 | 16 |
| Legacy, informational | 3, 8 | 3, 8 |

Every row of the five audit files (328). The 30 open rows were each investigated (the checklist), and 14 moved; no row
was split, renamed, downgraded, moved to Deferred or Informational, or deleted to change a count. The 16 deferred items
stayed deferred; no removed personal-life or industry system was restored and no parental leave added.

### Each Open Row's Disposition

| Row | Before | Now | Disposition |
|---|---|---|---|
| school.respond | partial | verified | The claim that saves before 2026-10-12 held answers until 10 PM was false (`answerHours` has been 22 since 2026-10-07): the four real saves under `tests/fixtures` opened through `openSlot` → `migrate` → `loadSave` hold none. “That evening has passed.” is a guard, tested as one. A defect found: a leave, withdrawal or dismissal before 2026-10-13 stranded a moment open for good; `strandedMoments` settles one on opening. |
| school.request_repeat | partial | verified | Asked, decided and played to the degree (a last year repeated, Commencement 2030, once across reloads); a first-year repeat failed again ends in dismissal. Five defects in what the Fail and Permanent Incomplete notices offered, and a year split by a leave losing its fall's Fail, each fixed and played. The decision's own refusals are guards. |
| school.request_extra_term | partial | verified | Granted, attended, the retake failed: the degree withheld at the evaluation, nothing more to ask, across a reload. Refusals past nine semesters and for disqualification are guards. |
| school.request_conversion | partial | verified | No eligible hours: refused, and nothing moves (clock, ledger, calendar, bank, through a reload). A repeated year's hours paid once each year ($138.00 in January 2027 and 2028), the bank read either side. “No Hours To Convert” is a guard. |
| h-money | partial | verified | “No account” and “Your Bank” are a guard no played life reaches (a bank that closes an account re-banks the life; the only current account can't be closed). A Comfortable student played to 2 October with a reload a minute either side of each month's end matches a twin played straight; interest (8¢, 38¢) and work-study pay ($414.00) worked by hand. |
| l-person | partial | verified | Another person's look reads their traits, condition and pronouns, and now their dials and Readiness too; reached on a seeded second person labelled FIXTURE (no command adds a person). |
| i-stale-claims | partial | **partial** | The prose rule was tightened with must-catch and must-accept examples, and every skeptic found the prose and the rule hold. It stays partial on the standard: its tests read the repository's text, recorded as fixtures as at `bef4bde5`, and only a command, the clock or a rendered screen verifies. Recording them as commands was considered and not done. The owner's decision, below. |
| health.choose_clinic | partial | verified | New Haven gained Yale Health Center's Student Health beside Fair Haven Community Health Care (researched; members only; the next weekday against New Haven's 24 days). Yale Health's own rule, read 2026-10-15, was kept: a member's care is had at its Health Center; a member who picks Fair Haven is billed SLATE's uninsured price ($183.98 in 2026). |
| health.enroll | partial | **partial** | A marketplace plan's insured bill played on the clock (the $45 copay, the plan's $60.13 of $105.13, paid once, reloads). Renewal moves between HUSKY D and Covered Connecticut; HUSKY D asks the 2027 work of applicants; Covered Connecticut follows the premium tax credit from 2027 and ends beside Yale Health. Open: HUSKY D kept at renewal through work, which no played life reaches (SLATE pays wages only for a student's work-study and the Summer Cabaret, and a student on Yale Health can't enroll). |
| health.appointment | partial | verified | Connecticut's rule was read (CGS 20-616(b)–(d)): no expiry for a non-controlled prescription, so a renewal rightly changes no New Haven fill, played a year and twenty days on. The insured bill played on the clock; a visit had where it was booked. |
| documents.apply_ssn | partial | verified | Application, the office's hour (now asserted), the card's 21 days, issuance, persistence, and the readers that change an outcome in play, two of them now played on London-born lives with nothing set by hand (the W-7's weeks on a $329.56 refund; the IRS plan online or by mail). Discover reads it behind a wage test no played life passes; the row says so. No income invented, no eligibility loosened. |
| tax.pay_state, tax.revise_plan, tax.catch_up_plan, tax.apply_state_plan, tax.lien_release | unresolved | verified | Reachable since creation offers the family: a Scraping student owes Connecticut. Each played through Papers and the clock. |
| tax.amend, tax.catch_up_state_plan, tax.lien_dispute, tax.federal_lien_withdraw, tax.request_waiver | unresolved | unresolved | Genuinely unreachable for a New Haven student, each said why: a filed year never changes; Connecticut's plan has no catch-up; its lien always secures tax owed; the largest IRS balance any family reaches is $1,746.41 against the $10,000 threshold; only Oregon charges the three-year penalty. |
| bank.arrange_overdraft, bank.cancel_new, bank.switch, bank.switch_complete, bank.cancel_switch, bank.stop_balance_transfer, bank.take_overrun_loan, card.money_transfer, bank.savings_notice | unresolved | unresolved | Each action needs a bank outside the US; a life is made at Yale in New Haven at one of five US banks, and nothing moves a life. What a New Haven student meets is played (refusals in the bank's words, nothing posted); the rest on quickSave lives abroad, labelled FIXTURE. Defects found and fixed abroad all the same (below). |

## Defects Found And Fixed

Each fixed with a test that failed before it and passes after (the fix broken, run, restored), by the agent that made it
and checked by a skeptic after:

- **School**: stranded classmate moments in older saves; the Fail notice offering a repeat that an additional term, a
  dismissal, a withheld degree, a year already repeated or the nine semesters refuse (moved after the evaluation, counted
  as the year's end counts); the Permanent Incomplete notice the same; a year split by a two-term leave losing its fall's
  Fail (`repeatCourses` by program term); opening a save writing an empty moments list (a reload wasn't the save it read).
- **Money and Home**: a limit-0 overdraft answered as closed; Cancel It's current account closing with its debt, with no
  control on the panel, with no interest or fees settled; the overrun loan leaving the closing count running; the savings
  notice naming the wrong account. Abroad, by each country's rule (sources in `money-result.json`): interest kept or
  returned by country; Canada's and Mexico's refunds; Korea's deposits given a cooling-off its law doesn't; German Close
  It leaving an account negative; business days; Canadian cards; Mexico's unused condition; same-named terms; the last
  day ending at the opening hour.
- **Papers and tax**: Connecticut's collection counted from the right date; a duplicate IRS letter on reload with a plan;
  Connecticut refusing a plan to anyone it ever levied; interest rounded per month (the bill $649.71, not $649.72); a
  1040-NR's Connecticut part due in April, not June, said on Papers beside the IRS's date.
- **Health**: Yale Health's rule; a renewal ending cover with a false sentence where it should move programs; HUSKY D's
  2027 work test unasked of applicants, and read at an instant rather than over last month; Covered Connecticut offered
  past the premium tax credit's limits and kept beside Yale Health; a reload changing where a visit was had (now a
  one-time step, `SaveUniverse.opened`); the 60 days to enroll counted from the next month's check.
- **People**: another person's dials, Readiness, summary and body units said “you”.
- **Prose**: the stale-claim rule's gaps (passives, possessives, futures, clauses), each now a must-catch example.

## Checked

- **Skeptics**: an independent read-only skeptic per group after the fixes, and again after each later fix (two to four
  rounds per group: `final-checks/zzzz…-scope-*.json` in the session's scratchpad, merged as each row's latest check).
  Every problem they named was fixed, tested, or recorded as open below.
- **Mutations**, in copies of the tree, never the working tree: 115 listed; 5 not applied in the copies (lines the money
  work rewrote after the copies were made, run in the tree by that work instead); of the rest, 109 killed and one guard
  found redundant and removed (an additional term's clause in `tellFails`, which `ended` settles). Three first ran
  against the wrong test file and were killed against the right one; three survivors led to two new assertions (the
  office's hour; a present passive in a later clause) and the removed guard.

## Acceptance On The Final Revision

- **The gate**, every part run alone on this tree with its exit read from a file: the suite in three foreground shards
  (one run is stopped by the machine's memory), **330 files, 4,040 tests, all passed**, each shard exit 0; typecheck,
  lint and all seventeen checks exit 0 (`docs/DEVMAP.md` and `docs/TRACEABILITY.md` regenerated first, behind the new
  tests).
- **The built app** (`npm run build`, exit 0; `SLATE_BASE=http://localhost:4181 node tools/acceptance-ui.mjs OUT WIDTH
  saves`): **60 passed, 0 failed, 2 skipped** at 1440 and the same at 390, 0 errors and 0 overflows. The two skips are steps whose state a new life at that point doesn’t hold (a way at a problem; a part with calls), each played on its own scenario save in the steps after.
- **Long runs**: `tools/lives.ts --seeds 2 --years 1` (seeds `lives-0`, `lives-1`): breaches 0, unbalanced 0, 11 to 12 reloads a life. Scenarios replayed on this code (`--scenario nonfiler --years 0.47`, `--scenario roundups --years 0.1`): breaches 0, unbalanced 0, each exit 0.

## Still Open, And Whose

- **health.enroll** (partial): HUSKY D kept at renewal through work, reached only with wages set by hand.
- **i-stale-claims** (partial): the owner's decision below.
- **The 14 unresolved rows**: unreachable in the current scope, each with its reason in its row. Whether the nine bank
  rows stay Unresolved or move to Deferred (as health.prepay did) is the owner's: deferring hides nothing that works,
  since the engine and its tests abroad stay; Unresolved keeps them counted against completion.
- **Found and not fixed**: Covered Connecticut for a noncitizen at 100–138% of the poverty line barred from HUSKY D by
  status (Access Health CT's practice unfound); the work test's exemptions, its 30 days' notice and Connecticut's
  six-month look-back at renewal (read as last month); whether a nonresident F-1 could take the advance credit in 2026;
  `repriceCare`'s plan part against its comment; `repeatRoom`'s leave branch (unreached, decides nothing reachable);
  a bank's own close of an idle German account at zero; interest taken before 2026-10-15 from a term isn't found on
  canceling it.
- Merging to `main` and any Base44 deployment: neither done, neither authorized by this brief.

## The Owner's Decisions

1. **i-stale-claims**: whether a row whose claim is the repository's own text can be verified by a gate test that reads
   that text. Yes: the standard gains a kind for it, and this row is verified. No: it stays partial, with nothing left to do.
2. **The nine bank rows**: Unresolved or Deferred, as above.
3. Carried from before: an IRS letter before the due date when a return is filed early; whether to keep Connecticut's
   “filed in error” control and the controls no play reaches, as guards.

## Readiness

For the current school-focused build, in the tested scope (a new life at Yale made on the creation screen with any
family, played from creation through its terms to its degree, its money, papers, taxes and health, help and the tutorial,
at 1440 and 390, across saves, reloads and long runs): **no known failing cases or crashes in the tested scope.** 285 of
328 rows are verified to the standard; the 2 partial and 14 unresolved say what each lacks. It is not “bug-free” and not
every playthrough was tested: what passed is listed above, and what wasn't is listed as open.

## Repository

Branch `claude/current-scope-acceptance`, from `bef4bde5`, committed and pushed. **Not merged to `main` and not deployed.** The
owner said to merge it on 2026-10-15; the fast-forward push to `main` was refused to Claude by the session’s permission
check, so it waits on the owner (`git push origin claude/current-scope-acceptance:main`). No pull request was opened: the
GitHub CLI wasn’t signed in on this machine. The pipeline that generates the audit, kept until then only in a session’s
scratchpad, is in `docs/verification/pipeline/`, and regenerates the committed audit with no difference.
