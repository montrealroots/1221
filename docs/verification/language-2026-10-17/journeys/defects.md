# Journeys: Defects Found Playing Section 9's Last Three Journeys

Found by the `banking`, `document` and `health` playthroughs (`criteria.md`, `README.md`) on the built app at 1440 and
390, and by reading the source behind what they showed. One was fixed, being small, certain and about words on the
screen; the rest are for the coordinator, with where each is and what fixing it would touch.

## Fixed

### 1. Your ID's Get button was grayed with its reason in a tooltip alone

- **What:** once Connecticut's Non-Driver Identification Card was applied for, Papers' Your ID grayed its Get button
  with "One is already on its way." in the button's `title` and nowhere else; once the card came, "You already hold one
  in force." the same way. A phone never shows a tooltip, and brief 13's interface criteria read a refusal as grayed
  with its reason in words on the screen.
- **Where:** `src/ui/papers/Documents.tsx`, `IdPanel`.
- **How found:** the `document` journey's steps 4 and 8 failed at 1440 on their first run: "“Get Non-Driver
  Identification Card” is grayed with no reason on the screen (its tooltip: “One is already on its way.”)", and the same
  with "You already hold one in force.".
- **Fix (`f1705589`):** the refusal stands beside the button, in `idCardRefusal`'s words, as the Social Security panel
  on the same screen already shows its own. No string changed, so the papers area's statuses stand
  (`node tools/text-inventory.mjs --check`, exit 0). `tests/journeys14-idcard-reason.test.ts` renders Passport And ID
  with its tags stripped: before the fix it failed ("expected ' Your Passport U.S. Department of Sta…' to contain 'One is
  already on its way.'", exit 1), after it passes. Both widths' runs then passed both steps.
- **Siblings left as they are:** the same file grays Your Passport's Apply For One, Renew It and Apply Faster
  (`passportRefusal`) and OPT's Apply For OPT and Apply With Premium Processing (`optRefusal`) with the reason in the
  tooltip alone. No journey here reaches a state where they're grayed, so they weren't changed unseen. The same one-line
  fix applies to each.

## Not Fixed

### 2. A Connecticut ID card on its way reads "Being Decided"

- **What:** for a US citizen nothing is decided: Connecticut issues the card and mails it in twenty business days
  (`ID_CARDS['us-ct'].mailedBusinessDays`). The toast says "The card comes October 9, 2026." and the Get button's
  refusal "One is already on its way.", but its row on Papers says **Being Decided**, its look says "You’ve applied, and
  it’s being decided. It should be ready by October 9, 2026.", and the look's Runs Out note says "Being decided". Two
  screens describe one state two ways, and one of them is untrue for a citizen. For somebody not a citizen, SAVE's check
  (ten federal workdays) comes first and the mail after, so "being decided" is true only of the first part.
- **Where:** `STATUS_WORD.pending` in `src/ui/papers/Documents.tsx`; `standingOf`'s pending summary and the Runs Out
  stat's note in `src/ui/looks/papers.tsx`.
- **How found:** the `document` journey's step 4, at both widths (its trace's `said`).
- **Why not fixed:** it's meaning-sensitive, in the papers area's sources (marked Rewritten And Verified), and each line
  serves every document kind: a passport, OPT and a visa are pending in the same words. A change for the card reaches
  kinds this journey didn't play.
- **Proposed:** for a pending ID card, "On Its Way" on the row and "You’ve applied and paid, and the card is on its way.
  It should arrive by October 9, 2026." in its look; the present words kept for kinds that are decided.

### 3. On The Way can't see next week's classes before Sunday evening

