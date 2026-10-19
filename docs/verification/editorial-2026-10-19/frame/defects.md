# The Frame Area's Defects, Brief 15

Functional defects found while reading, apart from the writing: what, where, and how each was found. A sentence that
says what the game doesn't do is a defect, and so is a wrong number in one.

## 1. Before Yale Said The Savings Stayed, And That The Account Kept There Opened Empty, When Neither Was True (Fixed)

- **Where:** `src/ui/creation/CharacterCreation.tsx`, `BeforeYale`, the line under Your Savings.
- **What:** it said "Your savings stay where you saved them." whichever radio was chosen, so with Moved To Chase it told
  the player the opposite of their choice. It ended "Your <current account> opens with nothing in it." on every bank,
  but `splitOf` gives a bank that charges its fees to graduation (`feesToGraduation`) from the savings or the checking
  account, and the stat beside it and `whatFollows`' sentence above it both said so: MUFG's 普通預金 showed ¥10,200 in
  the tile and "opens with nothing in it" in the line.
- **How found:** reading Before Yale whole, its stat tiles, the callout from `whatFollows` and the line under the
  radios, against `splitOf` (`systems/homeaccount.ts`).
- **Fixed:** the line says the choice made ("Your savings stay at MUFG Bank." or "Your savings move to Chase."), and
  says the account opens empty only where `splitOf` gives it nothing. Small, certain and inside the frame's file.
- **Test that fails without the fix:** `tests/language-frame-ui.test.ts`, "Before Yale says where the savings go and
  what the account kept there opens with, for each choice": HSBC UK moved expects "Your savings move to Chase.", and
  MUFG expects no "opens with nothing in it".

## 2. A Search In A Country With No Towns Printed Empty Quotes (Fixed)

- **Where:** `src/ui/creation/LocationPicker.tsx`, the results list.
- **What:** with nothing typed and no towns on record (Antarctica), the list said "No town or city matches “” there.
  Try a different spelling, or widen the region.": a malformed sentence, and "widen the region" names no control.
- **How found:** reading the template's variants (brief 15, Dynamic text: a missing optional part).
- **Fixed:** nothing typed, "There’s no town or city on record there."; typed, the search's own words, and, where a
  state is chosen, "or choose Anywhere in <country>", the select's own first option.
- **Test:** `tests/language-frame-ui.test.ts`, "the place picker says what a country has, and a search that finds
  nothing what to try", which fails on the old words.
