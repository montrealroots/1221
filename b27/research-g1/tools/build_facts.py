#!/usr/bin/env python3
"""Build OUT/facts.json from the hand-written fact list below and each download's fetch.json.
Every quote is copied from the downloaded file named by `dl`; tools/verify_quotes.py checks each one."""
import json, os

OUT = '/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/b27/research-g1'


def F(field, value, quote, where):
    return {'field': field, 'value': value, 'quote': quote, 'where': where}


S = []  # each: id, title, dl (folder under OUT/dl), facts, notes, [attempts], [file]

# ---------------------------------------------------------------- 1. Golden Globes
S.append(dict(id='b25-S49', title='Golden Globes, LLC: 84th Annual Golden Globes Eligibility and Consideration Rules (last updated July 30, 2026)',
  dl='gg84-rules-pdf', facts=[
  F('updated', 'The rules were last updated July 30, 2026.', 'Last Updated: July 30, 2026', 'p.1'),
  F('film-qualifying-year', 'Film qualifying year for the 84th: January 1 to December 31, 2026.', 'For the 84th Annual Golden Globes, the qualifying year shall be January 1 through December 31, 2026.', 'A.1.a'),
  F('film-eligible', 'Eligible films: scripted features of 70 minutes or longer, released and made available to all voters in the qualifying year.', 'Feature-length, scripted motion pictures (70 minutes or longer) that have been both released and made available for viewing to all Golden Globes voters pursuant to these rules during the qualifying year (January 1 through December 31).', 'A.1.a'),
  F('film-released', 'Released means a seven-day consecutive commercial run (theatrical or pay-per-view, not subscription) in one of seven US metro areas, starting before 11:59 p.m. on December 31.', 'made available for public exhibition in commercial motion picture theaters or on a recognized platform pay-per-view cable channel or pay-per-view digital delivery service (not subscription cable or digital delivery) in any of the greater Atlanta, Chicago, Dallas, Los Angeles, Miami, New York City or San Francisco metropolitan areas for a minimum seven-day consecutive period beginning prior to 11:59 p.m. local time on December 31 of the qualifying year.', 'A.1.b'),
  F('film-festival-not-release', 'A festival screening is not a release unless it meets the run criteria.', 'A motion picture exhibited at a film festival would not qualify as “released” unless it meets the criteria set forth above.', 'A.1.b'),
  F('film-best-picture-prerequisite', 'A film must be entered for Best Motion Picture for its individuals (including performers) to be eligible.', 'A motion picture must be eligible and submitted for consideration in the Best Motion Picture category in order to be eligible for consideration in any of the individual award categories set forth below', 'A.1.c'),
  F('film-performance-exception', 'Non-English-language and low-budget independent films may enter performers without entering Best Motion Picture.', 'However, Non-English Language and low-budget independent motion pictures may be submitted for individual Best Performance categories without being submitted in the Best Motion Picture category, provided they meet all other eligibility requirements.', 'A.1.c'),
  F('low-budget-definition', 'Low-budget independent means fully independently financed and a gross production budget under $10 million USD.', '(a) is fully financed by independent producers, private investors, or small production companies, and (b) has a gross production budget of less than $10 million USD.', 'A.1.c'),
  F('film-category-1', 'Film performer category.', 'Best Performance by a Female Actor in a Motion Picture – Drama', 'A.2'),
  F('film-category-2', 'Film performer category.', 'Best Performance by a Male Actor in a Motion Picture – Drama', 'A.2'),
  F('film-category-3', 'Film performer category.', 'Best Performance by a Female Actor in a Motion Picture – Musical or Comedy', 'A.2'),
  F('film-category-4', 'Film performer category.', 'Best Performance by a Male Actor in a Motion Picture – Musical or Comedy', 'A.2'),
  F('film-category-5', 'Film performer category.', 'Best Performance by a Female Actor in a Supporting Role in any Motion Picture', 'A.2'),
  F('film-category-6', 'Film performer category.', 'Best Performance by a Male Actor in a Supporting Role in any Motion Picture', 'A.2'),
  F('film-voice-only', 'Voice-only performances are not eligible in any film performance category.', 'Voice-only performances and other roles in which the actor’s face is not visible are not eligible in any performance category.', 'A.3.d.i'),
  F('film-lead-definition', 'Lead: central characters in a substantial portion who drive the narrative.', 'Lead cast members in a motion picture must be the central characters who appear in a substantial portion of the motion picture and who drive the narrative of the motion picture.', 'A.3.d.iii'),
  F('film-supporting-definition', 'Supporting: non-central characters who support the leads or narrative.', 'Supporting cast members in a motion picture are the non-central characters who support the lead characters and/or the narrative of the motion picture.', 'A.3.d.iv'),
  F('film-any-language', 'Performers in English or non-English films may qualify.', 'Performers appearing in either English language or non-English language motion pictures may qualify for performance awards.', 'A.3.d.v'),
  F('non-english-performer-classification', 'A non-English film must be classified Drama or Musical/Comedy for its performers to be eligible.', 'In order for individual performers from a non-English language motion picture to be eligible for Best Performance categories, the applicable non-English language motion picture must be classified as either a Drama or Musical/Comedy.', 'A.3.c.v'),
  F('non-english-no-us-release', 'Non-English films from outside the US need no US release for the Non-English Language award.', 'Non-English-language motion pictures that originate outside the United States do not need to be released in the United States to qualify for the Best Motion Picture – Non-English Language award.', 'A.3.c.viii'),
  F('non-english-country-release', 'For the Non-English Language award, a first release in the country of origin for at least seven consecutive days in the qualifying year.', 'a motion picture must be first released in its country of origin during the qualifying calendar year for a minimum seven-day consecutive period.', 'A.3.c.vi'),
  F('tv-eligible-us-prime-time', 'TV: first aired or made available in the US in the qualifying year in prime time.', 'Only programs first aired (or made available for viewing on demand) in the United States during the qualifying year (January 1 through December 31) in prime time (8:00 p.m. – 11:00 p.m. Monday through Saturday; 7:00 p.m. – 11:00 p.m. Sunday) are eligible for television awards.', 'C.1.b'),
  F('tv-cable-streaming-exempt', 'Cable and subscription platforms are exempt from the prime-time rule.', 'Programs released on cable or subscription-based platforms are exempt from the prime time requirement, provided they are first made available in the United States during the qualifying year.', 'C.1.b'),
  F('tv-foreign', 'Foreign TV programs are ineligible unless a US-foreign co-production (financial and creative) that precedes completion.', 'Foreign programs (programs produced principally outside the United States) are not eligible for television awards unless they are the result of a co-production (both financially and creatively) between a United States partner and a foreign partner, which precedes the completion of production of the program.', 'C.1.d'),
  F('tv-language', 'TV eligibility does not depend on language.', 'The eligibility of television programs does not depend on the language(s) used in the program.', 'C.1.e'),
  F('tv-animated', 'Animated TV programs may enter the series categories.', 'Animated television programs may be entered in the appropriate category (Best Series – Drama, Best Series – Musical or Comedy, etc.) if they meet the other qualifying criteria for that category.', 'C.1.f'),
  F('tv-festival', 'A TV program first shown at a festival is not disqualified.', 'A television program first exhibited at a festival would not be disqualified for television awards if it otherwise meets the television eligibility criteria set forth herein.', 'C.1.c'),
  F('film-or-tv-not-both', 'A motion picture enters film or TV categories, not both, by original release format.', 'Motion pictures should be entered in either the motion picture or the television award categories (but not both) based on their original release format.', 'C.1.c'),
  F('tv-best-program-prerequisite', 'A TV program must be entered in a Best Television category for its performers to be eligible (except stand-up).', 'a television program must be eligible and submitted for consideration in one of the Best Television award categories to be eligible for consideration in any of the individual Best Performance categories set forth below.', 'C.1.j'),
  F('tv-category-1', 'TV performer category.', 'Best Performance by a Female Actor in a Television Series – Drama', 'C.2'),
  F('tv-category-2', 'TV performer category.', 'Best Performance by a Male Actor in a Television Series – Drama', 'C.2'),
  F('tv-category-3', 'TV performer category (name breaks across a line in the PDF).', 'Best Performance by a Female Actor in a Television Series – Musical or Comedy', 'C.2'),
  F('tv-category-4', 'TV performer category.', 'Best Performance by a Male Actor in a Television Series – Musical or Comedy', 'C.2'),
  F('tv-category-5', 'TV performer category.', 'Best Performance by a Female Actor in a Limited Series, Anthology Series, or a Motion Picture Made for Television', 'C.2'),
  F('tv-category-6', 'TV performer category.', 'Best Performance by a Male Actor in a Limited Series, Anthology Series, or a Motion Picture Made for Television', 'C.2'),
  F('tv-category-7', 'TV performer category.', 'Best Performance by a Female Actor in a Supporting Role on Television', 'C.2'),
  F('tv-category-8', 'TV performer category.', 'Best Performance by a Male Actor in a Supporting Role on Television', 'C.2'),
  F('tv-category-9', 'TV performer category.', 'Best Performance in Stand-Up Comedy on Television', 'C.2'),
  F('tv-voice-only', 'Voice-only TV performances are not eligible.', 'Voice only performances and other roles in which the actor’s face is not visible are not eligible in any acting category.', 'C.3.e.iii'),
  F('tv-ensemble', 'Comparable ensemble roles in a series should be all lead or all supporting.', 'Actors in ensemble casts with comparable roles in a television series should be classified as either all lead or all supporting actors.', 'C.3.e.v'),
  F('tv-anthology-lead', 'Anthology leads must be in segments of at least 50% of running time; others may go supporting.', 'contributed to segments that comprise at least 50% of the running time in the anthology series. All other actors are eligible for the Best Performance in a Supporting Role awards if they meet the other requirements of these rules.', 'C.3.c.iv'),
  F('who-chooses-category', 'The submitting studio or publicist initially selects the categories, including lead vs supporting.', 'The studio or publicist submitting a motion picture or television program initially selects the award categories for which it is entered (e.g., male actor vs. female actor, drama vs. musical/comedy or lead vs. supporting).', 'F.1.k'),
  F('committee-may-change', 'The Eligibility and review committees may change an entry by a two-thirds vote.', 'These committees, voting by written ballot, may change any award entry by a vote of two-thirds or more of the committees’ members voting.', 'F.1.l'),
  F('misclassification-letter', 'Suspected misclassification: director/showrunner asked for a justification letter.', 'the Eligibility Committee will ask the director(s)/showrunner(s) of the motion picture or television program to submit a letter justifying the initial classification for review.', 'F.1.l'),
  F('submission-portal', 'All programming is submitted through Yangaroo and uploaded to the Indee platform.', 'all programming must be submitted through the Yangaroo submissions portal and uploaded to the Golden Globes Indee Viewing Platform.', 'F.1.a'),
  F('individual-entry-photo', 'Individual performance entries need high-resolution photographs owned or controlled by the submitting party.', 'Entries for individual performance awards must be accompanied by submission of high-resolution photographs (e.g., head shot or key artwork) owned and/or controlled by the party submitting such individual.', 'F.1.c'),
  F('fees', '$250 per individual entry; $500 per film, TV program and other title entries.', 'Yangaroo submission fees for Golden Globes consideration are $250 for each individual entry submitted and $500 for each motion picture, television program, Stand-Up Comedy on Television, Cinematic and Box Office Achievement production, and Best Podcast submitted.', 'F.1.f'),
  F('fee-per-production', 'An individual entered for several productions pays a fee for each entry.', 'Entries for individuals submitted for consideration for their work on multiple productions will be charged a fee for each entry.', 'F.1.f'),
  F('indee-fee', 'Indee upload administration fee: $5,000 per title.', 'Uploads to the Golden Globes Indee Viewing Platform are subject to an administration fee of $5,000 per title.', 'F.1.g'),
  F('fee-alternatives', 'Productions under $2 million may ask about fee alternatives.', 'Motion pictures, television programs, and Cinematic and Box Office Achievement films with production budgets of less than $2 million USD may contact AwardsOffice@GoldenGlobes.com to inquire about fee alternatives.', 'F.1.i'),
  F('voters', 'Only individuals designated by Golden Globes, LLC vote.', 'Only individuals officially designated by the Company as Golden Globes voters (“Golden Globes voters”) vote for the Golden Globes.', 'G.1.a'),
  F('two-phases', 'Voting in two phases, monitored by an accounting firm: nominations and final vote.', 'The voting is monitored by an accounting firm and is conducted in two phases – Nominations and Final Vote.', 'G.1.a'),
  F('nomination-ballot', 'Each voter votes for up to six nominees per film/TV category, in order of preference.', 'requesting that each of them vote for up to (i) six nominees for motion picture and television programs and Best Podcast entries and (ii) eight nominees for Best Cinematic and Box Office Achievement productions, in order of preference in each award category', 'G.2.a'),
  F('nominees-count', 'Nominees are the six selections with most votes.', 'The nominees in each category will be the six (or eight) selections in each category that receive the greatest number of votes on the nomination ballots.', 'G.2.c'),
  F('rank-points-ties-only', 'Rank points are used only to break ties.', 'The accounting firm will use the points assigned in the nomination rankings only in the event of ties.', 'G.2.c'),
  F('final-ballot', 'Final ballot: one vote per category.', 'requesting that each of them votes for one nominee in each category and return the completed ballot directly to the accounting firm.', 'G.3.a'),
  F('final-tie', 'A final tie goes to the tied nominee with more nomination-ballot votes.', 'In the case of a tie in any category, the winner will be the one of the tied nominees on the final ballot that had the most votes on the', 'G.3.a (sentence continues on p.28: "nomination ballot.")'),
  F('final-tie-two-winners', 'If still tied, two winners.', 'there is still a tie in any category, two winners will be announced for that category.', 'G.3.a'),
  F('ai-performance', 'Performances substantially generated by AI are not eligible.', 'Submissions in which a performance is substantially generated or created by artificial intelligence are not eligible.', 'E, Performance (Acting) Awards'),
  F('nomination-certificate', 'Each individual nominee may buy one nomination certificate for $1,500.', 'Every individual nominee and co-nominee named for an award is eligible to purchase one nomination certificate for a fee of $1,500.', 'I.1.a'),
  ], notes='Not stated anywhere in the rules: any rule on one performer holding several nominations in the same category (searched for "multiple", "more than one", "same category"); no country rule for performers beyond the TV foreign-program co-production rule and the non-English film rules quoted. The rules refer to "Golden Globes Campaign Guidelines below" (F.1.c) but the PDF contains no campaign guidelines section. Who submits: "The studio or publicist" (F.1.k); a performer submitting themselves is not stated.'))

