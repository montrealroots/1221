# Genre Differentiation, 2026-10-16

The owner's brief "Complete Genre Differentiation And Prove Each Genre's Identity", done on `claude/zen-mccarthy-i88ujw`
from `main` at `35d032d`. It uses the work plan's dating (2026-10-16); the commits are dated 2026-10-14 and 2026-10-15
by the clock. It's not merged or deployed. The complete genre matrix is `genre-matrix.md`.

## What Was Wrong

Measured on `35d032d` with `tools/ag-baseline.ts`, beside the acceptance criteria
(`docs/verification/attributes-genres-2026-10-16/acceptance-criteria.md`):

- **A genre was what its two briefs happened to share.** The engine read nothing of a genre itself but how well it was
  known and, for 41 genres, the techniques its scenes staged.
- **Seven pairs of briefs, each of two different genres, were the same in every number a take read**, readings aside
  (G2): Biker and Coming Of Age, Children's and Science Fantasy, Christmas and Holiday, Dystopian and Medical Drama,
  Espionage and Neorealism, Family and Steampunk, Nordic Noir and Social Realism. Each pair had the same medium, size,
  stakes 1 and a steady reader, the same five feature levels, and the same three beats' tones (comic, then grave, then
  grave and lyric, or a close variant), over entirely different scenes.
- **A genre's two scenes were further apart than genres were** (G1): a median of 4.92 between genres against 6.59
  within a genre, and 148 of the 149 genres had a nearer neighbour than their own second brief.

## What Changed

**Every genre has a register** (`src/engine/content/concerns.ts`, `src/engine/content/genre-register.ts`):

- **The concerns.** There are thirteen, each a register the work is played in, not a technique or a setting: Feeling
  Held In, Played Straight, Played Large, Comic Rhythm, Caught Live, Dense Text Exact, Another Age's Manners, Belief In
  What Isn't There, States At The Limit, Played Between Two, Suspense Held, The World's Own Logic and Command Of The
  Frame.
- **What each rests on.** Each concern cites an acting principle from the project's acting research (subtext,
  tempo-rhythm, naturalism, period movement, Lecoq's dramatic territories, the measured timing of jokes). It names what
  the take weighs more, what it draws on, and which preparation answers it, checked against the tape task by a test.
- **Each genre's assignment.** Every genre has one or two concerns, each with why. 113 rest on the genre's own research
  claim (`basis: 'research'`, mostly at low confidence, as the research said). 36 are SLATE's reading of the genre's
  conventions where the research found nothing on how it's played (`basis: 'reading'`), and the screen says so.
- **What reads it.** Every take of a brief written for the genre reads its register in `briefContext`, as a reader's way
  of playing is read: leans on the dimensions, normalized, and abilities drawn on. Its strength is a reading's
  (`CONCERN_STRENGTH`, lean 2 and draw 2, as `BRIEF.readingLean` and `readingDraw`), so the genre and the reading chosen
  weigh alike. It moves weight and adds none.

**The seven pairs' briefs were revised**, each from what its own text already said, keeping every scene:

