# Brief 15, The Profile Area: Batches

The area's sources are 615 in 27 files (`prompts/profile.md`), every one Pending in the second pass at the start. Each
batch below says what it read, what changed and what stayed, where a rewrite could have changed what's true and how
that was checked, the whole interactions read, the tests and tool matchers it updated, and the checks with their exits.
`b1-looks.txt` and the files after it are the game's own output, printed by playing it (`render-looks.ts.txt` and the
scripts named beside each).

## Batch 1: The Abilities, Their Looks, And A Piece Of Work

**Sources read (27):** `content/abilities.ts` (12, one per ability), `ui/looks/actor.tsx` (3: the band words, the
development sources and `top`, which holds the ability's, the genre's and a piece of work's looks),
`ui/components/AttributesPanel.tsx` (1), `systems/attributes.ts#alreadyApplied` (1), `content/attributes-matrix.ts` (6),
`content/genre-coverage.ts` (2), `content/reference.ts` (1), `content/demands.ts` (1). About 4,100 words.

**The interaction read whole:** an ability from the Attributes And Craft table (its row's Today, It Shapes and Last
Change) into its look (Now, Classes Reach, Last Change, How it grows, Where it started, What it does, Where it counts, To
practice it, the history) and on to a piece of work it was judged in; a genre from the Genres table into its look and
its two buttons, Study It and Open Its Brief; composure on the School screen against its look on the Profile.

**Rewritten:**
- **What it does, all twelve that needed it** (`affects`). Each was one sentence fragment of up to ninety words: a
  semicolon list, its subject often at the end ("…, your consistency"), and "more the more" doing the work of a
  sentence. Each is now short sentences, one effect each, opening on what the ability does for you: "How believable
  you are in everything you perform…", "It matters most when the material is grave.", "It also sets how much you get
  done in an evening rehearsing with a partner or a reader…". Vocal Expression and Physical Expression already read
  that way and kept theirs.
- **How it grows,** for presence, composure and stamina, where three activities were run together by semicolons.
- **Where it started,** for presence ("from 55 to 80 for a student the faculty chose" was the code's comment) and the
  four abilities kept in the craft ("It started with the rest of your training, as your techniques did" named nothing
  the player has seen; they're drawn with the techniques at admission).
- **The genre look:** its summary for a genre studied says a scene or a part from a play of its kind is quicker to
  prepare, where it said a part only; for a genre not yet studied it repeated the conventions the body says a line
  below, and now says what to do. "Its brief is finished work" (a developer's note) is now the way to tape it, Open Its
  Brief. A genre with no requirement says the research found nothing it asks beyond any self-tape, the Genres table's
  own words.
- **A piece of work's look:** "Worked out again from what it was judged on" is "Judged again from its record", and its
  two other variants match. The link from an ability to a piece reads "A Taped Brief, 50.2 of 100, with yours at 57.0".
- **The development history's** "The nerves of a performance" is "Nerves before a performance".
- **Your Composure, on School:** the exercise that trains it is named with where it is (under Attributes And Craft on
  the Player Profile), and the solo showing the ability's own look names is no longer left out.

**Kept, and why (the reasons are in `docs/text/second-pass/profile.json`):** the band words; the refusal for an action
pressed twice; the twelve demand labels; the registry's two developer errors; the attributes matrix and the genre
coverage, which write maintainers' documents no screen imports. In the ability texts: every definition, every source
line, and the How it grows of the nine abilities whose lists were already plain.

**Meaning-sensitive, and how each was held:**
- **Every clause of every ability's How it grows and What it does** is held by its own check in
  `tests/attributes-phase-2b.test.ts` (A4, brief 11), whose GUARD fails a sentence that says anything beyond its
  clauses but "and", "or" and punctuation. Each clause's words in the test were moved to the new words and its check
  left exactly as it was, so the new sentence is held clause by clause by the checks that held the old one. A clause
  now carries its own opening words ("It matters most when the material is grave"), since the GUARD allows nothing
  else between clauses.
- **The working reference's example 6** (listening) said "in scenes with a partner". The clause it rewrites is held by
  `readsIn('listening', 'partnered', …)`, and the Partnered Physical Work task is a fight or a moment of intimacy
  (`content/tasks.ts`). The sentence says "in a fight or an intimacy scene with a partner", as emotional depth's
  already did, so it doesn't claim more than the check holds.
- **Composure** said "a little of your believability when the stakes are high; your believability in any piece you play
  Restrained". The new sentences keep "a little" on the stakes alone and don't put it on the Restrained effect.
- **Presence's start** is `ATTRIBUTES.presence` ({ from: 55, span: 25 }) and the draw `(next() + next()) / 2`, so "most
  often near the middle" is the shape of the draw; classmates are drawn the same way (`presenceFor`).
- **The genre summary** was read against `genreSpeed`'s three callers: a part's lines in a production (twice) and a
  class scene's preparation, where the speed is the larger of the genre's and the material's (`coursework.ts`).
- **The piece's foot line:** `replay` judges the kept inputs again; a record under another ruleset gives none, which
  `tests/decisions-stamina.test.ts` plays.

**Tests and tool matchers updated (words only, every assertion as exact as before):**
- `tests/attributes-phase-2b.test.ts`: 42 clause words.
- `tests/guide-examples-craft.test.ts`: the genre summary's regex, as narrow as before (`/a scene or a part from a play
  of its kind \d+% quicker to prepare/`), the guide's quote of it, and the piece's foot line.
- `tests/decisions-stamina.test.ts`: the old ruleset's foot line, exactly.
- `src/engine/content/guide/craft.ts`: the Genres entry's example quotes the new summary. The guide is this area's,
  and is read whole in batch 5, where it's marked.

**Checks:** `npx tsc -b --noEmit` exit 0. `npx eslint` on the seven changed files, exit 0. `npx vitest run` (two forks)
on the 24 test files that read the abilities, the looks or the composure panel: 396 of 396, exit 0. title-case 0,
label-sweep 0, plural-check 0, voice-check 0, tics 0 (no count moved), spelling 0, typos 0, doc-refs 0, deciders 0,
guide-quotes 0. text-inventory 1 before marking, on the 16 sources whose words changed, and 0 after (but for the
composure panel, below).

**Screens verified:** `b1-looks.txt`, printed by `resolveLook` on a first-year in New York: all twelve ability looks, a
genre look of each kind of demand before any work, drama studied once and its brief taped, that take's own look, two
ability looks after it, a gone work and a gone genre, a life that never trained, and every development source.

**Left for the built app:** `AttributesPanel` is drawn by `tests/evidence-g08-life.test.ts` and `-g29-ui`, which read
its figure and not its paragraph, so it's marked once the School screen is read on the built app at the end of the
area.
