# Catalog coverage

Written by `tools/catalog-coverage.mjs` from the catalogs themselves; don't edit by hand. The hierarchy is
`src/engine/content/catalogtaxonomy.ts`. The target for a brand category is at least
50 real brands with at least 100 distinct real products each where the brand makes that many,
5,000 a category, a floor and not a ceiling (the owner, 2026-10-03, restated 2026-10-05). Brands, products, variants and
offers are counted apart: a product sold by several sellers is one product with several offers,
and a shoe in ten sizes one product with ten variants. A category none of whose catalogs records a
brand counts its products as unbranded, which never counts toward the target. Owned items are
counted in each save; the functional table names the record a purchase makes and the steps it can take.

## Brand categories

| Department | Category | Brands | Of 50 | Products | Per brand (least / median / most) | Brands at 100 | Variants | Offers | Unbranded | Markets | Met |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Apparel | Everyday Clothing | 120 | 100% | 1339 | 1 / 2 / 114 | 1 | 33283 | 1489 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Designer Fashion | 7 | 14% | 13 | 1 / 2 / 3 | 0 | 60 | 13 | 0 | GB, IE, MX, US | No |
| Apparel | Formalwear | 75 | 100% | 302 | 1 / 2 / 34 | 0 | 5328 | 328 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Outerwear | 65 | 100% | 279 | 1 / 2 / 18 | 0 | 4566 | 326 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Activewear | 49 | 98% | 279 | 1 / 3 / 51 | 0 | 10379 | 337 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Underwear | 37 | 74% | 158 | 1 / 4 / 12 | 0 | 3396 | 203 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Bras And Lingerie | 29 | 58% | 84 | 1 / 3 / 7 | 0 | 2490 | 118 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Shapewear And Slips | 19 | 38% | 130 | 1 / 7 / 13 | 0 | 1597 | 167 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Socks And Hosiery | 45 | 90% | 214 | 1 / 3 / 12 | 0 | 1397 | 239 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Thermals And Base Layers | 18 | 36% | 163 | 1 / 12 / 17 | 0 | 2652 | 182 | 0 | CA, GB, MX, US | No |
| Apparel | Sleepwear | 49 | 98% | 205 | 1 / 2 / 13 | 0 | 4503 | 234 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Swimwear | 52 | 100% | 497 | 1 / 12 / 13 | 0 | 5746 | 756 | 0 | CA, GB, IE, MX, US | No |
| Apparel | Cultural Clothing | 61 | 100% | 559 | 1 / 12 / 15 | 0 | 4099 | 753 | 0 | CA, GB, IE, MX, US | No |
| Footwear | Sneakers | 26 | 52% | 91 | 1 / 2 / 30 | 0 | 1948 | 142 | 0 | CA, GB, IE, MX, US | No |
| Footwear | Dress Shoes | 20 | 40% | 37 | 1 / 1 / 5 | 0 | 941 | 60 | 0 | CA, GB, IE, MX, US | No |
| Footwear | Boots | 27 | 54% | 77 | 1 / 2 / 12 | 0 | 1119 | 116 | 0 | CA, GB, IE, MX, US | No |
| Footwear | Sandals And Slides | 12 | 24% | 25 | 1 / 2 / 4 | 0 | 640 | 30 | 0 | CA, IE, MX, US | No |
| Footwear | Other Footwear | 20 | 40% | 50 | 1 / 2 / 6 | 0 | 1935 | 85 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Bags | 50 | 100% | 249 | 1 / 2 / 12 | 0 | 728 | 352 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Hats, Scarves, Belts And Small Accessories | 54 | 100% | 329 | 1 / 3 / 17 | 0 | 1776 | 384 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Watches | 52 | 100% | 362 | 1 / 8 / 12 | 0 | 563 | 479 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Jewelry | 52 | 100% | 285 | 1 / 2 / 15 | 0 | 543 | 387 | 0 | CA, GB, IE, MX, US | No |
| Accessories | Luggage | 55 | 100% | 1906 | 1 / 26 / 100 | 2 | 6580 | 3567 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Phones | 27 | 54% | 159 | 1 / 5 / 17 | 0 | 357 | 489 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Computers | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Electronics | Tablets And E-Readers | 0 | 0% | 2 | — | 0 | 2 | 5 | 2 | CA, GB, IE, MX, US | No |
| Electronics | Televisions | 50 | 100% | 1294 | 2 / 8 / 310 | 4 | 1300 | 2069 | 0 | CA, GB, IE, MX, US | No |
| Electronics | Audio Equipment | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Electronics | Game Consoles | 3 | 6% | 6 | 1 / 2 / 3 | 0 | 6 | 36 | 0 | CA, GB, IE, MX, US | Narrow market: three makers sell home consoles: Sony, Microsoft and Nintendo |
| Electronics | Video Games And Gaming Accessories | 1 | 2% | 2 | 2 / 2 / 2 | 0 | 2 | 6 | 0 | CA, GB, IE, MX, US | No |
| Home | Furniture | 1 | 2% | 90 | 90 / 90 / 90 | 0 | 90 | 163 | 0 | CA, GB, IE, MX, US | No |
| Home | Mattresses And Beds | 1 | 2% | 29 | 29 / 29 / 29 | 0 | 54 | 69 | 0 | CA, GB, IE, MX, US | No |
| Home | Bedding And Towels | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Home | Major Appliances | 56 | 100% | 2123 | 1 / 19 / 232 | 5 | 2188 | 3010 | 0 | CA, GB, IE, MX, US | No |
| Home | Small Kitchen Appliances | 0 | 0% | 10 | — | 0 | 10 | 10 | 10 | CA, GB, IE, MX, US | No |
| Home | Cookware And Kitchenware | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Home | Lighting | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Home | Household Equipment | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Home | Safes And Home Security | 0 | 0% | 13 | — | 0 | 13 | 14 | 13 | CA, GB, IE, MX, US | No |
| Personal Care | Toiletries | 44 | 88% | 105 | 1 / 1 / 14 | 0 | 105 | 106 | 1 | CA, GB, IE, MX, US | No |
| Personal Care | Haircare | 16 | 32% | 32 | 1 / 2 / 6 | 0 | 32 | 32 | 0 | CA, GB, IE, MX, US | No |
| Personal Care | Shaving And Grooming | 12 | 24% | 28 | 1 / 1 / 10 | 0 | 28 | 28 | 0 | CA, GB, IE, MX, US | No |
| Personal Care | Cosmetics And Skincare | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Household | Laundry And Cleaning Products | 56 | 100% | 189 | 1 / 2 / 13 | 0 | 189 | 202 | 0 | CA, GB, IE, MX, US | No |
| Household | Household Paper And Consumables | 38 | 76% | 117 | 1 / 2 / 15 | 0 | 117 | 127 | 3 | CA, GB, IE, MX, US | No |
| Food | Groceries | 112 | 100% | 514 | 1 / 1 / 59 | 0 | 514 | 534 | 123 | CA, GB, IE, MX, US | No |
| Food | Beverages | 144 | 100% | 210 | 1 / 1 / 8 | 0 | 210 | 214 | 1 | CA, GB, IE, MX, US | No |
| Vehicles | Cars, Pickups And Vans | 16 | 32% | 37 | 1 / 1 / 7 | 0 | 37 | 53 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Motorcycles And Scooters | 9 | 18% | 25 | 1 / 2 / 10 | 0 | 25 | 36 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Bicycles And E-Bikes | 5 | 10% | 13 | 1 / 2 / 5 | 0 | 13 | 15 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | ATVs | 4 | 8% | 7 | 1 / 2 / 3 | 0 | 7 | 11 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Motorhomes And Campervans | 10 | 20% | 19 | 1 / 2 / 4 | 0 | 19 | 21 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Boats | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | Narrow market: recreational boat makers number in the dozens, few publishing prices |
| Vehicles | Light Aircraft | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | Narrow market: a handful of makers build new light aircraft for private owners |
| Vehicles | Factory Options | 16 | 32% | 643 | 5 / 34 / 136 | 1 | 643 | 643 | 0 | CA, GB, IE, MX, US | No |
| Vehicles | Tires | 0 | 0% | 1 | — | 0 | 1 | 8 | 1 | CA, GB, IE, MX, US | No |
| Vehicles | Wheels | 0 | 0% | 1 | — | 0 | 1 | 2 | 1 | GB, US | No |
| Vehicles | Aftermarket Parts | 0 | 0% | 4 | — | 0 | 4 | 5 | 4 | GB, US | No |
| Vehicles | Car Audio | 0 | 0% | 6 | — | 0 | 6 | 6 | 6 | GB, IE, US | No |
| Vehicles | Upholstery Materials | 0 | 0% | 8 | — | 0 | 8 | 8 | 8 | US | No |
| Vehicles | Vehicle Accessories | 0 | 0% | 7 | — | 0 | 7 | 11 | 7 | CA, GB, IE, US | No |
| Building And Garden | Building Materials | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Building And Garden | Fixtures | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Building And Garden | Finishes | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Building And Garden | Garden Equipment | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Sport | Sports Equipment | 0 | 0% | 0 | — | 0 | 0 | 0 | 0 | — | No catalog yet |
| Pets | Pet Food | 51 | 100% | 103 | 1 / 1 / 11 | 0 | 103 | 106 | 0 | CA, GB, IE, MX, US | No |
| Pets | Pet Supplies | 0 | 0% | 11 | — | 0 | 11 | 12 | 11 | CA, GB, IE, MX, US | No |

