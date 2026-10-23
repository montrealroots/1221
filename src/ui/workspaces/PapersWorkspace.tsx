/**
 * SLATE — papers: the returns, health cover after school, unemployment
 * insurance, and since 2026-09-29 the passport and permission to work (`systems/taxreturn.ts`, `systems/health.ts`,
 * `systems/unemployment.ts`), in five tabs (`PAPERS_TABS`; until 2026-10-12 this said three). Every figure is one those
 * systems read or write: each year's return worked out line by line, what
 * covers them this month and what it costs, and a claim's weekly benefit and
 * what it has paid. Its Driving tab and Dublin's Housing Assistance went with the cars and the home in the
 * scope reset of 2026-10-09.
 */

import { useState } from 'react';
import { SECTIONS, tabKey } from '@/ui/shell/sections';
import { useKept } from '@/ui/kept';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine, WhyNot } from '@/ui/components/primitives';
import { Gated, useFeature } from '@/ui/guide/Guide';
import { HowItWorks } from '@/ui/guide/HowItWorks';
import { DOCTOR_KINDS, clinicById, clinicFor, clinicRefusal, clinicsIn } from '@/engine/systems/clinics';
import { outsideTheCover, practiceWait } from '@/engine/systems/appointments';
import type { Clinic } from '@/engine/content/clinics';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { dateKey, formatDate } from '@/engine/core/time';
import { LookRegion, Open, at } from '@/ui/looks';
import { CITIES } from '@/engine/content/geography';
import { ABROAD, BENCHMARK_SOURCE, BENEFIT_STATE, CALIFORNIA_MANDATE, CALIFORNIA_UI, CONNECTICUT_UI, CARE, CHARITY, CHRONIC, DENTAL_PLANS, DENTAL_VISION, INSULIN, PHARMACY, MEDICAL_DEBT, NEW_YORK_UI, PLANS_SOURCE, PREMIUM_CREDIT, PUBLIC_COVER, RETURN } from '@/engine/content/safetynet';
import { COLLECTION, PLAN, SUBSTITUTE, type Filed, type TaxReturn, amendRefusal, deadline, leastMonthly, nextIrsStep, nonresidentDeadline, nonresidentFor, owedAll, owedOn, owedToOf, partsOn, planFee, planRefusal, returnsOf, ukTaxOn } from '@/engine/systems/taxreturn';
import { SSN } from '@/engine/systems/taxid';
import { agencyOf, financialStatement, interestWords, nextStateStep, orderWords, owedToState, payLateWords, statePlanFee, rulesOf, statePartsOn, stateDueOf, stateOwedOn, statePlanRefusal } from '@/engine/systems/statetax';
import { FederalLien, StateLienAndPenalty } from '@/ui/components/LienPanels';
import { STATE_UNRESEARCHED } from '@/engine/content/statetax';
import { CONDITION_LABEL, DENIALS, PROGRAM_NAMES, type MedicalBill, benchmarkFor, coverLabel, coverOn, dentalPlanFor, grown, healthOf, mayEnroll, medicalDebtOf, aidRefusal, appealRefusal, planOf, prepayRefusal, type Condition, extraSupplyRefusal, fillsCharged, longestFillOf, type Chronic, careQuote, dentalYearOf, answerBy, applyRefusal, hardshipRefusal, lookBack, monthsWords } from '@/engine/systems/health';
import { THERAPY, sessionPrice, therapistsIn, therapyRefusal } from '@/engine/systems/therapy';
import { earningsOf, homeOf } from '@/engine/systems/earnings';
import { plural, readsAsProse, spokenList, titleCaseLabel } from '@/engine/core/text';
import { basePeriodFor, claimStateFor, studentUnavailable, unemploymentOf } from '@/engine/systems/unemployment';
import { f1Of, usWorkAuthorized } from '@/engine/systems/permission';
import { zonedParts } from '@/engine/core/time';
import { inSaveMoney } from '@/engine/systems/banking';
import { PassportPane, WorkPane } from '@/ui/papers/Documents';
import { creditRefusal, livesInBritain } from '@/engine/systems/universalcredit';
import { CDMX_DESEMPLEO, IRISH_JA, jobseekerRefusal, livesInIreland, livesInMexicoCity } from '@/engine/systems/homebenefits';
import { BC_ASSISTANCE, ONTARIO_WORKS, assistanceRefusal, ebtBalance, schemeFor, snapYearOn } from '@/engine/systems/assistance';
import { eiRefusal, eiWeekly } from '@/engine/systems/eiself';
import { US_PHARMACIES } from '@/engine/content/carevisits';
import { EI_SELF_EMPLOYED } from '@/engine/content/cabenefits';
import { SOCIAL_SECURITY, claimFactor, socialSecurityOf, socialSecurityRefusal } from '@/engine/systems/socialsecurity';
import { STATE_PENSION, qualifyingYears, statePensionAge, statePensionRefusal, weeklyPension } from '@/engine/systems/statepension';
import { BIENESTAR, IRISH_PENSION, bienestarRefusal, irishContributions, irishPensionRefusal, irishWeekly } from '@/engine/systems/homepensions';
import { IMSS, grownTo, imssRefusal, weeksNeeded } from '@/engine/systems/imss';
import { isoOfCountry } from '@/engine/systems/documents';
import { exchange } from '@/engine/content/currency';
import { TabBar } from '@/ui/components/TabBar';
import { PapersGlance } from '@/ui/components/Glance';

type PapersTab = 'returns' | 'health' | 'benefits' | 'passport' | 'work';

/** Its tabs, as the rail lists them too (`ui/shell/sections.ts`, from 2026-10-08). */
const PAPERS_TABS = SECTIONS['/workspace/papers'] as readonly { id: PapersTab; label: string }[];

/**
 * A filed return's life after filing (from 2026-10-10): what's owed in its parts and a payment of any part of it, every
 * payment and how it was split, the IRS's substitute and replacing it, and an amended return.
 */
/**
 * A year's balance by who it's owed to or due back from (from the integration pass of 2026-10-10): the IRS's line and
 * each state's, what's still owed to it and why, its payments and notices, and a part paid to it. Until then one
 * balance stood for all of them, and the IRS's rules ran on a state's tax.
 */
function WhoIsOwed({ year }: { year: number }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const r = returnsOf(person)[String(year)];
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  if (!r) return null;
  const to = owedToOf(person, r);
  const sides = Object.entries(r.stateDue ?? {});
  if (!sides.length && !Object.keys(to.states).length) return null;
  return (
    <div className="col gap-2">
      <div className="eyebrow">Who It’s Owed To</div>
      <div className="table-scroll">
        <table>
          <tbody>
            <tr><td>The IRS: federal income tax and Social Security and Medicare, minus federal tax withheld and the premium tax credit</td><td className="num mono">{to.irs >= 0 ? money(to.irs) : `${money(-to.irs)} back`}</td></tr>
            {Object.entries(to.states).map(([state, v]) => <tr key={state}><td>{agencyOf(state)}: {stateName(state)}’s tax{state === 'us-ny' ? ' and New York City’s' : state === 'us-in' && r.figures.local ? ' and Marion County’s' : ''}{state === 'us-ca' ? ', plus its penalty for having no health cover' : ''}, minus what was withheld for it{state === 'us-ct' ? ' and its premium assistance' : ''}</td><td className="num mono">{v >= 0 ? money(v) : `${money(-v)} back`}</td></tr>)}
          </tbody>
        </table>
      </div>
      {to.derived && <p className="xs dim" style={{ margin: 0 }}>Your withholding for the year was recorded as one total, so it’s split between the IRS and the state by the paychecks’ own tax tables. The split is estimated.</p>}
      {sides.map(([state, sd]) => {
        const rules = rulesOf(state);
        const p = sd.owed ? statePartsOn(sd, stateDueOf(r), sim.now) : undefined;
        const next = nextStateStep(sim, person, r, state);
        const value = Math.round(Number(amounts[state] ?? '') * 100);
        return (
          <div key={state} className="col gap-2">
            <div className="eyebrow">Owed To {agencyOf(state)}</div>
            {!rules && <p className="xs dim" style={{ margin: 0 }}>{STATE_UNRESEARCHED}</p>}
            {sd.migrated && <p className="xs dim" style={{ margin: 0 }}>{sd.migrated.how}.</p>}
            {sd.assessedBy && <p className="xs dim" style={{ margin: 0 }}>{sd.replacedAt !== undefined ? `${agencyOf(state)} assessed this year on ${formatDate(sd.assessedBy.at, sim.zone)}, with no return from you. Your own return replaced its assessment on ${formatDate(sd.replacedAt, sim.zone)}.` : `${agencyOf(state)} assessed this year on ${formatDate(sd.assessedBy.at, sim.zone)}, with no return from you. File your own return to replace its assessment.`}</p>}
            {p ? (
              <>
                <div className="grid grid-3">
                  <Stat label="Tax Unpaid" value={money(p.tax)} />
                  <Stat label="Penalties" value={money(p.penalty)} note={rules ? payLateWords(rules) : 'None added: the game doesn’t have this state’s rules'} />
                  <Stat label="Interest" value={money(p.interest)} note={rules ? interestWords(rules) : 'None added: the game doesn’t have this state’s rules'} />
                </div>
                {/* The latest notice, then what comes next and by when, from the schedule (from 2026-10-20, brief 17, section
                    8: until then only the latest, so a levy 30 days off was said only in its notice). */}
                {rules && ((sd.collection ?? 0) > 0 || next) && <p className="xs dim" style={{ margin: 0 }}>{(sd.collection ?? 0) === 0 ? '' : (sd.collection ?? 0) <= rules.notices.length ? `The latest notice: ${rules.notices[(sd.collection ?? 1) - 1]!.title}. ` : `${agencyOf(state)} has levied your bank account. `}{next ? `${nextWords(next, formatDate(next.at, sim.zone))} ` : ''}{rules.timingAssumed ? 'The time between its notices is estimated.' : ''}</p>}
                <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div className="field"><label htmlFor={`tax-pay-${state}-${year}`}>{`Pay ${stateName(state)} (Blank Pays It All)`}</label><input id={`tax-pay-${state}-${year}`} inputMode="decimal" value={amounts[state] ?? ''} onChange={(e) => setAmounts({ ...amounts, [state]: e.target.value })} placeholder={(stateOwedOn(sd, stateDueOf(r), sim.now) / 100).toFixed(2)} /></div>
                  <Gated feature="tax.pay_state" className="btn btn-sm" onClick={() => { const a = run<{ owed: number; tax: number; penalty: number; interest: number }>('tax.pay_state', amounts[state] ? { state, year, amount: value } : { state, year }); if (a.ok) { toast(a.value!.owed > 0 ? `Paid ${agencyOf(state)}: ${money(a.value!.tax)} to the tax, ${money(a.value!.penalty)} to penalties and ${money(a.value!.interest)} to interest. You still owe ${money(a.value!.owed)}.` : `Paid ${agencyOf(state)} in full.`, 'positive'); setAmounts({ ...amounts, [state]: '' }); } }}>Pay</Gated>
                  <HowItWorks help="tax.pay_state" />
                </div>
                {rules && <p className="xs dim" style={{ margin: 0 }}>{orderWords(rules)}</p>}
              </>
            ) : sd.refund ? <p className="small" style={{ margin: 0 }}>{sd.refundedAt !== undefined ? `${agencyOf(state)} refunded you ${money(sd.refund)} on ${formatDate(sd.refundedAt, sim.zone)}.` : `${agencyOf(state)} owes you a refund of ${money(sd.refund)}${sd.refundAt !== undefined ? `, due about ${formatDate(sd.refundAt, sim.zone)}` : ''}.`}</p> : sd.filedAt !== undefined ? <p className="small" style={{ margin: 0 }}>Nothing more is owed to {agencyOf(state)}.</p> : null}
            {(sd.payments ?? []).length > 0 && (
              <details className="small"><summary>{`Payments To ${agencyOf(state)}`}</summary>
                <ul style={{ margin: 0 }}>{sd.payments!.map((x, i) => <li key={i}>{formatDate(x.at, sim.zone)}: {money(x.amount)} {x.how === 'levy' ? 'taken by levy' : x.how === 'refund offset' ? 'kept from a refund' : x.how === 'plan' ? 'paid through the payment plan' : 'paid'}. {money(x.tax)} went to the tax, {money(x.penalty)} to penalties and {money(x.interest)} to interest.</li>)}</ul>
              </details>
            )}
            <StateLienAndPenalty year={year} state={state} />
          </div>
        );
      })}
    </div>
  );
}

/** What collection does next, said as Papers says it: its next notice by title, or a levy, and what stops it. */
function nextWords(next: { notice?: { title: string } }, day: string): string {
  return `Next, about ${day}: ${next.notice ? next.notice.title : 'a levy on your bank accounts'}, unless you pay it all or set up a payment plan first.`;
}

/**
 * What File It will do, said before it's pressed, as `tax.file` does it (from 2026-10-20, brief 17, section 8: until
 * then the return said what was owed and the payment came as a surprise): each side owed paid from the bank at once,
 * whole or not at all, and one the bank can't cover billed. A state that assessed the year itself takes the return in
 * its assessment's place and is paid nothing at filing (`reconsiderState`), so it isn't named.
 */
function FileItWords({ r }: { r: TaxReturn }) {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const to = owedToOf(person, r);
  const payees = [...(to.irs > 0 ? ['the IRS'] : []), ...Object.entries(to.states).filter(([state, v]) => v > 0 && !r.stateDue?.[state]?.assessedBy).map(([state]) => agencyOf(state))];
  if (!payees.length) return null;
  const late = sim.now > Math.min(r.due, stateDueOf(r));
  return (
    <p className="small" style={{ margin: 0 }}>
      {`File It sends the return in and pays ${spokenList(payees)} from your bank at once${late ? ', with the late penalties and interest since it was due' : ''}. ${payees.length > 1 ? 'Each is paid in full or not at all, and one your bank can’t cover is billed instead.' : 'If your bank can’t cover all of it, nothing is taken, and you’re sent a bill instead.'}`}
    </p>
  );
}

