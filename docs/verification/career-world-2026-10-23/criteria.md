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
