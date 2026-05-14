const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const readline = require('readline');
const { WebSocketServer } = require('ws');

const teacherRouter = require('./routes/teacher');
const clientRouter = require('./routes/client');
const createAdminRouter = require('./routes/admin');
const createAppsRouter = require('./routes/apps');
const appDataRouter = require('./routes/appData');

const app = express();
const httpServer = http.createServer(app);

const HOST = process.env.HOST || '0.0.0.0';
const parsedPort = Number.parseInt(process.env.PORT || '3000', 10);
const PORT = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536
  ? parsedPort
  : 3000;
const REALTIME_WS_PATH = '/ws/realtime';
const parsedCameraWorkerTimeoutMs = Number.parseInt(process.env.CAMERA_WORKER_TIMEOUT_MS || '1200', 10);
const CAMERA_WORKER_TIMEOUT_MS = Number.isInteger(parsedCameraWorkerTimeoutMs)
  ? Math.max(150, Math.min(parsedCameraWorkerTimeoutMs, 10000))
  : 1200;
const parsedCameraWorkerMaxPending = Number.parseInt(process.env.CAMERA_WORKER_MAX_PENDING || '24', 10);
const CAMERA_WORKER_MAX_PENDING = Number.isInteger(parsedCameraWorkerMaxPending)
  ? Math.max(1, Math.min(parsedCameraWorkerMaxPending, 120))
  : 24;
const CAMERA_WORKER_RESTART_DELAY_MS = 1200;
const CAMERA_WORKER_ENABLED = String(process.env.CAMERA_WORKER_ENABLED || '1').trim() !== '0';
const CAMERA_WORKER_SCRIPT = process.env.CAMERA_WORKER_SCRIPT || path.join(__dirname, 'camera_server.py');

function resolveCameraWorkerPython() {
  const explicit = String(process.env.CAMERA_WORKER_PYTHON || '').trim();
  if (explicit) {
    return explicit;
  }

  const workspaceVenv = process.platform === 'win32'
    ? path.join(__dirname, '.venv', 'Scripts', 'python.exe')
    : path.join(__dirname, '.venv', 'bin', 'python');

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
      cwd: __dirname,
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

function parseRealtimeMessage(raw) {
  try {
    const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw || '');
    const parsed = JSON.parse(text);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const event = typeof parsed.event === 'string' ? parsed.event.trim() : '';
    if (!event) {
      return null;
    }

    return {
      event,
      data: parsed.data
    };
  } catch {
    return null;
  }
}

function createRealtimeTransport() {
  const wss = new WebSocketServer({ noServer: true });
  const sockets = new Map();
  const rooms = new Map();
  const connectionHandlers = [];
  let socketSeq = 0;

  function wsReady(ws) {
    return Boolean(ws) && ws.readyState === 1;
  }

  function wsSend(ws, event, data) {
    if (!wsReady(ws)) {
      return;
    }

    try {
      ws.send(JSON.stringify({ event, data }));
    } catch {
    }
  }

  function removeFromRooms(socketId) {
    rooms.forEach((members) => {
      members.delete(socketId);
    });
  }

  function addToRoom(socketId, room) {
    const safeRoom = String(room || '').trim();
    if (!safeRoom) {
      return;
    }

    if (!rooms.has(safeRoom)) {
      rooms.set(safeRoom, new Set());
    }

    rooms.get(safeRoom).add(socketId);
  }

  function removeFromRoom(socketId, room) {
    const safeRoom = String(room || '').trim();
    if (!safeRoom) {
      return;
    }

    const members = rooms.get(safeRoom);
    if (!members) {
      return;
    }

    members.delete(socketId);
    if (!members.size) {
      rooms.delete(safeRoom);
    }
  }

  function createSocketWrapper(request, ws) {
    const socketId = `ws-${++socketSeq}`;
    const listeners = new Map();
    let closed = false;

    function trigger(event, ...args) {
      const handlers = listeners.get(event);
      if (!handlers || !handlers.length) {
        return;
      }

      handlers.slice().forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`[realtime] handler error for ${event}:`, error && error.message ? error.message : error);
        }
      });
    }

    const socket = {
      id: socketId,
      ws,
      connected: true,
      active: true,
      handshake: {
        headers: request && request.headers ? request.headers : {},
        address: request && request.socket ? request.socket.remoteAddress : 'unknown'
      },
      conn: {
        remoteAddress: request && request.socket ? request.socket.remoteAddress : 'unknown',
        transport: { name: 'websocket' }
      },
      on(event, handler) {
        if (typeof handler !== 'function') {
          return socket;
        }

        const safeEvent = String(event || '').trim();
        if (!safeEvent) {
          return socket;
        }

        const existing = listeners.get(safeEvent) || [];
        existing.push(handler);
        listeners.set(safeEvent, existing);
        return socket;
      },
      emit(event, data) {
        const safeEvent = String(event || '').trim();
        if (!safeEvent) {
          return socket;
        }

        wsSend(ws, safeEvent, data);
        return socket;
      },
      join(room) {
        addToRoom(socketId, room);
        return socket;
      },
      leave(room) {
        removeFromRoom(socketId, room);
        return socket;
      },
      disconnect(code = 1000, reason = 'client-disconnect') {
        socket.active = false;
        socket.connected = false;
        try {
          ws.close(code, reason);
        } catch {
        }
      },
      broadcast: {
        emit(event, data) {
          const safeEvent = String(event || '').trim();
          if (!safeEvent) {
            return;
          }

          sockets.forEach((otherSocket, otherId) => {
            if (otherId === socketId) {
              return;
            }

            otherSocket.emit(safeEvent, data);
          });
        }
      }
    };

    ws.on('message', (raw) => {
      const message = parseRealtimeMessage(raw);
      if (!message) {
        return;
      }

      trigger(message.event, message.data);
    });

    ws.on('error', (error) => {
      trigger('error', error);
    });

    ws.on('close', () => {
      if (closed) {
        return;
      }

      closed = true;
      socket.connected = false;
      socket.active = false;
      removeFromRooms(socketId);
      sockets.delete(socketId);
      trigger('disconnect');
    });

    sockets.set(socketId, socket);
    wsSend(ws, '__meta', { id: socketId });
    return socket;
  }

  const ioTransport = {
    engine: {
      get clientsCount() {
        return sockets.size;
      }
    },
    on(event, handler) {
      if (event === 'connection' && typeof handler === 'function') {
        connectionHandlers.push(handler);
      }
      return ioTransport;
    },
    emit(event, data) {
      const safeEvent = String(event || '').trim();
      if (!safeEvent) {
        return ioTransport;
      }

      sockets.forEach((socket) => {
        socket.emit(safeEvent, data);
      });

      return ioTransport;
    },
    to(room) {
      const safeRoom = String(room || '').trim();

      return {
        emit(event, data) {
          const safeEvent = String(event || '').trim();
          if (!safeRoom || !safeEvent) {
            return;
          }

          const members = rooms.get(safeRoom);
          if (!members || !members.size) {
            return;
          }

          members.forEach((socketId) => {
            const socket = sockets.get(socketId);
            if (!socket) {
              return;
            }

            socket.emit(safeEvent, data);
          });
        }
      };
    },
    handleUpgrade(request, socket, head) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        const wrapped = createSocketWrapper(request, ws);
        connectionHandlers.forEach((handler) => {
          try {
            handler(wrapped);
          } catch (error) {
            console.error('[realtime] connection handler error:', error && error.message ? error.message : error);
          }
        });
      });
    }
  };

  return ioTransport;
}

const io = createRealtimeTransport();

const publicDir = path.join(__dirname, 'public');
const legacyActivitiesDir = path.join(__dirname, 'activities');

if (!fs.existsSync(legacyActivitiesDir)) {
  fs.mkdirSync(legacyActivitiesDir, { recursive: true });
}

app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));

const { sessionMiddleware } = require('./middleware/sessionMiddleware');
app.use(sessionMiddleware());

// Session management middleware
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  return res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/portal', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/student', (req, res) => {
  return res.redirect('/client');
});

app.get('/client.html', (req, res) => {
  res.sendFile(path.join(publicDir, 'client.html'));
});

app.get('/user.html', (req, res) => {
  res.sendFile(path.join(publicDir, 'user.html'));
});

app.get('/camera-speed-test', (req, res) => {
  res.sendFile(path.join(publicDir, 'camera-speed-test.html'));
});

app.get('/launcher.html', (req, res) => {
  res.sendFile(path.join(publicDir, 'launcher.html'));
});

app.get('/apps-launcher', (req, res) => {
  res.sendFile(path.join(publicDir, 'apps-launcher.html'));
});

app.use('/css', express.static(path.join(publicDir, 'css')));
app.use('/icons', express.static(path.join(publicDir, 'icons')));
app.use('/js', express.static(path.join(publicDir, 'js')));
app.use('/public', express.static(publicDir));

// Unified assets (new structure)
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Apps folders
app.use('/apps', express.static(path.join(__dirname, 'apps')));

// Legacy apps/assets path (keep for backward compatibility)
app.use('/apps/assets', express.static(path.join(__dirname, 'apps', 'assets')));

app.use('/teacher', teacherRouter);
app.use(appDataRouter);
app.use('/student', clientRouter);
app.use('/client', clientRouter);

// Store active users and their positions for geometry app
const activeUsers = new Map();
const geometryConnectionMeta = new Map();
const buffonConnectionMeta = new WeakMap();
const canvasNodeConnectionMeta = new WeakMap();
const communicationLog = [];
let communicationSeq = 0;
const parsedCommLogLimit = Number.parseInt(process.env.ADMIN_COMM_LOG_LIMIT || '1200', 10);
const COMM_LOG_LIMIT = Number.isInteger(parsedCommLogLimit) && parsedCommLogLimit >= 200
  ? Math.min(parsedCommLogLimit, 10000)
  : 1200;
