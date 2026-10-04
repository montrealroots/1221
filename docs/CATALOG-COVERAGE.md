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
| Apparel | Everyday Clothing | 47 | 94% | 209 | 1 / 2 / 21 | 0 | 6147 | 225 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Formalwear | 54 | 100% | 179 | 1 / 2 / 34 | 0 | 2324 | 187 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Outerwear | 43 | 86% | 119 | 1 / 2 / 16 | 0 | 1540 | 128 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Activewear | 26 | 52% | 77 | 1 / 2 / 16 | 0 | 1851 | 83 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Underwear, Lingerie And Socks | 29 | 58% | 93 | 1 / 2 / 12 | 0 | 1555 | 102 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Sleepwear | 34 | 68% | 62 | 1 / 1 / 7 | 0 | 722 | 66 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Swimwear | 11 | 22% | 18 | 1 / 1 / 4 | 0 | 18 | 19 | 0 | CA, GB, MX, US | No |
| Apparel | Thermals, Shapewear, Hosiery And Slips | 26 | 52% | 79 | 1 / 2 / 11 | 0 | 79 | 81 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Cultural Clothing | 8 | 16% | 11 | 1 / 1 / 2 | 0 | 11 | 11 | 0 | IE, MX | No |
| Footwear | Shoes, Boots And Sandals | 45 | 90% | 129 | 1 / 1 / 15 | 0 | 1605 | 148 | 0 | CA, GB, IE, MX, US | No |
| Footwear | Sneakers | 0 | 0% | 30 | — | 0 | 403 | 30 | 30 | — | No |
| Accessories | Bags | 36 | 72% | 70 | 1 / 1 / 9 | 0 | 125 | 74 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Hats, Scarves, Belts And Small Accessories | 33 | 66% | 74 | 1 / 1 / 17 | 0 | 392 | 77 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Watches | 22 | 44% | 50 | 1 / 2 / 8 | 0 | 50 | 50 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Jewelry | 34 | 68% | 69 | 1 / 1 / 15 | 0 | 126 | 71 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Luggage | 47 | 94% | 1738 | 1 / 30 / 100 | 2 | 6018 | 3233 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Phones | 3 | 6% | 26 | 7 / 9 / 10 | 0 | 90 | 273 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Game Consoles | 3 | 6% | 6 | 1 / 2 / 3 | 0 | 6 | 36 | 0 | CA, GB, IE, MX, US | Narrow market: three makers sell home consoles: Sony, Microsoft and Nintendo |
| Electronics | Computers | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Electronics | Televisions | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Electronics | Audio Equipment | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Home | Furniture | 1 | 2% | 90 | 90 / 90 / 90 | 0 | 90 | 163 | 0 | CA, GB, IE, MX, US | No |
| Home | Mattresses And Beds | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Home | Bedding And Towels | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Home | Appliances | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Home | Lighting | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Home | Kitchenware | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Personal Care | Toiletries And Grooming | 0 | 0% | 182 | — | 0 | 182 | 183 | 182 | CA, GB, IE, MX, US | No |
| Personal Care | Cosmetics And Haircare | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Household | Cleaning Products And Consumables | 0 | 0% | 105 | — | 0 | 105 | 110 | 105 | CA, GB, IE, MX, US | No |
| Food | Groceries | 0 | 0% | 500 | — | 0 | 500 | 512 | 500 | CA, GB, IE, MX, US | No |
| Food | Beverages | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
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
| Stores And Chains | 83 | 108 | 8 |
| Barbers And Salons | 36 | 37 | 8 |

