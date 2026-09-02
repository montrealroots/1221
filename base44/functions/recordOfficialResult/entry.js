/**
 * SLATE — record a finalised outcome.
 *
 * Some results are not allowed to change afterwards: who won the 97th
 * Vanguards, what a release settled at, what a contract concluded. Those are
 * written here, once. A second write for the same subject does not update the
 * row — it returns what is already stored. History that could be rewritten
 * from the browser is not history, which is also why the entity denies update
 * and delete outright rather than trusting this function to be the only writer.
 *
 * The inputs, weights, rules version and seed are stored alongside the result
 * so the same decision can always be explained, and shown to have been reached
 * the same way it would be reached again.
 */

import { createClientFromRequest } from 'npm:@base44/sdk';
import { GuardError, failure, ok } from '../../shared/guard.js';

const KINDS = [
  'award_edition', 'release_settlement', 'contract_conclusion',
  'construction_handover', 'ownership_transfer',
];

export default async function (req) {
  try {
    if (req.method !== 'POST') throw new GuardError('This endpoint takes POST.', 405);

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, status: 401, error: 'You are not signed in.' }, { status: 401 });

    const body = await req.json().catch(() => {
      throw new GuardError('The request body was not valid JSON.');
    });

    const { saveId, kind, subjectId, outcome } = body;
    if (typeof saveId !== 'string' || !saveId) throw new GuardError('saveId is required.');
    if (!KINDS.includes(kind)) {
      throw new GuardError(`kind must be one of: ${KINDS.join(', ')}. Received ${JSON.stringify(kind)}.`);
    }
    if (typeof subjectId !== 'string' || !subjectId) throw new GuardError('subjectId is required.');
    if (!outcome || typeof outcome !== 'object') throw new GuardError('outcome must be an object.');

    // The save must be one of the caller's. Row-level security scopes this
    // filter to them, so a saveId belonging to somebody else is simply not found.
    const [save] = await base44.entities.SlateSave.filter({ save_id: saveId });
    if (!save) throw new GuardError('No save of yours has that id.', 404);

    const [existing] = await base44.entities.SlateOfficialResult.filter({
      save_id: saveId, kind, subject_id: subjectId,
    });
    if (existing) {
      // Already decided. Hand back what was decided; do not decide again.
      return Response.json(ok({
        alreadyFinal: true,
        id: existing.id,
        outcome: existing.outcome,
        decidedAtWorld: existing.decided_at_world,
        rulesVersion: existing.rules_version,
      }));
    }

    const created = await base44.entities.SlateOfficialResult.create({
      save_id: saveId,
      kind,
      subject_id: subjectId,
      decided_at_world: Number(body.decidedAtWorld) || 0,
      rules_version: String(body.rulesVersion ?? ''),
      seed: String(body.seed ?? ''),
      inputs: body.inputs && typeof body.inputs === 'object' ? body.inputs : {},
      outcome,
      finalised: true,
    });

    return Response.json(ok({ alreadyFinal: false, id: created.id, outcome: created.outcome }));
  } catch (error) {
    const body = failure(error);
    return Response.json(body, { status: body.status });
  }
}
