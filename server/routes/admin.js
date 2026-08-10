const express = require('express');

const { listActiveSessions, getSessionStats } = require('../services/sessionTracker');

function createAdminRouter(options = {}) {
  const router = express.Router();
  const getRealtimeStats = typeof options.getRealtimeStats === 'function'
    ? options.getRealtimeStats
    : () => ({ connectedSockets: 0, activeUserPoints: 0 });
  const getRealtimeParticipants = typeof options.getRealtimeParticipants === 'function'
    ? options.getRealtimeParticipants
    : () => [];
  const getCommunicationLog = typeof options.getCommunicationLog === 'function'
    ? options.getCommunicationLog
    : () => [];
  const clearCommunicationLog = typeof options.clearCommunicationLog === 'function'
    ? options.clearCommunicationLog
    : () => 0;
  const getCommunicationCatalog = typeof options.getCommunicationCatalog === 'function'
    ? options.getCommunicationCatalog
    : () => [];

  router.get('/sessions', (req, res) => {
    const authSessions = listActiveSessions();
    const realtimeParticipants = getRealtimeParticipants();
    const sessions = [...authSessions, ...realtimeParticipants];

    const byRole = sessions.reduce((acc, item) => {
      const role = item && item.role ? String(item.role) : 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    res.json({
      sessions,
      authSessions,
      realtimeParticipants,
      sessionStats: {
        total: sessions.length,
        byRole
      },
      authSessionStats: getSessionStats(),
      realtimeStats: getRealtimeStats()
    });
  });

  router.get('/messages', (req, res) => {
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(parsedLimit)
      ? Math.max(20, Math.min(2000, parsedLimit))
      : 300;

    const source = req.query.source ? String(req.query.source).trim() : '';
    const eventQuery = req.query.event ? String(req.query.event).trim() : '';

    const messages = getCommunicationLog({
      limit,
      source,
      event: eventQuery
    });

    res.json({
      messages,
      count: messages.length,
      filters: {
        limit,
        source,
        event: eventQuery
      }
    });
  });

  router.post('/messages/clear', (req, res) => {
    const clearedCount = clearCommunicationLog();

    res.json({
      success: true,
      clearedCount
    });
  });

  router.get('/messages/catalog', (req, res) => {
    const catalog = getCommunicationCatalog();

    res.json({
      catalog,
      count: Array.isArray(catalog) ? catalog.length : 0
    });
  });

  return router;
}

module.exports = createAdminRouter;
