/**
 * SLATE — the larder: the things a recipe actually needs.
 *
 * The grocery aisles had the branded shop in them — Barilla, Mutti, Kerrygold,
 * Poilâne — and none of the things you cook them with. No onion, no garlic, no
 * lemon, no stock, no cream, no tin of chickpeas. So every recipe in the game
 * was uncookable, and this is the half of the shop that fixes it.
 *
 * Produce is named the way a greengrocer names it, by variety or by the grower
 * whose name is on the box, which is how the catalog already carries Honeycrisp
 * apples and Maris Pipers. Everything else is a real brand. Prices, shelf lives
 * and nourishment are SLATE's own calibration.
 */

import { REFERENCE_VERSION } from './reference';
import type { RealGood } from './goods';

const REAL = {
  source: 'calibrated_estimate', confidence: 'high', version: REFERENCE_VERSION,
  note: 'A real product or a real variety. Price, shelf life and nourishment are SLATE’s own calibration.',
} as const;

const ALL_YEAR = ['Spring', 'Summer', 'Autumn', 'Winter'];

const gr = (
  id: string, name: string, brand: string, sub: string,
  price: number, shelf: number, unit: string, nourishment: number, quality = 60,
  extra: readonly string[] = [],
): RealGood => ({
  id, name, type: 'product', category: 'groceries', subcategory: sub, basePrice: price, brand,
  tags: ['grocery', sub, ...extra], quality, depreciation: 0, shelfLifeDays: shelf, unit, nourishment,
  seasons: ALL_YEAR, audience: 'unisex', ...REAL,
});