/**
 * What File It did, as the return's panel says it (from 2026-10-12): the IRS's refund and the day it arrives, or what a
 * reconsideration paid back at once; what the bank couldn't pay and where it shows; and a state's refund, on the state's
 * own day. Until 2026-10-12 the toast read the whole return's balance, the IRS's and every state's together, and said a
 * refund came back in 21 days, where the IRS's part could be owed and unpaid beside a state's refund, a 1040-NR filed
 * without a Social Security number waits seven weeks more, and a reconsidered substitute pays back on the day.
 */
function filedWords(a: Filed, money: (c: number) => string, zone: string): string {
  const reconsidered = a.refunded !== undefined;
  const said: string[] = [];
  if (reconsidered) said.push(a.refunded ? `The IRS reconsidered its assessment using your return, and refunded the ${money(a.refunded)} you’d paid beyond your return’s tax.` : 'The IRS reconsidered its assessment using your return.');
  else if (a.irs < 0 && a.refundAt !== undefined) said.push(`Your IRS refund of ${money(-a.irs)} arrives ${formatDate(a.refundAt, zone)}.`);
  const where = Object.keys(a.states).length ? 'Who It’s Owed To' : 'Owed To The IRS';
  if (!a.paid) said.push(reconsidered ? `What you still owe is under ${where}.` : `Your bank couldn’t pay all of it. What you still owe is under ${where}.`);
  if (Object.values(a.states).some((v) => v < 0)) said.push('A state refund comes on that state’s own schedule, under Who It’s Owed To.');
  if (said.length) return `Filed. ${said.join(' ')}`;
  return a.irs > 0 || Object.values(a.states).some((v) => v > 0) ? 'Filed and paid.' : 'Filed. You owe nothing, and nothing is due back.';
}

/**
 * What an amended return changes: more tax, less, or no change in the total, with each side that moved (from
 * 2026-10-12: until then a change of nothing read as less tax). The total is the sides' sum where they're kept, since
 * the IRS's processing keeps its own change as `change`: until 2026-10-12 a processed line read that as the total. An
 * amendment from before the split keeps only its total.
 */
function amendWords(a: { change: number; irs?: number; states?: Record<string, number> }, money: (c: number) => string): string {
  const total = a.irs === undefined ? a.change : a.irs + Object.values(a.states ?? {}).reduce((s, v) => s + v, 0);
  if (total > 0) return `${money(total)} more tax`;
  if (total < 0) return `${money(-total)} less tax`;
  const moved: [string, number][] = [...(a.irs ? [['the IRS’s part', a.irs] as [string, number]] : []), ...Object.entries(a.states ?? {}).map(([st, d]) => [`${stateName(st)}’s`, d] as [string, number])];
  return `no change in the total${moved.length ? `: ${moved.map(([who, d]) => `${who} ${d > 0 ? 'up' : 'down'} ${money(Math.abs(d))}`).join(', ')}` : ''}`;
}

/** A state's own payment plan, every year owed to it together (`tax.apply_state_plan`, from the integration pass of 2026-10-10). */
function StatePlanPanel({ state }: { state: string }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const rules = rulesOf(state);
  const [months, setMonths] = useState(String(rules?.plan.maxMonths ?? 12));
  const [long, setLong] = useState(false);
  const [down, setDown] = useState('');
  const plan = person.statePlans?.[state];
  const owed = owedToState(person, state, sim.now);
  if (!rules || (owed <= 0 && !plan)) return null;
  const live = plan && ['pending', 'active', 'missed'].includes(plan.status);
  const dp = rules.plan.downPayment;
  // A required share is filled in; an offered one is the player's to put in (from 2026-10-11).
  const suggested = dp?.share ? Math.round(dp.share * owed) : 0;
  const downCents = down === '' ? (dp?.required ? suggested : 0) : Math.round(Number(down) * 100);
  const lp = rules.plan.long;
  const longest = long && lp ? lp.maxMonths : rules.plan.maxMonths;
  const no = statePlanRefusal(sim, person, state, Number(months), { long, down: downCents });
  const statement = long && lp?.statement ? financialStatement(sim, person) : undefined;
  // With the fee where the state adds it to what you owe, as the plan's own monthly payment has it (`tax.apply_state_plan`).
  // Until 2026-10-20 (brief 16) the estimate left the fee out, and said less than the plan then took.
  const feeAdded = rules.plan.feeAdded ? statePlanFee(person, rules, cur) : 0;
  const monthly = Math.ceil(Math.max(0, owed - downCents + feeAdded) / Math.max(1, Number(months)));
  const lien = rules.lien && ((long && lp?.lien) || (rules.lien.plan && ((rules.lien.plan.monthsOver !== undefined && Number(months) > rules.lien.plan.monthsOver) || (rules.lien.plan.over !== undefined && owed > rules.lien.plan.over))));
  const STATUS: Record<string, string> = { pending: 'Being decided', active: 'In force', missed: 'A payment missed', ended: 'Ended', paid: 'Paid in full', declined: 'Declined' };
  const missed = plan ? [...plan.history].reverse().find((h) => h.what.startsWith('A payment missed')) : undefined;
  return (
    <Panel title={`${rules.short} ${plan?.long?.name ?? rules.plan.name}`} subtitle={plan ? STATUS[plan.status] : `${money(owed)} owed`} help="taxes.plan">
      <div className="col gap-3">
        {plan && (
          <div className="grid grid-3">
            <Stat label="Covers" value={money(plan.covers)} note={plan.down ? `After a ${money(plan.down)} down payment` : undefined} />
            <Stat label="Each Month" value={money(plan.monthly)} note={plural(plan.months, 'month')} />
            {/* A plan being decided gives its day under Answered By, as the IRS's does (from 2026-10-19, brief 15: until then
                Next Payment read "Decided …"). */}
            <Stat label={plan.status === 'missed' ? 'Catch Up By' : plan.status === 'pending' ? 'Answered By' : 'Next Payment'} value={plan.status === 'missed' && plan.endsBy !== undefined ? formatDate(plan.endsBy, sim.zone) : plan.nextDue !== undefined && plan.status === 'active' ? formatDate(plan.nextDue, sim.zone) : plan.status === 'pending' ? formatDate(plan.decideAt, sim.zone) : '—'} />
          </div>
        )}
        {plan?.why && <p className="small" style={{ margin: 0 }}>{plan.why}.</p>}
        {/* A payment missed: what, what to press and by when, from the plan's own record (from 2026-10-20, brief 17,
            section 8: until then only Catch Up By's date and the button). */}
        {plan?.status === 'missed' && plan.endsBy !== undefined && missed && <p className="small" style={{ margin: 0 }}>{`Your bank couldn’t pay the plan’s ${money(missed.amount ?? 0)} on ${formatDate(missed.at, sim.zone)}. Press Catch Up to pay it from your bank by ${formatDate(plan.endsBy, sim.zone)}, or the plan ends and collection starts again.`}</p>}
        {plan?.long?.statement && <p className="xs dim" style={{ margin: 0 }}>The financial statement you applied with: {money(plan.long.statement.income)} a month coming in, {money(plan.long.statement.expenses)} going out and {money(plan.long.statement.net)} left over, with {money(plan.long.statement.cash)} in the bank.</p>}
        {plan?.status === 'missed' && <div><Gated feature="tax.catch_up_state_plan" className="btn btn-sm" onClick={() => { const a = run<{ paid: number }>('tax.catch_up_state_plan', { state }); if (a.ok) toast(`Caught up: ${money(a.value!.paid)} paid. The plan is back in force.`, 'positive'); }}>Catch Up</Gated></div>}
        {(!live || (lp?.alreadyOnPlan && plan?.status === 'active' && !plan.long)) && owed > 0 && (
          <div className="col gap-2">
            {/* What the plan does for you, what it costs and what a missed payment does, each its own paragraph before Apply
                For The Plan, and what isn't published under Sources And Estimates below (from 2026-10-20, brief 16,
                section 7). Until then one paragraph, six sentences for Connecticut and twelve for Louisiana, which also
                said a missed payment's rule wasn't published for every state whose plan ends at once, where Arizona's,
                Louisiana's, New Mexico's and the District's publish it (`cureAssumed`). */}
            <p className="small" style={{ margin: 0 }}>
              {rules.short}’s own payment plan spreads what you owe it over {rules.plan.minMonths} to {rules.plan.maxMonths} months{rules.plan.tiers ? ` (${rules.plan.tiers.map((t) => `up to ${t.maxMonths} months for ${t.upTo !== undefined ? `${money(t.upTo)} or less` : 'any amount'}`).join(', ')})` : ''}{rules.plan.minMonthly !== undefined ? `, at least ${money(rules.plan.minMonthly)} a month` : ''}, and collection stops while it’s in force. It covers {rules.plan.max !== undefined ? `up to ${money(rules.plan.max)}` : 'any amount (no limit is published)'}{rules.plan.min !== undefined ? `, for a balance over ${money(rules.plan.min)}` : ''}, and it’s separate from any plan with the IRS.{rules.plan.beyond ? ` ${rules.plan.beyond}` : ''}
            </p>
            <p className="small" style={{ margin: 0 }}>
              {rules.plan.fee ? (statePlanFee(person, rules, cur) ? `A ${money(statePlanFee(person, rules, cur))} fee is added to what you owe.` : 'Its fee is waived at your income.') : 'There’s no fee.'} Interest {rules.payLate.monthly ? 'and the late-payment penalty keep' : 'keeps'} adding up while the plan runs.{dp ? ` ${dp.why}` : ''}
            </p>
            <p className="small" style={{ margin: 0 }}>
              {rules.plan.cure.kind === 'next-due' ? 'If you miss a payment, press Catch Up by the next due date, or the plan ends and collection starts again.' : rules.plan.cure.kind === 'notice' ? `If you miss a payment, ${rules.short} sends an Intent to Terminate, and you have ${rules.plan.cure.days} days to press Catch Up before the plan ends and collection starts again.` : 'If you miss a payment, the plan ends and collection starts again.'}{rules.plan.newBalance === 'default' ? ' A new balance owed while the plan is in force counts as a missed payment.' : ''}
            </p>
            {lp && <p className="small" style={{ margin: 0 }}>For longer, there’s its {lp.name.toLowerCase()}, up to {lp.maxMonths} months{lp.maxAssumed ? ' (the longest term is estimated)' : ''}. {lp.how}</p>}
            <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {lp && <label className="check" htmlFor={`state-plan-long-${state}`}><input id={`state-plan-long-${state}`} type="checkbox" checked={long} onChange={(e) => setLong(e.target.checked)} /><span>{`Ask For Its ${lp.name}`}</span></label>}
              <div className="field" style={{ flex: '0 0 auto' }}><label htmlFor={`state-plan-${state}`}>Pay Over</label><select id={`state-plan-${state}`} style={{ width: 'auto' }} value={months} onChange={(e) => setMonths(e.target.value)}>
                {Array.from({ length: longest - rules.plan.minMonths + 1 }, (_, i) => rules.plan.minMonths + i).filter((m) => m <= 12 || m % 6 === 0).map((m) => <option key={m} value={m}>{plural(m, 'Month')}</option>)}
              </select></div>
              {dp && <div className="field" style={{ flex: '0 0 auto' }}><label htmlFor={`state-plan-down-${state}`}>{dp.required ? 'Down Payment (Required)' : 'Down Payment (Optional)'}</label><input id={`state-plan-down-${state}`} inputMode="decimal" value={down} onChange={(e) => setDown(e.target.value)} placeholder={((dp.required ? suggested : 0) / 100).toFixed(2)} /></div>}
              <Gated feature="tax.apply_state_plan" className="btn btn-sm" disabled={Boolean(no)} onClick={() => { const a = run<{ decideAt: number; monthly: number; down: number }>('tax.apply_state_plan', { state, months: Number(months), long, down: downCents }); if (a.ok) { toast(`Applied${a.value!.down ? ` with ${money(a.value!.down)} down` : ''}: ${money(a.value!.monthly)} a month. ${rules.short} decides by ${formatDate(a.value!.decideAt, sim.zone)}.`, 'positive'); setDown(''); } }}>{long && lp ? `Apply For The ${lp.name}` : 'Apply For The Plan'}</Gated>
            </div>
            <p className="xs dim" style={{ margin: 0 }}>{`That’s about ${money(monthly)} a month over ${plural(Number(months), 'month')}.`}{lien ? ` With this plan, ${rules.short} also files a ${rules.lien!.name}.` : ''}</p>
            {statement && <p className="xs dim" style={{ margin: 0 }}>{`${lp!.statement} asks for a financial statement. From your own records over the last three months: ${money(statement.income)} a month coming in, ${money(statement.expenses)} going out and ${money(statement.net)} left over, with ${money(statement.cash)} in the bank.`}{monthly > Math.max(0, statement.net) ? ` At ${money(monthly)} a month it would be declined, because that’s more than the statement leaves over.` : ''}</p>}
            {no && <span className="xs dim why-not">{no}</span>}
          </div>
        )}
        {plan && plan.history.length > 0 && (
          <details className="small"><summary>The Plan’s History</summary>
            <ul style={{ margin: 0 }}>{plan.history.map((h, i) => <li key={i}>{formatDate(h.at, sim.zone)}: {h.what}{h.amount !== undefined ? `, ${money(h.amount)}` : ''}.</li>)}</ul>
          </details>
        )}
        <Fine>{rules.plan.monthsAssumed ? 'The plan’s longest term isn’t published, so it’s estimated. ' : ''}{rules.plan.cure.kind === 'none' && rules.plan.cureAssumed ? `${rules.short} doesn’t publish what happens after a missed payment, so in the game the plan ends. ` : ''}Source: {rules.source}.</Fine>
      </div>
    </Panel>
  );
}

