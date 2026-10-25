# Brief 27 research, G1: awards, festivals, union rules (read 2026-10-25)

`facts.json` holds 49 sources and 522 facts. Each fact has a verbatim quote from a file under `dl/`. Every source
records its `download` (the bytes as served) and `text` (the text read: `pdftotext -layout` for PDFs, the page's text for
HTML). `tools/verify_quotes.py` checks every quote against two renderings of its download, with whitespace collapsed and
zero-width spaces removed: the kept text, plus `pdftotext` without `-layout` for PDFs or the HTML's text joined without
separators. The last run found 522 of 522. `fetch-log.jsonl` logs every request: time, HTTP status, bytes and sha256.
Every request used one browser user agent through the proxy, with TLS verified. No request got a 403.
The three images in `render/` are pages from the 2023 and 2026 SAG-AFTRA memoranda, drawn with `pdftoppm`. They show the
strikethroughs, which plain text loses (item 5). Source ids: `b25-S..`/`b25-N..` and `work-S36` are already in the
repository's registers. `b27-G1-NN` are new.

---

## 1. Golden Globes, 84th (b25-S49 rules, b25-S50 timetable)

**What was established.**
- **Eligibility.** Films are scripted features of 70 minutes or more, released January 1 to December 31, 2026. "Released"
  means a seven-day commercial run (theatrical or pay-per-view, not subscription) in one of seven US metro areas
  (S49 A.1.a–b). A festival screening is not a release.
- **Performers in films.** A film's performers are eligible only if the film is entered for Best Motion Picture. The
  exceptions are non-English-language films and "low-budget independent" films: fully independently financed, with a gross
  budget under $10 million USD (A.1.c). Films from outside the US need no US release for the Non-English award (A.3.c.viii).
  Their performers qualify only if the film is classified Drama or Musical/Comedy (A.3.c.v).
- **Television.** A program must first air in the US in the qualifying year, in prime time unless it is on cable or a
  subscription platform (C.1.b). Foreign programs are ineligible unless they are a US–foreign co-production, financial and
  creative, that precedes the end of production (C.1.d). Language does not matter (C.1.e). Animated programs may enter
  (C.1.f). TV performers need their program entered in a Best Television category (C.1.j).
- **Performer categories.** Film has six: female and male actor in Drama, female and male actor in Musical or Comedy, and
  female and male actor in a Supporting Role in any Motion Picture. TV has eight plus Stand-Up: Series – Drama, Series –
  Musical or Comedy, Limited Series/Anthology/TV Movie, and Supporting Role on Television, each female and male (A.2, C.2).
- **Voice-only work** is ineligible in film and TV (A.3.d.i, C.3.e.iii). Comparable ensemble roles go all lead or all
  supporting (C.3.e.v). Anthology leads need segments covering at least 50% of the running time (C.3.c.iv).
- **Who submits and who decides.** "The studio or publicist" submits and initially picks the categories, lead or
  supporting included (F.1.k). The Eligibility and review committees can change an entry by a two-thirds written ballot
  (F.1.l). Entries go through Yangaroo and the Indee platform (F.1.a).
- **Stages.** Only voters designated by Golden Globes, LLC vote, in two phases monitored by an accounting firm (G.1.a).
  At nomination, each voter ranks up to six per category; the six with the most votes are the nominees, and rank points
  only break ties (G.2.a, G.2.c). In the final vote, each voter picks one per category. A tie goes to the nominee with
  more nomination votes, and if still tied there are two winners (G.3.a).
- **Fees.** $250 per individual entry and $500 per film or program (F.1.f). An individual entered for several productions
  pays for each entry. Indee charges $5,000 per title (F.1.g). Productions under $2 million may ask about fee alternatives
  (F.1.i).
- **84th dates (S50).** Submissions opened June 1 and closed October 30, 2026. TV nomination ballots go out November 16
  and are due November 23. Film nomination ballots go out November 24 and are due December 4. Nominations are December 7,
  2026 at 5 a.m. PST. Final ballots go out December 18 and are due January 2, 2027. The ceremony is January 10, 2027, at
  the Beverly Hilton, on CBS and Paramount+.

