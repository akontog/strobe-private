const express = require('express');
const path = require('path');

const { listActiveSessions, getSessionStats } = require('../services/sessionTracker');

function createAdminRouter(options = {}) {
  const router = express.Router();
  const dashboardViewPath = path.join(__dirname, '..', 'views', 'admin', 'dashboard.html');
  const getRealtimeStats = typeof options.getRealtimeStats === 'function'
    ? options.getRealtimeStats
    : () => ({ connectedSockets: 0, activeUserPoints: 0 });
  const getRealtimeParticipants = typeof options.getRealtimeParticipants === 'function'
    ? options.getRealtimeParticipants
    : () => [];

  router.get('/', (req, res) => {
    res.sendFile(dashboardViewPath);
  });

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

  return router;
}

module.exports = createAdminRouter;
