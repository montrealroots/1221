# Brief 15, The Profile Area: Defects

Functional defects found while reading the area's text, apart from the writing. A wrong number in a sentence, or a
sentence that sends the player somewhere the game doesn't, is one.

## D1. The advice sent a technique's exercise to the wrong panel (fixed)

- **What:** the advice's next hour (`nextOf`, `src/engine/systems/next-steps.ts`) said "from Practice An Hour under
  Attributes And Craft on your Player Profile" for every exercise. A technique's exercise (Copy Reading, Self-Tape
  Practice, Dialect Drill and the rest) is in the Practice column of the Techniques table, not under Attributes And
  Craft (`TechniquesPanel`, `ProfileWorkspace.tsx`). A player who followed the line for a technique looked in the wrong
  table.
- **How found:** reading the whole interaction, the advice against the Profile's two tables.
- **Fixed:** the panel is chosen by what the exercise trains (`isAbility`): "It’s in the Practice column under
  Techniques on your Player Profile" for a technique. Small, certain and in this area.
- **Test that fails without the fix:** `tests/advice.test.ts`, "PLAYER JOURNEY: the next hour names the panel its
  exercise is in, Attributes And Craft for an ability and Techniques for a technique (brief 15)", on adv-2 as taped and
  with every ability at its full. With the panel forced back to Attributes And Craft it fails ("expected 'Next:
  Self-Tape Practice at the Devel…' to contain 'It’s in the Practice column under Tec…'"), and passes with the fix.

## D2. Three of the advice's dynamic variants printed nonsense (fixed with the words)

Found by rendering the advice on four tuning cases (`b2-advice.txt`), not by reading the source:
- A forecast that hadn't moved was said as moved: "its forecast has gone from 0.8339 to 0.8339 a piece" (the figure is
  printed to four places when the change is under a thousandth). It's "its forecast is still 0.83 a piece" now.
- One piece was counted as a number: "Of the 1 piece you’ve done since, it held back 1", and, in what the forecast
  assumes, "1 was taped underprepared" and "of the piece’s genre, 1 is short of complete and 1 known better". Each says
  "it" or "the one piece" now.
- The line beside a brief compared two forecasts at the tenth, so it could say a weakness "isn’t what pays most to
  train now: … about 0.6 points a piece, against 0.6 for emotional depth", which reads as a tie it then breaks. At two
  places the figures differ as the order does (0.57 against 0.62).

None of the three changed a figure the game computes, the order of the advice or what's noted. The tuning set's whole
summary is identical to brief 14's (`advice/tuning.json` against `docs/verification/language-2026-10-17/advice/tuning-final.json`).
