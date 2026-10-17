# The Cross-Area Pass: Defects The Areas Couldn't Settle Alone

Brief 14 (the owner's "Complete Player-Facing Language And Tutorial Overhaul"), 2026-10-17, on branch `lang14-xcode`
after all eight writing areas were merged (`1c3157d4`). The brief, section 6: "If the sweep reveals a real functional
defect, record it separately, fix it where authorized and necessary, and test the behavior." The areas found five they
couldn't settle inside their own files, listed in `coordinator.md` ("Defects Raised Outside Any One Area's Reach") and
in their `defects.md`. Each is here: what it was, how it was confirmed, the fix, the test, and the mutation run.

The tests are in `tests/language-crossarea.test.ts`. Each fix was shown to matter by putting the code back as it was
once and running its test, which failed; then each claim the test protects was mutated, one mutation at a time, by a
harness that applies it, runs the test file and restores the source byte for byte. A mutation the test doesn't fail
"survived", and each survivor is said here with what it means.

## 1. The live clock stopped without a word when a tick threw

- **What:** `src/app/game-context.tsx`, the real-time tick's `catch`. When a move of the live clock threw, the tick set
  `stopped`, cleared its interval and said nothing. The save's speed stayed `live`, so the top bar kept offering Pause
  on a clock that no longer moved, until a reload or a press of Pause and then Play (frame `defects.md` 1). The Advance
  menu's and Skip To Event's moves already toasted the fault (`CLOCK_FAULT`); the tick's was the one way of moving the
  clock that didn't.
- **Confirmed:** reading the code, then the test below on the code as it was: a reactor of time's passing that throws
  on the fourth second's move left `timeSpeed` at `live` (`expected 'live' to be 'paused'`), with no toast.
  `advanceTo` throws on a reactor's error, on re-entry and on a move backwards; a scheduled item's handler is caught
  inside it, so a reactor is what reaches the tick's `catch` on a played life.
- **Fix:** the `catch` keeps stopping the tick, and now also logs the error to the console, pauses the save through
  `world.set_preferences` (as `halt` pauses it at something that wants the player), toasts `LIVE_CLOCK_FAULT` in the
  negative tone, and bumps the provider's version so the screens read the clock where it stopped. The words are new,
  in the frame area's voice for a clock that threw (`CLOCK_FAULT`), with the bar's own Play named as the way to try
  again: "An error in the game stopped the clock, so it’s paused. Anything that happened before it stopped still
  stands. You can press Play to try again." A repeated failure isn't a loop: the tick doesn't retry on its own, and
  each press of Play is one more try that, failing, pauses again with one more toast. `toast` joined the effect's
  dependencies (it's stable, so the effect runs no more often).
- **Test:** `tests/language-crossarea.test.ts`, "PLAYER JOURNEY: a tick that throws pauses the save, says so once, and
  the top bar offers Play; Play pressed is one more try, a second failure pauses it again with one more toast and no
  loop, and a third press runs the clock". The real `GameProvider` in a real React root with faked timers, as
  `tests/evidence2-b01.test.ts` holds it; the bar drawn under the real provider. It holds: the clock where the throwing
  move left it, a second tick before React draws the pause moving nothing, the screens' `useWorld` reading the stopped
  clock, the save paused, one toast word for word, the error in the console, a minute on nothing moved, the bar saying
  Play and not Pause; Play again failing again, two toasts in all and nothing more a minute on; Play a third time with
  nothing wrong running the clock a second a second with no more toasts.
- **Shown failing without the fix:** the file put back as `1c3157d4` had it: `expected 'live' to be 'paused'`, exit 1.
  With the fix, exit 0. The neighbouring provider tests (`tests/evidence2-b01.test.ts`,
  `tests/language-frame-ui.test.ts`) pass with it, 24 of 24.
- **Mutation run** (eight mutations, all killed):

  | Mutation | Result |
  |---|---|
  | No pause in the `catch` | killed: `expected 'live' to be 'paused'` |
  | No toast | killed: no toast shown |
  | The toast's tone neutral | killed |
  | The frame's other words (`CLOCK_FAULT`) | killed |
  | No `stopped` and no `clearInterval` (the pause's own effect cleanup left to stop it) | killed: the second tick, before React drew the pause, moved the clock a second |
  | No version bump | killed: the screens read the clock a second short of where it stopped |
  | No console line | killed |
  | Keep ticking after a throw: no stop and no pause, only the toast | killed |

- **Text status:** `src/app/game-context.tsx#LIVE_CLOCK_FAULT`, new, marked Rewritten And Verified `--by frame` with the
  test as its evidence. `#GameProvider`'s strings didn't change.

## 2. The IRS's decision on a payment plan read its refusal's words

- **What:** `src/engine/systems/taxreturn.ts`, the `TAX_PLAN_DECIDE_KIND` handler. It set the pending plan's status to
  refused, asked `planRefusal`, set it back, and refused the plan only where the refusal didn't match
  `/payment plan|application/`. The match was meant to skip the refusal that names the plan's own application. That
  was logic keyed on the player's words: a rewording of any refusal the decision can reach would have changed what the
  IRS decided (papers `defects.md` 4).
- **Confirmed:** reading every sentence `planRefusal` can return. With the status flipped, the held-plan sentences
  ("Your application is already with the IRS. …", "You already have a payment plan with the IRS.") can't be reached;
  the four it can reach ("You owe the IRS nothing.", the unfiled return's, the short-term limit's and the Simple
  Payment Plan's) don't match, the last only because the match is case-sensitive and "Payment Plan" is capitalized. So
  with today's words the match never fires, and it never has: `git log -S` finds it first in `7e44117b`, with the
  status flip beside it. Then the words mutation below: a refusal reworded to contain "payment plan" or "application"
  made the old decision approve a plan it should have refused.
- **Fix:** `planRefusal` takes the plan being decided (`deciding`), which is its own application, not a plan held
  against it: `const held = person.taxPlan !== deciding ? person.taxPlan : undefined`. The decision passes its plan
  and refuses on any refusal, with no status flip and no match. The application and the Papers screen call it without
  `deciding`, so they're unchanged. Its strings are unchanged too (the inventory writes a template's expression as
  `{…}`), so no source of text went Pending.
- **Test:** `tests/language-crossarea.test.ts`, describe "the IRS’s decision on a payment plan", pinning every case
  of the decision on a played life (a New Yorker with $60,000 of 2026 wages, her return filed unpaid on 1 February
  2027, $9,614.89 owed), with what the refusal said just before the answer:
  - approved: a monthly plan, its $29 fee charged once, and a short-term one with none, each while the refusal named
    its own application ("Your application is already with the IRS. …");
  - refused, each in its own words and its notice: nothing owed by the answer (paid on Papers in between), a 2025
    return past due and unfiled (FIXTURE), a balance past $50,000 on a monthly plan and past $100,000 on a short-term one
    (FIXTURE: tax added by hand, as a processed amendment would add it), and a $29 fee the emptied bank can't cover;
  - answered nothing: a plan not waiting on the answer (FIXTURE: its status set to refused, or active).
- **Pinned before and after:** the three tests passed on the code as it was (4 of 4 with item 1's) and pass with the
  fix; the nine files that hold the plan (`language-crossarea`, `defects-g8-7`, `finance-paths`, `remaining-tax`,
  `evidence-g17-papers`, `scope-taxpapers`, `guide-examples-papers`, `state-tax`, `defects-g8-8`) pass 121 of 121.
- **Shown failing without the fix:** reverting the fix alone fails nothing, which is what "the same outcomes in every
  case" means: with today's words the old decision and the new agree. What the fix changes is that the outcome no
  longer depends on the words, so it's shown with the words changed:

  | Mutation | Fix in | Fix reverted |
  |---|---|---|
  | "You owe the IRS nothing." reworded "…, so there’s no payment plan to set up." (source and pin) | passes | killed: the plan approved with nothing owed |
  | The unfiled refusal reworded "…File it before your application." (source and pin) | passes | killed: the plan approved with a return unfiled |

- **Mutation run** of the fix (all killed): the decision not naming its plan (every plan refused as its own
  application); `planRefusal` ignoring `deciding` (the same); `planRefusal` taking every plan as the one decided (the
  application no longer refuses a second plan: killed by `tests/evidence-g17-papers.test.ts`, "You already have a
  payment plan with the IRS."); the decision refusing nothing; the decision's pending guard dropped (a plan set refused by
  hand was decided anyway, and approved).

## 3. The card limit's 700 was typed in three places beside its constant

- **What:** the score a raised card limit needs. The six-monthly review read `RAISE_FROM` (700, private to
  `src/engine/systems/credit.ts`). A raise asked for (`card.request_limit`, `src/engine/systems/cardlife.ts`) tested
  `credit.score < 700`, its Limit Increase Declined notice typed "a credit score of 700 or more", and the guide's card
  entry (`src/engine/content/guide/money.ts`, `bank.card`) typed 700 in A Limit Review and in Ask For This Limit (money
  `glossary.md`, For The Coordinator). The guide's header said its card limits were written as text. A change to the
  rule would have left the ask, the notice and the guide on the old figure.
- **Confirmed:** `grep` of the score-and-limit 700s in `src/`: those four, and the review's constant. Nothing else
  says it (`credit.ts`'s header names 700 as the review's figure, still true).
- **Fix:** `RAISE_FROM` exported from `credit.ts`, with a comment saying who reads it; the ask's test, its notice and
  the guide's two lines read it. The value is the same, so nothing a player sees or meets changed. The guide's header
  says the score a raise needs was text until 2026-10-17. Two sources of text changed (700 became `{…}`) and went
  Pending; both were marked again Rewritten And Verified `--by money`, with their old evidence and the new test.
- **Test:** `tests/language-crossarea-raise.test.ts`, "is one figure: moved, a raise asked for a point under it is
  declined and the notice says the moved figure, at it the raise is granted, and the guide says the moved figure for the
  ask and the six-monthly review". In a file of its own because it moves `RAISE_FROM` to 720 for every module that
  imports it (a mocked module): a figure that only agreed with the rule by being typed the same can't pass. On a new
  New Haven life with its Chase card: at 719 the raise is declined and the notice says 720 word for word; at 720 it's
  granted; the guide's two lines say 720, and no 700 is left in the card entry. The real 700 stays pinned word for word
  by `tests/evidence-g12-money.test.ts`.
- **Shown failing without the fix:** `cardlife.ts` and `guide/money.ts` put back as they were, with the constant
  exported: the raise asked at 719 was granted (`expected { limit: 6531700, granted: true } to deeply equal { limit:
  6521700, granted: false }`), exit 1. With the fix, exit 0; with the money and guide tests beside it
  (`evidence-g12-money`, `evidence-g13-money`, `language-money`, `guide`, `help-mechanics`, `guide-examples-money`),
  119 of 119.
- **Mutation run** (five mutations, all killed): the ask's check typed 700; the notice typed 700; the guide's review
  line typed 700; the guide's ask line typed 700; the ask's boundary moved from `<` to `<=` (a score at the figure
  declined).

## 4. The gazetteer's stray spaces

- **What:** `src/engine/content/world-data.ts`, `COUNTRY_TABLE`, parsed by `rows()`, which split on tabs without trimming.
  Three fields carried a stray space to the screen (health `defects.md` 7): Bonaire's name
  ("Bonaire, Saint Eustatius and Saba ", so a sentence ending on it had a space before its stop), Curacao's capital
  (" Willemstad", which the country look mostly hid by finding the city through `CITIES.byName`), and Heard Island's
  dialling code (" ", which the country look printed as a Calling Code of "+ " where it means none).
- **Where the data is built:** `tools/build-world-data.mjs` from the GeoNames dumps (`countryInfo.txt`,
  `admin1CodesASCII.txt`, `cities1000.txt`), copying each field as GeoNames spells it; it emits `world-data.ts`,
  tables and parse, and the file says not to edit it by hand. The dumps aren't in the repository or this container, so
  the file can't be regenerated here.
- **Whether anything compares these strings:** no. Every reader of a country's `name`, `capital` and `phone`
  (`content/geography.ts` builds `COUNTRIES` from it) prints it; a name is looked up through `Registry.byName`, whose
  `normalise` already trims; `world/place.ts` compares a region's name with its country's, and Bonaire's regions are
  Bonaire, Saba and Sint Eustatius; ids come from slugs, which keep no spaces. The countries are sorted by name at build
  time, and Bonaire stays between Bolivia and Bosnia. A script reading every field of the three tables found these three
  and no other: none of the 3,865 regions or the 1,365 bundled cities, and none of the 248 `public/geo/*.tsv` files.
- **Fix, at the source the game reads:** the parse trims every field,
  `line.split('\t').map((field) => field.trim())`, in the generated file and, the same four lines, in the builder's
  template, so a regeneration emits it (checked: the builder's lines, unescaped as its template emits them, equal the
  file's). The tables keep GeoNames' bytes. The builder's read of the dumps wasn't changed: trimming there could change
  which rows it keeps (a code with a stray space in a row the bundle doesn't show), which can't be checked without the
  dumps. No source of text changed; the health area's status for `COUNTRY_TABLE` was marked again `--by health` with
  its reason brought up to date (three fields, trimmed at the parse).
- **Test:** `tests/language-crossarea.test.ts`, "holds no field that starts or ends with a space in any country, region
  or bundled city; Bonaire’s name, Curacao’s capital and Heard Island’s dialling code read as they should, on the
  country look too": no field of the three tables starts or ends with whitespace; the three read "Bonaire, Saint
  Eustatius and Saba", "Willemstad" and ""; on the country look, Bonaire's name and its money's line, "The capital is
  Willemstad.", Heard Island's Calling Code "Not On File", and Curacao's "+599".
- **Shown failing without the fix:** the parse without the trim: the three fields listed, exit 1. With it, exit 0;
  `npx vite-node tools/geo-check.mjs` holds, and the geography tests (`cohesion`, `geography`, `world-map`,
  `citizenship`, `looks`, with this file) pass 104 of 104.
- **Mutation run:** the trim taken out, killed; `trimStart` only, killed (Bonaire); `trimEnd` only, killed (Curacao); a
  lone space kept, killed (Heard Island). One survived: trimming the country table alone, leaving the regions and the
  cities untrimmed. On today's data trimming those two changes nothing, since none of their fields has a stray space.
  The trim stays in the one parse all three tables share: confining it to the country table would need a second parse
  to change nothing, and the builder emits all three through it, so a regeneration that brings a stray space to a
  region or a city is trimmed too.

## 5. The guide's `next` was optional, and nothing asked it of an entry

- **What:** `src/engine/content/guide/types.ts` declared `next?: readonly string[]`, the tutorial's seventh question
  (what to do next), optional while the areas wrote it entry by entry; `src/ui/guide/Help.tsx` read it as
  `e.next ?? []`, so an entry without it showed no What To Do Next and nothing said so. The coordinator's list asked
  that `tests/guide.test.ts` require it of every entry once every area was merged, with `next: []` and a reason in the
  area's batch record for an entry that has nothing to do next.
- **Confirmed:** every one of the 70 entries in `GUIDE` has `next` (a script over `GUIDE` after the merge). Two are
  empty, and each has its reason in the papers area's `batches.md`: `documents.residence` ("because moving abroad
  isn't part of the game") and `papers.pensions` ("because no life reaches a pension's age in the game's span"). No
  entry lacks it, so there's nothing to list for the coordinator.
- **Fix:** `next: readonly string[]` is required, its comment saying it was optional until every area was merged;
  `Help.tsx` reads `e.next` without the fallback. No string changed.
- **Test:** `tests/guide.test.ts`, "gives every entry what to do next, and leaves it empty only where a batch record of
  brief 14 says why": every entry's `next` is an array with no blank step, and every entry whose `next` is empty is
  named in a batch record of `docs/verification/language-2026-10-17/` as "**`next: []`:** `<its id>`, because …".
- **Shown failing without the fix:** an entry's `next` taken out (`start.home`) fails the test (`start.home next:
  expected false to be true`) and, with the field required, `tsc -p tsconfig.app.json --noEmit` too (`Property 'next'
  is missing`), exit 2 each. The guide's and the help's tests (`guide`, `help-mechanics`, `language-money`,
  `tutorial` and the seven `guide-examples-*`) pass 143 of 143 with the fix.
- **Mutation run** (four mutations, all killed): an entry without `next`; an entry's `next` emptied with no reason
  recorded (`start.find`); the reason for `documents.residence` taken out of the papers record; a blank step in an
  entry's `next`.

## The Checks

Run from this clone after each fix, every exit read from a file: `npx tsc -b --noEmit`, and beside it, from the fifth,
`npx tsc -p tsconfig.app.json --noEmit` and `npx tsc -p tsconfig.node.json --noEmit` (below); `npx eslint` on the files
changed; `title-case`, `label-sweep`, `plural-check`, `voice-check`, `tics`, `spelling`, `typos`, `text-inventory
--check`, `doc-refs --check` and `deciders --check`. Each exited 0 after each fix.

One fault of this pass's own: the fourth fix's test cast the three tables' rows to `Record<string, unknown>[]`, which
the compiler refuses, and `tsc -b --noEmit` reported a pass on it in this clone; `tsc -p tsconfig.app.json --noEmit` on
an export of that commit (`d182e81b`) fails. The test was corrected in `4f56e99f`, and the plain `tsc -p` runs were
added to every check after it. Build mode caught the same error when it was put back by hand afterwards, so what made it
miss it once isn't known.
