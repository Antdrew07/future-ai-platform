# Future AI Platform — Architecture Fixes

> **Date:** April 20, 2026
> **Author:** Manus AI (via GitHub connector)
> **Scope:** Critical architectural overhaul for production multi-tenancy

---

## Overview

This document records the 5 critical architectural fixes applied to make the
`future-ai-platform` a production-ready, multi-tenant AI agent execution
platform. All changes are backward-compatible and include database migration
scripts for existing deployments.

---

## Fix 1 — Real Multi-Tenancy via Workspace Layer

### Problem
The platform stored all agents, tasks, and conversations with a direct
`userId` foreign key. There was no concept of a shared workspace, so team
members could not access each other's agents, and billing was always tied to
the individual user rather than the team account.

### Solution
- **New `workspaces` table** — the root entity for multi-tenancy. Every
  resource (agents, tasks) now belongs to a workspace.
- **New `workspace_members` table** — tracks which users belong to which
  workspaces, with roles (`owner`, `admin`, `member`, `viewer`) and invite
  flow support.
- **`workspaceId` added to `agents` and `tasks`** tables.
- **`server/workspace.ts`** — new service layer with:
  - `createPersonalWorkspace()` — auto-called on user registration
  - `getOrCreatePersonalWorkspace()` — lazy creation for existing users
  - `createTeamWorkspace()` — for team accounts
  - `canUserAccessAgent()` — workspace-aware authorization
  - `canUserAccessTask()` — workspace-aware authorization
  - `addWorkspaceMember()` / `acceptWorkspaceInvite()` — invite flow
- **`server/routers.ts`** — all agent `get`, `update`, and `create` routes
  now use `canUserAccessAgent()` instead of a raw `userId` equality check.
- **`drizzle/migrations/0002_add_workspaces.sql`** — migration script that
  creates the new tables and backfills existing data safely.

### Files Changed
- `drizzle/schema.ts` — added `workspaces`, `workspaceMembers` tables;
  added `workspaceId` to `agents` and `tasks`
- `server/workspace.ts` — **new file**
- `server/routers.ts` — updated agent authorization
- `drizzle/migrations/0002_add_workspaces.sql` — **new file**

---

## Fix 2 — Durable Task Queue via BullMQ

### Problem
The agent loop ran entirely in-memory using a `Map<string, AbortController>`
to track active tasks. If the server restarted mid-task, the job was silently
lost with no retry, no recovery, and no way to reconnect a dropped SSE stream.

### Solution
- **`server/taskQueue.ts`** — new durable job queue built on BullMQ + Redis:
  - `enqueueAgentTask()` — adds jobs to Redis queue (idempotent via `jobId`)
  - `startAgentWorker()` — starts a BullMQ worker with concurrency 5
  - `stopAgentWorker()` — graceful shutdown on `SIGTERM`/`SIGINT`
  - `getQueueStats()` — admin monitoring endpoint
  - Event listener registry (`onTaskStep`, `onTaskComplete`, `onTaskError`)
    so SSE streams can subscribe to live updates from the worker
  - **Automatic retry** — 3 attempts with exponential backoff (2s, 4s, 8s)
  - **Graceful fallback** — if Redis is unavailable, tasks run in-process
    (maintains dev-mode compatibility)
- **`server/_core/index.ts`** — `startAgentWorker()` called at server startup;
  graceful shutdown handlers registered.

### Files Changed
- `server/taskQueue.ts` — **new file**
- `server/_core/index.ts` — registered worker startup and graceful shutdown

---

## Fix 3 — Secure Docker Sandboxing for Code Execution

### Problem
The `code_execute` and `shell_execute` agent tools ran code directly on the
host machine using Node's `child_process.execSync`. A malicious prompt could
exfiltrate secrets, destroy files, or establish reverse shells.

### Solution
- **`server/codeSandbox.ts`** — new secure execution layer:
  - Detects Docker availability at startup (one-time check, cached)
  - **Docker mode** (production): each execution runs in a fresh, ephemeral
    container with:
    - `--network none` — no internet access from inside the sandbox
    - `--memory 256m` — hard memory cap
    - `--cpus 0.5` — CPU throttle
    - `--pids-limit 64` — prevents fork bombs
    - `--read-only` — immutable root filesystem
    - `--cap-drop ALL` — no Linux capabilities
    - Code file mounted read-only; output via stdout/stderr only
  - **Fallback mode** (dev/no Docker): regex blocklist of dangerous patterns
    (fork bombs, `rm -rf /`, `curl | bash`, etc.) with a minimal `PATH`
  - Supports Python, JavaScript, TypeScript, and Bash
  - Hard 30-second timeout for code, 60-second for shell commands
