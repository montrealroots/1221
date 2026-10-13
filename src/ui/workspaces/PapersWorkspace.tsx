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
import { DOCTOR_KINDS, clinicById, clinicFor, clinicsIn } from '@/engine/systems/clinics';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { dateKey, formatDate } from '@/engine/core/time';
import { LookRegion, Open, at } from '@/ui/looks';
import { CITIES } from '@/engine/content/geography';
import { ABROAD, BENCHMARK_SOURCE, BENEFIT_STATE, CALIFORNIA_MANDATE, CALIFORNIA_UI, CONNECTICUT_UI, CARE, CHARITY, CHRONIC, DENTAL_PLANS, DENTAL_VISION, INSULIN, PHARMACY, MEDICAL_DEBT, NEW_YORK_UI, PLANS_SOURCE, PREMIUM_CREDIT, PUBLIC_COVER, RETURN } from '@/engine/content/safetynet';
import { PLAN, SUBSTITUTE, type Filed, amendRefusal, deadline, leastMonthly, nonresidentDeadline, nonresidentFor, owedAll, owedOn, owedToOf, partsOn, planFee, planRefusal, returnsOf, ukTaxOn } from '@/engine/systems/taxreturn';
import { SSN } from '@/engine/systems/taxid';
import { agencyOf, financialStatement, interestWords, orderWords, owedToState, payLateWords, statePlanFee, rulesOf, statePartsOn, stateOwedOn, statePlanRefusal } from '@/engine/systems/statetax';
import { FederalLien, StateLienAndPenalty } from '@/ui/components/LienPanels';
import { STATE_UNRESEARCHED } from '@/engine/content/statetax';
import { CONDITION_LABEL, DENIALS, PROGRAM_NAMES, type MedicalBill, benchmarkFor, coverLabel, coverOn, dentalPlanFor, grown, healthOf, mayEnroll, medicalDebtOf, aidRefusal, appealRefusal, planOf, prepayRefusal, type Condition, extraSupplyRefusal, fillsCharged, longestFillOf, type Chronic, careQuote, dentalYearOf } from '@/engine/systems/health';
import { THERAPY, sessionPrice, therapistsIn, therapyRefusal } from '@/engine/systems/therapy';
import { earningsOf, homeOf } from '@/engine/systems/earnings';
import { titleCaseLabel } from '@/engine/core/text';
import { basePeriodFor, claimStateFor, studentUnavailable, unemploymentOf } from '@/engine/systems/unemployment';
import { usWorkAuthorized } from '@/engine/systems/permission';
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
            <tr><td>The IRS: federal income tax and payroll tax, less federal withholding and the premium credit</td><td className="num mono">{to.irs >= 0 ? money(to.irs) : `${money(-to.irs)} back`}</td></tr>
            {Object.entries(to.states).map(([state, v]) => <tr key={state}><td>{agencyOf(state)}: {stateName(state)}’s tax{state === 'us-ny' ? ' and New York City’s' : state === 'us-in' && r.figures.local ? ' and Marion County’s' : ''}{state === 'us-ca' ? ', and its penalty for no cover' : ''}, less what it withheld{state === 'us-ct' ? ' and its premium assistance' : ''}</td><td className="num mono">{v >= 0 ? money(v) : `${money(-v)} back`}</td></tr>)}
          </tbody>
        </table>
      </div>
      {to.derived && <p className="xs dim" style={{ margin: 0 }}>The year’s withholding was kept as one total: SLATE divided it by the paychecks’ own tax table.</p>}
      {sides.map(([state, sd]) => {
        const rules = rulesOf(state);
        const p = sd.owed ? statePartsOn(sd, r.due, sim.now) : undefined;
        const value = Math.round(Number(amounts[state] ?? '') * 100);
        return (
          <div key={state} className="col gap-2">
            <div className="eyebrow">Owed To {agencyOf(state)}</div>
            {!rules && <p className="xs dim" style={{ margin: 0 }}>{STATE_UNRESEARCHED}</p>}
            {sd.migrated && <p className="xs dim" style={{ margin: 0 }}>{sd.migrated.how}.</p>}
            {sd.assessedBy && <p className="xs dim" style={{ margin: 0 }}>{sd.replacedAt !== undefined ? `Assessed by ${agencyOf(state)} with no return from you, ${formatDate(sd.assessedBy.at, sim.zone)}; replaced by your own, ${formatDate(sd.replacedAt, sim.zone)}.` : `Assessed by ${agencyOf(state)} with no return from you, ${formatDate(sd.assessedBy.at, sim.zone)}. File your own to replace it.`}</p>}
            {p ? (
              <>
                <div className="grid grid-3">
                  <Stat label="Tax Unpaid" value={money(p.tax)} />
                  <Stat label="Penalties" value={money(p.penalty)} note={rules ? payLateWords(rules) : 'None added: unresearched'} />
                  <Stat label="Interest" value={money(p.interest)} note={rules ? interestWords(rules) : 'None added: unresearched'} />
                </div>
                {rules && (sd.collection ?? 0) > 0 && <p className="xs dim" style={{ margin: 0 }}>{(sd.collection ?? 0) <= rules.notices.length ? `${rules.notices[(sd.collection ?? 1) - 1]!.code} sent.` : 'Its levy has been made.'}{rules.timingAssumed ? ' The days between its notices are SLATE’s.' : ''}</p>}
                <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div className="field"><label htmlFor={`tax-pay-${state}-${year}`}>{`Pay ${stateName(state)} (Blank Pays It All)`}</label><input id={`tax-pay-${state}-${year}`} inputMode="decimal" value={amounts[state] ?? ''} onChange={(e) => setAmounts({ ...amounts, [state]: e.target.value })} placeholder={(stateOwedOn(sd, r.due, sim.now) / 100).toFixed(2)} /></div>
                  <Gated feature="tax.pay_state" className="btn btn-sm" onClick={() => { const a = run<{ owed: number; tax: number; penalty: number; interest: number }>('tax.pay_state', amounts[state] ? { state, year, amount: value } : { state, year }); if (a.ok) { toast(a.value!.owed > 0 ? `Paid ${agencyOf(state)}: ${money(a.value!.tax)} to the tax, ${money(a.value!.penalty)} to penalties, ${money(a.value!.interest)} to interest. ${money(a.value!.owed)} still owed.` : `Paid ${agencyOf(state)} in full.`, 'positive'); setAmounts({ ...amounts, [state]: '' }); } }}>Pay</Gated>
                  <HowItWorks help="tax.pay_state" />
                </div>
                {rules && <p className="xs dim" style={{ margin: 0 }}>{orderWords(rules)}</p>}
              </>
            ) : sd.refund ? <p className="small" style={{ margin: 0 }}>{money(sd.refund)} back from {agencyOf(state)}{sd.refundedAt !== undefined ? `, paid ${formatDate(sd.refundedAt, sim.zone)}` : sd.refundAt !== undefined ? `, due about ${formatDate(sd.refundAt, sim.zone)}` : ''}.</p> : sd.filedAt !== undefined ? <p className="small" style={{ margin: 0 }}>Paid to {agencyOf(state)}.</p> : null}
            {(sd.payments ?? []).length > 0 && (
              <details className="small"><summary>{`Payments To ${agencyOf(state)}`}</summary>
                <ul style={{ margin: 0 }}>{sd.payments!.map((x, i) => <li key={i}>{formatDate(x.at, sim.zone)}: {money(x.amount)}, {x.how === 'levy' ? 'taken by levy' : x.how === 'refund offset' ? 'from a refund' : x.how === 'plan' ? 'by its plan' : 'paid'}; to the tax {money(x.tax)}, penalties {money(x.penalty)}, interest {money(x.interest)}.</li>)}</ul>
              </details>
            )}
            <StateLienAndPenalty year={year} state={state} />
          </div>
        );
      })}
    </div>
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
  if (reconsidered) said.push(a.refunded ? `The IRS reconsidered its assessment: ${money(a.refunded)} you paid past your own return’s tax is back now.` : 'The IRS reconsidered its assessment on your own return.');
  else if (a.irs < 0 && a.refundAt !== undefined) said.push(`The IRS’s refund, ${money(-a.irs)}, arrives ${formatDate(a.refundAt, zone)}.`);
  const where = Object.keys(a.states).length ? 'Who It’s Owed To' : 'Owed To The IRS';
  if (!a.paid) said.push(reconsidered ? `What’s still owed shows under ${where}.` : `The bank couldn’t pay all of it: what’s owed shows under ${where}.`);
  if (Object.values(a.states).some((v) => v < 0)) said.push('A state’s refund comes on its own day, under Who It’s Owed To.');
  if (said.length) return `Filed. ${said.join(' ')}`;
  return a.irs > 0 || Object.values(a.states).some((v) => v > 0) ? 'Filed and paid.' : 'Filed: nothing owed or due back.';
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
  const monthly = Math.ceil(Math.max(0, owed - downCents) / Math.max(1, Number(months)));
  const lien = rules.lien && ((long && lp?.lien) || (rules.lien.plan && ((rules.lien.plan.monthsOver !== undefined && Number(months) > rules.lien.plan.monthsOver) || (rules.lien.plan.over !== undefined && owed > rules.lien.plan.over))));
  const STATUS: Record<string, string> = { pending: 'Being decided', active: 'In force', missed: 'A payment missed', ended: 'Ended', paid: 'Paid in full', declined: 'Declined' };
  return (
    <Panel title={`${rules.short} ${plan?.long?.name ?? rules.plan.name}`} subtitle={plan ? STATUS[plan.status] : `${money(owed)} owed`} help="taxes.plan">
      <div className="col gap-3">
        {plan && (
          <div className="grid grid-3">
            <Stat label="Covers" value={money(plan.covers)} note={plan.down ? `after ${money(plan.down)} down` : undefined} />
            <Stat label="Each Month" value={money(plan.monthly)} note={`${plan.months} months`} />
            <Stat label={plan.status === 'missed' ? 'Catch Up By' : 'Next Payment'} value={plan.status === 'missed' && plan.endsBy !== undefined ? formatDate(plan.endsBy, sim.zone) : plan.nextDue !== undefined && plan.status === 'active' ? formatDate(plan.nextDue, sim.zone) : plan.status === 'pending' ? `Decided ${formatDate(plan.decideAt, sim.zone)}` : '—'} />
          </div>
        )}
        {plan?.why && <p className="small" style={{ margin: 0 }}>{plan.why}.</p>}
        {plan?.long?.statement && <p className="xs dim" style={{ margin: 0 }}>The statement it was asked with: {money(plan.long.statement.income)} a month in, {money(plan.long.statement.expenses)} out, {money(plan.long.statement.net)} left; {money(plan.long.statement.cash)} in the bank.</p>}
        {plan?.status === 'missed' && <div><Gated feature="tax.catch_up_state_plan" className="btn btn-sm" onClick={() => { const a = run<{ paid: number }>('tax.catch_up_state_plan', { state }); if (a.ok) toast(`Caught up: ${money(a.value!.paid)} paid. The plan is back in force.`, 'positive'); }}>Catch Up</Gated></div>}
        {(!live || (lp?.alreadyOnPlan && plan?.status === 'active' && !plan.long)) && owed > 0 && (
          <div className="col gap-2">
            <p className="small" style={{ margin: 0 }}>
              {rules.short}’s own plan, apart from any with the IRS: {rules.plan.max !== undefined ? `up to ${money(rules.plan.max)}` : 'no most published'}{rules.plan.min !== undefined ? `, over ${money(rules.plan.min)}` : ''}, over {rules.plan.minMonths} to {rules.plan.maxMonths} months{rules.plan.tiers ? ` (${rules.plan.tiers.map((t) => `${t.maxMonths} to ${t.upTo !== undefined ? money(t.upTo) : 'any amount'}`).join(', ')})` : ''}{rules.plan.monthsAssumed ? ' (SLATE’s: the longest isn’t published)' : ''}{rules.plan.minMonthly !== undefined ? `, at least ${money(rules.plan.minMonthly)} a month` : ''}{rules.plan.fee ? (statePlanFee(person, rules, cur) ? `, a ${money(statePlanFee(person, rules, cur))} fee added to the balance` : ', its fee waived at your income') : ', no fee'}.{rules.plan.beyond ? ` ${rules.plan.beyond}` : ''} Collection stops while it stands; interest {rules.payLate.monthly ? 'and the late-payment penalty go' : 'goes'} on.{rules.plan.cure.kind === 'next-due' ? ' A missed payment is made up by the next due date.' : rules.plan.cure.kind === 'notice' ? ` A missed payment brings an Intent to Terminate and ${rules.plan.cure.days} days.` : ' What a missed payment does isn’t published: SLATE ends the plan.'}{rules.plan.newBalance === 'default' ? ' A new balance with it while the plan stands is a default.' : ''}
              {dp ? ` ${dp.why}` : ''}{lp ? ` Longer: its ${lp.name.toLowerCase()}, to ${lp.maxMonths} months${lp.maxAssumed ? ' (SLATE’s most)' : ''}. ${lp.how}` : ''}
            </p>
            <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {lp && <label className="check" htmlFor={`state-plan-long-${state}`}><input id={`state-plan-long-${state}`} type="checkbox" checked={long} onChange={(e) => setLong(e.target.checked)} /><span>{`Ask For Its ${lp.name}`}</span></label>}
              <div className="field" style={{ flex: '0 0 auto' }}><label htmlFor={`state-plan-${state}`}>Over</label><select id={`state-plan-${state}`} style={{ width: 'auto' }} value={months} onChange={(e) => setMonths(e.target.value)}>
                {Array.from({ length: longest - rules.plan.minMonths + 1 }, (_, i) => rules.plan.minMonths + i).filter((m) => m <= 12 || m % 6 === 0).map((m) => <option key={m} value={m}>{m} Months</option>)}
              </select></div>
              {dp && <div className="field" style={{ flex: '0 0 auto' }}><label htmlFor={`state-plan-down-${state}`}>{dp.required ? 'Down Payment (Required)' : 'Down Payment (Optional)'}</label><input id={`state-plan-down-${state}`} inputMode="decimal" value={down} onChange={(e) => setDown(e.target.value)} placeholder={((dp.required ? suggested : 0) / 100).toFixed(2)} /></div>}
              <Gated feature="tax.apply_state_plan" className="btn btn-sm" disabled={Boolean(no)} onClick={() => { const a = run<{ decideAt: number; monthly: number; down: number }>('tax.apply_state_plan', { state, months: Number(months), long, down: downCents }); if (a.ok) { toast(`Asked${a.value!.down ? ` with ${money(a.value!.down)} down` : ''}: ${money(a.value!.monthly)} a month, decided by ${formatDate(a.value!.decideAt, sim.zone)}.`, 'positive'); setDown(''); } }}>{long && lp ? `Ask For The ${lp.name}` : 'Ask For The Plan'}</Gated>
            </div>
            <p className="xs dim" style={{ margin: 0 }}>{`About ${money(monthly)} a month over ${months} months.`}{lien ? ` ${rules.short} files a ${rules.lien!.name} with it.` : ''}</p>
            {statement && <p className="xs dim" style={{ margin: 0 }}>{`The statement ${lp!.statement} asks, from your own records over the last three months: ${money(statement.income)} a month in, ${money(statement.expenses)} out, ${money(statement.net)} left; ${money(statement.cash)} in the bank.`}{monthly > Math.max(0, statement.net) ? ` At ${money(monthly)} a month it would be declined: more than the statement leaves.` : ''}</p>}
            {no && <span className="xs dim why-not">{no}</span>}
          </div>
        )}
        {plan && plan.history.length > 0 && (
          <details className="small"><summary>The Plan’s History</summary>
            <ul style={{ margin: 0 }}>{plan.history.map((h, i) => <li key={i}>{formatDate(h.at, sim.zone)}: {h.what}{h.amount !== undefined ? `, ${money(h.amount)}` : ''}.</li>)}</ul>
          </details>
        )}
        <Fine>Source: {rules.source}.</Fine>
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
  const amendNo = amendRefusal(sim, r);
  const value = Math.round(Number(amount) * 100);
  return (
    <div className="col gap-2">
      {r.substitute && <p className="small" style={{ margin: 0 }}>The IRS filed this from what your employers and banks reported{r.substituteFigures ? `, ${money(r.substituteFigures.balance)} of tax with no credit only your own return claims` : ''}. File your own and it reconsiders: the tax becomes what yours says, the penalty and interest fall in proportion, and anything paid past it comes back.</p>}
      {r.reconsideredAt !== undefined && <p className="small" style={{ margin: 0 }}>Your own return replaced the IRS’s on {formatDate(r.reconsideredAt, sim.zone)}.</p>}
      <WhoIsOwed year={year} />
      <FederalLien year={year} />
      {r.split && <p className="xs dim" style={{ margin: 0 }}>{r.split.how}: SLATE’s division, since payments made before then weren’t kept by who they went to.</p>}
      {parts && <div className="eyebrow">Owed To The IRS</div>}
      {parts && (
        <div className="col gap-2">
          <div className="grid grid-3">
            <Stat label="Tax Unpaid" value={money(parts.tax)} />
            <Stat label="Penalties" value={money(parts.penalty)} note={r.reducedFrom !== undefined && r.reducedTo === undefined ? `${PLAN.reducedRate * 100}% for each month that begins under the payment plan, to ${RETURN.lateCap * 100}%` : `${RETURN.payLateMonthly * 100}% a month on the tax unpaid, to ${RETURN.lateCap * 100}%`} />
            <Stat label="Interest" value={money(parts.interest)} note="7% a year, daily" />
          </div>
          <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field"><label htmlFor={`tax-pay-${year}`}>Pay (Blank Pays It All)</label><input id={`tax-pay-${year}`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={(owedOn(r, sim.now) / 100).toFixed(2)} /></div>
            <Gated feature="tax.pay" className="btn btn-sm" onClick={() => { const a = run<{ owed: number; tax: number; penalty: number; interest: number }>('tax.pay', amount ? { year, amount: value } : { year }); if (a.ok) { toast(a.value!.owed > 0 ? `Paid: ${money(a.value!.tax)} to the tax, ${money(a.value!.penalty)} to penalties, ${money(a.value!.interest)} to interest. ${money(a.value!.owed)} still owed.` : 'Paid in full.', 'positive'); setAmount(''); } }}>Pay</Gated>
            <HowItWorks help="tax.pay" />
          </div>
          <p className="xs dim" style={{ margin: 0 }}>A part goes to the tax first, then the penalties, then the interest, the IRS’s order where you name none; a lower tax lowers the months of penalty still to come.</p>
        </div>
      )}
      {/* An offset reads “from a refund”, as a state's list has it: another year's refund kept for this one is an offset
          too (from 2026-10-12; until then every one here read “from an amended return's refund”). */}
      {(r.payments ?? []).length > 0 && (
        <details className="small"><summary>Payments On The Year</summary>
          <ul style={{ margin: 0 }}>{r.payments!.map((p, i) => <li key={i}>{formatDate(p.at, sim.zone)}: {money(p.amount)}, {p.how === 'levy' ? 'taken by levy' : p.how === 'refund offset' ? 'from a refund' : 'paid'}; to the tax {money(p.tax)}, penalties {money(p.penalty)}, interest {money(p.interest)}.</li>)}</ul>
        </details>
      )}
      {(r.amended ?? []).map((a, i) => (
        <p key={i} className="small" style={{ margin: 0 }}>Form {a.form}, filed {formatDate(a.at, sim.zone)}: {amendWords(a, money)}. {a.processedAt ? `Processed ${formatDate(a.processedAt, sim.zone)}${a.refund ? `: ${money(a.refund + (a.interest ?? 0))} refunded, with interest` : a.interest ? `, with ${money(a.interest)} of interest` : ''}.` : `The IRS takes eight to twelve weeks; SLATE’s estimate is ${formatDate(a.processAt, sim.zone)}.`}</p>
      ))}
      {!r.substitute && (
        <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          {!amending
            ? <button type="button" className="btn btn-sm btn-ghost" disabled={Boolean(amendNo)} title={amendNo} onClick={() => setAmending(true)}>Amend The Return…</button>
            : <>
                <span className="small">An amended return refigures the year from what’s on record now. More owed is added with interest from the due date; less comes off what’s owed, and the rest back with interest.</span>
                <Gated feature="tax.amend" className="btn btn-sm" onClick={() => { const a = run<{ change: number; processAt: number; form: string; irs: number; states?: Record<string, number> }>('tax.amend', { year }); if (a.ok) toast(`Form ${a.value!.form} filed: ${amendWords(a.value!, money)}, processed about ${formatDate(a.value!.processAt, sim.zone)}.`, 'positive'); setAmending(false); }}>File The Amendment</Gated>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAmending(false)}>Not Now</button>
              </>}
          {amendNo && <span className="xs dim">{amendNo}</span>}
        </div>
      )}
    </div>
  );
}

