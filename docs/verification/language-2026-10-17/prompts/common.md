# Brief 14: What Every Area Does

You're one area of brief 14, the owner's "Complete Player-Facing Language And Tutorial Overhaul". Read the brief whole
first: `docs/verification/briefs-2026-10-16/14-complete-player-facing-language-and-tutorial-overhaul.txt`. Then
`CLAUDE.md`, `docs/STYLE.md` (start at "Talking to the player") and `docs/GLOSSARY.md`. Those three are the standard.
This file says how to work to it, and your own prompt (`prompts/<area>.md`) says what's yours.

## What You're Changing, And What You Aren't

You change the words the player sees, so that SLATE speaks to them naturally: clear controls, consequences a player
understands, believable feedback, and help that teaches. You don't change:
- **The rules, the calculations, the scheduling, the random draws, or a save's shape.** A rewrite that needs a fact the
  game doesn't have doesn't invent it, and a change to logic to make a sentence easier to write isn't allowed. Change a
  string's assembly only where the sentence needs it (a plural, an article, a list), and keep each variant's meaning.
- **Ids, kinds, command names, save keys or event names.** A label map stands between them and the screen
  (`docs/STYLE.md`, Identifiers).
- **A name the code reads back.** These are compared in logic, and old saves hold them, so they stay exactly as they
  are: document names containing `F-1` or `OPT`; the ledger account names `Interest`, `Overdraft Interest` and
  `Tax On Interest`, and any account name `lending.ts` matches with `endsWith`; the notice title prefix `Cast: `
  (`systems/school.ts`); `Yale Cabaret` as a play name's start; a person's `You`. Before you change any literal, search
  for every use of it: `grep -rnF "<the text>" src tests tools`. A string compared anywhere is a key, not a label.
- **The guide's `opens`, `covers`, ids, goals and question ids.** They decide what a chapter unlocks and what an entry
  answers. The words around them are yours.
- **Decision 4's rows** (the banking items `bank.arrange_overdraft`, `bank.cancel_new`, `bank.switch`,
  `bank.take_overrun_loan`, `card.money_transfer`, `bank.switch_complete`, `bank.cancel_switch`,
  `bank.stop_balance_transfer`, and the papers items `tax.amend`, `tax.catch_up_state_plan`, `tax.lien_dispute`,
  `tax.request_waiver`). Their words may improve. Their behavior, and their status in the completion matrix, don't
  move.
- **Removed systems.** Nothing comes back.
- **Variety by chance.** Never pick a wording with the game's random numbers (`docs/STYLE.md`, Text built from
  parts). `node tools/deciders.mjs --check` fails a new draw.
- **Test titles.** An `it(...)` or `describe(...)` title is cited by the coverage audit and the completion matrix, so
  it doesn't change, even where it quotes old words.

## How To Work

1. **Your clone.** You work only in your clone (your prompt names it), on its branch. Commit there, often, with a
   message that says what was decided and why (CLAUDE.md, rule 15), ending with these two lines:

       Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
       Claude-Session: https://claude.ai/code/session_01977Z2bLodCspXyxELfcefM

   Don't push anywhere: the coordinator merges your branch from the clone. Never stash, never force anything, never
   touch `/home/user/1221`.
2. **Your sources.** `node tools/text-inventory.mjs --show "<file>*"` prints every string of a file's sources, with
   line numbers and status. Your prompt names your files. Read each source in the code, not only in the listing: a
   template's `{…}` parts and its conditions decide what the player reads. Where a sentence is built from parts, list
   its variants and make each read well.
3. **In batches.** Take a batch of a few files, at most about fifteen thousand words. For each batch:
   - rewrite, or decide to keep, each source;
   - update the tests that asserted the old words, keeping what they assert (below);
   - run the checks (below);
   - record the batch (below) and commit.

   Then take the next. Don't stop after the first.
