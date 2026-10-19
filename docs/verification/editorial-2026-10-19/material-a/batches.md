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

## Batch 3: Briefs, Fairy Tale To Legal Drama

**Sources (77):** `briefs/briefs-c.ts`, 25 briefs (brief-fairy_tale, brief-family, brief-fantasy, brief-farce,
brief-film_noir, brief-folk_horror, brief-found_footage, brief-gangster, brief-giallo, brief-gothic_horror,
brief-grindhouse, brief-hangout, brief-heist, brief-historical_drama, brief-historical_fiction, brief-holiday,
brief-hood_film, brief-horror, brief-horror_comedy, brief-isekai, brief-jidaigeki, brief-jukebox_musical, brief-kaiju,
brief-kitchen_sink, brief-legal_drama) and 52 reading ids (riddle, forgive, deal, scared, craft, brother, wonder,
calm, panic, cool, liked, two, polite, slow, mom, live, king, lesson, sleuth, dread, inquiry, longing, nerve, terror,
easy, unsaid, recall, reason, duty, sister, true, learned, sincere, light, brothers, own, trust, training, straight,
hustle, audit, nobody, forms, grief, dare, apology, line, awe, angry, son, counsel, promise). About 9,200 words.

**Rewritten (11 sources, 15 strings):** brief-farce, brief-film_noir, two, brief-found_footage, brief-grindhouse,
terror, brief-horror, brief-isekai, brief-jidaigeki, brief-jukebox_musical, brief-kitchen_sink. By kind:
- **Staging and direction as instructions (4):** The Petition For Vengeance's sword form ("For the tape, mark the form
  solo with a replica blade at reduced speed, angled away from the lens and the reader’s eyeline, so it repeats exactly
  on every take."), The Second Cake's box ("Stage it with a box so it repeats safely on every take."), The Reunion
  Set's "Sing the song as the character …", Not Going Back's "Play the accent as the way Dennis and his mother talk …".
- **A sentence that dropped its verb (1):** The Second Cake's "and clowning the physical business of hiding the cake"
  now says "and clowning carries".
- **Passives where the actor or the character does it (6):** The Night Line's voice-over note (four passives), Two
  Women, Night Two At Juniper Creek's two improvisation notes, Last Gas For Ninety Miles' partner note and Shaking
  Hands.
- **Noun phrases made sentences (2):** Someone Behind You's and The Petition For Vengeance's physical notes.
- **A word of the game's own (1):** Level One, Again's "the reading of the panel", beside Your Reading.
- **A promise the pane doesn't keep (1):** Level One, Again's You Speak To said the panel's messages "are written into
  the brief for her to read"; the pane shows no such messages. It now names the panel and says what to do: "you read
  its messages and react to them".

**Kept (66 sources):** the rest, each with its own reason. The set descriptions that begin "On the tape …" (The
Treehouse Treaty, Night Two At Juniper Creek, Sunday At The Laundromat) are kept: they say what the frame holds, not
what the actor must do safely.

**Meaning-sensitive (3):** The Second Cake's allows note keeps "It can only be played set", which the allows test holds
to the brief's `allows: { structure: ['set'] }` (it passed). The Petition For Vengeance's sword note keeps the replica
blade, the reduced speed, the angle away from the lens and the reader's eyeline, and the exact repetition. Level One,
Again's You Speak To: `BriefPane.tsx` shows `b.reader` under You Speak To and nothing else of the panel, so "written
into the brief" promised words the player never sees; the new line makes no promise.

**Interactions read whole:** each brief's pane. The voice brief (Level One, Again) with its header and You Speak To
heading; the briefs with It Only Takes (The Second Cake, Night Two At Juniper Creek) with their allows lines.

**Tests and tool matchers updated:** none. Shared phrasings were found in material-b's `second-c.ts` (lines 165, 220,
713) and `second-d.ts` (line 407), listed in the report.

**Checks (exits, `scratchpad/ma/b3/`):** `tsc -b --noEmit` 0; `eslint briefs-c.ts --max-warnings=0` 0; title-case 0;
label-sweep 0; plural-check 0; voice-check 0; tics 0; spelling 0; typos 0; doc-refs 0; deciders 0; guide-quotes 0.
vitest: material-words and briefs-content, 2 files, 454 tests, exit 0. text-inventory after the marks: 1, from the six
briefs-d sources batch 4 had already edited in the working tree while batch 3's marks ran (they weren't in batch 3's
commit, `03d06abc`); no briefs-c source was Pending. Engine-speak fell from 329 to 328 (Night Two At Juniper Creek's
"in the take").

