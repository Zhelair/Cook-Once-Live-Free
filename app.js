// Cook Once, Live Free — Template-first engine (v08)
const $ = (sel) => document.querySelector(sel);

let selectedMode = "batch";
let selectedSource = "shop";
let selectedFlavor = "european";

function setActive(btn, attr){
  document.querySelectorAll(`[${attr}]`).forEach(b=>b.classList.remove("active","primary"));
  btn.classList.add("active","primary");
}

document.querySelectorAll("[data-mode]").forEach(b=>{
  b.addEventListener("click", ()=>{ selectedMode=b.dataset.mode; setActive(b,"data-mode"); });
});
document.querySelectorAll("[data-source]").forEach(b=>{
  b.addEventListener("click", ()=>{ selectedSource=b.dataset.source; setActive(b,"data-source"); });
});
document.querySelectorAll("[data-flavor]").forEach(b=>{
  b.addEventListener("click", ()=>{ selectedFlavor=b.dataset.flavor; setActive(b,"data-flavor"); });
});

function status(msg){ $("#status").textContent = msg || ""; }

async function loadJSON(path){
  const res = await fetch(path, {cache:"no-store"});
  if(!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function li(items){ return items.map(x=>`<li>${x}</li>`).join(""); }

function renderTemplate(tpl, flavorKey, mode, source, flavorsDict){
  const flavor = flavorsDict[flavorKey] || {name: flavorKey, adds:[]};
  const o = $("#output");
  const p = $("#plan");

  const fo = tpl.flavor_overrides?.[flavorKey];
  const season = fo?.season_chicken || flavor.adds || [];
  const sauce = fo?.quick_sauce || "Any quick sauce you like";

  const badges = [
    `Mode: <strong>${mode}</strong>`,
    `Shopping: <strong>${source}</strong>`,
    `Flavor: <strong>${flavor.name || flavorKey}</strong>`,
    `Equipment: <strong>${tpl.equipment.join(" + ")}</strong>`,
    `Hands-on: <strong>${tpl.hands_on_minutes} min</strong>`,
    `Sunday total: <strong>${tpl.total_sunday_minutes} min</strong>`,
  ];

  const coreShop = tpl.shopping_core;
  const proteins = tpl.proteins;

  p.innerHTML = `
    <div class="badges">${badges.map(b=>`<span class="badge">${b}</span>`).join("")}</div>

    <h3 style="margin:0 0 6px">${tpl.name}</h3>
    <p class="muted" style="margin-top:0">Template-first plan: cook once on Sunday → assemble all week.</p>

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
}

$("#buildWeekBtn").addEventListener("click", async ()=>{
  try{
    status("Loading templates…");
    const tplData = await loadJSON("data/templates.json");
    const flavors = await loadJSON("data/flavors.json");

    // For v08 MVP: always use template #1 (we’ll add matching later)
    const tpl = tplData.templates.find(t=>t.id==="t1_whole_chicken_plus_eggs") || tplData.templates[0];
    if(!tpl) throw new Error("No templates found.");

    status("Building your plan…");
    renderTemplate(tpl, selectedFlavor, selectedMode, selectedSource, flavors);

    status("Done ✅");
  }catch(e){
    console.error(e);
    status("Oops. Something failed. Check console.");
    alert("Could not build the plan. Make sure /data/templates.json and /data/flavors.json exist in the repo.");
  }
});
