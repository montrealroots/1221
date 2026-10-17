# Brief 14: The Dynamic Cases (Sections 7 And 8)

Read `prompts/common.md` first; it holds for you, except where this says otherwise. You're not an area: the eight areas
rewrote the words, each its own, and each checked its templates' variants as it went, unevenly and in prose. Your job is
the one place that shows the brief's sections 7 and 8 hold across the whole game, as tests a later change can't slip
past.

## Your Clone

`$S/l14-dynamic`, cloned from `/home/user/1221` at the branch's head, on the branch `l14-dynamic`, with `node_modules`
a link to the main tree's. `$S` is `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad`.
Other cross-area work is still being merged while you work. Before you finish, fetch the main tree's branch
(`git fetch origin claude/peaceful-hamilton-59zdbb`) and merge it into yours (a merge, not a rebase), then run your
tests again on the merged words.

## What You Write

`tests/language-dynamic.test.ts`: one `describe` for each of the brief's section 7 bullets, and one for section 8:

1. **Singular and plural; zero, one and many.** The generators that count: days, pieces, notices, hours, nights,
   commitments, payments, documents, sessions, rehearsals. Run each at 0, 1 and several.
2. **Different names and pronouns.** `spokenOf` (`src/ui/looks/wellbeing.tsx`) and whatever speaks of a partner, a
   teacher or a cast member by name and pronoun: she, he, they, and pronouns the game doesn't know. A long name, a name
   with an apostrophe or a hyphen.
3. **Missing optional information.** A partner, a reader, a date, a note's focus, a bank's unpublished figure, a
   document's missing number: each absent, and the sentence still whole.
4. **Each academic standing.** Good standing, academic concern, academic warning, dismissed, and leave: what the
   term review and the screens say at each.
5. **Success, partial progress, failure and recovery.** A piece shown Unready, Working and better; a note worked and
   the piece shown again; an application refused, then made again.
6. **Deadlines upcoming, due and missed.** Coursework, a document's renewal, a tax return, a payment.
7. **Positive, zero and negative balances.** An account, a card, a payment plan, what's owed.
8. **A new player, an advanced one and a finished school journey.** The Profile, the advice, Home and the School
   screen at the start, after a played year and after the degree (use the scenario saves the earlier briefs made, or
   build the state through the game's own commands, never by setting fields a player can't reach).
9. **Section 8, repetition.** A teacher's note on an unchanged weakness says it was said before (`persistentFor`); a
   repeated warning says what changed and what's still open; a refusal met twice still says why and what to do.

For each case, assert two things:
- **The words are sound.** No leaked value (`undefined`, `NaN`, `null`, `[object Object]`, `{…}`), no doubled
  punctuation or space, no raw id, a plural that agrees with its number, a date as the game writes dates, no sentence
  ending in a fragment. `tools/text-render-check.mjs` holds these rules: reuse its checks rather than copy them (export
  what you need from it if it doesn't already, without changing what its command line does).
- **The meaning holds.** The number, name, date, sum or standing the variant carries is there, in the form the game
  shows it (read the source for it). Don't hold whole sentences where a fact will do: other cross-area work is still
  changing words, and a test of every word breaks on a rewrite that keeps the meaning.

Every case runs a real generator on a real state: a function the game calls, or a screen rendered with
`renderToStaticMarkup`, the way `tests/language-frame.test.ts` and `tests/material-words.test.ts` do. Not a copy of a
template. Mutation-test what you can: break one variant in the source (a plural, a missing guard) and show the test
fails, then put it back. Record which mutations you tried and that each failed the test.

## A Fault You Find

If a variant reads wrong, it's a defect. Fix it in the template, keeping what it means and the owning area's words
(`docs/text/statuses/<area>.json` says whose it is), and re-mark the source through the tool with `--by` that area
and `--evidence` naming your test. Record each in `docs/verification/language-2026-10-17/dynamic/defects.md`: the
source, the variant, what it read and what it reads now. A change that would need the game to know something it
doesn't is not yours: record it and leave it.

## What You Record

`docs/verification/language-2026-10-17/dynamic/README.md`: each bullet, the generators it exercises and the variants,
the test names, the mutations tried, and what you found. The receipt reads it.

## Checks

Before your last commit: `npx tsc -b --noEmit`, `npx eslint tests/language-dynamic.test.ts` (and any file you changed),
your test file, every test file that names a source you changed, `node tools/text-inventory.mjs --check`, and
`node tools/title-case.mjs --check`, `label-sweep`, `plural-check`, `voice-check --check`, `tics --check`,
`spelling`, `typos`, `doc-refs --check`. Each exit read from a file. Then commit in your clone and say in your last
message the branch, the commits, the test count and the checks' exits.
