# Τεχνολογίες

## frontend

- html
- css
- js
- ts 
- react

## backend

1 ή 2 server;; (Ξεκίνημα με 1 και βλέπουμε)
- node.js
  - Στήσιμο σε myria
  - cloudflared tunnel
- FastAPI 

## CV

- python (OpenCV + να επιλέξω αλγόριθμο)

## επικοινωνία

- websockets (ταχύτητα, ευελιξία π.χ. message format - json)
- WebRTC (video feed) STUN / TURN;;;

## κατάσταση;;;

- redis;;; (να τσεκάρω)

## αποθήκευση δεδομένων

- json

## package manager

- npm 


# Αρχιτεκτονική

- Ένα κεντρικό Node server στο project root.
- Όλες οι εφαρμογές μέσα στο apps (ξεχωριστός φάκελος ανά app).
- Shared assets στο assets.
- Κοινό WebSocket API client για όλα τα apps: `apps/assets/js/classroom-api.js`.
- Κοινό classroom dock UI module: `apps/assets/js/classroom-shared.js` + `apps/assets/css/classroom-shared.css`.
- Session/data storage στο server με in-memory + file persistence (data/users.json).

# Δομή φακέλων


- **`package.json`**  
  – Λίστα dependencies (π.χ. express, ws, socket.io) και scripts εκκίνησης.

- **`camera_server.py`**  
  – Python server για λήψη ροής από κάμερα (πιθανώς HTTP ή WebSocket).  
  – Επικοινωνεί με το `camera_tracking.py`.

- **`camera_tracking.py`**
   
  – Ανίχνευση κίνησης / προσώπων / ματιών (OpenCV).  
  – Στέλνει δεδομένα (π.χ. συντεταγμένες) στο Node server ή απευθείας στο frontend.

## 📂 `server/`

- **`server.js`**  
  – Κύριος διακομιστής Node.js (Express ή native http).  
  – Ξεκινά το WebSocket server, σερβίρει στατικές σελίδες, διαχειρίζεται routes.

## 📂 `client/`

κώδικας διεπαφής χρήστη

### 📂 `dist/`

Δημιουργείται αυτόματα στο build. Περιέχει minified αρχεία (HTML, CSS, JS)

### 📂 `public/`

Στατικά αρχεία (π.χ. strobelogo.svg) που αντιγράφονται αυτούσια στο build

### 📂 `src/`

Ο κώδικας


## 📂 `apps/` – Εφαρμογές / Δραστηριότητες

Κάθε υποφάκελος περιέχει μία αυτόνομη web app.

### Υποφάκελοι (εφαρμογές)
- **`geometry-live/`**  
  – Διαδραστική γεωμετρία (σημεία, γραμμές, κύκλους) με real-time σχεδίαση.

- **`buffon-needle/`**  
  – Προσομοίωση της βελόνας του Buffon.

- **`fourier-lab/`**  
  – 

- **`neural-lab/`** (React)  
  – Διδακτική εφαρμογή για νευρωνικά δίκτυα (εξίσωση w₁·i₁ + w₂·i₂ = o).  

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

## 📂 `public/` – HTML σελίδες

### index.html

Αρχική σελίδα
http://localhost:3000/   
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

## 📂 `reports/` – Αναφορές δραστηριοτήτων

### neural-lab
- [readme](reports/neural-lab/README-neural-lab.md)

## 📂 `data/` – Αποθήκευση σε αρχεία (JSON)
- **`users.json`** – Λίστα χρηστών (username, role, progress, settings).

--- 

# Απαιτήσεις
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
- Python 3.11+ (προτείνεται 3.13)

# Εγκατάσταση

## Node.js dependencies setup
- Python 3.11+ (optional, needed for camera features)

## Install
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

1. **Δημιουργήστε φάκελο** στο `apps/<όνομα εφαρμογής>/`
2. **Δημιουργήστε components** σε `components/` folder
3. **Δημιουργήστε App.jsx** και `index.jsx` entry points
4. **Δημιουργήστε index.html** που φιλοξενεί το `<div id="root"></div>`

### Χρήση Shared Components

Προσθέστε κοινά components από το `apps/shared-components/`:

```javascript
import { BlueNumberBox, RedNumberBox, InputBoxStyle, ProductResult } from '../shared-components/BlueNumberBox';
import { ToolButton, Toolbar } from '../shared-components/Toolbar';

// Χρησιμοποίηση στο component
export const MyComponent = () => (
  <div>
    <BlueNumberBox value={4} />
    <RedNumberBox value={2} />
  </div>
);
```

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

### Εκτλεση react

Δημιουργία από την αρχή όλου του φακέλου client/dist
```
npm run build:all
```
Αλλαγή κάποιου συγκεκριμένου lab, π.χ. neural-lab
```
npm run build:neural-lab
```

### 1) Server (production-style local)
```powershell
cd "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private"
npm start
```
Runs server/server.js on port 3000 by default.

Σημείωση: ο Node server κάνει auto-spawn τον Python camera worker.

## Troubleshooting

Έλεγχος θύρας 3000:

### 2) Client (Vite dev)
```powershell
netstat -ano | findstr :3000

```
Runs Vite dev server (default port 5173).

Τερματισμός process:

## Build
### Build client
```powershell
taskkill /PID <PID> /F
npm run build:client
```
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

### Αρχεία/Φάκελοι που πρέπει να μεταφερθούν

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
(or npm run build)

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
### Build linear separation tool
```powershell
npm run build:linear
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



## Notes
- Root apps/ and root routes/ are removed to avoid duplication.
- App routing metadata now lives only in server/apps/registry.js.