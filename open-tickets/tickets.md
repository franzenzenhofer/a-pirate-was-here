# JIRA Tickets

## Personas
- `P1`: New mobile pirate; wants intuitive sailing, clear feedback, and short fun sessions on a phone.
- `P2`: Systems captain; plays on desktop/laptop, optimizes trade routes, upgrades, and combat efficiency.
- `P3`: Long-run corsair; wants campaign continuity, fleet growth, history tracking, and meaningful progression.
- `P4`: Spectacle seeker / streamer; wants unique boats, jaw-dropping moments, better graphics, and memorable pirate stories.

## Task Scripts Used For Audit
- `P1`: Launch game, sail, tap ports, survive first combat, understand HUD on mobile.
- `P2`: Trade goods, compare prices, buy upgrades, optimize cargo, pressure-test progression rules.
- `P3`: Disable and capture ships, build a fleet, look for archive/history, test long-session viability.
- `P4`: Seek standout encounters, strong visual identity, high-impact combat, and replay hooks.

## Tickets

### TCK-001: Stop the run cleanly when the player ship sinks
- Epic: `EPIC-001`
- Type: `Bug`
- Severity: `S1`
- Priority: `P1`
- Persona: `P1`
- Scenario: First combat loss in a live session.
- Steps:
  1. Start a run and let enemy cannon fire reduce player hull to `0`.
  2. Leave the session open for `10-20` seconds without reloading.
- Expected: The game enters one terminal game-over state and stops applying damage, wages, day progression, and repeated sink messaging.
- Actual: Hull reaches `0`, but days continue, crew/gold can continue changing, enemies keep hitting, and sink logs repeat.
- IS: Defeat is not a true state transition.
- SHOULD: Defeat resolve once into a frozen game-over state with clear next actions.
- Reasoning: Repeated punishment after death feels broken, not hard, and destroys trust in every system layered on top of combat.
- Code hints: `src/client/update.ts`, `src/client/cballs.ts`, `src/client/main.ts`
- Acceptance criteria:
  - No further combat damage, wage drain, or era/day progression occurs after player hull reaches `0`.
  - Only one defeat event is logged per sink.
  - The game exposes a single, intentional game-over state.

### TCK-002: Require proximity before opening the capture menu
- Epic: `EPIC-001`
- Type: `Bug`
- Severity: `S1`
- Priority: `P1`
- Persona: `P3`
- Scenario: Disabling an enemy ship at range.
- Steps:
  1. Disable an enemy ship with cannon fire.
  2. Stay far away or continue moving elsewhere.
- Expected: Capture/boarding options become available only when the player sails close enough to board.
- Actual: A delayed capture menu can auto-open even when the player is nowhere near the disabled ship.
- IS: The game bypasses proximity and boarding fantasy.
- SHOULD: Disabled ships remain on the map until the player explicitly closes distance and interacts.
- Reasoning: Remote capture breaks immersion, strategy, and the risk/reward loop of naval combat.
- Code hints: `src/client/cballs.ts`, `src/client/main.ts`, `src/renderer/canvas/menus.ts`
- Acceptance criteria:
  - Capture UI opens only within a defined boarding radius.
  - Disabled ships persist in a resolvable state until claimed, looted, burned, or lost.
  - Ranged combat alone cannot trigger capture resolution.

### TCK-003: Prevent prize-ship claims from leaving the game paused
- Epic: `EPIC-001`
- Type: `Bug`
- Severity: `S1`
- Priority: `P1`
- Persona: `P3`
- Scenario: Claiming a disabled enemy as a prize ship.
- Steps:
  1. Disable a ship and open the capture menu.
  2. Choose `CLAIM PRIZE SHIP`.
- Expected: The menu closes, the game resumes, and the claim is fully resolved.
- Actual: The claim path can close the menu without clearing the paused state, leaving the run effectively soft-locked.
- IS: One capture outcome does not complete the pause lifecycle.
- SHOULD: Every capture action resolve pause, effects, fleet bookkeeping, and UI consistently.
- Reasoning: Soft-locks are blocker defects and make the most exciting fantasy moment unusable.
- Code hints: `src/renderer/canvas/menus.ts`, `src/client/main.ts`, `src/client/cballs.ts`
- Acceptance criteria:
  - Claiming a prize ship always restores live gameplay.
  - Capture outcomes share one resolution path for pause/unpause behavior.
  - QA can execute all capture actions without freezing the session.

