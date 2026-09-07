/**
 * The black card, and the banks that answer the phone.
 *
 * Three promises. The real cards are on the shelf with their published fees
 * and their published rules: a Centurion is not applied for, a Platinum is,
 * and a card issued only in Britain is not issued to somebody in Los
 * Angeles. The invitation is earned the way it is widely reported to be
 * earned, and never bought. And a private bank is a real bank in a real
 * jurisdiction that wants a valid passport and a minimum, takes weeks over
 * its checks, moves the money exactly once when it opens, and is reported
 * to the tax authority at home rather than hidden from it.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, addDays, addMonths } from '@/engine/core/time';
import { BANK_PRODUCTS, productById, productLabel } from '@/engine/content/banking';
import { PRIVATE_BANKS, REAL_CARDS, privateBankById, realCardsFor } from '@/engine/content/wealth';
import { COUNTRIES } from '@/engine/content/geography';
import {
  INVITATION_ONLY, NOT_ISSUED_HERE, invitationStanding, isOffshore, monthlyFeeFor, openingRefusal, privateApplications, privateProductId, trailingSpend,
} from '@/engine/systems/banking';

beforeAll(async () => { await loadAllSections(); });

function aLife(seed = 'wealth', cash = 400_000_00): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, cash, 'Test funding', 'other');
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  sim.universe.creditProfiles[sim.player.id]!.score = 790;
  return sim;
}
function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown>, idempotencyKey?: string): R {
  const result = sim.execute<R>({ kind, payload, idempotencyKey });
  if (!result.ok) throw new Error(`${kind}: ${result.error}`);
  return result.value!;
}
function refusal(sim: Simulation, kind: string, payload: Record<string, unknown>): string | undefined {
  const result = sim.execute({ kind, payload });
  return result.ok ? undefined : result.error;
}
const checking = (sim: Simulation) => sim.ledger.account(sim.player.primaryAccountId!);
const funds = (sim: Simulation) => sim.ledger.availableFunds(sim.player.primaryAccountId!);
const held = (sim: Simulation, productId: string) => sim.ledger.accountsOf(sim.player.id).find((a) => a.productId === productId && !a.closedAt);

describe('the real cards on the shelf', () => {
  it('carry their issuer, network and published fee, billed monthly here, and are issued where they are issued', () => {
    for (const card of REAL_CARDS) {
      const product = productById(card.id)!;
      expect(product.real).toBe(true);
      expect(product.network).toBe(card.network);
      expect(product.monthlyFee).toBe(Math.round(card.annualFee / 12));
      expect(product.annualFee).toBe(card.annualFee);
      expect(product.baseCreditLimit).toBeGreaterThan(0);
      // Said once: the issuer and the card, unless the card's own name already carries the issuer.
      expect(productLabel(product)).toBe(card.name.startsWith(card.issuer.split(' ')[0]!) ? card.name : `${card.issuer} ${card.name}`);
      for (const id of card.countryIds) expect(COUNTRIES.get(id), `${card.id} is issued in ${id}, which is not a country`).toBeDefined();
    }
    expect(productById('amex_platinum')?.annualFee).toBe(895_00);
    expect(productById('chase_sapphire_reserve')?.annualFee).toBe(795_00);
    expect(productById('amex_centurion')?.initiationFee).toBe(10_000_00);
    expect(productById('amex_centurion')?.annualFee).toBe(5_000_00);
    expect(realCardsFor('us').map((c) => c.id)).toContain('amex_centurion');
    expect(realCardsFor('uk').map((c) => c.id)).toContain('coutts_silk');
    expect(realCardsFor('ng')).toEqual([]);
    expect(BANK_PRODUCTS.filter((p) => p.real).length).toBe(REAL_CARDS.length);
  });

  it('a Platinum is applied for; a Centurion is not; a British card is not issued in Los Angeles', () => {
    const sim = aLife('wealth-shelf');
    expect(openingRefusal(sim, productById('amex_platinum')!, 0)).toBeUndefined();
    expect(openingRefusal(sim, productById('amex_centurion')!, 0)).toBe(INVITATION_ONLY);
    expect(refusal(sim, 'bank.open', { productId: 'amex_centurion' })).toBe(INVITATION_ONLY);
    expect(openingRefusal(sim, productById('amex_platinum_uk')!, 0)).toBe(NOT_ISSUED_HERE);
    expect(refusal(sim, 'bank.open', { productId: 'coutts_silk' })).toBe(NOT_ISSUED_HERE);
    const before = funds(sim);
    const { accountId } = must<{ accountId: string }>(sim, 'bank.open', { productId: 'amex_platinum' });
    const platinum = sim.ledger.account(accountId);
    expect(platinum.institution).toBe('American Express');
    expect(monthlyFeeFor(platinum)).toBe(Math.round(895_00 / 12));
    // No initiation fee on a Platinum, and you cannot hold two of the same real card.
    expect(funds(sim)).toBe(before);
    expect(refusal(sim, 'bank.open', { productId: 'amex_platinum' })).toMatch(/hold .* already/);
  });
});

describe('the invitation', () => {
  it('comes after a year of the reported spend on the Platinum, then the Centurion costs what the issuer publishes', () => {
    const sim = aLife('wealth-black', 900_000_00);
    const { accountId } = must<{ accountId: string }>(sim, 'bank.open', { productId: 'amex_platinum' });
    sim.ledger.account(accountId).creditLimit = 100_000_00;
    expect(invitationStanding(sim, productById('amex_centurion')!).ready).toBe(false);
    expect(invitationStanding(sim, productById('amex_centurion')!).detail).toMatch(/0 of 12 months/);
    // Thirteen months of a quarter of a million a year on the card, paid in full each time.
    for (let month = 0; month < 14; month++) {
      sim.expense(accountId, 25_000_00, 'Everything, on the Platinum', 'shopping');
      sim.advanceTo(addMonths(sim.now, 1, sim.homeZone) + 2 * MS_DAY);
      must(sim, 'bank.pay_card', { accountId, how: 'full' });
      sim.income(sim.player.primaryAccountId!, 25_000_00, 'Test top up', 'other');
    }
    expect(trailingSpend(sim, 'amex_platinum')).toBeGreaterThanOrEqual(250_000_00);
    expect(sim.player.invitations?.['amex_centurion']).toBeDefined();
    expect(sim.universe.notifications.some((n) => n.title === 'An Invitation From American Express')).toBe(true);
    const ask = Object.values(sim.universe.decisions).find((d) => d.refType === 'card' && d.refId === 'amex_centurion' && !d.resolvedAt);
    expect(ask?.title).toBe('American Express Has Invited You');
    // Nobody is invited twice, and the invitation is not for sale.
    expect(refusal(sim, 'bank.open', { productId: 'amex_centurion_uk' })).toBe(NOT_ISSUED_HERE);
    const before = funds(sim);
    const black = must<{ accountId: string }>(sim, 'bank.open', { productId: 'amex_centurion' });
    expect(funds(sim)).toBe(before - 10_000_00);
    const centurion = sim.ledger.account(black.accountId);
    expect(centurion.institution).toBe('American Express');
    expect(monthlyFeeFor(centurion)).toBe(Math.round(5_000_00 / 12));
    expect(Object.values(sim.universe.decisions).find((d) => d.refType === 'card' && d.refId === 'amex_centurion')?.resolvedAt).toBeDefined();
    expect(refusal(sim, 'bank.open', { productId: 'amex_centurion' })).toMatch(/hold .* already/);
  });

  it('cannot be had with the spend and without the year', () => {
    const sim = aLife('wealth-early', 900_000_00);
    const { accountId } = must<{ accountId: string }>(sim, 'bank.open', { productId: 'amex_platinum' });
    sim.ledger.account(accountId).creditLimit = 400_000_00;
    for (let month = 0; month < 4; month++) {
      sim.expense(accountId, 90_000_00, 'Everything, on the Platinum', 'shopping');
      sim.advanceTo(addMonths(sim.now, 1, sim.homeZone) + 2 * MS_DAY);
      must(sim, 'bank.pay_card', { accountId, how: 'full' });
      sim.income(sim.player.primaryAccountId!, 90_000_00, 'Test top up', 'other');
    }
    expect(trailingSpend(sim, 'amex_platinum')).toBeGreaterThanOrEqual(250_000_00);
    expect(sim.player.invitations?.['amex_centurion']).toBeUndefined();
    expect(invitationStanding(sim, productById('amex_centurion')!).detail).toMatch(/of 12 months/);
  });
});

describe('a private bank', () => {
  it('is a real bank in a real place, with its minimum labelled published or reported', () => {
    expect(PRIVATE_BANKS.length).toBeGreaterThan(40);
    const ids = new Set<string>();
    for (const bank of PRIVATE_BANKS) {
      expect(ids.has(bank.id), bank.id).toBe(false);
      ids.add(bank.id);
      expect(COUNTRIES.get(bank.countryId), `${bank.name} is in ${bank.countryId}`).toBeDefined();
      expect(bank.minimumRelationship).toBeGreaterThan(0);
      expect(['published', 'reported']).toContain(bank.minimumIs);
      expect(bank.kycWeeks).toBeGreaterThan(0);
    }
    expect(privateBankById('ubs')?.countryId).toBe('ch');
    expect(privateBankById('hsbc_expat')?.countryId).toBe('je');
    expect(privateBankById('coutts')?.minimumIs).toBe('published');
  });

  it('wants a valid passport and the minimum, takes weeks, moves the money once, and says it is reported', () => {
    const sim = aLife('wealth-offshore');
    const bank = privateBankById('hsbc_expat')!;
    expect(isOffshore(sim, bank)).toBe(true);
    expect(refusal(sim, 'bank.apply_private', { bankId: 'hsbc_expat', deposit: 10_000_00, fromAccountId: checking(sim).id })).toMatch(/wants \$50,000 to open a relationship \(published\)/);
    sim.player.documents!.passport!.expiresAt = sim.now - MS_DAY;
    expect(refusal(sim, 'bank.apply_private', { bankId: 'hsbc_expat', deposit: 60_000_00, fromAccountId: checking(sim).id })).toMatch(/valid passport/);
    sim.player.documents!.passport!.expiresAt = sim.now + 5 * 365 * MS_DAY;
    const before = funds(sim);
    const applied = must<{ applicationId: string; readyAt: number; offshore: boolean; note: string }>(sim, 'bank.apply_private', { bankId: 'hsbc_expat', deposit: 60_000_00, fromAccountId: checking(sim).id }, 'apply:hsbc');
    const again = must<{ applicationId: string }>(sim, 'bank.apply_private', { bankId: 'hsbc_expat', deposit: 60_000_00, fromAccountId: checking(sim).id }, 'apply:hsbc');
    expect(again.applicationId).toBe(applied.applicationId);
    expect(privateApplications(sim, sim.player.id).length).toBe(1);
    expect(applied.offshore).toBe(true);
    expect(applied.note).toMatch(/Common Reporting Standard/);
    // Nothing moves until the bank says yes.
    expect(funds(sim)).toBe(before);
    expect(refusal(sim, 'bank.apply_private', { bankId: 'hsbc_expat', deposit: 60_000_00, fromAccountId: checking(sim).id })).toMatch(/already looking/);
    sim.advanceTo(applied.readyAt + MS_HOUR);
    const account = held(sim, privateProductId('hsbc_expat'))!;
    expect(account).toBeDefined();
    expect(account.institution).toBe('HSBC Expat');
    expect(account.balance).toBe(60_000_00);
    // The deposit left once, on the day; the weeks in between cost rent and bills like any other weeks.
    expect(before - funds(sim)).toBeGreaterThanOrEqual(60_000_00);
    expect(sim.ledger.history(sim.player.primaryAccountId!, 300).filter((t) => t.memo === 'Opening HSBC Expat Account').length).toBe(1);
    expect(privateApplications(sim, sim.player.id)[0]!.status).toBe('opened');
    const opened = sim.universe.notifications.find((n) => n.title === 'HSBC Expat Has Opened Your Account')!;
    expect(opened.body).toMatch(/Common Reporting Standard/);
    // An American with more than ten thousand abroad files an FBAR, and the game says so.
    expect(opened.body).toMatch(/FBAR/);
    expect(refusal(sim, 'bank.apply_private', { bankId: 'hsbc_expat', deposit: 60_000_00, fromAccountId: checking(sim).id })).toMatch(/bank at HSBC Expat already/);
    // The bank pays its rate on the cash at month end.
    sim.advanceTo(addMonths(sim.now, 1, sim.homeZone) + 2 * MS_DAY);
    expect(sim.ledger.account(account.id).balance).toBeGreaterThan(60_000_00);
  });

  it('declines, with the reason, when the money is not there on the day', () => {
    const sim = aLife('wealth-declined', 120_000_00);
    const applied = must<{ applicationId: string; readyAt: number }>(sim, 'bank.apply_private', { bankId: 'lloyds_international', deposit: 100_000_00, fromAccountId: checking(sim).id });
    sim.expense(sim.player.primaryAccountId!, 110_000_00, 'Spent it all', 'shopping');
    sim.advanceTo(applied.readyAt + MS_HOUR);
    const application = sim.universe.privateApplications![applied.applicationId]!;
    expect(application.status).toBe('declined');
    expect(application.reason).toMatch(/was not there/);
    expect(held(sim, privateProductId('lloyds_international'))).toBeUndefined();
  });

  it('is onshore at home, and the Reserve card comes with the private bank', () => {
    const sim = aLife('wealth-jpm', 30_000_000_00);
    const bank = privateBankById('jpm_private')!;
    expect(isOffshore(sim, bank)).toBe(false);
    expect(invitationStanding(sim, productById('jpm_reserve')!).ready).toBe(false);
    const applied = must<{ readyAt: number; offshore: boolean; note: string }>(sim, 'bank.apply_private', { bankId: 'jpm_private', deposit: 10_000_000_00, fromAccountId: checking(sim).id });
    expect(applied.offshore).toBe(false);
    expect(applied.note).not.toMatch(/Common Reporting Standard/);
    sim.advanceTo(applied.readyAt + MS_HOUR);
    expect(held(sim, privateProductId('jpm_private'))?.balance).toBe(10_000_000_00);
    expect(sim.player.invitations?.['jpm_reserve']).toBeDefined();
    const { accountId } = must<{ accountId: string }>(sim, 'bank.open', { productId: 'jpm_reserve' });
    expect(sim.ledger.account(accountId).institution).toBe('JPMorgan Chase');
    expect(addDays(sim.now, 0, sim.homeZone)).toBe(sim.now);
  });
});
