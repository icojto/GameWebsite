# HRISTO STUDIOS / POR WEB GAME FACTORY
# GAME 003 — LAST RELAY
# FINAL DESIGN + ART + ENGINEERING + CODEX IMPLEMENTATION PROMPT v1.0

Use Hristo Studios Prompt Operations.

============================================================
CODEX EXECUTION RECOMMENDATION
============================================================

Recommended model:
GPT-6 Astra

Fallback:
GPT-5.6 Sol

Reasoning:
HIGH

Execution strategy:

one bounded implementation branch
→ lifecycle/combat tests
→ performance sanity test
→ playable build
→ Hristo QA

============================================================
0. ROLE
============================================================

You are CODEX implementing:

GAME 003 — LAST RELAY

This is the Factory's active-entity / combat / lifecycle experiment.

Do not create a generic tower-defence engine.

Do not build the larger future IP.

============================================================
1. GAME IDENTITY
============================================================

Fantasy:

Defend the final operational communications relay on an abandoned sci-fi outpost from relentless hostile machines.

Genre:

Lane defence / light strategy.

Session:

5–10 minutes.

Orientation:

LANDSCAPE.

Player input:

Touch + mouse.

Keyboard is development-only.

Factory proof:

- active entities
- clean spawn/despawn
- health/damage
- combat
- waves
- data-driven variants
- bounded runtime scaling
- mobile landscape controls
- profiling/performance awareness

============================================================
2. FORGE v0.1 DESIGN DEFAULTS
============================================================

The source design left unresolved:

- static tower placement vs lane-level defence
- upgrade timing
- simultaneous enemy target

Use these v0.1 implementation defaults.

BATTLEFIELD:

3 horizontal lanes.

Enemies travel:

spawn edge
→ along lane
→ relay/base endpoint

No pathfinding.

Each enemy's movement may be represented by:

lane ID
+
scalar lane progress

DEFENCE SLOTS:

One fixed defence slot per lane.

Total:

3 slots.

Player taps a defence slot and selects one of exactly TWO defence types.

Defences may be bought or replaced during:

PREPARING
and
WAVE_ACTIVE

if enough energy exists.

Replacing a defence costs the full price of the new defence.

No selling/refund system in v0.1.

No upgrade tree.

============================================================
3. TWO DEFENCE TYPES
============================================================

DEFENCE A — RAPID TURRET

Role:

cheap
fast fire
lower per-shot damage
good against runners / normal enemies

Suggested initial properties:

cost ≈ 50
rapid cooldown
moderate range covering its lane
single-target

DEFENCE B — HEAVY CANNON

Role:

more expensive
slow fire
high damage
good against heavy enemies

Suggested:

cost ≈ 75
slow cooldown
high per-hit damage
single-target

Use short visual tracers/projectile effects.

Do not require physics projectiles if timed/hitscan resolution is simpler and clearer.

Both defences auto-target the foremost valid enemy in their lane.

No manual aiming.

============================================================
4. ENEMY VARIANTS
============================================================

Use ONE visual enemy body family.

Exactly three stat profiles are allowed:

STANDARD
RUNNER
HEAVY

Suggested relative multipliers:

STANDARD:
HP 1.0
Speed 1.0
Base damage 1

RUNNER:
HP ~0.65
Speed ~1.35
Base damage 1

HEAVY:
HP ~2.3–2.5
Speed ~0.65
Base damage 2

All values centralized and tunable.

Visually differentiate using:

scale
marking
emissive accent
speed

not unique expensive animation/assets.

============================================================
5. ENERGY
============================================================

Energy is the only purchase resource.

Starting energy:

approximately enough for two Rapid Turrets.

Suggested:

100

Enemy kills reward energy.

Example starting range:

Standard: 10
Runner: 8
Heavy: 15

Exact balance centralized.

Energy may never silently go below zero.

No secondary currencies.

============================================================
6. BASE / RELAY
============================================================

Relay has HP.

Suggested initial:

10

Enemy reaching the endpoint:

→ damages Relay
→ enemy is removed exactly once

Relay HP <= 0:

DEFEAT.

============================================================
7. WAVES
============================================================

Exactly:

10 waves.

Use data-driven wave definitions.

No state machine state per wave.

Approximate escalation:

Waves 1–2:
small Standard/Runner groups

Waves 3–4:
larger groups + first Heavy

Waves 5–7:
mixed lane pressure

Waves 8–9:
denser mixed formations

Wave 10:
strong final pressure using existing variants only

