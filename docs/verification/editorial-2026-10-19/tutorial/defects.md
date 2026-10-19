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

## Not Mine, For The Coordinator

- **Weather emoji on Home.** The greeting line and the Weather panel draw a weather emoji beside the word
  (`☁️ 68°F Overcast`, `⛅ Cloudy`), `aria-hidden`. `docs/STYLE.md`, Pictures, says weather is a word and no emoji
  stands on a tile or a label. Seen on the built app, `follow-1440/log.txt`, chapter welcome. Frame's files
  (`ui/screens/Home.tsx`).
