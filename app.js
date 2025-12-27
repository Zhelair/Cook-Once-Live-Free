// Cook Once, Live Free — Template-first engine (v08)
const $ = (sel) => document.querySelector(sel);

let selectedMode = "batch";
let selectedSource = "shop";
let selectedFlavor = "european";

let noPork = false;
let noVeal = false;

function wireDietToggles(){
  const p = document.getElementById("noPorkToggle");
  const v = document.getElementById("noVealToggle");
  const f = document.getElementById("noFishToggle");

  if(p){ p.checked = noPork; p.addEventListener("change", ()=>{ noPork = !!p.checked; }); }
  if(v){ v.checked = noVeal; v.addEventListener("change", ()=>{ noVeal = !!v.checked; }); }
  // Fish/seafood strict exclusion (no global needed)
  if(f){ f.addEventListener("change", ()=>{}); }
}

function getAllergyState(){
  return {
    fish: document.getElementById("noFishToggle")?.checked ? "strict" : "none",
  };
}

function getPrefs(){
  const active = document.querySelector("#proteinPills .pill.active");
  return {
    protein: active?.getAttribute("data-protein") || "any",
    carb: document.getElementById("prefCarb")?.value || "any",
  };
}

function setToggleActive(groupAttr, valueAttr, selectedValue){
  document.querySelectorAll(`[${groupAttr}]`).forEach(b=>{
    b.classList.remove("active","primary");
    if(b.getAttribute(groupAttr) === selectedValue){
      b.classList.add("active","primary");
    }else{
      b.classList.add("choice");
    }
  });
}



function setActive(btn, attr){
  document.querySelectorAll(`[${attr}]`).forEach(b=>b.classList.remove("active","primary"));
  btn.classList.add("active","primary");
}

document.querySelectorAll("[data-mode]").forEach(b=>{
  b.addEventListener("click", ()=>{ selectedMode=b.dataset.mode; setActive(b,"data-mode"); });
});
document.querySelectorAll("[data-flavor]").forEach(b=>{
  b.addEventListener("click", ()=>{ selectedFlavor=b.dataset.flavor; setActive(b,"data-flavor"); });
});

function status(msg){ $("#status").textContent = msg || ""; }


function initAutopilotUI(){
  const last = loadLastRun();
  const repeatBtn = $("#repeatWeekBtn");
  const repeatHint = $("#repeatHint");
  const buildBtn = $("#buildWeekBtn");
  if(last){
    if(repeatBtn) repeatBtn.hidden = false;
    if(repeatHint) repeatHint.hidden = false;
    if(buildBtn) buildBtn.textContent = "Build a new weekly plan";
    status(`Last plan: ${lastSundayLabel(last.timestamp)}`);
  }else{
    if(repeatBtn) repeatBtn.hidden = true;
    if(repeatHint) repeatHint.hidden = true;
    if(buildBtn) buildBtn.textContent = "Build my weekly plan";
  }
}
document.addEventListener("DOMContentLoaded", ()=>{ initAutopilotUI(); wireDietToggles(); wireProteinPills(); wireBudgetPills(); });
async function loadJSON(path){
  const res = await fetch(path, {cache:"no-store"});
  if(!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}


function cleanupLevel(equipment){
  const n = (equipment||[]).length;
  if(n <= 2) return {level:"Low", note:`${n} items`};
  if(n === 3) return {level:"Medium", note:`${n} items`};
  return {level:"High", note:`${n} items`};
}

function decisionsAvoidedEstimate(){
  // Gentle, human metric (not a strict KPI)
  // 5 weekday dinners + 5 lunches + ~2 "what should we eat?" moments
  return 12;
}

function lastSundayLabel(ts){
  try{
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, {weekday:"long", year:"numeric", month:"short", day:"numeric"});
  }catch(e){ return "last Sunday"; }
}

function saveLastRun(payload){
  localStorage.setItem("colf_lastRun", JSON.stringify(payload));
}

