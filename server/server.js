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
// helpers
const { 
  sanitizeString, 
  parseRealtimeMessage 
} = require('./utils/helpers');
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
const { createCommunicationLog } = require('./utils/communication');
const {
  getSocketClientInfo,
  getUpgradeClientInfo
} = require('./utils/socketHelpers');
const sessionManager = require('./services/sessionManager');
// Εισαγωγή υπηρεσιών
const initFourier = require('./services/fourier');
const initBuffon = require('./services/buffon');
const initGeometry = require('./services/geometry');
const initNeural = require('./services/neural');
const initPrimes = require('./services/primes');

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


// Δημιουργεί transport για real-time επικοινωνία
function createRealtimeTransport() {
  // Δημιουργία WebSocketServer με noServer: 
  // true για να χρησιμοποιηθεί με το υπάρχον HTTP server
  const wss = new WebSocketServer({ noServer: true });
  // Map με όλους τους ενεργούς sockets
  const sockets = new Map();
  // Map με όλα τα rooms και τα μέλη τους
  const rooms = new Map();
  // Array με όλους τους χειριστές σύνδεσης
  const connectionHandlers = [];
  let socketSeq = 0;
  // Έλεγχος αν το WebSocket είναι έτοιμο για αποστολή μηνυμάτων
  function wsReady(ws) {
    return Boolean(ws) && ws.readyState === 1;
  }
  // Αποστολή μηνύματος σε WebSocket
  function wsSend(ws, event, data) {
    if (!wsReady(ws)) {
      return;
    }

    try {
      ws.send(JSON.stringify({ event, data }));
    } catch (error) {
      console.error(`[realtime] wsSend error for ${event}:`, error && error.message ? error.message : error);
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
        } catch (error) {
          console.error(`[realtime] ws.close error for ${socketId}:`, error && error.message ? error.message : error);
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

const publicDir = path.join(__dirname, '..', 'public');
const legacyActivitiesDir = path.join(__dirname, '..', 'activities');

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

app.get('/tools', (req, res) => {
  res.sendFile(path.join(publicDir, 'tools.html'));
});

app.get(['/tools/linear-seperation', '/tools/linear-seperation/'], (req, res) => {
  const linearSeperationIndex = path.join(__dirname, '..', 'tools', 'linear-seperation', 'dist', 'index.html');
  if (!fs.existsSync(linearSeperationIndex)) {
    return res.status(503).send('Linear separation tool has not been built yet. Run `npm run build:linear`.');
  }

  return res.sendFile(linearSeperationIndex);
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

app.use('/tools/linear-seperation', express.static(path.join(__dirname, '..', 'tools', 'linear-seperation', 'dist')));

// Unified assets (new structure)
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

// Apps folders
app.use('/apps', express.static(path.join(__dirname, '..', 'apps')));

// Legacy apps/assets path (keep for backward compatibility)
app.use('/apps/assets', express.static(path.join(__dirname, '..', 'apps', 'assets')));

app.use('/teacher', teacherRouter);
app.use(appDataRouter);
app.use('/student', clientRouter);
app.use('/client', clientRouter);

// Store active users and their positions for geometry app
const buffonConnectionMeta = new WeakMap();
const canvasNodeConnectionMeta = new WeakMap();
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

const {
  recordCommunication,
  getCommunicationLog,
  clearCommunicationLog,
  getCommunicationCatalog
} = createCommunicationLog({
  limit: COMM_LOG_LIMIT,
  catalog: COMM_EVENT_CATALOG
});

const {
  activeUsers,
  geometryConnectionMeta,
  touchGeometryConnection,
  buildUserList,
  emitUsersUpdate,
  detectPointsFromPython,
  detectCameraFrameFromPython
} = initGeometry({
  io,
  recordCommunication,
  requestCameraDetection
});

const fourierService = initFourier({
  io,
  recordCommunication,
  geometryConnectionMeta,
  getSocketClientInfo,
  touchGeometryConnection,
  emitUsersUpdate,
  activeUsers,
  sessionManager
});
const { fourierParticipants, registerSocketHandlers: registerFourierSocketHandlers, handleSocketDisconnect } = fourierService;

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

function getRealtimeParticipants() {
  return sessionManager.getParticipants();
}

function getRealtimeStats() {
  const sessionStats = sessionManager.getStats();
  return {
    connectedSockets: io.engine.clientsCount,
    activeUserPoints: buildUserList().length,
    fourierParticipants: fourierParticipants.size,
    activeSessions: sessionStats.activeSessions,
    sessionsByRole: sessionStats.byRole,
    sessionsByApp: sessionStats.byApp
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

  const socketInfo = getSocketClientInfo(socket);
  sessionManager.create(socket.id, {
    ip: socketInfo.ip,
    userAgent: socketInfo.userAgent,
    username: `user_${String(socket.id).slice(0, 6)}`,
    role: 'client',
    source: 'realtime'
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

  registerFourierSocketHandlers(socket);

  socket.on('user-position', (data) => {
    touchGeometryConnection(socket.id);
    sessionManager.joinApp(socket.id, 'geometry');
    sessionManager.update(socket.id, {
      username: sanitizeString(data && data.name, 60) || `user_${String(socket.id).slice(0, 6)}`,
      role: sanitizeString(data && data.role, 20) || 'client'
    }, {
      geometry: {
        x: Number(data && data.x),
        y: Number(data && data.y),
        color: sanitizeString(data && data.color, 20) || undefined
      }
    });
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
      sessionManager.joinApp(socket.id, 'geometry');
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
      sessionManager.joinApp(socket.id, 'geometry');
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
    sessionManager.joinApp(socket.id, 'geometry');
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
    sessionManager.remove(socket.id);

    handleSocketDisconnect(socket.id);
  });
});



initNeural({
  recordCommunication,
  getUpgradeClientInfo,
  touchCanvasNodeConnection,
  canvasNodeConnectionMeta,
  httpServer,
  sessionManager
});
const { buffonWss } = initBuffon({
  recordCommunication,
  getUpgradeClientInfo,
  touchBuffonConnection,
  buffonConnectionMeta,
  httpServer,
  sessionManager
});
const { primesWss } = initPrimes({
  recordCommunication,
  getUpgradeClientInfo,
  sessionManager
});

// Καταχώρηση upgrade event για χειρισμό WebSocket connections
httpServer.on('upgrade', (request, socket, head) => {
  if (request.url && request.url.startsWith(REALTIME_WS_PATH)) {
    io.handleUpgrade(request, socket, head);
    return;
  }

  // neural-lab upgrades are handled inside services/neural.js
  if (request.url && request.url.startsWith('/ws/neural-lab')) {
    return;
  }

  if (request.url && request.url.startsWith('/ws/buffon')) {
    buffonWss.handleUpgrade(request, socket, head, (ws) => {
      buffonWss.emit('connection', ws, request);
    });
    return;
  }

  if (request.url && request.url.startsWith('/ws/primes-lab')) {
    primesWss.handleUpgrade(request, socket, head, (ws) => {
      primesWss.emit('connection', ws, request);
    });
    return;
  }


  socket.destroy();
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
// Τερματισμός του camera worker όταν ο server τερματίζει κανονικά
process.on('exit', () => {
  stopCameraWorker();
});
