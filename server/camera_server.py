"""
Camera Detection Service
Receives base64-encoded frames and returns normalized points.
"""

import base64
import io
from typing import List, Dict

import cv2
import numpy as np
from flask import Flask, request, jsonify

try:
    from deep_sort_realtime.deepsort_tracker import DeepSort
    DEEPSORT_AVAILABLE = True
except Exception:
    DeepSort = None
    DEEPSORT_AVAILABLE = False

app = Flask(__name__)

# Haar cascade for face detection
FACE_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# DeepSORT tracker (if available)
DEEPSORT_TRACKER = None
if DEEPSORT_AVAILABLE:
    DEEPSORT_TRACKER = DeepSort(
        max_age=30,
        n_init=3,
        nms_max_overlap=1.0,
        max_iou_distance=0.7,
        embedder="mobilenet",
        half=True,
        bgr=True,
        embedder_gpu=True,
        polygon=False
    )


class CentroidTracker:
    def __init__(self, max_distance=80, max_age=15):
        self.max_distance = max_distance
        self.max_age = max_age
        self.next_id = 1
        self.tracks = {}

    def _distance(self, a, b):
        return np.linalg.norm(np.array(a) - np.array(b))

    def update(self, detections):
        matched = set()
        updated_tracks = {}

        # Attempt to match detections to existing tracks
        for track_id, track in self.tracks.items():
            best_idx = None
            best_dist = None

            for idx, det in enumerate(detections):
                if idx in matched:
                    continue
                dist = self._distance(track["centroid"], det)
                if best_dist is None or dist < best_dist:
                    best_dist = dist
                    best_idx = idx

            if best_idx is not None and best_dist is not None and best_dist <= self.max_distance:
                matched.add(best_idx)
                updated_tracks[track_id] = {
                    "centroid": detections[best_idx],
                    "age": 0
                }
            else:
                track["age"] += 1
                if track["age"] <= self.max_age:
                    updated_tracks[track_id] = track

        # Create new tracks for unmatched detections
        for idx, det in enumerate(detections):
            if idx in matched:
                continue
            track_id = self.next_id
            self.next_id += 1
            updated_tracks[track_id] = {"centroid": det, "age": 0}

        self.tracks = updated_tracks

        return [
            {"id": track_id, "centroid": data["centroid"]}
            for track_id, data in self.tracks.items()
        ]


TRACKER = CentroidTracker()


def decode_image(base64_str: str):
    try:
        img_bytes = base64.b64decode(base64_str)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        return img
    except Exception:
        return None


def detect_faces(image) -> List[Dict[str, float]]:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = FACE_CASCADE.detectMultiScale(gray, 1.3, 5)

    height, width = gray.shape[:2]

    # If DeepSORT is available, track using bounding boxes
    if DEEPSORT_TRACKER is not None:
        detections = []
        for (x, y, w, h) in faces:
            x1 = float(x)
            y1 = float(y)
            x2 = float(x + w)
            y2 = float(y + h)
            detections.append(([x1, y1, x2, y2], 0.95, "face"))

        tracks = DEEPSORT_TRACKER.update_tracks(detections, frame=image)
        points = []

        for track in tracks:
            if not track.is_confirmed():
                continue
            track_id = track.track_id
            ltrb = track.to_ltrb()
            cx = (ltrb[0] + ltrb[2]) / 2
            cy = (ltrb[1] + ltrb[3]) / 2
            points.append({
                "id": int(track_id),
                "x": float(cx / width),
                "y": float(cy / height)
            })

        return points

    # Fallback to centroid tracker
    detections = []
    for (x, y, w, h) in faces:
        cx = x + w / 2
        cy = y + h / 2
        detections.append((cx, cy))

    tracked = TRACKER.update(detections)
    points = []

    for item in tracked:
        cx, cy = item["centroid"]
        points.append({
            "id": item["id"],
            "x": float(cx / width),
            "y": float(cy / height)
        })

    return points


@app.post("/detect")
def detect():
    payload = request.get_json(silent=True) or {}
    image_b64 = payload.get("image")
    if not image_b64:
        return jsonify({"points": []})

    image = decode_image(image_b64)
    if image is None:
        return jsonify({"points": []})

    points = detect_faces(image)
    return jsonify({"points": points})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