function loadLastRun(){
  try{ return JSON.parse(localStorage.getItem("colf_lastRun")||"null"); }catch(e){ return null; }
}

function renderAutopilotSummary(tpl){
  const el = $("#autopilot");
  if(!el) return;
  const dec = decisionsAvoidedEstimate();
  const cl = cleanupLevel(tpl.equipment);
  const cookware = (tpl.equipment||[]).join(" + ");
  el.innerHTML = `
    <div class="line">You’re set for the week.</div>
    <div class="line">🔁 <span class="muted">This plan can be reused next Sunday</span></div>
    <div class="line">🧠 <span class="muted">~${dec} food decisions avoided</span></div>
    <div class="line">🧼 <span class="muted">Cleanup: ${cl.level} (${cookware})</span></div>
  `;
}


function li(items){ return items.map(x=>`<li>${x}</li>`).join(""); }

function renderTemplate(tpl, flavorKey, mode, source, flavorsDict, tweaks=null){
  const fd = flavorsDict || window.__flavors || {};
  const safeKey = flavorKey || "european";
  const flavor = fd[safeKey] || {name: safeKey, adds:[]};
  const o = $("#output");
  const p = $("#plan");

  const fo = tpl.flavor_overrides?.[safeKey];
  const season = fo?.season_roast || fo?.season_chicken || flavor.adds || [];
  const sauce = fo?.quick_finish || fo?.quick_sauce || "Any quick sauce you like";

  const badges = [
    `Mode: <strong>${mode}</strong>`,
    `Shopping: <strong>${source}</strong>`,
    `Flavor: <strong>${flavor.name || safeKey}</strong>`,
    `Equipment: <strong>${(tpl.equipment||[]).join(" + ")}</strong>`,
    `Hands-on: <strong>${tpl.hands_on_minutes} min</strong>`,
    `Sunday total: <strong>${tpl.total_sunday_minutes} min</strong>`,
  ];

  const coreShop = tpl.shopping_core;
  const proteins = tpl.proteins;

  p.innerHTML = `
    <div class="badges">${badges.map(b=>`<span class="badge">${b}</span>`).join("")}</div>

    <h3 style="margin:0 0 6px">${tpl.name}</h3>
    <p class="muted" style="margin-top:0">Template-first plan: cook once on Sunday → assemble all week.</p>

    <div class="box" style="margin-top:12px">
      <h4>📦 After Sunday, you’ll have</h4>
      <ul>${(tpl.outputs||[]).map(o=>`<li><strong>${o.label}:</strong> ${o.amount}</li>`).join("")}</ul>
      ${tweaks?.sideSuggestion ? `<div class="muted" style="margin-top:8px">Small swap suggestion: try <strong>${tweaks.sideSuggestion}</strong> as your carb this week.</div>` : ""}
    </div>

    <div class="grid3">
      <div class="box">
        <h4>🛒 Shopping (core)</h4>
        <ul>
          <li><strong>Primary protein:</strong> ${proteins.primary.label}</li>
          <li><strong>Secondary protein:</strong> ${proteins.secondary.label}</li>
        </ul>
        <hr/>
        <div class="muted"><strong>Veg:</strong> ${coreShop.veg.join(", ")}</div>
        <div class="muted" style="margin-top:6px"><strong>Pantry:</strong> ${coreShop.pantry.join(", ")}</div>
        <div class="muted" style="margin-top:6px"><strong>Optional:</strong> ${coreShop.optional.join(", ")}</div>
      </div>

      <div class="box">
        <h4>🔥 Flavor pack</h4>
        <div class="muted"><strong>Season chicken with:</strong></div>
        <ul>${li(season)}</ul>
        <div class="muted" style="margin-top:8px"><strong>Quick sauce idea:</strong> ${sauce}</div>
      </div>

      <div class="box">
        <h4>📦 Base blocks you’ll create</h4>
        <ul>${tpl.base_blocks.map(b=>`<li>${b.label}</li>`).join("")}</ul>
        <div class="muted" style="margin-top:8px"><strong>Yield:</strong> ${tpl.portions.main_meals} + ${tpl.portions.extras}</div>
      </div>
    </div>

    <div class="grid3" style="margin-top:12px">
      <div class="box">
        <h4>⏱ Sunday timeline (realistic)</h4>
        <ul>${tpl.sunday_timeline.map(s=>`<li><strong>${s.t}:</strong> ${s.do.join(" ")}</li>`).join("")}</ul>
      </div>

      <div class="box">
        <h4>🍽 Weekdays (10–15 min)</h4>
        <ul>${li(tpl.weekday_assembly.rules)}</ul>
        <div class="muted" style="margin-top:8px"><strong>Reminder:</strong> you’re assembling, not cooking daily.</div>
      </div>

      <div class="box">
        <h4>✨ Derived meals (assembly templates)</h4>
        <ul>${tpl.weekday_assembly.derived_meals.map(m=>`<li><strong>${m.title}</strong>: ${m.how.join(" • ")}</li>`).join("")}</ul>
      </div>
    </div>

    <div class="grid3" style="margin-top:12px">
      <div class="box">
        <h4>🧊 Storage</h4>
        <div class="muted"><strong>Fridge:</strong></div>
        <ul>
          <li>Chicken: ${tpl.storage.fridge_days.chicken} days</li>
          <li>Veg: ${tpl.storage.fridge_days.veg} days</li>
          <li>Broth: ${tpl.storage.fridge_days.broth} days</li>
          <li>Eggs: ${tpl.storage.fridge_days.eggs} days</li>
        </ul>
        <div class="muted" style="margin-top:8px"><strong>Freezer:</strong></div>
        <ul>${li(tpl.storage.freezer)}</ul>
        <div class="muted" style="margin-top:8px">${tpl.storage.label_tip}</div>
      </div>

      <div class="box">
        <h4>🧠 How to use leftovers</h4>
        <ul>
          <li>Broth + veg + chicken = soup night</li>
          <li>Shredded chicken + sauce + greens = wraps/sandwiches</li>
          <li>Chicken + rice + veg = bowls (meal-prep friendly)</li>
          <li>Eggs are your “no-brain” backup meal</li>
        </ul>
      </div>

      <div class="box">
        <h4>✅ Your next micro-step</h4>
        <ul>
          <li>Buy the primary protein</li>
          <li>Pick one tray veg combo</li>
          <li>Do Sunday in the order shown</li>
          <li>Then enjoy your week like a civilized human 😄</li>
        </ul>
      </div>
    </div>
  `;

  o.hidden = false;
  try{ updateWeekCard(tpl); }catch(e){}

  // Switch template buttons
  const flavors = flavorsDict;
  $("#swapSimilar")?.addEventListener("click", async ()=>{
    const alt = await pickAlternative(tpl, "any");
    if(!alt) return status("No alternative templates yet.");
    renderTemplate(alt, selectedFlavor, selectedMode, selectedSource, flavors, null);
    status("Swapped ✅");
  });
  $("#swapCheaper")?.addEventListener("click", async ()=>{
    const alt = await pickAlternative(tpl, "cheaper");
    if(!alt) return status("No cheaper option available (yet).");
    renderTemplate(alt, selectedFlavor, selectedMode, selectedSource, flavors, null);
    status("Cheaper swap ✅");
  });
  $("#swapPremium")?.addEventListener("click", async ()=>{
    const alt = await pickAlternative(tpl, "premium");
    if(!alt) return status("No premium option available (yet).");
    renderTemplate(alt, selectedFlavor, selectedMode, selectedSource, flavors, null);
    status("Premium swap ✅");
  });
}


