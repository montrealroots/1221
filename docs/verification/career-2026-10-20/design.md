# Brief 19's Design: The Professional Beginning, 2026-10-20

What's built, where, and on which rules. The research is in `../../research/career-2026-10-20/` (each fact with its source, the date read and
its words); this says which facts the game uses, which it assumes and labels, and which it leaves out. The criteria are
`criteria.md`. Nothing here restores the deleted industry engine (`git show bcc30c88^:src/engine/systems/career.ts` is
read for ideas only) or any personal-life system the scope reset removed.

## Three Kinds Of Statement

Every rule in the code carries one of three marks in its comment, and the player-facing text never blurs them:
- **Verified:** a published rule, with the research file and source id (e.g. `../../research/career-2026-10-20/yale.md` B27 p.148).
- **Assumption:** the game's stand-in where sources are silent, said as one (`ASSUMPTION:` in the code, listed below).
- **Fictional:** an event or a line that is the game's invention: every word and decision of the agent, every project
  and every casting office.

## The Agent: One Real Person, Depicted With Care

**From 2026-10-21 he's fictional, at the owner's word** ("Let's go ahead and swap in a fictional agent."): Thomas
Ashgrove of Halberd Talent's New York legit department, both names invented, in Jordan Parente's place as one entry in
`content/agents.ts` (`59da1351`). What follows was the design for the real agent, and holds where it still can: the
department's published way in is kept (no submissions it hasn't asked for; the School's follow-up or a referral), said as
the game's own rule; he never seeks the player out; his voice. What went with the real name: the sources, the line
marking each of his words fictional, and the notice's warning not to contact the agency. The notice where he first
appears says he and his agency are invented, as every project and casting office is.

- **Jordan Parente, agent in the Legit (Theatrical) Department of Stewart Talent's New York office** (`../../research/career-2026-10-20/agent.md`:
  the agency's own New York staff page, read 2026-10-20; Deadline, 2025-09-18; the Actors Connection listing, 2025-06-02).
  His published scope: television, film, Broadway, Off-Broadway, national tours and regional theatre.
- **The agency's policy, verified:** "We do not accept unsolicited submissions at this time" (New York legit). The game
  keeps it: an unsolicited submission is refused in those terms. He's reached by the School's showcase follow-up or a
  referral from someone the player has actually worked with.
- **What the game uses:** his name, the agency, the New York office, the department and its scope, the policy. **Never:**
  contact details, clients, terms, his tastes or manner, any claim he attends the showcase or has seen anyone, a
  franchise claim (unverified).
- **He never seeks the player out.** The agency warns that people pose as its representatives to approach unrepresented
  actors. So no message from him arrives unprompted: a showcase follow-up comes from the School, a referral from the
  person who made it, and his answers come only to an approach the player made.
- **The notice where he first appears,** kept and reopened from his panel, marked Fictional there: that he's a real agent
  at Stewart Talent, that everything he says and decides in the game is invented, that he hasn't seen the player's work
  and isn't involved, and that Stewart Talent's New York legit department doesn't take unsolicited submissions, so not to
  contact the agency about the game.
- **His voice:** procedural and neutral. A line states what happened (a request, a decision, a date, a term), never an
  opinion of the player's work beyond the factors the game computed, and never praise or warmth the record doesn't
  support.
- **Swappable:** he is one entry in `content/agents.ts`. A second agent, or a fictional one in his place, is another
  entry with its own data; no engine code names him.

## The School's Rules, And The Five Pathways

From `../../research/career-2026-10-20/yale.md` (Bulletin 2026–2027, dated 2026-08-30):
- **A, the degree:** three years in residence, six terms; the final term holds DRAM 793b, the Actor Showcase, presented
  to "agents, managers, casting directors" in New York and Los Angeles after spring classes end and before
  Commencement (2026: New York April 27–28, Los Angeles May 5; Commencement May 18). An Incomplete must be cleared by the
  fourth week of the final term to take part. Students who aren't Equity members "will attain membership to the union
  upon graduation" through Yale Rep.
- **B, representation while enrolled:** no rule against it is published. Allowed. It never withdraws the student;
  signing is neither employment nor permission to work.
- **C, work while enrolled:** in session the School "discourages" outside paid or unpaid professional work; "In rare
  situations, professionally meaningful, short-term outside work that is communicated to the program chair and dean with
  timeliness and transparency is approved"; only students in good standing may ask; a written proposal (dates, missed
  classes, assignments, visa considerations), the chair's recommendation and the dean's written decision; Yale Rep calls
  rank first; "Accepting and performing outside work without required approval is regarded as a conflict of interest and
  may lead to academic warning or dismissal." International students approved for outside work must get OISS's work
  authorization first, and CPT is processed only for training "required of all students" (none found for Acting).
  Summer work isn't governed by the in-session rule; the School can hold a student for recess work.
