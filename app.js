// Cook Once, Live Free v2.0 - Complete
const $ = (sel)=>document.querySelector(sel);

// ============================================================================
// FLAVORS
// ============================================================================
const FLAVORS = {
  neutral: {name:"Neutral / family-safe",adds:["salt","oil","mild garlic (optional)"],optional:["butter"],swap_notes:["Keep seasoning simple.","Let sauces happen per plate."]},
  european: {name:"European comfort",adds:["garlic","onion","herbs","butter/olive oil"],optional:["mustard","paprika"],swap_notes:["Use butter or olive oil.","Finish with herbs."]},
  asian: {name:"Asian fusion",adds:["soy sauce","ginger","garlic","sesame oil"],optional:["rice vinegar","chili flakes"],swap_notes:["Swap herbs → ginger + soy.","Finish with sesame + scallion if you have it."]},
  med: {name:"Mediterranean",adds:["olive oil","lemon","oregano"],optional:["yogurt","tomato"],swap_notes:["Add lemon at the end.","Yogurt sauce = instant upgrade."]},
  smoky: {name:"Smoky / BBQ",adds:["smoked paprika","cumin","onion"],optional:["bbq sauce","chili"],swap_notes:["Smoked paprika does 80% of the work.","Optional BBQ sauce for sandwiches."]},
};

// ============================================================================
// PROTEIN PROFILES
// ============================================================================
const PROTEIN_PROFILES = {
  fish: {name:"Fish / seafood",timing:"quick",add_when:"late",freezer:{rating:"ok",notes:["Best fresh. Freezing cooked fish is okay in soup/stew.","Avoid freezing delicate fillets plain."]},budget_options:{1:["frozen white fish (pollock/hake) (700–900 g)","canned tuna/sardines (2–3 cans)"],2:["white fish fillets (700–900 g)","salmon (600–800 g) – if on sale"],3:["salmon (700–900 g)","seafood mix (700–900 g)"]},rules:["Keep simmer gentle.","Add fish in the last 8–12 minutes."]},
  beef: {name:"Beef",timing:"long",add_when:"early",freezer:{rating:"great",notes:["Freezes extremely well (especially in sauce/broth).","Better after a night in the fridge."]},budget_options:{1:["minced beef (700–900 g)","stew beef on sale (800–1000 g)"],2:["stew beef (900–1200 g)","beef chuck (900–1200 g)"],3:["chuck/short rib (900–1200 g)","lean beef + fresh herbs"]},rules:["Brown first for flavor.","Long simmer: 60–120 minutes depending on cut."]},
  pork: {name:"Pork",timing:"long",add_when:"early",freezer:{rating:"good",notes:["Freezes well in sauce.","Best within ~2 months."]},budget_options:{1:["pork shoulder (900–1200 g)","pork mince (700–900 g)"],2:["pork shoulder (1–1.5 kg)","pork loin (800–1000 g)"],3:["pork belly (700–900 g)","premium sausages (check ingredients)"]},rules:["Shoulder = forgiving.","Skim fat if needed."]},
  chicken: {name:"Chicken",timing:"medium",add_when:"early",freezer:{rating:"good",notes:["Freezes well in sauce/broth.","Best within ~2 months."]},budget_options:{1:["chicken thighs (900–1200 g)","whole legs (1–1.4 kg)"],2:["chicken thighs (1–1.4 kg)","breast (800–1100 g)"],3:["skin-on thighs + fresh herbs","quality chicken breast"]},rules:["Thighs are hard to overcook.","Simmer 25–40 minutes."]},
  vegetarian: {name:"Vegetarian (legumes/tofu)",timing:"medium",add_when:"early",freezer:{rating:"great",notes:["Beans/lentils freeze very well.","Tofu is okay; texture changes but works in stews."]},budget_options:{1:["lentils (350–500 g)","beans (2 cans)"],2:["lentils (400–600 g)","chickpeas (2 cans)"],3:["lentils + extra veg","tofu (2 blocks) + coconut milk"]},rules:["Add lentils early.","If using tofu, add mid/late so it keeps shape."]},
  eggs: {name:"Eggs",timing:"quick",add_when:"late",freezer:{rating:"avoid",notes:["Hard‑boiled eggs don't freeze well.","Keep in fridge 4–5 days."]},budget_options:{1:["eggs (10–12)"],2:["eggs (12–16)"],3:["eggs (12–16) + cheese"]},rules:["Use as backup protein.","Add at the end (e.g., egg drop) if used in a pot."]}
};

