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

**Sources (81):** `briefs/briefs-a.ts` 74 (25 briefs and 49 reading ids: brief-action, brief-absurdist,
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

**Interactions read whole:** a brief's pane top to bottom, as above, for each of the 25 briefs: the header line ("A
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

## Batch 2: Briefs, Coming Of Age To Exploitation

**Sources (74):** `briefs/briefs-b.ts`, 25 briefs (brief-coming_of_age, brief-concert_film,
brief-conspiracy_thriller, brief-cosmic_horror, brief-costume_drama, brief-courtroom_drama, brief-creature_feature,
brief-crime, brief-cyberpunk, brief-dance, brief-dark_fantasy, brief-detective, brief-disaster, brief-docudrama,
brief-docufiction, brief-documentary, brief-domestic_drama, brief-drama, brief-dystopian, brief-eco_horror, brief-epic,
brief-erotic_thriller, brief-espionage, brief-experimental, brief-exploitation) and 49 reading ids (growing, loyal, decided, grieving, hunter, hunted, detached, holding, form,
pride, craft, care, expert, afraid, protector, business, system, person, legacy, farewell, bargainer, mother, chess,
sympathy, professional, strangers, witness (two readings: The Record Corrected and What She Saw), memory, ordinary,
open, letters, narration, tired, partners, guarded, listening, liar, pleader, scientist, courtier, son, control,
danger, still, father, precision, reaction, revenge, player). About 8,400 words, each read whole in the source.

**Rewritten (15 sources, 19 strings):** growing, loyal, brief-concert_film, pride, brief-creature_feature,
brief-docudrama, brief-docufiction, ordinary, brief-documentary, tired, guarded, listening, brief-epic,
brief-erotic_thriller, brief-exploitation. By kind:
- **Staging notes as instructions (3):** The Count-In ("For the tape, stand at a mic stand and play to his eyeline
  beside the lens."), The Second Key's and Closed For The Season's staged intimacy ("Seated, lean toward his eyeline
  beside the lens and stop short. … when the reader calls the catch, stop your hand as if it’s held."). The
  coordinator, the solo playing and "None of it is explicit" are kept word for word.
- **"The actor" is you (3):** The Inquiry Room's physical and vocal notes ("so build that age into how she sits, stands
  and turns to the reader"), Closing Day's circumstances.
- **"The brief has her" and "her objective is" (5):** four readings rested on the brief's paperwork rather than the
  scene ("the brief has her sit only in the last beat"); each now says what she does or wants.
- **Fragments and danglers (5):** Closing Day's and Letters From The Lock's techniques notes (the label before each
  already names the technique, so the note says what you do), Letters From The Lock's You Speak To line ("to whom … ;
  heard by …"), The Ford Before Winter's vocal note, The Boat Shed's second beat.
- **English a person says (3):** The Hand Held Out's "offers to have worked for free" is the beat's own "he’d have
  worked the week for free"; Letters From The Lock's "Three letters are read" is "You read three letters"; Hearing Him
  Out's passive.

**Kept (59 sources):** the rest, each with a reason naming the brief or reading and what it does well.

**Meaning-sensitive (2):** the two staged-intimacy notes. Each keeps every condition it had: agreed in advance with an
intimacy coordinator, played solo, the eyeline beside the lens, never touching the reader, the prop (jacket, glovebox)
on the actor's side of the frame, the reader calling the catch, and nothing explicit. The Second Key's "so it repeats
on every take" is "so the moment repeats exactly on every take": "it" had no clear referent once the sentence split.

**Interactions read whole:** each brief's pane as in batch 1. The voice brief (Letters From The Lock) was read with its
header ("recorded alone at a microphone") and its You Speak To heading; the improvised brief (Closing Day) with its
It Only Takes: Open note, which already said "It can only be played open, found fresh from the reader each time" and
is kept.

**Tests and tool matchers updated:** none; no test or tool held the old words. Two shared phrasings were found in
material-b's `second-b.ts` (lines 55 and 422) and are listed in the report.

**Checks (exits, `scratchpad/ma/b2/`):** `tsc -b --noEmit` 0; `eslint briefs-b.ts --max-warnings=0` 0; title-case 0;
label-sweep 0; plural-check 0; voice-check 0; tics 0; spelling 0; typos 0; doc-refs 0; deciders 0; guide-quotes 0;
text-inventory 0 after the marks. vitest: material-words and briefs-content, 2 files, 454 tests, exit 0 (run twice,
the second after the last edit). Engine-speak unchanged at 329: the two staged-intimacy notes keep their one "every
take" each.

**Screens:** BriefPane for each brief, rendered by the material-words test.
