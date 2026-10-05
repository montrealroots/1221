/**
 * SLATE — a phone of your own (the master plan's §28, from 2026-10-02; the
 * figures in `content/phones.ts`).
 *
 * Phones are the iPhones, Galaxys and Pixels on their makers' own stores in
 * the market where you live, unlocked, at the price on the day read with the
 * place's sales tax where it isn't in the price. A phone is bought outright,
 * or on the maker's 0% plan where it publishes one, paid month by month; a
 * plan that excludes prepaid carriers (Apple's in America, on the Apple Card)
 * is refused on a prepaid line such as Mint's. A phone you own can be traded
 * in against it at the maker's published value, "up to" being the only figure
 * Apple gives. It arrives in five working days, SLATE's estimate.
 *
 * It's activated on the line you pay for (`content/telecom.ts`), at the
 * carrier's published charge for a SIM or an eSIM. Its battery wears as
 * Apple publishes for the iPhone 15 and later, 80% of its capacity left after
 * 1,000 full cycles, taken as a cycle a day, SLATE's reading, for every
 * maker's. A battery is replaced at the maker's out-of-warranty price, or
 * under its protection plan at that plan's battery fee once it's below 80%.
 * A protection plan is billed monthly at its published price.
 *
 * Until 2026-10-03 a phone never broke or went missing, and a maker's plan
 * was given without a look at the record. Now the phone in use is damaged
 * or stolen at the odds a survey publishes where it lives: in America at
 * Allstate Protection Plans' 31% a year damaged, two in three of those the
 * screen, and 5% stolen (the survey doesn't state that period outright); in
 * England and Wales stolen at the ONS crime survey's 0.54% a year. Elsewhere
 * no rate is published, and none is drawn. A damaged phone is repaired at
 * AppleCare+'s fee for the incident, or the cover's screen fee, or the
 * maker's out-of-warranty price; a stolen one is replaced only under cover
 * with theft and loss, at Apple's fee, two claims a year, and what's still
 * owed on it is still paid. A maker's plan is credit, approved as a card is
 * (`cardlife.ts`'s 620, SLATE's estimate), and the application is an
 * inquiry on the record.
 *
 * Not kept: a carrier's own device plans, whose carriers (Verizon, AT&T,
 * EE, Vodafone, Rogers, Bell) aren't the line SLATE keeps where you live.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, dayHasCome, formatDay, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { MOBILE } from '../content/telecom';
import { ACTIVATION, PHONES, PHONE_FINANCING, PHONE_PROTECTION, PHONE_REPAIR, TRADE_IN, type Phone, type PhoneFinancing, type PhoneProtection } from '../content/phones';
import { inSaveMoney } from './banking';
import { owe, payFromBank, spend } from './household';
import { homeKeyOf, itemById, itemsOf, reachable, type Item } from './items';
import { placeOrder } from './orders';
import { APPLECARE_FEES, OTHER_DAMAGE, PHONE_RISK, type PhoneRisk } from '../content/phoneclaims';
import { APPROVE_FROM, INQUIRY } from './cardlife';

export const PHONE_MONTH_KIND = 'phone.month';
/** Apple's: 80% of the battery's capacity after 1,000 full cycles; a cycle a day, SLATE's reading. */
export const BATTERY = { keptAt: 0.8, cycles: 1_000, perDay: 1 } as const;
/** Days on the way: SLATE's estimate, the makers' delivery not having been read. */
export const PHONE_DAYS = 7;

/** A phone owned: which, its color, whether it's on your line, its battery, and what's still paid on it monthly. */
export interface Device {
  phoneId: string;
  color: string;
  activated?: boolean;
  battery: number;
  finance?: { plan: string; monthly: Money; monthsLeft: number };
  protection?: { plan: string; monthly: Money; batteryFee: Money | null };
  /** Damaged, from 2026-10-03: the screen, or anything else. */
  broken?: 'screen' | 'other';
  /** When it was stolen (from 2026-10-03). */
  stolen?: Instant;
  /** When theft and loss claims were made, for the cover's two a year. */
  claims?: Instant[];
}
export type Owned = Item & { device: Device };

