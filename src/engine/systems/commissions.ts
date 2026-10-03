/**
 * SLATE — a piece of jewelry made to order, and a piece engraved (the master
 * plan's §29, from 2026-10-03; `docs/research/world/research-jewelry-watches.json`,
 * each jeweler's own page read 2026-10-02).
 *
 * **A commission** is a named jeweler's, in the country you live in, at
 * the price you set for it, no less than its published "from":
 * - America: Brilliant Earth's custom design studio, from $2,000, its quote
 *   free, paid when the design is approved and never refunded; four to six
 *   weeks.
 * - Britain: James Newman Jewelry, from £1,000 and an engagement ring from
 *   £1,800, its £150 deposit after the consultation taken off the price;
 *   eight to twelve weeks. Selina Campbell, made to order, from £350 in
 *   silver and £550 to £600 in gold, the middle; three to eight weeks, its
 *   terms of payment not published, so paid when it's ready.
 * - Ireland: Gear Jewelers in Dublin, an engagement ring only, from "just
 *   shy of €2,500", its €300 CAD design fee redeemable against it and 25%
 *   when the design is approved; five to seven weeks.
 * The middle of each jeweler's weeks is taken. What isn't paid at the order
 * is paid when the piece is ready, owed where the bank can't. Canada's and
 * Mexico's jewelers weren't read, and none is commissioned there.
 *
 * What's chosen, the kind of piece and its metal, is kept as the piece:
 * its name, its worth for insurance, a pawn and a sale (`isValuable`), and
 * what it's worn as.
 *
 * **Engraving** is a jeweler's posted price: Jewelry Repair Direct by Kay's
 * $79 in America, Fraser Hart's from £60 on a ring and £75 on other jewelry
 * or a watch in Britain. The words are kept on the piece.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';
import { inSaveMoney } from './banking';
import { owe, payFromBank } from './household';
import { addItem, homeKeyOf, itemById, reachable } from './items';
import { isValuable } from './valuables';

export type PieceKind = 'earrings' | 'bracelet' | 'necklace' | 'ring' | 'engagement-ring';
export type Metal = 'silver' | 'gold' | 'platinum';
export const PIECE_LABEL: Readonly<Record<PieceKind, string>> = { earrings: 'Earrings', bracelet: 'Bracelet', necklace: 'Necklace', ring: 'Ring', 'engagement-ring': 'Engagement Ring' };
export const METAL_LABEL: Readonly<Record<Metal, string>> = { silver: 'Sterling Silver', gold: 'Gold', platinum: 'Platinum' };

export interface Jeweler {
  id: string;
  name: string;
  country: string;
  currency: string;
  /** The least it makes a piece for, by kind and metal, in its money; nothing where it doesn't make that. */
  from: (kind: PieceKind, metal: Metal) => number | undefined;
  /** Paid at the order: a share of the price, and a fee or deposit taken off it. */
  atOrder: { share: number; fee: number };
  weeks: readonly [number, number];
  source: string;
}

export const JEWELERS: readonly Jeweler[] = [
  { id: 'brilliant-earth', name: 'Brilliant Earth', country: 'us', currency: 'USD', from: (k) => (k === 'ring' || k === 'engagement-ring' ? 2_000 : undefined), atOrder: { share: 1, fee: 0 }, weeks: [4, 6], source: 'https://www.brilliantearth.com/pages/custom-design-studio/' },
  { id: 'james-newman', name: 'James Newman Jewelry', country: 'uk', currency: 'GBP', from: (k) => (k === 'engagement-ring' ? 1_800 : 1_000), atOrder: { share: 0, fee: 150 }, weeks: [8, 12], source: 'https://www.jamesnewmanjewellery.co.uk/pages/bespoke-jewellery' },
  { id: 'selina-campbell', name: 'Selina Campbell', country: 'uk', currency: 'GBP', from: (_k, m) => (m === 'silver' ? 350 : m === 'gold' ? 575 : undefined), atOrder: { share: 0, fee: 0 }, weeks: [3, 8], source: 'https://www.selinacampbell.com/made-to-order-bespoke-jewellery' },
  { id: 'gear', name: 'Gear Jewelers', country: 'ie', currency: 'EUR', from: (k) => (k === 'engagement-ring' ? 2_500 : undefined), atOrder: { share: 0.25, fee: 300 }, weeks: [5, 7], source: 'https://gearjewellers.ie/pages/custom-engagement-rings' },
];

export interface Commission { id: string; jewelerId: string; kind: PieceKind; metal: Metal; units: number; paidUnits: number; readyAt: Instant }
export const COMMISSION_READY_KIND = 'jewelry.ready';
export const commissionsOf = (person: Person): Commission[] => (person.commissions ??= []);

const countryOf = (person: Person) => CITIES.get(person.home?.cityId ?? person.currentLocationId)?.countryId;
export const jewelersFor = (person: Person): Jeweler[] => JEWELERS.filter((j) => j.country === countryOf(person));

