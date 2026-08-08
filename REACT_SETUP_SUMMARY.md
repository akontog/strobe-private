# React Setup Summary (Current)

## Architecture
- Client uses Vite (workspace: client)
- Server uses Node/Express (workspace: server)
- Labs are served from client/public/labs/*
- App registry lives in server/apps/registry.js

## Important folders
- client/src/labs/
- client/src/shared/
- client/src/layout/
- client/public/labs/
- server/routes/
- server/apps/

## Commands
```powershell
npm install
npm start
npm run dev:client
npm run build:client
```

## Notes
- Root apps/ has been removed to avoid duplicates.
- Root routes/ has been removed; use only server/routes/.