// ============================================================================
// NEW: SUBSTITUTION ENGINE
// ============================================================================
const SUBSTITUTIONS = {
  "chicken thighs":["chicken breast","turkey thighs","pork chops"],
  "chicken breast":["chicken thighs","turkey breast","tofu (firm)"],
  "beef chuck":["beef stew meat","pork shoulder","lamb shoulder"],
  "pork shoulder":["pork loin","beef chuck","chicken thighs (adjust time)"],
  "white fish":["salmon","cod","haddock","frozen fish mix"],
  "salmon":["white fish","trout","mackerel"],
  "lentils":["chickpeas","beans (any)","split peas"],
  "chickpeas":["lentils","white beans","kidney beans"],
  "tofu":["tempeh","chickpeas","extra vegetables"],
  "potatoes":["sweet potatoes","rice","pasta","quinoa"],
  "carrots":["parsnips","sweet potatoes","butternut squash"],
  "onions":["shallots","leeks","garlic (use less)"],
  "bell peppers":["zucchini","eggplant","tomatoes"],
  "tomatoes":["tomato paste + water","bell peppers","zucchini"],
  "chicken stock":["vegetable stock","water + bouillon","water + soy sauce"],
  "coconut milk":["cream","yogurt + water","milk + butter"],
  "yogurt":["sour cream","cream","coconut milk (for dairy-free)"],
  "soy sauce":["tamari","coconut aminos","worcestershire sauce"],
  "lemon":["lime","vinegar","white wine"],
  "ginger":["ginger powder (1/4 amount)","galangal","lemongrass"]
};

function getSubstitutions(ingredient){
  const normalized=ingredient.toLowerCase().trim();
  for(const [key,subs] of Object.entries(SUBSTITUTIONS)){
    if(normalized.includes(key.toLowerCase())) return {original:key,alternatives:subs};
  }
  return null;
}

// ============================================================================
// NEW: VARIETY TRACKING (History System)
// ============================================================================
function saveToHistory(plan){
  try{
    const history=loadHistory();
    const entry={
      date:new Date().toISOString().split('T')[0],
      templateId:plan.id,
      templateName:plan.name,
      protein:plan._protein||getTemplateProteins(plan)[0]||"unknown",
      flavor:plan._flavor||selectedFlavor,
      meals:plan._meals||selectedMeals,
      rating:null,
      notes:""
    };
    history.unshift(entry);
    if(history.length>12)history.length=12;
    localStorage.setItem("colf_history",JSON.stringify(history));
    renderHistory();
  }catch(e){console.error("Failed to save history:",e)}
}

function loadHistory(){
  try{
    const raw=localStorage.getItem("colf_history");
    return raw?JSON.parse(raw):[];
  }catch(e){return []}
}

function getRecentProteins(weeks=4){
  const history=loadHistory();
  const cutoff=new Date();
  cutoff.setDate(cutoff.getDate()-(weeks*7));
  return history.filter(h=>new Date(h.date)>=cutoff).map(h=>h.protein);
}

function getRecentFlavors(weeks=4){
  const history=loadHistory();
  const cutoff=new Date();
  cutoff.setDate(cutoff.getDate()-(weeks*7));
  return history.filter(h=>new Date(h.date)>=cutoff).map(h=>h.flavor);
}

function rateLastMeal(rating,notes=""){
  try{
    const history=loadHistory();
    if(history.length>0){
      history[0].rating=rating;
      history[0].notes=notes;
      localStorage.setItem("colf_history",JSON.stringify(history));
      renderHistory();
      return true;
    }
  }catch(e){console.error("Failed to rate meal:",e)}
  return false;
}

