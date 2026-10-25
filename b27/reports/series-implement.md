1. Patch files and commits

I committed six times on g27-series in /tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/g-series, from base 4cba6159. The patches are in /tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27/patches/series/:
- c9487c4f: 0001-A-release-s-and-a-season-s-fortunes-read-the-player-.patch (the cluster)
- 6648c539: 0002-The-production-s-wish-and-the-season-s-audience-are-.patch (two assertions; also records why journey-career was left as it is)
- c44383d2: 0003-A-guest-part-s-return-is-said-as-weighed-before-its-.patch (comments and one guide sentence my change had made false)
- eaa441a1: 0004-The-series-panel-s-note-keeps-its-first-claim-whole-.patch (series panel wording)
- 19051b01: 0005-An-option-given-up-no-longer-names-the-work-it-was-g.patch (removes the unread `givenUpFor`)
- 9ff16826: 0006-The-release-decider-says-the-routes-its-draw-now-dec.patch (decider description)

Across the six: 31 files, +2539/−148. The save schema stays 94 in both places. No forbidden record is touched.

Every commit ends with "Co-Authored-By: Claude Opus 5.5" plus the Claude-Session line. That is the session's attribution reminder and the model I ran as. implementer-common.md asks for "Claude Fable 5.1"; amend the trailers if that is what you want.

2. What I built, per item

All paths below are under /tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/g-series/.

New modules:
- src/engine/systems/market.ts: performance, release routes, chart totals.
- src/engine/systems/continuity.ts: options, release asks, guest invites, growth, pilots, and their command and handlers.
- src/ui/career/OptionRelease.tsx: the Ask To Be Released control.

**Item 1: the player's part moves a film's run and a season's audience, without deciding either**
- In market.ts:
  - `termOf` is the part's size weight times its band weight (`FORTUNE`).
  - `qualityOf` is the production's own quality, decider `pro.quality`.
  - `responseOf` gives critics' and audience scores out of 100.
  - `runOf` passes lift, hold, response, limited and territory terms to `simulateRun`.
  - `markWork` posts each judged series day to `pro.seasonMarks`.
  - `seasonTerm` reads only the marks posted before the network's next word, so earlier decisions stay put. A save without marks reads as it did.
- In charts.ts:
  - The header was rewritten in the past tense.
  - `simulateRun` takes `RunTerms`; with no terms its home-market weeks are the old draws.
  - Takings abroad come from a key of their own (`INTERNATIONAL`), and `LIMITED` sets a limited release.
  - `totalsOf` returns US, abroad and worldwide totals in USD.
- In series.ts: `seasonAudience` now goes through `seasonAudienceWith`. The audience is multiplied by exp(0.2 × term) and critics move by 8 × term.
- Who reads it:
  - projobs.ts:2761 (`markWork` on each work day) and :2823 (`runOf` at release).
  - series.ts:86, into `renewChance` at series.ts:113.
  - continuity.ts `audienceRatio`, which feeds growth.
  - reference.ts:198–201: Box Office and Reception facts, both tagged simulated.
  - IndustryPane.tsx:276–287: totals, an abroad column and reception, labeled as the game's.
  - awards.ts:665: `visibilityOf` reads the run's peak.

**Item 2: limited release, another distributor, release abroad first**
- `RELEASE_FATE` gained odds at projobs.ts:291–317. After late, streaming and shelved, the same draw continues into `routeOf` (market.ts:157):
  - limited and abroad-first are theatrical only;
  - a series' season is never taken over by another distributor alone;
  - pilots are excluded.
- `ProCredit.release` gained `weeks`, `distributor` and `first` (pro.ts:152–166).
- What each route changes:
  - **Chart:** `runOf` passes the limited weeks (widening only if the audience score is 70 or more) and `domesticAfter` for a release abroad first.
  - **Credit:** `releasedWords` and `takenOverWords` feed the release handler (projobs.ts:2788–2799, 2821–2824, notice "<project> Has A New Distributor"). `routeWords` feeds reference.ts:150 and :223 and IndustryPane.tsx:278.
  - **Awards:** `premiereOf` treats a distributor change like a hold-back (awards.ts:117); Emmys and Actor Awards both read it. `actorCheck` places a film by its run at home (`homeOpening`, actorawards.ts:134). Where the two openings fall in different years, `splitYearsWhy` gives the reason it isn't placed (actorawards.ts:153).

