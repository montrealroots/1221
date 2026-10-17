# Brief 11, Research: The Two Values No Source Settled (2026-10-16)

Read `common.md` first. Your area is `research`; your clone is `…/scratchpad/research11`, branch `research11`.

| Row | What it lacks at the baseline |
|---|---|
| `KS-ct-idcard` | A Connecticut ID card's term and its mailing for a non-citizen: the tax area's sources weren't conclusive (`docs/verification/remaining/tax-result.json`), and the values stand as assumptions |
| `KS-passport-fees` | Some fees in `src/engine/content/passportsabroad.ts` are estimates marked as assumptions, not verified figures |

For each:

1. Find the value in the code and every reader of it (`grep`), and the research record behind it (`docs/research/world/`).
2. Look for the authoritative source: the Connecticut DMV's own pages and regulations for the ID card; each passport
   issuer's own published fee schedule for a renewal abroad (the issuing government's site, or its consulate's). Use
   WebSearch and WebFetch. A secondary site is not a source.
3. Where a source settles a value, set it, cite the source and the day read where the house cites one (the comment at the
   value, and the research JSON), and test it: a fixture of the figure, and a played journey through the command that
   charges it or reads it where one exists.
4. Where none can be found or reached, say exactly which pages were tried and what each said or why it couldn't be read.
   The row's status is then **Blocked Externally** with that blocker. It isn't verified by a test of an assumed value.

Keep the assumption's label on anything still assumed. Don't change a value without a source.
