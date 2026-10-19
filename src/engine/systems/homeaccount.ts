/**
 * SLATE — an account kept at home (from 2026-10-16, the owner's decision of that day): a Yale student who lived in
 * another country before Yale, and kept an account at a bank there, may keep it beside the American one. The life stays
 * in New Haven; nothing here moves anybody.
 *
 * One rule decides it, for the creation screen and for `populateWorld` both (`homeAccountRefusal`), the way `findsNeed`
 * and `needFor` are one rule for the screen and the school. In order:
 *
 * 1. No prior residence said: no account.
 * 2. The prior residence in the country the life starts in: no account; the one here is theirs.
 * 3. A bank that isn't in that country, or one SLATE has no usable research on (`content/homeaccounts.ts`): refused,
 *    never guessed.
 * 4. The account must have been open before Yale: opened on the later of the day they began living there and the day
 *    they reached the bank's opening age.
 * 5. A bank that never opens a US person's account, and a US citizen: refused. The place of birth is read here and
 *    nowhere else, as the citizenship it gives (`citizenshipFor`). It never grants an account.
 * 6. Otherwise offered, and the screen says what follows (`whatFollows`).
 *
 * The starting money is split as the screen says (`splitOf`): what was saved stays where it was saved, the everyday
 * money is in the American account, and the two add to the family's money to the cent. Nothing is made: the savings at
 * home are the whole units the savings buy at SLATE's rate, and what that leaves over stays in dollars.
 */

import type { Simulation } from '../core/simulation';
import type { Account } from '../core/ledger';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import type { Person } from '../domain/model';
import type { NewSaveConfig } from '../world/bootstrap';
import { COUNTRIES, countryOfPlace, CITIES } from '../content/geography';
import { exchange } from '../content/currency';
import { bankById, type Bank } from '../content/banks';
import { RETENTION_CONFIDENCE, homeTerms, noticeFor, type HomeTerms } from '../content/homeaccounts';
import { citizenshipFor } from '../domain/citizenship';
import { addDays, ageOnDate, formatDate, instantFromZoned, type Instant } from '../core/time';
import { accountNumber } from './banknumber';

/** A place's country, ISO alpha-2, from its id alone: a town too small to be bundled names its country in its id. */
export function isoOfPlace(cityId: string): string | undefined {
  const country = countryOfPlace(cityId);
  return country ? COUNTRIES.get(country)?.iso2?.toUpperCase() : undefined;
}

/** A country as the rule's words name it: America for the United States. */
function countryWord(iso: string | undefined): string {
  if (iso === 'US') return 'America';
  const country = COUNTRIES.all().find((c) => c.iso2?.toUpperCase() === iso);
  return country?.name ?? 'that country';
}

const keyOf = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const before = (config: NewSaveConfig) => (config.school ? 'Yale' : 'you came here');

/** The day an account at the bank was opened, YYYY-MM-DD: the later of moving there and reaching its opening age. */
export function openingDayOf(config: NewSaveConfig, terms: HomeTerms): string {
  const prior = config.priorResidence!;
  const movedIn = keyOf(prior.fromYear, prior.fromMonth, 1);
  const ofAge = keyOf(config.birthYear + terms.openFromAge, config.birthMonth, config.birthDay);
  return movedIn > ofAge ? movedIn : ofAge;
}

/**
 * Why the account can't be kept, in the rule's words, or nothing where it can. Read by Starting Point's Before Yale and
 * by `populateWorld`, so the screen offers what the save opens.
 */
