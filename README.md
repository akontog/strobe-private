SmarT classROoms for emBodied participatory lEarning

# Strobe Multi-User System

Σύστημα πολλαπλών χρηστών για γεωμετρικές δραστηριότητες με real-time tracking.

## Εγκατάσταση

### Node.js & Dependencies
Download: https://nodejs.org

```bash
cd server
npm install express
npm install socket.io
```

Test installation:
```bash
node -v  # π.χ. v24.11.1
```

## Αρχεία

### Server
- `server.js` - Node.js server με Socket.io για real-time communication

### Clients
- `client.html` - Teacher interface (σχεδίαση δραστηριοτήτων)
- `user.html` - User interface (κίνηση σημείου)
- `camera_tracking.py` - Python script για camera-based tracking

## Χρήση

### 1. Εκκίνηση Server
```bash
cd server
node server.js
```

### 2. Teacher Client
Άνοιγμα: `http://localhost:3000/client.html`

Λειτουργίες:
- Σχεδιασμός γεωμετρικών σχημάτων
- **💾 Save**: Αποθήκευση δραστηριότητας σε JSON
- **📂 Load**: Φόρτωση αποθηκευμένης δραστηριότητας
- **📡 Broadcast**: Αποστολή σε users

### 3. User Client
Άνοιγμα: `http://localhost:3000/user.html`

Λειτουργίες:
- **🖱️ Mouse/Touch Mode**: Κίνηση σημείου με ποντίκι ή αφή
- **📹 Camera Mode**: Tracking με webcam (για πλήρη λειτουργία χρησιμοποιήστε Python backend)
- Εμφάνιση δραστηριοτήτων που δημιούργησε ο teacher
- Real-time εμφάνιση όλων των ενεργών χρηστών

### 4. Camera Tracking (Python - Προαιρετικό)

#### Εγκατάσταση dependencies:
```bash
pip install opencv-python python-socketio[client] numpy
```

#### Εκτέλεση:
```bash
# Face tracking (default)
python camera_tracking.py

# Hand tracking
python camera_tracking.py --mode hand
```

Χειριστήρια:
- `q`: Έξοδος
- `s`: Εναλλαγή face/hand tracking

## Αρχιτεκτονική

```
┌──────────────┐
│   Teacher    │ (client.html)
│  - Σχεδιάζει │
│  - Αποθηκεύει│
└──────┬───────┘
       │
       ├── Socket.io ──┐
       │               │
┌──────▼──────┐  ┌─────▼──────────┐
│   Server    │  │  User Clients  │
│  (Node.js)  │  │  ┌───────────┐ │
│             │  │  │ user.html │ │
│ - Broadcast │  │  │ (mouse)   │ │
│ - JSON API  │  │  └───────────┘ │
│ - Activities│  │  ┌───────────┐ │
└─────────────┘  │  │ Python    │ │
                 │  │ (camera)  │ │
                 │  └───────────┘ │
                 └────────────────┘
```

## API Endpoints

### POST `/api/activity/save`
Αποθήκευση δραστηριότητας
```json
{
  "name": "Activity 1",
  "geometry": [...]
}
```

### GET `/api/activity/list`
Λίστα όλων των δραστηριοτήτων

### GET `/api/activity/load/:filename`
Φόρτωση συγκεκριμένης δραστηριότητας

### GET `/api/activity/current`
Τρέχουσα ενεργή δραστηριότητα

## Socket.io Events

### Client → Server
- `user-position`: Αποστολή θέσης χρήστη `{x, y, role, color}`
- `activity-update`: Teacher ενημερώνει γεωμετρία

### Server → Client
- `activity-loaded`: Νέα δραστηριότητα φορτώθηκε
- `users-update`: Ενημέρωση λίστας ενεργών χρηστών

## Σημειώσεις

- Οι δραστηριότητες αποθηκεύονται στον φάκελο `server/activities/`
- Οι θέσεις των users είναι normalized (0-1) για responsive canvas
- Το camera tracking με Python χρησιμοποιεί OpenCV Haar Cascades
        npm -v
            π.χ. 11.6.2

# εκτέλεση
    από το τερματικό:
        node server.js
    browser:
        http://localhost:3000