const PLAN_STATUS: Record<string, string> = { pending: 'With the IRS', active: 'In force', default: 'A payment missed', ended: 'Ended', paid: 'Paid in full', refused: 'Refused' };

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
  return (
    <Panel title="IRS Payment Plan" subtitle={plan ? PLAN_STATUS[plan.status] : `${money(owed)} owed`} help="taxes.plan">
      <div className="col gap-3">
        {plan && (
          <div className="grid grid-3">
            <Stat label="Covers" value={money(plan.covers)} note={plan.years.join(', ')} />
            <Stat label={plan.kind === 'long' ? 'Each Month' : 'Paid By'} value={plan.kind === 'long' ? money(plan.monthly ?? 0) : plan.payBy !== undefined ? formatDate(plan.payBy, sim.zone) : '—'} note={plan.directDebit ? 'By direct debit' : 'Paid by you'} />
            <Stat label={plan.status === 'pending' ? 'Answered By' : plan.status === 'default' ? 'Caught Up By' : 'Next Payment'} value={plan.status === 'pending' ? formatDate(plan.decideAt, sim.zone) : plan.status === 'default' && plan.defaultBy !== undefined ? formatDate(plan.defaultBy, sim.zone) : plan.nextDue !== undefined && plan.status === 'active' ? formatDate(plan.nextDue, sim.zone) : '—'} />
          </div>
        )}
        {plan?.why && <p className="small" style={{ margin: 0 }}>{plan.why}</p>}
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
        {!live && owed > 0 && (
          <div className="col gap-2">
            <p className="small" style={{ margin: 0 }}>
              The IRS takes what’s owed to it on every year in one plan: federal tax only, a state’s being the state’s, with a plan of its own. A short-term plan has {PLAN.shortDays} days and no fee; a monthly plan up to {money(PLAN.longMax)} is approved online, with a setup fee. While it’s in force, collection stops, and on a return filed on time each month of the late-payment penalty that begins under it is charged {PLAN.reducedRate * 100}% where it would be {RETURN.payLateMonthly * 100}%. A payment missed brings Notice CP523, and {PLAN.defaultDays} days to catch up before the plan ends. The least monthly payment, what’s owed over {PLAN.leastMonths} months, is SLATE’s.
            </p>
            <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="field" style={{ flex: '0 0 auto' }}><label htmlFor="plan-kind">Plan</label><select id="plan-kind" style={{ width: 'auto' }} value={kind} onChange={(e) => setKind(e.target.value as 'long' | 'short')}>
                <option value="long">Monthly Payments</option>
                <option value="short">Paid Within {PLAN.shortDays} Days</option>
              </select></div>
              {kind === 'long' && <div className="field"><label htmlFor="plan-monthly">{`Each Month (${cur})`}</label><input id="plan-monthly" inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder={(least / 100).toFixed(2)} /></div>}
              {kind === 'long' && <label className="row gap-1 small"><input type="checkbox" checked={debit} onChange={(e) => setDebit(e.target.checked)} /> By Direct Debit</label>}
              <Gated feature="tax.apply_plan" className="btn btn-sm" disabled={Boolean(no)} onClick={() => { const a = run<{ status: string; decideAt: number; fee: number }>('tax.apply_plan', { kind, ...(kind === 'long' ? { directDebit: debit, ...(asked ? { monthly: asked } : {}) } : {}) }); if (a.ok) { toast(`Applied: answered by ${formatDate(a.value!.decideAt, sim.zone)}${a.value!.fee ? `, a fee of ${money(a.value!.fee)}` : ''}.`, 'positive'); setMonthly(''); } }}>Apply</Gated>
            </div>
            {no ? <span className="xs dim">{no}</span> : kind === 'long' && <span className="xs dim">Setup fee: {money(planFee(sim, person, 'long', debit))}.</span>}
          </div>
        )}
        {plan && plan.history.length > 0 && (
          <details className="small"><summary>The Plan’s History</summary>
            <ul style={{ margin: 0 }}>{plan.history.map((h, i) => <li key={i}>{formatDate(h.at, sim.zone)}: {h.what}{h.amount !== undefined ? `, ${money(h.amount)}` : ''}.</li>)}</ul>
          </details>
        )}
        <Fine>Source: {PLAN.source}.</Fine>
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
        <p className="muted">Your returns, your health cover, unemployment, your pensions, your passport and your ID.</p>
      </div>
      <div className="tabs" role="tablist" aria-label="Papers">
        {PAPERS_TABS.map((one, i) => (
          <button
            key={one.id} id={`papers-tab-${one.id}`} type="button" role="tab" className="tab"
            aria-selected={one.id === tab} aria-controls={`papers-pane-${one.id}`} tabIndex={one.id === tab ? 0 : -1}
            onClick={() => setTab(one.id)}
            onKeyDown={(e) => {
              const go = (n: number) => { const next = PAPERS_TABS[(n + PAPERS_TABS.length) % PAPERS_TABS.length]!; setTab(next.id); document.getElementById(`papers-tab-${next.id}`)?.focus(); };
              if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
              else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
              else if (e.key === 'Home') { e.preventDefault(); go(0); }
              else if (e.key === 'End') { e.preventDefault(); go(PAPERS_TABS.length - 1); }
            }}
          >
            {one.label}
          </button>
        ))}
      </div>
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
              Each February, a year with anything owed or due back, or with income over the standard deduction, has its return ready, and a student on an F-1 has one every year. {thisYear}’s is due <Open subject={at('day', dateKey(deadline(thisYear), sim.homeZone))}>{formatDate(deadline(thisYear), sim.zone)}</Open>{nonresident ? <>; with no wages on it, a 1040-NR is due <Open subject={at('day', dateKey(nonresidentDeadline(thisYear, false), sim.homeZone))}>{formatDate(nonresidentDeadline(thisYear, false), sim.zone)}</Open></> : null}.
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
          ['Of A Home’s Gain, Kept Free Of Tax', f.gainExcluded ?? 0],
          ['Performing Artist Deduction', -f.deduction],
          ['Itemized: Mortgage Interest, Taxes And Mortgage Insurance', -(f.itemized ?? 0)],
          ['Of The Federal Tax, On Gains And Investment Income', f.gainTax ?? 0],
          ['Federal Income Tax', f.federal],
          ['Of It, The Credit For Another Country’s Tax', -(f.foreignCredit ?? 0)],
          ['Canada’s Tax Refunded, By Its Treaty Or Its Return', -(f.foreignRefund ?? 0)],
          ...(f.states ?? []).flatMap((l) => [[`${stateName(l.state)} Income Tax`, l.tax], ...(l.credit ? [[`${stateName(l.state)}’s Credit For Another State’s Tax`, -l.credit]] : [])] as [string, number][]),
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
        return (
          <Panel
            key={r.year}
            title={`${r.year} Return`}
            subtitle={r.filedAt !== undefined ? `${r.substitute ? 'Filed by the IRS' : 'Filed'} ${formatDate(r.filedAt, sim.zone)}` : `Due ${formatDate(r.due, sim.zone)}`}
            actions={r.filedAt === undefined || r.substitute
              ? <Gated feature="tax.file" onClick={() => { const a = run<Filed>('tax.file', { year: r.year }); if (a.ok) toast(filedWords(a.value!, money, sim.zone), 'positive'); }}>{r.substitute ? 'File Your Own In Its Place' : 'File It'}</Gated>
              : undefined}
            help="taxes.return"
          >
            <LookRegion className="col gap-3">
              <div className="table-scroll">
                <table>
                  <tbody>
                    {lines.filter(([, v]) => v !== 0).map(([label, v]) => <tr key={label}><td>{label}</td><td className="num mono">{money(v)}</td></tr>)}
                    <tr className="strong"><td>{f.balance > 0 ? 'You Owe' : 'Comes Back To You'}</td><td className="num mono">{money(Math.abs(f.balance))}</td></tr>
                    {r.penalty ? <tr><td>Late Penalties</td><td className="num mono">{money(r.penalty)}</td></tr> : null}
                    {r.owed ? <tr><td>Still Owed To The IRS, With Interest And Penalty To Date</td><td className="num mono">{money(owedOn(r, sim.now))}</td></tr> : null}
                    {Object.entries(r.stateDue ?? {}).filter(([, sd]) => sd.owed).map(([state, sd]) => <tr key={state}><td>{`Still Owed To ${agencyOf(state)}, With Interest And Penalty To Date`}</td><td className="num mono">{money(stateOwedOn(sd, r.due, sim.now))}</td></tr>)}
                    {r.refundAt !== undefined ? <tr><td>Refund Arrives</td><td className="num mono"><Open subject={at('day', dateKey(r.refundAt, sim.homeZone))}>{formatDate(r.refundAt, sim.zone)}</Open></td></tr> : null}
                  </tbody>
                </table>
              </div>
              <p className="xs dim" style={{ margin: 0 }}>Filed from <Open subject={at('place', f.cityId)}>{CITIES.require(f.cityId).name}</Open>, where you last lived that year.</p>
              <ReturnLife year={r.year} />
            </LookRegion>
          </Panel>
        );
      })}
      {ukYears.length > 0 && (
        <Panel title="UK Tax Years" subtitle="April to April, each settled the 31 January after">
          <div className="col gap-2">
            {ukYears.map(([key, gross]) => {
              const withheld = record.ukWithheld?.[key] ?? 0;
              const settled = record.ukSettled?.includes(key);
              const change = (gross <= treaty ? 0 : ukTaxOn(gross, cur)) - withheld;
              const years = `${key}–${String(Number(key) + 1).slice(2)}`;
              return (
                <p key={key} className="small" style={{ margin: 0 }}>
                  {years}: {money(gross)} earned, {money(withheld)} taken by payers. {settled ? 'Settled.' : `Settles 31 January ${Number(key) + 2}: ${change < 0 ? `${money(-change)} back` : change > 0 ? `${money(change)} to pay` : 'nothing either way'}, as it stands.`}
                </p>
              );
            })}
            <Fine>Under the treaty’s {money(treaty)} in a year all that was withheld comes back; over it, the UK’s bands on it all. Source: {ABROAD.source}.</Fine>
          </div>
        </Panel>
      )}
      {/* Until 2026-10-14 the deduction took “the job’s other costs you kept receipts for” too; they went with the
          `receipts` knob that day, as nothing recorded one. */}
      <Fine>
        Due 15 April, or the next business day; 15 June for a 1040-NR with no wages on it. Filed late with a balance, 5% of it a month or part of one, to a quarter of it, with at least {formatMoney(inSaveMoney(sim, RETURN.lateMinimum, 'USD'), cur)} past 60 days; paid late, 0.5% a month to a quarter, and the IRS’s interest, 7% a year compounded daily, from the due date. Left owing, the IRS writes about every five weeks, sends its final notice, and 30 days on levies your bank accounts; a return never filed that owes, it files itself a year on: nothing of it is assessed if yours comes within {SUBSTITUTE.answerDays} days of its notice, and yours replaces it after. A refund comes {RETURN.refundDays} days after filing, {RETURN.refundDays + SSN.itinWeeks * 7} on a 1040-NR filed without a Social Security number. The performing artist deduction takes your commission and dues off an income of {formatMoney(inSaveMoney(sim, RETURN.performingArtistIncome, 'USD'), cur)} or less, from two employers paying {formatMoney(inSaveMoney(sim, RETURN.performingArtistEmployerPay, 'USD'), cur)} or more, where the costs are over a tenth of the acting wages; otherwise federally they aren’t deductible. The tax is the federal and state law SLATE carries for where you lived. Work in Canada is taxed at 23% as it’s paid, all of it back under {formatMoney(inSaveMoney(sim, ABROAD.canada.treatyCad, 'CAD'), cur)} (CAD 15,000) in the year and, over it, a Canadian return filed with this one by 30 April gives back what’s past its graduated tax. Work in the United Kingdom is taxed 20% by a payer paying you past {formatMoney(inSaveMoney(sim, ABROAD.uk.payerThresholdGbp, 'GBP'), cur)} (£12,570) in its tax year, and settled with its own return each 31 January. Source: {RETURN.source}; {ABROAD.source}.
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
  const h = healthOf(person);
  const cover = coverOn(person, sim.now);
  // A program by its own name, HUSKY D or Covered Connecticut in New Haven (`coverLabel`, from 2026-10-12: until then
  // Your Cover called Covered Connecticut the Essential Plan and HUSKY D Medicaid, and the bills' subtitle called
  // HUSKY D the Essential Plan, its plan's label).
  const named = coverLabel(person, sim.now);
  const state = BENEFIT_STATE[homeOf(person)];
  const year = zonedParts(sim.now, sim.zone).year;
  const may = mayEnroll(person, sim.now, cur);
  const ownPlan = [h.marketplace, h.program].find((r) => r && (r.until === undefined || r.until > sim.now));
  const enrolled = ownPlan !== undefined;
  const plan = planOf(person, sim.now);
  const debt = medicalDebtOf(sim, person);
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
        subtitle={state ? `${formatMoney(benchmarkFor(state, year, cur), cur)} a month for the benchmark silver plan` : 'In New York, Los Angeles or New Haven'}
        actions={enrolled
          ? <Gated feature="health.drop" onClick={() => { if (run('health.drop').ok) toast('It ends at the month’s end, and opens no special enrollment.', 'positive'); }}>Drop The Plan</Gated>
          : !may.ok ? undefined : <Gated feature="health.enroll" onClick={() => { const a = run<{ kind: string; from: number }>('health.enroll'); if (a.ok) toast(`Enrolled in ${a.value!.kind === 'marketplace' ? 'the marketplace' : state ? PROGRAM_NAMES[state][a.value!.kind as 'medicaid' | 'essential'] : 'Medicaid'}, from ${formatDate(a.value!.from, sim.zone)}.`, 'positive'); }}>Enroll</Gated>}
        help="papers.health-cover"
      >
        <div className="col gap-3">
          <p className="small" style={{ margin: 0 }}>
            {enrolled ? `Enrolled from ${formatDate(ownPlan!.from, sim.zone)}. ` : `${may.why} `}
            On a low month’s income, Medicaid (Medi-Cal in California, HUSKY D in Connecticut) takes you at 138% of the poverty line, in New York the Essential Plan to 200%, and in Connecticut Covered Connecticut to 175% of the year before’s, at any time and with no premium; from 2027 Medicaid asks for {PUBLIC_COVER.workHours} hours’ work or {formatMoney(inSaveMoney(sim, PUBLIC_COVER.workEarnings, 'USD'), cur)} earned a month at renewal, and SLATE counts last month’s hours and pay of work, work-study’s and the Summer Cabaret’s; a benefit, interest or a pension isn’t work.{' '}
            You pay the whole premium each month, and the return gives back what’s over your share of income: none over {PREMIUM_CREDIT.cutoff * 100}% of the poverty line, since the enhanced credits ended with 2025.
            {CITIES.get(person.currentLocationId)?.parentId === 'us-ca' ? ` In California a month without cover costs its penalty on the return: the greater of ${formatMoney(inSaveMoney(sim, CALIFORNIA_MANDATE.flat, 'USD'), cur)} a year and ${CALIFORNIA_MANDATE.share * 100}% of income, a twelfth a month, to ${formatMoney(inSaveMoney(sim, CALIFORNIA_MANDATE.bronzeMonth, 'USD'), cur)}; ${h.uncoveredInCalifornia[year] ?? 0} this year so far.` : ''}
          </p>
          <Fine>
            The benchmark premiums are SLATE’s estimate from published rates. Source: {BENCHMARK_SOURCE}; {CALIFORNIA_MANDATE.source}.
          </Fine>
        </div>
      </Panel>

      <ConditionsPanel />
      <DentalPanel />

      <Panel
        title="Care And Its Bills"
        subtitle={plan ? `${cover === 'medicaid' || cover === 'essential' ? named : plan.label}: ${formatMoney(h.spent[year] ?? 0, cur)} of ${formatMoney(inSaveMoney(sim, plan.outOfPocket, 'USD'), cur)} paid this year` : 'Uninsured: you pay the price, less a hospital’s charity'}
        actions={debt && debt.balance < 0 ? <Gated feature="health.pay_bill" onClick={() => { if (run('health.pay_bill', { amount: -debt.balance }).ok) toast('Paid off.', 'positive'); }}>Pay It Off</Gated> : undefined}
        help="papers.health-cover"
      >
        <div className="col gap-3">
          {debt && debt.balance < 0 && <Stat label="Medical Debt" value={formatMoney(-debt.balance, cur)} tone="warning" note={`On your record only at ${formatMoney(inSaveMoney(sim, MEDICAL_DEBT.reportAt, 'USD'), cur)}, a year past due, and outside New York and California`} />}
          {bills.length > 0 && (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Care</th><th scope="col">When</th><th scope="col" className="num">Your Share</th><th scope="col">Due</th><th scope="col">Assistance</th></tr></thead>
                <tbody>{bills.map((b) => <tr key={b.id}><td>{titleCaseLabel(b.what)}</td><td>{formatDate(b.at, sim.zone)}</td><td className="num mono">{formatMoney(b.amount, cur)}</td><td>{b.paid ? 'Settled' : b.inDebt ? 'Owed As Debt' : formatDate(b.dueAt, sim.zone)}</td><td>{b.denied && (b.denied.outcome ? <span className="xs dim">{b.denied.outcome === 'upheld' ? 'Denial Upheld' : 'Denial Overturned'}</span> : appealRefusal(b, sim.now) ? <span className="xs dim">{b.denied.appealedAt ? 'Appealed' : 'Denied'}</span> : <Gated feature="health.appeal" className="btn btn-sm btn-ghost" title={`It’s decided in ${DENIALS.decideDays} days, and insurers uphold ${pct(DENIALS.upheld)} of appeals.`} onClick={() => { if (run('health.appeal', { billId: b.id }).ok) toast(`Appealed: decided in ${DENIALS.decideDays} days.`, 'positive'); }}>Appeal It</Gated>)}{b.aid ? aidWord(b.aid) : aidRefusal(b, sim.now) ? '' : <Gated feature="health.apply_aid" className="btn btn-sm btn-ghost" onClick={() => { const r = run<{ aid: string }>('health.apply_aid', { billId: b.id }); if (r.ok) toast(r.value!.aid === 'refused' ? `Your income is over the policy’s ${pct(CHARITY.connecticut.discountTo)}.` : 'The hospital took the charity off it.', r.value!.aid === 'refused' ? 'neutral' : 'positive'); }}>Apply For Assistance</Gated>}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          <Fine>
            Illness comes at the rates of an adult your age: about {CARE.perYear.visit} doctor’s visits a year, {CARE.perYear.emergency} emergency visits, a stay in hospital one year in 25, and the flu one season in eleven. Care costs what it costs your plan: {formatMoney(inSaveMoney(sim, grown(CARE.price.visit, 'visit', sim.now), 'USD'), cur)} a visit, {formatMoney(inSaveMoney(sim, grown(CARE.price.emergency, 'emergency', sim.now), 'USD'), cur)} an emergency visit and {formatMoney(inSaveMoney(sim, grown(CARE.price.stay, 'stay', sim.now), 'USD'), cur)} a stay at this year’s commercial prices, grown from their year by the medical price index, and the uninsured are billed more. A bill is due in {MEDICAL_DEBT.dueDays} days. Source: {CARE.source}; {PLANS_SOURCE}.
          </Fine>
        </div>
      </Panel>
    </div>
  );
}

/** A share as Papers says one: 0.67 is 67%, 5.5 is 550%. */
const pct = (share: number): string => `${Math.round(share * 100)}%`;

/**
 * What an application for a hospital's charity came to, or its screening at billing. The discount's share is its rule's
 * (from 2026-10-12: until then it was typed in, as the appeal's 60 days and 56% and the charity's 550% beside it were).
 */
const aidWord = (aid: NonNullable<MedicalBill['aid']>): string => ({ free: 'Free Care', discount: `${pct(CHARITY.connecticut.discount)} Off`, refused: 'Over The Limit', screened: 'Charity Taken Off' })[aid];

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
      <Gated feature="health.therapy" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { const r = run<{ first: number }>('health.therapy', { therapist: t.name }); if (r.ok) toast(`The first session, ${formatDate(r.value!.first, sim.zone)}.`, 'positive'); }}>{`Begin A Course Of ${THERAPY.sessions}`}</Gated>
      {no && <span className="xs dim">{no}</span>}
    </div>
  );
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
    <Panel title="Your Conditions" subtitle={h.lenses ? 'You wear prescription lenses' : undefined} help="papers.conditions">
      <div className="col gap-3">
        {conditions.map(([condition, state]) => (
          <div key={condition} className="row-between small">
            <span>{CONDITION_LABEL[condition]}{condition === 'diabetes' ? (state.typeOne ? ', Type 1' : ', Type 2') : ''}: {state.treated ? (state.lapsed ? 'Kept Up, But This Month’s Care Went Unpaid' : state.supplyUntil !== undefined && state.supplyUntil < sim.now ? 'Out Of Medicine' : 'Kept Up') : 'Left Alone'}{state.treated && state.supplyUntil !== undefined && <span className="xs dim">{` · Medicine until ${formatDate(state.supplyUntil, sim.zone)}`}</span>}</span>
            <Gated feature="health.treat" onClick={() => { const a = run<{ treated: boolean }>('health.treat', { condition, on: !state.treated }); if (a.ok) toast(a.value!.treated ? 'Kept up from this month.' : 'Left alone.', 'positive'); }}>
              {state.treated ? 'Let It Go' : 'Keep It Up'}
            </Gated>
          </div>
        ))}
        {h.chronic?.depression && <TherapyRow />}
        {conditions.some(([, s]) => s.treated) && <div className="row gap-2" style={{ flexWrap: 'wrap' }}><Gated feature="health.extra_supply" className="btn btn-sm btn-ghost" disabled={Boolean(noSupply)} title={noSupply ?? `Pays for ${longest} days at once, at ${fills === 1 ? 'one fill’s' : `${fills} fills’`} share`} onClick={() => { if (run('health.extra_supply', { days: longest }).ok) toast(`${longest} days of medicine filled.`, 'positive'); }}>{`Fill A Longer Supply, ${longest} Days`}</Gated><HowItWorks help="health.extra_supply" /></div>}
        {conditions.some(([, s]) => s.treated) && noSupply && <span className="xs dim">{noSupply}</span>}
        <Fine>
          Medicine is filled as a supply at the pharmacy where you live, with a week left: 28 days in England, 30 in America, a month elsewhere. A longer supply pays for up to {longest} days at once, so a month the bank runs low doesn’t leave you without; one the bank can’t cover isn’t filled at all. Drawn at the rates of adults 18 to 34: depression {CHRONIC.share.depression * 100}%, asthma {(CHRONIC.share.asthma * 100).toFixed(1)}%, high blood pressure {(CHRONIC.share.hypertension * 100).toFixed(1)}%, diabetes {(CHRONIC.share.diabetes * 100).toFixed(1)}%, arthritis {(CHRONIC.share.arthritis * 100).toFixed(1)}%. Kept up, each month’s care and each fill is paid then, at what your plan leaves: therapy twice and a generic for depression, a brand inhaler for asthma, a generic for blood pressure, insulin and a glucose monitor (or a generic for type 2) and a visit a quarter for diabetes, a generic for arthritis. Insulin is never more than the makers’ {formatMoney(inSaveMoney(sim, INSULIN.cashCap, 'USD'), cur)} a month, and nothing on a plan New York regulates; the monitor never more than Abbott’s {formatMoney(inSaveMoney(sim, INSULIN.monitor.program, 'USD'), cur)}. Left alone, depression weighs on your morale each week, asthma doubles your emergencies, type 1 diabetes quadruples them, diabetes wears your body down and arthritis tires it, which is SLATE’s estimate. Source: {CHRONIC.source}; {INSULIN.source}; {PHARMACY.source}; {DENTAL_VISION.source}.
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
        ? (d.yearly ? undefined : <Gated feature="health.dental" onClick={() => { if (run('health.dental', { on: false }).ok) toast('It ends at the month’s end.', 'positive'); }}>Drop Dental</Gated>)
        : <Gated feature="health.dental" onClick={() => { if (run('health.dental', { on: true }).ok) toast('Covered for the dentist from today.', 'positive'); }}>Buy Dental</Gated>}
      help="papers.health-cover"
    >
      <div className="col gap-3">
        {own && <Stat label="Paid By The Plan This Year" value={`${formatMoney(own.paid[year] ?? 0, cur)} of ${formatMoney(inSaveMoney(sim, d.max, 'USD'), cur)}`} />}
        <Fine>
          Cleanings in full; a filling at {d.basic * 100}% after a {formatMoney(inSaveMoney(sim, d.deductible, 'USD'), cur)} deductible, to {formatMoney(inSaveMoney(sim, d.max, 'USD'), cur)} a year. It pays only where your health plan doesn’t. {offered === 'ca' ? 'Covered California sells it only beside its own plan, and it ends with that plan; its Los Angeles premium is SLATE’s estimate.' : offered === 'yale' ? 'Paid for the year to 30 September, and not canceled once paid.' : 'Bought on its own through NY State Of Health; its premium and its share of a filling are SLATE’s estimate.'} Source: {DENTAL_PLANS.source}.
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
  const file = () => { const a = run<{ firstPaymentAt: number }>('benefits.claim'); if (a.ok) toast('Filed.', 'positive'); };
  if (livesInBritain(person)) {
    const uc = person.universalCredit;
    const no = uc && uc.closedAt === undefined ? 'You have a claim open.' : creditRefusal(sim, person);
    return (
      <Panel title="Universal Credit" subtitle="Britain’s, a month assessed at a time" actions={no ? undefined : <Gated feature="benefits.claim" onClick={file}>File A Claim</Gated>} help="papers.benefits">
        <div className="grid grid-3">
          <Stat label="Claim" value={uc && uc.closedAt === undefined ? 'Open' : 'None Open'} note={uc ? `Filed ${formatDate(uc.filedAt, sim.zone)}` : no ?? 'You can file now'} />
          <Stat label="Paid" value={money(uc?.paid ?? 0)} note="Since it was filed" />
          <Stat label="Months Nothing" value={String(uc?.nils ?? 0)} note="Assessed, and nothing due" />
        </div>
      </Panel>
    );
  }
  if (livesInIreland(person)) {
    const ja = person.jobseekers;
    const no = jobseekerRefusal(sim, person);
    return (
      <>
        <Panel title="Jobseeker’s Allowance" subtitle="Ireland’s, a week at a time" actions={no ? undefined : <Gated feature="benefits.claim" onClick={file}>File A Claim</Gated>} help="papers.benefits">
          <div className="grid grid-3">
            <Stat label="Claim" value={ja && ja.closedAt === undefined ? 'Open' : 'None Open'} note={ja ? `Filed ${formatDate(ja.filedAt, sim.zone)}` : no ?? 'You can file now'} />
            <Stat label="Paid" value={money(ja?.paid ?? 0)} />
            <Stat label="Full Week" value={eur(IRISH_JA.weekly)} note="Less a fifth a day worked, and savings over €20,000" />
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
          <Stat label="A Month" value={formatMoney(inSaveMoney(sim, CDMX_DESEMPLEO.monthly, 'MXN'), cur)} note="The month’s UMA" />
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
        <Stat label="At Most" value={most} note={scheme === 'snap' ? 'A month, less 30% of net income' : 'A month, less earnings past what’s kept'} />
        <Stat label={scheme === 'snap' ? 'On The EBT Card' : 'Assets Kept To'} value={scheme === 'snap' ? formatMoney(ebtBalance(sim, person), cur) : `CAD ${(scheme === 'ontario-works' ? ONTARIO_WORKS.assets : BC_ASSISTANCE.assets).toLocaleString('en-US')}`} note={scheme === 'snap' ? 'Spent on groceries first' : 'The home and a car aside'} />
      </div>
      {scheme === 'snap' && <Fine>Counted as SNAP counts it (7 CFR 273.9): work-study pay isn’t income; interest and benefits are, without the earned-income deduction wages get. A student is eligible in term on a work-study award, and in the summer only with 20 hours’ work a week (7 CFR 273.5).</Fine>}
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
          <Stat label="Registered" value={person.ei ? formatDate(person.ei.registeredAt, sim.zone) : 'Not Yet'} note={person.ei ? `Premiums would come from self-employed earnings, of which there are none since the career went: ${(EI_SELF_EMPLOYED.premium * 100).toFixed(2)}% to $${EI_SELF_EMPLOYED.premiumMax.toLocaleString('en-US', { minimumFractionDigits: 2 })} a year` : `Then ${(EI_SELF_EMPLOYED.premium * 100).toFixed(2)}% of your earnings, to $${EI_SELF_EMPLOYED.premiumMax.toLocaleString('en-US', { minimumFractionDigits: 2 })} a year`} />
          <Stat label="A Sick Week" value={weekly > 0 ? formatMoney(inSaveMoney(sim, Math.round(weekly * 100), 'CAD'), cur) : '—'} note={person.ei ? `After ${EI_SELF_EMPLOYED.registeredMonths} months registered, with $${EI_SELF_EMPLOYED.minEarnings.toLocaleString('en-US')} earned last year` : 'Once registered for a year'} />
        </div>
        {!person.ei && <div className="row gap-2"><Gated feature="benefits.ei_register" className="btn btn-sm" onClick={() => { if (run('benefits.ei_register', {}).ok) toast('Registered for EI’s special benefits.', 'positive'); }}>Register</Gated></div>}
        <Fine>A week too sick to work, in hospital or laid up, pays {Math.round(EI_SELF_EMPLOYED.rate * 100)}% of last year’s weekly earnings to ${EI_SELF_EMPLOYED.maxWeekly}, after {EI_SELF_EMPLOYED.waitWeeks === 1 ? 'one unpaid week' : `${EI_SELF_EMPLOYED.waitWeeks} unpaid weeks`}, for {EI_SELF_EMPLOYED.weeks} weeks a claim. Once paid, the premiums run for as long as you’re self-employed. Source: canada.ca, 2026.</Fine>
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
  const partial = state === 'ca' ? `the benefit less the earnings past the greater of ${formatMoney(inSaveMoney(sim, CALIFORNIA_UI.disregard, 'USD'), cur)} and a quarter of them` : state === 'ct' ? 'the benefit less two-thirds of the pay' : 'by its hours, and nothing where the pay reaches the maximum';
  return (
    <div className="col gap-5">
      <HomeClaimsPanel />
      <AssistancePanel />
      <EiPanel />
      <PensionsPanel />
      <Panel
        title={claim ? `A ${stateName(`us-${claim.state}`)} Claim` : 'No Claim Open'}
        subtitle={claim ? `Filed ${formatDate(claim.filedAt, sim.zone)}` : undefined}
        actions={claim || !state || !preview?.result.ok || studying ? undefined : <Gated feature="benefits.claim" onClick={() => { const a = run<{ weekly: number }>('benefits.claim'); if (a.ok) toast(`Filed: ${money(a.value!.weekly)} a week.`, 'positive'); }}>File A Claim</Gated>}
        help="papers.benefits"
      >
        <div className="col gap-3">
          {claim ? (
            <div className="grid grid-3">
              <Stat label="A Week" value={money(claim.weekly)} note={claim.state === 'ct' ? 'Connecticut has no waiting week' : claim.waited ? 'The waiting week is served' : 'The first week due is unpaid'} />
              <Stat label="Paid" value={money(claim.paid)} note={`Of ${money(claim.maxTotal)} at most`} />
              <Stat label="At Most" value={money(claim.maxTotal)} note={`Until ${formatDate(claim.endsAt, sim.zone)}`} />
            </div>
          ) : (
            <p className="small" style={{ margin: 0 }}>
              {!state ? 'SLATE pays unemployment in New York, California and Connecticut, where you’d have to live.' : studying ? studying : preview!.result.ok ? `Filed now, your base period, ${preview!.quarters.join(', ')}, pays ${preview!.result.why}` : `Filed now, it wouldn’t pay: ${preview!.result.why}`}
            </p>
          )}
          <p className="small" style={{ margin: 0 }}>
            Each Sunday the week is certified for you, from anywhere in the country as an interstate claim is; a week abroad pays nothing, and so does a week while you’re a full-time student in Connecticut. A week with work pays {partial}, from the wages paid in it; work-study wages are your school’s, outside the claim’s base period. What’s paid is income on your return{state === 'ca' ? ', federally; California doesn’t tax it' : ''}.
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
  const practices = clinicsIn(person.currentLocationId).filter((c) => DOCTOR_KINDS.includes(c.kind));
  if (practices.length === 0) return null;
  // Your Doctor is a choice only where the town keeps two practices or more (from 2026-10-13: until then New Haven's
  // one, Fair Haven, was offered beside The Town's First Practice, the same place, and choosing it changed no booking,
  // bill or price; found by the second round of that day). With one, the line below names it.
  const choosing = practices.length > 1;
  // The empty choice is shown only while nothing here is chosen, as what's had then (from 2026-10-12: until then it
  // was offered after a choice too, and picking it did nothing, since the engine refuses an empty one).
  const ownPractice = practices.find((c) => c.id === person.health?.clinicId);
  const ownChain = US_PHARMACIES.find((c) => c.id === person.health?.pharmacy);
  const doctor = clinicFor(person, 'visit');
  const urgent = clinicFor(person, 'urgent');
  const emergency = clinicFor(person, 'emergency');
  // What shuts both prepayments: the engine's refusal, or the guide's while its chapter is unread, as their title says.
  const noPrepay = prepayRefusal(sim, person) ?? prepay.reason;
  return (
    <Panel title="Your Doctor" subtitle="Where a doctor’s visit, urgent care and an emergency are had where you live" help="papers.doctor">
      <div className="col gap-3">
        {(choosing || american) && <div className="col gap-1">
          <div className="field-row field-row-tight">
            {choosing && (
              <div className="field">
                <label htmlFor="own-doctor">Your Doctor</label>
                <select id="own-doctor" value={ownPractice?.id ?? ''} disabled={!choose.open} title={choose.reason} onChange={(e) => { if (e.target.value && run('health.choose_clinic', { clinicId: e.target.value }).ok) toast('Your doctor, chosen.', 'positive'); }}>
                  {!ownPractice && <option value="">The Town’s First Practice</option>}
                  {practices.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            {american && (
              <div className="field">
                <label htmlFor="own-pharmacy">Your Pharmacy</label>
                <select id="own-pharmacy" value={ownChain?.id ?? ''} disabled={!pharmacy.open} title={pharmacy.reason} onChange={(e) => { if (e.target.value && run('health.choose_pharmacy', { chain: e.target.value }).ok) toast('Your pharmacy, chosen.', 'positive'); }}>
                  {!ownChain && <option value="">Any Pharmacy, At The Median</option>}
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
        {(person.health?.appointments ?? []).map((ap) => (
          <div key={ap.id} className="col gap-1">
            <div className="row gap-2" style={{ alignItems: 'baseline' }}>
              <span className="small">{`${ap.what}: an appointment ${formatDate(ap.at, sim.zone)}${ap.clinicId ? `, ${clinicById(ap.clinicId)?.name ?? ''}` : ''}`}</span>
              <button type="button" className="btn btn-sm btn-ghost" disabled={!cancelAppt.open} title={cancelAppt.reason} onClick={() => run('health.cancel_appointment', { appointmentId: ap.id })}>Call It Off</button>
            </div>
            <WhyNot reasons={[['Call It Off', cancelAppt.reason]]} />
          </div>
        ))}
        {!prepayRefusal(sim, person) || person.health?.prepaidUntil ? (
          <div className="col gap-1">
            <div className="row gap-2" style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span className="small">{(person.health?.prepaidUntil ?? 0) > sim.now ? `Prescriptions are prepaid to ${formatDate(person.health!.prepaidUntil!, sim.zone)}` : 'Prescriptions: £9.90 an item'}</span>
              {([3, 12] as const).map((m) => <button key={m} type="button" className="btn btn-sm btn-ghost" disabled={!prepay.open || Boolean(prepayRefusal(sim, person))} title={prepayRefusal(sim, person) ?? prepay.reason} onClick={() => { if (run('health.prepay', { months: m }).ok) toast('Prepaid: prescriptions are free while it runs.', 'positive'); }}>{m === 3 ? 'Prepay Three Months, £32.05' : 'Prepay A Year, £114.50'}</button>)}
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
        <Fine>The practices, clinics and hospitals are real. Uninsured, an urgent visit at one that publishes its self-pay price is that price: CityMD’s, which two sources put at $225 and $250, taken at the middle, and Exer’s $215. An emergency keeps you the department’s median time, missing what that time held. In America, a generic is filled at your pharmacy’s own cash price, a plan’s copay never more.</Fine>
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
                <Stat label="Credits" value={String(ss.credits)} note="Forty qualify; a school life earns a few" />
                <Stat label="At 67, A Month" value={usd(ss.pia)} note={`62: ${usd(Math.floor(ss.pia * claimFactor(-60)))}; 70: ${usd(Math.floor(ss.pia * claimFactor(36)))}`} />
                <Stat label="Claimed" value={person.socialSecurity ? usd(person.socialSecurity.monthlyUsd) : 'Not Yet'} note={person.socialSecurity ? `A month since ${formatDate(person.socialSecurity.from, sim.zone)}` : no ?? 'You can claim it now'} />
              </div>
              <Fine>Your highest 35 years of US wages, each to its year’s taxable maximum and indexed by the national wage index to the year you turn 60, averaged a month, then 90%, 32% and 15% across SSA’s 2026 bend points. Claimed early it’s cut, delayed it rises 8% a year to 70. SLATE holds what SSA hasn’t published at the last it did. Source: {SOCIAL_SECURITY.source}.</Fine>
            </div>
          </Panel>
        );
      })()}
      {(qualifyingYears(person, cur).length > 0 || person.statePensionFrom !== undefined) && (
        <Panel title="State Pension" subtitle="The UK’s, on your National Insurance record" actions={statePensionRefusal(sim, person) ? undefined : <Gated feature="pension.state" onClick={() => { const r = run<{ weekly: number }>('pension.state'); if (r.ok) toast(`Claimed: ${money(r.value!.weekly)} a week, paid every four weeks.`, 'positive'); }}>Claim It</Gated>} help="papers.pensions">
          <div className="col gap-3">
            <div className="grid grid-3">
              <Stat label="Qualifying Years" value={String(qualifyingYears(person, cur).length)} note={`Ten for any, ${STATE_PENSION.yearsForFull} for the full rate`} />
              <Stat label="A Week" value={money(weeklyPension(person, sim.now, cur))} note={person.statePensionFrom !== undefined ? `Claimed ${formatDate(person.statePensionFrom, sim.zone)}` : `From ${formatDate(statePensionAge(person), sim.zone)}`} />
              <Stat label="Claimed" value={person.statePensionFrom !== undefined ? 'Yes' : 'Not Yet'} note={statePensionRefusal(sim, person) ?? 'You can claim it now'} />
            </div>
            <Fine>A tax year qualifies with UK earnings at the Lower Earnings Limit, {formatMoney(STATE_PENSION.lowerEarningsLimit, 'GBP', { cents: false })} in 2026/27, or with the credits Universal Credit gives; each is a thirty-fifth of the full {formatMoney(STATE_PENSION.weekly[STATE_PENSION.weekly.length - 1]![1], 'GBP')} a week (2026/27). State Pension age is 68 for anyone born after 5 April 1978, by the Pensions Act 2007. SLATE holds the limit and the rate at 2026/27’s. Source: {STATE_PENSION.source}.</Fine>
          </div>
        </Panel>
      )}
      {(irishContributions(person, cur) > 0 || person.irishPension || livesInIreland(person)) && (
        <Panel title="State Pension (Ireland)" subtitle="Ireland’s, on your PRSI contributions" actions={irishPensionRefusal(sim, person) ? undefined : <Gated feature="pension.ie_state" onClick={() => { const r = run<{ weekly: number }>('pension.ie_state'); if (r.ok) toast(`Claimed: ${money(r.value!.weekly)} a week.`, 'positive'); }}>Claim It</Gated>} help="papers.pensions">
          <div className="col gap-3">
            <div className="grid grid-3">
              <Stat label="Contributions" value={String(irishContributions(person, cur))} note={`${IRISH_PENSION.paidNeeded} for any, ${IRISH_PENSION.forFull.toLocaleString('en-US')} for the full rate`} />
              <Stat label="A Week At 66" value={formatMoney(inSaveMoney(sim, person.irishPension?.weeklyEur ?? irishWeekly(irishContributions(person, cur), IRISH_PENSION.age), 'EUR'), cur)} note={person.irishPension ? `Claimed ${formatDate(person.irishPension.from, sim.zone)}` : 'More claimed at 67, and at 68'} />
              <Stat label="Claimed" value={person.irishPension ? 'Yes' : 'Not Yet'} note={irishPensionRefusal(sim, person) ?? 'You can claim it now'} />
            </div>
            <Fine>A calendar year of Irish earnings at €5,000 or more counts as 52 contributions; the week is the full rate times your contributions over 2,080: €299.30 at 66, €313.40 claimed at 67, €328.90 at 68 (2026). A short record or none, living in Ireland: the means-tested pension instead, €288 a week (€298 from 80) less your means over €30, whichever is higher; and the Fuel Allowance, €38 a week through the winter, with the means-tested one. (The €22 Living Alone Increase isn’t kept since the home went.) SLATE holds the rates at 2026’s. Source: {IRISH_PENSION.source}.</Fine>
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
            <Fine>A day’s work in Mexico is a day registered with IMSS, and its pay puts the year’s retirement contribution for its band into your AFORE account; weeks are days over seven. From 65 with the year’s weeks, the account buys a pension, never less than the guaranteed floor, topped up by the Fondo de Pensiones para el Bienestar to your last year’s wage, to MXN 17,885.85 a month. The account’s annuity is SLATE’s estimate. Source: {IMSS.source}.</Fine>
          </div>
        </Panel>
      )}
      {isoOfCountry(person.citizenshipId) === 'MX' && (
        <Panel title="Pensión Para El Bienestar" subtitle="Mexico’s, for every Mexican living there from 65" actions={bienestarRefusal(sim, person) ? undefined : <Gated feature="pension.bienestar" onClick={() => { const r = run<{ bimonthly: number }>('pension.bienestar'); if (r.ok) toast(`Claimed: ${money(r.value!.bimonthly)} every two months.`, 'positive'); }}>Claim It</Gated>} help="papers.pensions">
          <div className="col gap-3">
            <Stat label="Claimed" value={person.bienestarFrom !== undefined ? 'Yes' : 'Not Yet'} note={bienestarRefusal(sim, person) ?? 'You can claim it now'} />
            <Fine>MXN 6,400 every two months, not contributory, paid while you live in Mexico (2026 rules). Source: {BIENESTAR.source}.</Fine>
          </div>
        </Panel>
      )}
    </>
  );
}
