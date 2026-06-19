SmarT classROoms for emBodied participatory lEarning
Strobe Multi-App Classroom
Ενοποιημένο no-login περιβάλλον για classroom activities με real-time συνεργασία.

# Τεχνολογίες:

## frontend

- html
- css
- js
- ts 
- react

## backend

- node.js
- python (computer vision)

## επικοινωνία

- websockets
- WebRTC (video feed)

## αρχεία

- json

## package manager

- npm 

# Εφαρμογές

- Geometry Live
- Buffon Needle
- [Fourier Lab](reports/fourier-lab/README-fourier-lab.md)
- [Neural Lab](reports/neural-lab/README-neural-lab)

# Αρχιτεκτονική
- Ένα κεντρικό Node server στο project root.
- Όλες οι εφαρμογές μέσα στο apps (ξεχωριστός φάκελος ανά app).
- Shared assets στο assets.
- Κοινό WebSocket API client για όλα τα apps: `apps/assets/js/classroom-api.js`.
- Κοινό classroom dock UI module: `apps/assets/js/classroom-shared.js` + `apps/assets/css/classroom-shared.css`.
- Session/data storage στο server με in-memory + file persistence (data/users.json).

# Δομή φακέλων

## 📁 Ρίζα φακέλου `strobe-private/`

- **`server.js`**  
  – Κύριος διακομιστής Node.js (Express ή native http).  
  – Ξεκινά το WebSocket server, σερβίρει στατικές σελίδες, διαχειρίζεται routes.

- **`package.json`**  
  – Λίστα dependencies (π.χ. express, ws, socket.io) και scripts εκκίνησης.

- **`camera_server.py`**  
  – Python server για λήψη ροής από κάμερα (πιθανώς HTTP ή WebSocket).  
  – Επικοινωνεί με το `camera_tracking.py`.

- **`camera_tracking.py`**  
  – Ανίχνευση κίνησης / προσώπων / ματιών (OpenCV).  
  – Στέλνει δεδομένα (π.χ. συντεταγμένες) στο Node server ή απευθείας στο frontend.

## 📂 `apps/` – Εφαρμογές / Δραστηριότητες
Κάθε υποφάκελος περιέχει μία αυτόνομη web app.

### Παραδοσιακές εφαρμογές (HTML/JS)
- **`geometry-live/`**  
  – Διαδραστική γεωμετρία (σημεία, γραμμές, κύκλους) με real-time σχεδίαση.

- **`buffon-needle/`**  
  – Προσομοίωση της βελόνας του Buffon.

- **`fourier-lab/`**  
  – 

- **`neural-lab/`**  
  – Απλό νευρωνικό δίκτυο ή επίδειξη perceptron.

### React Εφαρμογές
- **`neural-lab-teacher/`** (React)  
  – Διδακτική εφαρμογή για νευρωνικά δίκτυα (εξίσωση w₁·i₁ + w₂·i₂ = o).  
  – Περιέχει components από `shared-components/`.  
  – Δείτε [neural-lab-teacher/README.md](apps/neural-lab-teacher/README.md) για λεπτομέρειες.

### Κοινά Στοιχεία
- **`shared-components/`**  
  – Κοινά React components που χρησιμοποιούνται από πολλαπλές React εφαρμογές.  
  – Components για αριθμητικά κουτάκια, εργαλειοθήκες, κ.λπ.  
  – Δείτε [shared-components/README.md](apps/shared-components/README.md).

- **`registry.js`**  
  – Καταγράφει όλες τις διαθέσιμες εφαρμογές (όνομα, διαδρομή, metadata).  
  – Χρησιμοποιείται από το `launcher.html` για τη δημιουργία μενού.

## 📂 `assets/` – Στατικά αρχεία (CSS, JS)

### `css/`
- **`classroom-shared.css`** – Κοινό στυλ για όλες τις σελίδες (π.χ. grid, χρώματα, τυπογραφία).  
- **`presentation-shell.css`** – Στυλ για το “κέλυφος” παρουσίασης (πλαϊνή μπάρα, κουμπιά πλοήγησης).

