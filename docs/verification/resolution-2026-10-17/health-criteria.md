# Brief 12, Health: health.enroll's Work Branch, The Finding And The Criteria (2026-10-17)

Written on `20b6d777`, before any code or test it governs changed (`prompts/common.md`, step 1). The owner's resolution is
brief 12's section 3 (`../briefs-2026-10-16/12-resolve-the-remaining-decisions-and-complete-the-authorized-build.txt`),
quoted in `prompts/health.md`. It's a scope resolution for `health.enroll` alone: decision 4's 23 rows aren't read or
touched here.

## The Row As It Stood, Kept

`health.enroll` (Life, Health And Time), **Implemented, Verification Incomplete** at the baseline
(`../completion-2026-10-16/baseline.json`), partial at brief 11's second reader
(`../pipeline/inputs/final-checks/brief11-journeys.json`). Its words then: "HUSKY D kept at renewal through work is held on
a FIXTURE (tests/remaining-health-billing.test.ts, wages by hand, as no played life on HUSKY D has any)". The second
reader's decision, kept as written: "an arm play can't reach, held on a fixture, keeps the row partial under the standard
... The owner decides whether to cut the arm or keep it as a guard, with the row recording that decision." Its other
findings (four weak tests, the stale text, `PUBLIC_COVER`'s comment) are answered in the result, not here.

## The Branch

`monthEngagement` (`src/engine/systems/health.ts:435-455`) decides how a month meets Medicaid's work rules from 2027. Its
work branch (`:443-444`) returns `'work'` where the month's `'salary'` postings state 80 hours or more (`workedBetween`,
`src/engine/systems/earnings.ts:207-219`, which reads the hours from the memo's "N hours", and counts a Summer Cabaret
stipend as 40). It runs after the age and School tests and before the income test (`:445-448`), which meets a month whose
income, with any wages posted that the record doesn't hold, is $580 or more.

## The Finding

The owner authorized keeping the branch "where it is necessary for existing data, compatibility, or defensible engine
behavior". Each ground, read in the code and the history on this branch:

### Existing Data: No Save Needs It

What a save can carry into the branch is 80 or more hours of `'salary'` postings in a month off the School. Every build
whose saves this one opens was read for what it posted (`migrate`, `src/engine/index.ts:625-1145`, opens any older save,
and keeps "every posting in its ledger", `:991-996`; no code prunes the ledger):

- **The first build** (`44906b02`, 2 September 2026): its paychecks were memoed "employer — title"
  (`src/engine/systems/finance.ts:457` there), with no hours, so `workedBetween` reads none.
- **The day-job builds** (`9a12c11a` on 24 September 2026 to `23485b8e` on 26 September, schema 89): the one source of the
  branch's input. A paycheck was memoed "title: N hours" (`src/engine/systems/work.ts:245` at `9a12c11a`, `:972` at
  `23485b8e^`), and migration's day-job step (`index.ts:936-962`) takes the job and the pay record off and keeps the
  postings. But where a life of those builds is one the work rules read (New Haven, New York or Los Angeles):
  - it worked where it lived: no command in those builds changed `currentLocationId`, and `homeOf` is the current
    location (`earnings.ts:298`);
  - it was paid at least the place's floor (`adultRateAt`, `Math.max(legal, ...)`, `work.ts:387-412` at `23485b8e^`):
    $17.00 in New York City and $16.90 in California, and the federal $7.25 in New Haven, as Connecticut had no row
    (`src/engine/content/wages.ts:65`, `:109`, `:113` there). The United States had no youth rate, and a junior's share
    of the rate was Australia's alone (`wages.ts:163-195` there);
  - it worked whole hours: a shift was the job's 5 to 10 hours, or 8 full-time (`src/engine/content/jobs.ts:44-57`,
    `:162-168` there), and the pay's "Hours Worked" line was those hours times the rate, to the cent.

  So 80 hours on any such paycheck were paid at least 80 × $7.25 = $580.00, which is the income test's own figure (42 CFR
  435.552(f): 80 hours at the federal minimum wage). The migration took the pay record off, so the income test reads those
  postings' pay where the record doesn't hold it (`work.pay - recordedPay`, `health.ts:445-447`) and meets the month: the
  same outcome as the branch. Those builds also began every life on 5 January 2026 (`src/engine/world/bootstrap.ts:141`
  there, `:129` at `9a12c11a`), ran the clock live (the faster speeds were unreachable: "the time controls offer only Play and Pause now",
  `src/app/game-context.tsx:98-100` there), jumped at most 14 hours by Sleep or 14 days by Skip To Event
  (`src/ui/shell/TimeControls.tsx:285-287` there), and had no public program to renew. The first month any work rule
  reads is December 2026 (an application in January 2027; a program's renewal reads only months from its application's
  own look-back on). No such save is known, and nothing was ever deployed.
- **The career** (`f4b51f49` to the scope reset, `bcc30c88`): its paychecks counted days ("role: N days",
  `src/engine/systems/career.ts:2117` at `bcc30c88^`), and its residuals and the SAG pension stated no hours (`:3224`;
  `src/engine/systems/pension.ts:185`), so none reads as hours.
- **The School, then and now:** work-study at $23.00 an hour (`src/engine/content/school.ts:266`, the same at `d6d93258`)
  and the Summer Cabaret's stipend, counted as 40 hours, paid only at the School. A month any of which is spent at the
  School meets the rules as the School's before the work is read (`health.ts:442`), and a month wholly off it can hold at
  most the last payday's hours, under 80 (brief 11's second reader, confirmed here in `school.ts`).

### Compatibility: Nothing Reads It But Two Sentences

