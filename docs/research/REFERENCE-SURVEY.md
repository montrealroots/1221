# The Reference Survey

What the commercial studio-management game SLATE is measured against actually does,
recorded screen by screen from the running game, and written here as mechanics in
SLATE's own terms.

## Why this document exists and what is allowed in it

The owner wants SLATE's studio side to behave the way that game behaves. Mechanics,
systems and the film industry's own vocabulary are free — nobody owns the idea of a
negative cost, a rewrite counter or a release window, and the trade coined the words.
The reference game's *expression* is not free: its source, its screen prose, its art,
its tuning tables lifted as a set.

So the rule for every entry below, without exception:

> **Record what the system does. Never transcribe what it says.**

Field names appear here where naming them is the only way to describe the mechanic,
and they are the trade's functional labels rather than authored prose. Where a number
is observed it is recorded as an *observation about behavior* to be re-derived and
re-measured in SLATE, never copied in as a constant. SLATE's own figures stay measured
on a played career, the way `RATE_PER_ROOT_MINUTE_CENTS` was.

## How the survey is taken

The game runs on the owner's machine. A helper in the session scratchpad captures the
game window's own pixels with `PrintWindow` — which works when the window is behind
something else and cannot capture anything else on the desktop — and clicks it with
real input, but only after checking the game is genuinely the foreground window, so a
click can never land in another application.

Two things that did **not** work and should not be retried: `CopyFromScreen` captures
whatever is visually on top, so it caught the wrong window; and posted `WM_LBUTTON*`
messages are ignored by this app entirely, so clicks have to be real input.

---

## 1. Setup — the configuration surface

Before a game starts, the setup screen exposes what the simulation treats as
configurable. That list is itself a finding, because it says which parts of the model
the designers considered parameters rather than rules.

**The rail:** the player's studio · the executive assistant · rival studios · foreign
markets · background images · then three swappable content databases (source material,
talent, talent images) · then options (screen size, difficulty level, game options,
game text, immersion text).

### 1.1 The player's studio

The player is a **named person** with a portrait, not an anonymous hand. They name the
studio and place it in a city and state. The framing is that you already own a major
studio on day one rather than building one from nothing.

**Against SLATE:** SLATE is stronger here and should stay that way. It already has a
named person with a family, a body and a household, and a company that has to be
*formed* through the capability doors rather than handed over. Starting big is their
premise; starting from a family is ours, and it is the better one. Take nothing.

### 1.2 Rival studios

Rivals are configurable before the game begins. Each carries a **studio name, an owner
with a first and last name, and a portrait** — so a rival is a company with a person
behind it, and both are editable by the player at setup.

**Against SLATE:** SLATE's deleted rivals table had five studios that were pure release
habits — a name, a frequency, a typical size, a set of channels. No people, no
ownership, and the file's own header admitted the limit: *"these studios have no
finances, no talent and no history."* A named owner is the cheap half of fixing that,
and it is what makes a rival somebody you can lose a picture to rather than a number
that crowds a week.

**Open question for the rebuild:** whether rivals should be configurable at setup at
all. It suits a sandbox; it may not suit a game where the world is supposed to be found
rather than authored.

### 1.3 Foreign markets

Thin at setup: projects release around the world, territories come from a map, and the
player may add a country that is missing.

**Against SLATE:** nothing to take. SLATE's gazetteer already carries 252 countries,
3,865 regions and 170,911 cities, and the geo check gates on it. This is the one place
so far where SLATE is already the deeper build.

### 1.4 Difficulty — the most informative screen in the setup

Difficulty is a five-rung scale with a named tier per rung, and choosing a rung moves a
bundle of parameters at once. The bundle is the interesting part, because **every knob
exposed here implies a system behind it**, and several of those systems SLATE does not
have at all.

What the bundle contains, grouped by what it reveals:

**The company as a going concern.** A monthly studio expense with an annual figure
beside it, a starting cash balance, a maximum loan the studio may take, an interest
rate on that loan, and a cash level at which a bankruptcy warning fires.

> *This is the biggest structural gap.* SLATE's company has no operating overhead of
> its own — only the lot's — and **cannot borrow at all.** Banking exists for the
> household, not for the company. A studio that can take a loan against itself, at
> interest, with a warning threshold on the way down, is a different game from one that
> can only spend what it has: it makes a bad year survivable and a run of them fatal,
> which is the shape a studio's finances actually have. The deleted `world/ruin.ts` had
> the warning half of this and none of the borrowing.

**Talent as a contested, rate-limited resource.** A cap on auditions per month; a
toggle for whether talent always accept; and a cooldown, in months, before a rival
studio will approach the same person again.

> Three separate findings. **Talent can refuse** — there is a toggle to disable that,
> which means refusal is the default and the toggle is the mercy. **Rivals compete for
> the same people**, so the talent pool is shared and contested rather than a shortlist
> drawn for the player. And **there is a per-month throttle on casting activity**,
> which is a way of making attention itself scarce. SLATE's deleted casting drew a
> fresh shortlist on demand, nobody ever said no, and nothing competed for anyone.

**Three named biases, each switchable off.** An award bias, a release-date bias and a
genre bias.

> Architecturally revealing: the designers treat these as layers over a base model
> rather than as the model. SLATE built all three as load-bearing — the ceremony, the
> crowding of a release week, and whether a genre's audience got what it came for. The
> question worth holding for the rebuild is whether making them optional is a kindness
> to the player or an admission that they were bolted on. SLATE's own standard says a
> thing that can be switched off with nothing else changing was decoration; a
> difficulty toggle is not quite that, but it is close enough to be worth noticing.

**A global box-office multiplier**, with its own switch to remove it.

> A blunt instrument, and a warning rather than a model. SLATE has exactly one figure
> that plays this role and it is derived, measured and documented — the rate per root
> minute, re-measured on twelve played careers when the cast change falsified it. A
> flat multiplier over the whole model is what that constant exists *instead of*.

**The player's own money, held separate from the studio's.** An annual salary, and
points expressed as a percentage of the studio's gross.

> Strong convergence, and SLATE is already ahead here. The household and the company
> are separate ledgers and the project's own rule is that the two never spend the same
> money twice. What SLATE lacks is the second half: the player **drawing** from the
> company as salary and as a participation in its gross. That is a genuinely good
> mechanic and it fits SLATE's existing separation exactly.

**Recorded as observations, not constants.** Figures were on screen for every knob
above. None are written down here and none should be carried across: SLATE's numbers
are measured on a played career, and a borrowed constant has no derivation to defend.
What transfers is the *shape* — that an overhead exists, that a loan has a ceiling and
a rate, that a warning has a threshold, that auditions have a monthly cap.

### 1.5 Game options — where the talent model turns out to be a life model

**The career is finite.** The player picks how long the game runs, from three decades
to seven and a half, and it ends. SLATE has no end condition at all — a save runs until
the player stops. A chosen horizon changes how every decision is weighed, because a
thirty-year studio and a seventy-five-year studio are not playing for the same thing.

**Talent age, and talent die.** Both are toggles, which means both are the default and
the toggles are the mercy. Ageing has its own rate setting. A third toggle governs
whether a written character's age moves to suit.

> The most consequential finding so far, and it reframes the whole talent table.
> SLATE's deleted `Talent` record held a name, a post, a standing and a run of results.
> Nobody had an age, nobody got older and nobody ever died. That makes a career a price
> list with a memory. Here a career has an arc: somebody is too young for the part,
> then right for it, then too old, and then gone — possibly mid-production, which is a
> genuine crisis a studio has to survive. SLATE already ages its family and already
> kills people; the machinery exists in `world/family.ts` and was simply never pointed
> at the talent pool.

**Pitch meetings**, as a toggle that can be declined entirely.

> Material arrives by somebody bringing it to you. SLATE has only the opposite
> direction — the player options a property they went looking for. An inbound channel
> where projects are offered, and where taking the meeting is itself a use of time, is
> a system SLATE has no version of.

**Talent have agencies**, with an option to randomise which agency represents whom.

> SLATE modelled the agent as a *rate* — the gap between what the company pays and what
> the person receives, larger for bigger names. That was a good simplification and it
> reached something real. An agency as an **entity** is more: it can represent several
> people, it can be a relationship that improves, and it can package a director and two
> leads together. Worth costing before building; the rate alone may still be enough.

**A default shooting location**, set as a city and state or a country, overridable per
project.

> SLATE has the deeper version of this already — `unitBaseId`, the gazetteer behind it,
> and a rebate system that reads where the money was spent. The finding is only that
> the location is worth a **default**, so the player is not asked the same question on
> every picture.

The rest of the screen is presentation: an icon style for series and streaming, a
connectivity indicator, and a help-button style.

---

## 2. The running game — the shape of a turn

A started game opens on a persistent frame that never goes away, and the frame is the
first real architectural finding.

**The clock is a month, and the player ends it explicitly.** A date sits top right with
a single control beside it that closes the month. Everything else is done at leisure
inside that month; nothing advances until the player says so.

> SLATE runs a continuous world clock with a scheduler, day and week ticks, and a
> calendar the player can put their own commitments on. That is a richer model of time
> and it should stay. But the **explicit end-of-month commit** is worth taking: it
> gives a studio game a heartbeat, a moment where salaries and overhead land and
> reports are cut, and a clean point for the world to answer back. SLATE's month tick
> already exists and fires on its own; making the player close the month is a small
> change that turns a background process into a decision point.

**Studio cash is always on screen**, in the header, beside the studio's name and city.
One number, permanently visible. SLATE buries company cash inside the business screen.

**Navigation is a two-row icon bar**, and it expands as the game opens up — the title
bar carried six icons, the headquarters view eleven. The areas named as living under
headquarters: current projects, the studio bungalows, financial reports, the studio's
own finances, and a bank.

> Two of those are systems SLATE does not have. **A bank** the studio deals with,
> which pairs with the loan ceiling and interest rate seen on the difficulty screen —
> borrowing is not a parameter, it is a place you go. And **bungalows**, which is
> talent housed on the studio's own lot. SLATE has a lot with stages and offices and no
> reason for a person to be on it; bungalows would give the lot a second purpose and
> tie the talent pool to the estate, which is exactly the kind of cross-system wiring
> the house standard asks for.

### Where the survey stands

Mapped so far: the full setup and configuration surface, and the frame of the running
game. Not yet walked: current projects, the bungalows, financial reports, the bank, the
new-project flow, the talent department, and the per-department production screens that
the earlier session glimpsed — story, production, and whatever sits beneath them.

The tooling for the rest lives in the session scratchpad as `hm4.ps1`: `shot` to
capture, `click x y` to act. Coordinates are window-relative against a 1920x1152
client area.

---

## 3. How to read a screen — the control taxonomy

Every editable field carries a small glyph before its value, and the glyph appears to
encode the **control type**, which means the shape of a field's option set can be read
before clicking it. Working hypothesis, to be confirmed field by field:

| Glyph | Appears to mean | Example seen on |
|---|---|---|
| `a` | free text entry | a studio name, a person's name, a project title |
| `~` | two-state toggle | whether talent die, whether a writer also produces |
| `¬` | cycles a fixed list | a warning threshold, a cooldown in months |
| `•` | opens a picker or list | choosing an image, choosing from a set |
| stars | a rating, one to five | difficulty, role difficulty, stunt demand |
| ✔ | the chosen item in a radio group | the career length |

**Why this matters for the survey.** Reading a default value tells you a mechanic
exists; it does not tell you the option set, and the option set is where the design
lives. A two-state toggle and a six-value cycle are different mechanics even when the
visible default is the same word. Every field below is to be opened, not just read.

## 4. Starting a project — origination is a choice of source type

A new project begins by choosing **what kind of material it comes from**, offered as a
row of source-type icons. The set is gated by supply: a type whose database holds
nothing available is not offered at all.

The first type is **an original idea** — a blank project that needs only a title, and
which then lands on the slate with no rights to acquire and nothing to pay for.

> **Against SLATE.** SLATE's `Provenance` was an enum of six values hanging off a
> project, chosen after the project existed. Here the provenance **is** the act of
> creation: you do not make a project and then say where it came from, you pick a
> source and that produces the project. That inverts the flow, and the inversion is
> better — it makes "an original" a deliberate choice with a cost profile of its own
> (nothing to buy, nothing to inherit, no built-in audience) rather than the default
> that happens when the player skips a field.
>
> The supply gate is the other half and SLATE has no version of it. Material is a
> **finite pool that can run dry**, so a studio that wants to make something from a
> novel has to have a novel available to option. That turns source material into a
> resource other studios can also be competing for, which pairs with the earlier
> finding that rivals contest the talent pool.

### 4.1 The origination row, enumerated

Six icons, and they are not six source types — **four are routes into a project and two
are list controls.** Worth separating, because the count misleads.

**Route one — an original idea.** A blank project needing only a title. Nothing to
acquire, nothing to inherit, no built-in audience.

**Route two — a cross-over.** A new project built from the characters *and* the talent
of **two or more pictures already released**, with the stated caveat that not every
genre makes an interesting one. The game files it alongside franchises and universes.

> **A third channel of inheritance, and SLATE had only two.** SLATE's deleted build
> carried lineage — the next one in a line — and universes — a different story wearing
> the same badge. A cross-over is neither: it is two established lines *colliding*,
> and it inherits from both. That is a different audience promise and it should
> reckon differently. The genre caveat is the interesting half: the model knows some
> genres cannot support it, which means the refusal is content-driven rather than a
> flat rule.

**Route three — a private source database.** Material the player authored themselves,
always available, separate from the public pool. Carries the same fields as the public
one: a title, a genre, a source type, a cost.

**Route four — the public source database.** The pool of properties available to
option. Each row carries a title, a **genre with a sub-genre**, a source type, and an
acquisition cost.

