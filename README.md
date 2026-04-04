SmarT classROoms for emBodied participatory lEarning

# Strobe Multi-App Classroom

Ενοποιημένο no-login περιβάλλον για classroom activities με real-time συνεργασία.

## Τι περιλαμβάνει

- Multi-app launcher με εφαρμογές: 
  - Geometry Live
  - Buffon Needle
  - Fourier Lab.
- Teacher dashboard και Student launcher χωρίς login flow.
- Legacy geometry canvas με real-time sync teacher-student.
- Admin dashboard με live εικόνα χρηστών.

## Απαιτήσεις

- Node.js 18+
- npm

## Εγκατάσταση

```bash
npm install
```

## Εγκατάσταση σε νέο μηχάνημα (copy/paste)

### 1) Προαπαιτούμενα

- Node.js 18+
- Python 3.11+ (προτείνεται 3.13 όπως στο project)

### 2) Clone + Node install

```powershell
git clone https://github.com/akontog/strobe-private.git
cd "strobe-private\\server"
npm install
```

### 3) Python worker environment

```powershell
cd ".."
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install opencv-python numpy ultralytics deep-sort-realtime setuptools==80.9.0
```

### 4) Προαιρετικά DeepSORT με torch

CPU-only:

```powershell
& ".\.venv\Scripts\python.exe" -m pip install torch torchvision
```

GPU (CUDA build):

1. Επίλεξε το σωστό command από τον PyTorch selector: https://pytorch.org/get-started/locally/
2. Παράδειγμα για CUDA 12.8:

```powershell
& ".\.venv\Scripts\python.exe" -m pip install --index-url https://download.pytorch.org/whl/cu128 torch torchvision
```

Σημαντικό: αν το `torch.__version__` γράφει `+cpu` (π.χ. `2.10.0+cpu`), τότε δεν μπορεί να χρησιμοποιήσει GPU.
Σε αυτή την περίπτωση κάνε reinstall με CUDA wheel από τον selector.

### 5) Εκκίνηση

```powershell
cd "server"
npm start
```

## Εκκίνηση

```bash
cd "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private\server"
npm start
```

## Πώς τρέχω όλο το Geometry (ξεκάθαρα)

### TL;DR

- Δεν χρειάζεται να τρέχεις πρώτα Python χειροκίνητα.
- Τρέχεις τον Node server και αυτός σηκώνει μόνος του τον Python DeepSORT worker.
- Η Python δεν ανοίγει browser.
- Browser ανοίγεις εσύ, χειροκίνητα.

### Προετοιμασία (μία φορά)

1. Node dependencies:

```powershell
cd "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private\server"
npm install
```

2. Python environment + worker dependencies:

```powershell
cd "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install opencv-python numpy ultralytics deep-sort-realtime setuptools==80.9.0
```

Προαιρετικά (για appearance embedder DeepSORT):

```powershell
pip install torch torchvision
```

### Κάθε φορά που θες να δουλέψεις

1. Ξεκίνα τον server:

```powershell
cd "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private\server"
npm start
```

2. Άνοιξε teacher και student pages:

```powershell
start http://localhost:3000/client.html
start http://localhost:3000/user.html
```

3. Στο student page επίλεξε Camera mode αν θες DeepSORT tracking.

### Τι μένει ενεργό

- Ο Node server μένει ενεργός μέχρι να τον σταματήσεις.
- Ο Python worker μένει ενεργός όσο τρέχει ο Node server.
- Με Ctrl+C στον Node server κλείνει και ο Python worker.

### Αν τρέξεις χειροκίνητα python camera_server.py

- Στη νέα αρχιτεκτονική αυτό είναι stdio worker (όχι Flask web server).
- Θα περιμένει JSON requests από stdin και δεν θα ανοίξει browser.
- Για κανονική χρήση Geometry, τρέχεις μόνο `npm start`.

## Βασικά URLs

- Entry page: http://localhost:3000/
- Teacher dashboard: http://localhost:3000/teacher
- Student launcher: http://localhost:3000/student
- Student launcher alias: http://localhost:3000/client
- Admin dashboard: http://localhost:3000/admin
- Legacy Geometry teacher direct: http://localhost:3000/client.html
- Legacy Geometry student direct: http://localhost:3000/user.html
- Health check: http://localhost:3000/health

## Εφαρμογές

### 1) Geometry Live (legacy)

Teacher: `client.html`  
Student: `user.html`