function ReturnLife({ year }: { year: number }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const r = returnsOf(person)[String(year)];
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const [amount, setAmount] = useState('');
  const [amending, setAmending] = useState(false);
  if (!r) return null;
  // Unfiled, but a state has assessed it itself (`assessStateNonFiler`, from 2026-10-11): who it's owed to, and the
  // state's balance to pay, before their own is filed. Until then nothing of an unfiled return's showed here.
  if (r.filedAt === undefined) return Object.values(r.stateDue ?? {}).some((sd) => sd.filedAt !== undefined) ? <WhoIsOwed year={year} /> : null;
  const parts = r.owed ? partsOn(r, sim.now) : undefined;
  const irsNext = nextIrsStep(sim, person, r);
  const amendNo = amendRefusal(sim, r);
  const value = Math.round(Number(amount) * 100);
  return (
    <div className="col gap-2">
      {r.substitute && <p className="small" style={{ margin: 0 }}>The IRS filed this return for you from what your employers and banks reported{r.substituteFigures ? `. It assessed ${money(r.substituteFigures.balance)} of tax, without the credits only your own return can claim` : ''}. If you file your own, the IRS reconsiders: the tax becomes what your return says, the penalty and interest fall in proportion, and anything you paid beyond that comes back to you.</p>}
      {r.reconsideredAt !== undefined && <p className="small" style={{ margin: 0 }}>Your own return replaced the IRS’s on {formatDate(r.reconsideredAt, sim.zone)}.</p>}
      <WhoIsOwed year={year} />
      <FederalLien year={year} />
      {r.split && <p className="xs dim" style={{ margin: 0 }}>{r.split.how}. This split is estimated, because payments made before then weren’t recorded by who they went to.</p>}
      {parts && <div className="eyebrow">Owed To The IRS</div>}
      {parts && (
        <div className="col gap-2">
          <div className="grid grid-3">
            <Stat label="Tax Unpaid" value={money(parts.tax)} />
            <Stat label="Penalties" value={money(parts.penalty)} note={r.reducedFrom !== undefined && r.reducedTo === undefined ? `${PLAN.reducedRate * 100}% for each month that begins under the payment plan, up to ${RETURN.lateCap * 100}%` : `${RETURN.payLateMonthly * 100}% a month on the unpaid tax, up to ${RETURN.lateCap * 100}%`} />
            <Stat label="Interest" value={money(parts.interest)} note={`${Math.round(COLLECTION.interest * 1000) / 10}% a year, compounded daily`} />
          </div>
          <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field"><label htmlFor={`tax-pay-${year}`}>Pay (Blank Pays It All)</label><input id={`tax-pay-${year}`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={(owedOn(r, sim.now) / 100).toFixed(2)} /></div>
            <Gated feature="tax.pay" className="btn btn-sm" onClick={() => { const a = run<{ owed: number; tax: number; penalty: number; interest: number }>('tax.pay', amount ? { year, amount: value } : { year }); if (a.ok) { toast(a.value!.owed > 0 ? `Paid the IRS: ${money(a.value!.tax)} to the tax, ${money(a.value!.penalty)} to penalties and ${money(a.value!.interest)} to interest. You still owe ${money(a.value!.owed)}.` : 'Paid the IRS in full.', 'positive'); setAmount(''); } }}>Pay</Gated>
            <HowItWorks help="tax.pay" />
          </div>
          <p className="xs dim" style={{ margin: 0 }}>When you don’t choose, the IRS puts a partial payment toward the tax first, then penalties, then interest. Paying down the tax also lowers the monthly penalty still to come.</p>
          {/* The IRS's latest notice and what it sends next, by when, as the state's line has it (from 2026-10-20, brief 17,
              section 8: until then Papers said nothing of the IRS's letters). */}
          {((r.collection ?? 0) > 0 || irsNext) && <p className="xs dim" style={{ margin: 0 }}>{(r.collection ?? 0) === 0 ? '' : (r.collection ?? 0) <= COLLECTION.notices.length ? `The latest notice: ${COLLECTION.notices[(r.collection ?? 1) - 1]!.title}. ` : 'The IRS has levied your bank accounts. '}{irsNext ? nextWords(irsNext, formatDate(irsNext.at, sim.zone)) : ''}</p>}
        </div>
      )}
      {/* An offset reads “from a refund”, as a state's list has it: another year's refund kept for this one is an offset
          too (from 2026-10-12; until then every one here read “from an amended return's refund”). */}
      {(r.payments ?? []).length > 0 && (
        <details className="small"><summary>Payments On The Year</summary>
          <ul style={{ margin: 0 }}>{r.payments!.map((p, i) => <li key={i}>{formatDate(p.at, sim.zone)}: {money(p.amount)} {p.how === 'levy' ? 'taken by levy' : p.how === 'refund offset' ? 'kept from a refund' : 'paid'}. {money(p.tax)} went to the tax, {money(p.penalty)} to penalties and {money(p.interest)} to interest.</li>)}</ul>
        </details>
      )}
      {(r.amended ?? []).map((a, i) => (
        <p key={i} className="small" style={{ margin: 0 }}>Form {a.form}, filed {formatDate(a.at, sim.zone)}: {amendWords(a, money)}. {a.processedAt ? `Processed ${formatDate(a.processedAt, sim.zone)}${a.refund ? `: ${money(a.refund + (a.interest ?? 0))} refunded, with interest` : a.interest ? `, with ${money(a.interest)} of interest` : ''}.` : `The IRS takes eight to twelve weeks to process it, so about ${formatDate(a.processAt, sim.zone)} (estimated).`}</p>
      ))}
      {!r.substitute && (
        <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          {!amending
            ? <button type="button" className="btn btn-sm btn-ghost" disabled={Boolean(amendNo)} title={amendNo} onClick={() => setAmending(true)}>Amend The Return…</button>
            : <>
                <span className="small">An amended return works out the year again from what’s on record now. If you owe more, it’s added with interest from the original due date. If you owe less, it comes off what you owe, and anything left over is refunded with interest.</span>
                <Gated feature="tax.amend" className="btn btn-sm" onClick={() => { const a = run<{ change: number; processAt: number; form: string; irs: number; states?: Record<string, number> }>('tax.amend', { year }); if (a.ok) toast(`Form ${a.value!.form} filed: ${amendWords(a.value!, money)}. The IRS should process it about ${formatDate(a.value!.processAt, sim.zone)}.`, 'positive'); setAmending(false); }}>File The Amendment</Gated>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAmending(false)}>Not Now</button>
              </>}
          {amendNo && <span className="xs dim">{amendNo}</span>}
        </div>
      )}
    </div>
  );
}

const PLAN_STATUS: Record<string, string> = { pending: 'Being decided', active: 'In force', default: 'A payment missed', ended: 'Ended', paid: 'Paid in full', refused: 'Declined' };

/**
 * An IRS payment plan (from 2026-10-10, `tax.apply_plan`): applied for across every year owed, its fee, its monthly
 * payment or its 180 days, a missed payment's CP523 and catching up, and a revision when a new balance is too large to
 * join it. Shown while anything is owed or a plan has a history.
 */
function TaxPlanPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const [kind, setKind] = useState<'long' | 'short'>('long');
  const [monthly, setMonthly] = useState('');
  const [debit, setDebit] = useState(true);
  const [revised, setRevised] = useState('');
  const plan = person.taxPlan;
  const owed = owedAll(person, sim.now);
  if (owed <= 0 && !plan) return null;
  const live = plan && ['pending', 'active', 'default'].includes(plan.status);
  const no = planRefusal(sim, person, kind);
  const least = leastMonthly(owed);
  const asked = monthly ? Math.round(Number(monthly) * 100) : undefined;
  const missed = plan ? [...plan.history].reverse().find((h) => h.what.startsWith('A payment missed') || h.what.startsWith('New tax beyond')) : undefined;
  return (
    <Panel title="IRS Payment Plan" subtitle={plan ? PLAN_STATUS[plan.status] : `${money(owed)} owed`} help="taxes.plan">
      <div className="col gap-3">
        {plan && (
          <div className="grid grid-3">
            <Stat label="Covers" value={money(plan.covers)} note={plan.years.join(', ')} />
            <Stat label={plan.kind === 'long' ? 'Each Month' : 'Paid By'} value={plan.kind === 'long' ? money(plan.monthly ?? 0) : plan.payBy !== undefined ? formatDate(plan.payBy, sim.zone) : '—'} note={plan.directDebit ? 'By direct debit' : 'Not by direct debit'} />
            <Stat label={plan.status === 'pending' ? 'Answered By' : plan.status === 'default' ? 'Catch Up By' : 'Next Payment'} value={plan.status === 'pending' ? formatDate(plan.decideAt, sim.zone) : plan.status === 'default' && plan.defaultBy !== undefined ? formatDate(plan.defaultBy, sim.zone) : plan.nextDue !== undefined && plan.status === 'active' ? formatDate(plan.nextDue, sim.zone) : '—'} />
          </div>
        )}
        {plan?.why && <p className="small" style={{ margin: 0 }}>{plan.why}</p>}
        {/* Behind: what happened, what to press and by when, from the plan's own record (from 2026-10-20, brief 17, section
            8: until then only Catch Up By's date and the button, and the notice said the rest). */}
        {plan?.status === 'default' && plan.defaultBy !== undefined && missed && <p className="small" style={{ margin: 0 }}>{missed.what.startsWith('New tax')
          ? `New tax of ${money(missed.amount ?? 0)} is more than two of the plan’s monthly payments, so it can’t simply join the plan. Press Revise The Plan by ${formatDate(plan.defaultBy, sim.zone)}, or the plan ends and collection starts again.`
          : `Your bank couldn’t pay the plan’s ${money(missed.amount ?? 0)} on ${formatDate(missed.at, sim.zone)}. Press Catch Up to pay it from your bank. If it isn’t paid by ${formatDate(plan.defaultBy, sim.zone)}, the plan ends and collection starts again.`}</p>}
        {plan?.status === 'default' && (
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <Gated feature="tax.catch_up_plan" className="btn btn-sm" onClick={() => { const a = run<{ paid: number }>('tax.catch_up_plan', {}); if (a.ok) toast(`Caught up: ${money(a.value!.paid)} paid.`, 'positive'); }}>Catch Up</Gated>
          </div>
        )}
        {live && plan!.kind === 'long' && plan!.status !== 'pending' && (
          <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field"><label htmlFor="plan-revise">{`New Monthly Payment (${cur})`}</label><input id="plan-revise" inputMode="decimal" value={revised} onChange={(e) => setRevised(e.target.value)} placeholder={(leastMonthly(owed) / 100).toFixed(2)} /></div>
            <Gated feature="tax.revise_plan" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ monthly: number; fee: number }>('tax.revise_plan', revised ? { monthly: Math.round(Number(revised) * 100) } : {}); if (a.ok) { toast(`Revised to ${money(a.value!.monthly)} a month, for a fee of ${money(a.value!.fee)}.`, 'positive'); setRevised(''); } }}>Revise The Plan</Gated>
          </div>
        )}
        {/* What a revision takes in and costs, before it's pressed, as `tax.revise_plan` charges it (from 2026-10-20, brief
            17, section 8: until then the fee came only in the toast after it). */}
        {live && plan!.kind === 'long' && plan!.status !== 'pending' && <p className="xs dim" style={{ margin: 0 }}>{`Revise The Plan puts everything you owe the IRS now into the plan at the new monthly payment, for a ${money(inSaveMoney(sim, PLAN.reviseFee, 'USD'))} fee. Left blank, the payment is the lowest the IRS takes, ${money(leastMonthly(owed))}.`}</p>}
        {!live && owed > 0 && (
          <div className="col gap-2">
            {/* What the plan does for you and how it's decided, what it costs, then what a missed payment does, and the
                lowest payment's estimate under Sources And Estimates (from 2026-10-20, brief 16, section 7). Brief 15 made
                one paragraph of about 120 words two, and the second still held six rules; it said a monthly plan had a
                setup fee where a low income's by direct debit is $0 (`PLAN.fee`), and nothing of the interest a plan
                leaves running. */}
            <p className="small" style={{ margin: 0 }}>
              One IRS plan covers what you owe the IRS for every year, and collection stops while it’s in force. It’s for federal tax only: a state has its own plan for what you owe it. With a Social Security number you apply online and the IRS answers within a minute; without one, your application goes by mail and the answer takes {PLAN.mailDays} days.
            </p>
            <p className="small" style={{ margin: 0 }}>
              A short-term plan gives you {PLAN.shortDays} days to pay, with no fee. A monthly plan for up to {money(PLAN.longMax)} has a setup fee that depends on your income and on paying by direct debit. Interest keeps adding up under either. If you filed the return on time, each month of late-payment penalty that begins under a plan is {PLAN.reducedRate * 100}% instead of {RETURN.payLateMonthly * 100}%.
            </p>
            <p className="small" style={{ margin: 0 }}>
              If you miss a payment, the IRS sends Notice CP523, and you have {PLAN.defaultDays} days to press Catch Up before the plan ends and collection starts again.
            </p>
            <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="field" style={{ flex: '0 0 auto' }}><label htmlFor="plan-kind">Plan Type</label><select id="plan-kind" style={{ width: 'auto' }} value={kind} onChange={(e) => setKind(e.target.value as 'long' | 'short')}>
                <option value="long">Monthly Payments</option>
                <option value="short">Paid Within {PLAN.shortDays} Days</option>
              </select></div>
              {kind === 'long' && <div className="field"><label htmlFor="plan-monthly">{`Each Month (${cur})`}</label><input id="plan-monthly" inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder={(least / 100).toFixed(2)} /></div>}
              {kind === 'long' && <label className="row gap-1 small"><input type="checkbox" checked={debit} onChange={(e) => setDebit(e.target.checked)} /> By Direct Debit</label>}
              <Gated feature="tax.apply_plan" className="btn btn-sm" disabled={Boolean(no)} onClick={() => { const a = run<{ status: string; decideAt: number; fee: number }>('tax.apply_plan', { kind, ...(kind === 'long' ? { directDebit: debit, ...(asked ? { monthly: asked } : {}) } : {}) }); if (a.ok) { toast(`Applied. The IRS answers by ${formatDate(a.value!.decideAt, sim.zone)}${a.value!.fee ? `, and the setup fee is ${money(a.value!.fee)}` : ''}.`, 'positive'); setMonthly(''); } }}>Apply</Gated>
            </div>
            {no ? <span className="xs dim">{no}</span> : kind === 'long' && <span className="xs dim">Setup fee: {money(planFee(sim, person, 'long', debit))}.</span>}
          </div>
        )}
        {plan && plan.history.length > 0 && (
          <details className="small"><summary>The Plan’s History</summary>
            <ul style={{ margin: 0 }}>{plan.history.map((h, i) => <li key={i}>{formatDate(h.at, sim.zone)}: {h.what}{h.amount !== undefined ? `, ${money(h.amount)}` : ''}.</li>)}</ul>
          </details>
        )}
        <Fine>The lowest monthly payment shown, what you owe spread over {PLAN.leastMonths} months, is estimated. Source: {PLAN.source}.</Fine>
      </div>
    </Panel>
  );
}

