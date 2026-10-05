# Drift Fury: Pursuit

Open-world night driving game: drift through the city, fuel up at stations, climb the Kuro mountain road
and lose the police. Built with React and Three.js; it runs entirely in the browser.

On phones, start a session to show the on-screen driving controls. Mobile browsers enable game audio
from the session-start tap; touching a driving control also resumes audio if the browser suspended it.

## Commands

Requires Node.js 20 or newer.

```sh
npm install
npm run dev     # development server with instant reload (http://localhost:5173)
npm start       # production: builds into dist/ and serves it (PORT, default 3000)
npm run build   # build only
npm run serve   # serve an existing dist/ without rebuilding
```

Railway detects the `start` script and supplies the port through `PORT`.

## Project layout

```
index.html                 page shell (Vite entry)
public/manifest.json       web app manifest
server.js                  static server for dist/
src/
  main.jsx, App.jsx        React entry and routes ("/" is the game, everything else is the 404 page)
  api/, lib/               Base44 client, optional sign-in (falls back to local mode), React Query, helpers
  components/              toasts, scroll restoration, access-denied screen
  pages/                   GamePage (screens and progress state), PageNotFound
  styles/index.css         game styles + Tailwind utilities
  game/
    data/                  cars, engines/gearbox, fuel stations, saved progress, initial HUD state
    ui/                    garage, car/engine picker, HUD, minimap, touch controls, pause and result screens
    session/               startGameSession (the per-frame game loop: camera, lights, sync with the
                           simulation) and the 3D garage preview
    simulation/            game state and rules, car physics, gearbox, collisions, police AI
    render/                renderer + post-processing, static mesh batching, shader warm-up, mesh helpers
    vehicles/              procedural car model (specs, body loft, wheels, lights), traffic car templates
    world/                 the map: buildWorld runs worldContext, ground, roads, trafficControl,
                           streetLights, buildings, streetTrees, gasStations, highway, mountain,
                           roadClosure and sky in order; terrain height and procedural textures
    people/                articulated pedestrians/officers and their walk animation
    effects/               tyre smoke, skid marks, crash smoke and debris
    audio/                 engine sound (AudioWorklet synth in engineSynth.worklet.js), sound effects
    util/                  seeded random
```

Coordinates: Y is up, cars face -Z at heading 0. The city spans roughly x -150..150, z -110..100;
the highway runs north-south at x = 175 and the mountain rises north of z = -150.

## Debugging

Add `?dfdebug` to the URL to expose the running session (scene, renderer, game state, collision solids)
as `window.__dfDbg` in the browser console.
