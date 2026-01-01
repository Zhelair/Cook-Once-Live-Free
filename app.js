/* Cook Once, Live Free — single-file app.js (v2.1)
   - Adds: t8 Freezer Base Week template (slots)
   - Keeps: history, substitutions, chef steps, checklist, timer, ratings
*/

const $ = (sel) => document.querySelector(sel);

// ============================================================================
// FLAVORS
// ============================================================================
const FLAVORS = {
  neutral: {
    id: "neutral",
    name: "Neutral (week-proof)",
    adds: ["bay leaf (optional)"],
    optional: ["fresh herbs", "extra garlic"],
    swap_notes: ["If it tastes flat: add salt + acid (lemon/vinegar) + fat (oil/yogurt)."]
  },
  mediterranean: {
    id: "mediterranean",
    name: "Mediterranean",
    adds: ["oregano", "paprika", "canned tomatoes OR tomato paste"],
    optional: ["olives", "feta", "lemon zest"],
    swap_notes: ["No tomatoes? Use roasted red pepper jar + a splash of water."]
  },
  mexican: {
    id: "mexican",
    name: "Mexican-ish",
    adds: ["cumin", "paprika/chili", "canned beans (optional)"],
    optional: ["lime", "sour cream/yogurt", "corn"],
    swap_notes: ["No cumin? Use curry powder lightly (don’t tell anyone)."]
  },
  indian: {
    id: "indian",
    name: "Curry-ish",
    adds: ["curry powder OR garam masala", "ginger (optional)"],
    optional: ["coconut milk", "yogurt", "spinach"],
    swap_notes: ["No coconut milk? Use yogurt at the end (off heat)."]
  },
  asian: {
    id: "asian",
    name: "Soy–Ginger",
    adds: ["soy sauce", "ginger", "garlic"],
    optional: ["sesame oil", "rice vinegar", "chili crisp"],
    swap_notes: ["No soy? Use salt + a tiny bit of stock cube."]
  }
};

// ============================================================================
// PROTEIN PROFILES (slot engine uses these)
// ============================================================================
const PROTEIN_PROFILES = {
  chicken: {
    name: "Chicken",
    rules: ["Simmer gently; don’t hard-boil.", "Thighs stay juicy; breasts dry fast."],
    budget_options: {
      1: ["1 kg chicken thighs"],
      2: ["1–1.2 kg chicken thighs"],
      3: ["1.2–1.5 kg chicken thighs + herbs"]
    },
    freezer: { rating: "great", notes: ["Chicken soups/stews freeze beautifully."] }
  },
  beef: {
    name: "Beef",
    rules: ["Brown in batches (color = flavor).", "Low & slow until spoon-tender."],
    budget_options: {
      1: ["800 g beef (stew cuts)"],
      2: ["1 kg beef (stew cuts)"],
      3: ["1.2 kg beef + mushrooms"]
    },
    freezer: { rating: "great", notes: ["Beef gets better after freezing (seriously)."] }
  },
  pork: {
    name: "Pork",
    rules: ["Shoulder is forgiving.", "Finish with acid to lift richness."],
    budget_options: {
      1: ["900 g pork shoulder"],
      2: ["1–1.2 kg pork shoulder"],
      3: ["1.2 kg pork + smoked paprika"]
    },
    freezer: { rating: "good", notes: ["Freeze in single portions for fast reheat."] }
  },
  fish: {
    name: "Fish",
    rules: ["Add fish late (8–12 min).", "Don’t stir aggressively."],
    budget_options: {
      1: ["600–800 g white fish OR canned fish"],
      2: ["800 g white fish"],
      3: ["900 g fish + shrimp (optional)"]
    },
    freezer: { rating: "ok", notes: ["Fish texture changes when frozen — eat earlier if possible."] }
  },
  vegetarian: {
    name: "Vegetarian",
    rules: ["Use lentils/beans for body.", "Finish with salt + acid + oil."],
    budget_options: {
      1: ["2 cans beans OR 300 g lentils"],
      2: ["2 cans beans + 200 g lentils"],
      3: ["lentils + mushrooms + herbs"]
    },
    freezer: { rating: "great", notes: ["Lentil/bean bases freeze like a dream."] }
  }
};

// ============================================================================
// SUBSTITUTIONS (Swaps tab)
// ============================================================================
const SUBSTITUTIONS = [
  { key: "lentil", original: "lentils", alternatives: ["chickpeas", "beans (any)", "split peas"] },
  { key: "carrot", original: "carrots", alternatives: ["parsnips", "sweet potatoes", "butternut squash"] },
  { key: "tomato", original: "tomatoes", alternatives: ["tomato paste + water", "bell peppers", "zucchini"] },
  { key: "lemon", original: "lemon", alternatives: ["lime", "vinegar", "white wine"] },
  { key: "yogurt", original: "yogurt", alternatives: ["sour cream", "cream", "coconut milk (for dairy‑free)"] },
  { key: "milk", original: "milk", alternatives: ["yogurt", "cream", "plant milk"] },
  { key: "rice", original: "rice", alternatives: ["potatoes", "pasta", "bread"] },
  { key: "onion", original: "onion", alternatives: ["leek", "shallot", "a pinch of onion powder"] }
];

function getSubstitutions(ingredient){
  const s = String(ingredient||"").toLowerCase();
  for(const item of SUBSTITUTIONS){
    if(s.includes(item.key)) return item;
  }
  return null;
}