- **What:** `planWeek` (`src/engine/systems/school.ts`) puts a week's class days on the timeline on the Sunday before,
  at 6 PM (`WEEK_KIND`). On The Way lists only what's on the timeline (`missedBy`, `src/engine/world/calendar.ts`). So:
  - **Friday:** the `banking` journey asked One Week on Friday 28 August 2026 at 5:30 PM. No On The Way came at all: the
    weekend held nothing yet, and the clock ran to Monday 31 August at 9:00 AM and stopped at Classes. Step 8 fails at
    both widths.
  - **Saturday:** the `document` journey asked One Week on Saturday 12 September 2026 at 4:05 PM. On The Way said it
    "passes five commitments" and listed five Drama 50 sessions; the advance then stopped at ten, each day's Classes and
    its Drama 50 (the trace's `dialogs`). That's a wrong number in a sentence.
- Nothing is missed (the clock still stops at each one and asks Go or Stand Here), but the question asked before a long
  advance doesn't say what it will pass.
- **Where:** `planWeek`'s timing, and `missedBy`, which reads the timeline alone.
- **Why not fixed:** it isn't text. Either the week is planned earlier, or On The Way also reads the timetable's class
  days for the span. Both change what the engine schedules or reads.

### 4. Health Cover's Marketplace paragraph is a wall of text

- **What:** one paragraph of 279 words: "Yale Health covers you while you’re at the School. Public cover depends on your
  income in a month. Medicaid (Medi-Cal in California, HUSKY D in Connecticut) …", through the work rules, the premium
  tax credit and California's mandate. It's on screen in full whenever Health Cover is opened.
- **Where:** `HealthPane`, The Marketplace panel, in `src/ui/workspaces/PapersWorkspace.tsx` (the papers area's file).
- **How found:** the `health` journey's language check after step 6, at both widths (over 120 words in one block).
- **Why not fixed:** another area's marked source, and splitting it takes editorial choices, which the brief's
  progressive detail decides: a short overview first, and the rules and figures behind Sources And Estimates or How This
  Works.

### 5. Home's Calendar cuts an event's title to one line at 390

- **What:** "Yale Cabaret, Season 59: The Show Ends" ends in an ellipsis in Home's Calendar list at 390 wide. Each
  upcoming entry's title sits in a `span.small.truncate`, and `.truncate` is one line by design (`app.css`: "One-line
  labels that should cut off cleanly rather than wrap"). The full title is a press away, in the entry's look.
- **Where:** `src/ui/screens/Home.tsx`, the Calendar panel's list of what's soon.
- **How found:** the `document` journey's language check after step 7, at 390 (a control whose words are wider than it
  where its box hides the rest).
- **Why not fixed:** it's layout, not words, on the frame area's screen. `clamp-2` in place of `truncate` would give a
  long title two lines.

### 6. A covered injury's notice says nothing of its care, or of Call In Sick

- **What:** the sprain's notice reads "It takes 7 days to mend, and you can’t work out until then." With Yale Health
  the share of its care (an urgent-care visit and two sessions of physical therapy, `INJURY_KIND.sprain`) is $0.00, so
  `mayHurt` writes no bill and the notice no sentence about its care, and Papers' Care And Its Bills has no line for it.
  A player can't tell whether care was had, or that it cost nothing. The flu's notice says it: "You didn’t see a doctor,
  so there’s nothing to pay." The flu's notice also says Call In Sick excuses a day of classes; a sprain lets Call In
  Sick excuse the day too (`school.ts`, a doctor's note for an injury whose `limits` isn't `none`), and neither its notice
  nor its look says so.
- **Where:** `mayHurt`'s notice in `src/engine/systems/injury.ts`; the injury's look in `src/ui/looks/wellbeing.tsx`.
- **How found:** the `health` journey's step 6 (no share in the notice, no bill, urgent care $0.00 on Your Doctor), then
  reading `school.ts`'s Call In Sick refusal.
- **Why not fixed:** the health area's merged words, and meaning-sensitive: a covered injury's care isn't recorded
  anywhere, so what the sentence may claim needs that area's reading. Proposed: "Your cover pays for its care." where the
  share is nothing, and "Call In Sick, on School, excuses a day of classes while it mends." beside what it keeps you from.

## Seen, Not Counted As Defects

- **Statements at 390:** each line's amount and the balance after it sit past the screen's right edge inside the
  statement's region that scrolls sideways (`.statement-lines`), so on a phone a line's amount is read only by scrolling
  it. The language check doesn't fail a control in a region made to scroll, and the criteria allow that region. Seen in
  `banking-390/02-statement-pending.jpg`.
- **Long blocks recorded (80 to 120 words):** Passport And ID's How This Works entry (106 words) and Permission To
  Work's (88); the panel for opening an account at another bank (91); A Word On Your Coursework on Home (94); the
  orientation notice on Home (81). Each is in its trace's `language.recorded`.
- **Labels on two lines at 390:** six coursework progress labels in capitals ("The Directions Understood", "Its Context
  Researched" and four more) wrap between words on School's Coursework. Recorded, not failed.