export function homeAccountRefusal(config: NewSaveConfig, bankId: string | undefined): string | undefined {
  const prior = config.priorResidence;
  // 1. Nothing said, or no place.
  if (!prior) return `You haven’t said where you lived before ${before(config)}.`;
  const there = isoOfPlace(prior.cityId);
  if (there === undefined) return `Choose where you lived before ${before(config)}.`;
  // 2. Before Yale in the country Yale is in: the account there is the one here.
  if (there === isoOfPlace(config.startLocationId)) {
    return `You lived in ${countryWord(isoOfPlace(config.startLocationId))} before ${before(config)}, so your account is the one here.`;
  }
  // 3. A bank there, and research SLATE can act on.
  const bank = bankId ? bankById(bankId) : undefined;
  if (!bank) return 'Choose the bank you kept the account at.';
  if (bank.iso !== there) return `${bank.name} isn’t a bank in ${countryWord(there)}.`;
  const terms = homeTerms(bank.id);
  if (!terms) return `The game doesn’t know what ${bank.name} does when a customer moves to America, so it can’t offer this account.`;
  if (terms.unusable) return terms.unusable;
  // 4. Open before Yale began. Said of the move, not of “this life” (from brief 15, 2026-10-19).
  const start = keyOf(config.startYear, config.startMonth, config.startDay);
  if (openingDayOf(config, terms) >= start) {
    const age = ageOnDate({ year: config.birthYear, month: config.birthMonth, day: config.birthDay }, { year: config.startYear, month: config.startMonth, day: config.startDay });
    return keyOf(prior.fromYear, prior.fromMonth, 1) >= start
      ? (config.school ? 'You moved there after Yale began.' : 'You moved there after you came here.')
      : `${bank.name} opens an account from age ${terms.openFromAge}, and you left at ${age}.`;
  }
  // 5. The birthplace, read only as the citizenship it gives.
  if (terms.usPersons === 'refuses' && citizenshipFor(config.homeRegionId) === 'us') {
    return `${bank.name} doesn’t open an account for a US citizen, so you never held one there.`;
  }
  // 6. Offered.
  return undefined;
}

/** The bank kept at home, where the rule offers it. */
export function homeBankOf(config: NewSaveConfig): Bank | undefined {
  return homeAccountRefusal(config, config.homeBankId) === undefined ? bankById(config.homeBankId!) : undefined;
}

/** The morning the life starts, in the start town's zone. */
function startOf(config: NewSaveConfig): Instant {
  const zone = CITIES.get(config.startLocationId)?.timeZone ?? 'America/New_York';
  return instantFromZoned({ year: config.startYear, month: config.startMonth, day: config.startDay, hour: 7, minute: 30 }, zone);
}

/** The day the bank closes a kept account, for a bank that closes one: the start and its notice. */
export function closesOn(config: NewSaveConfig, terms: HomeTerms): Instant | undefined {
  const days = terms.nonResident === 'closes' || (terms.usPersons === 'closes' && citizenshipFor(config.homeRegionId) === 'us')
    ? noticeFor(terms, openingDayOf(config, terms))
    : undefined;
  if (days === undefined) return undefined;
  const zone = CITIES.get(config.startLocationId)?.timeZone ?? 'America/New_York';
  return addDays(startOf(config), days, zone);
}

/**
 * What follows from keeping it, in sentences, for the screen: closing with its date, or kept, and on what, how sure the
 * research was, any charge for a customer abroad, and an opening age that is SLATE's.
 */
export function whatFollows(config: NewSaveConfig, bankId: string): string[] {
  const bank = bankById(bankId);
  const terms = homeTerms(bankId);
  if (!bank || !terms) return [];
  const zone = CITIES.get(config.startLocationId)?.timeZone ?? 'America/New_York';
  const out: string[] = [];
  const closes = closesOn(config, terms);
  if (closes !== undefined) {
    const why = terms.nonResident === 'closes' ? 'whose holder lives outside its country' : 'held by a US citizen';
    out.push(`${bank.name} closes an account ${why}: it gives ${noticeFor(terms, openingDayOf(config, terms))} days’ notice, so it closes on ${formatDate(closes, zone)}.`);
  } else if (terms.nonResident === 'keeps') {
    out.push(`${bank.name} keeps it for a customer who lives abroad.`);
  } else if (terms.condition) {
    out.push(terms.condition);
  }
  out.push(RETENTION_CONFIDENCE[terms.confidence]);
  const fee = terms.nonResidentFee;
  if (fee) {
    const age = ageOnDate({ year: config.birthYear, month: config.birthMonth, day: config.birthDay }, { year: config.startYear, month: config.startMonth, day: config.startDay });
    const every = fee.months === 1 ? 'a month' : fee.months === 3 ? 'a quarter' : fee.months === 24 ? 'every two years' : `every ${fee.months} months`;
    const spared = fee.ageBelow !== undefined && age < fee.ageBelow ? `, which it doesn’t charge under ${fee.ageBelow}, as you are` : '';
    out.push(`It charges ${formatMoney(fee.amount, bank.currency)} ${every} for a customer abroad${spared}.`);
  }
  // From 2026-10-16: until then the current account opened at nothing, and the bank's own fees overdrew it.
  const float = feesToGraduation(config, bank);
  if (float > 0) out.push(`Its ${bank.current.name} opens with ${formatMoney(float, bank.currency)} ${config.savingsAtHome === false ? 'from your money here' : 'from your savings'}, what its fees come to until you graduate in May ${config.startYear + GRADUATES.years}, or as much of that as there is. Move more in before it runs low.`);
  if (terms.ageAssumed) out.push(`No opening age was found for ${bank.name}, so the game assumes ${terms.openFromAge}.`);
  return out;
}

