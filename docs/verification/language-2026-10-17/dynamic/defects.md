# What The Dynamic Cases Found

Brief 14's dynamic cases (sections 7 and 8). Each variant below read wrong when a real generator or screen was run in
it by `tests/language-dynamic.test.ts`. Each was fixed in its template, keeping what it means and the owning area's
words (`docs/text/statuses/<area>.json` names the area), and its source re-marked through `tools/text-inventory.mjs`
with `--by` that area and `--evidence` naming the test. None changed a rule, a figure, a draw or a save's shape: each
was a count's noun, a date's form, a minus sign, or a variant the sentence had no words for.

## Fixed

| # | Source (area) | Variant | Read | Reads now |
|---|---|---|---|---|
| 1 | `src/ui/looks/classmate.tsx#top` (school) | one rehearsal asked | “Came to 1 of 1 rehearsals with you” | “Came to 1 of 1 rehearsal with you” |
| 2 | `src/ui/looks/classmate.tsx#top` (school) | a boundary one kept rehearsal from lifting | “Wants a day’s notice: that lifts after 1 more rehearsals kept.” | “… after 1 more rehearsal kept.” |
| 3 | `src/ui/components/CourseworkPane.tsx#Partners` (school) | the same, on Your Partners | “Wants A Day’s Notice (Until 1 More Rehearsals Are Kept)” | “(Until 1 More Rehearsal Is Kept)” |
| 4 | `src/ui/workspaces/SchoolWorkspace.tsx#StandingPane` (school) | the first day of classes, and one call or shift | “Attendance counts 1 of 1 class days, …” | “Attendance counts 1 of 1 class day, …”, and “1 call”, “1 assigned shift” at one |
| 5 | `src/ui/workspaces/SchoolWorkspace.tsx#CoursesPanel` (school) | a course met once | “Acting I: at 1 of 1 classes.” | “Acting I: at 1 of 1 class.” |
| 6 | `src/ui/workspaces/SchoolWorkspace.tsx#CoursesPanel` (school) | an Incomplete owing one session | “Acting I, Incomplete: 1 of 1 make-up sessions left, by …” | “… 1 of 1 make-up session left, by …” |
| 7 | `src/ui/papers/Documents.tsx#PassportPane` (papers) | the entry rules' fine print | “Researched 2026-09-29.” | “Researched September 29, 2026.” |
| 8 | `src/ui/papers/Documents.tsx#TaxIdPanel` (papers) | a Social Security number's fine print | “read 2026-10-10.” | “read October 10, 2026.” |
| 9 | `src/ui/workspaces/PapersWorkspace.tsx#ReturnsPane` (papers) | a return's lines that take away | “Withheld From Your Pay And Pension -$1,961.96” | “… −$1,961.96”, the minus sign Money writes |
| 10 | `src/ui/workspaces/PapersWorkspace.tsx#ReturnsPane` (papers) | a return with nothing owed or due back | “Your Refund $0.00” | “Nothing Owed Or Due Back $0.00” |
| 11 | `src/ui/screens/Home.tsx#Home` (frame) | overdrawn, and a worth below nothing | “Chase Total Checking: -$41.10. Worth -$41.” | “Chase Total Checking: −$41.10. Worth −$41.” (the health area found the worth, coordinator's list) |
| 12 | `src/ui/looks/money.tsx#accountBody` (money) | an account's Balance, overdrawn | “Balance -$41.10” | “Balance −$41.10” |
| 13 | `src/ui/looks/money.tsx#accountSentence` (money) | a card paid past what it owed (`finance.pay_card` with an amount) | “You owe nothing on it at Chase, and the whole $21,739.00 limit is free to use.”, beside Left To Spend $21,789.00 | “You owe nothing on it at Chase, and it holds $50.00 of your money on top of the whole $21,739.00 limit.”, the card panel's own “of your money” |
| 14 | `src/engine/systems/experience.ts#recommendations` (profile) | a preparation, condition, stamina or misfit cost that rounds to one | “Coming to your work short on lines cost about 1 points off the whole a piece.” | “… about 1 point off the whole a piece.” |
| 15 | `src/engine/systems/experience.ts#recommendations` (profile) | one of the recent pieces calling on an ability | “(1 of your last 12 pieces call on it …)”, “(1 of the pieces call on it)” | “(1 of your last 12 pieces calls on it …)”, “(1 of the pieces calls on it)” |

How each was found: rehearsals, class days, classes, sessions, points and pieces at one (bullet 1); the dates by the date rule on the
Papers screens (bullets 1 and 3); the minus signs by the render check's “money written oddly” on Home, the account
look and the return (bullet 7); the card's credit and the zero return by running the balance at each sign (bullet 7).
Money already wrote an overdrawn balance with “−” on the Bank screen and its statements (`BankWorkspace.tsx`
`balanceOf`, `BankStatements.tsx`); these follow it.

Nine older tests held the words of 4, 6, 11, 14 and 15 and now hold the new ones, as exactly:
`tests/evidence-g21-school.test.ts` (4, “0 of 1 assigned shift”), `tests/evidence-g25-school.test.ts`,
`tests/evidence-g26-school.test.ts` and `tests/evidence2-b09.test.ts` (6), `tests/evidence2-b12.test.ts` and
`tests/evidence-g33-ui.test.ts` (11), `tests/scope-money.test.ts`'s own money formatter (11),
`tests/attributes-phase-2b.test.ts` (14: its regexes take “1 point” and any other figure's “points”, and no longer
“1 points”) and `tests/decisions-advice.test.ts` (15). No test title changed. 14 wasn't only possible: the played journey
in `tests/attributes-phase-2b.test.ts`, takes played a way the scene doesn't allow, came to exactly one, and read
“cost about 1 points” until this pass.

One more, outside the dynamic cases: the main tree's `961b3f08`, merged here, wrote a comment in `ui/looks/wellbeing.tsx`
with two straight apostrophes (“didn't”, “flu's”), and `tests/looks.test.ts` “writes the apostrophe the house writes”
reads every line of the looks, comments too. The comment now has the typographic ones; nothing a player reads changed.

## Recorded And Left

The first two below, the research data's dates and Chase's semicolon, were settled after this record by the data pass
(`data/`, merged `a5c167ff`); "Left the school" and the durations by `20f2757e`. They're kept here as they were found.

- **The research data's own dates, in fine print.** 306 strings in the inventory hold an ISO day, and some a British one,
  as their source wrote it: “Source: chase.com …, 2026-09-26”, “(read 2026-10-10)”, “tariff updated 2026-06-13”,
  “£116.50 from 8 April 2026”. They're the money, papers and health areas' reference data (`content/banks-*.ts`,
  `content/passports.ts`, `content/entry.ts`, `content/cards.ts`, `content/roundups.ts` and others), printed as a
  source line under what they explain. The two above that were a template's own words were fixed; the rest are data,
  and rewriting each to the game's date form is a pass over those areas' data, for the coordinator to give them. The
  test holds the date rule on every sentence a generator writes, and on the screens whose fine print isn't data.
- **A space before a semicolon in a card's source.** `content/cards.ts`, Chase's: “…/LGC61498.html ; minimum-payment
  formula from …”, on the Cards tab's fine print. The money area's data.
- **“Left the school” and “Left the School.”** Home's School line and the Profile's School Journey say “Left the
  school”; the School screen says “Left the School.”, and the notices say “the School”. Two test titles quote Home's
  form (`tests/evidence-g33-ui.test.ts`, `tests/evidence2-b12.test.ts`), and titles don't change, so the coordinator
  settles the one form.
- **A duration in a sentence as a clock writes it.** The question look says “That’s in 15h 59m.” and “It came up 2d
  3h ago” (`formatDuration`, the frame area's choice, the Calendar's form). Sound by every rule here, and terse for prose.
- **The advice's item names its label twice.** “An Injury Still Mending. An Injury Still Mending cost about 1.5 points
  off the whole a piece.” on the Profile's What To Work On Next: the label, then a sentence opening on it. The profile
  area's words, and true.
