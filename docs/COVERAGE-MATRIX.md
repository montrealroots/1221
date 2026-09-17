# SLATE Coverage Matrix

What the game covers, feature by feature, reconciled against the code that
carries it. Every row says one of three things, and nothing is promoted
because its landing page works:

- **Implemented** — built, on screen, held by tests.
- **Partial** — built to a stated depth; the gap is named in the row.
- **Not built** — nothing in the tree.

SLATE is an actor and actress life simulator, and it holds the two titles as equals.
That premise is carried by every save rather than only stated on a screen: see
the row for it below.

This build is a deliberate cut-down. Everything that used to sit behind these
screens — the shops, the studios, the schools, the phone,
the people — was removed on purpose. What is left is six things and the engine
they need. Nothing below claims otherwise.

## What is in the build

| Feature | State | Where it lives | Held by |
| --- | --- | --- | --- |
| The premise | Implemented — every save states that SLATE is an actor and actress life simulator, carries both titles as equals, records which one the player holds and whether they stated it, and is validated on load and refused by the server without it | `src/engine/domain/model.ts`, `src/engine/core/performer.ts`, `base44/shared/guard.js` | `premise` |
| Startup sequence | Implemented — the mark, the storage it picks, the schema it reads, and the slots it hands on | `src/ui/startup/StartupSequence.tsx` | `persistence`, `base44-adapter` |
| Save slots | Implemented — three slots, each its own universe, with migration and validation on the way in, and a backup that says which world date it holds so restoring and deleting are not blind | `src/ui/saves/SaveSlots.tsx` | `integrity`, `persistence` |
| Character creation | Implemented — identity, whether the player is billed as an actor or an actress, race or ethnicity, citizenship, personality and its traits, the acting instrument, where and when the save starts | `src/ui/creation/CharacterCreation.tsx` | `premise`, `citizenship`, `portrait`, `cohesion` |
| The geography map | Implemented — every country drawn from the projected world map, 170,911 cities behind it, loaded a country at a time | `src/ui/creation/WorldMap.tsx`, `src/engine/content/geography.ts` | `geography`, `world-map` |
| Portrait | Implemented — a headshot cropped to a fixed frame and carried on the person | `src/ui/creation/PortraitPicker.tsx` | `portrait` |
| Home | Implemented — the day, where you are, what needs you, what happens next, how you are, the weather, money, standing and the household | `src/ui/screens/Home.tsx` | `interface`, `navigation`, `smoke` |
| Calendar | Implemented — the month, the next thirty days, collisions, and the observances of the country you are standing in | `src/ui/workspaces/CalendarWorkspace.tsx`, `src/engine/world/calendar.ts` | `calendar`, `holidays` |
| Weather | Implemented — a climate model per city from season, latitude and the kind of place it is, with a week ahead | `src/engine/systems/weather.ts` | `weather` |
| Time controls | Implemented — live play, sleeping, and skipping to an event with what it would cross shown first | `src/ui/shell/TimeControls.tsx` | `simulation`, `realclock` |
| Wellbeing and sleep | Partial — the model, the night, and the day that passes unattended. There is nothing else to spend a day on any more | `src/engine/systems/life.ts` | `simulation`, `smoke`, `endurance` |
| Money | Partial — a ledger that conserves, the accounts a life starts with, and net worth derived from them. Nothing bills, earns or charges | `src/engine/core/ledger.ts`, `src/engine/systems/finance.ts` | `money`, `endurance` |
| Server-checked persistence | Implemented — the guards between a browser and storage, and the client that speaks the platform's protocol | `base44/`, `src/engine/persistence/` | `server-guards`, `base44-adapter`, `base44-contract` |

## What was taken out

Removed wholesale, with their screens, their content and their tests: the film
and television half (casting, shoots, pictures, festivals, cinemas, the
company and the strike premise), the rota half of work — the branch, the
manager, the cover shift and being let go — and professions, school, university and
exams, athletics and fitness, health and insurance, property beyond a place to
sleep, vehicles, shopping and the whole catalogue, dining, going out, fashion,
jewellery, wardrobe and costume, travel and journeys, relationships and dating,
the phone and its four apps, social and video, scenes and the dialogue library,
the recall, the tutorial, Go Anywhere and the help panel.

Their save collections are gone from `SaveUniverse` with them. A save written
by an older build still opens — `migrate` creates anything missing and leaves
what it does not read untouched — but the screens that showed those things are
not coming back in this build.