### `js/`
- **`classroom-api.js`**  
  – Διαχειρίζεται WebSocket σύνδεση με τον server.  
  – Αποστολή / λήψη αρχείων JSON (π.χ. αποτελέσματα ασκήσεων, παραμετροποίηση).

- **`classroom-shared.js`**  
  – Υλοποιεί το γραφικό πλαϊνό **Dock**.
    - Περιεχόμενα
    - 

- **`presentation-config.js`**  
  – Ρυθμίσεις για τη λειτουργία “παρουσίασης” (slides, επόμενο/προηγούμενο).

- **`presentation-shell.js`**  
  – Δημιουργεί το περιβάλλον παρουσίασης (χειρισμός event, φόρτωση slides).

- **`presentation-toc.js`**  
  – Δημιουργεί αυτόματα τον πίνακα περιεχομένων (TOC) της παρουσίασης.

## 📂 `public/` – HTML σελίδες (served από τον Node)

- **`index.html`** – Αρχική σελίδα (ίσως επιλογή μεταξύ launcher, client, user).  
- **`launcher.html`** – Εκκινητής εφαρμογών (πλέγμα με όλα τα apps από το registry.js).  
- **`client.html`** – Προβολή μαθητή / συμμετέχοντα (σύνδεση στο WebSocket, αποστολή απαντήσεων).  
- **`user.html`** – Σελίδα διαχείρισης χρήστη (login, προφίλ, στατιστικά).

## 📂 `routes/` – Server-side routing (Express)
– Κάθε αρχείο ορίζει ένα σύνολο endpoints, π.χ. `api.js`, `auth.js`, `presentation.js`.  
– Διαχωρίζουν λογική: αποθήκευση αποτελεσμάτων, ανάκτηση δεδομένων χρήστη.

## 📂 `services/` – Επιχειρηματική λογική / βοηθητικά modules
– Π.χ. `websocket-service.js` (χειρισμός connections, broadcasts),  
– `camera-service.js` (ενσωμάτωση με τα python scripts),  
– `user-service.js` (εγγραφή/ταυτοποίηση).

## 📂 `middleware/` – Express middleware
– Έλεγχος ελέγχου ταυτότητας, logging, CORS, σφαλμάτων.

## 📂 `activities/` – Δεδομένα / περιγραφές δραστηριοτήτων
– Πιθανώς αρχεία JSON με οδηγίες για κάθε άσκηση.

## 📂 `data/` – Αποθήκευση σε αρχεία (JSON)
- **`users.json`** – Λίστα χρηστών (username, role, progress, settings).

---

# Απαιτήσεις
- Node.js 18+
- npm
- Python 3.11+ (προτείνεται 3.13)

# Εγκατάσταση

## Node.js dependencies setup

```powershell
cd "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private"
npm install
```

## React installation

React έχει ήδη εγκατασταθεί για χρήση στο project. Για να δημιουργήσετε React components:

```powershell
# Το React και React-DOM είναι ήδη διαθέσιμα μετά το npm install
# Εάν χρειαστείτε επιπλέον εργαλεία:
npm install --save-dev @babel/core @babel/preset-react babel-loader
npm install --save-dev webpack webpack-cli
```

### Δημιουργία React Εφαρμογής

Για να δημιουργήσετε μια νέα React εφαρμογή:

1. **Δημιουργήστε φάκελο** στο `apps/your-app-name/`
2. **Δημιουργήστε components** σε `components/` folder
3. **Δημιουργήστε App.jsx** και `index.jsx` entry points
4. **Δημιουργήστε index.html** που φιλοξενεί το `<div id="root"></div>`

### Χρήση Shared Components

Προσθέστε κοινά components από το `apps/shared-components/`:

