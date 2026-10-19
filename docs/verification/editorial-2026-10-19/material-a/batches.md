# Material-A's Batches

Brief 15, the first material area (`../prompts/material-a.md`), 2026-10-19, on `ed15-material-a` from `6d111b49`. The
area's 508 sources in 16 files: the first line of practice briefs (`content/briefs/briefs-a.ts` to `briefs-f.ts` and
`briefs/index.ts`), the class scenes (`content/scenes-*.ts`) and the productions' plays (`content/plays.ts`).

## How The Material Was Read

**Where it shows.** A brief's words reach its pane (`ui/components/BriefPane.tsx`) and nothing else:
- the title and logline;
- The Scene: Where And When (`circumstances`), The Two Of You (`relationship`), You Play (`you`), The Reader Plays or,
  for a voice brief, You Speak To (`reader`), What You Want (`objective`), What’s In The Way (`obstacle`);
- Where It Turns: each beat with its tones, and the `why.beats` sentence after the rehearsal line;
- What <title> Asks (`MaterialDemands` in `PlayingChooser.tsx`): each `why.<feature>` after "Timing: High." and the
  rest, `why.language` after a colon, `why.techniques` after "Techniques It Asks: …." and `why.allows` after "It Only
  Takes: …";
- Your Reading: "<label>. <reading> It rests on: <rests> Fully prepared, …" for each reading.

A class scene's words reach the School's coursework card (`CourseworkPane.tsx`): its play, author and year, its `where`
(lowercased at its start by `whereWords`), the role names, the `summary`, an original scene's `facts`; at the Table
Work each answer's `text` in its select and, once the piece is shown, "Why the text supports it: <why>" or "Why the
text doesn’t support it: <why>"; and the teacher's note for an unsupported answer, "<question>: <why> You played
<role> in <play>." The notice when a piece is set uses the play and `where` too (`systems/coursework.ts`, line 467).

**What's judged.** The scenes' facts, the characters' voices and every quotation from a real play stay. What's read
against the standard is the game's own narration in them, and especially:
- **staging notes** (how a fight, an embrace or a recording is done safely for a tape), which the area's prompt asks to
  be a direct instruction; every industry term the glossary keeps (staged fight, marked solo, at reduced speed, called
  cues, replica, eyeline, off camera, intimacy coordinator) is kept in them;
- **fragments and dangling participles** in the reasons (`why.*`), which sit after a bold label and must read as a
  sentence of their own;
- **the voice briefs' You Speak To line**, which began "The voice speaks to …" under a heading that already says it,
  and called the player "the actor";