### TCK-004: Gate port interaction by player distance instead of camera tap location
- Epic: `EPIC-001`
- Type: `Bug`
- Severity: `S1`
- Priority: `P1`
- Persona: `P2`
- Scenario: Exploiting ports by panning the camera to distant locations.
- Steps:
  1. Pan the camera to a far-away port while the player ship remains elsewhere.
  2. Tap the port on the map.
- Expected: Distant taps do not open trading, upgrades, tribute, or attack actions unless the player ship is actually in range.
- Actual: Port menus can open based on tap position alone, regardless of ship distance.
- IS: Camera position acts like global teleport-interaction.
- SHOULD: Port actions require actual docking/proximity rules.
- Reasoning: Remote interaction invalidates travel, threat, and economy balance across the whole map.
- Code hints: `src/client/main.ts`, `src/input/touch.ts`, `src/renderer/canvas/labels.ts`
- Acceptance criteria:
  - Port menus only open when player-to-port distance is within a defined docking threshold.
  - Distant taps either set a navigation target or show a “too far to dock” response.
  - Trading, upgrades, tribute, and attacks cannot be triggered from across the map.

### TCK-005: Apply neutral-port price modifiers to real transactions
- Epic: `EPIC-001`
- Type: `Bug`
- Severity: `S2`
- Priority: `P1`
- Persona: `P2`
- Scenario: Trading at a neutral port after reading “higher prices.”
- Steps:
  1. Open a neutral port’s trade menu and note the displayed price.
  2. Buy or sell a good and compare the displayed price to the actual gold delta.
- Expected: Displayed prices and the actual transaction math match.
- Actual: The UI multiplies displayed neutral-port prices, but buy/sell logic still uses the unmodified base port price.
- IS: The trade UI and economy logic disagree.
- SHOULD: Display, logs, and balance all use the same price source.
- Reasoning: Economy trust collapses when the player cannot rely on the price on screen.
- Code hints: `src/renderer/canvas/menus.ts`, `src/sim/economy/trade.ts`
- Acceptance criteria:
  - Neutral-port modifiers affect both displayed and charged/paid prices.
  - Buy and sell logs match the exact gold delta.
  - Automated tests cover display-vs-transaction parity.

### TCK-006: Make sail upgrades reachable for the starting ship and each class
- Epic: `EPIC-001`
- Type: `Bug`
- Severity: `S2`
- Priority: `P1`
- Persona: `P2`
- Scenario: Early-game player attempts to buy speed improvements.
- Steps:
  1. Start a run with the default `BRIGANTINE`.
  2. Open upgrades and look for a sail-speed path.
- Expected: The starting ship can meaningfully upgrade sails until it reaches a class-appropriate cap.
- Actual: The sail upgrade is blocked by a hard condition below the starting brigantine speed.
- IS: One advertised upgrade path is effectively dead on arrival.
- SHOULD: Every ship class should have a reachable, balanced speed progression or a clearly explained reason it does not.
- Reasoning: Dead upgrade branches make the upgrade menu feel fake and reduce build variety.
- Code hints: `src/sim/economy/upgrade.ts`, `src/config/ships.ts`, `src/client/main.ts`
- Acceptance criteria:
  - The starting ship can access at least one sail upgrade tier.
  - Speed caps are class-aware rather than globally hardcoded in the wrong range.
  - Upgrade copy explains limits clearly.

### TCK-007: Preserve or compensate prior upgrades when changing ship class
- Epic: `EPIC-001`
- Type: `Bug`
- Severity: `S2`
- Priority: `P2`
- Persona: `P2`
- Scenario: Player invests in hull, range, or sails before upgrading hull class.
- Steps:
  1. Buy one or more stat upgrades.
  2. Purchase the next ship-class upgrade.
- Expected: Prior investments carry forward as modifiers or are refunded/converted explicitly.
- Actual: The ship-class upgrade resets many stats to the new hull’s base values.
- IS: Progress can be erased by using the upgrade system as intended.
- SHOULD: Upgrade paths should stack cleanly or compensate transparently.
- Reasoning: Hidden stat resets punish experimentation and feel like the game stole earned progress.
- Code hints: `src/sim/economy/upgrade.ts`, `src/config/ships.ts`
- Acceptance criteria:
  - Existing upgrades persist across class changes or convert into refunds/credits.
  - Upgrade previews explain what carries forward.
  - Player stats after upgrade match the previewed outcome.

