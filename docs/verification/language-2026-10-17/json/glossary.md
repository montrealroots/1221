# Brief 14, The JSON Area: Its Terms

For `docs/GLOSSARY.md`, section Profile, Abilities, Genres And Advice, in its columns: the words the genre look now uses
for the research behind what a genre asks of an actor (`content/genre-demands.json`). They sit beside the profile
area's own ("What a self-tape in it asks", "calls for", "adds no requirement"), and match them. The home accounts' file
shows no words, so it adds no term.

| Say | What It Means | Instead Of |
|---|---|---|
| **requirement** | A technique a self-tape in a genre calls for: one of the genre's demands, applied where the research holds them at medium or high confidence (`applied`, `genreTags`). The look's own word ("adds no requirement of its own"). | tag, demand tag, applied tag |
| **the requirements the game can ask for** | The twelve demands a genre can make (`DemandTag`), as a set: what the research couldn't fit is "none of the requirements the game can ask for". | the vocabulary, the fixed vocabulary, a vocabulary tag, no tag fits |
| **Fights And Stunts**, **Singing**, **Dancing**, **Comic Timing**, **Physical Comedy**, **Heightened Language**, **Accents**, **Improvisation**, **Staged Intimacy**, **Naturalism On Camera**, **Voice-Led Performance**, **Physical Transformation** | Each requirement, named as the look names it (`DEMAND_LABEL`) and capitalized mid-sentence; where it matters, the technique it's trained as ("Fights And Stunts is trained as Stage Combat"; "Physical Transformation, which the game trains as Character Work"). | 'stunt', physicalComedy, voiceWork, the camera tag, the heightened tag |
| **the research didn't name** (a requirement) | The research proposed no such requirement for the genre. | no X tag was given, so no X tag |
| **a requirement of the whole genre** | A demand of the genre as a whole, not of one film, director, role or subgenre: what "applied" means. | genre-wide, applied genre-wide |
| **on review (2026-10-10)**, **the review of 2026-10-10** | The research's own review, which lowered every entry resting on one film, one director, one role or one subgenre, and took some requirements away. "On review (2026-10-10), one film’s water-tank work wasn’t enough to make it a requirement of the whole genre." | Reviewed 2026-10-10: … Not applied genre-wide. |
| **read directly** | The source's page itself was read. Also the source line's mark, "[read directly]". | fetched, read at source, [fetched] |
| **from a search summary** | Known only from a search engine's summary of the page. Also the source line's mark. | search snippet, snippet, as summarised by search, [snippet] |
| **an automatic summary of the page** | Read through a tool that summarized the page, not the page's own text. | a summarising fetch, the fetch tool |
| **couldn’t be opened** | The page refused the research or failed to load, so it was read some other way or not at all. | returned 403, HTTP 403, blocked, refused fetching |
| **used only as a lead** | A page used to find sources, not as evidence (Wikipedia, mostly). A citation keeps its own "(pointer only)". | a pointer, Pointer: |
| **the game defines** (a genre) | The game's own definition of the genre, which the research was given. | the input defines |
| **a direct reading** | The research's own reading of a source, against a search's summary of it. | my own reading |
| **the X genre** | Another genre, named by its label. "See the Creature Feature genre." | costume_drama, creature_feature, slasher’s, (see war) |
| **the earlier research** | What the research said before it was read again. | the previous text, the earlier pass |
| **one director stands in for the genre** | All the evidence is one director's films. | Leone stands for the genre |

## For The Coordinator

- **Two strings in the profile area's genre look** (`ui/looks/actor.tsx`) now sit wrong beside these words; both are in
  `defects.md`: "only in single examples", false for all ten genres it's shown on, and "Why it’s applied, in the
  research’s words:", which heads the game's words now.
- **"read directly"** is what the look's parenthesis says of the demands' research. The same look's provenance line says
  of the genre's definition that it "was read at the source". Both are plain and mean the same; one name would be
  better, and "read directly" is the research's own and the shorter. The provenance line is the profile area's.
- **Dates of the research's review** stay ISO ("reviewed 2026-10-10"), as the money area's source lines print a bank's
  date ("Source: …, 2026-09-25") and the school's running times say "searched 2026-10-16" (`content/workload.ts`, still
  Pending in this clone). They're dates of real-world research, in small print, not the game's calendar.
