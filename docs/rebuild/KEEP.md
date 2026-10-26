# The Keep Register For The New SLATE

What the owner has decided to carry from this SLATE into the rebuilt one, decided page by page from the captures,
and every detail of each kept thing, so the new build can reproduce it without reopening this one. Started
2026-10-26. Each entry says what was kept, where it lives on this tree (`ed623986`, branch `claude/career-universe`),
how it behaves, how it looks, what holds it, and what the owner said about it.

Captures, as sent: `/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad/capture/shots/`
(this session's scratch; the register is the durable record).

---

## 1. The startup screen and its engine (KEEP, in full)

**Owner's decision (2026-10-26):** "So that startup screen we're going to keep that and its engine."

### What the player sees

The first thing SLATE shows, for about a second on a fast device, longer on a slow one, and for as long as it takes
when something's wrong:

- A full-screen dark field, centred: a radial gradient from `#191c22` at 50% across and 42% down to `#0c0d10` at
  62%, laid over the app (`position: fixed; inset: 0; z-index: 100`).
- The clapper mark 🎬 at 68 px (54 px on a phone), which arrives with a 900 ms animation: from 14 px low, rotated
  -9° and scaled .86 at zero opacity, through +3° and 1.04 at 60%, to rest (`clapper-in`, easing
  `cubic-bezier(.2,.8,.2,1)`).
- The wordmark **SLATE**: 46 px, weight 300, letter-spacing .42em with a matching text-indent so it centres
  (34 px and .34em on a phone), in the text colour `#eceef2`.
- Under it, "A LIFE SIMULATOR": extra-small type (0.72rem), uppercase, letter-spacing .28em, dim text `#8a929e`.
  The words "life simulator" are bound with a non-breaking space so a phone breaks before them, never between them.
- A 2 px progress bar on `#21252c`, its fill the clapper gold `#d8b25f`, animating its width over 280 ms.
- A status line under the bar: the current stage's label on the left ("Reading Save Slots"), the percentage on the
  right in monospace tabular figures. "Ready" at 100%; "Startup Stopped" on a failure.
- The four stages listed, left-aligned, each with a glyph and a colour by state: waiting `·` dim, active `▸` gold,
  done `✓` muted `#a3aab6`, failed `✕` red `#d97a6c`. The list is an `aria-live="polite"` region; the bar is a
  `progressbar` with its value.
- The foot: "Version 1.1.0 · Save Format 94" (the app version and the save schema version, both constants).
- The whole column is `min(520px, 90vw)` wide.

### What the engine does (the stages are real work, not a timer)

Each stage runs in order and moves the bar by its weight, totalling 100:

| # | Label | Weight | What it does |
|---|---|---|---|
| 1 | Connecting To Storage | 30 | `resolveAdapter()`: if a Base44 client is injected on `globalThis.base44` with `functions.invoke` or a `SlateSave` entity, use the Base44 adapter (server-authoritative); otherwise the local adapter ("This Device"). |
| 2 | Reading Save Slots | 25 | `adapter.listSlots()` for slots 1, 2, 3: occupied or not, the save's meta, whether a readable backup exists and the world date it sits at, the stored size in bytes, or an error message if the stored text can't be read. |
| 3 | Checking Each Save | 25 | For each slot with an error, a warning: "Slot N: <error>" plus "Press Restore Backup on the slot to open its backup." when a backup exists. |
| 4 | Checking Save Versions | 20 | For each occupied slot: a save from a newer schema gets "was saved by a newer version of SLATE, so this version won't open it. That keeps the save safe."; an older one gets "was saved by an older version of SLATE. When you open it, SLATE keeps a backup and then updates it." |

Rules the owner should keep with it:

- **A failure stops with a reason and a way on.** The failed stage shows `✕`, the status says "Startup Stopped",
  and a red callout says "<Stage> failed." with the message and a **Try Again** button that reruns all stages from
  the start. If the stages finish but no adapter or no slots came back: "Your saves' storage didn't answer."
- **Warnings never block; the player decides.** With warnings, a gold callout "Before You Continue" lists them and
  offers **Continue**; the result is parked on `window.__slateStartup` until the player presses it. With none, the
  app moves to the slots screen on its own.
- **No fake waiting.** Until 2026-09-27 it opened on a stage that only waited ("Starting The Projector") and
  padded about 850 ms between stages; that was removed and must not come back.
- Unmounting cancels the run (a `cancelled` ref checked between stages).
- The stage list is exported (`STAGES`) so a test can run stages 2 to 4 against an in-memory adapter.

### The persistence engine behind stage 1 and 2 (kept with it)

- **One adapter contract** (`SaveAdapter`): `name`, `serverAuthoritative`, `listSlots`, `load(slot)`,
  `save(universe)`, `remove(slot)`, `backup(slot)`, `restoreBackup(slot)`. The simulation never knows where a save
  lives. Slots are `1 | 2 | 3`.
- **The local adapter** ("This Device"): saves in IndexedDB (database `slate`, store `saves`) where the browser has
  it, local storage where it doesn't, and a moving store that carries a save still in local storage across the first
  time it's read (local storage caps at about five million characters an origin, and a life played to eighty packs to
  about 1.4 million). Keys `slate.save.N` and `slate.backup.N`.