Κύριες δυνατότητες:

- Σχεδίαση σχημάτων (point, line, ray, circle, triangle, rectangle, polygon)
- Grid / snap / line width / χρώματα
- Real-time markers μαθητών (mouse ή camera)



### 2) Buffon Needle

Teacher: `/apps/buffon-needle/teacher.html`  
Student: `/apps/buffon-needle/student.html`

- Multiplayer γύροι μέσω WebSocket
- Roster και scoring flow teacher-student
- WS endpoint: `/ws/buffon`

### 3) Fourier Lab

Teacher/Student entry: `/apps/fourier-lab/index.html?mode=teacher|client`

- Slide sync teacher-client
- Activity telemetry μέσω WebSocket (`fourier:*` events)
- Classroom summary και participant feed

## REST Endpoints

### Legacy Geometry activity API

- `POST /api/activity/save`
- `GET /api/activity/list`
- `GET /api/activity/load/:filename`
- `GET /api/activity/current`

Example payload for save:

```json
{
    "name": "Activity 1",
    "geometry": []
}
```

### Teacher app activities API

- `GET /teacher/apps`
- `GET /teacher/activities/:slug`
- `POST /teacher/activities/:slug`
- `GET /teacher/activities/:slug/:filename`

### Student API

- `GET /client/apps`
- `GET /student/apps`

### Admin API

- `GET /admin/sessions`

Επιστρέφει merged εικόνα από auth sessions και realtime participants, μαζί με stats ανά role/source.

## Real-time γεγονότα

### WebSocket (geometry + fourier)

- Path: `/ws/realtime`
- Message envelope: `{ "event": "<name>", "data": <payload> }`

Client -> Server

- `user-position`
- `camera-frame`
- `activity-update`
- `fourier:join`
- `fourier:set-slide`
- `fourier:interaction`
- `fourier:sound-control`

Server -> Client

- `users-update`
- `activity-loaded`
- `camera-points`
- `fourier:state`
- `fourier:slide`
- `fourier:summary`
- `fourier:participants`
- `fourier:activity-event`
- `fourier:sound-state`

### WebSocket (buffon)

- Path: `/ws/buffon`
- Messages όπως `register_teacher`, `register_student`, `update`, `start_round`, `end_round`, `reset_tournament`

## Camera worker (προαιρετικό)

Για camera mode στο Geometry, ο Node server μιλάει απευθείας με Python DeepSORT worker (`camera_server.py`) μέσω stdio JSON (χωρίς Flask/HTTP ενδιάμεσα).

Σημαντικό: ο worker σηκώνεται αυτόματα από τον Node server. Δεν χρειάζεται δεύτερο βήμα εκκίνησης για Python.

### Γιατί αυτό είναι πιο performant

- Δεν υπάρχει HTTP serialization ανά frame μεταξύ Node και Python.
- Ο Python worker είναι persistent process (χωρίς cold start ανά request).
- Το realtime παραμένει στο ίδιο WebSocket transport του Node (`/ws/realtime`).

### Γρήγορη εκκίνηση (Windows PowerShell)

1. Άνοιξε terminal στο project root:

```powershell
cd "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private"
```

2. Δημιούργησε και ενεργοποίησε virtual environment (μία φορά):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. Εγκατέστησε dependencies του worker:

```powershell
python -m pip install --upgrade pip
pip install opencv-python numpy ultralytics deep-sort-realtime setuptools==80.9.0
```

Προαιρετικά, για appearance embedder mode του Deep SORT (`deepsort-cpu`/`deepsort-gpu`), εγκατάστησε και:

```powershell
pip install torch torchvision
```

4. Ξεκίνα μόνο τον Node server:

```powershell
cd "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private\server"
npm start
```

Ο Node θα κάνει auto-spawn τον Python worker.

### Τι πρέπει να δεις όταν ξεκινάει σωστά

- Log γραμμή όπως: `[camera-worker] enabled: ...\\camera_server.py`.
- Log γραμμή όπως: `[camera-worker] python: ...\\.venv\\Scripts\\python.exe`.
- Log γραμμή όπως: `[camera-worker] [camera] tracking backend: deepsort-cpu`, `deepsort-gpu` ή `deepsort-iou`.
- Αν δεις: `[camera] torch/torchvision not found; using IoU-only Deep SORT profile`, είναι normal και το σύστημα δουλεύει με `deepsort-iou`.
- Αν έχεις CUDA-capable GPU και σωστό torch build, θα δεις log τύπου: `[camera] CUDA is available; trying GPU embedder first` και backend `deepsort-gpu`.
- Αν λείπει το `torch`, ο worker συνεχίζει κανονικά με `deepsort-iou`.
- Αν εμφανιστεί `centroid-fallback`, το app δουλεύει, αλλά χωρίς Deep SORT.

