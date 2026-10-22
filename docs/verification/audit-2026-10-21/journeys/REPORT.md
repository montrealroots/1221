# Brief 20's Journeys: Eight Fixed-Seed Lives From Creation Into The Career, And The Older Saves (J1 To J5)

The journeys worker's record for brief 20's section 5 (`../criteria.md`, items J1 to J5, and its table The Fixed Seeds
And Their Profiles, chosen before any journey ran). Played on branch `b20-journeys` from `12c04ee1`, with the runner
`tools/b20-journeys.ts`; nothing in `src/` changed. Every life was played through public commands and the clock only;
the one thing set by hand is labeled TEST SETUP below. Each journey's record is `<seed>.json` here, its career transcript
`<seed>-career.txt` (every notice and question as it came, each stop and how it was answered, each command pressed, from
the first hour the career player acted), and each part's line `<seed>-p<N>.json`; `table.json` is the table across them.

## What Was Run

- **The runner** is `tools/b20-journeys.ts`, a file of its own rather than more journeys in `tools/journeys.ts`, so that
  brief 13's journeys, their parts and their records stay playable as they were. It plays the School with brief 13's
  school player, imported from `tools/journeys.ts` unchanged (its hour, its papers kept, its record and its ten checks),
  and the career with brief 19's players from `tools/career-player.ts` (`graduatingActor`, `unsignedActor`, the clock
  moved as the top bar moves it, every stop answered Go). `tools/journeys.ts` changed in two ways: it exports what the
  runner imports and runs its own main only when a journey is named; and its check 7 now knows an OPT ended for its days
  without work (F8 below).
- **Each life** was made from creation's own choices (`newLifeFrom`, as the table gives them), played through the School
  and on into the career to the first of the month at least nine months past the School's end, in parts each under ten
  minutes (the longest 273 s for a new life, 343 s for an older save), its save and record kept between parts outside
  the repository.
- **J4:** at each transition (creation; each term's review; each calendar year's end; the School's end; a signing; the
  first booking, the first work day and the first pay) the life was saved and opened, the state after compared with the
  state before to the byte, and the life went on from the opened save; brief 13's reload every thirty days at noon went
  on beside them. And in each life, the first time a partner rehearsal was booked ahead in the School, and in the career
  the first time an audition was set, an offer stood and a union's bill was unsettled, the life was copied by a save and
  an opening, both copies were played fourteen days by the same player, and the two ends were compared to the byte.
- **D2's credit record** (the coordinator's addition): at each transition and each year's end, every open card's name and
  limit, the score, the past twelve months' income (`earnings.months`, the twelve months before the current one) and the
  money in the bank (positive balances of open checking and savings accounts): `b20.credit` in each JSON, and the money
  table below.
- **The older saves:** each of the seven in `tests/fixtures/` opened as the game opens one (migrated, its professional
  record built), then played on with brief 13's attentive school player and the career player that takes whatever comes,
  to three months past the School's end. **Brief 19's lives** on `v1-21` and `v1-7`, and its two V16 lives, were played
  again with their own script (`docs/verification/career-2026-10-20/playthroughs/play.ts lives`).

## The Seeds And The Profiles As Made

Creation made every profile as the table gives it: every city is in its geography (`us-il-chicago` for Chicago) and every
genre on its list. What the table leaves open, or names in words the players don't use, and what was used:

