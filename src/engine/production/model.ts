/**
 * SLATE — canonical production lifecycle.
 *
 * This file is deliberately independent of the old making/casting modules. It is
 * the first piece of the replacement engine: one explicit state machine that
 * every project workflow will eventually use.
 *
 * During migration, existing saves still carry `domain/company.Stage`. The two
 * conversion helpers at the bottom are compatibility only; new production code
 * should speak `ProductionStage`.
 */

import type { Stage as LegacyStage } from '../domain/company';

export type ProductionStage =
  | 'concept'
  | 'rights'
  | 'development'
  | 'screenplay'
  | 'packaging'
  | 'financing'
  | 'casting'
  | 'greenlight_ready'
  | 'preproduction'
  | 'production'
  | 'postproduction'
  | 'test_screening'
  | 'marketing'
  | 'distribution'
  | 'released'
  | 'commercial_run'
  | 'awards'
  | 'library'
  | 'shelved'
  | 'cancelled'
  | 'failed_delivery';

export const ACTIVE_PRODUCTION_STAGES: readonly ProductionStage[] = [
  'concept',
  'rights',
  'development',
  'screenplay',
  'packaging',
  'financing',
  'casting',
  'greenlight_ready',
  'preproduction',
  'production',
  'postproduction',
  'test_screening',
  'marketing',
  'distribution',
  'released',
  'commercial_run',
  'awards',
  'library',
];

export const TERMINAL_PRODUCTION_STAGES: readonly ProductionStage[] = [
  'shelved',
  'cancelled',
  'failed_delivery',
];

const NEXT: Readonly<Record<ProductionStage, readonly ProductionStage[]>> = {
  concept: ['rights', 'development', 'shelved', 'cancelled'],
  rights: ['development', 'shelved', 'cancelled'],
  development: ['screenplay', 'packaging', 'shelved', 'cancelled'],
  screenplay: ['packaging', 'shelved', 'cancelled'],
  packaging: ['financing', 'casting', 'shelved', 'cancelled'],
  financing: ['casting', 'greenlight_ready', 'shelved', 'cancelled'],
  casting: ['greenlight_ready', 'shelved', 'cancelled'],
  greenlight_ready: ['preproduction', 'shelved', 'cancelled'],
  preproduction: ['production', 'shelved', 'cancelled'],
  production: ['postproduction', 'cancelled'],
  postproduction: ['test_screening', 'marketing', 'failed_delivery'],
  test_screening: ['postproduction', 'marketing', 'failed_delivery'],
  marketing: ['distribution', 'failed_delivery'],
  distribution: ['released', 'failed_delivery'],
  released: ['commercial_run'],
  commercial_run: ['awards', 'library'],
  awards: ['library'],
  library: [],
  shelved: ['development', 'packaging', 'financing', 'casting', 'greenlight_ready', 'cancelled'],
  cancelled: [],
  failed_delivery: ['postproduction', 'marketing', 'distribution', 'cancelled'],
};

export function nextProductionStages(stage: ProductionStage): readonly ProductionStage[] {
  return NEXT[stage];
}

export function canMoveProductionStage(from: ProductionStage, to: ProductionStage): boolean {
  return NEXT[from].includes(to);
}

export function assertProductionTransition(from: ProductionStage, to: ProductionStage): void {
  if (!canMoveProductionStage(from, to)) {
    throw new Error(`Production cannot move from '${from}' to '${to}'.`);
  }
}

const FROM_LEGACY: Readonly<Record<LegacyStage, ProductionStage>> = {
  idea: 'concept',
  optioned: 'rights',
  writing: 'development',
  draft: 'screenplay',
  packaged: 'packaging',
  greenlit: 'greenlight_ready',
  prep: 'preproduction',
  shooting: 'production',
  post: 'postproduction',
  delivered: 'distribution',
  shelved: 'shelved',
};

/**
 * Reads an old-save project into the new lifecycle without inventing history.
 *
 * In particular, old `delivered` means the production handed over its required
 * elements. It does not prove a public release has happened, so it maps to
 * `distribution`, not `released`.
 */
export function productionStageFromLegacy(stage: LegacyStage): ProductionStage {
  return FROM_LEGACY[stage];
}

/**
 * Temporary compatibility for old screens while the replacement is being wired.
 *
 * Several new stages collapse to one old stage because the old model simply had
 * nowhere to store the distinction. This helper must disappear when Project
 * persistence moves to the new lifecycle.
 */
export function legacyStageFromProduction(stage: ProductionStage): LegacyStage {
  switch (stage) {
    case 'concept': return 'idea';
    case 'rights': return 'optioned';
    case 'development': return 'writing';
    case 'screenplay': return 'draft';
    case 'packaging':
    case 'financing':
    case 'casting':
      return 'packaged';
    case 'greenlight_ready': return 'greenlit';
    case 'preproduction': return 'prep';
    case 'production': return 'shooting';
    case 'postproduction':
    case 'test_screening':
    case 'marketing':
      return 'post';
    case 'distribution':
    case 'released':
    case 'commercial_run':
    case 'awards':
    case 'library':
      return 'delivered';
    case 'shelved':
    case 'failed_delivery':
      return 'shelved';
    case 'cancelled':
      return 'shelved';
  }
}
