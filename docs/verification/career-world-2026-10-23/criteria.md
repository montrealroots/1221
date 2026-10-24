# Brief 25's Criteria, Written Before The Code They Judge

Each module's checks, written before its first line of code. A check is met when the game does it and a test fails
without it. Each names the register rows and the dossier's scenarios it serves.

## Module 1: Work Abroad, Sydney First (2026-10-23)

The dossier's handoff: "Start with a local engagement and an overseas engagement sharing contracts, calendar, location,
work reports, banking, papers and history." The local engagement is brief 19's. This module adds the overseas one, on
the same record (`person.pro`), the same work loop, the same pay and the same papers.

| # | Check | Rows |
|---|---|---|
| W1 | A registry of countries says, for each, how far its rules for screen work are researched: verified for an activity, partially researched, or unsupported. Australia's Temporary Activity (subclass 408) visa, Entertainment Activities stream, is the first verified route, its conditions from S01 as read on 2026-10-23. The US is the existing package. The UK, New Zealand, Canada, France, Japan and India are partially researched: their sources are named and their rules aren't extracted. Every other country is unsupported. A generated page lists them. | GEO-01, GEO-02, GEO-03, GEO-06, GEO-12 |
| W2 | An unsupported country never grants permission: a role there can't be accepted, and the refusal says the rules for working there aren't in the game. | GEO-12, T19 |
| W3 | A fictional feature shooting in Sydney is a project like the others, its parts written for an actor and an actress, open to self-taped submissions. It's outside an agent's agreement, whose territory is the United States: no commission, and the agent doesn't submit for it. | BASE-09, REP-08 |
| W4 | Accepting it is a contract, not permission. An Australian citizen needs nothing more. Anyone else is told, before and after Accept, that the work needs a 408 visa, which the production supports, and that it's applied for once the contract exists. | GEO-02, GEO-06, CON-01, T11 |
| W5 | The 408 is applied for from the engagement: it needs the contract, a passport in force past the trip home, and no grant already. It's a permit in Papers, tied to the engagement, pending until the department's decision. The game doesn't know the charge or the processing time: it charges nothing, and the decision's delay is its labeled assumption. | GEO-14, GEO-06, PROV-10 |
| W6 | Booking the work books the trip: a car to the airport, the flights, and the production's hotel in Sydney. Each leg has local departure and arrival times in its own zone and a positive duration, the outbound arriving at least a day and a half before the first call, the return the day after the last shoot day. A flight across the date line arrives on a later calendar day than its elapsed hours alone would say. Each leg says it's the game's schedule, not a real flight's. | GEO-13, GEO-22, T21, T22 |
| W7 | The player is where the trip has taken them, and only after arriving: in transit during a flight, then in Sydney. Home stays New Haven, so the bank, the taxes and the School's residence read what they always did. | GEO-21, T21 |
| W8 | Away, nothing in person elsewhere can be gone to: classes are missed (excused only where the dean approved the work), an audition in New York is missed and says where the player was, and another booking whose days fall in the trip is refused. | GEO-16, GEO-21, T28 |
| W9 | At the first departure, without a 408 in force for the first work day (or a passport in force), the player doesn't fly, and the production releases them: nothing worked, nothing owed, no penalty, said with the reason. | GEO-06, GEO-12, T12 |
| W10 | Work days in Sydney start at 7 AM Sydney time, a short trip from the hotel, and are judged as other shoot days. Permission on the day is read by Australia's rule. Pay is the existing payroll's, recorded as wages earned in Australia, with no commission. Australian tax on it isn't worked out, and the payment says so. | GEO-15, GEO-19, CON-05, T11 |
| W11 | The return brings the player home on arrival; the stay ends. Each step (departed, arrived, checked in, checked out, home) is in the engagement's history once. | GEO-13, CONT-01 |
| W12 | Saved and loaded at each stage, the trip, the place and the pay are as they were, and nothing is paid twice. | CON-08, CONT-01 |

