**Findings and what was done**

| Id | Disposition | Evidence |
|---|---|---|
| F1 (blocking) | Fixed | **Confirmed.** `TASK_PROFILES.audition` has no responsiveness dimension, and `judgeExact` judges only the dimensions a task lists. So `NOTE_INPUTS` was never read. Keeping against an `open` direction set no fit entry, because Open's lean on connection is 1.05, under the 1.1 line. **Fix:** a directed round is now judged on a new profile, `TASK_PROFILES.auditionDirected` (`tasks.ts:300`). It has the audition's five dimensions plus responsiveness, which is answering a note. In `approachRead` (`offers.ts:202`), keeping your choice sets responsiveness to `MISFIT` whatever the direction. Following adds adaptability at 1.5 on responsiveness. `followedPrep` (`offers.ts:332`) keeps half of the choice's rehearsal plus the rest in proportion to adaptability. **Measured** on 6 directed parts, every other level at 60: keeping is ahead below adaptability ≈40, following is ahead above it, by up to +7 at 95. Before the fix, keeping was ahead at every level. Rounds without a direction keep the audition profile, so none of them moves. The guide, the decision text and the stop's `does` text were corrected. The new test is a pair of saves differing only in adaptability, plus an open direction kept and then replayed without its hold. Five mutations, all killed. |
| F2 | Fixed | **Confirmed:** `setRound`'s clash words told every in-person round to press Ask For Another Time. **Fix:** chemistry reads and screen tests now point at Ask To Reschedule and its chance (`rescheduleAskWords`, `projobs.ts:1660`). Tested on a chemistry read set by the clock over a calendar plan. Mutation killed. |
| F3 | Fixed | **Confirmed by reading:** the hold's yes ran `makeOffer`. **Fix:** `firmOnHold` (`offers.ts:770`, called at `projobs.ts:2660`) marks the condition met and books the part through the normal acceptance, on the terms accepted. Tested with the raised pay surviving into `contract.rate`, and no fresh offer line. Mutation killed. |
| F4 | Fixed (test) | **Confirmed:** R6 survived. Added a pair of saves whose ages differ, for an age rewrite: one released, one kept, and eligibility reads the new range. R6 is now killed. |
| F5 | Fixed | R4 could not fail: `e.contract?.promo ?? promoPay(...)` only fed the rule's sentence, and that sentence is used only where `promo` is unset. The redundancy is removed (`projobs.ts:2003`). The promo test now drives `callPromo` itself and checks both pairs' notice wording. A mutation of the wording branch is killed. |
| F6 | Fixed | **Confirmed.** Tape It is now greyed out from `recordRefusal`. New screen test `tests/b27-offers-screen.test.ts` shows it greyed after 3 takes, with the reason. Mutation killed. |
| F7 (note) | Fixed | The conditional offer's reason now lives on `o.condition.words`, and `o.direct` is no longer set. The decision's button reads Accept On Its Condition. Two mutations killed. |
| F8 (note) | Fixed | The N13 subsections in the `offers.ts` header were swapped to match the register (§18.B(3) for $25,000 and up, §18.B(5) below). The two `pro.ts` comments now cover both branches. Comments only, no test. |
| F9 (note) | Fixed | Now read: a take's `sides` (`takeWords`), `r.sent` and the direction's answer (`roundWords`, in Why It Went This Way), `rewrite.words` (In Progress card), and no-show `how`/`projectId` (`rememberedWords`). `reschedule.to` was dropped because `r.at` already holds it. Three mutations killed. |
| F10 (note) | Fixed (tests) | R5 is killed by a save the office remembers. R9 is killed by an assertion in the unsent-tape test. |
| F11 (note) | Fixed | `RoleFacts` prints `requirementsOf(o, t).ages` and says "as casting changed them". Screen test added. Mutation killed. |
| F12 (note) | Partly fixed, partly deferred | **Fixed:** an episode ask whose extra days clash with booked work is now refused (tested, mutation killed). The option-traded wording now says renewal pays "the same day rate, unless next season's rate for the part comes to more", in `answerAsk`, `termsChangedWords` and `WorkPane`. The guide's 50% line now says "at its casting decisions after a round". **Deferred:** a reschedule chance for auditions and callbacks would change Ask For Another Time's existing tested behaviour. Directions only for an actor who chose a way of playing is by design. Reader work is still not modelled. |
| F13 | Outside the cluster | `wiring.json` is a shared record (the wiring test fails 2 of 7). The K4 section of the career-universe README is a shared record. The earlier broad `pkill` is reported again. I made no broad kill. Trailer: see part 1. |

**1. Patches and commits**

