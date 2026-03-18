const express = require('express');
const path = require('path');

const { getAppBySlug, listAppsForRole, toPublicApp } = require('../apps/registry');
const { saveActivity, listActivities, getActivity } = require('../services/appActivities');

const router = express.Router();
const dashboardViewPath = path.join(__dirname, '..', 'views', 'teacher', 'dashboard.html');

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

router.get('/', (req, res) => {
  res.sendFile(dashboardViewPath);
});

router.get('/apps', (req, res) => {
  const apps = listAppsForRole('teacher').map((app) => toPublicApp(app, 'teacher'));
  res.json(apps);
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
