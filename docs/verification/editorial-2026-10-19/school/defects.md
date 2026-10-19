# Defects The School Area Found

Brief 15's school area. Each is what, where and how found. No rule, figure, draw or save's shape changed: each below is
a sentence that said something untrue, pointed at a control that isn't there, or read wrongly in one of its variants,
fixed in its words or its assembly, with the test that holds the new words.

## Text Defects, Fixed

1. **A remedy named a button the card never shows.** `systems/coursework.ts` `remedyWords`: the partner part's remedy
   was "Rehearse With Your Partner, asked for an evening at least 2 hours ahead, or Run It With A Reader". The card
   filters the partner's own step out of its buttons (`CourseworkPane`, `activitiesOf(a).filter(…)`), and
   `needRefusal` sends it to a rehearsal agreed under Rehearsing With. The warning (A Word On Your Coursework), Due
   Soonest and Shown Today's Still to finish all said it. Now "ask your partner for an evening under Rehearsing With, at
   least two hours ahead, or Run It With A Reader". Found reading the card's code beside the warning. Held by
   `tests/language-dynamic.test.ts` and `tests/workload.test.ts`, and `screens.txt`.
2. **"Lines wasn’t complete."** `systems/evaluation.ts` `chiefLimit`: brief 14 fixed "the choices wasn’t complete" by
   giving the task's labels a verb's subject ("Learning the lines"), but `withPartLabels` puts the card's own Title
   Case labels back in for coursework ("Lines", "Drills", "Choices"), and the teacher's note and Shown Today read "Lines
   wasn’t complete". Found by `render.mts`. A card's label is now quoted as a name ("“Lines” wasn’t complete"); a
   task's own words stay bare. Held by `tests/editorial-school-words.test.ts`.
3. **"By the Close."** `conditionWords` lowered only a leading "The" of a part of the piece, so "Stamina, By The Close"
   read "your stamina running low by the Close" and "in Beat 3". Every segment name is generic (`segmentNames`,
   `beatSegments` in `systems/piece.ts`), so the whole tail is lower case now. Found by `render.mts`.
4. **"The month to make it up ran out."** `systems/courserecord.ts`: said at the deadline of an Incomplete that may
   have been extended by Ask For A Month More, when the time was two months. Now "The time to make it up ran out", and
   the course record's reason "an Incomplete not made up in time" (it was "in its month"). Found reading the extension
   beside the deadline. Held by `tests/evidence-g26-school.test.ts`.
5. **A rehearsal "moved".** `school.cancel_rehearsal` kept "You moved a rehearsal, with notice" in the partner's memory,
   where nothing is rebooked: the rehearsal is called off. Now "You called off a rehearsal, with notice". Held by
   `tests/evidence-g18-school.test.ts`.
6. **The library refusal after the School.** `systems/playreading.ts` `copyAt` refused a read with "A copy is borrowed
   from the Haas Arts Library, which lends to students.", which states a fact and never says you can't. Now "The Haas
   Arts Library lends only to students, so there’s no copy for you to borrow now." Held by
   `tests/evidence-g20-school.test.ts` and `tests/evidence-g21-school.test.ts`.
7. **"1 woman and 0 men."** `aspects` printed both sides of a published cast, so a solo play read "1 woman and 0 men".
   Now the side with no parts is left out. Held by `tests/evidence-g27-ui.test.ts`.
8. **The guide said make-up sessions are booked.** `content/guide/school.ts`, `school.repeat`'s What To Do Next: "book
   its make-up sessions now". Nothing books one: Make Up A Session does the session at once (`school.make_up` moves the
   clock). Now "press Make Up A Session now".
9. **A fit's reason in brackets.** `chiefLimit` put a misfit's label, "Expansive: Trifles doesn’t take it: it can only
   be played set, the same way every time.", whole inside brackets mid-sentence: two colons and a full stop before the
   comma. Now "(expansive; Trifles doesn’t take it: it can only be played set, the same way every time)". Found by
   `render.mts`.

## Functional Defects

None found in batch 1's sources.
