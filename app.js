const API = "https://www.themealdb.com/api/json/v1/1";
const LS_SAVED = "colf_saved_v05";

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

let REGIONS = null;
let RULES = null;

let pantry = [];
let allergies = [];
let lastMode = "match";
let lastMeal = null;

const GLOBAL_COMMON = [
  "onion","garlic","tomato","potato","rice","pasta","bread","egg","milk","cheese","yogurt",
  "chicken","pork","beef","fish","tuna","salmon","beans","lentils","carrot","pepper","cabbage",
  "spinach","cucumber","lemon","butter","flour","sugar","oil","salt","vinegar","soy sauce","ginger"
];

const EFFORT_LABELS = [
  "🥪 Sandwich Mode",
  "🍳 One-pan Hero",
  "🍲 Sunday Prep Pro",
  "👨‍🍳 Top Chef",
];

function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>{ t.hidden = true; }, 1700);
}

function normalizeIng(x){
  let s = String(x || "").trim().toLowerCase();
  s = s.replace(/\s+/g, " ");
  s = s.replace(/[^a-z0-9\s\-]/g, "");
  if (s.endsWith("es") && s.length > 4) s = s.slice(0, -2);
  else if (s.endsWith("s") && s.length > 3) s = s.slice(0, -1);
  return s.trim();
}

function levenshtein(a,b){
  a = String(a); b = String(b);
  const m = a.length, n = b.length;
  const dp = Array.from({length:m+1}, ()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++) dp[i][0]=i;
  for(let j=0;j<=n;j++) dp[0][j]=j;
  for(let i=1;i<=m;i++){
    for(let j=1;j<=n;j++){
      const cost = a[i-1]===b[j-1] ? 0 : 1;
      dp[i][j]=Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
    }
  }
  return dp[m][n];
}

function regionById(id){
  return (REGIONS || []).find(r => r.id === id) || (REGIONS ? REGIONS[0] : null);
}
function selectedRegion(){
  return regionById($("#regionInput").value);
}

function getKnownIngredients(){
  const region = selectedRegion();
  const staples = (region?.staples || []).map(normalizeIng);
  const all = [...staples, ...GLOBAL_COMMON.map(normalizeIng)];
  return Array.from(new Set(all)).filter(Boolean);
}

function renderSuggestions(){
  const dl = $("#ingSuggestions");
  dl.innerHTML = "";
  const known = getKnownIngredients().slice(0, 260);
  for (const k of known){
    const opt = document.createElement("option");
    opt.value = k;
    dl.appendChild(opt);
  }
}

function closestKnown(input){
  const known = getKnownIngredients();
  const s = normalizeIng(input);
  if (!s) return { value:"", fixed:false };
  if (known.includes(s)) return { value:s, fixed:false };

  let best = {v:null, d:999};
  for (const k of known){
    const d = levenshtein(s, k);
    if (d < best.d){ best = {v:k, d}; }
    if (best.d === 1) break;
  }

  const accept = best.v && (best.d <= 2 || (s.length <= 6 && best.d <= 1));
  if (accept){
    return { value: best.v, fixed:true, from:s };
  }
  return { value:s, fixed:false, custom:true };
}

function addPantry(raw){
  const n = normalizeIng(raw);
  if (!n) return;

  const { value, fixed, from, custom } = closestKnown(n);
  if (!value) return;

  if (!pantry.includes(value)){
    pantry.push(value);
    renderPantry();
    if (fixed) toast(`Fixed: "${from}" → "${value}"`);
    else if (custom) toast(`Added custom: "${value}"`);
  } else {
    if (fixed) toast(`Already have "${value}" (fixed: "${from}")`);
  }
}

function editPantry(oldVal){
  const next = prompt("Edit ingredient:", oldVal);
  if (next === null) return;
  pantry = pantry.filter(x => x !== oldVal);
  if (normalizeIng(next)) addPantry(next);
  renderPantry();
}

function renderPantry(){
  const box = $("#pantryChips");
  box.innerHTML = "";
  for (const it of pantry){
    const c = document.createElement("span");
    c.className = "chip";
    c.textContent = it + " ✕";
    c.title = "Click to edit/remove";
    c.addEventListener("click", () => {
      const action = confirm(`Edit "${it}"?\nOK = Edit, Cancel = Remove`);
      if (action) editPantry(it);
      else { pantry = pantry.filter(x => x !== it); renderPantry(); }
    });
    box.appendChild(c);
  }
}

