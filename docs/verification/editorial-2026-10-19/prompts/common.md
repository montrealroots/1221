# Brief 15: What Every Area Does

You're one area of brief 15, the owner's "Complete Natural-Language Editorial Pass, Including All Retained Text".

## Read These First

Read them in this order before you change anything:
1. **The brief, whole:** `docs/verification/briefs-2026-10-16/15-complete-natural-language-editorial-pass.txt`.
2. **`CLAUDE.md`.**
3. **`docs/STYLE.md`,** "Speak like a finished game" first, then "Talking to the player". The first is the standard now.
4. **`docs/GLOSSARY.md`.**
5. **`docs/verification/editorial-2026-10-19/reference.md`:** real sentences from the game, rewritten to the standard, each
   checked against the code. That's the voice. Several of its examples are in your files; your prompt says which.

Your own prompt (`prompts/<area>.md`) says what's yours.

## What This Pass Is

Brief 14 made the text accurate and taught the tasks. Too much of it still reads stiff, indirect, or like the engine's
notes. You read **every** source of yours again, whatever its first status: a source marked Reviewed And Retained or
Rewritten And Verified in brief 14 is no more exempt than one never read. You:
- **Rewrite** each one that falls short of the standard.
- **Keep** each one that already meets it, saying why in words specific to it.
- **Don't rewrite a good sentence** to raise the count.

Judge each source on seven things, not on a green check:
- natural;
- clear at first reading;
- mechanically accurate;
- consistent with the glossary;
- right for its speaker and moment;
- useful about what to do next;
- readable where it appears on screen.

## What You're Changing, And What You Aren't

You change the words the player sees. You don't change:
- **The rules, the calculations, the scheduling, the random draws, or a save's shape.** A rewrite never needs a fact the
  game doesn't have, and never changes logic to make a sentence easier. Change how a string is assembled only where the
  sentence needs it (a plural, an article, a list, an order), and keep each variant's meaning.
- **Ids, kinds, command names, save keys or event names.** A display label changes independently of them
  (`docs/STYLE.md`, Identifiers).
- **A name the code reads back.** Before you change any literal, search for every use of it:
  `grep -rnF "<the text>" src tests tools`. A string compared anywhere is a key, not a label. Known keys:
  - document names containing `F-1` or `OPT`;
  - the ledger account names `Interest`, `Overdraft Interest` and `Tax On Interest`, and any account name `lending.ts`
    matches with `endsWith`;
  - the notice title prefix `Cast: ` (`systems/school.ts`);
  - `Yale Cabaret` as a play name's start;
  - a person's `You`.
- **The guide's `opens`, `covers`, ids, goals and question ids.** The words around them are yours.
- **Decision 4's rows:**
  - the banking items `bank.arrange_overdraft`, `bank.cancel_new`, `bank.switch`, `bank.take_overrun_loan`,
    `card.money_transfer`, `bank.switch_complete`, `bank.cancel_switch` and `bank.stop_balance_transfer`;
  - the papers items `tax.amend`, `tax.catch_up_state_plan`, `tax.lien_dispute` and `tax.request_waiver`.

  Their words may improve. Their behavior, and their status in the completion matrix, don't move.
- **Removed systems.** Nothing comes back, and no connector is added.
- **Variety by chance.** Never pick a wording with the game's random numbers. `node tools/deciders.mjs --check` fails a
  new draw.
- **Test titles.** An `it(...)` or `describe(...)` title is cited by the coverage audit and the completion matrix, so it
  doesn't change, even where it quotes old words.
- **Quotations.** A line quoted from a real play, a law, a bank's published terms or another real source stays as its
  source wrote it, and the game's own explanation around it is clearly the game's.
- **Another area's files.** Editing one makes its source Pending in your clone and its owner's work collide with
  yours. Put what another area should change in your report: the file, the line, and the words you'd suggest. The
  coordinator applies it at the merge.

## How To Write

The standard is `docs/STYLE.md`, "Speak like a finished game". In practice:
- **Lead with what matters to the player.** Put the qualifications after it, or behind the drill-down. A How This
  Works entry starts with a short plain overview and the first action, and keeps formulas and exceptions for its later
  fields.
- **Use the screen's exact labels,** and the glossary's word for each thing. The everyday account is a **checking
  account** from this brief on: change "current account" in your words. The 17 chapters are the **guide**, named after
  its button, so don't call them a tutorial.
