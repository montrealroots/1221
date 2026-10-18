# Brief 14, UI Tools: The Interface Tools Read The Game's New Words (2026-10-18)

Brief 14 changed the game's words and left its rules alone. Two tools press the controls a player presses on the built
app and read the screen, and on the final commit, `fc6d03b8`, some of their checks still looked for the old words:

- `tools/acceptance-ui.mjs`: 74 of 77 passed at 1440 and at 390.
- `tools/playthroughs-ui.mjs`, brief 13's three playthroughs: `normal` passed 12 of 14, `specialist` 8 of 11 and `setback`
  3 of 9, the same at both widths.

Those eight runs' logs are in `before/`, copied from the final walk's own runs. The FAIL lines quoted below are theirs.

This pass read each failing check, the code that writes its screen, and what the screen said, then decided whether the
failure was about words, a knock-on of an earlier step, or the game not doing what the check says. It was done in the
clone `l14-uitools`, branch `l14-uitools`, from `fc6d03b8`. The tools changed in `3c69ec0e`, and the final runs are of
that commit.

**The verdict:** every failure was about words or a knock-on of one. Nine matchers in the two tools, on six sentences,
looked for a sentence brief 14 reworded. The claim each makes still holds, and each now matches the new sentence. Five
steps failed only because the step before them did. **No failure was about anything but words.** With the nine
matchers changed, every step of both tools passes at both widths. (`3c69ec0e`'s message counted seven matchers. There
were nine.)

## The Matchers Changed

Each new pattern matches the new sentence as closely as the old matched the old. No check was dropped or loosened, and
no step's title changed. Two of the old patterns were looser than their claim, and their new ones aren't (1 and 2).