const COMM_EVENT_CATALOG = Object.freeze([
  { app: 'socket', direction: 'in', event: 'socket:connect', description: 'WebSocket transport connected to server.' },
  { app: 'socket', direction: 'in', event: 'socket:disconnect', description: 'WebSocket transport disconnected from server.' },

  { app: 'geometry', direction: 'in', event: 'user-position', description: 'Client sends position update to server.' },
  { app: 'geometry', direction: 'in', event: 'camera-frame', description: 'Client sends camera frame to server for detection.' },
  { app: 'geometry', direction: 'in', event: 'camera-speed-frame', description: 'Client sends benchmark frame for camera speed test.' },
  { app: 'geometry', direction: 'in', event: 'activity-update', description: 'Teacher updates geometry activity on server.' },
  { app: 'geometry', direction: 'out', event: 'users-update', description: 'Server broadcasts active geometry points/users.' },
  { app: 'geometry', direction: 'out', event: 'camera-points', description: 'Server replies with detected camera points.' },
  { app: 'geometry', direction: 'out', event: 'camera-speed-result', description: 'Server replies with benchmark tracking frame and latency metrics.' },
  { app: 'geometry', direction: 'out', event: 'activity-loaded', description: 'Server pushes geometry activity snapshot.' },

  { app: 'fourier', direction: 'in', event: 'fourier:join', description: 'Teacher/student join classroom room.' },
  { app: 'fourier', direction: 'in', event: 'fourier:request-state', description: 'Client requests full classroom snapshot.' },
  { app: 'fourier', direction: 'in', event: 'fourier:set-slide', description: 'Teacher sets active slide for classroom.' },
  { app: 'fourier', direction: 'in', event: 'fourier:interaction', description: 'Student interaction telemetry from activity controls.' },
  { app: 'fourier', direction: 'in', event: 'fourier:sound-control', description: 'Student sound sliders (frequency/amplitude) to server.' },
  { app: 'fourier', direction: 'in', event: 'fourier:heat-control', description: 'Student/teacher heat sliders (position/temperature) to server.' },
  { app: 'fourier', direction: 'in', event: 'fourier:heat-time-control', description: 'Teacher heat time slider updates for section 3.5.' },
  { app: 'fourier', direction: 'in', event: 'fourier:fft-duel-start', description: 'Teacher starts competitive FFT duel round.' },
  { app: 'fourier', direction: 'in', event: 'fourier:fft-duel-reveal', description: 'Teacher reveals submitted FFT duel guesses and errors.' },
  { app: 'fourier', direction: 'in', event: 'fourier:fft-duel-probe', description: 'Student updates current probe frequency for FFT duel.' },
  { app: 'fourier', direction: 'in', event: 'fourier:fft-duel-submit', description: 'Student submits and locks FFT duel guess.' },
  { app: 'fourier', direction: 'in', event: 'fourier:ocean-random-pack', description: 'Student submits a random frequency pack for section 6.3.' },
  { app: 'fourier', direction: 'in', event: 'fourier:ocean-random-clear', description: 'Teacher clears classroom random frequency packs.' },
  { app: 'fourier', direction: 'in', event: 'fourier:wave-sum-update', description: 'Student updates their frequency slider for section 2.3.' },
  { app: 'fourier', direction: 'out', event: 'fourier:state', description: 'Server sends full initial/rehydration state.' },
  { app: 'fourier', direction: 'out', event: 'fourier:slide', description: 'Server broadcasts active slide state.' },
  { app: 'fourier', direction: 'out', event: 'fourier:participants', description: 'Server broadcasts participant roster counts/details.' },
  { app: 'fourier', direction: 'out', event: 'fourier:summary', description: 'Server broadcasts aggregate summary metrics.' },
  { app: 'fourier', direction: 'out', event: 'fourier:activity-event', description: 'Server broadcasts single interaction feed event.' },
  { app: 'fourier', direction: 'out', event: 'fourier:sound-state', description: 'Server broadcasts all current student sound states.' },
  { app: 'fourier', direction: 'out', event: 'fourier:heat-state', description: 'Server broadcasts all current student heat selections.' },
  { app: 'fourier', direction: 'out', event: 'fourier:heat-time-state', description: 'Server broadcasts teacher-controlled heat time value.' },
  { app: 'fourier', direction: 'out', event: 'fourier:fft-duel-state', description: 'Server sends competitive FFT duel state (viewer-aware).' },
  { app: 'fourier', direction: 'out', event: 'fourier:ocean-random-state', description: 'Server broadcasts classroom random frequency packs for section 6.3.' },
  { app: 'fourier', direction: 'out', event: 'fourier:wave-sum-state', description: 'Server broadcasts student frequency sliders for section 2.3.' },

  { app: 'buffon', direction: 'in', event: 'buffon:ws-connect', description: 'Buffon websocket connection established.' },
  { app: 'buffon', direction: 'in', event: 'buffon:ws-close', description: 'Buffon websocket connection closed.' },
  { app: 'buffon', direction: 'in', event: 'buffon:register_teacher', description: 'Teacher registers in Buffon channel.' },
  { app: 'buffon', direction: 'in', event: 'buffon:register_student', description: 'Student registers in Buffon channel.' },
  { app: 'buffon', direction: 'in', event: 'buffon:update', description: 'Student update message (drops/hits/piEst).' },
  { app: 'buffon', direction: 'in', event: 'buffon:start_round', description: 'Teacher starts a Buffon round.' },
  { app: 'buffon', direction: 'in', event: 'buffon:end_round', description: 'Teacher ends Buffon round and sends ranking.' },
  { app: 'buffon', direction: 'in', event: 'buffon:reset_tournament', description: 'Teacher resets Buffon tournament state.' },
  { app: 'buffon', direction: 'out', event: 'buffon:roster', description: 'Server sends current roster to teachers.' },
  { app: 'buffon', direction: 'out', event: 'buffon:round_start', description: 'Server pushes round start payload to students.' },
  { app: 'buffon', direction: 'out', event: 'buffon:round_end', description: 'Server pushes round end payload to students.' },
  { app: 'buffon', direction: 'out', event: 'buffon:reset_tournament', description: 'Server pushes tournament reset payload to students.' },

  { app: 'neural-lab', direction: 'in', event: 'neural-lab:ws-connect', description: 'Neural-lab websocket connection established.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:ws-close', description: 'Neural-lab websocket connection closed.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:register_teacher', description: 'Teacher registers in neural-lab channel.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:register_student', description: 'Student registers in neural-lab channel.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:student_weight', description: 'Student updates assigned input weight.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:teacher_config', description: 'Teacher updates input/output configuration.' },
  { app: 'neural-lab', direction: 'out', event: 'neural-lab:canvas_state', description: 'Server pushes synchronized state to teachers/students.' }
]);

function sanitizeCommString(value, maxLen = 200) {
  const raw = String(value || '');

  if (!raw) {
    return '';
  }

  if (raw.startsWith('data:image/')) {
    return '[image-data omitted]';
  }

  if (raw.length <= maxLen) {
    return raw;
  }

  return `${raw.slice(0, maxLen)}...`;
}

function sanitizeCommPayload(value, depth = 0) {
  if (value === null || typeof value === 'undefined') {
    return null;
  }

  if (depth > 3) {
    return '[max-depth]';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? Number(value.toFixed(6)) : null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeCommString(value, 220);
  }

  if (Array.isArray(value)) {
    const list = value.slice(0, 12).map((item) => sanitizeCommPayload(item, depth + 1));

    if (value.length > 12) {
      list.push(`[+${value.length - 12} more]`);
    }

    return list;
  }

  if (typeof value === 'object') {
    const result = {};

    Object.keys(value).slice(0, 14).forEach((key) => {
      if (/image|frame|blob|buffer/i.test(key)) {
        result[key] = '[binary omitted]';
        return;
      }

      result[sanitizeCommString(key, 40)] = sanitizeCommPayload(value[key], depth + 1);
    });

    if (Object.keys(value).length > 14) {
      result.__moreKeys = Object.keys(value).length - 14;
    }

    return result;
  }

  return sanitizeCommString(value, 220);
}

function recordCommunication(entry) {
  const payload = entry && typeof entry === 'object' ? entry : {};
  const message = {
    id: ++communicationSeq,
    ts: Date.now(),
    isoTime: new Date().toISOString(),
    app: sanitizeCommString(payload.app || 'system', 40),
    direction: payload.direction === 'out' ? 'out' : 'in',
    event: sanitizeCommString(payload.event || 'unknown', 90),
    from: sanitizeCommString(payload.from || '-', 80),
    to: sanitizeCommString(payload.to || '-', 80),
    note: sanitizeCommString(payload.note || '', 200),
    payload: sanitizeCommPayload(payload.payload)
  };

  communicationLog.push(message);

  if (communicationLog.length > COMM_LOG_LIMIT) {
    communicationLog.splice(0, communicationLog.length - COMM_LOG_LIMIT);
  }
}

function getCommunicationLog(options = {}) {
  const parsedLimit = Number.parseInt(options.limit, 10);
  const limit = Number.isInteger(parsedLimit)
    ? Math.max(20, Math.min(2000, parsedLimit))
    : 300;

  const source = sanitizeCommString(options.source || '', 40).toLowerCase();
  const eventQuery = sanitizeCommString(options.event || '', 90).toLowerCase();

  let list = communicationLog;

  if (source) {
    list = list.filter((item) => String(item.app || '').toLowerCase() === source);
  }

  if (eventQuery) {
    list = list.filter((item) => String(item.event || '').toLowerCase().includes(eventQuery));
  }

  return list.slice(-limit).reverse().map((item) => ({ ...item }));
}

function clearCommunicationLog() {
  const cleared = communicationLog.length;
  communicationLog.length = 0;
  communicationSeq = 0;
  return cleared;
}

function getCommunicationCatalog() {
  return COMM_EVENT_CATALOG.map((item) => ({ ...item }));
}

function getHeaderValue(headers, key) {
  if (!headers || !key) {
    return '';
  }

  const loweredKey = String(key).toLowerCase();
  const direct = headers[loweredKey];

  if (Array.isArray(direct)) {
    return String(direct[0] || '');
  }

  if (typeof direct === 'string') {
    return direct;
  }

  const fallbackKey = Object.keys(headers).find((headerKey) => String(headerKey).toLowerCase() === loweredKey);

  if (!fallbackKey) {
    return '';
  }

  const fallbackValue = headers[fallbackKey];

  if (Array.isArray(fallbackValue)) {
    return String(fallbackValue[0] || '');
  }

  return typeof fallbackValue === 'string' ? fallbackValue : '';
}

function extractIpFromHeaders(headers, fallback = 'unknown') {
  const forwarded = getHeaderValue(headers, 'x-forwarded-for');

  if (forwarded) {
    return forwarded.split(',')[0].trim() || fallback;
  }

  return fallback;
}

function toIsoTimestamp(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return new Date(numeric).toISOString();
}

function getSocketClientInfo(socket) {
  const handshake = socket && socket.handshake ? socket.handshake : {};
  const headers = handshake.headers || {};
  const fallbackIp = handshake.address || (socket && socket.conn ? socket.conn.remoteAddress : '') || 'unknown';

  return {
    ip: extractIpFromHeaders(headers, fallbackIp),
    userAgent: getHeaderValue(headers, 'user-agent') || 'unknown'
  };
}

function getUpgradeClientInfo(request) {
  const headers = request && request.headers ? request.headers : {};
  const fallbackIp = request && request.socket ? request.socket.remoteAddress : 'unknown';

  return {
    ip: extractIpFromHeaders(headers, fallbackIp),
    userAgent: getHeaderValue(headers, 'user-agent') || 'unknown'
  };
}

function touchGeometryConnection(socketId) {
  const current = geometryConnectionMeta.get(socketId);

  if (!current) {
    return;
  }

  geometryConnectionMeta.set(socketId, {
    ...current,
    lastSeenAt: Date.now()
  });
}

function touchBuffonConnection(ws, patch = {}) {
  const current = buffonConnectionMeta.get(ws) || {
    connectedAt: Date.now(),
    lastSeenAt: Date.now(),
    ip: 'unknown',
    userAgent: 'unknown',
    role: 'unknown',
    name: 'Buffon participant'
  };

  const next = {
    ...current,
    ...patch,
    lastSeenAt: Date.now()
  };

  buffonConnectionMeta.set(ws, next);
  return next;
}

function touchCanvasNodeConnection(ws, patch = {}) {
  const current = canvasNodeConnectionMeta.get(ws) || {
    connectedAt: Date.now(),
    lastSeenAt: Date.now(),
    ip: 'unknown',
    userAgent: 'unknown',
    role: 'unknown',
    name: 'Canvas participant'
  };

  const next = {
    ...current,
    ...patch,
    lastSeenAt: Date.now()
  };

  canvasNodeConnectionMeta.set(ws, next);
  return next;
}

function buildUserList() {
  const list = [];

  activeUsers.forEach((user, socketId) => {
    const base = {
      id: socketId,
      name: user.name || 'User',
      color: user.color,
      shape: user.shape,
      role: user.role || 'mouse'
    };

    if (user.role === 'camera' && Array.isArray(user.points) && user.points.length) {
      user.points.forEach((point, idx) => {
        const pointId = typeof point.id === 'number' ? point.id : idx + 1;

        list.push({
          ...base,
          id: `${socketId}:${pointId}`,
          name: `${base.name} ${pointId}`,
          x: point.x,
          y: point.y
        });
      });

      return;
    }

    if (typeof user.x === 'number' && typeof user.y === 'number') {
      list.push({
        ...base,
        x: user.x,
        y: user.y
      });
    }
  });

  return list;
}

function getRealtimeParticipants() {
  const participants = [];

  activeUsers.forEach((user, socketId) => {
    const meta = geometryConnectionMeta.get(socketId) || {};
    const safeName = String((user && user.name) || `Geometry-${String(socketId).slice(0, 6)}`)
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 60) || 'Geometry user';

    participants.push({
      sessionId: `geometry:${socketId}`,
      username: safeName,
      displayName: safeName,
      role: String((user && user.role) || 'client'),
      source: 'geometry',
      loginAt: toIsoTimestamp(meta.connectedAt),
      lastSeen: toIsoTimestamp(meta.lastSeenAt),
      ip: meta.ip || 'unknown',
      userAgent: meta.userAgent || 'unknown'
    });
  });

  fourierParticipants.forEach((participant) => {
    const safeName = String(participant && participant.name ? participant.name : 'Fourier user')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 60) || 'Fourier user';

    participants.push({
      sessionId: `fourier:${participant.socketId}`,
      username: safeName,
      displayName: safeName,
      role: participant.role || 'client',
      source: 'fourier',
      loginAt: toIsoTimestamp(participant.joinedAt),
      lastSeen: toIsoTimestamp(participant.lastActionAt || participant.joinedAt),
      ip: participant.ip || 'unknown',
      userAgent: participant.userAgent || 'unknown'
    });
  });

  buffonStudents.forEach((studentState, ws) => {
    const meta = buffonConnectionMeta.get(ws) || {};
    const safeName = String((studentState && studentState.team) || meta.name || 'Buffon student')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 60) || 'Buffon student';

    participants.push({
      sessionId: `buffon-student:${safeName}:${toIsoTimestamp(meta.connectedAt) || ''}`,
      username: safeName,
      displayName: safeName,
      role: 'client',
      source: 'buffon',
      loginAt: toIsoTimestamp(meta.connectedAt),
      lastSeen: toIsoTimestamp(meta.lastSeenAt),
      ip: meta.ip || 'unknown',
      userAgent: meta.userAgent || 'unknown'
    });
  });

  buffonTeachers.forEach((ws) => {
    const meta = buffonConnectionMeta.get(ws) || {};
    const safeName = String(meta.name || 'Buffon teacher')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 60) || 'Buffon teacher';

    participants.push({
      sessionId: `buffon-teacher:${safeName}:${toIsoTimestamp(meta.connectedAt) || ''}`,
      username: safeName,
      displayName: safeName,
      role: 'teacher',
      source: 'buffon',
      loginAt: toIsoTimestamp(meta.connectedAt),
      lastSeen: toIsoTimestamp(meta.lastSeenAt),
      ip: meta.ip || 'unknown',
      userAgent: meta.userAgent || 'unknown'
    });
  });

  return participants.sort((a, b) => {
    const aTime = String(a.lastSeen || a.loginAt || '');
    const bTime = String(b.lastSeen || b.loginAt || '');
    return bTime.localeCompare(aTime);
  });
}

