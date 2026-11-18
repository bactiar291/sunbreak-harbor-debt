# Sunbreak: Harbor Debt

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/bactiar291/sunbreak-harbor-debt/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/bactiar291/sunbreak-harbor-debt/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

An original Canvas2D crime game in a warm coastal city. Play Ren Vale: meet Mara
at Night Market, steal the marked syndicate coupe, deliver it, recover a guarded
ledger, lose the patrol and reach the Marsh safehouse. Both completed contracts
remain completed in free roam. Traffic, walking, driving, gunfire, police pursuit,
finite ammunition, save/load, pause and defeat/restart run locally in the browser.

The seeded city has cream, terracotta and seafoam roofs, shaded facades, shop
awnings, rooftop gardens, palms, a tiled market courtyard, marina and lighthouse
safehouse. All art is original Canvas drawing code; no external game assets,
fonts or runtime requests are used. Scenery is baked into culled tiles; actors,
strides, vehicle lights and combat effects are drawn from live game state.

## Run

Node 22.18 or newer; no game dependencies to install.

    node serve.ts --port 8097

Open http://127.0.0.1:8097/ and choose Enter the city. Continue is enabled only
when a valid local save exists. Enter the city always starts a new game.
Desktop keyboard and mouse are required; touch controls are not implemented.

## Controls

- WASD: walk; W/S accelerate/reverse and A/D steer in a vehicle
- Shift: sprint on foot; Space: handbrake
- E: enter the nearest vehicle or exit to a safe adjacent position
- Mouse: aim; left button: fire; R: reload from finite reserve ammunition
- F: interact with the current contract destination
- K: save; L: load the last valid local save
- Escape: pause/resume (all game actions and simulation freeze)
- M: mute/unmute the locally synthesized sound effects
- Enter after defeat: restart a new city

A stolen car stays where parked. The rose syndicate coupe is the only vehicle
Mara accepts. Disable the cache guard with gunfire before collecting the ledger
on foot. Wanted heat clears after eight seconds without a patrol seeing you.
Cars and pedestrians cannot cross buildings; elevated coastal roads cross water.
The minimap shows the current destination, active patrols and player.

## Tests and genuine captures

    node tests/world.test.mjs
    node tests/systems.test.mjs
    node tests/artifacts.mjs

For the real browser playthrough, start the server first. Supply an installed
Playwright Core module and Chromium executable, and an output directory outside
this repository. These paths are configurable; no machine paths are built in.

    PLAYWRIGHT_CORE_PATH=/path/to/playwright-core CHROME_PATH=/path/to/chrome REVIEW_DIR=/path/to/review node tests/browser.mjs

GAME_URL optionally changes the server URL (default http://127.0.0.1:8097/).
The browser driver starts at the title and uses keyboard/mouse input through
both contracts, combat, pursuit, save/load, pause and defeat/restart. It inspects
detached read-only window.sunbreak.snapshot() data. No teleport, injected save,
state mutation or staged scene is used for captures. Four 1280×720 JPEGs at
quality 82 are written to screenshots/; live snapshots before and after capture
and test results go to REVIEW_DIR. Unit tests separately construct state to
isolate collision, save validation and mission gates.

## Presentation modules

- game/src/scenery.js: deterministic static tiles, buildings, streets and landmarks
- game/src/actors.js: culled people, vehicles and effects tied to real combat
- game/src/hud.js: vitals, wanted, minimap, mission and interaction interface
- game/src/render.js: camera and draw orchestration, preserving 1:1 world projection

The original fixed-step simulation and collision geometry remain separate from
presentation. The repository preserves the original game history.

## Local packaging

    MAKEFUN_OUTPUT_DIR=/path/to/new-output node main.ts

Use a new or empty directory outside the repository. The authored packaging
entry validates local module references, rejects unexpected/private files and
symlinks, verifies the unchanged vendor helper hash, checks exactly four capped
JPEGs and reproduces the dossier. Output contains only game/, screenshots/ and
dossier.json. Packaging is local and does not upload or submit anything.

## License

MIT; see LICENSE. The vendored Make.fun packaging helper is preserved byte for byte.