- **Every save is gzipped** before it's stored (`CompressionStream`), base64, with the marker `slate.gz1:` in
  front, which is not valid JSON so a plain older save still loads. A browser without compression streams is told
  "This save is compressed, and this browser can't open it. Open SLATE in an up-to-date browser."
- **Every write backs up what was there first**, then writes the slot's key last and whole, so a failed write leaves
  the slot as it was. A full device gets "There isn't enough storage space on this device to save, so nothing in the
  slot changed. Free some space, or delete a save you no longer want, then try again."; any other failure "SLATE
  couldn't save to this device, so nothing in the slot changed. Try again in a moment."
- **Deleting keeps a backup** of a readable save, and never overwrites a good backup with a corrupt one.
- **A backup is only advertised if it can be read**, so Restore Backup never fails when pressed.
- **Reading a damaged save** says "That save file is damaged and can't be read." or "That file isn't a SLATE save.",
  never the JSON parser's own message.
- **The Base44 adapter** (deployed): the same contract over four backend functions, `loadUniverse` (no slot: list;
  with slot: open), `saveUniverse` (and with `restore: true` to restore), `clearSlot`, plus `recordOfficialResult`
  and `askAssistant` for other features. Writes go through the functions, where the server checks a save balances,
  belongs to this player and hasn't gone backwards. It degrades to the local adapter when the SDK is absent.
  Retries on 5xx, 409 and 429 only; a refusal the server made on purpose is not retried, and its own words reach the
  player.
- **The save's meta**, which the slots screen reads without deserialising the universe: id, slot, schemaVersion,
  createdAt, playtimeSeconds, seed, characterName, portrait (a small copy), careerLabel, locationLabel,
  worldDateLabel, netWorthLabel, appVersion, the save's currency, and `endedAt` for a finished life.
- **The schema version is pinned in two places** that can't share a constant: `SAVE_SCHEMA_VERSION` in the engine
  and `SUPPORTED_SCHEMA_VERSION` in the Base44 guard (Deno, can't import the engine). Both 94 today.

### What holds it

- `tests/b20-guide-startup.test.ts`: the stages read the slots and say what a slot from another version will do; a
  new life is written to its slot and the slot's card says what the save holds; Continue opens it at the same moment;
  every older save fixture opens and draws without error; a save made at 2:37 opens at 2:37 and plays on identical to
  the never-saved life.
- `tests/persistence.test.ts`, `tests/save-migration.test.ts`, `tests/b26-persistence-repeats.test.ts`,
  `tests/b27-older-save.test.ts`.

### Where it lives on this tree

`src/ui/startup/StartupSequence.tsx` (230 lines), `src/engine/persistence/adapter.ts`, `local.ts`, `base44.ts`,
`src/engine/version.ts`, `src/styles/app.css` (`.startup`, `.startup-inner`, `.clapper`, `clapper-in`, `.wordmark`,
`.wordmark-sub`, `.startup-bar`, `.startup-status`, `.startup-stages`, `.startup-stage[data-state]`), the design
tokens in `:root` of the same file, `index.html` (title SLATE, the clapper as a data-URI SVG favicon, the description
"SLATE: an actor's life, simulated hour by hour.", `color-scheme: dark light`, `viewport-fit=cover`), and
`src/app/SlateApp.tsx`, whose phase router goes startup → saves → creation → playing.

### The design tokens the screen is drawn with (kept, since the look is the thing)

Surfaces `#0c0d10` → `#131519` → `#191c21` → `#21252c` → hover `#262b33`; overlay `rgba(6,7,9,.82)`. Text `#eceef2`,
muted `#a3aab6`, dim `#8a929e` (4.9:1 or better on every surface, WCAG AA). Lines `#262a31`, strong `#363c45`. The
clapper gold `#d8b25f`, strong `#efc978`, dim and line tints at .14 and .32 alpha, "used sparingly, for identity and
for what matters". Positive `#6db98a`, negative `#d97a6c`, warning `#dda863`, info `#7aa5c9`, each with a .14 tint.
Type: the system sans stack; monospace for figures. Sizes 0.72 / 0.8 / 0.875 / 1 / 1.25 / 1.6 / 2.1 / 3 rem. Space 4,
8, 12, 16, 24, 32, 48, 64 px. Radii 6 / 10 / 16 px. Two shadows. Nav 56 px, rail 232 px.

---

## 2. The slots screen (KEEP, with its words to be rewritten)

**Owner's decision (2026-10-26):** keep the screen and what it does; "text here is too robotic so that will need to
change." So: the layout, the states, the behaviour and the engine are kept as they are; every string below is to be
rewritten in the new build, in a warmer voice, and this list is the inventory the rewrite works from so nothing is
dropped by accident.

Captures: `captures/01-opening/00-opening-slots.png` (fresh), `01-slots-occupied.png` (a life in Slot 1),
`01-slots-delete-confirm.png` (the confirmation).

### What the player sees

- The clapper at 44 px, the wordmark at 32 px, and one line under it. Then three cards in a grid (`auto-fit`,
  280 px minimum, 24 px gaps, so three across on a laptop and one above another on a phone), each at least 300 px
  tall, on the surface colour with a 1 px line and the 10 px radius. An empty card has a dashed border and centres
  its contents in dim text. The slot number is extra-small uppercase with .16em letter-spacing. A name is 1.6rem at
  weight 600. The four facts sit in a two-column grid. A foot line at the bottom.
- **Empty slot:** "SLOT N", the sentence, New Save. With a leftover backup: a different sentence, New Save, Restore
  Backup, and the backup's date.
- **Occupied slot:** headshot (when one was uploaded) beside the name and the title line (the save's `careerLabel`,
  "Actress, Yale Drama Year 1" here); Date, Location, Net Worth (monospace), Played (monospace: `0s`, `12m`,
  `3h 7m`); the version line; the backup note when there is one; Continue (full width, gold), then Restore Backup
  (when there is one) and Delete side by side.
- **A finished life:** Continue reads "See How It Ended" and the life opens on its ending with the clock stopped
  (a save with `endedAt`, or whose title line ends ", Died At N").
- **A damaged save:** "Unreadable Save" in place of the name, the reason in red, Restore Backup if there's a backup,
  Delete.
- **Opening:** the pressed button reads "Opening…" and every button on the screen is disabled until it's done.
- **An error opening** shows in a red callout above the grid; a save that fails validation also has a fold-out
  "What's Wrong With It" listing the checker's lines (developer's words, kept behind the fold on purpose).
