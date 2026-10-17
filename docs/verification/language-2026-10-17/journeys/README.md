# Brief 14, Journeys: Section 9's Last Three Journeys On The Built App (2026-10-17)

Brief 14's section 9 asks for eight multi-step interface journeys. Brief 13's three playthroughs (`normal`, `setback`,
`specialist`) carry five. This area played the three left: a banking action with a restriction and a pending state, a
document applied for and held, and a health interruption and its consequences. It ran section 9's language checks on
every screen they reach, at 1440 and 390.

Worked in the clone `l14-journeys`, branch `lang14-journeys`, from `d955fa99` (the integration branch with the frame,
tutorial, material, papers and health areas merged).

## The Criteria

`criteria.md`, committed as `859f6ade` before any of it was coded or played. It sets each step, what the screen must
show, and which of the six things it exercises (navigation, a drill-down, an unavailable action's reason, a confirmation,
a notification, save and continue), and section 9's four language checks. What it expected is kept as written. Where a
run differed, it's said below.

## What Was Added

- **`tools/playthroughs-ui.mjs`:** `banking`, `document` and `health`, and the language checks (`language()`), which
  only these three run. Brief 13's three are untouched: their functions, helpers and output are as they were.
- **`tools/scenarios.ts`:** a `health` scenario. It's `brief`'s student, with TEST SETUP a fall forced through the game's
  own `mayHurt`, on the first morning from Saturday 12 September 2026 at nine on which the fall's draw is a sprained
  ankle. It stops right after. On seed sc-0 that's the first morning, at 9:05 AM, mending in 7 days.
- **`tools/scenario-saves.mjs`:** writes `health.json` too, a fifteenth save, in a batch of its own.
- **`src/ui/papers/Documents.tsx`:** the fix for defect 1 (`defects.md`), with `tests/journeys14-idcard-reason.test.ts`.

## How To Run Them

```
npm run build && npx vite preview --port 4209 --strictPort
npx vite-node tools/scenarios.ts -- --scenario roundups --seed sc-0 --save SAVEDIR/roundups.json
npx vite-node tools/scenarios.ts -- --scenario brief --seed sc-0 --save SAVEDIR/brief.json
npx vite-node tools/scenarios.ts -- --scenario health --seed sc-0 --save SAVEDIR/health.json
SLATE_BASE=http://localhost:4209 node tools/playthroughs-ui.mjs banking|document|health 1440|390 SAVEDIR docs/verification/language-2026-10-17/journeys
```

The saves the final runs opened (sha256, first 16 hex digits):

| Save | Its Moment | sha256 |
|---|---|---|
| `roundups.json` | Friday 28 August 2026, 4:50 PM | `d6c1b898115b58bc` |
| `brief.json` | Saturday 12 September 2026, 4:05 PM | `de6a53886f7399ce` |
| `health.json` | Saturday 12 September 2026, 9:05 AM | `b8caf03e7b9cea57` |

## The Runs

All six on `2f50f0f5`, the build served from that tree with nothing uncommitted (each trace's `commit` and
`uncommitted`). Each run's `trace.json` and its milestone screenshots are in `<playthrough>-<width>/`.

| Run | Exit | Steps Passed | The Six, By The Steps That Passed | Language Checks Failed | Recorded |
|---|---|---|---|---|---|
| `banking-1440` | 1 | 9 of 10 | navigation 1, 5, 9; drill-down 5, 10; unavailable 2; confirmation 7; notification 9; save and continue 7 | 0 | 0 |
| `banking-390` | 1 | 9 of 10 | the same | 0 | 0 |
| `document-1440` | 0 | 8 of 8 | navigation 1, 8; drill-down 2, 4; unavailable 4, 8; confirmation 5, 6; notification 7; save and continue 5 | 0 | 5 |
| `document-390` | 1 | 8 of 8 | the same | 1 | 5 |
| `health-1440` | 1 | 10 of 10 | navigation 5, 6; drill-down 2, 3; unavailable 4, 5; confirmation 7, 10; notification 1; save and continue 8, 10 | 1 | 1 |
| `health-390` | 1 | 10 of 10 | the same | 1 | 7 |

No run had a page error or a screen past the right edge, and each exercised all six.

**Why each exit is 1:**
- `banking`, both widths: step 8 failed. One Week, asked on Friday 28 August at 5:30 PM, wasn't asked first. Next
  week's classes weren't on the calendar yet, so On The Way had nothing to list, and the clock ran to Monday's 9:00 AM
  classes and stopped there. Defect 3. Stand Here left the clock waiting, and the rest of the journey played from there.
- `document-390`: the language check after step 7 failed on Home's Calendar, where "Yale Cabaret, Season 59: The Show
  Ends" is cut to one line with an ellipsis. Defect 5.
- `health`, both widths: the language check after step 6 failed on Health Cover's Marketplace paragraph, 279 words in
  one block. Defect 4.

