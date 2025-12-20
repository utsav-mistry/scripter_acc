# PM Suite (MERN)

## Prereqs
- Node.js 20+
- MongoDB running locally (or update `MONGO_URI`)

## Setup
1. Copy env:
   - `server/.env.example` -> `server/.env`
2. Install:
   - `npm install`
3. Run API:
   - `npm run dev`
4. Run Web:
   - `npm run dev:web`

## PM2 (prod-ish)
- Build: `npm run build`
- Start: `pm2 start ecosystem.config.cjs`
