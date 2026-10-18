# Brief 14, The Profile Area: Defects

Functional defects found apart from the writing: what, where, how found. None fixed outside the words.

## Batch 1

None in the game's behavior. One untrue sentence, corrected as words: the ability looks of listening, imagination,
focus and adaptability said their first level came "for a life from before it" from two techniques' mean, where
`derivedAbilities` (`systems/attributes.ts`) gives every life without the value that mean, a new one included. Found by
reading `attributesOf` against the sentence.

## Batch 3

**Sleep owed printed "1 hours"** (fixed). Current Condition's Energy, Stress note said `Sleep owed ${n} hours` for any
whole number of hours, so one hour owed read "Sleep owed 1 hours", and none "Sleep owed 0 hours"
(`src/ui/workspaces/ProfileWorkspace.tsx`, ConditionPanel). Found by the health area in the before walk's text and sent
by the coordinator. Fixed with `plural` from `core/text.ts` in `sleepOwed`: "1 hour of sleep owed", "3 hours of sleep
owed", "No sleep owed". `tests/evidence-g32-ui.test.ts` holds it in a test of its own ("says the sleep owed in whole
hours, one hour singular and none as none"), which fails on the old line: one hour, 1.4, three and 0.3.

**Found by rendering the advice, fixed as words** (batch 2): "0 days ago" for a note made the same day, "it held back 0",
"about 1 points a piece" beside a brief (`heldVersusNext` printed `points` whatever the figure), and "Coming to the work
with knowing the genre short" (a label that's a gerund placed mid-phrase). Each was a sentence assembled from parts that
read wrong in one of its variants; none changed a figure.

## At The End Of The Area

None in the profile area's behavior. Two found on the built app in other areas' text, for the coordinator: on
`missed-plan.json`'s Money screen a balance of minus three dollars is written "-$3", "Its -$3, moves to …", "Chase (-$3)"
and "Balance-$3" (money area), and on `workload.json`'s School, Coursework a partner's line reads "You and Hannah had
rehearsed together 1 times." (school area). Both found by `tools/text-render-check.mjs` over the 1440 walk.

