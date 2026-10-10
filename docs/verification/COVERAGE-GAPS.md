# Closing The Remaining Gameplay Coverage Gaps

The brief of 2026-10-10, "Close SLATE's Remaining Gameplay Coverage Gaps", worked from `main` at `9ae9879b`.

- **Final candidate:** `bf8918e3` on `claude/coverage-gaps`.
- **Gate:** exit 0, read from a file. 136 files and 1,510 tests, and all fifteen checks.
- **Build:** `npm run build` passes.
- **Suites:** the 18 lives, mastery, fitness and condition all reran on it (`REPORT.md`).

## The count

| | Verified | Partial | Unresolved | Legacy | Informational | Items |
|---|---|---|---|---|---|---|
| Before (the audit at `9ae9879b`) | 247 | 19 | 18 | — | 8 | 292 |
| After | 265 | 0 | 16 | 3 | 8 | 292 |

**Built, connected or tested to verified: 21 items.**
- **Life (4):** the calendar skip, medical debt paid, appetite.
- **School (7):** classmate answers, and the run record across School, Rep, Cabaret and Summer, read once by casting. Also recess.
- **Money (2):** the account number as a credential, and statement cuts kept.
- **Papers (8):**
  - the license by mail;
  - the police report's reader;
  - Connecticut's student rule;
  - SNAP's student rule and its income split.

**Legacy (3).** A new category for compatibility paths, tested through legacy state: a visit, the Seguro de Desempleo's months, and a naturalization decided.

**Reclassified to unresolved (2).** Nothing was built for either:
- England's prescription prepayment works, but only a London fixture reaches it.
- The trait line points at the receipts gap.

Each item's disposition was recorded before the work, with its outcome after: `open-items.json`. Each moved row says why: `GAMEPLAY-COVERAGE.md`, What Moved, And Why.

## What was built

- **Classmate answers read later.**
  - Two invitations declined stop that classmate asking for 45 days.
  - Helping with lines brings an invitation back within 60 days.
  - An accepted boundary lifts after 2 rehearsals kept; one pushed back on, after 4.
  - All shown on the partner line (`classmates.ts`).
- **The run record** (`noteRun`, `readRuns`).
  - Every night of every run is kept.
  - At each casting, the chair reads the runs since the last one, once.
  - Weighting: by nights, capped at 8. Cabaret and Summer count half. The earlier record carries at half its weight, and the whole is capped at 12.
  - A missed night counts as nothing delivered. Quality is kept out of it.
  - The term evaluation reads School, Rep and Cabaret runs; Summer reaches casting only.
  - Why This Cast lists the runs it read.
- **Recess** is shown to be set by the calendar's dates; its notice is a reminder.
- **The account number as a credential.**
  - Debit fraud at a renumbering bank exposes it for a year.
  - Attempts on it come at the BJS 21% yearly repeat rate. While it's the number in use they go through; Regulation E leaves $0 within 60 days for a transfer without a card.
  - Once the account moves to a new number, attempts on the old one are declined. Card fraud stays separate.
- **Statement cuts kept** (`CardState.cuts`).
  - Past periods are built from the cuts, so a moved statement day moves only later statements.
  - A legacy card's past is marked Rebuilt.
- **Papers.**
  - A New York license is replaced by mail (MV-44), free with a police report (MV-78B).
  - Connecticut's full-time student rule (CGS 31-235(b)).
  - SNAP's student rule (7 CFR 273.5), with work-study excluded and income split earned and unearned (273.9).
  - Social Security credits no longer count FICA-exempt work-study.
  - Residence must be continuous for settlement and naturalization.
  - Mexican residence is disclosed before payment.
  - Legacy pensions now reach income.

## Research

`docs/research/world/research-coverage-gaps.json`: 25 entries, each with its citation, source, jurisdiction, date and uncertainty.

**Most uncertain:**
- Whether the Summer Cabaret stipend is covered employment for Connecticut unemployment.
- Connecticut residence for a student's ID card.
- California mailing a license out of state.
- New Haven's online lost-property reports.
- The repeat-fraud rate: BJS 2014, any kind of identity theft. It is the only figure found.
- Yale Drama's tuition.

## Measured, not changed: the leads

Careful students take four or five leads in five productions in most seeds. This is not a scoring defect: delivery and fit are read the same way for everyone. It follows from the student's talent being drawn from the class's top quarter.
- A balance after a lead of −4 moves one seed by one lead.
- Talent drawn from the whole range gives one to three leads.

See `LEADS.md`.

## For the owner

Each is a recommendation. Nothing was built to make these items reachable.

1. **Mexican residence, renewal, settlement, naturalization.**
   - **Today:** a wealthy start can pay for documents nothing reads. No life moves to Mexico; the panel now says so before payment.
   - **Recommendation:** withdraw the offer to new lives, and keep it for saves that hold residence.
   - **Effect:** removes a money sink; nothing else changes.
2. **The receipts modifier on Chaotic and Keeps Accounts.**
   - **Today:** no receipt-dependent tax benefit reaches a student; the research checked the performing-artist deduction, the employee-expense suspension and the Lifetime Learning Credit. The knob now says it decides nothing.
   - **Recommendation:** retire the modifier from both traits. Rewrite Keeps Accounts' upside, or retire the trait, since without receipts it is all cost (`bondWound`).
   - **Effect:** two traits' descriptions change; play doesn't, since the effect was nil.
3. **Foreign benefits and pensions** (Canada's EI, Ireland's, Britain's, Mexico's), and England's prescription prepayment.
   - **Today:** each works for saves that hold it and is reachable by no new life.
   - **Recommendation:** keep them as compatibility paths and offer them to no new life.
   - **Effect:** none in a new life.
4. **The student's talent range.**
   - **Today:** drawn from the class's top quarter (`LEADS.md`).
   - **Recommendation:** keep, unless the student should start as one of the class.
   - **Effect if changed:** fewer leads, abilities a few points lower.
5. **A student who never prepares** is dismissed in the second year.
   - **Recommendation:** keep; it is the standard.
   - **Decided:** kept, at the owner's word on 2026-10-10.

## Save compatibility

Schema 94, unchanged. Every new field is optional, and an older save reads it as absent:
- `SchoolRecord.runs`, `LastWork.weight` and `.from`;
- `CardState.cuts`;
- `Account.exposed`;
- `fraud[].via`;
- `EarningsRecord.kinds`;
- `boundary.accepted`.

Each fallback is tested:
- **Casting** reads a save's last production delivery as that run.
- **Statements** are marked Rebuilt.
- **A SNAP month** without kinds is read as it was.
- **A boundary** with no answer kept lifts after 3 rehearsals, as before.

The backend contract is untouched.
