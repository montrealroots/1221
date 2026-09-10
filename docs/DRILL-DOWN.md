# Depth — every noun opens where it stands

One of the main engines of the system. The machinery is in `src/ui/looks/`,
twenty-five kinds are declared against it and Home is wired to every one of
them. What follows is the rule the whole game obeys, the machinery that makes
obeying it cheap, what stood in the way, and the checks that hold it in place.
Where a screen departs from this, the screen is wrong.

The rule, in the words it was asked for: *every logical object, system, and
piece of information should be interactable and open into increasingly
detailed sub-systems without breaking immersion.*

## The principle

Every name, figure and word the game prints is a thing in the world, and a
thing in the world can be looked at more closely. **The name is the control.**
You press "Stress", or "Reykjavík", or "Everyday Checking", and it opens.
There is no Open button, no Details button, no chevron and no tooltip, because
a thing does not need a handle to be looked at.

What a thing opens into is declared once, for the kind of thing it is, in
`src/ui/looks/`. A screen never writes what is inside a thing; a screen only
says which thing it is naming. So the same calendar entry opens the same way
on Home and on the Calendar, and it opens the same way from a notification
that is about it, because openability belongs to the entry and not to the
screen it happens to be printed on.

A look leads with a sentence, in the second person, true right now. Then, if
there is more, the facts. Then the ways further in, each of which says what is
behind it before you take it. A look never opens into arithmetic: where a
figure is SLATE's own calibration, one footnote line at the bottom says so, in
the world's words, and that is the whole of it. The floor of every chain is a
person, a place, a thing or a moment. A look that would bottom out in a
formula, a field name or a record has gone wrong, and the look is wrong, not
the world.

A thing that cannot be looked at is not painted as though it can. A look that
resolves to nothing says what became of it, in a sentence, in its own voice.

## The rules

1. **A screen names a subject; it never writes a body.** Depth lives in
   `src/ui/looks/<kind>.tsx` behind `defineLook`, one declaration per kind, and
   nowhere else. A `useState` holding drill state in a screen is a bug.
2. **The noun is the control.** A look is opened by pressing the world's own
   word for the thing. No control anywhere is labelled Open, Show, Hide,
   Details, More, View or Expand.
3. **A look is painted only when it resolves.** Ask first; render children as
   plain text when the subject is not there. Nothing opens onto a toast, and
   nothing opens onto Under Construction.
4. **Every view states `name`, `kind`, `summary` and `gone`**, all four
   required. `summary` is one sentence, second person, present tense, true at
   this instant. `gone` is one sentence in the world's voice for when the
   subject is no longer there.
5. **`name` is the world's word for the thing** and is the only string the
   trail prints. `kind` renders as an eyebrow above it and never enters it. No
   `name` or `kind` carries an underscore, a slash, a run of four digits or a
   lowercase word running into a capital, and every one of them starts with a
   capital or a digit.
6. **Prose first, facts second, ways third.** A body holds at most one grid of
   `Stat`s, and only below its opening sentence. A body that is only a grid of
   `Stat`s is a record view and is rejected.
7. **Every way in carries a line saying what is behind it.** The graph is
   readable without walking it.
8. **Facets are tabs, not levels.** A tab is another face of the same thing; a
   look is a different thing. A facet is never addressable as a subject.
9. **Narrowing a set is a filter inside the level you are in**, never a new
   level. A new level means a different object.
10. **No formula is ever a level.** Coefficients may appear inside a sentence;
    they may not be the sentence. Provenance is one line at the foot of a body
    and is not itself openable.
11. **The container is computed, not chosen.** A view declares its parent.
    Opening a child of what you are already reading expands it in place;
    crossing to a different object opens the pane; a subject marked `dwell`
    opens full width. Below 900px everything expands in place.
12. **A modal commits; a look only reads.** Sleep, Skip To Event and Delete
    Save stay modals because they ask a question and change the world. Nothing
    read-only opens a modal again.
13. **`title=` is not depth.** No `title` attribute carries information that is
    not also on the screen.
14. **Depth is session state.** Nothing about looking is written into the save.

## What a chain looks like

Five real layers, every number already computed by `src/engine/systems/life.ts`
and currently thrown away:

    You                     → the person. Four facets, not four descents.
      How You Are           → all nine wellbeing dials. Six of the nine are
                              simulated daily and appear on no screen today.
        Stress              → "Eighteen, and coming down. Nothing's adding to
                              it — that only starts when you're running on
                              empty, and you're at seventy-two."
          What Sheds It     → the hourly recovery and what multiplies it
            Highly Strung   → the trait, and what else it touches

"running on empty" is itself a way in, to the energy dial: two ways in inside
one spoken clause. The coefficients live in the sentences. No table.

## Where it stands today

Measured in the running app, every screen, at 1440×950:

