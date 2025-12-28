const $ = (sel)=>document.querySelector(sel);

// Flavor packs migrated from the old data (but kept inline — no JSON files in runtime).
const FLAVORS = {
  neutral: {
    name:"Neutral / family-safe",
    adds:["salt","oil","mild garlic (optional)"],
    optional:["butter"],
    swap_notes:["Keep seasoning simple.","Let sauces happen per plate."]
  },
  european: {
    name:"European comfort",
    adds:["garlic","onion","herbs","butter/olive oil"],
    optional:["mustard","paprika"],
    swap_notes:["Use butter or olive oil.","Finish with herbs."]
  },
  asian: {
    name:"Asian fusion",
    adds:["soy sauce","ginger","garlic","sesame oil"],
    optional:["rice vinegar","chili flakes"],
    swap_notes:["Swap herbs → ginger + soy.","Finish with sesame + scallion if you have it."]
  },
  med: {
    name:"Mediterranean",
    adds:["olive oil","lemon","oregano"],
    optional:["yogurt","tomato"],
    swap_notes:["Add lemon at the end.","Yogurt sauce = instant upgrade."]
  },
  smoky: {
    name:"Smoky / BBQ",
    adds:["smoked paprika","cumin","onion"],
    optional:["bbq sauce","chili"],
    swap_notes:["Smoked paprika does 80% of the work.","Optional BBQ sauce for sandwiches."]
  },
};

// --- Protein profiles (slot engine) ---
// These are behavior rules (timing, when to add, freezing, budget options).
// They let one workflow (e.g., One‑Pot Base) adapt to different proteins.
const PROTEIN_PROFILES = {
  fish: {
    name: "Fish / seafood",
    timing: "quick",
    add_when: "late",
    freezer: { rating: "ok", notes: ["Best fresh. Freezing cooked fish is okay in soup/stew, but texture softens.", "Avoid freezing delicate fillets plain."] },
    budget_options: {
      1: ["frozen white fish (pollock/hake) (700–900 g)", "canned tuna/sardines (2–3 cans)"],
      2: ["white fish fillets (700–900 g)", "salmon (600–800 g) — if on sale"],
      3: ["salmon (700–900 g)", "seafood mix (700–900 g)"]
    },
    rules: ["Keep simmer gentle.", "Add fish in the last 8–12 minutes."]
  },
  beef: {
    name: "Beef",
    timing: "long",
    add_when: "early",
    freezer: { rating: "great", notes: ["Freezes extremely well (especially in sauce/broth).", "Better after a night in the fridge."] },
    budget_options: {
      1: ["minced beef (700–900 g)", "stew beef on sale (800–1000 g)"],
      2: ["stew beef (900–1200 g)", "beef chuck (900–1200 g)"],
      3: ["chuck/short rib (900–1200 g)", "lean beef + fresh herbs"]
    },
    rules: ["Brown first for flavor.", "Long simmer: 60–120 minutes depending on cut."]
  },
  pork: {
    name: "Pork",
    timing: "long",
    add_when: "early",
    freezer: { rating: "good", notes: ["Freezes well in sauce.", "Best within ~2 months."] },
    budget_options: {
      1: ["pork shoulder (900–1200 g)", "pork mince (700–900 g)"],
      2: ["pork shoulder (1–1.5 kg)", "pork loin (800–1000 g)"],
      3: ["pork belly (700–900 g)", "premium sausages (check ingredients)"]
    },
    rules: ["Shoulder = forgiving.", "Skim fat if needed."]
  },
  chicken: {
    name: "Chicken",
    timing: "medium",
    add_when: "early",
    freezer: { rating: "good", notes: ["Freezes well in sauce/broth.", "Best within ~2 months."] },
    budget_options: {
      1: ["chicken thighs (900–1200 g)", "whole legs (1–1.4 kg)"],
      2: ["chicken thighs (1–1.4 kg)", "breast (800–1100 g)"],
      3: ["skin-on thighs + fresh herbs", "quality chicken breast"]
    },
    rules: ["Thighs are hard to overcook.", "Simmer 25–40 minutes."]
  },
  vegetarian: {
    name: "Vegetarian (legumes/tofu)",
    timing: "medium",
    add_when: "early",
    freezer: { rating: "great", notes: ["Beans/lentils freeze very well.", "Tofu is okay; texture changes but works in stews."] },
    budget_options: {
      1: ["lentils (350–500 g)", "beans (2 cans)"],
      2: ["lentils (400–600 g)", "chickpeas (2 cans)"],
      3: ["lentils + extra veg", "tofu (2 blocks) + coconut milk"]
    },
    rules: ["Add lentils early.", "If using tofu, add mid/late so it keeps shape."]
  },
  eggs: {
    name: "Eggs",
    timing: "quick",
    add_when: "late",
    freezer: { rating: "avoid", notes: ["Hard‑boiled eggs don’t freeze well.", "Keep in fridge 4–5 days."] },
    budget_options: {
      1: ["eggs (10–12)"],
      2: ["eggs (12–16)"],
      3: ["eggs (12–16) + cheese"]
    },
    rules: ["Use as backup protein.", "Add at the end (e.g., egg drop) if used in a pot."]
  }
};

function proteinAllowed(protein){
  const c = getConstraints();
  if(c.noPork && protein==="pork") return false;
  if(c.noBeef && protein==="beef") return false;
  if(c.noFish && protein==="fish") return false;
  return true;
}

function preferredProteinForSlots(slotProteins){
  const prefs = getPrefs();
  const want = prefs.protein;
  // explicit vibe wins if possible
  if(want && want!=="any"){
    if(slotProteins.includes(want) && proteinAllowed(want)) return want;
    if(want==="vegetarian" && slotProteins.includes("vegetarian") && proteinAllowed("vegetarian")) return "vegetarian";
  }
  // otherwise pick a sensible default based on budget
  const budget = prefs.budget;
  const candidates = slotProteins.filter(p=>proteinAllowed(p));
  if(!candidates.length) return slotProteins[0];
  if(budget===1){
    // cheap: chicken or veg or eggs
    const order = ["vegetarian","chicken","eggs","pork","beef","fish"];
    return order.find(p=>candidates.includes(p)) || candidates[0];
  }
  if(budget===3){
    const order = ["fish","beef","chicken","pork","vegetarian","eggs"];
    return order.find(p=>candidates.includes(p)) || candidates[0];
  }
  // normal
  const order = ["chicken","beef","fish","vegetarian","pork","eggs"];
  return order.find(p=>candidates.includes(p)) || candidates[0];
}

// Shopping/storage migrated from the old templates.json, mapped onto the new template IDs.
const TEMPLATE_EXTRAS = {
  "t1_whole_chicken_week": {
    shopping_core: {
      protein: [
        "whole chicken (1.6–2.2 kg)",
        "eggs (10–12) — backup protein"
      ],
      veg: [
        "potatoes (1–1.5 kg)",
        "carrots (500–700 g)",
        "onions (2–3)",
        "lemon (1)"
      ],
      pantry: [
        "oil or butter",
        "salt + pepper",
        "dried herbs (or fresh)"
      ],
      optional: [
        "mustard",
        "paprika",
        "bouillon cube (for broth)"
      ]
    },
    storage: {
      fridge_days: { chicken: "3–4", veg: "4", broth: "3", eggs: "5" },
      freezer: [
        "Freeze broth in 300–500 ml portions.",
        "Freeze extra chicken if you made a lot (best within 2 months)."
      ],
      label_tip: "Label containers: 'Chicken', 'Veg', 'Broth' + date. Your future self is your best friend."
    }
  },
  "t2_roast_shoulder_week": {
    shopping_core: {
      protein: ["pork shoulder OR beef roast (1.5–2.2 kg)"],
      veg: ["onions (2–3)","carrots (400–600 g)","potatoes (700–1000 g)"],
      pantry: ["salt + pepper","oil","paprika (optional)","garlic (optional)"],
      optional: ["stock cube","mustard","pickles (for serving)"]
    },
    storage: {
      fridge_days: { roast: "3–4", veg: "4" },
      freezer: ["Freeze 1–2 portions sliced (best within 2 months)."],
      label_tip: "Freeze a couple of portions on purpose. 'Surprise-meal' is a real life skill."
    }
  },
  "t3_fish_tray_week": {
    shopping_core: {
      protein: ["white fish fillets (700–1000 g) OR salmon (600–900 g)"],
      veg: ["mixed tray veg (700–1000 g)","lemon (1)"],
      pantry: ["salt + pepper","oil"],
      optional: ["yogurt (sauce)","soy + ginger (sauce)","dill"]
    }
  },
  "t4_lentil_chili_week": {
    shopping_core: {
      protein: ["lentils (400–600 g)"],
      veg: ["onion (1)","garlic (2–4 cloves)","optional veg: bell pepper/carrots"],
      pantry: ["canned tomatoes (2)","oil","salt","chili/paprika/cumin"],
      optional: ["tomato paste","vinegar/lemon","cheese or yogurt"]
    }
  },
  "t5_chicken_thighs_sheetpan": {
    shopping_core: {
      protein: ["chicken thighs (1.2–1.8 kg)"],
      veg: ["tray veg (900–1300 g)","onion (1–2)"],
      pantry: ["oil","salt + pepper"],
      optional: ["paprika","garlic powder","yogurt/soy sauce for bowls"]
    }
  },
  "t6_minced_meat_base_week": {
    shopping_core: {
      protein: ["minced beef (800–1200 g) OR mixed mince"],
      veg: ["onion (1–2)","optional veg: carrots/celery"],
      pantry: ["oil","salt","spices (paprika/cumin)","tomatoes OR tomato paste"],
      optional: ["rice/pasta (2–3 days)","pickles/herbs to refresh"]
    }
  },
  "t7_soup_first_week": {
    shopping_core: {
      protein: ["chicken pieces (900–1400 g)"],
      veg: ["onion (1)","carrots (2)","celery (optional)","lemon (optional)"],
      pantry: ["salt","pepper"],
      optional: ["noodles OR rice (for last 10–12 min)","bouillon cube"]
    }
  }
};

