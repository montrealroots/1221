# Brief 15: The Papers Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/e15-papers`, on its branch `ed15-papers`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `papers` (`docs/verification/editorial-2026-10-19/papers/`, `docs/text/second-pass/papers.json`).
- **Your port** for the built app: 4287.

## What's Yours

465 sources and 55,976 words in 35 files, all Pending in the second pass at the start. Each file, biggest first (sources, words):

- `src/engine/content/licenses.ts`: 19 sources, 10,373 words
- `src/engine/content/guide/papers.ts`: 22 sources, 9,867 words
- `src/engine/content/guide/taxes.ts`: 11 sources, 6,153 words
- `src/engine/content/passports.ts`: 15 sources, 5,426 words
- `src/engine/content/guide/documents.ts`: 11 sources, 4,371 words
- `src/ui/workspaces/PapersWorkspace.tsx`: 21 sources, 4,079 words
- `src/engine/content/statetax.ts`: 86 sources, 3,351 words
- `src/engine/content/licensepaths.ts`: 69 sources, 2,394 words
- `src/engine/systems/taxreturn.ts`: 32 sources, 1,664 words
- `src/engine/systems/statetax.ts`: 37 sources, 1,364 words
- `src/ui/papers/Documents.tsx`: 13 sources, 869 words
- `src/engine/content/tax.ts`: 10 sources, 828 words
- `src/engine/content/passportsabroad.ts`: 2 sources, 672 words
- `src/engine/systems/abroad.ts`: 15 sources, 597 words
- `src/ui/looks/papers.tsx`: 4 sources, 544 words
- `src/engine/systems/identity.ts`: 9 sources, 505 words
- `src/engine/systems/documents.ts`: 13 sources, 502 words
- `src/engine/systems/permission.ts`: 6 sources, 292 words
- `src/engine/systems/residence.ts`: 6 sources, 290 words
- `src/ui/components/LienPanels.tsx`: 4 sources, 229 words
- `src/engine/systems/unemployment.ts`: 7 sources, 212 words
- `src/engine/systems/assistance.ts`: 6 sources, 190 words
- `src/engine/content/visas.ts`: 5 sources, 171 words
- `src/engine/systems/papervisits.ts`: 2 sources, 151 words
- `src/engine/systems/homepensions.ts`: 6 sources, 138 words
- `src/engine/systems/taxid.ts`: 3 sources, 134 words
- `src/engine/content/safetynet.ts`: 6 sources, 111 words
- `src/engine/systems/homebenefits.ts`: 5 sources, 109 words
- `src/engine/systems/citizenship.ts`: 3 sources, 105 words
- `src/engine/systems/universalcredit.ts`: 5 sources, 95 words
- `src/engine/systems/imss.ts`: 3 sources, 59 words
- `src/engine/systems/socialsecurity.ts`: 3 sources, 47 words
- `src/engine/systems/statepension.ts`: 3 sources, 41 words
- `src/engine/systems/eiself.ts`: 2 sources, 26 words
- `src/engine/content/workrules.ts`: 1 source, 17 words

## What To Watch For

**What's yours:** the Papers screen's tax returns, unemployment, passport and ID, and permission to work, with their systems: documents, passports, the ID card, OPT and status, taxes and state taxes, liens, benefits, pensions and the papers visits. The How This Works entries `guide/papers.ts`, `guide/taxes.ts` and `guide/documents.ts` are yours too. Health Cover's systems are health's, though their tab is on Papers.

**From the working reference:** example 5 (a document arriving).

**Say plainly:** applying for a document versus holding it (Being Decided, On Its Way, In Force); a warning versus a formal consequence (a tax notice, a lien, being out of status).

**Voice:** official and exact. Keep each date, amount, deadline and legal condition. Label what's estimated and what the game simplifies. Never make a legal consequence sound more or less certain than the code makes it.

**Interactions to read whole:**

- applying for an ID card or a passport, refused (and why), applied, Being Decided, arrived;
- a tax return due, filed late, the bill, the plan, the lien;
- OPT applied for and decided;
- unemployment claimed.

**Decision 4:** its papers items are words only.
