# Brief 25's Checkpoint

The state of the work, kept so a session that's interrupted can pick it up. The register (`register.json`, checked by
`node tools/career-register.mjs --check`) is the requirement-by-requirement truth; this says where the work is.

## Starting Point (2026-10-23)

- **Brief:** `docs/verification/briefs-2026-10-16/25-master-career-build-command-and-global-acting-career-research-dossier.txt`,
  copied from the session's transcript, every byte as sent (144,813 bytes; the dossier's Sections 1 to 29 with it).
- **Branch:** `claude/peaceful-hamilton-59zdbb`, from `b46ee301` (`main`, #63), level with `origin/main`. No stash, one
  worktree, nothing uncommitted.
- **Gate on that code:** exit 0 on `8d4139de` in a clean clone (488 of 488 test files, 5,616 of 5,616 tests, 22 checks).
- **Audit:** `audit.md`. The brief reverses the owner's choice of 2026-10-21 of fictional agents and projects only; the
  fictional agent and every save's history with him stay.

## Modules

| # | Module | State |
|---|---|---|
| 0 | Starting point, register, sources, checker | Done: `f341b3b1` |
| 1 | The overseas engagement: Sydney, travel, presence, stay, permission, work, pay, return | Done: `6261883e`, `880d4231` (W1 to W12; see below) |
| 2 | The real industry catalog and simulated roles drawn from it | Done: `de50c6e0` (C1 to C12; see below) |
| 3 | Real agencies and agents in the representation engine | Done: `0978f022` (A1 to A8; see below) |
| 4 | Contracts, options, episode guarantees, payment states, residuals, renewal and cancellation | Done: `584321a6` (D1 to D9; see below) |
| 5 | Distinct production workflows | Done: `ba6f62e2` (W1 to W13; see below) |
| 6 | Weekly charts, festivals, awards and the anonymous field | Done in this commit (X1 to X16; see below) |
| 7 | The time loop's deadlines, drill-downs, tutorials, balance seeds, playthroughs, the final gate | Waiting |

## Blockers Met

| What | Tried | Affects | Fallback |
|---|---|---|---|
| The ATO's foreign-resident withholding pages (S28) | curl with a browser's user agent, WebFetch, the ATO's public content API: each HTTP 403, 2026-10-23 | Australian tax on pay for work in Australia (GEO-06, GEO-19) | The indexed summary is kept in `sources.json` as an excerpt and not used as a verified rule. Australian tax is shown as not worked out by the game, never as nil. |
| Cast pages for 9-1-1 (S88) and Abbott Elementary (S86), and Universal's upcoming films (S83) | Each read 2026-10-23: HTTP 200, but the page loads its list in the browser, and its text holds none of it | Characters for those casts; a second studio's slate (CAT-03, CAT-09) | Recorded as unresolved in `CATALOG.md`. 9-1-1's and Abbott Elementary's casts come from their press pages (S80, S109), which name characters; no film from Universal is in the catalog. |
| Amazon MGM Studios' press dossier (S84) | Located, not read | Per-film details beyond the slate's lines | The slate's own line for each film is the record; what it doesn't give is unknown. |
| CAA's, UTA's and Curtis Brown's pages (S89's agents, S90, S103), and CAA's home and terms | Each read 2026-10-23 and 2026-10-24: HTTP 200, but the agents and routes load in the browser | Real agents and routes at those three (REP-03) | Each is in Agencies with what its pages gave, and what they didn't as unknown; no one there is in the game. |
| Stewart Talent's Atlanta office | Its contact page (N08) says referrals only; its submissions page (N09) says email from Southeast residents; neither is dated | Atlanta's way in | Unknown, both pages said. |
| The Academy Awards' rules and key dates, BAFTA's film rules (N28) | Each 2026-10-24: HTTP 403 | Whether a film is eligible for an Oscar or a BAFTA (AWD-02, AWD-04) | In the inventory as refused; the game doesn't decide either. |
| The Actor Awards', the Golden Globes', the Gotham Awards' and the Annie Awards' rules pages; AACTA, Annecy; TIFF's submissions (N28) | 2026-10-24: HTTP 404 for the first four; AACTA's and Annecy's sites not reached (the proxy's tunnel failed); TIFF's page answered 202 with a check and no body | Those competitions' eligibility (AWD-02, AWD-03) | In the inventory as not reached; the game doesn't decide them. |
| A provider integration for the charts | Not tried: the brief buys no data service, and reading a public page isn't leave to reuse it automatically | Charts that update themselves (CHART-04) | The charts are dated imports, each saying how old it is. |
| The 408 visa's charge and processing time (S01) | The page read in full on 2026-10-23; both are loaded by the department's estimator tools, not in the page | What the visa costs and how long it takes | Shown as not known to the game. Any time the game takes for a decision is its labeled assumption. |