### TCK-008: Restrict treasure spawning to believable beaches and coastlines
- Epic: `EPIC-001`
- Type: `Bug`
- Severity: `S2`
- Priority: `P2`
- Persona: `P1`
- Scenario: Treasure hunt based on the on-screen tutorial prompt.
- Steps:
  1. Read the prompt that says treasure is on beaches.
  2. Inspect treasure spawn behavior across the map.
- Expected: Treasure appears on beaches or obvious coastal tiles.
- Actual: Spawn rules allow `GRASS`, so treasure can appear inland and off-theme.
- IS: Tutorial messaging and world rules are inconsistent.
- SHOULD: Treasure placement match the player-facing fantasy and travel clues.
- Reasoning: Treasure hunts are stronger when location logic feels readable and thematic.
- Code hints: `src/sim/state/spawn.ts`, `src/client/update.ts`, `src/renderer/canvas/effects.ts`
- Acceptance criteria:
  - Treasure only spawns on beach or coast-adjacent tiles.
  - Tutorial copy and actual spawn behavior match.
  - Tests cover inland exclusion and spacing rules.

### TCK-009: Add a real game-over flow instead of “reload to continue”
- Epic: `EPIC-001`
- Type: `UX`
- Severity: `S2`
- Priority: `P1`
- Persona: `P1`
- Scenario: A player loses a run and needs a clear next step.
- Steps:
  1. Let the player ship sink.
  2. Try to understand how to continue.
- Expected: The game shows a clear loss screen with restart/new-run actions and a readable summary.
- Actual: The session relies on repeated log text telling the player to reload.
- IS: The end-state UX is debug-like rather than game-like.
- SHOULD: Defeat should feel intentional, respectful, and easy to recover from.
- Reasoning: A great loss screen softens frustration, teaches, and encourages one-more-run behavior.
- Code hints: `src/client/main.ts`, `src/client/update.ts`, `index.html`
- Acceptance criteria:
  - A game-over overlay appears on defeat.
  - The overlay offers restart/new-run actions without manual browser reload.
  - The player sees useful summary data such as day, fame, kills, and fleet size.

### TCK-010: Fix mixed-price cargo cost averaging
- Epic: `EPIC-002`
- Type: `Bug`
- Severity: `S2`
- Priority: `P1`
- Persona: `P2`
- Scenario: Trader buys the same good at very different prices across ports.
- Steps:
  1. Buy a good once at a low price and again at a high price.
  2. Sell later and inspect profit reporting.
- Expected: Average buy price reflects quantity-weighted cost.
- Actual: Average cost is recalculated with a simple two-price mean, which becomes wrong for uneven quantities.
- IS: Profit numbers drift away from the actual economy.
- SHOULD: Profit/loss be based on weighted average acquisition cost.
- Reasoning: Traders need trustworthy math; otherwise the economy becomes guesswork.
- Code hints: `src/sim/economy/trade.ts`, `src/sim/economy/trade.test.ts`
- Acceptance criteria:
  - Buying additional units recalculates cost by weighted average.
  - Profit/loss math matches actual spend history.
  - Unit tests cover uneven quantity mixes and multiple purchases.

### TCK-011: Prevent overlapping capture prompts when multiple ships disable together
- Epic: `EPIC-002`
- Type: `Bug`
- Severity: `S2`
- Priority: `P2`
- Persona: `P3`
- Scenario: Large combat where multiple ships become disabled in a short window.
- Steps:
  1. Disable multiple nearby ships quickly.
  2. Watch capture prompts and pause state.
- Expected: The game resolves one capture prompt at a time in a controlled queue.
- Actual: Multiple delayed prompts can race, overlap, or interrupt the current modal flow.
- IS: Modal timing is unmanaged across combat outcomes.
- SHOULD: Capture prompts be serialized or collapsed into a single state machine.
- Reasoning: Combat resolution should feel decisive, not like modal roulette.
- Code hints: `src/client/cballs.ts`, `src/renderer/canvas/menus.ts`, `src/client/main.ts`
- Acceptance criteria:
  - Only one capture modal may be active at once.
  - Additional disabled ships wait in a queue or remain interactable on-map.
  - Pause state stays correct through chained combat resolutions.

