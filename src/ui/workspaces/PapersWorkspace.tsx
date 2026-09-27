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
import { BENCHMARK_SOURCE, BENEFIT_STATE, CALIFORNIA_MANDATE, CALIFORNIA_UI, NEW_YORK_UI, PREMIUM_CREDIT, RETURN } from '@/engine/content/safetynet';
import { UNION_HEALTH } from '@/engine/content/career';
import { deadline, returnsOf } from '@/engine/systems/taxreturn';
import { COVER_LABEL, benchmarkFor, coverOn, healthOf, mayEnroll } from '@/engine/systems/health';
import { basePeriodFor, unemploymentOf } from '@/engine/systems/unemployment';
import { zonedParts } from '@/engine/core/time';

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
            Each February, a year that left you owing or owed has its return ready. {thisYear}’s is due {formatDate(deadline(thisYear), sim.zone)}.
          </p>
        </Panel>
      )}
      {returns.map((r) => {
        const f = r.figures;
        const lines: [string, number][] = [
          ['Acting Wages, With Residuals', f.acting],
          ['Work-Study Wages', f.workStudy],
          ['Unemployment Insurance', f.unemployment],
          ['Performing Artist Deduction', -f.deduction],
          ['Income Tax', f.incomeTax],
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
        Due 15 April, or the next business day. Filed late with a balance, 5% of it a month or part of one, to a quarter of it, with at least {formatMoney(RETURN.lateMinimum, cur)} past 60 days; paid late, 0.5% a month. A refund comes {RETURN.refundDays} days after filing. The performing artist deduction takes your commission and dues off an income of {formatMoney(RETURN.performingArtistIncome, cur)} or less, from two employers or more; otherwise the job’s costs aren’t deductible. The tax is the federal and state law SLATE carries for where you lived. Source: {RETURN.source}.
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
  const state = BENEFIT_STATE[person.currentLocationId];
  const year = zonedParts(sim.now, sim.zone).year;
  const may = mayEnroll(person, sim.now);
  const enrolled = h.marketplace && (h.marketplace.until === undefined || h.marketplace.until > sim.now);
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
        subtitle={state ? `${formatMoney(benchmarkFor(state, year, cur), cur)} a month for the benchmark silver plan` : 'In New York or Los Angeles'}
        actions={enrolled
          ? <Gated feature="health.drop" onClick={() => { if (run('health.drop').ok) toast('It ends at the month’s end.', 'positive'); }}>Drop The Plan</Gated>
          : <Gated feature="health.enroll" onClick={() => { if (run('health.enroll').ok) toast('Enrolled, from the first of next month.', 'positive'); }}>Enroll</Gated>}
      >
        <div className="col gap-3">
          <p className="small" style={{ margin: 0 }}>
            {enrolled ? `Enrolled from ${formatDate(h.marketplace!.from, sim.zone)}. ` : `${may.why} `}
            {enrolled && (cover === 'sag' || cover === 'equity') ? `${COVER_LABEL[cover]} covers you too, so the plan’s premium buys nothing more while it does. ` : ''}
            You pay the whole premium each month, and the return gives back what’s over your share of income: none over {PREMIUM_CREDIT.cutoff * 100}% of the poverty line, since the enhanced credits ended with 2025.
            {CITIES.get(person.currentLocationId)?.parentId === 'us-ca' ? ` In California a month without cover costs its penalty on the return: the greater of ${formatMoney(CALIFORNIA_MANDATE.flat, cur)} a year and ${CALIFORNIA_MANDATE.share * 100}% of income, a twelfth a month, to ${formatMoney(CALIFORNIA_MANDATE.bronzeMonth, cur)}; ${h.uncoveredInCalifornia[year] ?? 0} this year so far.` : ''}
          </p>
          <p className="xs dim" style={{ margin: 0 }}>
            The benchmark premiums are SLATE’s estimate from published rates. Earned union cover: SAG-AFTRA’s from 12 months’ earnings at its threshold, for a quarterly premium; Equity-League’s from {UNION_HEALTH.equityWeeks} weeks of Equity work in 12 months, {formatMoney(UNION_HEALTH.equityPremium, cur)} a quarter. Source: {UNION_HEALTH.source}; {BENCHMARK_SOURCE}; {CALIFORNIA_MANDATE.source}.
          </p>
        </div>
      </Panel>
    </div>
  );
}

/** A claim: filing it, what it pays, and what it's paid. */
function BenefitsPane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const record = unemploymentOf(person);
  const claim = record.claim;
  const state = BENEFIT_STATE[person.currentLocationId];
  const preview = state ? basePeriodFor(person, state, sim.now, cur) : undefined;
  const source = state === 'ca' ? CALIFORNIA_UI.source : NEW_YORK_UI.source;
  return (
    <div className="col gap-5">
      <Panel
        title={claim ? `A ${claim.state === 'ny' ? 'New York' : 'California'} Claim` : 'No Claim Open'}
        subtitle={claim ? `Filed ${formatDate(claim.filedAt, sim.zone)}` : undefined}
        actions={claim ? undefined : <Gated feature="benefits.claim" onClick={() => { const a = run<{ weekly: number }>('benefits.claim'); if (a.ok) toast(`Filed: ${money(a.value!.weekly)} a week.`, 'positive'); }}>File A Claim</Gated>}
      >
        <div className="col gap-3">
          {claim ? (
            <div className="grid grid-3">
              <Stat label="A Week" value={money(claim.weekly)} note={claim.waited ? 'The waiting week is served' : 'The first week due is unpaid'} />
              <Stat label="Paid" value={money(claim.paid)} note={`${claim.weeksPaid} weeks`} />
              <Stat label="At Most" value={money(claim.maxTotal)} note={`Until ${formatDate(claim.endsAt, sim.zone)}`} />
            </div>
          ) : (
            <p className="small" style={{ margin: 0 }}>
              {!state ? 'SLATE pays unemployment in New York and California, where you’d have to live.' : preview!.result.ok ? `Filed now, your base period, ${preview!.quarters.join(', ')}, pays ${preview!.result.why}` : `Filed now, it wouldn’t pay: ${preview!.result.why}`}
            </p>
          )}
          <p className="small" style={{ margin: 0 }}>
            Each Sunday the week is certified for you. A week with work pays {state === 'ca' ? 'the benefit less the earnings past the greater of $25 and a quarter of them' : 'by its hours, and nothing where the pay reaches the maximum'}; a week away from the state pays nothing. What’s paid is income on your return{state === 'ca' ? ', federally; California doesn’t tax it' : ''}.
          </p>
          <p className="xs dim" style={{ margin: 0 }}>Source: {source}.</p>
        </div>
      </Panel>
      {record.past.length > 0 && (
        <Panel title="Past Claims">
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Filed</th><th scope="col" className="num">A Week</th><th scope="col" className="num">Weeks Paid</th><th scope="col" className="num">Paid</th></tr></thead>
              <tbody>{record.past.map((c) => <tr key={c.filedAt}><td>{formatDate(c.filedAt, sim.zone)}</td><td className="num mono">{money(c.weekly)}</td><td className="num mono">{c.weeksPaid}</td><td className="num mono">{money(c.paid)}</td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
