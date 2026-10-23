"""Download the official, versioned MediaPipe model once, then work offline."""

from pathlib import Path
from urllib.request import urlopen
import logging
import os
import shutil
import tempfile
import zipfile

MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
    "pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
)
MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "pose_landmarker_lite.task"


def ensure_model(path: Path = MODEL_PATH) -> Path:
    if not path.is_file():
        path.parent.mkdir(parents=True, exist_ok=True)
        logging.getLogger(__name__).info("Downloading MediaPipe Pose Lite model (first launch only).")
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(dir=path.parent, suffix=".part", delete=False) as target:
                temporary = Path(target.name)
                with urlopen(MODEL_URL, timeout=60) as response:
                    shutil.copyfileobj(response, target)
            if not zipfile.is_zipfile(temporary):
                raise ValueError("Downloaded model is not a valid MediaPipe task bundle.")
            temporary.replace(path)
        except Exception as exc:
            raise RuntimeError(
                f"Could not prepare the pose model. Check your internet connection or download "
                f"{MODEL_URL} manually to {path}."
            ) from exc
        finally:
            if temporary is not None:
                temporary.unlink(missing_ok=True)

    # MediaPipe's native Windows file reader cannot open model paths containing
    # non-ASCII characters, so stage the model under an ASCII-only temp path.
    staged_path = Path(tempfile.gettempdir()) / "strobe-pose" / path.name
    if not str(staged_path).isascii():
        staged_path = Path(os.environ.get("SystemDrive", "C:\\")) / "strobe-pose" / path.name
    if not str(staged_path).isascii():
        raise RuntimeError("MediaPipe requires an ASCII-only path for the Pose model.")

    if (
        not staged_path.is_file()
        or staged_path.stat().st_size != path.stat().st_size
        or staged_path.stat().st_mtime_ns != path.stat().st_mtime_ns
    ):
        staged_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, staged_path)

    return staged_path
