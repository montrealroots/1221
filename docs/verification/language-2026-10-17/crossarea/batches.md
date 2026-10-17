# What Crosses The Areas: Batches

Brief 14, the cross-area words pass, 2026-10-17. All eight writing areas were merged (`1c3157d4`); this pass settled
what crosses them: the guide's quotes of other areas' words, the labels the tutorials name, one word for one thing, the
faults the areas found on screens they had finished, and the glossary. Worked in the clone `scratchpad/l14-xwords`, on
`lang14-xwords`. The code defects in coordinator.md (the live clock, the IRS plan's decision, the 700 literal, the
gazetteer's spaces, the guide test's `next`) were another pass's and weren't touched. The before-and-after pairs are in
`examples.json` (39, in this file's batch order).

The commits: `ce8b26e6` (batches 1 to 3's code), `9246c074` (the routes and the audience), `49c744f4` (the exchange
rate in `abroad.ts`), `5eddcaeb` (tests that keep the coverage audit's cited lines), and the records and statuses after
them. The built app walked below is `9246c074`'s; what changed after it is named where it's verified.

## Batch 1: The Guide's Quotes, And The Labels The Tutorials Name

**The quotes.** `node tools/guide-quotes.mjs --check`, on the merged `1c3157d4`, listed 74 of 595 quoted sentences in
the guide's chapters and How This Works that the game no longer said (`guide-quotes-before.txt`, this folder;
`../guide-quotes-before-crossarea.txt` is the coordinator's earlier run, 66 of 580, before the last merges). Read one by one against the code that writes each, they were four kinds:

- **The words had changed (34):** the other area rewrote the sentence. coursework 5, craft 6, productions 1, taxes 2,
  papers 20 (the health area's refusals and notices, which coordinator.md listed by line). Each now quotes the live
  words: “You can revise once it’s been shown and you have a note to work on.”, “… has asked to rehearse. Answer them
  first.”, “Choose a reading first. A self-tape plays the scene one way, so decide which before the camera rolls.”,
  “None of the months it checked, …, had a stay in hospital, the one hardship the game counts.”, the four financial
  assistance refusals, and the rest (`examples.json`).
- **True, but built from parts (31):** the game says the sentence, but writes it from two places (a bank's name and
  its limit, a `what` and its tail, a choice of endings), so no one string holds it and the tool can't find it. money 19,
  school 4, taxes 3, coursework 2, day 2, papers 1. Each now quotes only what the code writes whole, with an ellipsis
  where a template joins parts (“… more than it holds. Pay in … first.”), quotes each ending on its own (“the current
  accounts your payments come from”), or says it in prose (a reported card “says why it was stopped, as in “Lost:
  stopped.”, and the day a new one arrives”). Two were made whole in the code, both in files this pass changed anyway:
  Home's Money line writes “of it owed.” in one piece, and the round-ups line is written whole for one purchase and for
  several. Neither changed a word the player reads.
- **History in a comment (4):** “Until 2026-10-13 this quoted “It pays into that account.” …” is a comment's record,
  not a promise to the player. The tool no longer reads a comment's line.
- **A worked example the guide-examples tests hold exactly (5):** the health cover example's Marketplace line and
  its toast, the doctor example's notice and its “A doctor’s visit: not yet seen”, and the productions notes example's
  “You’re spent by the second half: find where the play lets you breathe.” Each is right, and each is played and compared
  word for word by its `tests/guide-examples-*.test.ts`. The game builds each from parts in different functions. The
  tool now names them in `HELD`, each with the assertion that holds it, and counts the quote as said only while that
  assertion is in the test. (The productions example was first rewritten with an ellipsis; its test failed, which is
  what the test is for, and the full quote went back, held.)

The tool's own change: a `${…}` with an object inside it (`${formatMoney(OWED, 'USD', { cents: false })}`) is split
whole. **After:** 578 quoted sentences, 578 the game says, 5 of them held by their tests, **0 it no longer says; exit
0.** The guide-examples tests, `tests/guide.test.ts`, `tests/help-mechanics.test.ts` and `tests/tutorial.test.ts`:
122 of 122.

**The routes.** `npx vite-node tools/tutorial-routes.mjs`, as the tutorial area's `batches.md` describes it, on the
built app (`npm run build`, served on 4211): first on this branch's walk at 1440 alone, then on the final walk (below).
The first run found **15 labels nowhere**, every one in an entry, none in a chapter:

- where labels written as descriptions: The Menu Down The Left, Breadcrumbs, Browser’s Address (`start.find`); How This
  Works on every panel (`start.guide`); Dialog When The Clock Stops (`day.calendar`); Affairs On Home
  (`papers.overview`); Piece Of Work Set, Table Work On A Scene, Work It Through Under A Scene (`coursework.prepare`,
  `.table`, `.workbook`); State’s Plan (`taxes.plan`); Year A Lien Secures (`taxes.lien`);
- steps naming what the screen doesn't say: “Chosen at the start.” (the Profile says “Traits you chose.”), What It Draws
  On (the brief chooser's column is Abilities It Uses), and the therapy line quoted with Yale Mental Health &
  Counseling's name in it, which the code writes as a template (now “Therapy with …: 2 of 8 sessions”, naming the
  practice);
- one the tool couldn't read: A Connecticut Claim is real, `A ${stateName(`us-${claim.state}`)} Claim`, a template
  inside a template. The tool's template pattern now takes one level of nesting.

The where labels now name what the screen has: The Menu And The Breadcrumb; Guide, How This Works, And ? Or / On Any
Screen; Home, The Calendar Panel, Open Calendar; Papers, Your Affairs On Home, Or The Menu; School, Coursework (and Table
Work, Work It Through); Papers, Tax Returns, IRS Payment Plan And Connecticut DRS Installment Agreement; Papers, Tax
Returns, The Year’s Return, The IRS’s Lien Or Connecticut DRS’s Lien. The overview of each entry already said the rest.
**After, on the final walk and capture** (`routes.md`: the text walk at 1440 and 390 and the capture, 760 screens of
14 saves): **0 nowhere**; 179 labels on their own screen, 1,151 on a screen, 282 in the code only (a state these saves
don't reach, such as A Connecticut Claim); `--check` exit 0. The capture also holds every paragraph, detail and name of
the seventeen chapters on its own built-app page: 271 of 271 (`chapters-on-page.ts.txt`, on `capture/brief.json`).

**Tests and tool matchers:** `tests/guide-examples-start-day-body.test.ts` reads the day.weather example's quote of the
Work Out line from its new sentence (“… before you pressed it, opening “A run in fine weather”.”), and still checks that
the line the game drew begins with it.

## Batch 2: One Word For One Thing

Everything coordinator.md listed under Open for this pass, and what the glossary found while it was assembled (batch 4).

- **A commitment.** The guide's clock chapter said the clock stops “at anything that wants you”, and the plans chapter
  “A plan wants you in the town” and “two things that want you at the same time”. They say “every commitment”, “A plan
  is in the town” and “Two commitments at the same time”. `guide/body.ts` had no “wants you” left.
- **The Sleep dialog,** as the frame area left it: the body guide's steps say You’d Wake At (beside Now), Sleep 1 Hour
  at one hour, and quote “This would count as tonight’s sleep.” where they had said ““You’d wake at”” and paraphrased
  the warning.
- **School.** The Profile's button to the School screen said Your School (and passed Your School as the route's label);
  it says School, as the rail, the breadcrumb and the School screen's eyebrow do. `ROUTE_LABELS` in `game-context.tsx`
  already said School (the frame area). Three tests that read the School Journey panel up to the button read it up to
  School, as exactly; the press still goes to `/workspace/school`.
- **The term review.** The Calendar legend's School row said “each term’s evaluation”; it says “each term’s review”, as
  the school's Term Review entries do since the school area's merge.
- **“What SLATE Leaves Out” and “Not in SLATE:”** were already “What The Bank Leaves Open, And What The Game Leaves Out”
  and “Not in the game:” (money batch 2, `164251a2`). Nothing to do.
- **The exchange rate.** “SLATE’s rate” had gone from `CharacterCreation.tsx` (frame batches 2 to 5), as “at the
  estimated rate”. Money writes the same note “About $126.58 at an estimated exchange rate”, so creation's home account
  does too, and `systems/abroad.ts` (the papers area's) said “the game’s exchange rate” three times: “under the
  estimated exchange rate”, “at an estimated exchange rate”. `tests/home-account-creation.test.ts` now asserts creation's
  two notes; `tests/home-account-tax.test.ts` and `tests/home-account-transfers.test.ts` hold the new words, as exactly.
  (`abroad.ts` changed after the walked build; the two tests are its evidence: no scenario save keeps a home account.)
- **Morale, not mood.** Creation's dispositions and traits said “affects your mood”, “how far your mood swings”, “lifts
  your mood”, where How You Are names the measure Morale. The game's own prose now says morale wherever it names the
  measure: creation, the Profile's dispositions (which read the same as creation's, as the profile area made them),
  the traits' lines, the wellbeing looks' sentences, the body guide, the guide's looking-after chapter and Look After
  Yourself's two lines. “Morale is your mood.” stays: it's the measure's definition on its look. The scenes' and briefs'
  “mood” is their characters' and stays. Tests updated, as exactly: scope-people, evidence-g06-life, evidence-g28-ui,
  -g30-ui, -g31-ui, -g34-ui, evidence3-person; evidence-g30-ui's `not.toContain('wears on the mood')` became
  `not.toContain('wears on your morale')`, so it still means something.
- **The advice's count.** “1 of your last 1 piece calls on it” is “your last piece calls on it”, and the verb agrees
  with the pieces that call on it (“1 of your last 5 pieces calls on it”, where it said “call”). The number goes through
  `plural`. `tools/advice.ts` check (g) asked the reason for `${pieces} of `; it now asks a one-piece reason for “(your
  last piece calls on it” and any other for `${pieces} of `, so it still checks that the count is said. A new test,
  `tests/decisions-advice.test.ts` ‘says one piece read as “your last piece”…’ on adv-t-0 (the case the profile area
  printed it on), fails on the old line; `says why` computes its verb.
- **Financial assistance, not charity.** The button is Apply For Assistance and the health area's refusals say a
  hospital's financial assistance; Papers' own lines said charity. Care And Its Bills' uninsured subtitle (“less any
  financial assistance from the hospital”), the toast (“The hospital applied its financial assistance to this bill.”),
  the Assistance column's Charity Taken Off (now Assistance Taken Off), the papers guide's seven mentions (its label The
  Hospital’s Charity is The Hospital’s Financial Assistance) and the guide's papers chapter. “charity care” stays among
  How This Works' search words, for a player who knows the term. Tests: defects-g8-6, evidence-g02-life,
  guide-examples-papers, as exactly.
- **Audience, not a house.** The profile area uses audience throughout; the school's own prose said “a house” in the
  qualities' descriptions (“a partner, a house or a camera”), a night's task, the coursework guide's scene rule and the
  self-tape note, and the guide's profile chapter (“A night in front of a house”). All say audience, or the back row. A
  director's note keeps “before the house does”, in the director's voice.

**Meaning-sensitive:** the advice's verb (now agrees with what's counted, not what's read: checked on adv-t-0 and by
`says why` on adv-t-8); “Assistance Taken Off” (the same outcome, `aid: 'screened'`, as `tests/defects-g8-6.test.ts`
holds both ways); morale (the same measure the words named before: `DIALS`' morale, which `moraleSwing` and `mealMood`
move).

## Batch 3: Faults Found On Finished Screens

- **“1 days” on Passport And ID.** The A New One and Faster notes printed `${days} days` and `${years} years`; both go
  through `plural` (“1 day”). Canada's faster service in Canada is a day. New test: `tests/remaining-papers.test.ts`
  ‘a passport office’s days and years are said in the right number…’, on a life in Vancouver; it fails on the old line.
- **“HUSKY D: $20.00 of $0.00 paid this year.”** HUSKY D and Covered Connecticut have no most a year: their plan design's
  `outOfPocket` is 0, care costs nothing, and a prescription costs its copay with no cap (`rxShareOf`: “A plan with no
  most in a year … charges its copay every time”). The subtitle now says only what's been paid (“HUSKY D: $20.00 paid
  this year”); a plan with a most still says it (“Yale Health: $0.00 of $9,100.00 paid this year”). The papers guide's
  line about the subtitle says so. `tests/defects-g8-4.test.ts` held “HUSKY D: $0.00 of”; it holds “HUSKY D: $0.00 paid
  this year ” and no “of $0.00 paid this year”.
- **“Worth -$227”** on Home's Money line. Money writes a negative with the minus sign (“−$3.30”, BankWorkspace's
  `balanceOf`); Home's line now does, for the balance, an account kept at home and the worth. New test:
  `tests/evidence-g33-ui.test.ts` ‘a worth below nothing is written with the minus sign…’, which fails on the old line;
  the overdrawn tests in evidence2-b12 and evidence-g33-ui hold “−$10.00” and “−$25.00” as exactly (their titles, which
  don't change, still say -$25.00). On the built app, Home on the health area's notice save of a New Haven life out of status (`after-notices-1440` and `-390`, h-nh-status.json): “Worth −$227, $943 of it owed.”, where the health area read “Worth -$227”.
- **The Marketplace's paragraph,** 246 to 309 words in one block at 390 wide (the health area's
  `shot-390-papers-marketplace.png`). It's now where you stand (Enroll's sentence, or when you're enrolled from), then a
  two-sentence overview (“Public cover depends on your income in a month, and costs no premium. On a marketplace plan you
  pay a premium each month, and your tax return can give some of it back.”), California's penalty for a life there, and
  three drill-downs, Who Public Cover Takes, Medicaid’s Work Rules From 2027 and Paying For A Marketplace Plan, with the
  rules in them word for word. `tests/remaining-health-eligibility.test.ts` still finds the work rules' paragraph whole;
  `tools/acceptance-ui.mjs` opens the drill-downs before it reads the work rules. At 390, on all fourteen scenario saves (`after-390`): the panel reads its subtitle, Enroll's sentence or “You’re enrolled from …”, the two-sentence overview and the three drill-downs' names, where it was one block of 246 to 309 words. Measured with `marketplace-390.mjs` (this folder; it counts only what's shown without opening a drill-down, where the
health area's measure counted a closed one's words too) on the three notice saves: no page wider than the screen; the
Marketplace's longest block 33 to 55 words (the 55 is Apply For Medi-Cal's own paragraph, beside its button), and
the Health Cover tab's longest anywhere the same. `shots-390/` holds the card as a player first sees it. The withdraw save's Care And Its Bills, which read “HUSKY D: $20.00 of $0.00 paid this year” on the before walk, reads “HUSKY D: $20.00 paid this year”.
- **“charity”** where the button says financial assistance: batch 2.
- **The papers guide's health-cover entry,** Pending since the health area changed its line 375: read through again
  with batches 1 to 3's changes, its quotes are the game's (four held by tests), and it's marked again (below).

