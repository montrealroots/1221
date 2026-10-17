# Brief 14, The JSON Area: Batches

The area's sources are the two JSON files the game imports, which the inventory began reading at `bbb3a151`:
`src/engine/content/genre-demands.json` (149 sources, one per genre, filed under the profile subsystem) and
`src/engine/content/home-accounts.json` (75 sources: 60 banks, 13 countries, America's rules and the world's
assumptions, filed under money). Both are generated, so no word was changed in them by hand: every change is made where
the words come from and rebuilt through the builder, and `json-diff-check.mjs` (in this folder) compares each rebuild with
the file as it was at `bbb3a151`, field by field.

The tools kept here, each run from the clone:
- `render-genre-looks.ts.txt` draws the genre look of any or every genre the way the game draws it (`resolveLook`,
  `ui/looks/actor.tsx`) on a new first-year in New York, and prints what it says of what the genre asks. The genre look
  isn't on a walked screen, so this is the screen's evidence. `genre-looks-before.txt` is every genre at `bbb3a151`;
  `genre-looks-after.txt` every genre at the end; `bN-genre-looks.txt` each batch's genres at that batch's commit.
- `print-home-accounts.ts.txt` prints every line the game shows of an account kept at home and looks for the JSON's
  words among them (`home-accounts-shown.txt`).
- `json-diff-check.mjs` fails a rebuild that changes anything but words: a genre, a key, a confidence, a tag, a basis,
  the presence of a `belongsTo`, a URL, an ISO date, or `home-accounts.json` at all. It lists every figure that leaves the
  words, and every source line whose prose changed.
- `sweep-words.mjs` lists every working word of the research left in what the look shows, outside quotations.

## Batch 1: The Builder, Its Rules, And The Home Accounts

**Sources read (75 + 149):** all 75 of `home-accounts.json`, and every field of `genre-demands.json`, for which fields
reach a screen.

**Home accounts, Reviewed And Retained, all 75.** None of the file's words is shown. Of a bank's research the game reads
whether it keeps or closes an account, its notice in days, and its sources, from which `termsFrom` builds a `source` and
an `asOf` that nothing reads. The banks' conditions, fees, card and payment terms abroad, opening, identification and tax,
the countries' tax at source and America's rules were read by hand, when the feature was written, into `homeaccounts.ts`'s
own sentences (`READ`, `ABROAD`, `NON_RESIDENT_TAX`, `US_REPORTS`), which are the money area's and which it reviewed.
Shown two ways:
- **The typechecker.** With every word field hidden from `RESEARCH`'s type (a bank's conditions, fee, US-resident policy,
  abroad terms and assumptions; the countries, America and the world) and `HomeTerms.source` and `asOf` renamed,
  `npx tsc -b --noEmit` found one reader in the whole tree: `tests/home-account-creation.test.ts`, which checks that
  `source` is longer than ten characters. The file was put back as it was.
- **The screens.** `print-home-accounts.ts.txt` printed what Starting Point shows for each of the 55 banks a life can keep
  (`homeAccountRefusal`, `whatFollows`), then made a life with five of them (Barclays, Deutsche Bank, SG, SMBC, KakaoBank)
  and printed what Money shows under each kept account (`homeAccountLines`) and the refusal to open something new there
  (`abroadRefusal`): 209 lines, among which none of the file's 2,410 sentences of eight words or more appears.

The bank's own product names and fee wording, and the statutes the countries' entries quote, stay as the research quoted
them; one bank's research (`ca-rbc`) and the world's assumptions say "SLATE", which no player reads.

**Genre demands: what the genre look shows.** Every field reaches the genre look (`ui/looks/actor.tsx`): the claim
under "What it asks of an actor.", `belongsTo` inside "What the research found (…) belongs to …, not to the genre as a
whole", the research's reasons for each requirement (only where the genre's requirements apply: 52 of the 114 reasons),
what the source supports, how it was read and the confidence in a parenthesis, what's uncertain, and the source line.
`docs/GENRE-COVERAGE.md` also quotes `belongsTo`; it's regenerated from the tables with every rebuild
(`tests/genre-coverage.test.ts` holds it to them).

**Where the words are changed.** The research file stays the research's record, in its own words
(`docs/research/attributes/README.md` says so, and now says what's edited on the way in). The builder
(`tools/build-attribute-content.mjs`) now applies the game's words on the way in:
- `docs/research/attributes/genre-demands-words.txt`, exact replacements per genre and field, each found once in what the
  research says now, or the build stops (empty in this batch; batches 2 to 5 fill it);
- how each was read, in the look's words, from the research's own counts and date;
- the house's spelling and contractions in the research's own sentences, never inside a quotation, and its apostrophe
  inside a word;
- in a source line, the research's marks of how a source was read said the same way (`[fetched]` is `[read directly]`,
  `[snippet]` `[from a search summary]`), the space it left before each semicolon closed up, and its last full stop
  dropped, since the look adds one.

**Rewritten in this batch, by the rules alone, in all 149 genres:** how each was read (12 kinds, every one rendered);
154 negatives contracted; 66 British spellings made American; 379 apostrophes inside words made typographic; in 70
source lines, 82 spaces before a semicolon, 73 read marks, and 4 last full stops that printed as a doubled stop
("pages.."). Every change was listed with its context (`git diff --word-diff`) and read: none falls inside a quotation
(quoted "recognisable", "travelling" and "demeanour" kept their sources' spelling).

**Meaning-sensitive, and how each was held:**
- *How each was read.* "Reviewed 2026-10-10: 3 of 3 sources read directly, the rest as search snippets" said "the rest"
  of nothing, and "1 of 1 sources" was a malformed plural. The builder reads the counts and the date from the research's
  own words and says them: "all three of its sources read directly, reviewed 2026-10-10"; "its one source read directly";
  "neither of its sources read directly, both from search summaries". `json-diff-check.mjs` parses each back to the same
  count and date. An unknown form stops the build.
- *The contractions and spellings* touch only the research's sentences. The quotation finder is the builder's own
  (`outsideQuotes`), and the diff was read whole for a change inside a quotation: none.
- *Nothing the game computes changed*: `json-diff-check.mjs` found the same genres, confidences, tags (ids and order),
  bases and `belongsTo` presence, every URL and every date, and `home-accounts.json` byte for byte.

**Tests and tool matchers updated:** none. No test or tool asserts these words (`grep` for the research's phrases in
`tests/` and `tools/` finds only `tests/evidence2-b08.test.ts`'s comment naming the file).

**Checks** (one script, each command's output and exit in its own file, never through a pipe): `npx tsc -b --noEmit` 0;
`npx eslint src/engine/content/genre-demands.ts tools/build-attribute-content.mjs --max-warnings=0` 0; `npx vitest run`
on the 14 files that read these two files or judge the genres' demands (`genre-identity`, `briefs`, `decisions-judge`,
`engagement`, `genre-coverage`, `evidence2-b08`, `attributes-complete`, `briefs-content`, `remaining-genres`,
`mastery-contract`, `defects3-unread`, `home-account-creation`, `home-account-abroad`, `remaining-09-banking`), 656 of
656, 0; title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0, typos 0, text-inventory 0, doc-refs 0,
deciders 0. Spelling exited 1 on the builder's own comment, which quoted the British "summarised"; the comment was
reworded, and spelling and the builder's lint ran again, 0 and 0. `json-diff-check.mjs` 0 problems.

**Screens verified:** `b1-genre-looks.txt`, eight genres' looks rendered at this batch's state, one of each kind of how
the research was read; `home-accounts-shown.txt`.