- **Give each kind of text its voice:**
  - **a teacher:** about this piece, specific, with a next step, and never inventing what the simulation doesn't know;
  - **the guide:** patient, assumes nothing;
  - **a bank or an office:** professional, every amount, date and condition kept, and estimates labelled as estimates;
  - **a notification:** what happened, what it means, what to do;
  - **a button:** the action, short and distinct from its neighbours;
  - **an error:** what failed, whether anything was charged or changed, and the real way out.
- **Read the whole interaction, not the sentence alone.** For each feature you own, read in order, across files (your
  prompt lists the main ones):
  1. what it says it's for;
  2. the control;
  3. any refusal;
  4. the confirmation;
  5. the result;
  6. the later notice;
  7. its How This Works and drill-down.

  Then make them agree. Say each thing once, in the same words, with the next step, at the moment it's needed.
- **Repetition** (the brief, section 8). A message that comes back says what the player already tried, what improved,
  what's still open, why it still applies and what to do now. It never names a weakness as if new. Never invent a
  circumstance for variety, or rotate to worse advice.
- **Dynamic text.** List each template's variants and make each read well:
  - one, zero and many;
  - a missing optional part;
  - names and pronouns;
  - dates and deadlines (upcoming, due, past);
  - amounts (positive, zero, negative);
  - each status it can show.

  Use the shared helpers (`plural`, the money and date formatters, the list joiners).

## How To Work

1. **Your clone.** Work only in your clone (your prompt names it), on its branch. Commit there often. Each commit
   message says what was decided and why (CLAUDE.md, rule 15) and ends with these two lines:

       Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
       Claude-Session: https://claude.ai/code/session_01977Z2bLodCspXyxELfcefM

   Don't push anywhere: the coordinator merges your branch from the clone. Never stash, never force anything, never
   touch `/home/user/1221`.
2. **Your sources.**
   - `node tools/text-inventory.mjs --todo2 <area>` lists what's left by file.
   - `node tools/text-inventory.mjs --show "<file>*"` prints every string of a file's sources, with lines and both
     statuses.
   - Read each source in the code, not only in the listing. A template's `{…}` parts and its conditions decide what
     the player reads. A big data file kept as one JSON string is one source: review the fields a screen shows, and
     say how you know which those are.
3. **In batches** of a few files, at most about fifteen thousand words. For each batch:
   1. rewrite or keep each source;
   2. update the tests and tools that asserted the old words (below);
   3. run the checks (below);
   4. record the batch (below);
   5. commit.

   Then take the next. Don't stop after the first, and don't stop until every source of yours has a second-pass
   status.