**What was not stated.** There is no rule on one performer holding several nominations in one category. There is no rule
on a performer's nationality, and no rule that a performer may submit themselves. The rules cite "Campaign Guidelines
below", but the PDF has no such section, and S50's page text does not carry them either. S50 spells the accounting firm
"KMPG" once.

**What was refused.** Nothing.

**An implementer may rely on (Golden Globes engine):** S49 A.1.a–c, A.2, A.3.c.v–viii, A.3.d, C.1.b–f/j, C.2, C.3.e,
F.1.a/f/g/k/l, G.1–3. S50 for every 84th date.

## 2. AACTA 2027 (b25-S56 rule book, b25-S55 voting, b27-G1-01 governance, b27-G1-02/03/04 entry pages)

**What was established.**
- **Production eligibility.** A production qualifies by any one of: "significant Australian content" under the Income Tax
  Assessment Act 1997, 51% Australian financing, an official co-production or Australian creative control, or AFI/AACTA
  discretion (S56 3.2(a)). A production entered before can never enter again (3.2(b)). An "Australian" person is someone
  born in Australia, a citizen or passport holder, or a permanent resident of five or more years (2(f)).
- **Who enters.** The Producer, or a representative of the production company or distributor/broadcaster (3.1(b)). Every
  producer must agree to the entry (3.7(d)). A production enters one category (3.3(a)(iv)). TV categorisation needs the
  broadcaster's senior executive and the senior production executive to agree (3.3(a)(v)). AFI may override the category
  (3.7(a)(vi)).
- **Film.** A Feature Film is 60 minutes or more; an Indie Film has a budget under AUD 2 million (7.2). It must be
  released by a seven-day run in two capitals including Sydney or Melbourne, or by a qualifying festival plus four paid
  screenings, or on a qualifying VOD/SVOD platform or free-to-air (7.3(a)).
- **Television.** The first episode must be broadcast in Australia within the TV eligibility period (6.3(b)).
- **Performer categories.** Film: Best Lead Actor, Lead Actress, Supporting Actor and Supporting Actress in Film (7.1).
  TV: Best Lead Actor and Lead Actress in a Drama, Best Acting in Comedy in a Lead Role and in a Supporting Role, and Best
  Supporting Actor and Supporting Actress in a Drama (6.1). Rule 6.3(c) calls the drama supporting awards "Guest or
  Supporting".
- **Performer rules.** The entrant chooses lead or supporting. No candidate can be both for the same production (6.3(c),
  7.3(d)). Voice-over actors in animation are ineligible (6.3(c)(vii), 7.3(d)(vi)). Motion capture is at discretion
  (7.3(d)(vii)). At least five candidates must be Professional members (6.4, 7.4).
- **Voters.** Professional members decide TV nominees and winners (6.8(s)), and film nominees and winners (7.8(b)). G1-01
  adds that film and TV production and acting are decided by all Professional members across two rounds. Short Film is
  open to General (weighted 50%) and Youth (25%) members too. Voting is by secret ballot, verified by PKF.
- **2027 dates and fees (G1-03, G1-04).** Entries opened July 6 and closed September 28, 2026. Film Round 1 runs October 2
  to November 9, 2026; TV Round 1 starts October 16, 2026, with its end TBC. Nominations and Round 2 are TBC. The window is
  releases or first broadcasts from January 1 to December 31, 2026. Film fees run by budget: $600 under $500k, $1,150 up to
  $2M, $1,980 up to $4M, $2,200 over $4M. A drama, comedy, miniseries or children's program costs $1,480. The rule book
  says fees are in Australian dollars including GST (2(o)).

**What was not stated.** The rule book itself has no dates or fee amounts; it defers both to the website. No per-performer
fee is listed. There is no ceremony date. The film page still says entries "are open" after its close date. The rule book's
FAQ still cites the "2026" rule book.

**What was refused.** Nothing. b25-S55 was retried once as asked and returned HTTP 200 (49,619 bytes); the register had
recorded two connection resets. The film entry page reset once (HTTP 000) and returned 200 on its one retry; both attempts
are in `attempts`.

