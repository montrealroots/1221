# Brief 13, Journeys: The Plan, Each Journey's Expected Outcome, And The Checks (2026-10-17)

Written on `09a37a18`, the commit that added brief 13's instructions, before any journey ran and before the harness that
plays them was written (`prompts/common.md`, step 1; `prompts/journeys.md`, step 1). Nothing here was measured to be
written. The expectations come from the game's rules as the code states them (cited by file) and from brief 11's and
brief 12's final runs (`../resolution-2026-10-17/runs/`), which played 24 lives on other seeds. The harness is developed
on seed `dev-0`, which is none of the journeys below, and none of the seeds below was played before this was committed.
Where a journey's result differs from what's written here, the difference is either a defect (fixed, tested, and the
journey run again) or an expectation that was wrong, said so in `journeys-result.json` with the reason. Nothing below is
moved to fit a result.

## The Owner's Words

Brief 13's section 4, as the owner wrote it:

> Run at least twelve complete school journeys across multiple seeds and distinct player profiles. Reuse existing
> simulation tools where appropriate, but play through normal commands and progression rather than directly assigning
> successful outcomes.
>
> Include:
>
> * Beginners.
> * Balanced generalists.
> * Specialists with different strengths.
> * Highly developed or mastered actors.
> * Players who follow advice.
> * Players who partly follow or ignore advice.
> * Players who experience missed work, financial restrictions, or health interruptions.
>
> Set expected outcomes before running each scenario. A deliberate neglect scenario may legitimately fail academically;
> the game must explain and apply the consequences correctly. Do not count every dismissal as a defect or force every
> player to graduate.
>
> At least some journeys must recover from setbacks through available gameplay.
>
> For each complete journey verify:
>
> * Creation choices affect the intended state.
> * Classes, preparation, rehearsal, interpretation, and showings connect.
> * Attributes and genres develop and influence applicable work.
> * Advice responds to progress and changing circumstances.
> * Health, stamina, and energy remain distinct and interact correctly.
> * Money, school charges, holds, and payments reconcile.
> * Papers and document status affect the appropriate actions.
> * Warnings arrive consistently with later evaluations.
> * Term progression and the school endpoint work.
> * Saving, exiting, reloading, and continuing preserve the journey.
>
> Use additional focused scenarios where a full school journey cannot naturally reach an important financial, document,
> or health branch.

Section 6, as the owner wrote it:

> Inspect progression across the playthroughs, not just final scores.
>
> Check:
>
> * Previously completed actions remain completed.
> * Consequences and scheduled events occur once.
> * Advice acknowledges what has changed.
> * Repeated feedback reflects the current state.
> * Different suitable interpretations produce understandable differences.
> * Exercises and situations vary where the current catalog supports variation.
> * Repetition is not disguised by changing words alone.
>
> Record repeated situations and recommendations, their frequency, and whether they remain justified. Do not rotate to
> inferior advice just to make a repetition count smaller.
>
> Fix concrete defects found during these journeys. Add regression tests and rerun the affected scenarios.

And section 7, where a journey shows it:

> Confirm that the final changes preserve:
>
> * Maximum-quality prepared mastery.
> * Relevant attribute improvement without unintended regression.
> * Genre-specific benefits without unrelated leakage.
> * Specialist opportunities and valid limitations.
> * Accurate advice forecasts.
> * Stamina's duration, participation, intensity, and recovery behavior.
> * Ledger balance.
> * Save compatibility and historical results.
> * Decision #4's unchanged protected rows.
>
> Nothing advertised as a functioning mechanic may be decoration. Its stated behavior must be connected, persistent, and
> demonstrated.

## How A Journey Is Played

A new tool beside `tools/lives.ts`, `tools/journeys.ts`, plays each journey hour by hour through `sim.execute` and the
clock, with the policies `tools/lives.ts` has used since 2026-10-09, kept in `tools/policy.ts` (`lookAfter`,
`keepCovered`, `evening`, `freeHour`, `practiceHour`), and what a journey's own player does besides, each through a public
command. Nothing after creation is written by hand except what a profile's name says is TEST SETUP. It saves and opens the
life every thirty days at noon, as `tools/lives.ts` does, and at the end of each part. A journey runs in parts of under ten
minutes, in the foreground: part 1 to 1 June 2027, part 2 to 1 June 2028, part 3 to 1 June 2029, part 4 to its end. Each
part writes its record to `journeys/<id>-p<n>.json` and the save to a directory outside the repository, which the next
part opens. A journey ends 75 days after the school does (graduated, dismissed, withdrawn or the degree withheld), so the
grace an F-1 status keeps after the program's end is played past, or on 1 September 2030 at the latest.

