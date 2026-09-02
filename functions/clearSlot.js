/**
 * SLATE — clear a save slot.
 *
 * Clearing a slot is not a deletion. The payload is moved aside and kept as a
 * backup, and the row is marked cleared, so a player who empties the wrong
 * slot can get their universe back. Nothing a player has lived is destroyed
 * because they tapped the wrong thing.
 */

import { createClient } from 'npm:@base44/sdk';
import { GuardError, failure, ok, requireSlot } from './_shared/guard.js';

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

    const body = await req.json().catch(() => ({}));
    const slot = requireSlot(body.slot);

    const [row] = await base44.entities.SlateSave.filter({ slot });
    if (!row) return respond(ok({ slot, cleared: false, reason: 'That slot was already empty.' }));

    await base44.entities.SlateSave.update(row.id, {
      backup_payload: row.payload || row.backup_payload || '',
      payload: '',
      deleted_at: new Date().toISOString(),
    });

    return respond(ok({ slot, cleared: true, recoverable: Boolean(row.payload || row.backup_payload) }));
  } catch (error) {
    return respond(failure(error));
  }
});
