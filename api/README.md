# SpotLog API

Minimal Express API for Phase 2 of the OSC assignment.

## Scripts

- `npm run dev` starts the API in watch mode
- `npm run build` compiles TypeScript
- `npm run start` runs the compiled server

## Required Behavior

- Must listen on `process.env.PORT`
- Defaults to port `8080`
- Exposes:
  - `GET /health`
  - `GET /api/items`
  - `POST /api/items`
  - `GET /api/items/:id`
  - `DELETE /api/items/:id`