function getRealtimeStats() {
  return {
    connectedSockets: io.engine.clientsCount,
    activeUserPoints: buildUserList().length,
    fourierParticipants: fourierParticipants.size,
    buffonStudents: buffonStudents.size,
    buffonTeachers: buffonTeachers.size
  };
}

app.use('/admin', createAdminRouter({
  getRealtimeStats,
  getRealtimeParticipants,
  getCommunicationLog,
  clearCommunicationLog,
  getCommunicationCatalog
}));
app.use('/apps', createAppsRouter());

const FOURIER_ROOM = 'fourier:classroom';
const fourierParticipants = new Map();
const fourierState = {
  activeSlideId: 'sec-cover',
  activeSlideIndex: 0,
  updatedAt: Date.now()
};
const fourierHeatTimeState = {
  value: 0,
  updatedAt: Date.now(),
  sourceSocketId: ''
};
const fourierInteractionFeed = [];
const fourierBySlideCount = new Map();
const fourierByActivityCount = new Map();
const fourierSoundState = new Map();
const fourierHeatState = new Map();
const FOURIER_OCEAN_RANDOM_MAX_TERMS = 40;
const fourierOceanRandomState = {
  packs: new Map(),
  updatedAt: Date.now()
};
const FOURIER_FFT_DUEL_SIGNAL_KINDS = ['sine', 'square', 'triangle', 'saw'];
const fourierFftDuelState = {
  roundId: '',
  status: 'idle',
  startedAt: 0,
  updatedAt: Date.now(),
  revealResults: false,
  assignments: new Map()
};
const fourierWaveSumState = new Map(); // socketId -> { freq, updatedAt }
const fourierTaylorGuessState = {
  roundId: '',
  status: 'idle',
  revealResults: false,
  startedAt: 0,
  updatedAt: Date.now(),
  submissions: new Map()
};
const fourierTaylorGuessLiveCoeffs = new Map(); // socketId -> {c0,c1,c2,c3}
const FOURIER_DEBUG = process.env.FOURIER_DEBUG === '1';

function logFourier(eventName, payload) {
  if (!FOURIER_DEBUG) {
    return;
  }

  console.log('[fourier]', eventName, payload || '');
}

function resolveFourierRole(rawRole) {
  return rawRole === 'teacher' ? 'teacher' : 'client';
}

function normalizeFourierName(rawName, role, socketId) {
  const cleaned = String(rawName || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 40);

  if (cleaned) {
    return cleaned;
  }

  if (role === 'teacher') {
    return 'Teacher';
  }

  return `Student-${String(socketId || '').slice(0, 5)}`;
}

function normalizeFourierTeam(rawTeam, role, fallbackName, socketId) {
  const cleaned = String(rawTeam || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 30);

  if (role === 'teacher') {
    return 'Teacher';
  }

  if (cleaned) {
    return cleaned;
  }

  const fromName = String(fallbackName || '').trim();
  if (fromName) {
    return fromName.slice(0, 30);
  }

  return `Team-${String(socketId || '').slice(0, 4)}`;
}

function coerceFourierString(value, maxLen = 80) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLen);
}

function coerceFourierValue(value, depth = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number(value.toFixed(5));
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return coerceFourierString(value, 80);
  }

  if (depth > 2) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.slice(0, 8).map((item) => coerceFourierValue(item, depth + 1));
  }

  if (value && typeof value === 'object') {
    const result = {};

    Object.keys(value).slice(0, 8).forEach((key) => {
      const safeKey = coerceFourierString(key, 24);
      result[safeKey] = coerceFourierValue(value[key], depth + 1);
    });

    return result;
  }

  return '';
}

function clampFourierNumber(value, min, max, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
}

function normalizeFourierSoundPayload(payload) {
  const frequency = Number(
    clampFourierNumber(payload && payload.frequency, 80, 1400, 440).toFixed(2)
  );
  const amplitude = Number(
    clampFourierNumber(payload && payload.amplitude, 0, 1, 0).toFixed(3)
  );

  return {
    frequency,
    amplitude
  };
}

function normalizeFourierHeatPayload(payload) {
  const rawPosition = payload && payload.position;
  const inferredPosition = Number.isFinite(Number(rawPosition))
    ? Number(rawPosition)
    : Number.isFinite(Number(payload && payload.positionMeter))
      ? Number(payload.positionMeter) + 0.5
      : 0.5;
  const position = Number(clampFourierNumber(inferredPosition, 0, 1, 0.5).toFixed(4));

  const rawTemperature = payload && payload.temperature;
  const inferredTemperature = Number.isFinite(Number(rawTemperature))
    ? Number(rawTemperature)
    : Number.isFinite(Number(payload && payload.temperatureNorm))
      ? Number(payload.temperatureNorm) * 100
      : 53;
  const temperature = Number(clampFourierNumber(inferredTemperature, 0, 100, 53).toFixed(2));

  return {
    position,
    temperature
  };
}

function normalizeFourierHeatTimePayload(payload) {
  const rawValue = Number(
    payload && typeof payload === 'object' && payload !== null
      ? payload.value
      : payload
  );

  return Number(clampFourierNumber(rawValue, 0, 8, 0).toFixed(2));
}

function normalizeFourierOceanRandomItems(rawItems) {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .slice(0, 8)
    .map((item) => ({
      freq: Number(clampFourierNumber(item && item.freq, 0, 8, 1).toFixed(2)),
      amp: Number(clampFourierNumber(item && item.amp, 0.01, 1, 0.1).toFixed(3)),
      phase: Number(clampFourierNumber(item && item.phase, 0, Math.PI * 2, 0).toFixed(3)),
      angle: Number(clampFourierNumber(item && item.angle, 0, Math.PI * 2, 0).toFixed(3))
    }))
    .filter((item) => Number.isFinite(item.freq) && Number.isFinite(item.amp));
}

function buildFourierOceanRandomPayload() {
  const packs = [];

  fourierOceanRandomState.packs.forEach((pack, socketId) => {
    const participant = fourierParticipants.get(socketId);
    if (!participant || participant.role !== 'client') {
      return;
    }

    packs.push({
      socketId,
      name: participant.name,
      team: participant.team,
      items: normalizeFourierOceanRandomItems(pack && pack.items),
      updatedAt: pack && pack.updatedAt ? pack.updatedAt : 0
    });
  });

  packs.sort((a, b) => String(a.name).localeCompare(String(b.name)));

  const usedTerms = [];
  packs.forEach((pack) => {
    (pack.items || []).forEach((item) => {
      if (usedTerms.length < FOURIER_OCEAN_RANDOM_MAX_TERMS) {
        usedTerms.push({ ...item });
      }
    });
  });

  return {
    packs,
    totalTerms: packs.reduce((sum, pack) => sum + ((pack.items && pack.items.length) || 0), 0),
    usedTerms,
    updatedAt: fourierOceanRandomState.updatedAt || Date.now()
  };
}

function normalizeFourierFftDuelSignalKind(rawKind) {
  const safe = coerceFourierString(rawKind, 20).toLowerCase();
  return FOURIER_FFT_DUEL_SIGNAL_KINDS.includes(safe) ? safe : 'sine';
}

function buildFourierFftDuelAssignment(participant, socketId) {
  const signalKind = FOURIER_FFT_DUEL_SIGNAL_KINDS[
    Math.floor(Math.random() * FOURIER_FFT_DUEL_SIGNAL_KINDS.length)
  ];
  const targetFreq = Number((0.5 + Math.random() * 7.5).toFixed(1));
  const probeFreq = Number((Math.random() * 8).toFixed(1));
  const now = Date.now();

  return {
    socketId,
    role: participant && participant.role === 'teacher' ? 'teacher' : 'client',
    name: normalizeFourierName(participant && participant.name, 'client', socketId),
    team: normalizeFourierTeam(participant && participant.team, 'client', participant && participant.name, socketId),
    signalKind,
    targetFreq,
    probeFreq,
    submitted: false,
    locked: false,
    guessFreq: null,
    error: null,
    submittedAt: 0,
    updatedAt: now
  };
}

function ensureFourierFftDuelAssignment(socketId) {
  const participant = fourierParticipants.get(socketId);
  if (!participant || participant.role !== 'client') {
    return null;
  }

  const existing = fourierFftDuelState.assignments.get(socketId);
  if (existing) {
    return existing;
  }

  const next = buildFourierFftDuelAssignment(participant, socketId);
  fourierFftDuelState.assignments.set(socketId, next);
  return next;
}

function resetFourierFftDuelAssignmentsForCurrentClients() {
  const nextAssignments = new Map();
  fourierParticipants.forEach((participant, socketId) => {
    if (!participant || participant.role !== 'client') {
      return;
    }

    nextAssignments.set(socketId, buildFourierFftDuelAssignment(participant, socketId));
  });
  fourierFftDuelState.assignments = nextAssignments;
}

function startFourierFftDuelRound() {
  const now = Date.now();
  fourierFftDuelState.roundId = `fft-${now}`;
  fourierFftDuelState.status = 'running';
  fourierFftDuelState.revealResults = false;
  fourierFftDuelState.startedAt = now;
  fourierFftDuelState.updatedAt = now;
  resetFourierFftDuelAssignmentsForCurrentClients();
}

function buildFourierFftDuelPlayerView(socketId, viewerSocketId, viewerRole) {
  const participant = fourierParticipants.get(socketId);
  if (!participant || participant.role !== 'client') {
    return null;
  }

  const assignment = fourierFftDuelState.assignments.get(socketId) || ensureFourierFftDuelAssignment(socketId);
  if (!assignment) {
    return null;
  }

  const revealForTeacher = viewerRole === 'teacher' && Boolean(fourierFftDuelState.revealResults);
  const revealForOwnClient = socketId === viewerSocketId;
  const showGuessAndError = revealForTeacher || revealForOwnClient;

  return {
    socketId,
    name: participant.name,
    team: participant.team,
    signalKind: normalizeFourierFftDuelSignalKind(assignment.signalKind),
    probeFreq: Number(clampFourierNumber(assignment.probeFreq, 0, 8, 2).toFixed(1)),
    targetFreq: revealForOwnClient ? Number(clampFourierNumber(assignment.targetFreq, 0, 8, 2).toFixed(1)) : null,
    submitted: Boolean(assignment.submitted),
    locked: Boolean(assignment.locked),
    guessFreq: showGuessAndError && assignment.submitted && Number.isFinite(Number(assignment.guessFreq))
      ? Number(clampFourierNumber(assignment.guessFreq, 0, 8, 2).toFixed(1))
      : null,
    error: showGuessAndError && assignment.submitted && Number.isFinite(Number(assignment.error))
      ? Number(Math.max(0, Number(assignment.error)).toFixed(2))
      : null,
    submittedAt: assignment.submittedAt || 0,
    updatedAt: assignment.updatedAt || 0
  };
}

function buildFourierFftDuelPayload(viewerSocketId = '', viewerRole = 'client') {
  const players = [];
  fourierParticipants.forEach((participant, socketId) => {
    if (!participant || participant.role !== 'client') {
      return;
    }

    const view = buildFourierFftDuelPlayerView(socketId, viewerSocketId, viewerRole);
    if (view) {
      players.push(view);
    }
  });

  players.sort((a, b) => {
    if (a.submitted !== b.submitted) {
      return a.submitted ? -1 : 1;
    }

    const aErr = Number.isFinite(Number(a.error)) ? Number(a.error) : Number.POSITIVE_INFINITY;
    const bErr = Number.isFinite(Number(b.error)) ? Number(b.error) : Number.POSITIVE_INFINITY;
    if (aErr !== bErr) {
      return aErr - bErr;
    }

    return String(a.name).localeCompare(String(b.name));
  });

  const solvedCount = players.reduce((sum, player) => sum + (player.submitted ? 1 : 0), 0);
  const own = viewerRole === 'client'
    ? players.find((player) => player.socketId === viewerSocketId) || null
    : null;

  return {
    roundId: fourierFftDuelState.roundId,
    status: fourierFftDuelState.status,
    revealResults: Boolean(fourierFftDuelState.revealResults),
    startedAt: fourierFftDuelState.startedAt,
    updatedAt: fourierFftDuelState.updatedAt,
    solvedCount,
    totalPlayers: players.length,
    players,
    own
  };
}

function ensureFourierSocketMeta(socket) {
  const existing = geometryConnectionMeta.get(socket.id);

  if (existing) {
    return existing;
  }

  const socketMeta = {
    connectedAt: Date.now(),
    lastSeenAt: Date.now(),
    ...getSocketClientInfo(socket)
  };

  geometryConnectionMeta.set(socket.id, socketMeta);
  return socketMeta;
}