- **words the game uses for its own judging** (a segment, a reading of something other than the brief's reading)
  where the scene meant something plainer;
- **passives** where the actor is the one doing it.

**What doesn't change.** No id, number, level, tone, tag, list, allows value, reading's lean or draw changed. The judge
keys on ids (`brief:${person.id}:${b.id}:…`), never on these words. A scratch helper (`scratchpad/ma/tools/apply.py`)
replaces each old string exactly once and writes nothing if any old string isn't found exactly once; each batch's
edits are kept in `scratchpad/ma/b<n>/edits.json` and copied verbatim into `examples.json`. Each old string was
searched in `src tests tools docs/GLOSSARY.md docs/STYLE.md` before the batch's tests ran.

## Batch 1: Briefs, Absurdist To Comedy, And The Plays

**Sources (81):** `briefs/briefs-a.ts` 74 (27 briefs and 47 reading ids: brief-action, brief-absurdist,
brief-action_comedy, brief-adventure, brief-alternate_history, brief-animated, brief-anime, brief-anthology,
brief-apocalyptic, brief-art_house, brief-avant_garde, brief-backstage_musical, brief-biker, brief-biographical,
brief-black_comedy, brief-blaxploitation, brief-body_horror, brief-buddy_comedy, brief-buddy_cop, brief-caper,
brief-chanbara, brief-chase, brief-childrens, brief-christmas, brief-comedy; readings clock, reason, reasonable, dread,
cake, whisper, quest, betrayed, ordinary, memory, brag, brave (two readings, High Wind's and The Greenhouse Window's),
sync, laugh, secret, tale, keeper, debt, still, listening, task, found, nerve, number, hard, mother, likeness, person,
calm, grief, block, known, control, loss, friction, scared, banter, partners, pro, student, form, teacher, breath,
persuade, speech, sincere, brisk, timing, truth); `briefs/index.ts` 1 (#RETIRED_BRIEFS); `plays.ts` 6 (#THESIS_PLAYS,
#SHAKESPEARE_PLAYS, #REP_PLAYS, #SUMMER_PLAYS, #SIZE_WORD, #PLAY_ALIASES). About 9,300 words, each read whole in the
source.

**Rewritten (14 sources, 24 strings):** brief-action, brief-action_comedy, brief-adventure, brief-animated,
brief-anime, brief-anthology, brief-avant_garde, brief-backstage_musical, brief-biographical, brief-blaxploitation,
brief-chanbara, and the readings ordinary, tale and breath. By kind:
- **Staging notes as instructions (5):** The Loading Bay, Second Tier, The Last Well and The Checkpoint At Usui's fights
  ("Mark them solo at reduced speed against the reader’s called cues from off camera, with no contact and the keys on
  your side of the frame, so they repeat exactly on every take."), and The Last Broadcast's habits ("Keep her
  documented habits … all the way through the scene."). "Her side of the frame" became "your side": it's the actor's
  side, and the instruction is to the actor.
- **Voice briefs' You Speak To (2):** High Wind and Last Launch From The Roof now name the person first, then say what
  to do ("Rin, her rival, already recorded on the track. Play against his lines in your headphones.").
- **Fragments and danglers made sentences (5):** High Wind's and Last Launch's voice-over notes, High Wind's last line
  of circumstances, The Last Broadcast's first beat ("Business: …"), and Just Another File's rests.
- **Words of the game's own made plain (4):** Seat Fourteen's "segment" (twice) is the film's "story", as its logline
  says; The Checkpoint At Usui's "the end of that reading" (beside Your Reading, meaning something else) is "settles
  what each of them has seen"; Last Launch's dubbing slang "the flaps" is "the drawn mouth".
- **Passives and run-ons (8):** The Loading Bay's timing and beats notes, Instructions For Leaving A Room's
  improvisation note ("so you find how to play each repetition as you tape it"), Places For The Finale's techniques,
  Calloway Street's beats, Just Another File's reading, No Breath Left's reading.

**Kept (67 sources):** the rest, each with a reason naming the brief or reading and what it does well
(`docs/text/second-pass/material-a.json`; a sample in `retained.md`). The plays' titles and parts are the plays' own,
and `school.ts` matches a title by exact text against the casting a save holds (`p.title === c.play`, line 2194), so
they're keys as well as names; `SIZE_WORD`'s leading "A " is read back by `SchoolWorkspace.tsx` and `school.ts`;
`PLAY_ALIASES` is never shown; `RETIRED_BRIEFS`' titles aren't read by any screen (`briefKinds` reads only `.kinds`).

**Meaning-sensitive (6), and how each was checked:**
- The Loading Bay's beats note: "the relief of making it under" named no event. The third beat has her drop to the gap
  under the shutter "keys in hand", calling her colleague's name as it lands, with the tones grave and lyric. The new
  note says relief at having the keys, held with fear as the shutter lands: the same two tones, now of events in the
  beat.
- The four staging notes: each keeps every safety condition it had (solo, reduced speed, called cues, off camera, no
  contact, the prop on the actor's side of the frame, a replica blade never pointed at the lens or the reader) and adds
  none. Second Tier's "his fall played off it" is "let his fall happen off frame": the third beat says "he goes down
  off frame".
- The voice briefs: "whose lines aren’t in the booth" is "She isn’t in the booth with you": the brief is recorded alone
  (`medium: 'voice'`, the circumstances).

**Interactions read whole:** a brief's pane top to bottom, as above, for each of the 27 briefs: the header line ("A
practice brief for …: an original scene written for SLATE, taped to a reader off camera" or "recorded alone at a
microphone"), The Scene, Where It Turns, What It Asks, Your Reading, How You'll Play It, Read With and The Take. The
new staging notes now read as the same kind of instruction as the pane's own controls below them, and the You Speak To
lines no longer repeat their heading.

**Tests and tool matchers updated:** none. `grep -rnF` of each old string's first and last 40 characters in `tests`,
`tools`, `src`, `docs/GLOSSARY.md` and `docs/STYLE.md` found them only in briefs-a and, for three shared phrasings, in
material-b's `second-b.ts`, `second-a.ts` and `second-f.ts` (listed in the report for the coordinator, not edited).

**Checks (exits, from files in `scratchpad/ma/b1/`):** `tsc -b --noEmit` 0; `eslint briefs-a.ts --max-warnings=0` 0;
title-case 0; label-sweep 0; plural-check 0; voice-check 0; tics 0; spelling 0; typos 0; doc-refs 0; deciders 0;
guide-quotes 0; text-inventory 1 before the marks (the 14 rewritten sources Pending, as expected), 0 after. vitest:
`tests/material-words.test.ts` and `tests/briefs-content.test.ts`, 2 files, 454 tests, exit 0. Engine-speak fell from
332 to 329 (Seat Fourteen's two segments, Instructions For Leaving A Room's "the take").

**Screens:** BriefPane for every brief of the batch, rendered by the material-words test. The built app is read once at
the end of the area (below).
