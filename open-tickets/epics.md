# JIRA Epics

## Context
- Product: `PIRATES! Caribbean`
- Platform: browser-based Canvas 2D game (`Vite` + `TypeScript`), tested in desktop Chrome and mobile emulation.
- Primary flows: sail the map, fight ships, capture/loot, visit ports, trade goods, buy upgrades, survive multiple days.
- Evidence base: code audit of `src/` plus live playthrough in Chrome on desktop and `390x844` mobile emulation. No code changes were made.
- Assumptions:
  - This backlog is a comprehensive pass over the current codebase and playable build, not a claim about every future runtime defect.
  - There is no existing save backend; persistence tickets assume local/browser-first storage unless future platform work changes that.
  - User-requested themes are explicitly included: proper archive logic, better and more unique boats, better graphics, and “award-winning super cool” improvements.

## Severity Scale
- S1: Blocker
- S2: Major
- S3: Minor
- S4: Polish

## Priority Scale
- P1: Must address in next milestone
- P2: High-value soon
- P3: Important after stability work
- P4: Nice-to-have / stretch

## Epics

### EPIC-001: Stabilize the core session loop
- Outcome: A run cannot soft-lock, keep punishing the player after defeat, or allow remote interaction exploits.
- Rationale: Reliability issues make balancing, QA, and player trust impossible.
- Impacted personas: `P1`, `P2`, `P3`
- Linked tickets: `TCK-001`, `TCK-002`, `TCK-003`, `TCK-004`, `TCK-005`, `TCK-006`, `TCK-007`, `TCK-008`, `TCK-009`

### EPIC-002: Close economy and edge-case integrity gaps
- Outcome: Trade, input, and UI edge cases behave consistently across desktop and mobile.
- Rationale: Current mismatches make the game feel unfair, confusing, or unreliable even when it does not crash.
- Impacted personas: `P1`, `P2`, `P3`
- Linked tickets: `TCK-010`, `TCK-011`, `TCK-012`, `TCK-013`, `TCK-014`, `TCK-015`

### EPIC-003: Deliver progression, archive logic, and pirate-fantasy depth
- Outcome: Long sessions feel coherent, trackable, and meaningfully pirate-themed instead of just surviving a sandbox loop.
- Rationale: The prototype has strong mechanics, but the midgame and long-term motivation are shallow.
- Impacted personas: `P2`, `P3`, `P4`
- Linked tickets: `TCK-016`, `TCK-017`, `TCK-018`, `TCK-019`, `TCK-020`, `TCK-021`

### EPIC-004: Ship better graphics and more unique boats
- Outcome: Boats, combat, and the Caribbean become instantly recognizable, premium-looking, and shareable.
- Rationale: Current visuals are readable but still feel like a functional prototype instead of a standout pirate adventure.
- Impacted personas: `P1`, `P3`, `P4`
- Linked tickets: `TCK-022`, `TCK-023`, `TCK-024`, `TCK-025`, `TCK-026`

### EPIC-005: Make the game award-winning super cool
- Outcome: The game creates memorable stories, surprise, spectacle, replayability, and recommendation-worthy moments.
- Rationale: This is the leap from “solid prototype” to “weekend-losing pirate obsession.”
- Impacted personas: `P2`, `P3`, `P4`
- Linked tickets: `TCK-027`, `TCK-028`, `TCK-029`, `TCK-030`