**Item 3: pilots**
- In slate.ts:
  - `PILOTS` sets the pilot season: January to March, with the network's word on May 15.
  - `pilotsOf` makes them, and `makeProduction` takes a `pilot` flag.
  - `slatePartsAt` adds pilots to the postings (slate.ts:362).
  - `ProjectTemplate.pilot` holds the network and the date of its word (careerwork.ts).
- In continuity.ts:
  - `pilotOfferWords` tells the player about the network word and the option; it is read by `termsWords` at projobs.ts:1812.
  - `pilotTerms` adds the option on season one and schedules `pro.pilot_word`; called at projobs.ts:2973.
  - `atWrap` holds the airing until after the network's word; called at projobs.ts:1956.
  - The `PILOT_KIND` handler draws `pilotPicked` (decider `pro.pilot`), reading the pilot's quality and the part's term.
- Passed on: the credit becomes shelved, the release and promo are cancelled, the option expires.
- Picked up: `pilotSeries` and `pilotPart` become a series run by series.ts with the player's character. The option is then taken up (through `renewFromOption` with `first`) or allowed to lapse.
- Productions And People shows a "The Pilot" fact (reference.ts:214–219), and a passed pilot's credit reads that it won't air (reference.ts:155).

**Item 4: an open option holds the actor's dates**
- In continuity.ts:
  - `optionDays` and `heldOptions` find an option's held days.
  - `optionWarning` is added to `acceptWarning` at projobs.ts:1313. It says what accepting gives up before the player decides.
  - `giveUpOptions` runs on accept at projobs.ts:2986: the option expires, the player is told, and the give-up is recorded in `pro.optionsGivenUp`.
- `pro.optionsGivenUp` is read twice:
  - `optionGivenUp`, at projobs.ts:758: the part isn't posted again that season.
  - `gaveUpWith`, at projobs.ts:1736: that casting office stops offering parts without an audition.
- New command `pro.ask_option_release` (continuity.ts:380):
  - Refusals come from `optionReleaseRefusal` (no standing offer, no option on these days, already asked, refused, or the offer lapses before the answer).
  - The answer comes the next day at 15:00 New York time (`pro.option_release_answer`).
  - `releaseGranted` (decider `pro.option_release`) uses `releaseChance`, which goes down the more the production wants the actor back.
  - The control is `OptionRelease.tsx`, gated on `pro.ask_option_release`, added to `OfferCard` at OpportunitiesPane.tsx:283–284.
  - The Work tab's option clause shows the held days (WorkPane.tsx:334–340).

**Item 5: guest part brought back, recurring part grows, canceled series picked up**
- **Guest invite** (continuity.ts):
  - `atWrap` calls `scheduleInvite` for guest parts judged Strong or better.
  - `pro.recurring_invite` fires six weeks before a season that is ordered or renewed.
  - `invitedBack` (decider `pro.recurring`) offers the part without an audition through `hooks.bringBack`.
  - `inviteStands` stops the part being posted again (projobs.ts:758).
- **Growth:** `growthOf` (decider `pro.grow`) reads the band and `audienceRatio`. It is called from the option handler (series.ts:538) into `renewFromOption(…, {grow})`. That adds `GROW.raise` on top of the option raise (projobs.ts:2193) and `growContract` adds episodes (projobs.ts:2214/2227). `Contract.grew` is shown at WorkPane.tsx:260.
- **Pickup:**
  - `pickupOf` (decider `pro.pickup`) brings a revived series back on another network of the same kind (series.ts:133, decisionsTo at :171–172).
  - That network's own chance `PICKUP.renew` sets its renewals; `decisionWords` says so.
  - `networkOf` writes `ProCredit.network` in `atWrap`. It is read at reference.ts:151 and as the "Seen On" facts at reference.ts:410 and :442.

**Item 6: real series continued, labeled simulated**
- `REAL_SERIES` in content/series.ts holds 9-1-1 (baseline 2026, season 10, source S80) and Abbott Elementary (baseline 2026, no season number, S109).
- `nine-one-one-guest` and `abbott-guest` now carry `series` (careerwork.ts).
- In series.ts:
  - `inProduction` refuses the baseline season (series.ts:232), so drawn parts are cast only in seasons the game simulates and made.
  - `seasonNumber` counts on from season 10, and `seasonName` names Abbott's seasons by year.
  - `decisionWords` adds "in the game's simulation" and "It's the game's own continuation of the real series, not an announcement."
- In reference.ts:
  - The baseline season is tagged verified and later seasons "(Simulated)" (reference.ts:403–404).
  - The production page has a section "The Game's Continuation" (reference.ts:306/316).
  - Baseline season and episode pages are not built (reference.ts:626–627).
  - The real series are kept out of the invented "Series" index.

