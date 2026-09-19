import { describe, expect, it } from 'vitest';
import {
  ACTIVE_PRODUCTION_STAGES,
  TERMINAL_PRODUCTION_STAGES,
  assertProductionTransition,
  canMoveProductionStage,
  legacyStageFromProduction,
  nextProductionStages,
  productionStageFromLegacy,
  type ProductionStage,
} from '@/engine/production/model';

describe('production lifecycle', () => {
  it('has exactly one classification for every stage', () => {
    const all = [...ACTIVE_PRODUCTION_STAGES, ...TERMINAL_PRODUCTION_STAGES];
    expect(new Set(all).size).toBe(all.length);
  });

  it('walks the ordinary feature path in order', () => {
    const path: ProductionStage[] = [
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

    for (let i = 0; i < path.length - 1; i += 1) {
      expect(canMoveProductionStage(path[i]!, path[i + 1]!)).toBe(true);
    }
  });

  it('does not allow a project to teleport through production', () => {
    expect(canMoveProductionStage('concept', 'released')).toBe(false);
    expect(() => assertProductionTransition('production', 'released'))
      .toThrow(/cannot move/i);
  });

  it('allows a shelved project to come back without reviving a cancelled one', () => {
    expect(nextProductionStages('shelved')).toContain('development');
    expect(nextProductionStages('cancelled')).toHaveLength(0);
  });

  it('allows a failed delivery to be repaired instead of pretending the project vanished', () => {
    expect(nextProductionStages('failed_delivery')).toEqual(
      expect.arrayContaining(['postproduction', 'marketing', 'distribution']),
    );
  });

  it('maps every existing project stage without inventing a release', () => {
    expect(productionStageFromLegacy('idea')).toBe('concept');
    expect(productionStageFromLegacy('greenlit')).toBe('greenlight_ready');
    expect(productionStageFromLegacy('shooting')).toBe('production');
    expect(productionStageFromLegacy('delivered')).toBe('distribution');
  });

  it('can still speak the legacy stage vocabulary while old screens remain', () => {
    expect(legacyStageFromProduction('casting')).toBe('packaged');
    expect(legacyStageFromProduction('test_screening')).toBe('post');
    expect(legacyStageFromProduction('commercial_run')).toBe('delivered');
  });
});