**An implementer may rely on (AACTA engine):** S56 2(f), 3.1–3.3, 3.7, 6.1, 6.3–6.5, 6.8, 7.1–7.5, 7.8. G1-01 for the
voting rounds and voter tiers. G1-03 and G1-04 for the 2027 dates, fees and window.

## 3. Festivals (Cannes b25-S65, b27-G1-05/06; Venice b25-S66; Berlinale b25-S67/S68, b27-G1-07/08/10; IDFA b25-S75; Sundance b25-S70)

**Cannes.**
- **Sections.** The Official Selection has Competition, Un Certain Regard and Cannes Première, and the selection committee
  decides the section (S65, G1-05 Art. 3).
- **Features.** Produced in the last 12 months, with distribution limited to the home country. No internet showing or DVD.
  Selection in another festival's international section makes a film ineligible. Competition films must be released
  theatrically in France. A feature runs over 60 minutes, and 15 to 60 minutes is not accepted. The 2026 deadline was March
  13 (S65). Fees are €300, €350 or €75 excluding VAT, paid by the producer or sender.
- **Shorts.** Under 15 minutes, deadline March 2, 2026, fee €25 excluding VAT.
- **Prizes.** The Competition jury must give the Palme d'or, Grand Prix, Best Director, Jury Prize, Best Screenplay, Best
  Actress and Best Actor, one award per film. Screenplay or the Jury Prize may be paired with an acting award by
  dispensation (G1-05 Art. 8). A Palme d'or or Grand Prix winner may not compete at another international festival
  (Art. 9). Shorts compete for a Palme d'or (G1-06).
- **Next edition.** May 11–22, 2027.
- **Not stated:** jury size and membership.

**Venice (83rd, 2026).**
- **Dates and eligibility.** September 2–12, 2026. World premieres only, completed after September 6, 2025. No prior
  public showing anywhere, including at home, no other international festival, nothing on the web (S66 §3, §7.2).
- **Sections.** Venezia 83 takes at most 21 features. Orizzonti takes at most 19, plus Orizzonti Corti shorts of at most
  20 minutes.
- **Juries and prizes.** The Venezia jury has at most 7 members. Its prizes include the Coppa Volpi for Best Actress, the
  Coppa Volpi for Best Actor and the Marcello Mastroianni Award for Best New Young Actor or Actress. There are no joint
  winners, and an acting prize may be paired with another prize once only. The Orizzonti jury has at most 5 members and
  gives Best Actress, Best Actor and Best Short Film awards.
- **Submissions.** Opened February 9. Features closed June 4, shorts May 28. Fees: €200 per feature (€250 from May 15),
  €80 per short (€100 from April 30). Producers, distributors or other authorised parties submit.

**Berlinale.**
- **Deadlines and fees.** Features by October 21, 2026 and shorts by November 4, 2026. Completed within 12 months. Fees
  €175 per feature, whatever the number of sections, and €75 per short (S67).
- **Premieres.** World premieres are preferred. A home-country release or festival is accepted except for German films.
  German premieres and anything shown on TV, the internet or VOD are excluded.
- **Competition (G1-07).** Fiction, documentary, animation and experimental films of 60 minutes or more, as world or
  international premieres. A film's country is the producer's headquarters.
- **Shorts (G1-08).** Up to 30 minutes. They compete for the Golden Bear for Best Short Film, the Silver Bear Jury Prize
  and the CUPRA award of €20,000.
- **International Jury (G1-10).** Chosen yearly by the Festival Director. Its awards include the Silver Bear for Best
  Leading Performance and the Silver Bear for Best Supporting Performance, both gender-neutral. Nothing ex aequo, and one
  prize per film, except that acting awards may be added.
- **Not stated:** the 2027 festival dates and jury size.

**IDFA (39th, November 12–22, 2026).** A documentary festival: "documentary film in a broad sense … including hybrid
films" (S75 §1.2). A fiction feature or short is not eligible as such, and no performance prize is listed.
- **Eligibility.** Completed after July 10, 2025. Anything already shown, broadcast or online in the Netherlands is
  ineligible. Competitions need a world, international or European premiere.
- **Entries.** Entry fees run €25 to €85 by deadline (April 23, May 28, July 9). The juries are five for the International
  Competition, five for Envision and three for shorts.