function renderHistory(){
  const list=$("#historyList");
  if(!list)return;
  const history=loadHistory();
  const recent=history.slice(0,4);
  if(recent.length===0){
    list.innerHTML='<div class="muted">No history yet. Build your first plan!</div>';
    return;
  }
  list.innerHTML=recent.map(h=>{
    const stars=h.rating?'⭐'.repeat(h.rating):'–';
    const date=new Date(h.date).toLocaleDateString('en-US',{month:'short',day:'numeric'});
    return `<div class="historyItem"><div class="historyInfo"><div class="historyDate">${date}</div><div class="historyName">${escapeHtml(h.templateName)}</div><div class="historyMeta"><span class="historyTag">${escapeHtml(h.protein)}</span><span class="historyTag">${escapeHtml(h.flavor)}</span><span class="historyTag">${h.meals} meals</span></div></div><div class="historyStars">${stars}</div></div>`;
  }).join('');
}

// ============================================================================
// TEMPLATE EXTRAS
// ============================================================================
const TEMPLATE_EXTRAS={
  "t1_whole_chicken_week":{shopping_core:{protein:["whole chicken (1.6–2.2 kg)","eggs (10–12) – backup protein"],veg:["potatoes (1–1.5 kg)","carrots (500–700 g)","onions (2–3)","lemon (1)"],pantry:["oil or butter","salt + pepper","dried herbs (or fresh)"],optional:["mustard","paprika","bouillon cube (for broth)"]},storage:{fridge_days:{chicken:"3–4",veg:"4",broth:"3",eggs:"5"},freezer:["Freeze broth in 300–500 ml portions.","Freeze extra chicken if you made a lot (best within 2 months)."],label_tip:"Label containers: 'Chicken', 'Veg', 'Broth' + date. Your future self is your best friend."}},
  "t2_roast_shoulder_week":{shopping_core:{protein:["pork shoulder OR beef roast (1.5–2.2 kg)"],veg:["onions (2–3)","carrots (400–600 g)","potatoes (700–1000 g)"],pantry:["salt + pepper","oil","paprika (optional)","garlic (optional)"],optional:["stock cube","mustard","pickles (for serving)"]},storage:{fridge_days:{roast:"3–4",veg:"4"},freezer:["Freeze 1–2 portions sliced (best within 2 months)."],label_tip:"Freeze a couple of portions on purpose. 'Surprise-meal' is a real life skill."}},
  "t3_fish_tray_week":{shopping_core:{protein:["white fish fillets (700–1000 g) OR salmon (600–900 g)"],veg:["mixed tray veg (700–1000 g)","lemon (1)"],pantry:["salt + pepper","oil"],optional:["yogurt (sauce)","soy + ginger (sauce)","dill"]}},
  "t4_lentil_chili_week":{shopping_core:{protein:["lentils (400–600 g)"],veg:["onion (1)","garlic (2–4 cloves)","optional veg: bell pepper/carrots"],pantry:["canned tomatoes (2)","oil","salt","chili/paprika/cumin"],optional:["tomato paste","vinegar/lemon","cheese or yogurt"]}},
  "t5_chicken_thighs_sheetpan":{shopping_core:{protein:["chicken thighs (1.2–1.8 kg)"],veg:["tray veg (900–1300 g)","onion (1–2)"],pantry:["oil","salt + pepper"],optional:["paprika","garlic powder","yogurt/soy sauce for bowls"]}},
  "t6_minced_meat_base_week":{shopping_core:{protein:["minced beef (800–1200 g) OR mixed mince"],veg:["onion (1–2)","optional veg: carrots/celery"],pantry:["oil","salt","spices (paprika/cumin)","tomatoes OR tomato paste"],optional:["rice/pasta (2–3 days)","pickles/herbs to refresh"]}},
  "t7_soup_first_week":{shopping_core:{protein:["chicken pieces (900–1400 g)"],veg:["onion (1)","carrots (2)","celery (optional)","lemon (optional)"],pantry:["salt","pepper"],optional:["noodles OR rice (for last 10–12 min)","bouillon cube"]}}
};

// ============================================================================
// TEMPLATES (all your original templates)
// ============================================================================
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
          "Get containers out now – yield is big."
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
          "Add veg for last 35–45 min (roast, don't mush).",
          "If tight: give it more time – big cuts are patience food."
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
          "If salmon: lighter seasoning; it's rich."
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
          "Reheat fish short bursts; don't nuke it."
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
          "Containers ready – this is a lot."
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
          "Don't crowd"
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
          "Containers out – base becomes many meals."
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
// Merge extras onto templates
TEMPLATES.forEach(t=>{
const extra = TEMPLATE_EXTRAS[t.id];
if(extra) Object.assign(t, extra);
});
