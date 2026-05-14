"""
Camera YOLO + DeepSORT Worker (stdio)
Receives JSON lines via stdin and emits detection JSON lines via stdout.
"""

import json
import base64
import importlib.util
import os
import sys
import tempfile
from typing import List, Dict, Optional, Tuple

import cv2
import numpy as np

try:
    from deep_sort_realtime.deepsort_tracker import DeepSort
    DEEPSORT_AVAILABLE = True
except Exception:
    DeepSort = None
    DEEPSORT_AVAILABLE = False

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except Exception:
    YOLO = None
    YOLO_AVAILABLE = False


def log(message: str):
    print(str(message), file=sys.stderr, flush=True)

def build_face_cascade():
    """
    Load Haar cascade robustly.

    On some Windows setups with non-ASCII install paths, OpenCV C++ file loading
    can fail. We stage the XML to an ASCII temp path and prefer that copy.
    """
    cascade_filename = "haarcascade_frontalface_default.xml"
    haar_root = str(getattr(cv2.data, "haarcascades", "") or "")
    source_path = os.path.join(haar_root, cascade_filename) if haar_root else ""
    candidates = []

    if source_path and os.path.exists(source_path):
        safe_dir = os.path.join(tempfile.gettempdir(), "strobe-camera")
        safe_path = os.path.join(safe_dir, cascade_filename)

        try:
            os.makedirs(safe_dir, exist_ok=True)
            with open(source_path, "rb") as src, open(safe_path, "wb") as dst:
                dst.write(src.read())
            candidates.append(safe_path)
        except Exception as error:
            log(f"[camera] failed to stage haar cascade in temp path: {error}")

        candidates.append(source_path)

    for candidate in candidates:
        cascade = cv2.CascadeClassifier(candidate)
        if not cascade.empty():
            log(f"[camera] face cascade loaded from: {candidate}")
            return cascade

    log("[camera] WARNING: face cascade could not be loaded; detections disabled.")
    return cv2.CascadeClassifier()


# Haar cascade for face detection
FACE_CASCADE = build_face_cascade()

PERSON_CLASS_ID = 0
SPORTS_BALL_CLASS_ID = 32
BOOK_CLASS_ID = 73
DEFAULT_YOLO_CLASS_IDS = [PERSON_CLASS_ID, SPORTS_BALL_CLASS_ID, BOOK_CLASS_ID]

YOLO_NAME_TO_CLASS_ID = {
    "person": PERSON_CLASS_ID,
    "human": PERSON_CLASS_ID,
    "people": PERSON_CLASS_ID,
    "sports ball": SPORTS_BALL_CLASS_ID,
    "sportsball": SPORTS_BALL_CLASS_ID,
    "sports-ball": SPORTS_BALL_CLASS_ID,
    "ball": SPORTS_BALL_CLASS_ID,
    "book": BOOK_CLASS_ID,
    "books": BOOK_CLASS_ID,
}

YOLO_FALLBACK_CLASS_NAMES = {
    PERSON_CLASS_ID: "person",
    SPORTS_BALL_CLASS_ID: "sports ball",
    BOOK_CLASS_ID: "book",
}

def _env_choice(name: str, default: str = "auto") -> str:
    raw = str(os.getenv(name, "")).strip().lower()
    if not raw:
        return default

    if raw in {"1", "true", "yes", "on", "gpu"}:
        return "gpu"

    if raw in {"0", "false", "no", "off", "cpu"}:
        return "cpu"

    if raw in {"auto", "default"}:
        return "auto"

    return default


def _env_float(name: str, default: float, min_value: Optional[float] = None, max_value: Optional[float] = None) -> float:
    raw = str(os.getenv(name, "")).strip()
    if not raw:
        return float(default)

    try:
        parsed = float(raw)
    except Exception:
        return float(default)

    if min_value is not None:
        parsed = max(float(min_value), parsed)
    if max_value is not None:
        parsed = min(float(max_value), parsed)

    return float(parsed)


