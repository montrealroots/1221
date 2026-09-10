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

## Actor, or actress

SLATE is an actor and actress life simulator. The two words name one craft, and
game gives them equal standing: neither is the default, neither is the variant,
and no string calls one of them the other one.

A person's title is their own word. It comes from `performerTitleOf` and is
printed through `PERFORMER_NOUN`, never typed into a string, because a
hardcoded "Actor" is wrong for half the people it lands on. A label that
arrives as a single "Method Actor/Actress" string is read back for one person
through `forTitle`. A list of people is split by `splitByTitle`, and both
halves are headed with their own word, neither introduced as the other one's
counterpart.

Where the choice is offered it is offered flat: **Actor** and **Actress**, two
options of the same weight, with no note explaining one of them as the
exception. The article before both is "an", and the sentence around the word is
where that goes wrong — "You are a " followed by the noun reads "a actor", and
no search for that phrase will find it, because nothing in the file spells it.
`tests/premise.test.ts` holds the words, and the save that has to state them.

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

Prose contracts the way speech does. "You don’t have a job", "that isn’t
yours", "there’s nothing on today": the uncontracted forms read like a
form letter, and a sentence that never contracts is the single biggest
reason text sounds like a machine wrote it. The apostrophe is the
typographic one (’), which the rest of the prose already uses. The forms
English leaves alone stay alone: possessive "you have" ("you have $50"),
"it is" at the end of a clause ("that is what it is"), "you are" after
"who", "where", "as" or "than". Labels are not prose and are not
contracted. `node tools/voice-check.mjs` counts what is left, `--fix`
rewrites the safe cases, and `--check` holds the line in the gate.

Contractions are half of it. The other half is shape. A habit is fine
once and a tell nine times: a clause tacked on to explain what the
sentence just meant ("…, which is most of it"), an em dash and then a
restatement, "rather than" where "not" would do, a sentence opening on
"Nothing", "the whole point of it". `node tools/tics.mjs` counts nine of
them against a budget and prints every line it found; `--check` fails the
gate when one goes over. The budgets are deliberately not zero. Each of
these is good writing in small numbers.

The same tool watches how long lists begin. Eight hundred attribute
descriptions that all open on a gerund read as generated, however well
each one is written on its own, so any file with twenty or more lines of
prose where a third of them open on the same word fails the gate. Vary
the shape, not just the words: a plain noun phrase, a "you" sentence, a
question, a colon and the thing itself.

## Identifiers

Displayed labels are free to change; command kinds, entity ids, save keys,
schedule kinds and event names are not renamed to improve a label. A label
map (`PERFORMER_NOUN`, `DISCIPLINE_LABEL`) sits between the id and the
screen. A person's title is the strictest case of it: every screen reads the
word through `performerNoun`, never writes it out.

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
  broken in half; the calendar's modals included.
- `tests/interface.test.ts` — no emoji anywhere in the interface but the
  brand mark, and that never in an accessible name; every destination and
  tab label in plain Title Case words.
- `tests/cohesion.test.ts` — duplicates, repeats, wiring and casing across
  the tree.
- `tools/voice-check.mjs` — every string the game shows, counted for the
  places a person would have contracted and did not; `--fix` rewrites the
  safe ones, `--check` fails the gate over budget.
- `tools/tics.mjs` — the same strings, counted for nine stock shapes against
  a budget each, and for a long list where one opening word does too much of
  the work; `--counts` for the totals alone, `--check` fails the gate.
- `tools/cohesion-walk.mjs` — the game as a person meets it, in a browser:
  startup, the slots, creation end to end, Home, every rail destination and
  every tab behind it, the calendar's plan form, then Save & Exit and back in.
  Page errors, leaked `undefined`s, a rail that marks the wrong screen, a
  covered control or a save that does not come back all fail it. A walk that
  cannot get past a step reports that step and stops, rather than reporting
  the five screens it never reached as broken.
- `tools/doc-refs.mjs` — every file path a doc names, checked. This section is
  a promise about what is enforced, and it had gone partly false: it named a
  fuzzer and two test files that had been deleted. `--check` fails the gate.
