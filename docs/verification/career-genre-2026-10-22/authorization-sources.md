# Permission To Work On OPT: The Sources, Dated (Brief 22, A3)

Every source read on 2026-10-22. What each says is quoted where the rule rests on its words. What SLATE takes from each,
and what's left uncertain, follows it. These are the rules a game reads, not legal advice, and the game models one
person's career, not every case they cover.

## The Sources

| | Source | Date of the text | Where |
|---|---|---|---|
| S1 | 8 CFR 214.2(f)(10)(ii)(E), (f)(11)(i)(D), (f)(11)(iii)(A), (f)(12)(i) | eCFR, current to 2026-10-20 | `https://www.ecfr.gov/api/versioner/v1/full/2026-10-20/title-8.xml?part=214&section=214.2` |
| S2 | SEVP Policy Guidance 1004-03, "Update to Optional Practical Training" | 2010-04-23 | `https://www.ice.gov/doclib/sevis/pdf/opt_policy_guidance_042010.pdf` |
| S3 | DHS Study in the States, "F-1 Optional Practical Training (OPT)" (SEVIS Help Hub) | last updated 2025-05-19 | `https://studyinthestates.dhs.gov/sevis-help-hub/student-records/fm-student-employment/f-1-optional-practical-training-opt` |
| S4 | 8 U.S.C. 1324a(a)(1)(A), (a)(2), (h)(3) | current text (Cornell LII) | `https://www.law.cornell.edu/uscode/text/8/1324a` |
| S5 | US Department of Labor, Wage and Hour Division, Fact Sheet #48, on Hoffman Plastic Compounds v. NLRB, 535 U.S. 137 (2002) | revised July 2008; the decision 2002-03-27 | `https://www.dol.gov/agencies/whd/fact-sheets/48-hoffman-plastics` |

Already in the repository and still read: `docs/research/world/research-workpermission.json` (OPT's 90 days, its fees and
windows) and `docs/research/career-2026-10-20/work.md` S1, S3, S5, S6 (brief 19's reading of the same guidance).

## What They Say

**S1, the regulation.**
- (f)(10)(ii)(E): "During post-completion OPT, F-1 status is dependent upon employment. Students may not accrue an
  aggregate of more than 90 days of unemployment during any post-completion OPT period".
- (f)(11)(i)(D): "A student may not begin OPT employment prior to the approved start date on his or her Employment
  Authorization Document".
- (f)(11)(iii)(A): the authorization "begins on the requested date of commencement or the date the Form I-765 ... is
  approved, whichever is later, and ends at the conclusion of the remaining time period of post-completion OPT
  eligibility".
- (f)(12)(i): a student on OPT "is required to report any change of name or address, or interruption of such
  employment to the DSO".

**S2, SEVP's guidance** (sections as numbered there):
- 4.9: unemployment time is "the total time spent without a qualifying job during post-completion OPT. ... each day that
  the student is not employed in a qualifying job is counted toward the limit".
- 7.1.5: "A student must work at least 20 hours per week in a qualifying position to be considered employed. If a
  student has a variable schedule, within a month, it should average out to at least 20 hours per week."
- 7.1.6: "Each day (including weekends) during the period when OPT authorization begins and ends that the student does
  not have qualifying employment counts as a day of unemployment."
- The update's own list of changes: it "deletes 10 day exceptions to the time that counts for unemployment during OPT at
  the EAD start date and between jobs".
- 7.1.8: time outside the United States counts as unemployment unless the student is "employed during a period of leave
  authorized by an employer" or "traveling as part of his or her employment".
- 7.2.1: allowed employment includes "short-term multiple employers (performing artists). A student, such as a musician
  or other type of performing artist, may work for multiple short term employers (gigs). The student should maintain a
  list of all gigs, the dates and duration."
- 7.3.1: the reporting table's "Multiple short-term gigs in one period with less than 10 days between gigs: report at
  the beginning of the first gig".
- 7.4.2: "A student who has exceeded the period of unemployment while on post-completion OPT has violated his or her
  status" unless they've applied to change level or transfer, departed, or otherwise maintained status.
- 7.4.3 and 7.4.4: DHS, not the school, determines whether the limit was exceeded, and ICE/SEVP "may ... terminate a
  student's record if it fails to show that the student maintained the proper period of employment", the student
  "given an opportunity to show that he or she complied".

**S3, DHS's current page:** post-completion OPT "must be at least 20 hours per week or full-time"; "A student on
post-completion OPT can be unemployed for a total of 90 days"; "A student whose record lacks employer information is
considered unemployed"; "SEVP officials can manually terminate a student who accrues 90 total days of unemployment".

**S4, the statute on employers:** it is unlawful "to continue to employ the alien in the United States knowing the
alien is (or has become) an unauthorized alien with respect to such employment" ((a)(2)); "unauthorized alien" is
judged "with respect to the employment of an alien at a particular time" ((h)(3)).

**S5, pay for work done:** the Wage and Hour Division "will continue to enforce the FLSA and MSPA without regard to
whether an employee is documented or undocumented"; Hoffman Plastic refused back pay "for years of work not performed,
for wages that could not lawfully have been earned".

## What SLATE Takes From Them

- **A day, not a week** (S1 (E), S2 4.9 and 7.1.6): each calendar day of OPT from its start is employed or not,
  weekends included. The game counts each New York day once it's over.
- **A booking isn't employment** (S2 4.9: "without a qualifying job"; S3: a record "lacks employer information"): a
  contract signed for work that hasn't begun gives no employment on the days before it.
- **Employment is the engagement's span, if its hours qualify** (S2 7.1.5, 7.2.1): a performing artist's gigs are
  employment for their dates and duration. An engagement employs the actor from its first day worked to its last day,
  or the day it's called off, if its scheduled hours average at least 20 a week over that span (a span under a week
  counts as a week). Every engagement the game has does: a run's 4 weeks of 40 hours and 5 or 6 of 15 (six
  two-and-a-half-hour performances) average 25 to 27 a week; a shoot day is eleven hours, so two days make 22.
