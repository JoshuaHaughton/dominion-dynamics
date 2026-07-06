# Dominion Dynamics

Dominion Dynamics is a localhost demo of a live airspace map over Ottawa. Run it and you get 120 simulated aircraft updating once per second, restricted zones you draw on the map, threat levels as tracks approach or enter those zones, and drones that respond when something actually breaches a zone.


## Quick Start

```bash
# Node 24 (see .nvmrc), Yarn 1
yarn install

# Optional: frontend env (defaults work out of the box)
cp frontend/.env.example frontend/.env

# Start backend (http://localhost:8000) + frontend (http://localhost:5173)
yarn dev
```

The backend serves REST and a live WebSocket feed on port `8000`. The frontend is on port `5173`.

## Project Structure

```
dominion-dynamics/
├── backend/              # Express API + sim (TypeScript)
│   └── src/
│       ├── api/          # Routes, controllers, validation middleware
│       ├── modules/      # Sim tick logic: traffic, threat, patrol, dispatch, realtime
│       ├── services/     # Persisted CRUD (zones, patrol path) + cache hydration
│       ├── repositories/ # Drizzle/SQLite access
│       ├── app.ts        # Express wiring
│       └── server.ts     # Boot, listen, shutdown
├── frontend/             # React UI (Vite + MapLibre)
│   └── src/
│       ├── components/   # LiveMap (map/, zones/, assets/, patrol/), panels, toolbar
│       ├── lib/          # API clients, stores, utils, constants
│       ├── design/       # Color theme (CSS vars + map palette)
│       └── styles/       # Shared CSS modules
├── packages/shared/      # Shared types and Zod schemas for API + WebSocket messages
└── package.json          # Workspace root
```

## Available Scripts

| Command             | Description                           |
| ------------------- | ------------------------------------- |
| `yarn dev`          | Start backend + frontend concurrently |
| `yarn build`        | Production build (backend + frontend) |
| `yarn typecheck`    | Typecheck all workspaces              |
| `yarn test:run`     | Run all test suites                   |
| `yarn lint`         | ESLint across the monorepo            |
| `yarn format`       | Prettier write                        |
| `yarn format:check` | Prettier check                        |

## Architecture

The frontend talks to Express over REST and WebSocket. SQLite stores zones and the patrol path. The sim runs inside the backend process on a 1 Hz tick:

```
move aircraft → check restricted zones (inside / time-to-entry) → assign dispatch drones → move drones → push 1 update to clients
```

**Shared package.** `packages/shared` holds the TypeScript types and Zod schemas for API bodies and WebSocket messages. Frontend and backend both import from there. HTTP requests are validated at the route layer; JSON read back out of SQLite is parsed in the repository layer so corrupt rows fail early instead of leaking into the sim.

**Backend layering.** `repositories` are the only code that talks to Drizzle/SQLite. `services` orchestrate persisted CRUD and own updates to the in-memory zone geometry cache (including boot hydration). `modules` hold sim/tick logic and do not import repositories directly; the ticker gets patrol path and zone state injected from services. `server.ts` wires boot and listens.

**Threat runs on the server.** Breach detection and time-to-entry use point-in-polygon checks plus ray-casting against zone boundaries (with a bounding-box prefilter). Every client renders the same numbers.

**Frontend map.** Zustand holds selection and feed status. React hooks push GeoJSON into MapLibre sources on each update. LiveMap code is grouped under `map/`, `zones/`, `assets/`, and `patrol/`.

**React Compiler.** The frontend build uses React Compiler, so hooks rely on the compiler for memoization instead of hand-rolled `useCallback` / `useMemo`.

**Theme.** Colors live in `frontend/src/design/theme.ts` and get injected as CSS variables at boot so CSS modules and MapLibre paint match.

## Requirements Mapping

| Requirement                                       | Where                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 100+ concurrent real-time assets                  | Sim seeds 120 tracks, WebSocket snapshot at 1 Hz                                    |
| Drone follows user-defined patrol path            | Draw a polyline; patrol FSM follows it (saved in SQLite, survives restart)          |
| Shadow nearest asset entering a zone              | Patrol chase kinematics; fires on breach (critical), not warning                    |
| Draw polygons; time-to-entry from current vector  | TerraDraw polygons; server ray-casts against zone edges                              |
| Symbology: Normal / Warning / Critical            | Server `evaluateAsset`; frontend threat colors and rings                            |
| Click asset → 5-min history + predicted path      | 300 s ring buffer; prediction from first→last history point                         |
| Info panel: TTE, distance to nearest zone, threat | `AssetInfoPanel` reads per-asset zone fields from the live feed                     |
| Extra: dispatch from nearest airport on breach    | Closest-source allocator + airport index + `interceptEtaSeconds` in the drone panel |

## Design Decisions

**Synthetic traffic instead of OpenSky.** Guarantees 120+ tracks, no API keys, deterministic behavior for demo. Seed region and tick rate are overridable via `SIM_SEED_*`, `ASSET_COUNT`, and `TICK_MS`.

**"Enters a zone" means breach, not warning.** The patrol drone shadows the nearest aircraft that is already inside a zone (critical). Warning-level tracks still show time-to-entry so you can see them coming.

**"Intercept time" is time-to-trail-slot.** Drones are monitors. The ETA counts down until the drone reaches a trailing position behind the target, then it shadows.

**Dispatch picks the closest source.** On breach, the allocator compares distance to the target across every option at once: spawn at the nearest airport, reuse an idle dispatch drone, or pull the patrol drone if it is idle on its route. Whichever is closest wins. A patrol drone that is already shadowing or rejoining is never reassigned.

**Clients render server threat as-is.** The frontend does not recompute breach or time-to-entry.

## Tests

```bash
yarn test:run
```

Vitest in all three workspaces: sim/threat/patrol/dispatch unit tests, a WebSocket integration test for asset selection, and frontend hook/util tests. Shared fixtures live in `@dominion-dynamics/shared/testing`.

## Known Limitations

- Built for localhost: no rate limiting, no helmet, no WebSocket heartbeat or origin checks, default Express body size limits. For production I'd add those, plus explicit body limits on zone/patrol POST routes.
- One patrol drone and one patrol path at a time. Supporting several would mean separate mission state and allocator rules; not built here.
- The map itself is mouse/touch only. Panel lists and controls support keyboard; the canvas does not. A production pass would add keyboard focus and asset selection on the map.

## Tech Stack

**Backend:** Node.js, Express 5, TypeScript, Drizzle ORM, better-sqlite3, ws, Zod

**Frontend:** React 19, TypeScript, Vite 7, MapLibre GL, TerraDraw, Zustand, Zod, React Compiler

**Shared:** Zod schemas and types shared by frontend and backend

**Testing:** Vitest, Testing Library
