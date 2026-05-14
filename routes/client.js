const express = require('express');
const path = require('path');

const { listAppsForRole, toPublicApp } = require('../apps/registry');

const router = express.Router();
const dashboardViewPath = path.join(__dirname, '..', 'views', 'client', 'dashboard.html');

router.get('/', (req, res) => {
  res.sendFile(dashboardViewPath);
});

router.get('/apps', (req, res) => {
  const apps = listAppsForRole('client').map((app) => toPublicApp(app, 'client'));
  res.json(apps);
});

module.exports = router;
