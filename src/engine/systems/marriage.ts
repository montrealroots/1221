/**
 * SLATE — a partner's earnings, how a couple splits the bills, marriage and
 * divorce (Stage 10 of `docs/BACKLOG.md`, from 2026-10-01; the figures in
 * `content/household.ts`).
 *
 * **Earnings.** A partner's job and pay are drawn once, when you become a
 * couple, from their country's employment rate and earnings spread
 * (decider `social.person`). Between the published points pay runs by a
 * line; below the tenth percentile down to half of it and above the
 * ninetieth up to half again, SLATE's reading of the tails.
 *
 * **The bills** are split evenly, as 46% of British couples who both work
 * do, or by what each earns, as 38% do (YouGov): your share is what you
 * earned last year over what you both did.
 *
 * **Marriage** is to your partner, in the place you live: its license or
 * notice and its civil ceremony, and a wedding at the country's average if
 * you choose one, its cost shared as the bills are; the ceremony comes
 * after the place's wait, and missed, it doesn't happen. It lifts the mood,
 * as Lucas (2003) found marriage does for a while.
 *
 * **Divorce** is asked for by either of you: you at the court's fees, or
 * they at the place's published rate a year by the marriage's length
 * (decider `social.divorce`). It's final after the least time the law
 * asks. Then the property is divided as the place divides it, on what your
 * worth gained over the marriage; what your partner gained isn't kept, and
 * is taken as nothing, SLATE's reading, so you pay half your gain where the
 * law halves it or equalizes. A Mexico City marriage under separate
 * property divides nothing. They move out, and it weighs on you.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { clamp } from '../core/rng';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { DIVORCE, EARNINGS, MARRIAGE, WEDDING, divorceRate, placeKey } from '../content/household';
import { PARTNERS, SOCIAL } from '../content/people';
import { contactsOf, type Contact } from './people';
import { owe, payFromBank } from './household';
import { netWorth } from './finance';
import { yearOf } from './earnings';
import { personalityOf } from './personality';

export const WEDDING_KIND = 'social.wedding';
export const DIVORCE_FINAL_KIND = 'social.divorce_final';
export const ANNIVERSARY_KIND = 'social.anniversary';
const YEAR_MS = 365.2425 * MS_DAY;

export interface Income { annual: number; currency: string; employed: boolean }
export interface Marriage { contactId: string; at: Instant; worthAt: Money; separate?: boolean; divorcing?: { since: Instant; finalAt: Instant; by: 'you' | 'them' } }

const countryOf = (cityId: string) => CITIES.get(cityId)?.countryId ?? 'us';
const inSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

/** A partner's job and pay, drawn once for them from their country's figures. */
export function incomeOf(sim: Simulation, person: Person, c: Contact): Income {
  if (c.income) return c.income;
  const rule = EARNINGS[countryOf(c.cityId)] ?? EARNINGS.us!;
  const rng = sim.rng('social.person', person.id, `income-${c.id}`);
  const employed = rng.next() < rule.employed;
  let annual = 0;
  const u = rng.next();
  if (employed && rule.spread) {
    const s = rule.spread;
    const pts: [number, number][] = [[0, s.p10 / 2], [0.1, s.p10], [0.25, s.p25], [0.5, s.median], [0.75, s.p75], [0.9, s.p90], [1, s.p90 * 1.5]];
    for (let i = 1; i < pts.length; i += 1) {
      const [x1, y1] = pts[i]!;
      const [x0, y0] = pts[i - 1]!;
      if (u <= x1) { annual = y0 + (y1 - y0) * (u - x0) / (x1 - x0); break; }
    }
  } else if (employed && rule.bands && rule.minimumMonthly) {
    const total = rule.bands.reduce((a, b) => a + b.share, 0);
    let acc = 0;
    for (const b of rule.bands) {
      acc += b.share / total;
      if (u <= acc) { annual = rule.minimumMonthly * 12 * (b.from + (b.to - b.from) * rng.next()); break; }
    }
  }
  c.income = { annual: Math.round(annual), currency: rule.currency, employed };
  return c.income;
}

/** What you earned in a calendar year: wages, benefits and a pension. */
export function earnedIn(person: Person, year: number): Money {
  const y = yearOf(person, year);
  return y.acting + y.workStudy + y.unemployment + (y.pension ?? 0);
}

export const partnerOf = (person: Person): Contact | undefined => contactsOf(person).find((c) => c.dating?.couple !== undefined);
export const livesWithPartner = (person: Person): Contact | undefined => contactsOf(person).find((c) => c.livesWith !== undefined && c.cityId === person.home?.cityId);

