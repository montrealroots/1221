# Your cluster: festivals, their juries, going to one, and what comes of it

The owner's brief 27 is at `docs/verification/briefs-2026-10-16/27-foundation-limits-and-connected-professional-career-universe.txt`
(Part 12: "Connect festival decisions to release strategy, expenses, availability, publicity, relationships, and
opportunities where justified."; the supplement's loops 42 and 43; and loop 33 on release). The build's account:
`docs/verification/career-universe-2026-10-24/README.md`, section "K7: Festivals, Awards And The Ceremony", whose "Not
built, said so" paragraph is what you replace: a festival's attendance and the festivals other than Sundance. The code:
`src/engine/content/awards.ts` (`INSTITUTIONS`, and Sundance's rules as the game enforces them), `src/engine/systems/awards.ts`
(Sundance's selection), `releaseFate` and the release alternatives in `src/engine/systems/projobs.ts` and the series cluster's
module (wave 1 added a limited release, a release by another distributor and a territory-first release; read what landed),
`src/engine/systems/worktrip.ts` (`bookCeremonyTrip`, the work trip's legs), `src/engine/systems/ceremony.ts` (the model for
an invitation answered by the player), `src/ui/career/IndustryPane.tsx`, `src/engine/systems/reference.ts`.

**The facts you build from** were read on 2026-10-25 and every quote checked against its download:
`/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27/research-g1/README.md` (section 3, and
section 4's Spirit line on festivals) and `facts.json` beside it. Cite the source id and article where a rule is coded.
What the facts say isn't stated (Cannes' jury size, the Berlinale's 2027 dates, Sundance's named performance prizes) the game
doesn't state: a date nobody published is the game's own, labeled wherever shown, never the festival's. The primary agent
adds the new sources to the register.

Build:

1. **Submission and selection at Cannes, Venice, the Berlinale and IDFA, beside Sundance**, by their read rules: sections,
   premiere status (world, international, European), completion windows, running times, deadlines and fees (paid by the
   producer: the production decides whether to submit, by a labeled draw reading the film's quality and kind; the player
   doesn't submit a film they act in, and the panel says who does). Each festival's bar on another (Cannes: selected in
   another festival's international section, or a Palme d'or or Grand Prix winner; Venice: shown anywhere before, or on
   the web; the Berlinale: shown abroad, at an international festival, on TV or VOD; IDFA: documentaries only, so a fiction
   film is refused with that reason) decides which festivals a film can still go to, and a release by streaming bars the
   ones that bar it. A film's festival path is kept on the production, read by the credit, Productions And People and the
   release.
2. **Juries and prizes, by the names the rules give**: Cannes' Best Actress and Best Actor (one award a film, by
   dispensation an acting award with the Jury Prize or Screenplay); Venice's Coppa Volpi for Best Actress and Best Actor
   and the Marcello Mastroianni Award, and Orizzonti's Best Actress and Best Actor; the Berlinale's Silver Bear for Best
   Leading Performance and for Best Supporting Performance (gender-neutral); Sundance's jury prizes and audience award,
   with no named performance prize (so none for the player's performance). A jury's decision is the game's draw,
   labeled simulated, reading the film's quality and the player's judged part (a lead's more than a day player's, bounded);
   never a real future result. A prize goes on the résumé, the credit and Productions And People, and is read by an
   agent's interest and the direct offers as recognition is read today.
3. **Going to a festival** (loop 43). When a film the player is in is selected, the player is invited to its screening
   (an invitation answered by a command, as `pro.ceremony_rsvp` answers one; due before the festival). Going books the
   trip as the ceremony's trip is booked (held against bookings, refused where it clashes; who pays isn't in the facts, so
   say what the game does and label it, as the ceremony's trip does). At the festival the player can do the film's press
   (hours that cost time and energy; publicity a production asks for, Part 10's "Publicity obligations") and meet people.
   What comes of it must be what those actions do, never a boost for appearing (loop 43 forbids "arbitrary career boosts
   merely for appearing"): the press read by the film's visibility and the release's audience (bounded, labeled), and the
   meetings by representation through the festival introduction the representation cluster built (an `AgentRoute` and an
   exported function in `src/engine/systems/proagent.ts`; find it, call it, test the call). Not going: no press, no
   meetings, the selection and any prize the same. Falsifiability twin: two players in the same selected film, one who goes
   and does the press and meets people, one who stays home.
4. **From a festival to a release** (Part 12's line above; loop 33). A selection, and more a prize, changes the film's way
   out: the release draw (a distribution deal more likely, a limited release that widens), dated after the festival, read
   by the chart. Falsifiability twin: the same film selected or not.
5. **The festivals' rows in `INSTITUTIONS`** rewritten to what was read (their `coverage`, `sources`, `known`); TIFF and
   Annecy stay as they are (not reached), and Busan as read.

Every new command needs refusal words, a gated control (the Industry tab's Awards And Festivals, or the Work tab where the
invitation is answered) and a guide chapter that opens it. No unrestricted lifestyle travel: the trip is for the
festival's screening, booked as work travel.