**Controls five and six** are a filter for material added this month, and a sort.

### 4.2 Three mechanics that came out of this row

**1. Genre is two levels, not one.** A property is filed under a genre *and* a
qualifier beneath it — a science-fiction picture that is specifically an alien
invasion, a horror picture that is specifically found footage. SLATE had nine flat
genres and treated genre as a pure question of which dials an audience came for.

> A sub-genre is the cheaper and sharper version of that same idea: found footage and
> teen scream are both horror and they want completely different budgets, runtimes and
> casts. Worth costing carefully — a second level multiplies the content table, and
> SLATE's own rule is that an option earns its place only when something reads it. The
> test to apply: does the sub-genre change what happens next, or only the label?

**2. The source pool churns every month.** Material becomes unavailable and new
material arrives, month on month, with a dedicated filter for what is newly listed.

> **Strong finding, and SLATE has no version of it.** A property you want is not
> waiting for you — it expires. That does three things at once: it makes the monthly
> clock matter, it makes "option it now or lose it" a real decision, and it implies
> somebody else took it. Combined with the earlier finding that rivals contest the
> talent pool, the picture is of **a world with finite supply that the player is
> competing over**, rather than a catalogue the player shops from.

**3. The screenplay gate, which is the whole development economy in one rule.**

> An original screenplay is ready to be made immediately. **Every other source type
> must have a screenplay written first**, and that takes months — and the game says
> plainly that the weighing is *the delay against the monthly studio expense*.
>
> This is the most economically elegant thing found so far, and it retroactively
> explains the overhead figure on the difficulty screen. Overhead is not flavour: it is
> **the price of time**. Every month a project sits in development, the studio pays to
> exist. So an original screenplay is fast and shallow, a novel is slow and deep, and
> the choice between them is a real trade rather than a preference.
>
> SLATE has the pieces and never connected them. Development spend exists
> (`Project.spentCents`), the month tick exists, and the lot has overhead — but the
> company has no overhead of its own, so **waiting has never cost SLATE's player
> anything.** Time was free, which is why development was never a decision. Giving the
> company a monthly cost turns the entire development phase into a real one.

## 5. A source property, in full — the densest screen in the game so far

Selecting a property before buying it shows everything known about it. This is the
schema of source material, and it reframes three things SLATE got structurally wrong.

**Its own rail:** an overview, the source, the story, its roles (a count is shown), all
roles by category, production elements, and the purchase action. So a property arrives
with its roles **already written**, before anybody buys it.

### 5.1 The fields, grouped by what they do

**Identity and classification**
- a title
- a **production genre** — what it will be made and sold as
- a **genre with a sub-genre** — what the material actually is
- whether it is a musical

**Scale, stated up front**
- an **approximate production budget**, given on the property itself

**Production demands — five ratings**
- story scope · costume design · set design · creature effects · visual effects

**Story qualities — six ratings**
- character development · intelligence · dialogue · pace · plot twists · sub-plots

**Content facts**
- whether there are creatures, and whether the cast is all human
- whether there is an additional villain
- the era it is set in
- how the story ends

**Who it is for**
- a **primary audience** and a **secondary audience**, each a sex and an age band

### 5.2 Four findings, and two of them are structural

**1. Production genre and genre are different fields.** A property can be science
fiction as *material* and action as a *production*. SLATE had one genre doing both
jobs.

> This is the distinction between what a thing is and how it is sold, and it is real in
> the business. It also gives the player a lever SLATE never had: take a property and
> produce it against its grain. That should carry a cost and a payoff — the audience
> the genre brings versus the audience the production promises — and it is exactly the
> kind of tension SLATE's `servesIts` was reaching for with one field.

**2. The story qualities are properties of the material, not choices by the player.**
Character development, intelligence, dialogue, pace, plot twists and sub-plots are
**read off the source**, discovered rather than set.

> **This is the big one, and SLATE built it backwards.** SLATE's six dials — depth,
> dialogue, pace, turns, threads, spectacle — were a pool the *player spent* at the
> writing stage, and the list maps almost one-to-one onto the six here. But there the
> player authors the script; here the player **finds** a script that already is what it
> is, and the skill is recognising what you are holding and matching it to a
> production, an audience and a season.
>
> Neither is wrong, and the difference is the whole feel of the game. Authoring makes
> the player a writer. Discovering makes them an executive — and an executive is what a
> studio game is about. The strongest answer is probably both: a property arrives with
> its qualities fixed, and development spend can move them a little, at a price. That
> keeps SLATE's authoring while making material genuinely different from itself.

**3. Production demands are separated from story qualities.** Scope, costume, set,
creature effects and visual effects are a different group from the six story ratings —
and the separation is the point: **the first group drives what it costs to make, the
second drives how it is received.**

> SLATE collapsed these into one pool by putting `spectacle` in among the story dials
> and letting it compete with depth and dialogue for the same attention budget. That
> was tidy and it was wrong: a picture can be enormously expensive to mount *and*
> thinly written, and the model should be able to say so. Two separate vectors, one
> costing and one reckoning, is the better shape.

**4. Audience is demographic — a sex and an age band, primary and secondary.** SLATE
has no demographic model at all; its audience is an undifferentiated quantity that a
genre points at six dials.

> This is how a release date, a rating and a cast decision all become one conversation,
> because they all move the same two bands. It is a large addition and it should be
> costed carefully, but it is the missing dimension behind several things SLATE
> hand-waved.

**5. The property states its own approximate production budget.** Scale is a fact about
the material before anybody commits.

> SLATE's `budgetCents` had no writer for most of the build and was eventually set at
> the greenlight by the player. Having the *material* imply its own scale is better: it
> makes an expensive property expensive for a reason, and it gives the player something
> to push against — producing under or over what the material asks for should both have
> consequences.

### 5.3 Production elements — where the budget actually comes from

The five production ratings reappear under a heading that names what they are:
**production costs per month**. Beside them sits a separate **production type** axis —
live action or animation — and the approximate budget, stated for a motion picture
specifically, which implies the same material costs differently as a series.

> **This is the budget model, and it is the answer to the biggest hole in SLATE.**
>
> A negative cost here is not a number the player types and not a single figure the
> engine derives. It is **a set of per-department monthly rates multiplied by how long
> the production runs.** Scope, costume, set, creature effects and visual effects each
> burn at their own rate every month the picture is in production.
>
> Three consequences fall straight out, and all three are mechanics SLATE lacked:
> a longer schedule costs more *by construction* rather than by a penalty; a property
> demanding heavy effects is expensive in a way the player can see the source of
> before committing; and cutting a department is a real lever with a visible price.
>
> SLATE's `budgetCents` was a single figure with no writer for most of the build, then
> a number set at the greenlight. The plan file's Phase C asked for "the accurate
> department engine behind each" department without knowing what that engine was. This
> is it: **a rate per department per month, against a schedule.** It is also exactly
> the shape of SLATE's existing `Period.converts` on the cutting room, which already
> proves hands-move-cost-and-speed works — it simply needs generalising to every
> department.

### 5.4 Roles, in full

Roles arrive **with the material, already written**, as numbered tabs. Each carries:

- a role number and a **role type** — the leading part is marked as such
- **species**, **gender** and **age**
- a character name
- a **role difficulty** rating
- three separately rated **character traits**: stunts, make-up effects, love scenes
- a character description, which may be empty
- a count of additional roles beyond the principals

> **Two mechanics SLATE never had, and one of them is load-bearing.**
>
> **A role has an age, and talent age.** Those two findings meet here. An actor is not
> merely expensive or cheap — they are **right or wrong for the part**, and the same
> person drifts out of a role's range over a career while a younger one drifts in. That
> makes casting a matching problem rather than a purchasing one, and it gives the
> talent pool a genuine life cycle. SLATE's billing weights priced people; nothing ever
> asked whether they *suited* the part, because the parts had no properties to suit.
>
> **A role's traits are demands on the performer.** Stunts, make-up and intimate scenes
> are rated per role, which means they are things an actor can be willing or unwilling
> to do, better or worse at, and paid more for. That is the hook a refusal hangs on —
> and the difficulty setting seen earlier confirms refusal is the default behavior.
>
> Both of these point the same way: **the cast is matched to written parts, not ranked
> on a single scale.** SLATE's six billing rungs with falling weights were a clean
> model of *how much a name is worth* and said nothing about *whether they fit*. The
> rebuild wants both.

### 5.5 Roles by category — the cast is typed, not ranked

A second view lists every role against three axes at once: its **type**, its
**difficulty**, and its **species**.

The type taxonomy observed: **main character · lead · villain · major support · minor
support**, with support tiers repeating across several roles. Difficulty falls roughly
with importance but not strictly — two roles of the same type can differ.

> **SLATE ranked the cast; this one types it.** SLATE's `BILLINGS` were six ordinal
> rungs — first billed through sixth — each with a falling weight, and the weight was
> the whole of what a rung meant. That models *how much a name is worth* and nothing
> else.
>
> A typed cast says something different: a villain is not the third-most-important
> person, it is **a different job**. That matters because it makes casting a set of
> distinct problems rather than one ranked list — the villain can be the expensive
> piece of casting on a picture whose lead is unknown, and an audience can turn out for
> an antagonist. It also gives awards somewhere to point: SLATE moved its performance
> award from a post to a billing rung and still had only one of them, when the real
> shape is a category per role type.
>
> Difficulty varying *within* a type is the other half: it decouples how hard a part is
> to play from how big it is, which is what lets a small demanding role exist. That is
> a lever for making a cheap picture good, and SLATE had no version of it.

**Species as a per-role field**, with a project-level statement about whether the cast
is all human, ties back to the creature-effects cost rating: a non-human role is a
role that costs the make-up and creature departments money.

> Cross-system wiring of exactly the kind the house standard asks for — one field on a
> role reaching into a department's monthly burn rate. Worth copying as a *pattern*
> even where the specific field is not.

## 6. Buying it, and what a project looks like once owned

**The purchase.** Cash fell by exactly the listed price, the property **left the
available list**, and a new one appeared at the bottom of it.

> Confirms the finite-supply model outright. Material is not a catalogue — taking it
> removes it from the world, and the pool refills from somewhere else. SLATE's
> `company.option` took a right without any pool existing for it to come out of.

**The project's blocking state is displayed on its row**, alongside its genre, its
production type and its release date. A freshly bought property shows that it has no
screenplay and no release date. The assistant panel names the next action and the
department that performs it.

> A project always says what it is waiting for. SLATE had `Stage` and a set of locks,
> but nothing that answered "what is the single next thing" in one line. The refusals
> existed; the *prompt* did not.

### 6.1 The department rail, as it stands on an unstarted project

**Story department:** an assistant · a project graphic · development to date · the
format and channel it is being made as · storytelling attributes · its principal roles
with a count · **additional roles with their own, larger count** · all roles by
category · **add role** · unlock the story (greyed) · **hire a writer, which locks the
story** (offered).

**Production department:** an assistant · parental guidance age · pre-production ·
production · post-production · all production, and more below the fold.

### 6.2 Three mechanics from the rail alone

**1. Hiring a writer locks the story.** The lock and the hire are the same action, and
the unlock is present but disabled until then.

> SLATE had three locks — shape, cast, opening — each shut by a specific command, and
> the reasoning was sound: somebody who took points priced them against the thing they
> were told about. This goes further by making **every stage gated**, and by naming the
> lock in the action that causes it, so the player is never surprised by a door
> closing. Worth adopting wholesale: a lock should be announced by the thing that shuts
> it, not discovered by the thing it refuses.

**2. Roles are editable before the lock.** There is an explicit add-role action, and
the story can be unlocked again.

> So the pre-written roles are a **starting point, not a fixture**. The player can
> extend the cast and presumably reshape it, until the writer is hired. That resolves
> the tension noted earlier between authoring and discovering: the material arrives
> written, and the player edits it until they commit. Both models, sequenced — which is
> exactly the resolution suggested in §5.2, arrived at independently by the game.

**3. Principal roles and additional roles are counted separately**, and on this
property the additional roles outnumbered the principals.

> Two tiers of cast with different depth: a small set of fully specified parts, and a
> larger set of thinner ones. SLATE's six billing rungs were one flat list with a
> weight each. A second tier costs money and fills a screen without needing a
> character age or a stunt rating, which is a sensible economy.

**Parental guidance age** sits in the production department as a project field.

> A rating is a production decision with audience consequences, and it pairs with the
> demographic audience bands found on the source. SLATE has neither. Together they are
> one mechanic: what you are allowed to show, and who is therefore allowed to come.

## 7. The schedule and the budget — the whole economic engine, on one screen

The production department's pre-production view resolves everything §5.3 implied. A
picture's cost is **not** a figure anybody enters. It is built, and this is the build:

**Three phases, each with a month count and a cost:** pre-production, production,
post-production. Beneath them a **total production months** figure and a **production
budget** that is the sum of the three. Beneath *that*, the three phases laid out as
**dated calendar windows**, running consecutively from the month after the current one.

### 7.1 What this means, stated as the model

