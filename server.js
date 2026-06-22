// 1. Εισαγωγή βιβλιοθηκών
const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const readline = require('readline');
// WebSocket για real-time
const { WebSocketServer } = require('ws');

// 2. Εισαγωγή routers (δρομολογητές)
const teacherRouter = require('./routes/teacher');
const clientRouter = require('./routes/client');
const createAdminRouter = require('./routes/admin');
const createAppsRouter = require('./routes/apps');
const appDataRouter = require('./routes/appData');

// 3. utilities
const {
  CAMERA_FEATURES_ENABLED,
  CAMERA_WORKER_ENABLED,
  CAMERA_WORKER_SCRIPT,
  CAMERA_WORKER_PYTHON,
  startCameraWorker,
  stopCameraWorker,
  requestCameraDetection
} = require('./utils/cameraWorker');

const initFourier = require('./services/fourier');
const initBuffon = require('./services/buffon');
const initNeural = require('./services/neural');

// 4. Δημιουργία εφαρμογής Express και HTTP server
const app = express();
const httpServer = http.createServer(app);

// 5. Ρυθμίσεις host/port
const HOST = process.env.HOST || '0.0.0.0';
const parsedPort = Number.parseInt(process.env.PORT || '3000', 10);
const PORT = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536
  ? parsedPort
  : 3000;

  // Διαδρομή για τα WebSockets
const REALTIME_WS_PATH = '/ws/realtime';



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

function coerceFourierString(value, maxLen = 80) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLen);
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
  if (!CAMERA_FEATURES_ENABLED) {
    return res.status(404).json({ error: 'Camera features are disabled on this server.' });
  }

  res.sendFile(path.join(publicDir, 'camera-speed-test.html'));
});

app.get('/launcher.html', (req, res) => {
  res.sendFile(path.join(publicDir, 'launcher.html'));
});

app.get('/apps-launcher', (req, res) => {
  res.sendFile(path.join(publicDir, 'apps-launcher.html'));
});

// path για static assets
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
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:student_weight', description: 'Legacy student single-weight update.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:student_weights', description: 'Student updates personal w1/w2 sliders.' },
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

