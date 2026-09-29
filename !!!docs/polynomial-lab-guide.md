# Polynomial Lab – Client + Server creation guide

This document describes the full workflow for creating a new collaborative lab in the same pattern as the neural lab, including shared UI pieces, routing, server registry registration, and static lab entry files.

## 1. Project structure pattern

Each lab lives under:

- `client/src/labs/<lab-slug>/`
- `server/apps/registry.js`
- optional static entry files such as `teacher.html` and `student.html`

Recommended structure:

```text
client/src/labs/polynomial-lab/
  App.jsx
  App.css
  StudentView.jsx
  TeacherView.jsx
  student.html
  teacher.html
  student.jsx
  teacher.jsx
```

The important rule is that the lab slug must match the folder name and the server registry entry.

---

## 2. Client-side (React) flow

### 2.1 Create the lab component

Start from a React component that receives a `role` prop:

```jsx
export default function App({ role = 'teacher' }) {
  const isTeacher = role === 'teacher';
  return (
    <div className="poly-lab-shell">
      {isTeacher ? <TeacherPanel /> : <StudentPanel />}
    </div>
  );
}
```

Typical responsibilities:

- render the central shared panel (`common-zone`)
- render teacher-only controls
- render student-facing data and goals
- use shared components for QR and tables
- keep lab-specific logic isolated in `App.jsx`

### 2.2 Use shared components

The lab should reuse shared components instead of duplicating logic:

- `Accordion`
- `StudentTable`
- `StudentQrAccordion`

Example:

```jsx
import { Accordion, StudentTable, StudentQrAccordion } from '../../shared/components';
```

This keeps all classroom UI consistent and reduces duplication across labs.

### 2.3 Add lab-specific data

For helper data, keep arrays grouped at the top of the file:

```jsx
const ACTIVITY_LIBRARY = [
  { id: 'al-9-2', code: 'Αλ.Π.9.2', title: 'Μονώνυμα και πολυώνυμα' },
  { id: 'al-9-3', code: 'Αλ.Π.9.3', title: 'Πράξεις με πολυώνυμα' }
];
```

This lets the teacher switch activities and keep the student view synchronized with the selected current activity.

### 2.4 Shared CSS strategy

Use common reusable patterns in:

- `client/src/framework/assets/css/classroom-shared.css`

Examples of shared rules to keep there:

- `.common-zone`
- `.accordion`
- `.accordion-btn`
- `.accordion-content`
- `.data-section`
- `.data-table`
- `.student-qr-section`
- `.student-qr-image`

Then use lab-specific styles only for the unique layout of that lab, such as:

- `client/src/labs/polynomial-lab/App.css`

### 2.5 Entry HTML files

For each lab, create HTML entry files like:

- `teacher.html`
- `student.html`

Example:

```html
<div id="root"></div>
<script type="module" src="./teacher.jsx"></script>
```

Then create the matching React entry files:

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(<App role="teacher" />);
```

These can be served through the static lab route, for example:

- `/labs/polynomial-lab/teacher.html`
- `/labs/polynomial-lab/student.html`

### 2.6 Direct route registration in the main app

Add the lab to `client/src/App.jsx`:

```jsx
import PolynomialStudentView from './labs/polynomial-lab/StudentView';
import PolynomialTeacherView from './labs/polynomial-lab/TeacherView';
```

And add the matching routes:

```jsx
<Route path="/labs/polynomial-lab/student" element={<PolynomialStudentView />} />
<Route path="/labs/polynomial-lab/teacher" element={<PolynomialTeacherView />} />
```

This supports direct links and makes the lab visible in the main router.

---

## 3. Server-side (Node.js) flow

### 3.1 Add the lab to the registry

The lab list is centralized in:

- `server/apps/registry.js`

Add a new entry with the same slug used for the folder and url:

```js
{
  slug: 'polynomial-lab',
  labId: 'polynomial-lab',
  title: 'Polynomial Lab',
  description: 'Collaborative polynomial practice...',
  roles: ['teacher', 'student', 'client'],
  kind: 'static',
  staticDir: path.join(LABS_ROOT, 'polynomial-lab'),
  teacherEntry: 'teacher.html',
  clientEntry: 'student.html'
}
```

### 3.2 Why this matters

This registry drives:

- `/teacher/apps`
- `/student/apps` or `/client/apps`
- the dynamic lab launcher page
- `teacherLaunchPath` and `clientLaunchPath`

So the lab appears in the teacher and student app lists automatically.

### 3.3 Static route behavior

The server uses the generated static paths to serve files from the lab folder:

```text
/labs/<slug>/teacher.html
/labs/<slug>/student.html
```

The `createAppsRouter()` middleware serves those files from the lab directory without extra custom route code.

---

## 4. Shared lab UI requirement checklist

For each new collaborative lab, include:

- common central panel like `common-zone`
- teacher-only activity selector accordion
- shared student table accordion
- shared QR accordion
- common CSS reused across labs

Recommended component pattern:

```jsx
<Accordion title="Δραστηριότητα" icon="🎯" open>
  <ActivitySelector />
</Accordion>

<Accordion title="Πίνακας μαθητών" icon="📋" open={false}>
  <StudentTable ... />
</Accordion>

<StudentQrAccordion qrSrc="/labs/polynomial-lab/media/file.png" />
```

---

## 5. Typical deployment checklist

Before you consider the new lab complete:

1. Add lab folder under `client/src/labs/<slug>/`
2. Add `App.jsx`, `TeacherView.jsx`, `StudentView.jsx`
3. Add HTML entry files and their JSX entrypoints
4. Add shared CSS patterns into `framework/assets/css/classroom-shared.css`
5. Add lab-specific CSS to `App.css`
6. Add registry entry in `server/apps/registry.js`
7. Add main router entries in `client/src/App.jsx`
8. Build the client: `npm run build:all`
9. Verify the app appears under `/teacher` and `/student`
10. Verify the direct route `/labs/<slug>/teacher` and `/labs/<slug>/student` loads correctly

---

## 6. Notes for extending the lab later

When the actual mathematical content grows, the best next steps are:

- split the teacher control panel into smaller components
- add exercise state, answer validation, and score calculation
- connect with the existing real-time classroom API if needed
- swap in a generated QR image for the student join flow
- keep the UI style consistent with the shared CSS system

This design makes the app easy to extend without repeating the same card/table/accordion structure in every lab.