export function PapersWorkspace() {
  const [tab, setTab] = useKept<PapersTab>(tabKey('/workspace/papers'), 'returns');
  const panes: Record<PapersTab, JSX.Element> = { returns: <ReturnsPane />, health: <HealthPane />, benefits: <BenefitsPane />, passport: <PassportPane />, work: <WorkPane /> };
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Affairs</div>
        <h1>Papers</h1>
        <p className="muted">Your tax returns, health cover, benefits and pensions, passport and ID, and permission to work.</p>
        <PapersGlance />
      </div>
      {/* The shared tab bar from 2026-10-23 (`components/TabBar.tsx`); until then its own copy here. */}
      <TabBar tabs={PAPERS_TABS} tab={tab} onTab={setTab} label="Papers" idPrefix="papers" />
      <div role="tabpanel" id={`papers-pane-${tab}`} aria-labelledby={`papers-tab-${tab}`} tabIndex={0}>
        {panes[tab]}
      </div>
    </>
  );
}

/** Each year's return, line by line, and filing and paying it. */
function ReturnsPane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const returns = Object.values(returnsOf(person)).sort((a, b) => b.year - a.year);
  const thisYear = zonedParts(sim.now, sim.zone).year;
  // A nonresident's return with no wages on it is due 15 June (`nonresidentDeadline`): from 2026-10-12 No Returns Yet
  // and the fine print say so, where until then both gave 15 April alone.
  const nonresident = nonresidentFor(person, thisYear);
  // The UK's own tax years, each settled with its return the 31 January after
  // it; until 2026-09-27 only their sum showed, as a credit on the US return.
  const record = earningsOf(person);
  const ukYears = Object.entries(record.ukYears ?? {}).sort(([a], [b]) => Number(b) - Number(a));
  const treaty = inSaveMoney(sim, ABROAD.uk.treatyUsd, 'USD');
  return (
    <div className="col gap-5">
      {returns.length === 0 && (
        <Panel title="No Returns Yet" help="taxes.return">
          <LookRegion>
            <p className="small" style={{ margin: 0 }}>
              {/* The F-1's rule said to an F-1 life alone (from 2026-10-20, brief 17: until then to every life). */}
              Each February, last year’s return is ready here if you owe tax, are due a refund, or had income over the standard deduction.{f1Of(person) ? ' On an F-1, you have one every year.' : ''} The return for {thisYear} is due <Open subject={at('day', dateKey(deadline(thisYear), sim.homeZone))}>{formatDate(deadline(thisYear), sim.zone)}</Open>{nonresident ? <>, or <Open subject={at('day', dateKey(nonresidentDeadline(thisYear, false), sim.homeZone))}>{formatDate(nonresidentDeadline(thisYear, false), sim.zone)}</Open> for a 1040-NR with no wages on it</> : null}.
            </p>
          </LookRegion>
        </Panel>
      )}
      <TaxPlanPanel />
      {[...new Set(returns.flatMap((r) => Object.keys(r.stateDue ?? {})))].map((state) => <StatePlanPanel key={state} state={state} />)}
      {returns.map((r) => {
        const f = r.figures;
        const lines: [string, number][] = [
          ['Acting Wages, With Residuals', f.acting],
          ['Work-Study Wages', f.workStudy],
          ['Scholarship For Living Costs', f.scholarship ?? 0],
          ['Unemployment Insurance', f.unemployment],
          ['Interest', f.interest ?? 0],
          ['Pension', f.pension ?? 0],
          ['Rent, Less Its Costs And Depreciation', f.rental ?? 0],
          ['A Home’s Gain Held A Year Or Less', f.gainShort ?? 0],
          ['A Home’s Long-Term Gain', f.gainLong ?? 0],
          ['Home Sale Gain Excluded From Tax', f.gainExcluded ?? 0],
          ['Performing Artist Deduction', -f.deduction],
          ['Itemized: Mortgage Interest, Taxes And Mortgage Insurance', -(f.itemized ?? 0)],
          ['Part Of The Federal Tax: On Gains And Investment Income', f.gainTax ?? 0],
          ['Federal Income Tax', f.federal],
          ['Credit For Tax Paid To Another Country', -(f.foreignCredit ?? 0)],
          ['Canadian Tax Refunded, By Treaty Or Canadian Return', -(f.foreignRefund ?? 0)],
          ...(f.states ?? []).flatMap((l) => [[`${stateName(l.state)} Income Tax`, l.tax], ...(l.credit ? [[`${stateName(l.state)}’s Credit For Tax Paid To Another State`, -l.credit]] : [])] as [string, number][]),
          ['City And County Income Tax', f.local ?? 0],
          ['Income Tax In All', f.incomeTax],
          ['Social Security And Medicare', f.payroll],
          ['California’s Penalty For No Cover', f.mandate],
          ['Premium Tax Credit', -f.credit],
          ['Connecticut’s Premium Assistance', -(f.stateAssistance ?? 0)],
          ['Withheld From Your Pay And Pension', -f.withheld],
          // Shown, not owed: the employer withholds and remits it, and nobody files it (from 2026-10-11).
          ['Denver Occupational Privilege Tax, Withheld And Remitted By The Employer', f.denverOpt ?? 0],
        ];
        // A 1040-NR with no wages is the IRS’s in June, its state part still April’s (`stateDueOf`): said beside it from
        // 2026-10-15, when until then only “Due June 15” was, and Connecticut’s bill came 30 days after April 15.
        return (
          <Panel
            key={r.year}
            title={`${r.year} Return`}
            subtitle={r.filedAt !== undefined ? `${r.substitute ? 'Filed by the IRS' : 'Filed'} ${formatDate(r.filedAt, sim.zone)}` : `${sim.now > r.due ? 'Late: due' : 'Due'} ${formatDate(r.due, sim.zone)}${stateDueOf(r) !== r.due && (r.figures?.states ?? []).length ? `; ${(r.figures!.states ?? []).map((l) => stateName(l.state)).join(' and ')}’s ${formatDate(stateDueOf(r), sim.zone)}` : ''}`}
            actions={r.filedAt === undefined || r.substitute
              ? <Gated feature="tax.file" onClick={() => { const a = run<Filed>('tax.file', { year: r.year }); if (a.ok) toast(filedWords(a.value!, money, sim.zone), 'positive'); }}>{r.substitute ? 'File Your Own In Its Place' : 'File It'}</Gated>
              : undefined}
            help="taxes.return"
          >
            <LookRegion className="col gap-3">
              <div className="table-scroll">
                <table>
                  <tbody>
                    {/* A line that takes away is written with a minus sign, as Money writes an overdrawn balance (from 2026-10-17, brief
                        14's dynamic cases: until then “-$1,961.96”, a hyphen). */}
                    {lines.filter(([, v]) => v !== 0).map(([label, v]) => <tr key={label}><td>{label}</td><td className="num mono">{v < 0 ? `−${money(-v)}` : money(v)}</td></tr>)}
                    {/* Nothing either way is said as nothing (from 2026-10-17, brief 14's dynamic cases: until then "Your Refund $0.00"). */}
                    <tr className="strong"><td>{f.balance > 0 ? 'You Owe' : f.balance < 0 ? 'Your Refund' : 'Nothing Owed Or Due Back'}</td><td className="num mono">{money(Math.abs(f.balance))}</td></tr>
                    {r.penalty ? <tr><td>Late Penalties</td><td className="num mono">{money(r.penalty)}</td></tr> : null}
                    {r.owed ? <tr><td>Still Owed To The IRS, With Interest And Penalty To Date</td><td className="num mono">{money(owedOn(r, sim.now))}</td></tr> : null}
                    {Object.entries(r.stateDue ?? {}).filter(([, sd]) => sd.owed).map(([state, sd]) => <tr key={state}><td>{`Still Owed To ${agencyOf(state)}, With Interest And Penalty To Date`}</td><td className="num mono">{money(stateOwedOn(sd, stateDueOf(r), sim.now))}</td></tr>)}
                    {r.refundAt !== undefined ? <tr><td>Refund Arrives</td><td className="num mono"><Open subject={at('day', dateKey(r.refundAt, sim.homeZone))}>{formatDate(r.refundAt, sim.zone)}</Open></td></tr> : null}
                  </tbody>
                </table>
              </div>
              {/* Not yet filed, it says where it's filed from, not that it was (from 2026-10-20, brief 17: until then an
                  unfiled return read "Filed from New Haven" above File It). */}
              <p className="xs dim" style={{ margin: 0 }}>{r.filedAt === undefined ? 'It’s filed from' : 'Filed from'} <Open subject={at('place', f.cityId)}>{CITIES.require(f.cityId).name}</Open>, where you last lived that year.</p>
              {r.filedAt === undefined && <FileItWords r={r} />}
              <ReturnLife year={r.year} />
            </LookRegion>
          </Panel>
        );
      })}
      {ukYears.length > 0 && (
        <Panel title="UK Tax Years" subtitle="April to April, each settled on the January 31 after it ends">
          <div className="col gap-2">
            {ukYears.map(([key, gross]) => {
              const withheld = record.ukWithheld?.[key] ?? 0;
              const settled = record.ukSettled?.includes(key);
              const change = (gross <= treaty ? 0 : ukTaxOn(gross, cur)) - withheld;
              const years = `${key}–${String(Number(key) + 1).slice(2)}`;
              return (
                <p key={key} className="small" style={{ margin: 0 }}>
                  {years}: {money(gross)} earned and {money(withheld)} withheld by payers. {settled ? 'Settled.' : `It settles on January 31, ${Number(key) + 2}. As things stand, ${change < 0 ? `you’d get a refund of ${money(-change)}` : change > 0 ? `you’ll pay ${money(change)}` : 'nothing is owed either way'}.`}
                </p>
              );
            })}
            <Fine>If you earn under the treaty’s {money(treaty)} in a tax year, everything withheld comes back. Over it, the UK taxes all of it at its usual bands. Source: {ABROAD.source}.</Fine>
          </div>
        </Panel>
      )}
      {/* Until 2026-10-16 this said the IRS wrote about every five weeks from filing, with no bill first (`nextNotice`,
          `billed`). Until 2026-10-14 the deduction took “the job’s other costs you kept receipts for” too; they went with the
          `receipts` knob that day, as nothing recorded one. */}
      <Fine>
        A return is due April 15, or the next business day. A 1040-NR with no wages on it is due June 15. Filed late with tax owed, the penalty is {RETURN.lateMonthly * 100}% of the balance for each month or part of a month, up to a quarter of it, and at least {formatMoney(inSaveMoney(sim, RETURN.lateMinimum, 'USD'), cur)} once it’s {RETURN.lateMinimumAfterDays} days late. Paid late, the penalty is {RETURN.payLateMonthly * 100}% a month, up to a quarter, plus the IRS’s interest of {Math.round(COLLECTION.interest * 1000) / 10}% a year, compounded daily, from the due date. If you leave tax owing, the IRS bills you at filing (Notice CP14). From the due date it writes about every {COLLECTION.noticeWeeks === 5 ? 'five' : COLLECTION.noticeWeeks} weeks, then sends a final notice, and {COLLECTION.finalDays} days later levies your bank accounts. If you never file a return that owes tax, the IRS files one for you a year later. None of it is assessed if your own return arrives within {SUBSTITUTE.answerDays} days of its notice, and your return replaces it if it comes later. A refund comes {RETURN.refundDays} days after filing, or {RETURN.refundDays + SSN.itinWeeks * 7} days for a 1040-NR filed without a Social Security number. The performing artist deduction takes your commission and dues off your income if it’s {formatMoney(inSaveMoney(sim, RETURN.performingArtistIncome, 'USD'), cur)} or less, you had two employers each paying {formatMoney(inSaveMoney(sim, RETURN.performingArtistEmployerPay, 'USD'), cur)} or more, and the costs are over a tenth of your acting wages. Otherwise those costs aren’t deductible federally. The tax follows the federal and state law for where you lived. Work in Canada is taxed at 23% when it’s paid. All of it comes back if you earn under {formatMoney(inSaveMoney(sim, ABROAD.canada.treatyCad, 'CAD'), cur)} (CAD 15,000) in the year. Over that, a Canadian return filed with this one by April 30 gives back anything past Canada’s graduated tax. Work in the United Kingdom is taxed at 20% by a payer once it pays you over {formatMoney(inSaveMoney(sim, ABROAD.uk.payerThresholdGbp, 'GBP'), cur)} (£12,570) in its tax year, and is settled with its own return each January 31. Source: {RETURN.source}; {ABROAD.source}.
      </Fine>
    </div>
  );
}

/**
 * What covers them, and the marketplace. The unions' plans were here until they went with the career on 2026-10-09
 * (`systems/health.ts`); until 2026-10-12 this still named them.
 */
