# Brief 15's Defects

Every defect the pass found, apart from the editorial changes (brief 15, section 12), written by `defects.py` from each area's
`defects.md` and the coordinator's records. Each entry says where its record is. `defects.py --verify` checks that every record
still holds the heading it's indexed by.

74 in all: 66 fixed, 8 left. Every one left is for the owner: each would change what the
game charges, does or keeps, which an editorial pass doesn't (section 9). Two of them are a sentence and the game disagreeing:
Claim It Back and Australia's unclaimed money, where the words state the law and the game does otherwise. That gap is the defect,
and the words weren't bent to match the game.

| Kind | Fixed | Left | All |
|---|---|---|---|
| accessibility | 1 | 0 | 1 |
| behavior | 0 | 3 | 3 |
| data | 0 | 3 | 3 |
| layout | 2 | 0 | 2 |
| unwired | 1 | 2 | 3 |
| words | 62 | 0 | 62 |

## Left, For The Owner

- **Card replacement fees where the bank's own words, in the same data, say otherwise** (data; `content/security.ts`; `money-data/defects.md`, 3. Card replacement fees). Each changes a fee the game charges, and some need a choice (does a faulty card count as lost?); brief 15 changes no charge (section 9).
- **A bank's note about its debit card shown under its credit card** (data; `ui/bank/BankSecurity.tsx, content/security.ts`; `money-data/defects.md`, 5. A bank's note about its debit card). The words now say which card a note is about; a note for each card is a change to the data's shape.
- **Claim It Back gives money back where the country's law says it can't be claimed** (behavior; `systems/accountlife.ts`; `money-data/defects.md`, 7. Claim It Back). A change to what a command does; the words say what the law is.
- **Australia's unclaimed money: any balance goes, where the law takes A$500 or more** (behavior; `systems/accountlife.ts`; `money-data/defects.md`, 8. Australia). A rule change; the words say A$500.
- **Term deposit penalties estimated where the bank publishes a rule** (behavior; `systems/accountlife.ts`; `money-data/defects.md`, 9. Term deposit penalties). The screen labels the figure estimated, so nothing untrue is said; modelling each bank's rule is new work.
- **BMO's notice for a change at the end may be the other way round** (data; `content/accountlife.ts`; `money-data/defects.md`, 10. BMO). A question for the research: which way BMO's terms mean it needs them read again.
- **`residenceRefusal` has no caller** (unwired; `systems/documents.ts`; `papers/defects.md`, 11. **`residenceRefusal`). Removing code is a scope decision, not a writing one.
- **`licensepaths.ts` and most of `licenses.ts` reach no screen** (unwired; `content/licensepaths.ts, content/licenses.ts`; `papers/defects.md`, 13. **`licensepaths.ts`). Deleting them is a scope decision, as in brief 14.

## Fixed

