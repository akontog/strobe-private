"""Geometry independent of MediaPipe, including confidence and aspect-ratio checks."""

import math
from collections.abc import Sequence

VISIBILITY_THRESHOLD = 0.6
METRIC_KEYS = (
    "arm_spread", "left_elbow", "right_elbow", "left_shoulder", "right_shoulder",
    "left_knee", "right_knee", "torso_lean",
)


def vector_angle(a: Sequence[float], b: Sequence[float]) -> float | None:
    """Unsigned angle in degrees; coincident points cannot define an angle."""
    if len(a) != len(b) or not a or not all(math.isfinite(v) for v in (*a, *b)):
        return None
    norm = math.sqrt(sum(v * v for v in a)) * math.sqrt(sum(v * v for v in b))
    if norm < 1e-10:
        return None
    cosine = max(-1.0, min(1.0, sum(x * y for x, y in zip(a, b)) / norm))
    return math.degrees(math.acos(cosine))


def subtract(a, b):
    return tuple(x - y for x, y in zip(a, b))


def empty_metrics():
    return {key: None for key in METRIC_KEYS}


def calculate_metrics(landmarks: list[dict], width: int, height: int, *, world=False):
    metrics = empty_metrics()
    if len(landmarks) != 33 or width <= 0 or height <= 0:
        return metrics

    def visible(*indices):
        return all(
            landmarks[i].get("visibility", 0) >= VISIBILITY_THRESHOLD
            and landmarks[i].get("presence", 0) >= VISIBILITY_THRESHOLD
            for i in indices
        )

    def point(i):
        p = landmarks[i]
        # x and y have different normalized scales. Convert to pixels for 2D geometry.
        return (p["x"], p["y"], p["z"]) if world else (p["x"] * width, p["y"] * height)

    def joint(a, middle, b):
        if not visible(a, middle, b):
            return None
        return vector_angle(subtract(point(a), point(middle)), subtract(point(b), point(middle)))

    if visible(11, 12, 13, 14):
        metrics["arm_spread"] = vector_angle(
            subtract(point(13), point(11)), subtract(point(14), point(12))
        )
    for side, shoulder, elbow, wrist, hip, knee, ankle in (
        ("left", 11, 13, 15, 23, 25, 27),
        ("right", 12, 14, 16, 24, 26, 28),
    ):
        metrics[f"{side}_elbow"] = joint(shoulder, elbow, wrist)
        metrics[f"{side}_shoulder"] = joint(hip, shoulder, elbow)
        metrics[f"{side}_knee"] = joint(hip, knee, ankle)
    if visible(11, 12, 23, 24):
        shoulders = tuple((a + b) / 2 for a, b in zip(point(11), point(12)))
        hips = tuple((a + b) / 2 for a, b in zip(point(23), point(24)))
        up = (0, -1, 0) if world else (0, -1)
        metrics["torso_lean"] = vector_angle(subtract(shoulders, hips), up)
    return {key: round(value, 1) if value is not None else None for key, value in metrics.items()}


class MetricSmoother:
    """EMA for readability; invalid measurements clear their history immediately."""

    def __init__(self, alpha=0.4):
        self.alpha = alpha
        self.previous = {}

    def update(self, metrics):
        output = {}
        for key, value in metrics.items():
            if value is None:
                self.previous.pop(key, None)
                output[key] = None
            else:
                prior = self.previous.get(key, value)
                smoothed = self.alpha * value + (1 - self.alpha) * prior
                self.previous[key] = smoothed
                output[key] = round(smoothed, 1)
        return output