**The render check** (`node tools/text-render-check.mjs`) on the final walk: the fourteen scenario saves at 1440 and
390, 128,610 strings, one distinct fault, the workload save's stored note “You and Hannah had rehearsed together 1
times.”, which the before walk had too: a save keeps a note in the words of its day, and `noteText` prints “once” since
the school area's batch 1 (school `batches.md`). The notice saves at both widths, 15,240 strings: 0 faults, once RBC's
product name eSavings went into the tool's ALLOWED as a real name spelled as its owner spells it (the health area had
listed it as not a fault). The capture, 35,850 strings: 0. Against the before walk's six distinct faults (“Sleep owed 1
hours”, “-$3” four ways, and the same stored note), nothing new; the others had been fixed by their areas.
`render-check.json` and `render-check-notices.json` are the tool's output.

## Batch 4: The Glossary

`docs/GLOSSARY.md` assembled from the eight areas' `glossary.md`, one row for each term, in its sections: Core; a new
In-World Material section (the material area's); School; Profile, Abilities, Genres And Advice; Money; Papers And
Taxes; Health, Body And Time (with the frame area's calendar and clock); Start, Home, Notices And Controls; and a new
The Guide And Help section (the tutorial area's). Where two areas wrote one term, it went to Core, or to the one
section whose part of the game owns it:

- **Into Core, merged:** estimated (frame, money, school, tutorial each had a row), an estimated exchange rate (money),
  in the game and the game's (papers, money, school), Assumed in the game: (papers), commitment (Core and frame),
  question and notice (frame; Money's “notice” is now its own term, notice period), the clock with Play and Pause
  (frame), available and pending (Core and money, which now agree: a pending card payment is already off the available
  balance, and money on its way in isn't available), payment plan (money and papers: one arrangement to pay over time,
  each kind named), condition, energy, wellbeing, readiness (Core and health, health's detail kept), morale (new),
  forecast (the school's Shown Today, the fully prepared forecast and the advice's, all forecasts), suits the scene with
  its three bands (Core and profile), audience (profile), and the take, the reader and a reading (material).
- **Corrected in Core: work in a genre.** It said class scenes count toward a genre's knowledge. `practiceGenres` is
  called by a production's night (`systems/school.ts`) and a brief's take (`systems/briefs.ts`) only, so the row says
  nights on stage and self-tapes, and that class scenes don't count, with the date it changed.
- **Added to Core, as coordinator.md listed:** question; “in the game” and “Assumed in the game:”; take; reader and
  reading, kept apart from how you play it; an estimated exchange rate.
- **One section, not two:** health cover, the marketplace, work rules, the notice of noncompliance, financial
  assistance (papers' “charity care” row and health's), and Your Doctor and Your Pharmacy are Health's; out of status
  is Papers'; sleep owed (profile's) is with sleep debt (Health); a long-term condition (health and tutorial) is
  Health's; credit record and credit score (money had two rows) is one; Table Work and its questions (material and
  school) is School's; Being Decided and In Force (a document's status and a payment plan's) are one row in Papers; and
  Catch Up (the school's for a missed orientation session, papers' for a missed plan payment: both to make up something
  missed) is Core's.

**No term defined two ways:** every bolded term was counted across the file after assembly, and each is in one row; a word with two meanings in the game has two names
(condition and a long-term condition; a notice and a notice period; take, the recording, and take a note, the school's
phrase; set, a piece, and played set; the advice's forecast among Core's forecasts).

**Screens aligned to the glossary's word** (batch 2): commitment, School, term review, an estimated exchange rate,
morale, financial assistance, audience, and the advice's count.

## The Statuses

Every source this pass changed went Pending, and each was marked again in the status file of the area that already
claimed it (`--by` that area: frame, health, money, papers, profile, school, tutorial), with its evidence: 65 sources, all
Rewritten And Verified (frame 13, health 7, money 9, papers 11, profile 9, school 11, tutorial 5). Five had been Reviewed
And Retained and now have new words: `life.ts`'s `whyNow`, the traits' `KNOB_READS` and Frugal's cost, `aidWord` and the
qualities' `DIMENSION_MEANS`. The guide entries cite `guide-quotes`, the routes on this walk and capture, and their
guide-examples tests; the screens and engine sentences cite the tests that hold their words exactly, the walk's screen
where it shows (withdraw.json's HUSKY D line, h-nh-status's worth, h-van-rx's one day), or the module's words printed
into `printed.txt` (`print.ts.txt`) where no walked screen shows them. The papers guide's health-cover entry, Pending
since the health area's merge, is one of them.

`node tools/text-inventory.mjs`: 4,145 sources, 34,124 strings, 548,602 words; **Rewritten And Verified 1,005, Reviewed
And Retained 2,916, Pending 224, Blocked 0.** Before this pass (the merged `1c3157d4`): 999, 2,921, 225 and 0. The 224
Pending are the JSON research text (`genre-demands.json` 149, `home-accounts.json` 75), the json area's. Engine-speak:
342 hits before, 335 after. `--check` exit 0.

## The Checks

After each step, from the clone, each exit read from a file: `npx tsc -b --noEmit` 0; `npx eslint` on the files
changed 0; the test files that hold the changed words (each named above) 0; `title-case --check`, `label-sweep`,
`plural-check`, `voice-check --check`, `tics --check`, `spelling`, `typos`, `text-inventory --check`, `doc-refs --check`
and `deciders --check` 0.

On the final commit (`71706a77`): all of those 0 again, with `npx eslint . --ext .ts,.tsx --max-warnings=0` 0,
`guide-quotes --check` 0, `npx vite-node tools/geo-check.mjs` 0, `wired --check`, `inventory --check`, `devmap
--check`, `traceability`, `capabilities --check` and `student-matrix --check` 0, and `completion-matrix --check` 0 (676
rows; 527 of 636 in scope Implemented And Verified, 4 Decision Required, decision 4's rows unmoved). `coverage --check`
1, on the one citation that failed at the merge base (Left, below).

**The whole suite.** First on `5eddcaeb`: 378 of 380 files, 4,638 of 4,640 tests, exit 1. The two were tests holding
words another area had rewritten (`cbae7d32`): `tests/evidence2-b13.test.ts` held the papers guide's stale HUSKY D quote
that batch 1 had corrected, and `tests/material-words.test.ts` (the material area's) had failed at the merge base too,
on the school area's new reason labels (“Why the text supports it”, “Why the text doesn’t support it”), a note's “You
played … in …” and a scene's place in lower case mid-sentence; it reads the screen's words now, as exactly, and the
glossary's Material row follows the labels. Then on `71706a77`: **380 of 380 files, 4,640 of 4,640 tests, exit 0** (`full-suite.txt`; the merged baseline's 4,587, the
areas' additions and this pass's three new tests). `final-checks.txt` is the checks' exits on the same commit.

**The built app:** `npm run build` on `9246c074`, exit 0, served on 4211 by one `vite preview` and stopped by its process
ids. `tools/text-walk.mjs` at 1440 and 390 on the fourteen scenario saves (350 screens each) and the three notice saves
(60 each), every walk exit 0; `tools/tutorial-routes.mjs --capture` on the fourteen, exit 0. What they found is in the
batches above.

## Left For The Coordinator

- **coordinator.md's Open items this pass settled:** a commitment; the Sleep dialog's labels; School and Your School; the
  term review (the legend; the school area had settled the entries); rates and the estimate in money's words (the rest
  of them, here: creation and `abroad.ts`); the quotes across areas (the money guide's banking-abroad refusals, the
  papers guide's health quotes, all of `guide-quotes`' list); what the health area found on Papers and Home; the Core
  glossary's additions; and from the money and profile areas, “SLATE’s rate”, work in a genre, audience and house,
  mood and Morale, and the advice's “1 of your last 1 piece”. They can move to Settled.
- **Still open, not this pass's:** a refusal's shape for money that isn't there. Papers says “Your bank can’t cover $…,
  so nothing was charged.”; the health area's refusals say “It costs …, more than your bank can cover.” and “The year
  costs …, more than your bank can cover.” (`systems/health.ts`), and Money's are its own. The glossary's Papers row
  says so.
- **“the game’s reading”** is still said in a few places: the coursework notes' fine print (“Simulated: the game’s
  reading of your work”), Looking Back's (`RehearsalProcess.tsx`, `production.ts`), and two home-account notes in
  `content/homeaccounts.ts`. It's close to the “SLATE’s reading” Core replaced with “estimated” and “the game’s”; each
  is a judgment the game simulates, so “the game’s simulated reading” or “estimated” would say it. Left, as no area
  raised it and each is in its owner's voice.
- **`coverage --check`** fails on one citation, `simulation.test.ts:189-256` (life energy), which failed the same way at
  the merge base `1c3157d4`, before this pass: a frame-area test change moved it. This pass's own test edits keep every
  cited line where it was (`5eddcaeb`).
- **Engine-speak** fell from 342 to 335 hits on this pass's words (the guide's “reads” and “take” for class work, “a
  side” and “axis”). The ratchet (`docs/text/engine-speak.json`) wasn't blessed: that's the coordinator's, after the
  last merge.
- **The JSON research text** (`genre-demands.json`, 149 sources, and `home-accounts.json`, 75) is still Pending, the json
  area's.
- **The walked build is `9246c074`.** After it, `49c744f4` changed three strings in `systems/abroad.ts` (verified by
  `tests/home-account-transfers.test.ts` and `-tax.test.ts`; no scenario save keeps an account abroad) and `5eddcaeb`
  changed tests only.