| Area | Defect | Kind | Where |
|---|---|---|---|
| frame | Before Yale said the savings stayed, and that the account kept there opened empty, when neither was true | words | `ui/creation/CharacterCreation.tsx` |
| frame | A search in a country with no towns printed empty quotes | words | `ui/creation/LocationPicker.tsx` |
| health | A body at its mark was told what happens above it | words | its record |
| health | The Morale look contradicted itself at 62 | words | its record |
| health | A lost appeal was titled "Appeal Upheld" | words | its record |
| health | The booking notice named a date and no next step (fixed by the coordinator at the health merge, with the papers guide's quote) | words | `systems/appointments.ts` |
| health | Cambodia's currency was "Riels" (fixed by the coordinator) | words | `tools/build-world-data.mjs, content/world-data.ts` |
| health | A place's "What it's known for" read adjectives as things (fixed by the coordinator) | words | `ui/looks/place.tsx` |
| health | Readiness at its ceiling still named a measure "pulling readiness down" | words | its record |
| material-a | A medical brief said the opposite of its scene | words | `content/briefs/briefs-d.ts` |
| material-a | A brief promised words the pane doesn't show | words | `content/briefs/briefs-c.ts` |
| material-a | A Table Work note gave the reason without the answer it was about (fixed by the coordinator) | words | `systems/coursework.ts` |
| material-b | A brief's circumstances said what its scene doesn't | words | `content/briefs/second-d.ts` |
| material-b | A beat said something its scene doesn't | words | `content/briefs/second-c.ts` |
| material-b | A brief's arc read as the opposite of its scene | words | `content/briefs/second-b.ts` |
| material-b | A brief's arc said the chase was called off where it isn't | words | `content/briefs/second-a.ts` |
| material-b | A brief pane said its arc twice (fixed by the school area) | words | `ui/components/BriefPane.tsx` |
| material-b | One count, two names on one pane (fixed by the school area) | words | `ui/components/PlayingChooser.tsx` |
| money | Two Move Money refusals, and the hint above them, named a limit rounded to whole units | words | `systems/banking.ts, ui/workspaces/BankWorkspace.tsx` |
| money | A charge-off was said to stay on the record "until it's paid" (the glossary row fixed by the coordinator) | words | `ui/bank/BankLending.tsx, docs/GLOSSARY.md` |
| money-data | The US refund law said "out-of-state" for "not initiated within a state" | words | `content/security.ts` |
| money-data | Field names on the screen | words | `content/security.ts` |
| money-data | A rush that costs nothing was said as "$0.00 more" (fixed by the coordinator) | words | `ui/bank/BankSecurity.tsx` |
| money-data | Unclaimed money's destination printed as a clause | words | `content/accountlife.ts` |
| money-data | "Current account" in the game's sentence about a term deposit's end (fixed by the money area) | words | `systems/accountlife.ts` |
| papers | Every passport's arrival said a travel authorization had ended | words | its record |
| papers | A visit's name was lowercased whole, acronyms too | words | its record |
| papers | A missed visa interview promised a step the game no longer has | words | its record |
| papers | A lien only announced, or announced and never filed, said it had been filed and recorded | words | its record |
| papers | A document reported stolen said "You reported it lost" | words | its record |
| papers | The guide said Connecticut's ID card shows Being Decided until it comes | words | its record |
| papers | The Social Security panel said the ITIN "holds up the return for seven weeks" | words | its record |
| papers | The IRS plan panel said a monthly plan "is approved online" | words | its record |
| papers | "Paid by you" under a plan's Each Month, beside "By direct debit" | words | its record |
| papers | A UK tax year "settles on January 31 2028", with no comma | words | its record |
| papers | The US passport's fee basis ended on a fragment (fixed by the coordinator) | words | `tools/build-passports.mjs` |
| profile | The advice sent a technique's exercise to the wrong panel | words | `systems/next-steps.ts` |
| profile | Three of the advice's dynamic variants printed nonsense | words | `systems/next-steps.ts` |
| school | A remedy named a button the card never shows | words | its record |
| school | "Lines wasn't complete." | words | its record |
| school | "By the Close." | words | its record |
| school | "The month to make it up ran out." | words | its record |
| school | A rehearsal "moved" | words | its record |
| school | The library refusal after the School | words | its record |
| school | "1 woman and 0 men." | words | its record |
| school | The guide said make-up sessions are booked | words | its record |
| school | A fit's reason in brackets | words | its record |
| school | "Register on the School screen." | words | its record |
| school | A missed-call warning to a student already out of the pool | words | its record |
| school | "The Standing tab." | words | its record |
| school | "In speech, and accents and dialects." | words | its record |
| school | "1 h 40" in a sentence | words | its record |
| school | "Classes don't count your attendance." | words | its record |
| school | "The savings beside it." | words | its record |
| school | Garbled reasons in What It Asks | words | its record |
| school | "Of the whole piece." | words | its record |
| school | "Classes don't count you." | words | its record |
| tutorial | How This Works' toggle changed its name and said it was pressed | accessibility | `ui/guide/Help.tsx` |
| tutorial | How You Are said an injury wore condition down | words | `content/tutorial.ts` |
| tutorial | A chapter sent the player to a button that isn't there | words | `content/tutorial.ts` |
| tutorial | At 390 wide the top bar broke Locked letter by letter, and the clock covered Guide (fixed by the coordinator, checked on the build (coordinator-phone/)) | layout | `styles/app.css` |
| tutorial | At 390 wide the guide left a long chapter about 250 pixels to read in (fixed by the coordinator, checked on the build) | layout | `styles/app.css` |
| tutorial | A long-term condition left untreated said "Left Alone" (fixed by the papers area) | words | `ui/workspaces/PapersWorkspace.tsx` |
| coordinator | The advice said "off the whole a piece" (crossarea.md; brief 14 wrote it) | words | `systems/experience.ts` |
| coordinator | A leave's notice named a panel where the booking notice names the button and the tab (crossarea.md) | words | `systems/leave.ts` |
| coordinator | The inventory didn't read a citation that began with a web address (omissions.md) | unwired | `tools/text-inventory.mjs` |

## Read And Not Counted

- **Weather emoji on Home** (tutorial): the one picture systems/weather.ts keeps on purpose, beside its word and out of the accessible name; docs/STYLE.md now says so.
- **Functional Defects** (school): the school area found none in its sources.
