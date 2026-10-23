# Landscape Only On A Phone: How A Phone Is Told, And What Turning It Does

The owner's decision in brief 23, section 2: "do not build a portrait gameplay layout." On a phone held upright SLATE
shows Rotate Your Phone To Play over everything, and nothing else. The code is `src/ui/shell/turn.tsx`, and
`tests/b23-turn.test.ts` holds it.

## What A Phone Is

A phone is a device with **a coarse pointer** (`(pointer: coarse)`: a finger, not a mouse or a trackpad) and **a screen
whose short side is 500 CSS pixels or less** (`Math.min(screen.width, screen.height)`). It's never decided by the
window's size, so a desktop window of any width, however narrow, is never a phone.

| Device | Pointer | Screen's short side | A phone |
|---|---|---|---|
| A desktop or laptop window, any width | fine | 720 or more | no |
| iPhone SE, 14, 15 Pro Max | coarse | 375, 390, 430 | yes |
| Pixel 8 Pro, Galaxy S24 | coarse | 448, 384 | yes |
| iPad mini, iPad | coarse | 744, 820 | no |
| A touch-screen laptop | coarse (or fine) | 800 or more | no |
| A folding phone opened out | coarse | about 690 | no: it plays as a tablet |

A check that the device can't hover was in the first draft and went the same day. Beside the screen's size it changed
nothing (mutated out, every test still passing), and it would have let a phone with a stylus that hovers play upright.

## When It's Upright

Read from the **screen's own orientation**: `screen.orientation.type`, then the older `window.orientation` (Safari before
16.4), and only where neither is known the window's shape (`(orientation: portrait)`). An on-screen keyboard shortens the
window, not the screen, so it never turns a phone on its side into "upright". The walk checks that: a typed field, the
window shortened by half with the keyboard up, and no rotate screen (`checks.form.noRotateForKeyboard`). Safari keeps
`screen.width` and `screen.height` in the phone's upright figures whatever way it's held, which is why the short side is
`Math.min` of the two.

## The Fallback Where It Can't Be Told

Where the page can't say what the device is (no `matchMedia` or no `screen`), it isn't a phone, and the game plays in the
layout it has for a narrow window: the bar in two ordered rows, the rail as a drawer, one column. That layout is kept for
exactly this, not built as a portrait game.

## What Turning It Does

- **Upright:** Rotate Your Phone To Play, and "SLATE is designed for landscape play. Turn your phone on its side and
  everything is as you left it."
  - The game under it is `inert`: nothing can be pressed, tabbed to or read by a screen reader.
  - A key or a tap behind it reaches nothing. A dialog's Escape, the game's H, C and P, and the tap outside an open menu
    that would close it are all stopped before they arrive.
  - Nothing is unmounted. The screen, its tab, an open look, an open dialog or menu, and what was typed in a form stay
    as they were.
- **The clock:** a live clock is paused as Pause pauses it (`world.set_preferences`), so no time passes in the world
  while the phone is upright.
- **Back on its side:**
  - The main column's scroll and the focus are put back.
  - The game is still paused, and a toast says once "Paused while your phone was upright. Press Play to carry on."
  - Play starts the live clock again from that moment, so the minutes upright are never added on.
  - A clock that was already paused is left alone, and nothing is said.
- **Orientation lock:** asked for once a page, where the browser has `screen.orientation.lock`. Most browsers refuse
  outside fullscreen, and the refusal is let go. Fullscreen is never asked for.
- **Before and after the game:** the start, the saves and character creation are inside the same frame, so a phone upright
  sees the rotate screen there too. There's no clock to pause there.

## What Was Tested, And How

- **Tests** (`tests/b23-turn.test.ts`), on the real game provider and its live clock with faked timers:
  - a minute upright moves nothing;
  - back on its side, the game is still paused and says so once;
  - Play goes on from then;
  - an already-paused clock gets no command and no word;
  - a second turn says nothing new;
  - the device table above, and the lock asked for once.
- **Mutations:** each line of the pause and the read was mutated. Every one failed a test but two, which both went: the
  hover check, and a hold on the clock kept beside the pause, which the paused clock already settled.
- **The walk** (`app/capture.mjs`, its turn suite), at 390×844 upright, from 844×390 on its side, in Playwright's
  Chromium with touch emulation. The turns are made:
  - with the clock running and the Advance menu open;
  - with the Sleep dialog open;
  - with "drama" typed into the Profile's genre search, and the keyboard's shortened window;
  - with the clock paused;
  - while Save & Exit writes the save.

  Each result is in the walk's audit (`checks`). This is emulation. **No physical phone was used.**
