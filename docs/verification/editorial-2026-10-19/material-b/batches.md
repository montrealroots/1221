# The Second Material Area's Batches

Brief 15, the area material-b (`../prompts/material-b.md`), 2026-10-19, on `ed15-material-b` from the pass's baseline
`6d111b49`. The area is the second set of practice briefs, `src/engine/content/briefs/second-a.ts` to `second-f.ts`:
149 briefs, 492 sources (a source per brief, holding its scene, beats and reasons, and a source per reading id), 74,123
words, all Pending in the second pass at the start. One file is one batch.

## How The Briefs Reach The Player

The brief's pane (`src/ui/components/BriefPane.tsx`) shows every field of a brief, read for this pass before any edit:
- the title, the logline, and under The Scene: Where And When (`circumstances`), The Two Of You (`relationship`), You
  Play (`you`), The Reader Plays or, for a voice brief, You Speak To (`reader`), What You Want (`objective`) and What’s In
  The Way (`obstacle`);
- Where It Turns: each beat's `what`, then the rehearsal sentence with `why.beats` after it;
- What It Asks (`MaterialDemands` in `PlayingChooser.tsx`): the language line with `why.language` after a colon, each
  feature at a level with `why.<feature>` after a full stop, the Tone line with `why.beats` again, Techniques It Asks
  with `why.techniques`, and It Only Takes with `why.allows`. A side the brief doesn't allow also shows "<title> doesn’t
  take it: <why.allows>" (`systems/material.ts`, `misfitOf`);
- Your Reading: "<label>. <reading> It rests on: <rests> Fully prepared, it would come to … for you now."

Nothing reads these words for a calculation: the judge keys on ids, tones, levels and leans. `grep -rlF` of the first and
last 40 characters of every old string in `src tests tools base44` found them only in the brief files themselves (and,
once, a phrase shared with `briefs-a.ts`). No test or UI tool matcher held any of them, so none changed.
`tests/material-words.test.ts` renders the pane for all 298 briefs and finds every field whole, after the heading's
`. ` or `: `, and fails a doubled stop, a space before a stop, a leaked value or a field that doesn't end as a sentence.

## The Conventions This Area Set

For the material-a area and the coordinator, so the two halves of the briefs agree:
- **A staging note is a direct instruction to the actor**, in the imperative, and the actor's own mark, eyeline, frame
  and headphones are "your": "Mark its four moves solo, at reduced speed, against the reader’s called cues from off
  camera, with no contact." "Play his hand on the strap in your body." The character stays she or he: "React to the hit
  on her shoulder." Every safety term the glossary lists is kept word for word (marked solo, at reduced speed, called
  cues, replica, eyeline, off camera, staged intimacy, intimacy coordinator), and "on her side of the frame" becomes "on
  your side of the frame" where it's an instruction.
- **A voice brief's `reader` names who you speak to, not "The voice speaks to …"**: the pane already heads it You Speak
  To. "Kenta, her brother, eleven, already recorded on the track. Play against his lines and his frightened breathing in
  your headphones." A brief with no one to speak to says so: "No one. You follow the score on the stand, …"
- **"Recorded alone at a microphone."** as a closing fragment becomes "You record it alone at a microphone."
- **A reason after a heading is a sentence with a subject.** "Academic argument in the formal register of a 1924
  examination, …" becomes "She argues in the formal register of a 1924 examination, …"; a passive about her own action
  ("the fast version is rewritten on the spot") becomes hers ("She rewrites the fast version on the spot").
