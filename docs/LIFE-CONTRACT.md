# SLATE — the life milestone

This is the locked scope for the current milestone, and it is also my reading
of what the player asked for, written out in full so that nothing depends on
remembering a conversation. Where the player described something in outline, I
have said what I think it means concretely and what it will take. Where I think
they meant more than they said, I have written the more. If any line here is
wrong, it is wrong in writing and can be corrected in one sentence.

The industry overhaul is deferred. The Casting tab is in the game and locked.
The Company tab and the founder premise are gone.

---

## 1. What the player actually asked for

> "I want to live a life someone would live in the real world in the game."

Not a menu of features. A life. The measure is whether an ordinary Tuesday is
worth playing — not whether a spectacular Tuesday is available.

The four games named as the bar, and what each one is being asked for:

| Named | What is actually being asked for |
| --- | --- |
| BitLife | The whole span. Childhood, school, first job, ageing, family, the end. Nothing about the life is skipped because it is not glamorous. |
| Cyberpunk 2077 | Density of place. A city where the shops, the signs and the people are specific, and where walking somewhere is not a loading screen. |
| Red Dead Redemption 2 | Consequence and texture. Things you own wear out, people remember, small actions have weight, and the world carries on without you. |
| Grand Theft Auto | Freedom of intent. If it looks like you could do it, you can attempt it, and the answer is a real answer rather than a locked door. |

---

## 2. Everywhere is somewhere specific

**The ask:** "every single city/state/region/country should be what's in that
area — I want that level of realism."

**What that means concretely.** A shop, a restaurant, a cinema or a gym in the
game is a real business that really trades in that country, placed in a city
big enough to hold one. A grocer in Manchester is a British grocer. A
convenience store in Osaka is a Japanese one. A department store in Milan is an
Italian one. The player should be able to name what they expect to see on that
street and mostly see it.

**What is real and what is SLATE's, always stated on screen:**

| Real, public record | SLATE's own calibration |
| --- | --- |
| The company exists | Whether a branch stands in this generated city |
| The countries it trades in | The exact street it is on |
| The brand and the product | The price on the ticket |
| That a product line exists | What is in stock this fortnight |
| That fashion week is in Milan in February | This season's actual show schedule |

**Honest limit.** Live per-branch stock, today's price and today's opening hours
need a licensed retail feed. They will not be invented and called real. What
replaces them is a calibration, labelled as one, everywhere a number appears.

**Coverage is reported, not implied.** Every country either has authored real
retail or it does not, and the game says which. A country with no authored
chains falls back to plainly simulated shops that say they are simulated. There
will never be a claim of worldwide coverage that the data does not support.

---

## 3. A hundred real things in every shop, not every category

**The ask:** "over a 100 real branded items at each store."

Done as of this milestone: `assortmentAt` returns the chain's whole local
assortment, every branch in every tested market clears a hundred real products,
and the shop floor is walked as aisles with a rotating front table rather than
a twelve-item rail. `MINIMUM_ASSORTMENT` is enforced by test.

And it does differ between two branches of the same chain in different
countries, because it really does. Three things decide it and all three are
real. What may lawfully or customarily be sold there: alcohol is not on an
ordinary shelf in twelve countries and is behind a state monopoly counter in
Sweden, Norway, Finland and Iceland; pork is not sold in twelve and is in a
separate licensed room in seven; beef is restricted across India. What the
weather asks for: nobody in Singapore is sent a heavy coat and nobody in
Reykjavik is sent much swimwear, so a Zara in one is not a Zara in the other.
And which brands trade in that market, which the catalogue already carried.

Where a shelf is missing something the shop says which arrangement left it off,
by name, rather than quietly not having it. Fifty one chains were compared
across two countries and not one of them carried the same shop twice.

A product is classified off its own tags and never off its name, because
Virgin olive oil contains "gin", a Hamilton watch contains "ham" and a Champion
sweatshirt contains it twice; the checker fails the build if a grocery is pork
or beef and does not say so on itself. The fourth thing — how deep one branch
goes into the range it could carry — is SLATE's own, because no company
publishes its buy, and however small a branch is it still carries the hundred
products every branch promises.

---

## 4. Getting dressed

**The ask:** "actually getting to wear the things in my wardrobe — this color
shirt with these pants and this jewellery, or this suit."

**What that means concretely.** Not an outfit score. A dressing act:

- Pick a garment per slot — top, bottom, outerwear, shoes, watch, jewellery,
  bag, eyewear — from what you actually own, in the condition it is actually in.
- Colour and material are properties of the garment, and clashing is possible
  and visible. Brown shoes with a black suit is a thing the mirror mentions.
- The occasion has a dress code. A premiere, a funeral, a first date, a shoot
  day and a Sunday have different ones, and the game tells you before you leave
  rather than after.
- The weather has a vote. Linen in February is a decision.
- What you wore is remembered: by photographers, by the people who saw you, and
  by you, so you do not wear the same thing to two things in a row.
- Clothes get worn, stained, cleaned, altered and eventually retired.
- Outfits can be saved, named and re-worn.

---

## 5. The phone is a phone

**The ask:** "give me the YouTube app in full just like the real app on my phone."

**What that means concretely.** Not a stats panel. The app:

- A feed that is generated from channels you actually subscribe to.
- Channels with names, subscriber counts, upload histories and comment sections.
- Your own channel: upload, thumbnail, title, description, tags, schedule.
- Analytics that behave like analytics — views over time, retention, the video
  that took off, the one that did not.
- Comments you can read and reply to, and the ones you should not read.
- Watching something is an activity that costs time and does something to you.

The same treatment for the other three, each with its own shape: short vertical
video, photographs and stories, short text and quote-posts, and live streaming
with a chat and a subscriber base. They are four different apps, not one app
with four skins. Parity is stated per platform, feature by feature, and only
claimed where it is built.

---

## 6. The independent film, which is not the industry milestone

**The ask:** "when I'm filming my own independent passion films there's stores
where I can pick equipment out — cameras, lights, everything."

This is the player as a person making something themselves, which is a life
activity, not a career system. It stays in this milestone.

- **Camera and grip shops** — the real ones already in the catalogue, plus
  rental houses, because nobody buys an Alexa.
- **A makeup store and a costume store**, both with real brands.
- **Hire, insure, transport, use and return** the kit, with damage and deposits.
- **Shoot days** you plan, crew you ask favours of, locations you get permission
  for, and weather that ruins one of them.
- **Cut it, screen it, put it somewhere.** A festival submission is a form and a
  fee and a wait. Done.

---

## 7. The house is interactive

**The ask:** "I can actually put recipes together at home and interact with the
item at home."

- The pantry is real: what you bought is what is in it, and it goes off.
- A recipe needs its ingredients, a pan you own, an appliance you own and time.
- What you cook feeds you specifically, and can feed somebody else.
- Appliances are the ones you bought. A Vitamix does something a hand whisk does
  not. A broken washing machine is a repair, a cost and a week of launderettes.
- Every owned object has a place in a room, a condition, and something you can
  do with it.

---

## 8. Going out for a real reason

- **Cinemas** — real chains, showing what is actually on in the world's calendar,
  with a ticket, a seat, a time and somebody kicking your chair. Done, except
  that there is no listings feed: the chains, the buildings and the country's
  own certificate are real, and the program is SLATE's own.
- **Fashion weeks** — real cities, real months, real houses showing. Getting in
  is a matter of who you are. What you wear is looked at. Done.
