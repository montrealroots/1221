# Brief 19, The Core: The Record, The Agent's Data, The Work's Data, The Portfolio, 2026-10-21

The core the other parts of brief 19 build on (`../design.md`, Who Builds What, 2). It was built on `b19-core` from
`2fc6493d`, in commits `d0b1fe65`, `58204a35` and `8285ce79`, and merged into the working branch after the understudy's
part and the clock. (Its builder couldn't write this file from its own clone; the coordinator committed it from the
builder's report, unchanged in substance.) Every rule names its research file and source id, or is marked ASSUMPTION.
Every project, company, casting office and line of the agent's is fictional.

## Status By Item

| Item | Status | What's left |
|---|---|---|
| L1 | Fixed And Verified for the core | The rest is held by the playthroughs (V1, V16) |
| L2 | Fixed And Verified for the structures | |
| L3 | Fixed And Verified | |
| F1, F2, F3, F5 | Fixed And Verified | |
| F4 | Open | What's missing is said in practical words, but no submission or agent calls `materialsCheck` yet |
| G1 | Open | The agent's data and notice are done; nothing shows them until the agent's panel exists |
| T3 | Open | The structures and their data are built; it closes when the other parts are built on them |
| T1, T2 | The core's share done | |

## L1: Carried Forward, Nothing Reset (The Core's Share)

- **Built:** an older save's record is built once on opening (`buildOnOpening`, `src/engine/systems/pro.ts`, and the
  `pro.begun` step in `loadSave`, `src/engine/index.ts`). A new life's record begins with the life.
- **Tests:** `tests/pro-core.test.ts`, "PLAYER JOURNEY: an existing graduate’s save opens with its record built once…",
  compares before and after opening, byte for byte: identity, attributes, techniques and genres; the whole School record,
  the briefs, the work record and the journey; documents, health, wellbeing and earnings; every account's balance, the
  transaction count and every pending item. "a first-year’s older save is built the same way" does the same for a first
  year.
- **Mutations:** M1 and M2, killed.

## L2: Kept Apart

- **Built:** School credits stay in `school.credits` and are read from there, with a closed run not yet filed
  (`schoolCreditsOf`). Professional credits are `ProCredit`s, added only by `addCredit`, with performed, shot, released
  or unreleased said on the line (`proCreditWords`). A self-tape is never a credit, only recorded work a reel can be cut
  from (`reelSources`).
- **Tests:** "keeps a practice brief’s self-tape off every list of credits…"; "adds the School’s filmed monologues once
  DRAM 473b is passed and posted, and a screen credit’s footage once released".
- **Mutations:** M19 and M25, killed.

## L3: An Existing Graduate's Save, Built Once, Plays On

- **The save (TEST SETUP):** made by the School's own evaluation and Commencement handlers, with Commencement brought
  forward, then stripped to a save from before 2026-10-20: no `pro`, no `pro.begun`.
