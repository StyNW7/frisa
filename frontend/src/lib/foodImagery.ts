import type { FoodCategory } from '@/types'

/**
 * Real food photography for every item, ingredient and recipe.
 *
 * Items are transparent studio cut-outs in `public/Images/food/`, so they sit
 * cleanly on any tint at any size. Recipes are full-bleed dish photographs in
 * `public/Images/recipes/`. Everything is served locally: the CSP only allows
 * `img-src 'self'`, and the app keeps working offline.
 *
 * Sources and licences: `public/Images/CREDITS.md`.
 */

const FOOD_DIR = '/Images/food'

/**
 * Name patterns, most specific first. Matching is on the item name the user or
 * the hub typed, in English or Indonesian, so manual entries get a photo too.
 */
const NAME_PHOTO: Array<[RegExp, string]> = [
  /* Prepared dishes and drinks before their ingredients. */
  [/nugget/i, 'chicken-nuggets'],
  [/fried rice|nasi goreng/i, 'fried-rice'],
  [/rendang/i, 'beef-rendang'],
  [/pizza/i, 'pizza'],
  [/iced coffee|es kopi|latte|cappuccino|cold brew/i, 'iced-coffee'],
  [/coffee|kopi/i, 'coffee-beans'],
  [/\btea\b|\bteh\b|matcha/i, 'jasmine-tea'],
  [/juice|\bjus\b/i, 'orange-juice'],
  [/\bwater\b|\bair mineral\b|aqua/i, 'mineral-water'],
  [/ice cream|gelato|es krim/i, 'ice-cream'],
  [/yog(h)?urt/i, 'greek-yogurt'],
  [/milk|susu/i, 'milk'],

  /* Dairy */
  [/cheese slice|sliced cheese|keju slice/i, 'cheese-slices'],
  [/parmesan|parmigiano/i, 'parmesan'],
  [/cheddar|cheese|keju|mozzarella|gouda/i, 'cheese'],
  [/peanut butter|selai kacang/i, 'peanuts'],
  [/butter|mentega/i, 'butter'],
  [/cream|krim/i, 'cream'],

  /* Protein */
  [/eggplant|aubergine|terong/i, 'eggplant'],
  [/\beggs?\b|telur/i, 'eggs'],
  [/smoked salmon/i, 'smoked-salmon'],
  [/salmon/i, 'salmon'],
  [/shrimp|prawn|udang/i, 'prawns'],
  [/tuna|tongkol/i, 'tuna'],
  [/mackerel|kembung/i, 'mackerel'],
  [/fish|ikan|\bcod\b|dory|tilapia|nila/i, 'fish-fillet'],
  [/chicken wing|sayap ayam/i, 'chicken-wings'],
  [/whole chicken|ayam utuh/i, 'whole-chicken'],
  [/chicken|ayam/i, 'chicken-breast'],
  [/minced beef|ground beef|daging giling/i, 'minced-beef'],
  [/steak|sirloin|tenderloin/i, 'steak'],
  [/beef|daging sapi|\bsapi\b/i, 'beef'],
  [/bacon/i, 'bacon'],
  [/\bham\b/i, 'ham'],
  [/pork|babi/i, 'pork'],
  [/lamb|mutton|kambing/i, 'lamb'],
  [/duck|bebek/i, 'duck'],
  [/temp(e|eh)\b/i, 'tempeh'],
  [/tofu|\btahu\b/i, 'tofu'],

  /* Vegetables */
  [/bok choy|bok choi|pak choi|pakcoy|sawi/i, 'bok-choy'],
  [/spinach|bayam/i, 'spinach'],
  [/kale/i, 'kale'],
  [/lettuce|selada|salad greens/i, 'lettuce'],
  [/cabbage|\bkol\b|kubis/i, 'cabbage'],
  [/broccoli|brokoli/i, 'broccoli'],
  [/carrot|wortel/i, 'carrot'],
  [/tomat/i, 'tomato'],
  [/cucumber|timun/i, 'cucumber'],
  [/potato|kentang|\bubi\b/i, 'potato'],
  [/mushroom|jamur/i, 'mushroom'],
  [/zucchini|courgette/i, 'zucchini'],
  [/pumpkin|squash|labu/i, 'pumpkin'],
  [/celery|seledri/i, 'celery'],
  [/green bean|buncis/i, 'green-beans'],
  [/asparagus/i, 'asparagus'],
  [/\bpeas\b|kacang polong/i, 'peas'],
  [/leek/i, 'leek'],
  [/bell pepper|capsicum/i, 'bell-pepper'],
  [/chil+i powder|cabai bubuk/i, 'chilli-powder'],
  [/chil+i|cabai|cabe/i, 'chilli'],
  [/salt.*pepper|garam.*merica/i, 'salt-pepper'],
  [/black pepper|\blada\b|merica|pepper/i, 'black-pepper'],
  [/spring onion|scallion|green onion|daun bawang/i, 'spring-onion'],
  [/fried shallot|bawang goreng/i, 'fried-shallots'],
  [/shallot|bawang merah/i, 'shallot'],
  [/garlic|bawang putih/i, 'garlic'],
  [/onion|bawang/i, 'onion'],

  /* Herbs and spices */
  [/chive/i, 'chives'],
  [/basil|kemangi/i, 'basil'],
  [/coriander|cilantro|ketumbar/i, 'coriander'],
  [/\bmint\b|daun mint/i, 'mint'],
  [/parsley|peterseli/i, 'parsley'],
  [/rosemary/i, 'rosemary'],
  [/lemongrass|serai|sereh/i, 'lemongrass'],
  [/ginger|jahe/i, 'ginger'],
  [/nutmeg|\bpala\b/i, 'nutmeg'],
  [/cinnamon|kayu manis/i, 'cinnamon'],
  [/cumin|jinten/i, 'cumin'],
  [/paprika/i, 'paprika'],

  /* Pantry */
  [/kecap manis|sweet soy/i, 'kecap-manis'],
  [/soy sauce|kecap/i, 'soy-sauce'],
  [/olive oil/i, 'olive-oil'],
  [/\boil\b|minyak/i, 'cooking-oil'],
  [/sesame|wijen/i, 'sesame-seeds'],
  [/stock|broth|kaldu/i, 'vegetable-stock'],
  [/rice|\bnasi\b|beras/i, 'steamed-rice'],
  [/spaghetti|pasta|penne|fettuc+ine|linguine|macaroni/i, 'spaghetti'],
  [/noodle|\bmie\b|ramen|udon|bihun/i, 'noodles'],
  [/granola|cereal|\boats?\b|muesli/i, 'granola'],
  [/honey|\bmadu\b/i, 'honey'],
  [/baguette/i, 'baguette'],
  [/\bbuns?\b|bread roll/i, 'bread-rolls'],
  [/tortilla|\bwrap\b/i, 'tortilla'],
  [/bread|toast|\broti\b/i, 'bread'],
  [/almond/i, 'almonds'],
  [/cashew|\bmete\b/i, 'cashews'],
  [/peanut|kacang/i, 'peanuts'],
  [/walnut/i, 'walnuts'],
  [/raisin|kismis/i, 'raisins'],

  /* Fruit */
  [/strawberr/i, 'strawberries'],
  [/blueberr/i, 'blueberries'],
  [/raspberr/i, 'raspberries'],
  [/berr/i, 'mixed-berries'],
  [/papaya|pepaya/i, 'papaya'],
  [/banana|pisang/i, 'banana'],
  [/apple|apel/i, 'apple'],
  [/grapefruit/i, 'grapefruit'],
  [/lime|jeruk nipis/i, 'lime'],
  [/lemon/i, 'lemon'],
  [/orange|jeruk/i, 'orange'],
  [/mango|mangga/i, 'mango'],
  [/avocado|alpukat/i, 'avocado'],
  [/\bpears?\b|\bpir\b/i, 'pear'],
  [/peach|persik/i, 'peach'],
  [/cherr/i, 'cherry'],
]