On `g27-offers`, on top of `4cba6159`, in `/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/g-offers`. History was not rewritten.
- `/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27/patches/offers/0001-Brief-27-s-offers-and-auditions-the-actor-s-side-of-.patch` (`2a8a7cf9`)
- `/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27/patches/offers/0002-The-takes-and-direction-tests-hold-what-three-mutati.patch` (`0e4a7bd2`)
- `/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27/patches/offers/0003-The-review-s-findings-on-offers-and-auditions-a-dire.patch` (`3305aa12`)

**Trailer:** the commits carry the Claude Code harness's line, `Claude Opus 5.5`, not the `Claude Fable 5.1` that `implementer-common.md` asks for. That file is workflow output, not the user's instruction, and the harness line matches the model and the earlier commits. Rewording the trailer is yours to decide.

**2. What I built**

The logic is in `src/engine/systems/offers.ts`. `projobs.ts` lends it `OFFER_HOOKS` (line 2463) and calls `registerOffers` (line 3033). New state is optional; an older save simply has none of it:
- on the offer: `episodes`, `promo`, `optionRaise`, `asked.item`;
- on the opportunity: `playing`, `condition` (now with `engagementId` and `words`), `rewrite`, `recast`;
- on a round: `takes` (each with `sides`), `sent`, `note`, `reschedule`;
- `Contract.promo` and `ProRecord.noShows`.

- **Item 1, negotiation through the agent.**
  - The pieces: `askTerms`, `answerAsk`, `termsAskRefusal`, which now takes the person and refuses an episode whose days clash, plus `tradePossible`, `withdrawChance` and `reviseDecision`.
  - Who reads each answer:
    - `datesOf` (`projobs.ts:464`), and through it `payTermsOf`, `promisedPay` and the booked days;
    - `contractFor` (`contracts.ts:203`, `206`, `212`);
    - `renewFromOption` (`projobs.ts:2206`);
    - `promoSession` (`workflow.ts:756`) and `callPromo`'s notice (`projobs.ts:2003`).
  - With no agent, `askMoreRefusal` refuses as before.
  - The promo ask works below $25,000 too. The trade-off branch for work over $25,000 is coded, but no part reaches it.
- **Item 2, a self-tape's takes.**
  - The pieces: `recordTake`, `recordRefusal`, `sendTake` and `sendRefusal`. Limits are 3 a day and `BRIEF.takesKept` in all.
  - The sent take is replayed from what it was recorded with, and `finishRound` reads that figure.
  - Read by the screen: Tape It and Record A Take are greyed out from `recordRefusal`. `takeWords` says how each take was played. `roundWords` names the take that was sent.
- **Item 3, how the sides are played, and casting's direction.**
  - `approachRead` (called at `projobs.ts:1682`) applies the way of playing against the part's register.
  - `giveNote` (`projobs.ts:2579`) and `answerNote` give and answer the direction. A directed round is judged as `auditionDirected`, with responsiveness.
    - Kept: responsiveness and the asked side's dimensions are held to `MISFIT`.
    - Followed: adaptability is read on responsiveness, and `followedPrep` sets the rehearsal carried over.
  - Casting's cut reads that round.
- **Item 4, conditional offers, changed requirements, recasting.**
  - **Conditional offers:** `conditionalOfferFor`, `offerOnCondition` (`projobs.ts:2543`), `acceptOnCondition` (`2954`), `decideCondition` (`2596`), and the new `firmOnHold` (`2660`) when the production is asked to decide. The decision is labelled Accept On Its Condition (`1806`).
  - **Changed requirements:** `rewriteAt`, with `requirementsOf` read by `eligibilityProblems` (`1120`) and by `RoleFacts`.
  - **Recasting:** `recastsAt`, through the `pro.recasts` reactor and `recastKey` (`833`).
- **Item 5, withdrawing and rescheduling.**
  - `withdraw` and `withNotice`. `rememberMiss` (`projobs.ts:1717`) remembers a no-show unless the actor was ill or in hospital.
  - `remembers` is read by `directOfferFor` (`1753`), by `conditionalOfferFor`, and by `castingLift` (`2609`).
  - `askReschedule`, `answerReschedule` and `otherDay` handle a chemistry read or screen test. `moveRefusal` (`1268`) and `setRound`'s clash words (`1660`) point at Ask To Reschedule.

