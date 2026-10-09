# The Research Behind The Connected Attributes

Three files, gathered on 2026-10-09 by research agents told to read sources
directly where they could and to say how each claim was verified. They're here
whole, in the words they came back in. The game's tables quote and cite them,
and where a figure in the code is SLATE's own estimate, the code says so.

| File | What it answers | Read by |
| --- | --- | --- |
| `research-acting-engine.json` | 86 findings in 10 topics: what acting abilities are and how conservatories assess them, how skill grows, how lines are learned, performance anxiety, fatigue and sleep, stamina, satiation and interest, leisure and recovery, actors' uses of interests, and genre conventions | `src/engine/content/abilities.ts`, `content/tasks.ts`, `content/practice.ts`, `content/engagement.ts` |
| `research-interests.json` | The 64 interests: each one's definition, an activity a Yale student can do in New Haven and where that's documented, what the activity is to an actor and its source, and the researcher's confidence and caveats | `src/engine/content/engagement.ts`, generated from it |
| `research-genres.json` | The 149 genres: each one's conventions and source, how the source was read, its families, and what it asks of a performer, with that claim's source and confidence | `src/engine/content/genres.ts`, generated from it |

## How far to trust each

- **Acting engine.** Each finding has `how`: "read directly" (the primary text,
  a syllabus or a published abstract), "abstract only" or "read secondhand".
  The figures the engine leans on hardest were read directly: LAMDA's 2024
  Performance Syllabus (the bands, Pass 50, Merit 65 and Distinction 80),
  Macnamara, Hambrick & Oswald (2014), Ericsson, Krampe & Tesch-Römer (1993),
  Heathcote, Brown & Mewhort (2000), Roediger & Karpicke (2006), Noice & Noice
  (2006), Lim & Dinges (2010), Galak, Kruger & Loewenstein (2011) and Bennett,
  Bakker & Field (2018). The classic acting texts (Stanislavski, Meisner,
  Chekhov, Laban, Linklater, Berry) rest on secondary sources.
- **Interests.** 12 high confidence, 24 medium, 28 low. Twelve activities are
  done at home and have no source naming a place; seven uses to an actor have no
  source at all. Topic 9 of the acting-engine file records that no measured study
  shows an actor's interests improve performance, so what an interest develops
  in the game is small and ordinary.
- **Genres.** 39 definitions read at the source, 110 from a search's summary.
  The performer demands of 30 are sourced (medium confidence) and of 119 are the
  researcher's reading of the conventions (low), which the genre's look says.

## What was edited on the way in

The generated tables in `src/engine/content/` take the house's American spelling
and a few of its joins (`tools/spelling.mjs`, `tools/tics.mjs`,
`tools/voice-check.mjs`), and real names keep their own spelling. These files
keep the original wording.
