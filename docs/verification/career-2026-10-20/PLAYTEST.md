# Brief 19's Route: From The Last Term Into The First Paid Job

A route for the owner to play by hand, about forty minutes (brief 19: "one complete playable career loop"). It follows
one actor from the last term at the School, through the Actor Showcase and the School's follow-up, to a meeting with the
agent, his agreement, an audition, a booking, the work days and the pay, and reads what each screen says on the way.
Each step says what to press, what you should read, and what to report.

**What the automated runs are, and what they aren't.**
- **The lives:** `playthroughs/` played two lives through the whole step into the career, and an older graduate's save
  and a mid-term save on into it, with every notice, stop and button press written down (`playthroughs/transcripts/`).
- **The built app:** `app/` walked 52 of the career's surfaces at 1440 and 390 from the keyboard, read each, and held
  each to no errors, no sideways scroll and every control named and reached (`app/walk/`).
- **This route's setup:** `playtest-check.mjs` takes the console snippet below from this file and runs it on a build
  with the saves in place: each save opens, Continue goes into it, and the Career screen opens, with no page errors
  (`playtest-check.txt`, on `a483247d`).
- **What none of that is:** a person's look. Whether the agent reads as a person's office and not a calculation,
  whether the money is clear, whether a step is where you'd look for it, is what this route is for, and only you can say
  it. Criterion V17 stays open on it.

**The agent.** Jordan Parente and Stewart Talent are a real agent and agency's names, used under your open decision
(written permission, or a fictional name in their place). Every one of his screens and notices says his words and
decisions are invented. Nothing here sends anything to anyone outside the game.

## Setting Up

It runs on a local build. Nothing is deployed. A new life starts in August 2026 and the career begins in the third
year, so the route opens saves made by playing one life there: `app/make-saves.ts` plays Ada Cole from her first day,
every career step her own command (its header says what it sets up and why), and writes nine saves. In PowerShell 7:

```powershell
npm ci
npx vite-node docs/verification/career-2026-10-20/app/make-saves.ts -- saves
npm run build
Copy-Item -Recurse saves dist/saves
npx vite preview --port 4173
```

Open http://localhost:4173, then the browser's console (F12), and paste this once. It defines `open`, which puts a save
where the game keeps its own and reloads the page:

```js
const open = async (name) => { const t = await (await fetch(`/saves/${name}`)).text(); await new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = res; }; }); location.reload(); };
```

Then `await open('last-term.json')` for the first step. The page comes back at the save slots, with the save in Slot 1:
press Continue. Opening a save replaces Slot 1's life in this browser. Each save opens paused; press Play, Advance or Go
to move on from it, as a player would.

**As you go, note any sentence that:**
- you had to read twice;
- sounds like a form, or like the game explaining its own workings;
- says the same thing twice in one place;
- calls something by a name the screen doesn't use;
- claims something of the real agent or agency beyond the game's data;
- tells you to do something the screen doesn't let you do.

The page and the sentence are enough.

## 1. The Last Term (8 Minutes), on `last-term.json`

January 8, 2029, the last term's first day.

1. Open **Career** from the menu. Read **Overview**: The Way You’re On should say where you are (a candidate in year three
   of three) and what the Bulletin says about finishing early.
2. **Portfolio.** You have no headshots, résumé or reel. Each button says its time and cost before you press it:
   Book A Headshot Session (4 Hours, $700.00), Make Your Résumé (1 Hour), Cut A Reel (2 Hours, $250.00). Cut A Reel is
   grayed: read why.
3. Press Make Your Résumé. Read the résumé it makes: your School credits should be there as School credits, not
   professional ones.
4. Open **School**, then Coursework: The Actor Showcase. Choose the scenes (Choose These Scenes).

**Report:** whether you knew what to do first on the Career screen, and whether any cost surprised you after you pressed.

## 2. The Showcase And The Follow-Up (6 Minutes), on `after-new-york.json`, then `follow-up.json`

1. `after-new-york.json`: School, Coursework. Read how each showcase day went.
2. `follow-up.json`: May 11, 2029. Read the notice from the School's follow-up, then Career, **Representation**. Where
   You Stand With Him should read Introduced, and What’s Next should say what to do and by when.
3. Read Your Materials For Him. Press Check Your Materials, then Send Your Materials. If the check finds something
   missing, fix it from the Portfolio tab, as it says, and send again.

**Report:** whether his office reads as a busy office answering an actor, or as a score; whether "Fictional: his words
and decisions here are invented." is clear without being in the way.

## 3. The Meeting And The Agreement (8 Minutes), on `meeting.json`, then `offered.json`

1. `meeting.json`: 8 AM on the meeting's day. Press Go. The clock stops at the meeting: read the stop, with Ask To Move
   as a third choice. Go to it.
2. Open the Calendar and the meeting's entry: it should say where, when and the trip.
3. `offered.json`: Representation. Read The Agreement, every term and the basis it's marked with (a published rule, or
   the game's own term). Under Why It Went This Way, press Show The Reasons.
4. Accept The Agreement, or Decline The Agreement. Either is a real answer.

**Report:** whether the agreement's terms read as something you could sign, and whether the reasons tell you why he
offered and what would have changed it.

## 4. An Audition And An Offer (8 Minutes), on `audition.json`, then `offer.json`

1. `audition.json`: Career, **Opportunities**. Read In Progress: each audition says where, when, and how prepared you
   are. The preparation buttons (Break It Down, Learn The Lines, Rehearse It On Your Feet) say their time.
2. Go to an audition when the clock stops at it.
3. `offer.json`: the offer's card under Offers. Read The Project, The Part, What It Asks, When And Where, and Pay against
   the minimum it names. Accept The Offer.

**Report:** whether you could tell what the part asks of you, and whether the pay line says enough to decide on.

## 5. The Work And The Pay (8 Minutes), on `work-day.json`, then `paid.json`

1. `work-day.json`: 5 AM on the first shoot day. Press Go; the clock stops at the call. Go to it. Read the **Work** tab:
   promised pay and the commission expected.
2. `paid.json`: Career, Work, Finished Engagements. The pay should show gross, tax withheld, what reached you, and the
   commission on its own line, taken only on what's over scale.
3. Open **Money**, Statements: the pay passed on from the agency's client trust account.
4. Open **Papers**, Permission To Work: what the game read when you accepted the work.
5. Back on Career, Work, Your Unions: Equity's payments and when the next is due; whether you can join SAG-AFTRA yet.

**Report:** whether the money adds up as you read it, and whether you'd know from these screens what you owe the unions
and when.

## What To Send Back

For each step: anything noted above, with the page and the sentence. And one line on the whole: did it feel like one
career carried on from school, or like a second game bolted on?
