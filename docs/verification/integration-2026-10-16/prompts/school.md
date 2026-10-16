# School (key `school`)

Read `common.md` beside this file first.

## As Given On 2026-10-15

Items:
1. `repeatRoom`'s leave branch (src/engine/systems/school.ts; it counts the program terms still to come, with `next` the term a leave began in, as `yearOfStudy` reads it): unplayed and untested. Determine its classification (required reachable behavior? which leave and which notice reaches it: an Incomplete extended past a leave's start that runs out during it, or a Fail at an evaluation during/after a leave), and either play it (preferred: a medical leave with an Incomplete running out during it, the Permanent Incomplete notice's repeat offer checked against what repeatRefusal says at the year's end), or test it as a GUARD with the reason play can't reach it. Mutation-check it.
2. Every other control or refusal in the school system that no current player journey reaches (grep the refusal functions in src/engine/systems/school.ts, leave.ts, courserecord.ts, coursework.ts, classmates.ts, the "GUARD:" tests and the audit rows' gapsOpen for school): classify each (required reachable | necessary guard | older-save compatibility | misleading player-facing control | truly redundant); fix reachable behavior and misleading controls (a control the screen draws that a valid state never enables, or a refusal that tells the player something false); keep and directly test necessary guards; remove redundant code only after confirming no caller or compatibility purpose.
3. School continuity across leave, return, repeated terms, failures, extra terms, graduation decisions and reloads: previously earned results (course records, attendance, grades/standings, credits, coursework, work-study hours and conversions, aid) never disappear, duplicate, or change without a rule. Build one or more played multi-term journeys through graduation (and through a withheld degree) with reloads at each boundary, asserting the course record and the ledger are the same as a twin played straight, and that each notice comes once. Use existing seeds/journeys from tests/scope-school.test.ts as starting points.
Tests in tests/remaining-school.test.ts.

## Added By The Owner's Brief Of This Pass (Its Section 6, "Finish School As A Playable Journey")

Items of their own in the checklist (`school.s6.<topic>`):

1. **The missed-work term** (`school.s6.missed-term`), the gap the sweep left open
   (`docs/verification/sweep-2026-10-16/README.md`, "Left Open"; `tests/workload.test.ts` sets the misses by hand and
   calls `termWarning`). Play, through the commands and the clock on a new life, one term in which at least two pieces
   are missed unexcused and a revision is missed, and later pieces are shown. Assert, each against a count worked from
   the term's own assignments (not from `termTally`): the warning (`A Word On Your Coursework`) comes once, when the
   rule says, with the counts the rule gives; Shown Today and Due Soonest on the screen after a miss; the notices; and
   the faculty's review counting the misses as due and Unready, as the warning did. Reload at the miss, at the warning
   and at the review, and compare with a twin played straight. Cover the boundary: a term just under the warning's mark
   (5 due) and one at it (6), and a missed piece that's excused (a leave, a sick day) counting as the rule says.
2. **From creation to the endpoint** (`school.s6.journey`): follow a new life from creation through entry, orientation,
   successive terms, evaluations and the degree (and a withheld degree), listing every school system the brief names
   (enrollment and records; curriculum, prerequisites, schedules and deadlines; tuition, fees, aid and payment status;
   attendance, excused absences, missed work and make-up; coursework, table work, rehearsal, partners, readers and
   showings; feedback, revisions, assessments and standing; productions, role demands, preparation and performance;
   advising, warnings, recovery and consequences; term progression, completion requirements and final records). For
   each, where it's implemented and tested, and any connection missing. Fix a missing connection that closes a real
   hole; don't add institutional machinery the school doesn't have.
3. **Yale's policy against SLATE's design** (`school.s6.policy`): research the actual program (the David Geffen School
   of Drama at Yale's M.F.A. in Acting: its Bulletin, its academic regulations, its calendar, its tuition and aid) and
   say, for each rule SLATE plays (the nine semesters, the repeat, the additional term, the faculty's review and its
   mark, leaves, incompletes, attendance), whether it's the school's published policy (cited, with the date read) or
   SLATE's simulation design. Where the guide or a screen presents SLATE's design as Yale's policy, or simulated staff
   feedback as real, correct the words.
4. **No dead-end warning** (`school.s6.dead-ends`): every school warning and notice that can end in a consequence says
   what happened and what legitimate options remain, and the controls it names exist and work. A notice that leaves the
   student with nothing to do (a dismissal, a withheld degree) says so plainly and says what still stands.

Tests in `tests/remaining-school.test.ts`, and `tests/remaining-school-term.test.ts` for the missed-work term.
