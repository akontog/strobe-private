const { sanitizeString} = require('../utils/helpers');

let io = null;
let recordCommunication = () => {};
let geometryConnectionMeta = new Map();
let getSocketClientInfo = () => ({ ip: 'unknown', userAgent: 'unknown' });
let touchGeometryConnection = () => {};
let emitUsersUpdate = () => {};
let activeUsers = new Map();
let sessionManager = null;

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
const fourierWaveSumState = new Map(); // socketId -> { freq, amp, phi, updatedAt }
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

function buildFourierSoundStateKey(socketId, sourceKey = 'main') {
  return `${String(socketId || '').trim()}::${String(sourceKey || 'main').trim() || 'main'}`;
}

function parseFourierSoundStateKey(stateKey) {
  const raw = String(stateKey || '');
  const separatorIndex = raw.indexOf('::');
  if (separatorIndex < 0) {
    return {
      socketId: raw,
      sourceKey: 'main'
    };
  }

  return {
    socketId: raw.slice(0, separatorIndex),
    sourceKey: raw.slice(separatorIndex + 2) || 'main'
  };
}

function removeFourierSoundStatesForSocket(socketId) {
  const targetSocketId = String(socketId || '').trim();
  if (!targetSocketId) {
    return false;
  }

  let removed = false;
  [...fourierSoundState.keys()].forEach((stateKey) => {
    const parsed = parseFourierSoundStateKey(stateKey);
    if (parsed.socketId === targetSocketId) {
      removed = fourierSoundState.delete(stateKey) || removed;
    }
  });

  return removed;
}

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


