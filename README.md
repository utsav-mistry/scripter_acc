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

## Features (backend)
- **Orgs + Workspaces**
- **Projects + Project RBAC** (`ProjectMember`)
- **Boards (Kanban)**
  - `GET /api/projects/:projectId/boards`
  - `POST /api/projects/:projectId/boards` (requires `Idempotency-Key`)
- **Tasks + filtering + cursor pagination**
  - `GET /api/tasks?projectId=...&boardId=...&status=...&cursor=...&limit=...`
  - `POST /api/tasks` (requires `Idempotency-Key`)
  - `PATCH /api/tasks/:taskId` (requires `Idempotency-Key`)
- **Task comments**
  - `GET /api/tasks/:taskId/comments`
  - `POST /api/tasks/:taskId/comments` (requires `Idempotency-Key`)
- **Labels**
  - `GET /api/tasks/projects/:projectId/labels`
  - `POST /api/tasks/projects/:projectId/labels` (requires `Idempotency-Key`)
  - `GET /api/tasks/:taskId/labels`
  - `POST /api/tasks/:taskId/labels` (requires `Idempotency-Key`)
  - `DELETE /api/tasks/:taskId/labels/:labelId` (requires `Idempotency-Key`)
- **Attachments (no extra deps; raw binary upload)**
  - `GET /api/tasks/:taskId/attachments`
  - `POST /api/tasks/:taskId/attachments`
    - headers:
      - `Content-Type: application/octet-stream`
      - `X-Filename: yourfile.ext`
      - `Idempotency-Key: ...`
  - `GET /api/tasks/:taskId/attachments/:attachmentId/download`
- **Audit log**
  - `GET /api/audit?orgId=...` or `GET /api/audit?projectId=...`

## Local storage
- Attachments are stored under `storage/` at the repo root (created automatically).

## PM2 (prod-ish)
- Build: `npm run build`
- Start: `pm2 start ecosystem.config.cjs`