S.append(dict(id='b25-S50', title='Golden Globes: The 84th Annual Golden Globes Timetable, Eligibility Rules and Campaign Guidelines Announced (May 7, 2026)',
  dl='gg84-calendar-page', facts=[
  F('announced', 'Published May 7, 2026.', 'LOS ANGELES, CA – May 7, 2026 – Today, the Golden Globes® released its awards timetable, eligibility rules and campaign guidelines for the 84th Annual Golden Globes®', 'opening paragraph'),
  F('ceremony', 'Ceremony Sunday January 10, 2027, Beverly Hilton, CBS and Paramount+.', 'the ceremony will broadcast live from the Beverly Hilton on Sunday, January 10, 2027 on the CBS Television Network, and streaming on Paramount+ in the U.S.', 'opening paragraph'),
  F('submissions-open', 'Submission website opens June 1, 2026.', 'Monday, June 1, 2026 Submission website opens for 84th Annual Golden Globes Motion Picture, Television and Podcast', 'timetable'),
  F('submission-deadline', 'Deadline for all submissions October 30, 2026.', 'Friday, October 30, 2026 Deadline for Motion Picture, Television, and Podcast submissions', 'timetable'),
  F('tv-nomination-ballots-out', 'TV nomination ballots sent November 16, 2026.', 'Monday, November 16, 2026 Television and Podcast nomination ballots to be sent to all voters', 'timetable'),
  F('tv-uploads-last', 'Last day for TV press conferences, November 22, 2026 (the next line on the page gives the same date as the last day for TV uploads to the Indee platform).', 'Sunday, November 22, 2026 Final date for Television and Podcast press conferences', 'timetable'),
  F('tv-nomination-ballots-due', 'TV nomination ballots due November 23, 2026, 5 p.m. PST (the page spells the firm "KMPG" here).', 'Monday, November 23, 2026 by 5:00 p.m. PST Deadline for receipt of Television and Podcast nomination ballots to KMPG', 'timetable'),
  F('film-nomination-ballots-out', 'Film nomination ballots sent November 24, 2026.', 'Tuesday, November 24, 2026 Motion Picture and Cinematic and Box Office Achievement nomination ballots to be sent to all voters', 'timetable'),
  F('film-uploads-last', 'Last day for film press conferences, December 2, 2026 (the next line gives the same date for film uploads).', 'Wednesday, December 2, 2026 Final date for Motion Picture and Cinematic and Box Office Achievement press conferences', 'timetable'),
  F('film-nomination-ballots-due', 'Film nomination ballots due December 4, 2026, 5 p.m. PST.', 'Friday, December 4, 2026 by 5:00 p.m. PST Deadline for receipt of Motion Picture and Cinematic and Box Office Achievement nomination ballots to KPMG', 'timetable'),
  F('nominations', 'Nominations announced December 7, 2026, 5 a.m. PST.', 'Monday, December 7, 2026 at 5:00 a.m. PST Announcement of nominations for the 84th Annual Golden Globes', 'timetable'),
  F('final-ballots-out', 'Final ballots sent December 18, 2026.', 'Friday, December 18, 2026 Final ballots sent to all voters by KPMG', 'timetable'),
  F('final-ballots-due', 'Final ballots due January 2, 2027, 5 p.m. PST.', 'Saturday, January 2, 2027 by 5:00 p.m. PST Deadline for receipt of final ballots to KPMG', 'timetable'),
  F('presentation', 'Presentation January 10, 2027, 5 p.m. PST.', 'Sunday, January 10, 2027 at 5:00 p.m. PST Presentation of the 84th Annual Golden Globes', 'timetable'),
  ], notes='The page links the rules ("HERE"); the campaign guidelines named in its title are not in the page text. No fee or eligibility figures on this page.'))

# ---------------------------------------------------------------- 2. AACTA
S.append(dict(id='b25-S56', title='AACTA: 2027 AACTA Awards Rule Book', dl='aacta-2027-rulebook-pdf', facts=[
  F('australian-person', 'An Australian individual: born in Australia, a passport holder/citizen, or a permanent resident of 5+ years.', 'Australian – when used to describe an individual, an individual who was born in Australia, or is a current passport holder/citizen, or has been a permanent resident for at least 5 years.', '2(f) Glossary'),
  F('eligibility-sac', 'Eligibility route (i): significant Australian content under the Income Tax Assessment Act 1997.', 'contain “significant Australian content” for the purposes of section 376-65(2)(a)(i) of the Income Tax Assessment Act 1997', '3.2(a)(i)'),
  F('eligibility-finance', 'Route (ii): at least 51% Australian financing.', 'have at least 51% financing from Australian investors', '3.2(a)(ii)'),
  F('eligibility-coproduction', 'Route (iii): official co-production or Australian creative control.', 'be an official co-production (as per a formal agreement with Australia and an international territory) or produced under the creative control of Australians if an international collaboration has occurred outside of a formal treaty', '3.2(a)(iii)'),
  F('eligibility-discretion', 'Route (iv): otherwise satisfy AFI/AACTA at their discretion (the rule goes on to list factors such as setting, story, key creatives, shooting and financing).', 'otherwise satisfy the AFI and AACTA, in their sole and absolute discretion, that the Production is an eligible Production', '3.2(a)(iv)'),
  F('previously-entered', 'A production entered before is ineligible again.', 'A Television Program or Film, (or an episode or season of a Television Program) which has been previously entered into the Awards is ineligible for entry into the current or any future Awards.', '3.2(b)'),
  F('who-enters', 'Entry by the Producer or a representative of the production company or distributor/broadcaster.', 'Your entry should be completed by the Producer or a representative of the Production Company or Distributor/Broadcaster.', '3.1(b)'),
  F('all-producers-agree', 'Every producer must agree to the entry.', 'AACTA will only consider an Entry Form as valid if the submission of it has been agreed to by all of the Producers of a Production.', '3.7(d)'),
  F('dates-on-website', 'Dates are on the AACTA website, not in the rule book.', 'Please refer to the AACTA website for current dates as they relate to eligibility periods and voting periods.', '3.1(c)'),
  F('fees-on-website', 'Fees are on the website and entry form.', 'The fees payable in relation to each Award Category will be stated on the AACTA Website and the Entry Form relevant to the Award Category and may change from year to year.', '2(o)'),
  F('one-category', 'A production may enter one award category.', 'Productions may only be entered into one Award Category', '3.3(a)(iv)'),
  F('tv-categorisation', 'TV entries need both the broadcaster executive and the senior production executive to confirm the category.', 'All TV category entrants will require confirmation of their entered categorisation from both; a senior executive at their associated broadcaster; and the most senior production executive listed on the entry.', '3.3(a)(v)'),
  F('afi-may-override', 'AFI may override the entrant\'s category.', 'to determine the appropriate Award Category for any Production and override the selection of the Award Category made by the Entrant;', '3.7(a)(vi)'),
  F('minimum-entries', 'At least 8 entries for a full field of nominations.', 'In order for a production category to proceed with the standard number of nominations, at least 8 entries must be received.', '3.7(a)(i)'),
  F('minimum-entries-under-8', 'Fewer than 8 entries: nominations may be cut to 4.', 'If less than 8 entries are received, the final number of nominated productions may be reduced to 4.', '3.7(a)(i)'),
  F('minimum-entries-4', '4 or fewer entries: no award.', 'If 4 or less entries are received, the category will not be undertaken.', '3.7(a)(i)'),
  F('television-program', 'Television Program: broadcast in Australia on FTA, subscription, VOD or SVOD, not community TV.', 'a Production broadcast in Australia produced specifically for television broadcast on free to air or subscription television, or available on VOD or SVOD platforms, but excluding broadcasts made on community television networks.', '2(y)'),
  F('tv-eligibility', 'TV: first episode broadcast in Australia for the first time within the TV eligibility period.', 'All television programs submitted to the AACTA Awards must have had their first episode broadcast in Australia for the first time within the Television eligibility period specified on the AACTA website.', '6.3(b)'),
  F('tv-category-lead-actor', 'TV performer award.', 'AACTA Award for Best Lead Actor in a Drama', '6.1(j)'),
  F('tv-category-lead-actress', 'TV performer award.', 'AACTA Award for Best Lead Actress in a Drama', '6.1(k)'),
  F('tv-category-comedy-lead', 'TV performer award.', 'AACTA Award for Best Acting in Comedy in a Lead Role', '6.1(l)'),
  F('tv-category-comedy-supporting', 'TV performer award.', 'AACTA Award for Best Acting in Comedy in a Supporting Role', '6.1(m)'),
  F('tv-category-supporting-actor', 'TV performer award.', 'AACTA Award for Best Supporting Actor in a Drama', '6.1(n)'),
  F('tv-category-supporting-actress', 'TV performer award.', 'AACTA Award for Best Supporting Actress in a Drama', '6.1(o)'),
  F('tv-acting-names-in-6.3', 'Rule 6.3(c) names the drama awards differently, as Guest or Supporting, and limits them to a drama series, miniseries or children\'s series.', 'Best Guest or Supporting Actor in a Television Drama; and', '6.3(c)'),
  F('tv-acting-entrant-chooses', 'The entrant selects lead or supporting for a candidate.', 'The Entrant must select the most appropriate Award Category for a particular Candidate (e.g. Lead or Supporting Actor).', '6.3(c)(i) and 7.3(d)(i)'),
  F('tv-lead-not-supporting', 'A TV drama candidate cannot be lead and supporting in the same year for the same production.', 'Candidates for the Lead Actor and Lead Actress in a Drama Awards cannot simultaneously be Candidates for the Supporting Actor or Supporting Actress in a Drama Awards in the same year for the same Production.', '6.3(c)(ii)'),
  F('tv-voice-over', 'Voice-over actors in animated programs are not eligible for the TV acting awards.', 'Voice-over actors in animated programs are not eligible for these awards.', '6.3(c)(vii)'),
  F('childrens-program', 'Children\'s Program: made predominantly for children, animated or live action.', 'A television program that is made predominantly for viewing by children, either created using animation or recorded in live action.', '6.2(a)(i)'),
  F('tv-voting', 'TV nominees and winners (excluding craft) decided by Professional members.', 'Nominees and winners in the Television Award categories, excluding technical craft, are decided upon by Professional AACTA members.', '6.8(s)'),
  F('film-voting', 'Film nominees and winners decided by Professional members (the same sentence also appears for documentaries at 5.8(b)).', 'Nominees and winners are decided by Professional AACTA Members.', '7.8(b)'),
  F('tv-membership', 'At least five TV candidates must be current Professional members.', 'A minimum of five Candidates on the Entry Form must be current AACTA Professional members.', '6.4(d)'),
  F('candidates-per-category', 'At most four people per category; each must have worked on a submitted episode.', 'You may submit a maximum of four people per category. Each candidate must have worked on one or both of the episodes submitted.', '6.5(g)'),
  F('feature-film', 'Feature Film: self-contained dramatized story of at least 60 minutes.', 'Feature Film – A dramatized story that is self-contained and of at least 60 minutes continuous duration.', '7.2(a)'),
  F('indie-film', 'Indie Film: budget below AUD 2 million.', 'Indie Film – A Feature Film with overall budget that is below 2 million AUD', '7.2(b)'),
  F('film-release-cinema', 'Film release route (i): commercial cinema in two capital cities including Sydney or Melbourne, 7+ consecutive days.', 'A commercial cinema, in a minimum of two Australian capital cities including Sydney or Melbourne, for a run of at least seven consecutive days; or', '7.3(a)(i)'),
  F('film-release-festival', 'Route (ii): a qualifying Australian festival plus 4 paid commercial screenings in two capitals.', 'An approved Qualifying Australian Film Festival along with a minimum of four separate screenings (paid admission) at a commercial cinema across a minimum of two Australian Capital cities with one city being Melbourne or Sydney; or', '7.3(a)(ii)'),
  F('film-release-svod', 'Route (iii): a qualifying VOD/SVOD platform or free-to-air broadcast.', 'An approved Qualifying VOD/SVOD platform or broadcast on Free to Air; or', '7.3(a)(iii)'),
  F('film-category-lead-actor', 'Film performer award.', 'AACTA Award for Best Lead Actor in Film', '7.1(d)'),
  F('film-category-lead-actress', 'Film performer award.', 'AACTA Award for Best Lead Actress in Film', '7.1(e)'),
  F('film-category-supporting-actor', 'Film performer award.', 'AACTA Award for Best Supporting Actor in Film', '7.1(f)'),
  F('film-category-supporting-actress', 'Film performer award.', 'AACTA Award for Best Supporting Actress in Film', '7.1(g)'),
  F('film-lead-not-supporting', 'A film candidate cannot be both lead and supporting for the same production.', 'Candidates for the Lead Actor and Lead Actress Awards cannot also be Candidates for the Supporting Actor or Supporting Actress Awards for the same Production.', '7.3(d)(ii)'),
  F('film-voice-over', 'Voice-over actors in animated films are not eligible.', 'Voice-over actors in animated films are not eligible for these awards.', '7.3(d)(vi)'),
  F('film-motion-capture', 'Motion-capture performances considered at AFI/AACTA discretion.', 'Performances utilising motion capture that render the human in another form can be considered at the discretion of AFI/AACTA.', '7.3(d)(vii)'),
  F('film-membership', 'At least five film candidates must be Professional members.', 'A minimum of five Candidates on the Entry Form must be AACTA Professional members.', '7.4(a)'),
  F('agent-email', 'An agent\'s email may be given for acting candidates.', 'You can provide an agent’s email address for acting candidates.', '13.f FAQ'),
  F('short-film', 'Short Film: under 40 minutes.', 'It must be less than 40 minutes in duration.', '4.2(a)'),
  F('short-film-students', 'Student work is eligible.', 'Student work is eligible for entry.', '4.3(b)'),
  F('short-film-nominations', 'Short film nominations by all voting members.', 'Nominations are decided by all AACTA voting members.', '4.8(c)'),
  F('short-film-voting', 'Short films: an independent pre-selection jury shortlists at most 30.', 'The number of shortlisted productions will be determined by the pre-selection panel, and not exceed 30.', '4.8(a)'),
  F('withdrawal-refund-late', 'Withdrawal between close and nominations: up to half refunded, at discretion.', 'at any time between the Closing Date for Entry and the Awards Nominations Announcement, AACTA may at its discretion refund up to one half of the Fee.', '3.5(b)(ii)'),
  F('withdrawal-refund', 'Withdrawal before entries close: full refund.', 'at any time prior to the Closing Date for Entry for the particular Award Category, AACTA will refund the full amount of the Fee; or', '3.5(b)(i)'),
  F('statuette', 'One statuette per award.', 'AACTA will present one statuette to the winner of each Award within each Award Category.', '3.9(a)'),
  ], notes='Not stated in the rule book: any dates (deferred to the website, see b27-G1-03 and b27-G1-04) and any fee amounts (deferred to the website). The FAQ section (13.d, 13.e) still refers to the "2026 AACTA Awards Rule Book". Rule 6.1 names the TV drama awards "Best Supporting Actor/Actress in a Drama" while 6.3(c) names "Best Guest or Supporting Actor/Actress in a Television Drama". No rule on one performer entering several productions in the same category is stated beyond the lead/supporting exclusivity for the same production.'))

S.append(dict(id='b25-S55', title='AACTA: 2027 AACTA Awards Voting', dl='aacta-2027-voting-page', facts=[
  F('reached', 'This build reached the page (the register recorded two connection resets on 2026-10-24).', 'Voting in the AACTA Awards determines which productions, performers and practitioners will be honoured with Australia\'s highest screen accolade - an AACTA Award.', 'body'),
  F('members-only', 'Voting is for AACTA members only.', 'Voting is exclusive to AACTA members, drawn from every sector of the screen industry: Free-to-Air Television, Streaming/SVOD/Subscription Television, Online, Film and Documentary.', 'body'),
  F('professional-only', 'Major categories now decided by accredited professional members only.', 'Our major award categories will now be determined by accredited professional members only, strengthening the experience, expertise and integrity behind every result.', 'body'),
  F('crafts', 'Craft awards decided by Chapters.', 'Craft Awards in Film, Television and Documentary will be determined by respective Chapters with accreditation aligning each member to the crafts they\'re qualified to judge.', 'body'),
  ], notes='Retried once as the brief asked: HTTP 200, 49,619 bytes. It links the "Voting Governance Summary", read as b27-G1-01.'))

