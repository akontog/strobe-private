const express = require('express');

const { listAppsForRole, toPublicApp } = require('../apps/registry');
const { getActiveLab } = require('../services/classroomSelection');

const router = express.Router();

router.get('/apps', (req, res) => {
  const apps = listAppsForRole('client').map((app) => toPublicApp(app, 'client'));
  res.json(apps);
});

router.get('/classroom/selection', (req, res) => {
  res.json({ app: getActiveLab() || null });
});

module.exports = router;
