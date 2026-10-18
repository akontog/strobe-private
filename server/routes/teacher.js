const express = require('express');

const { getAppBySlug, listAppsForRole, toPublicApp } = require('../apps/registry');
const { saveActivity, listActivities, listAllActivities, getActivity } = require('../services/appActivities');
const { requireRole } = require('../middleware/checkRole');
const { createSession, appendRecord, endSession, updateSessionActivity } = require('../services/sessionLogs');
const { getActiveSelection, setActiveLab, setActiveActivity } = require('../services/classroomSelection');

const router = express.Router();
router.use(requireRole(['teacher']));

const ACTIVITY_RESOURCES = [
  { slug: 'input-grid', title: 'Input Grid' },
  { slug: 'grouping-drag-drop', title: 'Grouping Drag & Drop' },
  { slug: 'algebra-tiles', title: 'Algebra Tiles' },
  { slug: 'collaborative-geogebra', title: 'Collaborative GeoGebra' }
];

function resolveTeacherResource(req, res) {
  const resource = ACTIVITY_RESOURCES.find((item) => item.slug === req.params.slug);
  if (!resource) {
    res.status(404).json({ error: 'Unknown shared resource' });
    return null;
  }
  return resource;
}

router.get('/apps', (req, res) => {
  const apps = listAppsForRole('teacher').map((app) => toPublicApp(app, 'teacher'));
  res.json(apps);
});

router.get('/resources', (req, res) => {
  res.json(ACTIVITY_RESOURCES);
});

router.post('/classroom/selection', (req, res) => {
  if (req.body?.preserve === true) {
    const current = getActiveSelection();
    if (current.app) setActiveLab(current.app, current.roomId);
    return res.json(getActiveSelection());
  }
  const app = req.body && req.body.app;
  const activeLab = setActiveLab(app, req.body && req.body.roomId);
  if (activeLab === null) return res.status(400).json({ error: 'Choose a valid student lab.' });
  if (activeLab === 'activity-runner' && req.body && Object.prototype.hasOwnProperty.call(req.body, 'activity')) {
    setActiveActivity(req.body.activity);
  }
  const selection = getActiveSelection();
  return res.json({ app: activeLab || null, roomId: selection.roomId, activity: selection.activity });
});

router.post('/sessions', (req, res) => {
  const appSlug = String(req.body && req.body.app || '').trim();
  const app = getAppBySlug(appSlug);
  if (appSlug !== 'geogebra-collab' && (!app || !app.roles.includes('teacher'))) {
    return res.status(400).json({ error: 'Choose a valid teacher app.' });
  }
  const session = createSession({
    app: app ? app.slug : appSlug,
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
  const resource = resolveTeacherResource(req, res);
  if (!resource) return;

  res.json(listActivities(resource.slug));
});

router.get('/activities', (req, res) => {
  res.json(listAllActivities());
});

router.post('/activities/:slug', (req, res) => {
  const resource = resolveTeacherResource(req, res);
  if (!resource) return;

  const payload = {
    name: req.body.name,
    config: req.body.config,
    notes: req.body.notes
  };

  const saved = saveActivity(resource.slug, payload, {
    username: String(req.body && req.body.authorName ? req.body.authorName : 'teacher-link').trim() || 'teacher-link',
    role: 'teacher'
  });

  res.status(201).json(saved);
});

router.get('/activities/:slug/:filename', (req, res) => {
  const resource = resolveTeacherResource(req, res);
  if (!resource) return;

  const activity = getActivity(resource.slug, req.params.filename);

  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' });
  }

  return res.json(activity);
});

module.exports = router;