app.use((err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err.code === 'ENOENT') {
    return res.status(404).json({ error: 'Resource not found' });
  }

  const status = Number.isInteger(err.status) ? err.status : 500;
  console.error('[http] request error:', err && err.message ? err.message : err);
  return res.status(status).json({ error: status === 500 ? 'Internal server error' : 'Request failed' });
});


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

  if (CAMERA_FEATURES_ENABLED) {
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
  }

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
    emitFourierTaylorGuessState();
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

    if (activityId === 'taylor-guess' && participant.role === 'client') {
      ensureFourierTaylorGuessRoundRunning();

      const current = fourierTaylorGuessLiveCoeffs.get(socket.id) || { c0: 0, c1: 0, c2: 0, c3: 0 };
      const nextValue = Number(clampFourierNumber(value, -4, 4, 0).toFixed(2));

      if (controlId === 'c0') current.c0 = nextValue;
      else if (controlId === 'c1') current.c1 = nextValue;
      else if (controlId === 'c2') current.c2 = nextValue;
      else if (controlId === 'c3') current.c3 = nextValue;
      else return;

      fourierTaylorGuessLiveCoeffs.set(socket.id, current);
      fourierTaylorGuessState.updatedAt = entry.ts;

      emitFourierTaylorGuessState();
      emitFourierSummary();
      return;
    }

    emitFourierSummary();
  });

  socket.on('fourier:sound-control', (payload) => {
    // Live slider updates from students/teacher.
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
        payload && payload.role === 'teacher' ? 'teacher' : 'client',
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

    if (!participant || (participant.role !== 'client' && participant.role !== 'teacher')) {
      return;
    }

    const sound = normalizeFourierSoundPayload(payload);
    const sourceKey = participant.role === 'teacher'
      ? (sound.sourceKey || 'teacher-main')
      : (sound.sourceKey || 'main');
    const stateKey = buildFourierSoundStateKey(socket.id, sourceKey);

    fourierSoundState.set(stateKey, {
      sourceKey,
      sourceLabel: sound.sourceLabel || sourceKey,
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
      role: participant.role,
      sourceKey,
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
    const amp = Number(clampFourierNumber((payload && payload.amp), 0, 1.8, 0.9).toFixed(2));
    const phi = Number(clampFourierNumber((payload && payload.phi), -3.14, 3.14, 0).toFixed(2));
    const now = Date.now();

    fourierWaveSumState.set(socket.id, { freq, amp, phi, updatedAt: now });

    participant.lastActionAt = now;
    fourierParticipants.set(socket.id, participant);

    emitFourierWaveSumState();
  });

  socket.on('fourier:taylor-guess-live', (payload) => {
    touchGeometryConnection(socket.id);
    let participant = fourierParticipants.get(socket.id);
    let createdFromTaylorLive = false;
    let startedByLive = false;

    if (!participant) {
      participant = registerFourierParticipant(
        socket,
        'client',
        payload && payload.name,
        payload && payload.team
      );
      createdFromTaylorLive = true;
    }

    if (!participant || participant.role !== 'client') return;
    startedByLive = ensureFourierTaylorGuessRoundRunning();
    const c0 = Number(clampFourierNumber(payload && payload.c0, -4, 4, 0).toFixed(2));
    const c1 = Number(clampFourierNumber(payload && payload.c1, -4, 4, 0).toFixed(2));
    const c2 = Number(clampFourierNumber(payload && payload.c2, -4, 4, 0).toFixed(2));
    const c3 = Number(clampFourierNumber(payload && payload.c3, -4, 4, 0).toFixed(2));
    fourierTaylorGuessLiveCoeffs.set(socket.id, { c0, c1, c2, c3 });

    participant.lastActionAt = Date.now();
    fourierParticipants.set(socket.id, participant);

    if (createdFromTaylorLive) {
      emitFourierParticipants();
      emitFourierSoundState();
      emitFourierSummary();
    } else if (startedByLive) {
      emitFourierSummary();
    }

    fourierParticipants.forEach((currentParticipant, sid) => {
      if (currentParticipant && currentParticipant.role === 'teacher') {
        const teacherPayload = buildFourierTaylorGuessPayload(sid, 'teacher');
        io.to(sid).emit('fourier:taylor-guess-state', teacherPayload);
      }
    });
  });

  socket.on('fourier:taylor-guess-submit', (payload) => {
    touchGeometryConnection(socket.id);
    let participant = fourierParticipants.get(socket.id);

    if (!participant) {
      participant = registerFourierParticipant(
        socket,
        'client',
        payload && payload.name,
        payload && payload.team
      );
    }

    if (!participant || participant.role !== 'client') return;
    ensureFourierTaylorGuessRoundRunning();
    const hadSubmission = fourierTaylorGuessState.submissions.has(socket.id);

    const c0 = Number(clampFourierNumber(payload && payload.c0, -4, 4, 0).toFixed(2));
    const c1 = Number(clampFourierNumber(payload && payload.c1, -4, 4, 0).toFixed(2));
    const c2 = Number(clampFourierNumber(payload && payload.c2, -4, 4, 0).toFixed(2));
    const c3 = Number(clampFourierNumber(payload && payload.c3, -4, 4, 0).toFixed(2));

    let mse = 0;
    for (let i = 0; i <= 20; i++) {
      const x = -1.5 + (i / 20) * 3.0;
      const diff = Math.exp(2 * x) - (c0 + c1 * x + c2 * x * x + c3 * x * x * x);
      mse += diff * diff;
    }
    const now = Date.now();
    const error = Number(Math.sqrt(mse / 21).toFixed(3));

    fourierTaylorGuessState.submissions.set(socket.id, {
      c0,
      c1,
      c2,
      c3,
      error,
      submittedAt: hadSubmission
        ? (fourierTaylorGuessState.submissions.get(socket.id)?.submittedAt || now)
        : now,
      updatedAt: now,
    });
    fourierTaylorGuessState.updatedAt = now;
    participant.interactions += 1;
    participant.lastActionAt = now;
    fourierParticipants.set(socket.id, participant);

    emitFourierParticipants();
    emitFourierTaylorGuessState();
    emitFourierSummary();
  });

  socket.on('fourier:taylor-guess-reveal', () => {
    touchGeometryConnection(socket.id);
    const participant = fourierParticipants.get(socket.id);
    if (!participant || participant.role !== 'teacher') return;
    ensureFourierTaylorGuessRoundRunning();
    fourierTaylorGuessState.revealResults = true;
    fourierTaylorGuessState.updatedAt = Date.now();
    emitFourierTaylorGuessState();
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
    const removedSoundState = removeFourierSoundStatesForSocket(socket.id);
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

    if (removedParticipant) {
      emitFourierTaylorGuessState();
    }

    emitUsersUpdate();
  });
});

// Καταχώρηση upgrade event για χειρισμό WebSocket connections
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
const { buffonWss } = initBuffon({
  recordCommunication,
  getUpgradeClientInfo,
  touchBuffonConnection,
  coerceFourierString, // αυτό υπάρχει ήδη στο server.js
  buffonConnectionMeta,
  httpServer
});
// Εκκίνηση του HTTP server και εκτύπωση πληροφοριών σύνδεσης
httpServer.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  // εκτύπωση πληροφοριών σύνδεσης
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
    const reason = CAMERA_FEATURES_ENABLED
      ? 'CAMERA_WORKER_ENABLED=0'
      : 'CAMERA_FEATURES_ENABLED=false';
    console.log(`[camera-worker] disabled (${reason})`);
  }
});
// Τερματισμός του camera worker όταν ο server λαμβάνει σήμα τερματισμού
// SIGINT: σήμα τερματισμού από το χρήστη (π.χ. Ctrl+C)
process.on('SIGINT', () => {
  stopCameraWorker();
  process.exit(0);
});
// SIGTERM: σήμα τερματισμού από το σύστημα (π.χ. kill command)
process.on('SIGTERM', () => {
  stopCameraWorker();
  process.exit(0);
});
// SIGTERM: σήμα τερματισμού από το σύστημα (π.χ. kill command)
process.on('SIGTERM', () => {
  stopCameraWorker();
  process.exit(0);
});
// Τερματισμός του camera worker όταν ο server τερματίζει κανονικά
process.on('exit', () => {
  stopCameraWorker();
});
