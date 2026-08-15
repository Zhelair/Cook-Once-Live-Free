"use client";

import Image from "next/image";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

type Page = "home" | "plan" | "recipes" | "shop" | "more";
type Avatar = "juniper" | "rowan";
type Pet = "miro" | "scout";
type Facing = "down" | "left" | "right" | "up";

const stations: Array<{ id: string; label: string; action: string; page: Page; x: number; y: number }> = [
  { id: "fridge", label: "The fridge", action: "Check your ingredients", page: "recipes", x: 18, y: 42 },
  { id: "pantry", label: "Pantry wall", action: "See what is on hand", page: "recipes", x: 28, y: 27 },
  { id: "stove", label: "The cooker", action: "Start Sunday prep", page: "plan", x: 66, y: 42 },
  { id: "market", label: "Market door", action: "Open this week's deals", page: "shop", x: 85, y: 53 },
  { id: "desk", label: "Recipe nook", action: "Browse recipe book", page: "recipes", x: 13, y: 71 },
  { id: "table", label: "Planning table", action: "Shape your week", page: "plan", x: 69, y: 77 },
];

export function DollhouseScene({ deals, go, onMiro }: { deals: string[]; go: (page: Page) => void; onMiro: (prompt: string) => void }) {
  const [avatar, setAvatar] = useState<Avatar>("juniper");
  const [position, setPosition] = useState({ x: 48, y: 62 });
  const [facing, setFacing] = useState<Facing>("down");
  const [walking, setWalking] = useState(false);
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);
  const stopWalking = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nearby = useMemo(() => stations.map((station) => ({ station, distance: Math.hypot(position.x - station.x, position.y - station.y) })).filter(({ distance }) => distance < 12).sort((a, b) => a.distance - b.distance)[0]?.station, [position]);

  const move = (x: number, y: number) => {
    setFacing(Math.abs(x) > Math.abs(y) ? (x < 0 ? "left" : "right") : (y < 0 ? "up" : "down"));
    setWalking(true);
    if (stopWalking.current) clearTimeout(stopWalking.current);
    stopWalking.current = setTimeout(() => setWalking(false), 170);
    setPosition((current) => ({ x: Math.max(11, Math.min(87, current.x + x)), y: Math.max(30, Math.min(84, current.y + y)) }));
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const direction: Record<string, [number, number]> = { arrowup: [0, -3], w: [0, -3], arrowdown: [0, 3], s: [0, 3], arrowleft: [-3, 0], a: [-3, 0], arrowright: [3, 0], d: [3, 0] };
      const step = direction[event.key.toLowerCase()];
      if (step) { event.preventDefault(); move(...step); }
      if ((event.key.toLowerCase() === "e" || event.key === "Enter") && nearby) { event.preventDefault(); go(nearby.page); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); if (stopWalking.current) clearTimeout(stopWalking.current); };
  }, [nearby]);

  const speak = (which: Pet) => {
    setPet(which);
    setActiveStation(null);
  };

  return <section className="dollhouse room-enter" aria-label="Quiet Pantry interactive kitchen">
    <Image className="dollhouse-art" src="/kitchen-dollhouse-v1.png" alt="A sunlit Quiet Pantry kitchen" fill priority sizes="(max-width: 700px) 100vw, 1120px" />
    <div className="dollhouse-vignette" aria-hidden="true" />
    <header className="dollhouse-hud">
      <div><p>QUIET PANTRY</p><strong>Week 33 · a gentle rhythm</strong></div>
      <button className="dollhouse-journal" onClick={() => go("more")}>Journal <span>☰</span></button>
    </header>
    <div className="dollhouse-stations">
      {stations.map((station) => <button key={station.id} className={`dollhouse-station station-${station.id} ${activeStation === station.id || nearby?.id === station.id ? "is-near" : ""}`} style={{ left: `${station.x}%`, top: `${station.y}%` }} onClick={() => { setActiveStation(station.id); go(station.page); }} aria-label={`${station.action}: ${station.label}`}><span /><b>{station.label}</b></button>)}
    </div>
    <button className={`dollhouse-avatar avatar-${avatar} ${walking ? "is-walking" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%`, "--sprite-row": ({ down: 0, left: 1, right: 2, up: 3 }[facing]) } as CSSProperties} onClick={() => setAvatar((current) => current === "juniper" ? "rowan" : "juniper")} aria-label={`Switch avatar; current character is ${avatar}`}><span /></button>
    <button className="dollhouse-pet pet-miro" onClick={() => speak("miro")} aria-label="Talk to Miro the tuxedo cat"><span aria-hidden="true" /></button>
    <button className="dollhouse-pet pet-scout" onClick={() => speak("scout")} aria-label="Talk to Scout the Labrador"><span aria-hidden="true" /></button>
    {nearby && <button className="dollhouse-prompt" onClick={() => go(nearby.page)}><small>PRESS E</small>{nearby.action}</button>}
    {pet && <aside className={`dollhouse-dialog dialog-${pet}`} aria-label={`${pet === "miro" ? "Miro" : "Scout"} is ready to help`}>
      <button className="dialog-close" onClick={() => setPet(null)} aria-label="Close">×</button>
      <p>{pet === "miro" ? "MIRO · LEFTOVER SCOUT" : "SCOUT · PLAN PAL"}</p>
      <h2>{pet === "miro" ? "The mushrooms are waiting." : "Want to settle the week?"}</h2>
      <span>{pet === "miro" ? "I spotted a few things that could become dinner before they disappear into the back of the fridge." : "Give me one anchor meal. I’ll make the rest of the week feel much lighter."}</span>
      <div><button onClick={() => { setPet(null); onMiro(pet === "miro" ? "Help me turn what is already in my kitchen into a leftover rescue meal." : "Help me make a calm, simple plan for the next few meals."); }}>Ask {pet === "miro" ? "Miro" : "Scout"}</button><button onClick={() => { setPet(null); go(pet === "miro" ? "recipes" : "plan"); }}>{pet === "miro" ? "See recipes" : "Open plan"}</button></div>
    </aside>}
    <footer className="dollhouse-footer"><p>Walk with <kbd>W A S D</kbd> or <kbd>← ↑ ↓ →</kbd>. Touch a place to enter it.</p><span>{deals.length} market notes</span></footer>
  </section>;
}