### TCK-012: Accept intentional long taps on mobile without dropping input
- Epic: `EPIC-002`
- Type: `UX`
- Severity: `S3`
- Priority: `P2`
- Persona: `P1`
- Scenario: One-thumb mobile navigation in a live play session.
- Steps:
  1. Press and release a stationary tap slightly slower than the current threshold.
  2. Try to navigate or interact.
- Expected: Deliberate taps remain reliable within realistic human timing.
- Actual: Stationary touches over the cutoff are ignored even if the player never intended to pan.
- IS: The tap model is too brittle for real thumbs.
- SHOULD: Mobile input distinguish intended taps from pans using richer timing/movement heuristics.
- Reasoning: Lost taps on mobile make the game feel laggy and hostile even when performance is fine.
- Code hints: `src/input/touch.ts`, `src/client/main.ts`
- Acceptance criteria:
  - Slow but stationary taps still register predictably.
  - Pan-vs-tap logic is validated on real-device timings.
  - Input tuning does not create accidental navigation during pans.

### TCK-013: Clear drag state when pointer release happens outside the canvas
- Epic: `EPIC-002`
- Type: `Bug`
- Severity: `S3`
- Priority: `P2`
- Persona: `P1`
- Scenario: Desktop mouse drag or touch gesture that leaves the canvas bounds.
- Steps:
  1. Start panning the camera.
  2. Release the pointer outside the canvas or cancel the gesture.
- Expected: Input state resets and the next tap starts cleanly.
- Actual: Missing cancel/outside-release handling can leave stale drag state behind.
- IS: Pointer lifecycle is incomplete.
- SHOULD: Mouse/touch/pointer exits reset interaction state reliably.
- Reasoning: Sticky input bugs are frustrating because the player feels the controls “mysteriously broke.”
- Code hints: `src/input/touch.ts`, `index.html`
- Acceptance criteria:
  - Releasing outside the canvas resets pan state.
  - `mouseleave`, `pointercancel`, and equivalent flows are handled.
  - The next click/tap behaves like a fresh interaction.

### TCK-014: Rework mobile HUD, minimap, and menu layout for portrait play
- Epic: `EPIC-002`
- Type: `UX`
- Severity: `S2`
- Priority: `P2`
- Persona: `P1`
- Scenario: First session on a portrait phone screen.
- Steps:
  1. Open the game at roughly `390x844` portrait.
  2. Sail, read the HUD, and view overlays.
- Expected: The player gets enough information without sacrificing too much playable world space.
- Actual: HUD density and minimap footprint consume a large portion of the mobile viewport and reduce scanning clarity.
- IS: Mobile-first intent is not fully realized in layout.
- SHOULD: Mobile layout adapt through scaling, collapsing, and better information hierarchy.
- Reasoning: A strategy/action game lives or dies on readable moment-to-moment scanning.
- Code hints: `index.html`, `src/renderer/canvas/hud.ts`, `src/renderer/canvas/minimap.ts`
- Acceptance criteria:
  - Portrait layout preserves more world visibility.
  - Minimap can collapse, shrink, or switch modes on small screens.
  - Menus remain readable and tappable without obscuring core play.

### TCK-015: Improve trade feedback for profit, loss, and cargo constraints
- Epic: `EPIC-002`
- Type: `UX`
- Severity: `S3`
- Priority: `P3`
- Persona: `P2`
- Scenario: Trader needs clear buy/sell outcomes and capacity context.
- Steps:
  1. Buy goods until cargo fills or funds run low.
  2. Sell at a loss and inspect UI feedback.
- Expected: The trade UI shows hold capacity, profit/loss clearly, and styles negative outcomes appropriately.
- Actual: Sell interactions skew positive in presentation, and capacity context is mostly hidden.
- IS: Trading works, but the feedback loop is opaque.
- SHOULD: Every transaction communicate value, constraints, and consequence clearly.
- Reasoning: Strong economy UX helps players form strategies instead of clicking experimentally.
- Code hints: `src/renderer/canvas/menus.ts`, `src/sim/economy/trade.ts`
- Acceptance criteria:
  - Trade UI shows current cargo usage and remaining capacity.
  - Loss-making sales are visually distinct from profitable ones.
  - Buy/sell feedback includes before/after gold and quantity context.

