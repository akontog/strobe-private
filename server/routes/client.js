const express = require('express');

const { listAppsForRole, toPublicApp } = require('../apps/registry');

const router = express.Router();

router.get('/apps', (req, res) => {
  const apps = listAppsForRole('client').map((app) => toPublicApp(app, 'client'));
  res.json(apps);
});

module.exports = router;
