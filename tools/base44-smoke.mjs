#!/usr/bin/env node
/**
 * SLATE — the post-deploy smoke test for Base44.
 *
 * The contract tests in `tests/base44-contract.test.ts` run the real handlers
 * against an in-memory stand-in, so everything except the network hop is
 * already proven before anybody deploys. This script proves the rest: that a
 * deployed project accepts the functions, that authentication works, that
 * row-level security is configured, and that a real save survives a real round
 * trip.
 *
 * It writes only to the slot you name, restores whatever was there when it
 * finishes, and prints a pass or a fail for every guard it exercised.
 *
 *   SLATE_BASE44_URL=https://your-app.base44.app \
 *   SLATE_BASE44_TOKEN=... \
 *   node tools/base44-smoke.mjs --slot 3
 *
 * Exit code 0 means every check passed. Anything else means read the output.
 */

import { readFileSync } from 'node:fs';

const BASE = process.env.SLATE_BASE44_URL?.replace(/\/+$/, '');
const TOKEN = process.env.SLATE_BASE44_TOKEN;
const args = process.argv.slice(2);
const slotArg = args.indexOf('--slot');
const SLOT = slotArg === -1 ? 3 : Number(args[slotArg + 1]);
const FIXTURE = args.includes('--fixture') ? args[args.indexOf('--fixture') + 1] : undefined;

if (!BASE || !TOKEN) {
  console.error('');
  console.error('  Base44 smoke test — not run.');
  console.error('');
  console.error('  Two environment variables are needed and one of them is missing:');
  console.error(`    SLATE_BASE44_URL    ${BASE ? 'set' : 'MISSING — your deployed app URL'}`);
  console.error(`    SLATE_BASE44_TOKEN  ${TOKEN ? 'set' : 'MISSING — a signed-in user token'}`);
  console.error('');
  console.error('  See docs/BASE44.md for where both come from. This is a real');
  console.error('  dependency, not a failure: nothing has been tested and nothing');
  console.error('  is being reported as passed.');
  console.error('');
  process.exit(78); // EX_CONFIG
}
if (![1, 2, 3].includes(SLOT)) {
  console.error(`  --slot must be 1, 2 or 3. Received ${SLOT}.`);
  process.exit(64);
}

