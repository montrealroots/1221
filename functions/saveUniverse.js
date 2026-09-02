/**
 * SLATE — write a save.
 *
 * The browser never writes a save directly. It sends the universe here, the
 * server checks what it can check, and only then does anything land in
 * storage. What the server enforces:
 *
 *  - the caller is signed in, and the row is theirs (row-level security does
 *    the rest: nobody can name another player's slot);
 *  - the slot is one of the three;
 *  - the payload parses, is within size, and is in a format this build reads;
 *  - every transaction balances and the whole ledger sums to zero;
 *  - no record inside belongs to a different save;
 *  - the world clock and playtime have not gone backwards, so a stale tab
 *    cannot overwrite newer progress;
 *  - the previous payload is kept as a backup before being replaced.
 *
 * An idempotency key makes a retry safe: the same key writes once and returns
 * the same answer, so a dropped connection never costs or duplicates anything.
 */

import { createClient } from 'npm:@base44/sdk';
import {
  GuardError, failure, inspectPayload, ok, requireForwardProgress, requireSlot,
} from './_shared/guard.js';

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

    const slot = requireSlot(body.slot);
    const incoming = inspectPayload(body.payload, slot);

    // A retried write must not run twice.
    if (body.idempotencyKey) {
      const [receipt] = await base44.entities.SlateCommandReceipt.filter({
        save_id: incoming.saveId,
        idempotency_key: body.idempotencyKey,
      });
      if (receipt) return respond(ok({ replayed: true, ...(receipt.result ?? {}) }));
    }

    const [existing] = await base44.entities.SlateSave.filter({ slot });
    requireForwardProgress(existing, incoming);

    const row = {
      slot,
      save_id: incoming.saveId,
      payload: body.payload,
      schema_version: incoming.meta.schemaVersion,
      world_now: incoming.worldNow,
      playtime_seconds: incoming.playtimeSeconds,
      character_name: incoming.meta.characterName ?? '',
      career_label: incoming.meta.careerLabel ?? '',
      location_label: incoming.meta.locationLabel ?? '',
      world_date_label: incoming.meta.worldDateLabel ?? '',
      net_worth_label: incoming.meta.netWorthLabel ?? '',
      app_version: incoming.meta.appVersion ?? '',
      payload_bytes: incoming.bytes,
      integrity: {
        postings_balance: true,
        save_id_consistent: true,
        checked_at: new Date().toISOString(),
      },
      deleted_at: null,
    };

    let saved;
    if (existing) {
      // Keep what was there before, so a bad write is always recoverable.
      saved = await base44.entities.SlateSave.update(existing.id, {
        ...row,
        backup_payload: existing.payload || existing.backup_payload || '',
      });
    } else {
      saved = await base44.entities.SlateSave.create(row);
    }

    const result = {
      id: saved.id,
      slot,
      saveId: incoming.saveId,
      bytes: incoming.bytes,
      backupAvailable: Boolean(existing?.payload),
    };

    if (body.idempotencyKey) {
      await base44.entities.SlateCommandReceipt.create({
        save_id: incoming.saveId,
        idempotency_key: body.idempotencyKey,
        command_kind: 'save.write',
        result,
        applied_at: new Date().toISOString(),
      });
    }

    return respond(ok(result));
  } catch (error) {
    return respond(failure(error));
  }
});
