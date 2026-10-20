# What The Second Material Area Found Apart From The Writing

No functional defect: nothing in `second-a.ts` to `second-f.ts` is read by a calculation except ids, kinds, levels, tones,
`allows`, leans and draws, and none of those changed (`m15b/skeleton.py` in the scratchpad blanks every string of each
file and finds it identical to the baseline). The briefs' tests (`tests/briefs-content.test.ts`, `tests/briefs.test.ts`,
`tests/briefs-situations.test.ts`) key on those values, and `tests/material-words.test.ts` holds the words to the pane.

## Sentences That Said Something Untrue, Fixed In The Words

Each was a wrong statement in the text, not a wrong rule, so it's fixed in the brief and recorded here as the brief asks
(section 9: a sentence that promises what the game doesn't do is a defect).

1. **Room Three Opens At Seven** (`second-d.ts`, brief-mockumentary-2, `circumstances`). "Her tour and her answers are
   improvised around fixed points: the tour, the stuck lock, and the question about who built it" made the tour both
   improvised and one of the fixed points, and the same brief's improvisation note says "The tour is written, but the
   answers are hers". Now: "You improvise her answers around three fixed points: the written tour, the stuck lock, and
   the question about who built it." Found reading the pane whole (What It Asks against Where And When).
2. **Berth Fifteen** (`second-c.ts`, brief-giallo-2, `beats[2]`). "She mentions the visitor dropped something …, and the
   reporter takes out her own": the "she" was the concierge, though "she" in every other beat is Marta, the player's
   character, so the beat read as Marta mentioning it. Now "The concierge mentions …". Found reading the beats in order.
3. **The Warm Walls** (`second-b.ts`, brief-eco_horror-2, `why.beats`). "Then her face shown to ask him out" reads as
   asking for a date; the beat is "asks him to walk out with her". Now "as she asks him to leave with her".
4. **Ahead Of The Sweep Bus** (`second-a.ts`, brief-chase-2, `why.beats`). "A last block walked with the chase called off
   by the driver chasing her" was a riddle; the beat has the driver slow down and stay behind her to the line. Now "a last
   block walked at her own pace, the bus driver holding back to let her finish".

## For The School Area, Whose Files Show These Words (`src/ui/components/BriefPane.tsx`, `PlayingChooser.tsx`)

Not fixed here: the files are the school area's (`AREAS2` in `tools/text-inventory.mjs`).

5. **The arc is shown twice on one pane.** `BriefPane.tsx`, line 174, ends the rehearsal sentence under Where It Turns with
   `{b.why.beats}`, and `PlayingChooser.tsx`, line 46 (`MaterialDemands`), ends the Tone line with `material.why.turns`,
   which `systems/briefs.ts` line 255 sets to the same `b.why.beats`. A player reads the same sentence twice, a screen
   apart, once after a line of rehearsal percentages, where it doesn't belong. Suggest dropping `{b.why.beats}` from the
   rehearsal sentence in `BriefPane.tsx`; `tests/material-words.test.ts` still finds it on the pane through the Tone line.
6. **One count, two names.** The same pane says "4 changes of tone between beats" (`BriefPane.tsx`, line 174) and "Tone:
   grave to lyric to comic, 4 transitions to play" (`PlayingChooser.tsx`, line 46). Suggest "… 4 changes of tone to play"
   in `MaterialDemands`, so the one count has one name; the class scenes share the line, and read the same way with it.