- **Concerts, matches, galleries, museums, festivals** — real venues, real
  seasons, tickets that sell out. Done, except that there is no listings feed:
  the buildings and the seasons are real, and what is on inside them is
  SLATE's own.
- **Restaurants** — done. Bars and clubs — done.

---

## 9. Ordinary life, which is most of it

The salon, the barber, the dentist, the garage, the post office, the launderette,
the pharmacy, the vet, the DMV, the bank branch, the phone shop. Each one a room
with somebody in it. Most of these are two minutes of play and they are what
makes the rest feel real.

**All of them are in.** The salon and the barber are one chair; the chemist,
the post office and the launderette are three more; the bank branch is the Bank
workspace and the garage is in the vehicle journey. The last four — the
dentist, the vet, the licensing office and the phone shop — are built.

The dentist carries the part that is genuinely public record and genuinely
differs, which is who pays: England charges in three bands and exempts under
eighteens, students under nineteen and new mothers; Germany pays more toward a
crown if the bonus booklet was kept stamped; a Japanese patient pays thirty
percent; adult dentistry is not in the Dutch basic package at all; Sweden is
free until the year you turn twenty four; and in Canada, Australia and the
United States it sits outside the health system entirely. Twelve arrangements
across forty two countries. Twelve treatments, priced by band where a country
charges in bands and by share where it charges a share, and nobody anywhere
pays toward whitening because it is cosmetic. The recall interval is set by the
state of the teeth rather than by the calendar, which is what NICE has actually
recommended since 2004, and a set of teeth nobody looks at gets worse.

The vet is twelve real veterinary groups — Vets4Pets, Medivet, CVS, VetPartners,
IVC Evidensia, AniCura, Banfield, VCA, BluePearl, Thrive, Greencross, VetCor —
in the countries they really trade in, and an independent practice everywhere
else, which is what most practices are. The core vaccines are the ones the
profession calls core, the boosters lapse after a year, and microchipping is
carried as the law it is with the year it came in: dogs in Britain from 2016,
cats in England from June 2024. An emergency at two in the morning costs what an
emergency at two in the morning costs. It works on the animal a childhood
actually produced.

The licensing office is the real one for where you are standing, and every one
of the fifty one American states and the District calls it something different:
the California DMV, the Massachusetts RMV, the Michigan Secretary of State,
PennDOT, Texas DPS, Oklahoma's Service Oklahoma. Ten things a counter really
does, from a learner permit to a personal plate. An appointment is quicker than
turning up and turning up first thing is quicker than turning up at two. And
the paperwork can simply be wrong, in which case you queue, you are told which
form or which date is not good enough, you pay nothing and you come back another
day — settled per day, so coming back tomorrow is the fix and trying again in a
minute is not.

The phone shop sells seventy real networks across the world's markets, each only
where it operates, and carries the one durable public fact about them that
decides what your signal is like: whether the network runs its own masts or
rents somebody else's. Three ways to buy — pay as you go, SIM only, pay monthly
with a handset — with a tie in, an exit fee that falls to nothing when the term
ends, and the legal right to keep your number. Nobody under eighteen signs a
contract; pay as you go needs no signature, which is exactly why it exists. And
the other half of a phone shop, which is mending the screen of the one you
have, and sometimes not perfectly.

---

## 10. Free text that actually does things

Say what you want in your own words. The game works out which supported action
you meant, asks when it cannot tell, does it, and tells you what happened. It
never pretends to have done something it cannot do. Where the answer is no, the
answer says what would make it yes.

**Done.** The scene box already took a sentence. This is the same thing
everywhere else: Go Anywhere now reads a sentence as well as a search. "I want
to go to bed", "get petrol", "work my shift", "go to the dentist" — 48 things a
person would actually ask for, in 339 different sets of words, every one of
them pointing at a command the engine really registers or a screen that really
exists.

What keeps it honest is that it resolves to a **plan**, never to a result. The
plan is a real command with a real payload, run through the same path the
button uses, so every guard, every refusal and every refusal's wording belongs
to the command rather than to the box. A twelve year old who types "work my
shift" gets the job system's own answer, which is that they do not have a job.
Nothing in here can say yes on behalf of a command that would have said no, and
the checker proves it: resolving all 339 phrasings leaves the save byte for
byte unchanged.

Standing somewhere matters. Ask for petrol from your front room and the plan is
to drive to a filling station; ask for it standing on the forecourt and the
plan is to fill the tank. Where the city has three dentists it asks which one
rather than picking. Where the city has none it says so, and says a bigger one
will have one. And where it is not something SLATE does at all — "buy a
spaceship", "become president" — it says that plainly instead of guessing.

---

## 11. Build order

1. **Done.** Company tab canned; Casting locked; founder premise out of
   creation; a hundred real items in every branch; aisles.
2. **Done.** 300 real chains across 79 markets, each in the countries it really
   trades in, with `npm run coverage:retail` printing the honest per-country
   picture: nine markets deep, twelve workable, fifty-eight thin, and every
   other country in the world falling back to plainly simulated shops that say
   so on screen. Also in: the kit shops for section 6 — Adorama, Samy's, Wex,
   Thomann, Panavision and ARRI Rental for hire, Angels Costumes, Western
   Costume and Tirelli for wardrobe, M·A·C, Ben Nye and Charles Fox for makeup.
3. **Done.** Getting dressed, properly: sixteen pegs became twenty when
   jewellery split into earrings, necklace, ring and bracelet, so a chain and a
   pair of earrings are worn at the same time rather than competing. Forty
   colours, twenty-two cloths read from the product's own name, thirteen dress
   codes, and a mirror that says what is wrong and never stops you. Clothes
   wear, soil, and go to the cleaner. And the wardrobe has two sides: every
   garment says who it is cut for, the shop leads with your rack and sells you
   the other one on request, and the four aisles nobody had built — underwear,
   socks, earrings, necklaces and chains — carry over a hundred real branded
   products each for men and each for women, 859 in all.
4. **Done.** The kitchen: every recipe in the game named ingredients no
   shop had sold since the catalog went real, so nothing could be cooked at
   all. There is now a larder of 110 real ingredients, a book of 73 real
   dishes against products a shop actually stocks, and a gate checker that
   fails the build if a recipe stops being cookable. A dish names the kit it
   needs; a home is fitted with a hob, an oven, a fridge, pans and a knife,
   and a blender or a stand mixer or a grill is something you went out and
   bought. The better machine cooks a better plate in less time. What you
   cook feeds whoever else is in the house, and they remember it.
   And the house around it. Everything a home holds wears by the month, at a
   rate set by what kind of thing it is and how well it was made, so a rough
   appliance is tired long before a good one. Below a point a machine stops
   rather than gets slow: a broken oven is not in the kitchen you cook with,
   and a broken washer sends the washing out. A repair is booked, paid for,
   takes days by trade, and brings the thing back working. Every owned thing
   that lives in a house is put in a room of it the moment it is yours, in the
   room it was made for or the room people really put it in, so the washing
   machine ends up in the kitchen of a flat with no laundry. 43 different
   things you can do with what you own, over 651 of 914 things a home can
   hold, most with a second one that is also true: you sit on a sofa and you
   nap on it, you watch a television and you doze off in front of it. A sheet
   set says plainly it is only owned rather than inventing a verb. Furniture
   bought for a room used to be a number on that room and nothing else; it is
   now the object you own, wears like one, and the room notices. The washing
   needs the second machine: without a dryer a wash hangs overnight and
   nothing is wearable until morning, with one it is back in two hours, and
   with no machine at all it is the launderette by the load.
   **Still to come:** clothes only soil when you commit a look, so a life
   lived through the Advance button never needs washing at all. Film kit is a
   thing that lives in the house now, in a room, wearing and breaking and being
   looked after like everything else in it.