`'work'` is read only by `BY_WORDS` (`health.ts:994-997`), for the sentence a renewal (`applyRenewal`, `:1060`) and a
granted notice (`grantPending`, `:1148`) say. How a month was met isn't kept in a save (`PendingDetermination`,
`:118-130`, keeps the months and the band), and no screen, tax code, Base44 function or tool reads it. Six test files
assert the branch's sentence or outcome; each posts its wages by hand, and only one decides on the branch
(`tests/defects-g8-4.test.ts`, 80 hours at $5 an hour, under the $580 the income test asks, which its own comment says
SLATE never pays).

### Defensible Engine Behavior: The Income Test Already Is It Here

The branch is the statute's own first prong (Pub. L. 119-21 §71119, 42 USC 1396a(xx)(2); 42 CFR 435.552(a)(1)), and the
income prong is defined by it: 80 hours at the federal minimum wage. In SLATE they can't come apart: no wage was ever paid
under $7.25 an hour where the rules are read, in play or in any save's history (above), so every month the work branch
meets, the income test meets too, from the same postings. By the falsifiability test, its hours change only the
sentence: "by 80 hours’ work" for "by its income, $580.00 or more", both true of such a month.

### The Decision

**The branch serves no necessary purpose, so only it is removed**: its two lines, `'work'` in `EngagedBy` and `BY_WORDS`,
and `PUBLIC_COVER.workHours` if nothing reads it once the notices say the player's route (criterion H2). The income test
stays as it is, including its reading of wages posted that the record doesn't hold, which carries a day-job save's paid
hours. No outcome in play or in any save changes. The one test whose outcome changes is the fixture that paid 80 hours
under $580, an input no save can hold; it's rewritten to hold the removal.

## The Criteria

Each mapped to the brief's words. The row closes as a **scope resolution** only when every one holds on its own evidence,
and a second reader's check (`health-checks.json`) finds no open problem.

### H1. The Unreachable Branch Removed, Alone

The brief: "If the branch serves no necessary purpose, document that finding before removing only that unreachable
branch."

- This finding is committed before the code changes, and the removal's commit cites it.
- Only the branch and what reads only it go. Every journey that held a program through work posted by hand keeps its
  outcome; only the sentence moves to the income test's.
- A test fails before the removal and passes after: 80 hours paid $400 in a month, nothing else, no longer meets the
  rules (a notice of noncompliance), and a month of $580 or more still does. Restoring the branch in a copy is caught.
- Comments the removal falsifies say what's no longer true, in the past tense, dated: `monthEngagement`'s,
  `PUBLIC_COVER`'s, and each test's that said 80 hours decided.

### H2. Notices Say The Player's Route

The brief: "Do not advertise it as an available player action." and "Ensure notices describe the player's actual
applicable route."

Every notice and screen that names the work rules says what applies to this player: a month spent at the School keeps a
student, and off it $580 of income in a month (pay, interest, a benefit or a pension), SNAP received under its work rules,
being 65 or over, or a stay in hospital asked for as a hardship. None names hours of work as a way to meet them:

- the notice of noncompliance, at a renewal and at an application;
- the decision on it: "Your Public Cover Ends" and "Public Cover Denied";
- the renewal's "Your Public Cover Is Renewed" and "Your Public Cover Changed At Renewal", and "Public Cover Approved"
  after a hardship or a decision, each naming how the month was met;
- Enroll's refusal, which Papers' Marketplace panel draws, and that panel's paragraph on the rules;
- the hardship's line and toast on Papers;
- the guide's Papers chapter and the tutorial, with a dated line saying what changed.

Each is held through the drawn screen: Papers rendered, and a notice as Home draws it, each with its words exact and no
"hours’ work" on the screen.

### H3. The Reachable Paths, Verified As A Player Reaches Them

The brief: "Verify the reachable student, eligibility, enrollment, renewal, and hardship paths."

Each played through the commands or the drawn screen on a life the creation screen makes, with its downstream effect, and
across a save and a load; existing tests cited by their exact titles, new ones written only where none holds:

- **the student:** refused while Yale Health covers her; a month at the School meets the rules at an application, and
  **at a renewal**, which no test reaches by play alone yet (the one that does reaches it through a renewal held by work
  posted by hand), so it's written;
- **eligibility:** income placing her in HUSKY D, Covered Connecticut or the marketplace; status; and each exception
  played (income, SNAP, age);
- **enrollment:** Enroll on Papers, the program's start, the marketplace's premium, the duplicate refusal;
- **renewal:** kept, moved between programs, and a notice of noncompliance ending it;
- **hardship:** a stay in hospital answering a renewal's notice and an application's, and its refusal where there's none.

A test whose work is posted by hand isn't cited as a playable journey.

### H4. Internal Safeguards, Tested Apart And Named

The brief: "Test the retained internal branch separately and identify its purpose." and "Distinguish “internally tested
safeguard” from “verified playable journey.”"

The work branch isn't retained, so there's no branch to test apart; its removal is held (H1). Every `GUARD:` and `FIXTURE:`
test the row cites is listed apart from the playable journeys, each with the state play can't reach that it holds.

### H5. Recorded As A Scope Resolution

The brief: "Record this as an explicit scope resolution for health.enroll. Do not apply it to decision #4 or alter that
decision's protected rows."

`health-result.json` gives `health.enroll` the disposition `scope resolution`, its status on this evidence, its playable
journeys and its internal safeguards apart, and the row's corrected words (`rowText`) for the coordinator to fold.
Nothing the game judges moves: RULESET is acting's (`src/engine/content/tasks.ts`), and the save schema stays 94, since no
kept field's meaning changes.