// Centralized participant registration used by both:
// 1) explicit `fourier:join`
// 2) implicit recovery from realtime control channels (`fourier:sound-control`, `fourier:heat-control`)
function registerFourierParticipant(socket, role, rawName, rawTeam) {
  const safeRole = resolveFourierRole(role);
  const safeName = normalizeFourierName(rawName, safeRole, socket.id);
  const safeTeam = normalizeFourierTeam(rawTeam, safeRole, safeName, socket.id);
  const socketMeta = ensureFourierSocketMeta(socket);
  const previous = fourierParticipants.get(socket.id);

  socket.join(FOURIER_ROOM);

  const participant = {
    socketId: socket.id,
    role: safeRole,
    name: safeName,
    team: safeTeam,
    joinedAt: previous && previous.joinedAt ? previous.joinedAt : Date.now(),
    interactions: previous && Number.isFinite(previous.interactions) ? previous.interactions : 0,
    lastActionAt: previous ? previous.lastActionAt || null : null,
    lastSlideId: previous ? previous.lastSlideId || '' : '',
    ip: socketMeta.ip || 'unknown',
    userAgent: socketMeta.userAgent || 'unknown'
  };

  fourierParticipants.set(socket.id, participant);

  if (safeRole === 'client') {
    const currentSound = fourierSoundState.get(socket.id) || {
      frequency: 440,
      amplitude: 0,
      updatedAt: Date.now()
    };

    fourierSoundState.set(socket.id, {
      frequency: Number(clampFourierNumber(currentSound.frequency, 80, 1400, 440).toFixed(2)),
      amplitude: Number(clampFourierNumber(currentSound.amplitude, 0, 1, 0).toFixed(3)),
      updatedAt: currentSound.updatedAt || Date.now()
    });
  } else {
    fourierSoundState.delete(socket.id);
    fourierHeatState.delete(socket.id);
  }

  return participant;
}

function buildFourierSoundPayload() {
  const states = [];

  fourierParticipants.forEach((participant, socketId) => {
    if (!participant || participant.role !== 'client') {
      return;
    }

    const current = fourierSoundState.get(socketId) || {
      frequency: 440,
      amplitude: 0,
      updatedAt: 0
    };

    states.push({
      socketId,
      name: participant.name,
      team: participant.team,
      role: participant.role,
      frequency: current.frequency,
      amplitude: current.amplitude,
      updatedAt: current.updatedAt || 0
    });
  });

  return states
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .slice(0, 120);
}

function buildFourierHeatPayload() {
  const states = [];

  fourierParticipants.forEach((participant, socketId) => {
    if (!participant) {
      return;
    }

    const current = fourierHeatState.get(socketId);
    if (!current) {
      return;
    }

    const position = Number(clampFourierNumber(current.position, 0, 1, 0.5).toFixed(4));
    const temperature = Number(clampFourierNumber(current.temperature, 0, 100, 53).toFixed(2));

    states.push({
      socketId,
      name: participant.name,
      team: participant.team,
      role: participant.role,
      position,
      positionMeter: Number((position - 0.5).toFixed(3)),
      temperature,
      temperatureNorm: Number((temperature / 100).toFixed(4)),
      updatedAt: current.updatedAt || 0
    });
  });

  return states
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .slice(0, 120);
}

function buildFourierHeatTimePayload() {
  return {
    value: Number(clampFourierNumber(fourierHeatTimeState.value, 0, 8, 0).toFixed(2)),
    updatedAt: fourierHeatTimeState.updatedAt || 0
  };
}

function incrementCounter(map, key) {
  const safeKey = coerceFourierString(key, 80);
  if (!safeKey) {
    return;
  }

  map.set(safeKey, (map.get(safeKey) || 0) + 1);
}

function pushFourierFeed(entry) {
  fourierInteractionFeed.push(entry);

  if (fourierInteractionFeed.length > 260) {
    fourierInteractionFeed.splice(0, fourierInteractionFeed.length - 260);
  }
}

function buildFourierParticipantPayload() {
  const roster = [];
  let teacherCount = 0;
  let studentCount = 0;

  fourierParticipants.forEach((participant) => {
    if (participant.role === 'teacher') {
      teacherCount += 1;
    } else {
      studentCount += 1;
    }

    const soundSnapshot = participant.role === 'client'
      ? (fourierSoundState.get(participant.socketId) || {
        frequency: 440,
        amplitude: 0,
        updatedAt: 0
      })
      : null;

    roster.push({
      socketId: participant.socketId,
      role: participant.role,
      name: participant.name,
      team: participant.team,
      joinedAt: participant.joinedAt,
      interactions: participant.interactions,
      lastActionAt: participant.lastActionAt,
      lastSlideId: participant.lastSlideId,
      sound: soundSnapshot
        ? {
          frequency: soundSnapshot.frequency,
          amplitude: soundSnapshot.amplitude,
          updatedAt: soundSnapshot.updatedAt || 0
        }
        : null
    });
  });

  return {
    teachers: teacherCount,
    students: studentCount,
    roster: roster.slice(0, 100)
  };
}

function buildFourierSummary() {
  const participantPayload = buildFourierParticipantPayload();
  const soundStates = buildFourierSoundPayload();
  const heatStates = buildFourierHeatPayload();
  const fftDuelPublic = buildFourierFftDuelPayload('', 'teacher');
  const oceanRandom = buildFourierOceanRandomPayload();

  const topStudents = participantPayload.roster
    .filter((item) => item.role === 'client')
    .sort((a, b) => {
      if (a.interactions !== b.interactions) {
        return b.interactions - a.interactions;
      }

      return String(a.name).localeCompare(String(b.name));
    })
    .slice(0, 12)
    .map((item) => ({
      name: item.name,
      interactions: item.interactions,
      lastSlideId: item.lastSlideId || '',
      lastActionAt: item.lastActionAt || null
    }));

  const slideActivity = [...fourierBySlideCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([slideId, count]) => ({ slideId, count }));

  const activityBreakdown = [...fourierByActivityCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([activityId, count]) => ({ activityId, count }));

  const recent = fourierInteractionFeed
    .slice(-26)
    .reverse()
    .map((entry) => ({ ...entry }));

  return {
    activeSlideId: fourierState.activeSlideId,
    activeSlideIndex: fourierState.activeSlideIndex,
    participants: participantPayload,
    soundStates,
    heatStates,
    heatTime: buildFourierHeatTimePayload(),
    fftDuel: {
      roundId: fftDuelPublic.roundId,
      status: fftDuelPublic.status,
      solvedCount: fftDuelPublic.solvedCount,
      totalPlayers: fftDuelPublic.totalPlayers,
      updatedAt: fftDuelPublic.updatedAt
    },
    oceanRandom: {
      totalTerms: oceanRandom.totalTerms,
      usedTerms: oceanRandom.usedTerms,
      updatedAt: oceanRandom.updatedAt
    },
    topStudents,
    slideActivity,
    activityBreakdown,
    recent,
    updatedAt: Date.now()
  };
}

function emitFourierParticipants() {
  const payload = buildFourierParticipantPayload();

  recordCommunication({
    app: 'fourier',
    direction: 'out',
    event: 'fourier:participants',
    from: 'server',
    to: FOURIER_ROOM,
    payload: {
      teachers: payload.teachers,
      students: payload.students,
      rosterCount: Array.isArray(payload.roster) ? payload.roster.length : 0
    }
  });

  io.to(FOURIER_ROOM).emit('fourier:participants', payload);
}

function emitFourierSummary() {
  const payload = buildFourierSummary();

  recordCommunication({
    app: 'fourier',
    direction: 'out',
    event: 'fourier:summary',
    from: 'server',
    to: FOURIER_ROOM,
    payload: {
      activeSlideId: payload.activeSlideId,
      activeSlideIndex: payload.activeSlideIndex,
      topStudents: Array.isArray(payload.topStudents) ? payload.topStudents.length : 0,
      soundStates: Array.isArray(payload.soundStates) ? payload.soundStates.length : 0,
      heatStates: Array.isArray(payload.heatStates) ? payload.heatStates.length : 0,
      heatTime: payload.heatTime && Number.isFinite(payload.heatTime.value) ? payload.heatTime.value : 0
    }
  });

  io.to(FOURIER_ROOM).emit('fourier:summary', payload);
}

function emitFourierSoundState() {
  // Broadcast channel consumed by classroom-sync.js and then re-dispatched
  // as `fourier:classroom-sound-state` for the rendering/audio layer.
  const payload = {
    soundStates: buildFourierSoundPayload(),
    updatedAt: Date.now()
  };

  recordCommunication({
    app: 'fourier',
    direction: 'out',
    event: 'fourier:sound-state',
    from: 'server',
    to: FOURIER_ROOM,
    payload: {
      sourceCount: Array.isArray(payload.soundStates) ? payload.soundStates.length : 0
    }
  });

  io.to(FOURIER_ROOM).emit('fourier:sound-state', payload);
}

function emitFourierHeatState() {
  // Broadcast channel consumed by classroom-sync.js and then re-dispatched
  // as `fourier:classroom-heat-state` for the heat visualization layer.
  const payload = {
    heatStates: buildFourierHeatPayload(),
    updatedAt: Date.now()
  };

  recordCommunication({
    app: 'fourier',
    direction: 'out',
    event: 'fourier:heat-state',
    from: 'server',
    to: FOURIER_ROOM,
    payload: {
      sourceCount: Array.isArray(payload.heatStates) ? payload.heatStates.length : 0
    }
  });

  io.to(FOURIER_ROOM).emit('fourier:heat-state', payload);
}

function emitFourierHeatTimeState() {
  const payload = {
    heatTime: buildFourierHeatTimePayload(),
    updatedAt: Date.now()
  };

  recordCommunication({
    app: 'fourier',
    direction: 'out',
    event: 'fourier:heat-time-state',
    from: 'server',
    to: FOURIER_ROOM,
    payload: {
      value: payload.heatTime.value,
      updatedAt: payload.heatTime.updatedAt
    }
  });

  io.to(FOURIER_ROOM).emit('fourier:heat-time-state', payload);
}

function emitFourierFftDuelState(targetSocket = null) {
  if (targetSocket) {
    const participant = fourierParticipants.get(targetSocket.id);
    const payload = buildFourierFftDuelPayload(
      targetSocket.id,
      participant && participant.role ? participant.role : 'client'
    );

    recordCommunication({
      app: 'fourier',
      direction: 'out',
      event: 'fourier:fft-duel-state',
      from: 'server',
      to: targetSocket.id,
      payload: {
        roundId: payload.roundId,
        status: payload.status,
        solvedCount: payload.solvedCount,
        totalPlayers: payload.totalPlayers
      }
    });

    targetSocket.emit('fourier:fft-duel-state', payload);
    return;
  }

  recordCommunication({
    app: 'fourier',
    direction: 'out',
    event: 'fourier:fft-duel-state',
    from: 'server',
    to: FOURIER_ROOM,
    payload: {
      status: fourierFftDuelState.status
    }
  });

  fourierParticipants.forEach((participant, socketId) => {
    if (!participant) {
      return;
    }

    const payload = buildFourierFftDuelPayload(socketId, participant.role);
    io.to(socketId).emit('fourier:fft-duel-state', payload);
  });
}

function startFourierTaylorGuessRound() {
  const now = Date.now();
  fourierTaylorGuessState.roundId = `taylor-${now}`;
  fourierTaylorGuessState.status = 'running';
  fourierTaylorGuessState.revealResults = false;
  fourierTaylorGuessState.startedAt = now;
  fourierTaylorGuessState.updatedAt = now;
  fourierTaylorGuessState.submissions = new Map();
}

function buildFourierTaylorGuessPayload(viewerSocketId = '', viewerRole = 'client') {
  const revealForTeacher = viewerRole === 'teacher' && Boolean(fourierTaylorGuessState.revealResults);
  const submittedCount = fourierTaylorGuessState.submissions.size;
  const players = [];

  fourierParticipants.forEach((participant, socketId) => {
    if (!participant || participant.role !== 'client') return;
    const sub = fourierTaylorGuessState.submissions.get(socketId);
    const isOwn = socketId === viewerSocketId;
    const showCoeffs = revealForTeacher || (isOwn && Boolean(sub));
    const live = fourierTaylorGuessLiveCoeffs.get(socketId);
    const teacherCoeffs = sub
      ? [sub.c0, sub.c1, sub.c2, sub.c3]
      : (live ? [live.c0, live.c1, live.c2, live.c3] : null);
    players.push({
      socketId,
      name: participant.name,
      submitted: Boolean(sub),
      coeffs: viewerRole === 'teacher' ? teacherCoeffs : (showCoeffs && sub ? [sub.c0, sub.c1, sub.c2, sub.c3] : null),
      error: revealForTeacher && sub ? sub.error : null,
    });
  });

  players.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const viewerSub = viewerRole === 'client' ? fourierTaylorGuessState.submissions.get(viewerSocketId) : null;

  return {
    roundId: fourierTaylorGuessState.roundId,
    status: fourierTaylorGuessState.status,
    revealResults: Boolean(fourierTaylorGuessState.revealResults),
    submittedCount,
    totalPlayers: players.length,
    players,
    ownSubmitted: Boolean(viewerSub),
    ownCoeffs: viewerSub ? [viewerSub.c0, viewerSub.c1, viewerSub.c2, viewerSub.c3] : null,
    updatedAt: fourierTaylorGuessState.updatedAt,
  };
}

