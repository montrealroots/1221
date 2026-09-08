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

Still to come: the assortment should differ between two branches of the same
chain in different countries, because it really does.

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
  seasons, tickets that sell out.
- **Restaurants** — done. Bars and clubs — done.

---

## 9. Ordinary life, which is most of it

The salon, the barber, the dentist, the garage, the post office, the launderette,
the pharmacy, the vet, the DMV, the bank branch, the phone shop. Each one a room
with somebody in it. Most of these are two minutes of play and they are what
makes the rest feel real.

---

## 10. Free text that actually does things

Say what you want in your own words. The game works out which supported action
you meant, asks when it cannot tell, does it, and tells you what happened. It
never pretends to have done something it cannot do. Where the answer is no, the
answer says what would make it yes.

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
   lived through the Advance button never needs washing at all; and film kit
   is not yet a thing that lives in the house, which waits on section 6.
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

   **Still to come:** the kit does not live in the house yet, so a camera you
   own is an asset rather than a thing on a shelf in a room.
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
   seven cities, running in the months they really run in — the four, and the
   Paris and Milan menswear weeks, and Paris couture in January and July, and
   Copenhagen and Tokyo and Seoul and Lagos and São Paulo and the rest of them.
   A collection is named a season ahead of the calendar the way the trade names
   it, so a February show is that autumn and a September show is the following
   spring. Seven of those weeks have a schedule you can act on, because SLATE
   only carries the houses its own shops sell, and the page says so rather than
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

   **Still to come in this section:** concerts, matches, galleries and venues
   on the real calendar.
8. The ordinary rooms: salon, garage, chemist, post office.
9. Childhood through later life, end to end.
10. Free-text intent across all of it.

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