- **Checked:** Equity is dated at the degree (the Bulletin: students "will attain membership to the union upon
  graduation", `yale.md`, B27 p.24); a second opening serializes byte for byte the same; after ten days on the clock a
  résumé is made from the record and `breaches` is empty.
- **Evidence:** `records/graduate-before.json`, `graduate-opened.json`, `graduate-second-opening.txt` ("…identical…:
  true"), `first-year-opened.json`.
- **Mutations:** M2 and M3, killed.

## F1: The Profile, Read From The Record

- **Built:** `profileOf` is never stored. The name is the professional name (`pro.set_name`), or the display name until
  one is set. Training is said truly: completed with its year; a candidate in year N; or studied N terms with the years
  and didn't complete (`trainingOf`). Two lists of credits. Special skills: a technique is listed from 60 (ASSUMPTION).
  Availability: at the School until the expected May, on leave, or booked days from live engagements. Location: the
  town they live in. Permission to work comes from `usWorkAuthorized` (`eligibilityOf`). The unions.
- **Tests:** "says each training truly…" (including a withdrawal through `school.withdraw`); "reads permission to work
  from the papers…"; "says availability and where they’re based…"; the screen's tests.
- **Mutations:** M24, M25 and M26, killed.
- **What a player reads:** "You studied acting in the MFA program at the David Geffen School of Drama at Yale University
  for one term, 2026, and didn’t complete the degree." "Your F-1 lets you work only on campus while you’re a student, so
  you can’t work for an employer outside the School." "You joined Actors’ Equity Association with the degree on
  September 3, 2026."

## F2: Materials With Provenance; A Reel Only From What Was Recorded

- **Built:** `Material` holds when it was made, its version and where it came from; what it contains, with a reel's
  pieces copied in; a résumé's keys and name; and the cost.
- **Usability is worked out, never stored** (`materialsCheck`): headshots over two years old read as out of date
  (ASSUMPTION); a résumé reads as behind once the record has something it doesn't; a reel says when it holds only tapes,
  and when newer recorded work came after it.
- **What a reel can be cut from:** camera briefs' takes; the DRAM 473b filmed monologues once the final term's course is
  passed and they're posted at its end (`yale.md`, B27 p.33); released screen footage. A voice brief is listed with its
  reason it can't go on one; nights on stage and class pieces are never recorded.
- **Mutations:** M14 to M19, M21 and M22, killed.

## F3: Making And Updating Each Is Playable, Time And Cost Said First

- **Built:** `pro.headshots`, `pro.update_resume` and `pro.cut_reel` (`registerPro`), each with a refusal function the
  screen reads and the command throws in the player's words. The buttons: "Book A Headshot Session (4 Hours, $700.00)",
  "Make Your Résumé (1 Hour)", "Cut A Reel (2 Hours, $250.00)". Money moves only through `spend`, category `career`, on
  the Work Costs line; time moves by `advanceTo`.
- **ASSUMPTIONS, said on the screen and in the help:** $700 and four hours for a session, started 9 AM to 4 PM; one hour
  for a résumé; $250 and two hours for a reel, four pieces at most.
- **Tests:** the headshot test checks the bank is down by exactly $700.00 and the clock moved exactly four hours; the
  refusal test covers the wrong hour, being busy and a short bank, with no transaction posted; the résumé and reel
  journeys; the screen's grayed controls.
- **Mutations:** M10 to M13, M16, M22, M23 and M27, killed.

## F4: Each Component Has An Effect; Problems In Practical Words (Open)

- **Built:** `materialsCheck` gives each problem as a sentence with its next step and whether it blocks the purpose.
  Headshots and a résumé are needed for every purpose; a reel is asked for screen work and representation, never for the
  stage. The Overview's What's Missing reads it. The résumé reads the professional name.
- **Tests:** "needs headshots and a résumé for every purpose…"; the résumé journey, which reads as behind after a new name
  and a new credit, said in words.
- **Mutations:** M15, M20 and M21, killed.
- **Open:** it closes when the agent and the work call `materialsCheck`.

## F5: Apart From The Rolling History, Bounded

- **Built:** `person.pro` sits beside `person.work`, not inside it. History is capped at 80 with counts by kind kept
  (`noteEvent`). `keepBounded` trims resolved opportunities to 40 and finished engagements to 20, never live ones, and
  materials to the last 6 of each kind, keeping the count made. Credits and agreements are kept whole.
- **Tests:** history ids and keys; the cap with counts; the bounds; materials equal after a reload.
- **Mutations:** M5 to M9, killed.
- **A departure from the design:** the design kept every material. They're bounded at six of each kind because headshots
  can be bought without limit, so a history event copies what it needs rather than pointing at a material.

## G1: The Agent's Data And Notice (Open)

- **Built:** `src/engine/content/agents.ts`: Jordan Parente, Agent, Legit Department, Stewart Talent, New York
  (`agent.md`), with the agency's own spelling only in its quote. The policy is quoted once, "We do not accept
  unsolicited submissions at this time.", with `unsolicited: 'refused'`. The routes are the showcase and a referral. The
  impostor warning is quoted. Each fact carries its URL, page title, date shown and date read. The notice is in the
  player's words, and the panel line reads "Fictional: his words and decisions here are invented." The roster is the
  game's ASSUMPTION (five types by billing and age, one to three openings a year); the draw is left to the agent
  builder's decider. Nothing private is held.
- **Tests:** "holds one real agent with only what’s published…", which checks there's no address, phone, email or client
  in the data.
- **Open:** it closes when the agent's panel shows the notice and the fictional line.

## T3: Reusable Structures (Open)

- **Built:** every type (`ProRecord`, `ProCredit`, `Material`, `AgentRelation`, `Agreement`, `Opportunity`,
  `Engagement`, `ProPayment`, `ShowcaseRecord`, `OutsideWorkRequest`, `ProEvent`). A second agent is a data entry; a test
  checks that no engine file names him. `content/careerwork.ts` holds seven fictional projects, each with company and
  casting office; medium and genres; the role's size, task, families and techniques; union, contract and requirements;
  stages, schedule shape and access. Rates are verified with sources and dates (`work.md` S30, S32, S33, S36), with two
  ASSUMPTIONS said as such (Off-Broadway between LORT D and B; a non-union day rate). Union fees: Equity's verified (S27);
  SAG-AFTRA's from a search engine's copy, said so. `AGREEMENT`'s figures and 13 `AGREEMENT_TERMS`, each verified with
  its `representation.md` sources or marked a simulation term.
- **Tests:** "gives every project a fictional company…".
- **Fields declared ahead of their systems:** `relations`, `agreements`, `showcase`, `outsideWork` and `unapproved` are
  read by nothing on the core alone. The wave that follows builds what reads them; any still unread at the end is a
  declared word with nothing reading it, and comes out.
- **Open:** it closes when the other parts are built on it.

## T1 And T2: The Core's Share

- **Tutorial:** the chapter Your Career comes after You As An Actor and opens `ui.career` and the four commands.
- **Help:** five How This Works entries (`content/guide/career.ts`) under a new goal, Your Career.
- **Controls:** every command is behind `<Gated>`, with its entry one press away.
- **Text records:** every source is marked in both passes (area `career`, and the frame's and tutorial's for their
  sources); `docs/text/surfaces/career.json` claims all of them.
- **Tests:** `tutorial.test.ts` and `guide.test.ts` pass; "in a guided life, Career stays Locked until “Your Career” is
  read".

## Screens, On The Built App

`screens/` holds Overview and Portfolio at 1440 and 390, each as text and a screenshot, over a first year's save and
over the graduate's save after a portfolio was made (the `made-*` files). `walk-log.txt` records that the page served
was the clone's `dist/index.html`; no page errors and no horizontal overflow; the tabs move with the arrow keys and What
It Says opens with Enter; no input without a label.

## Mutations

`mutations.txt`: 31 run, 31 killed.

## Checks Run (On The Builder's Clone, HEAD `8285ce79`)

- `npx tsc --noEmit -p .` and `npx tsc -b --noEmit`: both exit 0.
- `npx eslint` on every changed file: exit 0.
- The gate's chain without the suite: exit 0, read from a file. The text inventory and surfaces showed 4,338 of 4,338
  sources claimed and 0 Pending; guide-quotes 578 of 578.
- vitest, one worker: 261 of the 272 files touching changed modules ran in one batch, 3,341 tests, until the batch
  reached its background time limit; the other 11 ran separately and passed. `evidence-g32-ui` failed once, on a
  hard-coded chapter list that went from You As An Actor straight to Papers; fixed, it passes 45 of 45. A priority set of
  47 files, 899 tests, passed.

## What The Next Builders Must Know

- **The guide test bans words the career needs.** `tests/guide.test.ts`'s list of removed features bans "agent",
  "showcase", "manager" and "the industry" in every guide entry and chapter. The core's text avoids them; the agent's and
  the showcase's can't, so that list changes with them, to what's still removed. The tutorial's "offers no job" guard
  (D9) is untouched and not tripped.
- **Text budgets are nearly spent:** `voice-check` is at 38 of 40 (quote the agency's policy only through
  `agencyOf(agent).policy.quote`; any new literal holding "do not" costs one); `tics` "isn't … it's" is at 8 of 8;
  sentences opening on "Nothing" are at 0 of 0.
- **The capability is called Implemented.** No independent audit row has read `career-portfolio`. The builder's own
  reading is recorded in `review-2026-10-13/capabilities.json`, dated 2026-10-20, verdict partial; it needs an
  independent reader.
- **`TRACE.md` changed more than the core's rows.** It hadn't been regenerated since 2026-10-12, so regenerating it
  brought the other four areas' rows up to the guide's current words too.
- **Equity is joined at the degree but not paid for.** The $600 down is in `UNIONS`; nothing charges it yet.
- **Every life now begins a record,** not only School lives.
- **Helpers:** call `keepBounded(pro)` after settling an opportunity or finishing an engagement, and `addCredit` /
  `releaseScreenCredit` from the work system.

## Shared Files Touched

- **Engine:** `src/engine/index.ts` (registration, `beginPro`, the `pro.begun` step, the header); `domain/model.ts`
  (`Person.pro?`, the schema staying 94); `core/ids.ts` (the `pro` namespace); `systems/school.ts` (one Equity line in
  `setStanding`, and its comment); `content/tutorial.ts` (the new chapter, the profile chapter's last line, an import);
  `content/guide/index.ts` and `types.ts` (the career goal).
- **Screen wiring:** `ui/shell/destinations.ts`, `sections.ts`, `ui/workspaces/WorkspaceRouter.tsx`,
  `app/game-context.tsx`.
- **Tools:** `trace.ts`, `text-inventory.mjs`, `spelling.mjs` ("Regional Theatre"), `coverage.mjs`.
- **Regenerated:** `docs/COVERAGE-MATRIX.md` (a chapter row inserted and renumbered), `DEVMAP`, `TRACEABILITY`,
  `CAPABILITIES.md`, `GAMEPLAY-COVERAGE.md`, `TRACE.md`, the completion matrix, `docs/text/INVENTORY.md`,
  `inventory.json` and `SURFACES.md`.
- **Added to:** `docs/capabilities.json` (the `career-portfolio` row); `docs/verification/review-2026-10-13/capabilities.json`
  (the builder's reading); `docs/text/statuses/` and `second-pass/` (frame, tutorial, and the new career files); the
  handoff's completion line.
- **Tests changed to what the game now does, each with when and why:** `evidence2-b10` (the rail includes Career; six
  routes); `evidence-g02-life` (eighteen chapters); `evidence-g32-ui` (the chapter order); `decisions-arion`,
  `genre-mastered`, `remaining-banking` and `scope-health` (`pro.begun` an opening step, after the understudy's
  `nameTheCover` on the merged branch).

## The Merge

The understudy's part and the clock merged first. The core's merge conflicted in the opening list and the four tests
pinning it, which now hold both steps, `nameTheCover` and then `pro.begun` (the record stores nothing from a casting, so
their order changes no save); in the handoff's completion line; and in generated files, each taken from the branch and
rebuilt with its own tool. The completion matrix, rebuilt on the merged tree, reads 566 of 640.
