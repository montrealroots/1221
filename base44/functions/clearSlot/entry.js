/**
 * SLATE — clear a save slot.
 *
 * Clearing a slot is not a deletion. The payload is moved aside and kept as a
 * backup, and the row is marked cleared, so a player who empties the wrong
 * slot can get their universe back. Nothing a player has lived is destroyed
 * because they tapped the wrong thing.
 */

import { createClientFromRequest } from 'npm:@base44/sdk';
import { GuardError, failure, ok, requireSlot } from '../../shared/guard.js';

export default async function (req) {
  try {
    if (req.method !== 'POST') throw new GuardError('This endpoint takes POST.', 405);

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, status: 401, error: 'You are not signed in.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const slot = requireSlot(body.slot);

    const [row] = await base44.entities.SlateSave.filter({ slot });
    if (!row) return Response.json(ok({ slot, cleared: false, reason: 'That slot was already empty.' }));

    await base44.entities.SlateSave.update(row.id, {
      backup_payload: row.payload || row.backup_payload || '',
      payload: '',
      deleted_at: new Date().toISOString(),
    });

    return Response.json(ok({ slot, cleared: true, recoverable: Boolean(row.payload || row.backup_payload) }));
  } catch (error) {
    const body = failure(error);
    return Response.json(body, { status: body.status });
  }
}
