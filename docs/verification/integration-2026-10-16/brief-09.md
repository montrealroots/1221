# Brief 09: The Remaining Integration Gaps And The Completion Evidence, 2026-10-16

The owner's "Finish SLATE’s Remaining Integration Gaps And Reconcile The Completion Evidence"
(`../briefs-2026-10-16/09-remaining-integration-gaps-and-completion-evidence.txt`, kept verbatim), worked on
`claude/peaceful-hamilton-59zdbb` from `main` at `64b69fc7` (#35's merge). Five areas worked it, each from instructions
written before any of its work (`prompts-09/`), each writing its checklist before its code and its result after
(`../remaining-09/`): the judge and the genres in their own clones, banking, coverage and journeys in the shared tree.
The judge area's 24 commits were cherry-picked onto the others' (`c9cba9c8`), and the journeys area's follow-up came
after them (`bcd75970`). **The tested commit is
`7c1198a2`**: the gate passed on it, and the build, the saves, the built app and the long runs were played on its code
(`bcd75970`'s, which differs from it in no file under `src`, `tools`, `index.html` or `vite.config.ts`). Nothing is
merged or deployed.

## Every Requirement, And Its Status

The completion matrix (`COMPLETION-MATRIX.md`, `tools/completion-matrix.mjs --check`, in the gate) is the record; this is
its summary by the brief's sections.

| Section | What it asked | Status |
|---|---|---|
| 1 | Completion reported in the owner's seven statuses, every shortfall a row, the matrix's check in the gate | Implemented And Verified |
| 2 | ST3, ST6, H4 and L3 reproduced and worked | Implemented And Verified as work; each criterion **Decision Required** as written, with its proposal not counted |
| 3 | The genres whose two briefs favor the same sides, audited and revised where repetitive | Implemented And Verified |
| 4 | Germany's closing fee to the day; every banking decision row | Implemented And Verified, but Arion's card fee on a close and the nine bank rows' scope: **Decision Required** |
| 5 | The nine commands' audit rows; the hardship's renewal; the 13 unresolved rows | Implemented And Verified, but the 12 rows still unreachable: **Decision Required** |
| 6 | School, money and papers as connected journeys | Implemented And Verified (21 of 21 items) |
| 7 | Final verification on the tested commit | Implemented And Verified (below) |
| 8 | A truthful close-out, the handoff and the pull request's description | this account, the handoff's first section, the pull request |

**Completion, by the matrix:** 485 of 544 rows in scope Implemented And Verified (89.1%); 45 Implemented, Verification Incomplete, 0 Partially Implemented, 1 Not Implemented, 0 Blocked Externally, 13 Decision Required, 17 Explicitly Deferred.

## 1. Completion Reporting

Until brief 09 the matrix read "467 rows, none open" while the handoff listed unfinished work: it counted a row given to
the owner, a proposed criterion and a stale measurement as settled. From `1310bc94` each row carries one of the seven
statuses, with what that status needs (a decision's question, evidence and recommendation; a deferral's authority; a
gap; what's missing), and only Implemented And Verified counts toward completion. Its check fails a status outside the
seven, a row without what its status needs, a row called verified on a test it can't find or on no test the gate runs,
a measurement made before the code it reads last changed, and a handoff whose completion line isn't the matrix's. It
runs in the gate, and CLAUDE.md counts eighteen checks. Each check was broken in a copy and caught.

The stale statements corrected: the integration README's matrix row ("held then: 467 rows, read as none open"); the close-out's
and the README's 54 genres (55: drama's stage scenes had been taken off twice); the handoff's open work. On the way the
matrix learned to read a test title written by a template (`280f1a55`), and three areas' results that cited a rerun note
or a scratchpad log as a test were made to cite files that are there.

## 2. ST3, ST6, H4 And L3

Reproduced first on `d7127819` (`baseline-09/`), traced case by case, then worked. The judge's changes: four public-domain
scenes played out to a house (`content/scenes-house.ts`); **evaluation-10**, a scene and a play judged in their units, cut
at each change of tone and each turn (Stanislavski's bits, Carnicke's glossary: a new bit where an action shifts), with
discipline read by the units a long score asks; Scapin's sack scene, six units, from Wall's translation; a class that
trains the body as hard as a workout (the 2024 Adult Compendium, 3.5 METs or more) counting as one. Measured together
with the genre area's changes on `c9cba9c8` (`integrated-09/`).

| Criterion | Baseline (`d7127819`) | Integrated (`c9cba9c8`) | Proposed, not counted |
|---|---|---|---|
| ST3, the even actor the same on stage and close | 165 of 179 | 178 of 189; 11 a tenth apart, no rounding defect, the largest gap 0.0184 | ST3′ 189 of 189 (`st3.md`) |
| ST6, the restrained specialist against the grain | 8 of 38 | 9 of 42 (expansive 22 of 50) | ST6′ 26 of 42 (`st6.md`) |
| H4, specialists ahead on their own work | 2 of 12 | **1 of 12** | H4′ 11 of 12 (`h4.md`) |
| L3, the specialist's last month against its first | 65.5 → 64.1 | 65.5 → 64.3 | L3′ 62.29 → 65.71 (`l3.md`) |
| L3, the beginner | 54.0 → 56.6, met | 54.0 → 56.8, met | L3′ 54.51 → 57.56 |

None is met as written; none was weakened. **H4 fell by one** with evaluation-10: discipline's long score reached 21 more
class scenes and 16 plays, so listening's and vocal's shares fell under 60%, while discipline came to lead on 14 of its 15
own pieces where it had led on 2. ST3's second clause asks two results that differ by the drain the stage weighs to show
the same tenth, which no rounding can; no correction for ST6 had a source; L3 as written fails a student who earns
harder callbacks. Each is a decision for the owner with its proposal. **Stamina's load stays clamped at 1** (Not
Implemented): nothing found sizes a heavier load's drain, and four one-act plays are loaded as whole evenings because
the catalog keeps no running time.

Every criterion that held still holds on the integrated tree: ST1, ST2, ST4, ST5, ST7, ST8, ST9, F1 and F2 of the stage;
I1 to I5; A1 to A3, T2, T3, G3 to G5, M1 (4,560 brief cases, 65 scenes, 30 nights, 30 castings, 13 coursework pieces, all
at 100), M3, O1, O2, H2, H5 and H7; L1 and L2; S1 to S4 on all four samples; G2; the genre audit's isolation (149 of 149, 0).
F2 as written still fails (67.6%), measured for advice by F2-A.

## 3. The Genres

The genres whose two briefs suit the same sides were **55**, not 54. Read in six parts as the engine reads them
(`tools/genre-pairs.ts`, the rule committed before any brief changed), 14 were the same in three parts or more: each had
its second situation retired and replaced by a new scene written for SLATE under a new id, its genre's register and
techniques unchanged. After, none of the 55 is the same in three parts or more, and the same-sides list fell to 46. The
41 kept are kept with their reasons: the register decides an axis in 22, the scenes agree on every axis in 19.
`genres-09.md` §4 has every genre before and after. Older saves keep a retired brief's record and its takes count for
its genre. Measured fresh: S1 to S4 hold on all four samples, S3 revised falling on the held-out samples (82.9% to
81.4%, 82.0% to 81.7%) wholly in the new scenes, nothing tuned to win it back; G1 as written still fails (0.892×), which
more variety within a genre works against by design.

## 4. Banking

**Germany's month's fee on a close, to the day.** BGB § 675h(3) owes regularly charged fees only pro rata to the end of
the contract and refunds those paid ahead; read in the statute's text and each German bank's price list. The closing
month's fee is charged for the days the account was open in it, through the closing day, of the month's days, rounded
half up to the cent in euros first; a quarter's months kept are charged whole. One breakdown (`closingFeesDue`) is read
by the settling, the refusal figure and the words, and the amount and why are said under Close It and Cancel It before
the press. Played: on Wednesday 14 October 2026, closing a Deutsche Bank AktivKonto charges €3.12, October's €6.90 for
14 of 31 days, once, against Bank Fees; a second press and a reload charge nothing more. The month's edges, a leap
February (15 of 29 days in 2028 against 15 of 28 in 2027), insufficient funds, a repeated attempt and a reload were each
played, and one jump against day by day came to the same postings. The three test titles that asserted the whole month
were renamed, recorded in `renames.json`.

**The other banking rows**, implemented where the sources settle them: Berliner Sparkasse's Sparkassen-Card, €12.00 a
year paid ahead, its days left refunded on a close (§ 675h(3)); ING's fee posted on the 1st of the month after and
Commerzbank's at each month's end, where every German bank's went to the quarter's closing; Arion's 950 kr charged in
krónur (949 kr came off before); a home bank's own close settling its fees once (`homeCloses`, a GUARD, no life reaching
it); Close It saying the day the wages move after Have Wages Paid Here; eleven lines of bank text written with the
house's apostrophe. Twenty-six mutations were killed. **Left to the owner:** whether Arion's year is paid ahead or
behind, which its price list and terms don't say (Iceland's Act 114/2021 couldn't be read: althingi.is answered 403);
and the scope of the nine bank rows below.