function emitFourierTaylorGuessState(targetSocket = null) {
  if (targetSocket) {
    const participant = fourierParticipants.get(targetSocket.id);
    const payload = buildFourierTaylorGuessPayload(targetSocket.id, participant && participant.role ? participant.role : 'client');
    targetSocket.emit('fourier:taylor-guess-state', payload);
    return;
  }
  fourierParticipants.forEach((participant, socketId) => {
    if (!participant) return;
    const payload = buildFourierTaylorGuessPayload(socketId, participant.role);
    io.to(socketId).emit('fourier:taylor-guess-state', payload);
  });
}

function emitFourierOceanRandomState(targetSocket = null) {
  const payload = {
    ...buildFourierOceanRandomPayload(),
    taylorGuess: {
      roundId: fourierTaylorGuessState.roundId,
      status: fourierTaylorGuessState.status,
      submittedCount: fourierTaylorGuessState.submissions.size,
      updatedAt: fourierTaylorGuessState.updatedAt,
    }
  };

  recordCommunication({
    app: 'fourier',
    direction: 'out',
    event: 'fourier:ocean-random-state',
    from: 'server',
    to: targetSocket ? targetSocket.id : FOURIER_ROOM,
    payload: {
      packs: Array.isArray(payload.packs) ? payload.packs.length : 0,
      totalTerms: payload.totalTerms,
      usedTerms: Array.isArray(payload.usedTerms) ? payload.usedTerms.length : 0
    }
  });

  if (targetSocket) {
    targetSocket.emit('fourier:ocean-random-state', payload);
    return;
  }

  io.to(FOURIER_ROOM).emit('fourier:ocean-random-state', payload);
}

function buildFourierWaveSumPayload() {
  const entries = [];
  fourierWaveSumState.forEach((data, socketId) => {
    const participant = fourierParticipants.get(socketId);
    if (!participant || participant.role !== 'client') {
      return;
    }
    entries.push({
      name: participant.name,
      freq: Number(clampFourierNumber(data.freq, 0.4, 6, 1.2).toFixed(2)),
      phi: Number(clampFourierNumber(data.phi, -3.14, 3.14, 0).toFixed(2)),
      updatedAt: data.updatedAt || 0
    });
  });
  entries.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return { entries, updatedAt: Date.now() };
}

function emitFourierWaveSumState(targetSocket = null) {
  const payload = buildFourierWaveSumPayload();

  recordCommunication({
    app: 'fourier',
    direction: 'out',
    event: 'fourier:wave-sum-state',
    from: 'server',
    to: targetSocket ? targetSocket.id : FOURIER_ROOM,
    payload: { entries: payload.entries.length }
  });

  if (targetSocket) {
    targetSocket.emit('fourier:wave-sum-state', payload);
    return;
  }

  io.to(FOURIER_ROOM).emit('fourier:wave-sum-state', payload);
}

function emitUsersUpdate() {
  const users = buildUserList();

  recordCommunication({
    app: 'geometry',
    direction: 'out',
    event: 'users-update',
    from: 'server',
    to: 'all-sockets',
    payload: {
      points: users.length
    }
  });

  io.emit('users-update', users);
}

async function detectPointsFromPython(imageBase64) {
  return requestCameraDetection(imageBase64);
}

async function detectCameraFrameFromPython(imageBase64, options = {}) {
  return requestCameraDetection(imageBase64, options);
}

function sanitizeLegacyFilename(filename) {
  const basename = path.basename(String(filename || ''));
  const safe = basename.replace(/[^a-z0-9._-]/gi, '');

  return safe.endsWith('.json') ? safe : '';
}

// Store current legacy geometry activity
let currentActivity = null;

app.post('/api/activity/save', (req, res) => {
  const name = String((req.body && req.body.name) || 'activity').trim();
  const geometry = Array.isArray(req.body && req.body.geometry) ? req.body.geometry : [];
  const safeName = name.replace(/[^a-z0-9]/gi, '_') || 'activity';
  const filename = `${Date.now()}_${safeName}.json`;
  const filepath = path.join(legacyActivitiesDir, filename);

  const activity = {
    name,
    geometry,
    createdAt: new Date().toISOString()
  };

  fs.writeFileSync(filepath, JSON.stringify(activity, null, 2), 'utf8');
  currentActivity = activity;

  io.emit('activity-loaded', activity);

  res.json({ success: true, filename });
});

app.get('/api/activity/load/:filename', (req, res) => {
  const safeFilename = sanitizeLegacyFilename(req.params.filename);

  if (!safeFilename) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const filepath = path.join(legacyActivitiesDir, safeFilename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Activity not found' });
  }

  const activity = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  currentActivity = activity;

  return res.json(activity);
});

app.get('/api/activity/list', (req, res) => {
  const files = fs
    .readdirSync(legacyActivitiesDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const filePath = path.join(legacyActivitiesDir, file);

      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        return {
          filename: file,
          name: parsed.name || file,
          createdAt: parsed.createdAt || null
        };
      } catch (error) {
        return {
          filename: file,
          name: file,
          createdAt: null
        };
      }
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  res.json(files);
});

app.get('/api/activity/current', (req, res) => {
  if (currentActivity) {
    return res.json(currentActivity);
  }

  return res.json({ geometry: [] });
});