/** A composed still life per category, for names FRISA has no photo of yet. */
const CATEGORY_PHOTO: Record<FoodCategory, string> = {
  Vegetables: 'category-vegetables',
  Protein: 'category-protein',
  Dairy: 'category-dairy',
  Fruit: 'category-fruit',
  Drinks: 'category-drinks',
  Frozen: 'category-frozen',
  Leftover: 'category-leftover',
  Pantry: 'category-pantry',
}

/** Soft backdrop each photo sits on: light at the top, the category hue below. */
export const CATEGORY_BACKDROP: Record<FoodCategory, string> = {
  Vegetables: 'radial-gradient(120% 95% at 50% 18%, #FFFFFF 0%, #EEF9F3 48%, #D6F0E2 100%)',
  Protein: 'radial-gradient(120% 95% at 50% 18%, #FFFFFF 0%, #FFF4EA 48%, #FFE1C8 100%)',
  Dairy: 'radial-gradient(120% 95% at 50% 18%, #FFFFFF 0%, #F1F7FD 48%, #DAE9F7 100%)',
  Fruit: 'radial-gradient(120% 95% at 50% 18%, #FFFFFF 0%, #FFF6EA 48%, #FFE4C4 100%)',
  Drinks: 'radial-gradient(120% 95% at 50% 18%, #FFFFFF 0%, #EEF6FD 48%, #D4E7F7 100%)',
  Frozen: 'radial-gradient(120% 95% at 50% 18%, #FFFFFF 0%, #EFF7FC 48%, #D8EAF5 100%)',
  Leftover: 'radial-gradient(120% 95% at 50% 18%, #FFFFFF 0%, #F8F5F1 48%, #EAE2D7 100%)',
  Pantry: 'radial-gradient(120% 95% at 50% 18%, #FFFFFF 0%, #FBF7EF 48%, #EFE4D0 100%)',
}

/** A neutral backdrop for ingredients that are not inventory items. */
export const NEUTRAL_BACKDROP = 'radial-gradient(120% 95% at 50% 18%, #FFFFFF 0%, #F6F8F7 50%, #E7ECE9 100%)'

/** The photo slug that matches a food name, or `undefined` when nothing does. */
export function matchFoodPhoto(name: string): string | undefined {
  return NAME_PHOTO.find(([pattern]) => pattern.test(name))?.[1]
}

/** URL of the cut-out photo for a food, falling back to its category still life. */
export function foodPhoto(name: string, category?: FoodCategory): string | undefined {
  const slug = matchFoodPhoto(name) ?? (category ? CATEGORY_PHOTO[category] : undefined)
  return slug ? `${FOOD_DIR}/${slug}.webp` : undefined
}