### TCK-016: Move era progression from day-count only to fame-driven milestones
- Epic: `EPIC-003`
- Type: `Gameplay`
- Severity: `S2`
- Priority: `P2`
- Persona: `P3`
- Scenario: Player expects accomplishments to drive world escalation.
- Steps:
  1. Read the game vision/progression expectations.
  2. Play a passive session and observe era advancement.
- Expected: Eras reflect pirate fame, achievements, or a clear hybrid rule.
- Actual: Era progression advances strictly from day count.
- IS: Progression rewards survival time more than pirate accomplishment.
- SHOULD: Eras unlock from meaningful achievements the player can understand and chase.
- Reasoning: Achievement-driven progression creates agency, pacing, and better run stories.
- Code hints: `src/sim/state/progression.ts`, `src/renderer/canvas/hud.ts`, `CLAUDE.md`
- Acceptance criteria:
  - Era thresholds align with fame and/or explicit milestone rules.
  - The next progression target is visible to the player.
  - Era changes unlock more than just hidden spawn pressure.

### TCK-017: Turn claimed fleet ships into real gameplay instead of a HUD number
- Epic: `EPIC-003`
- Type: `Gameplay`
- Severity: `S2`
- Priority: `P2`
- Persona: `P3`
- Scenario: Player claims multiple ships expecting fleet-building payoff.
- Steps:
  1. Capture and claim one or more prize ships.
  2. Look for tactical or economic fleet impact.
- Expected: Claimed ships create meaningful gameplay benefits or decisions.
- Actual: Fleet state is mostly a token list used to increase the displayed fleet count.
- IS: Fleet-building fantasy is promised but not delivered mechanically.
- SHOULD: Claimed ships provide escort, reserve, sell, assign, or support functions.
- Reasoning: A pirate fleet is a core fantasy pillar and one of the most motivating progression hooks.
- Code hints: `src/renderer/canvas/menus.ts`, `src/core/types.ts`, `src/renderer/canvas/hud.ts`
- Acceptance criteria:
  - Claimed ships create at least one functional gameplay outcome.
  - Fleet UI communicates actual fleet roles or value.
  - Fleet systems interact with combat, economy, or progression in a visible way.

### TCK-018: Add pirate reputation and nation hostility consequences
- Epic: `EPIC-003`
- Type: `Gameplay`
- Severity: `S2`
- Priority: `P2`
- Persona: `P2`
- Scenario: Player raids ports and expects the world to care.
- Steps:
  1. Attack ports or act like an obvious pirate.
  2. Visit ports from various nations afterward.
- Expected: Nations react differently based on the player’s actions and reputation.
- Actual: Relations are shallow, and many non-pirate ports feel friendly by default.
- IS: The world lacks diplomatic memory.
- SHOULD: Pirate behavior create consequences, blacklists, bounties, safe havens, and strategic tradeoffs.
- Reasoning: Faction consequence makes the Caribbean feel alive and gives port choices weight.
- Code hints: `src/sim/state/progression.ts`, `src/sim/world/ports.ts`, `src/renderer/canvas/menus.ts`, `src/config/ports.ts`
- Acceptance criteria:
  - Nation stance changes based on raids, tribute, and hostility.
  - Port services vary by current reputation.
  - Players can understand why a port is friendly, neutral, or hostile.

### TCK-019: Replace random “sell plunder” payouts with a real loot economy
- Epic: `EPIC-003`
- Type: `Gameplay`
- Severity: `S2`
- Priority: `P2`
- Persona: `P2`
- Scenario: Player uses plunder systems after raids and captures.
- Steps:
  1. Raid ports or win captures.
  2. Use the `SELL PLUNDER` action.
- Expected: Payout depends on what the player actually looted.
- Actual: The action returns a random amount detached from cargo, raid contents, or ship loot state.
- IS: One economy loop is effectively slot-machine logic.
- SHOULD: Plunder be represented as real inventory/value that ports convert under understandable rules.
- Reasoning: Random sell values flatten strategy and make progression feel arbitrary.
- Code hints: `src/renderer/canvas/menus.ts`, `src/sim/economy/trade.ts`, `src/core/types.ts`
- Acceptance criteria:
  - Plunder is stored in a real data structure.
  - Sale value derives from actual loot contents and port modifiers.
  - Logs explain what was sold and why it was worth that amount.

