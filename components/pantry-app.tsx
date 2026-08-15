"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { AirVent, Bot, ChefHat, ChevronRight, ClipboardList, FileText, Flame, Heart, Home, Languages, Leaf, Menu, Mic, PackageOpen, Plus, ReceiptText, Send, ShoppingBasket, Sparkles, Sun, Timer, Trash2, Upload, UtensilsCrossed, Volume2, X } from "lucide-react";
import { ingredientSeed, starterRecipe } from "@/lib/seed";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Page = "home" | "plan" | "recipes" | "shop" | "more";
type Theme = "daylight" | "dark" | "pantry";
type Locale = "EN" | "RU" | "BG";
type Recipe = typeof starterRecipe & { custom?: boolean };

const copy = {
  EN: { greeting: "Good evening", subtitle: "Your kitchen is calm. Let’s make this week easy.", plan: "Plan this week", offers: "Read a deal or receipt", cook: "Start Sunday prep", recipe: "Recipe Shelf", shop: "Shop mode", more: "More" },
  RU: { greeting: "Добрый вечер", subtitle: "На кухне спокойно. Давайте упростим эту неделю.", plan: "План на неделю", offers: "Акции или чек", cook: "Начать готовить", recipe: "Книга рецептов", shop: "Покупки", more: "Ещё" },
  BG: { greeting: "Добър вечер", subtitle: "Кухнята е спокойна. Нека улесним седмицата.", plan: "План за седмицата", offers: "Оферта или касова бележка", cook: "Неделна подготовка", recipe: "Рецепти", shop: "Пазаруване", more: "Още" },
};

const nav = [
  ["home", Home, "Today"], ["plan", ClipboardList, "Plan"], ["recipes", UtensilsCrossed, "Recipes"], ["shop", ShoppingBasket, "Shop"], ["more", Menu, "More"],
] as const;

const cookingMethods = [
  { label: "Oven", Icon: Flame }, { label: "Air fryer", Icon: AirVent }, { label: "Pan", Icon: UtensilsCrossed },
  { label: "Boil", Icon: Timer }, { label: "Steam", Icon: Leaf }, { label: "Microwave", Icon: Mic },
];

