# Brief 20, The School Area

Written down by the coordinator from the School area's report as it returned it (2026-10-22): the harness wouldn't let the
area write this file itself. The words are the area's but for this note.

- **Started from:** `12c04ee1`, a clean tree, no stash, one worktree. **Ended at:** `5d55e77c` on `b20-school`.
- **Commits:**
  - `997ed36e`: D4, the clock's own stop choices declared on first read, so a bundle entering the ring at `projobs.ts` loads;
  - `e2fe762a`: attendance, obligations, first-time events and work-study, each compared through commands and the clock;
  - `1d47fd2f`: D4's moved words recorded where they now live (`clock.ts#declareOwn`);
  - `c83d4774`: the last year's faculty review keeps a student on warning to repeat the year, and the 30 days to ask come
    with it (with the degree, trust and account comparisons);
  - `84ae7276`: the mutations, and the tests made stronger where two survived;
  - `845968c4`: the 102 rows and 43 promises read against the code, and the welfare comparison;
  - `5d55e77c`: the notice of return's no-leak side.
- **Tests:** 10 files, 67 tests: nine new (`tests/b20-school-{attendance,time,firsts,workstudy,trust,account,degree,looks,welfare}.test.ts`)
  and `tests/module-load-order.test.ts` extended, all passing on one worker. Shared setup in `tests/setup/b20-school.ts`:
  lives made as creation makes them (`newLifeFrom`) and played by `tools/policy.ts`'s attentive student unless the clock
  alone is said. The typecheck, eslint on the changed files and the text and surfaces checks exit 0; `effects.mjs --todo
  school` lists nothing. The full suite, the gate, the journeys and the built app weren't run here.

## Rows And Promises

| | Rows | Promises |
|---|---|---|
| Implemented And Verified | 102 | 42 |
| Implemented, Verification Incomplete | 0 | 1 (`shifts>body.how`) |
| In scope | 102 | 43 |

79 rows are mechanics and 23 presentation: the five looks, the recess notice and 17 notice sites. Each consumer's line was
found in the code from a fragment of the line that reads the change, not copied from the seed. The 23 presentation rows
give their purpose: the five looks checked against the record they read (`tests/b20-school-looks.test.ts`), the notices
each in a cited test that contains them, checked by script. Rows held only by earlier tests were checked to exist, run in
the gate and issue the command, and a sample of their assertions read: the mandatory-leave journey in `school-paths`, the
December conferral in `evidence-g26-school`, the company, stipend and summer in `evidence-g22-school`, the recess in
`coverage-gaps-recess`. Not every assertion of every earlier test was read. Things set by hand are named in the rows
(`school-paths`'s two hospital stays; here, the flu and the welfare test's lay-up), each only the illness or injury that's
the precondition, never the School's consequence under test.

`promise.school.shifts>body.how` stays incomplete: no test here checks a shift's energy as the clock takes it, and the
body's dials are the life area's.

## The Comparisons

One seed each, one thing changed, through commands and the clock.

