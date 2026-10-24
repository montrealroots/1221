/**
 * A phone turned upright (`src/ui/shell/turn.tsx`). From 2026-10-23 (the owner's brief 23, section 2) to 2026-10-24 this
 * held the gate: Rotate Your Phone To Play over the game, the frame under it inert, every key and tap swallowed, and the
 * live clock paused while it showed (`usePauseWhileUpright`), said once when the phone turned back. Brief 27 took the gate
 * out ("REMOVE the “Rotate Your Phone To Play” overlay and mandatory orientation gate ... including any inert state,
 * blocked controls, or forced pause on rotation"), and this holds what stands instead: nothing covers the game, nothing
 * is made inert, nothing on a turn pauses the clock or sends a command, and a turn puts back the scroll and the focus the
 * new layout moved. The file keeps its name because the sweep's register and the text records cite it.
 *
 * What a phone is, and upright, is still `readDevice`'s, read here from stand-in devices; it decides only whether the
 * landscape lock is asked for. The turn as a player meets it, with a played life on the built app, a modal open, a form
 * typed, the clock running and the scroll moved, is walked in a browser
 * (docs/verification/career-universe-2026-10-24/walk/turn.mjs, its README).
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readdirSync, readFileSync } from 'node:fs';
import * as turn from '@/ui/shell/turn';

const { readDevice, askLandscapeOnce, PHONE_SHORT_SIDE, TurnFrame, alongOf, restoredTop } = turn;
const source = (f: string) => readFileSync(f, 'utf8');
/** A source's code without its comments, which keep the gate's history in the past tense. */
const code = (f: string) => source(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('A phone upright covers nothing and pauses nothing (from 2026-10-24, brief 27)', () => {
  it('has no rotate screen, no pause on a turn and no word of one to say', () => {
    for (const gone of ['RotateScreen', 'usePauseWhileUpright', 'UprightContext', 'useUpright', 'PAUSED_WHILE_UPRIGHT']) expect(gone in turn, gone).toBe(false);
    const html = renderToStaticMarkup(createElement(TurnFrame, null, createElement('main', { id: 'main' }, 'The game')));
    expect(html).toBe('<div class="turn-frame"><main id="main">The game</main></div>');
    expect(html).not.toMatch(/Rotate Your Phone|role="dialog"|inert/);
  });

  it('makes nothing inert, swallows no key or tap, and sends no command on a turn', () => {
    const frame = code('src/ui/shell/turn.tsx');
    expect(frame).not.toMatch(/\binert\b/);
    expect(frame).not.toMatch(/stopImmediatePropagation|stopPropagation|preventDefault/);
    expect(frame).not.toMatch(/set_preferences|useGame|\brun\(/);
    // The shell no longer calls a pause on a turn; the stylesheet no longer draws the screen.
    expect(code('src/ui/shell/GameShell.tsx')).not.toMatch(/Upright/);
    expect(code('src/styles/app.css')).not.toMatch(/rotate-screen|rotate-glyph|turn-frame\[inert\]/);
    // Nothing else in the interface pauses the clock because of the device's orientation.
    const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(`${dir}/${e.name}`) : /\.(ts|tsx)$/.test(e.name) ? [`${dir}/${e.name}`] : []));
    const pausesOnTurn = files('src/ui').filter((f) => /orientation|upright/i.test(code(f)) && /timeSpeed:\s*'paused'/.test(code(f)));
    expect(pausesOnTurn).toEqual([]);
  });

  it('puts a scroll back to the pixel in the layout the player left it in, and as a share of its length in the other', () => {
    // Career Work, 300 pixels down a 1,500-pixel page in a 390-pixel window on its side: 27% along.
    const along = alongOf(300, 1_500, 390);
    expect(along).toBeCloseTo(300 / 1_110, 6);
    const kept = { layout: 'sideways', top: 300, left: 0, along };
    // Upright, the same page is 2,600 long in an 844 window: the same share of the new length.
    expect(restoredTop(kept, 'upright', 2_600, 844)).toBe(Math.round(along * (2_600 - 844)));
    // Back on its side, not scrolled upright: the very pixel, not the share rounded twice.
    expect(restoredTop(kept, 'sideways', 1_500, 390)).toBe(300);
    // A column too short to scroll keeps nothing to put back.
    expect(alongOf(0, 300, 390)).toBe(0);
    expect(restoredTop({ layout: 'sideways', top: 0, left: 0, along: 0 }, 'upright', 300, 844)).toBe(0);
    // Changing the input changes the outcome: further down, further down after the turn.
    expect(restoredTop({ ...kept, along: alongOf(900, 1_500, 390) }, 'upright', 2_600, 844)).toBeGreaterThan(restoredTop(kept, 'upright', 2_600, 844));
  });
});

