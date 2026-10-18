# Brief 14, The JSON Area: Defects

Functional defects found apart from the writing, and writing defects in another area's code that this area's words sit
inside. None of these was fixed here: each is in a file this area doesn't own, or needs a decision.

## D1. The genre look says "only in single examples" of genres the research holds low for other reasons

**Where:** `src/ui/looks/actor.tsx`, the genre look's "Why it adds no requirement." paragraph (the profile area's). For a
genre whose research names requirements at low confidence and no `belongsTo`, it says: "The research found this only in
single examples (…), with low confidence, so the game doesn’t treat it as a requirement of the genre."

**What's wrong:** the sentence is shown on 10 genres, and it's false of all 10. The research holds each low for a reason
that isn't single examples, and says so in the same look's small print (a genre whose low evidence is one film or one
role has a `belongsTo`, and the look says that instead):
- **Black comedy, stoner comedy:** a requirement by definition only, with no source stating a technical convention.
- **Buddy cop:** two student works (an MA thesis and an undergraduate paper), which describe the whole genre.
- **Buddy comedy:** one publisher's statement, read only as a search summary.
- **Chase, gothic horror, magical realism, slice of life, space opera:** the research calls the requirement unsupported,
  not shown in examples.
- **Blaxploitation:** inferred from the whole cycle's violence, with no source stating fight work.

So a player reads "only in single examples" above small print that says otherwise.

**How found:** reading every genre's look, rendered (`genre-looks-after.txt`).

**Suggested fix, for the profile area or the coordinator:** say what's true of all of them: "The research holds this
with low confidence (…), so the game doesn’t treat it as a requirement of the genre. Why is in the small print below."
It's one string; `tests/evidence2-b08.test.ts` doesn't assert it.

The Player Profile's Genres table says the same thing shorter, in its It Asks For column
(`ui/workspaces/ProfileWorkspace.tsx`, also the profile area's): "Not established: the research rests on one example",
for all 51 low genres the research names requirements for. It's false of the ten above, and of several of the 41 whose
demand belongs to a role or particular material: fantasy rests on two productions, horror on one advice site's general
claim, true crime on a kind of role. "Not established: the research holds it with low confidence" is true of all 51.

## D2. "Why it’s applied, in the research’s words:" now heads the game's words

**Where:** `src/ui/looks/actor.tsx`, the small print of an applied genre's look (the profile area's).

**What's wrong:** from this area's batches, the reasons it heads are the research's reasons in the game's words (its
working labels such as "genre-wide:" gone, its tag ids named as the look names them, its spelling and contractions the
house's), not the research's own words, which `research-genre-demands.json` keeps. The label claims a verbatim quotation
that's no longer one.

**Suggested fix:** "Why it’s applied:". One string, asserted by no test.

## D3. The genre look's small print is one paragraph

**Where:** `src/ui/looks/actor.tsx`, the genre look (the profile area's layout).

**What:** for an applied genre, the reasons, what the research says, how it was read, and what's uncertain run as one
`xs dim` paragraph: about 2,000 characters for adventure, which at 390 wide is some forty lines of small text with no
break (`ui/genre-look-adventure-390-small-print.png`, from `genre-look-ui.mjs.txt` on the built app). It wraps cleanly,
nothing is clipped and the page never scrolls sideways at either width; it's a wall of text, which the brief names. It was
the same before this pass (the words are about 3% longer now: "couldn’t be opened" for "403", sentences for fragments).

**Suggested fix:** three short paragraphs, each with the heading the look already has in words ("Why it’s applied",
"What the research says", "Still uncertain"), or the small print behind a drill-down. Layout, not words; the profile
area's or the coordinator's call.
