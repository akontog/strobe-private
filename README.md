# Strobe Private

Unified classroom platform with:
- Node.js server (API, dashboards, WebSocket)
- Vite/React client
- Workshops source folders under client/src/workshops/*

# Structure

## Server
- server/ server runtime and routes
- server/apps/registry.js app registry used by teacher/student launchers
- server/utils/
  - COMM_EVENT_CATALOG: catalog with all events

## Client

- client/src/styles/classroom-shared.css shared workshop layout styles\n- client/src/shared/services/classroom-api.js shared classroom client API
- client/src/shared/* shared React components/hooks/i18n
  - components
    - resources
    - services
    - widgets
- client/src/layout/* layout area (when present in client code)


## vision/
	- camera_server.py
	- camera_tracking.py
	- models/yolov8n.pt
	- [README-vision](./README-vision.md)

## Requirements
- Node.js 18+
- npm
- Python 3.11+ (camera features)

## Install
```powershell
npm install
```

## Run
### 1) Server
```powershell
npm start
```
Runs server/server.js on port 3000 by default.

### 2) Client (Vite dev)
```powershell
npm run dev:client
```

## Build
### Build client
```powershell
npm run build:client
```
(or npm run build)

### Build lab bundles
```powershell
npm run clean:labs
npm run build:buffon-needle
npm run build:neural-lab
npm run build:primes-lab
npm run build:labs
```

The folder client/dist contains build output only.

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

## Lab URLs
- /labs/buffon-needle/teacher.html
- /labs/buffon-needle/student.html
- /labs/neural-lab/teacher.html
- /labs/neural-lab/student.html
- /labs/primes-lab/teacher.html
- /labs/primes-lab/student.html

# Εφαρμογές

## Buffon Needle

## Neural Lab

- [readme](/!!!docs/reports/neural-lab/README-neural-lab)

## Primes Lab

- [readme](/!!!docs/reports/primes-lab/README-primes-lab)
