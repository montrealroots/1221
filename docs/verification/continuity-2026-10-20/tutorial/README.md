# Brief 17, Section 9: The Tutorials Followed As A New Player (The Tutorial Area, 2026-10-20)

The owner's brief 17 (`../../briefs-2026-10-16/17-final-comprehensive-writing-and-continuity-pass.txt`), section 9:
follow each tutorial from its actual entry point and confirm every control it names exists under that name and can be
reached then, that automatic behavior is explained and the next step is clear, that a blocked action says why and what
to do, that links and back navigation work, that reading help doesn't move the clock, and that optional detail stays
reachable. The area is the guide's seventeen chapters (`src/engine/content/tutorial.ts`), How This Works and its 70
entries (`src/engine/content/guide/*.ts`), and the dialogs that draw them (`src/ui/guide/*`).

## What Was Run

`follow17.sh` runs it all against one build on port 4301, `before` and `after`. Each step's exit and time is in
`<phase>/exits.txt`; the logs and results are kept here, the screenshots and the walks' screens in the scratchpad.

- **`follow.mjs`** (brief 15's, `../../editorial-2026-10-19/tutorial/follow.mjs`, unchanged): a new life read through
  all seventeen chapters in the guide's own dialog, each checked word for word against `CHAPTERS`, and what each says to
  do done where it says, at 1440 and 390 wide. `<phase>/follow-<width>/log.txt` has every check; `chapter-NN-*.txt` the
  chapter as the dialog showed it.
- **`help-follow.mjs`** (new, this area's): what `follow.mjs` doesn't press. Home's eight locked panels on a new life
  (added after the before run, for finding 13); a locked control whose chapter has to wait
  and the guide's callout for it; an entry not open yet and its Read About It; the clock on Play with How This Works open
  for 65 seconds, then the guide, then the Sleep dialog (which The Clock's entry says doesn't hold it); then, on the
  coordinator's scenario save `brief.json` with everything open, all 70 entries found by their titles, each one's Show Me
  Where pressed and the screen and tab compared with its `where`, then Back To Help and Back To Home; an entry's sections,
  Show Everything and Show Less, a link and the trail and Back; H, C, P, the browser's Back, the SLATE mark, and Finding
  Your Way's breadcrumb example.
- **`entries-read.mjs`** (new, this area's, after run only): on `brief.json`, every one of the 70 entries found by its
  title, Show Everything pressed, and each thing the entry says (its summary, Where To Find It, When You Can Use It,
  each step, need, figure, change, reading, refusal, mistake, next step, connection and its worked example) looked for
  word for word in the dialog. `after/entries-read-<width>/log.txt` has a line an entry.
- **`tools/tutorial-routes.mjs`**: every label a chapter or an entry names, looked for on the built app, in the text
  walk of the coordinator's fifteen scenario saves (`saves-before/`) at 1440 and 390 and in the tool's own capture of the
  menus and dialogs the walk doesn't open. `<phase>/routes.md` lists them; `--check` fails a label found nowhere.

**Before** is a copy of the clone at `b84a82cf` (`main`'s `bbb82253` with brief 17's first commit), frozen with its build
in the scratchpad so the clone's `src` could change while the run read it. **After** is the clone with this area's
changes, built: the last of five after runs, on the final build. The four before it were stopped or set aside when the
other editors' findings, relayed by the coordinator, changed `src` again; they're in the scratchpad, not here.

## The Results

| Run | Before | After |
|---|---|---|
| `follow.mjs`, 1440 wide | 251 checks, 0 failed, 0 page errors | 251 checks, 0 failed, 0 page errors |
| `follow.mjs`, 390 wide | 252 checks, 0 failed, 0 page errors | 254 checks, 0 failed, 0 page errors |
| `help-follow.mjs`, 1440 wide | 313 checks, 1 failed (Home has no School breadcrumb: finding 1), 0 page errors | 323 checks, 0 failed, 0 page errors |
| `help-follow.mjs`, 390 wide | 313 checks, 1 failed (the same), 0 page errors | 323 checks, 0 failed, 0 page errors |
| `entries-read.mjs`, 1440 wide | (written after the before run) | 70 of 70 entries word for word, 0 page errors |
| `entries-read.mjs`, 390 wide | (written after the before run) | 70 of 70 entries word for word, 0 page errors |
| `tutorial-routes.mjs --check` | exit 0: of 1,741 labels, 0 nowhere, 307 in the code only, 1,255 on a screen, 179 on their own screen | exit 0: of 1,752 labels, 0 nowhere, 310 in the code only, 1,263 on a screen, 179 on their own screen |

`help-follow.mjs` has ten checks more after than before: Home's eight locked panels, the strip's Read, and the partly
open entry (findings 13 and 9), written after the before run. A count of `follow.mjs`'s checks differs by one or two between runs because each new life is drawn afresh (a passport
or not, a long-term condition or not), as brief 15's `routes.md` says.

## What Following Them Found

Each is fixed in this area's commit, and each new claim is held by a test that fails with the claim taken out
(`mutations.txt` here).

1. **Finding Your Way's worked example didn't work.** It pressed H on School's Coursework tab and then "the School
   breadcrumb", but Home never has one: going to a screen already in the breadcrumbs cuts them back to it, and Home is
   always the first (`moved`, `app/game-context.tsx`). `help-follow.mjs` found no School breadcrumb on Home before.
   The example presses P and then School in the breadcrumbs now, which comes back to School on Coursework; held by
   `tests/help-mechanics.test.ts` ("Finding Your Way’s example, played"). The same entry called the ? key's page "the
   guide's contents", which is How This Works'.
2. **What's Coming said who's at a commitment wrongly, in a sentence that needed rereading**: "You’re there if you’re
   awake and out of hospital, and, for anything but your own care, in its town and not laid up by an injury". A plan of
   your own and orientation ask only that you're awake and out of hospital (`world/plans.ts`; the orientation's check in
   `systems/coursework.ts`). The injury has its own sentence now, with what it keeps you from and what it doesn't;
   held by `tests/guide-chapter-facts.test.ts`.
3. **Drama School didn't say how a note is put right**, and put every note "under Feedback on the piece", which only a
   piece the course revises shows. It says now where the note stays, how a revised piece takes it, and that otherwise a
   note stays open until a later piece, in any course, is shown with its part at 75% or more (`LEARNING.enough`, the
   ledger kept by part), or answers the table's question as the text supports. Held by `tests/guide-chapter-facts.test.ts`.
4. **You As An Actor and Practice said practice past four hours "stops counting"** or "doesn't count", where the fifth
   hour is refused and Practice An Hour grayed out with its reason (`practiceRefusal`). Held by the same test file.
5. **Feedback And Your Notes, Another Way At A Note and Table Work said a note "is taken"**, the phrasing brief 17
   section 3 names, and Feedback And Your Notes' first view said nothing of how a note is put right; Another Way At A
   Note's next step read "the a targeted drill". Table Work said only a piece shown again takes a note on an answer;
   a later piece answering the same question does too (`show`).
6. **The Director's Notes named only Taken and Not Taken**, where a note on the craft shows Resolved, Taken: Better or
   Tried: Learned From, Not Moved (`OUTCOME_WORD`, `ui/components/RehearsalProcess.tsx`).
7. **First views that needed reading twice**: The Doctor And The Pharmacy opened "About twice a year a week brings a
   doctor’s visit"; A Card's Offers was one sentence of 75 words; The Player Profile put a map of eight panels between
   how to open it and that looking moves no clock; Sleep gave "from 0.5 to 14".
8. **Figures typed into a chapter**: Passports And ID's sixty days, twelve months and 90 days are read from
   `STATUS_GRACE_DAYS` and `WORK_RULES.opt` now.
9. **An entry part open said all of it was shut.** How You Are's entry covers the panel, open from “How You Are”, and
   your own page, open from “A Whole Life”, so for eleven chapters How This Works on the open panel said “This isn’t
   open yet. Read “A Whole Life” in the guide to open it.”, while the contents marked the entry open (`Help.tsx`). It
   says “Part of this isn’t open yet. … to open the rest.” now; held by `tests/help-mechanics.test.ts`, and checked on
   the after build by `help-follow.mjs` (added after the before run, so the before log doesn't have that check).
10. **From the other editors, through the coordinator**, each checked against the code before it was taken: The Nights
    sent the player to "Part By Part" in a night's look, whose heading is Moment By Moment (`ui/looks/actor.tsx`), and
    its example gave the workload to two places where the screen gives one (`workloadWords`), the school editor's two;
    and the material editor's, terms a new player meets unexplained. The chapters now say what a self-tape, a brief's
    beats, blocking and an understudy are where they first name them, and Learning A Part what blocking and being off
    book are. Eyeline and marking a fight, the material editor's examples, aren't in the guide's files: they're in the
    briefs' own staging notes.
11. **From the money editor, through the coordinator**: Your Bank's details, A Credit Card and A Card's Offers said a US
    card's penalty rate comes, and its introductory rate ends, with "a payment sixty days late", where the game's own
    late notice calls that moment thirty days late. Both come at the second due date missed in a row
    (`credit.missed >= 2`, `systems/credit.ts`), and the words say so now; `tests/guide-chapter-facts.test.ts` plays
    two missed due dates on a Chase card and finds the rate kept at the first and ended at the second. A Credit Card's
    first step says the panel shows its figures "then its terms", true of the panel on this base and as the money
    branch draws it, and names nothing the base doesn't have.
12. **From the profile editor, through the coordinator**: The Player Profile's figures put the advice's record "with
    “From your record:”", its preparation "on the first line", and listed as The First Line what brief 16 moved behind
    Why This Recommendation (`AdviceCard`, `adviceSummary`). What Each Line Says and Preparation, Said Apart send the
    player behind Why This Recommendation now, and What The Card Shows says what's on the card and what the button
    holds; `tests/guide-examples-craft.test.ts` holds the headings it names.

13. **From the frame editor, through the coordinator**: a locked panel on Home said its chapter's lead after the
    chapter's title, which is the chapter's subject and not the panel's: on a first Home, Where You Are's ended "how
    SLATE works, and how to read Home". Each of the eight says what it shows now, read from what Home draws in it, then
    "It opens when you read “…” in the guide." (`LockedPanel`, `ui/guide/Guide.tsx`); held by
    `tests/evidence-g32-ui.test.ts` and `tests/evidence-g33-ui.test.ts`, and read on the built app by `help-follow.mjs`.
14. **Also the frame editor's**: Moving Time On, the chapter and its entry, said the clock stops at each commitment on
    the way and not what the stop's answers do to the jump. Go carries it on, and Stand Here ends it there with the
    clock paused (`onGo` and `clearStandingAt`, `ui/shell/TimeControls.tsx`; `halt`, `app/game-context.tsx`), and both
    say so now; `tests/help-mechanics.test.ts` presses each on the real provider. The Calendar's You chip ("You, beside
    an entry in Next Thirty Days, means you need to be there") already said what it means in plain words, and was kept.
15. **From the papers editor, through the coordinator**: Your Tax Return's first step said each year's panel shows "Due
    and its date, or Filed"; the papers branch adds a late return's own words, so the step says the day the return is
    due, or the day it was filed, which both the base and that branch show; `tests/guide-examples-papers.test.ts` draws
    the panel before and after filing.

## Not Changed Here, Reported With Words

The guide quotes these in words the engine owns, so changing one side alone would break the quote (`guide-quotes.mjs`):
they're in this area's report with the words to give both sides. The doctor's booking notice ("the usual wait where you
live", where Yale Health books the next weekday, the health editor's finding) and a state lien's refusal ("It's released
once that's paid, not withdrawn.", said beside the panel's own release line, the papers editor's). `quotes-coordinator.txt`
lists every quote in the guide whose words only the coordinator's files say.

## What Held, Measured

- **Reading help doesn't move the clock**: with the clock on Play, How This Works open for 65 seconds left it at
  7:30 AM, and the guide open for 65 seconds the same; closed, a minute moved it. The Sleep dialog, which The Clock's
  entry says doesn't hold the clock, didn't.
- **Links and back navigation**: every entry's Show Me Where landed on its stated screen and tab (70 of 70), Back To
  Help reopened the entry and Back To Home returned to Home; a link under How It Connects opened its entry with the
  trail behind it, and Back and the trail's Contents went back.
- **Optional detail stays reachable**: an entry opens with What To Press showing and every other section a press away,
  and Show Everything opens them all; every chapter's The Details opened onto its paragraphs word for word.
- **Blocked actions**: a locked button opened its chapter with the callout naming the chapter that comes first; a
  locked entry said which chapter opens it, with Read About It, which opened it.

## Not Reached On The Built App, And Why

- **The brief pane's four entries' How This Works buttons** (Preparing A Brief, A Reading And A Way To Play It, Who
  Reads With You, Taping A Brief): the walk doesn't open a brief. The buttons are in `ui/components/BriefPane.tsx`; the
  entries themselves were opened by search and their Show Me Where followed.
- **A Bank At Home**: only a life that kept an account abroad has its panel; its entry was opened by search.
- **The Guide And This Help and Finding Your Way** have no panel of their own: they're reached from the contents.
- The routes a new life can't reach in its first days (a showing and its note, a term review, a production's calls) are
  what brief 15's `follow-saves.mjs` followed on scenario saves; the chapters' words for them were read against the code
  here (`coursework.ts`'s `show` and `noteTaken`, `learning.ts`, `production.ts`'s settling of a director's note).
