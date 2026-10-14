const express = require('express');

const { getAppBySlug, listAppsForRole, toPublicApp } = require('../apps/registry');
const { saveActivity, listActivities, getActivity } = require('../services/appActivities');
const { requireRole } = require('../middleware/checkRole');
const { createSession, appendRecord, endSession, updateSessionActivity } = require('../services/sessionLogs');
const { setActiveLab } = require('../services/classroomSelection');

const router = express.Router();
router.use(requireRole(['teacher']));

function resolveTeacherApp(req, res) {
  const app = getAppBySlug(req.params.slug);

  if (!app) {
    res.status(404).json({ error: 'Unknown app' });
    return null;
  }

  if (!app.roles.includes('teacher')) {
    res.status(403).json({ error: 'App is not available for teacher role' });
    return null;
  }

  return app;
}

router.get('/apps', (req, res) => {
  const apps = listAppsForRole('teacher').map((app) => toPublicApp(app, 'teacher'));
  res.json(apps);
});

router.post('/classroom/selection', (req, res) => {
  const app = req.body && req.body.app;
  const activeLab = setActiveLab(app);
  if (activeLab === null) return res.status(400).json({ error: 'Choose a valid student lab.' });
  return res.json({ app: activeLab || null });
});

router.post('/sessions', (req, res) => {
  const appSlug = String(req.body && req.body.app || '').trim();
  const app = getAppBySlug(appSlug);
  if (!app || !app.roles.includes('teacher')) return res.status(400).json({ error: 'Choose a valid teacher app.' });
  const session = createSession({
    app: app.slug,
    activity: String(req.body && req.body.activity || '').trim().slice(0, 120),
    teacherId: req.session.teacherAccount
  });
  return res.status(201).json(session);
});

router.post('/sessions/:sessionId/state', (req, res) => {
  const state = req.body && req.body.students;
  if (!state || typeof state !== 'object' || Array.isArray(state)) return res.status(400).json({ error: 'State must contain a students object.' });
  const record = appendRecord(req.params.sessionId, 'state.jsonl', { students: state });
  if (!record) return res.status(404).json({ error: 'Active session not found.' });
  return res.status(201).json({ seq: record.seq, t: record.t });
});

router.post('/sessions/:sessionId/events', (req, res) => {
  const event = String(req.body && req.body.event || '').trim().slice(0, 120);
  if (!event) return res.status(400).json({ error: 'Event name is required.' });
  const record = appendRecord(req.params.sessionId, 'events.jsonl', {
    event,
    ...(req.body.student ? { student: String(req.body.student).slice(0, 120) } : {}),
    ...(req.body.data && typeof req.body.data === 'object' ? { data: req.body.data } : {})
  });
  if (!record) return res.status(404).json({ error: 'Active session not found.' });
  return res.status(201).json({ seq: record.seq, t: record.t });
});

router.post('/sessions/:sessionId/end', (req, res) => {
  const session = endSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Active session not found.' });
  return res.json(session);
});

router.post('/sessions/:sessionId/activity', (req, res) => {
  const session = updateSessionActivity(req.params.sessionId, req.body?.activity);
  if (!session) return res.status(404).json({ error: 'Active session not found.' });
  return res.json(session);
});

router.get('/activities/:slug', (req, res) => {
  const app = resolveTeacherApp(req, res);
  if (!app) return;

  res.json(listActivities(app.slug));
});

router.post('/activities/:slug', (req, res) => {
  const app = resolveTeacherApp(req, res);
  if (!app) return;

  const payload = {
    name: req.body.name,
    config: req.body.config,
    notes: req.body.notes
  };

  const saved = saveActivity(app.slug, payload, {
    username: String(req.body && req.body.authorName ? req.body.authorName : 'teacher-link').trim() || 'teacher-link',
    role: 'teacher'
  });

  res.status(201).json(saved);
});

router.get('/activities/:slug/:filename', (req, res) => {
  const app = resolveTeacherApp(req, res);
  if (!app) return;

  const activity = getActivity(app.slug, req.params.filename);

  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' });
  }

  return res.json(activity);
});

module.exports = router;