- **A beat says what happens**, with a verb. The one beat of five in Column Nine that had none got one.
- **Kept as a shape:** `why.beats`, the arc in a line of phrases ("A slow start in the half dark, a memory used to hold
  him, a fight she wins by not finishing it, then a laugh and a debt paid in work."). It recaps beats the player has just
  read, numbered, above it, so the phrases have their context; each was read for clarity and a cryptic one rewritten
  (The Sweep Bus's "the chase called off by the driver chasing her"). Kept too: a score's or a catalog's beats named by
  their page or room ("The dots: short, separate sounds, tried out like steps on ice."), since the piece is those pages.
- **Readings keep their own shapes.** None was forced to open "She plays it as …": a reading says what the scene is,
  played that way, in a sentence, and the shapes vary, as `tools/tics.mjs` asks. A reading was rewritten where a passive
  hid who acts ("every form is performed as if it were being handed on") or a pronoun pointed two ways.
- **Take** stays where it's the self-tape's or the film's own word ("You find the rest on the take"), and goes where it
  was production shorthand a player had to decode ("The animators cut the scene to the take").

## Batch 1: `second-a.ts`

**Sources (85):** 25 briefs and 60 reading sources (two of them, [teacher] and [promise], hold two readings each):
[brief-action-2] [corner] [champion] [roof] [brief-absurdist-2] [escape] [relief] [brief-action_comedy-2] [book] [stunt]
[kid] [brief-adventure-2] [mother] [silence] [brief-alternate_history-2] [calm] [world] [names] [brief-animated-3]
[weight] [teacher] [proud] [brief-anime-2] [strain] [sister] [brief-anthology-2] [frame] [glove] [brief-apocalyptic-2]
[ordinary] [promise] [brief-art_house-2] [close] [voice] [found] [brief-avant_garde-2] [score] [freed]
[brief-backstage_musical-2] [sell] [hers] [company] [brief-biker-2] [business] [family] [brief-biographical-2] [mind]
[record] [room] [brief-black_comedy-2] [deadpan] [goodbye] [brief-blaxploitation-2] [cool] [garland] [brief-body_horror-2]
[lesson] [becoming] [marriage] [brief-buddy_comedy-2] [poles] [laugh] [brief-buddy_cop-2] [cover] [team] [brief-caper-2]
[bait] [hero] [brief-chanbara-2] [line] [painter] [brief-chase-2] [pace] [husband] [race] [brief-childrens-2] [jealous]
[friend] [brief-christmas-3] [live] [suit] [brief-comedy-2] [list] [horn] [tess].

**Rewritten (24 sources, 48 strings):** 19 briefs (action-2, absurdist-2, action_comedy-2, adventure-2,
alternate_history-2, animated-3, anime-2, anthology-2, art_house-2, avant_garde-2, backstage_musical-2, biographical-2,
body_horror-2, buddy_comedy-2, buddy_cop-2, chanbara-2, chase-2, christmas-3, comedy-2) and 5 readings ([weight],
[frame], [record], [line], [live]). By kind: 14 staging notes made direct instructions (every fight, struggle, dance,
prop and eyeline note); 4 voice briefs' `reader` fields; 5 passives about the character's own action; 5 verbless
reasons after a heading; 4 circumstances that closed on a recording fragment or a passive staging note; one beat with
no verb; one cryptic arc (chase-2); anthology-2's "segment", the film's "story" everywhere else in the brief; and 5
readings where a passive or a two-way pronoun hid the idea.

**Kept (61):** six briefs whole (apocalyptic-2, biker-2, black_comedy-2, blaxploitation-2, caper-2, childrens-2), whose
reasons were already sentences in the scene's terms, and 55 readings, each said in one sentence of what the scene is,
played that way, resting on facts the brief states. Each status names its brief or reading and what it does well
(`docs/text/second-pass/material-b.json`; a sample in `retained.md`).

**Meaning-sensitive, and how each was checked:**
- The staging notes (action-2, action_comedy-2, adventure-2, body_horror-2, buddy_comedy-2, chanbara-2, chase-2,
  christmas-3): each instruction says what the old note described, and no safety term was dropped. Read against the
  file-head rule in `briefs/types.ts` (taped alone, to a reader off camera; nothing touches the reader; a weapon is a
  replica). adventure-2's "never taken" (his hand on the strap) is said as "nobody takes hold of you": the reader is off
  camera and never touches the actor.
- buddy_comedy-2's techniques note now names clowning: the brief's `techniques` are `{ clown: 2, comedy: 1 }`, and the
  pane heads the note "Techniques It Asks: Clown And Mask, Comedy".
- alternate_history-2's `reader`: "computers" there were always the hall's two hundred people (the logline: "two
  hundred people compute the weather by hand"); the new words say so once.
- chase-2's arc: the last beat has the bus driver slow down and stay behind her to the line, which the new words say.
- No id, level, tone, lean, draw, `allows` value or list order changed: the diff touches only string values of `why`,
  `reader`, `circumstances`, `beats[].what` and `readings[].reading`.

**Interactions read whole:** for each brief, the pane top to bottom as the player meets it: the logline, The Scene, Where
It Turns and its rehearsal sentence, What It Asks (each heading with its reason), Your Reading with each reading's rests,
then It Only Takes and the misfit line where a brief has `allows` (anthology-2, art_house-2). Rendered for every brief of
the file: `rendered/second-a.txt`.

**Tests and tool matchers updated:** none held the old words.

**Checks** (scratchpad `m15b/b1-checks/`, each exit read from a file): tsc 0, eslint (second-a.ts) 0, title-case 0,
label-sweep 0, plural-check 0, voice-check 0, tics 0, spelling 0, typos 0, doc-refs 0, deciders 0, guide-quotes 0;
vitest `tests/material-words.test.ts tests/briefs-content.test.ts` 0 (2 files, 454 tests). text-inventory 1 before the
marks (the 24 changed sources Pending, as expected) and 0 after them. Engine-speak in material fell from 120 to 118 ("a
segment" and "the take’s sound").

**Screens verified:** BriefPane for all 25 briefs of the file, rendered by `tests/material-words.test.ts` and kept as text
in `rendered/second-a.txt`. The built app comes once the text is done (`batches.md`, The Area's End).

## Batch 2: `second-b.ts`

**Sources (78):** 25 briefs and 53 reading sources ([boy] holds two readings): [brief-coming_of_age-2] [free] [losing]
[brief-concert_film-2] [pro] [song] [wings] [brief-conspiracy_thriller-3] [ledger] [nerve] [name] [brief-cosmic_horror-2]
[record] [tomas] [peace] [brief-costume_drama-2] [robe] [caution] [brief-courtroom_drama-2] [right] [parents]
[brief-creature_feature-2] [measure] [stubborn] [brief-crime-2] [boy] [game] [brief-cyberpunk-2] [buyback] [keeper]
[brief-dance-2] [promise] [two] [brief-dark_fantasy-2] [mercy] [voices] [brief-detective-2] [minute] [heard] [guilt]
[brief-disaster-2] [anchor] [listener] [brief-docudrama-2] [delegate] [door] [brief-docufiction-2] [rules] [offers]
[brief-documentary-2] [film] [him] [brief-domestic_drama-2] [sewing] [son] [brief-drama-2] [own] [brief-dystopian-2]
[spelling] [sent] [brief-eco_horror-2] [out] [pulled] [brief-epic-2] [soldier] [orchard] [brief-erotic_thriller-2] [vote]
[want] [brief-espionage-2] [never] [trust] [brief-experimental-2] [list] [her] [brief-exploitation-2] [cool] [afraid].

**Rewritten (20 sources, 42 strings):** 18 briefs (concert_film-2, conspiracy_thriller-3, cosmic_horror-2,
costume_drama-2, creature_feature-2, dance-2, dark_fantasy-2, disaster-2, docudrama-2, docufiction-2, documentary-2,
dystopian-2, eco_horror-2, epic-2, erotic_thriller-2, espionage-2, experimental-2, exploitation-2) and 2 readings
([ledger]'s rests, a fragment after "It rests on:", and [nerve]). By kind: 10 staging notes made instructions (the
syringe, the waltz, the spear drill, the two staged-intimacy notes, the dip that's never a fall); 5 voice briefs'
`reader` fields; 8 passives about who calls, records or chooses (the reader calling cues, she placing each pause); 5
reasons and 4 beats without a verb; 2 circumstances that closed on a recording fragment; one dangling participle
(dark_fantasy-2's "Recorded alone …, it asks"); and eco_horror-2's arc, whose "her face shown to ask him out" read as a
date.

**Kept (58):** seven briefs whole (coming_of_age-2, courtroom_drama-2, crime-2, cyberpunk-2, detective-2,
domestic_drama-2, drama-2) and 51 readings.

**Meaning-sensitive, and how each was checked:**
- The staging and safety notes (concert_film-2, creature_feature-2, dance-2, docudrama-2, epic-2, erotic_thriller-2,
  exploitation-2): each instruction keeps every condition of the old note (the capped prop syringe and the sound cue;
  nobody partners the waltz; the dip is "never a fall"; the replica spear aimed past the lens; the intimacy coordinator,
  the solo embrace and "never touching the reader"), read against `briefs/types.ts`'s staging rule.
- conspiracy_thriller-3's `reader`: the brief has no reader and she speaks into her phone for the reporter; the new
  words say both, the reporter first, since the heading is You Speak To.
- [ledger]'s rests now names the reporter's request ("names, dates and amounts, in order"), which the circumstances
  state, and the first beat ("as plainly as the first line of a ledger").
- eco_horror-2's arc: the last beat is "asks him to walk out with her", which the arc now says.
- Only string values changed: `m15b/skeleton.py` (scratchpad) blanks every string and finds the file identical to HEAD;
  the changed strings sit under `why`, `reader`, `circumstances`, `beats[].what`, `readings[].reading` and `rests`.

**Interactions read whole:** each brief's pane top to bottom, as in batch 1; the allows notes and their misfit line for
docufiction-2 (open) and experimental-2 (set). Rendered: `rendered/second-b.txt`.

**Tests and tool matchers updated:** none held the old words.

**Checks** (scratchpad `m15b/b2-checks/`): tsc 0, eslint (second-b.ts) 0, title-case 0, label-sweep 0, plural-check 0,
voice-check 0, tics 0, spelling 0, typos 0, doc-refs 0, deciders 0, guide-quotes 0; vitest `tests/material-words.test.ts
tests/briefs-content.test.ts` 0 (454 tests). text-inventory 1 before the marks (the changed sources Pending) and 0 after.

**Screens verified:** BriefPane for all 25 briefs of the file, rendered and kept in `rendered/second-b.txt`.

## Batch 3: `second-c.ts`

**Sources (86):** 25 briefs and 61 reading sources ([pro], [party] and [pride] hold two readings each):
[brief-fairy_tale-2] [vain] [keeper] [bell] [brief-family-2] [pro] [son] [spotter] [brief-fantasy-2] [race] [price] [meet]
[brief-farce-3] [ledger] [doors] [believer] [brief-film_noir-3] [hands] [working] [tired] [brief-folk_horror-2] [grief]
[outsider] [win] [brief-found_footage-2] [party] [letter] [brief-gangster-2] [business] [fear] [brief-giallo-2] [story]
[next] [brief-gothic_horror-3] [record] [door] [hand] [brief-grindhouse-2] [calm] [stunt] [brief-hangout-2] [company]
[alone] [brief-heist-2] [pass] [pride] [brief-historical_drama-2] [facts] [neighbor] [brief-historical_fiction-2] [guilt]
[gift] [brief-holiday-2] [policy] [boy] [brief-hood_film-2] [place] [nod] [brief-horror-2] [steady] [eli]
[brief-horror_comedy-2] [show] [made] [kids] [brief-isekai-2] [fan] [author] [word] [brief-jidaigeki-2] [rule] [face]
[spear] [brief-jukebox_musical-3] [floor] [chair] [uncle] [brief-kaiju-2] [waiting] [customer] [brief-kitchen_sink-2]
[sister] [brief-legal_drama-2] [advocate] [fond] [two].

**Rewritten (20 sources, 55 strings):** 18 briefs (fairy_tale-2, family-2, fantasy-2, farce-3, film_noir-3,
found_footage-2, giallo-2, gothic_horror-3, grindhouse-2, hangout-2, heist-2, holiday-2, horror-2, horror_comedy-2,
isekai-2, jidaigeki-2, jukebox_musical-3, kitchen_sink-2) and 2 readings ([doors]'s rests, a fragment, and [chair], a
passive). By kind: 13 circumstances whose closing "On the tape …" or "Recorded alone …" staging became an instruction or
a sentence; 4 voice briefs' `reader` fields and gothic_horror-3's, which mixed speaking and writing; 2 dangling
participles ("Voiced alone …, it’s all voice-over"); 11 verbless reasons and beats (film_noir-3's two narration beats
among them); and techniques notes where a technique "carried" a list of passive participles (farce-3, jidaigeki-2,
grindhouse-2), each now said as what the scene asks for, with its staging as instructions.

**Kept (66):** seven briefs whole (folk_horror-2, gangster-2, historical_drama-2, historical_fiction-2, hood_film-2,
kaiju-2, legal_drama-2) and 59 readings.

**Meaning-sensitive, and how each was checked:**
- giallo-2's third beat said "She mentions the visitor dropped something … and the reporter takes out her own": the
  "she" was the concierge (the beat before it is "The concierge describes the visitor"), while "she" in every other beat
  is Marta, the player's character. The beat now names the concierge. The facts (berth fourteen, her own ticket) are
  unchanged.
- giallo-2's "as many in the form were" now names the form, giallo films; the claim (shot without sound) is the brief's.
- The staging notes (farce-3, grindhouse-2, jidaigeki-2): each keeps the old conditions word for word (marked solo, half
  or reduced speed, called cues, reacted to and never made, angled away from the lens and the reader's eyeline, the sword
  never shown, set on floor marks).
- Only string values changed (`m15b/skeleton.py`).

**Interactions read whole:** each pane top to bottom; the allows notes and misfit lines for found_footage-2 and hangout-2
(open) and giallo-2 (set). Rendered: `rendered/second-c.txt`.

**Tests and tool matchers updated:** none held the old words.

**Checks** (scratchpad `m15b/b3-checks/`): tsc 0, eslint 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0,
tics 0, spelling 0, typos 0, doc-refs 0, deciders 0, guide-quotes 0; vitest (material-words, briefs-content) 0, 454 tests.
text-inventory 1 before the marks and 0 after.

**Screens verified:** BriefPane for all 25 briefs of the file, rendered and kept in `rendered/second-c.txt`.

## Batch 4: `second-d.ts`

**Sources (81):** 25 briefs and 56 reading sources ([cool] holds two readings): [brief-magical_realism-2] [routine]
[messenger] [brief-martial_arts-2] [restraint] [brother] [endure] [brief-medical_drama-2] [steady] [witness]
[brief-melodrama-2] [storm] [child] [pride] [brief-military-2] [light] [reach] [brief-mockumentary-2] [sell] [invent]
[dream] [brief-monster_movie-2] [leader] [terror] [brief-mumblecore-2] [cool] [hoping] [brief-musical-2] [number] [love]
[brief-mystery-2] [reasoner] [student] [cornered] [brief-nature_documentary-2] [storyteller] [clock] [brief-neo_noir-2]
[confession] [brief-neorealism-2] [plain] [house] [brief-new_wave-3] [narration] [waiting] [brief-nordic_noir-2] [method]
[town] [brief-occult-2] [business] [pulled] [brief-parody-2] [straight] [epic] [brief-period_drama-2] [ledger] [widow]
[brief-picaresque-2] [raconteur] [tired] [breath] [brief-police_procedural-2] [procedure] [strain]
[brief-political_drama-2] [orator] [conscience] [walt] [brief-political_thriller-2] [neutral] [defiance]
[brief-post_apocalyptic-2] [teacher] [future] [brief-prison_film-2] [rules] [kid] [brief-psychological_horror-2]
[together] [loop] [awake].

**Rewritten (16 sources, 39 strings):** 16 briefs (martial_arts-2, medical_drama-2, military-2, mockumentary-2,
monster_movie-2, mumblecore-2, nature_documentary-2, neo_noir-2, neorealism-2, new_wave-3, parody-2, picaresque-2,
police_procedural-2, political_thriller-2, prison_film-2, psychological_horror-2); no reading needed it. By kind: 10
circumstances (staging made instructions, martial_arts-2's "On the tape" brought to the "For the tape," every other
brief now opens with, and two improvised-talk passives given their subject); 11 verbless beats (the
nature documentary's shots, the noir narrator's first two beats, four of the picaresque's six voice notes, the new wave's
talk and closing narration); 4 voice briefs' `reader` fields ("the voice speaks to them alone, at the microphone");
political_thriller-2's and psychological_horror-2's `relationship`, which used the same stock phrase under The Two Of
You; and 12 reasons (staging, a passive or a fragment).

**Kept (65):** nine briefs whole (magical_realism-2, melodrama-2, musical-2, mystery-2, nordic_noir-2, occult-2,
period_drama-2, political_drama-2, post_apocalyptic-2) and all 56 readings. Kept as written: parody-2's beats, named as a
trailer's sections ("The opening: a building, a season, and a schedule that changed everything."), since a trailer is
those sections, and its `relationship`, where "The voice" is the character (You Play: The trailer voice).

**Meaning-sensitive, and how each was checked:**
- mockumentary-2's circumstances said "Her tour and her answers are improvised around fixed points: the tour, …", which
  made the tour both improvised and fixed; its improvisation note says "The tour is written, but the answers are hers".
  The circumstances now agree: "You improvise her answers around three fixed points: the written tour, the stuck lock,
  and the question about who built it." The brief's `improvisation: 2` and the readings are untouched.
- prison_film-2's "the lights-out is played, not made, and the frame stays lit" is now "Act the lights going out without
  dimming them: the frame stays lit": the same staging, said as what to do.
- neorealism-2's "the labor has to read as real" is "has to look real": reads was the judge's verb, and the sentence is
  about what the camera sees.
- The fight and contact notes (martial_arts-2, monster_movie-2): no contact, reduced speed, the open-handed stop and the
  reader's called attacks are kept.
- Only string values changed (`m15b/skeleton.py`).

**Interactions read whole:** each pane top to bottom; no brief in the file has `allows`. Rendered: `rendered/second-d.txt`.

**Tests and tool matchers updated:** none held the old words.

**Checks** (scratchpad `m15b/b4-checks/`): tsc 0, eslint 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0,
tics 0, spelling 0, typos 0, doc-refs 0, deciders 0, guide-quotes 0; vitest (material-words, briefs-content) 0, 454 tests.
text-inventory 1 before the marks and 0 after.

**Screens verified:** BriefPane for all 25 briefs of the file, rendered and kept in `rendered/second-d.txt`.

## Batch 5: `second-e.ts`

**Sources (78):** 25 briefs and 53 reading sources ([exact] and [pride] hold two readings each):
[brief-psychological_thriller-3] [exact] [detail] [studying] [brief-queer_cinema-2] [title] [teammate] [brief-revenge-2]
[stacked] [straight] [brief-road_movie-2] [pitch] [gift] [brief-rockumentary-2] [show] [song] [brief-romance-2] [nerve]
[knew] [brief-romantic_comedy-2] [bet] [questions] [brief-romantic_drama-2] [listen] [plan] [brief-samurai-3] [pride]
[hunger] [haggle] [brief-satire-2] [company] [sees] [brief-science_fantasy-2] [letter] [surety] [brief-science_fiction-2]
[record] [sister] [afraid] [brief-screwball_comedy-2] [liar] [caught] [brief-sea_adventure-2] [command] [shipmate]
[brief-silent_film-3] [calls] [own] [eyes] [brief-slapstick-2] [sport] [father] [brief-slasher-2] [medic] [terror]
[brief-slice_of_life-2] [properly] [tour] [brief-social_realism-2] [braced] [angry] [brief-space_opera-2] [order]
[goodnight] [enemy] [brief-spaghetti_western-2] [books] [dare] [brief-splatter-2] [farmer] [alone] [brief-sports-2]
[honest] [brief-spy-2] [breath] [brief-steampunk-2] [hands] [forgive].

**Rewritten (21 sources, 33 strings):** 21 briefs (psychological_thriller-3, revenge-2, road_movie-2, rockumentary-2,
romance-2, romantic_drama-2, samurai-3, satire-2, science_fantasy-2, science_fiction-2, screwball_comedy-2,
sea_adventure-2, silent_film-3, slapstick-2, slasher-2, slice_of_life-2, space_opera-2, spaghetti_western-2, splatter-2,
spy-2, steampunk-2); no reading needed it. Sixteen of the 33 strings are the closing "For the tape …" sentence of a
circumstances field, each now said to the actor; the rest are passives, fragments, one verbless beat (samurai-3's fight)
and three techniques notes.

**Kept (57):** four briefs whole (queer_cinema-2, romantic_comedy-2, social_realism-2, sports-2) and all 53 readings.

**Meaning-sensitive, and how each was checked:**
- slapstick-2's techniques are `{ clown: 2, combat: 2, comedy: 1 }` and the note named only comic timing; it now ties
  clowning to the rope, the hat and the wand and stage combat to the stunt fall onto the hidden crash mat. The fall's
  conditions (backward, onto the mat, rehearsed slowly first, repeatable) are kept.
- screwball_comedy-2's techniques are `{ comedy: 2, clown: 1 }`; "physical comedy" is now "clowning: physical comedy …",
  the glossary's word for Clown And Mask.
- sea_adventure-2's "each has to be held exactly as long as it lasts" said nothing; the two waits (the laugh, the wind)
  are now "he can’t hurry either one", which is what the beats ask (the laugh waited for, the wind that never comes).
- splatter-2's staging keeps the stage blood optional ("or not at all"), the creature below the lens and the shovel out
  of frame; slasher-2's keeps the replica cleaver and where it never points.
- Only string values changed (`m15b/skeleton.py`).

**Interactions read whole:** each pane top to bottom; the allows notes and misfit lines for science_fiction-2 (open) and
spy-2 (set). Rendered: `rendered/second-e.txt`.

**Tests and tool matchers updated:** none held the old words.

**Checks** (scratchpad `m15b/b5-checks/`): tsc 0, eslint 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0,
tics 0, spelling 0, typos 0, doc-refs 0, deciders 0, guide-quotes 0; vitest (material-words, briefs-content) 0, 454 tests.
text-inventory 1 before the marks and 0 after.

**Screens verified:** BriefPane for all 25 briefs of the file, rendered and kept in `rendered/second-e.txt`.