### TCK-020: Implement proper captain’s log archive logic
- Epic: `EPIC-003`
- Type: `Gameplay`
- Severity: `S3`
- Priority: `P2`
- Persona: `P3`
- Scenario: Long-session player wants to review what happened in their campaign.
- Steps:
  1. Play long enough to trigger multiple fights, treasures, upgrades, and faction events.
  2. Try to review earlier history.
- Expected: Important events are archived in a persistent, reviewable captain’s log.
- Actual: The visible log only shows a short transient window and offers no player-facing archive.
- IS: Session history disappears before it can support strategy or storytelling.
- SHOULD: The game keep a proper archive of key events with timestamps/categories and sensible retention.
- Reasoning: Archive logic is essential for long-form pirate fantasy, debugging, save summaries, and post-run storytelling.
- Code hints: `src/renderer/canvas/log.ts`, `src/client/debug.ts`, `src/sim/state/game-state.ts`, `index.html`
- Acceptance criteria:
  - Event log entries roll into a persistent archive instead of only fading away.
  - Players can review key events such as captures, port wars, upgrades, and legendary encounters.
  - Archive behavior is defined for active session and future save/load flows.

### TCK-021: Restore deterministic seeded simulation and keep `sim/` pure
- Epic: `EPIC-003`
- Type: `Technical Foundation`
- Severity: `S3`
- Priority: `P3`
- Persona: `P3`
- Scenario: QA or design wants reproducible runs from the same seed.
- Steps:
  1. Compare the architecture goals against the current simulation code.
  2. Trace how randomness and UI side effects are handled in simulation modules.
- Expected: Same seed should reproduce key simulation behavior, and `sim/` should not touch DOM/UI directly.
- Actual: Many systems still use `Math.random`, and some simulation files directly access DOM or renderer log hooks.
- IS: Determinism and modular purity are only partially implemented.
- SHOULD: Simulation run off seeded randomness and emit state/events instead of touching UI primitives.
- Reasoning: This improves replayability, debugging, save fidelity, automated testing, and long-term maintainability.
- Code hints: `src/sim/state/progression.ts`, `src/sim/ai/strategy.ts`, `src/sim/combat/boarding.ts`, `src/sim/combat/damage.ts`
- Acceptance criteria:
  - Core sim systems use seeded RNG instead of ambient randomness.
  - `sim/` modules no longer access `document` or renderer-specific concerns directly.
  - Repro steps for seed-based bugs become reliable.

### TCK-022: Add better and more unique boats across roles, eras, and factions
- Epic: `EPIC-004`
- Type: `Gameplay`
- Severity: `S3`
- Priority: `P2`
- Persona: `P4`
- Scenario: Returning player wants a richer ship roster and clearer combat identity.
- Steps:
  1. Play several encounters across different enemy roles.
  2. Compare how ships look and feel.
- Expected: Boats feel collectible, distinct, and strategically different.
- Actual: The roster is readable but narrow, with limited silhouette and role differentiation.
- IS: Ship variety is more stat ladder than fantasy roster.
- SHOULD: The game offer better, more unique boats with unique silhouettes, behaviors, and role identity.
- Reasoning: Unique ships are one of the fastest ways to make a pirate game feel premium and memorable.
- Code hints: `src/config/ships.ts`, `src/sim/state/spawn.ts`, `src/renderer/canvas/ships.ts`, `src/renderer/canvas/labels.ts`
- Acceptance criteria:
  - The roster expands beyond the current basic ladder with clearly distinct roles.
  - Rare, elite, or legendary ship types exist and are visually obvious.
  - Spawn logic, balance, and naming communicate each boat’s identity.

### TCK-023: Add better graphics for ships, sails, damage states, and faction identity
- Epic: `EPIC-004`
- Type: `Art`
- Severity: `S3`
- Priority: `P2`
- Persona: `P4`
- Scenario: Combat readability and visual appeal during live action.
- Steps:
  1. Observe friendly and enemy ships during sailing and combat.
  2. Compare class, faction, and damage readability.