S.append(dict(id='b27-G1-01', title='AACTA: 2027 AACTA Awards Voting and Assessment Governance Framework', dl='aacta-voting-governance-framework-pdf', facts=[
  F('professional-only', 'All categories except Short Film are decided by accredited Professional members.', 'All award categories, with the exception of Short Film, are determined by accredited Professional members only, strengthening the experience and expertise behind every result.', 'How each category is judged'),
  F('acting-two-rounds', 'Film and TV production and acting: all Professional members, two rounds.', 'Film and Television (Production and Acting) - nominees and winners determined by all Professional members across two rounds.', 'How each category is judged'),
  F('short-film-weighting', 'Short Film votes weighted: Professional 100%, General 50%, Youth 25%.', 'A Professional member\'s vote carries full weight (100%); a General member\'s vote is weighted at 50%; and a Youth member\'s vote at 25%.', 'How each category is judged'),
  F('secret-ballot', 'Secret ballot.', 'Voting is conducted by secret ballot, and panel and jury deliberations are confidential.', 'Independence, confidentiality and scrutiny'),
  F('invigilator', 'Results verified by PKF.', 'results are verified before release by AACTA’s independent invigilator, PKF.', 'Independence, confidentiality and scrutiny'),
  F('merit', 'Judged on merit without regard to budget, scale, platform or commercial performance.', 'Work is judged on merit alone, without regard to budget, production scale, distribution platform or commercial performance.', 'Assessment panels and juries'),
  ], notes='Linked from b25-S55 ("Voting Governance Summary"). Not stated: dates.'))

S.append(dict(id='b27-G1-02', title='AACTA: Entries 2027 (index page)', dl='aacta-2027-entries-page', facts=[
  F('open', 'The index page says entries are open (its Television sub-page says TV entries are closed).', 'Entries are now open for the 2027 AACTA Awards presented by BINGE.', 'body'),
  ], notes='An index of six sub-pages; dates and fees are on the sub-pages (b27-G1-03 film, b27-G1-04 television).'))

S.append(dict(id='b27-G1-03', title='AACTA: Entries 2027, Film', dl='aacta-2027-entries-film-page-retry', facts=[
  F('status', 'The page says film entries are open, though its close date has passed.', 'Film entries for the 2027 AACTA Awards are open.', 'body'),
  F('entries-open', 'Entries opened July 6, 2026.', 'Entries Open: Monday 6th July, 2026', 'body'),
  F('entries-close', 'Entries closed September 28, 2026.', 'Entries Close: Monday 28th September 2026, 11:59pm AEST', 'body'),
  F('round-1', 'Round 1 viewing and voting October 2 to November 9, 2026.', 'Round 1 Viewing and Voting Period: 2nd October 2026 - 9th November 2026', 'body'),
  F('nominations', 'Nominations date not yet set.', 'Nominations Announcement: TBC', 'body'),
  F('round-2', 'Round 2 not yet set.', 'Round 2 Viewing and Voting Period: TBC', 'body'),
  F('fee-under-500k', 'Fee $600 for budgets under $500k (currency not on the page; see notes).', 'Budget under $500k: $600', 'body'),
  F('fee-500k-2m', 'Fee 1,150.', 'Budget $500k to $2M: $1,150', 'body'),
  F('fee-2m-4m', 'Fee 1,980.', 'Budget $2M to $4M: $1,980', 'body'),
  F('fee-over-4m', 'Fee 2,200.', 'Budget over $4m: $2,200', 'body'),
  F('window', 'Released publicly January 1 to December 31, 2026.', 'released publicly between January 1st 2026 and December 31st 2026 to be eligible in this category.', 'body'),
  ], attempts=[{'at': '2026-10-25T16:51:52Z', 'http': '000', 'bytes': 0, 'error': 'curl: (35) Recv failure: Connection reset by peer', 'folder': 'dl/aacta-2027-entries-film-page'},
               {'at': '2026-10-25T16:52:12Z', 'http': '200', 'bytes': 49166, 'error': '', 'folder': 'dl/aacta-2027-entries-film-page-retry'}],
  notes='First attempt reset (000); one retry succeeded. The fee currency is not written on the page; the rule book says entry fees are "in Australian dollars inclusive of Goods and Services Tax" (b25-S56, 2(o)). No per-performer fee is listed.'))

S.append(dict(id='b27-G1-04', title='AACTA: Entries 2027, Television', dl='aacta-2027-entries-television-page', facts=[
  F('status', 'TV entries closed.', 'Television entries for the 2027 AACTA Awards are closed.', 'body'),
  F('entries-close', 'Closed September 28, 2026.', 'Entries Close: Monday 28th September 2026, 11:59pm AEDT', 'body'),
  F('round-1', 'Round 1 from October 16, 2026, end TBC.', 'Round 1 Viewing and Voting Period: 16th October 2026 - TBC', 'body'),
  F('fee-drama', 'Drama Series fee 1,480.', 'Drama Series: $1,480', 'body'),
  F('fee-comedy', 'Narrative Comedy Series fee 1,480.', 'Narrative Comedy Series: $1,480', 'body'),
  F('fee-miniseries', 'Miniseries fee 1,480.', 'Miniseries: $1,480', 'body'),
  F('fee-childrens', 'Children\'s Program fee 1,480.', 'Children’s Program: $1,480', 'body'),
  F('window', 'First episode broadcast in Australia January 1 to December 31, 2026.', 'broadcast in Australia on a FTA Network or VOD/SVOD platform for the first time between January 1st 2026 and December 31st 2026.', 'body'),
  ], notes='Fees are per program category; no performer fee is listed (performers are candidates on the program entry). The page also lists a "Lifestyle Program: $1,480" fee for a category the rule book does not have.'))

# ---------------------------------------------------------------- 3. Festivals
S.append(dict(id='b25-S65', title='Festival de Cannes: Submit a film', dl='cannes-submit-a-film-page', facts=[
  F('sections', 'Official Selection: Competition, Out of Competition or Un Certain Regard; the committee decides which.', 'Films may be accepted in the Official Selection for Competition, Out of Competition or Un Certain Regard. The selection committee is the sole decision-maker of the category in which a selected film is screened.', 'top'),
  F('2026-closed', 'Official Selection and La Cinef registration for 2026 are closed.', 'Registration is now closed for films for the Official Selection (feature films and short films) and the La Cinef selection of student films at the 2026 Festival de Cannes!', '2026 Submission'),
  F('feature-produced', 'Features produced in the 12 months before the festival.', 'Films that have been produced during the twelve months preceding the Festival', 'Feature films, Conditions'),
  F('feature-home-only', 'Distribution limited to the country of origin.', 'Films whose distribution is limited to their country of origin', 'Feature films, Conditions'),
  F('international-section-bars', 'Selection in another festival\'s international section makes a film ineligible.', 'If the film has been selected for an international section (competitive or not) of a festival, it becomes ineligible for the Festival de Cannes. A selection is international if it presents films from different countries.', 'Feature films, Conditions'),
  F('feature-no-internet', 'Not shown on the internet or released on DVD.', 'Films that have not been shown on the Internet or released on DVD', 'Feature films, Conditions'),
  F('french-release', 'Competition features must be released theatrically in France.', 'Every feature film invited to be in competition must be released theatrically in France in accordance with French legislation pertaining to media chronology rules.', 'Feature films, Conditions'),
  F('feature-length', 'Features over 60 minutes.', 'In order to be selected as a feature film, your film must be more than 60 minutes long.', 'Film duration'),
  F('no-medium-length', 'No films of 15 to 60 minutes.', 'The Festival de Cannes does not accept films with a duration of between 15 and 60 minutes.', 'Film duration'),
  F('feature-deadline', 'Feature registration deadline March 13, 2026.', 'The registration deadline is March 13th, 2026 at midnight French time', 'Deadline for registration'),
  F('fee-dcp', 'Feature fee: DCP sent, EUR 300 excl. VAT.', 'DCP (Digital Cinema Package) to be sent: €300 excl. VAT, €360 incl. VAT.', 'Application and screening fee'),
  F('fee-uploaded-dcp', 'Uploaded DCP EUR 350 excl. VAT.', 'Uploaded DCPs: €350 excl. VAT, €420 incl. VAT.', 'Application and screening fee'),
  F('fee-video', 'Video file upload EUR 75 excl. VAT.', 'Video file upload: €75 excl. VAT, €90 incl. VAT.', 'Application and screening fee'),
  F('who-pays', 'Fees borne by the producer or sender, non-refundable.', 'Application and screening costs are borne by the producer or the sender, and are non-refundable.', 'Application and screening fee'),
  F('short-length', 'Shorts under 15 minutes including credits.', 'In order to be selected in the Short Films competition, your film must be under 15 minutes long (including credits).', 'Short films'),
  F('short-deadline', 'Short deadline March 2, 2026.', 'The deadline to submit short films is 2nd March 2026', 'Short films'),
  F('short-fee', 'Short fee EUR 25 excl. VAT.', 'Online upload: €25 excl. VAT, €30 incl. VAT for screening fees.', 'Short films'),
  F('camera-dor', 'First features in the Official Selection, Directors\' Fortnight or Critics\' Week compete for the Caméra d\'or.', 'all selected first feature films compete for the Caméra d’or, awarded to the best first film presented in the Official Selection (Competition, Out of Competition, Un Certain Regard), in the Director’s Fortnight or in the Semaine de la Critique', 'Info'),
  F('parallel-sections', 'Directors\' Fortnight and Critics\' Week are independent of the festival.', 'The non-official sections Director’s Fortnight and La Semaine de la Critique are independent of the Festival de Cannes.', 'Feature films, Important'),
  F('la-cinef', 'La Cinef: student films within a film-school curriculum.', 'have been directed by a student within his/her film school curriculum;', 'La Cinef, Eligibility'),
  F('la-cinef-fee', 'No fee for La Cinef.', 'No registration fee is required to submit a short film to LA CINEF.', 'La Cinef, Registration fee'),
  ], notes='Juries are not described on this page; prizes are in the regulations (b27-G1-05, b27-G1-06).'))

S.append(dict(id='b27-G1-05', title='Festival de Cannes: Feature Films in Official Selection – Regulations 2026', dl='cannes-regulations-feature-films-page', facts=[
  F('sections-competition', 'Official Selection: In Competition.', 'In Competition films', 'Article 3'),
  F('sections-ucr', 'Official Selection: Un Certain Regard.', 'Un Certain Regard films', 'Article 3'),
  F('sections-premiere', 'Official Selection: Cannes Première (also an opening film, a closing film and special screenings).', 'Cannes Première films', 'Article 3'),
  F('home-only', 'Not screened outside the home country.', 'not have been screened elsewhere than their home country;', 'Article 4'),
  F('no-other-international', 'Not in another international festival selection.', 'not have been presented in another international film festival (if the film was screened in an international selection, competitive or otherwise, of a festival, it is not eligible for the Festival de Cannes – a selection is international once it screens films from different countries);', 'Article 4'),
  F('no-withdrawal', 'Once selected, a film cannot be withdrawn except by French court decision.', 'Once selected, a film cannot be withdrawn from the program by the rights-holder other than from a decision by the French courts.', 'Article 5.1'),
  F('jury-awards', 'The Competition jury must hand out seven awards.', 'The Jury must hand out the following awards:', 'Article 8'),
  F('award-actress', 'Acting award.', 'the Award for Best Actress;', 'Article 8'),
  F('award-actor', 'Acting award.', 'the Award for Best Actor.', 'Article 8'),
  F('one-award-per-film', 'One award per film; Screenplay or Jury Prize may be paired with an acting award by dispensation.', 'A single film can only receive one of the awards. However, the Award for Best Screenplay and the Jury Prize may be, upon dispensation of the Festival, associated with an acting award.', 'Article 8'),
  F('ties', 'Awards can have only one tie, never the Palme d\'or.', 'The awards can only have one tie and this provision does not apply to the Palme d’or.', 'Article 8'),
  F('palme-bars-other-competition', 'A Palme d\'or or Grand Prix winner may not compete at another international festival.', 'Any producer of a feature film invited into Competition commits, should the film win the Palme d’or or the Grand Prix, to not presenting this film in competition at any other international festival.', 'Article 9'),
  F('next-edition', 'The next (80th) edition: May 11-22, 2027.', 'May 11-22, 2027', 'page footer'),
  ], notes='Jury composition (size, who sits) is not stated. Article 10\'s dates render as "13 th March 2026" and "23 rd March 2026" in the page text (superscripts).'))

S.append(dict(id='b27-G1-06', title='Festival de Cannes: Short films In Competition – Regulations 2026', dl='cannes-regulations-short-films-page', facts=[
  F('palme', 'The short competition awards a Palme d\'or.', 'Every year, the Association Française du Festival International du Film has a short film competition in order to award a Palme d’or.', 'Article 2'),
  F('length', 'At most 15 minutes including credits.', 'the duration of films must not exceed 15 minutes, including credits.', 'Article 3'),
  F('notified', 'Selected shorts are told before the press conference, around mid-April.', 'In the event that your short film is selected, you will be notified before the official press conference, which takes place each year around the middle of April.', 'Article 4'),
  ], notes='No acting prize for shorts is stated.'))

S.append(dict(id='b25-S66', title='La Biennale di Venezia: 83rd Venice International Film Festival, Regulations', dl='venice-2026-regulations-page', facts=[
  F('dates', 'Lido, September 2 to 12, 2026.', 'Venice International Film Festival is organised by La Biennale di Venezia and will be held on the Lido di Venezia from 2 to 12 September 2026.', '1'),
  F('world-premieres', 'Official Selection: world premieres only.', 'Only films presented as world premieres that meet the following criteria are eligible for selection:', '3'),
  F('completed-after', 'Completed after September 6, 2025.', 'Films that were completed after 6 September 2025;', '3'),
  F('no-distribution', 'No commercial distribution or internet exhibition.', 'Films that have not had any form of commercial distribution or exhibition on the Internet;', '3'),
  F('no-prior-screening', 'Not screened to public or press, nor at any international festival, even at home.', 'Films that neither have been previously screened to the public and/or the press, nor have been presented at any other International film festival or cinematographic event, including those in the country of origin.', '3'),
  F('competition', 'Venezia 83: at most 21 features.', 'An International competition comprising a maximum of 21 feature-length films presented as world premieres.', '3.1'),
  F('orizzonti', 'Orizzonti: at most 19 films.', 'An international competition reserved for a maximum of 19 films', '3.3'),
  F('orizzonti-shorts', 'Orizzonti Corti: competing shorts of at most 20 minutes.', 'The Orizzonti section features a selection of competing short films lasting a maximum of 20 minutes', '3.3'),
  F('jury', 'Venezia jury: at most 7 people from various countries.', 'An International Jury composed of no more than 7 personalities from the world of cinema and culture from various countries', '6.1'),
  F('prize-actress', 'Acting prize.', 'Coppa Volpi for Best Actress', '6.1'),
  F('prize-actor', 'Acting prize.', 'Coppa Volpi for Best Actor', '6.1'),
  F('prize-young', 'Young performer prize.', 'Marcello Mastroianni Award for Best New Young Actor or Actress', '6.1'),
  F('no-joint', 'No joint winners.', 'There will be no joint winners.', '6.1'),
  F('acting-pairing', 'Once only, an acting prize may go to a film that won another prize.', 'Exceptionally and just in one case, after consultation with the Festival Director, the Jury may confer the Coppa Volpi or the Marcello Mastroianni award to an actor or an actress featured in a film which has won one of the other awards listed in the Regulations.', '6.1'),
  F('orizzonti-jury', 'Orizzonti jury: at most 5.', 'An International Jury, composed of no more than 5 personalities from the world of cinema and culture from various countries', '6.2'),
  F('orizzonti-actress', 'Orizzonti acting prize.', 'Orizzonti Award for Best Actress', '6.2'),
  F('orizzonti-actor', 'Orizzonti acting prize.', 'Orizzonti Award for Best Actor', '6.2'),
  F('orizzonti-short', 'Orizzonti short prize.', 'Orizzonti Award for Best Short Film', '6.2'),
  F('submissions-open', 'Submissions opened February 9.', 'Submissions to the 83rd Venice International Film Festival open on 9 February and close as follows:', '7.1'),
  F('feature-deadline', 'Features close June 4.', 'for feature length films, series and miniseries on 4 June;', '7.1'),
  F('short-deadline', 'Shorts close May 28.', 'for short films on 28 May;', '7.1'),
  F('no-public-screening', 'No public screening anywhere, even at home.', 'Under no circumstances may films to be presented at the Venice International Film Festival have been screened publicly, not even in their country of origin.', '7.2'),
  F('other-festivals-excluded', 'Works shown at other international festivals or on the web are excluded.', 'Works previously presented in competing or non-competing sections at other international festivals are also excluded, as are those already available on the web.', '7.2'),
  F('fees', 'Fees: EUR 200 features, 80 shorts; 250 for features from May 15, 2026; 100 for shorts from April 30.', 'The fee is 200 Euros for feature length films and immersive projects, 80 Euros for short films. For feature length films submitted from 15 May 2026 the fee will be 250 Euros. From 30 April the fee will be 100 Euros for short films and 250 Euros for immersive projects.', '7.5'),
  F('who-submits', 'Producers, distributors or other authorised parties submit.', 'Producers, distributors or other parties who submit works to the Festival must guarantee they are legally authorised to do so.', '11'),
  ], notes='The page says this is the 83rd (2026) edition; the 2027 regulations were not found.'))

