# CLAUDE.md - PIRATES! Caribbean

**The ultimate pirate map game.** Built by the ultimate game dev AI. No compromises.

## Vision

An open-world Caribbean pirate adventure with procedural world generation, naval combat, trading, crew management, and exploration. Mobile-first, pixel-art aesthetic, deeply strategic, endlessly replayable. The kind of game you lose weekends to.

**Reference prototype**: `briefing.html` — a working single-file proof of concept (DO NOT MODIFY). All mechanics proven there get rebuilt properly in the modular TypeScript codebase.

## Stack

- **Language**: TypeScript (strict mode, no `any`, ever)
- **Build**: Vite
- **Test**: Vitest (TDD — tests first, always)
- **Lint**: ESLint (strict, max-lines enforced)
- **Renderer**: Canvas 2D (pixel-art, `image-rendering: pixelated`)
- **Font**: Press Start 2P (retro pixel font)

## Quick Start

```bash
npm install
npm run dev          # Browser dev server
npm run test         # Vitest (watch mode)
npm run test:run     # Vitest (single run)
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run build        # Production build
```

**Quality gates (ALL must pass before any commit):**
```bash
npm run typecheck && npm run lint && npm run test:run && npm run build
```

## Architecture

**Strict modularity**: No file > 75 lines (150 max for complex files). Single responsibility. Pure functions. Composition over inheritance.

```
src/
  config/             # Constants, tuning, tile types, ship stats
    tiles.ts          # Tile type enum and properties
    ships.ts          # Ship classes, stats, upgrade paths
    weapons.ts        # Cannon types, damage tables
    economy.ts        # Trade goods, port prices, crew costs
    world.ts          # World gen parameters (size, seed, octaves)

  core/
    types.ts          # Branded types: ShipId, PortId, TileCoord, etc.
    rng.ts            # Deterministic Mulberry32 RNG (seed-based)
    noise.ts          # Perlin/simplex noise for world gen

  sim/                # Pure game logic — ZERO rendering, ZERO DOM
    world/
      gen.ts          # Procedural world generation (islands, reefs, ports)
      terrain.ts      # Terrain classification from noise values
      ports.ts        # Port placement, naming, faction assignment
    nav/
      pathfind.ts     # A* over water tiles, wind-aware
      wind.ts         # Wind system (direction, strength, seasons)
      movement.ts     # Ship movement, sail physics, current effects
    combat/
      naval.ts        # Broadside combat, boarding, flee mechanics
      damage.ts       # Hull damage, crew casualties, sinking
      loot.ts         # Plunder calculation, cargo capture
    economy/
      trade.ts        # Buy/sell goods, price fluctuation per port
      crew.ts         # Hire, pay, morale, mutiny risk
      upgrade.ts      # Ship upgrades, cannon purchases
    state/
      game-state.ts   # Central GameState type (immutable updates)
      turn.ts         # Day advancement, event triggers
      era.ts          # Era progression (fame thresholds)
    ai/               # THE SUPER GAMING AI
      strategy.ts     # AI captain decision tree
      tactics.ts      # Combat AI (engage/flee/board decisions)
      navigation.ts   # AI pathfinding and target selection
      personality.ts  # AI captain personalities (aggressive, trader, explorer)

  renderer/
    canvas/           # Canvas 2D pixel renderer
      map.ts          # World map rendering (tiles, fog of war)
      ships.ts        # Ship sprites, animations, wakes
      hud.ts          # Top bar (gold, crew, day, hull)
      minimap.ts      # Corner minimap
      combat.ts       # Combat animations, cannon fire
      menus.ts        # Port menu, capture menu overlays
      log.ts          # Event log overlay
    camera.ts         # Viewport, pan, zoom, follow-ship

  input/
    touch.ts          # Touch/tap controls (mobile-first)
    mouse.ts          # Mouse fallback for desktop
    keyboard.ts       # Keyboard shortcuts

  client/
    main.ts           # Entry point, game loop, init
    loop.ts           # requestAnimationFrame loop, delta time
```

## Core Game Mechanics

### World Generation
- 256x200 tile procedural map from deterministic seed
- Perlin noise octaves for terrain (deep sea, shallow, sand, grass, forest, hills, peaks, snow)
- Island chains with ports placed on coastlines
- Reef hazards in shallow waters

