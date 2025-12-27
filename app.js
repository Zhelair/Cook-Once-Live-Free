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
    id:"t1_whole_chicken_week",
    name:"Whole Chicken Week (Roast + Tray Veg)",
    cooking_style:"batch",
    cost_level:2,
    proteins:{primary:"chicken", secondary:null},
    tags:{ proteins:["chicken"], contains:[] },
    portions:{ main_meals:5, extras:"+ broth jar (optional)" },
    cleanup_score:9,
    hands_on_minutes:30,
    total_sunday_minutes:95,
    outputs:[
      {label:"Roast chicken meat", amount:"~1.2–1.6 kg"},
      {label:"Tray vegetables", amount:"~900–1200 g"},
      {label:"Optional broth jar", amount:"~0.5–1 liter"}
    ],
    sunday_timeline:[
      {t:"0–10 min", do:["Heat oven 210°C.","Season chicken + chop veg.","Tray veg goes in."]},
      {t:"10–85 min", do:["Roast chicken + veg (stir veg once).","Rest chicken 10 min."]},
      {t:"85–95 min", do:["Pull meat, pack containers.","Optional: simmer bones 30–60 min later."]},
    ],
    derived:[
      {title:"🍽 Plate meal", how:["Chicken + tray veg","Add salad/pickles"]},
      {title:"🍚 Bowl", how:["Rice + chicken + veg","Sauce: yogurt/soy"]},
      {title:"🥪 Wrap", how:["Shredded chicken + greens","Wrap + sauce"]},
      {title:"🍜 Quick soup", how:["Broth cube + veg + chicken","10 min pot"]},
    ]
  },

  {
    id:"t2_roast_shoulder_week",
    name:"Roast Shoulder Week (Pork or Beef)",
    cooking_style:"batch",
    cost_level:2,
    proteins:{primary:"pork", secondary:"beef"}, // means either works (we’ll filter with toggles)
    tags:{ proteins:["pork","beef"], contains:[] },
    portions:{ main_meals:6, extras:"+ goulash pot (optional)" },
    cleanup_score:8,
    hands_on_minutes:35,
    total_sunday_minutes:120,
    outputs:[
      {label:"Roast meat", amount:"~1.4–2.0 kg"},
      {label:"Roast veg", amount:"~700–1000 g"},
      {label:"Optional goulash pot", amount:"~1.5 liters"}
    ],
    sunday_timeline:[
      {t:"0–15 min", do:["Season shoulder.","Chop onions/veg.","Heat oven 170–180°C."]},
      {t:"15–135 min", do:["Slow roast 2–3h (hands-off).","Roast veg in last 40 min."]},
      {t:"135–150 min", do:["Rest + slice.","Optional: quick goulash from trimmings."]},
    ],
    derived:[
      {title:"🍽 Plate meal", how:["Roast slices + veg","Mustard/pickles"]},
      {title:"🍚 Rice bowl", how:["Rice + meat + veg","Pan sauce drizzle"]},
      {title:"🥪 Sandwich", how:["Cold roast + mustard","Bread + greens"]},
      {title:"🥣 Stew night", how:["Goulash (optional)","Bread or rice"]},
    ]
  },

  {
    id:"t3_fish_tray_week",
    name:"Fish Tray Week (White Fish → Salmon Upgrade)",
    cooking_style:"batch",
    cost_level:2,
    proteins:{primary:"fish", secondary:"seafood"},
    tags:{ proteins:["fish"], contains:["seafood"] },
    portions:{ main_meals:4, extras:"+ sauce jar" },
    cleanup_score:9,
    hands_on_minutes:25,
    total_sunday_minutes:75,
    outputs:[
      {label:"Baked fish portions", amount:"4–6 servings"},
      {label:"Tray vegetables", amount:"~700–1000 g"},
      {label:"Sauce (optional)", amount:"1 small jar"}
    ],
    sunday_timeline:[
      {t:"0–10 min", do:["Heat oven 210°C.","Chop veg, season tray.","Season fish."]},
      {t:"10–55 min", do:["Roast veg 25–35 min.","Add fish last 12–15 min."]},
      {t:"55–75 min", do:["Mix sauce (yogurt+lemon OR soy+lemon).","Pack fish + veg."]},
    ],
    derived:[
      {title:"🍽 Plate meal", how:["Fish + tray veg","Lemon squeeze"]},
      {title:"🥗 Salad bowl", how:["Cold fish flakes + greens","Sauce as dressing"]},
      {title:"🍚 Rice bowl", how:["Rice + fish + veg","Soy/lemon drizzle"]},
      {title:"🥪 Wrap", how:["Fish + sauce","Wrap + greens"]},
    ]
  },

  {
    id:"t4_lentil_chili_week",
    name:"Lentil Chili Week (1 Pot + Freezer Friendly)",
    cooking_style:"freeze",
    cost_level:1,
    proteins:{primary:"vegetarian", secondary:null},
    tags:{ proteins:["vegetarian"], contains:[] },
    portions:{ main_meals:6, extras:"+ 2–4 freezer portions" },
    cleanup_score:10,
    hands_on_minutes:20,
    total_sunday_minutes:70,
    outputs:[
      {label:"Chili / stew pot", amount:"~2.5–3.5 liters"},
      {label:"Freezer portions", amount:"2–4 single meals (optional)"}
    ],
    sunday_timeline:[
      {t:"0–10 min", do:["Chop onion + veg.","Start pot with oil + onion."]},
      {t:"10–60 min", do:["Add spices + lentils + tomatoes/water.","Simmer until thick."]},
      {t:"60–70 min", do:["Taste + adjust.","Portion & freeze extras."]},
    ],
    derived:[
      {title:"🥣 Chili bowl", how:["Chili + bread","Or chili + rice"]},
      {title:"🌯 Wrap", how:["Chili as filling","Add salad/yogurt (optional)"]},
      {title:"🍝 Pasta sauce", how:["Chili over pasta","Cheese (optional)"]},
      {title:"🥔 Loaded potato", how:["Chili + baked potato","Comfort mode"]},
    ]
  },

  {
    id:"t5_chicken_thighs_sheetpan",
    name:"Chicken Thighs Sheet‑Pan Week (Juicy + Forgiving)",
    cooking_style:"batch",
    cost_level:2,
    proteins:{primary:"chicken", secondary:null},
    tags:{ proteins:["chicken"], contains:[] },
    portions:{ main_meals:6, extras:null },
    cleanup_score:9,
    hands_on_minutes:25,
    total_sunday_minutes:80,
    outputs:[
      {label:"Cooked chicken thighs", amount:"5–7 servings"},
      {label:"Tray vegetables", amount:"~900–1300 g"}
    ],
    sunday_timeline:[
      {t:"0–10 min", do:["Heat oven 210°C.","Chop veg. Season tray."]},
      {t:"10–70 min", do:["Add thighs on tray.","Roast 45–60 min (stir veg once)."]},
      {t:"70–80 min", do:["Rest 5–10 min.","Pack thighs + veg."]},
    ],
    derived:[
      {title:"🍽 Plate meal", how:["Thigh + veg","Add sauce"]},
      {title:"🍚 Bowl", how:["Rice + thigh slices","Veg + dressing"]},
      {title:"🥪 Wrap", how:["Shredded thigh + sauce","Wrap + greens"]},
      {title:"🍜 Quick soup", how:["Broth + veg + thigh","10 min pot"]},
    ]
  },

  {
    id:"t6_minced_meat_base_week",
    name:"Minced Meat Base Week (Sauce That Becomes 5 Dinners)",
    cooking_style:"mixed",
    cost_level:2,
    proteins:{primary:"beef", secondary:"pork"},
    tags:{ proteins:["beef","pork"], contains:[] },
    portions:{ main_meals:6, extras:"+ optional cooked carbs" },
    cleanup_score:8,
    hands_on_minutes:30,
    total_sunday_minutes:75,
    outputs:[
      {label:"Cooked minced base", amount:"~1.2–1.8 kg"},
      {label:"Optional cooked carbs", amount:"2–3 meals worth"}
    ],
    sunday_timeline:[
      {t:"0–10 min", do:["Chop onion/veg.","Heat pan."]},
      {t:"10–50 min", do:["Brown meat + onion.","Add veg + sauce base. Simmer."]},
      {t:"50–75 min", do:["Portion base.","Optional: cook rice/pasta for 2–3 days."]},
    ],
    derived:[
      {title:"🍝 Pasta night", how:["Base + pasta","Cheese (optional)"]},
      {title:"🌯 Wraps", how:["Base + salad","Wrap + yogurt"]},
      {title:"🍚 Bowl", how:["Rice + base","Pickles + sauce"]},
      {title:"🥣 Soup starter", how:["Base + water + veg","Quick soup"]},
    ]
  },

  {
    id:"t7_soup_first_week",
    name:"Soup‑First Week (Big Pot + Sandwich Nights)",
    cooking_style:"batch",
    cost_level:1,
    proteins:{primary:"chicken", secondary:null},
    tags:{ proteins:["chicken"], contains:["broth"] },
    portions:{ main_meals:5, extras:"+ broth jar" },
    cleanup_score:10,
    hands_on_minutes:25,
    total_sunday_minutes:90,
    outputs:[
      {label:"Soup pot", amount:"~2.5–4 liters"},
      {label:"Broth jar", amount:"~0.5–1 liter"}
    ],
    sunday_timeline:[
      {t:"0–15 min", do:["Start pot with chicken + veg + water.","Bring to simmer."]},
      {t:"15–80 min", do:["Simmer 60–75 min.","Add noodles/rice at end (optional)."]},
      {t:"80–90 min", do:["Portion soup.","Save broth jar."]},
    ],
    derived:[
      {title:"🍲 Soup night", how:["Soup + bread","Add lemon/pickles"]},
      {title:"🥪 Sandwich night", how:["Soup + sandwich","Fast comfort"]},
      {title:"🍚 Soup bowl", how:["Soup over rice","More filling"]},
      {title:"🍳 “Empty fridge” add-on", how:["Crack egg into hot soup","Instant upgrade"]},
    ]
  },
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

  // Timeline
  const tWrap = $("#timeline");
  tWrap.innerHTML = "";
  (tpl.sunday_timeline || []).forEach(it=>{
    const div = document.createElement("div");
    div.className = "timelineItem";
    div.innerHTML = `<div class="timelineT">${it.t}</div><ul>${it.do.map(x=>`<li>${x}</li>`).join("")}</ul>`;
    tWrap.appendChild(div);
  });

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