## The engine, as it now stands

Twenty-six commands and three routes, which is the honest size of what is left.
The appendix below is generated from the code, so it is the count to trust; this
paragraph had said fifteen for three commands longer than it was true.

Three of them are a person deciding something rather than answering
something. `calendar.schedule` puts a thing on the calendar, `calendar.cancel`
takes one off again while there is still time to tell anybody it was with,
and `calendar.skip` is standing at it and not going. They are the first
commands in the build that make the world rather than reply to it, and a plan
they make is an ordinary timeline item — which is why the clock stops at one,
why two at once are flagged, and why being somewhere else when it comes round
is noticed.

The three are priced against each other rather than separately: a day's
notice costs nothing, calling off later costs more the later it is, and not
going at all costs twice what the latest possible call-off does. Ordering
them is what makes choosing between them a choice.

Fifteen more are the family business, and they are one system rather than
fifteen: a production company is a list of things it may and may not do, and
each of these opens one of those doors. `company.register` puts it on a
register (Fyrirtækjaskrá, the VAT roll, the employer roll, the IRS),
`company.form_arm` forms the American subsidiary, `company.sign` signs a
guild agreement, `company.insure` binds a policy, `company.option` takes
rights to something, `company.fill_post` puts a person in a post and
`company.develop` puts something on the slate.

The last three are what happens after somebody says yes. `company.greenlight`
turns a title into a schedule: it lays a plan's periods onto real dates,
takes a stage off the lot's own booking board to hold them, and arms the
ticks that walk the picture from prep to wrap to a finished cut.
`company.deliver` files one item on the contractual delivery list, which is
the thing that actually gets a picture paid for — and four of those items
are paperwork no one on the crew makes, so a finished film can sit unpaid
for months because the music cue sheet was nobody's job.

`company.sell` sells the finished thing, and it is the only one of the three
that can pay the company back. A deal is chosen, a ten-year take is reckoned
once and never revised, and the release windows are armed to pay as they open.

`company.claim_rebate` applies for Iceland's production reimbursement, and it is
the one command in the build whose whole weight is a deadline. The lot has
weighed this scheme since the day it was built — every enquiry from abroad sets
what Iceland gives back against what coming here costs, and books Budapest when
the arithmetic says to — while the family's own pictures, made by an Icelandic
company on Icelandic stages, claimed nothing at all. The people with the most
straightforward claim in the country were the only ones in the save not making
it.

The application closes on the first day of photography and never reopens. That
is the real rule and not a penalty invented to give the calendar teeth: a
reimbursement which did not change the decision to shoot here was never an
incentive, so the scheme will not look at a file opened after the camera turned
over. A quarter of the negative is the price of having forgotten, and the screen
says so with a date on it.

Three things decide what comes back, and a producer can work out all three in
advance. That is deliberate — a reimbursement is what a picture is planned
against, and a figure drawn at the last moment cannot be planned against.

**What was spent here, which is not what was spent.** Fourteen percent of
everything a picture spends is bought outside the country whatever anybody
decides: the camera package, the finish, the cover placed through a broker who
is not here. A share of what has gone out, and not a lump off the whole
negative — the first version took a flat fourteen percent of the budget off a
running total, which read nought through the whole of prep on a picture that had
already filed and came right only once the last euro went out. On top
of that come two things a decision moves. Flights are bought abroad, so what it
cost to bring somebody here is recorded leaving the country as it goes. And two
fifths of a fee paid to a performer who lives somewhere else lands where they
live, with their agent and their manager and the company it was invoiced by.
That is the half of local hire the casting screen could never argue: the band
buys the fee and says nothing about where the money ends up. A penalty comes off
as well, because a penalty is money gone without being spend — going over costs
a picture three quarters of what it costs, and being late costs it all of it.

**Which of the two rates, and the cliff between them.** Twenty-five percent
ordinarily, thirty-five with three conditions under it and five things to test,
because two of the three have two parts. They are cumulative. The test itself lives in content and both askers reach it, so there
is one piece of legislation and not two implementations drifting apart. What
differs is the answers. A foreign production asks whether Iceland can supply
fifty people; a domestic one asks whether its own picture employs them — and
answering that meant counting something the crew content has declared since it
was written and nothing had ever computed. A picture has named posts, which are
the twenty-four people it engages by name, and it has everybody behind them: the
electricians behind the gaffer, the drivers behind the transport coordinator.
Each department carries its head first and its crowd as the money climbs, and
the fiftieth person on an Icelandic payroll turns up somewhere north of six
million. Below that a picture is on the lower rate however long it shoots, and
an eight-week shoot is what puts the crowd on it for the fifty days the scheme
wants. Two numbers a producer sets months apart, and the pair of them decide
ten percent of the negative.

