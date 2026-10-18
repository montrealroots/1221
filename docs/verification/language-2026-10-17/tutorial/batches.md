# The Tutorial Area's Batches

Brief 14, "Complete Player-Facing Language And Tutorial Overhaul", the tutorial area: the guide's chapters, How This
Works itself, the refusal for a part not yet opened, and `tools/tutorial-routes.mjs`. Worked in the clone
`scratchpad/l14-tutorial`, on `lang14-tutorial`, from the pass's baseline `d82d38d0`. The before-and-after pairs are in
`examples.json` (59, by batch), the defects in `defects.md`, the words in `glossary.md`.

Words are counted in each chapter's source text, a figure written as code counting as one. Every chapter keeps its id,
its `opens` and its place in the order: `replace_chapter.py`, which swapped each chapter's
block, refused any block whose `opens` line differed from the one it replaced, and `tests/tutorial.test.ts` holds the
coverage and the order. `names` were kept but where the screen says otherwise (below).

## Batch 1: How This Works, The Guide's Dialog And The Refusal

**Sources (27):** `src/ui/guide/Help.tsx`, 13 (`pageLabel`, `CONNECTION_HEADING`, `HelpProvider`, `HelpDialog`,
`Contents`, `Results`, `HINT`, `EntryLink`, `Entry`, `SCREEN_NAME`, `screenName`; `Facts` went, its one string,
“(estimated)”, below the inventory's floor); `src/ui/guide/Guide.tsx`, 5; `src/ui/guide/HowItWorks.tsx`, 1;
`src/engine/world/tutorial.ts`, 2; `src/engine/content/guide/index.ts`, 10 (`GOALS` and `SEARCH_EXAMPLES`).

**Changed:**
- An entry reads in the brief's eight questions' order: its short first (what it's for), then Where To Find It and When
  You Can Use It, Show Me Where, then What To Press (open from the start), What You Need First (with Time And Money),
  What Happens (Straight Away, Later On, Reading The Result), How It Connects, What To Do Next (the new optional `next`,
  drawn when an entry has it), If You Can’t (with Mistakes, And Putting Them Right), and last What Decides It and A
  Worked Example. Until then: Steps, What It Needs, Time And Money, What The Game Reads (the brief's own example of
  engine-speak), the changes, Reading The Result, Why It Might Not Be Available, Mistakes, and Connected Systems near the
  end. How It Connects' lines lost their “→”: a link and its reason.
- Show Me Where leaves Back To Help and, when it moved the player somewhere else, Back To the screen they left, at the
  tab they had showing (`kept`). Following a link and coming back keeps the player's place, runs no command and moves no
  clock.
- ? opens the contents with On This Screen first: the entries for the screen and tab it was pressed on. An entry whose
  every feature waits on an unread chapter says Locked, in the contents, the search's results and Read With It.
- The empty search's example found nothing (`defects.md`, 1); its examples are a list held to finding an entry.
- The contents' guide line, the not-open callout, the locked panel's sentence, the guide's two callouts and its Opened
  words are sentences with a subject and the next step. Search The Guide is Search How This Works, which is what it
  searches. “(an estimate)” is “(estimated)”, the glossary's word.
- The refusal for a part not yet opened says where the guide is, and when another chapter comes first, that the
  chapters open in order. The no-guide and out-of-order refusals are two plain sentences each.
- `GOALS`' leads name their entries in order: Staying At School's offered “shows of your own”, which are Productions
  And Casting's, and left calling in sick out.

**Kept:** Locked, Guide (N Left), the strip's Guide · N Of M and Read, How This Works, Contents and Search: plain names a
player already reads. “The clock waits while you read.”, which every help tool finds the help open by. I’ve Read It,
Try It, Next: …, Start Playing, Later, Close, Read About It, Show Me Where, Show Everything and Fold It Up.

**Meaning-sensitive:** What Decides It over `reads`: the facts are what decides how a thing goes, which is what the
field was (`content/guide/types.ts`). Counts Toward for the `evaluation` kind: "this is read when the other is judged".
Back To <screen> moves the player, like Show Me Where, so it's a `navigate` and nothing else: the new test asserts no
command, the save the same to the byte and the clock to the millisecond.

**Tests and tool matchers updated:** `tests/evidence-g02-life.test.ts`, `tests/evidence-g29-ui.test.ts`,
`tests/evidence-g32-ui.test.ts`, `tests/evidence-g33-ui.test.ts`, `tests/evidence2-b13.test.ts`,
`tests/guide-examples-start-day-body.test.ts` and `tests/trace-commands.test.ts`, to the new words, as exactly as
before; `tests/whynot-papers.test.ts` and `tests/whynot-school.test.ts` match the refusal's first sentence, unchanged.
`tools/acceptance-ui.mjs` and `tools/playthroughs-ui.mjs` open How It Connects, not Connected Systems. New:
`tests/help-mechanics.test.ts`, three journeys (Show Me Where and the way back; ? on Casting with its Locked marks and
the not-open callout; a new life's guide read through, every chapter's every paragraph and name on its page), and the
order of an entry's sections and How It Connects' headings; `tests/guide.test.ts`, 'suggests only searches that find
an entry'.

## Batch 2: The Routes On The Built App

**Written:** `tools/tutorial-routes.mjs`. It takes every chapter's names, paragraphs and details and every entry's
where label and steps, pulls out the Title Case runs and the quoted labels (a run is cut at a possessive, a sentence's
lone first word is skipped, and a run that starts a sentence is also tried without its first word, so "Press Go" is Go),
and looks for each in the text walk's screens and its own capture, the guide's and the help's own pages set aside (they
can't vouch for themselves; a chapter's title named in another chapter counts as the guide's). A where label is split at
its commas, and a part that isn't a label itself ("SNAP And Your Claim") is looked for piece by piece, on the entry's
own screen and tab first. Not found on a screen, a label is looked for in the game's code outside the tutorials, its
words allowing a template's part between them, or standing for one or two of them so long as at least two and at least
half are written out ("Apply For {PROGRAM_NAMES[state].medicaid}" is Apply For HUSKY D, "Leave The {AXES[axis].label}
Open" is Leave The Pace Open); the report names the file. What's on no screen and in no code is nowhere: a wrong
instruction, which `--check` fails.

`--capture` opens, read-only, what the text walk doesn't: the Advance and Look After Yourself menus, the Sleep dialog,
the guide and each of its seventeen chapters with The Details open, How This Works' contents, and the Calendar screen
with a day and its plan form (closed with Never Mind).

**Today's words** (the before walk, 700 screens of the 14 scenario saves, and a capture of the same saves on the batch-1
build): 41 labels nowhere at the first run, 17 once a where label's parts were tried piece by piece and possessives cut,
and 11 once a template could stand for a label's last words. All were in the entries, which the domain areas are
rewriting; the chapters, old or new, named none that the game doesn't have. An early version of the template rule let
a template stand for any trailing words and passed too much; the rule above replaced it, and an earlier report of Leave
The Pace Open as a missing control was wrong (`defects.md`, 5).

**On this area's final build** (`routes.md`: the text walk at 1440 and 390 and the capture, 760 screens of 14 saves):
the chapters name 550 labels, 463 on a screen and 87 in the code only (controls for a state the saves didn't reach, such
as Skip It at a plan's stop or Break It Early on a term deposit, and real names such as KakaoBank), none nowhere; their
`names`, 74, are 65 on a screen and 9 in the code only. The entries' labels: 14 nowhere (`defects.md`, 5).

## Batch 3: The Day (Chapters 1 To 10)

**Sources (10):** `CHAPTERS` [welcome], [calendar], [clock], [advance], [needs], [body], [sleep], [looking-after],
[plans], [weather]. 1,357 words before; 1,701 after, and 199 behind The Details.

**Changed:** each chapter says what the part is for, where it is, what to press by its label, what happens, and which
chapter is next. Read against the code: the top bar's controls and their order (`TimeControls.tsx`), the Advance menu's
items and the On The Way dialog, the stop's dialog and its Stand Here, Skip It and Go (`DueNow`), the entry look's
"if you aren't, it's missed" (`ui/looks/day.tsx`), Home's panels and Mark N Read, Go There, Dismiss and Show All
(`Home.tsx`), what Dismiss leaves standing (`world/world.ts`, and `day.needs`' own words), energy's drain and what
brings it back (`applyElapsedWellbeing`, `applySleep`), Stamina as fitness (`systems/attributes.ts`), the Look After
Yourself menu's items, order, chips and refusals (`lookAfterOptions`, `whyNow`, `lookAfterRefusal`), the plan form's
fields and Put It On and the plan dialog's Call It Off (`CalendarWorkspace.tsx`), and `PLAN_LENGTHS` for the lengths,
imported, where the chapter had copied them.

**Distinctions said where first met:** energy against stamina and against health (How You Are: condition and fitness
told apart from energy, health sent to Papers).

**Meaning-sensitive:** "only sleep brings it back" (`applySleep` alone raises energy); a long-term illness told from
condition, the measure; Dismiss: what the question was about still stands, from `day.needs`; the Look After Yourself
chip is the top line's only; the claim about loving an activity is gone (`defects.md`, 2). "Mark Read" in names is
"Mark Read, which counts the notices it clears", since the button reads Mark 27 Read.

**Tests:** `tests/tutorial.test.ts`' job guard reads the details too; `tests/help-mechanics.test.ts` draws every
paragraph. `tests/defects-g1-1.test.ts` (your own page) holds.

## Batch 4: Drama School And You As An Actor

**Sources (2):** [school], [profile]. School: 1,631 words before; 992 in its body after, and 849 behind The Details.
Profile: 947 before; 683 and 422.

**Changed:** Drama School opens on where the school is and its tabs, then classes, calling in sick, the craft, coursework,
partners, Shown Today and notes, the warning and the review, casting and the rules on missing calls, Work It Through,
work-study, the Cabaret, plays to read and the fees, each by its screen's labels (Yale, Call In Sick on Classes, Ask
Zoe as Ask with the partner's name, Run It With A Reader, Coursework This Term, Why This Cast, Learn The Part, Catch Up
The Blocking, Work On The Note, Take An Elective Shift, Join A Cabaret Show, Join The Summer Company, Read It, Research
It). The productions' list, the casting weights, the nights' workload and bands, the Cabaret's conditions, the review's
fine rules and the degree went behind The Details. You As An Actor: where the Profile is, the abilities and techniques,
practice as the screen has it (the exercise's name, a tier and a focus, Practice An Hour), growth and its limits, how
work is judged, genres and briefs by their buttons, What To Work On, suiting the scene, the callback; the growth's fine
rules, which abilities count most, registers and the beat-by-beat judging behind The Details.

**Distinctions:** abilities, techniques, genre knowledge and practice (You As An Actor, and Drama School for
techniques against abilities); choosing a way to play a scene against rehearsing it (Drama School: a choice is rehearsed
in by work on your feet, `rehearseChoice`); how ready a piece is now against what a full preparation would bring (Shown
Today, What To Work On); a coursework warning against the term review.

**Meaning-sensitive:** the review's steps named by the standings' own names; the Bulletin's standings kept apart from
the review's timing, floors and steps, which are estimated (it said "SLATE's reading"); the note as the game's words in
a teacher's voice; "Practice beside each one" (`defects.md`, 3); "reads" in "what a Yale Rep role reads most" and "the
work you do grows what it reads" became "asks" and "trains"; "the grain" and "a side" became suiting the scene; "a take"
became a tape, a self-tape being where the industry's word is right.

## Batch 5: Cover, Benefits And Returns, And Passports And ID

**Sources (2):** [papers], [documents]. Papers: 1,293 words before; 493 and 1,071 after. Passports And ID: 461; 460 and 94.

**Changed:** Papers opens on what it holds, where it is and its tabs, then Yale's cover, seeing a doctor, bills, cover
after school, long-term conditions and therapy, unemployment and pensions, the return, and the police report, each by
its label (Your Cover, Your Doctor, Book An Appointment, Care And Its Bills, Pay It Off, Apply For Assistance, Enroll
under The Marketplace, Drop The Plan, Your Conditions, Let It Go, Keep It Up, Therapist, Begin A Course Of 8, File A
Claim, File It, Pay). Every program's rule, date, rate and published wait went behind The Details, kept exactly.
Passports And ID: where each paper is, applying for a passport and holding it, the ID card's Get with its name, Report
Lost and Report Stolen, a lost license and ID card, Going Abroad, and F-1 status and OPT.

**Distinctions:** enrolling against being covered (Papers), applying for a passport against holding it, and the ID card
coming by mail (Passports And ID).

**Meaning-sensitive:** where Enroll is (on The Marketplace's panel, `PapersWorkspace.tsx`); File A Police Report offered
beside a paper reported lost (`Documents.tsx`), and reporting opens with the next chapter; "SLATE's assumption" became
"estimated". `tests/defects-g27-1.test.ts` holds what Report Lost takes (each kind named, nothing said of "anything")
and where a lost license is replaced (by mail, and the condition of living there): both held, in the body.

**Tests:** `tests/evidence2-b13.test.ts`' work-rules journey asserts the renewal sentence, now its own sentence, from a
capital.

## Batch 6: Money, Your Bank And A Whole Life

**Sources (3):** [money], [bank], [life]. Money: 202 words before; 205 and 31. Your Bank: 2,072; 688 and
1,536. A Whole Life: 178; 182.

**Changed:** Money says what its line shows, the way into its looks (the Your Affairs title), the credit record and
where its figure shows. Your Bank opens on where the bank is and its tabs, then Move Money, interest and fees, the card
and autopay, missed payments, help with payments, applying, Statements, How You Pay and Cash, security, and overdrafts,
loans and another bank. The rest went behind The Details, each figure and condition kept. A Whole Life: your own page by
the presses that open it, birthdays, the end, and Guide to read again.

**Distinctions:** money available against money pending (Move Money: money in transit has left one account and isn't in
the other yet, `bankmoves.ts`, so it isn't available to spend).

**Meaning-sensitive:** `tests/defects-g12-1.test.ts` (what the Money line shows, and the record's figure only when a
life is made), `tests/defects-g22-1.test.ts` (Statements a tab of their own; at once only at the same bank; help with
payments for someone who can't clear the card) all held, in the body. "That interest" read as the removed interests to
`tests/evidence2-b13.test.ts`' rule: it's "the interest". "Somebody else may use a card" is "Someone": the tics' budget
counts "somebody".

## The Checks

Each batch, from the clone, each exit read from a file: `npx tsc -b --noEmit` 0; `npx eslint` on the files changed 0;
`node tools/title-case.mjs --check` 0, `label-sweep` 0, `plural-check` 0, `voice-check --check` 0, `tics --check` 0
(after batch 6 had a not-but over by one and a "how ready it is now" the contraction count read: both rephrased),
`spelling` 0, `typos` 0, `doc-refs --check` 0, `deciders --check` 0. Engine-speak in the area's sources fell from 18 to
0 in the chapters and to none in How This Works. The final runs are below.

## The Final Runs

On the area's last words (the commits after `01030ec1`), in the clone:
- **The whole suite:** `npx vitest run`, 376 of 376 files and 4,591 of 4,591 tests, exit 0 (the baseline's 4,587 and the four this area added).
- **The gate's other checks:** `wired`, `inventory`, `capabilities`, `coverage`, `student-matrix` and `text-inventory
  --check` 0. `devmap --check` and `traceability` failed on this area's own changes (the help test now drives
  `life.sleep` and `tutorial.read`, and the refusal's words are new) and pass once their tables were written again with
  their own `--write`. `completion-matrix --check` fails as it did at the baseline (`defects.md`, 6), and was left for
  the coordinator.
- **The built app** (`npm run build`, served on 4202 by the one `vite preview` started first, which serves `dist` as each
  build rewrote it: the later starts found the port taken; the capture matching the final words, 271 of 271, shows it
  served the last build): the text walk of all 14 scenario saves at 1440 and 390, 350
  screens each, none it couldn't reach. `tools/text-render-check.mjs` finds the same six faults on both widths as on the
  before walk (a plural in the Profile and in a coursework note, money written "-$3" on Money), none in this area's
  words. The capture (`tools/tutorial-routes.mjs --capture`, 14 saves): every paragraph, detail and name of the 17
  chapters is on its built-app page, 271 of 271 (`capture/brief.json`), and the render check finds no fault in its
  35,274 strings. The routes: `routes.md`, above.
- **Phone width:** `phone/`, at 390: an entry, an entry with everything shown, the contents with On This Screen, Show
  Me Where's way back (Back To Help, Back To Home and ✕ fit in the bar, and Back To Home went back to Home), and Drama
  School with its details open. Nothing in the dialogs or the bar runs past the screen's edge, and the page doesn't
  scroll sideways (`phone/shots-390.json`; the same at 1440, `phone/shots-1440.json`).
- **Statuses:** the area's 47 sources: 39 Rewritten And Verified, 8 Reviewed And Retained, none Pending or Blocked.
  Engine-speak in them fell from 18 to none; the game's total from 758 to 740.

## A Manual Route For The Owner

Begin a New Save, choose Guide Me Through It, and read the guide from its first chapter: each chapter says what its part
is for, where it is and what to press, then I’ve Read It and Next. On Home, press a panel still Locked and its Read About
It. Read "How You Are" (energy, stamina and health told apart) and "Drama School" (a warning against the review, a
choice against rehearsing it), opening The Details in each. Then on any screen press How This Works: the entry reads
what it's for, Where To Find It, What To Press, and the rest in the brief's order. Press the question mark key on
School's Casting tab for On This Screen; search "transfer", open A Card’s Offers, press Show Me Where, then Back To
School: the tab you left is still showing, and the clock hasn't moved.