// ============================================================================
// HISTORY + RATINGS
// ============================================================================
const HISTORY_KEY = "colf_history";
const RATINGS_KEY = "colf_ratings";

function loadHistory(){
  try{
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function saveHistory(list){
  try{ localStorage.setItem(HISTORY_KEY, JSON.stringify(list||[])); }catch(e){}
}

function saveToHistory(tpl){
  const list = loadHistory();
  const item = {
    id: tpl.id,
    baseId: tpl._baseId || null,
    protein: tpl._protein || null,
    flavor: tpl._flavor || "neutral",
    meals: tpl._meals || 6,
    ts: Date.now()
  };
  list.unshift(item);
  saveHistory(list.slice(0, 30));
}

function getRecentProteins(n=4){
  return loadHistory().slice(0,n).map(x=>x.protein).filter(Boolean);
}
function getRecentFlavors(n=4){
  return loadHistory().slice(0,n).map(x=>x.flavor).filter(Boolean);
}

function renderHistory(){
  const listEl = $("#historyList");
  if(!listEl) return;
  const list = loadHistory();
  if(!list.length){
    listEl.innerHTML = `<div class="muted">No history yet. Build a plan.</div>`;
    return;
  }
  const fmt = (ts)=>{
    try{
      const d = new Date(ts);
      return d.toLocaleDateString(undefined, {month:"short", day:"numeric"}) + " " + d.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"});
    }catch(e){ return ""; }
  };
  listEl.innerHTML = list.slice(0,12).map(it=>{
    const label = `${it.id}${it.protein ? " / "+it.protein : ""}`;
    return `<div class="historyRow">
      <div><strong>${label}</strong> <span class="muted">• ${it.meals} meals • ${it.flavor}</span></div>
      <div class="muted">${fmt(it.ts)}</div>
    </div>`;
  }).join("");
}

function rateLastMeal(stars, notes){
  const last = loadLastPlanState();
  if(!last?.id) return false;
  const entry = { id:last.id, baseId:last.baseId||null, protein:last.protein||null, ts:Date.now(), stars, notes: String(notes||"").slice(0,500) };
  try{
    const raw = localStorage.getItem(RATINGS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    localStorage.setItem(RATINGS_KEY, JSON.stringify(list.slice(0,50)));
  }catch(e){}
  return true;
}

// ============================================================================
// TEMPLATE EXTRAS (adds station/shopping/storage to certain templates)
// ============================================================================
const TEMPLATE_EXTRAS={
  "t1_sheetpan_chicken":{
    station:{
      tools:["sheet pan", "knife + board", "mixing bowl"],
      containers:["4 meal boxes"],
      order:["Heat oven", "Chop veg", "Season + roast", "Cool, then box"]
    }
  },
  "t8_freezer_base_week":{
    storage:{
      fridge_days:{ base:"4" },
      freezer:[
        "Freeze 3–4 single portions (best within ~3 months).",
        "Freeze flat in bags to stack like books.",
        "Reheat gently; add a splash of water if thick."
      ],
      label_tip:"Label: Base + protein + date. Your future self will love you."
    }
  }
};

// ============================================================================
// TEMPLATES
// ============================================================================
const TEMPLATES = [
  // SLOT BASE (auto-generates variants per protein)
  {
    id:"t0_one_pot_base",
    name:"One‑Pot Base (choose protein)",
    workflow:"slots",
    cooking_style:"batch",
    cost_level:2,
    cleanup_score:9,
    hands_on_minutes:25,
    total_sunday_minutes:75,
    tags:{ proteins:["chicken","beef","pork","fish","vegetarian"], contains:[] },
    slot_proteins:["chicken","beef","pork","fish","vegetarian"],
    portions:{ main_meals:6, extras:"+ 1–2 flex meals" },
    station:{
      tools:["large pot", "knife + board", "wooden spoon"],
      containers:["6 meal boxes (or 4 + 2 jars)"],
      order:["Chop veg", "Simmer base", "Taste + adjust", "Cool, then seal"]
    }
  },

  // NEW: F1 — Freezer Base Week (slots)
  {
    id:"t8_freezer_base_week",
    name:"Freezer Base Week (Cook once, rescue later)",
    workflow:"slots",
    cooking_style:"freeze",
    cost_level:1,
    cleanup_score:10,
    hands_on_minutes:30,
    total_sunday_minutes:90,
    tags:{ proteins:["chicken","beef","pork","vegetarian"], contains:[] },
    slot_proteins:["chicken","beef","pork","vegetarian"],
    portions:{ main_meals:8, extras:"+ 3–4 freezer portions" },
    station:{
      tools:["large pot", "knife + board", "ladle"],
      containers:["2 fridge boxes", "3–4 freezer portions (bags/boxes)"],
      order:["Cook a rich base", "Cool fast", "Freeze flat + label"]
    },
    derived:[
      { title:"🍚 Bowl", how:["Base + rice/potatoes", "Finish with yogurt/lemon"] },
      { title:"🍝 Pasta night", how:["Base as sauce", "Add cheese/herbs if you want"] },
      { title:"🥣 Soup rescue", how:["Base + water/stock", "Add frozen veg"] },
      { title:"🥪 Toast night", how:["Thick base on toast", "Pickles = instant upgrade"] }
    ]
  },

  // Regular templates (non-slot)
  {
    id:"t1_sheetpan_chicken",
    name:"Sheet‑Pan Chicken + Veg",
    workflow:"fixed",
    cooking_style:"batch",
    cost_level:2,
    cleanup_score:9,
    hands_on_minutes:20,
    total_sunday_minutes:55,
    tags:{ proteins:["chicken"], contains:[] },
    portions:{ main_meals:6, extras:"+ salad leftovers" },
    outputs:[ {label:"Tray roast", amount:"1 pan"} ],
    shopping_core:{
      protein:["1–1.2 kg chicken thighs"],
      veg:["potatoes (800 g–1 kg)","carrots (3–4)","onions (1–2)"],
      pantry:["oil","salt + pepper","paprika"],
      optional:["lemon","herbs"]
    },
    sunday_timeline:[
      { t:"0–10 min", title:"Prep", quick:["Heat oven 220°C","Chop veg","Season chicken + veg"], detailed:["Dry chicken for better browning.","Toss veg in oil + salt."], pitfalls:["Too much veg crowding = steam." ]},
      { t:"10–55 min", title:"Roast", quick:["Roast 35–45 min","Flip veg once","Rest 5 min"], cues:["Chicken juices run clear","Potatoes browned"], pitfalls:["Don’t under-salt potatoes."], pack:["Cool 10–15 min before sealing."] }
    ],
    derived:[ {title:"🥗 Bowl", how:["Chicken + veg + yogurt sauce","Add greens"]} ]
  },

  {
    id:"t2_chili",
    name:"Big‑Pot Chili (cheap + heroic)",
    workflow:"fixed",
    cooking_style:"freeze",
    cost_level:1,
    cleanup_score:8,
    hands_on_minutes:25,
    total_sunday_minutes:70,
    tags:{ proteins:["beef","vegetarian"], contains:[] },
    portions:{ main_meals:8, extras:"+ freeze 2" },
    outputs:[ {label:"Chili", amount:"~2.5–3 L"} ],
    shopping_core:{
      protein:["800 g minced beef OR 2 cans beans"],
      veg:["onions (2)","bell pepper (1)"],
      pantry:["canned tomatoes (2)","beans (2 cans)","chili/cumin","salt + pepper"],
      optional:["corn","yogurt/sour cream"]
    },
    storage:{ fridge_days:{ base:"4" }, freezer:["Freeze 2–3 portions."], label_tip:"Write date + ‘chili’ (future you says thanks)." },
    sunday_timeline:[
      { t:"0–15 min", title:"Base", quick:["Chop onions/pepper","Brown beef OR toast spices","Add tomatoes"], detailed:["Brown beef in batches if you can."], pitfalls:["Wet pan = gray meat."] },
      { t:"15–70 min", title:"Simmer", quick:["Add beans","Simmer 30–45 min","Taste + adjust"], cues:["Thick, spoon-coating"], pack:["Cool uncovered 10–15 min, then seal.","Freeze 2–3 portions."] }
    ],
    derived:[ {title:"🌮 Taco bowl", how:["Chili + rice","Top with yogurt + lime"]} ]
  }
];

// Merge extras onto templates
TEMPLATES.forEach(t=>{
  const extra = TEMPLATE_EXTRAS[t.id];
  if(extra) Object.assign(t, extra);
});

// ============================================================================
// UTILITIES
// ============================================================================
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function roundNice(n){
  if(!isFinite(n)) return n;
  if(n < 10) return Math.round(n*10)/10;
  return Math.round(n);
}

function scaleRangeText(str, mult){
  if(!str || mult===1) return str;
  if(/\d\s*°\s*C/i.test(str)) return str;
  const unitRe = "(?:kg|g|ml|l|L|liters?|cloves|cans|jar|jars|eggs|pcs|pieces)";
  str = str.replace(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*[–-]\\s*(\\d+(?:\\.\\d+)?)\\s*(${unitRe})`,"gi"),
    (_,a,b,u)=> `${roundNice(parseFloat(a)*mult)}–${roundNice(parseFloat(b)*mult)} ${u}`);
  str = str.replace(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${unitRe})`,"gi"),
    (m,a,u)=> m.includes("–") ? m : `${roundNice(parseFloat(a)*mult)} ${u}`);
  str = str.replace(/\((\d+)\s*[–-]\s*(\d+)\)/g,
    (m,a,b)=> `(${Math.round(parseInt(a,10)*mult)}–${Math.round(parseInt(b,10)*mult)})`);
  return str;
}
function scaleList(list, mult){ return (list||[]).map(x=>scaleRangeText(String(x), mult)); }

function sumKg(list){
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
    if(mSingle){ add(mSingle[1], mSingle[1], mSingle[2]); }
  });
  if(max<=0) return null;
  return {min: roundNice(min), max: roundNice(max)};
}