function renderQuickPantry(){
  const region = selectedRegion();
  const box = $("#quickPantry");
  box.innerHTML = "";
  for (const it of (region?.staples || [])){
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn";
    b.textContent = "+ " + it;
    b.addEventListener("click", ()=> addPantry(it));
    box.appendChild(b);
  }
}

function setupRegionGrid(){
  const grid = $("#regionGrid");
  grid.innerHTML = "";
  for (const r of REGIONS){
    const card = document.createElement("div");
    card.className = "region-card" + (r.id === $("#regionInput").value ? " active" : "");
    card.innerHTML = `
      <div class="region-title">
        <span>${r.label}</span>
        <span>${r.flags || ""}</span>
      </div>
      <div class="region-hint">${r.hint || ""}</div>
    `;
    card.addEventListener("click", ()=>{
      $$(".region-card").forEach(c=>c.classList.remove("active"));
      card.classList.add("active");
      $("#regionInput").value = r.id;
      renderQuickPantry();
      renderSuggestions();
      toast(`Region: ${r.label}`);
    });
    grid.appendChild(card);
  }
}

function setupSlider(){
  const slider = $("#effortSlider");
  const label = $("#effortLabel");
  const update = ()=>{
    const v = Number(slider.value);
    label.textContent = EFFORT_LABELS[v] || EFFORT_LABELS[0];
  };
  slider.addEventListener("input", update);
  update();
}

function fillDietTabs(){
  const box = $("#dietTabs");
  box.innerHTML = "";
  for (const d of RULES.diets){
    const b = document.createElement("button");
    b.type = "button";
    b.className = "seg" + (d.id === "omnivore" ? " active" : "");
    b.textContent = d.label;
    b.addEventListener("click", ()=>{
      $$("#dietTabs .seg").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      $("#dietInput").value = d.id;
    });
    box.appendChild(b);
  }
}

function fillAllergySelect(){
  const sel = $("#allergySelect");
  for (const a of RULES.allergies){
    sel.appendChild(new Option(a.label, a.id));
  }
}

function addAllergy(){
  const v = $("#allergySelect").value;
  if (!v) return;
  if (!allergies.includes(v)){
    allergies.push(v);
    renderAllergyChips();
  }
  $("#allergySelect").value = "";
}

function renderAllergyChips(){
  const box = $("#allergyChips");
  box.innerHTML = "";
  for (const id of allergies){
    const a = RULES.allergies.find(x=>x.id===id);
    const c = document.createElement("span");
    c.className = "chip";
    c.textContent = (a?.label || id) + " ✕";
    c.addEventListener("click", ()=>{
      allergies = allergies.filter(x=>x!==id);
      renderAllergyChips();
    });
    box.appendChild(c);
  }
}

function mealIngredients(meal){
  const ings = [];
  for (let i=1;i<=20;i++){
    const ing = meal["strIngredient"+i];
    if (ing && String(ing).trim()){
      ings.push(normalizeIng(ing));
    }
  }
  return Array.from(new Set(ings)).filter(Boolean);
}

function textContainsAny(text, keywords){
  const t = String(text||"").toLowerCase();
  return (keywords||[]).some(k => t.includes(String(k).toLowerCase()));
}

function mealPassesFilters(meal){
  const ingText = mealIngredients(meal).join(" ");
  const dietId = $("#dietInput").value;
  const diet = RULES.diets.find(d=>d.id===dietId);

  if (diet?.exclude_keywords?.length){
    if (textContainsAny(ingText, diet.exclude_keywords)) return false;
  }

  for (const aId of allergies){
    const a = RULES.allergies.find(x=>x.id===aId);
    if (a?.keywords?.length){
      if (textContainsAny(ingText, a.keywords)) return false;
    }
  }
  return true;
}

const ONE_PAN_POS = ["one pan","one-pan","one pot","one-pot","sheet","tray","bake","oven","casserole","stew","simmer","slow cook","slow-cook","roast","pot"];
const MANY_DISHES_NEG = ["separate bowl","in a bowl","whisk","beat","fold","strain","double boiler","double-boiler","fry in batches","set aside","reserve","make the sauce","another pan"];

function batchScore(meal){
  const instr = String(meal.strInstructions||"").toLowerCase();
  const pos = ONE_PAN_POS.reduce((acc,k)=> acc + (instr.includes(k) ? 1 : 0), 0);
  const neg = MANY_DISHES_NEG.reduce((acc,k)=> acc + (instr.includes(k) ? 1 : 0), 0);
  const cat = String(meal.strCategory||"").toLowerCase();
  const catBonus = (["stew","soup","casserole"].some(x=>cat.includes(x)) ? 2 : 0);
  return pos*2 + catBonus - neg*2;
}

