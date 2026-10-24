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

