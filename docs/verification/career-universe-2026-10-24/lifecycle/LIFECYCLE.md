# The Lifecycle Matrix (Brief 27, Loop 55)

Written by `lifecycle.mjs` from `lifecycle.json` and the feature-to-effect matrix (`../../audit-2026-10-21/effects/`): each
of the supplement's 56 loops, the features that carry it, and, joined from those features' own rows, where the player
meets it, what it changes at once, what reads it later, how it saves and loads, and its tests. What the player decides,
the states, what comes on the clock and the ways out are the loop's own row. A status is one of the owner's seven.

**The loops:** Implemented And Verified 51, Implemented, Verification Incomplete 4, Partially Implemented 0, Not Implemented 1, Blocked Externally 0, Decision Required 0, Explicitly Deferred 0.

## 1. Creation And Starting History

**Status:** Implemented And Verified

- **Code (features):** `create.citizenshipId`, `create.homeRegionId`, `create.priorResidence`, `create.birthYear`, `create.background`, `create.genres`, `create.school`, `create.wealth`, `create.bankId`, `create.homeBankId`
- **Entry:** Identity: Citizenship, a list of every country that isn’t another’s territory, with Same As Your Place Of Birth (CharacterCreation.tsx:571) / Identity: Place Of Birth (LocationPicker born, CharacterCreation.tsx:556), with Same As Your Place Of Birth offered under Citizenship / Starting Point: Before Yale, the place and the month and year (BeforeYale, CharacterCreation.tsx:1101) / Identity: Year Of Birth (CharacterCreation.tsx:510) / Genres & Background: Background (CharacterCreation.tsx:858) / Genres & Background: the 149 genres, Select All and Clear These (Chips, CharacterCreation.tsx:839); a genre no play is of is marked · / Not a control: atSchool sets it for every life creation begins (bootstrap.ts:171-180), and Starting Point’s Where It Begins says so / Genres & Background: Your Family (FamilyChoice, CharacterCreation.tsx:896), with the money it starts with said under it; Starting Point’s What You Are Starting With (CharacterCreation.tsx:1035) only outside the School / Starting Point: Your Bank (BankChoice, CharacterCreation.tsx:1235) / Starting Point: Before Yale, Keep An Account There and its bank (CharacterCreation.tsx:1174)
- **Decisions:** Who the actor is: name, birth, a citizenship asked apart from the birthplace, a home region and a previous residence, background, genres, wealth and banks.
- **States and transitions:** A new save: the history set once at creation, then read by the systems it feeds.
- **Immediate effects:** Person.citizenshipId (bootstrap.ts:328), kept by every opening (index.ts:961, which until 2026-10-24 put it back to the birthplace’s). / Person.homeRegionId (bootstrap.ts); the citizenship only for a life a test or a tool makes without one (citizenshipOf). Until 2026-10-24 (brief 27) it decided citizenshipId for every life. / Person.priorResidence from the first of the month given to this morning (bootstrap.ts:393-399) / Person.birthInstant (bootstrap.ts:367-370, 385) / Person.background, as written (bootstrap.ts:413) / Person.genres (bootstrap.ts:409) / Enrollment at the School where the life begins in its town (index.ts:270): the school record, the craft, the classmates and the calendar / populateWorld: the profile in the save’s currency (index.ts:197), checking and savings at the bank, the bank’s card at its limit carrying what it brings in, and the credit score (index.ts:207-259) / The accounts opened at the bank chosen, or the country’s first (startingBank, index.ts:202), and its own card (index.ts:228) / The home bank’s current account and, where kept, its savings, opened with the rest (index.ts:205, 254)
- **Downstream consumers:** the starting papers: a non-American’s passport and F-1 visa, an American’s passport at its share (src/engine/systems/documents.ts:548); America’s permission to work (src/engine/systems/permission.ts:115); the bank opened: one kept for US persons only to a US citizen (src/engine/index.ts:204); a bank kept abroad that refuses US persons (src/engine/systems/homeaccount.ts:93); the citizenship it suggests (Same As Your Place Of Birth), and a test’s or a tool’s life’s citizenship (src/engine/domain/citizenship.ts:63); a US-born citizen’s license from the birth state, where Before Yale names no place (src/engine/systems/documents.ts:567); the body drawn where none is given, from the birth country’s adults (src/engine/systems/body.ts:83); whether a bank there is offered (homeAccountRefusal) (src/engine/systems/homeaccount.ts:66); the account’s number by where they lived (src/engine/systems/homeaccount.ts:235); the holidays a bank kept there keeps (src/engine/content/bankdays.ts:28); the places and holidays loaded (src/engine/index.ts:1349); a US citizen’s starting license from the state lived in before (src/engine/systems/documents.ts:567); the birth instant (src/engine/world/bootstrap.ts:368); the birthday on the calendar, at nine on the day (src/engine/systems/birthdays.ts:30); the year’s chance of the end, by age (src/engine/systems/mortality.ts:108); the first morning’s fitness, no more than the age allows (src/engine/world/bootstrap.ts:417); the person look’s Where You Come From (src/ui/looks/wellbeing.tsx:194); the Profile’s In Your Own Words (src/ui/workspaces/ProfileWorkspace.tsx:199); what of a day’s work is loved (src/engine/systems/enjoyment.ts:61); a rehearsal or a night of the play, its mood and stress (src/engine/systems/enjoyment.ts:81); a Summer Cabaret rehearsal (src/engine/systems/school.ts:4234); the genre look’s A Genre You Love (src/ui/looks/actor.tsx:173); enrollment, only at the school’s town (src/engine/index.ts:270); the starting money (src/engine/index.ts:197); the card’s limit (src/engine/index.ts:236); the credit score (src/engine/index.ts:259); with the family, Yale’s need (src/engine/systems/school.ts:1512); the bank the accounts open at (src/engine/index.ts:202); the home bank, where the rule offers it (src/engine/systems/homeaccount.ts:100); its accounts opened (src/engine/index.ts:254)
- **Timed events:** None until the clock starts, paused.
- **Exit and recovery:** Back between the steps; nothing is written until the life begins.
- **Save and load:** Person.citizenshipId is kept as chosen; tests/citizenship.test.ts opens a save twice and the citizenship that disagrees with the birthplace is still the player’s, and tests/b27-creation-origins.test.ts reads it back after a load. / Kept in the save as creation wrote it and never moved after; a load reads it back as written. tests/b20-creation-twins.test.ts plays a life saved and opened at its first moment against one played straight, and the two saves are the same to the byte ten weeks on. / Person.priorResidence is kept; tests/home-account-creation.test.ts reads it back after a load and plays on. / Person.school is kept, and its record with it. / The accounts are kept with their bank; a load reads them back. / Kept with the accounts.
- **Tests and evidence:** `tests/b27-creation-origins.test.ts`, `tests/citizenship.test.ts`, `tests/creation.test.ts`, `tests/b20-creation-twins.test.ts`, `tests/documents.test.ts`, `tests/evidence-g27-ui.test.ts`, `tests/home-account-abroad.test.ts`, `tests/home-account-creation.test.ts`, `tests/home-account-tax.test.ts`, `tests/b20-creation-noleak.test.ts`, `tests/looks.test.ts`, `tests/evidence-g31-ui.test.ts`, `tests/evidence-g28-ui.test.ts`, `tests/traits-connected.test.ts`, `tests/b20-creation-looks.test.ts`, `tests/school.test.ts`, `tests/need-paths.test.ts`, `tests/evidence2-b10.test.ts`, `tests/evidence-g29-ui.test.ts`, `tests/banking.test.ts`

## 2. Outstanding Foundation Requirements

**Status:** Implemented, Verification Incomplete. Area C’s 121 rows: 85 measured again in F, 20 behind a product decision, 4 decisions for the owner, 12 commands no audit has read.

- **Code (features):** none of its own
- **Entry:** —
- **Decisions:** None of the player’s: the rows are proof, decisions and measurements.
- **States and transitions:** Each row classified by what it lacks (OUTSTANDING.md).
- **Immediate effects:** —
- **Downstream consumers:** none named
- **Timed events:** The final runs measure the 85 again on the finished commit.
- **Exit and recovery:** A row behind a decision waits on the owner.
- **Save and load:** —
- **Tests and evidence:** `docs/verification/career-universe-2026-10-24/foundation/OUTSTANDING.md`

## 3. Mobile Orientation And Navigation

**Status:** Implemented And Verified

- **Code (features):** none of its own
- **Entry:** Every screen, upright and turned (emulation, not a physical phone).
- **Decisions:** Holding the phone either way; every screen usable upright and turned.
- **States and transitions:** No gate: the rotate overlay is gone, the layout the same interface in portrait.
- **Immediate effects:** —
- **Downstream consumers:** none named
- **Timed events:** None.
- **Exit and recovery:** Turning back restores the scroll and focus.
- **Save and load:** —
- **Tests and evidence:** `tests/b23-turn.test.ts`, `docs/verification/career-universe-2026-10-24/walk`

## 4. Save, Resume, And Recovery

**Status:** Implemented And Verified

- **Code (features):** none of its own
- **Entry:** Save Selection; the save’s way to the server (a fake platform, said as such).
- **Decisions:** Save, load, restore a backup.
- **States and transitions:** A save at schema 94, migrated forward from older ones; a cleared slot’s backup listed.
- **Immediate effects:** —
- **Downstream consumers:** none named
- **Timed events:** The autosave and the clock’s pending items, kept in the save.
- **Exit and recovery:** Restore Backup; an older save brought forward.
- **Save and load:** —
- **Tests and evidence:** `tests/b27-backend.test.ts`, `tests/persistence.test.ts`, `tests/save-migration.test.ts`, `tests/migration-94.test.ts`, `tests/b26-persistence-repeats.test.ts`, `tests/b20-career-saveload.test.ts`

## 5. Career Readiness While Enrolled

**Status:** Implemented And Verified

- **Code (features):** `pro.set_name`, `pro.headshots`, `pro.update_resume`, `pro.cut_reel`, `pro.request_outside_work`, `pro.school_answer`, `school.choose_showcase`, `school.showcase`
- **Entry:** Career, Portfolio, Your Professional Name: Use This Name, grayed with nameRefusal's words. / Career, Portfolio: Book A Headshot Session, grayed with headshotRefusal's words. / Career, Portfolio: Make Your Résumé or Update Your Résumé, grayed with resumeRefusal's words. / Career, Portfolio: Cut A Reel, choosing up to four recorded pieces; grayed with reelRefusal's words. / Career, Opportunities: Ask The School under In Term At The School, grayed with requestRefusal's words. / The clock, a week after a request to the School (`SCHOOL_ANSWER_KIND`). / The Actor Showcase’s Choose These Scenes on the Coursework tab (SchoolShowcase.tsx:135); the command at proshowcase.ts:647. / The clock: SHOWCASE_KIND, the showcase’s rehearsal calls and its days in New York and Los Angeles (proshowcase.ts:580).
- **Decisions:** What to make for a portfolio, whether to ask the School to work in term, which pieces for the showcase.
- **States and transitions:** Materials made and versioned; a request pending, approved or refused; the showcase chosen and played.
- **Immediate effects:** The professional name set, or back to the display name. / $700 spent as a work cost, four hours on the clock, a headshot material dated now. / A résumé material with its lines and the record's keys, an hour on the clock. / $250 spent as a work cost, two hours on the clock, a reel material with its pieces and bands. / A request kept with its working and class days; the dean's answer on the clock a week on. / Approved or refused, with the conditions; approved, the booked work's class days excused. / setScenes: each scene a piece of DRAM 793b’s coursework, due at the first showcase day, the classmate least worked with as its partner. / A rehearsal call works the scenes; a day judges each scene, kept on the record; missed, a missed call and class of DRAM 793b; DRAM 793b settled after Los Angeles.
- **Downstream consumers:** the profile and a résumé made now carry it (src/engine/systems/pro.ts:765); a résumé made under another name reads as behind (src/engine/systems/pro.ts:786); every submission and approach needs headshots (src/engine/systems/pro.ts:882); headshots over two years old read as out of date, which his office can ask for (src/engine/systems/pro.ts:883); every submission and approach needs a résumé (src/engine/systems/pro.ts:885); a résumé behind the record is something his office can ask for (src/engine/systems/pro.ts:802); What's Missing and his office's check read the reel (src/engine/systems/pro.ts:891); his office's Your Work reads the reel's best band (src/engine/systems/proagent.ts:239); a better reel is something new after a decision (src/engine/systems/proagent.ts:469); a screen submission sends it (src/engine/systems/projobs.ts:963); the dean decides on the clock (src/engine/systems/projobs.ts:1490); approved work's class days are excused (src/engine/systems/projobs.ts:1501); the School excuses approved work's class days (src/engine/systems/projobs.ts:562); Each showcase day judges each chosen scene (src/engine/systems/proshowcase.ts:585); DRAM 793b settled after its last day (src/engine/systems/school.ts:3996)
- **Timed events:** The dean’s answer a week on; the showcase’s night and its follow-up.
- **Exit and recovery:** Work taken in term without approval brings an academic warning; a refused request leaves the part to decline.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts. / ShowcaseRecord.scenes. Kept on the save. / ShowcaseRecord, person.work. Kept on the save; opened between New York and Los Angeles, nothing judged twice.
- **Tests and evidence:** `tests/pro-showcase.test.ts`, `tests/pro-core.test.ts`, `tests/pro-app.test.ts`, `tests/pro-work.test.ts`, `tests/journey-agent.test.ts`, `tests/b20-career-effects.test.ts`, `tests/journey-career-older.test.ts`

## 6. Graduation And Career Transition

**Status:** Implemented And Verified

