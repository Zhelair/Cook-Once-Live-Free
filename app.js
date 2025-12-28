const servingsInput = document.getElementById("servings");
const servingsValue = document.getElementById("servingsValue");
const proteinSelect = document.getElementById("protein");
const modeSelect = document.getElementById("cookMode");

const tabs = document.querySelectorAll(".tabs button");
const sections = document.querySelectorAll(".tab");

tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    sections.forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

servingsInput.addEventListener("input", render);
proteinSelect.addEventListener("change", render);
modeSelect.addEventListener("change", render);

function scale(base) {
  return base * (servingsInput.value / 4);
}

const proteinProfiles = {
  beef: {
    notes: "Long simmer. Collagen-rich. Best for freezing.",
    timeline: "Brown meat → long simmer",
    storage: "Freezer-friendly up to 3 months"
  },
  chicken: {
    notes: "Medium cook. Juicy and versatile.",
    timeline: "Roast or simmer 45–60 min",
    storage: "Fridge 3–4 days"
  },
  fish: {
    notes: "Add late. No long simmer.",
    timeline: "Broth first → fish last 10 min",
    storage: "Fridge only, 2 days max"
  },
  lentils: {
    notes: "Budget-friendly. No browning needed.",
    timeline: "Simmer until tender",
    storage: "Fridge 4 days or freeze"
  }
};

function render() {
  servingsValue.textContent = servingsInput.value;
  const protein = proteinSelect.value;
  const profile = proteinProfiles[protein];

  document.getElementById("plan").innerHTML = `
    <div class="card">
      <h3>One-Pot Base</h3>
      <p><strong>Protein:</strong> ${protein}</p>
      <p>${profile.notes}</p>
      <p><strong>Decisions:</strong> Low · <strong>Cleanup:</strong> Low</p>
    </div>
  `;

  document.getElementById("prep").innerHTML = `
    <div class="card">
      <h3>Prep ingredients</h3>
      <ul>
        <li>${Math.round(scale(800))} g protein</li>
        <li>${Math.round(scale(600))} g vegetables</li>
        <li>Onion, oil, salt, spices</li>
      </ul>
    </div>
  `;

  document.getElementById("timeline").innerHTML = `
    <div class="card">
      <h3>Sunday timeline</h3>
      <ul>
        <li>${profile.timeline}</li>
        <li>Season well</li>
        <li>Simmer / cook until done</li>
      </ul>
    </div>
  `;

  document.getElementById("chef").innerHTML = `
    <div class="card">
      <h3>Chef suggestions</h3>
      <ul>
        <li>Salt generously early.</li>
        <li>Use microwave to soften onions faster.</li>
        <li>Pressure cooker cuts cook time in half.</li>
      </ul>
    </div>
  `;

  document.getElementById("storage").innerHTML = `
    <div class="card">
      <h3>Storage</h3>
      <p>${profile.storage}</p>
    </div>
  `;
}

render();

/* TIMER */
const alarm = document.getElementById("alarm");
const startBtn = document.getElementById("startTimer");
const resetBtn = document.getElementById("resetTimer");
const status = document.getElementById("timerStatus");
let timer;

startBtn.onclick = () => {
  let min = document.getElementById("timerMinutes").value;
  status.textContent = `Timer running: ${min} min`;
  timer = setTimeout(() => {
    if (!document.getElementById("muteSound").checked) {
      alarm.play().catch(()=>{});
    }
    status.textContent = "Done!";
  }, min * 60000);
};

resetBtn.onclick = () => {
  clearTimeout(timer);
  status.textContent = "Reset.";
};
