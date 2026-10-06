# Catalog coverage

Written by `tools/catalog-coverage.mjs` from the catalogs themselves; don't edit by hand. The hierarchy is
`src/engine/content/catalogtaxonomy.ts`. The target for a brand category is at least
50 real brands, each with at least 100 distinct real products where the brand's range reaches that
many (the owner, 2026-10-03, corrected 2026-10-05: a hundred is a floor, not a ceiling). A brand whose researched
real range is smaller meets it with its whole range held (`docs/research/catalog-ranges.json`). Brands, distinct
products, variants and offers are counted apart: a product sold by several sellers is one product with several
offers, and its sizes, colors, storage tiers, configurations and pack counts are its variants, never products of
their own. Owned items are counted in each save, on Belongings. A category none of whose catalogs records a brand
counts its products as unbranded, which never counts toward the target. Each brand's own count is in
`docs/CATALOG-DEPTH.md`.

## Brand categories

| Department | Category | Brands | Of 50 | Products | Per brand (least / median / most) | Brands Deep Enough | Variants | Offers | Unbranded | Markets | Met |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Apparel | Everyday Clothing | 136 | 100% | 1409 | 1 / 2 / 114 | 1 | 33496 | 1559 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Formalwear | 78 | 100% | 308 | 1 / 2 / 34 | 0 | 5340 | 334 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Outerwear | 69 | 100% | 286 | 1 / 2 / 18 | 0 | 4616 | 333 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Activewear | 50 | 100% | 302 | 1 / 3 / 55 | 0 | 11194 | 362 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Underwear, Lingerie And Socks | 65 | 100% | 203 | 1 / 2 / 15 | 0 | 2965 | 225 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Sleepwear | 60 | 100% | 214 | 1 / 3 / 13 | 0 | 3098 | 233 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Swimwear | 53 | 100% | 201 | 1 / 3 / 11 | 0 | 611 | 206 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Thermals, Shapewear, Hosiery And Slips | 106 | 100% | 413 | 1 / 4 / 15 | 0 | 1141 | 415 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Cultural Clothing | 52 | 100% | 122 | 1 / 3 / 4 | 0 | 629 | 122 | 0 | CA, GB, IE, MX, US | No |
| Footwear | Shoes, Boots And Sandals | 61 | 100% | 157 | 1 / 2 / 12 | 0 | 1547 | 169 | 0 | CA, GB, IE, MX, US | No |
| Footwear | Sneakers | 61 | 100% | 217 | 1 / 2 / 32 | 0 | 1248 | 240 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Bags | 56 | 100% | 171 | 1 / 2 / 15 | 0 | 233 | 176 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Hats, Scarves, Belts And Small Accessories | 67 | 100% | 188 | 1 / 3 / 17 | 0 | 512 | 194 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Watches | 55 | 100% | 167 | 1 / 2 / 12 | 0 | 168 | 169 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Jewelry | 50 | 100% | 136 | 1 / 2 / 15 | 0 | 197 | 139 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Luggage | 53 | 100% | 1344 | 1 / 18 / 95 | 0 | 4257 | 3241 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Phones | 53 | 100% | 127 | 1 / 2 / 18 | 2 | 253 | 414 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Game Consoles | 3 | 6% | 9 | 2 / 3 / 4 | 3 | 9 | 39 | 0 | CA, GB, IE, MX, US | Narrow market: three makers sell home consoles: Sony, Microsoft and Nintendo |
| Electronics | Computers | 56 | 100% | 173 | 1 / 1 / 15 | 2 | 173 | 174 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Televisions | 51 | 100% | 130 | 1 / 2 / 14 | 4 | 130 | 339 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Audio Equipment | 68 | 100% | 215 | 1 / 2 / 18 | 0 | 279 | 259 | 0 | CA, GB, IE, MX, US | No |
| Home | Furniture | 66 | 100% | 229 | 1 / 2 / 56 | 0 | 229 | 341 | 0 | CA, GB, IE, MX, US | No |
| Home | Mattresses And Beds | 55 | 100% | 156 | 1 / 1 / 29 | 7 | 156 | 413 | 0 | CA, GB, IE, MX, US | No |
| Home | Bedding And Towels | 63 | 100% | 114 | 1 / 2 / 5 | 0 | 146 | 114 | 0 | CA, GB, IE, MX, US | No |
| Home | Appliances | 59 | 100% | 135 | 1 / 2 / 7 | 1 | 137 | 135 | 0 | CA, GB, IE, MX, US | No |
| Home | Lighting | 76 | 100% | 273 | 1 / 3 / 23 | 0 | 330 | 283 | 0 | CA, GB, IE, MX, US | No |
| Home | Kitchenware | 54 | 100% | 120 | 1 / 2 / 9 | 0 | 120 | 121 | 0 | CA, GB, IE, MX, US | No |
| Personal Care | Toiletries And Grooming | 85 | 100% | 315 | 1 / 2 / 26 | 0 | 315 | 322 | 1 | CA, GB, IE, MX, US | No |
| Personal Care | Cosmetics And Haircare | 52 | 100% | 128 | 1 / 1 / 15 | 0 | 128 | 134 | 0 | CA, GB, IE, MX, US | No |
| Household | Cleaning Products And Consumables | 64 | 100% | 245 | 1 / 3 / 14 | 0 | 245 | 268 | 0 | CA, GB, IE, MX, US | No |
| Food | Groceries | 176 | 100% | 556 | 1 / 1 / 58 | 0 | 556 | 574 | 40 | CA, GB, IE, MX, US | No |
| Food | Beverages | 74 | 100% | 139 | 1 / 1 / 8 | 0 | 139 | 148 | 1 | CA, GB, IE, MX, US | No |
| Vehicles | Cars, Pickups And Vans | 74 | 100% | 481 | 1 / 4 / 22 | 18 | 481 | 829 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Motorcycles And Scooters | 66 | 100% | 610 | 1 / 7 / 63 | 3 | 610 | 728 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Bicycles, E-Bikes And ATVs | 72 | 100% | 354 | 1 / 4 / 17 | 0 | 354 | 372 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Motorhomes And Campervans | 53 | 100% | 111 | 1 / 1 / 31 | 0 | 111 | 127 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Boats | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | Narrow market: recreational boat makers number in the dozens, few publishing prices |
| Vehicles | Light Aircraft | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | Narrow market: a handful of makers build new light aircraft for private owners |
| Vehicles | Factory Options | 63 | 100% | 976 | 1 / 7 / 136 | 1 | 976 | 976 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Tires And Wheels | 53 | 100% | 195 | 1 / 1 / 40 | 0 | 195 | 266 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Car Audio | 55 | 100% | 149 | 1 / 1 / 12 | 0 | 149 | 156 | 0 | CA, GB, IE, MX, US | No |
| Building And Garden | Building Materials, Fixtures And Finishes | 60 | 100% | 98 | 1 / 1 / 7 | 0 | 98 | 134 | 0 | CA, GB, IE, MX, US | No |
| Building And Garden | Garden Equipment | 52 | 100% | 168 | 1 / 2 / 15 | 0 | 168 | 169 | 0 | CA, GB, IE, MX, US | No |
| Sport | Sports Equipment | 54 | 100% | 187 | 1 / 2 / 27 | 0 | 187 | 187 | 0 | CA, GB, IE, MX, US | No |
| Pets | Pet Supplies | 61 | 100% | 140 | 1 / 1 / 9 | 0 | 140 | 144 | 11 | CA, GB, IE, MX, US | No |

0 of 45 brand and narrow categories meet the target.

## Service directories

Counted by their own structure: providers, branches or listings, and the towns they cover.

| Category | Providers | Branches Or Listings | Towns |
|---|---|---|---|
| Hotels | 23 | 28 | 8 |
| Restaurants | 105 | 107 | 8 |
| Clubs And Lessons | 30 | 31 | 8 |
| Clinics, Dentists And Opticians | 35 | 35 | 8 |
| Stores And Chains | 596 | 145 | 8 |
| Barbers And Salons | 36 | 37 | 8 |

