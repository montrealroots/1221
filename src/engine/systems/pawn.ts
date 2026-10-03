/**
 * SLATE — pawning jewelry and watches (the master plan's §29, from
 * 2026-10-02; the places, rates and terms in `content/pawn.ts`).
 *
 * A piece of jewelry or a watch, to hand and not worn, of a known price,
 * is pledged at a pawnbroker in the town you're in for a loan of a share of
 * what it would sell for second-hand there (`systems/resale.ts`): paid into
 * the bank, owed on a loan account of its own, and the piece is the
 * pawnbroker's to keep until redeemed. It's redeemed in that town by paying
 * the loan and the interest to date: a month's rate for each month or part
 * of one (by the day at H&T, 28 days at least), and Los Angeles's one-off
 * charge. Unredeemed by its day, the piece is gone: sold, with the surplus
 * over what's owed paid to the borrower where the law says, at what it
 * would sell for second-hand; or simply the pawnbroker's, the debt with it.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { PAWN_SHARE, PAWN_TERMS, type PawnTerms } from '../content/pawn';
import { inTheBank, payFromBank } from './household';
import { homeKeyOf, itemById, itemsOf, reachable, type Item } from './items';
import { isValuable } from './valuables';
import { marketOf } from './clothing';
import { KIJIJI_SHARE, VINTED_SHARE } from './resale';

export interface Pawn { id: string; cityId: string; itemIds: string[]; accountId: string; at: Instant; until: Instant; /** The loan in the pawnbroker's money, and in the save's. */ loanUnits: number; loan: Money; /** What a sale would bring, in the save's money, at pledging. */ worth: Money }

export const PAWN_DUE_KIND = 'pawn.due';
export const pawnsOf = (person: Person): Pawn[] => (person.pawns ??= []);
export const pawnTermsIn = (cityId: string): PawnTerms | undefined => PAWN_TERMS.find((t) => t.cityId === cityId);

const toSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };
const toUnits = (sim: Simulation, money: Money, currency: string): number => { const cur = saveCurrency(sim.universe); return (cur === currency ? money : exchange(money, cur, currency) ?? money) / 100; };

/** What a piece would sell for second-hand where you are, in the save's money: Vinted's 28% of its new price, or Kijiji's half in Canada. */
export function secondHandWorth(cityId: string, item: Item): Money {
  const share = marketOf(cityId) === 'CA' ? KIJIJI_SHARE : VINTED_SHARE;
  return Math.round((item.paid ?? 0) * share);
}

export function pledgeRefusal(sim: Simulation, person: Person, itemIds: readonly string[]): string | undefined {
  if (!pawnTermsIn(person.currentLocationId)) return 'SLATE keeps no pawnbroker’s terms in this town.';
  if (itemIds.length === 0) return 'Choose what to pledge.';
  for (const id of itemIds) {
    const item = itemById(person, id);
    if (!item || !isValuable(item)) return 'A pawnbroker here takes jewelry and watches.';
    if (!reachable(sim, person, item.at)) return `The ${item.label} isn’t to hand.`;
    if (person.wornNow?.itemIds.includes(id)) return `You’re wearing the ${item.label}.`;
    if (!item.paid) return `What the ${item.label} cost isn’t known, so it can’t be valued.`;
  }
  return undefined;
}

/** What's owed on a pawn now, in the pawnbroker's money: the loan, its interest to date, and any one-off charge. */
export function owedUnits(p: Pawn, at: Instant): number {
  const t = pawnTermsIn(p.cityId)!;
  const days = Math.max(0, (at - p.at) / MS_DAY);
  const rate = t.monthly(p.loanUnits) / 100;
  let interest: number;
  if (t.daily) interest = p.loanUnits * rate * 12 / 365.25 * Math.max(t.daily.minDays, Math.ceil(days));
  else interest = Math.max(t.minMonthly ?? 0, p.loanUnits * rate) * Math.max(1, Math.ceil(days / (365.25 / 12)));
  return p.loanUnits + interest + (t.oneOff?.(p.loanUnits) ?? 0);
}

export const owedOn = (sim: Simulation, p: Pawn, at: Instant = sim.now): Money => toSave(sim, owedUnits(p, at), pawnTermsIn(p.cityId)!.currency);

/** The loan a set of pieces brings here, in the save's money. */
export function pledgeQuote(sim: Simulation, person: Person, itemIds: readonly string[]): { loan: Money; loanUnits: number; worth: Money } {
  const t = pawnTermsIn(person.currentLocationId)!;
  const worth = itemIds.reduce((a, id) => a + secondHandWorth(person.currentLocationId, itemById(person, id)!), 0);
  // The lender's own share where it publishes one, a watch's or jewelry's; else the NPA's middle.
  const lent = itemIds.reduce((a, id) => { const item = itemById(person, id)!; const share = t.share ? (/watch|reloj/i.test(item.label) ? t.share.watch : t.share.jewelry) : PAWN_SHARE; return a + Math.round(secondHandWorth(person.currentLocationId, item) * share); }, 0);
  const loanUnits = Math.round(toUnits(sim, lent, t.currency) * 100) / 100;
  return { loan: toSave(sim, loanUnits, t.currency), loanUnits, worth };
}