**The players.** Each is a public-command policy:
- **attentive**: `tools/lives.ts`'s attentive student. Looks after themselves when the Look After Yourself menu puts it
  first and urgent, sees to cover at noon, reads feedback, answers partners and classmates and chooses at the table at
  eight in New Haven, prepares the work due soonest in free hours (from three, from ten at the weekend, to ten), sleeps
  the suggested hours from eleven. Trains nothing.
- **follows**: attentive, and the free hours the school's work leaves spent as `tools/lives.ts`'s practicing student
  spends them: practice on the exercise the advice names first (`practiceHour`, which reads `adviceFor`).
- **partly**: attentive, and the same free hours practiced: on even days of the year the exercise the advice names
  first, on odd days the exercise of their own favorite, the strongest ability that still has room (SLATE's definition
  for this brief, chosen before running: half the sessions follow).
- **ignores**: attentive, and the same free hours practiced, always on their own favorite, whatever the advice says.
- **neglect**: looks after themselves, sees to cover and sleeps; reads nothing, answers nothing, prepares nothing and
  learns no part (`tools/workload.ts`'s `neglect` control). Classes and calls are attended as the clock brings them.
- **keeps papers** (a flag): within 183 days of a passport's expiry applies for a new one (`documents.apply_passport`)
  when it isn't refused; on an F-1, applies for OPT (`documents.apply_opt`) on the first day its window is open.
- **chooses playing** (a flag): before a scene's first step, the way of playing whose preview the screen gives highest
  (`playingPreview`, `school.choose_playing`), on each axis, against leaving it open.

**What's recorded as it goes:** the state at creation and at each term's review; every notice's day, title and the first
words of its body; each warning and the review that followed it; each week's advice (its first recommendation, the
input's level and forecast, its standing, next and attention) and whether it moved when its input did; the ledger's audit
and the Yale account at every reload; each document, and the refusals of the actions papers govern, each month; each
illness or injury and the work judged during it; every coursework showing with its record; each reload, and whether the
state after it is the state before. Each check below reads this record and the final save.

## The Journeys

All begin on Monday 24 August 2026 at Yale, as a new life does (`newLifeFrom`, `src/engine/world/bootstrap.ts`). The
family is a creation choice since 2026-10-14 (`withFamily`); the wealthy and inherited families rule out need, the
others don't (`familyOf`, `needFor`). Seeds `j13-1` to `j13-16`.

| Id | Profile | Seed | Home, pronouns, family | Player |
|---|---|---|---|---|
| J01 | beginner, as made | j13-1 | New York, she/her, wealthy | attentive, keeps papers |
| J02 | TEST SETUP beginner: every ability and technique at 40, the least an admit's talent is (`ESTIMATE.talent.from`) | j13-2 | Mexico City, he/him, comfortable | attentive, keeps papers |
| J03 | as made, follows the advice | j13-3 | London, they/them (an actor), modest | follows, keeps papers |
| J04 | as made, partly follows | j13-3 | the same | partly, keeps papers |
| J05 | as made, ignores the advice | j13-3 | the same | ignores, keeps papers |
| J06 | as made, follows the advice | j13-4 | New York, he/him, wealthy | follows, keeps papers |
| J07 | as made, partly follows | j13-4 | the same | partly, keeps papers |
| J08 | as made, ignores the advice | j13-4 | the same | ignores, keeps papers |
| J09 | TEST SETUP balanced generalist: the eleven trainable abilities each at 703/11 (63.9), as `tools/brief-journeys.ts`'s | j13-5 | Tokyo, she/her, comfortable | follows, keeps papers |
| J10 | TEST SETUP balanced generalist, the same | j13-6 | Berlin, he/him, wealthy | follows, keeps papers |
| J11 | TEST SETUP feeling specialist: emotional depth, composure, imagination and presence at 90, the other seven at 49 (the same 703) | j13-5 | Tokyo, she/her, comfortable | follows, chooses playing, keeps papers |
| J12 | TEST SETUP voice-and-body specialist: vocal, physical, memory and presence at 90, the other seven at 49 (the same 703) | j13-6 | Berlin, he/him, wealthy | follows, chooses playing, keeps papers |
| J13 | TEST SETUP mastered: every ability and technique at full, stamina at its full for the age | j13-7 | New York, they/them (an actress), wealthy | attentive, chooses playing, keeps papers |
| J14 | TEST SETUP mastered, the same | j13-8 | Seoul, she/her, modest | attentive, chooses playing, keeps papers |
| J15 | as made, neglects the coursework (missed work) | j13-9 | Los Angeles, she/her, wealthy | neglect |
| J16 | as made, neglects the coursework (missed work) | j13-10 | Reykjavík, he/him, scraping | neglect |
| J17 | as made, neglects until the term's first coursework warning, then keeps up | j13-11 | Toronto, they/them (an actor), wealthy | neglect, then attentive from "A Word On Your Coursework", keeps papers |
| J18 | as made, neglects the first term, then keeps up from its concern | j13-12 | Houston, he/him, nothing | neglect, then attentive from "A Notice Of Academic Concern", keeps papers |
| J19 | as made, a family with nothing (financial restriction) | j13-13 | Auckland, she/her, nothing | attentive, papers not kept |
| J20 | as made, a scraping family, sleeps through four meetings of Text Analysis I (DRAM 163b) in the first spring, asks to repeat the year when it's offered, asks the aid office's review when it's offered, and pays the Yale account only once a hold has come (missed work, a financial hold) | j13-14 | Paris, he/him, scraping | attentive besides, keeps papers |
| J21 | TEST SETUP health: the flu through the game's own care on 15 October and 15 February each year, and an everyday fall on 1 March (`careFor`, `mayHurt`, as `tools/lives.ts`'s pressure profile); calls in sick when ill on a class day | j13-15 | Mexico City, she/her, scraping | attentive, keeps papers |
| J22 | TEST SETUP health: two stays in hospital recorded in October 2026 and the student in a third for six weeks, as `tools/scenarios.ts mandatory`; gives notice of return and registers again when asked | j13-16 | Dublin, they/them (an actress), wealthy | attentive, keeps papers |

