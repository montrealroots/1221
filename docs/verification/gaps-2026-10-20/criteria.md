# Brief 18's Acceptance Criteria, Written Before Any Fix, 2026-10-20

The owner's "Close The Remaining Writing And Gameplay Gaps"
(`../briefs-2026-10-16/18-close-the-remaining-writing-and-gameplay-gaps.txt`, kept verbatim) names the issues brief 17
left. Each is here with what closes it, and its status is one of three: **Fixed And Verified**, **Blocked** (with what blocks it and what was
done around it), or **Deferred** (with whose word deferred it). Until its evidence is in, it's **Open**. A line written
in a report closes nothing: each needs the game doing it, and a test that fails with the fix taken out.

Where it started: `main` at `469f8448` (#47), whose game is brief 17's tested `ecd961cc`'s. Nothing was in progress on
any other branch. The baseline for every measure is brief 17's final runs
(`../continuity-2026-10-20/after/`, `runs/`, `journeys-final/`), made on that game.

## Held For Every Item (Section 10)

- The five course voices and three director voices; the incident-based apology fix; the advice card short, with its
  reasoning behind the disclosure; attribute and genre balance; save compatibility (the schema moves only with a
  migration and a test); Title Case; desktop and mobile navigation from the keyboard.
- Text selection draws no randomness: the words are chosen from the record, never from the game's random draws.
- Delivered feedback is kept as delivered, and reads the same after a save and a load.
- An authorized change to play states the downstream difference it makes. The words changing alone changes no play.

## The Items

| ID | Section | Issue | Closed when | Status |
|---|---|---|---|---|
| W1 | 2 | The patient voice says a choice note put right and slipped again two ways, which repeat within a course's last five (30 of brief 17's 253) | The message reads its record: a slip that keeps happening is said as continuing, in a short reminder after the first full one, with the piece, the part's figure and the history; read in sequence in the runs; the count of its repeats falls without a variant that says nothing new | Open |
| W2 | 2 | The exacting voice counts a note given often one way ("Note 14 on rehearsal.", 14 of 253) | The same, in the exacting voice | Open |
| W3 | 2 | Openings repeated in a course's last five rose from 229 to 253 | Each of the 253 classed as justified (the same finding still true, said as the same) or avoidable; every avoidable class fixed at its source and shown in sequence; the measure run again on the same 24 students | Open |
| P1 | 3 | The Profile's Dispositions line is one sentence of seven clauses | Rows or short sections, one a disposition, each with its name, its value and what it actually does, the working behind a disclosure; read at 1440 and 390; reached and opened from the keyboard | Open |
| P2 | 3 | The fatigue label comes from one piece | It reads the state that holds fatigue, not one piece's record; a test where the two differ | Open |
| P3 | 3 | The milestone detail shows band keys | It says the bands' names | Open |
| P4 | 3 | "Fine" always has "Sources And Estimates" as its summary | Its summary says what it holds | Open |
| T1 | 4 | Blocking, understudy and off book aren't explained where they're met | A short explanation where each is met, with a way to the guide; the glossary has each; any other acting term the review finds unexplained | Open |
| T2 | 4 | ASCII place and currency names (Aland Islands, Curacao, Riels) | The verified names with their diacritics; the ids unchanged; a save from before opens and reads them | Open |
| T3 | 4 | Tutorials quoting what changes | Every quote of a changed control or behavior is the final one (`tools/guide-quotes.mjs`, the tutorial's follow) | Open |
| S1 | 5 | Skip It and Call It Off do different things to a jump | What each does to the jump is defined, said where it's offered and tested; neither moves time on, skips another commitment or leaves the jump half done | Done in brief 19 (D1 to D5), see docs/verification/career-2026-10-20/time/REPORT.md |
| S2 | 5 | Tomorrow Morning pressed at 2 AM skips the coming morning | It goes to the next time the morning shown comes, and says the day and time before it's pressed | Done in brief 19 (D1 to D5), see docs/verification/career-2026-10-20/time/REPORT.md |
| S3 | 5 | Sleep at 7:15 suggests 8 hours | The suggestion comes from the sleep model, the player's state, the time and what's next on the calendar; any length can still be chosen | Done in brief 19 (D1 to D5), see docs/verification/career-2026-10-20/time/REPORT.md |
| S4 | 5 | The Sleep dialog doesn't hold the clock | The clock is held while it's open, and Cancel and Sleep leave it as the game's other dialogs do | Done in brief 19 (D1 to D5), see docs/verification/career-2026-10-20/time/REPORT.md |
| S5 | 7 | Banking's journey step 8 (brief 14's `journeys-3`): One Week from a Friday evening doesn't ask On The Way first | Found to be the game's or the check's; the side at fault fixed; the check as strict as it was meant to be; banking 10 of 10 at both widths | Done in brief 19 (D1 to D5), see docs/verification/career-2026-10-20/time/REPORT.md |
| H1 | 6 | The flu holds back more than the Profile says | The Profile says what the engine applies, read from the same rule | Open |
| H2 | 6 | No notice says an injury has mended or the flu has passed | One notice per recovery, saying what's lifted and what still holds where another condition does; played through onset, care, recovery, two at once, a long jump and a save and a load | Open |
| H3 | 6 | The fitness look's words below 35 don't match what the game does | The words say what the game does there | Open |
| B1 | 7 | Missed card payments: the notices count misses while the mechanics run a cycle off Reg Z's sixty days and the FFIEC's 180 | The penalty rate, notices and charge-off on the days the researched rules give, each jurisdiction the game models; sources and dates recorded; what the game assumes said as an assumption | Open |
| B2 | 7 | A card's first year's yearly fee can be skipped | The fee charged as the product's terms say, a real introductory waiver kept; charged once through reloads and long jumps | Open |
| B3 | 7 | No notice warns before an overdrawn account is closed | A warning with the deadline and what the player can do, before the closing | Open |
| B4 | 7 | Card liability in Japan, Korea, the US and Canada: the game's charge and the law the text gives differ (brief 16) | Each researched; the game's charge made the law's, or the difference stated as a documented assumption | Open |
| B5 | 7 | Card replacement fees (brief 15's money-data) | As B4 | Open |
| B6 | 7 | Claim It Back offered where the law says the money can't be claimed (brief 15) | Offered only where it can be | Open |
| B7 | 7 | Australia's A$500 (brief 15) | As B4 | Open |
| B8 | 7 | Term deposit penalties (brief 15) | As B4 | Open |
| B9 | 7 | BMO's notice (brief 15) | As B4 | Open |
| X1 | 8 | Catch Up clears a plan put in default by new tax, where CP523 asks for a revision | The action the IRS's process gives is the one offered, researched and dated | Open |
| X2 | 8 | California counts a new balance as a missed payment and says the bank failed to pay | The rule researched; the game and its words made to agree | Open |
| X3 | 8 | A 1040-NR return lists an interest line | Which interest a nonresident reports, and where, researched; shown as the law says | Open |
| X4 | 8 | The IRS short-term plan takes the installment agreement's penalty rate (brief 16) | Researched and made right | Open |
| X5 | 8 | The missed state-plan notice's figures and two refusal periods are copied into prose (brief 16) | Read from the rule the simulation uses | Open |
| U1 | 9 | An understudy "in the company" goes on in no named part | The part they cover is the cast part, named in the casting, the call, the calendar, the preparation, the judging, the record and the feedback | Open |

## Deferred, And Kept So

- **Decision 4's rows** (brief 10): deferred by the owner; untouched.
- **Previously deferred scope:** the 40 rows the matrix holds Explicitly Deferred; no removed system restored, and
  nothing of a professional career begun.
- **The dead content** (`licensepaths.ts`, most of `licenses.ts`, `residenceRefusal`): its deletion is the owner's
  (briefs 14 and 15). This brief doesn't ask for it.
- **ST6-R2.e:** the owner's question since brief 13. This brief doesn't ask it.
- **An apology's timing** (brief 17, the coordinator): its chance is the classmate's, unchanged; its words say how late.
  This brief doesn't ask for it.
