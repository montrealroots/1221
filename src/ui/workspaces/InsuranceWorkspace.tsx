import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Empty, Modal } from '@/ui/components/primitives';
import { INSURANCE_PRODUCTS, buildQuote } from '@/engine/systems/services';
import type { InsuranceLine } from '@/engine/domain/model';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';

export function InsuranceWorkspace() {
  const { sim, run } = useGame();
  const [quoting, setQuoting] = useState<InsuranceLine | null>(null);

  const policies = useWorld((s) => Object.values(s.universe.insurancePolicies)
    .filter((p) => p.holderId === s.player.id && p.status !== 'quoted'));
  const claims = useWorld((s) => Object.values(s.universe.insuranceClaims)
    .filter((c) => c.claimantId === s.player.id)
    .sort((a, b) => b.filedAt - a.filedAt));

  const monthlyTotal = policies
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + p.monthlyPremium, 0);

  const uninsured = useWorld((s) => {
    const covered = new Set(
      Object.values(s.universe.insurancePolicies)
        .filter((p) => p.status === 'active')
        .flatMap((p) => p.coveredRefs.map((r) => r.id)),
    );
    const gaps: { type: string; id: string; label: string; value: number }[] = [];
    for (const vehicle of Object.values(s.universe.vehicles)) {
      if (vehicle.ownerId === s.player.id && !vehicle.soldAt && !covered.has(vehicle.id)) {
        gaps.push({ type: 'vehicle', id: vehicle.id, label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, value: vehicle.currentValue });
      }
    }
    for (const property of Object.values(s.universe.properties)) {
      if (property.ownerId === s.player.id && !property.soldAt && !covered.has(property.id)) {
        gaps.push({ type: 'property', id: property.id, label: property.addressLine, value: property.marketValue });
      }
    }
    for (const asset of Object.values(s.universe.assets)) {
      if (asset.ownerId === s.player.id && !asset.soldAt && asset.currentValue >= 15_000_00 && !covered.has(asset.id)) {
        gaps.push({ type: 'asset', id: asset.id, label: asset.name, value: asset.currentValue });
      }
    }
    return gaps.sort((a, b) => b.value - a.value);
  });

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Insurance</div>
        <h1>{policies.filter((p) => p.status === 'active').length} active policies</h1>
        <p className="muted">
          {formatMoney(monthlyTotal)} a month. Quote, premium, coverage, claim, decision, renewal or lapse.
        </p>
      </div>

      {uninsured.length > 0 && (
        <div className="callout callout-warning" style={{ marginBottom: 'var(--s5)' }}>
          <strong>{uninsured.length} uninsured item{uninsured.length === 1 ? '' : 's'}</strong> worth{' '}
          {formatMoneyCompact(uninsured.reduce((s, g) => s + g.value, 0))} in total.
          <div className="xs" style={{ marginTop: 4 }}>
            {uninsured.slice(0, 4).map((gap) => gap.label).join(', ')}
          </div>
        </div>
      )}

      <Panel title="Available Cover" flush>
        <div className="list">
          {INSURANCE_PRODUCTS.map((product) => {
            const held = policies.find((p) => p.line === product.line && p.status === 'active');
            return (
              <div key={product.line} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{product.label}</div>
                  <div className="xs dim">{product.description}</div>
                </div>
                {held ? (
                  <>
                    <span className="mono small">{formatMoney(held.monthlyPremium)}/mo</span>
                    <span className="chip chip-positive">Active</span>
                  </>
                ) : (
                  <button className="btn btn-sm" onClick={() => setQuoting(product.line)}>Get a quote</button>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Your Policies" flush>
        {policies.length === 0 ? (
          <Empty title="No Cover" body="Nothing you own is insured. That is a decision, and it has consequences." />
        ) : (
          <div className="list">
            {policies.map((policy) => (
              <div key={policy.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{policy.carrier} — {policy.line}</div>
                  <div className="xs dim">
                    {policy.policyNumber} · {formatMoney(policy.deductible)} deductible ·{' '}
                    {Math.round(policy.coinsurance * 100)}% covered up to {formatMoneyCompact(policy.coverageLimit)} ·
                    renews {formatDate(policy.endsAt, sim.homeZone)}
                  </div>
                </div>
                <span className="mono small">{formatMoney(policy.monthlyPremium)}/mo</span>
                <span className={`chip ${policy.status === 'active' ? 'chip-positive' : 'chip-negative'}`}>{policy.status}</span>
                {policy.status === 'active' && (
                  <button
                    className="btn btn-sm"
                    onClick={() => run('ins.file_claim', {
                      policyId: policy.id,
                      description: 'Incident claim',
                      claimedAmount: policy.deductible * 4,
                    })}
                  >
                    File a claim
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {claims.length > 0 && (
        <Panel title="Claims" flush>
          <div className="list">
            {claims.map((claim) => (
              <div key={claim.id} className="list-item list-static">
                <span className="xs dim nowrap" style={{ minWidth: 100 }}>{formatDate(claim.filedAt, sim.homeZone)}</span>
                <div className="grow">
                  <div className="small">{claim.description}</div>
                  {claim.deniedReason && <div className="xs negative">{claim.deniedReason}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono small">{formatMoney(claim.claimedAmount)} claimed</div>
                  {claim.approvedAmount !== undefined && (
                    <div className="xs positive">{formatMoney(claim.approvedAmount)} paid</div>
                  )}
                </div>
                <span className={`chip ${claim.status === 'denied' ? 'chip-negative' : claim.status === 'paid' ? 'chip-positive' : ''}`}>
                  {claim.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {quoting && <QuoteDialog line={quoting} onClose={() => setQuoting(null)} />}
    </>
  );
}

function QuoteDialog({ line, onClose }: { line: InsuranceLine; onClose: () => void }) {
  const { sim, run } = useGame();
  const [refs, setRefs] = useState<{ type: string; id: string }[]>([]);

  const candidates = useWorld((s) => {
    const out: { type: string; id: string; label: string; value: number }[] = [];
    if (line === 'auto') {
      for (const vehicle of Object.values(s.universe.vehicles)) {
        if (vehicle.ownerId === s.player.id && !vehicle.soldAt) {
          out.push({ type: 'vehicle', id: vehicle.id, label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, value: vehicle.currentValue });
        }
      }
    }
    if (line === 'homeowners' || line === 'renters') {
      for (const property of Object.values(s.universe.properties)) {
        if ((property.ownerId === s.player.id || property.id === s.player.residenceId) && !property.soldAt) {
          out.push({ type: 'property', id: property.id, label: property.addressLine, value: property.marketValue });
        }
      }
    }
    if (line === 'valuables') {
      for (const asset of Object.values(s.universe.assets)) {
        if (asset.ownerId === s.player.id && !asset.soldAt && asset.currentValue > 200_000) {
          out.push({ type: 'asset', id: asset.id, label: asset.name, value: asset.currentValue });
        }
      }
    }
    return out;
  });

  const quote = buildQuote(sim, sim.player.id, line, refs);

  const purchase = () => {
    const quoted = run<{ quoteId: string }>('ins.quote', { line, coveredRefs: refs });
    if (!quoted.ok || !quoted.value) return;
    const bought = run('ins.purchase', { quoteId: quoted.value.quoteId });
    if (bought.ok) onClose();
  };

  return (
    <Modal
      title={`Quote for ${line} cover`}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={purchase}>Buy This Policy</button></>}
    >
      {candidates.length > 0 && (
        <div className="field">
          <label>What to cover</label>
          {candidates.map((candidate) => (
            <label key={candidate.id} className="row gap-2" style={{ marginBottom: 4 }}>
              <input
                type="checkbox" style={{ width: 'auto' }}
                checked={refs.some((r) => r.id === candidate.id)}
                onChange={(e) => setRefs((current) => e.target.checked
                  ? [...current, { type: candidate.type, id: candidate.id }]
                  : current.filter((r) => r.id !== candidate.id))}
              />
              <span className="small" style={{ color: 'var(--text)' }}>
                {candidate.label} — {formatMoneyCompact(candidate.value)}
              </span>
            </label>
          ))}
        </div>
      )}

      <div className="grid grid-2">
        <Stat label="Premium" value={<span className="mono">{formatMoney(quote.premium)}/mo</span>} />
        <Stat label="Deductible" value={<span className="mono">{formatMoney(quote.deductible)}</span>} />
        <Stat label="Covered After Deductible" value={`${Math.round(quote.coinsurance * 100)}%`} />
        <Stat label="Limit" value={<span className="mono">{formatMoneyCompact(quote.coverageLimit)}</span>} />
      </div>

      <p className="xs dim" style={{ marginTop: 'var(--s4)' }}>
        Underwriters price on real risk. Modified cars, prior claims and age all move the number.
      </p>
    </Modal>
  );
}