### Ερμηνεία logs που βλέπεις

- `torch/torchvision not found; using IoU-only Deep SORT profile`: σημαίνει ότι δεν υπάρχουν `torch/torchvision`, άρα ο worker πάει απευθείας σε `deepsort-iou`.
- `tracking backend: deepsort-iou`: ο worker είναι έτοιμος και λειτουργικός.
- `stdio worker ready`: ο worker περιμένει frames από τον Node server (σωστή κατάσταση).

Αν δεις το παλιότερο log `Deep SORT init failed ... No module named 'torch'`, σημαίνει ότι τρέχεις παλιότερο build πριν το IoU-only startup fix.

Αν θες full appearance DeepSORT (και όχι IoU-only), εγκατέστησε:

```powershell
pip install torch torchvision
```

### Αν το pip λέει "Requirement already satisfied" αλλά ο worker λέει ότι λείπει το torch

Αυτό σημαίνει σχεδόν πάντα ότι το `pip` έκανε install σε άλλο interpreter (π.χ. system Python), όχι στο `.venv` που χρησιμοποιεί ο Node worker.

1. Δες ποιο python χρησιμοποιεί ο worker από τα logs:

- `[camera-worker] python: ...\\.venv\\Scripts\\python.exe`

2. Κάνε install με αυτό το ακριβές executable:

```powershell
& "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private\.venv\Scripts\python.exe" -m pip install torch torchvision
```

3. Επιβεβαίωση στο ίδιο executable:

```powershell
& "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private\.venv\Scripts\python.exe" -c "import torch, torchvision; print(torch.__version__); print(torchvision.__version__)"
```

### Env vars για camera worker

- `CAMERA_WORKER_ENABLED` (default: `1`)
- `CAMERA_WORKER_PYTHON` (default: auto-detect `.venv`, fallback `python`)
- `CAMERA_WORKER_SCRIPT` (default: `server/camera_server.py`)
- `CAMERA_WORKER_TIMEOUT_MS` (default: `1200`)
- `CAMERA_WORKER_MAX_PENDING` (default: `24`)
- `DEEPSORT_USE_GPU` (default: `auto`, options: `auto`, `gpu`, `cpu`)
- `CAMERA_YOLO_MODEL` (default: `yolov8n.pt`)
- `CAMERA_YOLO_CLASSES` (default: `person,sports ball,book`)
- `CAMERA_YOLO_CONF` (default: `0.35`)
- `CAMERA_YOLO_MIN_AREA` (default: `320` px²)

Συμπεριφορά `DEEPSORT_USE_GPU`:

- `auto`: αν βρεθεί CUDA, δοκιμάζει πρώτα GPU και fallback σε CPU.
- `gpu`: προσπαθεί GPU first, αλλά αν δεν υπάρχει CUDA κάνει fallback σε CPU.
- `cpu`: κρατάει μόνο CPU embedder mode.

Παράδειγμα (PowerShell):

```powershell
$env:CAMERA_WORKER_PYTHON = "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private\.venv\Scripts\python.exe"
$env:CAMERA_WORKER_TIMEOUT_MS = "1500"
$env:DEEPSORT_USE_GPU = "auto"
npm start
```

Γρήγορος έλεγχος CUDA στο worker environment:

```powershell
& "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private\.venv\Scripts\python.exe" -c "import torch; print('torch=', torch.__version__); print('cuda_available=', torch.cuda.is_available()); print('cuda_runtime=', torch.version.cuda)"
```

## Δομή (συνοπτικά)

```text
server/
    server.js
    apps/
        registry.js
        buffon-needle/
        fourier-lab/
    public/
        index.html
        client.html
        user.html
    routes/
        admin.js
        apps.js
        teacher.js
        client.js
    activities/
```

## Troubleshooting

Έλεγχος αν ακούει κάτι στο 3000:

```powershell
netstat -ano | findstr :3000
```

Τερματισμός διεργασίας:

```powershell
taskkill /PID 12345 /F
```