/** The starting money, split between the American bank and the one kept at home: the save's money and the bank's. */
export interface Split {
  /** Into the American current account and savings, in the save's money. */
  checking: Money;
  savings: Money;
  /** Into the home bank's savings: in the save's money, and the bank's own figure. */
  homeSavings: Money;
  homeSavingsHeld: Money;
  /** Into the home bank's current account, what its fees come to (`feesToGraduation`): the save's money and the bank's. */
  homeCurrent: Money;
  homeCurrentHeld: Money;
}

/** The month the class graduates: May, three years after the fall it begins (`systems/school.ts`, `classOf`). */
const GRADUATES = { years: 3, month: 5 } as const;

/**
 * What the bank's current account costs, in its money, from the month the life begins to the class's graduation: its
 * monthly fee and a quiet month's each month, its fee for a customer abroad on its schedule, and its card's yearly fee
 * each year, each as charged with no waiver, so the most they come to, in whole units (from 2026-10-16). A dormant
 * account's fee isn't counted: it follows two years unused, and a Japanese bank's takes no more than the account holds.
 */
export function feesToGraduation(config: NewSaveConfig, bank: Bank): Money {
  const months = GRADUATES.years * 12 + (GRADUATES.month - config.startMonth) + 1;
  const born = { year: config.birthYear, month: config.birthMonth, day: config.birthDay };
  const monthEnd = (i: number) => {
    const n = config.startMonth - 1 + i;
    const year = config.startYear + Math.floor(n / 12);
    const month = (n % 12) + 1;
    return { year, month, day: new Date(Date.UTC(year, month, 0)).getUTCDate() };
  };
  // A quiet month's fee each month too: an account kept from abroad and not used is quiet every month.
  let total = ((bank.current.monthlyFee ?? 0) + (bank.quietMonth?.fee ?? 0)) * months;
  const fee = homeTerms(bank.id)?.nonResidentFee;
  for (let i = 0; fee && i < months; i += 1) {
    const at = monthEnd(i);
    if (fee.ageBelow !== undefined && ageOnDate(born, at) < fee.ageBelow) continue;
    if (fee.months === 3 ? at.month % 3 === 0 : i % fee.months === 0) total += fee.amount;
  }
  // A card year charged at its end is charged first a year in (`CardYear.paid`, from brief 10, 2026-10-16); paid ahead,
  // on the first night, as every card year was counted until then.
  for (let i = bank.card?.year?.paid === 'behind' ? 12 : 0; bank.card?.yearly && i < months; i += 12) {
    if (bank.card.freeUnder === undefined || ageOnDate(born, monthEnd(i)) >= bank.card.freeUnder) total += bank.card.yearly;
  }
  return Math.ceil(total / 100) * 100;
}

/**
 * The split. The bank's current account opens holding what its fees come to until graduation (`float`, in its money,
 * `feesToGraduation`), so an account the screen says is kept isn't taken below zero and closed by its own fees: until
 * 2026-10-16 it opened at nothing, and at 21 of the 54 banks offered an idle life's was overdrawn from its first month's
 * end and closed at sixty days. With the savings kept at home, the bank's whole units the savings buy at SLATE's rate,
 * rounded down, go to the current account to that figure and the rest to the savings, each worth what it buys back; the
 * rest of the savings join the everyday money in the American current account. With them moved, or none, the current
 * account's figure comes from the American checking instead. With no bank kept, the money opens as it did before
 * 2026-10-16. Either way the four add to the family's checking and savings to the cent.
 */
