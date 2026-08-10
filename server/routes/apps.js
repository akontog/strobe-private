const express = require('express');

const { getAppBySlug } = require('../apps/registry');

function createAppsRouter() {
  const router = express.Router();

  function resolveMode(rawMode) {
    return rawMode === 'teacher' ? 'teacher' : 'client';
  }

  router.use('/:slug', (req, res, next) => {
    const app = getAppBySlug(req.params.slug);

    if (!app || app.kind !== 'static') {
      return res.status(404).json({ error: 'App not found' });
    }

    const mode = resolveMode(req.query.mode);

    const requestedPath = String(req.path || '/');
    const requestedFile = requestedPath.replace(/^\/+/, '');

    if (!requestedFile) {
      return next();
    }

    const staticMiddleware = express.static(app.staticDir, {
      index: false,
      fallthrough: true
    });

    return staticMiddleware(req, res, next);
  });

  return router;
}

module.exports = createAppsRouter;