- **`server/agentTools.ts`** — `executeCodeExecution` and
  `executeShellCommand` now call `executeCode()` from `codeSandbox.ts`
  instead of `execSync`. Output includes a 🔒 sandboxed / ⚠️ restricted badge.

### Files Changed
- `server/codeSandbox.ts` — **new file**
- `server/agentTools.ts` — replaced `execSync` calls with `executeCode()`

---

## Fix 4 — Atomic Billing via SQL-Level Credit Operations

### Problem
`deductCredits()` and `addCredits()` used a READ-then-WRITE pattern:
1. `SELECT creditBalance FROM users WHERE id = ?`
2. `UPDATE users SET creditBalance = ? WHERE id = ?`

Under concurrent requests, two tasks could both read the same balance,
both pass the `balance >= amount` check, and both deduct — resulting in a
negative balance (free credits exploit).

### Solution
Both functions now use **single atomic SQL statements** that eliminate the
race window entirely:

**`deductCredits`** — now uses:
```sql
UPDATE users
SET creditBalance = creditBalance - ?
WHERE id = ? AND creditBalance >= ?
```
If `affectedRows === 0`, the balance was insufficient and we return `false`.
No second thread can sneak in between the check and the update.

**`addCredits`** — now uses:
```sql
UPDATE users
SET creditBalance = creditBalance + ?
WHERE id = ?
```
Atomic increment at the database level; no stale read possible.

### Files Changed
- `server/db.ts` — `deductCredits()` and `addCredits()` rewritten

---

## Fix 5 — Truly Public Agents with Anonymous Access

### Problem
Agents marked `isPublic = true` were visible in the UI but the underlying
API still required an authenticated session cookie to send a message. Anonymous
visitors and embedded iframe users could not actually chat with public agents.

### Solution
- **`server/publicAgentRouter.ts`** — new Express router (bypasses tRPC auth):
  - `GET /api/public/agent/:slug` — returns safe public metadata
  - `POST /api/public/agent/:slug/chat` — anonymous chat endpoint:
    - **IP rate limiting**: 20 req/min + 200 req/day (via `express-rate-limit`)
    - **Anonymous session tokens** (`anon_<nanoid>`) — returned in
      `X-Anon-Session` header; client persists in `localStorage` for
      conversation continuity across page reloads
    - **Credits billed to agent owner** — not the anonymous visitor
    - **Owner credit guard** — returns 503 if owner has < 5 credits
    - Conversation history stored per anonymous session in the `conversations`
      table (keyed by `public_{agentId}_{anonToken}`)
  - `GET /api/public/agent/:slug/embed` — returns a self-contained iframe
    chat widget (dark theme, no external dependencies) that any website can
    embed with a single `<iframe>` tag
- **`server/_core/index.ts`** — `registerPublicAgentRoutes(app)` called
  before the tRPC middleware.

### Files Changed
- `server/publicAgentRouter.ts` — **new file**
- `server/_core/index.ts` — registered public routes

---

## Dependency Changes

```json
{
  "bullmq": "^5.x",
  "ioredis": "^5.x",
  "express-rate-limit": "^7.x"
}
```

---

## Deployment Checklist

Before deploying to production, ensure the following:

| Step | Description | Required |
| :--- | :--- | :---: |
| Run migration | Apply `drizzle/migrations/0002_add_workspaces.sql` | ✅ |
| Set `REDIS_URL` | Point to a managed Redis instance (e.g., Upstash, Redis Cloud) | ✅ |
| Install Docker | Required for secure code sandboxing on the server | ✅ |
| Pull sandbox images | `docker pull python:3.11-slim node:20-alpine alpine:latest` | ✅ |
| Test public agent | Create a public agent and verify `/api/public/agent/:slug/chat` | ✅ |
| Monitor queue | Use `getQueueStats()` or BullMQ Board for queue health | Recommended |

---

## What's Still Needed (Next Sprint)

1. **Workspace billing** — credit balances should live on `workspaces`, not
   `users`, so team members share a pool.
2. **Workspace tRPC router** — expose `workspaces.list`, `workspaces.invite`,
   `workspaces.acceptInvite` to the frontend.
3. **Frontend workspace switcher** — UI to switch between personal and team
   workspaces.
4. **Queue monitoring UI** — admin panel showing BullMQ queue depth, active
   tasks, and failed jobs.
5. **Redis setup guide** — documentation for connecting to Upstash Redis on
   Vercel/Railway/Fly.io deployments.