**Sundance (2027, for comparison, S70).**
- **Categories and premieres.** Under 50 minutes is a short; 50 or more is a feature. US narrative features need world
  premiere status and at least half US financing. International narrative features need international premiere status.
  Shorts completed after December 31, 2025 are eligible whatever their premiere status.
- **Fees.** Features $80, $100 or $125 by deadline (July 27, August 28, September 21, 2026). Shorts $55 to $95.
- **Placement and prizes.** Submitters cannot pick a program. Competitions give "jury prizes and an audience award", and
  every accepted feature is eligible for the audience-balloted Festival Favorite Award.
- **Not stated:** any named performance prize. The FAQ says it is superseded by Festival Rules & Regulations, which were
  not fetched.

**One festival barring another.** Cannes excludes a film selected for another festival's international section, and bars
a Palme d'or or Grand Prix winner from another international competition. Venice excludes any work shown at another
international festival or on the web. The Berlinale excludes films shown outside their home country in public, at an
international festival or on release, and anything on TV or VOD. IDFA excludes prior showing in the Netherlands, and
breaking an agreed premiere status may cost a film its invitation. Spirit Awards: films can qualify through one of nine
festivals, the Berlinale included (b27-G1-11), so Spirit eligibility is not barred by festivals.

**What was refused.** Nothing.

**An implementer may rely on (festivals):**
- **Cannes:** S65 (conditions, durations, deadlines, fees), G1-05 Art. 3/4/8/9, G1-06.
- **Venice:** S66 §1, §3, §6.1–6.2, §7.1–7.5, §11.
- **Berlinale:** S67 §2.1–2.2 and §3.2–3.3, S68, G1-07, G1-08, G1-10.
- **IDFA:** S75 §1.1–1.5, §2.4, §3.
- **Sundance:** S70 Q1–Q9.

## 4. Other US awards (Spirit b25-S53/S54, b27-G1-11/12; Critics Choice b25-S57, b27-G1-13/14/21/22; NATAS b25-S60, b27-G1-15/16)

**Film Independent Spirit Awards (2027, the 42nd).**
- **Eligibility.** Films run at least 70 minutes and cost under $30 million after tax incentives; the John Cassavetes
  Award ceiling is $1 million (S53, G1-11). A film qualifies through a 2026 slot at one of nine festivals (the Berlinale is
  new), a week in a US commercial theater in 2026, or paid streaming or VOD in 2026. Once nominated, a film cannot enter
  again.
- **Acting.** Only actors in "American Narrative" films are eligible for acting awards. American means US
  citizens/residents in two of director, writer and producer, or significant US setting and content.
- **Submitter.** The filmmaker or distributor (G1-11 rule 5).
- **Categories.** Film: Best Lead Performance, Best Supporting Performance and Best Breakthrough Performance. TV: "Best
  Lead/Supporting/Breakthrough Performance in a New Scripted Series" (G1-12); the FAQ omits "New". Performers may submit
  Lead + Breakthrough, Supporting + Breakthrough or Breakthrough only, but can be nominated in only one (S53).
- **TV eligibility.** New series airing October 1, 2025 to September 30, 2026, with at least two episodes of 18 minutes or
  more. Performers come only from series entered as Best New Scripted Series. International series must air on a US
  platform and be a US co-production (G1-12).
- **Fees.** Film: $400/$500/$600 for members, $450/$550/$650 for non-members, by deadline. TV: $525/$625 for members,
  plus $100 per performer per category. Nominees pay a $4,200 screener fee.
- **Stages and dates.** Nominating committees pick the nominees; Film Independent Members vote the winners and may vote
  only in categories where they have seen every nominee. Nominations December 2, 2026; ceremony March 6, 2027.

**Critics Choice Awards (32nd).**
- **Dates.** The ceremony is January 3, 2027. The film and TV eligibility windows are January 1 to December 31, 2026
  (G1-21, G1-22). Film submissions run October 21 to November 9; TV submissions September 21 to November 16. Nominations
  December 4. Final ballots go out December 21 and are due December 31.