function templateAllowed(tpl){
  const tags = tpl.tags || {};
  const proteins = (tags.proteins || []).map(x=>String(x).toLowerCase());
  const contains = (tags.contains || []).map(x=>String(x).toLowerCase());

  // Diet toggles
  if(noPork && proteins.includes("pork")) return false;
  if(noVeal && (proteins.includes("veal") || proteins.includes("beef"))) return false;

  const allergy = getAllergyState();

  // Strict exclusions
  if(allergy.fish === "strict" && (proteins.includes("fish") || contains.includes("fish") || contains.includes("seafood"))) return false;

  return true;
}

function templateScore(tpl){
  // Higher score = more likely choice
  const prefs = getPrefs();
  const budget = getBudget();
  const tags = tpl.tags || {};
  const proteins = (tags.proteins || []).map(x=>String(x).toLowerCase());

  let score = 0;
  const c = parseInt(tpl.cost_level || 2, 10);
  // Budget alignment (soft): match gets +2, 1-step away +1, far -1
  if(c === budget) score += 2;
  else if(Math.abs(c - budget) === 1) score += 1;
  else score -= 1;

  // Avoid (soft)
  const allergy = getAllergyState();
  if(allergy.fish === "avoid" && proteins.includes("fish")) score -= 2;

  // Preference (soft)
  if(prefs.protein !== "any"){
    if(proteins.includes(prefs.protein)) score += 3;
    else score -= 1;
  }

  // Carb preference influences only suggestion (not exclusion)
  if(prefs.carb !== "any") score += 1;

  // Keep simple: batch templates get slight preference
  if(tpl.cooking_style === "batch") score += 1;

  return score;
}

