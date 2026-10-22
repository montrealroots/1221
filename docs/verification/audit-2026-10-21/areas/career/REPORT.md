# Brief 20, The Career Area

Written down by the coordinator from the career area's report as it returned it (2026-10-22): the harness wouldn't let the
area write this file itself. The words are the area's but for this note.

The career area of brief 20's audit: `systems/pro.ts`, `proagent.ts`, `projobs.ts`, `propay.ts`, `proshowcase.ts`, the
Career screens and the guide's career chapter, from `12c04ee1` to `5125e6d5` on `b20-career`. Every figure was measured in
the area's clone, on one worker, by the tests named and a scratch run of the same fixtures; none is taken from an earlier
record.

## Commits

- `8fe43f11`: the first repairs: a part posted again waits for the work its last posting cast and says it's a new casting;
  Equity's membership by contract billed; an agreement offered again says what came of the last; the part Sam is Robin;
  `auditionAt` and `callbackAt` removed; `jordan.ts` fixed; five `b20-career` test files.
- `0906d5ce`: the work day reads nerves and enjoyment; union dues paid from the bank are counted in the year's dues;
  `OutsideWorkRequest.firstDay` removed; the guide's unions entry rewritten and marked; mutations 1 to 20 and their output.
- `da0a0903`: all 47 rows and 40 promises read against `0906d5ce`.
- `bf4ab7fd`: mutation 21 (Sam put back), killed.
- `e0b60f74`: the unread `pro.trimmed` count removed; the bounds' test made stronger; mutation 22, killed.
- `5125e6d5`: the rows read again at `e0b60f74` (only `pro.ts`'s line references moved).

## Rows And Promises

The rows in `effects/career.json`, read against `e0b60f74`: 47, all Implemented And Verified; 38 mechanics (21 commands,
15 scheduled kinds, the `pro.postings` reactor, the `pro.equity_joined` event) and 9 notices as presentation rows. 40
promises: 38 Implemented And Verified, 2 Implemented, Verification Incomplete (`commission>taxes.return`,
`unions>taxes.return`): each link is tested in play up to the year's earnings record, and the deduction itself only in
`tests/safetynet.test.ts` from wages entered by hand, no played life having had the two qualifying employers in one year
the performing artist deduction needs. `node tools/effects.mjs --todo career` lists nothing; the check names no problem in
`career.json`.

## The Comparisons (B1 To B3)

Twins from one seed and one save (opened again with `twin`), the same commands and the same clock.

- **B2, skill** (`tests/b20-career-skill.test.ts`; seeds `b20-skill-0..7`, named before the first run).
  - Auditions (4 self-tapes, 4 in person): every ability and technique at the top judged 100, Exceptional, on all 8; at
    the bottom 0.8 to 3.6, Unready.
  - Casting's chance: 0.58 to 0.725 at the top (the most is 0.8), 0.028 to 0.035 at the bottom. The top was cast on 6 of
    8 seeds, the bottom on none; the draw the same for both twins.
  - Shoot days (6 seeds): 100, Exceptional, every day at the top; 0 to 4.4, Unready, at the bottom.
  - The roles posted, read every Monday for two years and played through 40 weeks unsigned and 20 represented: the same at
    the top and the bottom.
  - The agent's office read both alike: `rosterFor` the same, `interestOf`'s factors the same, the same answer to the
    same approach.
  - Representation at the top (seeds `b20-rep-0..7`): graduates all at the agent's bar (5 to 6 of 7 factors), the chance
    0.24 or 0.4 (the most is 0.85), and 2 requested, 2 waiting, 4 passed. First-years: training, availability and
    relevance only near, whatever the skill; on the 5 seeds where his list had little room (3 of 7) no chance was drawn,
    and on the 3 where it had room (4 of 7, a chance of 0.4) 1 requested and 2 passed.
- **Preparation** (`tests/b20-career-effects.test.ts`, 1): a self-tape prepared, 100, Exceptional; cold, 35, Unready,
  the record saying the breakdown wasn't done (65 points off interpretation). An agreement signed made no difference:
  the same 35.
- **Genre** (effects 2): a self-tape 100 knowing the project's genres, 90.4 not, 100 where only an unrelated genre was
  unknown. Shoot days: 100 four times knowing; 89.6, 90.2, 90.7 and 91.3 not (rising, the days being practice in them);
  an unrelated genre unknown, 100 four times.
- **A decision remembered** (effects 3): declined, refused for six months ("from March 31, 2027") and then asked for
  something new; passed on, refused for a year. The agent's breakdowns came only in the signed life; the open calls were
  the same in all.
- **Representation** (effects 4): both twins grossed $250.00 with $19.13 withheld. Represented: $25.00 commission,
  $205.87 through the trust account; unrepresented: $0 commission, $230.87 straight to the bank. The same work log; his
  calls only in the represented life; the open calls the same.
- **A referral and a credit** (effects 5, 6): at the top, the part unprepared was judged 76.5, Strong, every day, and the
  referral was taken; at 75, 57.9 to 58.9, Working, and the referral was refused ("…your work as Jess was Working.");
  $10,000 more in the bank, the same band and the same referral. The credit left the résumé behind until it was brought up
  to date, raised training to beyond (against at), and the part was never posted again in 60 weeks; declined, it came
  back. Every other part was posted the same weeks.
- **Work authorization** (effects 7): an F-1 graduate on OPT accepted the part; one without was refused ("There's no
  permission to work in the US among your papers. …"). The roles posted, the self-tape's judgment and casting's word
  were the same.
- **A release on the clock** (effects 8): before it, Cut A Reel refused the footage; at it, a notice once, the footage on
  a reel with its band, and the agent's office reading "your reel".
- **The work day** (`tests/b20-career-defects.test.ts`): loving the project's genre (horror against romantic comedy),
  morale 76.50 against 75.00 and stress 4.77 against 6.27, judged 76.5 both; a rehearsal day at agreeableness 90 against
  10, morale 76.60 against 73.40; a night on stage at extraversion 90 against 10, composure 50 in both, stress 8.90
  against 15.30, composure grown to 50.275 in both, judged 93.5 both.
- **Dues** (defects): $600.00 counted at the degree; $688.00 after 1 November.
- **B3, reached through the clock in these tests:** an audition, the quality of work, a referral, commission (the trust
  account's release), a credit, a later opportunity (a posting again), a payment, a fee (Equity's bills), career
  eligibility (OPT), and deadlines missed (an offer lapsing, a tape due).

## Defects Found And Repaired

Each "before" is its mutation's, the repair taken out of the repaired code; the tests were written beside the repairs.

1. **A part posted again** (`projobs.ts:422`, `:438`; the words "again" on the card, in the record and in the agent's
   notice): it came back at ten weeks even in the middle of the run that cast it, with no word of the first time. B20-CAREER-1:
   "expected 1816606800000 to be greater than or equal to 1818383400000", about 20.6 days before the last day of the work its
   last posting cast; B20-CAREER-2: "expected undefined to deeply equal { postedAt: … }". `tests/b20-career-history.test.ts`.
2. **Equity's membership by contract never billed** (`projobs.ts:1298` emits `pro.equity_joined`; the notice says how the
   membership came). B20-CAREER-3, a SETUP ERROR (a TypeError) on its first run; the test made stronger, its second run:
   "expected [] to deeply equal [StringMatching…, …(3)]". `tests/b20-career-defects.test.ts`.
3. **An agreement offered again said nothing of the last one** (`proagent.ts:893`). B20-CAREER-4: "expected [ …(2) ] to
   deeply equal [ …(2) ]". `tests/b20-career-history.test.ts`.
4. **Sam beside the classmate Samuel Patel** (`careerwork.ts`; Robin now). B20-CAREER-21: "expected [ 'Sam' ] to deeply
   equal []". `tests/pro-core.test.ts`, which now refuses short forms too.
5. **Union dues paid from the bank never reached the year's dues,** which the return reads (`propay.ts:618`, `countDues`,
   called at `:630` in `settle` and `:767` in Join SAG-AFTRA). B20-CAREER-20: "expected +0 to be 60000".
   `tests/b20-career-defects.test.ts`.