def _parse_yolo_target_classes(raw: str) -> List[int]:
    text = str(raw or "").strip()
    if not text:
        return list(DEFAULT_YOLO_CLASS_IDS)

    result: List[int] = []

    for token in text.split(","):
        item = str(token or "").strip().lower()
        if not item:
            continue

        class_id = None
        if item.isdigit():
            class_id = int(item)
        else:
            class_id = YOLO_NAME_TO_CLASS_ID.get(item)

        if class_id is None:
            continue

        if class_id not in result:
            result.append(class_id)

    if PERSON_CLASS_ID not in result:
        result.insert(0, PERSON_CLASS_ID)

    return result or list(DEFAULT_YOLO_CLASS_IDS)


YOLO_MODEL_PATH = str(os.getenv("CAMERA_YOLO_MODEL", "yolov8n.pt") or "").strip() or "yolov8n.pt"
YOLO_CONFIDENCE = _env_float("CAMERA_YOLO_CONF", 0.35, 0.05, 0.95)
YOLO_MIN_BOX_AREA_PX = _env_float("CAMERA_YOLO_MIN_AREA", 320.0, 0.0)
YOLO_TARGET_CLASS_IDS = _parse_yolo_target_classes(os.getenv("CAMERA_YOLO_CLASSES", ""))


def _module_available(name: str) -> bool:
    try:
        return importlib.util.find_spec(name) is not None
    except Exception:
        return False


def _torch_cuda_available() -> bool:
    try:
        import torch
        return bool(torch.cuda.is_available())
    except Exception:
        return False


def _normalize_yolo_class_names(raw_names) -> Dict[int, str]:
    if isinstance(raw_names, dict):
        normalized = {}
        for key, value in raw_names.items():
            try:
                class_id = int(key)
            except Exception:
                continue
            name = str(value or "").strip()
            if name:
                normalized[class_id] = name
        return normalized

    if isinstance(raw_names, list):
        normalized = {}
        for idx, value in enumerate(raw_names):
            name = str(value or "").strip()
            if name:
                normalized[idx] = name
        return normalized

    return {}


def build_yolo_detector() -> Tuple[Optional[object], str, Dict[int, str]]:
    if not YOLO_AVAILABLE:
        log("[camera] ultralytics not found; using Haar face fallback detector")
        return None, "haar-face", {}

    try:
        model = YOLO(YOLO_MODEL_PATH)
        class_names = _normalize_yolo_class_names(getattr(model, "names", {}))
        selected_labels = [
            class_names.get(class_id, YOLO_FALLBACK_CLASS_NAMES.get(class_id, str(class_id)))
            for class_id in YOLO_TARGET_CLASS_IDS
        ]
        log(
            "[camera] YOLO detector loaded "
            f"(model={YOLO_MODEL_PATH}, conf={YOLO_CONFIDENCE:.2f}, classes={selected_labels})"
        )
        return model, "yolo", class_names
    except Exception as error:
        log(f"[camera] YOLO init failed ({YOLO_MODEL_PATH}): {error}")
        return None, "haar-face", {}


