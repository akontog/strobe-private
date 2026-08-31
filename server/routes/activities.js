const express = require('express');
const fs = require('fs');
const path = require('path');
const { sanitizeLegacyFilename } = require('../utils/helpers');

function createActivitiesRouter({ io }) {
  const router = express.Router();
  const legacyActivitiesDir = path.join(__dirname, '..', 'activities');

  if (!fs.existsSync(legacyActivitiesDir)) {
    fs.mkdirSync(legacyActivitiesDir, { recursive: true });
  }

  let currentActivity = null;

  function getCurrentActivity() {
    return currentActivity;
  }

  function setCurrentActivity(next) {
    currentActivity = next;
    return currentActivity;
  }

  // ── GET /api/activity/current ──
  router.get('/api/activity/current', (req, res) => {
    if (currentActivity) {
      return res.json(currentActivity);
    }
    return res.json({ geometry: [] });
  });

  // ── GET /api/activity/list ──
  router.get('/api/activity/list', (req, res) => {
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
        } catch {
          return { filename: file, name: file, createdAt: null };
        }
      })
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    res.json(files);
  });

  // ── GET /api/activity/load/:filename ──
  router.get('/api/activity/load/:filename', (req, res) => {
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

  // ── POST /api/activity/save ──
  router.post('/api/activity/save', (req, res) => {
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

  // ── Expose currentActivity ref για το socket handler ──
  return { router, getCurrentActivity, setCurrentActivity };
}

module.exports = createActivitiesRouter;