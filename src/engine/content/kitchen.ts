/**
 * SLATE — the kitchen: what a recipe needs and what you own to cook it with.
 *
 * Two things were missing before this. Every recipe in the game named
 * ingredients no shop sold any more, so nothing could actually be cooked; and
 * nothing a recipe needed to be cooked *with* was modeled at all, so a
 * Vitamix did exactly what a wooden spoon did, which was nothing.
 *
 * So a recipe now names its equipment, a home comes with the kitchen a home
 * comes with, and anything beyond that is a thing you went out and bought.
 * The better machine is faster and turns out a better plate, which is the
 * whole reason to own one.
 *
 * Every ingredient here is a product a real shop in the game actually sells,
 * and the gate's kitchen checker fails the build if that stops being true.
 */

import type { Recipe } from './catalog';
import { REFERENCE_VERSION } from './reference';

const SIM = {
  source: 'simulated', confidence: 'high', version: REFERENCE_VERSION,
  note: 'A real dish cooked from real products. Times, difficulty and nourishment are SLATE’s own calibration.',
} as const;

/** The kinds of kit a recipe can ask for. */
export const EQUIPMENT = [
  'hob', 'oven', 'pan', 'pot', 'knife', 'fridge',
  'kettle', 'microwave', 'blender', 'mixer', 'processor',
  'grill', 'airfryer', 'sousvide', 'coffee', 'scales', 'wok', 'toaster',
] as const;

export type EquipmentKind = (typeof EQUIPMENT)[number];

/** What every home has, fitted, whether or not you ever bought it. */
export const FITTED_KITCHEN: readonly EquipmentKind[] = ['hob', 'oven', 'pan', 'pot', 'knife', 'fridge'];

/** What each kind is called on screen, and how it reads in a refusal. */
export const EQUIPMENT_LABEL: Readonly<Record<EquipmentKind, string>> = {
  hob: 'A Hob', oven: 'An Oven', pan: 'A Pan', pot: 'A Pot', knife: 'A Knife',
  fridge: 'A Fridge', kettle: 'A Kettle', microwave: 'A Microwave',
  blender: 'A Blender', mixer: 'A Stand Mixer', processor: 'A Food Processor',
  grill: 'A Grill', airfryer: 'An Air Fryer', sousvide: 'A Sous Vide Circulator',
  coffee: 'A Coffee Machine', scales: 'Kitchen Scales', wok: 'A Wok', toaster: 'A Toaster',
};

/**
 * What a thing you own counts as in the kitchen, read off the name the maker
 * put on it. A range gives you a hob and an oven, because a range is both.
 */
const READS: readonly [RegExp, EquipmentKind[]][] = [
  [/\brange\b|\bcooker\b/i, ['hob', 'oven']],
  [/\bhob\b|cooktop/i, ['hob']],
  [/\boven\b/i, ['oven']],
  [/refrigerat|\bfridge\b|wine cabinet|wine column/i, ['fridge']],
  [/freezer/i, ['fridge']],
  [/microwave/i, ['microwave']],
  [/kettle/i, ['kettle']],
  [/blender|vitamix/i, ['blender']],
  [/stand mixer|kitchenaid/i, ['mixer']],
  [/food processor|thermomix/i, ['processor', 'blender']],
  [/air fryer/i, ['airfryer']],
  [/sous vide|immersion circulator/i, ['sousvide']],
  [/espresso|coffee machine|coffee maker|bean to cup|grinder/i, ['coffee']],
  [/\bgrill\b|barbecue|\bbbq\b|pizza oven/i, ['grill']],
  [/toaster/i, ['toaster']],
  [/\bscales?\b/i, ['scales']],
  [/\bwok\b/i, ['wok']],
  [/\bpan\b|skillet|frying/i, ['pan']],
  [/\bpot\b|casserole|dutch oven|stockpot/i, ['pot']],
  [/\bknife\b|knives/i, ['knife']],
];

/** Everything a single owned thing counts as. Empty for most of the house. */
export function equipmentFrom(name: string, category: string): EquipmentKind[] {
  if (category !== 'appliance' && category !== 'household' && category !== 'home') return [];
  const kinds = new Set<EquipmentKind>();
  for (const [pattern, gives] of READS) {
    if (pattern.test(name)) for (const kind of gives) kinds.add(kind);
  }
  return [...kinds];
}

