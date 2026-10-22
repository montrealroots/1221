# Brief 21: Genre Integration And Banking Correctness, 2026-10-22

**Draft, while the final runs on `fd32e869` finish: each PENDING below is filled from them.**

The owner's brief 21 (`../briefs-2026-10-16/21-complete-genre-integration-and-banking-correctness.txt`, kept verbatim)
asked that genre knowledge be read, weighed and counted once wherever the work calls for it, and that banking follow
dated rules. Five things were named: the APY treated as nominal; the penalty rate at 30 days; the charge-off at 150; due
dates that moved with the month; standing orders paid on weekends. The brief asked for each fix to be proved with
controlled comparisons and independent figures, and for the work to stay reviewable, merged and deployed only at the
owner's word. Its items were written before any fix (`criteria.md`). This is the receipt (R1). A compact record of
the work as it went is `CHECKPOINT.md`.

**An automated proof isn't a person's play.** What follows says what was read, changed, measured and found. It doesn't
say there are no defects left.

## The Tested Commit

PENDING_TESTED

The starting point, `e50865df` (`main`, #51): brief 20's gate on the same source, exit 0, 479 of 479 test files and
5,481 of 5,481 tests, all 22 checks.

Brief 21's commits, in order:

| Commit | What |
|---|---|
| `6d3d9374` | The brief kept verbatim; the criteria and what the code did, before any fix |
| `1c624623` | G: one weighed measure of a work's genres, read on every path the brief names |
| `63091d78` | P1: the genre proof, which found the School's genre part complete only at 100 (fixed) |
| `168fabdc` | B and S: yields, a US card's days past due, its due day, standing orders; the old-save migration |
| `22dc917c` | The effects matrix's citations, the dev map and traceability brought to the new code |
| `59e9c4af` | What the proof, the journeys and the built app found, fixed (below) |
| PENDING_LATER | PENDING_LATER_WHAT |

## The Defects And Their Fixes

Each has a regression test that fails on the old behavior. The mutations, below, show it.

**Found at the start, from the money audit and the brief:**

| # | Defect | Fix | Test |
|---|---|---|---|
| D1 | An in-person audition, callback and a night on stage (professional or the School's) read no genre; School casting read none; a professional rehearsal day's lines ignored it | Every path reads the weighed measure (`relevantGenre`) | `tests/b21-genre-proof.test.ts`, the paths |
| D2 | A work's genre was its best-known tag: listing more tags could only help, and a tag listed twice or a broad genre beside its own kind counted again | Tags weighed, deduplicated, a broad genre beside its kind absorbed (the formula below) | the measure |
| D3 | A yield (APY, AER, TAE, GAT) run as a nominal rate: Capital One's 3.00% APY paid $3,041.59 a year on $100,000 | Converted to the nominal rate that earns it as the account credits it | B1 |
| D4 | A US card's penalty rate and the end of its introductory rate at the second missed due date, about 30 days late | From the 61st day past due the notice, 45 days on the rate | B2, B3 |
| D5 | A US card charged off at the sixth missed due date, about 150 days | At 180 days past due, counted in days | B4 |
| D6 | A US card's due date the statement plus the bank's days, so Chase's fell on the 10th, 11th or 13th | One day each month, at least the bank's days after the statement (`usDueDay`) | B5 |
| D7 | A British, EU or EEA standing order paid on a weekend or holiday | On the next business day of the paying bank's country | B6 |
| D8 | Lloyds', Nationwide's, Bankinter's and AIB's interest credited monthly | Yearly or half-yearly from opening, or in April and October, as each bank pays | B1 |

**Found by the proof, the journeys and the built app, after the first fixes:**

| # | Defect | How found | Fix | Test |
|---|---|---|---|---|
| D9 | The School's genre part complete only at 100: it read the known share of 90 | The genre proof | Prep is the total, complete at 0.9 | the School night path |
| D10 | A payment after a statement cleared a past-due minimum and the new one at once | Banking proof, the oldest-first timeline | `towardPastDue`; a US minimum takes in what's past due | 'counts from the oldest minimum still short' |
| D11 | The card panel said "Miss six in a row" and "Miss two payments in a row"; the Statements tab dated a US card's payment without the 13th | The built-app walk, both widths | The days past due said; `dueAt` given the US flag | `app/walk.mjs`'s EXPECT; editorial17-money, language-money |
| D12 | The Rep's 2026–27 Seagull read and taught no genre: in no play catalog, and its casting names no play | J2: the student went on as Nina twice and came to April knowing no genre | `SEAGULL_2027.kinds`, tragicomedy and drama, read through `genresOfHolder` | 'the Rep’s 2026–27 Seagull' (three tests); J2 |
| D13 | Citi's and Capital One's due day the 15th after any statement, 18 days after one on 28 January | The due-day table | The 15th, later after a statement past the 22nd | B5 |
| D14 | The tutorial's Your Bank said every card was charged off at six missed payments | Reading the tutorials against the rules after the tested commit's first run | The US days said, six only elsewhere | 'the tutorial and the guide say the days the game counts' |

A rehearsal's practice was found missing while the measure was built: a School call and a professional rehearsal day
are now practice in the play's or project's genres, as a night is (the `ur-1` life, dismissed once nights read the
genre and calls taught none).

## The Genre Formula, And Before And After

**Before** (`criteria.md`, What The Code Did): a genre counted as known by the better of familiarity and practice. A
taped brief, a professional self-tape and a shoot day read the best-known of the work's tags. An in-person audition, a
callback, a night on stage, School casting and a professional rehearsal day read none. A class scene and a part's lines
were learned faster by the best tag, by at most a sixth.

**After** (`src/engine/systems/engagement.ts`, `content/engagement.ts`):

- **A work's requirements** (`genreNeeds`): its tags deduplicated. Where there are two or more, the first listed carries
  half (`ENGAGEMENT.weights.primary`, 0.5) and the rest share the other half evenly; a lone tag carries the whole. A broad
  genre listed beside one of its own kinds is absorbed into the kind, which takes its weight. The weights sum to 1.
- **Each requirement met** by the best of what the person knows toward it, 0 to 100, at: the genre itself, whole; a
  kind of it, 0.75 (`related.kindToParent`); its broad genre, 0.5 (`related.parentToKind`); anything else, siblings
  included, 0. Unrelated mastery gives nothing.
- **The total** (`relevantGenre`): the weighed sum, 0 to 1, bounded, and never lower for more of any genre.
- **What it does, each counted once:**
  - **The work's quality:** the genre part of preparation, against 0.9 that completes it (`ENGAGEMENT.genreComplete`).
    It gates the choices (interpretation), with a floor of 0.75 (`partFloor.genre`): knowing none of it, the choices
    stand at 75% of what they'd be. A taped brief, a self-tape, an in-person audition, a callback, a shoot day and a
    night on stage, professional or the School's.
  - **Casting's reading:** a professional fit is half genre, `min(1, total ÷ 0.9)`, and half techniques. A School fit is
    a night of the play as expected, so the genre part is in it.
  - **The speed of preparation:** a part's lines, a class scene and a professional rehearsal day's lines, by
    `1 + total ÷ 6`.
  - **Practice:** a session's worth, 10 of what's left to 100, shared among the requirements by weight, at each taped
    brief, School call and night, professional rehearsal day, shoot day and night.
- **Preference is apart:** a genre loved makes a day better (enjoyment) and never the work. Loving every genre of a work
  counts for nothing in it (tested).
- **Attributes and techniques stay the foundation:** the genre part is one input of preparation among the lines, the
  blocking and the notes, and casting's genre is half of a fit; the rest is the craft. Mastery guarantees nothing: a
  Strong final round is at most 80 in 100 (`CASTING.most`), and the draw is the same.

**The figures** (`genre-proof.md`, written by `genre-proof.ts` from what `tests/b21-genre-proof.test.ts` asserts): the
same actor, day, preparation and draw, six documented seeds (`b21-proof-1` to `-6`), only the genres known changed.
Records: every relevant genre at 0, 45 and 90; one mastered and the rest at 0; all at 100; an unrelated genre (`western`)
at 100. Shapes: one genre, two even, one dominated, three or more, overlapping (a kind beside its broad genre), and
duplicate tags. For every path (School casting, a School night, an in-person audition, a self-tape, a callback, a work
day): the genre part 0 at none and 0.9 at the most, the choices' preparation 0.75 and 1 with it, the whole rising and
never falling, and the unrelated genre's whole equal to knowing none. What the most adds to the whole, over the seeds:
School casting 3.3 to 4.5; a School night 1.2 to 3.4; an audition in person 2.1 to 3.7; a self-tape 2.5 to 4.4; a
callback 2.0 to 4.1; a shoot day or a night of a run 1.9 to 5.5; professional casting's fit, by half of what the genre
moves.

## Banking: The Sources, The Rules And Worked Examples

Every source, its date and what's verified against what's SLATE's assumption: `banking-sources.md`, read 2026-10-22.
In short:

- **B1, a quoted yield** (Reg DD Appendix A; the banks' AER, TAE and GAT): r = m((1 + y)^(1/m) − 1), m the times a year
  it's credited; 365 where the terms compound daily (Wells Fargo). A day's interest is kept at full precision and posted
  in whole cents at the crediting, the fraction carried. Worked, each in `tests/b21-banking-proof.test.ts`:
  - Capital One 3.00% APY on $100,000, monthly at 2.9595%: $2,999.99 in a year, where it paid $3,041.59.
  - Wells Fargo 0.01% APY compounded daily on $10,000,000: $1,000.00 in a year.
  - Lloyds' Easy Saver 1.00% AER: once, a year after it opened, £360.65 on 5 January 2027, nothing at a month's end before.
  - Bankinter 5% TAE half-yearly from opening at 4.939% on up to €10,000: €244.92 on 5 July, before Spain's 19%.
  - AIB 0.25% AER in April and October: €33.06 and €52.92 before DIRT.
  - RBC's 0.55%, a nominal rate, left as it is: $24.50 for January's 26 day-ends on $62,543.
- **B2, B3, a US card's penalty rate and introductory rate** (Reg Z §1026.55(b)(4), comment 55(b)(4)-1, §1026.9(g)):
  counted in days from the due date of the oldest minimum still short, the notice on the 61st day, both 45 days after it.
  Worked, a minimum due 13 October 2026 left unpaid: the notice 13 December, the rate 27 January 2027, the default notice
  12 March, the charge-off 11 April. A twin who pays the whole statement on 13 November has nothing.
- **B4, the charge-off** (FFIEC, 65 FR 36903): 180 days past due. Leap years counted: a minimum due 13 November 2026 is
  charged off on 12 May 2027, one due 13 November 2027 on 11 May 2028.
- **B5, a US card's due day** (Reg Z §1026.7(b)(11)(i)(A), §1026.5(b)(2)(ii)): the same day each month, at least the
  bank's days after the statement: Chase's 13th after the 20th; Bank of America's and Wells Fargo's 17th; Citi's and
  Capital One's 15th, later after a statement past the 22nd. Every statement day of every month 2026 to 2029 checked.
- **B6, a standing order** (UK PSRs 2017 reg. 81(6); PSD2 art. 78(2); Lloyds', NatWest's and the Sparkassen's own words):
  on the next business day of the paying bank's country in the UK, the EU and the EEA. Worked, an order for the 3rd from
  Barclays in London: 3 February, 3 March, 7 April 2026 (Good Friday and Easter Monday passed), 5 May (a Sunday, then the
  bank holiday), 3 June. From a US bank, on
  its day, Saturdays included: an assumption, since no rule was read.

**Uncertain, and said so:**
- whether a US minimum payment due takes in what's past due (SLATE's reading; the CFPB's model statement shows both
  lines and no text read says either way);
- the crediting of Barclays', NatWest's, Bank of Ireland's and Banorte's savings (each source gives the basis but not when
  it pays);
- every product whose source gives no basis, run as nominal;
- Japan's fixed billing days;
- a US bank's standing order on a weekend;
- the charge-off outside the US, kept at the sixth missed due date.

## Saves

- **Nothing posted is rewritten.** Statements, transactions and balances in a save stay as they were; a due date already
  on a statement stays as it was disclosed.
- **One migration, only where needed:** a save with a US card behind is dated on opening from its last late fee and its
  count. It says so once, posts and charges nothing, and charges off 180 days from the first miss. What the old rule
  already sent isn't sent again. Test: 'S: a save from before brief 21 with a US card behind'.
- **No schema move:** `SAVE_SCHEMA_VERSION` and the guard's `SUPPORTED_SCHEMA_VERSION` stay 94. A deployment of brief
  20's line accepts this line's saves, and this line opens its saves.
- **Genre records need no migration:** the weighed measure reads the same per-genre familiarity and practice. Migration
  92 keeps its even split, so an old save migrates as it did.
- **Consumers followed:** the statement, the card's panel, autopay on the minimum, the late notice, the Statements tab,
  the guide, the tutorial and the profile read the new state. Older saves played on: brief 20's seven, in the final runs.

## Journeys

- **J1 and J2** (`tests/b21-journeys.test.ts`): J1, the J01 degree save (a life played through its degree, opened by
  this build): professional casting reads the genres its productions taught, a project in none of them fitted exactly as
  for a twin who knows none, and the work played adds practice in the project's genres. J2, a first year at Chase played
  straight to 1 April 2027 and again reopened on the 1st of each month ends the same: the Seagull's genres, every
  balance, posting, notice and the card. J2 found D12.
- **The built app** (`app/walk.mjs`, three saves from `app/make-saves.ts`, at 1440 and 390): Money's tabs, the card's
  terms, the last statement; the words brief 21 changed read off the screens; Advance, Save & Exit and Continue. It found
  D11. PENDING_APP
- **The final runs** (`final-runs/runs/README.md`): PENDING_RUNS

## Mutations

PENDING_MUTATIONS

## The Completion Matrix

PENDING_MATRIX

## The Gate

PENDING_GATE

## For The Owner

- **No merge, no deployment.** The branch is pushed; `main` is untouched.
- **SLATE's readings to confirm or change:**
  - a US minimum payment due includes what's past due;
  - the penalty rate not applied to new transactions earlier than the 45 days;
  - a hardship plan's payment bringing the card current;
  - a work's first-listed genre carrying half;
  - the Seagull's kinds as Uncle Vanya's.
- **Not changed, recorded:**
  - the class's expected genre record counts School productions and never the Rep, as it never did;
  - a class scene of The Seagull reads no genre speed (a class scene isn't one of the brief's paths, and migration 92
    reads the same lookup);
  - the Profile's next genre to study looks at the School casting, not the Rep's.
- **Outside this brief, at the owner's word:** the UI redesign, the OPT policy decisions, and the systems deferred before.

## Not Done, Or Not Measured

PENDING_NOTDONE

## To Look For Yourself

```powershell
git switch claude/peaceful-hamilton-59zdbb
npm ci
npm run gate *> "$env:TEMP\gate.txt"; "exit=$LASTEXITCODE" | Out-File -Encoding utf8 "$env:TEMP\gate-exit.txt"
npx vitest run tests/b21-genre-proof.test.ts tests/b21-banking-proof.test.ts tests/b21-journeys.test.ts
npm run build; npx vite preview --port 4187
```

Then, in the game at http://localhost:4187, at desktop width and on a phone-sized window:
1. **A card behind:** put `docs/verification/genre-banking-2026-10-22/app/saves/behind.json.gz` in a slot (`app/walk.mjs`
   shows how). On Money, Cards, open The Card's Terms: the due day, the 60-day rule and the 180-day charge-off. On
   Statements, the card's last statement says how much of the minimum is past due.
2. **A yield:** `capone.json.gz`, Accounts: "Pays 3.00% APY (2.96% a year before compounding)".
3. **A standing order:** `london.json.gz`, Payments And Cash.
4. **A first year's genres:** play a new life into March 2027 and understudy the Seagull; the Profile's Genres show
   tragicomedy and drama practised.
5. **The table:** `genre-proof.md` has every path's figures, seed by seed.