def build_deepsort_tracker():
    """Try to initialize Deep SORT with safe defaults and CPU fallback."""
    if not DEEPSORT_AVAILABLE:
        return None, "centroid-fallback"

    gpu_policy = _env_choice("DEEPSORT_USE_GPU", default="auto")
    attempts = [False]
    tried = set()

    torch_available = _module_available("torch") and _module_available("torchvision")

    # Try appearance-based mode only when torch/torchvision are present.
    # Otherwise go directly to IoU mode to avoid noisy startup warnings/errors.
    embedder_profiles = []

    if torch_available:
        cuda_available = _torch_cuda_available()

        if gpu_policy == "gpu":
            if cuda_available:
                attempts = [True, False]
                log("[camera] DEEPSORT_USE_GPU=gpu and CUDA is available; trying GPU first")
            else:
                attempts = [False]
                log("[camera] DEEPSORT_USE_GPU=gpu but CUDA is not available; falling back to CPU")
        elif gpu_policy == "cpu":
            attempts = [False]
            log("[camera] DEEPSORT_USE_GPU=cpu; forcing CPU embedder")
        else:
            attempts = [True, False] if cuda_available else [False]
            if cuda_available:
                log("[camera] CUDA is available; trying GPU embedder first")
            else:
                log("[camera] CUDA is not available; using CPU embedder")

        embedder_profiles.append(
            {
                "embedder": "mobilenet",
                "half": False,
                "label": "deepsort-embedder",
            }
        )
    else:
        log("[camera] torch/torchvision not found; using IoU-only Deep SORT profile")

    embedder_profiles.append(
        {
            "embedder": None,
            "half": False,
            "label": "deepsort-iou",
        }
    )

    for profile in embedder_profiles:
        profile_attempts = attempts if profile["embedder"] else [False]

        for use_gpu in profile_attempts:
            gpu_key = (profile["embedder"], use_gpu)
            if gpu_key in tried:
                continue
            tried.add(gpu_key)

            try:
                kwargs = {
                    "max_age": 30,
                    "n_init": 2,
                    "nms_max_overlap": 1.0,
                    "max_iou_distance": 0.7,
                    "embedder": profile["embedder"],
                    "half": profile["half"],
                    "bgr": True,
                    "polygon": False,
                }

                if profile["embedder"]:
                    kwargs["embedder_gpu"] = use_gpu

                tracker = DeepSort(**kwargs)

                if profile["embedder"]:
                    backend = "deepsort-gpu" if use_gpu else "deepsort-cpu"
                else:
                    backend = profile["label"]

                return tracker, backend
            except Exception as error:
                log(
                    f"[camera] Deep SORT init failed "
                    f"(embedder={profile['embedder']}, gpu={use_gpu}): {error}"
                )

    return None, "centroid-fallback"


YOLO_DETECTOR, DETECTION_BACKEND, YOLO_CLASS_NAMES = build_yolo_detector()

# DeepSORT tracker (if available)
DEEPSORT_TRACKER, TRACKING_BACKEND = build_deepsort_tracker()
ACTIVE_TRACKING_BACKEND = f"{DETECTION_BACKEND}-{TRACKING_BACKEND}"
log(f"[camera] detection backend: {DETECTION_BACKEND}")
log(f"[camera] tracking backend: {TRACKING_BACKEND}")
log(f"[camera] active pipeline: {ACTIVE_TRACKING_BACKEND}")


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


def clamp01(value: float) -> float:
    return float(max(0.0, min(1.0, value)))


def normalize_box(x: float, y: float, w: float, h: float, frame_width: int, frame_height: int):
    if frame_width <= 0 or frame_height <= 0:
        return None

    norm_x = clamp01(float(x) / float(frame_width))
    norm_y = clamp01(float(y) / float(frame_height))
    norm_w = max(0.0, float(w) / float(frame_width))
    norm_h = max(0.0, float(h) / float(frame_height))

    norm_w = min(norm_w, max(0.0, 1.0 - norm_x))
    norm_h = min(norm_h, max(0.0, 1.0 - norm_y))

    if norm_w <= 0.0001 or norm_h <= 0.0001:
        return None

    return {
        "x": float(norm_x),
        "y": float(norm_y),
        "w": float(norm_w),
        "h": float(norm_h)
    }


def class_name_for_id(class_id: int) -> str:
    if class_id in YOLO_CLASS_NAMES:
        return str(YOLO_CLASS_NAMES[class_id])
    return YOLO_FALLBACK_CLASS_NAMES.get(class_id, str(class_id))