4. **Statuses**, through the tool, never by hand, after the source's final edit (a later edit makes it Pending again):

       node tools/text-inventory.mjs --mark "<source id or pattern>" "Rewritten And Verified" --by <area> --evidence "<how it was verified>"
       node tools/text-inventory.mjs --mark "<pattern>" "Reviewed And Retained" --by <area> --reason "<why it stays>"
       node tools/text-inventory.mjs --mark "<pattern>" "Blocked" --by <area> --reason "<what blocks it, exactly>"

   - **Rewritten And Verified** names its evidence. That's a test that renders or asserts the words (file and title),
     a screen of the built app where you read them (the text walk's save and screen), or a rendered example you
     printed by playing the game (a tool's output, kept in your folder). Reading the source alone isn't verifying it.
     Until you have the evidence, leave it Pending.
   - **Reviewed And Retained** gives a reason specific to it, never "fine". For example: a real product's name as its
     bank spells it; in-world dialogue in the character's voice; an internal error the player can't reach, and how you
     know; already plain and accurate, said why.
   - **Blocked** says exactly what blocks it and what would unblock it.

   A source you split or rename gets a new id, so mark the new one. `--prune` drops the statuses of ids that are gone.
   Your marks go in `docs/text/statuses/<area>.json`, and only your own sources are yours to mark.

## Tests

A test that asserted the old words asserts the new ones, as exactly as before: an exact string stays exact, and a
regex stays as narrow. Never delete an assertion, loosen it to accept anything, or skip a test. If a behavior test
fails, your change altered behavior: undo it and find another way. Find the tests that hold your words with
`grep -rnF "<old text>" tests tools`. The two built-app tools, `tools/acceptance-ui.mjs` and
`tools/playthroughs-ui.mjs`, find controls and text by their words too: update their matchers to your new words, and
say which you changed in your batch record. Prefer a role and a name over a CSS class.

## Checks, Each Batch

Run each from your clone, read its exit from a file (never through a pipe that ends early), and fix what fails:

    npx tsc -b --noEmit
    npx eslint <the files you changed> --max-warnings=0
    npx vitest run <the test files that hold your sources>
    node tools/title-case.mjs --check; node tools/label-sweep.mjs; node tools/plural-check.mjs
    node tools/voice-check.mjs --check; node tools/tics.mjs --check; node tools/spelling.mjs; node tools/typos.mjs
    node tools/text-inventory.mjs --check; node tools/doc-refs.mjs --check; node tools/deciders.mjs --check

Engine-speak may fall and may not rise (`docs/text/engine-speak.json`). `--speak "<pattern>"` lists the hits in your
files. A hit that's the right word in its place is said so in that source's status. Once at the end of your area, run
the whole suite, `npx vitest run > <file> 2>&1; echo "exit=$?" >> <file>`, and the built app (below).

## The Built App

Build in your clone (`npm run build`), serve it on your port (`npx vite preview --port <port> --strictPort &`), and
kill it by its process id when you're done, never with `pkill -f`. Then:

    SLATE_BASE=http://localhost:<port> node tools/text-walk.mjs <your folder>/after-1440 1440 <saves> [<save>.json ...]
    SLATE_BASE=http://localhost:<port> node tools/text-walk.mjs <your folder>/after-390 390 <saves> [<save>.json ...]
    node tools/text-render-check.mjs <your folder>/after-1440 <your folder>/after-390

The scenario saves are in `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/l14/saves/`
(brief 13's, on today's game code). The same walk on the code before this pass is in `.../scratchpad/l14/walk-before-1440/`
and `walk-before-390/`, so you can set a screen's words before and after side by side. A save keeps the notices it
was given in the words of its day. To read your new notice words, write the saves again in your clone,
`node tools/scenario-saves.mjs <dir>` (four at a time, about five minutes), or play the case in a test.

At 390 wide, look for what the brief names: wrapping, clipping, a button pushed past the edge, and a wall of text.
`tools/text-walk.mjs` records the words and `tools/acceptance-ui.mjs` the overflows. A screenshot of a screen you
changed is worth keeping in your folder where it shows something.

## What You Record

All of it goes in `docs/verification/language-2026-10-17/<area>/`, in your clone:
- **`batches.md`:** per batch, the sources reviewed (ids, or file and count), what you changed and kept, the
  meaning-sensitive changes (where a rewrite could have changed what's true, and how you checked it didn't), the tests
  and tool matchers you updated, the checks run with their exits, and the screens you verified.
- **`examples.json`:** before-and-after pairs, verbatim, at least eight per batch and from every kind of text you
  touched. Each is `{ "source": "<id>", "kind": "button|heading|notification|feedback|official|narration|error|tutorial|label|accessible|empty|confirmation|other", "before": "...", "after": "...", "why": "...", "meaningSensitive": true|false, "verified": "<how>" }`.
  A dynamic sentence gets its variants: one and many, zero, missing parts, each standing or state it has.
- **`defects.md`:** any functional defect you find, apart from the writing: what, where, how found. Fix one only if
  it's small, certain and inside your area, with a test that fails without the fix. Otherwise describe it for the
  coordinator. A wrong number in a sentence is a defect.
- **`glossary.md`:** the terms of your part of the game, in `docs/GLOSSARY.md`'s columns, for its section. A term
  another area also uses, or a Core term you think is wrong, goes to the coordinator in your report, not into Core.
- **`HANDOFF.md`**, if you stop before your sources are done: exactly where you are and what's left, so the next
  session continues without redoing anything.

Your final message is a report: the batches done, the counts by status for your files
(`node tools/text-inventory.mjs` prints them), the checks and their exits, the defects, what's left, and anything the
coordinator must decide.