io.on('connection', (socket) => {
  console.log('[geometry] socket connected:', socket.id);
  recordCommunication({
    app: 'socket',
    direction: 'in',
    event: 'socket:connect',
    from: socket.id,
    to: 'server',
    payload: {
      transport: socket && socket.conn ? socket.conn.transport.name : 'unknown'
    }
  });

  geometryConnectionMeta.set(socket.id, {
    connectedAt: Date.now(),
    lastSeenAt: Date.now(),
    ...getSocketClientInfo(socket)
  });

  if (currentActivity) {
    recordCommunication({
      app: 'geometry',
      direction: 'out',
      event: 'activity-loaded',
      from: 'server',
      to: socket.id,
      payload: {
        shapeCount: Array.isArray(currentActivity.geometry) ? currentActivity.geometry.length : 0
      }
    });
    socket.emit('activity-loaded', currentActivity);
  }

  socket.emit('users-update', buildUserList());

  socket.on('user-position', (data) => {
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'geometry',
      direction: 'in',
      event: 'user-position',
      from: socket.id,
      to: 'server',
      payload: {
        role: data && data.role,
        x: data && data.x,
        y: data && data.y,
        name: data && data.name
      }
    });

    const existing = activeUsers.get(socket.id) || {};

    const userInfo = {
      ...existing,
      id: socket.id,
      name: data && data.name ? data.name : existing.name,
      color: data && data.color ? data.color : existing.color,
      shape: data && data.shape ? data.shape : existing.shape,
      role: data && data.role ? data.role : existing.role,
      x: data && typeof data.x === 'number' ? data.x : existing.x,
      y: data && typeof data.y === 'number' ? data.y : existing.y
    };

    activeUsers.set(socket.id, userInfo);
    emitUsersUpdate();
  });

  socket.on('camera-frame', async (data) => {
    if (!data || !data.image) {
      return;
    }

    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'geometry',
      direction: 'in',
      event: 'camera-frame',
      from: socket.id,
      to: 'server',
      payload: {
        name: data && data.name,
        hasImage: Boolean(data && data.image),
        imageLength: data && data.image ? String(data.image).length : 0
      }
    });

    const detection = await detectPointsFromPython(data.image);
    const points = Array.isArray(detection.points) ? detection.points : [];
    const boxes = Array.isArray(detection.boxes) ? detection.boxes : [];
    const tracking = typeof detection.tracking === 'string' ? detection.tracking : 'unknown';
    const existing = activeUsers.get(socket.id) || {};

    activeUsers.set(socket.id, {
      ...existing,
      id: socket.id,
      role: 'camera',
      name: data.name || existing.name,
      color: data.color || existing.color,
      shape: data.shape || existing.shape,
      points,
      boxes,
      cameraTracking: tracking
    });

    recordCommunication({
      app: 'geometry',
      direction: 'out',
      event: 'camera-points',
      from: 'server',
      to: socket.id,
      payload: {
        count: Array.isArray(points) ? points.length : 0,
        boxes: Array.isArray(boxes) ? boxes.length : 0,
        tracking
      }
    });
    socket.emit('camera-points', {
      points,
      boxes,
      tracking
    });
    emitUsersUpdate();
  });

  socket.on('camera-speed-frame', async (data) => {
    if (!data || !data.image) {
      return;
    }

    touchGeometryConnection(socket.id);
    const requestId = typeof data.requestId === 'number' || typeof data.requestId === 'string'
      ? data.requestId
      : null;
    const serverReceivedAt = Date.now();

    recordCommunication({
      app: 'geometry',
      direction: 'in',
      event: 'camera-speed-frame',
      from: socket.id,
      to: 'server',
      payload: {
        requestId,
        hasImage: Boolean(data && data.image),
        imageLength: data && data.image ? String(data.image).length : 0
      }
    });

    const detection = await detectCameraFrameFromPython(data.image, {
      includeAnnotatedImage: true
    });
    const points = Array.isArray(detection.points) ? detection.points : [];
    const boxes = Array.isArray(detection.boxes) ? detection.boxes : [];
    const tracking = typeof detection.tracking === 'string' ? detection.tracking : 'unknown';
    const annotatedImage = typeof detection.annotatedImage === 'string' ? detection.annotatedImage : null;
    const serverSentAt = Date.now();

    recordCommunication({
      app: 'geometry',
      direction: 'out',
      event: 'camera-speed-result',
      from: 'server',
      to: socket.id,
      payload: {
        requestId,
        boxes: boxes.length,
        points: points.length,
        tracking,
        serverElapsedMs: serverSentAt - serverReceivedAt
      }
    });

    socket.emit('camera-speed-result', {
      requestId,
      points,
      boxes,
      tracking,
      annotatedImage,
      serverReceivedAt,
      serverSentAt,
      serverElapsedMs: serverSentAt - serverReceivedAt,
      clientSentAt: typeof data.clientSentAt === 'number' ? data.clientSentAt : null
    });
  });

  socket.on('activity-update', (geometry) => {
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'geometry',
      direction: 'in',
      event: 'activity-update',
      from: socket.id,
      to: 'server',
      payload: {
        shapeCount: Array.isArray(geometry) ? geometry.length : 0
      }
    });

    if (!currentActivity) {
      currentActivity = {
        name: 'Live Activity',
        geometry: [],
        createdAt: new Date().toISOString()
      };
    }

    currentActivity = {
      ...currentActivity,
      geometry
    };

    recordCommunication({
      app: 'geometry',
      direction: 'out',
      event: 'activity-loaded',
      from: 'server',
      to: 'broadcast-except-sender',
      payload: {
        shapeCount: Array.isArray(currentActivity.geometry) ? currentActivity.geometry.length : 0
      }
    });
    socket.broadcast.emit('activity-loaded', currentActivity);
  });

  socket.on('fourier:join', (data) => {
    // Explicit classroom handshake.
    // client/teacher -> server: fourier:join
    // server -> caller: fourier:state + fourier:slide
    // server -> room: participants/summary/sound-state refresh
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'fourier',
      direction: 'in',
      event: 'fourier:join',
      from: socket.id,
      to: 'server',
      payload: data
    });

    const participant = registerFourierParticipant(
      socket,
      data && data.role,
      data && data.name,
      data && data.team
    );

    logFourier('recv fourier:join', {
      socketId: socket.id,
      role: participant.role,
      name: participant.name,
      team: participant.team
    });

    recordCommunication({
      app: 'fourier',
      direction: 'out',
      event: 'fourier:state',
      from: 'server',
      to: socket.id,
      payload: {
        role: participant.role,
        name: participant.name,
        team: participant.team
      }
    });
    socket.emit('fourier:state', {
      role: participant.role,
      name: participant.name,
      team: participant.team,
      activeSlideId: fourierState.activeSlideId,
      activeSlideIndex: fourierState.activeSlideIndex,
      participants: buildFourierParticipantPayload(),
      soundStates: buildFourierSoundPayload(),
      heatStates: buildFourierHeatPayload(),
      heatTime: buildFourierHeatTimePayload(),
      fftDuel: buildFourierFftDuelPayload(socket.id, participant.role),
      oceanRandom: buildFourierOceanRandomPayload(),
      waveSum: buildFourierWaveSumPayload(),
      summary: buildFourierSummary(),
      taylorGuess: buildFourierTaylorGuessPayload(socket.id, participant.role),
    });

    recordCommunication({
      app: 'fourier',
      direction: 'out',
      event: 'fourier:slide',
      from: 'server',
      to: socket.id,
      payload: {
        activeSlideId: fourierState.activeSlideId,
        activeSlideIndex: fourierState.activeSlideIndex
      }
    });
    socket.emit('fourier:slide', {
      activeSlideId: fourierState.activeSlideId,
      activeSlideIndex: fourierState.activeSlideIndex,
      updatedAt: fourierState.updatedAt
    });

    emitFourierParticipants();
    emitFourierSummary();
    emitFourierSoundState();
    emitFourierHeatState();
    emitFourierHeatTimeState();
    emitFourierFftDuelState();
    emitFourierOceanRandomState();
    emitFourierWaveSumState();
  });

  socket.on('fourier:request-state', () => {
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'fourier',
      direction: 'in',
      event: 'fourier:request-state',
      from: socket.id,
      to: 'server'
    });

    const participant = fourierParticipants.get(socket.id);

    if (!participant) {
      return;
    }

    recordCommunication({
      app: 'fourier',
      direction: 'out',
      event: 'fourier:state',
      from: 'server',
      to: socket.id,
      payload: {
        role: participant.role,
        name: participant.name,
        team: participant.team
      }
    });
    socket.emit('fourier:state', {
      role: participant.role,
      name: participant.name,
      team: participant.team,
      activeSlideId: fourierState.activeSlideId,
      activeSlideIndex: fourierState.activeSlideIndex,
      participants: buildFourierParticipantPayload(),
      soundStates: buildFourierSoundPayload(),
      heatStates: buildFourierHeatPayload(),
      heatTime: buildFourierHeatTimePayload(),
      fftDuel: buildFourierFftDuelPayload(socket.id, participant.role),
      oceanRandom: buildFourierOceanRandomPayload(),
      waveSum: buildFourierWaveSumPayload(),
      summary: buildFourierSummary()
    });
  });

  socket.on('fourier:set-slide', (payload) => {
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'fourier',
      direction: 'in',
      event: 'fourier:set-slide',
      from: socket.id,
      to: 'server',
      payload
    });

    const participant = fourierParticipants.get(socket.id);

    if (!participant || participant.role !== 'teacher') {
      return;
    }

    const slideId = coerceFourierString(payload && payload.slideId, 80);
    const parsedIndex = Number.parseInt(payload && payload.slideIndex, 10);
    const slideIndex = Number.isInteger(parsedIndex) ? Math.max(0, parsedIndex) : 0;

    if (slideId) {
      fourierState.activeSlideId = slideId;
    }

    fourierState.activeSlideIndex = slideIndex;
    fourierState.updatedAt = Date.now();

    recordCommunication({
      app: 'fourier',
      direction: 'out',
      event: 'fourier:slide',
      from: 'server',
      to: FOURIER_ROOM,
      payload: {
        activeSlideId: fourierState.activeSlideId,
        activeSlideIndex: fourierState.activeSlideIndex
      }
    });
    io.to(FOURIER_ROOM).emit('fourier:slide', {
      activeSlideId: fourierState.activeSlideId,
      activeSlideIndex: fourierState.activeSlideIndex,
      updatedAt: fourierState.updatedAt
    });

    emitFourierSummary();
  });

  socket.on('fourier:interaction', (payload) => {
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'fourier',
      direction: 'in',
      event: 'fourier:interaction',
      from: socket.id,
      to: 'server',
      payload
    });

    const participant = fourierParticipants.get(socket.id);

    if (!participant || participant.role !== 'client') {
      return;
    }

    const slideId = coerceFourierString(payload && payload.slideId, 80);
    const activityId = coerceFourierString(payload && payload.activityId, 80);
    const controlId = coerceFourierString(payload && payload.controlId, 80);
    const kind = coerceFourierString(payload && payload.kind, 24) || 'input';
    const value = coerceFourierValue(payload && payload.value);

    const entry = {
      ts: Date.now(),
      name: participant.name,
      slideId,
      activityId,
      controlId,
      kind,
      value
    };

    participant.interactions += 1;
    participant.lastActionAt = entry.ts;
    participant.lastSlideId = slideId || participant.lastSlideId;
    fourierParticipants.set(socket.id, participant);

    incrementCounter(fourierBySlideCount, slideId || 'unknown-slide');
    incrementCounter(fourierByActivityCount, activityId || 'general');
    pushFourierFeed(entry);

    recordCommunication({
      app: 'fourier',
      direction: 'out',
      event: 'fourier:activity-event',
      from: 'server',
      to: FOURIER_ROOM,
      payload: {
        name: entry.name,
        slideId: entry.slideId,
        activityId: entry.activityId,
        controlId: entry.controlId,
        kind: entry.kind
      }
    });
    io.to(FOURIER_ROOM).emit('fourier:activity-event', entry);
    emitFourierSummary();
  });

  socket.on('fourier:sound-control', (payload) => {
    // Live slider updates from students.
    // Robustness: if explicit join has not completed, we recover by creating
    // a client participant from this payload (implicit join fallback).
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'fourier',
      direction: 'in',
      event: 'fourier:sound-control',
      from: socket.id,
      to: 'server',
      payload
    });

    let participant = fourierParticipants.get(socket.id);
    let createdFromSoundControl = false;

    if (!participant) {
      participant = registerFourierParticipant(
        socket,
        'client',
        payload && payload.name,
        payload && payload.team
      );
      createdFromSoundControl = true;

      logFourier('implicit join from fourier:sound-control', {
        socketId: socket.id,
        role: participant.role,
        name: participant.name,
        team: participant.team
      });
    }

    if (!participant || participant.role !== 'client') {
      return;
    }

    const sound = normalizeFourierSoundPayload(payload);

    fourierSoundState.set(socket.id, {
      frequency: sound.frequency,
      amplitude: sound.amplitude,
      updatedAt: Date.now()
    });

    participant.lastActionAt = Date.now();
    fourierParticipants.set(socket.id, participant);

    if (createdFromSoundControl) {
      // Send the missing initial snapshot to the caller so the client can
      // mark itself as joined and continue sending without waiting manually.
      recordCommunication({
        app: 'fourier',
        direction: 'out',
        event: 'fourier:state',
        from: 'server',
        to: socket.id,
        payload: {
          role: participant.role,
          name: participant.name,
          team: participant.team,
          reason: 'implicit-join-recovery'
        }
      });
      socket.emit('fourier:state', {
        role: participant.role,
        name: participant.name,
        team: participant.team,
        activeSlideId: fourierState.activeSlideId,
        activeSlideIndex: fourierState.activeSlideIndex,
        participants: buildFourierParticipantPayload(),
        soundStates: buildFourierSoundPayload(),
        heatStates: buildFourierHeatPayload(),
        heatTime: buildFourierHeatTimePayload(),
        fftDuel: buildFourierFftDuelPayload(socket.id, participant.role),
        oceanRandom: buildFourierOceanRandomPayload(),
        summary: buildFourierSummary()
      });

      emitFourierParticipants();
      emitFourierSummary();
    }

    logFourier('recv fourier:sound-control', {
      socketId: socket.id,
      frequency: sound.frequency,
      amplitude: sound.amplitude
    });

    emitFourierSoundState();
    emitFourierFftDuelState();
  });

  socket.on('fourier:heat-control', (payload) => {
    // Heat choice updates from students/teacher.
    // Robustness: if explicit join has not completed, recover by creating
    // a participant from this payload (implicit join fallback).
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'fourier',
      direction: 'in',
      event: 'fourier:heat-control',
      from: socket.id,
      to: 'server',
      payload
    });

    let participant = fourierParticipants.get(socket.id);
    let createdFromHeatControl = false;

    if (!participant) {
      participant = registerFourierParticipant(
        socket,
        payload && payload.role,
        payload && payload.name,
        payload && payload.team
      );
      createdFromHeatControl = true;

      logFourier('implicit join from fourier:heat-control', {
        socketId: socket.id,
        role: participant.role,
        name: participant.name,
        team: participant.team
      });
    }

    if (!participant) {
      return;
    }

    const heat = normalizeFourierHeatPayload(payload);

    fourierHeatState.set(socket.id, {
      position: heat.position,
      temperature: heat.temperature,
      updatedAt: Date.now()
    });

    participant.lastActionAt = Date.now();
    fourierParticipants.set(socket.id, participant);

    if (createdFromHeatControl) {
      recordCommunication({
        app: 'fourier',
        direction: 'out',
        event: 'fourier:state',
        from: 'server',
        to: socket.id,
        payload: {
          role: participant.role,
          name: participant.name,
          team: participant.team,
          reason: 'implicit-join-recovery'
        }
      });
      socket.emit('fourier:state', {
        role: participant.role,
        name: participant.name,
        team: participant.team,
        activeSlideId: fourierState.activeSlideId,
        activeSlideIndex: fourierState.activeSlideIndex,
        participants: buildFourierParticipantPayload(),
        soundStates: buildFourierSoundPayload(),
        heatStates: buildFourierHeatPayload(),
        heatTime: buildFourierHeatTimePayload(),
        fftDuel: buildFourierFftDuelPayload(socket.id, participant.role),
        oceanRandom: buildFourierOceanRandomPayload(),
        summary: buildFourierSummary()
      });

      emitFourierParticipants();
      emitFourierSummary();
      emitFourierSoundState();
    }

    logFourier('recv fourier:heat-control', {
      socketId: socket.id,
      position: heat.position,
      temperature: heat.temperature
    });

    emitFourierHeatState();
    emitFourierFftDuelState();
  });

  socket.on('fourier:heat-time-control', (payload) => {
    // Teacher-only time authority for section 3.5 heat rod.
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'fourier',
      direction: 'in',
      event: 'fourier:heat-time-control',
      from: socket.id,
      to: 'server',
      payload
    });

    const participant = fourierParticipants.get(socket.id);
    if (!participant || participant.role !== 'teacher') {
      return;
    }

    const heatTimeValue = normalizeFourierHeatTimePayload(payload);
    fourierHeatTimeState.value = heatTimeValue;
    fourierHeatTimeState.updatedAt = Date.now();
    fourierHeatTimeState.sourceSocketId = socket.id;

    logFourier('recv fourier:heat-time-control', {
      socketId: socket.id,
      value: heatTimeValue
    });

    emitFourierHeatTimeState();
  });

  socket.on('fourier:fft-duel-start', (payload) => {
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'fourier',
      direction: 'in',
      event: 'fourier:fft-duel-start',
      from: socket.id,
      to: 'server',
      payload
    });

    const participant = fourierParticipants.get(socket.id);
    if (!participant || participant.role !== 'teacher') {
      return;
    }

    startFourierFftDuelRound();
    emitFourierFftDuelState();
    emitFourierSummary();
  });

  socket.on('fourier:fft-duel-probe', (payload) => {
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'fourier',
      direction: 'in',
      event: 'fourier:fft-duel-probe',
      from: socket.id,
      to: 'server',
      payload
    });

    const participant = fourierParticipants.get(socket.id);
    if (!participant || participant.role !== 'client') {
      return;
    }

    if (fourierFftDuelState.status !== 'running') {
      return;
    }

    const assignment = ensureFourierFftDuelAssignment(socket.id);
    if (!assignment || assignment.locked) {
      return;
    }

    assignment.probeFreq = Number(clampFourierNumber(payload && payload.probeFreq, 0, 8, assignment.probeFreq).toFixed(1));
    assignment.updatedAt = Date.now();
    fourierFftDuelState.assignments.set(socket.id, assignment);
    fourierFftDuelState.updatedAt = assignment.updatedAt;

    participant.lastActionAt = assignment.updatedAt;
    fourierParticipants.set(socket.id, participant);

    emitFourierFftDuelState();
  });

  socket.on('fourier:fft-duel-submit', (payload) => {
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'fourier',
      direction: 'in',
      event: 'fourier:fft-duel-submit',
      from: socket.id,
      to: 'server',
      payload
    });

    const participant = fourierParticipants.get(socket.id);
    if (!participant || participant.role !== 'client') {
      return;
    }

    if (fourierFftDuelState.status !== 'running') {
      return;
    }

    const assignment = ensureFourierFftDuelAssignment(socket.id);
    if (!assignment || assignment.locked) {
      return;
    }

    const guessFreq = Number(clampFourierNumber(payload && payload.guessFreq, 0, 8, assignment.probeFreq).toFixed(1));
    const error = Number(Math.abs(guessFreq - assignment.targetFreq).toFixed(2));
    const now = Date.now();

    assignment.probeFreq = guessFreq;
    assignment.guessFreq = guessFreq;
    assignment.error = error;
    assignment.submitted = true;
    assignment.locked = true;
    assignment.submittedAt = now;
    assignment.updatedAt = now;

    fourierFftDuelState.assignments.set(socket.id, assignment);
    fourierFftDuelState.updatedAt = now;

    participant.interactions += 1;
    participant.lastActionAt = now;
    fourierParticipants.set(socket.id, participant);

    emitFourierParticipants();
    emitFourierSummary();
    emitFourierFftDuelState();
  });

  socket.on('fourier:fft-duel-reveal', (payload) => {
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'fourier',
      direction: 'in',
      event: 'fourier:fft-duel-reveal',
      from: socket.id,
      to: 'server',
      payload
    });

    const participant = fourierParticipants.get(socket.id);
    if (!participant || participant.role !== 'teacher') {
      return;
    }

    if (fourierFftDuelState.status !== 'running') {
      return;
    }

    fourierFftDuelState.revealResults = true;
    fourierFftDuelState.updatedAt = Date.now();
    emitFourierFftDuelState();
  });

  socket.on('fourier:ocean-random-pack', (payload) => {
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'fourier',
      direction: 'in',
      event: 'fourier:ocean-random-pack',
      from: socket.id,
      to: 'server',
      payload
    });

    const participant = fourierParticipants.get(socket.id);
    if (!participant || participant.role !== 'client') {
      return;
    }

    const items = normalizeFourierOceanRandomItems(payload && payload.items);
    if (!items.length) {
      return;
    }

    const now = Date.now();
    fourierOceanRandomState.packs.set(socket.id, {
      items,
      updatedAt: now
    });
    fourierOceanRandomState.updatedAt = now;

    participant.lastActionAt = now;
    fourierParticipants.set(socket.id, participant);

    emitFourierOceanRandomState();
    emitFourierSummary();
  });

  socket.on('fourier:ocean-random-clear', () => {
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'fourier',
      direction: 'in',
      event: 'fourier:ocean-random-clear',
      from: socket.id,
      to: 'server'
    });

    const participant = fourierParticipants.get(socket.id);
    if (!participant || participant.role !== 'teacher') {
      return;
    }

    fourierOceanRandomState.packs.clear();
    fourierOceanRandomState.updatedAt = Date.now();

    emitFourierOceanRandomState();
    emitFourierSummary();
  });

  socket.on('fourier:wave-sum-update', (payload) => {
    touchGeometryConnection(socket.id);
    recordCommunication({
      app: 'fourier',
      direction: 'in',
      event: 'fourier:wave-sum-update',
      from: socket.id,
      to: 'server',
      payload
    });

    const participant = fourierParticipants.get(socket.id);
    if (!participant || participant.role !== 'client') {
      return;
    }

    const freq = Number(clampFourierNumber((payload && payload.freq), 0.4, 6, 1.2).toFixed(2));
    const phi = Number(clampFourierNumber((payload && payload.phi), -3.14, 3.14, 0).toFixed(2));
    const now = Date.now();

    fourierWaveSumState.set(socket.id, { freq, phi, updatedAt: now });

      socket.on('fourier:taylor-guess-start', (payload) => {
        touchGeometryConnection(socket.id);
        const participant = fourierParticipants.get(socket.id);
        if (!participant || participant.role !== 'teacher') return;
        startFourierTaylorGuessRound();
        emitFourierTaylorGuessState();
        emitFourierSummary();
      });

      socket.on('fourier:taylor-guess-live', (payload) => {
        touchGeometryConnection(socket.id);
        const participant = fourierParticipants.get(socket.id);
        if (!participant || participant.role !== 'client') return;
        const c0 = Number(clampFourierNumber(payload && payload.c0, -4, 4, 0).toFixed(2));
        const c1 = Number(clampFourierNumber(payload && payload.c1, -4, 4, 0).toFixed(2));
        const c2 = Number(clampFourierNumber(payload && payload.c2, -4, 4, 0).toFixed(2));
        const c3 = Number(clampFourierNumber(payload && payload.c3, -4, 4, 0).toFixed(2));
        fourierTaylorGuessLiveCoeffs.set(socket.id, { c0, c1, c2, c3 });
        // Emit state update only to teacher sockets
        fourierParticipants.forEach((p, sid) => {
          if (p && p.role === 'teacher') {
            const pl = buildFourierTaylorGuessPayload(sid, 'teacher');
            io.to(sid).emit('fourier:taylor-guess-state', pl);
          }
        });
      });

      socket.on('fourier:taylor-guess-submit', (payload) => {
        touchGeometryConnection(socket.id);
        const participant = fourierParticipants.get(socket.id);
        if (!participant || participant.role !== 'client') return;
        if (fourierTaylorGuessState.status !== 'running') return;
        if (fourierTaylorGuessState.submissions.has(socket.id)) return;

        const c0 = Number(clampFourierNumber(payload && payload.c0, -4, 4, 0).toFixed(2));
        const c1 = Number(clampFourierNumber(payload && payload.c1, -4, 4, 0).toFixed(2));
        const c2 = Number(clampFourierNumber(payload && payload.c2, -4, 4, 0).toFixed(2));
        const c3 = Number(clampFourierNumber(payload && payload.c3, -4, 4, 0).toFixed(2));

        // RMSE against e^(2x) at 21 sample points on [-1.5, 1.5]
        let mse = 0;
        for (let i = 0; i <= 20; i++) {
          const x = -1.5 + (i / 20) * 3.0;
          const diff = Math.exp(2 * x) - (c0 + c1 * x + c2 * x * x + c3 * x * x * x);
          mse += diff * diff;
        }
        const error = Number(Math.sqrt(mse / 21).toFixed(3));
        const now = Date.now();

        fourierTaylorGuessState.submissions.set(socket.id, { c0, c1, c2, c3, error, submittedAt: now });
        fourierTaylorGuessState.updatedAt = now;
        participant.interactions += 1;
        participant.lastActionAt = now;
        fourierParticipants.set(socket.id, participant);

        emitFourierParticipants();
        emitFourierTaylorGuessState();
        emitFourierSummary();
      });

      socket.on('fourier:taylor-guess-reveal', (payload) => {
        touchGeometryConnection(socket.id);
        const participant = fourierParticipants.get(socket.id);
        if (!participant || participant.role !== 'teacher') return;
        if (fourierTaylorGuessState.status !== 'running') return;
        fourierTaylorGuessState.revealResults = true;
        fourierTaylorGuessState.updatedAt = Date.now();
        emitFourierTaylorGuessState();
      });
    participant.lastActionAt = now;
    fourierParticipants.set(socket.id, participant);

    emitFourierWaveSumState();
  });

  socket.on('disconnect', () => {
    console.log('[geometry] socket disconnected:', socket.id);
    recordCommunication({
      app: 'socket',
      direction: 'in',
      event: 'socket:disconnect',
      from: socket.id,
      to: 'server'
    });
    activeUsers.delete(socket.id);
    geometryConnectionMeta.delete(socket.id);

    const removedParticipant = fourierParticipants.delete(socket.id);
    const removedSoundState = fourierSoundState.delete(socket.id);
    const removedHeatState = fourierHeatState.delete(socket.id);
    const removedOceanRandomPack = fourierOceanRandomState.packs.delete(socket.id);
    const removedFftDuelState = fourierFftDuelState.assignments.delete(socket.id);
    const removedWaveSumEntry = fourierWaveSumState.delete(socket.id);

    if (fourierFftDuelState.assignments.size === 0) {
      fourierFftDuelState.status = 'idle';
      fourierFftDuelState.roundId = '';
      fourierFftDuelState.startedAt = 0;
      fourierFftDuelState.revealResults = false;
      fourierFftDuelState.updatedAt = Date.now();
    }

    if (removedParticipant) {
      emitFourierParticipants();
      emitFourierSummary();
    }

    if (removedSoundState || removedParticipant) {
      emitFourierSoundState();
    }

    if (removedHeatState || removedParticipant) {
      emitFourierHeatState();
    }

    if (removedFftDuelState || removedParticipant) {
      emitFourierFftDuelState();
    }

    if (removedOceanRandomPack || removedParticipant) {
      fourierOceanRandomState.updatedAt = Date.now();
      emitFourierOceanRandomState();
      emitFourierSummary();
    }

    if (removedWaveSumEntry || removedParticipant) {
      emitFourierWaveSumState();
    }

    emitUsersUpdate();
  });
});