function effortValue(){
  return Number($("#effortSlider").value); // 0..3
}

function scoreMeal(meal, mode){
  const ingList = mealIngredients(meal);
  const instr = String(meal.strInstructions||"");
  const ingCount = ingList.length;
  const instrLen = instr.length;

  const overlap = ingList.filter(i=>pantry.includes(i)).length;
  const overlapScore = mode === "match" ? overlap * 8 : 0;

  const e = effortValue();
  let effortScore = 0;
  if (e === 0){
    effortScore = (26 - Math.min(26, ingCount)) + (1800 - Math.min(1800, instrLen))/200;
  } else if (e === 1){
    effortScore = (22 - Math.min(22, ingCount)) + (2000 - Math.min(2000, instrLen))/260;
  } else if (e === 2){
    effortScore = (12 - Math.abs(12 - ingCount)) + 6 - Math.abs(1400 - instrLen)/350;
  } else {
    effortScore = Math.min(28, ingCount) + Math.min(2400, instrLen)/220;
  }

  const batchOn = $("#batchToggle").checked;
  const bs = batchOn ? batchScore(meal) : 0;

  const bonus = (meal.strSource ? 1 : 0) + (meal.strYoutube ? 1 : 0);

  return overlapScore + effortScore + bs + bonus;
}

async function fetchRandomMeal(){
  const res = await fetch(`${API}/random.php`);
  const data = await res.json();
  return data?.meals?.[0] || null;
}

async function pickMeal(mode){
  const tries = 10;
  const candidates = await Promise.all(Array.from({length:tries}, ()=>fetchRandomMeal().catch(()=>null)));
  const good = candidates.filter(Boolean).filter(mealPassesFilters);

  if (!good.length){
    const more = await Promise.all(Array.from({length:tries}, ()=>fetchRandomMeal().catch(()=>null)));
    const good2 = more.filter(Boolean).filter(mealPassesFilters);
    if (!good2.length) return null;
    good2.sort((a,b)=>scoreMeal(b,"random")-scoreMeal(a,"random"));
    return good2[0];
  }

  good.sort((a,b)=>scoreMeal(b,mode)-scoreMeal(a,mode));
  return good[0];
}


function estimateWeeklyMeta(meal){
  const cat = String(meal.strCategory||"").toLowerCase();
  // Conservative defaults (not nutrition advice): just a helpful week framing.
  let feeds = "4–6 meals";
  let keeps = "3–4 days (fridge)";
  let freezer = "Freezer-friendly";
  if (cat.includes("dessert")){
    feeds = "6–10 portions";
    keeps = "2–3 days";
    freezer = "Often freezer-friendly";
  } else if (cat.includes("seafood")){
    keeps = "1–2 days";
    freezer = "Freeze only if needed";
  } else if (cat.includes("pasta")){
    keeps = "2–3 days";
  } else if (cat.includes("soup") || cat.includes("stew")){
    keeps = "4 days";
  }
  return {feeds, keeps, freezer};
}

function renderMeal(meal){
  const ingList = mealIngredients(meal);
  const have = ingList.filter(i=>pantry.includes(i));
  const need = ingList.filter(i=>!pantry.includes(i));

  const area = meal.strArea ? `• ${meal.strArea}` : "";
  const cat = meal.strCategory ? `• ${meal.strCategory}` : "";
  const meta = [area, cat].filter(Boolean).join(" ");

  const src = meal.strSource ? `<a href="${meal.strSource}" target="_blank" rel="noopener">Source</a>` : "";
  const yt = meal.strYoutube ? `<a href="${meal.strYoutube}" target="_blank" rel="noopener">YouTube</a>` : "";
  const links = [src, yt].filter(Boolean).join(" • ") || "—";

  $("#recipeBox").innerHTML = `
    <div class="recipe">
      <h3>${meal.strMeal}</h3>
      <div class="meta">${meta}</div>
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}"/>
      <div class="have"><strong>✅ You already have</strong><div>${have.join(", ") || "nothing yet"}</div></div>
      <div class="need"><strong>🛒 You need</strong><div>${need.join(", ") || "nothing (you legend)"}</div></div>
      <details>
        <summary>Show instructions</summary>
        <div style="white-space:pre-wrap; margin-top:10px;">${meal.strInstructions || ""}</div>
      </details>
      <div class="meta" style="margin-top:10px;">Links: ${links}</div>
    </div>
  `;
  $("#recipeCard").hidden = false;
  lastMeal = meal;
}

