/**
 * SLATE — where Money, the School and Papers stand, said at the head of their own screens (from 2026-10-23, the owner's
 * brief 23: "Profile, Money, Papers, School and help: summary to detail").
 *
 * Until then these were Home's Your Affairs, a line each with a button to the screen, and the screens themselves opened
 * on their tabs. Your Affairs went from Home with that brief, Money, the School and Papers being on the menu, and the
 * lines came here, each under its screen's name: what you're worth, your place in the class and what's next, your cover
 * and what the returns ask. What needed doing in them is under What Needs You on Home too (`thingsToDo`), where it was
 * an alert under the line.
 */

import { ordinal } from '@/engine/core/text';
import { formatDateTime } from '@/engine/core/time';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import type { Simulation } from '@/engine/core/simulation';
import { netWorth } from '@/engine/systems/finance';
import { YALE_DRAMA } from '@/engine/content/school';
import { CITIES } from '@/engine/content/geography';
import { nextClasses, rankIn, schoolEnded } from '@/engine/systems/school';
import { coverLabel, coverOn } from '@/engine/systems/health';
import { latePenaltyAll, owedEverywhere, unassessedBalance } from '@/engine/systems/taxreturn';
import { openDecisions } from '@/engine/world/world';
import { useGame, useWorld } from '@/app/game-context';
import { Open, at } from '@/ui/looks';

/** A negative written with the minus sign, as Money writes an overdrawn balance (“−$3.30”), from 2026-10-17 (brief 14). */
const signed = (text: string) => text.replace(/(^|\()-/g, '$1−');

/**
 * What you're worth, everything held less everything owed, at the head of Money, its look a press away. With Your
 * Affairs' Money line it said the main account's name and balance first, which the head's sum and Accounts say here.
 */
export function WorthWords() {
  const { sim } = useGame();
  const worth = useWorld((s) => netWorth(s, s.player.id));
  const cur = saveCurrency(sim.universe);
  return (
    <>
      <Open subject={at('networth', sim.player.id)}>Worth {signed(formatMoney(worth.total, cur, { cents: false }))}</Open>
      {worth.liabilities > 0 ? `, after ${formatMoney(worth.liabilities, cur, { cents: false })} owed.` : '.'}
    </>
  );
}

/**
 * Your place in the class and the next thing the school has on the calendar, at the head of School, after the year and
 * the standing the head says already. Until 2026-09-26 Home's line said what scholarship the next term paid in, which a
 * family with means isn't paid. A troubled standing's alert stayed on Home (`thingsToDo`): here the head and Standing
 * And Craft under it say it.
 */
export function SchoolGlance() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school;
  if (!school) return null;
  const zone = CITIES.require(YALE_DRAMA.cityId).timeZone;
  const booked = sim.universe.scheduled
    .filter((item) => item.status === 'pending' && item.category === 'school' && item.requiresPlayer && item.payload.personId === person.id)
    .sort((x, y) => x.at - y.at)[0];
  // What the calendar holds, or past this week, the next classes, while there are classes to go to.
  const enrolled = !schoolEnded(school.standing);
  const classes = enrolled ? nextClasses(sim.now, school) : undefined;
  const next = enrolled ? booked ?? (classes !== undefined ? { label: 'Classes', at: classes } : undefined) : undefined;
  return (
    <p className="glance">
      You’re {ordinal(rankIn(person))} of {YALE_DRAMA.classSize} in the class.
      {next ? ` Next: ${next.label}, ${formatDateTime(next.at, zone)}.` : ''}
    </p>
  );
}

/** What taxes and cover ask, as Papers' head and Home's What Needs You say it. */
export interface PapersAlert { kind: 'cover' | 'return' | 'owed'; text: string; year?: number }

/**
 * Taxes and cover (`systems/health.ts`, `systems/taxreturn.ts`): no cover, a return open or late, tax owed. Your Affairs'
 * Papers line said these as its alert until 2026-10-23; Papers' head and Home's What Needs You say them now.
 */
