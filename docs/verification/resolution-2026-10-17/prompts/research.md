# Brief 12, Research: The Two Document Blockers (2026-10-17)

Read `common.md` first. Your area is `research`; your clone is `…/scratchpad/research12`, branch `research12`.

## The Owner's Resolution (Brief 12, Section 4, Quoted)

> Make a focused attempt to resolve:
>
> - The applicable Connecticut non-citizen ID-card validity period.
> - The unresolved Japan/New York and New Zealand passport-office fees identified in the checklist.
>
> Use authoritative sources and record the jurisdiction, service, currency, effective date, and retrieval date. Separate
> unavailable information from blocked access.
>
> Do not send messages or contact institutions on my behalf without separate authorization.
>
> If reliable information remains unavailable, I authorize a clearly labeled, configurable simulation assumption for the
> unresolved value:
>
> - Choose a reasonable default and document its basis.
> - Label it as SLATE's assumption, not verified official policy.
> - Keep confirmed facts separate.
> - Make future correction possible without corrupting existing documents, charges, or histories.
> - Explain what happens when a rule changes.
> - Test issuance, validity or expiration, renewal, charging, duplicate attempts, and save/load as applicable.
>
> A simulated behavior may be implemented and verified against its specification while its real-world source remains
> unverified. Preserve both facts in the record.

## Where It Stands

- **Brief 11's research area** (`docs/verification/completion-2026-10-16/research-result.json`, with the research records
  under `docs/research/world/`) settled most of each row. It left both Blocked Externally:
  - **Connecticut:** no published page or law gives the term of a non-verified card for somebody not a citizen. SLATE
    holds it to the end of lawful presence, labelled as its assumption.
  - **Japan:** every New York consulate page and MOFA page returned 403.
  - **New Zealand:** passports.govt.nz returned a Cloudflare challenge and 503, legislation.govt.nz an empty 202, and the
    Internet Archive reset every connection. That leaves whether GST applies to an applicant in the US, and the urgent
    fee from overseas.
- **The code:** `src/engine/content/identity.ts` and `src/engine/systems/identity.ts` (the card), and
  `src/engine/content/passportsabroad.ts` (the fees).

## How To Work It

1. **A focused attempt,** with WebSearch and WebFetch (load them with ToolSearch, `select:WebSearch,WebFetch`). Try what
   brief 11 didn't:
   - other official mirrors: Japan's other consulates' fee pages for the same period, MOFA's English pages, the Federal
     Register or e-Gov for the fee ordinance;
   - New Zealand's DIA pages on other hosts, the Gazette, and the fees regulations at legislation.govt.nz in another
     format;
   - the Connecticut eRegulations and the statutes again, for a non-verified card's term.

   A secondary site is not a source. Record every page tried and what it gave, and keep **unavailable** (no source
   publishes it) apart from **blocked** (a source exists, and access was refused or failed).
2. **Where a source settles a value,** set it with its jurisdiction, service, currency, effective date and retrieval date,
   in the code's comment and the research JSON, and test it through the command that charges or reads it.
3. **Where none does,** make the assumption the owner authorizes:
   - **Configurable:** one named constant, labelled SLATE's assumption in its comment, in the guide and wherever a screen
     shows it. Its basis is documented.
   - **Changed safely:** a document already issued keeps the term and fee it was issued with, and a charge already posted
     stands. A change applies to what's issued after. Test that by changing the value in a test: an existing card keeps
     its expiry, a new one takes the new term, and the history and ledger are untouched.
   - **Tested** through the commands: issuance, validity and expiration, renewal, charging, a duplicate attempt, and a
     save and a load.
4. **Your result:** each row with disposition `closed` where sources settle everything, or `research assumption` where an
   assumption stands. The status is Implemented And Verified where the simulated behavior is verified against its
   specification. Keep the verified facts and the assumptions in separate lists, with each source and each blocked page.