- **Stages.** Film nominating ballots go to "Film Branch" members. TV nominations come from "TV NomComs".
- **Performer categories (S57).** Film: Best Actor, Best Actress, Best Supporting Actor, Best Supporting Actress, and Best
  Young Actor/Actress (18 and under at filming). TV: Actor, Actress, Supporting Actor and Supporting Actress, each in Drama
  Series, Comedy Series, and Limited Series or Movie Made for Television.
- **Not stated:** any eligibility rule beyond the windows: no premiere, language or country rule, and no fee.

**NATAS Children's & Family Emmys (CAFE).** The latest call for entries published as a PDF is the 4th (2025), version
2025.0.1 (G1-15).
- **Window and dates.** Programs first available in the US June 1, 2024 to May 31, 2025. Entry August 14, late entry
  August 26. Nominations the week of December 1, 2025; ceremonies Q1 2026.
- **Fees.** Performer entries $350, late $400. No member or bulk discounts.
- **Audience and contest placement.** CAFE covers programs for ages infancy to 15. Animation for ages 16 and up belongs
  to the Primetime Emmys. Preschool is ages 0–5, and children's and family ages 6–11, both "animated and live action". An
  "Animated Program" is two-thirds animated. The Eligibility Panel and administration, not the entrant, decide the contest.
- **Performer categories (nine, non-gendered).** Lead, Supporting and Younger Performer in a Preschool, Children's or
  Young Teen Program; Puppetry Performer; Single Role and Multiple Role Voice Performer, each in a Preschool Program and in
  a Children's or Young Teen Program; Younger Voice Performer.
- **Performer rules.**
  - One performance category per program, agreed by the show and the performer.
  - Performers 18 or under enter Younger or Lead/Supporting, not both.
  - The same role on several shows is one entry, but playing a role live and voicing it in animation are two entries.
  - Fully voiceover live-action performances may enter the voice categories.
  - Narrators may enter only Children's Personality.
  - Self- or agent submission is allowed with the rights holder's permission.
  - A younger performer on a Primetime-eligible show (the example given is "Abbott Elementary") cannot enter CAFE.
- **Judging.** Peer judges must watch everything in their categories. Blue Ribbon judging sets nominees and winners in the
  same round, and the highest average wins.

**What was refused or missing.**
- The Critics Choice "Submission guidelines" pages (G1-13, G1-14) returned HTTP 200 but are script shells of about 5.5 KB
  with no text. Unreadable without a browser, and not pursued.
- NATAS names a "5th Annual Children's & Family Emmy® Awards" (G1-16), but its button leads to an entry portal
  (enter.theemmys.tv). It was not followed, and no 5th call for entries PDF is on the rules page.

**An implementer may rely on (Spirit / Critics Choice / NATAS):**
- **Spirit:** S53, S54, G1-11 (rules 1–7, categories, fees), G1-12 (rules 1–5, categories, fees).
- **Critics Choice:** S57 for categories; G1-21 and G1-22 for windows and stages.
- **NATAS:** G1-15 for every CAFE rule above (state that it is the 2025 contest); S60 and G1-16 for what is current.

## 5. SAG-AFTRA (b25-N13 2014 CBA; amendments b25-N15 2017, b25-N16 2020, b25-N17 2023, b25-N12 2026; rates b25-N01; animation b27-G1-19)

The 2023 TV/Theatrical agreement is the 2023 MOA, **b25-N17**, which amends the codified 2014 CBA, **b25-N13**. The 2026
MOA (**b25-N12**, July 1, 2026 to June 30, 2030 per b25-N18) amends it again.

**Fittings: what the build cited is outdated.**
- **The build's citation.** It cited "Schedule A §16.A(2): none over $1,200 a day". That is the 2014 text: "over $1,000
  per day (over $1,200 per day with respect to contracts entered into on or after July 1, 2015)" (N13).
- **2020.** The 2020 MOA raised it to over $1,200, and over $1,400 for contracts from July 1, 2020 (N16).
- **2023.** The 2023 MOA's redline (N17 item 20.b, PDF page 52, image `render/moa2023-p52-052.png`) strikes "$1,200",
  "$1,400" and "July 1, 2020". It inserts "$1,400", "$1,500" and "[the first Sunday after the AMPTP's receipt of notice of
  ratification]". The plain text merges struck and inserted text ("over $1,200 $ 1 .400 per day"), so the image is the
  evidence.
