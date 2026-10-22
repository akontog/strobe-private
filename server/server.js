/**** 1. Import libraries ****/
// Web application framework
const express = require('express');
// Access to the file system
const fs = require('node:fs');
// File path management
const path = require('node:path');
// HTTP server for handling requests
const http = require('node:http');
// WebSocket for real-time communication
const { WebSocketServer } = require('ws');

/**** 2. Import routers ****/
const teacherRouter = require('./routes/teacher');
const clientRouter = require('./routes/client');
const createAdminRouter = require('./routes/admin');
const createAppsRouter = require('./routes/apps');
const appDataRouter = require('./routes/appData');
const createActivitiesRouter = require('./routes/activities');
const createAuthRouter = require('./routes/auth');
const createScoresRouter = require('./routes/scores');
const sessionLogsRouter = require('./routes/sessionLogs');
const { requireRole } = require('./middleware/checkRole');

/**** 3. Import helper functions, variables, and settings ****/
const {
    HOST,
    PORT,
    publicDir,
    clientDistDir,
    REALTIME_WS_PATH
} = require('./config/serverConfig');
const { createRealtimeTransport } = require('./utils/realtimeTransport');
const {sanitizeString, asyncHandler } = require('./utils/helpers');
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
const { sessionMiddleware, getWebSocketSessionInfo } = require('./middleware/sessionMiddleware');

/**** 4. Import services ****/
const sessionManager = require('./services/sessionManager');
const initBuffon = require('./services/buffon');
const initGeometry = require('./services/geometry');
const initNeural = require('./services/neural');
const initPrimes = require('./services/primes');
const initPolynomial = require('./services/polynomial');
const initLinearSystems = require('./services/linearSystems');
const initIdentities = require('./services/identities');
const initEquations = require('./services/equations');
const initFactorization = require('./services/factorization');
const initGeogebraCollab = require('./services/geogebraCollab');
const { createGeogebraLessonStore } = require('./utils/geogebraLessonStore');
const wsRegistry = require('./services/websocketRegistry');

/**** 5. Create Express application and HTTP server ****/
// Create Express application instance
const app = express();
// Create HTTP server using the Express application
const httpServer = http.createServer(app);
const visionWss = new WebSocketServer({ noServer: true });
const io = createRealtimeTransport();
const { router: activitiesRouter, getCurrentActivity, setCurrentActivity } = createActivitiesRouter({ io });
const VISION_ACTIVITIES_DIR = path.join(__dirname, '..', 'vision', 'temp', 'activities');

app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(sessionMiddleware());
app.use('/api/auth', createAuthRouter());
app.use('/api/scores', createScoresRouter());
app.use(sessionLogsRouter);
app.use(activitiesRouter);

// Session management middleware
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

function resolveVisionConflictText(rawText) {
  const keepLines = [];
  let state = 'normal';

  String(rawText || '').split(/\r?\n/g).forEach((line) => {
    if (line.startsWith('<<<<<<<')) {
      state = 'head';
      return;
    }
    if (line.startsWith('=======') && state === 'head') {
      state = 'other';
      return;
    }
    if (line.startsWith('>>>>>>>') && (state === 'head' || state === 'other')) {
      state = 'normal';
      return;
    }
    if (state === 'normal' || state === 'head') {
      keepLines.push(line);
    }
  });

  return keepLines.join('\n');
}

function parseVisionActivityPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  if (!payload.points || typeof payload.points !== 'object' || Array.isArray(payload.points)) {
    return null;
  }
  if (!Array.isArray(payload.shapes)) {
    return null;
  }

  const normalizedPoints = {};
  Object.entries(payload.points).forEach(([pointId, point]) => {
    if (!point || typeof point !== 'object' || Array.isArray(point)) {
      return;
    }
    const x = Number(point.x);
    const y = Number(point.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }
    normalizedPoints[String(pointId)] = {
      x,
      y,
      color: String(point.color || '#2563eb'),
      width: Number.isFinite(Number(point.width)) ? Number(point.width) : 3
    };
  });

  if (!Object.keys(normalizedPoints).length) {
    return null;
  }

  const normalizedShapes = payload.shapes
    .filter((shape) => shape && typeof shape === 'object' && !Array.isArray(shape) && Array.isArray(shape.points))
    .map((shape) => ({
      type: String(shape.type || 'line'),
      points: shape.points.map((pointId) => String(pointId)),
      color: String(shape.color || '#2563eb'),
      width: Number.isFinite(Number(shape.width)) ? Number(shape.width) : 3
    }));

  return {
    points: normalizedPoints,
    shapes: normalizedShapes,
    sourceWidth: Number.isFinite(Number(payload.sourceWidth)) ? Number(payload.sourceWidth) : 640,
    sourceHeight: Number.isFinite(Number(payload.sourceHeight)) ? Number(payload.sourceHeight) : 480
  };
}

function loadVisionActivities() {
  if (!fs.existsSync(VISION_ACTIVITIES_DIR)) {
    return [];
  }

  const files = fs.readdirSync(VISION_ACTIVITIES_DIR)
    .filter((name) => name.toLowerCase().endsWith('.json'))
    .sort();

  const loaded = [];

  files.forEach((fileName) => {
    const filePath = path.join(VISION_ACTIVITIES_DIR, fileName);
    let rawText;
    try {
      rawText = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.warn(`[vision-activities] failed to read ${fileName}:`, error && error.message ? error.message : error);
      return;
    }

    const candidates = [rawText, resolveVisionConflictText(rawText)];
    let parsed = null;

    for (const candidate of candidates) {
      try {
        parsed = JSON.parse(candidate);
        break;
      } catch {
        parsed = null;
      }
    }

    if (!parsed) {
      console.warn(`[vision-activities] failed to parse ${fileName}`);
      return;
    }

    const normalized = parseVisionActivityPayload(parsed);
    if (!normalized) {
      console.warn(`[vision-activities] invalid payload in ${fileName}`);
      return;
    }

    loaded.push({
      id: path.basename(fileName, '.json'),
      name: path.basename(fileName, '.json').replace(/[-_]/g, ' '),
      ...normalized
    });
  });

  return loaded;
}

app.get('/api/vision/health', (req, res) => {
  res.json({
    ok: true,
    cameraWorkerEnabled: Boolean(CAMERA_WORKER_ENABLED)
  });
});

app.get('/api/vision/activities', (req, res) => {
  res.json({
    activities: loadVisionActivities()
  });
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
  detectCameraFrameFromPython,
  registerSocketHandlers: registerGeometrySocketHandlers
} = initGeometry({
  io,
  recordCommunication,
  requestCameraDetection,
  sessionManager,
  getSocketClientInfo,
  sanitizeString,
  CAMERA_FEATURES_ENABLED,
  asyncHandler,
  getCurrentActivity,
  setCurrentActivity
});

const buffonConnectionMeta = new Map();
const canvasNodeConnectionMeta = new Map();

const geogebraLessonStore = createGeogebraLessonStore();

const geogebraCollabService = initGeogebraCollab({
  io,
  recordCommunication,
  sessionManager,
  geogebraLessonStore
});

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




app.get('/api/tools', requireRole(['teacher']), (req, res) => {
  const tools = [
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
    },
    {
      id: 'geogebra-collab',
      title: 'GeoGebra Collaborative Component',
      description: 'Shared GeoGebra board with server-authoritative permissions and realtime sync.',
      path: '/tools/geogebra-collab/',
      available: true
    },
    {
      id: 'vision-collab',
      title: 'Vision Tracking Collaboration',
      description: 'WebRTC camera capture streamed to the Node vision bridge and Python tracking with point overlays.',
      path: '/tools/vision-collab/',
      available: true
    },
    {
      id: 'console',
      title: 'Console',
      description: 'Live console for messages exchanged between users and the server.',
      path: '/tools/console/',
      available: true
    }
  ];
  res.json(req.session.role === 'admin'
    ? tools
    : tools.filter((tool) => !['camera-speed-test', 'console'].includes(tool.id)));
});

