# The School Area: Batches

Brief 15's school area (`../prompts/school.md`). Each batch is a few files read whole, with the interaction around
them, then rewritten or kept, its tests and tools moved to the new words, its checks run and its statuses marked with
`tools/text-inventory.mjs --mark2 … --by school`.

Three tools in this folder print what the player reads, from the game's own code:
- `render.mts` → `rendered.txt`: the dynamic sentences of coursework, feedback, the limits and the term, in each
  variant, and a played term's notices (brief 14's script, run again on this pass's words, with more cases).
- `screens.mts` → `screens.txt`: the Coursework tab rendered on the server inside the game's own provider, for a life
  played to late September.
- `guide.mts` → `guide-*.txt`: How This Works entries printed field by field with their figures filled in.

## Batch 1: Feedback, The Notes, The Term's Warning, Incompletes And The Coursework Tab

### Sources Reviewed

All of `systems/coursework.ts` (40 sources), `systems/evaluation.ts` (7, one new: `pointsWords`),
`systems/courserecord.ts` (9), `ui/components/CourseworkPane.tsx` (13, one new: `timesWords`), `systems/classmates.ts`
(26), `systems/playreading.ts` (8) and `ui/components/ClassMoments.tsx` (1); and six How This Works entries whose quotes
of these refusals changed, read whole: `coursework.prepare`, `coursework.table`, `coursework.approach`,
`coursework.class`, `productions.plays` and `school.repeat`. 110 sources: 53 rewritten, 57 kept.

### Rewritten

- **The teacher's note** (`chiefLimit`, `conditionWords`, the new `pointsWords`, `show`, `feedbackWords`, `noteText`):
  the working reference's example 2 throughout. The quality and the ability in lower case ("your vocal expression held
  back your execution"), the cost in whole points out of 100, problem first and then the next step ("When it does come
  together, here's what to try next."). A card's part name is quoted as a name ("“Lines” wasn’t complete"); a task's
  own words stay bare ("Learning the lines wasn’t complete"). A note that comes back counts in words to the ninth time,
  says when it was last given, and still says "it's still there", not "it hasn't moved": a recurring note can have
  risen a little, short of `LEARNING.better`.
- **Setting a piece** (`setWork`): the reference's example 3, with "Start with X: this piece puts it first, so it
  counts for more when you show it." after the due date.
- **The showing's notices** (`meetingWeight`, `sinceLast`, `reshownWords`): full sentences for up, down and the same
  band; a piece shown again says its band against the first showing's ("It was Working this time, after Unready the
  first time"); Still There counts the time as an ordinal and says what to do next.
- **A Word On Your Coursework** (`termWarning`): what happened, then what it means against the term review, then the
  cause and what to do. The remedy for the partner part named Rehearse With Your Partner, a step the card never shows as
  a button; it now says "ask your partner for an evening under Rehearsing With, at least two hours ahead, or Run It With
  A Reader" (`remedyWords`), the same on the card's Still to finish and Due Soonest.