- **2026.** The 2026 MOA (N12 item 16.a, pages 20–21, `render/moa2026-020.png` and `-021.png`) strikes "over $1,400",
  "over $1,500.00" and "December 10, 2023". It inserts: no prior-day fitting pay for day performers receiving "$1,500.00
  or more" a day, or "$1,700.00 or more" for contracts from "July 1, 2026 or the first Sunday after the business day on
  which the AMPTP receives notice of ratification, whichever is later".
- **What it means at scale.** The day performer minimum from July 1, 2026 is $1,283 (N01). Comparing the two quoted
  figures, $1,283 is under $1,700, so under the 2026 text a scale day performer is paid for a fitting on a day before
  work. That pay is one hour minimum per call, then 15-minute units (N12 16.a, N13 §16.A(2)).
- **Unchanged parts.** A same-day fitting is "work time and part of the performer's continuous day", with a signed
  voucher (N13 §16.A(1)). A day performer fitted and not used gets one day's pay (§16.A(3)). Weekly performers (Schedule B
  §20) owe four free fitting hours on two days per week worked, then pay at the contract rate with a one-hour minimum call.
  A fitting before the start date does not start consecutive employment.
- **What share.** The hourly rate behind "one (1) hour minimum pay" is not defined in §16.A(2).

**Travel time and mileage for local work (N13 Schedule A §32; N15).**
- **Studio zones.** The LA zone is 30 miles from Beverly and La Cienega. The NY zone is 30 miles from Columbus Circle
  (with the 8-mile New York Zone rules).
- **Mileage.** Reporting in the LA zone away from the studio pays $.30 a mile, studio to the reporting place and back, but
  nothing within 10 miles of a point the producer designates. The rate rises with any better IATSE rate. Parking is paid.
  The 2017 MOA restated $.30 for the TV Agreement and added $4.50 a day in the LA secondary zone (N15).
- **Locations and travel time.** A location is outside the zone. An overnight location is where the performer is lodged
  or that takes overnight to reach. Travel at the producer's request between the reporting place and a location is travel
  time and work time. A travel day without work pays a day.
- **Freezes.** The 2020 MOA froze allowances, the 2023 MOA froze them except relocation and wardrobe, and the 2026 MOA
  kept them unless it says otherwise.

**Overnight per diem.**
- **2014.** $12 breakfast, $18 lunch and $30 dinner, $60 in all. These are minimums, individually bargainable. Meals the
  producer furnishes may be deducted. Checks are due before each workday (day performers) or workweek (weekly) (N13 GP
  §35.B(2)).
- **2023.** Raised to $14/$21/$35 ($70) from the first Sunday after ratification notice, and $16/$22/$37 ($75) from the
  first Sunday two years after (N17 item 21; the column headers are read from the page image).
- **2026.** Plus $5 from July 1, 2028 ($1/$2/$2) (N12 item 29.a). The $80 total after July 1, 2028 is arithmetic, not a
  quoted figure; the background per diem table in the same MOA does show $75, then $80.

**Television Animation (G1-19).** 2023–26 minimums per film or segment run to June 30, 2026:
- **Over 10 minutes:** $1,082, $1,158, $1,204, $1,246.
- **10 minutes or less:** $981, $1,050, $1,092, $1,130.
- **Each voice after the third** (10 minutes or less): $317, $339, $353, $365.
- **Legacy AFTRA, over 10 minutes:** $1,120, $1,198, $1,246, $1,290.
- **Not found:** any 2026 TV Animation rates or MOA on AMPTP's contracts page (G1-18).
- **Not stated in the wage sheet:** session length and voices covered. That is in the 2014 TV Animation Agreement, which
  was not fetched.

**What was refused.** Nothing in this run. sagaftra.org pages (b25-S20/S21/S95/S97 and others) were not retried, because
the register records two 403s each; AMPTP's copies were used instead.

