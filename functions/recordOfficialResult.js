/**
 * SLATE — record a finalised outcome.
 *
 * Some results are not allowed to change afterwards: who won the 97th
 * Vanguards, what a release settled at, what a contract concluded. Those are
 * written here, once. A second write for the same subject does not update the
 * row — it returns what is already stored. History that could be rewritten
 * from the browser is not history.
 *
 * The inputs, weights, rules version and seed are stored alongside the result
 * so the same decision can always be explained, and shown to have been reached
 * the same way it would be reached again.
 */

import { createClient } from 'npm:@base44/sdk';
import { GuardError, failure, ok } from './_shared/guard.js';

const KINDS = [
  'award_edition', 'release_settlement', 'contract_conclusion',
  'construction_handover', 'ownership_transfer',
];

Deno.serve(async (req) => {
  const respond = (body) => new Response(JSON.stringify(body), {
    status: body.ok ? 200 : body.status ?? 400,
    headers: { 'Content-Type': 'application/json' },
  });

  try {
    if (req.method !== 'POST') throw new GuardError('This endpoint takes POST.', 405);

    const base44 = createClient({
      appId: Deno.env.get('BASE44_APP_ID'),
      requiresAuth: true,
    });
    base44.auth.setToken(req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '');

    const user = await base44.auth.me();
    if (!user?.id) throw new GuardError('You are not signed in.', 401);

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

    // The save must be one of the caller's. RLS scopes this filter to them, so
    // a saveId belonging to somebody else simply will not be found.
    const [save] = await base44.entities.SlateSave.filter({ save_id: saveId });
    if (!save) throw new GuardError('No save of yours has that id.', 404);

    const [existing] = await base44.entities.SlateOfficialResult.filter({
      save_id: saveId, kind, subject_id: subjectId,
    });
    if (existing) {
      // Already decided. Hand back what was decided; do not decide again.
      return respond(ok({
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

    return respond(ok({ alreadyFinal: false, id: created.id, outcome: created.outcome }));
  } catch (error) {
    return respond(failure(error));
  }
});
