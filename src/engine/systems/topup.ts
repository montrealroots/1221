/**
 * SLATE — a top-up for low pay.
 *
 * France pays a worker on a low wage the prime d'activité every month, from
 * the CAF, worked from what they earned in the three months before last:
 * the single person's lump of €638.28, and 59.85% of what they earned, and
 * a bonus that grows between 59 and 138 hours of the SMIC, less everything
 * they had coming in, the earnings and any ARE with them; nothing under €15.
 * From caf.fr, service-public.gouv.fr and the Code de la sécurité sociale
 * (D843-2), as revalued on 1 April 2026 (`probe/research-3/fr-mx.json`).
 * It's claimed, and SLATE claims it for the player; the CAF pays around the
 * 5th, which is SLATE's estimate of the day. The forfait logement isn't
 * taken, as a tenant without housing aid has none, and SLATE pays no
 * housing aid. Until 2026-09-26 nothing topped up a low wage anywhere.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { CITIES } from '../content/geography';
import { payrollYear } from '../content/payroll';
import { minimumWageAt } from '../content/wages';
import { exchange } from '../content/currency';
import { saveCurrency, type Money } from '../core/money';
import { MS_DAY, zonedParts, type Instant } from '../core/time';
import { countryAt } from './work';

/** The prime d'activité a month, in euros, on a month's net earnings and other resources. */
export function primeActivite(earned: number, other: number, smicHourly: number): number {
  if (earned <= 0) return 0;
  const from = 59 * smicHourly;
  const full = 138 * smicHourly;
  const bonus = earned <= from ? 0 : earned >= full ? 240.63 : (240.63 * (earned - from)) / (full - from);
  const due = 638.28 + 0.5985 * earned + bonus - (earned + other);
  return due >= 15 ? due : 0;
}

/** Where somebody's pay comes from: where they work, or last worked. */
function whereWorked(person: Person): string {
  return person.job?.cityId ?? person.earnings?.lastLeft?.cityId ?? person.currentLocationId;
}

/**
 * This month's prime d'activité for a person in France, in the save's money:
 * the average month of the three before last, net of contributions, and any
 * ARE in them.
 */
export function topUpFor(sim: Simulation, person: Person, at: Instant): Money {
  const cityId = whereWorked(person);
  if (!CITIES.get(cityId) || countryAt(cityId).iso !== 'FR') return 0;
  if ((at - person.birthInstant) / (365.2425 * MS_DAY) < 18) return 0;
  const p = zonedParts(at, sim.homeZone);
  const from = Date.UTC(p.year, p.month - 5, 1);
  const to = Date.UTC(p.year, p.month - 2, 1);
  const save = saveCurrency(sim.universe);
  const toEuros = (m: Money) => (save === 'EUR' ? m : exchange(m, save, 'EUR') ?? m) / 100;
  const gross = toEuros((person.earnings?.paydays ?? []).filter((one) => one.at >= from && one.at < to).reduce((sum, one) => sum + one.gross, 0));
  let are = 0;
  for (const t of sim.universe.transactions) {
    if (t.at < from || t.at >= to || t.category !== 'benefit') continue;
    are += t.postings.filter((one) => one.amount > 0 && sim.universe.accounts[one.accountId]?.ownerId === person.id).reduce((sum, one) => sum + one.amount, 0);
  }
  // Net of the payslip's contributions, as the CAF counts it.
  const social = gross > 0 ? payrollYear('FR', Math.round(gross * 4 * 100), { path: ['FR'], at, age: 30 }).lines.filter((l) => l.kind !== 'tax').reduce((sum, l) => sum + l.amount / 100, 0) / (gross * 4) : 0;
  const month = primeActivite((gross * (1 - social)) / 3, toEuros(are) / 3, minimumWageAt(cityId, at, 'EUR').hourly / 100);
  const cents = Math.round(month * 100);
  return save === 'EUR' ? cents : exchange(cents, 'EUR', save) ?? cents;
}

export function registerTopUps(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'topup.prime', (_event, { sim: s }) => {
    if (zonedParts(s.now, s.homeZone).day !== 5) return;
    for (const person of Object.values(s.universe.people)) {
      if (!person.primaryAccountId || !person.earnings?.paydays.length) continue;
      const amount = topUpFor(s, person, s.now);
      if (amount <= 0) continue;
      s.post({
        memo: 'Prime d’activité', category: 'topup',
        postings: [
          { accountId: s.nominalAccount('income', 'Prime D’activité').id, amount: -amount },
          { accountId: person.primaryAccountId, amount },
        ],
      });
      person.earnings.topUp = { name: 'Prime d’activité', amount, at: s.now };
    }
  });
}