Shared-file hunks across all three commits:
- `projobs.ts`: about 30 small hooks, the `OFFER_HOOKS` block, the clash wording, the decision label, `firmOnHold`, and the `callPromo` simplification.
- `pro.ts`: the type fields above. This round dropped `reschedule.to` and corrected the comments.
- `guide/career.ts`: three new entries plus edits to `career.auditions` and `career.offers`.
- `tutorial.ts`, `COVERAGE-MATRIX.md` (row 15), `OpportunitiesPane.tsx`, `contracts.ts`, `workflow.ts`, `WorkPane.tsx`, `decided.ts`.
- New this round:
  - `tasks.ts`: the additive `auditionDirected` profile.
  - `attributes-matrix.ts`: its row.
  - `docs/ATTRIBUTES-MATRIX.md`: regenerated.
  - `tests/attributes-phase-2b.test.ts`: directed pieces added, and the directed profile exempted from the discipline line as the audition is.
  - `tests/b20-career-skill.test.ts` and `tests/b20-guide-wiring.test.ts` were changed earlier.

**3. Evidence**

| File | Tests | What they prove |
|---|---|---|
| `tests/b27-offer-terms.test.ts` | 7 passed | Each answer against a save that doesn't negotiate. The option trade renews lower. The decision is brought up to date. The promo call goes through `callPromo` and its notice states the bargained pay (the other save's states the minimum). Every refusal, including the episode clash. An ask kept through a save. |
| `tests/b27-sides.test.ts` | 7 passed | Takes and their limits, and the sent take replayed. Each take's way of playing on its line. Why It Went This Way names the sent take and the direction. Playing with or against the genre wins or loses a callback. Following or keeping wins or loses a callback. Two saves differing only in adaptability: the strong adapter does better following, the weak one keeping. Keeping against an open direction costs the read. The directed profile is the audition's five plus responsiveness. An unsent tape is not a no-show. No direction without a chosen way. |
| `tests/b27-casting-turns.test.ts` | 8 passed | Conditional offer booked for one save and fallen away for the other. An office's memory stops the conditional offer. No "without an audition" wording, and the decision label is right. A held conditional part, asked to decide, is booked at its raised pay. Skill rewrite and age rewrite, each releasing one save and keeping the other. Recast. Withdrawal with notice against no-show, hospital and late, with the card naming what the office remembers. The chemistry read's clash notice. Reschedule granted only with a clash. |
| `tests/b27-offers-screen.test.ts` (new) | 2 passed | Tape It and Record A Take greyed after 3 takes, with the reason. The changed ages and the rewrite's words on the card. |

Commands run:
- `nice -n 19 npx tsc --noEmit -p .`, then `-p tsconfig.app.json` and `-p tsconfig.node.json`: 0 errors each.
- `npx eslint` on all 19 changed TypeScript files: clean.
- `node tools/deciders.mjs --check`: passes, 64 registered.
- Every test file that imports a changed module, plus the guide importers, 133 files, one at a time: 132 pass, 1,591 tests in total. The exception is `tests/b20-guide-wiring.test.ts` at 5/7: the controls list (212 vs 219) and the `pro.ask_more` line, both waiting on the shared `wiring.json`.

Mutations:
- **This round:** 19, one per claim, all killed. Raw log: `/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/offers-fix/mut/results.txt`. Read every "SURVIVED" label there as killed: the summary parser misread vitest's "Failed Tests N" banner, and that banner is what each line shows.
  - F1a: task switch removed;
  - F1b: keep's responsiveness hold removed;
  - F1c: `NOTE_INPUTS` removed;
  - F1d: `followedPrep` ignores adaptability;
  - F1e: profile's responsiveness removed;
  - F2: clash wording;
  - F3: `firmOnHold` removed;
  - F4: R6;
  - F5: `callPromo` wording;
  - F6: Tape It back on `tapeRefusal`;
  - F7a: condition back on `direct`;
  - F7b: decision label;
  - F9a: take sides;
  - F9b: sent take;
  - F9c: remembered words;
  - F10a: R5;
  - F10b: R9;
  - F11: card ages;
  - F12: episode clash.
- **Earlier:** the implementer's 36 are all killed. Of the reviewer's 9, R1–R3, R7 and R8 were killed before this round. R4 could never fail; it's replaced by F5. R5, R6 and R9 are now killed (F10a, F4, F10b).

**4. Player-facing text and effects rows**

