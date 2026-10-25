Every blocking and should-fix finding is resolved. R4 is the exception: it depends on another cluster, so it's left to integration. The fixes are 6 new commits on `g27-rep`, and the patch series (now 9 files) is re-exported. Two tests still fail in `b20-guide-wiring`, because its shared wiring list hasn't been regenerated.

| Finding | Disposition | Evidence |
|---|---|---|
| R1 (blocking) | fixed | I confirmed it in the code: `contracts.ts` added the "Voice-over work is outside an agent's agreement" clause to every voice contract, and `commissionOn` takes 10% under a voice-over agreement. The clause is now built by `voiceCommission` from the agreement the work is made under (`owedAgreement`, then `coveredUnder`, the pay's own rule). It says commission is owed when that agreement covers voice-over, says why not when it doesn't, and is absent when nobody represents the actor. Proven by `pro.accept_offer` on both offer twins: the clause matches `commissionOn` in each. Mutations MR1a–e killed (MR1e only after the test was strengthened). |
| R2 (blocking) | fixed | I reproduced it: the journeys only drew under 0.1 or at least 0.9. New twin: a life whose draw lies between the chance as things stand (0.7) and the chance with a missed day on its record (0.6). The first is agreed, the second kept, each at the chance its panel shows. The reviewer's surviving mutation (MR2a) and MR2b are now killed. |
| R3 (should-fix) | fixed | Rewritten in the past tense, dated 2026-10-25: `careerwork.ts` (Harbor Line; the Module 5 voice note), `propay.ts` (header; `COVERED_MEDIA`), and the `projobs.ts` `inScope` doc. Comments only, so no mutation. The `inScope` comment first named "Halberd Talent", which `pro-core` forbids in engine code; fixed in `5aa6b2b6`. |
| R4 (should-fix) | outside the cluster (integration) | Confirmed: `grep -rn introduceAtFestival src` finds only its definition, at `representation.ts:366`, not `proagent.ts` as the festivals brief says. The fix belongs to the festivals cluster and to integration; see part 6. |
| R5 (should-fix) | fixed | The name now comes from `institutionById(entry.institution)`, or the caller's `festival` argument. A selected entry "was in the official selection"; a screened one "screened". `workSeen` now says "in X's official selection". Tested with a Cannes entry and with a caller-given name. MR5a–d killed. |
| R6 (should-fix) | fixed | `career.agreement` now ends "when its term is up". The example result is now worded as a chance, computed with `chanceTenths(termsChance('voice', EXAMPLE_AT_BAR, GATE))`. Pinned by a test. MR6a and MR6b killed. |
| R7 (note) | fixed | Removed `DealVersion.how`, `DealVersion.ask` and `AgentRelation.festivals[].at`; nothing read them. |
| R8 (note) | fixed | `reference.ts:486` now lists the agency's other departments. Asserted in Celia's journey. MR8 killed. |
| R9 (note) | fixed | The `pro.slate_reach` sample now uses `reachOf`. New test: voice parts in a represented sample take the open chance. MR9 killed. |
| R10 (note) | fixed, and the decision still goes to the owner | `realTermsWords` ("The pages the game read from Stewart Talent say nothing of the terms its agents agree to, so whether the office agrees is the game's invention, not a fact about Dan Patack.") is now on a real agent's answer notice and Terms panel. MR10a–c killed. Real agents can still agree to a shorter term or to work abroad; that is the owner's call. |
| R11 (note) | fixed | The scope now reads "which your agent handles with the agency's voice-over department". MR11 killed. |
| R12 (note) | fixed | The older-save test now saves and loads an offered agreement with no `deal`, asks, is agreed, accepts, and ends at 182 days. An older accepted agreement keeps its terms and its end. MR12 and MR12b killed. |
| R13 (note) | confirmed | `tsc --noEmit -p .` checks nothing (`files: []`). I also ran `tsc --noEmit -p tsconfig.app.json --tsBuildInfoFile <scratchpad>`, so nothing was written to `/home/user/1221/node_modules`. Both exit 0. |
| R14 (note) | outside the cluster / deferred | These are shared records, plus the one-agent-at-a-time limit; see part 6. |

**1. Patch and commits**

The patch series is in `/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27/patches/rep/` (old files removed, then `git format-patch 4cba6159..g27-rep`). Branch `g27-rep` in `/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/g-rep`, base `4cba6159`, working tree clean:

- `0001-An-agreement-s-terms-are-its-own-asked-about-once-an.patch`: `4a67f1b6` (implementer)
- `0002-The-ask-s-answer-reads-no-guard-nothing-can-trip-and.patch`: `2a4ac610` (implementer)
- `0003-Two-tests-held-the-rule-each-agreement-s-terms-repla.patch`: `2c62955f` (implementer)
- `0004-Comments-that-said-every-agreement-covers-the-US-and.patch`: `95b182a8` (R3)
- `0005-A-voice-contract-says-what-its-agreement-says-of-com.patch`: `71073db9` (R1, R2, R5–R12)
- `0006-The-fixes-claims-each-have-a-test-that-fails-without.patch`: `f815aee1` (tests strengthened)
- `0007-inScope-s-comment-names-the-game-s-own-agency-withou.patch`: `5aa6b2b6`
- `0008-A-real-agent-s-answer-says-what-the-pages-the-game-r.patch`: `6cf0bdab`
- `0009-The-own-agent-s-panel-is-held-to-carry-no-real-agent.patch`: `ee1f2c3b`

`95b182a8` on its own fails one `pro-core` test; `5aa6b2b6` fixes it. History wasn't rewritten. The trailers say "Claude Opus 5.5", following this session's attribution instruction and matching the implementer's commits; `implementer-common.md` says "Claude Fable 5.1".

**2. What's built, and what reads it**

New module: `src/engine/systems/representation.ts`.

**Item 1: asking for different terms**
- **Terms as versions.** `Agreement.deal` holds a list of `DealVersion { version, at, scope, territory, termDays }`; `Agreement.ask` holds the ask.
  - `firstDeal` builds what was offered: the department's own work, in the US, for `AGREEMENT.termDays`.
  - `dealOf` returns the version in force. An older save has no `deal`, so it reads `firstDeal`.
  - `termsFor` builds the terms the player reads.
  - `offerAgreement` stores the deal and its terms (`proagent.ts:1038-1039`).
- **Who reads the terms in force:**
  - When it ends: the accept handler sets `endsAt` (`proagent.ts:1252`); the ending notice comes from `endedWords` (`proagent.ts:888`).
  - Commission: `coveredUnder`, read by `commissionOn` (`propay.ts:363`).
  - The voice contract's clause: `voiceCommission` (`contracts.ts:262`), called from `contractFor` (`contracts.ts:209`).
  - Offers the agent handles: `makeOffer` (`projobs.ts:1774`), and the ask-more refusal (`projobs.ts:1754`).
  - Parts the agent submits for: `submitsFor`, read by `reachOf` (`projobs.ts:679`) and by the `pro.slate_reach` decider's sample (`decided.ts`).
  - Accepting while an ask waits: `askWaiting`, read by `signRefusal` (`proagent.ts:772`).
- **The ask.** Command `pro.ask_terms` (`registerRepresentation`, registered at `proagent.ts:1399`). Once, while the offer stands, the player can ask for:
  - `shorter`: 182 days instead of a year;
  - `voice`: voice-over added, only where the agency has a voice-over department;
  - `abroad`: the UK and Australia added, only for legit work.
- **The answer.** Scheduled kind `pro.agent_terms_answer`, two days later. `answerAsk` draws under decider `pro.agent_terms` against `ask.chance`. The chance is `termsChance`: a base per ask, plus 0.1 for each factor at the bar beyond the gate, kept between 0.1 and 0.9; it reads `interestOf` and is shown before the ask. If agreed, a version 2 is added and the terms rebuilt. The commission cap is untouched.

**Item 2: the voice department**
- `content/agents.ts`:
  - field `voice`, shown as "Voice-Over";
  - `Department`, `Agency.otherDepartments` and `Agent.department`;
  - Halberd Talent's voice-over department, with its own rule on submissions;
  - the invented agent `celia-brannock`, reached by referral only;
  - helpers `departmentOf`, `policyOf`, `agencyCovers`.
- `AgentMaterial` now includes `demo` (`pro.ts`).
- The helpers `voiceDepartment`, `sampleKind`, `sampleName` and `purposeOf` are read by:
  - `workSeen` (`proagent.ts:301`), which weighs the demo's band as a reel's;
  - `requestable` (`proagent.ts:529-530`) and `caseKeys` (`proagent.ts:570`);
  - the check, send and supply commands (`proagent.ts:1152`, `1191`, `1215`);
  - Celia's Voice Work and fit factors (`proagent.ts:402`, `431-442`).
- The four fixed voice projects and the slate's four voice kinds now have `access.agent: true`. An agent reaches them only through an agreement that covers voice-over (`submitsFor`).
- `reference.ts:486` lists every department of an agency.

**Item 3: introduction at a festival**
- Route `festival`, Thomas Ashgrove only.
- `introduceAtFestival(sim, person, entryId, festival?)` is at `representation.ts:366`.
  - It accepts a selected or screened entry, once per entry.
  - It names the festival from the entry's institution unless the caller passes a name.
  - It sets `rel.via`, which `sendRefusal` reads (`proagent.ts:704`).
  - It adds to `AgentRelation.festivals` (`{ entryId, creditId, festival }`), which `workSeen` (`proagent.ts:309`) and `caseKeys` (`proagent.ts:574`) read.
  - If an approach is already under way, it only adds the film to what the office has to go on.

**UI.** `RepresentationPane.tsx`: `TermsPanel` (three gated Ask buttons and their refusals, with the real-agent line in its fine print), plus the per-department rule and materials, and `waysIn`.

**Guide.** The new entry `career.agreement-terms` opens `pro.ask_terms`. Corrected entries: `career.agent`, `career.agreement` (end of term), `career.commission`, and the tutorial's Representation chapter. `docs/COVERAGE-MATRIX.md` row 14 is updated.

**Shared-file hunks, for the whole cluster**
- `projobs.ts`: the import, `reachOf`, `askMoreRefusal`, `makeOffer`, and the `inScope` doc comment.
- `pro.ts`: a type import, the `ProEventKind` additions, `AgentMaterial`, `AgentRelation.festivals`, `Agreement.deal` and `Agreement.ask`.
- `guide/career.ts`: the header, imports, `VOICE_AGENT`, `EXAMPLE_AT_BAR`, line edits in three entries, and the new entry.
- `COVERAGE-MATRIX.md`: row 14 and the generated block.
- `decided.ts`: imports, the new decider, and the `pro.slate_reach` sample line.
- `propay.ts`: the import, `coveredWork` removed, the hook in `commissionOn`, and the header and `COVERED_MEDIA` comments.
- `contracts.ts`: imports; the voice line removed from `workflowRules`; `holderOf` and `voiceCommission` added; a two-line hook in `contractFor`.
- `reference.ts`: one line in `agencyPage`.
- `careerwork.ts`: two comments, an access doc, and four `access` values.

**3. Evidence**

`tests/b27-representation.test.ts` has 19 tests:
1. A shorter term asked and agreed: the words, the chance and its date; accept refused until the answer; a save and load while it waits; version 2; ends at 182 days with its words. The twin that didn't ask runs a year.
2. An office that keeps its terms.
3. The chance arithmetic, and the chance falling on a played record.
4. **New:** the answer reads keenness, with twins on either side of the draw (R2).
5. Refusals, plus a real agent's answer line.
6. Work abroad added: a London part comes through the agent with commission; the twin gets it openly with none.
7. Guide promise `career.agreement-terms > career.commission`.
8. Abroad matches the slate's markets.
9. Voice-over added: all four voice kinds, commission, and the voice demo sent.
10. Offers by cover, plus the **new** contract-clause twins carrying an earlier ended agreement (R1).
11. Celia Brannock's journey, plus the **new** check of the reference page's departments.
12. Voice-only fit.
13. Sundance introduction.
14. An entry not selected; an approach already under way.
15. **New:** the festival named from its entry, "official selection" wording, and a caller-given name (R5).
16. One agent at a time.
17. **New:** the guide words the result as a chance and ends the agreement by its term (R6).
18. **New:** the decider's sample (R9).
19. **Rewritten:** the older save, saved and loaded, played to its end (R12).

`tests/b27-representation-screen.test.ts` has 4 tests: the terms panel journey; the promise `career.agreement-terms > career.agreement`; **new**, a real agent's panel line, absent from the game's own agent's panel; Celia's panel.

Commands, all run with `nice -n 19`:
- `tsc --noEmit -p .` exit 0; `tsc --noEmit -p tsconfig.app.json --tsBuildInfoFile <scratchpad>` exit 0.
- eslint `--max-warnings=0` on all 24 changed `.ts`/`.tsx` files: exit 0.
- New test files: 19/19 and 4/4.
- 108 test files that import a changed module, directly or through `tests/fakes`, run one at a time at `f815aee1`:
  - 106 pass;
  - `pro-core` failed one test because of my comment naming Halberd; fixed in `5aa6b2b6`, now 27/27;
  - `b20-guide-wiring` still fails 2 tests (the shared `wiring.json`, the same two the review saw).
  - That's 1,315 of 1,317 tests passing.
- After `6cf0bdab` and `ee1f2c3b` I re-ran the two cluster files plus `pro-representation-screen` 5, `pro-agent` 9, `journey-agent` 16, `career-agents` 11 and `pro-core` 27: all pass.
- Checks: `title-case`, `label-sweep`, `plural-check`, `voice-check`, `tics`, `doc-refs`, `wired`, `deciders`, `spelling`, `typos`, `inventory` and `guide-quotes` all exit 0.

Mutations this round (each restored with `git checkout`):

| Mutation | What it broke | Result |
|---|---|---|
| MR2a | the answer compared against the base chance | killed |
| MR2b | the answer compared against the maximum chance | killed |
| MR1a | clause always says uncovered | killed |
| MR1b | clause always says covered | killed |
| MR1c | clause added for the unrepresented | killed |
| MR1d | clause never added | killed |
| MR1e | clause read from `agreements[0]` instead of the owed agreement | survived at first; killed after adding the earlier ended agreement |
| MR5a | festival hardcoded to Sundance | killed |
| MR5b | film always "screened" | killed |
| MR5c | caller's name ignored | killed |
| MR5d | work seen says "screened" | killed |
| MR6a | guide example worded as certain | killed |
| MR6b | guide says "its year" | killed |
| MR8 | reference page lists the main department only | killed |
| MR9 | decider sample back to `access.agent` | killed |
| MR10a | real-agent line removed from the notice | killed |
| MR10b | real-agent line removed from the panel | killed |
| MR10c | real-agent line on every panel | survived once after the rewording; killed after fixing a stale negative check |
| MR11 | old scope words | killed |
| MR12 | older save loses its first version | killed |
| MR12b | older save reads no first terms | killed |

The review's 7 mutations: 6 were already killed, and the survivor is MR2a, now killed. The implementer's own 40 (M1–M40, as reported: M32 strengthened, M40's guard removed) were not re-run this round.

**4. Player-facing text and records that need rows**

`node tools/text-inventory.mjs` lists these 57 sources as unread or changed:
- `agents.ts`: `#FIELD_LABEL`, `#HERS`, `#AGENCIES [voice]`, `#AGENTS [thomas-ashgrove]`, `#AGENTS [celia-brannock]`
- `guide/career.ts#CAREER_GUIDE`: `[career.agent]`, `[scheduled]`, `[evaluation]`, `[career.agreement]`, `[career.agreement-terms]`, `[career.commission]`
- `proagent.ts`: `#ROUTE_WORDS`, `#officeTitle`, `#factorLabel`, `#workSeen`, `#interestOf`, `#KIND_WORDS`, `#FOUND`, `#nothingNew`, `#supplyRefusal`, `#signRefusal`, `#endedWords`, `#nextStep`, `#answer`, `#offerAgreement`, `#registerProAgent <pro.agent_check>`, `#registerProAgent <pro.send_materials>`
- `RepresentationPane.tsx`: `#ReachPanel`, `#MaterialsPanel`, `#WhyPanel`, `#TermsPanel`, `#WAY`, `#waysIn`
- `contracts.ts`: `#workflowRules [rule]`, `#voiceCommission`
- `propay.ts#commissionOn`, `projobs.ts#askMoreRefusal`, `decided.ts#top [pro.agent_terms]`
- `representation.ts`: `#COUNTRY_WORDS`, `#termWords`, `#sampleName`, `#scopeWords`, `#territoryWords`, `#termsFor`, `#outsideWords`, `#uncoveredWords`, `#ASK_LABEL`, `#askWords`, `#chanceTenths`, `#realTermsWords`, `#answerWords`, `#askRefusal`, `#askWaiting`, `#answerAsk`, `#introduceAtFestival`, `#registerRepresentation <pro.ask_terms>`
- `tutorial.ts#CHAPTERS [representation]`

Also check:
- `reference.ts#agencyPage` changed but isn't flagged by the tool.
- The tool files the `representation.ts` sources under area "health"; they need claiming for career-agent.
- 3 statuses to prune: `proagent#hasDone`, `#himTitle`, `#routesWords`.
- These shared records quote the old voice clause: `docs/text/surfaces/career-pay.json`, `docs/text/SURFACES.md`, `docs/CAPABILITIES.md`, `docs/capabilities.json`, `docs/verification/integration-2026-10-16/completion-matrix.json`.

Rows needed (unchanged; nothing new this round):
- Command `pro.ask_terms` (effects and capabilities).
- Scheduled kind `pro.agent_terms_answer`.
- Notices `representation#answerAsk` and `representation#introduceAtFestival`.
- Decider `pro.agent_terms`.
- Guide promises `career.agreement-terms > career.agreement` and `> career.commission`.
- No reactors or events. The contract clause is a clause, not a notice.

**5. Assumptions and real-world facts**

ASSUMPTION figures, all in `TERMS` (unchanged):
- shorter term 182 days;
- the answer comes 2 days later;
- base chances 0.5 (shorter), 0.6 (voice-over), 0.45 (abroad);
- 0.1 per factor, kept between 0.1 and 0.9;
- abroad means the UK and Australia;
- Celia's roster types and one to three openings a year.

`EXAMPLE_AT_BAR = 5` is only the guide example's setup, not a game figure.

Real-world facts:
- The shorter term stays within Equity's first term, S30 Rule A, and SAG-AFTRA's 18 months, S11; neither sets a minimum.
- The real-agent line rests on the pages the game read for Stewart Talent (N05, N09, N11, S101).
- Festival names come from the existing `INSTITUTIONS` list.
- No new real-world figure was introduced.

**6. Not done, unresolved, and found outside the cluster**

- **R4, the festival route.** No game code calls `introduceAtFestival`. Tell the festivals cluster it is at `representation.ts:366`, not `proagent.ts`. It takes `entryId`, accepts a selected or screened entry, and names the festival itself. If that cluster's call doesn't land, remove `'festival'` from Thomas Ashgrove's routes in `agents.ts` and revert his notice and the festival wording in `career.agent` and the tutorial.
- **One agent at a time stays** (`signRefusal`, `proagent.ts:772`). A player represented at Stewart Talent has no way to voice representation; it comes only through Halberd Talent.
- **Behaviour changes for represented players:**
  - Work abroad and voice parts come openly unless the agreement covers them.
  - Offers on work the agreement doesn't cover are at scale.
  - A voice credit no longer counts toward a legit department's fit.
  - A voice contract's clause now follows the agreement, and an unrepresented voice contract has none.
- **R10, for the owner:** real Stewart Talent agents can agree to a shorter term or to work abroad. It's now labeled as the game's invention, but whether to allow it is the owner's rule on real people.
- **For the primary agent:**
  - Regenerate `wiring.json` with `node tools/wiring.mjs --write` and add readings for the three Ask buttons; `b20-guide-wiring` fails 2 tests until then.
  - `effects --check` has 6 problems, `text-inventory` and `surfaces` need the sources above, and `capabilities` needs a row for `pro.ask_terms`; `CAPABILITIES.md` is behind and still names `coveredWork`.
  - The README's K3 section still says no agent covers voice work and that terms aren't negotiated.
  - Brief 25's `CHECKPOINT.md` and `criteria.md` quote the old clause as history, so I left them alone.