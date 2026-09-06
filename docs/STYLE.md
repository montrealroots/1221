# How SLATE Is Written

The convention every surface of the game follows. Where a screen departs
from it, the screen is wrong, not the convention. The checks that hold it in
place are named at the end.

## Labels: Title Case, every word

Tabs, buttons, tiles, headings, menu items, chips, column heads, form labels,
decision actions, choice labels in a scene, and the title of a decision or a
notification (its body is prose): every word capitalised, including the short
ones, whether the label is written out or built from a template around a
name — **Showing At 9440 Fairhaven Drive**, **Paid Off The Car Loan**. **Skip To Event**, **Buy A Day Pass**, **Why Did This
Happen?**, **Play It Out**. This is the one rule the player has asked for by
name, and it is applied without exceptions for articles or prepositions.

Real names are spelled the way the world spells them: **iQIYI**, **tvN**,
**Gold's Gym Venice**, **Île-de-France**. A place name from the gazetteer is
never re-cased.

## Prose: sentences

Descriptions, scene text, help, notifications, confirmations, errors and
dialogue are sentences: a capital to start, a full stop to end, and one
thought each. Sentence case inside them. Numbers under ten in words in prose,
figures in facts and tables. Money is always the ledger's figure, in the
account's currency, with cents where cents matter.

Prose says what happened, not what the interface did. "Fed. $24.60 from
Checking." rather than "Order successful!". No exclamation marks in system
messages; a character may use one if that is how they talk.

## Verbs that name the action

A control says what pressing it does: **Review Offer**, **Book Viewing**,
**Confirm Transfer**, **Buy A Day Pass**, **Move It To**. Not **OK**,
**Submit**, **Go**, **Continue** where a specific verb exists. A destructive
or committing action names its cost or its object: **Cancel Membership**,
**Pay $145.00 Now**.

A control that cannot be used says why, in a sentence, where it is: "Too
sore for that today. Easy or steady." A control that is not built does not
pretend: it is marked Locked and says Under Construction.

## Truth in the text

A preview is a preview, a quote is a quote, a pending payment is pending,
and a simulated price is SLATE's calibration and says so. Nothing describes
a purchase, a relationship change or an outcome that a validated command has
not committed. A real name carries its provenance; an invented one is never
called real.

## Pictures

The interface is text. No emoji on any tab, tile, breadcrumb, search result,
control or label, and no Unicode glyph standing in for a word, because a
symbol that is a picture on one platform and a box on another is not a
label, and a screen reader has nothing to say about it. The one picture the
game keeps is its own mark, the clapper, where it is the brand — the startup
sequence, the save slots, the creation header and the top bar — and never
inside an accessible name.

Status is a word or a chip: **Locked**, **Real**, **Pending**, **Saved**.
Weather is a word: **Cloudy**, **Storm**. Play and pause are the words Play
and Pause.

## Voice

Narration is second person, present tense, plain. It knows what the
character knows and nothing else: no figures the character has not been
told, no names they have not met, no verdict on a stranger.

Characters keep their own voices. Editorial cleanup fixes spelling and
grammar in narration and interface text; it does not flatten how a person
talks. A trainer who says "Right. Squats." keeps saying it.

## Identifiers

Displayed labels are free to change; command kinds, entity ids, save keys,
schedule kinds and event names are not renamed to improve a label. A label
map (`FACILITY_LABEL`, `WELLBEING_LABEL`, `PLACE_KIND_LABEL`) sits between
the id and the screen.

## What holds it in place

- `tools/label-sweep.mjs` — every label string in the engine content is Title
  Case, including titles built from templates with the slots set aside
  (`--write` re-cases the plain ones). It fails the gate when a label slips.
- `tools/inventory.mjs --check` — every command, scene and route has a line
  in `docs/COVERAGE-MATRIX.md`, and the matrix's appendix matches the code.
- `npm run gate` — typecheck, lint, tests, then the label sweep, the dialogue
  check and the inventory check in one go.
- `tools/text-caps.mjs` — every screen at five widths: nothing clipped,
  crushed, cut off or bleeding; non-sentence text capitalised; words not
  broken in half; the gym scene and both calendar modals included.
- `tests/interface.test.ts` — no emoji anywhere in the interface but the
  brand mark, and that never in an accessible name; every destination and
  tab label in plain Title Case words.
- `tests/text-caps.test.ts`, `tests/cohesion.test.ts` — duplicates, repeats,
  wiring and casing across the tree.