| Screen | Interactive |
|---|---|
| Save slots | 23% |
| Creation — Identity | 30% |
| Creation — Who You Are | 84% |
| Creation — Starting Point | 7% |
| Creation — Review | 6% |
| **Home** | **1%** — one live element in ninety-four |
| Calendar | 64% |

Measured again on the same screen at the same width once the engine was built
and Home was wired to it: **16%**, thirty-seven live elements in two hundred
and thirty-three, thirty-six of them nouns rather than controls. Twenty-five
kinds are declared and sixty-six subjects resolve out of a booted save.

The first row for Home is what it was: the main game screen, offering a player
exactly one thing to press, with every stat, meter, place name, temperature,
balance and standing bar a dead end. The Calendar at 64% was the proof that
the codebase could do better; it did it by hand, once, in a screen's local
state — which is precisely why the same calendar entry was pressable on the
Calendar and dead on Home. It is declared once now, and pressable on both.

A survey of six sweeps found **253 drillable subjects** across the two screens
and five creation steps that exist.

## What had to be true first

Six blockers, each verified against source rather than assumed. The first five
are still true and the engine is built around them rather than through them;
the sixth is answered but unpopulated:

1. **There is no URL.** `route` is React state in `game-context.tsx:99`.
   `react-router-dom` is in `package.json` and imported nowhere in `src/`. Any
   plan that addresses a look through the URL, or that has a tool open one by
   address, needs routing shipped first.
2. **An act must go through the command layer.** Mutations run through
   `game.run()`, which sets the dirty flag autosave depends on. A look that
   mutates directly would have its effect lost at the next reload, and would
   never appear in `tools/inventory.mjs`.
3. **Looks cannot exist before the save does.** `GameProvider` wraps only the
   `playing` phase (`SlateApp.tsx:147`). Save slots and character creation get
   no `sim`, so nothing on the creation screens can open — including the
   estate, the studio lot and the company, which is where the premise is
   introduced.
4. **Favourites and recents are global across slots.** `slate.favourites` in
   `localStorage` holds bare routes across every universe, and ids restart per
   universe. A favourited address would resolve to a different person in
   another slot.
5. **There is already a depth strip.** `breadcrumbs` caps at six
   (`game-context.tsx:167`) and dedupes by exact route. A five-level chain plus
   two screens overflows it and silently drops the top.
6. **`refType`/`refId` resolve nothing.** Both are pass-through of a
   caller-supplied value, and there is not one literal `refType` anywhere in
   `src/`. The typed pointer that would let a notification open the thing it is
   about is declared and never populated.

## The checks that hold it in place

- `tests/looks.test.ts` — boot a save, resolve every registered kind, follow
  every way transitively to a fixed point, and assert each edge resolves onto
  something. The same guarantee as `tests/navigation.test.ts`, whose own header
  records that this class of bug has shipped twice.
- The name gate — `name` and `kind` must fail `/_|\/|\d{4}/`, must fail
  `/\b[a-z]+[A-Z]/`, and must start with a capital or a digit. The middle
  clause is the one that matters and the one this spec first got wrong:
  `sleepDebt` carries no underscore, no slash and no run of digits, so the
  first regex waved through the very example the rule was written around. It
  is anchored at a word boundary, so McAllen, DeLuca and DreamWorks — all real
  gazetteer and company spellings — are not mistaken for identifiers.
- The shape gate — more than one stat grid in a body, or a stat grid with no
  sentence above it, fails. This is the only defence against a look becoming a
  record view.
- The static scan in `tests/navigation.test.ts` — every `at('<kind>'` literal
  in `src/ui/` names a registered kind, so a typo fails when it is written
  rather than when it is clicked.
- The affordance gate in `tests/interface.test.ts` — no stray `title=`, no
  `cursor: pointer` on anything not rendered as a button, and no control whose
  whole text is Open, Show, Details, More, View or Expand. Two of those ship on
  Home today, which is the point.
- The apostrophe gate — no straight `'` between two letters anywhere under
  `src/ui/looks/`. `docs/STYLE.md` has always said the apostrophe is the
  typographic one and nothing checked it; the first draft of `place.tsx`
  carried forty-six straight ones into sentences a player reads.
- `tools/label-sweep.mjs` and `tools/voice-check.mjs` extended over
  `src/ui/looks/**`. Every new sentence in the feature lives in one directory,
  which is the difference between policed prose and a hundred loose strings.
- `tools/text-caps.mjs` and `tools/ui-audit.mjs` enumerate the registry and
  open every kind at every width. A layer no tool can open is a layer no tool
  can see, which is how every hand-wired drill in this repo has rotted.
- `tools/inventory.mjs --check` — every kind has a line in the coverage matrix,
  alongside every command and route.

## One detail worth keeping

`app.css:328` defines `button.link` and comments it *"a name that is also a way
in"*. It has never been used. The stylesheet wrote this feature's core
affordance and then waited.