// Template schema is ONE consistent format (no legacy fields).
const TEMPLATES = [
  {
    "id": "t0_one_pot_base",
    "name": "One‑Pot Base (slot workflow)",
    "workflow": "slots",
    "cooking_style": "batch",
    "cost_level": 2,
    "tags": { "proteins": ["chicken","beef","pork","fish","vegetarian"], "contains": [] },
    "slot_proteins": ["chicken","beef","pork","fish","vegetarian"],
    "slot_bases": {
      "veg_body": ["onion", "carrot", "celery (optional)", "garlic (optional)"],
      "starch_body": ["potatoes", "rice", "lentils", "beans"],
      "finishes": ["lemon", "herbs", "yogurt", "chili", "soy + ginger"]
    },
    "portions": { "main_meals": 6, "extras": "+ 1–2 emergency portions (optional)" },
    "cleanup_score": 10,
    "hands_on_minutes": 25,
    "total_sunday_minutes": 75,
    "station": {
      "tools": ["large pot", "cutting board + knife", "wooden spoon", "ladle"],
      "containers": ["6 meal boxes", "1–2 freezer boxes (optional)"],
      "order": ["Chop base veg", "Brown (if needed)", "Simmer base", "Add protein at the right time", "Season + pack"]
    }
  },
  {
    "id": "t1_whole_chicken_week",
    "name": "Whole Chicken Week (Roast + Tray Veg)",
    "cooking_style": "batch",
    "cost_level": 2,
    "proteins": {
      "primary": "chicken",
      "secondary": null
    },
    "tags": {
      "proteins": [
        "chicken"
      ],
      "contains": []
    },
    "portions": {
      "main_meals": 5,
      "extras": "+ broth jar (optional)"
    },
    "cleanup_score": 9,
    "hands_on_minutes": 30,
    "total_sunday_minutes": 95,
    "station": {
      "tools": [
        "1 rimmed sheet pan",
        "cutting board + knife",
        "big bowl for veg",
        "tongs",
        "instant-read thermometer (optional)"
      ],
      "containers": [
        "6 meal boxes",
        "1 small sauce jar (optional)",
        "1 jar for broth (optional)"
      ],
      "order": [
        "Preheat oven + tray",
        "Dry + season chicken",
        "Chop veg → tray",
        "Roast together",
        "Rest → pull meat → pack",
        "(Optional) broth later from bones"
      ]
    },
    "outputs": [
      {
        "label": "Roast chicken meat",
        "amount": "~1.2–1.6 kg"
      },
      {
        "label": "Tray vegetables",
        "amount": "~900–1200 g"
      },
      {
        "label": "Optional broth jar",
        "amount": "~0.5–1 liter"
      }
    ],
    "sunday_timeline": [
      {
        "t": "0–12 min",
        "title": "Heat & prep",
        "quick": [
          "Preheat 210°C (fan 200°C)",
          "Dry chicken skin",
          "Season chicken + veg"
        ],
        "detailed": [
          "Preheat 210°C (fan 200°C). Preheat the empty tray for better browning.",
          "Pat chicken skin very dry (this is crispness).",
          "Season generously: salt + pepper; paprika optional. Season inside too.",
          "Chop veg evenly; toss with oil + salt + pepper."
        ],
        "cues": [
          "Thermometer: ~74°C in thickest breast (optional)."
        ],
        "pitfalls": [
          "Wet skin = rubber skin.",
          "Crowded veg steams."
        ],
        "pack": [
          "Keep sauce separate; pack chicken + veg in portions."
        ]
      },
      {
        "t": "12–85 min",
        "title": "Roast (same oven)",
        "quick": [
          "Veg around chicken",
          "Stir veg once",
          "Roast to doneness"
        ],
        "detailed": [
          "Spread veg on hot tray; leave center space.",
          "Place chicken breast-side up in center; veg around it (not under).",
          "Roast 45 min; stir/flip veg.",
          "Continue roasting until chicken is deep golden (usually 75–85 min total)."
        ],
        "cues": [
          "Juices clear near thigh joint.",
          "Skin deep golden."
        ],
        "pitfalls": [
          "Opening oven repeatedly slows roast.",
          "Veg under chicken turns soggy."
        ],
        "pack": [
          "Set containers out while it roasts."
        ]
      },
      {
        "t": "85–95 min",
        "title": "Rest, pull, pack",
        "quick": [
          "Rest 10 min",
          "Pull meat",
          "Pack boxes"
        ],
        "detailed": [
          "Rest 10 minutes (juicy meat).",
          "Pull meat off bones (hands/two forks).",
          "Pack: chicken + veg per box. Reserve some for wraps/salads.",
          "Save bones for optional broth."
        ],
        "cues": [
          "Meat juicy, not stringy."
        ],
        "pitfalls": [
          "Packing piping hot causes condensation."
        ],
        "pack": [
          "Cool 15–20 min, then seal + fridge."
        ]
      }
    ],
    "derived": [
      {
        "title": "🍽 Plate meal",
        "how": [
          "Chicken + tray veg",
          "Add salad/pickles"
        ]
      },
      {
        "title": "🍚 Bowl",
        "how": [
          "Rice + chicken + veg",
          "Yogurt/soy sauce"
        ]
      },
      {
        "title": "🥪 Wrap",
        "how": [
          "Chicken + greens",
          "Wrap + sauce"
        ]
      },
      {
        "title": "🍜 Quick soup",
        "how": [
          "Broth + chicken + veg",
          "10 min pot"
        ]
      }
    ]
  },
  {
    "id": "t2_roast_shoulder_week",
    "name": "Roast Shoulder Week (Pork or Beef)",
    "cooking_style": "batch",
    "cost_level": 2,
    "proteins": {
      "primary": "pork",
      "secondary": "beef"
    },
    "tags": {
      "proteins": [
        "pork",
        "beef"
      ],
      "contains": []
    },
    "portions": {
      "main_meals": 6,
      "extras": "+ goulash pot (optional)"
    },
    "cleanup_score": 8,
    "hands_on_minutes": 35,
    "total_sunday_minutes": 120,
    "station": {
      "tools": [
        "Dutch oven / roasting pan with lid",
        "knife + board",
        "tongs",
        "foil (optional)"
      ],
      "containers": [
        "7–8 meal boxes",
        "1 medium container (optional goulash)"
      ],
      "order": [
        "Preheat low oven",
        "Season (+ sear optional)",
        "Covered slow roast",
        "Add veg late",
        "Rest/slice",
        "Pack + freeze 1–2"
      ]
    },
    "outputs": [
      {
        "label": "Roast meat",
        "amount": "~1.4–2.0 kg"
      },
      {
        "label": "Roast veg",
        "amount": "~700–1000 g"
      }
    ],
    "sunday_timeline": [
      {
        "t": "0–15 min",
        "title": "Season & start",
        "quick": [
          "Oven 175°C (fan 165°C)",
          "Season meat",
          "Onion bed"
        ],
        "detailed": [
          "Preheat 175°C (fan 165°C).",
          "Season heavily: salt + pepper; paprika/garlic optional.",
          "Optional: sear 2–3 min/side for deeper flavor.",
          "Line pot with sliced onions; meat goes on top."
        ],
        "cues": [
          "If seared: dark crust = flavor base."
        ],
        "pitfalls": [
          "Under-salting big meat makes bland week.",
          "Too much liquid = boiled vibe."
        ],
        "pack": [
          "Get containers out now — yield is big."
        ]
      },
      {
        "t": "15–105 min",
        "title": "Slow roast + veg late",
        "quick": [
          "Cover and roast",
          "Check tenderness",
          "Add veg last 40 min"
        ],
        "detailed": [
          "Add small splash of water/stock; cover with lid/foil.",
          "Roast ~90 min, then check with fork.",
          "Add veg for last 35–45 min (roast, don’t mush).",
          "If tight: give it more time — big cuts are patience food."
        ],
        "cues": [
          "Fork begins to slide in easier near end."
        ],
        "pitfalls": [
          "Veg too early turns mush.",
          "Roasting uncovered too long dries surface."
        ],
        "pack": [
          "Use roast time to prep salad/pickles for weekday freshness."
        ]
      },
      {
        "t": "105–120 min",
        "title": "Rest, slice, pack",
        "quick": [
          "Rest 10–15",
          "Slice across grain",
          "Pack"
        ],
        "detailed": [
          "Rest 10–15 min.",
          "Slice across the grain (tender).",
          "Pack meat + veg; keep some unsauced for sandwiches.",
          "Freeze 1–2 portions for future-you."
        ],
        "cues": [
          "Slices juicy, not crumbly."
        ],
        "pitfalls": [
          "Slicing with grain makes it chewy.",
          "Sealing hot = condensation."
        ],
        "pack": [
          "Cool briefly, seal, fridge/freezer."
        ]
      }
    ],
    "derived": [
      {
        "title": "🥪 Sandwich",
        "how": [
          "Cold roast + mustard",
          "Bread + greens"
        ]
      },
      {
        "title": "🍚 Bowl",
        "how": [
          "Rice + roast slices",
          "Pickles + sauce"
        ]
      },
      {
        "title": "🍽 Plate",
        "how": [
          "Roast + veg",
          "Mustard"
        ]
      }
    ]
  },
  {
    "id": "t3_fish_tray_week",
    "name": "Fish Tray Week (White Fish → Salmon Upgrade)",
    "cooking_style": "batch",
    "cost_level": 2,
    "proteins": {
      "primary": "fish",
      "secondary": "seafood"
    },
    "tags": {
      "proteins": [
        "fish"
      ],
      "contains": [
        "seafood"
      ]
    },
    "portions": {
      "main_meals": 4,
      "extras": "+ sauce jar"
    },
    "cleanup_score": 9,
    "hands_on_minutes": 25,
    "total_sunday_minutes": 75,
    "station": {
      "tools": [
        "1 sheet pan",
        "bowl for veg",
        "small bowl for sauce",
        "spatula"
      ],
      "containers": [
        "5 meal boxes",
        "1 sauce jar"
      ],
      "order": [
        "Preheat hot oven",
        "Veg starts first",
        "Fish last 10–15 min",
        "Sauce while fish bakes",
        "Pack gently"
      ]
    },
    "outputs": [
      {
        "label": "Baked fish portions",
        "amount": "4–6 servings"
      },
      {
        "label": "Tray vegetables",
        "amount": "~700–1000 g"
      }
    ],
    "sunday_timeline": [
      {
        "t": "0–10 min",
        "title": "Prep & heat",
        "quick": [
          "Oven 210°C (fan 200°C)",
          "Season veg",
          "Season fish"
        ],
        "detailed": [
          "Preheat 210°C (fan 200°C).",
          "Veg: oil + salt + pepper; spread one layer.",
          "Fish: pat dry; salt + pepper; lemon zest optional.",
          "If salmon: lighter seasoning; it’s rich."
        ],
        "cues": [
          "Fish done when opaque + flakes easily. Salmon can be slightly translucent center."
        ],
        "pitfalls": [
          "Crowded tray steams veg.",
          "Moving fish too early breaks it."
        ],
        "pack": [
          "Keep sauce separate; fish reheats gently."
        ]
      },
      {
        "t": "10–55 min",
        "title": "Veg then fish",
        "quick": [
          "Roast veg 25–35",
          "Fish last 10–15",
          "Rest 2 min"
        ],
        "detailed": [
          "Roast veg until browned edges.",
          "Make space for fish or use second tray.",
          "Bake fish 10–15 min depending thickness.",
          "Rest fish 2 min before lifting."
        ],
        "cues": [
          "White fish flakes with gentle pressure."
        ],
        "pitfalls": [
          "Overcooked fish = dry chalk."
        ],
        "pack": [
          "Eat fish meals earlier in week (best texture)."
        ]
      },
      {
        "t": "55–75 min",
        "title": "Sauce & pack",
        "quick": [
          "Mix quick sauce",
          "Pack gently",
          "Cool then seal"
        ],
        "detailed": [
          "Sauce A: yogurt + lemon + garlic + dill.",
          "Sauce B: soy + lemon + tiny honey + ginger.",
          "Pack fish on top of veg; sauce in jar.",
          "Cool 10–15 min before sealing."
        ],
        "cues": [
          "Sauce should taste slightly stronger than perfect (it mellows)."
        ],
        "pitfalls": [
          "Sauce in same box = soggy veg."
        ],
        "pack": [
          "Reheat fish short bursts; don’t nuke it."
        ]
      }
    ],
    "derived": [
      {
        "title": "🥗 Salad bowl",
        "how": [
          "Cold fish flakes + greens",
          "Sauce as dressing"
        ]
      },
      {
        "title": "🍚 Bowl",
        "how": [
          "Rice + fish + veg",
          "Sauce drizzle"
        ]
      }
    ]
  },
  {
    "id": "t4_lentil_chili_week",
    "name": "Lentil Chili Week (1 Pot + Freezer Friendly)",
    "cooking_style": "freeze",
    "cost_level": 1,
    "proteins": {
      "primary": "vegetarian",
      "secondary": null
    },
    "tags": {
      "proteins": [
        "vegetarian"
      ],
      "contains": []
    },
    "portions": {
      "main_meals": 6,
      "extras": "+ 2–4 freezer portions"
    },
    "cleanup_score": 10,
    "hands_on_minutes": 20,
    "total_sunday_minutes": 70,
    "station": {
      "tools": [
        "1 big pot",
        "spoon",
        "knife + board",
        "ladle"
      ],
      "containers": [
        "6 meal boxes",
        "2–4 freezer tubs (optional)"
      ],
      "order": [
        "Chop",
        "Sweat onion",
        "Bloom spices",
        "Add lentils+tomatoes",
        "Simmer",
        "Portion+freeze"
      ]
    },
    "outputs": [
      {
        "label": "Chili / stew pot",
        "amount": "~2.5–3.5 liters"
      }
    ],
    "sunday_timeline": [
      {
        "t": "0–10 min",
        "title": "Base build",
        "quick": [
          "Sweat onion",
          "Bloom spices",
          "Start pot"
        ],
        "detailed": [
          "Chop onion small (disappears).",
          "Oil + onion + pinch of salt, 5–7 min translucent.",
          "Add garlic/spices 30 sec (fragrant).",
          "Optional: tomato paste 1 min (richer)."
        ],
        "cues": [
          "Onion smells sweet, not raw."
        ],
        "pitfalls": [
          "Burnt garlic = bitter pot."
        ],
        "pack": [
          "Containers ready — this is a lot."
        ]
      },
      {
        "t": "10–60 min",
        "title": "Simmer to thick",
        "quick": [
          "Gentle simmer",
          "Stir near end",
          "Adjust thickness"
        ],
        "detailed": [
          "Add lentils + tomatoes + water/stock (cover by 2–3 cm).",
          "Bring to gentle simmer; cook 30–45 min.",
          "Stir more near end (prevents sticking).",
          "Adjust: add water or simmer longer."
        ],
        "cues": [
          "Lentils tender; sauce coats spoon."
        ],
        "pitfalls": [
          "Hard boil can make mush.",
          "Not stirring near end scorches."
        ],
        "pack": [
          "Aim thicker if freezing (reheat loosens)."
        ]
      },
      {
        "t": "60–70 min",
        "title": "Taste & portion",
        "quick": [
          "Taste",
          "Portion",
          "Freeze extras"
        ],
        "detailed": [
          "Taste salt first, then acid (lemon/vinegar) if dull.",
          "Portion into boxes; freeze 2–4 singles.",
          "Label lids (date)."
        ],
        "cues": [
          "Flavor slightly stronger than perfect (chilling mutes)."
        ],
        "pitfalls": [
          "Sealing hot = condensation soup."
        ],
        "pack": [
          "Cool 15–20 min, then seal."
        ]
      }
    ],
    "derived": [
      {
        "title": "🍝 Pasta night",
        "how": [
          "Chili as sauce",
          "Cheese optional"
        ]
      },
      {
        "title": "🥔 Loaded potato",
        "how": [
          "Chili on potato",
          "Comfort mode"
        ]
      }
    ]
  },
  {
    "id": "t5_chicken_thighs_sheetpan",
    "name": "Chicken Thighs Sheet‑Pan Week (Juicy + Forgiving)",
    "cooking_style": "batch",
    "cost_level": 2,
    "proteins": {
      "primary": "chicken",
      "secondary": null
    },
    "tags": {
      "proteins": [
        "chicken"
      ],
      "contains": []
    },
    "portions": {
      "main_meals": 6,
      "extras": null
    },
    "cleanup_score": 9,
    "hands_on_minutes": 25,
    "total_sunday_minutes": 80,
    "station": {
      "tools": [
        "1 large sheet pan",
        "bowl for veg",
        "tongs",
        "thermometer (optional)"
      ],
      "containers": [
        "6 meal boxes",
        "1 sauce jar (optional)"
      ],
      "order": [
        "Preheat hot",
        "Veg on tray",
        "Thighs skin-up",
        "Roast 45–60",
        "Rest",
        "Pack"
      ]
    },
    "outputs": [
      {
        "label": "Cooked chicken thighs",
        "amount": "5–7 servings"
      },
      {
        "label": "Tray vegetables",
        "amount": "~900–1300 g"
      }
    ],
    "sunday_timeline": [
      {
        "t": "0–10 min",
        "title": "Prep & heat",
        "quick": [
          "Oven 210°C",
          "Season veg",
          "Season thighs"
        ],
        "detailed": [
          "Preheat 210°C (fan 200°C).",
          "Veg: oil + salt + pepper, spread one layer.",
          "Thighs: pat dry, season generously; skin-side up.",
          "Optional: paprika/garlic powder."
        ],
        "cues": [
          "Skin browns; thighs stay juicy."
        ],
        "pitfalls": [
          "Wet thighs = pale skin.",
          "Crowded tray steams veg."
        ],
        "pack": [
          "Containers out while oven heats."
        ]
      },
      {
        "t": "10–70 min",
        "title": "Roast",
        "quick": [
          "Roast 45–60",
          "Turn veg once",
          "Check doneness"
        ],
        "detailed": [
          "Roast 45–60 min; turn veg at ~30–35 min.",
          "Doneness cue: juices clear near bone.",
          "Thermometer: 74°C+ thickest part.",
          "If skin pale: broil 2–3 min at end (watch!)."
        ],
        "cues": [
          "Juices clear; skin golden."
        ],
        "pitfalls": [
          "Broil burns fast.",
          "Cutting too early leaks juices."
        ],
        "pack": [
          "Rest 5–10 min before packing."
        ]
      },
      {
        "t": "70–80 min",
        "title": "Pack",
        "quick": [
          "Portion",
          "Cool briefly",
          "Seal"
        ],
        "detailed": [
          "Pack 1–2 thighs + veg per box.",
          "Keep some for wraps/salads.",
          "Cool briefly before sealing."
        ],
        "cues": [
          "Veg browned edges."
        ],
        "pitfalls": [
          "Packing skin-down makes soggy skin."
        ],
        "pack": [
          "Reheat in oven/airfryer for crispy skin."
        ]
      }
    ],
    "derived": [
      {
        "title": "🥪 Wrap",
        "how": [
          "Shredded thigh + sauce",
          "Wrap + greens"
        ]
      },
      {
        "title": "🍚 Bowl",
        "how": [
          "Rice + thigh + veg",
          "Dressing"
        ]
      }
    ]
  },
  {
    "id": "t6_minced_meat_base_week",
    "name": "Minced Meat Base Week (Sauce That Becomes 5 Dinners)",
    "cooking_style": "mixed",
    "cost_level": 2,
    "proteins": {
      "primary": "beef",
      "secondary": "pork"
    },
    "tags": {
      "proteins": [
        "beef",
        "pork"
      ],
      "contains": []
    },
    "portions": {
      "main_meals": 6,
      "extras": "+ optional cooked carbs"
    },
    "cleanup_score": 8,
    "hands_on_minutes": 30,
    "total_sunday_minutes": 75,
    "station": {
      "tools": [
        "1 large pan",
        "spatula",
        "knife + board",
        "pot (optional carbs)"
      ],
      "containers": [
        "6 meal boxes",
        "1 carb box (optional)"
      ],
      "order": [
        "Sweat onion",
        "Brown meat",
        "Build base sauce",
        "Simmer",
        "Portion",
        "Optional carbs 2–3 days"
      ]
    },
    "outputs": [
      {
        "label": "Cooked minced base",
        "amount": "~1.2–1.8 kg"
      }
    ],
    "sunday_timeline": [
      {
        "t": "0–10 min",
        "title": "Brown properly",
        "quick": [
          "Pan hot",
          "Brown mince",
          "Don’t crowd"
        ],
        "detailed": [
          "Chop onion small.",
          "Heat pan hot; oil; onion + pinch salt 3–5 min.",
          "Add mince in single layer; let it brown before stirring.",
          "Break up and brown until no pink and some dark bits."
        ],
        "cues": [
          "Dark bits = flavor (good)."
        ],
        "pitfalls": [
          "Crowded pan steams meat.",
          "Constant stirring prevents browning."
        ],
        "pack": [
          "Containers out — base becomes many meals."
        ]
      },
      {
        "t": "10–50 min",
        "title": "Build base",
        "quick": [
          "Spices",
          "Sauce base",
          "Simmer"
        ],
        "detailed": [
          "Add spices (paprika/cumin/pepper) 30 sec.",
          "Add tomatoes/tomato paste OR neutral base; simmer 10–15.",
          "Taste for salt; adjust thickness.",
          "Keep flavor neutral so it morphs later."
        ],
        "cues": [
          "Sauce coats spoon, not watery."
        ],
        "pitfalls": [
          "Too much liquid = soup base."
        ],
        "pack": [
          "Portion some 'plain' for sandwiches/wraps."
        ]
      },
      {
        "t": "50–75 min",
        "title": "Portion + carbs",
        "quick": [
          "Portion base",
          "Optional carbs",
          "Cool + seal"
        ],
        "detailed": [
          "Portion into boxes.",
          "Optional: cook rice/pasta for only 2–3 days (texture).",
          "Cool before sealing; freeze 1–2 portions if desired."
        ],
        "cues": [
          "Smells rich, not raw onion."
        ],
        "pitfalls": [
          "Pasta 7 days = sadness by Thursday."
        ],
        "pack": [
          "Add pickles/herbs at serving to make it feel new."
        ]
      }
    ],
    "derived": [
      {
        "title": "🍝 Pasta",
        "how": [
          "Base + pasta",
          "Cheese optional"
        ]
      },
      {
        "title": "🥣 Soup starter",
        "how": [
          "Base + water + veg",
          "Quick soup"
        ]
      }
    ]
  },
  {
    "id": "t7_soup_first_week",
    "name": "Soup‑First Week (Big Pot + Sandwich Nights)",
    "cooking_style": "batch",
    "cost_level": 1,
    "proteins": {
      "primary": "chicken",
      "secondary": null
    },
    "tags": {
      "proteins": [
        "chicken"
      ],
      "contains": [
        "broth"
      ]
    },
    "portions": {
      "main_meals": 5,
      "extras": "+ broth jar"
    },
    "cleanup_score": 10,
    "hands_on_minutes": 25,
    "total_sunday_minutes": 90,
    "station": {
      "tools": [
        "1 big pot",
        "ladle",
        "knife + board",
        "strainer optional"
      ],
      "containers": [
        "5 meal boxes",
        "1 broth jar"
      ],
      "order": [
        "Start pot",
        "Gentle simmer",
        "Add starch late",
        "Season at end",
        "Portion",
        "Jar broth"
      ]
    },
    "outputs": [
      {
        "label": "Soup pot",
        "amount": "~2.5–4 liters"
      },
      {
        "label": "Broth jar",
        "amount": "~0.5–1 liter"
      }
    ],
    "sunday_timeline": [
      {
        "t": "0–15 min",
        "title": "Start pot",
        "quick": [
          "Chicken + water",
          "Gentle simmer",
          "Skim optional"
        ],
        "detailed": [
          "Add chicken + veg + cold water to cover.",
          "Bring to gentle simmer (not hard boil).",
          "Skim foam if you want clearer broth (optional).",
          "Salt lightly now; finish later."
        ],
        "cues": [
          "Small bubbles = clearer broth."
        ],
        "pitfalls": [
          "Hard boil dries meat and clouds broth."
        ],
        "pack": [
          "Containers out; soup volume is real."
        ]
      },
      {
        "t": "15–80 min",
        "title": "Simmer & build",
        "quick": [
          "Simmer 60–75",
          "Add starch late",
          "Taste"
        ],
        "detailed": [
          "Simmer 60–75 min until chicken tender.",
          "Add noodles/rice in last 10–12 min to avoid mush.",
          "Taste and adjust salt at end.",
          "Jar 0.5–1L broth for weekday upgrades."
        ],
        "cues": [
          "Chicken pulls apart easily."
        ],
        "pitfalls": [
          "Overcooked noodles turn mush."
        ],
        "pack": [
          "Cool slightly before sealing."
        ]
      },
      {
        "t": "80–90 min",
        "title": "Portion",
        "quick": [
          "Portion soup",
          "Jar broth",
          "Seal after cooling"
        ],
        "detailed": [
          "Portion into boxes; broth in jar.",
          "Cool uncovered 10–15 min, then cover.",
          "Freeze 1–2 portions if needed."
        ],
        "cues": [
          "Smells like comfort, not raw onion."
        ],
        "pitfalls": [
          "Sealing hot causes condensation."
        ],
        "pack": [
          "Reheat to simmer, not aggressive boil."
        ]
      }
    ],
    "derived": [
      {
        "title": "🥪 Sandwich night",
        "how": [
          "Soup + sandwich",
          "Fast comfort"
        ]
      },
      {
        "title": "🍚 Soup bowl",
        "how": [
          "Soup over rice",
          "More filling"
        ]
      }
    ]
  }
];