- **Code (features):** `school.evaluation`, `school.commencement`, `pro.equity_joined`, `pro.join_sag`
- **Entry:** The clock: EVALUATION_KIND at five on a term’s last class day (school.ts:3900), booked by the term. / The clock: COMMENCEMENT_KIND, the Monday before Memorial Day at ten (school.ts:3932), booked by the last review. / An event: said by the School at the degree (`setStanding`) and, from brief 20, by the work loop at an Equity contract's first day (`unionsFrom`). / Career, Work, Your Unions: Join SAG-AFTRA, grayed with joinSagRefusal's words.
- **Decisions:** Whether to join SAG-AFTRA once eligible.
- **States and transitions:** Graduated at Commencement; Equity by the degree; SAG-AFTRA eligible, then a member.
- **Immediate effects:** Each course settled (pass, Incomplete with its month, fail); the faculty’s review where Failures reach the count; the review (TermReview) and the standing stepped; castable restored in good standing; a last term’s Commencement or conferral booked, or the thirty days offered (offerRepeat), or the degree withheld. / A course failed: withheld. A hold: the diploma held, awaiting payment. An Incomplete: no part in Commencement, the degree waiting. Otherwise graduated (setStanding). / Equity's bills: the initiation fee in three parts, the first taken at once, the half-years' dues on the clock; each counted in the year's dues when settled (from brief 20). / The fee paid as dues and counted in the year's dues (from brief 20, `countDues`); a member from now; the next half-year's base dues billed.
- **Downstream consumers:** The standing set and said (src/engine/systems/school.ts:2007); On warning, no Cabaret (src/engine/systems/school.ts:1619); Only good standing joins the Summer Cabaret (src/engine/systems/school.ts:1640); A last year’s Fails offered thirty days (src/engine/systems/school.ts:3344); A degree waiting is conferred once nothing stands in its way (src/engine/systems/school.ts:3374); The degree gives Equity membership in the career (src/engine/systems/pro.ts:483); the bills, each settled on its day (src/engine/systems/propay.ts:737); the dues counted in the year the return reads (src/engine/systems/taxreturn.ts:960); SAG-AFTRA work from the 30th day needs membership (src/engine/systems/propay.ts:704); working dues taken from SAG-AFTRA pay (src/engine/systems/propay.ts:383); the résumé lists SAG-AFTRA (src/engine/systems/pro.ts:790); the fee counted in the year's dues the return reads (src/engine/systems/taxreturn.ts:960)
- **Timed events:** The last evaluation, Commencement, the union dues each May and November.
- **Exit and recovery:** Leaving without the degree takes the other way; dues owed are kept as owed.
- **Save and load:** SchoolRecord.history, standing, courses, reviews. a load keeps it: the attentive student's first year to 25 January 2027, saved and opened six times, ends the same to the byte as played straight through (tests/b20-school-firsts.test.ts); the degree comparison opens a save made after the last review. / Standing, awaitingDegree, endedAt. Kept on the save; the degree comparison’s ill paths open a save made at the last review. / The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts. Each bill is keyed (`addBill`), so it's charged once. / The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/pro-work.test.ts`, `tests/journey-career.test.ts`, `tests/b20-school-attendance.test.ts`, `tests/b20-school-degree.test.ts`, `tests/b20-school-firsts.test.ts`, `tests/evidence-g21-school.test.ts`, `tests/school.test.ts`, `tests/school-fixes.test.ts`, `tests/term-growth.test.ts`, `tests/propay.test.ts`, `tests/b20-career-defects.test.ts`, `tests/journey-career-older.test.ts`

## 7. Professional Materials

**Status:** Implemented And Verified

- **Code (features):** `pro.headshots`, `pro.update_resume`, `pro.cut_reel`, `pro.mix_demo`, `pro.set_name`
- **Entry:** Career, Portfolio: Book A Headshot Session, grayed with headshotRefusal's words. / Career, Portfolio: Make Your Résumé or Update Your Résumé, grayed with resumeRefusal's words. / Career, Portfolio: Cut A Reel, choosing up to four recorded pieces; grayed with reelRefusal's words. / Career, Portfolio: Mix A Voice Demo, choosing up to four voice recordings; grayed with demoRefusal's words. / Career, Portfolio, Your Professional Name: Use This Name, grayed with nameRefusal's words.
- **Decisions:** What to make, from which recordings, and when to bring the résumé up to date.
- **States and transitions:** Each material a numbered version with where it came from; a résumé behind the record says so.
- **Immediate effects:** $700 spent as a work cost, four hours on the clock, a headshot material dated now. / A résumé material with its lines and the record's keys, an hour on the clock. / $250 spent as a work cost, two hours on the clock, a reel material with its pieces and bands. / $300 spent as a work cost, two hours on the clock, a demo material numbered among its kind with its recordings and bands. / The professional name set, or back to the display name.
- **Downstream consumers:** every submission and approach needs headshots (src/engine/systems/pro.ts:882); headshots over two years old read as out of date, which his office can ask for (src/engine/systems/pro.ts:883); every submission and approach needs a résumé (src/engine/systems/pro.ts:885); a résumé behind the record is something his office can ask for (src/engine/systems/pro.ts:802); What's Missing and his office's check read the reel (src/engine/systems/pro.ts:891); his office's Your Work reads the reel's best band (src/engine/systems/proagent.ts:239); a better reel is something new after a decision (src/engine/systems/proagent.ts:469); a screen submission sends it (src/engine/systems/projobs.ts:963); a voice part's submission sends it, where screen work sends the reel (src/engine/systems/projobs.ts:1291); a voice part whose casting asks for a demo refuses a submission without one (src/engine/systems/projobs.ts:963); the voice purpose of the materials check says when newer recordings came after it (src/engine/systems/pro.ts:1164); the same recordings again are refused (src/engine/systems/pro.ts:1248); the profile and a résumé made now carry it (src/engine/systems/pro.ts:765); a résumé made under another name reads as behind (src/engine/systems/pro.ts:786)
- **Timed events:** A headshot session in daylight hours; none other.
- **Exit and recovery:** An older version kept; a submission names the versions it sent.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/b27-voice-demo.test.ts`, `tests/pro-core.test.ts`, `tests/pro-work.test.ts`, `tests/journey-agent.test.ts`, `tests/b20-career-effects.test.ts`, `tests/career-workflows.test.ts`, `tests/pro-app.test.ts`

## 8. Approaching An Individual Agent

**Status:** Implemented And Verified

