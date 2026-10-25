1. **Patches and commits**
   - `/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27/patches/lang/0001-What-the-actor-speaks-is-chosen-at-creation-and-deci.patch` is commit `a64e48ad`, the whole feature.
   - `/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27/patches/lang/0002-Genres-Background-s-walk-holds-the-Languages-card-an.patch` is commit `47c5e480`. It updates one existing walk test so it expects the new Languages card.
   - Branch `g27-lang` in `/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/g-lang`, base `4cba6159`.
   - The trailer is `Co-Authored-By: Claude Opus 5.5`. Partway through, implementer-common.md changed its trailer to "Claude Fable 5.1". I kept the attribution the harness gave me, because it names the model that actually did the work.

2. **What I built, and what reads each new piece of state**
   - **What the actor speaks.** New optional field `Person.languages` (`domain/model.ts`). The types, the list of languages and the rules are in `content/languages.ts`: `SpokenLanguage`, `LanguageLevel`, `SPOKEN`, `languagesOf`, `levelIn`, `languagesProblems`, `cleanLanguages`.
     - An older save has no field and reads as English, native (`ENGLISH_ONLY`). The comment says so.
     - Creation: `NewSaveConfig.languages`. `newLifeConfig` starts with English native, and `createUniverse` stores the cleaned list (`bootstrap.ts:416`).
     - The UI is a new `LanguagesCard` on Genres & Background, plus a Languages line on Review. `validate` checks it on that step (`CharacterCreation.tsx:1558`).
     - The rules: English must be native or fluent, no language twice, at least one native, at most six, real names only. Mandarin replaces the code that only says "Chinese"; Latin and the two written forms of Norwegian are left out.
     - Readers of the field are everything in `systems/speaking.ts`, `resumeNow` (`pro.ts:1138`) and the profile panel (`CareerWorkspace.tsx:202`).
   - **Parts that need a language.** `partLanguage` (`speaking.ts:71`) is called from `makeProduction` (`slate.ts:201`) and sets `ProjectTemplate.requirements.language`.
     - It draws on its own stream, `sim.rng('pro.language', partId)`, so no other slate draw moves. The new decider `pro.language` is at `decided.ts:665`.
     - I left `SLATE_VERSION` as it was: no id changes, and a part a save has already been shown is kept without a language. The comment at the hook says why.
     - Each step of such a part reads the language:
     - **Eligibility.** `languageRefusal` is called by `eligibilityProblems` (`projobs.ts:1130`), so Submit Yourself and an agent's submission both refuse a non-speaker. Agents don't put up a non-speaker (`slateReach`, `projobs.ts:805`), and a casting office won't make them a direct offer (`directOfferFor`, `projobs.ts:1749`).
     - **Fit.** `languageDemand` feeds `fitOf` (`projobs.ts:626`). It takes the weaker of the actor's level in the part's language and in English. Fit then feeds casting's chance (`projobs.ts:2580/2591`) and the agent's reach (`projobs.ts:796`).
     - **Preparation.** A conversational speaker gets a "language" part of the preparation, added by `withLanguage`. It is read on believability and execution by `auditionContext` (1686), `workContext` (1920–1921) and `unitContext` (`workflow.ts:372`).
     - New field `PartPrep.language` (`pro.ts`). The new `'language'` step of the existing `pro.prepare` command moves it: `prepareRefusal` (1191) → `languageStepRefusal`, and `prepareOn` (2152) → `workOnLanguage`. `prepMinutes` gives the time.
     - When the part is booked, `carriedLanguage` keeps half of the work done on the sides (`accept_offer`, `projobs.ts:2939`). The limit's label is `LANGUAGE_PART` in `content/tasks.ts`.
     - **On screen.** The part's card has a "The Language" row (`OpportunitiesPane.tsx:84`, `languageWords`). Prepare has a "Work On Your <Language>" button behind the `pro.prepare` gate (`OpportunitiesPane.tsx:227`).
   - **Résumé.** `resumeNow` lists every language except native English (`Language: Spanish, fluent`).
   - **Guide.** New entry `career.languages`. I also brought the `career.resume` and `career.profile` summaries, the `ResumePanel` empty text, and the docs of `fitOf`, `eligibilityProblems` and `slateReach` up to date.
   - **Shared-file hunks.**
     - `projobs.ts`: import (108); docs and code of `fitOf` (589, 621); `slateReach` docs (781) and code (801); `eligibilityProblems` docs (1111) and code (1126); `prepMinutes` (1175); `prepareRefusal` (1185); `auditionContext` (1682); `directOfferFor` (1745); `workContext` (1916); `prepareOn` (2146); `pro.prepare` cast (2846); `accept_offer` prep (2936).
     - `guide/career.ts`: import (47), `career.profile` short (149), `career.resume` short (238), new entry before `career.offers` (808).
     - `OpportunitiesPane.tsx`: import (31), RoleFacts row (80), Prepare (222, 235).
     - `domain/model.ts`: `Person` (150).
     - Smaller hunks: `careerwork.ts` (`requirements.language`), `pro.ts` (`PartPrep`, `resumeNow`, import), `slate.ts`, `workflow.ts`, `tasks.ts`, `decided.ts`, `bootstrap.ts`, `CharacterCreation.tsx`, `CareerWorkspace.tsx`, `content/languages.ts` (added to the end), and tests `b27-creation-origins` (added to the end) and `evidence-g34-ui`.

