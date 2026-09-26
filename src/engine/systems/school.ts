/**
 * SLATE — drama school, where the life begins (`content/school.ts`).
 *
 * The player arrives as an admitted first-year in the MFA in Acting at the
 * David Geffen School of Drama at Yale, on the first day of the fall term:
 * registration, then orientation, and classes from the 31st. They were the
 * actor the faculty wanted most from that year's auditions, and the school
 * won them with an award covering the whole cost of attendance and nothing to
 * borrow. That goes a little past Yale's usual top award, whose first year
 * includes a $9,500 loan.
 *
 * How the award is paid follows the school's own mechanics. Tuition is billed
 * to the student's Yale account and met in full by the tuition scholarship
 * every student has had since the David Geffen gift. The Yale Health plan is
 * billed there too. The living-expense scholarship, which covers living
 * expenses and books and supplies, is credited there as well, and what's left
 * after the health plan is paid out to the student's bank at the start of
 * each term, fall and spring, for the six terms of the degree.
 *
 * Work-study, which the school counts toward every package, isn't modeled
 * yet, so the scholarship stands in for it (`docs/UNBITTEN.md`).
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { formatDate, instantFromZoned, type Instant } from '../core/time';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { COST_2026_27, ORIENTATION_2026, TERM_STARTS_2026_27, YALE_DRAMA, type SchoolDate } from '../content/school';

export const TERM_KIND = 'school.term';

/** Monday is 1 in `Date.getUTCDay`'s count from Sunday. */
function mondayOnOrAfter(year: number, month: number, day: number): SchoolDate {
  const d = new Date(Date.UTC(year, month - 1, day));
  while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/**
 * The day a term begins, counting from the first-year's fall term as 0: the
 * Bulletin's for 2026–2027, SLATE's estimate after (`content/school.ts`).
 */
export function termStart(term: number): { date: SchoolDate; estimate: boolean; fall: boolean } {
  const fall = term % 2 === 0;
  if (term === 0) return { date: TERM_STARTS_2026_27.fall, estimate: false, fall };
  if (term === 1) return { date: TERM_STARTS_2026_27.spring, estimate: false, fall };
  const academicYear = TERM_STARTS_2026_27.fall.year + Math.floor(term / 2);
  // The fourth Monday of August; the first Monday from the third of January.
  return { date: fall ? mondayOnOrAfter(academicYear, 8, 22) : mondayOnOrAfter(academicYear + 1, 1, 3), estimate: true, fall };
}

/** A term's name, the way the school says it: "Fall term 2026". */
export function termName(term: number): string {
  const { date, fall } = termStart(term);
  return `${fall ? 'Fall' : 'Spring'} term ${date.year}`;
}

function zone(): string {
  return CITIES.require(YALE_DRAMA.cityId).timeZone;
}

function atNine(date: SchoolDate): Instant {
  return instantFromZoned({ ...date, hour: 9 }, zone());
}

/** A term's charges and credits on the student's Yale account, in the save's money: what's paid out is the rest. */
export function termAccount(into: string): { tuition: Money; healthPlan: Money; livingScholarship: Money; refund: Money } {
  const usd = (cents: Money) => (into === 'USD' ? cents : exchange(cents, 'USD', into) ?? cents);
  const tuition = usd(Math.round(COST_2026_27.tuition / 2));
  const healthPlan = usd(Math.round(COST_2026_27.healthPlan / 2));
  const livingScholarship = usd(Math.round((COST_2026_27.livingExpenses + COST_2026_27.books) / 2));
  return { tuition, healthPlan, livingScholarship, refund: livingScholarship - healthPlan };
}

/** Which year of the degree a student is in: the first until the second fall term begins. */
export function yearOfStudy(person: Person): number {
  const begun = person.school?.termsBegun ?? 0;
  return Math.max(1, Math.ceil(begun / 2));
}

function scheduleTerm(sim: Simulation, person: Person, term: number): void {
  if (term >= YALE_DRAMA.terms) return;
  sim.schedule({
    at: Math.max(atNine(termStart(term).date), sim.now + 60_000),
    kind: TERM_KIND, label: termName(term) + ' Begins', category: 'home', priority: 30,
    payload: { personId: person.id, term },
  });
}

/**
 * A new life enrolled: the class of 2029, arriving for the fall term, and the
 * award's first instalment due that morning.
 */
export function enroll(sim: Simulation, person: Person): void {
  person.school = { schoolId: YALE_DRAMA.id, classOf: TERM_STARTS_2026_27.fall.year + 3, termsBegun: 0 };
  scheduleTerm(sim, person, 0);
  if (person.id !== sim.universe.playerId) return;
  const orientation = (d: SchoolDate) => formatDate(instantFromZoned({ ...d, hour: 12 }, zone()), zone());
  sim.notify({
    category: 'money',
    title: 'Welcome To The Class Of ' + person.school.classOf,
    body: `You're one of the ${YALE_DRAMA.classSize} actors in the ${YALE_DRAMA.degree} in ${YALE_DRAMA.program} at the ${YALE_DRAMA.name}, and the one the faculty wanted most from this year's auditions. The school's award covers your whole cost of attendance, with nothing to borrow. The fall term begins with registration, then orientation until ${orientation(ORIENTATION_2026.ends)}, and classes from ${orientation(ORIENTATION_2026.classesBegin)} at 9 a.m.`,
    importance: 80, route: '/workspace/school',
  });
}

export function registerSchool(sim: Simulation): void {
  sim.onSchedule(TERM_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const school = person?.school;
    const term = Number(item.payload.term);
    if (!person || !school) return;
    school.termsBegun = term + 1;
    const current = person.primaryAccountId ? s.universe.accounts[person.primaryAccountId] : undefined;
    const account = termAccount(saveCurrency(s.universe));
    if (current && !current.closedAt && account.refund > 0) {
      s.post({
        memo: `Living-expense scholarship, ${termName(term).toLowerCase()}: ${YALE_DRAMA.name}`,
        category: 'scholarship',
        postings: [{ accountId: current.id, amount: account.refund }, { accountId: s.nominalAccount('income', 'Scholarship').id, amount: -account.refund }],
      });
    }
    if (person.id === s.universe.playerId) {
      const cur = saveCurrency(s.universe);
      s.notify({
        category: 'money',
        title: `${termName(term)} Begins`,
        body: `Your living-expense scholarship of ${formatMoney(account.livingScholarship, cur)} met this term's Yale Health plan, ${formatMoney(account.healthPlan, cur)}, and ${formatMoney(account.refund, cur)} is in your ${current?.name ?? 'account'}. Tuition, ${formatMoney(account.tuition, cur)} a term, is covered by the tuition scholarship.`,
        importance: 55, route: '/workspace/school',
      });
    }
    scheduleTerm(s, person, term + 1);
  });
}