- **b20-8's illness:** creation makes nobody ill. TEST SETUP: the flu on 15 October 2026 at 9 AM, given through the game's
  own care (`careFor`, as brief 13's J21), and the player calls in sick on a morning they're ill. Every life also met
  illnesses and injuries of the game's own.
- **b20-4, "ignores the coursework's advice":** brief 13's `ignores` player, who does the coursework as the attentive
  player does, leaves the way of playing open whatever the preview advises, and practices its own strongest ability rather
  than What To Work On's advice, in the School and after it.
- **b20-5, "neglects the coursework until warned":** brief 13's J17 player: no evening work and no free hour on the
  coursework until the notice A Word On Your Coursework (it came on 14 September 2026), then attentive.
- **b20-7, "misses a course's meetings":** brief 13's J20 player: four meetings of Text Analysis I (DRAM 163b) slept
  through in the first spring (14, 21 and 28 January and 11 February 2027), otherwise attentive; asks to repeat the year
  and for the aid office's review when offered; pays the Yale account on a hold.
- **The career player**, where the table names none (b20-4, b20-5, b20-7, b20-8), is the one that takes whatever comes:
  `graduatingActor` (the faculty's two showcase scenes, the portfolio once the School posts recorded work, the follow-up's
  approach answered, the agreement accepted if offered, SAG-AFTRA joined when it can be), and after the School a
  submission to every open call too (`unsignedActor`). b20-3 is the same. b20-1 ("represented if offered") plays the same
  but stops submitting itself once represented; b20-2 ("unsigned") does nothing of the career until the School ends and
  never answers the agent; b20-6 declines the agreement if offered and submits itself after the School.
- Every life is Ada Cole, as brief 13's were.

What creation made, read back from the state (`creation` in each JSON):

| Seed | Table | Made: family, need, citizenship, F-1, title | Genres loved | Bank and card at creation |
|---|---|---|---|---|
| `b20-1` | she/her, born New York, modest, US citizen; attentive, then represented if offered | none, need True, us, F-1 False, actress | drama, comedy | $12,282; Chase Freedom Unlimited $6,522; score 690 |
| `b20-2` | he/him, born New York, nothing, US citizen; attentive, then unsigned | none, need True, us, F-1 False, actor | thriller | $43; no card; score 520 |
| `b20-3` | they/them, actor, born Toronto, scraping, Canadian on an F-1; attentive, then whatever comes | none, need True, ca, F-1 True, actor | musical | $1,674; Chase Freedom Unlimited $1,630; score 610 |
| `b20-4` | she/her, born London, comfortable, British on an F-1; ignores the coursework’s advice | none, need True, uk, F-1 True, actress | period_drama | $65,217; Chase Freedom Unlimited $21,739; score 748 |
| `b20-5` | he/him, born Mexico City, modest, Mexican on an F-1; neglects the coursework until warned | none, need True, mx, F-1 True, actor | horror | $12,282; Chase Freedom Unlimited $6,522; score 690 |
| `b20-6` | she/her, born Chicago, wealthy, US citizen; attentive, declines the agent | wealthy, need False, us, F-1 False, actress | romance | $505,434; Chase Freedom Unlimited $65,217; score 795 |
| `b20-7` | he/him, born Los Angeles, scraping, US citizen; misses a course’s meetings | none, need True, us, F-1 False, actor | action | $1,674; Chase Freedom Unlimited $1,630; score 610 |
| `b20-8` | they/them, actress, born Dublin, modest, Irish on an F-1; ill in the first term, then attentive | none, need True, ie, F-1 True, actress | comedy, fantasy | $12,282; Chase Freedom Unlimited $6,522; score 690 |

## Each Life's Path

Every one of the eight graduated; none was represented; each was played to its end with no error thrown; brief 13's ten
checks and the five coherence checks all held at the end of each (after F8's correction to check 7).

| Seed | The School | The agent (Thomas Ashgrove, Halberd Talent) | Work | Papers |
|---|---|---|---|---|
| `b20-1` | graduated 2029-05-21, every review good | asked the School to pass on a request to meet (11 May 2029); met 25 May; passed 30 May | Ivy in Paper Moons (student film, pay deferred), shot 3 to 5 Sep 2029, credited; auditions for Hester Vane, Jess, Sam not cast | US citizen; passport renewed (applied 21 Jun 2029) |
| `b20-2` | graduated 2029-05-21, every review good | the follow-up's introduction left unanswered (the unsigned player) | Felix in Paper Moons, 10 to 12 Sep 2029 (deferred); Sam in Last Bus To Eastview, 4 to 5 Feb 2030, $250.00 gross, $230.87 paid 7 Feb | US citizen; no passport made; the driver's license ran out 14 Jun 2028 and nothing was renewed |
| `b20-3` | graduated 2029-05-21, every review good | introduction; materials sent 11 May 2029; passed 25 May | none: Felix in Paper Moons offered twice (22 Nov 2029, 31 Jan 2030), each declined for no permission to work | F-1; OPT applied 2 Mar 2029, approved 31 May; ended 30 Aug 2029 for 91 days without work; out of status that day |
| `b20-4` | graduated 2029-05-21, every review good | introduction; sent; passed 25 May 2029 | Sam in Last Bus To Eastview, 9 to 10 Jul 2029 under OPT, $250.00 gross, $225.00 paid 12 Jul; Hester Vane and Ivy offered (27 Dec 2029, 3 Jan 2030), declined for no permission | F-1; OPT 31 May 2029; ended 6 Sep 2029 (96 days without work, 2 worked); out of status |
| `b20-5` | graduated 2029-05-21, every review good; Unready 15 of 46 pieces in the first term, before the word | introduction; sent; no answer by 22 Jun 2029 | none: Sam and Felix offered (1 and 8 Nov 2029), declined for no permission | F-1; OPT 31 May 2029; ended 30 Aug 2029 (91 days without work); out of status |
| `b20-6` | graduated 2029-05-21; concern at the fifth review (Woyzeck), good at the sixth | introduction; sent; passed 25 May 2029: no agreement was offered, so the life never declined one | Ivy in Paper Moons, 10 to 12 Sep 2029 (deferred); Jess in Static On Route 9 (SAG-AFTRA Ultra Low Budget), 31 Dec 2029 to 3 Jan 2030, $1,120.00 gross, $1,034.32 paid 10 Jan | US citizen |
| `b20-7` | concern at the second review (Text Analysis I not passed: 9 of 13 classes), repeated the first year from Fall 2027, graduated 2030-05-20; two terms of tuition billed, two holds, each paid the day it came | introduction; sent; passed 24 May 2030 | Felix in Paper Moons, 14 to 16 Oct 2030 (deferred); Sam in Last Bus To Eastview, 20 to 21 Jan 2031, $230.87 paid 23 Jan | US citizen |
| `b20-8` | graduated 2029-05-21, every review good; the TEST SETUP flu 15 to 19 Oct 2026, three mornings called in sick, two class days excused | introduction; sent; no answer by 22 Jun 2029 | Jess in Static On Route 9, 6 to 9 Aug 2029 under OPT, $1,120.00 gross, $1,008.00 paid 16 Aug | F-1; OPT 31 May 2029; ended 6 Sep 2029 (94 days without work, 4 worked); out of status |

Every life joined Equity at the degree (`equity.how` degree, $600.00 down taken at the first billing); none became
SAG-AFTRA-eligible (the game counts neither student films nor Ultra Low Budget work toward it, and says so).

## Money At Each Year's End, And The Credit Record (D2)

At creation (or the opening), each year's end, the School's end and the journey's end; every other transition's reading is in each JSON's `b20.credit`. Bank: positive balances of open checking and savings. Cards: every open card's name and limit. Income: the sum of `earnings.months` over the twelve months before the current one.

| Seed | Moment | Bank | Cards | Score | Income |
|---|---|---|---|---|---|
| `b20-1` | 2026-08-24 creation | $12,282 | Chase Freedom Unlimited $6,522 | 690 | $0 |
| `b20-1` | 2027-01-01 the end of 2026 | $25,122 | Chase Freedom Unlimited $6,522 | 702 | $1,656 |
| `b20-1` | 2028-01-01 the end of 2027 | $51,609 | Chase Freedom Unlimited $9,391 | 738 | $3,451 |
| `b20-1` | 2029-01-01 the end of 2028 | $79,418 | Chase Freedom Unlimited $13,523 | 774 | $3,313 |
| `b20-1` | 2029-05-21 the School’s end: graduated | $92,797 | Chase Freedom Unlimited $16,228 | 789 | $3,313 |
| `b20-1` | 2030-01-01 the end of 2029 | $78,302 | Chase Freedom Unlimited $19,474 | 810 | $1,656 |
| `b20-1` | 2030-03-01 the journey’s end | $73,363 | Chase Freedom Unlimited $19,474 | 816 | $966 |
| `b20-2` | 2026-08-24 creation | $43 | no card | 520 | $0 |
| `b20-2` | 2027-01-01 the end of 2026 | $13,558 | no card | 530 | $1,656 |
| `b20-2` | 2028-01-01 the end of 2027 | $39,198 | no card | 554 | $3,450 |
| `b20-2` | 2029-01-01 the end of 2028 | $66,832 | no card | 578 | $3,312 |
| `b20-2` | 2029-05-21 the School’s end: graduated | $81,142 | no card | 586 | $3,312 |
| `b20-2` | 2030-01-01 the end of 2029 | $72,695 | no card | 602 | $1,656 |
| `b20-2` | 2030-03-01 the journey’s end | $68,028 | no card | 606 | $1,216 |
| `b20-3` | 2026-08-24 creation | $1,674 | Chase Freedom Unlimited $1,630 | 610 | $0 |
| `b20-3` | 2027-01-01 the end of 2026 | $12,274 | Chase Freedom Unlimited $1,630 | 622 | $1,656 |
| `b20-3` | 2028-01-01 the end of 2027 | $34,967 | Chase Freedom Unlimited $1,630 | 658 | $3,450 |
| `b20-3` | 2029-01-01 the end of 2028 | $57,917 | Chase Freedom Unlimited $1,630 | 694 | $3,312 |
| `b20-3` | 2029-05-21 the School’s end: graduated | $68,641 | Chase Freedom Unlimited $1,956 | 709 | $3,312 |
| `b20-3` | 2030-01-01 the end of 2029 | $62,750 | Chase Freedom Unlimited $2,347 | 730 | $1,656 |
| `b20-3` | 2030-03-01 the journey’s end | $61,430 | Chase Freedom Unlimited $2,347 | 736 | $966 |
| `b20-4` | 2026-08-24 creation | $65,217 | Chase Freedom Unlimited $21,739 | 748 | $0 |
| `b20-4` | 2027-01-01 the end of 2026 | $76,711 | Chase Freedom Unlimited $21,739 | 760 | $1,658 |
| `b20-4` | 2028-01-01 the end of 2027 | $99,152 | Chase Freedom Unlimited $31,304 | 796 | $3,455 |
| `b20-4` | 2029-01-01 the end of 2028 | $121,745 | Chase Freedom Unlimited $45,078 | 832 | $3,317 |
| `b20-4` | 2029-05-21 the School’s end: graduated | $132,656 | Chase Freedom Unlimited $54,094 | 847 | $3,317 |
| `b20-4` | 2030-01-10 the end of 2029 | $81,569 | Chase Freedom Unlimited $64,913 | 850 | $1,909 |
| `b20-4` | 2030-03-01 the journey’s end | $81,025 | Chase Freedom Unlimited $64,913 | 850 | $1,218 |
| `b20-5` | 2026-08-24 creation | $12,282 | Chase Freedom Unlimited $6,522 | 690 | $0 |
| `b20-5` | 2027-01-01 the end of 2026 | $23,268 | Chase Freedom Unlimited $6,522 | 702 | $1,656 |
| `b20-5` | 2028-01-01 the end of 2027 | $46,143 | Chase Freedom Unlimited $9,391 | 738 | $3,451 |
| `b20-5` | 2029-01-01 the end of 2028 | $69,321 | Chase Freedom Unlimited $13,523 | 774 | $3,313 |
| `b20-5` | 2029-05-21 the School’s end: graduated | $79,162 | Chase Freedom Unlimited $16,228 | 789 | $3,313 |
| `b20-5` | 2030-01-01 the end of 2029 | $66,120 | Chase Freedom Unlimited $19,474 | 810 | $1,656 |
| `b20-5` | 2030-03-01 the journey’s end | $64,800 | Chase Freedom Unlimited $19,474 | 816 | $966 |
| `b20-6` | 2026-08-24 creation | $505,434 | Chase Freedom Unlimited $65,217 | 795 | $0 |
| `b20-6` | 2027-01-01 the end of 2026 | $503,683 | Chase Freedom Unlimited $65,217 | 807 | $1,671 |
| `b20-6` | 2028-01-01 the end of 2027 | $498,706 | Chase Freedom Unlimited $93,912 | 843 | $3,491 |
| `b20-6` | 2029-01-01 the end of 2028 | $493,604 | Chase Freedom Unlimited $135,233 | 850 | $3,353 |
| `b20-6` | 2029-05-21 the School’s end: graduated | $489,985 | Chase Freedom Unlimited $162,280 | 850 | $3,353 |
| `b20-6` | 2030-01-01 the end of 2029 | $69,148 | Chase Freedom Unlimited $194,736 | 850 | $1,684 |
| `b20-6` | 2030-03-01 the journey’s end | $67,800 | Chase Freedom Unlimited $194,736 | 850 | $2,107 |
| `b20-7` | 2026-08-24 creation | $1,674 | Chase Freedom Unlimited $1,630 | 610 | $0 |
| `b20-7` | 2027-01-01 the end of 2026 | $13,765 | Chase Freedom Unlimited $1,630 | 622 | $1,656 |
| `b20-7` | 2028-01-01 the end of 2027 | $40,523 | Chase Freedom Unlimited $1,630 | 658 | $3,450 |
| `b20-7` | 2029-01-01 the end of 2028 | $68,186 | Chase Freedom Unlimited $1,630 | 694 | $3,312 |
| `b20-7` | 2030-01-01 the end of 2029 | $74,563 | Chase Freedom Unlimited $2,347 | 730 | $3,450 |
| `b20-7` | 2030-05-20 the School’s end: graduated | $63,742 | Chase Freedom Unlimited $2,816 | 745 | $3,450 |
| `b20-7` | 2031-01-01 the end of 2030 | $55,771 | Chase Freedom Unlimited $3,379 | 766 | $1,656 |
| `b20-7` | 2031-03-01 the journey’s end | $50,828 | Chase Freedom Unlimited $3,379 | 772 | $1,216 |
| `b20-8` | 2026-08-24 creation | $12,282 | Chase Freedom Unlimited $6,522 | 690 | $0 |
| `b20-8` | 2027-01-01 the end of 2026 | $23,072 | Chase Freedom Unlimited $6,522 | 702 | $1,518 |
| `b20-8` | 2028-01-01 the end of 2027 | $45,877 | Chase Freedom Unlimited $9,391 | 738 | $3,451 |
| `b20-8` | 2029-01-01 the end of 2028 | $68,467 | Chase Freedom Unlimited $13,523 | 771 | $3,313 |
| `b20-8` | 2029-05-21 the School’s end: graduated | $78,835 | Chase Freedom Unlimited $16,228 | 789 | $3,313 |
| `b20-8` | 2030-01-01 the end of 2029 | $68,737 | Chase Freedom Unlimited $19,474 | 810 | $2,776 |
| `b20-8` | 2030-03-01 the journey’s end | $68,147 | Chase Freedom Unlimited $19,474 | 816 | $2,086 |
| `journey-j01-year-one-8283f80c` | 2027-06-01 opened | $501,999 | Chase Freedom Unlimited $78,260 | 822 | $3,344 |
| `journey-j01-year-one-8283f80c` | 2028-01-01 the end of 2027 | $499,201 | Chase Freedom Unlimited $93,912 | 843 | $3,491 |
| `journey-j01-year-one-8283f80c` | 2029-01-01 the end of 2028 | $494,620 | Chase Freedom Unlimited $135,233 | 850 | $3,353 |
| `journey-j01-year-one-8283f80c` | 2029-05-21 the School’s end: graduated | $491,111 | Chase Freedom Unlimited $162,280 | 850 | $3,353 |
| `journey-j01-year-one-8283f80c` | 2029-09-01 the journey’s end | $75,589 | Chase Freedom Unlimited $162,280 | 850 | $3,353 |
| `journey-j01-last-term-8283f80c` | 2029-03-01 opened | $492,523 | Chase Freedom Unlimited $135,233 | 850 | $3,215 |
| `journey-j01-last-term-8283f80c` | 2029-05-21 the School’s end: graduated | $491,106 | Chase Freedom Unlimited $162,280 | 850 | $3,353 |
| `journey-j01-last-term-8283f80c` | 2029-09-01 the journey’s end | $77,263 | Chase Freedom Unlimited $162,280 | 850 | $6,506 |
| `journey-j01-degree-8283f80c` | 2029-08-04 opened | $491,657 | Chase Freedom Unlimited $162,280 | 850 | $3,353 |
| `journey-j01-degree-8283f80c` | 2029-12-01 the journey’s end | $73,262 | Chase Freedom Unlimited $194,736 | 850 | $2,945 |
| `old-tax-plan-ff837dfa` | 2027-04-18 opened | $3,120 | Chase Freedom Unlimited $78,260 | 816 | $42,780 |
| `old-tax-plan-ff837dfa` | 2028-01-01 the end of 2027 | $0 | Chase Freedom Unlimited $46,017 | 731 | $3,455 |
| `old-tax-plan-ff837dfa` | 2029-01-01 the end of 2028 | $0 | no card | 300 | $3,312 |
| `old-tax-plan-ff837dfa` | 2029-05-21 the School’s end: graduated | $0 | no card | 300 | $3,312 |
| `old-tax-plan-ff837dfa` | 2029-09-01 the journey’s end | $0 | no card | 300 | $3,312 |
| `old-leave-ff837dfa` | 2028-03-12 opened | $496,538 | Chase Freedom Unlimited $93,912 | 849 | $869 |
| `old-leave-ff837dfa` | 2029-01-01 the end of 2028 | $493,184 | Chase Freedom Unlimited $135,233 | 850 | $3,077 |
| `old-leave-ff837dfa` | 2030-01-01 the end of 2029 | $74,968 | Chase Freedom Unlimited $194,736 | 850 | $3,478 |
| `old-leave-ff837dfa` | 2030-05-20 the School’s end: graduated | $70,987 | Chase Freedom Unlimited $233,683 | 850 | $3,464 |
| `old-leave-ff837dfa` | 2030-09-01 the journey’s end | $68,633 | Chase Freedom Unlimited $233,683 | 850 | $6,784 |
| `old-state-plan-086d00ca` | 2028-02-23 opened | $205 | Chase Freedom Unlimited $93,912 | 849 | $3,452 |
| `old-state-plan-086d00ca` | 2029-01-01 the end of 2028 | $0 | no card | 300 | $3,312 |
| `old-state-plan-086d00ca` | 2029-05-21 the School’s end: graduated | $0 | no card | 300 | $3,312 |
| `old-state-plan-086d00ca` | 2029-09-01 the journey’s end | $0 | no card | 300 | $3,312 |
| `old-nonfiler-086d00ca` | 2028-05-24 opened | $495,537 | Chase Freedom Unlimited $112,694 | 850 | $3,491 |
| `old-nonfiler-086d00ca` | 2029-01-01 the end of 2028 | $492,014 | Chase Freedom Unlimited $135,233 | 850 | $3,353 |
| `old-nonfiler-086d00ca` | 2029-05-21 the School’s end: graduated | $479,329 | Chase Freedom Unlimited $162,280 | 850 | $3,353 |
| `old-nonfiler-086d00ca` | 2029-09-01 the journey’s end | $64,349 | Chase Freedom Unlimited $162,280 | 850 | $3,353 |


## The Routes (J3)

Across the eight lives, brief 19's lives on `v1-21` and `v1-7` (played again on this commit, their transcripts the same
line for line as `docs/verification/career-2026-10-20/playthroughs/transcripts/`), and the seven older saves. Each
journey's JSON has its evidence under `routes`, read from its record and transcript.

| Route | Met by | How |
|---|---|---|
| Unsigned | all eight; brief 19's V16 graduate | no agreement in any of the eight; each submitted itself to open calls after the School, 6 to 11 times (6 to 11 auditions, up to 2 callbacks, 1 to 3 offers) |
| Represented | brief 19's `v1-21` (life A); the older saves `journey-j01-last-term` and `old-leave` | none of the eight: the agent passed on six (b20-1 after a meeting on 25 May 2029, the others on their materials) and two had no answer. `journey-j01-last-term` signed on 4 June 2029 and worked Nell in A House On Calder Street through him (ten weeks at $1,051.00, each week's pay held in Halberd Talent's client trust account and passed on less $105.10 commission); `old-leave` signed 3 June 2030 and worked Desk Clerk in The Calloway Files through him |
| Success | b20-2, b20-4, b20-6, b20-7, b20-8 (paid work); b20-1 (a credit, pay deferred) | booked, worked, credited and paid (Path, above); every life also had auditions that went on to a callback or an offer |
| Failure | all eight | not cast after auditions at stated chances of 11% to 50%; the agent passing or not answering; concern (b20-6, b20-7; the older `old-tax-plan` to a warning) |
| Delay | b20-7; the four F-1 lives; brief 19's life A; `old-leave` | b20-7's degree a year late after repeating, with two terms of tuition billed and two holds; OPT applied 2 March 2029 and approved 31 May; life A's meeting moved a week with Ask To Move; `old-leave`'s degree in 2030 after its leave. No audition in the eight was moved with Ask For Another Time: the player moves one only when it clashes, and none did |
| Decline | b20-3, b20-4, b20-5 (offers); brief 19's `v1-7` (the agreement) | each F-1 life declined two offers it couldn't accept for want of permission to work; b20-6 was never offered an agreement, so the life that declines the agent met no agent to decline: only life B (`v1-7`) declined one |
| Interruption | all eight | illness, injury and stays in hospital of the game's own in every life (b20-4 two emergency-room visits and the flu in its first six months); b20-8's TEST SETUP flu with three sick calls and two class days excused; b20-7's four mornings slept through. No work day was missed in any journey |
| Recovery | all eight; `old-tax-plan`, `old-state-plan` | condition back after each illness (b20-8's flu: 97.6 the morning before, 72.5 at its start, 92.2 a week after its end); standing back to good after concern (b20-6, b20-7) and after a warning (`old-tax-plan`); b20-7's holds lifted on payment |
| Commitments that clash | the older `journey-j01-last-term`, played on to 16 October 2029 | none in the eight. The represented life booked Nell's run (8 PM curtains) and two shoots (7 AM to 6 PM) on the same days: the engine took both, since their hours don't overlap (`bookedClash`); all were worked; the shows on 5 and 11 September, after a shoot day, were judged Unready, the others Working or Strong (`journey-j01-last-term-8283f80c-to-2029-10-16.json`) |
| Little money | the older `old-tax-plan` and `old-state-plan` | none of the eight was ever short after its first hours (F4). The two older saves ran out: bank $0, cards charged off, accounts closed, score 300, "No Money For Food Today" on 620 and 423 days (F9); and the career never began for either (F10) |
| Poor and strong preparation | all eight, in the School | b20-5's neglected first term: 15 of 46 pieces Unready against 4 or 5 for the attentive lives; Strong pieces in every term. In the career the players always prepare the sides to ready, so poor preparation there was met only by brief 19's twins (taped cold, 25.0 Unready, against prepared, 67.7 Strong) |
| Different genre strengths | weakly | the genres each life loves (creation) feed only enjoyment, by design; what's practised comes from the plays and jobs, so seven lives' strongest is drama (40.1 to 58.2) and b20-1's comedy (50.3). Each knows eight genres |
| Fatigue | b20-1, b20-2, b20-4, b20-6, b20-7, b20-8 | every multi-day shoot: readiness 55 to 70 on day one, 28 to 37 on day two, 22 to 23 on day three, day two a band lower, fatigue the first limit from day two (F1) |
| Work authorization, F-1 and OPT | b20-3, b20-4, b20-5, b20-8 | OPT applied in its window, approved 31 May 2029, work done under it (b20-4 two days, b20-8 four), then ended for more than 90 days without work and status with it (F3); offers after it declined for no permission. Nobody worked unauthorized (J5) |

**Not met by any life:** an audition moved for a clash by Ask For Another Time; a work day missed; an agreement declined by
one of the eight; poor preparation in the career (the players never tape or work cold); a SAG-AFTRA membership (no life's
work counted toward it: student films and Ultra Low Budget don't, as the game says).

## Saved And Opened (J4)

- **At the transitions:** 116 of 116 in the eight lives, and 52 of 52 in the older saves, read the same to the byte after
  opening: creation, every term's review, every year's end, every School's end, the two signings (older saves), and each
  first booking, work day and pay.
- **Every opening the records count** (the transitions', brief 13's every thirty days at noon, and each part's start
  from the save the part before left): 490 of 490 in the eight lives, 182 of 182 in the older saves, the same.
- **Straight against reopened:** 31 stretches in the eight lives and 21 in the older saves, each fourteen days from the
  middle of an obligation (14 a partner rehearsal booked ahead, 13 an audition set, 10 an offer standing, 15 a union bill
  unsettled): every one ended the same to the byte both ways, with the same outcomes. The comparison's own fault check
  (`--fault fork`, a point of energy taken from the reopened copy at b20-8's first stretch) read DIFFERENT, at a partner
  part's preparation fourteen days on, so the comparison sees a change that small.
- **The known item the coordinator named** (a life saved and opened before its first genre is practised, piece judged or
  day counted gaining three empty records, `engagement`, `development` and `work`, from migrate's step 92): not met. Each
  life's creation transition read the same, and a probe made a new life (b20-1's choices), saved and opened it at once,
  with and without the runner's creation read first: the same to the byte both times, none of the three records present
  before or after.
- **Played again from creation:** b20-1, made again in a second state directory for the trace below, came to the same
  bank, to the cent, at the School's end ($92,797.03) and at its first work day ($83,660.93).

### By Journey

The transitions; every opening the record counts (transitions, thirty-day reloads, part starts); and the stretches played both ways, each with the obligation it began in the middle of.

| Seed | Transitions (same / all) | Reloads every 30 days (same / all) | Straight against reopened |
|---|---|---|---|
| `b20-1` | 14/14 | 59/59 | 2026-09-01 a rehearsal with a partner booked for 2026-09-01T23:00 on Scene Study: same; 2029-05-21 a union bill due 2030-05-21T14:00: Initiation fee, part 2 of 3: same; 2029-06-06 an audition (in-person) set for 2029-06-11T15:00, Hester Vane in The W: same; 2029-08-09 an offer standing: An Offer For Ivy: same |
| `b20-2` | 15/15 | 60/60 | 2026-09-01 a rehearsal with a partner booked for 2026-09-01T23:00 on Scene Study: same; 2029-05-21 a union bill due 2030-05-21T14:00: Initiation fee, part 2 of 3: same; 2029-06-13 an audition (self-tape) set for 2029-06-17T22:00, Sam in Last Bus To E: same; 2029-08-16 an offer standing: An Offer For Felix: same |
| `b20-3` | 12/12 | 57/57 | 2026-09-01 a rehearsal with a partner booked for 2026-09-01T23:00 on Scene Study: same; 2029-05-21 a union bill due 2030-05-21T14:00: Initiation fee, part 2 of 3: same; 2029-09-05 an audition (in-person) set for 2029-09-10T15:00, Felix in Paper Moons: same; 2029-11-22 an offer standing: An Offer For Felix: same |
| `b20-4` | 15/15 | 60/60 | 2026-09-01 a rehearsal with a partner booked for 2026-09-01T23:00 on Scene Study: same; 2029-05-21 a union bill due 2030-05-21T14:00: Initiation fee, part 2 of 3: same; 2029-06-06 an audition (self-tape) set for 2029-06-10T22:00, Sam in Last Bus To E: same; 2029-12-27 an offer standing: An Offer For Hester Vane: same |
| `b20-5` | 12/12 | 57/57 | 2026-09-17 a rehearsal with a partner booked for 2026-09-18T23:00 on Scene Study: same; 2029-05-21 a union bill due 2030-05-21T14:00: Initiation fee, part 2 of 3: same; 2029-06-27 an audition (in-person) set for 2029-07-02T15:00, Felix in Paper Moons: same; 2029-10-31 an offer standing: An Offer For Sam: same |
| `b20-6` | 15/15 | 59/59 | 2026-09-01 a rehearsal with a partner booked for 2026-09-01T23:00 on Scene Study: same; 2029-05-21 a union bill due 2030-05-21T14:00: Initiation fee, part 2 of 3: same; 2029-07-04 an audition (self-tape) set for 2029-07-08T22:00, Sam in Last Bus To E: same; 2029-08-16 an offer standing: An Offer For Ivy: same |
| `b20-7` | 18/18 | 78/78 | 2026-09-01 a rehearsal with a partner booked for 2026-09-01T23:00 on Scene Study: same; 2030-05-20 a union bill due 2031-05-20T14:00: Initiation fee, part 2 of 3: same; 2030-06-05 an audition (self-tape) set for 2030-06-09T22:00, Jess in Static On Ro: same; 2030-09-19 an offer standing: An Offer For Felix: same |
| `b20-8` | 15/15 | 60/60 | 2026-09-01 a rehearsal with a partner booked for 2026-09-01T23:00 on Scene Study: same; 2029-05-21 a union bill due 2030-05-21T14:00: Initiation fee, part 2 of 3: same; 2029-07-04 an audition (self-tape) set for 2029-07-08T22:00, Jess in Static On Ro: same |
| `journey-j01-year-one-8283f80c` | 8/8 | 36/36 | 2027-09-02 a rehearsal with a partner booked for 2027-09-04T23:00 on A Game Playe: same; 2029-05-21 a union bill due 2030-05-21T14:00: Initiation fee, part 2 of 3: same; 2029-08-01 an audition (self-tape) set for 2029-08-05T22:00, Sam in Last Bus To E: same |
| `journey-j01-last-term-8283f80c` | 7/7 | 12/12 | 2029-03-01 a rehearsal with a partner booked for 2029-03-04T00:00 on Your Showcas: same; 2029-05-21 a union bill due 2030-05-21T14:00: Initiation fee, part 2 of 3: same; 2029-06-13 an audition (self-tape) set for 2029-06-17T22:00, Wren in Gull Season: same; 2029-07-19 an offer standing: An Offer For Nell: same |
| `journey-j01-degree-8283f80c` | 4/4 | 7/7 | 2029-08-04 a union bill due 2029-11-01T13:00: Initiation fee, part 1 of 3, the do: same; 2029-08-18 an audition (in-person) set for 2029-08-20T15:00, Hester Vane in The W: same; 2029-10-17 an offer standing: An Offer For Jess: same |
| `old-tax-plan-ff837dfa` | 9/9 | 39/39 | 2027-04-18 a rehearsal with a partner booked for 2027-04-18T23:00 on A Simulated : same; 2029-05-21 a union bill due 2030-05-21T14:00: Initiation fee, part 2 of 3: same |
| `old-leave-ff837dfa` | 13/13 | 44/44 | 2028-03-12 a rehearsal with a partner booked for 2028-03-13T23:00 on A Choreograp: same; 2030-05-20 a union bill due 2031-05-20T14:00: Initiation fee, part 2 of 3: same; 2030-06-05 an audition (self-tape) set for 2030-06-09T22:00, Ferris in Gull Seaso: same; 2030-06-26 an offer standing: An Offer For Desk Clerk: same |
| `old-state-plan-086d00ca` | 6/6 | 24/24 | 2028-02-24 a rehearsal with a partner booked for 2028-02-27T00:00 on Heightened T: same; 2029-05-21 a union bill due 2030-05-21T14:00: Initiation fee, part 2 of 3: same |
| `old-nonfiler-086d00ca` | 5/5 | 20/20 | 2028-09-10 a rehearsal with a partner booked for 2028-09-10T23:00 on Heightened T: same; 2029-05-21 a union bill due 2030-05-21T14:00: Initiation fee, part 2 of 3: same; 2029-06-06 an audition (in-person) set for 2029-06-11T15:00, Felix in Paper Moons: same |


## Coherent At Each Journey's End (J5)

All five checks held at the end of every journey, the eight and the seven older saves (`coherence` in each JSON, with its
evidence):

- **The School's record against the attributes and genres:** reviews in order; a graduate's courses all settled; every
  genre practised traced to a play the School cast them in (its runs, credits and casting) or a job worked; no genre
  familiar without study; brief 13's development check (no ability fell for no cause, the last pieces better for what
  rose) held.
- **Every account's balance against the sum of its postings** (`Ledger.audit` and the runner's own sum, every account in
  the save): no difference in any journey.
- **The papers against what the life did:** every work day was worked with permission to work in force that hour, read
  when it was logged (the F-1 lives' under OPT: `Employment Authorization, OPT valid`); no work after a life fell out of
  status; no work in term without the School's approval; brief 13's papers check (photo ID, OPT, F-1 status by the rules)
  held once its rule knew OPT's 90 days (F8).
- **Relationships and credits:** classmates' bonds, trust and reliability on their scales; the agent's stage matching the
  agreements (the two signed older saves at represented, with the accepted agreement's id); work through him under an
  agreement on record; every finished screen job and every stage run past its first night credited once.
- **`breaches`:** none, in any journey.

The runner's own first reading of "credits against engagements" was wrong, not the game: it asked a stage job for a
credit once a rehearsal day was worked, and the game gives one at the first night (`ProCredit` 'performed'). Corrected
before these figures (`journey-j01-last-term`'s Nell, in rehearsal at its journey's end, read as a failure until then).

## The Failures And Findings

No journey stopped, threw or breached; every save-and-open read the same. What the journeys found, each with its
evidence and its area. Nothing in `src/` was changed here.

**F1. A half-hour sleep, as the Sleep dialog suggests before an early call, leaves the actor less ready than staying
awake (life; brief 20's D3).** `applySleep` (`src/engine/systems/life.ts`) charges any sleep under six hours as a short
night: (6 - hours) x 1.35 hours of sleep debt, and condition by (effective hours - 5) x 0.9. `suggestedSleep` offers half
an hour at the least (`SHORTEST_SLEEP`) when less than that is left before getting up. Measured from one body (energy
89.8, sleep debt 1.4, condition 90.2): half an hour asleep leaves debt 8.2, condition 86.1, readiness 81.1; half an hour
awake leaves debt 1.6, condition 90.2, readiness 86.4. An hour asleep and an hour awake come out level (85.7 against
85.1). In b20-1's first shoot (replayed with `--trace`, `b20-1-trace-2029-09.json`; times there are UTC): to bed at 11 PM
for the 5 hours the dialog suggested before a 5 AM departure, then at 4 AM and 4:30 AM half an hour each, as the dialog
suggested; those two half-hours took sleep debt from 1.4 to 15.2 and condition from 90.2 to 81.9 before shoot day 1. By
shoot day 3 the debt was 46.3 and condition 64.1. The work: readiness 70, 37, 23 on the three days, judged 67.1 Strong,
60.4 Working, 55.4 Working, fatigue the first limit on day 3. Every multi-day shoot in the eight lives fell the same way:

| Life | Shoot | Day 1 | Day 2 | Day 3 or 4 |
|---|---|---|---|---|
| b20-1 | Paper Moons, Sep 2029 | 67.1 Strong, readiness 70 | 60.4 Working, 37 | 55.4 Working, 23, fatigue first |
| b20-2 | Paper Moons, Sep 2029 | 65.7 Strong, 59 | 57.9 Working, 30, fatigue first | 55.6 Working, 22, fatigue first |
| b20-2 | Last Bus To Eastview, Feb 2030 | 68.1 Strong, 55 | 57.9 Working, 28, fatigue first | |
| b20-4 | Last Bus To Eastview, Jul 2029 | 67.4 Strong, 59 | 59.4 Working, 30, fatigue first | |
| b20-6 | Paper Moons, Sep 2029 | 66.9 Strong, 67 | 60.1 Working, 36 | 54.8 Working, 23, fatigue first |
| b20-7, b20-8 | Paper Moons, Oct 2030; Static On Route 9, Aug 2029 | | fatigue among the limits from day 2 | |

  The player's own share, which is brief 19's career player's rule and not the game's: it goes to bed only from 11 PM,
  sleeps whenever it is awake between 11 PM and 5 AM for the hours the dialog suggests, and practised two hours after the
  first eleven-hour shoot day (energy 47.6, above `practiceHour`'s floor of 40). A shoot's call is 7 AM with two hours'
  travel from New Haven.

**F2. A role cast or declined is posted again ten weeks on and offered again, with no word of the first time (career;
D4's known item, confirmed).** `POSTING.againDays` is 70 ("a project casts its role once a cycle"). b20-3: "The film's
director cast another actor as Felix" (13 Sep 2029), then Felix in Paper Moons offered on 22 Nov 2029 and again on 31 Jan
2030 for new dates. b20-5: Felix posted 25 Jun 2029 and cast to another, posted 29 Oct and offered (declined), posted 7 Jan
2030 and cast to another. b20-4: Ivy posted 23 Jul 2029 and cast to another, posted 24 Dec and offered. b20-1 was told "Not Cast As Jess" in the same words three times. Each
posting's and offer's words say nothing of the last (`<seed>-career.txt`).

**F3. Every F-1 graduate's OPT ended for more than 90 days without work around 1 September 2029, and status with it
(papers; a rule to confirm, not a defect found).** b20-3 and b20-5 on 30 August (91 days, none worked), b20-4 and b20-8 on
6 September (96 and 94, two and four worked). The game counts a day as worked only where an engagement had work that day,
and says so when OPT is approved ("Each day of professional work you're booked for counts as a day worked, and OPT ends
once you've had more than 90 days without work in total"). After it the lives went on submitting and auditioning (b20-3
three auditions and two offers) and were refused only at acceptance, which brief 19's J5 chose. Whether an actor's days
between engagements count as unemployment under OPT is a question for the papers' research or the owner.

**F4. No new life is ever short of money (money; observation).** The living-expense scholarship arrives on the first
morning and, with no rent since the scope reset, it accumulates: b20-2, made with nothing ($43, no card, score 520), held
$13,362 on its first morning and $81,142 at the degree; the lowest month in any of the eight after its first was b20-3's
$12,214. The "little money" route was met only by two older saves (F9).

**F5. Credit limits rise a fifth at each six-month review, whatever the income (money; brief 20's D2, the coordinator's
record).** b20-6 $65,217 at creation to $194,736 at the journey's end, its past twelve months' income never above
$3,353; b20-1 $6,522 to $19,474; b20-4 $21,739 to $64,913; b20-3 held $1,630 to the end of 2028 (score 691 in December
2028), then $1,956 (April 2029, score 706) and $2,347; the older `old-leave` $93,912 to $233,683. Every figure at every transition is in the money
table below and in each JSON's `b20.credit`.

**F6. Savings untouched three years went to the state on 1 September 2029 (money; a delayed consequence that works).**
b20-4 $45,665.79, b20-6 $413,168, and about $414,000 in each J01 save; told on 1 March 2029 ("Chase Savings Is Dormant")
and on 1 September ("Unclaimed Money ... It can be claimed back from that office"). `bank.reactivate` and
`bank.claim_unclaimed` exist; no player here uses them.

**F7. The players never file a tax return (money; the players', not the game's).** Every US-resident life met late-return
notices, Connecticut's assessments, liens and levies (b20-2: DRS levies of $53.59, $690.66 and $832.18; the IRS's
assessment of $2,588.96 for 2027, and its Final Notice Of Intent To Levy on 4 January 2030).

**F8. Brief 13's check 7 didn't know OPT's 90 days (the runner; fixed here).** It failed b20-3 and b20-4 ("out of status
with OPT approved"; "F-1 status: out on 2029-08-30, before its end on 2030-07-30"): its rule put the end of status at the
OPT's end and sixty days. Brief 13's journeys ended 75 days after the School, before an OPT from 31 May could reach its
91st day without work. `tools/journeys.ts`'s check 7 now takes an OPT's `endedAt`; read again from the saves, it passes
in all eight.

**F9. Twenty months unfed held condition at 3.3 with nothing more coming of it but readiness (life and health;
observation).** The older `old-tax-plan` (a wealthy family's student, so no need-based aid, $3,120 at opening) ran out on
11 November 2027; its work-study wages went to "Paid back what was owed"; "No Money For Food Today" came on 620 days, and
from January 2028 to the end every morning read condition 3.3 (627 mornings under 10), mostly with energy 94 and stress 0.
Its work fell (readiness about 50; pieces about 36 to 46 against 57 to 62 before), its reviews went to concern and a
warning and back to good, and it graduated on time. No illness or care came of it. `old-state-plan` the same over 423
days. Whether a body held at that floor for most of two years should meet more than lowered readiness is the owner's or
the health area's to say; the brief warns against inventing penalties.

**F10. The School's request to meet lapses with no word (career).** `old-tax-plan`'s follow-up (11 May 2029) said
"Press Send Your Materials ... by June 10, 2029, and his office sets a time". The life couldn't pay for headshots ($700,
bank $0), the career player stops there (its own rule: no headshots, nothing further), and the date went by: no notice,
no history event, the relation still `introduced` on 1 September (`askedToMeet` simply stops answering after the thirty
days). Brief 20's list includes time passing an obligation by.

**F11. Commitments on the same days are taken when their hours don't overlap (career; observation).** See the routes'
clash row: an 8 PM curtain after a 7 AM to 6 PM shoot two hours away was booked and worked, and those nights were judged
Unready. `bookedClash` reads overlapping hours only.

**F12. Smaller things seen.** The notice title "You Slept Through 1 Commitment" (b20-7, four times) puts a figure where
`docs/STYLE.md` asks for words under ten in prose (a title may count as a fact; the text area's call). b20-2, a US citizen
made with nothing, has no passport and a driver's license that ran out on 14 June 2028; the papers player renews only
passports, so it had no photo ID in force for 20 of its 43 months (nothing asked for one: the bank's answer to a new account
was "You already have a checking account at Chase" throughout).

## The Older Saves (J2)

Each opened as the game opens one: schema 94, from before brief 19, so its professional record was built once on opening
(`pro.begun`). Every one opened with no breach and a clean ledger, read back to the byte when saved and opened again, and
was played to its end with no error. No migration problem was met.

| Save | Opened at | Built on opening | Played to | What happened |
|---|---|---|---|---|
| `journey-j01-year-one-8283f80c` | 1 Jun 2027, standing good, two terms begun | the record, nothing in it | 1 Sep 2029 | four more terms, every review good, the degree 21 May 2029; the agent asked to meet, met and passed; no work by the end; its savings went to the state on 1 Sep 2029 (the bank $491,111 at the degree, $75,589 that day) |
| `journey-j01-last-term-8283f80c` | 1 Mar 2029, the last term | the showcase once, with 8 options and the faculty's 2 scenes | 1 Sep 2029, and again to 16 Oct 2029 | the showcase, the degree, the agent's request, a meeting, the agreement accepted 4 Jun 2029; Nell in A House On Calder Street through him (ten weeks from 7 Aug, $1,051.00 a week, each paid into the agency's trust account and on less $105.10); Sam and Ivy through him, on the run's days (F11) |
| `journey-j01-degree-8283f80c` | 4 Aug 2029, graduated | the record, Equity dated at the degree | 1 Dec 2029 | Equity's $600.00 down and dues billed once on 1 Nov; Jess in Static On Route 9 booked 31 Oct, shot 12 to 15 Nov, paid 22 Nov; no agent (none had approached her) |
| `old-tax-plan-ff837dfa` | 18 Apr 2027, an IRS plan in force | the record | 1 Sep 2029 | ran out of money in November 2027 (F9); concern, warning, then good; the degree on time; the agent's request to meet lapsed unanswered (F10) |
| `old-leave-ff837dfa` | 12 Mar 2028 | the record | 1 Sep 2030 | back with the class of 2030, the degree 20 May 2030; signed 3 Jun 2030; Desk Clerk in The Calloway Files through him, 22 to 23 Jul, paid 30 Jul; Sam in Last Bus To Eastview 19 to 20 Aug |
| `old-state-plan-086d00ca` | 23 Feb 2028, a Connecticut plan in force | the record | 1 Sep 2029 | $205 at opening, then nothing: 423 days unfed (F9), cards charged off, score 300; concern at the fifth review, good at the sixth, the degree on time; introduced to the agent, nothing sent |
| `old-nonfiler-086d00ca` | 24 May 2028 | the record | 1 Sep 2029 | the degree 21 May 2029; the agent asked, met, passed; five auditions, none cast, no work by the end |

## Brief 19's Lives, Played Again

`play.ts lives` on this branch (513 s): life A on `v1-21`, life B on `v1-7`, and the two V16 lives. All four transcripts
came out the same, line for line, as the ones committed in `docs/verification/career-2026-10-20/playthroughs/transcripts/`
(682, 262, 161 and 139 lines). So life A's representation, its Ask To Move, its SAG-AFTRA membership and its commission,
and life B's declined agreement, hold on `12c04ee1`.

## To Run It Again

From a clean clone with `node_modules` in place. Each command is one part, each under ten minutes here (the longest
343 s); run a life's parts in order, each after the one before, until its line says `"done":true`. `--state` is any
directory outside the repository; `--out` is this one.

```sh
S=/tmp/b20-state; O=docs/verification/audit-2026-10-21/journeys
for life in b20-1 b20-2 b20-3 b20-4 b20-5 b20-6 b20-8; do
  for part in 1 2 3 4 5; do npx vite-node tools/b20-journeys.ts -- --life $life --part $part --state $S --out $O; done
done
for part in 1 2 3 4 5 6 7 8; do npx vite-node tools/b20-journeys.ts -- --life b20-7 --part $part --state $S --out $O; done
npx vite-node tools/b20-journeys.ts -- --older journey-j01-last-term-8283f80c --part 1 --state $S --out $O
npx vite-node tools/b20-journeys.ts -- --older journey-j01-degree-8283f80c --part 1 --state $S --out $O
for f in old-nonfiler-086d00ca old-state-plan-086d00ca; do for part in 1 2; do npx vite-node tools/b20-journeys.ts -- --older $f --part $part --state $S --out $O; done; done
for f in journey-j01-year-one-8283f80c old-tax-plan-ff837dfa old-leave-ff837dfa; do for part in 1 2 3; do npx vite-node tools/b20-journeys.ts -- --older $f --part $part --state $S --out $O; done; done
npx vite-node tools/b20-journeys.ts -- --table $O
npx vite-node docs/verification/career-2026-10-20/playthroughs/play.ts -- lives /tmp/b20-play19   # brief 19's lives, then diff against its transcripts/
```

The closer looks (separate state directories, so the journeys' own saves aren't touched):

```sh
# The J01 last-term save played on through Nell's run (the clash row, F11):
npx vite-node tools/b20-journeys.ts -- --older journey-j01-last-term-8283f80c --part 1 --end 2029-10-16 --state /tmp/b20-clash --out /tmp/b20-clash-out
# b20-1 again from creation, with its first shoot traced (F1):
for part in 1 2 3; do npx vite-node tools/b20-journeys.ts -- --life b20-1 --part $part --state /tmp/b20-trace --out /tmp/b20-trace-out; done
npx vite-node tools/b20-journeys.ts -- --life b20-1 --part 4 --to 2029-09-08 --trace 2029-09-01 2029-09-07 --state /tmp/b20-trace --out /tmp/b20-trace-out
# The straight-against-reopened comparison's fault check (must read DIFFERENT):
npx vite-node tools/b20-journeys.ts -- --life b20-8 --part 1 --to 2026-09-20 --fault fork --state /tmp/b20-fault --out /tmp/b20-fault-out
# The ten checks, coherence and routes worked out again from a finished journey's save, nothing played:
npx vite-node tools/b20-journeys.ts -- --reread b20-3 --state $S --out $O
```

These runs were made with two parts at a time on a shared machine; the play is deterministic (b20-1 made again from
creation came to the same bank to the cent), so a part's own running time is the only thing that differs between runs.
