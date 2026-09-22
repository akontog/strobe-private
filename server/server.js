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

io.on('connection', (socket) => {
  registerGeometrySocketHandlers(socket, {
    registerFourierSocketHandlers,
    handleFourierDisconnect: handleSocketDisconnect
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