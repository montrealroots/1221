# The Material Area's Batches

Brief 14, the material area (`docs/verification/language-2026-10-17/prompts/material.md`), 2026-10-17, on
`lang14-material`. The area's files are the 21 the inventory puts in material: the eight `src/engine/content/scenes-*.ts`,
the twelve brief files `src/engine/content/briefs/{briefs-a..f,second-a..f}.ts` and `briefs/index.ts`: 994 sources,
153,517 words when the area began.

Every source was read whole, on its own. Characters' words, stage descriptions and the scenes' facts were kept. What was
rewritten is the game's own framing inside the material: a brief's reasons for what it asks (`why.*`), its allows notes,
its readings' sentences and a class scene's reasons for an answer (`why`), where they read as the engine describing
itself, named a skill differently from the screen, ran two sentences together on a semicolon, or were fragments. No
number, id, tag, tone, list or list order changed: a scratch script outside the repository (`m14/tools/pairs.py`) lists only string literals that differ
from `HEAD`, 115 of them, every one a text field (`examples.json` has each, verbatim). The judge keys on ids
(`callbackFor`'s `brief:${person.id}:${b.id}:…`), never on these words, and nothing reads them for computation:
`grep -rnF` of the first and last 40 characters of every old string in `src tests tools base44 docs` found them only in
other brief files' own text (shared phrases) and in this area's status notes.

A new test holds the words to the screens that show them, `tests/material-words.test.ts`:

- *a practice brief’s words, on its pane > shows every brief’s scene, its reasons and its readings whole, each sentence
  sound*: renders BriefPane (`renderToStaticMarkup`) for all 298 briefs and finds each field, beat, reason (after its
  heading's `. ` or `: `, as MaterialDemands joins them) and reading (`<label>. <reading> It rests on: <rests> Fully
  prepared`), and checks no own string prints a doubled stop, a space before a stop, `undefined`, `NaN` or `[object
  Object]`, and that each ends as a sentence does.
- *a practice brief’s words, on its pane > names in an allows note the very choice the brief allows*: every allows note
  now says "It can only be played <choice>", and the choices it names equal the brief's own `allows`. Mutation-tested:
  a temporary test that changed one note's "set" to "open" failed (`expected [ 'open' ] to deeply equal [ 'set' ]`,
  `brief-anime`), and was deleted.
- *a class scene’s words, at the table and in the note > shows every scene’s summary and each answer’s reason once it’s
  shown, and a cut-against reason is the note’s*: for every scene, both roles and every option, renders CourseworkPane's
  table work once the piece is shown and finds `What it rests on: <why>` or `What cuts against it: <why>`, and checks
  `noteText(a, { kind: 'choice', question })` is exactly `<question label>: <why> As <role> in <play>.`

No existing test or UI matcher asserted any of the old words (grep of `tests/`, `tools/acceptance-ui.mjs` and
`tools/playthroughs-ui.mjs`), so none changed. No test title changed.

The checks of common.md were run by a script (scratchpad `m14/checks.sh`), each exit written to a file. Five runs:

| Run | Tree | tsc | eslint | title-case | label-sweep | plural-check | voice-check | tics | spelling | typos | text-inventory | doc-refs | deciders | vitest |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| baseline | before any edit | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| b12 | batches 1 and 2's scenes, briefs-a..e | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (10 files, 610 tests) |
| b3 | to second-b, and scenes-original | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **1** | 0 | 0 | 0 (9 files, 569 tests) |
| b4 | every edit | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 (9 files, 569 tests) |
| b4b | the allows test added | | 0 | | | | | | | | | | | 0 (material-words, 3 tests) |

b3's text-inventory failure was this area's: the allows notes as first rewritten said "the same way on every take" and
"found fresh from the reader on each take", and the engine-speak ratchet's "a take, for any judged work" rose to 175,
over 172. The new sentences now say "every time" and "each time" (`m14/edits-take.py`), and b4 passed. vitest each run:
the judge's four (decisions-judge 48, briefs 30, material 16, stage-interpretation 14) and briefs-content (451), scenes
(5), briefs-situations (1) and material-words; b12 added remaining-judge (16) and evidence-g20-school (27), b3 and b4
genre-identity-screens (2). ESLint ran on every brief and scene file and the new test.

Engine-speak in the area fell from 127 to 120: "a take" 78 to 74, "a segment" 6 to 5, "draws on" 3 to 2, "what something
reads" 1 to 0; "a dial" 11, "a signal" 16, "a weight" 7, "refused" 2 and "the engine" 3 are unchanged and all in-world
(a safe's dial, hand signals, a car's engine, a scene's refusal), each said so in its source's status.

Tic budgets the rewrites came up against and kept: ", which is" 12 of 12 (the tragicomedy note lost one), "rather than"
12 of 12, a sentence opening on "Nothing" 0 of 0 (three reasons that began "Nothing of the kind" were rewritten), and
voice-check's 40 of 40.

## Batch 1: The Older Plays' Scenes

**Sources (18):** `scenes-scored.ts` [scapin-3-2]; `scenes-meeting.ts` [enemy-4], [strife-2-2]; `scenes-public.ts`
[enemy-2], [justice-2], [strife-1], [weavers-1]; `scenes-house.ts` [caesar-3-2], [dream-5-1], [henry5-4-3], [oedipus-1];
`scenes-greek.ts` [agamemnon-855], [antigone-441], [bacchae-451], [electra-328], [medea-446], [oedipus-300];
`briefs/index.ts` #RETIRED_BRIEFS.

**Changed (4 sources, 5 strings):** scapin-3-2's reason for "real" ('personating' and 'all the parts' said plainly, the
footnote named as the translation's); enemy-4's reason for "private" (split, and 'that was the second act' said as what
it was); henry5-4-3's choice "He isn’t let speak" (now "allowed") and its reason for "terms" (said in the order it
happens); dream-5-1's reason for "wood" ('the Prologue is addressed' said as "ready", and split).

**Kept (14):** the rest, each with its reason in `docs/text/statuses/material.json`; RETIRED_BRIEFS keeps its titles
because a save's records name the genres they belonged to and only `.kinds` is read (`briefKinds`).

**Meaning-sensitive:** dream-5-1 ("address'd" is Philostrate's "ready", checked against the scene's text); henry5-4-3's
terms (Montjoy comes, Henry sends him back with his former answer, as in 4.3); scapin-3-2 (who the footnote gives the
lines to is unchanged); enemy-4 (the brothers alone in Act 2, as the play has it).

**Screens:** CourseworkPane's table work and the teacher's note, by the material-words test. Checks: b12, b3, b4.
`examples.json` has the five pairs and the four notes they reach (nine): the batch had no more to rewrite.

## Batch 2: The Modern, Classical And Original Scenes

**Sources (38):** `scenes-modern.ts` 11 ([anna-christie-1], [arms-1], [creditors], [ghosts-1], [hedda-2],
[masterbuilder-1], [proposal], [riders-sea], [rising-moon], [suppressed-2], [windermere-1]); `scenes-classical.ts` 18
([asyoulike-3-2], [caesar-2-1], [caesar-4-3], [dream-3-2], [faustus-3], [hamlet-3-1], [hamlet-3-4], [lear-4-7],
[malfi-1], [measure-2-4], [othello-4-3], [richard3-1-2], [scandal-2-1], [shrew-2-1], [stoops-2], [twelfth-1-5],
[twelfth-2-4], [wayoftheworld-4]); `scenes-original.ts` 9 (#BY and [orig-night-desk], [orig-bed-fourteen],
[orig-what-we-keep], [orig-runway], [orig-hundred-questions], [orig-office-hours], [orig-two-time-zones],
[orig-the-reception]).

**Changed (10 sources, 12 strings):** masterbuilder-1 and caesar-2-1's "Nothing of the kind is in the scene" and
caesar-4-3's "Nothing of the kind" said as what is true; riders-sea's "she isn’t in this part" (the scene's
construction) said as where Maurya is; caesar-4-3's choice "Draw on him" now "Draw his sword on him";
wayoftheworld-4's "This is the bargain before" said whole; six fragments in the original scenes made sentences
(night-desk, what-we-keep, office-hours, two-time-zones twice, the-reception).

**Kept (28):** the rest. #BY ("An original scene written for SLATE") is kept word for word: tests/scenes.test.ts holds
every original scene to it (`expect(s.by).toBe(...)`), and BriefPane, the profile, the tutorial and the guide say the
same phrase.

**Meaning-sensitive:** caesar-2-1 (in 2.1 Portia kneels for his secret, he never suspects her, no other man is in the
exchange); caesar-4-3 (no mutiny; the quarrel's bribes and money kept); riders-sea (the scene's circumstances put
Maurya lying down in the inner room); what-we-keep (the kitchen drawer, Paul and his father are the scene's own facts,
in its summary, circumstances and Paul's role).

**Screens:** as batch 1. Checks: b12 (modern, classical), b3 and b4 (original).

## Batch 3: The First Line Of Briefs

**Sources (446):** `briefs/briefs-a.ts` 74, `briefs-b.ts` 74, `briefs-c.ts` 77, `briefs-d.ts` 74, `briefs-e.ts` 75,
`briefs-f.ts` 72: a source per brief (its scene, beats and reasons) and per reading id.

**Changed (33 sources):** briefs-a [brief-anime], [brief-art_house], [brief-chase], [brief-alternate_history],
[brief-avant_garde], readings [whisper], [number], [sincere]; briefs-b [brief-concert_film], [brief-docufiction],
[brief-domestic_drama], [brief-erotic_thriller], [brief-exploitation], [brief-documentary]; briefs-c [brief-farce],
[brief-found_footage], [brief-jidaigeki], [brief-horror_comedy], [brief-film_noir], [brief-isekai]; briefs-d
[brief-mockumentary], [brief-melodrama], [brief-musical], [brief-nature_documentary], readings [full], [held];
briefs-e [brief-romantic_comedy], [brief-samurai], [brief-screwball_comedy], [brief-slapstick], [brief-silent_film];
briefs-f [brief-thriller], reading [scale].

What changed, by kind: allows notes that said "the structure is set and can’t be found anew on the take" now name the
one way the scene can be played ("It can only be played set, the same way every time."); techniques notes that listed
"Comedy for …; clown for …" or "Classical for …; combat for …" became sentences naming each technique as the School
screen does (Stage Combat, Improvisation, Voice-Over, Classical Text, On Camera, Clown And Mask); "improv work",
"voiceover", "voice-led work" and "screen work" became the screen's words; "comic engine" became where the comedy comes
from; one-sentence notes of a colon and two semicolons became two to four sentences; "Nothing explicit is played"
became "None of it is explicit"; readings that dangled ("Played as …, the fun is …") got their subject.

**Kept (413):** each brief and reading, with a status that names it and a detail of it; the in-world words the
engine-speak list counts (a self-tape's "take", an anthology's "segment", a safe's "dial") said so in its status.

**Meaning-sensitive:** brief-romantic_comedy's relationship ("Neighbors of their clients", which made them both
neighbors of clients, said as the circumstances have it: Owen is the neighbor across the hall from her client's door,
and they had one date three weeks ago);
the allows notes (each choice named equals the brief's `allows`, by the new test); readings whisper, number, sincere,
full, held and scale (read against their briefs' beats and circumstances, which are unchanged).

**Screens:** BriefPane for every brief, by the material-words test. Checks: b12 (a..e), b3, b4.

## Batch 4: The Second Line Of Briefs

**Sources (492):** `briefs/second-a.ts` 85, `second-b.ts` 78, `second-c.ts` 86, `second-d.ts` 81, `second-e.ts` 78,
`second-f.ts` 84.

**Changed (54 sources):** second-a [brief-animated-3], [brief-anthology-2], [brief-christmas-3], readings [race],
[horn]; second-b [brief-concert_film-2], [brief-costume_drama-2], [brief-creature_feature-2], [brief-dance-2],
[brief-dark_fantasy-2], [brief-docufiction-2], [brief-erotic_thriller-2], [brief-exploitation-2],
[brief-experimental-2], [brief-documentary-2]; second-c [brief-fairy_tale-2], [brief-farce-3], [brief-film_noir-3],
[brief-found_footage-2], [brief-giallo-2], [brief-grindhouse-2], [brief-hangout-2], [brief-horror-2],
[brief-horror_comedy-2], [brief-isekai-2], [brief-jidaigeki-2], [brief-jukebox_musical-3]; second-d
[brief-medical_drama-2], [brief-melodrama-2], [brief-mockumentary-2], [brief-monster_movie-2], [brief-mumblecore-2],
[brief-musical-2], [brief-nature_documentary-2], [brief-neo_noir-2], [brief-new_wave-3], [brief-parody-2], reading
[reasoner]; second-e [brief-psychological_thriller-3], [brief-romance-2], [brief-samurai-3], [brief-science_fiction-2],
[brief-screwball_comedy-2], [brief-slapstick-2], [brief-splatter-2], [brief-spy-2]; second-f [brief-stoner_comedy-2],
[brief-superhero-2], [brief-swashbuckler-2], [brief-tokusatsu-2], [brief-tragicomedy-3], [brief-whodunit-2],
[brief-yakuza-3], reading [half].

What changed, by kind: as batch 3, and: bracketed skill names ("(stage combat)", "(comic technique)") made the
sentence's own words; "the form’s" named the form (melodrama's, noir's); "Its answers" made the character's; a garbled
obstacle (psychological_thriller-3) and three fragments (samurai-3's techniques, whodunit-2's techniques, half's
"rests") made sentences; yakuza-3's "he holds to it but once", which reads as "only once", said as meant ("he steps
outside it only once").

**Kept (438):** as batch 3.

**Meaning-sensitive:** psychological_thriller-3's obstacle (the same three facts: he changes the order, her exactness
sounds rehearsed though it's how her memory works, the left-out detail); yakuza-3's language note (the beats have one
step outside the form, and the note now says so); half's "rests" (the fence bit is the beats' own); horror-2's "the read
can’t crack even as what it reads turns on her" (her reading of the book); the allows notes (by the new test).

**Screens:** BriefPane for every brief, by the material-words test. Checks: b3 (second-a, second-b), b4.

## The Area's End

The statuses, the whole suite, the build and the walks are recorded below once they ran.