### Navigation & Wind
- Real-time ship movement on tile grid
- Wind direction and strength affect speed
- Sailing into wind = slow, with wind = fast
- Currents near coastlines

### Naval Combat
- Broadside cannon fire based on ship angle
- Hull HP system (visual health bar)
- Boarding actions (crew count matters)
- Flee mechanics (speed vs pursuer)
- Loot and cargo capture on victory

### Economy & Trading
- Multiple trade goods with per-port pricing
- Buy low, sell high across the Caribbean
- Crew wages and upkeep costs
- Ship upgrades (hull, cannons, sails)

### AI Captains
- Multiple AI ship captains roaming the map
- Personality-driven behavior (pirate hunter, merchant, explorer, raider)
- Tactical combat AI (engage when strong, flee when weak)
- Dynamic difficulty scaling with era progression

### Progression
- Fame system tracking player achievements
- Era advancement at fame thresholds (Era I -> II -> III)
- Stronger enemies and better loot in later eras
- Fleet building (capture and command multiple ships)

## Key Design Patterns

**Deterministic RNG**: Mulberry32 seeded PRNG. Same seed = same world, always.
```typescript
type Seed = Brand<number, 'Seed'>;
const rng = createRng(seed);
const value = rng.next();     // [0, 1)
const roll = rng.int(1, 6);   // 1-6
```

**Branded Types**: Type-safe IDs prevent mixing ship/port/tile references.
```typescript
type ShipId = Brand<number, 'ShipId'>;
type PortId = Brand<number, 'PortId'>;
type TileX = Brand<number, 'TileX'>;
type TileY = Brand<number, 'TileY'>;
```

**Immutable State**: GameState is never mutated. All updates return new state.
```typescript
function advanceDay(state: GameState): GameState { ... }
function applyDamage(state: GameState, target: ShipId, amount: number): GameState { ... }
```

**Sim/Renderer Split**: `sim/` is 100% pure logic with zero DOM or Canvas dependencies. Renderers consume state and draw. This means:
- Game logic is fully testable without a browser
- AI can play the game headlessly
- Renderer is swappable (canvas today, WebGL tomorrow, CLI for testing)

## TDD Rules

**Tests come first.** Write the test, watch it fail, write the code, watch it pass. No exceptions.

- Every module in `sim/` has a corresponding `*.test.ts`
- Tests use real game state, not mocks
- Deterministic RNG means tests are reproducible
- Test file lives next to source: `sim/combat/naval.ts` -> `sim/combat/naval.test.ts`

```bash
npm run test         # Watch mode during development
npm run test:run     # CI / pre-commit gate
```

## AI System

The AI is not an afterthought — it's a first-class citizen. AI captains use the same `sim/` functions as the player. No cheating, no omniscience.

- **Fog of war**: AI only acts on what it can see
- **Personality matrix**: Each captain has weighted preferences (aggression, greed, caution, exploration)
- **Decision tree**: Evaluate nearby threats, trade opportunities, unexplored areas
- **Combat tactics**: Positioning, broadside timing, boarding vs cannon, retreat threshold

Goal: An AI good enough that watching two AI captains fight is entertaining.

## Code Quality Standards

- TypeScript strict mode (`strict: true`, `noUncheckedIndexedAccess: true`)
- ESLint with `max-lines: 75` rule
- No `any` types — ever
- Explicit return types on all exported functions
- Named exports only (no default exports)
- No magic numbers — all constants in `config/`
- No boolean parameters — use options objects or enums
- Max 4 parameters per function
- Functions <= 30 lines
- Early returns over nested conditionals
- Fail fast, fail loud — no silent swallowing of errors

## Extending

**Add new ship type:**
1. Add to `config/ships.ts`
2. Add sprite data in renderer
3. Test in `sim/` with existing combat/movement tests

**Add new trade good:**
1. Add to `config/economy.ts`
2. Update port price tables
3. Test trade calculations

**Add new AI personality:**
1. Add weight profile in `sim/ai/personality.ts`
2. Test decision outputs against known scenarios

## Deployment

```bash
npm run build        # Outputs to dist/
# Single index.html + assets, deployable anywhere
# Cloudflare Pages, Vercel, or plain static hosting
```