**When it lands.** The rate is stamped when the ministry accepts the file and is
never revised, so a picture that shrinks afterwards has already been told what
it is on — which is the whole reason to build it big before the shoot rather
than hope after it. The money itself arrives six months after delivery, less an
auditor's fee for the certificate it is paid against, on a floor that makes a
very small claim barely worth making. And the scheme has an end date in law: a
shoot that starts after it gets nothing, and the date is close enough to the
start of a save to be a thing worth planning around.

**What is not built here.** The auditor certifies exactly what the books say and
disallows nothing, so there is no argument about a line and no reason to keep
better records than the minimum. Nobody borrows against the claim, which in the
real business is an industry of its own and would turn a six-month wait into a
financing decision. A picture that shoots partly abroad is not modeled, because
nothing in the build shoots anywhere but the family's own stages yet. And the
higher tier's unconditional case — work made for audiences of eighteen and under
— is in the content and read by nothing, because no picture in the build has an
audience declared.

Four of them put people on screen, and they are four rather than one because
advertising a part, seeing somebody, offering it to a named person, and letting
that person go are four decisions taken days apart by different people. `company.breakdown`
puts a part out and writes down who came in — once, so the way to see better
people is to have more money behind the part rather than to look again.
`company.cast` offers it at a number, and is the only command in the build
whose refusal is a person saying no rather than the engine saying it could not
be done. `company.release` lets somebody go, and never gets the money back:
paid, used and credited are three different things, and performers are
routinely paid and cut out.

`company.session` books somebody into a room, and it is the only command in the
build that buys nothing but information. Nobody in this world ever learns what
a performer is. The pile shows a guess with a stated width — a photograph and a
credit list say a great deal about how a face reads and nothing whatever about
whether somebody can do a thing twice — and each round of the funnel shortens
the distance on some axes and not others. Only a callback closes repeatability,
because a callback is literally the request to do it again.

A tape is the row worth reading twice. What arrives is not the performer, it is
their tape: shot at home, as many times as they liked, and sent only if they
judged it the good one. So a tape is read through four attributes about
equipment and deadlines rather than about acting, and a performer who is superb
at that looks better than they are while one who is hopeless at it looks worse.
A preread is a correction rather than a zoom, and that is the post-2020
complaint about self-taping stated as arithmetic instead of as an opinion.

Two people carrying a picture have something between them, and it is not two
solo scores added up. The research is blunt that a separable pairing matrix is
addition with a new name on it, and this build was maximally separable — a
strictly linear weighted mean over independent reads, which is the precondition
for committing the failure rather than a defence against it. What carries the
pairing is the one term that cannot be split: how far apart two people are in
the *shape* of what they do, multiplied by how much each of them gives whoever
is in the scene with them. Shape and never level, because level would make the
best performer alive maximally different from the whole world and therefore
everybody's ideal partner, which is absurd and would also be a craft check on a
player who cannot fail one. Two people a long way apart in standing can be the
same note twice; two identical in standing can fill each other's gaps
completely, and what pairs is the second thing. Six attributes read it that
nothing else in the build reads, none of them on any axis. The test that matters
is the one that inverts a ranking: whoever is the better partner for one person
is the worse partner for another, which no sum can produce.

**What is not built there.** No chemistry read — a round that sees two people at
once, which the round machinery takes one at a time. No optics: age gap, height
and colouring are half the research's own pairing term and a role carries no age
band to be wrong against, so it would be a number measured against nothing.

Performers come from somewhere, and it is a real row in the gazetteer. Most of
everybody is Icelandic, because Iceland is a country of four hundred thousand
people with a working screen industry; the rest are Nordic, British or
American, and the part's band decides how far the search reaches. Nobody flies
from Los Angeles to read for a part that pays four thousand euros, so a cheap
picture is cast out of the phone book and an expensive one is cast out of the
world. Bringing somebody costs flights, a hotel for the run and per diem, as a
share of their fee and nothing for anybody who already lives here — which is
the half of local hire the casting screen cannot argue with: the band buys the
fee and says nothing about what it takes to get them onto the stage.

