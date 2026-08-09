// 1. Εισαγωγή βιβλιοθηκών για εκτέλεση Python script
// path + fs (Πρόσβαση στο σύστημα αρχείων) → Βρίσκουν το αρχείο
// vision/camera_server.py και επιβεβαιώνουν ότι υπάρχει.
const fs = require('fs');
const path = require('path');
// επιτρέπεται να εκτελεστεί το Python script σαν ξεχωριστή διεργασία
const { spawn } = require('child_process');
// ανάγνωση γραμμών από το stdout του python script
const readline = require('readline');

// 2. Ρυθμίσεις
// Global camera toggle: 
// false για να απενεργοποιηθεί πλήρως η λειτουργία της κάμερας, 
// true για να ενεργοποιηθεί
const CAMERA_FEATURES_ENABLED = false;
const parsedCameraWorkerTimeoutMs = Number.parseInt(process.env.CAMERA_WORKER_TIMEOUT_MS || '1200', 10);
const CAMERA_WORKER_TIMEOUT_MS = Number.isInteger(parsedCameraWorkerTimeoutMs)
  ? Math.max(150, Math.min(parsedCameraWorkerTimeoutMs, 10000))
  : 1200;
const parsedCameraWorkerMaxPending = Number.parseInt(process.env.CAMERA_WORKER_MAX_PENDING || '24', 10);
const CAMERA_WORKER_MAX_PENDING = Number.isInteger(parsedCameraWorkerMaxPending)
  ? Math.max(1, Math.min(parsedCameraWorkerMaxPending, 120))
  : 24;
const CAMERA_WORKER_RESTART_DELAY_MS = 1200;
const CAMERA_WORKER_ENABLED = CAMERA_FEATURES_ENABLED
  && String(process.env.CAMERA_WORKER_ENABLED || '1').trim() !== '0';
const CAMERA_WORKER_SCRIPT = process.env.CAMERA_WORKER_SCRIPT || path.join(__dirname, '..', '..', 'vision', 'camera_server.py');

