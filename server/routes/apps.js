const express = require('express');

const { getAppBySlug, getLaunchPath } = require('../apps/registry');

function createAppsRouter() {
  const router = express.Router();

  function resolveMode(rawMode) {
    return rawMode === 'teacher' ? 'teacher' : 'client';
  }

  router.get('/launch/:slug', (req, res) => {
    const app = getAppBySlug(req.params.slug);

    if (!app) {
      return res.status(404).send('App not found');
    }

    const mode = resolveMode(req.query.mode);

    return res.redirect(getLaunchPath(app, mode));
  });

  router.use('/:slug', (req, res, next) => {
    const app = getAppBySlug(req.params.slug);

    if (!app || app.kind !== 'static') {
      return res.status(404).send('App not found');
    }

    const mode = resolveMode(req.query.mode);

    const requestedPath = String(req.path || '/');
    const requestedFile = requestedPath.replace(/^\/+/, '');

    if (!requestedFile) {
      const entry = mode === 'teacher' ? app.teacherEntry : app.clientEntry;
      const query = app.teacherEntry === app.clientEntry ? `?mode=${mode}` : '';
      return res.redirect(`/apps/${app.slug}/${entry}${query}`);
    }

    const staticMiddleware = express.static(app.staticDir, {
      index: false,
      fallthrough: false
    });

    return staticMiddleware(req, res, next);
  });

  return router;
}

module.exports = createAppsRouter;
