/**
 * SLATE — the shortcuts a person chooses (from 2026-10-03, the owner's
 * expansion: "automation must be an explicit preference on the same rules
 * and must never silently replace the manual action").
 *
 * Each one does on its own what a manual action does, on that action's own
 * rules, and only when it's set: the shopping put away on getting home, bags
 * packed and unpacked, and a free day's housework and shopping. A new life
 * has none of those on. A save from before 2026-10-03 did all of them on its own, and
 * on loading is given every one, written down, to keep or turn off.
 *
 * From 2026-10-06 the day's outfit and the day's meals are shortcuts too.
 * Until then every day stood in for an outfit not to hand from the rest of the
 * wardrobe, and ate the day's meals from what was ready at home, whoever
 * chose. Off, a day is dressed only in what they chose or have on, and what's
 * ready is left for them to eat by hand, the day's groceries bought for all
 * three meals. A save from before has both on, and so, unlike the rest, does a
 * new life (`createSave` says why).
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';

export type Shortcut = 'unloadShopping' | 'packForMe' | 'laundry' | 'washUp' | 'tidy' | 'restock' | 'replaceClothes' | 'feedPets' | 'chooseOutfit' | 'eatLeftovers';

/** Each shortcut, what it does on its own, and the manual action it stands in for. */
export const SHORTCUTS: Readonly<Record<Shortcut, { label: string; does: string; byHand: string }>> = {
  unloadShopping: { label: 'Put The Shopping Away When I Get Home', does: 'Getting home puts what was bought away, where each keeps', byHand: 'Put It Away on Belongings' },
  packForMe: { label: 'Pack And Unpack For Me', does: 'Leaving home packs a week into an empty main bag, coming back unpacks, and leaving a room repacks it', byHand: 'Pack For Me, Unpack and Repack The Room on Belongings' },
  laundry: { label: 'Do The Laundry On A Free Day', does: 'A day with no work does the washing when there’s one clean outfit or none left', byHand: 'Do The Laundry' },
  washUp: { label: 'Wash Up On A Free Day', does: 'A day with no work washes up what’s in the sink', byHand: 'Wash Up' },
  tidy: { label: 'Tidy Up On A Free Day', does: 'A day with no work tidies a home that’s getting messy, not as well as a proper clean', byHand: 'Clean The Place' },
  restock: { label: 'Buy What’s Run Out On A Free Day', does: 'A day with no work buys the toiletries and cleaning things that have run out, the cheapest of each in a store here', byHand: 'Buy on Clothes, or a stop on Run Errands' },
  replaceClothes: { label: 'Replace Worn-Out Clothes On A Free Day', does: 'A day with no work buys again a garment that’s worn out', byHand: 'Buy In Store or Order Online on Clothes' },
  feedPets: { label: 'Feed The Pets Each Day', does: 'Each day at home, the pets are fed their ration from the food at home', byHand: 'Feed Them on Belongings' },
  chooseOutfit: { label: 'Put An Outfit Together When Mine Isn’t To Hand', does: 'Each day, what you chose or have on that isn’t clean and to hand is stood in for from what is, the least washed first', byHand: 'Wear These or Wear It on Clothes' },
  eatLeftovers: { label: 'Eat What’s Ready At Home For The Day’s Meals', does: 'Each day, the day’s meals come out of what’s ready at home first, the soonest to go off first, and groceries are bought only for the rest', byHand: 'Heat And Eat on Food' },
};

export const isOn = (person: Person, key: Shortcut): boolean => person.automation?.[key] === true;

/** Every shortcut on: a save from before had them all, done without asking. */
export const EVERY_SHORTCUT: Readonly<Record<Shortcut, true>> = { unloadShopping: true, packForMe: true, laundry: true, washUp: true, tidy: true, restock: true, replaceClothes: true, feedPets: true, chooseOutfit: true, eatLeftovers: true };

export function registerAutomation(sim: Simulation): void {
  // A shortcut set or cleared: each does what its manual action does, on the same rules.
  sim.onCommand<{ key: Shortcut; on: boolean }, { on: boolean }>('life.set_automation', (p, { sim: s }) => {
    const key = p?.key;
    if (!key || !(key in SHORTCUTS)) throw new CommandError('There’s no such shortcut.');
    const a = (s.player.automation ??= {});
    if (p.on) a[key] = true; else delete a[key];
    return { on: Boolean(p.on) };
  });
}
