# Your cluster: languages

The owner's brief 27 is at `docs/verification/briefs-2026-10-16/27-foundation-limits-and-connected-professional-career-universe.txt`
(Part 7: "Support appropriate: … - Languages and accents."; Part 9: "- Accent, language, movement, and vocal preparation.";
the supplement's loop 1 on creation and history). The build left languages out: "The game records no languages: every market
the slate makes work in works in English, so a language on the résumé would be a word nothing reads" (README, K3). The
owner has ruled that "no consumer" isn't a reason to leave an authorized feature out: build the connection.

What exists: accents are a technique (`content/school.ts`, the `accents` skill; slate parts ask `{ accents: 1 }` in
`content/slate.ts`); `content/languages.ts` only names places' languages for the map (`world/place.ts`); the slate's
markets are US cities, London and Sydney (`MARKETS`, `content/slate.ts`), US productions only.

Build:
1. **What the actor speaks**, on `Person` as an optional field (an older save has none: read it as English, native, and
   say so in a comment), set in character creation (`src/ui/creation/CharacterCreation.tsx`, the creation config in
   `src/engine/world/bootstrap.ts` and its validation): each language with a level (native, fluent, conversational).
   Real language names only. Creation's existing tests must pass, and creation's steps are walked by
   `tests/b27-creation-origins.test.ts` and others: extend them.
2. **Parts that need a language.** A share of the slate's parts (ASSUMPTION, stated) are written for a character who
   speaks a named language as well as English (US productions cast bilingual characters; keep it plausible for the
   markets the slate has). Such a part's requirement is read by eligibility and fit (`eligibilityProblems`, `fitOf` or
   their equivalents in `projobs.ts`/`slate.ts`): fluent or native qualifies, conversational qualifies with a cost (more
   preparation to reach the part, read by `auditionContext` and `workContext` as accents are read), none refuses with
   words that say why. The breakdown on the Opportunities tab says what the part asks.
3. **The résumé lists the languages** (`resumeNow` in `src/engine/systems/pro.ts`), as it lists special skills.
4. **The guide** says what languages do.
Falsifiability twin: a bilingual actor is posted, auditions and is booked for a part a monolingual twin is refused, from
the same seed. Save and load keep the languages. A part's language must be stable for the same seed (decider-keyed).
