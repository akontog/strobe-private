const fs = require('fs');
const path = require('path');

const SESSIONS_DIR = path.join(__dirname, '..', 'data', 'sessions');
const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'session-settings.json');
const activeSessions = new Map();
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
    activity: activity || '',
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
  return session.metadata;
}

module.exports = { createSession, appendRecord, endSession, getActiveSession, getActiveSessionForApp, getAppSettings, setAppSetting, getChatMessages };
