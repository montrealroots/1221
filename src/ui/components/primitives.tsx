/**
 * SLATE — shared presentation pieces.
 *
 * Kept small and unopinionated. Anything that encodes a rule belongs in the
 * engine, not here.
 */

import type { ReactNode } from 'react';
import { formatMoney, formatMoneyCompact, type Money } from '@/engine/core/money';
import { clamp } from '@/engine/core/rng';

export function Panel({
  title, subtitle, actions, children, flush, tight,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  tight?: boolean;
}) {
  return (
    <section className={`card${flush ? ' card-flush' : ''}${tight ? ' card-tight' : ''}`}>
      {(title || actions) && (
        <div className="panel-head" style={flush ? { padding: 'var(--s4) var(--s4) 0' } : undefined}>
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p className="muted small" style={{ margin: 0 }}>{subtitle}</p>}
          </div>
          {actions && <div className="row gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label, value, note, tone,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: 'positive' | 'negative' | 'warning';
}) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className={`stat-value${tone ? ` ${tone}` : ''}`}>{value}</span>
      {note && <span className="stat-note">{note}</span>}
    </div>
  );
}

/**
 * A meter always shows its number. Colour alone is never the signal, because
 * colour alone is not accessible.
 */
export function Meter({
  label, value, max = 100, tone, hint, invert,
}: {
  label: string;
  value: number;
  max?: number;
  tone?: 'positive' | 'negative' | 'warning';
  hint?: string;
  invert?: boolean;
}) {
  const pct = clamp((value / max) * 100, 0, 100);
  const derived = tone ?? (invert
    ? (pct > 70 ? 'negative' : pct > 40 ? 'warning' : 'positive')
    : (pct < 25 ? 'negative' : pct < 50 ? 'warning' : 'positive'));
  return (
    <div>
      <div className="row-between xs" style={{ marginBottom: 3 }}>
        <span className="muted">{label}</span>
        <span className="mono">{Math.round(value)}{max === 100 ? '' : ` / ${max}`}</span>
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

export function MoneyText({ amount, compact, signed }: { amount: Money; compact?: boolean; signed?: boolean }) {
  const text = compact ? formatMoneyCompact(amount) : formatMoney(amount);
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

export function Tabs<T extends string>({
  tabs, active, onChange,
}: {
  tabs: { id: T; label: string; badge?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className="tab"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="chip chip-accent" style={{ marginLeft: 6 }}>{tab.badge}</span>
          )}
        </button>
      ))}
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

/** A term with an explanation attached. Depth is useless if it is opaque. */
export function Term({ children, explain }: { children: ReactNode; explain: string }) {
  return <span className="tooltip-term" title={explain}>{children}</span>;
}