| # | Where | Old | New |
|---|---|---|---|
| 1 | `tools/acceptance-ui.mjs:1313` | `/with the grain of the scene, it asks less/` | `/it suits the scene, so it asks less/` |
| 2 | `tools/acceptance-ui.mjs:1548` | `/with the grain/` (on the mark's clause) | `/it suits the scene, so it asks less/` |
| 3 | `tools/playthroughs-ui.mjs:864` | `/with the grain/` (on the mark's clause) | `/it suits the scene, so it asks less/` |
| 4 | `tools/acceptance-ui.mjs:1581` | `/once the balance it secures is paid in full/` | `/once what it was filed for is paid in full/` |
| 5 | `tools/playthroughs-ui.mjs:490` | `/Tuition/` | `/Your tuition/` |
| 6 | `tools/playthroughs-ui.mjs:578` and `:819` | `/was there\|wasn’t there\|The note/` | `/Well prepared: \|Simulated note from /` |
| 7 | `tools/playthroughs-ui.mjs:640` | `/\d+ of the \d+ pieces (shown\|due) this term so far were Unready/` | `/So far this term, \d+ of the \d+ pieces (you’ve shown\|due) were Unready/` |
| 8 | `tools/playthroughs-ui.mjs:661` | `/, due .+: about \d+\.\d \((Unready\|Working\|Strong\|Exceptional)\) shown today\./` | `/, due .+\. Shown today, it would come to about \d+\.\d \((Unready\|Working\|Strong\|Exceptional)\)\./` |

**1 to 3: the rehearsal mark for the side that suits the scene.** The steps: acceptance's roundups save, "the side
that suits it chosen and kept"; its brief save, "Melodrama played the way its scene suits"; and specialist step 4.
- **What the screen said:** "This choice is complete once it’s rehearsed to 84%: it suits the scene, so it asks less"
  (83% on the brief save).
- **What writes it:** `src/ui/components/PlayingChooser.tsx:127`. `69ab6cb3` changed it from "This one is complete at
  N% rehearsed in: with the grain of the scene, it asks less".
- **Why it's the same claim:** the sentence has three branches on `completeAt` against `PLAYING.complete`. The check
  means the first, a side that suits the scene asking less rehearsal. The new pattern is that branch's own words. The
  other two, "it goes against the scene, so it asks more" and "the scene neither favors nor resists it", don't match it.
- **Tighter than it was:** the old `/with the grain/` (2 and 3) also matched the neutral branch's old words, "neither
  with the grain nor against it". In 2, the check's `Number(mark[1]) < 90` already ruled that out. In 3 nothing did, so
  a side the scene neither favors nor resists would have passed. Now it can't.

**4: the lien's release, refused until it's paid** (acceptance's lien save, "grayed with no reason on the screen").
- **What the screen said:** "Not now: You can ask for its release once what it was filed for is paid in full.", beside
  the grayed Ask For Its Release.
- **What writes it:** `lienReleaseRefusal`, `src/engine/systems/statetax.ts:705`, put on the screen by `WhyNot` in
  `src/ui/components/LienPanels.tsx`. `6bc754b9` changed it from "once the balance it secures is paid in full".
- **Why it's the same claim:** the check is that the button is grayed (`isDisabled`, unchanged) and that the reason is in
  words on the screen. The new pattern is the reason given for an unpaid lien and for nothing else. The function's
  other refusals ("already been released", "You’ve already asked") don't match it.

**5: the registration notice** (normal step 7).
- **What the screen said:** "Your tuition, $20,375.00 a term, is covered by the tuition scholarship. The aid office
  found no financial need, so you pay the Yale Health plan, $1,882.00 a term, yourself. …"
- **What writes it:** `orient`'s `register`, `src/engine/systems/coursework.ts:1573`. `1b16d006` changed it from
  "Tuition, … a term, is met by the tuition scholarship".
- **Why it's the same claim:** the notice names the tuition and the Yale Health plan. The `/Yale Health/` half is
  unchanged. The new half is case-sensitive, as the old was, and matches the sentence that gives the tuition's figure.

**6: a showing's notice** (normal step 12, specialist step 1).
- **What the screen said:** "Well prepared: Knows The Scene, Lines, Table Work and Rehearsal. Your scene study,
  character work and emotional depth carried it. Simulated note from Acting I: …"
- **What writes it:** `show`'s strengths (`src/engine/systems/coursework.ts:1099`) and the notice
  (`:1441`). `1b16d006` changed them: until then each part well prepared was its own "X was there", and the note was
  introduced "The note (simulated feedback from …):".
- **Why it's the same claim:** the notice says which parts were well prepared, or gives the course's note. The two
  branches map one to one onto the old. "wasn’t there" has no counterpart: no notice the engine has written since
  `3d970b39` said it (`git log -S` finds it only in a scene's reading in `src/engine/content/scenes-original.ts`).

**7: the coursework warning's count** (setback step 1).
- **What the screen said:** "So far this term, 3 of the 6 pieces you’ve shown were Unready."
- **What writes it:** `termWarning`, `src/engine/systems/coursework.ts:1340`. `1b16d006` changed it from "3 of the 6
  pieces shown this term so far were Unready".
- **Why it's the same claim:** it's a count, and the two branches map one to one ("shown" to "you’ve shown", "due" to
  "due … were Unready or not shown").
- **Already in the new words:** the step's other four checks (the cause, the remedy naming Run It With A Reader, the
  pieces still to be shown, the review's day) were brought to the new words when the school area merged, and they
  passed on `fc6d03b8`. `tools/acceptance-ui.mjs:1227` already read the count this way.

**8: a Due Soonest line** (setback step 3).
- **What the screen said:** "Speech And Accents II: Sound Changes And A Text, due September 28, 2027. Shown today, it
  would come to about 49.3 (Unready). Still to finish: Drills (Drill The Sounds)."
- **What writes it:** `src/ui/components/CourseworkPane.tsx:61`. `1b16d006` changed it from "…, due September 28,
  2027: about 49.3 (Unready) shown today. Short of complete: …".
- **Why it's the same claim:** every line names the piece's day, its figure to the tenth and its band.
  `tools/acceptance-ui.mjs:1236` already read it this way.

`matchers.mjs` holds each new pattern to two things:
- it's still in its tool, word for word;
- it matches the screen's sentence and refuses its sibling sentences and the old words.

Run from the root: 6 patterns, 8 sentences matched, 15 refused, exit 0. Run against the two tools as they were at
`fc6d03b8`, it reports every pattern gone, exit 1.

## The Knock-Ons

Each failed only because an earlier step in the same run had thrown. Each passed once that step did, with its own checks
as they were.

- **`specialist` step 5**, "the take doesn’t say what the way gave": step 4 threw at the mark (3 above) before it pressed
  Play It This Way and Rehearse It On Your Feet. So the take was taped with no way of playing chosen, and the screen
  said "Rehearsal on your feet wasn’t complete, which cost Consistency 49.5 points" with no account of a way. With step 4
  passing, the take says "Played that way it suited the scene (Restrained, Suits The Scene), which gave it 0.8 points;
  your abilities and techniques cost it 18.8." That's `takeGrainWords`, `src/engine/systems/interpretation-read.ts:52`.
  The check at `tools/playthroughs-ui.mjs:876` already had those words, and it's unchanged.
- **`setback` steps 4, 5, 7 and 8:** step 3 threw at Due Soonest (8 above) before it found the scene, so the scene's id
  was empty and no card was found.
  - Step 4: "no How This Works on the scene’s card".
  - Step 5: "no Run It With A Reader on the scene".
  - Step 7: "no On The Way taken on the way to the meeting". The day loop broke on its first pass, with no card.
  - Step 8: no notice `/^Shown: (, Round [^,]+)?, …$/`. The scene's title was empty.
  All four pass with step 3 passing.
- **Checks that were never reached:**
  - Normal step 12: To Show Again's refusal "There’s new feedback on this piece. Read it, then press Mark As Read.",
    Mark As Read, Work On The Note and the feedback's band.
  - The roundups step: the choice kept through a reload, "You’ve rehearsed your current choice to N% so far (it’s
    complete at N%)".
  - The Melodrama step: the take's account, the advice's forecast, and both kept after Continue.

  On `fc6d03b8` each of these sat behind a failed matcher. Each now runs and passes in the words it already had.

On this save, setback's "scene with a partner the warning names" is Advanced Principles Of Acting Stage Combat's A
Choreographed Sequence: its Shown Today names Run It With A Reader. Brief 13's own run on `695683c4` chose the same
card, so the step plays as it did.

## Failures That Aren't About Words

None. Every failing check on `fc6d03b8` either looked for words brief 14 reworded or followed one that did. In every
case the screen did what the check says: the control was there, grayed where it should be, its reason in words on the
screen, and its figures as before.

**Seen on the way, read by no check.** Normal step 12 pressed Work On The Note on the scene shown again, and the toast
said "Work On The Note: 60 minutes, revision up 50%.". "revision" is the engine's name for the part, not a word the game
gives the player.
- **Where:** `src/ui/components/CourseworkPane.tsx:159` writes `t.dims[act.dim]?.label ?? act.dim`. The scene templates
  offer `revise` (`src/engine/content/coursework.ts:886`, part `revision`) but don't name a `revision` part in their
  `dims`, so the toast falls back to the id.
- **Not new:** brief 13's run on `695683c4` recorded the same toast, "revision up 49%".
- **Not fixed here:** it's player-facing text in the school area's sources, and this pass changed the tools only.

## The Final Runs

All on `3c69ec0e`. The build was served by `npx vite preview --port 4237`, from `npm run build` of a tree whose `src/`
is `fc6d03b8`'s (the commit changed only `tools/`). Each playthrough trace's `commit` is `3c69ec0e` and its `uncommitted`
is 0. The logs are beside this file:
- `acceptance-<width>.log`, with each run's `report.json` in `acceptance-<width>/`;
- `<playthrough>-<width>.log`, with each run's `trace.json` and milestone screenshots in `<playthrough>-<width>/`.

| Tool | Width | Result | Exit | Errors | Overflows |
|---|---|---|---|---|---|
| `acceptance-ui.mjs` | 1440 | 77 passed, 0 failed, 0 skipped | 0 | 0 | 0 |
| `acceptance-ui.mjs` | 390 | 77 passed, 0 failed, 0 skipped | 0 | 0 | 0 |
| `playthroughs-ui.mjs normal` | 1440 | 14 of 14; none of the six missing | 0 | 0 | 0 |
| `playthroughs-ui.mjs normal` | 390 | 14 of 14; none of the six missing | 0 | 0 | 0 |
| `playthroughs-ui.mjs setback` | 1440 | 9 of 9; none of the six missing | 0 | 0 | 0 |
| `playthroughs-ui.mjs setback` | 390 | 9 of 9; none of the six missing | 0 | 0 | 0 |
| `playthroughs-ui.mjs specialist` | 1440 | 11 of 11; none of the six missing | 0 | 0 | 0 |
| `playthroughs-ui.mjs specialist` | 390 | 11 of 11; none of the six missing | 0 | 0 | 0 |

`node docs/verification/language-2026-10-17/uitools/matchers.mjs` exited 0. With these files in place, 19 of the
gate's 20 checks after `validate` were run as the gate runs them, and each exited 0. Two parts weren't run: `validate`
(typecheck, lint, vitest) and `geo-check` (vite-node). Each writes a cache into `node_modules`, and the clone's
`node_modules` is a link to the main checkout's. None of them reads what changed here. Lint takes `.ts` and `.tsx` only,
the typecheck takes named `tools/*.ts` files, and no test imports either tool.

The banking journey (`playthroughs-ui.mjs banking`) wasn't run here. It fails one step on the engine's week planning
(`../journeys/defects.md`, defect 3), and that isn't a matter of words.

### The Saves

The final code wrote them, before this pass, into the clone's sibling `l14-uitools-saves/`. `specialist.json` and
`workload.json` are the playthroughs'. The rest are scenario saves that the acceptance walk opens. The first 16 hex
digits of each one's sha256:

| Save | sha256 | Save | sha256 |
|---|---|---|---|
| `brief.json` | `9d4f9ffbabc28255` | `missed-plan.json` | `23e0e7396edac44e` |
| `decision.json` | `89141975ca07ffd9` | `nonfiler.json` | `94715a160107f8f4` |
| `dir1.json` | `6a5885e7632f8e08` | `rehearsal.json` | `033b0cb08864a323` |
| `dir2.json` | `df84d1c28beddf15` | `roundups.json` | `bc65e78ce9479714` |
| `direction.json` | `44a85e4a29cf072b` | `specialist.json` | `b77e48d1bbab4558` |
| `health.json` | `559377c07c03f389` | `tax.json` | `2f63938870c6fb1e` |
| `leave.json` | `163f024a56bbb5f9` | `withdraw.json` | `b73c02eb54e5b7ac` |
| `lien.json` | `a313905f984907c0` | `workload.json` | `3f03023d61bb0b0b` |

### How To Run Them

```
npm run build && npx vite preview --port 4237 --strictPort
SLATE_BASE=http://localhost:4237 node tools/acceptance-ui.mjs OUTDIR 1440|390 SAVEDIR
SLATE_BASE=http://localhost:4237 node tools/playthroughs-ui.mjs normal|setback|specialist 1440|390 SAVEDIR docs/verification/language-2026-10-17/uitools
node docs/verification/language-2026-10-17/uitools/matchers.mjs
```