- **Delete** opens a modal ("Confirm Deletion" to a screen reader) over a dimmed screen; clicking outside it or Keep
  It closes it.

### Every string on the screen as it stands (all to be rewritten)

| Where | Text now |
|---|---|
| Under the wordmark | "Three slots, three separate lives. What happens in one never touches the others." |
| Empty slot | "An empty slot. Press New Save to start a life here." |
| Empty slot with a backup | "Empty, but there's a backup of the save that was here." |
| Buttons | "New Save", "Continue", "See How It Ended", "Opening…", "Restore Backup", "Delete" |
| Backup note | "Backup from <date>" / "Backup from an unknown date" |
| Damaged save | "Unreadable Save", then the adapter's reason: "That save file is damaged and can't be read." / "That file isn't a SLATE save." / "This device's storage couldn't be read just now. Reload SLATE to try again." / "This save is compressed, and this browser can't open it. Open SLATE in an up-to-date browser." |
| Failed validation | "The save in Slot N is damaged, so it can't be opened." + " Press Restore Backup to open its backup instead." when one exists; fold-out "What's Wrong With It" |
| Version line | "Version 1.1.0 · Save Format 94" + " · Updated When Opened" for an older save + " · 8 KB" |
| Facts | "Date", "Location", "Net Worth", "Played" |
| Foot | "SLATE 1.1.0 · Saved To This Device" (local) / "Saved To Base44 · The Server Checks Each Save" (deployed) |
| Delete modal | "Delete Slot N?"; "This deletes <Name>'s life from the slot, with everything that happened in it." (or "This deletes the save in this slot." when no name can be read); "SLATE keeps a backup, so if you change your mind, press Restore Backup on this slot to bring it back." or "This slot has no backup, so you can't bring it back afterwards."; "Keep It", "Delete Slot N" |

### What the engine does (kept as is)

- Reads the slots the startup sequence handed it, and re-reads them after a delete.
- **Continue:** `openSlot(adapter, slot, { fromBackup })`, which keeps a backup of an older save before bringing it
  forward to the current schema; then loads the save's towns' countries (`loadPlacesFor`), validates the universe,
  and only then hands it to the app. A failure at any step is said in the callout and nothing opens.
- **Restore Backup** is Continue with `fromBackup: true`: the backup is written over the slot and opened.
- **Delete** keeps a readable save as its own backup (see entry 1), so the modal can promise Restore Backup; an
  unreadable save can only promise it where a backup already exists (`restorableAfterDelete`).
- **Net worth, date, location, title** are read from the save's meta, which the engine refreshes on every save
  (`refreshMeta`), so the card never deserialises the universe to draw itself.

### What holds it

`tests/b20-guide-startup.test.ts` (the card says what the save holds, each fact read again from the life; Continue
opens at the same moment; every older fixture opens), `tests/persistence.test.ts`.

### Where it lives on this tree

`src/ui/saves/SaveSlots.tsx` (copied to `kept/01-startup-and-persistence/SaveSlots.tsx`), `src/styles/app.css`
(`.slot-grid`, `.slot`, `.slot-empty`, `.slot-number`, `.slot-name`, `.slot-meta`; copied to `slots.css`), and the
`openSlot`, `loadPlacesFor` and `validateUniverse` entry points of `src/engine/index.ts`.
