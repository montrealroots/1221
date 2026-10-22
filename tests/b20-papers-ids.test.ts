/**
 * Brief 20's papers area, B1 and B3 for a passport's and an ID's expiry, and what asks for them
 * (docs/verification/audit-2026-10-21/criteria.md). Two lives alike but for one choice, from the same seed, through the
 * commands Papers sends and the clock:
 *
 * - **A passport run out, renewed in time or not.** A British student at Yale on an F-1 whose passport runs out in
 *   December: one presses Get A Passport in October, the other doesn't. The renewal is charged once, arrives on the day
 *   the office's three weeks give, and replaces the old one; the other's runs out. Then what asks for a passport in force
 *   reads the difference: a new bank, the Social Security office, Connecticut's DMV, and Going Abroad's reading of a
 *   visit. What the passport mustn't touch stays equal: her F-1 and her status, the School's standing and its shift.
 * - **An ID card, applied for or not.** A New Yorker who began with no passport and no license, as about one US-born life
 *   in eleven does (the passport share 0.536 and the license share 0.809 of `STARTING`): one applies for Connecticut's
 *   card, which is mailed twenty business days on; once it comes a new bank opens her account, and refuses her twin.
 * - **A Social Security number, applied for or not.** An F-1 student who applies at orientation's end has the card three
 *   weeks on, and a bank that opens accounts for international students opens hers online; her twin's is opened in a
 *   branch, an hour of her day.
 *
 * Each arrival and expiry is also reached in one jump of the clock, and across a save and a load, and happens once.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), at Yale in New Haven from Monday 24 August 2026.
 *
 * TEST SETUP, said where it's done: the body kept fed, rested and awake as the clock moves (`tended`); the passport's end
 * moved to Friday 11 December 2026 (a life's own is drawn to run out two to ten years on, its issue spread over the eight
 * years since sixteen, so its running out would be played in years); and the New Yorker without papers is the first of
 * a fixed list of seeds whose creation drew neither, which is a property of the seed, not a state set by hand.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDate, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { addYears, documentsOf, mayEnter, passportOf, photoIdOf } from '@/engine/systems/documents';
import { f1Of, usStatusEnds } from '@/engine/systems/permission';
import { businessDaysOn } from '@/engine/systems/permission';
import { SSN, hasSsn } from '@/engine/systems/taxid';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as subject } from '@/ui/looks/subject';
import { isValidElement, type ReactNode } from 'react';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
const LONDON: Partial<NewSaveConfig> = { homeRegionId: 'uk-eng-london' };
const life = (seed: string, more: Partial<NewSaveConfig> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...more });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const balance = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
const bankOf = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.bankId;

/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

/** Open Checking at a bank she doesn't bank with, its $25 opening deposit sent from her own account, as the Banking screen sends it. */
const openAt = (sim: Simulation, bankId: string) => sim.execute<{ accountId?: string }>({ kind: 'bank.open_current', payload: { bankId, fundFrom: sim.player.primaryAccountId, amount: 25_00 } });
const otherBank = (sim: Simulation) => (bankOf(sim) === 'us-wells-fargo' ? 'us-chase' : 'us-wells-fargo');
const bankName = (id: string) => (id === 'us-wells-fargo' ? 'Wells Fargo' : 'Chase');

function text(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map((n) => text(n as ReactNode)).join('');
  if (!isValidElement(node)) return '';
  return text((node.props as { children?: ReactNode }).children);
}
const page = (sim: Simulation, id: string) => {
  const found = resolveLook(sim, subject('document', id));
  if (!found || 'gone' in found) throw new Error(`document:${id} didn’t resolve`);
  return `${(found as Looked).summary ?? ''} ${text((found as Looked).body)}`;
};