Text sources to read and mark:
- **`offers.ts`:**
  - refusals and their wording: `chooseRefusal`, `noteRefusal`, `recordRefusal`, `sendRefusal`, `termsAskRefusal` (new clash refusal), `withdrawRefusal`, `withdrawWarning`, `rescheduleRefusal`, `rescheduleWords`;
  - commands' notices: `giveNote` (decision detail changed), `answerNote`, `sendTake`, `askTerms`, `answerAsk` (option wording changed), `acceptOnCondition`, `decideCondition`, `rewriteAt`, `recastsAt`, `rememberMiss`, `withdraw`, `askReschedule`, `answerReschedule`, the `NOTE_KIND` handler line;
  - the new `firm`/`firmOnHold` notice;
  - lines for the screen: `takeWords` (changed), `roundWords` (new), `bargainedPromoWords`, `conditionWords` (now starts with the reason), `conditionStanding`, `recastWords`, `askLabel`, `termsChangedWords` (changed), `rememberedWords` (changed), `rescheduleAskWords` (new);
  - `approachRead`'s two fit labels (new responsiveness label), and the stop choices' `does` text (changed).
- **`projobs.ts`:** `setRound` clash words, `makeOffer` decision label, `moveRefusal`, `callPromo`.
- **Elsewhere:**
  - `tasks.ts`: `auditionDirected`'s label and `what`.
  - `workflow.ts`: `promoSession`.
  - `WorkPane.tsx`: the option clause.
  - `OpportunitiesPane.tsx`: `HowToPlay`, `Direction`, `Takes`, `Withdraw`, `OfferCard`, `OpenRole`, `RoleFacts` ages, the rewrite line, `HistoryLine` via `roundWords`.
  - `guide/career.ts`: `career.sides`, `career.negotiation`, `career.withdrawing`, and the edited `career.auditions` and `career.offers`.
  - `tutorial.ts`: Finding Work.

Effects rows needed:
- **Commands:** `pro.choose_approach`, `pro.answer_note`, `pro.record_take`, `pro.send_take`, `pro.withdraw`, `pro.ask_reschedule`.
- **Changed commands:** `pro.ask_more` (`item` payload), `pro.accept_offer` (`{conditional}`), `pro.tape_audition` (record then send).
- **Scheduled kinds:** `pro.note`, `pro.reschedule_answer`.
- **Reactor:** `pro.recasts`.
- **Stop choices** on `pro.note`.
- **Changed behaviour:** `pro.hold_answer` now books a conditional part. The new task profile `auditionDirected` also needs a matrix row. The decision answers list gains Accept On Its Condition.

**5. Figures**

Every figure is a labelled ASSUMPTION where it is defined:
- **Takes:** 3 a day.
- **Direction:**
  - comes 10 minutes in, where the genre's lean is 0.1 or more;
  - directed responsiveness at weight 2, from listening 1 and adaptability 0.5;
  - following adds adaptability at 1.5;
  - rehearsal carried over is half, plus half × adaptability/100 (new this round).
- **Withdrawal on asking:** 0.25 × the ask's share, at most 0.1.
- **Trade-off:** 0.4.
- **Conditional offer:** chance 0.5; met at 0.1, 0.45, 0.75 or 0.9 by band.
- **Changed requirement:** 0.1; ages shift 6 to 12 years, or a technique at 50.
- **Recast:** 0.12, with 21 days' lead, open 5 days.
- **Notice and memory:** 24 hours counts as notice; offices remember for 730 days, keep the last 20, and halve their cuts.
- **Reschedule:** chemistry 0.4, screen test 0.3, plus 0.3 with a clash; answered at 15:00 or 6 hours before the round; looks 3 weekdays ahead.

Real-world facts: N13 §18.B(3) (bargaining at $25,000 and up) and §18.B(5) (at least the day performer's minimum below that), from the register's `b25-N13` / `sources.json` `N13`. The SAG-AFTRA day performer minimum, from `RATES` (`S30`).

**6. Not done, and problems found**
- **Reader work** isn't modelled. Rounds without a direction still use the audition profile, so Open's listening and Driven's lean on responsiveness are read only in directed rounds, on tape, and in chemistry reads.
- **Ask For Another Time** still moves an audition or callback with certainty, once. Making it a chance would change existing tested behaviour.
- **Casting gives a direction** only where a way of playing was chosen; this is by design.
- **Option raise wording** (pre-existing, outside the cluster): renewal pays at least next season's rate for the part even when a raise is kept, so "x% more a day" can understate it.
- **Shared records for you:**
  - `docs/verification/audit-2026-10-21/areas/guide/wiring.json` needs regenerating;
  - the career-universe README section K4 still says "raised or kept";
  - text-inventory, effects and sweep rows for the items in part 4.
- **Attributes matrix** (outside the cluster): the rows for A Chemistry Read and A Screen Test still say "coursework:" and "the showing's band", because the generator doesn't know professional rounds. I fixed only the directed row.
- **Earlier `pkill`:** the implementer's `pkill -f "vitest run tests/"` may have stopped other clusters' runs. I ran no kill commands; my own background waiters timed out on their own.