export function papersAlerts(s: Simulation): PapersAlert[] {
  const person = s.player;
  const cur = saveCurrency(s.universe);
  const m = (cents: number) => formatMoney(cents, cur, { cents: false });
  // The open return with something to pay, the newest first, or the newest open. Until 2026-10-14 it was the first
  // open one by year, so a 2026 return owing nothing, Connecticut’s $3.35 taken by levy, was named on 1 February 2028
  // as “due April 15, 2027”, and the 2027 return’s $2,286 to pay wasn’t (found by that day’s third round of evidence).
  const opens = Object.values(person.returns ?? {}).filter((r) => r.filedAt === undefined).sort((a, b) => b.year - a.year);
  const open = opens.find((r) => unassessedBalance(person, r) > 0) ?? opens[0];
  // Past its day, the penalty filing now would add; filed and unpaid, what's owed and growing. Until 2026-09-27 neither showed.
  const penalty = open && open.figures.balance > 0 && s.now > open.due ? latePenaltyAll(person, open, s.now, cur) : 0;
  // What's owed today, its interest and late-payment penalty since it was last brought up to date (`owedOn`), as Papers
  // says it: until 2026-10-10 the line read the balance as last stored, short of both.
  const owedTax = owedEverywhere(person, s.now);
  // What filing it would pay: what no authority has assessed yet, a state's own assessment being in `owedTax` (from
  // 2026-10-11: until then it was in both).
  const toPay = open ? unassessedBalance(person, open) : 0;
  // Growing once something owed is past its return's due date, from which the IRS's interest and late-payment penalty
  // run (IRC 6601(a), 6651(a)(2)), and a state's too (`accrueState`, from the return's due date). Until 2026-10-13 the
  // alert said so from the day a return was filed early and left unpaid, when nothing grows (found by that day's
  // evidence pass).
  const growing = Object.values(person.returns ?? {}).some((r) => s.now > r.due
    && ((r.owed ?? 0) > 0 || Object.values(r.stateDue ?? {}).some((d) => (d.owed ?? 0) > 0)));
  const out: PapersAlert[] = [];
  if (!coverOn(person, s.now)) out.push({ kind: 'cover', text: 'You have no health cover.' });
  // Past its due date, as the penalty counts it, an open return “was due” on it: until 2026-10-14 it still “is due” a day gone.
  if (open) out.push({ kind: 'return', year: open.year, text: `The ${open.year} return ${s.now > open.due ? 'was' : 'is'} due ${formatDateTime(open.due, 'America/New_York').split(' at ')[0]}${toPay > 0 ? `, ${m(toPay + penalty)} to pay${penalty > 0 ? ', a late penalty in it' : ''}` : ''}.` });
  if (owedTax > 0) out.push({ kind: 'owed', text: `${m(owedTax)} of tax owed${growing ? ', with its interest and a late penalty growing each month' : ''}.` });
  return out;
}

/** Whether the return's own question is open (`Your 2026 Tax Return`, with File It), which says what its alert would. */
export const returnAsked = (s: Simulation, year: number) => openDecisions(s).some((d) => d.refType === 'return' && d.refId === String(year));

/** What covers you, a claim's weekly pay, and what taxes and cover ask, at the head of Papers. */
export function PapersGlance() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const alerts = useWorld(papersAlerts);
  const cur = saveCurrency(sim.universe);
  const claim = person.unemployment?.claim;
  return (
    <>
      <p className="glance">
        Cover: {coverLabel(person, sim.now) ?? 'none'}.
        {claim ? ` Unemployment, ${formatMoney(claim.weekly, cur, { cents: false })} a week.` : ''}
      </p>
      {alerts.length > 0 && <p className="glance glance-alert">{alerts.map((a) => a.text).join(' ')}</p>}
    </>
  );
}