S.append(dict(id='b25-S67', title='Berlinale: General Guidelines for Submission and Participation', dl='berlinale-general-guidelines-page', facts=[
  F('feature-deadline', 'Features: form and screener by October 21, 2026.', 'Feature-length films: receipt of submission form and selection screener by October 21, 2026', '2.1'),
  F('short-deadline', 'Shorts: by November 4, 2026.', 'Short films: receipt of submission form and selection screener by November 04, 2026', '2.1'),
  F('completed', 'Completed within 12 months before the festival.', 'Only films completed within the 12 months prior to the start of the festival may be submitted.', '2.1'),
  F('premieres', 'World premieres preferred; a home-country release or festival accepted, except German films.', 'World premieres are preferred in all sections. However, except for German films, a theatrical release as well as a festival participation in the main country of origin will be accepted.', '2.1'),
  F('no-german-premieres', 'German premieres not eligible.', 'German premieres are not eligible for any section accepting film submissions.', '2.1'),
  F('no-tv-vod', 'No TV, internet or VOD showings.', 'Films that have been broadcasted on television or presented on the internet/on VOD are not eligible.', '2.1'),
  F('no-resubmission', 'No resubmission.', 'Films which have been submitted and viewed for previous editions of the Berlinale may not be registered again.', '2.1'),
  F('fees', 'Fee EUR 175 per feature regardless of sections; EUR 75 per short.', 'The fee for submitting a feature-length film is 175 euros (7 % VAT included) regardless of the number of sections for which the film is entered. The fee for short films is 75 euros (7 % VAT included).', '2.2'),
  F('no-withdrawal', 'No withdrawal after announcement.', 'No film may be withdrawn from the festival programme after its participation has been publicly announced.', '3.2'),
  F('who-submits', 'Producers, distributors and others submit.', 'Producers, distributors and other people or organisations submitting a film must ensure that any third parties connected to the production agree to its participation in the festival.', '3.2'),
  F('cast-presence', 'Directors and main cast expected; no travel paid; some hotel rooms.', 'The Berlinale expects the invited films’ directors and main cast to attend the presentation of their films in Berlin, if possible. The festival is not in the position to cover travel expenses, although a certain number of hotel rooms are made available.', '3.3'),
  ], notes='The 2027 festival dates are not stated on this page. Juries and prizes are described elsewhere (b27-G1-10, b25-S68).'))

S.append(dict(id='b25-S68', title='Berlinale: Welcome to the Film Entry', dl='berlinale-film-entry-start-page', facts=[
  F('feature-deadline-passed', 'Feature deadline passed October 21.', 'The submission deadline for feature films has passed on October 21.', 'top'),
  F('shorts-open', 'Shorts until November 4.', 'Short films can still be submitted until November 4.', 'top'),
  F('european-premieres', 'Only Perspectives, Panorama, Generation and Forum accept European premieres.', 'Only the Perspectives, Panorama, Generation and Forum sections accept European premieres.', 'Premiere Status'),
  F('awards-as-of', 'Awards listed as of September 2026, subject to change.', '(as of September 2026 – subject to change)', 'Sections at a Glance'),
  F('competition-awards', 'Competition awards include the Golden Bear and Silver Bears.', 'Golden Bear, Silver Bears, Berlinale Documentary Award, Teddy Awards, Heiner Carow Prize', 'Sections at a Glance, Competition'),
  F('shorts-awards', 'Berlinale Shorts awards.', 'Golden Bear for Best Short Film, Silver Bear Jury Prize, Berlinale Shorts CUPRA Filmmaker Award, Berlin Short Film Candidate for the European Film Awards, Teddy Award', 'Sections at a Glance, Berlinale Shorts'),
  F('multiple-sections', 'One application for several sections.', 'You may submit to multiple sections with only one application.', 'Further Information'),
  F('results-by', 'Results at latest by early 2027.', 'Notification of the results of the selection process will take place as soon as possible, at the latest by the beginning of 2027.', 'body'),
  ], notes='The section table gives Competition "min. 60\'" with "International premiere (German productions have to be world premieres)", and Berlinale Shorts "max. 30\'".'))

S.append(dict(id='b27-G1-07', title='Berlinale: Competition Regulations', dl='berlinale-competition-regulations-page', facts=[
  F('eligible-kinds', 'Fiction features, documentaries, animation and experimental films.', 'Eligible for Competition are fiction feature films, documentaries, animation and experimental films, which', '1'),
  F('length', 'At least 60 minutes.', 'are of at least 60 minutes running time.', '1'),
  F('premiere', 'World or international premieres; not shown publicly, at an international festival or in release outside the country of origin.', 'are available as world or international premieres. Submitted films must not have been presented publicly outside their country of origin, participated in any international film festival outside of their country of origin, or have been theatrically released outside of their country of origin.', '1'),
  F('country-of-origin', 'Country of origin = production company headquarters.', 'A film’s country of origin is determined by the location of the production company’s headquarters.', '1'),
  F('germany', 'German films must be world premieres.', 'have not been presented publicly in Germany. Accordingly, German films must be world premieres.', '1'),
  F('theatrical', 'Intended for theatrical release.', 'are intended for theatrical release.', '1'),
  F('prizes', 'Compete for Golden Bear and Silver Bears.', 'The selected films compete for the Golden Bear as well as the Silver Bears.', '2'),
  ], notes=''))

S.append(dict(id='b27-G1-08', title='Berlinale: Berlinale Shorts Regulations', dl='berlinale-shorts-regulations-page', facts=[
  F('length', 'At most 30 minutes.', 'do not exceed the maximum running time of 30 minutes.', '1'),
  F('prizes', 'Golden Bear for Best Short Film, Silver Bear Jury Prize (Short Film), CUPRA Filmmaker Award of EUR 20,000.', 'The selected films compete for the Golden Bear for Best Short Film and the Silver Bear Jury Prize (Short Film) as well as the Berlinale Shorts CUPRA Filmmaker Award endowed with 20,000 euros.', '2'),
  ], notes='No acting prize for shorts is stated.'))

S.append(dict(id='b27-G1-09', title='Berlinale: All prizes and juries (index page)', dl='berlinale-all-prizes-and-juries-page', facts=[],
  notes='An index of links only; no rules text. Its "International Jury" link was read as b27-G1-10.'))

S.append(dict(id='b27-G1-10', title='Berlinale: Prizes of the International Jury', dl='berlinale-international-jury-page', facts=[
  F('selected-by', 'The jury is selected yearly by the Festival Director.', 'The International Jury is selected every year by the Festival Director and presents the following awards:', 'body'),
  F('leading', 'Acting prize (gender-neutral).', 'Silver Bear for Best Leading Performance', 'body'),
  F('supporting', 'Acting prize (gender-neutral).', 'Silver Bear for Best Supporting Performance', 'body'),
  F('one-prize-rule', 'No ex aequo; one prize per film except acting awards may be added.', 'None of the Bears may be awarded ex aequo. The Jury may not award more than one prize to the same film, except in the case of the acting awards, which may be awarded in addition to any other prize (Golden Bear, Silver Bear Grand Jury Prize etc.).', 'body'),
  F('jury-members', 'Jury includes directors, actors, producers, writers, artists.', 'Jury members include directors, actresses and actors as well as producers, but also writers and artists.', 'body'),
  ], notes='Jury size is not stated.'))

S.append(dict(id='b25-S75', title='IDFA: Festival entry regulations 2026', dl='idfa-2026-entry-regulations-page', facts=[
  F('dates', 'The 39th IDFA: November 12 to 22, 2026.', 'The 39th International Documentary Film Festival Amsterdam, including its New Media program IDFA DocLab, takes place November 12 to 22, 2026.', 'intro'),
  F('documentary-only', 'IDFA considers documentary films (broadly, including hybrids) and new media.', 'IDFA considers documentary films, performances and new media projects in any format and of any duration. IDFA understands documentary film in a broad sense, as a film that deals with reality, including hybrid films and films that rely on real elements as a core component.', '1.2'),
  F('completed-after', 'Completed after July 10, 2025.', 'All Films completed after July 10, 2025 are eligible for IDFA 2026.', '1.2'),
  F('netherlands-bar', 'Films already shown, broadcast or online in the Netherlands are ineligible.', 'Films that have already been screened in the Netherlands, been broadcast on Dutch television or are available via VOD, SVOD or any online platform in the Netherlands are not eligible for the Festival.', '1.2'),
  F('premiere-definitions', 'World, international and European premiere defined.', 'A world premiere would mean that a screening at IDFA is the first screening ever, on any media, and anywhere. The international premiere is the first screening outside the country of production, a European premiere is the first screening in Europe', '1.3'),
  F('competition-premiere', 'Competitions need world, international or European premiere.', 'The latter is a requirement for films entered into one of IDFA’s competitions, Luminous or Frontlight sections.', '1.3'),
  F('private-screening', 'A private screening under 50 people does not change premiere status.', 'A private screening prior to IDFA is allowed and will not change a film\'s premiere status, provided this screening is not publicized, by invitation, without ticket sales, and for fewer than 50 people.', '1.3'),
  F('early-deadline', 'Early deadline April 23, 2026; fees EUR 25 to 45.', 'Early entry deadline April 23, 2026 (entry fee for student films €25, films shorter than 40 minutes €25, films 40 minutes or longer €45)', '1.1'),
  F('second-deadline', 'Second deadline May 28, 2026; fees EUR 25 to 65.', 'Second entry deadline May 28, 2026 (entry fee for student films €25, films shorter than 40 minutes €40, films 40 minutes or longer €65)', '1.1'),
  F('final-deadline', 'Final deadline July 9, 2026; fees EUR 25 to 85.', 'Final entry deadline July 9, 2026 (entry fee for student films €25, films shorter than 40 minutes €50, films 40 minutes or longer €85).', '1.1'),
  F('entry', 'Entry needs the form, an English-subtitled screener and the fee.', 'To consider your entry for the festival, IDFA must receive a completed Entry Form, a screener that is subtitled in English (unless the Film’s spoken language is English), and payment of the entry fee.', '1.5'),
  F('international-competition', 'About 15 films over 60 minutes.', 'The International Competition presents about 15 films, over 60 minutes in duration each, in world, international or European premiere.', '2.4.1'),
  F('short-competition', 'Short documentary competition up to 40 minutes.', 'The IDFA Competition for Short Documentary is a competitive section for films up to 40 minutes, in world, international, or European premiere. For Dutch productions, only world premieres can be accepted.', '2.4.4'),
  F('prizes', 'International Competition jury of five: best film, directing, editing, cinematography.', 'an international jury consisting of five jurors will award a best film award (to be shared equally between director(s) and main producer(s)), IDFA Award for Best Directing (awarded to the director(s)), the IDFA Award for Best Editing (awarded to the editor(s)), and the IDFA Award for Best Cinematography (awarded to the cinematographer(s)).', '3'),
  F('envision-jury', 'Envision Competition jury of five.', 'an international jury consisting of five jurors will award a best film award (to the director(s) and main producer(s)), IDFA Award for Best Directing (awarded to the director(s)), IDFA Award for Outstanding Artistic Contribution.', '3'),
  F('short-jury', 'Short documentary jury of three.', 'an international jury consisting of three jurors will choose the winner of the IDFA Award for Best Short Documentary (awarded to the director).', '3'),
  F('premiere-kept', 'Breaking the agreed premiere status may cost the invitation.', 'Failing to keep the premiere status as agreed on between both Parties will result in IDFA reconsidering selection and placement of the Film', '4.1'),
  ], notes='A documentary festival: a fiction feature or short is not eligible as such (only "hybrid films and films that rely on real elements"). No performance prize is stated.'))

S.append(dict(id='b25-S76', title='IDFA: Festival entries', dl='idfa-festival-entries-page', facts=[
  F('closed', 'Entries for 2026 closed.', 'Entries for IDFA 2026 are now closed.', 'top'),
  ], notes='An overview of S75; nothing beyond it was used.'))

S.append(dict(id='b25-S70', title='Sundance Institute: Submitting Your Project to the 2027 Sundance Film Festival (FAQ PDF)', dl='sundance-2027-submissions-faq-pdf', facts=[
  F('feature-early', 'Features early deadline July 27, 2026, $80.', 'U.S. & International Feature Films: Monday, July 27, 2026 - $80 entry fee', 'Q1'),
  F('feature-official', 'Official deadline August 28, 2026, $100.', 'U.S. & International Feature Films: Friday, August 28, 2026 - $100 entry fee', 'Q1'),
  F('feature-late', 'Late deadline September 21, 2026, $125.', 'U.S. & International Feature Films: Monday, September 21, 2026 - $125 entry fee', 'Q1'),
  F('short-early', 'Shorts early July 13, 2026, $55.', 'U.S. & International Short Films: Monday, July 13, 2026 - $55 entry fee', 'Q1'),
  F('short-late', 'Shorts late August 31, 2026, $95.', 'U.S. & International Short Films: Monday, August 31, 2026 - $95 entry fee', 'Q1'),
  F('us-narrative-premiere', 'US narrative features: world premiere status only.', 'Only projects retaining world premiere status are eligible for open submission to this category.', 'Q2, U.S. Narrative Feature Films'),
  F('us-financing', 'US category: at least half US financing.', 'at least half of the project\'s financing must originate from within the United States.', 'Q2'),
  F('intl-narrative-premiere', 'International narrative features: international premiere status.', 'Only projects retaining international premiere status are eligible for open submission to this category.', 'Q2, International Narrative Feature Films'),
  F('shorts-premiere', 'Shorts completed after December 31, 2025 eligible regardless of premiere status.', 'Projects completed after December 31, 2025 are still eligible to submit to the Festival, regardless of premiere status.', 'Q2, Short Films'),
  F('completion', 'Completed before January 1, 2026: ineligible.', 'If your project was completed prior to January 1, 2026, it is no longer eligible for consideration.', 'Q9'),
  F('short-vs-feature', 'Under 50 minutes = short; 50+ = feature.', 'Films with a total running time of less than 50 minutes (including credits) are classified as shorts. Films with a total running time of 50 minutes or longer are classified as features.', 'Q6'),
  F('no-program-choice', 'Submitters cannot choose a program.', 'You may not submit your project directly to any specific Festival program.', 'Q3'),
  F('competition-prizes', 'Competition films compete for jury prizes and an audience award.', 'will compete against one another for jury prizes and an audience award.', 'Q3, U.S. Dramatic Competition'),
  F('short-prizes', 'Shorts compete for jury prizes by category.', 'will compete against one another for jury prizes within their respective categories and genres (U.S. Fiction, International Fiction, Nonfiction, and Animation).', 'Q3, Short Film Competition'),
  F('festival-favorite', 'All accepted features eligible for the audience-balloted Festival Favorite Award.', 'All feature-length films accepted into any of these programs are eligible to compete for the Festival Favorite Award, determined by audience balloting at screenings throughout the Festival.', 'Q3'),
  ], notes='No performance prize is named in the FAQ; jury composition not stated. The FAQ says it "is superseded by our Festival Rules & Regulations", which were not fetched.'))