| Pair | Engine-read values that were identical | Now |
|---|---|---|
| Biker / Coming Of Age | camera, short, stakes 1, steady reader, t1 ph0 pa2 vo0 im0, comic / grave / grave+lyric | Biker: stakes 2, a pressing reader (the prospect begs), partner 3; Command Of The Frame and Played Between Two. Coming Of Age: an unpredictable reader, improvisation 1 (his rehearsed speech falls apart); Caught Live and Played Straight. |
| Children's / Science Fantasy | camera, short, stakes 1, steady, t1 ph1 pa2 vo0 im0, comic / comic+grave / lyric | Children's: timing 2, vocal 1 (a formal speech played for laughs); Played Straight and Played Large. Science Fantasy: stakes 2, a withholding reader, improvisation 1 (the keeper knows and waits; the con is made up as it goes); Belief In What Isn't There and Played Large. |
| Christmas / Holiday | camera, short, stakes 1, steady, t1 ph1 pa2 vo0 im0, comic / grave / lyric | Christmas: partner 3 (his story changes her by the line); Played Straight and Played Between Two. Holiday: timing 2 (an eleven-year double act); Played Straight and Comic Rhythm. |
| Dystopian / Medical Drama | camera, medium, stakes 1, steady, t2 ph0 pa2 vo1 im0, grave / comic+grave / grave | Dystopian: stakes 3, a withholding reader (the officer's recording badge); Belief In What Isn't There and Feeling Held In. Medical Drama: stakes 2, a pressing reader (the attending turning away); Dense Text Exact and Played Between Two. |
| Espionage / Neorealism | camera, short, stakes 1, steady, t1 ph1 pa2 vo0 im0, grave / grave / grave+lyric | Espionage: stakes 3, a withholding reader (the handler's coded answers); Feeling Held In and Command Of The Frame. Neorealism: stakes 2, improvisation 1 (a son's fever, a haggle found live); Caught Live. |
| Family / Steampunk | camera, short, stakes 1, steady, t1 ph1 pa2 vo0 im0, comic / grave / lyric+comic | Family: timing 2, partner 3 (a comic treaty, her question); Played Between Two and Comic Rhythm. Steampunk: heightened language (guild procedure), stakes 2; Belief In What Isn't There and Another Age's Manners. |
| Nordic Noir / Social Realism | camera, medium, stakes 1, steady, t1 ph0 pa2 vo0 im0, grave / comic+grave / grave | Nordic Noir: stakes 2, a withholding reader (the clerk's silences); Feeling Held In and Suspense Held. Social Realism: improvisation 2, partner 3 (only the sum and the demand are fixed); Caught Live. |

**The player sees it** (`src/engine/systems/register.ts`):

- **The brief's pane** has The Genre Asks under How They Play It: each concern, what the take weighs more and draws on,
  the preparation that answers it, and where the register comes from.
- **The take's note.** The forecast's line, the last take and Your Takes Of It add the concern behind the chief limit
  where the genre asked for that ability ("Composure held back the consistency by 4.2 points: Nordic Noir's Feeling Held
  In asks for it"). It stops once that ability no longer holds the take back. A take keeps its concern (`Take.concern`,
  optional, so a save from before loads as it was).
- **Elsewhere.** The genre's look has How Its Scenes Are Played, with ways to the abilities it draws on. The guide's
  Genres entry has a row, a line and a mistake about it, and the tutorial's You As An Actor a sentence.

**Kept results.** A kept take is worked out again from its own stored leans and draws (`replay`), which this doesn't
change, so the evaluation's version (`RULESET`) didn't move. A take from before, reloaded, is the take it was
(`tests/genre-identity.test.ts`).

**On the way:**

- **The guide's worked examples' actor went from 60 to 62.** At 60 the take with a recording sat exactly on the
  callback line (65.0 played, 64.9 by the guide), so a tenth decided whether the example's callback existed. Its
  stamina's full is now a 24-year-old's (99.4), as the played life's is.
- **Two tests.** A milestone journey's strong take landed at exactly 80, so it's taped a quarter of a breakdown in. A
  stamina bound is read at the take's precision.

## The Genre Matrix

`genre-matrix.md`, written by `tools/genre-identity.ts --md`, has every genre a row:

- its conventions, as its source defines them;
- its families and its register, with the basis;
- the techniques its research applies;
- what the take weighs more and draws on;
- the preparation that answers it;
- its briefs, each with size, stakes, reader, features and readings: how its scenes vary and what interpretations they
  offer;
- its nearest genre before and now, whether that neighbour shares its register, and how far its own two briefs are
  apart.

The player sees each of these in the same three places, the brief's The Genre Asks, the take's note and the genre's look.
The engine reads them in `briefContext` (the register), `tapeReadsOf` (the techniques) and `genreKnown` (proficiency).

**Legitimate overlap.** The 149 genres have 60 distinct registers, and 129 genres share theirs with at least one other.
Most of the sharing is one tradition or family: horror's subgenres (States At The Limit), the naturalist tradition (Caught
Live: social realism, neorealism, mumblecore, kitchen sink), the period dramas (Another Age's Manners), the creature films,
the westerns and noir. Genres that share a register are told apart by their scenes, their staged techniques and their
readings, and G2 shows no two briefs of different genres read alike. Some groups are less obviously kin: Holiday sits with
Parody, Black Comedy, Horror Comedy, Teen and Tragicomedy (Played Straight and Comic Rhythm), because each claim is
earnestness inside comedy. The matrix shows each.

## How It Was Proved

**Controlled comparisons**: the same scene, the same actor, preparation and day, with only the genre changed. The
`tests/genre-identity.test.ts` cases, with figures measured on 2026-10-16:

- **The seven pairs, both ways.** Every ability one register draws on by 0.3 or more than the other (summed from
  `CONCERNS`, not the engine) favours its specialist in that genre: more than 30 such checks across the fourteen scenes.
  On Nordic noir's scene, the focus specialist was +1.3 and the composure specialist +1.0 as Nordic noir against social
  realism, and the adaptability specialist -1.1. On steampunk's scene, the imagination specialist was +2.3 as steampunk
  against family.
- **Who a genre rewards.** An actor at 70 in composure and focus and 40 in listening and adaptability takes Nordic noir's
  scene at 56.3, against 54.1 for the opposite actor. On social realism's scene the opposite actor is ahead, 57.9
  against 55.1.
- **Preparation.** Social realism's scene, its rehearsal left short, costs an even actor 15.5 points as social realism
  and 15.0 as Nordic noir, since Caught Live leans on rehearsal.
- **Mastery.** All fourteen pair briefs, every reading, every fitting way of playing: 100 for a mastered actor. The
  catalog's own guarantee test (`tests/briefs.test.ts`, every brief, reading and way) holds.
- **Proficiency.** Genre known at none, 0.3, 0.6 and 0.9 raises the take each step, nothing past 0.9. Knowing another
  genre fully adds nothing, and emptying another genre's register leaves the take where it was.
- **The note.** A take held back most by composure in Nordic noir names Feeling Held In. Once composure no longer holds
  it back, the note says what does. An ability no concern of the genre asks for names none.
- **Played.** A save prepares, reads and tapes Nordic noir's brief through its commands. The take keeps its concern
  through a reload and is worked out again to the same figure. Continued after the reload, with composure worked on, the
  next take is better and its note no longer names composure.
- **The screen.** `tests/genre-identity-screens.test.ts` draws the pane: Nordic noir's and social realism's The Genre
  Asks, steampunk's "SLATE's reading" line, and the note on the forecast, the last take and the takes table.

**The criteria**, on `tools/ag-baseline.ts` at the code before (`35d032d`) and after:

| Criterion | Before | After |
|---|---|---|
| G1 (as written) | 0.75×, 148 nearer | 0.95×, 146 nearer: **fails, an owner's decision (below)** |
| G1, length and stakes held (`--controlled`) | 0.92× | 1.22× |
| G2 | 7 identical pairs | 0, with the register and without it |
| G3 | emotional depth best on 56 of 149; 6 actors on 10 or more | emotional depth 56; 8 actors on 10 or more, imagination 6 to 16 |
| M1 | 4,495 of 4,495 at 100 | 4,495 of 4,495 at 100 |
| O1 (own result across readers) | sd 0 | sd 0 |
| A2 (no pair of abilities at 0.9) | 0 pairs | 0 pairs |
| A3 (no universal bonus) | holds | holds: every ability's cv over the pieces it moves 0.39 or more |
| F2 (the first-named weakness the largest gain) | 311 of 447 (69.6%), fails | 301 of 447 (67.3%), fails, slightly worse |

**Repetition in practice.** `tools/brief-journeys.ts`, a 120-day played term on seed bj-0. "Before" is `--no-register`,
the screen as it was, showing the limit alone. "After" shows the limit with its concern.

| | Different notes | Longest run of one | Same note again in another genre | Longest run of one recommendation |
|---|---|---|---|---|
| Beginner, before | 6 | 3 | 2 | 4 weeks |
| Beginner, after | 14 | 2 | 0 | 4 weeks |
| Specialist, before | 5 | 2 | 1 | 3 weeks |
| Specialist, after | 10 | 2 | 0 | 3 weeks |

The limit alone, without the concern, repeated a little more with the register (the specialist's longest run 2 to 4):
the same ability held several takes back, in different genres, each for that genre's reason, which the note now says.

**Mutations**, each applied, run against both genre-identity test files, and restored and compared:

| Mutation | Result |
|---|---|
| The register not applied | Killed: 2 tests |
| Its leans dropped | Killed |
| Its draws dropped | Killed |
| One register for every genre | Killed: 3 |
| The take keeps no concern | Killed: 2 |
| No concern behind a limit | Killed: 3 |
| The register at a reader's strength (1) | Killed |
| Social realism's scene called Nordic noir | Killed: 3 |
| Social realism given Nordic noir's register | Killed: 3 |
| The pane hides The Genre Asks | Killed |
| The pane drops the note | Killed |
| Christmas's and Holiday's revisions undone | Killed: they read alike again |

**Through the screens.** `tools/acceptance-ui.mjs` gained two genre steps on the `brief` save:

- each of the seven pairs' briefs opened, with The Genre Asks found different on each;
- Nordic noir's and social realism's briefs prepared, read, rehearsed, taped, the note read, saved, continued and taped
  again.

They ran at 1440 and at 390 against the build of this revision. The results are in the work plan and the handoff.

## What's Still Open, And The Owner's Decisions

- **G1 as written fails, and can't be met without what the brief rules out.** Its first clause, 1.5× between genres
  over within, was reached only by making a genre's two scenes identical in length, stakes, medium, language and
  features (1.75 to 2.04, simulated). Its second clause isn't reached even then (108 to 118 of 149), because genres that
  rightly share a register are each other's nearest neighbors. With the register at a reading's strength it's 0.95×,
  and 1.22× with length and stakes held. Feature floors from each genre's concerns across 152 briefs would reach 1.38.
  The thresholds weren't moved. Keeping 1.5 means one formula per genre; recalibrating it, or measuring the controlled
  ratio, is the owner's call.
- **A way of playing it doesn't interact with the genre.** Restrained against expansive moves a take by the actor's own
  abilities, the same within a tenth in Nordic noir, melodrama and social realism. A reading's advantage moves about a
  tenth between genres too. A genre-appropriate choice shows in who the genre rewards and which preparation pays, not in
  the playing choice. Making some ways of playing suit a genre would be a rule that some interpretations are less right,
  against the house rule that none is: the owner's decision.
- **F2 is a little worse:** 301 of 447, against 311.
- **The register's claims are mostly the research's low-confidence ones**, and 36 genres' are SLATE's reading. A brief
  listed under further genres is played in the register of the genre it was written for (`kinds[0]`).
- **Not re-run:** the long journeys through graduation and the mastery plans (`tools/mastery.ts --mode plan`), as phase
  2c of the attributes brief would. The other scenario saves of the acceptance run (tax, leave, lien and the rest) weren't
  regenerated, since nothing here reaches them.
