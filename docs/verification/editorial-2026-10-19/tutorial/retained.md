# What The Tutorial Area Kept

Brief 15 asks that kept text pass the same standard as rewritten text, with a reason specific to it. Twenty-one of the
area's 47 sources were kept whole. Here are twelve of them, with their words and the reason in their second-pass
status, and three sentences kept word for word inside chapters that were otherwise rewritten.

## Kept Whole

| Source | Its words | Why it stays |
|---|---|---|
| `world/tutorial.ts#lockedBecause` | “Read “Sleep” in the guide first. The chapters open in order, and “Your Life, Hour By Hour” is next: press Guide, at the top of the screen.” / “Read “Your Bank” in the guide first. Press Guide, at the top of the screen, to read it.” | A locked control's reason names the chapter to read, the one to read first when it's another, and where the Guide button is, in two short sentences. Nine tests hold it word for word. |
| `Guide.tsx#LockedPanel` | “This opens when you read “What’s Coming” in the guide: what’s coming up, and what to do when the clock stops for it.” and Read About It | The panel keeps its title, says Locked, names the chapter and what the panel will hold, and its button opens that chapter. Its second half is each chapter's lead, so it moved with the leads that changed. |
| `Guide.tsx#GuideStrip` | “Guide · 2 Of 17 What’s Coming · What’s coming up, and what to do when the clock stops for it.” and Read | Where the player is, the next chapter and one short button to it. |
| `Guide.tsx#GuideButton` | Guide (16 Left) | The top bar's button, by the name every chapter uses for it, with what's left. |
| `Guide.tsx#Gated` | Locked | The one word a locked control adds after its own label: the control still says what it is. |
| `Help.tsx#HelpDialog` | “The clock waits while you read.”, Back, Close, Search How This Works, “A feature, a word or a question” | The help's frame: the clock's hold said once at the foot, and a search box labelled with what it searches. |
| `Help.tsx#HINT` | “Type a feature’s name, a word for it or a question, such as “clock stopped” or “how do I pay my card”.” | Says what can be typed and gives two searches a player would write, each of which finds an entry. |
| `Help.tsx#Results` | “Nothing matches “zzqx”. Try fewer or different words, or go back to Contents.” | Repeats what was typed and gives the two real ways out. |
| `Help.tsx#CONNECTION_HEADING` | Comes First, Changes Straight Away, Changes Later, Counts Toward, Kept In Your Record, Worth Doing With It | Plain words for what passes between two entries, each distinct, the glossary's set. |
| `Help.tsx#HelpProvider` | Back To Help, Back To School, and the ✕'s accessible name, Dismiss Back To Help | Each button names where it goes; the ✕'s name says which buttons it hides. |
| `guide/index.ts#GOALS [day]` | “What’s coming, the clock, moving time on, what needs you, your own plans and the weather.” | Lists the group's six entries in order, by the names the player meets on Home. |
| `content/tutorial.ts#hoursOf` | “half an hour”, “14 hours” | The Sleep chapter's range said the way a person says it. |

## Kept Inside A Rewritten Chapter

- **Drama School:** “The note is the game’s, written as your course’s teachers would say it.” Short, true, and the
  label of a simulation (`docs/STYLE.md`, Truth in the text); `tests/remaining-school.test.ts` holds it.
- **You As An Actor:** “Practice is work you set yourself, outside class.” The glossary's definition in eight words,
  in the sentence that tells abilities, techniques, genre knowledge and practice apart.
- **A Whole Life:** “When it ends, the clock stops for good, and the save shows who you were, what you earned and what
  you left behind. It stays in its slot until you delete it.” Plain, specific, and says what the player can still do.