/** A pawn's day come: the pieces gone, the debt cleared, and the surplus paid where the law gives it. */
function forfeit(sim: Simulation, person: Person, p: Pawn): void {
  const t = pawnTermsIn(p.cityId)!;
  const owed = owedOn(sim, p, p.until);
  const ids = new Set(p.itemIds);
  person.items = itemsOf(person).filter((i) => !ids.has(i.id));
  const surplus = t.surplusAbove !== undefined && p.loanUnits > t.surplusAbove ? Math.max(0, p.worth - owed) : 0;
  const account = sim.universe.accounts[p.accountId];
  const principal = account ? -account.balance : 0;
  sim.post({ memo: `${t.lender}: a pledge unredeemed`, category: 'personal', postings: [
    ...(principal ? [{ accountId: p.accountId, amount: principal }] : []),
    ...(surplus > 0 ? [{ accountId: person.primaryAccountId!, amount: surplus }] : []),
    { accountId: sim.nominalAccount('income', 'Things Sold').id, amount: -(principal + surplus) },
  ] });
  if (account) account.closedAt = sim.now;
  person.pawns = pawnsOf(person).filter((x) => x.id !== p.id);
  if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'A Pledge Unredeemed', body: `What you pledged at ${t.lender} is theirs now${surplus > 0 ? '; it sold, and the surplus over what was owed was paid to you' : ''}.`, importance: 60, route: '/workspace/belongings' });
}

export function registerPawn(sim: Simulation): void {
  sim.onCommand<{ itemIds: string[] }, { pawnId: string; loan: Money }>('pawn.pledge', (p, { sim: s }) => {
    const person = s.player;
    const ids = Array.isArray(p?.itemIds) ? p.itemIds.map(String) : [];
    const no = pledgeRefusal(s, person, ids);
    if (no) throw new CommandError(no);
    const t = pawnTermsIn(person.currentLocationId)!;
    const q = pledgeQuote(s, person, ids);
    if (q.loan <= 0) throw new CommandError('It wouldn’t bring a loan.');
    const id = s.nextId('pawn');
    const account = s.openAccount({ id: s.nextId('account'), kind: 'loan', name: `A Pawn Loan, ${t.lender}`, ownerId: person.id, institution: t.lender, openedAt: s.now, category: 'pawn' });
    s.post({ memo: `${t.lender}: a pawn loan`, category: 'personal', postings: [{ accountId: person.primaryAccountId!, amount: q.loan }, { accountId: account.id, amount: -q.loan }] });
    const until = s.now + t.holdDays * MS_DAY;
    for (const itemId of ids) itemById(person, itemId)!.at = { kind: 'service', serviceId: `pawn:${id}`, readyAt: until };
    pawnsOf(person).push({ id, cityId: person.currentLocationId, itemIds: ids, accountId: account.id, at: s.now, until, loanUnits: q.loanUnits, loan: q.loan, worth: q.worth });
    s.schedule({ at: until, kind: PAWN_DUE_KIND, label: 'A Pledge Due', category: 'personal', priority: 30, payload: { personId: person.id, pawnId: id } });
    return { pawnId: id, loan: q.loan };
  });
  sim.onCommand<{ pawnId: string }, { paid: Money }>('pawn.redeem', (p, { sim: s }) => {
    const person = s.player;
    const pawn = pawnsOf(person).find((x) => x.id === p?.pawnId);
    if (!pawn) throw new CommandError('There’s no such pledge.');
    if (person.currentLocationId !== pawn.cityId) throw new CommandError('A pledge is redeemed where it was made.');
    const t = pawnTermsIn(pawn.cityId)!;
    const owed = owedOn(s, pawn);
    if (inTheBank(s, person) < owed) throw new CommandError('The bank can’t pay what’s owed.');
    // The loan repaid from the bank, and the interest and charges on top.
    const account = s.universe.accounts[pawn.accountId];
    const principal = account ? -account.balance : 0;
    if (account && principal > 0) s.post({ memo: `${t.lender}: the loan repaid`, category: 'personal', postings: [{ accountId: person.primaryAccountId!, amount: -principal }, { accountId: account.id, amount: principal }] });
    if (owed > principal && !payFromBank(s, person, owed - principal, `${t.lender}: a pawn loan's interest`, 'personal')) throw new CommandError('The bank can’t pay what’s owed.');
    if (account) account.closedAt = s.now;
    const home = person.home && person.home.cityId === person.currentLocationId ? homeKeyOf(person.home) : undefined;
    for (const id of pawn.itemIds) { const item = itemById(person, id); if (item) item.at = home ? { kind: 'home', home, spot: 'drawers' } : { kind: 'person' }; }
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === PAWN_DUE_KIND && one.payload.pawnId === pawn.id) s.timeline.cancel(one.id, s.now);
    person.pawns = pawnsOf(person).filter((x) => x.id !== pawn.id);
    return { paid: owed };
  });
  sim.onSchedule(PAWN_DUE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const pawn = person ? pawnsOf(person).find((x) => x.id === item.payload.pawnId) : undefined;
    if (person && pawn) forfeit(s, person, pawn);
  });
}
