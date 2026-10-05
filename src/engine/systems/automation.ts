/**
 * SLATE — the shortcuts a person chooses (from 2026-10-03, the owner's
 * expansion: "automation must be an explicit preference on the same rules
 * and must never silently replace the manual action").
 *
 * Each one does on its own what a manual action does, on that action's own
 * rules, and only when it's set: the shopping put away on getting home, bags
 * packed and unpacked, and a free day's housework and shopping. A new life
 * has none on. A save from before 2026-10-03 did all of them on its own, and
 * on loading is given every one, written down, to keep or turn off.
 *
 * From 2026-10-05 the day's own care is four more: the day's meals, the
 * morning's shower, dressing for the day and for bed, and the dishwasher's
 * run. Until then every night did them for the player unasked, the owner's
 * rule broken in the one place the 2026-10-03 shortcuts hadn't reached. The
 * life's other people still live their days as before: the shortcuts are the
 * player's. A new life chooses them at its creation, none chosen for it; a
 * save from before is given them, as it lived with them.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';

export type Shortcut = 'unloadShopping' | 'packForMe' | 'laundry' | 'washUp' | 'tidy' | 'restock' | 'replaceClothes' | 'feedPets'
  | 'meals' | 'morningWash' | 'dress' | 'dishwasher';

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
  meals: { label: 'Feed Me Each Day', does: 'Each night the next day’s meals are bought and eaten before it begins, as the household buys its food', byHand: 'Cook A Meal or Order In on Look After Yourself; Cook It, Heat And Eat or a restaurant’s Have It on Food' },
  morningWash: { label: 'Wash Me Each Morning', does: 'Each morning a shower, teeth and deodorant, from the supplies at home', byHand: 'Shower on Look After Yourself' },
  dress: { label: 'Dress Me For The Day And For Bed', does: 'Each morning the day’s outfit goes on, and at night the sleepwear', byHand: 'Change Into These Now, or an outfit’s Wear It, on Clothes; Sleep at home goes to bed in the sleepwear' },
  dishwasher: { label: 'Run The Dishwasher Each Day', does: 'Each day at home the dishwasher takes the day’s dishes, with its tablet', byHand: 'Run The Dishwasher, or Wash Up, on Look After Yourself' },
};

/** The day's own care, which every night did for the player unasked until 2026-10-05. */
export const DAILY_SHORTCUTS: readonly Shortcut[] = ['meals', 'morningWash', 'dress', 'dishwasher'];

/** The shortcuts a save has been offered: 2 from 2026-10-05, with the day's own care among them. */
export const SHORTCUTS_VERSION = 2;

/** Whether the day does it on its own for this person: the player's own choice; the life's other people live their days. */
export const doneFor = (person: Person, playerId: string, key: Shortcut): boolean => person.id !== playerId || isOn(person, key);

export const isOn = (person: Person, key: Shortcut): boolean => person.automation?.[key] === true;

/** Every shortcut on: a save from before had them all, done without asking. */
export const EVERY_SHORTCUT: Readonly<Record<Shortcut, true>> = { unloadShopping: true, packForMe: true, laundry: true, washUp: true, tidy: true, restock: true, replaceClothes: true, feedPets: true, meals: true, morningWash: true, dress: true, dishwasher: true };

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