- **Code (features):** `pro.agent_notice`, `pro.agent_check`, `pro.ask_referral`, `pro.send_materials`, `pro.supply_material`, `pro.ask_to_move`, `pro.agent_reply`, `pro.agent_request_due`, `pro.agent_meeting`, `pro.agent_silence`, `pro.agent_decision`, `pro.agent_follow_up`
- **Entry:** Career, Representation: the notice that he and his agency are invented, at the top of his panel, and I've Read This. / Career, Representation, How To Reach Him: Check Your Materials, grayed with checkRefusal's words. / Career, Representation, How To Reach Him: Ask For A Referral beside each finished job, grayed with its reason. / Career, Representation: Send Your Materials, grayed with sendRefusal's words. / Career, Representation: Send What His Office Asked For, grayed with supplyRefusal's words. / The stop at his meeting: Ask To Move (`defineStop`), and the Representation tab's Ask To Move. / The clock: the agent's office answers an approach on its own day at its answer hour (`AGENT_TIMES.replyDays`, or `afterSupplyDays` after what it asked for, or when it had asked to meet), 'An Answer' on no screen until it comes. / The clock, the request's last day (`REQUEST_DUE_KIND`). / The clock at the meeting, a stop with Go, Stand Here and Ask To Move (`MEETING_KIND`). / The clock, six weeks after a send left unanswered (`SILENCE_KIND`). / The clock, five weekdays after a meeting kept (`DECISION_KIND`). / The clock, three days after the showcase's last performance (`FOLLOW_UP_KIND`), put on by the showcase.
- **Decisions:** Which agent, by which way in, what to send, and when to move a meeting.
- **States and transitions:** From the notice read to materials sent, waiting, asked for more, a meeting, deciding, and an offer, a pass or no answer.
- **Immediate effects:** The relation begun at discovered, the notice's reading dated, a discovered event in his history. / A checked event in his history keyed to the approach, saying what the check found; the stage from discovered to checked. / A referral kept on the relation (once a job), the route set to that referrer, the stage introduced, a referred event; a notice from the referrer, never from him. / An approach sent and counted, its case keys kept, the hold cleared, the stage sent; his office's answer on the clock, a week on where the School passed on a request, two weeks otherwise. / The request's due item called off, supplied in his history, the stage sent, the answer on the clock a week on. / The meeting a week later, its item rescheduled, moved counted, a meeting-moved event. / One of: a request for more by a date (`rel.request`, the stage 'requested', a `pro.agent_request_due` on the calendar); a meeting set (`rel.meeting`, the stage 'meeting', `pro.agent_meeting` on the calendar with its trip); a pass (the approach closed, a year's cooldown); or waiting (the stage 'waiting', `pro.agent_silence` at the silence's date). The reasons kept (`keepWhy`) for Why It Went This Way. / A request-missed event, then his office decides on what it has (`answer`). / Kept: deciding, the decision on the clock. Missed: the approach closed and held a year. / The approach closed as unanswered and held six months. / An agreement offered for fourteen days (`offerAgreement`), or a pass held a year; the reasons kept for Why It Went This Way. / The follow-up recorded; for each agent the relation introduced through the School, the notice read, and a request to meet passed on or not.
- **Downstream consumers:** every other control of his panel waits on the notice (src/engine/systems/proagent.ts:539); the School's follow-up adds the notice's words only when it's unread (src/engine/systems/proagent.ts:948); a send needs a passed check (src/engine/systems/proagent.ts:602); a referral needs a passed check (src/engine/systems/proagent.ts:570); a send is taken only through a route (src/engine/systems/proagent.ts:598); the referring job's work is among what his office has to go on (src/engine/systems/proagent.ts:240); a referral is something new after a decision (src/engine/systems/proagent.ts:470); his office answers on the clock (src/engine/systems/proagent.ts:1155); the approach's case kept for the next decision (src/engine/systems/proagent.ts:477); his office answers after the request (src/engine/systems/proagent.ts:1161); material sent when asked counts for reliability (src/engine/systems/proagent.ts:376); the meeting kept or missed at its new time (src/engine/systems/proagent.ts:1185); a second move refused (src/engine/systems/proagent.ts:637); the answer read by the handler, which hands the approach to `answer` (src/engine/systems/proagent.ts:1155); the interest the answer reads (src/engine/systems/proagent.ts:829); a request's due date falls on the clock and is settled on what was sent (src/engine/systems/proagent.ts:1164); a meeting set comes to the clock, kept or missed (src/engine/systems/proagent.ts:1185); silence, the approach closed as no answer (src/engine/systems/proagent.ts:1175); material not sent counts against reliability (src/engine/systems/proagent.ts:377); the decision on the clock (src/engine/systems/proagent.ts:1214); a meeting kept or missed counts for reliability (src/engine/systems/proagent.ts:374); a send refused while the hold runs (src/engine/systems/proagent.ts:514); the offered agreement read by Accept and Decline (src/engine/systems/proagent.ts:642); a pass held a year (src/engine/systems/proagent.ts:514); a send answering the request is answered in a week with a meeting (src/engine/systems/proagent.ts:583); the showcase is work his office has to go on (src/engine/systems/proagent.ts:237)
- **Timed events:** The office’s answer, a request’s due date, the meeting, the silence after six weeks, a cooldown.
- **Exit and recovery:** After a pass or no answer, a cooldown and only something new reopens it.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts. / The item on the calendar with its approach and step; `tests/b20-career-saveload.test.ts` plays an approach's six steps saved and opened before each, ending the same to the byte as played straight.
- **Tests and evidence:** `tests/journey-agent.test.ts`, `tests/pro-agent.test.ts`, `tests/pro-representation-screen.test.ts`, `tests/b20-career-effects.test.ts`, `tests/journey-career-older.test.ts`, `tests/b20-career-saveload.test.ts`, `tests/b20-career-skill.test.ts`, `tests/journey-career.test.ts`, `tests/b20-career-history.test.ts`, `tests/pro-work.test.ts`

## 9. Active Representation And Ending Representation

**Status:** Implemented And Verified

- **Code (features):** `pro.accept_agreement`, `pro.decline_agreement`, `pro.end_agreement`, `pro.agent_offer_lapse`, `pro.agent_term_end`, `pro.agent_ask_lapse`
- **Entry:** Career, Representation, The Agreement: Accept The Agreement, grayed with answerRefusal's words; behind the guide's chapter "Representation". / Career, Representation, The Agreement: Decline The Agreement, grayed with answerRefusal's words. / Career, Representation, The Agreement: End It By Agreement, End It: No Offer In 90 Days, End It: Too Little Work, each grayed with endRefusal's words. / The clock, the agreement's last day (`OFFER_LAPSE_KIND`). / The clock, the agreement's year's end (`TERM_END_KIND`). / The clock, the last day of the request to meet the School passed on after the showcase (`ASK_LAPSE_KIND`), scheduled by `followUp` when the agent asks.
- **Decisions:** Accept or decline the agreement; end it by agreement or by its unions’ rules.
- **States and transitions:** Offered, accepted, declined, lapsed, ended by term, agreement, no offer or too little work.
- **Immediate effects:** The agreement accepted, signed now and ending a year on; the offer's lapse called off; the relation represented with the agreement's id; accepted and represented in his history; the term's end on the clock (`pro.agent_term_end`). / The agreement declined, its lapse called off, the approach closed with six months' hold and something new needed (`closeApproach`), a declined event. / The agreement ended with how; the term's item called off; the relation ended, its considered keys kept, no hold; what it leaves owed said. / The agreement lapsed, the approach closed and held six months. / The agreement ended at its term, the relation ended, what it leaves owed said. / An ask-lapsed line on the relation's history, once (`note`'s key), and a notice saying the request lapsed and that materials sent later are an ordinary approach.
- **Downstream consumers:** the agreement in force on a date, the one rule the rest read (src/engine/systems/pro.ts:527); the week's postings: parts released to agents reach the actor through him (src/engine/systems/projobs.ts:466); an offer he handles is priced at scale plus ten on SAG-AFTRA work (src/engine/systems/projobs.ts:1130); the pay's commission and the trust account read the agreement owed on a contract (src/engine/systems/propay.ts:262); no approach while represented (src/engine/systems/proagent.ts:504); a send refused while the hold runs (src/engine/systems/proagent.ts:514); a new approach needs something new (src/engine/systems/proagent.ts:526); an agreement offered again says this one was declined (from brief 20) (src/engine/systems/proagent.ts:893); the agreement no longer in force for later dates (src/engine/systems/pro.ts:527); commission still owed on contracts made in the term (src/engine/systems/propay.ts:342); an agreement offered again says this one lapsed (from brief 20) (src/engine/systems/proagent.ts:893); no longer in force after its end (src/engine/systems/pro.ts:527); History With His Office draws the relation's history, the lapse among it (src/ui/career/RepresentationPane.tsx:298); What Needs You and the notices list carry the lapse notice (src/engine/systems/proagent.ts:1179)
- **Timed events:** The offer’s lapse; the term’s end; Equity’s ninety days, SAG-AFTRA’s 151 and 91.
- **Exit and recovery:** Commission still owed on work contracted while represented; one agent at a time.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts. / The calendar's pending item and the relation's history are in the save; the handler reads the relation's route and approaches before acting and `note` keys the line, so a save opened past the day says nothing more (tests/b20-agent-ask-lapse.test.ts, after `reload`).
- **Tests and evidence:** `tests/career-agents.test.ts`, `tests/journey-agent.test.ts`, `tests/journey-career.test.ts`, `tests/pro-representation-screen.test.ts`, `tests/b20-career-saveload.test.ts`, `tests/b20-career-effects.test.ts`, `tests/b20-career-history.test.ts`, `tests/propay.test.ts`, `tests/b20-agent-ask-lapse.test.ts`

## 10. Project Development And Opportunity Supply

**Status:** Implemented And Verified

- **Code (features):** `pro.postings`, `pro.series`
- **Entry:** The clock, every Monday at nine it passes (`onPassage`): the Opportunities tab's Open Calls and Through An Agent. / The clock, at the first stop after each May 15 from 2030 (`onPassage`): the network's word on The Calloway Files, as a notice and on the Work tab.
- **Decisions:** None: the world makes the work.
- **States and transitions:** Each week’s slate by market and kind; a production made, pushed back or dropped; series seasons ordered or decided.
- **Immediate effects:** Each part drawn posted (from brief 20, a part posted again says it's a new casting and what came of the last time); windows passed closed as lapsed; the agent tries his submissions. / Canceled: castings in it closed as withdrawn, work booked for days not yet done called off with nothing owed, an option on its next season lapsed once; renewed or revived: nothing booked, the player told where they've worked in it, an open option's contract noting it; revived, from 2026-10-25 (brief 27's loop 41), its producers' word on each character the player played set for before the new season (`pro.revival`).
- **Downstream consumers:** Submit Yourself reads the posting (src/engine/systems/projobs.ts:752); the agent submits where it suits (src/engine/systems/projobs.ts:978); the card says what came of the last time (from brief 20) (src/ui/career/OpportunitiesPane.tsx:71); the week's postings cast a series part only while a season is made (src/engine/systems/projobs.ts:522); a casting closed (src/engine/systems/series.ts:217); work called off, its days worked still paid (src/engine/systems/series.ts:221); the option lapses with the series (src/engine/systems/series.ts:226); the contract's fold says the series' word so far (src/ui/career/WorkPane.tsx:280); revived, the producers' word on the player's characters set (src/engine/systems/series.ts:358)
- **Timed events:** Monday’s postings; a production’s fate known weeks before its first day.
- **Exit and recovery:** A pushed part posted again for its new dates.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts. The last posting of each part is kept past the record's bounds (`lastPosted`). / The professional record (`person.pro`: each engagement's `contract`, `allowances` and payments, and `residuals`) and the calendar's pending `pro.*` items are in the save; every handler reads its record's own state (a status, a key, a paid settlement) before acting, so a load runs nothing twice; the series' seasons are worked out from the seed, so a reload decides them the same. Held across a save and a load at each stage by tests/career-contracts.test.ts.
- **Tests and evidence:** `tests/b27-slate.test.ts`, `tests/b27-slate-screens.test.ts`, `tests/pro-work.test.ts`, `tests/b20-career-history.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b20-career-effects.test.ts`, `tests/career-contracts.test.ts`

## 11. Discovering And Evaluating A Role

**Status:** Implemented And Verified

- **Code (features):** `pro.postings`, `ui.career-reference`
- **Entry:** The clock, every Monday at nine it passes (`onPassage`): the Opportunities tab's Open Calls and Through An Agent. / Career, Productions And People (src/ui/career/ReferencePane.tsx); a role's Open Its Page on the Opportunities tab opens a project's page there.
- **Decisions:** Whether a role suits: its project, part, what it asks, dates, place and pay, and its page in Productions And People.
- **States and transitions:** Posted, open until its date.
- **Immediate effects:** Each part drawn posted (from brief 20, a part posted again says it's a new casting and what came of the last time); windows passed closed as lapsed; the agent tries his submissions. / Nothing in the world: a page opens, and the trail of pages followed is kept while the player is elsewhere, never in the save. Its actions turn the Career screen to the tab where the player can act.
- **Downstream consumers:** Submit Yourself reads the posting (src/engine/systems/projobs.ts:752); the agent submits where it suits (src/engine/systems/projobs.ts:978); the card says what came of the last time (from brief 20) (src/ui/career/OpportunitiesPane.tsx:71)
- **Timed events:** The submission window’s close.
- **Exit and recovery:** A role let go lapses unsaid.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts. The last posting of each part is kept past the record's bounds (`lastPosted`). / Nothing of its own: every page is read from the save as it stands, and the trail isn't saved.
- **Tests and evidence:** `tests/pro-opportunities-screen.test.ts`, `tests/b27-reference.test.ts`, `tests/pro-work.test.ts`, `tests/b20-career-history.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b20-career-effects.test.ts`

## 12. Submission

**Status:** Implemented And Verified

- **Code (features):** `pro.submit`, `pro.reply`
- **Entry:** Career, Opportunities, Open Calls: Submit Yourself, grayed with submitRefusal's words. / The clock, two days after a submission (`REPLY_KIND` in projobs).
- **Decisions:** Submit yourself, with what the casting asks for.
- **States and transitions:** Open, submitted, then an audition or a pass.
- **Immediate effects:** What was sent kept, the role submitted, casting's answer on the clock two days on. / The audition in person or the self-tape set (`setRound`), on the calendar, said with any clash.
- **Downstream consumers:** casting answers with a round (src/engine/systems/projobs.ts:1372); the audition in person on the clock (src/engine/systems/projobs.ts:1378); the self-tape's deadline on the clock (src/engine/systems/projobs.ts:1392)
- **Timed events:** Casting’s answer some days on.
- **Exit and recovery:** A submission refused names what’s missing and where to make it.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/journey-career.test.ts`, `tests/pro-work.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b20-career-effects.test.ts`, `tests/b20-career-saveload.test.ts`

## 13. Self-Tape

**Status:** Implemented And Verified

- **Code (features):** `pro.tape_audition`, `pro.tape_due`, `pro.prepare`
- **Entry:** Career, Opportunities, In Progress: Tape It, grayed with tapeRefusal's words. / The clock, the self-tape's deadline (`TAPE_DUE_KIND`). / Career, Opportunities: Break It Down, Learn The Lines, Rehearse It On Your Feet, on the sides of an audition to come and on the part once booked.
- **Decisions:** Prepare the sides by the steps, and tape it before it’s due.
- **States and transitions:** An audition set, prepared, taped or missed.
- **Immediate effects:** The tape judged (`evaluate`), kept on the work record, the round done with its band and what held it back; casting's decision on the clock. / The round missed and the role lapsed, said. / The sides' or the part's preparation moved, the clock on by the step's time, the body exerted, the ability practiced.
- **Downstream consumers:** casting reads the round's band (src/engine/systems/projobs.ts:1413); the part comes round again saying the tape wasn't in (from brief 20) (src/engine/systems/projobs.ts:427); the audition judged with the sides' preparation (src/engine/systems/projobs.ts:1057); each work day judged with the part's (src/engine/systems/projobs.ts:1197); the part starts from half the sides' (src/engine/systems/projobs.ts:1575)
- **Timed events:** The tape’s due evening.
- **Exit and recovery:** A tape missed closes the round, said.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/journey-career.test.ts`, `tests/pro-work.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b20-career-effects.test.ts`

## 14. In-Person Audition

**Status:** Implemented And Verified

- **Code (features):** `pro.audition`, `pro.move_audition`
- **Entry:** The clock at an audition in person, a stop with its trip (`AUDITION_KIND`). / Career, Opportunities, In Progress: Ask For Another Time, grayed with moveRefusal's words.
- **Decisions:** Go when the clock stops; ask once for another time a day ahead.
- **States and transitions:** Set, moved once, done or missed.
- **Immediate effects:** Judged (`evaluate`) and kept, the round done with its band, casting's decision on the clock; or missed and the role lapsed. / The round at the other time, its item rescheduled, moved counted, the move in the record.
- **Downstream consumers:** casting reads the band (src/engine/systems/projobs.ts:1413); the School counts the actor away for its hours (src/engine/systems/projobs.ts:550); the audition judged or missed at its new time (src/engine/systems/projobs.ts:1378)
- **Timed events:** The audition’s hour, with the trip there.
- **Exit and recovery:** A clash moved once to a clear time.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/journey-career.test.ts`, `tests/pro-work.test.ts`, `tests/b20-career-skill.test.ts`

## 15. Callback, Chemistry Read, Or Screen Test

**Status:** Implemented And Verified

- **Code (features):** `pro.audition`, `pro.casting_decision`
- **Entry:** The clock at an audition in person, a stop with its trip (`AUDITION_KIND`). / The clock, a day after a round casting cuts from, three after the last (`CASTING_KIND`).
- **Decisions:** Go to each round.
- **States and transitions:** Audition, callback, chemistry read and screen test, each judged; a hold on the dates from the cut.
- **Immediate effects:** Judged (`evaluate`) and kept, the round done with its band, casting's decision on the clock; or missed and the role lapsed. / A callback set, an offer made (`makeOffer`), or a pass; the chance and the fit kept on the round.
- **Downstream consumers:** casting reads the band (src/engine/systems/projobs.ts:1413); the School counts the actor away for its hours (src/engine/systems/projobs.ts:550); the offer read by Accept, Decline and What Needs You (src/engine/systems/projobs.ts:1118)
- **Timed events:** Each round’s hour; casting’s decision after the last.
- **Exit and recovery:** A round slept through ends it.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/b27-rounds.test.ts`, `tests/pro-work.test.ts`, `tests/b20-career-skill.test.ts`

## 16. Direct Offer

**Status:** Implemented And Verified

- **Code (features):** `pro.accept_offer`, `pro.decline_offer`, `pro.offer_lapse`, `pro.invite`
- **Entry:** Career, Opportunities, Offers: Accept The Offer, and What Needs You's question with the same action; grayed with acceptRefusal's words. / Career, Opportunities, Offers: Decline The Offer, and What Needs You's Decline action. / The clock, the offer's last moment (`OFFER_KIND`). / The clock, 240 days after an anthology's wrap whose work was judged Strong or better (`INVITE_KIND`).
- **Decisions:** Accept or decline an offer made without an audition.
- **States and transitions:** Offered, booked, declined or lapsed.
- **Immediate effects:** An engagement booked: its days on the calendar as stops (`pro.work_day`), the part's preparation from half the sides', each week's pay promised and put on the clock (`schedulePay`), permission to work read and kept, the agreement in force on it, in term marked unapproved or approved; the offer settled as booked. / The offer's lapse called off; the opportunity settled as declined, its outcome kept (`settle`), its What Needs You question resolved. / The offer lapsed, said, settled with its outcome. / The next story's part posted to the player and offered at once, without an audition; a line in the opportunity's history.
- **Downstream consumers:** each work day judged on the clock (src/engine/systems/projobs.ts:1430); each promised payment paid on its payday (src/engine/systems/propay.ts:727); the School counts the actor away at work (src/engine/systems/projobs.ts:550); another booking on the same days refused (src/engine/systems/projobs.ts:714); a part booked never posted again (src/engine/systems/projobs.ts:478); a part declined comes round again only as a new casting, saying so (from brief 20) (src/engine/systems/projobs.ts:427); an offer through him, declined, counts for Equity's 90 days (src/engine/systems/proagent.ts:660); the part comes round again saying the offer lapsed (from brief 20) (src/engine/systems/projobs.ts:427); the part posted and offered (src/engine/systems/projobs.ts:1851); the offer's line says why (src/engine/systems/projobs.ts:1854)
- **Timed events:** The offer’s lapse.
- **Exit and recovery:** Declining closes it with no penalty beyond the part.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts. / The professional record (`person.pro`: each engagement's `units`, `reports`, `choices`, `script` and `loop`, and `person.health.voice`) and the calendar's pending `pro.*` items are in the save; every handler reads its record's own state (a day reported, a page drawn, a loop's status, an engagement for the next story) before acting, so a load runs nothing twice; every draw is keyed by the work, never by an id, so a reload decides it the same. Held across a save and a load at each stage by tests/career-workflows.test.ts and tests/career-workflows-screen.test.ts.
- **Tests and evidence:** `tests/b27-offers.test.ts`, `tests/b20-career-defects.test.ts`, `tests/b20-career-effects.test.ts`, `tests/b20-career-saveload.test.ts`, `tests/b22-authorization.test.ts`, `tests/pro-opportunities-screen.test.ts`, `tests/pro-work.test.ts`, `tests/b20-career-history.test.ts`, `tests/career-workflows.test.ts`, `tests/career-workflows-screen.test.ts`

## 17. Rejection And Recovery

**Status:** Implemented And Verified

- **Code (features):** `pro.casting_decision`, `pro.offer_lapse`
- **Entry:** The clock, a day after a round casting cuts from, three after the last (`CASTING_KIND`). / The clock, the offer's last moment (`OFFER_KIND`).
- **Decisions:** What to do next: other roles, better materials.
- **States and transitions:** Passed or lapsed, kept in the history with why.
- **Immediate effects:** A callback set, an offer made (`makeOffer`), or a pass; the chance and the fit kept on the round. / The offer lapsed, said, settled with its outcome.
- **Downstream consumers:** the offer read by Accept, Decline and What Needs You (src/engine/systems/projobs.ts:1118); the part comes round again saying the offer lapsed (from brief 20) (src/engine/systems/projobs.ts:427)
- **Timed events:** None.
- **Exit and recovery:** Why It Went This Way gives the round’s reasons; the next Monday posts again.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/journey-career.test.ts`, `tests/pro-work.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b20-career-history.test.ts`

## 18. Negotiation

**Status:** Implemented And Verified

- **Code (features):** `pro.ask_more`, `pro.negotiate_answer`
- **Entry:** Career, Opportunities, Offers: Ask For (the figure) A Day or A Week on a standing offer; grayed with askMoreRefusal's words. / The production's answer to the agent's ask, the afternoon after it, at three.
- **Decisions:** Have the agent ask once for more.
- **States and transitions:** The offer versioned, raised or kept.
- **Immediate effects:** The ask on the offer (a fifth over, in whole dollars, and when the answer comes), the offer standing a day past the answer, its lapse moved with it, the answer on the clock, and a history line. / The offer's amount raised to what was asked and its version to 2, or kept; the answer on the ask; a history line and a notice.
- **Downstream consumers:** the answer next afternoon raises the offer to what was asked or keeps it, by its draw (src/engine/systems/projobs.ts:2140); raised, the offer's amount is what the contract and the pay read (src/engine/systems/projobs.ts:2152); the offer's lapse moves to a day past the answer (src/engine/systems/projobs.ts:2390); asked once, a second ask is refused (src/engine/systems/projobs.ts:1529); the offer card and the contract read the amount (src/engine/systems/projobs.ts:2152)
- **Timed events:** The answer the next afternoon; the lapse moved past it.
- **Exit and recovery:** Without an agent nobody asks; a second ask refused.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/b27-offers.test.ts`, `tests/b27-award-effects.test.ts`

## 19. Contract Signing And Booking

**Status:** Implemented And Verified

- **Code (features):** `pro.accept_offer`
- **Entry:** Career, Opportunities, Offers: Accept The Offer, and What Needs You's question with the same action; grayed with acceptRefusal's words.
- **Decisions:** Accept the offer, reading what accepting brings first.
- **States and transitions:** Booked: a contract with only the clauses that apply, the work days on the calendar, the pay promised.
- **Immediate effects:** An engagement booked: its days on the calendar as stops (`pro.work_day`), the part's preparation from half the sides', each week's pay promised and put on the clock (`schedulePay`), permission to work read and kept, the agreement in force on it, in term marked unapproved or approved; the offer settled as booked.
- **Downstream consumers:** each work day judged on the clock (src/engine/systems/projobs.ts:1430); each promised payment paid on its payday (src/engine/systems/propay.ts:727); the School counts the actor away at work (src/engine/systems/projobs.ts:550); another booking on the same days refused (src/engine/systems/projobs.ts:714); a part booked never posted again (src/engine/systems/projobs.ts:478)
- **Timed events:** The work days; each payment’s due date.
- **Exit and recovery:** Called off later, what was earned is kept.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/career-contracts.test.ts`, `tests/b20-career-defects.test.ts`, `tests/b20-career-effects.test.ts`, `tests/b20-career-saveload.test.ts`, `tests/b22-authorization.test.ts`, `tests/pro-opportunities-screen.test.ts`, `tests/pro-work.test.ts`

## 20. Holds, Options, And Conflicts

**Status:** Implemented And Verified

- **Code (features):** `pro.ask_hold`, `pro.hold_answer`
- **Entry:** Career, Opportunities, In Progress: Ask Them To Decide on a part whose production holds the actor's dates; grayed with holdAskRefusal's words. / The production's answer when asked to decide on a part it holds, the afternoon after the ask, at three.
- **Decisions:** Ask the production to decide first, or let the hold go for other work.
- **States and transitions:** A hold from the cut, booked, let go or withdrawn; a series part’s option taken up or not.
- **Immediate effects:** The ask on the hold (when, against which offer, when the answer comes), the answer on the clock, and a history line. / Booked: the rounds still to come off the calendar and the offer made. Let go: the part settled as passed, its hold released, a notice saying the other offer is free.
- **Downstream consumers:** the answer next afternoon books the actor or lets the hold go, by its draw (src/engine/systems/projobs.ts:2274); booked, the offer is made now and the rounds still to come are dropped (src/engine/systems/projobs.ts:2282); let go, the part is settled and the other offer is free (src/engine/systems/projobs.ts:2286); asked once, a second ask is refused, and an offer lapsing before the answer refuses it (src/engine/systems/projobs.ts:1246); booked, the offer and its decision (src/engine/systems/projobs.ts:2282); let go, the hold released with the part (src/engine/systems/projobs.ts:1470)
- **Timed events:** The answer the next afternoon; the option’s last day.
- **Exit and recovery:** Accepting other work lets the hold go, said before it’s pressed.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/b27-holds.test.ts`, `tests/career-contracts.test.ts`

## 21. Role Preparation

**Status:** Implemented And Verified

- **Code (features):** `pro.prepare`, `pro.pages`
- **Entry:** Career, Opportunities: Break It Down, Learn The Lines, Rehearse It On Your Feet, on the sides of an audition to come and on the part once booked. / The clock, at the first stop after 6:00 PM the evening before each work day of a format that revises its pages (`onPassage`).
- **Decisions:** Prepare by each format’s own steps.
- **States and transitions:** Preparation levels, revised pages the night before.
- **Immediate effects:** The sides' or the part's preparation moved, the clock on by the step's time, the body exerted, the ability practiced. / The script's version up by one for the day and the days after; that share of what was learned of the lines (or of the breakdown, where there are none) taken off; a line in the history; a notice.
- **Downstream consumers:** the audition judged with the sides' preparation (src/engine/systems/projobs.ts:1057); each work day judged with the part's (src/engine/systems/projobs.ts:1197); the part starts from half the sides' (src/engine/systems/projobs.ts:1575); the units shot that day carry the new version (src/engine/systems/workflow.ts:655); what was learned falls by the share (src/engine/systems/workflow.ts:658); the day's report says the pages were revised (src/engine/systems/workflow.ts:361); the Work tab's report reads it (src/engine/systems/workflow.ts:473)
- **Timed events:** The revision the evening before a work day.
- **Exit and recovery:** Unprepared work is judged lower, said.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts. / The professional record (`person.pro`: each engagement's `units`, `reports`, `choices`, `script` and `loop`, and `person.health.voice`) and the calendar's pending `pro.*` items are in the save; every handler reads its record's own state (a day reported, a page drawn, a loop's status, an engagement for the next story) before acting, so a load runs nothing twice; every draw is keyed by the work, never by an id, so a reload decides it the same. Held across a save and a load at each stage by tests/career-workflows.test.ts and tests/career-workflows-screen.test.ts.
- **Tests and evidence:** `tests/career-workflows.test.ts`, `tests/journey-career.test.ts`, `tests/b20-career-effects.test.ts`, `tests/b20-career-skill.test.ts`, `tests/pro-work.test.ts`, `tests/career-workflows-screen.test.ts`

## 22. Work Travel And Arrival

**Status:** Implemented And Verified

- **Code (features):** `pro.trip_depart`, `pro.trip_arrive`, `pro.apply_work_visa`, `pro.visa_decision`
- **Entry:** The clock, at each leg's departure (`DEPART_KIND`); the first leg of each way stops the clock for the player. / The clock, at each leg's arrival (`ARRIVE_KIND`). / Career, Work: Apply For The Visa on a booking abroad, grayed with visaRefusal's words. / The clock, the game's assumed ten days after the application (`VISA_KIND`).
- **Decisions:** Apply for the visa; be awake for the car to the airport.
- **States and transitions:** A trip booked, departed, arrived, home; a visa pending, granted or refused; a flight missed.
- **Immediate effects:** The leg on its way, or missed (the rest of that way canceled; the way home booked a day later); at the first departure out without permission, the trip canceled and the booking released. / The leg done; out, the stay begun and the trip there; home, the trip over. / A pending permit in Papers tied to the booking (`bookingId`), and the department's decision on the clock, the game's assumed ten days on. Nothing charged: the page holds no charge. / The permit valid, issued now, running to the last work day and the route's 28 days.
- **Downstream consumers:** where the player is, for the School and the casting offices (src/engine/systems/projobs.ts:582); an audition at home while away is missed (src/engine/systems/projobs.ts:1521); a booking in the trip's days is refused (src/engine/systems/projobs.ts:758); the stay checked in (src/engine/systems/worktrip.ts:449); a work day reads the player there (src/engine/systems/projobs.ts:1583); the trip over frees its days (src/engine/systems/worktrip.ts:454); the permit read for each work day and at the first flight (src/engine/systems/worktrip.ts:240); the first departure checks it and releases the actor without it (src/engine/systems/worktrip.ts:402); each work day reads it in force (`abroadRead`) (src/engine/systems/worktrip.ts:241); a work day without it releases the actor (src/engine/systems/projobs.ts:1583)
- **Timed events:** Each leg; the visa’s decision.
- **Exit and recovery:** A missed flight books the same flights a day later, or the work goes on without the actor.
- **Save and load:** The professional record (`person.pro`, its `trips` and each engagement's `tripId`), the permit in `person.documents` and the calendar's pending `pro.*` items are in the save; each handler reads the leg's, the trip's or the permit's own status before acting, so a load runs nothing twice. Held across a save and a load at the visa, before the flight and after it by tests/career-world-sydney.test.ts.
- **Tests and evidence:** `tests/career-world-sydney.test.ts`, `tests/b27-ill.test.ts`
- **Not built, said why:** A delayed flight: the trip lands a day ahead of the first call, so a delay changes nothing short of a day’s (README, K5).

## 23. Live-Action Production Day

**Status:** Implemented And Verified

- **Code (features):** `pro.work_day`, `pro.work_choice`, `pro.weather`
- **Entry:** The clock at each booked day, a stop with its trip (`WORK_DAY_KIND`). / Career, Work: How The Work Is Done, a button for each option of each choice the work asks, grayed with choiceRefusal's words. / The clock, at the first stop after 6:00 PM, in the shoot's own town, the evening before each day out on location (`onPassage`), or at the day's own call where no stop came between.
- **Decisions:** Go to each day; ask for another take, use the double.
- **States and transitions:** Each day worked, judged and reported; a weather day slips the days.
- **Immediate effects:** A rehearsal moves the part's preparation; a night on stage takes its nerves first (from brief 20); a night or a shoot day is judged and kept, practice in the project's genres, the stage credit at the first night; every day enjoyed or not, the project's kinds against the genres loved and a rehearsal by agreeableness (from brief 20); the unions a first day brings (Equity by the contract, billed from brief 20; SAG-AFTRA eligibility); in term without approval the School's warning or dismissal; the last day finishes the work, the screen credit and its release on the clock. Missed: the company's warning or replacement. Without permission for the day (OPT ended or run out, or none held), nothing of it happens and the work is released (`release`): called off from then, the days worked still paid, a stage credit earned kept, said with why. / The option kept on the engagement (`choices`), in force from the next day worked; a line in its history. / Slipped: the day and every day after it a working day later, their calendar items moved, the flight home booked again from the new last day and the stay with it, the per diem's days, the pay promised again by key. Lost: the day's scenes cut from the part, its overtime off the pay. Either way the weather day kept on the engagement, a line in its history and a notice.
- **Downstream consumers:** the credit's band, read by a referral (src/engine/systems/proagent.ts:548); Equity's bills from a contract's first day (from brief 20) (src/engine/systems/propay.ts:756); practice in the project's genres, read by the next fit (src/engine/systems/projobs.ts:352); the School counts the actor away (src/engine/systems/projobs.ts:550); the nerves' stress, read by readiness, which the condition of the next piece of work reads (`conditionAt`) (src/engine/systems/life.ts:301); the day's morale, read by readiness the same way (src/engine/systems/life.ts:304); composure grown by facing a house, read by the next night's nerves (src/engine/systems/attributes.ts:351); laid up or in hospital on a lead's or a supporting part's day, shot around once, the rest slipped (`illDay`, from 2026-10-25, brief 27's K5) (src/engine/systems/projobs.ts:2570); the day's judging leans on the option's dimensions (src/engine/systems/workflow.ts:248); the takes a scene gets (src/engine/systems/workflow.ts:343); an intimate scene without consent goes to a body double (src/engine/systems/workflow.ts:395); the looping session's sync choice (src/engine/systems/workflow.ts:585); the Work tab shows the option in force (src/ui/career/WorkPane.tsx:286); the days slip, and their calendar items with them (src/engine/systems/projobs.ts:2204); a day that can't slip has its scenes cut (src/engine/systems/projobs.ts:2206); the flight home moves (src/engine/systems/projobs.ts:2209); the pay is promised again: the day off paid on SAG-AFTRA's day rate, a lost day's overtime gone (src/engine/systems/projobs.ts:1774); a lost day is never worked, and the last one still ends the work (src/engine/systems/projobs.ts:2478)
- **Timed events:** Each call; the weather the evening before.
- **Exit and recovery:** A day that can’t slip is shot without the actor.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts. / The professional record (`person.pro`: each engagement's `units`, `reports`, `choices`, `script` and `loop`, and `person.health.voice`) and the calendar's pending `pro.*` items are in the save; every handler reads its record's own state (a day reported, a page drawn, a loop's status, an engagement for the next story) before acting, so a load runs nothing twice; every draw is keyed by the work, never by an id, so a reload decides it the same. Held across a save and a load at each stage by tests/career-workflows.test.ts and tests/career-workflows-screen.test.ts. / The professional record (`person.pro`: each engagement's `weather`, `days`, `units`, `pay` and its trip's legs) and the calendar's pending `pro.*` items are in the save; the passage reads the engagement's own record (a day logged, a weather day kept) before acting, and the weather is a function of the save's seed, so a load decides it the same: held by tests/b27-weather.test.ts, a twin saved and opened two days before meeting the same sky, slipping the same days and promising the same pay.
- **Tests and evidence:** `tests/career-workflows.test.ts`, `tests/b27-weather.test.ts`, `tests/b20-career-defects.test.ts`, `tests/b20-career-effects.test.ts`, `tests/b20-career-saveload.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b22-authorization.test.ts`, `tests/pro-work.test.ts`, `tests/b27-ill.test.ts`, `tests/career-workflows-screen.test.ts`

## 24. Multi-Camera Or Audience-Based Production

**Status:** Implemented And Verified

- **Code (features):** `pro.work_day`
- **Entry:** The clock at each booked day, a stop with its trip (`WORK_DAY_KIND`).
- **Decisions:** Each day of the week to the tape night.
- **States and transitions:** Table read, rehearsal, blocking, tape night.
- **Immediate effects:** A rehearsal moves the part's preparation; a night on stage takes its nerves first (from brief 20); a night or a shoot day is judged and kept, practice in the project's genres, the stage credit at the first night; every day enjoyed or not, the project's kinds against the genres loved and a rehearsal by agreeableness (from brief 20); the unions a first day brings (Equity by the contract, billed from brief 20; SAG-AFTRA eligibility); in term without approval the School's warning or dismissal; the last day finishes the work, the screen credit and its release on the clock. Missed: the company's warning or replacement. Without permission for the day (OPT ended or run out, or none held), nothing of it happens and the work is released (`release`): called off from then, the days worked still paid, a stage credit earned kept, said with why.
- **Downstream consumers:** the credit's band, read by a referral (src/engine/systems/proagent.ts:548); Equity's bills from a contract's first day (from brief 20) (src/engine/systems/propay.ts:756); practice in the project's genres, read by the next fit (src/engine/systems/projobs.ts:352); the School counts the actor away (src/engine/systems/projobs.ts:550); the nerves' stress, read by readiness, which the condition of the next piece of work reads (`conditionAt`) (src/engine/systems/life.ts:301); the day's morale, read by readiness the same way (src/engine/systems/life.ts:304); composure grown by facing a house, read by the next night's nerves (src/engine/systems/attributes.ts:351); laid up or in hospital on a lead's or a supporting part's day, shot around once, the rest slipped (`illDay`, from 2026-10-25, brief 27's K5) (src/engine/systems/projobs.ts:2570)
- **Timed events:** The week’s calls.
- **Exit and recovery:** A missed day by the medium’s rule.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/career-workflows.test.ts`, `tests/b20-career-defects.test.ts`, `tests/b20-career-effects.test.ts`, `tests/b20-career-saveload.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b22-authorization.test.ts`, `tests/pro-work.test.ts`, `tests/b27-ill.test.ts`

## 25. Animation And Voice Work

**Status:** Implemented And Verified

- **Code (features):** `pro.work_day`, `pro.mix_demo`
- **Entry:** The clock at each booked day, a stop with its trip (`WORK_DAY_KIND`). / Career, Portfolio: Mix A Voice Demo, choosing up to four voice recordings; grayed with demoRefusal's words.
- **Decisions:** Each booth session; a voice demo for voice casting.
- **States and transitions:** Sessions worked; voice credits that go on a demo, not a reel.
- **Immediate effects:** A rehearsal moves the part's preparation; a night on stage takes its nerves first (from brief 20); a night or a shoot day is judged and kept, practice in the project's genres, the stage credit at the first night; every day enjoyed or not, the project's kinds against the genres loved and a rehearsal by agreeableness (from brief 20); the unions a first day brings (Equity by the contract, billed from brief 20; SAG-AFTRA eligibility); in term without approval the School's warning or dismissal; the last day finishes the work, the screen credit and its release on the clock. Missed: the company's warning or replacement. Without permission for the day (OPT ended or run out, or none held), nothing of it happens and the work is released (`release`): called off from then, the days worked still paid, a stage credit earned kept, said with why. / $300 spent as a work cost, two hours on the clock, a demo material numbered among its kind with its recordings and bands.
- **Downstream consumers:** the credit's band, read by a referral (src/engine/systems/proagent.ts:548); Equity's bills from a contract's first day (from brief 20) (src/engine/systems/propay.ts:756); practice in the project's genres, read by the next fit (src/engine/systems/projobs.ts:352); the School counts the actor away (src/engine/systems/projobs.ts:550); the nerves' stress, read by readiness, which the condition of the next piece of work reads (`conditionAt`) (src/engine/systems/life.ts:301); the day's morale, read by readiness the same way (src/engine/systems/life.ts:304); composure grown by facing a house, read by the next night's nerves (src/engine/systems/attributes.ts:351); laid up or in hospital on a lead's or a supporting part's day, shot around once, the rest slipped (`illDay`, from 2026-10-25, brief 27's K5) (src/engine/systems/projobs.ts:2570); a voice part's submission sends it, where screen work sends the reel (src/engine/systems/projobs.ts:1291); a voice part whose casting asks for a demo refuses a submission without one (src/engine/systems/projobs.ts:963); the voice purpose of the materials check says when newer recordings came after it (src/engine/systems/pro.ts:1164); the same recordings again are refused (src/engine/systems/pro.ts:1248)
- **Timed events:** Each session.
- **Exit and recovery:** A pickup session after the wrap.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/career-workflows.test.ts`, `tests/b27-voice-demo.test.ts`, `tests/b20-career-defects.test.ts`, `tests/b20-career-effects.test.ts`, `tests/b20-career-saveload.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b22-authorization.test.ts`, `tests/pro-work.test.ts`, `tests/b27-ill.test.ts`, `tests/pro-core.test.ts`

## 26. Performance Capture

**Status:** Implemented And Verified

- **Code (features):** `pro.work_day`
- **Entry:** The clock at each booked day, a stop with its trip (`WORK_DAY_KIND`).
- **Decisions:** Each capture day.
- **States and transitions:** Days worked, other characters at no more pay.
- **Immediate effects:** A rehearsal moves the part's preparation; a night on stage takes its nerves first (from brief 20); a night or a shoot day is judged and kept, practice in the project's genres, the stage credit at the first night; every day enjoyed or not, the project's kinds against the genres loved and a rehearsal by agreeableness (from brief 20); the unions a first day brings (Equity by the contract, billed from brief 20; SAG-AFTRA eligibility); in term without approval the School's warning or dismissal; the last day finishes the work, the screen credit and its release on the clock. Missed: the company's warning or replacement. Without permission for the day (OPT ended or run out, or none held), nothing of it happens and the work is released (`release`): called off from then, the days worked still paid, a stage credit earned kept, said with why.
- **Downstream consumers:** the credit's band, read by a referral (src/engine/systems/proagent.ts:548); Equity's bills from a contract's first day (from brief 20) (src/engine/systems/propay.ts:756); practice in the project's genres, read by the next fit (src/engine/systems/projobs.ts:352); the School counts the actor away (src/engine/systems/projobs.ts:550); the nerves' stress, read by readiness, which the condition of the next piece of work reads (`conditionAt`) (src/engine/systems/life.ts:301); the day's morale, read by readiness the same way (src/engine/systems/life.ts:304); composure grown by facing a house, read by the next night's nerves (src/engine/systems/attributes.ts:351); laid up or in hospital on a lead's or a supporting part's day, shot around once, the rest slipped (`illDay`, from 2026-10-25, brief 27's K5) (src/engine/systems/projobs.ts:2570)
- **Timed events:** Each call.
- **Exit and recovery:** A missed day by the medium’s rule.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/career-workflows.test.ts`, `tests/b20-career-defects.test.ts`, `tests/b20-career-effects.test.ts`, `tests/b20-career-saveload.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b22-authorization.test.ts`, `tests/pro-work.test.ts`, `tests/b27-ill.test.ts`

## 27. Documentary-Related Performer Work

**Status:** Implemented And Verified

- **Code (features):** `pro.work_day`
- **Entry:** The clock at each booked day, a stop with its trip (`WORK_DAY_KIND`).
- **Decisions:** Narration or a reenactment.
- **States and transitions:** Sessions or days worked; a documentary performer ineligible for performer awards, said.
- **Immediate effects:** A rehearsal moves the part's preparation; a night on stage takes its nerves first (from brief 20); a night or a shoot day is judged and kept, practice in the project's genres, the stage credit at the first night; every day enjoyed or not, the project's kinds against the genres loved and a rehearsal by agreeableness (from brief 20); the unions a first day brings (Equity by the contract, billed from brief 20; SAG-AFTRA eligibility); in term without approval the School's warning or dismissal; the last day finishes the work, the screen credit and its release on the clock. Missed: the company's warning or replacement. Without permission for the day (OPT ended or run out, or none held), nothing of it happens and the work is released (`release`): called off from then, the days worked still paid, a stage credit earned kept, said with why.
- **Downstream consumers:** the credit's band, read by a referral (src/engine/systems/proagent.ts:548); Equity's bills from a contract's first day (from brief 20) (src/engine/systems/propay.ts:756); practice in the project's genres, read by the next fit (src/engine/systems/projobs.ts:352); the School counts the actor away (src/engine/systems/projobs.ts:550); the nerves' stress, read by readiness, which the condition of the next piece of work reads (`conditionAt`) (src/engine/systems/life.ts:301); the day's morale, read by readiness the same way (src/engine/systems/life.ts:304); composure grown by facing a house, read by the next night's nerves (src/engine/systems/attributes.ts:351); laid up or in hospital on a lead's or a supporting part's day, shot around once, the rest slipped (`illDay`, from 2026-10-25, brief 27's K5) (src/engine/systems/projobs.ts:2570)
- **Timed events:** Each call.
- **Exit and recovery:** A missed day by the medium’s rule.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/career-workflows.test.ts`, `tests/b20-career-defects.test.ts`, `tests/b20-career-effects.test.ts`, `tests/b20-career-saveload.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b22-authorization.test.ts`, `tests/pro-work.test.ts`, `tests/b27-ill.test.ts`

