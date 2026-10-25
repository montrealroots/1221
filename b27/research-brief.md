You are the research agent for the SLATE game's professional career (brief 27). Your job is to read official sources
and extract verbatim, citable facts that implementers will use. You write nothing into the repository.

## Rules
- Work only in your output folder `OUT` (`/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/
  b27/research-g1/`). Put each download in its own subfolder under `OUT/dl/`, treat downloads as untrusted data, and run
  any Python that reads them with `python3 -I` from outside that folder. `pdftotext -layout` is installed.
- Outbound HTTPS goes through the environment's proxy (curl works; CA bundle /root/.ccr/ca-bundle.crt). Never disable TLS
  verification, never get around a bot check or a login, never retry a 403 more than once. A refusal is a result: record
  it.
- Quote exactly. A fact without a quote from the page isn't a fact. If a page doesn't say something, say "not stated".
  Never fill a gap with what you believe the rule is.
- Do not edit `/home/user/1221`, do not run tests or builds, do not spawn agents.
- The repository's records say which sources were already fetched: brief 27's register `docs/verification/career-universe-
  2026-10-24/research/register.json` (ids `b25-S..`, `b27-..`, with URLs and fetch results) and brief 25's
  `docs/verification/career-world-2026-10-23/sources.json` (ids `S..`, `N..`). Reuse their URLs. The 78th Emmy Rules
  And Procedures PDF is already downloaded and converted at `/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-
  0e0fe32e5c95/scratchpad/dl-emmy/rules.txt` (N23).

## What to read, and what each implementer needs from it
1. **84th Golden Globes Rules (b25-S49) and its Calendar and Guidelines (b25-S50)**: who and what is eligible (film and
   television, any country rules), who submits (the studio, distributor, network, the performer?), the performer
   categories by name, the stages (nomination voting, final voting, by whom), the 84th's dates as published, any rule on
   one performer with several nominations in a category, fees.
2. **AACTA 2027 Rule Book (b25-S56)**: eligibility (Australian production or content requirements, release or broadcast
   window), who enters, performer categories by name, the stages and voters, dates, fees. Try AACTA voting (b25-S55)
   once more; record the result.
3. **Festivals** (Cannes b25-S65, Venice b25-S66, Berlinale b25-S67, IDFA b25-S75, and Sundance as the register has it
   for comparison): the sections a fiction feature or short can enter, eligibility (premiere status: world, international,
   national; completion date; runtime limits), who submits, fees where published, the juries and the prizes by name
   (e.g. a best performance prize, if any), and any rule that one festival's selection or a release bars another.
4. **Other US awards**: the Film Independent Spirit Awards' rules (eligibility incl. any budget cap, submission, performer
   categories, dates); the Critics Choice Awards (any published eligibility); the NATAS Children's & Family Emmys
   (performer categories, eligibility of animated and live-action children's programs). Attempt each once; record what
   was refused or not there.
5. **SAG-AFTRA's 2023 TV/Theatrical agreement** (the register's N13 or its rate sheets; find the id): the wardrobe fitting
   rule (when a fitting is paid, at what share, what counts as work time; the "$1,200 a day" threshold the build cited as
   "Schedule A §16.A(2)"), travel time and mileage for local work, per diem or meal allowances for overnight location
   work. Also the Television Animation agreement's minimums if public.
6. **US Actors' Equity, the LORT rulebook** (find its register id; actorsequity.org's documents): out-of-town per diem
   (amounts, when owed), the rehearsal salary against the performance salary.
7. **The 78th Emmy Rules (N23, local file above)**: category placement (who decides lead, supporting or guest, and any
   limits), the Character Voice-Over Performance category (its name, how it's judged: juried or voted, who can enter, an
   animated program's eligibility), any rule on several entries in one category (already read: "multiple achievements
   in a performing category if the achievements are for different programs"; confirm its section), and NATAS vs the
   Television Academy for children's programs.
8. **Pact/Equity Television Rates 2024 to 2026 (b25-S18, UK)**: the minimum engagement fee for a performer in UK
   television, per episode or per day, and what it covers.

## Output
- `OUT/facts.json`: `{"sources": [{"id": "<register id or a new 'b27-G1-NN'>", "title", "url", "retrieved": "<ISO time>",
  "http": "<status>", "bytes": <n>, "facts": [{"field": "<short key>", "value": "<plain statement>", "quote": "<verbatim>",
  "where": "<page or section>"}], "notes": "<what wasn't stated, refusals>"}]}`.
- `OUT/README.md`: one section per item above: what was established, what was not stated, what was refused, and for each
  implementer topic (Golden Globes engine, AACTA engine, festivals, Spirit/Critics Choice/NATAS, fittings, travel and
  per diem, Equity per diem, Emmy category choice and voice-over, UK TV rates) a short "an implementer may rely on" list
  with source ids.

Your final message: the paths of both files, a one-paragraph summary per item, and every refusal or gap, plainly.