function HealthPane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  // The state where they live, where its law keeps medical debt off a credit record (`MEDICAL_DEBT.barredIn`), for
  // Medical Debt's note: from 2026-10-22 (brief 20's papers area), when until then it said the debt went on the record
  // once a year past due, "never in New York or California", to a student in New Haven, where Connecticut bars it too.
  const region = CITIES.get(person.currentLocationId)?.parentId ?? '';
  const debtBarredBy = !MEDICAL_DEBT.barredIn.includes(region) ? undefined : region === 'us-ct' ? 'Connecticut' : region === 'us-ny' ? 'New York' : region === 'us-ca' ? 'California' : undefined;
  const h = healthOf(person);
  const cover = coverOn(person, sim.now);
  // A program by its own name, HUSKY D or Covered Connecticut in New Haven (`coverLabel`, from 2026-10-12: until then
  // Your Cover called Covered Connecticut the Essential Plan and HUSKY D Medicaid, and the bills' subtitle called
  // HUSKY D the Essential Plan, its plan's label).
  const named = coverLabel(person, sim.now);
  const state = BENEFIT_STATE[homeOf(person)];
  const year = zonedParts(sim.now, sim.zone).year;
  const may = mayEnroll(person, sim.now, cur, sim);
  const ownPlan = [h.marketplace, h.program].find((r) => r && (r.until === undefined || r.until > sim.now));
  const enrolled = ownPlan !== undefined;
  const plan = planOf(person, sim.now);
  const debt = medicalDebtOf(sim, person);
  // A line a change of cover wrote (`repriceCare`) shows its credit as a share below nothing, Credited, and the plan's
  // change, negative where it took its part back; a bill it credited shows what's left of the share it was issued at
  // (from 2026-10-16: until then the bill was rewritten in place, and said Settled where nobody paid it).
  const bills = [...h.bills].reverse().slice(0, 10);
  return (
    <div className="col gap-5">
      <YourDoctor />
      <Panel title="Your Cover" help="papers.health-cover">
        <div className="grid grid-3">
          <Stat label="This Month" value={named ?? 'None'} tone={cover ? undefined : 'warning'} />
        </div>
      </Panel>
      <Panel
        title="The Marketplace"
        subtitle={state ? `${formatMoney(benchmarkFor(state, year, cur), cur)} a month for the benchmark silver plan` : 'Only in New York, Los Angeles or New Haven'}
        actions={enrolled
          // Dropped, it says so in place of the button (from 2026-10-16: until then Drop The Plan stayed, and a second press
          // said the same again).
          ? ownPlan!.ended === 'voluntary' && ownPlan!.until !== undefined ? <span className="small">Dropped: it ends on {formatDate(ownPlan!.until, sim.zone)}.</span>
            : <Gated feature="health.drop" onClick={() => { if (run('health.drop').ok) toast('Your plan ends at the end of the month. Dropping it doesn’t open a special enrollment period.', 'positive'); }}>Drop The Plan</Gated>
          : !may.ok ? undefined : <Gated feature="health.enroll" onClick={() => { const a = run<{ kind: string; from: number }>('health.enroll'); if (a.ok) toast(`Enrolled in ${a.value!.kind === 'marketplace' ? 'the marketplace' : state ? PROGRAM_NAMES[state][a.value!.kind as 'medicaid' | 'essential'] : 'Medicaid'}, from ${formatDate(a.value!.from, sim.zone)}.`, 'positive'); }}>Enroll</Gated>}
        help="papers.health-cover"
      >
        <div className="col gap-3">
          {/* The work rules said as the player meets them (from 2026-10-17, brief 12): until then this began “80 hours’ work”,
              which nobody off the School can do in SLATE, and said “school at least half-time” for the School. */}
          {/* Where you stand first, then a short overview, and the rules behind three drill-downs (from 2026-10-17, brief 14's
              cross-area pass): until then it was one paragraph of 246 to 309 words, a wall at 390 wide (the health area's
              shot-390-papers-marketplace.png). The words are the same; their order and their grouping changed. */}
          {/* Enrolled in what, since this panel holds a public program too (from 2026-10-20, brief 17: until then "You’re
              enrolled from May 1, 2027." under The Marketplace for HUSKY D). */}
          <p className="small" style={{ margin: 0 }}>{enrolled ? `You’re enrolled in ${ownPlan === h.program && h.program ? PROGRAM_NAMES[h.program.state][h.program.kind] : 'a marketplace plan'} ${ownPlan!.from > sim.now ? 'from' : 'since'} ${formatDate(ownPlan!.from, sim.zone)}.` : may.why}</p>
          <p className="small" style={{ margin: 0 }}>Public cover depends on your income in a month, and costs no premium. On a marketplace plan you pay a premium each month, and your tax return can give some of it back.</p>
          {CITIES.get(person.currentLocationId)?.parentId === 'us-ca' && <p className="small" style={{ margin: 0 }}>In California, each month without cover adds a penalty to your return: the greater of {formatMoney(inSaveMoney(sim, CALIFORNIA_MANDATE.flat, 'USD'), cur)} a year or {CALIFORNIA_MANDATE.share * 100}% of income, a twelfth for each month, up to {formatMoney(inSaveMoney(sim, CALIFORNIA_MANDATE.bronzeMonth, 'USD'), cur)}. Months without cover this year so far: {h.uncoveredInCalifornia[year] ?? 0}.</p>}
          <details className="small"><summary>Who Public Cover Takes</summary>
            <p className="small" style={{ margin: 'var(--s2) 0 0' }}>Medicaid (Medi-Cal in California, HUSKY D in Connecticut) covers you up to 138% of the poverty line. In New York the Essential Plan covers you up to 200%, and in Connecticut Covered Connecticut covers you up to 175% of the previous year’s line. Each is open at any time, with no premium. Covered Connecticut is for an income over HUSKY D’s line, whatever your immigration status, and comes with the premium tax credit from 100% of the poverty line. From 2027 a student in F-1 status or a graduate on OPT gets no premium tax credit.</p>
          </details>
          <details className="small"><summary>Medicaid’s Work Rules From 2027</summary>
            <p className="small" style={{ margin: 'var(--s2) 0 0' }}>From 2027 Medicaid also has work rules. You meet them in any month you spend some of at the School, or in a month with {formatMoney(inSaveMoney(sim, PUBLIC_COVER.workEarnings, 'USD'), cur)} of income (pay, interest, a benefit or a pension). In Connecticut that’s the month before you apply, or any one of the {PUBLIC_COVER.workLookBack.ct.renew} months before a renewal. You also meet them if you’re 65 or over, if you get SNAP under its own work rules, or if you ask for a hospital stay to count. If you don’t meet them, a notice gives you {PUBLIC_COVER.answerDays} days from when you receive it to answer before an application is denied or cover ends. An ending is announced at least {PUBLIC_COVER.advanceNoticeDays} days ahead, at the end of a month.</p>
          </details>
          <details className="small"><summary>Paying For A Marketplace Plan</summary>
            <p className="small" style={{ margin: 'var(--s2) 0 0' }}>On a marketplace plan you pay the whole premium each month, and your tax return gives back what’s over your share of income, a nonresident’s 1040-NR too. There’s no credit over {PREMIUM_CREDIT.cutoff * 100}% of the poverty line, since the enhanced credits ended with 2025.</p>
          </details>
          {/* HUSKY D's work rules short, it's applied for on a notice; a notice waits on an answer (from 2026-10-16:
              until then Papers' refusal was the end of it, and a renewal ended cover at once). */}
          {state && !applyRefusal(sim, person, sim.now) && (
            <div className="row gap-3" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <p className="small" style={{ margin: 0, flex: 1 }}>You can still apply for {PROGRAM_NAMES[state].medicaid}. You’ll be sent a notice of noncompliance, with {PUBLIC_COVER.answerDays} days from receiving it to show you met the work rules in {monthsWords(lookBack(sim.now, state, 'apply'))}, or that an exception applies, such as a hospital stay that month. It’s decided after that, and you can buy a marketplace plan in the meantime.</p>
              <Gated feature="health.apply" onClick={() => { const a = run<{ decideAt: number }>('health.apply'); if (a.ok) toast(`Applied. A notice will say what’s needed, and it’s decided on ${formatDate(a.value!.decideAt, sim.zone)}.`, 'positive'); }}>Apply For {PROGRAM_NAMES[state].medicaid}</Gated>
            </div>
          )}
          {h.pending && (
            <div className="row gap-3" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <p className="small" style={{ margin: 0, flex: 1 }}>
                A notice of noncompliance dated {formatDate(h.pending.noticeAt, sim.zone)}: {PROGRAM_NAMES[h.pending.state].medicaid} couldn’t find that you met the work rules in {monthsWords(h.pending.months)}. Answer by {formatDate(answerBy(h.pending.noticeAt), sim.zone)}. {h.pending.kind === 'renewal' ? 'You’re covered until it’s decided' : 'The application is decided'} on {formatDate(h.pending.decideAt, sim.zone)}.{' '}
                {hardshipRefusal(sim, person, sim.now) ?? 'If you were in hospital in one of those months, you can ask for it to count.'}
              </p>
              {!hardshipRefusal(sim, person, sim.now) && <Gated feature="health.request_hardship" onClick={() => { const r = run<{ month: string }>('health.request_hardship'); if (r.ok) toast('Hardship exception granted. The work rules count as met.', 'positive'); }}>Request A Hardship Exception</Gated>}
            </div>
          )}
          <Fine>
            The benchmark premiums are estimated from published rates. Source: {BENCHMARK_SOURCE}; {CALIFORNIA_MANDATE.source}.
          </Fine>
        </div>
      </Panel>

      <ConditionsPanel />
      <DentalPanel />

      <Panel
        title="Care And Its Bills"
        // A plan with no most a year (HUSKY D, Covered Connecticut) says only what's been paid, from 2026-10-17 (brief 14's
        // cross-area pass): until then it read “HUSKY D: $20.00 of $0.00 paid this year”, its prescriptions' copays over a most of nothing.
        subtitle={plan ? `${cover === 'medicaid' || cover === 'essential' ? named : plan.label}: ${formatMoney(h.spent[year] ?? 0, cur)}${plan.outOfPocket > 0 ? ` of ${formatMoney(inSaveMoney(sim, plan.outOfPocket, 'USD'), cur)}` : ''} paid this year` : 'Uninsured: you pay the full price, less any financial assistance from the hospital'}
        actions={debt && debt.balance < 0 ? <Gated feature="health.pay_bill" onClick={() => { if (run('health.pay_bill', { amount: -debt.balance }).ok) toast('Your medical debt is paid off.', 'positive'); }}>Pay It Off</Gated> : undefined}
        help="papers.health-cover"
      >
        <div className="col gap-3">
          {debt && debt.balance < 0 && <Stat label="Medical Debt" value={formatMoney(-debt.balance, cur)} tone="warning" note={debtBarredBy ? `${debtBarredBy}’s law keeps it off your credit record` : `It goes on your credit record only at ${formatMoney(inSaveMoney(sim, MEDICAL_DEBT.reportAt, 'USD'), cur)} or more, once a year past due`} />}
          {bills.length > 0 && (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Care</th><th scope="col">When</th><th scope="col" className="num">Your Share</th><th scope="col">Due</th><th scope="col">Assistance</th><th scope="col" className="num">Plan Paid</th></tr></thead>
                <tbody>{bills.map((b) => <tr key={b.id}><td>{careLabel(b.what)}</td><td>{formatDate(b.at, sim.zone)}</td><td className="num mono">{formatMoney(b.credit ? -b.credit : b.amount, cur)}{b.credited ? <span className="xs dim"> of {formatMoney(b.amount + b.credited, cur)}</span> : null}</td><td>{b.credit || (b.credited && b.amount === 0) ? 'Credited' : b.paid ? 'Settled' : b.inDebt ? 'Owed As Debt' : formatDate(b.dueAt, sim.zone)}</td><td>{b.denied && (b.denied.outcome ? <span className="xs dim">{b.denied.outcome === 'upheld' ? 'Denial Upheld' : 'Denial Overturned'}</span> : appealRefusal(b, sim.now) ? <span className="xs dim">{b.denied.appealedAt ? 'Appealed' : 'Denied'}</span> : <Gated feature="health.appeal" className="btn btn-sm btn-ghost" title={`It’s decided in ${DENIALS.decideDays} days, and insurers uphold ${pct(DENIALS.upheld)} of appeals.`} onClick={() => { if (run('health.appeal', { billId: b.id }).ok) toast(`Appealed: decided in ${DENIALS.decideDays} days.`, 'positive'); }}>Appeal It</Gated>)}{b.aid ? aidWord(b.aid) : aidRefusal(b, sim.now) ? '' : <Gated feature="health.apply_aid" className="btn btn-sm btn-ghost" onClick={() => { const r = run<{ aid: string }>('health.apply_aid', { billId: b.id }); if (r.ok) toast(r.value!.aid === 'refused' ? `Your income is over the hospital policy’s limit of ${pct(CHARITY.connecticut.discountTo)} of the poverty line, so nothing came off this bill.` : 'The hospital applied its financial assistance to this bill.', r.value!.aid === 'refused' ? 'neutral' : 'positive'); }}>Apply For Assistance</Gated>}</td><td className="num mono">{b.covered ? formatMoney(b.covered.planPaid, cur) : ''}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          <Fine>
            Illness comes at the rates for an adult your age: about {CARE.perYear.visit} doctor’s visits and {CARE.perYear.emergency} emergency visits a year, a hospital stay one year in 25, and the flu one season in eleven. Care is priced at what it costs your plan: {formatMoney(inSaveMoney(sim, grown(CARE.price.visit, 'visit', sim.now), 'USD'), cur)} a visit, {formatMoney(inSaveMoney(sim, grown(CARE.price.emergency, 'emergency', sim.now), 'USD'), cur)} an emergency visit and {formatMoney(inSaveMoney(sim, grown(CARE.price.stay, 'stay', sim.now), 'USD'), cur)} a hospital stay, at this year’s commercial prices, grown from their source year by the medical price index. The uninsured are billed more. A bill is due in {MEDICAL_DEBT.dueDays} days. Source: {CARE.source}; {PLANS_SOURCE}.
          </Fine>
        </div>
      </Panel>
    </div>
  );
}

/**
 * A bill's care in the Care column, a label: the care in Title Case and the place's name as it's spelled (from
 * 2026-10-20, brief 17: an emergency's bill, "The emergency room, Yale New Haven Hospital, …", read as prose to
 * `titleCaseLabel` and stayed in lower case beside "A Prescription, A Generic").
 */
const careLabel = (what: string): string => {
  if (!readsAsProse(what)) return titleCaseLabel(what);
  const [care, ...where] = what.split(', ');
  return [titleCaseLabel(care!), ...where].join(', ');
};

/** A share as Papers says one: 0.67 is 67%, 5.5 is 550%. */
const pct = (share: number): string => `${Math.round(share * 100)}%`;

/**
 * What an application for a hospital's charity came to, or its screening at billing. The discount's share is its rule's
 * (from 2026-10-12: until then it was typed in, as the appeal's 60 days and 56% and the charity's 550% beside it were).
 */
const aidWord = (aid: NonNullable<MedicalBill['aid']>): string => ({ free: 'Free Care', discount: `${pct(CHARITY.connecticut.discount)} Off`, refused: 'Over The Limit', screened: 'Assistance Taken Off' })[aid];

/** The conditions carried, and keeping each up or not. */
/** A course of CBT for depression at a named practice where you live, its sessions weekly (`systems/therapy.ts`). */
function TherapyRow() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const here = therapistsIn(person.currentLocationId);
  const [name, setName] = useState('');
  if (person.therapy) return <div className="small">{`Therapy with ${person.therapy.therapist}: ${person.therapy.done} of ${THERAPY.sessions} sessions`}</div>;
  if (here.length === 0) return null;
  // Until one is chosen, the first that will see you (from 2026-10-12: until then the first in the town, which in New
  // Haven was Yale's, refused to anybody Yale Health no longer covered).
  const t = here.find((x) => x.name === name) ?? here.find((x) => !therapyRefusal(person, x.name, sim.now)) ?? here[0]!;
  const no = therapyRefusal(person, t.name, sim.now);
  return (
    <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div className="field" style={{ margin: 0 }}>
        <label htmlFor="therapist">Therapist</label>
        <select id="therapist" value={t.name} onChange={(e) => setName(e.target.value)}>{here.map((x) => <option key={x.name} value={x.name}>{x.price > 0 ? `${x.name}, ${formatMoney(sessionPrice(sim, x), saveCurrency(sim.universe), { cents: false })} A Session` : `${x.name}, Free${x.yale ? ' With Yale Health' : ''}`}</option>)}</select>
      </div>
      <Gated feature="health.therapy" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { const r = run<{ first: number }>('health.therapy', { therapist: t.name }); if (r.ok) toast(`Your first session is ${formatDate(r.value!.first, sim.zone)}.`, 'positive'); }}>{`Begin A Course Of ${THERAPY.sessions} Sessions`}</Gated>
      {no && <span className="xs dim">{no}</span>}
    </div>
  );
}

/**
 * What leaving a condition untreated does, said on its row beside Let It Go, as `registerHealth`'s week and the emergency
 * odds charge it (from 2026-10-20, brief 17, section 8: until then only the fine print said it). High blood pressure's
 * isn't charged, and nothing is said of it.
 */
function untreatedWords(condition: Condition, state: Chronic): string | undefined {
  const times = (n: number) => ({ 2: 'double', 3: 'triple', 4: 'quadruple' } as Record<number, string>)[n] ?? `rise ${n} times over`;
  const effect = condition === 'depression' ? 'your morale falls each week'
    : condition === 'asthma' ? `your emergencies ${times(CHRONIC.untreated.asthmaEmergencies)}`
      : condition === 'diabetes' ? (state.typeOne ? `your emergencies ${times(CHRONIC.untreated.diabetesEmergencies)} and your condition falls each week` : 'your condition falls each week')
        : condition === 'arthritis' ? 'your energy falls each week' : undefined;
  return effect && `Left untreated, ${effect}.`;
}

function ConditionsPanel() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const person = useWorld((s) => s.player);
  const h = healthOf(person);
  const conditions = Object.entries(h.chronic ?? {}) as [Condition, Chronic][];
  const longest = longestFillOf(person);
  const fills = fillsCharged(person, longest);
  const noSupply = extraSupplyRefusal(person, longest);
  if (!conditions.length && !h.lenses) return null;
  return (
    <Panel title="Your Long-Term Conditions" subtitle={h.lenses ? 'You wear prescription lenses' : undefined} help="papers.conditions">
      <div className="col gap-3">
        {conditions.map(([condition, state]) => (
          <div key={condition} className="row-between small">
            <span>{CONDITION_LABEL[condition]}{condition === 'diabetes' ? (state.typeOne ? ', Type 1' : ', Type 2') : ''}: {state.treated ? (state.lapsed ? 'Kept Up, But This Month’s Care Went Unpaid' : state.supplyUntil !== undefined && state.supplyUntil < sim.now ? 'Out Of Medicine' : 'Kept Up') : 'Left Untreated'}{state.treated && state.supplyUntil !== undefined && <span className="xs dim">{` · Medicine until ${formatDate(state.supplyUntil, sim.zone)}`}</span>}{untreatedWords(condition, state) && <span className="xs dim" style={{ display: 'block' }}>{untreatedWords(condition, state)}</span>}</span>
            <Gated feature="health.treat" onClick={() => { const a = run<{ treated: boolean }>('health.treat', { condition, on: !state.treated }); if (a.ok) toast(a.value!.treated ? 'Kept up from this month.' : 'Care stopped. It’s left untreated from now on.', 'positive'); }}>
              {state.treated ? 'Let It Go' : 'Keep It Up'}
            </Gated>
          </div>
        ))}
        {h.chronic?.depression && <TherapyRow />}
        {conditions.some(([, s]) => s.treated) && <div className="row gap-2" style={{ flexWrap: 'wrap' }}><Gated feature="health.extra_supply" className="btn btn-sm btn-ghost" disabled={Boolean(noSupply)} title={noSupply ?? `Pays for ${longest} days at once, at ${fills === 1 ? 'one fill’s' : `${fills} fills’`} share`} onClick={() => { if (run('health.extra_supply', { days: longest }).ok) toast(`${longest} days of medicine filled.`, 'positive'); }}>{`Fill A Longer Supply, ${longest} Days`}</Gated><HowItWorks help="health.extra_supply" /></div>}
        {conditions.some(([, s]) => s.treated) && noSupply && <span className="xs dim">{noSupply}</span>}
        <Fine>
          Medicine is refilled at the pharmacy where you live when a week of it is left: 28 days at a time in England, 30 in America, a month elsewhere. A longer supply pays for up to {longest} days at once, so a month when your bank runs low doesn’t leave you without. A fill your bank can’t cover isn’t filled at all. Conditions come at the rates for adults 18 to 34: depression {CHRONIC.share.depression * 100}%, asthma {(CHRONIC.share.asthma * 100).toFixed(1)}%, high blood pressure {(CHRONIC.share.hypertension * 100).toFixed(1)}%, diabetes {(CHRONIC.share.diabetes * 100).toFixed(1)}% and arthritis {(CHRONIC.share.arthritis * 100).toFixed(1)}%. While you keep a condition up, each month’s care and each fill is paid when it happens, at what your plan doesn’t cover: for depression, therapy {CHRONIC.therapyPerMonth === 2 ? 'twice' : `${CHRONIC.therapyPerMonth} times`} a month and a generic; for asthma, a brand inhaler; for blood pressure, a generic; for diabetes, insulin and a glucose monitor (or a generic for type 2) and a visit each quarter; for arthritis, a generic. Insulin never costs more than the makers’ {formatMoney(inSaveMoney(sim, INSULIN.cashCap, 'USD'), cur)} a month, and nothing on a plan New York regulates. The monitor never costs more than Abbott’s {formatMoney(inSaveMoney(sim, INSULIN.monitor.program, 'USD'), cur)}. Left untreated, depression lowers your morale each week, asthma doubles your emergencies, type 1 diabetes quadruples them, diabetes wears your body down and arthritis tires it. These effects are estimated. Source: {CHRONIC.source}; {INSULIN.source}; {PHARMACY.source}; {DENTAL_VISION.source}.
        </Fine>
      </div>
    </Panel>
  );
}

