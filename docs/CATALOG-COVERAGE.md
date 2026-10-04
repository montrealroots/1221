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
| Apparel | Underwear, Lingerie And Socks | 55 | 100% | 299 | 1 / 2 / 15 | 0 | 6182 | 396 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Sleepwear | 50 | 100% | 207 | 1 / 2 / 13 | 0 | 4520 | 236 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Swimwear | 52 | 100% | 496 | 1 / 12 / 12 | 0 | 5692 | 754 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Thermals, Shapewear, Hosiery And Slips | 51 | 100% | 426 | 1 / 12 / 24 | 0 | 5045 | 488 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Cultural Clothing | 13 | 26% | 71 | 1 / 2 / 12 | 0 | 544 | 71 | 0 | IE, MX, US | No |
| Footwear | Shoes, Boots And Sandals | 52 | 100% | 258 | 1 / 3 / 15 | 0 | 5870 | 376 | 0 | CA, GB, IE, MX, US | No |
| Footwear | Sneakers | 1 | 2% | 30 | 30 / 30 / 30 | 0 | 403 | 66 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Bags | 50 | 100% | 249 | 1 / 2 / 12 | 0 | 728 | 352 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Hats, Scarves, Belts And Small Accessories | 54 | 100% | 329 | 1 / 3 / 17 | 0 | 1776 | 384 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Watches | 52 | 100% | 362 | 1 / 8 / 12 | 0 | 563 | 479 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Jewelry | 52 | 100% | 285 | 1 / 2 / 15 | 0 | 543 | 387 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Luggage | 55 | 100% | 1906 | 1 / 26 / 100 | 2 | 6580 | 3567 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Phones | 3 | 6% | 26 | 7 / 9 / 10 | 0 | 90 | 273 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Game Consoles | 3 | 6% | 6 | 1 / 2 / 3 | 0 | 6 | 36 | 0 | CA, GB, IE, MX, US | Narrow market: three makers sell home consoles: Sony, Microsoft and Nintendo |
| Electronics | Computers | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Electronics | Televisions | 50 | 100% | 1294 | 2 / 8 / 310 | 4 | 1300 | 2069 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Audio Equipment | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Home | Furniture | 1 | 2% | 90 | 90 / 90 / 90 | 0 | 90 | 163 | 0 | CA, GB, IE, MX, US | No |
| Home | Mattresses And Beds | 1 | 2% | 29 | 29 / 29 / 29 | 0 | 54 | 69 | 0 | CA, GB, IE, MX, US | No |
| Home | Bedding And Towels | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Home | Appliances | 56 | 100% | 2123 | 1 / 19 / 232 | 5 | 2188 | 3010 | 0 | CA, GB, IE, MX, US | No |
| Home | Lighting | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Home | Kitchenware | 0 | 0% | 10 | — | 0 | 10 | 10 | 10 | CA, GB, IE, MX, US | No |
| Personal Care | Toiletries And Grooming | 75 | 100% | 182 | 1 / 1 / 15 | 0 | 182 | 183 | 1 | CA, GB, IE, MX, US | No |
| Personal Care | Cosmetics And Haircare | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Household | Cleaning Products And Consumables | 80 | 100% | 289 | 1 / 2 / 27 | 0 | 289 | 312 | 3 | CA, GB, IE, MX, US | No |
| Food | Groceries | 133 | 100% | 455 | 1 / 1 / 58 | 0 | 455 | 466 | 63 | CA, GB, IE, MX, US | No |
| Food | Beverages | 28 | 56% | 39 | 1 / 1 / 3 | 0 | 39 | 40 | 1 | CA, GB, IE, MX, US | No |
| Vehicles | Cars, Pickups And Vans | 16 | 32% | 37 | 1 / 1 / 7 | 0 | 37 | 53 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Motorcycles And Scooters | 9 | 18% | 25 | 1 / 2 / 10 | 0 | 25 | 36 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Bicycles, E-Bikes And ATVs | 9 | 18% | 20 | 1 / 2 / 5 | 0 | 20 | 26 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Motorhomes And Campervans | 10 | 20% | 19 | 1 / 2 / 4 | 0 | 19 | 21 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Boats | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | Narrow market: recreational boat makers number in the dozens, few publishing prices |
| Vehicles | Light Aircraft | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | Narrow market: a handful of makers build new light aircraft for private owners |
| Vehicles | Factory Options | 16 | 32% | 643 | 5 / 34 / 136 | 1 | 643 | 643 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Tires And Wheels | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Vehicles | Car Audio | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Building And Garden | Building Materials, Fixtures And Finishes | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Building And Garden | Garden Equipment | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Sport | Sports Equipment | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Pets | Pet Supplies | 11 | 22% | 28 | 1 / 1 / 3 | 0 | 28 | 31 | 11 | CA, GB, IE, MX, US | No |

0 of 45 brand and narrow categories meet the target.

## Service directories

Counted by their own structure: providers, branches or listings, and the towns they cover.

| Category | Providers | Branches Or Listings | Towns |
|---|---|---|---|
| Hotels | 23 | 28 | 8 |
| Restaurants | 105 | 107 | 8 |
| Clubs And Lessons | 30 | 31 | 8 |
| Clinics, Dentists And Opticians | 35 | 35 | 8 |
| Stores And Chains | 360 | 126 | 8 |
| Barbers And Salons | 36 | 37 | 8 |