/** Your share of the rent and the bills: all of it alone, half, or by what you each earn. */
export function billShare(sim: Simulation, person: Person): number {
  const c = livesWithPartner(person);
  if (!c) return 1;
  if (person.billSplit !== 'income') return 1 - PARTNERS.share;
  const year = zonedParts(sim.now, sim.homeZone).year - 1;
  const mine = earnedIn(person, year);
  const inc = incomeOf(sim, person, c);
  const theirs = inc.employed ? inSave(sim, inc.annual, inc.currency) : 0;
  return mine + theirs > 0 ? mine / (mine + theirs) : 1 - PARTNERS.share;
}

/** What marrying costs where you live: the license and the ceremony, and your share of a wedding. */
export function marriageCost(sim: Simulation, person: Person, wedding: boolean): { fee: Money; wedding: Money; waitDays: number; basis: string } | undefined {
  const city = person.home?.cityId ?? person.currentLocationId;
  const rule = MARRIAGE[placeKey(city)];
  if (!rule) return undefined;
  const w = WEDDING[countryOf(city)];
  return { fee: inSave(sim, rule.fee, rule.currency), wedding: wedding && w ? Math.round(inSave(sim, w.amount, w.currency) * billShare(sim, person)) : 0, waitDays: rule.waitDays, basis: rule.basis };
}

export function marryRefusal(sim: Simulation, person: Person, contactId: string): string | undefined {
  if (person.marriage && !person.marriage.divorcing) return 'You’re married already.';
  if (person.marriage?.divorcing) return 'Your divorce isn’t final yet.';
  const c = contactsOf(person).find((x) => x.id === contactId);
  if (!c?.dating?.couple) return 'You can marry only your partner.';
  if (c.cityId !== (person.home?.cityId ?? person.currentLocationId)) return `${c.name.split(' ')[0]} lives in ${CITIES.require(c.cityId).name}.`;
  if (!marriageCost(sim, person, false)) return 'SLATE keeps no marriage rules where you live yet.';
  if (sim.universe.scheduled.some((i) => i.kind === WEDDING_KIND && i.status === 'pending')) return 'Your wedding is already set.';
  return undefined;
}

/** What the divorce would take now: the court's fees, and the property's division on what you gained. */
export function divorceTerms(sim: Simulation, person: Person): { fee: Money; settlement: Money; waitDays: number; basis: string } | undefined {
  const m = person.marriage;
  if (!m) return undefined;
  const city = person.home?.cityId ?? person.currentLocationId;
  const rule = DIVORCE[placeKey(city)];
  if (!rule) return undefined;
  const gained = netWorth(sim, person.id).total - m.worthAt;
  const settlement = m.separate ? 0 : Math.max(0, Math.round(gained / 2));
  return { fee: inSave(sim, rule.fee, rule.currency), settlement, waitDays: rule.waitDays, basis: rule.basis };
}

function feel(person: Person, stress: number, morale: number): void {
  const w = person.wellbeing;
  w.stress = clamp(w.stress + stress * personalityOf(person, 'stressGain'), 0, 100);
  w.morale = clamp(w.morale + morale * personalityOf(person, 'moraleSwing'), 0, 100);
}

function startDivorce(sim: Simulation, person: Person, by: 'you' | 'them'): void {
  const m = person.marriage!;
  const terms = divorceTerms(sim, person);
  const waitDays = terms?.waitDays ?? 0;
  if (by === 'you' && terms && terms.fee > 0 && !payFromBank(sim, person, terms.fee, 'The divorce’s court fees', 'personal')) owe(sim, person, terms.fee, 'The divorce’s court fees', 'personal');
  m.divorcing = { since: sim.now, finalAt: sim.now + waitDays * MS_DAY, by };
  sim.schedule({ at: m.divorcing.finalAt + 60_000, kind: DIVORCE_FINAL_KIND, label: 'The Divorce Is Final', category: 'relationship', priority: 30, payload: { personId: person.id } });
  const c = contactsOf(person).find((x) => x.id === m.contactId);
  c?.memory.unshift({ at: sim.now, what: by === 'you' ? 'You asked for a divorce' : 'Asked you for a divorce' });
  feel(person, SOCIAL.breakup, -SOCIAL.breakup);
  if (by === 'them' && person.id === sim.universe.playerId) sim.notify({ category: 'relationship', title: 'Your Partner Wants A Divorce', body: `${c?.name ?? 'Your partner'} has asked for a divorce. It’s final on ${formatDate(m.divorcing.finalAt, sim.zone)}.`, importance: 80, route: '/workspace/people' });
}

