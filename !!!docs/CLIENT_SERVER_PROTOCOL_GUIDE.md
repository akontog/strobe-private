# Strobe: Πρωτόκολλο Επικοινωνίας Server-Client (Όλες οι εφαρμογές)

## 1) Σκοπός του οδηγού

Αυτό το αρχείο είναι ο κεντρικός οδηγός για το **πώς μιλάνε client και server** στο strobe-private:

- ποια κανάλια υπάρχουν,
- τι μορφή έχουν τα μηνύματα,
- ποια events/types χρησιμοποιούνται ανά εφαρμογή,
- πού ακριβώς στον κώδικα υλοποιείται κάθε κομμάτι.

Ο οδηγός καλύπτει:

1. Το κοινό realtime transport (`/ws/realtime`, event/data πρωτόκολλο)
2. Τα dedicated WebSocket κανάλια ανά app (`/ws/polynomial-lab`, `/ws/primes-lab`, κ.λπ. με `type` messages)
3. Τα βασικά HTTP API endpoints που επηρεάζουν συγχρονισμό/κατάσταση
4. Tracing/observability (communication log + catalog)

---

## 2) Δύο οικογένειες πρωτοκόλλου

Στο project συνυπάρχουν **2 patterns** realtime επικοινωνίας:

### A. Event/Data protocol πάνω στο `/ws/realtime`

- Μορφή μηνύματος: `{ event, data }`
- Χρησιμοποιείται από:
  - geometry (users-update, camera-points, activity-loaded)
  - geogebra collaboration (`geogebra:*` events)
  - monitor/presentation hooks

Server υλοποίηση:
- `server/utils/realtimeTransport.js`
  - σχόλιο πρωτοκόλλου στην κορυφή
  - parser/dispatch ανά `event`
- `server/server.js`
  - register του `REALTIME_WS_PATH` προς `io.handleUpgrade`

Client υλοποίηση:
- `public/js/realtime-socket.js`
  - `.emit(event, data)`
  - `.on(event, handler)`
- `client/src/framework/assets/js/classroom-api.js`
  - `normalizeMessage`: δέχεται και `{type}` και `{event,data}`

### B. Type-based protocol σε dedicated ws paths

- Μορφή μηνύματος: `{ type, ...payload }`
- Χρησιμοποιείται από:
  - polynomial-lab (`/ws/polynomial-lab`)
  - linear-systems-lab (`/ws/linear-systems-lab`)
  - primes-lab (`/ws/primes-lab`)
  - neural-lab (`/ws/neural-lab`)
  - buffon (`/ws/buffon`)

Server υλοποίηση:
- `server/services/*.js` (κάθε app έχει `WebSocketServer({ noServer: true })`)
- `server/server.js` (ws route registrations)
- `server/services/websocketRegistry.js` (dispatch `upgrade` ανά path)

Client υλοποίηση:
- React/JS app files με native `new WebSocket(...)`
- αποστολή με `ws.send(JSON.stringify(payload))`

---

## 3) Πού γίνεται το route των WebSocket συνδέσεων

Κεντρικό wiring:

- `server/server.js`
  - register routes:
    - `/ws/realtime`
    - `/ws/neural-lab`
    - `/ws/buffon`
    - `/ws/primes-lab`
    - `/ws/polynomial-lab`
    - `/ws/linear-systems-lab`
  - τελικό hook:
    - `httpServer.on('upgrade', ...) -> wsRegistry.handleUpgrade(...)`

- `server/services/websocketRegistry.js`
  - `register(path, handler)`
  - `handleUpgrade(request, socket, head)` κάνει prefix match στο URL

Αυτό σημαίνει ότι για νέα εφαρμογή με dedicated ws:

1. Δημιουργείς service (`server/services/newApp.js`)
2. Επιστρέφεις `newAppWss`
3. Κάνεις `wsRegistry.register('/ws/new-app', ...)` στο `server/server.js`

---

## 4) Κοινό lifecycle (dedicated ws apps)

Σχεδόν όλες οι dedicated ws εφαρμογές ακολουθούν το ίδιο pattern:

1. Connect
2. `register_teacher` ή `register_student`
3. `request_state`
4. Server στέλνει `*_state` snapshot
5. Teacher στέλνει lesson/slide/selection αλλαγές
6. Student στέλνει answers/state
7. Server κάνει broadcast ενημερωμένο state

Τυπικό παράδειγμα server pattern:

- `emitState(target?)`
- `if (type === 'register_teacher') ...`
- `if (type === 'register_student') ...`
- `if (type === 'request_state') ...`
- `if (type === 'teacher_lesson') ...`
- `if (type === 'student_answers' | 'student_state') ...`

Παραδείγματα αρχείων:

- `server/services/polynomial.js`
- `server/services/linearSystems.js`
- `server/services/primes.js`
- `server/services/neural.js`

---

## 5) Protocol ανά εφαρμογή

## 5.1 Polynomial Lab

### WS path
- `/ws/polynomial-lab`

### Client -> Server (`type`)
- `register_teacher`
- `register_student` (name, color)
- `request_state`
- `teacher_lesson` (activityId, datasetKey, expressionId, geogebraRoomId)
- `student_answers` (expressionId, answers)

