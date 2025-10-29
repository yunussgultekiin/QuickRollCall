# Quick Roll Call

A full-stack attendance collection tool that lets instructors spin up short-lived roll call sessions, generate QR codes for attendees, and export results as a PDF. The project is optimised for local-first development: the frontend (React + Vite) and backend (Express + TypeScript) run as separate containers with Redis providing shared state. Subsequent deployment work will live on a dedicated Heroku branch, keeping `main` focused on local workflows.

## Table of Contents
- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Frontend Highlights](#frontend-highlights)
- [Logging & Monitoring](#logging--monitoring)
- [Testing](#testing)
- [Deployment Plan](#deployment-plan)
- [Project Structure](#project-structure)

## Features
- **Instant sessions** – Create attendance sessions with optional duration limits and owner-only controls.
- **QR-based check-in** – Share a dynamic QR code that resolves to a token-protected attendance form.
- **Duplicate protection** – Redis-backed logic prevents token reuse, duplicate student IDs, and repeated device submissions.
- **Export-ready** – Generate branded PDF exports summarising attendees and timestamps.
- **Instructor tooling** – Manage sessions, issue fresh tokens, and close attendance from a dedicated dashboard.
- **Attendee experience** – Guided flow that validates tokens, collects profile information, and confirms submission.
- **Local telemetry** – Browser-side log collection and server-side request tracing to aid debugging.

## System Architecture
```
┌──────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend   │ <--> │   Backend    │ <--> │    Redis     │
│ React + Vite │      │ Express API  │      │ Session TTL │
└──────────────┘      └──────────────┘      └─────────────┘
        ▲                      │                    │
        │                      ▼                    │
  Browser QR flow       PDF exports, token logic    │
        │                      │                    │
        └────────────── Logs & health checks ◀──────┘
```
- **Frontend** runs on Vite dev server (port 5173) in development or Nginx (port 80) inside the production container.
- **Backend** exposes REST endpoints on port 5000, handles validation via Zod, and generates PDF exports with PDFKit.
- **Redis** persists active sessions, issued tokens, and submission fingerprints.

## Tech Stack
- **Frontend:** React 19, Vite, TypeScript, MUI, Redux Toolkit, Tailwind (utility styles), notistack, react-hook-form.
- **Backend:** Node 20, Express 5, TypeScript, Zod, Winston, PDFKit, QRCode, Redis client.
- **Infrastructure:** Docker Compose (profiles for dev/prod), Redis 7 (alpine), Nginx (alpine).

## Local Development
### Prerequisites
- Node.js 20+
- npm 10+
- Docker Desktop (for containerised workflow)

### Using Docker Compose (recommended)
```powershell
# Development profile with hot reload
docker compose --profile dev up --build

# Production-like build (static frontend served by nginx)
docker compose --profile prod up --build
```
Running the dev profile starts three containers:
- `frontend-dev`: Vite server on `http://localhost:5173` proxying `/api` to the backend.
- `backend-dev`: Express API with live reload on `http://localhost:5000`.
- `redis`: Redis instance exposed on port `6379` for debugging tools.

### Running without Docker
1. **Prepare Redis**
   - Start a local Redis instance listening on `127.0.0.1:6379`.

2. **Backend**
   ```powershell
   cd server
   npm install
   npm run dev
   ```
   The API becomes available at `http://localhost:5000`.

3. **Frontend**
   ```powershell
   cd client
   npm install
   npm run dev
   ```
   Vite serves the app at `http://localhost:5173`. Requests to `/api` will be proxied to the backend URL configured in `.env` or `vite.config.ts`.

## Environment Variables
Both `client/.env` and `server/.env` ship with sensible defaults for local development. Key options are summarised below.

### Server (`server/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API port | `5000` |
| `NODE_ENV` | Runtime environment label | `development` |
| `FRONTEND_BASE_URL` | Base URL used to build sharable links (`http://localhost:5173` by default) | _(empty)_ |
| `CORS_ORIGIN` | Allowed origins (comma separated, use `*` for dev) | `*` |
| `REDIS_URL` | Full Redis connection string (overrides host/port) | _(optional)_ |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_DB` | Redis connection pieces when `REDIS_URL` is unset | `localhost` / `6379` / `0` |
| `REDIS_USERNAME` / `REDIS_PASSWORD` | Credentials for secured Redis deployments | _(empty)_ |
| `SESSION_TTL_SECONDS` | TTL for session records | `3600` |

### Frontend (`client/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Absolute API endpoint used at build time | `http://localhost:5000/api` |
| `VITE_APP_BASE_URL` | App origin used inside generated links | `http://localhost:5173` |
| `VITE_BACKEND_URL` | Proxy target for the Vite dev server | `http://localhost:5000` |
| `VITE_ENABLE_SERVER_LOGS` | Toggle for sending client logs to the backend | `true` |
| `VITE_HTTP_TRACE` | Enables verbose HTTP timing logs in the browser console | `false` |

> 💡 When the app runs behind an ngrok tunnel for mobile testing, the frontend automatically falls back to `/api` so you do not need to change these environment variables.

## API Overview
The REST API is rooted at `/api`. Swagger metadata is registered automatically at `/api/docs`.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Basic service status check. |
| `/api/sessions` | POST | Create a new roll call session and mint the first attendance token. |
| `/api/sessions/:sessionId` | GET | Fetch session details (requires owner token). |
| `/api/sessions/:sessionId/close` | POST | Close a session and invalidate outstanding tokens. |
| `/api/sessions/:sessionId/token` | POST | Issue a new owner-authorised attendance token. |
| `/api/attendance/:sessionId` | POST | Submit attendance; validates token, identity, and device fingerprint. |
| `/api/attendance/:sessionId/validate` | GET | Check if a token is valid before sending the form. |
| `/api/attendance/:sessionId/token` | POST | Publicly mint a fresh token while the session is open. |
| `/api/export/:sessionId/pdf` | GET | Download a PDF export of attendance data. |
| `/api/logs` | POST | Receive aggregated client logs. |
| `/api/identity/*` | * | Utilities for browser identifiers and traceability. |

## Frontend Highlights
- **Session dashboard** – Live countdown timers, QR previews, and owner controls (`client/src/features/session`).
- **Attendance flow** – Token validation, form submission, and success/error pages (`client/src/features/attendance`).
- **Scanner integration** – Uses Barcode Detector API (with `jsqr` fallback) for camera-based token scanning (`client/src/features/scanner`).
- **Export page** – Provides quick links to download PDF exports (`client/src/features/export`).
- **State management** – Redux Toolkit slices for session data, UI feedback, and theme toggling (`client/src/store`).

## Logging & Monitoring
- **Backend** – Winston logger writes structured events to stdout; request logging middleware attaches timing and error metadata. Redis connection events surface in logs during shutdown.
- **Frontend** – A lightweight logger mirrors messages in the console and batches important events to `/api/logs` when enabled.

## Testing
Automated tests are not yet configured. Manual verification paths:
- Create a new session, scan the QR code with a second device, and submit attendance.
- Validate duplicate protection by resubmitting with the same token or student ID.
- Export the session PDF and confirm attendee ordering and timestamps.

Future work: add unit coverage for session services, end-to-end smoke tests via Playwright, and contract tests for the Express routes.

## Deployment Plan
- `main` remains the local-first branch with Docker-based workflows.
- A dedicated branch (for example `deploy/heroku`) will be created when preparing the Heroku deployment. That branch can:
  1. Introduce Heroku-specific configuration (Procfile, release scripts, managed Redis add-on settings).
  2. Adjust environment defaults for the hosted environment (e.g., disable wildcard CORS, configure `FRONTEND_BASE_URL`).
  3. Bake production Docker images or switch to buildpacks as required by Heroku.
- The README will be updated on that branch with deployment runbooks while keeping `main` focused on local development.

## Project Structure
```
QuickRollCall/
├── client/                 # React application (Vite, MUI)
│   ├── src/
│   │   ├── app/            # Shell, routing, global styles
│   │   ├── features/       # Home, session, attendance, export, scanner
│   │   ├── hooks/          # Countdown, QR scanner, session data, notifier
│   │   ├── services/       # API client, logging, config helpers
│   │   ├── store/          # Redux slices and hooks
│   │   └── validation/     # Zod schemas shared in the UI
│   └── Dockerfile          # Multi-stage build (builder + nginx)
├── server/                 # Express + TypeScript backend
│   ├── src/
│   │   ├── api/            # App bootstrap, config, Swagger, server entry
│   │   ├── cache/          # Redis client/services for session storage
│   │   ├── middleware/     # Logging, rate limiting, validation, auth
│   │   ├── routes/         # REST controllers (sessions, attendance, export)
│   │   ├── services/       # PDF generation, QR utilities, token generator
│   │   └── validation/     # Zod schemas for request contracts
│   └── Dockerfile          # Multi-stage build (builder + runtime)
├── docker-compose.yml      # Profiles for dev/prod stacks
└── README.md               # Project documentation (this file)
```

---
Feel free to open an issue or start a discussion when new workflows, deployment targets, or automation tools are added.