| Comparison | What changed | What didn't |
|---|---|---|
| **Attendance**: 11 Tuesdays slept through | Attended 54 of 65 against 65 of 65; the review's attendance 87.9% against 100%, "That's under the 90% the program asks."; Acting I 28/39, Speech And Accents I 15/26 and Text And Context Across The Repertory 15/26 failed and told; the faculty's review puts the student on academic warning, and in January the Cabaret is refused for it; craft grew 1.43 points against 1.68; each morning said at 9 AM that day, over 60 days before the review | Every balance, the calls (14, 14) and shifts (12, 12), every classmate's craft; saved and opened on 15 October, the fall ends the same |
| **Work-study**: Saturdays slept through from 19 September (6 had shifts) | Worked 2 of 8 against 8 of 8; $276.00 against $966.00 on the 2026 earnings record, each payday $138.00 and equal to its postings; the fall review's attendance lower | Classes equal; checking $17,514.50 against $18,204.50, the $690.00 exactly five paydays; savings equal |
| **Excused ill** (the flu set by hand) | The Saturday shift called in sick isn't counted against attendance; its 6 hours became $138.00 of grant aid at 15 January's processing, recorded as 2027 scholarship; the slept-through twin is refused a conversion | |
| **Trust**: three rehearsals with Aaliyah Fischer slept through | Her trust 22 against 78; "Aaliyah Waited For You"; her later asks declined in so many words; the scene shown together Working (64) against Strong (67.9); amends repair three incidents and lift trust back over the wary line (25) | Balances and the term's tally equal |
| **The Yale account**: a medical leave on 12 October 2026 charges $3,800.13 back, due 11 November | Unpaid: a hold, then $125.00 on 11 November, 11 December and 10 January to the $375.00 cap, $4,175.13 owed, the balance the sum of its postings; paid early, no hold and no fee; paid in February, the hold lifts once | The leave the same either way; checking differs by exactly $375.00; savings equal |
| **Notice of return** | None: "Two Weeks To Give Notice" on 14 June, then dismissed on 28 June; given: back in Fall 2027 and counted in class only after Register | Money and standing equal on the deadline's eve |
| **The degree** (the J01 last-term save, the clock a week at a time) | Every class kept: the MFA conferred at Commencement, 21 May. March slept through: 85.8% attendance, Taming The Cyclops failed (10/14), nothing asked in the 30 days, withheld 27 May. Slept through to 14 April: 8 failed, the faculty's warning, the 30 days offered, the repeat granted. Ill through March: 15 days excused, 100% attendance, Taming The Cyclops Incomplete, "Not At Commencement"; made up after, conferred without the ceremony. Ill and not made up: reminded 20 May, Permanent and withheld 27 May | Money equal on Commencement's eve |
| **Welfare** (an injury set by hand) | Laid up six weeks: the 12th class day ill brings Yale Health's assessment, which recommends a leave the dean imposes; laid up one week: 5 days excused, nothing asked | Excused days left out of attendance; the term goes on in good standing |
| **Rest**: Tuesday 15 September, nothing due, after a night's sleep against none | The day's classes grow the craft less with no sleep (under 90% of the rested growth) | Both counted in class alike |

## Time And Obligations

From a save at Sunday 13 September, 8 PM, a week and a month moved three ways: one jump; a day at a time; as the screen
moves the clock, stopping at each commitment and answering Go. In each, every class day, lab, rehearsal and shift in the
window came, each on the calendar once, and was kept or missed, none left pending or called off on the way; the tally rose
by exactly those; each piece due was shown at 9 AM on its day or excused; each booked rehearsal was settled. All three, and
a save opened halfway, ended alike: the tally, the course records, every piece, every rehearsal, work-study and every
balance. A Monday slept through was missed and counted once, and told at 9 AM. Not a defect: an unread notice repeated
word for word is brought up to now rather than said twice; each morning was still said on its own day.

## First-Time Events

The first year, played to 25 January 2027 straight through and again with six saves opened, is the same to the byte. Each
comes once: the welcome; each of orientation's five sessions; the first standing notice; the first cast list ("Cast:
Carlotta Festival Of New Plays"); each first piece shown. A session done is refused "Done on …". Registration slept
through: caught up the same day, it's done once and the session scheduled doesn't come again; never caught up, every class
day is "Not Registered" and counted absent, and the shift is "A Shift You Couldn't Work", not convertible. The clock stops
at the first session.

## Defects

1. **D4: `PARTNER_KIND` read across the import ring before it exists.** Failing before: `node tools/load-order.mjs
   src/engine/systems/projobs.ts` → `Cannot access 'PARTNER_KIND' before initialization`, from `world/clock.ts` running
   `defineStop(PARTNER_KIND)` as it loaded while `coursework.ts` was still loading. The clock's own stops (`declareOwn`)
   are declared on the table's first read, as `careerStop` was made; `tools/load-order.mjs` takes an entry, and
   `tests/module-load-order.test.ts` bundles `projobs.ts` too (it failed before and passes after, and `main.tsx` still
   loads). Mutation B20-SCHOOL-16 (declared at load again), killed. The Skip It and Call It Off words moved unchanged to a
   new source name and were marked again (the first pass by `b20-school`, the second by `frame`, which the tool gives
   `clock.ts`), `#top` pruned, and the surface's row brought up to date.
