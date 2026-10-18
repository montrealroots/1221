# The Tutorial’s Routes On The Built App

Written by `tools/tutorial-routes.mjs` from 760 screens of 14 saves: the text walk of this area's build at 1440 and 390 wide, and its capture (the guide's and the help's own pages set aside).

| Status | Labels | Distinct |
|---|---|---|
| nowhere | 14 | 14 |
| in the code only | 266 | 202 |
| on a screen | 1146 | 621 |
| on its screen | 167 | 82 |

## Nowhere

| Label | Where It’s Said | Part | Written In |
|---|---|---|---|
| A Connecticut Claim | entry papers.benefits | steps | — |
| Affairs On Home | entry papers.overview | where | — |
| Breadcrumbs | entry start.find | where | — |
| Browser’s Address | entry start.find | where | — |
| Dialog When The Clock Stops | entry day.calendar | where | — |
| How This Works on every panel | entry start.guide | where | — |
| Menu Down The Left | entry start.find | where | — |
| Piece Of Work Set | entry coursework.prepare | where | — |
| State’s Plan | entry taxes.plan | where | — |
| Table Work On A Scene | entry coursework.table | where | — |
| Therapy with Yale Mental Health & Counseling: 2 of 8 sessions | entry papers.conditions | steps | — |
| Work It Through Under A Scene | entry coursework.workbook | where | — |
| Year A Lien Secures | entry taxes.lien | where | — |
| Year’s Return | entry taxes.return | where | — |

## In the code only

