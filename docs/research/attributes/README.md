# The Research Behind The Connected Attributes

Gathered from 2026-10-09 by research agents told to read sources directly where
they could and to say how each claim was verified. They're here whole, in the
words they came back in. The game's tables quote and cite them, and where a
figure in the code is SLATE's own estimate, the code says so.

| File | What it answers | Read by |
| --- | --- | --- |
| `research-acting-engine.json` | 86 findings in 10 topics: what acting abilities are and how conservatories assess them, how skill grows, how lines are learned, performance anxiety, fatigue and sleep, stamina, satiation and interest, leisure and recovery, actors' uses of interests, and genre conventions | `src/engine/content/abilities.ts`, `content/tasks.ts`, `content/practice.ts` |
| `research-genres.json` | The 149 genres: each one's conventions and source, how the source was read, and its families | `src/engine/content/genres.ts`, generated from it |
| `research-genre-demands.json` | What each of the 149 genres asks of an actor: the claim, its sources and what they support, the demand tags, confidence, uncertainty, and from 2026-10-10 what a demand belongs to where it isn't the genre's (`meta.review` keeps the rule) | `src/engine/content/genre-demands.json`, built by `tools/build-attribute-content.mjs` with the words in `genre-demands-words.txt` |
| `genre-demands-words.txt` | Not research: from 2026-10-17, the game's words for what the genre look shows of `research-genre-demands.json`, as edits from the research's exact text (below) | `tools/build-attribute-content.mjs` |
| `research-citations-review.json` | The citations the tables lean on, checked against the works themselves, and the exercises' sources | the corrections in `content/abilities.ts` and `content/practice.ts` |

Until 2026-10-10 two more files were here: `research-interests.json`, the 64
interests (each one's definition, an activity a Yale student could do in New
Haven, what it was to an actor, and confidence), and
`research-interests-review.json`, the review of its 28 low-confidence entries.
The owner removed the interests from the game that day, and their research with
them; git keeps both.

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
- **Genres.** 39 definitions read at the source, 110 from a search's summary.
- **Genre demands.** After the review of 2026-10-10, 3 high, 48 medium and 98
  low; only medium and high are applied, and `docs/GENRE-COVERAGE.md` accounts
  for every genre.

## What was edited on the way in

The generated tables in `src/engine/content/` take the house's American spelling
and a few of its joins (`tools/spelling.mjs`, `tools/tics.mjs`,
`tools/voice-check.mjs`), and real names keep their own spelling. These files
keep the original wording.

What the genre look shows of the genre demands is edited further. Until
2026-10-17 it showed the research's working words as they came back: "not
from my own reading", "the vocabulary has no driving or riding tag", "which
costume_drama covers", "Reviewed 2026-10-10: 3 of 3 sources read directly,
the rest as search snippets". From then (the owner's brief 14),
`tools/build-attribute-content.mjs` applies `genre-demands-words.txt` on the
way in: each edit replaces text the research says exactly, and the build
stops when the research no longer says it. The builder also says how each
was read in the look's words, and puts the house's spelling and contractions
in the research's own sentences, never in a quotation. `research-genre-demands.json`
keeps the original wording, and every quotation, citation, figure and date
reaches the game as the research wrote it.