- **Between gigs is unemployment** (the update's deletion of the ten-day exceptions): no gap is excused, however short.
  7.3.1's ten days are how to report gigs, not a rule about counting them.
- **The breach ends permission at once, without grace** (S1 (E), S2 7.4.2): the 91st day without employment, at its
  end. The game's status follows (no grace period, as `systems/permission.ts` already had it).
- **Expiry is a different end** (S1 (f)(11)(iii)(A)): the authorization's last date; the status keeps its 60 days of
  grace (`STATUS_GRACE_DAYS`), and no work.
- **The employer can't go on employing** (S4 (a)(2)): booked work after the end doesn't happen; the company releases
  the actor from the part.
- **Pay for days worked stays owed** (S5): the days worked before the end are paid on their payday; what wasn't worked
  isn't owed (Hoffman's "work not performed").

## What's Uncertain, Said Rather Than Invented

1. **The averaging window.** S2 7.1.5 averages a variable schedule "within a month". SLATE averages over the
   engagement. A performance day's record is the two and a half hours on stage, not the calls around it, so a run's
   performance weeks read 15 hours a week, and a monthly window would read a run's last month as unemployment. SLATE
   takes that as what the record leaves out, not the actor's hours. With every engagement in the game qualifying either
   way over its span, the choice decides nothing in play today; a test pins it for an engagement that wouldn't.
2. **A missed day inside an engagement.** SLATE counts it employed while the engagement goes on (S2 7.1.8's "leave
   authorized by an employer"); an engagement called off ends employment that day.
3. **Who decides, and when.** DHS determines a breach and may act long after (S2 7.4.3, 7.4.4), and a student is given
   the chance to show compliance. SLATE ends permission at the breach, with no hearing, because the game keeps one
   record and reads it.
4. **Work that isn't acting.** Only professional engagements are counted (OPT must relate to the degree, S2 7.2.1); the
   game has no other work after the degree.
5. **Days abroad** (S2 7.1.8): counted by the same rule, since every engagement is in the United States.
6. **Older saves.** A save made before brief 22 counted by weeks, a booked day as worked. Its count is kept as it was;
   the daily count goes on from the day its weeks reached. Nothing is counted again.
7. **Recovery.** After a breach the game has no route back to US permission: OPT isn't granted twice (`optRefusal`), and
   a green card is refused (`routeRefusal`, `systems/residence.ts`). A change of education level or a transfer (S2
   7.4.2) isn't in the game, and the brief adds no new immigration category.