describe('a passport run out, renewed in time or not', () => {
  it('PLAYER JOURNEY: renewed in October, it’s charged once and comes on its day, in one jump and across a reload; run out in December, a new bank, the Social Security office and the DMV refuse her twin in their words, and Going Abroad says so; her F-1, her status and the School are the same in both', () => {
    const renews = life('b20-papers-pp', LONDON);
    const lets = life('b20-papers-pp', LONDON);
    const ends = at(2026, 12, 11, 12);
    // TEST SETUP: the passport's end moved to 11 December 2026.
    for (const sim of [renews, lets]) passportOf(sim.player, sim.now)!.expiresAt = ends;
    const old = passportOf(renews.player, renews.now)!;
    for (const sim of [renews, lets]) tended(sim, at(2026, 10, 1, 18));

    // Get A Passport, from abroad: £116.50 online, in dollars at the game's rate, once.
    const was = balance(renews);
    const applied = renews.must<{ readyAt: number; fee: number }>({ kind: 'documents.apply_passport', payload: {} });
    expect(was - balance(renews)).toBe(applied.fee);
    expect(applied.fee).toBeGreaterThan(140_00);
    expect(renews.universe.transactions.filter((t) => t.memo.startsWith('British Passport'))).toHaveLength(1);
    // The office's three weeks, SLATE's assumption for an application from abroad.
    expect(applied.readyAt).toBe(renews.now + 21 * MS_DAY);
    expect(renews.execute({ kind: 'documents.apply_passport', payload: {} }).error).toBe('You’ve already applied, and it’s being decided.');

    // Played on in six-hour steps; saved and opened on 10 October and jumped to 23 October in one move.
    tended(renews, at(2026, 10, 10, 9));
    const jumped = reload(renews);
    tended(renews, at(2026, 10, 23, 9));
    jumped.advanceTo(at(2026, 10, 23, 9));
    for (const sim of [renews, jumped]) {
      const issued = titled(sim, `${old.name} Issued`);
      expect(issued).toHaveLength(1);
      expect(issued[0]!.at).toBe(applied.readyAt);
      const now = passportOf(sim.player, sim.now)!;
      expect(now.id).not.toBe(old.id);
      expect(now.issuedAt).toBe(applied.readyAt);
      expect(now.expiresAt).toBe(addYears(applied.readyAt, 10));
      expect(issued[0]!.body).toBe(`Your ${old.name}, ${now.number}, has arrived. It’s good until ${formatDate(now.expiresAt!, sim.zone)}. Your old passport is canceled.`);
      // With Go There to Papers, as the papers guide promises of a notice about a document.
      expect(issued[0]!.route).toBe('/workspace/papers');
      expect(documentsOf(sim.player).find((d) => d.id === old.id)!.status).toBe('cancelled');
      // Charged once, never again on arrival.
      expect(sim.universe.transactions.filter((t) => t.memo.startsWith('British Passport'))).toHaveLength(1);
    }
    expect(JSON.stringify(jumped.player.documents)).toBe(JSON.stringify(renews.player.documents));

    // On to the Monday after the old one's end.
    for (const sim of [renews, lets]) tended(sim, at(2026, 12, 14, 12));
    expect(passportOf(lets.player, lets.now)).toBeUndefined();
    expect(photoIdOf(lets.player, lets.now)).toBeUndefined();
    expect(photoIdOf(renews.player, renews.now)?.kind).toBe('passport');

    // What reads it, for the one who let it run out: refused in each one's words, and nothing charged.
    const bank = otherBank(lets);
    expect(otherBank(renews)).toBe(bank);
    const before = balance(lets);
    expect(openAt(lets, bank).error).toBe(`${bankName(bank)} needs a valid photo ID from a new customer: a passport, a driver’s license or an ID card. You can apply for a passport or an ID card on Papers, under Passport And ID.`);
    expect(lets.execute({ kind: 'documents.apply_ssn', payload: {} }).error).toBe('The office asks for your passport, and you don’t have one in force.');
    expect(lets.execute({ kind: 'documents.apply_idcard', payload: {} }).error).toBe('The DMV asks for a primary identity document in force: your passport, with your I-94 and I-20. Apply for a passport or renew it under Your Passport first.');
    expect(balance(lets)).toBe(before);
    expect(lets.player.ssn).toBeUndefined();
    expect(mayEnter(lets.player, 'FR', lets.now).missing[0]).toBe('You need a passport in force, and you don’t have one that hasn’t run out. Apply for one under Your Passport.');
    expect(page(lets, old.id)).toContain('It ran out on December 11, 2026 and no longer counts for anything.');

    // And for the one who renewed, each is open: the account opened, the number applied for, Going Abroad's visit read.
    expect(openAt(renews, bank).ok).toBe(true);
    expect(renews.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} }).arrivesAt).toBe(renews.now + SSN.days * MS_DAY);
    expect(mayEnter(renews.player, 'FR', renews.now).ok).toBe(true);

    // No leak: the passport is identity, not status. Her F-1 holds in both, her status runs while she studies, and the
    // School's standing and its next work-study shift are the same.
    for (const sim of [renews, lets]) {
      expect(f1Of(sim.player)!.status).toBe('valid');
      expect(usStatusEnds(sim.player)).toBeUndefined();
    }
    expect(lets.player.school!.standing).toBe(renews.player.school!.standing);
    const shift = (sim: Simulation) => { const r = sim.execute({ kind: 'school.take_shift', payload: {} }); return [r.ok, r.error, r.value]; };
    expect(shift(lets)).toEqual(shift(renews));
  }, 90_000);
});