function escapeHtml(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;");
}

// ============================================================================
// UI STATE
// ============================================================================
let lastPlanId = null;
let selectedFlavor = "neutral";
let selectedMeals = 6;
let currentPlan = null;

function status(msg){ $("#status").textContent = msg || ""; }

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

function setActivePill(containerSel, dataAttr, value){
  const wrap = document.querySelector(containerSel);
  if(!wrap) return;
  const btn = wrap.querySelector(`.pill[${dataAttr}="${CSS.escape(String(value))}"]`);
  if(!btn) return;
  wrap.querySelectorAll('.pill').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
}

// ============================================================================
// TEMPLATE SELECTION ENGINE
// ============================================================================
function proteinAllowed(protein){
  const c = getConstraints();
  if(c.noPork && protein==="pork") return false;
  if(c.noBeef && protein==="beef") return false;
  if(c.noFish && protein==="fish") return false;
  return true;
}

function allowedByConstraints(tpl){
  const c = getConstraints();
  const proteins = getTemplateProteins(tpl);
  const contains = (tpl.tags?.contains || []).map(x=>String(x).toLowerCase());

  if(c.noPork && proteins.includes("pork")) return false;
  if(c.noBeef && proteins.includes("beef")) return false;
  if(c.noFish && (proteins.includes("fish") || contains.includes("seafood"))) return false;

  return true;
}