**An implementer may rely on (fittings):** N12 item 16.a (the 2026 threshold) with the page images. N13 Schedule A
§16.A(1)–(3) and Schedule B §20 for the unchanged rules. N01 for the day rate. N16 and N17 for the history.
**(travel and per diem):** N13 Schedule A §32.A/F/G/J/K and GP §35.B(2), N15 for the TV Agreement's §56 mileage, N17
item 21 and N12 item 29.a for the per diem amounts. G1-19 for TV Animation minimums through June 30, 2026.

## 6. Actors' Equity, LORT (work-S36 summary of changes; b27-G1-20 the 2023–27 LORT-AEA agreement at lort.org)

The register id is **work-S36**: `docs/research/career-2026-10-20/work.md` S36, the cdn.actorsequity.org "LORT Negotiations
2023 Summary of Changes". The full agreement is at lort.org; the repository cites it without an id in
`docs/research/world/research-agency-change-and-scheduling.json`, so it is **b27-G1-20** here.

**What was established.**
- **Term.** February 13, 2023 to June 27, 2027 (work-S36).
- **Per diem.** $50.00 for that period (G1-20 Rule 55(L)(3)). It is owed on local or overnight tour days when the actor
  returns after 6 PM, unless all meals are provided or the call is evening-only (55(L)(4)). Overnight tours pay the
  touring minimum plus per diem (55(L)(2)). Rehearsing away from the theatre's city brings housing and per diem for that
  period (Rule 51(G)). A transfer to a second city for 16 weeks or more needs no per diem (55(U)).
- **Housing.** Provided "at no cost to the Actor", with room taxes and utilities (Rule 30(A)). An actor who says in
  writing that they are local releases the theatre from providing it (30(G)(10)).
- **Rehearsal salary.** "Full contractual salary" from the first call, whether rehearsal or performance (55(A)(1)). A
  rehearsal-only first week may be prorated in sixths (55(A)(2)).
- **Minimums.** LORT D: $776, $807, $839, $889 (as of 6/29/26). C: $972, $1011, $1051, $1114. A+: work-S36 gives $2117
  as of 12.29.25 and $2244 as of 6.29.26, while G1-20 gives $2141 as of 6/29/26 and $2244 as of 12/27/2026. The two
  documents differ.

**What was not stated.** No "out-of-town per diem" for an actor engaged from outside the theatre's area: such an actor gets
housing (Rule 30), and the $50 per diem attaches to tours and away rehearsals. No rehearsal salary distinct from the
performance salary.

**What was refused.** Nothing. actorsequity.org's own LORT pages beyond the summary PDF were not needed.

**An implementer may rely on (Equity per diem):** G1-20 Rules 30(A), 30(G)(10), 51(G), 55(A)(1)–(2), 55(L)(2)–(4) and
55(U). work-S36 for the term and the minimums table, noting the A+ difference.

## 7. 78th Emmy Rules (b25-N23, version 4, 04.07.26; local copy in `dl/emmy-78th-rules-pdf-copy`)

**Category placement.**
- **Who decides.** "It is the decision of the entrant whether to enter as a lead, supporting or guest performer"
  (Performer Awards, Entry Information, printed p.47, PDF p.51).
- **Limits.**
  - Guest only for performers in under 50% of episodes.
  - Performers follow the show's comedy or drama categorization.
  - One character on several programs gets one category.
  - After a lead or supporting nomination, no guest entry for that role later.
  - One achievement, one category; the Awards Committee gives final approval (Entry Procedures 6).
  - Placement is finalised 72 hours before the nominating ballots, and entering does not assure placement (Introduction).
  - The Emmy Awards Committee is the final arbiter of eligibility.
- **Who may enter.** Producers enter programs; individuals may enter themselves (Entry Procedures 4).

**Several entries.** Confirmed in that same section, PERFORMER AWARDS – ENTRY INFORMATION, printed p.47: "Lead,
supporting, and guest performers may enter multiple achievements in a performing category if the achievements are for
different programs (provided the performer is playing a different character)." Entry Procedures 5 has the general form.

**Character voice-over.**
- **The category.** Category 75 is OUTSTANDING CHARACTER VOICE-OVER PERFORMANCE, "for a continuing or single voice-over
  performance in a series or a special" (printed p.49, PDF p.53). Any character voice counts, however the visual is made.
  Voice performers and narrators may not enter lead, supporting or guest.