**Screens:** BriefPane for each brief, rendered by the material-words test.

The record of this batch went in a commit of its own after `03d06abc`: a helper failed on batch 4's missing
`meta.json` and stopped the shell line that wrote it, and the code and marks were committed without it.

## Batch 4: Briefs, Magical Realism To Psychological Horror

**Sources (74):** `briefs/briefs-d.ts`, 25 briefs (brief-magical_realism, brief-martial_arts, brief-medical_drama,
brief-melodrama, brief-military, brief-mockumentary, brief-monster_movie, brief-mumblecore, brief-musical,
brief-mystery, brief-nature_documentary, brief-neo_noir, brief-neorealism, brief-new_wave, brief-nordic_noir,
brief-occult, brief-parody, brief-period_drama, brief-picaresque, brief-police_procedural, brief-political_drama,
brief-political_thriller, brief-post_apocalyptic, brief-prison_film, brief-psychological_horror) and 49 reading ids
(plain (two readings: Perfectly Ordinary and Just The Errand), keeping, form (two: Control As Craft and Within The
Forms), temper, numbers, hunch, full, held, rank, human, believes, lens, dread, sister, small, friends, persuade,
farewell, sleuth, fear, observer, story, cool, tempted, pride, whim, hope, closed, reach, skeptic, family, deadpan,
size, appeal, charm, survival, procedure, loyalty, operator, friend, still, betrayal, steward, voice, dignity,
reaching, grief, real, unsure). About 8,300 words.

**Rewritten (6 sources, 7 strings):** brief-martial_arts, brief-medical_drama, brief-mockumentary,
brief-nature_documentary, still, brief-prison_film. By kind:
- **Staging as instructions (2):** The Return Bow's sparring ("Mark each exchange at reduced speed …, land nothing on
  anyone, and stop the held strike short of his eyeline on every take.") and Table Nine's hug ("play the hug to her
  eyeline, and never make it").
- **A sentence that said the opposite of the scene (1):** Handover At Seven's circumstances said each reading was
  "still inside the range that triggers a call", which reads as each reading triggering one. The brief's own obstacle
  ("Every single reading is defensible") and the reading The Case On Paper ("Each reading is inside range") say none
  does. It now says "each reading still short of the level that would trigger a call".
- **Passives where the actor does it (3):** Pool Manager Of The Year's circumstances and improvisation note ("You make
  up her answers live …"), Invisible's reading.
- **A voice brief's You Speak To (1):** The Last Pool now matches the others ("The viewer at home, watching the
  sequence. Speak to them alone, as if no one else were listening.").