export const phoneById = (id: string): Phone | undefined => PHONES.find((p) => p.id === id);
export const phonesOf = (person: Person): Owned[] => itemsOf(person).filter((i): i is Owned => i.device !== undefined);
/** The market a person buys a phone in: the country they live in, where SLATE keeps its phones. */
export const phoneMarketOf = (person: Person): string | undefined => CITIES.get(person.home?.cityId ?? person.currentLocationId)?.countryId;
const lineOf = (person: Person) => MOBILE.find((m) => m.country === phoneMarketOf(person));

/** A phone's price where you live, tax in, in the save's money. */
export function phonePrice(sim: Simulation, person: Person, p: Phone): Money {
  const cityId = person.home?.cityId ?? person.currentLocationId;
  const tax = p.taxIncluded ? 0 : salesTaxRate(cityId, sim.now, 'general');
  return inSaveMoney(sim, Math.round(p.price * (1 + tax) * 100), p.currency);
}

/**
 * Whether a phone is out by now: on sale from its release date, where one was read (from 2026-10-05). A life begins on
 * 5 January 2026, and until then the iPhone 18 Pro, out on 18 September 2026, was on sale from its first day, as were
 * 188 of the 273 phones read. One whose date wasn't read is taken as out.
 */
export const isOut = (sim: Simulation, p: Phone): boolean => !p.released || dayHasCome(p.released, sim.now, sim.homeZone);

/** The phones on sale where you live, cheapest first. */
export const phonesOnSale = (sim: Simulation, person: Person): Phone[] => PHONES.filter((p) => p.market === phoneMarketOf(person) && isOut(sim, p)).sort((a, b) => phonePrice(sim, person, a) - phonePrice(sim, person, b) || a.id.localeCompare(b.id));

/** What the maker gives for a phone you own, traded in: its published "up to", in the save's money; or nothing where none is published. */
export function tradeInValue(sim: Simulation, owned: Owned, buying: Phone): Money | undefined {
  const mine = phoneById(owned.device.phoneId);
  if (!mine || mine.maker !== buying.maker) return undefined;
  const t = TRADE_IN.find((x) => x.market === buying.market && x.maker === mine.maker && x.model === mine.model);
  return t ? inSaveMoney(sim, Math.round(t.upTo * 100), t.currency) : undefined;
}

/** The maker's 0% plans for a phone, each with its months. */
export function plansFor(p: Phone): { plan: PhoneFinancing; months: number[] }[] {
  return PHONE_FINANCING.filter((f) => f.market === p.market && f.maker === p.maker).map((f) => ({ plan: f, months: f.byModel ? (f.byModel[p.model] !== undefined ? [f.byModel[p.model]!] : []) : f.months })).filter((x) => x.months.length > 0);
}

export interface PhoneBuy { phoneId: string; color: string; tradeInItemId?: string; plan?: string; months?: number }

/** What buying comes to now, the trade-in off, and what a plan makes it a month. */
export function phoneQuote(sim: Simulation, person: Person, o: PhoneBuy): { price: Money; tradeIn: Money; total: Money; monthly?: Money } | undefined {
  const p = phoneById(o.phoneId);
  if (!p) return undefined;
  const price = phonePrice(sim, person, p);
  const old = o.tradeInItemId ? phonesOf(person).find((x) => x.id === o.tradeInItemId) : undefined;
  const tradeIn = old ? tradeInValue(sim, old, p) ?? 0 : 0;
  const total = Math.max(0, price - tradeIn);
  return { price, tradeIn, total, ...(o.months ? { monthly: Math.ceil(total / o.months) } : {}) };
}

