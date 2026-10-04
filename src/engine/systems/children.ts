/**
 * SLATE — having and raising a child (Stage 10 of `docs/BACKLOG.md`, from
 * 2026-10-01; the figures in `content/children.ts`).
 *
 * A couple living together can try for a child. Each month the one who can
 * carry conceives at their age's chance (decider `social.conceive`), and the
 * child is born 280 days later. The birth costs what it costs where you
 * live: in America insured or not, and a caesarean at its rate; nothing
 * under Britain's, Ireland's and Canada's public care. A birth you carried
 * is your medical bill; your partner's comes to the household, shared as the
 * bills are. A self-employed parent's leave is paid where the state pays it.
 *
 * Each month a child costs its year's published cost of raising, a
 * twelfth, shared as the bills are, and brings the state's child benefit by
 * its rules; America's Child Tax Credit is on the return
 * (\`systems/taxreturn.ts\`). At eighteen a child is grown, and costs and
 * brings nothing more.
 *
 * A child may come by adoption or a surrogacy too (`systems/adoption.ts`,
 * from 2026-10-02). Childcare beside the cost of raising isn't kept (it
 * counts it, where the estimate does); a child's day was neither until
 * 2026-10-03, when the school run came (`systems/schoolrun.ts`). After a
 * separation the children live with one of you, and the other pays support
 * (`systems/support.ts`, from 2026-10-02).
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { clamp } from '../core/rng';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { NAMES } from '../content/people';
import { CHILD_BENEFIT, LEAVE, PREGNANCY_DAYS, US_BIRTH, conceptionChance, raisingCost } from '../content/children';
import { contactsOf, type Contact } from './people';
import { billShare, earnedIn, incomeOf, livesWithPartner } from './marriage';
import { owe, payFromBank, spend } from './household';
import { billCare, coverOn } from './health';
import { supportMonth, supportRuns } from './support';
import { personalityOf } from './personality';

export const CHILD_MONTH_KIND = 'child.month';
export const BIRTH_KIND = 'child.birth';
const YEAR_MS = 365.2425 * MS_DAY;
const MONTH_MS = YEAR_MS / 12;

export interface Child { id: string; name: string; born: Instant; otherParentId?: string; /** Living with their other parent, after a separation (`systems/support.ts`, from 2026-10-02). */ livesWith?: 'them' }

/** A child lives with you unless they stayed with their other parent. */
export const livesWithYou = (k: Child): boolean => k.livesWith !== 'them';
export interface Pregnancy { carrier: 'you' | 'them'; contactId: string; due: Instant }

export const childrenOf = (person: Person): Child[] => (person.children ??= []);
const countryOf = (cityId: string) => CITIES.get(cityId)?.countryId ?? 'us';
const ageAt = (born: Instant, at: Instant) => (at - born) / YEAR_MS;
const inSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

/** Who in the couple can carry: you by your pronouns, they by their name's list. */
export function carrierOf(person: Person, c: Contact): 'you' | 'them' | undefined {
  if (person.pronouns?.startsWith('she')) return 'you';
  if (c.carries) return 'them';
  return undefined;
}

export function tryRefusal(person: Person): string | undefined {
  const c = livesWithPartner(person);
  if (!c) return 'You try for a child with a partner you live with.';
  if (person.pregnancy) return 'A child is on the way.';
  if (!carrierOf(person, c)) return 'Neither of you can carry a child: Adopt, or a surrogacy where the law lets it.';
  return undefined;
}

/** The month's chance of conceiving, for the one who carries, drawn; true when it happened. */
export function mayConceive(sim: Simulation, person: Person, at: Instant, odds?: number): boolean {
  if (!person.trying || person.pregnancy) return false;
  const c = livesWithPartner(person);
  const carrier = c ? carrierOf(person, c) : undefined;
  if (!c || !carrier) return false;
  const born = carrier === 'you' ? person.birthInstant : c.born;
  const chance = odds ?? conceptionChance(ageAt(born, at));
  if (sim.rng('social.conceive', person.id, String(at)).next() >= chance) return false;
  person.pregnancy = { carrier, contactId: c.id, due: at + PREGNANCY_DAYS * MS_DAY };
  sim.schedule({ at: person.pregnancy.due, kind: BIRTH_KIND, label: 'The Baby Is Due', category: 'relationship', priority: 10, payload: { personId: person.id } });
  if (person.id === sim.universe.playerId) sim.notify({ category: 'relationship', title: 'A Baby On The Way', body: `${carrier === 'you' ? 'You’re' : `${c.name.split(' ')[0]} is`} expecting, due ${formatDate(person.pregnancy.due, sim.zone)}.`, importance: 80, route: '/workspace/people' });
  return true;
}

