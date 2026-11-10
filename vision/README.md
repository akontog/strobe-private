# Vision Tracking

Vision adds camera-based object detection and point tracking to the application. This folder contains the Python worker, the models, and the activity templates. The user interface and the collaborative connection are located in the `client` and `server` folders.

## How it works

1. The teacher opens **Tools → Vision Tracking** at the path `/tools/vision` and allows camera access.
2. The browser sends image frames via WebSocket to the Node server.
3. The Node server forwards each frame to the Python worker `vision/camera_server.py` and sends the results to the connected users.
4. Students see the shared points and can add their own points to the board.

The worker starts automatically from the Node server when needed. There is no need to start the FastAPI separately for normal use of the tool.

## Getting Started

From the repository root, create a Python environment and install the dependencies:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r vision\requirements.txt
```

Then, in a separate terminal, start the application:

```powershell
npm start
```
The server uses the repository's `.venv` automatically, when it exists. In a different location, you can set `CAMERA_WORKER_PYTHON` to the path of the Python interpreter that has the above dependencies.

Open the application in the browser, connect the teacher, and select **Activities - Camera** or any activity that supports the camera. Camera access requires a secure browser context, such as `localhost` or HTTPS.

## Settings

The Node server supports the following environment variables:

| Variable | Purpose |
|---|---|
| `CAMERA_WORKER_ENABLED=0` | Disables the Python worker. |
| `CAMERA_WORKER_PYTHON` | Sets the Python interpreter for the worker. |
| `CAMERA_YOLO_MODEL` | Sets a different YOLO model file. |
| `CAMERA_YOLO_CONF` | Sets the detection confidence threshold. |
| `VITE_VISION_SERVER_URL` | Sets the base server address used by the browser. By default, the current address of the application is used. |

The default models are located in `vision/models/`. Pose tracking uses the MediaPipe model `pose_landmarker_lite.task`. If the file is missing, the worker attempts to download it on first use.

## Node server Endpoints

| Route | Description |
|---|---|
| `GET /api/vision/health` | Returns whether the camera worker is active. |
| `GET /api/vision/activities` | Returns the available activity templates. |
| `WS /ws/vision` | Transfers camera frames, tracking results, and student points. |

Activity templates are loaded from `vision/temp/activities/`. Each JSON file must contain at least one point:

```json
{
  "sourceWidth": 640,
  "sourceHeight": 480,
  "points": {
    "center": { "x": 320, "y": 240, "color": "#2563eb", "width": 3 }
  },
  "shapes": [
    { "type": "line", "points": ["center"], "color": "#2563eb", "width": 3 }
  ]
}
```

The coordinates are in pixels relative to the `sourceWidth` and `sourceHeight` dimensions. The `color` and `width` are optional. The `shapes` can be an empty array.

## Files

- `camera_server.py` — worker that reads JSON requests from standard input and returns JSON results.
- `camera_tracking.py` — older standalone tracking tool.
- `fastapi_vision_server.py` — alternative FastAPI endpoint for the same worker.
- `pose/` — initialization and execution of pose tracking with MediaPipe.
- `models/` — YOLO and MediaPipe model files.
- `temp/activities/` — activity templates loaded by the Node server.
- `requirements.txt` — Python dependencies.

The UI is located in `client/src/tools/vision-collab/` and the shared canvas in `client/src/shared/components/resources/VisionCollaborationBoard.jsx`. WebSocket management and worker startup are located in `server/server.js` and `server/utils/cameraWorker.js`.

### Optional FastAPI server

The FastAPI does not start from `npm start`. It can be started separately for testing or independent clients:
```powershell
python -m uvicorn vision.fastapi_vision_server:app --host 0.0.0.0 --port 8001
```

It provides `GET /health`, `GET /vision/activities`, and `WS /ws/vision`. Its HTTP routes are different from the Node server's `/api/vision/...`.

## Troubleshooting

- **The camera does not open:** check the camera permissions in the browser and use `localhost` or HTTPS.
- **The worker does not start:** check that the active Python environment has `vision/requirements.txt` installed. You can explicitly set `CAMERA_WORKER_PYTHON`.
- **No detections appear:** check the `[camera-worker]` messages in the Node server terminal and that the model `vision/models/yolov8n.pt` exists.
- **No templates appear:** check that the files in `vision/temp/activities/` are valid JSON and have `points` and `shapes`.
- **Connection problem:** check that the browser uses the Node server and that the WebSocket `/ws/vision` is not blocked by a firewall or proxy.