/** Why a phone can't be bought so, or nothing. */
export function phoneRefusal(sim: Simulation, person: Person, o: PhoneBuy): string | undefined {
  const p = phoneById(o.phoneId);
  if (!p || p.market !== phoneMarketOf(person)) return 'That phone isn’t on sale where you live.';
  if (!isOut(sim, p)) return `The ${p.maker} ${p.model} isn’t out until ${formatDay(p.released!)}.`;
  if (!person.home || person.home.kind === 'sofa') return 'A phone needs a home to be sent to.';
  if (p.colors.length > 0 && !p.colors.includes(o.color)) return 'Choose one of its colors.';
  if (o.tradeInItemId) {
    const old = phonesOf(person).find((x) => x.id === o.tradeInItemId);
    if (!old || old.device.stolen !== undefined || !reachable(sim, person, old.at)) return 'That isn’t a phone you have to hand.';
    if (old.device.broken) return `${p.maker}’s trade-in value is for one in working order.`;
    if (old.device.finance) return 'It’s still being paid for.';
    if (tradeInValue(sim, old, p) === undefined) return `${p.maker} publishes no trade-in value for it.`;
  }
  if (o.plan !== undefined) {
    const choice = plansFor(p).find((x) => x.plan.name === o.plan);
    if (!choice || !choice.months.includes(o.months ?? -1)) return 'That plan doesn’t run for that many months.';
    if (choice.plan.prepaidExcluded && lineOf(person)?.prepayMonths) return `${choice.plan.name} isn’t open to a prepaid line like ${lineOf(person)!.provider}’s.`;
    if (!person.credit) return `${choice.plan.name} is credit, and you have no credit record.`;
  }
  return undefined;
}

/** Buys a phone: paid now, or the first of its months; on its way. Its order. */
export function buyPhone(sim: Simulation, person: Person, o: PhoneBuy): string {
  const no = phoneRefusal(sim, person, o);
  if (no) throw new CommandError(no);
  const p = phoneById(o.phoneId)!;
  const q = phoneQuote(sim, person, o)!;
  const label = `${p.maker} ${p.model}, ${p.storageGB} GB`;
  // A plan is credit: the application is an inquiry, and a record short of a card's is refused.
  if (o.plan) {
    const credit = person.credit!;
    credit.score = Math.max(300, credit.score - INQUIRY);
    if (credit.score < APPROVE_FROM) throw new CommandError(`${o.plan} declined it: your record isn’t strong enough.`);
  }
  if (!o.plan && q.total > 0 && !spend(sim, person, q.total, `${p.maker}: ${p.model}`, 'personal')) throw new CommandError(`It comes to ${formatMoney(q.total, saveCurrency(sim.universe))}, more than you can pay.`);
  if (o.tradeInItemId) person.items = itemsOf(person).filter((i) => i.id !== o.tradeInItemId);
  const device: Device = { phoneId: p.id, color: o.color, battery: 1, ...(o.plan ? { finance: { plan: o.plan, monthly: q.monthly!, monthsLeft: o.months! } } : {}) };
  const order = placeOrder(sim, person, { from: p.maker, arrivesAt: sim.now + PHONE_DAYS * MS_DAY, to: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'floor' }, paid: o.plan ? 0 : q.total }, [{ kind: `phone:${p.id}`, label, quantity: 1, condition: 1, paid: q.price, device }]);
  // A plan's payments begin a month on.
  if (o.plan) { const made = phonesOf(person).find((x) => x.at.kind === 'order' && x.at.orderId === order.id); if (made) scheduleMonth(sim, person, made, sim.now); }
  return order.id;
}

/** What activating a phone on your line costs: the carrier's activation, and its eSIM or SIM. */
export function activationCost(sim: Simulation, person: Person): { cost: Money; carrier: string } | undefined {
  const line = lineOf(person);
  const a = line && ACTIVATION.find((x) => x.market === line.country);
  if (!line || !a) return undefined;
  const cents = Math.round(((a.activationFee ?? 0) + (a.esim ?? a.simKit ?? 0)) * 100);
  return { cost: inSaveMoney(sim, cents, a.currency ?? line.currency), carrier: line.provider };
}