### Server -> Client (`type`)
- `polynomial_state`
  - `lesson`
  - `participants`
  - `roster`

### Κώδικας
- Server:
  - `server/services/polynomial.js`
    - `emitState` (`type: 'polynomial_state'`)
    - message handlers για τα παραπάνω `type`
- Client:
  - `client/src/labs/polynomial-lab/App.jsx`
    - open socket στο `/ws/polynomial-lab`
    - send `register_*`, `request_state`, `teacher_lesson`, `student_answers`
    - consume `polynomial_state`

---

## 5.2 Linear Systems Lab

### WS path
- `/ws/linear-systems-lab`

### Client -> Server (`type`)
- `register_teacher`
- `register_student` (name, color)
- `request_state`
- `teacher_lesson` (activityId, itemId, showEquationGraph, προαιρετικά geogebraRoomId)
- `student_answers` (activityId, itemId, answers)

### Server -> Client (`type`)
- `linear_systems_state`
  - `lesson`
  - `participants`
  - `roster`

### Σημειώσεις για την τρέχουσα 1η δραστηριότητα
- Στον client η 1η δραστηριότητα στέλνει και coefficients ως answers (`eq1x`, `eq1y`, `eq1rhs`, ...).
- Το plotting γίνεται client-side στο shared component `SimpleCoordinateSystem`.

### Κώδικας
- Server:
  - `server/services/linearSystems.js`
    - `lessonState` (activityId/itemId/showEquationGraph)
    - `emitState` (`type: 'linear_systems_state'`)
- Client:
  - `client/src/labs/linear-systems-lab/App.jsx`

---

## 5.3 Primes Lab

### WS path
- `/ws/primes-lab`

### Client -> Server (`type`)
- `register_teacher`
- `register_student` (studentId, name, color)
- `request_state`
- `select_prime` (teacher)
- `select_active_student` (teacher)
- `student_toggle_number` (student)

### Server -> Client (`type`)
- `primes_state`
  - `currentPrime`
  - `activeStudentId`
  - `students`
  - `viewerStudentId` (για mapping reconnecting student)

### Κώδικας
- Server:
  - `server/services/primes.js`
- Client:
  - `client/src/labs/primes-lab/App.jsx`

---

## 5.4 Neural Lab

### WS path
- `/ws/neural-lab`

### Client -> Server (`type`)
- `register_teacher`
- `register_student`
- `request_state`
- `teacher_lesson`
- `teacher_config`
- `student_state`
- legacy: `student_weight`, `student_weights`

### Server -> Client (`type`)
- `canvas_state`
  - `lesson`
  - `participants`
  - `roster`
  - `me` (student προσωπικό state rehydration)

### Κώδικας
- Server:
  - `server/services/neural.js`
- Client:
  - `client/src/labs/neural-lab/App.jsx`

---

## 5.5 Buffon Needle

### WS path
- `/ws/buffon`

### Client -> Server (`type`)
- `register_teacher`
- `register_student` (team)
- `update` (drops, hits, piEst)
- `start_round`
- `end_round`
- `reset_tournament`

### Server -> Client (`type`)
- `roster`
- `round_start`
- `round_end`
- `reset_tournament`

### Κώδικας
- Server:
  - `server/services/buffon.js`
- Client:
  - teacher: `client/src/labs/buffon-needle/logic/teacher-logic.js`
  - student: `client/src/labs/buffon-needle/logic/student-logic.js`

---

## 5.6 Geometry Live (μέσω `/ws/realtime`)

### Client -> Server (`event`, `data`)
- `user-position`
- `camera-frame`
- `camera-speed-frame`
- `activity-update`

### Server -> Client (`event`, `data`)
- `users-update`
- `camera-points`
- `camera-speed-result`
- `activity-loaded`

### Κώδικας
- Server:
  - `server/services/geometry.js`
- Client:
  - `client/src/labs/geometry-live/js/realtime-socket.js`
  - legacy html integration: `client/src/labs/geometry-live/teacher.html`

---

## 5.8 GeoGebra Collaborative + Monitor (μέσω `/ws/realtime`)

### Client -> Server
- `geogebra:join`
- `geogebra:identity`
- `geogebra:add`
- `geogebra:update`
- `geogebra:remove`
- `geogebra:rename`
- `geogebra:grant`
- monitor:
  - `geogebra:monitor:join`
  - `geogebra:monitor:leave`
  - `geogebra:monitor:clear-feed`

### Server -> Client
- `geogebra:init`
- `geogebra:upsert`
- `geogebra:remove`
- `geogebra:rename`
- `geogebra:permissions`
- `geogebra:error`
- monitor:
  - `geogebra:monitor:snapshot`
  - `geogebra:monitor:event`

### Κώδικας
- Server:
  - `server/services/geogebraCollab.js`
- Client:
  - `client/src/shared/components/CollaborativeGeoGebra.jsx`
  - `client/src/shared/components/GeogebraMonitor.jsx`

---

## 6) HTTP API που συνδέεται με κατάσταση εφαρμογών

