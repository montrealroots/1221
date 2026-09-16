/**
 * SLATE — what the world remembers.
 *
 * Every milestone writes a history record, so that years later the player can
 * look back at where they lived, what they made and who asked for them.
 *
 * There used to be a second job here, and it is worth saying what happened to
 * it. "Why did this happen?" — an audit record capturing the inputs, weights,
 * rules version, seed, roll and result of every consequential outcome, so a
 * decision could be re-derived and shown, with a `knowable` flag on each factor
 * so a rival's private quote was stored but never rendered. It was a good
 * design. Nothing ever called it. `sim.audit` had no call site in the engine,
 * `auditFor`, `auditsFor`, `redactForPlayer` and `buildFactors` had no callers
 * anywhere, and a save that played forty years and made and delivered a picture
 * held nought audit records — while the table was persisted, validated, counted
 * in the save-size estimate and listed as one of the logs a failed command must
 * not roll back. A hundred and twenty-eight lines describing an explanation
 * nobody could ask for.
 *
 * The room it was for is the honest place to rebuild it, if it is rebuilt: an
 * explanation is worth having when there is a screen that asks for one.
 */

import type { Instant } from './time';

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
  history: HistoryRecord[];
}

export class Historian {
  constructor(private host: AuditHost) {}

  recordHistory(record: HistoryRecord): HistoryRecord {
    this.host.history.push(record);
    return record;
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