/** Why a piece can't be commissioned so, or nothing. */
export function commissionRefusal(person: Person, jewelerId: string, kind: PieceKind, metal: Metal, units: number): string | undefined {
  const j = JEWELERS.find((x) => x.id === jewelerId);
  if (!j || j.country !== countryOf(person)) return 'Choose a jeweler where you live.';
  if (!person.home || person.home.kind === 'sofa') return 'A piece is sent to a home of your own.';
  const least = j.from(kind, metal);
  if (least === undefined) return `${j.name} doesn’t make that.`;
  if (!(units >= least)) return `${j.name}’s start at ${least.toLocaleString('en')} ${j.currency}.`;
  return undefined;
}

/** What's paid at the order, in the jeweler's money: its share of the price, or its fee or deposit, whichever's more. */
export const dueAtOrder = (j: Jeweler, units: number): number => Math.min(units, Math.max(units * j.atOrder.share, j.atOrder.fee));

export const ENGRAVERS: readonly { country: string; name: string; currency: string; ring: number; other: number }[] = [
  { country: 'us', name: 'Jewelry Repair Direct By Kay', currency: 'USD', ring: 79, other: 79 },
  { country: 'uk', name: 'Fraser Hart', currency: 'GBP', ring: 60, other: 75 },
];

export function registerCommissions(sim: Simulation): void {
  sim.onCommand<{ jewelerId: string; kind: PieceKind; metal: Metal; price: number }, { commissionId: string; paid: Money; readyAt: Instant }>('jewelry.commission', (p, { sim: s }) => {
    const person = s.player;
    const units = Number(p?.price);
    const no = commissionRefusal(person, String(p?.jewelerId), p?.kind, p?.metal, units);
    if (no) throw new CommandError(no);
    const j = JEWELERS.find((x) => x.id === p.jewelerId)!;
    const now = dueAtOrder(j, units);
    const paid = inSaveMoney(s, Math.round(now * 100), j.currency);
    if (paid > 0 && !payFromBank(s, person, paid, `${j.name}: a ${PIECE_LABEL[p.kind].toLowerCase()} commissioned`, 'personal')) throw new CommandError('The bank can’t pay for it.');
    const readyAt = s.now + Math.round(((j.weeks[0] + j.weeks[1]) / 2) * 7) * MS_DAY;
    const c: Commission = { id: s.nextId('item'), jewelerId: j.id, kind: p.kind, metal: p.metal, units, paidUnits: now, readyAt };
    commissionsOf(person).push(c);
    s.schedule({ at: readyAt, kind: COMMISSION_READY_KIND, label: 'A Piece Ready', category: 'personal', priority: 30, payload: { personId: person.id, commissionId: c.id } });
    return { commissionId: c.id, paid, readyAt };
  });

  sim.onSchedule(COMMISSION_READY_KIND, (entry, s) => {
    const person = s.universe.people[String(entry.payload.personId)];
    const list = person ? commissionsOf(person) : [];
    const c = list.find((x) => x.id === entry.payload.commissionId);
    if (!person || !c) return;
    const j = JEWELERS.find((x) => x.id === c.jewelerId)!;
    const rest = inSaveMoney(s, Math.round((c.units - c.paidUnits) * 100), j.currency);
    const memo = `${j.name}: the rest of a ${PIECE_LABEL[c.kind].toLowerCase()}`;
    if (rest > 0 && !payFromBank(s, person, rest, memo, 'personal')) owe(s, person, rest, memo, 'personal');
    const home = homeKeyOf(person.home);
    addItem(s, person, {
      kind: `bespoke:${c.id}`, label: `A ${METAL_LABEL[c.metal]} ${PIECE_LABEL[c.kind]} By ${j.name}`, quantity: 1, condition: 1,
      at: home ? { kind: 'home', home, spot: 'drawers' } : { kind: 'person' }, acquiredAt: s.now, paid: inSaveMoney(s, Math.round(c.units * 100), j.currency),
      garment: { kind: 'accessory', slot: 'accessory', care: 'hand', wears: 0, washes: 0 },
    } as never);
    person.commissions = list.filter((x) => x !== c);
    if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: 'Your Commission Is Ready', body: `${j.name} has made your ${METAL_LABEL[c.metal].toLowerCase()} ${PIECE_LABEL[c.kind].toLowerCase()}.`, importance: 40, route: '/workspace/belongings' });
  });

  sim.onCommand<{ itemId: string; words: string }, { paid: Money }>('jewelry.engrave', (p, { sim: s }) => {
    const person = s.player;
    const item = itemById(person, String(p?.itemId));
    if (!item || !isValuable(item)) throw new CommandError('Only jewelry or a watch is engraved.');
    if (!reachable(s, person, item.at)) throw new CommandError(`The ${item.label} isn’t to hand.`);
    const words = String(p?.words ?? '').trim();
    if (!words) throw new CommandError('Write the words to engrave.');
    const e = ENGRAVERS.find((x) => x.country === CITIES.get(person.currentLocationId)?.countryId);
    if (!e) throw new CommandError('SLATE keeps no engraver’s price where you are.');
    const paid = inSaveMoney(s, Math.round((/ring/i.test(item.label) ? e.ring : e.other) * 100), e.currency);
    if (!payFromBank(s, person, paid, `${e.name}: an engraving`, 'personal')) throw new CommandError('The bank can’t pay for it.');
    item.engraved = words;
    return { paid };
  });
}

export const commissionMoney = (sim: Simulation, c: Commission): Money => inSaveMoney(sim, Math.round(c.units * 100), JEWELERS.find((j) => j.id === c.jewelerId)!.currency);
