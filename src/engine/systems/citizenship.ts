/**
 * SLATE — naturalizing: a second citizenship (docs/WORLD.md, stage 1e), from
 * 2026-09-30, researched in `docs/research/world/research-citizenship.json`.
 *
 * A citizenship taken this way joins the one of birth (`citizenshipsOf`); it
 * gives the right to live, work and claim in its country, and travel stays
 * on the passport of birth. The United States, Canada, Britain and Ireland
 * each let their own citizens hold another, and let a newcomer keep theirs.
 * Mexico asks a naturalizing foreigner to renounce their old nationality,
 * but none of those four counts a renunciation made to Mexico, so SLATE
 * keeps both, as their law does.
 *
 * - **Britain:** twelve months after settlement, five years' residence in
 *   all; £1,839 with the ceremony, and £50 for the Life in the UK test (an
 *   American, a Canadian or an Irish citizen needs no English test). Usually
 *   decided within six months, SLATE's six.
 * - **Mexico:** five years' residence, or two for outstanding artistic work
 *   that benefits the nation (Ley de Nacionalidad art. 20), which SLATE
 *   reads on the O-1's record, three of its kinds of evidence; MXN 9,502.01,
 *   decided in 40 business days (the SRE's 2026 changes, reported).
 * - **The United States:** five years with a green card; $760 on paper. Its
 *   processing time, five to eleven months, wasn't confirmed: SLATE's eight.
 * The language and knowledge tests are taken as passed, SLATE not keeping
 * which languages a person speaks. Canada and Ireland aren't reached: no
 * route to residence there is open to an actor.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { citizenOf, documentsOf } from './documents';
import { payFromBank } from './household';
import { o1Evidence } from './permission';
import { residenceIn } from './residence';

const YEAR_MS = 365.2425 * MS_DAY;
export const NATURALIZE = {
  GB: { fee: 1_839 + 50, currency: 'GBP', years: 5, settledYears: 1, days: 182 },
  MX: { fee: 9_502.01, currency: 'MXN', years: 5, artisticYears: 2, days: 56 },
  US: { fee: 760, currency: 'USD', years: 5, days: 243 },
} as const;
export const CITIZENSHIP_KIND = 'citizenship.decided';
type Where = keyof typeof NATURALIZE;

/** When they first held residence in a country, of the routes SLATE grants. */
function firstResidence(person: Person, iso: string): Instant | undefined {
  return documentsOf(person).filter((d) => d.destination === iso && d.route !== undefined && d.issuedAt !== undefined).reduce<number | undefined>((a, d) => (a === undefined || d.issuedAt! < a ? d.issuedAt! : a), undefined);
}

export function naturalizeRefusal(sim: Simulation, person: Person, iso: string): string | undefined {
  if (!(iso in NATURALIZE)) return 'SLATE keeps naturalizing in Britain, Mexico and the United States, where a route to residence reaches.';
  if (citizenOf(person, iso)) return 'You’re a citizen there.';
  if (person.naturalizing) return 'An application is being decided.';
  const held = residenceIn(person, iso, sim.now);
  const first = firstResidence(person, iso);
  if (!held || first === undefined) return 'It asks residence there first.';
  const years = (sim.now - first) / YEAR_MS;
  if (iso === 'GB') {
    if (held.route !== 'uk-settled' || sim.now - (held.issuedAt ?? sim.now) < YEAR_MS) return 'It asks twelve months settled, with indefinite leave to remain.';
    // Its five years' residence are met on the way: settlement comes after five on the Global Talent visa.
  }
  if (iso === 'MX') {
    const artistic = o1Evidence(sim, person).filter((e) => e.met).length >= 3;
    if (years < (artistic ? NATURALIZE.MX.artisticYears : NATURALIZE.MX.years)) return artistic ? 'Outstanding artistic work asks two years’ residence.' : 'It asks five years’ residence in Mexico, or two for outstanding artistic work.';
  }
  if (iso === 'US') {
    if (held.route !== 'us-green-card' || years < NATURALIZE.US.years) return 'It asks five years with a green card.';
  }
  return undefined;
}

export function registerCitizenship(sim: Simulation): void {
  sim.onCommand<{ country: string }, { paid: Money; readyAt: Instant }>('documents.naturalize', (p, { sim: s }) => {
    const person = s.player;
    const iso = String(p?.country ?? '').toUpperCase();
    const no = naturalizeRefusal(s, person, iso);
    if (no) throw new CommandError(no);
    const rule = NATURALIZE[iso as Where];
    const cents = Math.round(rule.fee * 100);
    const cur = saveCurrency(s.universe);
    const fee = cur === rule.currency ? cents : exchange(cents, rule.currency, cur) ?? cents;
    if (!payFromBank(s, person, fee, 'Naturalization, the application', 'documents')) throw new CommandError(`${formatMoney(fee, cur)} is more than the bank can cover.`);
    const readyAt = s.now + rule.days * MS_DAY;
    person.naturalizing = { iso, readyAt };
    s.schedule({ at: readyAt, kind: CITIZENSHIP_KIND, label: 'Citizenship Decided', category: 'system', priority: 20, payload: { personId: person.id } });
    return { paid: fee, readyAt };
  });
  sim.onSchedule(CITIZENSHIP_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const n = person?.naturalizing;
    if (!person || !n) return;
    delete person.naturalizing;
    person.naturalized = [...(person.naturalized ?? []), { iso: n.iso, at: s.now }];
    if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: 'A Citizen', body: `Naturalized on ${formatDate(s.now, s.zone)}: a citizen there now, beside the country you were born a citizen of.`, importance: 70, route: '/workspace/papers' });
  });
}
