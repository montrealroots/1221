/**
 * A tax lien's record on Papers (from the remaining-gaps pass of 2026-10-11): which authority filed it and why, what it
 * secured, where it's recorded, its fees, its dates and what's next; the request a release asks where the authority's
 * rule asks one, and the request to withdraw one filed in error, each refused with its reason where it can't be made.
 * Beside it, Oregon's three-year penalty and its waiver.
 */
import { useGame, useWorld } from '@/app/game-context';
import { Fine, WhyNot } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatDate } from '@/engine/core/time';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { agencyOf, lienDisputeRefusal, lienReleaseRefusal, lienReleaseWords, rulesOf, stateName, waiverRefusal, waiverShare, type Lien } from '@/engine/systems/statetax';
import { FEDERAL_LIEN, federalLienInError, federalLienWithdrawRefusal, returnsOf } from '@/engine/systems/taxreturn';

const STATUS: Record<Lien['status'], string> = {
  intent: 'Notice Of Intent Sent',
  filed: 'Filed',
  paid: 'Paid: Release To Come',
  released: 'Released',
  disputed: 'Asked To Be Withdrawn',
  withdrawn: 'Withdrawn',
  dropped: 'Not Filed',
};

function LienFacts({ l, money, zone }: { l: Lien; money: (c: number) => string; zone: string }) {
  return (
    <>
      <p className="small" style={{ margin: 0 }}>
        <strong>{l.name}</strong> · {STATUS[l.status]}. {l.trigger === 'plan' ? 'Filed as its payment plan asks.' : 'Filed as its collection reached that step.'} It secured {money(l.amount)}, recorded with {l.recordedAt}
        {l.filedAt !== undefined ? ` on ${formatDate(l.filedAt, zone)}` : ''}{l.fee ? `, its recording fee ${money(l.fee)} added to what’s owed` : ''}.
        {l.releaseDue !== undefined && l.status === 'paid' ? ` To be released by ${formatDate(l.releaseDue, zone)}.` : ''}
        {l.releasedAt !== undefined ? ` Released ${formatDate(l.releasedAt, zone)}.` : ''}
        {l.decideAt !== undefined && l.status === 'disputed' ? ` A decision by ${formatDate(l.decideAt, zone)}.` : ''}
        {l.withdrawnAt !== undefined ? ` Withdrawn ${formatDate(l.withdrawnAt, zone)}.` : ''}
      </p>
      {l.history.length > 0 && (
        <details className="small"><summary>The Lien’s History</summary>
          <ul style={{ margin: 0 }}>{l.history.map((h, i) => <li key={i}>{formatDate(h.at, zone)}: {h.what}{h.amount !== undefined ? `, ${money(h.amount)}` : ''}.</li>)}</ul>
        </details>
      )}
    </>
  );
}

/** A state's or city's lien on a year, and Oregon's three-year penalty. */
export function StateLienAndPenalty({ year, state }: { year: number; state: string }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const r = returnsOf(person)[String(year)];
  const sd = r?.stateDue?.[state];
  const rules = rulesOf(state);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  if (!r || !sd || !rules) return null;
  const l = sd.lien;
  const release = lienReleaseRefusal(sim, person, r, state);
  const dispute = lienDisputeRefusal(r, state);
  const waive = waiverRefusal(sim, r, state);
  return (
    <>
      {l && rules.lien && (
        <div className="col gap-1">
          <div className="eyebrow">{`${agencyOf(state)}’s Lien`}</div>
          <LienFacts l={l} money={money} zone={sim.zone} />
          <p className="xs dim" style={{ margin: 0 }}>{rules.lien.effect} It’s released {lienReleaseWords(rules.lien)}. Filed in error, it’s withdrawn on request: {rules.lien.error.how}.</p>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            <Gated feature="tax.lien_release" className="btn btn-sm btn-ghost" disabled={Boolean(release)} title={release} onClick={() => { const a = run<{ releaseDue?: number }>('tax.lien_release', { state, year }); if (a.ok) toast(a.value!.releaseDue !== undefined ? `Asked: released by ${formatDate(a.value!.releaseDue, sim.zone)}.` : 'Released.', 'positive'); }}>Ask For Its Release</Gated>
            <Gated feature="tax.lien_dispute" className="btn btn-sm btn-ghost" disabled={Boolean(dispute)} title={dispute} onClick={() => { const a = run<{ decideAt: number }>('tax.lien_dispute', { state, year }); if (a.ok) toast(`Asked: ${agencyOf(state)} decides by ${formatDate(a.value!.decideAt, sim.zone)}.`, 'positive'); }}>Ask For Its Withdrawal As Filed In Error</Gated>
          </div>
          <WhyNot reasons={[['Ask For Its Release', release], ['Ask For Its Withdrawal As Filed In Error', dispute]]} />
        </div>
      )}
      {sd.threeYear && rules.threeYear && (
        <div className="col gap-1">
          <div className="eyebrow">Three Years Unfiled</div>
          <p className="small" style={{ margin: 0 }}>
            {money(sd.threeYear.amount)} added on {formatDate(sd.threeYear.at, sim.zone)}: {Math.round(rules.threeYear.share * 100)}% of the year’s tax, with no {stateName(state)} return for three years running (ORS 305.992), the year’s penalties held to its tax.
            {sd.threeYear.waived !== undefined ? ` ${money(sd.threeYear.waived)} of it waived ${formatDate(sd.threeYear.waivedAt!, sim.zone)}.` : ` Its waiver, asked now, would be ${Math.round(waiverShare(r, state) * 100)}% by its schedule.`}
          </p>
          <div className="row gap-2"><Gated feature="tax.request_waiver" className="btn btn-sm btn-ghost" disabled={Boolean(waive)} title={waive} onClick={() => { const a = run<{ waived: number }>('tax.request_waiver', { state, year }); if (a.ok) toast(`Waived: ${money(a.value!.waived)}.`, 'positive'); }}>Ask For Its Waiver</Gated></div>
          <WhyNot reasons={[['Ask For Its Waiver', waive]]} />
        </div>
      )}
    </>
  );
}

/** The IRS's notice of federal tax lien on a year. */
export function FederalLien({ year }: { year: number }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const r = returnsOf(person)[String(year)];
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  if (!r?.lien) return null;
  const no = federalLienWithdrawRefusal(person, r, sim.now);
  const error = federalLienInError(r);
  return (
    <div className="col gap-1">
      <div className="eyebrow">The IRS’s Lien</div>
      <LienFacts l={r.lien} money={money} zone={sim.zone} />
      <p className="xs dim" style={{ margin: 0 }}>{FEDERAL_LIEN.effect} It’s released within {FEDERAL_LIEN.releaseDays} days of payment in full; you can then ask for it to be withdrawn on Form 12277, with your last three years’ returns filed. One filed in error is released as erroneous within {FEDERAL_LIEN.errorDays} days.</p>
      <div className="row gap-2"><Gated feature="tax.federal_lien_withdraw" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no} onClick={() => { const a = run<{ decideAt: number; error: boolean }>('tax.federal_lien_withdraw', { year }); if (a.ok) toast(`${a.value!.error ? 'Asked as erroneous' : 'Form 12277 sent'}: decided by ${formatDate(a.value!.decideAt, sim.zone)}.`, 'positive'); }}>{error ? 'Ask For Its Release As Erroneous' : 'Ask For Its Withdrawal (Form 12277)'}</Gated></div>
      <WhyNot reasons={[['Ask For Its Withdrawal', no]]} />
      <Fine>Source: {FEDERAL_LIEN.source}.</Fine>
    </div>
  );
}
