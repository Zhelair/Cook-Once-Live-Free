export type Ingredient = { id: string; name: string; category: string; unit: string; grams?: number; calories?: number; protein?: number };

export const ingredientSeed: Ingredient[] = [
  { id: "chicken-thigh", name: "Chicken thighs", category: "Main protein", unit: "kg", grams: 1000, calories: 192, protein: 18 },
  { id: "pork", name: "Pork shoulder / loin", category: "Main protein", unit: "kg", grams: 1000, calories: 242, protein: 17 },
  { id: "mince", name: "Minced meat", category: "Main protein", unit: "kg", grams: 1000, calories: 254, protein: 17 },
  { id: "lentils", name: "Lentils", category: "Carbs, grains & legumes", unit: "g", grams: 400, calories: 116, protein: 9 },
  { id: "rice", name: "Rice", category: "Carbs, grains & legumes", unit: "g", grams: 400, calories: 130, protein: 3 },
  { id: "potato", name: "Potatoes", category: "Vegetables & aromatics", unit: "medium", grams: 170, calories: 77, protein: 2 },
  { id: "onion", name: "Onions", category: "Vegetables & aromatics", unit: "medium", grams: 110, calories: 40, protein: 1 },
  { id: "mushroom", name: "Mushrooms", category: "Vegetables & aromatics", unit: "g", grams: 250, calories: 22, protein: 3 },
  { id: "garlic", name: "Garlic", category: "Vegetables & aromatics", unit: "bulb", grams: 45, calories: 149, protein: 6 },
  { id: "yogurt", name: "Yoghurt", category: "Dairy & eggs", unit: "g", grams: 400, calories: 61, protein: 3.5 },
  { id: "egg", name: "Eggs", category: "Dairy & eggs", unit: "egg", grams: 55, calories: 143, protein: 13 },
];

export const starterRecipe = {
  id: "roast-pork-tray",
  name: "Kaufland pork tray with potatoes",
  servings: 4,
  equipment: ["Oven", "Air fryer"],
  duration: "55 min",
  tags: ["Batch", "Freezer-friendly", "Cheap this week"],
  ingredients: ["1 kg pork loin or shoulder", "4 large potatoes", "2 onions", "1 garlic bulb", "250 g mushrooms", "Oil, salt, paprika"],
};
