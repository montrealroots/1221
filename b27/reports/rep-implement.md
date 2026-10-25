1. **Patch and commits**

The patch is a series of 3 files in `/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27/patches/rep/`:
- `0001-An-agreement-s-terms-are-its-own-asked-about-once-an.patch`: commit `4a67f1b6`
- `0002-The-ask-s-answer-reads-no-guard-nothing-can-trip-and.patch`: commit `2a4ac610`
- `0003-Two-tests-held-the-rule-each-agreement-s-terms-repla.patch`: commit `2c62955f`

They sit on branch `g27-rep` in `/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/g-rep`, from base `4cba6159`. The trailers say "Claude Opus 5.5", as this session's attribution instruction requires. `implementer-common.md` was changed mid-task to say "Claude Fable 5.1"; I kept Opus 5.5.

2. **What I built, and what reads it**

New module: `src/engine/systems/representation.ts`.

**Item 1: asking for different terms**
- **Terms as versions.** Each agreement now keeps its terms as versions: `Agreement.deal` (type `AgreementDeal`, a list of `DealVersion`s), plus `Agreement.ask` (type `AgreementAsk`).
  - `firstDeal` builds the offered version: the department's own work, in the US, for `AGREEMENT.termDays`.
  - `dealOf` returns the version in force. An older save has no `deal`, so it gets `firstDeal` for its agent, which matches the words it was offered with.
  - `termsFor` builds the player's term text from a version.
  - `offerAgreement` now stores the deal and its terms (`proagent.ts:1036-1037`).
- **Who reads the terms in force:**
  - When it ends: the accept handler sets `endsAt` (`proagent.ts:1250`), and `endedWords` gives the ending notice (`proagent.ts:886`).
  - Commission: `coveredUnder` is read by `commissionOn` (`propay.ts:356`). It replaces `coveredWork`, which I removed; its words come from `uncoveredWords`.
  - Offers the agent handles: `makeOffer` (`projobs.ts:1769`), and the ask-more refusal (`projobs.ts:1749`).
  - Parts the agent submits for: `submitsFor`, read by `reachOf` (`projobs.ts:674`).
  - Accepting while an ask waits: `askWaiting`, read by `signRefusal` (`proagent.ts:770`). The one-agent refusal now says what the other agreement covers.
- **The ask.** Command `pro.ask_terms` (in `registerRepresentation`, called at `proagent.ts:1397`). The player asks once, while the offer stands, for one of:
  - `shorter`: six months instead of a year;
  - `voice`: voice-over added, only where the agency has a voice-over department;
  - `abroad`: the UK and Australia added.
- **The answer.** Scheduled kind `pro.agent_terms_answer`, two days later. `answerAsk` draws under decider `pro.agent_terms`, keyed by person, agent and agreement. The chance is `termsChance`: a base per ask, plus 0.1 for each factor at the bar beyond the gate, clamped between 0.1 and 0.9. It reads `interestOf` and is shown to the player before the ask. If agreed, a version 2 is added and the terms are rebuilt; version 1 is kept. The commission cap is untouched.

**Item 2: the voice department**
- **Data (`content/agents.ts`):**
  - New field `voice` (shown as "Voice-Over").
  - `Department`, `Agency.otherDepartments` and `Agent.department` are new optional fields.
  - Halberd Talent gets a voice-over department with its own rule on submissions.
  - New invented agent `celia-brannock`. Her route is a referral only, she has a roster assumption, and her notice says she is invented. A web search on 2026-10-25 found no talent or voice-over agent of that name.
  - Helpers: `departmentOf`, `policyOf`, `agencyCovers`.
- **Materials:** `AgentMaterial` now includes `demo` (`pro.ts`).
- **Reading the agent's department:** the helpers `voiceDepartment`, `sampleKind`, `sampleName` and `purposeOf` are read by:
  - `workSeen` (`proagent.ts:299`), which weighs the demo's band as a reel's;
  - `requestable` (`proagent.ts:528`), which asks for a missing demo;
  - `caseKeys` (`proagent.ts:568`);
  - the check, send and supply commands (`proagent.ts:1150`, `1189`, `1213`);
  - `supplyRefusal`;
  - Celia's two factors: Voice Work (relevance), and fit with her department (`proagent.ts:429-432`). A voice credit now counts in the voice field.
- **Voice parts:** the fixed voice parts (`careerwork.ts`) and the slate's four voice kinds (`content/slate.ts`) now take an agent's submission. Only an agreement that covers voice-over reaches them through the agent.

**Item 3: introduction at a festival**
- New route `festival`; Thomas Ashgrove only.
- `introduceAtFestival(sim, person, entryId, festival?)` is for the festival cluster to call. It works only for an entry that was selected or screened, and only once per entry.
  - It sets `rel.via`, which `sendRefusal` reads.
  - It adds `AgentRelation.festivals`, which `workSeen` (`proagent.ts:307`) and `caseKeys` (`proagent.ts:572`) read.
  - If an approach is already under way, it only adds the film to what the office has to go on.