export function registerMarriage(sim: Simulation): void {
  sim.onCommand<{ how: 'even' | 'income' }, { how: 'even' | 'income' }>('social.split', (p, { sim: s }) => {
    const how = p?.how === 'income' ? 'income' : 'even';
    if (how === 'income') s.player.billSplit = 'income'; else delete s.player.billSplit;
    return { how };
  });

  sim.onCommand<{ contactId: string; wedding?: boolean; separate?: boolean }, { at: Instant; paid: Money }>('social.marry', (p, { sim: s }) => {
    const person = s.player;
    const no = marryRefusal(s, person, String(p?.contactId));
    if (no) throw new CommandError(no);
    const cost = marriageCost(s, person, Boolean(p.wedding))!;
    const paid = cost.fee + cost.wedding;
    if (!payFromBank(s, person, paid, p.wedding ? 'The license and the wedding, your share' : 'The license and the ceremony', 'personal')) throw new CommandError('The bank couldn’t pay for it.');
    const zone = CITIES.require(person.home?.cityId ?? person.currentLocationId).timeZone;
    const day = zonedParts(s.now + Math.max(1, cost.waitDays) * MS_DAY, zone);
    const at = instantFromZoned({ year: day.year, month: day.month, day: day.day, hour: 14, minute: 0 }, zone);
    s.schedule({ at, kind: WEDDING_KIND, label: p.wedding ? 'Your Wedding' : 'Your Ceremony', category: 'relationship', priority: 20, requiresPlayer: true, durationMinutes: p.wedding ? 360 : 60, locationId: person.home?.cityId ?? person.currentLocationId, payload: { personId: person.id, contactId: String(p.contactId), separate: Boolean(p.separate) } });
    return { at, paid };
  });

  sim.onSchedule(WEDDING_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const c = person && contactsOf(person).find((x) => x.id === item.payload.contactId);
    if (!person || !c?.dating?.couple) return;
    if (person.currentLocationId !== item.locationId) {
      c.memory.unshift({ at: item.at, what: 'You didn’t come to your own wedding' });
      feel(person, SOCIAL.breakup, -SOCIAL.breakup);
      return;
    }
    person.marriage = { contactId: c.id, at: item.at, worthAt: netWorth(s, person.id).total, ...(item.payload.separate ? { separate: true } : {}) };
    c.memory.unshift({ at: item.at, what: 'Married you' });
    feel(person, 0, MARRIED.morale);
    s.schedule({ at: item.at + YEAR_MS, kind: ANNIVERSARY_KIND, label: 'Your Anniversary', category: 'relationship', priority: 40, payload: { personId: person.id, year: 1 } });
  });

  // A year of marriage gone: whether your partner asks for a divorce, at the place's rate for its length.
  sim.onSchedule(ANNIVERSARY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const m = person?.marriage;
    if (!person || !m || m.divorcing) return;
    const year = Number(item.payload.year);
    mayDivorce(s, person, year);
    if (!person.marriage?.divorcing) s.schedule({ at: item.at + YEAR_MS, kind: ANNIVERSARY_KIND, label: 'Your Anniversary', category: 'relationship', priority: 40, payload: { personId: person.id, year: year + 1 } });
  });

  sim.onCommand<Record<string, never>, { finalAt: Instant }>('social.divorce', (_p, { sim: s }) => {
    const person = s.player;
    if (!person.marriage) throw new CommandError('You aren’t married.');
    if (person.marriage.divorcing) throw new CommandError('Your divorce is under way already.');
    startDivorce(s, person, 'you');
    return { finalAt: person.marriage.divorcing!.finalAt };
  });

  sim.onSchedule(DIVORCE_FINAL_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const m = person?.marriage;
    if (!person || !m?.divorcing) return;
    const terms = divorceTerms(s, person);
    const c = contactsOf(person).find((x) => x.id === m.contactId);
    if (terms && terms.settlement > 0 && !payFromBank(s, person, terms.settlement, 'The divorce’s division of property', 'personal')) owe(s, person, terms.settlement, 'The divorce’s division of property', 'personal');
    delete person.marriage;
    if (c) { delete c.dating; delete c.livesWith; c.memory.unshift({ at: item.at, what: 'Divorced' }); }
    if (person.id === s.universe.playerId) s.notify({ category: 'relationship', title: 'Divorced', body: terms?.settlement ? `The property is divided: ${formatMoney(terms.settlement, saveCurrency(s.universe), { cents: false })} to ${c?.name ?? 'your former partner'}.` : 'It’s over, and nothing is divided.', importance: 70, route: '/workspace/people' });
  });
}

