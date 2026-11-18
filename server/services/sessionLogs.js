const fs = require('fs');
const path = require('path');

const SESSIONS_DIR = path.join(__dirname, '..', 'data', 'sessions');
const ACTIVITY_SETTINGS_DIR = path.join(__dirname, '..', 'data', 'activities', '.settings');
const activeSessions = new Map();
const recentlyEndedSessions = new Map();
const activeStudentSnapshots = new Map();
const activeChatSnapshots = new Map();
const completedStudentSnapshots = new Map();
const connectedStudents = new Map();
const globallyConnectedStudents = new Map();
const PRESENCE_TTL_MS = 15000;
let sequence = 0;

function readAppendedEvents(filename, cache) {
  let stats;
  try {
    stats = fs.statSync(filename);
  } catch {
    return { records: [], reset: false };
  }

  const reset = cache.filename !== filename || stats.size < cache.offset;
  if (reset) {
    cache.filename = filename;
    cache.offset = 0;
    cache.pending = '';
  }
  if (stats.size === cache.offset) return { records: [], reset };

  let descriptor;
  try {
    descriptor = fs.openSync(filename, 'r');
    const chunk = Buffer.alloc(stats.size - cache.offset);
    const bytesRead = fs.readSync(descriptor, chunk, 0, chunk.length, cache.offset);
    cache.offset += bytesRead;
    const lines = `${cache.pending}${chunk.subarray(0, bytesRead).toString('utf8')}`.split(/\r?\n/);
    cache.pending = lines.pop() || '';
    const records = [];
    lines.forEach((line) => {
      if (!line) return;
      try {
        records.push(JSON.parse(line));
      } catch {
        // Ignore malformed or incomplete event lines.
      }
    });
    return { records, reset };
  } catch {
    return { records: [], reset };
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
}

function getActivitySettingsPath(app, activityId) {
  const safeApp = String(app || '').replace(/[^a-z0-9_-]/gi, '_');
  const safeActivityId = String(activityId || '').replace(/[^a-z0-9._-]/gi, '_');
  if (!safeApp || !safeActivityId) return null;
  return path.join(ACTIVITY_SETTINGS_DIR, safeApp, `${safeActivityId}.json`);
}

function readActivitySettings(app, activityId) {
  const settingsPath = getActivitySettingsPath(app, activityId);
  if (!settingsPath) return {};
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {
    return {};
  }
}

function getActivitySettings(app, activityId) {
  const saved = readActivitySettings(app, activityId);
  return { chatEnabled: Boolean(saved.chatEnabled), scoreVisible: saved.scoreVisible !== false, feedbackEnabled: Boolean(saved.feedbackEnabled) };
}

function setAppSetting(app, key, value, requestedActivityId) {
  const activeId = getActiveSessionForApp(app);
  const active = activeId ? getActiveSession(activeId) : null;
  const activityId = String(requestedActivityId || active?.metadata.activityId || app);
  const settingsPath = getActivitySettingsPath(app, activityId);
  const settings = { ...getActivitySettings(app, activityId), [key]: Boolean(value) };
  if (settingsPath) {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
  }
  if (active) {
    active.metadata[key] = Boolean(value);
    active.metadata.activityId = activityId;
    fs.writeFileSync(path.join(active.directory, 'session.json'), `${JSON.stringify(active.metadata, null, 2)}\n`);
    return active.metadata[key];
  }
  return settings[key];
}

function timestampParts(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0'), String(date.getHours()).padStart(2, '0'), String(date.getMinutes()).padStart(2, '0'), String(date.getSeconds()).padStart(2, '0')];
}

function createSession({ app, activity, activityId, teacherId }) {
  completedStudentSnapshots.clear();
  const started = new Date();
  const baseName = `session-${timestampParts(started).join('-')}`;
  let folderName = baseName;
  while (fs.existsSync(path.join(SESSIONS_DIR, folderName))) folderName = `${baseName}-${++sequence}`;
  const directory = path.join(SESSIONS_DIR, folderName);
  fs.mkdirSync(directory, { recursive: true });
  const resolvedActivityId = String(activityId || app);
  const appSettings = getActivitySettings(app, resolvedActivityId);
  const metadata = {
    sessionId: folderName,
    app,
    startedAt: started.toISOString(),
    endedAt: null,
    teacherId,
    students: [],
    studentScores: [],
    activity: activity || app,
    activityId: resolvedActivityId,
    chatEnabled: appSettings.chatEnabled,
    scoreVisible: appSettings.scoreVisible,
    feedbackEnabled: appSettings.feedbackEnabled
  };
  fs.writeFileSync(path.join(directory, 'session.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  fs.writeFileSync(path.join(directory, 'state.jsonl'), '');
  fs.writeFileSync(path.join(directory, 'events.jsonl'), '');
  activeSessions.set(folderName, { directory, metadata, seq: 0 });
  return metadata;
}

function getActiveSession(sessionId) {
  return activeSessions.get(sessionId);
}

function updateSessionActivity(sessionId, activity, activityId) {
  const session = getActiveSession(sessionId);
  if (!session) return null;
  const name = String(activity || '').trim().slice(0, 160);
  if (!name) return session.metadata;
  session.metadata.activity = name;
  const resolvedActivityId = String(activityId || name).trim().slice(0, 160);
  if (session.metadata.activityId !== resolvedActivityId) completedStudentSnapshots.delete(session.metadata.app);
  session.metadata.activityId = resolvedActivityId;
  Object.assign(session.metadata, getActivitySettings(session.metadata.app, resolvedActivityId));
  fs.writeFileSync(path.join(session.directory, 'session.json'), `${JSON.stringify(session.metadata, null, 2)}\n`);
  return session.metadata;
}

function updateSessionStudentScore(sessionId, studentName, score) {
  let session = getActiveSession(sessionId);
  if (!session) {
    const recentlyEnded = recentlyEndedSessions.get(sessionId);
    if (recentlyEnded && recentlyEnded.expiresAt > Date.now()) session = recentlyEnded.session;
    else if (recentlyEnded) recentlyEndedSessions.delete(sessionId);
  }
  const name = String(studentName || '').trim().slice(0, 80);
  const value = Number(score);
  if (!session || !name || !Number.isFinite(value)) return null;
  if (!Array.isArray(session.metadata.studentScores)) session.metadata.studentScores = [];
  if (!session.metadata.students.includes(name)) session.metadata.students.push(name);
  const existing = session.metadata.studentScores.find((entry) => entry.student === name);
  if (existing) existing.score = value;
  else session.metadata.studentScores.push({ student: name, score: value });
  fs.writeFileSync(path.join(session.directory, 'session.json'), `${JSON.stringify(session.metadata, null, 2)}\n`);
  return session.metadata;
}

function getActiveSessionForApp(app) {
  return [...activeSessions.entries()].reverse().find(([, session]) => session.metadata.app === app)?.[0] || null;
}

function getCompletedSessionForApp(app) {
  const completed = completedStudentSnapshots.get(app);
  return completed ? {
    sessionId: completed.sessionId,
    activity: completed.activity,
    activityId: completed.activityId
  } : null;
}

function clearCompletedSessionSnapshots() {
  completedStudentSnapshots.clear();
}

function getChatMessages(sessionId) {
  const session = getActiveSession(sessionId);
  if (!session) return [];
  const filename = path.join(session.directory, 'events.jsonl');
  let cache = activeChatSnapshots.get(sessionId);
  if (!cache) {
    cache = { filename, offset: 0, pending: '', messages: [] };
    activeChatSnapshots.set(sessionId, cache);
  }
  const result = readAppendedEvents(filename, cache);
  if (result.reset) cache.messages = [];
  result.records.forEach((record) => {
    if (record.event === 'chat.message') {
      cache.messages.push({ seq: record.seq, t: record.t, sender: record.sender || '', message: record.data?.message || '' });
    }
  });
  return cache.messages;
}

function getActiveSessionStudents(app, activityPrefix = '', requestedActivityId = '') {
  const sessionId = getActiveSessionForApp(app);
  const session = sessionId ? getActiveSession(sessionId) : null;
  if (!session) {
    const completed = completedStudentSnapshots.get(app);
    const matchingCompleted = completed && (!requestedActivityId || completed.activityId === requestedActivityId)
      ? completed.students.map((student) => ({ ...student, answers: { ...(student.answers || {}) }, sessionId: completed.sessionId }))
      : [];
    return mergeConnectedStudents(app, matchingCompleted);
  }
  const filename = path.join(session.directory, 'events.jsonl');
  const cacheKey = `${sessionId}:${activityPrefix}`;
  let cache = activeStudentSnapshots.get(cacheKey);
  if (!cache) {
    cache = { filename, offset: 0, pending: '', students: new Map() };
    activeStudentSnapshots.set(cacheKey, cache);
  }
  const result = readAppendedEvents(filename, cache);
  if (result.reset) cache.students.clear();
  (session.metadata.students || []).forEach((name) => {
    if (!cache.students.has(name)) cache.students.set(name, { id: name, name, activityId: '', answers: {} });
  });
  (session.metadata.studentScores || []).forEach((entry) => {
    const student = cache.students.get(entry.student);
    if (student && Number.isFinite(Number(entry.score))) student.score = Number(entry.score);
  });

  result.records.forEach((record) => {
    if (!['activity.input.changed', 'activity.tiles.changed', 'grouping.item.moved'].includes(record.event) || !record.student) return;
    if (activityPrefix && !String(record.activity || '').startsWith(activityPrefix)) return;
    const student = cache.students.get(record.student);
    if (!student) return;
    const activityId = String(record.activity || '').split(':')[1] || '';
    student.activityId = activityId;
    if (!activityId) return;
    student.answers[activityId] ||= {};
    if (record.event === 'activity.tiles.changed') {
      student.answers[activityId].tiles = Array.isArray(record.data?.tiles) ? record.data.tiles : [];
      return;
    }
    if (record.event === 'grouping.item.moved') {
      const itemId = String(record.data?.itemId || '').trim();
      if (itemId) student.answers[activityId][itemId] = String(record.data?.to || '');
      return;
    }
    const field = String(record.data?.field || '').trim();
    if (field) student.answers[activityId][field] = String(record.data?.value ?? '');
  });

  return mergeConnectedStudents(app, [...cache.students.values()].map((student) => ({ ...student, sessionId })));
}

function mergeConnectedStudents(app, students) {
  const now = Date.now();
  let presence = connectedStudents.get(app);
  if (!presence) {
    presence = new Map();
    connectedStudents.set(app, presence);
  }
  presence.forEach((lastSeen, name) => {
    if (now - lastSeen > PRESENCE_TTL_MS) presence.delete(name);
  });
  globallyConnectedStudents.forEach((entry, name) => {
    if (now - entry.lastSeenAt > PRESENCE_TTL_MS) globallyConnectedStudents.delete(name);
  });
  const normalizeName = (name) => String(name || '').trim().toLocaleLowerCase();
  const byName = new Map(students.map((student) => [normalizeName(student.name), student]));
  presence.forEach((lastSeen, name) => {
    const key = normalizeName(name);
    const current = byName.get(key);
    byName.set(key, { ...(current || { id: name, name, activityId: '', answers: {} }), isConnected: true });
  });
  globallyConnectedStudents.forEach((entry, name) => {
    const key = normalizeName(name);
    const current = byName.get(key);
    byName.set(key, {
      ...(current || { id: name, name, activityId: '', answers: {} }),
      isConnected: true,
      currentApp: entry.app || ''
    });
  });
  byName.forEach((student, key) => {
    if (!presence.has(student.name) && !globallyConnectedStudents.has(key)) student.isConnected = false;
  });
  return [...byName.values()];
}

function reportStudentPresence(app, studentName) {
  const name = String(studentName || '').trim().slice(0, 80);
  if (!name) return false;
  const normalizedName = name.toLocaleLowerCase();
  globallyConnectedStudents.set(normalizedName, { name, app: String(app || ''), lastSeenAt: Date.now() });
  if (app) {
    if (!connectedStudents.has(app)) connectedStudents.set(app, new Map());
    connectedStudents.get(app).set(name, Date.now());
  }
  return true;
}

function getConnectedStudents() {
  const now = Date.now();
  globallyConnectedStudents.forEach((entry, name) => {
    if (now - entry.lastSeenAt > PRESENCE_TTL_MS) globallyConnectedStudents.delete(name);
  });
  return [...globallyConnectedStudents.values()].map((entry) => ({
    id: entry.name,
    name: entry.name,
    currentApp: entry.app,
    isConnected: true,
    activityId: '',
    answers: {}
  }));
}

function appendRecord(sessionId, filename, record) {
  const session = getActiveSession(sessionId);
  if (!session) return false;
  const entry = {
    seq: ++session.seq,
    t: Date.now(),
    ...(filename === 'events.jsonl' ? {
      activity: record.activity || session.metadata.activity || session.metadata.app || 'unknown'
    } : {}),
    ...record
  };
  fs.appendFileSync(path.join(session.directory, filename), `${JSON.stringify(entry)}\n`);
  if (filename === 'events.jsonl' && entry.event === 'student.joined' && entry.student && !session.metadata.students.includes(entry.student)) {
    session.metadata.students.push(entry.student);
    fs.writeFileSync(path.join(session.directory, 'session.json'), `${JSON.stringify(session.metadata, null, 2)}\n`);
  }
  return entry;
}

function endSession(sessionId) {
  const session = getActiveSession(sessionId);
  if (!session) return null;
  completedStudentSnapshots.set(session.metadata.app, {
    sessionId,
    activity: session.metadata.activity,
    activityId: session.metadata.activityId,
    students: getActiveSessionStudents(session.metadata.app).map((student) => ({ ...student, isConnected: false }))
  });
  session.metadata.endedAt = new Date().toISOString();
  fs.writeFileSync(path.join(session.directory, 'session.json'), `${JSON.stringify(session.metadata, null, 2)}\n`);
  activeSessions.delete(sessionId);
  activeChatSnapshots.delete(sessionId);
  for (const key of activeStudentSnapshots.keys()) {
    if (key.startsWith(`${sessionId}:`)) activeStudentSnapshots.delete(key);
  }
  recentlyEndedSessions.set(sessionId, { session, expiresAt: Date.now() + 5 * 60 * 1000 });
  return session.metadata;
}

module.exports = { createSession, appendRecord, endSession, getActiveSession, getActiveSessionForApp, getCompletedSessionForApp, clearCompletedSessionSnapshots, getActivitySettings, setAppSetting, getChatMessages, getActiveSessionStudents, getConnectedStudents, reportStudentPresence, updateSessionActivity, updateSessionStudentScore };
