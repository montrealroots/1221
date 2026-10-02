/**
 * SLATE — the chance a building inspection fails, by the stage it closes:
 * the Los Angeles Department of Building and Safety's own records of every
 * inspection since 2023-01-01, the share of those that came to an answer that
 * sent the builder back (corrections issued, not ready, no access), read
 * 2026-10-02 (`tools/data/inspections.mjs`, which writes this file and
 * `docs/research/world/derived-inspections.json`). No other place SLATE
 * builds in publishes its results, and SLATE takes Los Angeles's for each.
 */

export const INSPECTION_FAILS = {
  foundation: 0.384,
  framing: 0.3812,
  rough: 0.4793,
  final: 0.3707,
} as const;