S.append(dict(id='b25-S69', title='Sundance Institute: Submit to the 2027 Sundance Film Festival', dl='sundance-submit-page', facts=[
  F('open', 'The page still says 2027 submissions are open.', 'Submissions to the 2027 Sundance Film Festival are now open.', 'body'),
  ], notes='Category texts repeat the FAQ (b25-S70).'))

# ---------------------------------------------------------------- 4. Other US awards
S.append(dict(id='b25-S53', title='Film Independent: Spirit Awards FAQ', dl='spirit-awards-faq-page', facts=[
  F('submission-window', 'Submissions August 18 to September 29, 2026.', 'We will accept submissions for the 2027 Spirit Awards from August 18 through September 29, 2026.', 'FAQ'),
  F('nominations', 'Nominations December 2, 2026.', 'The 2027 Spirit Awards nominations announcement will take place on Wednesday, December 2, 2026.', 'FAQ'),
  F('nominating-committees', 'Film Independent assembles nominating committees.', 'Film Independent assembles nominating committees comprised of passionate, working members of the film community.', 'FAQ'),
  F('budget-cap', 'Budget ceiling $30 million after tax incentives; Cassavetes $1 million.', 'The budget ceiling for all feature films, after tax incentives, is $30 million. The budget ceiling for John Cassavetes Award qualification is $1 million.', 'FAQ'),
  F('no-shorts', 'No short films; at least 70 minutes.', 'All submitted films must be at least 70 minutes long.', 'FAQ'),
  F('animation', 'Animated films accepted.', 'Yes, as long as they meet all other eligibility requirements.', 'FAQ: Are animated films accepted?'),
  F('tv-first-season', 'TV categories for new series with one season aired.', 'The Spirit Awards television categories are for new series that have aired only one season.', 'FAQ'),
  F('film-performance-categories', 'Feature performer categories.', 'Best Lead Performance', 'FAQ: categories'),
  F('film-supporting', 'Feature performer category.', 'Best Supporting Performance', 'FAQ: categories'),
  F('film-breakthrough', 'Feature performer category.', 'Best Breakthrough Performance', 'FAQ: categories'),
  F('tv-lead', 'TV performer category (FAQ wording).', 'Best Lead Performance in a Scripted Series', 'FAQ: categories'),
  F('performance-submission-combos', 'Performers may submit Lead + Breakthrough, Supporting + Breakthrough, or Breakthrough only.', 'Performers may submit for Lead + Breakthrough consideration, Supporting + Breakthrough consideration, or just Breakthrough consideration.', 'FAQ: categories'),
  F('one-performance-category', 'Nominated in only one of Lead, Supporting or Breakthrough; the committee decides.', 'Ultimately, actors can only be nominated in either Lead, Supporting OR Breakthrough. Final determination on category will be at the discretion of the Nominating Committee.', 'FAQ: categories'),
  F('qualifying-festivals', 'Qualifying festivals, with the Berlinale new for 2027.', 'Hot Docs Film Festival, Sundance Film Festival, SXSW Film Festival, New Directors/New Films, Tribeca Film Festival, Telluride Film Festival, Toronto International Film Festival, New York Film Festival and, new for 2027, the Berlin International Film Festival (Berlinale).', 'FAQ'),
  F('winners-voted-by-members', 'Film Independent Members vote the winners.', 'Only Film Independent Members vote on the Spirit Awards nominees to determine winners*.', 'FAQ'),
  F('member-deadline', 'Voters must be members by December 17, 2026.', 'You must be a current Film Independent Member by December 17, 2026 to be eligible for voting benefits.', 'FAQ'),
  F('nominee-screening-fee', 'Nominee Screening Room $4,200 per title.', 'The cost to participate is $4,200 per title.', 'FAQ'),
  F('must-see-all', 'Members vote only in categories where they have seen all nominees.', 'You may only vote in categories in which you have seen all of the nominated films.', 'FAQ'),
  ], notes='The FAQ links the official rules PDFs (read as b27-G1-11 film, b27-G1-12 TV).'))

S.append(dict(id='b25-S54', title='Film Independent: Spirit Awards Submissions', dl='spirit-awards-submissions-page', facts=[
  F('ceremony', 'The 42nd Spirit Awards: March 6, 2027.', 'The 42nd Film Independent Spirit Awards will take place on Saturday, March 6, 2027.', 'body'),
  F('nominations', 'Nominees announced December 2, 2026.', 'Nominees will be announced December 2, 2026.', 'body'),
  F('closed', 'Submissions closed.', '2027 Spirit Awards submissions are closed.', 'body'),
  ], notes=''))

S.append(dict(id='b27-G1-11', title='Film Independent: 2027 Spirit Awards Rules & Regulations, Film Submissions (PDF)', dl='spirit-awards-2027-film-rules-pdf', facts=[
  F('committees', 'Three nominating committees: American Narrative, Documentary, International.', 'The Spirit Awards nominations are determined by three (3) committees: American Narrative, Documentary and International.', 'Nominating Guidelines'),
  F('length', 'At least 70 minutes.', 'All submitted films must be at least 70 minutes long.', 'Rules for Eligibility 1'),
  F('budget', 'Cost after incentives, including post, under $30 million.', 'Cost of completed film after tax incentives, and including post production expenses, should be less than $30 million.', 'Rules for Eligibility 2'),
  F('festival-route', 'Eligible via 2026 programming at one of nine festivals.', 'Been programmed in 2026 at one of the following nine film festivals: Hot Docs, New Directors/New Films, New York Film Festival, Sundance Film Festival, SXSW Film Festival, Telluride Film Festival, Toronto International Film Festival, Tribeca Film Festival, Berlin International Film Festival OR', 'Rules for Eligibility 3.a'),
  F('theatrical-route', 'Or one week in a US commercial theater in 2026.', 'Been shown in a commercial theater in the United States for at least one week (seven consecutive days) between January 1, 2026 – December 31, 2026 OR', 'Rules for Eligibility 3.b'),
  F('nominated-once', 'Once nominated, not eligible again.', 'once a film is nominated (in any category minus the Emerging Filmmaker Award categories: Someone to Watch, Producers Award, Truer Than Fiction), it is no longer eligible for submission in subsequent years.', 'Rules for Eligibility 4'),
  F('american-production', 'American production: US citizens/residents in two of director, writer, producer.', 'A film in which U.S. citizens or permanent residents are credited in at least two of the following categories of responsibilities: director, writer or producer.', 'Rules for Eligibility 5.a'),
  F('american-setting', 'Or the film is set in significant part in the US or has significant American content.', 'The film is set in significant part in the United States and/or has significant American content.', 'Rules for Eligibility 5.b'),
  F('submitter', 'The submitter is the filmmaker or distributor.', 'the submitter (filmmaker or distributor) must supply proof of citizenship or permanent residence of filmmaker(s).', 'Rules for Eligibility 5'),
  F('international-only-intl', 'International narratives only eligible for Best International Film.', 'Documentary films are only eligible for Best Documentary; international narrative films are only eligible for Best International Film.', 'Rules for Eligibility 6'),
  F('acting-categories', 'Acting categories open to all American narrative features.', 'Best Lead/Supporting/Breakthrough Performance: All American narrative features are eligible in these categories.', 'Category Information'),
  F('acting-american-only', 'Only actors in American narrative films are eligible.', 'Only actors in "American Narrative" films are eligible in acting categories.', 'Category Information'),
  F('fees-members', 'Member fees $400/$500/$600 by deadline.', 'Film Early Deadline $400 Sept 1 / Film Regular Deadline $500 Sept 15 / Film Final Deadline $600 Sept 29', 'Submission Payment'),
  F('fees-non-members', 'Non-member fees $450/$550/$650.', 'Film Early Deadline $450 Sept 1 / Film Regular Deadline $550 Sept 15 / Film Final Deadline $650 Sept 29', 'Submission Payment'),
  F('voters', 'Film Independent Members are the voting body.', 'Film Independent Members are the official voting body that determines the winners for the Spirit Awards.', 'Voting and Consideration'),
  F('nominee-fee', 'Nominee screener program $4,200.', 'Spirit Award-nominated titles will be required to participate in the Nominee Screener program for a $4,200 fee', 'Nominee Screening Program'),
  ], notes='The PDF prints a shared login for the screener upload site; it is not reproduced here. The PDF names the international award "Best International Film" in rules 5-6 and "Best International Feature" in the category list.'))

S.append(dict(id='b27-G1-12', title='Film Independent: 2027 Spirit Awards Rules & Regulations, Television Submissions (PDF)', dl='spirit-awards-2027-tv-rules-pdf', facts=[
  F('window', 'New series airing October 1, 2025 to September 30, 2026.', 'The 2027 Film Independent Spirit Awards will recognize new series airing during the eligibility period of October 1, 2025 - September 30, 2026.', 'Rules for Eligibility 1'),
  F('episodes', 'Episodes 18+ minutes; at least two in the window.', 'Episodes must be at least 18 minutes in length and a minimum of two (2) episodes must have been broadcast, transmitted or available via a commercial streaming platform within the eligibility window.', 'Rules for Eligibility 3'),
  F('performers-from-scripted', 'Performer entries only from series entered as Best New Scripted Series.', 'Only series eligible to submit in the category of Best New Scripted Series are eligible to submit for Best Lead Performance, Best Supporting Performance, and/or Best Breakthrough Performance.', 'Rules for Eligibility 4'),
  F('international-platform', 'International series must air on a US platform for US audiences in the window.', 'The series airs on a U.S. platform with the purpose to be shown to U.S. audiences within the eligibility window, AND', 'Rules for Eligibility 5.a'),
  F('international', 'And be a creative and financial US co-production preceding production.', 'The series is a co-production between U.S. and International partners, creatively and financially, preceding the start of production.', 'Rules for Eligibility 5.b'),
  F('ensemble-excludes-individual', 'An ensemble winner\'s performers cannot be nominated individually.', 'Any performer recognized as part of the awarded Best Ensemble Cast will no longer be eligible to be nominated in the individual performance categories.', 'Rules for Eligibility'),
  F('tv-lead', 'TV performer category (PDF wording).', 'BEST LEAD PERFORMANCE IN A NEW SCRIPTED SERIES', 'Category Information'),
  F('tv-supporting', 'TV performer category.', 'BEST SUPPORTING PERFORMANCE IN A NEW SCRIPTED SERIES', 'Category Information'),
  F('tv-breakthrough', 'TV performer category.', 'BEST BREAKTHROUGH PERFORMANCE IN A NEW SCRIPTED SERIES', 'Category Information'),
  F('fees-members', 'Series fee (members) $525 / $625.', 'Member fees: (TV Regular Deadline: $525 by Sept 1/TV Final Deadline: $625 by Sept 15)', 'Payment'),
  F('performer-fee', '$100 per performer per category.', '+ $100 for each performer in a performance category', 'Payment'),
  F('same-performer-multiple', 'The same performer in several categories pays $100 per category.', 'if submitting same performer in multiple categories, fee is $100 per category', 'Payment'),
  ], notes='The FAQ (b25-S53) names the TV acting categories "in a Scripted Series"; this PDF names them "in a New Scripted Series".'))

S.append(dict(id='b25-S57', title='Critics Choice Association: Critics Choice Awards Submissions and Categories', dl='critics-choice-submissions-and-categories-page', facts=[
  F('ceremony', 'Ceremony live Sunday January 3, 2027.', 'LIVE SUNDAY JANUARY 3, 2027', 'top'),
  F('film-actor', 'Film performer category.', 'Best Actor', 'film categories'),
  F('young', 'Film young performer category, 18 and under at filming.', '(18 and under at the time of filming)', 'film categories'),
  F('film-actress', 'Film performer category.', 'Best Actress', 'film categories'),
  F('film-supporting-actor', 'Film performer category.', 'Best Supporting Actor', 'film categories'),
  F('film-supporting-actress', 'Film performer category.', 'Best Supporting Actress', 'film categories'),
  F('film-young', 'Film performer category.', 'Best Young Actor / Actress', 'film categories'),
  F('tv-drama-actor', 'TV performer category.', 'Best Actor in a Drama Series', 'television categories'),
  F('tv-drama-actress', 'TV performer category.', 'Best Actress in a Drama Series', 'television categories'),
  F('tv-drama-supporting-actor', 'TV performer category.', 'Best Supporting Actor in a Drama Series', 'television categories'),
  F('tv-drama-supporting-actress', 'TV performer category.', 'Best Supporting Actress in a Drama Series', 'television categories'),
  F('tv-comedy-actor', 'TV performer category.', 'Best Actor in a Comedy Series', 'television categories'),
  F('tv-comedy-actress', 'TV performer category.', 'Best Actress in a Comedy Series', 'television categories'),
  F('tv-comedy-supporting-actor', 'TV performer category.', 'Best Supporting Actor in a Comedy Series', 'television categories'),
  F('tv-comedy-supporting-actress', 'TV performer category.', 'Best Supporting Actress in a Comedy Series', 'television categories'),
  F('tv-limited-actor', 'TV performer category.', 'Best Actor in a Limited Series or a Movie Made for Television', 'television categories'),
  F('tv-limited-actress', 'TV performer category.', 'Best Actress in a Limited Series or a Movie Made for Television', 'television categories'),
  F('tv-limited-supporting-actor', 'TV performer category.', 'Best Supporting Actor in a Limited Series or a Movie Made for Television', 'television categories'),
  F('tv-limited-supporting-actress', 'TV performer category.', 'Best Supporting Actress in a Limited Series or a Movie Made for Television', 'television categories'),
  ], notes='The page lists categories and dates but no eligibility rules. Its "Submission guidelines" links (b27-G1-13, b27-G1-14) are script-rendered pages with no text. Eligibility windows are in the timelines (b27-G1-21, b27-G1-22). Who votes is not stated beyond the timelines\' ballot steps.'))

S.append(dict(id='b27-G1-13', title='Critics Choice: Film Submissions guidelines (filmsubmissions.criticschoice.com/page/guidelines)', dl='critics-choice-film-guidelines-page', facts=[],
  notes='HTTP 200 but unreadable: a 5,542-byte script shell (a JavaScript single-page app) with no guidelines text. Not pursued further (no browser).'))
S.append(dict(id='b27-G1-14', title='Critics Choice: TV Submissions guidelines (tvsubmissions.criticschoice.com/page/guidelines)', dl='critics-choice-tv-guidelines-page', facts=[],
  notes='HTTP 200 but unreadable: a 5,535-byte script shell with no guidelines text.'))

