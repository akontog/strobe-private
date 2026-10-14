const fs = require('fs');
const path = require('path');

const SESSIONS_DIR = path.join(__dirname, '..', 'data', 'sessions');
const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'session-settings.json');
const activeSessions = new Map();
const recentlyEndedSessions = new Map();
let sequence = 0;

function readAppSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function getAppSettings(app) {
  const saved = readAppSettings()[app] || {};
  return { chatEnabled: Boolean(saved.chatEnabled), scoreVisible: saved.scoreVisible !== false, feedbackEnabled: Boolean(saved.feedbackEnabled) };
}

function setAppSetting(app, key, value) {
  const activeId = getActiveSessionForApp(app);
  const active = activeId ? getActiveSession(activeId) : null;
  const settings = readAppSettings();
  settings[app] = { ...getAppSettings(app), [key]: Boolean(value) };
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, `${JSON.stringify(settings, null, 2)}\n`);
  if (active) {
    active.metadata[key] = Boolean(value);
    fs.writeFileSync(path.join(active.directory, 'session.json'), `${JSON.stringify(active.metadata, null, 2)}\n`);
    return active.metadata[key];
  }
  return settings[app][key];
}

function timestampParts(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0'), String(date.getHours()).padStart(2, '0'), String(date.getMinutes()).padStart(2, '0'), String(date.getSeconds()).padStart(2, '0')];
}

function createSession({ app, activity, teacherId }) {
  const started = new Date();
  const baseName = `session-${timestampParts(started).join('-')}`;
  let folderName = baseName;
  while (fs.existsSync(path.join(SESSIONS_DIR, folderName))) folderName = `${baseName}-${++sequence}`;
  const directory = path.join(SESSIONS_DIR, folderName);
  fs.mkdirSync(directory, { recursive: true });
  const appSettings = getAppSettings(app);
  const metadata = {
    sessionId: folderName,
    app,
    startedAt: started.toISOString(),
    endedAt: null,
    teacherId,
    students: [],
    studentScores: [],
    activity: activity || app,
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

function updateSessionActivity(sessionId, activity) {
  const session = getActiveSession(sessionId);
  if (!session) return null;
  const name = String(activity || '').trim().slice(0, 160);
  if (!name) return session.metadata;
  session.metadata.activity = name;
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

function getChatMessages(sessionId) {
  const session = getActiveSession(sessionId);
  if (!session) return [];
  const filename = path.join(session.directory, 'events.jsonl');
  return fs.readFileSync(filename, 'utf8').split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try {
      const record = JSON.parse(line);
      if (record.event !== 'chat.message') return [];
      return [{ seq: record.seq, t: record.t, sender: record.sender || '', message: record.data?.message || '' }];
    } catch {
      return [];
    }
  });
}

function getActiveSessionStudents(app, activityPrefix = '') {
  const sessionId = getActiveSessionForApp(app);
  const session = sessionId ? getActiveSession(sessionId) : null;
  if (!session) return [];

  const students = new Map((session.metadata.students || []).map((name) => [name, {
    id: name,
    name,
    activityId: '',
    answers: {}
  }]));
  const filename = path.join(session.directory, 'events.jsonl');

  fs.readFileSync(filename, 'utf8').split(/\r?\n/).filter(Boolean).forEach((line) => {
    try {
      const record = JSON.parse(line);
      if (record.event !== 'activity.input.changed' || !record.student) return;
      if (activityPrefix && !String(record.activity || '').startsWith(activityPrefix)) return;

      const student = students.get(record.student);
      if (!student) return;
      const activityId = String(record.activity || '').split(':')[1] || '';
      student.activityId = activityId;
      const field = String(record.data?.field || '').trim();
      if (!field || !activityId) return;
      student.answers[activityId] ||= {};
      student.answers[activityId][field] = String(record.data?.value ?? '');
    } catch {
      // Ignore malformed event records and keep the remaining student data.
    }
  });

  return [...students.values()];
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
  session.metadata.endedAt = new Date().toISOString();
  fs.writeFileSync(path.join(session.directory, 'session.json'), `${JSON.stringify(session.metadata, null, 2)}\n`);
  activeSessions.delete(sessionId);
  recentlyEndedSessions.set(sessionId, { session, expiresAt: Date.now() + 5 * 60 * 1000 });
  return session.metadata;
}

module.exports = { createSession, appendRecord, endSession, getActiveSession, getActiveSessionForApp, getAppSettings, setAppSetting, getChatMessages, getActiveSessionStudents, updateSessionActivity, updateSessionStudentScore };