```javascript
import { BlueNumberBox, RedNumberBox, InputBoxStyle, ProductResult } from '../shared-components/components/BlueNumberBox';
import { ToolButton, Toolbar } from '../shared-components/components/Toolbar';

// Χρησιμοποίηση στο component
export const MyComponent = () => (
  <div>
    <BlueNumberBox value={4} />
    <RedNumberBox value={2} />
  </div>
);
```

### Παράδειγμα: Neural Lab Teacher

Δείτε το `apps/neural-lab-teacher/` για πλήρες παράδειγμα React εφαρμογής με:
- Χρήση React hooks (useState)
- Component composition (TeacherCard, VerticalProducts, StudentTable)
- Styling με CSS
- Ενσωμάτωση MathJax

### Δημιουργία νέας React εφαρμογής

Δείτε το αρχείο [REACT_GUIDE.md](REACT_GUIDE.md) για αναλυτικές οδηγίες.

## Python worker setup (μία φορά)

```powershell
cd "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install opencv-python numpy ultralytics deep-sort-realtime setuptools==80.9.0
```

Προαιρετικά για appearance embedder DeepSORT:

```powershell
& ".\.venv\Scripts\python.exe" -m pip install torch torchvision
```

# Εκκίνηση

## Τοπικά
```powershell
cd "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private"
npm start
```

Σημείωση: ο Node server κάνει auto-spawn τον Python camera worker.

### URLs
- Είσοδος: http://localhost:3000/
- Teacher dashboard: http://localhost:3000/teacher
- Student launcher: http://localhost:3000/student
- Student launcher alias: http://localhost:3000/client
- Admin dashboard: http://localhost:3000/admin
- Apps launcher: http://localhost:3000/apps-launcher
- Geometry teacher direct (legacy): http://localhost:3000/client.html
- Geometry student direct (legacy): http://localhost:3000/user.html
- Camera speed test: http://localhost:3000/camera-speed-test
- Health: http://localhost:3000/health

## Myria server

### Αρχεία/Φακέλοι που πρέπει να μεταφερθούν

Μεταφορά των ακόλουθων αρχείων και φακέλων στον `/var/www/html/dmlt/node`:

**Απαραίτητα αρχεία:**
- `server.js` - κύριο αρχείο εκκίνησης
- `package.json` - npm dependencies
- `package-lock.json` - npm lock file

**Φάκελοι:**
- `activities/` - activity configurations
- `apps/` - όλες οι εφαρμογές (geometry-live, buffon-needle, fourier-lab, neural-lab)
- `assets/` - κοινά assets (CSS, JS)
- `middleware/` - Express middleware
- `public/` - static files (index.html, launcher.html, κλπ)
- `routes/` - API routes
- `services/` - business logic (UserManager, etc)
- `views/` - templates (αν υπάρχουν)

**Python scripts (για camera tracking):**
- `camera_server.py`
- `camera_tracking.py`

**Προαιρετικά (αν χρησιμοποιείται):**
- `data/users.json` - αν έχει προϋπάρχοντα δεδομένα
- `.env` - environment variables (δημιουργείται ή ενημερώνεται στον server)

**ΔΕΝ απαιτείται μεταφορά:**
- `node_modules/` - θα δημιουργηθεί με `npm install`
- `.venv/` - Python virtual environment θα δημιουργηθεί στον server
- `.git/` - version control δεν είναι απαραίτητο
- `node_modules/`, `.venv/`, `.git/` να αγνοηθούν

### Setup στον Myria server

Σωστός φάκελος:
```bash
cd /var/www/html/dmlt/node
```

Εγκατάσταση dependencies:
```bash
npm install
# Και setup Python:
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install opencv-python numpy ultralytics deep-sort-realtime setuptools==80.9.0
```

#### Εκκίνηση με screen

Για να λειτουργεί ακόμα κι αν κλείσει η σύνδεση:
```bash
screen
npm start
# Ctrl+A και μετά D για να βγεις από το screen
```

Για να επανασυνδεθείς στο screen:
```bash
screen -r
```
detach συνεδρίας (μετά μπορώ να την πάρω με screen -r <id>)
screen -d 2061641