// 3. Συναρτήσεις
function resolveCameraWorkerPython() {
  const explicit = String(process.env.CAMERA_WORKER_PYTHON || '').trim();
  if (explicit) {
    return explicit;
  }

  const workspaceVenv = process.platform === 'win32'
    ? path.join(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe')
    : path.join(__dirname, '..', '..', '.venv', 'bin', 'python');

  if (fs.existsSync(workspaceVenv)) {
    return workspaceVenv;
  }

  return 'python';
}

const CAMERA_WORKER_PYTHON = resolveCameraWorkerPython();

function emptyCameraDetection(tracking = 'worker-offline') {
  return {
    points: [],
    boxes: [],
    tracking,
    annotatedImage: null
  };
}

function normalizeCameraWorkerResponse(message) {
  const annotatedImage = message && typeof message.annotatedImage === 'string'
    ? message.annotatedImage
    : null;

  return {
    points: Array.isArray(message && message.points) ? message.points : [],
    boxes: Array.isArray(message && message.boxes) ? message.boxes : [],
    tracking: message && typeof message.tracking === 'string' ? message.tracking : 'unknown',
    annotatedImage
  };
}

let cameraWorkerProcess = null;
let cameraWorkerOutput = null;
let cameraWorkerSeq = 0;
let cameraWorkerRestartTimer = null;
let cameraWorkerShuttingDown = false;
const cameraPendingRequests = new Map();

function clearCameraWorkerRestartTimer() {
  if (!cameraWorkerRestartTimer) {
    return;
  }

  clearTimeout(cameraWorkerRestartTimer);
  cameraWorkerRestartTimer = null;
}

function resolveCameraRequest(requestId, message) {
  const pending = cameraPendingRequests.get(requestId);
  if (!pending) {
    return;
  }

  cameraPendingRequests.delete(requestId);
  clearTimeout(pending.timer);
  pending.resolve(normalizeCameraWorkerResponse(message));
}

function rejectCameraRequest(requestId, tracking) {
  const pending = cameraPendingRequests.get(requestId);
  if (!pending) {
    return;
  }

  cameraPendingRequests.delete(requestId);
  clearTimeout(pending.timer);
  pending.resolve(emptyCameraDetection(tracking));
}

function rejectAllCameraRequests(tracking) {
  const ids = [...cameraPendingRequests.keys()];
  ids.forEach((requestId) => {
    rejectCameraRequest(requestId, tracking);
  });
}

function scheduleCameraWorkerRestart() {
  if (!CAMERA_WORKER_ENABLED || cameraWorkerShuttingDown || cameraWorkerRestartTimer) {
    return;
  }

  cameraWorkerRestartTimer = setTimeout(() => {
    cameraWorkerRestartTimer = null;
    startCameraWorker();
  }, CAMERA_WORKER_RESTART_DELAY_MS);
}

function attachCameraWorkerOutput(worker) {
  cameraWorkerOutput = readline.createInterface({ input: worker.stdout });

  cameraWorkerOutput.on('line', (line) => {
    const safeLine = String(line || '').trim();
    if (!safeLine) {
      return;
    }

    let message;
    try {
      message = JSON.parse(safeLine);
    } catch {
      return;
    }

    const parsedId = Number.parseInt(message && message.id, 10);
    if (!Number.isInteger(parsedId)) {
      return;
    }

    resolveCameraRequest(parsedId, message);
  });
}

function startCameraWorker() {
  if (!CAMERA_WORKER_ENABLED || cameraWorkerShuttingDown) {
    return false;
  }

  if (cameraWorkerProcess && !cameraWorkerProcess.killed && cameraWorkerProcess.exitCode === null) {
    return true;
  }

  clearCameraWorkerRestartTimer();

  try {
    const worker = spawn(CAMERA_WORKER_PYTHON, [CAMERA_WORKER_SCRIPT], {
      cwd: path.dirname(CAMERA_WORKER_SCRIPT),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    cameraWorkerProcess = worker;
    attachCameraWorkerOutput(worker);

    worker.stderr.on('data', (chunk) => {
      const text = String(chunk || '');
      text
        .split(/\r?\n/g)
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => {
          console.log(`[camera-worker] ${line}`);
        });
    });

    worker.on('error', (error) => {
      console.error('[camera-worker] failed to start:', error && error.message ? error.message : error);
      rejectAllCameraRequests('worker-start-error');
      scheduleCameraWorkerRestart();
    });

    worker.on('close', (code, signal) => {
      if (cameraWorkerOutput) {
        cameraWorkerOutput.close();
      }

      cameraWorkerProcess = null;
      cameraWorkerOutput = null;
      rejectAllCameraRequests('worker-closed');

      if (!cameraWorkerShuttingDown) {
        console.warn(`[camera-worker] exited (code=${code}, signal=${signal || 'none'})`);
        scheduleCameraWorkerRestart();
      }
    });

    return true;
  } catch (error) {
    console.error('[camera-worker] spawn error:', error && error.message ? error.message : error);
    rejectAllCameraRequests('worker-spawn-error');
    scheduleCameraWorkerRestart();
    return false;
  }
}
// Τερματισμός του camera worker
function stopCameraWorker() {
  cameraWorkerShuttingDown = true;
  clearCameraWorkerRestartTimer();
  rejectAllCameraRequests('worker-stopped');

  if (cameraWorkerOutput) {
    cameraWorkerOutput.close();
    cameraWorkerOutput = null;
  }

  if (cameraWorkerProcess && !cameraWorkerProcess.killed && cameraWorkerProcess.exitCode === null) {
    cameraWorkerProcess.kill();
  }
}

function requestCameraDetection(imageBase64, options = {}) {
  if (!CAMERA_WORKER_ENABLED) {
    return Promise.resolve(emptyCameraDetection('worker-disabled'));
  }

  if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
    return Promise.resolve(emptyCameraDetection('invalid-image'));
  }

  if (cameraPendingRequests.size >= CAMERA_WORKER_MAX_PENDING) {
    return Promise.resolve(emptyCameraDetection('worker-busy'));
  }

  const started = startCameraWorker();
  if (!started || !cameraWorkerProcess || !cameraWorkerProcess.stdin) {
    return Promise.resolve(emptyCameraDetection('worker-offline'));
  }

  const requestId = ++cameraWorkerSeq;
  const includeAnnotatedImage = Boolean(options && options.includeAnnotatedImage);
  const payload = JSON.stringify({
    id: requestId,
    image: imageBase64,
    includeAnnotatedImage
  }) + '\n';

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      rejectCameraRequest(requestId, 'worker-timeout');
    }, CAMERA_WORKER_TIMEOUT_MS);

    cameraPendingRequests.set(requestId, {
      resolve,
      timer
    });

    try {
      cameraWorkerProcess.stdin.write(payload, 'utf8', (error) => {
        if (error) {
          rejectCameraRequest(requestId, 'worker-write-error');
        }
      });
    } catch {
      rejectCameraRequest(requestId, 'worker-write-error');
    }
  });
}

module.exports = {
  CAMERA_FEATURES_ENABLED,
  CAMERA_WORKER_ENABLED,
  CAMERA_WORKER_SCRIPT,
  CAMERA_WORKER_PYTHON,
  startCameraWorker,
  stopCameraWorker,
  requestCameraDetection
};