S.append(dict(id='b27-G1-21', title='Critics Choice: 2026 Film Awards Timeline (updated October 16, 2026)', dl='critics-choice-film-timeline-pdf', facts=[
  F('window', 'Film eligibility January 1 to December 31, 2026.', 'JANUARY 1, 2026 - DECEMBER 31, 2026', 'Eligibility window'),
  F('submissions', 'Film submissions open October 21.', 'WEDNESDAY, OCTOBER 21 SUBMISSIONS OPEN FOR ALL FILM CATEGORIES', 'timeline'),
  F('submissions-close', 'Film submissions close November 9.', 'MONDAY, NOVEMBER 9 SUBMISSIONS CLOSE FOR ALL FILM CATEGORIES', 'timeline'),
  F('nominating-ballots', 'Nominating ballots go to Film Branch members.', 'TUESDAY, NOVEMBER 24 FILM NOMINATING BALLOTS SENT TO FILM BRANCH MEMBERS', 'timeline'),
  F('nominations', 'Film nominations December 4.', 'FRIDAY, DECEMBER 4 FILM NOMINATIONS ANNOUNCED LIVE ON E! AND USA NETWORK', 'timeline'),
  F('final-ballots', 'Final ballots to all voting members December 21.', 'MONDAY, DECEMBER 21 FINAL BALLOTS SENT TO ALL VOTING MEMBERS', 'timeline'),
  F('final-ballots-due', 'Final ballots due December 31.', 'THURSDAY, DECEMBER 31 DEADLINE FOR RETURNING FINAL BALLOTS', 'timeline'),
  ], notes=''))
S.append(dict(id='b27-G1-22', title='Critics Choice: 2026 Television Awards Timeline (updated April 9, 2026)', dl='critics-choice-tv-timeline-pdf', facts=[
  F('window', 'TV eligibility January 1 to December 31, 2026.', 'JANUARY 1, 2026 - DECEMBER 31, 2026', 'Eligibility window'),
  F('nomcoms', 'TV nominating committees begin November 9.', 'MONDAY, NOVEMBER 9 TV NOMCOMS BEGIN DELIBERATIONS', 'timeline'),
  F('nomcoms-end', 'TV nominating committees end December 1.', 'TUESDAY, DECEMBER 1 TV NOMCOMS END DELIBERATIONS', 'timeline'),
  F('tv-nominations', 'TV nominations December 4.', 'FRIDAY, DECEMBER 4 TV NOMINATIONS ANNOUNCED LIVE ON E! AND USA NETWORK', 'timeline'),
  F('open', 'TV submissions open September 21.', 'MONDAY, SEPTEMBER 21 SUBMISSIONS OPEN', 'timeline'),
  F('close', 'TV submissions close November 16.', 'MONDAY, NOVEMBER 16 SUBMISSIONS CLOSE', 'timeline'),
  ], notes=''))

S.append(dict(id='b25-S60', title='NATAS: Rules & Procedures (theemmys.tv/rules)', dl='natas-rules-page', facts=[
  F('current-call', 'The current national call listed is the 4th Children\'s & Family.', '4th Annual Children’s & Family', 'National Competition Call for Entries'),
  F('general-rules-year', 'General rules shown are for 2025.', 'GENERAL RULES FOR 2025', 'body'),
  ], notes='Read for links; the 4th Children\'s & Family call for entries was read as b27-G1-15.'))

S.append(dict(id='b27-G1-16', title='NATAS: Children\'s & Family Emmy Awards page', dl='natas-childrens-page', facts=[
  F('fifth', 'A 5th annual contest is named, linking to the entry portal.', '5th Annual Children’s & Family Emmy® Awards', 'body'),
  ], notes='The 5th\'s rules were not found as a published PDF; its button links to enter.theemmys.tv (an entry portal), not followed.'))

S.append(dict(id='b27-G1-15', title='NATAS: Call for Entries, 4th Annual Children\'s & Family Emmy Awards (v2025.0.1)', dl='natas-4th-childrens-family-call-for-entries-pdf', facts=[
  F('version', 'Version 2025.0.1.', 'v2025.0.1', 'every page'),
  F('window', 'Eligibility June 1, 2024 to May 31, 2025.', 'originally aired or made available for viewing in the United States for the first time between the dates of June 1, 2024 to May 31, 2025.', 'Entering the Children\'s & Family Emmys'),
  F('deadlines', 'Entry Aug 14, late Aug 26, payment Sep 15 (2025).', 'DEADLINES: Entry - August 14 | Late Entry - August 26 | Payment - September 15', 'every page footer'),
  F('nominations', 'Nominations week of December 1, 2025.', 'Week of December 1, 2025 - CAFE nominations announced', 'Key dates'),
  F('ceremonies', 'Ceremonies Q1 2026.', 'Q1 2026 - CAFE ceremonies', 'Key dates'),
  F('performer-fee', 'Performer, host and craft entries (categories 10-53): the next two lines give the fees.', 'PERFORMER, HOST AND CRAFT CATEGORIES (CATEGORIES 10-53):', 'Fees'),
  F('performer-fee-deadline', 'Deadline fee $350.', 'DEADLINE: $350', 'Fees'),
  F('performer-fee-late', 'Late fee $400.', 'LATE DEADLINE: $400', 'Fees'),
  F('no-discounts', 'No member or bulk discounts.', 'NATAS competitions do not offer discounts based on membership status or bulk submissions.', 'Fees'),
  F('two-academies', 'Television Academy runs the Primetime Emmys; NATAS runs Daytime, Sports, News & Documentary, Tech and Children\'s & Family.', 'The LA-based Television Academy administers the Primetime Emmys. The NY-based National Academy of Television Arts and Sciences (NATAS) administers the Daytime Emmys, the Sports Emmys, the News & Documentary Emmys, the Technology & Engineering Emmys, and now the Children’s & Family Emmys.', 'Basic Information'),
  F('audience', 'CAFE honours programming for ages infancy to 15.', 'CAFE content specifically honors programming for audiences ages infancy through 15 years of age', 'Basic Information'),
  F('older-to-primetime', 'Content for over-15s, animation included, may go to the Primetime Emmys.', 'Content for viewers older than the age of 15, including animation, may be eligible for the Primetime Emmy Awards.', 'Basic Information'),
  F('adult-animation', 'Animation for 16+ belongs to the Primetime Emmys.', 'Animation designed for adult and teen audiences age 16 and older is eligible within the Primetime Emmys.', 'Basic Information'),
  F('eligibility-panel', 'Contest eligibility decided by administration and the Eligibility Panel, not the entrant.', 'Eligibility is determined by administration and the Eligibility Panel, NOT the entrant.', 'Eligibility Panel'),
  F('preschool', 'Preschool: animated and live action, ages 0 to 5.', 'Preschool content, both animated and live-action, is content specifically designed for viewers from infancy to five years of age.', 'Preschool Content'),
  F('childrens', 'Children\'s and family: animated and live action, ages 6 to 11.', 'Children’s and family content, both animated and live action, is content specifically designed for viewers ages six to 11 years of age', 'Children\'s & Family Viewing Content'),
  F('animated-definition', 'An animated program is two-thirds animated content.', 'Animated Programs contain a predominance of animated content - clarified as ⅔ animated content.', 'Individual Eligibility Exceptions'),
  F('acting-categories', 'Non-gendered acting and voice categories; show and performer must agree on placement.', 'The Children’s & Family Emmys features a full slate of non-gendered acting and voice performance categories. Eligibility is determined by number of roles performed, screen time, and age. The show and the performer must be in agreement as to where the performance is being entered.', 'Acting Categories'),
  F('younger', 'Performers 18 or under: Younger OR Lead/Supporting, not both.', 'Younger performers, defined as performers who are ages 18 or under at any point within the current eligibility window, may enter the Younger Performer category OR a Lead or Supporting category but not both.', 'Acting Categories'),
  F('primetime-shows-excluded', 'Younger performers on a Primetime-eligible show cannot enter CAFE.', 'younger performers on “Abbott Elementary” are not eligible in CAFE because “Abbott Elementary” itself is eligible in Primetime.', 'Younger Performer Eligibility'),
  F('same-role-once', 'Same role on several shows: one entry.', 'Performers who play or voice the same role on multiple shows can only enter once for the same role', 'Younger Performer Eligibility / Camera Style'),
  F('live-and-voice-two-entries', 'Playing a role live and voicing it in animation are two crafts, two entries.', 'if a performer plays the character on a live action show and then voices the same character on an animated version, this is considered two different crafts and therefore the performer is eligible for two different entries', 'Younger Performer Eligibility / Camera Style'),
  F('cat-lead', 'Performer category 10.', 'Outstanding Lead Performer in a Preschool, Children’s or Young Teen Program', 'Index of categories'),
  F('cat-supporting', 'Performer category 11.', 'Outstanding Supporting Performer in a Preschool, Children’s or Young Teen Program', 'Index of categories'),
  F('cat-younger', 'Performer category 12.', 'Outstanding Younger Performer in a Preschool, Children’s or Young Teen Program', 'Index of categories'),
  F('cat-puppetry', 'Performer category 13.', 'Outstanding Puppetry Performer', 'Index of categories'),
  F('cat-voice-1', 'Voice category 14.', 'Outstanding Single Role Voice Performer in a Preschool Program', 'Index of categories'),
  F('cat-voice-2', 'Voice category 15.', 'Outstanding Multiple Role Voice Performer in a Preschool Program', 'Index of categories'),
  F('cat-voice-3', 'Voice category 16.', 'Outstanding Single Role Voice Performer in a Children’s or Young Teen Program', 'Index of categories'),
  F('cat-voice-4', 'Voice category 17.', 'Outstanding Multiple Role Voice Performer in a Children’s or Young Teen Program', 'Index of categories'),
  F('cat-voice-younger', 'Voice category 18.', 'Outstanding Younger Voice Performer in a Preschool, Children’s or Young Teen Program', 'Index of categories'),
  F('one-category-per-program', 'One performance category per program; show and talent agree.', 'A performer may only enter a single performance category (Lead, Supporting or Younger) for a single Program, and the show and the talent must be in agreement.', 'Category 10'),
  F('guest', 'Guests may enter Supporting.', 'Guest Performers are welcome to enter this category.', 'Category 11'),
  F('voice-live-action', 'Fully voiceover live-action performances eligible in voice categories.', 'While the emphasis is for animated voice performances, fully voiceover performances in Live Action programming are also eligible.', 'Categories 14-17'),
  F('single-vs-multiple', 'More than one role in a program: Multiple.', 'If an individual voices more than one role in the same program, they must instead enter Multiple Voice Performance.', 'Categories 14, 16'),
  F('narrators', 'Narrators only in Children\'s Personality.', 'Narrators (including Voiceover) and Storytellers count as Performers but are only eligible within the Children’s Personality category.', 'Performer categories checklist'),
  F('reel', 'Performer reel: up to 15 minutes, up to 5 scenes.', 'A reel of up to 15 minutes containing up to 5 scenes from any episodes originally aired in the eligibility window.', 'Performer categories checklist'),
  F('self-submission', 'Self or agent submissions allowed with rights-holder permission.', 'CAFE allows self-submissions (or agent/rep submissions) but self-submitters must still attain permission from the rights-holder', 'What\'s New'),
  F('peer-judging', 'Peer judging: vetted judges watch everything in their categories.', 'As a NATAS Emmys contest, CAFE is subject to the peer judging system by which judges are vetted, assigned and must watch all their material in their given categories.', 'Judging System'),
  F('blue-ribbon', 'Blue Ribbon judging decides nominees and winners in one round.', 'Then Blue Ribbon Judging will determine nominees and winners within the same round of judging.', 'Judging System'),
  F('highest-average', 'Highest average wins.', 'The highest average determines the winners.', 'Judging System'),
  ], notes='This is the 4th (2025) contest, the latest call for entries published as a PDF. Fee amounts are on separate lines: "DEADLINE: $350" and "LATE DEADLINE: $400" follow the quoted performer heading. The Primetime age line differs between the academies: NATAS says infancy to 15 (16+ animation to Primetime); the Television Academy says children\'s animation under 13 goes to CAFE (b25-N23).'))

# ---------------------------------------------------------------- 5. SAG-AFTRA
S.append(dict(id='b25-N13', title='AMPTP: 2014 SAG-AFTRA Codified Basic Agreement', dl='sag-aftra-2014-codified-basic-agreement-pdf', facts=[
  F('fitting-heading', 'Schedule A §16.A governs a day performer\'s fittings.', 'Time spent by a day performer in fitting shall be paid for as follows:', 'Schedule A §16.A, p.254'),
  F('fitting-same-day', 'Same-day fittings are work time.', 'Time spent in such fittings shall be work time and part of the performer\'s continuous day.', 'Schedule A §16.A(1)(a)'),
  F('fitting-voucher', 'A signed voucher at every fitting.', 'There shall be a voucher provided at all wardrobe fittings to be signed by the performer indicating time in and time out.', 'Schedule A §16.A(1)(b)'),
  F('fitting-prior-day', 'Prior-day fitting: one hour minimum per call, then 15-minute units.', 'When a day performer is fitted on a day prior to the day on which he works, he shall be entitled to one (1) hour minimum pay for each call. Additional time shall be paid for in fifteen (15) minute units.', 'Schedule A §16.A(2), p.255'),
  F('fitting-threshold-2014', 'In the 2014 text: no prior-day fitting pay over $1,000 a day, over $1,200 for contracts from July 1, 2015. Later agreements changed this (b25-N16, b25-N17, b25-N12).', 'Day performers receiving over $1,000 per day (over $1,200 per day with respect to contracts entered into on or after July 1, 2015) shall not be entitled to any compensation for such fittings.', 'Schedule A §16.A(2)'),
  F('fitted-not-used', 'Fitted and not used: one day\'s pay.', 'If the day performer is fitted and not used in the picture for which he was fitted, he shall be entitled to one (1) day\'s pay; such performer shall not be entitled to any further compensation.', 'Schedule A §16.A(3)'),
  F('weekly-free-fitting', 'Weekly (Schedule B): four free fitting hours on two days per week worked; excess at contract rate.', 'The Producer shall be entitled to not more than four (4) hours free fitting time on two (2) days for each week worked in the picture.', 'Schedule B §20.A(2), p.317'),
  F('weekly-excess', 'Excess at contract salary rate, one-hour minimum call, 15-minute units.', 'Excess time shall be paid for at the salary rate specified in the performer\'s contract and shall be computed as follows: Initial call shall be for a minimum of one (1) hour; time over one (1) hour on such call shall be computed in fifteen minute (15) units.', 'Schedule B §20.A(2)'),
  F('weekly-fitting-not-consecutive', 'Pre-start fittings do not start consecutive employment.', 'Fittings, after employment but before the starting date of such employment, shall not start the consecutive days of employment of a freelance performer.', 'Schedule B §20.B'),
  F('per-diem', 'Overnight-location meal per diem (2014): $12 / $18 / $30 = $60.', 'All performers shall be entitled to a basic per diem allowance for meals on overnight locations, which shall be as follows:', 'General Provisions §35.B(2), p.105'),
  F('per-diem-amounts', '2014 amounts.', 'Breakfast $12.00 Lunch 18.00 Dinner 30.00 TOTAL: $60.00', 'General Provisions §35.B(2)'),
  F('per-diem-minimums', 'Per diems are minimums, individually bargainable.', 'The foregoing per diems are minimums only and are subject to individual bargaining at not less than the indicated per diem rate.', 'General Provisions §35.B(2)'),
  F('per-diem-deduct', 'Furnished meals may be deducted.', 'The Producer shall have the right to deduct from the per diem the appropriate amount for each such meal furnished.', 'General Provisions §35.B(2), p.106'),
  F('per-diem-timing', 'Per diem checks before each workday (day) or workweek (weekly).', 'The Producer shall issue per diem checks to day performers before the start of each workday and to weekly performers before the start of each workweek.', 'General Provisions §35.B(2)'),
  F('la-zone', 'LA studio zone: 30-mile radius from Beverly and La Cienega.', 'the “studio zone” shall include all territory within the radius of thirty (30) miles from the intersection of Beverly Boulevard and La Cienega Boulevard, Los Angeles, California', 'Schedule A §32.F(1), p.270'),
  F('ny-zone', 'NY studio zone: 30 miles from Columbus Circle.', 'The New York "studio zone" shall encompass any location within a thirty (30) mile radius of Columbus Circle other than Sandy Hook, New Jersey.', 'Schedule A §32.F(2)'),
  F('mileage', 'Reporting in the LA zone away from the studio: $.30 per mile, studio to reporting place and back, none within 10 miles of a designated point.', 'Performers shall be paid $.30 per mile mileage allowance figured from the studio to the place of reporting and back, except that no mileage allowance is required if the performer is required to report for work at a site within a ten (10) mile radius of a point designated by the Producer.', 'Schedule A §32.F(3)(a), p.271'),
  F('mileage-iatse', 'The rate follows any better IATSE mileage rate.', 'negotiates with Producer a more favorable mileage allowance than the foregoing thirty cents ($.30) per mile allowance, then, in such event, from such date forward, the Union will be entitled to the benefit of such increase.', 'Schedule A §32.F(3)(c)'),
  F('parking', 'Parking paid when reporting in the zone away from a studio.', 'When a performer is required to report for work in the studio zone other than at a studio, Producer shall pay for parking in a supervised public parking lot.', 'Schedule A §32.F(4)'),
  F('location', 'Location: outside the studio zone.', 'Location shall mean any place of work not at the Producer\'s studio which is outside the studio zone.', 'Schedule A §32.G, p.272'),
  F('overnight-location', 'Overnight location: lodged or offered lodging, or takes overnight to reach.', 'Overnight location shall be any location where the performer is lodged or offered lodging by the Producer at or near the location for one (1) or more nights, or any location which takes overnight to reach by ordinary means of transportation.', 'Schedule A §32.G'),
  F('reporting', 'Report only at studio or within the zone.', 'Except when already at an overnight location, performers shall be required to report only at the Producer\'s studio or within the studio zone', 'Schedule A §32.J'),
  F('travel-is-work', 'Travel at the producer\'s request between reporting place and location is travel time and work time.', 'all time spent by any performer in traveling at the request of the Producer between any place at which he is required to and does report and any location, both to and from, shall be travel time and, as such, shall be', 'Schedule A §32.K (continues on p.273: "work time, subject to all deductions, limitations and exceptions")'),
  F('travel-day-no-work', 'Travel on a day without work pays a day.', 'If a day performer is transported to location and such traveling is commenced on any day on which he does not render services, he shall be compensated at a day\'s pay.', 'Schedule A §32.A'),
  ], notes='This is the codified 2014 text; it is amended by the 2017, 2020, 2023 and 2026 memoranda (read below). The hourly rate behind "one (1) hour minimum pay" is not defined in §16.A(2) itself.'))