## 28. Changes, Absence, And Replacement

**Status:** Implemented And Verified

- **Code (features):** `pro.work_day`, `pro.weather`, `pro.pages`
- **Entry:** The clock at each booked day, a stop with its trip (`WORK_DAY_KIND`). / The clock, at the first stop after 6:00 PM, in the shoot's own town, the evening before each day out on location (`onPassage`), or at the day's own call where no stop came between. / The clock, at the first stop after 6:00 PM the evening before each work day of a format that revises its pages (`onPassage`).
- **Decisions:** Whether to go while unwell.
- **States and transitions:** A day missed, covered by an understudy, shot around once, or the actor replaced.
- **Immediate effects:** A rehearsal moves the part's preparation; a night on stage takes its nerves first (from brief 20); a night or a shoot day is judged and kept, practice in the project's genres, the stage credit at the first night; every day enjoyed or not, the project's kinds against the genres loved and a rehearsal by agreeableness (from brief 20); the unions a first day brings (Equity by the contract, billed from brief 20; SAG-AFTRA eligibility); in term without approval the School's warning or dismissal; the last day finishes the work, the screen credit and its release on the clock. Missed: the company's warning or replacement. Without permission for the day (OPT ended or run out, or none held), nothing of it happens and the work is released (`release`): called off from then, the days worked still paid, a stage credit earned kept, said with why. / Slipped: the day and every day after it a working day later, their calendar items moved, the flight home booked again from the new last day and the stay with it, the per diem's days, the pay promised again by key. Lost: the day's scenes cut from the part, its overtime off the pay. Either way the weather day kept on the engagement, a line in its history and a notice. / The script's version up by one for the day and the days after; that share of what was learned of the lines (or of the breakdown, where there are none) taken off; a line in the history; a notice.
- **Downstream consumers:** the credit's band, read by a referral (src/engine/systems/proagent.ts:548); Equity's bills from a contract's first day (from brief 20) (src/engine/systems/propay.ts:756); practice in the project's genres, read by the next fit (src/engine/systems/projobs.ts:352); the School counts the actor away (src/engine/systems/projobs.ts:550); the nerves' stress, read by readiness, which the condition of the next piece of work reads (`conditionAt`) (src/engine/systems/life.ts:301); the day's morale, read by readiness the same way (src/engine/systems/life.ts:304); composure grown by facing a house, read by the next night's nerves (src/engine/systems/attributes.ts:351); laid up or in hospital on a lead's or a supporting part's day, shot around once, the rest slipped (`illDay`, from 2026-10-25, brief 27's K5) (src/engine/systems/projobs.ts:2570); the days slip, and their calendar items with them (src/engine/systems/projobs.ts:2204); a day that can't slip has its scenes cut (src/engine/systems/projobs.ts:2206); the flight home moves (src/engine/systems/projobs.ts:2209); the pay is promised again: the day off paid on SAG-AFTRA's day rate, a lost day's overtime gone (src/engine/systems/projobs.ts:1774); a lost day is never worked, and the last one still ends the work (src/engine/systems/projobs.ts:2478); the units shot that day carry the new version (src/engine/systems/workflow.ts:655); what was learned falls by the share (src/engine/systems/workflow.ts:658); the day's report says the pages were revised (src/engine/systems/workflow.ts:361); the Work tab's report reads it (src/engine/systems/workflow.ts:473)
- **Timed events:** Each call; the weather day.
- **Exit and recovery:** Replacement ends the engagement with the pay earned kept.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts. / The professional record (`person.pro`: each engagement's `weather`, `days`, `units`, `pay` and its trip's legs) and the calendar's pending `pro.*` items are in the save; the passage reads the engagement's own record (a day logged, a weather day kept) before acting, and the weather is a function of the save's seed, so a load decides it the same: held by tests/b27-weather.test.ts, a twin saved and opened two days before meeting the same sky, slipping the same days and promising the same pay. / The professional record (`person.pro`: each engagement's `units`, `reports`, `choices`, `script` and `loop`, and `person.health.voice`) and the calendar's pending `pro.*` items are in the save; every handler reads its record's own state (a day reported, a page drawn, a loop's status, an engagement for the next story) before acting, so a load runs nothing twice; every draw is keyed by the work, never by an id, so a reload decides it the same. Held across a save and a load at each stage by tests/career-workflows.test.ts and tests/career-workflows-screen.test.ts.
- **Tests and evidence:** `tests/b27-ill.test.ts`, `tests/b27-weather.test.ts`, `tests/b20-career-defects.test.ts`, `tests/b20-career-effects.test.ts`, `tests/b20-career-saveload.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b22-authorization.test.ts`, `tests/pro-work.test.ts`, `tests/career-workflows.test.ts`, `tests/career-workflows-screen.test.ts`

## 29. Wrap And Post-Production Obligations

**Status:** Implemented And Verified

- **Code (features):** `pro.loop`, `pro.reshoot`, `pro.promo`
- **Entry:** The clock, at a looping session the production recalled the player to after a screen wrap (`LOOP_KIND`). / A feature's reshoot day on its set, 7:00 AM to 4:00 PM, or a voice part's pickup session, four hours in a booth near home, a month and a half to three months after the wrap (`afterWrap`). / A promotional film for a lead's or a supporting part's release, three hours at a studio near home at 10:00 AM on the first weekday from a fortnight before the release, up to three days before it, clear of other booked work, recalls and trips (`callPromo`); for a release held back, before the later date, set when the hold-back is said.
- **Decisions:** Go to the looping session, the reshoot or pickup, the promotional film.
- **States and transitions:** Recalled, held against other work, attended or missed.
- **Immediate effects:** The loops judged as a booth's, half a day's pay among the payments and on the clock; missed or not permitted, another actor loops it and nothing is paid. / Done: the weakest kept scenes or lines taken again, the better take kept, the credit's band read again, a day's pay (a fifth of a week for a weekly part) promised by its own key. Missed: those scenes or lines cut from the part, the band read again, nothing paid. A line in the history and a notice either way. / Made: a day performer's minimum promised by its own key where the contract pays it, and the actor's visibility to casting up `VISIBILITY.promo`, fading over three years, never the credit's band. Missed: nothing paid, and that work no longer brings its casting office's direct offer. A line in the history and a notice either way; the contract's term at acceptance; its hours held against another offer.
- **Downstream consumers:** the half day's pay (src/engine/systems/workflow.ts:598); the payroll pays it on its Thursday (src/engine/systems/workflow.ts:673); the loop's status read before acting, so it's worked once (src/engine/systems/workflow.ts:570); the better take kept (src/engine/systems/workflow.ts:675); missed, the scenes cut (src/engine/systems/workflow.ts:656); the credit's band read again from what's kept (src/engine/systems/workflow.ts:684); a day's pay promised and paid (src/engine/systems/workflow.ts:686); the day held against another offer (src/engine/systems/projobs.ts:1042); a day performer's minimum promised and paid (src/engine/systems/workflow.ts:754); the actor more visible to casting (src/engine/systems/awards.ts:651); missed, the direct offer on its strength gone (src/engine/systems/projobs.ts:1719); the day held against another offer (src/engine/systems/projobs.ts:1086); a loop or a reshoot kept off its hours (src/engine/systems/workflow.ts:569); the contract's term (src/engine/systems/contracts.ts:208)
- **Timed events:** Each recall a month and a half to three months on.
- **Exit and recovery:** A missed recall said, its pay not earned.
- **Save and load:** The professional record (`person.pro`: each engagement's `units`, `reports`, `choices`, `script` and `loop`, and `person.health.voice`) and the calendar's pending `pro.*` items are in the save; every handler reads its record's own state (a day reported, a page drawn, a loop's status, an engagement for the next story) before acting, so a load runs nothing twice; every draw is keyed by the work, never by an id, so a reload decides it the same. Held across a save and a load at each stage by tests/career-workflows.test.ts and tests/career-workflows-screen.test.ts. / The professional record (`person.pro`: each engagement's `further`, `units`, `pay`) and the calendar's pending `pro.*` items are in the save; the session reads the record's own status before acting, and the draw is keyed by the work, never by an id, so a reload decides it the same. / The professional record (`person.pro`: each engagement's `promo`, `pay`, `contract`) and the calendar's pending `pro.*` items are in the save; the film reads the record's own status before acting, and the draw is keyed by the work, never by an id, so a reload decides it the same.
- **Tests and evidence:** `tests/b27-reshoot.test.ts`, `tests/b27-promo.test.ts`, `tests/career-workflows.test.ts`, `tests/career-workflows-screen.test.ts`

## 30. Compensation

**Status:** Implemented And Verified

- **Code (features):** `pro.ask_pay`
- **Entry:** Career, Work: Ask About It under a payment that's Overdue, grayed with askRefusal's words.
- **Decisions:** Ask about a late payment.
- **States and transitions:** Each payment from estimated to settled, through the agency’s trust account where represented.
- **Immediate effects:** The payment marked asked, with the answer: paid within three business days (the game's assumption); its payday moved up to the answer where it was later; a line in the engagement's history.
- **Downstream consumers:** the payment's state reads Disputed (src/engine/systems/contracts.ts:220); the Work tab says who was asked and when it'll pay (src/ui/career/WorkPane.tsx:100); the payroll pays it at the moved payday, once (src/engine/systems/propay.ts:764)
- **Timed events:** The Thursday after each week; late pay’s answer.
- **Exit and recovery:** A late payment asked about; withholding, dues and commission each shown.
- **Save and load:** The professional record (`person.pro`: each engagement's `contract`, `allowances` and payments, and `residuals`) and the calendar's pending `pro.*` items are in the save; every handler reads its record's own state (a status, a key, a paid settlement) before acting, so a load runs nothing twice; the series' seasons are worked out from the seed, so a reload decides them the same. Held across a save and a load at each stage by tests/career-contracts.test.ts.
- **Tests and evidence:** `tests/propay.test.ts`, `tests/career-contracts.test.ts`
- **Not built, said why:** Expense claims and fares to local work: nothing a player pays is a production’s to reimburse; the per diem away is paid once home (README, K5).

## 31. Residuals Or Contingent Compensation

**Status:** Implemented And Verified

- **Code (features):** none of its own
- **Entry:** —
- **Decisions:** None of the player’s.
- **States and transitions:** Television work under SAG-AFTRA carries residuals; a rerun pays again.
- **Immediate effects:** —
- **Downstream consumers:** none named
- **Timed events:** A rerun’s payment.
- **Exit and recovery:** None.
- **Save and load:** —
- **Tests and evidence:** `tests/career-contracts.test.ts`

## 32. Work Ending And Money Still Owed

**Status:** Implemented And Verified

- **Code (features):** `pro.ask_pay`
- **Entry:** Career, Work: Ask About It under a payment that's Overdue, grayed with askRefusal's words.
- **Decisions:** Ask about what’s owed.
- **States and transitions:** Work finished or called off, the earned pay still paid, commission owed after an agreement ends.
- **Immediate effects:** The payment marked asked, with the answer: paid within three business days (the game's assumption); its payday moved up to the answer where it was later; a line in the engagement's history.
- **Downstream consumers:** the payment's state reads Disputed (src/engine/systems/contracts.ts:220); the Work tab says who was asked and when it'll pay (src/ui/career/WorkPane.tsx:100); the payroll pays it at the moved payday, once (src/engine/systems/propay.ts:764)
- **Timed events:** The remaining payments’ dates.
- **Exit and recovery:** A canceled engagement keeps what was earned.
- **Save and load:** The professional record (`person.pro`: each engagement's `contract`, `allowances` and payments, and `residuals`) and the calendar's pending `pro.*` items are in the save; every handler reads its record's own state (a status, a key, a paid settlement) before acting, so a load runs nothing twice; the series' seasons are worked out from the seed, so a reload decides them the same. Held across a save and a load at each stage by tests/career-contracts.test.ts.
- **Tests and evidence:** `tests/propay.test.ts`, `tests/journey-career-older.test.ts`, `tests/career-contracts.test.ts`

## 33. Distribution And Release

**Status:** Implemented And Verified

- **Code (features):** `pro.release`
- **Entry:** The clock, a screen project's release, months after its wrap (`RELEASE_KIND` in projobs).
- **Decisions:** None: the distributor decides.
- **States and transitions:** Released on time, held back, sent to streaming or shelved, told when due.
- **Immediate effects:** The credit released, dated (`releaseScreenCredit`), said.
- **Downstream consumers:** a released credit's footage is recorded work for a reel (src/engine/systems/pro.ts:847); a slate production held back: said, and its release put on the clock again (`RELEASE_FATE`, from 2026-10-25, brief 27's K6) (src/engine/systems/projobs.ts:2687); shelved: said, and never out, off the reel, with no premiere (src/engine/systems/projobs.ts:2696); sent to streaming instead of cinemas: out, with no weekly chart of its own (src/engine/systems/projobs.ts:2715)
- **Timed events:** The release date; a held-back release put on the clock again.
- **Exit and recovery:** A shelved credit stays shot, its footage never on a reel.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/b27-release.test.ts`, `tests/b20-career-effects.test.ts`, `tests/pro-core.test.ts`

## 34. Publicity

**Status:** Implemented And Verified

- **Code (features):** `pro.promo`
- **Entry:** A promotional film for a lead's or a supporting part's release, three hours at a studio near home at 10:00 AM on the first weekday from a fortnight before the release, up to three days before it, clear of other booked work, recalls and trips (`callPromo`); for a release held back, before the later date, set when the hold-back is said.
- **Decisions:** Go to the promotional film.
- **States and transitions:** Called, attended or missed.
- **Immediate effects:** Made: a day performer's minimum promised by its own key where the contract pays it, and the actor's visibility to casting up `VISIBILITY.promo`, fading over three years, never the credit's band. Missed: nothing paid, and that work no longer brings its casting office's direct offer. A line in the history and a notice either way; the contract's term at acceptance; its hours held against another offer.
- **Downstream consumers:** a day performer's minimum promised and paid (src/engine/systems/workflow.ts:754); the actor more visible to casting (src/engine/systems/awards.ts:651); missed, the direct offer on its strength gone (src/engine/systems/projobs.ts:1719); the day held against another offer (src/engine/systems/projobs.ts:1086); a loop or a reshoot kept off its hours (src/engine/systems/workflow.ts:569); the contract's term (src/engine/systems/contracts.ts:208)
- **Timed events:** A weekday a fortnight before the release.
- **Exit and recovery:** Missing it is said: the visibility it would lend isn’t gained, and its casting office won’t make a direct offer from that work.
- **Save and load:** The professional record (`person.pro`: each engagement's `promo`, `pay`, `contract`) and the calendar's pending `pro.*` items are in the save; the film reads the record's own status before acting, and the draw is keyed by the work, never by an id, so a reload decides it the same.
- **Tests and evidence:** `tests/b27-promo.test.ts`

## 35. Weekly Box Office

**Status:** Implemented And Verified

- **Code (features):** `pro.release`
- **Entry:** The clock, a screen project's release, months after its wrap (`RELEASE_KIND` in projobs).
- **Decisions:** None.
- **States and transitions:** A film in cinemas has a run in the game’s own chart; published charts read as dated imports.
- **Immediate effects:** The credit released, dated (`releaseScreenCredit`), said.
- **Downstream consumers:** a released credit's footage is recorded work for a reel (src/engine/systems/pro.ts:847); a slate production held back: said, and its release put on the clock again (`RELEASE_FATE`, from 2026-10-25, brief 27's K6) (src/engine/systems/projobs.ts:2687); shelved: said, and never out, off the reel, with no premiere (src/engine/systems/projobs.ts:2696); sent to streaming instead of cinemas: out, with no weekly chart of its own (src/engine/systems/projobs.ts:2715)
- **Timed events:** Each week as the clock reaches it.
- **Exit and recovery:** None.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/career-awards.test.ts`, `tests/career-awards-screen.test.ts`, `tests/b20-career-effects.test.ts`, `tests/pro-core.test.ts`, `tests/b27-release.test.ts`

## 36. Weekly Television And Streaming Performance

**Status:** Implemented And Verified

- **Code (features):** `pro.series`
- **Entry:** The clock, at the first stop after each May 15 from 2030 (`onPassage`): the network's word on The Calloway Files, as a notice and on the Work tab.
- **Decisions:** None.
- **States and transitions:** Each season’s audience in its own unit, the game’s estimate.
- **Immediate effects:** Canceled: castings in it closed as withdrawn, work booked for days not yet done called off with nothing owed, an option on its next season lapsed once; renewed or revived: nothing booked, the player told where they've worked in it, an open option's contract noting it; revived, from 2026-10-25 (brief 27's loop 41), its producers' word on each character the player played set for before the new season (`pro.revival`).
- **Downstream consumers:** the week's postings cast a series part only while a season is made (src/engine/systems/projobs.ts:522); a casting closed (src/engine/systems/series.ts:217); work called off, its days worked still paid (src/engine/systems/series.ts:221); the option lapses with the series (src/engine/systems/series.ts:226); the contract's fold says the series' word so far (src/ui/career/WorkPane.tsx:280); revived, the producers' word on the player's characters set (src/engine/systems/series.ts:358)
- **Timed events:** Measured when the season finishes.
- **Exit and recovery:** None.
- **Save and load:** The professional record (`person.pro`: each engagement's `contract`, `allowances` and payments, and `residuals`) and the calendar's pending `pro.*` items are in the save; every handler reads its record's own state (a status, a key, a paid settlement) before acting, so a load runs nothing twice; the series' seasons are worked out from the seed, so a reload decides them the same. Held across a save and a load at each stage by tests/career-contracts.test.ts.
- **Tests and evidence:** `tests/b27-audience.test.ts`, `tests/career-contracts.test.ts`

## 37. Long-Term Project History

**Status:** Implemented And Verified

- **Code (features):** `ui.career-reference`
- **Entry:** Two long careers (four and four and a half years) walked on the built app at three sizes (emulation, not a physical phone): each project page opened, its company and Back. / Career, Productions And People (src/ui/career/ReferencePane.tsx); a role's Open Its Page on the Opportunities tab opens a project's page there.
- **Decisions:** Look up any project the career touched.
- **States and transitions:** A credit kept for good; a posting, the work and its pay kept while anything to come still reads them, past the 40 latest postings and 20 latest finished engagements (keepBounded); a page reads what the record holds.
- **Immediate effects:** Nothing in the world: a page opens, and the trail of pages followed is kept while the player is elsewhere, never in the save. Its actions turn the Career screen to the tab where the player can act.
- **Downstream consumers:** none named
- **Timed events:** None.
- **Exit and recovery:** A page no longer held says so.
- **Save and load:** Nothing of its own: every page is read from the save as it stands, and the trail isn't saved.
- **Tests and evidence:** `tests/b27-reference.test.ts`, `tests/pro-core.test.ts`, `docs/verification/career-universe-2026-10-24/walk/k8`, `docs/verification/career-universe-2026-10-24/long`

## 38. Renewal Decision

**Status:** Implemented And Verified

- **Code (features):** `pro.series`
- **Entry:** The clock, at the first stop after each May 15 from 2030 (`onPassage`): the network's word on The Calloway Files, as a notice and on the Work tab.
- **Decisions:** None: the network decides.
- **States and transitions:** Renewed or canceled, reading the last season’s audience, reviews and age.
- **Immediate effects:** Canceled: castings in it closed as withdrawn, work booked for days not yet done called off with nothing owed, an option on its next season lapsed once; renewed or revived: nothing booked, the player told where they've worked in it, an open option's contract noting it; revived, from 2026-10-25 (brief 27's loop 41), its producers' word on each character the player played set for before the new season (`pro.revival`).
- **Downstream consumers:** the week's postings cast a series part only while a season is made (src/engine/systems/projobs.ts:522); a casting closed (src/engine/systems/series.ts:217); work called off, its days worked still paid (src/engine/systems/series.ts:221); the option lapses with the series (src/engine/systems/series.ts:226); the contract's fold says the series' word so far (src/ui/career/WorkPane.tsx:280); revived, the producers' word on the player's characters set (src/engine/systems/series.ts:358)
- **Timed events:** Each May’s word.
- **Exit and recovery:** A canceled series may be revived.
- **Save and load:** The professional record (`person.pro`: each engagement's `contract`, `allowances` and payments, and `residuals`) and the calendar's pending `pro.*` items are in the save; every handler reads its record's own state (a status, a key, a paid settlement) before acting, so a load runs nothing twice; the series' seasons are worked out from the seed, so a reload decides them the same. Held across a save and a load at each stage by tests/career-contracts.test.ts.
- **Tests and evidence:** `tests/b27-audience.test.ts`, `tests/career-contracts.test.ts`

## 39. Returning Player

**Status:** Implemented And Verified

- **Code (features):** `pro.invite`, `pro.series`
- **Entry:** The clock, 240 days after an anthology's wrap whose work was judged Strong or better (`INVITE_KIND`). / The clock, at the first stop after each May 15 from 2030 (`onPassage`): the network's word on The Calloway Files, as a notice and on the Work tab.
- **Decisions:** Accept the invitation back.
- **States and transitions:** A recurring part optioned, invited, returning.
- **Immediate effects:** The next story's part posted to the player and offered at once, without an audition; a line in the opportunity's history. / Canceled: castings in it closed as withdrawn, work booked for days not yet done called off with nothing owed, an option on its next season lapsed once; renewed or revived: nothing booked, the player told where they've worked in it, an open option's contract noting it; revived, from 2026-10-25 (brief 27's loop 41), its producers' word on each character the player played set for before the new season (`pro.revival`).
- **Downstream consumers:** the part posted and offered (src/engine/systems/projobs.ts:1851); the offer's line says why (src/engine/systems/projobs.ts:1854); the week's postings cast a series part only while a season is made (src/engine/systems/projobs.ts:522); a casting closed (src/engine/systems/series.ts:217); work called off, its days worked still paid (src/engine/systems/series.ts:221); the option lapses with the series (src/engine/systems/series.ts:226); the contract's fold says the series' word so far (src/ui/career/WorkPane.tsx:280); revived, the producers' word on the player's characters set (src/engine/systems/series.ts:358)
- **Timed events:** The option’s day; the next season’s casting.
- **Exit and recovery:** Renewal never rebooks automatically.
- **Save and load:** The professional record (`person.pro`: each engagement's `units`, `reports`, `choices`, `script` and `loop`, and `person.health.voice`) and the calendar's pending `pro.*` items are in the save; every handler reads its record's own state (a day reported, a page drawn, a loop's status, an engagement for the next story) before acting, so a load runs nothing twice; every draw is keyed by the work, never by an id, so a reload decides it the same. Held across a save and a load at each stage by tests/career-workflows.test.ts and tests/career-workflows-screen.test.ts. / The professional record (`person.pro`: each engagement's `contract`, `allowances` and payments, and `residuals`) and the calendar's pending `pro.*` items are in the save; every handler reads its record's own state (a status, a key, a paid settlement) before acting, so a load runs nothing twice; the series' seasons are worked out from the seed, so a reload decides them the same. Held across a save and a load at each stage by tests/career-contracts.test.ts.
- **Tests and evidence:** `tests/b27-revival.test.ts`, `tests/career-contracts.test.ts`, `tests/career-workflows.test.ts`, `tests/career-workflows-screen.test.ts`

## 40. New Character On An Existing Series

**Status:** Implemented And Verified

- **Code (features):** `pro.revival`, `pro.postings`
- **Entry:** A revived series' producers' word on each character the player played in it, set by the network's word bringing it back, for a week into the new season less a posting's lead (`revivalCastAt`), never before the word. / The clock, every Monday at nine it passes (`onPassage`): the Opportunities tab's Open Calls and Through An Agent.
- **Decisions:** Whether to go for a new part in a series already on.
- **States and transitions:** A revival’s character plans; a new part posted.
- **Immediate effects:** Wanted back: the part posted and offered without an audition, its days in the new season, the playing ages not read again; accepted, a new engagement under a new contract, the old one as it was. Not wanted: said, and the part not posted to the actor in that season. The engagement keeps the word (`revival`); a line in its history and a notice either way. / Each part drawn posted (from brief 20, a part posted again says it's a new casting and what came of the last time); windows passed closed as lapsed; the agent tries his submissions.
- **Downstream consumers:** the network's word schedules it and says when it comes (src/engine/systems/series.ts:358); the word kept on the old engagement (src/engine/systems/series.ts:382); wanted back, offered without an audition (src/engine/systems/projobs.ts:2232); a returning character's playing ages not read (src/engine/systems/projobs.ts:1107); the part not posted again in that season (src/engine/systems/projobs.ts:746); Submit Yourself reads the posting (src/engine/systems/projobs.ts:752); the agent submits where it suits (src/engine/systems/projobs.ts:978); the card says what came of the last time (from brief 20) (src/ui/career/OpportunitiesPane.tsx:71)
- **Timed events:** The revival’s casting week.
- **Exit and recovery:** None.
- **Save and load:** The professional record (`person.pro`: each engagement's `revival`, the opportunity's `direct`) and the calendar's pending `pro.*` items are in the save; the word reads the engagement's own `revival` before acting, and the draw is keyed by the series, the season and the part, never by an id, so a reload decides it the same. / The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts. The last posting of each part is kept past the record's bounds (`lastPosted`).
- **Tests and evidence:** `tests/b27-revival.test.ts`, `tests/pro-work.test.ts`, `tests/b20-career-history.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b20-career-effects.test.ts`

## 41. Cancellation And Possible Revival

**Status:** Implemented And Verified

- **Code (features):** `pro.series`, `pro.revival`
- **Entry:** The clock, at the first stop after each May 15 from 2030 (`onPassage`): the network's word on The Calloway Files, as a notice and on the Work tab. / A revived series' producers' word on each character the player played in it, set by the network's word bringing it back, for a week into the new season less a posting's lead (`revivalCastAt`), never before the word.
- **Decisions:** None.
- **States and transitions:** Canceled, future work called off with pay settled; revived years on.
- **Immediate effects:** Canceled: castings in it closed as withdrawn, work booked for days not yet done called off with nothing owed, an option on its next season lapsed once; renewed or revived: nothing booked, the player told where they've worked in it, an open option's contract noting it; revived, from 2026-10-25 (brief 27's loop 41), its producers' word on each character the player played set for before the new season (`pro.revival`). / Wanted back: the part posted and offered without an audition, its days in the new season, the playing ages not read again; accepted, a new engagement under a new contract, the old one as it was. Not wanted: said, and the part not posted to the actor in that season. The engagement keeps the word (`revival`); a line in its history and a notice either way.
- **Downstream consumers:** the week's postings cast a series part only while a season is made (src/engine/systems/projobs.ts:522); a casting closed (src/engine/systems/series.ts:217); work called off, its days worked still paid (src/engine/systems/series.ts:221); the option lapses with the series (src/engine/systems/series.ts:226); the contract's fold says the series' word so far (src/ui/career/WorkPane.tsx:280); revived, the producers' word on the player's characters set (src/engine/systems/series.ts:358); the network's word schedules it and says when it comes (src/engine/systems/series.ts:358); the word kept on the old engagement (src/engine/systems/series.ts:382); wanted back, offered without an audition (src/engine/systems/projobs.ts:2232); a returning character's playing ages not read (src/engine/systems/projobs.ts:1107); the part not posted again in that season (src/engine/systems/projobs.ts:746)
- **Timed events:** Each May’s word.
- **Exit and recovery:** A revival brings the character back by its draw.
- **Save and load:** The professional record (`person.pro`: each engagement's `contract`, `allowances` and payments, and `residuals`) and the calendar's pending `pro.*` items are in the save; every handler reads its record's own state (a status, a key, a paid settlement) before acting, so a load runs nothing twice; the series' seasons are worked out from the seed, so a reload decides them the same. Held across a save and a load at each stage by tests/career-contracts.test.ts. / The professional record (`person.pro`: each engagement's `revival`, the opportunity's `direct`) and the calendar's pending `pro.*` items are in the save; the word reads the engagement's own `revival` before acting, and the draw is keyed by the series, the season and the part, never by an id, so a reload decides it the same.
- **Tests and evidence:** `tests/b27-revival.test.ts`, `tests/career-contracts.test.ts`

## 42. Festival Submission And Selection

**Status:** Implemented And Verified

- **Code (features):** `pro.awards`
- **Entry:** The clock, at every stop (`onPassage`): each television credit's Emmy year and each film's Sundance year, step by step.
- **Decisions:** None: the production submits.
- **States and transitions:** Not submitted, submitted, selected, not selected, screened.
- **Immediate effects:** At the deadline, the production's entry or not; at the nominations, one field for each category with every entry of the player's in it (`you:<credit>`, from 2026-10-25) and the nominees; at the final round's end, the winner; at the ceremony, won or lost; a disqualification where the work no longer meets the rules; the festival's submission, its word and the screening; notices for each.
- **Downstream consumers:** an entry whose work no longer meets the rules is disqualified (src/engine/systems/awards.ts:491); the winner settled at the final round's end (src/engine/systems/awards.ts:541); the result given at the ceremony (src/engine/systems/awards.ts:543); the production submits its film (src/engine/systems/awards.ts:557); the festival selects it or doesn't (src/engine/systems/awards.ts:564); casting reads the recognition it leaves (src/engine/systems/projobs.ts:2563); the Portfolio keeps what was recognized (src/ui/workspaces/CareerWorkspace.tsx:143)
- **Timed events:** The festival’s answer; the screening.
- **Exit and recovery:** None.
- **Save and load:** The professional record (`person.pro`: `awards`, one entry for each performance and Emmy year with its field, nominees, winner and ceremony; `festivals`; each credit's `run`) is in the save; every step reads its record's own state before acting (an entry's field drawn, its winner settled, a festival's word given), so a load runs nothing twice; every draw is keyed by the year, the category or the work, never by an id, so a reload decides it the same. Held across a save and a load at each stage by tests/career-awards.test.ts and tests/career-awards-screen.test.ts.
- **Tests and evidence:** `tests/career-awards.test.ts`, `tests/career-awards-screen.test.ts`

## 43. Festival Attendance

**Status:** Not Implemented. Not built: going could change only the people met there, which the game keeps no record of beyond an agent’s meetings, and the loop forbids a boost merely for appearing; a choice nothing read would be a declared word (README, K7).

- **Code (features):** none of its own
- **Entry:** —
- **Decisions:** None offered.
- **States and transitions:** A selected film screens whether or not the actor goes.
- **Immediate effects:** —
- **Downstream consumers:** none named
- **Timed events:** The screening.
- **Exit and recovery:** None.
- **Save and load:** —
- **Tests and evidence:** `docs/verification/career-universe-2026-10-24/README.md`

## 44. Award Eligibility And Submission

**Status:** Implemented And Verified

- **Code (features):** `pro.award_enter`, `pro.actor_submit`
- **Entry:** Career, Charts And Awards: Your Recognition, Enter Yourself under each television part eligible and not entered, grayed with entryRefusal's words. / Career, Charts And Awards, Your Recognition, The Actor Awards: Submit Yourself on an eligible credit while submissions are open.
- **Decisions:** Enter yourself for an Emmy; submit yourself for the Actor Awards.
- **States and transitions:** Eligible or refused with the rule’s words; entered or submitted, by you or the production.
- **Immediate effects:** The fee spent from the bank (`spend`, `career`); an entry kept on the record, entered by you, in its category and year. / A submission on the record (`guild`), the fee paid from the bank and on the ledger; refused, the reason said.
- **Downstream consumers:** the fee paid from the bank (src/engine/systems/awards.ts:260); the nominations read only an entered performance (src/engine/systems/awards.ts:507); the field is drawn and the nominations made for it (src/engine/systems/awards.ts:517); Your Recognition says where it stands (src/ui/career/IndustryPane.tsx:101); the nominations read the submission (src/engine/systems/actorawards.ts:285); the fee paid (src/engine/systems/actorawards.ts:200)
- **Timed events:** The entry deadline; the submission window.
- **Exit and recovery:** After the deadline nobody can enter.
- **Save and load:** The professional record (`person.pro`: `awards`, one entry for each performance and Emmy year with its field, nominees, winner and ceremony; `festivals`; each credit's `run`) is in the save; every step reads its record's own state before acting (an entry's field drawn, its winner settled, a festival's word given), so a load runs nothing twice; every draw is keyed by the year, the category or the work, never by an id, so a reload decides it the same. Held across a save and a load at each stage by tests/career-awards.test.ts and tests/career-awards-screen.test.ts. / The professional record (`person.pro`: `guild`, each nomination's `attend`, `trips`) and the calendar's pending `pro.*` items are in the save; each step reads its record's own state before acting, and every draw is keyed by the competition, the year and the performance, never by an id, so a reload decides it the same.
- **Tests and evidence:** `tests/career-awards.test.ts`, `tests/b27-actor-awards.test.ts`, `tests/career-awards-screen.test.ts`

## 45. Nomination And Voting

**Status:** Implemented And Verified

- **Code (features):** `pro.awards`, `pro.actor_awards`
- **Entry:** The clock, at every stop (`onPassage`): each television credit's Emmy year and each film's Sundance year, step by step. / The clock, at each stop (`onPassage`): the Actor Awards' production submissions at the window's close, the nominations, the final round and the show.
- **Decisions:** None: the voters decide.
- **States and transitions:** Nominated or not; won or lost at the final round, told at the ceremony.
- **Immediate effects:** At the deadline, the production's entry or not; at the nominations, one field for each category with every entry of the player's in it (`you:<credit>`, from 2026-10-25) and the nominees; at the final round's end, the winner; at the ceremony, won or lost; a disqualification where the work no longer meets the rules; the festival's submission, its word and the screening; notices for each. / A production's submission or its absence; nominations, every performance of the player's in a category together; winners; the result at the show; a returned submission whose work no longer meets the rules.
- **Downstream consumers:** an entry whose work no longer meets the rules is disqualified (src/engine/systems/awards.ts:491); the winner settled at the final round's end (src/engine/systems/awards.ts:541); the result given at the ceremony (src/engine/systems/awards.ts:543); the production submits its film (src/engine/systems/awards.ts:557); the festival selects it or doesn't (src/engine/systems/awards.ts:564); casting reads the recognition it leaves (src/engine/systems/projobs.ts:2563); the Portfolio keeps what was recognized (src/ui/workspaces/CareerWorkspace.tsx:143); a nomination counts toward visibility (src/engine/systems/awards.ts:654); on the résumé's lines (src/engine/systems/pro.ts:1131); the nominee invited to the show (src/engine/systems/actorawards.ts:311)
- **Timed events:** The nominations; the final round.
- **Exit and recovery:** None.
- **Save and load:** The professional record (`person.pro`: `awards`, one entry for each performance and Emmy year with its field, nominees, winner and ceremony; `festivals`; each credit's `run`) is in the save; every step reads its record's own state before acting (an entry's field drawn, its winner settled, a festival's word given), so a load runs nothing twice; every draw is keyed by the year, the category or the work, never by an id, so a reload decides it the same. Held across a save and a load at each stage by tests/career-awards.test.ts and tests/career-awards-screen.test.ts. / The professional record (`person.pro`: `guild`, each nomination's `attend`, `trips`) and the calendar's pending `pro.*` items are in the save; each step reads its record's own state before acting, and every draw is keyed by the competition, the year and the performance, never by an id, so a reload decides it the same.
- **Tests and evidence:** `tests/b27-actor-awards.test.ts`, `tests/career-awards.test.ts`, `tests/career-awards-screen.test.ts`
- **Not built, said why:** The player’s own ballot as a member: one vote among the membership’s is a vote the simulated field can’t weigh (README, K7).

## 46. Ceremony

**Status:** Implemented, Verification Incomplete. Not yet played in the built app or on a phone; brief 27’s F plays it.

- **Code (features):** `pro.ceremony_rsvp`, `pro.ceremony_prepare`, `pro.ceremony`, `pro.ceremony_speech`, `pro.ceremony_accept`, `pro.watch_ceremony`
- **Entry:** The invitation's question, or Your Recognition: Go To The Ceremony or Watch From Home, on a nomination, by a week before the show. / Your Recognition: Prepare Your Remarks, an hour at a time, on a show the player is going to. / The show's hour in Los Angeles, for a nominee going (`CEREMONY_KIND`). / The moment to go up, a minute into the show for a winner in the room (`SPEECH_KIND`), a stop with its choice Go Up And Accept. / The moment to go up, a stop a minute into the show for a winner in the room: its choice Go Up And Accept; or the button on Your Recognition then. / Career, Charts And Awards: Your Recognition, Watch The Ceremony under a nominated Emmy entry and Watch The Show under an Actor Awards one, grayed with watchRefusal's words until the award is presented. From 2026-10-25 (brief 27's K7) its handler is the ceremony's (`systems/ceremony.ts`), read for either competition.
- **Decisions:** Go or watch from home; prepare remarks; go up to accept.
- **States and transitions:** Invited, going or watching; the show; a win accepted with a speech, unanswered, or without the actor.
- **Immediate effects:** Going: the trip booked as a work trip's legs are, the show's call on the clock, the answer kept, for every nomination of the player's at that show at once (from brief 27's F: one show, one trip, one answer). Not going: what going booked called off, for them all. / The remarks 35% further of the way left, for every nomination of the player's the show will be there for, and an hour on the clock. / Every nomination of the player's at the show, in the room or not by the one trip; a loss told in the room, adding nothing; each win sets its moment to go up, a minute apart; absent, a win accepted without them. / Gone on past: a thank you and a seat, no speech judged. / The speech given and judged into a band; a Strong one or better counts toward visibility; a notice says how it went. / Nothing of the result: the day it was watched (`watchedAt`), and the ceremony's lines shown.
- **Downstream consumers:** the trip booked (src/engine/systems/ceremony.ts:198); the show's call (src/engine/systems/ceremony.ts:200); the trip's days held against another offer (src/engine/systems/projobs.ts:1099); the speech reads the remarks (src/engine/systems/ceremony.ts:242); the moment to go up set (src/engine/systems/ceremony.ts:342); absent, said (src/engine/systems/ceremony.ts:331); the moment let pass (src/engine/systems/ceremony.ts:351); a strong speech counts toward visibility (src/engine/systems/awards.ts:657); the ceremony's lines say it (src/engine/systems/ceremony.ts:307); the ceremony's lines, read from the settled result (src/engine/systems/ceremony.ts:375); the entry keeps the day it was watched (src/engine/systems/ceremony.ts:374); Your Recognition shows the lines once watched (src/ui/career/IndustryPane.tsx:126)
- **Timed events:** The answer’s day, the trip, the show, the moment to go up.
- **Exit and recovery:** A missed flight: the win accepted without them.
- **Save and load:** The professional record (`person.pro`: `guild`, each nomination's `attend`, `trips`) and the calendar's pending `pro.*` items are in the save; each step reads its record's own state before acting, and every draw is keyed by the competition, the year and the performance, never by an id, so a reload decides it the same. / The professional record (`person.pro`: `awards`, one entry for each performance and Emmy year with its field, nominees, winner and ceremony; `festivals`; each credit's `run`) is in the save; every step reads its record's own state before acting (an entry's field drawn, its winner settled, a festival's word given), so a load runs nothing twice; every draw is keyed by the year, the category or the work, never by an id, so a reload decides it the same. Held across a save and a load at each stage by tests/career-awards.test.ts and tests/career-awards-screen.test.ts.
- **Tests and evidence:** `tests/b27-ceremony.test.ts`, `tests/career-awards-screen.test.ts`, `tests/career-awards.test.ts`

## 47. Post-Award Career Effects

**Status:** Implemented And Verified

- **Code (features):** `pro.awards`
- **Entry:** The clock, at every stop (`onPassage`): each television credit's Emmy year and each film's Sundance year, step by step.
- **Decisions:** None.
- **States and transitions:** Recognition fades over three years; an agent reads it once; an ask reads visibility.
- **Immediate effects:** At the deadline, the production's entry or not; at the nominations, one field for each category with every entry of the player's in it (`you:<credit>`, from 2026-10-25) and the nominees; at the final round's end, the winner; at the ceremony, won or lost; a disqualification where the work no longer meets the rules; the festival's submission, its word and the screening; notices for each.
- **Downstream consumers:** an entry whose work no longer meets the rules is disqualified (src/engine/systems/awards.ts:491); the winner settled at the final round's end (src/engine/systems/awards.ts:541); the result given at the ceremony (src/engine/systems/awards.ts:543); the production submits its film (src/engine/systems/awards.ts:557); the festival selects it or doesn't (src/engine/systems/awards.ts:564); casting reads the recognition it leaves (src/engine/systems/projobs.ts:2563); the Portfolio keeps what was recognized (src/ui/workspaces/CareerWorkspace.tsx:143)
- **Timed events:** The fade.
- **Exit and recovery:** Nothing stacks for the same award.
- **Save and load:** The professional record (`person.pro`: `awards`, one entry for each performance and Emmy year with its field, nominees, winner and ceremony; `festivals`; each credit's `run`) is in the save; every step reads its record's own state before acting (an entry's field drawn, its winner settled, a festival's word given), so a load runs nothing twice; every draw is keyed by the year, the category or the work, never by an id, so a reload decides it the same. Held across a save and a load at each stage by tests/career-awards.test.ts and tests/career-awards-screen.test.ts.
- **Tests and evidence:** `tests/b27-award-effects.test.ts`, `tests/career-awards.test.ts`, `tests/career-awards-screen.test.ts`

## 48. Interactive Industry Reference

**Status:** Implemented And Verified

- **Code (features):** `ui.career-reference`
- **Entry:** Walked on the built app at three sizes from two long careers (emulation, not a physical phone): the front page, a project, its company and Back, an action and the same page on return, a series, season and episode, Find. / Career, Productions And People (src/ui/career/ReferencePane.tsx); a role's Open Its Page on the Opportunities tab opens a project's page there.
- **Decisions:** Which page to open, and where to go to act.
- **States and transitions:** A page held or not for this player; the trail of pages followed.
- **Immediate effects:** Nothing in the world: a page opens, and the trail of pages followed is kept while the player is elsewhere, never in the save. Its actions turn the Career screen to the tab where the player can act.
- **Downstream consumers:** none named
- **Timed events:** None: pages read the clock.
- **Exit and recovery:** Back and the trail; a page no longer held says so.
- **Save and load:** Nothing of its own: every page is read from the save as it stands, and the trail isn't saved.
- **Tests and evidence:** `tests/b27-reference.test.ts`, `docs/verification/career-universe-2026-10-24/walk/k8`

## 49. Actionable Mail And Notices

**Status:** Implemented And Verified

- **Code (features):** `world.take_decision_action`, `world.dismiss_decision`, `world.mark_read`
- **Entry:** Home, What Needs You: each answer’s button on a question, labeled with the answer (src/ui/screens/Home.tsx), which sends that answer’s index. / Home, What Needs You: Dismiss on each question the panel draws (src/ui/screens/Home.tsx, the six at the top, every one with Show All). / Home, Recent Updates: Mark N Read in its head, and Mark Read beside each notice (src/ui/screens/Home.tsx); Updates: Mark N Read for the notices the filter shows, and Mark Read on each row (src/ui/screens/Updates.tsx).
- **Decisions:** Answer a decision; read a notice.
- **States and transitions:** A decision open, answered, expired once; a notice read.
- **Immediate effects:** Runs the answer’s command inside the same transaction, then sets resolvedAt; a refusal rolls back the whole and leaves the question open. / Sets dismissedAt to now. Nothing else: what the question was about still stands. / Sets read on every unread notice (or on the ids given, which no control sends); answers how many.
- **Downstream consumers:** the answer’s own command, run as the player’s: pro.accept_offer, pro.decline_offer, tax.file, bank.reactivate, documents.apply_opt (src/engine/world/world.ts:64); openDecisions leaves a settled question off Home (src/engine/world/world.ts:164); its own refusal of a question already settled (src/engine/world/world.ts:56); prune forgets it 180 days after it closed (src/engine/world/world.ts:144); the decision’s look says it was dealt with (src/ui/looks/attention.tsx:172); openDecisions leaves a dismissed question off Home and out of the count (src/engine/world/world.ts:164); take_decision_action refuses an answer to a dismissed question (src/engine/world/world.ts:57); the decision’s own look says it was dismissed, and its date (src/ui/looks/attention.tsx:173); the rail’s count of what’s waiting (src/ui/shell/GameShell.tsx:47); unreadNotifications: Home’s list and Mark N Read’s count leave a read notice out (src/engine/world/world.ts:177); Recent Updates’ subtitle and Mark N Read’s count on Home, and Updates’ Unread (N) and All (N) (src/ui/screens/Updates.tsx:96-99); until 2026-10-23 (brief 23) the rail’s count and the You line’s N Unread (src/ui/screens/Home.tsx:282); notify brings a notice said again up to now only while it’s unread; read, the same words are a new notice (src/engine/core/simulation.ts:698); settleNotices dedupes only the unread (src/engine/core/simulation.ts:729); the notice’s own look says it has been read (src/ui/looks/attention.tsx:347)
- **Timed events:** A decision’s due date.
- **Exit and recovery:** Expiry closes it once; reading never accepts an offer.
- **Save and load:** resolvedAt is saved; after a load the question stays settled and its answers refused (tests/b20-guide-screens.test.ts). / dismissedAt is saved with the question; after a load it stays off Home and its answers stay refused (tests/b20-guide-screens.test.ts). / Each notice’s read flag is saved; after a load every notice read stays read and none comes back unread, through a day’s play on (tests/b20-guide-screens.test.ts).
- **Tests and evidence:** `tests/notices-rollback.test.ts`, `tests/b20-guide-screens.test.ts`, `tests/b20-guide-wiring.test.ts`, `tests/evidence-g02-life.test.ts`, `tests/life-fixes.test.ts`, `tests/evidence2-b01.test.ts`, `tests/guide-examples-start-day-body.test.ts`, `tests/b20-guide-chapters.test.ts`, `tests/b20-guide-firsts.test.ts`

## 50. Ongoing Opportunity And Relationship Loop

**Status:** Implemented And Verified

- **Code (features):** `pro.postings`, `pro.agent_follow_up`
- **Entry:** The clock, every Monday at nine it passes (`onPassage`): the Opportunities tab's Open Calls and Through An Agent. / The clock, three days after the showcase's last performance (`FOLLOW_UP_KIND`), put on by the showcase.
- **Decisions:** Keep submitting; keep the agent relationship.
- **States and transitions:** Weekly postings; an agent’s follow-ups and referrals.
- **Immediate effects:** Each part drawn posted (from brief 20, a part posted again says it's a new casting and what came of the last time); windows passed closed as lapsed; the agent tries his submissions. / The follow-up recorded; for each agent the relation introduced through the School, the notice read, and a request to meet passed on or not.
- **Downstream consumers:** Submit Yourself reads the posting (src/engine/systems/projobs.ts:752); the agent submits where it suits (src/engine/systems/projobs.ts:978); the card says what came of the last time (from brief 20) (src/ui/career/OpportunitiesPane.tsx:71); a send answering the request is answered in a week with a meeting (src/engine/systems/proagent.ts:583); the showcase is work his office has to go on (src/engine/systems/proagent.ts:237)
- **Timed events:** Mondays; the office’s follow-ups.
- **Exit and recovery:** Cooldowns end with something new.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts. The last posting of each part is kept past the record's bounds (`lastPosted`). / The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts.
- **Tests and evidence:** `tests/b27-slate.test.ts`, `tests/journey-agent.test.ts`, `tests/pro-work.test.ts`, `tests/b20-career-history.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b20-career-effects.test.ts`, `tests/pro-agent.test.ts`, `tests/journey-career.test.ts`, `tests/journey-career-older.test.ts`, `tests/b20-career-saveload.test.ts`

## 51. Persistent State And Event Order

**Status:** Implemented And Verified

- **Code (features):** `world.tick`, `calendar.schedule`
- **Entry:** The clock, every two days (armed by armWorldClock). / Calendar screen: a day, Put Something On It, the plan form’s Put It On (CalendarWorkspace.tsx PlanForm’s put, run('calendar.schedule')).
- **Decisions:** None.
- **States and transitions:** Every pending item in the save; each step reads its record before acting.
- **Immediate effects:** A question past its date is closed (resolvedAt); closed questions and old done items are pruned. / A life.commitment item on the timeline: requiresPlayer, its length, its town.
- **Downstream consumers:** a question past its date is closed (src/engine/world/world.ts:134); What Needs You lists open questions only (src/engine/world/world.ts:162); done items past 400 days go (src/engine/world/world.ts:140); the clock stops at it, for every way of moving it from a screen (src/engine/core/simulation.ts:441); Look After Yourself refuses what would run into it (src/engine/systems/life.ts:657); practice refuses an hour that would run into it (src/engine/systems/life.ts:584); a Sleep over it names it and misses it (src/engine/systems/life.ts:396); the calendar flags a clash with anything else wanting the player (src/engine/world/calendar.ts:129); at its start, another commitment kept and still running settles the clash (from 2026-10-21) (src/engine/world/plans.ts:148)
- **Timed events:** The clock.
- **Exit and recovery:** A reload decides the same.
- **Save and load:** The next tick is a timeline item; what it closed and pruned stays so after a reload (evidence-g04-life). / A timeline item in universe.scheduled; a reload keeps it and its handler (plans.test: comes back off a reload with its handler still attached).
- **Tests and evidence:** `tests/b26-persistence-repeats.test.ts`, `tests/persistence.test.ts`, `tests/evidence-g04-life.test.ts`, `tests/decisions-2026-10-14.test.ts`, `tests/evidence2-b01.test.ts`, `tests/evidence-g01-life.test.ts`, `tests/b20-life-time.test.ts`, `tests/b20-life-bite.test.ts`, `tests/plans.test.ts`

## 52. Meaningful Variation

**Status:** Implemented And Verified

- **Code (features):** `pro.postings`
- **Entry:** The clock, every Monday at nine it passes (`onPassage`): the Opportunities tab's Open Calls and Through An Agent.
- **Decisions:** None.
- **States and transitions:** The slate’s work by market, kind and season, every draw keyed by what it decides.
- **Immediate effects:** Each part drawn posted (from brief 20, a part posted again says it's a new casting and what came of the last time); windows passed closed as lapsed; the agent tries his submissions.
- **Downstream consumers:** Submit Yourself reads the posting (src/engine/systems/projobs.ts:752); the agent submits where it suits (src/engine/systems/projobs.ts:978); the card says what came of the last time (from brief 20) (src/ui/career/OpportunitiesPane.tsx:71)
- **Timed events:** Each week.
- **Exit and recovery:** None.
- **Save and load:** The professional record (`person.pro`) and the calendar's pending `pro.*` items are in the save; every handler reads the record's own state (a status, a key, a guard) before acting, so a load runs nothing twice and drops nothing. Held to the byte across a save and a load before each step of a part and of an approach by tests/b20-career-saveload.test.ts. The last posting of each part is kept past the record's bounds (`lastPosted`).
- **Tests and evidence:** `tests/b27-slate.test.ts`, `tests/journey-three-students.test.ts`, `tests/pro-work.test.ts`, `tests/b20-career-history.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b20-career-effects.test.ts`

## 53. Transparency And Player Understanding

**Status:** Implemented And Verified

- **Code (features):** `ui.career-reasons`, `tutorial.read`
- **Entry:** Career, Representation: Show The Reasons under Why It Went This Way (src/ui/career/RepresentationPane.tsx). / The guide: I’ve Read It at the foot of the chapter that’s next (ui/guide/Guide.tsx, `markRead`), opened by Guide in the top bar, Read on the strip under it, or Read About It on a locked panel.
- **Decisions:** Read why it went as it did; read the guide.
- **States and transitions:** Reasons kept per decision; chapters read.
- **Immediate effects:** Nothing: it shows and hides; kept while the player is elsewhere, never in the save. / Adds the chapter to universe.tutorial.read, and sets tutorial.finished once every chapter is read. Moves no clock and costs nothing; the guide holds the live clock while it’s open (`hold`).
- **Downstream consumers:** isOpen: a part of the game is open once its chapter is read, or the guide is finished (src/engine/world/tutorial.ts:51); the engine’s guard: a command whose chapter isn’t read is refused, naming the chapter (lockedBecause) (src/engine/world/tutorial.ts:100); useFeature, behind every Gated button, locked panel and menu (src/ui/guide/Guide.tsx:44); the rail lists a place once its chapter is read (src/ui/shell/GameShell.tsx:50); an underlined word opens once its look’s chapter is read (src/ui/looks/Look.tsx:87); a screen opened by address is locked until its chapter is read (src/ui/workspaces/WorkspaceRouter.tsx:34); the strip under the bar and Guide (N Left) count what’s left (src/ui/guide/Guide.tsx:140)
- **Timed events:** None.
- **Exit and recovery:** None.
- **Save and load:** Nothing of its own. / universe.tutorial (read, finished) is saved; a load keeps what was read and what it opened, and nothing is read again (tests/tutorial.test.ts, “keeps what was read through a save”).
- **Tests and evidence:** `tests/b20-guide-chapters.test.ts`, `tests/guide.test.ts`, `tests/pro-representation-screen.test.ts`, `tests/journey-agent.test.ts`, `tests/b20-guide-screens.test.ts`, `tests/b20-guide-promises.test.ts`, `tests/tutorial.test.ts`

## 54. Research And Accuracy

**Status:** Implemented And Verified

- **Code (features):** none of its own
- **Entry:** —
- **Decisions:** None.
- **States and transitions:** Every real fact sourced and dated in the register; what wasn’t read said unread.
- **Immediate effects:** —
- **Downstream consumers:** none named
- **Timed events:** None.
- **Exit and recovery:** None.
- **Save and load:** —
- **Tests and evidence:** `tests/b27-research-register.test.ts`, `tests/career-catalog.test.ts`, `docs/verification/career-universe-2026-10-24/research/REGISTER.md`

## 55. Coverage And Verification

**Status:** Implemented, Verification Incomplete. The final runs and the long careers are played again in F.

- **Code (features):** none of its own
- **Entry:** —
- **Decisions:** None.
- **States and transitions:** This matrix, the effects matrix, the sweep’s register, the completion matrix.
- **Immediate effects:** —
- **Downstream consumers:** none named
- **Timed events:** None.
- **Exit and recovery:** None.
- **Save and load:** —
- **Tests and evidence:** `docs/verification/audit-2026-10-21/EFFECTS.md`, `docs/verification/sweep-2026-10-24/REGISTER.md`

## 56. Execution And Completion

**Status:** Implemented, Verification Incomplete. F: the final runs, the gate on the finished commit, the receipt and the handoff.

- **Code (features):** none of its own
- **Entry:** —
- **Decisions:** None.
- **States and transitions:** Milestones R to K8 built and pushed; F under way.
- **Immediate effects:** —
- **Downstream consumers:** none named
- **Timed events:** None.
- **Exit and recovery:** None.
- **Save and load:** —
- **Tests and evidence:** `docs/verification/career-universe-2026-10-24/CHECKPOINT.md`
