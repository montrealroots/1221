# Base44 — the deployment, and what is proven without it

Three things had to happen before live persistence could stop being reported as
unverified. Two of them are done and in the repository. The third needs an
account, and this document is the whole of what that involves.

| Step | State | Who |
| --- | --- | --- |
| 1. A project to deploy to | **Yours** — one signup, then one command | You |
| 2. The handlers proven without a network | **Done** — 22 contract tests | Built |
| 3. A smoke test for after the deploy | **Done** — `tools/base44-smoke.mjs` | Built |

---

## Step 2 — what is already proven

`npm run base44:contract`

The four server functions in `base44/functions` are imported and executed by
`tests/base44-contract.test.ts`. Not copies of them — the same source that gets
deployed. Vitest aliases the Deno style `npm:@base44/sdk` specifier to an
in-memory stand-in (`tests/fakes/base44-sdk.ts`) that behaves the way the real
SDK does, including keeping one store per signed-in user so isolation can be
asserted.

Twenty-two checks pass, covering:

- **Authentication** — every endpoint refuses a caller who is not signed in;
  the writing endpoints refuse anything that is not a POST.
- **The slot** — one, two and three are accepted; nought, four, minus one,
  `"two"`, `null` and `1.5` are refused; a save that says it belongs to slot 1
  cannot be written to slot 3.
- **The payload** — an empty one, an unreadable one, one with no `meta.id`, one
  that does not say its format and one with no world clock are all refused, each
  with the specific message.
- **The format** — a save written by a newer build is refused with a 409 rather
  than stored and risked. The supported version is asserted equal to the
  engine's `SAVE_SCHEMA_VERSION`, so a bump that misses one of them fails here.
- **The ledger** — an unbalanced transaction is refused, and so is a posting
  that is not whole cents.
- **Cross-save contamination** — a record carrying a different save's id is
  refused with a 409.
- **Writing** — the first write creates, the second updates, and the previous
  payload is kept as a backup, so a bad write is always recoverable.
- **Retries** — the same idempotency key writes once and replays the first
  answer. The receipt is looked up before the save row is even read, asserted
  by the exact call order.
- **Stale tabs** — a save with an older world clock, or less playtime, cannot
  overwrite newer progress, and the stored row is left untouched.
- **A different universe** — cannot be written into an occupied slot.
- **Reading** — returns what was written, returns nothing for an empty slot,
  hands back the backup when asked, and lists all three slots with their labels.
- **Clearing** — empties the slot, keeps the payload as a backup, is safe to run
  twice, and releases the slot for a different universe.
- **Two players** — cannot see or overwrite each other, even naming the same
  slot number.

### One real bug this found

The clear-slot handler emptied the payload but left `save_id`, `world_now` and
`playtime_seconds` on the row. The forward-progress guard compares against
whatever the row still claims, so **a cleared slot refused the next universe
started in it** — a player who cleared slot 1 and began a new life would have
been told the slot already held a different save. Clearing now releases those
three fields as well, and keeps the backup. That would have shipped.

### What step 2 does not prove

That a deployed project accepts the code. That Base44's own row-level security
is configured the way the entity files ask for. That the network hop works.
Those are step 3, and until step 3 has run against a real deployment, live
persistence stays reported as **unverified**, never as passed.

---

## Step 1 — the project

One signup and one command.

1. **Create a Base44 account and a new app.** Name it whatever you like; the
   repository does not care.
2. **Deploy.**

   ```
   npm run base44:deploy
   ```

   That builds the site and hands Base44 `base44/config.jsonc`, which already
   points at the entity definitions, the functions and the Vite output. Nothing
   in it needs editing.
3. **Check the three entities exist** in the dashboard after the deploy:
   `SlateSave`, `SlateCommandReceipt`, `SlateOfficialResult`. Their JSON in
   `base44/entities` asks for row-level security scoped to the signed-in user.
   Confirm the dashboard agrees, because everything about isolation rests on it.
4. **Open the app and sign in once.** The browser talks to Base44 through that
   session. There is no API key in the bundle and there should never be one.

### Nothing else needs configuring

The game does not read a Base44 key at runtime. `.env` exists only for the
command line — the deploy and the smoke test — and it is git-ignored.

---

## Step 3 — the smoke test

Once the app is deployed and you have signed in:

```
cp .env.example .env      # then fill in the two values
npm run base44:smoke -- --slot 3
```

`SLATE_BASE44_URL` is the deployed app's address. `SLATE_BASE44_TOKEN` is the
bearer token your signed-in browser session sends — a *user* token, not an admin
key, because the smoke test should prove what a player can do and no more.
`.env.example` says where to find both.

It writes only to the slot you name, and it puts back whatever was there when it
finishes. It prints a pass or a fail per check:

1. The deployment answers and the caller is signed in.
2. An anonymous caller is refused.
3. A slot that is not one, two or three is refused.
4. A ledger that does not balance is refused.
5. A real save writes.
6. It reads back byte for byte.
7. A retried write with the same key does not write twice.
8. A stale tab cannot overwrite newer progress.
9. The previous payload is kept as a backup.
10. Clearing releases the slot, and a different universe can use it.
11. Whatever was in the slot before is restored.

Exit 0 means every check passed and live persistence is verified against that
deployment. Exit 78 means the two environment variables are missing and
**nothing was tested** — which the script says in those words, rather than
printing a pass.

Use `--fixture path/to/save.json` to send a real save instead of the built-in
minimal one. A save exported from the game is the strongest version of this test.

---

## After it passes

Say so in `docs/COVERAGE-MATRIX.md` against A8, with the date and the app URL
the run was against. Verified means verified on a deployment, and the record
should name which one.