**Shared-file hunks**
- **/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/g-series/src/engine/systems/projobs.ts:**
  - imports (L109–113; the `simulateRun` import removed);
  - `RELEASE_FATE` comment, odds and `releaseFate` (L291–317);
  - postingsAt hook (L756–758);
  - acceptWarning (L1312–1314);
  - directOfferFor (L1735–1736);
  - termsWords (L1811–1813);
  - finish() (L1952–1956);
  - renewFromOption plus new growContract (L2187–2236);
  - work-day markWork (L2760–2761);
  - release handler distributor branch (L2788–2799);
  - release handler runOf and releasedWords (L2821–2824);
  - accept_offer pilotTerms (L2972–2973) and giveUpOptions (L2985–2986).
- **/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/g-series/src/engine/content/guide/career.ts:**
  - imports;
  - the career.awards interpret sentence, corrected;
  - the career.contracts interpret sentence at L959 ("…its option, a new casting, or its producers asking a guest part back");
  - new entry `career.series` at L1117.
- **/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/g-series/docs/COVERAGE-MATRIX.md:** row 15 gains `pro.ask_option_release`; the appendix was regenerated (193 commands, 132 scheduled kinds).
- **/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/g-series/src/ui/career/OpportunitiesPane.tsx:** one import and one `<OptionRelease o={o} />`.
- **/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/g-series/src/engine/systems/pro.ts:** `ProCredit.release` kinds and fields; `ProCredit.network`; `Engagement.invite` and `.pilot`; option clause `release`; `Contract.grew`; `ProRecord.seasonMarks` and `.optionsGivenUp`. All are optional, and each comment says what an older save gets.
- **Also touched:** awards.ts, actorawards.ts, reference.ts, IndustryPane.tsx, WorkPane.tsx, decided.ts, tutorial.ts (chapter 15), careerwork.ts, content/series.ts, slate.ts, charts.ts, series.ts.

3. Evidence

**New tests** (22 tests, all passing on the final tree):
- **tests/b27-fortunes.test.ts (5):**
  - weights by size and band;
  - opening and reception move with the part, a lead more than a co-star, within bounds;
  - reception reads quality and part;
  - journey: US and abroad weeks, worldwide total in USD, reception labeled the game's, and the same film with a weak part opens lower;
  - journey: series days posted, audience and renewal chance move, survives a save, and marks after the next word are ignored.
- **tests/b27-release-routes.test.ts (5):**
  - route frequencies match their odds; no distributor route for a series season or a fixed part;
  - a film abroad first is placed by its home run, and not at all across a year split;
  - journeys for a limited release, a distributor takeover (new date and premiere), and abroad-first with the Actor Awards placement, against an on-time twin.
- **tests/b27-pilots.test.ts (2):**
  - pilots made each winter with the May 15 word;
  - journey: the option on season one; picked up becomes a series with the player's part, its option taken up or lapsed, kept through a save; the twin judged Unready is passed on and never airs.
- **tests/b27-option-hold.test.ts (2):**
  - journey forks: released, refused, given up, declined; postings and direct offers checked after giving up;
  - refusal words, plus a release-chance-by-band assertion.
- **tests/b27-returning.test.ts (3):**
  - guest played Exceptional is invited back without an audition, while the twin is never weighed;
  - growth journey: more episodes and pay, twin judged Working unchanged, plus audience-read assertions;
  - pickup: about half the time, renewed from the new network's chance, named on the page and the credit.
- **tests/b27-real-series.test.ts (5):** baselines; nothing simulated for the baseline, numbering and year names; casting only in made simulated seasons; Verified and Simulated tags; journey hears the game's word.

**Existing tests I changed** (each with a dated comment):
- tests/career-awards.test.ts: the part now lifts the run, and the bounds widen by `FORTUNE`.
- tests/career-contracts.test.ts: the 2032 revival notice depends on `pickupOf`.
- tests/career-drawn.test.ts: needs a save with a simulated real season made, with the clock advanced to 2027-05-20.
- tests/pro-work.test.ts: real-series parts excluded from the fixed-part lists and held to made seasons.

**Commands and results**
- `nice -n 19 npx tsc -b --noEmit` is clean. `tsc --noEmit -p .` checks nothing because the root config has `files: []`.
- `npx eslint --max-warnings=0` is clean on every changed .ts/.tsx file.
- Test files that import changed modules, run one at a time:
  - Batch 2, 32 files on c9487c4f: 31 passed (669 tests). tests/journey-career.test.ts failed in beforeAll (see part 6).
  - Batch 3, 88 files on c44383d2: 86 passed (886 tests). tests/b20-guide-wiring.test.ts failed (2 failed, 5 passed; see part 6). tests/b27-audience.test.ts failed, was fixed in eaa441a1, and reran 4/4.
  - After 19051b01: b27-option-hold reran 2/2.