5. **YouTube, Instagram, X and TikTok, all four built as their own apps.** There is a phone now. It is the
   newest iPhone SLATE knows of, or the one you bought, and the clock on it is
   the world clock, so an hour inside an app is an hour gone out of the day.
   YouTube on it is the app rather than a panel of numbers: the top bar, the
   chips, a feed of thumbnail cards, Shorts, search, and Home, Shorts, upload,
   Subscriptions and You along the bottom. A video opens on a watch page with
   the player, the view count, the action pills, the channel row and its
   subscribe button, the description, the comments and what is up next. The
   feed is built from the channels you actually subscribed to, the subjects you
   keep choosing and what is new, and no channel is allowed to become the whole
   page. Two hundred and forty channels across twenty subjects were running for
   years before you opened it and keep uploading on their own rhythm while you
   are away; a specialist channel keeps to what it is about, and a daily brief
   is twelve minutes where a monthly essay is forty. Watching costs the minutes
   and an hour of comedy does not leave you where an hour of news does. The
   comment sections are warm, pedantic, off topic and occasionally cruel, and
   the cruel ones under your own videos are offered rather than served. Your
   own channel opens the account that carries the money, takes uploads with a
   title, description, tags, one of seven thumbnails and a publish time, and
   shows the curve, the median, the video that did nothing beside the one that
   took off, how far you are from monetization, what a thousand views is worth
   once you are past it, and the brand deals that arrive, to take or turn down.
   The four platforms now carry their real names.

   And the rest of what the app is. Advertising runs the way it runs: an
   advertiser's rate per thousand, the platform's share taken out of it, and
   only the share of views that carried an ad at all, with a skip after five
   seconds on the ones that allow it. The paid tier costs money every month,
   renews, lapses when the money is not there, takes the advertising away, and
   sends a share of what you pay to the channels you actually watch, which is a
   second line on a creator's statement and not a rounding of the first. A
   channel page has Videos, Shorts, Community, Live and About, a subscribe
   button and a bell with three settings rather than two. Watch Later and Liked
   Videos are kept by the app and cannot be deleted; other playlists are yours
   to make and empty. A membership is a monthly charge to support a channel. A
   tip is one of five amounts and the channel keeps most of it. Going live
   takes the hours, brings people in and collects what they paid to be read
   out. A community post can be a poll you vote in once. The month arrives as a
   statement with five lines: advertising, premium watch time, memberships,
   tips and sponsorship, against the monetized views it was earned on.

   And the parts that were named as missing are in. Playback speed is real: at
   two times a video takes half the day and leaves you with less of it, and past
   one and a half you are skimming. A hundred and forty four pixels is worse
   than a thousand and eighty. Captions pull some of that back where the video
   has them, and most do. Autoplay chains up to four and then asks whether you
   are still watching, which is how three hours go. A long video breaks into
   chapters and a short one does not. You can reply to any comment, and on your
   own videos pin one at a time and heart the ones you liked. The bell is an
   inbox that fills when a channel you follow uploads, when your channel passes
   a round number and when the month is paid, and it empties when you read it.
   Search filters by date and length and sorts by relevance, date or views.

   And you bring your own photographs, on the same framing machinery as the
   headshot: a sixteen by nine thumbnail, a nine by sixteen cover for a short, a
   square for the channel circle and a wide one for the top of the channel page,
   each drawn into its frame and re-encoded small enough to live in a save.

   And Instagram, X and TikTok are their own apps beside it, written apart from
   each other all the way down, because a photograph with a caption, a three
   hundred character argument and the line over a fifteen second clip are not
   one object with three skins. Three hundred and fifty one accounts across
   sixteen subjects — a hundred and forty one on the photo app, a hundred and
   nineteen on the text app and ninety one on the clip app — were posting for
   years before you arrived and keep posting while you are away. Their back
   catalogs are worked out rather than saved, the same way the video world is,
   so the whole internet costs a save nothing. Between them the three
   generators can say two and a half million things and never sound like each
   other: a caption trails off, gets a tag on the end or says nothing at all, a
   post on the text app is an argument with a sentence stuck to the front or
   the back of it, and a hook is lowercase, starts in the middle and carries
   its tags because that is how a clip is found at all.

   Instagram is the app: the plus top left, the wordmark in the middle with the
   chevron that switches For You and Following, the heart top right, the tray of
   stories with yours first and the plus on the ring, and a feed of square
   pictures whose header stacks the handle over the place, with the count pill
   on a carousel and the dots under it. Heart, bubble, plane and bookmark below,
   then the likes, the caption, how many comments and when. Along the bottom the
   floating bar: Home, Reels, Messages, Search and your own picture. Reels is
   full bleed with the rail of counts down the right and the account, the Follow
   button and the caption along the bottom. Search is the chips and the grid
   with a view count on every tile. Messages is the inbox, your note above it,
   requests kept apart from the rest, and a thread you can actually write in.
   Your own page is the stats row, Edit and Share, the four tabs, and the cards
   that say what is still missing from it. Settings And Activity is the app's
   own sections in the app's own order, and every row does something: a muted
   account is gone from the feed, a blocked one is gone from search as well and
   the follow goes with it, a hidden word takes a comment out of the room before
   you read it, a private account grows more slowly because fewer people see it,
   and Time Management is the real clock rather than an estimate.

   And the parts of Instagram that were only pictures of parts are parts now. A
   post can be up to ten photographs with the dots under it and the count pill
   on the corner, built in the composer one picture at a time. A story can be
   for the close friends only, and one of those reaches you only where the two
   of you are close, which the tray rings in green. Activity is the app's own
   page: what was liked, who followed, and what was said under yours. Live
   takes the hours, brings in whoever is about and collects what they sent.
   Saved posts go into folders you name, and the folders are on Settings And
   Activity where the app keeps them.

   X is the app: your picture top left onto the drawer, the mark in the middle,
   For You and Following under it, and five icons with no labels along the
   bottom with the blue button floating above them. A post carries reply,
   repost, like, views, bookmark and share, and the counts go away if you turn
   them off. The drawer is Profile, Premium, Bookmarks, Communities, Lists,
   Spaces and Creator Studio, then the assistant, settings and help.
   Notifications has All and Mentions. Search is the rail of Explore, Trending,
   News, Sports and Entertainment. Your page is the banner, the join date, the
   two counts, Share and Edit, the four tabs and who to follow. The assistant
   answers out of this save and nothing else, and says so rather than pretending
   to be a language model. A post can be a thread: up to twenty five of them,
   each with its own counter, chained in the order you wrote them.

   And the three rooms in that drawer are rooms rather than lists of names. A
   community is the app's, one to a subject, made of the accounts that are
   actually about it, and you join it or you do not; joining puts its timeline
   a tap away. A list is yours: you name it, search the app for who goes on it,
   take one off again, read the timeline of only those, and delete the whole
   thing. A space is an hour you host out loud: it takes the hours out of the
   day, draws the slice of your followers who happen to be about, leaves a
   record of how many came at the top of it, and leaves you with people who
   follow you afterwards. Nobody pretends a room is live when the save is not
   running.

   TikTok is the app: the clip full bleed with Following and For You across the
   top, the rail down the right of the account, the heart, the comments, the
   save, the share and the spinning disc, and along the bottom the handle, the
   Follow button, the hook and what it was shot to. Discover is the search
   field, the tags and a grid of covers with a play count on each. Inbox is who
   followed you and what your own clips did. Your page is the counts, Edit
   Profile, and the grid of what you have put up. Creating one is the cover,
   the length, the hook, the hours it took and whether it goes up now or later.
   Live is the hours, the people and the gifts. The money is the app's own: it
   pays on the views that stayed rather than on the views that scrolled by, and
   only once there are ten thousand of you.

   And the two players that were flat are the players the apps have. A short on
   YouTube fills the screen with the rail of Like, Dislike, Comments, Share,
   Remix and the sound stacked down the right, the channel with Subscribe
   beside it along the bottom, and the next one a tap away. Create opens on the
   camera it opens on: flip, speed, countdown, effects and cover down the right
   rail, the three lengths and the record button along the bottom, and every
   one of them does the thing it says — the countdown counts down, the speed
   decides how much of your time the take costs, the effect picks the look the
   cover is drawn in, and the sound you shoot to is carried onto the short and
   shown under it.

   And the money is each app's own. X pays a share of the advertising sold
   against the impressions a Premium account earns, and Premium is a real
   subscription taken every month that lapses when the money is not there.
   Instagram pays nothing for reach at all: it pays through subscriptions,
   through gifts on reels, and through the brands, which is how the app actually
   pays. Meta Verified is the other paid badge and behaves the same way. A
   message costs the couple of minutes it costs, and whether somebody writes
   back depends on how big they are and whether you follow them.

   And the three of them are laid out against the real apps rather than near
   them. YouTube says Premium where the account is on Premium, carries the
   shelf of shorts two cards down the feed, counts with the play triangle, puts
   your own picture on the You tab, leads Subscriptions with the channels you
   chose and the chips that really filter, and makes four things from the plus:
   Video, Short, Live and Post. Its Settings is the app's own three sections and
   every row does something. Everything of yours is editable from inside the app
   that holds it: a video's title, description, tags and thumbnail or take it
   down; a caption and its place or delete it; a post inside the hour the app
   allows or delete it; your name, bio, picture and note.

   And the emoji are the apps' own. SLATE's interface is words and a test still
   holds that line, but the apps inside the phone are other people's, so the
   guard is lifted for them alone: a quick row over every comment, reply,
   caption and message box, and a drawer of seventy two behind it. The weather
   has its picture back too, beside the word and never instead of it.

   **Still to come:** the brand marks are SLATE's own drawings rather than the
   real logotypes, which stay out until they are licensed.