| Label | Where It’s Said | Part | Written In |
|---|---|---|---|
| A Loan For The Overrun | entry bank.borrowing | steps | `src/engine/systems/lending.ts` |
| A Money Transfer To Your Account | entry bank.card-offers | steps | `src/ui/bank/BankCardOffers.tsx` |
| A Recording Of The Other Lines | entry craft.brief-reader | steps | `src/ui/components/BriefPane.tsx` |
| A UK | chapter papers | words | `src/engine/systems/papervisits.ts` |
| A Year Of Interest | entry money.affairs | steps | `src/ui/looks/money.tsx` |
| Adna Linden Psychotherapy | entry papers.conditions | steps | `src/engine/systems/therapy.ts` |
| Allowance | chapter papers | words | `src/engine/content/banks-thirteen.ts` |
| Appeal It | chapter papers, entry papers.health-cover | words, steps | `src/ui/workspaces/PapersWorkspace.tsx` |
| Appeal To The Dean | entry school.leave | steps | `src/ui/components/StudyPlanPanels.tsx` |
| Apply And Move The Balance | entry bank.card-offers | steps | `src/ui/bank/BankCard.tsx` |
| Apply At The Social Security Office | entry documents.work | steps | `src/ui/papers/Documents.tsx` |
| Apply For Assistance | chapter papers, entry papers.health-cover | names, words, steps | `src/ui/workspaces/PapersWorkspace.tsx` |
| Apply For HUSKY D | chapter papers | words | `src/ui/workspaces/PapersWorkspace.tsx` |
| Arrange It | entry bank.borrowing | steps | `src/engine/systems/lending.ts` |
| Ask For A Month More | entry school.repeat | steps | `src/ui/workspaces/SchoolWorkspace.tsx` |
| Ask For An Additional Term | entry school.repeat | steps | `src/ui/components/StudyPlanPanels.tsx` |
| Ask For An Aid Review | entry school.money | steps | `src/ui/components/StudyPlanPanels.tsx` |
| Ask For Its Release As Erroneous | entry taxes.lien | steps | `src/ui/components/LienPanels.tsx` |
| Ask For Its Waiver | entry taxes.plan | steps | `src/ui/components/LienPanels.tsx` |
| Ask For Its Withdrawal | entry taxes.lien | steps | `src/ui/components/LienPanels.tsx` |
| Ask For Its Withdrawal As Filed In Error | entry taxes.lien | steps | `src/ui/components/LienPanels.tsx` |
| Ask To Repeat The Year | entry school.repeat | steps | `src/engine/systems/leave.ts` |
| Beat By Beat | entry craft.brief-prepare | steps | `src/ui/components/BriefPane.tsx` |
| Before Yale | entry bank.home-account | where, steps | `src/engine/domain/model.ts` |
| Begin A Course Of 8 | chapter papers, entry papers.conditions | words, steps | `src/ui/workspaces/PapersWorkspace.tsx` |
| Berliner Sparkasse | chapter bank | words | `src/engine/content/banks-thirteen.ts` |
| Bienestar | chapter papers | words | `src/engine/domain/model.ts` |
| Book An Appointment | chapter papers, entry papers.doctor | names, words, steps | `src/engine/systems/appointments.ts` |
| Borrow At | entry bank.borrowing | steps | `src/ui/workspaces/BankWorkspace.tsx` |
| Break It Down | chapter profile | names, words | `src/engine/content/attributes-matrix.ts` |
| Break It Early | chapter bank, entry bank.term | words, steps | `src/ui/bank/BankAccountLife.tsx` |
| Britain | chapter papers, chapter bank | words | `src/engine/content/bankdays.ts` |
| British | chapter papers | words | `src/engine/content/appointments.ts` |
| British Columbia | chapter papers, chapter documents | words | `src/engine/content/appointments.ts` |
| But This Month | entry papers.conditions | steps | `src/ui/workspaces/PapersWorkspace.tsx` |
| Buy Affiliate Cover | entry school.leave | steps | `src/engine/systems/leave.ts` |
| Buy It | entry school.leave | steps | `src/ui/components/StudyPlanPanels.tsx` |
| Call Off The Leave | entry school.leave | steps | `src/engine/systems/leave.ts` |
| Call Off The Request | entry school.repeat | steps | `src/engine/systems/leave.ts` |
| Call Off The Switch | entry bank.other-banks | steps | `src/ui/bank/BankLending.tsx` |
| Cancel | entry day.advance | steps | `src/engine/systems/banking.ts` |
| Cancel It | entry bank.upkeep, entry documents.passport-id | steps | `src/engine/systems/banking.ts` |
| Care Went Unpaid | entry papers.conditions | steps | `src/ui/workspaces/PapersWorkspace.tsx` |
| CBT | chapter papers | words | `src/engine/decided.ts` |
| Change How You Play It | entry coursework.playing, entry productions.playing, entry craft.brief-choose | steps | `src/ui/components/PlayingChooser.tsx` |
| Change The Reading | entry craft.brief-choose | steps | `src/engine/systems/briefs.ts` |
| ChexSystems | chapter bank | words | `src/engine/decided.ts` |
| Chosen at the start. | entry body.how | steps | `src/ui/workspaces/ProfileWorkspace.tsx` |
| Claim It | chapter papers, entry papers.pensions | words, steps | `src/ui/bank/BankAccountLife.tsx` |
| Claim It Back | entry bank.upkeep | steps | `src/ui/bank/BankAccountLife.tsx` |
| Comes Back To You | entry taxes.return | steps | `src/ui/workspaces/PapersWorkspace.tsx` |
| Covered California | chapter papers | words | `src/engine/content/safetynet.ts` |
| Credit Used | entry money.affairs | steps | `src/ui/looks/money.tsx` |
| Decided at the table. | entry coursework.table | steps | `src/ui/components/CourseworkPane.tsx` |
| Europe | chapter bank | words | `src/engine/content/cards.ts` |
| FBAR | chapter bank | words | `src/engine/content/homeaccounts.ts` |
| File A Claim | chapter papers | words | `src/ui/workspaces/PapersWorkspace.tsx` |
| File A Police Report | chapter papers, chapter documents, entry documents.passport-id | names, words, steps | `src/ui/papers/Documents.tsx` |
| File The Amendment | entry taxes.return | steps | `src/ui/workspaces/PapersWorkspace.tsx` |
| File Your Own In Its Place | entry taxes.return | steps | `src/ui/workspaces/PapersWorkspace.tsx` |
| Fill A Longer Supply | chapter papers, entry papers.doctor | names, words, steps | `src/ui/workspaces/PapersWorkspace.tsx` |
| Financial Hold | entry school.money | steps | `src/engine/systems/leave.ts` |
| Finishing The Degree | entry school.repeat | steps | `src/engine/systems/leave.ts` |
| Form 8938 | chapter bank | words | `src/engine/content/homeaccounts.ts` |
| Free With Yale Health | entry papers.conditions | steps | `src/engine/systems/leave.ts` |
| Fridays | chapter school | words | `src/engine/content/briefs/briefs-e.ts` |
| German | chapter bank | words | `src/engine/content/banks.ts` |
| Give 35 Days’ Notice | entry bank.term | steps | `src/ui/bank/BankAccountLife.tsx` |
| Give Notice Of Return | entry school.leave | steps | `src/ui/components/StudyPlanPanels.tsx` |
| Global Talent | entry documents.residence | steps | `src/engine/systems/citizenship.ts` |
| GST | chapter documents | words | `src/engine/content/licenses.ts` |
| Have Wages Paid Here | entry bank.payments, entry bank.other-banks | steps | `src/ui/bank/BankMoves.tsx` |
| Holding Britain | entry documents.residence | steps | `src/engine/content/bankdays.ts` |
| Home Bank | entry bank.home-account | steps | `src/ui/creation/CharacterCreation.tsx` |
| Hour By Hour | entry day.weather | steps | `src/ui/looks/weather.tsx` |
| How They Play It | entry craft.brief-reader | steps | `src/ui/components/BriefPane.tsx` |
| I Lived Where I Was Born | entry bank.home-account | steps | `src/ui/creation/CharacterCreation.tsx` |
| I’ve Read It | entry start.guide, entry papers.overview | steps | `src/ui/guide/Guide.tsx` |
| IMSS | chapter papers | words | `src/engine/content/appointments.ts` |
| IMSS Pension | entry papers.pensions | steps | `src/engine/systems/imss.ts` |
| In Britain | entry bank.other-banks | steps | `src/engine/systems/papervisits.ts` |
| In Collections | chapter bank | words | `src/engine/systems/credit.ts` |
| In The Bank And In Hand | entry money.affairs | steps | `src/ui/looks/money.tsx` |
| Incomplete | chapter school, entry school.repeat | words, steps | `src/engine/content/school.ts` |
| INE | chapter documents | words | `src/engine/content/cards.ts` |
| ING | chapter bank | words | `src/engine/content/accountlife.ts` |
| Irish | chapter papers | words | `src/engine/content/accountlife.ts` |
| Jobseeker | chapter papers | words | `src/engine/domain/model.ts` |
| KakaoBank | chapter bank | words | `src/engine/content/banks-lending.ts` |
| Keep It Up | chapter papers | words | `src/ui/workspaces/PapersWorkspace.tsx` |
| Keep The Balance There | entry bank.other-banks | steps | `src/ui/bank/BankLending.tsx` |
| KFF | chapter papers | words | `src/engine/content/safetynet.ts` |
| LAMDA | chapter school | words | `src/engine/content/concerns.ts` |
| Learn The Lines | chapter profile, entry craft.brief-prepare | names, words, steps | `src/engine/content/attributes-matrix.ts` |
| Leave The Pace Open | entry coursework.playing, entry productions.playing, entry craft.brief-choose | steps | `src/ui/components/PlayingChooser.tsx` |
| Livret A | chapter bank | words | `src/engine/content/banks-thirteen.ts` |
| Los Angeles | chapter papers | words | `src/engine/content/appointments.ts` |
| Make Amends | entry coursework.class | steps | `src/ui/components/CourseworkPane.tsx` |
| Make It The Everyday Card | chapter bank, entry bank.card | words, steps | `src/ui/bank/BankCard.tsx` |
| Make Primary | entry bank.accounts, entry bank.other-banks | steps | `src/ui/bank/BankMoves.tsx` |
| Mexican | chapter papers | words | `src/engine/content/accountlife.ts` |
| Missed To Catch Up | entry productions.part | steps | `src/ui/components/RehearsalProcess.tsx` |
| Money In Transit | chapter bank | words | `src/engine/systems/bankmoves.ts` |
| Most Worth It | chapter looking-after | words | `src/ui/shell/TimeControls.tsx` |
| Move It As Planned | entry bank.other-banks | steps | `src/ui/bank/BankLending.tsx` |
| Move It To Savings At The End | entry bank.term | steps | `src/ui/bank/BankAccountLife.tsx` |
| Multiplier | entry bank.round-ups | steps | `src/engine/content/banks-world-sheets.ts` |
| Naturalize | entry documents.residence | steps | `src/ui/papers/Documents.tsx` |
| NatWest | entry bank.term | steps | `src/engine/content/accountlife.ts` |
| NHS | chapter papers | words | `src/engine/content/appointments.ts` |
| NHS Talking Therapies’ 48.5 | chapter papers | words | `src/engine/decided.ts` |
| NICE | chapter papers | words | `src/engine/systems/health.ts` |
| On Starting Point | entry bank.home-account | steps | `src/engine/systems/homeaccount.ts` |
| On The Way | entry day.advance | steps | `src/ui/bank/BankMoves.tsx` |
| Ontario | chapter papers, chapter documents | words | `src/engine/content/appointments.ts` |
| Opt Out Of Debit Card Overdrafts | entry bank.borrowing | steps | `src/ui/bank/BankLending.tsx` |
| Out Of Medicine | entry papers.conditions | steps | `src/ui/workspaces/PapersWorkspace.tsx` |
| Overdraft Limit | entry bank.borrowing | steps | `src/ui/bank/BankLending.tsx` |
| Owed On Your Yale Account | entry school.money | steps | `src/ui/components/StudyPlanPanels.tsx` |
| Owed To A State | entry taxes.pay | where | `src/engine/systems/credit.ts` |
| Pay From There | entry bank.payments, entry bank.card, entry bank.other-banks | steps | `src/ui/bank/BankMoves.tsx` |
| Pay From Your Bank | entry school.money | steps | `src/ui/components/StudyPlanPanels.tsx` |
| Pay In | entry bank.cash | steps | `src/ui/bank/BankCash.tsx` |
| Pay It | entry bank.borrowing | steps | `src/engine/systems/health.ts` |
| Pay It In | entry bank.cash | steps | `src/ui/bank/BankCash.tsx` |
| Pay It Off | chapter papers, entry bank.borrowing, entry papers.health-cover | words, steps | `src/engine/systems/health.ts` |
| Pay It Out At The End | entry bank.term | steps | `src/ui/bank/BankAccountLife.tsx` |
| Pay Per Use | entry bank.borrowing | steps | `src/ui/bank/BankLending.tsx` |
| Pay Toward It | entry bank.borrowing | steps | `src/ui/bank/BankLending.tsx` |
| Pay What You Can | entry bank.card | steps | `src/ui/bank/BankCard.tsx` |
| Pensión | chapter papers | words | `src/engine/domain/model.ts` |
| Pensión Para El Bienestar | entry papers.pensions | steps | `src/engine/systems/homepensions.ts` |
| Post Office | chapter bank | words | `src/engine/content/cash.ts` |
| Postbank | chapter bank | words | `src/engine/content/accountlife.ts` |
| Prepay A Year | chapter papers | words | `src/ui/workspaces/PapersWorkspace.tsx` |
| Prepay Three Months | chapter papers | names, words | `src/ui/workspaces/PapersWorkspace.tsx` |
| Press Break It Down | entry craft.brief-prepare | steps | `src/engine/content/attributes-matrix.ts` |
| Press Make Up A Session | entry school.repeat | steps | `src/ui/workspaces/SchoolWorkspace.tsx` |
| Press Mark As Read | entry coursework.feedback | steps | `src/ui/components/CourseworkPane.tsx` |
| Put It Back | entry coursework.workbook, entry productions.notes | steps | `src/ui/components/WorkThrough.tsx` |
| Reactivate | entry bank.upkeep | steps | `src/engine/content/accountlife.ts` |
| Read About It | chapter welcome | words | `src/ui/guide/Guide.tsx` |
| Read Beat By Beat | entry craft.brief-tape | steps | `src/ui/components/BriefPane.tsx` |
| Read It Again | entry productions.plays | steps | `src/ui/workspaces/SchoolWorkspace.tsx` |
| Read It This Way | entry craft.brief-choose | steps | `src/ui/components/BriefPane.tsx` |
| Read With Them | entry craft.brief-reader | steps | `src/ui/components/BriefPane.tsx` |
| Rehearse It On Your Feet | chapter profile, entry craft.brief-prepare, entry craft.brief-reader | names, words, steps | `src/engine/content/attributes-matrix.ts` |
| Rehearsing With Your Partner | entry coursework.partners | where | `src/ui/components/CourseworkPane.tsx` |
| Renew It At The End | entry bank.term | steps | `src/ui/bank/BankAccountLife.tsx` |
| Repay From There | entry bank.borrowing, entry bank.other-banks | steps | `src/ui/bank/BankLending.tsx` |
| Report It As Not Mine | entry bank.card-security | steps | `src/ui/bank/BankSecurity.tsx` |
| Round Up To | entry bank.round-ups | steps | `src/ui/bank/RoundUps.tsx` |
| Run It With Your Partner | entry craft.brief-reader | steps | `src/engine/content/workbook.ts` |
| Save The Choices | entry bank.round-ups | steps | `src/ui/bank/RoundUps.tsx` |
| Send The Credit To My Account | chapter bank, entry bank.card | words, steps | `src/ui/bank/BankCard.tsx` |
| Settle | entry documents.residence | steps | `src/engine/content/briefs/briefs-c.ts` |
| Skip It | chapter calendar, chapter plans, entry day.calendar, entry day.advance | words, steps | `src/engine/core/simulation.ts` |
| Skip To Event | entry day.advance | steps | `src/engine/systems/life.ts` |
| Stand Here | entry day.advance, entry school.sick | steps | `src/engine/world/calendar.ts` |
| State Pension | chapter papers, entry papers.pensions | words, steps | `src/engine/domain/model.ts` |
| State Pensions | entry papers.pensions | where | `src/ui/workspaces/PapersWorkspace.tsx` |
| Still Free | entry money.affairs | steps | `src/ui/looks/money.tsx` |
| Stop The Balance Transfer | entry bank.other-banks | steps | `src/ui/bank/BankLending.tsx` |
| Study The Genre | entry craft.genre | steps | `src/ui/components/BriefPane.tsx` |
| Switch | entry bank.other-banks | steps | `src/engine/content/banks-lending.ts` |
| Switch Bank | entry bank.other-banks | steps | `src/engine/systems/bankmoves.ts` |
| Switch To | entry bank.other-banks | steps | `src/engine/systems/lending.ts` |
| Take The Interest So Far | entry bank.term | steps | `src/ui/bank/BankAccountLife.tsx` |
| Take The Loan | chapter bank, entry bank.borrowing | words, steps | `src/ui/bank/BankLending.tsx` |
| Taped Now | entry craft.brief-prepare, entry craft.brief-tape | steps | `src/ui/components/BriefPane.tsx` |
| Terms Enrolled | entry school.money | steps | `src/ui/components/StudyPlanPanels.tsx` |
| The Genre Asks | chapter profile | words | `src/engine/content/attributes-matrix.ts` |
| The Last Take | entry craft.brief-reader, entry craft.brief-tape | steps | `src/engine/content/attributes-matrix.ts` |
| The Post Office | entry bank.cash | steps | `src/ui/bank/BankCash.tsx` |
| The Rest Of Today | entry day.weather | steps | `src/ui/looks/weather.tsx` |
| The Take | entry craft.brief-prepare, entry craft.brief-tape | steps | `src/engine/content/attributes-matrix.ts` |
| The Week Ahead | entry day.weather | steps | `src/ui/looks/weather.tsx` |
| Then Rehearse It On Your Feet | entry craft.brief-choose | steps | `src/engine/content/attributes-matrix.ts` |
| Therapist | chapter papers, entry papers.conditions | words, steps | `src/engine/systems/therapy.ts` |
| Tick I Kept An Account There | entry bank.home-account | steps | `src/ui/creation/CharacterCreation.tsx` |
| Under In Collections | entry bank.borrowing | steps | `src/engine/systems/credit.ts` |
| Universal Credit | chapter papers | words | `src/engine/content/safetynet.ts` |
| Unlock It | entry bank.card-security | steps | `src/ui/bank/BankSecurity.tsx` |
| Usually Like | entry day.weather | steps | `src/ui/looks/weather.tsx` |
| What It Holds Goes To | entry bank.other-banks | steps | `src/ui/bank/BankMoves.tsx` |
| What Pays From Where | entry bank.payments, entry bank.card, entry bank.other-banks | steps | `src/ui/bank/BankMoves.tsx` |
| What You’ve Found | entry coursework.workbook | steps | `src/ui/components/WorkThrough.tsx` |
| Where It Turns | entry craft.brief-prepare | steps | `src/engine/content/attributes-matrix.ts` |
| Where It Went | entry money.affairs | steps | `src/ui/looks/money.tsx` |
| Where It Would Show Next | entry craft.brief-tape, entry craft.identity | steps | `src/ui/components/BriefPane.tsx` |
| Where Switch Bank | entry bank.other-banks | steps | `src/engine/systems/bankmoves.ts` |
| Where You Lived | entry bank.home-account | steps | `src/ui/creation/CharacterCreation.tsx` |
| Which Scene You Share | entry coursework.class | steps | `src/ui/components/ClassMoments.tsx` |
| Yale Bulletin | chapter school | words | `src/engine/content/school.ts` |
| Yale Mental Health & Counseling | entry papers.conditions | steps | `src/engine/systems/therapy.ts` |
| You Are The Creator | chapter school | words | `src/engine/content/school.ts` |
| Your account is overdrawn. | entry money.affairs | steps | `src/ui/screens/Home.tsx` |
| Your Bank There | entry bank.home-account | steps | `src/ui/creation/CharacterCreation.tsx` |
| Your Latest Notes | entry productions.plays | steps | `src/ui/workspaces/SchoolWorkspace.tsx` |
| Your Level | entry craft.practice | steps | `src/ui/workspaces/ProfileWorkspace.tsx` |
| Your Reading | entry craft.brief-choose | where, steps | `src/engine/content/attributes-matrix.ts` |
| Your Takes Of It | entry craft.brief-tape | steps | `src/engine/content/attributes-matrix.ts` |