- tests/deciders.test.ts: 216 passed.
- Light tools that pass: title-case, label-sweep, plural-check, voice-check, tics, doc-refs, wired, deciders --check, spelling, typos, inventory --check (193 commands, 132 kinds), coverage, student-matrix, guide-quotes, career-register, completion-matrix, sweep.

**Mutations:** I ran 43, one test file each, and every one was killed. M18 and M21 were run again after 19051b01 and were killed again.
- M01–M06: opening ignores part and quality; band without size; season ignores part; season reads marks after the next word; work day posts nothing; totals drop abroad.
- M07–M12: no limited route; distributor not said or moved; premiere ignores distributor; run ignores limited; home opening is the premiere; Actor Awards ignore split years.
- M13–M16: no pilots; pilot word ignores the part; passed pilot still airs; pilot carries no option.
- M17–M21: option holds no days; accepting gives nothing up; a given-up part is posted again; direct offers continue; every release is granted.
- M22–M29: no invite scheduled; invited part posted again; never grows; grown contract keeps the old guarantee; no raise; pickup keeps the old chance; no pickup; credit names no network.
- M30–M34: baseline season cast; baseline simulated; real word not labeled; counted from one; baseline tagged Simulated.
- M35–M43: invite ignores band; lapse refusal removed; no abroad-first route; "(Simulated)" removed; no Seen On; release chance ignores band; growth ignores audience; audience ratio reads nothing; limited release opens at the full wide opening.
- Results are in /tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27_series_mutations.txt.

4. Player-facing text and new effects

**Text sources to read and mark:**
- **market.ts:** #takenOverWords, #releasedWords, #routeWords, #splitYearsWhy, #routeOf (invented distributor names), #firstTerritories.
- **continuity.ts:** #optionWarning, #seasonFor, #daysWords, #giveUpOptions, #optionReleaseRefusal, #scheduleInvite (label), #pilotSeries, #pilotOfferWords, #pilotTerms, #registerContinuity (command note; release answer, invite and pilot notices and settled lines).
- **series.ts:** #decisionWords, #pickupOf, #seasonName, the registerSeries option handler.
- **projobs.ts:** #renewFromOption, #termsWords, the release handler.
- **reference.ts:** #creditWords, #runFacts, #releaseFacts, #productionPage, #seriesPage, #seasonPage, #episodePage.
- **Other engine:** actorawards.ts#actorCheck; content/series.ts#REAL_SERIES; guide/career.ts#CAREER_GUIDE [career.series], [career.awards], [career.contracts]; tutorial.ts#CHAPTERS (chapter 15); decided.ts#top.
- **UI:** IndustryPane.tsx#BoxOfficePanel and #SeriesPanel; WorkPane.tsx#clauseWords and #ContractFacts; OptionRelease.tsx#OptionRelease.

**New effects:**
- Command: `pro.ask_option_release`.
- Scheduled kinds: `pro.option_release_answer`, `pro.recurring_invite`, `pro.pilot_word`.
- Notice helper: continuity.ts#tellOf.
- Guide promises: career.series to career.contracts, career.offers and career.awards.
- New deciders: `pro.quality`, `pro.pilot`, `pro.recurring`, `pro.grow`, `pro.option_release`, `pro.pickup`.
- Deciders whose reads changed: `pro.audience` and `charts.gross` now read performance; `pro.release` continues into the routes.
- No new reactors or events.

5. ASSUMPTION figures and real-world facts

**ASSUMPTION** (each labeled so where defined):
- `FORTUNE`:
  - size weights: lead 1, supporting 0.6, featured 0.4, co-star 0.25;
  - band weights: exceptional 1, strong 0.5, working 0, unready −1;
  - opening lift 0.35 per unit of term and 0.3 per unit of quality; weekly hold up to 0.06;
  - response: middle 62, spread 20, part 12, noise 6;
  - widen at an audience score of 70;
  - season audience 0.2 (natural log) per unit of term; season critics 8.
