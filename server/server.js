const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { WebSocketServer } = require('ws');

const teacherRouter = require('./routes/teacher');
const clientRouter = require('./routes/client');
const createAdminRouter = require('./routes/admin');
const createAppsRouter = require('./routes/apps');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const HOST = process.env.HOST || '0.0.0.0';
const parsedPort = Number.parseInt(process.env.PORT || '3000', 10);
const PORT = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536
  ? parsedPort
  : 3000;
const CAMERA_SERVICE_URL = process.env.CAMERA_SERVICE_URL || 'http://localhost:5001/detect';

const publicDir = path.join(__dirname, 'public');
const legacyActivitiesDir = path.join(__dirname, 'activities');

if (!fs.existsSync(legacyActivitiesDir)) {
  fs.mkdirSync(legacyActivitiesDir, { recursive: true });
}

app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));

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

app.use('/css', express.static(path.join(publicDir, 'css')));
app.use('/icons', express.static(path.join(publicDir, 'icons')));
app.use('/js', express.static(path.join(publicDir, 'js')));
app.use('/public', express.static(publicDir));

app.use('/teacher', teacherRouter);
app.use('/student', clientRouter);
app.use('/client', clientRouter);

// Store active users and their positions for geometry app
const activeUsers = new Map();
const geometryConnectionMeta = new Map();
const buffonConnectionMeta = new WeakMap();

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

app.use('/admin', createAdminRouter({ getRealtimeStats, getRealtimeParticipants }));
app.use('/apps', createAppsRouter());

const FOURIER_ROOM = 'fourier:classroom';
const fourierParticipants = new Map();
const fourierState = {
  activeSlideId: 'sec-cover',
  activeSlideIndex: 0,
  updatedAt: Date.now()
};
const fourierInteractionFeed = [];
const fourierBySlideCount = new Map();
const fourierByActivityCount = new Map();

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

    roster.push({
      role: participant.role,
      name: participant.name,
      joinedAt: participant.joinedAt,
      interactions: participant.interactions,
      lastActionAt: participant.lastActionAt,
      lastSlideId: participant.lastSlideId
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
    topStudents,
    slideActivity,
    activityBreakdown,
    recent,
    updatedAt: Date.now()
  };
}

function emitFourierParticipants() {
  io.to(FOURIER_ROOM).emit('fourier:participants', buildFourierParticipantPayload());
}

function emitFourierSummary() {
  io.to(FOURIER_ROOM).emit('fourier:summary', buildFourierSummary());
}

function emitUsersUpdate() {
  io.emit('users-update', buildUserList());
}