def extract_yolo_detections(image) -> List[Dict[str, float]]:
    if YOLO_DETECTOR is None:
        return []

    detections: List[Dict[str, float]] = []

    try:
        results = YOLO_DETECTOR.predict(
            source=image,
            conf=YOLO_CONFIDENCE,
            classes=YOLO_TARGET_CLASS_IDS,
            verbose=False,
        )
    except Exception as error:
        log(f"[camera] YOLO predict failed: {error}")
        return []

    if not results:
        return []

    first = results[0]
    boxes = getattr(first, "boxes", None)
    if boxes is None or len(boxes) == 0:
        return []

    try:
        xyxy = boxes.xyxy.cpu().numpy()
        confs = boxes.conf.cpu().numpy()
        classes = boxes.cls.cpu().numpy()
    except Exception:
        return []

    for idx in range(len(xyxy)):
        left, top, right, bottom = [float(value) for value in xyxy[idx]]
        width = max(0.0, right - left)
        height = max(0.0, bottom - top)
        area = width * height
        if area < YOLO_MIN_BOX_AREA_PX:
            continue

        confidence = float(confs[idx]) if idx < len(confs) else 0.0
        class_id = int(classes[idx]) if idx < len(classes) else PERSON_CLASS_ID
        label = class_name_for_id(class_id)

        detections.append(
            {
                "left": left,
                "top": top,
                "width": width,
                "height": height,
                "confidence": max(0.0, min(1.0, confidence)),
                "class_id": class_id,
                "label": label,
            }
        )

    return detections


def extract_haar_face_detections(image) -> List[Dict[str, float]]:
    if FACE_CASCADE.empty():
        return []

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = FACE_CASCADE.detectMultiScale(gray, 1.3, 5)
    detections: List[Dict[str, float]] = []

    for (x, y, w, h) in faces:
        detections.append(
            {
                "left": float(x),
                "top": float(y),
                "width": float(w),
                "height": float(h),
                "confidence": 0.95,
                "class_id": PERSON_CLASS_ID,
                "label": "person",
            }
        )

    return detections


def compute_iou(left: float, top: float, right: float, bottom: float, detection: Dict[str, float]) -> float:
    det_left = float(detection["left"])
    det_top = float(detection["top"])
    det_right = det_left + float(detection["width"])
    det_bottom = det_top + float(detection["height"])

    inter_left = max(left, det_left)
    inter_top = max(top, det_top)
    inter_right = min(right, det_right)
    inter_bottom = min(bottom, det_bottom)

    inter_w = max(0.0, inter_right - inter_left)
    inter_h = max(0.0, inter_bottom - inter_top)
    inter_area = inter_w * inter_h
    if inter_area <= 0:
        return 0.0

    area_a = max(0.0, right - left) * max(0.0, bottom - top)
    area_b = max(0.0, det_right - det_left) * max(0.0, det_bottom - det_top)
    denom = area_a + area_b - inter_area
    if denom <= 0:
        return 0.0

    return float(inter_area / denom)


def match_detection_for_track(left: float, top: float, right: float, bottom: float, detections: List[Dict[str, float]]):
    best = None
    best_iou = 0.0

    for detection in detections:
        iou = compute_iou(left, top, right, bottom, detection)
        if iou > best_iou:
            best_iou = iou
            best = detection

    if best_iou < 0.02:
        return None

    return best


def build_box_payload(track_id: int, left: float, top: float, width: float, height: float, frame_width: int, frame_height: int, meta: Dict[str, float]):
    normalized = normalize_box(left, top, width, height, frame_width, frame_height)
    if normalized is None:
        return None

    return {
        "id": int(track_id),
        **normalized,
        "label": str(meta.get("label") or "object"),
        "classId": int(meta.get("class_id", PERSON_CLASS_ID)),
        "confidence": float(meta.get("confidence", 0.0)),
    }