And an American cannot be cast at all until the arm exists and has signed.
Global Rule One — a member of SAG-AFTRA may not work for a producer who has not
signed, anywhere on earth — is the reason the family business is two companies
rather than one, and until now nothing anywhere asked it: the arm could be
formed, the agreement signed, and an American cast either way. It is asked at
the offer and again inside the casting office, which fills parts without going
through the front door and was the one place the rule could have been walked
past.

What a part needs is its own fact, laid at the greenlight and kept. Three
numbers coming to three: a day player is a face in one scene, so how they read
is nearly the whole of it and nobody is going to ask them for take nine; a lead
is in half the picture and every setup of it. Without that, the best buy for
every part on every picture in the save is the same weighted sum forever, which
is a casting system with one decision in it. It is not hidden from the player,
because the player is the producer and a producer knows what their own picture
needs; what is hidden is what the performer is.

A session is one note and a note is one axis. Naming an axis takes that one a
round further than the session would otherwise have taken it and leaves the
other two where they were, so a note is not extra information — it is the same
information pointed somewhere, and pointing it at the wrong thing costs the
round.

What makes any of it a decision is the diary. The casting office runs one thing
at a time and the schedule is the diary, so a picture with twenty-one parts and
eleven weeks discovers that it can see everybody once and cannot see everybody
twice. Prereading the whole list is affordable and costs most of the calendar,
which is to say it costs the callbacks. And the office picks on what it
believes, like everybody else: a producer who never sat in a room gets the
cast a photograph chose.

Casting is also where the acting sheet stops being decoration. Every save has
carried 813 acting attributes since the first commit and nothing read one of
them; nineteen are now read, on the people a picture casts, as three axes that
go three different places. Whether a performer can repeat a take is read by the
shoot and by nothing else — more takes is more material for the same finished
second, which is the shooting ratio, which is how far the cutting room has to
wade, which is the delivery date. Whether they are any good and what the lens
does with them are read by the sale, and by nothing on the floor. No axis is
read twice, because an axis with two readers could have been one axis.

Nobody has to cast anything. Two weeks before the camera turns over the
casting office fills whatever is left, at the band and no further — so the
money a picture was greenlit at is a casting decision months before anybody
thinks of it as one, and paying over the band is the only way to reach past it.
What is paid over the band the company pays on the day it reaches, whether or
not a frame is ever shot, because that is what pay or play means.

Having a name is also the only way to lose one. A picture with somebody
well-enough known to be news carries a row on the trouble deck that a picture
cast out of strangers cannot draw: something the person did, or is said to have
done, arrives in the press while the picture is being finished. The work is
what it was; every buyer now has a reason to wait. The attention goes on the
person rather than on the production, so they carry it into the sale of
everything they are in and into the next office, which passes on them without
saying why. It is the only thing in the build that writes `controversy`, which
had been a number seeded to zero on every person in every save and moved by
nothing at all.

**What is not built, and is named here so the list above does not imply it.**
The audition — the room, the hidden want, the note, the redirect, the
repeatability check on a callback — is the largest missing piece and the one
the research is most emphatic about; casting here is offer-only, which the
research lists as a real format but is one of nineteen. There are no holds:
availability, a pin, a first refusal, a hold and a booking are five states with
five exit costs, and collapsing them deletes pilot season, so they wait for a
market with somebody else's projects in it to compete over. No background, no
stand-ins, no doubles, no stunt performers. No billing, which is a finite-slot
constraint that can become unsatisfiable. No most-favoured-nations, no minors
and their hours, no visas, no union clearance. A day out of days would make the
schedule re-price the cast, and there is not one.

Being cast now takes the time it takes. A settled audition lays the engagement
across the player's own calendar a week at a time, every week marked as wanting
them, so the clock stops on it and two things at once are flagged the way any
other commitment is. Before this, `theyWantYou` posted the fee, moved four
reputation fields and scheduled nothing at all — a nine-week picture stopped the
player's clock for no time, and `requiresPlayer` had one write site in the whole
engine, on a plan the player had typed themselves. A week rather than a day,
because `docs/DEPTH.md` forbids anything downstream naming a shooting day and a
performer's week on a picture is not the production's unit anyway.

Going into a room is now an afternoon somebody has to be in, and sending a tape
is not. That is the whole difference between the two ways in and it had no cost
attached to it either way.

And one question has one answer. Whether the player is free was asked by the
room and never asked at all by `company.cast`, so Play It would seat them in a
part shooting across one they had already won. `world/diary.ts` answers it for
both, including the week in front of a first day, because a fitting and a
read-through are as real a claim on somebody as the shoot.