6. **The independent film, first part: the rental house.** The kit shops were
   already in the catalog and would sell you a camera. Almost nobody buys one,
   so the other half is here: a counter with a rate card. Thirty five real
   houses across nine cities that really work in them — Panavision, ARRI
   Rental, Keslow, Otto Nemenz, AbelCine, Sim, Cinelease, MBS, Trew Audio,
   Movietech, Panalux, William F. White, TSF — and one or two of SLATE's own
   in every other town that shoots anything, so there is nowhere you can stand
   with no way to hire a camera. Each house keeps only the lines it really
   keeps: a camera house will not hire you a generator. What is on its shelf is
   derived from its own id rather than stored, the way the channels and the
   accounts are, so nine counters across a city cost a save nothing, and a
   thirty dollar clamp is not on any shelf because nobody writes a ticket for
   a clamp.

   The ticket is the ticket. You take a body, some glass, a couple of lamps
   and a recorder for the days you need them; the week bills as three days,
   which is why a Friday to Monday costs what a Friday does. The house holds a
   deposit against what the kit is worth, and either sells you its damage
   waiver or writes your own equipment cover on the ticket instead, which
   drops the deposit to a quarter of what it was. Collecting takes the morning
   it takes, unless you pay to have it delivered. Days can be added and are
   billed the same way. Taking it back is the counter checking every case:
   what is late costs the day rate and a quarter for every day, what comes
   back marked is paid for by the waiver, by your own cover less its excess,
   or by you, and what is left of the deposit comes back. Three weeks past due
   the house stops waiting, writes the kit off and charges you for it.

   **And the day itself.** A day goes in the diary with a name, a date, the
   hours it will run and how many setups you mean to get. Where it is decides
   what it costs you: your own place is free and carries seven setups at the
   outside, because it is a flat and not a stage; the street is free and
   nobody has to say yes, but somebody may still come and move you on halfway
   through the afternoon; and somewhere somebody owns is a form, a fee up
   front and an answer that takes a few days, where a quiet place says yes
   more often than a famous one and a name the city knows gets further than
   one it does not. A refusal gives the fee back.

   Crew are a favour, not a payroll. You can only ask people who actually know
   you, they answer out of how warm it is and how recently you last asked, and
   a yes is remembered on both sides: it costs some of the goodwill it was
   made of and leaves a memory of the day. What you get is what the day could
   carry — alone with a camera it is under half of what you planned, and every
   pair of hands in a role that matters buys some of the rest back — times
   what the weather left of it. A storm halves an exterior; snow and rain cost
   a lot; a stage does not care. The hours go out of the day and out of you,
   and the kit that was on it remembers it was there, which is what wears it.

   **And the last third: cutting it, screening it, putting it somewhere.** A
   picture starts as a title, a line and a shape — a short, a feature, a
   documentary, an animation — each of which wants a different number of setups
   and runs to a different length. The days you shot go into it, one day into
   one picture, because three days shot once cannot be cut into two films. What
   the material will carry is worked out before you touch it: coverage against
   what the form wants, plus something for every day that had people on it.
   That number is a ceiling and nothing beats it.

   The bench is hours out of your life, six or eight at a time, and it tells
   you how many are left in the material and then tells you plainly when more
   would not make it better. Calling it finished writes a runtime and a quality
   once and never again: the runtime out of what was shot, the quality out of
   the ceiling, the hours and a little craft, with a line that says which of
   the four it was, down to "It does not work, and you knew that at the bench."
   It will not finish a picture out of days that were never got, and it will
   not finish one nobody sat down with.

   Then you put it in front of people. A room in the city you are in — a
   cinema, a theatre, a bar, a club, priced by how good it is and where it is —
   or your own place for nothing. Everybody you know is asked and who actually
   comes is how well they know you, plus whoever wandered in off a good night,
   and every one of them remembers it afterwards. Or a festival: twenty eight
   real ones that take open submissions, in cities this world has, each taking
   only the kinds of picture it really takes. The fee is charged where the
   festival lives and the panel shows the same number the account pays. The
   answer takes six weeks to four months and is what you made against how much
   of what they are sent they can room for — at Cannes that is almost nobody,
   and a good picture is still usually a form letter. Nothing invents a result
   and narrates backwards.

   And the kit lives in the house. A camera you buy lands in a room of it the
   moment it is yours — the room you work in, and failing that the bedroom, in
   a cupboard, in its case, which is where people really keep it. It wears
   harder than a television and softer than a washing machine, because it is
   carried about and used in the rain. It breaks, because camera kit breaks:
   a shutter dies, a lens jams, a battery stops holding a charge.

   What you do with it at home is look after it, which is most of what owning
   kit actually is. A body is checked over, a lens is cleaned, the batteries go
   on the night before, and each of those is the one kind of use that puts
   condition back into a thing rather than taking it out. Leave it two years
   and it goes the other way.

   And the day knows. A broken camera does not stand in for a working one and
   the refusal names it. A camera you have kept is worth something on the day
   and one you have not is worth less, and the call sheet says which.