4. **Second-pass statuses,** through the tool and never by hand, after the source's final edit. A later edit makes the
   source Pending again.

       node tools/text-inventory.mjs --mark2 "<source id or pattern>" Rewritten --by <area> --evidence "<where the new words were read>"
       node tools/text-inventory.mjs --mark2 "<pattern>" Retained --by <area> --reason "<why this text stays, specific to it>"
       node tools/text-inventory.mjs --mark2 "<pattern>" Blocked --by <area> --reason "<what blocks it, exactly, and what would unblock it>"

   - **Rewritten** names its evidence. That is one of:
     - a test that renders or asserts the words (file and title);
     - a screen of the built app where you read them (the text walk's save and screen);
     - an example you rendered by playing the game (a tool's output kept in your folder).

     Reading the source alone isn't verifying it.
   - **Retained** gives a reason specific to it: what this text does well for its player. For example: "a real
     product's name as its bank spells it"; "a character's line in the scene, in her voice"; "a one-line refusal that
     says what failed, that nothing was charged and what to press instead". The tool refuses "already reviewed",
     "grammatically correct", "no flagged words" and the like.
   - **Blocked** says what blocks it and what would unblock it.

   A source you split or rename gets a new id, so mark the new one; `--prune` drops statuses whose ids are gone. Only
   your own sources are yours to mark: the tool refuses another area's.
5. **Labels you rename.** A renamed button, tab, heading or menu item changes every place that names it: your guide
   entries, accessibility labels and tests. Another area's tutorial may name it too. Record every rename in
   `renames.json` in your folder, `[{ "old": "...", "new": "...", "where": "<file>" }]`. The coordinator carries it to
   the guide's other chapters and the other areas. Rename only where the old label is unclear: a familiar label that
   works stays.

## Tests And Tools

A test that asserted the old words asserts the new ones, as exactly as before: an exact string stays exact, and a
regex stays as narrow. Never:
- delete an assertion;
- loosen an assertion to accept anything;
- skip a test;
- change a test's title.

If a behavior test fails, your change altered behavior: undo it and find another way.

Find what holds your words with `grep -rnF "<old text>" tests tools`. These tools find controls and text by their
words, so update their matchers to your new words and list each change in your batch record:
- `tools/acceptance-ui.mjs`
- `tools/playthroughs-ui.mjs`
- `tools/journeys.ts`
- `tools/advice-harness.ts`
- `tools/matchers.mjs`

Prefer a role and a name over a CSS class.

## Checks, Each Batch

Run each one from your clone. Read its exit from a file, never through a pipe that ends early, and fix what fails:

    npx tsc -b --noEmit
    npx eslint <the files you changed> --max-warnings=0
    npx vitest run <the test files that hold your sources>
    node tools/title-case.mjs --check; node tools/label-sweep.mjs; node tools/plural-check.mjs
    node tools/voice-check.mjs --check; node tools/tics.mjs --check; node tools/spelling.mjs; node tools/typos.mjs
    node tools/text-inventory.mjs --check; node tools/doc-refs.mjs --check; node tools/deciders.mjs --check
    node tools/guide-quotes.mjs --check

- **Engine-speak** may fall, and may not rise (`docs/text/engine-speak.json`).
- **`guide-quotes`** fails on a sentence the guide quotes that the game no longer says. Fix the quote where the guide
  entry is yours. Where it's another area's, list it in your report: the check failing on that quote alone is
  expected in your clone.
- **Once, at the end of your area,** run the whole suite with
  `npx vitest run > <file> 2>&1; echo "exit=$?" >> <file>`, then the built app (below).

## The Built App

Build in your clone with `npm run build`. Serve it on your port with
`node node_modules/vite/bin/vite.js preview --port <port> --strictPort &`. Before you read anything, check that the page
served is your own build:

    curl -sf http://localhost:<port>/ | cmp - dist/index.html

Kill the server by its process id when you're done, never with `pkill -f`. Then:

    SLATE_BASE=http://localhost:<port> node tools/text-walk.mjs <your folder>/after-1440 1440 <saves> [<save>.json ...]
    SLATE_BASE=http://localhost:<port> node tools/text-walk.mjs <your folder>/after-390 390 <saves> [<save>.json ...]
    node tools/text-render-check.mjs <your folder>/after-1440 <your folder>/after-390

- **The scenario saves:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/b15-saves/`,
  written by today's game code.
- **The walk before this pass:** `.../scratchpad/b15-before/walk-1440/` and `walk-390/`, on `main` at `bdb23949`, so you
  can set a screen's words before and after side by side.
- **Notices in a save** keep the words of the day they were written. To read your new notice words, play the case in a
  test, or write the saves again in your clone with `node tools/scenario-saves.mjs <dir>` (about three minutes).

At 390 wide, look for a text wall, wrapping, clipping, and a button pushed past the edge. Keep a screenshot in your
folder where it shows something.

## What You Record

It all goes in `docs/verification/editorial-2026-10-19/<area>/`, in your clone:
- **`batches.md`.** For each batch:
  - the sources reviewed;
  - what you rewrote and what you kept;
  - the meaning-sensitive changes, and how you checked each kept the game's meaning;
  - the interactions you read whole;
  - the tests and tool matchers you updated;
  - the checks run, with their exits;
  - the screens you verified.
- **`examples.json`.** Before-and-after pairs, verbatim: at least eight per batch, and from every kind of text you
  touched. Each pair is:

      { "source": "<id>", "kind": "button|heading|notification|feedback|official|narration|error|tutorial|label|accessible|empty|confirmation|dialog|other", "before": "...", "after": "...", "why": "...", "meaningSensitive": true|false, "verified": "<how>" }

  A dynamic sentence gets its variants.
- **`retained.md`.** A sample of what you kept, at least ten across your files, each with its words and its reason,
  so the owner can judge the reasons as well as the rewrites.
- **`defects.md`.** Any functional defect you find, apart from the writing: what, where, and how you found it.
  - Fix one only if it's small, certain and inside your area, with a test that fails without the fix.
  - Otherwise describe it for the coordinator.
  - A wrong number in a sentence is a defect, and so is a sentence that promises what the game doesn't do.
- **`glossary.md`.** Terms you changed or added, in `docs/GLOSSARY.md`'s columns. A Core term you think is wrong goes
  in your report.
- **`renames.json`.** Every label renamed (above).
- **`HANDOFF.md`.** Only if you stop before your sources are done: exactly where you are and what's left.

Your final message is a report:
- the batches done;
- the second-pass counts for your area (`node tools/text-inventory.mjs` prints them);
- the checks and their exits;
- the defects;
- the renames;
- the edits you suggest for other areas;
- anything the coordinator must decide.
