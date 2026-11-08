# Strobe



## Table of Contents

- [Tech Stack](#tech-stack)
- [Structure](#structure)

## Tech Stack

- **frontend**: html, css, js ή ts, react

## Structure

- [Client](#client)
- [Application Server](#application-server)
- [Vision Server](#vision-server)

### Client

Υλοποίηση frontend. 

- [README](/client/README.md)

### Application Server
- Node.js server
- server/ server runtime and routes
- server/apps/registry.js app registry used by teacher/student launchers
- server/utils/
  - COMM_EVENT_CATALOG: catalog with all events

### Vision Server 

- [README](/vision/README.md)
  


## Requirements
- Node.js 18+
- npm

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
