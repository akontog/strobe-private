# React Guide (Vite-first)

## Goal
All frontend app entry points are managed through the Vite client.

Use these folders:
- client/src/labs/* for React StudentView/TeacherView wrappers
- client/src/shared/* for shared React components/hooks
- client/src/layout/* for shared layout pieces
- client/public/labs/* for static lab runtime assets/pages

Do not create new app code under root apps/.

## Add a new lab wrapper
1. Create a folder in client/src/labs/<lab-slug>/
2. Add StudentView.jsx and TeacherView.jsx
3. Point each to /labs/<lab-slug>/<entry>.html or equivalent runtime page
4. Register routes in client/src/App.jsx

Example StudentView:
```jsx
import React from 'react';

export default function StudentView() {
  return (
    <iframe
      title="My Lab Student"
      src="/labs/my-lab/student.html"
      style={{ width: '100%', minHeight: '100vh', border: 'none' }}
    />
  );
}
```

## Shared React components
- Place reusable components in client/src/shared/components/
- Keep app-specific components inside each lab folder only when needed

## Run and build
```powershell
npm run dev:client
npm run build:client
```

## Launch and registry
Server-side app metadata lives in server/apps/registry.js.
Teacher and student launchers consume that registry through server routes.