/** A stand-alone dental plan: buying it, or dropping it. */
function DentalPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const h = healthOf(person);
  const own = h.dental && (h.dental.until === undefined || h.dental.until > sim.now) ? h.dental : undefined;
  const offered = own?.plan ?? dentalPlanFor(person, sim.now);
  if (!offered) return null;
  const d = DENTAL_PLANS[offered];
  // The plan year its maximum is kept by, as the plan keeps it (`dentalYearOf`, from 2026-10-13).
  const year = own ? dentalYearOf(own.plan, sim.now) : zonedParts(sim.now, sim.zone).year;
  return (
    <Panel
      title="A Dental Plan"
      subtitle={`${d.label}: ${formatMoney(inSaveMoney(sim, d.premium, 'USD'), cur)} ${d.yearly ? 'a year' : 'a month'}`}
      actions={own
        ? (d.yearly ? undefined : <Gated feature="health.dental" onClick={() => { if (run('health.dental', { on: false }).ok) toast('Your dental plan ends at the end of the month.', 'positive'); }}>Drop Dental</Gated>)
        : <Gated feature="health.dental" onClick={() => { if (run('health.dental', { on: true }).ok) toast('You’re covered for the dentist from today.', 'positive'); }}>Buy Dental</Gated>}
      help="papers.health-cover"
    >
      <div className="col gap-3">
        {own && <Stat label="Paid By The Plan This Year" value={`${formatMoney(own.paid[year] ?? 0, cur)} of ${formatMoney(inSaveMoney(sim, d.max, 'USD'), cur)}`} />}
        {/* What it pays and how it's bought and ended, in sight before Buy Dental, Yale's paid for its year and not canceled
            once paid; the estimates and the source behind Sources And Estimates (from 2026-10-20, brief 17, section 8:
            until then all of it was in the fine print, and the panel showed a price and Buy Dental alone). */}
        <p className="small" style={{ margin: 0 }}>
          It pays for cleanings in full, and {d.basic * 100}% of a filling after a {formatMoney(inSaveMoney(sim, d.deductible, 'USD'), cur)} deductible, up to {formatMoney(inSaveMoney(sim, d.max, 'USD'), cur)} a year. It pays only where your health plan doesn’t. {offered === 'ca' ? 'Covered California sells it only alongside its own health plan, and it ends when that plan does.' : offered === 'yale' ? 'It’s paid for the year to September 30, and can’t be canceled once paid.' : 'It’s bought on its own through NY State Of Health, and Drop Dental ends it at the end of the month.'}
        </p>
        <Fine>
          {offered === 'ca' ? 'Its Los Angeles premium is estimated. ' : offered === 'yale' ? '' : 'Its premium and its share of a filling are estimated. '}Source: {DENTAL_PLANS.source}.
        </Fine>
      </div>
    </Panel>
  );
}

const STATE_NAMES: Record<string, string> = { 'us-ny': 'New York', 'us-ca': 'California', 'us-ct': 'Connecticut', 'us-ga': 'Georgia', 'us-il': 'Illinois', 'us-la': 'Louisiana' };
const stateName = (state: string) => STATE_NAMES[state] ?? state;

/**
 * A claim where a citizen lives outside the US (from 2026-09-29): Universal
 * Credit in Britain and Jobseeker's Allowance in Ireland, each with its button.
 * Until then each was claimed only by the engine, and a player living there
 * had no button for it. Dublin's HAP went with the home on 2026-10-09; the
 * Seguro de Desempleo in Mexico City was filed for here until then, and from
 * then only a claim a save already holds is shown, as it's paid out. Until
 * 2026-10-12 this still listed both as claims with a button.
 */
function HomeClaimsPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const eur = (c: number) => formatMoney(inSaveMoney(sim, c, 'EUR'), cur);
  const file = () => { const a = run<{ firstPaymentAt: number }>('benefits.claim'); if (a.ok) toast('Claim filed.', 'positive'); };
  if (livesInBritain(person)) {
    const uc = person.universalCredit;
    const no = uc && uc.closedAt === undefined ? 'You already have a claim open.' : creditRefusal(sim, person);
    return (
      <Panel title="Universal Credit" subtitle="Britain’s benefit, assessed one month at a time" actions={no ? undefined : <Gated feature="benefits.claim" onClick={file}>File A Claim</Gated>} help="papers.benefits">
        <div className="grid grid-3">
          <Stat label="Claim" value={uc && uc.closedAt === undefined ? 'Open' : 'None Open'} note={uc ? `Filed ${formatDate(uc.filedAt, sim.zone)}` : no ?? 'You can file now'} />
          <Stat label="Paid" value={money(uc?.paid ?? 0)} note="Since it was filed" />
          <Stat label="Months With Nothing Due" value={String(uc?.nils ?? 0)} note="Assessed, with nothing to pay you" />
        </div>
      </Panel>
    );
  }
  if (livesInIreland(person)) {
    const ja = person.jobseekers;
    const no = jobseekerRefusal(sim, person);
    return (
      <>
        <Panel title="Jobseeker’s Allowance" subtitle="Ireland’s benefit, paid a week at a time" actions={no ? undefined : <Gated feature="benefits.claim" onClick={file}>File A Claim</Gated>} help="papers.benefits">
          <div className="grid grid-3">
            <Stat label="Claim" value={ja && ja.closedAt === undefined ? 'Open' : 'None Open'} note={ja ? `Filed ${formatDate(ja.filedAt, sim.zone)}` : no ?? 'You can file now'} />
            <Stat label="Paid" value={money(ja?.paid ?? 0)} />
            <Stat label="Full Week" value={eur(IRISH_JA.weekly)} note="Less a fifth for each day worked, and less for savings over €20,000" />
          </div>
        </Panel>
      </>
    );
  }
  // Filing went on 2026-10-09 (`desempleoRefusal`): only a claim a save already holds is shown, as it's paid out.
  if (livesInMexicoCity(person) && person.desempleo) {
    const d = person.desempleo;
    return (
      <Panel title="Seguro De Desempleo" subtitle="Mexico City’s, paid out on the claim you filed" help="papers.benefits">
        <div className="grid grid-3">
          <Stat label="Claimed" value="Yes" note={`Filed ${formatDate(d.filedAt, sim.zone)}`} />
          <Stat label="Paid" value={`${d.payments} Of ${CDMX_DESEMPLEO.payments}`} note="Months" />
          <Stat label="A Month" value={formatMoney(inSaveMoney(sim, CDMX_DESEMPLEO.monthly, 'MXN'), cur)} note="One month’s UMA, Mexico’s official benchmark amount" />
        </div>
      </Panel>
    );
  }
  return null;
}

/** A claim: filing it, what it pays, and what it's paid. */
/**
 * Assistance where they live (`systems/assistance.ts`, from 2026-10-01):
 * Ontario Works, BC Income Assistance, or SNAP onto an EBT card.
 */
function AssistancePanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const scheme = schemeFor(person);
  if (!scheme) return null;
  const claim = person.assistance && person.assistance.closedAt === undefined ? person.assistance : undefined;
  const no = assistanceRefusal(sim, person);
  const title = scheme === 'ontario-works' ? 'Ontario Works' : scheme === 'bc-assistance' ? 'Income Assistance' : 'SNAP';
  const subtitle = scheme === 'snap' ? 'Food assistance, onto an EBT card for groceries' : scheme === 'ontario-works' ? 'Ontario’s, basic needs and shelter a month' : 'British Columbia’s, support and shelter a month';
  const most = scheme === 'ontario-works' ? `CAD ${ONTARIO_WORKS.basic + ONTARIO_WORKS.shelterMax}` : scheme === 'bc-assistance' ? `CAD ${BC_ASSISTANCE.support + BC_ASSISTANCE.shelterMax}` : formatMoney(inSaveMoney(sim, snapYearOn(sim.now).max * 100, 'USD'), cur);
  return (
    <Panel title={title} subtitle={subtitle} actions={no ? undefined : <Gated feature="benefits.assistance" onClick={() => { const a = run<{ firstPaymentAt: number }>('benefits.assistance'); if (a.ok) toast(`Applied. The first month comes ${formatDate(a.value!.firstPaymentAt, sim.zone)}.`, 'positive'); }}>Apply</Gated>} help="papers.benefits">
      <div className="grid grid-3">
        <Stat label="Claim" value={claim ? 'Open' : 'None Open'} note={claim ? `Since ${formatDate(claim.since, sim.zone)}, ${claim.months} ${claim.months === 1 ? 'month' : 'months'} paid` : no ?? 'You can apply now'} />
        <Stat label="At Most" value={most} note={scheme === 'snap' ? 'A month, less 30% of net income' : 'A month, less earnings over what you’re allowed to keep'} />
        <Stat label={scheme === 'snap' ? 'On The EBT Card' : 'Asset Limit'} value={scheme === 'snap' ? formatMoney(ebtBalance(sim, person), cur) : `CAD ${(scheme === 'ontario-works' ? ONTARIO_WORKS.assets : BC_ASSISTANCE.assets).toLocaleString('en-US')}`} note={scheme === 'snap' ? 'Spent on groceries first' : 'Not counting a home or a car'} />
      </div>
      {scheme === 'snap' && <Fine>Income is counted as SNAP counts it (7 CFR 273.9). Work-study pay isn’t income. Interest and benefits are, without the earned-income deduction that wages get. A student is eligible during term with a work-study award, and in the summer only with 20 hours of work a week (7 CFR 273.5).</Fine>}
    </Panel>
  );
}

/** EI's special benefits for a self-employed Canadian, by registering (`systems/eiself.ts`). */
function EiPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const no = eiRefusal(person);
  if (no && !person.ei) return null;
  const cur = saveCurrency(sim.universe);
  const weekly = eiWeekly(sim, person, sim.now);
  return (
    <Panel title="EI Special Benefits" subtitle="Canada’s, for the self-employed who register" help="papers.benefits">
      <div className="col gap-3">
        <div className="grid grid-2">
          <Stat label="Registered" value={person.ei ? formatDate(person.ei.registeredAt, sim.zone) : 'Not Yet'} note={person.ei ? `Premiums are ${(EI_SELF_EMPLOYED.premium * 100).toFixed(2)}% of self-employed earnings, up to $${EI_SELF_EMPLOYED.premiumMax.toLocaleString('en-US', { minimumFractionDigits: 2 })} a year. You have no self-employed earnings in the game, so none are charged` : `Once registered, ${(EI_SELF_EMPLOYED.premium * 100).toFixed(2)}% of self-employed earnings, up to $${EI_SELF_EMPLOYED.premiumMax.toLocaleString('en-US', { minimumFractionDigits: 2 })} a year`} />
          <Stat label="A Sick Week" value={weekly > 0 ? formatMoney(inSaveMoney(sim, Math.round(weekly * 100), 'CAD'), cur) : '—'} note={person.ei ? `After ${EI_SELF_EMPLOYED.registeredMonths} months registered, with $${EI_SELF_EMPLOYED.minEarnings.toLocaleString('en-US')} earned last year` : 'Once registered for a year'} />
        </div>
        {!person.ei && <div className="row gap-2"><Gated feature="benefits.ei_register" className="btn btn-sm" onClick={() => { if (run('benefits.ei_register', {}).ok) toast('Registered for EI’s special benefits.', 'positive'); }}>Register</Gated></div>}
        <Fine>A week you’re too sick to work, in hospital or laid up, pays {Math.round(EI_SELF_EMPLOYED.rate * 100)}% of last year’s weekly earnings, up to ${EI_SELF_EMPLOYED.maxWeekly}, after {EI_SELF_EMPLOYED.waitWeeks === 1 ? 'one unpaid week' : `${EI_SELF_EMPLOYED.waitWeeks} unpaid weeks`}, for up to {EI_SELF_EMPLOYED.weeks} weeks a claim. Once a benefit has been paid, you keep paying premiums for as long as you’re self-employed. Source: canada.ca, 2026.</Fine>
      </div>
    </Panel>
  );
}