7. **Item 7, first part: the cinema.** Sixty one real chains across sixty two
   countries, each listed only where it really trades, so a Cineworld does not
   turn up in a country Cineworld is not in and a landmark cinema is nobody's
   branch. Who is allowed in is the country's own board and its own
   certificates — the MPA, the BBFC, the IFCO, the CNC, the FSK, Eirin, the
   KMRB, the CBFC, the NFVCB, the ACB, forty systems and a hundred and ninety
   six certificates across forty five countries — and China, which classifies
   no film by age at all, is carried as the fact it is. Where SLATE does not
   have a country's system it uses its own advisory and says on the page that
   it is its own.

   What is on the screen is SLATE's own, and the note says so in as many words:
   there is no listings feed here and there is no honest way to know what is
   playing anywhere this weekend. So the program is derived from the city and
   the week — cached, never saved — on the release rhythm the business really
   runs to: openings on a Friday, tentpoles in the summer, horror at the end of
   October, the serious ones in December. A picture runs for a few weeks and
   leaves when nobody is going any more, its certificate follows what kind of
   picture it is, and its runtime is a runtime.

   A seat is a named time in a named room at a price that is the city's, the
   format's and the hour's, and a matinee is cheaper everywhere. A busy Friday
   evening in the big room sells out and says so. A certificate you are too
   young for is refused by name. You cannot watch it from the car park, they
   open the doors forty five minutes before and shut them half an hour after it
   starts, and a seat nobody sat in is a seat nobody sat in with the money gone
   with it. What you thought of it is what it was against what you like, and
   the room is who else came — packed out or nine people, and sometimes
   somebody behind you spends the second half kicking your chair.

   **And the second part: the fashion weeks.** Thirty real weeks in twenty
   seven cities, each with the window it really opens in rather than a month it
   was filed under: New York in the first week of February, London the week
   after, Milan the week after that, and Paris opening in the last days of
   February and running into March, which is how the four actually run. Then
   the Paris and Milan menswear weeks in January and June, Paris couture in
   late January and early July, and Copenhagen, Berlin, Madrid, Tokyo, Seoul,
   Shanghai, Mexico City, Mumbai, Delhi, Sydney, Melbourne, Johannesburg, Cape
   Town, Lagos, São Paulo and the rest.

   The seasons are the ones each of those places actually shows. North of the
   equator a February show is that autumn and a September show is the following
   spring. **South of it the calendar is the other way round**, so São Paulo
   shows the coming summer in April and the coming winter in November, South
   African Fashion Week does the same, and Melbourne in March is showing the
   autumn arriving there as it runs. **India names its own year**: Lakmé is
   Summer Resort in March and Winter Festive in October, and India Couture Week
   in July is a bridal week. Lagos shows one collection a year rather than a
   northern season, and Sydney and Miami show resort. Twenty four of the thirty
   run to a window that is public record; the other six really exist and really
   run but move, stop and restart, so SLATE places them and the row says
   "SLATE's own placement" rather than pretending otherwise.

   Seven of those weeks have a schedule you can act on, because SLATE only
   carries the houses its own shops sell, and the page says so rather than
   inventing a designer nobody can buy from.

   A show is not ticketed and a seat cannot be bought. You write to the house
   and you wait, and what comes back is who you are: how many people know your
   name, what the industry thinks of you, whether you have ever bought anything
   the house makes, and what controversy you happen to be carrying. A house
   guards its front row absolutely and its standing room barely at all, which
   is how a good client nobody has heard of still gets through the door and a
   famous stranger still does not get a Chanel front row. The list closes about
   a fortnight out.

   Then you turn up, and the room looks at what you have on. You have to be in
   that city, and you have to be dressed — the door uses the mirror's own rule
   about what an outfit is missing, so one shirt and nothing else is refused by
   name. What the room makes of it is the mirror's verdict, plus the house's
   own clothes, which is the only compliment that room reads, minus having been
   photographed in the same thing a fortnight ago. Whether a camera points at
   you at all is where you were sat and how many people already know your face,
   and being photographed badly moves the controversy rather than the fame.

   **And the third part: what is on in town.** Two new kinds of room — the
   arena and the concert hall — beside the theaters, museums, stadiums and
   clubs, and fifty real buildings put into them: Wembley, the Stade de France,
   the Azteca, the Maracanã, the MCG, Eden Gardens, the Tokyo Dome; Madison
   Square Garden, the O2, the Budokan, the Bell Centre, the Hydro; Carnegie
   Hall, the Musikverein, the Philharmonie, the Concertgebouw, La Scala, the
   Bolshoi, Teatro Colón, the Ryman, the Hollywood Bowl. Every city of any size
   also gets its own theater and museum, a stadium once there are a quarter of
   a million people, an arena at half a million and a concert hall at four
   hundred thousand, so there is somewhere to be on a Friday in any town the
   game has.

   The seasons are real. Football runs the European winter, baseball the
   American summer, the AFL the Australian one, basketball and hockey indoors
   from October, and cricket is the two hemispheres it actually is — May to
   September in England, October to March on the subcontinent and in the south
   — which is what stops a test match turning up at Wembley in March. A fixture
   is checked against the month it really falls in rather than the month its
   week began in.

   What is on is SLATE's own, and the note says so plainly: there is no
   listings feed, so no fixture is a real fixture, no act a real act, no
   production a real production. A match names no club and a score attaches to
   nobody. A city's whole week is dealt at once, so no act plays two rooms in
   it, no room takes two bookings on one night, and a production or an
   exhibition runs the week rather than changing its title between Tuesday and
   Friday.

   A seat is a band in the house — the best seats, the middle, the cheap ones —
   at a price that is the city's, the room's and the band's, and a busy night
   sells its good seats first. You have to be in that city; the doors open an
   hour and a quarter before and shut half an hour after it starts; and a seat
   nobody sat in stays empty with the money gone. What you made of the night is
   the thing itself against what you like, plus the room around you — a full
   house or nine people, and somebody behind you narrating the whole match.
