/**
 * SLATE — taxes and cover: the returns, health cover after school, and
 * unemployment insurance (`systems/taxreturn.ts`, `systems/health.ts`,
 * `systems/unemployment.ts`), in three tabs. Every figure is one those
 * systems read or write: each year's return worked out line by line, what
 * covers them this month and what it costs, and a claim's weekly benefit and
 * what it has paid.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { ABROAD, BENCHMARK_SOURCE, BENEFIT_STATE, CALIFORNIA_MANDATE, CALIFORNIA_UI, CONNECTICUT_UI, CARE, CHRONIC, COBRA, DENTAL_PLANS, DENTAL_VISION, INSULIN, PHARMACY, MEDICAL_DEBT, NEW_YORK_UI, PLANS_SOURCE, PREMIUM_CREDIT, PUBLIC_COVER, RETURN } from '@/engine/content/safetynet';
import { UNION_HEALTH } from '@/engine/content/career';
import { deadline, returnsOf } from '@/engine/systems/taxreturn';
import { CONDITION_LABEL, COVER_LABEL, PROGRAM_NAMES, benchmarkFor, coverOn, dentalPlanFor, grown, healthOf, mayEnroll, medicalDebtOf, planOf, type Condition } from '@/engine/systems/health';
import { homeOf } from '@/engine/systems/earnings';
import { titleCaseLabel } from '@/engine/core/text';
import { basePeriodFor, unemploymentOf } from '@/engine/systems/unemployment';
import { zonedParts } from '@/engine/core/time';
import { inSaveMoney } from '@/engine/systems/banking';
import { working } from '@/engine/systems/career';

type PapersTab = 'returns' | 'health' | 'benefits';

const PAPERS_TABS: readonly { id: PapersTab; label: string }[] = [
  { id: 'returns', label: 'Tax Returns' },
  { id: 'health', label: 'Health Cover' },
  { id: 'benefits', label: 'Unemployment' },
];

export function PapersWorkspace() {
  const [tab, setTab] = useState<PapersTab>('returns');
  const panes: Record<PapersTab, JSX.Element> = { returns: <ReturnsPane />, health: <HealthPane />, benefits: <BenefitsPane /> };
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Money</div>
        <h1>Taxes And Cover</h1>
        <p className="muted">Your returns, your health cover, and unemployment between jobs.</p>
      </div>
      <div className="tabs" role="tablist" aria-label="Taxes And Cover">
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
  return (
    <div className="col gap-5">
      {returns.length === 0 && (
        <Panel title="No Returns Yet">
          <p className="small" style={{ margin: 0 }}>
            Each February, a year with any income, or anything owed or due back, has its return ready. {thisYear}’s is due {formatDate(deadline(thisYear), sim.zone)}.
          </p>
        </Panel>
      )}
      {returns.map((r) => {
        const f = r.figures;
        const lines: [string, number][] = [
          ['Acting Wages, With Residuals', f.acting],
          ['Work-Study Wages', f.workStudy],
          ['Scholarship For Living Costs', f.scholarship ?? 0],
          ['Unemployment Insurance', f.unemployment],
          ['Interest', f.interest ?? 0],
          ['Performing Artist Deduction', -f.deduction],
          ['Federal Income Tax', f.federal],
          ['Of It, The Credit For Another Country’s Tax', -(f.foreignCredit ?? 0)],
          ['Canada’s Tax Refunded, By Its Treaty Or Its Return', -(f.foreignRefund ?? 0)],
          ...(f.states ?? []).flatMap((l) => [[`${stateName(l.state)} Income Tax`, l.tax], ...(l.credit ? [[`${stateName(l.state)}’s Credit For Another State’s Tax`, -l.credit]] : [])] as [string, number][]),
          ['City Income Tax', f.local ?? 0],
          ['Income Tax In All', f.incomeTax],
          ['Social Security And Medicare', f.payroll],
          ['California’s Penalty For No Cover', f.mandate],
          ['Premium Tax Credit', -f.credit],
          ['Withheld From Your Pay', -f.withheld],
        ];
        return (
          <Panel
            key={r.year}
            title={`${r.year} Return`}
            subtitle={r.filedAt !== undefined ? `Filed ${formatDate(r.filedAt, sim.zone)}` : `Due ${formatDate(r.due, sim.zone)}`}
            actions={r.filedAt === undefined
              ? <Gated feature="tax.file" onClick={() => { const a = run<{ balance: number; penalty: number; paid: boolean }>('tax.file', { year: r.year }); if (a.ok) toast(a.value!.balance < 0 ? `Filed. ${money(-a.value!.balance)} comes back in ${RETURN.refundDays} days.` : a.value!.paid ? 'Filed and paid.' : 'Filed. The bank couldn’t pay it: it’s owed.', 'positive'); }}>File It</Gated>
              : r.owed ? <Gated feature="tax.pay" onClick={() => { if (run('tax.pay', { year: r.year }).ok) toast('Paid.', 'positive'); }}>Pay What’s Owed</Gated> : undefined}
          >
            <div className="col gap-3">
              <div className="table-scroll">
                <table>
                  <tbody>
                    {lines.filter(([, v]) => v !== 0).map(([label, v]) => <tr key={label}><td>{label}</td><td className="num mono">{money(v)}</td></tr>)}
                    <tr className="strong"><td>{f.balance > 0 ? 'You Owe' : 'Comes Back To You'}</td><td className="num mono">{money(Math.abs(f.balance))}</td></tr>
                    {r.penalty ? <tr><td>Late Penalties</td><td className="num mono">{money(r.penalty)}</td></tr> : null}
                    {r.owed ? <tr><td>Still Owed</td><td className="num mono">{money(r.owed)}</td></tr> : null}
                    {r.refundAt !== undefined ? <tr><td>Refund Arrives</td><td className="num mono">{formatDate(r.refundAt, sim.zone)}</td></tr> : null}
                  </tbody>
                </table>
              </div>
              <p className="xs dim" style={{ margin: 0 }}>Filed from {CITIES.require(f.cityId).name}, where you last lived that year.</p>
            </div>
          </Panel>
        );
      })}
      <p className="xs dim" style={{ margin: 0 }}>
        Due 15 April, or the next business day. Filed late with a balance, 5% of it a month or part of one, to a quarter of it, with at least {formatMoney(inSaveMoney(sim, RETURN.lateMinimum, 'USD'), cur)} past 60 days; paid late, 0.5% a month. A refund comes {RETURN.refundDays} days after filing. The performing artist deduction takes your commission, dues and the job’s other costs you kept receipts for off an income of {formatMoney(inSaveMoney(sim, RETURN.performingArtistIncome, 'USD'), cur)} or less, from two employers paying {formatMoney(inSaveMoney(sim, RETURN.performingArtistEmployerPay, 'USD'), cur)} or more, where the costs are over a tenth of the acting wages; otherwise federally they aren’t deductible. The tax is the federal and state law SLATE carries for where you lived. Work in Canada is taxed at 23% as it’s paid, all of it back under CAD 15,000 in the year and, over it, a Canadian return filed with this one by 30 April gives back what’s past its graduated tax. Work in the United Kingdom is taxed 20% by a payer paying you past £12,570 in its tax year, and settled with its own return each 31 January. Source: {RETURN.source}; {ABROAD.source}.
      </p>
    </div>
  );
}

/** What covers them, the unions' plans, and the marketplace. */
function HealthPane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const h = healthOf(person);
  const cover = coverOn(person, sim.now);
  const state = BENEFIT_STATE[homeOf(person)];
  const year = zonedParts(sim.now, sim.zone).year;
  const may = mayEnroll(person, sim.now, cur);
  const ownPlan = [h.marketplace, h.cobra, h.program].find((r) => r && (r.until === undefined || r.until > sim.now));
  const enrolled = ownPlan !== undefined;
  const plan = planOf(person, sim.now);
  const debt = medicalDebtOf(sim, person);
  const bills = [...h.bills].reverse().slice(0, 10);
  const until = (r?: { from: number; until: number }) => (r && r.until > sim.now ? `${formatDate(r.from, sim.zone)} to ${formatDate(r.until, sim.zone)}` : 'None');
  return (
    <div className="col gap-5">
      <Panel title="Your Cover">
        <div className="grid grid-3">
          <Stat label="This Month" value={cover ? COVER_LABEL[cover] : 'None'} tone={cover ? undefined : 'warning'} />
          <Stat label="SAG-AFTRA Health Plan" value={until(h.sag)} />
          <Stat label="Equity-League Health" value={until(h.equity)} />
        </div>
      </Panel>
      <Panel
        title="The Marketplace"
        subtitle={state ? `${formatMoney(benchmarkFor(state, year, cur), cur)} a month for the benchmark silver plan` : 'In New York, Los Angeles or New Haven'}
        actions={enrolled
          ? <Gated feature="health.drop" onClick={() => { if (run('health.drop').ok) toast('It ends at the month’s end.', 'positive'); }}>Drop The Plan</Gated>
          : !may.ok ? undefined : <Gated feature="health.enroll" onClick={() => { const a = run<{ kind: string }>('health.enroll'); if (a.ok) toast(`Enrolled in ${a.value!.kind === 'marketplace' ? 'the marketplace' : state ? PROGRAM_NAMES[state][a.value!.kind as 'medicaid' | 'essential'] : 'Medicaid'}, from the first of next month.`, 'positive'); }}>Enroll</Gated>}
      >
        <div className="col gap-3">
          <p className="small" style={{ margin: 0 }}>
            {enrolled ? `Enrolled from ${formatDate(ownPlan!.from, sim.zone)}. ` : `${may.why} `}
            On a low month’s income, Medicaid (Medi-Cal in California, HUSKY D in Connecticut) takes you at 138% of the poverty line, in New York the Essential Plan to 200%, and in Connecticut Covered Connecticut to 175% of the year before’s, at any time and with no premium; from 2027 Medicaid asks for {PUBLIC_COVER.workHours} hours’ work or {formatMoney(inSaveMoney(sim, PUBLIC_COVER.workEarnings, 'USD'), cur)} a month at renewal.{' '}
            {enrolled && (cover === 'sag' || cover === 'equity') ? `${COVER_LABEL[cover]} covers you too, so the plan’s premium buys nothing more while it does. ` : ''}
            You pay the whole premium each month, and the return gives back what’s over your share of income: none over {PREMIUM_CREDIT.cutoff * 100}% of the poverty line, since the enhanced credits ended with 2025.
            {CITIES.get(person.currentLocationId)?.parentId === 'us-ca' ? ` In California a month without cover costs its penalty on the return: the greater of ${formatMoney(inSaveMoney(sim, CALIFORNIA_MANDATE.flat, 'USD'), cur)} a year and ${CALIFORNIA_MANDATE.share * 100}% of income, a twelfth a month, to ${formatMoney(inSaveMoney(sim, CALIFORNIA_MANDATE.bronzeMonth, 'USD'), cur)}; ${h.uncoveredInCalifornia[year] ?? 0} this year so far.` : ''}
          </p>
          <p className="xs dim" style={{ margin: 0 }}>
            The benchmark premiums are SLATE’s estimate from published rates. Earned union cover: SAG-AFTRA’s from 12 months’ earnings at its threshold, for a quarterly premium; Equity-League’s from {UNION_HEALTH.equityWeeks} weeks of Equity work in 12 months, {formatMoney(inSaveMoney(sim, UNION_HEALTH.equityPremium, 'USD'), cur)} a quarter. Source: {UNION_HEALTH.source}; {BENCHMARK_SOURCE}; {CALIFORNIA_MANDATE.source}.
          </p>
        </div>
      </Panel>

      {h.cobraOffer && h.cobraOffer.until > sim.now && (
        <Panel
          title="COBRA"
          subtitle={`Elect by ${formatDate(h.cobraOffer.until, sim.zone)}`}
          actions={<Gated feature="health.elect_cobra" onClick={() => { if (run('health.elect_cobra').ok) toast('Elected: covered from the day your plan ended.', 'positive'); }}>Elect COBRA</Gated>}
        >
          <p className="small" style={{ margin: 0 }}>
            Your {COVER_LABEL[h.cobraOffer.plan]} ended {formatDate(h.cobraOffer.lostAt, sim.zone)}. COBRA keeps it for up to {COBRA.months} months, back to that day, at {formatMoney(inSaveMoney(sim, COBRA.premium[h.cobraOffer.plan], 'USD'), cur)} a month; New York pays three-quarters of it for a year where last month’s income is {formatMoney(inSaveMoney(sim, COBRA.newYorkIncome, 'USD'), cur)} or less. Source: {COBRA.source}.
          </p>
        </Panel>
      )}

      <ConditionsPanel />
      <DentalPanel />

      <Panel
        title="Care And Its Bills"
        subtitle={plan ? `${plan.label}: ${formatMoney(h.spent[year] ?? 0, cur)} of ${formatMoney(inSaveMoney(sim, plan.outOfPocket, 'USD'), cur)} paid this year` : 'Uninsured: you pay the price, less a hospital’s charity'}
        actions={debt && debt.balance < 0 ? <Gated feature="health.pay_bill" onClick={() => { if (run('health.pay_bill', { amount: -debt.balance }).ok) toast('Paid off.', 'positive'); }}>Pay It Off</Gated> : undefined}
      >
        <div className="col gap-3">
          {debt && debt.balance < 0 && <Stat label="Medical Debt" value={formatMoney(-debt.balance, cur)} tone="warning" note={`On your record only at ${formatMoney(inSaveMoney(sim, MEDICAL_DEBT.reportAt, 'USD'), cur)}, a year past due, and outside New York and California`} />}
          {bills.length > 0 && (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Care</th><th scope="col">When</th><th scope="col" className="num">Your Share</th><th scope="col">Due</th></tr></thead>
                <tbody>{bills.map((b) => <tr key={b.id}><td>{titleCaseLabel(b.what)}</td><td>{formatDate(b.at, sim.zone)}</td><td className="num mono">{formatMoney(b.amount, cur)}</td><td>{b.paid ? 'Settled' : formatDate(b.dueAt, sim.zone)}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          <p className="xs dim" style={{ margin: 0 }}>
            Illness comes at the rates of an adult your age: about {CARE.perYear.visit} doctor’s visits a year, {CARE.perYear.emergency} emergency visits, a stay in hospital one year in 25, and the flu one season in eleven. Care costs what it costs your plan: {formatMoney(inSaveMoney(sim, grown(CARE.price.visit, 'visit', sim.now), 'USD'), cur)} a visit, {formatMoney(inSaveMoney(sim, grown(CARE.price.emergency, 'emergency', sim.now), 'USD'), cur)} an emergency visit and {formatMoney(inSaveMoney(sim, grown(CARE.price.stay, 'stay', sim.now), 'USD'), cur)} a stay at this year’s commercial prices, grown from their year by the medical price index, and the uninsured are billed more. A bill is due in {MEDICAL_DEBT.dueDays} days. Source: {CARE.source}; {PLANS_SOURCE}.
          </p>
        </div>
      </Panel>
    </div>
  );
}

/** The conditions carried, and keeping each up or not. */
function ConditionsPanel() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const person = useWorld((s) => s.player);
  const h = healthOf(person);
  const conditions = Object.entries(h.chronic ?? {}) as [Condition, { treated: boolean; lapsed?: boolean; typeOne?: boolean }][];
  if (!conditions.length && !h.lenses) return null;
  return (
    <Panel title="Your Conditions" subtitle={h.lenses ? 'You wear prescription lenses' : undefined}>
      <div className="col gap-3">
        {conditions.map(([condition, state]) => (
          <div key={condition} className="row-between small">
            <span>{CONDITION_LABEL[condition]}{condition === 'diabetes' ? (state.typeOne ? ', Type 1' : ', Type 2') : ''}: {state.treated ? (state.lapsed ? 'Kept Up, But This Month’s Care Went Unpaid' : 'Kept Up') : 'Left Alone'}</span>
            <Gated feature="health.treat" onClick={() => { const a = run<{ treated: boolean }>('health.treat', { condition, on: !state.treated }); if (a.ok) toast(a.value!.treated ? 'Kept up from this month.' : 'Left alone.', 'positive'); }}>
              {state.treated ? 'Let It Go' : 'Keep It Up'}
            </Gated>
          </div>
        ))}
        <p className="xs dim" style={{ margin: 0 }}>
          Drawn at the rates of adults 18 to 34: depression {CHRONIC.share.depression * 100}%, asthma {(CHRONIC.share.asthma * 100).toFixed(1)}%, high blood pressure {(CHRONIC.share.hypertension * 100).toFixed(1)}%, diabetes {(CHRONIC.share.diabetes * 100).toFixed(1)}%, arthritis {(CHRONIC.share.arthritis * 100).toFixed(1)}%. Kept up, each month’s care is paid then, at what your plan leaves: therapy twice and a generic for depression, a brand inhaler for asthma, a generic for blood pressure, insulin and a glucose monitor (or a generic for type 2) and a visit a quarter for diabetes, a generic for arthritis. Insulin is never more than the makers’ {formatMoney(inSaveMoney(sim, INSULIN.cashCap, 'USD'), cur)} a month, and nothing on a plan New York regulates; the monitor never more than Abbott’s {formatMoney(inSaveMoney(sim, INSULIN.monitor.program, 'USD'), cur)}. Left alone, depression weighs on your morale each week, asthma doubles your emergencies, type 1 diabetes quadruples them, diabetes wears your body down and arthritis tires it, which is SLATE’s estimate. Source: {CHRONIC.source}; {INSULIN.source}; {PHARMACY.source}; {DENTAL_VISION.source}.
        </p>
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
  const year = zonedParts(sim.now, sim.zone).year;
  return (
    <Panel
      title="A Dental Plan"
      subtitle={`${d.label}: ${formatMoney(inSaveMoney(sim, d.premium, 'USD'), cur)} ${d.yearly ? 'a year' : 'a month'}`}
      actions={own
        ? (d.yearly ? undefined : <Gated feature="health.dental" onClick={() => { if (run('health.dental', { on: false }).ok) toast('It ends at the month’s end.', 'positive'); }}>Drop Dental</Gated>)
        : <Gated feature="health.dental" onClick={() => { if (run('health.dental', { on: true }).ok) toast('Covered for the dentist from today.', 'positive'); }}>Buy Dental</Gated>}
    >
      <div className="col gap-3">
        {own && <Stat label="Paid By The Plan This Year" value={`${formatMoney(own.paid[year] ?? 0, cur)} of ${formatMoney(inSaveMoney(sim, d.max, 'USD'), cur)}`} />}
        <p className="xs dim" style={{ margin: 0 }}>
          Cleanings in full; a filling at {d.basic * 100}% after a {formatMoney(inSaveMoney(sim, d.deductible, 'USD'), cur)} deductible, to {formatMoney(inSaveMoney(sim, d.max, 'USD'), cur)} a year. It pays only where your health plan doesn’t. {offered === 'ca' ? 'Covered California sells it only beside its own plan, and it ends with that plan; its Los Angeles premium is SLATE’s estimate.' : offered === 'yale' ? 'Paid for the year to 30 September, and not canceled once paid.' : 'Bought on its own through NY State Of Health; its premium and its share of a filling are SLATE’s estimate.'} Source: {DENTAL_PLANS.source}.
        </p>
      </div>
    </Panel>
  );
}

const STATE_NAMES: Record<string, string> = { 'us-ny': 'New York', 'us-ca': 'California', 'us-ct': 'Connecticut', 'us-ga': 'Georgia', 'us-il': 'Illinois', 'us-la': 'Louisiana' };
const stateName = (state: string) => STATE_NAMES[state] ?? state;

/** A claim: filing it, what it pays, and what it's paid. */
function BenefitsPane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const record = unemploymentOf(person);
  const claim = record.claim;
  // Filed where they live (`homeOf`); until 2026-09-27 this read where they stood.
  const state = BENEFIT_STATE[homeOf(person)];
  const preview = state ? basePeriodFor(person, state, sim.now, cur) : undefined;
  const source = state === 'ca' ? CALIFORNIA_UI.source : state === 'ct' ? CONNECTICUT_UI.source : NEW_YORK_UI.source;
  const partial = state === 'ca' ? 'the benefit less the earnings past the greater of $25 and a quarter of them' : state === 'ct' ? 'the benefit less two-thirds of the pay' : 'by its hours, and nothing where the pay reaches the maximum';
  return (
    <div className="col gap-5">
      <Panel
        title={claim ? `A ${stateName(`us-${claim.state}`)} Claim` : 'No Claim Open'}
        subtitle={claim ? `Filed ${formatDate(claim.filedAt, sim.zone)}` : undefined}
        actions={claim || !state || !preview?.result.ok || working(sim, person) ? undefined : <Gated feature="benefits.claim" onClick={() => { const a = run<{ weekly: number }>('benefits.claim'); if (a.ok) toast(`Filed: ${money(a.value!.weekly)} a week.`, 'positive'); }}>File A Claim</Gated>}
      >
        <div className="col gap-3">
          {claim ? (
            <div className="grid grid-3">
              <Stat label="A Week" value={money(claim.weekly)} note={claim.state === 'ct' ? 'Connecticut has no waiting week' : claim.waited ? 'The waiting week is served' : 'The first week due is unpaid'} />
              <Stat label="Paid" value={money(claim.paid)} note={`${claim.weeksPaid} weeks`} />
              <Stat label="At Most" value={money(claim.maxTotal)} note={`Until ${formatDate(claim.endsAt, sim.zone)}`} />
            </div>
          ) : (
            <p className="small" style={{ margin: 0 }}>
              {!state ? 'SLATE pays unemployment in New York, California and Connecticut, where you’d have to live.' : preview!.result.ok ? `Filed now, your base period, ${preview!.quarters.join(', ')}, pays ${preview!.result.why}` : `Filed now, it wouldn’t pay: ${preview!.result.why}`}
            </p>
          )}
          <p className="small" style={{ margin: 0 }}>
            Each Sunday the week is certified for you, from anywhere in the country as an interstate claim is; a week abroad pays nothing. A week with work pays {partial}. What’s paid is income on your return{state === 'ca' ? ', federally; California doesn’t tax it' : ''}.
          </p>
          <p className="xs dim" style={{ margin: 0 }}>Source: {source}.</p>
        </div>
      </Panel>
      {record.past.length > 0 && (
        <Panel title="Past Claims">
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Filed</th><th scope="col">Base Period</th><th scope="col">Closed</th><th scope="col" className="num">A Week</th><th scope="col" className="num">Weeks Paid</th><th scope="col" className="num">Paid</th></tr></thead>
              <tbody>{record.past.map((c) => <tr key={c.filedAt}><td>{formatDate(c.filedAt, sim.zone)}</td><td className="mono">{c.basePeriod.length ? `${c.basePeriod[0]} to ${c.basePeriod[c.basePeriod.length - 1]}` : '—'}</td><td>{c.closedAt !== undefined ? formatDate(c.closedAt, sim.zone) : '—'}</td><td className="num mono">{money(c.weekly)}</td><td className="num mono">{c.weeksPaid}</td><td className="num mono">{money(c.paid)}</td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