What this module leaves for later, each a register row: flight delays and missed connections (T24, T25), a stay
extended (T26), weather on outdoor days (T31), allowances and per diem, Australian tax, and jet lag. SLATE's body clock
went in the scope reset of 2026-10-09; the trip tires the player through the existing condition alone.

## Module 2: The Real Catalog, And Parts The Game Draws From It (2026-10-23)

Parts 3, 5 and 6. The catalog is reference data: what official pages said when this build read them, kept apart from
what happens in a save. A part the game draws from a real production is the save's own invention and says so wherever
it's shown.

| # | Check | Rows |
|---|---|---|
| C1 | Every catalog field is one of four kinds, kept apart: a fact read (its source, the day this build read it, the page's own date where it gives one, its territory, and the words it rests on), the game's assumption (said as one), an event of the save, or unknown (and why). A field no source gives is unknown, never a default. | PROV-01, PROV-02, CAT-10 |
| C2 | Companies are records of their own, and a production names each by its role: producer, co-producer, in association, broadcaster, streaming platform or distributor. Apple TV streams Slow Horses, which See-Saw Films produces; ABC airs 9-1-1, Hulu streams it, and 20th Television produces it in association with Ryan Murphy Television and Brad Falchuk Teley-Vision. | CAT-01, CAT-02 |
| C3 | Reference records for 9-1-1, Slow Horses, Severance and Abbott Elementary, and Amazon MGM Studios' announced theatrical slate for 2026 and 2027, from the official pages read on 2026-10-23. | CAT-05, CAT-06, CAT-07, CAT-08, CAT-09 |
| C4 | A performer is credited for the scope the source gives: Slow Horses' season six ensemble from that season's release, Olivia Cooke as Sid Baker in season six. A cast page that names no characters credits the performer and leaves the character unknown. | CAT-12, PROV-09 |
| C5 | No filming location is taken from a story's setting: a title's filming location is unknown unless a source says it, and a drawn part's place is the game's assumption, said as one. | CAT-11 |
| C6 | A generated coverage inventory lists the pages inspected, the titles they named, the titles imported, the duplicates merged, the records left unresolved (pages whose words load only in a browser, pages that refused) and how many fields are unverified. It claims nothing beyond them. | CAT-03, CAT-04 |
| C7 | Where two sources disagree, both are kept, the later one is used, and the disagreement is said: I Play Rocky's November 20, 2026 (S82, April 16) against November 6, 2026 in select theaters (S110, last changed October 22). | PROV-03, PROV-02 |
| C8 | A part drawn from a real production is a new character in a season to come, with dates after the research baseline. The role, the offer and the engagement each say it's the game's invention, not a casting notice, and that no one at the production is casting it. No part is drawn from a film announced or released, from a production whose next work the game has no grounds to imagine (Severance), from a country whose rules and pay aren't in the game (Slow Horses, in the UK), or into a regular's character. | CAT-13, CAT-14, PROV-04, PROV-08, PROV-09, T61 |
| C9 | A drawn part names no casting director, salary, deal or contract its sources don't give: the casting office is the production's, unnamed; the pay is the union's minimum. | PROV-06 |
| C10 | A drawn part in Los Angeles is a trip from home, as work abroad is: the production's flights and hotel (its assumption), the player away for the whole of it, the US rule for permission, and no visa. | GEO-13, GEO-21 |
| C11 | Casting's draw is keyed by the posting itself (the project, when it was posted, the round), not by the opportunity's place in the save's numbering, so a role added to the game changes no other role's casting. | CAST-11 |
| C12 | Played: a represented life is put up for a drawn part, tapes, is decided, and booked work and its credit read as any other's; saved and loaded, the same. | CAT-14, CONT-01 |

## Module 3: Real Agencies And Their Agents (2026-10-24)

Part 4, at the owner's word on 2026-10-24: "Use real agents." These checks were drafted before the code, in the session's
notes, and written here with the module. An agency is a record of its own, and so is each agent, a real one from what
its agency publishes: a name, a role, a department, an office, the office's own way in, and the day this build read it.
What a real agent does in a life is the save's own invention and says so; nothing is said of a real agent's
preferences, list or clients.

| # | Check | Rows |
|---|---|---|
| A1 | Agencies and agents are separate records. Each real field is a page's words, held to `sources.json`, or unknown with why. The game's own agent and agency stay, and say they're invented. | REP-01, REP-02, REP-03, PROV-01 |
| A2 | Stewart Talent's four offices, each its own way in as its page gives it: Chicago's Film/TV/Theatre division takes a picture, a résumé and a reel by mail or email; New York's and Los Angeles' take no unsolicited submissions; Atlanta's two undated pages disagree, so its way in is unknown. Print's form is never an actor's route. | REP-09, REP-07 |
| A3 | The theatrical agents the New York office's page names are in the game, each in the page's words for name and role, with no specialties, clients, list or room given. Jordan Parente is left out: the owner chose on 2026-10-21 not to depict him, and the plan they agreed on 2026-10-24 left him out. | REP-02, REP-05, REP-10, PROV-06 |
| A4 | By office: an unsolicited submission to New York is refused in its page's words, and a referral from someone the player worked with reaches its agents, the game's reading that a referral isn't unsolicited, said as one. WME takes no submissions of any kind (its terms); CAA's, UTA's and Curtis Brown's ways in aren't in the pages read; United Agents' is shown, and no one there is in the game while work in the UK isn't. No agency is ranked. | REP-07, REP-13, REP-04 |
| A5 | A real agent's answer is the game's: how likely an office is to take an actor further is one assumption for every real agent, never a fact about one, and room on a real agent's list is unknown, so it's no factor. | REP-10, PROV-05 |
| A6 | One agent at a time: a second agent's agreement can't be signed while one is in force, it can be declined, and no pay is ever under two agreements, so commission is never taken twice. | REP-11, REP-08 |
| A7 | A real agent's words carry no pronoun the pages don't give: the agent's name, and "the office". The game's own agent's sentences stay word for word. | (house rule) |
| A8 | Played: a life referred to a real New York agent, met, offered, signed, and put up for a role through the office's breakdowns; saved and loaded on the way. | REP-06, REP-05, CONT-01 |

## Module 4: Contracts, Pay, Residuals, And A Series' Seasons (2026-10-24)

Part 7, with Part 13's renewal, cancellation and revival. Written before the code. The rules come from the agreements
themselves, as AMPTP publishes them (N12, the 2026 memorandum; N13, the 2014 Codified Basic Agreement; N14, the 2014
Television Agreement; N15 to N17, the 2017, 2020 and 2023 memoranda), SAG-AFTRA's own pages refusing this build
(S21, S41, S95, S96: HTTP 403). What the game imagines (a rerun, a season's renewal, a call for another episode) is its
own, said as one.

| # | Check | Rows |
|---|---|---|
| D1 | Every engagement carries its contract from acceptance: the role's classification, the production's format, the governing agreement, the effective date, the service dates, the place, the basis (a day, a week, an episode or deferred) and the estimated pay, said as an estimate before withholding, commission and dues and not as cash. It holds only the clauses that apply: overtime and residuals for SAG-AFTRA television work, a per diem and the trip for overnight work away, an episode guarantee, expected appearances and an option for a recurring part. | CON-02, CON-03, CON-01 |
| D2 | Each payment says where it stands, from the record: estimated before its days, earned once they're worked, due on its payday, settled (or held in trust) when paid, deferred, or not owed where the work was called off first; a late one is overdue, and asked about, disputed, until it's paid. | CON-05 |
| D3 | A SAG-AFTRA television day performer's eleven-hour shoot day, an hour of it lunch, is ten hours of work time, so it pays two hours at time and one-half of the day rate's hour (N13, Schedule A §9, its own example). | CON-02 |
| D4 | The producer's pension and health contribution on SAG-AFTRA pay, 19.5% of it (N16), and 20.5% from the 2026 memorandum's date for the Health Plan's added 1% (N12), is shown as the producer's and never taken from the pay: net is gross less withholding, commission and dues, and nothing else. | CON-06, CON-05 |
| D5 | Residuals as four records: the entitlement, made when SAG-AFTRA television work is done; each exploitation (the first telecast, which the salary pays for, N14 §18(a), and a network prime-time rerun, which the game decides); the calculation (100% of total actual compensation, up to the ceiling, $3,668 for an hour and $2,578 for a half-hour, N14 §18(b)(1), frozen by N15 to N17 and kept by N12); and the settlement, due within thirty days of the rerun (N14 §18(b)(5)), paid once by its key whatever is replayed or reloaded. A telecast alone pays nothing. | CON-09, CON-10, CON-08, T42, T96, T43 |
| D6 | A per diem for meals on overnight locations, $60 a day (N13 §35.B(2), its allowances frozen since), is paid apart from wages, and isn't wages. | T45, CON-05 |
| D7 | A recurring part in a fictional series: guaranteed two of a season's thirteen episodes and expected in up to five, paid by the episode for the episodes it's called for, never for every episode ordered; an option on the next season at 5% more an episode, exercised or left to expire once, by June 30 (the game's own terms, said as such). | CON-04, T86, T89, T90 |
| D8 | Each season is renewed or cancelled on May 15 by a draw keyed by the series and the year, so a reload decides it the same. Renewed without the option exercised, no engagement comes. Cancelled, its earned pay and history stay, an open role in it closes without pay, and a role booked for work not yet done is called off, not owed. A cancelled series can come back years later, posting new roles, its history unchanged. | T58, T62, T85, T59, T91, T93, T10, T100 |
| D9 | Played: a represented life cast in the recurring part, its guaranteed episodes worked with their overtime, a further episode called or not, the season ended and decided, the option exercised into the next season's contract or let expire, and a rerun's residual paid once; saved and loaded at each stage. | CON-01, CONT-01 |

Two readings moved with the code, said here rather than rewritten above: the network's first word is in May 2030, the
seasons through the one beginning in 2029 being ordered (the game's story, so a life played to 2029 meets the series as
brief 19 left it); and each season shoots from mid-July to May, its thirteen episodes over by April, so the word in May
never cuts a guaranteed episode short and the guarantee is never paid for work not done. Work in the series booked for
days after a cancellation, a co-star's, is what's called off. A recurring part's further episodes and an option taken up
also read SAG-AFTRA's thirty days: a non-member past them isn't called, and the option lapses, each with why.


## Module 5: Distinct Production Workflows (2026-10-24)

Part 8. Written before the code, and read again against it once built. A workflow is how a kind of work is done: its
days and what each asks, how a judged day is played and in what units, its own preparation, the choices a player makes
in it, the report each day leaves, and what the work leaves behind. A format is a kind of production, naming its
workflow and the terms that set it apart. Where an agreement the build read gives a rule, the rule is the agreement's:
N13 (the 2014 Codified Basic Agreement: Schedule A §21.E, a half-hour multicamera series' rehearsal; §21's fourth
exception, an animated feature's voice-over; §28.A, retakes and a recall to loop; §37, dialogue replacement and
vocally stressful work; the General Provisions' §28.B, a stunt's coordinator and consent; §43, nudity and simulated sex)
and N17 (the 2023 memorandum's performance capture). Everything else is the game's, said as one.

| # | Check | Rows |
|---|---|---|
| W1 | Each workflow and each format is data (`content/workflows.ts`), and every project names its format. A test fails two workflows that share all of a day's judging, the preparation, the choices and what the work leaves, and two formats that share all of their terms: a different label over the same activity. | WF-21, WF-01 to WF-20 |
| W2 | Single camera, the screen's own: a judged day plays the part's scenes out of the script's order (by location; a procedural's within its episode; a serialized show's and a limited series' cross-boarded across episodes), each in the format's takes, the best printed. A scene shot before the scenes that lead into it asks more of the breakdown. Ask For Another Take adds a take to a scene whose best isn't yet strong, as many a day as the format allows (an independent feature one, a studio's three, a short none), each costing energy. Pages revised the night before, at the format's chance, change a share of the lines learned, and the script's version goes up. Each day leaves its report: the scenes in the order shot, their takes and the printed one's band. | WF-01 to WF-09, WF-19, WF-20, WF-23 to WF-25 |
| W3 | Multicamera comedy: an episode's week of a table read, three days of rehearsal and camera blocking and a tape night before a studio audience, every day paid from the first rehearsal (N13 Schedule A §21.E). The tape night plays the scenes in the story's order with nerves, as a stage night does, and a scene that plays badly is picked up after the audience leaves, without its laughs. Play To The House and Play To The Cameras each put one side of it first. | WF-10 |
| W4 | Voice in the booth (an animated series, an animated feature): sessions with the script on a stand, so no lines to learn by heart; its own preparation, Find The Voice. The voice's strain is a state of its own, raised by voice work, eased by rest, and read only by work whose instrument is the voice. A session's screamed lines are announced before it or sprung on it, and the sprung ones may be refused (N13 Schedule A §37.C, the dub's rule, which the game applies to animation). An animated feature's sessions, months apart, are each paid as a day and the days between aren't (N13 Schedule A §21's fourth exception). It leaves no footage for a reel. | WF-11, WF-12, WF-26 |
| W5 | Dubbing: another actor's lines replaced in English, loop by loop, judged above all on timing; Match The Original or Make It Your Own trades the timing for the believability; Watch The Original is its preparation. A day's pay covers a single character's lines, any number of them, or up to five synchronized lines each for up to three characters, and a day more for each part of more than five and each further set of up to three (N13 Schedule A §37.A and E). | WF-13 |
| W6 | Performance capture: a capture stage, a suit and no set; the body and the imagination judged; Work On The Movement its preparation; Watch The Playback trades a take for a fuller sense of the character. No consecutive employment, so each day called in is paid and the days between aren't, and several characters a day at no more pay (N17). | WF-14 |
| W7 | Documentary narration: a long read in chapters, judged on the voice, its pace and its holding over hours, Check The Pronunciations its preparation, a chapter that slips picked up at the end, and Rest Your Voice Each Hour trading the voice's strain for energy. A reenactment: a part on camera with no lines, Study The Period's Movement its preparation, and the historian's notes followed closely or freely. | WF-15, WF-16 |
| W8 | A musical: music rehearsals and choreography before the staging, each building a preparation of its own (the songs, the choreography); Mark It spares the voice and the body and learns more slowly; each night reads the voice's strain and the choreography. | WF-17, WF-26 |
| W9 | Action: fight rehearsal with the stunt coordinator on the rehearsal days, the only way it's built; on a stunt day, Use The Double (where the player hasn't consented) carries no risk and prints the shot at less than the player's own, and Do It Yourself, the player's consent with a qualified coordinator there (N13 §28.B(1) and (4)), carries a chance of an injury set by the rehearsal and the body, with workers' compensation where it happens. | WF-18, WF-27 |
| W10 | Agreed boundaries: a part with an intimate scene says what it is before the audition (N13 §43.A); it's shot on a closed set with an intimacy coordinator, only with the player's written consent; consent can be withdrawn until it's shot, and not after; without it a body double does the scene, which isn't judged as the player's. Declining never changes casting's chance, the part, the pay or an agent's view. | WF-27 |
| W11 | After a screen wrap, a recall to loop at the format's chance, within four months (six for features and long-form television, a limited series among it), on a weekday clear of the player's booked work: four hours at half the day's pay (N13 Schedule A §28.A), permission to work read, and missed, unpaid. At the release, a scene of the player's may be cut: the credit, the pay and the history stay, and the credit's band is the best of the days on the scenes kept. | T47, T46 |
| W12 | The formats apart: a limited series has no next season, so no option; an anthology invites back an actor whose work was strong, into its next story, without an audition; voice-over work is outside an agent's agreement, so it's posted for the actor's own submission and owes no commission. | WF-06, WF-07, WF-21 |
| W13 | Played: a voice session, a multicamera week and an action shoot through the commands and the clock, each day's report kept, saved and loaded at each stage. | WF-21, WF-24, CONT-01 |

## Module 6: Charts, Festivals And Awards (2026-10-24)

Parts 10 to 12. Written before the code, and read again against it once built.

The reference charts are the three providers this build could read on 2026-10-24 (Box Office Mojo's domestic weekly
chart, Netflix's global Top 10 file, Nielsen's streaming Top 10 page), imported once as dated snapshots, never fetched by
the game. The awards and festivals are the brief's inventory, each with what this build read; a competition decides
eligibility only from rules read for its edition (the 78th Emmy Awards' Rules And Procedures, version 4 of 2026-04-07;
the 2027 Sundance Film Festival's submissions page and its dates announcement; the 2026 International Emmy Awards' rules),
and an edition not yet published is that one's rules carried forward and said so. Everything else is the game's.

| # | Check | Rows |
|---|---|---|
| X1 | Reference charts are dated imports: each snapshot names its source, the measured interval, the publication date or the first time it was seen, the import date, territory, metric, unit, each rank with its value or an explicit unknown, its status (actual, estimate, reported) and revision, and a stable title id. Box Office Mojo's domestic weeks 41 and 42 of 2026, Netflix's four global lists for the weeks ending October 11 and 18, 2026, and Nielsen's U.S. streaming overall Top 10 for October 5 to 11, 2026. No provider is fetched by the game or paid for. | CHART-01, CHART-03, CHART-04, CHART-05, CHART-07 |
| X2 | Units, territories and periods are never combined: a title in two charts shows each figure in its own unit, territory and week, and no total adds across them. Netflix's views and hours stay apart from Nielsen's minutes. | CHART-02, T50, T70, T69 |
| X3 | Movement only between comparable charts (the same chart, consecutive periods): up, down, the same, or new to the game's record of that chart, which isn't a new release; a title absent from a published Top 10 is Outside The Published Top 10, never eleventh; a value not published is Not Reported, never zero. An old series in a streaming chart isn't called new. Nothing is inferred of retention or completion. | CHART-08, CHART-09, CHART-10, T75 |
| X4 | Imports: the same snapshot twice is one; a changed figure for the same chart and period is a new revision with the prior kept; a malformed one (a unit that isn't the chart's, a rank missing or repeated, a period that isn't the chart's) is refused and the last valid snapshot stays; a chart not updated says how old it is. Box Office Mojo's week 42 has two revisions: the dossier's observation of 2026-10-23 and this build's of 2026-10-24. | CHART-08, T71, T72, T97 |
| X5 | A released film of the player's enters a weekly chart of the game's own world, labeled the game's simulation, apart from the reference charts: its gross drawn by the film (a decider) from its kind's budget, falling week by week, and ranked among the game's own unnamed releases. Unreleased work isn't charted and earns nothing at the box office. A gross is never the actor's pay, and a chart week is never a payday; excellent work in a film that does badly is still excellent work. | CHART-06, CHART-11, CON-10, T73, T74, T98 |
| X6 | The inventory: the brief's fourteen awards and eight festivals, each with its sources and coverage: rules read and enforced, located and read in part, located and refused, or not reached. Only an edition whose rules were read decides eligibility; for the rest the game says it doesn't decide. The Emmy organizations are separate competitions; a festival's sections are separate rulebooks. | AWD-02, AWD-03, AWD-04, AWD-05 |
| X7 | Emmy eligibility by the 78th's rules: a program's premiere in the eligibility year, June 1 to May 31; a guest category for a performer in under half the series' eligible episodes with at least 5% of the submitted episode's running time, and never again for a role once nominated in a supporting category for it; a supporting category in a limited or anthology series or a movie at 5% of the movie, the whole limited series or the anthology's part; a supporting part in a series with no minimum; categories follow the program's placement, comedy or drama; voice-over only in Character Voice-Over, and only for programming aimed at 13 and over (children's animation goes to the Children's And Family Emmys, not covered); documentary performers aren't eligible; one category for the same character. A part's share of the running time is the game's assumption by its size. Later editions are the 78th's rules projected, said so. | AWD-04, AWD-06, AWD-11, AWD-12, T81, T94 |
| X8 | Entry: the player may enter themselves for an individual award (rule 4), by the entry deadline, paying the $125 processing charge and the $100 entry fee from their bank; the production may enter them instead (the game's draw, said so). An entry after the deadline, a second entry for the same achievement, or a performance outside its eligibility year is refused, with why. | AWD-06, AWD-09, AWD-12, T81 |
| X9 | Nominations: each category's field of submissions is anonymous (stable ids, simulated strength and exposure, kept with the competition); the number of nominations follows the 78th's table by submissions and its tie rules; the vote is simulated, never a claim about real ballots; the player's chance reads how the work was judged and their visibility. The final round is a peer vote for one. Other nominees and winners are never named. | ANON-01, ANON-02, ANON-03, T76 |
| X10 | The player's states: Ineligible, Eligible, Not Entered, Entered, Not Nominated, Nominated, Did Not Win, Won, Disqualified. Not nominated leaves no ceremony record; a loss keeps the nomination and says only that the player didn't win; an entry found ineligible later (an episode whose scenes of the player were all cut) is disqualified. | ANON-04, ANON-05, T77, T78, T92 |
| X11 | A win is kept for good: the award, category, edition, work, performance and recipient status, on the Portfolio; no money; a program's award is never the performer's. | ANON-06, ANON-07, ANON-08 |
| X12 | The ceremony: the result is settled when the final round ends and never drawn again; the ceremony is on the calendar on the published date (the Creative Arts Awards for guest categories), projected for later editions; Watch The Ceremony reveals the same result, and the recap says it in a line; skipping it changes nothing, and neither does a reload. | ANON-09, ANON-10, T79, T80 |
| X13 | Visibility: a nomination, a win or a festival selection raises how casting sees the player, modestly and for a while (the game's), and never rewrites a contract, pays money or guarantees another award; casting's own schedule and eligibility still apply; an old performance isn't judged again as the player grows. | ANON-11, T82, T83 |
| X14 | Festivals, by Sundance 2027's rules: U.S. short films under 50 minutes completed after 2025, U.S. narrative and documentary features of 50 minutes or more with their world premiere status, by origin and financing; the production submits, never the player; its deadlines; selection from an anonymous field, acceptance and exhibition at the festival (January 21 to 31, 2027, Boulder) tracked apart; a feature released before February 1, 2027 isn't eligible, and the reason is said before the release; later editions projected. | AWD-01, AWD-07, AWD-08, AWD-09, AWD-10, T51, T52 |
| X15 | Time moves the cycles: a release delayed moves its award year (the edition whose year its premiere falls in); a revived series' new season has its own cycle, the old history unchanged. | T48, T93, T94 |
| X16 | Played: a guest part's episode airs, the player enters it, is nominated, watches or skips the ceremony, and the result is the same; a short's festival selection; the charts read on the screen; each stage saved and loaded. | CONT-01 |

Read again against the code once built (2026-10-24), and against the 78th's text a second time: the first build held
every part to 5% of an episode, where the rules hold a guest to 5% of the episode entered, a supporting performer in a
movie or a limited or anthology series to 5% of the movie, the whole limited series or the part, and a series' supporting
performer to none; it let a guest part stay a guest after a supporting nomination for the same role, which the 78th's
Guest Performer Eligibility doesn't; and it said a dub was ineligible as "part of the program it dubs", where the rule is
that a foreign acquisition's new soundtrack doesn't make it eligible (Eligibility, 6 and 7). Each was changed to the rule.
X5 said a film's gross read how the player's part was judged; the code doesn't, by decision: a film's fortunes are the
production's, and excellent work in a film that does badly is still excellent work (CON-10). The actor's and actress's
categories of a kind share the game's field size, so the 78th's parity between their nominations holds.
Read a third time on 2026-10-24, after the gate: the entry deadline ended at midnight in New York, where the rules say
"until May 7" and give their voting deadline in Pacific time; it ends at midnight in Los Angeles now, three hours later.