Three of them are the player's own, and they are the only three commands in the
build that are not the family's business. `life.go_up` goes up for a part;
`life.take_note` answers the one note anybody gives you; `life.upkeep` pays to
put the house back, which is the only one that spends the player's own money on
the player's own body, by way of the only thing in the build that reads what
kind of night they had. A third route, `/workspace/auditions`, is where the
first two live, because a career is a different subject from a company; the
third sits under the condition meter on Home, next to the number it argues
with.

The work comes from the stages and from nowhere else. A production that has
taken one is a production that needs people, so what the lot is letting a year
from now is what the player will be asked about — which makes the lot's
business and the player's career one system rather than two, and means money
spent telling the world the stages are there eventually comes back as a part.
It also means the player cannot make work happen by wanting it. They can make
the lot busier, which is a different thing done a year earlier with somebody
else's money, and that gap is the honest shape of a career.

Nothing in the player's room reads the acting sheet, and that is the constraint
the whole of it is built around rather than a shortcut. The player holds all
813 attributes at the ceiling and forty-five of them are named for this room —
`cold_reading`, `taking_a_redirect`, `nerve_management`, `walking_into_the_room`,
`self_tape_craft`. A faithful port of the research would be forty-five lookups
all returning a hundred. So whatever the player chooses to play, they play it
exactly, and the game is entirely in the choosing: `tests/audition.test.ts`
sets every attribute in the save to fifty and demands that every outcome come
out identical.

What is left when competence is removed is three decisions. What to play, in
three shades — how much they want you liked, how much of it they want, and how
fast it goes — chosen blind, because nobody has told you what the part is for
and nobody is going to. Whether to send a tape or go in, which is a day against
three and is not about quality: the player's tape is flawless, and what a tape
does not do is come back with a note. And how far to take that note, which is
the only decision anybody takes with information in it — the room names one
shade and one direction, never how far, and it names the shade you had nearest
right, so overcooking it spends the only thing that was working.

Being remembered is the ratchet, and a no counts. The research calls roster
memory the main career ratchet and is explicit that it pays out from a pass, so
what a reading buys is not the part — it is that the next time these people need
somebody, they think of you. About a third of them ask before anybody has seen
anything, which is nepotism stated as arithmetic: the production is standing on
a stage the family owns. Everything above that is earned by being read.

A part taken pays into the player's own account, writes a quote everybody else
argues from, and moves a fame that nothing else in this build has ever moved.
It also holds the dates, so it is the first thing in the game that can cost the
player their own family's picture.

**What is not built.** The turn loop — six to fourteen beats, a patience clock,
asking to go again, knowing when to stop talking — is not here, because one note
and one answer is what this cut holds and a patience clock with one turn to
spend is a clock with nothing to count. No chemistry read, no callback on the
player's side, no agent, no competing offer to weigh a pin against, and no
outside office with a taste of its own: there is one room and it wants what it
wants.

`lot.sell` is the odd one out and the only command taken again every month:
what the lot spends telling people it exists. The overhead table's line is the
floor and anything above it is a bet, read back off the ledger across three
quarters rather than off the figure — so it cannot be bought the month before
it is wanted, and it cannot be dropped without the market noticing two quarters
later.

The nine capability doors are walkable end to end, which was worth proving
rather than assuming: from the two a registered company starts with, eleven
commands open all nine — the employer registration, the American arm and its
EIN, the guild signature, an option on something, four policies and two posts.
It costs about ninety thousand and the company starts with a hundred and
eighty. Every blocker the page raises now names a kind of fix, and every kind
but one has a control beside it; the exception is money, which no button makes
appear. The material blocker had none until recently, so a player pressing
everything offered reached six of nine and stopped, with the button for the
seventh sitting in a different panel under a heading that does not mention
doors.

What the doors decide, which is not the same question: three are read by the
engine at the greenlight, the delivery and the reimbursement; three more bite as
greenlight blockers; hiring Americans is enforced in the casting room. Reclaim
The Tax decided nothing at all until it was built, and now files a VSK return
every two months on the tax inside what the company actually bought.

