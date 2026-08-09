"""
Strobe Camera Tracking - Python Backend
YOLO-based detection for person (primary), plus optional sports ball/book.
Sends the selected person position to the realtime server.
"""

import argparse
import json
import os
import time
from urllib.parse import urlparse

import cv2

try:
    import websocket
except ImportError:
    websocket = None

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None


SERVER_URL = "http://localhost:3000"
TRACKING_MODE = "multi"  # "person" or "multi"
YOLO_MODEL = os.path.join(os.path.dirname(__file__), 'models', 'yolov8n.pt')

PERSON_CLASS_ID = 0
SPORTS_BALL_CLASS_ID = 32
BOOK_CLASS_ID = 73


def build_realtime_ws_url(server_url):
    raw_url = str(server_url or "").strip()

    if not raw_url:
        return "ws://localhost:3000/ws/realtime"

    if raw_url.startswith("ws://") or raw_url.startswith("wss://"):
        clean = raw_url.rstrip("/")
        if clean.endswith("/ws/realtime"):
            return clean
        return f"{clean}/ws/realtime"

    parsed = urlparse(raw_url if "://" in raw_url else f"http://{raw_url}")
    scheme = "wss" if parsed.scheme == "https" else "ws"
    host = parsed.netloc or parsed.path
    base_path = (parsed.path or "").rstrip("/")

    if base_path.endswith("/ws/realtime"):
        return f"{scheme}://{host}{base_path}"

    return f"{scheme}://{host.rstrip('/')}/ws/realtime"