- **D, leaving:** withdrawal exists (`school.withdraw`); a student who withdraws may normally reapply; leave is "not
  normally" granted for a professional commitment. The career goes on with the training stated truly.
- **E, early graduation:** "on rare occasions the faculty ... may reduce the residency requirement, but in no case below
  a minimum of two years." No criteria or way to ask is published, and no Acting case found. **Unavailable**, said where a
  player would look (the School's Terms And Award, the Career's pathways), with the Bulletin's sentence. No accelerated
  degree is made.

ASSUMPTIONS for C: the request is due 14 days before the work's first day ("timeliness"); "short-term" is at most 10
working days; "professionally meaningful" is a professional engagement under a union contract or a paid principal role
(not a student film); the dean's decision comes 7 days after the request; it's approved only when every condition holds
and the work takes no Yale Rep call and no more than two class days, which leaves it rare; unapproved in-session work
brings an academic warning the first time and dismissal the second (the Bulletin's two named steps, in that order).

## The Record (`person.pro`, Optional, Schema Unchanged At 94)

`src/engine/systems/pro.ts` holds `ProRecord` and its accessors; `content/agents.ts` the agent; `content/careerwork.ts`
the projects and rates. The name `career` is not free (`migrate` deletes `person.career`), nor is a scheduled kind
beginning `work.` (`migrate` drops them): the record is `pro`, the kinds `pro.*`.

```ts
interface ProRecord {
  since: Instant;                       // when the record began (enrollment, or the opening that built it)
  name?: string;                        // professional name; the display name until set
  credits: ProCredit[];                 // professional and student-film credits only; school credits are read from school.credits
  materials: Material[];                // headshots, résumé versions, reels
  relations: Record<AgentId, AgentRelation>;
  agreements: Agreement[];
  opportunities: Opportunity[];         // live, and the last 40 resolved
  engagements: Engagement[];            // live, and the last 20 finished (their credits stay forever)
  showcase?: ShowcaseRecord;
  outsideWork?: OutsideWorkRequest[];   // route C's requests and their decisions
  unapproved?: number;                  // in-session work done without approval
  equity?: { since: Instant };          // Equity membership (at graduation, per the Bulletin)
  sag?: { eligibleSince?: Instant; memberSince?: Instant };
}
```

- **Ids:** one new namespace, `pro`, issued by `nextId` for every opportunity, engagement, agreement, material, credit,
  history event and payment, so nothing resolved can come back under a new name.
- **Credits** (`ProCredit`): `{id, kind: 'stage' | 'screen' | 'student-film', project, role, company, year, medium,
  status: 'performed' | 'shot' | 'released' | 'unreleased', union?, engagementId}`. Permanent and small. The résumé reads
  these and `school.credits` as two lists; practice, briefs and self-tapes are never credits.
- **Materials** (`Material`): `{id, kind: 'headshot' | 'resume' | 'reel', made, source, contains, cost?, version}`.
  Provenance is `source` (a photographer's session; the résumé from the record on a date; a reel cut from recorded
  material) and `contains` (the takes, the DRAM 473b filmed monologues, a released screen credit's footage). A reel holds
  only what was recorded: a self-tape take, the School's filmed monologues once posted (DRAM 473b, Bulletin p.33), and a
  screen credit's footage once released. Live performances aren't recorded. Usability is worked out, never stored: a
  headshot over two years old reads as out of date (ASSUMPTION); a résumé missing a credit since it was made reads as
  behind; a reel with no screen material reads as tapes only.
- **Bounded:** history events capped at 80 per relation with counts kept; resolved opportunities at 40; finished
  engagements at 20. Credits, materials and agreements are kept.
- **Building it:** a new life's record begins at enrollment; an older save's is built once on opening (`ONCE_ON_OPENING`,
  `pro.begun`), from what the save holds. A graduate's save gets Equity membership dated at the degree.

## The Showcase

In the School (`systems/school.ts` beside the courses, or `systems/proshowcase.ts`), as DRAM 793b's work in the final term:
- **Eligibility:** enrolled in the final term, no Incomplete outstanding after its fourth week (Bulletin p.26).
- **Material:** two scenes chosen from the course's options, matched to genres the player knows (`engagement`) and parts
  suited to them; chosen by the player with the faculty's note on each.
- **Preparation:** the course's rehearsals on the School's calendar, and the player's own work on the scenes (the
  coursework's preparation model).
- **Scheduled:** New York on the Monday and Tuesday after spring classes end, Los Angeles the Tuesday after; each a
  School call with travel time inside it (ASSUMPTION: the trip's hours are part of the call).
- **Judged:** each scene by `evaluation.ts` with the preparation, the day's condition and the scene's demands; recorded
  in `person.work` and the journey; the faculty's note in the course's feedback.
- **Follow-up:** through the School, in the week after. Whether the agent's office asks to meet is fictional and computed
  from the factors below, the showcase's judged band among them; never guaranteed, and said as the School passing on a
  request. ASSUMPTION: industry guests attend (the sources give only dates and venues).

## The Agent's Interest, Factor By Factor

`systems/proagent.ts`. Each factor is a separate value with its words, shown in a drill-down (Why It Went This Way):
1. **The work he has seen:** the best judged band among the showcase's scenes, the reel's material and a referring
   job's work.
2. **Its relevance:** how much of it is stage and screen legit work (his department's scope), by medium.
3. **Training and experience:** the degree (completed, in its final term, or left after N terms) and professional credits.
4. **Fit with his focus:** media and the fields in his published scope; commercial and voice work aren't his department.
5. **Availability:** in school until the degree, the work eligibility in force, the location.
6. **Roster needs (stated simulation data):** each year his list has openings for some types (billing and age range),
   drawn by a decider and shown as the game's assumption, not his.
7. **Reliability, from events:** meetings kept or missed, materials sent when asked, missed calls in the record.
Each yields a level (short of, near, at, beyond what he looks for). The decision needs enough of them at or beyond, then
a competitive draw among the year's other actors (decider `pro.agent`): high skill raises the chance, never makes it
certain. Repeats can't wear him down: after a pass, a year before he'll consider again; after silence or a declined
offer, six months; a new approach needs something new (a credit, a better reel, a referral) or it's refused as nothing
new to consider (ASSUMPTIONS, each said where it applies).

## The Relationship

Stages: discovered → materials checked → introduced (showcase follow-up or referral) → materials sent → waiting →
response (silence, a request for more, a pass, a meeting) → meeting (scheduled at the office or by video; kept, missed
or moved once if asked before) → decision (offer or pass) → agreement (shown; accepted, declined or let lapse after 14
days) → represented → ended. Each step is an event with a stable id in the relation's history, and the history panel
lists them.

## The Agreement

Shown in full before it's accepted (`AgreementTerms`), each term marked verified or simulation:
- **Scope and territory:** stage, film and television (the legit department's scope), the United States. Commercials and
  voiceover aren't covered (a separate department; ASSUMPTION that they'd sit elsewhere).
- **Exclusivity:** exclusive in the covered fields (ASSUMPTION, the usual form).
- **Commission:** 10% of gross pay for covered work (SAG-AFTRA's and New York's 10% caps; Equity's 5% on weekly salaries
  of $525 or less, 10% above; none on the Equity-minimum part of per diem). On SAG-AFTRA scale work the offer is scale
  plus 10%, so the commission comes out of the 10%.
- **Duration:** one year from signing (ASSUMPTION, within Equity's limits and SAG-AFTRA's 18 months for a first contract).
- **Responsibilities:** he seeks and submits for covered work, conveys offers and negotiates, collects pay into the
  agency's client trust account and passes it on less commission; the player keeps him told of availability, keeps
  appointments and doesn't book covered work around him.
- **Termination:** by agreement at any time; by the player if no bona fide offer of covered work came in 90 days (Equity's
  rule) or, after 151 days, fewer than 10 days' covered work in the last 91 (SAG-AFTRA's, from its snippet, labeled so);
  the term's end without renewal.
- **Continuing commission:** on contracts made during the term, and their renewals, whoever represents the player when
  they're paid (Equity's rule); an offer declined and accepted within 60 days.
Accepting sets the representation, changes what's submitted and how pay flows; ending it changes them back, leaving what
the terms keep owed.

## The Work Loop

`systems/projobs.ts` (opportunities, submissions, auditions, casting, offers) and `systems/propay.ts` (engagements' pay):
- **Projects are fictional** (`content/careerwork.ts`): an Off-Broadway play, a LORT regional season's play, a network
  drama's co-star role, a SAG-AFTRA Low Budget film, an Ultra Low Budget film, a student film, a non-union short. Each
  names its fictional company and casting office, and says it's fictional. None is a real production.
- **Each opportunity:** project, role (its size, its genre from the game's genres, its demands as a task profile and
  families), requirements (union status, age range, billing, skills), dates and place (New York, or the regional
  theatre's city), the submission and audition deadlines, the pay terms from the rates below, eligibility (work
  authorization, union, representation where the project casts through agents only), and how it ends.
- **Access:** agent-only projects come through his submissions when represented; open ones (student films, non-union
  shorts, Equity's open calls for members) the player can submit to directly. Unsigned play is real.
- **Stages:** submission (materials checked), audition (in person in New York or a self-tape judged like a brief's take),
  callback where the project has one, the casting decision, the offer (terms, a date it stands until), accept or
  decline, preparation (sides, then the part), the scheduled work on the calendar, the work judged, the payment, the
  commission, the credit.
- **Casting is competitive and explained:** the audition's band (quality), the role's fit (genre familiarity and the
  role's demands against the actor's strengths), availability and eligibility (checked, not drawn), then the field of
  other actors (decider `pro.casting`). A developing actor can book a role that suits them; a skilled one can lose one.
- **Rates (verified, `../../research/career-2026-10-20/work.md`):** SAG-AFTRA TV/Theatrical day performer $1,283, weekly $4,456 (from
  2026-07-01); Low Budget $834 a day; Ultra Low Budget $257 a day; student films deferred; LORT minimums $889 to $1,453
  a week (from 2026-06-29). Off-Broadway's minimums aren't public: ASSUMPTION, between LORT D and LORT B.
- **Pay:** union work is W-2 wages through the production's payroll (ASSUMPTION: paid the Thursday after each week's
  work); represented, it goes to the agency's trust and on to the player within 3 business days less commission
  (SAG-AFTRA's rule from its snippet, applied to all covered work as an ASSUMPTION); unrepresented, straight to the
  player. Each payment is promised when the contract is accepted and received only when posted; keyed by engagement and
  week, so no reload or jump pays it twice. Wages go through `recordWages` with the employer, commission, dues, the
  withholding and where the work was done (New York State's nonresident tax; Connecticut's credit; New York City's only
  for its residents). Deferred pay is shown as deferred and never posted.
- **Unions:** Equity membership at graduation (Bulletin), $600 down of $1,800 (Equity's page); a first SAG-AFTRA principal
  job makes the actor eligible, membership required for work 30 days on (29 U.S.C. 158(a)(3); fees from SAG-AFTRA's
  pages as indexed, labeled so).

## Work Eligibility

`usWorkAuthorized(person, at)` decides every paid or unpaid engagement's acceptance, for each of its dates:
- a US citizen or permanent resident: authorized;
- F-1 in the program: not authorized for outside acting (CPT isn't offered for Acting: `../../research/career-2026-10-20/yale.md` §6), so an
  offer can't be accepted in session or out; on-campus work stays as it is;
- F-1 after the degree on OPT: authorized from the EAD's start for 12 months, each engagement's days counted as days
  worked, at most 90 unemployed days (8 CFR 214.2, SEVP guidance: gigs and 1099 work allowed);
- signing with an agent changes none of it.
The OPT approval notice's "The game has no work after the degree" and the three tests that pin it are rewritten to say
what's now true.

## Brief 18's Items Needed (D1 To D6)

As `criteria.md` lists: the stop's actions for career appointments (Go, Stand Here, and Ask To Move for a meeting,
defined and tested), Tomorrow Morning, the Sleep dialog's suggestion and its clock, One Week's On The Way, and the
understudy's part. Each is brief 18's item, done here for the career's sake, and marked so in brief 18's criteria.

## The Screens

- **Career** returns to the rail, under Your Work: Overview (where you stand, what's missing, what's next), Portfolio
  (profile, headshots, résumé, reel), Representation (the agent's panel, the history, the agreement), Opportunities
  (open, submitted, auditions, offers) and Work (engagements, the calendar's calls, pay promised and received, commission).
- **The School** shows the showcase in the final term on Coursework, with a way to the Career.
- **Papers** shows the work eligibility each engagement read; **Money** the pay received and the commission.
- **Help:** a guide chapter, Your Career, and a How This Works entry for each feature, each command opened by a chapter
  and behind a Gated control, as the tutorial's tests require.

## Who Builds What

1. **Dependencies (D1 to D6):** time and sleep (brief 18's time area), the understudy's part (brief 18's understudy
   area), work eligibility and OPT (D8), the tutorial's job guard (D9).
2. **The core:** `content/agents.ts`, `content/careerwork.ts`, `systems/pro.ts` (the record, its building and migration,
   the profile, credits, materials and their commands), the `pro` id namespace, registration.
3. **On the core, in parallel:** the showcase; the agent and the agreement; the work loop and pay (D7); the screens and
   help.
4. **Then:** integration, the playthroughs (V1 to V18, as journeys and scenario saves), the built app at 1440 and 390,
   the gate.
