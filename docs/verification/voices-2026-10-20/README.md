# Brief 16: Contextual Writing, Distinct Voices, And Clear Information, 2026-10-20

The owner's "Contextual Writing, Distinct Voices, And Clear Information"
(`../briefs-2026-10-16/16-contextual-writing-distinct-voices-and-clear-information.txt`, kept verbatim):
- the school's feedback built from what happened, in each course's voice, varied over a long run;
- the Profile's recommendation made short, with its reasoning behind a button;
- the long explanations and the tutorial made easy to follow.

The simulation, its mechanics, the saves and the scope don't change.

## Where It Started

- **The branch:** `claude/peaceful-hamilton-59zdbb` at `d1ae7a79`. That is `main` at `74259312` (#44's merge, brief
  15) with the handoff's account of that merge, which is open as #45. There was no stash and one worktree.
- **The game's code** is `main`'s, the gate having passed on it (`../editorial-2026-10-19/runs/gate.txt`, on `aabfc1b2`,
  with the same `src/`).
- **The tested commit** is `4ef5e961`. Every measurement after (`after/`) and every run in `runs/` was made on it.

## The Baseline, Before Anything Changed

`tools/voices.ts` plays seven kinds of student for fourteen months each, through the public commands, saving and
opening the save every thirty days. It records everything the school says to them as they meet it: every notice as
it's made, each showing's feedback, each director's note, each classmate's moment, and the Profile's What To Work On
Next each Sunday. `--summarize` measures what a player reads again, and `--guide` measures the tutorial and How This
Works. The baseline is in `before/`: one file a student, `summary.json`, `transcript.md` (everything in order) and
`guide.json`, made on `d1ae7a79` (`before/commit.txt`).

The seven students (seed `v16-0`): attentive; underprepared; improving (underprepared until December); regressing
(attentive until January); skilled (TEST SETUP every ability and technique at 85); under pressure (the flu and an
injury); and practicing as the Profile suggests.

`tools/screen-text.mjs` (from 2026-10-20) walks the built app as brief 15's captures did: a new game through creation and
the guide's seventeen chapters, then a save a year in (brief 15's workload save) through every tab of the Player
Profile, School, Money and Papers. It reads every paragraph, list item and definition a player can see there, a shut
disclosure's inside not counted, and counts its sentences. The baseline, on brief 15's build (the same `src/`), is
`before/screens.json`.

**What the baseline transcript shows** (`before/transcript.md`):
- Every course said the same frame. A Voice I sequence, an Alexander Technique lesson and an Acting I scene each heard
  "It came together. Here’s what to try next." and then the same step beyond.
- Voice I and Alexander Technique were told "Do less. Find the moments that need nothing added, and trust the text in
  them", where there's no text.
- A note that came back said so in one fixed sentence ("This is the fourth time you’ve had this note…"), the same in
  every course.

## The Measures, Before And After

