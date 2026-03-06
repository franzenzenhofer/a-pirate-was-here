# Closed JIRA Tickets

## Closed Tickets

### TCK-001: Stop the run cleanly when the player ship sinks
- Epic: `EPIC-001`
- Status: `Closed`
- Resolution: defeat now enters a stable game-over state instead of continuing to drain or damage the player.

### TCK-002: Require proximity before opening the capture menu
- Epic: `EPIC-001`
- Status: `Closed`
- Resolution: disabled ships now require boarding-range interaction instead of remote resolution.

### TCK-003: Prevent prize-ship claims from leaving the game paused
- Epic: `EPIC-001`
- Status: `Closed`
- Resolution: capture outcomes now complete the pause lifecycle correctly.

### TCK-004: Gate port interaction by player distance instead of camera tap location
- Epic: `EPIC-001`
- Status: `Closed`
- Resolution: port actions now require actual proximity to the player ship.

### TCK-005: Apply neutral-port price modifiers to real transactions
- Epic: `EPIC-001`
- Status: `Closed`
- Resolution: neutral trade modifiers now affect both UI prices and transaction math.

### TCK-006: Make sail upgrades reachable for the starting ship and each class
- Epic: `EPIC-001`
- Status: `Closed`
- Resolution: ship-class-aware sail limits now allow meaningful early sail upgrades.

### TCK-007: Preserve or compensate prior upgrades when changing ship class
- Epic: `EPIC-001`
- Status: `Closed`
- Resolution: ship upgrades now preserve the upgrade stack instead of silently wiping prior investment.

### TCK-008: Restrict treasure spawning to believable beaches and coastlines
- Epic: `EPIC-001`
- Status: `Closed`
- Resolution: treasure spawning now uses shoreline checks and no longer appears inland.

### TCK-009: Add a real game-over flow instead of “reload to continue”
- Epic: `EPIC-001`
- Status: `Closed`
- Resolution: the loss overlay now supports restart/fresh-run flow with a run summary.

### TCK-010: Fix mixed-price cargo cost averaging
- Epic: `EPIC-002`
- Status: `Closed`
- Resolution: cargo stacking now uses weighted-average cost and matching profit math.

### TCK-012: Accept intentional long taps on mobile without dropping input
- Epic: `EPIC-002`
- Status: `Closed`
- Resolution: mobile tap timing is more forgiving and no longer rejects reasonable long taps.

### TCK-013: Clear drag state when pointer release happens outside the canvas
- Epic: `EPIC-002`
- Status: `Closed`
- Resolution: pointer cancel, leave, window mouseup, and blur now clear stale drag state.

### TCK-014: Rework mobile HUD, minimap, and menu layout for portrait play
- Epic: `EPIC-002`
- Status: `Closed`
- Resolution: the HUD was simplified for portrait play, the minimap can stay hidden, and world visibility improved materially.

### TCK-016: Move era progression from day-count only to fame-driven milestones
- Epic: `EPIC-003`
- Status: `Closed`
- Resolution: era progression now keys off fame thresholds rather than day-count alone.

### TCK-019: Replace random “sell plunder” payouts with a real loot economy
- Epic: `EPIC-003`
- Status: `Closed`
- Resolution: plunder is now stored explicitly and sold via real port-value rules.

### TCK-020: Implement proper captain’s log archive logic
- Epic: `EPIC-003`
- Status: `Closed`
- Resolution: session events now roll into a player-facing captain’s log archive.

### TCK-022: Add better and more unique boats across roles, eras, and factions
- Epic: `EPIC-004`
- Status: `Closed`
- Resolution: the ship roster now includes clearer role pools, more ship classes, generated ship names, and a legendary hull.

### TCK-011: Prevent overlapping capture prompts when multiple ships disable together
- Epic: `EPIC-002`
- Status: `Closed`
- Resolution: disabled ships now queue into a single capture resolver so pause ownership stays stable.

### TCK-015: Improve trade feedback for profit, loss, and cargo constraints
- Epic: `EPIC-002`
- Status: `Closed`
- Resolution: trade rows now show explicit buy/sell gold deltas, profit-per-unit, loss warnings, and free hold space.

### TCK-017: Turn claimed fleet ships into real gameplay instead of a HUD number
- Epic: `EPIC-003`
- Status: `Closed`
- Resolution: fleet roles now surface in the HUD and settings while escorts/raiders affect defense and boarding strength.

### TCK-018: Add pirate reputation and nation hostility consequences
- Epic: `EPIC-003`
- Status: `Closed`
- Resolution: ports now explain their stance, vary service pricing by nation, and react to tribute, drinks, raids, and colors.

### TCK-021: Restore deterministic seeded simulation and keep `sim/` pure
- Epic: `EPIC-003`
- Status: `Closed`
- Resolution: seeded RNG now drives spawning, morale, boarding, wind, raids, and encounter flow while `sim/` emits events for UI effects.