function getTemplateProteins(tpl){
  const p = tpl._protein ? [tpl._protein] : (tpl.tags?.proteins || []);
  return (p || []).map(x=>String(x).toLowerCase());
}

function expandSlotTemplates(pool){
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
          name: `${tpl.name} – ${PROTEIN_PROFILES[protein]?.name || protein}`,
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

  const recentProteins = getRecentProteins(4);
  const recentFlavors  = getRecentFlavors(4);
  if(proteins[0] && !recentProteins.includes(proteins[0])) score += 3;
  if(selectedFlavor && !recentFlavors.includes(selectedFlavor)) score += 2;

  const c = parseInt(tpl.cost_level || 2, 10);
  if(c === prefs.budget) score += 2;
  else if(Math.abs(c - prefs.budget) === 1) score += 1;
  else score -= 1;

  if(tpl.cooking_style === prefs.mode) score += 2;

  if(prefs.protein !== "any"){
    if(proteins.includes(prefs.protein)) score += 5;
    else score -= 4;
  }

  score += Math.round((tpl.cleanup_score || 8) / 5);
  score += (Math.random() * 0.4);
  return score;
}

function pickTemplate(pool){
  const scored = pool.map(t=>({t, s: templateScore(t)})).sort((a,b)=>b.s-a.s);
  return scored[0]?.t || null;
}

// ============================================================================
// SLOT WORKFLOW COMPILER
// ============================================================================
function compileSlotWorkflow(tpl, meals){
  const prefs = getPrefs();
  const protein = tpl._protein || "chicken";
  const profile = PROTEIN_PROFILES[protein] || PROTEIN_PROFILES.chicken;

  const baseMeals = Number(tpl.portions?.main_meals || 6);
  const mult = baseMeals ? (meals / baseMeals) : 1;

  const isFish = protein === "fish";
  const isBeef = protein === "beef";
  const isVeg  = protein === "vegetarian";

  let total = tpl.total_sunday_minutes || 75;
  if(isFish) total = 55;
  if(isBeef) total = 110;
  if(isVeg) total = 70;

  let hands = tpl.hands_on_minutes || 25;
  if(isBeef) hands = 35;

  const outputs = [];
  const potYield = isFish ? "~1.8–2.4 L" : isBeef ? "~2.2–3.0 L" : "~2.0–2.8 L";
  outputs.push({ label: "One‑pot base", amount: scaleRangeText(potYield, mult) });
  outputs.push({ label: "Meals covered", amount: `${meals} portions` });
  if(profile.freezer?.rating === "great" || profile.freezer?.rating === "good"){
    outputs.push({ label: "Freezer option", amount: "Freeze 1–2 portions" });
  }

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

  const storage = tpl.storage || {
    fridge_days: { base: isFish ? "2" : (isBeef ? "4" : "3") },
    freezer: [...(profile.freezer?.notes || []), "Freeze flat if possible."],
    label_tip: "Label with date + protein."
  };

  const timeline = [
    {
      t: "0–10 min",
      title: "Base prep",
      quick: ["Chop veg", "Heat pot with oil", "Salt base veg"],
      detailed: ["Cut veg evenly.", "A pinch of salt early helps flavor."],
      pitfalls: ["Don’t rush this step."]
    },
    {
      t: isBeef ? "10–110 min" : isFish ? "10–45 min" : "10–70 min",
      title: isBeef ? "Brown + long simmer" : isFish ? "Build broth, add fish late" : "Simmer protein",
      quick: isBeef ? ["Brown beef in batches", "Add veg + liquid", "Simmer until tender"] :
             isFish ? ["Soften veg", "Add water/stock", "Add fish last 8–12 min"] :
             ["Add protein + veg", "Simmer gently", "Check doneness"],
      detailed: (profile.rules || []).slice(0,2).filter(Boolean),
      cues: [isBeef ? "Beef breaks with spoon" : isFish ? "Fish flakes easily" : "Protein tender"],
      pitfalls: [isBeef ? "Don’t overcrowd pan" : isFish ? "Don’t stir aggressively" : "Don’t hard boil"]
    },
    {
      t: isBeef ? "110–120 min" : "45–60 min",
      title: "Finish & pack",
      quick: ["Taste & adjust salt", "Add acid if needed", "Portion into boxes"],
      detailed: ["Cool 10–15 min before sealing.", "Freeze 1–2 portions if you want."],
      pack: ["Label with date."]
    }
  ];

  const derived = tpl.derived || [
    { title: "🍚 Bowl", how: ["Serve over rice or potatoes", "Add yogurt or lemon"] },
    { title: "🥣 Soup", how: ["Add frozen spinach at reheat", "Finish with herbs"] },
    { title: "🍞 Bread night", how: ["Serve with bread/toast", "Optional cheese"] },
  ];

  return {
    ...tpl,
    total_sunday_minutes: total,
    hands_on_minutes: hands,
    outputs,
    shopping_core: tpl.shopping_core || { protein: proteinOptions, veg: vegBody, pantry, optional },
    storage,
    sunday_timeline: tpl.sunday_timeline || timeline,
    derived,
  };
}