8. **Done.** The ordinary rooms: a chair, a counter, a queue and a wash.

   Four rooms in every town, in the City list beside everything else there, and
   you have to be standing in one to use it. A chemist carries the sign of a
   chain that really trades in that country — 42 of them across 42 countries —
   except in the nine where the law requires a pharmacy to be owned by the
   pharmacist running it, where it is an independent Apotheke, Pharmacie,
   Farmacia, Farmakeio, Eczane or Apotek in that country's own word, and the
   room says so rather than leaving a gap. A post office belongs to that country's real
   national operator, 93 of them, one to a country. What anything costs, how
   long the queue is, what is on the shelf and how often a parcel goes astray
   are SLATE's own calibration, and the note in each room says which half is
   which. The note in the chemist is about the chemist; the note at the post
   office is about the post.

   A haircut is a clock, not a flag: full on the way out of the chair and
   nothing six weeks later, running from the first day of the life rather than
   from the first time you happen to sit down, and a trim puts back a share
   where a cut resets it. A room that reads it can weigh it. A shelf is 86% of
   the ordinary things, the same 86% every time you walk into that branch, and
   a branch that is out of something says so instead of selling it. Nothing on
   the shelf carries a dose, a claim or an instruction.

   A parcel is a weight, a distance, a service and a wait. Heavier costs more,
   further costs more, abroad costs more again, and the counter will not take
   more than thirty kilos or send anything to the city it is standing in. Then
   it is out of your hands: it arrives, or it is held up somewhere and arrives
   later, or about one in eighty never turns up at all — and an untracked
   parcel tells you nothing in the meantime, because nobody could tell you. It
   can only ever arrive once, however far the world is run on past it.

   A service wash is the other thing a launderette sells: somebody else does
   it, for nearly twice the price, using the same line the mirror draws about
   what is dirty, and your clothes are theirs until tomorrow — off your back
   and out of the wardrobe meanwhile.