### What They Read

- **`banking`:** Citi Access Checking held $90,469 and Citi Savings $413,043. Moving $91,469 was refused, in a negative
  toast: "Citi Access Checking holds $90,469.". Both balances and the clock were unchanged. Then "Moved $500.", and the
  balances were $89,969 and $413,543. Eat A Meal ($5.00, the first priced item offered) was paid by card. On Statements,
  August 2026 So Far showed Available Now $89,964.00 and Posted Balance $89,989.00. That's $25.00 apart, the three
  pending lines: the meal and two days' groceries. The meal posts September 1, 2026, and its look says it's held against
  the balance and posts that day. Statement Ready went from Off to On. Saved, deleted and kept, and continued, all of it
  read the same. On Wednesday 2 September, Home listed "Statement Ready: Citi Access Checking": "$89,919.00 at the
  close.". August's closing balance was $89,919.00, to the cent, with the meal's line posted.
- **`document`:** Your ID named the Non-Driver Identification Card. Its How This Works opened Passport And ID, then
  followed it to Permission To Work and back, and changed nothing. Get gave "Non-Driver Identification Card: you paid
  $28.00. The card comes October 9, 2026. It’s good until June 14, 2034.", and Chase Total Checking went from $90,297 to
  $90,269. The row then read Being Decided, with nothing issued. Get was grayed, with "One is already on its way." beside
  it after the fix. The look said "You’ve applied, and it’s being decided. It should be ready by October 9, 2026." It all
  read the same after Save & Exit and Continue. One Week's On The Way listed five Drama 50 sessions. After 28 mornings, on
  Saturday 10 October, Home listed "Non-Driver Identification Card Arrived": "It’s in your hands and in force from
  today.". The row read In Force from October 9, 2026 to June 14, 2034. Get was grayed with "You already hold one in
  force.", and the look said "It’s in force until June 14, 2034".
- **`health`:** "A Sprained Ankle": "It takes 7 days to mend, and you can’t work out until then." Its look inside yours
  said "It mends by September 19, 2026. Until then you can’t work out, and it holds back the physical side of your
  work." Work Out was grayed with "Not with a sprained ankle; it has 7 days yet to mend." on its own line. The same words
  grayed Devise The Score (The Body As Source I) and Run It With A Reader (Consent And Intimacy Practice) on Coursework.
  Your Doctor said urgent care costs $0.00, and there was no bill. Tomorrow Morning's On The Way named the 10:00 AM
  work-study shift. The refusal read the same after Save & Exit and Continue. Then 6, 5, 4, 3, 2 and 1 days, and Work Out
  was offered on Sunday 20 September, when your look no longer offered the injury.

### Where An Expectation Differed

Each figure and date the criteria expected was read as expected. Where a run differed:
- The banking journey's step 8 (above) is the game's, not the criteria's: a week asked before Sunday evening isn't asked
  first, or is asked with too few commitments listed (defect 3).
- The document journey's steps 4 and 8 failed on their first run (before `f1705589`), as the criteria said they would
  from the source: the reason was in the tooltip alone (defect 1, fixed).
- The banking journey's first final runs read the posted meal by its amount alone. The month's $5.00 fee matched it, so
  step 10 read the fee's line. `2f50f0f5` reads the meal's line by its day and its words, and every run above is on that
  commit.

## The Language Checks

Section 9's, as `criteria.md` sets them, run after each step and on each look, menu, help and dialog the steps open:

- **Labels broken mid-word:** none, at either width.
- **Controls clipped or overflowing:** one, Home's Calendar at 390 (defect 5).
- **Walls of text (over 120 words):** one, Health Cover's Marketplace paragraph, at both widths (defect 4).
- **Controls with no accessible name:** none, on any screen the journeys reached (Playwright's ARIA snapshot of the page,
  with menus, looks and dialogs open where a step opened them).
- **Recorded, not failed:** five blocks of 80 to 120 words, and six coursework labels on two lines at 390 (`defects.md`,
  Seen, Not Counted As Defects).

## Matchers

Where a journey still matches words, so the coordinator can update them after the money, school and profile merges.
Everything else is found by role, element id or structure: `#bank-tab-*`, `#papers-tab-*`, `#school-tab-*`,
`#move-from`, `#move-to`, `#move-amount`, `#statement-account`, `#statement-period`, Move Money's `button.btn-primary`,
a toast's `data-tone`, `.statement-lines` rows, Your ID's `tbody tr`, the look's classes, `[data-shown-today]` and
`p.why-not`.

**Shared with brief 13's playthroughs** (the frame and tutorial areas' words, already merged):
- the rail by name: Home, Money, Papers, School, and Menu or Toggle Navigation at 390;
- `/^Advance/`, and the menu items `/^Tomorrow Morning/` and `/^One Week/`; a stop's `/^Advance$/` and `/^Go$/`;
- On The Way: the dialog's name, `/passes \w+ commitments?, and the clock stops at each one\./`, `/^Cancel$/`, and
  `/^Stand Here$/` (in the new `askedFirst`);