## 5. Coverage

- **The nine commands traced outside the audit** (the brief's three, the workbook's three, the two ways of playing, and
  `life.look_after` as a command) are audit rows, each read to the page's standard; where no gate test reached a claim
  one was written, played through the command.
- **The hardship's renewal branch** is played: a stay in hospital answers a renewal notice through Papers, across a
  reload and in one jump against day by day (`tests/remaining-09-hardship.test.ts`); the row moved partial to verified.
- **The 13 unresolved rows**, read again: the federal lien's withdrawal is reachable now, played and verified (an
  Inherited family's student who files nothing owes past the IRS's $10,000 at the LT11). The other 12 stay out of reach,
  probed on 110 lives across all 55 banks abroad SLATE knows: whether they move to Explicitly Deferred is the owner's
  decision, deferral recommended for the 11 only removed systems reach.
- **The audit:** 330 rows, 288 verified, before; 339 rows, 299 verified, 1 partial, 12 unresolved, 16 deferred, 3
  legacy, 8 informational after (299 of 312 that can be, 96%).
- **The pipeline itself**, fixed: it read `remaining-09/`, followed renames, credited a test to the rows it plays
  (`byTest`), carried a deferred row's `settled`, and stopped guessing renamed titles. `resolve-titles.cjs` had written
  any title at 0.6 word overlap; on this tree it guessed five renamed titles, some pairing different tests, and all five
  were taken out before reading; read through each test's own dated note, two were right and are recorded now. It
  writes nothing a reader hasn't recorded. (`7c1198a2`'s message says three were taken out: it was all five.)

