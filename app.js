const $ = (sel)=>document.querySelector(sel);

const FLAVORS = {
  european: { name:"European", notes:["garlic","herbs","lemon"], },
  asian:    { name:"Asian-ish", notes:["soy","ginger","garlic"], },
  med:      { name:"Mediterranean", notes:["olive oil","oregano","lemon"], },
  smoky:    { name:"Smoky", notes:["smoked paprika","cumin"], },
};

// Template schema is ONE consistent format (no legacy fields).
const TEMPLATES = [
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


// --- UI state
let lastPlanId = null;

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
  };
}

function allowedByConstraints(tpl){
  const c = getConstraints();
  const proteins = (tpl.tags?.proteins || []).map(x=>String(x).toLowerCase());
  const contains = (tpl.tags?.contains || []).map(x=>String(x).toLowerCase());

  if(c.noPork && proteins.includes("pork")) return false;
  if(c.noBeef && proteins.includes("beef")) return false;
  if(c.noFish && (proteins.includes("fish") || contains.includes("seafood") || proteins.includes("seafood"))) return false;

  return true;
}

function templateScore(tpl){
  const prefs = getPrefs();
  const proteins = (tpl.tags?.proteins || []).map(x=>String(x).toLowerCase());
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
  const pool = TEMPLATES.filter(allowedByConstraints);
  if(!pool.length){
    status("No templates match your constraints. Try relaxing a toggle.");
    return;
  }
  const tpl = pickTemplate(pool);
  lastPlanId = tpl.id;
  saveLastPlanId(tpl.id);
  renderTemplate(tpl);
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

  $("#planTitle").textContent = tpl.name;
  $("#planSubtitle").textContent = `Sunday: ~${tpl.total_sunday_minutes} min (hands-on ~${tpl.hands_on_minutes} min).`;

  $("#badgeMode").textContent = getModeLabel(tpl.cooking_style);
  $("#badgeBudget").textContent = getBudgetLabel(parseInt(tpl.cost_level||2,10));
  $("#badgeCleanup").textContent = `🧼 Cleanup ${tpl.cleanup_score ?? "–"}/10`;

  // Decisions avoided: if 5 weekday dinners, 1 Sunday choice = 4 avoided (cheeky metric)
  $("#decisionsAvoided").textContent = "4";
  $("#cleanupScore").textContent = `${tpl.cleanup_score ?? "–"}/10`;

  // Sunday station
  const st = tpl.station || {tools:[], containers:[], order:[]};
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
  (tpl.sunday_timeline || []).forEach((it)=>{
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

  // Expand / collapse all
  const expandAllBtn = $("#expandAll");
  const collapseAllBtn = $("#collapseAll");
  if(expandAllBtn){
    expandAllBtn.onclick = ()=>{
      tWrap.querySelectorAll(".detailBlock").forEach(b=>b.hidden=false);
      tWrap.querySelectorAll(".stageToggle").forEach(btn=>{ btn.setAttribute("data-open","1"); btn.textContent="Hide chef steps"; });
    };
  }
  if(collapseAllBtn){
    collapseAllBtn.onclick = ()=>{
      tWrap.querySelectorAll(".detailBlock").forEach(b=>b.hidden=true);
      tWrap.querySelectorAll(".stageToggle").forEach(btn=>{ btn.setAttribute("data-open","0"); btn.textContent="Show chef steps"; });
    };
  }

  // Outputs
  const out = $("#outputs");
  out.innerHTML = (tpl.outputs || []).map(o=>`<li><strong>${o.label}:</strong> ${o.amount}</li>`).join("");

  // Yield (optional)
  const y = tpl.portions || {};
  const yieldHtml = (y.main_meals || y.extras) ? `<div class="muted" style="margin-top:8px"><strong>Yield:</strong> ${y.main_meals ? `${y.main_meals} meals` : ""}${(y.main_meals && y.extras) ? " + " : ""}${y.extras || ""}</div>` : "";
  $("#yieldRow").innerHTML = yieldHtml;

  // Derived
  const d = $("#derived");
  d.innerHTML = "";
  (tpl.derived || []).forEach(m=>{
    const card = document.createElement("div");
    card.className = "derivedCard";
    card.innerHTML = `<h4>${m.title}</h4><ul>${m.how.map(x=>`<li>${x}</li>`).join("")}</ul>`;
    d.appendChild(card);
  });

  // Switchers
  $("#swapSimilar").onclick = ()=> swapTemplate("any", tpl);
  $("#swapCheaper").onclick = ()=> swapTemplate("cheaper", tpl);
  $("#swapPremium").onclick = ()=> swapTemplate("premium", tpl);

  status("Plan ready ✅");
}

function swapTemplate(kind, currentTpl){
  const prefs = getPrefs();
  const currentCost = parseInt(currentTpl.cost_level || 2, 10);
  let pool = TEMPLATES.filter(allowedByConstraints).filter(t=>t.id !== currentTpl.id);
  if(!pool.length){ status("No alternative templates yet."); return; }

  if(kind==="cheaper"){
    pool = pool.filter(t=>parseInt(t.cost_level||2,10) <= currentCost-1);
    if(!pool.length) pool = TEMPLATES.filter(allowedByConstraints).filter(t=>t.id !== currentTpl.id);
  }
  if(kind==="premium"){
    pool = pool.filter(t=>parseInt(t.cost_level||2,10) >= currentCost+1);
    if(!pool.length) pool = TEMPLATES.filter(allowedByConstraints).filter(t=>t.id !== currentTpl.id);
  }

  // Keep same protein vibe stronger during swaps
  const tpl = pickTemplate(pool);
  if(!tpl){ status("No swap found."); return; }
  lastPlanId = tpl.id;
  saveLastPlanId(tpl.id);
  renderTemplate(tpl);
}

function saveLastPlanId(id){
  try{ localStorage.setItem("colf_lastPlanId", id); }catch(e){}
}
function loadLastPlanId(){
  try{ return localStorage.getItem("colf_lastPlanId"); }catch(e){ return null; }
}

function runLastSunday(){
  const id = loadLastPlanId();
  if(!id){ status("No last Sunday saved yet. Build a plan first."); return; }
  const tpl = TEMPLATES.find(t=>t.id===id);
  if(!tpl){ status("Last plan missing (maybe you updated templates). Build a new plan."); return; }
  if(!allowedByConstraints(tpl)){
    status("Your new constraints block last Sunday’s template. Picking the nearest match…");
    buildPlan();
    return;
  }
  renderTemplate(tpl);
}

document.addEventListener("DOMContentLoaded", ()=>{
  wirePills("#proteinPills","data-protein");
  wirePills("#budgetPills","data-budget");
  wirePills("#modePills","data-mode");
  $("#buildBtn").addEventListener("click", buildPlan);
  $("#repeatBtn").addEventListener("click", runLastSunday);
  status("Pick constraints (optional), then build your Sunday plan.");
});