/** SLATE's estimate of what a wedding lifts the mood by. */
export const MARRIED = { morale: 10 } as const;

/** The year's draw of your partner asking for a divorce (decider `social.divorce`); `odds` overrides the place's rate, for the sweep. */
export function mayDivorce(sim: Simulation, person: Person, year: number, odds?: number): boolean {
  const m = person.marriage;
  if (!m || m.divorcing) return false;
  const chance = odds ?? divorceRate(year - 1, countryOf(person.home?.cityId ?? person.currentLocationId));
  if (sim.rng('social.divorce', person.id, `${m.at}-${year}`).next() >= chance) return false;
  startDivorce(sim, person, 'them');
  return true;
}

/**
 * What a married person's own tax is relieved by where they're taxed, in
 * `currency` (from 2026-10-01, `research-household-economics.json`):
 * - Britain: the Marriage Allowance, £1,260 of a spouse's unused personal
 *   allowance transferred, where the spouse earns under the £12,570
 *   allowance and you pay no more than the basic rate (to £50,270); 2026-27.
 * - Canada: the spouse amount, a credit at the lowest rate on what the
 *   spouse earns under it: federally 15% of $16,452, and Ontario's 5.05% of
 *   $11,029 or British Columbia's 5.06% of $11,317; 2026. Taken all off
 *   the national tax, SLATE's simplification.
 * - Ireland: joint assessment's wider standard rate band, €53,000 against
 *   a single €44,000 for the earner, less what a spouse earning over
 *   €35,000 uses of it, at the 20 points between the rates; and on one
 *   income the married credit of €4,000 against €2,000; 2026.
 * America's joint return is figured when it's filed (`systems/taxreturn.ts`);
 * Mexico taxes each person alone.
 */
export function marriedRelief(person: Person, cityId: string, at: Instant, currency: string): { deductions?: Money; credit?: Money } | undefined {
  const m = person.marriage;
  if (!m || m.at > at) return undefined;
  const c = contactsOf(person).find((x) => x.id === m.contactId);
  if (!c?.income) return undefined;
  const spouse = c.income.employed ? c.income.annual : 0;
  const into = (units: number, from: string) => { const cents = Math.round(units * 100); return from === currency ? cents : exchange(cents, from, currency) ?? cents; };
  const spouseIn = (cur: string) => (c.income!.currency === cur ? spouse : (exchange(Math.round(spouse * 100), c.income!.currency, cur) ?? spouse * 100) / 100);
  const country = countryOf(cityId);
  const year = zonedParts(at, 'UTC').year;
  const mine = earnedIn(person, year - 1);
  const mineIn = (cur: string) => (cur === currency ? mine : (exchange(mine, currency, cur) ?? mine)) / 100;
  if (country === 'uk') {
    if (spouseIn('GBP') >= 12_570 || mineIn('GBP') > 50_270) return undefined;
    return { deductions: into(1_260, 'GBP') };
  }
  if (country === 'ca') {
    const s = spouseIn('CAD');
    const prov = cityId.startsWith('ca-on') ? 0.0505 * Math.max(0, 11_029 - s) : cityId.startsWith('ca-bc') ? 0.0506 * Math.max(0, 11_317 - s) : 0;
    const credit = 0.15 * Math.max(0, 16_452 - s) + prov;
    return credit > 0 ? { credit: into(credit, 'CAD') } : undefined;
  }
  if (country === 'ie') {
    const s = spouseIn('EUR');
    const band = Math.max(0, 9_000 - Math.max(0, s - 35_000));
    const credit = 0.2 * Math.min(band, Math.max(0, mineIn('EUR') - 44_000)) + (s === 0 ? 2_000 : 0);
    return credit > 0 ? { credit: into(credit, 'EUR') } : undefined;
  }
  return undefined;
}

/** A spouse's year's pay in a currency, cents, for America's joint return: nothing where you weren't married at the year's end. */
export function spouseIncomeFor(person: Person, year: number, currency: string): Money | undefined {
  const m = person.marriage;
  if (!m || zonedParts(m.at, 'UTC').year > year) return undefined;
  const c = contactsOf(person).find((x) => x.id === m.contactId);
  if (!c?.income) return undefined;
  const cents = c.income.employed ? Math.round(c.income.annual * 100) : 0;
  return c.income.currency === currency ? cents : exchange(cents, c.income.currency, currency) ?? cents;
}
