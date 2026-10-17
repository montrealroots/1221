# Brief 14, Journeys: Three More Playthroughs Of The Built App, Written Before The Tool (2026-10-17)

Written on `d955fa99` (the integration branch with five of brief 14's eight writing areas merged: frame, tutorial,
material, papers and health), before any of this was added to `tools/playthroughs-ui.mjs` and before any step below ran
on the built app. What was read to write it: the brief's section 9, the game's source for each screen named below, and
the engine itself, probed with throwaway scripts (not kept): the `roundups` and `brief` scenario saves' starting state
(their date, accounts, balances, documents and what was pending), a transfer and a meal played on the first, an ID card
applied for on the second and the clock run to its arrival, and the injury the `health` scenario sets up, with what it
refuses. Every date and figure below was read there.

## The Owner's Ask, As Written

Brief 14, section 9 (`../../briefs-2026-10-16/14-complete-player-facing-language-and-tutorial-overhaul.txt`):

> Run multi-step interface journeys covering:
>
> * A new player learning the game.
> * Coursework preparation, feedback, and improvement.
> * Attributes, genres, interpretation, and training advice.
> * A school setback and recovery.
> * A banking action with a restriction or pending state.
> * A document application or renewal path actually supported by the game.
> * A health-related interruption and its consequences.
> * Save, exit, and continue.
>
> Check desktop and mobile for wrapping, clipping, overflowing buttons, excessive text walls, and inaccessible
> explanations.
>
> Use stable selectors where possible.

Brief 13's three playthroughs (`../../playthroughs-2026-10-17/interface-criteria.md`, `normal`, `setback` and
`specialist`) carry five of the eight: a new player learning the game, coursework preparation and feedback, attributes,
genres, interpretation and training advice, a school setback and recovery, and save, exit and continue. This file is for
the three nothing plays yet: `banking`, `document` and `health`. They're added to the same tool, which keeps its three as
they are.

## How Each Is Played

As brief 13's are (its "How Each Is Played"), with what changes here:

- **The built app, through its visible controls only:** `npm run build` in this clone, served by `npx vite preview` on
  port 4209. A save `tools/scenarios.ts` wrote is put in the browser's store and opened with Continue. Nothing is called
  on the engine from the tool.
- **Each playthrough at 1440 and at 390 wide,** each width a run of its own: six runs. At 390 the rail is the drawer.
- **One player, in order.** A step that fails is recorded and the run goes on. A failed step fails the run.
- **The trace:** `journeys/<playthrough>-<width>/trace.json`, as brief 13's, with each step's language checks beside it
  (below), and a few milestone screenshots.
- **Stable selectors first.** The money, school and profile areas are still rewriting their words and merge after this.
  So a control is found by its role, its element id or its place in a panel where it can be, and a sentence is checked by
  what it must agree with on another screen (a figure, a date, a name, the same refusal word for word) rather than by its
  wording. Where a word has to be matched, it's listed in `README.md`, Matchers, for the coordinator to update after those
  merges.

## What Exercising Each Of The Six Means

As brief 13's, with one addition for a refusal that only comes when it's asked:

- **Navigation:** moving between screens by the rail (the drawer at 390), by a tab, or by a notice's Go There. The screen
  is checked by its address and a tab by which is selected.
- **A drill-down explanation:** something opened in place to say more (a notice's look, your own look and a look inside
  it, a statement line's look, or How This Works and a connected entry), read, and closed with the screen and the clock as
  they were.
- **An unavailable action's reason:** a control the game refuses now, grayed, with its reason in words on the screen, not
  only in a tooltip, which a phone never shows. Pressed anyway (forced), the clock stays. **Added here:** a command the
  game refuses only when it's asked, as Move It is with an amount typed, counts where its refusal is said in words on the
  screen and nothing changed: the balances and the clock as they were.
- **A confirmation step:** a dialog that asks first, answered the way that leaves things as they were (Cancel, Keep It),
  checked so, then gone ahead where the journey goes on.
- **A notification:** a notice the game sent, read on Home's What Needs You by its title and its words, saying what the
  journey did or what follows from it. A toast alone doesn't count.
- **Save and continue:** Save & Exit, then Continue: the same date and hour, and the journey's own state as it was (named
  in each step).

