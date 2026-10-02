/**
 * SLATE — giving something you own to a friend (the master plan's §22f and
 * §27f, from 2026-10-02).
 *
 * A thing to hand, given in person to a friend or partner in the town you're
 * in: it's theirs from then, gone from what you own, from your outfits and
 * from what you'd chosen to wear, and they remember it. Furniture is the
 * movers', not handed over; a rival won't take one. What a gift does for a
 * friendship isn't published, so it adds no hours together.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { contactsOf } from './people';
import { itemById, itemsOf, reachable } from './items';
import { forget } from './clothing';

export function giveRefusal(sim: Simulation, person: Person, itemId: string, contactId: string): string | undefined {
  const item = itemById(person, itemId);
  if (!item) return 'That isn’t something you own.';
  if (!reachable(sim, person, item.at)) return 'It isn’t to hand.';
  if (item.bulky) return 'It’s moved by movers, not handed over.';
  const c = contactsOf(person).find((x) => x.id === contactId);
  if (!c) return 'You don’t know them.';
  const first = c.name.split(' ')[0];
  if (c.rival) return `${first} would rather not.`;
  if (c.cityId !== person.currentLocationId) return `${first} isn’t here to hand it to.`;
  return undefined;
}

export function registerGifts(sim: Simulation): void {
  sim.onCommand<{ itemId: string; contactId: string }, { given: string }>('items.give', (p, { sim: s }) => {
    const person = s.player;
    const no = giveRefusal(s, person, String(p?.itemId), String(p?.contactId));
    if (no) throw new CommandError(no);
    const item = itemById(person, String(p.itemId))!;
    const c = contactsOf(person).find((x) => x.id === p.contactId)!;
    person.items = itemsOf(person).filter((i) => i.id !== item.id);
    forget(person, new Set([item.id]));
    c.memory.unshift({ at: s.now, what: `You gave them ${item.label}` });
    return { given: item.label };
  });
}
