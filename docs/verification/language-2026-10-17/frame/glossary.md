# Start, Home, Notices And Controls

The frame area's terms, for `docs/GLOSSARY.md`'s section of that name, in its columns. Written 2026-10-17 for brief 14.

| Say | What It Means | Instead Of |
|---|---|---|
| **a life** | One save: a character and their world, in one of the three slots. "That life couldn’t be started." | a universe (kept in "This ends that universe."), a save where the character is meant |
| **slot**, **Slot 1** | Where a life is kept on this device or the server; there are three. | |
| **backup** | The copy of a slot kept before it's written over, and Restore Backup, which brings it back. | a checkpoint |
| **save format** | The version of a save's layout, shown as Save Format 94 on a slot. A save made by an older version is updated when opened, a backup kept first. | schema, schema version |
| **What Needs You** | Home's panel of questions and unread notices. | the Decision Center |
| **question** | A row in What Needs You with answers on buttons and Dismiss (`DecisionItem`). It closes when answered, when dealt with on its own screen, or by itself within two days after its date. | decision |
| **notice** | Something the game tells you, unread until Mark N Read (`Notification`). | notification in prose |
| **urgency**, **importance** | A question's and a notice's place in the order, out of 100 (estimated). Overdue questions come first, then the most urgent; notices most important first. | weight, heaviest |
| **commitment** | Something on the calendar you need to be at; the clock stops at it and asks. Opened, it says A Commitment. | something that wants you, Something You Have To Be At |
| **happens without you** | Something on the calendar that runs on its own when the clock reaches it (a payday, a statement). | the world handles it |
| **a plan of your own**, **your own plans** | What you put on the calendar yourself (`life.commitment`). Only these can be skipped. | |
| **Go**, **Stand Here**, **Skip It**, **Call It Off** | A stop's answers: go to it; wait with the clock paused; walk away from a plan of your own; call off a plan before it starts, or a partner's rehearsal at its hour, at a cost to their trust. | |
| **clash** | Two commitments at the same time; the calendar flags them. | a collision, wanting you at once |
| **Play**, **Pause**, **the clock** | The clock runs a minute for every minute on Play and stops on Pause. A new life starts paused. | live, paused (the preference's values) |
| **Advance**, **On The Way**, **Skip To Event** | Moving the clock on: the menu's lines; the confirmation listing the commitments the move passes; choosing an event to move to. | jump in the player's sentence (the guide keeps it for a move) |
| **an error in the game** | A failure the game didn't foresee. The player's sentence says what changed; the detail is a developer's, in the console. | `<command id> failed: <message>` |
| **estimated** | A figure or a rate the game had to estimate: "at the estimated rate", "Urgency is estimated". | SLATE’s rate, SLATE’s reckoning, SLATE’s calibration, SLATE’s climate model |