/** What the birth costs in the save's money, and whether by caesarean (decider `social.conceive`). */
export function birthCost(sim: Simulation, person: Person, carrier: 'you' | 'them', c: Contact | undefined, at: Instant, caesareanOdds?: number): { amount: Money; caesarean: boolean } {
  const country = countryOf(person.home?.cityId ?? person.currentLocationId);
  if (country !== 'us') return { amount: 0, caesarean: false };
  const caesarean = sim.rng('social.conceive', person.id, `birth-${at}`).next() < (caesareanOdds ?? US_BIRTH.caesarean);
  const insured = carrier === 'you' ? coverOn(person, at) !== undefined : Boolean(c && incomeOf(sim, person, c).employed);
  const table = insured ? US_BIRTH.insured : US_BIRTH.uninsured;
  return { amount: inSave(sim, caesarean ? table.caesarean : table.vaginal, 'USD'), caesarean };
}

/** A month's state child benefit, in the save's money, for the children under 18. */
export function childBenefit(sim: Simulation, person: Person, at: Instant): Money {
  // The state pays the parent the children live with (from 2026-10-02).
  const kids = childrenOf(person).filter((k) => livesWithYou(k) && ageAt(k.born, at) < 18).sort((a, b) => a.born - b.born);
  if (!kids.length) return 0;
  const country = countryOf(person.home?.cityId ?? person.currentLocationId);
  const year = new Date(at).getUTCFullYear() - 1;
  const partner = livesWithPartner(person);
  const theirs = (cur: string) => { if (!partner) return 0; const i = incomeOf(sim, person, partner); if (!i.employed) return 0; return i.currency === cur ? i.annual : (exchange(Math.round(i.annual * 100), i.currency, cur) ?? i.annual * 100) / 100; };
  const mine = (cur: string) => { const m = earnedIn(person, year); const cents = saveCurrency(sim.universe) === cur ? m : exchange(m, saveCurrency(sim.universe), cur) ?? m; return cents / 100; };
  if (country === 'uk') {
    const b = CHILD_BENEFIT.uk;
    const weekly = b.eldestWeekly + (kids.length - 1) * b.otherWeekly;
    const higher = Math.max(mine('GBP'), theirs('GBP'));
    const kept = 1 - clamp((higher - b.hicbcFrom) / (b.hicbcTo - b.hicbcFrom), 0, 1);
    return inSave(sim, weekly * 52 / 12 * kept, 'GBP');
  }
  if (country === 'ie') return inSave(sim, CHILD_BENEFIT.ie.monthly * kids.length, 'EUR');
  if (country === 'ca') {
    const b = CHILD_BENEFIT.ca;
    const max = kids.reduce((s, k) => s + (ageAt(k.born, at) < 6 ? b.under6 : b.to17), 0);
    const n = Math.min(4, kids.length) - 1;
    const family = mine('CAD') + theirs('CAD');
    const [r1, r2] = b.rates[n]!;
    const reduction = family <= b.first ? 0 : family <= b.second ? (family - b.first) * r1 : b.fixed[n]! + (family - b.second) * r2;
    return inSave(sim, Math.max(0, max - reduction) / 12, 'CAD');
  }
  if (country === 'mx') {
    const b = CHILD_BENEFIT.mx;
    const primary = kids.filter((k) => { const a = ageAt(k.born, at); return a >= 6 && a < 12; }).length;
    const secondary = kids.filter((k) => { const a = ageAt(k.born, at); return a >= 12 && a < 15; }).length;
    return inSave(sim, primary * b.primaryYearly / 12 + (secondary ? (b.secondaryBimonthly + (secondary - 1) * b.secondaryOther) / 2 : 0), 'MXN');
  }
  return 0;
}

/** A month of raising the children, your share, in the save's money. */
export function raisingMonth(sim: Simulation, person: Person, at: Instant): Money {
  const country = countryOf(person.home?.cityId ?? person.currentLocationId);
  // The children who live with you; the others' raising is their other parent's, and support (`systems/support.ts`).
  const total = childrenOf(person).filter(livesWithYou).reduce((s, k) => { const c = raisingCost(country, ageAt(k.born, at)); return s + (c ? inSave(sim, c.amount / 12, c.currency) : 0); }, 0);
  return Math.round(total * billShare(sim, person));
}

function name(sim: Simulation, person: Person, key: string): string {
  const names = NAMES[(['us', 'uk', 'ie', 'ca', 'mx'] as const).find((x) => x === countryOf(person.home?.cityId ?? 'us')) ?? 'us'];
  const rng = sim.rng('social.conceive', person.id, `name-${key}`);
  const given = rng.next() < 0.5 ? names.female : names.male;
  return `${given[Math.floor(rng.next() * given.length)]} ${person.displayName.split(' ').slice(-1)[0]}`;
}

