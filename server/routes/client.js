const express = require('express');

const { listAppsForRole, toPublicApp } = require('../apps/registry');
const { getActiveSelection } = require('../services/classroomSelection');

const router = express.Router();

router.get('/apps', (req, res) => {
  const apps = listAppsForRole('client').map((app) => toPublicApp(app, 'client'));
  res.json(apps);
});

router.get('/classroom/selection', (req, res) => {
  const selection = getActiveSelection();
  res.json({ app: selection.app || null, roomId: selection.roomId || '' });
});

module.exports = router;