function coerceFourierValue(value, depth = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number(value.toFixed(5));
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeString(value, 80);
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
      const safeKey = sanitizeString(key, 24);
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
  const rawSourceKey = String(payload && payload.sourceKey || '').trim().toLowerCase();
  const sourceKey = /^[a-z0-9_-]{1,32}$/.test(rawSourceKey)
    ? rawSourceKey
    : 'main';
  const sourceLabel = sanitizeString(payload && payload.sourceLabel, 24) || sourceKey;
  const frequency = Number(
    clampFourierNumber(payload && payload.frequency, 80, 1400, 440).toFixed(2)
  );
  const amplitude = Number(
    clampFourierNumber(payload && payload.amplitude, 0, 1, 0).toFixed(3)
  );

  return {
    sourceKey,
    sourceLabel,
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
  const safe = sanitizeString(rawKind, 20).toLowerCase();
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
    name: sanitizeString(participant && participant.name, 80),
    team: sanitizeString(participant && participant.team, 80),
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

  if (sessionManager && typeof sessionManager.create === 'function') {
    sessionManager.create(socket.id, {
      ip: participant.ip,
      userAgent: participant.userAgent,
      username: participant.name,
      role: participant.role,
      source: 'fourier'
    });
    sessionManager.joinApp(socket.id, 'fourier');
    sessionManager.update(socket.id, {
      username: participant.name,
      role: participant.role,
      source: 'fourier'
    }, {
      fourier: {
        team: participant.team,
        lastSlideId: participant.lastSlideId,
        interactions: participant.interactions
      }
    });
  }

  if (safeRole === 'client') {
    const stateKey = buildFourierSoundStateKey(socket.id, 'main');
    const currentSound = fourierSoundState.get(stateKey) || {
      frequency: 440,
      amplitude: 0,
      updatedAt: Date.now()
    };

    fourierSoundState.set(stateKey, {
      sourceKey: 'main',
      sourceLabel: 'main',
      frequency: Number(clampFourierNumber(currentSound.frequency, 80, 1400, 440).toFixed(2)),
      amplitude: Number(clampFourierNumber(currentSound.amplitude, 0, 1, 0).toFixed(3)),
      updatedAt: currentSound.updatedAt || Date.now()
    });
  } else {
    removeFourierSoundStatesForSocket(socket.id);
    fourierHeatState.delete(socket.id);
  }

  return participant;
}

function buildFourierSoundPayload() {
  const states = [];

  fourierSoundState.forEach((current, stateKey) => {
    const parsedKey = parseFourierSoundStateKey(stateKey);
    const socketId = parsedKey.socketId;
    const sourceKey = parsedKey.sourceKey || 'main';
    const participant = fourierParticipants.get(socketId);
    if (!participant || (participant.role !== 'client' && participant.role !== 'teacher')) {
      return;
    }

    states.push({
      key: stateKey,
      socketId,
      sourceKey,
      sourceLabel: sanitizeString(current && current.sourceLabel, 24) || sourceKey,
      name: participant.name,
      team: participant.team,
      role: participant.role,
      frequency: Number(clampFourierNumber(current && current.frequency, 80, 1400, 440).toFixed(2)),
      amplitude: Number(clampFourierNumber(current && current.amplitude, 0, 1, 0).toFixed(3)),
      updatedAt: current.updatedAt || 0
    });
  });

  return states
    .sort((a, b) => {
      const roleA = a.role === 'teacher' ? 0 : 1;
      const roleB = b.role === 'teacher' ? 0 : 1;
      if (roleA !== roleB) {
        return roleA - roleB;
      }
      const nameCompare = String(a.name).localeCompare(String(b.name));
      if (nameCompare !== 0) {
        return nameCompare;
      }
      return String(a.sourceKey).localeCompare(String(b.sourceKey));
    })
    .slice(0, 240);
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
  const safeKey = sanitizeString(key, 80);
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
      ? (fourierSoundState.get(buildFourierSoundStateKey(participant.socketId, 'main')) || {
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

function ensureFourierTaylorGuessRoundRunning() {
  if (fourierTaylorGuessState.status === 'running') {
    return false;
  }

  startFourierTaylorGuessRound();
  return true;
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
    const teacherCoeffs = live
      ? [live.c0, live.c1, live.c2, live.c3]
      : (sub ? [sub.c0, sub.c1, sub.c2, sub.c3] : null);
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
      amp: Number(clampFourierNumber(data.amp, 0, 1.8, 0.9).toFixed(2)),
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

function registerSocketHandlers(socket) {
  socket.on('fourier:join', (data) => {
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

    const slideId = sanitizeString(payload && payload.slideId, 80);
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

    const slideId = sanitizeString(payload && payload.slideId, 80);
    const activityId = sanitizeString(payload && payload.activityId, 80);
    const controlId = sanitizeString(payload && payload.controlId, 80);
    const kind = sanitizeString(payload && payload.kind, 24) || 'input';
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

    emitFourierSoundState();
    emitFourierFftDuelState();
  });

  socket.on('fourier:heat-control', (payload) => {
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

    emitFourierHeatState();
    emitFourierFftDuelState();
  });

  socket.on('fourier:heat-time-control', (payload) => {
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
}

function handleSocketDisconnect(socketId) {
  const removedParticipant = fourierParticipants.delete(socketId);
  const removedSoundState = removeFourierSoundStatesForSocket(socketId);
  const removedHeatState = fourierHeatState.delete(socketId);
  const removedOceanRandomPack = fourierOceanRandomState.packs.delete(socketId);
  const removedFftDuelState = fourierFftDuelState.assignments.delete(socketId);
  const removedWaveSumEntry = fourierWaveSumState.delete(socketId);

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

  if (removedParticipant && sessionManager && typeof sessionManager.remove === 'function') {
    sessionManager.remove(socketId);
  }
}
// Επιστρέφει ένα αντικείμενο με τις συναρτήσεις και τις μεταβλητές 
// που χρειάζονται για τη διαχείριση της εφαρμογής Fourier μέσω WebSocket.
function initFourier(deps = {}) {
  io = deps.io;
  recordCommunication = typeof deps.recordCommunication === 'function' ? deps.recordCommunication : () => {};
  geometryConnectionMeta = deps.geometryConnectionMeta;
  getSocketClientInfo = typeof deps.getSocketClientInfo === 'function'
    ? deps.getSocketClientInfo
    : () => ({ ip: 'unknown', userAgent: 'unknown' });
  touchGeometryConnection = typeof deps.touchGeometryConnection === 'function' ? deps.touchGeometryConnection : () => {};
  emitUsersUpdate = typeof deps.emitUsersUpdate === 'function' ? deps.emitUsersUpdate : () => {};
  activeUsers = deps.activeUsers;
  sessionManager = deps.sessionManager || null;

  return {
    fourierParticipants,
    registerSocketHandlers,
    handleSocketDisconnect,
    sanitizeString
  };
}

module.exports = initFourier;