### TCK-023: Add better graphics for ships, sails, damage states, and faction identity
- Epic: `EPIC-004`
- Status: `Closed`
- Resolution: ships now render stronger silhouettes, ghost translucency, monster forms, torn disabled states, and more readable damage cues.

### TCK-024: Add better graphics for the world, ports, sea states, and weather
- Epic: `EPIC-004`
- Status: `Closed`
- Resolution: fog zones, buried-X callouts, richer port cards, pickups, surf detail, and atmospheric overlays make the world read as more alive.

### TCK-025: Add better graphics and combat juice for broadsides, hits, and sinking
- Epic: `EPIC-004`
- Status: `Closed`
- Resolution: cursed shots, treasure blasts, monster stun cues, screen shake, and stronger hit effects now add readable combat spectacle.

### TCK-026: Add adaptive audio, music, and ambient pirate atmosphere
- Epic: `EPIC-004`
- Status: `Closed`
- Resolution: the client now plays distinct sea, port, combat, weather, mutiny, and treasure cues with persisted audio settings.

### TCK-027: Add legendary world events and boss encounters
- Epic: `EPIC-005`
- Status: `Closed`
- Resolution: the world now spawns multiple encounter families including Megalodon, Ghost Fleet, siren fog, rivals, and false-island bosses.

### TCK-028: Add quests, treasure maps, rumors, and recurring rival captains
- Epic: `EPIC-005`
- Status: `Closed`
- Resolution: ports now sell rumors, elite pirates drop real secret maps, and rival captains now recur as tracked campaign foes.

### TCK-029: Add save/load, seed selection, and campaign milestone tracking
- Epic: `EPIC-005`
- Status: `Closed`
- Resolution: runs now expose active seed copy/restart flow, preserve preferred seeds, and persist milestone history across saves.

### TCK-030: Add accessibility and options polish for an award-winning finish
- Epic: `EPIC-005`
- Status: `Closed`
- Resolution: settings now expose text scaling, reduced motion, color-safe HUD, master audio, sea/music levels, and inspect support.

### TCK-031: Add `Gold Fever` state and a mid-sea loot-sharing HUD action
- Epic: `EPIC-006`
- Status: `Closed`
- Resolution: the HUD now surfaces unshared loot, a fever timer, and a direct share-loot action at sea.

### TCK-032: Add the `HYPED` buff as a high-risk combat payoff for sharing loot
- Epic: `EPIC-006`
- Status: `Closed`
- Resolution: sharing loot now grants visible HYPED speed/reload buffs with readable timers and combat impact.

### TCK-033: Add mutiny betrayal encounters with stolen-gold recovery
- Epic: `EPIC-006`
- Status: `Closed`
- Resolution: ignored fever now spawns mutineers near the player and defeating them recovers the stolen gold.

### TCK-034: Add dynamic port-arrival crew reactions and tavern chaos
- Epic: `EPIC-006`
- Status: `Closed`
- Resolution: ports now trigger volunteers, desertion, tavern spend, and brawls based on fame, hull state, and unshared loot.

### TCK-035: Add merchant intimidation and extortion cargo drops
- Epic: `EPIC-007`
- Status: `Closed`
- Resolution: weak merchants now panic under high player fame and jettison floating cargo before the fight fully starts.

### TCK-036: Add “rich coward” hunter pressure when gold outpaces fame
- Epic: `EPIC-007`
- Status: `Closed`
- Resolution: gold-heavy low-fame captains now attract dedicated hunter spawns.

### TCK-037: Add fame-and-gold port powers for buying legend and demanding tribute
- Epic: `EPIC-007`
- Status: `Closed`
- Resolution: ports now support buying drinks for fame and demanding tribute once the player’s legend is feared enough.

### TCK-038: Add secret map drops and broadside-to-reveal buried treasure
- Epic: `EPIC-008`
- Status: `Closed`
- Resolution: secret maps now mark buried treasure beaches and cannon fire into the coast reveals the stash.

### TCK-039: Replace hard-stuck coastline behavior with tactical drift
- Epic: `EPIC-008`
- Status: `Closed`
- Resolution: high-speed coast collisions now drift, chip hull, and keep momentum instead of dead-locking the ship.

### TCK-040: Add the Megalodon charge-stun fight and tooth reward
- Epic: `EPIC-008`
- Status: `Closed`
- Resolution: the Megalodon now circles, charges, can be stunned by a nose shot, and drops a permanent ram-upgrade tooth.

### TCK-041: Add the Ghost Fleet and cursed-fire crew attacks
- Epic: `EPIC-008`
- Status: `Closed`
- Resolution: ghost ships now fire cursed broadsides that attack crew morale instead of only hull.

### TCK-042: Add Siren fog zones with steering lock and cannon-noise escape
- Epic: `EPIC-008`
- Status: `Closed`
- Resolution: siren fog now steals the helm, drains crew, and can be broken with a manual broadside action.

### TCK-043: Add the False Island / Crab Leviathan shell-break fight
- Epic: `EPIC-008`
- Status: `Closed`
- Resolution: some treasure maps now reveal a false island that becomes a crab boss requiring an exposed-belly ram.
