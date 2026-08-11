# React Guide

## Goal
Use Vite for client app development, with lab runtime/source files under client/src/labs/.

## Folder conventions
- client/src/labs/*: React StudentView/TeacherView wrappers
- client/src/shared/components/*: shared reusable React components
- client/src/framework/assets/*: shared JS/CSS served to lab runtime pages
- client/src/shared/*: shared hooks/i18n/helpers
- client/src/layout/*: shared layout components
- client/src/labs/*: source/runtime per lab (html/js/css/media)

Do not use client/public/labs/ for lab storage.

## Add/maintain a lab wrapper
1. Edit or create client/src/labs/<lab-slug>/StudentView.jsx
2. Edit or create client/src/labs/<lab-slug>/TeacherView.jsx
3. Point iframe src to /labs/<lab-slug>/<entry>.html (or index.html?mode=...)
4. Register routes in client/src/App.jsx

## Build flow
- Client shell:
```powershell
npm run build:client
```
- Lab bundles into client/dist/labs/:
```powershell
npm run clean:labs
npm run build:buffon-needle
npm run build:geometry-live
npm run build:neural-lab
npm run build:primes-lab
npm run build:labs
```

Do not commit or keep generated *.bundle.js / *.bundle.css inside source folders.

## Lab structure convention
Each lab should converge toward a common shape:
- App.jsx
- index.jsx
- components/
- data/
- runtime entry html files when needed (teacher.html, student.html, camera.html, mouse.html, index.html)

## Registry
Use server/apps/registry.js as the single source of truth for app metadata and launch paths.

# React Setup Summary

## Current model
- Vite client in client/
- Node server in server/
- Centralized labs in client/src/labs/
- Shared components in client/src/shared/components/
- Shared runtime assets in client/src/framework/assets/
- Vision stack in vision/
- Lab endpoints served under /labs/* via server/routes/apps.js + server/apps/registry.js

## Commands
```powershell
npm install
npm start
npm run dev:client
npm run build:client
npm run clean:labs
npm run build:labs
npm run build:buffon-needle
npm run build:geometry-live
npm run build:neural-lab
npm run build:primes-lab
```

## Important note
client/public/labs/ is not used as a lab source location.
client/dist/ contains build output only.