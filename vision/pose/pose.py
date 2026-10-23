"""A separate video-mode tracker and smoothing history for each camera session."""

from io import BytesIO
from pathlib import Path
import time

import mediapipe as mp
import numpy as np
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from PIL import Image, UnidentifiedImageError

from .angles import MetricSmoother, calculate_metrics, empty_metrics

MAX_FRAME_BYTES = 2_000_000
MAX_FRAME_PIXELS = 1920 * 1080


def decode_frame(data: bytes):
    if not data or len(data) > MAX_FRAME_BYTES:
        raise ValueError("Το καρέ είναι κενό ή πολύ μεγάλο.")
    try:
        with Image.open(BytesIO(data)) as image:
            width, height = image.size
            if image.format != "JPEG" or width * height > MAX_FRAME_PIXELS:
                raise ValueError("Απαιτείται JPEG έως 1920×1080 pixels συνολικά.")
            return np.asarray(image.convert("RGB")).copy()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise ValueError("Το καρέ δεν είναι έγκυρη εικόνα JPEG.") from exc


def serialize_landmark(landmark, confidence=None):
    source = confidence if confidence is not None else landmark
    return {
        "x": round(float(landmark.x), 6),
        "y": round(float(landmark.y), 6),
        "z": round(float(landmark.z), 6),
        "visibility": float(source.visibility or 0),
        "presence": float(source.presence or 0),
    }


class PoseTracker:
    def __init__(self, model_path: Path):
        options = vision.PoseLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_path=str(model_path)),
            running_mode=vision.RunningMode.VIDEO,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
            output_segmentation_masks=False,
        )
        self.landmarker = vision.PoseLandmarker.create_from_options(options)
        self.timestamp = -1
        self.smoothers = {"2d": MetricSmoother(), "3d": MetricSmoother()}

    def process(self, data: bytes):
        started = time.perf_counter()
        frame = decode_frame(data)
        height, width = frame.shape[:2]
        # Backend clock is monotonic; reconnects get a fresh tracker and timestamp history.
        self.timestamp = max(self.timestamp + 1, time.monotonic_ns() // 1_000_000)
        result = self.landmarker.detect_for_video(
            mp.Image(image_format=mp.ImageFormat.SRGB, data=frame), self.timestamp
        )
        landmarks = []
        world_landmarks = []
        metrics = {"2d": empty_metrics(), "3d": empty_metrics()}
        if result.pose_landmarks:
            landmarks = [serialize_landmark(p) for p in result.pose_landmarks[0]]
            metrics["2d"] = calculate_metrics(landmarks, width, height)
            if result.pose_world_landmarks:
                world_landmarks = [
                    serialize_landmark(p, confidence)
                    for p, confidence in zip(result.pose_world_landmarks[0], result.pose_landmarks[0])
                ]
                metrics["3d"] = calculate_metrics(world_landmarks, width, height, world=True)
        return {
            "type": "pose",
            "detected": bool(landmarks),
            "landmarks": landmarks,
            "world_landmarks": world_landmarks,
            "metrics": {mode: self.smoothers[mode].update(values) for mode, values in metrics.items()},
            "width": width,
            "height": height,
            "inference_ms": round((time.perf_counter() - started) * 1000, 1),
        }

    def close(self):
        self.landmarker.close()