9. Childhood through later life, end to end. **Part one is done: the span,
   and what age lets you do.**

   A life that started before the save did. Two people who raised you, sharing
   your name, aged so that nobody in the family could not exist — no parent who
   was a child at the birth and none past having them — and however many
   brothers and sisters, spaced the way brothers and sisters are, some of whom
   have moved away. They are people in the world, not a field: you can call
   them, fall out with them, and lose them.

   A birthday that happens. The number turns over once a year, counted by the
   calendar rather than by dividing milliseconds — which is a day short every
   fourth year and reports the wrong age on your own birthday. What a year
   costs is a ceiling rather than a cliff: your best possible day comes down
   slowly and continuously, and a night puts back less at sixty than it did at
   twenty. Nothing changes overnight because you had a birthday.

   Where the family name comes from is the other thing you choose. 54
   heritages across 18 regions, each carrying the given names and family names
   that are common in it — 820 given names and 736 surnames — so a Yoruba
   family is called Adeyemi and a Korean one is called Park. You pick your own
   and one for each of the two people who raised you, so a family of two
   traditions names its children out of both, and a button suggests a name from
   whichever you chose. A heritage is a naming tradition and nothing else: it
   carries no attribute, no skill and no advantage anywhere in the game, and
   the checker fails the build if one ever grows a number.

   The family reads as a family. Everybody in it has a gender the game knows,
   so the page says Mother, Father, Sister and Brother rather than listing
   people called Parent.

   The size you end up is the one physical fact the player chooses. Set an
   adult height and weight at creation, and a character who starts young is
   smaller than that and grows to exactly it. One growth curve, and the note
   says so: children finish growing at different ages and SLATE carries the
   middle of that rather than inferring anything from a pronoun.

   What is real: life expectancy at birth for 160 countries and the state
   pension age for 115, both published figures carried in whole years, and the
   general national minimum age for driving, drinking, working, marrying,
   voting, signing, leasing and borrowing. The correction that matters is
   stated rather than fudged: life expectancy at birth is an average over
   everybody born and sits well below the age adults reach, which is why
   several countries honestly set a pension age above their own figure, so a
   grown character is measured against an adult figure instead.

   Context decides what is open to you, and the rule is the one where you are
   standing rather than the one on your passport. A nineteen year old is served
   in Berlin and refused in Los Angeles and Tokyo, and the refusal names the
   country, the age it sets and how far off you are. Somewhere alcohol is not
   sold at all, the room says that instead of quoting an age that does not
   exist. Buying a car, taking a lease, opening an account, sitting a driving
   test, borrowing, proposing and walking into a bar all ask.

   And nothing anywhere tells you when you are going to die. The generation
   above you has an end, drawn from a band rather than a table, written onto
   the schedule and onto nothing a screen can reach. The calendar item is
   called A Quiet Day. The player's own character carries no such date at all.

   **Part two is done: school.** A life can start at five now, and there is
   something for it to do. 31 education systems covering 89 countries by name
   and everywhere else honestly on a general one: a fifteen year old is in
   Grade 10 in Los Angeles, Year 11 in London, Class 10 in Delhi and Seconde
   in Paris, and what they sit at the end of it is a diploma, a GCSE, a board
   examination or the Baccalauréat. 94 stages, 46 named qualifications, and
   the ages each country's law actually compels.

   A week is thirty lessons across thirteen subjects, built as a timetable
   rather than drawn at random — no subject twice running and none more than
   twice in a day, which is the constraint a real timetable is built under.
   Marks move on whether you turned up and whether you worked, attendance is
   counted, and below four fifths the school rings home. What the marks come
   to decides whether a university would look at you, and whether it would pay.

   Eight clubs, three of which is as many as anybody keeps up. Sport at school
   is the track and nothing else, and it has a section of its own below.

   And the play, which is the point. Twelve plays a school can actually put
   on, all of them out of copyright and all of them really staged by school
   drama departments. You are cast out of the drama club on what you can
   actually do, and what a young character can do is held under what is in
   them — a gifted twelve year old is a gifted twelve year old, not a
   professional who happens to be short. On the night, somebody outside the
   school is reading the potential rather than the finished thing, which is
   exactly how a child gets found, and it is a narrow doorway.

   The school itself is the honest limit and the room says so: there are
   millions of schools and no feed to name them from, so every one is SLATE's
   own with a plausible name — the district it stands in, or a saint only in
   the countries that name schools after saints.

   **Part three is done: university.** 197 real
   universities across 56 countries, founded between 1088 and 2014 — Oxford,
   Yale, the Sorbonne, Todai, Tsinghua, USP, Wits, RADA, La Fémis, the Beijing
   Film Academy, VGIK. The name, the town and the founding year are public
   record. Where a university stands in a town smaller than the gazetteer
   carries, its real town is on its own row and it is reached from the nearest
   carried city: the page says "Oxford, reached from London" and never claims
   Oxford is in London.

   How a country charges for a degree is real too, and it differs completely:
   57 regimes carried, 17 of which charge nothing at all. Norway charges
   nothing, Germany an administrative fee, England a capped home fee,
   Australia nothing now and a share of your earnings later, America whatever
   the university decides. What SLATE puts on the invoice is its own
   calibration and says so.

   You apply with the marks you actually left school with, five places at
   once, and the answer is a curve rather than a wall: somebody carrying
   ninety is likelier at Manchester than at Oxford and both are possible. A
   drama school auditions instead of reading marks, so a conservatoire will
   look at somebody the academic bar would refuse. Taking a place closes the
   others, charges the year and moves you to the town it is in.

   A scholarship comes off the invoice: an academic one on marks, and a place
   won on sport — which is an American and Canadian arrangement more than a
   universal one, because sport in most of Europe sits in clubs rather than in
   universities, and SLATE carries where it really happens rather than
   assuming everywhere works like America.

   Then three years of terms, and what you leave with is a class of degree
   that depends on what you did while you were there. You can also run out of
   money for the next year, or walk away, and both are written down.

   **Part four is done: room and board, and the track.**

   Tuition is the number everybody quotes and it is often not the biggest one.
   Somewhere to sleep and something to eat are charged separately nearly
   everywhere, are frequently more than the fees, and in the countries that
   charge no tuition they are the whole bill. Four ways to live — at home, a
   room in hall, a shared house, a place of your own — priced against the
   local cost of living, so a year in Manhattan is not a year in Manchester.
   A hall is catered, so a meal plan on top of one is not a thing you can buy
   twice. A full ride covers both halves; an academic award covers the fees
   and leaves the rent. Both halves are charged at the offer and again at
   every year turn, and the bill says which is which.

   And the sport, which is one sport. SLATE used to carry twenty four things
   a school anywhere fields a team in. It does not any more: this is a game
   about acting, and the only sport in it is the track — because the track is
   the one that can run beside an acting career and end in a world final.

   What is real: ten events at their real distances, eighteen world records
   with the person who set each one and the year, the published entry standard
   for a global championship, the two metre a second wind limit, sixty real
   meets in thirty seven towns — the Penn Relays, Champs in Kingston, Arcadia,
   the NCAA championships, the English Schools, Prefontaine, Weltklasse,
   the World Championships, the Games — and the shape of a season at every
   level. Every rival in every lane is SLATE's own, and so is every time run
   in this game: there is no results feed, and a made-up time against a real
   athlete would be a claim about somebody real.

   Sixteen running skills, because a sprinter is not one thing: the block
   start and the reaction, the drive phase, acceleration, top speed, speed
   endurance, relaxation, mechanics, the bend, the barriers, the changeover,
   race tactics, the finish, the winter work, recovery and nerve. Each event
   is decided by its own weighting of them, so somebody brilliant out of the
   blocks and poor over the last forty is a sixty metre runner.

   A time has to be earned. It comes from the sheet, from form built one
   session at a time and lost by weeks away, from the body, and from the day —
   and it is held under the same youth curve as everything else, so a gifted
   twelve year old is a gifted twelve year old. A season is a ladder: dual
   meets against the school across town, then the invitationals, then league,
   regional and the national schools meet, with heats and semi finals at the
   meets that really run them, and a place in the round above that has to be
   won in the round below. Wind is read where it is really read, and a mark
   with too much behind it is still a race and not a record. Hamstrings go.

   Whether there is a team at all is honest: forty one countries whose schools
   really run track, and inside them not every school has one. A place at
   university won on the track is offered where such a place is really offered
   and nowhere else, and it wants a time on the list and a season of meets
   behind it.

   **Part five is done: going professional, and the years themselves.**

   The track runs all the way. Turning professional is a decision with a cost:
   it is money and a plane ticket, and it is the end of a place at a university
   won on the track, because that place is for an amateur. The companies that
   would sign you are real and they really sponsor runners; every contract in
   this game is SLATE's own, because a real deal is private and inventing one
   against a real name would be a claim about somebody real.

   Then the circuit, which is the real one: Xiamen, Doha, Rabat, Prefontaine,
   Bislett, Stockholm, Paris, Rome, Monaco, London, Silesia, Lausanne,
   Weltklasse, Van Damme. The national championships, which is the hardest
   team in the sport to make. The World Championships in the odd years and the
   Games every four, in the years they are really in, and nothing invented for
   a year when there is none. A team is picked on the trials and on the
   standard, both — three from each event and a time inside the entry mark —
   so finishing fourth at a national final with a world class time is an
   ordinary way to miss a championship, and it happens here.

   The published Diamond League and World Athletics prize money is what a
   professional is paid, and a schoolchild and a student are paid nothing at
   all. A sprinter is quickest between the early and the late twenties and
   slower after it however hard the work is, so a career on the track ends
   while an acting one is still going, which is the point of running both.

   And the years themselves. Twenty moments across a life, from the first day
   at a school gate to a call at two in the morning: the tooth, the bike, the
   party, the school trip, being picked last, the talent show, the big school,
   the first phone, the best friend, the falling out, the first one, the party
   you were not at, the first real heartbreak, the first job, the first wage,
   learning to drive, what happens next, moving out. Each comes round on a day
   and goes where everything that needs deciding goes, and what you pick moves
   something real: an attribute, a skill, money in or out, how it sits with the
   people who raised you, or somebody who is in your life now and was not
   before. Nothing narrates a consequence the game does not carry, and the
   checker fails the build if a line claims one. A moment nobody answers
   passes, rather than stopping every other thing in a life.

   The animal a childhood produces is a real thing rather than a line in a
   story: it has a name, it costs money every week for as long as it is alive,
   and when it is not alive any more the game says so rather than going quiet.

   Pocket money goes up with age and stops at eighteen, priced against what
   things cost where you are living. Learning to drive is hours with an
   instructor that cost money by the hour and a test that can be failed and
   paid for again — and the age you may sit it is the country's own, carried
   with the other legal ages rather than assumed.

   And the Saturday job, which is where the money before any money comes
   from. The national minimum wage is published and 51 of them are carried,
   with the year each was set — including the eight rich countries that have
   no statutory minimum at all and set the floor by collective bargaining
   instead, which is the most surprising true thing in that file. A national
   floor stays national: the same figure in the capital as anywhere else,
   and it only moves with the city in the eleven countries that really let a
   state, a province or a city set their own. A young worker is paid less
   where the law allows it, which it does in most of them.

   Fourteen kinds of it, from a paper round at thirteen to a night in a
   warehouse at eighteen, at a real shop of the right kind where the city has
   one and at SLATE's own where it does not. Two shifts a week. A shift costs
   the hours it takes and the energy it takes and teaches something — which
   is the whole point of a job that pays that badly.

   The United States is the country where the floor is least national, so it
   is carried state by state as published rather than worked out from what a
   city costs: thirty one states set a figure above the federal one, five set
   none of their own at all, and two set one below it, in which seven the
   federal $7.25 is what a covered worker gets. Many cities set higher figures
   than their state does and the page says so, because it is true.

   You work for a real company. Fifty of them across twenty six countries —
   Costco, Tesco, Aldi, Loblaws, Woolworths, EDEKA, Carrefour, Lawson and the
   rest — each with the durable public fact about how it pays against the
   floor, at a branch, under a manager, both of which are SLATE's own. There
   is a ladder above you: crew, shift supervisor, assistant manager, store
   manager, each wanting a number of shifts behind you and a manager who
   thinks well enough of you, and each paying more.

   The rota comes out once a week with real kinds of shift on it — the open,
   the middle, the close, a weekend, a night, the last two paying more for the
   reason they really pay more. A shift you do not turn up for is closed off
   as missed and it is noticed. Somebody rings on your day off and asks you to
   come in, and both answers are answers: the cover pays a premium and buys
   you standing, and saying no costs a little of it.

   Nobody is handed cash at the door. Hours go on a timesheet and the money
   arrives on the country's own pay cycle — thirty of them carried, weekly in
   America, monthly in Britain, fortnightly in Australia — as a payslip with
   the gross, the tax, the social contributions and the net on it, worked out
   through the same published rates the rest of the game's tax uses. You can
   ring in sick, and whether that is true is a thing the game knows.

   And the school year itself, which is more than a marks number. Forty four
   real examinations across twenty eight countries on the scales they really
   use: the SAT out of 1600 and the ACT out of 36, the PSAT and the PSAT 8/9,
   Advanced Placement out of five, the Gaokao out of 750, the Suneung, the
   Japanese Common Test, ENEM out of a thousand on each of five areas, the
   EGE and the OGE, the Matura, the Brevet, EvAU, the Maturità, YKS and LGS,
   Högskoleprovet, the Doorstroomtoets, the CBSE boards, JEE and NEET, WASSCE
   and JAMB, the Matric, Thanaweya Amma, the Bagrut, NAPLAN and the ATAR,
   NCEA, the PSLE and the DSE, the OSSLT, the Key Stage 2 tests, the Eleven
   Plus, the GCSE mocks, the UCAT, the IB Diploma and IELTS. Each is entered
   for, revised for with past papers that are worth something up to a ceiling,
   sat on the day, and answered weeks later by an envelope — because nobody
   walks out of a hall knowing what they got, and the game does not tell you
   what your character could not know.

   Every American state is on the calendar too: forty four of them by the name
   they really use, from STAAR and CAASPP to the Regents and Georgia
   Milestones, and the rest with a state assessment that is plainly labelled
   as one rather than given an invented acronym.

   The report comes home. A term ends on the country's own shape of a year —
   three terms in Britain, two semesters in America and Germany, three
   trimestres in France, a year that opens in April in Japan and in February
   south of the equator — and every subject on the timetable is graded in the
   country's own scale: letters and a grade point average out of four, nine
   down to one, one to six with one at the good end, out of twenty, one to
   ten, five to one. A teacher writes a line about the work, effort is said as
   well as attainment, attendance is on it, and a progress report comes
   halfway through the term where that country sends one.

   And the rest of a week, which is where most of who somebody turns into
   actually happens. Twelve real martial arts with their real grading systems:
   Brazilian jiu jitsu white through blue, purple, brown and black with the
   IBJJF's own minimum times and a black belt that cannot be awarded before
   nineteen; judo and karate counting kyu grades up to a first dan; taekwondo
   counting geup grades and giving a child a poom rather than a dan; Krav Maga
   on numbered practitioner levels; kendo, which uses no colored belt at all;
   capoeira on cords. And boxing, Muay Thai, wrestling and mixed martial arts
   carried as grading nobody, because they grade nobody and inventing a belt
   for a boxer would be inventing a fact. A grading wants the federation's
   published time at the grade below and the hours SLATE thinks it really
   takes, and it can be failed.

   Twenty classes that exist in every town — acting, dance, singing, an
   instrument, swimming, first aid, cookery, a language, photography, life
   drawing, sewing, home repair, car maintenance, personal finance, public
   speaking, meditation, chess, wine, bartending, etiquette — and twenty two
   other ways to spend part of a week: who you sit with at lunch, whether you
   join in at gym class or sit it out, hanging around town after school,
   somebody's house, helping at home, reading, practicing, cooking for
   everybody, an early night, a whole day out, staying over, the park,
   volunteering, getting the week straight, fixing something, the garden.

   All of it feeds one sheet: forty seven life skills, from swimming and first
   aid and self defense through typing, home repair, car maintenance,
   gardening, sewing, housekeeping, time management, study skills, mental
   arithmetic, memory, reading, research, correspondence, listening, empathy,
   conflict resolution, etiquette, small talk, networking, dancing, an
   instrument, drawing, photography, nutrition, sleep hygiene, mindfulness,
   resilience, navigation, bargaining, childcare, pet care, cycling, chess,
   cards, wine, bartending and handwriting. An hour is worth less at the top of
   a skill than at the bottom, and a child cannot reach an adult's ceiling
   however hard they work, because they are a child.

   And a job you stop turning up for is a job you stop having. Three shifts
   missed in a row, or a manager out of patience altogether, and somebody else
   is on the rota — with the hours already worked still paid on the pay date,
   because that is the law and it is also just true.

