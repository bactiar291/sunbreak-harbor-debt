# Sunbreak: Harbor Debt

An original, local browser crime game set in a coastal city. You play Ren Vale:
meet Mara, steal the marked syndicate coupe, deliver it, recover a guarded ledger,
lose the patrol and reach the Marsh safehouse. Completed contracts remain completed
in free roam. This repository repairs the existing Sunbreak game and retains its
seeded city, title, characters, palette and canvas renderer.

## Run

Node 22 or newer with TypeScript stripping support; no dependencies to install.

    node serve.ts --port 8097

Open http://127.0.0.1:8097/ and choose Enter the city. Continue is enabled only when
a valid local save exists. Enter the city always starts a new game.

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
Cars and pedestrians do not cross buildings; elevated coastal roads cross water.
The minimap shows the current destination, patrols and player.

Desktop keyboard/mouse is required; touch controls are not implemented.

## Verification

    node /tmp/gta6-build-20261118/parent-regressions.mjs
    node tests/world.test.mjs
    node tests/systems.test.mjs
    node tests/browser.mjs

The browser driver uses the explicitly provided Chromium and playwright-core
paths, one browser worker, and the server on port 8097. It starts from the title
and drives with keyboard/mouse input. It reads detached snapshots through
window.sunbreak.snapshot(); no teleport or state mutation API is exposed.
Deterministic unit tests use constructed state to isolate collisions, save
validation and mission gates; they are separate from the real control playthrough.
Browser logs and evidence are written outside the repository under
/tmp/gta6-build-20261118/review. Four JPEG captures are written to screenshots/.

## Local packaging

    MAKEFUN_OUTPUT_DIR=/tmp/gta6-build-20261118/review/package-new node main.ts

Use a new or empty directory outside this repository. Packaging validates local
module references, rejects unexpected/private files and symlinks, verifies the
unchanged vendor library hash, checks four capped JPEGs and reproduces the dossier.
Its only output entries are game/, screenshots/ and dossier.json. No upload,
submission, account, keys or publication is involved.

## License

MIT; see LICENSE. The vendored Make.fun packaging helper is preserved byte for byte.