## Module 1, As Built (2026-10-23)

- **The countries** (`content/jurisdictions.ts`): Australia verified (the 408 from S01, the 444 from N02, each verified
  condition holding the page's own words, each assumption saying so); the UK, New Zealand, Canada, France, Japan and
  India partly researched; the other 244 unsupported. `COUNTRIES.md` is generated from it (`npx vite-node
  tools/countries.mjs --write`), and `tests/career-world-countries.test.ts` holds both to `sources.json`.
- **The trip** (`systems/worktrip.ts`): legs by car and by air through a hub, in each town's own zone; the hotel; where
  the player is, derived from the legs (`whereAt`); the visa applied for from the engagement and decided ten days on;
  the first flight refused without it, and the production's release; a missed flight out calls the whole trip off, a
  missed flight home is rebooked a day later.
- **The work**: Harbor Line, a fictional studio feature in Sydney, for an actress or an actor, open to self-tapes and
  outside an agent's agreement. Its days are Sydney's 7 AM; permission on each is Australia's; pay is the existing
  payroll's, recorded as income earned in Australia, without commission.
- **The screens**: the offer's warning; the Work tab's The Trip To Sydney (permission, Apply For The Visa, the legs, the
  hotel, What The 408 Visa Asks, what isn't in the game yet); the trip's steps in What Happened; Papers lists the visa,
  and its Your Work And Your Permission reads Australia's rule for the work.
- **Defects found by its tests and fixed**: Papers read the US rule for work in Sydney ("You're a US citizen, so you can
  work for any employer in the US."); after a missed flight out the legs home still ran and said the player was back;
  a missed flight's history lowercased place names; SAG-AFTRA eligibility was announced at a first day the player never
  worked (since brief 19, for local work too), and is now read from the first day worked.
- **What adding a project changed**: life A's career (tests/journey-career.test.ts), whose opportunity ids shifted, so
  casting's keyed draws fell otherwise: she was offered and paid for Jess in Static On Route 9 in the summer of 2029.
  The test says so; the rest of her journey is as it was.
- **Measured**: the full suite on `6261883e`, 488 of 490 files and 5,629 of 5,632 tests; its three failures (Harbor
  Line's genre weights unstated, a test's premise that every project is in New York) are fixed in the next commit.
- **Left for later, each a register row**: flight delays and missed connections (T24, T25), a stay extended (T26),
  weather (T31), allowances and per diem, Australian tax (GEO-19, blocked on S28), jet lag (GEO-13), the five partly
  researched countries' rules.

## Module 2, As Built (2026-10-24)

- **The catalog** (`content/catalog.ts`): what thirteen official pages said on 2026-10-23, field by field. Every field
  is a reading (its source, the words it rests on, held to `sources.json` by the test), a conflict kept with both
  sources and the later used (I Play Rocky's release), the game's assumption, or unknown with why; none is a default.
  Four series (9-1-1, Slow Horses, Severance, Abbott Elementary) and the twelve films of Amazon MGM Studios' slate;
  thirteen companies, each named by the role its page gives (producer, in association, broadcaster, streaming
  platform, distributor, studio label), and nothing said of who owns whom; performers credited for the scope their page
  gives; no filming location, none being given. `CATALOG.md` is generated from it (`npx vite-node tools/catalog.mjs
  --write`): 13 pages, 21 titles named, 16 imported, 4 merged, 3 unresolved, 116 of 175 fields unverified.
- **Parts drawn from it** (`content/careerwork.ts`): Reese Pike in 9-1-1 and Casey Marlow in Abbott Elementary, new
  characters in seasons the game imagines, each a co-star for an actor or an actress, through an agent only, at
  SAG-AFTRA's day minimum, cast by the production's casting office, unnamed. The role, the offer and the engagement say
  it's the game's own and that no one at the production is casting it; the role shows the production as its pages had
  it. No part is drawn from a film, from Severance (no season ahead in its pages) or from Slow Horses (the UK's rules
  aren't in the game).
- **Los Angeles** is a trip from home, as Sydney is: the production's flights and hotel, the player away for the whole of
  it, the US rule for permission, no visa. Each day's call is at the shoot's hour on Los Angeles' clock.
- **Casting is keyed by the posting** (the project, when it was posted, the round), not by the opportunity's number in
  the save, so a part added to the game moves no other part's casting. The seeded career journeys moved once with the
  key, and each says in the past tense what it had been.
- **A defect found reading the text, and fixed**: the Opportunities tab's head, its agent-only list, the agreement's
  Who line ("Fictional, as every project in the game is"), the guide, the tutorial and the agent's notice all said every
  project, company and casting office was invented for the game, which the drawn parts made untrue. Each now says which
  it is, and `tests/pro-opportunities-screen.test.ts`, `tests/propay-screen.test.ts` and `tests/career-drawn.test.ts`
  fail on the old words (each mutation run and killed).
- **Measured**: the full gate in the Module 2 clone: 491 of 492 test files and 5,648 of 5,649 tests passed. The one
  failure was the guide's wiring readings, whose handler lines the text fix's comments had moved down six lines in
  `projobs.ts`; recomputed, its two test files pass (44 tests), and so do the gate's 23 checks, which the failure had
  stopped.
- **Left for later, each a register row**: episodes one by one and a casting director or representative in the catalog
  (CAT-01); a second studio's slate (CAT-03, CAT-09); rechecking a fact when a later module puts it to use (PROV-03); a
  real director's fictional offer (PROV-05); a data update that never erases a save's history (PROV-07).

## Module 3, As Built (2026-10-24)

- **The owner's word**, 2026-10-24: "Use real agents." The plan put to them: Stewart Talent's New York theatrical agents,
  reached by referral, Jordan Parente left out as on 2026-10-21, Thomas Ashgrove kept as the game's own, and nothing
  said of a real agent's list, clients or preferences.
- **The agencies** (`content/agencies.ts`): the six the brief names, each as its own pages had it, office by office:
  what it does for actors, each office's way in, the agents it names for acting, and what the game does with it. Every
  field is a page's words held to `sources.json` or unknown with why. Stewart Talent's four offices (New York and Los
  Angeles take no unsolicited submissions; Chicago takes them by mail or email; Atlanta's two undated pages disagree);
  United Agents' London route; WME's terms (no submissions of any kind); CAA, UTA and Curtis Brown, whose pages load
  only in a browser. No agency is ranked, and print's form is never an actor's route.
- **The agents** (`content/agents.ts`): Dan Patack, Jay Schachter, Rachel Grandizio and Tim Marshall, Theatrical Agents
  at Stewart Talent's New York office, beside Thomas Ashgrove. A referral is the one way in; a real agent's list isn't
  a factor (six, not seven), and the chance reads one assumption for every real agent. Each is named, never given a
  pronoun: the engine's words became the agent's own (`agent.words`), and Ashgrove's sentences stayed word for word.
- **One agent at a time** (`signRefusal`): a second agreement can't start while one runs; it can be declined.
- **The tab**: Agents, a chooser that opens on the agent who represents you or one under way, the chosen agent's
  panels, and Agencies at the foot. The guide's four representation chapters and the tutorial's speak of agents, not
  of one.
- **Defects found and fixed**: Ashgrove's notice said "as every agency in it is", untrue once Stewart Talent came in;
  the agreement's Ending It term said "through him" for every agent; a drawn part's breakdown read "The production’s
  casting office’s breakdown"; and the agencies' records first showed the player source ids for Atlanta.
- **Measured**: the full gate in the clone: 492 of 493 test files and 5,659 of 5,660 tests passed. The one failure was
  the guide's wiring readings again, whose handler lines the breakdown sentence's fix had moved three lines down in
  `projobs.ts`; recomputed, its two test files pass (44 tests), and so do the gate's 23 checks, which the failure had
  stopped. The new tests/career-agents.test.ts (11 tests) holds four mutations: the real room read as near, one agent at
  a time removed, a real agent given pronouns, and the showcase route said for every agent; each fails it..
- **Left for later, each a register row**: negotiating terms and renewing (REP-06); a direct inquiry to an office that
  takes one, Chicago's (REP-07); skills as a material and territory beyond New York (REP-08); a submission to United
  Agents, once UK work is in (REP-13); a real director's offer (PROV-05).

## Module 4, As Built (2026-10-24)

- **The rules read**: the AMPTP-published agreements (N12, the 2026 memorandum; N13, the 2014 Codified Basic Agreement;
  N14, the 2014 Television Agreement; N15 to N17, the 2017, 2020 and 2023 memoranda); SAG-AFTRA's own pages refused this
  build (S21, S41, S95, S96: HTTP 403). The ratification's date is from press reports (N18).
- **The contract** (`systems/contracts.ts`): made when an offer is accepted, kept on the engagement: classification and
  billing, format, agreement, the day made, service dates, place, basis and rate, the estimated gross (said as an
  estimate, never cash) and the payments it promised; clauses only where they apply: a SAG-AFTRA day's overtime, residuals
  on television, the producer's pension and health contribution, a trip and its per diem, a recurring part's episodes
  and its option, deferred pay. The Work tab's The Contract shows it.
- **Each payment's state**: Estimated, Earned, Due, Overdue, Disputed, Held For You, Settled, Deferred, read from the
  record and the clock; payments the work no longer owes listed apart. A non-union producer pays late three times in ten
  (the game's), and Ask About It brings the pay to the answer.
- **Overtime** (N13 Schedule A §9): the eleven-hour shoot day, an hour of it lunch, pays two hours at time and one-half.
  **Contribution** (N16, N12): 19.5%, then 20.5% from September 6, 2026, shown and never posted to the player. **Per diem**
  (N13 §35.B(2)): $60 a day away, paid once home, not wages. **Residuals** (N14 §18): four records, the first telecast
  paid by the salary, a network prime-time rerun 100% of total actual compensation (overtime at straight time) up to
  $3,668 or $2,578, within thirty days, paid once by its key.
- **A series' seasons** (`content/series.ts`, `systems/series.ts`): The Calloway Files shoots each season from mid-July
  to May; its seasons are ordered through 2029's, and from May 2030 the network decides each May by a draw keyed by the
  series and the year (decider `pro.series`), a canceled series able to come back from its second year off. Canceled, its
  castings close, work not yet done is called off with nothing owed, the pay earned stays, an option lapses once; renewed,
  nothing is booked by itself; revived, it's cast again with the old work unchanged.
- **A recurring part**: Assistant DA Whitlock, guaranteed two episodes of thirteen, expected in up to five, each further
  episode called or not two weeks ahead (decider `pro.episode`), the work not over while one is pending; an option on the
  next season at 5% more a day, taken up or let go by June 30 (decider `pro.option`), taken up into the contract's next
  version through the same agreement, its commission owed as a renewal's.
- **Moved with the code**: a recurring part's episodes three weeks apart average under twenty hours a week, so alone they
  aren't employment for OPT, and the Work tab's permission line says so; the seeded career journey's Desk Clerk pays its
  overtime, $4,241.06 where it paid $3,084.40, with its commission and dues after it.
- **Mutations**: 22 run against tests/career-contracts.test.ts (`m4mut/run.py` in the session's scratchpad), every one
  caught: among them the overtime's premium, the Health Plan's 1%, the contribution unrecorded, a first telecast that
  pays, a settlement or a per diem paid twice, the work wrapping with episodes pending, the option always taken up or
  raising nothing, a cancellation calling nothing off, a series always in production, asking moving no payday, the
  residual's base taking the overtime premium, no ceiling, a renewal booking work, the season's order guaranteed.
- **Left for later, each a register row**: negotiation beyond scale plus ten and onboarding (CON-01); publicity, riders and
  expenses beyond the per diem (CON-02); box office and charts (CON-10, Module 6); an award cycle for a revived series
  (T93, Module 6).
- **Measured**: the full gate in the Module 4 tree, exit 0: 494 of 494 test files, 5,691 of 5,691 tests, and the 23
  checks. Two runs before it failed, and what they found was fixed first: a test of brief 19's, written when every
  non-union producer paid on its due, now runs the clock to the payday late pay sets (tests/propay.test.ts); and the
  later checks, which the first failure had stopped, found the capabilities page spelling "canceled" the British way, the Work tab's pay table
  saying a payment's state twice ("Estimated" in its State column and again opening Where It Stands, now said once),
  `pro.ask_pay` traced nowhere (now in docs/verification/connected-journey/TRACE.md, regenerated), and the contracts
  capability unreviewed (now its builder's reading in docs/verification/review-2026-10-13/capabilities.json).

## Module 5, As Built (2026-10-24)

- **The rules read**: N13, the 2014 Codified Basic Agreement: Schedule A §21.E (a half-hour multicamera series'
  rehearsal begins its employment), §21's fourth exception (an animated feature's voice-over outside consecutive
  employment), §28.A (a recall to loop: half the pro rata day for four hours, within four months, six for theatrical,
  pilots and long-form television, a closed-end series among it), §37 (dialogue replacement: a day's pay by characters and
  synchronized lines, one character alone a day; vocally stressful work said beforehand or refused), the General
  Provisions' §28.B (a stunt only with consent and a qualified coordinator there) and §43 (nudity and simulated sex: said
  before the audition, a closed set, written consent, withdrawn until shot, a double then); N17, the 2023 memorandum's
  performance capture (no consecutive employment, drops and pickups unlimited, several characters a day at no more pay).
  The Television Animation Agreement wasn't read: its sessions are paid the day performer's minimum, said as estimated,
  and its residuals as unread.
- **The ways of working** (`content/workflows.ts`): ten workflows (a stage play, single camera, multicamera, the booth,
  dubbing, performance capture, narration, reenactment, a musical, action) and twenty-one formats, each with its days,
  its judged and build steps, its preparation and its own step (Find The Voice, Watch The Original, Work On The Movement,
  Check The Pronunciations, Study The Period's Movement, Practice The Choreography, Fight Rehearsal), its choices, what
  it leaves (a reel or not) and its terms: takes and the extra takes a day allows, how often pages change, the board
  (the story's order, by location, an episode's own days, two episodes cross-boarded), scenes a day, how it comes out,
  an anthology's return, a recall to loop's months. Every project names its format; a test fails two workflows or two
  formats that are the same in every part.
- **A day of work** (`systems/workflow.ts`): the part's units planned at booking, numbered by their place in the script
  and dealt to the days by the board (decider `pro.board`), keyed by the work, never an id, so a reload and a twin draw
  the same. A judged day plays each unit in takes, the best printed, reads the choices in force, asks a quarter more of
  the breakdown for a scene shot before what leads into it, picks up a tape night's scene played under Working without
  its laughs, and a narration's chapter at the end; a build day (a table read, blocking, music rehearsal, choreography,
  fight rehearsal) builds the preparation. Each day leaves a report the Work tab shows.
- **The choices** (`pro.work_choice`, a button for each option on the Work tab): Ask For Another Take, Pitch An Alt,
  the studio audience, screamed lines not announced, matching the original, playback, pacing a read, the historian's
  notes, marking a rehearsal, the stunts and the intimate scene; each one's effect said before it's pressed.
- **The voice** (`health.voice`): voice work strains it by the hour, screamed lines more, rest eases it two points an
  hour, and a strained voice holds back the work that uses it, at most to 60%.
- **After the wrap**: revised pages the evening before a day take a share of what was learned (decider `pro.pages`); a
  recall to loop after a screen wrap about a third of the time, on a weekday clear of booked work, paid half a day
  (decider `pro.loop`), missed or not permitted another actor's; at the release, a scene cut two times in ten (decider
  `pro.cut`), the credit's band the best of the days on the scenes kept; an anthology's strong work invited into its next
  story without an audition; the release notice says how the work came out, by its format.
- **Boundaries**: an intimate scene is said in the role and the offer before anything is agreed; without written consent
  a body double does it, unjudged, and the part, the pay and the casting are as they were; consent can't be withdrawn
  once it's on film. A stunt is the double's unless the player consents; done yourself, the chance of an injury rests on
  the fight rehearsal and the body, and workers' compensation answers it.
- **Fixed on the way, found by its tests or a check**: a procedural's scenes were dealt across all its episodes' days, as
  a location board deals them, so a recurring part's first episode could shoot a scene of its second; they're kept to
  each episode's days now. `FormatSpec.after` was read by nothing until the release notice read it, and `closedEnd` was
  read by nothing and is gone. The dub format's words gave a rule the code doesn't keep. A day's report said "it worked on
  the blocking and fight rehearsal". The ability descriptions' test (tests/attributes-phase-2b.test.ts, A4) had no piece
  of the eight new tasks to hold them to; it has one of each now, built by `unitContext`. Every new project states its
  genres (`content/genre-weights.ts`), which until tests/b22-genre-weights.test.ts failed them were read evenly.
- **Not modeled, said so**: `daysOnly` sets the contract's words, and no format's days have weekdays between them that
  the rule which pays them would reach, so consecutive employment isn't modeled elsewhere; a director who overrules the
  actor; a stunt's pay adjustment; Equity's musical-specific rules beyond LORT's; looping abroad; a festival run, which
  is Module 6's (WF-19 is Partially Implemented for it).
- **Mutations**: 32 run against tests/career-workflows.test.ts and tests/career-workflows-screen.test.ts (`mutate/m5.py`
  in the session's scratchpad, in a copy of the tree). 26 were caught on the first run; six survived, each a test that
  checked one side or the code's own constant (the historian's notes, a cut's band, an anthology inviting weak work, a
  scene shot ahead, voice-over commission while represented, a tape night's order), and each test was made to hold it.
  All 32 are caught.
- **Measured**: the full gate in the Module 5 tree, exit 0: 496 of 496 test files, 5,727 of 5,727 tests, and the 23
  checks. The suite's first run had 11 failures, each a test written before the work it reads changed: three ability
  tests and the Profile's Today rows (Listening now read in a dub's execution, Vocal and Physical Expression in
  believability), the film school's release words ("was screened at its film school"), the day's report ("you worked
  on"), an earlier twin of the fatigue test meeting the new evening pages, and the older graduate's referral; each was
  read against the new rule and moved with it.

## Module 6, As Built (2026-10-24)

- **The sources read** (each in `sources.json`): Box Office Mojo's domestic weekly chart for 2026's weeks 41 and 42 (N19,
  N20), Netflix's global Top 10 file (N21) and Nielsen's streaming Top 10 for October 5 to 11, 2026 (N22), each read once
  on 2026-10-24; the 78th Emmy Awards' Rules And Procedures, version 4 of April 7, 2026 (N23); the 2026 International Emmy
  Awards' rules (N24); the 2027 Sundance Film Festival's submissions page and its dates (N25, N26); NATAS's rules page, the
  festivals' regulations read in part and the home pages (N27, N29, N30); and what refused this build or wasn't reached
  (N28, each attempt kept).
- **The published charts** (`content/charts.ts`, `systems/charts.ts`): six charts, eleven weeks, each snapshot with its
  measured week, who saw it and when, and each rank's figure or Not Reported. An import is checked: the same week twice is
  nothing new, a changed figure is a revision with the first kept (Box Office Mojo's week 42, read by the dossier on
  October 23 and by this build on October 24), and a malformed one is refused with why. Movement only between consecutive
  weeks of one chart; a title new to the game's record is never called a new release; outside the published Top 10 is
  never a place. A week the clock hasn't reached the end of isn't shown, and the latest says how old it is.
- **The game's own box office**: a released film in cinemas has a run drawn by the film (decider `charts.gross`), its
  opening from its kind's range, each week a share of the last, ranked among the game's own unnamed releases. It's the
  production's: it posts nothing, and how the player's part went doesn't move it (CON-10, T98).
- **The inventory** (`content/awards.ts`): the brief's fourteen awards and eight festivals, each with its organizer,
  sources and coverage. Three decide: the Emmy Awards and Sundance, whose rules were read and are followed, and the
  International Emmy Awards, whose rule (a program produced outside the U.S.) says every series the game casts isn't
  eligible. The rest say the game doesn't decide them.
- **The Emmy Awards** (`systems/awards.ts`): eligibility by the 78th's rules, its year June 1 to May 31 read from the
  release on the clock; a guest category for a part in under half the season's episodes at 5% of the episode entered;
  supporting in a limited series at 5% of the whole series, in a movie or an anthology at 5% of it; a series' supporting
  part with no minimum; a guest part once nominated as a supporting one stays supporting; dubs, documentaries and films
  refused, each with the rule. Enter Yourself (`pro.award_enter`) pays the $125 processing charge and the $100 entry fee
  by the deadline; the production may enter a part the player didn't (decider `awards.entry`), only one it had by the
  deadline. At the nominations each category's anonymous field is drawn (decider `awards.field`, keyed by the category's
  kind, so an actor's and an actress's categories share its size and the 78th's parity holds) and nominated by the
  table and the tie rules; the final round settles the winner (decider `awards.final`), given at the ceremony; Watch The
  Ceremony (`pro.watch_ceremony`) shows it and changes nothing. An entry whose scenes were all cut is disqualified. Every
  later edition is the 78th's rules carried forward, said so.
- **Sundance**: a film's category by its running time and kind, the production's submission at the deadline (decider
  `festival.submit`), the festival's word (decider `festival.select`) and the screening, kept apart; a feature released
  before February 1 loses its world premiere, said before the release; a short finished after the window's day is
  eligible whatever its premiere; a studio's film isn't sent by open submission; the player can't submit anything.
- **Recognition**: kept for good on the Portfolio (a nomination, a win, a selection); casting's chance lifted by it,
  fading over three years, at most 30% better, never past casting's ceiling (`visibilityOf`, `castingDraw`).
- **The screen**: Career's Charts And Awards tab, with Your Recognition, Your Films In Cinemas, Published Charts and
  Awards And Festivals; the guide's chapter Charts, Festivals And Awards; Finding Work's paragraph on the tab.
- **Read again once built, and changed to the rules**: the first build held every part to 5% of an episode, let a guest
  part stay a guest after a supporting nomination, gave a dub's refusal a reason the rules don't, and refused every short
  finished before the festival's window though one not out before then is eligible (its probe of sixteen lives found no
  short ever reached the festival). Votes in whole points tied at the nomination line in about half of the categories a
  probe drew; in tenths a tie is the exception the rules make it. Two of Netflix's weekly Raw episodes shared one title id,
  and Nielsen's East of Eden had one of its own; each is fixed. The entry deadline ended at midnight in New York; the
  rules give the Academy's other deadlines in Pacific time, so it ends at midnight in Los Angeles. The gate's first run
  failed one test, tests/cohesion.test.ts, which holds that only enjoyment reads a genres field: the children's
  animation rule read a project's tags directly, and reads them as every other system does now (`requirementOfRole`).
- **Not built, each a register row**: country and worldwide box office and a rank-only chart (CHART-01); a provider
  integration (CHART-04, not authorized); the weekend chart (T69); another festival's rule that a selection elsewhere rules
  a film out (AWD-08); anything that delays a release (T48); a revival's part played to an entry (T93).
- **Mutations**: 42 run against tests/career-awards.test.ts and tests/career-awards-screen.test.ts (`mutate/m6.py` in the
  session's scratchpad, in a copy of the tree), across the charts, the eligibility rules, the entry, the table and its ties,
  the field, the final round, the ceremony, disqualification, Sundance and casting's lift, and two more after the gate's
  first run (the deadline's clock, the children's animation rule). All 44 were caught on the first run.
- **Measured**: the gate on this tree: tsc, eslint, 497 of 498 test files and 5,766 of 5,767 tests. The failure was
  tests/b20-guide-wiring.test.ts: the guide's wiring list named awards.ts's lines for its two commands as they stood
  before the entry deadline's helper moved them. Regenerated, the file passed, 7 of 7, and the 23 checks passed.

## Next Concrete Action

Module 7: the time loop's deadlines, the drill-downs and tutorials, balance over a hundred seeds, the playthroughs, the
final runs again (the measured rows Modules 5 and 6 left behind), and the final gate in a clean clone, then the report.