- Expected: Players can read ship class, allegiance, and condition instantly.
- Actual: Ships are serviceable but highly abstract, with limited faction differentiation and damage storytelling.
- IS: Visual readability depends too much on labels and color alone.
- SHOULD: Better graphics make ships readable through silhouette, sail plan, faction dressing, and damage states.
- Reasoning: Strong ship art upgrades both tactical readability and emotional payoff.
- Code hints: `src/renderer/canvas/ships.ts`, `src/config/ships.ts`, `src/config/ports.ts`
- Acceptance criteria:
  - Each ship class has a more unique silhouette.
  - Faction identity is visible through flags, palettes, or ornamentation.
  - Damaged, disabled, and burning states are visually distinct.

### TCK-024: Add better graphics for the world, ports, sea states, and weather
- Epic: `EPIC-004`
- Type: `Art`
- Severity: `S3`
- Priority: `P2`
- Persona: `P4`
- Scenario: Exploration should feel like sailing through a living Caribbean.
- Steps:
  1. Sail across several regions and inspect island/port presentation.
  2. Compare environmental variety and mood over time.
- Expected: The world communicates place, danger, and atmosphere through richer art.
- Actual: Map presentation is readable but visually sparse and low on environmental storytelling.
- IS: The world feels more tactical than magical.
- SHOULD: Better graphics deepen beaches, reefs, jungle, ports, surf, weather, and water animation.
- Reasoning: Exploration becomes more rewarding when the world itself feels desirable to traverse.
- Code hints: `src/renderer/canvas/map.ts`, `src/renderer/canvas/minimap.ts`, `src/config/tiles.ts`, `src/sim/nav/wind.ts`
- Acceptance criteria:
  - Environment art shows stronger biome identity and water variation.
  - Ports look inhabited and distinct from generic land tiles.
  - Weather and sea conditions have visual expression beyond HUD text.

### TCK-025: Add better graphics and combat juice for broadsides, hits, and sinking
- Epic: `EPIC-004`
- Type: `Art`
- Severity: `S3`
- Priority: `P2`
- Persona: `P4`
- Scenario: A fight should create “clip this” moments.
- Steps:
  1. Enter repeated ship combat and watch a volley, disable, and sink sequence.
  2. Compare impact feedback to the importance of the outcome.
- Expected: Major combat outcomes feel explosive, clear, and exciting.
- Actual: Current effects are readable but relatively modest for the fantasy.
- IS: Combat communicates function more than spectacle.
- SHOULD: Better graphics add muzzle flashes, smoke, splinters, wakes, impact shocks, camera feedback, and dramatic sinking sequences.
- Reasoning: “Super cool” combat juice is one of the clearest multipliers on player delight and shareability.
- Code hints: `src/renderer/canvas/effects.ts`, `src/client/cballs.ts`, `src/sim/combat/damage.ts`, `src/renderer/canvas/ships.ts`
- Acceptance criteria:
  - Every hit type has stronger visual confirmation.
  - High-value events like disable, burn, sink, and port assault feel cinematic.
  - Effects remain readable and do not obscure tactical information.

### TCK-026: Add adaptive audio, music, and ambient pirate atmosphere
- Epic: `EPIC-004`
- Type: `Audio`
- Severity: `S4`
- Priority: `P3`
- Persona: `P4`
- Scenario: A long session needs emotional pacing, not silence.
- Steps:
  1. Play a session that includes sailing, port visits, and combat.
  2. Evaluate how the game sounds across those moods.
- Expected: Music and sound create tension, relief, and identity.
- Actual: The current experience is effectively silent.
- IS: Audio fantasy is missing.
- SHOULD: The game include adaptive music plus sea, harbor, weather, crew, and cannon ambience.
- Reasoning: Strong audio is a major part of making the game feel expensive, finished, and memorable.
- Code hints: `src/client/main.ts`, `src/client/loop.ts`, `index.html`
- Acceptance criteria:
  - Exploration, combat, and ports each have distinct audio mood.
  - Core actions have satisfying SFX.
  - The player has accessible volume and mute controls.