#### Troubleshooting

Θύρα 3000 πιασμένη;
```bash
ss -tulpn | grep 3000
```

Τερματισμός διεργασίας με PID:
```bash
kill -9 <PID>
```

## App routes
- Geometry Live:
    - /apps/geometry-live/teacher.html
    - /apps/geometry-live/student.html
- Buffon Needle:
    - /apps/buffon-needle/teacher.html
    - /apps/buffon-needle/student.html
- Fourier Lab:
    - /apps/fourier-lab/index.html?mode=teacher
    - /apps/fourier-lab/index.html?mode=student
- Neural Lab:
    - /apps/neural-lab/teacher.html
    - /apps/neural-lab/student.html

## Session/Data αποθήκευση (Επιλογή 1)
- Υλοποίηση: services/UserManager.js
- Middleware: middleware/sessionMiddleware.js
- Endpoints: routes/appData.js
- Storage file: data/users.json

Ο server αποθηκεύει:
- sessionId/userId
- metadata χρήστη
- app-specific state (geometry-live, fourier-lab, buffon-needle, neural-lab)
- timestamps activity

## REST Endpoints

### Legacy Geometry Activity
- POST /api/activity/save
- GET /api/activity/list
- GET /api/activity/load/:filename
- GET /api/activity/current

### Teacher
- GET /teacher/apps
- GET /teacher/activities/:slug
- POST /teacher/activities/:slug
- GET /teacher/activities/:slug/:filename

### Student
- GET /client/apps
- GET /student/apps

### Admin
- GET /admin/sessions
- GET /admin/messages
- POST /admin/messages/clear
- GET /admin/messages/catalog

### Session/App Data
- GET /api/session
- POST /api/logout
- GET /api/app-data?app=<slug>
- POST /api/app-data
- DELETE /api/session/:sessionId
- GET /api/admin/stats

## Real-time (WebSockets)

Κοινό client API για όλες τις εφαρμογές:
- `window.SharedClassroomApi.createClient({ wsPath, reconnectDelayMs, onOpen, onMessage, onClose, onError })`
- Στα app-level wrappers: `createRealtimeSocket` (geometry/fourier) και direct χρήση στο neural/buffon.

Κοινό baseline event contract (προτεινόμενο):
- register: `register_teacher`, `register_student`
- state sync: `request_state`, `*_state`, `roster`
- interaction: app-specific events (`fourier:*`, `update`, `student_weights`, κλπ)

### /ws/realtime
Client -> Server (ενδεικτικά):
- user-position
- camera-frame
- activity-update
- fourier:join
- fourier:set-slide
- fourier:interaction
- fourier:sound-control
- fourier:heat-control
- fourier:heat-time-control

Server -> Client (ενδεικτικά):
- users-update
- activity-loaded
- camera-points
- fourier:state
- fourier:slide
- fourier:summary
- fourier:participants
- fourier:sound-state
- fourier:heat-state
- fourier:heat-time-state

### /ws/buffon
- register_teacher
- register_student
- update
- start_round
- end_round
- reset_tournament

### /ws/neural-lab
- register_teacher
- register_student
- request_state
- student_weights
- student_weight (legacy)
- canvas_state
- roster (μέσα στο `canvas_state` payload)

## Camera worker
- Script: camera_server.py
- Model: yolov8n.pt
- Transport: stdio JSON (όχι Flask HTTP)

Χρήσιμα env vars:
- CAMERA_WORKER_ENABLED
- CAMERA_WORKER_PYTHON
- CAMERA_WORKER_SCRIPT
- CAMERA_WORKER_TIMEOUT_MS
- CAMERA_WORKER_MAX_PENDING
- DEEPSORT_USE_GPU

## Troubleshooting

Έλεγχος θύρας 3000:

```powershell
netstat -ano | findstr :3000
```

Τερματισμός process:

```powershell
taskkill /PID <PID> /F
```
2. Άνοιξε teacher και student pages:

