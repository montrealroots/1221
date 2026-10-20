# The Tutorial Area's Defects

Brief 15, the tutorial area. A functional defect found while reading the guide's text, apart from the writing: what,
where, how it was found, and whether it was fixed here. A wrong claim in a sentence is a defect too.

## 1. How This Works' Show Everything Toggle Changed Its Name And Said It Was Pressed (Fixed)

- **What:** an entry's toggle was Show Everything, and pressed, Fold It Up, with `aria-pressed` on. A screen reader
  said “Fold It Up, pressed” with every section open: a toggle whose name changed with its state, which the WAI-ARIA
  Authoring Practices' Button pattern rules out, and the project fixed for Play and Pause on 2026-10-13
  (`ui/shell/TimeControls.tsx`).
- **Where:** `src/ui/guide/Help.tsx`, `Entry`.
- **Found:** reading the toggle's two labels for the rename Fold It Up → Show Less, against the Play and Pause comment.
- **Fixed:** the label says what a press does (Show Everything, Show Less) and the button has no pressed state.
  `tests/help-mechanics.test.ts`, 'Show Everything and Show Less name what a press does, with no pressed state', fails
  with `aria-pressed` put back (run on 2026-10-19: 1 failed).

## 2. How You Are Said An Injury Wore Condition Down (Fixed)

- **What:** the chapter said “Condition is how fit your body is for work today, after illness, injury and rest.” An
  injury raises stress and lowers morale and leaves condition as it was (`mayHurt`, `systems/injury.ts`). Illness,
  hunger, stress over 75 and short nights wear it down (`life.ts`, `health.ts`), as `docs/GLOSSARY.md`'s condition row
  has said since brief 14.
- **Where:** `src/engine/content/tutorial.ts`, chapter `body`.
- **Found:** checking the chapter's condition sentence against `life.ts` and the glossary before rewriting it.
- **Fixed:** the rewrite names what wears condition down and what mends it. `tests/guide-chapter-facts.test.ts`
  measures an injury's effect and fails a condition sentence that names injury while an injury leaves condition alone
  (run against the old chapter on 2026-10-19: 1 failed).

## 3. Cover, Benefits And Returns Sent The Player To A Button That Isn't There (Fixed)

- **What:** the chapter said “To see a doctor, choose a practice under Your Doctor on Health Cover, then press Book An
  Appointment.” Book An Appointment shows only when a visit is owed (`person.health.owedVisit`: one missed, called off
  or not seen at the practice), and `health.book` refuses otherwise (“There’s nothing to see a doctor about.”). The game
  books a visit itself when an illness week needs one or a long-term condition's review is due (`systems/health.ts`),
  as How This Works' doctor entry (`content/guide/papers.ts`) already said.
- **Where:** `src/engine/content/tutorial.ts`, chapter `papers`.
- **Found:** following the chapter on the built app: a new life's Health Cover has Your Doctor and no Book An
  Appointment (`follow-1440/log.txt`, chapter papers), then reading `PapersWorkspace.tsx` and `appointments.ts`.
- **Fixed:** the chapter says the game books the appointment, where to choose the practice, and that Book An
  Appointment books again one missed. `tests/guide-chapter-facts.test.ts`, 'Cover, Benefits And Returns on Book An
  Appointment', measures the refusal and fails a Book An Appointment sentence that doesn't say it books again (run
  against the old chapter on 2026-10-19: 1 failed).

## Not Mine, For The Coordinator

- **Weather emoji on Home.** The greeting line and the Weather panel draw a weather emoji beside the word
  (`☁️ 68°F Overcast`, `⛅ Cloudy`), `aria-hidden`. `docs/STYLE.md`, Pictures, says weather is a word and no emoji
  stands on a tile or a label. Seen on the built app, `follow-1440/log.txt`, chapter welcome. Frame's files
  (`ui/screens/Home.tsx`).
- **A long-term condition left untreated says “Left Alone”.** Health Cover's Your Conditions shows “Asthma: Left
  Alone” after Let It Go (`follow-saves/log.txt`, the new life with asthma). `docs/GLOSSARY.md`'s row says **kept up**,
  **left untreated**, and lists “kept up / left alone” under Instead Of. The papers area's files
  (`ui/workspaces/PapersWorkspace.tsx`).
- **A new life's top bar at 390 wide breaks Locked letter by letter, and the clock covers Guide.** On the first screen
  a phone player sees, each locked control in the top bar (Play, Sleep, Look After Yourself, Advance) is squeezed so its
  Locked word wraps one letter to a line (“L O C K E D”), the buttons 114 px tall, and the clock's “7:30 AM” sits over
  the start of “Guide (17 Left)” (`phone/first-screen-390.png`, from `phone-first-screen.mjs`; the button sizes it
  printed: Play 71 × 114, Sleep 76 × 114, Advance 87 × 114). The word is `Gated`'s (`ui/guide/Guide.tsx`, `.lock-word`),
  but the squeeze is the bar's layout (`ui/shell/TimeControls.tsx`, `GameShell.tsx`, `styles/app.css`): `white-space:
  nowrap` on `.lock-word` alone would push the bar past the screen's edge, so the bar needs to wrap or drop the word for
  a mark at that width. Left for the frame area or the coordinator, with its screenshot.
- **The guide dialog at 390 wide reads through a window about 250 px tall.** The chapter list keeps 30vh and the
  chapter page scrolls inside its own 60vh box, so a long chapter (Drama School, Your Bank) is read a few lines at a
  time under the list (`phone/guide-school-details-390.png`). `styles/app.css`, `.guide-toc` and `.guide-page` at
  `max-width: 720px`: letting `.guide-page` drop its own `max-height` there, so the dialog's body scrolls once, would
  give the chapter the screen. Not changed here: the stylesheet is shared, and no player text is in it.