0 of 68 brand and narrow categories meet the target.

## Functional coverage

What buying one makes, the steps its life can take by the command or scheduled kind that takes each, the
steps that fit it and aren't built, and what else is short. A step's kind is checked against the engine and the screens each time this report is written or checked.

| Category | Owned As | Steps Built | Steps Missing | Gaps |
|---|---|---|---|---|
| Everyday Clothing | a garment | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), alteration (`clothes.alter`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Designer Fashion | a garment | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), alteration (`clothes.alter`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | A designer house is one on the Paris, Milan, London or New York ready-to-wear calendar, SLATE's reading of those calendars (`DESIGNER_HOUSES`); their resale against the price new is unpublished, so a piece sells on as any garment does. |
| Formalwear | a garment | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), alteration (`clothes.alter`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Outerwear | a garment | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), alteration (`clothes.alter`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Activewear | a garment | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), alteration (`clothes.alter`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Underwear | a garment | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), alteration (`clothes.alter`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Bras And Lingerie | a garment | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), alteration (`clothes.alter`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Shapewear And Slips | a garment | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), alteration (`clothes.alter`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Socks And Hosiery | a garment | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), alteration (`clothes.alter`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Thermals And Base Layers | a garment | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), alteration (`clothes.alter`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Sleepwear | a garment | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), alteration (`clothes.alter`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Swimwear | a garment | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), alteration (`clothes.alter`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Cultural Clothing | a garment | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), alteration (`clothes.alter`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Sneakers | a pair of shoes | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | The Air Jordans add GOAT's new and used asks in America (`sneakers.buy`, `sneakers.sell`); a sole worn through isn't kept. |
| Dress Shoes | a pair of shoes | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Boots | a pair of shoes | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Sandals And Slides | a pair of shoes | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Other Footwear | a pair of shoes | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Bags | a bag, worn as an accessory | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Hats, Scarves, Belts And Small Accessories | an accessory | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | — |
| Watches | a watch, worn | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`items.move`), use (`clothes.dress`), cleaning (`life.look_after`), maintenance (`watch.service`), repair (`watch.battery`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | recycling, disposal | — |
| Jewelry | a piece, worn | purchase (`clothes.buy`), delivery (`items.order_arrives`), collection (`clothes.collect_order`), carrying (`items.put_away`), storage (`valuables.lock_up`), use (`clothes.dress`), cleaning (`life.look_after`), alteration (`jewelry.engrave`), return (`clothes.return`), resale (`clothes.sell`), gifting (`items.give`), packing (`luggage.pack`) | repair, recycling, disposal | Pawned as well as sold (`pawn.pledge`); commissioned from a named jeweler (`jewelry.commission`). |
| Luggage | a bag that holds its liters | purchase (`luggage.buy`), delivery (`items.order_arrives`), storage (`items.move`), use (`luggage.take`), gifting (`items.give`), packing (`luggage.pack`) | return, resale, repair, disposal | A bag lost by the airline isn't kept. |
| Phones | a device on a line | purchase (`phone.buy`), activation (`phone.activate`), use (`phone.activate`), maintenance (`phone.battery`), repair (`phone.claim`), gifting (`items.give`) | return, resale, recycling | Traded in only against a new phone; most makers sell through carriers, which the maker's-own-store rule leaves out. |
| Computers | — | — | — | Nothing a computer does was built, so none is sold. |
| Tablets And E-Readers | an e-reader, read on | purchase (`reading.buy`), use (`life.look_after`) | return, resale, repair | E-readers only, unbranded in the catalog; no tablet. |
| Televisions | the home's TV | purchase (`tv.buy`), use (`tv.watch`) | delivery, installation, repair, resale, disposal | — |
| Audio Equipment | — | — | — | Headphones and speakers aren't sold. |
| Game Consoles | a console | purchase (`home.console`), use (`life.look_after`) | resale, repair | — |
| Video Games And Gaming Accessories | a game | purchase (`home.buy_game`), use (`life.look_after`) | resale | Nintendo's own games only: Sony's and Microsoft's stores weren't read, and no accessory is sold. |
| Furniture | a piece that stands in a room | purchase (`home.buy_piece`), assembly (`items.assemble`), storage (`items.move`), use (`social.host`), resale (`home.sell_back`), disposal (`items.discard`) | cleaning, repair | IKEA alone. |
| Mattresses And Beds | a bed or mattress | purchase (`home.buy_piece`), use (`life.sleep`), maintenance (`home.replace_mattress`), disposal (`items.discard`) | cleaning, resale | IKEA alone. |
| Bedding And Towels | — | — | — | Towels are given at the start and can't be bought; bedding isn't kept. |
| Major Appliances | a machine fitted at home | purchase (`home.fit`), installation (`home.fit`), use (`life.look_after`), repair (`home.repair_machine`) | resale, disposal | Washers, dryers and dishwashers by make and model; a fridge or cooker is the home's own. |
| Small Kitchen Appliances | kitchen gear | purchase (`food.buy_gear`), use (`food.cook`) | return, repair, disposal | A blender and a slow cooker in each market, their brand kept in the name only. |
| Cookware And Kitchenware | — | — | — | A kitchen's pans and knives aren't kept. |
| Lighting | — | — | — | Lighting is inside the electricity bill, with no fixture sold. |
| Household Equipment | — | — | — | Vacuums, irons, fans and heaters aren't sold. |
| Safes And Home Security | a safe, or the home's alarm | purchase (`valuables.buy_safe`), installation (`home.alarm`), storage (`valuables.lock_up`), use (`valuables.take_out`) | resale | Safes and an alarm kit, their brands in their names only; window locks and light timers by `home.security`. |
| Toiletries | a bottle or pack used up | purchase (`hygiene.buy`), delivery (`items.order_arrives`), carrying (`items.put_away`), storage (`items.move`), consumption (`life.look_after`) | — | — |
| Haircare | a bottle used up | purchase (`hygiene.buy`), delivery (`items.order_arrives`), carrying (`items.put_away`), storage (`items.move`), consumption (`life.look_after`) | — | Shampoo and conditioner; no styling product. |
| Shaving And Grooming | razors and cream used up | purchase (`hygiene.buy`), delivery (`items.order_arrives`), carrying (`items.put_away`), storage (`items.move`), consumption (`hygiene.shave_every`) | — | — |
| Cosmetics And Skincare | — | — | — | Makeup and skincare weren't read at any chain. |
| Laundry And Cleaning Products | a supply used up | purchase (`hygiene.buy`), delivery (`items.order_arrives`), carrying (`items.put_away`), storage (`items.move`), consumption (`life.look_after`) | — | — |
| Household Paper And Consumables | a supply | purchase (`hygiene.buy`), carrying (`items.put_away`), storage (`items.move`) | consumption | Paper towels, sponges and bin bags are bought and kept, never used up: how fast they go isn't published; toilet paper is used up. |
| Groceries | food in the kitchen | purchase (`food.buy_groceries`), delivery (`items.order_arrives`), carrying (`items.put_away`), storage (`items.move`), use (`food.eat_ready`), consumption (`food.cook`) | — | — |
| Beverages | drink in the kitchen | purchase (`food.buy_groceries`), delivery (`items.order_arrives`), carrying (`items.put_away`), storage (`items.move`), consumption (`food.drink_home`) | — | — |
| Cars, Pickups And Vans | a vehicle | purchase (`vehicle.buy`), delivery (`vehicle.buy`), storage (`vehicle.keep_in`), use (`errand.go`), consumption (`vehicle.refuel`), maintenance (`vehicle.service`), repair (`vehicle.repair`), resale (`vehicle.sell`) | cleaning | — |
| Motorcycles And Scooters | a vehicle | purchase (`vehicle.buy`), delivery (`vehicle.buy`), storage (`vehicle.keep_in`), use (`errand.go`), consumption (`vehicle.refuel`), maintenance (`vehicle.service`), repair (`vehicle.repair`), resale (`vehicle.sell`) | cleaning | — |
| Bicycles And E-Bikes | a vehicle ridden for its own sake | purchase (`vehicle.buy`), use (`life.look_after`), resale (`vehicle.sell`) | maintenance, repair | — |
| ATVs | a vehicle ridden for its own sake | purchase (`vehicle.buy`), use (`life.look_after`), resale (`vehicle.sell`) | maintenance, repair | — |
| Motorhomes And Campervans | a vehicle | purchase (`vehicle.buy`), delivery (`vehicle.buy`), storage (`vehicle.keep_in`), use (`errand.go`), consumption (`vehicle.refuel`), maintenance (`vehicle.service`), repair (`vehicle.repair`), resale (`vehicle.sell`) | cleaning | — |
| Boats | a boat | purchase (`boat.buy`), resale (`boat.sell`) | — | — |
| Light Aircraft | an aircraft | purchase (`aircraft.buy`), resale (`aircraft.sell`) | — | — |
| Factory Options | kept with the car | purchase (`vehicle.buy`) | — | — |
| Tires | a set on the car | purchase (`vehicle.replace_tires`), installation (`vehicle.replace_tires`), use (`errand.go`) | — | A set at each market's named retailer, unbranded; winter tires by `vehicle.winter_tires`. |
| Wheels | fitted to the car | purchase (`vehicle.modify`), installation (`vehicle.modify`) | — | One set of alloys in Britain and America, unbranded. |
| Aftermarket Parts | fitted to the car | purchase (`vehicle.modify`), installation (`vehicle.modify`) | — | A body kit, LED bulbs, an exhaust and lowering springs, unbranded, in Britain and America. |
| Car Audio | fitted to the car | purchase (`vehicle.audio`), installation (`vehicle.audio`) | — | One head unit, speakers and an amplifier a market, their brands in their names only. |
| Upholstery Materials | the car's interior | purchase (`vehicle.interior`), installation (`vehicle.interior_fit`) | — | Seven materials from named suppliers, sold by the yard or foot. |
| Vehicle Accessories | a rack or box on the car | purchase (`vehicle.roof_box`), installation (`vehicle.roof_box_fit`), storage (`items.move`) | — | — |
| Building Materials | — | — | — | A build and a project are priced whole, not by material. |
| Fixtures | — | — | — | Taps, sinks, toilets and showers aren't sold apart from a project. |
| Finishes | — | — | — | Paint, flooring and tiles aren't sold apart from a project. |
| Garden Equipment | — | — | — | A raised bed and a greenhouse are built at the cost guides' prices, unbranded (`garden.plant`); a mower or a tool isn't sold. |
| Sports Equipment | — | — | — | Balls, rackets and weights aren't sold. |
| Pet Food | a bag fed from | purchase (`pets.buy`), delivery (`items.order_arrives`), consumption (`pets.feed`) | — | — |
| Pet Supplies | litter used up | purchase (`pets.buy`), delivery (`items.order_arrives`) | — | Litter alone, unbranded; no carrier, bed or lead. |

## Service directories

Counted by their own structure: providers, branches or listings, and the towns they cover.

| Category | Providers | Branches Or Listings | Towns |
|---|---|---|---|
| Hotels | 23 | 28 | 8 |
| Restaurants | 105 | 107 | 8 |
| Clubs And Lessons | 68 | 70 | 8 |
| Gyms And Studios | 30 | 32 | 8 |
| Clinics, Dentists And Opticians | 35 | 35 | 8 |
| Vets | 8 | 8 | 8 |
| Stores And Chains | 417 | 126 | 8 |
| Barbers And Salons | 36 | 37 | 8 |
| Tailors | 11 | 11 | 6 |
| Car Dealers | 29 | 29 | 7 |
| Car Repair Shops | 27 | 28 | 8 |
| Fuel Stations And Chargers | 35 | 63 | 8 |
| Parking Garages | 7 | 9 | 6 |
| Breakdown Cover | 7 | 14 | — |