// Buffon app websocket server over the same Node.js process
const buffonWss = new WebSocketServer({ noServer: true });
const buffonStudents = new Map();
const buffonTeachers = new Set();

function buffonBroadcastTeachers(data) {
  const message = JSON.stringify(data);

  recordCommunication({
    app: 'buffon',
    direction: 'out',
    event: data && data.type ? `buffon:${data.type}` : 'buffon:broadcast-teachers',
    from: 'server',
    to: 'buffon:teachers',
    payload: data
  });

  buffonTeachers.forEach((teacherWs) => {
    if (teacherWs.readyState === 1) {
      teacherWs.send(message);
    }
  });
}

function buffonBroadcastStudents(data) {
  const message = JSON.stringify(data);

  recordCommunication({
    app: 'buffon',
    direction: 'out',
    event: data && data.type ? `buffon:${data.type}` : 'buffon:broadcast-students',
    from: 'server',
    to: 'buffon:students',
    payload: data
  });

  buffonStudents.forEach((_, studentWs) => {
    if (studentWs.readyState === 1) {
      studentWs.send(message);
    }
  });
}

function sendBuffonRoster(target) {
  const list = [...buffonStudents.values()];
  const message = JSON.stringify({ type: 'roster', students: list });

  recordCommunication({
    app: 'buffon',
    direction: 'out',
    event: 'buffon:roster',
    from: 'server',
    to: target ? 'buffon:single-teacher' : 'buffon:teachers',
    payload: {
      students: list.length
    }
  });

  if (target) {
    if (target.readyState === 1) {
      target.send(message);
    }
    return;
  }

  buffonTeachers.forEach((teacherWs) => {
    if (teacherWs.readyState === 1) {
      teacherWs.send(message);
    }
  });
}

buffonWss.on('connection', (ws, request) => {
  const connectionInfo = getUpgradeClientInfo(request);

  recordCommunication({
    app: 'buffon',
    direction: 'in',
    event: 'buffon:ws-connect',
    from: connectionInfo.ip || 'unknown',
    to: 'server',
    payload: {
      userAgent: connectionInfo.userAgent || 'unknown'
    }
  });

  buffonConnectionMeta.set(ws, {
    connectedAt: Date.now(),
    lastSeenAt: Date.now(),
    ip: connectionInfo.ip,
    userAgent: connectionInfo.userAgent,
    role: 'unknown',
    name: 'Buffon participant'
  });

  ws.on('message', (raw) => {
    touchBuffonConnection(ws);

    let message;

    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }

    const meta = buffonConnectionMeta.get(ws) || {};
    recordCommunication({
      app: 'buffon',
      direction: 'in',
      event: message && message.type ? `buffon:${message.type}` : 'buffon:message',
      from: meta.name || meta.ip || 'buffon-client',
      to: 'server',
      payload: message
    });

    if (message.type === 'register_teacher') {
      buffonTeachers.add(ws);
      touchBuffonConnection(ws, {
        role: 'teacher',
        name: coerceFourierString(message.name, 40) || 'Buffon teacher'
      });
      sendBuffonRoster(ws);
      return;
    }

    if (message.type === 'register_student') {
      const team = coerceFourierString(message.team, 40) || 'Buffon student';

      buffonStudents.set(ws, {
        team,
        drops: 0,
        hits: 0,
        piEst: null
      });

      touchBuffonConnection(ws, {
        role: 'client',
        name: team
      });

      sendBuffonRoster();
      return;
    }

    if (message.type === 'update') {
      if (buffonStudents.has(ws)) {
        const state = buffonStudents.get(ws);

        buffonStudents.set(ws, {
          team: state.team,
          drops: message.drops,
          hits: message.hits,
          piEst: message.piEst
        });

        touchBuffonConnection(ws, {
          role: 'client',
          name: state.team
        });

        sendBuffonRoster();
      }
      return;
    }

    if (message.type === 'start_round') {
      if (!buffonTeachers.has(ws)) {
        return;
      }

      const parsedTime = Number.parseInt(message.timeSec, 10);
      const timeSec = Number.isInteger(parsedTime)
        ? Math.max(20, Math.min(120, parsedTime))
        : 60;

      const parsedTarget = Number.parseFloat(message.targetError);
      const targetError = Number.isFinite(parsedTarget)
        ? Math.max(0.001, Math.min(0.01, parsedTarget))
        : 0.005;

      const round = Number.parseInt(message.round, 10) || 1;
      const endAt = Date.now() + timeSec * 1000;

      buffonStudents.forEach((state, studentWs) => {
        buffonStudents.set(studentWs, {
          team: state.team,
          drops: 0,
          hits: 0,
          piEst: null
        });
      });

      sendBuffonRoster();

      buffonBroadcastStudents({
        type: 'round_start',
        round,
        timeSec,
        targetError,
        endAt,
        defaults: {
          needleL: 50,
          lineD: 60,
          stepN: 1,
          auto: false
        }
      });

      return;
    }

    if (message.type === 'end_round') {
      if (!buffonTeachers.has(ws)) {
        return;
      }

      const round = Number.parseInt(message.round, 10) || 1;
      const rawReason = typeof message.reason === 'string' ? message.reason : '';
      const reason = rawReason === 'target_reached' || rawReason === 'manual_stop' || rawReason === 'time_up'
        ? rawReason
        : 'time_up';
      const winnerTeam = typeof message.winnerTeam === 'string' ? message.winnerTeam : '';

      const rankings = Array.isArray(message.rankings)
        ? message.rankings.slice(0, 100).map((entry, index) => {
            const rank = Number.parseInt(entry && entry.rank, 10);
            const points = Number.parseInt(entry && entry.points, 10);
            const parsedError = Number.parseFloat(entry && entry.error);

            return {
              rank: Number.isInteger(rank) && rank > 0 ? rank : index + 1,
              team: typeof (entry && entry.team) === 'string' ? entry.team : '',
              points: Number.isInteger(points) ? points : 0,
              error: Number.isFinite(parsedError) ? parsedError : null
            };
          })
        : [];

      const parsedTarget = Number.parseFloat(message.targetError);
      const targetError = Number.isFinite(parsedTarget)
        ? Math.max(0.001, Math.min(0.01, parsedTarget))
        : null;

      buffonBroadcastStudents({
        type: 'round_end',
        round,
        reason,
        winnerTeam,
        targetError,
        rankings
      });

      return;
    }

    if (message.type === 'reset_tournament') {
      if (!buffonTeachers.has(ws)) {
        return;
      }

      buffonStudents.forEach((state, studentWs) => {
        buffonStudents.set(studentWs, {
          team: state.team,
          drops: 0,
          hits: 0,
          piEst: null
        });
      });

      sendBuffonRoster();

      buffonBroadcastStudents({
        type: 'reset_tournament',
        defaults: {
          needleL: 50,
          lineD: 60,
          stepN: 1,
          auto: false
        }
      });
    }
  });

  ws.on('close', () => {
    const meta = buffonConnectionMeta.get(ws) || {};
    recordCommunication({
      app: 'buffon',
      direction: 'in',
      event: 'buffon:ws-close',
      from: meta.name || meta.ip || 'buffon-client',
      to: 'server'
    });

    buffonStudents.delete(ws);
    buffonTeachers.delete(ws);
    buffonConnectionMeta.delete(ws);
    sendBuffonRoster();
  });
});

