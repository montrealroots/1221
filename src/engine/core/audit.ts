/**
 * SLATE — Explainability and history.
 *
 * Two related jobs:
 *
 *  1. "Why did this happen?" — every consequential outcome writes an audit
 *     record capturing the inputs, weights, rules version, seed, roll and
 *     result, so the decision can be re-derived and shown to the player.
 *
 *  2. "The world must remember" — every milestone writes a history record, so
 *     that years later the player can look back at where they lived, what they
 *     drove, who they dated and what they made.
 *
 * Knowledge gating lives here too. Audit factors carry a `knowable` flag; a
 * factor the character could not realistically know is stored (so the
 * simulation stays honest and testable) but never rendered to the player.
 */

import type { Instant } from './time';

export interface AuditFactor {
  label: string;
  /** Human sentence explaining this factor's role. */
  detail: string;
  /** Relative importance, 0..1. */
  weight: number;
  /** Signed contribution to the final score, in score units. */
  contribution: number;
  /**
   * False for information the character has no realistic way of knowing:
   * a rival's private quote, a studio's internal risk model, a secret vote.
   */
  knowable: boolean;
}

export interface AuditRecord {
  id: string;
  saveId: string;
  at: Instant;
  /** Dotted outcome kind, e.g. 'casting.decided'. */
  kind: string;
  subjectType: string;
  subjectId: string;
  /** The question this record answers, e.g. "Why didn't I get this role?" */
  question: string;
  /** One-sentence answer, always knowable. */
  summary: string;
  factors: AuditFactor[];
  /** Version of the ruleset used, so old records stay interpretable. */
  rulesVersion: string;
  /** RNG stream key, allowing the roll to be re-derived exactly. */
  seed?: string;
  /** The roll drawn, 0..1. */
  roll?: number;
  /** The probability the roll was tested against. */
  probability?: number;
  /** Final score, where the system is score-based. */
  score?: number;
  outcome: string;
}

export type HistoryCategory =
  | 'life' | 'career' | 'finance' | 'property' | 'vehicle' | 'relationship'
  | 'family' | 'travel' | 'social' | 'project' | 'company' | 'award' | 'education' | 'health';

export interface HistoryRecord {
  id: string;
  saveId: string;
  at: Instant;
  category: HistoryCategory;
  /** Short headline: "Bought 4412 Vista Ridge Drive". */
  title: string;
  /** Sentence of context. */
  detail: string;
  /** Entities this milestone concerns, for cross-linking from their pages. */
  refs: { type: string; id: string }[];
  /** Larger numbers are bigger deals; the timeline can filter by significance. */
  significance: number;
  /** True when the wider world knows about it (affects fame and press). */
  public: boolean;
  /** Money involved, if any, in cents. */
  amount?: number;
}

export interface AuditHost {
  audits: AuditRecord[];
  history: HistoryRecord[];
}

const MAX_AUDITS = 4000;

export class Historian {
  constructor(private host: AuditHost) {}

  recordAudit(record: AuditRecord): AuditRecord {
    this.host.audits.push(record);
    if (this.host.audits.length > MAX_AUDITS) {
      // Keep the most recent; audits are an explanation aid, not source of truth.
      this.host.audits.splice(0, this.host.audits.length - MAX_AUDITS);
    }
    return record;
  }

  recordHistory(record: HistoryRecord): HistoryRecord {
    this.host.history.push(record);
    return record;
  }

  /** The audit for a specific outcome, if one was written. */
  auditFor(subjectType: string, subjectId: string, kind?: string): AuditRecord | undefined {
    for (let i = this.host.audits.length - 1; i >= 0; i--) {
      const a = this.host.audits[i] as AuditRecord;
      if (a.subjectType === subjectType && a.subjectId === subjectId && (!kind || a.kind === kind)) return a;
    }
    return undefined;
  }

  auditsFor(subjectType: string, subjectId: string): AuditRecord[] {
    return this.host.audits.filter((a) => a.subjectType === subjectType && a.subjectId === subjectId);
  }

  /** History for a timeline view, newest first. */
  timeline(opts: { category?: HistoryCategory; refId?: string; minSignificance?: number; limit?: number } = {}): HistoryRecord[] {
    const out: HistoryRecord[] = [];
    const limit = opts.limit ?? 200;
    for (let i = this.host.history.length - 1; i >= 0 && out.length < limit; i--) {
      const h = this.host.history[i] as HistoryRecord;
      if (opts.category && h.category !== opts.category) continue;
      if (opts.minSignificance !== undefined && h.significance < opts.minSignificance) continue;
      if (opts.refId && !h.refs.some((r) => r.id === opts.refId)) continue;
      out.push(h);
    }
    return out;
  }
}

/** Strips factors the character cannot know. Used at the UI boundary. */
export function redactForPlayer(record: AuditRecord): AuditRecord {
  const knowable = record.factors.filter((f) => f.knowable);
  const hidden = record.factors.length - knowable.length;
  return {
    ...record,
    factors: hidden > 0
      ? [
          ...knowable,
          {
            label: 'Information you do not have',
            detail: `${hidden} factor${hidden === 1 ? '' : 's'} in this decision ${hidden === 1 ? 'was' : 'were'} private to other people. You never saw ${hidden === 1 ? 'it' : 'them'}.`,
            weight: 0,
            contribution: 0,
            knowable: true,
          },
        ]
      : knowable,
    // The roll itself is a mechanic, not world knowledge, but showing it is
    // part of the promise of an honest simulation, so it stays.
  };
}

/** Builds a normalised factor list from raw weighted inputs. */
export function buildFactors(
  inputs: { label: string; detail: string; weight: number; value: number; knowable?: boolean }[],
): { factors: AuditFactor[]; score: number } {
  const totalWeight = inputs.reduce((s, i) => s + Math.abs(i.weight), 0) || 1;
  let score = 0;
  const factors = inputs.map((i) => {
    const contribution = i.weight * i.value;
    score += contribution;
    return {
      label: i.label,
      detail: i.detail,
      weight: Math.abs(i.weight) / totalWeight,
      contribution,
      knowable: i.knowable ?? true,
    };
  });
  factors.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  return { factors, score };
}