function pickTemplate(pool){
  if(!pool.length) return null;
  // Weighted-ish: choose among top-scoring
  let scored = pool.map(t=>({t, s: templateScore(t)}));
  scored.sort((a,b)=>b.s-a.s);
  const top = scored.slice(0, Math.min(3, scored.length));
  return top[Math.floor(Math.random()*top.length)].t;
}


$("#buildWeekBtn").addEventListener("click", async ()=>{
  try{
    status("Loading templates…");
    const tplData = await loadJSON("data/templates.json");
    const flavors = await loadJSON("data/flavors.json");
    window.__flavors = flavors;

    // Pick a template based on constraints + gentle preferences
    const poolAll = tplData.templates || [];
    const pool = poolAll.filter(templateAllowed);
    const tpl = pickTemplate(pool) || poolAll[0];
    if(!tpl) throw new Error("No templates found.");

    status("Building your plan…");
    renderTemplate(tpl, selectedFlavor, selectedMode, selectedSource, flavors);

    saveLastRun({templateId: tpl.id, flavor: selectedFlavor, mode: selectedMode, source: selectedSource, timestamp: Date.now()});
    initAutopilotUI();

    status("Done ✅");
  }catch(e){
    console.error(e);
    status("Oops. Something failed. Check console.");
    alert("Could not build the plan. Make sure data/templates.json and data/flavors.json exist in the repo.");
  }
});


/* ===== Weekly Autopilot: Repeat with small swaps ===== */
const repeatModal = document.getElementById("repeatModal");

function updateWeekCard(tpl){
  const last = loadLastRun();
  const wt = document.getElementById("wc-template");
  const wf = document.getElementById("wc-flavor");
  const wm = document.getElementById("wc-mode");
  if(wt) wt.textContent = `Template: ${tpl?.name || (last?.templateId || "—")}`;
  if(wf) wf.textContent = `Flavor: ${selectedFlavor}`;
  if(wm) wm.textContent = `Cooking: ${selectedMode === "batch" ? "Sunday once" : (selectedMode === "mixed" ? "Sunday mixed batch" : "Cook & freeze")}`;
}

function pickSideSwap(tpl){
  // Simple safe swaps: potatoes <-> rice <-> pasta (as text hint)
  const swaps = ["potatoes", "rice", "pasta"];
  // choose one that is NOT already mentioned in shopping_core veg/pantry (best-effort)
  const existing = new Set([...(tpl.shopping_core?.veg||[]), ...(tpl.shopping_core?.pantry||[]), ...(tpl.shopping_core?.optional||[])]);
  for(const s of swaps){
    if(![...existing].some(x=>String(x).toLowerCase().includes(s))) return s;
  }
  return "rice";
}

