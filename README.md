# Strobe Private

Unified classroom platform with:
- Node.js server (API, dashboards, WebSocket)
- Vite/React client
- Labs served from client/public/labs/*

## New Structure (no root apps)
- server/ server runtime and routes
- server/apps/registry.js app registry used by teacher/student launchers
- client/src/labs/* React StudentView/TeacherView wrappers
- client/public/labs/* migrated lab runtime (fourier, geometry, neural, buffon, primes, shared assets)
- client/src/shared/* shared React utilities/components
- client/src/layout/* layout area (when present in client code)

## Requirements
- Node.js 18+
- npm
- Python 3.11+ (optional, needed for camera features)

## Install
```powershell
npm install
```

## Run
### 1) Server (production-style local)
```powershell
npm start
```
Runs server/server.js on port 3000 by default.

### 2) Client (Vite dev)
```powershell
npm run dev:client
```
Runs Vite dev server (default port 5173).

## Build
### Build client
```powershell
npm run build:client
```
(or npm run build)

### Build linear separation tool
```powershell
npm run build:linear
```

## Main URLs (server)
- / home
- /teacher teacher dashboard
- /student student launcher (/client alias)
- /tools tools hub
- /health health check

## Lab URLs (new)
- /labs/geometry-live/teacher.html
- /labs/geometry-live/mouse.html
- /labs/geometry-live/camera.html
- /labs/fourier-lab/index.html?mode=teacher
- /labs/fourier-lab/index.html?mode=client
- /labs/buffon-needle/teacher.html
- /labs/buffon-needle/student.html
- /labs/neural-lab/teacher.html
- /labs/neural-lab/student.html
- /labs/primes-lab/teacher.html
- /labs/primes-lab/student.html

## Notes
- Root apps/ and root routes/ are removed to avoid duplication.
- App routing metadata now lives only in server/apps/registry.js.