describe('an ID card, applied for or not, and the bank that asks for one', () => {
  it('PLAYER JOURNEY: a New Yorker who began with no passport and no license applies for Connecticut’s card on her first morning; it’s mailed on the twentieth business day, once in one jump and across a reload, to her birthday seven years on, and a new bank opens her account where it refuses her twin', () => {
    // A fixed list, scanned in order: the first whose creation drew no passport and no license.
    const seed = Array.from({ length: 80 }, (_, n) => `b20-papers-noid-${n}`).find((s) => documentsOf(life(s).player).length === 0)!;
    // b20-papers-noid-5, the sixth of the list: the first five drew a passport, a license or both.
    expect(seed).toBe('b20-papers-noid-5');
    const card = life(seed);
    const twin = life(seed);
    expect(photoIdOf(card.player, card.now)).toBeUndefined();
    const was = balance(card);
    const got = card.must<{ readyAt: number; expiresAt: number; fee: number }>({ kind: 'documents.apply_idcard', payload: {} });
    // Connecticut's $28, once; mailed twenty business days on, the state's; a citizen's card runs to her first birthday
    // at least seven years on (CGS 1-1h(b)(2)), and is REAL ID.
    expect(got.fee).toBe(28_00);
    expect(was - balance(card)).toBe(28_00);
    expect(got.readyAt).toBe(businessDaysOn(card.now, 20, true));
    expect(formatDate(got.expiresAt, NY)).toBe('June 14, 2034');
    const doc = documentsOf(card.player).find((d) => d.kind === 'idcard')!;
    expect([doc.status, doc.realId]).toEqual(['pending', true]);
    expect(card.execute({ kind: 'documents.apply_idcard', payload: {} }).error).toBe('One is already on its way.');

    // Saved and opened halfway, then jumped past its day in one move, against the same life played on.
    tended(card, card.now + 10 * MS_DAY);
    const jumped = reload(card);
    tended(card, got.readyAt + 2 * MS_DAY);
    jumped.advanceTo(got.readyAt + 2 * MS_DAY);
    tended(twin, got.readyAt + 2 * MS_DAY);
    for (const sim of [card, jumped]) {
      const arrived = titled(sim, 'Non-Driver Identification Card Arrived');
      expect(arrived.map((n) => [n.at, n.body, n.route])).toEqual([[got.readyAt, 'It’s arrived, and you can use it from today.', '/workspace/papers']]);
      const held = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
      expect([held.status, held.issuedAt, held.expiresAt]).toEqual(['valid', got.readyAt, got.expiresAt]);
      expect(photoIdOf(sim.player, sim.now)?.id).toBe(held.id);
    }
    expect(JSON.stringify(jumped.player.documents)).toBe(JSON.stringify(card.player.documents));

    // The bank that asks: opened for her, refused her twin in its words, with nothing taken.
    const bank = otherBank(card);
    expect(openAt(card, bank).ok).toBe(true);
    const before = balance(twin);
    expect(openAt(twin, bank).error).toBe(`${bankName(bank)} needs a valid photo ID from a new customer: a passport, a driver’s license or an ID card. You can apply for a passport or an ID card on Papers, under Passport And ID.`);
    expect(balance(twin)).toBe(before);
  }, 120_000);
});

describe('a Social Security number, applied for or not', () => {
  it('PLAYER JOURNEY: applied for on the Monday after orientation, the card comes three weeks on, once across a reload, and a bank opens her account online, where her twin without one is sent to a branch for an hour', () => {
    const applies = life('b20-papers-ssn', LONDON);
    const waits = life('b20-papers-ssn', LONDON);
    for (const sim of [applies, waits]) tended(sim, at(2026, 8, 31, 18));
    const asked = applies.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    // An hour at the office, then three weeks.
    expect(asked.arrivesAt).toBe(at(2026, 8, 31, 19) + 21 * MS_DAY);
    expect(hasSsn(applies.player)).toBe(false);
    tended(applies, at(2026, 9, 10, 18));
    const opened = reload(applies);
    for (const sim of [applies, opened, waits]) tended(sim, at(2026, 9, 27, 10));
    for (const sim of [applies, opened]) {
      expect(hasSsn(sim.player)).toBe(true);
      expect(titled(sim, 'Your Social Security Card Has Arrived').map((n) => [n.at, n.body, n.route])).toEqual([[asked.arrivesAt, 'You now have a Social Security number. A bank that opens accounts online for people with a number can now open one for you that way.', '/workspace/papers']]);
    }
    expect(hasSsn(waits.player)).toBe(false);

    // The same bank, the same Sunday morning: online for her, the clock where it was; a branch's hour for her twin. (On the
    // Saturday her work-study shift holds her, and the branch is refused her twin for it; online it isn't.)
    const bank = otherBank(applies);
    expect(otherBank(waits)).toBe(bank);
    const t0 = applies.now;
    expect(openAt(applies, bank).ok).toBe(true);
    expect(applies.now).toBe(t0);
    expect(openAt(waits, bank).ok).toBe(true);
    expect(waits.now).toBe(t0 + MS_HOUR);
  }, 90_000);
});