function compileTemplateForRender(tpl, meals){
  if(tpl.workflow === "slots" || tpl._baseId){
    const base = tpl._baseId ? (TEMPLATES.find(t=>t.id===tpl._baseId) || tpl) : tpl;
    return compileSlotWorkflow({ ...base, _renderId: tpl.id, _protein: tpl._protein, id: base.id, name: tpl.name, tags: tpl.tags }, meals);
  }
  return tpl;
}

function getBudgetLabel(level){
  return level===1 ? "💰 Cheap" : level===3 ? "💰💰💰 Premium" : "💰💰 Normal";
}
function getModeLabel(mode){
  return mode==="mixed" ? "🥘 Mixed" : mode==="freeze" ? "🧊 Freeze" : "🫕 Batch";
}

// ============================================================================
// BUILD & RENDER
// ============================================================================
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
  currentPlan = tpl;

  tpl._flavor = selectedFlavor;
  tpl._meals = selectedMeals;

  saveLastPlanState({
    id: tpl.id,
    baseId: tpl._baseId || null,
    protein: tpl._protein || null,
    flavor: selectedFlavor,
    meals: selectedMeals,
    prefs: getPrefs(),
  });

  saveToHistory(tpl);
  renderTemplate(tpl);
}

function renderTemplate(tpl){
  $("#output").hidden = false;

  const baseMeals = Number(tpl.portions?.main_meals || 6);
  const meals = clamp(Number(selectedMeals||baseMeals), 4, 10);
  const compiled = compileTemplateForRender(tpl, meals);
  const mult = baseMeals ? meals / baseMeals : 1;

  $("#planTitle").textContent = compiled.name;
  $("#planSubtitle").textContent = `Sunday: ~${compiled.total_sunday_minutes} min (hands-on ~${compiled.hands_on_minutes} min).`;

  $("#badgeMode").textContent = getModeLabel(compiled.cooking_style);
  $("#badgeBudget").textContent = getBudgetLabel(parseInt(compiled.cost_level||2,10));
  $("#badgeCleanup").textContent = `🧼 Cleanup ${compiled.cleanup_score ?? "–"}/10`;

  $("#decisionsAvoided").textContent = String(Math.max(0, meals - 1));
  $("#cleanupScore").textContent = `${compiled.cleanup_score ?? "–"}/10`;

  // Sunday station
  const st = compiled.station || {tools:[], containers:[], order:[]};
  const stWrap = $("#station");
  const tools = (st.tools||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
  const conts = (st.containers||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
  const order = (st.order||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
  stWrap.innerHTML = `
    <div class="kv">
      <div><h5>Tools out</h5><ul>${tools || "<li class='muted'>–</li>"}</ul></div>
      <div><h5>Containers</h5><ul>${conts || "<li class='muted'>–</li>"}</ul></div>
      <div style="grid-column:1/-1"><h5>Order of ops</h5><ul>${order || "<li class='muted'>–</li>"}</ul></div>
    </div>
  `;

  // Timeline
  const tWrap = $("#timeline");
  tWrap.innerHTML = "";
  (compiled.sunday_timeline || []).forEach((it)=>{
    const div = document.createElement("div");
    div.className = "timelineItem";
    const quick = (it.quick || []).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
    const detailed = (it.detailed || []).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
    const cues = (it.cues || []).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
    const pitfalls = (it.pitfalls || []).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
    const pack = (it.pack || []).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
    const hasDetails = !!(detailed || cues || pitfalls || pack);

    div.innerHTML = `
      <div class="stageTitle">
        <div>
          <div class="timelineT">${escapeHtml(it.t || "")}</div>
          <div class="stageName">${escapeHtml(it.title || "")}</div>
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

  tWrap.querySelectorAll(".stageToggle").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const item = btn.closest(".timelineItem");
      const block = item?.querySelector(".detailBlock");
      const open = btn.getAttribute("data-open")==="1";
      if(!block) return;
      block.hidden = open;
      btn.setAttribute("data-open", open ? "0" : "1");
      btn.textContent = open ? "Show chef steps" : "Hide chef steps";
    });
  });

  $("#openChefTab")?.addEventListener("click", ()=> setActiveTab("chefTab"));

  // Outputs
  $("#outputs").innerHTML = (compiled.outputs || []).map(o=>{
    const amt = scaleRangeText(o.amount, mult);
    return `<li><strong>${escapeHtml(o.label)}:</strong> ${escapeHtml(amt)}</li>`;
  }).join("");

  // Yield row
  const y = compiled.portions || {};
  $("#yieldRow").innerHTML = `<div class="muted" style="margin-top:8px"><strong>Yield:</strong> ${meals} meals${y.extras ? ` + ${escapeHtml(y.extras)}` : ""}</div>`;

  // Shopping
  const f = FLAVORS[selectedFlavor] || FLAVORS.neutral;
  const core = compiled.shopping_core || {protein:[],veg:[],pantry:[],optional:[]};
  const shopping = {
    protein: scaleList(core.protein, mult),
    veg: scaleList(core.veg, mult),
    pantry: [...scaleList(core.pantry, mult), ...f.adds],
    optional: [...scaleList(core.optional, mult), ...f.optional]
  };

  setActiveTab('planTab');

  const shopWrap = $("#shopping");
  const cats = [["Protein", "protein"],["Veg", "veg"],["Pantry", "pantry"],["Optional", "optional"]];
  const totalsProtein = sumKg(shopping.protein);
  const totalsVeg = sumKg(shopping.veg);
  const totalLine = (label, tot)=> tot ? `<div class="shopTotal">≈ ${label}: ${tot.min}–${tot.max} kg</div>` : "";
  shopWrap.innerHTML = `
    <div class="shopGrid">
      ${cats.map(([title,key])=>{
        const items = (shopping[key]||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
        const tot = key==="protein" ? totalsProtein : key==="veg" ? totalsVeg : null;
        return `<div class="shopCat"><h5>${escapeHtml(title)}</h5><ul>${items || "<li class='muted'>–</li>"}</ul>${totalLine(title.toLowerCase(), tot)}</div>`;
      }).join("")}
    </div>
  `;

  renderPrepIngredients(compiled, shopping, meals);
  renderSubstitutions(shopping);

  // Storage
  const store = $("#storage");
  const s = compiled.storage || null;
  if(s){
    const days = s.fridge_days || {};
    const daysList = Object.keys(days).length
      ? `<ul>${Object.entries(days).map(([k,v])=>`<li><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)} days</li>`).join("")}</ul>`
      : "<div class='muted'>–</div>";
    const freezeList = (s.freezer||[]).length ? `<ul>${s.freezer.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>` : "";
    const label = s.label_tip ? `<div class="muted" style="margin-top:8px">${escapeHtml(s.label_tip)}</div>` : "";
    store.innerHTML = `
      <div class="storeGrid">
        <div class="storeRow"><h5>Fridge</h5>${daysList}</div>
        ${freezeList ? `<div class="storeRow"><h5>Freezer</h5>${freezeList}</div>` : ""}
        ${label ? `<div class="storeRow"><h5>Label tip</h5>${label}</div>` : ""}
      </div>
    `;
  }else{
    store.innerHTML = `<div class="muted">Basic rule: fish early in week, poultry 3–4 days, stews/chili freeze great.</div>`;
  }

  // Flavor notes
  const fn = $("#flavorNotes");
  fn.innerHTML = `
    <div class="muted" style="margin-bottom:8px"><strong>${escapeHtml(f.name)}</strong></div>
    <div class="storeGrid">
      <div class="storeRow"><h5>Adds</h5><ul>${(f.adds||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></div>
      <div class="storeRow"><h5>Optional</h5><ul>${(f.optional||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></div>
      <div class="storeRow"><h5>Swap notes</h5><ul>${(f.swap_notes||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></div>
    </div>
  `;

  // Derived meals
  const d = $("#derived");
  d.innerHTML = "";
  (compiled.derived || []).forEach(m=>{
    const card = document.createElement("div");
    card.className = "derivedCard";
    card.innerHTML = `<h4>${escapeHtml(m.title)}</h4><ul>${(m.how||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
    d.appendChild(card);
  });

  // Chef suggestions (simple)
  const chefWrap = $("#chefSuggestions");
  if(chefWrap){
    const uniq = (arr)=>Array.from(new Set((arr||[]).filter(Boolean)));
    const chef = [];
    const cuesA = [];
    const pitfallsA = [];
    const packA = [];
    (compiled.sunday_timeline || []).forEach(it=>{
      chef.push(...(it.detailed||[]));
      cuesA.push(...(it.cues||[]));
      pitfallsA.push(...(it.pitfalls||[]));
      packA.push(...(it.pack||[]));
    });
    const block = (title, items)=> items.length ? `<div class="miniSection"><h4 style="margin:10px 0 6px">${escapeHtml(title)}</h4><ul>${items.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></div>` : "";
    chefWrap.innerHTML =
      block("Chef steps", uniq(chef)) +
      block("Doneness cues", uniq(cuesA)) +
      block("Pitfalls", uniq(pitfallsA)) +
      block("Pack & store", uniq(packA));
  }

  renderCookChecklist(compiled);

  $("#swapSimilar").onclick = ()=> swapTemplate("any", tpl);
  $("#swapCheaper").onclick = ()=> swapTemplate("cheaper", tpl);
  $("#swapPremium").onclick = ()=> swapTemplate("premium", tpl);

  status("Plan ready ✅");
}

// ============================================================================
// Swaps tab: substitutions
// ============================================================================
function renderSubstitutions(shopping){
  const list = $("#substitutionsList");
  if(!list) return;

  const allIngredients = [
    ...(shopping.protein || []),
    ...(shopping.veg || []),
    ...(shopping.pantry || []),
    ...(shopping.optional || [])
  ];

  const subs = [];
  allIngredients.forEach(ingredient => {
    const sub = getSubstitutions(ingredient);
    if(sub && !subs.find(s => s.original === sub.original)) subs.push(sub);
  });

  if(subs.length === 0){
    list.innerHTML = '<div class="muted">No substitutions available for these ingredients.</div>';
    return;
  }

  list.innerHTML = '<div class="subsList">' + subs.map(sub => `
    <div class="subsItem">
      <h5>Don’t have ${escapeHtml(sub.original)}?</h5>
      <div class="subsAlts">
        ${sub.alternatives.map(alt => `<span class="subsAlt">${escapeHtml(alt)}</span>`).join('')}
      </div>
    </div>
  `).join('') + '</div>';
}

// ============================================================================
// Prep tab
// ============================================================================
function renderPrepIngredients(tpl, shopping, meals){
  const wrap = $("#prepIngredients");
  if(!wrap) return;

  const totalsProtein = sumKg(shopping.protein);
  const totalsVeg = sumKg(shopping.veg);
  const totalLine = (label, tot)=> tot ? `<div class="prepSmall">≈ ${label}: ${tot.min}–${tot.max} kg</div>` : "";

  const cats = [["Protein", "protein"],["Veg", "veg"],["Pantry", "pantry"],["Optional", "optional"]];

  wrap.innerHTML = `
    <div class="prepSmall" style="margin-top:4px"><strong>Scale:</strong> ${meals} meals • <strong>Template:</strong> ${escapeHtml(tpl.name)}</div>
    <div class="prepGrid">
      ${cats.map(([title,key])=>{
        const items = (shopping[key]||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('');
        const tot = key==="protein" ? totalsProtein : key==="veg" ? totalsVeg : null;
        return `<div class="prepCat"><h4>${escapeHtml(title)}</h4><ul>${items || "<li class='muted'>–</li>"}</ul>${totalLine(title.toLowerCase(), tot)}</div>`;
      }).join('')}
    </div>
  `;

  const btn = $("#copyPrep");
  if(btn){
    btn.onclick = async ()=>{
      const lines = [];
      lines.push(`${tpl.name} — Prep ingredients (${meals} meals)`);
      lines.push('');
      cats.forEach(([title,key])=>{
        lines.push(title + ':');
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

// ============================================================================
// Swap template
// ============================================================================
function swapTemplate(kind, currentTpl){
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

  const tpl = pickTemplate(pool);
  if(!tpl){ status("No swap found."); return; }

  lastPlanId = tpl.id;
  currentPlan = tpl;
  tpl._flavor = selectedFlavor;
  tpl._meals = selectedMeals;

  saveLastPlanState({
    id: tpl.id,
    baseId: tpl._baseId || null,
    protein: tpl._protein || null,
    flavor: selectedFlavor,
    meals: selectedMeals,
    prefs: getPrefs(),
  });

  saveToHistory(tpl);
  renderTemplate(tpl);
}

// ============================================================================
// Persistence
// ============================================================================
function saveLastPlanState(state){
  try{ localStorage.setItem("colf_lastPlanState", JSON.stringify(state)); }catch(e){}
  try{ localStorage.setItem("colf_lastPlanId", state?.id || ""); }catch(e){}
}
function loadLastPlanState(){
  try{
    const raw = localStorage.getItem("colf_lastPlanState");
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
function loadLastPlanId(){
  try{ return localStorage.getItem("colf_lastPlanId"); }catch(e){ return null; }
}

function runLastSunday(){
  const s = loadLastPlanState();
  const legacy = loadLastPlanId();
  if(!s && !legacy){ status("No last Sunday saved yet. Build a plan first."); return; }

  if(s?.prefs){
    setActivePill("#proteinPills","data-protein", s.prefs.protein);
    setActivePill("#budgetPills","data-budget", String(s.prefs.budget));
    setActivePill("#modePills","data-mode", s.prefs.mode);
    setActivePill("#kitchenPills","data-kitchen", s.prefs.kitchen || "smart");
  }

  if(typeof s?.meals === "number"){
    selectedMeals = clamp(s.meals,4,10);
    const sl=$("#scaleSlider");
    if(sl){ sl.value=String(selectedMeals); $("#scaleMeals").textContent=String(selectedMeals); }
  }
  if(s?.flavor){ selectedFlavor = s.flavor; setActivePill("#flavorPills","data-flavor", s.flavor); }

  const expanded = expandSlotTemplates(TEMPLATES.filter(allowedByConstraints));
  const wantedId = s?.id || legacy;
  let tpl = expanded.find(t=>t.id===wantedId) || TEMPLATES.find(t=>t.id===wantedId);

  if(!tpl && s?.baseId){
    const base = TEMPLATES.find(t=>t.id===s.baseId);
    if(base && base.workflow==="slots" && s.protein){
      tpl = { ...base, id: `${base.id}__${s.protein}`, _baseId: base.id, _protein: s.protein,
              name: `${base.name} – ${PROTEIN_PROFILES[s.protein]?.name || s.protein}`,
              tags: { ...(base.tags||{}), proteins: [s.protein] } };
    }
  }

  if(!tpl){ status("Last plan missing. Build a new plan."); return; }
  if(!allowedByConstraints(tpl)){
    status("Your constraints block last Sunday’s plan. Picking the nearest match…");
    buildPlan();
    return;
  }
  lastPlanId = tpl.id;
  currentPlan = tpl;
  renderTemplate(tpl);
}

// ============================================================================
// Tabs
// ============================================================================
function setActiveTab(tabId){
  document.querySelectorAll('.tabbtn').forEach(b=>{
    const is = b.getAttribute('data-tab')===tabId;
    b.classList.toggle('active', is);
  });
  document.querySelectorAll('.tabpane').forEach(p=>{
    const is = p.id===tabId;
    p.classList.toggle('active', is);
    p.hidden = !is;
  });
}

// ============================================================================
// Checklist
// ============================================================================
function todayKey(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const da = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${da}`;
}
function checklistStorageKey(tplId){ return `colf_check_${tplId}_${todayKey()}`; }
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
  let h = 2166136261;
  for(let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h>>>0).toString(16);
}

function renderCookChecklist(tpl){
  const wrap = $("#cookChecklist");
  if(!wrap) return;

  const timeline = tpl.sunday_timeline || [];
  const key = tpl._renderId || tpl.id;
  const state = loadChecklistState(key);

  const groups = timeline
    .map((stage, idx)=>({
      idx,
      title: `${stage.t || ""} — ${stage.title || ""}`.trim(),
      items: (stage.quick || []).slice()
    }))
    .filter(g=>g.items.length);

  if(!groups.length){
    wrap.innerHTML = `<div class="muted">No checklist items for this template yet.</div>`;
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
    return `<div class="checkGroup"><h4>${escapeHtml(g.title)}</h4>${itemsHtml}</div>`;
  }).join('');

  wrap.querySelectorAll('input[type="checkbox"][data-ck]').forEach(cb=>{
    cb.addEventListener('change', ()=>{
      const id = cb.getAttribute('data-ck');
      state[id] = cb.checked;
      saveChecklistState(key, state);
      const text = cb.closest('.checkItem')?.querySelector('.checkText');
      if(text) text.classList.toggle('checkDone', cb.checked);
    });
  });

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

  $("#checkAll")?.addEventListener('click', ()=> setAll(true));
  $("#uncheckAll")?.addEventListener('click', ()=> setAll(false));
  $("#resetToday")?.addEventListener('click', ()=>{
    try{ localStorage.removeItem(checklistStorageKey(key)); }catch(e){}
    renderCookChecklist(tpl);
  });
}

// ============================================================================
// Timer
// ============================================================================
function wireTimer(){
  const disp = $("#timerDisplay");
  const stateLbl = $("#timerState");
  const btnStart = $("#timerStart");
  const btnPause = $("#timerPause");
  const btnReset = $("#timerReset");
  const soundChk = $("#timerSound");
  const testBtn = $("#timerTestSound");
  const alarmAudio = $("#alarmAudio");
  if(!disp || !btnStart || !btnPause || !btnReset) return;

  let seconds = 0;
  let running = false;
  let t = null;

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
      if(soundChk) soundChk.checked = false;
      unlockSound();
      setTimeout(()=>ring(), 150);
    };
  }
  if(soundChk){
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

// ============================================================================
// INIT
// ============================================================================
document.addEventListener("DOMContentLoaded", ()=>{
  document.querySelectorAll('.tabbtn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-tab');
      if(id) setActiveTab(id);
    });
  });

  wireTimer();

  wirePills("#proteinPills","data-protein");
  wirePills("#budgetPills","data-budget");
  wirePills("#modePills","data-mode");
  wirePills("#kitchenPills","data-kitchen");
  wirePills("#flavorPills","data-flavor", (v)=>{
    selectedFlavor = v || "neutral";
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

  $("#buildBtn")?.addEventListener("click", buildPlan);
  $("#repeatBtn")?.addEventListener("click", runLastSunday);

  const toggleHistoryBtn = $("#toggleHistory");
  const historyContent = $("#historyContent");
  if(toggleHistoryBtn && historyContent){
    toggleHistoryBtn.addEventListener("click", ()=>{
      const isHidden = historyContent.hidden;
      historyContent.hidden = !isHidden;
      toggleHistoryBtn.textContent = isHidden ? "Hide history" : "Show history";
      if(isHidden) renderHistory();
    });
  }
  renderHistory();

  const ratingStars = $("#ratingStars");
  const ratingNotes = $("#ratingNotes");
  const saveRatingBtn = $("#saveRating");
  const ratingStatus = $("#ratingStatus");

  if(ratingStars){
    ratingStars.querySelectorAll('.pill[data-rating]').forEach(pill=>{
      pill.addEventListener('click', ()=>{
        ratingStars.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
        pill.classList.add('active');
      });
    });
  }

  if(saveRatingBtn){
    saveRatingBtn.addEventListener('click', ()=>{
      const selectedStar = ratingStars?.querySelector('.pill.active');
      if(!selectedStar){
        if(ratingStatus) ratingStatus.textContent = "Pick a rating first";
        return;
      }
      const rating = parseInt(selectedStar.getAttribute('data-rating'),10);
      const notes = ratingNotes?.value || "";
      if(rateLastMeal(rating, notes)){
        if(ratingStatus) ratingStatus.textContent = "Saved ✓";
        setTimeout(()=>{ if(ratingStatus) ratingStatus.textContent = ""; }, 2000);
      }else{
        if(ratingStatus) ratingStatus.textContent = "No plan to rate yet";
      }
    });
  }

  status("Ready.");
});