- `/^Save & Exit$/`, `/^Continue$/`, `/^Delete$/`, Confirm Deletion's name, `/^Delete Slot 1\?/`,
  `/This ends that universe\./`, `/(A backup is kept|This slot has no backup)/`, `/^Keep It$/`, and the slot's
  `/Continue/` and `/New Save/`;
- What Needs You's heading, `/^Show All \d+$/`, `/^Show The Six Most Important$/` and `/^Go There$/`;
- a look's Close by `Close <name>`, its kind read as "notice";
- the Time Controls group, for the clock.

**`banking`** (the money area's words, to merge after this):
- Statements' figures by label: `/Available/i`, `/Posted/i`, `/Closing/i`;
- a pending line by `/Pending/i` in its note, with the day it posts as its date;
- Alerts' `/^Statement Ready:/`, read as `/Off$/`, then `/On$/`;
- the statement's notice by `/Statement/` with the account's name;
- Look After Yourself: `/^Look After Yourself/` and the menu's name; a chip's `/(Needed Now|Most Worth It)$/` taken off
  the label recorded.
- Move Money's From list: the account's name before ` ···`, and its balance as the last amount in the option.

**`document`** (the papers and tutorial areas' words, merged):
- the panel headed Your ID; `/^Get /`; `/In Force/i`, which the pending row must not read; the look's `/Issued/i` stat;
- How This Works by `aria-label^="How This Works:"`, its dialog `/How This Works/`, How It Connects, Help Trail and
  `/^Back$/` (`helpRoundTrip`).

**`health`** (the health, frame and school areas' words):
- the notice `/^A Sprained Ankle$/`, and `/(\d+) days?/` and `/work out/i` in it and in the injury's look;
- How You Are's heading, and the way into the injury by `/Injury/i`;
- `/^Work Out/` in Look After Yourself;
- Your Doctor's and Care And Its Bills' headings, and `/urgent care[^,.·]*?([$£€][\d,]+\.\d\d)/i` in Your Doctor.

Coursework's refusal is matched by Work Out's own words, read on the screen. The fee, the dates, the days and the
amounts are figures the criteria expected, not words.

## Checks

From the clone, on the changes above, each exit read from a file:

| Check | Exit |
|---|---|
| `npx tsc -b --noEmit` | 0 |
| `npx eslint src/ui/papers/Documents.tsx tools/scenarios.ts tests/journeys14-idcard-reason.test.ts --max-warnings=0` | 0 |
| `title-case --check`, `label-sweep`, `plural-check`, `voice-check --check`, `tics --check`, `spelling`, `typos` | 0 each |
| `text-inventory --check`, `doc-refs --check`, `deciders --check`, `wired --check`, `inventory --check` | 0 each |
| `capabilities --check`, `student-matrix --check`, `completion-matrix --check` | 0 each |
| `devmap --check`, `traceability` | 1, then 0 after `--write`: each counts the new test against `documents.apply_idcard` |
| `coverage --check` | 1, and 1 on `d955fa99`'s own tree too (`git archive`, read the same way): "life energy: simulation.test.ts:189-256: line 189 isn’t inside a test". Frame batch 1 (`b6fd1415`) changed that test file, and the audit row still cites the old lines. Not this area's. |
| `npx vitest run` on the eight test files that hold Passport And ID, and the new one | 0: 133 of 133 |
| `npx vitest run` on the five test files that cite `tools/scenarios.ts` or the playthroughs | 0: 79 of 79 |
| `npm run build` | 0 |

The `.mjs` tools aren't in the gate's lint (`eslint . --ext .ts,.tsx`). `tools/playthroughs-ui.mjs` has four lint errors
when linted by name, all four in brief 13's lines as they were (two wall-clock reads for the trace's times, and two
unused names). The new code adds none.

## Outside This Clone

At 20:41 a command meant for this clone ran `npm run build` in `/home/user/1221` instead: a backgrounded shell job lost
its `cd`. It rewrote that checkout's `dist/`, which git ignores, and `node_modules/.tmp/tsconfig.app.tsbuildinfo`. No
tracked file changed. Its output went to `/build.log` at the filesystem's root, which the session's safety check
wouldn't let this area remove. Nothing else there was touched. The coordinator may delete `/build.log` and rebuild that
`dist/` if it matters.

## Commits

- `859f6ade`: the criteria, before anything was coded or played.
- `22b3a302`: the three journeys, the language checks, and the `health` scenario and its save.
- `f1705589`: Your ID's grayed Get says why on the screen (defect 1), with its test, DEVMAP and TRACEABILITY.
- `6da90ba5`: the milestone screenshots scrolled to their panels.
- `2f50f0f5`: the banking journey reads its meal's line by its day and words.
- The record and the six final runs: the commit after these.
