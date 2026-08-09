# React Setup Summary

## Current model
- Vite client in client/
- Node server in server/
- Centralized labs in apps/
- Shared framework components/assets in client/src/framework/
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
