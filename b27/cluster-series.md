# Your cluster: series, releases and the market

The owner's brief 27 is at `docs/verification/briefs-2026-10-16/27-foundation-limits-and-connected-professional-career-universe.txt`
(read Parts 8, 12 and 13, and the supplement's loops 20, 33 to 41). The build's account: `docs/verification/career-universe-2026-10-24/README.md`,
section "K6: Release, The Charts And A Series' Seasons". The code is mostly `src/engine/systems/series.ts`,
`src/engine/content/series.ts`, `src/engine/systems/slate.ts`, `src/engine/content/slate.ts`, `src/engine/systems/charts.ts`,
`src/engine/content/catalog.ts`, `RELEASE_FATE`/`releaseFate` in `src/engine/systems/projobs.ts`, `bookedClash` in
`projobs.ts`, `src/engine/systems/reference.ts` (Productions And People reads what you add), `src/ui/career/IndustryPane.tsx`.

Build these, each connected to what reads it:

1. **A player's performance matters to a release's and a season's fortunes, without guaranteeing a hit** (Part 12: "A
   strong player performance must matter without guaranteeing a hit."; loop 35 "…including but not limited to the
   player's performance"). Today `simulateRun` in `charts.ts` reads only the kind and a draw (its header says "how well
   the player's part was judged doesn't move it"), and `seasonAudience` in `series.ts` reads no performance. Make both
   read the player's judged band, weighted by the part's size (a lead's matters more than a day player's), bounded so it
   moves the odds and never decides alone (state the weights as ASSUMPTION). Rewrite the header in the past tense. Also,
   for the game's own chart, keep domestic, international and worldwide totals with their currency (Part 12), and a
   simulated critics' and audience response read from the production's quality, the player's part included, labeled
   simulated wherever shown. Falsifiability twin: the same production with a strong and a weak player part.
2. **Release alternatives** (loop 33: "- Different distributor. - Limited release."; Part 12: "- Limited and wider releases.
   … - Territory-specific releases."). `RELEASE_FATE`'s comment quotes them; the code does late, streaming and shelved
   only. Add a limited release (a smaller run in the game's chart), a release by a different distributor (the company
   changes, the date moves, said on the credit and in Productions And People), and a territory-specific release (some
   territories first). Each must change what the chart, the credit's release and the awards eligibility read (Emmys and
   the Actor Awards read release dates and kinds: check `emmyCheck`, `actorCheck`).
3. **Pilots** (Part 8: "- Pilots."). A pilot as a project kind in the slate: shot, then picked up to series or passed on
   by its network (a labeled draw that reads the pilot's own quality, the player's part included); picked up, it becomes
   a series in `series.ts` with the player's character, its option (exists for series parts) taken up or not.
4. **An open option holds the actor's availability** (loop 20: "→ show how it affects availability → a conflicting
   opportunity arrives → evaluate permitted responses"). Today `bookedClash` ignores open options, and a conflicting
   booking just makes the option lapse. Make an open option's season dates a conflict that a new offer's terms must
   reckon with: the player can decline the new work, or take it and lose the option (said before, with what is lost),
   or ask to be released from the option (granted or not).
5. **Guest work leading to a recurring engagement; a recurring character receiving a larger role; a distributor change**
   (Part 13: "- Guest work leading to a recurring engagement. - A recurring character receiving a larger role." and
   "- Revival or a distributor change where plausible."). A strong guest part brings an invitation back as a recurring
   character (reading the band and the season's renewal); a recurring character's part grows (more episodes, a higher
   rate) reading performance and audience; a canceled series picked up by another network or streamer, its company
   changing in the record and in Productions And People.
6. **Real series continued by the simulation, labeled** (Part 13: "Use examples such as 9-1-1 and Slow Horses only with
   verified starting facts. Generated future offers, characters, renewals, and cancellations must belong explicitly to
   the simulation."; loop 40: "Generated roles and future events must be clearly simulated."). The catalog's real series
   (`content/catalog.ts`, e.g. 9-1-1 and Abbott Elementary) have guest parts in imagined seasons and no simulated
   renewals. After their verified baseline, run them through `series.ts` (audience, renewal) with every season after the
   baseline tagged Simulated wherever the player reads it (Productions And People's tags are `systems/reference.ts`'s
   `Known`). Never state an unannounced real season as real (the owner forbids fabricating unannounced productions): the
   simulation's own continuation, said so.

Productions And People (`reference.ts`) must show what you add with the right tags. Every new player choice needs its
refusal words, a control and a guide chapter that opens it.
