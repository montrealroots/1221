# Material-A's Defects

Functional defects found while reading, apart from the writing. Brief 15 counts a wrong fact in a sentence, and a
sentence that promises what the game doesn't do, as defects.

## Fixed In The Words (No Behavior Was Wrong)

1. **Handover At Seven said the opposite of its scene** (`briefs-d.ts`, brief-medical_drama, `circumstances`). It said
   each overnight reading was "still inside the range that triggers a call", which reads as each reading triggering a
   call. The brief's obstacle ("Every single reading is defensible") and its reading The Case On Paper ("Each reading
   is inside range") both say no single reading does; that's the resident's whole problem. Found by reading the brief
   whole. Now: "each reading still short of the level that would trigger a call" (batch 4). The judge reads none of
   these words, so nothing played differently; `tests/material-words.test.ts` renders the new sentence on the pane.
2. **Level One, Again promised words the pane doesn't show** (`briefs-c.ts`, brief-isekai, `reader`). Under You Speak
   To it said the status panel's messages "are written into the brief for her to read and react to". `BriefPane.tsx`
   shows the brief's fields and nothing of the panel's messages; the beats give only their gist. Found by reading the
   pane's code beside the field. Now: "The floating status panel only she can see. No one answers aloud: you read its
   messages and react to them." (batch 3). No behavior depended on it.

Neither is a behavior defect, so neither has a regression test of its own; the material-words test holds both new
sentences to the pane.

## For The Coordinator

3. **A Table Work note loses its subject when it's sent** (`systems/coursework.ts`, `noteText`, the `choice` branch,
   school's file). The note for an answer the text doesn't support is "<question>: <reason> You played <role> in
   <play>." It doesn't say which answer was chosen, and most reasons were written to sit under the chosen answer on the
   card ("Why the text doesn’t support it: That’s the fourth act."). Sent as feedback, "Given Circumstances: That’s
   the fourth act. You played Lady Teazle in The School for Scandal." points at nothing. About 75 of the 555 unsupported
   reasons in this area's scenes open on "That", "It" or "This" and point back at the answer. This area rewrote the 18 that say nothing else at all
   (batches 7 and 8, "The screen scene is the fourth act; this one is at home with Sir Peter."); the rest have a second
   clause that says what's true, but still read better with the answer named. The suggested fix is one line in
   school's template: `${q.label}: you answered “${picked.text}”. ${picked.why}${as}`, with the exact assertion in
   `tests/material-words.test.ts` ("… and a cut-against reason is the note’s") moved to the same shape. Found by
   reading `noteText` while checking where the scenes' reasons appear.
