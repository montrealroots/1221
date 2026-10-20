# Edits For Other Areas

## material-b (second-a..f.ts): the same conventions, for one voice across a genre's two briefs
- second-b.ts:293 reader: 'The voice speaks to Wren, twelve, a scavenger with a chisel, whose lines aren’t in the booth; the actor plays to her as if she were.' -> 'Wren, twelve, a scavenger with a chisel. She isn’t in the booth with you, so play to her as if she were.'
- second-b.ts:307 techniques: 'Recorded alone at a microphone before the animation exists, it asks for voice-over. …' -> 'You record alone at a microphone before the animation exists, so it asks for voice-over. …' (dangling participle)
- second-d.ts:301, 476, 615 reader: '…; the voice speaks to them alone, at the microphone.' / '…; she speaks to them alone, at the microphone.' -> '<who>. Speak to them alone, as if no one else were listening.' (as The Last Pool's, briefs-d)
- second-a.ts:373 techniques: 'The number is sung and danced in the scene itself, part of the show being made: …' -> 'She sings and dances the number in the scene itself, as part of the show: …'
- second-b.ts:55 timing: '… On the tape she …' staging -> 'For the tape, …' as an instruction (as The Count-In's, briefs-b)
- second-b.ts:422 techniques: 'The scene is improvised to an outline, playing close to yourself …: improvisation, …' -> 'You improvise the scene to an outline, playing close to yourself …' (the label already names the technique)
- second-c.ts:165 techniques: 'The narration is an account given afterward, played as voice-over …, so it’s played to a microphone …' -> 'The narration is her account afterward, so play it as voice-over …; you record it off camera in the same session, to a microphone …'
- second-c.ts:220 improvisation: '… leaves every word to the take, the way the form is made.' -> '… leaves every word to you as you tape, the way found footage is made.'
- second-c.ts:713 techniques: '… and the accent is played as the way …' -> '… Play the accent as the way …'
- second-d.ts:407 techniques: '… recorded in the same session and laid over …' (passive staging; as The Night Line's)
- second-e.ts:259 techniques and second-f.ts:174 techniques: '… marked solo at reduced speed …, never pointed at the lens or the reader …' -> 'Mark it solo at reduced speed …, never pointing it at the lens or the reader …' (every staged fight in briefs-a..f now says it this way)
- second-f.ts:535 techniques: 'The rifle is handled as stage-combat firearms work with a replica, …: brought up to a mark off frame, …' -> 'Handle the rifle as stage-combat firearms work, with a replica …: bring it up to a mark …' (as The Well At Cutbank's, briefs-f)
- Every second brief's staged fight or intimacy: "on her side of the frame" in an instruction -> "on your side of the frame".

## school (systems/coursework.ts, content/coursework.ts)
- coursework.ts noteText, the choice branch: `${qo?.q.label ?? 'A choice'}: ${picked?.why ?? …}${as}` -> name the answer: `${q.label}: you answered “${picked.text}”. ${picked.why}${as}`, and tests/material-words.test.ts's exact note assertion to the same shape (defects.md, 3).
- content/coursework.ts:354 trifles where: 'The one act, the Wright kitchen' -> 'A one-act play, set in the Wright kitchen' (the reference's own example; this area's three one-act scenes now say "A one-act play, …"). tests/editorial-school-words.test.ts:42 asserts whereWords on the literal, not on the data, so it needn't change.
- content/coursework.ts:719 romeo-2-2 no('tomb', 'The Capulet tomb', 'That’s the last act.') -> 'The tomb scene is the last act; this is the orchard.' (as this area's bare reasons, batches 7 and 8). Other coursework.ts reasons opening on 'That’s …' read better once the note names the answer.
