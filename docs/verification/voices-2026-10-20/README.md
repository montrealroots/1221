# Brief 16: Contextual Writing, Distinct Voices, And Clear Information, 2026-10-20

The owner's "Contextual Writing, Distinct Voices, And Clear Information"
(`../briefs-2026-10-16/16-contextual-writing-distinct-voices-and-clear-information.txt`, kept verbatim):
- the school's feedback built from what happened, in each course's voice, varied over a long run;
- the Profile's recommendation made short, with its reasoning behind a button;
- the long explanations and the tutorial made easy to follow.

The simulation, its mechanics, the saves and the scope don't change.

## Where It Started

- **The branch:** `claude/peaceful-hamilton-59zdbb` at `d1ae7a79`. That is `main` at `74259312` (#44's merge, brief
  15) with the handoff's account of that merge, which is open as #45. There was no stash and one worktree.
- **The game's code** is `main`'s, the gate having passed on it (`../editorial-2026-10-19/runs/gate.txt`, on `aabfc1b2`,
  with the same `src/`).

## The Baseline, Before Anything Changed

`tools/voices.ts` plays seven kinds of student for fourteen months each, through the public commands, saving and
opening the save every thirty days. It records everything the school says to them as they meet it: every notice as
it's made, each showing's feedback, each director's note, each classmate's moment, and the Profile's What To Work On
Next each Sunday. `--summarize` measures what a player reads again, and `--guide` measures the tutorial and How This
Works. The baseline is in `before/`: one file a student, `summary.json`, `transcript.md` (everything in order) and
`guide.json`, made on `d1ae7a79` (`before/commit.txt`).

The seven students (seed `v16-0`): attentive; underprepared; improving (underprepared until December); regressing
(attentive until January); skilled (TEST SETUP every ability and technique at 85); under pressure (the flu and an
injury); and practicing as the Profile suggests.

| Measure | Before |
|---|---|
| Showings, with feedback | 868 |
| Distinct first sentences | 73 |
| "It came together." first | 381 (44%) |
| "It didn’t come together today." first | 220 (25%) |
| A first sentence said in one of the last five showings from the same course | 529 (61%) |
| Showing feedback said before, word for word, in the same run | 358 (41%) |
| Sentences of feedback from two or more courses | 49 |
| Showings with one of those | 837 (96%) |
| The Profile's What To Work On Next, each Sunday | 437 blocks: 674 words and 56 figures on average, at most 898 words; 9.6 sentences said twice in the same block |
| Directors' notes | 85: 19 distinct first sentences, 29 repeating one of the last five |
| Notices said again word for word in the same run | 55 of 2,698, most of them a classmate who didn't come or asked for help |
| The tutorial and How This Works | 2,305 strings: 105 of more than three sentences, 50 of five or more; 4 with "It happens" or "It does" and nothing before it to say what |

**What the transcript shows** (`before/transcript.md`):
- Every course said the same frame. A Voice I sequence, an Alexander Technique lesson and an Acting I scene each heard
  "It came together. Here’s what to try next." and then the same step beyond.
- Voice I and Alexander Technique were told "Do less. Find the moments that need nothing added, and trust the text in
  them", where there's no text.
- A note that came back said so in one fixed sentence ("This is the fourth time you’ve had this note…"), the same in
  every course.
