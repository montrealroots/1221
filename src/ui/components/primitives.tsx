/**
 * SLATE — shared presentation pieces.
 *
 * Kept small and unopinionated. Anything that encodes a rule belongs in the
 * engine, not here.
 */

import { useEffect, type ReactNode } from 'react';
import { formatMoney, formatMoneyCompact, type Money } from '@/engine/core/money';
import { clamp } from '@/engine/core/rng';
import { LookRegion, Open } from '@/ui/looks/Look';
import type { Subject } from '@/ui/looks/subject';

export function Panel({
  title, subtitle, actions, children, flush, tight, look,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  tight?: boolean;
  /**
   * What the panel is about. A heading is the world's word for what is under
   * it — "Weather", "The Land", "Standing" — so given a subject it becomes
   * the way into it, and the panel hosts its own region so the look opens
   * beneath the whole panel rather than inside one of its rows.
   */
  look?: Subject;
}) {
  const head = (title || actions) && (
    <div className="panel-head" style={flush ? { padding: 'var(--s4) var(--s4) 0' } : undefined}>
      <div>
        {title && <h2>{look ? <Open subject={look}>{title}</Open> : title}</h2>}
        {subtitle && <p className="muted small" style={{ margin: 0 }}>{subtitle}</p>}
      </div>
      {actions && <div className="row gap-2">{actions}</div>}
    </div>
  );
  return (
    <section className={`card${flush ? ' card-flush' : ''}${tight ? ' card-tight' : ''}`}>
      {look
        ? <LookRegion className="panel-body">{head}{children}</LookRegion>
        : <>{head}{children}</>}
    </section>
  );
}

export function Stat({
  label, value, note, tone, look,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: 'positive' | 'negative' | 'warning';
  /**
   * The thing this figure is about. Given one, the label becomes the way in —
   * the name is the control, so there is no button to add beside it.
   */
  look?: Subject;
}) {
  // The whole tile is one control, not three. A player's hand goes to the
  // figure as readily as to the word above it, and a number that does nothing
  // under a word that does something is the exact inconsistency depth exists
  // to remove. The label keeps the underline, so there is still one clear
  // affordance rather than three.
  const inner = (
    <>
      <span className="stat-label">{label}</span>
      <span className={`stat-value${tone ? ` ${tone}` : ''}`}>{value}</span>
      {note && <span className="stat-note">{note}</span>}
    </>
  );
  return (
    <div className="stat">
      {look ? <Open subject={look}>{inner}</Open> : inner}
    </div>
  );
}

/**
 * A meter always shows its number. Color alone is never the signal, because
 * color alone is not accessible.
 */
export function Meter({
  label, value, max = 100, tone, hint, invert, look,
}: {
  label: string;
  value: number;
  max?: number;
  tone?: 'positive' | 'negative' | 'warning';
  hint?: string;
  invert?: boolean;
  /** The dial this bar is drawing. Its label becomes the way in. */
  look?: Subject;
}) {
  const pct = clamp((value / max) * 100, 0, 100);
  const derived = tone ?? (invert
    ? (pct > 70 ? 'negative' : pct > 40 ? 'warning' : 'positive')
    : (pct < 25 ? 'negative' : pct < 50 ? 'warning' : 'positive'));
  return (
    <div>
      <div className="row-between xs" style={{ marginBottom: 3 }}>
        <span className="muted">{look ? <Open subject={look}>{label}</Open> : label}</span>
        <span className="mono">
          {look
            ? <Open subject={look}>{Math.round(value)}{max === 100 ? '' : ` / ${max}`}</Open>
            : <>{Math.round(value)}{max === 100 ? '' : ` / ${max}`}</>}
        </span>
      </div>
      <div
        className={`meter meter-${derived}`}
        role="meter"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      {hint && <div className="xs dim" style={{ marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

export function MoneyText({ amount, currency, compact, signed }: { amount: Money; currency: string; compact?: boolean; signed?: boolean }) {
  const text = compact ? formatMoneyCompact(amount, currency) : formatMoney(amount, currency);
  const cls = amount > 0 ? 'positive' : amount < 0 ? 'negative' : 'muted';
  return (
    <span className={`mono ${signed ? cls : ''}`}>
      {signed && amount > 0 ? '+' : ''}{text}
    </span>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p className="small" style={{ maxWidth: 420, margin: '0 auto var(--s4)' }}>{body}</p>
      {action}
    </div>
  );
}

export function Modal({
  title, children, footer, onClose, wide,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  // Escape closes it, the way every dialog on every platform closes. Without
  // this a modal could only be left by finding its button, and anything
  // underneath it stayed unreachable until then.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        style={wide ? { width: 'min(880px, 100%)' } : undefined}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">
          <div className="row-between">
            <h2>{title}</h2>
            <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Term({ children, explain }: { children: ReactNode; explain: string }) {
  return <span className="tooltip-term" title={explain}>{children}</span>;
}