6. **The work day read neither nerves nor enjoyment** (the creation area's finding, sent by the coordinator; `projobs.ts:1438`
   takes nerves on a performance day only, `:1461` calls `enjoyWork` with the project's genres, and on a rehearsal day by
   agreeableness). B20-CAREER-18: "expected 75 to be greater than 75"; B20-CAREER-19: "expected 9.0958… to be greater than
   9.0958…". `tests/b20-career-defects.test.ts`, two twins. Two statements, beside the exertion line at `projobs.ts:1430`,
   so the life area's change there merges apart.
7. **Values written and never read:** `auditionAt`, `callbackAt`, `OutsideWorkRequest.firstDay` and `pro.trimmed`,
   removed, each with a comment in the past tense; `tsc` (tests included) exit 0. Nothing behaved differently, so no
   mutation for the removals; B20-CAREER-22 holds the bounds' order `trimmed` was checked by.
8. **`jordan.ts`** read `AGENT.fictional`, gone; it reads the agent's name or his agency's now, and was run again
   (`jordan-b20.txt`).

Two earlier tests expected what the dues and nerves repairs changed (`journey-career`'s L1 and a `propay` dues assertion),
and were brought up to date; the rerun passed 33 of 33.

## The Twelve Kinds (D1)

1. **Written and never read:** every field of the professional record grepped for a reader outside the tests; four found
   and removed.
2. **A choice that promises a difference and makes none:** B1 twins for each input; the work day ignoring loved genres
   and the dispositions found and repaired.
3. **Success with nothing changed:** each command's result read against what it writes, and the tests read the state
   after each; none.
4. **Effects worked out and never applied:** the bank-paid dues missing from the year, and Equity's membership by contract
   unbilled; repaired.
5. **A notice or the guide describing what isn't there:** all 40 promises read against the code; the unions entry's words,
   the loved-genre promise and the agreement offered again repaired.
6. **Counted twice:** the save-and-load tests compare to the byte, the bills are keyed, and the fee was taken once across a
   reload; none.
7. **Time skipping an obligation:** paydays jumped past (`propay`), the release run on the clock, long jumps in the
   save-and-load runs; none.
8. **A save and load dropping or replaying a consequence:** `tests/b20-career-saveload.test.ts` plays 9 steps of a part,
   6 of an approach and the School's follow-up, saved and opened before each step, each ending the same to the byte as the
   life played straight; none.
9. **Impossible scheduling or eligibility:** a part posted again in the middle of the run that cast it, repaired; OPT and
   the class clashes hold.
10. **A control wired wrong:** every `run('pro.*')` in `src/ui/career/*.tsx` matches its `Gated` feature and label; none.
11. **Reachable only by a test's hand:** the release had no clock test, and has one; `auditionAt` was set only by fixtures,
    and was removed.
12. **An opportunity offered again against what's done:** the posting again and the agreement offered again repaired; a
    credited part is never posted again, held by a test.

## D4

- The posting again, `jordan.ts` and Sam: repaired, above.
- **The dialog count, traced:** the interface playthrough seeds each new life from the clock (`src/app/SlateApp.tsx:60`),
  so each run plays a different life. At 1440, 23 dialogs on `e002ec7a` (seed `1-AlexRivera-mvi1kxl3`) against 24 on
  `4aac9a94` (seed `…mvii8jj6`): the first 11 the same, and after them one life has an extra 7:00 PM class stop and
  "Rehearsal With Nadia". At 390, 25 and 25, from different seeds too. Not a career defect: the playthrough tool's or the
  interface's.
- `PARTNER_KIND`: coursework's (the School area repaired it).

## Mutations

22 in `../../mutations/career.json`, output in `career.txt`, across `projobs.ts`, `proagent.ts`, `propay.ts`,
`careerwork.ts` and `pro.ts`: 22 killed, none survived. B20-CAREER-3 was a SETUP ERROR on its first run and killed once
its test was stronger; both runs recorded.

## Checks

All 20 career test files on one worker, 232 tests, pass. `tsc` exit 0; eslint on the changed files exit 0; the
text-inventory and surfaces checks exit 0. Text marks are in the owning areas' files (`career`, `career-work`,
`career-agent`, `career-pay`).

## Left, For The Owner If Wanted

- A shoot day takes no nerves, as a School self-tape doesn't.
- Genre knowledge isn't part of judging an in-person audition or a night on stage, those task profiles having no genre
  part; it enters casting's chance through the fit.
- The two tax-return promises want a life with two employers in one year to be played end to end.