function getSaved(){
  try{ return JSON.parse(localStorage.getItem(LS_SAVED) || "[]"); }catch{ return []; }
}
function setSaved(arr){
  localStorage.setItem(LS_SAVED, JSON.stringify(arr));
}
function saveCurrent(){
  if (!lastMeal) return toast("No recipe to save yet.");
  const saved = getSaved();
  if (saved.some(x=>x.idMeal===lastMeal.idMeal)) return toast("Already saved.");
  saved.unshift({ idMeal: lastMeal.idMeal, strMeal: lastMeal.strMeal, strMealThumb: lastMeal.strMealThumb });
  setSaved(saved.slice(0, 60));
  toast("Saved ⭐");
}
async function openSaved(){
  const saved = getSaved();
  if (!saved.length){
    $("#savedBox").innerHTML = `<div class="meta">No saved recipes yet. Hit ⭐ on a weekly base you like.</div>`;
    $("#savedCard").hidden = false;
    return;
  }
  $("#savedBox").innerHTML = saved.map(s=>`
    <div class="saved-item" data-id="${s.idMeal}">
      <img src="${s.strMealThumb}" alt="${s.strMeal}"/>
      <div>
        <div class="saved-title">${s.strMeal}</div>
        <div class="meta">Click to open</div>
      </div>
    </div>
  `).join("");
  $$("#savedBox .saved-item").forEach(el=>{
    el.addEventListener("click", async ()=>{
      const id = el.getAttribute("data-id");
      const res = await fetch(`${API}/lookup.php?i=${encodeURIComponent(id)}`);
      const data = await res.json();
      const meal = data?.meals?.[0];
      if (meal){ renderMeal(meal); $("#savedCard").hidden = true; }
    });
  });
  $("#savedCard").hidden = false;
}
function clearSaved(){
  setSaved([]);
  $("#savedBox").innerHTML = `<div class="meta">Cleared.</div>`;
  toast("Saved cleared.");
}

async function getRecipe(mode){
  lastMode = mode;
  if (mode === "match" && pantry.length === 0){
    toast("Add at least 1 pantry item first (onion, rice, chicken…) so I can build your week.");
    return;
  }
  toast("Building your week…");
  const meal = await pickMeal(mode);
  if (!meal){
    toast("No match found. Try removing an allergy or changing diet.");
    return;
  }
  renderMeal(meal);
}

function setupEvents(){
  $("#addAllergy").addEventListener("click", addAllergy);

  $("#pantryInput").addEventListener("keydown", (e)=>{
    if (e.key === "Enter"){
      e.preventDefault();
      const v = $("#pantryInput").value;
      $("#pantryInput").value = "";
      addPantry(v);
    }
  });

  $("#btnClearPantry").addEventListener("click", ()=>{
    pantry = [];
    renderPantry();
    toast("Pantry cleared.");
  });

  $("#btnRecipeMatch").addEventListener("click", ()=>getRecipe("match"));
  $("#btnRecipeRandom").addEventListener("click", ()=>getRecipe("random"));
  $("#btnAnother").addEventListener("click", ()=>getRecipe(lastMode));
  $("#btnSave").addEventListener("click", saveCurrent);
  $("#btnSaved").addEventListener("click", openSaved);
  $("#btnCloseSaved").addEventListener("click", ()=>$("#savedCard").hidden = true);
  $("#btnClearSaved").addEventListener("click", clearSaved);
}

async function init(){
  const [regionsRes, rulesRes] = await Promise.all([
    fetch("./data/regions.json"),
    fetch("./data/rules.json"),
  ]);
  const regionsData = await regionsRes.json();
  const rulesData = await rulesRes.json();
  REGIONS = regionsData.regions;
  RULES = rulesData;

  setupRegionGrid();
  setupSlider();
  fillDietTabs();
  fillAllergySelect();
  renderAllergyChips();

  renderQuickPantry();
  renderSuggestions();
  renderPantry();

  setupEvents();
  toast("Ready. Add pantry → build your week.");
}

init().catch(err=>{
  console.error(err);
  alert("Could not load data files. If using GitHub Pages, wait a minute after pushing and refresh.");
});