- **Partners** (`partnerAsks`, `rehearsalOutcome`, the lapsed ask, `prepareRefusal`'s waits): where to answer, that
  saying no costs nothing, what a no-show means and the two ways on, what an unanswered ask cost.
- **Refusals**: "That piece is finished." for "That work is finished." across `prepareRefusal`, `approachRefusal`,
  `askRefusal`, `school.choose` and `respondRefusal`; the studio and library refusals name Catch Up; Table Work's names
  Table Work; the other refusals given a clear subject.
- **Orientation** (`orient`): the faculty session's semicolon chain as two sentences; course counts in words.
- **Incompletes and Fails** (`courserecord.ts`): the Incomplete's notice names Ask For A Month More; the week's
  reminder offers it only where `extendRefusal` would allow it; "the time to make it up ran out" (it may have been two
  months); the remedy sentences put the player first and the qualification last.
- **The Coursework tab**: forecasts in whole points of 100 ("about 52 of 100"); counts of notes in words; Table Work's
  fine print says "answer" where it meant one; the partner's words labelled as "A summary of your preparation, not
  Theo's own words."
- **Classmates** (`classmates.ts`, `ClassMoments.tsx`): the reference's row 4 ("You and Chloe don't have a scene
  together right now …"), "Your lines for Trifles went from 40% to 55%.", the boundary's lift in words, the word after
  class as encouragement a person would say.
- **Play reading** (`playreading.ts`): "You read Sweat, by Lynn Nottage, all the way through.", "The published cast is
  3 women and 6 men" (a solo play's no longer "1 woman and 0 men"), and the library refusal after the School says you
  can't borrow and why.
- **The six guide entries**: each opening now says what the feature is for and what to press first; "book its make-up
  sessions" (nothing is booked: the button does the session) became "press Make Up A Session"; quotes moved to the new
  words.

### Kept

57 sources, each with its own reason in `docs/text/second-pass/school.json`; a sample is in `retained.md`. Among them:
the bands, Orientation's session names, a classmate's reasons they can't rehearse, the partner's words after a
rehearsal, the classmates' moments and the answer buttons, the course codes.

### Meaning-Sensitive Changes, And How Each Was Checked

- **Put first counts for more.** Read `workContext`: the part put first multiplies the qualities it feeds by
  `LEARNING.objectiveWeight`, so "counts for more when you show it" is true of the result, not only the note. "Most"
  (the reference's word) wasn't used: the weight is relative to the part's own.
- **Points out of 100.** `Limit.by` is the points a limit cost a quality on its 0 to 100 scale (`evaluation.ts`). The
  sentence rounds it; nothing stored changes. Under half a point says "less than a point".
- **Still there, not unmoved.** `recordNote` calls a note recurring when it rose less than `LEARNING.better`, so it
  can have risen.
- **The partner step.** `CourseworkPane` filters the partner's own step out of the card's buttons; `needRefusal` sends
  it to Rehearsing With. The remedy now names that.
- **A no-show.** `rehearsalOutcome`'s `missedByThem` moves none of your trust and none of your preparation: "It isn’t
  held against you, but the scene got no further."
- **An unanswered ask.** `WORK.ask.unanswered` takes 2 of their trust; a declined ask moves nothing.
- **The extension hint.** The week's reminder offers Ask For A Month More only where `extendRefusal` returns nothing,
  the rule that shows the button.
- **The time ran out.** After an extension, the time is two months, so "the month" became "the time".
- **Make Up A Session isn't booked.** `school.make_up` moves the clock by `makeUpMinutes` and counts the session then.
- **The difficulty label.** "How Hard The Piece Is" for "How Hard The Work Is": the label only, its id and kind kept.

### Interactions Read Whole

- A piece set (`setWork`), its steps and each refusal on the card (`prepareRefusal`, Table Work's), Shown Today, the
  showing and its note, the note taken or not at the showing again, Still There, A Word On Your Coursework, then the
  term review's Incomplete and Fail notices. Rendered end to end in `rendered.txt` (a played term) and `screens.txt`
  (the card).
- A partner's request (`partnerAsks`), answered or left (`answerRefusal`, the lapsed notice), the rehearsal, a no-show
  and your own no-show (`rehearsalOutcome`), a class moment, the boundary and Make Amends.
- Reading a play: the tour, the read, read again, research, and the library after the School.

### Tests And Tools Updated

To the new words, as exactly as before (no assertion removed or loosened, no title changed):
`tests/approaches`, `attributes-phase-2b`, `defects-g8-9`, `editorial-school-words`, `editorial-class-moments`,
`evaluation`, `evidence-g18-school`, `evidence-g19-school`, `evidence-g20-school`, `evidence-g21-school`,
`evidence-g22-school`, `evidence-g23-school`, `evidence-g24-school`, `evidence-g26-school`, `evidence-g27-ui`,
`evidence2-b07` (and its doc comment), `evidence2-b09`, `feedback`, `genre-identity`, `genre-identity-screens`,
`interpretation`, `language-dynamic`, `partners`, `playreading`, `remaining-school`, `remaining-school-term`,
`scope-school`, `student-experience`, `table-work-unread`, `whynot-school`, `workload`.

Tool matchers:
- `tools/acceptance-ui.mjs`: the term warning's order and its colon; Shown Today and Due Soonest in whole points of 100;
  "held back your [a-z]" for "held back [A-Z]".
- `tools/playthroughs-ui.mjs`: the same three.
- `tools/brief-journeys.ts`: the points tail it strips from a chief limit.
- `tools/plural-check.mjs`: the Still There ordinal ("for the fourth time") allowed beside the existing one.

### Checks

| Check | Exit |
|---|---|
| `npx tsc -b --noEmit` | 0 |
| `npx eslint` (the changed files) `--max-warnings=0` | 0 |
| `npx vitest run` (the 47 test files above and the guide's) | 0 (every file passed) |
| `node tools/title-case.mjs --check` | 0 |
| `node tools/label-sweep.mjs` | 0 |
| `node tools/plural-check.mjs` | 0 |
| `node tools/voice-check.mjs --check` | 0 |
| `node tools/tics.mjs --check` | 0 |
| `node tools/spelling.mjs` | 0 |
| `node tools/typos.mjs` | 0 |
| `node tools/text-inventory.mjs --check` | 0 (the school area's engine-speak unchanged at 11) |
| `node tools/doc-refs.mjs --check` | 0 |
| `node tools/deciders.mjs --check` | 0 |
| `node tools/guide-quotes.mjs --check` | 0 (581 of 581 said) |

### Screens Verified

`screens.txt`: the Coursework tab of a played life (Orientation, Due Soonest, eight cards with Shown Today, Table Work,
Rehearsing With, Feedback, A Note That Keeps Coming Back). The built app is walked once the area's text is done.