function recipe(
  id: string, name: string, meal: Recipe['meal'], ingredients: [string, number][],
  equipment: EquipmentKind[], prepMinutes: number, difficulty: number,
  servings: number, nourishment: number, quality: number,
): Recipe {
  return {
    id, name, type: 'recipe', meal,
    ingredients: ingredients.map(([catalogId, quantity]) => ({ catalogId, quantity })),
    equipment, prepMinutes, difficulty, servings, nourishment, quality, ...SIM,
  };
}

/**
 * The book. The nine ids that existed before are kept and re-pointed at
 * products a shop really sells, so an old save that remembers cooking one
 * still resolves it.
 */
export const REAL_RECIPES: readonly Recipe[] = [
  // --- Breakfast ------------------------------------------------------------
  recipe('scrambled_eggs', 'Scrambled Eggs On Toast', 'breakfast', [['g_burford_eggs', 0.25], ['g_kerrygold', 0.05], ['g_poilane', 0.15]], ['hob', 'pan'], 12, 10, 1, 26, 58),
  recipe('cereal_bowl', 'Cereal And Milk', 'breakfast', [['g_cheerios', 0.15], ['g_organic_valley_milk', 0.2]], [], 3, 2, 1, 18, 32),
  recipe('porridge', 'Porridge With Berries', 'breakfast', [['g_quaker_oats', 0.15], ['g_organic_valley_milk', 0.25], ['g_driscolls_blue', 0.2]], ['hob', 'pot'], 10, 8, 1, 24, 60),
  recipe('full_breakfast', 'A Full Breakfast', 'breakfast', [['g_sausages', 0.5], ['g_applegate', 0.4], ['g_burford_eggs', 0.3], ['g_tomatoes_vine', 0.3], ['g_mushrooms_chestnut', 0.3], ['g_hovis', 0.2]], ['hob', 'pan', 'grill'], 30, 26, 2, 46, 72),
  recipe('avocado_toast', 'Avocado On Sourdough', 'breakfast', [['g_hass', 0.5], ['g_poilane', 0.2], ['g_lemons', 0.15], ['g_chilli_flakes', 0.05]], ['knife', 'toaster'], 8, 8, 1, 24, 66),
  recipe('pancakes', 'Buttermilk Pancakes', 'breakfast', [['g_flour_plain', 0.2], ['g_burford_eggs', 0.25], ['g_organic_valley_milk', 0.2], ['g_baking_powder', 0.1], ['g_kerrygold', 0.08]], ['hob', 'pan', 'mixer'], 25, 22, 3, 32, 70),
  recipe('yoghurt_bowl', 'Yoghurt, Honey And Fruit', 'breakfast', [['g_fage', 0.3], ['g_honey_acacia', 0.08], ['g_driscolls_straw', 0.25]], [], 4, 3, 1, 20, 62),
  recipe('smoothie', 'Berry And Banana Smoothie', 'drink', [['g_frozen_berries', 0.3], ['g_dole_bananas', 0.2], ['g_fage', 0.2], ['g_oatly', 0.2]], ['blender'], 6, 6, 1, 16, 68),
  recipe('bacon_sandwich', 'Bacon Sandwich', 'breakfast', [['g_applegate', 0.5], ['g_warburtons', 0.25], ['g_heinz_ketchup', 0.05]], ['hob', 'pan'], 12, 8, 1, 30, 58),
  recipe('coffee_home', 'Coffee At Home', 'drink', [['g_lavazza', 0.05]], ['coffee'], 6, 8, 1, 3, 68),
  recipe('espresso_home', 'Espresso', 'drink', [['g_illy', 0.04]], ['coffee'], 4, 14, 1, 2, 76),
  recipe('tea_pot', 'A Pot Of Tea', 'drink', [['g_yorkshire_tea', 0.04], ['g_organic_valley_milk', 0.05]], ['kettle'], 6, 3, 2, 3, 58),
  recipe('matcha', 'Matcha', 'drink', [['g_ippodo', 0.06], ['g_oatly', 0.1]], ['kettle'], 8, 20, 1, 4, 78),
  // --- Lunch ----------------------------------------------------------------
  recipe('sandwich', 'Cheese And Tomato Sandwich', 'lunch', [['g_poilane', 0.2], ['g_cabot_cheddar', 0.15], ['g_tomatoes_vine', 0.2], ['g_maille', 0.04]], ['knife'], 8, 8, 1, 28, 52),
  recipe('toastie', 'Cheese Toastie', 'lunch', [['g_warburtons', 0.2], ['g_gruyere', 0.15], ['g_kerrygold', 0.06]], ['hob', 'pan'], 12, 12, 1, 32, 62),
  recipe('caesar', 'Chicken Caesar Salad', 'lunch', [['g_bell_evans', 0.5], ['g_lettuce_gem', 0.5], ['g_parmigiano', 0.1], ['g_anchovies', 0.1], ['g_hellmanns', 0.08], ['g_la_brea', 0.15]], ['hob', 'pan', 'knife'], 25, 30, 2, 36, 74),
  recipe('greek_salad', 'Greek Salad', 'lunch', [['g_feta', 0.4], ['g_cucumber', 0.5], ['g_tomatoes_vine', 0.5], ['g_olives', 0.2], ['g_colavita', 0.06], ['g_oregano', 0.04]], ['knife'], 15, 12, 2, 28, 70),
  recipe('soup_tomato', 'Tomato And Basil Soup', 'lunch', [['g_chopped_tomatoes', 0.8], ['g_onions_brown', 0.3], ['g_garlic', 0.15], ['g_basil', 0.3], ['g_stock_veg', 0.2], ['g_double_cream', 0.1]], ['hob', 'pot', 'blender'], 40, 26, 4, 30, 74),
  recipe('soup_chicken', 'Chicken Noodle Soup', 'lunch', [['g_whole_chicken', 0.4], ['g_carrots', 0.3], ['g_celery', 0.3], ['g_onions_brown', 0.3], ['g_noodles_egg', 0.3], ['g_stock_chicken', 0.3]], ['hob', 'pot'], 55, 30, 4, 36, 74),
  recipe('omelette', 'Omelette Fines Herbes', 'lunch', [['g_burford_eggs', 0.35], ['g_kerrygold', 0.06], ['g_parsley', 0.2], ['g_gruyere', 0.1]], ['hob', 'pan'], 14, 24, 1, 30, 72),
  recipe('quesadilla', 'Black Bean Quesadilla', 'lunch', [['g_tortillas', 0.3], ['g_black_beans', 0.4], ['g_cabot_cheddar', 0.2], ['g_soured_cream', 0.1], ['g_huy_fong', 0.04]], ['hob', 'pan'], 18, 14, 2, 34, 64),
  recipe('halloumi_salad', 'Halloumi And Rocket Salad', 'lunch', [['g_halloumi', 0.5], ['g_rocket', 0.4], ['g_tomatoes_cherry', 0.3], ['g_lemons', 0.2], ['g_frantoia', 0.06]], ['hob', 'pan'], 18, 16, 2, 30, 72),
  recipe('ploughmans', 'A Ploughman’s', 'lunch', [['g_cabot_cheddar', 0.25], ['g_carrs', 0.2], ['g_pink_lady', 0.3], ['g_colmans', 0.04], ['g_olives', 0.15]], ['knife'], 10, 6, 1, 30, 62),
  recipe('tuna_nicoise', 'Tuna Niçoise', 'lunch', [['g_ortiz_tuna', 0.5], ['g_wilja', 0.3], ['g_green_beans', 0.3], ['g_burford_eggs', 0.25], ['g_olives', 0.2], ['g_frantoia', 0.06]], ['hob', 'pot'], 35, 34, 2, 38, 78),
  // --- Dinner ---------------------------------------------------------------
  recipe('pasta_simple', 'Spaghetti Al Pomodoro', 'dinner', [['g_barilla', 0.4], ['g_chopped_tomatoes', 0.6], ['g_garlic', 0.25], ['g_basil', 0.3], ['g_colavita', 0.06]], ['hob', 'pot', 'pan'], 25, 22, 2, 34, 66),
  recipe('carbonara', 'Spaghetti Alla Carbonara', 'dinner', [['g_afeltra', 0.4], ['g_pancetta', 0.4], ['g_burford_eggs', 0.3], ['g_pecorino', 0.15], ['g_tellicherry', 0.05]], ['hob', 'pot', 'pan'], 25, 44, 2, 40, 82),
  recipe('cacio_e_pepe', 'Cacio E Pepe', 'dinner', [['g_afeltra', 0.4], ['g_pecorino', 0.25], ['g_tellicherry', 0.08]], ['hob', 'pot', 'pan'], 20, 52, 2, 34, 82),
  recipe('amatriciana', 'Bucatini All’Amatriciana', 'dinner', [['g_barilla', 0.4], ['g_pancetta', 0.35], ['g_cento_san_marzano', 0.5], ['g_pecorino', 0.15], ['g_chilli_flakes', 0.05]], ['hob', 'pot', 'pan'], 30, 38, 2, 40, 80),
  recipe('beef_ragu', 'Slow Beef Ragù', 'dinner', [['g_beef_mince', 0.8], ['g_chopped_tomatoes', 0.8], ['g_onions_brown', 0.4], ['g_carrots', 0.3], ['g_celery', 0.3], ['g_garlic', 0.3], ['g_de_cecco', 0.5], ['g_stock_beef', 0.2]], ['hob', 'pot', 'knife'], 180, 60, 6, 46, 88),
  recipe('lasagne', 'Lasagne', 'dinner', [['g_beef_mince', 0.8], ['g_chopped_tomatoes', 0.7], ['g_mozzarella', 0.4], ['g_parmigiano', 0.2], ['g_organic_valley_milk', 0.3], ['g_flour_plain', 0.15]], ['hob', 'oven', 'pot'], 120, 58, 6, 48, 86),
  recipe('roast_chicken', 'Roast Chicken And Potatoes', 'dinner', [['g_whole_chicken', 0.9], ['g_wilja', 0.5], ['g_lemons', 0.3], ['g_thyme', 0.3], ['g_kerrygold', 0.1]], ['oven', 'pot'], 95, 44, 4, 44, 82),
  recipe('sunday_roast', 'Sunday Roast', 'dinner', [['g_lamb_shoulder', 0.8], ['g_wilja', 0.6], ['g_carrots', 0.4], ['g_broccoli', 0.3], ['g_stock_beef', 0.2], ['g_flour_plain', 0.1]], ['oven', 'hob', 'pot'], 190, 62, 6, 52, 90),
  recipe('salmon_dinner', 'Pan Seared Salmon And Spinach', 'dinner', [['g_verlasso', 0.6], ['g_earthbound', 0.4], ['g_garlic', 0.2], ['g_lemons', 0.25], ['g_frantoia', 0.06]], ['hob', 'pan'], 30, 46, 2, 40, 86),
  recipe('sea_bass', 'Sea Bass With Salsa Verde', 'dinner', [['g_sea_bass', 0.7], ['g_parsley', 0.4], ['g_capers', 0.15], ['g_anchovies', 0.1], ['g_lemons', 0.25], ['g_frantoia', 0.08]], ['hob', 'pan', 'knife'], 35, 56, 2, 38, 88),
  recipe('cod_chorizo', 'Cod With Chorizo And Chickpeas', 'dinner', [['g_cod', 0.7], ['g_chorizo', 0.35], ['g_chickpeas', 0.5], ['g_paprika', 0.05], ['g_parsley', 0.2]], ['hob', 'pan'], 35, 48, 2, 42, 84),
  recipe('mussels', 'Moules Marinière', 'dinner', [['g_mussels', 0.9], ['g_shallots', 0.3], ['g_garlic', 0.2], ['g_double_cream', 0.2], ['g_parsley', 0.3], ['g_la_brea', 0.3]], ['hob', 'pot'], 30, 42, 2, 38, 84),
  recipe('risotto_mushroom', 'Mushroom Risotto', 'dinner', [['g_acquerello', 0.4], ['g_mushrooms_chestnut', 0.5], ['g_shallots', 0.25], ['g_stock_veg', 0.4], ['g_parmigiano', 0.15], ['g_kerrygold', 0.1]], ['hob', 'pot'], 45, 54, 3, 38, 84),
  recipe('risotto_lemon', 'Lemon And Pea Risotto', 'dinner', [['g_acquerello', 0.4], ['g_frozen_peas', 0.4], ['g_lemons_amalfi', 0.3], ['g_stock_veg', 0.4], ['g_parmigiano', 0.15]], ['hob', 'pot'], 40, 50, 3, 36, 82),
  recipe('curry_green', 'Thai Green Curry', 'dinner', [['g_curry_paste', 0.25], ['g_coconut_milk', 0.6], ['g_bell_evans', 0.6], ['g_green_beans', 0.3], ['g_tilda', 0.4], ['g_limes', 0.2]], ['hob', 'pot', 'wok'], 40, 40, 3, 42, 82),
  recipe('curry_chickpea', 'Chickpea And Spinach Curry', 'dinner', [['g_chickpeas', 0.6], ['g_earthbound', 0.4], ['g_chopped_tomatoes', 0.5], ['g_onions_brown', 0.3], ['g_ginger', 0.15], ['g_cumin', 0.06], ['g_tilda', 0.4]], ['hob', 'pot'], 40, 32, 4, 40, 78),
  recipe('stir_fry', 'Chicken And Ginger Stir Fry', 'dinner', [['g_bell_evans', 0.6], ['g_peppers', 0.4], ['g_spring_onions', 0.3], ['g_ginger', 0.15], ['g_kikkoman', 0.08], ['g_noodles_egg', 0.4], ['g_sesame_oil', 0.05]], ['hob', 'wok'], 25, 34, 2, 40, 76),
  recipe('katsu', 'Chicken Katsu', 'dinner', [['g_bell_evans', 0.6], ['g_breadcrumbs', 0.3], ['g_burford_eggs', 0.2], ['g_flour_plain', 0.15], ['g_koshihikari', 0.4], ['g_kewpie', 0.06]], ['hob', 'pan'], 45, 46, 2, 44, 80),
  recipe('bibimbap', 'Bibimbap', 'dinner', [['g_koshihikari', 0.4], ['g_beef_mince', 0.5], ['g_gochujang', 0.15], ['g_burford_eggs', 0.25], ['g_earthbound', 0.3], ['g_sesame_oil', 0.05], ['g_carrots', 0.25]], ['hob', 'pan', 'pot'], 45, 48, 2, 44, 82),
  recipe('ramen', 'Miso Ramen', 'dinner', [['g_noodles_udon', 0.4], ['g_miso', 0.15], ['g_pork_belly', 0.5], ['g_burford_eggs', 0.25], ['g_spring_onions', 0.25], ['g_stock_chicken', 0.3]], ['hob', 'pot'], 60, 56, 2, 44, 86),
  recipe('tacos', 'Beef Tacos', 'dinner', [['g_beef_mince', 0.6], ['g_tortillas', 0.4], ['g_black_beans', 0.3], ['g_soured_cream', 0.15], ['g_limes', 0.2], ['g_coriander', 0.25], ['g_cabot_cheddar', 0.15]], ['hob', 'pan'], 35, 30, 3, 42, 76),
  recipe('burger_home', 'Burgers At Home', 'dinner', [['g_beef_mince', 0.7], ['g_thomas_muffins', 0.3], ['g_cabot_cheddar', 0.15], ['g_lettuce_gem', 0.2], ['g_tomatoes_vine', 0.2], ['g_hellmanns', 0.06]], ['hob', 'pan', 'grill'], 30, 26, 3, 44, 74),
  recipe('steak_frites', 'Steak Frites', 'dinner', [['g_creekstone', 0.8], ['g_idaho', 0.5], ['g_kerrygold', 0.1], ['g_maldon', 0.04], ['g_rocket', 0.25]], ['hob', 'pan', 'oven'], 40, 52, 2, 46, 88),
  recipe('wagyu_night', 'Wagyu Striploin, Sparingly', 'dinner', [['g_snake_river', 0.6], ['g_maldon', 0.04], ['g_tellicherry', 0.04], ['g_cavolo_nero', 0.3]], ['hob', 'pan'], 30, 66, 2, 44, 96),
  recipe('shepherds_pie', 'Shepherd’s Pie', 'dinner', [['g_beef_mince', 0.8], ['g_wilja', 0.6], ['g_carrots', 0.3], ['g_onions_brown', 0.3], ['g_stock_beef', 0.2], ['g_kerrygold', 0.1]], ['hob', 'oven', 'pot'], 90, 44, 4, 48, 82),
  recipe('sausage_mash', 'Sausages And Mash', 'dinner', [['g_sausages', 0.7], ['g_wilja', 0.5], ['g_onions_brown', 0.3], ['g_stock_beef', 0.15], ['g_kerrygold', 0.1]], ['hob', 'pan', 'pot'], 45, 30, 3, 46, 76),
  recipe('roast_veg_traybake', 'Roast Vegetable Traybake', 'dinner', [['g_butternut', 0.5], ['g_peppers', 0.4], ['g_courgettes', 0.3], ['g_onions_red', 0.3], ['g_feta', 0.25], ['g_frantoia', 0.08]], ['oven'], 55, 20, 4, 34, 76),
  recipe('pizza_home', 'Pizza From Scratch', 'dinner', [['g_flour_00', 0.4], ['g_yeast', 0.1], ['g_cento_san_marzano', 0.4], ['g_mozzarella', 0.4], ['g_basil', 0.2], ['g_frantoia', 0.06]], ['oven', 'mixer'], 150, 58, 3, 42, 86),
  recipe('gnocchi', 'Gnocchi With Sage Butter', 'dinner', [['g_wilja', 0.6], ['g_flour_00', 0.25], ['g_burford_eggs', 0.2], ['g_kerrygold', 0.12], ['g_parmigiano', 0.15]], ['hob', 'pot', 'pan'], 75, 62, 3, 40, 84),
  recipe('paella', 'Paella', 'dinner', [['g_acquerello', 0.4], ['g_prawns', 0.5], ['g_chorizo', 0.3], ['g_peppers', 0.3], ['g_paprika', 0.06], ['g_stock_chicken', 0.3]], ['hob', 'pan'], 60, 56, 4, 44, 86),
  recipe('prawn_linguine', 'Prawn And Chilli Linguine', 'dinner', [['g_rummo', 0.4], ['g_prawns', 0.5], ['g_chillies', 0.15], ['g_garlic', 0.2], ['g_parsley', 0.25], ['g_lemons', 0.2]], ['hob', 'pot', 'pan'], 30, 44, 2, 40, 84),
  recipe('pesto_pasta', 'Pasta With Basil Pesto', 'dinner', [['g_de_cecco', 0.4], ['g_basil', 0.5], ['g_parmigiano', 0.15], ['g_frantoia', 0.1], ['g_garlic', 0.1]], ['hob', 'pot', 'processor'], 25, 30, 2, 36, 78),
  recipe('tofu_traybake', 'Sticky Tofu And Broccoli', 'dinner', [['g_hodo_tofu', 0.6], ['g_broccoli', 0.4], ['g_kikkoman', 0.08], ['g_honey_acacia', 0.06], ['g_ginger', 0.12], ['g_tilda', 0.4]], ['oven', 'pot'], 45, 32, 2, 38, 78),
  recipe('lentil_stew', 'Puy Lentil And Sausage Stew', 'dinner', [['g_lentils', 0.5], ['g_sausages', 0.5], ['g_carrots', 0.3], ['g_celery', 0.3], ['g_stock_veg', 0.3], ['g_bay', 0.04]], ['hob', 'pot'], 60, 36, 4, 44, 80),
  recipe('couscous_harissa', 'Harissa Chicken With Couscous', 'dinner', [['g_bell_evans', 0.6], ['g_harissa', 0.15], ['g_couscous', 0.4], ['g_lemons', 0.2], ['g_coriander', 0.25]], ['hob', 'oven', 'pot'], 45, 36, 3, 42, 80),
  // --- Sides, snacks and the sweet end -------------------------------------
  recipe('fruit_snack', 'A Piece Of Fruit', 'snack', [['g_pink_lady', 0.15]], [], 2, 1, 1, 8, 60),
  recipe('hummus_snack', 'Chickpeas, Lemon And Oil', 'snack', [['g_chickpeas', 0.3], ['g_lemons', 0.15], ['g_frantoia', 0.06], ['g_carrs', 0.2]], ['processor'], 12, 16, 2, 20, 68),
  recipe('garlic_bread', 'Garlic Bread', 'snack', [['g_la_brea', 0.4], ['g_kerrygold', 0.15], ['g_garlic', 0.2], ['g_parsley', 0.15]], ['oven'], 20, 12, 3, 22, 66),
  recipe('cheese_board', 'A Cheese Board', 'snack', [['g_comte', 0.2], ['g_president_brie', 0.2], ['g_carrs', 0.2], ['g_honey_acacia', 0.06], ['g_pink_lady', 0.2]], ['knife'], 10, 8, 4, 26, 78),
  recipe('brownies', 'Chocolate Brownies', 'snack', [['g_valrhona', 0.35], ['g_kerrygold', 0.2], ['g_sugar_caster', 0.3], ['g_burford_eggs', 0.3], ['g_flour_plain', 0.2]], ['oven', 'mixer'], 55, 34, 8, 24, 82),
  recipe('banana_bread', 'Banana Bread', 'snack', [['g_dole_bananas', 0.5], ['g_flour_plain', 0.3], ['g_sugar_brown', 0.25], ['g_burford_eggs', 0.25], ['g_kerrygold', 0.2]], ['oven', 'mixer'], 75, 30, 8, 26, 78),
  recipe('cookies', 'Chocolate Chip Cookies', 'snack', [['g_flour_plain', 0.3], ['g_sugar_brown', 0.25], ['g_kerrygold', 0.2], ['g_burford_eggs', 0.2], ['g_tonys', 0.3], ['g_vanilla', 0.04]], ['oven', 'mixer'], 45, 26, 10, 22, 76),
  recipe('tiramisu', 'Tiramisu', 'snack', [['g_mascarpone', 0.5], ['g_burford_eggs', 0.3], ['g_sugar_caster', 0.2], ['g_illy', 0.1], ['g_valrhona', 0.1]], ['mixer'], 45, 52, 6, 26, 86),
  recipe('pavlova', 'Pavlova With Berries', 'snack', [['g_burford_eggs', 0.35], ['g_sugar_caster', 0.35], ['g_double_cream', 0.3], ['g_driscolls_straw', 0.4]], ['oven', 'mixer'], 120, 56, 6, 24, 84),
  recipe('apple_crumble', 'Apple Crumble', 'snack', [['g_honeycrisp', 0.5], ['g_flour_plain', 0.25], ['g_sugar_brown', 0.2], ['g_kerrygold', 0.2], ['g_cinnamon', 0.05]], ['oven'], 65, 24, 6, 28, 76),
  recipe('roast_potatoes', 'Roast Potatoes', 'snack', [['g_wilja', 0.6], ['g_frantoia', 0.08], ['g_rosemary', 0.15], ['g_maldon', 0.04]], ['oven', 'pot'], 70, 26, 4, 26, 78),
  recipe('mash', 'Buttered Mash', 'snack', [['g_wilja', 0.5], ['g_kerrygold', 0.15], ['g_organic_valley_milk', 0.15]], ['hob', 'pot'], 30, 18, 4, 24, 70),
  recipe('green_salad', 'A Green Salad', 'snack', [['g_organicgirl', 0.4], ['g_frantoia', 0.05], ['g_lemons', 0.15], ['g_maldon', 0.03]], ['knife'], 8, 6, 2, 14, 64),
  recipe('bruschetta', 'Bruschetta', 'snack', [['g_la_brea', 0.3], ['g_tomatoes_cherry', 0.35], ['g_basil', 0.2], ['g_garlic', 0.1], ['g_frantoia', 0.06]], ['grill', 'knife'], 15, 14, 3, 20, 72),
];
