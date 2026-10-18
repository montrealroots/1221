# The Editorial Review: Defects, And What's Left

What the review found and didn't fix: a defect in behavior, a decision for the owner, or a change that needs a fact the
game doesn't have or a shape the data doesn't have. Each with where and why. The faults fixed are in `batches.md`; the
ones that were a wrong statement in words (Home's worth, a statement with no due date, a note taken that read as not
taken, one part named two ways) were words, not behavior, and are there.

## Left For The Owner Or The Coordinator

1. **A casting notice names a part cast by size as a name.** “The chair of Acting has cast you as A Leading Part In A New
   Play in the Carlotta Festival Of New Plays, …” (`systems/school.ts`, the casting's notice). The Casting tab and the
   director's note now say such a part in lower case (`partWords`, batch 3), but the notice can't: `redateCredits`
   (`systems/school.ts`) dates an old save's credits by finding each credit's part in its casting notice word for word
   (`x.text.includes(c.role)`), so the notice's part is a key the code reads back. Changing it needs `redateCredits` to
   match the part another way (by the casting's own record, say), which is a change of behavior for old saves. Found
   reading J01's notices; `grep -rn "Cast: " src`.
2. **A state's added penalty is named in prose by its Title Case label.** “You didn’t file, so Connecticut DRS assessed
   $1,542.33: …, and The Penalty For A Return DRS Made, 10% Or $50, The Greater.” (`systems/statetax.ts`, the assessment
   notice, from `StateRules.nonFiler.adds[].label` in `content/statetax.ts`; seven states' labels read the same way). The
   labels are `label:` fields, which `tools/label-sweep.mjs` holds to Title Case, and the notice is their only reader. A
   prose field beside each (`said: 'a penalty of 10% or $50, whichever is greater, for a return DRS made'`) is a change
   of the data's shape, for the papers area. Found in the scenario saves' notices (`lien`, `nonfiler`, `tax`).
3. **The research text's straight apostrophes.** Card security and the fraud law, shown on Money's Cards tab, are research
   text written into `content/security.ts` as `JSON.parse("…")`: “the customer's reply”, “the Electronic Fund Transfer
   Act's Regulation E”, “aren't reported”, “a cardholder's liability”. The house's apostrophe is ’ (`docs/STYLE.md`,
   Voice). The research data's punctuation is the data pass's (`prompts/data.md`, its dates and punctuation), working in
   its own clone now, so it was left to it rather than edited twice. Found on the walk's Money, Cards tab.
4. **A role named “Bottom, As Pyramus”.** The mechanicals' play in A Midsummer Night's Dream gives two roles as
   `name: 'Bottom, As Pyramus'` and `'Flute, As Thisbe'` (`content/scenes-house.ts`), so a notice reads “You play Bottom, As
   Pyramus, and Chloe Carter plays Flute, As Thisbe.” The name is shown in tables in Title Case too, and is the material
   area's; “Bottom, as Pyramus” in the data would read right in both, if the label sweep allows a name's “as”. Found in
   J01's notices.
5. **A teacher's note that didn't come together reads as the evaluation.** “Simulated note from The Greeks: It didn’t
   come together today. Your Composure held back Consistency by 32.1 points.” is the school area's: an ability and a
   quality by the screen's names, and the points it cost. It's accurate and labelled simulated; it is also the one place
   the teacher's voice gives a figure where a player needs a consequence, and capitalises an ability mid-sentence where
   the director's note says “Work on your composure”. Rewording it into a teacher's sentence without losing the figure is
   a decision about the feedback's voice for the school area and the owner (`docs/STYLE.md`, Faculty feedback).
6. **The Profile's advice and its record are dense.** “On your recent work, replayed with you as you are now, that’s
   forecast to be worth about 0.8 points a piece (3 of your last 5 pieces call on it; A Voice Sequence would gain most,
   about +1.3).” and “From: An ability, 142 points in all.” are the profile area's, each a figure the advice rests on, and
   each true. They're the densest prose a player meets; a drill-down (the brief's “precise details available through
   drill-downs”) would let the line say only what to do. A design decision, left.

## Behavior Noticed, Not A Writing Fault

- **Notes from a production's director that aren't weaknesses.** Looking Back says “What’s still open goes with you into
  class.” whenever a note is open, but a note on the director's request (`focus.kind === 'direction'`) isn't carried into
  the class's notes (`reflect` skips it). A run whose only open note is a direction says something goes into class that
  doesn't. The words were kept as they were, since saying which notes go needs the same filter; whether a direction should
  go into class is the school area's call. Found reading `reflect` for batch 3.