export function registerChildren(sim: Simulation): void {
  sim.onCommand<{ trying: boolean }, { trying: boolean }>('social.try_for_child', (p, { sim: s }) => {
    const person = s.player;
    if (p?.trying === false) { delete person.trying; return { trying: false }; }
    const no = tryRefusal(person);
    if (no) throw new CommandError(no);
    person.trying = true;
    if (!s.universe.scheduled.some((i) => i.kind === CHILD_MONTH_KIND && i.status === 'pending' && i.payload.personId === person.id)) {
      s.schedule({ at: s.now + MONTH_MS, kind: CHILD_MONTH_KIND, label: 'The Family’s Month', category: 'relationship', priority: 30, payload: { personId: person.id } });
    }
    return { trying: true };
  });

  sim.onSchedule(BIRTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const preg = person?.pregnancy;
    if (!person || !preg) return;
    const c = contactsOf(person).find((x) => x.id === preg.contactId);
    const cost = birthCost(s, person, preg.carrier, c, item.at);
    if (cost.amount > 0) {
      if (preg.carrier === 'you') billCare(s, person, cost.caesarean ? 'A caesarean birth' : 'A birth', cost.amount, item.at);
      else { const mine = Math.round(cost.amount * billShare(s, person)); if (!spend(s, person, mine, 'The birth, your share', 'health', true)) owe(s, person, mine, 'The birth', 'health'); }
    }
    const child: Child = { id: s.nextId('contact'), name: name(s, person, String(item.at)), born: item.at, otherParentId: preg.contactId };
    childrenOf(person).push(child);
    delete person.pregnancy;
    delete person.trying;
    // Leave paid to a self-employed parent where the state pays it.
    const leave = LEAVE[countryOf(person.home?.cityId ?? person.currentLocationId)];
    for (const pay of (preg.carrier === 'you' ? leave?.birth : leave?.other) ?? []) {
      const weekly = inSave(s, pay.weekly, pay.currency);
      for (let w = 0; w < pay.weeks; w += 1) s.schedule({ at: item.at + (w + 1) * 7 * MS_DAY, kind: LEAVE_KIND, label: pay.label, category: 'money', priority: 30, payload: { personId: person.id, amount: weekly, label: pay.label } });
    }
    const w = person.wellbeing;
    w.morale = clamp(w.morale + BIRTH.morale * personalityOf(person, 'moraleSwing'), 0, 100);
    if (person.id === s.universe.playerId) s.notify({ category: 'relationship', title: 'A Baby', body: `${child.name} was born${cost.caesarean ? ', by caesarean' : ''}${cost.amount ? `; the birth comes to ${formatMoney(cost.amount, saveCurrency(s.universe), { cents: false })}` : ''}.`, importance: 90, route: '/workspace/people' });
  });

  sim.onSchedule(LEAVE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person?.primaryAccountId) return;
    const amount = Number(item.payload.amount);
    s.post({ memo: String(item.payload.label), category: 'benefits', postings: [{ accountId: person.primaryAccountId, amount }, { accountId: s.nominalAccount('income', 'Parental Leave Pay').id, amount: -amount }] });
  });

  sim.onSchedule(CHILD_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    mayConceive(s, person, item.at);
    const cost = raisingMonth(s, person, item.at);
    if (cost > 0 && !payFromBank(s, person, cost, 'Raising the children, your share', 'household')) owe(s, person, cost, 'Raising the children', 'household');
    const benefit = childBenefit(s, person, item.at);
    if (benefit > 0 && person.primaryAccountId) {
      s.post({ memo: 'Child benefit', category: 'benefits', postings: [{ accountId: person.primaryAccountId, amount: benefit }, { accountId: s.nominalAccount('income', 'Child Benefit').id, amount: -benefit }] });
    }
    // Child support to or from a former partner (`systems/support.ts`, from 2026-10-02).
    supportMonth(s, person, item.at);
    const growing = childrenOf(person).some((k) => ageAt(k.born, item.at) < 18) || supportRuns(s, person, item.at);
    if (growing || person.trying || person.pregnancy) s.schedule({ at: item.at + MONTH_MS, kind: CHILD_MONTH_KIND, label: 'The Family’s Month', category: 'relationship', priority: 30, payload: { personId: person.id } });
  });
}

export const LEAVE_KIND = 'child.leave_pay';
/** SLATE's estimate of what a birth lifts the mood by. */
export const BIRTH = { morale: 10 } as const;

/** America's Child Tax Credit for a year, in a currency: the credit, and its refundable most. */
export function childTaxCredit(person: Person, year: number, magi: Money, joint: boolean, into: string): { credit: Money; refundable: Money } {
  const end = Date.UTC(year, 11, 31);
  const kids = childrenOf(person).filter((k) => k.born <= end && ageAt(k.born, end) < 17).length;
  if (!kids) return { credit: 0, refundable: 0 };
  const b = CHILD_BENEFIT.us;
  const usd = (x: number) => { const c = Math.round(x * 100); return into === 'USD' ? c : exchange(c, 'USD', into) ?? c; };
  const over = Math.max(0, magi - usd(joint ? b.phaseFromJoint : b.phaseFrom));
  const cut = Math.ceil(over / usd(1_000)) * usd(b.perThousand);
  const credit = Math.max(0, usd(b.credit) * kids - cut);
  return { credit, refundable: Math.min(credit, usd(b.refundable) * kids) };
}