The same seven students on the same seed, before on `d1ae7a79`'s code and after on `4ef5e961`'s. `before/summary.json`
is the baseline's summary as first made; `before/summary-final-tool.json` is the same runs summarized by the final
`voices.ts`, so both sides are measured by one tool (it added the voices and the advice's details).

| Measure | Before | After |
|---|---|---|
| Showings, with feedback | 868 | 868, the same showings (below) |
| Distinct first sentences | 73 | 269 |
| A first sentence said in one of the last five showings from the same course | 529 (61%) | 72 (8%) |
| Showing feedback said before, word for word, in the same run | 358 (41%) | 1 |
| Showings in voice, movement and text courses given acting's step beyond | 432 | 0 |
| Distinct first sentences, by discipline: acting, voice, movement, text | 27, 22, 28, 16 | 90, 71, 92, 61 |
| Directors' notes: distinct first sentences; repeating one of the last five | 19; 29 | 23; 14 |
| Notices said again word for word in the same run | 55 of 2,698 | 3 of 2,698 |
| The Profile's What To Work On Next, shown | 674 words, 56 figures on average, at most 898 | 61 words, 4 figures, at most 128 |
| … with Why This Recommendation opened | the same, all of it shown | 512 words, 42 figures, at most 730 |
| Sentences said twice in one advice block | 9.6 | 0.4 |
| Tutorial and How This Works strings: more than three sentences; five or more; "It happens" with nothing to say what | 105; 50; 4 | 74; 0; 0 |
| The built app's paragraphs, 43 pages: four or more sentences; five or more; the longest | 41; 21; 451 words | 2; 0; 50 words |

**How it's counted, and what's left out.**
- **A first sentence** is compared with its figures and dates taken out ("Down from Strong on DATE.").
- **The last five** are the same course's last five showings.
- **Word for word** is the whole text, in one student's run.
- **Shared across courses** (`summary.json`'s `shared`) rose from 49 sentences to 146 and fell from 837 showings to
  803. The teaching that every course shared is gone: "It came together." (381 times, 18 courses), the steps beyond
  (acting's said in 13 to 16 courses). What's shared now is the game's own fixed words, which the brief asks to keep
  stable: "A Note That Keeps Coming Back, on the piece’s card, offers other ways at it." (111 times), a band against a
  day ("Down from Strong on DATE."), where Work Out is. Each is said far less often: the most, 111 times, against 381.
- **A classmate's moment** (301) is counted by its first sentence, unchanged (76 distinct): what changed is the sentence
  after it, which says it's come before (below).
- **The three notices said again** are a word of encouragement three months apart, and two apologies a year after the
  first for the same missed rehearsals. The second is a defect of the game, not of its words, recorded under What Was
  Found below.
- **The screens' two left** are Creation's map credit (four short sentences of sources) and the tutorial's "Four
  different things make you better", four one-line definitions read as a list.

**The same game.** `same-play.py` compares the two sides event by event, every word aside, and finds no difference
(`after/same-play.json`). It compares:
- every showing's day, course, piece, band and kind of note;
- every director's note and classmate's moment by day and speaker;
- the advice by day and how many recommendations;
- every notice by day and title;
- each run's reloads and last day.

The long runs (below) compare everything else.

## What Changed

**Feedback** (`src/engine/systems/feedback.ts`, new; `coursework.ts`'s `show`).
- **From the record:** a showing's words are built from what's there: the band against the course's last showing and
  its best, a run of strong work, the note and how it stands in the ledger, and what held a prepared piece back by the
  judged limits.
- **More facts:** the day's condition, the partner's share, the same limit holding the last showing back too, and a
  note's measure and what to do about it.
- **The situations:** each the brief names and the record supports has its own shapes: a new note, better but not
  there, still there, given often (said short and named), back after it was taken, the step beyond, held by something
  other than the preparation, a run, a best, strong despite a bad day.
- **Claims kept to the record.** A note says it held the piece back most, never that it decided the band.
- **The voices:** each course speaks in its discipline's terms (acting, voice, movement, text, by the skills it
  teaches), with each discipline's own seven steps beyond.
- **The choice of words:** made by a hash of the piece and the day, never the game's randomness. It skips any opening
  or text the course, or its discipline, said lately, read from the feedback already in the save. So the memory is the
  record, a reload says the same words, and the save is unchanged (schema 94).
- **The label:** "Simulated note from …" on the notice, "Simulated feedback for …" on the card, as before.

**Directors and classmates.**
- **A director's note given again** says what came of the last in one of three ways where it was one; a way tried is
  named as its control names it.
- **Classmates** say what they've done before, from their own record: a request for help asked again (how many, and how
  the last was answered), an invitation to run lines (how the last went), a partner who doesn't come again and their
  apology (how many).
- **A term's coursework warning** after an earlier one says which it is, and that the last came the term before when it
  did: "This is your second coursework warning, after one last term."

**The Profile** (`adviceSummary` in `next-steps.ts`, `AdviceCard.tsx`): What To Work On Next and a brief's What To Work
On draw one card:
- what to work on, why it matters now, the action in the screen's own words, the estimate called one, and why it can't
  be done now where it can't;
- behind Why This Recommendation (a native disclosure, opened by keyboard or mouse): how the estimate is worked out,
  what it assumes of your work a sentence a line, preparation or training, how long it's been first, from your record,
  and the other things worth your time a line each, a step two share said once.

**Help, the tutorial and the screens**, by five editors in clones, each area brought in as its own commit:
- **Life and craft** (`65d54282`); the **tutorial** (`cb9b323d`); the **school** (`77380be9`); **money** (`f9403bb2`);
  **papers** (`28f30fde`).
- **The order:** each long explanation now says what it means for you and what to do first, then what it costs, then
  the rules, the optional ones behind the entry's own sections or a disclosure.
- **How This Works:** a summary may be two short paragraphs (`Help.tsx`).
- **The tutorial:** every instruction was checked against the control it names, in the JSX.
- **Kept visible before a confirm:** fees, deadlines, eligibility and warnings. Cards says first what to do about a
  payment that wasn't you, by when, and the most you'd pay, from the same figures the game charges by, in every
  country.

**The stop dialog** says what starts and who's there by the rule for its kind (`present`, `presentForCare`), where it
said "It happens the next time the clock moves, and you’re there if you’re awake and in the right city".

**STYLE.md and GLOSSARY.md** say how feedback and advice are written now, and the words the card uses.

## Where The Words And The Game Disagreed, Fixed In The Words

- **Sleep** "clears" stress and sleep debt: `applySleep` eases stress and pays debt back.
- **The Classes screen's** reasons to call in sick left out an injury `sickRefusal` accepts.
- **Learning a part** named only the blocking call; `callMissed` counts the technical calls too.
- **The health-cover notice** was quoted with words it doesn't say.
- **Unemployment** said a week counts the wages paid that week (`workDoneIn` counts the work done in it), and left out
  the weeks that pay nothing.
- **The IRS plan panel** said a plan "has a setup fee" above "Setup fee: $0.00".
- **The state plan's monthly estimate** left out the fee the plan adds (California's $34): the estimate now includes it,
  in the screen only.
- **A state plan's end** said the rule isn't published for states that publish it.
- **The tutorial's** attendance rule, the Profile's "deserve your attention", and "Money In Transit", a label that isn't
  on Accounts.

## What Was Found And Not Changed (For The Owner)

These are mechanics, and this was a writing pass (the brief, section 7: "Keep any unrelated banking or legal-rule
changes separately identified rather than silently changing mechanics").

1. **A classmate apologizes again, a year on, for the same missed rehearsals.** Found by this pass's measurement:
   - Nadia, regressing student, 2026-10-08 and 2027-09-30.
   - The apology is due while `stoodUp` exceeds the apologies in the classmate's moments, and those keep only their
     last 20 (`had`, `classmates.ts`). So the first apology falls off and the same misses are apologized for again.
   - Proposed: count apologies on the classmate's record (`apologized`), as `stoodUp` is counted.
   - It changes which moments are drawn, so it would change play.
2. **Card liability and its law text** (the money editor):
   - **Japan:** the game charges nothing for any card payment reported within 30 days. The text says no law limits
     debit purchases, and issuers' terms govern credit cards.
   - **Korea:** the game charges the whole amount, where the text says the bank bears losses from forged cards and
     hacking.
   - **The US:** the game applies the lost-or-stolen tiers ($50, $500) to any misuse. 12 CFR 1005.6(b)(3) gives $0
     within 60 days where no card was lost or stolen.
   - **Canada:** the game always charges $0, where the text allows liability for a loss the holder contributed to.
   - The visible sentence says what the game does; the law text sits under What The Law Says.
3. **The IRS short-term plan** takes the installment-agreement penalty rate (0.25%) too (`startPlan` calls `underPlan`
   for either kind). IRC 6651(h) arguably covers installment agreements only (the papers editor).
4. **The missed state-plan notice's figures** and `optRefusal`'s "90 days" and "60 days" are copied into prose rather
   than read from the rule (the papers editor).

## The Runs On The Tested Commit

Brief 15's final runs, every one again on `4ef5e961` (`runs/README.md`, `final/README.md`), 201 steps in clones, each
exit 0 but banking's step 8:
- **The built app:** the acceptance walk, 77 passed, 0 failed, 0 skipped, 0 errors, 0 overflows, at 1440 and at 390.
- **Brief 13's playthroughs:** normal 14 of 14, setback 9 of 9, specialist 11 of 11, at each width
  (`interface-final/summary.json`).
- **Brief 14's journeys:** document 8 of 8 and health 10 of 10 at each width. Banking is 9 of 10 at each width: step 8,
  the engine's week planning (brief 14's `journeys-3`, left for the owner), failed by brief 15's runs in the same words.
- **The school journeys:** brief 13's 25, played to the end, all ten checks passed on each, each ending as brief 15's
  ended.
- **The long runs:** 24 lives, the workloads, the mastery plans, variety and freshness.
- **The advice:** the fresh set and the held-out set again, 40 of 40 F2-A cases.
- **The judge and acting measurements:** all 36 figures brief 15's, every output byte for byte.

**The same numbers** (`numbers-same.py`, `numbers-same.json`): every number, id, key and list length in brief 16's runs
is brief 15's, but the words and three counted kinds of thing, each checked:
- a coursework warning's words in two workloads;
- how many classmate notices stay apart, since one that comes again now says so (880 more kept apart in the 25
  journeys; every notice brief 15's had on a day is there on that day, none fewer);
- the run's own record.

## The Gate

`npm run gate` ran last, on `eabb9ef5`, in a clean clone of the branch (`final-checks/gate16.sh`), its exit read from a
file: exit 0, 398 of 398 test files and 4,781 of 4,781 tests passed, none skipped, every one of the twenty checks
holding (`runs/gate.txt`, `final-checks/`). `npm run build` exited 0 in the same clone. Between `4ef5e961`, the tested
code, and `eabb9ef5`, only documents changed.

## Examples, Read In Order

`examples.md` (made by `examples.py` from `before/` and `after/`, never typed) holds:
- consecutive feedback, before and after on the same day and band, for four students: improving, regressing, skilled
  and underprepared;
- the first strong piece in six courses, one of each discipline, and a held piece in two;
- every director's note the attentive student had;
- every classmate's request said word for word before;
- the Profile's advice before and after.

`after/transcript.md` is everything said, in order. `after/shots/` is the card on the built app, shut and open, at 1440
and 390.

Reading them in order found what no test had, each fixed and then held by a test:
- a note given often never said which;
- a limit holding piece after piece back was said as new each time;
- a piece's rounds were miscounted;
- "Not there yet: you’re spent by the second half: …";
- "You tried work it slowly";
- "made up for the about 3 points that cost";
- "A eighth time".

## Tests

Each claim the work added is held by a test, and each test was run with the claim taken out (a mutation) and failed:
- the repeats that say so: `repeat-moments`, `evidence-g22-school`, `evidence2-b11`;
- continuity, a single date, the article, the shapes: `language-dynamic`;
- the card's sharing rules: `advice-card`;
- the stop dialog by kind: `language-frame-ui`;
- the money sentence in 13 countries: `editorial16-money`;
- the published plan rule: `scope-taxpapers`.

The tests that held the old words hold the new ones as exactly as before.

## What's Automated, What's Read, What's Seen

- **Automated tests** hold each claim, and the gate holds the rest. Automated interface tests are not human usability
  approval.
- **Source review:** every string changed was read against `docs/STYLE.md`, and each source changed carries its
  second-pass status with what it was read against (`docs/text/second-pass/`).
- **Read in order:** the transcripts and examples above, by the coordinator, which is how the fixes listed there were
  found.
- **Seen on the built app**, the tested commit's build:
  - the card shut and open at 1440 and 390, with no overflow;
  - a How This Works summary drawn as two paragraphs;
  - the screens measured page by page;
  - the acceptance walk and the playthroughs at both widths, below.
- **Judgment:** that the voices read as distinct, that a note reads as a teacher's, and that a paragraph is easy to
  follow are the coordinator's judgment from reading, not a measurement. The measures above say what changed. They
  don't say the writing is good, and nothing here claims it can't be repetitive.
