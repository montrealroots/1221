/**
 * Care's words, from 2026-10-20 (the owner's brief 17, sections 3 and 8, read as a player meets an illness: struck,
 * seen, treated, mending, mended, and the bill). Until then:
 * - a visit's notice began with the bill's own line, "A doctor’s visit, Yale Health Center, Student Health.", and the
 *   flu seen at urgent care "The flu, at urgent care, …";
 * - the flu's notice said "Work Out waits until it passes", left out the voice and body work it holds back while it lasts
 *   (`conditionAt`'s `ill`), and said Call In Sick "excuses a day of classes", which read as one day in all where
 *   `sickRefusal` takes it on any day of the flu; and no look said you had it;
 * - a marketplace claim denied was told "You owe $45.00." in its visit's notice, over a bill of the full $183.98, and only
 *   the next notice said the full figure.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, formatDate } from '@/engine/core/time';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { careFor, coverOn, healthOf } from '@/engine/systems/health';
import { appointmentWords, seenWords, SPECIALIST } from '@/engine/systems/appointments';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';
import '@/ui/looks/all';

const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const yourself = (sim: Simulation) => resolveLook(sim, at('person', sim.universe.playerId)) as Looked;

describe('the flu, as a student meets it', () => {
  it('says what it keeps you from and that Call In Sick can excuse each day, and your look says you have it until it passes', () => {
    const sim = student('lang17-flu');
    careFor(sim, sim.player, { care: 'visit', what: 'The flu', flu: true }, sim.now);
    const until = healthOf(sim.player).fluUntil!;
    const day = formatDate(until, sim.zone);
    expect(titled(sim, 'You Have The Flu').map((n) => n.body)).toEqual([`It lasts until ${day}, and it has cost you some condition and energy. Until it passes you can’t work out, and it holds back your voice and body work. Each day until then, Call In Sick, on School’s Classes tab, can excuse that day at school. You didn’t see a doctor, so there’s nothing to pay.`]);
    const words = () => renderToStaticMarkup(createElement('div', null, yourself(sim).body)).replace(/<[^>]+>/g, '');
    expect(words()).toContain(`Ill. The flu, until ${day}.`);
    // Passed, it's gone from your look.
    healthOf(sim.player).fluUntil = sim.now - 1; // TEST SETUP
    expect(words()).not.toContain('The flu');
  });

  it('seen at urgent care, says who you saw and where before how long it lasts', () => {
    const sim = student('lang17-flu-seen');
    careFor(sim, sim.player, { care: 'urgent', what: 'The flu, at urgent care', flu: true }, sim.now);
    const body = titled(sim, 'You Have The Flu')[0]!.body;
    expect(body).toMatch(/^You saw a doctor for it at .+\. It lasts until /);
    expect(body).toContain('Until it passes you can’t work out, and it holds back your voice and body work.');
  });
});

describe('a visit, said as who you saw and what for', () => {
  it('names each kind of appointment in a sentence, and an older one as it was written', () => {
    expect(seenWords('A doctor’s visit', 'Yale Health Center, Student Health')).toBe('You saw a doctor at Yale Health Center, Student Health.');
    expect(seenWords('A review of your asthma', 'Yale Health Center, Student Health')).toBe('You saw a doctor for a review of your asthma at Yale Health Center, Student Health.');
    expect(seenWords('A prescription to renew')).toBe('You saw a doctor to renew your prescription.');
    expect(seenWords(SPECIALIST, 'Fair Haven Community Health Care')).toBe('You saw the specialist your doctor referred you to at Fair Haven Community Health Care.');
    expect(seenWords('A checkup', 'Fair Haven Community Health Care')).toBe('A checkup, Fair Haven Community Health Care.');
    expect(appointmentWords('A doctor’s visit')).toBe('your doctor’s appointment');
    expect(appointmentWords('A review of your high blood pressure')).toBe('the review of your high blood pressure');
    expect(appointmentWords(SPECIALIST)).toBe('your appointment with the specialist');
  });
});

describe('a marketplace claim denied, told in its visit’s notice at the bill’s figure', () => {
  /** A visit on the marketplace in New York, searched until one claim is denied and one isn't. */
  function claims(): { denied?: Simulation; paid?: Simulation } {
    const out: { denied?: Simulation; paid?: Simulation } = {};
    for (let i = 0; i < 60 && !(out.denied && out.paid); i += 1) {
      const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', wealth: 'wealthy' }, `lang17-claim-${i}`);
      healthOf(sim.player).marketplace = { from: sim.now - MS_DAY, state: 'ny' }; // TEST SETUP
      if (coverOn(sim.player, sim.now) !== 'marketplace') continue;
      const bill = careFor(sim, sim.player, { care: 'visit', what: 'A doctor’s visit' }, sim.now);
      if (bill?.denied) out.denied ??= sim;
      else if (bill) out.paid ??= sim;
    }
    return out;
  }

  it('says the full figure the bill holds where the claim is denied, and the share where it isn’t', () => {
    const { denied, paid } = claims();
    expect(denied).toBeDefined();
    expect(paid).toBeDefined();
    for (const sim of [denied!, paid!]) {
      const bill = healthOf(sim.player).bills.at(-1)!;
      const owed = formatMoney(bill.amount, saveCurrency(sim.universe));
      const body = titled(sim, 'A Doctor’s Visit').at(-1)!.body;
      expect(body).toMatch(/^You saw a doctor at .+\. You owe /);
      expect(body).toContain(bill.denied ? `You owe the full ${owed}, because your plan denied the claim. It’s taken from your checking account on ${formatDate(bill.dueAt, sim.zone)}` : `You owe ${owed}. It’s taken from your checking account on ${formatDate(bill.dueAt, sim.zone)}`);
    }
    // The denial's own notice says the same figure, with the way to appeal.
    const bill = healthOf(denied!.player).bills.at(-1)!;
    expect(titled(denied!, 'A Claim Denied')[0]!.body).toContain(`so you owe the full ${formatMoney(bill.amount, saveCurrency(denied!.universe))} unless an appeal overturns it`);
  });
});