S.append(dict(id='b25-N15', title='AMPTP: 2017 SAG-AFTRA CBA and TVA Memorandum of Agreement', dl='sag-aftra-2017-cba-tva-moa-pdf', facts=[
  F('tva-56-replaced', 'The 2017 MOA replaced Television Agreement §56 (travel) with new text.', 'Replace Section 56 (“Air Transportation and Mileage Allowance”) in the 2014 Television Agreement with the following new Section 56', 'Item 7, p.10'),
  F('tva-mileage', 'TV Agreement LA zone mileage stays $.30 per mile.', 'Performers shall be paid $.30 per mile mileage allowance figured from the studio to the place of reporting and back', 'new TVA §56(b)(1)a), p.11'),
  F('secondary-zone', 'LA secondary studio zone: mileage plus $4.50 a day.', 'In addition, the Producer shall pay a $4.50 per day allowance (no fringe) to each performer asked to report within the Los Angeles secondary studio zone.', 'new TVA §56(b)(2)b), p.12'),
  ], notes='Read for mileage only.'))

S.append(dict(id='b25-N16', title='AMPTP: 2020 SAG-AFTRA CBA and TVA Memorandum of Agreement', dl='sag-aftra-2020-cba-tva-moa-pdf', facts=[
  F('fitting-threshold-2020', 'Fitting money break raised: $1,200, or $1,400 for contracts from July 1, 2020.', 'Day performers receiving over $1,200 per day (over $1,400 per day with respect to contracts entered into on or after July 1, 2020) shall not be entitled to any compensation for such fittings.', 'Item 4, Money Break for Fittings'),
  F('allowances-frozen', 'Allowances frozen.', 'Freeze all allowances and adjustments in the SAG-AFTRA Codified Basic', 'Item 2.c'),
  ], notes=''))

S.append(dict(id='b25-N17', title='AMPTP: 2023 SAG-AFTRA CBA and TVA Memorandum of Agreement (the 2023 TV/Theatrical agreement)', dl='sag-aftra-2023-cba-tva-moa-pdf', facts=[
  F('allowances-frozen', 'Allowances frozen except relocation (Item 7) and wardrobe (Item 22).', 'Freeze all allowances and adjustments in the SAG-AFTRA Codified Basic Agreement and Television Agreement (except as provided in Item 7 regarding the relocation allowance and Item 22 regarding the wardrobe allowance).', 'Item 2.e, p.3'),
  F('fitting-item', 'Item 20.b amends Schedule A §16.A(2).', 'Fittings (Union Proposal No. 19.B.)', 'Item 20.b, p.51 (PDF page 52)'),
  F('fitting-threshold-2023', 'The redline (struck text merges into the extracted text). The page image shows $1,200, $1,400 and "July 1, 2020" struck and $1,400, $1,500 and "[the first Sunday after the AMPTP\'s receipt of notice of ratification]" inserted: no prior-day fitting pay over $1,400 a day, or over $1,500 for contracts from that Sunday.', 'receiving over $1,200 $ 1 .400 per day (over $1,400 $1,500 per day with respect to', 'Item 20.b, p.51 (PDF page 52); see render/moa2023-p52-052.png'),
  F('per-diem-item', 'Per diem raised in CBA §35.B(2) and TVA §65(b).', 'Increase the per diem amounts in Section 35.B.(2) of the General Provision of the Codified Basic Agreement and Section 65(b) of the Television Agreement to the following amounts:', 'Item 21, p.52'),
  F('per-diem-breakfast', 'Breakfast: $12 current, $14 from the first Sunday after ratification notice, $16 from the first Sunday two years after (column headers read from the page image).', 'Breakfast $12.00 $14.00 $16.00', 'Item 21 table'),
  F('per-diem-lunch', 'Lunch: $18, $21, $22.', 'Lunch $18.00 $21.00 $22.00', 'Item 21 table'),
  F('per-diem-dinner', 'Dinner: $30, $35, $37 (totals $60, $70, $75).', 'Dinner $30.00 $35.00 $37.00', 'Item 21 table'),
  F('wardrobe-cleaning', 'Principal formal-wear cleaning allowance $27.', 'Increase the wardrobe cleaning allowance for principal performers to $27.00 for formal wear.', 'Item 22.a'),
  ], notes='The ratification Sunday is not stated in this MOA; the 2026 MOA\'s struck text reads "December 10, 2023" in that place (b25-N12). Travel time and mileage are not changed by this MOA (allowances frozen).'))

S.append(dict(id='b25-N12', title='AMPTP: 2026 SAG-AFTRA Memorandum of Agreement (fully executed May 27, 2026)', dl='sag-aftra-2026-moa-pdf', facts=[
  F('allowances-stet', 'Allowances kept unless the MOA says otherwise.', 'Stet all allowances and adjustments in the SAG-AFTRA Codified Basic Agreement and Television Agreement (except as otherwise provided in this Memorandum of Agreement).', 'Item 2.c'),
  F('fitting-threshold-2026', 'Redline (page image shows "over $1,400", "over $1,500.00" and "December 10, 2023" struck; "$1,500.00 or more", "$1,700.00 or more" and the bracketed date inserted): no prior-day fitting pay at $1,500 or more a day, or $1,700 or more for contracts from July 1, 2026 or the first Sunday after ratification notice, whichever is later.', 'Day performers receiving over $1,400$1,500.00 or more per day (over $1,500.00$1,700.00 or more per day with respect to contracts entered into on or after December 10, 2023 [insert date that is July 1, 2026 or the first Sunday after', 'Item 16.a, p.20; see render/moa2026-020.png'),
  F('fitting-threshold-2026-end', 'The sentence ends on p.21.', 'the business day on which the AMPTP receives notice of ratification, whichever is later]) shall not be entitled to any compensation for such fittings."', 'Item 16.a, p.21; see render/moa2026-021.png'),
  F('fitting-one-hour', 'Prior-day fitting still one hour minimum per call.', 'the day performer shall be entitled to one (1) hour minimum pay for each call. Additional time shall be paid for in fifteen (15) minute units.', 'Item 16.a, p.20'),
  F('per-diem-2028', 'Principal per diem up $5 from July 1, 2028 ($1/$2/$2).', 'by $5.00 effective July 1, 2028 (which shall consist of an additional $1.00 for breakfast, $2.00 for lunch and $2.00 for dinner).', 'Item 29.a, p.35'),
  F('contact-lens', 'Lens measurement time is treated like wardrobe fitting time.', 'Time spent obtaining the lens measurements shall be treated in the same manner as time spent in a wardrobe fitting.', 'Item 17.a'),
  ], notes='The principal per diem amount in force before July 1, 2028 is not restated in this MOA; by the 2023 MOA it is $75 ($16/$22/$37) after its second step, and this MOA adds $5 from July 1, 2028 (that sum is arithmetic, not a quoted figure). The background per diem table in Item 29.b gives $16/$22/$37 = $75, then $17/$24/$39 = $80 from July 1, 2028.'))

S.append(dict(id='b25-N01', title='AMPTP: 2026-30 SAG-AFTRA Agreement Wage Tables (v.4, May 27, 2026)', dl='sag-aftra-2026-30-rates-pdf', facts=[
  F('day-performer', 'Theatrical day performer minimum: $1,246 (7/1/25-6/30/26), $1,283 (from 7/1/26), $1,321, $1,361, $1,402.', 'A 299 Performer $1,246 $1,283 $1,321 $1,361 $1,402', 'CBA minimums, Day Performers'),
  ], notes='Read only for the day rate, to compare with the fitting thresholds. No per diem, mileage or fitting figures in this document.'))

S.append(dict(id='b27-G1-18', title='AMPTP: Contracts page', dl='amptp-contracts-page', facts=[
  F('tv-animation-wages', 'The page lists the 2023-26 TV and BC Animation wage scales.', 'Wage Scales – 2023-26 TV and BC Animation Agreements', 'SAG-AFTRA list'),
  F('tv-animation-latest-moa', 'Latest TV Animation document listed: the 2023 MOA (no 2026 TV Animation MOA listed).', '2023 TV Animation Agreement MOA', 'SAG-AFTRA list'),
  ], notes='Reached via the AMPTP home page (b27-G1-17, read for its link only).'))
S.append(dict(id='b27-G1-17', title='AMPTP: home page', dl='amptp-home-page', facts=[], notes='Read only for the link to the contracts page.'))

S.append(dict(id='b27-G1-19', title='AMPTP: 2023-26 Producer-SAG-AFTRA TV Animation Agreement Wage Rates (printed 2/20/2024)', dl='sag-aftra-2023-26-tv-bc-animation-wage-scales-pdf', facts=[
  F('over-10-min', 'TV animation minimum per film or segment over 10 minutes: $1,082 / $1,158 / $1,204 / $1,246 for the years from 7/1/22, 7/1/23, 7/1/24, 7/1/25 (to 6/30/26).', 'I.A.1. Minimum Compensation per film or segment of film more than 10 minutes in length $1,082 $1,158 $1,204 $1,246', 'p.1, SAG-AFTRA Television Animation Series'),
  F('10-min-or-less', 'Per film or segment of 10 minutes or less: $981 / $1,050 / $1,092 / $1,130.', 'I.B.1. Minimum Compensation per film or segment of film 10 minutes or less in length $981 $1,050 $1,092 $1,130', 'p.1'),
  F('fourth-voice', 'Each voice after the third (10 minutes or less): $317 / $339 / $353 / $365.', 'II.A.1. For each voice after the third for performers employed on films or segments of films 10 minutes or less in length $317 $339 $353 $365', 'p.1'),
  F('legacy-aftra', 'Legacy AFTRA series over 10 minutes: $1,120 / $1,198 / $1,246 / $1,290.', 'I.A.2. Minimum Compensation per film or segment of film more than 10 minutes in length $1,120 $1,198 $1,246 $1,290', 'p.1, Legacy AFTRA Television Animation Series'),
  ], notes='The rates run to 6/30/26; no 2026-onward TV Animation rates were found on the AMPTP page. What the minimum covers (session length, voices per session for films over 10 minutes) is not stated in this wage sheet; it is in the 2014 TV Animation Agreement, not fetched.'))

# ---------------------------------------------------------------- 6. LORT
S.append(dict(id='work-S36', title='Actors\' Equity: LORT Negotiations 2023, Summary of Changes (docs/research/career-2026-10-20/work.md S36)', dl='aea-lort-2023-summary-of-changes-pdf', facts=[
  F('term', 'Agreement February 13, 2023 to June 27, 2027.', 'Agree to 4.5-year agreement, from February 13, 2023 – June 27, 2027.', 'I'),
  F('min-d', 'LORT D actor minimum: $776, $807, $839, $889 (as of 2.13.23, 7.1.24, 6.30.25, 6.29.26).', 'D $776 $807 $839 $889', 'II.A, Rule 55(B)'),
  F('min-c', 'LORT C: $972, $1011, $1051, $1114.', 'C $972 $1011 $1051 $1114', 'II.A, Rule 55(B)'),
  F('min-a-plus', 'LORT A+: $1867, $1942, $2020, $2117 (12.29.25), $2244 (6.29.26).', 'A+ $1867 $1942 $2020 $2117 $2244', 'II.A, Rule 55(B)'),
  ], notes='No per diem amounts in the summary.'))

