# README-vision

Ο παρών οδηγός περιγράφει το νέο workflow **Συνεργατικής ιχνηλάτησης vision** που ενσωματώθηκε στο `strobe-private`.

## Τι υλοποιήθηκε

1. **React page στο menu “Συνεργασία”**
   - Route: `/tools/vision-collab`
   - Εμφανίζει live camera stream στον browser.
   - Στέλνει καρέ σε FastAPI backend και λαμβάνει πίσω tracking σημεία/κουτιά.

2. **Shared resource component**
   - Αρχείο: `client/src/shared/components/resources/VisionCollaborationBoard.jsx`
   - Overlay:
     - δραστηριότητες από `vision/temp/activities/*.json`
     - σημεία/κουτιά tracking από Python.

3. **FastAPI bridge server**
   - Αρχείο: `vision/fastapi_vision_server.py`
   - Endpoint WebSocket: `/ws/vision`
   - Endpoint δραστηριοτήτων: `/vision/activities`
   - Καλεί τον υπάρχοντα tracker του `vision/camera_server.py` (`process_request`).

4. **Ενσωμάτωση στο υπάρχον app shell**
   - Προστέθηκε στοιχείο στο menu `Συνεργασία`.
   - Προστέθηκε route και tool entry στο `/api/tools`.
   - Προστέθηκαν μεταφράσεις σε `en/el`.
   - Προστέθηκε υποστήριξη classroom selection/session για `vision-collab`.

---

## Αρχιτεκτονική δεδομένων (browser ↔ fastapi ↔ python)

1. Browser ζητά camera με `navigator.mediaDevices.getUserMedia(...)` (WebRTC media capture API).
2. Κάθε ~100ms:
   - γίνεται capture frame σε hidden canvas,
   - μετατροπή σε JPEG base64,
   - αποστολή μέσω WebSocket στο FastAPI (`/ws/vision`).
3. FastAPI:
   - δίνει το frame στον tracker (`camera_server.process_request`),
   - επιστρέφει JSON με `points`, `boxes`, `tracking`, `serverElapsedMs`.
4. Browser:
   - ζωγραφίζει activity template (polygon/line),
   - ζωγραφίζει tracking points/boxes πάνω στο video.

---

## Αρχεία που προστέθηκαν

- `vision/fastapi_vision_server.py`
- `client/src/tools/vision-collab/VisionCollabTool.jsx`
- `client/src/shared/components/resources/VisionCollaborationBoard.jsx`
- `client/src/shared/components/resources/VisionCollaborationBoard.css`

## Αρχεία που ενημερώθηκαν (κύρια)

- `client/src/App.jsx`
- `client/src/pages/ToolsPage.jsx`
- `client/src/shared/components/index.js`
- `client/src/locales/en/navigation.json`
- `client/src/locales/el/navigation.json`
- `client/src/locales/en/interface.json`
- `client/src/locales/el/interface.json`
- `server/server.js`
- `server/services/classroomSelection.js`
- `server/routes/teacher.js`

---

## Setup / Run

### 1) Python περιβάλλον

Από root του repo:

```powershell
Set-Location "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private"
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install ultralytics
```

### 2) Εκκίνηση main app (Node)

```powershell
Set-Location "C:\Users\akont\OneDrive - aegean.gr\Έγγραφα\GitHub\strobe-private"
npm start
```

Το vision collaboration πλέον σερβίρεται από τον ίδιο Node server:
- HTTP: `http://localhost:3000/api/vision/*`
- WebSocket: `ws://localhost:3000/ws/vision`

### 3) Χρήση

1. Συνδέσου ως teacher.
2. Πήγαινε: `Συνεργασία -> Vision Tracking`.
3. Πάτησε **Start collaboration stream**.
4. Επίλεξε activity template από dropdown.
5. Παρατήρησε overlay:
   - μπλε/κόκκινα σχήματα δραστηριότητας,
   - πράσινα tracking boxes,
   - κόκκινα tracking points.

---

## Troubleshooting

1. **WebSocket error**
   - Έλεγξε ότι ο Node server τρέχει στο `http://localhost:3000`.
   - Έλεγξε ότι το URL στο πεδίο `Vision FastAPI server URL` είναι `http://localhost:3000` (ή το IP του server με port `3000`).

2. **No detections**
   - Έλεγξε φωτισμό/κάδρο.
   - Έλεγξε ότι υπάρχουν τα μοντέλα στο `vision/models/`.
   - Έλεγξε ότι `ultralytics` είναι εγκατεστημένο στο ίδιο `.venv`.

3. **Camera denied**
   - Ενεργοποίησε δικαιώματα κάμερας στον browser.

4. **Activity file parse issues**
   - Ο loader του server κάνει best-effort σε αρχεία με git conflict markers (κρατά το HEAD block).