10. **Done.** Free-text intent across all of it. A written phrasebook of 48
    things somebody would type and 339 ways of typing them, matched by the same
    resolver the scene box uses — no model, no network, which is exactly why it
    can say it did not understand instead of guessing. It answers with a plan,
    not a result: the command runs through the ordinary path and owns its own
    refusal. `tools/ask-check.mjs` fails the build if an entry ever points at a
    command the engine does not register, a screen that does not exist, or a
    kind of place the world does not build.

11. **Done.** The memory, and the world that brings things back up.

    Measured before it was built, because the number was the argument: a whole
    simulated year of life left **four lines** in the record. History is the
    milestone book and a life is not made of milestones, so almost nothing a
    character actually did was written down anywhere, and the world could not
    have remembered it if it had wanted to.

    It writes it down now. The simulation already narrates itself — 316
    different world events fire as a life is lived — and **198 of them** now
    carry a rule saying what they mean as a memory: what kind of remembering
    it is, what it was worth at the time, how fast the ordinary part fades,
    and what to file it under. Nothing is invented: a memory exists because an
    event fired, it names which one, and it carries ids rather than names, so
    a shop that changed hands is remembered correctly rather than as it was
    spelled on the day.

    The ranking is what makes it a memory rather than a log. What you would
    still be thinking about is neither the most recent nor the biggest, it is
    both traded off: weight halved by age, at a rate set by the kind of thing
    it was. An ordinary Tuesday is gone in a week. And **nothing weighted 75
    or over ever falls below half of what it was**, however long ago it was
    and however much has happened since — a grading, a funeral, a first pay
    packet. The everyday folds into one memory a week with a count on it, so
    two hundred showers are twenty-nine weeks of showering rather than two
    hundred lines. Bounded at six thousand, and the prune takes the least
    worth remembering first, so a wedding is never evicted for a Tuesday. The
    test proves that one by filling the memory past its bound and looking.

    Then the loop. Once a day the world looks back and raises at most two
    things: a year to the day, something started and never finished, somebody
    not seen in six weeks, something kept at twelve times in a month,
    something really done and then dropped for three months. Every beat
    **cites the record it came from**, and the checker fails the build if a
    cited record does not resolve in that save — so the game can always say
    why it said that, and can never invent a memory to fill a gap. A register
    of every beat already played stops anything coming round twice inside
    three weeks, and never hands back the same one twice running while an
    alternative exists.

    Two rules the checker holds it to that are worth stating plainly. A person
    only remembers what they were actually there for, which is the "do not
    show me what my character could not know" rule applied the other way
    round. And a save where nothing happens stays quiet: a world that invents
    something to say every morning is exactly the fakery this exists to avoid.

    Read on Character → What You Remember. History is untouched — still
    lossless, still the milestone record, still what the History workspace
    reads.

---

## 12. Known blockers, stated plainly

| Blocker | What it needs | What happens meanwhile |
| --- | --- | --- |
| Live retail stock and prices | A licensed retail data feed | Real names, SLATE's calibrated prices, labelled |
| This season's real listings and show schedules | A licensed events feed | Real venues and real seasons; the specific card is SLATE's |
| 100,001 dialogue entries | A writing program; 1,107 written | The tool prints the true number every run |
| Base44 live persistence | A Base44 project and credentials | Steps 2 and 3 are built; see below |
| Retail depth outside the rich world | More authoring, not a feed | 58 markets are thin and `npm run coverage:retail` names every one |

### Base44: two of three done

`docs/BASE44.md` is the full path. In short:

1. **The project.** Yours: one signup, then `npm run base44:deploy`. Nothing in
   the config needs editing.
2. **Done.** `npm run base44:contract` — 22 checks running the real handlers
   against an in-memory SDK. It found a real bug: clearing a slot left its save
   id behind, so a cleared slot refused the next life started in it.
3. **Done.** `npm run base44:smoke -- --slot 3` — eleven checks against a live
   deployment, restoring whatever was in the slot, exiting 78 with "nothing was
   tested" rather than a pass when credentials are absent.

Live persistence stays reported as unverified until step 3 runs green against a
real deployment.