function BenefitsPane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const record = unemploymentOf(person);
  const claim = record.claim;
  // Filed where the engine files it (`claimStateFor`, from 2026-10-10: until then where they live, which could name
  // another state than the claim went to); until 2026-09-27 this read where they stood.
  const state = claimStateFor(person, sim.now) ?? BENEFIT_STATE[homeOf(person)];
  const preview = state ? basePeriodFor(person, state, sim.now, cur) : undefined;
  const source = state === 'ca' ? CALIFORNIA_UI.source : state === 'ct' ? CONNECTICUT_UI.source : NEW_YORK_UI.source;
  // A full-time student in Connecticut isn't available for work (from 2026-10-10, `studentUnavailable`).
  // A student in Connecticut, or a noncitizen without permission to work (`usWorkAuthorized`, from 2026-10-10): the reason said, no button.
  const studying = state ? studentUnavailable(person, state) ?? (usWorkAuthorized(person, sim.now) ? undefined : 'Unemployment pays a noncitizen only with permission to work in the US, such as OPT (FUTA 3304(a)(14)).') : undefined;
  // A week is certified by the open claim's state's rules (`weekBenefit`, `ableOnMost`); until 2026-10-20 (brief 16) these
  // words read the state a claim filed now would go to, the same for every New Haven life, but not for a claim elsewhere.
  const weekState = claim?.state ?? state;
  const partial = weekState === 'ca' ? `the benefit less your earnings above ${formatMoney(inSaveMoney(sim, CALIFORNIA_UI.disregard, 'USD'), cur)} or a quarter of them, whichever is greater` : weekState === 'ct' ? 'the benefit less two-thirds of the pay' : 'a share of the benefit by the hours worked, and nothing once the pay reaches the maximum';
  return (
    <div className="col gap-5">
      <HomeClaimsPanel />
      <AssistancePanel />
      <EiPanel />
      <PensionsPanel />
      <Panel
        title={claim ? `A ${stateName(`us-${claim.state}`)} Claim` : 'No Claim Open'}
        subtitle={claim ? `Filed ${formatDate(claim.filedAt, sim.zone)}` : undefined}
        actions={claim || !state || !preview?.result.ok || studying ? undefined : <Gated feature="benefits.claim" onClick={() => { const a = run<{ weekly: number }>('benefits.claim'); if (a.ok) toast(`Claim filed: ${money(a.value!.weekly)} a week.`, 'positive'); }}>File A Claim</Gated>}
        help="papers.benefits"
      >
        <div className="col gap-3">
          {claim ? (
            <div className="grid grid-3">
              <Stat label="A Week" value={money(claim.weekly)} note={claim.state === 'ct' ? 'Connecticut has no waiting week' : claim.waited ? 'The unpaid waiting week is served' : 'The first eligible week is unpaid'} />
              <Stat label="Paid" value={money(claim.paid)} note={`Of ${money(claim.maxTotal)} at most`} />
              <Stat label="At Most" value={money(claim.maxTotal)} note={`Until ${formatDate(claim.endsAt, sim.zone)}`} />
            </div>
          ) : (
            <p className="small" style={{ margin: 0 }}>
              {!state ? 'Unemployment is paid in the game only in New York, California and Connecticut, and you’d need to have worked or to live in one of them.' : studying ? studying : preview!.result.ok ? `Filed now, your base period, ${preview!.quarters.join(', ')}, pays ${preview!.result.why}` : `Filed now, it wouldn’t pay: ${preview!.result.why}`}
            </p>
          )}
          {/* What happens once a claim is open, then what a week pays (from 2026-10-20, brief 16, section 7: until then one
              paragraph of five sentences). Until then too it said a week counted "the wages paid that week", where from
              2026-10-13 it's the work done in it, paid then or later (`workDoneIn`), and it left out the weeks in hospital,
              laid up or without permission to work, which pay nothing (`ableOnMost`, `usWorkAuthorized`). */}
          <p className="small" style={{ margin: 0 }}>
            Once a claim is open, the game certifies each week for you on Sunday, from anywhere in the country, as an interstate claim allows. What it pays is taxable income on your return{weekState === 'ca' ? ' federally, though California doesn’t tax it' : ''}.
          </p>
          <p className="small" style={{ margin: 0 }}>
            A week with work pays {partial}, counting the work you did that week, even if it’s paid later. A week pays nothing if you’re abroad, a full-time student in Connecticut or without permission to work in the US, or in hospital or laid up by an injury {weekState === 'ct' ? 'for most of the week' : 'when it’s certified'}. Work-study wages come from your school and don’t count toward a claim’s base period.
          </p>
          <Fine>Source: {source}.</Fine>
        </div>
      </Panel>
      {record.past.length > 0 && (
        <Panel title="Past Claims">
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Filed</th><th scope="col">Base Period</th><th scope="col">Closed</th><th scope="col" className="num">A Week</th><th scope="col" className="num">Paid</th></tr></thead>
              <tbody>{record.past.map((c) => <tr key={c.filedAt}><td>{formatDate(c.filedAt, sim.zone)}</td><td className="mono">{c.basePeriod.length ? `${c.basePeriod[0]} to ${c.basePeriod[c.basePeriod.length - 1]}` : '—'}</td><td>{c.closedAt !== undefined ? formatDate(c.closedAt, sim.zone) : '—'}</td><td className="num mono">{money(c.weekly)}</td><td className="num mono">{money(c.paid)}</td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

/**
 * Their own doctor, from the practices in the town they live in, and where urgent and emergency care is had here. A
 * choice or a button shut by the guide or the engine says why under its group (`WhyNot`, from 2026-10-12, the
 * completeness critic's item 14): until then Your Doctor, Your Pharmacy, Call It Off, the prepayments and Book An
 * Appointment gave the reason only as a tooltip, which a phone never shows and a keyboard never reaches.
 */
function YourDoctor() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const person = useWorld((s) => s.player);
  const choose = useFeature('health.choose_clinic');
  const pharmacy = useFeature('health.choose_pharmacy');
  const bookAgain = useFeature('health.book');
  const prepay = useFeature('health.prepay');
  const cancelAppt = useFeature('health.cancel_appointment');
  const american = person.currentLocationId.startsWith('us-');
  // The practices that would see them now: a practice for its members only while they're one (`clinicRefusal`, from
  // 2026-10-15, when New Haven gained Yale Health's Student Health beside Fair Haven).
  const practices = clinicsIn(person.currentLocationId).filter((c) => DOCTOR_KINDS.includes(c.kind) && clinicRefusal(person, c.id, sim.now) === undefined);
  if (practices.length === 0) return null;
  // Your Doctor is a choice only where two practices or more would see them (from 2026-10-13: until then New Haven's
  // one, Fair Haven, was offered beside The Town's First Practice, the same place, and choosing it changed no booking,
  // bill or price; found by the second round of that day). With one, the line below names it. From 2026-10-15 a Yale
  // student has two there, and somebody Yale Health doesn't cover one.
  const choosing = practices.length > 1;
  // The empty choice is shown only while nothing here is chosen, as what's had then (from 2026-10-12: until then it
  // was offered after a choice too, and picking it did nothing, since the engine refuses an empty one).
  const ownPractice = practices.find((c) => c.id === person.health?.clinicId);
  const ownChain = US_PHARMACIES.find((c) => c.id === person.health?.pharmacy);
  const doctor = clinicFor(person, 'visit', sim.now);
  // What each practice would cost a visit and how soon it books one, where the wait is one number (from 2026-10-15, when
  // a Yale Health member's visit at Fair Haven stopped being Yale Health's to pay: until then each read its name alone).
  const practiceWords = (c: Clinic) => {
    const days = practiceWait(person, c);
    const wait = days === undefined ? '' : days === 1 ? ', The Next Weekday' : `, A ${days}-Day Wait`;
    return `${c.name}, A Visit ${formatMoney(careQuote(sim, person, 'visit', sim.now, c.id), cur)}${wait}`;
  };
  const urgent = clinicFor(person, 'urgent', sim.now);
  const emergency = clinicFor(person, 'emergency', sim.now);
  // What shuts both prepayments: the engine's refusal, or the guide's while its chapter is unread, as their title says.
  const noPrepay = prepayRefusal(sim, person) ?? prepay.reason;
  return (
    <Panel title="Your Doctor" subtitle="Where you’re seen for a doctor’s visit, urgent care or an emergency where you live" help="papers.doctor">
      <div className="col gap-3">
        {(choosing || american) && <div className="col gap-1">
          <div className="field-row field-row-tight">
            {choosing && (
              <div className="field">
                <label htmlFor="own-doctor">Your Doctor</label>
                <select id="own-doctor" value={ownPractice?.id ?? ''} disabled={!choose.open} title={choose.reason} onChange={(e) => { if (e.target.value && run('health.choose_clinic', { clinicId: e.target.value }).ok) toast(`${clinicById(e.target.value)?.name ?? 'That practice'} is now your doctor.`, 'positive'); }}>
                  {!ownPractice && <option value="">{doctor && doctor.members !== null ? 'The Practice Your Cover Uses' : 'The First Practice In Town'}</option>}
                  {practices.map((c) => <option key={c.id} value={c.id}>{practiceWords(c)}</option>)}
                </select>
              </div>
            )}
            {american && (
              <div className="field">
                <label htmlFor="own-pharmacy">Your Pharmacy</label>
                <select id="own-pharmacy" value={ownChain?.id ?? ''} disabled={!pharmacy.open} title={pharmacy.reason} onChange={(e) => { if (e.target.value && run('health.choose_pharmacy', { chain: e.target.value }).ok) toast(`${US_PHARMACIES.find((c) => c.id === e.target.value)?.name ?? 'That pharmacy'} is now your pharmacy.`, 'positive'); }}>
                  {!ownChain && <option value="">Any Pharmacy, At The Typical Price</option>}
                  {/* Priced as `rxShareOf` prices it, in the save's money (from 2026-10-12: until then a bare "4.00"). */}
                  {US_PHARMACIES.map((c) => <option key={c.id} value={c.id}>{`${c.name}, A Generic ${formatMoney(inSaveMoney(sim, Math.round(c.generic * 100), 'USD'), cur)} Uninsured`}</option>)}
                </select>
              </div>
            )}
          </div>
          <WhyNot reasons={[...(choosing ? [['Your Doctor', choose.reason] as const] : []), ...(american ? [['Your Pharmacy', pharmacy.reason] as const] : [])]} />
        </div>}
        <div className="small">{[doctor && `A doctor’s visit: ${doctor.name}`, urgent && `Urgent care: ${urgent.name}`, emergency && `An emergency: ${emergency.name}`].filter(Boolean).join(' · ')}</div>
        <div className="small">{`What it would cost you here now: a doctor’s visit ${formatMoney(careQuote(sim, person, 'visit'), cur)}, urgent care ${formatMoney(careQuote(sim, person, 'urgent'), cur)}, an emergency ${formatMoney(careQuote(sim, person, 'emergency'), cur)}`}</div>
        {/* An appointment booked while the cover didn't pay there, the cover back before its day, says so where it's called
            off (from 2026-10-16, `outsideTheCover`: until then only its bill did). */}
        {(person.health?.appointments ?? []).map((ap) => (
          <div key={ap.id} className="col gap-1">
            <div className="row gap-2" style={{ alignItems: 'baseline' }}>
              <span className="small">{`${ap.what}: an appointment ${formatDate(ap.at, sim.zone)}${ap.clinicId ? `, ${clinicById(ap.clinicId)?.name ?? ''}` : ''}${outsideTheCover(person).includes(ap) ? '. Yale Health pays for a visit only at its own Health Center: call this off, then Book An Appointment, to be seen there' : ''}`}</span>
              <button type="button" className="btn btn-sm btn-ghost" disabled={!cancelAppt.open} title={cancelAppt.reason} onClick={() => run('health.cancel_appointment', { appointmentId: ap.id })}>Call It Off</button>
            </div>
            <WhyNot reasons={[['Call It Off', cancelAppt.reason]]} />
          </div>
        ))}
        {!prepayRefusal(sim, person) || person.health?.prepaidUntil ? (
          <div className="col gap-1">
            <div className="row gap-2" style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span className="small">{(person.health?.prepaidUntil ?? 0) > sim.now ? `Prescriptions are prepaid to ${formatDate(person.health!.prepaidUntil!, sim.zone)}` : 'Prescriptions: £9.90 an item'}</span>
              {([3, 12] as const).map((m) => <button key={m} type="button" className="btn btn-sm btn-ghost" disabled={!prepay.open || Boolean(prepayRefusal(sim, person))} title={prepayRefusal(sim, person) ?? prepay.reason} onClick={() => { if (run('health.prepay', { months: m }).ok) toast('Prepaid. Your prescriptions are free until it runs out.', 'positive'); }}>{m === 3 ? 'Prepay Three Months, £32.05' : 'Prepay A Year, £114.50'}</button>)}
            </div>
            <WhyNot reasons={[['Prepay Three Months, £32.05', noPrepay], ['Prepay A Year, £114.50', noPrepay]]} />
          </div>
        ) : null}
        {person.health?.owedVisit && (
          <div className="col gap-1">
            <div className="row gap-2" style={{ alignItems: 'baseline' }}>
              <span className="small">{`${person.health.owedVisit}: not yet seen`}</span>
              <button type="button" className="btn btn-sm" disabled={!bookAgain.open} title={bookAgain.reason} onClick={() => { const r = run<{ at: number }>('health.book', {}); if (r.ok) toast(`Booked for ${formatDate(r.value!.at, sim.zone)}.`, 'positive'); }}>Book An Appointment</button>
            </div>
            <WhyNot reasons={[['Book An Appointment', bookAgain.reason]]} />
          </div>
        )}
        <Fine>The practices, clinics and hospitals are real. A practice that publishes how soon it sees people books on that wait. Yale Health’s Student Health offers the Yale students it covers the same day or the next, and the game books the next. Elsewhere the town’s published wait applies. Uninsured, an urgent visit at a clinic that publishes its self-pay price costs that price: CityMD’s, which two sources put at $225 and $250, taken at the middle, and Exer’s $215. An emergency keeps you for the department’s median time, and you miss whatever you had planned in that time. In America, a generic is filled at your pharmacy’s own cash price, and never costs more than your plan’s copay.</Fine>
      </div>
    </Panel>
  );
}

/**
 * The state pensions a record earns, and claiming them: Social Security, the UK's and Ireland's State Pensions, the
 * IMSS pension and the Pensión para el Bienestar. They were on the Career screen's Unions And Pay until the career
 * went in the scope reset of 2026-10-09, and the SAG-AFTRA pension beside them went with it.
 */
function PensionsPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  return (
    <>
      {(socialSecurityOf(person, cur).credits > 0 || person.socialSecurity) && (() => {
        const ss = socialSecurityOf(person, cur);
        const no = socialSecurityRefusal(sim, person);
        const usd = (d: number) => money(cur === 'USD' ? d * 100 : exchange(d * 100, 'USD', cur) ?? d * 100);
        return (
          <Panel title="Social Security" subtitle="Your US earnings record" actions={no ? undefined : <Gated feature="pension.social_security" onClick={() => { const r = run<{ monthly: number; factor: number }>('pension.social_security'); if (r.ok) toast(`Claimed: ${money(r.value!.monthly)} a month, ${Math.round(r.value!.factor * 1000) / 10}% of the full benefit.`, 'positive'); }}>Claim Social Security</Gated>} help="papers.pensions">
            <div className="col gap-3">
              <div className="grid grid-3">
                <Stat label="Credits" value={String(ss.credits)} note="You need forty to qualify, and years at school earn only a few" />
                <Stat label="At 67, A Month" value={usd(ss.pia)} note={`At 62: ${usd(Math.floor(ss.pia * claimFactor(-60)))}. At 70: ${usd(Math.floor(ss.pia * claimFactor(36)))}`} />
                <Stat label="Claimed" value={person.socialSecurity ? usd(person.socialSecurity.monthlyUsd) : 'Not Yet'} note={person.socialSecurity ? `A month since ${formatDate(person.socialSecurity.from, sim.zone)}` : no ?? 'You can claim it now'} />
              </div>
              <Fine>The benefit is worked from your highest 35 years of US wages. Each year counts up to its taxable maximum and is indexed by the national wage index to the year you turn 60. They’re averaged by month, then paid at 90%, 32% and 15% across SSA’s 2026 bend points. Claimed early, it’s cut. Delayed, it rises 8% a year until 70. Where SSA hasn’t published a figure yet, the game uses its latest one. Source: {SOCIAL_SECURITY.source}.</Fine>
            </div>
          </Panel>
        );
      })()}
      {(qualifyingYears(person, cur).length > 0 || person.statePensionFrom !== undefined) && (
        <Panel title="State Pension" subtitle="The UK’s, on your National Insurance record" actions={statePensionRefusal(sim, person) ? undefined : <Gated feature="pension.state" onClick={() => { const r = run<{ weekly: number }>('pension.state'); if (r.ok) toast(`Claimed: ${money(r.value!.weekly)} a week, paid every four weeks.`, 'positive'); }}>Claim It</Gated>} help="papers.pensions">
          <div className="col gap-3">
            <div className="grid grid-3">
              <Stat label="Qualifying Years" value={String(qualifyingYears(person, cur).length)} note={`Ten for any pension, ${STATE_PENSION.yearsForFull} for the full rate`} />
              <Stat label="A Week" value={money(weeklyPension(person, sim.now, cur))} note={person.statePensionFrom !== undefined ? `Claimed ${formatDate(person.statePensionFrom, sim.zone)}` : `From ${formatDate(statePensionAge(person), sim.zone)}`} />
              <Stat label="Claimed" value={person.statePensionFrom !== undefined ? 'Yes' : 'Not Yet'} note={statePensionRefusal(sim, person) ?? 'You can claim it now'} />
            </div>
            <Fine>A tax year qualifies if your UK earnings reach the Lower Earnings Limit, {formatMoney(STATE_PENSION.lowerEarningsLimit, 'GBP', { cents: false })} in 2026/27, or with the credits Universal Credit gives. Each qualifying year is worth a thirty-fifth of the full {formatMoney(STATE_PENSION.weekly[STATE_PENSION.weekly.length - 1]![1], 'GBP')} a week (2026/27). State Pension age is 68 for anyone born after April 5, 1978, under the Pensions Act 2007. The game keeps the limit and the rate at their 2026/27 levels. Source: {STATE_PENSION.source}.</Fine>
          </div>
        </Panel>
      )}
      {(irishContributions(person, cur) > 0 || person.irishPension || livesInIreland(person)) && (
        <Panel title="State Pension (Ireland)" subtitle="Ireland’s, on your PRSI contributions" actions={irishPensionRefusal(sim, person) ? undefined : <Gated feature="pension.ie_state" onClick={() => { const r = run<{ weekly: number }>('pension.ie_state'); if (r.ok) toast(`Claimed: ${money(r.value!.weekly)} a week.`, 'positive'); }}>Claim It</Gated>} help="papers.pensions">
          <div className="col gap-3">
            <div className="grid grid-3">
              <Stat label="Contributions" value={String(irishContributions(person, cur))} note={`${IRISH_PENSION.paidNeeded} for any pension, ${IRISH_PENSION.forFull.toLocaleString('en-US')} for the full rate`} />
              <Stat label="A Week At 66" value={formatMoney(inSaveMoney(sim, person.irishPension?.weeklyEur ?? irishWeekly(irishContributions(person, cur), IRISH_PENSION.age), 'EUR'), cur)} note={person.irishPension ? `Claimed ${formatDate(person.irishPension.from, sim.zone)}` : 'More if you claim at 67 or 68'} />
              <Stat label="Claimed" value={person.irishPension ? 'Yes' : 'Not Yet'} note={irishPensionRefusal(sim, person) ?? 'You can claim it now'} />
            </div>
            <Fine>A calendar year of Irish earnings of €5,000 or more counts as 52 contributions. Your weekly pension is the full rate times your contributions divided by 2,080: €299.30 at 66, €313.40 claimed at 67, €328.90 at 68 (2026). With a short record or none, while you live in Ireland, you get the means-tested pension instead if it’s higher: €288 a week (€298 from 80), less your means over €30. The means-tested pension also brings the Fuel Allowance, €38 a week through the winter. The €22 Living Alone Increase isn’t included in the game. Rates are kept at their 2026 levels. Source: {IRISH_PENSION.source}.</Fine>
          </div>
        </Panel>
      )}
      {(person.imss?.days ?? 0) > 0 && (
        <Panel title="IMSS Pension" subtitle="Mexico’s, on your IMSS weeks and AFORE account" actions={imssRefusal(sim, person) ? undefined : <Gated feature="pension.imss" onClick={() => { const r = run<{ monthly: number }>('pension.imss'); if (r.ok) toast(`Claimed: ${money(r.value!.monthly)} a month.`, 'positive'); }}>Claim It</Gated>} help="papers.pensions">
          <div className="col gap-3">
            <div className="grid grid-3">
              <Stat label="Weeks" value={String(Math.floor(person.imss!.days / 7))} note={`${weeksNeeded(new Date(sim.now).getUTCFullYear())} needed this year`} />
              <Stat label="AFORE Account" value={formatMoney(inSaveMoney(sim, grownTo(person.imss!, sim.now), 'MXN'), cur)} note="At CONSAR’s 4% real, less its fee" />
              <Stat label="Claimed" value={person.imss!.claimedAt !== undefined ? 'Yes' : 'Not Yet'} note={imssRefusal(sim, person) ?? 'You can claim it now'} />
            </div>
            <Fine>Each day you work in Mexico is a day registered with IMSS, and its pay puts that year’s retirement contribution for its pay band into your AFORE account. Weeks are your registered days divided by seven. From 65, with enough weeks for the year, the account buys a pension. It’s never less than the guaranteed floor, and the Fondo de Pensiones para el Bienestar tops it up to your last year’s wage, up to MXN 17,885.85 a month. The pension the account buys is estimated. Source: {IMSS.source}.</Fine>
          </div>
        </Panel>
      )}
      {isoOfCountry(person.citizenshipId) === 'MX' && (
        <Panel title="Pensión Para El Bienestar" subtitle="Mexico’s, for every Mexican living there from 65" actions={bienestarRefusal(sim, person) ? undefined : <Gated feature="pension.bienestar" onClick={() => { const r = run<{ bimonthly: number }>('pension.bienestar'); if (r.ok) toast(`Claimed: ${money(r.value!.bimonthly)} every two months.`, 'positive'); }}>Claim It</Gated>} help="papers.pensions">
          <div className="col gap-3">
            <Stat label="Claimed" value={person.bienestarFrom !== undefined ? 'Yes' : 'Not Yet'} note={bienestarRefusal(sim, person) ?? 'You can claim it now'} />
            <Fine>MXN 6,400 every two months, paid while you live in Mexico, whatever you paid in (2026 rules). Source: {BIENESTAR.source}.</Fine>
          </div>
        </Panel>
      )}
    </>
  );
}
