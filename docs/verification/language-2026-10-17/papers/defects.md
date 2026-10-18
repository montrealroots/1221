# Papers: Defects Found Apart From The Writing

Brief 14, the papers area. Each is a fault in what the game does or shows, found while rewriting its words, apart from
the words themselves. None changes a rule, a calculation or a save.

## Fixed, Small And Certain

1. **A refusal promised a step the game no longer has.** `mayDrive` (`src/engine/systems/documents.ts`) told a player
   with no motorcycle license to “earn one on the Papers screen”. Nothing on Papers earns a license since driving went.
   Found reading the source. The sentence now ends at the fact. Not reachable by a New Haven life (a document's page asks
   only about a car), so no test reaches it; it's recorded here because a future vehicle class would have shown it.
2. **The IRS's lien notice offered a hearing the game has no way to ask for.** Letter 3172's notice said “You have 30
   days to ask for a Collection Due Process hearing.” No command or screen asks for one. It now says the letter gives
   the 30 days and that the game doesn't offer the hearing (`federalLienStep`, `src/engine/systems/taxreturn.ts`;
   `tests/liens-and-arrangements.test.ts` asserts the new words).
3. **Typed rule figures beside the rules' constants.** The Returns tab's interest note said “7% a year, daily”, and its
   fine print typed 5%, 0.5%, 7%, 60 days, five weeks and 30 days, while `COLLECTION` and `RETURN` hold each one. They
   now read the constants, so a changed rate can't leave the screen behind. The late notice's 5% and 60 days read
   `RETURN.lateMonthly` and `RETURN.lateMinimumAfterDays`; the IRS lien refusal's 30 days reads
   `FEDERAL_LIEN.releaseDays`; Conditions' “therapy twice” reads `CHRONIC.therapyPerMonth`. The values are the same, so
   no figure on screen changed.

## For The Coordinator

4. **A rule reads the player's words.** `tax.apply_plan`'s decision (`src/engine/systems/taxreturn.ts`, the
   `TAX_PLAN_DECIDE_KIND` handler) skips refusing a plan when `planRefusal`'s sentence matches
   `/payment plan|application/`. That's logic keyed on text: a rewrite of the refusal can change behavior. This pass kept
   the words “payment plan” and “application” in the two sentences it matches (“You already have a payment plan with the
   IRS.”, “Your application is already with the IRS. …”), and the branch can't fire anyway, since the handler sets the
   plan's status to refused before asking. A later change should test the status, not the sentence.
   **Fixed** on 2026-10-17 by the cross-area pass (`crossarea/defects.md`, 2): the decision passes `planRefusal` the plan
   it decides, by its state, and the match and the status flip went. What's above was true until then.
5. **Dead content.** `src/engine/content/licensepaths.ts` (69 sources, 2,394 words) is imported nowhere but for one
   type (`LicenseStage`, by `systems/documents.ts`): `LICENSE_PATHS`, `PASS_RATES`, `passRate` and `LICENSE_EXCHANGES`
   have no reader since driving went. And of `src/engine/content/licenses.ts` only a license's `authority`, `name` and
   its permit's `idp.issuer` reach a player (`ui/looks/papers.tsx`, `mayDrive`); its notes, steps, renewal and visitor
   texts reach none. Both are marked Reviewed And Retained with that reason. Deleting them is a scope question, not a
   writing one.
6. **The look's kind words and the document names.** `tests/looks.test.ts` forbids a look's kind inside its name. A
   passport's kind can't be “Passport” (an Icelandic passport is named “Íslenskt Vegabréf (Icelandic Passport)”), nor a
   visa's “Visa”. The kinds are now “Travel Document”, “Permission To Travel”, “Permission To Enter”, “Permission To
   Drive”, “License Translation”, “Permission To Work” and “Proof Of Identity”, in place of “Leave To …”. Noted because
   a future writer will reach for the plain noun and meet the test.

## Fixed In The Last Batch

7. **Britain was named “GB” on two refusals and a list.** `residenceRefusal` and `mayEnter`
   (`src/engine/systems/documents.ts`) and `countryName` (`src/ui/papers/Documents.tsx`) looked a country up by its code
   in lower case, and Britain's id is `uk`, not `gb`, so a British destination read “Living in GB needs permission to
   live there …”. They now go through `countryOfIso` (`src/engine/content/bankdays.ts`), as the Residence Abroad rows
   already did. Found when `tests/residence.test.ts` printed the refusal; it now asserts “Living in the United Kingdom …”.
8. **A test quoted a misapplied rewrite.** `tests/evidence-g16-papers.test.ts` (“refuses a payment the bank can’t cover
   in its words …”) expected the ID card's refusal piece for an IRS payment after a test migration. It now expects the
   payment's own words, “Your bank can’t cover $…, so nothing was paid.” No game behavior was wrong.
9. **The passport fine print showed raw research notes.** Under “Not confirmed:” the Passport And ID tab printed each
   office's research notes as written for the build tool: field names (`processingDays.min`, `lostReplacement.fee`),
   HTTP errors and “the brief asked …”. `passports.ts` is generated by `tools/build-passports.mjs` and says not to edit
   it by hand, so the fine print now prints the game's own assumptions under “Assumed in the game:” and, where the
   research has notes, one sentence saying some details weren't published or couldn't be confirmed. The notes stay in the
   file for the next researcher.

## For The Coordinator, Found Late

10. **The money guide quotes this area's refusals.** `src/engine/content/guide/money.ts` (the money area's) quotes
    “SLATE has no research on what … charges to send a payment abroad.” and “… for receiving one”, which
    `src/engine/systems/abroad.ts` now words “What … charges to send a payment abroad isn’t known to the game.” The
    money area should quote the new words when the branches meet. `homeaccount.ts`'s “SLATE has no research on what …
    does when a customer moves to America.” is the money area's own and wasn't touched here.
11. **The health guide's “It comes to more than the bank can cover.”** is quoted in `guide/papers.ts`'s conditions
    entry from `health.ts` (the health area's). This area's own refusals now read “Your bank can’t cover $…, so nothing
    was charged.” (or “paid”, or “changed”); the health area may want the same shape.