Target simultaneous enemies:

normal:
~4–7

hard upper target:
10 visible/active enemies

Avoid exceeding 10 in v0.1 unless profiling proves it remains readable and Hristo explicitly accepts it.

WIN:

wave 10 spawning complete
AND
all active enemies defeated
AND
Relay HP > 0

============================================================
8. GAME STATE
============================================================

Use:

BOOT
MENU
PREPARING
WAVE_ACTIVE
WAVE_COMPLETE
RESULT

RESULT:

VICTORY
DEFEAT

Optional PAUSED only if actually exposed.

Between waves:

brief PREPARING/WAVE_COMPLETE state.

No upgrade menu.

Player retains energy and installed defences.

============================================================
9. ARCHITECTURE
============================================================

Maintain small explicit responsibilities.

Potential shape:

Bootstrap
→ Input
→ MatchController
→ WaveDirector
→ Enemy Runtime/Lifecycle
→ Defence Runtime
→ Combat Resolution
→ Energy
→ Relay HP
→ Result Evaluator
→ Presentation

Responsibilities:

MatchController:
current wave
phase
overall progression

WaveDirector:
wave definition
spawn schedule
lane assignment
spawn completion

EnemyRuntime:
HP
lane
progress
speed
damage
state

EnemyLifecycle:
spawn
death
endpoint removal
cleanup

DefenceRuntime:
type
lane
cooldown
target selection
attack

CombatResolver:
apply damage
death once
reward once

EnergyEconomy:
energy

BaseHealth:
Relay HP

ResultEvaluator:
victory/failure

Do not create:

ECS
behaviour tree
generic combat framework
generic ability framework
universal tower hierarchy
pathfinding

============================================================
10. VISUAL NORTH STAR
============================================================

Mood:

LONELY MILITARY SCI-FI UNDER SIEGE.

Not:

colorful tower defence
grim horror
UI clutter

Palette:

terrain:
charcoal / cold blue-gray

lane markings:
muted steel / cyan

Relay:
cyan-white

player defence:
cyan / blue

hostiles:
orange / red

Heavy:
deeper red

energy:
cyan or violet

critical Relay HP:
red

============================================================
11. VISUAL HIERARCHY
============================================================

During combat:

1. enemy position
2. Relay/base condition
3. endangered lane
4. defence location/state
5. energy
6. wave progress

Landscape:

TOP:
Wave
Relay HP
Energy

CENTER:
three lanes occupying majority of screen

BOTTOM:
defence selection / slot controls

Do not cover lane endpoints with UI.

============================================================
12. ART SCOPE
============================================================

Prefer procedural/simple sprites.

Required visual concepts:

static battlefield/background
3 lane paths
relay/base
1 enemy body family
variant markings
2 defence silhouettes
attack tracer/projectile treatment
HP display
energy
wave indicator
placement/selection state
enemy damage/death feedback
victory/defeat overlays

Estimated visual complexity is deliberately low-medium.

Do not create bespoke enemy illustrations.

============================================================
13. TOUCH
============================================================

Large logical defence slots.

Player should not need pixel-perfect tower selection.

Pointer abstraction:

Touch / Mouse
→ hit region
→ slot/defence intent

UI touches must be distinguishable from gameplay area touches.

No keyboard required.

============================================================
14. ANIMATION / VFX
============================================================

Minimum:

enemy translation
small bob/tilt optional
hit flash
death burst
defence activation
tower recoil
attack tracer
Relay hit reaction
HP update
wave-start warning
victory transmission pulse

VFX:

small muzzle flash
small projectile/tracer
3–5 debris/spark pieces on death
Relay damage pulse
danger lane pulse

No particle storms.

No expensive distortion.

No persistent translucent lane wash.

============================================================
15. PERFORMANCE
============================================================

This is the first actual entity-scale factory experiment.

Watch:

per-enemy update loops
target scanning
projectile churn
timers
particles
allocations
render overdraw
cleanup failures

Because there are only 3 lanes:

avoid global expensive target searches.

Each defence should query only its own lane's active enemies.

Hard-bound the number of active enemies to the data-driven wave design.

Pooling:

OPTIONAL.

Use only if actual create/destroy churn justifies it.

Do not create a generic Factory pooling service.

============================================================
16. CONFIGURATION
============================================================

Centralize:

wave definitions
enemy variant stats
spawn timing
lane selection
starting energy
kill rewards
turret costs
turret damage
turret cooldown
Relay HP
wave delay
maximum target entity count where useful
feedback timing

