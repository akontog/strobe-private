const express = require('express');
const { getAppBySlug } = require('../apps/registry');
const { appendRecord, getActiveSessionForApp, getActiveSession, getCompletedSessionForApp, clearCompletedSessionSnapshots, getActivitySettings, setAppSetting, getChatMessages, getActiveSessionStudents, getConnectedStudents, reportStudentPresence } = require('../services/sessionLogs');
const { requireRole } = require('../middleware/checkRole');

const router = express.Router();
const isSessionApp = (slug) => slug === 'geogebra-collab' || slug === 'vision-collab' || Boolean(getAppBySlug(slug));

router.get('/api/session-logs/active/:app', (req, res) => {
  if (!isSessionApp(req.params.app)) return res.status(404).json({ error: 'Unknown app.' });
  const sessionId = getActiveSessionForApp(req.params.app);
  const session = sessionId ? getActiveSession(sessionId) : null;
  const completedSession = session ? null : getCompletedSessionForApp(req.params.app);
  const settings = session?.metadata || getActivitySettings(req.params.app, req.params.app);
  return res.json({ sessionId, activity: session?.metadata.activity || '', activityId: session?.metadata.activityId || req.params.app, completedSession, chatEnabled: Boolean(settings.chatEnabled), scoreVisible: settings.scoreVisible !== false, feedbackEnabled: Boolean(settings.feedbackEnabled) });
});

router.get('/api/session-logs/active/:app/chat', (req, res) => {
  if (!isSessionApp(req.params.app)) return res.status(404).json({ error: 'Unknown app.' });
  const sessionId = getActiveSessionForApp(req.params.app);
  const session = sessionId ? getActiveSession(sessionId) : null;
  return res.json({ sessionId, enabled: Boolean(session?.metadata.chatEnabled), messages: session?.metadata.chatEnabled ? getChatMessages(sessionId) : [] });
});

router.get('/api/session-logs/active/:app/students', requireRole(['teacher']), (req, res) => {
  if (!isSessionApp(req.params.app)) return res.status(404).json({ error: 'Unknown app.' });
  return res.json({ students: getActiveSessionStudents(req.params.app, `${req.params.app === 'identities-lab' ? 'identities:' : ''}`, String(req.query.activityId || '')) });
});

router.post('/api/session-logs/active/:app/presence', (req, res) => {
  if (!isSessionApp(req.params.app)) return res.status(404).json({ error: 'Unknown app.' });
  reportStudentPresence(req.params.app, req.body?.name);
  return res.json({ ok: true });
});

router.post('/api/session-logs/presence', (req, res) => {
  const app = String(req.body?.app || '');
  if (app && !isSessionApp(app)) return res.status(404).json({ error: 'Unknown app.' });
  reportStudentPresence(app, req.body?.name);
  return res.json({ ok: true });
});

router.get('/api/session-logs/presence', requireRole(['teacher']), (_req, res) => (
  res.json({ students: getConnectedStudents() })
));

router.post('/api/session-logs/completed/clear', requireRole(['teacher']), (_req, res) => {
  clearCompletedSessionSnapshots();
  return res.json({ ok: true });
});

router.post('/api/session-logs/active/:app/chat/settings', requireRole(['teacher']), (req, res) => {
  if (!isSessionApp(req.params.app)) return res.status(404).json({ error: 'Unknown app.' });
  return res.json({ enabled: setAppSetting(req.params.app, 'chatEnabled', req.body?.enabled, req.body?.activityId) });
});

router.post('/api/session-logs/active/:app/score/settings', requireRole(['teacher']), (req, res) => {
  if (!isSessionApp(req.params.app)) return res.status(404).json({ error: 'Unknown app.' });
  return res.json({ visible: setAppSetting(req.params.app, 'scoreVisible', req.body?.visible, req.body?.activityId) });
});

router.post('/api/session-logs/active/:app/feedback/settings', requireRole(['teacher']), (req, res) => {
  if (!isSessionApp(req.params.app)) return res.status(404).json({ error: 'Unknown app.' });
  return res.json({ enabled: setAppSetting(req.params.app, 'feedbackEnabled', req.body?.enabled, req.body?.activityId) });
});

router.post('/api/session-logs/active/:app/chat', (req, res) => {
  if (!isSessionApp(req.params.app)) return res.status(404).json({ error: 'Unknown app.' });
  const sessionId = getActiveSessionForApp(req.params.app);
  const session = sessionId ? getActiveSession(sessionId) : null;
  if (!session || !session.metadata.chatEnabled) return res.status(403).json({ error: 'Chat is disabled.' });
  const message = String(req.body?.message || '').trim().slice(0, 1000);
  if (!message) return res.status(400).json({ error: 'Message is required.' });
  const teacher = ['teacher', 'admin'].includes(req.session?.role) && req.session?.teacherAccount;
  const sender = String(teacher ? req.session.teacherAccount : req.body?.sender || '').trim().slice(0, 80);
  if (!sender) return res.status(400).json({ error: 'Sender is required.' });
  const record = appendRecord(sessionId, 'events.jsonl', {
    event: 'chat.message', activity: session.metadata.activity || req.params.app,
    sender, data: { message }
  });
  return res.status(201).json({ seq: record.seq, t: record.t, sender, message });
});

router.post('/api/session-logs/:sessionId/events', (req, res) => {
  const event = String(req.body && req.body.event || '');
  if (!['activity.input.changed', 'grouping.item.moved', 'activity.tiles.changed', 'student.joined', 'student.left'].includes(event)) {
    return res.status(400).json({ error: 'Unsupported event.' });
  }
  const student = String(req.body && req.body.student || '').trim().slice(0, 80);
  const activity = String(req.body && req.body.activity || '').trim().slice(0, 160);
  const data = req.body && req.body.data && typeof req.body.data === 'object' ? req.body.data : {};
  if (!student || (!activity && !['student.joined', 'student.left'].includes(event))) return res.status(400).json({ error: 'Student and activity are required.' });
  let eventData;
  if (event === 'student.joined' || event === 'student.left') {
    eventData = {};
  } else if (event === 'activity.input.changed') {
    const field = String(data.field || '').trim().slice(0, 120);
    if (!field) return res.status(400).json({ error: 'Field is required.' });
    eventData = { field, value: String(data.value ?? '').slice(0, 500) };
  } else if (event === 'grouping.item.moved') {
    const itemId = String(data.itemId || '').trim().slice(0, 120);
    if (!itemId) return res.status(400).json({ error: 'Item id is required.' });
    eventData = {
      itemId,
      from: String(data.from || '__bank__').slice(0, 120),
      to: String(data.to || '__bank__').slice(0, 120)
    };
  } else {
    eventData = {
      tiles: Array.isArray(data.tiles) ? data.tiles.slice(0, 200).map((tile) => ({
        id: String(tile.id || '').slice(0, 120),
        type: String(tile.type || '').slice(0, 40),
        sign: Number(tile.sign) < 0 ? -1 : 1,
        x: Number(tile.x) || 0,
        y: Number(tile.y) || 0
      })) : []
    };
  }
  const record = appendRecord(req.params.sessionId, 'events.jsonl', {
    event,
    ...(activity ? { activity } : {}),
    student,
    data: eventData
  });
  if (!record) return res.status(404).json({ error: 'Active session not found.' });
  return res.status(201).json({ seq: record.seq, t: record.t });
});

module.exports = router;
