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

**The ask:** "actually getting to wear the things in my wardrobe — this colour
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
  fee and a wait.

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
  with a ticket, a seat, a time and somebody kicking your chair.
- **Fashion weeks** — real cities, real months, real houses showing. Getting in
  is a matter of who you are. What you wear is looked at.
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

1. **Done this milestone.** Company tab canned; Casting locked; founder premise
   out of creation; a hundred real items in every branch; aisles.
2. Retailer coverage to every major market, with a coverage report by country.
3. Getting dressed, properly.
4. The house: pantry, recipes, appliances, objects in rooms.
5. The phone: YouTube in full, then the other three.
6. The independent film: kit shops, rental, shoot days.
7. Cinemas, fashion weeks, venues and events on the real calendar.
8. The ordinary rooms: salon, garage, chemist, post office.
9. Childhood through later life, end to end.
10. Free-text intent across all of it.

---

## 12. Known blockers, stated plainly

| Blocker | What it needs | What happens meanwhile |
| --- | --- | --- |
| Live retail stock and prices | A licensed retail data feed | Real names, SLATE's calibrated prices, labelled |
| This season's real listings and show schedules | A licensed events feed | Real venues and real seasons; the specific card is SLATE's |
| 100,001 dialogue entries | A writing programme; 1,107 written | The tool prints the true number every run |
| Base44 live persistence | A Base44 project and credentials | See below |

### Base44: the actual fix

The server functions, entity schemas and guards are written and unit tested.
What has never happened is a deploy against a live project. Three steps close it,
and only the first needs the player:

1. **Create the Base44 project and supply credentials.** Without this, nothing
   downstream can be exercised, and the state stays honestly reported as
   unverified rather than passed.
2. **A contract test that runs the real function handlers against a stubbed
   SDK.** This can be built now and turns "unverified" into "verified except the
   network hop": every guard, the idempotency key, forward-progress, ledger
   balance, cross-save isolation, the size cap and the backup.
3. **A smoke script** run once after deploy that exercises save, reload, a
   conflicting write from a second tab, and a clear-slot, and prints pass or
   fail per guard.

Step 2 is buildable without the player and is on the list. Steps 1 and 3 need
the account.
