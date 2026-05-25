SmarT classROoms for emBodied participatory lEarning
Strobe Multi-App Classroom
Ενοποιημένο no-login περιβάλλον για classroom activities με real-time συνεργασία.

# Τεχνολογίες Επικοινωνίας
SmarT classROoms for emBodied participatory lEarning
Strobe Multi-App Classroom

Ενοποιημένο no-login περιβάλλον για classroom activities με real-time συνεργασία.

# Εφαρμογές
- Geometry Live
- Buffon Needle
- Fourier Lab
- Neural Lab

# Αρχιτεκτονική
- Ένα κεντρικό Node server στο project root.
- Όλες οι εφαρμογές μέσα στο apps (ξεχωριστός φάκελος ανά app).
- Shared assets στο assets.
- Session/data storage στο server με in-memory + file persistence (data/users.json).

# Δομή φακέλων

```text
strobe-private/
    server.js
    package.json
    apps/
        geometry-live/
        buffon-needle/
        fourier-lab/
        neural-lab/
        registry.js
    assets/
        css/
        js/
    public/
        index.html
        launcher.html
        client.html
        user.html
    routes/
    services/
    middleware/
    activities/
    data/
        users.json
    camera_server.py
    camera_tracking.py
```

# Απαιτήσεις
- Node.js 18+
- npm
- Python 3.11+ (προτείνεται 3.13)

# Εγκατάσταση

```powershell
cd "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private"
npm install
```

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

### Βασικά URLs
- Entry: http://localhost:3000/
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

### Εκκίνηση με screen

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

### Troubleshooting

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
- student_weight
- teacher_config

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