export function splitOf(wealth: { checking: Money; savings: Money }, currency: string, home: Bank | undefined, savingsAtHome: boolean | undefined, float: Money = 0): Split {
  const none = { checking: wealth.checking, savings: wealth.savings, homeSavings: 0, homeSavingsHeld: 0, homeCurrent: 0, homeCurrentHeld: 0 };
  if (!home) return none;
  const units = (x: Money) => Math.floor(x / 100) * 100;
  const back = (x: Money) => exchange(x, home.currency, currency)!;
  const bought = savingsAtHome !== false && wealth.savings > 0 ? exchange(wealth.savings, currency, home.currency) : undefined;
  const held = bought !== undefined ? units(bought) : 0;
  if (held > 0) {
    const current = Math.min(float, held);
    const worth = back(held);
    const currentWorth = back(current);
    return { checking: wealth.checking + (wealth.savings - worth), savings: 0, homeSavings: worth - currentWorth, homeSavingsHeld: held - current, homeCurrent: currentWorth, homeCurrentHeld: current };
  }
  const affordable = float > 0 && wealth.checking > 0 ? exchange(wealth.checking, currency, home.currency) : undefined;
  const current = affordable !== undefined ? Math.min(float, units(affordable)) : 0;
  if (current <= 0) return none;
  const currentWorth = back(current);
  return { ...none, checking: wealth.checking - currentWorth, homeCurrent: currentWorth, homeCurrentHeld: current };
}

/** Opens one account at the bank kept at home, backdated to when it was opened, last used the morning the life starts. */
function openHomeAccount(sim: Simulation, person: Person, bank: Bank, kind: 'checking' | 'savings', worth: Money, held: Money, openedAt: Instant): Account {
  const foreign = bank.currency !== saveCurrency(sim.universe);
  const product = kind === 'checking' ? bank.current : bank.savings;
  // Numbered where it was opened: an Australian BSB names the state of the branch.
  const number = accountNumber(sim, { ...person, currentLocationId: person.priorResidence?.cityId ?? person.currentLocationId }, bank, kind);
  const account = sim.openAccount({
    id: sim.nextId('account'),
    kind,
    name: product.name,
    ownerId: person.id,
    institution: bank.name,
    bankId: bank.id,
    number,
    last4: number.replace(/\D/g, '').slice(-4),
    openedAt,
    // In use until the morning they left: an account opened years ago and touched since isn't idle from the day it opened.
    lastUsedBefore: sim.now,
    ...(foreign ? { currency: bank.currency } : {}),
    monthOpen: worth,
  });
  if (worth !== 0) {
    sim.post({
      memo: `Opening balance: ${account.name}`,
      category: 'opening',
      postings: [
        // The bank's own figure, given: a conversion back from the dollars could be a unit off where the bank's minor
        // unit is finer than a cent (the won, the yen).
        { accountId: account.id, amount: worth, ...(foreign ? { native: held } : {}) },
        { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -worth },
      ],
    });
  }
  return account;
}

/**
 * Opens what is kept at home, after the American bank's accounts: the current account, with what its fees come to until
 * graduation (at nothing until 2026-10-16), and the savings where the split put them there. Both opened on the day the rule found (`openingDayOf`), at noon where the life starts.
 */
export function openHomeAccounts(sim: Simulation, person: Person, config: NewSaveConfig, bank: Bank, split: Split): Account[] {
  const terms = homeTerms(bank.id)!;
  const [y, m, d] = openingDayOf(config, terms).split('-').map(Number) as [number, number, number];
  const openedAt = instantFromZoned({ year: y, month: m, day: d, hour: 12 }, sim.homeZone);
  const out = [openHomeAccount(sim, person, bank, 'checking', split.homeCurrent, split.homeCurrentHeld, openedAt)];
  if (split.homeSavings > 0) out.push(openHomeAccount(sim, person, bank, 'savings', split.homeSavings, split.homeSavingsHeld, openedAt));
  return out;
}