`lot.build` is its opposite: taken once or never, and it changes what the lot
is rather than how hard it is sold. It puts up a fifth and much smaller room,
priced at the published benchmark by the square meter, for the short cheap work
the four big rooms cannot house at any price. The money goes on the day it is
signed and the room opens seventy-eight weeks later; it is refused when the
family will not carry it, measured as the cash plus what it will still put in —
the same pool the greenlight spends from, so a room and a picture compete. It
never pays for itself. What it buys is the documentary, which cannot happen here
without it, a sixth holder, and a slow lift in how often the player is asked
about anything at all.
What arrives is run through a recoupment waterfall in the order it arrives: a
distributor's fee off the top, then what was spent selling the picture, then
the money that made it, with interest on whatever part of that is still
outstanding. The order is the whole mechanic, and it is why a picture can take
three times its budget and still owe for itself.

No command hires a crew, and that is deliberate. A greenlit picture arms a
`project.crew` tick for each week somebody is due to start, and people arrive
against that calendar on their own: the unit production manager, the designer
and the money ten weeks before the camera turns over, the first AD at six, the
gaffer and the key grip at two, the boom operator in the last week. Most of the
people in a save exist because a picture needed them, and they persist and get
rehired afterward, so a company that keeps working accumulates a crew rather
than regenerating one.

The decision underneath them: the parent is an Icelandic `ehf.` and the
American arm is earned. Global Rule One is why — a SAG-AFTRA member may not
work for a producer who has not signed, anywhere on earth — so an Icelandic
company that wants one American performer has to become, in part, an American
company. Nothing else in the build has that shape, and it is the reason the
company is two records rather than one.

Two routes now: `/workspace/calendar` and `/workspace/business`; Home is
served by the shell itself.

Sleeping is the other thing a player does that moves the world
(`life.sleep`). The rest is the Decision Center answering, dismissing and
marking read (`world.take_decision_action`, `world.dismiss_decision`,
`world.mark_read`) and the preferences (`world.set_preferences`).



<!-- inventory:begin -->
Generated by `node tools/inventory.mjs --markdown`. 28 commands, 18 scheduled kinds, 3 events emitted, 0 event listeners, 0 scenes, 3 routes.

### Commands

| System | Kinds | Owner |
| --- | --- | --- |
| calendar | `calendar.cancel` `calendar.schedule` `calendar.skip` | `src/engine/world/plans.ts` |
| company | `company.breakdown` `company.cast` `company.claim_rebate` `company.deliver` `company.develop` `company.fill_post` `company.form_arm` `company.greenlight` `company.insure` `company.option` `company.register` `company.release` `company.sell` `company.session` `company.sign` | `src/engine/world/casting.ts`, `src/engine/world/company.ts`, `src/engine/world/making.ts`, `src/engine/world/rebate.ts`, `src/engine/world/selling.ts` |
| life | `life.go_up` `life.sleep` `life.take_note` `life.upkeep` | `src/engine/systems/life.ts`, `src/engine/world/audition.ts`, `src/engine/world/house.ts` |
| lot | `lot.build` `lot.sell` | `src/engine/world/lot.ts` |
| world | `world.dismiss_decision` `world.mark_read` `world.set_preferences` `world.take_decision_action` | `src/engine/world/world.ts` |

### Scheduled kinds

| System | Kinds | Owner |
| --- | --- | --- |
| company | `company.vat_return` | `src/engine/world/vat.ts` |
| life | `life.commitment` `life.day_rollover` `life.reading` `life.working` | `src/engine/systems/life.ts`, `src/engine/world/audition.ts`, `src/engine/world/plans.ts` |
| lot | `lot.overhead` `lot.stage_built` | `src/engine/world/lot.ts` |
| project | `project.banked` `project.cast` `project.crew` `project.delivery` `project.part` `project.period` `project.rebate` `project.room` `project.window` | `src/engine/world/casting.ts`, `src/engine/world/crew.ts`, `src/engine/world/making.ts`, `src/engine/world/rebate.ts`, `src/engine/world/selling.ts` |
| sugar | `sugar.quota` | `src/engine/world/sugar.ts` |
| world | `world.tick` | `src/engine/world/world.ts` |

### Events emitted

| System | Kinds | Owner |
| --- | --- | --- |
| life | `life.sleep_started` `life.woke` | `src/engine/systems/life.ts` |
| world | `world.day_rollover` | `src/engine/systems/life.ts` |

### Event listeners

| System | Kinds | Owner |
| --- | --- | --- |

### Scenes

| Scene | Owner |
| --- | --- |

### Routes

`/workspace/auditions` · `/workspace/business` · `/workspace/calendar`
<!-- inventory:end -->