## 6.1 Core endpoints

- `GET /health`
- `GET /api/tools`
- `POST /api/tools/geogebra-collab-test/run`

Κώδικας:
- `server/server.js`

## 6.2 Session/App data endpoints

- `GET /api/app-data?app=<appName>`
- `POST /api/app-data`
- `GET /api/session`
- `DELETE /api/session/:sessionId`
- `POST /api/logout`
- `GET /api/admin/stats`

Κώδικας:
- `server/routes/appData.js`

## 6.3 Geometry activity persistence endpoints

- `GET /api/activity/current`
- `GET /api/activity/list`
- `GET /api/activity/load/:filename`
- `POST /api/activity/save`

Κώδικας:
- `server/routes/activities.js`

---

## 7) Message envelopes (συνοπτικά)

## 7.1 Event/Data envelope (`/ws/realtime`)

```json
{
  "data": {
    "role": "student",
    "name": "Maria"
  }
}
```

## 7.2 Type envelope (dedicated ws)

```json
{
  "type": "register_student",
  "name": "Maria",
  "color": "#3b82f6"
}
```

## 7.3 State snapshot envelope παράδειγμα

```json
{
  "type": "polynomial_state",
  "lesson": {
    "activityId": "1.1",
    "datasetKey": "monomials",
    "expressionId": "m-1"
  },
  "participants": [],
  "roster": []
}
```

---

## 8) Observability και debugging protocol

Το project έχει built-in communication logging.

Κώδικας:

- `server/utils/communication.js`
  - `recordCommunication(...)`
- `server/utils/commEventCatalog.js`
  - catalog γνωστών events και περιγραφών
- κάθε service καλεί `record(...)` wrappers για audit

Πρακτικό αποτέλεσμα:

- Μπορείς να δεις τι μπήκε (`direction: in`) και τι βγήκε (`direction: out`) ανά app/event.
- Για regressions στο πρωτόκολλο, ξεκινάς πάντα από communication logs.

---

## 9) Σημαντικές συμβάσεις που πρέπει να τηρούνται

1. **Always sanitize**
- Στον server όλα τα incoming fields περνούν από `sanitizeString(...)` και checks τύπων.

2. **Teacher-authoritative lesson state**
- Αλλαγές `teacher_lesson` γίνονται αποδεκτές μόνο αν το socket είναι registered teacher.

3. **Student answer/state broadcast**
- Student updates μπαίνουν στο προσωπικό state του μαθητή και ο server ξαναστέλνει snapshot.

4. **Reconnect-safe client**
- Client κάνει reconnect και ξαναστέλνει role registration + `request_state`.

5. **Stable session identity**
- Session IDs διατηρούνται στο transport επίπεδο (`sessionMiddleware`/helpers) για observability.

---

## 10) Checklist όταν προσθέτεις νέα εφαρμογή

1. Server service στο `server/services/newApp.js`
2. `WebSocketServer({ noServer: true })` και `emitState`
3. Handler για `register_teacher`, `register_student`, `request_state`
4. Handler για app-specific teacher/student μηνύματα
5. `wsRegistry.register('/ws/new-app', ...)` στο `server/server.js`
6. Client connect/reconnect logic σε React/JS app
7. `recordCommunication` events για tracing
8. Προσθήκη στο `COMM_EVENT_CATALOG` για τεκμηρίωση

---

## 11) Γρήγορο index αρχείων (για πλοήγηση)

- Server entry + ws routing:
  - `server/server.js`
- WS registry:
  - `server/services/websocketRegistry.js`
- Realtime transport (`event/data`):
  - `server/utils/realtimeTransport.js`
- Communication catalog/log:
  - `server/utils/commEventCatalog.js`
  - `server/utils/communication.js`
- App services:
  - `server/services/geometry.js`
  - `server/services/geogebraCollab.js`
  - `server/services/neural.js`
  - `server/services/buffon.js`
  - `server/services/primes.js`
  - `server/services/polynomial.js`
  - `server/services/linearSystems.js`
- Shared client transport:
  - `public/js/realtime-socket.js`
  - `client/src/framework/assets/js/classroom-api.js`
- App clients:
  - `client/src/labs/primes-lab/App.jsx`
  - `client/src/labs/polynomial-lab/App.jsx`
  - `client/src/labs/linear-systems-lab/App.jsx`
  - `client/src/labs/neural-lab/App.jsx`
  - `client/src/labs/buffon-needle/logic/teacher-logic.js`
  - `client/src/labs/buffon-needle/logic/student-logic.js`

---

## 12) Τελική παρατήρηση για consistency

Το project λειτουργεί σωστά επειδή ακολουθεί σταθερό μοτίβο:

- **snapshot-first state sync**,
- **teacher-driven lesson state**,
- **student-driven answer/state updates**,
- **server rebroadcast ως μοναδική πηγή αλήθειας**.

Αν χρειαστεί αλλαγή πρωτοκόλλου σε app, ενημέρωσε ταυτόχρονα:

1. server service,
2. αντίστοιχο client,
3. communication catalog,
4. αυτόν τον οδηγό.