**UI.** `RepresentationPane.tsx` gets a new `TermsPanel` with three gated buttons, their refusals, and the terms as they stand and as first offered. It also gets the department, rule and materials for each agent's own department, and `waysIn` text built from the routes.

**Guide.** New entry `career.agreement-terms`. I corrected sentences the change made false in `career.agent`, `career.agreement` and `career.commission`, and in the tutorial's Representation chapter, which now opens `pro.ask_terms`. `docs/COVERAGE-MATRIX.md` row 14 and the inventory appendix are updated.

**Shared-file hunks**
- `projobs.ts`: the import, `reachOf`, `askMoreRefusal`, `makeOffer`.
- `pro.ts`: a type import, the `ProEventKind` additions, `AgentMaterial`, `AgentRelation.festivals`, `Agreement.deal` and `Agreement.ask`.
- `guide/career.ts`: the header, imports, `VOICE_AGENT`, line edits in three entries, and the new entry.
- `COVERAGE-MATRIX.md`: row 14 and the generated block.
- `decided.ts`: an import and the new decider.
- `propay.ts`: the import, `coveredWork` removed, and the hook in `commissionOn`.

3. **Evidence**

New tests in `tests/b27-representation.test.ts` (15 tests):
- **Shorter term agreed:** the ask's words, the chance and its date; accept refused until the answer, with its words; a save and load while it waits; version 2 and the rebuilt terms; the ask refused once answered; the agreement ends at 182 days with "at the end of its six months". The twin that didn't ask runs a year.
- **Office keeps its terms:** the terms stay as offered and the agreement runs a year.
- **The chance tracks keenness:** it moves with the factors at the bar, including on a played record.
- **Refusals:** offer too late for an answer, no offer, an unknown ask, voice-over at Stewart Talent.
- **Work abroad added:** a London part comes through the agent with $900 commission; the twin gets it openly, with the "no commission" words.
- **Commission promise (`career.agreement-terms > career.commission`):** on a dub, $900 with voice-over covered against 0 without.
- **Abroad matches the game:** `TERMS.abroad` equals the slate's markets outside the US.
- **Voice-over added:** all four voice kinds reach through the agent and the twin gets them openly; commission is taken; the agency submits a slate voice part and sends the voice demo.
- **Offers by cover:** a direct voice offer is at scale with no agent asking for more under a legit-only agreement, and at scale plus ten through the agent with voice-over covered.
- **Celia Brannock's journey:** an unsolicited approach refused in her office's words; a referral from a voice job; her office asks for a voice demo; the supply is refused until one is mixed; the demo changes her factors and not Thomas Ashgrove's; an approach that already has a demo sends it; she offers a voice-over agreement; ask refusals; her agreement reaches voice parts and not on-camera ones. In the twin the demo request is missed, it is said, and reliability drops to "near".
- **Voice-only fit:** a life whose recorded work is all voice fits her department and not his.
- **Festival introduction:** a send refused before, allowed after; the film among the work seen; something new; once per entry; no real agent and not Celia; survives a save and load. The twin is still refused.
- **Festival held:** a not-selected entry does nothing; an approach under way is unchanged.
- **One agent at a time:** the refusal names what the other agreement covers.
- **Older save:** reads the default terms.

New tests in `tests/b27-representation-screen.test.ts` (3 tests): the terms panel's buttons and chance words, the waiting line with Accept grayed and its reason, and the agreed terms; the guide promise `career.agreement-terms > career.agreement`; Celia's panel.

Commands and results (all with `nice -n 19`):
- `tsc --noEmit` and eslint on every changed file: clean.
- My two files: 15/15 and 3/3.
- I updated 9 test files whose assertions my change made false, each with a past-tense comment. Pass counts: pro-core 27, pro-agent 9, career-agents 11, journey-agent 16, pro-representation-screen 5, b20-guide-chapters 37, career-workflows 20, propay 21, pro-work 36.
- The other 112 test files that import a changed module (one at a time): all pass, 1,414 tests, including deciders 198, help-mechanics 15, tutorial 18 and guide 14. **The exception is `b20-guide-wiring`, which has 2 failures** — that's a shared record (details in part 6).
- `title-case`, `label-sweep`, `plural-check`, `voice-check`, `tics`, `doc-refs`, `wired`, `deciders`, `spelling`, `typos`, `inventory` and `guide-quotes`: all exit 0.

