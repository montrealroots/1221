
import type { Id } from '../core/ids';
import type { Money } from '../core/money';
import type { Instant } from '../core/time';
import type { Project } from '../domain/company';

export interface ProductionPlanSpec {
  projectId: Id;
  planId: string;
  budgetCents: Money;
  shootWeeks: number;
  secondsEach?: number;
  hands?: number;
  from?: Instant;
  stageId?: Id;
}

export function packageMatchesPlan(project: Project, spec: ProductionPlanSpec): boolean {
  const pack = project.package;
  if (!pack) return true;
  const secondsEach = Math.max(60, Math.round(spec.secondsEach ?? pack.secondsEach));
  const hands = Math.max(1, Math.round(spec.hands ?? pack.hands));
  const from = spec.from ?? pack.from;
  const stageId = spec.stageId ?? pack.stageId;
  return spec.planId === pack.planId
    && Math.round(spec.budgetCents) === pack.budgetCents
    && Math.round(spec.shootWeeks) === pack.shootWeeks
    && secondsEach === pack.secondsEach
    && hands === pack.hands
    && from === pack.from
    && stageId === pack.stageId;
}
