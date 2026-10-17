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

## Batch 2: Absurdist To Drama

**Sources read (38):** `genre-demands.json#` absurdist, adventure, alternate_history, animated, anime, anthology,
apocalyptic, art_house, avant_garde, biker, biographical, black_comedy, blaxploitation, body_horror, buddy_comedy,
buddy_cop, caper, chanbara, chase, childrens, christmas, coming_of_age, concert_film, conspiracy_thriller, cosmic_horror,
costume_drama, courtroom_drama, creature_feature, crime, cyberpunk, dance, dark_fantasy, detective, disaster, docudrama,
documentary, domestic_drama and drama: every field the look shows, read in the research, then read again rendered.

**Rewritten (94 edits, in `genre-demands-words.txt`'s batch 2):**
- The research's working words, which a player can't read, in the look's own: a tag and its id ("the 'camera' tag", "no
  transformation tag was given") as the requirement by its name ("Naturalism On Camera", "the research doesn’t name
  Physical Transformation"); "the vocabulary" and "the fixed vocabulary" as "the requirements the game can ask for";
  "snippet", "fetched", "returned 403", "blocked", "pointer" as "from a search summary", "read directly", "couldn’t be
  opened", "used only as a lead"; "my own reading" as "a direct reading"; "the input defines" as "the game defines"; a
  genre's id ("costume_drama", "creature_feature") as the genre by its label.
- The review's notes, stuck on the end of what's uncertain and often repeating its first sentence ("Reviewed 2026-10-10:
  One film’s casting rule (The Wild Angels). Not applied genre-wide."), as one sentence saying what the review decided:
  "On review (2026-10-10), one film’s casting rule wasn’t enough to make it a requirement of the whole genre." Where the
  review took a requirement away, it says so: "The review of 2026-10-10 took Accents away: …".
- What a demand belongs to, read inside the look's own sentence: art house's "Modernist / auteur art cinema (…) and the
  slow-cinema strand; director-specific methods" and cyberpunk's, which ended "not the genre as a whole, not to the genre
  as a whole".
- Fragments with no subject ("Defines the genre as comic; says nothing about acting."), a claim that rendered as one
  breathless sentence (adventure's), and anthology's "segments" (the game's word for part of a scene) as "stories", the
  genre's own definition's word.

**Kept:** every quotation, name, figure, date and citation; documentary's words (only the rules touched them); the
reasons the look doesn't show (a low genre's), in the research's words with the house's spelling.

**Meaning-sensitive, and how each was held:**
- *A requirement named where the research named a tag.* Each name is the look's (`DEMAND_LABEL`); docudrama's "mapped to
  Character Work" is the technique the game trains it as (`DEMAND_TECHNIQUE.transformation` is `character`, Character
  Work), checked by printing both tables.
- *"Not applied genre-wide" as "wasn’t enough to make it a requirement of the whole genre."* True of each: each is low
  confidence, so `applied` is false and `genreTags` empty (`tests/engagement.test.ts` holds that for every genre).
- *Costume drama's "The fit between 'heightened' and movement … is loose. Reviewed 2026-10-10: the heightened tag was
  removed."* Its tags are empty in the research and in the game; the words say it was taken away, as the research did.
- *Concert film's "a design question"* is said as "a question for the game, not the research": no more than the
  research said.
- *Cosmic horror's pointer to creature_feature's evidence on reacting to nothing* still points there; that genre's look
  says the claim was general effects practice and isn't used, as its research does.
- `json-diff-check.mjs`: 0 problems; the only figure gone is the HTTP code 403, in ten fields, said as "couldn’t be
  opened"; three source lines' prose changed (caper's, detective's and domestic drama's read marks), every URL kept.

**Tests and tool matchers updated:** none assert these words. `docs/GENRE-COVERAGE.md` was regenerated
(`npx vite-node tools/genre-coverage.ts`), since it quotes `belongsTo`: art house's, concert film's and cyberpunk's
changed there, and `tests/genre-coverage.test.ts` holds it to the tables.

**Checks** (the same script as batch 1): tsc 0; eslint 0; vitest on the same 14 files, 656 of 656, 0; title-case 0,
label-sweep 0, plural-check 0, voice-check 0, tics 0, spelling 0, typos 0, text-inventory 0, doc-refs 0, deciders 0.

**Screens verified:** `b2-genre-looks.txt`, all 38 looks rendered at this batch's commit, read whole; `sweep-words.mjs`
finds none of the research's working words in them outside quotations, and every ".." in the file is an ellipsis inside
a quotation.

## Batch 3: Dystopian To Picaresque

**Sources read (38):** `genre-demands.json#` dystopian, eco_horror, epic, erotic_thriller, espionage, experimental,
exploitation, fairy_tale, family, fantasy, film_noir, folk_horror, gangster, giallo, gothic_horror, grindhouse, hangout,
heist, historical_drama, historical_fiction, holiday, hood_film, horror, horror_comedy, isekai, jukebox_musical,
kitchen_sink, legal_drama, magical_realism, medical_drama, military, monster_movie, mystery, neo_noir, nordic_noir,
occult, parody and picaresque.

**Rewritten (all 38, in `genre-demands-words.txt`'s batch 3):** the same translations as batch 2, and:
- What a demand belongs to where it was two labelled lists in one sentence: historical fiction's "dance: period
  stories …; heightened: adaptations …" as "period stories with social-dance scenes … for Dancing, and to adaptations of
  period plays … for Heightened Language". Folk horror's, neo-noir's, epic's, occult's and experimental's read inside the
  look's sentence, lowercase, with an article.
- Four first lines a player reads that had no verb (dystopian's, eco-horror's, fairy tale's and family's): "No source
  found for what dystopian fiction as a genre asks of actors; one production …" as two sentences.
- Source lines' prose marks: "(paywalled; search snippet)", "(blocked; search snippet)", "(403; search snippet)",
  "(certificate error; search snippet)" as "(behind a paywall; from a search summary)", "(couldn’t be opened; …)", "(the
  site’s certificate failed; …)"; "e.g." as "such as". The citations themselves are untouched.
- The applied genres' reasons, shown: kitchen sink drama's "genre-wide:" label gone; jukebox musical's subjectless
  "Entailed by…"; horror comedy's and erotic thriller's "entails" as "calls for".
- Hood film's "draws on" (the inventory's engine-speak for what a scene asks of an actor) as "builds on". Picaresque's
  "generalises" is made American by the builder's spelling map, which has "generalise" and its forms from batch 1.

**Meaning-sensitive, and how each was held:**
- *Every "Not applied genre-wide" as "wasn’t enough to make it a requirement of the whole genre"*: each such genre is low
  confidence (`json-diff-check.mjs` compares every confidence).
- *Giallo's review note*, which repeated its first sentence, says the review's decision once: the reason (Voice-Led
  Performance weak for the on-screen actor, resting on a search summary) is in the sentence before it.
- *Monster movie's "non-monster-movie snippets (Casper, Hobbit)"* as "search summaries about other kinds of film (Casper,
  Hobbit)": the same two films, the same reason they weren't used.
- *Exploitation, gangster, hood film*: "so no stunt tag", "so no accent tag" as "the research didn’t name Fights And
  Stunts", "… Accents": what the research proposed, not what the game applies, which the look says separately.
- `json-diff-check.mjs`: 0 problems; the HTTP code 403 left eight more fields, said as "couldn’t be opened", and twelve
  more source lines' prose changed, all of it the research's marks of how a source was read, every URL kept.

**Tests and tool matchers updated:** none assert these words. `docs/GENRE-COVERAGE.md` regenerated (epic's,
experimental's, folk horror's, giallo's, historical fiction's, horror's, military's, neo-noir's and occult's
`belongsTo` changed there).

**Checks** (the same script): tsc 0; eslint 0; vitest on the same 14 files, 656 of 656, 0; title-case 0, label-sweep 0,
plural-check 0, voice-check 0, tics 0, spelling 0, typos 0, text-inventory 0, doc-refs 0, deciders 0.

**Screens verified:** `b3-genre-looks.txt`, all 38 rendered at this batch's commit and read whole.