S.append(dict(id='b27-G1-20', title='LORT: 2023-27 LORT-AEA Collective Bargaining Agreement (lort.org)', dl='lort-aea-2023-27-cba-pdf', facts=[
  F('per-diem', 'Per diem $50.00, February 13, 2023 to June 27, 2027.', 'Per Diem. Effective February 13, 2023, through June 27, 2027, the per diem shall be $50.00.', 'Rule 55(L)(3), p.90'),
  F('per-diem-exception', 'Not owed if all meals are provided or the local tour is an evening call only.', 'However, if all meals are provided, or if the local tour is for an evening rehearsal or performance only, for which the Actor or Stage Manager is not called by the Theatre until 6:00 PM, this provision does not apply.', 'Rule 55(L)(4)'),
  F('per-diem-when', 'Owed on local or overnight tour days returning after 6 PM.', 'When an Actor or Stage Manager performs or rehearses on a local tour or overnight tour and does not return to the home Theatre until after 6:00 PM, that Actor or Stage Manager shall be entitled to the per diem specified in (L)(3) above.', 'Rule 55(L)(4)'),
  F('overnight-tour', 'Overnight tours: touring minimum plus per diem.', 'Each member of the company giving four or fewer performances away from the Resident Theatre on overnight tours shall receive no less than the sum specified in section (L)(1) above plus per diem.', 'Rule 55(L)(2)(a), p.89'),
  F('rehearsing-away', 'Rehearsing away from the theatre\'s city: housing and per diem for that period.', 'When an Actor or Stage Manager is required to rehearse away from the city or greater metropolitan area in which the contracting Theatre is located, for such rehearsal period only, the Actor or Stage Manager shall (i) be provided housing, in accordance with Rule 30, and be paid per diem, in accordance with Rule 55(L)(3);', 'Rule 51(G)'),
  F('second-city-16-weeks', 'A transfer for 16+ weeks needs no per diem.', 'In the transfer of a company from its home city to a second city for a fixed engagement of 16 or more weeks, there shall be no per diem required.', 'Rule 55(U), p.92'),
  F('housing', 'Housing (with taxes and utilities) at no cost to the actor.', 'Housing, including room taxes and utilities, shall be provided at no cost to the Actor or Stage Manager.', 'Rule 30(A), p.31'),
  F('local-releases-housing', 'An actor who says in writing they are local releases the theatre from housing.', 'Should the Actor or Stage Manager inform the Theatre in writing that the Actor or Stage Manager is or will be local to the Theatre’s city or greater metropolitan area on or before the first day of employment, the Theatre shall be relieved of any further obligation to the Actor or Stage Manager with respect to housing accommodations.', 'Rule 30(G)(10), p.33'),
  F('rehearsal-pay', 'Full contractual salary from the first call, rehearsal or performance; no separate rehearsal rate.', 'Full contractual salary shall be paid commencing with the date the Actor or Stage Manager is called upon to report to the theatre or for rehearsal or performance.', 'Rule 55(A)(1), p.86'),
  F('first-week-prorate', 'A rehearsal-only first week may be prorated in sixths.', 'However, when the Actor or Stage Manager is involved solely in rehearsal in their first week of employment, salary may be pro-rated in sixths and the Actor or Stage Manager shall be so advised by rider.', 'Rule 55(A)(2)'),
  F('min-d', 'LORT D: $776, $807, $839, $889 (as of 2/13/23, 7/1/24, 6/30/25, 6/29/26).', '“D” $776 $807 $839 $889', 'Rule 55(B), p.87'),
  F('min-a-plus', 'A+ in this text: $2141 as of 6/29/26 and $2244 as of 12/27/2026 (the summary gives $2117 as of 12.29.25 and $2244 as of 6.29.26).', '“A+” $1867 $1942 $2020 $2141 $2244', 'Rule 55(B), p.87'),
  ], notes='No "out-of-town per diem" for an actor engaged from outside the theatre\'s area is stated: Rule 30 gives such an actor housing at no cost; the $50 per diem attaches to tours (55(L)) and rehearsals away from the theatre\'s city (51(G)). No rehearsal salary distinct from the performance salary is stated.'))

# ---------------------------------------------------------------- 7. Emmys
S.append(dict(id='b25-N23', title='Television Academy: 78th Emmy Awards Rules and Procedures, Version 4 (04.07.26)', dl='emmy-78th-rules-pdf-copy',
  url='https://www.televisionacademy.com/rules', file_note='copied from scratchpad/dl-emmy (fetched earlier in this session by brief 27\'s F; the register\'s b25-S45 URL serves the same 1,841,317-byte PDF)', facts=[
  F('arbiter', 'The Emmy Awards Committee is the final arbiter of eligibility.', 'The Emmy Awards Committee, on behalf of the Board of Governors, is the final arbiter of any, and all Emmy Awards eligibility matters', 'Introduction, p.1'),
  F('placement-not-assured', 'Entering a category does not assure placement.', 'Entry in a category or posting a For Your Consideration video assigned to a category does not assure placement in that category.', 'Introduction'),
  F('placement-not-final', 'Placement final 72 hours before nominating ballots.', 'Category placement will not be finalized until 72 hours prior to the posting of the nominating ballots.', 'Introduction'),
  F('who-enters', 'Producers enter programs; individuals may enter themselves.', 'Producers may enter their programs for nominations in all categories. Individuals may enter themselves (and their team if the entry is for a team achievement) for specific individual awards.', 'Entry Procedures 4'),
  F('multiple-general', 'In most categories, several entries if for different programs.', 'In most categories/areas an eligible individual or the identical team may enter multiple achievements per category or area if the achievements are for different programs.', 'Entry Procedures 5'),
  F('one-bid', 'One achievement, one category; the Awards Committee approves placement.', 'every entrant is eligible to place their achievement in only one appropriate category. Final approval of category placement is determined by the Awards Committee.', 'Entry Procedures 6'),
  F('entrant-chooses', 'The entrant decides lead, supporting or guest; guest only under 50% of episodes.', 'It is the decision of the entrant whether to enter as a lead, supporting or guest performer, however, only performers appearing in less than 50% of the eligible episodes can submit in the Guest Performer categories', 'Performer Awards, Entry Information, p.47 (PDF p.51)'),
  F('follow-show', 'Performers follow the show\'s category (comedy/drama).', 'All performers must enter categories that follow the categorization of their shows', 'Performer Awards, Entry Information'),
  F('same-character', 'Same character on several programs: one category.', 'A performer who plays the same character in more than one series/program may only enter in one category in the current eligibility year.', 'Performer Awards, Entry Information'),
  F('multiple-performing', 'Confirmed section: several entries in a performing category if for different programs and characters.', 'Lead, supporting, and guest performers may enter multiple achievements in a performing category if the achievements are for different programs (provided the performer is playing a different character).', 'Performer Awards, Entry Information, p.47 (PDF p.51)'),
  F('guest-after-principal', 'Nominated as lead/supporting: no guest for that role later.', 'If a performer has been nominated or has won in a Lead or Supporting Performer category, the performer will not be eligible to submit in a Guest Performer category in a subsequent Emmy year for playing the same role in the same series.', 'Performer Awards, Guest Performer Eligibility'),
  F('voice-not-acting', 'Voice-over performers and narrators may not enter lead, supporting or guest.', 'Voice-over performers and narrators may not enter in lead, support or guest performer categories.', 'Performer Awards, p.48'),
  F('vo-category', 'Category 75: Outstanding Character Voice-Over Performance.', 'Category 75 OUTSTANDING CHARACTER VOICE-OVER PERFORMANCE', 'Category 75, p.49 (PDF p.53)'),
  F('vo-scope', 'Continuing or single performance in a series or special.', 'For a continuing or single voice-over performance in a series or a special', 'Category 75'),
  F('vo-animation-age', 'Animated programs for audiences 13 and above.', 'Animation Character Voice-Over eligibility is for programming that targets an audience age 13 and above.', 'Category 75'),
  F('vo-childrens-to-cafe', 'Children\'s animation (under 13) only in the Children\'s & Family Emmys.', 'Children’s animated programs, which target an audience under the age of 13 will only be eligible in the Children’s & Family Emmys.', 'Category 75 (also Animation Awards)'),
  F('vo-any-visual', 'Any character voice-over, however the visual is produced.', 'Eligibility in this category includes any voice-over performance where a character is portrayed no matter how the visual is produced.', 'Category 75'),
  F('vo-multiple-characters', 'Several characters in an episode: each a separate entry.', 'Performers who voice multiple characters within an episode or special can submit all characters, provided that each character is submitted as a separate entry.', 'Category 75'),
  F('vo-ai', 'AI-manipulated voices must submit the original recording.', 'Any production that has manipulated the voice of the performer with AI must also submit the original recording for the submission to be vetted for eligibility.', 'Category 75'),
  F('vo-video', 'Submission video at most 2.5 minutes.', 'For all submissions, the video must be no more than 2½ minutes.', 'Category 75, Editing Instructions'),
  F('vo-single-episode', 'From a single episode or special.', 'All entries must upload an edited video file of the entrant’s voice-over appearances from a single episode of a series or a special', 'Category 75, Upload Instructions'),
  F('category-award', 'A "Category" is head-to-head voting, highest vote-getter wins (Category 75 is a Category, not a Juried award).', 'The definition of a category award is a single, must-give award that is the result of head-to-head competition with the highest vote-getter receiving an Emmy.', 'Awards Definitions 1'),
  F('vo-voters-animation', 'The Animation peer group votes Character Voice-Over through its directors, executive producers, producers and voice-over performers.', '*(directors, executive producers, producers, and voice-over performers from the animation peer group)', 'Appendix II'),
  F('narrator-as-character', 'Narration performed as a character goes to Character Voice-Over.', 'If the narration is performed as a character rather than a narrator, even if credited as the narrator, the performer must submit in the character voice-over category.', 'Category 76'),
  F('animated-individuals', 'Animated programs over 20 minutes: individuals eligible in a list of categories that includes "Character Voice-Over" (short form animation\'s list includes it too).', 'Individuals who work on animated programs (over 20 minutes) are also eligible in the following individual achievement categories:', 'Animated Program'),
  F('short-form-animated-individuals', 'Short-form animated programs (2-20 minutes) have their own list of individual categories, which includes Character Voice-Over.', 'Short Form Animated programs (between 2-20 minutes) are also eligible in the following individual achievement categories:', 'Animated Program'),
  F('vo-voters-performers', 'The Performers peer group\'s additional ballots include Character Voice-Over Performance (column layout read row by row).', 'Performers Performer Character Voice-Over Performance Narrator Host', 'Appendix II'),
  F('no-other-competition', 'A program in this competition cannot have entered another national Emmy competition.', 'A program (along with its individual achievements) entering in this year’s competition cannot have been submitted into any other national Emmy competition (Daytime, Children’s & Family, News & Documentary, Sports or International).', 'Criteria for Eligibility 4'),
  F('moving-competitions', 'Moving to another category or competition needs an Industry Panel appeal.', 'A program that has entered in one category one year must appeal to move it to another category or Emmy competition (Daytime, Children’s & Family, International, News & Documentary, and Sports) in any subsequent year, with the approval of the Industry Panel.', 'Criteria for Eligibility 3b'),
  F('children-game-shows', 'Children-only game and reality competition shows go to CAFE.', 'Game shows and Reality Competition programs with solely children as contestants must enter in the Children’s & Family Emmy Awards.', 'Reality categories'),
  ], notes='Appendix II also lists "Character Voice-Over Performance" on the Performers peer group\'s additional ballots (column layout; see the Performers row). The Television Academy\'s age line (under 13 to CAFE) differs from NATAS\'s (infancy to 15, b27-G1-15).'))

# ---------------------------------------------------------------- 8. UK
S.append(dict(id='b25-S18', title='Pact: Pact Equity TV Agreement Rates (2024 to 2026 rate card)', dl='pact-equity-tv-rates-2024-26-pdf', facts=[
  F('columns', 'Columns: Current, 2024, 2025, 2026.', 'Service Current 2024 2025 2026', 'header'),
  F('engagement-fee', 'UK Television Engagement fee: £557.00, £596.00, £617.00, £635.50 (2026).', 'UK Television Engagement fee £557.00 £596.00 £617.00 £635.50', 'row 1'),
  F('production-day', 'Production day: £61.50, £66.00, £68.00, £70.00.', 'Production day £61.50 £66.00 £68.00 £70.00', 'row 2'),
  F('regional', 'Regional Engagement Fee: £158.50 in 2026.', 'Regional Engagement Fee £139.00 £148.50 £154.00 £158.50', 'row'),
  F('one-day-4a', 'One Day Engagement T(8)4a: £309.50 in 2026.', 'One Day Engagement T(8)4a £271.50 £290.50 £300.50 £309.50', 'row'),
  F('one-day-4b', 'One Day Engagement T(8)4b: £402.00 in 2026.', 'One Day Engagement T(8)4b £352.50 £377.00 £390.50 £402.00', 'row'),
  F('multi-episodic', 'Multi-episodic Cat B: £178.00 in 2026.', 'Multi-episodic Cat B £156.00 £167.00 £173.00 £178.00', 'row'),
  F('rehearsal-day', 'Rehearsal period day T(14): £132.50 in 2026.', 'Rehearsal period day T (14) £116.00 £124.00 £128.50 £132.50', 'row'),
  F('travel', 'Travel T(44)2: £25.50 in 2026.', 'Travel T(44)2 £22.50 £24.00 £25.00 £25.50', 'row'),
  F('svod', 'Appendix TL SVOD Engagement Fee: £848.00 in 2026.', 'Appendix TL SVOD Engagement Fee £743.50 £795.50 £823.50 £848.00', 'row'),
  ], notes='Not stated on the rate card: whether the engagement fee is per episode, per programme or per day, and what it covers (days included, uses, repeats). The rate card gives labels and clause references only (e.g. T(8)4a); the agreement that defines them, "Pact Equity TV Agreement (2021)", is Member Only Content on Pact (b25-S17) and was not attempted. The date each column takes effect is not stated.'))

S.append(dict(id='b25-S17', title='Pact: Contracting On-Screen Talent (resource hub)', dl='pact-contracting-on-screen-talent-page', facts=[
  F('agreement-members-only', 'The 2021 TV Agreement itself is members-only.', 'This agreement provides the minimum terms and conditions for all artists (excluding instrumental musicians, crowd artistes and walk-on/background artists performing only in those capacities)...', 'listing, Pact Equity TV Agreement (2021)'),
  F('rate-card-listed', 'The rate card is listed.', 'Pact Equity TV Agreement rates 2024 - 2026.', 'listing'),
  F('rate-card-date', 'The listing above the rate card shows the date 31 Oct 2023.', '31 Oct 2023', 'listing'),
  ], notes='Both listings carry "Member Only Content"; neither document was requested from a members area.'))

S.append(dict(id='b25-S19', title='Equity (UK): Rates and agreements', dl='equity-uk-rates-and-agreements-page', facts=[
  F('agreements-cover', 'Equity agreements set minimum weekly and daily rates plus holiday, hours, living-away and meal allowances.', 'As well as minimum weekly and daily rates of pay, they lay out terms and working conditions such as holiday, hours, living away allowance, and daily meal allowances.', 'body'),
  ], notes='The TV rates sit behind a script-driven selector; no TV agreement text or link is in the page.'))


def main():
    out = {'written': 'by the brief 27 research agent (G1), 2026-10-25; each quote is from the file under dl/ named by "download"', 'sources': []}
    for s in S:
        d = os.path.join(OUT, 'dl', s['dl'])
        meta = json.load(open(os.path.join(d, 'fetch.json'))) if os.path.exists(os.path.join(d, 'fetch.json')) else {}
        doc = 'document.pdf' if os.path.exists(os.path.join(d, 'document.pdf')) else 'page.html'
        text = 'document.txt' if doc == 'document.pdf' else 'page.txt'
        rec = {'id': s['id'], 'title': s['title'], 'url': s.get('url') or meta.get('url'),
               'retrieved': meta.get('retrieved'), 'http': meta.get('http'), 'bytes': meta.get('bytes'),
               'download': f"dl/{s['dl']}/{doc}", 'text': f"dl/{s['dl']}/{text}", 'facts': s['facts'], 'notes': s['notes']}
        if meta.get('sha256'):
            rec['sha256'] = meta['sha256']
        if s.get('attempts'):
            rec['attempts'] = s['attempts']
        if s.get('file_note'):
            rec['downloadNote'] = s['file_note']
        out['sources'].append(rec)
    json.dump(out, open(os.path.join(OUT, 'facts.json'), 'w'), ensure_ascii=False, indent=1)
    print(len(out['sources']), 'sources,', sum(len(s['facts']) for s in out['sources']), 'facts')


if __name__ == '__main__':
    main()