Mutations, run in a separate copy (40 in all):
- M1–M31, M33 and M34–M39 were all killed. They covered the term's words, `endsAt`, an always-yes or always-no answer, the once-only refusal, `askWaiting`, the territory, the voice scope, `submitsFor`, `reachOf`, `makeOffer`, the ask-more refusal, the demo request, the demo weighing, `perFactor`, the festival's `via` / once-per-entry / held branch / state check / case key, the voice relevance and fit, `firstDeal`, the ending words, the supply refusal, the sample sent, the offer's terms, `policyOf`, the abroad / voice / no-time refusals, the terms rebuild, the access of each voice kind (fixed and slate), the old commission rule, and the one-agent scope words.
- M32 (one slate voice kind's access reverted) first survived; I strengthened the test and it was then killed.
- M40 (a handler guard) survived, so I removed the guard; the code no longer has it.

4. **Player-facing text and things the records need rows for**

New text sources:
- `agents.ts`: `#HERS`, `#AGENCIES [voice]`, `#AGENTS [celia-brannock]`
- `guide/career.ts#CAREER_GUIDE [career.agreement-terms]`
- `decided.ts#top [pro.agent_terms]`
- `representation.ts`: `#COUNTRY_WORDS`, `termWords`, `sampleName`, `scopeWords`, `territoryWords`, `ABROAD_WORDS`, `termsFor`, `outsideWords`, `uncoveredWords`, `ASK_LABEL`, `askWords`, `chanceTenths`, `answerWords`, `askRefusal`, `askWaiting`, `answerAsk`, `introduceAtFestival`, `registerRepresentation <pro.ask_terms>`
- `proagent.ts`: `#ROUTE_WORDS`, `factorLabel`, `titleWords`
- `RepresentationPane.tsx`: `#TermsPanel`, `WAY`, `waysIn`

Changed text sources:
- `agents.ts`: `#FIELD_LABEL`, `#AGENTS [thomas-ashgrove]` (his notice)
- `guide/career.ts`: `career.agent`, `career.agreement`, `career.commission`
- `tutorial.ts`: the Representation chapter
- `proagent.ts`: `hasDone`, `himTitle`, `officeTitle`, `routesWords`, `interestOf`, `FOUND`, `KIND_WORDS`, `nothingNew`, `sendRefusal`, `supplyRefusal`, `signRefusal`, `endedWords`, `nextStep`, `offerAgreement`, `answer`, and the check and send commands
- `RepresentationPane.tsx`: `AgentPanel`, `ReachPanel`, `MaterialsPanel`, `WhyPanel`
- `propay.ts#commissionOn`
- `projobs.ts#askMoreRefusal`

Rows needed:
- Command `pro.ask_terms`.
- Scheduled kind `pro.agent_terms_answer`.
- Notices `representation#answerAsk` and `representation#introduceAtFestival`.
- Decider `pro.agent_terms`.
- Guide promises: `career.agreement-terms > career.agreement` and `> career.commission`. Each is held by a test whose name quotes it.
- No reactors or events.

5. **Assumptions and real-world facts**

ASSUMPTION figures (all in `TERMS`):
- The shorter term is 182 days.
- The answer comes 2 days later.
- Base chances: 0.5 for a shorter term, 0.6 for voice-over, 0.45 for abroad.
- 0.1 per factor, clamped between 0.1 and 0.9.
- Abroad means the UK and Australia (the game's markets).
- Celia's roster types and one to three openings a year.

Real-world facts:
- The shorter term stays within the existing citations. Equity's initial term of one year is S30 (Rule A), and SAG-AFTRA 12-C's 18 months is S11 (a search-engine copy). Both are in `representation.md`, as `careerwork.ts`'s `EQUITY_TERM` and `SAG_TERM` already cite them. The ATA sources (S13, S14) give no term rule.
- No new real-world figure was introduced. No voice-over department is claimed for Stewart Talent.

6. **Not done, unresolved, and found outside the cluster**

- **One agent at a time stays.** A legit agent and a voice-over agent at different agencies can't both represent the player, because the work loop and the pay read one agreement (`activeAgreement`). Making that scope-aware would restructure shared code, so I didn't. Voice representation comes through Halberd Talent: add voice-over to Thomas Ashgrove's agreement, or sign with Celia Brannock. A player represented by a Stewart Talent agent has no route to voice representation.
- **The festival route depends on the festivals cluster.** Thomas Ashgrove's notice and route words now name the festival. If that cluster's call doesn't land, remove `'festival'` from his routes in `agents.ts` and revert the notice.
- **Behaviour changes for represented players:**
  - Abroad parts and voice parts now come openly unless the agreement covers them.
  - Offers on uncovered work are at scale, not scale plus ten.
  - A voice credit no longer counts toward a legit department's fit.
  - The `pro.slate_reach` decider's sample now uses agent reach for voice parts.
- **Records for the primary agent:**
  - `b20-guide-wiring` fails until the wiring list is rewritten: `node tools/wiring.mjs --write`, plus readings for the three Ask buttons. The handler line numbers in `projobs.ts` and `proagent.ts` have also shifted.
  - `effects --check` has 6 problems: the rows listed in part 4.
  - `text-inventory --check` lists 26 new sources, 28 sources whose words changed, and 3 statuses to prune (`proagent#hasDone`, `#himTitle`, `#routesWords`).
  - `surfaces --check` needs the new sources claimed and `SURFACES.md` regenerated.
  - `capabilities --check` needs a row for `pro.ask_terms`. `docs/CAPABILITIES.md` still names `coveredWork`.
  - The README's K3 section (`docs/verification/career-universe-2026-10-24/README.md`) still says no agent covers voice work and that terms aren't negotiated; both are now history.
- **Small follow-up outside my cluster:** the industry reference's page for Halberd Talent (`systems/reference.ts`) lists only its legit department; Celia Brannock appears there with her role.