def denormalize_box(box: Dict[str, float], frame_width: int, frame_height: int):
    if frame_width <= 0 or frame_height <= 0:
        return None

    try:
        x = int(float(box.get("x", 0.0)) * frame_width)
        y = int(float(box.get("y", 0.0)) * frame_height)
        w = int(float(box.get("w", 0.0)) * frame_width)
        h = int(float(box.get("h", 0.0)) * frame_height)
    except Exception:
        return None

    if w <= 0 or h <= 0:
        return None

    x = max(0, min(frame_width - 1, x))
    y = max(0, min(frame_height - 1, y))
    w = max(1, min(frame_width - x, w))
    h = max(1, min(frame_height - y, h))
    return x, y, w, h


def encode_image_to_base64(image, quality: int = 70) -> Optional[str]:
    try:
        bounded_quality = max(20, min(95, int(quality)))
        ok, encoded = cv2.imencode(
            ".jpg",
            image,
            [int(cv2.IMWRITE_JPEG_QUALITY), bounded_quality],
        )
        if not ok:
            return None

        return base64.b64encode(encoded.tobytes()).decode("ascii")
    except Exception:
        return None


def build_annotated_image(image, boxes: List[Dict[str, float]]) -> Optional[str]:
    if image is None:
        return None

    frame_h, frame_w = image.shape[:2]
    canvas = image.copy()

    for box in boxes:
        denorm = denormalize_box(box, frame_w, frame_h)
        if denorm is None:
            continue

        x, y, w, h = denorm
        label = str(box.get("label") or "object")
        track_id = int(box.get("id", 0) or 0)
        confidence = float(box.get("confidence", 0.0) or 0.0)
        text = f"#{track_id} {label} {confidence:.2f}"

        cv2.rectangle(canvas, (x, y), (x + w, y + h), (0, 220, 30), 2)
        cv2.rectangle(canvas, (x, max(0, y - 22)), (x + max(90, len(text) * 7), y), (0, 220, 30), -1)
        cv2.putText(canvas, text, (x + 4, max(14, y - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA)

    return encode_image_to_base64(canvas, quality=72)


def track_with_deepsort(image, detections: List[Dict[str, float]], frame_width: int, frame_height: int):
    deep_sort_inputs = []
    for detection in detections:
        deep_sort_inputs.append(
            (
                [
                    float(detection["left"]),
                    float(detection["top"]),
                    float(detection["width"]),
                    float(detection["height"]),
                ],
                float(detection["confidence"]),
                str(detection["label"]),
            )
        )

    try:
        if TRACKING_BACKEND == "deepsort-iou":
            tracks = DEEPSORT_TRACKER.update_tracks(deep_sort_inputs)
        else:
            tracks = DEEPSORT_TRACKER.update_tracks(deep_sort_inputs, frame=image)
    except Exception as error:
        log(f"[camera] Deep SORT update failed: {error}")
        tracks = []

    points = []
    boxes = []

    for track in tracks:
        if not track.is_confirmed():
            continue

        if int(getattr(track, "time_since_update", 0) or 0) > 0:
            continue

        ltrb = track.to_ltrb()
        left = float(ltrb[0])
        top = float(ltrb[1])
        right = float(ltrb[2])
        bottom = float(ltrb[3])
        width = max(0.0, right - left)
        height = max(0.0, bottom - top)

        if width <= 0.0 or height <= 0.0:
            continue

        meta = match_detection_for_track(left, top, right, bottom, detections)
        if meta is None:
            continue

        track_id = int(track.track_id)
        box_payload = build_box_payload(track_id, left, top, width, height, frame_width, frame_height, meta)
        if box_payload is None:
            continue

        boxes.append(box_payload)

        if int(meta.get("class_id", -1)) == PERSON_CLASS_ID:
            cx = left + width / 2.0
            cy = top + height / 2.0
            points.append(
                {
                    "id": track_id,
                    "x": float(cx / frame_width),
                    "y": float(cy / frame_height),
                }
            )

    points.sort(key=lambda item: item["id"])
    boxes.sort(key=lambda item: item["id"])
    return {
        "points": points,
        "boxes": boxes,
    }


def track_with_centroid(detections: List[Dict[str, float]], frame_width: int, frame_height: int):
    centroids = []
    for detection in detections:
        cx = float(detection["left"]) + float(detection["width"]) / 2.0
        cy = float(detection["top"]) + float(detection["height"]) / 2.0
        centroids.append((cx, cy))

    tracked = TRACKER.update(centroids)
    points = []
    boxes = []
    matched_indexes = set()

    for item in tracked:
        cx, cy = item["centroid"]
        track_id = int(item["id"])

        best_idx = None
        best_distance = None

        for idx, detection in enumerate(detections):
            if idx in matched_indexes:
                continue

            det_cx = float(detection["left"]) + float(detection["width"]) / 2.0
            det_cy = float(detection["top"]) + float(detection["height"]) / 2.0
            distance = float((det_cx - cx) ** 2 + (det_cy - cy) ** 2)

            if best_distance is None or distance < best_distance:
                best_distance = distance
                best_idx = idx

        if best_idx is None:
            continue

        matched_indexes.add(best_idx)
        meta = detections[best_idx]
        box_payload = build_box_payload(
            track_id,
            float(meta["left"]),
            float(meta["top"]),
            float(meta["width"]),
            float(meta["height"]),
            frame_width,
            frame_height,
            meta,
        )
        if box_payload is None:
            continue

        boxes.append(box_payload)

        if int(meta.get("class_id", -1)) == PERSON_CLASS_ID:
            points.append(
                {
                    "id": track_id,
                    "x": float(cx / frame_width),
                    "y": float(cy / frame_height),
                }
            )

    points.sort(key=lambda item: item["id"])
    boxes.sort(key=lambda item: item["id"])
    return {
        "points": points,
        "boxes": boxes,
    }


def detect_targets(image) -> Dict[str, List[Dict[str, float]]]:
    frame_height, frame_width = image.shape[:2]
    if frame_width <= 0 or frame_height <= 0:
        return {
            "points": [],
            "boxes": [],
        }

    if YOLO_DETECTOR is not None:
        detections = extract_yolo_detections(image)
    else:
        detections = extract_haar_face_detections(image)

    if DEEPSORT_TRACKER is not None:
        return track_with_deepsort(image, detections, frame_width, frame_height)

    return track_with_centroid(detections, frame_width, frame_height)

def build_empty_response(request_id=None, tracking=None):
    return {
        "id": request_id,
        "points": [],
        "boxes": [],
        "tracking": tracking or ACTIVE_TRACKING_BACKEND
    }


def process_request(payload):
    if not isinstance(payload, dict):
        return build_empty_response(tracking="invalid-payload")

    request_id = payload.get("id")
    image_b64 = payload.get("image")
    include_annotated_image = bool(payload.get("includeAnnotatedImage"))

    if not image_b64:
        return build_empty_response(request_id=request_id)

    image = decode_image(image_b64)
    if image is None:
        return build_empty_response(request_id=request_id, tracking="decode-error")

    result = detect_targets(image)
    response = {
        "id": request_id,
        "points": result.get("points", []),
        "boxes": result.get("boxes", []),
        "tracking": ACTIVE_TRACKING_BACKEND
    }

    if include_annotated_image:
        annotated = build_annotated_image(image, response["boxes"])
        if annotated:
            response["annotatedImage"] = annotated

    return response


def run_stdio_loop():
    log("[camera] stdio worker ready")

    for raw_line in sys.stdin:
        line = str(raw_line or "").strip()
        if not line:
            continue

        try:
            payload = json.loads(line)
        except Exception:
            response = build_empty_response(tracking="invalid-json")
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()
            continue

        response = process_request(payload)
        sys.stdout.write(json.dumps(response) + "\n")
        sys.stdout.flush()

    log("[camera] stdio worker stopped")


if __name__ == "__main__":
    run_stdio_loop()