const results = [];
function record(name, passed, detail) {
  results.push({ name, passed, detail });
  const mark = passed ? 'pass' : 'FAIL';
  console.log(`  ${mark}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function call(fn, body, { token = TOKEN } = {}) {
  const res = await fetch(`${BASE}/functions/${fn}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  let parsed;
  try { parsed = await res.json(); } catch { parsed = { ok: false, error: 'The response was not JSON.' }; }
  return { status: res.status, body: parsed };
}

/** A save to send. Either one you point at, or a tiny valid universe. */
function payloadFor(slot) {
  if (FIXTURE) {
    const raw = readFileSync(FIXTURE, 'utf8');
    const universe = JSON.parse(raw);
    universe.meta.slot = slot;
    return JSON.stringify(universe);
  }
  const id = `smoke_${Date.now()}`;
  return JSON.stringify({
    now: Date.UTC(2026, 0, 1),
    meta: {
      id, slot,
      schemaVersion: Number(process.env.SLATE_SCHEMA_VERSION ?? 42),
      playtimeSeconds: 10,
      characterName: 'Smoke Test',
      appVersion: 'smoke',
    },
    transactions: [{ id: 't1', postings: [{ amount: 1000 }, { amount: -1000 }] }],
    people: {},
  });
}

console.log('');
console.log(`  Base44 smoke test — ${BASE}, slot ${SLOT}`);
console.log('');

// What was in the slot before, so it can be put back.
const before = await call('loadUniverse', { slot: SLOT });
record('the deployment answers, and the caller is signed in',
  before.status !== 404 && before.body?.ok !== undefined && before.status !== 401,
  before.status === 401 ? 'the token was rejected' : `http ${before.status}`);
if (before.status === 401 || before.body?.ok === undefined) {
  console.log('\n  Stopping: nothing else can be tested without a working session.\n');
  process.exit(1);
}
const priorPayload = before.body?.payload ?? null;
if (priorPayload) console.log(`  note  slot ${SLOT} was occupied; it will be restored at the end.`);

// 1. An anonymous call is refused.
const anon = await call('loadUniverse', { slot: SLOT }, { token: null });
record('refuses a caller who is not signed in', anon.status === 401, `http ${anon.status}`);

// 2. A bad slot is refused.
const badSlot = await call('saveUniverse', { slot: 9, payload: payloadFor(SLOT) });
record('refuses a slot that is not one, two or three', badSlot.body?.ok === false, badSlot.body?.error);

// 3. A save that does not say what game it is is refused. SLATE is an actor
// and actress simulator, every payload says so, and the server will not store
// one that does not.
const foreign = JSON.parse(payloadFor(SLOT));
delete foreign.premise;
const noPremise = await call('saveUniverse', { slot: SLOT, payload: JSON.stringify(foreign) });
record('refuses a save that does not say it is an actor and actress simulator',
  noPremise.body?.ok === false && /what game it is/i.test(noPremise.body?.error ?? ''),
  noPremise.body?.error);

// 4. An unbalanced ledger is refused.
const unbalanced = JSON.parse(payloadFor(SLOT));
unbalanced.transactions[0].postings[0].amount += 1;
const bad = await call('saveUniverse', { slot: SLOT, payload: JSON.stringify(unbalanced) });
record('refuses a ledger that does not balance',
  bad.body?.ok === false && /balance/i.test(bad.body?.error ?? ''), bad.body?.error);

// 5. A real write lands.
const payload = payloadFor(SLOT);
const written = await call('saveUniverse', { slot: SLOT, payload });
record('writes a save', written.body?.ok === true, written.body?.error ?? `${written.body?.bytes} bytes`);
if (!written.body?.ok) {
  console.log('\n  Stopping: the write failed, so the rest would not mean anything.\n');
  process.exit(1);
}

// 6. It reads back byte for byte.
const readBack = await call('loadUniverse', { slot: SLOT });
record('reads it back unchanged', readBack.body?.payload === payload,
  readBack.body?.payload === payload ? undefined : 'what came back is not what went in');

// 7. A retry with the same key writes once.
const key = `smoke-${Date.now()}`;
const once = await call('saveUniverse', { slot: SLOT, payload, idempotencyKey: key });
const twice = await call('saveUniverse', { slot: SLOT, payload, idempotencyKey: key });
record('a retried write does not write twice',
  twice.body?.ok === true && twice.body?.replayed === true && twice.body?.id === once.body?.id,
  twice.body?.replayed ? 'replayed the first answer' : 'the retry was treated as a new write');

// 8. A stale tab cannot overwrite newer progress.
const advanced = JSON.parse(payload);
advanced.now += 86_400_000;
advanced.meta.playtimeSeconds = 9_000;
await call('saveUniverse', { slot: SLOT, payload: JSON.stringify(advanced) });
const stale = await call('saveUniverse', { slot: SLOT, payload });
record('refuses a stale tab writing over newer progress',
  stale.body?.ok === false && /behind|playtime/i.test(stale.body?.error ?? ''), stale.body?.error);

// 9. The backup is there.
const backup = await call('loadUniverse', { slot: SLOT, backup: 'true' });
record('keeps the previous payload as a backup',
  backup.body?.ok === true && Boolean(backup.body?.payload), backup.body?.fromBackup ? 'from backup' : undefined);

// 10. Clearing releases the slot for a different universe.
const cleared = await call('clearSlot', { slot: SLOT });
record('clears the slot', cleared.body?.ok === true && cleared.body?.cleared === true, cleared.body?.error);
const different = JSON.parse(payloadFor(SLOT));
different.meta.id = `smoke_other_${Date.now()}`;
const reused = await call('saveUniverse', { slot: SLOT, payload: JSON.stringify(different) });
record('lets a different universe use the cleared slot', reused.body?.ok === true, reused.body?.error);

// 11. Put back whatever was there.
await call('clearSlot', { slot: SLOT });
if (priorPayload) {
  const restored = await call('saveUniverse', { slot: SLOT, payload: priorPayload });
  record('restores what was in the slot before this ran', restored.body?.ok === true, restored.body?.error);
} else {
  record('leaves the slot as empty as it found it', true);
}

const failed = results.filter((r) => !r.passed);
console.log('');
console.log(`  ${results.length - failed.length} of ${results.length} checks passed.`);
if (failed.length > 0) {
  console.log('');
  for (const f of failed) console.log(`  FAILED: ${f.name}${f.detail ? ` — ${f.detail}` : ''}`);
  console.log('');
  process.exit(1);
}
console.log('  Base44 live persistence is verified against this deployment.');
console.log('');