## 6. School, Money And Papers As Connected Journeys

Played across the areas' boundaries on lives creation offers, each through save and load and one jump against day by
day: a Yale payment drawing on savings, the hold, registration; a leave, Affiliate cover, a bill; a withdrawal, health,
tax and Papers; a document running out under a payment. Found and fixed, each failing its test before the fix:

- A finished School's page said "Only the terms to come stand between you and the degree"; it says how the School ended.
- The cover-ended notice gave 60 days a month after the loss; the window runs from the loss (45 CFR 155.420(c)).
- A visit booked outside Yale Health in a lapse, and a prescription filled in one, weren't read against the cover after.
- A license past Run Out said nothing after it; dropping a program then asking a hardship was toasted as granted.
- **The term's aid** was paid to the bank while the Yale account owed; Yale applies credits to charges first, and so
  does SLATE now, lifting a hold the aid clears before registration is asked.
- **HUSKY D** started the month after enrolling; it starts on the 1st of the application's month (UPM § 1560.10(B)) and
  reaches back to months of uninsured care, three before 2027 and one from then (42 USC 1396a(a)(34)(A) as Pub. L.
  119-21 § 71112 amends it).
- Mexico's residence was sold though nothing in scope read it; its rule is said, and each step refused with why.
- An F-1 student's term notice stated the wrong amount; a notice's trailing space.

A test helper that loops until a later time hung for good once a life ended by mortality; an ended life's clock asked
forward a million times in a row now throws, naming the death (`tests/setup/ended-life.ts`), every call passing through.

## 7. Final Verification