### TCK-027: Add legendary world events and boss encounters
- Epic: `EPIC-005`
- Type: `Gameplay`
- Severity: `S3`
- Priority: `P2`
- Persona: `P4`
- Scenario: Returning players want unexpected, memorable encounters.
- Steps:
  1. Reach midgame and continue sailing the map.
  2. Look for event variety beyond basic spawn escalation.
- Expected: The world can surprise the player with event-driven stories.
- Actual: Difficulty mostly scales through enemy counts, tiers, and routine encounters.
- IS: Midgame surprise factor is limited.
- SHOULD: The Caribbean generate legendary convoys, ghost fleets, storm hunts, sea monsters, mutinies, and naval crises.
- Reasoning: Rare set-piece encounters are key to making the game feel award-winning and recommendation-worthy.
- Code hints: `src/sim/state/progression.ts`, `src/sim/state/spawn.ts`, `src/sim/state/game-state.ts`
- Acceptance criteria:
  - Rare event chains can spawn with clear stakes and rewards.
  - Events vary by era, region, and reputation.
  - The game surfaces these moments clearly in HUD/log/archive.

### TCK-028: Add quests, treasure maps, rumors, and recurring rival captains
- Epic: `EPIC-005`
- Type: `Gameplay`
- Severity: `S3`
- Priority: `P2`
- Persona: `P3`
- Scenario: Players want direction and narrative arcs between sandbox loops.
- Steps:
  1. Visit multiple ports and progress into the midgame.
  2. Look for authored goals or persistent rivalries.
- Expected: Ports and world systems provide hooks that create story-like campaign arcs.
- Actual: The sandbox is mostly self-directed and lacks structured narrative pressure.
- IS: The game relies heavily on emergent play alone.
- SHOULD: Ports offer quests, treasure leads, rumor chains, and rivals that persist across encounters.
- Reasoning: Narrative scaffolding makes systems feel purposeful and amplifies emotional attachment.
- Code hints: `src/sim/world/ports.ts`, `src/sim/state/game-state.ts`, `src/renderer/canvas/menus.ts`
- Acceptance criteria:
  - Ports can offer at least one repeatable mission/rumor loop.
  - Rival captains can reappear and escalate over time.
  - Quest/map rewards connect to economy, fleet, or unique ship content.

### TCK-029: Add save/load, seed selection, and campaign milestone tracking
- Epic: `EPIC-005`
- Type: `Gameplay`
- Severity: `S2`
- Priority: `P2`
- Persona: `P3`
- Scenario: Long-run player wants continuity and sharable runs.
- Steps:
  1. Play a meaningful run.
  2. Try to leave and return later or share the run with someone else.
- Expected: Runs persist, seeds are reusable, and major milestones are preserved.
- Actual: Sessions are disposable and effectively tied to the current page state.
- IS: Long-term retention loops are missing.
- SHOULD: The game support save/load, visible seed choice, and milestone history.
- Reasoning: Persistence is one of the biggest unlocks for deeper progression and player ownership.
- Code hints: `src/client/main.ts`, `src/sim/state/game-state.ts`, `src/core/rng.ts`
- Acceptance criteria:
  - Runs can be saved and resumed locally.
  - Seed values can be viewed, copied, and reused.
  - Milestones such as captures, legendaries, and era clears are tracked across sessions.

### TCK-030: Add accessibility and options polish for an award-winning finish
- Epic: `EPIC-005`
- Type: `Accessibility`
- Severity: `S3`
- Priority: `P3`
- Persona: `P1`
- Scenario: Broader audience wants comfortable, readable, customizable play.
- Steps:
  1. Try the game with different device sizes and comfort needs.
  2. Look for ways to adjust readability, controls, or motion.
- Expected: Players can tailor the experience to their needs.
- Actual: The game has minimal options and assumes one visual/control profile.
- IS: Comfort and accessibility are under-served.
- SHOULD: The game offer remappable controls, text scale, reduced motion, color-safe indicators, HUD toggles, and assist options.
- Reasoning: Accessibility polish broadens audience and is a hallmark of truly finished games.
- Code hints: `index.html`, `src/input/touch.ts`, `src/input/keyboard.ts`, `src/renderer/canvas/hud.ts`
- Acceptance criteria:
  - An options/settings surface exists.
  - Core accessibility settings persist between sessions.
  - Critical combat and status information remains readable on small screens and for low-vision/color-vision users.
