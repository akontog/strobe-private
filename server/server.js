/**** 1. Εισαγωγή βιβλιοθηκών ****/
// Για δημιουργία web εφαρμογής
const express = require('express');
// Πρόσβαση στο σύστημα αρχείων
//const fs = require('node:fs');
// διαχείριση διαδρομών αρχείων
const path = require('node:path');
// HTTP server για την εξυπηρέτηση αιτημάτων
const http = require('node:http');
// WebSocket για real-time επικοινωνία
//const { WebSocketServer } = require('ws');

/**** 2. Εισαγωγή routers (δρομολογητές) ****/
const teacherRouter = require('./routes/teacher');
const clientRouter = require('./routes/client');
const createAdminRouter = require('./routes/admin');
const createAppsRouter = require('./routes/apps');
const appDataRouter = require('./routes/appData');
const createActivitiesRouter = require('./routes/activities');

/**** 3. Εισαγωγή βοηθητικών συναρτήσεων, μεταβλητών και ρυθμίσεων ****/
const {
    HOST,
    PORT,
    publicDir,
    clientDistDir,
    REALTIME_WS_PATH
} = require('./config/serverConfig');
const { createRealtimeTransport } = require('./utils/realtimeTransport');
const {sanitizeString} = require('./utils/helpers');
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
const { COMM_EVENT_CATALOG } = require('./utils/commEventCatalog');
const {
  getSocketClientInfo,
  getUpgradeClientInfo
} = require('./utils/socketHelpers');
const {
    registerStaticFiles
} = require('./startup/registerStaticFiles');
const { sessionMiddleware } = require('./middleware/sessionMiddleware');
/**** 4. Εισαγωγή υπηρεσιών ****/
const sessionManager = require('./services/sessionManager');
const initFourier = require('./services/fourier');
const initBuffon = require('./services/buffon');
const initGeometry = require('./services/geometry');
const initNeural = require('./services/neural');
const initPrimes = require('./services/primes');
const wsRegistry = require('./services/websocketRegistry');

/**** 5. Δημιουργία εφαρμογής Express και HTTP server ****/
const app = express();
const httpServer = http.createServer(app);

const io = createRealtimeTransport();
const { router: activitiesRouter, getCurrentActivity, setCurrentActivity } = createActivitiesRouter({ io });

app.use(activitiesRouter);

app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(sessionMiddleware());

// Session management middleware
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

registerStaticFiles(app, {
    publicDir,
    clientDistDir
});

app.use('/teacher', teacherRouter);
app.use(appDataRouter);
app.use('/student', clientRouter);
app.use('/client', clientRouter);

const parsedCommLogLimit = Number.parseInt(process.env.ADMIN_COMM_LOG_LIMIT || '1200', 10);
const COMM_LOG_LIMIT = Number.isInteger(parsedCommLogLimit) && parsedCommLogLimit >= 200
  ? Math.min(parsedCommLogLimit, 10000)
  : 1200;

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

const buffonConnectionMeta = new Map();
const canvasNodeConnectionMeta = new Map();

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
  const sessionStats = sessionManager.getStatistics();
  return {
    connectedSockets: io.engine.clientsCount,
    activeUserPoints: buildUserList().length,
    fourierParticipants: fourierParticipants.size,
    activeSessions: sessionStats.activeSessions,
    sessionsByRole: sessionStats.sessionsByRole,
    sessionsByApp: sessionStats.sessionsByApp
  };
}

app.use('/admin', createAdminRouter({
  getRealtimeStats,
  getRealtimeParticipants,
  getCommunicationLog,
  clearCommunicationLog,
  getCommunicationCatalog
}));
app.use('/labs', createAppsRouter());




app.get('/api/tools', (req, res) => {
  res.json([
    {
      id: 'activity-builder',
      title: 'Activity Builder',
      description: 'Build and inspect activity payloads for the classroom apps.',
      path: '/tools/activity-builder/',
      available: true
    },
    {
      id: 'camera-speed-test',
      title: 'Camera Speed Test',
      description: 'Benchmark the camera detection pipeline and annotated frame roundtrip.',
      path: '/tools/camera-speed-test/',
      available: true
    },
    {
      id: 'linear-seperation',
      title: 'Linear Seperation',
      description: 'Interactive linear separation playground built from the tools workspace.',
      path: '/tools/linear-seperation/',
      available: true
    }
  ]);
});
function asyncHandler(fn) {
  return function (...args) {
    Promise.resolve(fn.apply(this, args)).catch((err) => {
      console.error('[socket] unhandled async error:', err?.message || err);
    });
  };
}
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

  const currentActivityOnConnect = getCurrentActivity();
  if (currentActivityOnConnect) {
    recordCommunication({
      app: 'geometry',
      direction: 'out',
      event: 'activity-loaded',
      from: 'server',
      to: socket.id,
      payload: {
        shapeCount: Array.isArray(currentActivityOnConnect.geometry) ? currentActivityOnConnect.geometry.length : 0
      }
    });
    socket.emit('activity-loaded', currentActivityOnConnect);
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
    socket.on('camera-frame', asyncHandler(async (data) => {
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
    }));

    socket.on('camera-speed-frame', asyncHandler(async (data) => {
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
    }));
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

    let currentActivityForUpdate = getCurrentActivity();
    if (!currentActivityForUpdate) {
      currentActivityForUpdate = {
        name: 'Live Activity',
        geometry: [],
        createdAt: new Date().toISOString()
      };
    }

    currentActivityForUpdate = {
      ...currentActivityForUpdate,
      geometry
    };
    setCurrentActivity(currentActivityForUpdate);

    recordCommunication({
      app: 'geometry',
      direction: 'out',
      event: 'activity-loaded',
      from: 'server',
      to: 'broadcast-except-sender',
      payload: {
        shapeCount: Array.isArray(currentActivityForUpdate.geometry) ? currentActivityForUpdate.geometry.length : 0
      }
    });
    socket.broadcast.emit('activity-loaded', currentActivityForUpdate);
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



const { handleUpgrade: neuralUpgrade } = initNeural({
  recordCommunication,
  getUpgradeClientInfo,
  touchCanvasNodeConnection,
  canvasNodeConnectionMeta,
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

wsRegistry.register(REALTIME_WS_PATH, (request, socket, head) => {
  io.handleUpgrade(request, socket, head);
});

wsRegistry.register('/ws/neural-lab', neuralUpgrade);

wsRegistry.register('/ws/buffon', (request, socket, head) => {
  buffonWss.handleUpgrade(request, socket, head, (ws) => {
    buffonWss.emit('connection', ws, request);
  });
});

wsRegistry.register('/ws/primes-lab', (request, socket, head) => {
  primesWss.handleUpgrade(request, socket, head, (ws) => {
    primesWss.emit('connection', ws, request);
  });
});

// Μοναδικό upgrade event για όλο το σύστημα WebSocket
httpServer.on('upgrade', (request, socket, head) => {
  wsRegistry.handleUpgrade(request, socket, head);
});

app.use(express.static(clientDistDir));

app.get('/api/{*path}', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(clientDistDir, 'index.html'));
});

// Middleware για διαχείριση σφαλμάτων HTTP αιτήσεων
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