# Catalog coverage

Written by `tools/catalog-coverage.mjs` from the catalogs themselves; don't edit by hand. The hierarchy is
`src/engine/content/catalogtaxonomy.ts`. The target for a brand category is at least
50 real brands and up to 100 distinct real products from each where the brand makes
that many (the owner, 2026-10-03). Brands, products, variants and offers are counted
apart: a product sold by several sellers is one product with several offers. A
category none of whose catalogs records a brand counts its products as unbranded,
which never counts toward the target.

## Brand categories

| Department | Category | Brands | Of 50 | Products | Per brand (least / median / most) | Brands at 100 | Variants | Offers | Unbranded | Markets | Met |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Apparel | Everyday Clothing | 121 | 100% | 1343 | 1 / 2 / 114 | 1 | 33326 | 1493 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Formalwear | 78 | 100% | 307 | 1 / 2 / 34 | 0 | 5333 | 333 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Outerwear | 69 | 100% | 286 | 1 / 2 / 18 | 0 | 4616 | 333 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Activewear | 50 | 100% | 302 | 1 / 3 / 55 | 0 | 11194 | 362 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Underwear, Lingerie And Socks | 65 | 100% | 203 | 1 / 2 / 15 | 0 | 2965 | 225 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Sleepwear | 60 | 100% | 214 | 1 / 3 / 13 | 0 | 3098 | 233 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Swimwear | 53 | 100% | 201 | 1 / 3 / 11 | 0 | 611 | 206 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Thermals, Shapewear, Hosiery And Slips | 106 | 100% | 413 | 1 / 4 / 15 | 0 | 1141 | 415 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Cultural Clothing | 46 | 92% | 98 | 1 / 2 / 3 | 0 | 420 | 98 | 0 | CA, GB, IE, MX, US | No |
| Footwear | Shoes, Boots And Sandals | 52 | 100% | 161 | 1 / 2 / 15 | 0 | 1634 | 178 | 0 | CA, GB, IE, MX, US | No |
| Footwear | Sneakers | 1 | 2% | 30 | 30 / 30 / 30 | 0 | 403 | 30 | 0 | — | No |
| Accessories | Bags | 49 | 98% | 116 | 1 / 2 / 9 | 0 | 165 | 120 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Hats, Scarves, Belts And Small Accessories | 67 | 100% | 188 | 1 / 3 / 17 | 0 | 512 | 194 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Watches | 47 | 94% | 113 | 1 / 2 / 8 | 0 | 113 | 113 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Jewelry | 50 | 100% | 105 | 1 / 2 / 15 | 0 | 166 | 106 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Luggage | 47 | 94% | 1738 | 1 / 30 / 100 | 2 | 6018 | 3233 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Phones | 53 | 100% | 110 | 1 / 1 / 10 | 0 | 236 | 377 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Game Consoles | 3 | 6% | 6 | 1 / 2 / 3 | 0 | 6 | 36 | 0 | CA, GB, IE, MX, US | Narrow market: three makers sell home consoles: Sony, Microsoft and Nintendo |
| Electronics | Computers | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Electronics | Televisions | 50 | 100% | 263 | 1 / 2 / 40 | 0 | 265 | 307 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Audio Equipment | 68 | 100% | 199 | 1 / 2 / 13 | 0 | 260 | 212 | 0 | CA, GB, IE, MX, US | No |
| Home | Furniture | 65 | 100% | 221 | 1 / 2 / 90 | 0 | 221 | 294 | 0 | CA, GB, IE, MX, US | No |
| Home | Mattresses And Beds | 53 | 100% | 88 | 1 / 1 / 29 | 0 | 88 | 249 | 0 | CA, GB, IE, MX, US | No |
| Home | Bedding And Towels | 61 | 100% | 102 | 1 / 2 / 5 | 0 | 117 | 102 | 0 | CA, GB, IE, MX, US | No |
| Home | Appliances | 59 | 100% | 110 | 1 / 2 / 5 | 0 | 112 | 110 | 0 | CA, GB, IE, MX, US | No |
| Home | Lighting | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Home | Kitchenware | 54 | 100% | 84 | 1 / 1 / 6 | 0 | 84 | 85 | 0 | CA, GB, IE, MX, US | No |
| Personal Care | Toiletries And Grooming | 82 | 100% | 182 | 1 / 1 / 15 | 0 | 182 | 183 | 1 | CA, GB, IE, MX, US | No |
| Personal Care | Cosmetics And Haircare | 26 | 52% | 62 | 1 / 1 / 10 | 0 | 62 | 64 | 0 | CA, GB, IE, MX, US | No |
| Household | Cleaning Products And Consumables | 59 | 100% | 119 | 1 / 1 / 9 | 0 | 119 | 124 | 0 | CA, GB, IE, MX, US | No |
| Food | Groceries | 160 | 100% | 461 | 1 / 1 / 59 | 0 | 461 | 472 | 41 | CA, GB, IE, MX, US | No |
| Food | Beverages | 57 | 100% | 71 | 1 / 1 / 3 | 0 | 71 | 74 | 1 | CA, GB, IE, MX, US | No |
| Vehicles | Cars, Pickups And Vans | 74 | 100% | 481 | 1 / 4 / 22 | 0 | 481 | 829 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Motorcycles And Scooters | 66 | 100% | 580 | 1 / 7 / 44 | 0 | 580 | 691 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Bicycles, E-Bikes And ATVs | 72 | 100% | 354 | 1 / 4 / 17 | 0 | 354 | 372 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Motorhomes And Campervans | 49 | 98% | 76 | 1 / 1 / 4 | 0 | 76 | 78 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Boats | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | Narrow market: recreational boat makers number in the dozens, few publishing prices |
| Vehicles | Light Aircraft | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | Narrow market: a handful of makers build new light aircraft for private owners |
| Vehicles | Factory Options | 16 | 32% | 643 | 5 / 34 / 136 | 1 | 643 | 643 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Tires And Wheels | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Vehicles | Car Audio | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Building And Garden | Building Materials, Fixtures And Finishes | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Building And Garden | Garden Equipment | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Sport | Sports Equipment | 54 | 100% | 130 | 1 / 2 / 19 | 0 | 130 | 130 | 0 | CA, GB, IE, MX, US | No |
| Pets | Pet Supplies | 57 | 100% | 85 | 1 / 1 / 3 | 0 | 85 | 88 | 11 | CA, GB, IE, MX, US | No |

0 of 45 brand and narrow categories meet the target.

## Service directories

Counted by their own structure: providers, branches or listings, and the towns they cover.

| Category | Providers | Branches Or Listings | Towns |
|---|---|---|---|
| Hotels | 23 | 28 | 8 |
| Restaurants | 105 | 107 | 8 |
| Clubs And Lessons | 30 | 31 | 8 |
| Clinics, Dentists And Opticians | 35 | 35 | 8 |
| Stores And Chains | 426 | 145 | 8 |
| Barbers And Salons | 36 | 37 | 8 |

