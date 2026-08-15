# Quiet Pantry — Isometric Dollhouse Plan

## Decision

Build a 2.5D isometric dollhouse, not a WebGL/3D-engine game. It uses CSS transforms and layered inline SVG sprites, giving us a premium physical world while staying fast and touch-friendly on mobile.

## World shell

- The kitchen hub is a continuous scene. Pantry/freezer, market door, recipe nook and planning table are in-world zones.
- Character movement is tile based: tap-to-move on mobile; arrows/WASD on desktop; every object is still a focusable button.
- A 44px journal/map button provides the full text navigation fallback. There is no permanent tab rail.
- Existing features open as a bottom sheet on mobile and side panel on desktop, layered above the still-mounted scene. Objects set `?room=<id>` so deep links and Back work.

## Technical model

- `lib/iso.ts`: 2:1 isometric tile conversion and depth sorting.
- Static room layout is typed data: floor/walls, furniture footprints, blocked tiles, interactions and doors.
- Floor/walls are a small number of SVG layers. Furniture, player and pets are sorted by painter depth.
- Movement uses a small grid and BFS pathfinding; per-frame position/camera updates mutate transforms through refs rather than React re-renders.
- Camera follows the player with breakpoint scale: phone 1.0, tablet 1.25, desktop 1.4. It dollies toward the object when a sheet opens.
- Reduced motion teleports between tiles and disables ambient animation.

## Pets

- Miro (tuxedo cat): leftovers, expiring ingredients, pantry rescue.
- Scout (Labrador): weekly anchor, plan drafting, quiet encouragement.
- Pets wander/follow/idle in the scene and surface small choice cards. AI supplies copy and suggestions only; every action is a fixed, useful product action.

## Avatar and living-room detail

- The player has two simple, friendly base avatars: female and male. The choice is made once, is reversible in the journal, and persists locally. Each base has a small set of preset clothing colours rather than a character-editor UI.
- Avatar art is layered inline SVG: shadow, legs, torso, head and hair. It uses idle breathing, a four-frame walk and a simple interaction pose. CSS variables drive preset skin, hair and clothing palettes.
- The room background follows an isometric material system: warm oak counters/floor, speckled cream ceramic/paper and painted herb-green cabinetry. A single warm window key light and cool bounce shadow give every object consistent depth.
- Zone dressing is stateful, not purely decorative: pantry jars have full/half/empty variants, fridge shows leftover containers, planning cards fan out as the week fills, market tote/list changes with the market state, evening adds sconce/fairy-light layers.
- Ambient life is deliberately capped: dust motes, kettle steam, fairy-light flicker, plant sway, clock hand and window-light drift. Reduced-motion shows their static first frame.

## Pet life system

- Pets use a shared tick-based state model: sleep, doze, wander, follow, prop interaction, react, greet and nudge. Logic ticks every 500ms; movement reuses the room pathfinder.
- Miro prefers high/sunny pantry and fridge areas; he reacts to expiring ingredients and leftovers.
- Scout prefers the planning table, recipe nook and market door; he reacts to an unfinished plan or market list.
- Only one useful pet nudge can be visible at once, with a cooldown. Pets yield to player walk tiles and never gate movement.

## Delivery milestones

1. **Foundation** — isometric grid, camera, movement, collision, temporary room art behind a feature flag.
2. **Interactions** — objects/doors, journal, sheets mapped to all current product functions, URL/back support.
3. **Living world** — player, pet behavior, sprite layers, ambient light/dust/steam.
4. **Polish** — final zone art, camera choreography, door transitions, full mobile and accessibility QA.
5. **Cutover** — replace the old shell after core flows and performance pass.

## Quality gates

- 60fps walking/camera on a 2020-era Android phone.
- No React render per animation frame; transform-only motion.
- Every core flow remains reachable through both the scene and the journal.
- 44px touch targets, visible focus states, `prefers-reduced-motion`, and no dead ends.
- Scene code under 180KB gzipped; sprite bundle under 60KB when final SVG art is produced.
