# Quiet Pantry — Kimi working brief

## Product

Quiet Pantry helps a household choose one anchor meal, use what it already has, turn it into a calm week of meals, and buy only what the plan needs.

## Design direction

- **Kitchen Atlas:** an editorial, tactile cooking workspace — never a generic dashboard.
- The product should feel like a physical kitchen/workbench: recipe cards, prep tokens, shelf labels, handwritten or stamped marks, useful motion and visible progress.
- The experience must work on touch screens first. Desktop can expand into a richer workspace, but no functionality may depend on hover.
- Tone: unhurried, practical, warm, quietly clever. No cartoon game HUD, gamified points, or visual clutter.

## Existing vocabulary

- Colours: cream paper, herb green, paprika orange, butter yellow, ink green.
- Typography: Fraunces display + DM Sans body + DM Mono labels.
- Core rooms: Kitchen, Week, Recipe book, Market, Studio.
- Core actions: make a weekly plan, capture a deal/receipt, save a recipe, use leftovers/freezer portions.

## Technical boundaries

- Next.js 15, React 19, TypeScript, CSS only; lucide-react and next/image are available.
- No new dependencies. Prefer CSS and inline SVG layers.
- Preserve keyboard interaction, obvious focus state, 44px touch targets, responsive layouts, and `prefers-reduced-motion`.
- Give code in small, independently complete patches (one component or stylesheet section at a time), not a full app dump.