/** What a battery replacement costs now: the maker's price, or the protection plan's fee once it's worn below 80%. */
export function batteryQuote(sim: Simulation, person: Person, owned: Owned): Money | undefined {
  const p = phoneById(owned.device.phoneId);
  if (!p) return undefined;
  const cover = owned.device.protection;
  if (cover && cover.batteryFee !== null && owned.device.battery < BATTERY.keptAt) return cover.batteryFee;
  const r = PHONE_REPAIR.find((x) => x.market === p.market && x.maker === p.maker && x.model === p.model);
  if (!r || r.battery === null) return undefined;
  const tax = r.taxIncluded === false ? salesTaxRate(person.home?.cityId ?? person.currentLocationId, sim.now, 'general') : 0;
  return inSaveMoney(sim, Math.round(r.battery * (1 + tax) * 100), r.currency);
}

/** The odds a survey publishes where they live, for the phone in use; nothing where none is. */
export function riskFor(person: Person): PhoneRisk | undefined {
  const cityId = person.home?.cityId ?? person.currentLocationId;
  const r = PHONE_RISK.find((x) => x.market === phoneMarketOf(person));
  // The ONS's survey is England's and Wales's.
  return r && r.market === 'uk' && !/^uk-(eng|wls)-/.test(cityId) ? undefined : r;
}

/** The chance something with a yearly rate happens in some days. */
const inDays = (perYear: number, days: number) => 1 - Math.pow(1 - perYear, days / 365);

/** What befalls a phone in use in a month from some instant, at the odds; nothing most months. A phone already broken can still be stolen. */
export function mishap(sim: Simulation, risk: PhoneRisk, itemId: string, at: Instant, broken: boolean): 'stolen' | 'screen' | 'other' | undefined {
  const rng = sim.rng('phone.risk', itemId, at);
  if (risk.stolenYear !== null && rng.next() < inDays(risk.stolenYear, 30)) return 'stolen';
  if (broken || risk.damagedYear === null || rng.next() >= inDays(risk.damagedYear, 30)) return undefined;
  return rng.next() < (risk.screenShare ?? 1) ? 'screen' : 'other';
}

/** What putting it right costs now, or why it can't be. */
export function claimQuote(sim: Simulation, person: Person, owned: Owned): Money | string {
  const p = phoneById(owned.device.phoneId);
  if (!p) return 'SLATE doesn’t know that phone.';
  const d = owned.device;
  const cover = d.protection ? PHONE_PROTECTION.find((x) => x.market === p.market && x.maker === p.maker && x.plan === d.protection!.plan) : undefined;
  const fees = p.maker === 'Apple' && cover ? APPLECARE_FEES.find((x) => x.market === p.market) : undefined;
  const tax = (included: boolean | null | undefined) => (included === false ? salesTaxRate(person.home?.cityId ?? person.currentLocationId, sim.now, 'general') : 0);
  if (d.stolen !== undefined) {
    if (!cover?.theftAndLoss) return 'Only cover with theft and loss replaces a stolen phone.';
    const year = (d.claims ?? []).filter((at) => at > sim.now - 365 * MS_DAY);
    if (year.length >= 2) return 'The cover replaces two a year, and both have been claimed.';
    if (!fees || fees.theft === null) return `${p.maker} publishes no fee for it.`;
    return inSaveMoney(sim, Math.round(fees.theft * 100), fees.currency);
  }
  if (!d.broken) return 'It isn’t damaged.';
  if (fees) { const fee = d.broken === 'screen' ? fees.screen : fees.other; if (fee !== null) return inSaveMoney(sim, Math.round(fee * 100), fees.currency); }
  if (cover && d.broken === 'screen' && cover.screenFee !== null) return inSaveMoney(sim, Math.round(cover.screenFee * 100), cover.currency);
  if (d.broken === 'screen') {
    const r = PHONE_REPAIR.find((x) => x.market === p.market && x.maker === p.maker && x.model === p.model);
    if (r && r.screen !== null) return inSaveMoney(sim, Math.round(r.screen * (1 + tax(r.taxIncluded)) * 100), r.currency);
  } else {
    const r = OTHER_DAMAGE.find((x) => x.market === p.market && x.maker === p.maker && x.model === p.model);
    // Taxed as the maker's screen price for it is.
    const screen = PHONE_REPAIR.find((x) => x.market === p.market && x.maker === p.maker && x.model === p.model);
    if (r) return inSaveMoney(sim, Math.round(r.other * (1 + tax(screen?.taxIncluded)) * 100), r.currency);
  }
  return `${p.maker} publishes no price for that repair.`;
}