// Neural-lab websocket channel for neural-network classroom activity
const canvasNodeWss = new WebSocketServer({ noServer: true });
const canvasNodeTeachers = new Set();
const canvasNodeStudents = new Map();

const CANVAS_NODE_INPUTS = {
  wheels: { key: 'wheels', type: 'number', min: 0, max: 6, fallback: 4 },
  hasEngine: { key: 'hasEngine', type: 'boolean', fallback: true },
  seats: { key: 'seats', type: 'number', min: 1, max: 8, fallback: 4 },
  hasPedals: { key: 'hasPedals', type: 'boolean', fallback: false }
};
const CANVAS_NODE_INPUT_KEYS = Object.keys(CANVAS_NODE_INPUTS);
const CANVAS_NODE_OUTPUT_KEYS = ['car', 'bicycle', 'motorcycle', 'scooter'];

const canvasNodeModel = {
  inputs: {
    wheels: { enabled: true, value: 4 },
    hasEngine: { enabled: true, value: true },
    seats: { enabled: true, value: 4 },
    hasPedals: { enabled: true, value: false }
  },
  weights: {
    wheels: 1,
    hasEngine: 1,
    seats: 1,
    hasPedals: 1
  },
  outputsEnabled: {
    car: true,
    bicycle: false,
    motorcycle: false,
    scooter: false
  }
};

function clampCanvasNodeNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
}

function buildCanvasNodeParticipants() {
  const students = [...canvasNodeStudents.values()]
    .sort((a, b) => (a.connectedAt - b.connectedAt) || a.name.localeCompare(b.name))
    .map((student) => ({
      id: student.id,
      role: 'client',
      name: student.name,
      assignedInput: student.assignedInput,
      weight: student.assignedInput ? Number(canvasNodeModel.weights[student.assignedInput] || 0) : 0
    }));

  return students;
}

function canvasNodeBroadcastTeachers(data) {
  const message = JSON.stringify(data);

  recordCommunication({
    app: 'neural-lab',
    direction: 'out',
    event: 'neural-lab:canvas_state',
    from: 'server',
    to: 'neural-lab:teachers',
    payload: {
      participants: Array.isArray(data && data.participants) ? data.participants.length : 0
    }
  });

  canvasNodeTeachers.forEach((teacherWs) => {
    if (teacherWs.readyState === 1) {
      teacherWs.send(message);
    }
  });
}

function canvasNodeSendStudentState(studentWs) {
  const student = canvasNodeStudents.get(studentWs);
  if (!student || studentWs.readyState !== 1) {
    return;
  }

  const payload = {
    type: 'canvas_state',
    me: {
      id: student.id,
      name: student.name,
      assignedInput: student.assignedInput,
      weight: student.assignedInput ? Number(canvasNodeModel.weights[student.assignedInput] || 0) : 0
    }
  };

  studentWs.send(JSON.stringify(payload));
}

function canvasNodeBroadcastState() {
  const model = {
    inputs: {
      wheels: { ...canvasNodeModel.inputs.wheels },
      hasEngine: { ...canvasNodeModel.inputs.hasEngine },
      seats: { ...canvasNodeModel.inputs.seats },
      hasPedals: { ...canvasNodeModel.inputs.hasPedals }
    },
    weights: { ...canvasNodeModel.weights },
    outputsEnabled: { ...canvasNodeModel.outputsEnabled }
  };

  const participants = buildCanvasNodeParticipants();

  canvasNodeBroadcastTeachers({
    type: 'canvas_state',
    model,
    participants
  });

  canvasNodeStudents.forEach((_, studentWs) => {
    canvasNodeSendStudentState(studentWs);
  });
}

function canvasNodeReassignStudents() {
  const sorted = [...canvasNodeStudents.values()].sort((a, b) => (a.connectedAt - b.connectedAt) || a.name.localeCompare(b.name));
  let changed = false;

  sorted.forEach((student, index) => {
    const nextAssigned = CANVAS_NODE_INPUT_KEYS[index] || null;
    if (student.assignedInput !== nextAssigned) {
      student.assignedInput = nextAssigned;
      changed = true;
    }
  });

  return changed;
}

canvasNodeWss.on('connection', (ws, request) => {
  const connectionInfo = getUpgradeClientInfo(request);

  recordCommunication({
    app: 'neural-lab',
    direction: 'in',
    event: 'neural-lab:ws-connect',
    from: connectionInfo.ip || 'unknown',
    to: 'server',
    payload: {
      userAgent: connectionInfo.userAgent || 'unknown'
    }
  });

  canvasNodeConnectionMeta.set(ws, {
    connectedAt: Date.now(),
    lastSeenAt: Date.now(),
    ip: connectionInfo.ip,
    userAgent: connectionInfo.userAgent,
    role: 'unknown',
    name: 'Canvas participant'
  });

  ws.on('message', (raw) => {
    touchCanvasNodeConnection(ws);

    let message;
    try {
      message = JSON.parse(String(raw));
    } catch {
      return;
    }

    const meta = canvasNodeConnectionMeta.get(ws) || {};
    const messageType = message && message.type ? String(message.type) : 'message';

    recordCommunication({
      app: 'neural-lab',
      direction: 'in',
      event: `neural-lab:${messageType}`,
      from: meta.name || meta.ip || 'canvas-client',
      to: 'server',
      payload: message
    });

    if (message.type === 'register_teacher') {
      const teacherName = coerceFourierString(message.name, 40) || 'Teacher';
      canvasNodeTeachers.add(ws);
      touchCanvasNodeConnection(ws, {
        role: 'teacher',
        name: teacherName
      });
      canvasNodeBroadcastState();
      return;
    }

    if (message.type === 'register_student') {
      const studentName = coerceFourierString(message.name, 40) || `Student-${Math.floor(Math.random() * 900 + 100)}`;
      const existing = canvasNodeStudents.get(ws);

      if (existing) {
        existing.name = studentName;
      } else {
        canvasNodeStudents.set(ws, {
          id: `canvas-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000).toString(16)}`,
          name: studentName,
          connectedAt: Date.now(),
          assignedInput: null
        });
      }

      touchCanvasNodeConnection(ws, {
        role: 'client',
        name: studentName
      });

      canvasNodeReassignStudents();
      canvasNodeBroadcastState();
      return;
    }

    if (message.type === 'student_weight') {
      const student = canvasNodeStudents.get(ws);
      if (!student || !student.assignedInput) {
        return;
      }

      const parsedWeight = clampCanvasNodeNumber(message.value, -2, 2, canvasNodeModel.weights[student.assignedInput] || 0);
      canvasNodeModel.weights[student.assignedInput] = Number(parsedWeight.toFixed(2));
      canvasNodeBroadcastState();
      return;
    }

    if (message.type === 'teacher_config') {
      if (!canvasNodeTeachers.has(ws)) {
        return;
      }

      const patch = message && message.patch && typeof message.patch === 'object' ? message.patch : {};

      if (patch.inputs && typeof patch.inputs === 'object') {
        CANVAS_NODE_INPUT_KEYS.forEach((key) => {
          if (!(key in patch.inputs)) {
            return;
          }

          const next = patch.inputs[key];
          if (!next || typeof next !== 'object') {
            return;
          }

          const inputDef = CANVAS_NODE_INPUTS[key];
          const current = canvasNodeModel.inputs[key];
          const nextEnabled = typeof next.enabled === 'boolean' ? next.enabled : current.enabled;

          let nextValue = current.value;
          if (inputDef.type === 'boolean') {
            if (typeof next.value === 'boolean') {
              nextValue = next.value;
            }
          } else {
            const fallback = Number.isFinite(Number(current.value)) ? Number(current.value) : inputDef.fallback;
            nextValue = clampCanvasNodeNumber(next.value, inputDef.min, inputDef.max, fallback);
            nextValue = Math.round(nextValue);
          }

          canvasNodeModel.inputs[key] = {
            enabled: nextEnabled,
            value: nextValue
          };
        });
      }

      if (patch.outputsEnabled && typeof patch.outputsEnabled === 'object') {
        CANVAS_NODE_OUTPUT_KEYS.forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(patch.outputsEnabled, key)) {
            canvasNodeModel.outputsEnabled[key] = Boolean(patch.outputsEnabled[key]);
          }
        });
      }

      canvasNodeBroadcastState();
      return;
    }

    if (message.type === 'request_state') {
      if (canvasNodeTeachers.has(ws)) {
        canvasNodeBroadcastState();
      } else {
        canvasNodeSendStudentState(ws);
      }
    }
  });

  ws.on('close', () => {
    const meta = canvasNodeConnectionMeta.get(ws) || {};

    recordCommunication({
      app: 'neural-lab',
      direction: 'in',
      event: 'neural-lab:ws-close',
      from: meta.name || meta.ip || 'canvas-client',
      to: 'server'
    });

    canvasNodeTeachers.delete(ws);

    const removedStudent = canvasNodeStudents.delete(ws);
    canvasNodeConnectionMeta.delete(ws);

    if (removedStudent) {
      canvasNodeReassignStudents();
    }

    canvasNodeBroadcastState();
  });
});

httpServer.on('upgrade', (request, socket, head) => {
  if (request.url && request.url.startsWith(REALTIME_WS_PATH)) {
    io.handleUpgrade(request, socket, head);
    return;
  }

  if (request.url && request.url.startsWith('/ws/buffon')) {
    buffonWss.handleUpgrade(request, socket, head, (ws) => {
      buffonWss.emit('connection', ws, request);
    });
    return;
  }

  if (request.url && request.url.startsWith('/ws/neural-lab')) {
    canvasNodeWss.handleUpgrade(request, socket, head, (ws) => {
      canvasNodeWss.emit('connection', ws, request);
    });
    return;
  }

  socket.destroy();
});

httpServer.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;

  console.log(`[server] running at http://${displayHost}:${PORT}`);
  console.log(`[server] entry page: http://${displayHost}:${PORT}/`);
  console.log(`[server] teacher dashboard: http://${displayHost}:${PORT}/teacher`);
  console.log(`[server] student launcher: http://${displayHost}:${PORT}/student`);
  console.log(`[server] student launcher alias: http://${displayHost}:${PORT}/client`);
  console.log(`[server] admin dashboard: http://${displayHost}:${PORT}/admin`);

  if (CAMERA_WORKER_ENABLED) {
    console.log(`[camera-worker] enabled: ${CAMERA_WORKER_SCRIPT}`);
    console.log(`[camera-worker] python: ${CAMERA_WORKER_PYTHON}`);
    startCameraWorker();
  } else {
    console.log('[camera-worker] disabled by CAMERA_WORKER_ENABLED=0');
  }
});

process.on('SIGINT', () => {
  stopCameraWorker();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopCameraWorker();
  process.exit(0);
});

process.on('exit', () => {
  stopCameraWorker();
});
