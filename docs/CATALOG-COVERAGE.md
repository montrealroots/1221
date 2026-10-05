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
| Apparel | Everyday Clothing | 124 | 100% | 1346 | 1 / 2 / 114 | 1 | 33392 | 1493 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Formalwear | 80 | 100% | 308 | 1 / 2 / 34 | 0 | 5345 | 333 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Outerwear | 70 | 100% | 287 | 1 / 2 / 18 | 0 | 4651 | 333 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Activewear | 52 | 100% | 303 | 1 / 3 / 55 | 0 | 11218 | 362 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Underwear, Lingerie And Socks | 66 | 100% | 204 | 1 / 2 / 12 | 0 | 3015 | 225 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Sleepwear | 61 | 100% | 214 | 1 / 2 / 13 | 0 | 3098 | 233 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Swimwear | 51 | 100% | 195 | 1 / 4 / 11 | 0 | 558 | 200 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Thermals, Shapewear, Hosiery And Slips | 106 | 100% | 413 | 1 / 4 / 15 | 0 | 1141 | 415 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Cultural Clothing | 8 | 16% | 11 | 1 / 1 / 2 | 0 | 11 | 11 | 0 | IE, MX | No |
| Footwear | Shoes, Boots And Sandals | 55 | 100% | 161 | 1 / 2 / 15 | 0 | 1634 | 178 | 0 | CA, GB, IE, MX, US | No |
| Footwear | Sneakers | 0 | 0% | 30 | — | 0 | 403 | 30 | 30 | — | No |
| Accessories | Bags | 50 | 100% | 117 | 1 / 2 / 9 | 0 | 173 | 120 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Hats, Scarves, Belts And Small Accessories | 49 | 98% | 128 | 1 / 2 / 17 | 0 | 446 | 131 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Watches | 50 | 100% | 113 | 1 / 2 / 8 | 0 | 113 | 113 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Jewelry | 50 | 100% | 105 | 1 / 2 / 15 | 0 | 166 | 106 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Luggage | 47 | 94% | 1738 | 1 / 30 / 100 | 2 | 6018 | 3233 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Phones | 26 | 52% | 67 | 1 / 2 / 10 | 0 | 181 | 332 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Game Consoles | 3 | 6% | 6 | 1 / 2 / 3 | 0 | 6 | 36 | 0 | CA, GB, IE, MX, US | Narrow market: three makers sell home consoles: Sony, Microsoft and Nintendo |
| Electronics | Computers | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Electronics | Televisions | 24 | 48% | 220 | 1 / 5 / 40 | 0 | 222 | 261 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Audio Equipment | 35 | 70% | 156 | 1 / 3 / 13 | 0 | 188 | 161 | 0 | GB, US | No |
| Home | Furniture | 1 | 2% | 90 | 90 / 90 / 90 | 0 | 90 | 163 | 0 | CA, GB, IE, MX, US | No |
| Home | Mattresses And Beds | 28 | 56% | 56 | 1 / 1 / 29 | 0 | 56 | 142 | 0 | CA, GB, IE, MX, US | No |
| Home | Bedding And Towels | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Home | Appliances | 28 | 56% | 55 | 1 / 2 / 5 | 0 | 57 | 55 | 0 | CA, GB, IE, MX, US | No |
| Home | Lighting | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Home | Kitchenware | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Personal Care | Toiletries And Grooming | 82 | 100% | 182 | 1 / 1 / 15 | 0 | 182 | 183 | 1 | CA, GB, IE, MX, US | No |
| Personal Care | Cosmetics And Haircare | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Household | Cleaning Products And Consumables | 46 | 92% | 105 | 1 / 1 / 9 | 0 | 105 | 110 | 0 | CA, GB, IE, MX, US | No |
| Food | Groceries | 183 | 100% | 500 | 1 / 1 / 62 | 0 | 500 | 512 | 42 | CA, GB, IE, MX, US | No |
| Food | Beverages | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Vehicles | Cars, Pickups And Vans | 74 | 100% | 481 | 1 / 4 / 22 | 0 | 481 | 829 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Motorcycles And Scooters | 56 | 100% | 540 | 1 / 8 / 43 | 0 | 540 | 646 | 0 | CA, GB, IE, MX, US | No |
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
| Pets | Pet Supplies | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |

0 of 45 brand and narrow categories meet the target.

## Service directories

Counted by their own structure: providers, branches or listings, and the towns they cover.

| Category | Providers | Branches Or Listings | Towns |
|---|---|---|---|
| Hotels | 23 | 28 | 8 |
| Restaurants | 105 | 107 | 8 |
| Clubs And Lessons | 30 | 31 | 8 |
| Clinics, Dentists And Opticians | 35 | 35 | 8 |
| Stores And Chains | 324 | 145 | 8 |
| Barbers And Salons | 36 | 37 | 8 |