describe('What a phone is, and upright, read from the device', () => {
  const device = (o: { coarse?: boolean; hover?: boolean; w: number; h: number; type?: string; angle?: number; portrait?: boolean }) => ({
    matchMedia: (q: string) => ({ matches: q === '(pointer: coarse)' ? !!o.coarse : q === '(hover: none)' ? !o.hover : q === '(orientation: portrait)' ? !!o.portrait : false }),
    screen: { width: o.w, height: o.h, ...(o.type ? { orientation: { type: o.type } } : {}) },
    ...(o.angle !== undefined ? { orientation: o.angle } : {}),
  });
  it('a phone on its side, upright, and as Safari reports it (the screen always upright in its figures)', () => {
    expect(readDevice(device({ coarse: true, w: 844, h: 390, type: 'landscape-primary' }))).toEqual({ phone: true, upright: false });
    expect(readDevice(device({ coarse: true, w: 390, h: 844, type: 'portrait-primary' }))).toEqual({ phone: true, upright: true });
    expect(readDevice(device({ coarse: true, w: 390, h: 844, type: 'landscape-secondary' }))).toEqual({ phone: true, upright: false });
    // Safari before 16.4: no screen.orientation, the older window.orientation.
    expect(readDevice(device({ coarse: true, w: 390, h: 844, angle: 90 }))).toEqual({ phone: true, upright: false });
    expect(readDevice(device({ coarse: true, w: 390, h: 844, angle: 0 }))).toEqual({ phone: true, upright: true });
    // Neither: the window's shape, the last resort.
    expect(readDevice(device({ coarse: true, w: 390, h: 844, portrait: true }))).toEqual({ phone: true, upright: true });
  });
  it('never a phone: a desktop window of any width, a tablet, a touch laptop, and a page that can’t say', () => {
    // A narrow desktop window: a fine pointer that hovers.
    expect(readDevice(device({ hover: true, w: 390, h: 844, type: 'portrait-primary' })).phone).toBe(false);
    // A tablet: touch, but its short side past a phone's.
    expect(readDevice(device({ coarse: true, w: 744, h: 1133, type: 'portrait-primary' })).phone).toBe(false);
    expect(readDevice(device({ coarse: true, w: PHONE_SHORT_SIDE + 1, h: 900, type: 'portrait-primary' })).phone).toBe(false);
    expect(readDevice(device({ coarse: true, w: PHONE_SHORT_SIDE, h: 900, type: 'portrait-primary' })).phone).toBe(true);
    // A touch laptop: a coarse pointer, and a laptop's screen.
    expect(readDevice(device({ coarse: true, hover: true, w: 1280, h: 800, type: 'landscape-primary' })).phone).toBe(false);
    // A phone with a stylus that hovers is still a phone.
    expect(readDevice(device({ coarse: true, hover: true, w: 412, h: 915, type: 'portrait-primary' }))).toEqual({ phone: true, upright: true });
    expect(readDevice(undefined)).toEqual({ phone: false, upright: false });
    expect(readDevice({})).toEqual({ phone: false, upright: false });
  });
  it('the keyboard up on a phone on its side changes nothing the read rests on', () => {
    // The window shorter by the keyboard, the screen and its orientation as they were.
    expect(readDevice(device({ coarse: true, w: 844, h: 390, type: 'landscape-primary', portrait: false })).upright).toBe(false);
  });
  it('the lock to landscape is asked for once, and its refusal is let go', async () => {
    const asked: string[] = [];
    const page = { screen: { orientation: { lock: (o: string) => { asked.push(o); return Promise.reject(new Error('not supported')); } } } };
    expect(askLandscapeOnce(page)).toBe(true);
    expect(askLandscapeOnce(page)).toBe(false);
    await Promise.resolve();
    expect(asked).toEqual(['landscape']);
  });

  it('fullscreen is never asked for: no source of the game calls it, by any of its names', () => {
    const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(`${dir}/${e.name}`) : /\.(ts|tsx)$/.test(e.name) ? [`${dir}/${e.name}`] : []));
    const all = files('src');
    expect(all.length).toBeGreaterThan(100);
    expect(all.some((f) => f.endsWith('ui/shell/turn.tsx'))).toBe(true);
    const asks = all.filter((f) => /\b(request|webkitRequest|mozRequest|msRequest)Full[sS]creen\b/.test(readFileSync(f, 'utf8')));
    expect(asks).toEqual([]);
  });
});
