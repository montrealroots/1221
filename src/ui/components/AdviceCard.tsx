/**
 * SLATE — the first recommendation, short, with its reasoning behind Why This Recommendation (from 2026-10-20, the owner's
 * brief 16, section 6; `adviceSummary`). The Player Profile's What To Work On Next and a brief's What To Work On draw it
 * alike, so the two say the same thing the same way. Until then each drew every recommendation's whole reasoning inline.
 *
 * The details are a native disclosure: a button to the keyboard and to a screen reader, opened with Enter or Space, and
 * shut by default. What a reader of the screen looks for keeps its mark inside it (`data-standing`, `data-assumes`,
 * `data-attention`); the action keeps `data-next`.
 *
 * From 2026-10-20 (brief 17) what the record shows of it now has a line of its own under why it matters (`continuing`,
 * `data-continuing`): how long it has led, the recent pieces it held back, how long since any work was judged.
 */

import type { AdviceSummary } from '@/engine/systems/next-steps';

const P = { margin: 0 } as const;

export function AdviceCard({ advice, heading }: { advice: AdviceSummary; heading?: string }) {
  return (
    <div className="col gap-1" data-advice="">
      {heading && <div className="eyebrow">{heading}</div>}
      <p className="small" style={P}><strong>{advice.what}</strong>. {advice.why}</p>
      {advice.continuing && <p className="small" style={P} data-continuing="">{advice.continuing}</p>}
      {advice.action && <p className="small" style={P} data-next="">{advice.action}</p>}
      {advice.estimate && <p className="small" style={P} data-estimate="">{advice.estimate}</p>}
      {advice.unavailable && <p className="xs why-not" style={P}>{advice.unavailable}</p>}
      {advice.details.length > 0 && (
        <details className="advice-why small" data-why="">
          <summary>Why This Recommendation</summary>
          {advice.details.map((d) => (
            <div key={d.heading} className="col gap-1" style={{ marginTop: 'var(--s2)' }}>
              <div className="eyebrow" role="heading" aria-level={4}>{d.heading}</div>
              {d.lines.length === 1 || !d.list
                ? d.lines.map((l, i) => <p key={i} className="xs" style={P} {...(d.mark && i === 0 ? { [`data-${d.mark}`]: '' } : {})}>{l}</p>)
                : <ul className="xs" style={P}>{d.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>}
              {d.after?.map((l, i) => <p key={`after-${i}`} className="xs" style={P}>{l}</p>)}
            </div>
          ))}
        </details>
      )}
    </div>
  );
}
