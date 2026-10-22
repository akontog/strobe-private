"""
FastAPI bridge for embodied vision collaboration.
Receives camera frames through WebSocket and returns tracking points/boxes.
"""

import asyncio
import glob
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

try:
    from .camera_server import build_empty_response, process_request
except ImportError:
    from camera_server import build_empty_response, process_request


HOST = os.getenv("VISION_FASTAPI_HOST", "0.0.0.0")
PORT = int(os.getenv("VISION_FASTAPI_PORT", "8001"))
ACTIVITIES_DIR = Path(__file__).parent / "temp" / "activities"


app = FastAPI(title="strobe-vision-fastapi", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def sanitize_base64_image(raw_image: Any) -> str:
    text = str(raw_image or "").strip()
    if not text:
        return ""
    if text.startswith("data:") and "," in text:
        return text.split(",", 1)[1]
    return text


def resolve_git_conflicts(raw_text: str) -> str:
    keep_lines: List[str] = []
    state = "normal"

    for line in raw_text.splitlines():
        if line.startswith("<<<<<<<"):
            state = "head"
            continue
        if line.startswith("=======") and state == "head":
            state = "other"
            continue
        if line.startswith(">>>>>>>") and state in {"head", "other"}:
            state = "normal"
            continue

        if state in {"normal", "head"}:
            keep_lines.append(line)

    return "\n".join(keep_lines)


def validate_activity_payload(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not isinstance(payload, dict):
        return None

    points = payload.get("points")
    shapes = payload.get("shapes")
    if not isinstance(points, dict) or not isinstance(shapes, list):
        return None

    normalized_points: Dict[str, Dict[str, float]] = {}
    for key, point in points.items():
        if not isinstance(point, dict):
            continue
        if "x" not in point or "y" not in point:
            continue
        normalized_points[str(key)] = {
            "x": float(point["x"]),
            "y": float(point["y"]),
            "color": str(point.get("color", "#2563eb")),
            "width": float(point.get("width", 3)),
        }

    normalized_shapes: List[Dict[str, Any]] = []
    for shape in shapes:
        if not isinstance(shape, dict):
            continue
        shape_points = shape.get("points")
        if not isinstance(shape_points, list):
            continue
        normalized_shapes.append(
            {
                "type": str(shape.get("type", "line")),
                "points": [str(point_id) for point_id in shape_points],
                "color": str(shape.get("color", "#2563eb")),
                "width": float(shape.get("width", 3)),
            }
        )

    if not normalized_points:
        return None

    return {
        "points": normalized_points,
        "shapes": normalized_shapes,
        "sourceWidth": float(payload.get("sourceWidth", 640)),
        "sourceHeight": float(payload.get("sourceHeight", 480)),
    }


def load_activity_file(file_path: Path) -> Optional[Dict[str, Any]]:
    try:
        raw_text = file_path.read_text(encoding="utf-8")
    except Exception:
        return None

    candidates = [raw_text, resolve_git_conflicts(raw_text)]
    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
        except Exception:
            continue
        validated = validate_activity_payload(parsed)
        if validated is None:
            continue
        return {
            "id": file_path.stem,
            "name": file_path.stem.replace("_", " ").replace("-", " ").title(),
            **validated,
        }
    return None


def load_activities() -> List[Dict[str, Any]]:
    loaded: List[Dict[str, Any]] = []
    for file_name in sorted(glob.glob(str(ACTIVITIES_DIR / "*.json"))):
        activity = load_activity_file(Path(file_name))
        if activity:
            loaded.append(activity)
    return loaded


@app.get("/health")
async def health():
    return {"ok": True}


@app.get("/vision/activities")
async def vision_activities():
    return {"activities": load_activities()}


@app.websocket("/ws/vision")
async def ws_vision(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_json()
            request_id = payload.get("requestId")
            image_base64 = sanitize_base64_image(payload.get("image"))
            include_annotated = bool(payload.get("includeAnnotatedImage", False))

            if not image_base64:
                await websocket.send_json(build_empty_response(request_id=request_id, tracking="invalid-image"))
                continue

            started = asyncio.get_running_loop().time()
            response = await asyncio.to_thread(
                process_request,
                {
                    "id": request_id,
                    "image": image_base64,
                    "includeAnnotatedImage": include_annotated,
                },
            )
            elapsed_ms = max(0.0, (asyncio.get_running_loop().time() - started) * 1000.0)

            if not isinstance(response, dict):
                response = build_empty_response(request_id=request_id, tracking="invalid-response")

            response["serverElapsedMs"] = round(elapsed_ms, 2)
            await websocket.send_json(response)
    except WebSocketDisconnect:
        return
    except Exception:
        await websocket.close(code=1011)


if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT, reload=False)