export const REAL_LARDER: readonly RealGood[] = [
  // --- The greengrocer: the things every recipe starts with ----------------
  gr('g_onions_brown', 'Brown Onions', 'Produce Aisle', 'produce', 2_49, 30, 'Net', 6, 58),
  gr('g_onions_red', 'Red Onions', 'Produce Aisle', 'produce', 2_79, 30, 'Net', 6, 58),
  gr('g_onions_vidalia', 'Vidalia Sweet Onions', 'Vidalia Onion Committee', 'produce', 4_49, 21, 'Bag', 6, 70),
  gr('g_shallots', 'Banana Shallots', 'Produce Aisle', 'produce', 3_29, 21, 'Pack', 5, 64),
  gr('g_spring_onions', 'Spring Onions', 'Produce Aisle', 'produce', 1_49, 7, 'Bunch', 3, 58),
  gr('g_garlic', 'Garlic Bulbs', 'Produce Aisle', 'produce', 1_99, 45, 'Three Pack', 2, 58),
  gr('g_garlic_solent', 'Solent Wight Garlic', 'The Garlic Farm', 'produce', 4_49, 60, 'Bulb', 2, 76),
  gr('g_ginger', 'Root Ginger', 'Produce Aisle', 'produce', 2_29, 21, 'Piece', 2, 60),
  gr('g_chillies', 'Red Chillies', 'Produce Aisle', 'produce', 1_99, 12, 'Pack', 2, 58),
  gr('g_lemons', 'Unwaxed Lemons', 'Produce Aisle', 'produce', 2_99, 18, 'Five Pack', 4, 60),
  gr('g_lemons_amalfi', 'Amalfi Lemons', 'Costa D’Amalfi', 'produce', 6_49, 14, 'Three Pack', 4, 82),
  gr('g_limes', 'Limes', 'Produce Aisle', 'produce', 2_49, 18, 'Five Pack', 3, 60),
  gr('g_carrots', 'Carrots', 'Produce Aisle', 'produce', 1_79, 21, 'Bag', 8, 58),
  gr('g_carrots_chantenay', 'Chantenay Carrots', 'Produce Aisle', 'produce', 2_79, 14, 'Bag', 8, 68),
  gr('g_celery', 'Celery', 'Produce Aisle', 'produce', 1_99, 14, 'Head', 4, 58),
  gr('g_leeks', 'Leeks', 'Produce Aisle', 'produce', 2_29, 14, 'Pack', 6, 60),
  gr('g_mushrooms_chestnut', 'Chestnut Mushrooms', 'Produce Aisle', 'produce', 2_49, 8, 'Punnet', 6, 62),
  gr('g_mushrooms_portobello', 'Portobello Mushrooms', 'Produce Aisle', 'produce', 3_29, 8, 'Pack', 7, 66),
  gr('g_tomatoes_vine', 'Vine Tomatoes', 'Produce Aisle', 'produce', 3_49, 9, 'Punnet', 8, 66),
  gr('g_tomatoes_cherry', 'Cherry Tomatoes', 'Produce Aisle', 'produce', 3_29, 9, 'Punnet', 7, 68),
  gr('g_peppers', 'Bell Peppers', 'Produce Aisle', 'produce', 3_49, 12, 'Three Pack', 7, 62),
  gr('g_courgettes', 'Courgettes', 'Produce Aisle', 'produce', 2_29, 10, 'Pack', 6, 60),
  gr('g_aubergine', 'Aubergine', 'Produce Aisle', 'produce', 1_99, 10, 'Each', 6, 60),
  gr('g_broccoli', 'Tenderstem Broccoli', 'Tenderstem', 'produce', 3_49, 8, 'Pack', 9, 70),
  gr('g_green_beans', 'Fine Green Beans', 'Produce Aisle', 'produce', 2_99, 8, 'Pack', 8, 64),
  gr('g_cavolo_nero', 'Cavolo Nero', 'Produce Aisle', 'produce', 2_79, 7, 'Bag', 9, 68),
  gr('g_cucumber', 'Cucumber', 'Produce Aisle', 'produce', 1_29, 9, 'Each', 4, 56),
  gr('g_lettuce_gem', 'Little Gem Lettuce', 'Produce Aisle', 'produce', 2_29, 8, 'Two Pack', 4, 60),
  gr('g_rocket', 'Wild Rocket', 'Produce Aisle', 'produce', 2_49, 6, 'Bag', 5, 64),
  gr('g_parsley', 'Flat Leaf Parsley', 'Produce Aisle', 'produce', 1_49, 8, 'Bunch', 2, 62),
  gr('g_basil', 'Fresh Basil', 'Produce Aisle', 'produce', 1_79, 7, 'Pot', 2, 64),
  gr('g_coriander', 'Fresh Coriander', 'Produce Aisle', 'produce', 1_49, 7, 'Bunch', 2, 62),
  gr('g_thyme', 'Fresh Thyme', 'Produce Aisle', 'produce', 1_79, 12, 'Pack', 1, 62),
  gr('g_rosemary', 'Fresh Rosemary', 'Produce Aisle', 'produce', 1_79, 14, 'Pack', 1, 62),
  gr('g_mint', 'Fresh Mint', 'Produce Aisle', 'produce', 1_49, 8, 'Bunch', 1, 62),
  gr('g_sweet_potato', 'Sweet Potatoes', 'Produce Aisle', 'produce', 2_99, 21, 'Bag', 14, 64),
  gr('g_butternut', 'Butternut Squash', 'Produce Aisle', 'produce', 2_49, 21, 'Each', 10, 62),
  // --- The chill cabinet ----------------------------------------------------
  gr('g_double_cream', 'Double Cream', 'Rodda’s', 'dairy', 2_99, 12, 'Pot', 9, 72),
  gr('g_creme_fraiche', 'Crème Fraîche', 'Isigny Sainte-Mère', 'dairy', 3_49, 18, 'Pot', 8, 76),
  gr('g_soured_cream', 'Soured Cream', 'Daisy', 'dairy', 2_79, 18, 'Pot', 7, 66),
  gr('g_mozzarella', 'Mozzarella Di Bufala', 'Mandara', 'dairy', 4_99, 10, 'Ball', 10, 80),
  gr('g_burrata', 'Burrata', 'Puglissima', 'dairy', 6_49, 6, 'Ball', 11, 84),
  gr('g_pecorino', 'Pecorino Romano', 'Fulvi', 'dairy', 9_99, 90, 'Wedge', 11, 84),
  gr('g_gruyere', 'Gruyère AOP', 'Emmi', 'dairy', 11_49, 60, 'Wedge', 11, 84),
  gr('g_feta', 'Feta PDO', 'Dodoni', 'dairy', 4_49, 30, 'Block', 9, 76),
  gr('g_halloumi', 'Halloumi', 'Cypressa', 'dairy', 4_29, 45, 'Block', 10, 72),
  gr('g_ricotta', 'Ricotta', 'Galbani', 'dairy', 3_49, 12, 'Tub', 8, 70),
  gr('g_mascarpone', 'Mascarpone', 'Galbani', 'dairy', 3_99, 14, 'Tub', 9, 72),
  gr('g_butter_unsalted', 'Unsalted Butter', 'Kerrygold', 'dairy', 4_49, 45, 'Block', 6, 76),
  // --- The butcher and the fishmonger --------------------------------------
  gr('g_chicken_thighs', 'Free Range Chicken Thighs', 'Bell & Evans', 'protein', 8_99, 4, 'Pack', 34, 72),
  gr('g_whole_chicken', 'Free Range Whole Chicken', 'Bell & Evans', 'protein', 14_99, 5, 'Bird', 60, 76),
  gr('g_beef_mince', 'Grass Fed Beef Mince', 'Creekstone Farms', 'protein', 9_49, 3, 'Pack', 34, 74, ['beef']),
  gr('g_pork_belly', 'Pork Belly', 'Duroc', 'protein', 11_49, 4, 'Piece', 38, 74, ['pork']),
  gr('g_lamb_shoulder', 'Lamb Shoulder', 'Donald Russell', 'protein', 22_99, 5, 'Joint', 52, 80),
  gr('g_sausages', 'Cumberland Sausages', 'Debbie & Andrew’s', 'protein', 5_49, 6, 'Pack', 26, 68, ['pork']),
  gr('g_prawns', 'Raw King Prawns', 'Fish Counter', 'protein', 12_99, 3, 'Pack', 22, 76),
  gr('g_cod', 'Cod Fillet', 'Fish Counter', 'protein', 13_49, 3, 'Fillet', 26, 78),
  gr('g_sea_bass', 'Sea Bass Fillet', 'Fish Counter', 'protein', 14_99, 3, 'Fillet', 24, 80),
  gr('g_mussels', 'Rope Grown Mussels', 'Fish Counter', 'protein', 6_99, 2, 'Bag', 18, 74),
  gr('g_anchovies', 'Anchovy Fillets In Olive Oil', 'Ortiz', 'pantry', 6_99, 540, 'Jar', 4, 82),
  gr('g_chorizo', 'Cooking Chorizo', 'Brindisa', 'protein', 6_49, 30, 'Pack', 24, 78, ['pork']),
  gr('g_pancetta', 'Pancetta', 'Levoni', 'protein', 5_99, 21, 'Pack', 22, 78, ['pork']),
  // --- The tins, the jars and the dry goods --------------------------------
  gr('g_chopped_tomatoes', 'Chopped Tomatoes', 'Mutti', 'pantry', 1_99, 720, 'Tin', 7, 76),
  gr('g_tomato_puree', 'Tomato Purée', 'Mutti', 'pantry', 2_29, 540, 'Tube', 3, 76),
  gr('g_chickpeas', 'Chickpeas', 'Bold Bean Co', 'pantry', 3_49, 720, 'Jar', 18, 78),
  gr('g_cannellini', 'Cannellini Beans', 'Bold Bean Co', 'pantry', 3_49, 720, 'Jar', 18, 78),
  gr('g_black_beans', 'Black Beans', 'Goya', 'pantry', 1_79, 720, 'Tin', 17, 66),
  gr('g_lentils', 'Puy Lentils', 'Sabarot', 'pantry', 4_49, 540, 'Pack', 20, 76),
  gr('g_coconut_milk', 'Coconut Milk', 'Chaokoh', 'pantry', 2_49, 720, 'Tin', 12, 70),
  gr('g_stock_chicken', 'Chicken Stock', 'Kallo', 'pantry', 2_99, 360, 'Pack', 3, 66),
  gr('g_stock_veg', 'Vegetable Stock', 'Marigold', 'pantry', 4_49, 360, 'Tub', 3, 72),
  gr('g_stock_beef', 'Beef Stock', 'Knorr', 'pantry', 2_79, 360, 'Pack', 3, 64, ['beef']),
  gr('g_capers', 'Capers In Brine', 'Belazu', 'pantry', 3_99, 720, 'Jar', 2, 78),
  gr('g_olives', 'Nocellara Olives', 'Belazu', 'pantry', 4_49, 180, 'Tub', 6, 80),
  gr('g_sun_dried_tomatoes', 'Sun Dried Tomatoes', 'Belazu', 'pantry', 4_99, 360, 'Jar', 6, 78),
  gr('g_curry_paste', 'Thai Green Curry Paste', 'Mae Ploy', 'pantry', 3_49, 540, 'Tub', 3, 74),
  gr('g_miso', 'White Miso Paste', 'Hikari', 'pantry', 5_49, 360, 'Tub', 4, 78),
  gr('g_gochujang', 'Gochujang', 'Chung Jung One', 'pantry', 4_99, 540, 'Tub', 4, 76),
  gr('g_harissa', 'Rose Harissa', 'Belazu', 'pantry', 4_49, 360, 'Jar', 3, 80),
  gr('g_noodles_udon', 'Udon Noodles', 'Shirakiku', 'pantry', 3_49, 270, 'Pack', 24, 68),
  gr('g_noodles_egg', 'Egg Noodles', 'Blue Dragon', 'pantry', 2_49, 360, 'Pack', 22, 64),
  gr('g_tortillas', 'Corn Tortillas', 'La Tortilla Factory', 'bakery', 3_49, 21, 'Pack', 18, 68),
  gr('g_couscous', 'Couscous', 'Ferrero Sicilia', 'pantry', 2_99, 360, 'Pack', 20, 68),
  gr('g_quinoa', 'Quinoa', 'Bob’s Red Mill', 'pantry', 5_49, 540, 'Pack', 20, 74),
  gr('g_polenta', 'Polenta', 'Molino Sobrino', 'pantry', 3_99, 540, 'Pack', 19, 72),
  gr('g_flour_plain', 'Plain Flour', 'Doves Farm', 'pantry', 2_29, 360, 'Bag', 16, 70),
  gr('g_flour_00', 'Tipo 00 Flour', 'Caputo', 'pantry', 3_49, 360, 'Bag', 16, 80),
  gr('g_sugar_caster', 'Golden Caster Sugar', 'Billington’s', 'pantry', 2_79, 720, 'Bag', 12, 70),
  gr('g_sugar_brown', 'Light Brown Sugar', 'Billington’s', 'pantry', 2_99, 720, 'Bag', 12, 70),
  gr('g_honey', 'Manuka Honey', 'Comvita', 'pantry', 24_99, 720, 'Jar', 8, 84),
  gr('g_honey_acacia', 'Acacia Honey', 'Rowse', 'pantry', 5_49, 720, 'Jar', 8, 70),
  gr('g_vinegar_balsamic', 'Balsamic Vinegar Of Modena', 'Giusti', 'pantry', 9_99, 900, 'Bottle', 2, 84),
  gr('g_vinegar_red_wine', 'Red Wine Vinegar', 'Forum', 'pantry', 6_49, 900, 'Bottle', 2, 78),
  gr('g_vinegar_rice', 'Rice Vinegar', 'Mizkan', 'pantry', 3_29, 720, 'Bottle', 2, 70),
  gr('g_sesame_oil', 'Toasted Sesame Oil', 'Kadoya', 'pantry', 4_99, 540, 'Bottle', 3, 76),
  gr('g_paprika', 'Smoked Paprika', 'La Chinata', 'pantry', 4_29, 720, 'Tin', 1, 80),
  gr('g_cumin', 'Ground Cumin', 'Bart', 'pantry', 3_29, 720, 'Jar', 1, 70),
  gr('g_chilli_flakes', 'Chilli Flakes', 'Bart', 'pantry', 3_29, 720, 'Jar', 1, 70),
  gr('g_cinnamon', 'Ground Cinnamon', 'Bart', 'pantry', 3_49, 720, 'Jar', 1, 70),
  gr('g_bay', 'Bay Leaves', 'Bart', 'pantry', 2_99, 720, 'Jar', 1, 70),
  gr('g_oregano', 'Dried Oregano', 'Bart', 'pantry', 2_99, 720, 'Jar', 1, 70),
  gr('g_vanilla', 'Vanilla Extract', 'Nielsen-Massey', 'pantry', 9_99, 900, 'Bottle', 1, 84),
  gr('g_baking_powder', 'Baking Powder', 'Dr. Oetker', 'pantry', 1_99, 540, 'Tub', 1, 66),
  gr('g_yeast', 'Fast Action Yeast', 'Allinson’s', 'pantry', 2_49, 360, 'Pack', 2, 68),
  gr('g_breadcrumbs', 'Panko Breadcrumbs', 'Kikkoman', 'pantry', 3_29, 270, 'Pack', 12, 72),
  gr('g_frozen_peas', 'Petits Pois', 'Birds Eye', 'frozen', 2_79, 300, 'Bag', 10, 66),
  gr('g_frozen_sweetcorn', 'Sweetcorn', 'Birds Eye', 'frozen', 2_49, 300, 'Bag', 12, 64),
  gr('g_frozen_spinach', 'Frozen Spinach', 'Birds Eye', 'frozen', 2_29, 300, 'Bag', 9, 64),
  gr('g_frozen_berries', 'Frozen Mixed Berries', 'Waitrose Frozen', 'frozen', 4_49, 300, 'Bag', 10, 70),
  gr('g_puff_pastry', 'All Butter Puff Pastry', 'Jus-Rol', 'frozen', 3_49, 120, 'Block', 16, 70),
];