## The Language Checks (Section 9's)

After each step, on the screen the step ends on, and on each dialog or menu a step opens while it's open, at both widths:

- **A label broken by wrapping:** a word of a control's or heading's label split across two lines (a button, a tab, a menu
  item, a link, a heading, a form label, a column head, a stat's label). It fails. A label that wraps between words onto a
  second line is recorded, not failed: on a phone a long button may need two lines.
- **A clipped or overflowing control:** a button, tab, menu item, select or field past the viewport's right edge outside a
  region made to scroll, or whose words are wider than its box where the box hides the rest. It fails.
- **A wall of text:** one block of running text (a paragraph, a list item, a cell, fine print, a callout) of more than 120
  words. It fails. One of 80 to 120 words is recorded as long.
- **An accessible name missing:** a button, link, tab, menu item, field, list box, check box, radio or dialog with no
  accessible name, as the browser computes it (Playwright's ARIA snapshot). It fails.

Each finding is recorded once per run, with the step and the screen. A finding fails the run, as brief 13's overflows do,
but not the step: the step is about what the game does, and the language check about how the screen reads.

## Playthrough 4: A Banking Action With A Restriction And A Pending State (`banking`)

**The player:** the `roundups` scenario's save, a New Haven student who banks at Citi, a few days into the first fall:

```
npx vite-node tools/scenarios.ts -- --scenario roundups --seed sc-0 --save <dir>/roundups.json
```

No TEST SETUP. Friday 28 August 2026, 4:50 PM. Citi Access Checking holds $90,469 and Citi Savings $413,043 (the
scenario's default wealth). Two days' groceries, $10.00 each, are pending on Checking, posting 31 August and
1 September. The Statement Ready alert is off.

**The steps, in order:**
1. **Money by the rail** *(navigation)*: Money opens at `#/workspace/bank`, its first tab (Accounts, `#bank-tab-accounts`)
   selected; each account's panel shows its balance; Move Money is offered (its amount field, `#move-amount`).
2. **More than Checking holds, refused** *(an unavailable action's reason, the added kind)*: From the current account to
   savings, the current account's balance and $1,000 more typed, Move It pressed. The refusal is said in words on the
   screen, and it names the figure the account holds as its panel shows it. Both balances and the clock are as they were.
3. **A smaller amount, made:** $500 typed, Move It. The toast says what moved; Checking is $500 less and Savings $500
   more, to the dollar; the clock is as it was.
4. **A card payment made:** Look After Yourself, the first item that costs money and isn't refused (expected: Eat A Meal
   or Order In), pressed. Its price is recorded from the menu, and the toast says it's done.
5. **Pending, not available** *(navigation; a drill-down)*: Statements (`#bank-tab-statements`), the current account,
   this month:
   - the figure for what's available now and the posted balance are both shown, and they differ by exactly what's
     pending: the sum of the lines marked pending;
   - the meal's line is marked pending, with the day it posts, and its amount is the menu's price;
   - its line opened in place: its look says it's held against the balance and posts on that same day; Close, the clock
     as it was.
   - **Expected:** the meal and the day's groceries pending, posting Tuesday 1 September 2026.
6. **Statement Ready turned on:** the Alerts panel's Statement Ready, Off, pressed: it reads On. The clock doesn't move.
7. **Save & Exit; Delete asked, Keep It; Continue** *(a confirmation; save and continue)*: the same date and hour; on
   Statements the same lines pending with the same days, the same two figures, and Statement Ready still On.
8. **A week ahead, asked** *(a confirmation)*: Advance, One Week: On The Way names what's on the way; Cancel leaves the
   date and the hour as they were.
9. **To the posting day** *(a notification; navigation)*: each morning Advance, Tomorrow Morning, each stop gone to,
   until the day after the meal's posting day.
   - Home lists the month's statement for the current account (its title names the account), its words giving the
     balance at the close;
   - its Go There opens Money at `#/workspace/bank`.
   - **Expected:** the notice on Monday 31 August's close, read on Wednesday 2 September 2026.
10. **Posted** *(a drill-down)*: Statements, the current account:
    - this month's meal line is no longer marked pending;
    - August's period, chosen from the periods: its closing balance is the figure the notice gave, to the cent.

**Its milestones:** the refusal's toast, the statement with the meal pending, Confirm Deletion, and the statement after
the posting.

## Playthrough 5: A Document Applied For, On Its Way, And Held (`document`)

**The player:** the `brief` scenario's save, a student of the first term living in New Haven:

```
npx vite-node tools/scenarios.ts -- --scenario brief --seed sc-0 --save <dir>/brief.json
```

No TEST SETUP. Saturday 12 September 2026, 4:05 PM. A US citizen who holds no document in the game. Connecticut issues
the card where they live, the Non-Driver Identification Card: $28, by mail in twenty business days, good to a birthday
seven years on. Nothing refuses it.

**The steps, in order:**
1. **Papers by the rail, Passport And ID** *(navigation)*: Papers at `#/workspace/papers`, its Passport And ID tab
   (`#papers-tab-passport`) selected. Your ID names the card in its subtitle, lists no card held, and offers the card's
   Get button, not grayed. The current account's balance is read on Money first, for the fee.
2. **Your ID's How This Works** *(a drill-down)*: its entry opened; a connected entry followed from How It Connects, the
   trail naming both, Back; closed with Escape; the tab and the clock as they were. Reading it changes nothing.
3. **Applied:** the Get button pressed. The toast names the card, the fee, the day the card comes and the day it's good
   until. **Expected:** $28.00, Friday 9 October 2026, 14 June 2034. Money's current account is down by the fee, to the
   dollar.
4. **Applied isn't held** *(an unavailable action's reason; a drill-down)*:
   - the card's row: its status isn't In Force, and it has no day issued;
   - the Get button grayed, its reason in words on the screen; forced, the clock stays. **Expected:** "One is already on
     its way." on the screen. (Read from the source, the reason is the button's tooltip alone, which would fail this.)
   - the card's look, opened from its row: its summary gives the day it should come, the toast's day, and it says you
     don't hold it yet; Close.
5. **Save & Exit; Delete asked, Keep It; Continue** *(a confirmation; save and continue)*: the same date and hour; the
   row's status, the look's day and the Get button's refusal as they were.
6. **A week ahead, asked** *(a confirmation)*: One Week; On The Way names the week's commitments; Cancel leaves the
   clock.
7. **The days to its coming** *(a notification)*: each morning Tomorrow Morning, each stop gone to, Home read, until Home
   lists the card's arrival: its title names the card, and its words say it's in your hands and in force. Its day is the
   toast's day. **Expected:** on Friday 9 October 2026, read on the morning after.
8. **Held** *(navigation; an unavailable action's reason)*: the notice's Go There opens Papers; on Passport And ID the
   card's row reads In Force, issued on the toast's day, running out on the toast's day; the Get button grayed with its
   reason in words on the screen (expected: "You already hold one in force."); the look says it's in force until that
   day.

**Its milestones:** the toast after Get, the row and the refusal while it's on its way, Confirm Deletion, the arrival
notice, and the row held.

## Playthrough 6: A Health Interruption And Its Consequences (`health`)

**The player:** a `health` scenario added to `tools/scenarios.ts` for this playthrough, and its line to
`tools/scenario-saves.mjs`:

```
npx vite-node tools/scenarios.ts -- --scenario health --seed sc-0 --save <dir>/health.json
```

It's the `brief` scenario's student, played by the policy, with **TEST SETUP**: on the first morning from Saturday
12 September 2026 at nine on which a fall would be a sprained ankle, a fall is forced. That's the game's own `mayHurt`
with a chance of one, so the injury, its notice, its bill and its toll are the game's; only that it happens, and when, is
set by hand. The run stops right after it. A sprain is chosen because it keeps a student from working out and from work
on their feet, and mends in days (`content/injury.ts`: 5 to 10). On seed sc-0 that's the first morning, Saturday
12 September 2026 at 9:05 AM, and it mends in 7 days, by Saturday 19 September at 9:05 AM. A Yale Health member's share
of its care is $0.00, so it makes no bill. A work-study shift is at 10:00 AM that day.

**The steps, in order:**
1. **The notice on Home** *(a notification)*: What Needs You lists the injury's notice. Its title is the injury's name
   (expected: A Sprained Ankle), and its words give the days it takes to mend (expected: 7) and what it keeps you from (a
   workout).
2. **The notice opened in place** *(a drill-down)*: its look, a notice; Close; the clock as it was.
3. **Into the injury from How You Are** *(a drill-down)*: How You Are's sentence opened into your own look; its way to the
   injury followed; the inner look is named as the notice is, its summary gives the day it mends (expected: September 19,
   2026) and what it keeps you from, and its trail names your look; a way further in followed (Condition); the outer
   Close shuts them all; the clock as it was.
4. **Work Out, refused** *(an unavailable action's reason)*: Look After Yourself opened; Work Out grayed, its reason in
   words in its own line, naming the injury and the days it has yet to mend (the notice's days); forced, the clock stays;
   the menu closed.
5. **A class's work, refused for it** *(navigation; an unavailable action's reason)*: School by the rail, Coursework: a
   step on the feet on an open piece's card is refused with the same words as Work Out's, word for word, in the card's
   reasons; forced, the clock stays. **Expected:** Devise The Score, and Run It With A Reader on the scene that offers it.
6. **Its care and its cost** *(navigation)*: the notice's Go There opens Papers; Health Cover (`#papers-tab-health`):
   - Your Doctor says where urgent care is had and what it would cost you now;
   - Care And Its Bills lists no bill from the injury's day unless the notice named a share, and where it names one the
     amount agrees.
   - **Expected:** urgent care $0.00 under Yale Health, no share in the notice and no bill for it.
7. **Tomorrow, asked** *(a confirmation)*: Tomorrow Morning; On The Way names the 10:00 AM work-study shift; Cancel
   leaves the clock.
8. **A day on, saved and continued** *(save and continue)*: Tomorrow Morning, On The Way's Advance, Go at each stop; Work
   Out's refusal read; Save & Exit, Continue: the same date and hour, and Work Out's refusal the same, word for word.
9. **The days it mends:** each morning Tomorrow Morning, each stop gone to, Work Out's refusal read: its days never rise,
   and Work Out is offered (not grayed) on the first morning after the day the injury's look gave. Your look then offers
   no way to an injury. **Expected:** Sunday 20 September 2026.
10. **Save & Exit; Delete asked, Keep It; Continue** *(a confirmation; save and continue)*: the same date and hour; Work
    Out still offered; Home's notices as they were.

**Its milestones:** the notice on Home, the injury's look, Work Out refused, the coursework card's refusal, Health Cover,
and Confirm Deletion.

## Where An Expectation Fails

As brief 13's: a step that fails is a defect in the game or an expectation here that was wrong. A defect is recorded in
`defects.md` with what, where and how it was found, and fixed only if it's small, certain and in text, with a test that
fails without the fix; then the run is played again. An expectation that was wrong is said so in `README.md`, with why,
and isn't changed here: this file keeps what was expected before the runs.

## What This Doesn't Cover

- **Decision 4's rows:** none is used. Move Money between one bank's accounts is `bank.transfer`, which isn't one.
- **How the game feels to play:** these runs check that the screens do what they say, in order, at two widths, and that
  they read without broken labels, clipped controls, walls of text or nameless controls. That's not human usability
  approval.