2. **A last year's faculty review offered a repeat it then took away.** A student with 8 courses failed in the last spring
   was told the faculty had "kept you on academic warning, to repeat the year: ask to repeat it at the year's end", and at
   the same instant the degree was withheld and an ask to repeat refused "You're not at school." The guide promises the
   repeat after the faculty's warning. Failing before: `tests/b20-school-degree.test.ts` G3, `expected 'withheld' to be
   'warning'`. In `evaluate` (`school.ts`) a warning the term's own faculty review gives comes with the 30 days to ask for
   a repeat or an additional term (`repeatable` holds when `stepped !== 'warning' || reviewed`); a warning carried in and
   unmet still withholds the degree. `scope-school`, `remaining-school`, `leave`, `evidence-g26-school` and
   `school-journey-gaps` pass with it (102 tests). Mutation B20-SCHOOL-3 (the fix undone), killed.

## The Twelve Kinds

1. **Unread values:** consumers followed for every row; `node tools/wired.mjs --check` passes; `node tools/unread.mjs` finds only report fields in `learning.ts`, not game state.
2. **Choices with no difference:** every comparison found the difference it promised.
3. **Success with nothing changed:** each command's result checked against the state it says it changed. None.
4. **Effects never applied:** fees, aid, wages, conversion and trust followed to the bank, the earnings record and later refusals. None.
5. **False notices or promises:** defect 2; all 43 promises held to the code, 42 to a test.
6. **Counted twice:** the late fee's cap (B20-SCHOOL-20), one count a day (19), conversion once, amends once. None.
7. **Time skipping an obligation:** the time test. None.
8. **Save and load:** the reopen to the byte, the mid-term reload, the halfway reloads, the branches at the review and the leave. None.
9. **Impossible eligibility:** defect 2.
10. **Controls wired wrong:** each School command's control read beside its label in `src/ui`. None.
11. **Reachable only by a test's hand:** the conferral is played; welfare's second trigger is reached through play now. Its first trigger (two hospital stays) is still set by hand in `school-paths`.
12. **Opportunities offered again:** sessions, conversions, amends, the Cabaret and the first casting each refuse a second time or come once. None.

## Mutations

26 in `../../mutations/school.json`, results in `school.txt`: all 26 killed in the end, each on an assertion naming the
behavior, none a setup error. B20-SCHOOL-13 survived its run: two registration marks are redundant on purpose, for older
saves; B20-SCHOOL-21 breaks the reader itself and is killed. B20-SCHOOL-22 survived its first run: the rest test didn't
isolate focus; rewritten, its rerun is killed.

## Outside This Area

- `world/clock.ts` bundled as its own entry still stops at `STOPS` read before it exists (through `proagent.ts`'s
  `defineStop` as it loads), before and after the fix. No entry the app has reaches it.
- `tools/effects.mjs` read a promise's tests from `evidence.tests`, not the seed's top-level `tests`; both were written.
  (Fixed by the coordinator: both are read.)
- The second pass's marks for `clock.ts` live in `frame.json`.
- `inventory.json` and `INVENTORY.md` were written by their tool, differing only by the moved source's name.

## For The Owner

Nothing needs the owner's decision. One wording point left as it is: at a last year's review "Not Passed" says "At the
year's end, you can ask to repeat the year" beside the notice that gives the deadline; it is the year's end, so it isn't
false.

## Left

`promise.school.shifts>body.how` (a shift's energy, the life area's); the welfare assessment's hospital-stays trigger
reached only by the stays set by hand; the journeys, the gate and the built app, the coordinator's.