async function detectPointsFromPython(imageBase64) {
  try {
    const response = await fetch(CAMERA_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 })
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data.points) ? data.points : [];
  } catch (error) {
    console.error('[camera] service error:', error.message);
    return [];
  }
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

  geometryConnectionMeta.set(socket.id, {
    connectedAt: Date.now(),
    lastSeenAt: Date.now(),
    ...getSocketClientInfo(socket)
  });

  if (currentActivity) {
    socket.emit('activity-loaded', currentActivity);
  }

  socket.emit('users-update', buildUserList());

  socket.on('user-position', (data) => {
    touchGeometryConnection(socket.id);

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

    const points = await detectPointsFromPython(data.image);
    const existing = activeUsers.get(socket.id) || {};

    activeUsers.set(socket.id, {
      ...existing,
      id: socket.id,
      role: 'camera',
      name: data.name || existing.name,
      color: data.color || existing.color,
      shape: data.shape || existing.shape,
      points
    });

    socket.emit('camera-points', { points });
    emitUsersUpdate();
  });

  socket.on('activity-update', (geometry) => {
    touchGeometryConnection(socket.id);

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

    socket.broadcast.emit('activity-loaded', currentActivity);
  });

  socket.on('fourier:join', (data) => {
    touchGeometryConnection(socket.id);

    const role = resolveFourierRole(data && data.role);
    const name = normalizeFourierName(data && data.name, role, socket.id);
    const socketMeta = geometryConnectionMeta.get(socket.id) || {
      connectedAt: Date.now(),
      lastSeenAt: Date.now(),
      ...getSocketClientInfo(socket)
    };

    geometryConnectionMeta.set(socket.id, socketMeta);

    socket.join(FOURIER_ROOM);

    fourierParticipants.set(socket.id, {
      socketId: socket.id,
      role,
      name,
      joinedAt: Date.now(),
      interactions: 0,
      lastActionAt: null,
      lastSlideId: '',
      ip: socketMeta.ip || 'unknown',
      userAgent: socketMeta.userAgent || 'unknown'
    });

    socket.emit('fourier:state', {
      role,
      name,
      activeSlideId: fourierState.activeSlideId,
      activeSlideIndex: fourierState.activeSlideIndex,
      participants: buildFourierParticipantPayload(),
      summary: buildFourierSummary()
    });

    socket.emit('fourier:slide', {
      activeSlideId: fourierState.activeSlideId,
      activeSlideIndex: fourierState.activeSlideIndex,
      updatedAt: fourierState.updatedAt
    });

    emitFourierParticipants();
    emitFourierSummary();
  });

  socket.on('fourier:request-state', () => {
    touchGeometryConnection(socket.id);

    if (!fourierParticipants.has(socket.id)) {
      return;
    }

    socket.emit('fourier:state', {
      activeSlideId: fourierState.activeSlideId,
      activeSlideIndex: fourierState.activeSlideIndex,
      participants: buildFourierParticipantPayload(),
      summary: buildFourierSummary()
    });
  });

  socket.on('fourier:set-slide', (payload) => {
    touchGeometryConnection(socket.id);

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

    io.to(FOURIER_ROOM).emit('fourier:slide', {
      activeSlideId: fourierState.activeSlideId,
      activeSlideIndex: fourierState.activeSlideIndex,
      updatedAt: fourierState.updatedAt
    });

    emitFourierSummary();
  });

  socket.on('fourier:interaction', (payload) => {
    touchGeometryConnection(socket.id);

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

    io.to(FOURIER_ROOM).emit('fourier:activity-event', entry);
    emitFourierSummary();
  });

  socket.on('disconnect', () => {
    console.log('[geometry] socket disconnected:', socket.id);
    activeUsers.delete(socket.id);
    geometryConnectionMeta.delete(socket.id);

    if (fourierParticipants.delete(socket.id)) {
      emitFourierParticipants();
      emitFourierSummary();
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

  buffonTeachers.forEach((teacherWs) => {
    if (teacherWs.readyState === 1) {
      teacherWs.send(message);
    }
  });
}

function buffonBroadcastStudents(data) {
  const message = JSON.stringify(data);

  buffonStudents.forEach((_, studentWs) => {
    if (studentWs.readyState === 1) {
      studentWs.send(message);
    }
  });
}

function sendBuffonRoster(target) {
  const list = [...buffonStudents.values()];
  const message = JSON.stringify({ type: 'roster', students: list });

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
    buffonStudents.delete(ws);
    buffonTeachers.delete(ws);
    buffonConnectionMeta.delete(ws);
    sendBuffonRoster();
  });
});

httpServer.on('upgrade', (request, socket, head) => {
  if (request.url && request.url.startsWith('/ws/buffon')) {
    buffonWss.handleUpgrade(request, socket, head, (ws) => {
      buffonWss.emit('connection', ws, request);
    });
  }
});

httpServer.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;

  console.log(`[server] running at http://${displayHost}:${PORT}`);
  console.log(`[server] entry page: http://${displayHost}:${PORT}/`);
  console.log(`[server] teacher dashboard: http://${displayHost}:${PORT}/teacher`);
  console.log(`[server] student launcher: http://${displayHost}:${PORT}/student`);
  console.log(`[server] student launcher alias: http://${displayHost}:${PORT}/client`);
  console.log(`[server] admin dashboard: http://${displayHost}:${PORT}/admin`);
});