class CameraTracker:
    def __init__(self, server_url=SERVER_URL, mode=TRACKING_MODE, model_name=YOLO_MODEL, confidence=0.35):
        self.server_url = server_url
        self.ws_url = build_realtime_ws_url(server_url)
        self.mode = mode
        self.model_name = str(model_name or YOLO_MODEL).strip() or YOLO_MODEL
        self.confidence = max(0.05, min(0.95, float(confidence)))
        self.connected = False
        self.position = (0.5, 0.5)
        self.ws = None
        self.detector = None
        self.class_names = {}

        self.person_only_class_ids = [PERSON_CLASS_ID]
        self.multi_class_ids = [PERSON_CLASS_ID, SPORTS_BALL_CLASS_ID, BOOK_CLASS_ID]
        self.target_class_ids = list(self.multi_class_ids if self.mode == "multi" else self.person_only_class_ids)

        self._load_detector()

    def _load_detector(self):
        if YOLO is None:
            print("❌ Λείπει το ultralytics package. Εγκατάστησε: pip install ultralytics")
            return

        try:
            self.detector = YOLO(self.model_name)
            raw_names = getattr(self.detector, "names", {})

            if isinstance(raw_names, dict):
                self.class_names = {
                    int(key): str(value)
                    for key, value in raw_names.items()
                }
            elif isinstance(raw_names, list):
                self.class_names = {
                    idx: str(value)
                    for idx, value in enumerate(raw_names)
                }
            else:
                self.class_names = {}

            print(
                f"✅ YOLO loaded ({self.model_name}) | conf={self.confidence:.2f} | classes={self._active_class_labels()}"
            )
        except Exception as error:
            self.detector = None
            self.class_names = {}
            print(f"❌ Σφάλμα φόρτωσης YOLO ({self.model_name}): {error}")

    def _active_class_labels(self):
        labels = []
        for class_id in self.target_class_ids:
            labels.append(self._class_name(class_id))
        return labels

    def _class_name(self, class_id):
        if class_id in self.class_names:
            return self.class_names[class_id]

        if class_id == PERSON_CLASS_ID:
            return "person"
        if class_id == SPORTS_BALL_CLASS_ID:
            return "sports ball"
        if class_id == BOOK_CLASS_ID:
            return "book"
        return str(class_id)

    def _class_color(self, class_id):
        if class_id == PERSON_CLASS_ID:
            return (34, 211, 238)  # cyan
        if class_id == SPORTS_BALL_CLASS_ID:
            return (56, 146, 255)  # orange-ish in BGR
        if class_id == BOOK_CLASS_ID:
            return (250, 139, 167)  # violet-ish in BGR
        return (0, 255, 0)

    def set_mode(self, mode):
        next_mode = "multi" if str(mode).strip().lower() == "multi" else "person"
        self.mode = next_mode
        self.target_class_ids = list(self.multi_class_ids if self.mode == "multi" else self.person_only_class_ids)
        print(f"🔄 Mode: {self.mode} | classes={self._active_class_labels()}")

    def connect(self):
        if websocket is None:
            print("❌ Λείπει το websocket-client package. Εγκατάστησε: pip install websocket-client")
            return False

        try:
            self.ws = websocket.create_connection(self.ws_url, timeout=5)
            self.connected = True
            print(f"✅ Συνδέθηκε στον realtime server: {self.ws_url}")
            return True
        except Exception as error:
            print(f"❌ Σφάλμα σύνδεσης: {error}")
            return False

    def disconnect(self):
        if self.connected:
            if self.ws is not None:
                try:
                    self.ws.close()
                except Exception:
                    pass

            self.ws = None
            self.connected = False
            print("🔌 Αποσυνδέθηκε")

    def normalize_position(self, position, frame_shape):
        x, y = position
        height, width = frame_shape[:2]

        normalized_x = max(0.0, min(1.0, x / width))
        normalized_y = max(0.0, min(1.0, y / height))

        return (normalized_x, normalized_y)

    def send_position(self, x, y):
        if self.connected:
            try:
                payload = {
                    "event": "user-position",
                    "data": {
                        "x": x,
                        "y": y,
                        "role": "camera",
                        "color": "#FF6B6B",
                    },
                }

                if self.ws is None:
                    raise RuntimeError("WebSocket closed")

                self.ws.send(json.dumps(payload))
            except Exception as error:
                print(f"❌ Σφάλμα αποστολής: {error}")
                self.connected = False

    def detect_yolo(self, frame):
        if self.detector is None:
            return None, 0

        try:
            results = self.detector.predict(
                source=frame,
                conf=self.confidence,
                classes=self.target_class_ids,
                verbose=False,
            )
        except Exception as error:
            cv2.putText(
                frame,
                f"YOLO error: {error}",
                (10, 120),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 255),
                2,
            )
            return None, 0

        if not results:
            return None, 0

        first = results[0]
        boxes = getattr(first, "boxes", None)
        if boxes is None or len(boxes) == 0:
            return None, 0

        try:
            xyxy = boxes.xyxy.cpu().numpy()
            confs = boxes.conf.cpu().numpy()
            classes = boxes.cls.cpu().numpy()
        except Exception:
            return None, 0

        detections = []
        for idx in range(len(xyxy)):
            left, top, right, bottom = [float(value) for value in xyxy[idx]]
            class_id = int(classes[idx]) if idx < len(classes) else PERSON_CLASS_ID
            confidence = float(confs[idx]) if idx < len(confs) else 0.0

            width = max(0.0, right - left)
            height = max(0.0, bottom - top)
            if width <= 2 or height <= 2:
                continue

            cx = left + width / 2.0
            cy = top + height / 2.0

            detections.append(
                {
                    "left": left,
                    "top": top,
                    "right": right,
                    "bottom": bottom,
                    "cx": cx,
                    "cy": cy,
                    "class_id": class_id,
                    "confidence": confidence,
                }
            )

            color = self._class_color(class_id)
            cv2.rectangle(frame, (int(left), int(top)), (int(right), int(bottom)), color, 2)
            label = self._class_name(class_id)
            cv2.putText(
                frame,
                f"{label} {(confidence * 100):.0f}%",
                (int(left), max(18, int(top) - 6)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                color,
                2,
            )

        if not detections:
            return None, 0

        person_candidates = [item for item in detections if item["class_id"] == PERSON_CLASS_ID]
        if not person_candidates:
            return None, len(detections)

        frame_h, frame_w = frame.shape[:2]
        center_x = frame_w / 2.0
        center_y = frame_h / 2.0

        chosen = min(
            person_candidates,
            key=lambda item: (item["cx"] - center_x) ** 2 + (item["cy"] - center_y) ** 2,
        )

        cv2.circle(frame, (int(chosen["cx"]), int(chosen["cy"])), 10, (0, 0, 255), -1)
        return (int(chosen["cx"]), int(chosen["cy"])), len(detections)

    def run(self):
        cap = cv2.VideoCapture(0)

        if not cap.isOpened():
            print("❌ Δεν ήταν δυνατό το άνοιγμα της κάμερας")
            return

        print(f"📹 Κάμερα ενεργοποιήθηκε - Mode: {self.mode}")
        print("Πατήστε 'q' για έξοδο, 'm' για αλλαγή mode (person/multi)")

        last_send_time = time.time()
        send_interval = 0.05  # 20 FPS

        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Σφάλμα ανάγνωσης frame")
                break

            frame = cv2.flip(frame, 1)
            position, detected_count = self.detect_yolo(frame)

            if position:
                normalized = self.normalize_position(position, frame.shape)
                self.position = normalized

                current_time = time.time()
                if current_time - last_send_time >= send_interval:
                    self.send_position(normalized[0], normalized[1])
                    last_send_time = current_time

                cv2.putText(
                    frame,
                    f"Person: ({normalized[0]:.2f}, {normalized[1]:.2f})",
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255, 255, 255),
                    2,
                )

            status_color = (0, 255, 0) if self.connected else (0, 0, 255)
            cv2.putText(
                frame,
                f"Mode: {self.mode.upper()} | Classes: {', '.join(self._active_class_labels())}",
                (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2,
            )
            cv2.putText(
                frame,
                f"Detections: {detected_count}",
                (10, 88),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2,
            )
            cv2.putText(
                frame,
                "CONNECTED" if self.connected else "DISCONNECTED",
                (10, 116),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                status_color,
                2,
            )

            if self.detector is None:
                cv2.putText(
                    frame,
                    "Install ultralytics: pip install ultralytics",
                    (10, 146),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.52,
                    (0, 0, 255),
                    2,
                )

            cv2.imshow("Strobe Camera Tracking (YOLO)", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            elif key == ord("m"):
                self.set_mode("person" if self.mode == "multi" else "multi")

        cap.release()
        cv2.destroyAllWindows()
        self.disconnect()


def main():
    parser = argparse.ArgumentParser(description="Strobe Camera Tracking (YOLO)")
    parser.add_argument("--server", default="http://localhost:3000", help="Server URL")
    parser.add_argument("--mode", choices=["person", "multi"], default="multi", help="Tracking mode")
    parser.add_argument("--model", default=YOLO_MODEL, help="YOLO model path/name (default: yolov8n.pt)")
    parser.add_argument("--conf", type=float, default=0.35, help="YOLO confidence threshold")

    args = parser.parse_args()

    tracker = CameraTracker(
        server_url=args.server,
        mode=args.mode,
        model_name=args.model,
        confidence=args.conf,
    )

    if tracker.connect():
        try:
            tracker.run()
        except KeyboardInterrupt:
            print("\n⚠️ Διακοπή από χρήστη")
        finally:
            tracker.disconnect()
    else:
        print("❌ Αποτυχία σύνδεσης στον server")


if __name__ == "__main__":
    main()