export function PantryApp() {
  const [page, setPage] = useState<Page>("home");
  const [theme, setTheme] = useState<Theme>("daylight");
  const [locale, setLocale] = useState<Locale>("EN");
  const [sound, setSound] = useState(true);
  const [companion, setCompanion] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([starterRecipe]);
  const [dealText, setDealText] = useState("");
  const [dealItems, setDealItems] = useState<string[]>(["Pork loin · 5.43 BGN/kg", "Potatoes · 1.65 BGN / 2.5 kg", "Mushrooms · 1.39 BGN / 250 g"]);
  const [chat, setChat] = useState("");
  const [chatAnswer, setChatAnswer] = useState("I’m Miro. Show me an offer, a receipt, leftovers, or your kitchen mood — I’ll help make a doable plan.");
  const [thinking, setThinking] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [credits, setCredits] = useState(310);
  const [accessToken, setAccessToken] = useState("");
  const [email, setEmail] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const t = copy[locale];

  useEffect(() => {
    const stored = window.localStorage.getItem("quiet-pantry-settings");
    if (stored) { try { const value = JSON.parse(stored); setTheme(value.theme || "daylight"); setLocale(value.locale || "EN"); setSound(value.sound ?? true); setCompanion(value.companion ?? true); } catch {} }
    const localKitchen = window.localStorage.getItem("quiet-pantry-kitchen");
    if (localKitchen) { try { const value = JSON.parse(localKitchen); if (Array.isArray(value.recipes)) setRecipes(value.recipes); if (Array.isArray(value.dealItems)) setDealItems(value.dealItems); if (typeof value.dealText === "string") setDealText(value.dealText); } catch {} }
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setAccessToken(data.session?.access_token || ""); setEmail(data.session?.user.email || ""); });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => { setAccessToken(session?.access_token || ""); setEmail(session?.user.email || ""); });
    return () => subscription.subscription.unsubscribe();
  }, []);
  useEffect(() => { window.localStorage.setItem("quiet-pantry-settings", JSON.stringify({ theme, locale, sound, companion })); }, [theme, locale, sound, companion]);
  useEffect(() => { window.localStorage.setItem("quiet-pantry-kitchen", JSON.stringify({ recipes, dealItems, dealText })); }, [recipes, dealItems, dealText]);

  const content = useMemo(() => {
    if (page === "plan") return <PlanRoom onCook={() => setPage("home")} onAsk={() => setChat("Make a cheap 3-day batch plan from my confirmed offers.")} />;
    if (page === "recipes") return <RecipeShelf recipes={recipes} onCreate={() => setBuilderOpen(true)} />;
    if (page === "shop") return <DealDesk dealText={dealText} setDealText={setDealText} dealItems={dealItems} setDealItems={setDealItems} />;
    if (page === "more") return <MoreRoom theme={theme} setTheme={setTheme} locale={locale} setLocale={setLocale} sound={sound} setSound={setSound} companion={companion} setCompanion={setCompanion} />;
    return <HomeRoom t={t} dealItems={dealItems} onPlan={() => setPage("plan")} onDeals={() => setPage("shop")} onRecipes={() => setPage("recipes")} />;
  }, [page, theme, locale, sound, companion, recipes, dealText, dealItems, t]);

  async function askMiro() {
    if (!chat.trim() || thinking) return;
    setThinking(true);
    try {
      const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, body: JSON.stringify({ prompt: chat, action: "miro_kitchen_help" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Miro is resting.");
      setChatAnswer(data.content); setCredits(data.creditsRemaining ?? credits);
    } catch (error) { setChatAnswer(error instanceof Error ? error.message : "Miro could not answer right now."); }
    finally { setThinking(false); }
  }

  return <main className="app-shell" data-theme={theme}>
    <Atmosphere />
    <header className="topbar">
      <button className="wordmark" onClick={() => setPage("home")} aria-label="Quiet Pantry home"><span className="mark"><Leaf size={19}/></span><span><b>Quiet Pantry</b><small>Cook once, live free</small></span></button>
      <div className="top-actions"><span className="credit-pill"><Sparkles size={14}/>{credits} credits</span><button className="avatar" onClick={() => setAuthOpen(true)} aria-label="Account">{email ? email.slice(0, 2).toUpperCase() : "IN"}</button></div>
    </header>
    <div className="world-layout">
      <aside className="rail" aria-label="Primary navigation">{nav.map(([id, Icon, label]) => <button key={id} onClick={() => setPage(id)} className={page === id ? "nav-button active" : "nav-button"}><Icon size={19}/><span>{label}</span></button>)}</aside>
      <section className="main-stage">{content}</section>
      {companion && <Miro chat={chat} setChat={setChat} answer={chatAnswer} thinking={thinking} onAsk={askMiro} onClose={() => setCompanion(false)} />}
    </div>
    <nav className="mobile-nav">{nav.map(([id, Icon, label]) => <button key={id} onClick={() => setPage(id)} className={page === id ? "active" : ""}><Icon size={18}/><span>{label}</span></button>)}</nav>
    {builderOpen && <RecipeBuilder onClose={() => setBuilderOpen(false)} onSave={(recipe) => { setRecipes((current) => [...current, recipe]); setBuilderOpen(false); }} />}
    {authOpen && <MagicLinkDialog currentEmail={email} onClose={() => setAuthOpen(false)} />}
  </main>;
}

function Atmosphere() { return <div className="atmosphere" aria-hidden="true"><i className="sun-orb"/><i className="haze haze-one"/><i className="haze haze-two"/><svg viewBox="0 0 1600 900" preserveAspectRatio="none"><path d="M0 690C250 590 390 740 590 645S940 515 1180 622s256-88 420-125V900H0Z"/><path d="M0 765c245-82 418 64 640-52s316 30 540-56c202-76 297 11 420-57V900H0Z"/></svg></div>; }

function HomeRoom({ t, dealItems, onPlan, onDeals, onRecipes }: { t: typeof copy.EN; dealItems: string[]; onPlan: () => void; onDeals: () => void; onRecipes: () => void }) {
  return <><section className="hero"><div><p className="eyebrow">QUIET PANTRY · WEEK 33</p><h1>{t.greeting}. <em>Let’s feed future you.</em></h1><p>{t.subtitle}</p><div className="hero-actions"><button className="primary" onClick={onPlan}><Sparkles size={17}/>{t.plan}</button><button className="secondary" onClick={onDeals}><ReceiptText size={17}/>{t.offers}</button></div></div><div className="hero-illustration"><div className="window-light"/><div className="counter"><span>🥔</span><span>🥕</span><span>🍄</span><span>🫙</span></div><div className="mouse-large">🐭</div></div></section>
    <section className="dashboard-grid"><article className="room-card plan-card"><div className="card-icon stove"><Flame size={20}/></div><p className="eyebrow">SUNDAY PREP</p><h2>One tray, six quiet meals.</h2><p>Roast pork, vegetables and potatoes. Keep two portions for the freezer.</p><div className="progress"><i style={{ width: "42%" }}/></div><div className="row-between"><span>42% ready</span><button onClick={onPlan}>Open plan <ChevronRight size={15}/></button></div></article>
      <article className="room-card deal-card"><div className="card-icon market"><ShoppingBasket size={20}/></div><p className="eyebrow">MARKET BOARD</p><h2>3 confirmed offers</h2><ul>{dealItems.slice(0, 3).map((item) => <li key={item}><span className="offer-dot"/>{item}</li>)}</ul><button onClick={onDeals}>Open deal desk <ChevronRight size={15}/></button></article>
      <article className="room-card freezer-card"><div className="card-icon freezer"><PackageOpen size={20}/></div><p className="eyebrow">FREEZER</p><h2>2 rescue portions</h2><p>Chili base · Lentil soup</p><button onClick={onRecipes}>Browse recipes <ChevronRight size={15}/></button></article>
    </section></>;
}

function PlanRoom({ onCook, onAsk }: { onCook: () => void; onAsk: () => void }) { return <section className="page-flow"><div className="page-heading"><div><p className="eyebrow">KITCHEN COUNTER</p><h1>Make one decision for the week.</h1><p>Build around your time, equipment, confirmed deals and freezer space.</p></div><button className="primary" onClick={onAsk}><Bot size={17}/>Ask Miro · 31 credits</button></div><div className="plan-steps"><span className="done">1 · Rhythm</span><span className="done">2 · Kitchen</span><span className="active">3 · Your week</span></div><div className="plan-board"><article className="plan-summary"><p className="eyebrow">YOUR CALM WEEK</p><h2>3-Day Batch + Freezer</h2><div className="chips"><span>4 hearty servings</span><span>Cheap this week</span><span>Oven + air fryer</span></div><div className="timeline"><div><b>Sunday</b><span>Roast pork tray + yoghurt sauce</span></div><div><b>Mon–Wed</b><span>Three ready-to-heat meals</span></div><div><b>Freezer</b><span>Two portions for rescue nights</span></div><div><b>Thu–Sun</b><span>Flexible pantry & freezer meals</span></div></div><button className="primary wide" onClick={onCook}><ChefHat size={17}/>Start Sunday prep</button></article><article className="equipment-card"><p className="eyebrow">YOUR KITCHEN</p><h2>Valid cooking paths</h2><div className="method-grid">{cookingMethods.map(({ label, Icon }) => <button key={label}><Icon size={18}/>{label}</button>)}</div><p className="hint">The plan only suggests methods that are valid for the selected recipe.</p></article></div></section>; }

function RecipeShelf({ recipes, onCreate }: { recipes: Recipe[]; onCreate: () => void }) { return <section className="page-flow"><div className="page-heading"><div><p className="eyebrow">RECIPE SHELF</p><h1>Your food memory lives here.</h1><p>Family classics, favourites, imports and your quick meals.</p></div><button className="primary" onClick={onCreate}><Plus size={17}/>Create recipe</button></div><div className="shelf-filters"><button className="active">All recipes</button><button><Heart size={14}/>Favourites</button><button>Family</button><button>Batch</button><button>Freezer</button></div><div className="recipe-grid">{recipes.map((recipe, index) => <article className="recipe-card" key={recipe.id}><div className={`recipe-photo recipe-photo-${index % 3}`}><span>{index === 0 ? "🍖" : "🥘"}</span><i>{recipe.duration}</i></div><div><div className="chips">{recipe.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><h2>{recipe.name}</h2><p>{recipe.servings} hearty servings · {recipe.equipment.join(" + ")}</p><button>Open recipe <ChevronRight size={15}/></button></div></article>)}</div></section>; }

function DealDesk({ dealText, setDealText, dealItems, setDealItems }: { dealText: string; setDealText: (value: string) => void; dealItems: string[]; setDealItems: (value: string[]) => void }) {
  function parseInput(value: string) { const items = value.split(/\n|,/).map((item) => item.trim()).filter(Boolean); if (items.length) setDealItems(items); }
  function loadFile(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; if (file.type.startsWith("text/") || file.name.endsWith(".txt")) file.text().then((text) => { setDealText(text); parseInput(text); }); else setDealText(`${file.name} is kept on this device. Add detected items below or ask Miro to interpret it (31 credits).`); }
  return <section className="page-flow"><div className="page-heading"><div><p className="eyebrow">MARKET BOARD</p><h1>Bring the shop into your kitchen.</h1><p>Paste text, add a .txt list, upload a leaflet or scan a receipt. Nothing is stored remotely.</p></div></div><div className="deal-grid"><article className="import-card"><div className="drop-zone"><Upload size={28}/><h2>Drop a leaflet, receipt or list</h2><p>PDF, image, camera or .txt. Files stay in this browser.</p><label className="secondary"><FileText size={16}/>Choose a file<input type="file" accept=".txt,text/plain,.pdf,image/*" onChange={loadFile}/></label></div><div className="or">or paste ingredient / offer text</div><textarea value={dealText} onChange={(event) => setDealText(event.target.value)} onBlur={(event) => parseInput(event.target.value)} placeholder={"Pork loin 5.43 BGN/kg\nPotatoes 1.65 BGN / 2.5 kg\nMushrooms 1.39 BGN"}/><p className="hint">Plain text parsing is free. Ask Miro only for a messy flyer or receipt.</p></article><article className="confirm-card"><p className="eyebrow">CONFIRM DETECTED ITEMS</p><h2>What should enter your Deal Memory?</h2><div className="confirm-list">{dealItems.map((item, index) => <div key={`${item}-${index}`}><span className="check">✓</span><input value={item} onChange={(event) => setDealItems(dealItems.map((old, i) => i === index ? event.target.value : old))}/><button aria-label="Remove item" onClick={() => setDealItems(dealItems.filter((_, i) => i !== index))}><X size={15}/></button></div>)}</div><button className="secondary wide" onClick={() => setDealItems([...dealItems, "New item"])}><Plus size={16}/>Add item</button><button className="primary wide"><ReceiptText size={17}/>Save locally to Deal Memory</button></article></div></section>;
}

function MoreRoom({ theme, setTheme, locale, setLocale, sound, setSound, companion, setCompanion }: { theme: Theme; setTheme: (theme: Theme) => void; locale: Locale; setLocale: (locale: Locale) => void; sound: boolean; setSound: (value: boolean) => void; companion: boolean; setCompanion: (value: boolean) => void }) { return <section className="page-flow settings-room"><div className="page-heading"><div><p className="eyebrow">QUIET SETTINGS</p><h1>Make the kitchen feel like yours.</h1></div></div><article className="settings-card"><h2><Languages size={20}/>Language</h2><div className="option-grid">{(["EN", "RU", "BG"] as Locale[]).map((item) => <button className={locale === item ? "selected" : ""} onClick={() => setLocale(item)} key={item}>{item === "EN" ? "English" : item === "RU" ? "Русский" : "Български"}</button>)}</div></article><article className="settings-card"><h2><Sun size={20}/>Atmosphere</h2><div className="theme-grid">{(["daylight", "dark", "pantry"] as Theme[]).map((item) => <button className={`theme-choice ${item} ${theme === item ? "selected" : ""}`} onClick={() => setTheme(item)} key={item}><i/>{item === "daylight" ? "Daylight Kitchen" : item === "dark" ? "Dark After-Hours" : "Quiet Pantry"}</button>)}</div></article><article className="settings-card toggle-card"><div><h2><Volume2 size={20}/>Kitchen sounds</h2><p>Only after you interact. Never essential to the plan.</p></div><Toggle value={sound} onChange={setSound}/></article><article className="settings-card toggle-card"><div><h2>🐭 Miro, your pantry mouse</h2><p>Local companion; AI is always a separate 31-credit action.</p></div><Toggle value={companion} onChange={setCompanion}/></article><article className="settings-card data-card"><div><h2>Local data</h2><p>Recipes, history, flyers and pantry remain in this browser. JSON export/import is coming with your connected account setup.</p></div><button className="danger"><Trash2 size={16}/>Delete local data</button></article></section>; }

function Toggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) { return <button className={value ? "toggle on" : "toggle"} onClick={() => onChange(!value)} aria-pressed={value}><i/></button>; }

function Miro({ chat, setChat, answer, thinking, onAsk, onClose }: { chat: string; setChat: (value: string) => void; answer: string; thinking: boolean; onAsk: () => void; onClose: () => void }) { return <aside className="miro"><button className="miro-close" onClick={onClose} aria-label="Hide Miro"><X size={15}/></button><div className="miro-head"><span className="miro-mouse">🐭</span><div><p className="eyebrow">MIRO’S CORNER</p><b>Your tiny kitchen genius</b></div></div><p className="miro-answer">{answer}</p><div className="quick-prompts"><button onClick={() => setChat("Make a 3-day batch plan from my leftovers.")}>Use leftovers</button><button onClick={() => setChat("Give me an air fryer version of my recipe.")}>Convert method</button></div><div className="miro-input"><input value={chat} onChange={(event) => setChat(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onAsk(); }} placeholder="Ask Miro anything…"/><button onClick={onAsk} disabled={thinking || !chat.trim()} aria-label="Ask Miro"><Send size={16}/></button></div><small>{thinking ? "Miro is thinking…" : "AI actions cost 31 credits"}</small></aside>; }

function RecipeBuilder({ onClose, onSave }: { onClose: () => void; onSave: (recipe: Recipe) => void }) { const [name, setName] = useState(""); const [servings, setServings] = useState(4); const [selected, setSelected] = useState<string[]>([]); const [method, setMethod] = useState("Oven"); return <div className="modal-backdrop" role="dialog" aria-modal="true"><section className="builder"><button className="builder-close" onClick={onClose}><X size={18}/></button><p className="eyebrow">NEW RECIPE</p><h1>Build dinner, not a spreadsheet.</h1><label>Recipe name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. My family chicken tray" autoFocus/></label><div className="builder-row"><label>Hearty servings<div className="stepper"><button onClick={() => setServings(Math.max(1, servings - 1))}>−</button><b>{servings}</b><button onClick={() => setServings(servings + 1)}>+</button></div></label><label>Cooking path<select value={method} onChange={(event) => setMethod(event.target.value)}>{["Oven", "Air fryer", "Pan", "Boil / simmer", "Steam", "Microwave", "Multicooker"].map((item) => <option key={item}>{item}</option>)}</select></label></div><p className="label-title">Tap ingredients to add</p><div className="ingredient-groups">{["Main protein", "Vegetables & aromatics", "Carbs, grains & legumes", "Dairy & eggs"].map((category) => <div key={category}><b>{category}</b><div>{ingredientSeed.filter((item) => item.category === category).map((item) => <button className={selected.includes(item.id) ? "ingredient selected" : "ingredient"} onClick={() => setSelected((items) => items.includes(item.id) ? items.filter((id) => id !== item.id) : [...items, item.id])} key={item.id}>{item.name}</button>)}</div></div>)}</div><button className="primary wide" onClick={() => onSave({ id: crypto.randomUUID(), name: name || "Untitled kitchen idea", servings, equipment: [method], duration: "45 min", tags: ["My recipe"], ingredients: selected.map((id) => ingredientSeed.find((item) => item.id === id)?.name || id), custom: true })}><Sparkles size={17}/>Save to my recipe shelf</button></section></div>; }

function MagicLinkDialog({ currentEmail, onClose }: { currentEmail: string; onClose: () => void }) { const [email, setEmail] = useState(currentEmail); const [notice, setNotice] = useState(""); async function sendLink() { const supabase = getSupabaseBrowser(); if (!supabase) { setNotice("Add the Supabase public URL and anon key first. See README.md."); return; } const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } }); setNotice(error ? error.message : "Magic link sent. Check your email, then return to your Quiet Pantry."); } return <div className="modal-backdrop" role="dialog" aria-modal="true"><section className="builder auth-dialog"><button className="builder-close" onClick={onClose}><X size={18}/></button><p className="eyebrow">YOUR QUIET PANTRY</p><h1>{currentEmail ? "You’re signed in." : "No passwords. Just a magic link."}</h1><p className="auth-copy">Your recipes and flyers stay in this browser. Signing in only unlocks credits and hosted Miro actions.</p><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoFocus/></label><button className="primary wide" onClick={sendLink}>Send magic link</button>{notice && <p className="auth-notice">{notice}</p>}</section></div>; }
