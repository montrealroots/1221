# Your cluster: awards beyond the Emmys and the Actor Awards

The owner's brief 27 is at `docs/verification/briefs-2026-10-16/27-foundation-limits-and-connected-professional-career-universe.txt`
(Parts 11 and 12's awards lines, and the supplement's loops 44 to 48). The build's account: `docs/verification/career-universe-2026-10-24/README.md`,
section "K7: Festivals, Awards And The Ceremony". The code: `src/engine/content/awards.ts` (`INSTITUTIONS`, the Emmy editions),
`src/engine/systems/awards.ts` (the Emmys: eligibility, entry, the field `fieldFor`, nominations, the final round, the
recap), `src/engine/systems/actorawards.ts` (the Actor Awards by its 33rd rules: the model to follow for a new engine),
`src/engine/systems/ceremony.ts` (invitation, trip, remarks, the speech), `src/ui/career/IndustryPane.tsx` (Awards And
Festivals), `src/engine/systems/reference.ts`.

**The facts you build from** were read on 2026-10-25 and every quote checked against its download:
`/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27/research-g1/README.md` (sections 1, 2, 4
and 7) and `facts.json` beside it (each fact: source id, quote, where). Cite the source id and section in a comment where a
rule is coded (as `actorawards.ts` cites b27-AA-…). Where the facts say "not stated", the game doesn't state it either: a
date or rule nobody published is the game's own, labeled so wherever the player reads it ("not announced when this was
read; the game holds it on …"), never presented as the organizer's. The primary agent adds the new sources to the research
register; you don't edit it.

Build, each as an engine that decides (the Actor Awards' shape: eligibility read from the player's credits and the
production's release, entry, a field, nominations, a final round, a recap, the résumé, visibility and an agent's interest
reading the outcome, the ceremony where one is published):

1. **The 84th Golden Globes** (b25-S49 rules, b25-S50 dates; README §1). Film eligibility from the release the game's
   chart and `releaseFate` record (a seven-day commercial run in one of the seven metro areas, 70 minutes or more,
   scripted; a festival screening isn't a release); a film's performers only where the film is entered for Best Motion
   Picture, except a non-English-language film and an independent film under $10 million (read the production's budget
   tier); television's first US airing in 2026, prime time unless cable or subscription, a foreign program only as a US
   co-production. The studio or publicist enters and picks lead or supporting (so the production's draw enters, labeled,
   not the player; the player can't self-submit, and the panel says so); voice-only work is refused with its reason.
   Categories as S49 names them, the player's by their billing (Actor or Actress, as creation's Billed As settles it).
   Nominations: the top six; the final round one vote a category; S50's 84th dates; a later edition carried forward and
   said so (`projected`, as the Emmys do). The ceremony on January 10, 2027 at the Beverly Hilton through `ceremony.ts`.
2. **AACTA 2027** (b25-S56, b27-G1-01..04; README §2). Eligibility only for a production that qualifies (significant
   Australian content, 51% Australian financing, an official co-production, AACTA's discretion). The slate's Sydney work
   is American productions shooting there under SAG-AFTRA's terms (`MARKETS` in `content/slate.ts`), so today every one of
   the player's productions is refused by this rule, with the rule as the reason, on the panel and when the player asks.
   Don't invent Australian productions: they'd need Australian performers' terms (MEAA's), which no register holds (say
   so as a research blocker). Build the engine whole so that a production that does qualify (a test may construct one)
   is entered, nominated and decided. The producer enters, one category a production; the entrant picks lead or supporting, not
   both; voice-over in animation refused. The 2026 window, entries July 6 to September 28, 2026, Film Round 1 October 2 to
   November 9; nominations and Round 2 TBC, so their dates are the game's, labeled. No ceremony date was published: no
   ceremony trip; the result arrives as a notice that says the date is the game's.
3. **The 42nd Film Independent Spirit Awards** (b25-S53/S54, b27-G1-11/12; README §4): 70 minutes or more, under $30
   million (the budget tier), qualified by one of the nine festivals G1-11 names, a week in a US theater or paid VOD in 2026;
   acting only for American narrative films; the filmmaker or distributor submits; Lead, Supporting and Breakthrough
   Performance, a performer nominated in one only; the TV categories for a new scripted series; nominations December 2,
   2026, the show March 6, 2027 (its place wasn't read: don't name one; without a published place there's no trip, only
   the result). The festivals cluster builds selection at other festivals; read its record of a selection through a
   function it exports, or, until it lands, the Sundance selection the game already has.
4. **The Children's & Family Emmys (NATAS)** (b27-G1-15/16; README §4 and §7): by the 4th contest's call for entries, the
   last one published, carried forward and said so; programs for ages 0 to 15, animated and live action; its nine
   performer categories, the voice categories among them, one category a program agreed by the show and the performer;
   self or agent submission with the rights holder's permission (so the player can enter, with the production's
   permission as a labeled draw); Blue Ribbon judging setting nominees and winners in one round.
5. **The Critics Choice Awards** (b25-S57, b27-G1-21/22; README §4): only its windows, categories, stages and dates were
   published; who submits and what else qualifies were not. Show it on the panel with what was read, and decide nothing
   that would need the unpublished rules (a research blocker, said in your report and on the panel), unless you find a
   published rule in the facts that settles entry.
6. **The Emmy category choice** (N23, README §7; loop 45 "→ select category"). Today the game places the player's entry.
   Let the player choose lead, supporting or guest when entering, within N23's limits: guest only under half the
   program's episodes; the show's comedy or drama categorization; one category per character; no guest entry for a role
   after a lead or supporting nomination; the Awards Committee's final approval (a refusal where the limits forbid it).
   The choice changes the field the entry joins (falsifiability twin: the same part entered two ways, two different
   fields).
7. **The Emmys' Outstanding Character Voice-Over Performance** (N23 Category 75, README §7): a voice part in an animated
   program aimed at viewers 13 and over enters it, voted head to head (not juried); a voice performer can't enter lead,
   supporting or guest; a children's animated program (under 13) goes to the Children's & Family Emmys instead (item 4),
   and the reason is said.
8. **The words already shown about these institutions** (`INSTITUTIONS` in `content/awards.ts`: the Golden Globes' "wasn't
   there (HTTP 404)", AACTA's "Unreachable", Spirit's and Critics Choice's and NATAS's) are stale now that their rules were
   read: rewrite those rows (their `coverage`, `sources`, `known`) to what was read. The festivals' rows belong to the
   festivals cluster.

The simulated field is never a real person and never a real future result: the game's own nominees, as the Emmy field is.
Real organizations decide nothing in the game beyond what their published rules say; every draw is the game's, labeled.
Every new command needs refusal words, a gated control on the Industry tab's Awards And Festivals (or wherever entry is
made today) and a guide chapter that opens it; Productions And People shows a nomination or win with the right tags.