io.on('connection', (socket) => {
  registerGeometrySocketHandlers(socket);

  geogebraCollabService.registerSocketHandlers(socket);
});

visionWss.on('connection', (ws) => {
  ws.on('message', async (rawData) => {
    let message;
    try {
      message = JSON.parse(String(rawData || ''));
    } catch {
      ws.send(JSON.stringify({ id: null, points: [], boxes: [], tracking: 'invalid-json' }));
      return;
    }

    const requestId = Number.parseInt(message && message.requestId, 10);
    const imageBase64 = message && typeof message.image === 'string' ? message.image : '';
    const includeAnnotatedImage = Boolean(message && message.includeAnnotatedImage);

    if (!imageBase64.trim()) {
      ws.send(JSON.stringify({ id: Number.isInteger(requestId) ? requestId : null, points: [], boxes: [], tracking: 'invalid-image' }));
      return;
    }

    const startedAt = process.hrtime.bigint();
    const detection = await requestCameraDetection(imageBase64, { includeAnnotatedImage });
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    ws.send(JSON.stringify({
      id: Number.isInteger(requestId) ? requestId : null,
      ...detection,
      serverElapsedMs: Math.max(0, Number(elapsedMs.toFixed(2)))
    }));
  });
});

const { handleUpgrade: neuralUpgrade } = initNeural({
  recordCommunication,
  getUpgradeClientInfo,
  getWebSocketSessionInfo,
  touchCanvasNodeConnection,
  canvasNodeConnectionMeta,
  sessionManager
});
const { buffonWss } = initBuffon({
  recordCommunication,
  getUpgradeClientInfo,
  getWebSocketSessionInfo,
  touchBuffonConnection,
  buffonConnectionMeta,
  httpServer,
  sessionManager
});
const { primesWss } = initPrimes({
  recordCommunication,
  getUpgradeClientInfo,
  getWebSocketSessionInfo,
  sessionManager
});
const { polynomialWss } = initPolynomial({
  recordCommunication,
  getUpgradeClientInfo,
  getWebSocketSessionInfo,
  sessionManager
});
const { linearSystemsWss } = initLinearSystems({
  recordCommunication,
  getUpgradeClientInfo,
  getWebSocketSessionInfo,
  sessionManager
});
const { identitiesWss } = initIdentities({
  recordCommunication,
  getUpgradeClientInfo,
  getWebSocketSessionInfo,
  sessionManager
});
const { equationsWss } = initEquations({
  recordCommunication,
  getUpgradeClientInfo,
  getWebSocketSessionInfo,
  sessionManager
});
const { factorizationWss } = initFactorization({
  recordCommunication,
  getUpgradeClientInfo,
  getWebSocketSessionInfo,
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

wsRegistry.register('/ws/polynomial-lab', (request, socket, head) => {
  polynomialWss.handleUpgrade(request, socket, head, (ws) => {
    polynomialWss.emit('connection', ws, request);
  });
});

wsRegistry.register('/ws/linear-systems-lab', (request, socket, head) => {
  linearSystemsWss.handleUpgrade(request, socket, head, (ws) => {
    linearSystemsWss.emit('connection', ws, request);
  });
});

wsRegistry.register('/ws/identities-lab', (request, socket, head) => {
  identitiesWss.handleUpgrade(request, socket, head, (ws) => {
    identitiesWss.emit('connection', ws, request);
  });
});

wsRegistry.register('/ws/equations-lab', (request, socket, head) => {
  equationsWss.handleUpgrade(request, socket, head, (ws) => {
    equationsWss.emit('connection', ws, request);
  });
});

wsRegistry.register('/ws/factorization-lab', (request, socket, head) => {
  factorizationWss.handleUpgrade(request, socket, head, (ws) => {
    factorizationWss.emit('connection', ws, request);
  });
});

wsRegistry.register('/ws/vision', (request, socket, head) => {
  visionWss.handleUpgrade(request, socket, head, (ws) => {
    visionWss.emit('connection', ws, request);
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
