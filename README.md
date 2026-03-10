# PM Suite (MERN) — Engineering Capability Test

## Overview
This project was built as a **personal engineering challenge to push my full-stack development capabilities** using the **MERN stack**.

The goal was to design and implement a **production-style backend architecture** with features commonly found in modern project management platforms such as task boards, RBAC, audit logging, idempotent APIs, and scalable data querying.

Rather than focusing only on UI, the emphasis was on:

- Backend architecture
- API design
- Data modelling
- Scalability patterns
- Reliability practices

The project simulates the core backend of a **multi-tenant project management platform** similar to tools like Jira, Trello, and Asana.

---

# Tech Stack

**Backend**
- Node.js
- Express
- MongoDB
- Mongoose

**Frontend**
- React

**Architecture Concepts Implemented**
- Multi-tenant org/workspace structure
- Role Based Access Control (RBAC)
- Cursor pagination
- Idempotent APIs
- Audit logging
- File attachments
- Kanban board workflow

---

# Prerequisites
- Node.js 20+
- MongoDB running locally (or update `MONGO_URI`)

---

# Setup

### 1. Copy Environment File

```
server/.env.example -> server/.env
```

### 2. Install Dependencies

```
npm install
```

### 3. Run API

```
npm run dev
```

### 4. Run Web

```
npm run dev:web
```

---

# Implemented Backend Features

## Multi-Tenant Structure
- Organizations
- Workspaces
- Projects

---

## Project RBAC
Project level permissions using `ProjectMember`.

---

## Kanban Boards

```
GET  /api/projects/:projectId/boards
POST /api/projects/:projectId/boards
```

Requires header:

```
Idempotency-Key
```

---

## Tasks
Filtering + cursor pagination supported.

```
GET   /api/tasks
POST  /api/tasks
PATCH /api/tasks/:taskId
```

Query filters:

```
projectId
boardId
status
cursor
limit
```

---

## Task Comments

```
GET  /api/tasks/:taskId/comments
POST /api/tasks/:taskId/comments
```

---

## Labels

```
GET    /api/tasks/projects/:projectId/labels
POST   /api/tasks/projects/:projectId/labels
GET    /api/tasks/:taskId/labels
POST   /api/tasks/:taskId/labels
DELETE /api/tasks/:taskId/labels/:labelId
```

---

## Attachments
Raw binary uploads without external storage dependencies.

```
GET  /api/tasks/:taskId/attachments
POST /api/tasks/:taskId/attachments
GET  /api/tasks/:taskId/attachments/:attachmentId/download
```

Headers required:

```
Content-Type: application/octet-stream
X-Filename: yourfile.ext
Idempotency-Key: <unique-key>
```

---

## Audit Logging

Tracks major actions across organizations and projects.

```
GET /api/audit?orgId=...
GET /api/audit?projectId=...
```

---

# Local Storage
Attachments are stored locally under:

```
/storage
```

(created automatically at runtime)

---

# Production (PM2)

Build:

```
npm run build
```

Start:

```
pm2 start ecosystem.config.cjs
```

---

# Purpose of the Project

This repository exists primarily as a **technical exploration and capability demonstration** to test:

- complex backend architecture design
- scalable API design
- production-level engineering practices
- MERN stack proficiency
