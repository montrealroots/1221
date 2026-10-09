# Catalog reconciliation

> **Retired by the owner's scope reset of 2026-10-09**, with the catalogs it reconciled. Kept as history.

What became of the catalog counts the owner's review of `main` at `e96d27fb` questioned, read against the history
on 2026-10-05. The tree wins over any figure here: `docs/CATALOG-COVERAGE.md` and `docs/CATALOG-DEPTH.md` are
generated from it.

## Appliances: 2,025 to 135, and televisions: 706 to 271

**Intentionally discarded.** Both larger figures were the Account 1 session's of 2026-10-04: appliances from
`557f1477` to `929b133f` (2,123 products at its last count) and televisions from `2d47f079` and `dfee3b1c` (975 at
its last count, 706 in an earlier report). The owner had that whole session scratched, and `65840b6e` ("Scratch the
Account 1 session") put the branch back to `18527d25`, taking 140 files and 403,498 lines with it. That work is kept
on `backup/account1-branch-2026-10-05` and `backup/account1-main-2026-10-05`, not to be brought back unless the
owner asks, and it hasn't been.

Both catalogs were rebuilt afterwards from fresh research in this account: washers, dryers and dishwashers from
`2302f566` (55 models) to 135 at `33a406ef`; televisions from `e1f1a34f` to 271 listings at `4d6bc784`.

## The counting change of 2026-10-05

The owner ruled that sizes, colors, storage tiers, configurations and duplicate listings are variants, never
distinct products. tools/catalog-coverage.mjs had counted:

| Category | Counted as products | Before | After |
|---|---|---|---|
| Televisions | each screen size of a series | 271 | 121 series |
| Luggage | each size of a line | 1,745 | 1,344 lines |
| Paint | each finish and can size of a line | 128 | 98 lines |
| Furniture | a size word in the piece's type | 268 | 229 |
| Lighting | each pack size of a bulb | 283 | 273 |
| Cleaning, toiletries, cosmetics, groceries, drinks, pet food | each pack size, a size in the name | 1,563 | 1,522 |
| Mattresses | the same model once a market | | one a model |

Nothing was taken out of the catalogs: every size is still sold, as a variant of its product.

## Not sellable

A product with no regular price read isn't put on sale, by every builder, and isn't counted. A listing replaced or
taken out no longer strands what was bought from it: from 2026-10-05 what was sold is kept with the thing bought
(`Item.made`), and a television, computer, mower or bulb owned keeps working from that (tests/owned-past-listing.test.ts).

## Still to rebuild

Depth: two brand-category pairs hold 100 distinct products, and about 2,800 are short (`docs/CATALOG-DEPTH.md`).
Each is to be researched to its real range, recorded in `docs/research/catalog-ranges.json` where that's under 100.