function applySmallSwaps(tpl){
  // Allowed swaps: flavor style + one side suggestion
  const side = pickSideSwap(tpl);
  return {sideSuggestion: side};
}

async function runLastPlan(withTweaks=false){
  const last = loadLastRun();
  if(!last) return;
  status(withTweaks ? "Repeating with small tweaks…" : "Running last Sunday…");

  const tplData = await loadJSON("data/templates.json");
  const flavors = await loadJSON("data/flavors.json");
  let tpl = tplData.templates.find(t=>t.id===last.templateId) || tplData.templates[0];
  if(!tpl) throw new Error("No templates found.");
  if(!templateAllowed(tpl)){
    // If last plan violates current constraints, pick an allowed one
    const poolAll = tplData.templates || [];
    const pool = poolAll.filter(templateAllowed);
    tpl = pickTemplate(pool) || poolAll[0];
  }

  selectedMode = last.mode || selectedMode;
  selectedSource = "shop";
  selectedFlavor = last.flavor || selectedFlavor;

  const tweaks = withTweaks ? applySmallSwaps(tpl) : null;

  renderTemplate(tpl, selectedFlavor, selectedMode, selectedSource, flavors, tweaks);
  status(withTweaks ? "Set again (with tweaks) ✅" : "You’re set again ✅");
}

document.getElementById("repeatWeekBtn")?.addEventListener("click", ()=>{
  if(repeatModal) repeatModal.classList.remove("hidden");
});

document.getElementById("repeatAsIs")?.addEventListener("click", async ()=>{
  if(repeatModal) repeatModal.classList.add("hidden");
  try{ await runLastPlan(false); }catch(e){ console.error(e); status("Oops. Could not repeat last plan."); }
});

document.getElementById("repeatTweak")?.addEventListener("click", async ()=>{
  if(repeatModal) repeatModal.classList.add("hidden");
  try{ await runLastPlan(true); }catch(e){ console.error(e); status("Oops. Could not repeat with tweaks."); }
});
function wireProteinPills(){
  const wrap = document.getElementById("proteinPills");
  if(!wrap) return;
  wrap.querySelectorAll(".pill").forEach(p=>{
    p.addEventListener("click", ()=>{
      wrap.querySelectorAll(".pill").forEach(x=>x.classList.remove("active"));
      p.classList.add("active");
    });
  });
}

function getBudget(){
  const active = document.querySelector("#budgetPills .pill.active");
  return parseInt(active?.getAttribute("data-budget") || "2", 10);
}
function wireBudgetPills(){
  const wrap = document.getElementById("budgetPills");
  if(!wrap) return;
  wrap.querySelectorAll(".pill").forEach(p=>{
    p.addEventListener("click", ()=>{
      wrap.querySelectorAll(".pill").forEach(x=>x.classList.remove("active"));
      p.classList.add("active");
    });
  });
}

function pickAlternative(currentTpl, direction){
  // direction: "any" | "cheaper" | "premium"
  // Uses current constraints + prefs + budget, but adjusts target cost.
  return loadJSON("data/templates.json").then(tplData=>{
    const poolAll = tplData.templates || [];
    const allowed = poolAll.filter(templateAllowed).filter(t=>t.id!==currentTpl.id);
    if(!allowed.length) return null;

    const curCost = parseInt(currentTpl.cost_level || 2, 10);
    let pool = allowed;

    if(direction === "cheaper"){
      pool = allowed.filter(t=>parseInt(t.cost_level||2,10) <= curCost-1);
    }else if(direction === "premium"){
      pool = allowed.filter(t=>parseInt(t.cost_level||2,10) >= curCost+1);
    }
    if(!pool.length) pool = allowed; // fallback

    // pick among top scored
    const picked = pickTemplate(pool);
    return picked || pool[0];
  });
}