**Kept (68 sources):** the rest. The set descriptions that begin "On the tape …" (The Pump House's "she kneels alone on
a bare floor, with her brother off camera at her shoulder and the water only in her eyes") are kept as descriptions:
they say what the frame holds.

**Meaning-sensitive (3), and how each was checked:**
- Handover At Seven: read against the obstacle, the reading The Case On Paper and the hunch reading's "she can’t prove
  what she’s afraid of"; the scene's whole problem is that no one reading crosses the line.
- The Return Bow and Table Nine: every condition kept (reduced speed, the reader's called cues, nothing landing on
  anyone, the strike stopped short of the eyeline; the hug played to the eyeline and never made).

**Interactions read whole:** each brief's pane; the voice brief The Last Pool with its header and heading; the
improvised briefs (Pool Manager Of The Year, The Night Train South) with their improvisation and allows notes.

**Tests and tool matchers updated:** none. The Last Pool's old phrasing ("the voice speaks to them alone, at the
microphone") is shared by three of material-b's briefs in `second-d.ts` (lines 301, 476, 615), listed in the report.

**Checks (exits, `scratchpad/ma/b4/`):** `tsc -b --noEmit` 0; `eslint briefs-d.ts --max-warnings=0` 0; title-case 0;
label-sweep 0; plural-check 0; voice-check 0; tics 0; spelling 0; typos 0; doc-refs 0; deciders 0; guide-quotes 0;
text-inventory 0 after the marks. vitest: material-words and briefs-content, 2 files, 454 tests, exit 0.

**Screens:** BriefPane for each brief, rendered by the material-words test.

## Batch 5: Briefs, Psychological Thriller To Steampunk

**Sources (75):** `briefs/briefs-e.ts`, 25 briefs (brief-psychological_thriller, brief-queer_cinema, brief-revenge,
brief-road_movie, brief-rockumentary, brief-romance, brief-romantic_comedy, brief-romantic_drama, brief-samurai,
brief-satire, brief-science_fantasy, brief-science_fiction, brief-screwball_comedy, brief-sea_adventure,
brief-silent_film, brief-slapstick, brief-slasher, brief-slice_of_life, brief-social_realism, brief-space_opera,
brief-spaghetti_western, brief-splatter, brief-sports, brief-spy, brief-steampunk) and 50 reading ids (right,
slipping, comedy, decision, plan, chance, driver, friends, pro, relief, hoping, surprised, sparring, flustered,
sacrifice, listening, duty, debt, believer, trapped, con, wonder, catchup, loss, speed, pair, craft, fear, clown,
heart, dignity, panic, clear, dread, drawn, glad, tired, organizer, grand, sisters, stone, trade, politeness, shock,
coach, goodbye, tradecraft, marriage, bluff, pride). About 8,200 words.

**Rewritten (12 sources, 12 strings):** chance, driver, brief-romantic_comedy, sparring, brief-romantic_drama,
brief-samurai, catchup, brief-screwball_comedy, brief-slapstick, drawn, brief-social_realism, brief-spy. By kind:
- **Staging as instructions (3):** The Crossing At Dawn's sword form ("For the tape, mark the three exchanges alone …":
  it had said Gonroku marks them, and the character doesn't tape anything), The Wardrobe In Suite Nine's pratfall
  ("play it solo, … and work it out slowly first onto a bed or a soft mat, so it repeats safely on every take") and
  The Last Strip's blow and fall ("play it entirely as his reaction, with no contact").
- **Readings resting on the paperwork (3):** "her objective is", "his objective is", "the brief is built on" now say
  what the character wants or what the scene is.
- **Passives where a person does it (4):** Eyes On The Road, Drawn In, The Parrot Knows' timing ("has to be waited
  for"), Between Clients' improvisation note.
- **Notes that said "has to be placed" and nothing more (2):** The House Sale's and Two Coffees' timing notes now say
  what placing the moment means ("each one has to come on exactly the right line", "so that beat has to land
  exactly").

**Kept (63 sources):** the rest. Mile Marker 212's and The Late Number Nine's "For the tape …" set descriptions are kept
as descriptions.

**Meaning-sensitive (3):** the three staging notes; each keeps every condition it had (reduced speed, the replica, the
called cues, the off-camera eyeline and never the lens or the reader; solo, the reader off camera at the door, the slow
first run onto something soft; a blow landing off frame with no contact).

**Interactions read whole:** each brief's pane, as before.

**Tests and tool matchers updated:** none. The Crossing At Dawn's old phrasing is close to material-b's `second-e.ts`
line 259, listed in the report.

**Checks (exits, `scratchpad/ma/b5/`):** `tsc -b --noEmit` 0; `eslint briefs-e.ts --max-warnings=0` 0; title-case 0;
label-sweep 0; plural-check 0; voice-check 0; tics 0; spelling 0; typos 0; doc-refs 0; deciders 0; guide-quotes 0;
text-inventory 0 after the marks. vitest: material-words and briefs-content, 2 files, 454 tests, exit 0.

**Screens:** BriefPane for each brief, rendered by the material-words test.

## Batch 6: Briefs, Stoner Comedy To Zombie

**Sources (72):** `briefs/briefs-f.ts`, 24 briefs (brief-stoner_comedy, brief-superhero, brief-supernatural,
brief-surrealist, brief-survival, brief-swashbuckler, brief-sword_and_sandal, brief-sword_and_sorcery,
brief-techno_thriller, brief-teen, brief-thriller, brief-time_travel, brief-tokusatsu, brief-tragedy,
brief-tragicomedy, brief-true_crime, brief-vampire, brief-war, brief-werewolf, brief-western, brief-whodunit,
brief-wuxia, brief-yakuza, brief-zombie) and 48 reading ids (host, dawning, sister (two readings: Sister First and His
Father’s Sister), cost, skeptic, welcome, straight, dream, procedure, body, daughter, play, stall, servant, father,
blade, mirror, expert, town, righteous, caught, steady, fraying, weary, puzzle, scale, recruit, duty, performer, dam,
rote, guilt, brother, hunger, medic, mother, planner, fear, iron, neighbor, sleuth, danger, code, grief, elder,
regret, route, friend). About 8,700 words.

**Rewritten (8 sources, 12 strings):** brief-superhero, brief-swashbuckler, brief-sword_and_sorcery,
brief-tragicomedy, brief-true_crime, brief-war, brief-western, brief-wuxia. By kind:
- **Staged fights as instructions (6):** Holding Breath, The Customs House Stair, The Bridge Toll, The Culvert, The Teahouse
  Oath ("Mark them solo with a replica at reduced speed against the reader’s called cues, never pointing it at the lens
  or the reader; his blade goes wide off frame, so it repeats safely on every take.") and The Well At Cutbank's rifle
  ("Handle the rifle as stage-combat firearms work, … shoulder it on a mark beside his eyeline, hold it, work the lever
  and lower it …").
- **Fragments made sentences (4):** the physical notes of The Customs House Stair, The Bridge Toll, The Culvert and The
  Teahouse Oath, each a list of nouns or participles that now says what she does.
- **A passive direction (1):** Three Minutes' "comic timing is played under the grief" is "play the comic timing under
  the grief and through it".
- **A fragment in the circumstances (1):** The Register At The Starlite's "In this dramatization, a living room …" got
  its verb.

**Kept (64 sources):** the rest. The Interview In The Wet Office's and The Last Stop's "On the tape …" set descriptions
are kept as descriptions.

**Meaning-sensitive (6):** the six staging notes. Each keeps every condition it had: solo, reduced speed, the reader's
called cues, a replica never pointed at the lens or the reader, no contact, the prop on the actor's side of the frame,
the blade or the fall going off frame, and the repetition on every take.

**Interactions read whole:** each brief's pane; the allows brief (The Night Hatch) with its It Only Takes: Restrained
note, which is kept.

**Tests and tool matchers updated:** none. The Well At Cutbank's old phrasing is shared by material-b's `second-f.ts`
line 535, listed in the report.

**Checks (exits, `scratchpad/ma/b6/`):** `tsc -b --noEmit` 0; `eslint briefs-f.ts --max-warnings=0` 0; title-case 0;
label-sweep 0; plural-check 0; voice-check 0; tics 0; spelling 0; typos 0; doc-refs 0; deciders 0; guide-quotes 0;
text-inventory 0 after the marks. vitest: material-words and briefs-content, 2 files, 454 tests, exit 0.

**Screens:** BriefPane for each brief, rendered by the material-words test; on the built app, the briefs walk at the
end of the area (below).

## Batch 7: The Older Plays' Scenes (Classical, Greek, House, Meeting, Scored)

**Sources (31):** `scenes-classical.ts` 18 ([twelfth-1-5], [shrew-2-1], [scandal-2-1], [richard3-1-2], [hamlet-3-1],
[othello-4-3], [measure-2-4], [hamlet-3-4], [caesar-4-3], [caesar-2-1], [lear-4-7], [asyoulike-3-2], [dream-3-2],
[twelfth-2-4], [faustus-3], [malfi-1], [wayoftheworld-4], [stoops-2]); `scenes-greek.ts` 6 ([antigone-441],
[oedipus-300], [electra-328], [medea-446], [bacchae-451], [agamemnon-855]); `scenes-house.ts` 4 ([caesar-3-2],
[henry5-4-3], [oedipus-1], [dream-5-1]); `scenes-meeting.ts` 2 ([enemy-4], [strife-2-2]); `scenes-scored.ts` 1
([scapin-3-2]). About 15,300 words: every summary, `where`, role name, answer and reason, read against the play the
scene's comment names.

**What a scene's words are for.** The card shows the play, the author, the year, the `where` and the summary; the Table
Work shows each answer in a select and, once the piece is shown, its reason ("Why the text supports it: …" or "Why the
text doesn’t support it: …"). A reason the text doesn't support is also the teacher's note, word for word:
"<question>: <reason> You played <role> in <play>." (`noteText`, `systems/coursework.ts`). That note doesn't repeat
the answer, so a reason that only points back at it ("That’s the fourth act.") reads as a sentence with no subject.

**Rewritten (11 sources, 14 strings):** scandal-2-1, hamlet-3-4, caesar-2-1, asyoulike-3-2, dream-3-2, twelfth-2-4,
malfi-1, wayoftheworld-4 (two), stoops-2 (three), lear-4-7, faustus-3: each an unsupported answer's reason that pointed
back at the answer and said nothing else ("That’s the fourth act.", "That comes in the next act.", "This is the bargain
they strike before it."). Each now names what it means and, where the old one didn't, says what's true here: "The
screen scene is the fourth act; this one is at home with Sir Peter.", "She plays the barmaid only in the next act.",
"They aren’t married yet: this is the bargain they strike before the wedding."

**Kept (20 sources):** the rest, each with a reason naming the scene and what its words do. Every quotation from a
play stays as its edition has it (Shakespeare's, Jebb's, Murray's, Sharp's, Galsworthy's, Wall's), British spellings
included ("honourable"), and every reason is the game's paraphrase around it. Reasons of the form "That’s the third
act; here she’s alone with Angelo." are kept: their second clause says what's true here. The rest of the fix is the
note's template, school's, in `defects.md` (3) and the report.

**Meaning-sensitive (14), and how each was checked:** every new reason was read against the play: the screen scene
is IV.3 of The School for Scandal, at Joseph Surface's, and II.1 is at Sir Peter Teazle's; Gertrude drinks in V.2;
Caesar goes to the Capitol later on the Ides (II.2 to III.1); As You Like It's weddings are V.4, when Rosalind
unmasks; the Dream's wedding night is Act Five; Viola comes ashore in I.2; the Duchess is imprisoned in Act Four;
Mirabell and Millamant's first scene together is in St James's Park, Act Two, and the proviso scene is at Lady
Wishfort's; Tony Lumpkin sends Marlow and Hastings astray at the Three Pigeons in I.2, and Kate plays the barmaid from
Act Three; Gloucester is the one blinded in Lear; Faustus signs the bond in his blood in scene five.

**Interactions read whole:** a scene from set to note: the set notice ("<play>, <where>. You play <role> …"), the card,
the Table Work before and after showing, and the teacher's note for an unsupported answer.

**Tests and tool matchers updated:** none; no test or tool held the old words.

**Checks (exits, `scratchpad/ma/b7/`):** `tsc -b --noEmit` 0; `eslint` on the five scene files 0; title-case 0;
label-sweep 0; plural-check 0; voice-check 0; tics 0; spelling 0; typos 0; doc-refs 0; deciders 0; guide-quotes 0;
text-inventory 0 after the marks. vitest: `tests/material-words.test.ts` and `tests/scenes.test.ts`, 2 files, 8 tests,
exit 0.

**Screens:** CourseworkPane's Table Work and the note for every scene, both roles and every answer, rendered by the
material-words test; the walk of the built app at the end of the area shows the card for the scenes its saves have set
(Arms and the Man, Othello, King Lear).

## Batch 8: The Modern, Original And Public Scenes

**Sources (24):** `scenes-modern.ts` 11 ([hedda-2], [arms-1], [proposal], [windermere-1], [suppressed-2],
[rising-moon], [creditors], [anna-christie-1], [ghosts-1], [masterbuilder-1], [riders-sea]); `scenes-original.ts` 9
(#BY, [orig-night-desk], [orig-bed-fourteen], [orig-what-we-keep], [orig-runway], [orig-hundred-questions],
[orig-office-hours], [orig-two-time-zones], [orig-the-reception]); `scenes-public.ts` 4 ([enemy-2], [strife-1],
[justice-2], [weavers-1]). About 12,700 words.

**Rewritten (7 sources, 7 strings):**
- **"The one act" (3):** The Proposal, The Rising of the Moon and Creditors gave their `where` as "The one act, …",
  which the set notice reads as "The Proposal, the one act, the quarrel over Oxen Meadows. You play …" and the card
  as "…, the one act, …: you play …". Each is now "A one-act play, …" ("The Rising of the Moon, a one-act play, on the
  quay once the other police have gone."). The reference's own example was Trifles, in school's file; the same change
  there is in the report.
- **Reasons that pointed at nothing in the note (4):** The Master Builder ("He climbs the new tower in the last
  act."), Runway ("The bigger company wants to hire them, not sue them."), Strife ("The strike is settled in the last
  act, at five o’clock, over both their heads.") and Justice ("His own counsel is Frome, who sits down as Cleaver
  rises.").

**Kept (17 sources):** the rest, each with its own reason. #BY, "An original scene written for SLATE", stays word for
word: `tests/scenes.test.ts` holds every original scene to it, and the brief pane, the guide and the profile say the
same phrase. The original scenes' facts and reasons each name the given fact they rest on, so the Table Work can be
checked from the facts alone.

**Meaning-sensitive (4):** Solness climbs the tower in Act Three (the last act); Strife's settlement is made in Act
Three at five o'clock, by the Board and the Union over Anthony's and Roberts's heads; Frome is Falder's counsel in
Justice; Runway's facts say the larger company "has offered to hire both of them". The three `where` lines change no
fact: each play is in one act.

**Interactions read whole:** as batch 7, and the set notice's "<play>, <where>. You play …" for the three one-act
plays (`systems/coursework.ts`, line 467), read with `whereWords`, which lowercases the leading "A".

**Tests and tool matchers updated:** none. `tests/editorial-school-words.test.ts` line 42 asserts `whereWords` on the
literal 'The one act, the Wright kitchen', not on this data, so it's untouched.

**Checks (exits, `scratchpad/ma/b8/`):** `tsc -b --noEmit` 0; `eslint` on the three scene files 0; title-case 0;
label-sweep 0; plural-check 0; voice-check 0; tics 0; spelling 0; typos 0; doc-refs 0; deciders 0; guide-quotes 0;
text-inventory 0 after the marks, with `--todo2 material-a` at 0 Pending. vitest: `tests/material-words.test.ts` and
`tests/scenes.test.ts`, 2 files, 8 tests, exit 0.

**Screens:** as batch 7.

## Batch 9: The Conventions Shared With Material-B

The coordinator sent material-b's conventions so the two lines of briefs read alike, and asked for this area's to
match where they didn't. Already the same: staging notes as instructions to the actor with "your side of the frame"
and the character still she or he; a voice brief's You Speak To line naming the person; "Recorded alone …" fragments
made sentences; readings keeping their shapes and `why.beats` its one-line arc. Brought into line here (13 sources,
13 strings, `scratchpad/ma/b9/edits.json`):
- **High Wind's You Speak To** is the coordinator's wording: "Pell, the eight-year-old holding the string far below.
  Her lines aren’t in the booth, so play to her as if she were." (batch 1 had said "She isn’t in the booth with you").
  Last Launch From The Roof's already matched.
- **The Last Pool's You Speak To** is just who: "The viewer at home, watching the sequence." Batch 4 had added "Speak
  to them alone, as if no one else were listening."; The Two Of You already says the narrator speaks to one viewer.
- **Every "On the tape …" sentence** is now an instruction too, which batches 3 to 6 had kept as set descriptions: The
  Treehouse Treaty ("For the tape, play the treehouse as a cramped corner, and keep the ladder out of frame."), Night Two
  At Juniper Creek, Sunday At The Laundromat, The Pump House, Table Nine, Mile Marker 212, The Late Number Nine, The
  Interview In The Wet Office (whose "the water is imagined and played" is "imagine the water, and play it …") and
  The Last Stop.
- **Clowning, where the heading says Clown And Mask:** The Last Strip's "slapstick’s physical comedy" is "slapstick
  clowning", and The Wardrobe In Suite Nine's pratfall is named "the clowning the scene asks for", where the note had
  named only the comedy.

Seven of these sources had been kept and are now Rewritten; six were rewritten already and were read and marked again.
The area's second pass ends at **508 sources: 91 Rewritten, 417 Retained, 0 Pending, 0 Blocked**. Two retained samples
went out of `retained.md` with them.

**Checks (exits, `scratchpad/ma/b9/`):** `tsc -b --noEmit` 0; `eslint` on the five brief files 0; title-case 0;
label-sweep 0; plural-check 0; voice-check 0; tics 0; spelling 0; typos 0; doc-refs 0; deciders 0; guide-quotes 0;
text-inventory 0 after the marks. vitest: material-words and briefs-content, 2 files, 454 tests, exit 0 (the
two-situations overlap test among them, since nine of the edits are in circumstances).

**Screens:** a second build (`npm run build` exit 0, served on 4289, `cmp` exit 0, stopped by its process id), the 13
briefs opened from the Player Profile at 1440 and 390 (`screens/briefs-walk-9-1440.json`, `-390.json`): all 13 new
strings on their panes, nothing past the screen's edge at 390.