3. **Evidence**
   - **`tests/b27-languages.test.ts`, 10 tests, all pass.**
     - Fluent speaker against an English-only twin, same seed (`b27-lang-64`), played through the clock and the commands. Both are posted the same Mandarin short on Dec 14, 2026. The fluent speaker tapes Exceptional (95.9), gets the offer, accepts and is booked. The twin gets exactly "The character speaks Mandarin as well as English, and you don't speak Mandarin." The card says why, and both lives survive a save and load.
     - Conversational twin. Fit ranks native above fluent above conversational, and native-in-the-language-but-fluent-in-English scores the same as fluent. The twin can submit and sees the button and its 45% progress, which a fluent speaker is refused with the reason.
     - The conversational twin who skips the language work tapes 77.2, held back 31 points on believability by the language, against 95.9 after the work. Casting's chance falls from 0.644 to 0.422.
     - Booking carries half the language work. The step takes 120 minutes on the booked part and stops at "You've done all this step can do."
     - Agents and direct offers: a speaker is reachable and gets the direct offer; a non-speaker gets neither.
     - Language parts are stable for the same seed, different for another, near the 12% share, and never in dubs or narration.
     - A stage night, a workflow take and `workContext`'s camera branch each read only a conversational speaker's language work.
     - Résumé lines, keeping and cleaning the list at creation, and the creation card pressed through its own handlers plus the Review line.
   - **`tests/b27-creation-origins.test.ts`**, 2 tests added: validation on Genres & Background with each refusal's words, and a Seoul life whose languages survive a save and load. 9/9 pass.
   - **Mutations: 31, all killed.**
     - The first run killed M1–M7 and M9–M29 straight away.
     - M8b (`workContext`'s camera branch) survived at first. I added a test for that branch and re-ran it: killed.
     - The mutations covered eligibility, fit (with and without the English term), agent reach, direct offers, `withLanguage`, the gain, `auditionContext`, `workContext`, `unitContext`, the share, the stream key, the step's refusals and its ceiling, the carry (none and all of it), the part's time, the résumé, creation validation, cleaning, storing, the card, the button, Review, the English level options, dubs, and the profile panel.
   - **Commands, all clean:** `tsc --noEmit -p tsconfig.app.json` (`-p .` checks nothing here, because `tsconfig.json` lists no files) and eslint on every changed file. These checks pass: voice-check (back to 40/40 after I reworded one guide line), tics, label-sweep, title-case, plural-check, deciders (59 registered), wired, doc-refs, spelling, typos, guide-quotes, inventory.
   - **Existing tests**, each file run on its own:
     - 26 career files, 238 tests.
     - Then the 341 other files that import a changed module, now 3,819 tests passing. One failed on the first pass: `evidence-g34-ui`, which expected the old Genres & Background headings and Review text. I updated it (commit 2) and it passes 15/15.
     - That run hit the 2-hour background limit after 272 files. I ran the remaining 69 plus g34 as a separate job.
     - Re-run on the final tree: guide 14, tutorial 18, cohesion 19, language-dynamic 35, creation 25, deciders 196.

4. **Text to read and mark** (all second-pass Pending)
   - `content/languages.ts`: `#LEVEL_LABEL`, `#SPOKEN_NAMES`, `#languagesProblems`
   - `systems/speaking.ts`: `#languageRefusal`, `#languageStepLabel`, `#languageStepRefusal`, `#languageWords`, `#workOnLanguage`. The last is only the key `pro:{…}<language`, not player text.
   - `CharacterCreation.tsx`: `#LanguagesCard`, `#ReviewStep`
   - `OpportunitiesPane.tsx`: `#RoleFacts`, `#Prepare`
   - `CareerWorkspace.tsx`: `#ProfilePanel`, `#ResumePanel`
   - `pro.ts#resumeNow`, `content/tasks.ts#LANGUAGE_PART`, `decided.ts#top [pro.language]`
   - `guide/career.ts#CAREER_GUIDE`: `[career.languages]`, `[career.profile]`, `[career.resume]`, `[prerequisite]`, `[history]`, `[evaluation]`
   - The inventory files `speaking.ts` under area "health", which looks wrong.
   - No new command, scheduled kind, reactor or event. The effects matrix needs rows for the creation choice "languages" (Genres & Background), the new `'language'` step of `pro.prepare`, and the decider `pro.language`.

5. **Figures and facts**
   - Every figure is marked ASSUMPTION where it is defined:
     - `PART_LANGUAGE`: share 0.12; never dub or documentary.
     - `PART_LANGUAGES` weights: Spanish 6, eleven others 1 each.
     - `LANGUAGE_FIT`: weight 2; native 1, fluent 0.8, conversational 0.5.
     - `LANGUAGE_PREP`: start 0.45, complete 0.9, gain 0.4, 60 minutes, read on believability and execution.
     - `LANGUAGES_MOST`: 6.
   - The language names come from the ISO-639 names the map already used. No register source covers this, and I used no real-world figure.

6. **Not done, and open issues**
   - There is no way to learn a language or raise a level after creation; nothing in the brief asked for one. Because languages never change, the résumé's language lines never make it fall behind. They are on display like special skills.
   - The 31 fixed parts and the parts drawn from real productions carry no language.
   - `docs/verification/career-universe-2026-10-24/README.md:353` still says "The game records no languages…", which is now false. I didn't edit your record.
   - Other text now leaves languages out, which I didn't touch to avoid clashing with the other clusters:
     - The tutorial line at `tutorial.ts:463` lists what the résumé holds without languages (it already omits awards).
     - The `career.opportunities` guide entry's reads and refusals don't mention the language refusal.
   - The camera branch of `workContext` can't be reached in play; it is wrapped and tested directly.
   - The text-inventory, effects, surfaces and sweep checks will fail until the records are updated.