Changing a wave should not require changing WaveDirector logic.

============================================================
17. PERSISTENCE
============================================================

v0.1 persistence:

settings
best completion/result record

No mid-match save.

No campaign save.

Use localStorage with safe fallback.

============================================================
18. TESTS
============================================================

Test without rendering where practical:

wave definitions load
correct spawn counts
correct lanes
damage lowers HP
death fires once
energy reward fires once
endpoint Relay damage fires once
enemy cleanup occurs once
energy cannot become invalid
defence purchase requires energy
invalid placement rejected
defence replacement behaves correctly
final wave + zero enemies → victory
Relay HP <= 0 → defeat
cleanup leaves no active references

Add a maximum-pressure test:

10 enemies
+
3 active defences
+
attack/death VFX

Observe:

update stability
allocation/churn if measurable
frame pacing where practical

Do not claim mobile performance from desktop-only execution.

============================================================
19. RESPONSIVE TARGET
============================================================

Landscape-first.

Support:

desktop
mobile landscape
resizing

Phone readability:

enemy must communicate:

hostile
variant
alive/dead

through silhouette/size/state.

Do not rely on tiny decorative details.

============================================================
20. PROJECT PRE-FLIGHT
============================================================

Verify:

working directory
Git
branch
HEAD
remote
working tree
Node/npm
package.json
Phaser
TypeScript
Vite
existing files

If intentional empty repository:

initialize minimum Phaser + TypeScript + Vite project.

Suggested branch:

codex/game-003-last-relay

No automatic merge.

============================================================
21. FACTORY REUSE
============================================================

Reuse proven simple infrastructure where actually available:

bootstrap
pointer normalization
responsive viewport
small settings storage

Do not create cross-game package automatically.

Remain Game 003-specific:

waves
lanes
enemy runtime
defences
energy economy
Relay/base HP

Do not promote combat/health/pooling into Factory Core after one game.

============================================================
22. DO NOT BUILD
============================================================

No:

pathfinding
boss
new maps
enemy roster
tower upgrade tree
status effect framework
multiplayer
large projectile engine
ECS
campaign
meta progression
online leaderboard
backend
payments
analytics
POR infrastructure

============================================================
23. VALIDATION
============================================================

Run actual equivalents:

npm install
npm run build
type check

npm run dev -- --host 127.0.0.1
npm run preview -- --host 127.0.0.1

git diff --check
git status

Runtime where possible:

standalone placement
all defence types
waves
enemy variants
Relay damage
energy reward
victory
defeat
restart
10-entity pressure case
repeated restarts
console errors

============================================================
24. HUMAN QA
============================================================

Hristo verifies:

- three lanes readable instantly
- controls comfortable on phone
- player makes actual lane-priority decisions
- pressure rises over 10 waves
- the two defence choices feel meaningfully different
- destruction feels satisfying
- enemies remain readable at high population
- Relay always obvious
- VFX never obscure threats
- game remains playable with reduced effects

============================================================
25. DEFINITION OF DONE
============================================================

[ ] 3 lanes
[ ] 2 defence types
[ ] exactly one enemy visual family
[ ] Standard/Runner/Heavy variants
[ ] energy economy
[ ] Relay HP
[ ] 10 waves
[ ] complete victory
[ ] complete defeat
[ ] touch/mouse
[ ] no pathfinding
[ ] entity lifecycle clean
[ ] rewards/damage fire once
[ ] max intended population bounded
[ ] responsive landscape
[ ] config-driven waves/stats
[ ] persistence limited
[ ] build passes
[ ] performance sanity test recorded
[ ] no generic combat engine
[ ] no backend/network/payment
[ ] committed branch
[ ] no merge

============================================================
26. FINAL REPORT
============================================================

Return:

# CODEX — LAST RELAY GAME 003 EXECUTION REPORT

Repository:
Branch:
Final commit:

Architecture:
Match:
Waves:
Enemies:
Defences:
Combat:
Energy:
Relay HP:

Wave data:
Maximum enemy target:

Art implementation:
Touch:
Responsive:

Performance:
Entity lifecycle:
Pooling used:
Reason:

Persistence:

Tests:
Pressure test:
Build:
Runtime:
Console:

Real-device QA:

NOT TESTED:
Known limitations:

Git:
Files:

Human QA next:

Next action:

============================================================
27. STOP
============================================================

STOP after Game 003 build + validation + commit.

Do not begin Game 004.

Next:

Aegis
→ Hristo playtest/performance QA.