// ------------------------------
// Tabs + checklist + timer
// ------------------------------

function setActiveTab(tabId){
  document.querySelectorAll('.tabbtn').forEach(b=>{
    const is = b.getAttribute('data-tab')===tabId;
    b.classList.toggle('active', is);
    b.setAttribute('aria-selected', is ? 'true' : 'false');
  });
  document.querySelectorAll('.tabpane').forEach(p=>{
    const is = p.id===tabId;
    p.classList.toggle('active', is);
    p.hidden = !is;
  });
}

function todayKey(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const da = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${da}`;
}

function checklistStorageKey(tplId){
  return `colf_check_${tplId}_${todayKey()}`;
}

function loadChecklistState(tplId){
  try{
    const raw = localStorage.getItem(checklistStorageKey(tplId));
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}

function saveChecklistState(tplId, state){
  try{ localStorage.setItem(checklistStorageKey(tplId), JSON.stringify(state||{})); }catch(e){}
}

function strHash(s){
  // Small deterministic hash for ids (not crypto, just stable).
  let h = 2166136261;
  for(let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h>>>0).toString(16);
}

function renderPrepIngredients(tpl, shopping, meals){
  const wrap = document.querySelector('#prepIngredients');
  if(!wrap) return;

  const totalsProtein = sumKg(shopping.protein);
  const totalsVeg = sumKg(shopping.veg);
  const totalLine = (label, tot)=> tot ? `<div class="prepSmall">≈ ${label}: ${tot.min}–${tot.max} kg</div>` : "";

  const cats = [
    ["Protein", "protein"],
    ["Veg", "veg"],
    ["Pantry", "pantry"],
    ["Optional", "optional"],
  ];

  wrap.innerHTML = `
    <div class="prepSmall" style="margin-top:4px"><strong>Scale:</strong> ${meals} meals • <strong>Template:</strong> ${tpl.name}</div>
    <div class="prepGrid">
      ${cats.map(([title,key])=>{
        const items = (shopping[key]||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('');
        const tot = key==="protein" ? totalsProtein : key==="veg" ? totalsVeg : null;
        return `
          <div class="prepCat">
            <h4>${title}</h4>
            <ul>${items || "<li class='muted'>—</li>"}</ul>
            ${totalLine(title.toLowerCase(), tot)}
          </div>`;
      }).join('')}
    </div>
  `;

  // Copy button
  const btn = document.querySelector('#copyPrep');
  if(btn){
    btn.onclick = async ()=>{
      const lines = [];
      lines.push(`${tpl.name} — Prep ingredients (${meals} meals)`);
      lines.push('');
      cats.forEach(([title,key])=>{
        lines.push(title+':');
        (shopping[key]||[]).forEach(x=>lines.push(`- ${x}`));
        lines.push('');
      });
      const text = lines.join('\n');
      try{
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Copied ✓';
        setTimeout(()=>btn.textContent='Copy list', 1200);
      }catch(e){
        alert('Copy failed — your browser blocked it.');
      }
    };
  }
}

function renderCookChecklist(tpl){
  const wrap = document.querySelector('#cookChecklist');
  if(!wrap) return;
  const timeline = tpl.sunday_timeline || [];
  const key = tpl._renderId || tpl.id;
  const state = loadChecklistState(key);

  const groups = timeline
    .map((stage, idx)=>({
      idx,
      title: `${stage.t} — ${stage.title || ''}`.trim(),
      items: (stage.quick || []).slice()
    }))
    .filter(g=>g.items.length);

  if(!groups.length){
    wrap.innerHTML = `<div class="muted">No checklist items for this template yet. (Add “quick” steps to its timeline and this will auto-populate.)</div>`;
    return;
  }

  wrap.innerHTML = groups.map(g=>{
    const itemsHtml = g.items.map((txt)=>{
      const id = `ck_${strHash(key+'|'+g.idx+'|'+txt)}`;
      const checked = !!state[id];
      return `
        <label class="checkItem">
          <input type="checkbox" data-ck="${id}" ${checked ? 'checked' : ''} />
          <span class="checkText ${checked ? 'checkDone' : ''}">${escapeHtml(txt)}</span>
        </label>
      `;
    }).join('');
    return `
      <div class="checkGroup">
        <h4>${escapeHtml(g.title)}</h4>
        ${itemsHtml}
      </div>
    `;
  }).join('');

  // Wire changes
  wrap.querySelectorAll('input[type="checkbox"][data-ck]').forEach(cb=>{
    cb.addEventListener('change', ()=>{
      const id = cb.getAttribute('data-ck');
      state[id] = cb.checked;
      saveChecklistState(key, state);
      const text = cb.closest('.checkItem')?.querySelector('.checkText');
      if(text) text.classList.toggle('checkDone', cb.checked);
    });
  });

  // Bulk actions
  const setAll = (val)=>{
    wrap.querySelectorAll('input[type="checkbox"][data-ck]').forEach(cb=>{
      cb.checked = val;
      const id = cb.getAttribute('data-ck');
      state[id] = val;
      const text = cb.closest('.checkItem')?.querySelector('.checkText');
      if(text) text.classList.toggle('checkDone', val);
    });
    saveChecklistState(key, state);
  };

  const checkAllBtn = document.querySelector('#checkAll');
  const uncheckAllBtn = document.querySelector('#uncheckAll');
  const resetTodayBtn = document.querySelector('#resetToday');
  if(checkAllBtn) checkAllBtn.onclick = ()=> setAll(true);
  if(uncheckAllBtn) uncheckAllBtn.onclick = ()=> setAll(false);
  if(resetTodayBtn) resetTodayBtn.onclick = ()=>{
    try{ localStorage.removeItem(checklistStorageKey(tpl.id)); }catch(e){}
    renderCookChecklist(tpl);
  };
}

function escapeHtml(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

function wireTimer(){
  const disp = document.querySelector('#timerDisplay');
  const stateLbl = document.querySelector('#timerState');
  const btnStart = document.querySelector('#timerStart');
  const btnPause = document.querySelector('#timerPause');
  const btnReset = document.querySelector('#timerReset');
  const soundChk = document.querySelector('#timerSound');
  const testBtn = document.querySelector('#timerTestSound');
  const alarmAudio = document.querySelector('#alarmAudio');
  if(!disp || !btnStart || !btnPause || !btnReset) return;

  let seconds = 0;
  let running = false;
  let t = null;

  // UI logic: checkbox means "Disable sound".
  // Unchecked => sound allowed (subject to browser autoplay rules).
  const canPlaySound = ()=> !!(alarmAudio && !(soundChk?.checked));
  const unlockSound = ()=>{
    if(!alarmAudio) return;
    const prevVol = alarmAudio.volume;
    alarmAudio.volume = 0.01;
    alarmAudio.currentTime = 0;
    alarmAudio.play().then(()=>{
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
      alarmAudio.volume = prevVol;
    }).catch(()=>{ alarmAudio.volume = prevVol; });
  };
  const ring = ()=>{
    if(!canPlaySound()) return;
    try{ alarmAudio.currentTime = 0; alarmAudio.play(); }catch(e){}
  };

  if(testBtn){
    testBtn.onclick = ()=>{
      // Testing sound should also "unlock" audio on strict browsers.
      if(soundChk) soundChk.checked = false; // ensure sound isn't disabled
      unlockSound();
      setTimeout(()=>ring(), 150);
    };
  }
  if(soundChk){
    // If user just enabled sound (unchecked), try to unlock.
    soundChk.addEventListener('change', ()=>{ if(!soundChk.checked) unlockSound(); });
  }

  const fmt = (s)=>{
    const mm = String(Math.floor(s/60)).padStart(2,'0');
    const ss = String(Math.floor(s%60)).padStart(2,'0');
    return `${mm}:${ss}`;
  };
  const render = ()=>{ disp.textContent = fmt(seconds); };
  const setState = (txt)=>{ if(stateLbl) stateLbl.textContent = txt; };

  const stop = ()=>{ if(t){ clearInterval(t); t=null; } running=false; };

  btnStart.onclick = ()=>{
    if(running) return;
    if(seconds<=0){ setState('Pick a time'); return; }
    running = true;
    setState('Running');
    t = setInterval(()=>{
      seconds = Math.max(0, seconds-1);
      render();
      if(seconds===0){
        stop();
        setState('Done ✓');
        ring();
        try{ navigator.vibrate?.([120,60,120]); }catch(e){}
      }
    }, 1000);
  };
  btnPause.onclick = ()=>{ stop(); setState('Paused'); };
  btnReset.onclick = ()=>{ stop(); seconds=0; render(); setState('Ready'); };

  document.querySelectorAll('.quickTimes .pill[data-min]').forEach(p=>{
    p.addEventListener('click', ()=>{
      stop();
      seconds = parseInt(p.getAttribute('data-min'),10)*60;
      render();
      setState('Ready');
    });
  });

  render();
}

// Merge old “missing bits” (shopping/storage) onto the new templates.
TEMPLATES.forEach(t=>{
  const extra = TEMPLATE_EXTRAS[t.id];
  if(extra) Object.assign(t, extra);
});


// --- UI state
let lastPlanId = null;
let selectedFlavor = "neutral";
let selectedMeals = 6;

function status(msg){ $("#status").textContent = msg || ""; }

function wirePills(containerSel, dataAttr, onChange){
  const wrap = $(containerSel);
  if(!wrap) return;
  wrap.querySelectorAll(".pill").forEach(p=>{
    p.addEventListener("click", ()=>{
      wrap.querySelectorAll(".pill").forEach(x=>x.classList.remove("active"));
      p.classList.add("active");
      onChange?.(p.getAttribute(dataAttr));
    });
  });
}
function getActivePillValue(containerSel, dataAttr, fallback){
  const p = document.querySelector(`${containerSel} .pill.active`);
  return p?.getAttribute(dataAttr) ?? fallback;
}

// --- Scaling helpers (kept intentionally forgiving; we only scale quantities with units)
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function roundNice(n){
  // Keep 1 decimal for small numbers, whole for bigger ones
  if(!isFinite(n)) return n;
  if(n < 10) return Math.round(n*10)/10;
  return Math.round(n);
}
function scaleRangeText(str, mult){
  if(!str || mult===1) return str;
  // Don’t ever touch temps (e.g., 210°C)
  if(/\d\s*°\s*C/i.test(str)) return str;

  const unitRe = "(?:kg|g|ml|l|L|liters?|cloves|cans|jar|jars|eggs|pcs|pieces)";

  // 1) Ranges with units: 1.2–1.8 kg
  str = str.replace(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*[–-]\\s*(\\d+(?:\\.\\d+)?)\\s*(${unitRe})`,"gi"),
    (_,a,b,u)=> `${roundNice(parseFloat(a)*mult)}–${roundNice(parseFloat(b)*mult)} ${u}`);

  // 2) Single with units: 700 g
  str = str.replace(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${unitRe})`,"gi"),
    (m,a,u)=> {
      // Avoid double-scaling when the previous range replacement already added a space
      if(m.includes("–")) return m;
      return `${roundNice(parseFloat(a)*mult)} ${u}`;
    });

  // 3) Count ranges without units but with a hint word later: eggs (10–12)
  str = str.replace(/\((\d+)\s*[–-]\s*(\d+)\)/g, (m,a,b)=> `(${Math.round(parseInt(a,10)*mult)}–${Math.round(parseInt(b,10)*mult)})`);

  return str;
}

function scaleList(list, mult){
  return (list||[]).map(x=>scaleRangeText(String(x), mult));
}

function sumKg(list){
  // Rough totals for display. Reads ranges like “1–1.5 kg” or “500–700 g”.
  let min=0, max=0;
  (list||[]).forEach(item=>{
    const s=String(item);
    const mRange = s.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*(kg|g)\b/i);
    const mSingle = s.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/i);
    const add = (a,b,unit)=>{
      let amin=parseFloat(a), amax=parseFloat(b);
      if(unit.toLowerCase()==="g"){ amin/=1000; amax/=1000; }
      min+=amin; max+=amax;
    };
    if(mRange){ add(mRange[1], mRange[2], mRange[3]); return; }
    if(mSingle){
      const v=parseFloat(mSingle[1]);
      const unit=mSingle[2];
      add(v, v, unit);
    }
  });
  if(max<=0) return null;
  return {min: roundNice(min), max: roundNice(max)};
}

function getConstraints(){
  return {
    noPork: !!$("#noPorkToggle")?.checked,
    noBeef: !!$("#noBeefToggle")?.checked,
    noFish: !!$("#noFishToggle")?.checked,
  };
}
function getPrefs(){
  return {
    protein: getActivePillValue("#proteinPills","data-protein","any"),
    budget: parseInt(getActivePillValue("#budgetPills","data-budget","2"),10),
    mode: getActivePillValue("#modePills","data-mode","batch"),
    kitchen: getActivePillValue("#kitchenPills","data-kitchen","smart"),
  };
}


function allowedByConstraints(tpl){
  const c = getConstraints();
  const proteins = getTemplateProteins(tpl);
  const contains = (tpl.tags?.contains || []).map(x=>String(x).toLowerCase());

  if(c.noPork && proteins.includes("pork")) return false;
  if(c.noBeef && proteins.includes("beef")) return false;
  if(c.noFish && (proteins.includes("fish") || contains.includes("seafood") || proteins.includes("seafood"))) return false;

  return true;
}

function getTemplateProteins(tpl){
  // For slot-variants we store the chosen protein on the virtual template.
  const p = tpl._protein ? [tpl._protein] : (tpl.tags?.proteins || []);
  return (p || []).map(x=>String(x).toLowerCase());
}

function expandSlotTemplates(pool){
  // Turn a single slot workflow into multiple virtual candidates.
  const out = [];
  for(const tpl of pool){
    if(tpl.workflow === "slots" && Array.isArray(tpl.slot_proteins) && tpl.slot_proteins.length){
      for(const protein of tpl.slot_proteins){
        if(!proteinAllowed(protein)) continue;
        out.push({
          ...tpl,
          id: `${tpl.id}__${protein}`,
          _baseId: tpl.id,
          _protein: protein,
          // Make the title clearer to the user.
          name: `${tpl.name} — ${PROTEIN_PROFILES[protein]?.name || protein}`,
          tags: { ...(tpl.tags||{}), proteins: [protein] },
        });
      }
    }else{
      out.push(tpl);
    }
  }
  return out;
}

function templateScore(tpl){
  const prefs = getPrefs();
  const proteins = getTemplateProteins(tpl);
  let score = 0;

  // Budget alignment (soft)
  const c = parseInt(tpl.cost_level || 2, 10);
  if(c === prefs.budget) score += 2;
  else if(Math.abs(c - prefs.budget) === 1) score += 1;
  else score -= 1;

  // Mode bias (soft)
  if(tpl.cooking_style === prefs.mode) score += 2;

  // Protein vibe (strong)
  if(prefs.protein !== "any"){
    if(proteins.includes(prefs.protein)) score += 5;
    else score -= 4;
  }

  // tiny bonus for high cleanup score
  score += Math.round((tpl.cleanup_score || 8) / 5);

  // small randomness so it doesn't feel stuck
  score += (Math.random() * 0.4);

  return score;
}

function pickTemplate(pool){
  const scored = pool.map(t=>({t, s: templateScore(t)})).sort((a,b)=>b.s-a.s);
  return scored[0]?.t || null;
}

function buildPlan(){
  const basePool = TEMPLATES.filter(allowedByConstraints);
  const pool = expandSlotTemplates(basePool);
  if(!pool.length){
    status("No templates match your constraints. Try relaxing a toggle.");
    return;
  }
  const tpl = pickTemplate(pool);
  if(!tpl) return;
  lastPlanId = tpl.id;
  saveLastPlanState({
    id: tpl.id,
    baseId: tpl._baseId || null,
    protein: tpl._protein || null,
    flavor: selectedFlavor,
    meals: selectedMeals,
    prefs: getPrefs(),
  });
  renderTemplate(tpl);
}

// --- Persist last plan including slot-variants (so “Run last Sunday again” works)
function saveLastPlanState(state){
  try{ localStorage.setItem("colf_lastPlanState", JSON.stringify(state)); }catch(e){}
  // Backwards compat for old builds:
  try{ localStorage.setItem("colf_lastPlanId", state?.id || ""); }catch(e){}
}
function loadLastPlanState(){
  try{
    const raw = localStorage.getItem("colf_lastPlanState");
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

function compileSlotWorkflow(tpl, meals){
  // Currently we implement slot logic for One‑Pot Base. Easy to extend later.
  const prefs = getPrefs();
  const protein = tpl._protein || "chicken";
  const profile = PROTEIN_PROFILES[protein] || PROTEIN_PROFILES.chicken;
  const baseMeals = Number(tpl.portions?.main_meals || 6);
  const mult = baseMeals ? (meals / baseMeals) : 1;

  // Timing & timeline rules by protein.
  const isFish = protein === "fish";
  const isBeef = protein === "beef";
  const isVeg  = protein === "vegetarian";

  // Sunday minutes (rough but honest): fish is faster, beef is longer.
  let total = tpl.total_sunday_minutes || 75;
  if(isFish) total = 55;
  if(isBeef) total = 110;
  if(isVeg) total = 70;

  let hands = tpl.hands_on_minutes || 25;
  if(isBeef) hands = 35;

  // Outputs (very approximate, scaled)
  const outputs = [];
  const potYield = isFish ? "~1.8–2.4 L" : isBeef ? "~2.2–3.0 L" : "~2.0–2.8 L";
  outputs.push({ label: "One‑pot base (stew/soup)", amount: scaleRangeText(potYield, mult) });
  outputs.push({ label: "Meals covered", amount: `${meals} portions` });
  if(profile.freezer?.rating === "great" || profile.freezer?.rating === "good"){
    outputs.push({ label: "Freezer option", amount: "Freeze 1–2 portions (optional)" });
  }

  // Shopping (core) — protein options based on budget tier, plus cheap veg body.
  const budget = clamp(parseInt(prefs.budget||2,10),1,3);
  const proteinOptions = (profile.budget_options?.[budget] || profile.budget_options?.[2] || []).map(x=>scaleRangeText(x, mult));
  const vegBody = [
    `onions (1–2)`,
    `carrots (2–4)`,
    `celery (optional)`,
    `garlic (optional)`,
    `potatoes OR rice OR lentils (choose 1)`
  ].map(x=>scaleRangeText(x, mult));
  const pantry = [
    "oil",
    "salt + pepper",
    "stock cube (optional)",
    ...(FLAVORS[selectedFlavor]?.adds || [])
  ];
  const optional = [
    "lemon (or vinegar)",
    "fresh herbs",
    ...(FLAVORS[selectedFlavor]?.optional || [])
  ];

  // Storage rules (profile + sane defaults)
  const fridgeDays = {
    base: isFish ? "2" : (isBeef ? "4" : "3"),
  };
  const freezerNotes = [
    ...(profile.freezer?.notes || []),
    "Freeze flat if possible (faster, stacks better)."
  ];
  const storage = {
    fridge_days: fridgeDays,
    freezer: freezerNotes,
    label_tip: "Label with date + protein (future-you will not remember)."
  };

  // Timeline by protein behavior
  const timeline = [];
  timeline.push({
    t: "0–10 min",
    title: "Base prep",
    quick: [
      "Chop onion + carrot (and celery if using)",
      "Heat pot with a little oil",
      "Salt your base veg lightly"
    ],
    detailed: [
      "Cut veg evenly so everything finishes together.",
      "A pinch of salt early helps flavor the whole pot." 
    ],
    pitfalls: ["Don’t rush the first 10 minutes — this is where flavor comes from."]
  });

  if(isBeef){
    timeline.push({
      t: "10–25 min",
      title: "Brown the beef",
      quick: ["Brown beef in batches", "Add spices / tomato paste (optional)"],
      detailed: ["Browning = depth. If the pot is wet, you’re steaming — use batches."],
      pitfalls: ["Overcrowding the pot."]
    });
    timeline.push({
      t: "25–110 min",
      title: "Long simmer",
      quick: ["Add water/stock + veg body", "Simmer gently until tender"],
      detailed: ["Gentle bubbles, not a hard boil.", "Tender beef = time, not heat."],
      cues: ["Beef breaks with a spoon."],
      pack: ["Taste, adjust salt, pack portions (freeze 1–2 if you want)."]
    });
  } else if(isFish){
    timeline.push({
      t: "10–30 min",
      title: "Build the broth",
      quick: ["Soften base veg", "Add water/stock + potatoes/rice (if using)", "Simmer"],
      detailed: ["Keep it gentle. Strong boiling can break fish later."],
      cues: ["Potatoes tender (if used)."],
    });
    timeline.push({
      t: "30–45 min",
      title: "Add fish (late)",
      quick: ["Add fish pieces", "Simmer 8–12 minutes", "Finish with lemon/herbs"],
      detailed: ["Fish goes in at the end — it stays juicy.", "Don’t stir aggressively; fold gently."],
      cues: ["Fish flakes easily."],
      pack: ["Pack portions. Eat fish meals earlier in the week if you can."]
    });
  } else if(isVeg){
    timeline.push({
      t: "10–45 min",
      title: "Simmer the base",
      quick: ["Add lentils/beans + veg body", "Simmer until tender", "Finish seasoning"],
      detailed: ["Lentils give body. Beans give comfort.", "Add acid (lemon/vinegar) at the end."],
      cues: ["Lentils tender."],
      pack: ["Pack portions. This freezes very well."]
    });
  } else {
    timeline.push({
      t: "10–55 min",
      title: "Simmer",
      quick: ["Add chicken + veg body", "Simmer 25–40 minutes", "Finish seasoning"],
      detailed: ["Thighs are forgiving. Breast cooks faster.", "Skim foam if needed."],
      cues: ["Chicken easily shreds."],
      pack: ["Pack portions. Freeze 1–2 portions if you want."]
    });
  }

  // Derived meals (assembly ideas)
  const derived = [
    { title: "Bowl", how: ["Serve over rice or potatoes.", "Add a dollop of yogurt or a splash of lemon."] },
    { title: "Loaded soup", how: ["Add frozen spinach at reheat.", "Finish with herbs or chili."] },
    { title: "Bread night", how: ["Serve with bread/toast.", "Optional: sprinkle cheese (if you do dairy)."] },
  ];

  return {
    ...tpl,
    total_sunday_minutes: total,
    hands_on_minutes: hands,
    outputs,
    shopping_core: { protein: proteinOptions, veg: vegBody, pantry, optional },
    storage,
    sunday_timeline: timeline,
    derived,
  };
}

function compileTemplateForRender(tpl, meals){
  if(tpl.workflow === "slots" || tpl._baseId){
    const base = tpl._baseId ? (TEMPLATES.find(t=>t.id===tpl._baseId) || tpl) : tpl;
    return compileSlotWorkflow({ ...base, _renderId: tpl.id, _protein: tpl._protein, id: base.id, name: tpl.name, tags: tpl.tags, _baseId: tpl._baseId, _protein: tpl._protein }, meals);
  }
  return tpl;
}

function getBudgetLabel(level){
  return level===1 ? "💰 Cheap" : level===3 ? "💰💰💰 Premium" : "💰💰 Normal";
}
function getModeLabel(mode){
  return mode==="mixed" ? "🥘 Mixed" : mode==="freeze" ? "🧊 Freeze" : "🫕 Batch";
}

function renderTemplate(tpl){
  const prefs = getPrefs();
  $("#output").hidden = false;

  // Scaling: use selectedMeals against template's "main_meals" when available
  const baseMeals = Number(tpl.portions?.main_meals || 6);
  const meals = clamp(Number(selectedMeals||baseMeals), 4, 10);
  // Compile slot workflows into a concrete instance (protein rules, budget options, storage).
  const compiled = compileTemplateForRender(tpl, meals);
  const mult = baseMeals ? meals / baseMeals : 1;

  $("#planTitle").textContent = compiled.name;
  $("#planSubtitle").textContent = `Sunday: ~${compiled.total_sunday_minutes} min (hands-on ~${compiled.hands_on_minutes} min).`;

  $("#badgeMode").textContent = getModeLabel(compiled.cooking_style);
  $("#badgeBudget").textContent = getBudgetLabel(parseInt(compiled.cost_level||2,10));
  $("#badgeCleanup").textContent = `🧼 Cleanup ${compiled.cleanup_score ?? "–"}/10`;

  // Decisions avoided: if 6 weekday dinners, 1 Sunday choice = 5 avoided (cheeky metric)
  $("#decisionsAvoided").textContent = String(Math.max(0, meals - 1));
  $("#cleanupScore").textContent = `${compiled.cleanup_score ?? "–"}/10`;

  // Sunday station
  const st = compiled.station || {tools:[], containers:[], order:[]};
  const stWrap = $("#station");
  const tools = (st.tools||[]).map(x=>`<li>${x}</li>`).join("");
  const conts = (st.containers||[]).map(x=>`<li>${x}</li>`).join("");
  const order = (st.order||[]).map(x=>`<li>${x}</li>`).join("");
  stWrap.innerHTML = `
    <div class="kv">
      <div>
        <h5>Tools out</h5>
        <ul>${tools || "<li class='muted'>—</li>"}</ul>
      </div>
      <div>
        <h5>Containers</h5>
        <ul>${conts || "<li class='muted'>—</li>"}</ul>
      </div>
      <div style="grid-column:1/-1">
        <h5>Order of ops</h5>
        <ul>${order || "<li class='muted'>—</li>"}</ul>
      </div>
    </div>
  `;

  // Timeline (expandable "chef steps")
  const tWrap = $("#timeline");
  tWrap.innerHTML = "";
  (compiled.sunday_timeline || []).forEach((it)=>{
    const div = document.createElement("div");
    div.className = "timelineItem";
    const quick = (it.quick || []).map(x=>`<li>${x}</li>`).join("");
    const detailed = (it.detailed || []).map(x=>`<li>${x}</li>`).join("");
    const cues = (it.cues || []).map(x=>`<li>${x}</li>`).join("");
    const pitfalls = (it.pitfalls || []).map(x=>`<li>${x}</li>`).join("");
    const pack = (it.pack || []).map(x=>`<li>${x}</li>`).join("");
    const hasDetails = !!(detailed || cues || pitfalls || pack);

    div.innerHTML = `
      <div class="stageTitle">
        <div>
          <div class="timelineT">${it.t}</div>
          <div class="stageName">${it.title || ""}</div>
        </div>
        ${hasDetails ? `<button class="stageToggle" data-open="0">Show chef steps</button>` : ""}
      </div>
      <ul>${quick}</ul>
      ${hasDetails ? `
        <div class="detailBlock" hidden>
          ${detailed ? `<div><strong>Chef steps</strong><ul>${detailed}</ul></div>` : ""}
          ${cues ? `<div style="margin-top:8px"><strong>Doneness cues</strong><ul>${cues}</ul></div>` : ""}
          ${pitfalls ? `<div style="margin-top:8px"><strong>Pitfalls</strong><ul>${pitfalls}</ul></div>` : ""}
          ${pack ? `<div style="margin-top:8px"><strong>Pack & store</strong><ul>${pack}</ul></div>` : ""}
        </div>
      ` : ""}
    `;
    tWrap.appendChild(div);
  });
  // Chef suggestions tab (aggregated)
  const chefWrap = $("#chefSuggestions");
  const chefModesNote = $("#chefModesNote");
  if(chefWrap){
    const prefsNow = getPrefs();
    const prof = PROTEIN_PROFILES[prefsNow.protein] || PROTEIN_PROFILES.chicken;
    const uniq = (arr)=>Array.from(new Set((arr||[]).filter(Boolean)));

    let chef = [];
    let cuesA = [];
    let pitfallsA = [];
    let packA = [];
    (compiled.sunday_timeline || []).forEach(it=>{
      cuesA.push(...(it.cues||[]));
      pitfallsA.push(...(it.pitfalls||[]));
      packA.push(...(it.pack||[]));
      chef.push(...(it.detailed||[]));
    });

    const speed = [];
    switch(prefsNow.kitchen){
      case "micro":
        speed.push("⚡ Steam vegetables in a covered bowl with a splash of water (3–6 min).");
        speed.push("⚡ Soften onions 2–3 min before browning to cut pan time.");
        break;
      case "multi":
        speed.push("🍲 Pressure mode for long-simmer proteins; broil/grill 3–5 min for crust (optional).");
        break;
      case "stove":
        speed.push("♨️ Keep it one-pot: sear, then build the base in the same pot to reduce dishes.");
        break;
      case "oven":
        speed.push("🔥+♨️ Roast veg while the pot simmers; parallel cooking saves 15–25 min.");
        break;
      case "raw":
        speed.push("🥗 Lean on canned legumes, pre-cooked grains, and quick dressings for a no-heat plan.");
        break;
      default:
        speed.push("✨ Uses the fastest/cleanest method available (microwave for steam, multi-cooker for long cooks).");
    }

    const block = (title, items)=> items.length ? `
      <div class="miniSection">
        <h4 style="margin:10px 0 6px">${title}</h4>
        <ul>${items.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>
      </div>` : "";

    chefWrap.innerHTML =
      block("Speed hacks", uniq(speed)) +
      block("Chef steps", uniq(chef)) +
      block("Doneness cues", uniq(cuesA)) +
      block("Pitfalls", uniq(pitfallsA)) +
      block("Pack & store", uniq(packA));

    if(chefModesNote){
      chefModesNote.innerHTML = `
        <div class="muted">Selected mode: <strong>${escapeHtml(prefsNow.kitchen)}</strong></div>
        <div class="muted" style="margin-top:6px">Protein profile: <strong>${escapeHtml(prof.name || prefsNow.protein)}</strong></div>
      `;
    }
  }



  // Wire toggles
  tWrap.querySelectorAll(".stageToggle").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const item = btn.closest(".timelineItem");
      const block = item.querySelector(".detailBlock");
      const open = btn.getAttribute("data-open")==="1";
      if(!block) return;
      block.hidden = open;
      btn.setAttribute("data-open", open ? "0" : "1");
      btn.textContent = open ? "Show chef steps" : "Hide chef steps";
    });
  });

  // Jump to Chef suggestions tab
  const openChefBtn = $("#openChefTab");
  if(openChefBtn){
    openChefBtn.onclick = ()=> setActiveTab("chefTab");
  }

  // Outputs (scaled)
  const out = $("#outputs");
  out.innerHTML = (compiled.outputs || []).map(o=>{
    const amt = scaleRangeText(o.amount, mult);
    return `<li><strong>${o.label}:</strong> ${amt}</li>`;
  }).join("");

  // Yield (optional) — show scaled meals explicitly
  const y = compiled.portions || {};
  const baseTxt = y.main_meals ? `${y.main_meals} meals` : "";
  const scaledTxt = meals ? `${meals} meals` : "";
  const yieldHtml = `<div class="muted" style="margin-top:8px"><strong>Yield:</strong> ${scaledTxt}${y.extras ? ` + ${y.extras}` : (baseTxt ? "" : "")}</div>`;
  $("#yieldRow").innerHTML = yieldHtml;

  // Shopping (core) + flavor kit add-ons (scaled)
  const f = FLAVORS[selectedFlavor] || FLAVORS.neutral;
  const core = compiled.shopping_core || {protein:[],veg:[],pantry:[],optional:[]};
  const shopping = {
    protein: scaleList(core.protein, mult),
    veg: scaleList(core.veg, mult),
    pantry: [...scaleList(core.pantry, mult), ...f.adds],
    optional: [...scaleList(core.optional, mult), ...f.optional]
  };

  // Always jump to the main plan tab on new render (so users see the plan first).
  setActiveTab('planTab');

  const shopWrap = $("#shopping");
  const cats = [
    ["Protein", "protein"],
    ["Veg", "veg"],
    ["Pantry", "pantry"],
    ["Optional", "optional"],
  ];
  const totalsProtein = sumKg(shopping.protein);
  const totalsVeg = sumKg(shopping.veg);
  const totalLine = (label, tot)=> tot ? `<div class="shopTotal">≈ ${label}: ${tot.min}–${tot.max} kg</div>` : "";
  shopWrap.innerHTML = `
    <div class="shopGrid">
      ${cats.map(([title,key])=>{
        const items = (shopping[key]||[]).map(x=>`<li>${x}</li>`).join("");
        const tot = key==="protein" ? totalsProtein : key==="veg" ? totalsVeg : null;
        return `
          <div class="shopCat">
            <h5>${title}</h5>
            <ul>${items || "<li class='muted'>—</li>"}</ul>
            ${totalLine(title.toLowerCase(), tot)}
          </div>`;
      }).join("")}
    </div>
  `;

  // Prep ingredients tab content (scaled). Uses the same shopping object.
  renderPrepIngredients(compiled, shopping, meals);

  // Storage
  const store = $("#storage");
  const s = compiled.storage || null;
  if(s){
    const days = s.fridge_days || {};
    const daysList = Object.keys(days).length
      ? `<ul>${Object.entries(days).map(([k,v])=>`<li><strong>${k}:</strong> ${v} days</li>`).join("")}</ul>`
      : "<div class='muted'>—</div>";
    const freezeList = (s.freezer||[]).length ? `<ul>${s.freezer.map(x=>`<li>${x}</li>`).join("")}</ul>` : "";
    const label = s.label_tip ? `<div class="muted" style="margin-top:8px">${s.label_tip}</div>` : "";
    store.innerHTML = `
      <div class="storeGrid">
        <div class="storeRow"><h5>Fridge</h5>${daysList}</div>
        ${freezeList ? `<div class="storeRow"><h5>Freezer</h5>${freezeList}</div>` : ""}
        ${label ? `<div class="storeRow"><h5>Label tip</h5>${label}</div>` : ""}
      </div>
    `;
  }else{
    store.innerHTML = `<div class="muted">Basic rule: fish first in the week, poultry 3–4 days, soups/chili freeze great. (We’ll add per-template storage as we expand.)</div>`;
  }

  // Flavor notes
  const fn = $("#flavorNotes");
  fn.innerHTML = `
    <div class="muted" style="margin-bottom:8px"><strong>${f.name}</strong></div>
    <div class="storeGrid">
      <div class="storeRow"><h5>Adds</h5><ul>${f.adds.map(x=>`<li>${x}</li>`).join("")}</ul></div>
      <div class="storeRow"><h5>Optional</h5><ul>${f.optional.map(x=>`<li>${x}</li>`).join("")}</ul></div>
      <div class="storeRow"><h5>Swap notes</h5><ul>${f.swap_notes.map(x=>`<li>${x}</li>`).join("")}</ul></div>
    </div>
  `;

  // Derived
  const d = $("#derived");
  d.innerHTML = "";
  (compiled.derived || []).forEach(m=>{
    const card = document.createElement("div");
    card.className = "derivedCard";
    card.innerHTML = `<h4>${m.title}</h4><ul>${m.how.map(x=>`<li>${x}</li>`).join("")}</ul>`;
    d.appendChild(card);
  });

  // Checklist tab (saved locally per day)
  renderCookChecklist(compiled);

  // Cook checklist tab content
  renderCookChecklist(compiled);

  // Switchers
  $("#swapSimilar").onclick = ()=> swapTemplate("any", tpl);
  $("#swapCheaper").onclick = ()=> swapTemplate("cheaper", tpl);
  $("#swapPremium").onclick = ()=> swapTemplate("premium", tpl);

  status("Plan ready ✅");
}

function swapTemplate(kind, currentTpl){
  const prefs = getPrefs();
  const currentCost = parseInt(currentTpl.cost_level || 2, 10);
  let pool = expandSlotTemplates(TEMPLATES.filter(allowedByConstraints)).filter(t=>t.id !== currentTpl.id);
  if(!pool.length){ status("No alternative templates yet."); return; }

  if(kind==="cheaper"){
    pool = pool.filter(t=>parseInt(t.cost_level||2,10) <= currentCost-1);
    if(!pool.length) pool = expandSlotTemplates(TEMPLATES.filter(allowedByConstraints)).filter(t=>t.id !== currentTpl.id);
  }
  if(kind==="premium"){
    pool = pool.filter(t=>parseInt(t.cost_level||2,10) >= currentCost+1);
    if(!pool.length) pool = expandSlotTemplates(TEMPLATES.filter(allowedByConstraints)).filter(t=>t.id !== currentTpl.id);
  }

  // Keep same protein vibe stronger during swaps
  const tpl = pickTemplate(pool);
  if(!tpl){ status("No swap found."); return; }
  lastPlanId = tpl.id;
  saveLastPlanState({
    id: tpl.id,
    baseId: tpl._baseId || null,
    protein: tpl._protein || null,
    flavor: selectedFlavor,
    meals: selectedMeals,
    prefs: getPrefs(),
  });
  renderTemplate(tpl);
}

function saveLastPlanId(id){
  try{ localStorage.setItem("colf_lastPlanId", id); }catch(e){}
}
function loadLastPlanId(){
  try{ return localStorage.getItem("colf_lastPlanId"); }catch(e){ return null; }
}

function runLastSunday(){
  const s = loadLastPlanState();
  const legacy = loadLastPlanId();
  if(!s && !legacy){ status("No last Sunday saved yet. Build a plan first."); return; }

  // Restore UI pills (best effort)
  if(s?.prefs){
    setActivePill("#proteinPills","data-protein", s.prefs.protein);
    setActivePill("#budgetPills","data-budget", String(s.prefs.budget));
    setActivePill("#modePills","data-mode", s.prefs.mode);
  }
  if(typeof s?.meals === "number"){ selectedMeals = clamp(s.meals,4,10); const sl=$("#scaleSlider"); if(sl){ sl.value=String(selectedMeals); $("#scaleMeals").textContent=String(selectedMeals);} }
  if(s?.flavor){ selectedFlavor = s.flavor; setActivePill("#flavorPills","data-flavor", s.flavor); }

  const expanded = expandSlotTemplates(TEMPLATES.filter(allowedByConstraints));
  const wantedId = s?.id || legacy;
  let tpl = expanded.find(t=>t.id===wantedId) || TEMPLATES.find(t=>t.id===wantedId);

  // If the exact old template no longer exists, attempt to rebuild from baseId+protein.
  if(!tpl && s?.baseId){
    const base = TEMPLATES.find(t=>t.id===s.baseId);
    if(base && base.workflow==="slots" && s.protein){
      tpl = { ...base, id: `${base.id}__${s.protein}`, _baseId: base.id, _protein: s.protein, name: `${base.name} — ${PROTEIN_PROFILES[s.protein]?.name || s.protein}`, tags: { ...(base.tags||{}), proteins: [s.protein] } };
    }
  }

  if(!tpl){ status("Last plan missing (maybe you updated templates). Build a new plan."); return; }
  if(!allowedByConstraints(tpl)){
    status("Your new constraints block last Sunday’s plan. Picking the nearest match…");
    buildPlan();
    return;
  }
  renderTemplate(tpl);
}

function setActivePill(containerSel, dataAttr, value){
  const wrap = document.querySelector(containerSel);
  if(!wrap) return;
  const btn = wrap.querySelector(`.pill[${dataAttr}="${CSS.escape(String(value))}"]`);
  if(!btn) return;
  wrap.querySelectorAll('.pill').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
}

document.addEventListener("DOMContentLoaded", ()=>{
  // Tabs
  document.querySelectorAll('.tabbtn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-tab');
      if(id) setActiveTab(id);
    });
  });

  // Timer (independent of template)
  wireTimer();

  wirePills("#proteinPills","data-protein");
  wirePills("#budgetPills","data-budget");
  wirePills("#modePills","data-mode");
  wirePills("#kitchenPills","data-kitchen");
  wirePills("#flavorPills","data-flavor", (v)=>{
    selectedFlavor = v || "neutral";
    // If a plan is currently shown, re-render it with the new flavor kit.
    const expanded = expandSlotTemplates(TEMPLATES.filter(allowedByConstraints));
    const current = lastPlanId ? (expanded.find(t=>t.id===lastPlanId) || TEMPLATES.find(t=>t.id===lastPlanId)) : null;
    if(current && !$("#output")?.hidden) renderTemplate(current);
  });

  const slider = $("#scaleSlider");
  const scaleMeals = $("#scaleMeals");
  if(slider){
    selectedMeals = parseInt(slider.value,10) || 6;
    if(scaleMeals) scaleMeals.textContent = String(selectedMeals);
    slider.addEventListener("input", ()=>{
      selectedMeals = parseInt(slider.value,10) || 6;
      if(scaleMeals) scaleMeals.textContent = String(selectedMeals);
      const expanded = expandSlotTemplates(TEMPLATES.filter(allowedByConstraints));
      const current = lastPlanId ? (expanded.find(t=>t.id===lastPlanId) || TEMPLATES.find(t=>t.id===lastPlanId)) : null;
      if(current && !$("#output")?.hidden) renderTemplate(current);
    });
  }

  $("#buildBtn").addEventListener("click", buildPlan);
  $("#repeatBtn").addEventListener("click", runLastSunday);
  status("Pick constraints (optional), then build your Sunday plan.");
});