- `INTERNATIONAL`: share-of-domestic ranges by kind.
- `LIMITED`: share 0.06, growth 0.25.
- `ROUTES`: limited 2–4 weeks, distributor 30–150 days, abroad first 2–8 weeks.
- `RELEASE_FATE` additions: theatrical limited .12, distributor .05, territory .05; streaming and broadcast distributor .04.
- `PILOTS`: months 1–3, rate 0.6, parts 1–3, sizes and schedules, word on May 15 at 12:00.
- `PILOT`: base .35, quality .2, part .3, clamped .05–.9; option 21 days; airs 120 days; 2 guaranteed, 6 expected.
- `INVITE`: exceptional .6, strong .4; 2 guaranteed, 5 expected.
- `GROW`: +2 episodes, +10% rate; chance .7 / .45 / .1 / 0, ±.3 per bar, at most .9.
- `OPTION_RELEASE`: .15–.85, answer at 15:00.
- `PICKUP`: chance .5, renew .5.
- `REAL_SERIES`: everything except the baseline (season window, 13 episodes, every 21 days, word on May 15, chances).

**Real-world facts used:**
- 9-1-1 season 10 premiered October 15, 2026 (S80).
- 9-1-1 airs on ABC (S81).
- Abbott Elementary was on the air on ABC, with no season number given (S109).
- Actor Awards rules, b25-S48: a seven-day paid run in one of six major markets in the same calendar year as first exhibition.

S80, S81 and S48 are in docs/verification/career-world-2026-10-23/sources.json; S109 is the Abbott Elementary source in content/catalog.ts. All pilot networks, distributors and pickup networks are invented and labeled.

6. Not done, unresolved, and found outside the cluster

- **tests/journey-career.test.ts fails in my clone, and I left it as it was.**
  - Cause: the audition judge is keyed by the opportunity's id (projobs.ts:1677, `pro:${person.id}:${o.id}:${idx}`).
  - Seed v1-21's simulation cancels 9-1-1 in May 2029, so the July 2 posting of the 9-1-1 guest part no longer exists. Every later id shifts, and the August tape comes out Working (64.8) instead of Strong (65.2).
  - Without the gate on that part's series, the booking comes back on October 1–2, 2029 as the test expects. I checked this by temporarily removing that part's series field and replaying.
  - Re-finding the seed here would be undone by the other clusters, which shift the same ids, and would collide with them in one file. It should be re-found once after integration, or the judge keyed by posting the way brief 25 keyed `castingDraw`.
- **tests/b20-guide-wiring.test.ts fails.** docs/verification/audit-2026-10-21/areas/guide/wiring.json, which I'm not allowed to edit, needs `node tools/wiring.mjs --write`, a reading for "Ask To Be Released" (OptionRelease.tsx, issues `pro.ask_option_release`, handled at continuity.ts:380), and 16 handler lines re-pointed:
  - pro.award_enter, pro.actor_submit;
  - pro.ask_more, pro.prepare, pro.accept_offer, pro.move_audition, pro.request_outside_work, pro.ask_hold, pro.decline_offer, pro.submit, pro.tape_audition;
  - pro.update_resume, pro.headshots, pro.cut_reel, pro.mix_demo, pro.set_name.
- **Records left for you to regenerate:**
  - text-inventory: 38 new sources and 22 changed Pending;
  - surfaces: 28 new sources;
  - effects: 8 rows;
  - capabilities: `pro.ask_option_release`;
  - traceability;
  - docs/DEVMAP.md: `node tools/devmap.mjs --write` adds one row. I left it to avoid colliding with other clusters' rows.
  - docs/verification/connected-journey/TRACE.md still quotes the old career.contracts sentence.
- **Limited release:** changes the chart and the credit but not awards eligibility. It is theatrical only, a Los Angeles and New York run already qualifies for the Actor Awards, and Emmys don't take films.
- **Release abroad first:** films only; the register has no Emmy rule on a series airing abroad first.
- **Distributor route and Emmys:** the Emmy path goes through `premiereOf`. It is held by M09 on a film, with no Emmy journey test.
- **Slow Horses and Severance are not continued:** no part reads their seasons, and Severance's latest season in the pages is 2025's.
- **One option per ask:** Ask To Be Released goes to the first option holding the days. Accepting gives up every option that holds them.
- **`bookedClash` is unchanged:** an option holds days rather than booking them, so the agent still submits the actor and the offer says what accepting costs.
- **Guide gap:** the guide's career.offers line (career.ts:845) lists only held back, streaming and shelved. The new routes are explained in career.series.
- **Found outside the cluster:** tools/inventory.mjs:61, and the same pattern in tests/b20-guide-wiring.test.ts, only resolve kind constants with one dot. pro.series.episode, pro.series.option, pro.residual.air, pro.residual.pay and pro.pay.payday are invisible to them. I renamed my own kinds to single-dot names.