**The brief's kinds, each on two seeds or more:** beginners J01, J02 (and J03 to J08 as made); balanced generalists J09,
J10; specialists with different strengths J11 (feeling) and J12 (voice and body), each on its generalist's seed and
budget, so each pair compares one thing; mastered J13, J14; follows J03, J06, J09 to J12; partly J04, J07; ignores J05,
J08 (J03 to J05 and J06 to J08 are each one seed and one creation, so the three players differ only in how they take the
advice); missed work J15 to J18 and J20; financial restriction J16, J18, J19, J20 (and J20's hold); health interruption
J21, J22. Recovery from a setback through gameplay: J17, J18, J20, J22, and J21's illnesses.

### Expected Outcomes

The school's rules these rest on: a term's review steps the standing down one (good to concern, concern to warning,
warning to dismissal) where attendance is under its floor, growth is behind the class for the room, the stage work fell
short, half or more of the term's pieces were Unready or not shown, or a course was failed; and restores good standing
where none of these is short (`evaluate`, `src/engine/systems/school.ts`). The coursework warning comes once a term, once
six pieces are due and the unready share reaches 35% (`termWarning`, `TERM_CHECK`, `src/engine/systems/coursework.ts`).
Commencement is Monday 21 May 2029 for the class of 2029 and Monday 20 May 2030 for the class of 2030. In brief 11's and
12's runs, 20 attentive lives on other seeds all graduated, four with one term of concern (remedied the next term), none
with a warning; the four autopilot lives were dismissed at the third review.

- **J01, J02 to J14, J19, J21:** each graduates at Commencement, 21 May 2029, standing good at the last review; at most
  one term of concern, remedied by the next review; no warning, no hold, no late fee.
  - **J02, the low beginner:** the same outcome, with more Unready pieces in the first year than J01's. Its ceiling stays
    as admitted while its levels are set lower, so it has more room and should grow faster than the class. A second term
    of concern in the first year wouldn't be a defect; a warning would be a surprise worth reading.
  - **J03 to J05, J06 to J08 (follows, partly, ignores):** the same school outcome for all three on a seed, training being
    beyond what the school asks. The inputs the advice named first rise more for the follower than for the ignorer, and
    the ignorer's favorite more for the ignorer than for the follower. Partly lies between on both. The follower's own last
    twelve pieces, judged again without the draw at each player's final levels (`replayAs`), come out at least as high at
    the follower's as at the ignorer's. The advice is about that work, so this is the falsifiable claim. The ignorer's
    advice may name the same input week after week; that's justified while the input hasn't moved.
  - **J09 to J12 (generalists and specialists, one budget):** each graduates. On pieces whose inputs are the specialist's
    strengths, the specialist's work is above its generalist's on the same seed; on pieces reading its 49s, below. The
    specialist's 90s stay above its 49s at the end, since training doesn't erase a weakness in three years. The advice
    names the specialist's weaker inputs, not its 90s. The ways of playing it previews differ by named fit or grain.
  - **J13, J14 (mastered):** each graduates. A piece shown with every part complete and the day sufficient is judged at
    mastery (`WorkRecord.mastery`, overall 100), and where one isn't, its first limit is preparation, condition, fit or
    suitability, never an ability or technique. Growth at the reach is "in line with" the class (`ROOM_LEAST`). The advice
    says every input the work read is full where that's so (`allFull`, `src/engine/systems/next-steps.ts`).
- **J15, J16 (neglect):** dismissed at the third review, Friday 10 December 2027, at 17:00. Before that, a concern in
  December 2026 and a warning in April 2027, each review preceded in its term by "A Word On Your Coursework". Every notice
  says what was short and what follows. After the dismissal nothing of the school's is on the calendar. J16's F-1 status
  ends with the dismissal, with no grace (`STATUS_GRACE_DAYS.dismissed`), and OPT is refused "OPT follows a degree
  completed, and you left without it.". J15, a citizen, is refused OPT as a citizen. Neither is a defect: the game must
  explain and apply it.
- **J17 (neglect until warned):** warned in the first term (six or more pieces due, all Unready). Kept up from then, the
  first term's review is good, the share under half. It graduates on 21 May 2029.
- **J18 (neglect for a term):** a concern at the first review, Friday 11 December 2026, stating the coursework short.
  Kept up from then, the second review is good and restores good standing. It graduates on 21 May 2029. With the nothing
  family's $40 at the start, the first term's living-expense scholarship comes on the first day
  (`TERM_STARTS_2026_27.fall`), and the bank is never left unable to pay what's due.
- **J19 (nothing family, papers not kept):** graduates on 21 May 2029. The scholarship comes each term and meets the Yale
  Health plan, with 14% of its taxable part withheld for the IRS (`NONRESIDENT_SCHOLARSHIP_RATE`). With no OPT applied
  for, the F-1 status ends sixty days after the program's end. After that the marketplace refuses or ends cover
  (`lawfullyPresent`).
- **J20 (missed meetings, a repeat, a hold):** Text Analysis I is failed at the spring review of 2027 for the meetings
  missed unexcused, the standing steps to concern, and its notice names the course and the repeat. The repeat is asked
  and granted, and the first year is played again with the class of 2030. Its seventh and eighth enrolled terms are past
  the six the tuition scholarship supports and are billed (`termSupport`, `billUnsupportedTerm`). Left unpaid past its
  thirty days, a bill brings a hold and a $125 late fee, and its notice says how to pay. Paid on the hold, the hold
  lifts, and registration is done again where the term began under it. It graduates at Commencement, 20 May 2030. What
  the aid office's review decides isn't predicted; it's recorded.
- **J21 (illness and injury):** graduates on 21 May 2029. Each illness lowers condition and energy by its toll. A class
  day called in sick is excused. Work judged while ill or hurt is recorded so and comes out lower than the same student's
  well work, by a condition limit.
- **J22 (stays in hospital):** Yale Health's assessment leads to the dean's mandatory medical leave, as
  `tools/scenarios.ts mandatory` played it on other seeds. Notice of return is given when the leave allows it, and
  registration is done again on return. With the class of 2030, it graduates at Commencement, 20 May 2030. While on the
  leave, nothing of the school's is paid or billed.

## The Ten Checks, What Each Reads, And What Fails It

Each is worked out by the harness from the journey's record and its final save, and passed or failed with its evidence.

1. **Creation choices affect the intended state.**
   - **Reads at creation:** the bank's opening balances by the family (`WEALTH_PROFILE`), need (`hasNeed`), citizenship
     and the F-1 visa (`startingDocuments`), discipline from conscientiousness and composure from emotional stability
     (`attributesOf`, `derivedAbilities`), the performer title from the pronouns, and the genres and traits kept.
   - **Reads at the first term's start:** a living-expense scholarship posted where there's need, and the Yale Health plan
     paid from the bank where there isn't.
   - **The falsifiability test, at creation only:** the same seed made again with one choice changed (the family across
     the line of need, conscientiousness up 20, the home across the US border, he/him for she/her) must change need,
     discipline by 10, the visa and the title, and nothing else asked of it.
   - **Fails** on any of these not as the rule says, or a changed choice that changes nothing.
2. **Classes, preparation, rehearsal, interpretation and showings connect.**
   - **Each showing:** every coursework showing has exactly one work record at its moment, with its band.
   - **Preparation:** for the last piece shown in each term, its record judged again with its preparation at nothing comes
     out lower, and with every part complete no lower, so the showing reads the preparation it was given. A neglect
     journey's pieces are already at nothing, and must come out higher complete.
   - **Interpretation:** a table-work answer and a way of playing chosen before a showing are on its record (`fit`,
     `grain`, `extraPrep`); a way chosen is rehearsed in by the work on its feet.
   - **Classes and rehearsal:** attended class days put class growth on the development history; a part cast has its
     calls kept and its nights recorded.
   - **Fails** on a showing without its record, a record whose band isn't the showing's, preparation the judge doesn't
     read, or a choice made and absent from the record.
3. **Attributes and genres develop and influence applicable work.**
   - **Development:** every ability at creation and at the end, and each fall, with its cause from the development
     history. An ability falling for no recorded cause fails.
   - **Influence:** the journey's last twelve pieces judged again at the levels it began with come out lower wherever an
     ability they read rose, and never higher (`replayAs`).
   - **Genres:** what the journey met (its plays, its scenes' plays) is known better at the end. A genre it never met is
     known no better, and a step on work in a known genre goes faster (`genreSpeed`) than the same step on an unknown one.
   - **Fails** on development that the work doesn't read, or knowledge of a genre never met.
4. **Advice responds to progress and changing circumstances.**
   - **Reads, weekly:** the first recommendation's target, its level and forecast, its standing and next.
   - **Fails:** the same target with the same words for more than four weeks while its level or forecast moved (stale);
     an input at full named first; or a follower's first target never changing while the follower raises it past its
     forecast's level.
   - **Changing circumstances:** with work judged ill, hurt or unprepared, the attention line says preparation or
     condition, or a recommendation says what to do differently. This is recorded each time it applies.
5. **Health, stamina and energy stay distinct and interact correctly.**
   - **Reads, each morning at nine:** energy, stamina (fitness), condition and stress; each illness and injury.
   - **Fails:**
     - a day's energy change mirrored by stamina (the daily changes correlating at 0.9 or more);
     - stamina moving by more than its own rules allow in a day;
     - an illness with no toll on condition, or a toll on stamina;
     - a class day in hospital, laid up or called in sick that isn't excused;
     - work judged while ill not recorded as ill.
6. **Money, school charges, holds and payments reconcile.**
   - **Reads, at every reload and at the end:** the ledger's audit and the save's laws (`breaches`); each term's
     scholarship, health plan, bills, late fees and payments by memo; the Yale account's balance and the hold.
   - **Fails:**
     - an unbalanced entry or a breach;
     - a term's scholarship or plan posted twice or not at all;
     - a hold without a sum owed past its due date, or one left after it was paid;
     - a payment that isn't on both sides.
7. **Papers and document status affect the appropriate actions.**
   - **Reads, each month:** each document's kind, status and expiry; whether a photo ID is in force; a bank's refusal of a
     new customer (`openRefusal`); OPT's refusal (`optRefusal`); work authorization and status; and cover after the
     school.
   - **Fails:**
     - the bank asking for a photo ID while one is in force, or not asking while none is;
     - OPT refused for a graduate in its window, or allowed to a citizen, before its window, or after leaving without
       the degree;
     - a status kept past its grace;
     - a passport applied for and not issued, or the old one left valid beside it.
8. **Warnings arrive consistently with later evaluations.**
   - **Reads:** each "A Word On Your Coursework", "You Missed Classes", "Not Registered", "Not Passed" and standing
     notice, and the term's review.
   - **Fails:**
     - a review stepping the standing down for coursework with no coursework warning earlier in its term;
     - a warning whose count is above the review's;
     - a concern or warning whose next review doesn't do what its notice said (remedied to good, or a step down);
     - a dismissal with no warning before it, unless the faculty's review of Fails;
     - a notice's named cause that isn't among the parts short on the pieces it counts.
9. **Term progression and the school's endpoint work.**
   - **Reads:** each term begun, each review, the term notices, Commencement or the conferral, and the calendar after the
     end.
   - **Fails:**
     - a term begun twice or out of order;
     - a review missing or doubled;
     - the degree at a time other than the rule's, or given to a student not in standing;
     - anything of the school's done or pending after the end;
     - the standing changing after the end.
10. **Saving, exiting, reloading and continuing preserve the journey.**
    - **Reads:** at every reload, the save serialised before it and the life opened from it, serialised again; the
      kept work records judged again from their own inputs (`replay`).
    - **Fails:** a single byte different, a kept result that doesn't replay to its own figure, or anything thrown.

## Continuity And Freshness, Across The Journeys

Recorded for every journey and summed across them, each repetition with its count and whether it stays justified.
- **Completed stays completed:** a piece shown, a course passed or failed, a credit, an orientation task, a document
  issued. Each is never undone by a term, a reload or a part's boundary; one that is fails.
- **Once:**
  - each term's begin notice, review notice, scholarship and plan;
  - each casting's notice;
  - the coursework warning, at most once a term;
  - Commencement;
  - every scheduled item done at most once.
  Two notices the same in title and body within a term are listed and read; one that shouldn't repeat fails.
- **Advice acknowledges change:** a week whose first recommendation's input moved must say something different from
  the week before. A week where nothing moved may say the same, counted as justified.
- **Repeated feedback reflects the current state:** a coursework note given again (`recurring`) must be on a part short
  on the piece it's given on, or a choice unsupported there.
- **Interpretations:** at each scene a journey that chooses its playing comes to, every way's preview, and the fit or
  grain each names. A difference with no named reason fails.
- **Variety:** distinct coursework templates, scenes, plays cast in, practice exercises, classmates' moments and advice
  targets. The longest run of one in a row, and whether the catalog had another to give.
- **Repetition disguised by words:** advice and notices compared with their figures and dates taken out. The same words
  over a changed state, or new words over an unchanged one, are each counted and read.

Nothing in the advice is changed to make a count smaller (section 6: "Do not rotate to inferior advice").

## Focused Scenarios

For branches the complete journeys above aren't expected to reach naturally, each played through the same harness and
commands from a start that's TEST SETUP where it says so:
- **F1 papers:** an international student whose passport runs out in the first fall (TEST SETUP: its expiry set to 1
  October 2026, the visa left as issued). Expected:
  - the bank asks for a photo ID while none is in force;
  - Passport And ID's application is taken, its fee paid from the bank, and the passport issued after its days;
  - the old one cancelled, and the bank's ask gone.
  Played whether or not a journey's passport runs out on its own, which some may, as an issue is drawn across its term.
- **F2 money:** a student with no need whose bank can't meet the spring term's Yale Health plan (TEST SETUP: the checking
  account emptied the day before). Expected:
  - the plan owed and said so, not dropped;
  - paid the first day there's money (TEST SETUP: $3,000 from family a week later);
  - the ledger balanced throughout.
- **F3 and after, as found:** a financial, document or health branch that turns out unreached by every journey, J20's
  hold included, gets its own, written here before it's run.

## What Counts As Done

Every journey run to its end in parts under ten minutes, each part's output in `journeys/`, the ten checks worked out on
each, the focused scenarios, and the continuity and freshness record, all in `journeys-result.json`. A defect found is
fixed, with a regression test labeled as the house does, and every journey it could touch run again. Nothing judged is
moved unless a defect demands it, and if it does, `RULESET` and `docs/ENGINE-MODEL.md` move with it and the result says
so. The commands and seeds for the coordinator to repeat on the tested commit are in the result.
