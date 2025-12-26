/* Cook Once, Live Free — MVP v0.1 (offline, no accounts)
   Plain HTML/CSS/JS. Data-driven via /data/*.json
*/

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const LS_LAST = "colf_last_plan_v01";

let REGIONS = null;
let RULES = null;
let RECIPES = null;

function slugify(s){
  return String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parsePantry(input){
  return (input || "")
    .split(",")
    .map(x => x.trim().toLowerCase())
    .filter(Boolean);
}

function uniq(arr){
  return Array.from(new Set(arr));
}

function sample(arr){
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function minutesToHuman(min){
  if (min < 60) return `${min} min`;
  const h = Math.floor(min/60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function buildAllergyChecks(){
  const box = $("#allergyBox");
  box.innerHTML = "";
  for (const a of RULES.allergies){
    const id = `all_${slugify(a.id)}`;
    const el = document.createElement("label");
    el.className = "check";
    el.innerHTML = `<input type="checkbox" value="${a.id}" id="${id}"><span>${a.label}</span>`;
    box.appendChild(el);
  }
}

function fillRegionSelect(){
  const sel = $("#regionSelect");
  sel.innerHTML = "";
  for (const r of REGIONS.regions){
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = r.label;
    sel.appendChild(opt);
  }
}

function fillDietSelect(){
  const sel = $("#dietSelect");
  sel.innerHTML = "";
  for (const d of RULES.diets){
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.label;
    sel.appendChild(opt);
  }
}

function setupEffortButtons(){
  $$(".seg").forEach(btn => {
    btn.addEventListener("click", () => {
      $$(".seg").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      $("#effortInput").value = btn.dataset.effort;
    });
  });
}

function regionById(id){
  return REGIONS.regions.find(r => r.id === id) || REGIONS.regions[0];
}

function dietById(id){
  return RULES.diets.find(d => d.id === id) || RULES.diets[0];
}

function allergyById(id){
  return RULES.allergies.find(a => a.id === id);
}

function recipePassesFilters(recipe, ctx){
  // Hard allergies
  for (const aId of ctx.allergies){
    const a = allergyById(aId);
    if (!a) continue;
    // if recipe tags include allergen OR ingredients include allergen keywords
    if ((recipe.allergens || []).includes(aId)) return false;
    const ing = (recipe.ingredients || []).join(" ").toLowerCase();
    for (const kw of (a.keywords || [])){
      if (ing.includes(kw.toLowerCase())) return false;
    }
  }

  // Diet exclusions (ingredient keyword based)
  for (const kw of ctx.diet.exclude_keywords){
    const ing = (recipe.ingredients || []).join(" ").toLowerCase();
    if (ing.includes(String(kw).toLowerCase())) return false;
  }

  // Region availability: if recipe has "rare_in" include region id, exclude
  if ((recipe.rare_in || []).includes(ctx.region.id)) return false;

  return true;
}

function scoreRecipe(recipe, ctx){
  // Simple scoring for MVP:
  // + pantry ingredient matches
  // + matches goal tags
  // + effort compatibility
  let score = 0;

  const ingText = (recipe.ingredients || []).join(" ").toLowerCase();
  for (const p of ctx.pantry){
    if (ingText.includes(p)) score += 2;
  }

  // Goal bias
  const tags = recipe.tags || [];
  if (ctx.goal === "muscle" && tags.includes("high_protein")) score += 4;
  if (ctx.goal === "light" && tags.includes("light")) score += 3;
  if (ctx.goal === "recovery" && tags.includes("gentle")) score += 3;
  if (ctx.goal === "gourmet" && tags.includes("gourmet")) score += 3;

  // Effort bias
  if (ctx.effort === "low" && tags.includes("minimal")) score += 3;
  if (ctx.effort === "mid" && (tags.includes("normal") || tags.includes("minimal"))) score += 2;
  if (ctx.effort === "high" && tags.includes("inspired")) score += 2;

  // Batch-friendly always preferred
  if (tags.includes("batch")) score += 2;

  return score;
}

function pickTopRecipes(ctx, countNeeded){
  const candidates = RECIPES.recipes
    .filter(r => (r.type === "base"))
    .filter(r => recipePassesFilters(r, ctx))
    .map(r => ({ r, s: scoreRecipe(r, ctx) }))
    .sort((a,b) => b.s - a.s);

  // fallback: if too few, relax pantry scoring doesn't matter; keep filters only.
  const chosen = [];
  for (const c of candidates){
    if (chosen.length >= countNeeded) break;
    // avoid duplicate protein focus
    chosen.push(c.r);
  }

  // If still not enough (very strict filters), pick anything that passes (including base)
  if (chosen.length < countNeeded){
    const more = RECIPES.recipes
      .filter(r => r.type === "base")
      .filter(r => recipePassesFilters(r, ctx))
      .filter(r => !chosen.some(x => x.id === r.id));
    for (const r of more){
      if (chosen.length >= countNeeded) break;
      chosen.push(r);
    }
  }
  return chosen.slice(0, countNeeded);
}

function pickSides(ctx, maxSides){
  const candidates = RECIPES.recipes
    .filter(r => r.type === "side")
    .filter(r => recipePassesFilters(r, ctx))
    .map(r => ({ r, s: scoreRecipe(r, ctx) }))
    .sort((a,b) => b.s - a.s);

  const chosen = [];
  for (const c of candidates){
    if (chosen.length >= maxSides) break;
    chosen.push(c.r);
  }
  return chosen;
}

function pickCarbs(ctx, maxCarbs){
  const candidates = RECIPES.recipes
    .filter(r => r.type === "carb")
    .filter(r => recipePassesFilters(r, ctx));
  return shuffle(candidates).slice(0, maxCarbs);
}

function buildRemixIdeas(bases){
  const ideas = [];
  for (const b of bases){
    for (const x of (b.remix || [])){
      ideas.push(`${b.name}: ${x}`);
    }
  }
  return uniq(ideas).slice(0, 8);
}

function buildShoppingList(plan, ctx){
  // Simple grouped list: Proteins, Veg, Pantry, Other
  const groups = {
    "Proteins": [],
    "Vegetables & fruit": [],
    "Pantry & carbs": [],
    "Other": []
  };

  const add = (group, item) => { if (!item) return; groups[group].push(item); };

  const allItems = [];
  for (const r of [...plan.bases, ...plan.sides, ...plan.carbs]){
    for (const it of (r.shopping || [])){
      allItems.push(it);
    }
  }

  // scale roughly by household size (very naive MVP)
  const mult = Math.max(1, Math.round(ctx.household / 2));
  const scaled = allItems.map(x => {
    // If it starts with a number, multiply it
    const m = String(x).match(/^\s*(\d+(?:\.\d+)?)\s*(.*)$/);
    if (m){
      const num = parseFloat(m[1]);
      const rest = m[2];
      const scaledNum = (num * mult);
      const shown = Number.isInteger(scaledNum) ? String(scaledNum) : scaledNum.toFixed(1);
      return `${shown} ${rest}`.trim();
    }
    return x;
  });

  for (const item of scaled){
    const low = item.toLowerCase();
    if (low.includes("chicken") || low.includes("pork") || low.includes("beef") || low.includes("tofu") || low.includes("fish") || low.includes("eggs")){
      add("Proteins", item);
    } else if (low.includes("onion") || low.includes("carrot") || low.includes("pepper") || low.includes("tomato") || low.includes("potato") || low.includes("cabbage") || low.includes("garlic") || low.includes("lemon") || low.includes("apple") || low.includes("spinach")){
      add("Vegetables & fruit", item);
    } else if (low.includes("rice") || low.includes("pasta") || low.includes("bread") || low.includes("beans") || low.includes("lentil") || low.includes("oats") || low.includes("flour") || low.includes("noodles")){
      add("Pantry & carbs", item);
    } else {
      add("Other", item);
    }
  }

  // Deduplicate lightly (exact duplicates)
  for (const k of Object.keys(groups)){
    groups[k] = uniq(groups[k]);
  }

  // Render as text
  let out = `COOK ONCE, LIVE FREE — Shopping List\n`;
  out += `${ctx.region.label} • Household: ${ctx.household} • Effort: ${ctx.effort.toUpperCase()} • Goal: ${ctx.goalLabel}\n`;
  out += `Diet: ${ctx.diet.label} • Allergies: ${ctx.allergyLabels.join(", ") || "none"}\n`;
  out += `\n`;
  for (const [k, items] of Object.entries(groups)){
    if (!items.length) continue;
    out += `== ${k} ==\n`;
    for (const it of items) out += `- ${it}\n`;
    out += `\n`;
  }
  out += `Tip: If it’s not on this list… don’t buy it. Future you says thanks.\n`;
  return out.trim();
}

function estimateStats(ctx, plan){
  // Very rough, just for fun
  const sundayMinutes = ctx.effort === "low" ? 140 : (ctx.effort === "mid" ? 180 : 220);
  const weekdayMinutes = 12 * 5; // boil carbs + reheat
  const baselineDaily = 75 * 5; // typical cooking 1h+
  const saved = Math.max(0, baselineDaily - weekdayMinutes);
  const meals = Math.min(ctx.household * 5, ctx.household * 7);
  const dishes = ctx.effort === "low" ? 3 : (ctx.effort === "mid" ? 4 : 5);
  return { savedMinutes: saved, meals, dishes, sundayMinutes };
}

function renderPlan(plan, ctx){
  $("#resultCard").hidden = false;

  $("#metaLine").textContent =
    `${ctx.region.label} • Household: ${ctx.household} • ${ctx.diet.label} • Effort: ${ctx.effortLabel} • Goal: ${ctx.goalLabel}`;

  const baseList = $("#baseList");
  baseList.innerHTML = "";
  for (const b of plan.bases){
    const li = document.createElement("li");
    li.innerHTML = `<strong>${b.name}</strong><br><span class="muted">${b.blurb}</span>`;
    baseList.appendChild(li);
  }

  const sideList = $("#sideList");
  sideList.innerHTML = "";
  for (const s of plan.sides){
    const li = document.createElement("li");
    li.textContent = s.name;
    sideList.appendChild(li);
  }

  const carbList = $("#carbList");
  carbList.innerHTML = "";
  for (const c of plan.carbs){
    const li = document.createElement("li");
    li.textContent = c.name;
    carbList.appendChild(li);
  }

  const remixList = $("#remixList");
  remixList.innerHTML = "";
  for (const r of plan.remix){
    const li = document.createElement("li");
    li.textContent = r;
    remixList.appendChild(li);
  }

  $("#shoppingText").textContent = plan.shoppingText;

  const stats = estimateStats(ctx, plan);
  $("#statsPill").textContent = `Saved: ${minutesToHuman(stats.savedMinutes)} this week`;
  $("#statTime").textContent = minutesToHuman(stats.savedMinutes);
  $("#statMeals").textContent = String(stats.meals);
  $("#statDishes").textContent = String(stats.dishes);

  // Save for repeat
  localStorage.setItem(LS_LAST, JSON.stringify({ ctx, plan, savedAt: new Date().toISOString() }));
}

function makeContextFromForm(){
  const region = regionById($("#regionSelect").value);
  const household = parseInt($("#householdSelect").value, 10);
  const effort = $("#effortInput").value;
  const effortLabel = effort === "low" ? "😮‍💨 Minimal" : (effort === "mid" ? "🙂 Normal" : "🔥 Inspired");
  const goal = $("#goalSelect").value;
  const goalLabel = $("#goalSelect").selectedOptions[0].textContent;
  const diet = dietById($("#dietSelect").value);

  const allergies = $$("#allergyBox input[type=checkbox]:checked").map(x => x.value);
  const allergyLabels = allergies.map(id => allergyById(id)?.label).filter(Boolean);

  const pantry = parsePantry($("#pantryInput").value);

  return {
    region,
    household,
    effort,
    effortLabel,
    goal,
    goalLabel,
    diet,
    allergies,
    allergyLabels,
    pantry
  };
}

function generatePlan(ctx){
  const baseCount = ctx.effort === "low" ? 2 : (ctx.effort === "mid" ? 3 : 3);
  const sideCount = ctx.effort === "low" ? 1 : 2;
  const carbCount = 3;

  const bases = pickTopRecipes(ctx, baseCount);
  const sides = pickSides(ctx, sideCount);
  const carbs = pickCarbs(ctx, carbCount);
  const remix = buildRemixIdeas(bases);

  const shoppingText = buildShoppingList({ bases, sides, carbs }, ctx);

  return { bases, sides, carbs, remix, shoppingText };
}

function copyShopping(){
  const text = $("#shoppingText").textContent;
  navigator.clipboard.writeText(text).then(() => {
    toast("Copied. Go conquer the supermarket.");
  }).catch(() => toast("Copy failed — try manual select."));
}

function downloadTextFile(filename, content){
  const blob = new Blob([content], {type:"text/plain;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

function drawShoppingCardToCanvas(text){
  const canvas = $("#shoppingCanvas");
  const ctx = canvas.getContext("2d");

  // background
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#0b0d12";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // card
  const pad = 60;
  const r = 28;
  const x = pad, y = pad, w = canvas.width - pad*2, h = canvas.height - pad*2;

  // rounded rect
  ctx.fillStyle = "#121623";
  roundRect(ctx, x, y, w, h, r, true, false);

  // header
  ctx.fillStyle = "#e9ecf5";
  ctx.font = "bold 54px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("Cook Once, Live Free", x+50, y+95);

  ctx.fillStyle = "#aab2c5";
  ctx.font = "24px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("Shopping card • take a screenshot if you want • microwave approved", x+50, y+135);

  // body text
  ctx.fillStyle = "#e9ecf5";
  ctx.font = "26px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

  const lines = wrapTextLines(text, 78);
  let yy = y + 190;
  const lineH = 34;

  for (const line of lines){
    if (yy > y + h - 60) break;
    ctx.fillText(line, x+50, yy);
    yy += lineH;
  }

  // footer
  ctx.fillStyle = "#7cf0d5";
  ctx.font = "bold 24px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("Tip: If it’s not on this list — don’t buy it. Future you says thanks.", x+50, y+h-40);

  return canvas;
}

function wrapTextLines(text, maxChars){
  const raw = String(text || "").split("\n");
  const out = [];
  for (const row of raw){
    if (row.length <= maxChars){
      out.push(row);
      continue;
    }
    const words = row.split(" ");
    let line = "";
    for (const w of words){
      const test = line ? (line + " " + w) : w;
      if (test.length > maxChars){
        out.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function roundRect(ctx, x, y, w, h, r, fill, stroke){
  if (w < 2*r) r = w/2;
  if (h < 2*r) r = h/2;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function downloadCanvasPng(canvas, filename){
  const a = document.createElement("a");
  a.download = filename;
  a.href = canvas.toDataURL("image/png");
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function toast(msg){
  let t = document.getElementById("toast");
  if (!t){
    t = document.createElement("div");
    t.id = "toast";
    t.style.position = "fixed";
    t.style.left = "50%";
    t.style.bottom = "22px";
    t.style.transform = "translateX(-50%)";
    t.style.background = "rgba(7,9,14,.75)";
    t.style.border = "1px solid rgba(255,255,255,.10)";
    t.style.backdropFilter = "blur(10px)";
    t.style.color = "#e9ecf5";
    t.style.padding = "10px 12px";
    t.style.borderRadius = "999px";
    t.style.boxShadow = "0 12px 30px rgba(0,0,0,.35)";
    t.style.fontWeight = "700";
    t.style.zIndex = 9999;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    t.style.opacity = "0";
  }, 1800);
}

function shareStats(){
  const pill = $("#statsPill").textContent;
  const txt = `Cook Once, Live Free — ${pill}. Microwaves were harmed in the making of this plan.`;
  if (navigator.share){
    navigator.share({ text: txt }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(txt).then(()=>toast("Stats copied. Paste and flex responsibly."));
  }
}

function repeatLast(){
  const raw = localStorage.getItem(LS_LAST);
  if (!raw) return toast("No saved plan yet. Generate one first.");
  try{
    const obj = JSON.parse(raw);
    renderPlan(obj.plan, obj.ctx);
    window.scrollTo({ top: $("#resultCard").offsetTop - 70, behavior: "smooth" });
    toast("Repeated last plan. Your past self is proud.");
  } catch(e){
    toast("Could not load saved plan. Sorry.");
  }
}

function clearSaved(){
  localStorage.removeItem(LS_LAST);
  toast("Cleared. Fresh start. Like a new sponge.");
}

async function init(){
  // Load JSON data
  const [regionsRes, rulesRes, recipesRes] = await Promise.all([
    fetch("./data/regions.json"),
    fetch("./data/rules.json"),
    fetch("./data/recipes_seed.json")
  ]);

  REGIONS = await regionsRes.json();
  RULES = await rulesRes.json();
  RECIPES = await recipesRes.json();

  fillRegionSelect();
  fillDietSelect();
  buildAllergyChecks();
  setupEffortButtons();

  $("#planForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const ctx = makeContextFromForm();
    const plan = generatePlan(ctx);
    renderPlan(plan, ctx);
    window.scrollTo({ top: $("#resultCard").offsetTop - 70, behavior: "smooth" });
  });

  $("#btnCopy").addEventListener("click", copyShopping);
  $("#btnDownloadTxt").addEventListener("click", () => {
    downloadTextFile("shopping-list.txt", $("#shoppingText").textContent);
  });
  $("#btnDownloadPng").addEventListener("click", () => {
    const canvas = drawShoppingCardToCanvas($("#shoppingText").textContent);
    downloadCanvasPng(canvas, "shopping-card.png");
  });
  $("#btnPrint").addEventListener("click", () => window.print());
  $("#btnShare").addEventListener("click", shareStats);

  $("#btnRepeat").addEventListener("click", repeatLast);
  $("#btnClear").addEventListener("click", clearSaved);

  toast("Ready. Cook once. Live free.");
}

init().catch(err => {
  console.error(err);
  alert("Could not load data JSON files. If you're using GitHub Pages, wait 1–2 minutes after pushing and refresh.");
});