| Check | Command | Result |
|---|---|---|
| The gate | `npm run gate`, its exit read from a file | **exit 0 on `7c1198a2`**: 368 files, 4,401 tests, none skipped; typecheck, lint and all eighteen checks |
| The build | `npm run build` | exit 0 |
| Scenario saves | `node tools/scenario-saves.mjs <dir>` | 14 of 14 exit 0, each breaches 0, unbalanced 0 |
| The built app, 1440 | `node tools/acceptance-ui.mjs <out> 1440 <saves>` on the build | 72 passed, 0 failed, 0 skipped, 0 errors, 0 overflows |
| The built app, 390 | the same at 390 | 72 passed, 0 failed, 0 skipped, 0 errors, 0 overflows |
| Lives to graduation | `npx vite-node tools/lives.ts -- --years 3.2` | 24 lives: 20 graduated, the 4 dismissed the autopilot control's (Reykjavík), as on every run since 2026-10-10; breaches, unbalanced and errors 0 |
| Workload | `npx vite-node tools/workload.ts` on eight lives, 1.4 years | the seven attentive in good standing; London lives-0 neglected dismissed, as the control is; breaches 0 |
| Mastery through play (MA5) | `npx vite-node tools/mastery.ts -- --mode plan`, six plans, 8 years | 6 of 6 at 100 on every payoff tape, each mastered three or four days sooner than the last pass's |
| The advice (F2-A) | `npx vite-node tools/advice.ts -- --from 0 --to 40` | 40 of 40 |
| Variety, three years | `npx vite-node tools/variety.ts -- --seed v-0 --years 3` | graduated, breaches 0; 10 distinct top recommendations over 157 weeks, none at full, the longest unresolved 2 weeks; each practice hour's feedback different; the same situation 4 in a row at most (3 on the last pass's run, a figure no criterion limits) |
| Freshness | `npx vite-node tools/freshness.ts -- --months 4 --seeds fr-0,fr-1` | no take or scene repeated for the beginner, developing and specialist profiles; the mastered profile retapes 0.549 and 0.525, each an earned callback |
| The criteria, together | `integrated-09/measure.sh` on `c9cba9c8` | every criterion that held holds; ST3, ST6, H4 and L3 not met as written (section 2) |

`runs-09/` keeps every output, with the commands, and `integrated-09/` the criteria's.

**Persistence, migration, repeats and interruptions**, each held by tests the gate runs on `7c1198a2`:

- **Persistence.** Every new journey of the pass ran through a save and a load, and in one jump against day by day or
  smaller steps, with the same postings, notices and records: Germany's close (a reload on the 8th), the card's second
  year, ING across 1 November, the hardship's renewal, the aid against the balance, HUSKY D's start. The built app's
  steps include saving and exiting, Continue, and weeks on (`tools/acceptance-ui.mjs`, the lien scenario among them).
- **Migration.** A save from before evaluation-10 has its work on a piece's segments moved to the units once, on first
  opening (`cutIntoUnits`, `tests/remaining-judge.test.ts`); a save holding a retired brief keeps its record across a
  reload, nothing offering it (`tests/remaining-genres.test.ts`); the schema stays 94 in the engine and the guard, which
  `tests/base44-contract.test.ts` and `tests/server-guards.test.ts` hold together.
- **Repeats.** A second press refused with nothing posted: Close It and Cancel It after a German close, the card's
  refund, a second settling of a close's fees, a second drop of a program, a hardship asked for an ended program.
- **Interruptions.** The clock stopped by an event that needs the player resumes where it stopped and what it was asked
  for (`tests/simulation.test.ts`); a home bank's close interrupted by an overdraft settles its fees once however many
  daily tries follow (`homeCloses`, a GUARD); a life ended by mortality mid-loop fails its test naming the death rather
  than hanging (`tests/setup/ended-life.ts`).

## 8. For The Owner

None of these is counted met, and none was changed without the owner's word:

1. **ST3′, ST6′, H4′, L3′**, each beside its criterion kept as the record (section 2).
2. **F2-A** as the measure of the advice, F2 as written kept (67.6%).
3. **Arion's debit-card year**, ahead or behind: what a close owes waits on it.
4. **The 12 rows out of a player's reach** (the eight bank commands, three tax commands of a life in another state, and
   `tax.amend`): keep them Unresolved or move them to Explicitly Deferred.
5. **Stamina's load**: whether a night's load reads its running time, each play's length read from its text.

Open, not the owner's: the rows the matrix calls Implemented, Verification Incomplete (its "What's Left"), each with
what it lacks; `tests/personality.test.ts`'s year on autopilot, whose 1955 life ends on 16 January 2026 so the clock is
stopped for most of it; a credit that clears a held Yale account leaving the hold (no played life reaches it).