/** The protection plans open to a phone, by its model. */
export const protectionFor = (p: Phone): PhoneProtection[] => PHONE_PROTECTION.filter((x) => x.market === p.market && x.maker === p.maker && (x.models.length === 0 || x.models.includes(p.model)));

function scheduleMonth(sim: Simulation, person: Person, owned: Owned, from: Instant): void {
  sim.schedule({ at: from + 30 * MS_DAY, kind: PHONE_MONTH_KIND, label: 'The Phone’s Month', category: 'personal', priority: 30, payload: { personId: person.id, itemId: owned.id } });
}

const ownedHere = (sim: Simulation, person: Person, id: string): Owned => {
  const o = phonesOf(person).find((x) => x.id === id);
  if (!o) throw new CommandError('That isn’t a phone you own.');
  if (o.device.stolen !== undefined) throw new CommandError('It was stolen.');
  if (!reachable(sim, person, o.at)) throw new CommandError('It isn’t to hand.');
  return o;
};

export function registerPhones(sim: Simulation): void {
  sim.onCommand<PhoneBuy, { orderId: string }>('phone.buy', (p, { sim: s }) => {
    const o: PhoneBuy = { phoneId: String(p?.phoneId), color: String(p?.color ?? ''), ...(p?.tradeInItemId ? { tradeInItemId: String(p.tradeInItemId) } : {}), ...(p?.plan ? { plan: String(p.plan), months: Number(p.months) } : {}) };
    return { orderId: buyPhone(s, s.player, o) };
  });
  sim.onCommand<{ itemId: string }, { paid: Money; carrier: string }>('phone.activate', (p, { sim: s }) => {
    const person = s.player;
    const owned = ownedHere(s, person, String(p?.itemId));
    if (owned.device.activated) throw new CommandError('It’s on your line already.');
    const q = activationCost(s, person);
    if (!q) throw new CommandError('SLATE keeps no line where you live.');
    if (q.cost > 0 && !spend(s, person, q.cost, `${q.carrier}: a SIM for the ${owned.label}`, 'personal')) throw new CommandError(`It comes to ${formatMoney(q.cost, saveCurrency(s.universe))}, more than you can pay.`);
    for (const x of phonesOf(person)) delete x.device.activated;
    owned.device.activated = true;
    // Its month begins: the plan's payments, the cover's fee and the battery's wear.
    if (!s.universe.scheduled.some((one) => one.status === 'pending' && one.kind === PHONE_MONTH_KIND && one.payload.itemId === owned.id)) scheduleMonth(s, person, owned, s.now);
    return { paid: q.cost, carrier: q.carrier };
  });
  sim.onCommand<{ itemId: string }, { paid: Money }>('phone.battery', (p, { sim: s }) => {
    const person = s.player;
    const owned = ownedHere(s, person, String(p?.itemId));
    if (owned.device.battery >= 0.999) throw new CommandError('The battery is as good as new.');
    const cost = batteryQuote(s, person, owned);
    if (cost === undefined) throw new CommandError('Its maker publishes no battery price for it.');
    if (cost > 0 && !spend(s, person, cost, `${phoneById(owned.device.phoneId)!.maker}: a new battery`, 'personal')) throw new CommandError(`It comes to ${formatMoney(cost, saveCurrency(s.universe))}, more than you can pay.`);
    owned.device.battery = 1;
    return { paid: cost };
  });
  sim.onCommand<{ itemId: string }, { paid: Money }>('phone.claim', (p, { sim: s }) => {
    const person = s.player;
    const owned = phonesOf(person).find((x) => x.id === String(p?.itemId));
    if (!owned) throw new CommandError('That isn’t a phone you own.');
    if (owned.device.stolen === undefined && !reachable(s, person, owned.at)) throw new CommandError('It isn’t to hand.');
    const cost = claimQuote(s, person, owned);
    if (typeof cost === 'string') throw new CommandError(cost);
    const maker = phoneById(owned.device.phoneId)!.maker;
    const stolen = owned.device.stolen !== undefined;
    if (cost > 0 && !spend(s, person, cost, `${maker}: ${stolen ? 'a stolen phone replaced' : owned.device.broken === 'screen' ? 'a screen repaired' : 'a repair'}`, 'personal')) throw new CommandError(`It comes to ${formatMoney(cost, saveCurrency(s.universe))}, more than you can pay.`);
    if (stolen) {
      (owned.device.claims ??= []).push(s.now);
      delete owned.device.stolen;
      owned.device.battery = 1;
    }
    delete owned.device.broken;
    return { paid: cost };
  });
  sim.onCommand<{ itemId: string; plan?: string }, { monthly: Money }>('phone.protect', (p, { sim: s }) => {
    const person = s.player;
    const owned = ownedHere(s, person, String(p?.itemId));
    const phone = phoneById(owned.device.phoneId)!;
    if (!p?.plan) { delete owned.device.protection; return { monthly: 0 }; }
    const plan = protectionFor(phone).find((x) => x.plan === p.plan);
    if (!plan) throw new CommandError('That cover isn’t offered for it.');
    owned.device.protection = { plan: plan.plan, monthly: inSaveMoney(s, Math.round(plan.monthly * 100), plan.currency), batteryFee: plan.batteryFee === null ? null : inSaveMoney(s, Math.round(plan.batteryFee * 100), plan.currency) };
    if (!s.universe.scheduled.some((one) => one.status === 'pending' && one.kind === PHONE_MONTH_KIND && one.payload.itemId === owned.id)) scheduleMonth(s, person, owned, s.now);
    return { monthly: owned.device.protection.monthly };
  });

  // A phone's month: a payment on its plan, its cover's fee, and thirty days of its battery's cycles.
  sim.onSchedule(PHONE_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const owned = person ? (itemById(person, String(item.payload.itemId)) as Owned | undefined) : undefined;
    if (!person || !owned?.device) return;
    const d = owned.device;
    if (d.finance) {
      const due = d.finance.monthly;
      if (!payFromBank(s, person, due, `${d.finance.plan}, the ${owned.label}`, 'personal')) owe(s, person, due, `${d.finance.plan}, the ${owned.label}`, 'personal');
      d.finance.monthsLeft -= 1;
      if (d.finance.monthsLeft <= 0) delete d.finance;
    }
    // Cover the bank can't pay lapses, as a card declined does.
    if (d.protection && !spend(s, person, d.protection.monthly, `${d.protection.plan}, the ${owned.label}`, 'personal')) delete d.protection;
    d.battery = Math.max(0, d.battery - (30 * BATTERY.perDay * (1 - BATTERY.keptAt)) / BATTERY.cycles);
    // The phone in use is damaged or stolen at the published odds where they live.
    const risk = d.activated && d.stolen === undefined ? riskFor(person) : undefined;
    const befell = risk ? mishap(s, risk, owned.id, item.at, d.broken !== undefined) : undefined;
    if (befell) {
      const tell = (title: string, body: string) => { if (person.id === s.universe.playerId) s.notify({ category: 'personal', title, body, importance: 55, route: '/workspace/belongings' }); };
      if (befell === 'stolen') {
        d.stolen = item.at;
        delete d.activated;
        tell('Your Phone Was Stolen', `The ${owned.label} is gone${d.finance ? ', and what’s owed on it is still due' : ''}.`);
      } else {
        d.broken = befell;
        tell(befell === 'screen' ? 'You Cracked Your Phone’s Screen' : 'Your Phone Was Damaged', `The ${owned.label} needs a repair.`);
      }
    }
    if (d.finance || d.protection || d.activated) scheduleMonth(s, person, owned, item.at);
  });
}