> **Cost = Σ over phases of (months in phase × that phase's monthly rate).**
>
> And the phase rates are not uniform — they are driven by the production-demand
> ratings carried on the material. On the property surveyed, whose creature and visual
> effects were both rated at maximum, **post-production was the most expensive phase
> per month, by a wide margin, and cost more in total than the shoot.** That is the
> department engine working exactly as it should: heavy effects load post, and the
> schedule shows it without anybody writing a rule that says so.
>
> Two further observations worth keeping. The **approximate budget shown on the source
> before purchase was lower than the computed budget once scheduled** — so the figure
> on the property is genuinely an estimate, and the real number only exists once a
> schedule does. And the phases are **consecutive dated windows**, not abstractions, so
> a delivery date falls out of a start date plus the month counts.

### 7.2 Against SLATE, and this is the largest single gap closed

SLATE's deleted build had `budgetCents` as one number, written at the greenlight by
the player, charged once, and read by almost nothing. The plan file's Phase C asked for
"the accurate department engine behind each" department and could not say what that
engine was.

**It is this, and SLATE already has every primitive it needs:**

| What is needed | What SLATE already had |
|---|---|
| phases with month counts | `Period` with `per` ratios and `layOut` |
| per-phase rates | `Period.unit { one, many, aWeek }` |
| a department moving cost and speed | `Period.converts { at, hands, upTo, ofTheSpend }` |
| dated consecutive windows | `layOut(plan, baseWeeks, at)` |
| a total that is a sum, never typed | the ledger rule the project already enforces |

So the rebuild does not need new machinery here. It needs `Period.converts` —
currently proving the pattern on the cutting room alone — **generalised so every
department has a rate, and the rates driven by the material's demand ratings.** The
budget then stops being a number and becomes a consequence, which is what the house
standard has been asking of it all along.

### 7.3 The falsifiability test, already passed by their model

Change an input and the outcome moves, visibly, without anybody typing a figure:

- lengthen any phase → that phase's cost and the total both move
- take material with heavier effects → post's rate rises and the total follows
- move the start month → every window slides and the delivery date with it

That is the standard SLATE holds itself to, and their schedule screen demonstrates it
three ways at once. It is the single best argument for building the budget this way.

## 8. What a project *is* — four axes, not one

The project's own definition screen separates things SLATE collapsed into a single
`formatId`:

- **Project type** — a cycling field, currently a motion picture. Other values exist.
- **Release type** — a separate toggle, currently a theatrical release.
- **Production type** — a third field, live action or animation.
- **Franchise qualified**, and separately **franchise** — two booleans, not one.
- **Universe**, with a **universe timeline position**, a description, and an action to
  create a new universe.

### 8.1 Three findings

**1. Format is three orthogonal axes, not one enumeration.** What it is, how it reaches
an audience, and how it is physically made are independent. SLATE's `FORMATS` table
had six rows — feature, tv-movie, miniseries, anthology, serial, micro — each carrying
its channels, parts, runtime and legs together in one row.

> That was a reasonable compaction and it hid a real combinatorial space. Animation
> versus live action is not a format, it is a production method that applies to any
> format and changes every department's rate. The same goes for release type: a feature
> that goes straight to a service is a different business from one that opens in
> cinemas, and SLATE modelled that as `channels` on the format row rather than as the
> player's decision. Splitting the axes costs a little tidiness and buys a much larger
> and more honest decision space.

**2. Franchise status is earned, then declared.** "Qualified" and "franchise" being
separate fields means the first is a derived condition — something the picture has to
*become* eligible for — and the second is the player's declaration once it is.

> SLATE's lineage began the moment a follow-up was made; there was no threshold and
> nothing to earn. A two-step — qualify, then declare — makes a franchise an
> achievement with a gate, and gives the player a decision at the gate.

**3. A universe has an internal timeline, and a picture sits at a point on it.**

> **This is strictly richer than what SLATE built.** SLATE had `universeId` for the
> shared world and `ordinal` for position within a *line* — but ordinal was release
> order, not in-world chronology. A universe timeline position says *when inside the
> story world* a picture happens, independently of when it was released. That makes
> prequels, interquels and out-of-order releases representable, and each of those has a
> different relationship to the audience the world has already built.
>
> SLATE's `fromTheWorld` damped inheritance by how deep into a universe a picture sat.
> With a timeline it could do something far better: read the *distance* between this
> picture and the ones the audience already knows, in story time as well as release
> order.

## 9. The rating — a ceiling chosen up front, not a label applied at the end

A project carries a **parental guidance age**, picked from a short ladder of age
thresholds as a radio group. Beneath it sit seven **content dimensions**, each rated
and each with a counter: language, violence, sensuality, fear, jump scares, gore,
controversy.

### 9.1 The star colours, now confirmed

This screen resolves the yellow/blue distinction first seen on the storytelling
attributes:

| Colour | Meaning |
|---|---|
| **yellow** | what the material currently has |
| **blue** | headroom still permitted at the chosen rating |
| **grey** | beyond what the chosen rating allows at all |

A counter beside each dimension shows how much has been added, and a marker flags the
dimension sitting hard against its ceiling.

> That also reinterprets the storytelling attributes screen retroactively: those blue
> stars were **available headroom to develop into**, not decoration. So story quality
> is not purely inherited from the material — the player can raise it, up to a cap, and
> the cap is visible. That is the resolution of the authoring-versus-discovery tension
> in §5.2, and the game shows it in the interface rather than hiding it.

### 9.2 The mechanic, and why it is good

> **Choosing the rating chooses the ceiling.** A lower age threshold greys out content
> the player cannot then use; a higher one opens headroom but narrows who is allowed to
> come. Combined with the primary and secondary **audience bands** carried on the
> source, this is one decision with consequences pulling in opposite directions — the
> exact shape of a good mechanic.
>
> And it runs the causality the right way round. A rating is not a consequence
> discovered after the picture is made; it is a **constraint accepted before it is**,
> which is how it actually works in the business and how it becomes a decision rather
> than an outcome.

### 9.3 Against SLATE

SLATE has **neither half**. No rating, no content dimensions, and no demographic
audience for a rating to gate access to. Its audience is an undifferentiated quantity
that a genre points at six dials.

> This is a large addition, and the two halves have to arrive together or neither
> bites: a rating with no demographic model caps content for no reason, and a
> demographic model with no rating has nothing to constrain it. Built as a pair they
> give SLATE a whole decision it currently lacks — and they connect to things it
> already has, because the content dimensions are demands on the cast (§5.4's stunts,
> make-up and intimate scenes) and on the effects departments (§7's monthly rates).
>
> Worth noting what SLATE should **not** copy: the seven dimensions as a fixed list.
> The house rule applies — each one earns its place only if something reads it. Three
> that reach the cast, the departments and the audience are worth more than seven that
> only tint a label.

## 10. The department engine — the most important screen in the survey

The production phase breaks into **named departments**, each laid out identically.
Observed on this picture: production crew, stunts, make-up effects, practical effects,
with more below the fold. The phase also carries a **film type** toggle — colour or
monochrome — as a production-wide choice.

### 10.1 The shape of one department, which is the whole engine

Every department shows exactly three rows:

1. **A team rating** — one to five, **the player's choice**, with headroom shown in
   blue. Beside it, a **cost per month**.
2. **A demand level** — one to five, **read off the material**, marked with an arrow
   and capped. Beside it, **a number of months**.
3. **A total**, in red.

And the total is simply:

> **department total = (cost per month, set by the team rating you hire)
> × (months, set by how much the material demands)**

The arithmetic was verified on every department visible: each total is exactly its
monthly cost multiplied by its month count, and a department whose demand is zero shows
zero months, zero cost and zero total — it **does not exist on that picture at all.**

### 10.2 Why this is the right model, in the project's own terms

It passes the falsifiability test three separate ways, and each is a different input:

- **Hire a better team** → cost per month rises → the total rises. The player is buying
  quality and paying a rate for it.
- **Take material that demands more** → months rise → the total rises. The property's
  demands reach straight into the schedule.
- **Take material that demands nothing of a department** → that department costs
  nothing and occupies no time. It vanishes rather than being a zero line.

Nothing here is a multiplier applied to a base. Every figure is a rate or a duration,
and the money is the product. **A ledger balance is never a number somebody typed —
it is the sum of postings**, and this is that rule applied to a budget.

### 10.3 What SLATE builds from it

This resolves the plan file's Phase C completely. It asked for "the accurate department
engine behind each" department and could only gesture at what that engine was. Here it
is, and SLATE already holds every primitive:

| The engine needs | SLATE already has |
|---|---|
| a department with a rate and a duration | `Period` with `unit { one, many, aWeek }` |
| a hire that moves cost and speed | `Period.converts { at, hands, upTo, ofTheSpend }` |
| demands read off the material | nothing — **this is the new part** |
| a total that is a product, not a field | the ledger rule already enforced |

So the build is: **give the material demand ratings, give each department a rate set by
who is hired into it, and multiply.** `Period.converts` already proves the pattern on
the cutting room — hands there move cost and speed exactly this way. It needs
generalising, and the demand ratings need somewhere to come from.

Two design consequences worth recording now, before the rebuild:

**A department that a picture does not need should disappear, not sit at zero.** That
is what makes a small picture feel small rather than like a large one with empty rows.

**The team rating is where the player spends judgement, and the demand is where the
material speaks.** Keeping those two in separate rows, visibly, is what makes the
screen legible — the player can see which half of the number they control.

### 10.4 The piece that makes it a schedule: costs sum, durations max

Post-production repeats the department layout exactly — an editing, sound design and
mixing department, and a visual effects department, each with a team rating driving a
monthly cost and a material-driven demand driving a month count.

But its **phase totals** reveal the scheduling rule, and it is not what the
pre-production screen alone implied:

> **Phase cost = Σ of its departments' totals.
> Phase duration = MAX of its departments' month counts.**

Verified: the phase ran as long as its single longest department rather than the sum of
them, and the binding department's month count was highlighted to mark it as the
constraint. The phase cost was the plain sum of both departments.

**So departments within a phase run in parallel.** The phase is as long as its slowest
department, and every other department finishes early and stops costing. That single
rule produces three behaviors a studio game needs:

- **A critical path exists.** One department is always the reason the picture is not
  finished, and the interface names it.
- **Shortening the wrong department buys nothing.** Cutting a department that was never
  binding saves money and no time at all.
- **Heavy effects lengthen the picture, not just its bill.** On the picture surveyed,
  visual effects alone set the length of post and cost more than everything else in
  that phase combined.

> **Against SLATE.** SLATE's `Period` already has `runsWith` for overlap, which is
> the harder half of this and is already built. What it lacks is the framing: periods
> are laid out from plan ratios by `layOut`, so a phase's length comes from a content
> table rather than from **what the material demands of the departments inside it**.
>
> Invert that and SLATE gets a critical path for free. The plan file's complaint that
> the player "cannot lengthen post, shorten prep or overlap anything" is answered not
> by exposing the ratios as sliders — which would be a number the player types — but by
> letting the departments decide, and letting the player change the departments.

## 11. The full department map, and the lock chain that sequences it

Scrolling the project rail reveals **six departments**, in a fixed order:

| # | Department | Its actions |
|---|---|---|
| 1 | **Story** | assistant · project graphic · development to date · format · storytelling attributes · roles · additional roles · roles by category · add role · unlock story · **hire a writer (locks the story)** |
| 2 | **Production** | assistant · parental guidance age · pre-production · production · post-production · all production · **lock production budget** · unlock production budget |
| 3 | **Talent** | assistant · lock production screenplay · **hire talent personally** · **open casting call** · lock talent contracts |
| 4 | **Advertising** | assistant · advertising budget |
| 5 | **Merchandise** | assistant · goods and products · soundtrack · bonus features · lock merchant contracts |
| 6 | **Executive office** | assistant, and more below the fold |

### 11.1 The lock chain — the real structure of a turn

Most talent, advertising and merchandise actions render **greyed out** on a project
whose story is not yet locked. The locks are not independent switches; they are a
**chain**, and each department's work is gated behind the previous one's lock.

The observed order: lock the story → a writer is hired and writes → lock the
screenplay → talent may be hired → lock the talent contracts → the budget can be
locked → advertising and merchandise open.

> **This is the spine of the whole game, and it is worth taking wholesale.**
>
> SLATE had three locks — shape, cast, opening — each shut by a specific command, with
> sound reasoning behind each. But they were a flat set of guards, not a sequence, and
> nothing in the interface told the player what order to work in. The result was a
> production floor where the refusals existed and the *path* did not.
>
> A chain does three things a flat set cannot. It makes the next action obvious without
> a tutorial, because everything else is visibly greyed. It makes each lock a genuine
> commitment with a stated price — you cannot cast until the script is fixed, because
> nobody signs to a script that might change. And it gives the whole project a single
> legible state: **which link you are on.**
>
> SLATE's `Project.locked` array already stores exactly this. What it needs is an
> **order**, a rule that an action is offered only when its predecessor has shut, and
> a screen that shows the chain rather than discovering it through refusals.

### 11.2 Two departments SLATE has no version of

**Advertising is a department with its own budget**, separate from production. SLATE
had `campaignCents` as a single figure passed to the opening command.

> Making it a department implies it has the same shape as the others — a rate, a
> duration, and something it reads. That is a much richer model of a campaign than one
> number, and it would let a campaign be long and cheap or short and expensive.

**Merchandise is a department with three distinct product lines** — goods, a
soundtrack, and bonus features — each separately contracted, with its own lock.

> SLATE's ancillary system covered merchandise and a soundtrack and got the shape right
> (a guarantee now against a share later, refused on genres nobody wants it from).
> **Bonus features is new** and interesting, because it is the one product that exists
> only because the picture was *made* rather than because of what it is about — it is
> a by-product of production, not of the story.

**Two distinct routes into casting** are visible: hiring somebody personally, and
opening a casting call.

> A direct approach to a named person versus an open call is a real choice with
> different costs and different odds — and it pairs with the earlier finding that
> talent can refuse. SLATE drew a shortlist and let the player pick from it, which is
> neither of these.

### 11.3 The executive office — where a project lives or dies

The sixth department carries the decisions that belong to nobody else:

- **cost to date** — what has been spent so far, at any point
- **kill this project** — available immediately, and not greyed
- **greenlight this project** — gated
- **production problems** — gated, and therefore a system that fires later
- **release** — gated

> **Killing is always available; greenlighting is earned.** The asymmetry is the point.
> A project can be abandoned at any moment, carrying whatever it has already spent as a
> loss, and the cost-to-date line sits directly above the kill action so the player is
> looking at the sunk figure when they decide.
>
> SLATE had `production.shelve`, which took a picture off the slate and could put it
> back. That is a gentler thing than a kill, and both are worth having: shelving is
> deferral, killing is writing off. SLATE never had the write-off, and a studio game
> without one has no way to be wrong expensively and survive it.

**Production problems** is greyed on an unstarted project, which means it becomes live
once the picture is shooting.

> An event system attached to production. SLATE has a scheduler, notifications and a
> decision queue — all the machinery — and never pointed any of it at a picture in
> flight. Nothing could go wrong during a shoot: no overrun, no weather, no injury, no
> department failing to deliver. The research this project has already gathered names
> yield as a per-department property — *"an attempt does not deterministically produce
> its intended output"* — and this is where that belongs.
>
> It also pairs with the finding that talent die: the worst production problem a studio
> can have is that somebody is gone halfway through, and both halves of that mechanic
> exist here.

---

## 12. Coverage matrix — the skeleton

What the reference game contains, what SLATE has against it, and what remains to be
surveyed. **Status** is the survey's own progress, not the rebuild's.

| Area | Surveyed | SLATE's position |
|---|---|---|
| Setup: studio, player, rivals, territories | ✅ full | SLATE stronger on player and world; weaker on rivals |
| Setup: difficulty parameters | ✅ full | exposes loans, overhead, audition caps — all absent |
| Setup: game options | ✅ full | ageing, death, finite career, pitch meetings — all absent |
| Frame: month clock, cash header, navigation | ✅ full | SLATE has richer time, no explicit month commit |
| Origination: four routes, supply churn | ✅ full | provenance inverted; no finite pool |
| Source property schema | ✅ full | no demographics, one genre field, no demands |
| Roles and role categories | ✅ full | ordinal billing only; no age, fit or traits |
| Schedule and budget model | ✅ full | **the largest gap, now fully specified** |
| Department engine | ✅ full | primitives exist; demands are the missing input |
| Rating and content ceilings | ✅ full | neither half exists |
| Project definition axes | ✅ full | one `formatId` where there are three axes |
| Department map and lock chain | ✅ full | three flat locks, no sequence |
| Talent department, casting routes | ⬜ gated behind the screenplay | shortlist only |
| Advertising department | ⬜ not yet | one `campaignCents` figure |
| Merchandise department | ⬜ partial | ancillaries close; bonus features new |
| Executive office: greenlight, release | ⬜ gated | commands exist |
| Production problems | ⬜ gated | no event system on a picture |
| Financial reports | ⬜ not yet | ledger exists and is stronger |
| The bank and borrowing | ⬜ not yet | absent entirely |
| Bungalows | ⬜ not yet | absent entirely |
| Pitch meetings | ⬜ not yet | absent entirely |
| Awards and the year | ⬜ not yet | built and deleted; rebuildable |
| End of month cycle | ⬜ not yet | month tick exists, fires unattended |
| Box office and release results | ⬜ not yet | accumulator built and deleted |

**To proceed past the gated rows the project has to be driven forward** — a writer
hired, the screenplay written over several months, the budget locked. That means
ending months, which is also the only way to observe the monthly cycle, the churn of
the source pool, and production problems. The survey and the Monte Carlo work converge
at that point: playing the game forward *is* the remaining method.

### 11.4 The lock is confirmed before it shuts, and it names what it freezes

Choosing to hire a writer does not act immediately. It presents a confirmation that
restates what the project is, warns that the story is about to lock, and **names the
three things that become immutable** — the storytelling attributes, the roles and the
additional roles. Only then is the action offered, and the action itself is labelled
with the deliverable it buys: a **first draft**.

> Two mechanics in one screen.
>
> **A lock announces itself, specifically.** Not "this cannot be undone" but a list of
> exactly which fields freeze. That is the difference between a warning and a
> briefing, and it is what lets a player commit confidently rather than defensively.
> SLATE's locks were discovered by bumping into a refusal after the fact; the refusal
> text was good, but by then the door had already shut. Naming the fields *before* the
> action is strictly better and costs nothing but the sentence.
>
> **A draft is a named deliverable, not a state change.** Calling the purchase a first
> draft implies later ones — which is where the rewrite counter observed on the
> development ledger comes from. So the writing process is **staged**: a draft
> arrives, and further drafts can be bought, each with a cost and a delay. SLATE's
> `production.write` set six dials in a single instantaneous command with no artefact
> and no elapsed time.

---

## 13. The tooling limit, and what it means for the rest of the survey

**Reading the game works completely. Driving it works only halfway.**

`PrintWindow` captures the game's own pixels reliably, works while the window is
behind other windows, and cannot capture anything else on the desktop. That half is
solved and should be reused.

Input is the problem, and the boundary is sharp:

| Works | Does not work |
|---|---|
| menu and rail items | action controls in the centre panel |
| list rows | the selector glyphs beside a field |
| scrolling any panel | anything that commits a change |

**Three methods were tried against one action control and all three failed:**

1. **Warp and click** — `SetCursorPos` then `mouse_event` down/up. Works everywhere
   in the rail. Ignored by the action control, at three different hit points along
   the row.
2. **Posted messages** — `PostMessage` of `WM_MOUSEMOVE`/`WM_LBUTTONDOWN`/`WM_LBUTTONUP`
   to the window handle. Ignored entirely, everywhere, including by the rail. This app
   takes no notice of synthesised messages.
3. **Glide and click** — walking the cursor to the target in twenty steps to generate
   genuine movement before the click, on the theory that a custom-drawn panel tracks
   hover. Also ignored.

**Two things were ruled out rather than assumed.** A window enumeration of the process
confirmed there is **exactly one visible window**, so no dropdown or popup was opening
unseen. And scrolling after the click confirmed nothing had expanded below the fold.

The app is WinForms, and the working theory is that the rail is composed of ordinary
controls while the centre panel is custom-drawn and validates input in a way
synthesised events do not satisfy. That is a guess; what is certain is the boundary in
the table above.

### 13.1 What this means for finishing the survey

Everything still unmapped sits behind an action control: hiring, casting, greenlighting,
advertising, merchandising, releasing, and ending a month. **The survey cannot be
completed by automation alone.**

The arrangement that does work, and it works well: **a person clicks, and this tooling
captures and reads.** Capture is instant, costs nothing, and the reading and analysis —
which is the actual work — is unaffected. A few seconds of human clicking unlocks each
remaining area.

Recorded here so that a later session does not spend another hour re-deriving the same
three dead ends.

---

## 14. The talent system — one pool, attribute vectors, matched to the job

Hiring opens a full-screen search over the talent pool. The pool observed carried
**several hundred people**, and the screen is built for querying it rather than
browsing a shortlist.

### 14.1 The structure

**A filter built from the attributes themselves.** The player sets a desired level on
each attribute and the list narrows, with an exact-match option for literal results.
So hiring is **a search against requirements**, not a pick from an offered list.

**Two attribute groups, and which one matters depends on the job:**

- **Writer attributes** — story scope depth, character development, intelligence,
  dialogue, pace.
- **Talent attributes** — action, comedy, drama, singing, dancing, screen presence,
  sex appeal, humility, and more below the fold.

**One table for everyone.** Writers and performers are the same records; the job being
filled decides which group of attributes is read.

**The list columns** show, per person: a name, a **salary**, a **percentage**, a rating
on each of the five writing axes, a **country**, and an **ethnicity**.

### 14.2 The finding that matters most

> **A writer's attributes are the same five axes as the story's qualities.**
>
> Story scope depth, character development, intelligence, dialogue and pace appear
> twice: as properties of the material, and as properties of the person hired to write
> it. That is the causal link the whole development phase turns on — **you hire the
> script you want by hiring the writer who makes it.** Hire someone strong on dialogue
> and the draft comes back stronger on dialogue.
>
> It also explains the blue headroom stars on the storytelling attributes screen. The
> material arrives at some level; the writer determines how far up the available
> headroom it actually moves. Discovery and authoring, joined by a hire.
>
> **SLATE had no version of this at all.** Its talent carried a single `standingId`
> rung and a `reach` number, and its writer post contributed to a craft axis average.
> Nobody had a shape — just a magnitude. Two writers at the same standing were
> interchangeable. Here they are not remotely interchangeable, and choosing between
> them is the decision.

### 14.3 The rest, briefly

**Salary and a percentage side by side** confirms what the development ledger implied:
a deal is cash *and* participation, not one or the other. SLATE forced an either/or
across three deal shapes; this is the more general form.

**Country and ethnicity are fields on a person**, and roles carry species, gender and
age. So casting is a **matching problem across several dimensions**, and the pool is
searchable precisely because matching by eye across hundreds of people would be
impossible. The search UI is not convenience — it is what makes the mechanic playable.

**Humility sits among the performance attributes**, which is a behavioural trait rather
than a capability. Worth returning to: it likely reaches negotiation, or the chance of
refusal, or on-set problems — and if so it is the first attribute seen that is about
what somebody is *like* rather than what they can *do*.

### 14.4 What SLATE should take

| Mechanic | Why |
|---|---|
| one talent table, job decides which attributes are read | avoids parallel tables for writers, crew and cast |
| attribute vectors instead of a single rung | makes two people at the same price genuinely different |
| the writer's axes being the story's axes | gives the hire a visible, causal consequence |
| search-by-requirement over a large pool | a shortlist hides the decision; a query is the decision |
| cash and participation together on every deal | strictly more general than an either/or |

SLATE's `STANDINGS` ladder still has a job — it prices people and moves on results.
But it should sit **beside** an attribute vector, not instead of one.

### 14.5 The deeper attribute set — capability, temperament, and specialism

Scrolling the attribute panel reveals that the earlier list was only the top of it. The
rest splits into three kinds of thing, and the split is the important part.

**Capability — what they can do**
story sense · epic story sense · effects · genre proficiency

**Temperament — what they are like to work with**
authority · **on budget** · **perfectionist** · **script as written** · humility

**Specialism — a named genre**, not a rating. A person has a genre they are best at,
stated as that genre rather than as a number, with a separate proficiency rating
beside it.

> **The temperament group is the most valuable thing in this section**, because every
> one of those traits is a hook into a system that already exists elsewhere in the
> game.
>
> - **On budget** reaches the cost model directly. Somebody who does not keep to budget
>   is how an overrun happens, and overruns are what the production-problems system
>   fires about.
> - **Perfectionist** reaches the rewrite counter and the rounds-per-approval lever the
>   project's own research called *"the universal cost multiplier and the main lever an
>   auteur pulls."*
> - **Script as written** reaches the storytelling attributes — somebody who deviates
>   changes the thing you hired them to make.
> - **Authority** and **humility** reach negotiation and, presumably, whether people
>   refuse you.
>
> This is what "everything reads and bites" looks like in practice. **Not one of these
> is a label.** Each one is a number that some other system consumes, and together they
> make two people with identical capability ratings genuinely different hires.
>
> SLATE has nothing in this class at all. Its talent carried a standing, a reach and a
> run of results — all of them about *how good* and *how expensive*, none about *what
> they are like*. Adding a temperament vector is the single cheapest way to make its
> talent pool feel populated rather than priced.

### 14.6 The filters, which reveal four more mechanics

The search carries toggles that only make sense if the systems behind them exist:

| Filter | The mechanic it implies |
|---|---|
| only talent I have worked with | **a relationship history per person** |
| exclude those already hired | **people are engaged elsewhere** — the pool is genuinely contested |
| available now | **availability is a state that changes over time** |
| wants to try acting · wants to try directing | **people have ambitions to change discipline** |

> The last one is the surprise and the best of them. **A writer can want to direct.** A
> career is not a fixed lane — somebody can be seeking a move, and presumably a studio
> that gives them the chance gets something for it: a cheaper hire, loyalty, or a
> gamble that pays off. That is a whole relationship mechanic hanging off one boolean.
>
> SLATE's `Talent.worked` counted pictures made for the company, which is the first
> row of this table and none of the other three. Its people had no availability, were
> never engaged elsewhere, and had no ambitions.

### 14.7 The remaining filters — four more systems named

| Filter | The mechanic behind it |
|---|---|
| wants to try **acting · directing · writing** | three disciplines, and people can want to cross between them |
| new only · new this year | **newly discovered people are a distinct cohort** |
| movie nomination · movie award | **award history is a durable property of a person** |
| series nomination · series award | **and movies and series are tracked as separate award careers** |
| discover and hire new talent | discovery is **an explicit action**, not a background process |
| worldwide talent search | the talent pool has **geographic scope** that can be widened |

Four findings worth separating out:

**1. Awards belong to people, and are searchable.** A nomination and a win are both
recorded, separately, and a studio can search for people who have them. So an award is
not an event that happens to a picture and fades — it is a permanent line on a career
that changes what that person costs and how they can be found.

> SLATE's ceremony did write results onto everybody credited, and `standingAfter`
> moved careers on runs of three. But a win and a nomination were not distinguished,
> and nothing could be *searched* for. Making award history a queryable property is
> what turns it from a notification into a market signal.

**2. Movie and series award careers are separate.** Somebody can be decorated in
television and unknown in film.

> SLATE's `AWARDS` table had seven categories and one ceremony covering everything.
> Two tracks is more honest and it gives television its own ladder to climb, which
> matters in a game where a studio can choose to work in either.

**3. Discovery is an action the studio takes.** There is a command to go and find new
people, and newly found people form a cohort that can be filtered for.

> This is the mechanic behind the finite, contested pool. The pool is not fixed — it
> can be *expanded by effort*, and presumably at a cost and with uncertainty. A studio
> that invests in discovery gets cheaper talent before anybody else knows about them,
> which is one of the few genuine edges a small studio has over a large one.
>
> SLATE minted people on demand whenever a shortlist was drawn. Nobody was ever found,
> because nobody was ever scarce.

**4. The talent pool has geographic scope.** People carry a country, and the search can
be widened worldwide.

> This connects to a system SLATE already has and is strong at — the gazetteer, the
> shooting location and the rebate engine that reads where money was spent. A talent
> pool with nationality plugs straight into it: hiring abroad, working abroad, and what
> each does to a rebate.

## 15. A person, in full — and what a hire actually does

### 15.1 The person record

Selecting somebody opens their record, and it is far richer than the list columns
suggest.

**Identity and terms**
name · age · salary · points percentage · **pay or play** · **best known as** (their
primary discipline) · **wants to try** (the discipline they are seeking, or none)

**Three separate attribute sets on the same person**, selectable as tabs:
**talent attributes · director attributes · writer attributes.** One human being, three
professional capabilities, and the job being filled decides which set is read.

**Career record, kept as counts and money**
pictures made and **how many were bombs** · total grosses · streaming titles and how
many bombed · **hours watched** · **movie awards as wins over nominations** · **series
awards as wins over nominations**

**And the field that matters to the schedule: time to complete.** This writer would
take a stated number of months to deliver.

### 15.2 Four findings

**1. Delivery time is a property of the person, not the task.** Hiring a faster writer
buys months. That connects the talent market straight to the schedule and to the
overhead clock: a cheap slow writer and an expensive fast one can cost the same once
the monthly burn is counted, and working that out is the decision.

> SLATE's development had no elapsed time and no person attached to it. This single
> field turns hiring into a scheduling decision.

**2. Pay or play is a contract term on the record.** A guarantee that the fee is owed
whether or not the picture is ever made.

> SLATE's three deal shapes — fee, points, threshold — were all about *how much* and
> *when*. Pay or play is about **what happens if you cancel**, which is the term that
> makes killing a project expensive. It pairs directly with the kill action in the
> executive office.

**3. A career is measured in both currencies, separately.** Theatrical performance is
counted in grosses; streaming performance is counted in **hours watched**. Bombs are
counted explicitly rather than inferred.

> Two different success metrics for two different businesses, held on the same person.
> SLATE's `Talent.results` was a single boolean run — returned its cost or did not.
> That cannot express somebody who is enormous on a service and cannot open a cinema.

**4. Wins and nominations are tracked separately, per medium.** A record of four
numbers, not one.

### 15.3 What the hire does

Confirmed by observation rather than inference:

- **The full salary left company cash immediately**, on hiring. Not on delivery, not
  spread across the months of work. The money goes when the deal is struck.
- **The project's state line changed** to say the first draft begins this month, so the
  work is scheduled rather than instant.
- **Padlocks appeared on exactly the fields the confirmation named** — the storytelling
  attributes, the roles, the additional roles, and the ability to add one. Nothing else
  locked.
- The hire action and the unlock action both **disappeared from the rail** rather than
  greying, because neither is meaningful any more.

> That last detail is a small piece of interface craft worth copying: an action that
> has become impossible is greyed, an action that has become **meaningless** is
> removed. SLATE greys everything, which makes a rail longer than it needs to be.

## 16. The month end — the heartbeat, and the overhead proven

Ending a month advances the date and produces a **report screen**, which is the game's
actual pulse. Observed on the first month closed:

**The charge.** Company cash fell by exactly the monthly studio expense, automatically,
with no player action. Separately, the writing fee had already left when the writer was
hired. So in a single month the studio paid a one-off deal and a standing overhead, and
only one of them was a decision.

> **This is the price-of-time model, proven rather than inferred.** The writer takes
> several months to deliver a first draft. Every one of those months costs the studio
> its overhead whether or not anything happens. So the true cost of that script is the
> fee *plus* the burn across the delivery time — and a faster, dearer writer can be
> cheaper in total. That is the trade the game stated on the source-material screen,
> and here it is executing.
>
> SLATE cannot express any of this, because its company has no standing cost. Time
> passes for free.

**The report's shape:**

- a **this month** panel naming what happened and what it cost
- **studio highlights**, listing every studio in the world including the player's, so a
  month is reported competitively rather than privately
- **other news**, categorised into film, series, talent, talent releases and
  miscellaneous, with categories greyed when they have nothing in them

> Two things worth taking. The month-end is **one screen that answers "what just
> happened"** — SLATE fires notifications continuously and has no such moment. And the
> rivals appear in the player's own monthly report, which is how a world stays present
> without simulating it: five named studios each get a line, every month, forever.

**Six studios exist in total** — the player's and five rivals — which matches the
number SLATE's own deleted rivals table carried.

---

## 17. What can be driven, revised

The tooling limit recorded in §13 was **too pessimistic** and is superseded here. After
further testing, the boundary is narrower than it looked:

| Responds to synthetic input | Does not |
|---|---|
| rail and menu items | text selector rows in the centre panel |
| **list rows** (source lists, talent lists) | the glyph controls beside a field |
| **toolbar icon actions**, including committing ones | |
| **the end-of-month control** | |
| scrolling any panel | |

A hire was executed end to end this way: selecting a person from the list, then
triggering the deal from the toolbar. Money moved, state advanced, locks applied.

> **So the survey can be driven after all**, and so can the Monte Carlo work: a career
> can be played forward month by month, because ending a month is a control that
> answers. What cannot be reached are the field-level selectors — changing a rating,
> flipping a toggle, choosing from a dropdown. Those still need a human.
>
> Practically: **structural play works, fine-tuning does not.** Enough to run a career
> on default settings and measure it, which is exactly what a Monte Carlo pass needs.

### 16.1 Movie news — the rivals are simulated, not drawn

The film news category reports **what every other studio started this month**. Each
entry carries the studio's name, the project's title, its project and release type, and
**the cash that studio has committed to it**.

Several rival productions began in a single month, at committed budgets **well above**
what the player's own picture had been scheduled at.

> **This overturns the assumption SLATE built its rivals on.**
>
> SLATE's `content/rivals.ts` said so in its own header: the five studios *"have no
> finances, no talent and no history"*, and were deliberately a **release habit** — a
> frequency, a typical size, a set of channels — drawn from the seed to produce one
> number, how crowded a week is. The file even said that simulating them properly would
> be *"a great deal of machinery to compute a shadow."*
>
> That reasoning was sound for what SLATE was doing, and it is wrong for what the
> reference game does. Here rivals **commit real money to real projects on real dates**,
> and the player is told. Which means:
>
> - a rival's spend is **visible**, so the player can read the competitive landscape
> - rivals draw from the **same talent pool** the player does, which the hiring filters
>   already confirmed
> - rivals presumably take **source material** out of the same finite pool
> - and their pictures eventually **release**, which is where the crowding SLATE
>   modelled directly actually comes from
>
> So the crowding number SLATE computed from a habit is, here, an **emergent
> consequence** of five studios each running their own slate. That is more machinery,
> and it buys something SLATE could never have: a rival can be outbid, beaten to a
> property, or seen coming.

**What this does not settle** is whether rivals are fully simulated through the same
pipeline or given a cheaper approximation that produces a title, a budget and a date.
Worth establishing before the rebuild costs it, because the difference in cost is
enormous and the difference in what the player *sees* may be very small.

**A middle path worth considering for SLATE:** rivals hold a slate and a cash position
and contend for talent and material, but their pictures are reckoned by a simplified
model rather than the full accumulator. That keeps the contention — the part the player
feels — without running the engine six times.

### 16.2 Studio highlights — the month, per studio

The studio list in the month-end report is **selectable**: choosing a studio shows that
studio's month. Choosing the player's own shows their own summary — the overhead
charged and each project's activity with its cost.

> So the month-end is not one report but **six views of the same month**, one per
> studio, and the player's own is simply the one they happen to be running. That is a
> quietly elegant way to present a competitive world: the same format for everyone,
> and the player reads their rivals exactly as they read themselves.
>
> It also means rival activity is **browsable rather than pushed** — the news
> categories announce what happened, and the per-studio views let a player go and look.
> SLATE's notification queue pushes everything and offers nowhere to browse.

---

## 18. Controls catalogued so far

Every control encountered, with whether it responds to automation. Kept because the
rebuild needs the *inventory* of control types as much as the mechanics.

| Control | Where | Automatable |
|---|---|---|
| icon bar, two rows, context-sensitive | global header | ✅ |
| date and end-month commit | global header | ✅ |
| cash readout | global header | — display |
| project list rows | under the header | ✅ |
| department rail items | left column | ✅ |
| sub-item rail entries, greyed when gated | left column | ✅ |
| padlock markers on locked entries | left column | — display |
| assistant panel with next-action prompt | upper left | ✅ |
| free-text fields | centre panel | ❌ |
| two-state toggles | centre panel | ❌ |
| cycling list fields | centre panel | ❌ |
| picker/expander glyphs | centre panel | ❌ |
| star rating rows, yellow/blue/grey | centre panel | ❌ |
| radio ladders | centre panel | ❌ |
| scrollable panels, three independent | all panels | ✅ |
| searchable talent grid with sortable columns | lower panel | ✅ rows |
| filter toggles on the search | left of grid | ❌ |
| contextual toolbar, appears on selection | between panels | ✅ |
| news category list | month-end | ✅ |
| per-studio month views | month-end | ✅ |

## 19. The draft arrives — the writer mechanic, measured

Four months after the hire the first draft completed, and the month-end reported the
**finished story attributes**. Comparing them against the ratings the source material
carried before the writer was engaged gives the first real measurement of this survey.

### 19.1 What was observed

- **Four of the seven story attributes rose by exactly one star.**
- The rest were unchanged — including two that were already at maximum and so had no
  headroom to rise into.
- **Every remaining blue star turned grey.** The headroom that was not reached is now
  closed, not merely unfilled.

### 19.2 What that establishes

> **The blue headroom is a budget the writer spends, and it expires.**
>
> The material arrives with each attribute at some level and a visible ceiling above
> it. The writer raises some attributes into that space, and whatever they do not reach
> is **lost permanently** — grey, not blue. So a draft is a one-shot conversion of
> potential into fact, and the writer decides how much of it converts.
>
> That makes the hire genuinely consequential in a way SLATE's never was. SLATE's
> `production.write` let the player spend a fixed attention pool across six dials
> instantly and for free. Here you are buying **somebody else's judgement** about which
> of your material's possibilities to realise, you pay for it in fee and in months of
> overhead, and you cannot take it back.

**The rewrite counter now has an obvious purpose.** If a first draft converts only part
of the headroom, a rewrite is how a studio buys another attempt at the rest — at
another fee and another delay. That is the "rounds-per-approval" lever the project's
research called the main cost multiplier, and this is the shape it takes.

### 19.3 A caution before SLATE copies the mapping

The writer engaged was strong on some axes and weak on others, and the attributes that
rose were **not** a simple one-to-one image of the writer's own ratings. So the
relationship between a writer's profile and which attributes improve is **not a direct
copy**, and should not be assumed to be one.

> Establishing that mapping properly needs the falsifiability treatment this project
> already uses: hire writers with deliberately different profiles onto **the same
> material**, and read which attributes move. That is a controlled experiment, it needs
> several runs, and it is exactly what the Monte Carlo pass is for. Recorded here as
> **an open question with a stated method**, rather than guessed at.

### 19.4 Also observed

**A news category activated** the month the writer finished — the one covering talent
becoming available again. So a person's engagement genuinely ends and they return to
the pool, which is the other half of the "exclude hired" filter seen in the search.

**The project state advanced on its own.** No player action completed the draft; the
month tick did it. Work in progress is the scheduler's business, not the player's.

### 19.5 The state after delivery

With the draft in hand the project's next action changed, and the assistant panel
changed with it: the studio is now told to settle what it needs from the production
department so the **production budget can be locked**. The project's own state line
says the same thing.

Two details worth recording:

**The story fields stay padlocked, but the unlock became available again.** So the lock
is not permanent — it is reversible once the draft exists. What reopening costs is not
yet established, but it must cost something or the lock would be meaningless.

> That is a better shape than SLATE's. SLATE's locks were **one-way**: `shut()` wrote
> a lock id and nothing ever removed one. Irreversibility is easy to implement and it
> punishes a player for exploring. A lock that can be undone **at a stated price** is a
> real decision in both directions — and it makes the "be sure before you commit"
> warning a piece of advice rather than a threat.

**The state line and the assistant always agree**, and both name a single next action
belonging to a named department. Every screen so far has carried this. It is the
cheapest possible navigation aid and it removes the need for a tutorial: the game tells
you the one thing to do next, and where it is done.

> SLATE has notifications, a decision queue, and a tutorial with reachability
> conditions — considerably more machinery — and no equivalent of this one line. Worth
> building before any of the rest: **a project should always be able to say what it is
> waiting for.**

## 20. The confirmation pattern — a design rule, not a one-off

Both locks reached so far present the same three-part confirmation before committing,
and the consistency is what makes it a rule worth adopting rather than an incident.

**1. A prerequisite checklist, phrased as questions.** The budget lock asks whether the
rating has been set, whether pre-production has been set, whether production has,
whether post-production has. It does not block on them — it *asks*, because they all
have defaults and the player may legitimately accept them.

**2. A statement of what the lock buys and what it freezes.** Locking the budget is
what makes hiring talent possible, and while it holds, nothing in that department can
change.

**3. The named reversal.** The unlock is named in the warning itself, so the player
knows the door reopens and what it is called before they shut it.

> **This is the best interface idea in the survey and it costs almost nothing.**
>
> SLATE's locks were discovered by bumping into a refusal. The refusal text was well
> written — each one names a reason inside the fiction — but it arrives *after* the
> player has already tried something they cannot do, and the lock that caused it had
> shut silently at some earlier moment.
>
> Turning that inside out: **announce the lock at the action that causes it, list what
> freezes, and name the way back.** SLATE already has all the strings; what it lacks is
> the moment. A confirmation step before each `shut()` would convert a set of guards
> into a legible sequence of commitments.
>
> The prerequisite checklist is the subtle half. It is not validation — nothing is
> refused for being unset. It is the game saying *these are the things you might regret
> not having considered*, which is a different and more respectful thing than a
> required field.

### 20.1 The chain, as now confirmed by playing it

```
option material
  → hire a writer            [locks the story]
  → months pass, draft lands [story may be unlocked again]
  → set production choices
  → lock the production budget   [freezes the production department]
  → lock the production screenplay
  → hire talent / open a casting call
  → lock talent contracts
  → advertising and merchandise open
  → greenlight
  → release
```

Each arrow is gated, each gate is announced, and each gate has a named reversal. The
whole production floor is one sequence rather than a set of independent doors.

## 21. Escalating commitment — the lock chain is not a row of independent doors

The screenplay lock changes the whole reading of §20. Its confirmation states that
committing here will **permanently remove the two reversals already earned**: the story
can no longer be unlocked, and neither can the production budget. After it, nothing in
either department can change again.

So the chain is not a sequence of doors each with its own key. It is a **ratchet**:

```
lock story            → reversible
lock production budget → reversible
lock screenplay        → forecloses BOTH of the above, permanently
```

### 21.1 Why this is the best structural idea in the survey

> Reversibility **decays as commitment accumulates**, and it decays at a moment the
> player chooses rather than on a timer.
>
> Early decisions stay soft because nothing depends on them yet. The moment the studio
> is ready to put people under contract, everything upstream has to harden — because a
> performer signing to a script and a budget is entitled to have those be real. The
> fiction and the mechanic are the same thing, which is the mark of a good rule.
>
> And the player is told *exactly which reversals they are spending* before they spend
> them. Not "this is permanent" but "these two specific doors close."

### 21.2 Against SLATE, and what to build

SLATE had three locks — shape, cast, opening — written by `shut()`, never removed, and
each justified by a sentence about somebody having priced their deal against the thing
they were told about. **That reasoning was right and the implementation was the crudest
possible expression of it.** Everything was permanent from the first commitment, so
there was no soft period at all and no decision about when to harden.

The rebuild wants three things SLATE did not have:

1. **Locks that can be undone**, at a price, while nothing downstream depends on them.
2. **A cascade rule**: certain locks foreclose named earlier reversals.
3. **The foreclosure stated in advance**, by name, at the moment of committing.

`Project.locked` already stores the set. What it needs is an **order**, a
`forecloses` relation between entries, and the confirmation step from §20 to announce
it. That is a small amount of code for the single biggest improvement to how a
production *feels* to run.

### 21.3 A third casting route appeared

With the budget locked, the talent department revealed an option not previously
visible: alongside hiring somebody directly and opening a casting call, a studio can
**use a casting agent**.

> Three routes to fill a part, presumably trading cost against reach against control.
> SLATE drew a shortlist and let the player pick from it — one route, no trade. Worth
> establishing what each route actually costs before copying the shape.

## 22. Casting — the slate view, and the player's own credit

With the screenplay locked, the whole talent department opened at once and the
project's blocking state changed to say it has **no director**. So the order inside
casting is fixed: the director comes before the cast.

### 22.1 What the direct-hire screen shows

It is a **slate**, listing every above-the-line position and whether it is filled:

- **Producer — the player**, by name, already credited
- **Director — not hired yet**
- **Talent — each role in turn**, by number and role type, each marked as not yet cast

Two hiring actions sit above it, one for the director and one for the cast, so the two
are separate flows against the same pool.

### 22.2 The player is a credit on their own picture

> Small detail, large implication. The player is not an invisible hand issuing
> commands — they hold the **producer credit**, by name, on every picture the studio
> makes. That connects directly to the setup option seen in §1.4, where the player can
> draw a salary and take points on the studio's gross: they are a person in the
> industry, with a filmography, not just an owner.
>
> **SLATE is unusually well placed to take this and should.** It already has a named
> person with a family, a body, a household and a personal ledger kept strictly apart
> from the company's. What it has never done is put that person **on the work**. A
> producer credit per picture, accumulating into a personal filmography that is
> separate from the company's record, costs almost nothing and closes the gap between
> SLATE's two halves — the life and the business — which currently touch only through
> money.

### 22.3 Three routes to fill a part, now all live

Hiring somebody directly · opening a casting call · using a casting agent.

> Three routes implies three cost-and-outcome profiles. The obvious reading — direct is
> expensive and certain, a call is cheap and slow with an uncertain field, an agent
> sits between and charges for it — is a **guess** and is recorded as one. Establishing
> the actual trade needs each route run on comparable parts, which is a Monte Carlo
> question rather than an observational one.

### 22.4 Tooling note

The hire actions on this screen are the centre-panel control class and refuse
automation, consistent with §13 and §17. The casting *routes* in the rail are
reachable; the commits inside them are not.

### 22.5 The director search — same machine, different axes

The director search reuses the writer search exactly, with the attribute panel switched
to the **director** set. Confirming §14.1: one pool, one screen, and the job decides
which attributes are read.

**Director capability is measured on genre axes** — action, comedy, drama — rather than
on the story axes a writer is rated against. So a director is good at *kinds of
picture*, where a writer is good at *qualities of script*. The list columns change to
match.

**The temperament attributes are identical across disciplines** — authority, on budget,
genre specialty and proficiency, effects, perfectionist, script as written. So
temperament is a property of the **person**, and capability is a property of the
**person-in-a-discipline**. That is the right split and it is worth copying exactly.

**Two findings that are genuinely new:**

**1. Participation is role-dependent, not negotiated from zero.** Every director in the
list carries a **non-zero points percentage as standard**, where the writers surveyed
all sat at zero. So a director takes a share of the picture by default and a writer
does not, before any negotiation happens.

> SLATE's deal model let any post take points via `offersFrom`, with the same three
> shapes available to everybody. That is more uniform than reality and less
> interesting: if directors always take points and writers rarely do, then the *norm*
> is part of what each job is, and a writer who demands points is a signal about that
> writer. Worth encoding as a per-discipline default rather than a free choice.

**2. Script doctors are a separate hire, rated by genre.** Below the director
attributes sits a distinct category for script doctors, with its own genre-specific
ratings.

> This is the mechanism behind the rewrite counter found on the development ledger in
> §5. A rewrite is not an abstract cost — it is **hiring a specific person to do it**,
> and script doctors are a distinct profession with their own ratings rather than
> writers doing a second pass.
>
> That completes the development economy: a writer converts the material's headroom
> once (§19), and a script doctor is who you pay to have another attempt. SLATE had
> neither the rewrite nor anybody to perform it.

**Pool sizes differ by discipline.** The director pool was noticeably larger than the
writer pool on the same save, which implies either that the pool is genuinely
discipline-weighted or that the default filters differ per role. Worth establishing,
because it changes how scarce each kind of hire actually is.

**The project context panel travels with the search.** While hiring, the right-hand
side shows the picture's production genre, its genre, and its full rating with the
content ceilings. So the player is choosing a person **against the specification of the
thing**, on one screen, without navigating away.

> A small interface idea with real consequences: the decision and its criteria are
> visible together. SLATE's casting shortlist showed the people and nothing about the
> picture.

### 22.6 A director's record — contractual terms are person properties

Selecting a director shows the same record shape as a writer, with the **director**
attribute tab active and the other two selectable. But it carries three fields the
writer's did not, and all three are **terms rather than capabilities**:

**Minimum production budget requirement.** A figure below which this director will not
work. On the person surveyed it was zero, so it does not always bind — but the field
exists, which means a director can **refuse a picture for being too small**.

> A hard constraint running from the talent market straight into the budget. It also
> inverts the usual direction of pressure: normally the studio decides the budget and
> then shops for people within it. This lets a person the studio wants **force the
> budget up**. SLATE had nothing that could push a figure in that direction.

**Final cut** — a yes-or-no right held by the director.

> The single most consequential term in the business, and it is a boolean on a person.
> A director with final cut controls the finished picture; the studio does not. What it
> actually does mechanically is not yet established, but the obvious reading is that it
> removes the studio's ability to overrule post-production decisions, and that it is
> something expensive directors demand.
>
> SLATE has no concept of **control** as distinct from cost. Every deal in it was about
> money — a fee, points, a threshold. A term that transfers *authority* rather than
> money is a different axis entirely, and it is the one that makes hiring a great
> director a genuine risk rather than just an expense.

**Pay or play varies by person.** This director carries it; the writer hired earlier
did not.

> So it is not a universal contract type but a term individuals command, presumably by
> standing. That makes killing a project cost different amounts depending on who is
> attached — which is exactly the kind of accumulating consequence a studio game wants.

**Also on the record:** a work-scheduled indicator, confirming availability is a live
state; and the three attribute tabs with the active one marked, confirming one person
carries all three disciplines and the view switches between them.

### 22.7 A tooling regression, found and reverted

The gliding click added in an attempt to reach the centre-panel controls **failed at
that and broke list-row selection**, because walking the cursor across the column
headers pops a sort hint that intercepts the click. Four row selections failed in a row
before the cause was identified.

Reverted to the direct warp click, and row selection works again immediately.

> Recorded because it is a real lesson about this interface: **the column headers are
> hover-sensitive and will swallow a click that passes over them.** Any automation
> should land directly on its target and never travel across the header band.

## 23. The contract — and the sequel escalator, which is the best mechanic found

Selecting somebody presents a **project contract** alongside their record. It restates
the terms — salary, points, pay or play, final cut — and offers the acceptance action.
Two things sit beside it that change the whole shape of hiring.

### 23.1 Bundling disciplines in one deal

An option offers to have the same person **direct and write**, for a stated additional
fee shown right there.

> One person, three attribute sets (§14), and here is what that architecture is *for*:
> a single deal can engage somebody in **more than one discipline at once**, priced as
> an increment. A director who can also write is cheaper than hiring two people, and
> the studio takes whatever his writing attributes are rather than shopping for them.
>
> SLATE's posts were strictly one person per post. Nothing could hold two jobs, so
> nothing could ever be a bargain or a compromise in this way.

### 23.2 The sequel contract — terms agreed before the outcome is known

Beneath the project terms sits a **sequel contract**: a schedule of **revenue
thresholds**, each paired with the salary and points this person would receive on a
follow-up if the picture reaches that threshold. Several tiers, escalating — the higher
the picture performs, the more expensive the same person becomes next time, and **the
whole schedule is agreed now.**

> **This is the single best mechanic in the survey and SLATE has no version of it.**
>
> Three things make it excellent:
>
> **It prices the future at the moment of most uncertainty.** The studio agrees what a
> sequel will cost before knowing whether there will be one. That is exactly how the
> business works and it is a genuine gamble in both directions.
>
> **Success creates its own cost.** A picture that runs away does not simply pay — it
> triggers a more expensive tier for the follow-up. So a hit is not unambiguously good
> news, which is the kind of tension a studio game lives on. SLATE's lineage system
> modelled the audience inheriting from a hit; it never modelled the **talent**
> inheriting from one.
>
> **It makes the franchise decision real.** SLATE had `franchise qualified` and
> `franchise` as separate flags (§8) and nothing at stake between them. Here, deciding
> whether to make the sequel means looking at what the first one grossed, reading which
> tier that triggered, and deciding whether the second is worth it *at that price*.
>
> It also explains the escalating structure seen elsewhere: the contract is a **ladder
> keyed to performance**, not a single figure. SLATE's `THRESHOLD_AT` bonus was a
> single trigger at one multiple. This is the generalised form — a schedule of
> thresholds, each with its own terms.

### 23.3 What SLATE should build from this

| Mechanic | Shape |
|---|---|
| a contract as a **set of terms**, not a price | salary, participation, pay-or-play, control rights |
| **multi-discipline engagement** in one deal, priced as an increment | reads more than one of a person's attribute sets |
| a **sequel schedule** agreed at signing | thresholds → terms, escalating |
| **control rights** as a term distinct from money | final cut and its relatives |

SLATE's `Engagement` record held a name, a standing and a three-shape deal. Every one
of the rows above is a field it did not have — and the sequel schedule in particular
would give `content/lineage.ts` something it badly lacked: **a reason a follow-up
might not be worth making.**

### 23.4 When money actually leaves — a difference worth chasing

Accepting the director's contract moved company cash by **only the discipline-bundle
increment**, not by his salary. The writer's **entire fee** had left the account the
moment he was hired.

> **Inference, flagged as one:** development costs — the source material, the
> screenplay — are charged **immediately**, while above-the-line salaries on the
> production itself are charged **later**, presumably against the production budget at
> the greenlight. That would match the development ledger in §5, which totals source
> and screenplay costs separately from the production budget entirely.
>
> If true it is an important piece of the economy: **development is cash out of pocket
> now, production is a commitment that falls due at the greenlight.** A studio can
> therefore develop several projects cheaply and be ruined by greenlighting two of
> them. That is a real cash-flow shape and SLATE has nothing like it — its
> `production.commit` charged budget and fees together in one transaction.
>
> To verify: greenlight this picture and watch whether the director's salary leaves
> then. Recorded as an open question rather than a conclusion.

### 23.5 The state advanced

The project now reports **casting incomplete** — the director slot is filled and the
cast is what remains. The story department's remaining entries have padlocked,
including the project's format row, which had stayed editable until now.

---

## 24. Financial reports — and the aggregations SLATE never built

The reports area carries three groups.

**Profit and loss per studio — including every rival's.** A player can read the full
financial statement of each competitor, not merely their production announcements.

**Group totals, aggregated three ways:** by **sequels**, by **universes**, and by
**universe timeline position**.

> **This is the reporting layer SLATE's own franchise systems never had.** SLATE built
> `lineageId` and `ordinal` for lines, `universeId` for shared worlds, and
> `fromTheWorld` to damp inheritance by depth — a full inheritance model with **no way
> to ask what a line had actually earned.** Here the financial statement itself
> aggregates by exactly those structures.
>
> The third one is the striking entry: totals **by position in a universe's internal
> chronology**. That closes the loop on the universe timeline field found in §8 — the
> timeline is not decoration, it is a reporting dimension, so a studio can see whether
> its prequels earn differently from its sequels.

**Studio rankings**, by cash, total revenue, production expense and advertising
expense.

> A league table across several axes rather than one. SLATE's `world/charts.ts`
> ranked houses by a blend of ledger and reputation and produced a single standing.
> Several independent rankings is more useful and much cheaper: a studio can be first
> in revenue and last in cash, and that difference is the story.

## 25. The three casting routes — control against time against information

Earlier (§22.3) the trade between the three routes was recorded explicitly as a guess.
It can now be replaced with what the game actually says.

### 25.1 Hiring somebody directly

The player searches the pool and chooses. **Consumes the monthly audition allowance** —
the cap that appeared as a difficulty parameter in §1.4, which now has its purpose:
it limits how many people a studio can personally consider per month.

### 25.2 An open casting call

- **Does not consume the audition allowance.**
- **Begins the following month** and takes one month for a modest cast, two for a large
  one — and the monthly studio overhead runs throughout.
- Auditions **every interested, available person within five years either side of each
  uncast role's written age.**
- On completion, it **writes audition ratings into the hiring screen** as a new column.

> Three separate mechanics confirmed at once. **The age band is explicit** — a role's
> written age matches against performers within a narrow window, which is what makes
> talent ageing (§1.5) bite: a person drifts out of a role's range over a career.
>
> **An audition produces information the studio did not previously have.** Before the
> call, a player judges people on their listed attributes; afterwards there is a rating
> *for this role specifically*. So the call is not merely a cheaper way to hire — it
> **reduces uncertainty**, and it is the only thing in the game so far that does.
>
> And it is paid for in **time**, which costs overhead. The cap-bypass is free; the
> months are not.

### 25.3 A casting agent

- **Does not consume the audition allowance.**
- Fills **every uncast role at once, including the director**, choosing the best
  available.
- **Will not override anything already decided** — it only fills what is empty.
- Can be constrained by **contract terms**: instruct it to refuse anybody demanding
  final cut, or anybody on pay-or-play.
- With those exclusions on, **some roles may end up uncastable.**

> The agent trades **control** for speed. And the exclusion filters are the sharpest
> detail: a studio can tell its agent *do not bring me anybody who wants final cut*,
> and accept that some parts then cannot be filled. **Contract terms become casting
> criteria** — you are trading quality away to avoid onerous terms, knowingly.

### 25.4 The trade, stated

| Route | Allowance | Time | You choose | Produces |
|---|---|---|---|---|
| directly | **consumes it** | immediate | yes | nothing new |
| open call | free | 1–2 months + overhead | yes, afterwards | **audition ratings** |
| agent | free | immediate | **no** | a filled cast |

> **This is a genuinely good three-way trade and SLATE had none of it.** SLATE drew a
> shortlist on demand and the player picked from it: no cap, no delay, no information
> to gain, no delegation. One route with no cost on any axis.
>
> The three axes worth taking are **attention** (a monthly cap on personal
> consideration), **information** (auditions reveal fit for a specific role), and
> **delegation** (somebody else decides, faster and worse). Each is cheap to implement
> and each makes casting a different decision than it was.

## 26. An engagement, once made — what the roster holds

With the director attached, the roster shows what an engagement actually is. Per
person, beyond the terms already agreed:

- **Attached**, as an explicit state
- **A working date range** — the specific months this person is engaged for, displayed
  prominently
- salary and points, restated
- the control terms carried on the deal
- **will produce also** — a toggle adding a producer credit to the existing engagement
- **fire this talent**, annotated with the term that governs what firing costs

### 26.1 Three mechanics

**An engagement occupies months, not a project.** A person is booked across a dated
window. That is what makes the pool genuinely contested (§14.6's "exclude hired"
filter) and it is how two projects can compete for the same person — not abstractly,
but because the months overlap.

> SLATE's `Engagement` recorded who, on what terms, and nothing about **when**. So
> nobody was ever unavailable, and two pictures could engage the same person with no
> conflict possible. A date range is the smallest change that makes a talent market
> real.

**Firing is a first-class action, priced by the contract.** The dismissal option sits
on the roster beside the terms, annotated with the clause that determines the cost. So
pay-or-play (§15.2) is not decoration — it is the number that appears when you try to
undo a hire.

> SLATE could not dismiss anybody. An engagement, once made, was permanent for the life
> of the picture. Combined with §21's ratchet this is the other half of the same idea:
> **decisions can be undone, at a stated price, and the price is on the screen.**

**A credit can be added to an existing engagement.** The producer toggle means somebody
already hired for one job can take a second credit without a new deal.

> Consistent with the direct-and-write bundle in §23.1 — the same principle applied
> after the fact rather than at signing. One person, several jobs, priced incrementally.

### 26.2 An observation held open

The working window displayed for the director began several months **before the current
date** and runs past it, while the picture has not yet been greenlit. Two readings are
possible: it is the period he would work on *this* picture as currently scheduled, or
it is his existing commitment elsewhere, shown as a conflict.

> Recorded as ambiguous rather than resolved. The distinction matters — the second
> reading would mean the game surfaces scheduling conflicts at the moment of hiring,
> which would be a further mechanic. Verify by attaching somebody whose commitments are
> known, or by greenlighting and watching whether the window changes.

### 26.3 The cast slots

Below the director the roster lists **every written role in order**, each showing its
number, its **role type**, whether it is cast, the **character's name**, and a
description field that may be empty.

So §5.5's role taxonomy — main character, lead, villain, the support tiers — is not
just a classification on the source material. It is **the casting board itself**: the
studio fills a named character of a stated type, not a generic slot.

> **The difference from SLATE is the direction of the relationship.** SLATE's billing
> rungs were slots the picture had — first billed, second billed — and a person went
> into one. Here the picture has *characters*, each with a name, a type, an age and
> demands (§5.4), and casting is finding somebody who **fits that person**.
>
> That is why every other casting mechanic in this survey exists. The age band (§25.2)
> is a fit test. The audition rating is fit measured for a specific part. Talent ageing
> matters because fit decays. None of those can exist over an ordinal billing list,
> because a rung has no properties to fit.
>
> If SLATE takes one thing from the casting system, it should be this: **roles are
> written characters, not ranked slots.** The weights can stay — a main character is
> still worth more of the draw than a minor support — but the weight should hang off a
> character, not be the whole of what a part is.

## 27. Casting a role — the fit problem, fully visible

The cast search is the same machine again, with three differences that matter.

### 27.1 You cast **a role**, not a picture

A **role selector** sits at the top: the player picks which part they are filling, and
the screen states plainly that the role is not yet cast. Choosing a role **resets the
search filters**, so the query reconfigures itself to whatever that part needs.

> Casting is therefore **n separate decisions**, each with its own criteria, rather
> than one ranked pass over a shortlist. That is what a typed, written cast (§26.3)
> forces and it is the right consequence.

### 27.2 The role's full specification sits beside the search

The right-hand panel shows everything the part demands, in two groups:

**Character attributes** — species, gender, **age**, a descriptor, the character's
name (editable, with a randomiser), and **whether the character dies**.

**Performance attributes** — performance type, a **performance focus** highlighted as
the thing this part is really asking for, a persona, and the three demand ratings for
stunts, make-up effects and intimate scenes.

Plus the **role difficulty** rating above both.

> So the player matches a person against a **specification with about a dozen
> dimensions**, all visible at once, while searching. The highlighted performance focus
> is effectively the headline requirement — the one axis the part lives or dies on.

### 27.3 The audition column, empty and waiting

The talent grid carries an **audition column** which shows nothing but placeholder
dashes for every person.

> **Direct confirmation of §25.2.** An open casting call writes ratings into this
> column; until one has been held it is blank for everybody. So the information really
> is absent by default and really is purchased with months of calendar time. The
> mechanic is exactly as the game described it, verified by seeing the empty column.

### 27.4 The actor pool is far larger than the others

The pool shown for a performing role was **substantially larger** than the pools seen
for writers or directors on the same save — roughly three times the writer pool.

> Consistent with reality and with the discipline-weighted reading in §22.5. Recorded
> as an observation; whether the difference is a genuinely larger population or a
> difference in default filtering is **not established**.

### 27.5 What was NOT observed, and matters

The list did **not** appear to be narrowed to the role's age band. The full pool was
offered for a role with a stated character age.

> **Tentative, and flagged as such** — age is not a column in this grid, so the
> filtering cannot be confirmed or refuted by eye. But if the list really is unfiltered,
> the reading is: **the age band governs who turns up to an audition, not who the
> studio may cast.** A studio can cast against type; it simply will not be shown those
> people by an open call.
>
> That is a better design than a hard constraint, because it makes miscasting
> *possible* rather than prevented — which is the kind of mistake a studio game should
> let a player make. Worth settling before SLATE copies either version.

**Salaries for performing roles ran far above** those seen for writers and directors,
with participation percentages to match — the cast is where the money goes.

## 28. A cast contract — negotiation, billing rights, and availability

Selecting a performer for a role produces the fullest contract screen in the game, and
it carries three mechanics not seen on the writer or director deals.

### 28.1 Agents negotiate, with numbered counter-offers

Beneath the asking terms sits an **agent negotiation** section presenting a numbered
offer — a **lower salary and lower participation** than the person's listed price.

> **Negotiation is a real mechanic and the survey had not seen it until now.** Every
> previous hire was take-it-or-leave-it at the listed figure. Here the listed price is
> an **asking price**, and an agent will quote something else. The offers being
> *numbered* implies a sequence — presumably successive rounds, each with its own
> terms and presumably its own risk of losing the person.
>
> This reframes the whole talent market. A salary column is not a price, it is an
> opening position, and a studio that never negotiates is overpaying for everybody.
>
> **SLATE's talent had prices.** `costsTheCompany` computed what somebody cost from
> their standing and the agent's cut, and that figure was final. The agent existed as a
> *rate* — the gap between what the company paid and what the person received — which
> was a good simplification of a fee. It was not a model of an agent as somebody who
> **argues**.

### 28.2 Name above the title — a second control right

Alongside salary, points and pay-or-play sits a **billing right**: whether this
person's name goes above the title.

> The second non-monetary term found, after final cut (§22.6). Both transfer something
> other than money — one transfers creative authority, this one transfers **credit and
> prominence**. Presumably it costs the studio something in what else it can promise,
> and presumably big names demand it.
>
> Together they establish the pattern: **a contract is a bundle of money terms and
> non-money terms**, and the non-money ones are what make two equally-priced people
> different to hire. SLATE modelled only money.

### 28.3 Availability is stated per person, and blocks auditioning

The record showed this performer as **interested but already working**, with an
explicit note that he **will not audition**.

> So availability is not binary. Somebody can be *interested* in the part and still
> unavailable to audition for it because they are engaged elsewhere. That is a third
> state between "available" and "not interested", and it interacts with the audition
> system directly.

**The monthly audition allowance is displayed as a counter** — used against total — so
the cap from §1.4 is visible at the point of use rather than hidden in settings.

### 28.4 The sequel escalator appears again, with two participation figures

The same threshold ladder seen on the director's deal (§23.2) reappears, and each tier
carries **two percentages** rather than one.

> Confirms the sequel contract is a **standard feature of every deal**, not a
> director-only term. The second percentage is unexplained — plausibly a distinction
> between participation in gross and in net, which is the defining argument of the real
> business. Recorded as unresolved.

### 28.5 The cross-discipline bundle again

An option offers to have this performer **act and write**, at a stated increment —
exactly parallel to the direct-and-write bundle in §23.1.

> So bundling is general: **any person, any two disciplines they have attributes for,
> priced as an increment.** And this performer's record listed acting as what he is
> known for while **directing** is what he wants to try — so the ambition field from
> §14.6 sits right beside the bundle option that would let a studio grant it.
>
> That connection is worth building deliberately. A studio that gives somebody the job
> they want presumably gets loyalty, or a discount, or a gamble on an unproven
> capability. It is the most human mechanic in the game and it costs one boolean and
> one price.

## 29. The automation problem, solved — and what it revealed

### 29.1 The window is not custom-drawn after all

Enumerating the game window's **child** windows — rather than only top-level windows,
as §13 did — found **fifty-four real WinForms controls**: labels, buttons, panels and
scrollbars, each with its own handle.

So the earlier conclusion in §13 and §17 was **wrong in its diagnosis**, though right
about the symptom. The centre panel is not an unaddressable custom canvas. It is a
nested hierarchy of ordinary windows, and the failures were caused by targeting the
**top-level handle with window-relative coordinates**.

### 29.2 What actually works

Walk down from the top-level window to the **deepest child containing the point**, then
post the mouse messages to **that** handle in **its own client coordinates**.

The content rows of the big panels turn out not to be individual controls — they are
owner-drawn inside one scrollable container, which is why probing two different rows
returns the same handle. But that does not matter: **the container does its own
hit-testing on the messages it receives**, so a posted click at the right client point
inside it is processed exactly as a real one.

Verified end to end: a posted click changed the game's state, and a second one
committed a contract.

> **Recorded prominently because §13 told a future session the opposite.** The lesson
> is not "this app cannot be automated" — it is **"find the deepest child window at
> the point and post to that."** Three earlier techniques failed for the same reason,
> and the gliding-cursor experiment (§22.7) was chasing a cause that did not exist.

### 29.3 What the click revealed: conflicts are surfaced at hiring

Accepting the contract displayed, beneath the agreed terms, the performer's **existing
engagement** — the studio employing him, the project, the discipline he is working in,
and the **date range he is committed for**.

> **This resolves the ambiguity held open in §26.2.** The game does surface scheduling
> conflicts at the moment of hiring, and it names the rival studio that has the person.
>
> Three consequences, and they tie several earlier findings together:
>
> - The "interested but working" state (§28.3) is not a vague flag — it is backed by a
>   **specific competing engagement with dates**.
> - Rivals are not only making pictures (§16.1), they are **holding people the player
>   wants**, visibly, by name.
> - The dated working window on the roster (§26.1) is the same mechanism seen from the
>   other side.
>
> So the talent market is genuinely contested and the contention is **legible**: a
> player can see who has whom, until when, and for what.
>
> SLATE had no version of any of this. Its shortlist was drawn fresh on demand, nobody
> was ever engaged anywhere, and rivals held nothing.

### 29.4 Confirmed end to end

A cast contract was committed through the posted-click path and the roster shows the
performer **attached** to the role with full terms. So the automation reaches every
part of the game, including commitments.

### 29.5 Engagement windows differ by role

The director's working window and the lead performer's **do not match** — the
director's runs a month longer.

> **A good mechanic, and an obvious one in hindsight.** A director is needed from
> pre-production through post; a performer is needed for the shoot. So each engagement
> occupies a **different span of the same production**, and the spans are derived from
> what the job actually requires rather than being uniform.
>
> Two consequences worth taking:
>
> - **Cost is not uniform per person per picture.** Somebody engaged across nine months
>   is a different commitment from somebody engaged across eight, even at the same fee,
>   because the months are what make them unavailable elsewhere.
> - **Contention is role-shaped.** A performer frees up before the director does, so
>   the same person can be booked onto an overlapping picture sooner. That is a
>   scheduling puzzle with real texture, and it emerges from the spans rather than
>   needing its own system.
>
> SLATE's engagements had no duration at all, so every hire was identical in this
> respect and none of the above could exist.

## 30. Advertising — media planning, not a single number

The advertising department opens after the cast is contracted, and it is a **media
plan** rather than a budget field.

### 30.1 The shape

**The project budget now includes talent.** The figure shown has grown well beyond the
production budget computed in §7 — the cast contracts have been folded in. So the
"budget" the player carries forward is production plus above-the-line, aggregated.

**The audience carried on the source material is restated here** — the primary and
secondary demographic bands from §5.1 — so the campaign is planned **against a stated
audience** rather than in the abstract.

**Advertising is planned in repeated blocks**, each with a **focus** selector and a
spread across several channel types: television, video, banner, events, and cross
promotions.

**The section is headed penetration and saturation.**

### 30.2 Why that heading is the whole mechanic

> "Saturation" means **diminishing returns per channel**. Spending twice as much on one
> channel does not reach twice as many people, because the channel runs out of people
> to reach. That is what makes a media plan a *plan* rather than a slider: the optimum
> is a spread, and the right spread depends on which audience you are chasing.
>
> Several blocks each with their own focus implies **targeting different segments
> separately** — a campaign aimed at the primary audience and another at the secondary,
> each with its own channel mix.
>
> **SLATE had `campaignCents`: one number, passed to the opening command, multiplying
> one link in the accumulator.** That is the thinnest possible model of marketing and
> it could never produce a decision — more was always better, limited only by cash.
>
> The three things worth taking, in order of value:
>
> 1. **Diminishing returns per channel.** This alone converts spending from a slider
>    into an allocation problem, and it needs no new content — just a curve per channel.
> 2. **A stated audience to aim at**, which requires the demographic model from §5.1.
>    Without it there is nothing for a focus to focus on.
> 3. **Channels with different reach profiles**, so the mix matters.
>
> SLATE already has the ledger discipline to make this honest: each channel's spend
> would be its own posting, and the reach it bought would be a receipt line, the way
> `boxoffice.ts` already writes a note per link.

### 30.3 A note on scope

This is where the survey stops being exhaustive by design. The **mechanic** — an
allocation across channels with saturation, aimed at a demographic — is the part worth
having, and it is recorded. The specific channel list, the exact block count and the
tuning behind them are this product's own content, and SLATE should derive its own
from what its world actually contains.

## 31. Bungalows — housing talent so rivals cannot take them

The lot carries a handful of named bungalows, each either empty or occupied, and the
stated purpose is **keeping talent away from the other studios**.

> A **retention** mechanic, and it only makes sense because the talent pool is
> contested (§14.6, §29.3). Housing somebody on your own lot is how you hold them —
> presumably against the cooldown that governs when a rival may approach them again
> (§1.4).
>
> **This is the answer to a question SLATE has had open since the plan file.** SLATE
> owns a lot with stages and offices and no reason for any person to be on it; the
> plan's Phase D was explicitly about the lot losing its purpose once outside tenants
> were removed. Bungalows give the estate a second job that is **about people rather
> than about square footage**, and it wires the lot into the talent market — which is
> exactly the kind of cross-system connection the house standard asks for.
>
> It also fits SLATE's premise better than it fits this game's, because SLATE's lot is
> a family estate rather than a corporate campus. Somebody living on your land is a
> different relationship from somebody under contract.

## 32. The bank — debt as a real instrument

The studio may borrow, and the terms are laid out in full before committing.

**The shape of it:**

- **The studio has a valuation**, shown as a figure.
- **The maximum loan is that valuation** — the company borrows against what it is
  worth.
- **Only one loan may be outstanding at a time.**
- A **fixed term of several years**, with the **monthly repayment** stated.
- Interest at an annual rate, with the annual amount, the total over the term, and the
  total repayable all computed and displayed before anything is agreed.
- A separate action to repay early.

### 32.1 Three things worth taking

**1. A company valuation.** SLATE has no concept of what the company is *worth* — only
what cash it holds. A valuation is a derived figure that could read the library, the
lot, the slate and the cash, and it gives the studio a size independent of its bank
balance. Several other mechanics could then read it.

**2. One loan at a time.** A hard constraint that makes the decision weighty: you
cannot stack debt out of trouble, so *when* you borrow matters as much as whether. The
first bad year is survivable; borrowing to survive it means the second one is not.

**3. The monthly repayment joins the burn.** A loan does not just add cash now — it
adds a **standing monthly obligation on top of the overhead**. That connects debt
directly to the price-of-time model (§16): borrowing shortens how long the studio can
afford to develop anything.

> Together with the overhead and the bankruptcy threshold from §1.4, this completes the
> financial picture: **a studio has a burn rate, a borrowing capacity tied to its
> worth, and a floor below which it fails.** SLATE has the ledger discipline to model
> all three honestly and currently models none of them — its company cannot borrow, has
> no overhead, and has no valuation.

## 33. The automation problem, actually solved — and two earlier sections corrected

§13 concluded the centre panel could not be driven. §29 corrected the diagnosis but
still could not reach the selector controls. **Both were wrong, and the real cause was
embarrassingly small.**

### 33.1 The fix

**Posted mouse messages need timing between them.** Every earlier attempt fired
`WM_MOUSEMOVE`, `WM_LBUTTONDOWN` and `WM_LBUTTONUP` back to back with no delay. The
app does not process that as a click. Insert roughly a tenth of a second between each
and it works immediately.

That single change reached a control that had refused six previous attempts across
four techniques.

### 33.2 What the selectors actually are

The small glyph beside an editable field **opens a modal dialog**. The one tested
contained a numeric spinner and a standard Accept button — **real WinForms controls**,
individually addressable through the child-window enumeration from §29.1.

> So the interface has two layers and the survey had only ever seen one. The panel rows
> are owner-drawn and display values; **editing happens in modals built from ordinary
> controls.** Everything that looked unreachable was a door, not a wall.

### 33.3 The method, stated once for reuse

1. Walk from the top-level window to the deepest child containing the point.
2. Convert the screen point into **that window's** client coordinates.
3. Post move, down and up **with about 100ms between each**.
4. If a modal opens, its controls are real and can be enumerated and targeted directly.

### 33.4 Why this is worth recording at length

Three separate conclusions in this document were wrong in the same direction: each time
a technique failed, the inference was "this app resists automation" rather than "this
attempt was malformed." The gliding-cursor experiment (§22.7) chased a cause that never
existed and broke working functionality on the way.

> The lesson is general and worth carrying beyond this survey: **when several
> variations of an approach all fail identically, suspect the shared assumption rather
> than inventing a property of the target to explain it.** All four techniques shared
> the same zero-delay message sequence, and that was the thing none of them varied.

### 33.5 What a dropdown contains — confirmed by opening one

With the timing fix, a selector that had refused every earlier attempt opened
immediately. The advertising **focus** control is a list of **campaign angles**.

The angles fall into recognisable groups: selling the picture on its **people** (the
cast, the stars, the director), on its **content** (the plot, the visual effects), on
its **occasion** (a cinematic event, a date film, a family outing), on its **position
in a line** (franchise building, universe building), or on **general reach** (broad
marketing, building anticipation). A null option means no particular angle.

> **The mechanic is matching, and it is a good one.** A campaign angle is only credible
> if the picture actually has the thing it is selling. A star-led campaign needs stars;
> franchise building needs a franchise; a visual-effects angle needs the effects budget
> to have been spent. So the marketing decision **reads the picture's own attributes**
> rather than being a free choice, and picking an angle the picture cannot support
> presumably wastes the money.
>
> That closes a loop across the whole survey. The cast (§27), the director's standing
> (§22.6), the franchise flags (§8), the universe (§8.1), the effects ratings (§7) and
> the demographic audience (§5.1) all become **things a campaign can be built on**.
> Every one of them was previously just an input to the box office; here they are also
> assets to be marketed.
>
> **SLATE's `campaignCents` could express none of this.** A single figure has no
> angle, so nothing about the picture could make the marketing better or worse — only
> more or less of it. Adding an angle that must match the picture is the cheapest way
> to make a campaign a *decision*, and it needs no new content: SLATE already has
> lineages, universes, cast reach and craft standing for an angle to read.
>
> The obvious shape for SLATE: an angle picks which of the picture's existing
> attributes the campaign leans on, that attribute's strength scales the campaign's
> effect, and a mismatch is simply weak rather than refused — so the player can be
> wrong and find out.

---

## 34. Film against series — the two pipelines compared

Switching one field on an otherwise identical project turns a film into a series, and
the pipeline reshapes immediately. This is the cleanest possible comparison: same
save, same project, one changed value.

### 34.1 What the definition screen gains and loses

**A film carries:** a project type, a **release type** (how it reaches an audience), a
production type, the franchise flags and the universe fields.

**A series carries:** a project type, **a number of episodes**, **a running time per
episode**, a **total running time derived from those two**, and **a season number** —
then the same production type, franchise and universe fields.

**The release type disappears entirely.** A film chooses how it reaches people; a
series does not get that choice at all.

> Three findings in that swap.
>
> **Total running time is derived, not entered.** Episodes times minutes-per-episode,
> shown with an hours conversion beside it. So the thing the budget will be built from
> is a *consequence* of two decisions rather than a figure anybody types — the same
> discipline the department engine uses (§10).
>
> **Season is a first-class field on the project.** A series is not an open-ended
> thing; it is **one season**, numbered. Renewal presumably creates the next one. That
> makes a series a repeatable unit rather than a stream.
>
> **A film's release type is a decision a series does not have.** Worth noting for
> SLATE, whose `FORMATS` table put `channels` on every format row uniformly.

### 34.2 The pipeline itself changes — the biggest finding

The department rail reshaped the moment the type changed:

| | Film | Series |
|---|---|---|
| Story: hire a writer, lock the story | **present** | **gone** |
| Production: pre-production | **present** | **gone** |
| Production: production | present | present |
| Production: post-production | **present** | **gone** |
| Next action | write a screenplay | **lock the production budget** |

**A series has no pre-production and no post-production.** The three-phase schedule
that produces a film's budget (§7) collapses to a **single production phase**.

**And the screenplay step vanished.** The film could not proceed without a writer
hired and months elapsed; the series skipped straight past that to the budget.

> **This is a genuinely different production model inside the same game**, and it is
> the answer to what the user asked for.
>
> A film is **one artefact made in three sequential phases**, gated on a script that
> must be written before anything else can happen. A series is **N episodes of fixed
> length in a single phase**, with no screenplay gate at all — presumably because
> episodic writing is continuous and handled by the showrunner rather than bought once
> up front.
>
> So the two share the department engine, the talent market, the locks and the
> contracts, and differ in **what a schedule is** and **what gates it**.
>
> **Against SLATE.** SLATE's six formats — feature, tv-movie, miniseries, anthology,
> serial, micro — all ran the *same* pipeline with different `parts`, `secondsEach`
> and `legs` values. That was a reasonable compaction and this shows what it misses:
> the difference between a film and a series is not parameters on one pipeline, it is
> **two pipelines with different phase structures and different gates.** SLATE's
> `Plan` and `Period` machinery can express both — `layOut` already builds periods
> from a plan — but the plans would need to differ in *shape*, not only in ratios.

---

*Survey in progress. Entries are added as screens are read.*
