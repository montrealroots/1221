# Brief 14: The Papers Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/l14-papers`, on its branch `lang14-papers`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `papers` (`docs/verification/language-2026-10-17/papers/`, `docs/text/statuses/papers.json`).
- **Your port** for the built app: 4206.

## What's Yours

The inventory's subsystem papers: 465 sources, 53,141 words, in 35 files. Each file, its sources and its words, biggest first:

- `src/engine/content/licenses.ts`: 19 sources, 10,373 words
- `src/engine/content/guide/papers.ts`: 22 sources, 9,414 words
- `src/engine/content/guide/taxes.ts`: 11 sources, 5,690 words
- `src/engine/content/passports.ts`: 15 sources, 5,417 words
- `src/engine/content/guide/documents.ts`: 11 sources, 4,054 words
- `src/ui/workspaces/PapersWorkspace.tsx`: 21 sources, 3,509 words
- `src/engine/content/statetax.ts`: 86 sources, 3,343 words
- `src/engine/content/licensepaths.ts`: 69 sources, 2,394 words
- `src/engine/systems/taxreturn.ts`: 32 sources, 1,394 words
- `src/engine/systems/statetax.ts`: 37 sources, 1,157 words
- `src/engine/content/tax.ts`: 10 sources, 817 words
- `src/ui/papers/Documents.tsx`: 13 sources, 793 words
- `src/engine/content/passportsabroad.ts`: 2 sources, 650 words
- `src/engine/systems/abroad.ts`: 15 sources, 584 words
- `src/ui/looks/papers.tsx`: 4 sources, 492 words
- `src/engine/systems/documents.ts`: 13 sources, 459 words
- `src/engine/systems/identity.ts`: 9 sources, 445 words
- `src/engine/systems/residence.ts`: 6 sources, 260 words
- `src/engine/systems/permission.ts`: 6 sources, 228 words
- `src/engine/systems/unemployment.ts`: 7 sources, 200 words
- `src/ui/components/LienPanels.tsx`: 4 sources, 192 words
- `src/engine/content/visas.ts`: 5 sources, 170 words
- `src/engine/systems/assistance.ts`: 6 sources, 167 words
- `src/engine/systems/papervisits.ts`: 2 sources, 151 words
- `src/engine/systems/homepensions.ts`: 6 sources, 120 words
- `src/engine/systems/taxid.ts`: 3 sources, 112 words
- `src/engine/content/safetynet.ts`: 6 sources, 111 words
- `src/engine/systems/homebenefits.ts`: 5 sources, 103 words
- `src/engine/systems/citizenship.ts`: 3 sources, 94 words
- `src/engine/systems/universalcredit.ts`: 5 sources, 87 words
- `src/engine/systems/imss.ts`: 3 sources, 50 words
- `src/engine/systems/socialsecurity.ts`: 3 sources, 36 words
- `src/engine/systems/statepension.ts`: 3 sources, 35 words
- `src/engine/systems/eiself.ts`: 2 sources, 23 words
- `src/engine/content/workrules.ts`: 1 source, 17 words

A file of yours that another area's tests or tools assert is still yours to change; update those assertions and say so in your batch record.

## What To Watch For

- **Official notices and applications:** applying for a document isn't holding it, and the words keep that apart.
  Keep every fee, date, processing time, validity and condition exactly. Where the rules are a published source and
  where the game estimates, say so plainly at the foot.
- **Legal certainty:** don't make a status or a legal consequence sound more certain than the game makes it. Brief 13
  left one open (`../playthroughs-2026-10-17/RECEIPT.md`, Remaining Limitations): J16's Out Of Status notice says the
  visa is void and the Visa Waiver Program closed for good on the day of a dismissal, where for an F-1 student 222(g)
  voidance generally follows a finding of a status violation. Say only what the game does, as the game's rule, without
  asserting the law past what's researched. Record the change as meaning-sensitive.
- **Taxes:** returns, payments, plans, liens and the refusals. Decision 4's tax items (common.md) change words only.
- **Benefits, pensions, unemployment and permission to work** (OPT and the rest).
- **Keys:** document names with `F-1` or `OPT` are read back by the code, so keep them as they are.

**How This Works entries.** An entry in `src/engine/content/guide/*.ts` is a feature's tutorial. Rewrite yours so it answers the
brief's eight questions in order, with the screen's own labels:
- what it's for (`short`);
- where to go (`where`, `available`);
- what to press (`steps`);
- what's needed first (`needs`);
- what happens (`now`, `later`, `costs`, `interpret`);
- how it affects the rest of the game (`connections`, `reads`);
- what to do next (`next`, a new optional field: give every entry one, or `[]` with a reason in your batch record);
- what to do if you can't (`unavailable`, `mistakes`).

Lead with a short plain overview, then the steps, then results, then the deeper explanation and the figures (`reads`,
`example`). Every route and label it gives must exist on the built app: check each against the text walk of your
screens. Figures stay read from the rules' constants, as they are now, never typed into the words. The tutorial area
renames the headings Help shows, so write each field for its question, not for its old heading ("What The Game Reads"
becomes what it affects).