- **Entries.** Several characters in one episode may each be a separate entry. A voice manipulated by AI must submit the
  original recording. The video is at most 2½ minutes from one episode.
- **Animation.** Character voice-over in animation is for programs aimed at 13 and over. "Children's animated programs,
  which target an audience under the age of 13 will only be eligible in the Children's & Family Emmys." Animated programs
  over 20 minutes, and short-form animation, list Character Voice-Over among their individual categories.
- **How it is judged.** It is a "Category", which means head-to-head voting with the highest vote-getter winning; it is
  not one of the "Juried" awards. Appendix II puts it on the Animation peer group's ballot, for directors, executive
  producers, producers and voice-over performers, and on the Performers peer group's ballot.

**NATAS vs the Television Academy.** A program entering the Primetime Emmys cannot have entered another national Emmy
competition, Children's & Family included (Criteria 4). Moving to another competition needs an Industry Panel appeal
(3b). Game and reality shows whose contestants are all children must enter CAFE. The two academies draw the age line
differently: the Television Academy sends children's animation for under-13s to CAFE, while NATAS's CAFE covers ages
infancy to 15 and sends animation for ages 16 and up to Primetime (G1-15).

**What was refused.** Nothing. The file was downloaded earlier in the session by brief 27's F; it was copied in here.

**An implementer may rely on (Emmy category choice and voice-over):** N23 Introduction, Entry Procedures 4–6, Criteria
for Eligibility 3b and 4, Performer Awards Entry Information, Category 75, Category 76 (narration as a character),
Awards Definitions 1, Appendix II. G1-15 for CAFE's side of the split.

## 8. Pact/Equity Television Rates 2024 to 2026 (b25-S18; b25-S17, b25-S19)

**What was established.** The rate card's columns are Current, 2024, 2025 and 2026.
- **UK Television Engagement fee:** £557.00, £596.00, £617.00, £635.50.
- **Production day:** £61.50, £66.00, £68.00, £70.00.
- **Regional Engagement Fee:** £158.50 in 2026.
- **One Day Engagement T(8)4a and 4b:** £309.50 and £402.00 in 2026.
- **Multi-episodic Cat B:** £178.00. **Rehearsal period day:** £132.50. **Travel T(44)2:** £25.50.
- **Appendix TL SVOD Engagement Fee:** £848.00.
- Equity's page says its agreements set minimum weekly and daily rates, plus holiday, hours, living-away and meal
  allowances (S19).

**What was not stated.** Whether the engagement fee is per episode, per programme or per day. What it covers: days
included, uses, repeats. When each column takes effect. The card gives labels and clause numbers only.

**What was refused or missing.** The Pact Equity TV Agreement (2021) that defines these items is listed on Pact as "Member
Only Content" (S17). It was not requested from a members area. Equity's rates page (S19) is a script-driven selector with
no TV agreement text.

**An implementer may rely on (UK TV rates):** S18 for the figures and their labels only. Do not infer per-episode or
per-day meaning.

---

## Refusals and gaps, all items

- **HTTP 403s:** none in this run.
- **Connection reset:** b27-G1-03, the AACTA film entry page, returned HTTP 000 once; its single retry returned 200.
- **Unreadable:** b27-G1-13 and G1-14, Critics Choice guidelines, are script shells. b25-S19, Equity UK, is a script
  selector. b27-G1-09 is an index page with no text.
- **Not attempted:**
  - The Pact Equity TV Agreement (2021) and the rate card's members copy (member-only).
  - The NATAS 5th CAFE entry portal.
  - sagaftra.org pages (403 twice each in the register).
  - The 2014 SAG-AFTRA TV Animation Agreement.
  - Sundance's Festival Rules & Regulations.
- **Not published or not found:**
  - Cannes 2027 regulations; 2026 was read, and the next edition is May 11–22, 2027.
  - Venice 2027 regulations; 2026 was read.
  - The Berlinale's 2027 dates.
  - AACTA's nominations and Round 2 dates (TBC).
  - A 2026 TV Animation wage sheet.
  - A 5th CAFE call for entries PDF.
